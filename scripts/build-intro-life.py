#!/usr/bin/env python3
"""Builds the assets that bring the welcome illustration to life (assets/intro/life/).

Input : assets/intro/platform-intro.webp (1672x941, the original picture)
Output: assets/intro/life/plate.webp   the picture with the walkers/vehicles painted out
        assets/intro/life/atlas.webp   every cut-out sprite packed in one lossless RGBA sheet
        assets/intro/life/life.js      sprite rectangles, walkable grid and vehicle lanes

Needs: pip install numpy pillow opencv-python-headless
Run  : python3 scripts/build-intro-life.py            (add --debug DIR to write overlay images)
"""
import argparse
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
SRC = os.path.join(ROOT, 'assets/intro/platform-intro.webp')
OUT = os.path.join(ROOT, 'assets/intro/life')
W, H = 1672, 941

# Where pedestrians may be lifted out of the picture and walk (x0, y0, x1, y1). Everything else stays painted in.
WALK_ZONES = [
    (440, 336, 1098, 705),   # plaza
    (440, 700, 690, 830),    # plaza, left of the task list
    (0, 166, 1672, 252),     # sidewalk in front of the offices
    (0, 806, 690, 941),      # bottom sidewalk
]
# Places inside the zones that look like people to the detector but are tables, fountains, etc.
NO_WALK = [
    (780, 570, 1100, 705),   # fountain, planters and Carmen
    (815, 392, 1050, 500),   # Carmen's speech bubble
]
DARK = 140                  # people are darker than the pale pavement
PERSON_W = (5, 34)
PERSON_H = (14, 58)


def load():
    bgr = cv2.imread(SRC)
    if bgr is None or bgr.shape[:2] != (H, W):
        sys.exit('unexpected source image: ' + SRC)
    return bgr, cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)


def components(gray):
    """Dark silhouettes. A 3x3 opening cuts the thin lines that tie people to scenery; closing joins heads to bodies."""
    mask = (gray < DARK).astype(np.uint8)
    core = cv2.morphologyEx(mask, cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3)))
    core = cv2.morphologyEx(core, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_RECT, (1, 7)))
    count, labels, stats, _ = cv2.connectedComponentsWithStats(core, connectivity=4)
    return mask, count, labels, stats


def in_zone(x, y, w, h):
    cx, foot = x + w / 2, y + h
    return any(z[0] <= cx <= z[2] and z[1] <= foot <= z[3] for z in WALK_ZONES) and \
        not any(z[0] <= cx <= z[2] and z[1] <= foot <= z[3] for z in NO_WALK)


def person_like(w, h, area):
    fill = area / float(w * h)
    single = 6 <= w <= 20 and 22 <= h <= 56 and 2.0 <= h / w <= 4.4
    pair = 21 <= w <= 40 and 22 <= h <= 56 and 0.9 <= h / w <= 1.9
    return (single or pair) and fill >= 0.4


def find_people(gray):
    mask, count, labels, stats = components(gray)
    people = []
    for i in range(1, count):
        x, y, w, h, area = (int(v) for v in stats[i])
        if person_like(w, h, area) and in_zone(x, y, w, h):
            people.append((i, x, y, w, h))
    return people, np.zeros((H, W), np.uint8), labels


