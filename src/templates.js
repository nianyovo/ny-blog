const { escapeHtml, renderMarkdown } = require('./markdown');

const ICO = {
  search: `<svg class="ico" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  sun: `<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>`,
  moon: `<svg class="ico" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  pen: `<svg class="ico" viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>`,
  lock: `<svg class="ico" viewBox="0 0 24 24" style="width:12.5px;height:12.5px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  eye: `<svg class="ico" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeOff: `<svg class="ico" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>`,
  image: `<svg class="ico" viewBox="0 0 24 24" style="width:14px;height:14px;"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`,
  pin: `<svg class="ico" viewBox="0 0 24 24" style="width:12px;height:12px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  arrowUpRight: `<svg class="ico" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M7 17 17 7"/><path d="M7 7h10v10"/></svg>`,
  arrowLeft: `<svg class="ico" viewBox="0 0 24 24" style="width:15px;height:15px;"><path d="m15 18-6-6 6-6"/></svg>`,
  arrowRight: `<svg class="ico" viewBox="0 0 24 24" style="width:15px;height:15px;"><path d="m9 18 6-6-6-6"/></svg>`,
  arrowUp: `<svg class="ico" viewBox="0 0 24 24" style="width:15px;height:15px;"><path d="m18 15-6-6-6 6"/></svg>`,
  refresh: `<svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px;"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>`,
  compass: `<svg class="ico" viewBox="0 0 24 24" style="width:14px;height:14px;"><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/></svg>`,
  grid: `<svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px;"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>`,
  spark: `<svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px;"><path d="M12 3v3m0 12v3M3 12h3m12 0h3m-2.6-6.4-2.1 2.1M8.7 15.3l-2.1 2.1m0-10.8 2.1 2.1m6.6 6.6 2.1 2.1"/></svg>`,
  bookmark: `<svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px;"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>`,
  heart: `<svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
  sliders: `<svg class="ico" viewBox="0 0 24 24"><line x1="4" x2="4" y1="21" y2="14"/><line x1="4" x2="4" y1="10" y2="3"/><line x1="12" x2="12" y1="21" y2="12"/><line x1="12" x2="12" y1="8" y2="3"/><line x1="20" x2="20" y1="21" y2="16"/><line x1="20" x2="20" y1="12" y2="3"/><line x1="2" x2="6" y1="14" y2="14"/><line x1="10" x2="14" y1="8" y2="8"/><line x1="18" x2="22" y1="16" y2="16"/></svg>`,
  plus: `<svg class="ico" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>`,
  star: `<svg class="ico" viewBox="0 0 24 24" style="width:12px;height:12px;fill:currentColor;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
  terminal: `<svg class="ico" viewBox="0 0 24 24"><polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/></svg>`,
  disc: `<svg class="ico" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/><path d="M6 12a6 6 0 0 1 6-6"/></svg>`,
  play: `<svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor;stroke:none;"><polygon points="6 4 20 12 6 20 6 4"/></svg>`,
  pause: `<svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px;fill:currentColor;stroke:none;"><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>`,
  skip: `<svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px;"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" x2="19" y1="5" y2="19"/></svg>`,
  repo: `<svg class="ico" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>`,
  camera: `<svg class="ico" viewBox="0 0 24 24" style="width:14px;height:14px;"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>`,
  calendar: `<svg class="ico" viewBox="0 0 24 24" style="width:13.5px;height:13.5px;"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`,
  dice: `<svg class="ico" viewBox="0 0 24 24" style="width:13.5px;height:13.5px;"><rect width="18" height="18" x="3" y="3" rx="3.5"/><circle cx="8.5" cy="8.5" r="1.2" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/></svg>`,
  soundOn: `<svg class="ico" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>`,
  soundOff: `<svg class="ico" viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" x2="16" y1="9" y2="15"/><line x1="16" x2="22" y1="9" y2="15"/></svg>`,
  poster: `<svg class="ico" viewBox="0 0 24 24" style="width:13.5px;height:13.5px;"><rect x="4" y="3" width="16" height="18" rx="2.5"/><path d="M8 8h8M8 12h6M8 17h4"/></svg>`,
};

function resolveImg(src, rootPrefix = '') {
  if (!src) return '';
  if (/^(https?:|data:|\/)/i.test(src)) return src;
  const clean = src.replace(/^(\.\.\/)+/, '');
  return `${rootPrefix}${clean}`;
}

function formatDotDate(dateStr) {
  return String(dateStr || '').replace(/-/g, '.');
}

function formatMonthDay(dateStr) {
  const m = String(dateStr || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return dateStr;
  return `${m[2]}.${m[3]}`;
}

function formatDayOnly(dateStr) {
  const m = String(dateStr || '').match(/^\d{4}-\d{2}-(\d{2})/);
  return m ? `${Number(m[1])}日` : dateStr;
}

function categoryChipClass(cat) {
  if (/夜记|私密/.test(cat)) return 'cat-chip cat-violet';
  if (/随笔/.test(cat)) return 'cat-chip cat-indigo';
  if (/随手拍|影视|书籍|电影/.test(cat)) return 'cat-chip cat-emerald';
  if (/周末|游戏/.test(cat)) return 'cat-chip cat-amber';
  if (/碎碎念/.test(cat)) return 'cat-chip cat-rose';
  if (/日常|好物|收藏|珍藏/.test(cat)) return 'cat-chip cat-sky';
  return 'cat-chip cat-coral';
}

function calcRunningDays(startDateStr) {
  const start = new Date(startDateStr || '2026-10-01');
  return Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000));
}

function calcYearProgress() {
  const now = new Date();
  const yr = now.getFullYear();
  const start = new Date(yr, 0, 1).getTime();
  const end = new Date(yr + 1, 0, 1).getTime();
  const pct = Math.min(100, Math.max(1, ((now.getTime() - start) / (end - start)) * 100));
  return { year: yr, pct: pct.toFixed(1) };
}

function getNavLabels(site) {
  const raw = site?.navLabels || {};
  return {
    home: raw.home || '扉页',
    moments: raw.moments || '朝夕',
    archive: raw.archive || '纪事',
    shelf: raw.shelf || '珍藏',
    about: raw.about || '自叙',
  };
}

function sortMomentsDesc(moments) {
  return [...(moments || [])].sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
}

function renderPrivBadge(isPrivate) {
  if (!isPrivate) return '';
  return `<span class="priv-badge" title="仅在本地自己可见，打包公开网站时会自动剔除">${ICO.lock}<span>仅自己可见</span></span>`;
}

function isCategoryPurelyPrivate(catName, posts) {
  const inCat = (posts || []).filter(p => p.category === catName);
  if (/(私密|私语|夜记)/.test(String(catName)) && inCat.length === 0) return true;
  return inCat.length > 0 && inCat.every(p => p.private);
}

function buildHeatmapCells(posts, moments) {
  const map = {};
  (posts || []).forEach(p => {
    const d = String(p.date || '').slice(0, 10);
    if (!d) return;
    if (!map[d]) map[d] = { count: 0, label: p.title, url: `posts/${p.slug}.html`, priv: Boolean(p.private) };
    map[d].count += 2;
  });
  (moments || []).forEach(m => {
    const d = String(m.date || '').slice(0, 10);
    if (!d) return;
    if (!map[d]) map[d] = { count: 0, label: `日常：${m.content.slice(0, 16)}…`, url: 'moments.html', priv: Boolean(m.private) };
    map[d].count += 1;
  });

  const anchor = posts[0]?.date ? new Date(posts[0].date + 'T12:00:00') : new Date();
  const base = isNaN(anchor.getTime()) ? new Date() : anchor;
  const cells = [];
  for (let i = 41; i >= 0; i--) {
    const dt = new Date(base.getTime() - i * 86400000);
    const key = dt.toISOString().slice(0, 10);
    const rec = map[key];
    const level = !rec ? 0 : rec.count >= 3 ? 3 : rec.count >= 2 ? 2 : 1;
    const tip = rec ? `${key} · ${rec.label}` : `${key} · 没写东西`;
    cells.push({ key, level, tip, url: rec?.url || '', priv: Boolean(rec?.priv) });
  }
  return cells;
}

function renderLayout({
  title,
  readingTitle,
  site,
  activeNav,
  rootPrefix,
  bodyHtml,
  postsForSearch,
  moments,
  shelf,
  localDev,
  extraHeadHtml = '',
  extraFootHtml = '',
}) {
  const searchData = [
    ...(postsForSearch || []).map(p => ({
      kind: '文章',
      title: p.title,
      date: p.date,
      category: p.category,
      tags: p.tags || [],
      summary: p.summary,
      private: Boolean(p.private),
      url: `${rootPrefix}posts/${p.slug}.html`,
    })),
    ...(moments || []).map(m => ({
      kind: '日常',
      title: m.content.slice(0, 34) + (m.content.length > 34 ? '…' : ''),
      date: String(m.date || '').slice(0, 10),
      category: m.mood || '日常',
      tags: m.location ? [m.location] : [],
      summary: m.content,
      private: Boolean(m.private),
      url: `${rootPrefix}moments.html`,
    })),
    ...(shelf || []).map(s => ({
      kind: '收藏',
      title: s.title,
      date: s.status || '收藏',
      category: s.type || '收藏',
      tags: s.creator ? [s.creator] : [],
      summary: s.comment || '',
      private: false,
      url: `${rootPrefix}shelf.html`,
    })),
  ];

  const avatarUrl = resolveImg(site.avatar || 'uploads/avatar-default.svg', rootPrefix);
  const nav = getNavLabels(site);
  const yp = calcYearProgress();

  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="light" data-aura="prism">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title ? `${title} · ${site.title}` : site.title)}</title>
  <script>
    (function() {
      var saved = localStorage.getItem('blog-theme');
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved);
      }
      var aura = localStorage.getItem('blog-aura');
      if (aura) {
        document.documentElement.setAttribute('data-aura', aura);
      }
      if (${Boolean(localDev)} && sessionStorage.getItem('guest-preview') === '1') {
        document.documentElement.classList.add('guest-preview');
      }
    })();
  </script>
  <link rel="stylesheet" href="${rootPrefix}assets/styles.css" />
  ${extraHeadHtml}
  <link rel="alternate" type="application/rss+xml" title="${escapeHtml(site.title)}" href="${rootPrefix}rss.xml" />
