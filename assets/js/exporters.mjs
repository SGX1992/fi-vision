/* Exports, ported from share.ddxconference.com (ddx-badge/assets/js/exporters.js): PNG, one full
   loop as H.264 MP4 via WebCodecs + mp4-muxer, WebM via MediaRecorder where WebCodecs is missing,
   and a short GIF. Exposed on window.EXPORTERS for the classic scripts. */
import { Muxer, ArrayBufferTarget } from './vendor/mp4-muxer.mjs';
import { GIFEncoder, quantize, applyPalette } from './vendor/gifenc.mjs';

const W = 1080, H = 1350, FPS = 30;
const hasMp4 = () => typeof VideoEncoder !== 'undefined';
const breathe = () => new Promise(r => setTimeout(r, 0));

function canShareFiles(type = 'image/png') {
  try { const probe = new File([new Blob([1])], 'probe' + (type === 'video/mp4' ? '.mp4' : '.png'), { type }); return Boolean(navigator.canShare?.({ files: [probe] })); } catch { return false; }
}
async function shareFile(blob, filename, text) {
  const file = new File([blob], filename, { type: blob.type });
  if (!navigator.canShare?.({ files: [file] })) return 'unsupported';
  try { await navigator.share({ files: [file], text }); return 'shared'; }
  catch (err) { if (err?.name === 'AbortError') return 'cancelled'; if (err?.name === 'NotAllowedError') return 'unsupported'; throw err; }
}
function download(blob, filename) {
  const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 5000);
}
async function toPng(poster) {
  await poster.prepare(0); const c = poster.renderAt(); poster.resume();
  return new Promise((res, rej) => c.toBlob(b => (b ? res(b) : rej(new Error('PNG encode failed'))), 'image/png'));
}
async function toMp4(poster, onProgress) {
  const loop = poster.loopSeconds; const total = Math.max(1, Math.round(loop * FPS));
  const muxer = new Muxer({ target: new ArrayBufferTarget(), video: { codec: 'avc', width: W, height: H }, fastStart: 'in-memory' });
  let failure = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      const cs = meta?.decoderConfig?.colorSpace;
      if (cs) meta.decoderConfig.colorSpace = { primaries: cs.primaries ?? 'bt709', transfer: 'iec61966-2-1', matrix: cs.matrix ?? 'bt709', fullRange: cs.fullRange ?? false };
      muxer.addVideoChunk(chunk, meta);
    },
    error: e => { failure = e; },
  });
  encoder.configure({ codec: 'avc1.640028', width: W, height: H, bitrate: Math.round(Math.min(8_000_000, 80_000_000 / Math.max(1, loop))), framerate: FPS });
  for (let i = 0; i < total; i++) {
    if (failure) throw failure;
    await poster.prepare(i / FPS);
    const frame = new VideoFrame(poster.renderAt(), { timestamp: Math.round((i * 1e6) / FPS), duration: Math.round(1e6 / FPS) });
    encoder.encode(frame, { keyFrame: i % (FPS * 2) === 0 }); frame.close();
    if (encoder.encodeQueueSize > 8) await breathe();
    if (i % 5 === 0) { onProgress?.(i / total); await breathe(); }
  }
  await encoder.flush(); encoder.close(); poster.resume();
  if (failure) throw failure;
  muxer.finalize(); onProgress?.(1);
  return new Blob([muxer.target.buffer], { type: 'video/mp4' });
}
async function toWebm(poster, onProgress) {
  const loop = poster.loopSeconds; const stream = poster.canvas.captureStream(FPS);
  const mime = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm';
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 10_000_000 });
  const parts = []; rec.ondataavailable = e => e.data.size && parts.push(e.data); const stopped = new Promise(r => (rec.onstop = r));
  poster.resume(); rec.start(); const t0 = performance.now();
  await new Promise(done => { const step = () => { const t = (performance.now() - t0) / 1000; if (t >= loop) return done(); poster.renderAt(); onProgress?.(t / loop); requestAnimationFrame(step); }; requestAnimationFrame(step); });
  rec.stop(); await stopped; onProgress?.(1);
  return new Blob(parts, { type: 'video/webm' });
}
async function toGif(poster, onProgress) {
  const loop = poster.loopSeconds; const DELAY = 120;
  const FRAMES = Math.min(48, Math.max(12, Math.round((loop * 1000) / DELAY))); const span = Math.min(loop, (FRAMES * DELAY) / 1000);
  const gw = 540, gh = Math.round((gw * H) / W);
  const scratch = document.createElement('canvas'); scratch.width = gw; scratch.height = gh; const sc = scratch.getContext('2d', { willReadFrequently: true });
  const grab = async i => { await poster.prepare((i / FRAMES) * span); sc.drawImage(poster.renderAt(), 0, 0, gw, gh); return sc.getImageData(0, 0, gw, gh).data; };
  const first = await grab(0), mid = await grab(Math.floor(FRAMES / 2));
  const sample = new Uint8ClampedArray(first.length + mid.length); sample.set(first, 0); sample.set(mid, first.length);
  const palette = quantize(sample, 256, { format: 'rgb565' });
  const gif = GIFEncoder();
  for (let i = 0; i < FRAMES; i++) {
    const data = i === 0 ? first : await grab(i);
    gif.writeFrame(applyPalette(data, palette, 'rgb565'), gw, gh, { palette: i === 0 ? palette : undefined, delay: DELAY, repeat: 0 });
    onProgress?.((i + 1) / FRAMES); await breathe();
  }
  gif.finish(); poster.resume();
  return new Blob([gif.bytes()], { type: 'image/gif' });
}
window.EXPORTERS = { hasMp4, canShareFiles, shareFile, download, toPng, toMp4, toWebm, toGif };
window.dispatchEvent(new Event('exporters-ready'));
