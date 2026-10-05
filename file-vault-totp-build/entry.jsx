import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const VERSION = "20261005-file-vault-download-totp3";
const ENDPOINT = "/api/hashcod-file-vault";
const BASE32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

let requestHandler = null;
const pendingRequests = [];
let cloudFiles = [];
let decorateTimer = 0;
let downloadBusy = false;

function bytesToBase32(bytes) {
  let bits = 0;
  let value = 0;
  let out = "";
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += BASE32[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) out += BASE32[(value << (5 - bits)) & 31];
  return out;
}

function generateSecret() {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return bytesToBase32(bytes);
}

function normalizeSecret(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[\s-]+/g, "")
    .replace(/=+$/g, "")
    .replace(/[^A-Z2-7]/g, "")
    .slice(0, 128);
}

function normalizeCode(value) {
  return String(value || "").replace(/\D+/g, "").slice(0, 6);
}

function requestTotpDialog(options) {
  return new Promise((resolve) => {
    const entry = { options, resolve };
    if (requestHandler) requestHandler(entry);
    else pendingRequests.push(entry);
  });
}

function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5.5" y="10" width="13" height="10" rx="2.4" />
      <path d="M8.5 10V7.5a3.5 3.5 0 0 1 7 0V10" />
      <circle cx="12" cy="15" r="1.2" />
    </svg>
  );
}

