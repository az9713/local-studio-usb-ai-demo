# HANDOFF — resume point for local-studio-usb-ai-demo

**Read this file first in each new session.** This repo has no project `CLAUDE.md`; the standing rules are in the user's global `CLAUDE.md`.
If the session starts in the parent folder `usb_local_ai_jarvis`, this file is at `local-studio-usb-ai-demo\HANDOFF.md`.

## Current state (verified 1 Nov 2026, 17:53 local)

- Repo: https://github.com/az9713/local-studio-usb-ai-demo (public; GitHub Pages from `main` root, whole branch). Git: branch `main`. The commit that holds this file is the HEAD; before it, `7a87554`.
- Commits:
  - `0230342`: docs (README, manual, evidence, screenshots, samples).
  - `d7d2d2e`: upstream imported unchanged as `studio/` (techjarves/Portable-Local-Studio, MIT, ZIP of main from 31 Oct 2026; upstream main is now `3f0830f`).
  - `a788fd6`: Video tab.
  - `7a87554`: security fixes in `video.cjs`.
- Video feature, done (AnimateDiff text-to-video, Windows only; no PR to upstream, by the user's choice):
  - New: `studio/scripts/server/video.cjs` (`/api/video/*`, spawns `app\backend\win\cuda\sd-cli.exe -M vid_gen`) and `studio/app/frontend/src/components/VideoGenerator.jsx` (Video page and the `VideoModels` card).
  - Small edits: `serve.cjs` (+9 lines), `App.jsx`, `Sidebar.jsx`, `ModelManager.jsx`, `.gitignore`.
  - Motion module: `mm_sd15_v3.safetensors`, 836,618,008 bytes, from huggingface.co/conrevo/AnimateDiff-A1111.
  - README section 7.6 has the steps and the measured times.
- Manual: `local-studio-windows-setup.html` has 23 sections and **no Video section yet**. Two copies exist, byte-identical on 1 Nov (SHA-256 `3AE36907…`): this repo, and the parent folder `usb_local_ai_jarvis`. Pages returned HTTP 200 for it.
- Private artifact: https://claude.ai/artifact/2QZVQufnXuqSqFS2v6Es9Z, slug `0b634499-197d-40a6-9d3d-a717c8160130`, live version `1793555039-1e26`, read mode `owner`. It also has no Video section.
- Test install: `C:\AI\usb128\Portable-Local-Studio` (about 8.93 GB). It holds the Video edits and a rebuilt `app\dist`. Originals: `C:\AI\*.orig` and `C:\AI\dist.orig`.
  - On 1 Nov at 17:53, the server was stopped and the `U:` mapping was absent. The agent did not stop them, and the cause is not known. The last boot was at 16:54, so a restart is not the cause.
  - To start again: run `subst U: C:\AI\usb128`, then start `U:\Portable-Local-Studio\windows.bat`. The port can change (1420, then 1421 in the last run). Read it from the launcher output.

## Next task

**Add a Video section to the HTML manual, then republish.** The server is not necessary for this task. Use only the measured data in README section 7.6.

1. Edit `local-studio-windows-setup.html` directly. The file is about 1.58 MB because the images are base64 data, so use Grep to find `id="..."`, and read only line ranges.
2. Add `<h2 id="video">` after the `image` section or the `jarvis` section (line 374), and add the link to the table of contents (lines 90–91 show the format).
3. Embed `screenshots/video-models.jpeg`, `video-unload.jpeg` and `video.jpeg` as base64. The artifact is one file, so relative links do not work there.
4. Update the `budget`, `results` and `limits` sections and the "One large model at a time" statements: 8,933,067,683 bytes in 11,027 files with video; video unloads the chat or image model.
5. Copy the result over the parent-folder copy, and compare the two hashes.
6. Commit and push. Check that the Pages URL returns 200: https://az9713.github.io/local-studio-usb-ai-demo/local-studio-windows-setup.html
7. Read the artifact `guide` (topic `pages`), then call `publish_files` with the slug and `base_version` `1793555039-1e26`.

Acceptance: the section renders on Pages and in the artifact, all 3 images show, and no number differs from README section 7.6.

If the user asks for something else, that takes precedence.

## Open decision for the user

- Upstream sets `Access-Control-Allow-Origin: *`, and its OPTIONS preflight allows any origin on all `/api` routes (`serve.cjs`; the server binds 127.0.0.1 at `serve.cjs:7707`). A web page open in the browser can call the local API while the studio runs. Not changed. The user was asked whether to limit it to the studio's own address, and has not answered.

## Not tested

- Video tab: 16 frames and 512×512; Linux, macOS, AMD and Intel graphics cards; Wan and LTX-Video.
- Security fixes: two fast Make video requests (expected 409), a failed job (expected last log line only), and an engine program that cannot start. Tested: bad encoding returns 400, unknown module returns 400.
- The README route "delete `app\dist`, then `windows.bat` rebuilds" (FROM CODE: `windows.bat` line 36, `setup.ps1` line 694).
- Image model with Whisper or Kokoro, microphone, other languages, SDXL, offline use, real USB/exFAT.

## Known limit

- Video speed depends on free VRAM on the RTX 3050 4 GB. Graphics card free: 384×384, 8 frames, 20 steps took 152.6 s (CLI). About 2.3 GB of VRAM held by other programs: 256×256 took 560.2 s, and 384×384 was still at step 1 after 256 s.

## Workflow provenance

- Skills used: `handoff-after-clear` (this file) only. A transcript search found no other Skill call. The user's rules for style came from the global `CLAUDE.md`, not from a skill call.
- The security findings came from an automatic review in the harness. It was not a named review skill.
- Tests were by hand, through Chrome DevTools and direct HTTP requests. The repo has no automated tests for Video.

## Session-transient scratch (durable record is the committed output)

- In the session scratchpad (`%LOCALAPPDATA%\Temp\claude\C--Users-<you>-Downloads-usb-local-ai-jarvis\f4eb2096-436d-4205-85dd-924fcc434fa4\scratchpad\`): `manual.src.html` plus `build.py`. `build.py` replaced `__IMG_<key>__` markers with base64 from `shot-*.jpeg` and wrote the manual to the parent folder.
- The scratchpad can disappear. Do not depend on it: edit the committed manual directly.

## How to work

- Write replies in ASD-STE100, in plain language and with measured numbers.
- This repo is public. Do not push the Windows user name, the personal email, the hostname or user-folder paths. Use `%USERPROFILE%` or `C:\Users\<you>`. The repo-local git email is the GitHub noreply address. Search with `git grep` before each push.
- Never kill a process by name. Kill only a PID that you captured.
- Commit trailers: `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` and the `Claude-Session:` link (the user chose to keep it).

## Cleanup for the user, when testing ends

1. Run `subst U: /d` if the mapping exists.
2. Delete `C:\AI\usb128` (about 8.93 GB).
3. Delete the rest of `C:\AI`: `*.log`, `*.orig`, `dist.orig`, `bat.pid`, `serve.pid`.
