# Detectron2 vision service

Detector behind the dock **Visión** tool (camera, object detection, log, local recording).

- Browser: `components/camera-vision.js` grabs frames (<= 640 px JPEG, ~1 per 1.2 s) and posts them to `/api/vision/detect`.
- App server: `camera-vision.php` requires an account session, validates the frame, calls this service and keeps a per-account log (`data_storage/camera_vision/`, max 1000 rows).
- This service: Detectron2 `faster_rcnn_R_50_FPN_3x` on CPU (`DETECTRON2_MODEL`, `DETECTRON2_MIN_SCORE`, `DETECTRON2_DEVICE` override it).

## Deploy

1. Build and run this folder as its own service (`docker build services/detectron2-vision`) with `DETECTRON2_TOKEN` set.
2. In the main app (Render or the desktop `.env`) set `DETECTRON2_URL` to the service base URL and the same `DETECTRON2_TOKEN`.

Without `DETECTRON2_URL` the camera and recording still work and the panel reports the detector as not configured.

## Parity (hosted ↔ desktop)

Same source on both: the desktop runtime passes its environment to PHP, so a desktop user points `DETECTRON2_URL` at a reachable detector (for example a local `docker run`). Recordings never leave the browser/device.
