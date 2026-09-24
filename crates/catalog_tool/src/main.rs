use anyhow::{anyhow, bail, Context, Result};
use rusqlite::types::ValueRef;
use rusqlite::{params, Connection, OptionalExtension, Row};
use serde_json::{json, Map, Number, Value};
use sha2::{Digest, Sha256};
use std::collections::{BTreeMap, HashMap};
use std::env;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};

const MIGRATIONS_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../../db/migrations");
const DEFAULT_DB: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/../../db/local/catalog.sqlite3"
);

type Record = BTreeMap<String, String>;

fn main() {
    if let Err(error) = run(env::args().skip(1)) {
        eprintln!("catalog: {error:#}");
        std::process::exit(1);
    }
}

fn run(args: impl Iterator<Item = String>) -> Result<()> {
    let mut args = args.peekable();
    let command = args.next().ok_or_else(|| anyhow!(usage()))?;
    if command == "--help" || command == "help" {
        println!("{}", usage());
        return Ok(());
    }
    if !["init", "check", "import-drafts", "export-public"].contains(&command.as_str()) {
        bail!("unknown command: {command}\n{}", usage());
    }
    let mut db = PathBuf::from(DEFAULT_DB);
    let mut migrations = PathBuf::from(MIGRATIONS_DIR);
    let mut out = String::from("-");
    let (mut sources, mut cultivars, mut observations) = (None, None, None);
    while let Some(flag) = args.next() {
        let value = args
            .next()
            .ok_or_else(|| anyhow!("missing value for {flag}"))?;
        match flag.as_str() {
            "--db" => db = value.into(),
            "--migrations" => migrations = value.into(),
            "--out" => out = value,
            "--sources" => sources = Some(PathBuf::from(value)),
            "--cultivars" => cultivars = Some(PathBuf::from(value)),
            "--observations" => observations = Some(PathBuf::from(value)),
            _ => bail!("unknown option: {flag}"),
        }
    }
    if command != "init" && !db.is_file() {
        bail!("database does not exist: {}", db.display());
    }
    if command == "init" {
        if let Some(parent) = db.parent() {
            fs::create_dir_all(parent)?;
        }
    }
    let mut connection = Connection::open(&db).with_context(|| format!("open {}", db.display()))?;
    connection.execute_batch("PRAGMA foreign_keys = ON")?;
    match command.as_str() {
        "init" => {
            migrate(&mut connection, &migrations)?;
            println!(
                "{}",
                serde_json::to_string(&check(&connection, &migrations)?)?
            );
        }
        "check" => println!(
            "{}",
            serde_json::to_string(&check(&connection, &migrations)?)?
        ),
        "import-drafts" => {
            check(&connection, &migrations)?;
            let counts = import_drafts(&mut connection, sources, cultivars, observations)?;
            println!("{}", serde_json::to_string(&counts)?);
        }
        "export-public" => {
            let snapshot = public_snapshot(&connection, &migrations)?;
            let json = serde_json::to_string_pretty(&snapshot)?;
            write_output(&out, &json)?;
        }
        _ => unreachable!(),
    }
    Ok(())
}

fn usage() -> &'static str {
    "Usage: malina-catalog-tool <init|check|import-drafts|export-public> [--db PATH] [--migrations DIR] [--sources CSV] [--cultivars CSV] [--observations CSV] [--out PATH|-]"
}

fn migrations(dir: &Path) -> Result<Vec<(String, String, String)>> {
    let mut files = fs::read_dir(dir)
        .with_context(|| format!("read migrations from {}", dir.display()))?
        .map(|entry| entry.map(|entry| entry.path()))
        .collect::<std::io::Result<Vec<_>>>()?;
    files.retain(|path| {
        path.extension().and_then(|extension| extension.to_str()) == Some("sql")
            && path
                .file_stem()
                .and_then(|stem| stem.to_str())
                .is_some_and(|stem| {
                    let bytes = stem.as_bytes();
                    bytes.len() >= 5
                        && bytes[..4].iter().all(u8::is_ascii_digit)
                        && bytes[4] == b'_'
                })
    });
    files.sort();
    if files.is_empty() {
        bail!("no migration files found in {}", dir.display());
    }
    let mut result = Vec::new();
    for file in files {
        let version = file.file_stem().unwrap().to_string_lossy().into_owned();
        let sql = fs::read_to_string(&file)?;
        let checksum = format!("{:x}", Sha256::digest(sql.as_bytes()));
        result.push((version, checksum, sql));
    }
    Ok(result)
}

