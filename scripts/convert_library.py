#!/usr/bin/env python3
"""Convert local research copies to Markdown without publishing source material.

Requires python-docx for DOCX; FB2 uses the standard library. Legacy DOC and
DjVu/PDF need conversion or OCR before this script can handle them.
"""

from __future__ import annotations

import argparse
import base64
import re
from pathlib import Path
from xml.etree import ElementTree as ET


def compact(value: str) -> str:
    return re.sub(r"[ \t]+", " ", value.replace("\u00a0", " ")).strip()


def write_markdown(destination: Path, title: str, body: list[str], note: str) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    contents = [f"# {title}", "", f"> {note}", "", *body]
    destination.write_text("\n".join(contents).rstrip() + "\n", encoding="utf-8")


def convert_docx(source: Path, destination: Path, title: str) -> dict[str, int]:
    from docx import Document

    document = Document(source)
    image_dir = destination.parent / "assets" / destination.stem
    body: list[str] = []
    image_count = 0
    nonempty = 0
    for paragraph in document.paragraphs:
        text = compact(paragraph.text)
        images: list[str] = []
        for run in paragraph.runs:
            for blip in run._element.xpath('.//*[local-name()="blip"]'):
                relation = blip.get("{http://schemas.openxmlformats.org/officeDocument/2006/relationships}embed")
                if not relation:
                    continue
                part = document.part.related_parts.get(relation)
                if part is None:
                    continue
                image_count += 1
                extension = Path(part.partname).suffix or ".bin"
                image_dir.mkdir(parents=True, exist_ok=True)
                filename = f"image-{image_count:03d}{extension}"
                (image_dir / filename).write_bytes(part.blob)
                images.append(f"![Иллюстрация {image_count}](assets/{destination.stem}/{filename})")
        if not text and not images:
            continue
        if text:
            nonempty += 1
            style = paragraph.style.name.lower()
            if style.startswith("heading "):
                level = max(2, min(6, int(style.split()[-1]) + 1))
                rendered = "#" * level + " " + text
            elif (len(text) <= 100 and len(text.split()) <= 12 and
                  sum(char.isalpha() for char in text) >= 8 and text.isupper()):
                rendered = "## " + text
            elif (len(text) <= 80 and sum(char.isalpha() for char in text) >= 4
                  and not text.endswith((".", ",", ":")) and paragraph.runs and all(
                run.bold for run in paragraph.runs if run.text.strip()
            )):
                rendered = "### " + text
            else:
                rendered = text
            body.extend((rendered, ""))
        for image in images:
            body.extend((image, ""))
    write_markdown(
        destination, title, body,
        "Внутренняя исследовательская копия. Автоматическая конвертация DOC → DOCX → Markdown; "
        "структура и иллюстрации требуют сверки с оригиналом. Не публиковать полный текст.",
    )
    return {"paragraphs": nonempty, "images": image_count, "characters": len(destination.read_text(encoding="utf-8"))}


def tag(element: ET.Element) -> str:
    return element.tag.rsplit("}", 1)[-1]


def inline(element: ET.Element) -> str:
    start = element.text or ""
    for child in element:
        nested = inline(child)
        kind = tag(child)
        if kind == "emphasis":
            nested = f"*{nested}*"
        elif kind == "strong":
            nested = f"**{nested}**"
        elif kind == "sub":
            nested = f"<sub>{nested}</sub>"
        elif kind == "sup":
            nested = f"<sup>{nested}</sup>"
        start += nested + (child.tail or "")
    return compact(start)


def convert_fb2(source: Path, destination: Path, title: str) -> dict[str, int]:
    root = ET.parse(source).getroot()
    binaries = {element.get("id"): element for element in root if tag(element) == "binary"}
    image_dir = destination.parent / "assets" / destination.stem
    extracted: dict[str, str] = {}
    body: list[str] = []
    counts = {"paragraphs": 0, "images": 0}

    def visit(element: ET.Element, depth: int = 1) -> None:
        kind = tag(element)
        if kind == "title":
            heading = compact(" ".join(inline(child) for child in element))
            if heading:
                body.extend(("#" * min(6, depth + 1) + " " + heading, ""))
            return
        if kind in ("p", "subtitle", "text-author"):
            value = inline(element)
            if value:
                counts["paragraphs"] += 1
                body.extend((("#" * min(6, depth + 2) + " " if kind == "subtitle" else "") + value, ""))
            return
        if kind == "image":
            href = next((value for key, value in element.attrib.items() if key.endswith("}href")), "")
            identifier = href.removeprefix("#")
            binary = binaries.get(identifier)
            if binary is None:
                body.extend((f"[Иллюстрация отсутствует в FB2: {identifier}]", ""))
                return
            if identifier not in extracted:
                image_dir.mkdir(parents=True, exist_ok=True)
                filename = Path(identifier).name
                (image_dir / filename).write_bytes(base64.b64decode(binary.text or ""))
                extracted[identifier] = filename
            counts["images"] += 1
            body.extend((f"![Иллюстрация](assets/{destination.stem}/{extracted[identifier]})", ""))
            return
        if kind == "empty-line":
            return
        if kind == "section":
            for child in element:
                visit(child, depth + 1 if tag(child) == "section" else depth)
            return
        for child in element:
            visit(child, depth)

    for element in root:
        if tag(element) == "body":
            visit(element)
    write_markdown(
        destination, title, body,
        "Внутренняя исследовательская копия. Автоматическая конвертация FB2 → Markdown; "
        "иерархия и иллюстрации требуют сверки с оригиналом. Не публиковать полный текст.",
    )
    counts["characters"] = len(destination.read_text(encoding="utf-8"))
    return counts


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    parser.add_argument("--title", required=True)
    args = parser.parse_args()
    if args.source.suffix.lower() == ".docx":
        stats = convert_docx(args.source, args.destination, args.title)
    elif args.source.suffix.lower() == ".fb2":
        stats = convert_fb2(args.source, args.destination, args.title)
    else:
        parser.error("Supported inputs: .docx and .fb2")
    print(stats)


if __name__ == "__main__":
    main()
