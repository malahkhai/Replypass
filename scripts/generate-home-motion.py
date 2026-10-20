"""Generate the original, silent homepage loops and posters.

Run with Pillow and ffmpeg installed locally:
  FFMPEG_BIN=/path/to/ffmpeg python3 scripts/generate-home-motion.py

All names and amounts in the social and earnings sequences are illustrative.
The profile sequence uses the approved Mimi portrait already in this repository.
"""

from __future__ import annotations

import math
import os
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "public" / "videos"
OUTPUT.mkdir(exist_ok=True)
W, H, FPS, SECONDS = 720, 560, 12, 6
FONT_DIR = Path("/System/Library/Fonts/Supplemental")
REGULAR = FONT_DIR / "Arial.ttf"
BOLD = FONT_DIR / "Arial Bold.ttf"
PHOTO = Image.open(ROOT / "public/images/mimi-feature.webp").convert("RGB")


def font(size: int, bold: bool = False):
    return ImageFont.truetype(str(BOLD if bold else REGULAR), size)


def ease(value: float) -> float:
    value = max(0.0, min(1.0, value))
    return value * value * (3 - 2 * value)


def solid(color: str) -> Image.Image:
    return Image.new("RGBA", (W, H), color)


def rr(draw: ImageDraw.ImageDraw, box, radius: int, fill, outline=None, width=1):
    draw.rounded_rectangle(tuple(map(int, box)), radius, fill=fill, outline=outline, width=width)


def label(draw, pos, value, size=20, color="#263027", bold=False):
    draw.text(tuple(map(int, pos)), value, font=font(size, bold), fill=color)


def photo_crop(width: int, height: int) -> Image.Image:
    sw, sh = PHOTO.size
    scale = max(width / sw, height / sh)
    scaled = PHOTO.resize((math.ceil(sw * scale), math.ceil(sh * scale)), Image.Resampling.LANCZOS)
    left = int((scaled.width - width) * 0.43)
    top = int((scaled.height - height) * 0.48)
    return scaled.crop((left, top, left + width, top + height)).convert("RGBA")


def paste_rounded(base: Image.Image, subject: Image.Image, box, radius: int):
    x, y, width, height = map(int, box)
    subject = subject.resize((width, height), Image.Resampling.LANCZOS)
    mask = Image.new("L", (width, height))
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, width, height), radius, fill=255)
    base.paste(subject, (x, y), mask)


def shadow(base, box, radius=24, blur=16, alpha=55):
    layer = Image.new("RGBA", (W, H))
    ImageDraw.Draw(layer).rounded_rectangle(box, radius, fill=(20, 30, 22, alpha))
    base.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))


def background(dark=False):
    im = solid("#223029" if dark else "#eef1e8")
    d = ImageDraw.Draw(im)
    d.ellipse((-130, 190, 360, 680), fill="#314537" if dark else "#d5e0d2")
    d.ellipse((435, -260, 920, 220), fill="#3c503e" if dark else "#e2e9d9")
    return im


def profile_frame(t):
    im = background(True)
    d = ImageDraw.Draw(im)
    y = 20 + int(5 * math.sin(t * math.pi / 3))
    card = (172, y + 3, 548, y + 536)
    shadow(im, (card[0] + 8, card[1] + 12, card[2] + 8, card[3] + 12), 27, 22, 85)
    rr(d, card, 26, "#fffefa")
    label(d, (195, y + 20), "replypass", 25, bold=True)
    label(d, (321, y + 20), ".", 25, "#dc5146", True)
    rr(d, (430, y + 16, 529, y + 49), 17, "#f2f4ef", "#d8ded6")
    label(d, (443, y + 24), "My ReplyPass", 12, bold=True)
    paste_rounded(im, photo_crop(344, 228), (188, y + 61, 344, 228), 16)
    d = ImageDraw.Draw(im)
    rr(d, (201, y + 76, 338, y + 105), 15, "#f8f8f0")
    d.ellipse((213, y + 86, 223, y + 96), fill="#3d8660")
    label(d, (231, y + 82), "Open to requests", 13, bold=True)
    rr(d, (443, y + 257, 519, y + 281), 12, "#1d2620aa")
    label(d, (456, y + 262), "1 / 3  Swipe", 10, "#ffffff", True)
    label(d, (193, y + 303), "Mimi_Kiki", 30, bold=True)
    d.ellipse((366, y + 313, 386, y + 333), fill="#dc5146")
    d.line((371, y + 323, 375, y + 327, 382, y + 318), fill="#ffffff", width=2)
    rr(d, (454, y + 307, 524, y + 338), 15, "#eef2ea", "#b8c7b0")
    label(d, (468, y + 315), "@mimi", 13, "#425a3f")
    for i, word in enumerate(("Creator", "Model", "Athlete")):
        left = (194, 277, 350)[i]
        right = (267, 340, 427)[i]
        rr(d, (left, y + 352, right, y + 377), 13, "#f7f8f5", "#e0e4dd")
        label(d, (left + 10, y + 358), word, 12, "#5a6558")
    label(d, (195, y + 392), "France   ·   I trust myself so much", 15, "#425043")
    for i, (letter, color) in enumerate((("IG", "#b7498a"), ("X", "#20282b"), ("W", "#5e8269"))):
        cx = 210 + i * 39
        d.ellipse((cx - 15, y + 428, cx + 15, y + 458), fill="#f6f7f2", outline="#dce1d9")
        label(d, (cx - (9 if len(letter) == 2 else 6), y + 436), letter, 12, color, True)
    active = ease((t - 2.3) / 0.7) * (1 - ease((t - 4.9) / 0.7))
    rr(d, (189, y + 476, 385, y + 521), 12, "#263027")
    if active:
        rr(d, (190, y + 477, 384, y + 520), 11, "#344637", "#80a37a", 2)
    label(d, (236, y + 488), "Message  €4", 19, "#ffffff", True)
    rr(d, (396, y + 476, 531, y + 521), 12, "#e9eee2")
    label(d, (414, y + 488), "VIP €19/mo", 15, "#3d553b", True)
    rr(d, (25, 69, 153, 116), 22, "#fffefa")
    label(d, (45, 83), "Your page", 18, "#263027", True)
    rr(d, (554, 410, 698, 457), 22, "#fffefa")
    label(d, (572, 423), "Your price", 18, "#263027", True)
    return im.convert("RGB")


