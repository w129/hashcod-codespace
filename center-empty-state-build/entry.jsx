import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import EmptyState from "./EmptyState";
import "./entry.css";

const HATCH_STORAGE_KEY = "hashcod:hatch-code:v1";
const JAVA_HATCH_STORAGE_KEY = "hashcod:hatch-java-code:v1";

const DEFAULT_HATCH_CODE = `'use client';

import * as React from 'react';

type MyComponentProps = {
  myProps: string;
} & React.ComponentProps<'div'>;

function MyComponent(props: MyComponentProps) {
  return (
    <div {...props}>
      <p>My Component</p>
    </div>
  );
}

export { MyComponent, type MyComponentProps };`;

const DEFAULT_JAVA_HATCH_CODE = `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello from Hashcod Hatch");
  }
}`;

function CcCardTitleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 48 48"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 27.607422 6.9980469 C 26.352666 7.0120547 25.059761 7.1042075 23.738281 7.2792969 C 18.452417 7.9796473 13.66972 9.8778977 10.091797 12.498047 C 6.5138736 15.118196 4 18.560747 4 22.443359 C 4 25.85995 6.1160513 28.694861 9.1464844 30.501953 C 9.0602377 30.848045 9 31.200556 9 31.558594 C 9 33.415574 10.09709 34.975782 11.380859 35.818359 C 12.664629 36.660937 14.125108 37 15.535156 37 C 15.551086 37 15.568034 36.994241 15.583984 36.994141 C 15.1831 39.346618 14.640625 41.265625 14.640625 41.265625 A 2.0002 2.0002 0 1 0 18.359375 42.734375 C 18.359375 42.734375 19.295328 39.756034 19.697266 36.126953 C 20.298327 35.898565 20.915525 35.718174 21.476562 35.384766 C 22.451394 34.805473 23.37214 33.990454 24.03125 32.984375 C 29.260547 32.640915 34.095712 30.998162 37.751953 28.386719 C 41.438969 25.753294 44 21.995709 44 17.675781 C 44 13.793169 41.28539 10.66032 37.574219 8.9257812 C 35.718633 8.0585122 33.580715 7.4720066 31.246094 7.1894531 C 30.078783 7.0481764 28.862177 6.9840391 27.607422 6.9980469 z M 27.646484 11.003906 C 30.911701 10.977549 33.777988 11.567951 35.880859 12.550781 C 38.684688 13.861243 40 15.595394 40 17.675781 C 40 20.418853 38.384468 23.019034 35.427734 25.130859 C 32.737896 27.052057 28.993177 28.439813 24.884766 28.888672 C 24.699104 28.076557 24.287687 27.365461 23.695312 26.699219 C 22.879189 25.781326 21.573503 25 20 25 C 17.463873 25 16.217585 26.353088 15.496094 27.371094 C 14.859603 27.182483 14.214947 27 13.53125 27 C 12.885786 27 12.284894 27.13869 11.744141 27.376953 C 9.1984811 26.080168 8 24.426333 8 22.443359 C 8 20.362972 9.5180014 17.87546 12.455078 15.724609 C 15.392155 13.573758 19.607583 11.86079 24.261719 11.244141 C 25.425239 11.08998 26.558079 11.012692 27.646484 11.003906 z M 20 29 C 20.296497 29 20.490655 29.114064 20.707031 29.357422 C 20.923407 29.60078 21 30.030702 21 29.853516 C 21 30.561866 20.547645 31.16549 19.660156 31.757812 C 19.452809 30.964871 19.104901 30.265386 18.650391 29.623047 C 18.881122 29.321539 19.255982 29 20 29 z M 13.53125 31 C 14.411069 31 14.929853 31.252778 15.3125 31.658203 C 15.545513 31.905086 15.606501 32.49711 15.730469 32.972656 C 15.669824 32.974585 15.593918 33 15.535156 33 C 14.841204 33 14.033903 32.775032 13.576172 32.474609 C 13.118441 32.174187 13 32.013613 13 31.558594 C 13 31.276563 13.085528 31 13.53125 31 z" />
    </svg>
  );
}

function JavaIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 50 50"
      className="hatch-code-java-icon"
      aria-hidden="true"
      focusable="false"
      fill="currentColor"
    >
      <path d="M 28.1875 0 C 30.9375 6.363281 18.328125 10.292969 17.15625 15.59375 C 16.082031 20.464844 24.648438 26.125 24.65625 26.125 C 23.355469 24.109375 22.398438 22.449219 21.09375 19.3125 C 18.886719 14.007813 34.535156 9.207031 28.1875 0 Z M 36.5625 8.8125 C 36.5625 8.8125 25.5 9.523438 24.9375 16.59375 C 24.6875 19.742188 27.847656 21.398438 27.9375 23.6875 C 28.011719 25.558594 26.0625 27.125 26.0625 27.125 C 26.0625 27.125 29.609375 26.449219 30.71875 23.59375 C 31.949219 20.425781 28.320313 18.285156 28.6875 15.75 C 29.039063 13.324219 36.5625 8.8125 36.5625 8.8125 Z M 19.1875 25.15625 C 19.1875 25.15625 9.0625 25.011719 9.0625 27.875 C 9.0625 30.867188 22.316406 31.089844 31.78125 29.25 C 31.78125 29.25 34.296875 27.519531 34.96875 26.875 C 28.765625 28.140625 14.625 28.28125 14.625 27.1875 C 14.625 26.179688 19.1875 25.15625 19.1875 25.15625 Z M 38.65625 25.15625 C 37.664063 25.234375 36.59375 25.617188 35.625 26.3125 C 37.90625 25.820313 39.84375 27.234375 39.84375 28.84375 C 39.84375 32.46875 34.59375 35.875 34.59375 35.875 C 34.59375 35.875 42.71875 34.953125 42.71875 29 C 42.71875 26.296875 40.839844 24.984375 38.65625 25.15625 Z M 16.75 30.71875 C 15.195313 30.71875 12.875 31.9375 12.875 33.09375 C 12.875 35.417969 24.5625 37.207031 33.21875 33.8125 L 30.21875 31.96875 C 24.351563 33.847656 13.546875 33.234375 16.75 30.71875 Z M 18.1875 35.9375 C 16.058594 35.9375 14.65625 37.222656 14.65625 38.1875 C 14.65625 41.171875 27.371094 41.472656 32.40625 38.4375 L 29.21875 36.40625 C 25.457031 37.996094 16.015625 38.238281 18.1875 35.9375 Z M 11.09375 38.625 C 7.625 38.554688 5.375 40.113281 5.375 41.40625 C 5.375 48.28125 40.875 47.964844 40.875 40.9375 C 40.875 39.769531 39.527344 39.203125 39.03125 38.9375 C 41.933594 45.65625 9.96875 45.121094 9.96875 41.15625 C 9.96875 40.253906 12.320313 39.390625 14.5 39.8125 L 12.65625 38.75 C 12.113281 38.667969 11.589844 38.636719 11.09375 38.625 Z M 44.625 43.25 C 39.226563 48.367188 25.546875 50.222656 11.78125 47.0625 C 25.542969 52.695313 44.558594 49.535156 44.625 43.25 Z" />
    </svg>
  );
}

function ReactIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className="hatch-code-react-icon"
    >
      <circle cx="12" cy="12" r="2.05" fill="currentColor" />
      <ellipse cx="12" cy="12" rx="9.25" ry="3.55" fill="none" stroke="currentColor" strokeWidth="1.25" />
      <ellipse cx="12" cy="12" rx="9.25" ry="3.55" fill="none" stroke="currentColor" strokeWidth="1.25" transform="rotate(60 12 12)" />
      <ellipse cx="12" cy="12" rx="9.25" ry="3.55" fill="none" stroke="currentColor" strokeWidth="1.25" transform="rotate(120 12 12)" />
    </svg>
  );
}

