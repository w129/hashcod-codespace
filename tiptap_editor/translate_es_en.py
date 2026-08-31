#!/usr/bin/env python3
"""
Spanish → English translator for TipTap — no OpenAI.

Uses the bilingual / fidelity workflow inspired by oomol-lab/epub-translator
(https://github.com/oomol-lab/epub-translator): paragraph segmentation,
complete translation, optional bilingual interleave.

Engines (no API key):
  1. deep-translator → Google Translate (primary)
  2. LibreTranslate public / self-hosted HTTP (optional LIBRETRANSLATE_URL)
  3. Argos Translate offline (if installed)

Reads JSON from stdin: { "text": "...", "mode": "replace"|"bilingual" }
Writes JSON to stdout: { "ok": true, "text": "...", "engine": "..." }
"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path


PROMPT_PATH = Path(__file__).resolve().parent / "epub_translator_prompt" / "translate.jinja"
# Fidelity rules aligned with epub-translator translate.jinja (applied structurally)
FIDELITY_NOTES = (
    "Translate completely; do not omit any part. "
    "Preserve paragraph structure. Do not summarize."
)


def split_paragraphs(text: str) -> list[str]:
    parts: list[str] = []
    buf: list[str] = []
    for line in (text or "").splitlines(keepends=True):
        if line.strip() == "" and buf:
            parts.append("".join(buf).rstrip("\n"))
            buf = []
            parts.append("")
        else:
            buf.append(line)
    if buf:
        parts.append("".join(buf).rstrip("\n"))
    out: list[str] = []
    for p in parts:
        if p == "":
            if out and out[-1] != "":
                out.append("")
        else:
            out.append(p)
    return out if out else [text or ""]


def chunk_for_api(text: str, max_len: int = 4200) -> list[str]:
    text = text or ""
    if len(text) <= max_len:
        return [text]
    chunks: list[str] = []
    buf = ""
    for sentence in text.replace("\r\n", "\n").split("\n"):
        piece = sentence if not buf else buf + "\n" + sentence
        if len(piece) <= max_len:
            buf = piece
            continue
        if buf:
            chunks.append(buf)
        if len(sentence) <= max_len:
            buf = sentence
        else:
            for i in range(0, len(sentence), max_len):
                chunks.append(sentence[i : i + max_len])
            buf = ""
    if buf:
        chunks.append(buf)
    return chunks or [text]


def translate_with_deep_translator(text: str) -> str:
    from deep_translator import GoogleTranslator  # type: ignore

    translator = GoogleTranslator(source="es", target="en")
    out_parts: list[str] = []
    for chunk in split_paragraphs(text):
        if chunk == "":
            out_parts.append("")
            continue
        if not chunk.strip():
            out_parts.append(chunk)
            continue
        pieces = []
        for sub in chunk_for_api(chunk):
            pieces.append(translator.translate(sub) or "")
        out_parts.append("\n".join(pieces).strip())
    return join_paragraph_markers(out_parts)


def translate_with_libretranslate(text: str) -> str:
    base = (os.environ.get("LIBRETRANSLATE_URL") or "https://libretranslate.com").rstrip("/")
    api_key = os.environ.get("LIBRETRANSLATE_API_KEY") or ""
    out_parts: list[str] = []
    for chunk in split_paragraphs(text):
        if chunk == "":
            out_parts.append("")
            continue
        if not chunk.strip():
            out_parts.append(chunk)
            continue
        pieces = []
        for sub in chunk_for_api(chunk, 4000):
            payload = {
                "q": sub,
                "source": "es",
                "target": "en",
                "format": "text",
            }
            if api_key:
                payload["api_key"] = api_key
            data = json.dumps(payload).encode("utf-8")
            req = urllib.request.Request(
                base + "/translate",
                data=data,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=90) as resp:
                body = json.loads(resp.read().decode("utf-8"))
            pieces.append((body.get("translatedText") or "").strip())
        out_parts.append("\n".join(pieces).strip())
    return join_paragraph_markers(out_parts)


def translate_with_argos(text: str) -> str:
    import argostranslate.package  # type: ignore
    import argostranslate.translate  # type: ignore

    installed = argostranslate.translate.get_installed_languages()
    from_lang = next((l for l in installed if l.code == "es"), None)
    to_lang = next((l for l in installed if l.code == "en"), None)
    if from_lang is None or to_lang is None:
        # Try install es→en package once
        argostranslate.package.update_package_index()
        available = argostranslate.package.get_available_packages()
        pkg = next((p for p in available if p.from_code == "es" and p.to_code == "en"), None)
        if pkg is None:
            raise RuntimeError("Argos es→en package not available")
        argostranslate.package.install_from_path(pkg.download())
        installed = argostranslate.translate.get_installed_languages()
        from_lang = next(l for l in installed if l.code == "es")
        to_lang = next(l for l in installed if l.code == "en")
    translation = from_lang.get_translation(to_lang)
    out_parts: list[str] = []
    for chunk in split_paragraphs(text):
        if chunk == "":
            out_parts.append("")
            continue
        out_parts.append((translation.translate(chunk) or "").strip())
    return join_paragraph_markers(out_parts)


def translate_with_google_gtx(text: str) -> str:
    """Unofficial Google Translate endpoint (no API key)."""
    out_parts: list[str] = []
    for chunk in split_paragraphs(text):
        if chunk == "":
            out_parts.append("")
            continue
        if not chunk.strip():
            out_parts.append(chunk)
            continue
        pieces = []
        for sub in chunk_for_api(chunk, 4500):
            qs = urllib.parse.urlencode(
                {
                    "client": "gtx",
                    "sl": "es",
                    "tl": "en",
                    "dt": "t",
                    "q": sub,
                }
            )
            url = "https://translate.googleapis.com/translate_a/single?" + qs
            req = urllib.request.Request(url, headers={"User-Agent": "l8-tiptap-translator/1.0"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = json.loads(resp.read().decode("utf-8"))
            # data[0] is list of [translated, original, ...]
            segs = data[0] if isinstance(data, list) and data else []
            pieces.append("".join(s[0] for s in segs if s and s[0]))
        out_parts.append("\n".join(pieces).strip())
    return join_paragraph_markers(out_parts)


def join_paragraph_markers(parts: list[str]) -> str:
    out_s = ""
    for i, p in enumerate(parts):
        if p == "":
            out_s += "\n\n"
        else:
            if out_s and not out_s.endswith("\n\n"):
                if i > 0 and parts[i - 1] != "":
                    out_s += "\n\n"
            out_s += p
    return out_s.strip()


def bilingual(src: str, eng: str) -> str:
    """APPEND_BLOCK-style bilingual layout (epub-translator SubmitKind.APPEND_BLOCK)."""
    sp = [p for p in split_paragraphs(src) if p != ""]
    ep = [p for p in split_paragraphs(eng) if p != ""]
    if len(sp) == len(ep) and sp:
        blocks = []
        for s, e in zip(sp, ep):
            blocks.append(s)
            blocks.append(e)
        return "\n\n".join(blocks)
    return (src.strip() + "\n\n" + eng.strip()).strip()


def translate_es_en(text: str) -> tuple[str, str]:
    errors: list[str] = []
    engines = [
        ("deep-translator-google", translate_with_deep_translator),
        ("google-gtx", translate_with_google_gtx),
        ("libretranslate", translate_with_libretranslate),
        ("argos", translate_with_argos),
    ]
    for name, fn in engines:
        try:
            eng = (fn(text) or "").strip()
            if eng:
                return eng, name
        except Exception as e:  # noqa: BLE001
            errors.append(f"{name}: {e}")
    raise RuntimeError("; ".join(errors) or "No translation engine available")


def main() -> int:
    try:
        raw = sys.stdin.read()
        body = json.loads(raw or "{}")
        text = str(body.get("text") or "")
        mode = str(body.get("mode") or "replace")
        if not text.strip():
            print(json.dumps({"ok": False, "error": "Empty text"}))
            return 1

        eng, engine = translate_es_en(text)
        if mode == "bilingual":
            final = bilingual(text, eng)
        else:
            final = eng

        print(
            json.dumps(
                {
                    "ok": True,
                    "text": final,
                    "english": eng,
                    "engine": engine,
                    "fidelity": FIDELITY_NOTES,
                    "prompt_ref": str(PROMPT_PATH.name) if PROMPT_PATH.is_file() else None,
                    "source": "https://github.com/oomol-lab/epub-translator",
                    "mode": mode,
                },
                ensure_ascii=False,
            )
        )
        return 0
    except Exception as e:  # noqa: BLE001
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False))
        return 9


if __name__ == "__main__":
    raise SystemExit(main())