fn installed_migrations(connection: &Connection) -> Result<BTreeMap<String, String>> {
    let exists: bool = connection.query_row(
        "SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_migrations')",
        [],
        |row| row.get(0),
    )?;
    if !exists {
        return Ok(BTreeMap::new());
    }
    let mut statement = connection.prepare("SELECT version, checksum FROM schema_migrations")?;
    let rows = statement.query_map([], |row| {
        Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
    })?;
    rows.collect::<std::result::Result<BTreeMap<_, _>, _>>()
        .map_err(Into::into)
}

fn migrate(connection: &mut Connection, dir: &Path) -> Result<()> {
    connection.execute_batch("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL) STRICT")?;
    let installed = installed_migrations(connection)?;
    for (version, checksum, sql) in migrations(dir)? {
        if let Some(previous) = installed.get(&version) {
            if previous != &checksum {
                bail!("applied migration changed: {version}");
            }
            continue;
        }
        let transaction = connection.transaction()?;
        transaction
            .execute_batch(&sql)
            .with_context(|| format!("apply migration {version}"))?;
        transaction.execute(
            "INSERT INTO schema_migrations(version, checksum, applied_at) VALUES (?1, ?2, strftime('%Y-%m-%d %H:%M:%S','now'))",
            params![version, checksum],
        )?;
        transaction.commit()?;
        eprintln!("applied {version}");
    }
    Ok(())
}

fn check(connection: &Connection, dir: &Path) -> Result<Value> {
    let installed = installed_migrations(connection)?;
    let expected = migrations(dir)?
        .into_iter()
        .map(|(version, checksum, _)| (version, checksum))
        .collect::<BTreeMap<_, _>>();
    if installed != expected {
        bail!("migration mismatch: installed={installed:?}, expected={expected:?}");
    }
    let integrity: String = connection.query_row("PRAGMA integrity_check", [], |row| row.get(0))?;
    let foreign_key_errors: i64 =
        connection.query_row("SELECT COUNT(*) FROM pragma_foreign_key_check", [], |row| {
            row.get(0)
        })?;
    if integrity != "ok" || foreign_key_errors != 0 {
        bail!(
            "database check failed: integrity={integrity}, foreign_key_errors={foreign_key_errors}"
        );
    }
    Ok(
        json!({"migrations": installed.keys().collect::<Vec<_>>(), "integrity": integrity, "foreign_key_errors": foreign_key_errors}),
    )
}

fn query_objects(connection: &Connection, sql: &str) -> Result<Vec<Map<String, Value>>> {
    let mut statement = connection.prepare(sql)?;
    let names = statement
        .column_names()
        .into_iter()
        .map(ToOwned::to_owned)
        .collect::<Vec<_>>();
    let rows = statement.query_map([], |row| row_to_object(row, &names))?;
    rows.collect::<std::result::Result<Vec<_>, _>>()
        .map_err(Into::into)
}

fn row_to_object(row: &Row<'_>, names: &[String]) -> rusqlite::Result<Map<String, Value>> {
    let mut object = Map::new();
    for (index, name) in names.iter().enumerate() {
        let value = match row.get_ref(index)? {
            ValueRef::Null => Value::Null,
            ValueRef::Integer(value) => json!(value),
            ValueRef::Real(value) => Number::from_f64(value)
                .map(Value::Number)
                .unwrap_or(Value::Null),
            ValueRef::Text(value) => Value::String(String::from_utf8_lossy(value).into_owned()),
            ValueRef::Blob(_) => {
                return Err(rusqlite::Error::InvalidColumnType(
                    index,
                    name.clone(),
                    rusqlite::types::Type::Blob,
                ))
            }
        };
        object.insert(name.clone(), value);
    }
    Ok(object)
}

