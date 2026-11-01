# HANDOFF — local-studio-usb-ai-demo

Resume file for a fresh session. Last update: 1 Nov 2026.

## State

- Repo: https://github.com/az9713/local-studio-usb-ai-demo (public, Pages from `main` root).
  - `README.md` onboarding guide; `local-studio-windows-setup.html` full manual (live on Pages).
  - `studio/` = upstream techjarves/Portable-Local-Studio (MIT), ZIP of main from 31 Oct 2026,
    imported unchanged in commit `d7d2d2e`, then the Video feature on top.
- Video feature (AnimateDiff text-to-video, Windows only):
  - `studio/scripts/server/video.cjs` (new): `/api/video/*` routes, spawns `app\backend\win\cuda\sd-cli.exe -M vid_gen`.
  - `studio/app/frontend/src/components/VideoGenerator.jsx` (new): sidebar Video page + `VideoModels` card for Models → Video.
  - Small edits: `serve.cjs` (+9 lines), `App.jsx`, `Sidebar.jsx`, `ModelManager.jsx`, `.gitignore` (video-models, video-outputs).
  - Motion module: `mm_sd15_v3.safetensors`, 836,618,008 bytes, from huggingface.co/conrevo/AnimateDiff-A1111.
- Test install: `C:\AI\usb128\Portable-Local-Studio`, mapped as `U:` by `subst U: C:\AI\usb128`.
  It holds the same Video edits and a rebuilt `app\dist`. Originals: `C:\AI\*.orig`.

## Known limit

- Speed depends on free VRAM. On the RTX 3050 4 GB with nothing else on the GPU, 384×384, 8 frames,
  20 steps took 152.6 s (CLI). With the browser and other apps holding about 2.3 GB of VRAM, the same job
  stayed at step 1 after 250 s (it used shared memory). Close GPU-heavy apps before you make a video.

## Next task

Add the measured Video results to the HTML manual (a section like "Make images") and republish the artifact
(slug `0b634499-197d-40a6-9d3d-a717c8160130`).
