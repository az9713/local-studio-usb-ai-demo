// Video workspace (AnimateDiff text-to-video) for Portable Local Studio.
// Added in github.com/az9713/local-studio-usb-ai-demo. Not part of upstream
// techjarves/Portable-Local-Studio (MIT). It runs the bundled stable-diffusion.cpp
// CLI in vid_gen mode with a motion module and an installed SD 1.5 image model.
// ponytail: Windows only (app\backend\win\*\sd-cli.exe); add linux/mac paths when needed.
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");
const { Readable } = require("stream");
const { pipeline } = require("stream/promises");

const CATALOG = [
  {
    id: "mm_sd15_v3.safetensors",
    name: "AnimateDiff v3 motion module (SD 1.5)",
    size: 836618008,
    url: "https://huggingface.co/conrevo/AnimateDiff-A1111/resolve/main/motion_module/mm_sd15_v3.safetensors",
    note: "Adds motion to an SD 1.5 image model such as DreamShaper 8. Native size 512x512, 16 frames.",
  },
];
// ponytail: SD 1.5 checkpoints are about 2 GB, SDXL about 7 GB. Size is the filter; read the header if a model breaks this rule.
const MAX_SD15_BYTES = 4.5e9;

module.exports = function createVideo({ ROOT, MODELS, json, readJsonBody, pathInside, getLoaded, unloadLarge }) {
  const VIDEO_MODELS = path.join(ROOT, "app", "video-models");
  const VIDEO_OUTPUTS = path.join(ROOT, "app", "video-outputs");
  for (const dir of [VIDEO_MODELS, VIDEO_OUTPUTS]) fs.mkdirSync(dir, { recursive: true });

  let download = { active: false, id: "", received: 0, total: 0, error: "" };
  let job = { active: false, phase: "", step: 0, steps: 0, error: "", result: null, startedAt: 0 };
  let proc = null;

  const cliPath = () => ["cuda", "vulkan", "cpu"]
    .map((name) => path.join(ROOT, "app", "backend", "win", name, "sd-cli.exe"))
    .find((p) => fs.existsSync(p)) || "";

  const motionModules = () => CATALOG.map((m) => {
    const file = path.join(VIDEO_MODELS, m.id);
    return { ...m, installed: fs.existsSync(file) && fs.statSync(file).size === m.size };
  });

  const baseModels = () => {
    try {
      return fs.readdirSync(MODELS)
        .filter((f) => /\.(safetensors|ckpt)$/i.test(f))
        .filter((f) => fs.statSync(path.join(MODELS, f)).size < MAX_SD15_BYTES);
    } catch (_) { return []; }
  };

  const listOutputs = () => {
    try {
      return fs.readdirSync(VIDEO_OUTPUTS)
        .filter((f) => f.endsWith(".json"))
        .map((f) => { try { return JSON.parse(fs.readFileSync(path.join(VIDEO_OUTPUTS, f), "utf8")); } catch (_) { return null; } })
        .filter(Boolean)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    } catch (_) { return []; }
  };

  async function startDownload(item) {
    const target = path.join(VIDEO_MODELS, item.id);
    const part = `${target}.part`;
    download = { active: true, id: item.id, received: 0, total: item.size, error: "" };
    try {
      const response = await fetch(item.url, { redirect: "follow" });
      if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
      const body = Readable.fromWeb(response.body);
      body.on("data", (chunk) => { download.received += chunk.length; });
      await pipeline(body, fs.createWriteStream(part));
      if (fs.statSync(part).size !== item.size) throw new Error("Download incomplete: file size does not match.");
      fs.renameSync(part, target);
      download = { ...download, active: false };
    } catch (err) {
      try { fs.unlinkSync(part); } catch (_) {}
      download = { ...download, active: false, error: err.message || String(err) };
    }
  }

  function clampInt(value, min, max, fallback) {
    const n = Math.round(Number(value));
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  }

  async function startJob(body) {
    const exe = cliPath();
    const modelName = path.basename(String(body.baseModel || ""));
    const moduleName = path.basename(String(body.motionModule || CATALOG[0].id));
    if (!CATALOG.some((m) => m.id === moduleName)) throw new Error("Unknown motion module.");
    const modelPath = path.join(MODELS, modelName);
    const modulePath = path.join(VIDEO_MODELS, moduleName);
    const prompt = String(body.prompt || "").trim();
    if (!exe) throw new Error("The image engine (sd-cli.exe) is not installed. Run setup again.");
    if (!prompt) throw new Error("Type a prompt first.");
    if (!modelName || !fs.existsSync(modelPath)) throw new Error("Download an SD 1.5 image model first, for example DreamShaper 8.");
    if (!fs.existsSync(modulePath)) throw new Error("Download the motion module first (Models → Video).");

    const size = clampInt(body.size, 256, 512, 384);
    const frames = clampInt(body.frames, 2, 16, 8);
    const fps = clampInt(body.fps, 1, 24, 8);
    const steps = clampInt(body.steps, 1, 40, 20);
    const cfgScale = Math.min(15, Math.max(1, Number(body.cfgScale) || 8));
    const seed = Number(body.seed) >= 0 ? Math.round(Number(body.seed)) : Math.floor(Math.random() * 1e9);
    const negativePrompt = String(body.negativePrompt || "").trim();

    job = { active: true, phase: "Unloading other models...", step: 0, steps, error: "", result: null, startedAt: Date.now() }; // lock before the first await
    try { await unloadLarge(); } // one large model at a time, as for chat and images
    catch (err) { job = { ...job, active: false, phase: "Failed", error: err.message || String(err) }; throw err; }
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const base = `video-${stamp}-${seed}`;
    const videoFile = `${base}.webm`;
    // Settings from stable-diffusion.cpp docs/animatediff.md (euler, discrete, CFG 8).
    // --max-vram 2.0 --stream-layers keeps a 4 GB GPU out of shared memory (tested on RTX 3050 4 GB).
    const args = [
      "-M", "vid_gen", "--model", modelPath, "--motion-module", modulePath,
      "--max-vram", "2.0", "--stream-layers", "--diffusion-fa",
      "-p", prompt, ...(negativePrompt ? ["-n", negativePrompt] : []),
      "--cfg-scale", String(cfgScale), "--sampling-method", "euler", "--scheduler", "discrete",
      "-H", String(size), "-W", String(size), "--video-frames", String(frames), "--fps", String(fps),
      "--steps", String(steps), "-s", String(seed), "-o", path.join(VIDEO_OUTPUTS, videoFile),
    ];
    const startedAt = Date.now();
    job = { active: true, phase: "Loading models...", step: 0, steps, error: "", result: null, startedAt };
    console.log("  [video] Starting:", exe, args.join(" "));
    proc = spawn(exe, args, { cwd: path.dirname(exe), windowsHide: true, stdio: "pipe" });
    let tail = "";
    const onData = (data) => {
      const text = data.toString();
      tail = (tail + text).slice(-4000);
      const matches = [...text.matchAll(/(\d+)\/(\d+) - [\d.]+s\/it/g)];
      if (matches.length) {
        const last = matches[matches.length - 1];
        job.step = Number(last[1]);
        job.phase = `Making frames: step ${last[1]} of ${last[2]}`;
      } else if (/decod/i.test(text) && job.step >= steps) {
        job.phase = "Decoding frames...";
      }
    };
    proc.on("error", (err) => { proc = null; job = { ...job, active: false, phase: "Failed", error: err.message }; });
    proc.stdout.on("data", onData);
    proc.stderr.on("data", onData);
    proc.on("exit", (code) => {
      proc = null;
      const videoPath = path.join(VIDEO_OUTPUTS, videoFile);
      if (code !== 0 || !fs.existsSync(videoPath)) {
        const lastLine = tail.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "").split(/[\r\n]+/).map((l) => l.trim()).filter(Boolean).pop();
        job = { ...job, active: false, phase: "Failed", error: job.error || lastLine || `sd-cli exited with code ${code}` };
        return;
      }
      const metadata = {
        prompt, negativePrompt, baseModel: modelName, motionModule: moduleName,
        width: size, height: size, frames, fps, steps, cfgScale, seed,
        sampler: "euler", scheduler: "discrete",
        durationSec: Math.round((Date.now() - startedAt) / 100) / 10,
        bytes: fs.statSync(videoPath).size,
        createdAt: new Date().toISOString(),
        video: videoFile, metadata: `${base}.json`, url: `/video-outputs/${encodeURIComponent(videoFile)}`,
      };
      fs.writeFileSync(path.join(VIDEO_OUTPUTS, `${base}.json`), JSON.stringify(metadata, null, 2));
      job = { ...job, active: false, phase: "Complete", result: metadata };
    });
  }

  return async function handleVideo(req, res) {
    const url = req.url.split("?")[0];
    if (url === "/api/video/status" && req.method === "GET") {
      json(res, 200, { ok: true, motionModules: motionModules(), baseModels: baseModels(), download, job, loaded: getLoaded(), engine: Boolean(cliPath()) });
      return true;
    }
    if (url === "/api/video/outputs" && req.method === "GET") {
      json(res, 200, { ok: true, outputs: listOutputs() });
      return true;
    }
    if (url === "/api/video/download" && req.method === "POST") {
      const body = await readJsonBody(req, res); if (!body) return true;
      const item = CATALOG.find((m) => m.id === body.id);
      if (!item) { json(res, 400, { ok: false, error: "Unknown motion module" }); return true; }
      if (download.active) { json(res, 409, { ok: false, error: "A download is already running." }); return true; }
      startDownload(item);
      json(res, 200, { ok: true });
      return true;
    }
    if (url === "/api/video/delete-model" && req.method === "POST") {
      const body = await readJsonBody(req, res); if (!body) return true;
      const file = path.join(VIDEO_MODELS, path.basename(String(body.id || "")));
      if (!CATALOG.some((m) => m.id === path.basename(file)) || !fs.existsSync(file)) { json(res, 404, { ok: false, error: "Motion module not found" }); return true; }
      fs.unlinkSync(file);
      json(res, 200, { ok: true });
      return true;
    }
    if (url === "/api/video/generate" && req.method === "POST") {
      const body = await readJsonBody(req, res); if (!body) return true;
      if (job.active) { json(res, 409, { ok: false, error: "A video is already being made." }); return true; }
      try { await startJob(body); json(res, 200, { ok: true }); }
      catch (err) { json(res, 400, { ok: false, error: err.message || String(err) }); }
      return true;
    }
    if (url === "/api/video/cancel" && req.method === "POST") {
      if (proc) { job.error = "Cancelled."; try { proc.kill(); } catch (_) {} }
      json(res, 200, { ok: true });
      return true;
    }
    if (url === "/api/video/delete-output" && req.method === "POST") {
      const body = await readJsonBody(req, res); if (!body) return true;
      const name = path.basename(String(body.filename || ""));
      const jsonPath = path.join(VIDEO_OUTPUTS, name);
      if (!name.endsWith(".json") || !pathInside(jsonPath, VIDEO_OUTPUTS) || !fs.existsSync(jsonPath)) { json(res, 404, { ok: false, error: "Video not found" }); return true; }
      const meta = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      try { fs.unlinkSync(path.join(VIDEO_OUTPUTS, path.basename(String(meta.video || "")))); } catch (_) {}
      fs.unlinkSync(jsonPath);
      json(res, 200, { ok: true });
      return true;
    }
    if (url.startsWith("/video-outputs/") && req.method === "GET") {
      let decoded;
      try { decoded = decodeURIComponent(url.slice("/video-outputs/".length)); }
      catch (_) { json(res, 400, { ok: false, error: "Invalid URL encoding" }); return true; }
      const name = path.basename(decoded);
      const file = path.join(VIDEO_OUTPUTS, name);
      if (!name || !pathInside(file, VIDEO_OUTPUTS) || !fs.existsSync(file)) { json(res, 404, { ok: false, error: "Video not found" }); return true; }
      const type = name.endsWith(".webm") ? "video/webm" : "application/octet-stream";
      res.writeHead(200, { "Content-Type": type, "Content-Length": fs.statSync(file).size, "Access-Control-Allow-Origin": "*" });
      fs.createReadStream(file).pipe(res);
      return true;
    }
    return false;
  };
};