fn public_snapshot(connection: &Connection, dir: &Path) -> Result<Value> {
    check(connection, dir)?;
    let mut cultivars = query_objects(
        connection,
        "SELECT * FROM public_cultivars ORDER BY crop_slug, canonical_name, id",
    )?;
    let mut by_id = HashMap::new();
    for (index, cultivar) in cultivars.iter_mut().enumerate() {
        let id = cultivar
            .get("id")
            .and_then(Value::as_i64)
            .ok_or_else(|| anyhow!("public_cultivars missing id"))?;
        by_id.insert(id, index);
        for key in [
            "aliases",
            "observations",
            "media",
            "recommendations",
            "offers",
        ] {
            cultivar.insert(key.into(), Value::Array(Vec::new()));
        }
    }
    for (view, key) in [
        ("public_aliases", "aliases"),
        ("public_observations", "observations"),
        ("public_media", "media"),
        ("public_recommendations", "recommendations"),
        ("public_offers", "offers"),
    ] {
        // The identifiers are fixed here; none come from external input.
        for mut item in query_objects(connection, &format!("SELECT * FROM {view} ORDER BY id"))? {
            let id = item.remove("cultivar_id").and_then(|value| value.as_i64());
            if let Some(index) = id.and_then(|id| by_id.get(&id)) {
                cultivars[*index]
                    .get_mut(key)
                    .and_then(Value::as_array_mut)
                    .unwrap()
                    .push(Value::Object(item));
            }
        }
    }
    let generated_at_utc: String = connection.query_row(
        "SELECT strftime('%Y-%m-%dT%H:%M:%S+00:00','now')",
        [],
        |row| row.get(0),
    )?;
    Ok(json!({
        "schema_version": 1,
        "generated_at_utc": generated_at_utc,
        "crops": query_objects(connection, "SELECT slug, name_ru FROM crops ORDER BY id")?,
        "regions": query_objects(connection, "SELECT code, name_ru FROM regions ORDER BY id")?,
        "cultivars": cultivars,
    }))
}

fn write_output(destination: &str, content: &str) -> Result<()> {
    if destination == "-" {
        println!("{content}");
        return Ok(());
    }
    let path = Path::new(destination);
    let parent = path.parent().unwrap_or_else(|| Path::new("."));
    fs::create_dir_all(parent)?;
    let mut temporary = tempfile_path(path);
    while temporary.exists() {
        temporary = tempfile_path(path);
    }
    let result = (|| -> Result<()> {
        let mut file = fs::OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&temporary)?;
        writeln!(file, "{content}")?;
        file.sync_all()?;
        fs::rename(&temporary, path)?;
        Ok(())
    })();
    if result.is_err() {
        let _ = fs::remove_file(&temporary);
    }
    result
}

fn tempfile_path(destination: &Path) -> PathBuf {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nonce = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_nanos();
    destination.with_extension(format!("tmp-{}-{nonce}", std::process::id()))
}

fn csv_rows(path: Option<PathBuf>, required: &[&str]) -> Result<Vec<Record>> {
    let Some(path) = path else {
        return Ok(Vec::new());
    };
    let mut reader = csv::ReaderBuilder::new()
        .flexible(false)
        .from_path(&path)
        .with_context(|| format!("read CSV {}", path.display()))?;
    let headers = reader
        .headers()?
        .iter()
        .map(|header| header.trim_start_matches('\u{feff}').to_string())
        .collect::<Vec<_>>();
    for field in required {
        if !headers.iter().any(|header| header == field) {
            bail!("{}: missing column {field}", path.display());
        }
    }
    let mut rows = Vec::new();
    for (line, item) in reader.records().enumerate() {
        let item = item.with_context(|| format!("{}:{}", path.display(), line + 2))?;
        let row = headers
            .iter()
            .zip(item.iter())
            .map(|(header, value)| (header.clone(), value.trim().to_string()))
            .collect::<Record>();
        if row.values().any(|value| !value.is_empty()) {
            rows.push(row);
        }
    }
    Ok(rows)
}

