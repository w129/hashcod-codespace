# Hashcod Platform CRM + DeskcommCRM bridge

This integration uses architectural ideas and the self-hosted runtime model from
[DeskcommCRM](https://github.com/melgarafael/DeskcommCRM), licensed under MIT
(Copyright © 2026 Rafael Melgaço).

## Why the CRM runtime is isolated

DeskcommCRM is a full Next.js 16 application with Supabase Auth/Postgres/Realtime,
workers, WhatsApp integrations, Redis/rate limiting and scheduled jobs. Running its
entire stack inside the existing Hashcod web process would couple two independent
applications and materially increase memory, startup time and failure surface.

Hashcod therefore provides two layers:

1. **Platform CRM** — a native in-platform CRM that discovers platforms represented
   by Toolbox circles and gives each one a commercial pipeline record.
2. **DeskcommCRM bridge** — an embedded/external window for a separately deployed
   DeskcommCRM instance.

## Platform CRM behavior

The top bar receives the blue CRM button supplied for Hashcod. It opens a window with:

- automatic Toolbox-circle discovery;
- optional cloud occupied-slot discovery via `hashcod-sync.php?action=links.pull`;
- pipeline stages: Nuevo, Contactado, Demo, Negociación, Ganado and Pausado;
- owner, contact, next action, opportunity value and notes;
- search and JSON export;
- local persistence in `localStorage`.

The CRM does not delete or modify Toolbox circles when a CRM record is removed.

## Running a real DeskcommCRM instance

Deploy DeskcommCRM separately following its upstream self-host documentation. Then
set the instance URL in either place:

- Runtime environment: `DESKCOMM_CRM_URL=https://crm.example.com`
- The DeskcommCRM tab inside the Hashcod CRM window (stored locally in the browser).

Hashcod attempts to embed the instance in an iframe. If the Deskcomm server sends an
X-Frame-Options or CSP frame restriction, use the **ABRIR APARTE** button instead.

## Upstream license

DeskcommCRM is MIT licensed. This integration does not vendor or republish its source
or container image; it references and bridges to an independently deployed upstream
instance.