</head>
<body>
  <div id="scroll-progress"></div>
  <div id="cursor-ring" class="cursor-ring"></div>
  <div class="film-grain" aria-hidden="true"></div>
  <canvas id="fx-canvas" class="fx-canvas"></canvas>

  <div class="ambient-canvas">
    <div class="aurora-blob b1"></div>
    <div class="aurora-blob b2"></div>
    <div class="aurora-blob b3"></div>
    <div class="aurora-blob b4"></div>
    <div class="aurora-blob b5"></div>
  </div>

  <div class="nav-wrapper">
    <header id="floating-nav" class="floating-nav" data-has-reading="${readingTitle ? '1' : '0'}">
      <a href="${rootPrefix}index.html" class="brand">
        <img class="brand-avatar" data-live-avatar src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(site.author || site.title)}" />
        <span class="brand-title font-serif-cn">${escapeHtml(site.title)}</span>
      </a>

      <div class="nav-center-stage">
        <nav id="nav-pills-wrap" class="nav-center-pills">
          <span id="nav-glider" class="nav-glider"></span>
          <a href="${rootPrefix}index.html" data-nav-key="home" class="${activeNav === 'home' ? 'active' : ''}">${escapeHtml(nav.home)}</a>
          <a href="${rootPrefix}moments.html" data-nav-key="moments" class="${activeNav === 'moments' ? 'active' : ''}">${escapeHtml(nav.moments)}</a>
          <a href="${rootPrefix}archive.html" data-nav-key="archive" class="${activeNav === 'archive' ? 'active' : ''}">${escapeHtml(nav.archive)}</a>
          <a href="${rootPrefix}shelf.html" data-nav-key="shelf" class="${activeNav === 'shelf' ? 'active' : ''}">${escapeHtml(nav.shelf)}</a>
          <a href="${rootPrefix}about.html" data-nav-key="about" class="${activeNav === 'about' ? 'active' : ''}">${escapeHtml(nav.about)}</a>
        </nav>
        <div id="nav-reading-title" class="nav-reading-title font-serif-cn" title="点击回到文章顶部">${escapeHtml(readingTitle || '')}</div>
      </div>

      <div class="nav-actions">
        ${
          localDev
            ? `<button type="button" id="privacy-view-toggle" class="pill-action-btn" title="切换主人视角 / 访客视角（预览对外公开效果）">
                <span id="priv-ico-owner">${ICO.eye}</span>
                <span id="priv-ico-guest" style="display:none;">${ICO.eyeOff}</span>
                <span id="priv-label-text">访客视角</span>
              </button>`
            : ''
        }
        <button type="button" id="aura-open-btn" class="pill-action-btn aura-pill-btn" title="切换幻彩光谱 (C)">
          <span class="aura-rainbow-dot"></span>
        </button>
        <button type="button" id="sfx-toggle-btn" class="pill-action-btn sfx-pill-btn" title="全站总声音开关 (V)">
          <span id="sfx-ico-on">${ICO.soundOn}</span>
          <span id="sfx-ico-off" style="display:none;">${ICO.soundOff}</span>
        </button>
        <button type="button" id="terminal-open" class="pill-action-btn" title="极客终端 (~)">
          ${ICO.terminal}
        </button>
        <button type="button" id="search-open" class="pill-action-btn" title="搜索 (Ctrl+K)">
          ${ICO.search}
        </button>
        <button type="button" id="theme-toggle" class="pill-action-btn" title="切换日夜">
          <span id="theme-icon-sun">${ICO.sun}</span>
          <span id="theme-icon-moon" style="display:none;">${ICO.moon}</span>
        </button>
        ${
          localDev
            ? `<a href="${rootPrefix}studio.html" class="write-cta-pill" data-magnetic data-owner-only="1">
                ${ICO.pen}
                <span>写点什么</span>
              </a>`
            : ''
        }
      </div>
    </header>

    ${
      localDev
        ? `<div class="guest-banner">
            <span>访客视角预览中</span>
            <button type="button" id="exit-guest-btn" style="background:none;border:none;font-weight:700;cursor:pointer;text-decoration:underline;">退出</button>
          </div>`
        : ''
    }
  </div>

  <div id="app-view">
    ${bodyHtml}
  </div>

  <div id="global-toast" class="global-toast"></div>
  <div id="floating-tip" class="floating-tip font-mono-num"></div>
  <input type="file" id="global-img-picker" accept="image/*" multiple style="display:none;" />
  <script id="spa-page-meta" type="application/json">${JSON.stringify({
    activeNav: activeNav || '',
    readingTitle: readingTitle || '',
    searchData,
    moments: (moments || []).map(m => ({ ...m, private: Boolean(m.private) })),
    siteMeta: {
      title: site.title || '自留地',
      author: site.author || site.title || '自留地',
      handle: site.handle || 'ziliudi',
      avatar: avatarUrl,
      location: site.location || '',
    },
  }).replace(/<\//g, '<\\/')}</script>

  <footer class="container-main site-footer">
    <div style="display:flex; align-items:center; gap:14px; flex-wrap:wrap;">
      <span>© ${yp.year} ${escapeHtml(site.title)}</span>
      <span style="opacity:0.4;">·</span>
      <span id="live-uptime" class="font-mono-num" data-start="${escapeHtml(site.startDate || '2026-10-01')}">存活 ${calcRunningDays(site.startDate)} 天</span>
      <span class="year-prog-wrap" title="${yp.year} 年进度 ${yp.pct}%">
        <span class="font-mono-num">${yp.year} · ${yp.pct}%</span>
        <span class="year-prog-track"><span class="year-prog-fill" style="width:${yp.pct}%;"></span></span>
      </span>
      <span id="live-fps" class="fps-badge font-mono-num">60 FPS</span>
    </div>
    ${localDev ? `<div style="display:flex; gap:16px; align-items:center; flex-wrap:wrap;"><a href="${rootPrefix}studio.html?tab=settings" data-owner-only="1" style="color:var(--accent); display:inline-flex; align-items:center; gap:5px;">${ICO.sliders}<span>设置</span></a></div>` : ''}
  </footer>

  <div id="utility-dock" class="floating-utility-dock">
    <button type="button" id="dock-vinyl-btn" class="dock-orb-btn dock-vinyl-orb" data-magnetic title="黑胶电台 · 点击播放/暂停">
      ${ICO.disc}
    </button>
    <button type="button" class="dock-orb-btn" data-magnetic data-random-walk title="随机漫游">
      ${ICO.compass}
    </button>
    <button type="button" id="back-to-top" class="dock-orb-btn" data-magnetic title="回到顶部">
      <svg class="progress-ring-svg" viewBox="0 0 42 42">
        <circle id="progress-ring-circle" class="progress-ring-circle" cx="21" cy="21" r="19"></circle>
      </svg>
      ${ICO.arrowUp}
    </button>
  </div>

  <!-- Live Chromatic Aura Popover (Body-Level to Avoid Nav Clipping) -->
  <div id="aura-popover" class="aura-popover">
    <button type="button" class="aura-opt" data-aura-pick="prism"><i style="background:linear-gradient(135deg,#FF6B4A,#8B5CF6,#10B981);"></i><span>流彩</span></button>
    <button type="button" class="aura-opt" data-aura-pick="cyber"><i style="background:linear-gradient(135deg,#06B6D4,#EC4899,#8B5CF6);"></i><span>霓虹</span></button>
    <button type="button" class="aura-opt" data-aura-pick="aurora"><i style="background:linear-gradient(135deg,#10B981,#0EA5E9,#F59E0B);"></i><span>极光</span></button>
    <button type="button" class="aura-opt" data-aura-pick="nebula"><i style="background:linear-gradient(135deg,#8B5CF6,#4F46E5,#F43F5E);"></i><span>星云</span></button>
    <button type="button" class="aura-opt" data-aura-pick="sunset"><i style="background:linear-gradient(135deg,#F97316,#EC4899,#EAB308);"></i><span>霞光</span></button>
  </div>

  <!-- Bespoke Categorized Frosted-Glass Right-Click Context Menu -->
  <div id="custom-ctx-menu" class="ctx-menu">
    <div class="ctx-group-label">漫游与常用</div>
    <button type="button" class="ctx-item" data-ctx-act="random"><span>随机漫游一篇</span><span class="ctx-key">R</span></button>
    <button type="button" class="ctx-item" data-ctx-act="search"><span>搜索与快捷指令</span><span class="ctx-key">⌘K</span></button>
    <button type="button" class="ctx-item" data-ctx-act="copy-url"><span>复制本页链接</span><span class="ctx-key">⌘C</span></button>

    <div class="ctx-sep"></div>
    <div class="ctx-group-label">光影与视效</div>
    <button type="button" class="ctx-item" data-ctx-act="theme"><span>切换日夜光影</span><span class="ctx-key">D</span></button>
    <button type="button" class="ctx-item" data-ctx-act="aura"><span>切换全站幻彩光谱</span><span class="ctx-key">C</span></button>
    <button type="button" class="ctx-item" data-ctx-act="matrix"><span>切换星尘 / 代码雨</span><span class="ctx-key">M</span></button>
    <button type="button" class="ctx-item" data-ctx-act="meteor"><span>召唤漫天流星雨</span><span class="ctx-key">S</span></button>
    <button type="button" class="ctx-item" data-ctx-act="fireworks"><span>绽放屏幕烟花秀</span><span class="ctx-key">F</span></button>

    <div class="ctx-sep"></div>
    <div class="ctx-group-label">声音与分项音效</div>
    <div class="ctx-vol-row">
      <span>全站总音量</span>
      <input id="ctx-master-vol" type="range" min="0" max="100" value="85" class="ctx-vol-slider" />
      <span id="ctx-vol-pct" class="font-mono-num ctx-vol-num">85%</span>
    </div>
    <button type="button" class="ctx-item" data-sfx-sub="gravity"><span>引力漩涡音效</span><span class="ctx-switch" id="ctx-sw-gravity">已开</span></button>
    <button type="button" class="ctx-item" data-sfx-sub="mech"><span>机械轴按键音</span><span class="ctx-switch" id="ctx-sw-mech">已开</span></button>
    <button type="button" class="ctx-item" data-sfx-sub="chime"><span>琴键与街机音</span><span class="ctx-switch" id="ctx-sw-chime">已开</span></button>

    <div class="ctx-sep"></div>
    <div class="ctx-group-label">电台与极客</div>
    <button type="button" class="ctx-item" data-ctx-act="vinyl"><span id="ctx-vinyl-label">播放黑胶电台</span><span class="ctx-key">P</span></button>
    <button type="button" class="ctx-item" data-ctx-act="next-track"><span>切换下一首电台</span><span class="ctx-key">N</span></button>
    <button type="button" class="ctx-item" data-ctx-act="terminal"><span>打开极客终端</span><span class="ctx-key">~</span></button>
    <button type="button" class="ctx-item" data-ctx-act="snake"><span>终端霓虹贪吃蛇</span><span class="ctx-key">Snake</span></button>
  </div>

  <!-- Cyberpunk / macOS Geek Terminal HUD -->
  <div id="geek-terminal" class="modal-backdrop">
    <div class="term-window">
      <div class="term-titlebar">
        <div class="term-dots">
          <button type="button" id="term-close-dot" class="tdot red" title="关闭"></button>
          <span class="tdot yellow"></span>
          <span class="tdot green"></span>
        </div>
        <span class="font-mono-num" style="font-size:12px; color:#9A948C;">guest@${escapeHtml(site.handle || 'nianyou')}: ~ (zsh)</span>
        <button type="button" id="term-esc-btn" class="font-mono-num" style="background:none; border:none; padding:0; font-size:11px; color:#6D6760; cursor:pointer;" title="关闭终端 (ESC)">ESC</button>
      </div>
      <div id="term-output" class="term-output font-mono-num"></div>
      <div class="term-quick-chips">
        <button type="button" data-term-cmd="neofetch">neofetch</button>
        <button type="button" data-term-cmd="snake">snake</button>
        <button type="button" data-term-cmd="meteor">meteor</button>
        <button type="button" data-term-cmd="fireworks">fireworks</button>
        <button type="button" data-term-cmd="aura">aura</button>
        <button type="button" data-term-cmd="matrix">matrix</button>
        <button type="button" data-term-cmd="play">play</button>
        <button type="button" data-term-cmd="ls">ls</button>
        <button type="button" data-term-cmd="random">random</button>
        <button type="button" data-term-cmd="theme">theme</button>
        <button type="button" data-term-cmd="clear">clear</button>
      </div>
      <div class="term-prompt-row font-mono-num">
        <span class="term-prompt-arrow">➜ ~</span>
        <input id="term-input" type="text" spellcheck="false" autocomplete="off" placeholder="help" />
      </div>
    </div>
  </div>

  <div id="lightbox" class="lightbox-backdrop">
    <button type="button" id="lb-prev" class="lb-nav-btn lb-prev" title="上一张">${ICO.arrowLeft}</button>
    <img id="lb-img" class="lightbox-img" src="" alt="" />
    <button type="button" id="lb-next" class="lb-nav-btn lb-next" title="下一张">${ICO.arrowRight}</button>
    <div id="lb-caption" class="lb-caption"></div>
  </div>

  <!-- Prose Text Selection Floating Action Pill & High-DPI Quote Poster Studio -->
  <div id="prose-quote-bar" class="prose-quote-bar">
    <button type="button" id="pq-copy-btn">复制摘录</button>
    <span class="pq-div"></span>
    <button type="button" id="pq-poster-btn">✦ 生成金句卡</button>
  </div>

  <div id="quote-poster-modal" class="modal-backdrop">
    <div class="modal-box poster-modal-box">
      <div class="poster-modal-head">
        <strong class="font-serif-cn" style="font-size:16px;">流光金句海报</strong>
        <button type="button" id="poster-close-btn" class="ui-clear-btn visible" title="关闭">×</button>
      </div>
      <div class="poster-canvas-wrap">
        <canvas id="poster-canvas" width="880" height="1100"></canvas>
      </div>
      <div class="poster-controls-bar">
        <div class="poster-theme-dots" id="poster-themes">
          <button type="button" class="pt-dot active" data-poster-theme="dawn" style="background:linear-gradient(135deg,#FFF7ED,#FCE7F3,#E0E7FF);" title="流彩黎明"></button>
          <button type="button" class="pt-dot" data-poster-theme="cyber" style="background:linear-gradient(135deg,#0F172A,#311042,#083344);" title="暗夜霓虹"></button>
          <button type="button" class="pt-dot" data-poster-theme="aurora" style="background:linear-gradient(135deg,#ECFDF5,#E0F2FE,#FEF3C7);" title="极光薄荷"></button>
          <button type="button" class="pt-dot" data-poster-theme="nebula" style="background:linear-gradient(135deg,#1E1B4B,#4C1D95,#831843);" title="深空暮紫"></button>
        </div>
        <div style="display:flex; gap:8px;">
          <button type="button" id="poster-copy-img" class="btn-secondary">复制图片</button>
          <button type="button" id="poster-download-btn" class="btn-primary">下载 PNG</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Full-Site Spotlight Search & Command Palette Modal -->
  <div id="search-modal" class="modal-backdrop">
    <div class="modal-box" style="background:var(--card-tinted);">
      <div class="ui-input-wrap" style="height:44px; padding:0 14px; margin-bottom:10px; border-radius:12px;">
        <span class="ui-input-icon">${ICO.search}</span>
        <input id="search-input" type="text" placeholder="搜索文章日常，或输入 > 执行快捷指令…" />
        <button type="button" id="search-clear-btn" class="ui-clear-btn" title="清空">×</button>
        <span class="ui-kbd">ESC</span>
      </div>
      <div id="search-results" style="max-height:340px; overflow-y:auto; display:grid; gap:4px;"></div>
    </div>
  </div>

  <script>
    window.__SEARCH_INDEX__ = ${JSON.stringify(searchData)};
    window.__TYPEWRITER__ = ${JSON.stringify(site.typewriterPhrases || [])};
    window.__MOMENTS__ = ${JSON.stringify((moments || []).map(m => ({ ...m, private: Boolean(m.private) })))};
    window.__SITE_META__ = ${JSON.stringify({
      title: site.title || '自留地',
      author: site.author || site.title || '自留地',
      handle: site.handle || 'ziliudi',
      avatar: avatarUrl,
      location: site.location || '',
    })};
    window.__LOCAL_DEV__ = ${Boolean(localDev)};
  </script>
  <script src="${rootPrefix}assets/client.js"></script>
  ${extraFootHtml}
</body>
</html>`;
}

// 1. Homepage
function renderHomePage({ site, posts, moments: rawMoments, shelf, localDev }) {
  const moments = sortMomentsDesc(rawMoments);
  const nav = getNavLabels(site);
  const featuredPost = posts.find(p => p.featured) || posts[0] || null;
  const gridPosts = featuredPost ? posts.filter(p => p.slug !== featuredPost.slug) : posts;
  const allCats = Array.from(new Set([...(site.categories || []), ...posts.map(p => p.category).filter(Boolean)]));
  const runningDays = calcRunningDays(site.startDate);
  const heatCells = buildHeatmapCells(posts, moments);

  const publicPostsCount = posts.filter(p => !p.private).length;
  const publicMomentsCount = (moments || []).filter(m => !m.private).length;

  const firstMoment = (moments || [])[0] || { mood: '日常', date: '刚刚', content: '随便写点日常。', private: false };
  const activeFav = (shelf && shelf[0]) || { type: '影视', status: '看过', title: '完美的日子', creator: '2023', rating: 5, tone: 'sage', cover: '' };
  const initPhrase = (site.typewriterPhrases && site.typewriterPhrases[0]) || '随便写点，留给自己';

  const polaroids = (site.polaroids && site.polaroids.length ? site.polaroids : [
    { src: 'uploads/window-sunlight.svg', caption: '午后窗台' },
    { src: 'uploads/desk-notebook.svg', caption: '桌面一角' },
    { src: 'uploads/evening-dusk.svg', caption: '傍晚散步' },
  ]).slice(0, 3);

  const featuredHtml = featuredPost
    ? `
    <a href="posts/${featuredPost.slug}.html" class="featured-lead-card ${featuredPost.cover ? '' : 'no-cover'} reveal-on-scroll" ${featuredPost.private ? 'data-private="1"' : ''} data-spotlight data-tilt>
      <span class="holo-glare"></span>
      ${
        featuredPost.cover
          ? `<div class="featured-cover-wrap"><img src="${escapeHtml(resolveImg(featuredPost.cover, ''))}" alt="${escapeHtml(featuredPost.title)}" /></div>`
          : ''
      }
      <div>
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
          <span class="cat-chip">置顶</span>
          <span class="${categoryChipClass(featuredPost.category)}">${escapeHtml(featuredPost.category)}</span>
          ${renderPrivBadge(featuredPost.private)}
          <span class="font-mono-num" style="font-size:12px; color:var(--ink-muted);">${escapeHtml(formatDotDate(featuredPost.date))}</span>
        </div>
        <h2 class="font-serif-cn" style="font-size:23px; font-weight:700; line-height:1.42; margin:0 0 10px;">${escapeHtml(featuredPost.title)}</h2>
        <p style="font-size:14.2px; line-height:1.8; color:var(--ink-secondary); margin:0 0 16px;">${escapeHtml(featuredPost.summary)}</p>
        <span style="font-size:13px; font-weight:600; color:var(--accent); display:inline-flex; align-items:center; gap:5px;">阅读全文 ${ICO.arrowUpRight}</span>
      </div>
    </a>`
    : '';

  const listToRender = gridPosts.length ? gridPosts : posts;
  const activeHeatDays = heatCells.filter(c => c.level > 0).length;

  const authorName = site.author || site.title || '自留地';
  const handle = site.handle || 'ziliudi';
  const avatarSrc = resolveImg(site.avatar || 'uploads/avatar-default.svg', '');
  const locText = site.location || '';

  const bodyHtml = `
  <main class="container-main">
    <section class="hero-stage">
      <div>
        <!-- GitHub-Style Avatar & Identity Strip -->
        <div class="hero-gh-identity">
          <div class="hero-gh-avatar-ring">
            <a href="about.html" class="hero-gh-avatar-link" title="查看个人主页">
              <img data-live-avatar src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(authorName)}" />
            </a>
            ${localDev ? `<button type="button" class="hero-avatar-cam" data-avatar-upload data-owner-only="1" title="更换头像">${ICO.camera}</button>` : ''}
            <button type="button" id="hero-status-trigger" class="hero-gh-status-dot" title="打开极客终端">
              <span class="pulse-dot"></span>
            </button>
          </div>

          <div class="hero-gh-meta">
            <div class="hero-gh-name-line">
              <a href="about.html" class="hero-gh-name">${escapeHtml(authorName)}</a>
              <a href="about.html" class="hero-gh-handle font-mono-num">@${escapeHtml(handle)}</a>
              <span class="hero-gh-loc" ${localDev ? 'data-relocate-btn title="自动定位所在省市 · 点击刷新定位" style="cursor:pointer;"' : ''} style="${!localDev && !locText ? 'display:none;' : ''}">${ICO.pin}<span data-live-location>${escapeHtml(locText || '正在定位…')}</span></span>
            </div>
            <div class="hero-gh-tw-line">
              <span id="hero-typewriter">${escapeHtml(initPhrase)}</span><span class="tw-caret"></span>
            </div>
          </div>
        </div>

        <h1 class="hero-title font-serif-cn">
          ${escapeHtml(site.heroHeadline || '欢迎闯入')}<br />
          <span class="hero-hand-wrap" data-scramble="${escapeHtml(site.heroHeadlineAccent || '我的自留地')}">
            <span class="scramble-text">${escapeHtml(site.heroHeadlineAccent || '我的自留地')}</span>
            <svg class="hand-underline-svg" viewBox="0 0 260 14" preserveAspectRatio="none">
              <path class="hand-underline-path" d="M3 9 C70 3, 180 13, 257 6" />
            </svg>
          </span>
        </h1>
        ${site.heroIntro ? `<p class="hero-desc">${escapeHtml(site.heroIntro)}</p>` : ''}

        <div class="hero-stats-and-fortune">
          <div class="hero-quick-stats font-mono-num">
            <span><strong id="hero-stat-posts" data-owner="${posts.length}" data-public="${publicPostsCount}" data-countup="${posts.length}">${posts.length}</strong> 篇</span>
            <span>/</span>
            <span><strong id="hero-stat-moments" data-owner="${(moments || []).length}" data-public="${publicMomentsCount}" data-countup="${(moments || []).length}">${(moments || []).length}</strong> 动态</span>
            <span>/</span>
            <span><strong data-countup="${(shelf || []).length}">${(shelf || []).length}</strong> 珍藏</span>
            <span>/</span>
            <span><strong data-countup="${runningDays}">${runningDays}</strong> DAYS</span>
          </div>

          <button type="button" id="cyber-fortune-btn" class="cyber-fortune-pill" title="点击抽一签">
            ${ICO.dice}
            <span id="fortune-text">今日宜 · 深夜造物</span>
          </button>
        </div>
      </div>

      <div id="polaroid-deck" class="polaroid-deck-wrap">
        ${localDev ? `<button type="button" id="polaroid-upload-btn" class="polaroid-cam-btn" data-owner-only="1">${ICO.image} 换图</button>` : ''}
        ${polaroids
          .map(
            (p, i) => `
          <div class="polaroid-card" data-pos="${i}" data-src="${escapeHtml(resolveImg(p.src, ''))}" data-caption="${escapeHtml(p.caption || '')}">
            <img src="${escapeHtml(resolveImg(p.src, ''))}" alt="${escapeHtml(p.caption || '')}" />
            <div class="polaroid-caption">
              <span>${escapeHtml(p.caption || '随手拍')}</span>
              <span class="font-mono-num" style="font-size:11px; opacity:0.6;">0${i + 1}</span>
            </div>
          </div>`
          )
          .join('')}
      </div>
    </section>

    <section class="bento-widgets-strip">
      <!-- Widget 1: Heatmap -->
      <div class="bento-widget bento-tint-mint" data-spotlight data-tilt>
        <span class="holo-glare"></span>
        <div>
          <div class="widget-head">
            <span class="widget-head-title">${ICO.grid}<span>创作频谱</span></span>
            <a href="archive.html" style="color:var(--c-emerald);">纪事 →</a>
          </div>
          <div class="heatmap-grid">
            ${heatCells
              .map(
                c =>
                  `<span class="heat-cell" data-level="${c.level}" ${c.priv ? 'data-priv-cell="1"' : ''} data-tip="${escapeHtml(c.tip)}" ${
                    c.url ? `data-href="${escapeHtml(c.url)}"` : ''
                  }></span>`
              )
              .join('')}
          </div>
        </div>
        <div id="heat-caption" class="heat-caption font-mono-num" data-default-cap="6 WEEKS · ${activeHeatDays} ACTIVE DAYS">6 WEEKS · ${activeHeatDays} ACTIVE DAYS</div>
      </div>

      <!-- Widget 2: Latest Moment -->
      <div class="bento-widget bento-tint-rose" data-spotlight data-tilt>
        <span class="holo-glare"></span>
        <div class="widget-head">
          <span class="widget-head-title">${ICO.spark}<span>即时切片</span></span>
          <button type="button" id="moment-flip-btn" class="thought-next-btn">${ICO.refresh}<span>换一条</span></button>
        </div>
        <div id="moment-mini-body" class="moment-mini-text">${escapeHtml(firstMoment.content)}</div>
        <div class="moment-mini-foot">
          <span id="moment-mini-meta" class="font-mono-num">#${escapeHtml(firstMoment.mood || '日常')} · ${escapeHtml(firstMoment.date)}</span>
          <a href="moments.html" style="color:var(--c-rose); font-weight:600;">朝夕 →</a>
        </div>
      </div>

      <!-- Widget 3: Interactive Spinning Vinyl Turntable + Web Audio Synth + Live Rainbow Spectrum -->
      <div id="vinyl-widget" class="bento-widget vinyl-bento-card bento-tint-violet" data-spotlight data-tilt>
        <span class="holo-glare"></span>
        <canvas id="vinyl-wave" class="vinyl-wave-canvas" width="280" height="44"></canvas>
        <div class="widget-head" style="margin-bottom:8px;">
          <span class="widget-head-title">${ICO.disc}<span>SYNTH · 电台</span></span>
          <div class="eq-bars" id="vinyl-eq">
            <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
          </div>
        </div>

        <div class="vinyl-stage">
          <div class="vinyl-platter-wrap" id="vinyl-play-disc" title="点击播放 / 暂停">
            <div id="vinyl-disc" class="vinyl-disc">
              <div class="vinyl-grooves"></div>
              <div class="vinyl-label"><span class="vinyl-label-mark">A</span></div>
            </div>
            <div class="vinyl-sheen"></div>
            <div id="vinyl-arm" class="vinyl-arm"></div>
          </div>

          <div style="min-width:0; flex:1;">
            <div style="display:flex; align-items:center; justify-content:space-between; gap:6px;">
              <div id="vinyl-track-name" class="font-serif-cn" style="font-size:14.5px; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">01 · 夜雨黑胶</div>
              <div class="vinyl-track-dots font-mono-num">
                <button type="button" class="v-dot active" data-vinyl-idx="0">1</button>
                <button type="button" class="v-dot" data-vinyl-idx="1">2</button>
                <button type="button" class="v-dot" data-vinyl-idx="2">3</button>
              </div>
            </div>
            <div id="vinyl-track-sub" class="font-mono-num" style="font-size:11px; color:var(--ink-muted); margin-top:2px;">LO-FI RAIN · 33⅓ RPM</div>
            <div style="display:flex; align-items:center; gap:6px; margin-top:10px;">
              <button type="button" id="vinyl-toggle-btn" class="vinyl-ctrl-btn primary" title="播放 / 暂停">
                <span id="vinyl-ico-play">${ICO.play}</span>
                <span id="vinyl-ico-pause" style="display:none;">${ICO.pause}</span>
                <span id="vinyl-btn-txt">播放</span>
              </button>
              <button type="button" id="vinyl-next-btn" class="vinyl-ctrl-btn" title="切换曲目">${ICO.skip}</button>
              <button type="button" class="vinyl-ctrl-btn" data-random-walk title="随机漫游一篇">${ICO.compass}</button>
            </div>
            <!-- Playable 6-Note Pentatonic Rainbow Synth Keys -->
            <div id="vinyl-piano" class="vinyl-piano font-mono-num" title="点击或划过弹奏五声音阶">
              <button type="button" data-note-hz="523.25" style="--kc:#FF5E5B;">C</button>
              <button type="button" data-note-hz="587.33" style="--kc:#F59E0B;">D</button>
              <button type="button" data-note-hz="659.25" style="--kc:#10B981;">E</button>
              <button type="button" data-note-hz="783.99" style="--kc:#06B6D4;">G</button>
              <button type="button" data-note-hz="880.00" style="--kc:#6366F1;">A</button>
              <button type="button" data-note-hz="1046.50" style="--kc:#EC4899;">C'</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    ${featuredHtml}

    <div class="filter-header">
      <div class="filter-tabs">
        <button type="button" class="filter-tab active" data-filter-cat="all">全部</button>
        ${allCats
          .map(c => {
            const purePriv = isCategoryPurelyPrivate(c, posts);
            return `<button type="button" class="filter-tab" data-filter-cat="${escapeHtml(c)}" ${purePriv ? 'data-private="1"' : ''}>${escapeHtml(c)}</button>`;
          })
          .join('')}
      </div>
      <span id="home-post-count" class="font-mono-num" style="font-size:12px; color:var(--ink-muted);">${listToRender.length} POSTS</span>
    </div>

    <section class="editorial-grid">
      ${listToRender
        .map(
          (p, idx) => `
        <article class="post-card reveal-on-scroll" data-spotlight data-tilt data-cat="${escapeHtml(p.category)}" ${p.private ? 'data-private="1"' : ''} style="transition-delay:${Math.min(idx * 50, 200)}ms;">
          <span class="holo-glare"></span>
          <a href="posts/${p.slug}.html" style="display:flex; flex-direction:column; height:100%; justify-content:space-between; position:relative; z-index:1;">
            <div>
              ${
                p.cover
                  ? `<div class="post-card-cover"><img src="${escapeHtml(resolveImg(p.cover, ''))}" alt="${escapeHtml(p.title)}" loading="lazy" /></div>`
                  : ''
              }
              <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:11px;">
                <div style="display:flex; align-items:center; gap:7px; flex-wrap:wrap; font-size:12px; color:var(--ink-muted);">
                  <span class="${categoryChipClass(p.category)}">${escapeHtml(p.category)}</span>
                  ${renderPrivBadge(p.private)}
                  <span class="font-mono-num">${escapeHtml(formatDotDate(p.date))}</span>
                </div>
                <span class="card-orb-arrow">${ICO.arrowUpRight}</span>
              </div>
              <h3 class="card-title font-serif-cn">${escapeHtml(p.title)}</h3>
              <p class="card-excerpt">${escapeHtml(p.summary)}</p>
            </div>
            <div class="card-bottom-bar">
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                ${
                  p.tags && p.tags.length
                    ? p.tags.map(t => `<span>#${escapeHtml(t)}</span>`).join('')
                    : `<span class="font-mono-num">${p.readingMinutes} min</span>`
                }
              </div>
              <span class="font-mono-num">${p.wordCount} 字</span>
            </div>
          </a>
        </article>`
        )
        .join('')}
      <div id="home-empty-hint" class="empty-filter-hint" style="display:none;">暂无该分类下的公开内容</div>
    </section>
  </main>`;

  return renderLayout({
    title: '',
    site,
    activeNav: 'home',
    rootPrefix: '',
    bodyHtml,
    postsForSearch: posts,
    moments,
    shelf,
    localDev,
  });
}

// 2. Moments Page (/moments.html — With Zero-Jump Inline Flomo Composer & Custom Past/Future Time!)
function renderMomentsPage({ site, posts, moments: rawMoments, shelf, localDev }) {
  const list = sortMomentsDesc(rawMoments);
  const nav = getNavLabels(site);

  const inlineComposerHtml = localDev
    ? `
    <section id="inline-composer" class="inline-composer" data-owner-only="1">
      <textarea id="ic-content" class="composer-textarea" placeholder="记录当下…"></textarea>
      <div id="ic-thumbs" class="thumb-strip"></div>
      <div id="ic-loc-drawer" class="ic-loc-drawer">
        <span style="color:var(--accent); display:inline-flex; flex-shrink:0;">${ICO.pin}</span>
        <input id="ic-location" type="text" placeholder="手动输入地点（如：徐州 · 云龙湖 / 街角咖啡馆），或点右侧自动获取…" />
        <button type="button" id="ic-loc-auto" class="ic-loc-act-btn">自动获取</button>
        <button type="button" id="ic-loc-clear" class="ui-clear-btn visible" title="清除地点">×</button>
      </div>
      <div class="composer-toolbar">
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <button type="button" id="ic-add-img" class="pill-action-btn" style="height:30px; font-size:12px; color:var(--accent); border-color:var(--accent);">
            ${ICO.image}<span>图片</span>
          </button>
          <button type="button" class="mood-chip-btn active" data-ic-mood="日常">#日常</button>
          <button type="button" class="mood-chip-btn" data-ic-mood="周末">#周末</button>
          <button type="button" class="mood-chip-btn" data-ic-mood="碎碎念">#碎碎念</button>
          <button type="button" class="mood-chip-btn" data-ic-mood="随手拍">#随手拍</button>
          <button type="button" id="ic-loc-btn" class="pill-action-btn ic-auto-loc-btn" style="height:30px; padding:0 11px; font-size:12px;" title="添加所在地点（支持自动定位或手动输入）">
            ${ICO.pin}<span id="ic-loc-label">位置</span>
          </button>
          <div id="ic-time-wrap" class="ic-time-pill" title="默认使用发布当下时间，点击可往前补记或往后定时">
            <button type="button" id="ic-time-trigger" class="ic-time-trigger">
              ${ICO.calendar}
              <span id="ic-time-label" class="font-mono-num">发布时间</span>
            </button>
            <input id="ic-datetime" type="datetime-local" class="ic-datetime-input font-mono-num" />
            <button type="button" id="ic-time-reset" class="ui-clear-btn" title="恢复默认发布时间">×</button>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:10px; margin-left:auto;">
          <label style="display:inline-flex; align-items:center; gap:5px; font-size:12px; color:var(--priv-ink); background:var(--priv-bg); padding:4px 10px; border-radius:999px; cursor:pointer; font-weight:600;">
            <input id="ic-private" type="checkbox" />
            <span>私密</span>
          </label>
          <button type="button" id="ic-submit" class="btn-primary" style="padding:6px 18px;">发布</button>
        </div>
      </div>
    </section>`
    : `
    <section class="archive-intro-box">
      <h1 class="font-serif-cn" style="margin:0;">${escapeHtml(nav.moments)}</h1>
    </section>`;

  const bodyHtml = `
  <main class="archive-wrap">
    ${inlineComposerHtml}

    <div id="moments-month-bar" class="wc-month-filter-bar" style="margin-bottom:18px;"></div>

    <section id="moments-stream" class="moments-stream">
      ${list
        .map((m, idx) => {
          const imgs = Array.isArray(m.images) ? m.images.filter(Boolean) : [];
          const notes = Array.isArray(m.notes) ? m.notes.filter(Boolean) : [];
          const dtVal = String(m.date || '').includes(' ')
            ? String(m.date).replace(' ', 'T').slice(0, 16)
            : `${String(m.date || '').slice(0, 10)}T12:00`;
          const ymKey = String(m.date || '').slice(0, 7) || '未知';
          const galleryHtml = imgs.length
            ? `<div class="moment-gallery" data-count="${Math.min(9, imgs.length)}">
                ${imgs
                  .slice(0, 9)
                  .map(
                    src => `
                  <div class="moment-photo-item">
                    <img src="${escapeHtml(resolveImg(src, ''))}" alt="${escapeHtml(m.mood || '日常配图')}" data-zoomable />
                  </div>`
                  )
                  .join('')}
              </div>`
            : '';

          const notesHtml = `
            <div class="moment-notes-box" data-notes-for="${escapeHtml(m.id)}" style="${notes.length ? '' : 'display:none;'}">
              ${notes.map(n => `<div><strong style="color:var(--accent); font-weight:600;">追记：</strong>${escapeHtml(n)}</div>`).join('')}
            </div>`;

          return `
        <article class="moment-card reveal-on-scroll" data-moment-card="${escapeHtml(m.id)}" data-moment-date="${escapeHtml(m.date || '')}" data-moment-ym="${escapeHtml(ymKey)}" ${m.private ? 'data-private="1"' : ''} style="transition-delay:${Math.min(idx * 45, 200)}ms;">
          <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; font-size:12px; color:var(--ink-muted); flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
              <span class="${categoryChipClass(m.mood || '日常')}">#${escapeHtml(m.mood || '日常')}</span>
              <span data-priv-slot="${escapeHtml(m.id)}">${renderPrivBadge(m.private)}</span>
              <span data-loc-slot="${escapeHtml(m.id)}">${
                m.location
                  ? `<span class="moment-loc-tag" ${localDev ? `data-loc-toggle="${escapeHtml(m.id)}" style="cursor:pointer;" title="点击修改或清除地点"` : ''}>${ICO.pin}<span>${escapeHtml(m.location)}</span></span>`
                  : ''
              }</span>
            </div>
            <div style="display:flex; align-items:center; gap:6px;">
              ${
                localDev
                  ? `<span data-owner-only="1" style="display:inline-flex; align-items:center; gap:2px;">
                      <button type="button" class="moment-quick-btn" data-reply-toggle="${escapeHtml(m.id)}">+ 追评</button>
                      <button type="button" class="moment-quick-btn" data-loc-toggle="${escapeHtml(m.id)}">地点</button>
                      <button type="button" class="moment-quick-btn" data-time-toggle="${escapeHtml(m.id)}">改时间</button>
                      <button type="button" class="moment-quick-btn" data-flip-priv="${escapeHtml(m.id)}">${m.private ? '设为公开' : '锁为私密'}</button>
                      <button type="button" class="moment-quick-btn" data-del-moment="${escapeHtml(m.id)}">删除</button>
                    </span>`
                  : ''
              }
              <time class="font-mono-num" ${localDev ? `data-time-toggle="${escapeHtml(m.id)}" style="cursor:pointer;" title="点击调整发布时间"` : ''}>${escapeHtml(m.date)}</time>
            </div>
          </div>
          <p style="font-size:15px; line-height:1.85; margin:0 0 10px; color:var(--ink); white-space:pre-line;">${escapeHtml(m.content)}</p>
          ${galleryHtml}
          ${notesHtml}
          ${
            localDev
              ? `<div class="inline-reply-row" data-reply-box="${escapeHtml(m.id)}" data-owner-only="1">
                  <input type="text" class="studio-input" style="flex:1; padding:6px 12px; border-radius:999px;" placeholder="追记…" />
                  <button type="button" class="btn-primary" data-reply-send="${escapeHtml(m.id)}" style="padding:5px 14px; font-size:12px;">发送</button>
                </div>
                <div class="inline-reply-row" data-loc-box="${escapeHtml(m.id)}" data-owner-only="1">
                  <input type="text" class="studio-input" style="flex:1; padding:6px 12px; border-radius:999px;" value="${escapeHtml(m.location || '')}" placeholder="手动输入地点，留空可清除…" />
                  <button type="button" class="ic-loc-act-btn" data-loc-auto="${escapeHtml(m.id)}" style="height:30px; padding:0 11px;">自动获取</button>
                  <button type="button" class="btn-primary" data-loc-save="${escapeHtml(m.id)}" style="padding:5px 14px; font-size:12px;">保存地点</button>
                </div>
                <div class="inline-reply-row" data-time-box="${escapeHtml(m.id)}" data-owner-only="1">
                  <input type="datetime-local" class="studio-input font-mono-num" style="flex:0 1 220px; height:34px; padding:0 12px; border-radius:999px;" value="${escapeHtml(dtVal)}" />
                  <button type="button" class="btn-primary" data-time-save="${escapeHtml(m.id)}" style="padding:5px 14px; font-size:12px;">保存时间</button>
                </div>`
              : ''
          }
          <div style="display:flex; justify-content:flex-end; margin-top:8px;">
            <button type="button" class="applause-btn" data-moment-id="${escapeHtml(m.id)}" data-base-likes="${m.likes || 0}">
              ${ICO.heart}
              <span class="like-count font-mono-num">${m.likes || 0}</span>
            </button>
          </div>
        </article>`;
        })
        .join('')}
    </section>
  </main>`;

  return renderLayout({
    title: nav.moments,
    site,
    activeNav: 'moments',
    rootPrefix: '',
    bodyHtml,
    postsForSearch: posts,
    moments: list,
    shelf,
    localDev,
  });
}

// 3. Archive Page (/archive.html — WeChat Moments Style Year + Monthly Grouping!)
function renderArchivePage({ site, posts, moments, shelf, localDev }) {
  const nav = getNavLabels(site);
  const allCats = Array.from(new Set([...(site.categories || []), ...posts.map(p => p.category).filter(Boolean)]));
  const publicPostsCount = posts.filter(p => !p.private).length;

  const byYear = {};
  const ymSet = new Set();
  for (const p of posts) {
    const year = String(p.date || '').slice(0, 4) || '更早';
    const ym = String(p.date || '').slice(0, 7);
    if (ym) ymSet.add(ym);
    if (!byYear[year]) byYear[year] = [];
    byYear[year].push(p);
  }
  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));
  const sortedYms = Array.from(ymSet).sort((a, b) => b.localeCompare(a));
  const multiYear = years.length > 1;

  const bodyHtml = `
  <main class="archive-wrap">
    <section class="archive-intro-box">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
        <h1 class="font-serif-cn" style="margin:0;">${escapeHtml(nav.archive)}</h1>
        ${localDev ? `<a href="studio.html" data-owner-only="1" class="edit-pill-btn">${ICO.pen}<span>写新篇</span></a>` : ''}
      </div>
      ${site.archiveBio ? `<p>${escapeHtml(site.archiveBio)}</p>` : ''}
      <div class="archive-pills">
        <button type="button" class="archive-pill active" data-archive-cat="all" data-owner-text="全部 (${posts.length})" data-public-text="全部 (${publicPostsCount})">全部 (${posts.length})</button>
        ${allCats
          .map(c => {
            const cnt = posts.filter(p => p.category === c).length;
            const pubCnt = posts.filter(p => p.category === c && !p.private).length;
            const purePriv = isCategoryPurelyPrivate(c, posts);
            return `<button type="button" class="archive-pill" data-archive-cat="${escapeHtml(c)}" ${purePriv ? 'data-private="1"' : ''} data-owner-text="${escapeHtml(c)} (${cnt})" data-public-text="${escapeHtml(c)} (${pubCnt})">${escapeHtml(c)} (${cnt})</button>`;
          })
          .join('')}
      </div>
      ${
        sortedYms.length
          ? `<div class="wc-month-filter-bar" style="margin-top:12px; padding-top:12px; border-top:1px dashed var(--line);">
              <button type="button" class="wc-month-chip active" data-archive-ym="all">全部月份</button>
              ${sortedYms
                .map(ym => {
                  const [y, m] = ym.split('-');
                  const inYm = posts.filter(p => String(p.date || '').slice(0, 7) === ym);
                  const purePrivYm = inYm.length > 0 && inYm.every(p => p.private);
                  const label = multiYear ? `${y} · ${Number(m)}月` : `${Number(m)}月`;
                  return `<button type="button" class="wc-month-chip font-mono-num" data-archive-ym="${escapeHtml(ym)}" ${purePrivYm ? 'data-private="1"' : ''}>${escapeHtml(label)}</button>`;
                })
                .join('')}
            </div>`
          : ''
      }
    </section>

    ${years
      .map(yr => {
        const yrPosts = byYear[yr];
        const byMonth = {};
        for (const p of yrPosts) {
          const mon = String(p.date || '').slice(5, 7) || '01';
          if (!byMonth[mon]) byMonth[mon] = [];
          byMonth[mon].push(p);
        }
        const months = Object.keys(byMonth).sort((a, b) => b.localeCompare(a));

        return `
      <section class="year-split-block year-group reveal-on-scroll">
        <div class="year-label-col">
          <div class="year-big-num font-serif-cn">${escapeHtml(yr)}</div>
          <div class="year-count-note" data-owner-text="${yrPosts.length} 篇记录" data-public-text="${yrPosts.filter(p => !p.private).length} 篇记录">${yrPosts.length} 篇记录</div>
        </div>
        <div class="year-months-col">
          ${months
            .map(mon => {
              const ymKey = `${yr}-${mon}`;
              const monPosts = byMonth[mon];
              const purePrivMon = monPosts.length > 0 && monPosts.every(p => p.private);
              return `
            <div class="wc-month-group month-group" data-ym="${escapeHtml(ymKey)}" ${purePrivMon ? 'data-private="1"' : ''}>
              <div class="wc-month-gutter">
                <div class="wc-month-badge">
                  <span class="wc-month-num font-serif-cn">${Number(mon)}</span><span class="wc-month-unit">月</span>
                </div>
                <span class="wc-month-spine"></span>
              </div>
              <div class="wc-month-entries">
                ${monPosts
                  .map(
                    p => `
                  <article class="timeline-item" data-cat="${escapeHtml(p.category)}" data-ym="${escapeHtml(ymKey)}" ${p.private ? 'data-private="1"' : ''}>
                    <a href="posts/${p.slug}.html" class="timeline-row-card">
                      <div class="timeline-row-head">
                        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                          <h3 class="timeline-row-title font-serif-cn">${escapeHtml(p.title)}</h3>
                          ${renderPrivBadge(p.private)}
                        </div>
                        <time class="timeline-row-date font-mono-num">${escapeHtml(formatDayOnly(p.date))}</time>
                      </div>
                      <p class="timeline-row-excerpt">${escapeHtml(p.summary)}</p>
                      <div class="timeline-row-meta">#${escapeHtml(p.category)} · ${p.wordCount} 字</div>
                    </a>
                  </article>`
                  )
                  .join('')}
              </div>
            </div>`;
            })
            .join('')}
        </div>
      </section>`;
      })
      .join('')}
  </main>`;

  return renderLayout({
    title: nav.archive,
    site,
    activeNav: 'archive',
    rootPrefix: '',
    bodyHtml,
    postsForSearch: posts,
    moments,
    shelf,
    localDev,
  });
}

