import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import EmptyState from "./EmptyState";
import "./entry.css";

function WorkspaceFrameIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 5 3 C 3.895 3 3 3.895 3 5 L 3 6 L 3 7 L 3 19 C 3 20.093063 3.9069372 21 5 21 L 19 21 C 20.093063 21 21 20.093063 21 19 L 21 7 L 21 6 L 21 5 C 21 3.895 20.105 3 19 3 L 5 3 z M 5 7 L 19 7 L 19 19 L 5 19 L 5 7 z" />
    </svg>
  );
}

function WorkspaceCheckedIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 5 3 C 3.895 3 3 3.895 3 5 L 3 6 L 3 7 L 3 19 C 3 20.093063 3.9069372 21 5 21 L 19 21 C 20.093063 21 21 20.093063 21 19 L 21 7 L 21 6 L 21 5 C 21 3.895 20.105 3 19 3 L 5 3 z M 5 7 L 19 7 L 19 19 L 5 19 L 5 7 z" />
      <path
        d="M 8.25 12.35 L 10.7 14.8 L 15.85 9.65"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function openWorkspace() {
  try {
    window.dispatchEvent(
      new CustomEvent("hashcod:first-screen-branched-menu-select", {
        detail: {
          value: "workspace",
          item: { value: "workspace", label: "Workspace" },
        },
      }),
    );
    return true;
  } catch (_) {
    return false;
  }
}

function CenterWorkspaceEmptyState() {
  const [confirmed, setConfirmed] = useState(false);
  const [opening, setOpening] = useState(false);
  const timers = useRef([]);

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
      timers.current = [];
    },
    [],
  );

  const handleAction = () => {
    if (opening) return;

    setConfirmed(true);
    setOpening(true);

    timers.current.push(
      window.setTimeout(() => {
        openWorkspace();
      }, 560),
    );

    timers.current.push(
      window.setTimeout(() => {
        setConfirmed(false);
        setOpening(false);
      }, 1200),
    );
  };

  return (
    <EmptyState
      label="Workspace quick access"
      title={confirmed ? "Workspace ready" : "Workspace"}
      description={
        confirmed
          ? "Opening your workspace."
          : "Confirm to open the workspace from the center of Hashcod Codespace."
      }
      icon={
        confirmed ? (
          <WorkspaceCheckedIcon />
        ) : (
          <WorkspaceFrameIcon />
        )
      }
      action={
        <button
          id="d5CenterEmptyStateAction"
          className="hashcod-empty-state-action"
          type="button"
          onClick={handleAction}
          disabled={opening}
          aria-busy={opening ? "true" : "false"}
        >
          {opening ? "Opening…" : "Open Workspace"}
        </button>
      }
    />
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
    version: "20261003-center-empty-state1",
    openWorkspace,
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
