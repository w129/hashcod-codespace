"use strict";
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  http = require("node:http");
const { chromium } = require("playwright");
const root = path.resolve(__dirname, "../.."),
  build = path.join(root, "center-empty-state-build"),
  temp = fs.mkdtempSync(path.join(os.tmpdir(), "hsc-browser-"));
require(path.join(build, "node_modules/esbuild")).buildSync({
  stdin: {
    contents:
      "import React,{useState} from 'react';import{createRoot}from'react-dom/client';import SkillChat from './SkillChat';function Fixture(){const[open,setOpen]=useState(false);return <><button id='slot3' onClick={()=>setOpen(true)}>Abrir editor</button>{open&&<SkillChat onClose={()=>setOpen(false)}/>}</>;}createRoot(document.getElementById('root')).render(<Fixture/>);",
    resolveDir: build,
    loader: "jsx",
  },
  bundle: true,
  minify: true,
  format: "iife",
  jsx: "automatic",
  outfile: path.join(temp, "fixture.js"),
  define: { "process.env.NODE_ENV": '"production"' },
});
const sid = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  pid = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const commands = [
  {
    name: "skill",
    kind: "package",
    desc: "Crea un skill",
    usage: "/skill <nombre>",
  },
  {
    name: "code",
    kind: "content",
    desc: "Añade código",
    usage: "/code <lenguaje>\\n<código>",
  },
  {
    name: "open",
    kind: "file",
    desc: "Abre un archivo",
    usage: "/open <archivo>",
  },
  {
    name: "publish",
    kind: "system",
    desc: "Publica el paquete",
    usage: "/publish",
  },
];
(async () => {
  const server = http.createServer((req, res) => {
    if (req.url === "/fixture.js" || req.url === "/fixture.css") {
      res.setHeader(
        "Content-Type",
        req.url.endsWith(".css") ? "text/css" : "text/javascript",
      );
      return res.end(fs.readFileSync(path.join(temp, req.url)));
    }
    res.setHeader("Content-Type", "text/html");
    res.end(
      '<html lang="es"><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/fixture.css"></head><body><main id="root"></main><footer></footer><script src="/fixture.js"></script></body></html>',
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const base = `http://127.0.0.1:${server.address().port}`;
  server.unref();
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }
      : {}),
    ...(process.env.CHROMIUM_ARGS_JSON
      ? { args: JSON.parse(process.env.CHROMIUM_ARGS_JSON) }
      : {}),
  });
  try {
    for (const viewport of [
      { width: 390, height: 844 },
      { width: 1440, height: 900 },
    ]) {
      const page = await browser.newPage({ viewport, acceptDownloads: true });
      let executions = [],
        keys = 0,
        imports = 0,
        published = 0,
        registryImports = 0,
        conflict = false,
        jobPolls = 0,
        unavailable = false;
      const errors = [];
      page.on("pageerror", (e) => errors.push(e.message));
      let state = {
        sessionId: sid,
        projectId: pid,
        revision: 0,
        pkg: null,
        files: [],
        folders: [],
        activeFile: null,
        activeTool: null,
        pendingConfirm: null,
        messages: [],
        versions: [],
      };
      const changed = (input, message) => {
        state.revision++;
        if (input) state.messages.push({ role: "user", content: input });
        if (message) state.messages.push({ role: "system", content: message });
        return { ok: true, state: structuredClone(state) };
      };
      await page.route("**/api/skill-chat/**", async (route) => {
        const req = route.request(),
          url = new URL(req.url()),
          method = req.method();
        let data;
        if (method !== "GET") {
          assert.equal(req.headers()["x-hashcod-skill-csrf"], "fixture-csrf");
          assert.equal(req.headers()["x-requested-with"], "XMLHttpRequest");
        }
        if (url.pathname.endsWith("/bootstrap") && unavailable) {
          unavailable = false;
          return route.fulfill({
            status: 503,
            json: { ok: false, error: "Servicio temporalmente no disponible." },
          });
        }
        if (url.pathname.endsWith("/bootstrap"))
          data = {
            ok: true,
            csrf: "fixture-csrf",
            commands,
            projects: [],
            sessions: [
              {
                id: sid,
                projectId: pid,
                name: "Mi paquete",
                updatedAt: new Date().toISOString(),
              },
            ],
            config: {
              models: [
                {
                  id: "claude-sonnet-5-5",
                  inputUsdPerMillion: 2,
                  outputUsdPerMillion: 10,
                },
              ],
              scope: "Markdown · YAML · CoffeeScript · Dart",
            },
          };
        else if (url.pathname.endsWith("/state")) {
          if (state.jobs?.[0]?.status === "queued") {
            jobPolls++;
            state.jobs[0] = {
              ...state.jobs[0],
              status: "completed",
              message: "Compilación terminada. <img onerror=alert(1)>",
            };
          }
          data = { ok: true, state: structuredClone(state) };
        } else if (url.pathname.endsWith("/exec")) {
          const body = req.postDataJSON();
          assert.equal(body.revision, state.revision);
          assert(!("apiKey" in body));
          executions.push(body.input);
          if (body.input.startsWith("/skill")) {
            state.pkg = {
              kind: "skill",
              name: "prueba",
              description: "Paquete de prueba",
            };
            state.files = [
              {
                path: "SKILL.md",
                ext: "md",
                content: "# Mi skill\n<img src=x onerror=alert(1)>",
              },
            ];
            state.activeFile = "SKILL.md";
          }
          if (body.input.startsWith("/code"))
            state.files[0].content += "\n" + body.input;
          if (body.input.startsWith("/open "))
            state.activeFile = body.input.slice(6);
          if (body.input === "/publish")
            state.pendingConfirm = { command: "publish", args: "" };
          if (body.input === "/yes") {
            assert(state.pendingConfirm);
            state.pendingConfirm = null;
            published++;
          }
          if (body.input === "/compile")
            state.jobs = [
              { id: "job-fixture", type: "compile", status: "queued" },
            ];
          if (body.input === "/save")
            state.versions.push({
              number: 1,
              createdAt: new Date().toISOString(),
            });
          data = changed(
            body.input,
            body.input === "/yes" ? "Paquete publicado." : "Acción completada.",
          );
          if (body.input === "/compile") data.job = state.jobs[0];
        } else if (url.pathname.endsWith("/file")) {
          const body = req.postDataJSON();
          if (conflict) {
            conflict = false;
            state.revision++;
            return route.fulfill({
              status: 409,
              json: {
                ok: false,
                error:
                  "Hay una versión más reciente. Revisa tus cambios antes de guardar.",
              },
            });
          }
          assert.equal(body.revision, state.revision);
          state.files.find((f) => f.path === body.path).content = body.content;
          data = changed(null, "Archivo guardado.");
        } else if (url.pathname.endsWith("/import")) {
          const body = req.postDataJSON();
          assert.equal(body.name, "nota.md");
          assert.equal(body.content, "# Nota importada");
          state.files.push({
            path: body.name,
            ext: "md",
            content: body.content,
          });
          state.activeFile = body.name;
          imports++;
          data = changed(null, "Archivo importado.");
        } else if (url.pathname.endsWith("/ai")) {
          if (method === "POST") {
            keys++;
            assert.equal(req.postDataJSON().consent, true);
            return route.fulfill({
              status: 403,
              json: { ok: false, error: "API key incorrecta." },
            });
          }
          data = { ok: true };
        } else if (url.pathname.endsWith("/registry") && method === "GET")
          data = {
            ok: true,
            items: [
              {
                id: "registry-fixture",
                name: "Skill publicado",
                kind: "skill",
                version: "1.0.0",
                description: "Una copia del catálogo.",
              },
            ],
          };
        else if (url.pathname.endsWith("/registry")) {
          assert.equal(req.postDataJSON().id, "registry-fixture");
          registryImports++;
          data = changed(null, "Copia importada.");
        } else if (url.pathname.endsWith("/events-token"))
          return route.fulfill({
            status: 503,
            json: { ok: false, error: "Canal temporalmente ocupado." },
          });
        else if (url.pathname.endsWith("/export"))
          return route.fulfill({
            contentType: "application/zip",
            body: Buffer.from(
              "504b0506000000000000000000000000000000000000",
              "hex",
            ),
          });
        else
          throw Error(
            "Unexpected fixture route " + method + " " + url.pathname,
          );
        return route.fulfill({ json: data });
      });
      await page.goto(base);
      await page.getByRole("button", { name: "Abrir editor" }).click();
      const dialog = page.locator("#d5SkillChat"),
        draft = page.getByRole("combobox", {
          name: "Comando o texto del editor",
        });
      await draft.waitFor();
      await draft.fill("/");
      await page.locator(".hsc-command-menu [role=option]").first().waitFor();
      await draft.press("ArrowDown");
      assert.equal(
        await page
          .locator(".hsc-command-menu [aria-selected=true] strong")
          .textContent(),
        "/code",
      );
      await draft.press("ArrowUp");
      await draft.press("Enter");
      assert.equal(await draft.inputValue(), "/skill ");
      await draft.fill("/skill prueba");
      await draft.press("Enter");
      await page.getByText("Acción completada.", { exact: true }).waitFor();
      if (viewport.width < 700)
        await page.getByRole("button", { name: "Editor", exact: true }).click();
      const editor = page.getByRole("textbox", {
        name: "Contenido del archivo activo",
      });
      await page.waitForFunction(
        () => document.querySelector('[aria-label="Contenido del archivo activo"]')?.value.includes("<img"),
      );
      assert.match(await editor.inputValue(), /<img/);
      await page
        .getByRole("button", { name: "Vista previa", exact: true })
        .click();
      await page.locator(".hsc-highlight").waitFor();
      assert.equal(await dialog.locator("img").count(), 0);
      await page.getByRole("button", { name: "Editar", exact: true }).click();
      await editor.fill(
        "# Edición real\nContenido con <script>alert(1)</script>",
      );
      await editor.press("Control+s");
      await page
        .locator(".hsc-notice")
        .filter({ hasText: "Archivo guardado." })
        .waitFor();
      assert.match(state.files[0].content, /Edición real/);
      assert.equal(await dialog.locator("script").count(), 0);
      conflict = true;
      await editor.fill("# Cambios conservados");
      await page
        .getByRole("button", { name: "Guardar archivo", exact: true })
        .click();
      await page.getByRole("alert").waitFor();
      assert.equal(await editor.inputValue(), "# Cambios conservados");
      await page
        .getByRole("button", { name: "Guardar archivo", exact: true })
        .click();
      await page.getByRole("alert").waitFor({ state: "detached" });
      if (viewport.width < 700)
        await page.getByRole("button", { name: "Chat", exact: true }).click();
      await draft.fill("/code coffee");
      await draft.press("Enter");
      await draft.type("return 1");
      assert.match(await draft.inputValue(), /\nreturn 1/);
      assert.equal(executions.filter((s) => s.startsWith("/code")).length, 0);
      await draft.press("Control+Enter");
      await page.waitForFunction(
        () =>
          document.querySelector('[aria-label="Comando o texto del editor"]')
            .value === "",
      );
      assert.match(executions.at(-1), /^\/code coffee\nreturn 1$/);
      await draft.fill("@");
      await page.getByRole("option", { name: /SKILL.md/ }).waitFor();
      await draft.press("Enter");
      assert.equal(await draft.inputValue(), "@SKILL.md ");
      await draft.fill("");
      const importedResponse = page.waitForResponse(
        (response) =>
          new URL(response.url()).pathname.endsWith("/import") &&
          response.status() === 200,
      );
      await page
        .locator(".hsc-composer input[type=file]")
        .setInputFiles({
          name: "nota.md",
          mimeType: "text/markdown",
          buffer: Buffer.from("# Nota importada"),
        });
      await importedResponse;
      await page.waitForFunction(
        () =>
          document.querySelector('[aria-label="Contenido del archivo activo"]')
            .value === "# Nota importada",
      );
      await page
        .getByRole("textbox", { name: "Contenido del archivo activo" })
        .waitFor();
      assert.equal(imports, 1);
      assert.equal(await editor.inputValue(), "# Nota importada");
      await page.getByRole("button", { name: "Ajustes de IA" }).click();
      await page
        .getByLabel("API key de Anthropic")
        .fill("sk-ant-synthetic-test-1234567890");
      assert.equal(
        await page
          .getByRole("button", { name: "Validar clave", exact: true })
          .isDisabled(),
        true,
      );
      await page.locator(".hsc-consent input").check();
      await page
        .getByRole("button", { name: "Validar clave", exact: true })
        .click();
      await page.getByRole("alert").waitFor();
      assert.equal(
        await page.getByLabel("API key de Anthropic").inputValue(),
        "",
      );
      assert.equal(keys, 1);
      assert.equal(
        await page.evaluate(() =>
          Object.keys(localStorage).some((k) => /key|skill|token/i.test(k)),
        ),
        false,
      );
      await page.getByRole("button", { name: "Ajustes de IA" }).click();
      unavailable = true;
      await page
        .getByRole("button", { name: "Reconectar", exact: true })
        .click();
      await page
        .getByText("Servicio temporalmente no disponible.", { exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Reconectar", exact: true })
        .click();
      await page.getByRole("alert").waitFor({ state: "detached" });
      const downloadPromise = page.waitForEvent("download");
      await page
        .getByRole("button", { name: "Descargar ZIP", exact: true })
        .click();
      const download = await downloadPromise;
      assert.equal(download.suggestedFilename(), "prueba.zip");
      await page.getByRole("button", { name: "Catálogo", exact: true }).click();
      await page
        .getByRole("button", { name: "Importar paquete", exact: true })
        .click();
      await page
        .getByText("Copia importada.", { exact: true })
        .waitFor({ state: "attached" });
      assert.equal(registryImports, 1);
      if (viewport.width < 700)
        await page.getByRole("button", { name: "Chat", exact: true }).click();
      await draft.fill("/publish");
      await page
        .getByRole("button", { name: "Enviar comando", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Confirmar", exact: true })
        .waitFor();
      assert.equal(published, 0);
      await page
        .getByRole("button", { name: "Confirmar", exact: true })
        .click();
      await page.getByText("Paquete publicado.", { exact: true }).waitFor();
      assert.equal(published, 1);
      await draft.fill("/compile");
      await page
        .getByRole("button", { name: "Enviar comando", exact: true })
        .click();
      await page
        .locator(".hsc-job")
        .getByText("Completada", { exact: true })
        .waitFor();
      assert.equal(jobPolls, 1);
      assert.equal(await dialog.locator("img").count(), 0);
      const box = await dialog.boundingBox();
      assert(
        box.x >= 0 &&
          box.y >= 0 &&
          box.x + box.width <= viewport.width &&
          box.y + box.height <= viewport.height,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
      );
      assert.deepEqual(errors, []);
      if (process.env.SKILL_SCREENSHOT_DIR) {
        fs.mkdirSync(process.env.SKILL_SCREENSHOT_DIR, { recursive: true });
        await page.screenshot({
          path: path.join(
            process.env.SKILL_SCREENSHOT_DIR,
            `skill-chat-${viewport.width}.png`,
          ),
        });
      }
      await page
        .getByRole("button", { name: "Cerrar editor de skills" })
        .click();
      await dialog.waitFor({ state: "detached" });
      assert.equal(
        await page
          .locator("#slot3")
          .evaluate((n) => document.activeElement === n),
        true,
      );
      await page.locator("#slot3").click();
      await draft.waitFor();
      assert.equal(state.files.length, 2);
      await page
        .getByRole("button", { name: "Cerrar editor de skills" })
        .click();
      console.log(
        `Skill editor ${viewport.width}: keyboard commands, multiline, edit/conflict, XSS, import/export, BYOK clearing, publication, registry, owned job polling, reconnect, persistence, focus and layout passed.`,
      );
    }
  } finally {
    await browser.close();
    server.close();
    fs.rmSync(temp, { recursive: true, force: true });
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