// 4. Collection Page (/shelf.html)
function renderShelfPage({ site, posts, moments, shelf, localDev }) {
  const nav = getNavLabels(site);
  const items = shelf || [];
  const types = Array.from(new Set(['影视', '书籍', '游戏', '好物', ...items.map(i => i.type).filter(Boolean)]));

  const bodyHtml = `
  <main class="container-main" style="padding-top:34px; padding-bottom:80px;">
    <section class="archive-intro-box">
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:14px;">
        <h1 class="font-serif-cn" style="margin:0;">${escapeHtml(nav.shelf)}</h1>
        ${localDev ? `<button type="button" id="open-shelf-modal" data-owner-only="1" class="edit-pill-btn" style="border:none;cursor:pointer;">${ICO.plus}<span>新增</span></button>` : ''}
      </div>
      <div class="archive-pills">
        <button type="button" class="archive-pill active" data-shelf-type="all">全部 (${items.length})</button>
        ${types
          .map(t => {
            const cnt = items.filter(i => i.type === t).length;
            return cnt > 0
              ? `<button type="button" class="archive-pill" data-shelf-type="${escapeHtml(t)}">${escapeHtml(t)} (${cnt})</button>`
              : '';
          })
          .join('')}
      </div>
    </section>

    <section id="shelf-grid" class="shelf-grid">
      ${items
        .map(
          (item, idx) => `
        <article class="shelf-card reveal-on-scroll" data-shelf-card="${escapeHtml(item.id)}" data-spotlight data-tilt data-shelf-item="${escapeHtml(item.type)}" style="transition-delay:${Math.min(idx * 50, 200)}ms;">
          <span class="holo-glare"></span>
          <div class="artifact-cover tone-bg-${escapeHtml(item.tone || 'terracotta')}">
            ${
              item.cover
                ? `<img src="${escapeHtml(resolveImg(item.cover, ''))}" alt="${escapeHtml(item.title)}" data-zoomable />`
                : `<span style="font-size:10px; opacity:0.8; padding-left:4px;">${escapeHtml(item.type)}</span>
                   <span class="font-serif-cn" style="font-size:21px; font-weight:700; padding-left:4px;">${escapeHtml(String(item.title || '').slice(0, 2))}</span>`
            }
          </div>
          <div>
            <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
              <span class="${categoryChipClass(item.type)}">${escapeHtml(item.status || '看过')} · ${escapeHtml(item.type)}</span>
              <div style="display:flex; align-items:center; gap:6px;">
                ${localDev ? `<button type="button" class="moment-quick-btn" data-owner-only="1" data-del-shelf="${escapeHtml(item.id)}">删除</button>` : ''}
                <span class="stars-row">${'★'.repeat(item.rating || 5)}${'☆'.repeat(Math.max(0, 5 - (item.rating || 5)))}</span>
              </div>
            </div>
            <h3 class="font-serif-cn" style="font-size:18px; font-weight:700; margin:0 0 4px;">${escapeHtml(item.title)}</h3>
            <div style="font-size:12px; color:var(--ink-muted); margin-bottom:10px;">${escapeHtml(item.creator || '')}</div>
            <p style="font-size:13.8px; line-height:1.75; color:var(--ink-secondary); margin:0;">${escapeHtml(item.comment || '')}</p>
          </div>
        </article>`
        )
        .join('')}
    </section>

    ${
      localDev
        ? `<div id="quick-shelf-modal" class="modal-backdrop">
            <div class="modal-box">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px;">
                <strong class="font-serif-cn" style="font-size:18px;">新增收藏</strong>
                <button type="button" id="close-shelf-modal" class="btn-secondary" style="padding:4px 12px;">关闭</button>
              </div>
              <div style="display:grid; gap:10px;">
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                  <select id="qs-type" class="studio-input">
                    <option value="影视">影视</option>
                    <option value="书籍">书籍</option>
                    <option value="游戏">游戏</option>
                    <option value="好物">好物</option>
                  </select>
                  <select id="qs-status" class="studio-input">
                    <option value="看过">看过</option>
                    <option value="在看">在看</option>
                    <option value="玩过">玩过</option>
                    <option value="常用">常用</option>
                  </select>
                </div>
                <input id="qs-title" class="studio-input" placeholder="名称" />
                <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
                  <input id="qs-creator" class="studio-input" style="flex:1;" placeholder="作者 / 导演 / 年份" />
                  <div id="qs-stars" data-rating="5" title="点击选星级">
                    <button type="button" class="star-picker-btn" data-star="1">★</button>
                    <button type="button" class="star-picker-btn" data-star="2">★</button>
                    <button type="button" class="star-picker-btn" data-star="3">★</button>
                    <button type="button" class="star-picker-btn" data-star="4">★</button>
                    <button type="button" class="star-picker-btn" data-star="5">★</button>
                  </div>
                </div>
                <div style="display:flex; gap:8px;">
                  <input id="qs-cover" class="studio-input" style="flex:1;" placeholder="封面链接" />
                  <button type="button" id="qs-upload-btn" class="btn-secondary">${ICO.image} 上传</button>
                </div>
                <textarea id="qs-comment" rows="3" class="studio-input" placeholder="短评…"></textarea>
                <div style="display:flex; justify-content:flex-end;">
                  <button type="button" id="qs-save-btn" class="btn-primary">保存</button>
                </div>
              </div>
            </div>
          </div>`
        : ''
    }
  </main>`;

  return renderLayout({
    title: nav.shelf,
    site,
    activeNav: 'shelf',
    rootPrefix: '',
    bodyHtml,
    postsForSearch: posts,
    moments,
    shelf,
    localDev,
  });
}

