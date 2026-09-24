#!/usr/bin/env python3
"""Create a private location index for draft thesaurus terms, not definitions."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "knowledge/private/library/manifest.json"
MARKDOWN = ROOT / "knowledge/private/library/markdown"
OUTPUT = ROOT / "knowledge/private/thesaurus/evidence_index.json"
SEED = ROOT / "knowledge/term-seed.json"


def main() -> None:
    sources = json.loads(MANIFEST.read_text(encoding="utf-8"))["sources"]
    terms = json.loads(SEED.read_text(encoding="utf-8"))["terms"]
    index: dict[str, object] = {"schema_version": 1, "status": "candidate", "entries": []}
    for term in terms:
        needle = [term["preferred_label_ru"], *term["aliases_ru"]]
        occurrences: list[dict[str, object]] = []
        for source in sources:
            path = MARKDOWN / f"{source['id']}.md"
            if not path.exists():
                continue
            page: int | None = None
            epub_item: str | None = None
            heading = ""
            source_hits = 0
            for number, line in enumerate(path.read_text(encoding="utf-8").splitlines(), 1):
                match = re.fullmatch(r"## Страница файла (\d+)", line)
                if match:
                    page = int(match.group(1))
                    epub_item = None
                    continue
                match = re.fullmatch(r"## Раздел EPUB: (.+)", line)
                if match:
                    epub_item = match.group(1)
                    page = None
                    continue
                if line.startswith("#"):
                    heading = line.lstrip("# ")[:120]
                if not line or line.startswith("!["):
                    continue
                if any(re.search(r"(?<!\w)" + re.escape(label) + r"(?!\w)", line, re.I) for label in needle):
                    occurrences.append({
                        "source_id": source["id"],
                        "page_in_file": page,
                        "epub_item": epub_item,
                        "markdown_line": number,
                        "section": heading,
                    })
                    source_hits += 1
                    if source_hits >= 8:
                        break
        index["entries"].append({"term_id": term["term_id"], "occurrences": occurrences})
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(index, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Indexed {len(terms)} candidate terms; {sum(len(item['occurrences']) for item in index['entries'])} source locations")


if __name__ == "__main__":
    main()