def social_scene():
    im = background(False)
    d = ImageDraw.Draw(im)
    shadow(im, (165, 25, 570, 552), 32, 20, 52)
    rr(d, (165, 25, 570, 552), 32, "#10141d")
    rr(d, (178, 39, 557, 537), 26, "#10141d")
    label(d, (205, 58), "‹", 38, "#ffffff")
    label(d, (292, 68), "mimi", 23, "#ffffff", True)
    label(d, (517, 68), "•••", 22, "#ffffff")
    paste_rounded(im, photo_crop(102, 102), (203, 128, 102, 102), 51)
    d = ImageDraw.Draw(im)
    d.ellipse((201, 126, 307, 232), outline="#e6598c", width=5)
    label(d, (332, 157), "Creator  ·  Model  ·  Athlete", 15, "#ffffff", True)
    label(d, (332, 186), "A place for closer conversations", 12, "#c2c6c6")
    label(d, (206, 257), "Mimi_Kiki", 22, "#ffffff", True)
    label(d, (206, 286), "Creator  ·  Model  ·  Athlete", 14, "#b9c0bf")
    label(d, (206, 317), "Ask me a question on ReplyPass.", 17, "#f6f5f0")
    label(d, (206, 353), "getreplypass.com/mimi", 19, "#91b4ff", True)
    rr(d, (205, 418, 390, 468), 12, "#355ce1")
    rr(d, (399, 418, 541, 468), 12, "#30343d")
    label(d, (266, 431), "Follow", 19, "#ffffff", True)
    label(d, (438, 431), "Message", 19, "#ffffff", True)
    return im


def request_scene():
    im = background(False)
    d = ImageDraw.Draw(im)
    shadow(im, (158, 27, 563, 550), 32, 18, 50)
    rr(d, (158, 27, 563, 550), 32, "#fffefa")
    label(d, (184, 50), "replypass", 25, bold=True)
    label(d, (311, 50), ".", 25, "#dc5146", True)
    paste_rounded(im, photo_crop(375, 227), (173, 92, 375, 227), 19)
    d = ImageDraw.Draw(im)
    label(d, (183, 335), "Mimi_Kiki", 29, bold=True)
    label(d, (184, 375), "Ask me a question. I'll reply personally.", 16, "#4a5a4b")
    rr(d, (180, 425, 542, 493), 15, "#263027")
    label(d, (220, 448), "Get a Guaranteed Reply  ·  €4", 18, "#ffffff", True)
    return im


def message_scene():
    im = background(False)
    d = ImageDraw.Draw(im)
    shadow(im, (112, 40, 608, 526), 26, 16, 40)
    rr(d, (112, 40, 608, 526), 26, "#fffefa")
    label(d, (142, 66), "replypass", 23, bold=True)
    label(d, (259, 66), ".", 23, "#dc5146", True)
    label(d, (142, 119), "How a paid reply works", 21, bold=True)
    rr(d, (145, 185, 515, 268), 18, "#edf1e9")
    label(d, (164, 199), "FAN QUESTION", 13, "#688369", True)
    label(d, (164, 229), "What inspired your latest look?", 19, "#253126")
    rr(d, (222, 305, 578, 406), 18, "#d95348")
    label(d, (242, 319), "CREATOR REPLIES", 13, "#ffe5e1", True)
    label(d, (242, 350), "I started with one piece I loved", 17, "#ffffff")
    label(d, (242, 374), "and built the rest around it.", 17, "#ffffff")
    d.ellipse((145, 449, 174, 478), fill="#5f8967")
    d.line((153, 463, 158, 468, 167, 457), fill="#ffffff", width=3)
    label(d, (189, 451), "Reply sent  ·  Payment completed", 16, "#4b684f", True)
    return im


