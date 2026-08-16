# SoroOtbedit — editor multi-columna con pestañas (otbedit + SoroEditor)
# Primer proyecto Streamlit de la plataforma l8. Sin demos.
from __future__ import annotations

import json
import uuid
from datetime import datetime, timezone
from pathlib import Path

import streamlit as st

APP_MARK = "SoroOtbedit"
APP_TITLE = "SoroOtbedit · l8"
MAX_COLS = 6
MIN_COLS = 1
DEFAULT_COLS = 3
DEFAULT_COL_PCT = [20, 50, 30]
# Favicon PNG (pestaña). Banner usa SVG completo. No usar logo del chrome (recorta a una rallita).
ICON_PNG = "soro_otbedit_icon.png"
LOGO_PNG = "soro_otbedit_logo.png"
FAVICON_PNG = "soro_otbedit_favicon.png"
ICON_SVG = "soro_otbedit_icon.svg"
SORO_HEADER_MARK = "SORO_MDX_EDITOR_V1"
NARRATOR_ID = "narrator"
DEFAULT_CAST = [
    {"id": "char_prota", "name": "Protagonista", "color": "#2c5aa0", "preset": "Protagonista", "group": "main"},
    {"id": "char_otro", "name": "Otro", "color": "#c8102e", "preset": "Otro", "group": "main"},
    {"id": NARRATOR_ID, "name": "ト書き", "color": "#5b6b7a", "preset": "", "group": "stage"},
]


def _asset(*names: str) -> str | None:
    here = Path(__file__).resolve().parent
    roots = [
        here,
        here / "streamlit_tools",
        Path("/var/www/html/streamlit_tools"),
        Path(__file__).resolve().parents[3] / "streamlit_tools",
    ]
    for name in names:
        for root in roots:
            p = root / name
            if p.is_file():
                return str(p)
    return None




def _mdx_editor_fn():
    """Lazy import of MDXEditor Streamlit component (bundled @mdxeditor/editor)."""
    import sys

    here = Path(__file__).resolve().parent
    roots = [
        here,
        here / "streamlit_tools",
        Path("/var/www/html/streamlit_tools"),
        Path(__file__).resolve().parents[1] / "streamlit_tools",
    ]
    for root in roots:
        s = str(root)
        if root.is_dir() and s not in sys.path:
            sys.path.insert(0, s)
        try:
            from mdx_component import mdx_editor  # type: ignore

            return mdx_editor
        except Exception:
            continue
    return None


def _page_icon():
    """Favicon de pestaña: PNG pequeño (el chrome de Streamlit maneja mal SVG ahí)."""
    return _asset(FAVICON_PNG, ICON_PNG, ICON_SVG) or "🧠"


def _api_base() -> str:
    import os

    return (
        os.environ.get("L8_API_BASE")
        or os.environ.get("L8_PHP_BASE")
        or "http://127.0.0.1:8001"
    ).rstrip("/")


def _ab_request(method: str, path: str, payload: dict | None = None, timeout: int = 120) -> dict:
    import json as _json
    import urllib.error
    import urllib.request

    url = _api_base() + path
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = _json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method.upper())
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode("utf-8", errors="replace")
            return _json.loads(raw) if raw else {"ok": False, "error": "Respuesta vacía"}
    except urllib.error.HTTPError as e:
        try:
            body = e.read().decode("utf-8", errors="replace")
            parsed = _json.loads(body) if body else {}
            if isinstance(parsed, dict):
                parsed.setdefault("ok", False)
                parsed.setdefault("error", f"HTTP {e.code}")
                return parsed
        except Exception:
            pass
        return {"ok": False, "error": f"HTTP {e.code}: {e.reason}"}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def _ab_action(action: str, **kwargs) -> dict:
    body = {"action": action, **kwargs}
    return _ab_request("POST", "/api/agent-browser/action", body, timeout=150)


def _ab_ensure() -> dict:
    return _ab_request("POST", "/api/agent-browser/ensure", {}, timeout=300)


def _ab_status() -> dict:
    return _ab_request("GET", "/api/agent-browser/status", None, timeout=30)


def _parse_headings(content: str, char: str) -> list[dict]:
    """Yohaku-style heading parse: lines starting with repeated `char` + space/EOL."""
    if not content or not char:
        return []
    char = char[0]
    headings: list[dict] = []
    for i, line in enumerate(content.split("\n")):
        if not line.startswith(char):
            continue
        level = 0
        while level < len(line) and line[level] == char:
            level += 1
        if level < len(line) and line[level] != " ":
            continue
        text = line[level:].strip()
        if not text:
            continue
        headings.append({"level": level, "text": text, "line": i})
    return headings


def _build_heading_tree(headings: list[dict]) -> list[dict]:
    root: list[dict] = []
    stack: list[dict] = [{"level": 0, "children": root}]
    for heading in headings:
        node = {**heading, "children": []}
        while len(stack) > 1 and stack[-1]["level"] >= heading["level"]:
            stack.pop()
        stack[-1]["children"].append(node)
        stack.append(node)
    return root


def _doc_outline(doc: dict, char: str) -> list[dict]:
    """Headings of every column in the active document, tagged with col index."""
    out: list[dict] = []
    cols = doc.get("columns") or []
    for ci, col in enumerate(cols):
        for h in _parse_headings(str(col or ""), char):
            out.append({**h, "col": ci})
    return out


def _flatten_outline_tree(nodes: list[dict], col: int, acc: list[dict] | None = None) -> list[dict]:
    acc = acc if acc is not None else []
    for n in nodes:
        acc.append(
            {
                "level": n["level"],
                "text": n["text"],
                "line": n["line"],
                "col": col,
                "has_children": bool(n.get("children")),
            }
        )
        if n.get("children"):
            _flatten_outline_tree(n["children"], col, acc)
    return acc


def _outline_jump_context(doc: dict, col: int, line: int, radius: int = 2) -> str:
    cols = doc.get("columns") or []
    if col < 0 or col >= len(cols):
        return ""
    lines = str(cols[col] or "").split("\n")
    if line < 0 or line >= len(lines):
        return ""
    lo = max(0, line - radius)
    hi = min(len(lines), line + radius + 1)
    chunks = []
    for i in range(lo, hi):
        mark = ">>> " if i == line else "    "
        chunks.append(f"{mark}L{i + 1}: {lines[i]}")
    return "\n".join(chunks)


