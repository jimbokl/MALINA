#!/usr/bin/env python3
"""Convert local research copies to Markdown without publishing source material.

Requires python-docx for DOCX and pdftotext for searchable PDFs. FB2 and EPUB
use the standard library. Legacy DOC and DjVu need conversion or OCR first.
"""

from __future__ import annotations

import argparse
import base64
import posixpath
import re
import subprocess
from html import unescape
from pathlib import Path
from urllib.parse import unquote
from xml.etree import ElementTree as ET
from zipfile import ZipFile


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


def convert_epub(source: Path, destination: Path, title: str) -> dict[str, int]:
    def ancestors(node: ET.Element | None, parents: dict[ET.Element, ET.Element]):
        while node is not None:
            yield node
            node = parents.get(node)

    body: list[str] = []
    sections = 0
    paragraphs = 0
    with ZipFile(source) as archive:
        container = ET.fromstring(archive.read("META-INF/container.xml"))
        rootfile = next(node for node in container.iter() if tag(node) == "rootfile")
        package_path = rootfile.attrib["full-path"]
        package = ET.fromstring(archive.read(package_path))
        base = posixpath.dirname(package_path)
        manifest = {
            node.attrib["id"]: node.attrib["href"]
            for node in package.iter() if tag(node) == "item"
        }
        spine = [node.attrib["idref"] for node in package.iter() if tag(node) == "itemref"]
        for item_id in spine:
            item_path = posixpath.normpath(posixpath.join(base, unquote(manifest[item_id])))
            if not item_path.lower().endswith((".xhtml", ".html", ".htm")):
                continue
            raw_page = archive.read(item_path)
            raw_page = re.sub(
                rb"&([A-Za-z][A-Za-z0-9]+);",
                lambda match: match.group(0) if match.group(1).decode("ascii") in
                {"amp", "lt", "gt", "quot", "apos"} else
                unescape(match.group(0).decode("ascii")).encode("utf-8"),
                raw_page,
            )
            page = ET.fromstring(raw_page)
            document_body = next((node for node in page.iter() if tag(node) == "body"), None)
            if document_body is None:
                continue
            body.extend((f"## Раздел EPUB: {item_path}", ""))
            sections += 1
            parents = {child: parent for parent in document_body.iter() for child in parent}
            blocks = {"p", "li", "tr", "h1", "h2", "h3", "h4", "h5", "h6"}
            extracted = 0
            for node in document_body.iter():
                kind = tag(node).lower()
                if kind not in blocks:
                    continue
                parent = parents.get(node)
                if any(tag(ancestor).lower() in blocks for ancestor in
                       ancestors(parent, parents)):
                    continue
                value = compact(" ".join(node.itertext()))
                if not value:
                    continue
                if kind.startswith("h") and len(kind) == 2 and kind[1].isdigit():
                    value = "#" * min(6, max(3, int(kind[1]) + 2)) + " " + value
                body.extend((value, ""))
                paragraphs += 1
                extracted += len(value)
            if extracted == 0:
                fallback = compact(" ".join(document_body.itertext()))
                if fallback:
                    body.extend((fallback, ""))
                    paragraphs += 1
    write_markdown(
        destination, title, body,
        "Внутренняя исследовательская копия. Автоматическое извлечение EPUB; "
        "разделы указаны по файлам внутри EPUB. Изображения и расположение таблиц "
        "проверяйте в оригинале. Не публиковать полный текст.",
    )
    return {"sections": sections, "paragraphs": paragraphs,
            "characters": len(destination.read_text(encoding="utf-8"))}


def convert_pdf(source: Path, destination: Path, title: str) -> dict[str, int]:
    result = subprocess.run(
        ["pdftotext", "-layout", str(source), "-"],
        check=True, capture_output=True, text=True,
    )
    body: list[str] = []
    pages = [page for page in result.stdout.split("\f") if page.strip()]
    for number, page in enumerate(pages, 1):
        body.extend((f"## Страница файла {number}", "", page.strip(), ""))
    write_markdown(
        destination, title, body,
        "Внутренняя исследовательская копия. Автоматическое извлечение PDF; "
        "таблицы, формулы и номера печатных страниц сверяйте с оригиналом. "
        "Не публиковать полный текст.",
    )
    return {"pages": len(pages),
            "characters": len(destination.read_text(encoding="utf-8"))}


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
    elif args.source.suffix.lower() == ".epub":
        stats = convert_epub(args.source, args.destination, args.title)
    elif args.source.suffix.lower() == ".pdf":
        stats = convert_pdf(args.source, args.destination, args.title)
    else:
        parser.error("Supported inputs: .docx, .fb2, .epub and .pdf")
    print(stats)


if __name__ == "__main__":
    main()
