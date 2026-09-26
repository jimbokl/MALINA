//! Anonymous, idempotent cultivar recommendations (ADR 0007).
use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
    time::{Duration, Instant},
};

use anyhow::Result;
use axum::{extract::State, http::StatusCode, Extension, Json};
use rusqlite::{params, OptionalExtension, TransactionBehavior};
use serde::Deserialize;
use serde_json::{json, Value};
use sha2::{Digest, Sha256};

use crate::{open_db, server_error, AppState};

type ApiError = (StatusCode, Json<Value>);
const POST_LIMIT: u32 = 30;
const WINDOW: Duration = Duration::from_secs(60);
const MAX_TRACKED_VOTERS: usize = 4096;

#[derive(Clone, Default)]
pub(crate) struct VoteLimiter(Arc<Mutex<HashMap<String, (Instant, u32)>>>);

impl VoteLimiter {
    fn check_at(&self, hash: &str, now: Instant) -> Result<(), ApiError> {
        let mut entries = self.0.lock().map_err(|_| server_error())?;
        if let Some((started, count)) = entries.get_mut(hash) {
            if now.duration_since(*started) >= WINDOW {
                *started = now;
                *count = 0;
            }
            if *count >= POST_LIMIT {
                return Err(rate_error());
            }
            *count += 1;
            return Ok(());
        }
        entries.retain(|_, (started, _)| now.duration_since(*started) < WINDOW);
        if entries.len() >= MAX_TRACKED_VOTERS {
            return Err(rate_error());
        }
        entries.insert(hash.to_owned(), (now, 1));
        Ok(())
    }
}

fn rate_error() -> ApiError {
    (
        StatusCode::TOO_MANY_REQUESTS,
        Json(json!({"error": "Слишком много запросов. Повторите через минуту."})),
    )
}

// The token is deliberately not Debug, serialized, echoed, or included in logs.
#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct VoteInput {
    cultivar_slug: String,
    voter_token: String,
    recommended: bool,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub(crate) struct StateInput {
    voter_token: String,
}

fn voter_hash(token: &str) -> Result<String, ApiError> {
    if token.len() != 64 || !token.bytes().all(|byte| byte.is_ascii_hexdigit()) {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Не удалось проверить ключ голосования."})),
        ));
    }
    Ok(format!(
        "{:x}",
        Sha256::digest(token.to_ascii_lowercase().as_bytes())
    ))
}

pub(crate) async fn list(State(state): State<AppState>) -> Result<Json<Value>, ApiError> {
    let rows = tokio::task::spawn_blocking(move || -> Result<Value> {
        let mut conn = open_db(&state.db_path)?;
        let tx = conn.transaction()?;
        let votes = tx
            .prepare("SELECT cultivar_slug, count FROM public_cultivar_votes ORDER BY cultivar_slug")?
            .query_map([], |row| {
                Ok(json!({"cultivar_slug": row.get::<_, String>(0)?, "count": row.get::<_, i64>(1)?}))
            })?
            .collect::<rusqlite::Result<Vec<_>>>()?;
        let as_of: String = tx.query_row("SELECT strftime('%Y-%m-%dT%H:%M:%SZ', 'now')", [], |r| r.get(0))?;
        tx.commit()?;
        Ok(json!({"votes": votes, "as_of": as_of}))
    })
    .await;
    match rows {
        Ok(Ok(value)) => Ok(Json(value)),
        _ => Err(server_error()),
    }
}

