"""Extract the Brain + ECG brand mark from the Figma reference raster.

The Figma API is rate limited for this account, so the mark is reconstructed
from the exported 256x256 PNG:

  * the brain outline is traced by casting rays from outside the disc and
    taking the centre of the first contiguous stroke run,
  * the brain interior is derived from the traced outline so the ECG can be
    told apart from the outline itself,
  * the ECG waveform is isolated as the connected stroke component anchored on
    its flat baseline, then sampled column by column,
  * the vertical centre line is detected as the long vertical stroke.

Results are written twice, from one computation:

  assets/brand-vector.json   - consumed by render_brand_icons.py
  src/constants/brandVector.ts - consumed by BrandGlyph.tsx

so the vector can never drift between the app and the launcher icons.

Usage:  python scripts/extract_brand_vector.py <reference.png>
"""
from __future__ import annotations

import json
import math
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
CONSTANTS = ROOT / "src" / "constants"

GRID = 64.0
REF = 256.0

GRADIENT_FROM = "#22B9F2"
GRADIENT_TO = "#8E4BF6"


# ---------------------------------------------------------------- extraction
def load_mask(path: Path):
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    mask = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 200 and r > 200 and g > 200 and b > 200:
                mask[y][x] = True
    return im, mask, w, h


def trace_outline(mask, w, h):
    """Centreline of the brain outline, traced from the outside of the disc."""
    cx, cy = w / 2.0, h / 2.0
    max_r = int(math.hypot(w, h) / 2) + 2
    points = []
    for step in range(360):
        theta = step * math.pi / 180.0
        dx, dy = math.cos(theta), math.sin(theta)
        outer = None
        for r in range(max_r, 0, -1):
            x = int(round(cx + dx * r))
            y = int(round(cy + dy * r))
            if 0 <= x < w and 0 <= y < h and mask[y][x]:
                outer = r
                break
        if outer is None:
            continue
        r = outer
        while r > 0:
            x = int(round(cx + dx * r))
            y = int(round(cy + dy * r))
            if not (0 <= x < w and 0 <= y < h) or not mask[y][x]:
                break
            r -= 1
        mid = (outer + r + 1) / 2.0
        points.append((cx + dx * mid, cy + dy * mid))
    return points


def simplify(points, tolerance=0.8):
    """Douglas-Peucker simplification."""
    if len(points) < 3:
        return points

    def rdp(pts):
        if len(pts) < 3:
            return pts
        x1, y1 = pts[0]
        x2, y2 = pts[-1]
        dx, dy = x2 - x1, y2 - y1
        norm = math.hypot(dx, dy)
        best, best_i = -1.0, 0
        for i in range(1, len(pts) - 1):
            x, y = pts[i]
            dist = (math.hypot(x - x1, y - y1) if norm == 0
                    else abs(dy * x - dx * y + x2 * y1 - y2 * x1) / norm)
            if dist > best:
                best, best_i = dist, i
        if best <= tolerance:
            return [pts[0], pts[-1]]
        return rdp(pts[: best_i + 1])[:-1] + rdp(pts[best_i:])

    return rdp(points)


def polygon_interior(points, w, h):
    """Rasterise the traced outline into an interior mask (even-odd rule)."""
    inside = [[False] * w for _ in range(h)]
    n = len(points)
    for y in range(h):
        py = y + 0.5
        crossings = []
        for i in range(n):
            x1, y1 = points[i]
            x2, y2 = points[(i + 1) % n]
            if (y1 > py) != (y2 > py):
                crossings.append(x1 + (py - y1) * (x2 - x1) / (y2 - y1))
        crossings.sort()
        for i in range(0, len(crossings) - 1, 2):
            for x in range(max(0, int(crossings[i])), min(w, int(crossings[i + 1]))):
                inside[y][x] = True
    return inside


def longest_run_on_row(mask, w, h, inside, y):
    best = (0, 0, 0)
    run = 0
    start = 0
    for x in range(w + 1):
        ok = x < w and mask[y][x] and inside[y][x]
        if ok:
            if run == 0:
                start = x
            run += 1
        else:
            if run > best[0]:
                best = (run, start, x - 1)
            run = 0
    return best


def find_centre_line(mask, w, h):
    """Longest continuous vertical stroke."""
    best = (0, 0)
    for x in range(w):
        run = 0
        longest = 0
        for y in range(h):
            if mask[y][x]:
                run += 1
                longest = max(longest, run)
            else:
                run = 0
        if longest > best[1]:
            best = (x, longest)
    x = best[0]
    ys = [y for y in range(h) if mask[y][x]]
    spans, start, prev = [], None, None
    for y in ys:
        if start is None:
            start = prev = y
        elif y == prev + 1:
            prev = y
        else:
            spans.append((start, prev))
            start = prev = y
    if start is not None:
        spans.append((start, prev))
    spans.sort(key=lambda s: s[1] - s[0], reverse=True)
    y0, y1 = spans[0]
    return x, y0, y1