fn required<'a>(row: &'a Record, field: &str, section: &str) -> Result<&'a str> {
    let value = row.get(field).map(String::as_str).unwrap_or("");
    if value.is_empty() {
        bail!("{section}: {field} is required")
    } else {
        Ok(value)
    }
}

fn optional<'a>(row: &'a Record, field: &str) -> Option<&'a str> {
    row.get(field)
        .map(String::as_str)
        .filter(|value| !value.is_empty())
}

fn id(connection: &Connection, table: &str, column: &str, value: &str) -> Result<i64> {
    // Only fixed table and column names are passed by code below.
    connection
        .query_row(
            &format!("SELECT id FROM {table} WHERE {column} = ?1"),
            [value],
            |row| row.get(0),
        )
        .optional()?
        .ok_or_else(|| anyhow!("unknown {table}.{column}: {value}"))
}

fn number(row: &Record, field: &str) -> Result<Option<f64>> {
    let Some(value) = optional(row, field) else {
        return Ok(None);
    };
    let parsed: f64 = value
        .parse()
        .with_context(|| format!("invalid {field}: {value}"))?;
    if !parsed.is_finite() || parsed.abs() >= 1e100 {
        bail!("invalid {field}: {value}");
    }
    Ok(Some(parsed))
}

fn import_drafts(
    connection: &mut Connection,
    sources_path: Option<PathBuf>,
    cultivars_path: Option<PathBuf>,
    observations_path: Option<PathBuf>,
) -> Result<Value> {
    let sources = csv_rows(
        sources_path,
        &[
            "source_key",
            "kind",
            "title",
            "url",
            "reference",
            "accessed_on",
            "rights_note",
        ],
    )?;
    let cultivars = csv_rows(
        cultivars_path,
        &["crop_slug", "slug", "canonical_name", "identity_source_key"],
    )?;
    let observations = csv_rows(
        observations_path,
        &[
            "cultivar_slug",
            "trait_code",
            "value_text",
            "value_number",
            "value_max",
            "unit",
            "context_text",
            "region_code",
            "source_key",
        ],
    )?;
    if sources.is_empty() && cultivars.is_empty() && observations.is_empty() {
        bail!("provide at least one non-empty CSV");
    }
    let transaction = connection.transaction()?;
    for row in &sources {
        if optional(row, "url").is_none() && optional(row, "reference").is_none() {
            bail!("source: url or reference is required");
        }
        transaction.execute(
            "INSERT INTO sources(source_key, kind, title, author_or_org, url, reference, accessed_on, rights_note) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
            params![required(row, "source_key", "source")?, required(row, "kind", "source")?, required(row, "title", "source")?, optional(row, "author_or_org"), optional(row, "url"), optional(row, "reference"), required(row, "accessed_on", "source")?, required(row, "rights_note", "source")?],
        )?;
    }
    for row in &cultivars {
        transaction.execute(
            "INSERT INTO cultivars(crop_id, slug, canonical_name, scientific_name, identity_source_id) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![id(&transaction, "crops", "slug", required(row, "crop_slug", "cultivar")?)?, required(row, "slug", "cultivar")?, required(row, "canonical_name", "cultivar")?, optional(row, "scientific_name"), id(&transaction, "sources", "source_key", required(row, "identity_source_key", "cultivar")?)?],
        )?;
    }
    for row in &observations {
        let region = optional(row, "region_code")
            .map(|code| id(&transaction, "regions", "code", code))
            .transpose()?;
        transaction.execute(
            "INSERT INTO trait_observations(cultivar_id, trait_code, value_text, value_number, value_max, unit, context_text, region_id, source_id, observed_on) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![id(&transaction, "cultivars", "slug", required(row, "cultivar_slug", "observation")?)?, required(row, "trait_code", "observation")?, optional(row, "value_text"), number(row, "value_number")?, number(row, "value_max")?, optional(row, "unit"), required(row, "context_text", "observation")?, region, id(&transaction, "sources", "source_key", required(row, "source_key", "observation")?)?, optional(row, "observed_on")],
        )?;
    }
    transaction.commit()?;
    Ok(
        json!({"sources": sources.len(), "cultivars": cultivars.len(), "observations": observations.len()}),
    )
}

