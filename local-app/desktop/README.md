# Hashcod Codespace Desktop

This directory builds the Windows desktop edition of Hashcod Codespace.

## What the user downloads

The website download button points to `Hashcod-Codespace-Setup.exe`. The executable is produced by GitHub Actions and published as the `desktop-latest` release asset.

## Runtime model

The installer contains:

- Electron, which provides the native desktop window.
- A portable PHP runtime.
- A snapshot of the current Hashcod Codespace repository.

On first launch the packaged site is copied to the user's Electron data directory. Future installer versions refresh the application files while preserving `.env`, `LOCAL-DB-CREDENTIALS.txt`, `data_storage`, and `uploads`.

The desktop process launches PHP only on `127.0.0.1` using a random free port and opens that loopback URL inside the Electron window. No BAT or PowerShell launcher is required on the user's laptop.

## Build

The canonical build is `.github/workflows/desktop-release.yml`. It creates a Windows x64 NSIS installer and publishes it to the stable `desktop-latest` GitHub Release.

Generated folders such as `node_modules`, `payload`, and `dist` must not be committed.
