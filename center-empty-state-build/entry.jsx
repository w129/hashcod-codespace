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

function CcCardTitleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 256 256"
      aria-hidden="true"
      focusable="false"
    >
      <g
        fill="none"
        fillRule="nonzero"
        stroke="none"
        strokeWidth="1"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
      >
        <g transform="scale(5.33333,5.33333)">
          <path
            d="M33.5,10c-7.456,0 -13.5,6.044 -13.5,13.5c0,7.456 6.044,13.5 13.5,13.5c7.456,0 13.5,-6.044 13.5,-13.5c0,-7.456 -6.044,-13.5 -13.5,-13.5zM33.5,30c-3.59,0 -6.5,-2.91 -6.5,-6.5c0,-3.59 2.91,-6.5 6.5,-6.5c3.59,0 6.5,2.91 6.5,6.5c0,3.59 -2.91,6.5 -6.5,6.5z"
            fill="#000000"
          />
          <path
            d="M19.14,28.051v-0.003c-1.18,1.204 -2.822,1.952 -4.64,1.952c-3.59,0 -6.5,-2.91 -6.5,-6.5c0,-3.59 2.91,-6.5 6.5,-6.5c1.83,0 3.481,0.759 4.662,1.976l3.75,-6.024c-2.308,-1.843 -5.229,-2.952 -8.412,-2.952c-7.456,0 -13.5,6.044 -13.5,13.5c0,7.456 6.044,13.5 13.5,13.5c3.164,0 6.067,-1.097 8.369,-2.919z"
            fill="#000000"
          />
          <path
            d="M8,23.5c0,-1.787 0.722,-3.405 1.889,-4.58l-4.855,-5.038c-2.488,2.448 -4.034,5.851 -4.034,9.618c0,3.749 1.53,7.14 3.998,9.586l4.934,-4.964c-1.192,-1.178 -1.932,-2.813 -1.932,-4.622z"
            fill="#292929"
          />
          <path
            d="M38.13,18.941c1.155,1.173 1.87,2.782 1.87,4.559c0,3.59 -2.91,6.5 -6.5,6.5c-1.826,0 -3.474,-0.755 -4.655,-1.968l-4.999,4.895c2.452,2.51 5.868,4.073 9.654,4.073c7.456,0 13.5,-6.044 13.5,-13.5c0,-3.684 -1.479,-7.019 -3.871,-9.455z"
            fill="#292929"
          />
        </g>
      </g>
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
        setConfirmed(false);
        setOpening(false);
      }, 1200),
    );
  };

  return (
    <EmptyState
      label="VC"
      title="VC"
      titleIcon={<CcCardTitleIcon />}
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
    version: "20261003-vc3",
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
