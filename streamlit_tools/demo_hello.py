import streamlit as st

st.set_page_config(page_title="l8 Streamlit Demo", page_icon="🟢", layout="centered")

st.title("l8 · Streamlit Dock")
st.caption("Herramienta demo en el círculo del dock inferior.")

name = st.text_input("Tu nombre", value="Hashcod")
a = st.number_input("Número A", value=12.0)
b = st.number_input("Número B", value=8.0)
op = st.selectbox("Operación", ["sumar", "restar", "multiplicar", "dividir"])

if st.button("Calcular", type="primary"):
    if op == "sumar":
        result = a + b
    elif op == "restar":
        result = a - b
    elif op == "multiplicar":
        result = a * b
    else:
        result = (a / b) if b != 0 else "∞"
    st.success(f"Hola {name}: resultado = {result}")

st.info("Edita este código desde el slot del dock o pega tu propia app Streamlit.")
