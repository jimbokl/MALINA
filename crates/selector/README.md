# MALINA selector

Small Rust engine compiled to WebAssembly for the static site. It accepts the
`schema_version: 1` JSON produced by `cargo run --manifest-path crates/catalog_tool/Cargo.toml -- export-public`. The selector
only returns a cultivar when that public snapshot contains a reviewed
recommendation for the exact selected region. Rules with nonempty or unknown
`conditions_json` are ignored until a typed evaluator exists.

```sh
cargo test --manifest-path crates/selector/Cargo.toml
wasm-pack build crates/selector --target web --release --out-dir pkg
```

Browser integration after publishing `pkg/` and the catalog JSON at stable URLs:

```js
import init, { select_varieties } from './pkg/malina_selector.js';

await init();
const catalog = await (await fetch('./catalog.json')).text();
const result = JSON.parse(select_varieties(
  catalog,
  JSON.stringify({ region_code: 'kaliningrad-oblast', crop_slug: 'raspberry' }),
));
// Render result.matches with rationale, limitations and source_key. Show an
// honest empty state when total === 0 and an error state when result.error exists.
```

Output on success: `{schema_version, region_code, total, matches}`. Each match
has `{slug, canonical_name, crop_slug, reasons}`; each reason has
`{rule_id, rationale, limitations, source_key}`. Error output includes
`error: {code, message}` and an empty `matches` array.
