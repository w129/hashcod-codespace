import type { Package, Issue } from "./model.js";
import { assertPackage } from "./safety.js";
export function validatePackage(pkg: Package, knownSkills?: string[]): Issue[] {
  const issues: Issue[] = [];
  const err = (field: string, message: string) =>
    issues.push({ level: "error", field, message });
  const warn = (field: string, message: string) =>
    issues.push({ level: "warning", field, message });
  try {
    assertPackage(pkg);
  } catch (e) {
    const problems = (
      e as { issues?: { path: (string | number)[]; message: string }[] }
    ).issues;
    if (problems) for (const p of problems) err(p.path.join("."), p.message);
    else err("package", "Paquete inválido");
    return issues;
  }
  if (!pkg.description.trim())
    err("description", "La descripción es obligatoria");
  else if (pkg.description.length < 40)
    warn("description", "Describe cuándo debe activarse");
  if (!pkg.instructions.length) warn("instructions", "No hay instrucciones");
  const unique = (items: string[], field: string) => {
    if (new Set(items).size !== items.length) err(field, "Entrada duplicada");
  };
  if (pkg.kind === "skill") {
    unique(
      pkg.tools.map((t) => t.name),
      "tools",
    );
    unique(pkg.triggers, "triggers");
    unique(
      pkg.references.map((r) => r.path),
      "references",
    );
    for (const t of pkg.tools)
      unique(
        t.params.map((p) => p.name),
        "tools." + t.name + ".params",
      );
    for (const r of pkg.references)
      if (!/\.(md|yaml|coffee|dart)$/.test(r.path))
        err("references." + r.path, "Extensión no permitida");
  } else {
    unique(pkg.tools, "tools");
    unique(pkg.skills, "skills");
    for (const s of pkg.skills)
      if (knownSkills && !knownSkills.includes(s))
        err("skills." + s, "Este skill no existe");
  }
  return issues;
}
