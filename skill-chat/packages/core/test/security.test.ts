import { describe, it, expect } from "vitest";
import {
  createContext,
  executeCommand,
  updateFile,
  addFile,
  assertContext,
  assertSnapshot,
  assertPackage,
  buildPackage,
  importPackage,
  blocksToMd,
  toolCoffee,
  toolDart,
  validatePackage,
  parse,
  LIMITS,
  rejectDangerous,
} from "../src/index.js";
import type { Package, ToolDef, Context } from "../src/index.js";
const apply = (ctx: Context, inputs: string[]) =>
  inputs.reduce((c, input) => executeCommand(c, input).context, ctx);
const full = () =>
  apply(createContext(), [
    "/skill good",
    "/desc A useful skill that executes only when the user requests this specific task.",
    "/trigger hello",
    "/text follow instructions",
    "/tool check",
    "/param input:string!",
  ]);
describe("boundary validation", () => {
  it("rejects stale active references, invalid extensions and all path conflicts", () => {
    const ctx = createContext();
    for (const change of [
      { activeFile: "lost.md" },
      { activeTool: "lost" },
      { files: [{ path: "bad.md", ext: "dart", content: "" }] },
      {
        files: [{ path: "a.md", ext: "md", content: "" }],
        folders: ["a.md/sub"],
      },
    ])
      expect(() => assertContext({ ...ctx, ...change })).toThrow();
    expect(() => assertContext({ ...ctx, extra: true })).toThrow();
    expect(
      executeCommand(
        {
          ...ctx,
          files: [{ path: "a.md", ext: "wrong", content: "" }],
        } as unknown as Context,
        "/help",
      ).message,
    ).toContain("Estado inválido");
    expect(() =>
      rejectDangerous(Object.create({ privileged: true })),
    ).toThrow();
    const deep: any = {};
    let pointer = deep;
    for (let i = 0; i < 22; i++) {
      pointer.child = {};
      pointer = pointer.child;
    }
    expect(() => rejectDangerous(deep)).toThrow();
    expect(() => parse(" ")).toThrow();
  });
  it("limits file count, bytes and total project bytes including model", () => {
    const files = Array.from({ length: 201 }, (_, i) => ({
      path: `f${i}.md`,
      ext: "md" as const,
      content: "",
    }));
    expect(() => assertSnapshot({ ...createContext(), files })).toThrow(); // strict Snapshot ignores context fields only by rejecting
    expect(() =>
      assertSnapshot({
        pkg: null,
        files,
        folders: [],
        activeFile: null,
        activeTool: null,
      }),
    ).toThrow();
    const big = Array.from({ length: 17 }, (_, i) => ({
      path: `f${i}.md`,
      ext: "md" as const,
      content: "a".repeat(LIMITS.fileBytes),
    }));
    expect(() =>
      assertSnapshot({
        pkg: null,
        files: big,
        folders: [],
        activeFile: null,
        activeTool: null,
      }),
    ).toThrow();
    expect(() =>
      addFile(createContext(), "x.md", "a".repeat(LIMITS.fileBytes + 1)),
    ).toThrow();
    expect(() => addFile(createContext(), "x.html", "x")).toThrow();
    let ctx = addFile(createContext(), "docs/new.md", "hello");
    expect(ctx.folders).toContain("docs");
    expect(() => addFile(ctx, "docs/new.md", "other")).toThrow();
    ctx = executeCommand(ctx, "/delete").context;
    expect(() => addFile(ctx, "blocked.md", "x")).toThrow();
    expect(() => updateFile(ctx, "docs/new.md", "x")).toThrow();
  });
  it("rejects unsafe imports, aliases, tags, arrays, duplicate keys and unbounded metadata", () => {
    for (const yaml of [
      "[]",
      "hello",
      "name: a\nname: b",
      "name: a\ndescription: d\nconstructor: x",
      "name: !!js/function function",
      "name: a\ndescription: &a hello\ninstructions: *a",
      "name: a\ndescription: d\nvariables:\n  prototype: x",
    ])
      expect(() => importPackage("role.yaml", yaml), yaml).toThrow();
    expect(() => importPackage("SKILL.md", "no frontmatter")).toThrow();
    expect(() =>
      importPackage(
        "skill.md",
        "---\nname: safe\ndescription: d\ntools: []\n---\n",
      ),
    ).toThrow();
    expect(() => importPackage("a.coffee", "anything")).toThrow();
    expect(() =>
      assertPackage({ ...full().pkg!, description: "<injection>" }),
    ).toThrow();
    expect(() =>
      assertPackage({ ...full().pkg!, name: "constructor" }),
    ).toThrow();
  });
});
describe("command error branches", () => {
  it("every noarg, typed argument and required-context gate rejects cleanly", () => {
    const empty = createContext();
    for (const input of [
      "/yes",
      "/no",
      "/undo",
      "/redo",
      "/desc x",
      "/delete",
      "/text words",
      "/tool nope",
      "/param x:string!",
      "/save extra",
      "/help unknown",
      "/new bad.xyz",
      "/open missing.md",
      "/compile",
      "/export zip",
      "/diff",
      "/restore 1",
    ]) {
      const r = executeCommand(empty, input);
      expect(r.changed, input).toBe(false);
      expect(r.context.pkg).toBeNull();
    }
    const ctx = full();
    for (const input of [
      "/model x",
      "/allow tool",
      "/attach other",
      "/detach other",
      "/var currency=DOP",
      "/param input:string!",
      "/run missing {}",
      "/run check []",
      "/run check invalid",
      "/move 1 2",
      "/del 50",
      "/edit 50 new",
      "/mkdir docs extra",
    ])
      expect(executeCommand(ctx, input).changed, input).toBe(false);
    expect(executeCommand(createContext(), "/ls").message).toBe(
      "No hay archivos",
    );
    expect(executeCommand(createContext(), "/tree").message).toBe(
      "No hay archivos",
    );
    expect(executeCommand(createContext(), "/history").message).toBe(
      "Sin historial",
    );
    expect(executeCommand(createContext(), "/preview").message).toContain(
      "Selecciona",
    );
    expect(executeCommand(createContext(), "/help").message).toContain(
      "/publish",
    );
  });
  it("file conflicts and package-kind restrictions preserve input", () => {
    let ctx = apply(createContext(), ["/new a.md", "/new b.md", "/mkdir docs"]);
    for (const input of [
      "/rename a.md",
      "/dup a.md",
      "/mv lost.md docs",
      "/mv b.md absent",
      "/name Upper",
      "/ext html",
      "/mkdir b.md/sub",
    ])
      expect(executeCommand(ctx, input).changed, input).toBe(false);
    ctx = executeCommand(ctx, "/mv b.md docs").context;
    ctx = executeCommand(ctx, "/new b.md").context;
    expect(executeCommand(ctx, "/mv b.md docs").changed).toBe(false);
    ctx = apply(createContext(), ["/role owner", "/desc Short"]);
    for (const input of ["/trigger hello", "/tool check", "/param x:string!"])
      expect(executeCommand(ctx, input).changed).toBe(false);
    ctx = apply(full(), [
      "/hr",
      "/example a => b",
      "/list x\ny",
      "/code js\nhello",
    ]);
    expect(executeCommand(ctx, "/edit 2 something").changed).toBe(false);
    expect(executeCommand(ctx, "/edit 3 nope").changed).toBe(false);
    ctx = apply(ctx, ["/edit 3 c => d", "/edit 4 a\nb", "/edit 5 code"]);
    expect(ctx.pkg!.instructions[2]).toMatchObject({
      type: "example",
      input: "c",
      output: "d",
    });
  });
  it("validation blocks build/publish and validates duplicated metadata", () => {
    let ctx = executeCommand(createContext(), "/skill incomplete").context;
    expect(
      executeCommand(ctx, "/validate").issues?.some((i) => i.level === "error"),
    ).toBe(true);
    expect(executeCommand(ctx, "/build").changed).toBe(false);
    expect(executeCommand(ctx, "/publish").changed).toBe(false);
    const invalid = { ...full().pkg!, version: "bad" } as Package;
    expect(validatePackage(invalid)[0].field).toBe("version");
    const skill = full().pkg!;
    if (skill.kind !== "skill") throw new Error();
    skill.tools.push(structuredClone(skill.tools[0]));
    skill.tools[0].params.push(structuredClone(skill.tools[0].params[0]));
    skill.references.push({ path: "bad.txt", content: "" });
    skill.triggers.push("hello");
    expect(
      validatePackage(skill).filter((i) => i.level === "error"),
    ).toHaveLength(4);
    expect(
      validatePackage({
        ...skill,
        description: "tiny",
        instructions: [],
      }).filter((i) => i.level === "warning"),
    ).toHaveLength(2);
  });
});
describe("generator escaping and source edits", () => {
  it("escapes executable metadata and accepts all parameter types", () => {
    const tool: ToolDef = {
      name: "check_safe",
      description: 'line\n"quote"\' #{process.exit()} $secret\\tail',
      params: [
        { name: "text", type: "string", required: true },
        { name: "count", type: "number", required: false },
        { name: "enabled", type: "boolean", required: true },
        { name: "data", type: "object", required: false },
      ],
      body: {},
    };
    const c = toolCoffee(tool),
      d = toolDart(tool);
    expect(c).toContain("\\#{process.exit()}");
    expect(c).toContain("\\n");
    expect(d).toContain("\\$secret");
    expect(d).toContain("is! Map<String, dynamic>");
    expect(d).toContain("class CheckSafeTool");
    expect(c).toContain("not Array.isArray");
    const fenced = blocksToMd([
      { type: "code", lang: "md", content: "inside ``` and ````" },
    ]);
    expect(fenced).toContain("`````md");
    expect(blocksToMd([{ type: "quote", text: "a\nb" }])).toBe("> a\n> b");
  });
  it("updates roles, skills, references, dart full files and unknown file errors", () => {
    let ctx = apply(createContext(), [
      "/role editor",
      "/desc A role that handles precise operations when the user asks to edit a document.",
      "/text body",
      "/build",
    ]);
    ctx = updateFile(
      ctx,
      "role.yaml",
      ctx.files[0].content.replace("name: editor", "name: changed"),
    );
    expect(ctx.pkg?.name).toBe("changed");
    expect(() => updateFile(ctx, "lost.md", "x")).toThrow();
    ctx = executeCommand(full(), "/build").context;
    ctx = updateFile(
      ctx,
      "SKILL.md",
      ctx.files[0].content.replace("name: good", "name: changed"),
    );
    expect(ctx.pkg?.kind === "skill" && ctx.pkg.tools).toHaveLength(1);
    ctx = updateFile(
      ctx,
      "scripts/check.dart",
      "class CheckTool { Map<String, dynamic> run(Map<String,dynamic> args) => args; }",
    );
    expect(buildPackage(ctx.pkg!).find((f) => f.ext === "dart")?.content).toBe(
      ctx.files.find((f) => f.ext === "dart")?.content,
    );
    if (ctx.pkg?.kind !== "skill") throw new Error();
    ctx.pkg.references = [{ path: "guide.md", content: "guide" }];
    ctx = executeCommand(ctx, "/build").context;
    ctx = updateFile(ctx, "references/guide.md", "updated");
    expect(ctx.pkg?.kind === "skill" && ctx.pkg.references[0].content).toBe(
      "updated",
    );
    expect(executeCommand(ctx, "/compile").job?.type).toBe("compile");
    expect(
      executeCommand(ctx, '/run check dart {"input":"x"}').job?.payload.lang,
    ).toBe("dart");
    ctx = executeCommand(ctx, "/open scripts/check.dart").context;
    expect(executeCommand(ctx, "/run check").job?.payload.lang).toBe("dart");
  });
  it("imports existing owned files and previews no-file packages", () => {
    const pkg = full().pkg!;
    let ctx = addFile(
      createContext(),
      "input.md",
      buildPackage(pkg)[0].content,
    );
    ctx = executeCommand(ctx, "/import input.md").context;
    expect(ctx.pkg?.name).toBe("good");
    expect(executeCommand(ctx, "/import missing.md").changed).toBe(false);
    expect(executeCommand(full(), "/preview").message).toContain("---");
    const minimal = importPackage(
      "role.yaml",
      "name: simple\ndescription: Test",
    );
    expect(minimal).toMatchObject({
      kind: "role",
      title: "simple",
      version: "1.0.0",
    });
    expect(
      importPackage("skill.md", "---\nname: simple\ndescription: Test\n---\n"),
    ).toMatchObject({ kind: "skill", instructions: [] });
  });
  it("bounded undo/version history and delete/no confirmation preserve snapshots", () => {
    let ctx = full();
    for (let i = 0; i < 25; i++) {
      ctx = executeCommand(ctx, "/desc Description " + i).context;
      ctx = executeCommand(ctx, "/save").context;
    }
    expect(ctx.undo.length).toBeLessThanOrEqual(20);
    expect(ctx.versions.length).toBe(20);
    expect(executeCommand(ctx, "/diff").diffVersion).toBe(25);
    expect(executeCommand(ctx, "/restore 999").changed).toBe(false);
    let cleared = executeCommand(ctx, "/clear").context;
    cleared = executeCommand(cleared, "/no").context;
    expect(cleared.pkg).toEqual(ctx.pkg);
  });
});