#[cfg(test)]
mod tests {
    use super::*;

    fn setup() -> (tempfile::TempDir, Connection) {
        let temp = tempfile::tempdir().unwrap();
        let mut connection = Connection::open(temp.path().join("catalog.sqlite3")).unwrap();
        connection
            .execute_batch("PRAGMA foreign_keys = ON")
            .unwrap();
        migrate(&mut connection, Path::new(MIGRATIONS_DIR)).unwrap();
        (temp, connection)
    }

    #[test]
    fn migration_is_idempotent_and_export_has_contract() {
        let (_temp, mut connection) = setup();
        migrate(&mut connection, Path::new(MIGRATIONS_DIR)).unwrap();
        let snapshot = public_snapshot(&connection, Path::new(MIGRATIONS_DIR)).unwrap();
        assert_eq!(snapshot["schema_version"], 1);
        assert!(snapshot["cultivars"].is_array());
        assert_eq!(snapshot["crops"].as_array().unwrap().len(), 2);
    }

    #[test]
    fn publication_gates_preserve_distinct_observations() {
        let (_temp, connection) = setup();
        let baseline = public_snapshot(&connection, Path::new(MIGRATIONS_DIR)).unwrap()
            ["cultivars"]
            .as_array()
            .unwrap()
            .len();
        connection.execute("INSERT INTO sources(source_key,kind,title,reference,accessed_on,rights_note) VALUES ('source','book','Test source','ISBN test','2026-09-24','test')", []).unwrap();
        let source_id = connection.last_insert_rowid();
        connection.execute("INSERT INTO cultivars(crop_id,slug,canonical_name,identity_source_id) VALUES (1,'test','Test cultivar',?1)", [source_id]).unwrap();
        let cultivar_id = connection.last_insert_rowid();
        connection.execute("INSERT INTO trait_observations(cultivar_id,trait_code,value_text,context_text,source_id) VALUES (?1,'flavor','sweet','first',?2)", params![cultivar_id, source_id]).unwrap();
        connection.execute("INSERT INTO trait_observations(cultivar_id,trait_code,value_text,context_text,source_id) VALUES (?1,'flavor','sour','second',?2)", params![cultivar_id, source_id]).unwrap();
        assert_eq!(
            public_snapshot(&connection, Path::new(MIGRATIONS_DIR)).unwrap()["cultivars"]
                .as_array()
                .unwrap()
                .len(),
            baseline
        );
        connection.execute("UPDATE sources SET review_status='verified', reviewed_by='tester', reviewed_at='2026-09-24 00:00:00' WHERE id=?1", [source_id]).unwrap();
        connection.execute("UPDATE cultivars SET editorial_status='published', reviewed_by='tester', reviewed_at='2026-09-24 00:00:00', published_at='2026-09-24 00:00:00' WHERE id=?1", [cultivar_id]).unwrap();
        let snapshot = public_snapshot(&connection, Path::new(MIGRATIONS_DIR)).unwrap();
        assert_eq!(
            snapshot["cultivars"].as_array().unwrap().len(),
            baseline + 1
        );
        let cultivar = snapshot["cultivars"]
            .as_array()
            .unwrap()
            .iter()
            .find(|item| item["slug"] == "test")
            .unwrap();
        assert_eq!(cultivar["observations"].as_array().unwrap().len(), 0);
        connection.execute("UPDATE trait_observations SET review_status='verified', reviewed_by='tester', reviewed_at='2026-09-24 00:00:00' WHERE cultivar_id=?1", [cultivar_id]).unwrap();
        let snapshot = public_snapshot(&connection, Path::new(MIGRATIONS_DIR)).unwrap();
        let cultivar = snapshot["cultivars"]
            .as_array()
            .unwrap()
            .iter()
            .find(|item| item["slug"] == "test")
            .unwrap();
        assert_eq!(cultivar["observations"].as_array().unwrap().len(), 2);
    }

