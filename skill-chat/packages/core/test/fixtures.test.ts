import { it, expect } from "vitest";
import {
  buildPackage,
  importPackage,
  executeCommand,
  createContext,
} from "../src/index.js";
it("generates stable Markdown, YAML, CoffeeScript and Dart snapshots", () => {
  let ctx = createContext();
  for (const input of [
    "/skill fixture",
    "/desc Defines consistent examples when validating generated skill files.",
    "/trigger generate sample",
    "/h2 Instructions",
    "/step Request the required data",
    "/tool inspect",
    "/param item:object!",
    "/param title:string",
    "/code coffee\nreturn {ok: true, title: args.title}",
  ])
    ctx = executeCommand(ctx, input).context;
  expect(buildPackage(ctx.pkg!)).toMatchSnapshot();
  let role = createContext();
  for (const input of [
    "/role analyst",
    "/desc Analyzes submitted records when the user requests a summary.",
    "/model configured-model",
    "/allow inspect",
    "/attach fixture",
    "/var locale=es-DO",
    "/text Never invent input data",
  ])
    role = executeCommand(role, input).context;
  expect(buildPackage(role.pkg!)).toMatchSnapshot();
});
it("keeps blank lines and backticks inside imported code blocks", () => {
  const content =
    "---\nname: code\ndescription: Test\n---\n\n```js\nline one\n\nline two\n```\n\nText\n";
  const imported = importPackage("SKILL.md", content);
  expect(imported.instructions[0]).toEqual({
    type: "code",
    lang: "js",
    content: "line one\n\nline two",
  });
  expect(buildPackage(imported)[0].content).toContain("line one\n\nline two");
  expect(() =>
    importPackage("role.yaml", "name: !!js/function good\ndescription: Fine"),
  ).toThrow();
});
it("requires explicit confirmation before overwriting manual document formatting", async () => {
  const { updateFile } = await import("../src/index.js");
  let ctx = createContext();
  for (const input of [
    "/skill formatted",
    "/desc Specifies actions for a request when generating a document.",
    "/text Instructions",
    "/build",
  ])
    ctx = executeCommand(ctx, input).context;
  const content = ctx.files[0].content.replace(
    "name: formatted",
    "# Manual YAML comment\nname: formatted",
  );
  ctx = updateFile(ctx, "SKILL.md", content);
  const proposed = executeCommand(ctx, "/build");
  expect(proposed.job).toBeUndefined();
  expect(proposed.context.pendingConfirm?.command).toBe("build");
  expect(proposed.context.files[0].content).toBe(content);
  expect(executeCommand(proposed.context, "/no").context.files[0].content).toBe(
    content,
  );
  const accepted = executeCommand(proposed.context, "/yes");
  expect(accepted.job?.type).toBe("build");
  expect(accepted.context.files[0].content).not.toContain(
    "Manual YAML comment",
  );
});
