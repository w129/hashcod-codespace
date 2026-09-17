# Hashcod × God's Eye View

## Purpose

Hashcod Codespace replaces the previous DeepSeek Harness sixth-cube integration with an in-platform geospatial workspace inspired by Bilawal Sidhu's open-source God's Eye View project.

The Hashcod edition runs inside the existing Hashcod browser/Electron renderer. It does **not** open a second browser tab, does not require a localhost sidecar service, and does not spawn a separate Node process.

## Upstream and license

- Upstream project: `https://github.com/bilawalsidhu/gods-eye-view`
- Upstream author: Bilawal Sidhu
- Upstream source-code license: MIT
- Hashcod integration profile: `HASHCOD-GEV-1`

The upstream MIT license explicitly excludes third-party datasets and 3D models from the MIT grant. Hashcod therefore does not bundle the upstream project's non-commercial TeleGeography, Vantor/GeoPera, third-party model, ALPR, or similar restricted datasets in this integration.

## Included in the Hashcod edition

- Full-screen interactive globe rendered with a self-hosted Canvas runtime.
- Pointer drag rotation, wheel zoom, click-to-target and reset controls.
- Search using OpenStreetMap Nominatim.
- Live USGS earthquake feed.
- Live ISS position feed.
- Natural Earth/world-atlas country geometry loaded as data at runtime.
- Normal, NVG, FLIR and Noir visualization modes.
- In-platform telemetry/status panel.
- Graceful degradation: the globe remains usable when one or more external public feeds are unavailable.

## Privacy and scope

This edition focuses on public, non-personal geospatial signals and environmental/orbital context. It intentionally does not bundle person-level tracking, ALPR data, private cameras, or restricted third-party datasets.

## Files

- `components/gods-eye-view-loader.js`
- `components/gods-eye-view.js`
- `components/gods-eye-view.css`
- `tests/e2e/test_gods_eye_view.js`
- `tests/e2e/test_gods_eye_view_browser_playwright.js`

## Runtime model

All interface code is served from Hashcod itself. Network requests are data requests only and use the platform's existing HTTPS `connect-src` policy. No external application UI is embedded with an iframe.
