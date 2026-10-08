"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  os = require("node:os"),
  path = require("node:path");
const root = path.resolve(__dirname, "../.."),
  build = path.join(root, "center-empty-state-build"),
  temp = fs.mkdtempSync(path.join(os.tmpdir(), "hsc-preview-"));
try {
  require(path.join(build, "node_modules/esbuild")).buildSync({
    stdin: {
      contents: "import React from 'react';import{renderToStaticMarkup}from'react-dom/server';import Preview from './skill-chat/Preview';export const render=(content,ext)=>renderToStaticMarkup(<Preview content={content} ext={ext}/>);",
      resolveDir: build,
      loader: "jsx",
    },
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    outfile: path.join(temp, "fixture.cjs"),
    define: { "process.env.NODE_ENV": '"production"' },
  });
  const { render } = require(path.join(temp, "fixture.cjs"));
  const md = render("# Hola\n\n**Texto** y *énfasis*\n\n- Uno\n- Dos\n\n| Nombre | Estado |\n| --- | --- |\n| Archivo | Listo |\n\n```dart\nprint('hola');\n```", "md");
  for (const tag of ["h1", "strong", "em", "ul", "table", "pre", "code"])
    assert.match(md, new RegExp(`<${tag}(?:>| )`), `Markdown did not render ${tag}`);
  assert.match(md, /<h1>Hola<\/h1>/);
  assert.match(render("#hola", "md"), /<p>#hola<\/p>/, "Invalid heading syntax was silently rewritten");
  const hostile = render('<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n[click](javascript:alert%281%29)\n\n![secret](https://foreign.test/pixel)\n\n![svg](data:image/svg+xml;base64,PHN2Zz4=)', "md");
  assert.doesNotMatch(hostile, /<(?:script|img|iframe)|href="javascript:|src="data:/i);
  const link = render("[Ayuda](https://example.com/help)", "md");
  assert.match(link, /rel="noopener noreferrer"/);
  assert.match(link, /target="_blank"/);
  const credentialLink = render("[Privado](https://user:password@example.com/)", "md");
  assert.doesNotMatch(credentialLink, /href=/);
  const yaml = render('nombre: "Registro"\nactivo: true\nvalor: null\ndatos:\n  lista:\n    - 42\n    - "<img src=x onerror=alert(1)>"\n__proto__: seguro', "yaml");
  assert.match(yaml, /Datos YAML/);
  assert.match(yaml, /Registro/);
  assert.match(yaml, /booleano/);
  assert.match(yaml, /nulo/);
  assert.match(yaml, /número/);
  assert.match(yaml, /__proto__/);
  assert.doesNotMatch(yaml, /<img/);
  assert.equal({}.seguro, undefined);
  for (const input of ['dato: [', 'dato: 1\ndato: 2', 'a: &a [1]\nb: *a'])
    assert.match(render(input, "yaml"), /No se pudo representar el YAML/);
  assert.match(render("[".repeat(26) + "1" + "]".repeat(26), "yaml"), /No se pudo representar el YAML/);
  assert.match(render("- 1\n".repeat(2001), "yaml"), /No se pudo representar el YAML/);
  assert.match(render("? [one, two]\n: value", "yaml"), /No se pudo representar el YAML/);
  assert.match(render("# Título", "yml"), /Archivo vacío|Datos YAML/);
  for (const ext of ["coffee", "dart"]) {
    const code = render('<script>alert(1)</script>\n# hola', ext);
    assert.match(code, /hsc-highlight/);
    assert.doesNotMatch(code, /<script|<h1/);
    assert.match(code, /&lt;script&gt;/);
  }
  assert.match(render("# Grande\n" + "x".repeat(65537), "md"), /demasiado grande/);
  assert.match(render("", "md"), /Archivo vacío/);
  assert.match(render("{}", "yaml"), /Objeto vacío/);
  assert.match(render("[]", "yaml"), /Lista vacía/);
  console.log("Skill preview: real Markdown/GFM, standard heading syntax, safe links/images, typed YAML, invalid/aliased YAML, escaped code and bounded/empty files OK");
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