function CopyIcon({ checked }) {
  if (checked) {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="m5 12 4 4L19 6" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="8" y="8" width="10" height="10" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

function pushTokens(code, pattern, classify) {
  const parts = [];
  let last = 0;
  let match;
  let key = 0;

  while ((match = pattern.exec(code)) !== null) {
    if (match.index > last) {
      parts.push(<span key={key++}>{code.slice(last, match.index)}</span>);
    }
    parts.push(
      <span className={classify(match[0])} key={key++}>
        {match[0]}
      </span>,
    );
    last = pattern.lastIndex;
  }

  if (last < code.length) parts.push(<span key={key++}>{code.slice(last)}</span>);
  return parts;
}

function tokenizeTsx(code) {
  const pattern = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b(?:import|from|as|type|function|return|export|const|let|var|interface|extends|new|if|else|true|false|null|undefined)\b|\b(?:React|ComponentProps|MyComponentProps|MyComponent|string)\b|<\/?[A-Za-z][^>]*>|\b\d+(?:\.\d+)?\b)/g;
  return pushTokens(code, pattern, (token) => {
    if (token.startsWith("//") || token.startsWith("/*")) return "hatch-token-comment";
    if (token.startsWith("'") || token.startsWith('"')) return "hatch-token-string";
    if (token.startsWith("<")) return "hatch-token-tag";
    if (/^\d/.test(token)) return "hatch-token-number";
    if (/^(React|ComponentProps|MyComponentProps|MyComponent|string)$/.test(token)) return "hatch-token-type";
    return "hatch-token-keyword";
  });
}

function tokenizeJava(code) {
  const pattern = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])'|\b(?:public|private|protected|class|static|void|int|long|double|float|boolean|char|byte|short|new|return|if|else|for|while|do|switch|case|break|continue|package|import|extends|implements|try|catch|finally|throw|throws|final|this|super|null|true|false)\b|\b(?:String|System|Main|Object|Integer|Double|Boolean|Exception|RuntimeException)\b|\b\d+(?:\.\d+)?\b)/g;
  return pushTokens(code, pattern, (token) => {
    if (token.startsWith("//") || token.startsWith("/*")) return "hatch-token-comment";
    if (token.startsWith('"') || token.startsWith("'")) return "hatch-token-string";
    if (/^\d/.test(token)) return "hatch-token-number";
    if (/^(String|System|Main|Object|Integer|Double|Boolean|Exception|RuntimeException)$/.test(token)) return "hatch-token-type";
    return "hatch-token-keyword";
  });
}

function usePersistentCode(storageKey, initialValue) {
  const [code, setCode] = useState(() => {
    try {
      return window.localStorage.getItem(storageKey) ?? initialValue;
    } catch (_) {
      return initialValue;
    }
  });

  const update = (next) => {
    setCode(next);
    try {
      window.localStorage.setItem(storageKey, next);
    } catch (_) {
      // The editor remains writable if storage is unavailable.
    }
  };

  return [code, update];
}

function CodePane({
  idPrefix,
  filename,
  icon,
  code,
  setCode,
  tokenize,
  inputLabel,
  autoFocus = false,
}) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const copyTimerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const highlighted = useMemo(() => tokenize(code), [code, tokenize]);

  useEffect(() => {
    if (!autoFocus) return undefined;
    const timer = window.setTimeout(() => {
      textareaRef.current?.focus({ preventScroll: true });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [autoFocus]);

  useEffect(
    () => () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    },
    [],
  );

  const handleEditorKeyDown = (event) => {
    if (event.key !== "Tab") return;
    event.preventDefault();
    const node = event.currentTarget;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const next = code.slice(0, start) + "  " + code.slice(end);
    setCode(next);
    requestAnimationFrame(() => {
      node.selectionStart = node.selectionEnd = start + 2;
    });
  };

  const syncScroll = (event) => {
    if (!highlightRef.current) return;
    highlightRef.current.scrollTop = event.currentTarget.scrollTop;
    highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
  };

  const copyCode = async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(code);
      ok = true;
    } catch (_) {
      const fallback = document.createElement("textarea");
      fallback.value = code;
      fallback.setAttribute("readonly", "");
      fallback.style.position = "fixed";
      fallback.style.opacity = "0";
      document.body.appendChild(fallback);
      fallback.select();
      ok = document.execCommand("copy");
      fallback.remove();
    }
    if (!ok) return;
    setCopied(true);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="hatch-code-pane" data-code-pane={idPrefix}>
      <div className="hatch-code-header">
        <div className="hatch-code-file">
          {icon}
          <span>{filename}</span>
        </div>
        <button
          id={`${idPrefix}Copy`}
          className="hatch-code-copy"
          type="button"
          aria-label={copied ? "Copied" : `Copy ${filename}`}
          title={copied ? "Copied" : "Copy code"}
          onClick={copyCode}
        >
          <CopyIcon checked={copied} />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <div className="hatch-code-editor-wrap">
        <pre ref={highlightRef} className="hatch-code-highlight" aria-hidden="true">
          <code>{highlighted}</code>
        </pre>
        <textarea
          id={`${idPrefix}Input`}
          ref={textareaRef}
          className="hatch-code-input"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          onKeyDown={handleEditorKeyDown}
          onScroll={syncScroll}
          spellCheck="false"
          autoCapitalize="off"
          autoCorrect="off"
          aria-label={inputLabel}
        />
      </div>
    </section>
  );
}