    #[test]
    fn failed_import_rolls_back_every_row() {
        let (temp, mut connection) = setup();
        let baseline: i64 = connection
            .query_row("SELECT count(*) FROM sources", [], |row| row.get(0))
            .unwrap();
        let source_csv = temp.path().join("sources.csv");
        fs::write(&source_csv, "source_key,kind,title,url,reference,accessed_on,rights_note\ns1,book,Source,,ISBN test,2026-09-24,internal\n").unwrap();
        let cultivar_csv = temp.path().join("cultivars.csv");
        fs::write(
            &cultivar_csv,
            "crop_slug,slug,canonical_name,identity_source_key\nraspberry,bad,Bad,missing\n",
        )
        .unwrap();
        assert!(
            import_drafts(&mut connection, Some(source_csv), Some(cultivar_csv), None).is_err()
        );
        let count: i64 = connection
            .query_row("SELECT count(*) FROM sources", [], |row| row.get(0))
            .unwrap();
        assert_eq!(count, baseline);
    }

    #[test]
    fn successful_csv_import_keeps_new_facts_in_draft() {
        let (temp, mut connection) = setup();
        let source_csv = temp.path().join("sources.csv");
        fs::write(
            &source_csv,
            "source_key,kind,title,url,reference,accessed_on,rights_note\nnew-source,book,New source,,ISBN test,2026-09-24,internal\n",
        )
        .unwrap();
        let cultivar_csv = temp.path().join("cultivars.csv");
        fs::write(
            &cultivar_csv,
            "crop_slug,slug,canonical_name,identity_source_key\nraspberry,new-test,New test,new-source\n",
        )
        .unwrap();
        let observation_csv = temp.path().join("observations.csv");
        fs::write(
            &observation_csv,
            "cultivar_slug,trait_code,value_text,value_number,value_max,unit,context_text,region_code,source_key\nnew-test,flavor,sweet,,,,research context,,new-source\n",
        )
        .unwrap();
        let counts = import_drafts(
            &mut connection,
            Some(source_csv),
            Some(cultivar_csv),
            Some(observation_csv),
        )
        .unwrap();
        assert_eq!(
            counts,
            json!({"sources": 1, "cultivars": 1, "observations": 1})
        );
        let draft: String = connection
            .query_row(
                "SELECT editorial_status FROM cultivars WHERE slug='new-test'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(draft, "draft");
        let snapshot = public_snapshot(&connection, Path::new(MIGRATIONS_DIR)).unwrap();
        assert!(snapshot["cultivars"]
            .as_array()
            .unwrap()
            .iter()
            .all(|item| item["slug"] != "new-test"));
    }

    #[test]
    fn detects_modified_migration_file() {
        let (temp, connection) = setup();
        let migrations_dir = temp.path().join("migrations");
        fs::create_dir(&migrations_dir).unwrap();
        for (version, _checksum, sql) in migrations(Path::new(MIGRATIONS_DIR)).unwrap() {
            fs::write(migrations_dir.join(format!("{version}.sql")), sql).unwrap();
        }
        assert!(check(&connection, &migrations_dir).is_ok());
        let first = fs::read_dir(&migrations_dir)
            .unwrap()
            .next()
            .unwrap()
            .unwrap()
            .path();
        fs::OpenOptions::new()
            .append(true)
            .open(first)
            .unwrap()
            .write_all(b"\n-- tampered\n")
            .unwrap();
        assert!(check(&connection, &migrations_dir).is_err());
    }
}
