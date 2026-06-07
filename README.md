# facefreereels

Generate face-free vertical reels (9:16) with AI voiceover, optional B-roll, and burned-in captions.

No on-camera footage required -- drop stock clips into `assets/broll/` or render on a solid background.

## Quick start

```bash
curl -fsSL https://raw.githubusercontent.com/nautical8589882116/facefreereels/main/setup.sh -o setup.sh
bash setup.sh
```

Or clone and run locally:

```bash
git clone https://github.com/nautical8589882116/facefreereels.git
cd facefreereels
bash setup.sh
```

## Create a reel

```bash
source .venv/bin/activate   # Git Bash / WSL / macOS / Linux
# .venv\Scripts\activate    # Windows PowerShell

python -m facefreereels create \
  --script "Three habits that changed how I ship content without showing my face." \
  --title habits-reel
```

Output lands in `output/`.

## Optional B-roll

Place `.mp4`, `.mov`, `.mkv`, or `.webm` files in `assets/broll/`. The first match is looped and cropped to 1080x1920.

## Configuration

Copy `.env.example` to `.env` (setup does this automatically):

| Variable | Default | Description |
|----------|---------|-------------|
| `FFR_VOICE` | `en-US-JennyNeural` | edge-tts voice |
| `FFR_WIDTH` | `1080` | Output width |
| `FFR_HEIGHT` | `1920` | Output height |
| `FFR_FPS` | `30` | Frame rate |
| `FFR_BG_COLOR` | `#0f172a` | Background when no B-roll |
| `FFR_TEXT_COLOR` | `#f8fafc` | Caption color |

List voices: `python -m facefreereels list-voices`

## Requirements

- Python 3.10+
- ffmpeg + ffprobe

## Commands

```bash
python -m facefreereels doctor     # check dependencies
python -m facefreereels --version
python -m facefreereels create --script "..." --title my-reel
```