function TotpDialogHost() {
  const reduce = useReducedMotion() ?? false;
  const [request, setRequest] = useState(null);
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const codeRef = useRef(null);
  const dialogRef = useRef(null);

  const begin = (entry) => {
    setRequest(entry);
    setError(String(entry.options?.error || ""));
    setCode("");
    setSecret(
      entry.options?.mode === "setup"
        ? normalizeSecret(entry.options?.secret || generateSecret())
        : "",
    );
  };

  useEffect(() => {
    requestHandler = begin;
    while (pendingRequests.length) begin(pendingRequests.shift());
    return () => {
      requestHandler = null;
    };
  }, []);

  useEffect(() => {
    if (!request) return;
    const previousFocus = document.activeElement;
    const timer = window.setTimeout(() => (codeRef.current || dialogRef.current)?.focus(), 90);
    const onKey = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        finish(null);
      } else if (event.key === "Tab") {
        const elements = Array.from(dialogRef.current?.querySelectorAll('input:not([disabled]), button:not([disabled])') || []);
        const first = elements[0], last = elements.at(-1);
        if (!first) return;
        if (!dialogRef.current?.contains(document.activeElement) || (!event.shiftKey && document.activeElement === last) || (event.shiftKey && document.activeElement === first)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    const siblings = Array.from(document.body.children).filter((node) => node.id !== 'd5FileVaultTotpMount');
    const originalInert = siblings.map((node) => node.inert);
    siblings.forEach((node) => { node.inert = true; });
    document.addEventListener('keydown', onKey, true);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', onKey, true);
      siblings.forEach((node, index) => { node.inert = originalInert[index]; });
      if (previousFocus?.isConnected) previousFocus.focus?.();
    };
  }, [request]);

  const finish = (value) => {
    const resolver = request?.resolve;
    setRequest(null);
    setCode("");
    setSecret("");
    setError("");
    resolver?.(value);
  };

  const setup = request?.options?.mode === "setup";
  const notice = request?.options?.mode === "notice";
  const fileName = request?.options?.fileName || "file";
  const purpose = request?.options?.purpose || "download";

  const submit = (event) => {
    event?.preventDefault?.();
    if (notice) return;
    const cleanCode = normalizeCode(code);
    if (cleanCode.length !== 6) {
      setError("Enter the current 6-digit TOTP code.");
      return;
    }
    if (setup) {
      const cleanSecret = normalizeSecret(secret);
      if (cleanSecret.length < 16) {
        setError("The TOTP setup key is too short.");
        return;
      }
      finish({ secret: cleanSecret, code: cleanCode });
      return;
    }
    finish({ code: cleanCode });
  };

  const copySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setError("Setup key copied. Add it to your authenticator, then enter the current code.");
    } catch {
      setError("Copy is unavailable. Select the setup key manually.");
    }
  };

  return (
    <AnimatePresence>
      {request ? (
        <motion.div
          className="hfv-totp-backdrop"
          data-animate-ui-dialog="file-vault-totp"
          role="presentation"
          initial={reduce ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) finish(null);
          }}
        >
          <motion.form
            ref={dialogRef}
            tabIndex={-1}
            className="hfv-totp-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="hfvTotpTitle"
            aria-describedby="hfvTotpDescription"
            data-mode={setup ? "setup" : notice ? "notice" : "verify"}
            initial={
              reduce
                ? { opacity: 1 }
                : { opacity: 0, scale: 0.96, y: 14, filter: "blur(5px)" }
            }
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.98, y: 8, filter: "blur(3px)" }}
            transition={
              reduce
                ? { duration: 0 }
                : { type: "spring", stiffness: 390, damping: 31, mass: 0.72 }
            }
            onSubmit={submit}
          >
            <div className="hfv-totp-icon"><LockIcon /></div>
            <div className="hfv-totp-heading">
              <span>{setup ? "TOTP protection" : "Uploader TOTP protection"}</span>
              <h2 id="hfvTotpTitle">
                {setup ? "Protect before upload" : notice ? "Download unavailable" : purpose === "delete" ? "Verify before delete" : "Verify before download"}
              </h2>
              <p title={fileName}>{fileName}</p>
              <small id="hfvTotpDescription">{setup ? "Configure the key that will protect this file." : "Use the current code from the authenticator key set by the person who uploaded this file."}</small>
            </div>

            {setup ? (
              <div className="hfv-totp-secret-block">
                <label htmlFor="hfvTotpSecret">TOTP setup key</label>
                <div className="hfv-totp-secret-row">
                  <input
                    id="hfvTotpSecret"
                    value={secret}
                    onChange={(event) => setSecret(normalizeSecret(event.target.value))}
                    spellCheck="false"
                    autoCapitalize="characters"
                    autoComplete="off"
                    aria-label="TOTP setup key"
                  />
                  <button type="button" onClick={() => setSecret(generateSecret())}>Generate</button>
                  <button type="button" onClick={copySecret}>Copy</button>
                </div>
                <small>Add this key to your authenticator app. It is shown only while protecting this upload.</small>
              </div>
            ) : null}

            {!notice ? <div className="hfv-totp-code-block">
              <label htmlFor="hfvTotpCode">{setup ? "Current TOTP code" : "Uploader's current TOTP code"}</label>
              <input
                id="hfvTotpCode"
                ref={codeRef}
                value={code}
                onChange={(event) => setCode(normalizeCode(event.target.value))}
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="000000"
                aria-label="Current six digit TOTP code"
              />
              <small>6 digits · rotates every 30 seconds</small>
            </div> : null}

            <div className="hfv-totp-error" data-visible={error ? "true" : "false"} aria-live="polite">
              {error || "Protected with a time-based one-time password."}
            </div>

            <div className="hfv-totp-actions">
              <button type="button" className="hfv-totp-secondary" onClick={() => finish(null)}>{notice ? "Close" : "Cancel"}</button>
              {!notice ? <motion.button
                type="submit"
                className="hfv-totp-primary"
                whileTap={reduce ? undefined : { scale: 0.97 }}
              >
                {setup ? "Protect & upload" : purpose === "delete" ? "Verify & delete" : "Verify & download"}
              </motion.button> : null}
            </div>
          </motion.form>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function formatSize(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 ** 3) return (value / 1024 ** 3).toFixed(2) + " GB";
  if (value >= 1024 ** 2) return (value / 1024 ** 2).toFixed(1) + " MB";
  if (value >= 1024) return Math.round(value / 1024) + " KB";
  return value + " B";
}

async function refreshCloudIndex() {
  try {
    const response = await fetch(ENDPOINT + "?action=list", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
    });
    if (!response.ok) return cloudFiles;
    const payload = await response.json().catch(() => ({}));
    cloudFiles = Array.isArray(payload.files) ? payload.files : [];
    decorateRows();
  } catch {
    // Existing File Vault UI continues working if cloud metadata is temporarily unavailable.
  }
  return cloudFiles;
}

