import { FileValueBadge } from "./FileValue.jsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import EmptyState from "./EmptyState";
import "./entry.css";
import FilesExplorer from "./FilesExplorer";
import FilePreview from "./FilePreview";
import PlatformPeriod from "./PlatformPeriod";
import TokenizationTool, { TokenizationIcon } from "./TokenizationTool";

const HATCH_STORAGE_KEY = "hashcod:hatch-code:v1";
const JAVA_HATCH_STORAGE_KEY = "hashcod:hatch-java-code:v1";
const JAVASCRIPT_HATCH_STORAGE_KEY = "hashcod:hatch-javascript-code:v1";
const HTML_HATCH_STORAGE_KEY = "hashcod:hatch-html-code:v1";
const CSS_HATCH_STORAGE_KEY = "hashcod:hatch-css-code:v1";
const CSS_HTML_LINK_STORAGE_KEY = "hashcod:hatch-css-html-linked:v1";
const PYTHON_HATCH_STORAGE_KEY = "hashcod:hatch-python-code:v1";

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

const DEFAULT_JAVASCRIPT_HATCH_CODE = `const hatch = {
  name: 'Hashcod Hatch',
  language: 'JavaScript',
};

function openHatch() {
  console.log(\`Welcome to \${hatch.name}\`);
}

openHatch();`;

const DEFAULT_HTML_HATCH_CODE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hashcod Hatch</title>
  </head>
  <body>
    <main>
      <h1>Hello from Hashcod Hatch</h1>
    </main>
  </body>
</html>`;

const DEFAULT_PYTHON_HATCH_CODE = `def main():
    message = "Hello from Hashcod Hatch"
    print(message)


if __name__ == "__main__":
    main()
`;

const DEFAULT_CSS_HATCH_CODE = `:root {
  font-family: Inter, system-ui, sans-serif;
  color: #111827;
  background: #ffffff;
}

body {
  margin: 0;
  min-height: 100vh;
}

h1 {
  font-size: 2rem;
  line-height: 1.1;
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

function PythonIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 48 48"
      className="hatch-code-python-icon"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="#0277BD" d="M24.047,5c-1.555,0.005-2.633,0.142-3.936,0.367c-3.848,0.67-4.549,2.077-4.549,4.67V14h9v2H15.22h-4.35c-2.636,0-4.943,1.242-5.674,4.219c-0.826,3.417-0.863,5.557,0,9.125C5.851,32.005,7.294,34,9.931,34h3.632v-5.104c0-2.966,2.686-5.896,5.764-5.896h7.236c2.523,0,5-1.862,5-4.377v-8.586c0-2.439-1.759-4.263-4.218-4.672C27.406,5.359,25.589,4.994,24.047,5z M19.063,9c0.821,0,1.5,0.677,1.5,1.502c0,0.833-0.679,1.498-1.5,1.498c-0.837,0-1.5-0.664-1.5-1.498C17.563,9.68,18.226,9,19.063,9z" />
      <path fill="#FFC107" d="M23.078,43c1.555-0.005,2.633-0.142,3.936-0.367c3.848-0.67,4.549-2.077,4.549-4.67V34h-9v-2h9.343h4.35c2.636,0,4.943-1.242,5.674-4.219c0.826-3.417,0.863-5.557,0-9.125C41.274,15.995,39.831,14,37.194,14h-3.632v5.104c0,2.966-2.686,5.896-5.764,5.896h-7.236c-2.523,0-5,1.862-5,4.377v8.586c0,2.439,1.759,4.263,4.218,4.672C19.719,42.641,21.536,43.006,23.078,43z M28.063,39c-0.821,0-1.5-0.677-1.5-1.502c0-0.833,0.679-1.498,1.5-1.498c0.837,0,1.5,0.664,1.5,1.498C29.563,38.32,28.899,39,28.063,39z" />
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

function JavaScriptIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 48 48"
      className="hatch-code-javascript-icon"
      aria-hidden="true"
      focusable="false"
    >
      <path fill="#f7df1e" d="M6,42V6h36v36H6z" />
      <path
        fill="#000001"
        d="M29.538,32.947c0.692,1.124,1.444,2.201,3.037,2.201c1.338,0,2.04-0.665,2.04-1.585 c0-1.101-0.726-1.492-2.198-2.133l-0.807-0.344c-2.329-0.988-3.878-2.226-3.878-4.841c0-2.41,1.845-4.244,4.728-4.244 c2.053,0,3.528,0.711,4.592,2.573l-2.514,1.607c-0.553-0.988-1.151-1.377-2.078-1.377c-0.946,0-1.545,0.597-1.545,1.377 c0,0.964,0.6,1.354,1.985,1.951l0.807,0.344C36.452,29.645,38,30.839,38,33.523C38,36.415,35.716,38,32.65,38 c-2.999,0-4.702-1.505-5.65-3.368L29.538,32.947z M17.952,33.029c0.506,0.906,1.275,1.603,2.381,1.603 c1.058,0,1.667-0.418,1.667-2.043V22h3.333v11.101c0,3.367-1.953,4.899-4.805,4.899c-2.577,0-4.437-1.746-5.195-3.368 L17.952,33.029z"
      />
    </svg>
  );
}

function CssIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 256 256"
      className="hatch-code-css-icon"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient x1="8.89439" y1="12.3151" x2="8.89439" y2="7.17663" gradientUnits="userSpaceOnUse" id="color-1_4d9YPiN04osD_gr1">
          <stop offset="0.387" stopColor="#d1d3d4" stopOpacity="0" />
          <stop offset="1" stopColor="#d1d3d4" />
        </linearGradient>
        <linearGradient x1="15.31865" y1="9.75283" x2="15.31865" y2="4.41012" gradientUnits="userSpaceOnUse" id="color-2_4d9YPiN04osD_gr2">
          <stop offset="0.387" stopColor="#d1d3d4" stopOpacity="0" />
          <stop offset="1" stopColor="#d1d3d4" />
        </linearGradient>
        <linearGradient x1="5.80296" y1="14.60815" x2="18.15014" y2="14.60815" gradientUnits="userSpaceOnUse" id="color-3_4d9YPiN04osD_gr3">
          <stop offset="0" stopColor="#e8e7e5" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
        <linearGradient x1="5.23201" y1="5.71446" x2="18.63753" y2="5.71446" gradientUnits="userSpaceOnUse" id="color-4_4d9YPiN04osD_gr4">
          <stop offset="0" stopColor="#e8e7e5" />
          <stop offset="1" stopColor="#ffffff" />
        </linearGradient>
      </defs>
      <g
        fill="none"
        fillRule="nonzero"
        stroke="none"
        strokeWidth="1"
        strokeLinecap="butt"
        strokeLinejoin="miter"
        strokeMiterlimit="10"
        strokeDasharray=""
        strokeDashoffset="0"
        fontFamily="none"
        fontWeight="none"
        fontSize="none"
        textAnchor="none"
        style={{ mixBlendMode: "normal" }}
      >
        <g transform="scale(10.66667,10.66667)">
          <path d="M20.667,21.666l-8.667,2.334l-8.667,-2.334l-2,-21.666h21.333z" fill="#2062af" />
          <path d="M12,1.755v20.384l0.02,0.005l7.013,-1.889l1.619,-18.501l-8.652,0.001z" fill="#3c9cd7" />
          <path d="M11.992,7.172l-6.203,2.584l0.206,2.558l5.997,-2.564l6.38,-2.728l0.264,-2.616l-6.644,2.766z" fill="#ffffff" />
          <path d="M5.789,9.756l0.206,2.558l5.997,-2.564v-2.578z" fill="url(#color-1_4d9YPiN04osD_gr1)" />
          <path d="M18.636,4.405l-6.644,2.767v2.577l6.38,-2.728z" fill="url(#color-2_4d9YPiN04osD_gr2)" />
          <path d="M5.799,9.756l0.206,2.558l9.202,0.029l-0.206,3.41l-3.028,0.852l-2.911,-0.735l-0.176,-2.117h-2.705l0.353,4.086l5.468,1.617l5.439,-1.588l0.706,-8.114h-12.348z" fill="url(#color-3_4d9YPiN04osD_gr3)" />
          <path d="M11.992,9.756h-6.203l0.206,2.558l5.997,0.019v-2.577zM11.992,16.597l-0.029,0.008l-2.91,-0.735l-0.176,-2.117h-2.706l0.353,4.086l5.468,1.617z" fill="#000000" opacity="0.05" />
          <path d="M5.231,4.405h13.406l-0.264,2.616h-12.819l-0.323,-2.616z" fill="url(#color-4_4d9YPiN04osD_gr4)" />
          <path d="M11.992,4.405h-6.761l0.323,2.616h6.438v-2.616z" fill="#000000" opacity="0.05" />
        </g>
      </g>
    </svg>
  );
}

function HtmlIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 48 48"
      className="hatch-code-html-icon"
      aria-hidden="true"
      focusable="false"
    >
      <polygon fill="#e7a42b" points="8,5 42,5 38,39 25,43 11,39" />
      <polygon fill="#f2bf22" points="38.63,8 35.25,36.71 25,39.86 25,8" />
      <polygon fill="#faf9f8" points="25,21 26,23 25,25 15.79,25 16.64,12 25,12 26,14 25,16 21.03,16 20.7,21" />
      <polygon fill="#ebebeb" points="24.9,32.57 25,32.54 26,35 25,36.72 24.94,36.74 16.61,34.36 16.05,28 20.07,28 20.35,31.27" />
      <polygon fill="#fff" points="34.07,21 32.5,34.42 25,36.72 25,32.54 28.83,31.36 29.57,25 25,25 25,21" />
      <polygon fill="#fff" points="34.92,18 30.93,18 30.67,16 25,16 25,12 34.13,12 34.3,13.26" />
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

function HtmlPreviewIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 6 2 C 4.897 2 4 2.897 4 4 L 4 20 C 4 21.103 4.897 22 6 22 L 12.259766 22 C 11.837766 21.396 11.509922 20.723 11.294922 20 L 6 20 L 6 4 L 13 4 L 13 9 L 18 9 L 18 11 C 18.695 11 19.366 11.105922 20 11.294922 L 20 8 L 14 2 L 6 2 z M 18 13 C 15.2 13 13 15.2 13 18 C 13 20.8 15.2 23 18 23 C 19 23 20.000781 22.699219 20.800781 22.199219 L 22.599609 24 L 24 22.599609 L 22.199219 20.800781 C 22.699219 20.000781 23 19 23 18 C 23 15.2 20.8 13 18 13 z M 18 15 C 19.7 15 21 16.3 21 18 C 21 19.7 19.7 21 18 21 C 16.3 21 15 19.7 15 18 C 15 16.3 16.3 15 18 15 z" />
    </svg>
  );
}

function CssHtmlLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 19 3 C 17.35499 3 16 4.3549904 16 6 C 16 6.4598564 16.114225 6.8919393 16.302734 7.2832031 L 12.585938 11 L 7.8125 11 C 7.3951413 9.8426699 6.2931586 9 5 9 C 3.3549904 9 2 10.35499 2 12 C 2 13.64501 3.3549904 15 5 15 C 6.2931586 15 7.3951413 14.15733 7.8125 13 L 12.585938 13 L 16.302734 16.716797 C 16.114225 17.108061 16 17.540143 16 18 C 16 19.64501 17.35499 21 19 21 C 20.64501 21 22 19.64501 22 18 C 22 16.35499 20.64501 15 19 15 C 18.540143 15 18.108061 15.114225 17.716797 15.302734 L 14.414062 12 L 17.716797 8.6972656 C 18.108061 8.8857754 18.540143 9 19 9 C 20.64501 9 22 7.6450096 22 6 C 22 4.3549904 20.64501 3 19 3 z M 19 5 C 19.564129 5 20 5.4358706 20 6 C 20 6.5641294 19.564129 7 19 7 C 18.435871 7 18 6.5641294 18 6 C 18 5.4358706 18.435871 5 19 5 z M 5 11 C 5.5641294 11 6 11.435871 6 12 C 6 12.564129 5.5641294 13 5 13 C 4.4358706 13 4 12.564129 4 12 C 4 11.435871 4.4358706 11 5 11 z M 19 17 C 19.564129 17 20 17.435871 20 18 C 20 18.564129 19.564129 19 19 19 C 18.435871 19 18 18.564129 18 18 C 18 17.435871 18.435871 17 19 17 z" />
    </svg>
  );
}

function PythonRunIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="100"
      height="100"
      viewBox="0 0 30 30"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M 5 4 C 3.895 4 3 4.895 3 6 L 3 9 L 3 25 A 1.0001 1.0001 0 0 0 4 26 L 26 26 A 1.0001 1.0001 0 0 0 27 25 L 27 8 L 27 6 C 27 4.895 26.105 4 25 4 L 5 4 z M 5 9 L 25 9 L 25 24 L 5 24 L 5 9 z M 8.9902344 12.990234 A 1.0001 1.0001 0 0 0 8.2929688 14.707031 L 10.585938 17 L 8.2929688 19.292969 A 1.0001 1.0001 0 1 0 9.7070312 20.707031 L 12.707031 17.707031 A 1.0001 1.0001 0 0 0 12.707031 16.292969 L 9.7070312 13.292969 A 1.0001 1.0001 0 0 0 8.9902344 12.990234 z M 15 19 A 1.0001 1.0001 0 1 0 15 21 L 21 21 A 1.0001 1.0001 0 1 0 21 19 L 15 19 z" />
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

