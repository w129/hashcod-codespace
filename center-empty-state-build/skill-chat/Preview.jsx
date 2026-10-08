import React, { useEffect, useMemo, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MAX_PREVIEW_LENGTH, previewLink, yamlPreview } from "./preview-formats";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import markdown from "@shikijs/langs/markdown";
import yaml from "@shikijs/langs/yaml";
import coffee from "@shikijs/langs/coffee";
import dart from "@shikijs/langs/dart";
import theme from "@shikijs/themes/github-light";
let highlighter;
const languages = {
  md: "markdown",
  yaml: "yaml",
  yml: "yaml",
  coffee: "coffee",
  dart: "dart",
};
function getHighlighter() {
  return (
    highlighter ||
    (highlighter = createHighlighterCore({
      langs: [markdown, yaml, coffee, dart],
      themes: [theme],
      engine: createJavaScriptRegexEngine({ target: "ES2018" }),
    }))
  );
}
function CodePreview({ content, ext }) {
  const [tokens, setTokens] = useState(null);
  useEffect(() => {
    let active = true;
    setTokens(null);
    const lang = languages[ext];
    if (
      !lang ||
      content.length > 16000 ||
      content.split("\n").some((line) => line.length > 1600)
    )
      return;
    const timer = setTimeout(() => {
      getHighlighter()
        .then((h) => {
          const result = h.codeToTokens(content, {
            lang,
            theme: "github-light",
          });
          if (active) setTokens({ content, ext, lines: result.tokens });
        })
        .catch(() => {});
    }, 120);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [content, ext]);
  return (
    <pre className="hsc-highlight" aria-label="Vista previa del archivo">
      {tokens?.content === content && tokens.ext === ext
        ? tokens.lines.map((line, i) => (
            <React.Fragment key={i}>
              {line.map((token, j) => (
                <span
                  key={j}
                  style={{
                    color: /^#[a-fA-F0-9]{3,8}$/.test(token.color || "")
                      ? token.color
                      : undefined,
                  }}
                >
                  {token.content}
                </span>
              ))}
              {i < tokens.lines.length - 1 ? "\n" : ""}
            </React.Fragment>
          ))
        : content || "Archivo vacío."}
    </pre>
  );
}

function YamlValue({ value }) {
  if (value instanceof Map) return value.size ? (
    <dl className="hsc-yaml-object">
      {[...value].map(([key, child], i) => <div key={i}>
        <dt>{String(key)}</dt><dd><YamlValue value={child} /></dd>
      </div>)}
    </dl>
  ) : <span className="hsc-preview-empty">Objeto vacío</span>;
  if (Array.isArray(value)) return value.length ? (
    <ol className="hsc-yaml-array">
      {value.map((child, i) => <li key={i}><YamlValue value={child} /></li>)}
    </ol>
  ) : <span className="hsc-preview-empty">Lista vacía</span>;
  const type = value === null ? "nulo" : typeof value === "boolean" ? "booleano" : typeof value === "number" ? "número" : "texto";
  return <span className="hsc-yaml-scalar"><span>{value === null ? "null" : String(value)}</span><small>{type}</small></span>;
}

const markdownComponents = {
  a({ href, children }) {
    const url = previewLink(href);
    return url ? <a href={url} target="_blank" rel="noopener noreferrer">{children}</a> : <span>{children}</span>;
  },
  // File content cannot silently contact remote image servers or render SVGs.
  img({ alt, src }) {
    const url = previewLink(src);
    return <span className="hsc-preview-image">Imagen: {alt || "sin descripción"}{url && <> · <a href={url} target="_blank" rel="noopener noreferrer">Abrir imagen</a></>}</span>;
  },
};

export default function Preview({ content = "", ext }) {
  const yaml = useMemo(() => ["yaml", "yml"].includes(ext) && content.trim() ? yamlPreview(content) : null, [content, ext]);
  if (!content.trim()) return <div className="hsc-document-preview hsc-preview-empty" aria-label="Vista previa del archivo">Archivo vacío.</div>;
  if (content.length > MAX_PREVIEW_LENGTH) return <div className="hsc-code-preview">
    <p className="hsc-preview-note">El archivo es demasiado grande para la vista renderizada. Se muestra su contenido original.</p>
    <CodePreview content={content} ext={ext} />
  </div>;
  if (ext === "md") return <article className="hsc-document-preview hsc-markdown" aria-label="Vista previa del archivo">
    <Markdown remarkPlugins={[remarkGfm]} skipHtml components={markdownComponents}>{content}</Markdown>
  </article>;
  if (yaml) return <div className="hsc-document-preview hsc-yaml" aria-label="Vista previa del archivo">
    <h2>Datos YAML</h2>
    {yaml.error ? <><p role="status">No se pudo representar el YAML. {yaml.error}</p><CodePreview content={content} ext={ext} /></> : <YamlValue value={yaml.data} />}
  </div>;
  return <div className="hsc-code-preview">
    <p className="hsc-preview-note">{ext === "coffee" ? "Código CoffeeScript" : ext === "dart" ? "Código Dart" : "Contenido del archivo"}</p>
    <CodePreview content={content} ext={ext} />
  </div>;
}
