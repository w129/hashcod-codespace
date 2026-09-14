# Hashcod Codespace — Virtual / Desktop Parity Policy

## Product invariant

The hosted Hashcod Codespace platform and the downloadable Windows desktop application are two distributions of the same product.

**Default rule:** when a feature, bug fix, UI improvement, route, API, translation, asset, security correction, storage change, or workflow improvement is added to the virtual platform, the downloadable local desktop build must ship the same behavior unless there is a documented technical reason that makes the feature intentionally cloud-only.

## Canonical source

The repository root is the canonical application source. The desktop shell under `local-app/desktop` packages the current application source; it is not a separate fork of the platform.

Avoid copying or reimplementing ordinary web features inside the Electron shell. Desktop-only code should be limited to responsibilities such as:

- starting and stopping the local runtime;
- desktop window behavior;
- installer/update packaging;
- local resource paths;
- desktop-specific security or OS integration;
- graceful handling of capabilities that only exist in the hosted environment.

## Automatic desktop freshness

`.github/workflows/desktop-release.yml` runs for pull requests and on every push to `main`.

On a successful push to `main`, the workflow must:

1. stage the current repository application source into the desktop payload;
2. verify that tracked application files in the payload match the source repository;
3. record the exact source commit in the packaged payload;
4. build and validate `Hashcod-Codespace-Setup.exe`;
5. publish/replace the stable `desktop-latest` installer asset.

This means a normal feature merged into `main` should not require a second manual copy operation to reach the downloadable edition.

## Required review for future changes

For every runtime/user-facing change, contributors must check:

- Does the change work in the hosted environment?
- Does the same source work through the desktop `127.0.0.1` runtime?
- Does it depend on Render, Cloudflare, a hosted-only secret, a remote filesystem, or another cloud-only capability?
- If environment variables changed, is `.env.example` and local handling updated?
- If the database/schema changed, can the desktop runtime use the required schema or fail safely?
- If browser assets changed, does cache/version handling keep both distributions current?
- If routes or APIs changed, does local routing still resolve them correctly?
- If authentication/security changed, are desktop-specific boundaries preserved?

## Cloud-only exceptions

A feature may remain cloud-only only when the exception is intentional and documented in the relevant pull request or maintenance documentation.

The exception must identify:

- why the feature cannot or should not run locally;
- what the desktop user sees instead;
- whether a later desktop implementation is planned;
- any security, privacy, storage, licensing, or provider constraint involved.

An undocumented missing desktop feature is considered a parity regression.

## Release acceptance

A change that affects product behavior is considered complete only when one of these is true:

- hosted and desktop behavior are both verified; or
- the desktop behavior is covered by the shared implementation and CI packaging checks, with any remaining real-device/local verification explicitly called out; or
- a documented cloud-only exception has been approved by the repository owner.

The objective is simple: **a user downloading the latest Hashcod Codespace desktop installer should receive the current product behavior from `main`, not an older local edition.**