function tokenizeJavaScript(code) {
  const pattern = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\`(?:\\.|[^\`\\])*\`|\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|class|extends|import|export|from|async|await|try|catch|finally|throw|typeof|instanceof|true|false|null|undefined)\b|\b(?:console|Math|Array|Object|String|Number|Boolean|Promise|Date|JSON)\b|\b\d+(?:\.\d+)?\b)/g;
  return pushTokens(code, pattern, (token) => {
    if (token.startsWith("//") || token.startsWith("/*")) return "hatch-token-comment";
    if (token.startsWith("'") || token.startsWith('"') || token.startsWith("`")) return "hatch-token-string";
    if (/^\d/.test(token)) return "hatch-token-number";
    if (/^(console|Math|Array|Object|String|Number|Boolean|Promise|Date|JSON)$/.test(token)) return "hatch-token-type";
    return "hatch-token-keyword";
  });
}

function tokenizePython(code) {
  const pattern = /(#[^\n]*|'''[\s\S]*?'''|"""[\s\S]*?"""|'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|\b(?:def|class|return|if|elif|else|for|while|in|import|from|as|try|except|finally|raise|with|lambda|yield|async|await|pass|break|continue|and|or|not|is|None|True|False)\b|\b(?:print|len|range|str|int|float|list|dict|set|tuple|bool|main)\b|\b\d+(?:\.\d+)?\b)/g;
  return pushTokens(code, pattern, (token) => {
    if (token.startsWith("#")) return "hatch-token-comment";
    if (token.startsWith("'") || token.startsWith('"')) return "hatch-token-string";
    if (/^\d/.test(token)) return "hatch-token-number";
    if (/^(print|len|range|str|int|float|list|dict|set|tuple|bool|main)$/.test(token)) return "hatch-token-type";
    return "hatch-token-keyword";
  });
}

function tokenizeCss(code) {
  const pattern = /(\/\*[\s\S]*?\*\/|#[0-9a-fA-F]{3,8}\b|\b(?:px|rem|em|vh|vw|%|s|ms|deg)\b|\b(?:display|position|width|height|margin|padding|color|background|font|font-size|font-family|line-height|border|border-radius|gap|grid|grid-template-columns|grid-template-rows|align-items|justify-content|min-height|max-width|overflow|opacity|transform|transition)\b|:[a-zA-Z-]+|\.[a-zA-Z_-][\w-]*|#[a-zA-Z_-][\w-]*|\b\d+(?:\.\d+)?\b)/g;
  return pushTokens(code, pattern, (token) => {
    if (token.startsWith("/*")) return "hatch-token-comment";
    if (token.startsWith(".") || (token.startsWith("#") && !/^#[0-9a-fA-F]{3,8}$/.test(token))) return "hatch-token-tag";
    if (/^#[0-9a-fA-F]{3,8}$/.test(token)) return "hatch-token-string";
    if (/^\d/.test(token)) return "hatch-token-number";
    if (token.startsWith(":")) return "hatch-token-type";
    return "hatch-token-keyword";
  });
}

function tokenizeHtml(code) {
  const pattern = /(<!--[\s\S]*?-->|<!doctype[^>]*>|<\/?[A-Za-z][^>]*>|\b(?:class|id|href|src|alt|title|name|content|charset|lang|type|rel|value|placeholder)\b|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/gi;
  return pushTokens(code, pattern, (token) => {
    if (token.startsWith("<!--")) return "hatch-token-comment";
    if (token.startsWith("<")) return "hatch-token-tag";
    if (token.startsWith('"') || token.startsWith("'")) return "hatch-token-string";
    return "hatch-token-type";
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

function usePersistentBoolean(storageKey, initialValue = false) {
  const [value, setValue] = useState(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      return saved === null ? initialValue : saved === "true";
    } catch (_) {
      return initialValue;
    }
  });

  const update = (nextValue) => {
    const resolved =
      typeof nextValue === "function" ? nextValue(value) : Boolean(nextValue);
    setValue(resolved);
    try {
      window.localStorage.setItem(storageKey, String(resolved));
    } catch (_) {
      // The connection toggle remains functional when storage is unavailable.
    }
  };

  return [value, update];
}

function attachCssToHtml(html, css) {
  const styleTag = `<style data-hashcod-hatch-css>\n${css}\n</style>`;
  if (/<\/head\s*>/i.test(html)) {
    return html.replace(/<\/head\s*>/i, `${styleTag}\n</head>`);
  }
  return `${styleTag}\n${html}`;
}

const PYODIDE_INDEX_URL = "https://cdn.jsdelivr.net/pyodide/v0.28.3/full/";
const PYTHON_RUN_TIMEOUT_MS = 10000;

function createPythonRun(code, onChunk) {
  const workerSource = `
self.onmessage = async (event) => {
  const { code, indexURL } = event.data;
  try {
    importScripts(indexURL + "pyodide.js");
    const pyodide = await loadPyodide({ indexURL });
    pyodide.setStdout({
      batched: (text) => self.postMessage({ type: "stdout", text })
    });
    pyodide.setStderr({
      batched: (text) => self.postMessage({ type: "stderr", text })
    });
    const result = await pyodide.runPythonAsync(code);
    if (result !== undefined && result !== null && String(result) !== "None") {
      self.postMessage({ type: "result", text: String(result) });
    }
    self.postMessage({ type: "done" });
  } catch (error) {
    self.postMessage({
      type: "error",
      text: error && error.message ? error.message : String(error)
    });
  }
};
`;

  const blobUrl = URL.createObjectURL(
    new Blob([workerSource], { type: "text/javascript" }),
  );
  const worker = new Worker(blobUrl);
  let settled = false;
  let resolvePromise;

  const finish = (status) => {
    if (settled) return;
    settled = true;
    window.clearTimeout(timeout);
    worker.terminate();
    URL.revokeObjectURL(blobUrl);
    resolvePromise(status);
  };

  const promise = new Promise((resolve) => {
    resolvePromise = resolve;
  });

  const timeout = window.setTimeout(() => {
    onChunk("stderr", "Execution stopped after 10 seconds.");
    finish("timeout");
  }, PYTHON_RUN_TIMEOUT_MS);

  worker.onmessage = (event) => {
    const message = event.data || {};
    if (message.type === "stdout" || message.type === "stderr" || message.type === "result") {
      onChunk(message.type, String(message.text ?? ""));
      return;
    }
    if (message.type === "done") {
      finish("success");
      return;
    }
    if (message.type === "error") {
      onChunk("stderr", String(message.text ?? "Python execution failed."));
      finish("error");
    }
  };

  worker.onerror = (event) => {
    onChunk("stderr", event.message || "Python worker failed.");
    finish("error");
  };

  worker.postMessage({ code, indexURL: PYODIDE_INDEX_URL });

  return {
    promise,
    cancel() {
      finish("cancelled");
    },
  };
}

function PythonTerminal({ output, running, onBack }) {
  return (
    <div id="d5PythonTerminal" className="hatch-python-terminal" role="region" aria-live="polite">
      <div className="hatch-python-terminal-bar">
        <span>{running ? "Running Python…" : "Python terminal"}</span>
        <button
          id="d5PythonTerminalBack"
          className="hatch-python-terminal-back"
          type="button"
          onClick={onBack}
        >
          Code
        </button>
      </div>
      <pre id="d5PythonTerminalOutput" className="hatch-python-terminal-output">
        {output.length ? output.join("\n") : "Ready."}
      </pre>
    </div>
  );
}

function CodePane({
  inputId,
  copyId,
  paneKey,
  filename,
  icon,
  code,
  setCode,
  tokenize,
  inputLabel,
  autoFocus = false,
  preview = false,
  previewButtonId,
  previewFrameId,
  previewSource,
  beforeCopyAction = null,
  alternateView = null,
  showAlternate = false,
}) {
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  const copyTimerRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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
    <section className="hatch-code-pane" data-code-pane={paneKey}>
      <div className="hatch-code-header">
        <div className="hatch-code-file">
          {icon}
          <span>{filename}</span>
        </div>
        <div className="hatch-code-header-actions">
          {beforeCopyAction}
          <button
            id={copyId}
            className="hatch-code-copy"
            type="button"
            aria-label={copied ? "Copied" : `Copy ${filename}`}
            title={copied ? "Copied" : "Copy code"}
            onClick={copyCode}
          >
            <CopyIcon checked={copied} />
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>

          {preview && (
            <button
              id={previewButtonId}
              className={`hatch-code-preview-toggle${showPreview ? " is-active" : ""}`}
              type="button"
              aria-label={showPreview ? "Back to HTML code" : "Preview HTML page"}
              aria-pressed={showPreview ? "true" : "false"}
              title={showPreview ? "Back to code" : "Preview page"}
              onClick={() => setShowPreview((value) => !value)}
            >
              <HtmlPreviewIcon />
            </button>
          )}
        </div>
      </div>

      <div className="hatch-code-editor-wrap">
        {preview && showPreview ? (
          <iframe
            id={previewFrameId}
            className="hatch-html-preview-frame"
            title="HTML page preview"
            srcDoc={previewSource ?? code}
            sandbox="allow-scripts"
          />
        ) : showAlternate && alternateView ? (
          alternateView
        ) : (
          <>
            <pre ref={highlightRef} className="hatch-code-highlight" aria-hidden="true">
              <code>{highlighted}</code>
            </pre>
            <textarea
              id={inputId}
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
          </>
        )}
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
  const [javascriptCode, setJavaScriptCode] = usePersistentCode(
    JAVASCRIPT_HATCH_STORAGE_KEY,
    DEFAULT_JAVASCRIPT_HATCH_CODE,
  );
  const [htmlCode, setHtmlCode] = usePersistentCode(
    HTML_HATCH_STORAGE_KEY,
    DEFAULT_HTML_HATCH_CODE,
  );
  const [cssCode, setCssCode] = usePersistentCode(
    CSS_HATCH_STORAGE_KEY,
    DEFAULT_CSS_HATCH_CODE,
  );
  const [cssLinkedToHtml, setCssLinkedToHtml] = usePersistentBoolean(
    CSS_HTML_LINK_STORAGE_KEY,
    false,
  );
  const [pythonCode, setPythonCode] = usePersistentCode(
    PYTHON_HATCH_STORAGE_KEY,
    DEFAULT_PYTHON_HATCH_CODE,
  );
  const [pythonTerminalOpen, setPythonTerminalOpen] = useState(false);
  const [pythonRunning, setPythonRunning] = useState(false);
  const [pythonOutput, setPythonOutput] = useState([]);
  const pythonRunRef = useRef(null);

  const htmlPreviewSource = useMemo(
    () => (cssLinkedToHtml ? attachCssToHtml(htmlCode, cssCode) : htmlCode),
    [htmlCode, cssCode, cssLinkedToHtml],
  );

  useEffect(
    () => () => {
      pythonRunRef.current?.cancel();
      pythonRunRef.current = null;
    },
    [],
  );

  const runPython = () => {
    if (pythonRunning) return;

    pythonRunRef.current?.cancel();
    setPythonTerminalOpen(true);
    setPythonRunning(true);
    setPythonOutput(["$ python main.py"]);

    const run = createPythonRun(pythonCode, (type, chunk) => {
      const prefix = type === "stderr" ? "[stderr] " : type === "result" ? "=> " : "";
      setPythonOutput((current) => [...current, `${prefix}${chunk}`]);
    });
    pythonRunRef.current = run;

    run.promise.finally(() => {
      if (pythonRunRef.current === run) {
        pythonRunRef.current = null;
        setPythonRunning(false);
      }
    });
  };

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

          <div id="d5HatchCodeGrid" className="hatch-code-grid-scroll">
            <CodePane
              paneKey="tsx"
              inputId="d5HatchCodeInput"
              copyId="d5HatchCopy"
              filename="my-component.tsx"
              icon={<ReactIcon />}
              code={tsxCode}
              setCode={setTsxCode}
              tokenize={tokenizeTsx}
              inputLabel="Editable TSX code"
              autoFocus
            />

            <CodePane
              paneKey="javascript"
              inputId="d5JavaScriptHatchCodeInput"
              copyId="d5JavaScriptHatchCopy"
              filename="script.js"
              icon={<JavaScriptIcon />}
              code={javascriptCode}
              setCode={setJavaScriptCode}
              tokenize={tokenizeJavaScript}
              inputLabel="Editable JavaScript code"
            />

            <CodePane
              paneKey="css"
              inputId="d5CssHatchCodeInput"
              copyId="d5CssHatchCopy"
              filename="styles.css"
              icon={<CssIcon />}
              code={cssCode}
              setCode={setCssCode}
              tokenize={tokenizeCss}
              inputLabel="Editable CSS code"
              beforeCopyAction={
                <button
                  id="d5CssHtmlLink"
                  className={`hatch-code-link-toggle${cssLinkedToHtml ? " is-active" : ""}`}
                  type="button"
                  aria-label={cssLinkedToHtml ? "Disconnect CSS from HTML" : "Connect CSS to HTML"}
                  aria-pressed={cssLinkedToHtml ? "true" : "false"}
                  title={cssLinkedToHtml ? "CSS connected to HTML" : "Connect CSS to HTML"}
                  onClick={() => setCssLinkedToHtml((value) => !value)}
                >
                  <CssHtmlLinkIcon />
                </button>
              }
            />

            <CodePane
              paneKey="java"
              inputId="d5JavaHatchCodeInput"
              copyId="d5JavaHatchCopy"
              filename="Main.java"
              icon={<JavaIcon />}
              code={javaCode}
              setCode={setJavaCode}
              tokenize={tokenizeJava}
              inputLabel="Editable Java code"
            />

            <CodePane
              paneKey="html"
              inputId="d5HtmlHatchCodeInput"
              copyId="d5HtmlHatchCopy"
              filename="index.html"
              icon={<HtmlIcon />}
              code={htmlCode}
              setCode={setHtmlCode}
              tokenize={tokenizeHtml}
              inputLabel="Editable HTML code"
              preview
              previewButtonId="d5HtmlHatchPreview"
              previewFrameId="d5HtmlHatchPreviewFrame"
              previewSource={htmlPreviewSource}
            />

            <CodePane
              paneKey="python"
              inputId="d5PythonHatchCodeInput"
              copyId="d5PythonHatchCopy"
              filename="main.py"
              icon={<PythonIcon />}
              code={pythonCode}
              setCode={setPythonCode}
              tokenize={tokenizePython}
              inputLabel="Editable Python code"
              beforeCopyAction={
                <button
                  id="d5PythonRun"
                  className={`hatch-code-python-run${pythonTerminalOpen ? " is-active" : ""}`}
                  type="button"
                  aria-label={pythonRunning ? "Python is running" : "Run Python code"}
                  aria-pressed={pythonTerminalOpen ? "true" : "false"}
                  title={pythonRunning ? "Running Python…" : "Run main.py"}
                  disabled={pythonRunning}
                  onClick={runPython}
                >
                  <PythonRunIcon />
                </button>
              }
              showAlternate={pythonTerminalOpen}
              alternateView={
                <PythonTerminal
                  output={pythonOutput}
                  running={pythonRunning}
                  onBack={() => setPythonTerminalOpen(false)}
                />
              }
            />
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}


function ExpandingPlaceholderIcon({ kind }) {
  if (kind === "square") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <rect x="6.5" y="6.5" width="11" height="11" rx="2.2" />
      </svg>
    );
  }

  if (kind === "dots") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <circle cx="6" cy="12" r="1.35" fill="currentColor" stroke="none" />
        <circle cx="12" cy="12" r="1.35" fill="currentColor" stroke="none" />
        <circle cx="18" cy="12" r="1.35" fill="currentColor" stroke="none" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="5.5" />
      <path d="M12 3.75v2.5M12 17.75v2.5M3.75 12h2.5M17.75 12h2.5" />
    </svg>
  );
}

const EXPANDING_BUTTON_ITEMS = Object.freeze([
  {
    id: "slot-1",
    domId: "d5ExpandingAction1",
    label: "Tokenización",
    icon: <TokenizationIcon />,
  },
  {
    id: "slot-2",
    domId: "d5ExpandingAction2",
    label: "Slot 2",
    icon: <ExpandingPlaceholderIcon kind="square" />,
  },
  {
    id: "slot-3",
    domId: "d5ExpandingAction3",
    label: "Slot 3",
    icon: <ExpandingPlaceholderIcon kind="dots" />,
  },
]);

function ExpandingButtonGroup({
  items,
  label,
  defaultExpanded = null,
  onAction,
}) {
  const reduced = useReducedMotion() ?? false;
  const rootRef = useRef(null);
  const touchArmedRef = useRef(null);
  const firstEnabled =
    items.find((item) => !item.disabled)?.id ?? items[0]?.id ?? null;
  const restingId =
    items.some((item) => item.id === defaultExpanded)
      ? defaultExpanded
      : firstEnabled;
  const [expandedId, setExpandedId] = useState(restingId);
  const [focusedId, setFocusedId] = useState(restingId);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    setExpandedId((current) =>
      items.some((item) => item.id === current) ? current : restingId,
    );
  }, [items, restingId]);

  const activate = async (item) => {
    if (item.disabled || busyId === item.id) return;
    setExpandedId(item.id);
    onAction?.(item.id);

    try {
      const pending = item.onSelect?.();
      if (pending instanceof Promise) {
        setBusyId(item.id);
        await pending;
      }
    } finally {
      setBusyId((current) => (current === item.id ? null : current));
    }
  };

  const handlePointerDown = (item, event) => {
    if (event.pointerType === "touch" && expandedId !== item.id) {
      touchArmedRef.current = item.id;
      setExpandedId(item.id);
      return;
    }
    touchArmedRef.current = null;
  };

  const handleClick = (item) => {
    if (touchArmedRef.current === item.id) {
      touchArmedRef.current = null;
      return;
    }
    void activate(item);
  };

  const handleKeyDown = (event) => {
    const buttons = Array.from(
      rootRef.current?.querySelectorAll("[data-ebg-item]") ?? [],
    );
    const index = buttons.findIndex(
      (button) => button === document.activeElement,
    );
    if (index < 0) return;

    const last = buttons.length - 1;
    const next =
      event.key === "ArrowRight"
        ? index === last
          ? 0
          : index + 1
        : event.key === "ArrowLeft"
          ? index === 0
            ? last
            : index - 1
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? last
              : -1;

    if (next < 0) return;
    event.preventDefault();
    buttons[next].focus();
  };

  return (
    <div
      ref={rootRef}
      className="hashcod-expanding-button-group"
      role="toolbar"
      aria-label={label}
      aria-orientation="horizontal"
      data-hashcod-expanding-group="true"
      onKeyDown={handleKeyDown}
      onMouseLeave={() => setExpandedId(focusedId ?? restingId)}
      onBlur={(event) => {
        if (rootRef.current?.contains(event.relatedTarget)) return;
        setFocusedId(restingId);
        setExpandedId(restingId);
      }}
    >
      {items.map((item) => {
        const expanded = expandedId === item.id;
        const busy = busyId === item.id;

        return (
          <motion.button
            layout
            id={item.domId}
            key={item.id}
            type="button"
            className="hashcod-expanding-button-group__item"
            data-ebg-item=""
            data-id={item.id}
            data-expanded={expanded ? "true" : undefined}
            aria-label={item.label}
            aria-disabled={item.disabled || undefined}
            aria-busy={busy || undefined}
            tabIndex={focusedId === item.id ? 0 : -1}
            transition={
              reduced
                ? { duration: 0.1 }
                : { type: "spring", stiffness: 420, damping: 32, mass: 0.7 }
            }
            onPointerDown={(event) => handlePointerDown(item, event)}
            onMouseEnter={() => setExpandedId(item.id)}
            onFocus={(event) => {
              setFocusedId(item.id);
              try {
                if (event.currentTarget.matches(":focus-visible")) {
                  setExpandedId(item.id);
                }
              } catch {
                setExpandedId(item.id);
              }
            }}
            onClick={() => handleClick(item)}
          >
            <span
              className="hashcod-expanding-button-group__icon"
              aria-hidden="true"
            >
              {item.icon}
            </span>

            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.span
                  key={item.id + "-label"}
                  className="hashcod-expanding-button-group__label"
                  aria-hidden="true"
                  initial={
                    reduced
                      ? { opacity: 0 }
                      : { opacity: 0, x: -6, filter: "blur(4px)" }
                  }
                  animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                  exit={
                    reduced
                      ? { opacity: 0 }
                      : { opacity: 0, x: -4, filter: "blur(3px)" }
                  }
                  transition={
                    reduced
                      ? { duration: 0.1 }
                      : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }
                  }
                >
                  {item.label}
                </motion.span>
              ) : null}
            </AnimatePresence>
          </motion.button>
        );
      })}
    </div>
  );
}