def label_component(mask, w, h, band, seed):
    """Connected white component containing `seed`, limited to the band rows."""
    seen = [[False] * w for _ in range(h)]
    comp = []
    q = deque([seed])
    seen[seed[1]][seed[0]] = True
    while q:
        x, y = q.popleft()
        comp.append((x, y))
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if not (0 <= nx < w and band[0] <= ny <= band[1]):
                continue
            if seen[ny][nx] or not mask[ny][nx]:
                continue
            seen[ny][nx] = True
            q.append((nx, ny))
    return comp


def extract_ecg(mask, w, h, inside, band):
    """Centreline of the ECG waveform, column by column."""
    # The flat tail is the longest uninterrupted horizontal run on any row.
    best = (0, 0, 0, 0)
    for y in range(band[0], band[1] + 1):
        run, start, longest = longest_run_on_row(mask, w, h, inside, y)
        if run > best[0]:
            best = (run, y, start, start + run - 1)
    _, baseline, bx0, bx1 = best
    if best[0] == 0:
        return [], baseline

    seed = ((bx0 + bx1) // 2, baseline)
    comp = label_component(mask, w, h, band, seed)
    columns = {}
    for x, y in comp:
        columns.setdefault(x, []).append(y)

    samples = []
    for x in sorted(columns):
        ys = sorted(columns[x])
        lo, hi = ys[0], ys[-1]
        if hi - lo > 45:          # the vertical centre line merges here
            continue
        samples.append((x, (lo + hi) / 2.0))
    return samples, baseline


def fill_gap(samples, gap_lo, gap_hi):
    """Interpolate across the columns hidden by the vertical centre line."""
    if not samples:
        return samples
    out = list(samples)
    for i in range(len(out) - 1):
        x0, y0 = out[i]
        x1, y1 = out[i + 1]
        if x1 - x0 <= 1:
            continue
        for x in range(x0 + 1, x1):
            t = (x - x0) / (x1 - x0)
            out.append((x, y0 + (y1 - y0) * t))
    out.sort()
    return out


def simplify_polyline(points, tolerance=0.6):
    """Douglas-Peucker for an open polyline."""
    if len(points) < 3:
        return points

    def rdp(pts):
        if len(pts) < 3:
            return pts
        x1, y1 = pts[0]
        x2, y2 = pts[-1]
        dx, dy = x2 - x1, y2 - y1
        norm = math.hypot(dx, dy)
        best, best_i = -1.0, 0
        for i in range(1, len(pts) - 1):
            x, y = pts[i]
            dist = (math.hypot(x - x1, y - y1) if norm == 0
                    else abs(dy * x - dx * y + x2 * y1 - y2 * x1) / norm)
            if dist > best:
                best, best_i = dist, i
        if best <= tolerance:
            return [pts[0], pts[-1]]
        return rdp(pts[: best_i + 1])[:-1] + rdp(pts[best_i:])

    return rdp(points)


# ---------------------------------------------------------------- geometry
def to_grid(points):
    return [[round(x * GRID / REF, 2), round(y * GRID / REF, 2)] for x, y in points]


def catmull_rom_path(points, closed=True):
    """Smooth a closed point list into cubic Beziers."""
    n = len(points)
    if n < 3:
        return ""
    d = [f"M{points[0][0]:.2f} {points[0][1]:.2f}"]
    last = n if closed else n - 1
    for i in range(last):
        p0 = points[(i - 1) % n] if closed else points[max(i - 1, 0)]
        p1 = points[i % n]
        p2 = points[(i + 1) % n]
        p3 = points[(i + 2) % n] if closed else points[min(i + 2, n - 1)]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6.0, p1[1] + (p2[1] - p0[1]) / 6.0)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6.0, p2[1] - (p3[1] - p1[1]) / 6.0)
        d.append(
            f"C{c1[0]:.2f} {c1[1]:.2f} {c2[0]:.2f} {c2[1]:.2f} {p2[0]:.2f} {p2[1]:.2f}"
        )
    if closed:
        d.append("Z")
    return " ".join(d)


def polyline_path(points):
    if not points:
        return ""
    d = [f"M{points[0][0]:.2f} {points[0][1]:.2f}"]
    for x, y in points[1:]:
        d.append(f"L{x:.2f} {y:.2f}")
    return " ".join(d)


