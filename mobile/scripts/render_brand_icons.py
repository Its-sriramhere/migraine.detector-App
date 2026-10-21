"""Render the shared neural mark into Android launcher assets (Pillow)."""
from pathlib import Path
import math
import re
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets"
OUTLINE = "M32 14 C27 10 22 13 20 17 C14 18 12 23 14 28 C9 32 11 39 15 41 C14 47 19 51 24 50 C27 54 31 52 32 50 C36 54 41 52 43 49 C49 49 52 44 50 40 C55 36 53 30 50 27 C52 22 48 17 44 17 C40 12 36 11 32 14"
BRANCHES = ["M32 14 V47", "M32 25 C26 22 22 25 21 30", "M32 34 C26 34 23 38 23 42", "M32 34 C39 34 42 38 42 42", "M32 25 C38 22 41 24 43 28"]


def points(path):
    tokens = re.findall(r"[MCV]|-?\d+(?:\.\d+)?", path)
    result, cursor, i = [], (0, 0), 0
    while i < len(tokens):
        op = tokens[i]
        i += 1
        if op == "M":
            cursor = (float(tokens[i]), float(tokens[i + 1]))
            result.append(cursor)
            i += 2
        elif op == "V":
            cursor = (cursor[0], float(tokens[i]))
            result.append(cursor)
            i += 1
        elif op == "C":
            values = list(map(float, tokens[i:i + 6]))
            i += 6
            start, a, b, end = cursor, values[:2], values[2:4], values[4:]
            for step in range(1, 41):
                t = step / 40
                result.append(tuple((1-t)**3 * start[k] + 3*(1-t)**2*t*a[k] + 3*(1-t)*t*t*b[k] + t**3*end[k] for k in (0, 1)))
            cursor = tuple(end)
        else:
            raise ValueError(op)
    return result


def mark(canvas, diameter, monochrome=False):
    left = (canvas.width - diameter) // 2
    top = (canvas.height - diameter) // 2
    if not monochrome:
        gradient = Image.new("RGBA", (diameter, diameter))
        data = []
        for y in range(diameter):
            for x in range(diameter):
                t = (x + y) / (2 * max(1, diameter - 1))
                start, end = ((45,157,235),(65,107,234)) if t < .5 else ((65,107,234),(118,85,223))
                mix = t * 2 if t < .5 else (t - .5) * 2
                data.append(tuple(round(start[k]*(1-mix)+end[k]*mix) for k in (0,1,2)) + (255,))
        gradient.putdata(data)
        mask = Image.new("L", (diameter, diameter))
        ImageDraw.Draw(mask).ellipse((0,0,diameter-1,diameter-1), fill=255)
        canvas.paste(gradient, (left,top), mask)
    draw = ImageDraw.Draw(canvas)
    scale = diameter / 64
    for path in [OUTLINE, *BRANCHES]:
        draw.line([(left+x*scale, top+y*scale) for x,y in points(path)], fill="white", width=max(1,round(1.8*scale)), joint="curve")
    for x,y,r in [(32,34,2.6),(23,42,2),(42,42,2),(21,30,1.7)]:
        draw.ellipse((left+(x-r)*scale,top+(y-r)*scale,left+(x+r)*scale,top+(y+r)*scale),fill="white")


if __name__ == "__main__":
    for name, diameter, mono in [("brand-icon.png", 960, False), ("brand-adaptive.png", 660, False), ("brand-monochrome.png", 660, True)]:
        image = Image.new("RGBA", (1024, 1024), (248,251,255,255) if name == "brand-icon.png" else (0,0,0,0))
        mark(image, diameter, mono)
        image.save(ASSETS / name)
        print(name)
