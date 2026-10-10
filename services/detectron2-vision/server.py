"""Detectron2 object-detection service for the Hashcod Vision tool.

POST /detect  (body: raw JPEG, header Authorization: Bearer $DETECTRON2_TOKEN)
  -> {"width", "height", "detections": [{"label", "score", "box": [x, y, w, h]}]}
GET  /health  -> {"ok": true}

Detectron2: https://github.com/facebookresearch/detectron2 (Apache-2.0).
"""
import hmac
import io
import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import numpy as np
from PIL import Image

MAX_BYTES = 1_500_000
MIN_SCORE = float(os.environ.get("DETECTRON2_MIN_SCORE", "0.5"))
MODEL = os.environ.get("DETECTRON2_MODEL", "COCO-Detection/faster_rcnn_R_50_FPN_3x.yaml")
TOKEN = os.environ.get("DETECTRON2_TOKEN", "")


def build_predictor():
    from detectron2 import model_zoo
    from detectron2.config import get_cfg
    from detectron2.data import MetadataCatalog
    from detectron2.engine import DefaultPredictor

    cfg = get_cfg()
    cfg.merge_from_file(model_zoo.get_config_file(MODEL))
    cfg.MODEL.WEIGHTS = model_zoo.get_checkpoint_url(MODEL)
    cfg.MODEL.ROI_HEADS.SCORE_THRESH_TEST = MIN_SCORE
    cfg.MODEL.DEVICE = os.environ.get("DETECTRON2_DEVICE", "cpu")
    return DefaultPredictor(cfg), MetadataCatalog.get(cfg.DATASETS.TRAIN[0]).thing_classes


def detect(predictor, classes, jpeg):
    image = Image.open(io.BytesIO(jpeg)).convert("RGB")
    bgr = np.asarray(image)[:, :, ::-1]  # DefaultPredictor expects BGR
    inst = predictor(bgr)["instances"].to("cpu")
    out = []
    for (x1, y1, x2, y2), score, cls in zip(
        inst.pred_boxes.tensor.tolist(), inst.scores.tolist(), inst.pred_classes.tolist()
    ):
        out.append({"label": classes[cls], "score": round(score, 3), "box": [x1, y1, x2 - x1, y2 - y1]})
    return {"width": image.width, "height": image.height, "detections": out}


def make_handler(predictor, classes):
    class Handler(BaseHTTPRequestHandler):
        def _send(self, code, payload):
            body = json.dumps(payload).encode()
            self.send_response(code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            self._send(200, {"ok": True}) if self.path == "/health" else self._send(404, {"error": "not_found"})

        def do_POST(self):
            if self.path != "/detect":
                return self._send(404, {"error": "not_found"})
            supplied = self.headers.get("Authorization", "")
            if TOKEN and not hmac.compare_digest(supplied, "Bearer " + TOKEN):
                return self._send(401, {"error": "unauthorized"})
            length = int(self.headers.get("Content-Length") or 0)
            if length < 1 or length > MAX_BYTES:
                return self._send(413, {"error": "bad_size"})
            try:
                self._send(200, detect(predictor, classes, self.rfile.read(length)))
            except Exception:  # undecodable image or model failure; details stay out of the response
                self._send(422, {"error": "detect_failed"})

        def log_message(self, *args):
            pass

    return Handler


if __name__ == "__main__":
    if not TOKEN:
        raise SystemExit("DETECTRON2_TOKEN is required")
    predictor, classes = build_predictor()
    port = int(os.environ.get("PORT", "8089"))
    ThreadingHTTPServer(("0.0.0.0", port), make_handler(predictor, classes)).serve_forever()