def _new_character(name: str = "Personaje", color: str = "#334155", preset: str = "", group: str = "main") -> dict:
    return {
        "id": "char_" + uuid.uuid4().hex[:8],
        "name": (name or "Personaje").strip(),
        "color": color or "#334155",
        "preset": (preset or name or "").strip(),
        "group": (group or "main").strip(),
    }


def _new_block(character_id: str = NARRATOR_ID, text: str = "", emotion: str = "normal") -> dict:
    return {
        "id": "blk_" + uuid.uuid4().hex[:8],
        "character_id": character_id or NARRATOR_ID,
        "emotion": emotion or "normal",
        "text": text or "",
    }


def _char_by_id(cid: str) -> dict | None:
    for c in st.session_state.get("characters") or []:
        if c.get("id") == cid:
            return c
    return None


def _char_label(cid: str) -> str:
    c = _char_by_id(cid)
    return (c.get("name") if c else None) or "¿?"


def _ensure_doc_blocks(doc: dict) -> list[dict]:
    blocks = doc.get("blocks")
    if not isinstance(blocks, list):
        blocks = []
        doc["blocks"] = blocks
    return blocks


def _csv_encode(rows: list[list[str]]) -> str:
    out = []
    for row in rows:
        cells = []
        for cell in row:
            s = str(cell).replace("\r\n", "\n").replace("\r", "\n")
            if any(ch in s for ch in [",", '"', "\n"]):
                cells.append('"' + s.replace('"', '""') + '"')
            else:
                cells.append(s)
        out.append(",".join(cells))
    return "\r\n".join(out)


def _export_speaker_csv(docs: list[dict]) -> str:
    rows = [["speaker", "emotion", "text", "document"]]
    for d in docs:
        title = d.get("title") or "Doc"
        for b in d.get("blocks") or []:
            rows.append(
                [
                    _char_label(str(b.get("character_id") or "")),
                    str(b.get("emotion") or "normal"),
                    str(b.get("text") or "").replace("\n", "\\n"),
                    title,
                ]
            )
    return _csv_encode(rows)


def _export_preset_separator(docs: list[dict], sep: str = "＞") -> str:
    """Formato VOICEROID / A.I.VOICE: preset＞texto"""
    lines = []
    for d in docs:
        for b in d.get("blocks") or []:
            text = str(b.get("text") or "").replace("\n", "\\n")
            cid = str(b.get("character_id") or "")
            if cid == NARRATOR_ID or not cid:
                lines.append(text)
                continue
            ch = _char_by_id(cid)
            name = (ch.get("preset") if ch and ch.get("preset") else None) or _char_label(cid)
            lines.append(f"{name}{sep}{text}")
    return "\r\n".join(lines)


def _export_cevio_columns(docs: list[dict]) -> str:
    """Formato tipo CeVIO: nombre, emoción/preset, texto (TSV)."""
    rows = [["name", "emotion", "text"]]
    for d in docs:
        for b in d.get("blocks") or []:
            cid = str(b.get("character_id") or "")
            ch = _char_by_id(cid)
            name = (ch.get("preset") if ch and ch.get("preset") else None) or _char_label(cid)
            if cid == NARRATOR_ID:
                name = ""
            rows.append(
                [
                    name,
                    str(b.get("emotion") or "normal"),
                    str(b.get("text") or "").replace("\n", "\\n"),
                ]
            )
    return "\r\n".join("\t".join(r) for r in rows)


def _export_dialogue_only(docs: list[dict]) -> str:
    lines = []
    for d in docs:
        for b in d.get("blocks") or []:
            t = str(b.get("text") or "").strip()
            if t:
                lines.append(t.replace("\n", "\\n"))
    return "\r\n".join(lines)


def _blocks_to_chat_html(blocks: list[dict]) -> str:
    parts = ['<div class="soro-chat">']
    for b in blocks:
        cid = str(b.get("character_id") or "")
        ch = _char_by_id(cid)
        name = (ch.get("name") if ch else None) or "¿?"
        color = (ch.get("color") if ch else None) or "#334155"
        text = (
            str(b.get("text") or "")
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\n", "<br/>")
        )
        side = "right" if ch and ch.get("group") == "main" and cid != NARRATOR_ID and name.lower().startswith(("otro", "antag")) else "left"
        if cid == NARRATOR_ID:
            parts.append(
                f'<div class="soro-chat-narr">{text or "&nbsp;"}</div>'
            )
        else:
            parts.append(
                f'<div class="soro-chat-row {side}">'
                f'<div class="soro-chat-bubble" style="border-left:4px solid {color}">'
                f'<div class="soro-chat-name" style="color:{color}">{name}</div>'
                f'<div class="soro-chat-text">{text or "&nbsp;"}</div>'
                f"</div></div>"
            )
    parts.append("</div>")
    return "\n".join(parts)


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def _new_doc(title: str = "Sin título", n_cols: int = DEFAULT_COLS) -> dict:
    n_cols = max(MIN_COLS, min(MAX_COLS, int(n_cols)))
    return {
        "id": uuid.uuid4().hex[:10],
        "title": title or "Sin título",
        "n_cols": n_cols,
        "columns": ["" for _ in range(n_cols)],
        "blocks": [],
        "updated_at": _now(),
    }


def _ensure_state() -> None:
    if "characters" not in st.session_state:
        st.session_state.characters = [dict(c) for c in DEFAULT_CAST]
    if "docs" not in st.session_state:
        st.session_state.docs = [
            _new_doc("Documento 1", DEFAULT_COLS),
        ]
        # Semilla estilo Soro + headings (outline tipo Yohaku)
        st.session_state.docs[0]["columns"] = [
            "# Escenas\n## Bloque A\n1\n2\n## Bloque B\n3",
            "# Acción / diálogo\n## INT. OFICINA — DÍA\nProtagonista entra.\n— Hola.\n## EXT. CALLE — NOCHE\nCorte a negro.",
            "# Notas\n## Tono\nEstablecer tono\n## Beats\nBeat emocional\nCortar si sobra",
        ]
        # Semilla bloques estilo VoiScripter (guion para voz sintética)
        st.session_state.docs[0]["blocks"] = [
            _new_block(NARRATOR_ID, "INT. OFICINA — DÍA"),
            _new_block("char_prota", "Hola."),
            _new_block("char_otro", "¿Llegaste temprano?"),
            _new_block(NARRATOR_ID, "EXT. CALLE — NOCHE"),
            _new_block("char_prota", "Corte a negro."),
        ]
    for d in st.session_state.docs:
        _ensure_doc_blocks(d)
    if "active_tab" not in st.session_state:
        st.session_state.active_tab = 0
    if "templates" not in st.session_state:
        st.session_state.templates = {
            "0": "TODO: ",
            "1": "NOTE: ",
            "2": "FIXME: ",
            "3": "— ",
            "4": "→ ",
            "5": "",
            "6": "",
            "7": "",
            "8": "",
            "9": "",
        }
    if "bookmarks" not in st.session_state:
        st.session_state.bookmarks = []
    if "status_msg" not in st.session_state:
        st.session_state.status_msg = "Listo."
    if "heading_char" not in st.session_state:
        st.session_state.heading_char = "#"
    if "outline_jump" not in st.session_state:
        st.session_state.outline_jump = None
    if "voice_sep" not in st.session_state:
        st.session_state.voice_sep = "＞"
    if "column_editor" not in st.session_state:
        st.session_state.column_editor = "mdx"  # mdx | classic