# ---------------------------------------------------------------- rendering
def render_reference_mark(outline_pts, ecg_pts, centre, size, stroke_px,
                          outline_width=None):
    """Render the mark to a Pillow image for visual diffing."""
    outline_width = outline_width or stroke_px
    scale = size / REF
    im = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    grad = Image.new("RGBA", (size, size))
    data = []
    c0 = tuple(int(GRADIENT_FROM[i:i + 2], 16) for i in (1, 3, 5))
    c1 = tuple(int(GRADIENT_TO[i:i + 2], 16) for i in (1, 3, 5))
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * max(1, size - 1))
            data.append(tuple(round(c0[k] * (1 - t) + c1[k] * t) for k in range(3)) + (255,))
    grad.putdata(data)
    mask = Image.new("L", (size, size))
    ImageDraw.Draw(mask).ellipse((0, 0, size - 1, size - 1), fill=255)
    im.paste(grad, (0, 0), mask)

    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    def stroke(pts, width_px, closed):
        w = max(1, round(width_px * scale))
        scaled = [(x * scale, y * scale) for x, y in pts]
        if len(scaled) > 1:
            draw.line(scaled, fill="white", width=w, joint="curve")
        r = w / 2.0
        for x, y in scaled:
            draw.ellipse((x - r, y - r, x + r, y + r), fill="white")

    stroke(outline_pts, outline_width, True)
    if centre:
        stroke([(centre[0], centre[1]), (centre[0], centre[2])], stroke_px, False)
    stroke(ecg_pts, stroke_px, False)
    im.alpha_composite(layer)
    return im


def stroke_iou(ref_mask, out_mask, w, h):
    a = b = 0
    for y in range(h):
        for x in range(w):
            if ref_mask[y][x] and out_mask[y][x]:
                a += 1
            if ref_mask[y][x] or out_mask[y][x]:
                b += 1
    return a / b if b else 0.0


def outline_run_widths(outline_raw, mask, w, h):
    """Stroke width of the brain outline, measured along the trace rays."""
    cx, cy = w / 2.0, h / 2.0
    max_r = int(math.hypot(w, h) / 2) + 2
    widths = []
    for step in range(0, 360, 4):
        theta = step * math.pi / 180.0
        dx, dy = math.cos(theta), math.sin(theta)
        outer = None
        for r in range(max_r, 0, -1):
            x = int(round(cx + dx * r))
            y = int(round(cy + dy * r))
            if 0 <= x < w and 0 <= y < h and mask[y][x]:
                outer = r
                break
        if outer is None:
            continue
        r = outer
        while r > 0:
            x = int(round(cx + dx * r))
            y = int(round(cy + dy * r))
            if not (0 <= x < w and 0 <= y < h) or not mask[y][x]:
                break
            r -= 1
        widths.append(outer - (r + 1) + 1)
    return widths


def tune_strokes(outline, ecg, centre, ref_mask, w, h):
    """Search the two stroke widths that best reproduce the reference."""
    best = None
    for ow in [4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0]:
        for ew in [4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5]:
            img = render_reference_mark(
                outline, ecg, centre, 256, ew, outline_width=ow
            )
            px = img.load()
            m = [[False] * w for _ in range(h)]
            for y in range(h):
                for x in range(w):
                    r, g, b, a = px[x, y]
                    if a > 200 and r > 200 and g > 200 and b > 200:
                        m[y][x] = True
            iou = stroke_iou(ref_mask, m, w, h)
            if best is None or iou > best[0]:
                best = (iou, ow, ew)
    return best