// 5. Article / Diary Reading Page
function renderPostPage({ site, post, prevPost, nextPost, allPosts, moments, shelf, localDev }) {
  const tocHtml =
    post.headings && post.headings.length > 0
      ? `
      <aside class="margin-toc">
        <div class="margin-toc-inner">
          <span id="toc-marker" class="toc-active-marker"></span>
          <div class="margin-toc-title">本文目录</div>
          ${post.headings
            .map(
              h =>
                `<a href="#${h.id}" class="${h.level === 3 ? 'toc-h3' : ''}">${escapeHtml(h.text)}</a>`
            )
            .join('')}
        </div>
      </aside>`
      : '';

  const bodyHtml = `
  <div class="article-stage" data-post-slug="${escapeHtml(post.slug)}" ${post.private ? 'data-private="1"' : ''}>
    <article id="article-paper" class="article-paper">
      <div class="article-top-actions">
        <a href="../archive.html" class="back-btn-inline">${ICO.arrowLeft}<span>返回文章列表</span></a>
        <div style="display:flex; align-items:center; gap:8px;">
          <button type="button" id="article-poster-btn" class="pill-action-btn" style="height:28px; padding:0 10px; font-size:11.5px;" data-post-summary="${escapeHtml(post.summary || '')}" data-post-date="${escapeHtml(formatDotDate(post.date))}" title="生成分享金句海报">${ICO.poster}<span>金句卡</span></button>
          <button type="button" id="font-size-toggle" class="pill-action-btn" style="height:28px; padding:0 10px; font-size:11.5px;" title="切换阅读字号">A+ 大字阅读</button>
          ${
            localDev
              ? `<a href="../studio.html?slug=${encodeURIComponent(post.slug)}" data-owner-only="1" class="edit-pill-btn">${ICO.pen}<span>编辑本文</span></a>`
              : ''
          }
        </div>
      </div>

      <header class="article-head-block">
        <div style="display:flex; align-items:center; gap:9px; flex-wrap:wrap; font-size:12.5px; color:var(--ink-muted);">
          <a href="../about.html" class="article-author-chip">
            <img data-live-avatar src="${escapeHtml(resolveImg(site.avatar || 'uploads/avatar-default.svg', '../'))}" alt="" />
            <span>${escapeHtml(site.author || site.title)}</span>
          </a>
          <span>·</span>
          <span class="${categoryChipClass(post.category)}">${escapeHtml(post.category)}</span>
          ${renderPrivBadge(post.private)}
          <span class="font-mono-num">${escapeHtml(formatDotDate(post.date))}</span>
          <span>·</span>
          <span class="font-mono-num">${post.wordCount} 字 · ${post.readingMinutes} min</span>
        </div>
        <h1 class="article-main-title font-serif-cn">${escapeHtml(post.title)}</h1>
      </header>

      <div class="prose">
        ${post.html}
      </div>

      ${
        post.tags && post.tags.length
          ? `<div style="margin-top:28px; display:flex; gap:10px; flex-wrap:wrap; font-size:12.5px; color:var(--ink-muted);">
              ${post.tags.map(t => `<span>#${escapeHtml(t)}</span>`).join('')}
            </div>`
          : ''
      }

      <div class="article-end-seal font-mono-num">✦ EOF ✦</div>

      <nav class="prev-next-grid">
        <div>
          ${
            prevPost
              ? `<a href="${prevPost.slug}.html" class="pn-card" ${prevPost.private ? 'data-private="1"' : ''}>
                  <div class="pn-hint">← 上一篇</div>
                  <div class="pn-title font-serif-cn">${escapeHtml(prevPost.title)}</div>
                </a>`
              : ''
          }
        </div>
        <div>
          ${
            nextPost
              ? `<a href="${nextPost.slug}.html" class="pn-card" style="text-align:right;" ${nextPost.private ? 'data-private="1"' : ''}>
                  <div class="pn-hint">下一篇 →</div>
                  <div class="pn-title font-serif-cn">${escapeHtml(nextPost.title)}</div>
                </a>`
              : ''
          }
        </div>
      </nav>
    </article>

    ${tocHtml}
  </div>`;

  return renderLayout({
    title: post.title,
    readingTitle: post.title,
    site,
    activeNav: '',
    rootPrefix: '../',
    bodyHtml,
    postsForSearch: allPosts,
    moments,
    shelf,
    localDev,
  });
}