def _active_doc() -> dict:
    docs = st.session_state.docs
    i = st.session_state.active_tab
    if not docs:
        docs.append(_new_doc())
        st.session_state.docs = docs
    if i < 0 or i >= len(docs):
        st.session_state.active_tab = 0
        i = 0
    return docs[i]


def _sync_line_counts(doc: dict) -> None:
    """Alinea filas entre columnas (idea SoroEditor): misma cantidad de líneas."""
    cols = list(doc.get("columns") or [])
    if not cols:
        return
    split = [c.split("\n") for c in cols]
    max_lines = max((len(x) for x in split), default=1)
    for i, lines in enumerate(split):
        if len(lines) < max_lines:
            lines.extend([""] * (max_lines - len(lines)))
        split[i] = lines
    doc["columns"] = ["\n".join(lines) for lines in split]
    doc["updated_at"] = _now()


def _project_payload() -> dict:
    return {
        "format": "soro_otbedit.cep",
        "version": 2,
        "app": APP_MARK,
        "exported_at": _now(),
        "docs": st.session_state.docs,
        "characters": st.session_state.characters,
        "templates": st.session_state.templates,
        "bookmarks": st.session_state.bookmarks,
        "voice_sep": st.session_state.get("voice_sep") or "＞",
    }


def _load_project(raw: bytes | str) -> None:
    if isinstance(raw, bytes):
        raw = raw.decode("utf-8", errors="replace")
    data = json.loads(raw)
    docs = data.get("docs") or []
    cleaned = []
    for d in docs:
        if not isinstance(d, dict):
            continue
        n = max(MIN_COLS, min(MAX_COLS, int(d.get("n_cols") or DEFAULT_COLS)))
        cols = list(d.get("columns") or [])
        while len(cols) < n:
            cols.append("")
        cols = cols[:n]
        blocks = []
        for b in d.get("blocks") or []:
            if not isinstance(b, dict):
                continue
            blocks.append(
                {
                    "id": b.get("id") or ("blk_" + uuid.uuid4().hex[:8]),
                    "character_id": b.get("character_id") or NARRATOR_ID,
                    "emotion": b.get("emotion") or "normal",
                    "text": str(b.get("text") or ""),
                }
            )
        cleaned.append(
            {
                "id": d.get("id") or uuid.uuid4().hex[:10],
                "title": d.get("title") or "Sin título",
                "n_cols": n,
                "columns": cols,
                "blocks": blocks,
                "updated_at": d.get("updated_at") or _now(),
            }
        )
    if not cleaned:
        cleaned = [_new_doc()]
    st.session_state.docs = cleaned
    st.session_state.active_tab = 0
    chars = []
    for c in data.get("characters") or []:
        if not isinstance(c, dict):
            continue
        chars.append(
            {
                "id": c.get("id") or ("char_" + uuid.uuid4().hex[:8]),
                "name": c.get("name") or "Personaje",
                "color": c.get("color") or "#334155",
                "preset": c.get("preset") or c.get("name") or "",
                "group": c.get("group") or "main",
            }
        )
    if chars:
        st.session_state.characters = chars
    elif "characters" not in st.session_state:
        st.session_state.characters = [dict(x) for x in DEFAULT_CAST]
    if isinstance(data.get("templates"), dict):
        st.session_state.templates = {str(k): str(v) for k, v in data["templates"].items()}
    if isinstance(data.get("bookmarks"), list):
        st.session_state.bookmarks = [str(x) for x in data["bookmarks"] if str(x).strip()]
    if data.get("voice_sep"):
        st.session_state.voice_sep = str(data.get("voice_sep"))
    st.session_state.status_msg = f"Proyecto cargado · {len(cleaned)} documento(s)"


