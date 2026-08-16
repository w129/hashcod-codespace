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
SORO_HEADER_MARK = "SORO_OUTLINE_V1"


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


def _now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def _new_doc(title: str = "Sin título", n_cols: int = DEFAULT_COLS) -> dict:
    n_cols = max(MIN_COLS, min(MAX_COLS, int(n_cols)))
    return {
        "id": uuid.uuid4().hex[:10],
        "title": title or "Sin título",
        "n_cols": n_cols,
        "columns": ["" for _ in range(n_cols)],
        "updated_at": _now(),
    }


def _ensure_state() -> None:
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
        "version": 1,
        "app": APP_MARK,
        "exported_at": _now(),
        "docs": st.session_state.docs,
        "templates": st.session_state.templates,
        "bookmarks": st.session_state.bookmarks,
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
        cleaned.append(
            {
                "id": d.get("id") or uuid.uuid4().hex[:10],
                "title": d.get("title") or "Sin título",
                "n_cols": n,
                "columns": cols,
                "updated_at": d.get("updated_at") or _now(),
            }
        )
    if not cleaned:
        cleaned = [_new_doc()]
    st.session_state.docs = cleaned
    st.session_state.active_tab = 0
    if isinstance(data.get("templates"), dict):
        st.session_state.templates = {str(k): str(v) for k, v in data["templates"].items()}
    if isinstance(data.get("bookmarks"), list):
        st.session_state.bookmarks = [str(x) for x in data["bookmarks"] if str(x).strip()]
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
  <span>tabs tipo otbedit · columnas alineadas tipo SoroEditor · Streamlit en servidor</span>
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

            this_jump = (
                jump
                if jump and jump.get("doc_id") == doc.get("id")
                else None
            )
            if this_jump:
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

            n = int(doc.get("n_cols") or DEFAULT_COLS)
            cols_ui = st.columns(n)
            updated_cols = []
            for ci, col in enumerate(cols_ui):
                with col:
                    jumped = this_jump and int(this_jump["col"]) == ci
                    label = f"Columna {ci + 1}" + (f" · ◀ L{int(this_jump['line']) + 1}" if jumped else "")
                    text = st.text_area(
                        label,
                        value=doc["columns"][ci] if ci < len(doc["columns"]) else "",
                        height=420,
                        key=f"col_{doc['id']}_{ci}",
                    )
                    if text != (doc["columns"][ci] if ci < len(doc["columns"]) else ""):
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
        f"{APP_MARK} · inspirado en otbedit, SoroEditor y Yohaku (outline). "
        "Proyecto único Streamlit de la plataforma l8."
    )


if __name__ == "__main__":
    main()