describe("frozen intent and bounded editor uploads", () => {
  it("withdraws catalog publication only after /yes and supports cancelling", () => {
    const ctx = full();
    let r = executeCommand(ctx, "/unpublish");
    expect(r.unpublish).toBeUndefined();
    expect(r.context.pendingConfirm?.command).toBe("unpublish");
    expect(executeCommand(r.context, "/no").unpublish).toBeUndefined();
    r = executeCommand(r.context, "/yes");
    expect(r.unpublish).toBe(true);
  });
  it("compiles uploaded source without a package and enforces UTF-8 bytes", () => {
    const ctx = addFile(
      createContext(),
      "uploaded.coffee",
      "module.exports = {run: -> 1}",
    );
    expect(executeCommand(ctx, "/compile").job?.type).toBe("compile");
    expect(() =>
      addFile(
        createContext(),
        "texto.md",
        "€".repeat(Math.ceil(LIMITS.fileBytes / 3)),
      ),
    ).toThrow();
    expect(() => addFile(createContext(), "documentó.md", "text")).toThrow();
    expect(
      addFile(
        createContext(),
        "text.md",
        "€".repeat(Math.floor(LIMITS.fileBytes / 3)),
      ).files[0].content,
    ).toHaveLength(Math.floor(LIMITS.fileBytes / 3));
  });
});