def social_frame(t):
    scenes = (social_scene(), request_scene(), message_scene())
    if t < 1.65:
        base, next_im, progress = scenes[0], scenes[1], 0
    elif t < 2.15:
        base, next_im, progress = scenes[0], scenes[1], ease((t - 1.65) / 0.5)
    elif t < 3.65:
        base, next_im, progress = scenes[1], scenes[2], 0
    elif t < 4.15:
        base, next_im, progress = scenes[1], scenes[2], ease((t - 3.65) / 0.5)
    elif t < 5.55:
        base, next_im, progress = scenes[2], scenes[0], 0
    else:
        base, next_im, progress = scenes[2], scenes[0], ease((t - 5.55) / 0.45)
    im = Image.blend(base, next_im, progress)
    d = ImageDraw.Draw(im)
    if t < 1.7:
        pulse = (math.sin(t * math.pi * 2.2) + 1) / 2
        rr(d, (196, 342, 483, 387), 11, None, "#91b4ff", 2 + int(pulse * 3))
        d.ellipse((442, 352, 464, 374), fill="#fffefa", outline="#253b61", width=2)
    return im.convert("RGB")


def dashboard_frame(t):
    im = background(False)
    d = ImageDraw.Draw(im)
    shadow(im, (50, 52, 670, 506), 26, 17, 43)
    rr(d, (50, 52, 670, 506), 26, "#fffefa")
    rr(d, (50, 52, 670, 112), 24, "#243129")
    d.rectangle((50, 85, 670, 112), fill="#243129")
    label(d, (74, 69), "replypass", 24, "#ffffff", True)
    label(d, (199, 69), ".", 24, "#dc5146", True)
    label(d, (527, 76), "Your earnings", 14, "#e7f1e5", True)
    label(d, (77, 136), "Clear numbers. Every reply.", 25, bold=True)
    label(d, (78, 172), "Track what is secured, earned and sent to payouts.", 15, "#667265")
    secured = t < 2.2
    earned = t >= 2.2
    transferred = t >= 4.25
    cards = (("SECURED", "€15.00" if secured else "€0.00", "Awaiting your reply"),
             ("EARNED", "€12.75" if earned else "€0.00", "After your reply"),
             ("TRANSFERRED", "€12.75" if transferred else "€0.00", "To payout balance"))
    for index, (title, amount, note) in enumerate(cards):
        left = 77 + 193 * index
        rr(d, (left, 213, left + 178, 333), 17, "#eef2eb" if index == (0 if secured else 2 if transferred else 1) else "#f8f8f3", "#dce5d9")
        label(d, (left + 16, 229), title, 12, "#658063", True)
        label(d, (left + 16, 253), amount, 28, "#263128", True)
        label(d, (left + 16, 301), note, 11, "#687668")
    label(d, (79, 359), "Recent activity", 18, bold=True)
    rr(d, (77, 390, 643, 468), 14, "#f8f8f4", "#e4e9df")
    d.ellipse((92, 410, 135, 453), fill="#e6eee2")
    rr(d, (104, 419, 124, 434), 4, None, "#5f8063", 2)
    d.line((105, 422, 114, 429, 123, 422), fill="#5f8063", width=2)
    label(d, (153, 402), "Guaranteed Reply", 17, bold=True)
    label(d, (153, 431), "€15 request  ·  85% creator share", 12, "#657366")
    status = "Secured" if secured else "Transferred" if transferred else "Earned"
    label(d, (526 if len(status) < 9 else 506, 418), status, 14, "#527753", True)
    # A subtle status indicator moves across the three actual payout stages.
    for index in range(3):
        color = "#d95348" if index == (0 if secured else 2 if transferred else 1) else "#d8dfd5"
        d.ellipse((309 + index * 29, 486, 318 + index * 29, 495), fill=color)
    return im.convert("RGB")


def encode(name, render, poster_at):
    output = OUTPUT / f"{name}.mp4"
    ffmpeg = os.environ.get("FFMPEG_BIN", "ffmpeg")
    command = [ffmpeg, "-loglevel", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}",
               "-r", str(FPS), "-i", "-", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "25",
               "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(output)]
    process = subprocess.Popen(command, stdin=subprocess.PIPE)
    try:
        for index in range(FPS * SECONDS):
            frame = render(index / FPS)
            if index == poster_at:
                frame.save(OUTPUT / f"{name}-poster.webp", "WEBP", quality=88)
            process.stdin.write(frame.tobytes())
    finally:
        process.stdin.close()
    if process.wait() != 0:
        raise RuntimeError(f"ffmpeg failed for {name}")
    print(output.name, output.stat().st_size)


if __name__ == "__main__":
    encode("creator-page", profile_frame, 30)
    encode("social-to-reply", social_frame, 12)
    encode("creator-earnings", dashboard_frame, 58)
