#!/usr/bin/env node
/**
 * V5 Zero-Framework Personal Blog Engine
 * - Full Image Upload (Drag/Drop/Paste -> uploads/)
 * - Physical Privacy Isolation (`private: true` excluded from dist/ HTML, RSS, Search & dist/uploads/)
 * - Local Two-Way Studio + Live Folder Sync
 */

const fs = require('fs');
const path = require('path');
const http = require('http');
const https = require('https');
const {
  parseFrontmatter,
  stripMarkdown,
  countWords,
  renderMarkdown,
  serializeDocument,
} = require('./src/markdown');
function getTemplates(fresh = false) {
  const tplPath = require.resolve('./src/templates');
  if (fresh) delete require.cache[tplPath];
  return require(tplPath);
}

const ROOT_DIR = __dirname;
const POSTS_DIR = path.join(ROOT_DIR, 'posts');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const SRC_DIR = path.join(ROOT_DIR, 'src');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const CONFIG_PATH = path.join(ROOT_DIR, 'site.config.json');
const MOMENTS_PATH = path.join(DATA_DIR, 'moments.json');
const SHELF_PATH = path.join(DATA_DIR, 'shelf.json');

const MIME_MAP = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.m4a': 'audio/mp4',
};

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function loadJsonSafe(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return fallback;
  }
}

function loadSiteConfig() {
  return loadJsonSafe(CONFIG_PATH, {
    title: '自留地',
    startDate: '2026-10-01',
    typewriterPhrases: ['写点笔记，发发日常'],
    heroHeadline: '你好，欢迎来逛逛',
    heroHeadlineAccent: '我的个人小站',
    heroIntro: '',
    polaroids: [],
    archiveBio: '',
    aboutContent: '',
    categories: ['技术与折腾', '随笔', '私密日记'],
  });
}

function loadMoments() {
  const arr = loadJsonSafe(MOMENTS_PATH, []);
  return Array.isArray(arr)
    ? arr.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')))
    : [];
}

function loadShelf() {
  return loadJsonSafe(SHELF_PATH, []);
}

