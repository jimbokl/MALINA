#!/usr/bin/env python3
"""Extract a review queue from clearly headed cultivar sections of private books.

Only explicitly transcribed facts below are filled. A matching source phrase is
required at run time and each filled field receives a location in evidence CSV.
The output is private and must not be published or imported as reviewed data.
"""

from __future__ import annotations

import csv
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LIBRARY = ROOT / "knowledge/private/library/markdown"
OUTPUT = ROOT / "knowledge/private/thesaurus"
DASH = "—"
FIELDS = (
    "Название сорта", "Срок созревания", "Средний вес ягоды в граммах",
    "Зимостойкость", "Устойчивость к болезням", "Вкусовая оценка",
)

# (source ID, cultivar, CSV field): (short factual transcription, literal cue).
# The original section and any conditions still need editorial review.
def load_facts() -> dict[tuple[str, str, str], tuple[str, str]]:
    import json

    path = OUTPUT / "field-seed.json"
    records = json.loads(path.read_text(encoding="utf-8"))["facts"]
    return {(item["source_id"], item["cultivar"], item["field"]):
            (item["value"], item["cue"]) for item in records}



def sections(source_id: str, start: str, stop: str, level: str):
    lines = (LIBRARY / f"{source_id}.md").read_text(encoding="utf-8").splitlines()
    first = next(i for i, line in enumerate(lines) if line == start)
    last = next(i for i in range(first + 1, len(lines)) if lines[i] == stop)
    heads = [i for i in range(first + 1, last) if lines[i].startswith(level + " ")]
    for head, end in zip(heads, [*heads[1:], last]):
        raw_name = lines[head][len(level) + 1:].strip()
        name = re.split(r"\s*[,([]", raw_name, maxsplit=1)[0].removeprefix("Сорт ").strip()
        if not name:
            continue
        yield name, head + 1, lines[head + 1:end]


def main() -> None:
    specs = [
        ("kazakov_remontant_russia", "малина", "## СОРТА РЕМОНТАНТНОЙ МАЛИНЫ", "## НОВЫЕ ВОЗМОЖНОСТИ ПРИ ВЫРАЩИВАНИИ РЕМОНТАНТНОЙ МАЛИНЫ", "###"),
        ("govorova_strawberry_2016", "земляника садовая", "## Раздел EPUB: OEBPS/Text/Section0017.xhtml", "## Раздел EPUB: OEBPS/Text/Section0018.xhtml", "######"),
    ]
    rows = []
    evidence = []
    seen = set()
    facts = load_facts()
    used_facts = set()
    for source_id, crop, start, stop, level in specs:
        for name, line_no, body in sections(source_id, start, stop, level):
            key = (source_id, name)
            if key in seen:
                continue
            seen.add(key)
            row = {field: DASH for field in FIELDS}
            row["Название сорта"] = name
            row.update({"Культура": crop, "Источник": source_id,
                        "Строка раздела": line_no, "Статус": "candidate"})
            for field in FIELDS[1:]:
                fact_key = (source_id, name, field)
                if fact_key not in facts:
                    continue
                value, cue = facts[fact_key]
                matches = [line_no + offset for offset, text in enumerate(body, 1)
                           if cue.casefold() in text.casefold()]
                if not matches:
                    raise ValueError(f"Missing evidence for {fact_key}: {cue}")
                row[field] = value
                evidence.append({"Источник": source_id, "Название сорта": name,
                                 "Поле": field, "Значение": value,
                                 "Строка Markdown": matches[0], "Контрольная фраза": cue,
                                 "Статус": "candidate"})
                used_facts.add(fact_key)
            rows.append(row)
    if unused := set(facts) - used_facts:
        raise ValueError(f"Unused fact records: {unused}")
    OUTPUT.mkdir(parents=True, exist_ok=True)
    with (OUTPUT / "cultivar_candidates.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=[*FIELDS, "Культура", "Источник", "Строка раздела", "Статус"])
        writer.writeheader()
        writer.writerows(rows)
    with (OUTPUT / "cultivar_evidence.csv").open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=["Источник", "Название сорта", "Поле", "Значение", "Строка Markdown", "Контрольная фраза", "Статус"])
        writer.writeheader()
        writer.writerows(evidence)
    print(f"{len(rows)} cultivar candidates; {len(evidence)} field citations; private output: {OUTPUT}")


if __name__ == "__main__":
    main()
