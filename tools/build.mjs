// Шифрует плейблы для сайта.
// Исходники (НЕ в репозитории): папка с playables.js и playables/<folder>/index.html (+ cover.jpg)
// Запуск: PORTFOLIO_PASSWORD='...' node tools/build.mjs /путь/к/исходникам
// Результат: vault/meta.json, vault/manifest.bin, vault/<id>.bin
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto as wc, randomBytes, createHash } from 'node:crypto';
import vm from 'node:vm';

const SRC = process.argv[2];
const PASS = process.env.PORTFOLIO_PASSWORD;
if (!SRC || !PASS) { console.error('usage: PORTFOLIO_PASSWORD=... node tools/build.mjs <src-dir>'); process.exit(1); }
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'vault');
const ITER = 310000;

const ctx = { window: {} }; vm.runInNewContext(readFileSync(join(SRC, 'playables.js'), 'utf8'), ctx);
const list = ctx.window.PLAYABLES || [];

const salt = randomBytes(16);
const base = await wc.subtle.importKey('raw', new TextEncoder().encode(PASS), 'PBKDF2', false, ['deriveKey']);
const key = await wc.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const enc = async (bytes) => { const iv = randomBytes(12); const ct = new Uint8Array(await wc.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes)); return Buffer.concat([iv, ct]); };

rmSync(OUT, { recursive: true, force: true }); mkdirSync(OUT);
const manifest = [];
for (const p of list) {
  const dir = join(SRC, 'playables', p.folder);
  const html = readFileSync(join(dir, 'index.html'));
  const id = createHash('sha256').update(salt).update(p.folder).digest('hex').slice(0, 16);
  writeFileSync(join(OUT, id + '.bin'), await enc(html));
  let cover = null;
  if (p.cover && existsSync(join(dir, p.cover))) {
    const ext = p.cover.split('.').pop().toLowerCase();
    const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
    cover = `data:${mime};base64,` + readFileSync(join(dir, p.cover)).toString('base64');
  }
  manifest.push({ title: p.title, tags: p.tags || '', land: !!p.land, slug: p.folder, id, cover });
  console.log('encrypted', p.folder, '->', id);
}
writeFileSync(join(OUT, 'manifest.bin'), await enc(Buffer.from(JSON.stringify(manifest))));
writeFileSync(join(OUT, 'meta.json'), JSON.stringify({ v: 1, salt: salt.toString('base64'), iter: ITER }));
console.log('done:', manifest.length, 'playables');
