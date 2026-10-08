import React, { useMemo, useState } from "react";
import { Icon } from "./Composer";
import { validVirtualPath } from "./client";
export default function FileTree({
  files,
  folders,
  activeFile,
  disabled,
  onOpen,
}) {
  const [collapsed, setCollapsed] = useState(new Set());
  const rows = useMemo(() => {
    const all = new Map();
    for (const folder of folders || []) {
      const path = typeof folder === "string" ? folder : folder?.path;
      if (validVirtualPath(path)) all.set(path, { path, folder: true });
    }
    for (const file of files) {
      const parts = file.path.split("/");
      for (let i = 1; i < parts.length; i++) {
        const path = parts.slice(0, i).join("/");
        all.set(path, { path, folder: true });
      }
      all.set(file.path, file);
    }
    return [...all.values()].sort((a, b) => a.path.localeCompare(b.path));
  }, [files, folders]);
  function toggle(path) {
    setCollapsed((previous) => {
      const next = new Set(previous);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  }
  return (
    <div className="hsc-file-tree">
      {rows
        .filter(
          (row) =>
            ![...collapsed].some((folder) => row.path.startsWith(folder + "/")),
        )
        .map((row) => (
          <button
            key={row.path}
            data-depth={Math.min(row.path.split("/").length - 1, 5)}
            title={row.path}
            className={row.path === activeFile ? "hsc-file-active" : ""}
            aria-label={
              row.folder ? "Carpeta " + row.path : "Abrir " + row.path
            }
            aria-expanded={row.folder ? !collapsed.has(row.path) : undefined}
            aria-pressed={row.folder ? undefined : row.path === activeFile}
            disabled={disabled && !row.folder}
            onClick={() => (row.folder ? toggle(row.path) : onOpen(row.path))}
          >
            <Icon size={14}>
              {row.folder ? (
                <path d="M3 5h6l2 2h10v13H3z" />
              ) : (
                <path d="M6 2h8l4 4v16H6zM14 2v5h5" />
              )}
            </Icon>
            <span>{row.path.split("/").at(-1)}</span>
            <small>
              {row.folder ? (collapsed.has(row.path) ? "+" : "−") : row.ext}
            </small>
          </button>
        ))}
      {!rows.length && <p>Usa /skill, /role o /new para comenzar.</p>}
    </div>
  );
}
