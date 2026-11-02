# HANDOFF — resume point for local-studio-usb-ai-demo

**Read this file first in each new session.** This repo has no project `CLAUDE.md`; the standing rules are in the user's global `CLAUDE.md`.
If the session starts in the parent folder `usb_local_ai_jarvis`, this file is at `local-studio-usb-ai-demo\HANDOFF.md`.

## Current state (verified 1 Nov 2026, 21:55 local, UTC-8)

- Repo: https://github.com/az9713/local-studio-usb-ai-demo (public; GitHub Pages from `main` root, whole branch). Git: branch `main`. The commit that holds this file is the HEAD.
- Commits:
  - `0230342`: docs (README, manual, evidence, screenshots, samples).
  - `d7d2d2e`: upstream imported unchanged as `studio/` (techjarves/Portable-Local-Studio, MIT, ZIP of main from 31 Oct 2026; upstream main is now `3f0830f`).
  - `a788fd6`: Video tab.
  - `7a87554`: security fixes in `video.cjs`.
  - `334ddef`: first refresh of this file. Later commits add the manual parts below; `e638bda` adds section 24.
  - `52b268d`: request check (`scripts/server/origin-check.cjs`, +6 lines in `serve.cjs`, Vite proxy keeps `Host`) and the `README.md:48` correction.
- Video feature, done (AnimateDiff text-to-video, Windows only; no PR to upstream, by the user's choice):
  - New: `studio/scripts/server/video.cjs` (`/api/video/*`, spawns the first `sd-cli.exe` found in `app\backend\win\{cuda,vulkan,cpu}` with `-M vid_gen`) and `studio/app/frontend/src/components/VideoGenerator.jsx` (Video page and the `VideoModels` card).
  - Small edits: `serve.cjs` (+9 lines), `App.jsx`, `Sidebar.jsx`, `ModelManager.jsx`, `.gitignore`.
  - Motion module: `mm_sd15_v3.safetensors`, 836,618,008 bytes, from huggingface.co/conrevo/AnimateDiff-A1111.
  - README section 7.6 has the steps, the measured times and 2 GIF copies of the clips (`samples/video/*.gif`, 824,520 and 411,107 bytes, made from the WebM files with `ffmpeg`).
- Manual: `local-studio-windows-setup.html` has 24 sections. Section 24 (`#video`) has the Video steps, the results, 2 embedded clips and the code changes. Step 16 has the parts `#where-models`, `#self-contained` and `#another-laptop`. Two copies exist, byte-identical on 1 Nov (SHA-256 `68a3e3b7…`, about 2.32 MB): this repo, and the parent folder `usb_local_ai_jarvis`.
- Private artifact: https://claude.ai/artifact/2QZVQufnXuqSqFS2v6Es9Z, slug `0b634499-197d-40a6-9d3d-a717c8160130`, live version `1793598878-dd55`, read mode `owner`. It holds the same manual.
- Test install: `C:\AI\usb128\Portable-Local-Studio` (about 8.93 GB). It holds the Video edits, the request check of `52b268d` and a rebuilt `app\dist`. Originals: `C:\AI\*.orig` and `C:\AI\dist.orig`.
  - The server is stopped and the `U:` mapping is absent. The PC restarted at 16:54 on 1 Nov, after the last server check at 15:44. A restart ends the server and removes a `subst` mapping.
  - To start again: run `subst U: C:\AI\usb128`, then start `U:\Portable-Local-Studio\windows.bat`. The port can change (1420, then 1421 in the last run). Read it from the launcher output.

## Next task

No task is assigned. These are the open items, in the recommended order:

1. Run the test in the manual, Step 16, `#another-laptop`, on a real USB drive. Only the user can do this. It is the largest open risk for the "self-contained" statement.
2. Get the user's decision on the engine ports (see "Open decision").

To edit the manual: use Python with exact-match replacements, then copy the file to the parent folder and compare the hashes. Do not use `sed` on it: a regex over the base64 lines took more than 60 s. Republish with `publish_files`, slug above, `base_version` from this file (read the artifact `guide`, topic `pages`, first).

If the user asks for something else, that takes precedence.

## Open decision for the user

- The studio server now refuses other web pages (`origin-check.cjs`, 403). The engines are separate programs and are still open. While a model is loaded, a page on `http://127.0.0.1:1499` called `llama-server` on port 10086 and the image engine on port 8080 directly and read the answers, including the full model path. `llama-server` has `--api-key` and `--cors-origins`. The `--help` text of `sd-cuda.exe` shows no similar option. Not changed. The user has not decided.
- The upstream `Access-Control-Allow-Origin: *` headers stay in the code, because a refused request does not get to them.

## Not tested

- Video tab: 16 frames and 512×512; Linux, macOS, AMD and Intel graphics cards; Wan and LTX-Video.
- Security fixes: two fast Make video requests (expected 409), a failed job (expected last log line only), and an engine program that cannot start. Tested: bad encoding returns 400, unknown module returns 400.
- The README route "delete `app\dist`, then `windows.bat` rebuilds" (FROM CODE: `windows.bat` line 36, `setup.ps1` line 694).
- Image model with Whisper or Kokoro, microphone, other languages, SDXL, offline use, real USB/exFAT.
- Request check: a page on a public web site, `UAIS_HOST=0.0.0.0` with a real second device, side effects of every GET route.

## Known limit

- Video speed depends on free VRAM on the RTX 3050 4 GB. Graphics card free: 384×384, 8 frames, 20 steps took 152.6 s (CLI). About 2.3 GB of VRAM held by other programs: 256×256 took 560.2 s, and 384×384 was still at step 1 after 256 s.

## Workflow provenance

- Skills used: `handoff-after-clear` (this file) only. A transcript search found no other Skill call. The user's rules for style came from the global `CLAUDE.md`, not from a skill call.
- The security findings came from an automatic review in the harness. It was not a named review skill.
- Tests were by hand, through Chrome DevTools and direct HTTP requests. The repo has no automated tests for Video.
- The request check has a test in `scripts/tests/issue-regressions.test.cjs`. Run the test files by name with `node --test`: 29 pass and 1 fails. The failure needs `@tauri-apps/api`, which the repo copy does not have, and it also occurs without `52b268d`.

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
