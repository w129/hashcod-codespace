# OCG OpencriptG - Full Project Handoff

Este paquete contiene la plataforma completa con carpetas y desarrollos:

- `app/`: interfaz principal, vault, tour, seguridad visual, estilos y herramientas.
- `data/`: catalogo criptografico, generadores e iconos.
- `scripts/`: self-test enterprise.
- `server.js`: servidor local endurecido.
- `index.html`: entrada principal.
- `package.json`: comando de arranque.
- `THIRD_PARTY_LICENSES/`: notas de licencias.
- `LEEME_*.txt`: documentacion de modulos y cambios.

## Ejecutar localmente

```bash
npm start
```

Luego abre:

```txt
http://127.0.0.1:2340
```

## Verificar

```bash
node scripts/enterprise-selftest.js
```

## Nota para v0

v0 normalmente genera proyectos Next.js desde prompts. Si quieres llevar este proyecto completo a v0/Vercel, sube el contenido como repo o copia las carpetas. Esta version es una app web local con React/Babel en navegador y servidor Node simple.

Para convertirla a Next.js production despues:

- mover `app/app.jsx`, `app/tour.jsx`, `app/vault.jsx`, `app/tech-info.jsx` a componentes React,
- mover `data/*.js` a imports ESM,
- reemplazar Babel standalone por build,
- eliminar `unsafe-inline` y `unsafe-eval` del CSP,
- servir assets desde `/public`.