const FILE_VAULT_DB_NAME = "hashcod_file_vault_v1";
const FILE_VAULT_DB_VERSION = 1;
const FILE_VAULT_META_STORE = "files";
const FILE_VAULT_BLOB_STORE = "blobs";
const FILE_VAULT_SHARED = typeof document !== "undefined" && document.body?.dataset?.hashcodSharedWorkspace === "1";
const FILE_VAULT_ENDPOINT = FILE_VAULT_SHARED ? "/api/hashcod-shared-files" : "/api/hashcod-file-vault";

function fileVaultOpenDb() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("IndexedDB is unavailable."));
      return;
    }
    const request = window.indexedDB.open(
      FILE_VAULT_DB_NAME,
      FILE_VAULT_DB_VERSION,
    );
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_VAULT_META_STORE)) {
        db.createObjectStore(FILE_VAULT_META_STORE, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(FILE_VAULT_BLOB_STORE)) {
        db.createObjectStore(FILE_VAULT_BLOB_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(request.error ?? new Error("Could not open file storage."));
  });
}

async function fileVaultListLocal() {
  const db = await fileVaultOpenDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FILE_VAULT_META_STORE, "readonly");
    const request = tx.objectStore(FILE_VAULT_META_STORE).getAll();
    request.onsuccess = () => {
      const rows = Array.isArray(request.result) ? request.result : [];
      rows.sort(
        (a, b) =>
          new Date(b.uploadedAt ?? 0).getTime() -
          new Date(a.uploadedAt ?? 0).getTime(),
      );
      resolve(rows);
    };
    request.onerror = () =>
      reject(request.error ?? new Error("Could not read local files."));
    tx.oncomplete = () => db.close();
    tx.onabort = () => db.close();
  });
}