function rowIdentity(row) {
  const name = row?.querySelector?.(".hfv-file-copy strong")?.textContent?.trim() || "";
  const meta = row?.querySelector?.(".hfv-file-copy span")?.textContent || "";
  return { name, meta };
}

function matchCloudFile(row) {
  const directId = row?.dataset?.hfvFileId;
  if (directId) {
    const direct = cloudFiles.find((file) => file.id === directId);
    return direct || null;
  }
  const { name, meta } = rowIdentity(row);
  const candidates = cloudFiles.filter(
    (file) => String(file.name || "") === name && meta.includes(formatSize(file.size)),
  );
  if (candidates.length === 1) return candidates[0];
  const named = cloudFiles.filter((file) => String(file.name || "") === name);
  return named.length === 1 ? named[0] : null;
}

function decorateRows() {
  const rows = Array.from(document.querySelectorAll("#d5FileVaultList .hfv-file-row"));
  const unused = cloudFiles.slice();
  rows.forEach((row) => {
    let index = -1;
    if (row.dataset.hfvFileId) {
      index = unused.findIndex((file) => file.id === row.dataset.hfvFileId);
    } else {
      const matched = matchCloudFile(row);
      if (matched) index = unused.findIndex((file) => file.id === matched.id);
    }
    if (index < 0) return;
    const file = unused.splice(index, 1)[0];
    row.dataset.hfvFileId = file.id;
    row.dataset.hfvTotpProtected = file.totpProtected ? "true" : "false";
    let badge = row.querySelector(".hfv-totp-row-badge");
    if (file.totpProtected && !badge) {
      badge = document.createElement("span");
      badge.className = "hfv-totp-row-badge";
      badge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="10" width="12" height="9" rx="2"/><path d="M9 10V7.5a3 3 0 0 1 6 0V10"/></svg><span>TOTP</span>';
      row.querySelector(".hfv-file-copy")?.appendChild(badge);
    }
  });
}

function scheduleDecorate() {
  window.clearTimeout(decorateTimer);
  decorateTimer = window.setTimeout(() => {
    if (document.getElementById("d5FileVault")) void refreshCloudIndex();
  }, 120);
}

function installUploadPatch() {
  if (window.__hashcodFileVaultTotpXhrPatched) return;
  window.__hashcodFileVaultTotpXhrPatched = true;
  const proto = XMLHttpRequest.prototype;
  const nativeOpen = proto.open;
  const nativeSend = proto.send;

  proto.open = function patchedOpen(method, url, ...rest) {
    this.__hashcodHfvTotpUpload =
      String(method || "").toUpperCase() === "POST" &&
      String(url || "").includes("/api/hashcod-file-vault") &&
      String(url || "").includes("action=upload");
    return nativeOpen.call(this, method, url, ...rest);
  };

  proto.send = function patchedSend(body) {
    if (!this.__hashcodHfvTotpUpload || !(body instanceof FormData) || body.has("totp_secret")) {
      return nativeSend.call(this, body);
    }

    const xhr = this;
    const file = body.get("file");
    requestTotpDialog({ mode: "setup", fileName: file?.name || "file" })
      .then((result) => {
        if (!result) {
          if (typeof xhr.onerror === "function") xhr.onerror(new Event("error"));
          return;
        }
        body.set("totp_secret", result.secret);
        body.set("totp_code", result.code);
        nativeSend.call(xhr, body);
      })
      .catch(() => {
        if (typeof xhr.onerror === "function") xhr.onerror(new Event("error"));
      });
    return undefined;
  };
}

async function resolveProtectedFile(row) {
  let file = matchCloudFile(row);
  if (!file) {
    await refreshCloudIndex();
    file = matchCloudFile(row);
  }
  return file;
}

async function parseError(response, fallback) {
  try {
    const payload = await response.clone().json();
    return payload?.error || fallback;
  } catch {
    return fallback;
  }
}