pub(crate) async fn submit(
    State(state): State<AppState>,
    Extension(limiter): Extension<VoteLimiter>,
    Json(input): Json<VoteInput>,
) -> Result<Json<Value>, ApiError> {
    let hash = voter_hash(&input.voter_token)?;
    if input.cultivar_slug.is_empty()
        || input.cultivar_slug.len() > 120
        || !input
            .cultivar_slug
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
    {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(json!({"error": "Некорректный сорт."})),
        ));
    }
    limiter.check_at(&hash, Instant::now())?;
    let slug = input.cultivar_slug;
    let recommended = input.recommended;
    let result = tokio::task::spawn_blocking(move || -> Result<Option<Value>> {
        let mut conn = open_db(&state.db_path)?;
        // Serializes publication check, deduplicated mutation and returned count.
        let tx = conn.transaction_with_behavior(TransactionBehavior::Immediate)?;
        let id: Option<i64> = tx.query_row(
            "SELECT id FROM public_cultivars WHERE slug = ?1", [&slug], |row| row.get(0)
        ).optional()?;
        let Some(id) = id else { return Ok(None) };
        if recommended {
            tx.execute("INSERT INTO cultivar_votes(cultivar_id, voter_hash) VALUES (?1, ?2) ON CONFLICT DO NOTHING", params![id, hash])?;
        } else {
            tx.execute("DELETE FROM cultivar_votes WHERE cultivar_id = ?1 AND voter_hash = ?2", params![id, hash])?;
        }
        let count: i64 = tx.query_row("SELECT count FROM public_cultivar_votes WHERE cultivar_slug = ?1", [&slug], |r| r.get(0))?;
        tx.commit()?;
        Ok(Some(json!({"cultivar_slug": slug, "count": count, "recommended": recommended})))
    }).await;
    match result {
        Ok(Ok(Some(value))) => Ok(Json(value)),
        Ok(Ok(None)) => Err((
            StatusCode::NOT_FOUND,
            Json(json!({"error": "Сорт недоступен для голосования."})),
        )),
        _ => Err(server_error()),
    }
}