async function fileVaultDeleteLocal(id) {
  const db = await fileVaultOpenDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [FILE_VAULT_META_STORE, FILE_VAULT_BLOB_STORE],
      "readwrite",
    );
    tx.objectStore(FILE_VAULT_META_STORE).delete(id);
    tx.objectStore(FILE_VAULT_BLOB_STORE).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve(true);
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error ?? new Error("Could not delete local file."));
    };
    tx.onabort = tx.onerror;
  });
}

function fileVaultNewId() {
  const suffix =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().replace(/-/g, "")
      : Math.random().toString(36).slice(2) + Date.now().toString(36);
  return "fv_" + suffix.slice(0, 40);
}

function fileVaultExt(name) {
  const clean = String(name || "");
  const dot = clean.lastIndexOf(".");
  if (dot <= 0 || dot === clean.length - 1) return "FILE";
  return clean
    .slice(dot + 1)
    .replace(/[^a-z0-9]/gi, "")
    .slice(0, 5)
    .toUpperCase() || "FILE";
}

function fileVaultFormatSize(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 ** 3) return (value / 1024 ** 3).toFixed(2) + " GB";
  if (value >= 1024 ** 2) return (value / 1024 ** 2).toFixed(1) + " MB";
  if (value >= 1024) return Math.round(value / 1024) + " KB";
  return value + " B";
}

