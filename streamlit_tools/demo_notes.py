import streamlit as st
from datetime import date

st.set_page_config(page_title="l8 · Notas", page_icon="📝", layout="centered")
st.title("l8 · Bloc rápido")
st.caption("Formulario demo para capturar notas en el dock.")

with st.form("nota"):
    titulo = st.text_input("Título", value="Idea de herramienta")
    cuerpo = st.text_area("Nota", height=160, placeholder="Escribe aquí…")
    prioridad = st.select_slider("Prioridad", options=["baja", "media", "alta"], value="media")
    cuando = st.date_input("Fecha", value=date.today())
    ok = st.form_submit_button("Guardar nota", type="primary")

if ok:
    st.success("Nota registrada en esta sesión Streamlit.")
    st.json({
        "titulo": titulo,
        "prioridad": prioridad,
        "fecha": str(cuando),
        "chars": len(cuerpo or ""),
        "preview": (cuerpo or "")[:120],
    })
else:
    st.info("Completa el formulario y pulsa Guardar nota.")
