import { parseDocument } from "yaml";

export const MAX_PREVIEW_LENGTH = 65536;

export function previewLink(url) {
  if (typeof url !== "string" || url.length > 2048) return "";
  try {
    const parsed = new URL(url);
    return ["https:", "http:", "mailto:"].includes(parsed.protocol) &&
      !parsed.username && !parsed.password ? parsed.href : "";
  } catch {
    return "";
  }
}

export function yamlPreview(content) {
  try {
    if (content.length > MAX_PREVIEW_LENGTH) throw new Error("size");
    const doc = parseDocument(content, { schema: "core", uniqueKeys: true, merge: false });
    if (doc.errors.length || doc.warnings.length) {
      const at = (doc.errors[0] || doc.warnings[0]).linePos?.[0];
      return { error: at ? `Revisa la sintaxis en la línea ${at.line}, columna ${at.col}.` : "Revisa la sintaxis y las etiquetas del archivo." };
    }
    // Maps avoid assigning untrusted keys to object prototypes; aliases cannot expand.
    const data = doc.toJS({ mapAsMap: true, maxAliasCount: 0 });
    let nodes = 0;
    function bound(value, depth = 0) {
      if (++nodes > 2000 || depth > 24) throw new Error("complexity");
      if (value instanceof Map) {
        for (const [key, child] of value) {
          if (key !== null && typeof key === "object") throw new Error("key");
          bound(child, depth + 1);
        }
      } else if (Array.isArray(value)) {
        value.forEach(child => bound(child, depth + 1));
      }
    }
    bound(data);
    return { data };
  } catch {
    return { error: "Revisa los alias, las claves y el tamaño de la estructura." };
  }
}
