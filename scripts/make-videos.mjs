// Generates the demo lesson videos (original animated scripture cards with captions) by recording a canvas.
// Usage: node scripts/make-videos.mjs  (needs the app served on :3100 for the fonts)
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const videos = {
  grace: { ref: 'Ephesians 2:8-9 · World English Bible', cards: [
    ['Grace is a gift.', 4], ['Love given before you have done anything to deserve it.', 6], ['Saved, through faith.', 4.5], ['As a gift, so that no one can boast.', 5.5], ['Receive it, and begin again from there.', 4] ] },
  scripture: { ref: 'Psalm 119:105 · World English Bible', cards: [
    ['Read a paragraph, not a chapter.', 4.5], ['What does it say?', 3.5], ['What does it show me about God?', 5], ['What is one thing I can do today?', 5.5], ['Your word is a lamp to my feet.', 4] ] },
  prayer: { ref: 'Philippians 4:6-7 · World English Bible', cards: [
    ['Prayer is talking with God.', 4], ['Say it plainly.', 3.5], ['Thanks. What is on your mind.', 5], ['What you need. A minute of quiet.', 5], ['No special words required.', 3] ] },
};

const vtt = (cards) => {
  const f = (s) => { const ms = Math.round(s * 1000); const m = Math.floor(ms / 60000); const sec = Math.floor((ms % 60000) / 1000); return `00:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(ms % 1000).padStart(3, '0')}`; };
  let t = 0;
  return 'WEBVTT\n\n' + cards.map(([text, d], i) => { const a = t; t += d; return `${i + 1}\n${f(a)} --> ${f(t)}\n${text}\n`; }).join('\n');
};

const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH });
const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
await page.goto('http://localhost:3100/');
await page.evaluate(() => document.fonts.load('600 64px "Literata Variable"'));
await page.evaluate(() => document.fonts.load('italic 400 28px "Literata Variable"'));
await page.evaluate(() => document.fonts.load('500 24px "Instrument Sans Variable"'));
await page.waitForTimeout(500);

for (const [name, v] of Object.entries(videos)) {
  const total = v.cards.reduce((s, c) => s + c[1], 0);
  const out = await page.evaluate(async ({ cards, ref, total }) => {
    const W = 1280, H = 720;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    const mix = (a, b, t) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
    const rgb = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;
    const paper = [248, 243, 234], clay = [165, 72, 43], ink = [34, 29, 23];
    const sky = mix(paper, clay, 0.14), far = mix(paper, clay, 0.3), mid = mix(paper, clay, 0.52), near = mix(clay, ink, 0.3);
    const starts = []; let acc = 0; for (const c of cards) { starts.push(acc); acc += c[1]; }
    const hill = (yBase, amp, speed, t, color, ph) => {
      ctx.fillStyle = rgb(color); ctx.beginPath(); ctx.moveTo(0, H);
      for (let x = 0; x <= W; x += 8) ctx.lineTo(x, yBase + Math.sin((x / W) * Math.PI * 2 + t * speed + ph) * amp + Math.sin((x / W) * 7 + ph) * amp * 0.25);
      ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
    };
    const wrap = (text, maxW) => { const words = text.split(' '); const lines = []; let line = ''; for (const w of words) { const test = line ? line + ' ' + w : w; if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test; } lines.push(line); return lines; };
    const draw = (t) => {
      ctx.fillStyle = rgb(sky); ctx.fillRect(0, 0, W, H);
      const rise = Math.min(1, t / 6);
      const sx = W * 0.72, sy = H * (0.62 - 0.12 * rise);
      ctx.fillStyle = `rgba(165,72,43,0.12)`; ctx.beginPath(); ctx.arc(sx, sy, 190, 0, 7); ctx.fill();
      ctx.fillStyle = `rgba(165,72,43,0.9)`; ctx.beginPath(); ctx.arc(sx, sy, 92, 0, 7); ctx.fill();
      hill(H * 0.66, 18, 0.25, t, far, 0); hill(H * 0.76, 22, 0.35, t, mid, 2); hill(H * 0.88, 16, 0.5, t, near, 4);
      // current card with a soft fade in and out
      let idx = starts.findIndex((s, i) => t >= s && t < s + cards[i][1]);
      if (idx < 0) idx = cards.length - 1;
      const local = t - starts[idx], dur = cards[idx][1];
      const a = Math.max(0, Math.min(1, local / 0.6, (dur - local) / 0.5));
      ctx.globalAlpha = a;
      ctx.fillStyle = rgb(ink); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
      ctx.font = '600 66px "Literata Variable", Georgia, serif';
      const lines = wrap(cards[idx][0], 760);
      lines.forEach((l, i) => ctx.fillText(l, 96, 190 + i * 82 - (1 - a) * -10));
      ctx.globalAlpha = 1;
      ctx.font = '500 24px "Instrument Sans Variable", system-ui, sans-serif';
      ctx.fillStyle = rgb(paper); ctx.fillText(ref, 96, H - 56);
    };
    draw(3);
    const poster = canvas.toDataURL('image/jpeg', 0.82).split(',')[1];
    const stream = canvas.captureStream(24);
    const rec = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 650_000 });
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    const done = new Promise((r) => (rec.onstop = r));
    rec.start(500);
    const t0 = performance.now();
    await new Promise((res) => { const tick = () => { const t = (performance.now() - t0) / 1000; draw(Math.min(t, total)); if (t >= total) res(); else requestAnimationFrame(tick); }; tick(); });
    rec.stop(); await done;
    const blob = new Blob(chunks, { type: 'video/webm' });
    const buf = new Uint8Array(await blob.arrayBuffer());
    let bin = ''; for (let i = 0; i < buf.length; i += 32768) bin += String.fromCharCode(...buf.subarray(i, i + 32768));
    canvas.remove();
    return { video: btoa(bin), poster };
  }, { cards: v.cards, ref: v.ref, total });
  writeFileSync(`public/media/${name}.webm`, Buffer.from(out.video, 'base64'));
  writeFileSync(`public/media/${name}.jpg`, Buffer.from(out.poster, 'base64'));
  writeFileSync(`public/media/${name}.captions.txt`, vtt(v.cards));
  console.log(name, (out.video.length * 0.75 / 1024).toFixed(0) + ' KB');
}
await browser.close();
