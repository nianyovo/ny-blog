// ==========================================================================
// Creator Studio V11 Controller — Flagship Polish & Micro-Interactions
// - Spring Segmented Glider · Dirty/Saved Status Indicator + Unsaved Guard
// - IME-Safe Block & Inline Markdown Auto-Format (##, [], **bold**, ==mark==, `code`)
// - Live Right-Margin Outline · Floating Image Toolbar · Selection Bubble Linker
// - Drag-Sortable 9-Grid Photos · Adaptive Stream Gallery · Inline Card Reply
// - Smart Type-Aware Collection Statuses · Category Manager & Live Brush Preview
// ==========================================================================

(function () {
  let allPosts = [];
  let allMoments = [];
  let allShelf = [];
  let siteConfig = {};

  let activeTab = 'posts';
  let currentSlug = null;
  let currentTags = [];
  let currentCover = '';
  let sourceMode = false;
  let isComposing = false;
  let isPostDirty = false;
  let isSettingsDirty = false;

  // Moments state
  let editingMomentId = null;
  let mmMood = '日常';
  let mmImages = [];
  let mmNotes = [];
  let mmStreamFilter = 'all';
  let dragPhotoIdx = null;

  // Shelf state
  let editingShelfId = null;
  let shType = '影视';
  let shStatus = '看过';
  let shRating = 5;
  let shTone = 'sage';
  let shCover = '';
  let shGalleryFilter = 'all';

  // Settings state
  let editPolaroids = [];
  let editPhrases = [];
  let editCategories = [];

  // Automatic Province & City Geolocation Helper (Zero Manual Input)
  const ST_EN_CN = {
    beijing: '北京', shanghai: '上海', tianjin: '天津', chongqing: '重庆',
    jiangsu: '江苏', zhejiang: '浙江', guangdong: '广东', fujian: '福建', shandong: '山东',
    anhui: '安徽', hubei: '湖北', hunan: '湖南', sichuan: '四川', shaanxi: '陕西',
    henan: '河南', hebei: '河北', liaoning: '辽宁', jilin: '吉林', heilongjiang: '黑龙江',
    jiangxi: '江西', shanxi: '山西', yunnan: '云南', guizhou: '贵州', guangxi: '广西',
    hainan: '海南', gansu: '甘肃', qinghai: '青海', ningxia: '宁夏', xinjiang: '新疆',
    tibet: '西藏', xizang: '西藏', 'inner mongolia': '内蒙古', neimenggu: '内蒙古',
    hongkong: '香港', 'hong kong': '香港', macau: '澳门', macao: '澳门', taiwan: '台湾',
    nanjing: '南京', suzhou: '苏州', wuxi: '无锡', changzhou: '常州', xuzhou: '徐州',
    nantong: '南通', yangzhou: '扬州', zhenjiang: '镇江', taizhou: '泰州', yancheng: '盐城',
    huaian: '淮安', "huai'an": '淮安', lianyungang: '连云港', suqian: '宿迁', kunshan: '昆山',
    hangzhou: '杭州', ningbo: '宁波', wenzhou: '温州', hefei: '合肥', guangzhou: '广州',
    shenzhen: '深圳', xiamen: '厦门', fuzhou: '福州', jinan: '济南', qingdao: '青岛',
    wuhan: '武汉', changsha: '长沙', chengdu: '成都', xian: '西安', "xi'an": '西安',
  };

  function stNormRegion(raw) {
    let s = String(raw || '').trim();
    if (!s) return '';
    s = s.replace(/\b(Province|City|Prefecture|Sheng|Shi|Autonomous Region|Municipality)\b/gi, '').trim();
    const low = s.toLowerCase();
    if (ST_EN_CN[low]) return ST_EN_CN[low];
    const stripped = s.replace(/(维吾尔自治区|壮族自治区|回族自治区|自治区|特别行政区|省|市|地区|盟)$/u, '').trim();
    return stripped.length >= 2 ? stripped : s;
  }

  function stComposeProvCity(prov, city, dist) {
    const p = stNormRegion(prov);
    const c = stNormRegion(city);
    const d = String(dist || '').trim();
    if (p && c && p !== c) return `${p} · ${c}`;
    if (p && d) return `${p} · ${d}`;
    return p || c || '';
  }

  function stJsonpPconline(timeoutMs = 3000) {
    return new Promise(resolve => {
      const script = document.createElement('script');
      const prevCb = window.IPCallBack;
      let done = false;
      const finish = val => {
        if (done) return;
        done = true;
        window.IPCallBack = prevCb;
        script.remove();
        resolve(val);
      };
      const t = setTimeout(() => finish(''), timeoutMs);
      window.IPCallBack = d => {
        clearTimeout(t);
        finish(stComposeProvCity(d?.pro, d?.city, d?.region));
      };
      script.onerror = () => {
        clearTimeout(t);
        finish('');
      };
      script.src = `https://whois.pconline.com.cn/ipJson.jsp?_=${Date.now()}`;
      document.head.appendChild(script);
    });
  }

  async function detectStudioProvinceCity({ preferGps = false } = {}) {
    const askGps = async () => {
      if (!navigator.geolocation) return '';
      const coords = await new Promise(res => {
        navigator.geolocation.getCurrentPosition(
          p => res({ lat: p.coords.latitude, lon: p.coords.longitude }),
          () => res(null),
          { enableHighAccuracy: false, timeout: 5200, maximumAge: 600000 }
        );
      });
      if (!coords) return '';
      try {
        const r = await fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(coords.lat)}&longitude=${encodeURIComponent(coords.lon)}&localityLanguage=zh`
        );
        if (r.ok) {
          const j = await r.json();
          const loc = stComposeProvCity(j.principalSubdivision, j.city || j.locality, '');
          if (loc) return loc;
        }
      } catch (_) {}
      return '';
    };

    if (preferGps) {
      const gpsLoc = await askGps();
      if (gpsLoc) return gpsLoc;
    }

    try {
      const r = await fetch('https://r.inews.qq.com/api/ip2city');
      if (r.ok) {
        const j = await r.json();
        if (j && j.province) {
          const loc = stComposeProvCity(j.province, j.city, j.district);
          if (loc) return loc;
        }
      }
    } catch (_) {}

    const pcLoc = await stJsonpPconline();
    if (pcLoc) return pcLoc;

    let foreignFallback = '';
    try {
      const r = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=zh');
      if (r.ok) {
        const j = await r.json();
        const loc = stComposeProvCity(j.principalSubdivision, j.city || j.locality, '');
        if (j.countryCode === 'CN' && loc) return loc;
        if (loc) foreignFallback = loc;
      }
    } catch (_) {}

    try {
      const r = await fetch('https://ipwho.is/?lang=zh-CN');
      if (r.ok) {
        const j = await r.json();
        if (j?.success !== false) {
          const loc = stComposeProvCity(j.region, j.city, '');
          if (j.country_code === 'CN' && loc) return loc;
          if (!foreignFallback && loc) foreignFallback = loc;
        }
      }
    } catch (_) {}

    if (!preferGps) {
      const gpsLoc = await askGps();
      if (gpsLoc) return gpsLoc;
    }

    return foreignFallback;
  }

  const STATUS_BY_TYPE = {
    影视: ['看过', '在看', '想看'],
    书籍: ['读过', '在读', '想读'],
    游戏: ['玩过', '在玩', '想玩'],
    好物: ['常用', '推荐', '种草'],
  };

  const SVG_LOCK = `<svg class="ico" viewBox="0 0 24 24" style="width:12px;height:12px;flex-shrink:0;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
  const SVG_STAR = `<svg class="ico" viewBox="0 0 24 24" style="width:11.5px;height:11.5px;fill:currentColor;flex-shrink:0;"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`;
  const SVG_PIN = `<svg class="ico" viewBox="0 0 24 24" style="width:12px;height:12px;flex-shrink:0;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`;

  const filePicker = document.getElementById('st-file-picker');
  let pickerCallback = null;

  function toast(msg) {
    const el = document.getElementById('global-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toast._t);
    toast._t = setTimeout(() => el.classList.remove('show'), 2400);
  }

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function normalizePreviewImg(src) {
    if (!src) return '';
    return String(src).replace(/^(\.\.\/)+/, '');
  }

  function toPostRelImg(src) {
    if (!src) return '';
    const clean = String(src).replace(/^(\.\.\/)+/, '').replace(/^\//, '');
    if (clean.startsWith('uploads/')) return '../' + clean;
    return src;
  }

  // Studio Lightbox
  const stLightbox = document.getElementById('st-lightbox');
  const stLbImg = document.getElementById('st-lb-img');
  function openStudioLightbox(src) {
    if (!stLightbox || !stLbImg) return;
    stLbImg.src = src;
    stLightbox.classList.add('open');
  }
  stLightbox?.addEventListener('click', () => stLightbox.classList.remove('open'));

  // Theme Sync (with View Transition Ripple when supported)
  const stThemeBtn = document.getElementById('st-theme-btn');
  function syncThemeIcons() {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    const sun = document.getElementById('st-sun');
    const moon = document.getElementById('st-moon');
    if (sun) sun.style.display = dark ? 'none' : 'inline-flex';
    if (moon) moon.style.display = dark ? 'inline-flex' : 'none';
  }
  syncThemeIcons();
  stThemeBtn?.addEventListener('click', e => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    const apply = () => {
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('blog-theme', next);
      syncThemeIcons();
    };
    if (!document.startViewTransition) {
      apply();
      return;
    }
    const x = e.clientX || window.innerWidth - 30;
    const y = e.clientY || 26;
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    document.documentElement.classList.add('theme-transitioning');
    const vt = document.startViewTransition(apply);
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${r}px at ${x}px ${y}px)`] },
        { duration: 380, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
    vt.finished.finally(() => document.documentElement.classList.remove('theme-transitioning'));
  });

  // Save / Dirty Status Indicator
  const saveIndEl = document.getElementById('st-save-indicator');
  const saveLabelEl = document.getElementById('st-save-label');

  function updateSaveStatusUI() {
    if (!saveIndEl || !saveLabelEl) return;
    if (activeTab === 'posts') {
      saveIndEl.style.display = 'inline-flex';
      saveIndEl.classList.toggle('is-dirty', isPostDirty);
      saveLabelEl.textContent = isPostDirty ? '未保存' : '已同步';
    } else if (activeTab === 'settings') {
      saveIndEl.style.display = 'inline-flex';
      saveIndEl.classList.toggle('is-dirty', isSettingsDirty);
      saveLabelEl.textContent = isSettingsDirty ? '设置未保存' : '已同步';
    } else {
      saveIndEl.style.display = 'none';
    }
  }

  const DRAFT_STORAGE_KEY = 'st-unsaved-draft-v1';
  let draftBackupTimer = null;

  function scheduleDraftBackup() {
    clearTimeout(draftBackupTimer);
    draftBackupTimer = setTimeout(() => {
      try {
        const titleEl = document.getElementById('doc-title');
        const wyEl = document.getElementById('wysiwyg-editor');
        const mdEl = document.getElementById('md-source-editor');
        if (!titleEl || !wyEl || !mdEl) return;
        const body = sourceMode ? mdEl.value : domToMarkdown(wyEl);
        if (!titleEl.value.trim() && !body.trim()) return;
        const payload = {
          slug: currentSlug || null,
          title: titleEl.value,
          category: document.getElementById('doc-category')?.value || '随笔',
          date: document.getElementById('doc-date')?.value || '',
          tags: [...currentTags],
          private: Boolean(document.getElementById('doc-private')?.checked),
          featured: Boolean(document.getElementById('doc-featured')?.checked),
          cover: currentCover || '',
          summary: document.getElementById('doc-summary')?.value || '',
          body,
          savedAt: Date.now(),
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(payload));
      } catch (_) {}
    }, 650);
  }

  function clearDraftBackup() {
    clearTimeout(draftBackupTimer);
    try { localStorage.removeItem(DRAFT_STORAGE_KEY); } catch (_) {}
    const bar = document.getElementById('st-draft-recover');
    if (bar) bar.style.display = 'none';
  }

  function markPostDirty() {
    if (!isPostDirty) {
      isPostDirty = true;
      updateSaveStatusUI();
    }
    scheduleDraftBackup();
  }

  // Calm Focus Dimming While Actively Typing
  window.addEventListener('mousemove', () => {
    document.body.classList.remove('is-typing');
  }, { passive: true });

  function markSettingsDirty() {
    if (!isSettingsDirty) {
      isSettingsDirty = true;
      updateSaveStatusUI();
    }
  }

  window.addEventListener('beforeunload', e => {
    if (isPostDirty || isSettingsDirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Auto-Grow Textareas
  function autoGrow(el) {
    if (!el || el.tagName !== 'TEXTAREA') return;
    el.style.height = 'auto';
    if (el.scrollHeight > 0) {
      el.style.height = el.scrollHeight + 'px';
    }
  }

  function refreshAllAutoGrow() {
    document.querySelectorAll('textarea[data-autogrow]').forEach(autoGrow);
  }

  document.querySelectorAll('textarea[data-autogrow]').forEach(ta => {
    ta.addEventListener('input', () => autoGrow(ta));
  });

  // Upload Helper
  function uploadFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: file.name || 'image.png', dataUrl: reader.result }),
          });
          const out = await res.json();
          if (out.ok) resolve(out.path);
          else reject(new Error(out.error || '上传失败'));
        } catch (e) {
          reject(e);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function chooseImages({ multiple = false } = {}, cb) {
    filePicker.multiple = multiple;
    pickerCallback = cb;
    filePicker.value = '';
    filePicker.click();
  }

  filePicker?.addEventListener('change', async () => {
    const files = Array.from(filePicker.files || []);
    if (!files.length || !pickerCallback) return;
    toast('正在保存图片到本地 uploads/ …');
    const paths = [];
    for (const f of files) paths.push(await uploadFile(f));
    toast('✓ 图片已就绪');
    pickerCallback(paths);
  });

  // ========================================================================
  // TOPBAR SPRING GLIDER & TAB SWITCHING
  // ========================================================================
  const mainSegNav = document.getElementById('st-main-seg');
  const segGlider = document.getElementById('st-seg-glider');
  const topPostActions = document.getElementById('topbar-post-actions');
  const topMomentsActions = document.getElementById('topbar-moments-actions');
  const topShelfActions = document.getElementById('topbar-shelf-actions');
  const topSettingsActions = document.getElementById('topbar-settings-actions');
  const collapseBtn = document.getElementById('btn-collapse-drawer');
  const wordStatEl = document.getElementById('doc-word-stat');
  let latestDocWordStatText = '0 字';

  function syncTopbarStatUI() {
    if (!wordStatEl) return;
    if (activeTab === 'posts') {
      wordStatEl.style.display = '';
      wordStatEl.textContent = latestDocWordStatText;
    } else if (activeTab === 'moments') {
      wordStatEl.style.display = '';
      wordStatEl.textContent = `共 ${allMoments.length} 条动态`;
    } else if (activeTab === 'shelf') {
      wordStatEl.style.display = '';
      wordStatEl.textContent = `共 ${allShelf.length} 件收藏`;
    } else {
      wordStatEl.style.display = 'none';
    }
  }

  function moveSegGlider(instant) {
    const activeBtn = mainSegNav?.querySelector('.st-seg-btn.active');
    if (!activeBtn || !segGlider) return;
    if (instant) segGlider.style.transition = 'none';
    segGlider.style.width = `${activeBtn.offsetWidth}px`;
    segGlider.style.transform = `translateX(${activeBtn.offsetLeft - 3}px)`;
    if (instant) {
      segGlider.offsetHeight;
      segGlider.style.transition = '';
    }
  }

  function switchStudioTab(tab, instant = false) {
    const prevTab = activeTab;
    activeTab = tab;
    document.body.classList.remove('is-typing');
    closeFloatingMenus();
    document.querySelectorAll('[data-st-tab]').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-st-tab') === tab);
    });
    moveSegGlider(instant);
    ['posts', 'moments', 'shelf', 'settings'].forEach(k => {
      const panel = document.getElementById('st-panel-' + k);
      if (!panel) return;
      if (k === tab) {
        panel.style.display = '';
        if (!instant && prevTab !== tab) {
          panel.classList.remove('is-entering');
          void panel.offsetWidth;
          panel.classList.add('is-entering');
        }
      } else {
        panel.style.display = 'none';
        panel.classList.remove('is-entering');
      }
    });
    if (topPostActions) topPostActions.style.display = tab === 'posts' ? 'inline-flex' : 'none';
    if (topMomentsActions) topMomentsActions.style.display = tab === 'moments' ? 'inline-flex' : 'none';
    if (topShelfActions) topShelfActions.style.display = tab === 'shelf' ? 'inline-flex' : 'none';
    if (topSettingsActions) topSettingsActions.style.display = tab === 'settings' ? 'inline-flex' : 'none';
    if (collapseBtn) collapseBtn.style.display = tab === 'posts' ? 'inline-flex' : 'none';
    updateSaveStatusUI();
    syncTopbarStatUI();
    if (!instant) {
      if (prevTab !== tab) window.scrollTo({ top: 0, behavior: 'instant' });
      const nextUrl =
        tab === 'posts'
          ? currentSlug
            ? `/studio.html?slug=${encodeURIComponent(currentSlug)}`
            : '/studio.html'
          : `/studio.html?tab=${encodeURIComponent(tab)}`;
      history.replaceState({}, '', nextUrl);
    }
    requestAnimationFrame(refreshAllAutoGrow);
  }

  document.querySelectorAll('[data-st-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchStudioTab(btn.getAttribute('data-st-tab')));
  });
  window.addEventListener('resize', () => moveSegGlider(true));
  requestAnimationFrame(() => moveSegGlider(true));

  // ========================================================================
  // BIDIRECTIONAL RICH DOM <-> CLEAN MARKDOWN SERIALIZER
  // ========================================================================
  function serializeInlineNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.nodeValue || '').replace(/\u00a0/g, ' ').replace(/\u200b/g, '');
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return '';
    const tag = node.tagName.toLowerCase();

    if (tag === 'br') return '\n';
    if (tag === 'img') {
      const alt = node.getAttribute('alt') || '';
      const src = toPostRelImg(node.getAttribute('src') || '');
      return `![${alt}](${src})`;
    }
    if (node.classList.contains('md-fn-back')) return '';
    if (tag === 'sup' && node.classList.contains('md-fn-ref')) {
      const fnId = node.getAttribute('data-fn') || (node.textContent || '').replace(/[\[\]\s]/g, '') || '1';
      return `[^${fnId}]`;
    }
    if (node.classList.contains('md-math-inline')) {
      const tex = (node.textContent || node.getAttribute('data-tex') || '').trim();
      return tex ? `$${tex}$` : '';
    }

    const inner = Array.from(node.childNodes).map(serializeInlineNode).join('');
    if (!inner && tag !== 'img') return '';

    if (tag === 'strong' || tag === 'b') return `**${inner.trim()}**`;
    if (tag === 'em' || tag === 'i') return `*${inner.trim()}*`;
    if (tag === 'u') return `++${inner.trim()}++`;
    if (tag === 'del' || tag === 's') return `~~${inner.trim()}~~`;
    if (tag === 'mark') return `==${inner.trim()}==`;
    if (node.classList.contains('md-spoiler')) return `||${inner.trim()}||`;
    if (tag === 'kbd') return `[[${inner.trim()}]]`;
    if (tag === 'sup') return `^${inner.trim()}^`;
    if (tag === 'sub') return `~${inner.trim()}~`;
    if (tag === 'code') return `\`${inner}\``;
    if (tag === 'a') {
      const href = node.getAttribute('href') || '#';
      return `[${inner}](${href})`;
    }
    return inner;
  }

  function domToMarkdown(container) {
    const blocks = [];

    function walkBlock(el) {
      if (el.nodeType === Node.TEXT_NODE) {
        const t = (el.nodeValue || '').replace(/\u00a0/g, ' ').replace(/\u200b/g, '').trim();
        if (t) blocks.push(t);
        return;
      }
      if (el.nodeType !== Node.ELEMENT_NODE) return;
      const tag = el.tagName.toLowerCase();

      if (el.classList.contains('code-block')) {
        const lang = el.querySelector('.code-lang')?.textContent?.trim() || 'text';
        const code = el.querySelector('code')?.textContent || '';
        blocks.push('```' + lang + '\n' + code.replace(/\n$/, '') + '\n```');
        return;
      }
      if (el.classList.contains('md-math-block')) {
        const tex = (el.querySelector('.md-math-src')?.textContent || el.textContent || '').trim();
        blocks.push('$$\n' + tex + '\n$$');
        return;
      }
      if (el.classList.contains('md-callout')) {
        const cType = (el.getAttribute('data-callout') || 'NOTE').toUpperCase();
        const titleEl = el.querySelector('.md-callout-title');
        const cTitle = titleEl ? Array.from(titleEl.childNodes).map(serializeInlineNode).join('').trim() : '';
        const bodyEl = el.querySelector('.md-callout-body');
        const pEls = bodyEl ? bodyEl.querySelectorAll(':scope > p') : [];
        const bodyLines = pEls.length
          ? Array.from(pEls).map(p => Array.from(p.childNodes).map(serializeInlineNode).join('').trim())
          : (bodyEl?.innerText || '').trim().split('\n');
        const outLines = [`> [!${cType}]${cTitle ? ' ' + cTitle : ''}`, ...bodyLines.map(l => '> ' + l)];
        blocks.push(outLines.join('\n'));
        return;
      }
      if (tag === 'details' || el.classList.contains('md-details')) {
        const sumEl = el.querySelector('summary');
        const sumTxt = sumEl ? Array.from(sumEl.childNodes).map(serializeInlineNode).join('').trim() : '点击展开详情';
        const bodyEl = el.querySelector('.md-details-body');
        const innerMd = bodyEl ? domToMarkdown(bodyEl) : '';
        blocks.push(`:::details ${sumTxt || '点击展开详情'}\n${innerMd}\n:::`);
        return;
      }
      if (el.classList.contains('md-bookmark')) {
        const bmTitle = el.querySelector('.md-bm-title')?.textContent?.trim() || el.getAttribute('data-bm-title') || '网页书签';
        const bmUrl = el.getAttribute('data-bm-url') || el.getAttribute('href') || 'https://';
        const bmDesc = el.querySelector('.md-bm-desc')?.textContent?.trim() || el.getAttribute('data-bm-desc') || '';
        blocks.push(`:::bookmark ${bmTitle} | ${bmUrl}${bmDesc ? ' | ' + bmDesc : ''}`);
        return;
      }
      if (el.classList.contains('md-footnotes')) {
        const fnLines = [];
        el.querySelectorAll('li[data-fn-id]').forEach(li => {
          const id = li.getAttribute('data-fn-id') || '1';
          const txtEl = li.querySelector('.md-fn-text') || li;
          const txt = Array.from(txtEl.childNodes).map(serializeInlineNode).join('').trim();
          if (txt) fnLines.push(`[^${id}]: ${txt}`);
        });
        if (fnLines.length) blocks.push(fnLines.join('\n'));
        return;
      }
      if (tag === 'pre') {
        const code = el.textContent || '';
        blocks.push('```text\n' + code.replace(/\n$/, '') + '\n```');
        return;
      }
      if (tag === 'hr') {
        blocks.push('---');
        return;
      }
      if (/^h[1-4]$/.test(tag)) {
        const lvl = Math.min(4, Math.max(1, Number(tag[1])));
        const txt = Array.from(el.childNodes).map(serializeInlineNode).join('').trim();
        if (txt) blocks.push('#'.repeat(lvl) + ' ' + txt);
        return;
      }
      if (tag === 'figure') {
        const media = el.querySelector('img, video, audio');
        if (media) {
          const cap = el.querySelector('figcaption, .md-audio-title')?.textContent?.trim() || '';
          const src = toPostRelImg(media.getAttribute('src') || '');
          blocks.push(`![${cap}](${src})`);
        }
        return;
      }
      if (tag === 'blockquote') {
        const pEls = el.querySelectorAll(':scope > p');
        const lines = pEls.length
          ? Array.from(pEls).map(p => Array.from(p.childNodes).map(serializeInlineNode).join('').trim()).filter(Boolean)
          : el.innerText.trim().split('\n').filter(Boolean);
        if (lines.length) blocks.push(lines.map(l => '> ' + l).join('\n'));
        return;
      }
      if (el.classList.contains('table-wrap') || tag === 'table') {
        const tbl = tag === 'table' ? el : el.querySelector('table');
        if (tbl) {
          const thEls = Array.from(tbl.querySelectorAll('thead th'));
          const ths = thEls.map(th => Array.from(th.childNodes).map(serializeInlineNode).join('').replace(/\n+/g, ' ').trim());
          const aligns = thEls.map(th => {
            const al = th.getAttribute('data-align') || th.style.textAlign || 'left';
            if (al === 'center') return ':---:';
            if (al === 'right') return '---:';
            return ':---';
          });
          const rows = Array.from(tbl.querySelectorAll('tbody tr')).map(tr =>
            Array.from(tr.querySelectorAll('td')).map(td =>
              Array.from(td.childNodes).map(serializeInlineNode).join('').replace(/\n+/g, ' ').trim()
            )
          );
          if (ths.length) {
            const mdTable = [
              '| ' + ths.join(' | ') + ' |',
              '| ' + aligns.join(' | ') + ' |',
              ...rows.map(r => '| ' + ths.map((_, i) => r[i] || '').join(' | ') + ' |'),
            ];
            blocks.push(mdTable.join('\n'));
          }
        }
        return;
      }
      if (tag === 'ul') {
        const items = [];
        el.querySelectorAll(':scope > li').forEach(li => {
          if (li.classList.contains('task-item')) {
            const done = li.classList.contains('done');
            const clone = li.cloneNode(true);
            clone.querySelector('.task-box')?.remove();
            const txt = Array.from(clone.childNodes).map(serializeInlineNode).join('').trim();
            items.push(`- [${done ? 'x' : ' '}] ${txt}`);
          } else {
            const txt = Array.from(li.childNodes).map(serializeInlineNode).join('').trim();
            items.push(`- ${txt}`);
          }
        });
        if (items.length) blocks.push(items.join('\n'));
        return;
      }
      if (tag === 'ol') {
        const items = [];
        el.querySelectorAll(':scope > li').forEach((li, idx) => {
          const txt = Array.from(li.childNodes).map(serializeInlineNode).join('').trim();
          items.push(`${idx + 1}. ${txt}`);
        });
        if (items.length) blocks.push(items.join('\n'));
        return;
      }
      if (tag === 'p' || tag === 'div') {
        const hasBlockChild = Array.from(el.children).some(c =>
          /^(P|DIV|H1|H2|H3|H4|UL|OL|BLOCKQUOTE|PRE|FIGURE|HR|TABLE|DETAILS|SECTION)$/.test(c.tagName)
        );
        if (hasBlockChild) {
          Array.from(el.childNodes).forEach(walkBlock);
          return;
        }
        const txt = Array.from(el.childNodes).map(serializeInlineNode).join('').trim();
        if (txt) blocks.push(txt);
        return;
      }

      const fallback = Array.from(el.childNodes).map(serializeInlineNode).join('').trim();
      if (fallback) blocks.push(fallback);
    }

    Array.from(container.childNodes).forEach(walkBlock);
    return blocks.join('\n\n').trim();
  }

  const CODE_LANG_OPTIONS = ['text', 'js', 'ts', 'python', 'bash', 'html', 'css', 'json', 'sql', 'go', 'rust', 'java', 'c', 'cpp', 'yaml', 'md'];

  function buildEditorCodeBlock(lang = 'text', codeText = '\n') {
    const cleanLang = (lang || 'text').trim().toLowerCase() || 'text';
    const langs = CODE_LANG_OPTIONS.includes(cleanLang) ? CODE_LANG_OPTIONS : [cleanLang, ...CODE_LANG_OPTIONS];
    const wrap = document.createElement('div');
    wrap.className = 'code-block';
    const header = document.createElement('div');
    header.className = 'code-header';
    header.setAttribute('contenteditable', 'false');
    header.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:6px;">
        <span class="code-lang" style="display:none;">${escapeHtml(cleanLang)}</span>
        <select class="st-code-lang-select" title="选择代码语言">
          ${langs.map(l => `<option value="${escapeHtml(l)}" ${l === cleanLang ? 'selected' : ''}>${escapeHtml(l)}</option>`).join('')}
        </select>
      </span>
      <button type="button" class="st-code-exit-btn" data-code-exit="1" title="在代码块下方插入新段落 (Ctrl+Enter)">下方插入段落 ↵</button>`;
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.textContent = codeText || '\n';
    pre.appendChild(code);
    wrap.append(header, pre);
    return wrap;
  }

  function upgradeVisualCodeBlocks(root) {
    if (!root) return;
    root.querySelectorAll('.code-block').forEach(cb => {
      const lang = cb.querySelector('.code-lang')?.textContent?.trim() || 'text';
      const code = cb.querySelector('code')?.textContent || '\n';
      if (!cb.querySelector('.st-code-lang-select')) {
        cb.replaceWith(buildEditorCodeBlock(lang, code));
      }
    });
    root.querySelectorAll(':scope > pre').forEach(pre => {
      const code = pre.textContent || '\n';
      pre.replaceWith(buildEditorCodeBlock('text', code));
    });
  }

  async function markdownToVisualHtml(md) {
    const normalizedMd = String(md || '').replaceAll('](../uploads/', '](uploads/');
    const res = await fetch('/api/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markdown: normalizedMd }),
    });
    const out = await res.json();
    const tmp = document.createElement('div');
    tmp.innerHTML = out.html || '';
    upgradeVisualCodeBlocks(tmp);
    tmp.querySelectorAll('details.md-details').forEach(det => det.setAttribute('open', ''));
    tmp.querySelectorAll('a.md-bookmark').forEach(bm => {
      const div = document.createElement('div');
      div.className = 'md-bookmark';
      div.setAttribute('data-bm-title', bm.getAttribute('data-bm-title') || '');
      div.setAttribute('data-bm-url', bm.getAttribute('data-bm-url') || bm.getAttribute('href') || '');
      div.setAttribute('data-bm-desc', bm.getAttribute('data-bm-desc') || '');
      div.innerHTML = bm.innerHTML;
      bm.replaceWith(div);
    });
    tmp.querySelectorAll('.code-header, .task-box, .md-callout-ico, .md-fn-back').forEach(el => el.setAttribute('contenteditable', 'false'));
    tmp.querySelectorAll('[data-zoomable]').forEach(el => el.removeAttribute('data-zoomable'));
    tmp.querySelectorAll('figure.post-figure').forEach(fig => {
      if (!fig.querySelector('figcaption') && fig.querySelector('img')) {
        fig.appendChild(document.createElement('figcaption'));
      }
    });
    return tmp.innerHTML;
  }

  // ========================================================================
  // PAGE 1: NOTION / FEISHU PAPER DOCUMENT CONTROLLER
  // ========================================================================
  const docWorkspace = document.getElementById('doc-workspace');
  const docListEl = document.getElementById('doc-list');
  const docFilterInput = document.getElementById('doc-filter');
  const docFilterClear = document.getElementById('doc-filter-clear');
  const docTitleEl = document.getElementById('doc-title');
  const docCatEl = document.getElementById('doc-category');
  const catTokenBtn = document.getElementById('cat-token-btn');
  const catTokenLabel = document.getElementById('cat-token-label');
  const catPopover = document.getElementById('cat-popover');
  const catOptionsBox = document.getElementById('cat-options-box');
  const catNewInput = document.getElementById('cat-new-input');
  const docDateEl = document.getElementById('doc-date');
  const dateTokenBtn = document.getElementById('date-token-btn');
  const dateTokenLabel = document.getElementById('date-token-label');
  const docPrivEl = document.getElementById('doc-private');
  const privTokenBtn = document.getElementById('priv-token-btn');
  const privTokenLabel = document.getElementById('priv-token-label');
  const docFeatEl = document.getElementById('doc-featured');
  const featTokenBtn = document.getElementById('feat-token-btn');
  const featTokenLabel = document.getElementById('feat-token-label');
  const docSumWrap = document.getElementById('doc-summary-wrap');
  const docSumEl = document.getElementById('doc-summary');
  const wysiwygEl = document.getElementById('wysiwyg-editor');
  const mdSourceEl = document.getElementById('md-source-editor');
  const coverBanner = document.getElementById('doc-cover-banner');
  const coverImg = document.getElementById('doc-cover-img');
  const addCoverGhost = document.getElementById('btn-add-cover-ghost');
  const tagChipsBox = document.getElementById('tag-chips-wrap');
  const tagInput = document.getElementById('tag-inline-input');
  const viewLiveLink = document.getElementById('doc-view-live');
  const delPostBtn = document.getElementById('doc-del-btn');
  const modeSwitchBtn = document.getElementById('btn-toggle-source');
  const gutterPlus = document.getElementById('gutter-plus');
  const selBubble = document.getElementById('selection-bubble');
  const sbCmdsGroup = document.getElementById('sb-cmds-group');
  const sbLinkBox = document.getElementById('sb-link-box');
  const sbLinkInput = document.getElementById('sb-link-input');
  const slashMenu = document.getElementById('slash-menu');
  const imgActionBar = document.getElementById('img-action-bar');
  const outlineRail = document.getElementById('st-outline-rail');
  const outlineList = document.getElementById('st-outline-list');

  let slashOpen = false;
  let slashTriggeredByTypedChar = false;
  let slashIdx = 0;
  let activeEditorBlock = null;
  let selectedFigure = null;
  let savedSelectionRange = null;

  try {
    document.execCommand('defaultParagraphSeparator', false, 'p');
  } catch (_) {}

  const toggleSumBtn = document.getElementById('btn-toggle-summary');
  const clearSumBtn = document.getElementById('btn-clear-summary');
  const bottomStatEl = document.getElementById('doc-bottom-stat');
  let docRailFilter = 'all';

  function toggleSidebarRail() {
    const collapsed = docWorkspace.classList.toggle('rail-collapsed');
    collapseBtn?.classList.toggle('active', collapsed);
  }

  collapseBtn?.addEventListener('click', toggleSidebarRail);

  function renderCoverState() {
    const hasCover = Boolean(currentCover);
    if (hasCover) {
      coverImg.src = normalizePreviewImg(currentCover);
      coverBanner.style.display = 'block';
    } else {
      coverBanner.style.display = 'none';
    }
    if (addCoverGhost) {
      addCoverGhost.classList.toggle('is-active', hasCover);
      const sp = addCoverGhost.querySelector('span');
      if (sp) sp.textContent = hasCover ? '已设题图' : '题图';
    }
  }

  function syncSummaryBtnState() {
    const hasSum = Boolean((docSumEl?.value || '').trim());
    const isOpen = docSumWrap?.classList.contains('open');
    toggleSumBtn?.classList.toggle('is-active', hasSum || isOpen);
  }

  function pickCover() {
    chooseImages({ multiple: false }, paths => {
      if (paths[0]) {
        currentCover = paths[0];
        renderCoverState();
        markPostDirty();
      }
    });
  }
  addCoverGhost?.addEventListener('click', pickCover);
  document.getElementById('btn-change-cover')?.addEventListener('click', pickCover);
  document.getElementById('btn-remove-cover')?.addEventListener('click', () => {
    currentCover = '';
    renderCoverState();
    markPostDirty();
  });

  toggleSumBtn?.addEventListener('click', () => {
    const open = docSumWrap.classList.toggle('open');
    syncSummaryBtnState();
    if (open) {
      autoGrow(docSumEl);
      docSumEl.focus();
    }
  });
  clearSumBtn?.addEventListener('click', () => {
    if (docSumEl) docSumEl.value = '';
    docSumWrap?.classList.remove('open');
    syncSummaryBtnState();
    markPostDirty();
  });
  docSumEl?.addEventListener('input', () => {
    syncSummaryBtnState();
    markPostDirty();
  });
  docTitleEl?.addEventListener('input', () => {
    document.body.classList.add('is-typing');
    markPostDirty();
  });

  function rebuildCategoryDropdown() {
    const allCats = Array.from(
      new Set([...(siteConfig.categories || []), ...allPosts.map(p => p.category).filter(Boolean), '技术与折腾', '随笔', '私密日记'])
    );
    if (!catOptionsBox) return;
    catOptionsBox.innerHTML = allCats
      .map(
        c =>
          `<button type="button" class="st-popover-opt ${c === docCatEl.value ? 'active' : ''}" data-cat-opt="${escapeHtml(c)}">${escapeHtml(c)}</button>`
      )
      .join('');
    catOptionsBox.querySelectorAll('[data-cat-opt]').forEach(opt => {
      opt.addEventListener('click', e => {
        e.stopPropagation();
        const val = opt.getAttribute('data-cat-opt');
        docCatEl.value = val;
        if (val.includes('私密')) docPrivEl.checked = true;
        catPopover.classList.remove('open');
        syncPostTokensUI();
        markPostDirty();
      });
    });
  }

  catNewInput?.addEventListener('click', e => e.stopPropagation());
  catNewInput?.addEventListener('keydown', async e => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      const name = catNewInput.value.trim();
      if (!name) return;
      catNewInput.value = '';
      if (!Array.isArray(siteConfig.categories)) siteConfig.categories = [];
      if (!siteConfig.categories.includes(name)) {
        siteConfig.categories.push(name);
        await fetch('/api/site', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(siteConfig),
        });
        editCategories = [...siteConfig.categories];
        renderDecorCategories();
      }
      docCatEl.value = name;
      if (name.includes('私密')) docPrivEl.checked = true;
      rebuildCategoryDropdown();
      catPopover.classList.remove('open');
      syncPostTokensUI();
      markPostDirty();
      toast(`✓ 已切换到新分类「${name}」`);
    }
  });

  function syncPostTokensUI() {
    const cat = docCatEl.value || '随笔';
    catTokenLabel.textContent = cat;
    catOptionsBox?.querySelectorAll('[data-cat-opt]').forEach(opt => {
      opt.classList.toggle('active', opt.getAttribute('data-cat-opt') === cat);
    });

    const d = docDateEl.value || new Date().toISOString().slice(0, 10);
    dateTokenLabel.textContent = d.replace(/-/g, '.');

    const isPriv = docPrivEl.checked;
    privTokenBtn.classList.toggle('is-private', isPriv);
    privTokenLabel.textContent = isPriv ? '仅自己可见' : '公开';

    const isFeat = docFeatEl.checked;
    featTokenBtn.classList.toggle('is-featured', isFeat);
    featTokenLabel.textContent = isFeat ? '已置顶' : '置顶';
  }

  catTokenBtn?.addEventListener('click', e => {
    e.stopPropagation();
    catPopover.classList.toggle('open');
  });

  dateTokenBtn?.addEventListener('click', () => {
    if (typeof docDateEl.showPicker === 'function') docDateEl.showPicker();
    else docDateEl.click();
  });
  docDateEl?.addEventListener('change', () => {
    syncPostTokensUI();
    markPostDirty();
  });

  privTokenBtn?.addEventListener('click', () => {
    docPrivEl.checked = !docPrivEl.checked;
    syncPostTokensUI();
    markPostDirty();
  });

  featTokenBtn?.addEventListener('click', () => {
    docFeatEl.checked = !docFeatEl.checked;
    syncPostTokensUI();
    markPostDirty();
  });

  function renderTagChips() {
    tagChipsBox.innerHTML = currentTags
      .map(
        (t, i) =>
          `<span class="st-tag-pill">#${escapeHtml(t)}<button type="button" data-rm-tag="${i}">×</button></span>`
      )
      .join('');
    tagChipsBox.querySelectorAll('[data-rm-tag]').forEach(b => {
      b.addEventListener('click', () => {
        currentTags.splice(Number(b.getAttribute('data-rm-tag')), 1);
        renderTagChips();
        markPostDirty();
      });
    });
  }

  tagInput?.addEventListener('compositionstart', () => { isComposing = true; });
  tagInput?.addEventListener('compositionend', () => { isComposing = false; });
  tagInput?.addEventListener('keydown', e => {
    if (e.isComposing || isComposing) return;
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const val = tagInput.value.replace(/[,，#]/g, '').trim();
      if (val && !currentTags.includes(val)) {
        currentTags.push(val);
        renderTagChips();
        markPostDirty();
      }
      tagInput.value = '';
    } else if (e.key === 'Backspace' && !tagInput.value && currentTags.length) {
      currentTags.pop();
      renderTagChips();
      markPostDirty();
    }
  });

  docTitleEl?.addEventListener('compositionstart', () => { isComposing = true; });
  docTitleEl?.addEventListener('compositionend', () => { isComposing = false; });
  docTitleEl?.addEventListener('keydown', e => {
    if (e.isComposing || isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      focusEditorStart();
    }
  });

  function placeCaretAtStart(el) {
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function placeCaretAtEnd(el) {
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function placeCaretAfter(node) {
    const range = document.createRange();
    range.setStartAfter(node);
    range.collapse(true);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  function focusEditorStart() {
    if (sourceMode) {
      mdSourceEl.focus();
      return;
    }
    ensureInitialParagraph();
    placeCaretAtStart(wysiwygEl.firstElementChild);
  }

  document.getElementById('paper-click-zone')?.addEventListener('mousedown', e => {
    if (e.target.id === 'paper-click-zone' || e.target.classList.contains('st-paper-column')) {
      e.preventDefault();
      clearSelectedFigure();
      if (sourceMode) {
        mdSourceEl.focus();
      } else {
        ensureInitialParagraph();
        placeCaretAtEnd(wysiwygEl.lastElementChild);
      }
    }
  });

  function syncEditorBlankState() {
    if (!wysiwygEl) return;
    const raw = (wysiwygEl.textContent || '').replace(/\u200b/g, '').trim();
    const hasMedia = Boolean(wysiwygEl.querySelector('img, hr, pre, ul, ol, blockquote, table'));
    const isBlank = !raw && !hasMedia;
    wysiwygEl.classList.toggle('is-blank', isBlank);
    if (isBlank) {
      const p = wysiwygEl.querySelector('p');
      if (p) p.setAttribute('data-placeholder', wysiwygEl.getAttribute('data-placeholder') || '');
    }
  }

  function ensureInitialParagraph() {
    if (!wysiwygEl) return;
    if (!wysiwygEl.firstElementChild) {
      const txt = wysiwygEl.textContent || '';
      wysiwygEl.innerHTML = '';
      const p = document.createElement('p');
      if (txt) p.textContent = txt;
      else p.innerHTML = '<br>';
      wysiwygEl.appendChild(p);
      if (document.activeElement === wysiwygEl) {
        placeCaretAtEnd(p);
      }
    }
    syncEditorBlankState();
  }

  // Live Right-Margin Document Outline (Visual + Markdown Modes + Scroll Spy)
  const railFilesPane = document.getElementById('rail-files-pane');
  const railOutlinePane = document.getElementById('rail-outline-pane');
  const railOutlineList = document.getElementById('rail-outline-list');
  let outlineHeadings = [];

  document.querySelectorAll('[data-rail-mode]').forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.getAttribute('data-rail-mode') || 'files';
      document.querySelectorAll('[data-rail-mode]').forEach(b => b.classList.toggle('active', b === btn));
      if (railFilesPane) railFilesPane.style.display = mode === 'files' ? 'flex' : 'none';
      if (railOutlinePane) railOutlinePane.style.display = mode === 'outline' ? 'flex' : 'none';
      if (mode === 'outline') refreshLiveOutline();
    });
  });

  function syncOutlineScrollActive() {
    if (!outlineHeadings.length || sourceMode) return;
    let activeIdx = 0;
    for (let i = 0; i < outlineHeadings.length; i++) {
      const rect = outlineHeadings[i].getBoundingClientRect();
      if (rect.top <= 160) activeIdx = i;
    }
    outlineList?.querySelectorAll('[data-outline-idx]').forEach((b, idx) => {
      b.classList.toggle('active', idx === activeIdx);
    });
    railOutlineList?.querySelectorAll('[data-outline-idx]').forEach((b, idx) => {
      b.classList.toggle('active', idx === activeIdx);
    });
  }

  function refreshLiveOutline() {
    if (activeTab !== 'posts') {
      if (outlineRail) outlineRail.style.display = 'none';
      return;
    }
    const emptyOutlineHtml =
      `<div style="padding:24px 10px; text-align:center; font-size:12px; color:var(--st-ink-3);">` +
      `暂无章节标题` +
      `<div style="margin-top:4px; font-size:11px; opacity:0.75;">输入 # 空格 或按 Ctrl+2 创建标题</div>` +
      `</div>`;

    if (sourceMode) {
      const lines = (mdSourceEl?.value || '').split('\n');
      const mdHeads = [];
      let inFence = false;
      lines.forEach((ln, lineIdx) => {
        if (/^```/.test(ln.trim())) inFence = !inFence;
        if (!inFence) {
          const m = ln.match(/^(#{1,4})\s+(.+)$/);
          if (m) mdHeads.push({ level: m[1].length, text: m[2].trim(), lineIdx });
        }
      });
      outlineHeadings = [];

      if (railOutlineList) {
        if (!mdHeads.length) {
          railOutlineList.innerHTML = emptyOutlineHtml;
        } else {
          railOutlineList.innerHTML = mdHeads
            .map(
              (h, i) =>
                `<button type="button" class="st-rail-outline-item lvl-${h.level}" data-md-head="${i}">${escapeHtml(h.text)}</button>`
            )
            .join('');
          railOutlineList.querySelectorAll('[data-md-head]').forEach(btn => {
            btn.addEventListener('click', () => {
              const target = mdHeads[Number(btn.getAttribute('data-md-head'))];
              if (!target || !mdSourceEl) return;
              const allLines = mdSourceEl.value.split('\n');
              const charPos = allLines.slice(0, target.lineIdx).join('\n').length + (target.lineIdx > 0 ? 1 : 0);
              mdSourceEl.focus();
              mdSourceEl.setSelectionRange(charPos, charPos);
            });
          });
        }
      }

      if (!outlineRail || !outlineList || mdHeads.length < 2) {
        if (outlineRail) outlineRail.style.display = 'none';
        return;
      }
      outlineRail.style.display = 'block';
      outlineList.innerHTML = mdHeads
        .map(
          (h, i) =>
            `<button type="button" class="st-outline-item ${h.level >= 3 ? 'is-h3' : ''}" data-md-head="${i}">${escapeHtml(h.text)}</button>`
        )
        .join('');
      outlineList.querySelectorAll('[data-md-head]').forEach(btn => {
        btn.addEventListener('click', () => {
          const target = mdHeads[Number(btn.getAttribute('data-md-head'))];
          if (!target || !mdSourceEl) return;
          const allLines = mdSourceEl.value.split('\n');
          const charPos = allLines.slice(0, target.lineIdx).join('\n').length + (target.lineIdx > 0 ? 1 : 0);
          mdSourceEl.focus();
          mdSourceEl.setSelectionRange(charPos, charPos);
        });
      });
      return;
    }

    outlineHeadings = Array.from(wysiwygEl.querySelectorAll('h1, h2, h3, h4')).filter(h => (h.textContent || '').trim());

    if (railOutlineList) {
      if (!outlineHeadings.length) {
        railOutlineList.innerHTML = emptyOutlineHtml;
      } else {
        railOutlineList.innerHTML = outlineHeadings
          .map((h, i) => {
            const lvl = Number(h.tagName.slice(1)) || 2;
            return `<button type="button" class="st-rail-outline-item lvl-${lvl}" data-outline-idx="${i}">${escapeHtml(h.textContent.trim())}</button>`;
          })
          .join('');
        railOutlineList.querySelectorAll('[data-outline-idx]').forEach(btn => {
          btn.addEventListener('click', () => {
            const target = outlineHeadings[Number(btn.getAttribute('data-outline-idx'))];
            target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          });
        });
      }
    }

    if (!outlineRail || !outlineList || outlineHeadings.length < 2) {
      if (outlineRail) outlineRail.style.display = 'none';
      syncOutlineScrollActive();
      return;
    }
    outlineRail.style.display = 'block';
    outlineList.innerHTML = outlineHeadings
      .map(
        (h, i) =>
          `<button type="button" class="st-outline-item ${h.tagName === 'H3' || h.tagName === 'H4' ? 'is-h3' : ''}" data-outline-idx="${i}">${escapeHtml(h.textContent.trim())}</button>`
      )
      .join('');
    outlineList.querySelectorAll('[data-outline-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = outlineHeadings[Number(btn.getAttribute('data-outline-idx'))];
        target?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
    syncOutlineScrollActive();
  }

  window.addEventListener('scroll', syncOutlineScrollActive, { passive: true });

  function updateDocWordCount() {
    const text = sourceMode ? mdSourceEl.value : wysiwygEl.innerText || '';
    const count = text.replace(/\s+/g, '').length;
    const mins = Math.max(1, Math.round(count / 320));
    const paras = sourceMode
      ? (mdSourceEl.value || '').split(/\n{2,}/).map(s => s.trim()).filter(Boolean).length
      : Array.from(wysiwygEl.children || []).filter(el => (el.textContent || '').trim() || el.querySelector?.('img, hr, pre')).length;
    latestDocWordStatText = count > 0 ? `${count} 字` : '0 字';
    syncTopbarStatUI();
    if (bottomStatEl) {
      bottomStatEl.textContent = count > 0 ? `${count} 字 · ${paras} 段 · 预计阅读 ${mins} 分钟` : '0 字 · 0 段';
    }
    syncEditorBlankState();
    refreshLiveOutline();
  }

  // Image Selection & Floating Image Action Bar
  function clearSelectedFigure() {
    if (selectedFigure) {
      selectedFigure.classList.remove('selected');
      selectedFigure = null;
    }
    imgActionBar?.classList.remove('open');
  }

  function selectFigureInEditor(fig) {
    clearSelectedFigure();
    selectedFigure = fig;
    fig.classList.add('selected');
    const img = fig.querySelector('img') || fig;
    const rect = img.getBoundingClientRect();
    imgActionBar.style.left = `${rect.left + rect.width / 2}px`;
    imgActionBar.style.top = `${Math.max(60, rect.top)}px`;
    imgActionBar.classList.add('open');
  }

  imgActionBar?.querySelectorAll('[data-img-act]').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => {
      if (!selectedFigure) return;
      const act = btn.getAttribute('data-img-act');
      if (act === 'compact') {
        selectedFigure.classList.add('is-compact');
        selectFigureInEditor(selectedFigure);
      } else if (act === 'full') {
        selectedFigure.classList.remove('is-compact');
        selectFigureInEditor(selectedFigure);
      } else if (act === 'replace') {
        const targetFig = selectedFigure;
        chooseImages({ multiple: false }, paths => {
          const img = targetFig.querySelector('img');
          if (img && paths[0]) {
            img.src = paths[0];
            markPostDirty();
          }
        });
      } else if (act === 'delete') {
        const nextP = selectedFigure.nextElementSibling;
        selectedFigure.remove();
        clearSelectedFigure();
        ensureInitialParagraph();
        if (nextP) placeCaretAtStart(nextP);
        updateDocWordCount();
        markPostDirty();
      }
    });
  });

  window.addEventListener('scroll', () => {
    if (selectedFigure && imgActionBar?.classList.contains('open')) {
      const img = selectedFigure.querySelector('img') || selectedFigure;
      const rect = img.getBoundingClientRect();
      imgActionBar.style.left = `${rect.left + rect.width / 2}px`;
      imgActionBar.style.top = `${Math.max(60, rect.top)}px`;
    }
  }, { passive: true });

  // ========================================================================
  // RICH EDITOR ENGINE (IME-SAFE + BLOCK & INLINE MARKDOWN LIVE TRIGGERS)
  // ========================================================================
  wysiwygEl?.addEventListener('compositionstart', () => {
    isComposing = true;
  });
  wysiwygEl?.addEventListener('compositionend', () => {
    isComposing = false;
    updateDocWordCount();
  });

  function getTopLevelBlock(node) {
    let cur = node?.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    while (cur && cur.parentElement && cur.parentElement !== wysiwygEl) {
      cur = cur.parentElement;
    }
    return cur && cur.parentElement === wysiwygEl ? cur : null;
  }

  function syncGutterPlus() {
    if (sourceMode || !gutterPlus || !wysiwygEl) {
      gutterPlus?.classList.remove('visible');
      return;
    }
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !wysiwygEl.contains(sel.anchorNode)) {
      gutterPlus.classList.remove('visible');
      return;
    }
    const block = getTopLevelBlock(sel.anchorNode);
    if (!block) {
      gutterPlus.classList.remove('visible');
      return;
    }
    activeEditorBlock = block;
    gutterPlus.style.top = `${block.offsetTop + 3}px`;
    gutterPlus.classList.add('visible');
  }

  const tableActionBar = document.getElementById('table-action-bar');
  const tpParaBtn = document.getElementById('tp-para-btn');
  const tpParaPop = document.getElementById('tp-para-pop');
  const tpFmtBtn = document.getElementById('tp-fmt-btn');
  const tpFmtPop = document.getElementById('tp-fmt-pop');
  let activeTableCell = null;

  function clearActiveTableBar() {
    activeTableCell = null;
    tableActionBar?.classList.remove('open');
  }

  function syncActiveTableBar() {
    if (sourceMode || !tableActionBar || !wysiwygEl) {
      clearActiveTableBar();
      return;
    }
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !wysiwygEl.contains(sel.anchorNode)) {
      clearActiveTableBar();
      return;
    }
    const anchor = sel.anchorNode.nodeType === Node.TEXT_NODE ? sel.anchorNode.parentElement : sel.anchorNode;
    const cell = anchor?.closest('td, th');
    if (!cell) {
      clearActiveTableBar();
      return;
    }
    activeTableCell = cell;
    const tbl = cell.closest('.table-wrap') || cell.closest('table');
    if (tbl) {
      const rect = tbl.getBoundingClientRect();
      tableActionBar.style.left = `${Math.max(180, Math.min(window.innerWidth - 180, rect.left + rect.width / 2))}px`;
      tableActionBar.style.top = `${Math.max(60, rect.top)}px`;
      tableActionBar.classList.add('open');
    }
  }

  tableActionBar?.querySelectorAll('[data-tbl-act]').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => {
      if (!activeTableCell) return;
      const tbl = activeTableCell.closest('table');
      if (!tbl) return;
      const act = btn.getAttribute('data-tbl-act');
      const row = activeTableCell.parentElement;
      const colIdx = Array.from(row.children).indexOf(activeTableCell);
      const colCount = tbl.querySelector('thead tr')?.children.length || row.children.length;

      if (act === 'row-below') {
        const tbody = tbl.querySelector('tbody') || tbl.appendChild(document.createElement('tbody'));
        const newTr = document.createElement('tr');
        for (let c = 0; c < colCount; c++) {
          const td = document.createElement('td');
          const th = tbl.querySelectorAll('thead th')[c];
          const al = th?.getAttribute('data-align') || 'left';
          if (al !== 'left') { td.style.textAlign = al; td.setAttribute('data-align', al); }
          td.innerHTML = '<br>';
          newTr.appendChild(td);
        }
        if (row.parentElement.tagName === 'THEAD') tbody.prepend(newTr);
        else row.after(newTr);
        placeCaretAtStart(newTr.firstElementChild);
      } else if (act === 'col-right') {
        tbl.querySelectorAll('tr').forEach((tr, rIdx) => {
          const isHead = tr.parentElement.tagName === 'THEAD' || rIdx === 0;
          const cellEl = document.createElement(isHead ? 'th' : 'td');
          cellEl.innerHTML = isHead ? '新列' : '<br>';
          if (isHead) cellEl.setAttribute('data-align', 'left');
          const ref = tr.children[colIdx];
          if (ref) ref.after(cellEl);
          else tr.appendChild(cellEl);
        });
      } else if (act === 'align-left' || act === 'align-center' || act === 'align-right') {
        const al = act.replace('align-', '');
        tbl.querySelectorAll('tr').forEach(tr => {
          const c = tr.children[colIdx];
          if (c) {
            c.style.textAlign = al === 'left' ? '' : al;
            c.setAttribute('data-align', al);
          }
        });
      } else if (act === 'del-row') {
        if (row.parentElement.tagName === 'TBODY') {
          const tbody = row.parentElement;
          if (tbody.children.length > 1) {
            const nextFocus = (row.nextElementSibling || row.previousElementSibling)?.children[colIdx];
            row.remove();
            if (nextFocus) placeCaretAtStart(nextFocus);
          } else {
            Array.from(row.children).forEach(td => { td.innerHTML = '<br>'; });
          }
        }
      } else if (act === 'del-col') {
        if (colCount > 1) {
          tbl.querySelectorAll('tr').forEach(tr => tr.children[colIdx]?.remove());
          const firstCell = tbl.querySelector('td, th');
          if (firstCell) placeCaretAtStart(firstCell);
        }
      } else if (act === 'del-table') {
        const wrap = tbl.closest('.table-wrap') || tbl;
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        wrap.replaceWith(p);
        clearActiveTableBar();
        placeCaretAtStart(p);
      }
      syncActiveTableBar();
      updateDocWordCount();
      markPostDirty();
    });
  });

  window.addEventListener('scroll', () => {
    if (activeTableCell && tableActionBar?.classList.contains('open')) syncActiveTableBar();
  }, { passive: true });

  tpParaBtn?.addEventListener('click', e => {
    e.stopPropagation();
    tpFmtPop?.classList.remove('open');
    tpParaPop?.classList.toggle('open');
  });
  tpFmtBtn?.addEventListener('click', e => {
    e.stopPropagation();
    tpParaPop?.classList.remove('open');
    tpFmtPop?.classList.toggle('open');
  });

  function closeFloatingMenus() {
    selBubble?.classList.remove('open');
    sbLinkBox?.classList.remove('open');
    if (sbCmdsGroup) sbCmdsGroup.style.display = 'inline-flex';
    slashMenu?.classList.remove('open');
    catPopover?.classList.remove('open');
    tpParaPop?.classList.remove('open');
    tpFmtPop?.classList.remove('open');
    document.getElementById('mm-mood-popover')?.classList.remove('open');
    clearSelectedFigure();
    clearActiveTableBar();
    slashOpen = false;
  }

  wysiwygEl?.addEventListener('change', e => {
    const selEl = e.target.closest('.st-code-lang-select');
    if (selEl) {
      const langSpan = selEl.closest('.code-header')?.querySelector('.code-lang');
      if (langSpan) langSpan.textContent = selEl.value || 'text';
      markPostDirty();
    }
  });

  wysiwygEl?.addEventListener('click', e => {
    const exitBtn = e.target.closest('[data-code-exit]');
    if (exitBtn) {
      const cb = exitBtn.closest('.code-block') || exitBtn.closest('pre');
      if (cb) {
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        cb.after(p);
        placeCaretAtStart(p);
        syncGutterPlus();
        markPostDirty();
      }
      return;
    }

    const figImg = e.target.closest('figure.post-figure img');
    if (figImg) {
      selectFigureInEditor(figImg.closest('figure.post-figure'));
      return;
    }
    clearSelectedFigure();

    const taskBox = e.target.closest('.task-box');
    if (taskBox) {
      const li = taskBox.closest('.task-item');
      if (li) {
        const done = !li.classList.contains('done');
        li.classList.toggle('done', done);
        taskBox.textContent = done ? '✓' : '';
        markPostDirty();
      }
      return;
    }
    syncGutterPlus();
    syncActiveTableBar();
  });

  wysiwygEl?.addEventListener('focus', () => {
    ensureInitialParagraph();
    syncGutterPlus();
  });

  // Live Typora Inline Markdown Auto-Convert (**bold**, *em*, ==mark==, ++u++, ||spoiler||, ~~del~~, [[kbd]], `code`, $math$, ^sup^, ~sub~, [link](url))
  function tryInlineMarkdownTransform(sel) {
    const node = sel.anchorNode;
    if (!node || node.nodeType !== Node.TEXT_NODE) return false;
    if (node.parentElement?.closest('code, pre, mark, strong, em, u, del, sup, sub, a, kbd, .md-math-inline, .md-spoiler')) return false;

    const offset = sel.anchorOffset;
    const before = node.nodeValue.slice(0, offset);
    const after = node.nodeValue.slice(offset);

    const linkMatch = before.match(/(?<!!)\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)$/);
    if (linkMatch && linkMatch[1].trim()) {
      const prefix = before.slice(0, linkMatch.index);
      const a = document.createElement('a');
      a.href = linkMatch[2];
      a.target = '_blank';
      a.textContent = linkMatch[1];
      const spacer = document.createTextNode('\u200b' + after);
      const frag = document.createDocumentFragment();
      if (prefix) frag.appendChild(document.createTextNode(prefix));
      frag.appendChild(a);
      frag.appendChild(spacer);
      node.replaceWith(frag);
      const range = document.createRange();
      range.setStart(spacer, 1);
      range.collapse(true);
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    }

    const patterns = [
      { re: /\*\*([^*]+)\*\*$/, tag: 'strong', cls: '' },
      { re: /(?<!\*)\*([^*\s][^*]*)\*$/, tag: 'em', cls: '' },
      { re: /==([^=]+)==$/, tag: 'mark', cls: 'warm-mark' },
      { re: /\+\+([^+]+)\+\+$/, tag: 'u', cls: 'md-u' },
      { re: /\|\|([^|]+)\|\|$/, tag: 'span', cls: 'md-spoiler' },
      { re: /~~([^~]+)~~$/, tag: 'del', cls: '' },
      { re: /\^([^^\s][^^]*)\^$/, tag: 'sup', cls: '' },
      { re: /(?<!~)~([^~\s][^~]*)~$/, tag: 'sub', cls: '' },
      { re: /\[\[([^\]]+)\]\]$/, tag: 'kbd', cls: 'md-kbd' },
      { re: /`([^`]+)`$/, tag: 'code', cls: 'inline-code' },
      { re: /(?<!\$)\$([^$\s][^$]*)\$(?!\$)$/, tag: 'span', cls: 'md-math-inline' },
    ];

    for (const p of patterns) {
      const m = before.match(p.re);
      if (m && m[1].trim()) {
        const prefix = before.slice(0, m.index);
        const formatted = document.createElement(p.tag);
        if (p.cls) formatted.className = p.cls;
        if (p.cls === 'md-math-inline') formatted.setAttribute('data-tex', m[1].trim());
        if (p.cls === 'md-spoiler') formatted.setAttribute('data-md-spoiler', '1');
        formatted.textContent = m[1];
        const spacer = document.createTextNode('\u200b' + after);

        const frag = document.createDocumentFragment();
        if (prefix) frag.appendChild(document.createTextNode(prefix));
        frag.appendChild(formatted);
        frag.appendChild(spacer);

        node.replaceWith(frag);
        const range = document.createRange();
        range.setStart(spacer, 1);
        range.collapse(true);
        sel.removeAllRanges();
        sel.addRange(range);
        return true;
      }
    }
    return false;
  }

  wysiwygEl?.addEventListener('input', e => {
    document.body.classList.add('is-typing');
    markPostDirty();
    if (e.isComposing || isComposing) return;
    ensureInitialParagraph();
    updateDocWordCount();
    syncGutterPlus();

    const sel = window.getSelection();
    if (!sel || !sel.isCollapsed || !sel.rangeCount) return;

    if (tryInlineMarkdownTransform(sel)) {
      updateDocWordCount();
      return;
    }

    const block = getTopLevelBlock(sel.anchorNode);
    if (!block || !/^(P|DIV)$/.test(block.tagName)) return;

    const rawText = (block.textContent || '').replace(/\u00a0/g, ' ');
    let replacementEl = null;
    let focusTarget = null;

    if (rawText === '# ') {
      replacementEl = document.createElement('h1');
      replacementEl.innerHTML = '<br>';
    } else if (rawText === '## ') {
      replacementEl = document.createElement('h2');
      replacementEl.innerHTML = '<br>';
    } else if (rawText === '### ') {
      replacementEl = document.createElement('h3');
      replacementEl.innerHTML = '<br>';
    } else if (rawText === '#### ') {
      replacementEl = document.createElement('h4');
      replacementEl.innerHTML = '<br>';
    } else if (rawText === '> ') {
      replacementEl = document.createElement('blockquote');
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      replacementEl.appendChild(p);
      focusTarget = p;
    } else if (rawText === '- ' || rawText === '* ') {
      replacementEl = document.createElement('ul');
      const li = document.createElement('li');
      li.innerHTML = '<br>';
      replacementEl.appendChild(li);
      focusTarget = li;
    } else if (rawText === '1. ') {
      replacementEl = document.createElement('ol');
      const li = document.createElement('li');
      li.innerHTML = '<br>';
      replacementEl.appendChild(li);
      focusTarget = li;
    } else if (rawText === '[] ' || rawText === '[ ] ' || rawText === '- [ ] ') {
      replacementEl = document.createElement('ul');
      replacementEl.className = 'task-list';
      const li = document.createElement('li');
      li.className = 'task-item';
      li.innerHTML = '<span class="task-box" contenteditable="false"></span><span><br></span>';
      replacementEl.appendChild(li);
      focusTarget = li.lastElementChild;
    }

    if (replacementEl) {
      block.replaceWith(replacementEl);
      placeCaretAtStart(focusTarget || replacementEl);
      syncGutterPlus();
      refreshLiveOutline();
    }
  });

  wysiwygEl?.addEventListener('keydown', e => {
    if (e.isComposing || isComposing) return;

    if (selectedFigure && (e.key === 'Backspace' || e.key === 'Delete')) {
      e.preventDefault();
      selectedFigure.remove();
      clearSelectedFigure();
      ensureInitialParagraph();
      updateDocWordCount();
      markPostDirty();
      return;
    }

    if (slashOpen) {
      const visibleItems = Array.from(slashMenu.querySelectorAll('.slash-item')).filter(it => it.style.display !== 'none');
      if (e.key === 'ArrowDown' && visibleItems.length) {
        e.preventDefault();
        slashIdx = (slashIdx + 1) % visibleItems.length;
        updateSlashHighlight();
        visibleItems[slashIdx]?.scrollIntoView({ block: 'nearest' });
        return;
      }
      if (e.key === 'ArrowUp' && visibleItems.length) {
        e.preventDefault();
        slashIdx = (slashIdx - 1 + visibleItems.length) % visibleItems.length;
        updateSlashHighlight();
        visibleItems[slashIdx]?.scrollIntoView({ block: 'nearest' });
        return;
      }
      if (e.key === 'Enter' && visibleItems[slashIdx]) {
        e.preventDefault();
        triggerSlashChoice(visibleItems[slashIdx].getAttribute('data-slash-cmd'));
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        closeFloatingMenus();
        return;
      }
    }

    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    const anchorEl = sel.anchorNode?.nodeType === Node.TEXT_NODE ? sel.anchorNode.parentElement : sel.anchorNode;

    // Table Cell Tab / Shift+Tab Navigation
    const tblCell = anchorEl?.closest('td, th');
    if (tblCell && e.key === 'Tab') {
      e.preventDefault();
      const tbl = tblCell.closest('table');
      const allCells = Array.from(tbl?.querySelectorAll('th, td') || []);
      const curIdx = allCells.indexOf(tblCell);
      if (e.shiftKey) {
        if (curIdx > 0) placeCaretAtEnd(allCells[curIdx - 1]);
      } else if (curIdx < allCells.length - 1) {
        placeCaretAtEnd(allCells[curIdx + 1]);
      } else if (tbl) {
        const tbody = tbl.querySelector('tbody') || tbl.appendChild(document.createElement('tbody'));
        const colCnt = tbl.querySelector('thead tr')?.children.length || 3;
        const newTr = document.createElement('tr');
        for (let c = 0; c < colCnt; c++) {
          const td = document.createElement('td');
          td.innerHTML = '<br>';
          newTr.appendChild(td);
        }
        tbody.appendChild(newTr);
        placeCaretAtStart(newTr.firstElementChild);
        markPostDirty();
      }
      syncActiveTableBar();
      return;
    }

    const preEl = anchorEl?.closest('pre');
    if (preEl) {
      if (e.key === 'Tab') {
        e.preventDefault();
        document.execCommand('insertText', false, '  ');
        return;
      }
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.shiftKey)) {
        e.preventDefault();
        const outer = preEl.closest('.code-block, .md-math-block') || preEl;
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        outer.after(p);
        placeCaretAtStart(p);
        syncGutterPlus();
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        document.execCommand('insertText', false, '\n');
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const topBlock = getTopLevelBlock(sel.anchorNode);
      const rawLine = (topBlock?.textContent || '').replace(/\u00a0/g, ' ').trim();

      if (topBlock && /^(P|DIV)$/.test(topBlock.tagName) && rawLine === '---') {
        e.preventDefault();
        const hr = document.createElement('hr');
        hr.className = 'editorial-hr';
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        topBlock.replaceWith(hr, p);
        placeCaretAtStart(p);
        syncGutterPlus();
        return;
      }

      if (topBlock && /^(P|DIV)$/.test(topBlock.tagName) && /^```([\w+-]*)$/.test(rawLine)) {
        e.preventDefault();
        const fenceMatch = rawLine.match(/^```([\w+-]*)$/);
        const cb = buildEditorCodeBlock(fenceMatch?.[1] || 'text', '\n');
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        topBlock.replaceWith(cb, p);
        placeCaretAtStart(cb.querySelector('code'));
        syncGutterPlus();
        return;
      }

      if (topBlock && /^(P|DIV)$/.test(topBlock.tagName) && rawLine === '$$') {
        e.preventDefault();
        const mb = buildVisualMathBlock('');
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        topBlock.replaceWith(mb, p);
        placeCaretAtStart(mb.querySelector('.md-math-src'));
        syncGutterPlus();
        return;
      }

      if (topBlock && /^(P|DIV)$/.test(topBlock.tagName) && /^:::\s*details(?:\s+(.*))?$/i.test(rawLine)) {
        e.preventDefault();
        const dm = rawLine.match(/^:::\s*details(?:\s+(.*))?$/i);
        const det = buildVisualDetails((dm?.[1] || '').trim() || '点击展开详情');
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        topBlock.replaceWith(det, p);
        placeCaretAtStart(det.querySelector('.md-details-body p'));
        syncGutterPlus();
        return;
      }

      // Typora Live Table Trigger: | 列1 | 列2 | + Enter
      if (topBlock && /^(P|DIV)$/.test(topBlock.tagName) && /^\|(.+)\|$/.test(rawLine)) {
        const rawCells = rawLine.slice(1, -1).split('|').map(s => s.trim());
        if (rawCells.length >= 1) {
          e.preventDefault();
          const cols = rawCells.length === 1 ? [rawCells[0] || '列标题 1', '列标题 2'] : rawCells.map((c, idx) => c || `列标题 ${idx + 1}`);
          const wrap = document.createElement('div');
          wrap.className = 'table-wrap';
          wrap.innerHTML =
            `<table>` +
              `<thead><tr>${cols.map(c => `<th data-align="left">${escapeHtml(c)}</th>`).join('')}</tr></thead>` +
              `<tbody><tr>${cols.map(() => `<td><br></td>`).join('')}</tr></tbody>` +
            `</table>`;
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          topBlock.replaceWith(wrap, p);
          placeCaretAtStart(wrap.querySelector('tbody td'));
          syncGutterPlus();
          syncActiveTableBar();
          updateDocWordCount();
          markPostDirty();
          return;
        }
      }

      // Typora / GitHub Alert Live Trigger: > [!NOTE] 标题 + Enter
      if (topBlock && /^(P|DIV|BLOCKQUOTE)$/.test(topBlock.tagName) && /^(?:>\s*)?\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s+(.*))?$/i.test(rawLine)) {
        e.preventDefault();
        const cm = rawLine.match(/^(?:>\s*)?\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s+(.*))?$/i);
        const box = buildVisualCallout(cm[1]);
        if ((cm[2] || '').trim()) {
          const tEl = box.querySelector('.md-callout-title');
          if (tEl) tEl.textContent = cm[2].trim();
        }
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        topBlock.replaceWith(box, p);
        placeCaretAtStart(box.querySelector('.md-callout-body p'));
        syncGutterPlus();
        updateDocWordCount();
        markPostDirty();
        return;
      }

      const calloutBox = anchorEl?.closest('.md-callout');
      if (calloutBox && anchorEl?.closest('.md-callout-body') && !(anchorEl.textContent || '').trim()) {
        e.preventDefault();
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        calloutBox.after(p);
        if (calloutBox.querySelectorAll('.md-callout-body p').length > 1) anchorEl.remove();
        placeCaretAtStart(p);
        syncGutterPlus();
        return;
      }

      const headingEl = anchorEl?.closest('h1, h2, h3, h4');
      if (headingEl && sel.isCollapsed) {
        e.preventDefault();
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        headingEl.after(p);
        placeCaretAtStart(p);
        syncGutterPlus();
        refreshLiveOutline();
        return;
      }

      const quoteEl = anchorEl?.closest('blockquote');
      if (quoteEl && !(anchorEl.textContent || '').trim()) {
        e.preventDefault();
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        quoteEl.after(p);
        if (quoteEl.querySelectorAll('p').length > 1) anchorEl.remove();
        else quoteEl.remove();
        placeCaretAtStart(p);
        syncGutterPlus();
        return;
      }

      const taskLi = anchorEl?.closest('li.task-item');
      if (taskLi) {
        e.preventDefault();
        const clone = taskLi.cloneNode(true);
        clone.querySelector('.task-box')?.remove();
        const txt = (clone.textContent || '').trim();
        const ul = taskLi.parentElement;
        if (!txt) {
          const p = document.createElement('p');
          p.innerHTML = '<br>';
          ul.after(p);
          taskLi.remove();
          if (!ul.children.length) ul.remove();
          placeCaretAtStart(p);
        } else {
          const nextLi = document.createElement('li');
          nextLi.className = 'task-item';
          nextLi.innerHTML = '<span class="task-box" contenteditable="false"></span><span><br></span>';
          taskLi.after(nextLi);
          placeCaretAtStart(nextLi.lastElementChild);
        }
        syncGutterPlus();
        return;
      }
    }
  });

  function filterSlashItems(query = '') {
    const q = query.trim().toLowerCase();
    const allItems = Array.from(slashMenu?.querySelectorAll('.slash-item') || []);
    let visibleCount = 0;
    allItems.forEach(it => {
      const txt = `${it.textContent || ''} ${it.getAttribute('data-slash-cmd') || ''}`.toLowerCase();
      const show = !q || txt.includes(q);
      it.style.display = show ? '' : 'none';
      if (show) visibleCount++;
    });
    slashIdx = 0;
    updateSlashHighlight();
    return visibleCount;
  }

  wysiwygEl?.addEventListener('keyup', e => {
    if (e.isComposing || isComposing) return;
    syncGutterPlus();
    syncActiveTableBar();
    if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        const block = getTopLevelBlock(sel.anchorNode);
        if (block && (block.textContent || '').trim() === '/') {
          const rect = sel.getRangeAt(0).getBoundingClientRect();
          filterSlashItems('');
          openBlockMenuAt(rect.left, rect.bottom + 6, true);
          return;
        }
      }
    }
    if (slashOpen && slashTriggeredByTypedChar && !['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(e.key)) {
      const sel = window.getSelection();
      const block = getTopLevelBlock(sel?.anchorNode);
      const txt = (block?.textContent || '').trim();
      if (!block || !txt.startsWith('/') || /\s/.test(txt)) {
        closeFloatingMenus();
      } else {
        const count = filterSlashItems(txt.slice(1));
        if (!count) closeFloatingMenus();
      }
    }
  });

  function updateSlashHighlight() {
    const visibleItems = Array.from(slashMenu?.querySelectorAll('.slash-item') || []).filter(it => it.style.display !== 'none');
    Array.from(slashMenu?.querySelectorAll('.slash-item') || []).forEach(it => it.classList.remove('active'));
    if (visibleItems[slashIdx]) visibleItems[slashIdx].classList.add('active');
  }

  function openBlockMenuAt(x, y, fromSlashChar) {
    if (!fromSlashChar) filterSlashItems('');
    slashIdx = 0;
    slashTriggeredByTypedChar = Boolean(fromSlashChar);
    updateSlashHighlight();
    slashMenu.style.left = `${Math.min(window.innerWidth - 250, Math.max(16, x))}px`;
    slashMenu.style.top = `${Math.min(window.innerHeight - 335, Math.max(58, y))}px`;
    slashMenu.classList.add('open');
    slashOpen = true;
  }

  gutterPlus?.addEventListener('mousedown', e => {
    e.preventDefault();
    e.stopPropagation();
    const rect = gutterPlus.getBoundingClientRect();
    openBlockMenuAt(rect.left, rect.bottom + 6, false);
  });

  const STUDIO_CALLOUT_CFG = {
    NOTE: { label: '备注说明', icon: 'ℹ' },
    TIP: { label: '经验技巧', icon: '✦' },
    IMPORTANT: { label: '重要强调', icon: '◈' },
    WARNING: { label: '注意事项', icon: '⚠' },
    CAUTION: { label: '风险警示', icon: '⊘' },
  };

  function buildVisualCallout(type = 'NOTE') {
    const t = type.toUpperCase();
    const cfg = STUDIO_CALLOUT_CFG[t] || STUDIO_CALLOUT_CFG.NOTE;
    const div = document.createElement('div');
    div.className = `md-callout callout-${t.toLowerCase()}`;
    div.setAttribute('data-callout', t);
    div.innerHTML =
      `<div class="md-callout-head">` +
        `<span class="md-callout-ico" contenteditable="false">${cfg.icon}</span>` +
        `<strong class="md-callout-title">${cfg.label}</strong>` +
      `</div>` +
      `<div class="md-callout-body"><p><br></p></div>`;
    return div;
  }

  function buildVisualTable() {
    const wrap = document.createElement('div');
    wrap.className = 'table-wrap';
    wrap.innerHTML =
      `<table>` +
        `<thead><tr><th data-align="left">列标题 1</th><th data-align="left">列标题 2</th><th data-align="left">列标题 3</th></tr></thead>` +
        `<tbody>` +
          `<tr><td><br></td><td><br></td><td><br></td></tr>` +
          `<tr><td><br></td><td><br></td><td><br></td></tr>` +
        `</tbody>` +
      `</table>`;
    return wrap;
  }

  function buildVisualDetails(title = '点击展开详情') {
    const det = document.createElement('details');
    det.className = 'md-details';
    det.setAttribute('open', '');
    det.innerHTML = `<summary class="md-details-sum">${escapeHtml(title)}</summary><div class="md-details-body"><p><br></p></div>`;
    return det;
  }

  function buildVisualMathBlock(tex = 'E = mc^2') {
    const div = document.createElement('div');
    div.className = 'md-math-block';
    div.setAttribute('data-math-block', '1');
    div.innerHTML = `<pre class="md-math-src">${escapeHtml(tex || '\n')}</pre>`;
    return div;
  }

  function buildVisualBookmark() {
    const div = document.createElement('div');
    div.className = 'md-bookmark';
    div.setAttribute('data-bm-title', '收藏网页标题');
    div.setAttribute('data-bm-url', 'https://example.com');
    div.setAttribute('data-bm-desc', '写一句简短的网页摘要或推荐理由…');
    div.innerHTML =
      `<div class="md-bm-main">` +
        `<div class="md-bm-title">收藏网页标题</div>` +
        `<div class="md-bm-desc">写一句简短的网页摘要或推荐理由…</div>` +
        `<div class="md-bm-host" contenteditable="false">https://example.com ↗（双击卡片可改网址）</div>` +
      `</div>`;
    return div;
  }

  wysiwygEl?.addEventListener('dblclick', e => {
    const bm = e.target.closest('.md-bookmark');
    if (bm) {
      const curUrl = bm.getAttribute('data-bm-url') || 'https://';
      const nextUrl = prompt('输入书签卡片跳转链接 URL：', curUrl);
      if (nextUrl && nextUrl.trim()) {
        const u = nextUrl.trim();
        bm.setAttribute('data-bm-url', u);
        const hostEl = bm.querySelector('.md-bm-host');
        if (hostEl) hostEl.textContent = `${u} ↗（双击卡片可改网址）`;
        markPostDirty();
      }
    }
  });

  function insertVisualFootnote() {
    wysiwygEl.focus();
    const existingIds = Array.from(wysiwygEl.querySelectorAll('sup.md-fn-ref')).map(el => Number(el.getAttribute('data-fn')) || 0);
    const nextNum = Math.max(0, ...existingIds) + 1;
    document.execCommand('insertHTML', false, `<sup class="md-fn-ref" data-fn="${nextNum}"><a href="#fn-${nextNum}">[${nextNum}]</a></sup>\u200b`);

    let fnSec = wysiwygEl.querySelector('section.md-footnotes');
    if (!fnSec) {
      fnSec = document.createElement('section');
      fnSec.className = 'md-footnotes';
      fnSec.innerHTML = `<hr class="editorial-hr" /><ol class="md-fn-list"></ol>`;
      wysiwygEl.appendChild(fnSec);
    }
    const ol = fnSec.querySelector('ol.md-fn-list') || fnSec.appendChild(document.createElement('ol'));
    const li = document.createElement('li');
    li.setAttribute('data-fn-id', String(nextNum));
    li.innerHTML = `<span class="md-fn-text">在此填写脚注 [${nextNum}] 的补充说明…</span>`;
    ol.appendChild(li);
    placeCaretAtEnd(li.firstElementChild);
    updateDocWordCount();
    markPostDirty();
  }

  function insertBlockAtActive(cmd) {
    if (cmd === 'img') {
      chooseImages({ multiple: true }, insertImagesIntoDoc);
      return;
    }
    if (cmd === 'footnote') {
      insertVisualFootnote();
      return;
    }

    const target = activeEditorBlock && wysiwygEl.contains(activeEditorBlock)
      ? activeEditorBlock
      : wysiwygEl.lastElementChild;

    let newEl = null;
    let caretEl = null;
    let needsTrailingPara = false;

    if (cmd === 'h1' || cmd === 'h2' || cmd === 'h3' || cmd === 'h4' || cmd === 'p') {
      newEl = document.createElement(cmd);
      newEl.innerHTML = '<br>';
    } else if (cmd === 'todo') {
      newEl = document.createElement('ul');
      newEl.className = 'task-list';
      newEl.innerHTML = '<li class="task-item"><span class="task-box" contenteditable="false"></span><span><br></span></li>';
      caretEl = newEl.querySelector('li > span:last-child');
    } else if (cmd === 'ul') {
      newEl = document.createElement('ul');
      newEl.innerHTML = '<li><br></li>';
      caretEl = newEl.firstElementChild;
    } else if (cmd === 'ol') {
      newEl = document.createElement('ol');
      newEl.innerHTML = '<li><br></li>';
      caretEl = newEl.firstElementChild;
    } else if (cmd === 'quote') {
      newEl = document.createElement('blockquote');
      newEl.innerHTML = '<p><br></p>';
      caretEl = newEl.firstElementChild;
    } else if (cmd.startsWith('callout-')) {
      newEl = buildVisualCallout(cmd.replace('callout-', ''));
      caretEl = newEl.querySelector('.md-callout-body p');
      needsTrailingPara = true;
    } else if (cmd === 'table') {
      newEl = buildVisualTable();
      caretEl = newEl.querySelector('tbody td');
      needsTrailingPara = true;
    } else if (cmd === 'details') {
      newEl = buildVisualDetails('点击展开详情');
      caretEl = newEl.querySelector('.md-details-body p');
      needsTrailingPara = true;
    } else if (cmd === 'code') {
      newEl = buildEditorCodeBlock('text', '\n');
      caretEl = newEl.querySelector('code');
      needsTrailingPara = true;
    } else if (cmd === 'math-block') {
      newEl = buildVisualMathBlock('E = mc^2');
      caretEl = newEl.querySelector('.md-math-src');
      needsTrailingPara = true;
    } else if (cmd === 'bookmark') {
      newEl = buildVisualBookmark();
      caretEl = newEl.querySelector('.md-bm-title');
      needsTrailingPara = true;
    } else if (cmd === 'hr') {
      const hr = document.createElement('hr');
      hr.className = 'editorial-hr';
      const p = document.createElement('p');
      p.innerHTML = '<br>';
      if (target && !(target.textContent || '').replace(/^\/\S*/, '').trim()) {
        target.replaceWith(hr, p);
      } else if (target) {
        target.after(hr, p);
      } else {
        wysiwygEl.append(hr, p);
      }
      placeCaretAtStart(p);
      syncGutterPlus();
      markPostDirty();
      return;
    }

    if (!newEl) return;
    const isSlashEmpty = target && !(target.textContent || '').replace(/^\/\S*/, '').trim();
    const trailP = needsTrailingPara ? document.createElement('p') : null;
    if (trailP) trailP.innerHTML = '<br>';

    if (isSlashEmpty) {
      if (trailP) target.replaceWith(newEl, trailP);
      else target.replaceWith(newEl);
    } else if (target) {
      if (trailP) target.after(newEl, trailP);
      else target.after(newEl);
    } else {
      if (trailP) wysiwygEl.append(newEl, trailP);
      else wysiwygEl.appendChild(newEl);
    }
    placeCaretAtStart(caretEl || newEl);
    syncGutterPlus();
    syncActiveTableBar();
    updateDocWordCount();
    markPostDirty();
  }

  function triggerSlashChoice(cmd) {
    if (slashTriggeredByTypedChar) {
      const sel = window.getSelection();
      const block = getTopLevelBlock(sel?.anchorNode);
      if (block && (block.textContent || '').trim().startsWith('/')) {
        block.innerHTML = '<br>';
        activeEditorBlock = block;
      }
    }
    closeFloatingMenus();
    insertBlockAtActive(cmd);
  }

  slashMenu?.querySelectorAll('[data-slash-cmd]').forEach(item => {
    item.addEventListener('mousedown', e => e.preventDefault());
    item.addEventListener('mouseenter', () => {
      const vis = Array.from(slashMenu.querySelectorAll('.slash-item')).filter(it => it.style.display !== 'none');
      const vIdx = vis.indexOf(item);
      if (vIdx >= 0) {
        slashIdx = vIdx;
        updateSlashHighlight();
      }
    });
    item.addEventListener('click', () => triggerSlashChoice(item.getAttribute('data-slash-cmd')));
  });

  // Floating Dark Selection Pill + Inline Rich Wrappers
  function wrapOrInsertVisualInline(htmlBuilder, placeholderText) {
    wysiwygEl.focus();
    const sel = window.getSelection();
    const txt = (sel && !sel.isCollapsed ? sel.toString() : '') || placeholderText;
    document.execCommand('insertHTML', false, htmlBuilder(txt) + '\u200b');
  }

  function execSelectionCmd(cmd) {
    wysiwygEl.focus();
    if (cmd === 'h1' || cmd === 'h2' || cmd === 'h3' || cmd === 'h4' || cmd === 'p') {
      document.execCommand('formatBlock', false, cmd);
    } else if (cmd === 'bold') {
      document.execCommand('bold', false, null);
    } else if (cmd === 'italic') {
      document.execCommand('italic', false, null);
    } else if (cmd === 'underline') {
      wrapOrInsertVisualInline(t => `<u class="md-u">${escapeHtml(t)}</u>`, '下划线文字');
    } else if (cmd === 'strike') {
      document.execCommand('strikeThrough', false, null);
    } else if (cmd === 'quote') {
      document.execCommand('formatBlock', false, 'blockquote');
    } else if (cmd === 'mark') {
      wrapOrInsertVisualInline(t => `<mark class="warm-mark">${escapeHtml(t)}</mark>`, '高亮重点');
    } else if (cmd === 'spoiler') {
      wrapOrInsertVisualInline(t => `<span class="md-spoiler" data-md-spoiler="1">${escapeHtml(t)}</span>`, '隐藏文字');
    } else if (cmd === 'sup') {
      wrapOrInsertVisualInline(t => `<sup>${escapeHtml(t)}</sup>`, '2');
    } else if (cmd === 'sub') {
      wrapOrInsertVisualInline(t => `<sub>${escapeHtml(t)}</sub>`, '2');
    } else if (cmd === 'inline-code') {
      wrapOrInsertVisualInline(t => `<code class="inline-code">${escapeHtml(t)}</code>`, 'code');
    } else if (cmd === 'kbd') {
      wrapOrInsertVisualInline(t => `<kbd class="md-kbd">${escapeHtml(t)}</kbd>`, 'Ctrl+S');
    } else if (cmd === 'math-inline') {
      wrapOrInsertVisualInline(t => `<span class="md-math-inline" data-tex="${escapeHtml(t)}">${escapeHtml(t)}</span>`, 'E = mc^2');
    }
    selBubble?.classList.remove('open');
    updateDocWordCount();
    markPostDirty();
  }

  document.querySelectorAll('[data-rt-cmd]').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => execSelectionCmd(btn.getAttribute('data-rt-cmd')));
  });

  function openLinkBubbleAtCaretOrSelection() {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount || !wysiwygEl.contains(sel.anchorNode)) {
      ensureInitialParagraph();
      placeCaretAtEnd(wysiwygEl.lastElementChild);
    }
    const curSel = window.getSelection();
    if (!curSel || !curSel.rangeCount) return;
    savedSelectionRange = curSel.getRangeAt(0).cloneRange();
    const rect = savedSelectionRange.getBoundingClientRect();
    const fallbackRect = wysiwygEl.getBoundingClientRect();
    const cx = rect.width > 0 || rect.height > 0 ? rect.left + rect.width / 2 : fallbackRect.left + 120;
    const cy = rect.width > 0 || rect.height > 0 ? rect.top : fallbackRect.top + 36;
    selBubble.style.left = `${Math.max(140, Math.min(window.innerWidth - 140, cx))}px`;
    selBubble.style.top = `${Math.max(60, cy)}px`;
    selBubble.classList.add('open');
    sbCmdsGroup.style.display = 'none';
    sbLinkBox.classList.add('open');
    sbLinkInput.value = '';
    sbLinkInput.focus();
  }

  document.getElementById('sb-open-link')?.addEventListener('mousedown', e => e.preventDefault());
  document.getElementById('sb-open-link')?.addEventListener('click', openLinkBubbleAtCaretOrSelection);

  // Markdown Source Wrapping & Block Helper (Full 26-Command Support)
  function applyMarkdownSourceCmd(act) {
    if (!mdSourceEl) return;
    mdSourceEl.focus();
    const start = mdSourceEl.selectionStart || 0;
    const end = mdSourceEl.selectionEnd || 0;
    const val = mdSourceEl.value;
    const selected = val.slice(start, end);

    const wrapSelection = (before, after, placeholder) => {
      const inner = selected || placeholder;
      const rep = before + inner + after;
      mdSourceEl.value = val.slice(0, start) + rep + val.slice(end);
      const ns = start + before.length;
      mdSourceEl.setSelectionRange(ns, ns + inner.length);
    };

    const insertSnippet = snippet => {
      mdSourceEl.value = val.slice(0, start) + snippet + val.slice(end);
      mdSourceEl.setSelectionRange(start + snippet.length, start + snippet.length);
    };

    const prefixLine = prefix => {
      const lineStart = val.lastIndexOf('\n', start - 1) + 1;
      const lineEndIdx = val.indexOf('\n', start);
      const lineEnd = lineEndIdx === -1 ? val.length : lineEndIdx;
      const cleanLine = val.slice(lineStart, lineEnd).replace(/^#{1,4}\s+/, '');
      mdSourceEl.value = val.slice(0, lineStart) + prefix + cleanLine + val.slice(lineEnd);
      const pos = lineStart + prefix.length + cleanLine.length;
      mdSourceEl.setSelectionRange(pos, pos);
    };

    if (act === 'bold') wrapSelection('**', '**', '加粗文字');
    else if (act === 'italic') wrapSelection('*', '*', '斜体文字');
    else if (act === 'underline') wrapSelection('++', '++', '下划线文字');
    else if (act === 'strike') wrapSelection('~~', '~~', '删除线');
    else if (act === 'mark') wrapSelection('==', '==', '高亮重点');
    else if (act === 'spoiler') wrapSelection('||', '||', '隐藏内容');
    else if (act === 'sup') wrapSelection('^', '^', '2');
    else if (act === 'sub') wrapSelection('~', '~', '2');
    else if (act === 'inline-code') wrapSelection('`', '`', 'code');
    else if (act === 'kbd') wrapSelection('[[', ']]', 'Ctrl+S');
    else if (act === 'math-inline') wrapSelection('$', '$', 'E = mc^2');
    else if (act === 'footnote') {
      const existing = [...val.matchAll(/\[\^(\d+)\]/g)].map(m => Number(m[1]) || 0);
      const n = Math.max(0, ...existing) + 1;
      const ref = `[^${n}]`;
      const def = `\n\n[^${n}]: 在此填写脚注说明`;
      mdSourceEl.value = val.slice(0, end) + ref + val.slice(end) + def;
      const defStart = mdSourceEl.value.length - 8;
      mdSourceEl.setSelectionRange(defStart, mdSourceEl.value.length);
    } else if (act === 'link') {
      const label = selected || '链接文字';
      const rep = `[${label}](https://)`;
      mdSourceEl.value = val.slice(0, start) + rep + val.slice(end);
      const urlStart = start + label.length + 3;
      mdSourceEl.setSelectionRange(urlStart, urlStart + 8);
    } else if (act === 'h1') prefixLine('# ');
    else if (act === 'h2') prefixLine('## ');
    else if (act === 'h3') prefixLine('### ');
    else if (act === 'h4') prefixLine('#### ');
    else if (act === 'p') prefixLine('');
    else if (act === 'quote') prefixLine('> ');
    else if (act === 'ul') prefixLine('- ');
    else if (act === 'ol') prefixLine('1. ');
    else if (act === 'todo') prefixLine('- [ ] ');
    else if (act === 'table') {
      insertSnippet(
        `\n\n| 列标题 1 | 列标题 2 | 列标题 3 |\n| :--- | :---: | ---: |\n| 内容 A | 内容 B | 内容 C |\n| 内容 D | 内容 E | 内容 F |\n\n`
      );
    } else if (act.startsWith('callout-')) {
      const cType = act.replace('callout-', '').toUpperCase();
      const cfg = STUDIO_CALLOUT_CFG[cType] || STUDIO_CALLOUT_CFG.NOTE;
      insertSnippet(`\n\n> [!${cType}] ${cfg.label}\n> ${selected || '在这里输入提示框内容…'}\n\n`);
    } else if (act === 'details') {
      insertSnippet(`\n\n:::details 点击展开详情\n${selected || '在这里输入折叠隐藏的正文内容…'}\n:::\n\n`);
    } else if (act === 'code') {
      wrapSelection('\n```js\n', '\n```\n', '// 在此输入代码');
    } else if (act === 'math-block') {
      wrapSelection('\n$$\n', '\n$$\n', 'E = mc^2');
    } else if (act === 'bookmark') {
      insertSnippet(`\n\n:::bookmark 网页标题 | https://example.com | 一句话简短介绍\n\n`);
    } else if (act === 'hr') {
      insertSnippet('\n\n---\n\n');
    } else if (act === 'img') {
      chooseImages({ multiple: true }, insertImagesIntoDoc);
      return;
    }

    autoGrow(mdSourceEl);
    updateDocWordCount();
    markPostDirty();
  }

  // Typora Topbar Menus & Shortcuts (Dual-Mode: Works in both Visual & Markdown Source)
  const INLINE_FMT_ACTS = new Set(['bold', 'italic', 'underline', 'strike', 'mark', 'spoiler', 'sup', 'sub', 'inline-code', 'kbd', 'math-inline']);

  function runTyporaFormatAction(act) {
    tpParaPop?.classList.remove('open');
    tpFmtPop?.classList.remove('open');
    if (sourceMode) {
      applyMarkdownSourceCmd(act);
      return;
    }
    if (act === 'img') {
      chooseImages({ multiple: true }, insertImagesIntoDoc);
    } else if (act === 'link') {
      openLinkBubbleAtCaretOrSelection();
    } else if (INLINE_FMT_ACTS.has(act)) {
      execSelectionCmd(act);
    } else if (['h1', 'h2', 'h3', 'h4', 'p', 'quote'].includes(act)) {
      const sel = window.getSelection();
      if (sel && wysiwygEl.contains(sel.anchorNode)) {
        execSelectionCmd(act);
      } else {
        insertBlockAtActive(act);
      }
    } else {
      insertBlockAtActive(act);
    }
  }

  document.querySelectorAll('[data-fmt-act]').forEach(btn => {
    btn.addEventListener('mousedown', e => e.preventDefault());
    btn.addEventListener('click', () => {
      runTyporaFormatAction(btn.getAttribute('data-fmt-act'));
    });
  });

  function handleTyporaShortcutKeydown(e) {
    if (!(e.ctrlKey || e.metaKey) || e.altKey) return false;
    const k = e.key.toLowerCase();
    if (e.shiftKey) {
      if (k === 'k') { e.preventDefault(); runTyporaFormatAction('code'); return true; }
      if (k === 'm') { e.preventDefault(); runTyporaFormatAction('math-block'); return true; }
      if (k === 'q') { e.preventDefault(); runTyporaFormatAction('quote'); return true; }
      if (k === 'h') { e.preventDefault(); runTyporaFormatAction('mark'); return true; }
      if (k === 'i') { e.preventDefault(); runTyporaFormatAction('img'); return true; }
      return false;
    }
    if (k === '1' || k === '2' || k === '3' || k === '4') {
      e.preventDefault();
      runTyporaFormatAction('h' + k);
      return true;
    }
    if (k === '0') { e.preventDefault(); runTyporaFormatAction('p'); return true; }
    if (k === 't') { e.preventDefault(); runTyporaFormatAction('table'); return true; }
    if (k === '`') { e.preventDefault(); runTyporaFormatAction('inline-code'); return true; }
    if (k === 'b') { e.preventDefault(); runTyporaFormatAction('bold'); return true; }
    if (k === 'i') { e.preventDefault(); runTyporaFormatAction('italic'); return true; }
    if (k === 'u') { e.preventDefault(); runTyporaFormatAction('underline'); return true; }
    if (k === 'k') { e.preventDefault(); runTyporaFormatAction('link'); return true; }
    return false;
  }

  wysiwygEl?.addEventListener('keydown', e => {
    handleTyporaShortcutKeydown(e);
  });

  function applySelectionLink() {
    const url = sbLinkInput.value.trim();
    if (savedSelectionRange && url) {
      wysiwygEl.focus();
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(savedSelectionRange);
      const label = sel.toString() || url;
      const safeHref = /^https?:\/\/|^\//i.test(url) ? url : 'https://' + url;
      document.execCommand('insertHTML', false, `<a href="${escapeHtml(safeHref)}" target="_blank">${escapeHtml(label)}</a>`);
      markPostDirty();
    }
    savedSelectionRange = null;
    closeFloatingMenus();
  }

  document.getElementById('sb-link-apply')?.addEventListener('click', applySelectionLink);
  sbLinkInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applySelectionLink();
    } else if (e.key === 'Escape') {
      closeFloatingMenus();
    }
  });

  document.addEventListener('selectionchange', () => {
    if (isComposing || sourceMode || activeTab !== 'posts' || !selBubble || !wysiwygEl) return;
    if (sbLinkBox?.classList.contains('open')) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.rangeCount || !sel.toString().trim()) {
      selBubble.classList.remove('open');
      return;
    }
    if (!wysiwygEl.contains(sel.anchorNode)) {
      selBubble.classList.remove('open');
      return;
    }
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    if (rect.width < 2) {
      selBubble.classList.remove('open');
      return;
    }
    selBubble.style.left = `${Math.max(140, Math.min(window.innerWidth - 140, rect.left + rect.width / 2))}px`;
    selBubble.style.top = `${Math.max(60, rect.top)}px`;
    selBubble.classList.add('open');
  });

  // Clean Paste Sanitizer + Instant Screenshot / Drag-Drop Upload!
  async function insertImagesIntoDoc(paths) {
    if (sourceMode) {
      const s = mdSourceEl.selectionStart || 0;
      const snippet = paths.map(p => `\n![](../${p})\n`).join('');
      mdSourceEl.value = mdSourceEl.value.slice(0, s) + snippet + mdSourceEl.value.slice(mdSourceEl.selectionEnd || s);
      autoGrow(mdSourceEl);
    } else {
      wysiwygEl.focus();
      paths.forEach(p => {
        const fig = document.createElement('figure');
        fig.className = 'post-figure';
        fig.innerHTML = `<img src="${escapeHtml(p)}" alt="" /><figcaption></figcaption>`;
        const nextP = document.createElement('p');
        nextP.innerHTML = '<br>';
        if (activeEditorBlock && wysiwygEl.contains(activeEditorBlock)) {
          activeEditorBlock.after(fig, nextP);
        } else {
          wysiwygEl.append(fig, nextP);
        }
        placeCaretAtStart(nextP);
      });
    }
    updateDocWordCount();
    markPostDirty();
  }

  wysiwygEl?.addEventListener('paste', async e => {
    const imgs = Array.from(e.clipboardData?.items || []).filter(i => i.type.startsWith('image/'));
    if (imgs.length) {
      e.preventDefault();
      toast('正在粘贴保存截图…');
      const paths = [];
      for (const it of imgs) {
        const f = it.getAsFile();
        if (f) paths.push(await uploadFile(f));
      }
      await insertImagesIntoDoc(paths);
      toast('✓ 截图已插入');
      return;
    }

    const plain = e.clipboardData?.getData('text/plain') || '';
    if (plain) {
      e.preventDefault();
      const trimmed = plain.trim();
      const sel = window.getSelection();
      if (/^https?:\/\/\S+$/i.test(trimmed) && sel && !sel.isCollapsed && sel.toString().trim()) {
        const label = sel.toString();
        document.execCommand('insertHTML', false, `<a href="${escapeHtml(trimmed)}" target="_blank">${escapeHtml(label)}</a>`);
        updateDocWordCount();
        markPostDirty();
        return;
      }
      const paras = plain.replace(/\r\n/g, '\n').split(/\n{2,}/);
      if (paras.length <= 1) {
        document.execCommand('insertText', false, plain);
      } else {
        const html = paras.map(p => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`).join('');
        document.execCommand('insertHTML', false, html);
      }
      updateDocWordCount();
      markPostDirty();
    }
  });

  mdSourceEl?.addEventListener('paste', async e => {
    const imgs = Array.from(e.clipboardData?.items || []).filter(i => i.type.startsWith('image/'));
    if (imgs.length) {
      e.preventDefault();
      toast('正在粘贴保存截图…');
      const paths = [];
      for (const it of imgs) {
        const f = it.getAsFile();
        if (f) paths.push(await uploadFile(f));
      }
      await insertImagesIntoDoc(paths);
      toast('✓ 截图已插入');
      return;
    }
    const plain = (e.clipboardData?.getData('text/plain') || '').trim();
    const s = mdSourceEl.selectionStart || 0;
    const end = mdSourceEl.selectionEnd || 0;
    if (end > s && /^https?:\/\/\S+$/i.test(plain)) {
      e.preventDefault();
      const label = mdSourceEl.value.slice(s, end);
      const rep = `[${label}](${plain})`;
      mdSourceEl.value = mdSourceEl.value.slice(0, s) + rep + mdSourceEl.value.slice(end);
      mdSourceEl.setSelectionRange(s + rep.length, s + rep.length);
      autoGrow(mdSourceEl);
      updateDocWordCount();
      markPostDirty();
    }
  });

  [wysiwygEl, mdSourceEl].forEach(area => {
    area?.addEventListener('dragover', e => e.preventDefault());
    area?.addEventListener('drop', async e => {
      const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
      if (!files.length) return;
      e.preventDefault();
      toast('正在上传拖入的照片…');
      const paths = [];
      for (const f of files) paths.push(await uploadFile(f));
      await insertImagesIntoDoc(paths);
      toast('✓ 照片已插入');
    });
  });

  mdSourceEl?.addEventListener('input', () => {
    document.body.classList.add('is-typing');
    autoGrow(mdSourceEl);
    updateDocWordCount();
    markPostDirty();
  });
  mdSourceEl?.addEventListener('keydown', e => {
    if (handleTyporaShortcutKeydown(e)) return;
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = mdSourceEl.selectionStart || 0;
      mdSourceEl.value = mdSourceEl.value.slice(0, s) + '  ' + mdSourceEl.value.slice(mdSourceEl.selectionEnd || s);
      mdSourceEl.selectionStart = mdSourceEl.selectionEnd = s + 2;
      return;
    }
    if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey && !e.isComposing) {
      const pos = mdSourceEl.selectionStart || 0;
      if (pos !== (mdSourceEl.selectionEnd || 0)) return;
      const val = mdSourceEl.value;
      const lineStart = val.lastIndexOf('\n', pos - 1) + 1;
      const line = val.slice(lineStart, pos);
      const listMatch = line.match(/^(\s*(?:-\s\[[ xX]\]\s+|[-*]\s+|\d+\.\s+|>\s+))(.*)$/);
      if (listMatch) {
        e.preventDefault();
        const rawPrefix = listMatch[1];
        const bodyTxt = listMatch[2];
        if (!bodyTxt.trim()) {
          // Empty list item -> exit list cleanly
          mdSourceEl.value = val.slice(0, lineStart) + '\n' + val.slice(pos);
          mdSourceEl.setSelectionRange(lineStart + 1, lineStart + 1);
        } else {
          let nextPrefix = rawPrefix.replace(/\[[xX]\]/, '[ ]');
          const numMatch = nextPrefix.match(/^(\s*)(\d+)(\.\s+)$/);
          if (numMatch) nextPrefix = `${numMatch[1]}${Number(numMatch[2]) + 1}${numMatch[3]}`;
          const ins = '\n' + nextPrefix;
          mdSourceEl.value = val.slice(0, pos) + ins + val.slice(pos);
          mdSourceEl.setSelectionRange(pos + ins.length, pos + ins.length);
        }
        autoGrow(mdSourceEl);
        updateDocWordCount();
        markPostDirty();
      }
    }
  });

  modeSwitchBtn?.addEventListener('click', async () => {
    closeFloatingMenus();
    if (!sourceMode) {
      mdSourceEl.value = domToMarkdown(wysiwygEl);
      sourceMode = true;
      wysiwygEl.style.display = 'none';
      gutterPlus?.classList.remove('visible');
      mdSourceEl.style.display = 'block';
      modeSwitchBtn.classList.add('active');
      modeSwitchBtn.textContent = '排版';
      requestAnimationFrame(() => autoGrow(mdSourceEl));
    } else {
      wysiwygEl.innerHTML = (await markdownToVisualHtml(mdSourceEl.value)) || '<p><br></p>';
      sourceMode = false;
      mdSourceEl.style.display = 'none';
      wysiwygEl.style.display = 'block';
      modeSwitchBtn.classList.remove('active');
      modeSwitchBtn.textContent = '源码';
    }
    updateDocWordCount();
  });

  const docRailCountEl = document.getElementById('doc-rail-count');
  const draftRecoverEl = document.getElementById('st-draft-recover');
  const draftRecoverTextEl = document.getElementById('st-draft-recover-text');

  document.querySelectorAll('[data-rail-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      docRailFilter = tab.getAttribute('data-rail-filter') || 'all';
      document.querySelectorAll('[data-rail-filter]').forEach(t => t.classList.toggle('active', t === tab));
      renderDocSidebar();
    });
  });

  function renderDocSidebar() {
    const kw = (docFilterInput?.value || '').trim().toLowerCase();
    const filtered = allPosts.filter(p => {
      if (docRailFilter === 'public' && p.private) return false;
      if (docRailFilter === 'private' && !p.private) return false;
      if (kw) {
        const hay = `${p.title || ''} ${p.category || ''} ${(p.tags || []).join(' ')} ${p.rawBody || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    if (docRailCountEl) docRailCountEl.textContent = `${filtered.length} 篇`;

    if (!filtered.length) {
      docListEl.innerHTML = `<div style="padding:24px 10px; text-align:center; font-size:12px; color:var(--st-ink-3);">暂无匹配文档</div>`;
      return;
    }

    docListEl.innerHTML = filtered
      .map(
        p => `
      <div class="st-doc-item ${p.slug === currentSlug ? 'active' : ''}" data-doc-slug="${escapeHtml(p.slug)}">
        <div class="st-doc-item-title">
          ${p.private ? `<span style="color:#B47418;display:inline-flex;" title="仅自己可见">${SVG_LOCK}</span>` : ''}
          ${p.featured ? `<span style="color:var(--st-accent);display:inline-flex;" title="已置顶">${SVG_STAR}</span>` : ''}
          <span style="overflow:hidden; text-overflow:ellipsis;">${escapeHtml(p.title)}</span>
        </div>
        <div class="st-doc-item-sub font-mono-num">
          <span>${escapeHtml(p.date)} · ${escapeHtml(p.category)}</span>
          <span>${p.wordCount}字</span>
        </div>
      </div>`
      )
      .join('');

    docListEl.querySelectorAll('[data-doc-slug]').forEach(el => {
      el.addEventListener('click', () => {
        const slug = el.getAttribute('data-doc-slug');
        if (slug === currentSlug) return;
        if (isPostDirty && !confirm('当前文章有未保存的修改，确定放弃并切换吗？')) return;
        clearDraftBackup();
        const found = allPosts.find(x => x.slug === slug);
        if (found) loadPostIntoStudio(found);
      });
    });
  }

  docFilterInput?.addEventListener('input', () => {
    docFilterClear?.classList.toggle('visible', Boolean(docFilterInput.value));
    renderDocSidebar();
  });
  docFilterClear?.addEventListener('click', () => {
    docFilterInput.value = '';
    docFilterClear.classList.remove('visible');
    renderDocSidebar();
    docFilterInput.focus();
  });

  function startBlankDoc() {
    if (isPostDirty && !confirm('当前文章有未保存的修改，确定新建空白篇吗？')) return;
    currentSlug = null;
    docTitleEl.value = '';
    docCatEl.value = siteConfig.categories?.[0] || '随笔';
    docDateEl.value = new Date().toISOString().slice(0, 10);
    currentTags = [];
    renderTagChips();
    docPrivEl.checked = false;
    docFeatEl.checked = false;
    syncPostTokensUI();
    currentCover = '';
    renderCoverState();
    docSumEl.value = '';
    docSumWrap.classList.remove('open');
    syncSummaryBtnState();
    wysiwygEl.innerHTML = '<p><br></p>';
    mdSourceEl.value = '';
    viewLiveLink.style.display = 'none';
    delPostBtn.style.display = 'none';
    isPostDirty = false;
    updateSaveStatusUI();
    renderDocSidebar();
    updateDocWordCount();
    requestAnimationFrame(() => {
      refreshAllAutoGrow();
      docTitleEl.focus();
    });
  }

  async function loadPostIntoStudio(p) {
    currentSlug = p.slug;
    docTitleEl.value = p.title || '';
    docCatEl.value = p.category || '随笔';
    docDateEl.value = p.date || new Date().toISOString().slice(0, 10);
    currentTags = [...(p.tags || [])];
    renderTagChips();
    docPrivEl.checked = Boolean(p.private);
    docFeatEl.checked = Boolean(p.featured);
    syncPostTokensUI();
    currentCover = p.cover || '';
    renderCoverState();
    docSumEl.value = p.rawSummary || '';
    docSumWrap.classList.toggle('open', Boolean(p.rawSummary));
    syncSummaryBtnState();
    mdSourceEl.value = p.rawBody || '';
    wysiwygEl.innerHTML = (await markdownToVisualHtml(p.rawBody || '')) || '<p><br></p>';
    viewLiveLink.href = 'posts/' + encodeURIComponent(p.slug) + '.html';
    viewLiveLink.style.display = 'inline-flex';
    delPostBtn.style.display = 'inline-flex';
    isPostDirty = false;
    updateSaveStatusUI();
    renderDocSidebar();
    updateDocWordCount();
    requestAnimationFrame(refreshAllAutoGrow);
  }

  document.getElementById('btn-new-doc')?.addEventListener('click', startBlankDoc);

  // Local Unsaved Draft Recovery Check & Handlers
  let pendingDraft = null;
  function checkUnsavedDraftBanner() {
    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d || (!d.title && !d.body)) return;
      const matchPost = d.slug ? allPosts.find(x => x.slug === d.slug) : null;
      if (matchPost && (matchPost.rawBody || '').trim() === (d.body || '').trim() && (matchPost.title || '').trim() === (d.title || '').trim()) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
        return;
      }
      pendingDraft = d;
      if (draftRecoverEl && draftRecoverTextEl) {
        const dt = d.savedAt ? new Date(d.savedAt) : null;
        const hhmm = dt ? `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}` : '';
        draftRecoverTextEl.textContent = `检测到未保存草稿「${d.title || '无标题'}」${hhmm ? `（${hhmm}）` : ''}`;
        draftRecoverEl.style.display = 'flex';
      }
    } catch (_) {}
  }

  document.getElementById('btn-draft-restore')?.addEventListener('click', async () => {
    if (!pendingDraft) return;
    const d = pendingDraft;
    pendingDraft = null;
    if (draftRecoverEl) draftRecoverEl.style.display = 'none';
    currentSlug = d.slug || null;
    docTitleEl.value = d.title || '';
    docCatEl.value = d.category || '随笔';
    docDateEl.value = d.date || new Date().toISOString().slice(0, 10);
    currentTags = Array.isArray(d.tags) ? [...d.tags] : [];
    renderTagChips();
    docPrivEl.checked = Boolean(d.private);
    docFeatEl.checked = Boolean(d.featured);
    syncPostTokensUI();
    currentCover = d.cover || '';
    renderCoverState();
    docSumEl.value = d.summary || '';
    docSumWrap.classList.toggle('open', Boolean(d.summary));
    syncSummaryBtnState();
    mdSourceEl.value = d.body || '';
    wysiwygEl.innerHTML = (await markdownToVisualHtml(d.body || '')) || '<p><br></p>';
    isPostDirty = true;
    updateSaveStatusUI();
    renderDocSidebar();
    updateDocWordCount();
    requestAnimationFrame(refreshAllAutoGrow);
    toast('✓ 已恢复未保存草稿');
  });

  document.getElementById('btn-draft-discard')?.addEventListener('click', () => {
    pendingDraft = null;
    clearDraftBackup();
  });

  async function saveCurrentDoc() {
    if (!docTitleEl.value.trim()) {
      toast('请先填写标题');
      docTitleEl.focus();
      return;
    }
    if (saveLabelEl) saveLabelEl.textContent = '保存中…';
    const finalMd = sourceMode ? mdSourceEl.value : domToMarkdown(wysiwygEl);
    const res = await fetch('/api/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        slug: currentSlug,
        title: docTitleEl.value.trim(),
        category: docCatEl.value,
        date: docDateEl.value,
        tags: currentTags,
        private: docPrivEl.checked,
        featured: docFeatEl.checked,
        cover: currentCover,
        summary: docSumEl.value.trim(),
        body: finalMd,
      }),
    });
    const out = await res.json();
    if (out.ok) {
      isPostDirty = false;
      clearDraftBackup();
      currentSlug = out.slug;
      await reloadAllData(out.slug);
      toast(docPrivEl.checked ? '✓ 私密日记已保存在本地' : '✓ 文章已保存并发布');
    }
  }

  document.getElementById('doc-save-btn')?.addEventListener('click', saveCurrentDoc);

  delPostBtn?.addEventListener('click', async () => {
    if (!currentSlug || !confirm('确定删除这篇文章吗？')) return;
    isPostDirty = false;
    clearDraftBackup();
    const res = await fetch('/api/post?slug=' + encodeURIComponent(currentSlug), { method: 'DELETE' });
    if ((await res.json()).ok) {
      currentSlug = null;
      await reloadAllData();
      toast('已删除文章');
    }
  });

  // ========================================================================
  // PAGE 2: CENTERED FLOMO UNIFIED COMPOSER & SORTABLE 9-GRID STREAM
  // ========================================================================
  const mmComposerCard = document.getElementById('mm-composer-card');
  const mmEditBanner = document.getElementById('mm-edit-banner');
  const mmTextEl = document.getElementById('mm-text');
  const mmCharStat = document.getElementById('mm-char-stat');
  const mmPhotoBtnLabel = document.getElementById('mm-photo-btn-label');
  const mmLocDrawer = document.getElementById('mm-loc-drawer');
  const mmLocEl = document.getElementById('mm-loc');
  const mmLocPillText = document.getElementById('mm-loc-pill-text');
  const mmTimeDrawer = document.getElementById('mm-time-drawer');
  const mmDatetimeEl = document.getElementById('mm-datetime');
  const mmTimePillText = document.getElementById('mm-time-pill-text');
  const mmNoteDrawer = document.getElementById('mm-note-drawer');
  const mmNoteInput = document.getElementById('mm-note-add-input');
  const mmNotesWrap = document.getElementById('mm-notes-chips');
  const ngGrid = document.getElementById('mm-nine-grid');
  const mmPrivBtn = document.getElementById('mm-priv-btn');
  const mmPrivLabel = document.getElementById('mm-priv-label');
  const mmPrivEl = document.getElementById('mm-priv');
  const mmMoodBtn = document.getElementById('mm-mood-btn');
  const mmMoodLabel = document.getElementById('mm-mood-label');
  const mmMoodPopover = document.getElementById('mm-mood-popover');
  const mmSubmitBtn = document.getElementById('mm-submit-btn');
  const mmCancelBtn = document.getElementById('mm-cancel-btn');
  const mmStreamSearch = document.getElementById('mm-stream-search');
  const mmWallEl = document.getElementById('mm-visual-wall');

  function nowDtLocalStr() {
    const now = new Date();
    const pad = n => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  }

  function syncMomentBarUI() {
    mmMoodLabel.textContent = mmMood;
    const locVal = mmLocEl.value.trim();
    mmLocPillText.textContent = locVal || '位置';
    document.getElementById('mm-loc-toggle')?.classList.toggle('active', Boolean(locVal));
    const dtVal = (mmDatetimeEl?.value || '').trim();
    if (mmTimePillText) {
      mmTimePillText.textContent = dtVal ? dtVal.replace('T', ' ').slice(5, 16) : '发布时间';
    }
    document.getElementById('mm-time-toggle')?.classList.toggle('active', Boolean(dtVal));
    const priv = mmPrivEl.checked;
    mmPrivBtn.classList.toggle('priv-on', priv);
    mmPrivLabel.textContent = priv ? '仅自己可见' : '公开';
    if (mmPhotoBtnLabel) {
      mmPhotoBtnLabel.textContent = mmImages.length ? `图片 (${mmImages.length}/9)` : '图片';
    }
    const len = (mmTextEl?.value || '').trim().length;
    if (mmCharStat) mmCharStat.textContent = len > 0 ? `${len} 字` : '';
  }

  mmTextEl?.addEventListener('input', syncMomentBarUI);

  mmMoodBtn?.addEventListener('click', e => {
    e.stopPropagation();
    mmMoodPopover.classList.toggle('open');
  });

  mmMoodPopover?.querySelectorAll('[data-mm-mood]').forEach(opt => {
    opt.addEventListener('click', e => {
      e.stopPropagation();
      mmMood = opt.getAttribute('data-mm-mood');
      mmMoodPopover.classList.remove('open');
      syncMomentBarUI();
    });
  });

  document.getElementById('mm-pick-photos')?.addEventListener('click', () => {
    chooseImages({ multiple: true }, paths => {
      mmImages.push(...paths);
      mmImages = mmImages.slice(0, 9);
      renderNineGridUploader();
      syncMomentBarUI();
    });
  });

  const mmLocAutoBtn = document.getElementById('mm-loc-auto-btn');
  const mmLocClearBtn = document.getElementById('mm-loc-clear-btn');

  document.getElementById('mm-loc-toggle')?.addEventListener('click', () => {
    const open = mmLocDrawer?.classList.toggle('open');
    if (open) mmLocEl?.focus();
  });

  mmLocEl?.addEventListener('input', syncMomentBarUI);

  mmLocAutoBtn?.addEventListener('click', async () => {
    const prevTxt = mmLocAutoBtn.textContent;
    mmLocAutoBtn.textContent = '定位中…';
    let loc = await detectStudioProvinceCity({ preferGps: true });
    if (!loc && siteConfig.location) loc = siteConfig.location;
    mmLocAutoBtn.textContent = prevTxt || '自动获取';
    if (loc && mmLocEl) {
      mmLocEl.value = loc;
      localStorage.setItem('blog-auto-loc', loc);
      mmLocDrawer?.classList.add('open');
      mmLocEl.focus();
      mmLocEl.setSelectionRange(loc.length, loc.length);
      syncMomentBarUI();
    } else {
      toast('暂时未能自动获取位置，可直接手动输入');
      mmLocEl?.focus();
    }
  });

  mmLocClearBtn?.addEventListener('click', () => {
    if (mmLocEl) mmLocEl.value = '';
    mmLocDrawer?.classList.remove('open');
    syncMomentBarUI();
  });

  document.getElementById('mm-time-toggle')?.addEventListener('click', () => {
    const open = mmTimeDrawer?.classList.toggle('open');
    if (open && mmDatetimeEl) {
      if (!mmDatetimeEl.value) {
        mmDatetimeEl.value = nowDtLocalStr();
        syncMomentBarUI();
      }
      mmDatetimeEl.focus();
      try { mmDatetimeEl.showPicker?.(); } catch (_) {}
    }
  });
  mmDatetimeEl?.addEventListener('input', syncMomentBarUI);
  document.getElementById('mm-time-now-btn')?.addEventListener('click', () => {
    if (mmDatetimeEl) mmDatetimeEl.value = '';
    mmTimeDrawer?.classList.remove('open');
    syncMomentBarUI();
  });

  document.getElementById('mm-note-toggle')?.addEventListener('click', () => {
    const open = mmNoteDrawer.classList.toggle('open');
    if (open) mmNoteInput.focus();
  });

  mmPrivBtn?.addEventListener('click', () => {
    mmPrivEl.checked = !mmPrivEl.checked;
    syncMomentBarUI();
  });

  // Drag-Sortable Nine-Grid Uploader!
  function renderNineGridUploader() {
    if (!mmImages.length) {
      ngGrid.innerHTML = '';
      return;
    }
    const tiles = mmImages.map(
      (src, idx) => `
      <div class="ng-tile" draggable="true" data-ng-idx="${idx}" title="拖拽可调整照片顺序">
        <img src="${escapeHtml(normalizePreviewImg(src))}" alt="" />
        <button type="button" class="thumb-del" data-ng-rm="${idx}">×</button>
      </div>`
    );
    if (mmImages.length < 9) {
      tiles.push(`<button type="button" id="ng-add-trigger" class="ng-add-tile" title="继续添加照片">+</button>`);
    }
    ngGrid.innerHTML = tiles.join('');

    ngGrid.querySelectorAll('.ng-tile[data-ng-idx]').forEach(tile => {
      const idx = Number(tile.getAttribute('data-ng-idx'));
      tile.addEventListener('dragstart', e => {
        dragPhotoIdx = idx;
        tile.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      tile.addEventListener('dragend', () => {
        dragPhotoIdx = null;
        tile.classList.remove('dragging');
        ngGrid.querySelectorAll('.ng-tile').forEach(t => t.classList.remove('drag-over'));
      });
      tile.addEventListener('dragover', e => {
        if (dragPhotoIdx === null || dragPhotoIdx === idx) return;
        e.preventDefault();
        tile.classList.add('drag-over');
      });
      tile.addEventListener('dragleave', () => tile.classList.remove('drag-over'));
      tile.addEventListener('drop', e => {
        if (dragPhotoIdx === null || dragPhotoIdx === idx) return;
        e.preventDefault();
        e.stopPropagation();
        const [moved] = mmImages.splice(dragPhotoIdx, 1);
        mmImages.splice(idx, 0, moved);
        dragPhotoIdx = null;
        renderNineGridUploader();
      });
    });

    ngGrid.querySelectorAll('[data-ng-rm]').forEach(b => {
      b.addEventListener('click', () => {
        mmImages.splice(Number(b.getAttribute('data-ng-rm')), 1);
        renderNineGridUploader();
        syncMomentBarUI();
      });
    });
    ngGrid.querySelector('#ng-add-trigger')?.addEventListener('click', () => {
      chooseImages({ multiple: true }, paths => {
        mmImages.push(...paths);
        mmImages = mmImages.slice(0, 9);
        renderNineGridUploader();
        syncMomentBarUI();
      });
    });
  }

  mmTextEl?.addEventListener('paste', async e => {
    const imgs = Array.from(e.clipboardData?.items || []).filter(i => i.type.startsWith('image/'));
    if (!imgs.length) return;
    e.preventDefault();
    toast('正在粘贴图片…');
    for (const it of imgs) {
      const f = it.getAsFile();
      if (f && mmImages.length < 9) mmImages.push(await uploadFile(f));
    }
    renderNineGridUploader();
    syncMomentBarUI();
  });

  mmComposerCard?.addEventListener('dragover', e => {
    if (dragPhotoIdx !== null) return;
    e.preventDefault();
  });
  mmComposerCard?.addEventListener('drop', async e => {
    if (dragPhotoIdx !== null) return;
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    if (!files.length) return;
    e.preventDefault();
    toast('正在导入照片…');
    for (const f of files) {
      if (mmImages.length < 9) mmImages.push(await uploadFile(f));
    }
    renderNineGridUploader();
    syncMomentBarUI();
  });

  mmTextEl?.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      mmSubmitBtn?.click();
    }
  });

  function renderMmNotesChips() {
    mmNotesWrap.innerHTML = mmNotes
      .map(
        (n, idx) => `
      <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 12px; border-radius:8px; background:var(--st-app-bg); font-size:13px;">
        <span><strong style="color:var(--st-accent);">追记：</strong>${escapeHtml(n)}</span>
        <button type="button" class="st-tiny-action" data-rm-note="${idx}">移除</button>
      </div>`
      )
      .join('');
    mmNotesWrap.querySelectorAll('[data-rm-note]').forEach(b => {
      b.addEventListener('click', () => {
        mmNotes.splice(Number(b.getAttribute('data-rm-note')), 1);
        renderMmNotesChips();
      });
    });
  }

  document.getElementById('mm-note-add-btn')?.addEventListener('click', () => {
    const v = mmNoteInput.value.trim();
    if (!v) return;
    mmNotes.push(v);
    mmNoteInput.value = '';
    renderMmNotesChips();
  });
  mmNoteInput?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      document.getElementById('mm-note-add-btn')?.click();
    }
  });

  function resetMomentStudio() {
    editingMomentId = null;
    mmMood = '日常';
    mmTextEl.value = '';
    mmLocEl.value = '';
    if (mmDatetimeEl) mmDatetimeEl.value = '';
    mmPrivEl.checked = false;
    mmImages = [];
    mmNotes = [];
    mmLocDrawer.classList.remove('open');
    mmTimeDrawer?.classList.remove('open');
    mmNoteDrawer.classList.remove('open');
    mmEditBanner.classList.remove('open');
    mmSubmitBtn.textContent = '发布';
    renderNineGridUploader();
    renderMmNotesChips();
    syncMomentBarUI();
    requestAnimationFrame(() => autoGrow(mmTextEl));
  }

  function editMomentInStudio(m) {
    editingMomentId = m.id;
    mmMood = m.mood || '日常';
    mmTextEl.value = m.content || '';
    mmLocEl.value = m.location || '';
    if (mmDatetimeEl) {
      const rawD = String(m.date || '');
      mmDatetimeEl.value = rawD.includes(' ') ? rawD.replace(' ', 'T').slice(0, 16) : `${rawD.slice(0, 10)}T12:00`;
    }
    mmPrivEl.checked = Boolean(m.private);
    mmImages = [...(m.images || [])];
    mmNotes = [...(m.notes || [])];
    mmLocDrawer?.classList.toggle('open', Boolean(m.location));
    mmTimeDrawer?.classList.add('open');
    mmEditBanner.classList.add('open');
    mmSubmitBtn.textContent = '保存修改';
    renderNineGridUploader();
    renderMmNotesChips();
    syncMomentBarUI();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      autoGrow(mmTextEl);
      mmTextEl.focus();
    });
  }

  mmCancelBtn?.addEventListener('click', resetMomentStudio);

  mmSubmitBtn?.addEventListener('click', async () => {
    const content = mmTextEl.value.trim();
    if (!content && !mmImages.length) {
      toast('写两句或者传张图再发吧');
      mmTextEl.focus();
      return;
    }
    const pickedStamp = (mmDatetimeEl?.value || '').trim().replace('T', ' ').slice(0, 16);
    const fallbackNow = nowDtLocalStr().replace('T', ' ');

    if (editingMomentId) {
      const target = allMoments.find(x => x.id === editingMomentId);
      if (target) {
        target.date = pickedStamp || target.date || fallbackNow;
        target.mood = mmMood;
        target.location = mmLocEl.value.trim();
        target.private = mmPrivEl.checked;
        target.content = content;
        target.images = [...mmImages];
        target.notes = [...mmNotes];
      }
    } else {
      allMoments.unshift({
        id: 'm-' + Date.now(),
        date: pickedStamp || fallbackNow,
        mood: mmMood,
        location: mmLocEl.value.trim(),
        private: mmPrivEl.checked,
        content,
        images: [...mmImages],
        notes: [...mmNotes],
        likes: 0,
      });
    }
    allMoments.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
    await saveCollection('moments', allMoments);
    resetMomentStudio();
  });

  // Stream Filters & Search
  document.querySelectorAll('[data-mm-filter]').forEach(pill => {
    pill.addEventListener('click', () => {
      mmStreamFilter = pill.getAttribute('data-mm-filter');
      document.querySelectorAll('[data-mm-filter]').forEach(p => p.classList.toggle('active', p === pill));
      renderMomentsWall();
    });
  });
  mmStreamSearch?.addEventListener('input', renderMomentsWall);

  function renderMomentsWall() {
    const kw = (mmStreamSearch?.value || '').trim().toLowerCase();
    const list = allMoments.filter(m => {
      if (mmStreamFilter === 'public' && m.private) return false;
      if (mmStreamFilter === 'private' && !m.private) return false;
      if (kw) {
        const hay = `${m.content || ''} ${m.mood || ''} ${m.location || ''} ${(m.notes || []).join(' ')}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    if (!list.length) {
      mmWallEl.innerHTML = `<div style="text-align:center; padding:36px 0; color:var(--st-ink-3); font-size:13.5px;">暂无匹配的日常动态</div>`;
      return;
    }

    mmWallEl.innerHTML = list
      .map(m => {
        const realIdx = allMoments.indexOf(m);
        const imgs = Array.isArray(m.images) ? m.images.filter(Boolean) : [];
        return `
      <div class="st-moment-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; font-size:12px;">
          <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
            <span class="cat-chip cat-sand">#${escapeHtml(m.mood || '日常')}</span>
            ${m.private ? `<span class="priv-badge">${SVG_LOCK}<span>仅自己可见</span></span>` : ''}
            ${m.location ? `<span style="color:var(--st-ink-3); display:inline-flex; align-items:center; gap:3px;">${SVG_PIN}<span>${escapeHtml(m.location)}</span></span>` : ''}
          </div>
          <div style="display:flex; align-items:center; gap:4px;">
            <button type="button" class="st-tiny-action" data-wall-reply="${realIdx}">+ 追记</button>
            <button type="button" class="st-tiny-action" data-wall-priv="${realIdx}">${m.private ? '设为公开' : '锁私密'}</button>
            <button type="button" class="st-tiny-action" data-wall-edit="${realIdx}">修改</button>
            <button type="button" class="st-tiny-action" style="color:#C44444;" data-wall-del="${realIdx}">删除</button>
            <span class="font-mono-num" style="color:var(--st-ink-3); margin-left:4px;">${escapeHtml(m.date)}</span>
          </div>
        </div>
        <div style="font-size:15px; line-height:1.8; white-space:pre-line;">${escapeHtml(m.content)}</div>
        ${
          imgs.length
            ? `<div class="moment-gallery" data-count="${Math.min(9, imgs.length)}">
                ${imgs
                  .slice(0, 9)
                  .map(
                    s =>
                      `<div class="moment-photo-item"><img src="${escapeHtml(normalizePreviewImg(s))}" alt="" data-st-zoom="${escapeHtml(normalizePreviewImg(s))}" /></div>`
                  )
                  .join('')}
               </div>`
            : ''
        }
        ${
          m.notes && m.notes.length
            ? `<div class="moment-notes-box">${m.notes.map(n => `<div><strong style="color:var(--st-accent);">追记：</strong>${escapeHtml(n)}</div>`).join('')}</div>`
            : ''
        }
        <div class="st-card-inline-reply" id="wall-reply-box-${realIdx}">
          <input type="text" placeholder="补一句后续追记，按回车保存…" data-wall-reply-in="${realIdx}" />
          <button type="button" class="st-primary-btn" style="height:26px;padding:0 10px;font-size:12px;" data-wall-reply-send="${realIdx}">发送</button>
        </div>
      </div>`;
      })
      .join('');

    mmWallEl.querySelectorAll('[data-st-zoom]').forEach(img => {
      img.addEventListener('click', () => openStudioLightbox(img.getAttribute('data-st-zoom')));
    });

    mmWallEl.querySelectorAll('[data-wall-reply]').forEach(b => {
      b.addEventListener('click', () => {
        const idx = b.getAttribute('data-wall-reply');
        const box = document.getElementById('wall-reply-box-' + idx);
        const open = box?.classList.toggle('open');
        if (open) box.querySelector('input')?.focus();
      });
    });

    mmWallEl.querySelectorAll('[data-wall-reply-send]').forEach(b => {
      b.addEventListener('click', async () => {
        const idx = Number(b.getAttribute('data-wall-reply-send'));
        const inp = mmWallEl.querySelector(`[data-wall-reply-in="${idx}"]`);
        const val = inp?.value.trim();
        if (!val) return;
        if (!Array.isArray(allMoments[idx].notes)) allMoments[idx].notes = [];
        allMoments[idx].notes.push(val);
        await saveCollection('moments', allMoments);
      });
    });

    mmWallEl.querySelectorAll('[data-wall-reply-in]').forEach(inp => {
      inp.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.isComposing) {
          e.preventDefault();
          const idx = inp.getAttribute('data-wall-reply-in');
          mmWallEl.querySelector(`[data-wall-reply-send="${idx}"]`)?.click();
        }
      });
    });

    mmWallEl.querySelectorAll('[data-wall-priv]').forEach(b => {
      b.addEventListener('click', async () => {
        const idx = Number(b.getAttribute('data-wall-priv'));
        allMoments[idx].private = !allMoments[idx].private;
        await saveCollection('moments', allMoments);
      });
    });

    mmWallEl.querySelectorAll('[data-wall-edit]').forEach(b => {
      b.addEventListener('click', () => editMomentInStudio(allMoments[Number(b.getAttribute('data-wall-edit'))]));
    });

    mmWallEl.querySelectorAll('[data-wall-del]').forEach(b => {
      b.addEventListener('click', async () => {
        if (!confirm('删除这条日常吗？')) return;
        allMoments.splice(Number(b.getAttribute('data-wall-del')), 1);
        await saveCollection('moments', allMoments);
      });
    });
  }

  // ========================================================================
  // PAGE 3: LINEAR HOVER-ILLUMINATED WYSIWYG COLLECTION CARD COMPOSER
  // ========================================================================
  const shTitleInput = document.getElementById('sh-title-in');
  const shCreatorInput = document.getElementById('sh-creator-in');
  const shCommentInput = document.getElementById('sh-comment-in');
  const shLiveCover = document.getElementById('sh-live-cover');
  const shClearPoster = document.getElementById('sh-clear-poster');
  const shStatusGroup = document.getElementById('sh-status-group');
  const shGalleryEl = document.getElementById('sh-visual-gallery');
  const shSaveBtn = document.getElementById('sh-submit-btn');
  const shCancelBtn = document.getElementById('sh-cancel-btn');

  function renderSmartStatusPills() {
    const opts = STATUS_BY_TYPE[shType] || ['看过', '在看', '推荐'];
    if (!opts.includes(shStatus)) shStatus = opts[0];
    if (!shStatusGroup) return;
    shStatusGroup.innerHTML = opts
      .map(
        st =>
          `<button type="button" class="st-seg-btn ${st === shStatus ? 'active' : ''}" data-sh-status="${escapeHtml(st)}">${escapeHtml(st)}</button>`
      )
      .join('');
    shStatusGroup.querySelectorAll('[data-sh-status]').forEach(b => {
      b.addEventListener('click', () => {
        shStatus = b.getAttribute('data-sh-status');
        shStatusGroup.querySelectorAll('[data-sh-status]').forEach(x => x.classList.toggle('active', x === b));
      });
    });
  }

  function syncShelfComposerCover() {
    shLiveCover.className = `artifact-cover tone-bg-${shTone}`;
    const shortTitle = (shTitleInput.value.trim() || shType).slice(0, 2);
    if (shCover) {
      shLiveCover.innerHTML = `<img src="${escapeHtml(normalizePreviewImg(shCover))}" alt="" />`;
      shClearPoster.style.display = 'inline-flex';
    } else {
      shLiveCover.innerHTML = `
        <span style="font-size:10px; opacity:0.8; padding-left:4px;">${escapeHtml(shType)}</span>
        <span class="font-serif-cn" style="font-size:21px; font-weight:700; padding-left:4px;">${escapeHtml(shortTitle)}</span>`;
      shClearPoster.style.display = 'none';
    }
  }

  shTitleInput?.addEventListener('input', syncShelfComposerCover);

  document.getElementById('sh-cover-trigger')?.addEventListener('click', () => {
    chooseImages({ multiple: false }, paths => {
      if (paths[0]) {
        shCover = paths[0];
        syncShelfComposerCover();
      }
    });
  });

  shClearPoster?.addEventListener('click', () => {
    shCover = '';
    syncShelfComposerCover();
  });

  document.querySelectorAll('[data-sh-type]').forEach(b => {
    b.addEventListener('click', () => {
      shType = b.getAttribute('data-sh-type');
      document.querySelectorAll('[data-sh-type]').forEach(x => x.classList.toggle('active', x === b));
      renderSmartStatusPills();
      syncShelfComposerCover();
    });
  });

  document.querySelectorAll('[data-sh-star]').forEach(b => {
    b.addEventListener('click', () => {
      shRating = Number(b.getAttribute('data-sh-star'));
      document.querySelectorAll('[data-sh-star]').forEach(x => {
        x.textContent = Number(x.getAttribute('data-sh-star')) <= shRating ? '★' : '☆';
      });
    });
  });

  document.querySelectorAll('[data-sh-tone]').forEach(b => {
    b.addEventListener('click', () => {
      shTone = b.getAttribute('data-sh-tone');
      document.querySelectorAll('[data-sh-tone]').forEach(x => x.classList.toggle('active', x === b));
      syncShelfComposerCover();
    });
  });

  document.querySelectorAll('[data-sh-filter]').forEach(pill => {
    pill.addEventListener('click', () => {
      shGalleryFilter = pill.getAttribute('data-sh-filter');
      document.querySelectorAll('[data-sh-filter]').forEach(p => p.classList.toggle('active', p === pill));
      renderShelfGallery();
    });
  });

  function resetShelfBuilder() {
    editingShelfId = null;
    shTitleInput.value = '';
    shCreatorInput.value = '';
    shCommentInput.value = '';
    shCover = '';
    shSaveBtn.textContent = '收入收藏夹';
    shCancelBtn.style.display = 'none';
    renderSmartStatusPills();
    syncShelfComposerCover();
    requestAnimationFrame(() => autoGrow(shCommentInput));
  }

  function editShelfInBuilder(s) {
    editingShelfId = s.id;
    shType = s.type || '影视';
    shStatus = s.status || '看过';
    shRating = Number(s.rating) || 5;
    shTone = s.tone || 'sage';
    shCover = s.cover || '';
    shTitleInput.value = s.title || '';
    shCreatorInput.value = s.creator || '';
    shCommentInput.value = s.comment || '';
    document.querySelectorAll('[data-sh-type]').forEach(x => x.classList.toggle('active', x.getAttribute('data-sh-type') === shType));
    renderSmartStatusPills();
    if (!Array.from(shStatusGroup.querySelectorAll('[data-sh-status]')).some(x => x.getAttribute('data-sh-status') === shStatus)) {
      shStatus = s.status;
    }
    shStatusGroup.querySelectorAll('[data-sh-status]').forEach(x => x.classList.toggle('active', x.getAttribute('data-sh-status') === shStatus));
    document.querySelectorAll('[data-sh-tone]').forEach(x => x.classList.toggle('active', x.getAttribute('data-sh-tone') === shTone));
    document.querySelectorAll('[data-sh-star]').forEach(x => {
      x.textContent = Number(x.getAttribute('data-sh-star')) <= shRating ? '★' : '☆';
    });
    shSaveBtn.textContent = '保存修改';
    shCancelBtn.style.display = '';
    syncShelfComposerCover();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    requestAnimationFrame(() => {
      autoGrow(shCommentInput);
      shTitleInput.focus();
    });
  }

  shCancelBtn?.addEventListener('click', resetShelfBuilder);

  shSaveBtn?.addEventListener('click', async () => {
    const title = shTitleInput.value.trim();
    if (!title) {
      toast('请填写名称');
      shTitleInput.focus();
      return;
    }
    if (editingShelfId) {
      const t = allShelf.find(x => x.id === editingShelfId);
      if (t) {
        t.type = shType;
        t.status = shStatus;
        t.title = title;
        t.creator = shCreatorInput.value.trim();
        t.rating = shRating;
        t.tone = shTone;
        t.cover = shCover;
        t.comment = shCommentInput.value.trim();
      }
    } else {
      allShelf.unshift({
        id: 's-' + Date.now(),
        type: shType,
        status: shStatus,
        title,
        creator: shCreatorInput.value.trim(),
        rating: shRating,
        tone: shTone,
        cover: shCover,
        comment: shCommentInput.value.trim(),
      });
    }
    await saveCollection('shelf', allShelf);
    resetShelfBuilder();
  });

  const shStreamSearch = document.getElementById('sh-stream-search');
  shStreamSearch?.addEventListener('input', renderShelfGallery);

  [shTitleInput, shCreatorInput, shCommentInput].forEach(el => {
    el?.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        shSaveBtn?.click();
      }
    });
  });

  function renderShelfGallery() {
    const kw = (shStreamSearch?.value || '').trim().toLowerCase();
    const filtered = allShelf.filter(i => {
      if (shGalleryFilter !== 'all' && i.type !== shGalleryFilter) return false;
      if (kw) {
        const hay = `${i.title || ''} ${i.creator || ''} ${i.comment || ''} ${i.type || ''} ${i.status || ''}`.toLowerCase();
        if (!hay.includes(kw)) return false;
      }
      return true;
    });

    if (!filtered.length) {
      shGalleryEl.innerHTML = `<div style="grid-column:1 / -1; text-align:center; padding:36px 0; color:var(--st-ink-3); font-size:13.5px;">暂无匹配的收藏条目</div>`;
      return;
    }

    shGalleryEl.innerHTML = filtered
      .map(item => {
        const realIdx = allShelf.indexOf(item);
        return `
      <article class="shelf-card" style="background:var(--st-card);">
        <div class="artifact-cover tone-bg-${escapeHtml(item.tone || 'sage')}">
          ${
            item.cover
              ? `<img src="${escapeHtml(normalizePreviewImg(item.cover))}" alt="" />`
              : `<span style="font-size:10px; opacity:0.8; padding-left:4px;">${escapeHtml(item.type)}</span>
                 <span class="font-serif-cn" style="font-size:21px; font-weight:700; padding-left:4px;">${escapeHtml(String(item.title || '').slice(0, 2))}</span>`
          }
        </div>
        <div>
          <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
            <span class="cat-chip cat-sage">${escapeHtml(item.status)} · ${escapeHtml(item.type)}</span>
            <span class="stars-row">${'★'.repeat(item.rating || 5)}</span>
          </div>
          <h3 class="font-serif-cn" style="font-size:17.5px; font-weight:700; margin:0 0 4px;">${escapeHtml(item.title)}</h3>
          <div style="font-size:12px; color:var(--st-ink-3); margin-bottom:8px;">${escapeHtml(item.creator || '')}</div>
          <p style="font-size:13.8px; line-height:1.7; color:var(--st-ink-2); margin:0 0 10px;">${escapeHtml(item.comment || '')}</p>
          <div style="display:flex; gap:6px;">
            <button type="button" class="st-tiny-action" data-gal-edit="${realIdx}">修改</button>
            <button type="button" class="st-tiny-action" style="color:#C44444;" data-gal-del="${realIdx}">移除</button>
          </div>
        </div>
      </article>`;
      })
      .join('');

    shGalleryEl.querySelectorAll('[data-gal-edit]').forEach(b => {
      b.addEventListener('click', () => editShelfInBuilder(allShelf[Number(b.getAttribute('data-gal-edit'))]));
    });
    shGalleryEl.querySelectorAll('[data-gal-del]').forEach(b => {
      b.addEventListener('click', async () => {
        if (!confirm('从收藏夹移除吗？')) return;
        allShelf.splice(Number(b.getAttribute('data-gal-del')), 1);
        await saveCollection('shelf', allShelf);
      });
    });
  }

  // ========================================================================
  // PAGE 4: APPLE / LINEAR SETTINGS SHEET + LIVE PREVIEW + CATEGORY MANAGER
  // ========================================================================
  const stTitleIn = document.getElementById('decor-title');
  const stStartIn = document.getElementById('decor-start');
  const stHead1In = document.getElementById('decor-head1');
  const stHead2In = document.getElementById('decor-head2');
  const liveH1El = document.getElementById('decor-live-h1');
  const liveH2El = document.getElementById('decor-live-h2');
  const stIntroIn = document.getElementById('decor-intro');
  const stArchIn = document.getElementById('decor-arch');
  const stAboutIn = document.getElementById('decor-about');
  const polRowEl = document.getElementById('decor-polaroids');
  const phrasesListEl = document.getElementById('decor-phrases-list');
  const newPhraseIn = document.getElementById('decor-phrase-in');
  const catsListEl = document.getElementById('decor-cats-list');
  const newCatIn = document.getElementById('decor-cat-in');
  const stAvatarPick = document.getElementById('decor-avatar-pick');
  const stAvatarImg = document.getElementById('decor-avatar-img');
  const stAuthorIn = document.getElementById('decor-author');
  const stHandleIn = document.getElementById('decor-handle');
  const stStatusIn = document.getElementById('decor-status');
  const stLocationIn = document.getElementById('decor-location');
  const stRelocateBtn = document.getElementById('decor-relocate-btn');
  const stNavHomeIn = document.getElementById('decor-nav-home');
  const stNavMomentsIn = document.getElementById('decor-nav-moments');
  const stNavArchiveIn = document.getElementById('decor-nav-archive');
  const stNavShelfIn = document.getElementById('decor-nav-shelf');
  const stNavAboutIn = document.getElementById('decor-nav-about');
  let editAvatar = '';

  function syncGreetingLivePreview() {
    if (liveH1El) liveH1El.textContent = stHead1In.value.trim() || '欢迎闯入';
    if (liveH2El) liveH2El.textContent = stHead2In.value.trim() || '我的自留地';
  }

  stAvatarPick?.addEventListener('click', () => {
    chooseImages({ multiple: false }, paths => {
      if (paths[0]) {
        editAvatar = paths[0];
        if (stAvatarImg) stAvatarImg.src = normalizePreviewImg(editAvatar);
        markSettingsDirty();
      }
    });
  });

  [
    stTitleIn,
    stStartIn,
    stHead1In,
    stHead2In,
    stIntroIn,
    stArchIn,
    stAboutIn,
    stAuthorIn,
    stHandleIn,
    stStatusIn,
    stNavHomeIn,
    stNavMomentsIn,
    stNavArchiveIn,
    stNavShelfIn,
    stNavAboutIn,
  ].forEach(el => {
    el?.addEventListener('input', () => {
      syncGreetingLivePreview();
      markSettingsDirty();
    });
  });

  function renderPhrasesChips() {
    phrasesListEl.innerHTML = editPhrases
      .map(
        (ph, idx) => `
      <span class="phrase-pill-item" title="点击文字可直接编辑">
        <span contenteditable="true" spellcheck="false" data-ph-edit="${idx}">${escapeHtml(ph)}</span>
        <button type="button" data-ph-del="${idx}" title="移除">×</button>
      </span>`
      )
      .join('');
    phrasesListEl.querySelectorAll('[data-ph-edit]').forEach(sp => {
      sp.addEventListener('input', () => {
        editPhrases[Number(sp.getAttribute('data-ph-edit'))] = sp.textContent || '';
        markSettingsDirty();
      });
      sp.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sp.blur();
        }
      });
    });
    phrasesListEl.querySelectorAll('[data-ph-del]').forEach(b => {
      b.addEventListener('click', () => {
        editPhrases.splice(Number(b.getAttribute('data-ph-del')), 1);
        renderPhrasesChips();
        markSettingsDirty();
      });
    });
  }

  newPhraseIn?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      const v = newPhraseIn.value.trim();
      if (!v) return;
      editPhrases.push(v);
      newPhraseIn.value = '';
      renderPhrasesChips();
      markSettingsDirty();
    }
  });

  function renderDecorCategories() {
    if (!catsListEl) return;
    catsListEl.innerHTML = editCategories
      .map(
        (cat, idx) => `
      <span class="phrase-pill-item">
        <span>${escapeHtml(cat)}</span>
        <button type="button" data-cat-del="${idx}" title="移除分类">×</button>
      </span>`
      )
      .join('');
    catsListEl.querySelectorAll('[data-cat-del]').forEach(b => {
      b.addEventListener('click', () => {
        editCategories.splice(Number(b.getAttribute('data-cat-del')), 1);
        renderDecorCategories();
        markSettingsDirty();
      });
    });
  }

  newCatIn?.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.isComposing) {
      e.preventDefault();
      const v = newCatIn.value.trim();
      if (!v || editCategories.includes(v)) return;
      editCategories.push(v);
      newCatIn.value = '';
      renderDecorCategories();
      markSettingsDirty();
    }
  });

  function renderVisualPolaroidFrames() {
    while (editPolaroids.length < 3) {
      editPolaroids.push({ src: 'uploads/window-sunlight.svg', caption: '随手拍' });
    }
    polRowEl.innerHTML = editPolaroids
      .slice(0, 3)
      .map(
        (p, idx) => `
      <div class="editable-polaroid">
        <div class="pol-img-slot" data-pol-pick="${idx}">
          <img src="${escapeHtml(normalizePreviewImg(p.src))}" alt="" />
          <div class="pol-img-overlay">点击更换照片</div>
        </div>
        <input class="pol-caption-input" value="${escapeHtml(p.caption || '')}" data-pol-cap="${idx}" placeholder="写一句底边签注…" />
      </div>`
      )
      .join('');

    polRowEl.querySelectorAll('[data-pol-pick]').forEach(slot => {
      slot.addEventListener('click', () => {
        const idx = Number(slot.getAttribute('data-pol-pick'));
        chooseImages({ multiple: false }, paths => {
          if (paths[0]) {
            editPolaroids[idx].src = paths[0];
            renderVisualPolaroidFrames();
            markSettingsDirty();
          }
        });
      });
    });

    polRowEl.querySelectorAll('[data-pol-cap]').forEach(inp => {
      inp.addEventListener('input', () => {
        editPolaroids[Number(inp.getAttribute('data-pol-cap'))].caption = inp.value;
        markSettingsDirty();
      });
    });
  }

  async function refreshStudioAutoLocation({ preferGps = false, notify = false } = {}) {
    if (stRelocateBtn) stRelocateBtn.textContent = '定位中…';
    const loc = await detectStudioProvinceCity({ preferGps });
    if (stRelocateBtn) stRelocateBtn.textContent = '重新定位';
    if (!loc) {
      if (notify) toast('暂时无法获取省市定位');
      return '';
    }
    siteConfig.location = loc;
    localStorage.setItem('blog-auto-loc', loc);
    if (stLocationIn) stLocationIn.value = loc;
    try {
      await fetch('/api/site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...siteConfig, location: loc }),
      });
    } catch (_) {}
    if (notify) toast(`✓ 已自动定位至 ${loc}`);
    return loc;
  }

  stRelocateBtn?.addEventListener('click', () => {
    refreshStudioAutoLocation({ preferGps: true, notify: true });
  });

  function populateDecorTab() {
    stTitleIn.value = siteConfig.title || '';
    stStartIn.value = siteConfig.startDate || '2026-10-01';
    if (stAuthorIn) stAuthorIn.value = siteConfig.author || siteConfig.title || '';
    if (stHandleIn) stHandleIn.value = siteConfig.handle || 'ziliudi';
    if (stStatusIn) stStatusIn.value = siteConfig.statusText || '';
    if (stLocationIn) stLocationIn.value = siteConfig.location || '';
    const navCfg = siteConfig.navLabels || {};
    if (stNavHomeIn) stNavHomeIn.value = navCfg.home || '扉页';
    if (stNavMomentsIn) stNavMomentsIn.value = navCfg.moments || '朝夕';
    if (stNavArchiveIn) stNavArchiveIn.value = navCfg.archive || '纪事';
    if (stNavShelfIn) stNavShelfIn.value = navCfg.shelf || '珍藏';
    if (stNavAboutIn) stNavAboutIn.value = navCfg.about || '自叙';
    editAvatar = siteConfig.avatar || 'uploads/avatar-default.svg';
    if (stAvatarImg) stAvatarImg.src = normalizePreviewImg(editAvatar);
    stHead1In.value = siteConfig.heroHeadline || '';
    stHead2In.value = siteConfig.heroHeadlineAccent || '';
    stIntroIn.value = siteConfig.heroIntro || '';
    stArchIn.value = siteConfig.archiveBio || '';
    stAboutIn.value = siteConfig.aboutContent || '';
    editPhrases = [...(siteConfig.typewriterPhrases || [])];
    editCategories = [...(siteConfig.categories || ['造物', '随笔', '夜记'])];
    editPolaroids = JSON.parse(JSON.stringify(siteConfig.polaroids || []));
    syncGreetingLivePreview();
    renderPhrasesChips();
    renderDecorCategories();
    renderVisualPolaroidFrames();
    isSettingsDirty = false;
    updateSaveStatusUI();
    requestAnimationFrame(refreshAllAutoGrow);
  }

  document.getElementById('decor-save-btn')?.addEventListener('click', async () => {
    const pendingPhrase = newPhraseIn.value.trim();
    if (pendingPhrase) {
      editPhrases.push(pendingPhrase);
      newPhraseIn.value = '';
    }
    const pendingCat = newCatIn?.value.trim();
    if (pendingCat && !editCategories.includes(pendingCat)) {
      editCategories.push(pendingCat);
      newCatIn.value = '';
    }
    const updated = {
      ...siteConfig,
      title: stTitleIn.value.trim() || '自留地',
      author: stAuthorIn ? stAuthorIn.value.trim() || '自留地' : siteConfig.author,
      handle: stHandleIn ? stHandleIn.value.trim().replace(/^@+/, '') || 'ziliudi' : siteConfig.handle,
      avatar: editAvatar || siteConfig.avatar || 'uploads/avatar-default.svg',
      statusText: stStatusIn ? stStatusIn.value.trim() : siteConfig.statusText,
      location: stLocationIn ? stLocationIn.value.trim() : siteConfig.location,
      navLabels: {
        home: stNavHomeIn?.value.trim() || '扉页',
        moments: stNavMomentsIn?.value.trim() || '朝夕',
        archive: stNavArchiveIn?.value.trim() || '纪事',
        shelf: stNavShelfIn?.value.trim() || '珍藏',
        about: stNavAboutIn?.value.trim() || '自叙',
      },
      startDate: stStartIn.value || '2026-10-01',
      heroHeadline: stHead1In.value.trim(),
      heroHeadlineAccent: stHead2In.value.trim(),
      heroIntro: stIntroIn.value.trim(),
      typewriterPhrases: editPhrases.map(s => s.trim()).filter(Boolean),
      categories: editCategories.length ? editCategories : ['随笔'],
      polaroids: editPolaroids.slice(0, 3),
      archiveBio: stArchIn.value.trim(),
      aboutContent: stAboutIn.value,
    };
    const res = await fetch('/api/site', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    if ((await res.json()).ok) {
      isSettingsDirty = false;
      await reloadAllData(currentSlug);
      toast('✓ 设置已保存');
    }
  });

  // ========================================================================
  // GLOBAL DISMISS, DATA SYNC & KEYBOARD SHORTCUTS
  // ========================================================================
  document.addEventListener('click', e => {
    if (!e.target.closest('#cat-token-btn') && !e.target.closest('#cat-popover')) {
      catPopover?.classList.remove('open');
    }
    if (!e.target.closest('#mm-mood-btn') && !e.target.closest('#mm-mood-popover')) {
      mmMoodPopover?.classList.remove('open');
    }
    if (!e.target.closest('#tp-para-btn') && !e.target.closest('#tp-para-pop')) {
      tpParaPop?.classList.remove('open');
    }
    if (!e.target.closest('#tp-fmt-btn') && !e.target.closest('#tp-fmt-pop')) {
      tpFmtPop?.classList.remove('open');
    }
  });

  document.addEventListener('mousedown', e => {
    if (!e.target.closest('#slash-menu') && !e.target.closest('#gutter-plus')) {
      slashMenu?.classList.remove('open');
      slashOpen = false;
    }
    if (!e.target.closest('figure.post-figure') && !e.target.closest('#img-action-bar')) {
      clearSelectedFigure();
    }
    if (!e.target.closest('table') && !e.target.closest('#table-action-bar')) {
      clearActiveTableBar();
    }
  });

  async function saveCollection(kind, items) {
    const res = await fetch('/api/collection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kind, items }),
    });
    if ((await res.json()).ok) {
      await reloadAllData(currentSlug);
      toast('✓ 已保存');
    }
  }

  async function reloadAllData(selectSlug) {
    const res = await fetch('/api/state');
    const data = await res.json();
    allPosts = data.posts || [];
    allMoments = data.moments || [];
    allShelf = data.shelf || [];
    siteConfig = data.site || {};

    rebuildCategoryDropdown();
    renderDocSidebar();
    renderMomentsWall();
    renderSmartStatusPills();
    renderShelfGallery();
    populateDecorTab();
    syncShelfComposerCover();
    syncTopbarStatUI();

    if (!siteConfig.location || !siteConfig.location.includes('·')) {
      refreshStudioAutoLocation({ preferGps: false, notify: false });
    }

    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab');
    const editId = params.get('edit');
    const slugParam = selectSlug || params.get('slug');

    if (tabParam) {
      switchStudioTab(tabParam, true);
      if (tabParam === 'moments' && editId) {
        const m = allMoments.find(x => x.id === editId);
        if (m) editMomentInStudio(m);
      } else if (tabParam === 'shelf' && editId) {
        const s = allShelf.find(x => x.id === editId);
        if (s) editShelfInBuilder(s);
      }
      history.replaceState({}, '', `/studio.html?tab=${encodeURIComponent(tabParam)}`);
    }

    if (slugParam) {
      const found = allPosts.find(p => p.slug === slugParam);
      if (found) {
        history.replaceState({}, '', `/studio.html?slug=${encodeURIComponent(found.slug)}`);
        await loadPostIntoStudio(found);
        return;
      }
    }

    if (!currentSlug && allPosts.length && !params.has('new')) {
      await loadPostIntoStudio(allPosts[0]);
    } else if (!currentSlug) {
      startBlankDoc();
    }
    checkUnsavedDraftBanner();
  }

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (stLightbox?.classList.contains('open')) {
        stLightbox.classList.remove('open');
        return;
      }
      tpParaPop?.classList.remove('open');
      tpFmtPop?.classList.remove('open');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '/' && activeTab === 'posts') {
      e.preventDefault();
      modeSwitchBtn?.click();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === '\\' && activeTab === 'posts') {
      e.preventDefault();
      toggleSidebarRail();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      if (activeTab === 'posts') saveCurrentDoc();
      else if (activeTab === 'settings') document.getElementById('decor-save-btn')?.click();
    }
  });

  syncMomentBarUI();
  renderNineGridUploader();
  reloadAllData();
})();