def main() -> int:
    if len(sys.argv) < 2:
        print("usage: extract_brand_vector.py <reference.png>")
        return 1
    ref_path = Path(sys.argv[1])
    if not ref_path.exists():
        print(f"reference not found: {ref_path}")
        return 1

    im, mask, w, h = load_mask(ref_path)
    print(f"reference {ref_path.name} -> {w}x{h}")

    outline_raw = trace_outline(mask, w, h)
    outline = simplify(outline_raw, 0.8)
    print(f"brain outline: {len(outline_raw)} sampled -> {len(outline)} points")

    cx, cy0, cy1 = find_centre_line(mask, w, h)
    print(f"centre line: x={cx} y={cy0}..{cy1}")

    inside = polygon_interior(outline_raw, w, h)
    band = (int(h * 0.36), int(h * 0.64))
    ecg, baseline = extract_ecg(mask, w, h, inside, band)
    print(f"ECG baseline row {baseline}: {len(ecg)} columns")

    ecg = fill_gap(ecg, cx - 5, cx + 5)
    ecg_simple = simplify_polyline(ecg, 0.35)
    print(f"ECG: {len(ecg)} -> {len(ecg_simple)} points")

    # Stroke width: the vertical extent of the ECG run that contains the
    # baseline row on a flat column. The run stops at the stroke edge, so it
    # is not polluted by the brain outline.
    stroke_px = 6.0
    widths = []
    for x in range(60, 90):
        if not (0 <= x < w and mask[baseline][x]):
            continue
        lo = baseline
        while lo > 0 and mask[lo - 1][x]:
            lo -= 1
        hi = baseline
        while hi < h - 1 and mask[hi + 1][x]:
            hi += 1
        widths.append(hi - lo + 1)
    if widths:
        stroke_px = max(4.0, round(sum(widths) / len(widths), 1))
    print(f"stroke width: {stroke_px}px -> {stroke_px * GRID / REF:.2f} grid units")

    grid_outline = to_grid(outline)
    grid_ecg = to_grid(ecg_simple)
    grid_centre = (
        round(cx * GRID / REF, 2),
        round(cy0 * GRID / REF, 2),
        round(cy1 * GRID / REF, 2),
    )

    outline_d = catmull_rom_path(grid_outline, closed=True)
    ecg_d = polyline_path(grid_ecg)

    # ---- tune the two stroke widths against the reference, then verify
    iou, outline_px, ecg_px = tune_strokes(
        outline, ecg, (cx, cy0, cy1), mask, w, h
    )
    print(f"tuned strokes: outline {outline_px}px, ecg {ecg_px}px")
    print(f"stroke IoU vs reference: {iou * 100:.1f}%")

    rendered = render_reference_mark(
        outline, ecg, (cx, cy0, cy1), 256, ecg_px, outline_width=outline_px
    )
    rpx = rendered.load()
    rmask = [[False] * w for _ in range(h)]
    for y in range(h):
        for x in range(w):
            r, g, b, a = rpx[x, y]
            if a > 200 and r > 200 and g > 200 and b > 200:
                rmask[y][x] = True
    final_iou = stroke_iou(mask, rmask, w, h)
    print(f"final stroke IoU: {final_iou * 100:.1f}%")

    out = Image.new("RGBA", (512, 512), (255, 255, 255, 255))
    out.paste(rendered, (128, 128), rendered)
    out.save(ASSETS / "brand-vector-preview.png")

    data = {
        "reference": ref_path.name,
        "grid": GRID,
        "strokeWidth": round(ecg_px * GRID / REF, 2),
        "outlineStrokeWidth": round(outline_px * GRID / REF, 2),
        "gradient": {"from": GRADIENT_FROM, "to": GRADIENT_TO},
        "outline": outline_d,
        "ecg": ecg_d,
        "centreLine": {"x": grid_centre[0], "y0": grid_centre[1], "y1": grid_centre[2]},
        "iou": round(final_iou, 4),
    }
    ASSETS.mkdir(parents=True, exist_ok=True)
    (ASSETS / "brand-vector.json").write_text(json.dumps(data, indent=2), encoding="utf-8")

    CONSTANTS.mkdir(parents=True, exist_ok=True)
    ts = (
        "/**\n"
        " * Brand vector for the Brain + ECG mark.\n"
        " *\n"
        " * Generated by scripts/extract_brand_vector.py from the Figma reference.\n"
        " * Edit the generator, not this file - render_brand_icons.py reads the same\n"
        " * data so the app and the launcher icons can never drift apart.\n"
        " */\n"
        f"export const BRAND_GRID = {GRID};\n"
        f"export const BRAND_STROKE_WIDTH = {data['strokeWidth']};\n"
        f"export const BRAND_OUTLINE_STROKE_WIDTH = {data['outlineStrokeWidth']};\n"
        f"export const BRAND_GRADIENT_FROM = \"{GRADIENT_FROM}\";\n"
        f"export const BRAND_GRADIENT_TO = \"{GRADIENT_TO}\";\n"
        f"export const BRAND_OUTLINE_PATH =\n  \"{outline_d}\";\n"
        f"export const BRAND_ECG_PATH =\n  \"{ecg_d}\";\n"
        f"export const BRAND_CENTRE_LINE = {{\n"
        f"  x: {grid_centre[0]},\n"
        f"  y0: {grid_centre[1]},\n"
        f"  y1: {grid_centre[2]},\n"
        f"}};\n"
    )
    (CONSTANTS / "brandVector.ts").write_text(ts, encoding="utf-8")
    print(f"\nwrote {ASSETS / 'brand-vector.json'}")
    print(f"wrote {CONSTANTS / 'brandVector.ts'}")
    print(f"wrote {ASSETS / 'brand-vector-preview.png'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