function FileVaultPageIcon({ file, size = 40 }) {
  const ext = fileVaultExt(file?.name);
  return (
    <svg
      className="hfv-page"
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        className="hfv-page-line"
        d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z"
      />
      <path className="hfv-page-line" d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
      <rect width="29" height="16" x="1" y="18" rx="8" className="hfv-page-chip" />
      <text x="15.5" y="29.2" textAnchor="middle" className="hfv-page-ext">
        {ext}
      </text>
    </svg>
  );
}

function FileVaultStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 7.5h16v11.25A1.25 1.25 0 0 1 18.75 20H5.25A1.25 1.25 0 0 1 4 18.75z" />
      <path d="M3.5 4h17v3.5h-17zM9 11h6" />
    </svg>
  );
}

function FileVaultUploadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 16V5M8 9l4-4 4 4" />
      <path d="M5 15v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}

function FileVaultDownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 4v11M8 11l4 4 4-4" />
      <path d="M5 19h14" />
    </svg>
  );
}

function FileVaultTrashIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13" />
      <path d="M10 11v5M14 11v5" />
    </svg>
  );
}

function FileVaultCloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

async function fileVaultCloudList() {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 10000);
  try {
  const response = await fetch(FILE_VAULT_ENDPOINT + "?action=list", {
    signal: controller.signal,
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!response.ok) throw new Error("Cloud index unavailable.");
  const payload = await response.json();
  return Array.isArray(payload.files) ? payload.files : [];
  } finally { window.clearTimeout(timer); }
}

function fileVaultCloudUpload(file, id, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", FILE_VAULT_ENDPOINT + "?action=upload", true);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Accept", "application/json");
    xhr.setRequestHeader("X-Requested-With", "XMLHttpRequest");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      onProgress?.(Math.max(0, Math.min(100, (event.loaded / event.total) * 100)));
    };
    xhr.onerror = () => reject(new Error("Cloud upload unavailable."));
    xhr.onload = () => {
      let payload = {};
      try {
        payload = JSON.parse(xhr.responseText || "{}");
      } catch {
        payload = {};
      }
      if (xhr.status >= 200 && xhr.status < 300 && payload.ok) {
        onProgress?.(100);
        resolve(payload.file ?? {});
        return;
      }
      const error = new Error(payload.error || "Cloud upload unavailable.");
      error.status = xhr.status;
      reject(error);
    };
    const form = new FormData();
    form.append("id", id);
    form.append("file", file, file.name || "file");
    xhr.send(form);
  });
}

