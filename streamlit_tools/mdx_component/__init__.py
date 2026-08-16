"""Streamlit custom component: MDXEditor (@mdxeditor/editor) for SoroOtbedit."""
from __future__ import annotations

from pathlib import Path

import streamlit.components.v1 as components

_BUILD = Path(__file__).resolve().parent / "frontend" / "build"
_RELEASE = _BUILD.is_dir() and any(_BUILD.iterdir())

if _RELEASE:
    _mdx_editor = components.declare_component("l8_mdx_editor", path=str(_BUILD))
else:
    # Dev: vite --port 5179
    _mdx_editor = components.declare_component("l8_mdx_editor", url="http://localhost:5179")


def mdx_editor(
    markdown: str = "",
    *,
    height: int = 420,
    placeholder: str = "Escribe markdown (títulos, listas, tablas…)",
    read_only: bool = False,
    key: str | None = None,
    key_nonce: str | None = None,
) -> str:
    """Rich markdown editor. Returns the current markdown string."""
    value = _mdx_editor(
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
