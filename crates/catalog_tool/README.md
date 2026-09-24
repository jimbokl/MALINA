# Catalog tool

Build-time Rust CLI for the SQLite catalog. The database and unpublished records stay local; the only deployable output is a JSON snapshot assembled from the `public_*` views. This crate does not run on GitHub Pages.

Run from the repository root:

```sh
cargo run --manifest-path crates/catalog_tool/Cargo.toml -- init
cargo run --manifest-path crates/catalog_tool/Cargo.toml -- check
cargo run --manifest-path crates/catalog_tool/Cargo.toml -- export-public --out dist/data/catalog.json
```

`--db PATH` overrides the default `db/local/catalog.sqlite3`; `--migrations DIR` overrides `db/migrations`. Migrations are applied in filename order and their checksums are verified on every check or export. `export-public` writes atomically when `--out` names a file, or prints JSON to stdout by default.

To stage research records, provide one or more CSV files:

```sh
cargo run --manifest-path crates/catalog_tool/Cargo.toml -- import-drafts \
  --sources path/to/sources.csv \
  --cultivars path/to/cultivars.csv \
  --observations path/to/observations.csv
```

Required CSV headers:

| File | Headers |
| --- | --- |
| Sources | `source_key,kind,title,url,reference,accessed_on,rights_note` |
| Cultivars | `crop_slug,slug,canonical_name,identity_source_key` |
| Observations | `cultivar_slug,trait_code,value_text,value_number,value_max,unit,context_text,region_code,source_key` |

Optional extra headers: `author_or_org` for sources, `scientific_name` for cultivars, `observed_on` for observations. Empty cells are allowed where the schema permits them. Imports use one transaction; all new records remain drafts until human review updates their statuses in SQLite. The command never publishes imported claims automatically.

Verify the crate with `cargo test --manifest-path crates/catalog_tool/Cargo.toml` and `cargo clippy --manifest-path crates/catalog_tool/Cargo.toml --all-targets -- -D warnings`.