function fileVaultMerge(localRows, cloudRows) {
  const map = new Map();
  (cloudRows || []).forEach((row) => {
    if (!row?.id) return;
    map.set(row.id, {
      id: row.id,
      name: row.name || row.filename || "file",
      type: row.type || row.mime_type || "application/octet-stream",
      size: Number(row.size ?? row.size_bytes ?? 0),
      uploadedAt: row.uploadedAt || row.upload_date || new Date().toISOString(),
      cloud: true,
      local: false,
      totpProtected: Boolean(row.totpProtected),
      accessProtection: row.accessProtection,
      priceUsdCents: row.priceUsdCents ?? null,
    });
  });
  (localRows || []).forEach((row) => {
    if (!row?.id) return;
    const cloud = map.get(row.id);
    map.set(row.id, {
      ...(cloud || {}),
      ...row,
      cloud: Boolean(row.cloud || cloud?.cloud),
      local: true,
      accessProtection: cloud?.accessProtection || row.accessProtection,
      priceUsdCents: cloud ? cloud.priceUsdCents : row.priceUsdCents,
    });
  });
  return Array.from(map.values()).sort(
    (a, b) =>
      new Date(b.uploadedAt ?? 0).getTime() -
      new Date(a.uploadedAt ?? 0).getTime(),
  );
}