pub(crate) async fn state(
    State(state): State<AppState>,
    Extension(limiter): Extension<VoteLimiter>,
    Json(input): Json<StateInput>,
) -> Result<Json<Value>, ApiError> {
    let hash = voter_hash(&input.voter_token)?;
    limiter.check_at(&hash, Instant::now())?;
    let result = tokio::task::spawn_blocking(move || -> Result<Vec<String>> {
        let conn = open_db(&state.db_path)?;
        let mut stmt = conn.prepare(
            "SELECT c.slug FROM cultivar_votes v JOIN public_cultivars c ON c.id = v.cultivar_id WHERE v.voter_hash = ?1 ORDER BY c.slug"
        )?;
        let slugs = stmt.query_map([hash], |r| r.get(0))?.collect::<rusqlite::Result<Vec<_>>>()?;
        Ok(slugs)
    }).await;
    match result {
        Ok(Ok(slugs)) => Ok(Json(json!({"recommended": slugs}))),
        _ => Err(server_error()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{app, Decision, Moderator};
    use async_trait::async_trait;
    use axum::{body::Body, http::Request, Router};
    use http_body_util::BodyExt;
    use rusqlite::Connection;
    use std::{path::PathBuf, sync::Arc};
    use tempfile::TempDir;
    use tokio::sync::Semaphore;
    use tower::ServiceExt;

    struct UnusedModerator;
    #[async_trait]
    impl Moderator for UnusedModerator {
        async fn classify(&self, _: &str, _: Option<&str>) -> Result<Decision> {
            panic!("Voting must never call the review moderator")
        }
        fn model_name(&self) -> &str {
            "unused"
        }
    }

    fn fixture() -> (TempDir, Router, PathBuf) {
        let dir = tempfile::tempdir().unwrap();
        let path = dir.path().join("catalog.sqlite3");
        let conn = Connection::open(&path).unwrap();
        conn.pragma_update(None, "foreign_keys", "ON").unwrap();
        for sql in [
            include_str!("../../../db/migrations/0001_catalog.sql"),
            include_str!("../../../db/migrations/0002_rhs_initial.sql"),
            include_str!("../../../db/migrations/0003_reviews.sql"),
            include_str!("../../../db/migrations/0004_cultivar_names_ru.sql"),
            include_str!("../../../db/migrations/0005_reviews_without_token.sql"),
            include_str!("../../../db/migrations/0006_review_replies.sql"),
            include_str!("../../../db/migrations/0007_review_human_queue.sql"),
            include_str!("../../../db/migrations/0008_commerce_publication.sql"),
            include_str!("../../../db/migrations/0009_cultivar_votes.sql"),
        ] {
            conn.execute_batch(sql).unwrap();
        }
        let router = app(
            AppState {
                db_path: Arc::new(path.clone()),
                moderator: Arc::new(UnusedModerator),
                moderation_slots: Arc::new(Semaphore::new(4)),
            },
            vec![],
        );
        (dir, router, path)
    }

    async fn request(router: &Router, method: &str, uri: &str, body: Value) -> (StatusCode, Value) {
        let response = router
            .clone()
            .oneshot(
                Request::builder()
                    .method(method)
                    .uri(uri)
                    .header("content-type", "application/json")
                    .body(Body::from(body.to_string()))
                    .unwrap(),
            )
            .await
            .unwrap();
        let status = response.status();
        let bytes = response.into_body().collect().await.unwrap().to_bytes();
        (
            status,
            serde_json::from_slice(&bytes)
                .unwrap_or_else(|_| json!({"message": String::from_utf8_lossy(&bytes)})),
        )
    }

    fn vote(token: &str, recommended: bool) -> Value {
        json!({"cultivar_slug": "polka", "voter_token": token, "recommended": recommended})
    }

    #[tokio::test]
    async fn duplicate_concurrent_vote_and_undo_are_idempotent() {
        let (_dir, router, path) = fixture();
        let token = "a".repeat(64);
        let (first, duplicate) = tokio::join!(
            request(&router, "POST", "/api/votes", vote(&token, true)),
            request(
                &router,
                "POST",
                "/api/votes",
                vote(&token.to_uppercase(), true)
            ),
        );
        for response in [first, duplicate] {
            assert_eq!(response.0, StatusCode::OK);
            assert_eq!(
                response.1,
                json!({"cultivar_slug": "polka", "count": 1, "recommended": true})
            );
        }
        let (_, state) = request(
            &router,
            "POST",
            "/api/votes/state",
            json!({"voter_token": token}),
        )
        .await;
        assert_eq!(state, json!({"recommended": ["polka"]}));
        let conn = Connection::open(&path).unwrap();
        let persisted: String = conn
            .query_row("SELECT voter_hash FROM cultivar_votes", [], |r| r.get(0))
            .unwrap();
        assert_eq!(persisted, voter_hash(&token).unwrap());
        assert_ne!(persisted, token);
        for _ in 0..2 {
            let (status, response) =
                request(&router, "POST", "/api/votes", vote(&token, false)).await;
            assert_eq!(status, StatusCode::OK);
            assert_eq!(response["count"], 0);
            assert_eq!(response["recommended"], false);
        }
        let (_, state) = request(
            &router,
            "POST",
            "/api/votes/state",
            json!({"voter_token": token}),
        )
        .await;
        assert_eq!(state, json!({"recommended": []}));
    }

    #[tokio::test]
    async fn totals_include_zeroes_but_only_published_cultivars() {
        let (_dir, router, path) = fixture();
        let token = "c".repeat(64);
        request(&router, "POST", "/api/votes", vote(&token, true)).await;
        let (status, public) = request(&router, "GET", "/api/votes", Value::Null).await;
        assert_eq!(status, StatusCode::OK);
        assert_eq!(
            public["votes"],
            json!([
                {"cultivar_slug":"cambridge-favourite","count":0},
                {"cultivar_slug":"elan","count":0},
                {"cultivar_slug":"joan-j","count":0},
                {"cultivar_slug":"polka","count":1}
            ])
        );
        assert_eq!(public["as_of"].as_str().unwrap().len(), 20);
        assert!(public["as_of"].as_str().unwrap().ends_with('Z'));
        assert!(!public.to_string().contains(&token));
        assert!(!public.to_string().contains(&voter_hash(&token).unwrap()));
        let conn = Connection::open(&path).unwrap();
        conn.execute(
            "UPDATE cultivars SET editorial_status='withdrawn' WHERE slug='polka'",
            [],
        )
        .unwrap();
        assert_eq!(
            request(&router, "POST", "/api/votes", vote(&token, false))
                .await
                .0,
            StatusCode::NOT_FOUND
        );
        let (_, state) = request(
            &router,
            "POST",
            "/api/votes/state",
            json!({"voter_token": token}),
        )
        .await;
        assert_eq!(state, json!({"recommended": []}));
        let (_, public) = request(&router, "GET", "/api/votes", Value::Null).await;
        assert_eq!(public["votes"].as_array().unwrap().len(), 3);
        conn.execute("UPDATE sources SET review_status='rejected'", [])
            .unwrap();
        let (_, public) = request(&router, "GET", "/api/votes", Value::Null).await;
        assert_eq!(public["votes"], json!([]));
        let mut unknown = vote(&token, true);
        unknown["cultivar_slug"] = json!("joan-j");
        assert_eq!(
            request(&router, "POST", "/api/votes", unknown).await.0,
            StatusCode::NOT_FOUND
        );
    }

    #[tokio::test]
    async fn invalid_unknown_and_failed_writes_do_not_report_success() {
        let (_dir, router, path) = fixture();
        for token in ["short".to_string(), "g".repeat(64), "a".repeat(65)] {
            assert_eq!(
                request(&router, "POST", "/api/votes", vote(&token, true))
                    .await
                    .0,
                StatusCode::BAD_REQUEST
            );
            assert_eq!(
                request(
                    &router,
                    "POST",
                    "/api/votes/state",
                    json!({"voter_token": token})
                )
                .await
                .0,
                StatusCode::BAD_REQUEST
            );
        }
        let token = "d".repeat(64);
        let mut unknown = vote(&token, true);
        unknown["cultivar_slug"] = json!("unpublished-unknown");
        assert_eq!(
            request(&router, "POST", "/api/votes", unknown).await.0,
            StatusCode::NOT_FOUND
        );
        let conn = Connection::open(&path).unwrap();
        assert_eq!(
            conn.query_row("SELECT count(*) FROM cultivar_votes", [], |r| r
                .get::<_, i64>(0))
                .unwrap(),
            0
        );
        drop(conn);
        std::fs::remove_file(&path).unwrap();
        let (status, response) = request(&router, "POST", "/api/votes", vote(&token, true)).await;
        assert_eq!(status, StatusCode::SERVICE_UNAVAILABLE);
        assert!(!response.to_string().contains(&token));
        assert!(!response.to_string().contains("recommended"));
    }

    #[tokio::test]
    async fn rate_limit_is_shared_between_state_and_write_routes() {
        let (_dir, router, _path) = fixture();
        let token = "e".repeat(64);
        for _ in 0..POST_LIMIT {
            assert_eq!(
                request(
                    &router,
                    "POST",
                    "/api/votes/state",
                    json!({"voter_token": token})
                )
                .await
                .0,
                StatusCode::OK
            );
        }
        assert_eq!(
            request(&router, "POST", "/api/votes", vote(&token, true))
                .await
                .0,
            StatusCode::TOO_MANY_REQUESTS
        );
        assert_eq!(
            request(&router, "POST", "/api/votes", vote(&"f".repeat(64), true))
                .await
                .0,
            StatusCode::OK
        );
    }

    #[test]
    fn limiter_bounds_memory_and_recovers_after_window() {
        let limiter = VoteLimiter::default();
        let now = Instant::now();
        for index in 0..MAX_TRACKED_VOTERS {
            limiter.check_at(&format!("{index:064x}"), now).unwrap();
        }
        assert_eq!(
            limiter.check_at("new", now).unwrap_err().0,
            StatusCode::TOO_MANY_REQUESTS
        );
        assert_eq!(limiter.0.lock().unwrap().len(), MAX_TRACKED_VOTERS);
        limiter.check_at("new", now + WINDOW).unwrap();
        assert_eq!(limiter.0.lock().unwrap().len(), 1);
    }
}