function HatchCodeEditor({ open, onClose }) {
  const reduce = useReducedMotion();
  const [tsxCode, setTsxCode] = usePersistentCode(HATCH_STORAGE_KEY, DEFAULT_HATCH_CODE);
  const [javaCode, setJavaCode] = usePersistentCode(
    JAVA_HATCH_STORAGE_KEY,
    DEFAULT_JAVA_HATCH_CODE,
  );

  useEffect(() => {
    if (!open) return undefined;
    document.body.classList.add("hashcod-hatch-open");
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("hashcod-hatch-open");
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        id="d5HatchBackdrop"
        className="hatch-modal-backdrop"
        role="presentation"
        initial={reduce ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reduce ? 0 : 0.2 }}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        <motion.div
          id="d5HatchCodeEditor"
          className="hatch-code-shell hatch-code-shell-dual"
          role="dialog"
          aria-modal="true"
          aria-label="Hatch code editor"
          initial={reduce ? { opacity: 1 } : { opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.985 }}
          transition={
            reduce
              ? { duration: 0 }
              : { type: "spring", stiffness: 390, damping: 30, mass: 0.72 }
          }
        >
          <button
            id="d5HatchClose"
            className="hatch-code-close"
            type="button"
            aria-label="Close Hatch editor"
            onClick={onClose}
          >
            ×
          </button>

          <CodePane
            idPrefix="d5Hatch"
            filename="my-component.tsx"
            icon={<ReactIcon />}
            code={tsxCode}
            setCode={setTsxCode}
            tokenize={tokenizeTsx}
            inputLabel="Editable TSX code"
            autoFocus
          />

          <CodePane
            idPrefix="d5JavaHatch"
            filename="Main.java"
            icon={<JavaIcon />}
            code={javaCode}
            setCode={setJavaCode}
            tokenize={tokenizeJava}
            inputLabel="Editable Java code"
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

function CenterWorkspaceEmptyState() {
  const [hatchOpen, setHatchOpen] = useState(false);

  return (
    <>
      <EmptyState
        label="VC"
        icon={<CcCardTitleIcon />}
        action={
          <button
            id="d5CenterEmptyStateAction"
            className="hashcod-empty-state-action"
            type="button"
            aria-haspopup="dialog"
            aria-expanded={hatchOpen ? "true" : "false"}
            onClick={() => setHatchOpen(true)}
          >
            Open Hatch
          </button>
        }
      />

      <HatchCodeEditor
        open={hatchOpen}
        onClose={() => setHatchOpen(false)}
      />
    </>
  );
}

function mountCenterEmptyState() {
  const node = document.getElementById("d5CenterEmptyStateMount");
  if (!node || node.dataset.reactMounted === "true") return Boolean(node);

  const root = createRoot(node);
  root.render(<CenterWorkspaceEmptyState />);
  node.dataset.reactMounted = "true";

  window.HashcodCenterEmptyState = Object.freeze({
    mounted: true,
    version: "20261004-dual-code-hatch3",
  });

  return true;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", mountCenterEmptyState, {
    once: true,
  });
} else {
  mountCenterEmptyState();
}
