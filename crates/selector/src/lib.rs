//! A deliberately small recommendation engine for the public catalog snapshot.
//!
//! The only positive result comes from a reviewed `public_recommendations` row
//! for the exact selected region. Conditions we do not understand are skipped.

use serde::{Deserialize, Serialize};
use serde_json::Value;
use wasm_bindgen::prelude::*;

const SCHEMA_VERSION: u64 = 1;

#[derive(Deserialize)]
struct Catalog {
    schema_version: u64,
    regions: Vec<Region>,
    cultivars: Vec<Cultivar>,
}

#[derive(Deserialize)]
struct Region {
    code: String,
}

#[derive(Deserialize)]
struct Cultivar {
    slug: String,
    canonical_name: String,
    crop_slug: String,
    recommendations: Vec<Recommendation>,
}

#[derive(Deserialize)]
struct Recommendation {
    id: u64,
    region_code: Option<String>,
    conditions_json: String,
    rationale: String,
    limitations: String,
    source_key: String,
    basis_kind: Option<String>,
    basis_source_title: Option<String>,
    basis_source_url: Option<String>,
    basis_source_locator: Option<String>,
    basis_place: Option<String>,
    basis_conditions: Option<String>,
    basis_limitations: Option<String>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct Query {
    region_code: String,
    crop_slug: Option<String>,
}

#[derive(Serialize)]
struct Reason {
    rule_id: u64,
    rationale: String,
    limitations: String,
    basis_kind: String,
    basis_source_title: String,
    basis_source_url: Option<String>,
    basis_source_locator: String,
    basis_place: String,
    basis_conditions: String,
    basis_limitations: String,
}

#[derive(Serialize)]
struct Match {
    slug: String,
    canonical_name: String,
    crop_slug: String,
    reasons: Vec<Reason>,
}

#[derive(Serialize)]
struct Selection {
    schema_version: u64,
    region_code: String,
    total: usize,
    matches: Vec<Match>,
}

#[derive(Serialize)]
struct ApiError {
    code: &'static str,
    message: &'static str,
}

impl ApiError {
    fn new(code: &'static str, message: &'static str) -> Self {
        Self { code, message }
    }
}

/// Select cultivars from the Rust catalog tool's `export-public` schema v1 snapshot.
///
/// Query: `{ "region_code": "kaliningrad-oblast", "crop_slug": "raspberry" }`.
/// `crop_slug` is optional. The output is JSON both on success and error, so it
/// can be used from a static GitHub Pages site without an API server.
#[wasm_bindgen]
pub fn select_varieties(catalog_json: &str, query_json: &str) -> String {
    let response = match select(catalog_json, query_json) {
        Ok(selection) => serde_json::to_value(selection).expect("selection is serializable"),
        Err(error) => serde_json::json!({
            "schema_version": SCHEMA_VERSION,
            "region_code": null,
            "total": 0,
            "matches": [],
            "error": error,
        }),
    };
    serde_json::to_string(&response).expect("response is serializable")
}

fn select(catalog_json: &str, query_json: &str) -> Result<Selection, ApiError> {
    let catalog: Catalog = serde_json::from_str(catalog_json).map_err(|_| {
        ApiError::new(
            "invalid_catalog",
            "Каталог повреждён или содержит неполные записи.",
        )
    })?;
    if catalog.schema_version != SCHEMA_VERSION {
        return Err(ApiError::new(
            "unsupported_schema",
            "Версия каталога не поддерживается.",
        ));
    }
    let query: Query = serde_json::from_str(query_json)
        .map_err(|_| ApiError::new("invalid_query", "Параметры подбора заданы неверно."))?;
    let region_code = query.region_code.trim();
    if region_code.is_empty() {
        return Err(ApiError::new(
            "missing_region",
            "Выберите регион для подбора.",
        ));
    }
    if !catalog
        .regions
        .iter()
        .any(|region| region.code == region_code)
    {
        return Err(ApiError::new(
            "unknown_region",
            "Выбранного региона нет в каталоге.",
        ));
    }
    let crop_slug = query.crop_slug.as_deref().map(str::trim);
    if crop_slug == Some("") {
        return Err(ApiError::new(
            "invalid_query",
            "Параметры подбора заданы неверно.",
        ));
    }

    let mut matches = Vec::new();
    for cultivar in catalog.cultivars {
        validate_cultivar(&cultivar)?;
        if crop_slug.is_some_and(|crop| crop != cultivar.crop_slug) {
            continue;
        }
        let mut reasons = Vec::new();
        for rule in cultivar.recommendations {
            let conditions: Value = serde_json::from_str(&rule.conditions_json).map_err(|_| {
                ApiError::new(
                    "invalid_catalog",
                    "Каталог повреждён или содержит неполные записи.",
                )
            })?;
            // Only a plain empty object means the rule is unconditional. A future
            // typed condition evaluator must be added before conditional rules
            // can produce positive matches.
            if rule.region_code.as_deref() != Some(region_code)
                || !matches!(conditions, Value::Object(ref object) if object.is_empty())
                || !matches!(rule.basis_kind.as_deref(), Some("regional_trial" | "local_field_observation"))
            {
                continue;
            }
            reasons.push(Reason {
                rule_id: rule.id,
                rationale: rule.rationale,
                limitations: rule.limitations,
                basis_kind: rule.basis_kind.unwrap(),
                basis_source_title: rule.basis_source_title.unwrap(),
                basis_source_url: rule.basis_source_url,
                basis_source_locator: rule.basis_source_locator.unwrap(),
                basis_place: rule.basis_place.unwrap(),
                basis_conditions: rule.basis_conditions.unwrap(),
                basis_limitations: rule.basis_limitations.unwrap(),
            });
        }
        if !reasons.is_empty() {
            reasons.sort_by_key(|reason| reason.rule_id);
            matches.push(Match {
                slug: cultivar.slug,
                canonical_name: cultivar.canonical_name,
                crop_slug: cultivar.crop_slug,
                reasons,
            });
        }
    }
    matches.sort_by(|left, right| {
        left.canonical_name
            .to_lowercase()
            .cmp(&right.canonical_name.to_lowercase())
            .then_with(|| left.slug.cmp(&right.slug))
    });
    Ok(Selection {
        schema_version: SCHEMA_VERSION,
        region_code: region_code.to_owned(),
        total: matches.len(),
        matches,
    })
}

fn validate_cultivar(cultivar: &Cultivar) -> Result<(), ApiError> {
    let incomplete = cultivar.slug.trim().is_empty()
        || cultivar.canonical_name.trim().is_empty()
        || cultivar.crop_slug.trim().is_empty()
        || cultivar.recommendations.iter().any(|rule| {
            rule.id == 0
                || rule.rationale.trim().is_empty()
                || rule.limitations.trim().is_empty()
                || rule.source_key.trim().is_empty()
                || (matches!(rule.basis_kind.as_deref(), Some("regional_trial" | "local_field_observation"))
                    && [rule.basis_source_title.as_deref(), rule.basis_source_locator.as_deref(),
                        rule.basis_place.as_deref(), rule.basis_conditions.as_deref(),
                        rule.basis_limitations.as_deref()].iter().any(|value| value.is_none_or(|value| value.trim().is_empty())))
                || rule
                    .region_code
                    .as_deref()
                    .is_some_and(|region| region.trim().is_empty())
        });
    if incomplete {
        return Err(ApiError::new(
            "invalid_catalog",
            "Каталог повреждён или содержит неполные записи.",
        ));
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::select_varieties;
    use serde_json::{json, Value};

    fn catalog() -> Value {
        json!({
            "schema_version": 1,
            "regions": [
                {"code": "kaliningrad-oblast", "name_ru": "Калининградская область"},
                {"code": "moscow-oblast", "name_ru": "Московская область"}
            ],
            "cultivars": [{
                "slug": "test-cultivar",
                "canonical_name": "Тестовый сорт",
                "crop_slug": "raspberry",
                "recommendations": [{
                    "id": 7,
                    "region_code": "kaliningrad-oblast",
                    "conditions_json": "{}",
                    "rationale": "Проверенное основание.",
                    "limitations": "Только при указанных условиях.",
                    "source_key": "reviewed-source",
                    "basis_kind": "regional_trial",
                    "basis_source_title": "Региональное испытание",
                    "basis_source_url": "https://example.org/trial",
                    "basis_source_locator": "таблица 2",
                    "basis_place": "Калининградская область",
                    "basis_conditions": "Открытый грунт",
                    "basis_limitations": "Один участок"
                }]
            }]
        })
    }

    fn output(catalog: Value, query: Value) -> Value {
        serde_json::from_str(&select_varieties(&catalog.to_string(), &query.to_string())).unwrap()
    }

    #[test]
    fn returns_explainable_verified_public_rule() {
        let result = output(catalog(), json!({"region_code": "kaliningrad-oblast"}));
        assert_eq!(result["total"], 1);
        assert_eq!(result["matches"][0]["slug"], "test-cultivar");
        assert_eq!(result["matches"][0]["reasons"][0]["rule_id"], 7);
        assert_eq!(
            result["matches"][0]["reasons"][0]["basis_source_title"],
            "Региональное испытание"
        );
        assert_eq!(
            result["matches"][0]["reasons"][0]["limitations"],
            "Только при указанных условиях."
        );
    }

    #[test]
    fn absent_or_mismatched_rules_do_not_recommend() {
        let no_rules = output(
            catalog_without_rules(),
            json!({"region_code": "kaliningrad-oblast"}),
        );
        assert_eq!(no_rules["total"], 0);
        let other_region = output(catalog(), json!({"region_code": "moscow-oblast"}));
        assert_eq!(other_region["total"], 0);
    }

    #[test]
    fn reference_only_rule_does_not_become_a_regional_recommendation() {
        let mut source = catalog();
        source["cultivars"][0]["recommendations"][0]["basis_kind"] = Value::Null;
        assert_eq!(output(source, json!({"region_code": "kaliningrad-oblast"}))["total"], 0);
    }

    #[test]
    fn unimplemented_conditions_do_not_recommend() {
        let mut source = catalog();
        source["cultivars"][0]["recommendations"][0]["conditions_json"] =
            json!(r#"{"needs_winter_cover":true}"#);
        let result = output(source, json!({"region_code": "kaliningrad-oblast"}));
        assert_eq!(result["total"], 0);
    }

    #[test]
    fn filters_crop_without_creating_claims() {
        let result = output(
            catalog(),
            json!({
                "region_code": "kaliningrad-oblast",
                "crop_slug": "strawberry"
            }),
        );
        assert_eq!(result["total"], 0);
    }

    #[test]
    fn invalid_inputs_have_stable_errors() {
        let mut wrong_version = catalog();
        wrong_version["schema_version"] = json!(2);
        assert_eq!(
            output(wrong_version, json!({"region_code":"kaliningrad-oblast"}))["error"]["code"],
            "unsupported_schema"
        );
        assert_eq!(
            output(catalog(), json!({"region_code":""}))["error"]["code"],
            "missing_region"
        );
        assert_eq!(
            output(catalog(), json!({"region_code":"unknown"}))["error"]["code"],
            "unknown_region"
        );
        assert_eq!(
            output(
                catalog(),
                json!({"region_code":"kaliningrad-oblast","purpose":"fresh"})
            )["error"]["code"],
            "invalid_query"
        );
        assert_eq!(
            output(
                json!({"schema_version":1}),
                json!({"region_code":"kaliningrad-oblast"})
            )["error"]["code"],
            "invalid_catalog"
        );
    }

    #[test]
    fn incomplete_record_is_rejected() {
        let mut source = catalog();
        source["cultivars"][0]["recommendations"][0]
            .as_object_mut()
            .unwrap()
            .remove("source_key");
        let result = output(source, json!({"region_code":"kaliningrad-oblast"}));
        assert_eq!(result["error"]["code"], "invalid_catalog");
        assert_eq!(result["total"], 0);
    }

    fn catalog_without_rules() -> Value {
        let mut source = catalog();
        source["cultivars"][0]["recommendations"] = json!([]);
        source
    }
}
