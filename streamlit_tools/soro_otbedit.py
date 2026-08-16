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
# PNG para header/favicon (el SVG se recorta mal en el chrome de Streamlit)
ICON_PNG = "soro_otbedit_icon.png"
LOGO_PNG = "soro_otbedit_logo.png"
FAVICON_PNG = "soro_otbedit_favicon.png"
ICON_SVG = "soro_otbedit_icon.svg"
SORO_HEADER_MARK = "SORO_HEADER_PNG_V1"


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
    """Favicon de pestaña: preferir PNG pequeño."""
    return _asset(FAVICON_PNG, ICON_PNG, ICON_SVG) or "🧠"


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
        # Semilla estilo Soro (guion / columnas)
        st.session_state.docs[0]["columns"] = [
            "Escena\n1\n2\n3",
            "Acción / diálogo\nINT. OFICINA — DÍA\nProtagonista entra.\n— Hola.",
            "Notas\nEstablecer tono\nBeat emocional\nCortar si sobra",
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
    logo = _asset(LOGO_PNG, ICON_PNG, ICON_SVG)
    icon_small = _asset(ICON_PNG, FAVICON_PNG, LOGO_PNG, ICON_SVG)

    st.set_page_config(
        page_title=APP_TITLE,
        page_icon=favicon,
        layout="wide",
        initial_sidebar_state="expanded",
    )
    # Logo visible en sidebar y en la barra al colapsar (PNG, no SVG)
    try:
        if logo:
            st.logo(logo, size="large", icon_image=icon_small or logo)
    except TypeError:
        try:
            if logo:
                st.logo(logo, icon_image=icon_small or logo)
        except Exception:
            pass
    except Exception:
        pass

    _ensure_state()

    banner_src = icon_small or logo or favicon
    icon_data_uri = ""
    if banner_src and banner_src != "🧠":
        try:
            import base64
            import mimetypes

            raw = Path(banner_src).read_bytes()
            mime = mimetypes.guess_type(banner_src)[0] or "image/png"
            icon_data_uri = f"data:{mime};base64," + base64.b64encode(raw).decode("ascii")
        except Exception:
            icon_data_uri = ""

    banner_img = (
        f'<img class="soro-logo" src="{icon_data_uri}" width="32" height="32" alt="SoroOtbedit" />'
        if icon_data_uri
        else ""
    )

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
  .soro-banner .soro-logo {{
    width: 32px; height: 32px; display:block; flex: 0 0 auto;
    object-fit: contain;
  }}
  .soro-banner h1 {{ font-size: 1.35rem; margin: 0; }}
  .soro-banner span {{ color:#5b6b7a; font-size: 0.9rem; }}
  /* Evitar el recorte del chrome de Streamlit (solo se veía un fragmento) */
  [data-testid="stLogo"],
  [data-testid="stSidebarCollapsedControl"] {{
    overflow: visible !important;
  }}
  [data-testid="stLogo"] img,
  [data-testid="stSidebarCollapsedControl"] img,
  [data-testid="stHeader"] img[alt="Logo"],
  header img[alt="Logo"] {{
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    object-fit: contain !important;
    object-position: center !important;
    width: 2rem !important;
    height: 2rem !important;
    max-width: 2rem !important;
    max-height: 2rem !important;
    clip: auto !important;
    clip-path: none !important;
  }}
</style>
<div class="soro-banner">
  {banner_img}
  <h1>{APP_MARK}</h1>
  <span>tabs tipo otbedit · columnas alineadas tipo SoroEditor · Streamlit en servidor</span>
</div>
""",
        unsafe_allow_html=True,
    )

    # —— Sidebar: proyecto / archivos (otbedit) ——
    with st.sidebar:
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
        st.caption(st.session_state.status_msg)

    # —— Tabs de documentos (otbedit) ——
    titles = [d.get("title") or f"Doc {i+1}" for i, d in enumerate(st.session_state.docs)]
    tab_objs = st.tabs(titles)

    for ti, tab in enumerate(tab_objs):
        with tab:
            st.session_state.active_tab = ti
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
            with head_r:
                st.caption(f"Act. {doc.get('updated_at', '—')}")
                find = st.text_input("Buscar", key=f"find_{doc['id']}", placeholder="texto…")

            n = int(doc.get("n_cols") or DEFAULT_COLS)
            cols_ui = st.columns(n)
            updated_cols = []
            for ci, col in enumerate(cols_ui):
                with col:
                    label = f"Columna {ci + 1}"
                    text = st.text_area(
                        label,
                        value=doc["columns"][ci] if ci < len(doc["columns"]) else "",
                        height=420,
                        key=f"col_{doc['id']}_{ci}",
                    )
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
        f"{APP_MARK} · inspirado en otbedit (pestañas/guardar) y SoroEditor (columnas paralelas). "
        "Proyecto único Streamlit de la plataforma l8."
    )


if __name__ == "__main__":
    main()
