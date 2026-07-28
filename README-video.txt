================================================================
 COMPRESSING THE VIDEOS BEFORE YOU DEPLOY
================================================================

Right now two files in /videos are 331 MB each:
  - omnicool.mp4          -> the FULL demo shown in the "Videos" section
  - digital-twin-bg.mp4   -> the background loop behind the "About Me" section
    (currently a copy of the full video — MUST be shrunk before deploy)

331 MB is far too large for a website. Visitors would download a third
of a gigabyte, and most free hosts reject files that big. Compress both
with ffmpeg (free): https://ffmpeg.org/download.html
On Windows you can also install it with:  winget install Gyan.FFmpeg

----------------------------------------------------------------
1) BACKGROUND LOOP  (digital-twin-bg.mp4)  -- make this SMALL
----------------------------------------------------------------
It's muted and just needs to look good behind text. Trim to a short
segment, drop the audio, scale to 720p, and compress hard.

Take a 20-second slice starting at 5s, no audio, ~720p:

  ffmpeg -ss 00:00:05 -i omnicool.mp4 -t 20 -an ^
    -vf "scale=1280:-2" -c:v libx264 -crf 30 -preset veryslow ^
    -movflags +faststart -pix_fmt yuv420p digital-twin-bg.mp4

Target result: roughly 2-6 MB. (Raise -crf to 32-34 for smaller,
lower to 26-28 for higher quality. Change -ss / -t to pick the clip.)

----------------------------------------------------------------
2) FULL DEMO  (omnicool.mp4)  -- keep quality, cut the file size
----------------------------------------------------------------

  ffmpeg -i omnicool.mp4 -vf "scale=1920:-2" ^
    -c:v libx264 -crf 24 -preset slow ^
    -c:a aac -b:a 128k -movflags +faststart omnicool-web.mp4

Then replace the original:
  - delete omnicool.mp4
  - rename omnicool-web.mp4  ->  omnicool.mp4

(A ~1080p H.264 clip at crf 24 is usually a few MB per minute.)

----------------------------------------------------------------
NOTES
----------------------------------------------------------------
- Keep the FILENAMES the same (digital-twin-bg.mp4, omnicool.mp4) and
  the site picks them up automatically — no HTML editing needed.
- ^ is the line-continuation character for Windows CMD. In PowerShell
  use a backtick ` instead, or just put the whole command on one line.
- "-movflags +faststart" lets the video start playing before it fully
  downloads — important for web.
================================================================
