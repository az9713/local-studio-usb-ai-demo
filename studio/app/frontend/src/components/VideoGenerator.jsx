// Video workspace (AnimateDiff text-to-video). Added in
// github.com/az9713/local-studio-usb-ai-demo; not part of upstream Portable-Local-Studio.
// Server side: scripts/server/video.cjs.
import { useCallback, useEffect, useState } from "react";
import { DownloadCloud, Trash2, Square, Clapperboard } from "lucide-react";

async function api(url, body) {
  const res = await fetch(url, body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : undefined);
  const data = await res.json().catch(() => ({ ok: false, error: "Invalid server response" }));
  if (!res.ok || data.ok === false) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

const formatMb = (bytes) => `${Math.round((Number(bytes) || 0) / 1e6)} MB`;

function useVideoStatus(active, intervalMs = 1500) {
  const [status, setStatus] = useState(null);
  const refresh = useCallback(() => api("/api/video/status").then(setStatus).catch(() => {}), []);
  useEffect(() => {
    if (!active) return undefined;
    refresh();
    const id = setInterval(refresh, intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs, refresh]);
  return [status, refresh];
}

// The card list shown in Models → Video.
export function VideoModels({ active = true, showConfirm }) {
  const [status, refresh] = useVideoStatus(active);
  const [error, setError] = useState("");
  const download = status?.download;

  const startDownload = async (id) => {
    setError("");
    try { await api("/api/video/download", { id }); refresh(); } catch (err) { setError(err.message); }
  };
  const remove = async (model) => {
    if (showConfirm && !(await showConfirm({ title: "Delete model?", message: `Delete "${model.name}" (${formatMb(model.size)}) from the drive?`, confirmLabel: "Delete", danger: true }))) return;
    try { await api("/api/video/delete-model", { id: model.id }); refresh(); } catch (err) { setError(err.message); }
  };

  return (
    <section aria-label="Video models">
      {error && <div className="text-progress error">{error}</div>}
      {download?.error && <div className="text-progress error">{download.error}</div>}
      {status && status.baseModels.length === 0 && (
        <div className="text-progress">Video needs an SD 1.5 image model too. Download DreamShaper 8 in Models → Image.</div>
      )}
      <ul className="models-library-grid">
        {(status?.motionModules || []).map((model) => {
          const busy = download?.active && download.id === model.id;
          return (
            <li key={model.id} className={`models-card ${busy ? "is-downloading" : ""}`}>
              <div className="models-card-title">{model.name}</div>
              <p className="models-card-desc">{model.note}</p>
              <div className="models-card-foot">
                <span className="models-card-meta">
                  {busy ? `${formatMb(download.received)} / ${formatMb(download.total)}` : `${formatMb(model.size)} · AnimateDiff`}
                </span>
                <div className="models-card-actions">
                  {model.installed ? (
                    <>
                      <span className="models-card-done">On this computer</span>
                      <button type="button" className="icon-btn" onClick={() => remove(model)} aria-label={`Delete ${model.name}`}>
                        <Trash2 size={15} aria-hidden="true" />
                      </button>
                    </>
                  ) : (
                    <button type="button" className="btn" disabled={Boolean(download?.active)} onClick={() => startDownload(model.id)}>
                      <DownloadCloud size={15} aria-hidden="true" /> <span>{busy ? "Downloading…" : "Download"}</span>
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

// The sidebar Video page.
export default function VideoGenerator({ active, showConfirm, showAlert }) {
  const [status, refresh] = useVideoStatus(active);
  const [outputs, setOutputs] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({
    prompt: "", negativePrompt: "blurry, low quality, text, watermark, deformed",
    baseModel: "", size: 384, frames: 8, fps: 8, steps: 20, cfgScale: 8, seed: -1,
  });
  const job = status?.job;
  const installedModule = status?.motionModules?.find((m) => m.installed);
  const baseModels = status?.baseModels || [];
  const baseModel = form.baseModel || baseModels[0] || "";

  const loadOutputs = useCallback(() => api("/api/video/outputs").then((d) => setOutputs(d.outputs || [])).catch(() => {}), []);
  useEffect(() => { if (active) loadOutputs(); }, [active, loadOutputs]);
  useEffect(() => {
    if (job && !job.active && job.result && job.result.video !== selected?.video && job.phase === "Complete") {
      setSelected(job.result);
      loadOutputs();
    }
  }, [job, selected, loadOutputs]);

  const set = (key) => (event) => setForm((f) => ({ ...f, [key]: event.target.value }));

  const generate = async () => {
    const loaded = status?.loaded || {};
    if (loaded.chat || loaded.image) {
      const which = loaded.chat ? "chat model" : "image model";
      const ok = await showConfirm({
        title: `Unload the ${which}?`,
        message: `Only one large model can run at a time, so the ${which} will be unloaded to make the video. You can load it again later.`,
        confirmLabel: "Unload and make video",
      });
      if (!ok) return;
    }
    try {
      await api("/api/video/generate", { ...form, baseModel, motionModule: installedModule?.id });
      refresh();
    } catch (err) {
      showAlert({ title: "Video failed", message: err.message, danger: true });
    }
  };

  const remove = async (item) => {
    if (!(await showConfirm({ title: "Delete video?", message: "Delete this video and its settings file from the drive?", confirmLabel: "Delete", danger: true }))) return;
    await api("/api/video/delete-output", { filename: item.metadata }).catch((err) => showAlert({ title: "Delete failed", message: err.message, danger: true }));
    if (selected?.video === item.video) setSelected(null);
    loadOutputs();
  };

  const elapsed = job?.active ? Math.round((Date.now() - job.startedAt) / 1000) : 0;
  const shown = selected || outputs[0] || null;
  const field = { display: "flex", flexDirection: "column", gap: 4, minWidth: 0 };

  return (
    <div className="page video-page">
      <div className="page-scroll">
        <div className="page-column">
          <header className="page-header">
            <h1 className="page-title">Video</h1>
          </header>

          {status && !status.engine && <div className="text-progress error">The image engine is not installed. Run setup again.</div>}
          {status && !installedModule && <div className="text-progress">Download the motion module in Models → Video to start.</div>}
          {status && baseModels.length === 0 && <div className="text-progress">Download an SD 1.5 image model (for example DreamShaper 8) in Models → Image.</div>}
          {job?.error && !job.active && <div className="text-progress error">{job.error}</div>}

          {shown && (
            <section aria-label="Video result" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, margin: "8px 0 16px" }}>
              <video key={shown.url} src={shown.url} controls autoPlay loop muted style={{ width: Math.min(512, shown.width * 1.25), maxWidth: "100%", borderRadius: 12 }} />
              <p style={{ textAlign: "center", margin: 0 }}>{shown.prompt}</p>
              <p className="field-hint" style={{ margin: 0 }}>
                {shown.width}×{shown.height} · {shown.frames} frames · {shown.fps} fps · {shown.steps} steps · Seed {shown.seed} · {shown.durationSec}s · {shown.baseModel}
              </p>
              <button type="button" className="btn btn-danger" onClick={() => remove(shown)}><Trash2 size={15} aria-hidden="true" /> <span>Delete</span></button>
            </section>
          )}

          <section aria-label="Make a video" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <label style={field}>
              <span className="field-label">Prompt</span>
              <textarea className="settings-textarea" rows={3} value={form.prompt} onChange={set("prompt")} placeholder="Describe a scene with motion, for example: waves crashing on rocks, storm, wind" />
            </label>
            <label style={field}>
              <span className="field-label">Negative prompt</span>
              <input className="settings-input" style={{ width: "100%" }} value={form.negativePrompt} onChange={set("negativePrompt")} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
              <label style={field}>
                <span className="field-label">Image model</span>
                <select className="settings-input" style={{ width: "100%" }} value={baseModel} onChange={set("baseModel")}>
                  {baseModels.map((m) => <option key={m} value={m}>{m.replace(/\.(safetensors|ckpt)$/i, "")}</option>)}
                </select>
              </label>
              <label style={field}>
                <span className="field-label">Size</span>
                <select className="settings-input" style={{ width: "100%" }} value={form.size} onChange={set("size")}>
                  <option value={256}>256×256</option>
                  <option value={384}>384×384</option>
                  <option value={512}>512×512 (slow on 4 GB)</option>
                </select>
              </label>
              <label style={field}>
                <span className="field-label">Frames</span>
                <select className="settings-input" style={{ width: "100%" }} value={form.frames} onChange={set("frames")}>
                  <option value={8}>8</option>
                  <option value={16}>16 (best motion)</option>
                </select>
              </label>
              <label style={field}><span className="field-label">FPS</span><input className="settings-input" style={{ width: "100%" }} type="number" min={1} max={24} value={form.fps} onChange={set("fps")} /></label>
              <label style={field}><span className="field-label">Steps</span><input className="settings-input" style={{ width: "100%" }} type="number" min={1} max={40} value={form.steps} onChange={set("steps")} /></label>
              <label style={field}><span className="field-label">CFG</span><input className="settings-input" style={{ width: "100%" }} type="number" min={1} max={15} step={0.5} value={form.cfgScale} onChange={set("cfgScale")} /></label>
              <label style={field}><span className="field-label">Seed (-1 random)</span><input className="settings-input" style={{ width: "100%" }} type="number" value={form.seed} onChange={set("seed")} /></label>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {job?.active ? (
                <>
                  <button type="button" className="btn" onClick={() => api("/api/video/cancel", {}).then(refresh)}><Square size={15} aria-hidden="true" /> <span>Stop</span></button>
                  <span className="field-hint">{job.phase} · {elapsed}s</span>
                </>
              ) : (
                <button type="button" className="btn btn-primary" disabled={!installedModule || !baseModel || !form.prompt.trim()} onClick={generate}>
                  <Clapperboard size={15} aria-hidden="true" /> <span>Make video</span>
                </button>
              )}
            </div>
            {job?.active && (
              <div className="models-progress-bar" role="progressbar" aria-label="Video progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((100 * job.step) / (job.steps || 1))}>
                <div className="models-progress-fill" style={{ width: `${(100 * job.step) / (job.steps || 1)}%` }} />
              </div>
            )}
          </section>

          {outputs.length > 0 && (
            <section aria-label="Video history" style={{ marginTop: 24 }}>
              <h2 className="field-label">History {outputs.length}</h2>
              <ul style={{ display: "flex", flexWrap: "wrap", gap: 8, listStyle: "none", padding: 0 }}>
                {outputs.map((item) => (
                  <li key={item.video}>
                    <button type="button" className="btn" onClick={() => setSelected(item)} title={item.prompt} style={{ padding: 2 }}>
                      <video src={item.url} muted preload="metadata" style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8 }} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
