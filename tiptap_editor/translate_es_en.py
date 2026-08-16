#!/usr/bin/env python3
"""
Spanish → English translator for TipTap, using oomol-lab/epub-translator prompts + LLM.

https://github.com/oomol-lab/epub-translator

Reads JSON from stdin: { "text": "...", "mode": "replace"|"bilingual" }
Writes JSON to stdout: { "ok": true, "text": "...", "engine": "epub-translator" }
"""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path


PROMPT_PATH = Path(__file__).resolve().parent / "epub_translator_prompt" / "translate.jinja"
USER_RULES = (
    "Source language is Spanish (es-ES / es-MX accepted). "
    "Target language is English. "
    "Produce a complete, accurate, natural English translation with 100% meaning fidelity. "
    "Preserve paragraph breaks exactly. "
    "Do not leave any Spanish untranslated unless it is a proper name that must stay."
)


def render_system_prompt(target_language: str = "English") -> str:
    raw = PROMPT_PATH.read_text(encoding="utf-8")
    # Minimal jinja-like substitution (no dependency on jinja2 if package missing)
    out = raw.replace("{{ target_language }}", target_language)
    # Expand user_prompt block
    if "{% if user_prompt" in out:
        block = (
            "User may provide additional requirements in <rules> tags before the source text. "
            "Follow them, but prioritize the rules above if conflicts arise.\n\n"
            f"<rules>\n{USER_RULES}\n</rules>\n"
        )
        # Strip jinja if/endif
        import re

        out = re.sub(
            r"\{%-?\s*if user_prompt\s*-?%\}.*?\{%-?\s*endif\s*-?%\}",
            block,
            out,
            flags=re.S,
        )
        out = out.replace("{{ user_prompt }}", USER_RULES)
    return out.strip() + "\n"


def split_paragraphs(text: str) -> list[str]:
    parts = []
    buf: list[str] = []
    for line in (text or "").splitlines(keepends=True):
        if line.strip() == "" and buf:
            parts.append("".join(buf).rstrip("\n"))
            buf = []
            parts.append("")  # blank separator marker
        else:
            buf.append(line)
    if buf:
        parts.append("".join(buf).rstrip("\n"))
    # Collapse consecutive empty markers
    out: list[str] = []
    for p in parts:
        if p == "":
            if out and out[-1] != "":
                out.append("")
        else:
            out.append(p)
    return out if out else [text or ""]


def translate_with_epub_translator(text: str) -> str:
    from epub_translator import LLM  # type: ignore
    from epub_translator.llm.types import Message, MessageRole  # type: ignore

    key = os.environ.get("OPENAI_API_KEY") or os.environ.get("EPUB_TRANSLATOR_API_KEY") or ""
    url = os.environ.get("OPENAI_API_BASE") or os.environ.get("EPUB_TRANSLATOR_URL") or "https://api.openai.com/v1"
    model = os.environ.get("OPENAI_CHAT_MODEL") or os.environ.get("EPUB_TRANSLATOR_MODEL") or "gpt-4o"
    encoding = os.environ.get("EPUB_TRANSLATOR_ENCODING") or "o200k_base"
    if not key:
        raise RuntimeError("Missing OPENAI_API_KEY / EPUB_TRANSLATOR_API_KEY")

    llm = LLM(
        key=key,
        url=url,
        model=model,
        token_encoding=encoding,
        temperature=0.0,
        retry_times=4,
        retry_interval_seconds=3.0,
    )
    system = llm.template("translate").render(
        target_language="English",
        user_prompt=USER_RULES,
    )
    chunks = split_paragraphs(text)
    translated: list[str] = []
    for chunk in chunks:
        if chunk == "":
            translated.append("")
            continue
        if not chunk.strip():
            translated.append(chunk)
            continue
        with llm.context() as ctx:
            out = ctx.request(
                input=[
                    Message(role=MessageRole.SYSTEM, message=system),
                    Message(role=MessageRole.USER, message=chunk),
                ],
                temperature=0.0,
            )
        translated.append((out or "").strip())
    # Rebuild preserving blank paragraph separators
    pieces: list[str] = []
    for t in translated:
        if t == "":
            pieces.append("")
        else:
            pieces.append(t)
    # "" markers → double newlines
    out_s = ""
    for i, p in enumerate(pieces):
        if p == "":
            out_s += "\n\n"
        else:
            if out_s and not out_s.endswith("\n\n"):
                if i > 0 and pieces[i - 1] != "":
                    out_s += "\n\n"
            out_s += p
    return out_s.strip()


def translate_with_openai_http(text: str) -> str:
    """Fallback: same epub-translator prompt via OpenAI HTTP (no package)."""
    import urllib.request

    key = os.environ.get("OPENAI_API_KEY") or ""
    if not key:
        raise RuntimeError("Missing OPENAI_API_KEY")
    model = os.environ.get("OPENAI_CHAT_MODEL") or "gpt-4o"
    url = (os.environ.get("OPENAI_API_BASE") or "https://api.openai.com/v1").rstrip("/") + "/chat/completions"
    system = render_system_prompt("English")
    chunks = split_paragraphs(text)
    out_parts: list[str] = []
    for chunk in chunks:
        if chunk == "":
            out_parts.append("")
            continue
        payload = {
            "model": model,
            "temperature": 0,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": chunk},
            ],
        }
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {key}",
            },
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        content = (data.get("choices") or [{}])[0].get("message", {}).get("content") or ""
        out_parts.append(content.strip())
    # Join paragraphs
    result_lines: list[str] = []
    for p in out_parts:
        if p == "":
            if result_lines and result_lines[-1] != "":
                result_lines.append("")
        else:
            result_lines.append(p)
    return "\n\n".join([x for x in result_lines if x != ""]) if result_lines else ""


def bilingual(src: str, eng: str) -> str:
    sp = [p for p in split_paragraphs(src) if p != ""]
    ep = [p for p in split_paragraphs(eng) if p != ""]
    # If counts match, interleave; else append English block
    if len(sp) == len(ep) and sp:
        blocks = []
        for s, e in zip(sp, ep):
            blocks.append(s)
            blocks.append(e)
        return "\n\n".join(blocks)
    return (src.strip() + "\n\n" + eng.strip()).strip()


def main() -> int:
    try:
        raw = sys.stdin.read()
        body = json.loads(raw or "{}")
        text = str(body.get("text") or "")
        mode = str(body.get("mode") or "replace")
        if not text.strip():
            print(json.dumps({"ok": False, "error": "Empty text"}))
            return 1

        engine = "epub-translator"
        try:
            eng = translate_with_epub_translator(text)
        except Exception as e1:
            try:
                eng = translate_with_openai_http(text)
                engine = "epub-translator-prompt+openai"
            except Exception as e2:
                print(
                    json.dumps(
                        {
                            "ok": False,
                            "error": f"Translation failed: {e1}; fallback: {e2}",
                        },
                        ensure_ascii=False,
                    )
                )
                return 2

        eng = (eng or "").strip()
        if not eng:
            print(json.dumps({"ok": False, "error": "Empty translation"}))
            return 3

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
                    "source": "https://github.com/oomol-lab/epub-translator",
                },
                ensure_ascii=False,
            )
        )
        return 0
    except Exception as e:
        print(json.dumps({"ok": False, "error": str(e)}, ensure_ascii=False))
        return 9


if __name__ == "__main__":
    raise SystemExit(main())
