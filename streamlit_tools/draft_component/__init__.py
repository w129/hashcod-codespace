"""Streamlit custom component: Draft.js for SoroOtbedit.

Based on Facebook's archived Draft.js (https://github.com/facebookarchive/draft-js).
Markdown in/out via draft-js-import-markdown / draft-js-export-markdown.
"""
from __future__ import annotations

from pathlib import Path

import streamlit.components.v1 as components

_BUILD = Path(__file__).resolve().parent / "frontend" / "build"
_RELEASE = _BUILD.is_dir() and any(_BUILD.iterdir())

if _RELEASE:
    _draft_editor = components.declare_component("l8_draft_editor", path=str(_BUILD))
else:
    _draft_editor = components.declare_component("l8_draft_editor", url="http://localhost:5181")


def draft_editor(
    markdown: str = "",
    *,
    height: int = 420,
    placeholder: str = "Escribe con Draft.js (rico → markdown)",
    read_only: bool = False,
    key: str | None = None,
    key_nonce: str | None = None,
) -> str:
    """Rich text editor (Draft.js); returns markdown for SoroOtbedit columns."""
    value = _draft_editor(
        markdown=markdown or "",
        height=int(height),
        placeholder=placeholder,
        read_only=bool(read_only),
        key_nonce=key_nonce or key or "",
        key=key,
        default=markdown or "",
    )
    if value is None:
        return markdown or ""
    return str(value)