function sanitizeSlug(str) {
  return String(str || '')
    .trim()
    .replace(/[\\/:*?"<>|#%&+{}\s]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'note';
}

function loadAllPosts() {
  ensureDir(POSTS_DIR);
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter(f => /\.(md|txt)$/i.test(f) && !f.startsWith('.'));

  const posts = files.map(filename => {
    const fullPath = path.join(POSTS_DIR, filename);
    const stat = fs.statSync(fullPath);
    const raw = fs.readFileSync(fullPath, 'utf8');
    const baseName = filename.replace(/\.(md|txt)$/i, '');

    const datePrefixMatch = baseName.match(/^(\d{4}-\d{2}-\d{2})-(.+)$/);
    const fallbackDate = datePrefixMatch
      ? datePrefixMatch[1]
      : stat.mtime.toISOString().slice(0, 10);
    const fallbackTitle = datePrefixMatch ? datePrefixMatch[2] : baseName;

    const { meta, body } = parseFrontmatter(raw, {
      title: fallbackTitle,
      date: fallbackDate,
      category: '随笔',
    });

    const { html, headings } = renderMarkdown(body);
    const wordCount = countWords(body);
    const readingMinutes = Math.max(1, Math.round(wordCount / 320));
    const plainExcerpt = stripMarkdown(body).slice(0, 115);
    const summary =
      meta.summary && String(meta.summary).trim()
        ? String(meta.summary).trim()
        : plainExcerpt + (stripMarkdown(body).length > 115 ? '…' : '');

    return {
      slug: sanitizeSlug(baseName),
      filename,
      title: meta.title,
      date: meta.date,
      category: meta.category,
      tags: meta.tags || [],
      featured: Boolean(meta.featured),
      private: Boolean(meta.private),
      draft: Boolean(meta.draft),
      cover: meta.cover || '',
      rawSummary: meta.summary || '',
      summary,
      rawBody: body,
      html,
      headings,
      wordCount,
      readingMinutes,
      mtimeMs: stat.mtimeMs,
    };
  });

  posts.sort((a, b) => {
    const cmp = String(b.date).localeCompare(String(a.date));
    return cmp !== 0 ? cmp : b.mtimeMs - a.mtimeMs;
  });

  return posts;
}

function collectPublicUploadRefs(site, publicPosts, publicMoments, shelf) {
  const refs = new Set();
  const extractFromStr = s => {
    if (!s) return;
    const matches = String(s).matchAll(/uploads\/([^\s"')>\]]+)/g);
    for (const m of matches) refs.add(m[1]);
  };

  extractFromStr(site.avatar);
  (site.polaroids || []).forEach(p => extractFromStr(p.src));
  (shelf || []).forEach(s => extractFromStr(s.cover));
  (publicMoments || []).forEach(m => {
    (m.images || []).forEach(extractFromStr);
  });
  (publicPosts || []).forEach(p => {
    extractFromStr(p.cover);
    extractFromStr(p.rawBody);
  });

  return refs;
}

function buildStaticSite({ localDev = false } = {}) {
  const {
    renderHomePage,
    renderMomentsPage,
    renderArchivePage,
    renderShelfPage,
    renderPostPage,
    renderAboutPage,
    renderRssXml,
  } = getTemplates(true);
  const site = loadSiteConfig();
  const rawPosts = loadAllPosts().filter(p => !p.draft);
  const rawMoments = loadMoments();
  const shelf = loadShelf();

  // PHYSICAL PRIVACY ISOLATION: Public dist/ strictly excludes all private posts & private moments!
  const publicPosts = localDev ? rawPosts : rawPosts.filter(p => !p.private);
  const publicMoments = localDev ? rawMoments : rawMoments.filter(m => !m.private);

  ensureDir(DIST_DIR);
  ensureDir(path.join(DIST_DIR, 'assets'));
  ensureDir(path.join(DIST_DIR, 'posts'));
  ensureDir(path.join(DIST_DIR, 'uploads'));

  for (const f of fs.readdirSync(path.join(DIST_DIR, 'posts'))) {
    if (f.endsWith('.html')) fs.unlinkSync(path.join(DIST_DIR, 'posts', f));
  }
  for (const f of fs.readdirSync(path.join(DIST_DIR, 'uploads'))) {
    fs.unlinkSync(path.join(DIST_DIR, 'uploads', f));
  }

  // Only copy images referenced by PUBLIC content into dist/uploads/!
  ensureDir(UPLOADS_DIR);
  const allowedUploads = collectPublicUploadRefs(site, publicPosts, publicMoments, shelf);
  for (const fname of allowedUploads) {
    const safeBase = path.basename(fname);
    const srcFile = path.join(UPLOADS_DIR, safeBase);
    if (fs.existsSync(srcFile)) {
      fs.copyFileSync(srcFile, path.join(DIST_DIR, 'uploads', safeBase));
    }
  }

  fs.copyFileSync(path.join(SRC_DIR, 'styles.css'), path.join(DIST_DIR, 'assets', 'styles.css'));
  fs.copyFileSync(path.join(SRC_DIR, 'client.js'), path.join(DIST_DIR, 'assets', 'client.js'));

  fs.writeFileSync(
    path.join(DIST_DIR, 'index.html'),
    renderHomePage({ site, posts: publicPosts, moments: publicMoments, shelf, localDev }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(DIST_DIR, 'moments.html'),
    renderMomentsPage({ site, posts: publicPosts, moments: publicMoments, shelf, localDev }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(DIST_DIR, 'archive.html'),
    renderArchivePage({ site, posts: publicPosts, moments: publicMoments, shelf, localDev }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(DIST_DIR, 'shelf.html'),
    renderShelfPage({ site, posts: publicPosts, moments: publicMoments, shelf, localDev }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(DIST_DIR, 'about.html'),
    renderAboutPage({ site, posts: publicPosts, moments: publicMoments, shelf, localDev }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(DIST_DIR, 'rss.xml'),
    renderRssXml({ site, posts: publicPosts }),
    'utf8'
  );

  publicPosts.forEach((post, idx) => {
    const prevPost = idx > 0 ? publicPosts[idx - 1] : null;
    const nextPost = idx < publicPosts.length - 1 ? publicPosts[idx + 1] : null;
    const html = renderPostPage({
      site,
      post,
      prevPost,
      nextPost,
      allPosts: publicPosts,
      moments: publicMoments,
      shelf,
      localDev,
    });
    fs.writeFileSync(path.join(DIST_DIR, 'posts', `${post.slug}.html`), html, 'utf8');
  });

  return { site, publicPosts, totalPosts: rawPosts.length };
}

function fetchHttpsBuffer(urlStr, timeoutMs = 3500) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      urlStr,
      { headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json,*/*' }, timeout: timeoutMs },
      res => {
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          res.resume();
          return resolve(fetchHttpsBuffer(res.headers.location, timeoutMs));
        }
        if (res.statusCode !== 200) {
          res.resume();
          return reject(new Error('HTTP ' + res.statusCode));
        }
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
    req.on('error', reject);
  });
}

function cleanAdminName(s) {
  const raw = String(s || '').trim();
  if (!raw) return '';
  const stripped = raw.replace(/(维吾尔自治区|壮族自治区|回族自治区|自治区|特别行政区|省|市|地区|盟)$/u, '').trim();
  return stripped.length >= 2 ? stripped : raw;
}

function composeProvCity(prov, city, dist) {
  const p = cleanAdminName(prov);
  const c = cleanAdminName(city);
  const d = String(dist || '').trim();
  if (p && c && p !== c) return `${p} · ${c}`;
  if (p && d) return `${p} · ${d}`;
  return p || c || '';
}

async function detectServerProvinceCity(lat, lon) {
  if (lat && lon) {
    try {
      const buf = await fetchHttpsBuffer(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=zh`
      );
      const j = JSON.parse(buf.toString('utf8'));
      const loc = composeProvCity(j.principalSubdivision, j.city || j.locality, '');
      if (loc) return loc;
    } catch (_) {}
  }

  // 1. Tencent News Domestic IP-to-City (UTF-8 JSON, DIRECT China domain)
  try {
    const buf = await fetchHttpsBuffer('https://r.inews.qq.com/api/ip2city');
    const j = JSON.parse(buf.toString('utf8'));
    if (j && j.province) {
      const loc = composeProvCity(j.province, j.city, j.district);
      if (loc) return loc;
    }
  } catch (_) {}

  // 2. Meituan Domestic IP RGeo (UTF-8 JSON, fast & accurate in Mainland China)
  try {
    const buf = await fetchHttpsBuffer('https://apimobile.meituan.com/locate/v2/ip/loc?rgeo=true');
    const j = JSON.parse(buf.toString('utf8'));
    const rg = j?.data?.rgeo;
    if (rg) {
      const loc = composeProvCity(rg.province, rg.city, rg.district);
      if (loc) return loc;
    }
  } catch (_) {}

  // 3. PConline Domestic IP JSON (GBK decoded via built-in TextDecoder)
  try {
    const buf = await fetchHttpsBuffer('https://whois.pconline.com.cn/ipJson.jsp?json=true');
    const txt = new TextDecoder('gbk').decode(buf);
    const j = JSON.parse(txt.trim());
    const loc = composeProvCity(j.pro, j.city, j.region);
    if (loc) return loc;
  } catch (_) {}

  // 4. BigDataCloud Chinese IP Fallback (only if countryCode is CN so proxy exits like Tokyo aren't saved!)
  try {
    const buf = await fetchHttpsBuffer('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=zh');
    const j = JSON.parse(buf.toString('utf8'));
    if (!j.countryCode || j.countryCode === 'CN') {
      const loc = composeProvCity(j.principalSubdivision, j.city || j.locality, '');
      if (loc) return loc;
    }
  } catch (_) {}

  return '';
}

function readJsonBody(req, maxBytes = 25 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > maxBytes) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

function startDevServer(preferredPort = 4321) {
  ensureDir(POSTS_DIR);
  ensureDir(DATA_DIR);
  ensureDir(UPLOADS_DIR);
  buildStaticSite({ localDev: false });

  const sseClients = new Set();
  let suppressWatchUntil = 0;

  function notifyReload() {
    for (const res of sseClients) {
      res.write('data: reload\n\n');
    }
  }

  let debounceTimer = null;
  function triggerExternalSync() {
    if (Date.now() < suppressWatchUntil) return;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      try {
        buildStaticSite({ localDev: false });
        notifyReload();
      } catch (err) {
        console.error('Rebuild error:', err.message);
      }
    }, 180);
  }

  fs.watch(POSTS_DIR, triggerExternalSync);
  fs.watch(DATA_DIR, triggerExternalSync);
  if (fs.existsSync(CONFIG_PATH)) {
    fs.watch(CONFIG_PATH, triggerExternalSync);
  }

  const server = http.createServer(async (req, res) => {
    try {
      const urlObj = new URL(req.url, 'http://localhost');
      const pathname = decodeURIComponent(urlObj.pathname);

      if (pathname === '/__live') {
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.write('data: connected\n\n');
        sseClients.add(res);
        req.on('close', () => sseClients.delete(res));
        return;
      }

      // Serve local uploaded images (/uploads/*)
      if (pathname.startsWith('/uploads/')) {
        const fname = path.basename(pathname.slice('/uploads/'.length));
        const fpath = path.join(UPLOADS_DIR, fname);
        if (fs.existsSync(fpath) && fs.statSync(fpath).isFile()) {
          const ext = path.extname(fname).toLowerCase();
          res.writeHead(200, { 'Content-Type': MIME_MAP[ext] || 'application/octet-stream' });
          fs.createReadStream(fpath).pipe(res);
          return;
        }
        res.writeHead(404);
        res.end('Image Not Found');
        return;
      }

      // Image Upload Endpoint (Base64 DataURL -> uploads/ folder)
      if (pathname === '/api/upload' && req.method === 'POST') {
        const { name, dataUrl } = await readJsonBody(req);
        const match = String(dataUrl || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
        if (!match) {
          res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
          res.end(JSON.stringify({ ok: false, error: '无效的图片格式' }));
          return;
        }
        const mime = match[1];
        const buf = Buffer.from(match[2], 'base64');
        let ext = path.extname(name || '').toLowerCase();
        if (!MIME_MAP[ext]) {
          ext = mime.includes('png')
            ? '.png'
            : mime.includes('webp')
            ? '.webp'
            : mime.includes('gif')
            ? '.gif'
            : mime.includes('svg')
            ? '.svg'
            : '.jpg';
        }
        const cleanBase = sanitizeSlug(path.basename(name || 'photo', path.extname(name || ''))).slice(0, 24);
        const outName = `${Date.now()}-${cleanBase}${ext}`;
        ensureDir(UPLOADS_DIR);
        fs.writeFileSync(path.join(UPLOADS_DIR, outName), buf);

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, path: `uploads/${outName}` }));
        return;
      }

      if (pathname === '/api/geolocate' && req.method === 'GET') {
        const lat = urlObj.searchParams.get('lat') || '';
        const lon = urlObj.searchParams.get('lon') || '';
        const location = await detectServerProvinceCity(lat, lon);
        if (location) {
          const siteCfg = loadSiteConfig();
          if (siteCfg.location !== location) {
            siteCfg.location = location;
            suppressWatchUntil = Date.now() + 600;
            fs.writeFileSync(CONFIG_PATH, JSON.stringify(siteCfg, null, 2) + '\n', 'utf8');
            buildStaticSite({ localDev: false });
          }
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: Boolean(location), location }));
        return;
      }

      if (pathname === '/api/state' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(
          JSON.stringify({
            site: loadSiteConfig(),
            posts: loadAllPosts(),
            moments: loadMoments(),
            shelf: loadShelf(),
          })
        );
        return;
      }

      if (pathname === '/api/preview' && req.method === 'POST') {
        const body = await readJsonBody(req);
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify(renderMarkdown(body.markdown || '')));
        return;
      }

      if (pathname === '/api/post' && req.method === 'POST') {
        const data = await readJsonBody(req);
        const existingPosts = loadAllPosts();
        suppressWatchUntil = Date.now() + 500;

        if (data.featured) {
          for (const p of existingPosts) {
            if (p.featured && p.slug !== data.slug) {
              const updatedOther = serializeDocument({ ...p, summary: p.rawSummary, featured: false }, p.rawBody);
              fs.writeFileSync(path.join(POSTS_DIR, p.filename), updatedOther, 'utf8');
            }
          }
        }

        let targetFilename;
        let finalSlug;
        const existing = data.slug ? existingPosts.find(p => p.slug === data.slug) : null;
        if (existing) {
          targetFilename = existing.filename;
          finalSlug = existing.slug;
        } else {
          const datePart = data.date || new Date().toISOString().slice(0, 10);
          const titlePart = sanitizeSlug(data.title).slice(0, 40);
          finalSlug = sanitizeSlug(`${datePart}-${titlePart}`);
          targetFilename = `${finalSlug}.md`;
        }

        const fileContent = serializeDocument(
          {
            title: data.title,
            date: data.date,
            category: data.category,
            tags: data.tags,
            private: Boolean(data.private),
            featured: Boolean(data.featured),
            cover: data.cover || '',
            summary: data.summary,
          },
          data.body
        );

        fs.writeFileSync(path.join(POSTS_DIR, targetFilename), fileContent, 'utf8');
        buildStaticSite({ localDev: false });
        notifyReload();

        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, slug: finalSlug, filename: targetFilename }));
        return;
      }

      if (pathname === '/api/post' && req.method === 'DELETE') {
        const slug = urlObj.searchParams.get('slug');
        const existing = loadAllPosts().find(p => p.slug === slug);
        if (existing) {
          suppressWatchUntil = Date.now() + 500;
          fs.unlinkSync(path.join(POSTS_DIR, existing.filename));
          buildStaticSite({ localDev: false });
          notifyReload();
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (pathname === '/api/collection' && req.method === 'POST') {
        const { kind, items } = await readJsonBody(req);
        suppressWatchUntil = Date.now() + 500;
        if (kind === 'moments') {
          fs.writeFileSync(MOMENTS_PATH, JSON.stringify(items || [], null, 2) + '\n', 'utf8');
        } else if (kind === 'shelf') {
          fs.writeFileSync(SHELF_PATH, JSON.stringify(items || [], null, 2) + '\n', 'utf8');
        }
        buildStaticSite({ localDev: false });
        notifyReload();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (pathname === '/api/site' && req.method === 'POST') {
        const updatedSite = await readJsonBody(req);
        suppressWatchUntil = Date.now() + 500;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(updatedSite, null, 2) + '\n', 'utf8');
        buildStaticSite({ localDev: false });
        notifyReload();
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      // Atomic Inline UX Endpoints (Zero page reload!)
      if (pathname === '/api/moment/add' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const list = loadMoments();
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const defaultStamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
        const customDate = String(body.date || '').trim().replace('T', ' ').slice(0, 16);
        const item = {
          id: 'm-' + Date.now(),
          date: customDate || defaultStamp,
          mood: body.mood || '日常',
          location: String(body.location || '').trim(),
          private: Boolean(body.private),
          content: String(body.content || '').trim(),
          images: Array.isArray(body.images) ? body.images.slice(0, 9) : [],
          notes: [],
          likes: 0,
        };
        list.unshift(item);
        list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
        suppressWatchUntil = Date.now() + 600;
        fs.writeFileSync(MOMENTS_PATH, JSON.stringify(list, null, 2) + '\n', 'utf8');
        buildStaticSite({ localDev: false });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, moment: item, moments: list }));
        return;
      }

      if (pathname === '/api/moment/note' && req.method === 'POST') {
        const { id, note } = await readJsonBody(req);
        const list = loadMoments();
        const found = list.find(m => m.id === id);
        if (found && String(note || '').trim()) {
          if (!Array.isArray(found.notes)) found.notes = [];
          found.notes.push(String(note).trim());
          suppressWatchUntil = Date.now() + 600;
          fs.writeFileSync(MOMENTS_PATH, JSON.stringify(list, null, 2) + '\n', 'utf8');
          buildStaticSite({ localDev: false });
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: Boolean(found), moment: found }));
        return;
      }

      if (pathname === '/api/moment/toggle-private' && req.method === 'POST') {
        const { id } = await readJsonBody(req);
        const list = loadMoments();
        const found = list.find(m => m.id === id);
        if (found) {
          found.private = !found.private;
          suppressWatchUntil = Date.now() + 600;
          fs.writeFileSync(MOMENTS_PATH, JSON.stringify(list, null, 2) + '\n', 'utf8');
          buildStaticSite({ localDev: false });
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: Boolean(found), private: found?.private }));
        return;
      }

      if (pathname === '/api/moment/like' && req.method === 'POST') {
        const { id, delta } = await readJsonBody(req);
        const list = loadMoments();
        const found = list.find(m => m.id === id);
        if (found) {
          found.likes = Math.max(0, (Number(found.likes) || 0) + (Number(delta) || 0));
          suppressWatchUntil = Date.now() + 600;
          fs.writeFileSync(MOMENTS_PATH, JSON.stringify(list, null, 2) + '\n', 'utf8');
          buildStaticSite({ localDev: false });
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: Boolean(found), likes: found?.likes || 0 }));
        return;
      }

      if (pathname === '/api/moment' && req.method === 'DELETE') {
        const id = urlObj.searchParams.get('id');
        const list = loadMoments().filter(m => m.id !== id);
        suppressWatchUntil = Date.now() + 600;
        fs.writeFileSync(MOMENTS_PATH, JSON.stringify(list, null, 2) + '\n', 'utf8');
        buildStaticSite({ localDev: false });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (pathname === '/api/shelf/add' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const list = loadShelf();
        const item = {
          id: 's-' + Date.now(),
          type: body.type || '影视',
          status: body.status || '看过',
          title: String(body.title || '').trim(),
          creator: String(body.creator || '').trim(),
          rating: Number(body.rating) || 5,
          tone: body.tone || 'sage',
          cover: String(body.cover || '').trim(),
          comment: String(body.comment || '').trim(),
        };
        list.unshift(item);
        suppressWatchUntil = Date.now() + 600;
        fs.writeFileSync(SHELF_PATH, JSON.stringify(list, null, 2) + '\n', 'utf8');
        buildStaticSite({ localDev: false });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, item }));
        return;
      }

      if (pathname === '/api/shelf' && req.method === 'DELETE') {
        const id = urlObj.searchParams.get('id');
        const list = loadShelf().filter(s => s.id !== id);
        suppressWatchUntil = Date.now() + 600;
        fs.writeFileSync(SHELF_PATH, JSON.stringify(list, null, 2) + '\n', 'utf8');
        buildStaticSite({ localDev: false });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true }));
        return;
      }

      if (pathname === '/api/polaroid/add' && req.method === 'POST') {
        const { src, caption } = await readJsonBody(req);
        const siteCfg = loadSiteConfig();
        if (!Array.isArray(siteCfg.polaroids)) siteCfg.polaroids = [];
        siteCfg.polaroids.unshift({ src, caption: caption || '随手拍' });
        siteCfg.polaroids = siteCfg.polaroids.slice(0, 3);
        suppressWatchUntil = Date.now() + 600;
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(siteCfg, null, 2) + '\n', 'utf8');
        buildStaticSite({ localDev: false });
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: true, polaroids: siteCfg.polaroids }));
        return;
      }

      if (pathname === '/api/post/toggle-task' && req.method === 'POST') {
        const { slug, taskIndex } = await readJsonBody(req);
        const existing = loadAllPosts().find(p => p.slug === slug);
        let newDone = false;
        if (existing) {
          let seq = 0;
          const updatedRaw = fs
            .readFileSync(path.join(POSTS_DIR, existing.filename), 'utf8')
            .replace(/^(\s*[-*+]\s+\[)([ xX])(\]\s+)/gm, (full, p1, mark, p3) => {
              if (seq++ === Number(taskIndex)) {
                newDone = mark.trim() === '';
                return p1 + (newDone ? 'x' : ' ') + p3;
              }
              return full;
            });
          suppressWatchUntil = Date.now() + 600;
          fs.writeFileSync(path.join(POSTS_DIR, existing.filename), updatedRaw, 'utf8');
          buildStaticSite({ localDev: false });
        }
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ ok: Boolean(existing), done: newDone }));
        return;
      }

      if (pathname === '/assets/styles.css') {
        res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(fs.readFileSync(path.join(SRC_DIR, 'styles.css'), 'utf8'));
        return;
      }
      if (pathname === '/assets/studio.css') {
        res.writeHead(200, { 'Content-Type': 'text/css; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(fs.readFileSync(path.join(SRC_DIR, 'studio.css'), 'utf8'));
        return;
      }
      if (pathname === '/assets/client.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(fs.readFileSync(path.join(SRC_DIR, 'client.js'), 'utf8'));
        return;
      }
      if (pathname === '/assets/studio.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8', 'Cache-Control': 'no-store' });
        res.end(fs.readFileSync(path.join(SRC_DIR, 'studio.js'), 'utf8'));
        return;
      }

      // Local Owner Pages (includes private diaries & private moments, toggleable via 访客视角!)
      const {
        renderHomePage,
        renderMomentsPage,
        renderArchivePage,
        renderShelfPage,
        renderPostPage,
        renderAboutPage,
        renderStudioPage,
        renderRssXml,
      } = getTemplates(true);
      const site = loadSiteConfig();
      const posts = loadAllPosts().filter(p => !p.draft);
      const moments = loadMoments();
      const shelf = loadShelf();

      if (pathname === '/' || pathname === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderHomePage({ site, posts, moments, shelf, localDev: true }));
        return;
      }
      if (pathname === '/moments.html' || pathname === '/moments') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderMomentsPage({ site, posts, moments, shelf, localDev: true }));
        return;
      }
      if (pathname === '/archive.html' || pathname === '/archive') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderArchivePage({ site, posts, moments, shelf, localDev: true }));
        return;
      }
      if (pathname === '/shelf.html' || pathname === '/shelf') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderShelfPage({ site, posts, moments, shelf, localDev: true }));
        return;
      }
      if (pathname === '/about.html' || pathname === '/about') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderAboutPage({ site, posts, moments, shelf, localDev: true }));
        return;
      }
      if (pathname === '/studio.html' || pathname === '/studio') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(renderStudioPage({ site, posts, moments, shelf }));
        return;
      }
      if (pathname === '/rss.xml') {
        res.writeHead(200, { 'Content-Type': 'application/rss+xml; charset=utf-8' });
        res.end(renderRssXml({ site, posts: posts.filter(p => !p.private) }));
        return;
      }
      if (pathname.startsWith('/posts/') && pathname.endsWith('.html')) {
        const slug = pathname.slice('/posts/'.length, -'.html'.length);
        const idx = posts.findIndex(p => p.slug === slug);
        if (idx !== -1) {
          const prevPost = idx > 0 ? posts[idx - 1] : null;
          const nextPost = idx < posts.length - 1 ? posts[idx + 1] : null;
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(
            renderPostPage({
              site,
              post: posts[idx],
              prevPost,
              nextPost,
              allPosts: posts,
              moments,
              shelf,
              localDev: true,
            })
          );
          return;
        }
      }

      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 Not Found');
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Server Error: ' + err.message);
    }
  });

  function listenOn(port) {
    server.once('error', err => {
      if (err.code === 'EADDRINUSE') {
        listenOn(port + 1);
      } else {
        throw err;
      }
    });
    server.listen(port, '127.0.0.1', () => {
      console.log(`\n✨ 个人小站已启动！`);
      console.log(`👉 浏览小站首页: http://localhost:${port}`);
      console.log(`✍️ 写文章/发日常: http://localhost:${port}/studio.html`);
      console.log(`🖼️ 本地图片目录: ${UPLOADS_DIR}\n`);
    });
  }

  listenOn(preferredPort);
}

const cmd = process.argv[2] || 'dev';
if (cmd === 'build') {
  const { publicPosts, totalPosts } = buildStaticSite({ localDev: false });
  const hiddenCount = totalPosts - publicPosts.length;
  console.log(`✓ 已生成对外公开静态站至 dist/（公开 ${publicPosts.length} 篇，已自动隔离隐藏 ${hiddenCount} 篇私密日记）。`);
} else {
  const portArg = Number(process.env.PORT) || 4321;
  startDevServer(portArg);
}
