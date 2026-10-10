---
title: Hashcod Detectron2 Vision
sdk: docker
app_port: 7860
---

# Detectron2 vision service

Detector behind the **Visión** tool (button `#d5VisionTrigger`, right of the file-storage button on the first screen) (camera, object detection, log, local recording).

- Browser: `components/camera-vision.js` grabs frames (<= 640 px JPEG, ~1 per 1.2 s) and posts them to `/api/vision/detect`.
- App server: `camera-vision.php` requires an account session, validates the frame, calls this service and keeps a per-account log (`data_storage/camera_vision/`, max 1000 rows).
- This service: Detectron2 `faster_rcnn_R_50_FPN_3x` on CPU (`DETECTRON2_MODEL`, `DETECTRON2_MIN_SCORE`, `DETECTRON2_DEVICE` override it).

## Deploy

1. Build and run this folder as its own service (`docker build services/detectron2-vision`) with `DETECTRON2_TOKEN` set.
2. In the main app (Render or the desktop `.env`) set `DETECTRON2_URL` to the service base URL and the same `DETECTRON2_TOKEN`.

Without `DETECTRON2_URL` the camera and recording still work and the panel reports the detector as not configured.

### Railway (where the main app runs)

1. In the same Railway project: **New → GitHub Repo** → this repo, then set the new service's **Root Directory** to `services/detectron2-vision` (it builds the `Dockerfile` there).
2. Service variables: `DETECTRON2_TOKEN` (long random value) and `PORT=8089`. Give it at least 2 GB RAM.
3. Main app service variables: `DETECTRON2_TOKEN` (same value) and
   `DETECTRON2_URL=http://<detector-service-name>.railway.internal:8089` (private network; the server listens on IPv6 and IPv4). Redeploy the main app.

### Free option: Hugging Face Space (16 GB RAM, CPU)

Render's free plan (512 MB) cannot hold PyTorch + Detectron2. A Docker Space can:

1. Create a Space with SDK **Docker**; upload this folder's `Dockerfile`, `server.py` and `README.md`.
2. In the Space settings add the secret `DETECTRON2_TOKEN` (a long random value).
3. Set `DETECTRON2_URL=https://<user>-<space>.hf.space` and the same `DETECTRON2_TOKEN` in the Render service.

The first start downloads the model weights (about 160 MB); the first detection after a sleep is slow.

## Parity (hosted ↔ desktop)

Same source on both: the desktop runtime passes its environment to PHP, so a desktop user points `DETECTRON2_URL` at a reachable detector (for example a local `docker run`). Recordings never leave the browser/device.
