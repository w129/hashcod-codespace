import streamlit as st
import pandas as pd
import numpy as np

st.set_page_config(page_title="l8 · Charts", page_icon="📈", layout="wide")
st.title("l8 · Charts")
st.caption("Demo de gráficos para el dock Streamlit.")

n = st.slider("Puntos", 20, 200, 80)
seed = st.number_input("Semilla", value=7, step=1)
rng = np.random.default_rng(int(seed))
df = pd.DataFrame({
    "x": np.arange(n),
    "serie_a": np.cumsum(rng.normal(0, 1, n)),
    "serie_b": np.cumsum(rng.normal(0, 1.4, n)),
})

c1, c2 = st.columns(2)
with c1:
    st.subheader("Líneas")
    st.line_chart(df.set_index("x"))
with c2:
    st.subheader("Área")
    st.area_chart(df.set_index("x")[["serie_a"]])

st.dataframe(df.tail(12), use_container_width=True)