function buildGithubContribData(posts, moments, weeks = 45) {
  const map = {};
  (posts || []).forEach(p => {
    const d = String(p.date || '').slice(0, 10);
    if (!d) return;
    if (!map[d]) map[d] = { count: 0, pubCount: 0, label: p.title, url: `posts/${p.slug}.html`, priv: Boolean(p.private) };
    map[d].count += 2;
    if (!p.private) map[d].pubCount += 2;
  });
  (moments || []).forEach(m => {
    const d = String(m.date || '').slice(0, 10);
    if (!d) return;
    if (!map[d]) map[d] = { count: 0, pubCount: 0, label: `日常：${m.content.slice(0, 16)}…`, url: 'moments.html', priv: Boolean(m.private) };
    map[d].count += 1;
    if (!m.private) map[d].pubCount += 1;
  });

  const anchor = posts[0]?.date ? new Date(posts[0].date + 'T12:00:00') : new Date();
  const today = isNaN(anchor.getTime()) ? new Date() : anchor;
  const dayOfWeek = today.getDay(); // 0=Sun..6=Sat
  const endSat = new Date(today.getTime() + (6 - dayOfWeek) * 86400000);
  const totalDays = weeks * 7;

  const cells = [];
  const rawMonths = [];
  let lastMonth = -1;

  for (let i = totalDays - 1; i >= 0; i--) {
    const dt = new Date(endSat.getTime() - i * 86400000);
    const colIdx = Math.floor((totalDays - 1 - i) / 7);
    const rowIdx = (totalDays - 1 - i) % 7;
    if (rowIdx === 0) {
      const m = dt.getMonth() + 1;
      if (m !== lastMonth) {
        rawMonths.push({ col: colIdx, text: `${m}月` });
        lastMonth = m;
      }
    }
    const key = dt.toISOString().slice(0, 10);
    const rec = map[key];
    const isFuture = !rec && dt.getTime() > today.getTime() + 43200000;
    const cnt = rec ? rec.count : 0;
    const level = isFuture ? -1 : cnt >= 4 ? 4 : cnt >= 3 ? 3 : cnt >= 2 ? 2 : cnt >= 1 ? 1 : 0;
    const tip = isFuture ? key : rec ? `${key} · ${rec.label}` : `${key} · 无记录`;
    cells.push({
      key,
      level,
      tip,
      url: rec?.url || '',
      priv: Boolean(rec && rec.pubCount === 0 && rec.priv),
    });
  }

  // Prevent adjacent month label overlap at the left edge (same rule as GitHub)
  const monthLabels = rawMonths.filter((item, idx) => {
    const next = rawMonths[idx + 1];
    if (next && next.col - item.col < 3) return false;
    return true;
  });

  return { cells, monthLabels, weeks };
}