function FileVault({ actions, tokenizationOpen, onCloseTokenization }) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(true);
  const [preview, setPreview] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const refreshSequence = useRef(0);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTransfers, setActiveTransfers] = useState([]);
  const [activeName, setActiveName] = useState("");
  const [progress, setProgress] = useState(0);
  const [notice, setNotice] = useState("");
  const inputRef = useRef(null);
  const reduce = useReducedMotion() ?? false;

  const refresh = async () => {
    const sequence = ++refreshSequence.current;
    setLoadingFiles(true);
    let localRows = null;
    let cloudRows = null;
    try {
      localRows = await fileVaultListLocal();
    } catch {
      localRows = null;
    }
    if (sequence === refreshSequence.current && localRows) setFiles(current => fileVaultMerge(localRows, current.filter(file => file.cloud)));
    try {
      cloudRows = await fileVaultCloudList();
    } catch {
      cloudRows = null;
    }
    if (sequence === refreshSequence.current) {
      setFiles(current => fileVaultMerge(localRows ?? current.filter(file => file.local), cloudRows ?? current.filter(file => file.cloud)));
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    void refresh();
    const onSaved = (event) => {
      setNotice(event.detail?.file?.cloud === false
        ? "Saved with code protection on this device. Cloud sync is unavailable."
        : "File stored in cloud.");
      void refresh();
    };
    window.addEventListener("hashcod:file-vault-saved", onSaved);
    window.addEventListener("focus", refresh);
    window.addEventListener("hashcod:cloud-state-restored", refresh);
    window.addEventListener("hashcod:platform-period-granted", refresh);
    const onTransfer = (event) => {
      const { id, pending } = event.detail || {};
      if (!id) return;
      setActiveTransfers(current => pending ? [...new Set([...current, id])] : current.filter(active => active !== id));
    };
    window.addEventListener("hashcod:file-vault-transfer", onTransfer);
    const poll = FILE_VAULT_SHARED ? window.setInterval(() => {
      if (document.visibilityState !== "hidden") void refresh();
    }, 15000) : null;
    try {
      navigator.storage?.persist?.().catch(() => false);
    } catch {
      // Storage persistence is optional.
    }
    return () => {
      if (poll !== null) window.clearInterval(poll);
      ++refreshSequence.current;
      window.removeEventListener("hashcod:file-vault-saved", onSaved);
      window.removeEventListener("focus", refresh);
      window.removeEventListener("hashcod:cloud-state-restored", refresh);
      window.removeEventListener("hashcod:platform-period-granted", refresh);
      window.removeEventListener("hashcod:file-vault-transfer", onTransfer);
    };
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape" && !uploading) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, uploading]);

  const saveFiles = async (incoming) => {
    const queue = Array.from(incoming || []).filter(file => file && typeof file.name === "string");
    if (!queue.length || uploading) return;
    const api = window.HashcodFileVaultTotp;
    const transfer = window.HashcodFileVaultFastUpload;
    if (!api?.requestSetup || !transfer?.upload) {
      setNotice("File-code storage is not ready. Reload the page and try again.");
      return;
    }
    setUploading(true);
    setNotice("");
    try {
      for (const file of queue) {
        const setup = await api.requestSetup(file.name);
        if (!setup) continue;
        setActiveName(file.name);
        setProgress(0);
        const result = await transfer.upload(file, fileVaultNewId(), setup.code,
          (loaded, total) => setProgress(total > 0 ? 100 * loaded / total : 0), undefined, setup.priceUsdCents);
        setNotice(result.file?.cloud === false
          ? "Saved with code protection on this device. Cloud sync is unavailable."
          : "File stored in cloud.");
        await refresh();
      }
    } catch (error) {
      setNotice(error.message || "Could not save this file. Check device storage and try again.");
    } finally {
      setUploading(false);
      setActiveName("");
      setProgress(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const previewFile = async (file) => {
    if (previewBusy) return;
    setPreviewBusy(true);
    try {
      const api = window.HashcodFileVaultTotp;
      if (!api?.preview) { setNotice("File-code verification is not ready. Reload the page and try again."); return; }
      const blob = await api.preview(file);
      if (blob) setPreview({ file, blob });
    } catch { setNotice("Could not open this file. Try again."); }
    finally { setPreviewBusy(false); }
  };

  const downloadFile = async (file) => {
    setNotice("");
    try {
      const api = window.HashcodFileVaultTotp;
      if (!api || typeof api.download !== "function") {
        setNotice("File-code verification is not ready. Reload the page and try again.");
        return;
      }
      await api.download(file);
    } catch (error) {
      setNotice(error?.message || "Could not verify the file download.");
    }
  };

  const deleteFile = async (file) => {
    setNotice("");
    try {
      const api = window.HashcodFileVaultTotp;
      if (!api || typeof api.delete !== "function") {
        setNotice("File-code verification is not ready. Reload the page and try again.");
        return;
      }
      if ((await api.delete(file)) !== true) return;
      if (file.local) await fileVaultDeleteLocal(file.id);
      ++refreshSequence.current;
      setLoadingFiles(false);
      setFiles((current) => current.filter((item) => item.id !== file.id));
      setPreview(current => current?.file.id === file.id ? null : current);
    } catch (error) {
      setNotice(error?.message || "Could not delete the file.");
    }
  };

  const modal = open
    ? createPortal(
        <div
          id="d5FileVaultBackdrop"
          className="hfv-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target && !uploading) setOpen(false);
          }}
        >
          <motion.section
            id="d5FileVault"
            className="hfv-shell"
            role="dialog"
            aria-modal="true"
            aria-label="File storage"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 8, scale: 0.985 }}
            transition={
              reduce
                ? { duration: 0.1 }
                : { duration: 0.2, ease: [0.16, 1, 0.3, 1] }
            }
          >
            <header className="hfv-header">
              <div>
                <span className="hfv-eyebrow">Storage</span>
                <h2>File vault</h2>
                <p>Store any file type. Files remain available after reload.</p>
              </div>
              <button
                id="d5FileVaultClose"
                className="hfv-close"
                type="button"
                aria-label="Close storage"
                disabled={uploading}
                onClick={() => setOpen(false)}
              >
                <FileVaultCloseIcon />
              </button>
            </header>

            <div
              id="d5FileVaultDropzone"
              className="hfv-dropzone"
              data-over={dragging ? "true" : undefined}
              data-busy={uploading ? "true" : undefined}
              role="button"
              tabIndex={0}
              aria-label="Choose files or drop files here"
              onClick={() => {
                if (!uploading) inputRef.current?.click();
              }}
              onKeyDown={(event) => {
                if (
                  !uploading &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  inputRef.current?.click();
                }
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                if (!uploading) setDragging(true);
              }}
              onDragOver={(event) => {
                event.preventDefault();
                if (!uploading) {
                  event.dataTransfer.dropEffect = "copy";
                  setDragging(true);
                }
              }}
              onDragLeave={(event) => {
                if (event.currentTarget.contains(event.relatedTarget)) return;
                setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                if (!uploading) void saveFiles(event.dataTransfer.files);
              }}
            >
              <input
                id="d5FileVaultInput"
                ref={inputRef}
                className="hfv-input"
                type="file"
                multiple
                onChange={(event) => void saveFiles(event.target.files)}
              />

              <motion.span
                className="hfv-upload-icon"
                animate={
                  dragging && !reduce
                    ? { y: -5, scale: 1.08 }
                    : { y: 0, scale: 1 }
                }
                transition={{ type: "spring", stiffness: 420, damping: 26 }}
              >
                <FileVaultUploadIcon />
              </motion.span>

              {uploading ? (
                <div className="hfv-uploading">
                  <strong>{activeName || "Saving file"}</strong>
                  <span>{Math.round(progress)}%</span>
                  <span className="hfv-progress-track">
                    <span
                      className="hfv-progress-bar"
                      style={{ transform: "scaleX(" + progress / 100 + ")" }}
                    />
                  </span>
                </div>
              ) : (
                <div className="hfv-drop-copy">
                  <strong>{dragging ? "Drop to store" : "Drop files here"}</strong>
                  <span>or click to choose · any file type</span>
                </div>
              )}
            </div>

            <div className="hfv-list-head">
              <span>{files.length} stored</span>
              <button type="button" onClick={() => void refresh()}>
                Refresh
              </button>
            </div>

            <div id="d5FileVaultList" className="hfv-list">
              {files.length === 0 ? (
                <div className="hfv-empty">
                  <span>No files yet.</span>
                  <small>Drop one above to add it to the vault.</small>
                </div>
              ) : (
                files.map((file) => (
                  <article className="hfv-file-row" key={file.id} data-hfv-file-id={file.id} data-hfv-access-protection={file.accessProtection} data-hfv-cloud={String(Boolean(file.cloud))}>
                    <FileVaultPageIcon file={file} size={38} />
                    <div className="hfv-file-copy">
                      <strong title={file.name}>{file.name}</strong>
                      <span>
                        {fileVaultFormatSize(file.size)}
                        {" · "}
                        {file.cloud ? "Cloud" : "Device"}
                        {file.cloud && file.local ? " + device" : ""}
                      </span>
                      <FileValueBadge cents={file.priceUsdCents} />
                    </div>
                    <div className="hfv-file-actions">
                      <button
                        type="button"
                        aria-label={"Download " + file.name}
                        title="Download"
                        onClick={() => void downloadFile(file)}
                      >
                        <FileVaultDownloadIcon />
                      </button>
                      <button
                        type="button"
                        aria-label={"Delete " + file.name}
                        title="Delete"
                        data-hfv-delete-api="verified"
                        onClick={() => void deleteFile(file)}
                      >
                        <FileVaultTrashIcon />
                      </button>
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="hfv-footer" aria-live="polite">
              <span>{notice}</span>
              <small>
                Files require the uploader's code. Device files stay in this
                browser; cloud files are available across devices.
              </small>
            </div>
          </motion.section>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <div className="hashcod-empty-state-actions-row">
      {actions}
      <button
        id="d5FileVaultTrigger"
        className="hashcod-file-vault-trigger"
        type="button"
        aria-label="Open file storage"
        aria-haspopup="dialog"
        aria-expanded={open ? "true" : "false"}
        title="File storage"
        onClick={() => { setOpen(true); void refresh(); }}
      >
        <FileVaultStoreIcon />
      </button>
      </div>
      <FilesExplorer files={files} loading={loadingFiles} uploading={uploading || activeTransfers.length > 0} busy={previewBusy} onPreview={previewFile} />
      {notice && !open && <p className="hfv-explorer-notice" role="status">{notice}</p>}
      {preview && <FilePreview file={preview.file} blob={preview.blob} onClose={() => setPreview(null)} onDownload={downloadFile} onDelete={deleteFile} />}
      {modal}
      {tokenizationOpen && <TokenizationTool files={files} loading={loadingFiles} onRefresh={refresh} onClose={onCloseTokenization} />}
    </>
  );
}

function CenterWorkspaceEmptyState() {
  const [hatchOpen, setHatchOpen] = useState(false);
  const [tokenizationOpen, setTokenizationOpen] = useState(false);

  return (
    <>
      <EmptyState
        className="hashcod-files-empty-state"
        label="VC"
        icon={<CcCardTitleIcon />}
        action={
          <div className="hashcod-workspace-files-content">
            <FileVault tokenizationOpen={tokenizationOpen} onCloseTokenization={() => setTokenizationOpen(false)} actions={<>
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

            <ExpandingButtonGroup
              items={EXPANDING_BUTTON_ITEMS}
              label="Additional Hatch actions"
              defaultExpanded="slot-1"
              onAction={id => { if (id === "slot-1") setTokenizationOpen(true); }}
            />

            </>} />
          </div>
        }
      />

      <div className="hashcod-workspace-recommendation">
        <PlatformPeriod />
      </div>

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
    version: "20261007-tokenization-status1",
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