async function verifiedDownload(file) {
  let error = "";
  while (true) {
    const result = await requestTotpDialog({
      mode: "verify",
      fileName: file.name || "file",
      purpose: "download",
      error,
    });
    if (!result) return;

    let response;
    try { response = await fetch(ENDPOINT + "?action=download", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/octet-stream, application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ id: file.id, code: result.code }),
    }); } catch {
      await requestTotpDialog({ mode: "notice", purpose: "download", fileName: file.name, error: "Could not verify this file. Check your connection and try again." });
      return;
    }
    if (!response.ok) {
      error = await parseError(response, "The TOTP code is invalid or expired.");
      if (response.status === 401) continue;
      await requestTotpDialog({ mode: "notice", purpose: "download", fileName: file.name, error });
      return;
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name || "file";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1200);
    return;
  }
}

async function downloadSelectedFile(file) {
  if (downloadBusy) return;
  downloadBusy = true;
  try {
    if (!file?.id) {
      await requestTotpDialog({ mode: "notice", purpose: "download", fileName: file?.name || "file", error: "This file could not be identified safely. Refresh the vault and try again." });
      return;
    }
    await verifiedDownload(file);
  } catch {
    await requestTotpDialog({ mode: "notice", purpose: "download", fileName: file?.name || "file", error: "The download could not be completed. Check your connection and try again." });
  } finally {
    downloadBusy = false;
  }
}

async function verifiedDelete(file) {
  let error = "";
  while (true) {
    const result = await requestTotpDialog({
      mode: "verify",
      fileName: file.name || "file",
      purpose: "delete",
      error,
    });
    if (!result) return;

    const response = await fetch(ENDPOINT + "?action=delete", {
      method: "POST",
      credentials: "same-origin",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Requested-With": "XMLHttpRequest",
      },
      body: JSON.stringify({ id: file.id, code: result.code }),
    });
    if (!response.ok) {
      error = await parseError(response, "The TOTP code is invalid or expired.");
      if (response.status === 429) return;
      continue;
    }

    cloudFiles = cloudFiles.filter((entry) => entry.id !== file.id);
    window.setTimeout(() => {
      document.querySelector("#d5FileVault .hfv-list-head button")?.click();
      scheduleDecorate();
    }, 80);
    return;
  }
}

function installActionGuard() {
  if (window.__hashcodFileVaultTotpActions) return;
  window.__hashcodFileVaultTotpActions = true;

  document.addEventListener(
    "click",
    async (event) => {
      const button = event.target?.closest?.("#d5FileVaultList .hfv-file-actions button");
      if (!button) return;
      const title = String(button.getAttribute("title") || "").toLowerCase();
      if (title === "delete" && button.dataset.hfvTotpBypass === "1") {
        delete button.dataset.hfvTotpBypass;
        return;
      }

      if (title !== "download" && title !== "delete") return;

      const row = button.closest(".hfv-file-row");
      if (!row) return;

      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();

      // Downloads always go through the verified POST path, including local
      // copies and old rows whose protection metadata could not be restored.
      if (title === "download") {
        const file = row.dataset.hfvFileId
          ? { id: row.dataset.hfvFileId, name: rowIdentity(row).name }
          : await resolveProtectedFile(row);
        await downloadSelectedFile(file);
        return;
      }
      const file = await resolveProtectedFile(row);
      if (!file || !file.totpProtected) {
        button.dataset.hfvTotpBypass = "1";
        button.click();
        return;
      }

      await verifiedDelete(file);
    },
    true,
  );
}

function boot() {
  if (window.__hashcodFileVaultTotpLoaded) return;
  window.__hashcodFileVaultTotpLoaded = true;

  const host = document.createElement("div");
  host.id = "d5FileVaultTotpMount";
  document.body.appendChild(host);
  createRoot(host).render(<TotpDialogHost />);

  installUploadPatch();
  installActionGuard();

  const observer = new MutationObserver(scheduleDecorate);
  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("focus", scheduleDecorate);
  window.addEventListener("hashcod:cloud-state-restored", scheduleDecorate);

  window.HashcodFileVaultTotp = Object.freeze({
    version: VERSION,
    refresh: refreshCloudIndex,
    download: downloadSelectedFile,
    requestSetup: (fileName) => requestTotpDialog({ mode: "setup", fileName }),
    requestVerify: (fileName) => requestTotpDialog({ mode: "verify", fileName, purpose: "download" }),
  });
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