def sprite_mask(labels, i, box, gray):
    """Silhouette of one person inside a window: dark core + anything that differs from the pavement, holes filled."""
    x, y, w, h = box
    pad = 6
    x0, y0, x1, y1 = max(x - pad, 0), max(y - pad, 0), min(x + w + pad, W), min(y + h + pad, H)
    win = gray[y0:y1, x0:x1].astype(np.int16)
    pave = win[win > 165]
    ref = int(np.median(pave)) if pave.size > 20 else 205
    core = (labels[y0:y1, x0:x1] == i).astype(np.uint8)
    core = cv2.dilate(core, np.ones((3, 3), np.uint8))
    ext = (np.abs(win - ref) > 28).astype(np.uint8)
    union = cv2.morphologyEx(core | ext, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    n, lab = cv2.connectedComponents(union, connectivity=4)
    keep = np.unique(lab[core > 0])
    union = np.isin(lab, keep[keep > 0]).astype(np.uint8)
    union = cv2.morphologyEx(union, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    ring = np.pad(union, 1)
    cv2.floodFill(ring, None, (0, 0), 2)
    union[ring[1:-1, 1:-1] == 0] = 1
    # keep it person-sized: never grow far past the detected box
    limit = np.zeros_like(union)
    limit[max(pad - 3, 0):min(pad + h + 3, y1 - y0), max(pad - 3, 0):min(pad + w + 3, x1 - x0)] = 1
    return (x0, y0, x1, y1), union & limit


def patch_fill(plate, gray_plate, full_mask, box):
    """Paints the hole with the best-matching clean pavement patch from nearby (match on a ring around it)."""
    x0, y0, x1, y1 = box
    ys, xs = np.where(full_mask[y0:y1, x0:x1] > 0)
    bx0, by0, bx1, by1 = x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1
    ring = 5
    tx0, ty0, tx1, ty1 = max(bx0 - ring, 0), max(by0 - ring, 0), min(bx1 + ring, W), min(by1 + ring, H)
    hole = cv2.dilate(full_mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))[ty0:ty1, tx0:tx1]
    template = plate[ty0:ty1, tx0:tx1].astype(np.float32)
    valid = (hole == 0).astype(np.uint8)
    if valid.sum() < 20:
        return False
    sx0, sy0, sx1, sy1 = max(tx0 - 320, 0), max(ty0 - 220, 0), min(tx1 + 320, W), min(ty1 + 220, H)
    search = plate[sy0:sy1, sx0:sx1].astype(np.float32)
    mask3 = np.repeat(valid[..., None], 3, axis=2).astype(np.float32)
    score = cv2.matchTemplate(search, template, cv2.TM_SQDIFF, mask=mask3)
    # candidates must be clean pavement: no dark pixels, no pixels already marked for removal
    dirty = ((gray_plate[sy0:sy1, sx0:sx1] < 140) | (ERASED[sy0:sy1, sx0:sx1] > 0)).astype(np.float32)
    th, tw = template.shape[:2]
    # only the part that will be pasted (the hole) has to be clean; the surrounding ring is just for matching
    bad = cv2.filter2D(dirty, -1, hole.astype(np.float32), anchor=(0, 0), borderType=cv2.BORDER_CONSTANT)[:score.shape[0], :score.shape[1]]
    score[bad > 0] = np.inf
    # ... and as bright as the pavement around the hole (keeps white bubbles, umbrellas and shadows out)
    gsearch = gray_plate[sy0:sy1, sx0:sx1].astype(np.float32)
    count = max(float(hole.sum()), 1.0)
    mean = cv2.filter2D(gsearch, -1, hole.astype(np.float32), anchor=(0, 0), borderType=cv2.BORDER_CONSTANT)[:score.shape[0], :score.shape[1]] / count
    gt = gray_plate[ty0:ty1, tx0:tx1].astype(np.float32)
    ring_px = gt[(valid > 0) & (gt > 150)]
    target = float(np.median(ring_px)) if ring_px.size > 10 else 205.0
    score[np.abs(mean - target) > 14] = np.inf
    cx, cy = np.unravel_index(np.argmin(score), score.shape)[::-1]
    if not np.isfinite(score[cy, cx]):
        return False
    patch = search[cy:cy + th, cx:cx + tw]
    alpha = cv2.GaussianBlur(hole.astype(np.float32), (0, 0), 1.0)[..., None]
    alpha = np.clip(alpha * 1.4, 0, 1) * (hole[..., None] > 0)
    plate[ty0:ty1, tx0:tx1] = (patch * alpha + plate[ty0:ty1, tx0:tx1] * (1 - alpha)).astype(np.uint8)
    return True


ERASED = None


def build(bgr, gray, people):
    global ERASED
    plate = bgr.copy()
    ERASED = np.zeros((H, W), np.uint8)
    masks, sprites = [], []
    for i, x, y, w, h in people:
        box, mask = sprite_mask(LABELS, i, (x, y, w, h), gray)
        full = np.zeros((H, W), np.uint8)
        full[box[1]:box[3], box[0]:box[2]] = mask
        ERASED |= cv2.dilate(full, np.ones((3, 3), np.uint8))
        masks.append((box, full))
    for (box, full), (i, x, y, w, h) in zip(masks, people):
        ys, xs = np.where(full > 0)
        bx0, by0, bx1, by1 = xs.min(), ys.min(), xs.max() + 1, ys.max() + 1
        rgba = np.zeros((by1 - by0, bx1 - bx0, 4), np.uint8)
        rgba[..., :3] = bgr[by0:by1, bx0:bx1][..., ::-1]
        rgba[..., 3] = full[by0:by1, bx0:bx1] * 255
        sprites.append({'rgba': rgba, 'x': int(bx0), 'y': int(by0), 'w': int(bx1 - bx0), 'h': int(by1 - by0)})
    kept = []
    for (box, full), sprite in zip(masks, sprites):
        if patch_fill(plate, cv2.cvtColor(plate, cv2.COLOR_BGR2GRAY), full, box):
            kept.append(sprite)       # a figure that cannot be painted out cleanly stays where it is, standing still
    print('walkers kept: %d of %d' % (len(kept), len(sprites)))
    sprites = kept
    return plate, sprites


# Vehicles on the avenue: (x0, y0, x1, y1) of the picture, driving direction, lane wheel line (bottom y).
VEHICLES = {
    'car_a':   dict(box=(0, 262, 62, 302),     dir=1,  lane=304),
    'bus_g':   dict(box=(70, 238, 290, 310),   dir=1,  lane=304, bus=True),
    'taxi_f':  dict(box=(325, 265, 400, 314),  dir=1,  lane=304),
    'taxi_d':  dict(box=(675, 262, 765, 306),  dir=1,  lane=304),
    'taxi_e':  dict(box=(845, 262, 940, 308),  dir=1,  lane=304),
    'car_b':   dict(box=(1260, 244, 1340, 285), dir=-1, lane=320),
    'car_c':   dict(box=(1300, 284, 1375, 326), dir=-1, lane=320),
    'bus_h':   dict(box=(1484, 240, 1632, 322), dir=-1, lane=320, bus=True),
}
ROAD_TOP = 263
ROAD_BOTTOM = 313
CROSSWALKS = [(425, 255, 555, 325), (1060, 255, 1245, 325)]
# Poles and lamps that stand in front of the avenue: redrawn over the vehicles.
OCCLUDERS = [
    (293, 283, 309, 345), (398, 244, 418, 335), (626, 238, 642, 312), (975, 262, 992, 318),
    (1038, 242, 1056, 312), (1190, 268, 1206, 322), (1224, 282, 1242, 338), (1410, 260, 1428, 332),
]


def vehicle_mask(gray, spec):
    x0, y0, x1, y1 = spec['box']
    win = gray[y0:y1, x0:x1].astype(np.int16)
    h, w = win.shape
    if spec.get('bus'):
        mask = np.ones((h, w), np.uint8)
        for cx, cy in ((0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)):   # trim the corners
            cv2.circle(mask, (cx, cy), 5, 0, -1)
        return mask
    border = np.concatenate([win[0, :], win[-1, :], win[:, 0], win[:, -1]])
    dark = border[border < 140]
    ref = int(np.median(dark)) if dark.size > 10 else 95
    diff = (np.abs(win - ref) > 24).astype(np.uint8)
    diff = cv2.morphologyEx(diff, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(diff, connectivity=8)
    big = 1 + int(np.argmax(st[1:, 4]))
    mask = (lab == big).astype(np.uint8)
    ring = np.pad(mask, 1)
    cv2.floodFill(ring, None, (0, 0), 2)
    mask[ring[1:-1, 1:-1] == 0] = 1
    return cv2.dilate(mask, np.ones((3, 3), np.uint8))


LANE_PERIOD = 29                    # distance between the dashes of the lane marking
BRIGHT_ROWS = {269, 270, 271, 273, 274, 275, 288, 289, 290}   # kerb lines and the lane marking: legitimately bright


def pick_ref(gray, rows, x_lo, x_hi, width, dirty, dark_below, allow_bright=BRIGHT_ROWS, light=True):
    """Finds the cleanest strip (no objects) of the avenue to repeat along the hole."""
    r0, r1 = rows
    best, best_x = None, None
    bright_rows = np.array([(y in allow_bright) for y in range(r0, r1)])
    for rx in range(x_lo, x_hi - width):
        if any(rx < bx1 and rx + width > bx0 for bx0, _, bx1, _ in dirty):
            continue
        win = gray[r0:r1, rx:rx + width]
        bad = (win < dark_below).mean() + (((win > 150) & ~bright_rows[:, None]).mean() if light else 0.0)
        if best is None or bad < best:
            best, best_x = bad, rx
    return best_x, best


def median_fill(plate, mask_full, rows, span=260):
    """Plain pavement: every row gets the median pavement colour of the surroundings (no objects to repeat)."""
    r0, r1 = rows
    sub = mask_full[r0:r1]
    cols = np.where(sub.any(axis=0))[0]
    if cols.size == 0:
        return
    hx0, hx1 = int(cols.min()), int(cols.max()) + 1
    lx0, lx1 = max(hx0 - span, 0), min(hx1 + span, W)
    gray = cv2.cvtColor(plate[r0:r1, lx0:lx1], cv2.COLOR_BGR2GRAY)
    fill = np.zeros((r1 - r0, 1, 3), np.float32)
    for y in range(r1 - r0):
        row = plate[r0 + y, lx0:lx1][gray[y] > 165]
        fill[y, 0] = np.median(row, axis=0) if len(row) > 10 else plate[r0 + y, lx0:lx1].reshape(-1, 3).mean(axis=0)
    alpha = cv2.GaussianBlur(sub[:, hx0:hx1].astype(np.float32), (0, 0), 1.0)[..., None]
    alpha = np.clip(alpha * 1.4, 0, 1) * (sub[:, hx0:hx1, None] > 0)
    plate[r0:r1, hx0:hx1] = (fill * alpha + plate[r0:r1, hx0:hx1] * (1 - alpha)).astype(np.uint8)


def tile_fill(plate, mask_full, rows, ref_x, width):
    """Repeats the reference strip over the masked part of the given rows, aligned with the neighbouring road."""
    r0, r1 = rows
    sub = mask_full[r0:r1]
    cols = np.where(sub.any(axis=0))[0]
    if cols.size == 0:
        return
    hx0, hx1 = int(cols.min()), int(cols.max()) + 1
    ref = plate[r0:r1, ref_x:ref_x + width].astype(np.float32)
    gray = cv2.cvtColor(plate[r0:r1], cv2.COLOR_BGR2GRAY).astype(np.float32)
    best, best_phase = None, 0
    ring = 8
    for phase in range(width):
        cost, n = 0.0, 0
        for x in list(range(max(hx0 - ring, 0), hx0)) + list(range(hx1, min(hx1 + ring, W))):
            col = ref[:, (x - hx0 + phase) % width]
            cost += float(((cv2.cvtColor(col[None].astype(np.uint8), cv2.COLOR_BGR2GRAY)[0].astype(np.float32) - gray[:, x]) ** 2).mean())
            n += 1
        if best is None or cost < best:
            best, best_phase = cost, phase
    strip = np.zeros((r1 - r0, hx1 - hx0, 3), np.float32)
    for x in range(hx0, hx1):
        strip[:, x - hx0] = ref[:, (x - hx0 + best_phase) % width]
    alpha = cv2.GaussianBlur(sub[:, hx0:hx1].astype(np.float32), (0, 0), 1.0)[..., None]
    alpha = np.clip(alpha * 1.4, 0, 1) * (sub[:, hx0:hx1, None] > 0)
    plate[r0:r1, hx0:hx1] = (strip * alpha + plate[r0:r1, hx0:hx1] * (1 - alpha)).astype(np.uint8)


def build_vehicles(bgr, gray, plate):
    """Cuts every vehicle and every pole out of the original, and clears the vehicles from the plate."""
    sprites, boxes = [], []
    for name, spec in VEHICLES.items():
        x0, y0, x1, y1 = spec['box']
        mask = vehicle_mask(gray, spec)
        full = np.zeros((H, W), np.uint8)
        full[y0:y1, x0:x1] = mask
        rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        rgba[..., :3] = bgr[y0:y1, x0:x1][..., ::-1]
        rgba[..., 3] = mask * 255
        sprites.append(dict(kind='vehicle', name=name, rgba=rgba, x=x0, y=y0, w=x1 - x0, h=y1 - y0, dir=spec['dir'], lane=spec['lane'], orig_bottom=int(np.max(np.where(mask > 0)[0]) + y0 + 1)))
        boxes.append((x0, y0, x1, y1))
        VEH_FULL[name] = full
    # Clean reference: a stretch of avenue (kerbs, lane marking) free of objects; sidewalks and kerbs get plain pavement.
    dirty = boxes + [(o[0], o[1], o[2], o[3]) for o in OCCLUDERS] + CROSSWALKS
    road_rows = (ROAD_TOP, ROAD_BOTTOM)
    width = LANE_PERIOD * 2
    road_ref, road_bad = pick_ref(gray, road_rows, 440, 1100, width, dirty, 55)
    print('road reference x=%s (bad %.3f)' % (road_ref, road_bad))
    for name, spec in VEHICLES.items():
        x0, y0, x1, y1 = spec['box']
        full = VEH_FULL[name]
        tile_fill(plate, full, road_rows, road_ref, width)
        if y0 < ROAD_TOP:                                   # a bus roof reaches over the kerb
            part = np.zeros((H, W), np.uint8)
            part[y0:ROAD_TOP] = full[y0:ROAD_TOP]
            median_fill(plate, part, (y0, ROAD_TOP))
        if y1 > ROAD_BOTTOM:                                # wheels below the road edge: kerb and pavement
            below = np.zeros((H, W), np.uint8)
            below[ROAD_BOTTOM:y1] = full[ROAD_BOTTOM:y1]
            median_fill(plate, below, (ROAD_BOTTOM, 328))
    poles = []
    for i, (x0, y0, x1, y1) in enumerate(OCCLUDERS):
        win = gray[y0:y1, x0:x1]
        m = cv2.morphologyEx((win < 110).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
        n, lab, st, _ = cv2.connectedComponentsWithStats(m, connectivity=8)
        if n < 2:
            continue
        keep = np.isin(lab, [1 + int(np.argmax(st[1:, 4]))]).astype(np.uint8)
        ring = np.pad(keep, 1)
        cv2.floodFill(ring, None, (0, 0), 2)
        keep[ring[1:-1, 1:-1] == 0] = 1
        rgba = np.zeros((y1 - y0, x1 - x0, 4), np.uint8)
        rgba[..., :3] = bgr[y0:y1, x0:x1][..., ::-1]
        rgba[..., 3] = keep * 255
        poles.append(dict(kind='pole', name='pole%d' % i, rgba=rgba, x=x0, y=y0, w=x1 - x0, h=y1 - y0))
    return sprites + poles


VEH_FULL = {}


def pack(sprites, width=1024):
    """Shelf-pack the sprites; returns the atlas image and writes sx/sy on each sprite."""
    sprites.sort(key=lambda s: -s['h'])
    x = y = shelf = 0
    for s in sprites:
        if x + s['w'] + 1 > width:
            x, y, shelf = 0, y + shelf + 1, 0
        s['sx'], s['sy'] = x, y
        x += s['w'] + 1
        shelf = max(shelf, s['h'])
    atlas = np.zeros((y + shelf + 1, width, 4), np.uint8)
    for s in sprites:
        atlas[s['sy']:s['sy'] + s['h'], s['sx']:s['sx'] + s['w']] = s['rgba']
    return atlas


LABELS = None


CELL = 4


def walkable_grid(plate):
    """1 where a walker's feet may stand: inside a walk zone, on pale pavement, away from every object."""
    gray = cv2.cvtColor(plate, cv2.COLOR_BGR2GRAY)
    blocked = (gray < 150).astype(np.uint8)
    for x0, y0, x1, y1 in NO_WALK:
        blocked[y0:y1, x0:x1] = 1
    for x0, y0, x1, y1 in OCCLUDERS:
        blocked[y0:y1, x0:x1] = 1
    blocked = cv2.dilate(blocked, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
    zone = np.zeros((H, W), np.uint8)
    for x0, y0, x1, y1 in WALK_ZONES:
        zone[y0:y1, x0:x1] = 1
    ok = (zone > 0) & (blocked == 0)
    gw, gh = W // CELL, H // CELL
    grid = ok[:gh * CELL, :gw * CELL].reshape(gh, CELL, gw, CELL).all(axis=(1, 3))
    return grid.astype(np.uint8)


def main():
    global LABELS
    parser = argparse.ArgumentParser()
    parser.add_argument('--debug', help='directory for overlay images')
    args = parser.parse_args()
    bgr, gray = load()
    people, _, LABELS = find_people(gray)
    print('pedestrians:', len(people))
    plate, sprites = build(bgr, gray, people)
    sprites += build_vehicles(bgr, gray, plate)
    atlas = pack(sprites)
    grid = walkable_grid(plate)
    os.makedirs(OUT, exist_ok=True)
    Image.fromarray(cv2.cvtColor(plate, cv2.COLOR_BGR2RGB)).save(os.path.join(OUT, 'plate.webp'), quality=92, method=6)
    Image.fromarray(atlas, 'RGBA').save(os.path.join(OUT, 'atlas.webp'), lossless=True, quality=100, method=6)
    Image.fromarray(grid * 255, 'L').save(os.path.join(OUT, 'walkable.png'), optimize=True)

    def entry(sp):
        return {k: sp[k] for k in ('sx', 'sy', 'w', 'h', 'x', 'y')}

    manifest = {
        'width': W, 'height': H, 'cell': CELL,
        'people': [entry(sp) for sp in sprites if 'kind' not in sp],
        'vehicles': [dict(entry(sp), name=sp['name'], dir=sp['dir'], lane=sp['lane'], bottom=sp['orig_bottom']) for sp in sprites if sp.get('kind') == 'vehicle'],
        'poles': [entry(sp) for sp in sprites if sp.get('kind') == 'pole'],
        'crosswalks': [[b[0], b[2]] for b in CROSSWALKS],
        'road': {'top': ROAD_TOP, 'bottom': ROAD_BOTTOM},
    }
    with open(os.path.join(OUT, 'life.js'), 'w') as fh:
        # a .js file: the PHP front controller serves static scripts, images and fonts only (no .json)
        fh.write('window.HashcodIntroLifeManifest=' + json.dumps(manifest, separators=(',', ':')) + ';\n')
    print('wrote', OUT, '| people', len(manifest['people']), 'vehicles', len(manifest['vehicles']), 'poles', len(manifest['poles']))
    if args.debug:
        os.makedirs(args.debug, exist_ok=True)
        cv2.imwrite(os.path.join(args.debug, 'plate.png'), plate)
        sheet = Image.fromarray(atlas, 'RGBA')
        bgm = Image.new('RGBA', sheet.size, (255, 0, 255, 255))
        bgm.alpha_composite(sheet)
        bgm.convert('RGB').save(os.path.join(args.debug, 'atlas.png'))
        vis = cv2.cvtColor(plate, cv2.COLOR_BGR2RGB).copy()
        ys, xs = np.where(grid > 0)
        for gy, gx in zip(ys, xs):
            vis[gy * CELL:(gy + 1) * CELL, gx * CELL:(gx + 1) * CELL, 1] = np.minimum(255, vis[gy * CELL:(gy + 1) * CELL, gx * CELL:(gx + 1) * CELL, 1].astype(int) + 70)
        Image.fromarray(vis).save(os.path.join(args.debug, 'walkable.png'))


if __name__ == '__main__':
    main()