// 6. About Page — Authentic GitHub Profile Layout
function renderAboutPage({ site, posts, moments: rawMoments, shelf, localDev }) {
  const moments = sortMomentsDesc(rawMoments);
  const nav = getNavLabels(site);
  const { html } = renderMarkdown(site.aboutContent || '');
  const runningDays = calcRunningDays(site.startDate);
  const pubPosts = posts.filter(p => !p.private).length;
  const pubMoments = (moments || []).filter(m => !m.private).length;

  const authorName = site.author || site.title || '自留地';
  const handle = site.handle || 'ziliudi';
  const avatarSrc = resolveImg(site.avatar || 'uploads/avatar-default.svg', '');
  const statusText = site.statusText || (site.typewriterPhrases && site.typewriterPhrases[0]) || '在线';
  const locText = site.location || '';

  const pinnedPool = [
    ...posts.filter(p => p.featured),
    ...posts.filter(p => !p.featured),
  ].slice(0, 4);

  const contrib = buildGithubContribData(posts, moments, 42);
  const totalRecords = posts.length + (moments || []).length;
  const pubRecords = pubPosts + pubMoments;
  const allBadges = Array.from(new Set([...(site.categories || []).filter(c => !String(c).includes('私密')), 'Markdown', 'Zero-Dep', 'Web Audio']));

  // Recent Activity Feed (Chronological merge of latest posts + moments)
  const activityEvents = [
    ...posts.map(p => ({
      sortKey: String(p.date || ''),
      dateDisp: formatMonthDay(p.date),
      kind: 'post',
      badge: p.category || '文章',
      title: p.title,
      url: `posts/${p.slug}.html`,
      private: Boolean(p.private),
    })),
    ...(moments || []).map(m => ({
      sortKey: String(m.date || ''),
      dateDisp: formatMonthDay(String(m.date || '').slice(0, 10)),
      kind: 'moment',
      badge: m.mood || '日常',
      title: m.content.slice(0, 44) + (m.content.length > 44 ? '…' : ''),
      url: 'moments.html',
      private: Boolean(m.private),
    })),
  ]
    .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
    .slice(0, 5);

  const catDotColor = cat => {
    if (/造物|格物|技术|折腾|工具/.test(cat)) return '#F0523A';
    if (/随笔/.test(cat)) return '#4F6EF7';
    if (/私密|夜记/.test(cat)) return '#8B5CF6';
    if (/影视|书|收藏|珍藏/.test(cat)) return '#10B981';
    return '#EC4899';
  };

  const bodyHtml = `
  <main class="container-main gh-profile-stage">
    <div class="gh-profile-grid">
      <!-- Left Sticky GitHub Profile Sidebar -->
      <aside class="gh-sidebar">
        <div class="gh-avatar-stage">
          <div class="gh-avatar-circle" ${localDev ? 'data-avatar-upload title="点击更换头像"' : ''}>
            <img data-live-avatar src="${escapeHtml(avatarSrc)}" alt="${escapeHtml(authorName)}" ${localDev ? '' : 'data-zoomable'} />
            ${
              localDev
                ? `<div class="gh-avatar-hover-mask" data-owner-only="1">
                    ${ICO.camera}<span>更换头像</span>
                  </div>`
                : ''
            }
          </div>

          <button type="button" id="gh-status-pill" class="gh-status-bubble" ${localDev ? 'data-edit-status="1" title="点击修改状态签名"' : 'title="打开终端"'}>
            <span class="pulse-dot"></span>
            <span id="gh-status-text" class="gh-status-bubble-text">${escapeHtml(statusText)}</span>
          </button>

          ${
            localDev
              ? `<div id="gh-status-popover" class="gh-status-popover" data-owner-only="1">
                  <div style="display:flex; gap:6px;">
                    <input id="gh-status-input" type="text" class="studio-input" style="height:32px; font-size:12.5px; padding:0 10px;" value="${escapeHtml(statusText)}" placeholder="状态签名…" />
                    <button type="button" id="gh-status-save" class="btn-primary" style="padding:0 12px; height:32px; font-size:12px; flex-shrink:0;">保存</button>
                  </div>
                  <div class="gh-status-presets">
                    <button type="button" data-status-preset="深夜写码，白天补觉">深夜写码</button>
                    <button type="button" data-status-preset="正在折腾新玩具">折腾中</button>
                    <button type="button" data-status-preset="看闲书，慢半拍">看闲书</button>
                  </div>
                </div>`
              : ''
          }
        </div>

        <div class="gh-names-block">
          <h1 class="gh-fullname">${escapeHtml(authorName)}</h1>
          <div class="gh-username font-mono-num">@${escapeHtml(handle)}</div>
        </div>

        ${site.heroIntro ? `<p class="gh-bio">${escapeHtml(site.heroIntro)}</p>` : ''}

        ${
          localDev
            ? `<a href="studio.html?tab=settings" class="gh-action-btn" data-owner-only="1">编辑个人资料</a>`
            : `<button type="button" class="gh-action-btn" data-random-walk>随机漫游一篇</button>`
        }

        <div class="gh-meta-list">
          <div class="gh-meta-row">
            ${ICO.bookmark}
            <span data-owner-text="${posts.length} 篇 · ${(moments || []).length} 动态 · ${(shelf || []).length} 收藏" data-public-text="${pubPosts} 篇 · ${pubMoments} 动态 · ${(shelf || []).length} 收藏">${posts.length} 篇 · ${(moments || []).length} 动态 · ${(shelf || []).length} 收藏</span>
          </div>
          <div class="gh-meta-row" id="gh-loc-row" style="${!localDev && !locText ? 'display:none;' : ''}">
            ${ICO.pin}
            <span data-live-location>${escapeHtml(locText || '正在定位省市…')}</span>
            ${localDev ? `<button type="button" class="loc-refresh-inline" data-relocate-btn data-owner-only="1" title="重新自动定位当前所在省份与城市">${ICO.refresh}</button>` : ''}
          </div>
          <div class="gh-meta-row">
            ${ICO.calendar}
            <span>始于 <span class="font-mono-num">${escapeHtml(formatDotDate(site.startDate || '2026-10-01'))}</span> · <strong data-countup="${runningDays}">${runningDays}</strong> 天</span>
          </div>
        </div>

        <div class="gh-sidebar-divider"></div>

        <div>
          <div class="gh-sidebar-label font-mono-num">HIGHLIGHTS</div>
          <div class="gh-badge-cloud">
            ${allBadges.map(b => `<span class="gh-mini-badge">${escapeHtml(b)}</span>`).join('')}
          </div>
        </div>
      </aside>

      <!-- Right Main GitHub Column: README.md + Pinned + 45-Week Contribution Graph + Activity -->
      <div class="gh-main-col">
        <!-- 1. handle / README.md -->
        <section class="gh-readme-card">
          <div class="gh-readme-head">
            <span class="font-mono-num" style="font-size:12.5px; color:var(--ink-secondary);">${escapeHtml(handle)} / <strong style="color:var(--ink);">README.md</strong></span>
            ${localDev ? `<a href="studio.html?tab=settings" data-owner-only="1" class="gh-icon-link" title="编辑 README">${ICO.pen}</a>` : ''}
          </div>
          <div class="prose gh-readme-body">
            ${html}
          </div>
        </section>

        <!-- 2. Pinned Posts (2x2 GitHub Repo Card Grid) -->
        <section>
          <div class="gh-sec-header">
            <span class="gh-sec-title">Pinned</span>
            <a href="archive.html" class="font-mono-num gh-sec-more">全部文章 →</a>
          </div>
          <div class="gh-pinned-grid">
            ${pinnedPool
              .map(
                p => `
              <a href="posts/${p.slug}.html" class="gh-pin-card" ${p.private ? 'data-private="1"' : ''} data-spotlight data-tilt>
                <span class="holo-glare"></span>
                <div>
                  <div class="gh-pin-top">
                    <span class="gh-pin-title">${ICO.repo}<span>${escapeHtml(p.title)}</span></span>
                    <span class="gh-vis-pill ${p.private ? 'is-priv' : ''} font-mono-num">${p.private ? 'Private' : 'Public'}</span>
                  </div>
                  <p class="gh-pin-desc">${escapeHtml(p.summary)}</p>
                </div>
                <div class="gh-pin-foot font-mono-num">
                  <span style="display:inline-flex; align-items:center; gap:5px;">
                    <span class="gh-lang-dot" style="background:${catDotColor(p.category)};"></span>
                    <span>${escapeHtml(p.category)}</span>
                  </span>
                  <span>${p.wordCount} 字</span>
                  <span>${escapeHtml(formatMonthDay(p.date))}</span>
                </div>
              </a>`
              )
              .join('')}
          </div>
        </section>

        <!-- 3. Authentic 45-Week GitHub Contribution Calendar (11px Squares + Mon/Wed/Fri) -->
        <section class="gh-contrib-card">
          <div class="gh-contrib-head">
            <span class="gh-sec-title" data-owner-text="过去一年 ${totalRecords} 次创作记录" data-public-text="过去一年 ${pubRecords} 次创作记录">过去一年 ${totalRecords} 次创作记录</span>
            <span id="gh-contrib-tip" class="font-mono-num" style="font-size:11.5px; color:var(--ink-muted);">42 WEEKS</span>
          </div>

          <div class="gh-contrib-scroll">
            <div class="gh-cal-layout">
              <div class="gh-weekdays font-mono-num">
                <span></span>
                <span>Mon</span>
                <span></span>
                <span>Wed</span>
                <span></span>
                <span>Fri</span>
                <span></span>
              </div>
              <div style="flex:1; min-width:0;">
                <div class="gh-months-row font-mono-num" style="grid-template-columns:repeat(${contrib.weeks}, 1fr);">
                  ${contrib.monthLabels.map(m => `<span style="grid-column:${m.col + 1};">${escapeHtml(m.text)}</span>`).join('')}
                </div>
                <div class="gh-contrib-matrix" style="grid-template-columns:repeat(${contrib.weeks}, 1fr);">
                  ${contrib.cells
                    .map(c =>
                      c.level < 0
                        ? `<span class="gh-day is-future"></span>`
                        : `<span class="gh-day" data-level="${c.level}" ${c.priv ? 'data-priv-cell="1"' : ''} data-tip="${escapeHtml(c.tip)}" ${
                            c.url ? `data-href="${escapeHtml(c.url)}"` : ''
                          }></span>`
                    )
                    .join('')}
                </div>
              </div>
            </div>
          </div>

          <div class="gh-contrib-foot font-mono-num">
            <a href="moments.html" style="color:var(--ink-muted);">日常时间线 →</a>
            <div class="gh-legend">
              <span>Less</span>
              <i class="gh-day" data-level="0"></i>
              <i class="gh-day" data-level="1"></i>
              <i class="gh-day" data-level="2"></i>
              <i class="gh-day" data-level="3"></i>
              <i class="gh-day" data-level="4"></i>
              <span>More</span>
            </div>
          </div>
        </section>

        <!-- 4. GitHub-Style Contribution Activity Stream -->
        <section>
          <div class="gh-sec-header">
            <span class="gh-sec-title">Recent Activity</span>
          </div>
          <div class="gh-activity-stream">
            ${activityEvents
              .map(
                ev => `
              <a href="${escapeHtml(ev.url)}" class="gh-act-item" ${ev.private ? 'data-private="1"' : ''}>
                <span class="gh-act-node">${ev.kind === 'post' ? ICO.repo : ICO.spark}</span>
                <div class="gh-act-main">
                  <span class="gh-act-badge">${escapeHtml(ev.badge)}</span>
                  <span class="gh-act-title">${escapeHtml(ev.title)}</span>
                </div>
                <time class="gh-act-date font-mono-num">${escapeHtml(ev.dateDisp)}</time>
              </a>`
              )
              .join('')}
          </div>
        </section>
      </div>
    </div>
  </main>`;

  return renderLayout({
    title: nav.about,
    site,
    activeNav: 'about',
    rootPrefix: '',
    bodyHtml,
    postsForSearch: posts,
    moments,
    shelf,
    localDev,
  });
}