def main() -> None:
    # {SORO_HEADER_MARK}
    favicon = _page_icon()
    icon_src = _asset(ICON_SVG, ICON_PNG, LOGO_PNG, FAVICON_PNG)

    st.set_page_config(
        page_title=APP_TITLE,
        page_icon=favicon,
        layout="wide",
        initial_sidebar_state="expanded",
    )

    _ensure_state()
    if "ab_log" not in st.session_state:
        st.session_state.ab_log = ""
    if "ab_snapshot" not in st.session_state:
        st.session_state.ab_snapshot = ""
    if "ab_shot_b64" not in st.session_state:
        st.session_state.ab_shot_b64 = ""
    if "ab_url" not in st.session_state:
        st.session_state.ab_url = "https://www.google.com/"

    icon_data_uri = ""
    if icon_src:
        try:
            import base64
            import mimetypes

            raw = Path(icon_src).read_bytes()
            mime = mimetypes.guess_type(icon_src)[0] or "image/svg+xml"
            if icon_src.endswith(".svg"):
                mime = "image/svg+xml"
            icon_data_uri = f"data:{mime};base64," + base64.b64encode(raw).decode("ascii")
        except Exception:
            icon_data_uri = ""

    st.markdown(
        f"""
<style>
  .block-container {{ padding-top: 1.1rem; padding-bottom: 1.5rem; }}
  div[data-testid="stTextArea"] textarea {{
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    font-size: 0.92rem;
    line-height: 1.45;
  }}
  .soro-banner {{
    display:flex; align-items:center; gap:10px; flex-wrap:wrap;
    margin-bottom: 0.35rem;
  }}
  .soro-banner h1 {{ font-size: 1.35rem; margin: 0; }}
  .soro-banner span {{ color:#5b6b7a; font-size: 0.9rem; }}
  .soro-side-brand {{
    display:flex; align-items:center; gap:10px;
    margin: 0 0 0.85rem 0; padding: 0;
  }}
  .soro-side-brand img {{
    width: 40px; height: 40px; display:block; flex: 0 0 auto;
    object-fit: contain;
  }}
  .soro-side-brand .soro-side-name {{
    font-size: 1.05rem; font-weight: 700; color: #111; line-height: 1.2;
  }}
  .soro-chat {{ display:flex; flex-direction:column; gap:10px; padding: 0.25rem 0 1rem; }}
  .soro-chat-row {{ display:flex; }}
  .soro-chat-row.left {{ justify-content:flex-start; }}
  .soro-chat-row.right {{ justify-content:flex-end; }}
  .soro-chat-bubble {{
    max-width: min(520px, 92%);
    background:#f3f4f6; border-radius:10px; padding:8px 12px;
  }}
  .soro-chat-name {{ font-size:0.78rem; font-weight:700; margin-bottom:2px; }}
  .soro-chat-text {{ font-size:0.95rem; line-height:1.4; color:#111; }}
  .soro-chat-narr {{
    text-align:center; color:#5b6b7a; font-size:0.88rem; font-style:italic;
    padding: 4px 8px;
  }}
  /* Eliminar la rallita del logo del chrome de Streamlit */
  [data-testid="stLogo"],
  [data-testid="stLogo"] *,
  [data-testid="stLogoLink"],
  [data-testid="stSidebarHeader"] [data-testid="stLogo"],
  [data-testid="stSidebarCollapsedControl"] img,
  [data-testid="stHeader"] img[alt="Logo"],
  header img[alt="Logo"],
  section[data-testid="stSidebar"] > div:first-child img[alt="Logo"],
  section[data-testid="stSidebar"] a[href] img {{
    display: none !important;
    width: 0 !important;
    height: 0 !important;
    max-height: 0 !important;
    overflow: hidden !important;
    visibility: hidden !important;
    opacity: 0 !important;
  }}
</style>
<div class="soro-banner">
  <h1>{APP_MARK}</h1>
  <span>otbedit · Soro · Yohaku outline · VoiScripter guion/voz</span>
</div>
""",
        unsafe_allow_html=True,
    )

    if st.session_state.get("ab_shot_b64") or st.session_state.get("ab_snapshot"):
        with st.expander("Google · vista agent-browser", expanded=bool(st.session_state.get("ab_shot_b64"))):
            if st.session_state.get("ab_shot_b64"):
                try:
                    import base64 as _b64

                    st.image(_b64.b64decode(st.session_state.ab_shot_b64), caption="Screenshot Google")
                except Exception as e:
                    st.caption(f"No se pudo mostrar shot: {e}")
            if st.session_state.get("ab_snapshot"):
                st.text_area(
                    "Snapshot (refs @eN para click/fill)",
                    value=st.session_state.ab_snapshot,
                    height=220,
                    key="ab_snap_view",
                )
            if st.session_state.get("ab_log"):
                st.caption((st.session_state.ab_log or "")[:1200])

    # —— Sidebar: icono completo a la izquierda + proyecto ——
    with st.sidebar:
        if icon_data_uri:
            st.markdown(
                f'<div class="soro-side-brand">'
                f'<img src="{icon_data_uri}" width="40" height="40" alt="SoroOtbedit" />'
                f'<div class="soro-side-name">{APP_MARK}</div>'
                f"</div>",
                unsafe_allow_html=True,
            )
        st.subheader("Proyecto")
        st.caption("Abrir / guardar en el servidor (sesión + archivo .cep)")

        c1, c2 = st.columns(2)
        with c1:
            if st.button("＋ Doc", use_container_width=True):
                st.session_state.docs.append(_new_doc(f"Documento {len(st.session_state.docs) + 1}"))
                st.session_state.active_tab = len(st.session_state.docs) - 1
                st.session_state.status_msg = "Documento nuevo"
                st.rerun()
        with c2:
            if st.button("✕ Cerrar doc", use_container_width=True):
                if len(st.session_state.docs) > 1:
                    del st.session_state.docs[st.session_state.active_tab]
                    st.session_state.active_tab = max(0, st.session_state.active_tab - 1)
                    st.session_state.status_msg = "Documento cerrado"
                    st.rerun()
                else:
                    st.session_state.status_msg = "Debe quedar al menos un documento"

        payload = json.dumps(_project_payload(), ensure_ascii=False, indent=2)
        st.download_button(
            "⬇ Guardar proyecto (.cep.json)",
            data=payload.encode("utf-8"),
            file_name=f"soro_otbedit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.cep.json",
            mime="application/json",
            use_container_width=True,
        )
        up = st.file_uploader("⬆ Abrir proyecto", type=["json", "cep", "yaml", "yml", "txt"])
        if up is not None:
            try:
                _load_project(up.getvalue())
                st.rerun()
            except Exception as e:
                st.error(f"No se pudo abrir: {e}")

        st.divider()
        st.subheader("Columnas (Soro)")
        doc = _active_doc()
        st.session_state.column_editor = st.radio(
            "Editor de columnas",
            options=["mdx", "classic"],
            format_func=lambda v: "MDX (Notion-like)" if v == "mdx" else "Clásico (texto)",
            index=0 if st.session_state.get("column_editor") != "classic" else 1,
            horizontal=True,
            help="MDX usa @mdxeditor/editor: títulos, listas, tablas y código con vista enriquecida.",
        )
        n_cols = st.slider("Nº de columnas", MIN_COLS, MAX_COLS, int(doc.get("n_cols") or DEFAULT_COLS))
        if n_cols != doc["n_cols"]:
            cols = list(doc["columns"])
            if n_cols > len(cols):
                cols.extend([""] * (n_cols - len(cols)))
            else:
                cols = cols[:n_cols]
            doc["n_cols"] = n_cols
            doc["columns"] = cols
            doc["updated_at"] = _now()
        if st.button("⇅ Alinear filas entre columnas", use_container_width=True):
            _sync_line_counts(doc)
            st.session_state.status_msg = "Filas alineadas (sync Soro)"
            st.rerun()

        st.divider()
        st.subheader("Elenco · voz")
        st.caption(
            "Personajes y export para locución sintética "
            "([VoiScripter](https://github.com/bluemistel/VoiScripter))."
        )
        with st.expander("Gestionar elenco", expanded=False):
            new_name = st.text_input("Nombre personaje", key="cast_new_name")
            nc1, nc2 = st.columns(2)
            with nc1:
                new_color = st.color_picker("Color", "#2c5aa0", key="cast_new_color")
            with nc2:
                new_preset = st.text_input("Preset voz", key="cast_new_preset", placeholder="Nombre en VOICEROID/CeVIO")
            if st.button("＋ Personaje", use_container_width=True, key="cast_add"):
                if new_name.strip():
                    st.session_state.characters.append(
                        _new_character(new_name.strip(), new_color, new_preset.strip() or new_name.strip())
                    )
                    st.session_state.status_msg = f"Personaje {new_name.strip()} añadido"
                    st.rerun()
            for ci, ch in enumerate(list(st.session_state.characters)):
                c1, c2, c3 = st.columns([3, 2, 1])
                with c1:
                    nm = st.text_input("Nombre", value=ch.get("name") or "", key=f"cast_nm_{ch['id']}")
                with c2:
                    pr = st.text_input("Preset", value=ch.get("preset") or "", key=f"cast_pr_{ch['id']}")
                with c3:
                    if st.button("✕", key=f"cast_del_{ch['id']}"):
                        if ch.get("id") == NARRATOR_ID:
                            st.session_state.status_msg = "No se puede borrar ト書き / narración"
                        else:
                            st.session_state.characters.pop(ci)
                            st.session_state.status_msg = "Personaje eliminado"
                            st.rerun()
                if nm != ch.get("name") or pr != ch.get("preset"):
                    ch["name"] = nm or ch.get("name")
                    ch["preset"] = pr
            # color pickers separately to avoid overcrowding
            for ch in st.session_state.characters:
                ch["color"] = st.color_picker(
                    f"Color · {ch.get('name')}",
                    ch.get("color") or "#334155",
                    key=f"cast_col_{ch['id']}",
                )

        st.session_state.voice_sep = st.text_input(
            "Separador VOICEROID / A.I.VOICE",
            value=st.session_state.get("voice_sep") or "＞",
            max_chars=4,
            key="voice_sep_input",
            help="Ejemplo: ＞  →  Protagonista＞Hola.",
        )
        export_scope = st.radio(
            "Exportar",
            ["Documento activo", "Todo el proyecto"],
            horizontal=True,
            key="voice_export_scope",
        )
        docs_export = (
            [_active_doc()]
            if export_scope.startswith("Documento")
            else list(st.session_state.docs)
        )
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        st.download_button(
            "⬇ CSV hablante + texto",
            data=_export_speaker_csv(docs_export).encode("utf-8"),
            file_name=f"soro_voice_{stamp}.csv",
            mime="text/csv",
            use_container_width=True,
            key="exp_csv_voice",
        )
        st.download_button(
            "⬇ TXT preset＋separador (VOICEROID)",
            data=_export_preset_separator(docs_export, st.session_state.voice_sep or "＞").encode("utf-8"),
            file_name=f"soro_voice_preset_{stamp}.txt",
            mime="text/plain",
            use_container_width=True,
            key="exp_preset_voice",
        )
        st.download_button(
            "⬇ TSV CeVIO (nombre · emoción · texto)",
            data=_export_cevio_columns(docs_export).encode("utf-8"),
            file_name=f"soro_voice_cevio_{stamp}.tsv",
            mime="text/tab-separated-values",
            use_container_width=True,
            key="exp_cevio_voice",
        )
        st.download_button(
            "⬇ Solo diálogos",
            data=_export_dialogue_only(docs_export).encode("utf-8"),
            file_name=f"soro_voice_lines_{stamp}.txt",
            mime="text/plain",
            use_container_width=True,
            key="exp_lines_voice",
        )

        st.divider()
        st.subheader("Outline")
        st.caption("Estilo Yohaku · encabezados clicables para saltar de línea")
        hchar_in = st.text_input(
            "Carácter de encabezado",
            value=st.session_state.heading_char or "#",
            max_chars=1,
            key="heading_char_input",
            help="Por defecto # (Markdown). Ejemplos: #, ■, ※",
        )
        if hchar_in and hchar_in != st.session_state.heading_char:
            st.session_state.heading_char = hchar_in[0]
        hchar = st.session_state.heading_char or "#"

        outline_scope = st.radio(
            "Alcance",
            ["Documento activo", "Todas las pestañas"],
            horizontal=True,
            key="outline_scope",
        )

        docs_for_outline = (
            [doc]
            if outline_scope.startswith("Documento")
            else list(st.session_state.docs)
        )
        flat_items: list[dict] = []
        for d in docs_for_outline:
            for ci, col_txt in enumerate(d.get("columns") or []):
                tree = _build_heading_tree(_parse_headings(str(col_txt or ""), hchar))
                for item in _flatten_outline_tree(tree, ci):
                    item["doc_id"] = d.get("id")
                    item["doc_title"] = d.get("title") or "Doc"
                    flat_items.append(item)

        if not flat_items:
            st.caption(f"Sin encabezados ({hchar} …) en el alcance actual.")
        else:
            st.caption(f"{len(flat_items)} encabezado(s)")
            max_show = 60
            for oi, item in enumerate(flat_items[:max_show]):
                pad = " " * max(0, int(item["level"]) - 1)
                label = f"{pad}{hchar * int(item['level'])} {item['text']}"
                meta = f" · C{item['col'] + 1} L{item['line'] + 1}"
                if outline_scope.startswith("Todas"):
                    meta = f" · {item['doc_title']}{meta}"
                if st.button(
                    f"{label}{meta}",
                    key=f"outline_go_{item.get('doc_id')}_{item['col']}_{item['line']}_{oi}",
                    use_container_width=True,
                ):
                    # Activar pestaña del documento si hace falta
                    for di, dd in enumerate(st.session_state.docs):
                        if dd.get("id") == item.get("doc_id"):
                            st.session_state.active_tab = di
                            break
                    st.session_state.outline_jump = {
                        "doc_id": item.get("doc_id"),
                        "col": int(item["col"]),
                        "line": int(item["line"]),
                        "text": item["text"],
                        "level": int(item["level"]),
                    }
                    st.session_state.status_msg = (
                        f"Outline → {item.get('doc_title')} · "
                        f"col {item['col'] + 1} · L{item['line'] + 1}"
                    )
                    st.rerun()
            if len(flat_items) > max_show:
                st.caption(f"… y {len(flat_items) - max_show} más")

        st.divider()
        st.subheader("Plantillas rápidas")
        tkey = st.selectbox("Slot plantilla", list(st.session_state.templates.keys()), format_func=lambda k: f"Ctrl+{k}")
        tval = st.text_input("Texto", value=st.session_state.templates.get(tkey, ""))
        if st.button("Guardar plantilla", use_container_width=True):
            st.session_state.templates[str(tkey)] = tval
            st.session_state.status_msg = f"Plantilla {tkey} guardada"
        insert_col = st.number_input("Insertar en columna", min_value=1, max_value=int(doc["n_cols"]), value=1)
        if st.button("Insertar plantilla", use_container_width=True):
            idx = int(insert_col) - 1
            snippet = st.session_state.templates.get(str(tkey), "")
            if snippet:
                cur = doc["columns"][idx]
                doc["columns"][idx] = (cur + ("\n" if cur and not cur.endswith("\n") else "") + snippet)
                doc["updated_at"] = _now()
                st.session_state.status_msg = f"Plantilla insertada en col {insert_col}"
                st.rerun()

        st.divider()
        st.subheader("Marcadores")
        bm = st.text_input("Nuevo marcador / línea clave")
        if st.button("＋ Marcador", use_container_width=True) and bm.strip():
            st.session_state.bookmarks.append(bm.strip())
            st.session_state.status_msg = "Marcador añadido"
        for i, b in enumerate(list(st.session_state.bookmarks)):
            b1, b2 = st.columns([4, 1])
            with b1:
                st.caption(b)
            with b2:
                if st.button("✕", key=f"bm_del_{i}"):
                    st.session_state.bookmarks.pop(i)
                    st.rerun()

        st.divider()
        st.subheader("Google · agent-browser")
        st.caption(
            "Entrar y controlar páginas de Google con "
            "[vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser)."
        )

        st_status = _ab_status()
        avail = bool(st_status.get("available"))
        st.caption(
            ("CLI listo · " + (st_status.get("version") or "agent-browser"))
            if avail
            else "CLI no instalado aún · pulsa Asegurar"
        )
        if st.button("Asegurar / instalar Chrome", use_container_width=True, key="ab_ensure"):
            with st.spinner("Instalando agent-browser / Chrome…"):
                ens = _ab_ensure()
            st.session_state.ab_log = ens.get("logs_tail") or ens.get("error") or str(ens)
            st.session_state.status_msg = (
                "agent-browser listo" if ens.get("ok") else (ens.get("error") or "Ensure falló")
            )
            st.rerun()

        presets = st_status.get("presets") or [
            {"label": "Google", "url": "https://www.google.com/"},
            {"label": "Gmail", "url": "https://mail.google.com/"},
            {"label": "Drive", "url": "https://drive.google.com/"},
            {"label": "Docs", "url": "https://docs.google.com/"},
            {"label": "Maps", "url": "https://maps.google.com/"},
            {"label": "Translate", "url": "https://translate.google.com/"},
            {"label": "YouTube", "url": "https://www.youtube.com/"},
        ]
        labels = [p.get("label") or p.get("url") for p in presets]
        pick = st.selectbox("Atajo Google", labels, key="ab_preset")
        for p in presets:
            if (p.get("label") or p.get("url")) == pick:
                if st.button("Usar atajo", use_container_width=True, key="ab_use_preset"):
                    st.session_state.ab_url = p.get("url") or st.session_state.ab_url
                    st.rerun()
                break

        gurl = st.text_input("URL Google", value=st.session_state.ab_url, key="ab_url_input")
        st.session_state.ab_url = gurl
        g1, g2 = st.columns(2)
        with g1:
            if st.button("Abrir / entrar", use_container_width=True, key="ab_open"):
                with st.spinner("Abriendo…"):
                    res = _ab_action("open", url=gurl)
                st.session_state.ab_log = res.get("output") or res.get("error") or ""
                if res.get("ok"):
                    st.session_state.status_msg = f"Google abierto · {res.get('title') or res.get('current_url') or gurl}"
                    snap = _ab_action("snapshot")
                    if snap.get("ok"):
                        st.session_state.ab_snapshot = snap.get("output") or ""
                else:
                    st.session_state.status_msg = res.get("error") or "No se pudo abrir"
                st.rerun()
        with g2:
            if st.button("Cerrar browser", use_container_width=True, key="ab_close"):
                res = _ab_action("close")
                st.session_state.ab_log = res.get("output") or res.get("error") or "cerrado"
                st.session_state.status_msg = "Sesión agent-browser cerrada"
                st.rerun()

        g3, g4 = st.columns(2)
        with g3:
            if st.button("Snapshot", use_container_width=True, key="ab_snap"):
                with st.spinner("Snapshot…"):
                    res = _ab_action("snapshot")
                st.session_state.ab_snapshot = res.get("output") or res.get("error") or ""
                st.session_state.ab_log = st.session_state.ab_snapshot[:2000]
                st.session_state.status_msg = "Snapshot listo" if res.get("ok") else (res.get("error") or "Snapshot falló")
                st.rerun()
        with g4:
            if st.button("Screenshot", use_container_width=True, key="ab_shot"):
                with st.spinner("Captura…"):
                    res = _ab_action("screenshot")
                st.session_state.ab_log = res.get("output") or res.get("error") or ""
                if res.get("image_base64"):
                    st.session_state.ab_shot_b64 = res["image_base64"]
                st.session_state.status_msg = "Screenshot listo" if res.get("ok") else (res.get("error") or "Screenshot falló")
                st.rerun()

        ref = st.text_input("Ref / selector (@e2 o #q)", key="ab_ref", placeholder="@e1")
        fill_txt = st.text_input("Texto para fill / búsqueda", key="ab_fill_txt")
        c_click, c_fill, c_enter = st.columns(3)
        with c_click:
            if st.button("Click", use_container_width=True, key="ab_click"):
                res = _ab_action("click", selector=ref)
                st.session_state.ab_log = res.get("output") or res.get("error") or ""
                st.session_state.status_msg = "Click OK" if res.get("ok") else (res.get("error") or "Click falló")
                st.rerun()
        with c_fill:
            if st.button("Fill", use_container_width=True, key="ab_fill"):
                res = _ab_action("fill", selector=ref, text=fill_txt)
                st.session_state.ab_log = res.get("output") or res.get("error") or ""
                st.session_state.status_msg = "Fill OK" if res.get("ok") else (res.get("error") or "Fill falló")
                st.rerun()
        with c_enter:
            if st.button("Enter", use_container_width=True, key="ab_enter"):
                res = _ab_action("press", key="Enter")
                st.session_state.ab_log = res.get("output") or res.get("error") or ""
                st.session_state.status_msg = "Enter OK" if res.get("ok") else (res.get("error") or "Enter falló")
                st.rerun()

        if st.button("Buscar en Google", use_container_width=True, key="ab_search"):
            q = (fill_txt or "").strip()
            if not q:
                st.session_state.status_msg = "Escribe el texto a buscar"
            else:
                search_url = "https://www.google.com/search?q=" + __import__("urllib.parse").parse.quote_plus(q)
                with st.spinner("Buscando…"):
                    res = _ab_action("open", url=search_url)
                st.session_state.ab_url = search_url
                st.session_state.ab_log = res.get("output") or res.get("error") or ""
                if res.get("ok"):
                    snap = _ab_action("snapshot")
                    st.session_state.ab_snapshot = snap.get("output") or ""
                    st.session_state.status_msg = f"Búsqueda: {q}"
                else:
                    st.session_state.status_msg = res.get("error") or "Búsqueda falló"
                st.rerun()

        st.divider()
        st.caption(st.session_state.status_msg)

    # —— Tabs de documentos (otbedit) ——
    jump = st.session_state.get("outline_jump")
    if jump:
        # Banner global (Streamlit no selecciona pestaña por API)
        target_title = next(
            (d.get("title") for d in st.session_state.docs if d.get("id") == jump.get("doc_id")),
            "documento",
        )
        target_doc = next(
            (d for d in st.session_state.docs if d.get("id") == jump.get("doc_id")),
            None,
        )
        st.success(
            f"Outline · {target_title} · col {int(jump['col']) + 1} · "
            f"L{int(jump['line']) + 1} · {jump.get('text', '')}"
        )
        if target_doc is not None:
            st.code(
                _outline_jump_context(target_doc, int(jump["col"]), int(jump["line"])),
                language="text",
            )
        if st.button("Limpiar salto del outline", key="outline_clear_global"):
            st.session_state.outline_jump = None
            st.rerun()

    titles = [d.get("title") or f"Doc {i+1}" for i, d in enumerate(st.session_state.docs)]
    tab_objs = st.tabs(titles)

    for ti, tab in enumerate(tab_objs):
        with tab:
            doc = st.session_state.docs[ti]
            head_l, head_r = st.columns([3, 1])
            with head_l:
                new_title = st.text_input(
                    "Nombre del documento",
                    value=doc.get("title") or "",
                    key=f"title_{doc['id']}",
                )
                if new_title != doc.get("title"):
                    doc["title"] = new_title or "Sin título"
                    doc["updated_at"] = _now()
                    st.session_state.active_tab = ti
            with head_r:
                st.caption(f"Act. {doc.get('updated_at', '—')}")
                find = st.text_input("Buscar", key=f"find_{doc['id']}", placeholder="texto…")

            view_mode = st.radio(
                "Vista",
                ["Columnas", "Bloques (voz)", "Chat"],
                horizontal=True,
                key=f"view_{doc['id']}",
                help="Columnas = Soro/otbedit · Bloques/Chat = flujo VoiScripter",
            )

            this_jump = (
                jump
                if jump and jump.get("doc_id") == doc.get("id")
                else None
            )
            if this_jump and view_mode == "Columnas":
                st.markdown(
                    f"""
<script>
(function () {{
  const col = {int(this_jump["col"])};
  const line = {int(this_jump["line"])};
  const root = window.parent.document;
  const areas = root.querySelectorAll('textarea');
  if (!areas || !areas.length) return;
  const big = Array.from(areas).filter((t) => (t.rows || 0) >= 8 || (t.clientHeight || 0) > 200);
  const target = big[col] || areas[col];
  if (!target) return;
  const text = target.value || "";
  const lines = text.split("\\n");
  let start = 0;
  for (let i = 0; i < line && i < lines.length; i++) start += lines[i].length + 1;
  const end = start + (lines[line] ? lines[line].length : 0);
  target.focus();
  try {{ target.setSelectionRange(start, end); }} catch (e) {{}}
  const ratio = lines.length ? line / lines.length : 0;
  target.scrollTop = Math.max(0, (target.scrollHeight * ratio) - 40);
}})();
</script>
""",
                    unsafe_allow_html=True,
                )

            blocks = _ensure_doc_blocks(doc)
            char_options = {c["id"]: c.get("name") or c["id"] for c in st.session_state.characters}
            if NARRATOR_ID not in char_options:
                char_options[NARRATOR_ID] = "ト書き"

            if view_mode == "Bloques (voz)":
                st.caption(
                    f"{len(blocks)} bloque(s) · guion por hablante (VoiScripter). "
                    "Úsalos para exportar a VOICEROID / A.I.VOICE / CeVIO."
                )
                b_add1, b_add2, b_add3 = st.columns([2, 2, 1])
                with b_add1:
                    add_who = st.selectbox(
                        "Hablante nuevo",
                        list(char_options.keys()),
                        format_func=lambda k: char_options.get(k, k),
                        key=f"blk_add_who_{doc['id']}",
                    )
                with b_add2:
                    add_txt = st.text_input("Texto", key=f"blk_add_txt_{doc['id']}")
                with b_add3:
                    st.write("")
                    st.write("")
                    if st.button("＋", key=f"blk_add_{doc['id']}", use_container_width=True):
                        blocks.append(_new_block(add_who, add_txt))
                        doc["updated_at"] = _now()
                        st.session_state.active_tab = ti
                        st.session_state.status_msg = "Bloque añadido"
                        st.rerun()

                if find:
                    shown = [
                        (i, b)
                        for i, b in enumerate(blocks)
                        if find.lower() in str(b.get("text") or "").lower()
                        or find.lower() in _char_label(str(b.get("character_id") or "")).lower()
                    ]
                else:
                    shown = list(enumerate(blocks))

                for i, b in shown:
                    ch_id = str(b.get("character_id") or NARRATOR_ID)
                    r1, r2, r3, r4 = st.columns([2, 5, 1, 1])
                    with r1:
                        new_cid = st.selectbox(
                            "Quién",
                            list(char_options.keys()),
                            index=list(char_options.keys()).index(ch_id)
                            if ch_id in char_options
                            else 0,
                            format_func=lambda k: char_options.get(k, k),
                            key=f"blk_who_{doc['id']}_{b['id']}",
                        )
                    with r2:
                        new_txt = st.text_area(
                            "Diálogo",
                            value=str(b.get("text") or ""),
                            height=68,
                            key=f"blk_txt_{doc['id']}_{b['id']}",
                        )
                    with r3:
                        st.write("")
                        if st.button("↑", key=f"blk_up_{doc['id']}_{b['id']}", disabled=i <= 0):
                            blocks[i - 1], blocks[i] = blocks[i], blocks[i - 1]
                            doc["updated_at"] = _now()
                            st.rerun()
                        if st.button("↓", key=f"blk_dn_{doc['id']}_{b['id']}", disabled=i >= len(blocks) - 1):
                            blocks[i + 1], blocks[i] = blocks[i], blocks[i + 1]
                            doc["updated_at"] = _now()
                            st.rerun()
                    with r4:
                        st.write("")
                        if st.button("✕", key=f"blk_del_{doc['id']}_{b['id']}"):
                            blocks.pop(i)
                            doc["updated_at"] = _now()
                            st.rerun()
                    emo = st.text_input(
                        "Emoción",
                        value=str(b.get("emotion") or "normal"),
                        key=f"blk_emo_{doc['id']}_{b['id']}",
                    )
                    if new_cid != b.get("character_id") or new_txt != b.get("text") or emo != b.get("emotion"):
                        b["character_id"] = new_cid
                        b["text"] = new_txt
                        b["emotion"] = emo or "normal"
                        doc["updated_at"] = _now()
                        st.session_state.active_tab = ti

                if st.button(
                    "Volcar bloques → columna 2 (diálogo)",
                    key=f"blk_to_col_{doc['id']}",
                    use_container_width=True,
                ):
                    lines = []
                    for b in blocks:
                        who = _char_label(str(b.get("character_id") or ""))
                        txt = str(b.get("text") or "")
                        if str(b.get("character_id") or "") == NARRATOR_ID:
                            lines.append(txt)
                        else:
                            lines.append(f"{who}: {txt}")
                    cols = list(doc.get("columns") or [])
                    while len(cols) < 2:
                        cols.append("")
                    cols[1] = "\n".join(lines)
                    doc["columns"] = cols
                    doc["n_cols"] = max(int(doc.get("n_cols") or 2), 2)
                    doc["updated_at"] = _now()
                    st.session_state.status_msg = "Bloques volcados a columna 2"
                    st.rerun()

            elif view_mode == "Chat":
                if not blocks:
                    st.info("No hay bloques. Crea algunos en la vista Bloques (voz).")
                else:
                    filtered = blocks
                    if find:
                        filtered = [
                            b
                            for b in blocks
                            if find.lower() in str(b.get("text") or "").lower()
                            or find.lower() in _char_label(str(b.get("character_id") or "")).lower()
                        ]
                    st.markdown(_blocks_to_chat_html(filtered), unsafe_allow_html=True)
                    # Pasada por personaje (VoiScripter: comprobar diálogos de un personaje)
                    who_ids = list(char_options.keys())
                    pass_who = st.selectbox(
                        "Pasada por personaje",
                        ["(todos)"] + who_ids,
                        format_func=lambda k: "(todos)" if k == "(todos)" else char_options.get(k, k),
                        key=f"chat_pass_{doc['id']}",
                    )
                    if pass_who != "(todos)":
                        only = [b for b in blocks if str(b.get("character_id") or "") == pass_who]
                        st.subheader(_char_label(pass_who))
                        for b in only:
                            st.markdown(f"- {b.get('text') or ''}")

            else:
                # Columnas (Soro / otbedit) — MDXEditor o textarea clásico
                n = int(doc.get("n_cols") or DEFAULT_COLS)
                use_mdx = st.session_state.get("column_editor") != "classic"
                mdx_fn = _mdx_editor_fn() if use_mdx else None
                if use_mdx and mdx_fn is None:
                    st.warning(
                        "MDX Editor no está disponible en este slot (falta mdx_component). "
                        "Usando editor clásico."
                    )
                    use_mdx = False
                cols_ui = st.columns(n)
                updated_cols = []
                for ci, col in enumerate(cols_ui):
                    with col:
                        jumped = this_jump and int(this_jump["col"]) == ci
                        label = f"Columna {ci + 1}" + (
                            f" · ◀ L{int(this_jump['line']) + 1}" if jumped else ""
                        )
                        current = doc["columns"][ci] if ci < len(doc["columns"]) else ""
                        if use_mdx and mdx_fn is not None:
                            st.caption(label + " · MDX")
                            text = mdx_fn(
                                current,
                                height=420,
                                placeholder="# Título\n\nEscribe markdown…",
                                key=f"mdx_{doc['id']}_{ci}",
                                key_nonce=f"{doc['id']}_{ci}",
                            )
                        else:
                            text = st.text_area(
                                label,
                                value=current,
                                height=420,
                                key=f"col_{doc['id']}_{ci}",
                            )
                        if text != current:
                            st.session_state.active_tab = ti
                        if find:
                            hits = text.lower().count(find.lower()) if find else 0
                            st.caption(f"{len(text.splitlines())} líneas · {hits} coincidencias")
                        else:
                            st.caption(f"{len(text.splitlines())} líneas · {len(text)} chars")
                        updated_cols.append(text)
                doc["columns"] = updated_cols
                doc["n_cols"] = n
                doc["updated_at"] = _now()

                # Export texto plano alineado (Soro-style)
                if st.button("Exportar texto alineado", key=f"exp_{doc['id']}"):
                    st.session_state.active_tab = ti
                    _sync_line_counts(doc)
                    lines_per_col = [c.split("\n") for c in doc["columns"]]
                    max_l = max((len(x) for x in lines_per_col), default=0)
                    out_lines = []
                    for r in range(max_l):
                        row = []
                        for c in lines_per_col:
                            row.append(c[r] if r < len(c) else "")
                        out_lines.append(" | ".join(row))
                    st.code("\n".join(out_lines), language="text")

    st.markdown("---")
    st.caption(
        f"{APP_MARK} · otbedit · SoroEditor · Yohaku (outline) · "
        "VoiScripter · MDXEditor (@mdxeditor/editor). Proyecto Streamlit de l8."
    )


if __name__ == "__main__":
    main()