// 7. Creator Studio V11 — Zero-Box Flagship Workspace
function renderStudioPage({ site }) {
  const nav = getNavLabels(site);
  const categories = Array.from(new Set([...(site.categories || ['造物', '随笔', '夜记'])]));
  const sidebarToggleIcon = `<svg class="ico" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 3v18"/></svg>`;
  const chevronDownIcon = `<svg class="ico" viewBox="0 0 24 24" style="width:12px;height:12px;"><path d="m6 9 6 6 6-6"/></svg>`;
  const calendarIcon = `<svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px;"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>`;
  const linkIcon = `<svg class="ico" viewBox="0 0 24 24" style="width:12.5px;height:12.5px;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`;

  const starIcon = `<svg class="ico" viewBox="0 0 24 24" style="width:12px;height:12px;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;

  return `<!DOCTYPE html>
<html lang="zh-CN" class="studio-html" data-theme="light">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>写作台 · ${escapeHtml(site.title || '自留地')}</title>
  <script>
    (function() {
      var saved = localStorage.getItem('blog-theme');
      if (saved === 'dark' || saved === 'light') {
        document.documentElement.setAttribute('data-theme', saved);
      }
    })();
  </script>
  <link rel="stylesheet" href="assets/styles.css" />
  <link rel="stylesheet" href="assets/studio.css" />
</head>
<body class="studio-body">
  <!-- Single Minimal 52px Studio Topbar + Spring Glider + Live Save Status -->
  <header class="st-topbar">
    <div class="st-topbar-left">
      <a href="index.html" class="st-ghost-btn" title="返回小站前台">${ICO.arrowLeft}<span>返回小站</span></a>
      <button type="button" id="btn-collapse-drawer" class="st-ghost-btn" title="收起 / 展开文档栏 · 专注模式 (Ctrl+\\)">${sidebarToggleIcon}</button>
      <span id="st-save-indicator" class="st-save-indicator">
        <span class="st-status-dot"></span>
        <span id="st-save-label">已同步</span>
      </span>
      <span id="doc-word-stat" class="st-topbar-stat font-mono-num">0 字</span>
    </div>

    <nav id="st-main-seg" class="st-seg-nav" role="tablist">
      <span id="st-seg-glider" class="st-seg-glider"></span>
      <button type="button" class="st-seg-btn active" data-st-tab="posts">文章与日记</button>
      <button type="button" class="st-seg-btn" data-st-tab="moments">日常动态</button>
      <button type="button" class="st-seg-btn" data-st-tab="shelf">我的收藏</button>
      <button type="button" class="st-seg-btn" data-st-tab="settings">小站装扮</button>
    </nav>

    <div class="st-topbar-right">
      <div id="topbar-post-actions" class="st-topbar-group">
        <div class="st-fmt-dd-wrap">
          <button type="button" id="tp-para-btn" class="st-ghost-btn st-compact-btn" title="Typora 段落与块级元素菜单"><span>段落</span>${chevronDownIcon}</button>
          <div id="tp-para-pop" class="st-popover st-typora-menu">
            <button type="button" class="st-popover-opt" data-fmt-act="h1"><span>一级标题</span><span class="slash-item-hint">Ctrl+1</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="h2"><span>二级标题</span><span class="slash-item-hint">Ctrl+2</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="h3"><span>三级标题</span><span class="slash-item-hint">Ctrl+3</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="h4"><span>四级标题</span><span class="slash-item-hint">Ctrl+4</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="p"><span>普通段落</span><span class="slash-item-hint">Ctrl+0</span></button>
            <div class="st-menu-div"></div>
            <button type="button" class="st-popover-opt" data-fmt-act="table"><span>插入表格</span><span class="slash-item-hint">Ctrl+T</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="code"><span>代码块</span><span class="slash-item-hint">Ctrl+Shift+K</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="math-block"><span>公式块</span><span class="slash-item-hint">Ctrl+Shift+M</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="quote"><span>引用段落</span><span class="slash-item-hint">Ctrl+Shift+Q</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="callout-note"><span>备注提示框</span><span class="slash-item-hint">[!NOTE]</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="callout-tip"><span>技巧提示框</span><span class="slash-item-hint">[!TIP]</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="callout-important"><span>重要强调框</span><span class="slash-item-hint">[!IMPORTANT]</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="callout-warning"><span>注意事项框</span><span class="slash-item-hint">[!WARNING]</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="details"><span>折叠详情块</span><span class="slash-item-hint">:::details</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="bookmark"><span>网页书签卡</span><span class="slash-item-hint">:::bookmark</span></button>
            <div class="st-menu-div"></div>
            <button type="button" class="st-popover-opt" data-fmt-act="ul"><span>无序列表</span><span class="slash-item-hint">- 空格</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="ol"><span>有序列表</span><span class="slash-item-hint">1. 空格</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="todo"><span>任务列表</span><span class="slash-item-hint">- [ ]</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="footnote"><span>插入脚注</span><span class="slash-item-hint">[^1]</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="hr"><span>水平分割线</span><span class="slash-item-hint">---</span></button>
          </div>
        </div>

        <div class="st-fmt-dd-wrap">
          <button type="button" id="tp-fmt-btn" class="st-ghost-btn st-compact-btn" title="Typora 行内样式菜单"><span>格式</span>${chevronDownIcon}</button>
          <div id="tp-fmt-pop" class="st-popover st-typora-menu">
            <button type="button" class="st-popover-opt" data-fmt-act="bold"><span>加粗</span><span class="slash-item-hint">Ctrl+B</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="italic"><span>斜体</span><span class="slash-item-hint">Ctrl+I</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="underline"><span>下划线</span><span class="slash-item-hint">Ctrl+U</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="strike"><span>删除线</span><span class="slash-item-hint">~~文字~~</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="mark"><span>荧光高亮</span><span class="slash-item-hint">Ctrl+Shift+H</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="spoiler"><span>防剧透黑幕</span><span class="slash-item-hint">||文字||</span></button>
            <div class="st-menu-div"></div>
            <button type="button" class="st-popover-opt" data-fmt-act="inline-code"><span>行内代码</span><span class="slash-item-hint">Ctrl+&#96;</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="math-inline"><span>行内公式</span><span class="slash-item-hint">$公式$</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="kbd"><span>键盘按键</span><span class="slash-item-hint">[[Kbd]]</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="sup"><span>上标</span><span class="slash-item-hint">^2^</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="sub"><span>下标</span><span class="slash-item-hint">~2~</span></button>
            <div class="st-menu-div"></div>
            <button type="button" class="st-popover-opt" data-fmt-act="link"><span>超链接</span><span class="slash-item-hint">Ctrl+K</span></button>
            <button type="button" class="st-popover-opt" data-fmt-act="img"><span>插入图像</span><span class="slash-item-hint">Ctrl+Shift+I</span></button>
          </div>
        </div>

        <button type="button" id="btn-toggle-source" class="st-ghost-btn st-compact-btn" title="切换所见即所得与源代码模式 (Ctrl+/)">源码</button>
        <span class="st-top-sep"></span>
        <a id="doc-view-live" href="#" class="st-ghost-btn st-compact-btn" style="display:none;">预览 ${ICO.arrowUpRight}</a>
        <button type="button" id="doc-del-btn" class="st-ghost-btn st-compact-btn danger" style="display:none;">删除</button>
        <button type="button" id="doc-save-btn" class="st-primary-btn" title="快捷键 Ctrl+S">保存发布</button>
      </div>

      <div id="topbar-moments-actions" class="st-topbar-group" style="display:none;">
        <a href="moments.html" class="st-ghost-btn st-compact-btn">查看${escapeHtml(nav.moments || '朝夕')} ${ICO.arrowUpRight}</a>
      </div>

      <div id="topbar-shelf-actions" class="st-topbar-group" style="display:none;">
        <a href="shelf.html" class="st-ghost-btn st-compact-btn">查看${escapeHtml(nav.shelf || '珍藏')} ${ICO.arrowUpRight}</a>
      </div>

      <div id="topbar-settings-actions" class="st-topbar-group" style="display:none;">
        <a href="about.html" class="st-ghost-btn st-compact-btn">查看${escapeHtml(nav.about || '自叙')} ${ICO.arrowUpRight}</a>
        <button type="button" id="decor-save-btn" class="st-primary-btn" title="快捷键 Ctrl+S">保存设置</button>
      </div>

      <button type="button" id="st-theme-btn" class="st-ghost-btn" title="切换日夜模式" style="padding:0 8px;">
        <span id="st-sun">${ICO.sun}</span>
        <span id="st-moon" style="display:none;">${ICO.moon}</span>
      </button>
    </div>
  </header>

  <input type="file" id="st-file-picker" accept="image/*" multiple style="display:none;" />

  <!-- ========================================================================
       PAGE 1: PURE BORDERLESS NOTION / FEISHU PAPER WORKSPACE + LIVE OUTLINE
       ======================================================================== -->
  <section id="st-panel-posts" class="st-tab-panel">
    <div id="doc-workspace" class="st-posts-shell">
      <aside class="st-rail">
        <div class="st-rail-mode-head">
          <div class="st-rail-mode-tabs">
            <button type="button" class="st-rail-mtab active" data-rail-mode="files">文档</button>
            <button type="button" class="st-rail-mtab" data-rail-mode="outline">大纲</button>
          </div>
          <button type="button" id="btn-new-doc" class="st-rail-new" style="width:28px;height:28px;" title="新建空白文章或日记">${ICO.plus}</button>
        </div>

        <div id="rail-files-pane" class="st-rail-pane">
          <div class="st-rail-search">
            <span style="color:var(--st-ink-3); display:inline-flex;">${ICO.search}</span>
            <input id="doc-filter" type="text" placeholder="搜标题、标签或正文…" />
            <button type="button" id="doc-filter-clear" class="ui-clear-btn" title="清空">×</button>
          </div>
          <div class="st-rail-filters">
            <div class="st-rail-filter-tabs">
              <button type="button" class="st-rail-ftab active" data-rail-filter="all">全部</button>
              <button type="button" class="st-rail-ftab" data-rail-filter="public">公开</button>
              <button type="button" class="st-rail-ftab" data-rail-filter="private">私密</button>
            </div>
            <span id="doc-rail-count" class="st-rail-count font-mono-num">0 篇</span>
          </div>
          <div id="doc-list" class="st-doc-list"></div>
        </div>

        <div id="rail-outline-pane" class="st-rail-pane" style="display:none;">
          <div id="rail-outline-list" class="st-rail-outline-list"></div>
        </div>
      </aside>

      <div id="paper-click-zone" class="st-paper-surface">
        <!-- Whisper-Quiet Right-Margin Live Outline (Auto-shows when >=2 headings) -->
        <aside id="st-outline-rail" class="st-outline-rail" style="display:none;">
          <div class="st-outline-title">章节目录</div>
          <div id="st-outline-list" class="st-outline-list"></div>
        </aside>

        <div class="st-paper-column">
          <div id="st-draft-recover" class="st-draft-recover" style="display:none;">
            <span id="st-draft-recover-text">检测到上次未保存的本地草稿副本</span>
            <div style="display:inline-flex; gap:6px; flex-shrink:0;">
              <button type="button" id="btn-draft-restore" class="st-draft-btn primary">恢复草稿</button>
              <button type="button" id="btn-draft-discard" class="st-draft-btn">忽略</button>
            </div>
          </div>

          <div id="doc-cover-banner" class="st-cover-banner" style="display:none;">
            <img id="doc-cover-img" src="" alt="题图" />
            <div class="st-cover-actions">
              <button type="button" id="btn-change-cover" class="st-cover-pill">更换题图</button>
              <button type="button" id="btn-remove-cover" class="st-cover-pill">移除</button>
            </div>
          </div>

          <textarea id="doc-title" rows="1" class="st-title-textarea font-serif-cn" data-autogrow placeholder="无标题"></textarea>

          <div class="st-meta-strip">
            <div style="position:relative;">
              <button type="button" id="cat-token-btn" class="st-meta-token">
                <span id="cat-token-label">随笔</span>
                ${chevronDownIcon}
              </button>
              <div id="cat-popover" class="st-popover">
                <div id="cat-options-box" style="display:flex; flex-direction:column; gap:2px;">
                  ${categories.map(c => `<button type="button" class="st-popover-opt" data-cat-opt="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join('')}
                </div>
                <div class="st-popover-new-cat">
                  <input id="cat-new-input" type="text" placeholder="+ 新分类名，回车创建" />
                </div>
              </div>
              <input type="hidden" id="doc-category" value="随笔" />
            </div>

            <span class="st-meta-dot">·</span>

            <button type="button" id="date-token-btn" class="st-meta-token font-mono-num" title="点击修改日期">
              ${calendarIcon}
              <span id="date-token-label">2026.11.20</span>
              <input id="doc-date" type="date" style="position:absolute; opacity:0; width:1px; height:1px; pointer-events:none;" />
            </button>

            <span class="st-meta-dot">·</span>

            <button type="button" id="priv-token-btn" class="st-meta-token" title="点击切换公开 / 仅自己可见">
              ${ICO.lock}
              <span id="priv-token-label">公开</span>
              <input id="doc-private" type="checkbox" style="display:none;" />
            </button>

            <button type="button" id="feat-token-btn" class="st-meta-token" title="点击切换首页大图置顶">
              ${starIcon}
              <span id="feat-token-label">置顶</span>
              <input id="doc-featured" type="checkbox" style="display:none;" />
            </button>

            <span class="st-meta-dot">·</span>

            <span id="tag-chips-wrap" style="display:inline-flex; gap:5px; flex-wrap:wrap; align-items:center;"></span>
            <input id="tag-inline-input" type="text" class="st-tag-bare-input" placeholder="+ 标签" />

            <div class="st-meta-right-tools">
              <button type="button" id="btn-add-cover-ghost" class="st-meta-token" title="添加或更换文章顶部题图">${ICO.image}<span>题图</span></button>
              <button type="button" id="btn-toggle-summary" class="st-meta-token" title="展开或收起自定义摘要导语"><span>导语</span></button>
            </div>
          </div>

          <div id="doc-summary-wrap" class="st-summary-wrap">
            <span class="st-summary-badge">导语</span>
            <textarea id="doc-summary" rows="1" class="st-summary-textarea" data-autogrow placeholder="自定义文章摘要（留空则自动截取正文开头）…"></textarea>
            <button type="button" id="btn-clear-summary" class="st-tiny-action" title="清空导语并收起">清空</button>
          </div>

          <div class="st-editor-stage">
            <button type="button" id="gutter-plus" class="st-gutter-plus" title="插入内容块">+</button>
            <div id="wysiwyg-editor" class="wysiwyg-canvas prose" contenteditable="true" spellcheck="false" data-placeholder="直接输入 Markdown 实时排版，或按 / 唤起块菜单…"></div>
            <textarea id="md-source-editor" class="st-md-sheet" data-autogrow placeholder="在这里直接编写 Markdown 源码…"></textarea>
          </div>

          <footer class="st-paper-footer">
            <span id="doc-bottom-stat" class="font-mono-num">0 字 · 0 段</span>
            <span>Typora 实时预览 · 行首 <kbd>/</kbd> 插入模块 · <kbd>Ctrl+/</kbd> 切换源码 · <kbd>Ctrl+S</kbd> 保存</span>
          </footer>

          <!-- Floating Image Action Bar -->
          <div id="img-action-bar" class="img-action-bar">
            <button type="button" class="sb-btn" data-img-act="compact">紧凑 60%</button>
            <button type="button" class="sb-btn" data-img-act="full">标准 100%</button>
            <button type="button" class="sb-btn" data-img-act="replace">换图</button>
            <button type="button" class="sb-btn" style="color:#F28B82;" data-img-act="delete">删除</button>
          </div>

          <!-- Floating Table Editing Action Bar -->
          <div id="table-action-bar" class="img-action-bar">
            <button type="button" class="sb-btn" data-tbl-act="row-below">+ 下方插行</button>
            <button type="button" class="sb-btn" data-tbl-act="col-right">+ 右侧插列</button>
            <button type="button" class="sb-btn" data-tbl-act="align-left" title="当前列左对齐">居左</button>
            <button type="button" class="sb-btn" data-tbl-act="align-center" title="当前列居中">居中</button>
            <button type="button" class="sb-btn" data-tbl-act="align-right" title="当前列右对齐">居右</button>
            <button type="button" class="sb-btn" data-tbl-act="del-row">删行</button>
            <button type="button" class="sb-btn" data-tbl-act="del-col">删列</button>
            <button type="button" class="sb-btn" style="color:#F28B82;" data-tbl-act="del-table">删表</button>
          </div>

          <!-- Floating Dark Selection Pill + Inline Link Input -->
          <div id="selection-bubble" class="selection-bubble">
            <div id="sb-cmds-group" style="display:inline-flex; align-items:center; gap:2px;">
              <button type="button" class="sb-btn" data-rt-cmd="h2"><strong>H2</strong></button>
              <button type="button" class="sb-btn" data-rt-cmd="h3"><strong>H3</strong></button>
              <button type="button" class="sb-btn" data-rt-cmd="bold"><strong>B</strong></button>
              <button type="button" class="sb-btn" data-rt-cmd="italic"><em>I</em></button>
              <button type="button" class="sb-btn" data-rt-cmd="underline"><u>U</u></button>
              <button type="button" class="sb-btn" data-rt-cmd="strike"><del>S</del></button>
              <button type="button" class="sb-btn" data-rt-cmd="mark"><span style="background:rgba(228,176,74,0.55);color:#FFF;padding:0 4px;border-radius:3px;">高亮</span></button>
              <button type="button" class="sb-btn" data-rt-cmd="spoiler">黑幕</button>
              <button type="button" class="sb-btn" data-rt-cmd="inline-code">代码</button>
              <button type="button" class="sb-btn" data-rt-cmd="kbd">按键</button>
              <button type="button" class="sb-btn" data-rt-cmd="math-inline">$公式</button>
              <button type="button" id="sb-open-link" class="sb-btn" title="添加超链接">${linkIcon}</button>
            </div>
            <div id="sb-link-box" class="sb-link-box">
              <input id="sb-link-input" type="url" placeholder="输入 https:// 链接回车…" />
              <button type="button" id="sb-link-apply" class="sb-btn" style="color:#EAB96A;font-weight:600;">确定</button>
            </div>
          </div>

          <!-- Block Insert Menu ('/' or '+') -->
          <div id="slash-menu" class="slash-menu">
            <button type="button" class="slash-item active" data-slash-cmd="img"><span>插入照片 / 媒体</span><span class="slash-item-hint">![]()</span></button>
            <button type="button" class="slash-item" data-slash-cmd="h1"><span>一级主标题</span><span class="slash-item-hint">#</span></button>
            <button type="button" class="slash-item" data-slash-cmd="h2"><span>二级大标题</span><span class="slash-item-hint">##</span></button>
            <button type="button" class="slash-item" data-slash-cmd="h3"><span>三级小节</span><span class="slash-item-hint">###</span></button>
            <button type="button" class="slash-item" data-slash-cmd="h4"><span>四级小标题</span><span class="slash-item-hint">####</span></button>
            <button type="button" class="slash-item" data-slash-cmd="table"><span>数据表格 (3×3)</span><span class="slash-item-hint">| 表 |</span></button>
            <button type="button" class="slash-item" data-slash-cmd="todo"><span>待办事项清单</span><span class="slash-item-hint">- [ ]</span></button>
            <button type="button" class="slash-item" data-slash-cmd="ul"><span>无序列表</span><span class="slash-item-hint">-</span></button>
            <button type="button" class="slash-item" data-slash-cmd="ol"><span>有序编号列表</span><span class="slash-item-hint">1.</span></button>
            <button type="button" class="slash-item" data-slash-cmd="quote"><span>引用段落</span><span class="slash-item-hint">&gt;</span></button>
            <button type="button" class="slash-item" data-slash-cmd="callout-note"><span>备注提示框</span><span class="slash-item-hint">[!NOTE]</span></button>
            <button type="button" class="slash-item" data-slash-cmd="callout-tip"><span>经验技巧框</span><span class="slash-item-hint">[!TIP]</span></button>
            <button type="button" class="slash-item" data-slash-cmd="callout-important"><span>重要强调框</span><span class="slash-item-hint">[!IMPORTANT]</span></button>
            <button type="button" class="slash-item" data-slash-cmd="callout-warning"><span>注意事项框</span><span class="slash-item-hint">[!WARNING]</span></button>
            <button type="button" class="slash-item" data-slash-cmd="details"><span>折叠详情块</span><span class="slash-item-hint">:::details</span></button>
            <button type="button" class="slash-item" data-slash-cmd="code"><span>多语言代码块</span><span class="slash-item-hint">&#96;&#96;&#96;</span></button>
            <button type="button" class="slash-item" data-slash-cmd="math-block"><span>数学公式块</span><span class="slash-item-hint">$$</span></button>
            <button type="button" class="slash-item" data-slash-cmd="bookmark"><span>网页书签卡片</span><span class="slash-item-hint">:::bookmark</span></button>
            <button type="button" class="slash-item" data-slash-cmd="footnote"><span>文末脚注引用</span><span class="slash-item-hint">[^1]</span></button>
            <button type="button" class="slash-item" data-slash-cmd="hr"><span>水平分割线</span><span class="slash-item-hint">---</span></button>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ========================================================================
       PAGE 2: CENTERED FLOMO UNIFIED COMPOSER & SORTABLE STREAM
       ======================================================================== -->
  <section id="st-panel-moments" class="st-tab-panel" style="display:none;">
    <div class="st-centered-stream">
      <div id="mm-composer-card" class="flomo-composer">
        <div id="mm-edit-banner" class="flomo-edit-banner">
          <span id="mm-card-title">正在编辑动态</span>
          <button type="button" id="mm-cancel-btn" style="border:none;background:none;color:inherit;font-weight:700;cursor:pointer;font-size:12px;">取消 ×</button>
        </div>

        <textarea id="mm-text" rows="3" class="flomo-textarea" data-autogrow placeholder="记录当下的想法或日常切片（支持直接粘贴 / 拖入照片）…"></textarea>

        <div id="mm-attachments-box" class="flomo-attachments">
          <div id="mm-nine-grid" class="nine-grid-uploader"></div>
          <div id="mm-notes-chips" style="display:grid; gap:6px;"></div>
        </div>

        <div id="mm-loc-drawer" class="flomo-inline-drawer">
          <span style="color:var(--st-accent);display:inline-flex;flex-shrink:0;">${ICO.pin}</span>
          <input id="mm-loc" type="text" placeholder="手动输入地点（如：徐州 · 云龙湖 / 街角咖啡馆），或点右侧自动获取…" />
          <button type="button" id="mm-loc-auto-btn" class="st-loc-auto-btn">自动获取</button>
          <button type="button" id="mm-loc-clear-btn" class="st-tiny-action">清除</button>
        </div>

        <div id="mm-time-drawer" class="flomo-inline-drawer">
          <span style="color:var(--st-ink-3);display:inline-flex;">${ICO.calendar}</span>
          <input id="mm-datetime" type="datetime-local" class="font-mono-num" style="flex:0 1 auto;" />
          <button type="button" id="mm-time-now-btn" class="st-tiny-action">恢复当前发布时间</button>
        </div>

        <div id="mm-note-drawer" class="flomo-inline-drawer">
          <span style="color:var(--st-ink-3);display:inline-flex;">${ICO.pen}</span>
          <input id="mm-note-add-input" type="text" placeholder="补一句后续追记，按回车添加…" />
          <button type="button" id="mm-note-add-btn" class="st-ghost-btn" style="height:24px;padding:0 8px;color:var(--st-accent);">添加</button>
        </div>

        <div class="flomo-bar">
          <div class="flomo-tools">
            <button type="button" id="mm-pick-photos" class="flomo-tool-pill" title="添加照片（支持拖拽排序，最多9张）">
              ${ICO.image}<span id="mm-photo-btn-label">图片</span>
            </button>

            <div style="position:relative;">
              <button type="button" id="mm-mood-btn" class="flomo-tool-pill active">
                <span>#</span><span id="mm-mood-label">日常</span>${chevronDownIcon}
              </button>
              <div id="mm-mood-popover" class="st-popover">
                ${['日常', '随手拍', '周末', '碎碎念', '折腾']
                  .map(m => `<button type="button" class="st-popover-opt" data-mm-mood="${m}"># ${m}</button>`)
                  .join('')}
              </div>
            </div>

            <button type="button" id="mm-loc-toggle" class="flomo-tool-pill" title="添加所在地点（支持自动定位或手动输入）">
              ${ICO.pin}<span id="mm-loc-pill-text">位置</span>
            </button>

            <button type="button" id="mm-time-toggle" class="flomo-tool-pill" title="默认使用发布当下时间；可往前补记或往后定时">
              ${ICO.calendar}<span id="mm-time-pill-text" class="font-mono-num">发布时间</span>
            </button>

            <button type="button" id="mm-note-toggle" class="flomo-tool-pill">
              <span>+ 追记</span>
            </button>

            <button type="button" id="mm-priv-btn" class="flomo-tool-pill" title="切换公开 / 仅自己可见">
              ${ICO.lock}<span id="mm-priv-label">公开</span>
              <input id="mm-priv" type="checkbox" style="display:none;" />
            </button>
          </div>

          <div style="display:inline-flex; align-items:center; gap:8px; margin-left:auto;">
            <span id="mm-char-stat" class="font-mono-num" style="font-size:11.5px; color:var(--st-ink-3);"></span>
            <span class="st-kbd">Ctrl+Enter</span>
            <button type="button" id="mm-submit-btn" class="st-primary-btn">发布</button>
          </div>
        </div>
      </div>

      <!-- Moments Stream Filter Bar -->
      <div class="st-stream-filter-bar">
        <div class="st-filter-pills">
          <button type="button" class="st-filter-pill active" data-mm-filter="all">全部动态</button>
          <button type="button" class="st-filter-pill" data-mm-filter="public">公开</button>
          <button type="button" class="st-filter-pill" data-mm-filter="private">仅自己可见</button>
        </div>
        <div class="st-rail-search" style="flex:0 1 190px; height:30px;">
          <span style="color:var(--st-ink-3); display:inline-flex;">${ICO.search}</span>
          <input id="mm-stream-search" type="text" style="font-size:12px;" placeholder="搜动态或地点…" />
        </div>
      </div>

      <div id="mm-visual-wall"></div>
    </div>
  </section>

  <!-- ========================================================================
       PAGE 3: LINEAR HOVER-ILLUMINATED WYSIWYG COLLECTION CARD COMPOSER
       ======================================================================== -->
  <section id="st-panel-shelf" class="st-tab-panel" style="display:none;">
    <div class="st-shelf-wrap">
      <div class="wysiwyg-shelf-card">
        <div class="ws-cover-col">
          <div id="sh-cover-trigger" class="ws-clickable-cover" title="点击上传海报或封面照片">
            <div id="sh-live-cover" class="artifact-cover tone-bg-sage" style="width:116px;height:160px;">
              <span id="sh-spine-type" style="font-size:10px; opacity:0.8; padding-left:4px;">影视</span>
              <span id="sh-spine-chars" class="font-serif-cn" style="font-size:21px; font-weight:700; padding-left:4px;">影视</span>
            </div>
            <div class="ws-cover-hint">点击换封面图</div>
          </div>

          <div class="ws-swatches" title="切换无图立体书脊颜色">
            <button type="button" class="tone-dot active" data-sh-tone="sage" style="background:#566E5D;"></button>
            <button type="button" class="tone-dot" data-sh-tone="terracotta" style="background:#B4593E;"></button>
            <button type="button" class="tone-dot" data-sh-tone="sand" style="background:#B58952;"></button>
            <button type="button" class="tone-dot" data-sh-tone="slate" style="background:#526478;"></button>
          </div>
          <button type="button" id="sh-clear-poster" class="st-tiny-action" style="display:none; font-size:11px;">清除图片</button>
        </div>

        <div>
          <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px;">
            <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
              <div class="st-seg-nav static-seg">
                <button type="button" class="st-seg-btn active" data-sh-type="影视">影视</button>
                <button type="button" class="st-seg-btn" data-sh-type="书籍">书籍</button>
                <button type="button" class="st-seg-btn" data-sh-type="游戏">游戏</button>
                <button type="button" class="st-seg-btn" data-sh-type="好物">好物</button>
              </div>
              <div id="sh-status-group" class="st-seg-nav static-seg">
                <button type="button" class="st-seg-btn active" data-sh-status="看过">看过</button>
                <button type="button" class="st-seg-btn" data-sh-status="在看">在看</button>
                <button type="button" class="st-seg-btn" data-sh-status="想看">想看</button>
              </div>
            </div>

            <div style="display:inline-flex; gap:1px;" title="点击打星">
              ${[1, 2, 3, 4, 5]
                .map(
                  n =>
                    `<button type="button" data-sh-star="${n}" style="background:none;border:none;cursor:pointer;font-size:18px;color:#DA8B2B;padding:0 2px;line-height:1;">★</button>`
                )
                .join('')}
            </div>
          </div>

          <input id="sh-title-in" type="text" class="ws-direct-title font-serif-cn" placeholder="输入作品或好物名称…" />
          <input id="sh-creator-in" type="text" class="ws-direct-creator" placeholder="作者 / 导演 / 出品方 / 年份" />
          <textarea id="sh-comment-in" rows="2" class="ws-direct-comment" data-autogrow placeholder="写两句私藏短评或推荐理由…"></textarea>

          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding-top:10px; border-top:1px solid var(--st-hairline);">
            <span class="st-kbd">Ctrl+Enter 快速保存</span>
            <div style="display:inline-flex; gap:8px;">
              <button type="button" id="sh-cancel-btn" class="st-ghost-btn" style="display:none;">取消修改</button>
              <button type="button" id="sh-submit-btn" class="st-primary-btn">收入收藏夹</button>
            </div>
          </div>
        </div>
      </div>

      <div class="st-stream-filter-bar" style="margin-bottom:16px;">
        <div id="sh-filter-bar" class="st-filter-pills">
          <button type="button" class="st-filter-pill active" data-sh-filter="all">全部收藏</button>
          <button type="button" class="st-filter-pill" data-sh-filter="影视">影视</button>
          <button type="button" class="st-filter-pill" data-sh-filter="书籍">书籍</button>
          <button type="button" class="st-filter-pill" data-sh-filter="游戏">游戏</button>
          <button type="button" class="st-filter-pill" data-sh-filter="好物">好物</button>
        </div>
        <div class="st-rail-search" style="flex:0 1 190px; height:30px;">
          <span style="color:var(--st-ink-3); display:inline-flex;">${ICO.search}</span>
          <input id="sh-stream-search" type="text" style="font-size:12px;" placeholder="搜收藏名称…" />
        </div>
      </div>

      <div id="sh-visual-gallery" class="shelf-grid"></div>
    </div>
  </section>

  <!-- ========================================================================
       PAGE 4: APPLE / LINEAR INVERTED-CONTRAST SETTINGS SHEET + POLAROID WALL
       ======================================================================== -->
  <section id="st-panel-settings" class="st-tab-panel" style="display:none;">
    <div class="st-settings-wrap">
      <div style="display:flex; align-items:baseline; justify-content:space-between; margin-bottom:12px;">
        <span class="font-serif-cn" style="font-size:16px; font-weight:700;">首页拍立得相框</span>
        <span style="font-size:12px; color:var(--st-ink-3);">点击照片即可更换，下方可直接修改签注文字</span>
      </div>
      <div id="decor-polaroids" class="polaroid-slots-row"></div>

      <div class="linear-sheet">
        <div class="ls-row">
          <div style="display:flex; align-items:center; gap:14px;">
            <div id="decor-avatar-pick" class="st-avatar-picker" title="点击更换头像">
              <img id="decor-avatar-img" src="${escapeHtml(resolveImg(site.avatar || 'uploads/avatar-default.svg', ''))}" alt="头像" />
              <span class="st-avatar-pick-mask">${ICO.camera}</span>
            </div>
            <div>
              <div class="ls-meta-title">头像与名片</div>
              <div class="ls-meta-desc">展示在首页名片与自叙页；个人常驻省市由系统自动识别</div>
            </div>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
            <input id="decor-author" type="text" class="linear-input" placeholder="昵称" />
            <input id="decor-handle" type="text" class="linear-input font-mono-num" placeholder="ID (如 nianyou)" />
            <input id="decor-status" type="text" class="linear-input" placeholder="状态签名" />
            <div class="auto-loc-readonly-box" title="自动识别所在省份与城市，不支持手动输入">
              <span style="color:var(--st-accent); display:inline-flex; flex-shrink:0;">${ICO.pin}</span>
              <input id="decor-location" type="text" readonly tabindex="-1" class="auto-loc-readonly-input" placeholder="自动定位省市中…" />
              <button type="button" id="decor-relocate-btn" class="st-tiny-action" style="flex-shrink:0;">重新定位</button>
            </div>
          </div>
        </div>

        <div class="ls-row">
          <div>
            <div class="ls-meta-title">导航栏名称</div>
            <div class="ls-meta-desc">对应顶部五个栏目的展示文案</div>
          </div>
          <div style="display:grid; grid-template-columns:repeat(5, 1fr); gap:8px;">
            <input id="decor-nav-home" type="text" class="linear-input" placeholder="扉页" />
            <input id="decor-nav-moments" type="text" class="linear-input" placeholder="朝夕" />
            <input id="decor-nav-archive" type="text" class="linear-input" placeholder="纪事" />
            <input id="decor-nav-shelf" type="text" class="linear-input" placeholder="珍藏" />
            <input id="decor-nav-about" type="text" class="linear-input" placeholder="自叙" />
          </div>
        </div>

        <div class="ls-row">
          <div>
            <div class="ls-meta-title">站点与建站日</div>
            <div class="ls-meta-desc">用于浏览器标题与建站天数统计</div>
          </div>
          <div style="display:grid; grid-template-columns:1.3fr 1fr; gap:12px;">
            <input id="decor-title" type="text" class="linear-input" placeholder="站点名" />
            <input id="decor-start" type="date" class="linear-input font-mono-num" />
          </div>
        </div>

        <div class="ls-row">
          <div>
            <div class="ls-meta-title" style="margin-bottom:10px;">首屏主标题</div>
            <div style="padding:10px 12px; border-radius:10px; background:var(--st-input-surface); border:1px solid var(--st-hairline); font-size:14.5px; line-height:1.45;" class="font-serif-cn">
              <div id="decor-live-h1" style="font-weight:700;">欢迎闯入</div>
              <div style="position:relative; display:inline-block; color:var(--st-accent); font-weight:700;">
                <span id="decor-live-h2">我的自留地</span>
                <svg viewBox="0 0 220 12" fill="none" style="position:absolute;left:0;bottom:-3px;width:100%;height:7px;">
                  <path d="M3 8.5C54 2.5 148 1.8 217 7.2" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity="0.4"/>
                </svg>
              </div>
            </div>
          </div>
          <div style="display:grid; gap:10px;">
            <input id="decor-head1" type="text" class="linear-input" placeholder="第一行" />
            <input id="decor-head2" type="text" class="linear-input" placeholder="第二行" />
          </div>
        </div>

        <div class="ls-row">
          <div>
            <div class="ls-meta-title">个人一句话简介</div>
            <div class="ls-meta-desc">展示在首页标题下方与自叙名片中</div>
          </div>
          <div>
            <textarea id="decor-intro" rows="2" class="linear-input" data-autogrow placeholder="简介…"></textarea>
          </div>
        </div>

        <div class="ls-row">
          <div>
            <div class="ls-meta-title">轮播状态短句</div>
            <div class="ls-meta-desc">首页名片打字机循环展示，点击已有短句可直接改字</div>
          </div>
          <div>
            <div id="decor-phrases-list" class="phrase-pill-list"></div>
            <input id="decor-phrase-in" type="text" class="linear-input" placeholder="新增短句，回车添加…" />
          </div>
        </div>

        <div class="ls-row">
          <div>
            <div class="ls-meta-title">文章分类</div>
            <div class="ls-meta-desc">私密文章在访客视角与打包发布中会自动隐藏</div>
          </div>
          <div>
            <div id="decor-cats-list" class="phrase-pill-list"></div>
            <input id="decor-cat-in" type="text" class="linear-input" placeholder="新增分类，回车添加…" />
          </div>
        </div>

        <div class="ls-row">
          <div>
            <div class="ls-meta-title">纪事归档导语</div>
            <div class="ls-meta-desc">选填，展示在纪事时间轴顶部</div>
          </div>
          <div>
            <textarea id="decor-arch" rows="2" class="linear-input" data-autogrow placeholder="选填…"></textarea>
          </div>
        </div>

        <div class="ls-row">
          <div>
            <div class="ls-meta-title">自叙页正文</div>
            <div class="ls-meta-desc">支持标准 Markdown 语法（标题、列表、链接等）</div>
          </div>
          <div>
            <textarea id="decor-about" rows="5" class="linear-input" data-autogrow placeholder="Markdown…"></textarea>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Studio Lightbox for Clicking Photos -->
  <div id="st-lightbox" class="lightbox-backdrop">
    <img id="st-lb-img" class="lightbox-img" src="" alt="" />
  </div>

  <div id="global-toast" class="global-toast"></div>
  <script src="assets/studio.js"></script>
</body>
</html>`;
}

// 8. RSS XML
function renderRssXml({ site, posts }) {
  const items = posts
    .slice(0, 20)
    .map(
      p => `
    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>posts/${p.slug}.html</link>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <category>${escapeHtml(p.category)}</category>
      <description>${escapeHtml(p.summary)}</description>
    </item>`
    )
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeHtml(site.title)}</title>
    <description>${escapeHtml(site.heroIntro || '')}</description>
    <language>zh-cn</language>
    ${items}
  </channel>
</rss>`;
}

module.exports = {
  renderHomePage,
  renderMomentsPage,
  renderArchivePage,
  renderShelfPage,
  renderPostPage,
  renderAboutPage,
  renderStudioPage,
  renderRssXml,
};
