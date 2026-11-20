// V7 Seamless Experience Engine:
// Persistent-Shell SPA Router · Zero-Jump Inline Moments Composer & Reply
// Live Interactive Markdown Checkboxes · Quick Collection Modal · Polaroid Photo Swap
(function () {
  const isGuestPreview = () => document.documentElement.classList.contains('guest-preview');
  const isLocalDev = () => Boolean(window.__LOCAL_DEV__);

  function escapeHtml(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function highlightText(text, kw) {
    const safe = escapeHtml(text);
    if (!kw) return safe;
    const escapedKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return safe.replace(new RegExp(`(${escapedKw})`, 'gi'), '<mark class="search-hl">$1</mark>');
  }

  let toastTimer = null;
  function showGlobalToast(msg) {
    const el = document.getElementById('global-toast');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 2400);
  }

  // =========================================================
  // 0. AUTOMATIC PROVINCE & CITY GEOLOCATION ENGINE (Zero Manual Input)
  // =========================================================
  const EN_CN_MAP = {
    beijing: '北京', shanghai: '上海', tianjin: '天津', chongqing: '重庆',
    jiangsu: '江苏', zhejiang: '浙江', guangdong: '广东', fujian: '福建', shandong: '山东',
    anhui: '安徽', hubei: '湖北', hunan: '湖南', sichuan: '四川', shaanxi: '陕西',
    henan: '河南', hebei: '河北', liaoning: '辽宁', jilin: '吉林', heilongjiang: '黑龙江',
    jiangxi: '江西', shanxi: '山西', yunnan: '云南', guizhou: '贵州', guangxi: '广西',
    hainan: '海南', gansu: '甘肃', qinghai: '青海', ningxia: '宁夏', xinjiang: '新疆',
    tibet: '西藏', xizang: '西藏', 'inner mongolia': '内蒙古', neimenggu: '内蒙古',
    hongkong: '香港', 'hong kong': '香港', macau: '澳门', macao: '澳门', taiwan: '台湾',
    // All 13 Jiangsu Prefecture Cities + Major Cities
    nanjing: '南京', suzhou: '苏州', wuxi: '无锡', changzhou: '常州', xuzhou: '徐州',
    nantong: '南通', yangzhou: '扬州', zhenjiang: '镇江', taizhou: '泰州', yancheng: '盐城',
    huaian: '淮安', "huai'an": '淮安', lianyungang: '连云港', suqian: '宿迁', kunshan: '昆山',
    hangzhou: '杭州', ningbo: '宁波', wenzhou: '温州', jiaxing: '嘉兴', shaoxing: '绍兴',
    hefei: '合肥', wuhu: '芜湖', guangzhou: '广州', shenzhen: '深圳', dongguan: '东莞',
    foshan: '佛山', zhuhai: '珠海', xiamen: '厦门', fuzhou: '福州', quanzhou: '泉州',
    jinan: '济南', qingdao: '青岛', yantai: '烟台', wuhan: '武汉', changsha: '长沙',
    chengdu: '成都', xian: '西安', "xi'an": '西安', zhengzhou: '郑州', nanchang: '南昌',
    shenyang: '沈阳', dalian: '大连', harbin: '哈尔滨', changchun: '长春', kunming: '昆明',
    guiyang: '贵阳', nanning: '南宁', haikou: '海口', sanya: '三亚', lanzhou: '兰州',
  };

  function normalizeCnRegion(raw) {
    let s = String(raw || '').trim();
    if (!s) return '';
    s = s.replace(/\b(Province|City|Prefecture|Sheng|Shi|Autonomous Region|Municipality)\b/gi, '').trim();
    const low = s.toLowerCase();
    if (EN_CN_MAP[low]) return EN_CN_MAP[low];
    const stripped = s.replace(/(维吾尔自治区|壮族自治区|回族自治区|自治区|特别行政区|省|市|地区|盟)$/u, '').trim();
    return stripped.length >= 2 ? stripped : s;
  }

  function composeProvCity(prov, city, dist) {
    const p = normalizeCnRegion(prov);
    const c = normalizeCnRegion(city);
    const d = String(dist || '').trim();
    if (p && c && p !== c) return `${p} · ${c}`;
    if (p && d) return `${p} · ${d}`;
    return p || c || '';
  }

  function fetchJsonpPconline(timeoutMs = 3000) {
    return new Promise(resolve => {
      const script = document.createElement('script');
      const prevCb = window.IPCallBack;
      let settled = false;
      const finish = val => {
        if (settled) return;
        settled = true;
        window.IPCallBack = prevCb;
        script.remove();
        resolve(val);
      };
      const timer = setTimeout(() => finish(''), timeoutMs);
      window.IPCallBack = data => {
        clearTimeout(timer);
        finish(composeProvCity(data?.pro, data?.city, data?.region));
      };
      script.onerror = () => {
        clearTimeout(timer);
        finish('');
      };
      script.src = `https://whois.pconline.com.cn/ipJson.jsp?_=${Date.now()}`;
      document.head.appendChild(script);
    });
  }

  function getBrowserCoords(timeoutMs = 5200) {
    return new Promise(resolve => {
      if (!navigator.geolocation) return resolve(null);
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 600000 }
      );
    });
  }

  async function reverseGeocodeCoords(lat, lon) {
    try {
      const r = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&localityLanguage=zh`
      );
      if (r.ok) {
        const j = await r.json();
        const loc = composeProvCity(j.principalSubdivision, j.city || j.locality, '');
        if (loc) return loc;
      }
    } catch (_) {}
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&accept-language=zh-CN`
      );
      if (r.ok) {
        const j = await r.json();
        const ad = j.address || {};
        const loc = composeProvCity(ad.state || ad.province, ad.city || ad.town || ad.municipality, ad.county || ad.suburb);
        if (loc) return loc;
      }
    } catch (_) {}
    return '';
  }

  async function resolveAutoProvinceCity({ preferGps = false } = {}) {
    let tryGps = preferGps;
    if (!tryGps && navigator.permissions?.query) {
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        if (perm.state === 'granted') tryGps = true;
      } catch (_) {}
    }
    if (tryGps) {
      const coords = await getBrowserCoords();
      if (coords) {
        const gpsLoc = await reverseGeocodeCoords(coords.lat, coords.lon);
        if (gpsLoc) return gpsLoc;
      }
    }

    // 1. Tencent News Domestic IP-to-City (DIRECT in Mainland China proxy rules)
    try {
      const r = await fetch('https://r.inews.qq.com/api/ip2city');
      if (r.ok) {
        const j = await r.json();
        if (j && j.province) {
          const loc = composeProvCity(j.province, j.city, j.district);
          if (loc) return loc;
        }
      }
    } catch (_) {}

    // 3. Domestic PConline IPCallBack Script (DIRECT .com.cn, bypasses foreign VPN nodes)
    const pcLoc = await fetchJsonpPconline();
    if (pcLoc) return pcLoc;

    // 4. BigDataCloud IP Reverse Geocode (accept domestic CN directly; if proxy exit detected, ask OS Wi-Fi/GPS!)
    let foreignFallback = '';
    try {
      const r = await fetch('https://api.bigdatacloud.net/data/reverse-geocode-client?localityLanguage=zh');
      if (r.ok) {
        const j = await r.json();
        const loc = composeProvCity(j.principalSubdivision, j.city || j.locality, '');
        if (j.countryCode === 'CN' && loc) return loc;
        if (loc) foreignFallback = loc;
      }
    } catch (_) {}

    // 5. ipwho.is Lookup
    try {
      const r = await fetch('https://ipwho.is/?lang=zh-CN');
      if (r.ok) {
        const j = await r.json();
        if (j?.success !== false) {
          const loc = composeProvCity(j.region, j.city, '');
          if (j.country_code === 'CN' && loc) return loc;
          if (!foreignFallback && loc) foreignFallback = loc;
        }
      }
    } catch (_) {}

    // 6. If IP lookups hit an overseas proxy node, request physical OS/Wi-Fi coordinates to bypass VPN!
    if (!tryGps) {
      const coords = await getBrowserCoords();
      if (coords) {
        const gpsLoc = await reverseGeocodeCoords(coords.lat, coords.lon);
        if (gpsLoc) return gpsLoc;
      }
    }

    return foreignFallback;
  }

  let autoLocatedText =
    window.__SITE_META__?.location || localStorage.getItem('blog-auto-loc') || '';

  function paintLiveLocationDOM(locStr) {
    if (!locStr) return;
    document.querySelectorAll('[data-live-location]').forEach(el => {
      el.textContent = locStr;
      const wrap = el.closest('#gh-loc-row, .hero-gh-loc');
      if (wrap) wrap.style.display = '';
    });
  }

  async function syncAutoLocation({ preferGps = false, notify = false } = {}) {
    document.querySelectorAll('.loc-refresh-inline').forEach(b => b.classList.add('spinning'));
    const detected = await resolveAutoProvinceCity({ preferGps });
    document.querySelectorAll('.loc-refresh-inline').forEach(b => b.classList.remove('spinning'));

    if (!detected) {
      if (notify) showGlobalToast('暂时无法获取定位，请检查网络或浏览器定位权限');
      if (!autoLocatedText) paintLiveLocationDOM('未开启定位');
      return '';
    }

    autoLocatedText = detected;
    localStorage.setItem('blog-auto-loc', detected);
    sessionStorage.setItem('blog-auto-loc-ok', '1');
    if (window.__SITE_META__) window.__SITE_META__.location = detected;
    paintLiveLocationDOM(detected);

    if (isLocalDev() && !isGuestPreview()) {
      try {
        const stRes = await fetch('/api/state');
        const stData = await stRes.json();
        if ((stData.site?.location || '') !== detected) {
          await fetch('/api/site', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...(stData.site || {}), location: detected }),
          });
        }
      } catch (_) {}
    }

    if (notify) showGlobalToast(`已定位至 ${detected}`);
    return detected;
  }

  // Global Image Upload Helper (for Inline Composer, Homepage Polaroids & Quick Shelf Modal)
  const globalPicker = document.getElementById('global-img-picker');
  let globalPickerCb = null;

  function uploadImageFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const res = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: file.name || 'photo.png', dataUrl: reader.result }),
          });
          const out = await res.json();
          if (out.ok) resolve(out.path);
          else reject(new Error(out.error || '上传失败'));
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  function pickGlobalImages({ multiple = false } = {}, cb) {
    if (!globalPicker) return;
    globalPicker.multiple = multiple;
    globalPickerCb = cb;
    globalPicker.value = '';
    globalPicker.click();
  }

  globalPicker?.addEventListener('change', async () => {
    const files = Array.from(globalPicker.files || []);
    if (!files.length || !globalPickerCb) return;
    showGlobalToast('正在保存照片……');
    const paths = [];
    for (const f of files) paths.push(await uploadImageFile(f));
    globalPickerCb(paths);
  });

  // =========================================================
  // 1. PERSISTENT SHELL: Scroll Progress, Nav Glider, Theme, Privacy, Lightbox, Search
  // =========================================================
  const prog = document.getElementById('scroll-progress');
  const ringCircle = document.getElementById('progress-ring-circle');
  const dock = document.getElementById('utility-dock');
  const floatingNav = document.getElementById('floating-nav');
  const RING_CIRC = 2 * Math.PI * 19;
  let tocScrollHandler = null;

  function onWindowScroll() {
    const y = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = docH > 8 ? Math.min(1, Math.max(0, y / docH)) : 0;

    if (prog) prog.style.width = (ratio * 100).toFixed(1) + '%';
    if (ringCircle) {
      ringCircle.style.strokeDasharray = `${RING_CIRC}`;
      ringCircle.style.strokeDashoffset = `${RING_CIRC * (1 - ratio)}`;
    }
    if (dock) dock.classList.toggle('visible', y > 180);
    if (floatingNav) {
      const hasReading = floatingNav.getAttribute('data-has-reading') === '1';
      floatingNav.classList.toggle('is-reading-scrolled', hasReading && y > 180);
    }
    if (tocScrollHandler) tocScrollHandler();
  }
  window.addEventListener('scroll', onWindowScroll, { passive: true });

  document.getElementById('back-to-top')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  document.getElementById('nav-reading-title')?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Navigation Pill Spring Glider
  const navWrap = document.getElementById('nav-pills-wrap');
  const glider = document.getElementById('nav-glider');

  function moveGliderTo(el, instant) {
    if (!navWrap || !glider) return;
    if (!el) {
      glider.style.opacity = '0';
      return;
    }
    if (instant) glider.style.transition = 'none';
    glider.style.opacity = '1';
    glider.style.width = `${el.offsetWidth}px`;
    glider.style.transform = `translateX(${el.offsetLeft - 3}px)`;
    if (instant) {
      glider.offsetHeight;
      glider.style.transition = '';
    }
  }

  if (navWrap && glider) {
    const links = Array.from(navWrap.querySelectorAll('a'));
    moveGliderTo(navWrap.querySelector('a.active'), true);
    window.addEventListener('resize', () => moveGliderTo(navWrap.querySelector('a.active'), true));
    links.forEach(link => link.addEventListener('mouseenter', () => moveGliderTo(link, false)));
    navWrap.addEventListener('mouseleave', () => moveGliderTo(navWrap.querySelector('a.active'), false));
  }

  // Magnetic Buttons (Shell)
  function bindMagnetic(scope = document) {
    scope.querySelectorAll('[data-magnetic]').forEach(el => {
      if (el.dataset.magBound) return;
      el.dataset.magBound = '1';
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.24;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.24;
        el.style.transform = `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }
  bindMagnetic(document);

  // Random Walk Handler
  function bindRandomWalk(scope = document) {
    scope.querySelectorAll('[data-random-walk]').forEach(btn => {
      if (btn.dataset.rwBound) return;
      btn.dataset.rwBound = '1';
      btn.addEventListener('click', () => {
        const raw = (window.__SEARCH_INDEX__ || []).filter(i => i.kind === '文章');
        const list = isGuestPreview() ? raw.filter(p => !p.private) : raw;
        if (!list.length) return;
        const others = list.filter(p => !location.pathname.endsWith(p.url.replace(/^\.\.\//, '')));
        const pool = others.length ? others : list;
        const pick = pool[Math.floor(Math.random() * pool.length)];
        if (pick?.url) navigateSpa(pick.url);
      });
    });
  }
  bindRandomWalk(document);

  // Owner ⇄ Guest Privacy Toggle
  const privBtn = document.getElementById('privacy-view-toggle');
  const exitGuestBtn = document.getElementById('exit-guest-btn');
  const privIcoOwner = document.getElementById('priv-ico-owner');
  const privIcoGuest = document.getElementById('priv-ico-guest');
  const privLabel = document.getElementById('priv-label-text');

  function syncPrivacyUI() {
    const guest = isGuestPreview();
    if (privBtn) privBtn.classList.toggle('guest-active', guest);
    if (privIcoOwner) privIcoOwner.style.display = guest ? 'none' : 'inline-flex';
    if (privIcoGuest) privIcoGuest.style.display = guest ? 'inline-flex' : 'none';
    if (privLabel) privLabel.textContent = guest ? '恢复主人视角' : '访客视角';

    const statPosts = document.getElementById('hero-stat-posts');
    const statMoments = document.getElementById('hero-stat-moments');
    if (statPosts) statPosts.textContent = guest ? statPosts.getAttribute('data-public') : statPosts.getAttribute('data-owner');
    if (statMoments) statMoments.textContent = guest ? statMoments.getAttribute('data-public') : statMoments.getAttribute('data-owner');

    document.querySelectorAll('[data-owner-text]').forEach(el => {
      el.textContent = guest ? el.getAttribute('data-public-text') : el.getAttribute('data-owner-text');
    });

    const activeHomeTab = document.querySelector('.filter-tab.active');
    if (guest && activeHomeTab?.getAttribute('data-private') === '1') {
      document.querySelector('.filter-tab[data-filter-cat="all"]')?.click();
    }

    const activeArchCatEl = document.querySelector('.archive-pill.active[data-archive-cat]');
    if (guest && activeArchCatEl?.getAttribute('data-private') === '1') {
      document.querySelector('.archive-pill[data-archive-cat="all"]')?.click();
    }
    const activeArchYmEl = document.querySelector('.wc-month-chip.active[data-archive-ym]');
    if (guest && activeArchYmEl?.getAttribute('data-private') === '1') {
      document.querySelector('.wc-month-chip[data-archive-ym="all"]')?.click();
    }
    if (typeof refreshArchiveGroupVisibility === 'function') refreshArchiveGroupVisibility();
    if (typeof refreshMomentsMonthUI === 'function') refreshMomentsMonthUI();

    const countHint = document.getElementById('home-post-count');
    if (countHint) {
      const visibleCards = Array.from(document.querySelectorAll('.post-card')).filter(c => {
        if (guest && c.getAttribute('data-private') === '1') return false;
        return c.style.display !== 'none';
      });
      countHint.textContent = `${visibleCards.length} POSTS`;
    }
  }

  function setGuestMode(guest) {
    document.documentElement.classList.toggle('guest-preview', guest);
    sessionStorage.setItem('guest-preview', guest ? '1' : '0');
    syncPrivacyUI();
  }
  privBtn?.addEventListener('click', () => setGuestMode(!isGuestPreview()));
  exitGuestBtn?.addEventListener('click', () => setGuestMode(false));

  // Circular Clip-Path Ripple Theme Switch
  const themeBtn = document.getElementById('theme-toggle');
  const sunIco = document.getElementById('theme-icon-sun');
  const moonIco = document.getElementById('theme-icon-moon');

  function syncThemeIcons() {
    const cur = document.documentElement.getAttribute('data-theme') || 'light';
    if (sunIco) sunIco.style.display = cur === 'light' ? 'inline-flex' : 'none';
    if (moonIco) moonIco.style.display = cur === 'dark' ? 'inline-flex' : 'none';
  }
  if (themeBtn) {
    syncThemeIcons();
    themeBtn.addEventListener('click', e => {
      const cur = document.documentElement.getAttribute('data-theme') || 'light';
      const next = cur === 'light' ? 'dark' : 'light';
      const applySwitch = () => {
        document.documentElement.setAttribute('data-theme', next);
        localStorage.setItem('blog-theme', next);
        syncThemeIcons();
      };
      if (!document.startViewTransition) return applySwitch();

      const rect = themeBtn.getBoundingClientRect();
      const x = e.clientX || rect.left + rect.width / 2;
      const y = e.clientY || rect.top + rect.height / 2;
      const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

      document.documentElement.classList.add('theme-transitioning');
      const transition = document.startViewTransition(applySwitch);
      transition.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
          { duration: 500, easing: 'cubic-bezier(0.22, 1, 0.36, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      });
      transition.finished.finally(() => document.documentElement.classList.remove('theme-transitioning'));
    });
  }

  // Lightbox Controller
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCap = document.getElementById('lb-caption');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');
  let lbItems = [];
  let lbIndex = 0;

  function renderLightboxSlide() {
    if (!lbItems.length || !lbImg) return;
    const cur = lbItems[lbIndex];
    lbImg.src = cur.src;
    if (lbCap) {
      const counter = lbItems.length > 1 ? ` (${lbIndex + 1} / ${lbItems.length})` : '';
      lbCap.textContent = (cur.caption || '') + counter;
    }
    if (lbPrev) lbPrev.style.display = lbItems.length > 1 ? 'inline-flex' : 'none';
    if (lbNext) lbNext.style.display = lbItems.length > 1 ? 'inline-flex' : 'none';
  }

  function openLightbox(items, startIdx = 0) {
    if (!lb || !items.length) return;
    lbItems = items;
    lbIndex = startIdx;
    renderLightboxSlide();
    lb.classList.add('open');
  }
  function closeLightbox() {
    lb?.classList.remove('open');
  }
  lbPrev?.addEventListener('click', e => { e.stopPropagation(); lbIndex = (lbIndex - 1 + lbItems.length) % lbItems.length; renderLightboxSlide(); });
  lbNext?.addEventListener('click', e => { e.stopPropagation(); lbIndex = (lbIndex + 1) % lbItems.length; renderLightboxSlide(); });
  lb?.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });

  function bindZoomableImages(scope = document) {
    scope.querySelectorAll('img[data-zoomable]').forEach(img => {
      if (img.dataset.lbBound) return;
      img.dataset.lbBound = '1';
      img.addEventListener('click', e => {
        e.preventDefault();
        e.stopPropagation();
        const galleryWrap = img.closest('.moment-gallery');
        if (galleryWrap) {
          const peers = Array.from(galleryWrap.querySelectorAll('img[data-zoomable]'));
          openLightbox(peers.map(p => ({ src: p.src, caption: p.alt || '' })), Math.max(0, peers.indexOf(img)));
        } else {
          openLightbox([{ src: img.src, caption: img.alt || '' }], 0);
        }
      });
    });
  }

  // Spotlight Search + Raycast Command Palette Modal
  const searchBackdrop = document.getElementById('search-modal');
  const searchOpenBtn = document.getElementById('search-open');
  const searchInput = document.getElementById('search-input');
  const searchResults = document.getElementById('search-results');
  let kbSelectedIdx = 0;
  let cmdRegistry = {};

  const PALETTE_COMMANDS = [
    { id: 'snake', title: '启动极客终端 · 霓虹贪吃蛇', hint: '在终端窗口玩一局 60fps 街机贪吃蛇', key: 'snake', kw: 'snake 贪吃蛇 游戏 终端 街机' },
    { id: 'aura', title: '切换全站幻彩光谱', hint: '流彩 · 霓虹 · 极光 · 星云 · 霞光', key: 'C', kw: 'aura color 色彩 光谱 主题 配色' },
    { id: 'vinyl', title: '播放 / 暂停黑胶合成器', hint: 'Web Audio 实时程序化白噪音与电钢', key: 'P', kw: 'music vinyl play 黑胶 电台 音乐 播放' },
    { id: 'master-sound', title: '静音 / 开启全站总声音', hint: '一键控制电台、引力漩涡、琴键与按键总音量', key: 'V', kw: 'mute volume sound 静音 音量 声音 音效' },
    { id: 'meteor', title: '召唤漫天流星雨', hint: '划过夜空的彩色流星群', key: 'S', kw: 'meteor stars 流星 星空' },
    { id: 'fireworks', title: '在屏幕绽放物理烟花秀', hint: '多段重力粒子礼花', key: 'F', kw: 'fireworks 烟花 礼花' },
    { id: 'matrix', title: '切换幻彩星尘 / 霓虹代码雨', hint: '切换底层 60fps 画布引擎模式', key: 'M', kw: 'matrix 代码雨 黑客帝国 星尘' },
    { id: 'theme', title: '切换日夜光影模式', hint: '圆形涟漪过渡日间纸感与暗夜黑曜', key: 'D', kw: 'dark light theme 日夜 暗色 深色' },
    { id: 'random', title: '随机漫游一篇文章', hint: '跳进任意一篇旧文或随笔', key: 'R', kw: 'random walk 随机 漫游' },
  ];

  function executePaletteCommand(cmdId) {
    const fn = cmdRegistry[cmdId];
    if (fn) fn();
  }

  function openSearch() {
    if (!searchBackdrop) return;
    searchBackdrop.classList.add('open');
    kbSelectedIdx = 0;
    setTimeout(() => searchInput?.focus(), 40);
    renderSearch(searchInput?.value || '');
  }
  function closeSearch() {
    searchBackdrop?.classList.remove('open');
  }
  function updateKbHighlight() {
    const items = Array.from(searchResults?.querySelectorAll('.search-item') || []);
    items.forEach((el, idx) => {
      el.classList.toggle('kb-active', idx === kbSelectedIdx);
      if (idx === kbSelectedIdx) el.scrollIntoView({ block: 'nearest' });
    });
  }
  function renderSearch(q) {
    if (!searchResults) return;
    const raw = window.__SEARCH_INDEX__ || [];
    const list = isGuestPreview() ? raw.filter(p => !p.private) : raw;
    const trimmed = q.trim();
    const isCmdMode = trimmed.startsWith('>');
    const kw = isCmdMode ? trimmed.slice(1).trim() : trimmed;
    const kwLow = kw.toLowerCase();

    const matchedCmds = isCmdMode
      ? PALETTE_COMMANDS.filter(c => !kwLow || c.title.toLowerCase().includes(kwLow) || c.kw.includes(kwLow))
      : kwLow
      ? PALETTE_COMMANDS.filter(c => c.title.toLowerCase().includes(kwLow) || c.kw.includes(kwLow)).slice(0, 4)
      : PALETTE_COMMANDS.slice(0, 3);

    const matchedPosts = isCmdMode
      ? []
      : kwLow
      ? list.filter(
          p =>
            p.title.toLowerCase().includes(kwLow) ||
            p.summary.toLowerCase().includes(kwLow) ||
            p.category.toLowerCase().includes(kwLow) ||
            (p.tags || []).some(t => t.toLowerCase().includes(kwLow))
        )
      : list.slice(0, 6);

    kbSelectedIdx = 0;
    if (!matchedCmds.length && !matchedPosts.length) {
      searchResults.innerHTML = `<div style="padding:18px 6px; color:var(--ink-muted); font-size:13px;">没有找到匹配内容或指令</div>`;
      return;
    }

    let globalIdx = 0;
    const cmdHtml = matchedCmds
      .map(c => {
        const activeCls = globalIdx++ === 0 ? 'kb-active' : '';
        return `
        <button type="button" data-cmd-run="${c.id}" class="search-item ${activeCls}" style="width:100%; text-align:left; border:none; background:transparent; cursor:pointer;">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:13.8px; font-weight:600; margin-bottom:2px; color:var(--ink);">
            <div style="display:flex; align-items:center; gap:7px; min-width:0;">
              <span class="cmd-action-badge">指令</span>
              <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${highlightText(c.title, kw)}</span>
            </div>
            <span class="ui-kbd" style="flex-shrink:0;">${escapeHtml(c.key)}</span>
          </div>
          <div style="font-size:12px; color:var(--ink-muted); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            ${escapeHtml(c.hint)}
          </div>
        </button>`;
      })
      .join('');

    const postHtml = matchedPosts
      .slice(0, 10)
      .map(p => {
        const activeCls = globalIdx++ === 0 ? 'kb-active' : '';
        return `
        <a href="${p.url}" class="search-item ${activeCls}">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; font-size:14px; font-weight:600; margin-bottom:3px;">
            <div style="display:flex; align-items:center; gap:6px; min-width:0;">
              <span class="cat-chip" style="font-size:10.5px; padding:1px 7px; flex-shrink:0;">${escapeHtml(p.kind || '文章')}</span>
              <span style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${highlightText(p.title, kw)}</span>
            </div>
            <span class="font-mono-num" style="font-size:11.5px; font-weight:400; color:var(--ink-muted); flex-shrink:0;">${escapeHtml(p.date)}</span>
          </div>
          <div style="font-size:12.5px; color:var(--ink-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">
            <span style="color:var(--accent); margin-right:6px;">#${escapeHtml(p.category)}</span>${highlightText(p.summary, kw)}
          </div>
        </a>`;
      })
      .join('');

    searchResults.innerHTML = cmdHtml + postHtml;
  }

  const searchClearBtn = document.getElementById('search-clear-btn');
  searchOpenBtn?.addEventListener('click', openSearch);
  searchBackdrop?.addEventListener('click', e => { if (e.target === searchBackdrop) closeSearch(); });
  searchInput?.addEventListener('input', e => {
    searchClearBtn?.classList.toggle('visible', Boolean(e.target.value));
    renderSearch(e.target.value);
  });
  searchClearBtn?.addEventListener('click', () => {
    if (!searchInput) return;
    searchInput.value = '';
    searchClearBtn.classList.remove('visible');
    renderSearch('');
    searchInput.focus();
  });
  searchResults?.addEventListener('click', e => {
    const cmdBtn = e.target.closest('[data-cmd-run]');
    if (cmdBtn) {
      const id = cmdBtn.getAttribute('data-cmd-run');
      closeSearch();
      executePaletteCommand(id);
      return;
    }
    const link = e.target.closest('a.search-item');
    if (link) closeSearch();
  });

  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      openSearch();
      return;
    }
    if (searchBackdrop?.classList.contains('open')) {
      const items = Array.from(searchResults?.querySelectorAll('.search-item') || []);
      if (e.key === 'ArrowDown' && items.length) {
        e.preventDefault();
        kbSelectedIdx = (kbSelectedIdx + 1) % items.length;
        updateKbHighlight();
      } else if (e.key === 'ArrowUp' && items.length) {
        e.preventDefault();
        kbSelectedIdx = (kbSelectedIdx - 1 + items.length) % items.length;
        updateKbHighlight();
      } else if (e.key === 'Enter' && items[kbSelectedIdx]) {
        e.preventDefault();
        const activeItem = items[kbSelectedIdx];
        const cmdId = activeItem.getAttribute('data-cmd-run');
        if (cmdId) {
          closeSearch();
          executePaletteCommand(cmdId);
        } else {
          const href = activeItem.getAttribute('href');
          closeSearch();
          if (href) navigateSpa(href);
        }
      } else if (e.key === 'Escape') {
        closeSearch();
      }
      return;
    }
    if (e.key === 'Escape') {
      closeLightbox();
      document.getElementById('quick-shelf-modal')?.classList.remove('open');
    } else if (lb?.classList.contains('open')) {
      if (e.key === 'ArrowLeft') lbPrev?.click();
      if (e.key === 'ArrowRight') lbNext?.click();
    }
  });

  // =========================================================
  // 2. TRUE PERSISTENT-SHELL SPA ROUTER (Zero White Flash!)
  // =========================================================
  let twTimer = null;

  async function navigateSpa(href, { push = true } = {}) {
    if (location.protocol === 'file:') {
      location.href = href;
      return;
    }
    const targetUrl = new URL(href, location.href);
    if (
      targetUrl.origin !== location.origin ||
      /\/studio(\.html)?$/i.test(targetUrl.pathname) ||
      /\/studio(\.html)?$/i.test(location.pathname) ||
      targetUrl.pathname.endsWith('.xml')
    ) {
      location.href = targetUrl.href;
      return;
    }

    try {
      const res = await fetch(targetUrl.href);
      if (!res.ok) {
        location.href = targetUrl.href;
        return;
      }
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const nextAppView = doc.getElementById('app-view');
      const curAppView = document.getElementById('app-view');
      if (!nextAppView || !curAppView) {
        location.href = targetUrl.href;
        return;
      }

      document.title = doc.title;
      if (push) history.pushState({}, '', targetUrl.href);

      // Sync relative links in persistent header & footer so depth (/ vs /posts/) stays accurate
      const nextBrand = doc.querySelector('.brand');
      const curBrand = document.querySelector('.brand');
      if (nextBrand && curBrand) {
        curBrand.setAttribute('href', nextBrand.getAttribute('href'));
        const nextAv = nextBrand.querySelector('.brand-avatar');
        const curAv = curBrand.querySelector('.brand-avatar');
        if (nextAv && curAv) curAv.setAttribute('src', nextAv.getAttribute('src'));
      }

      const nextWrite = doc.querySelector('.write-cta-pill');
      const curWrite = document.querySelector('.write-cta-pill');
      if (nextWrite && curWrite) curWrite.setAttribute('href', nextWrite.getAttribute('href'));

      const nextFootSet = doc.querySelector('.site-footer a[href*="studio.html"]');
      const curFootSet = document.querySelector('.site-footer a[href*="studio.html"]');
      if (nextFootSet && curFootSet) curFootSet.setAttribute('href', nextFootSet.getAttribute('href'));

      hideFloatingTip();

      doc.querySelectorAll('[data-nav-key]').forEach(nextLink => {
        const key = nextLink.getAttribute('data-nav-key');
        const curLink = navWrap?.querySelector(`[data-nav-key="${key}"]`);
        if (curLink) {
          curLink.setAttribute('href', nextLink.getAttribute('href'));
          curLink.textContent = nextLink.textContent;
        }
      });

      // Parse SPA metadata JSON
      const metaEl = doc.getElementById('spa-page-meta');
      if (metaEl) {
        const meta = JSON.parse(metaEl.textContent);
        window.__SEARCH_INDEX__ = meta.searchData || [];
        window.__MOMENTS__ = meta.moments || [];
        if (meta.siteMeta) window.__SITE_META__ = meta.siteMeta;

        if (floatingNav) {
          floatingNav.setAttribute('data-has-reading', meta.readingTitle ? '1' : '0');
          floatingNav.classList.remove('is-reading-scrolled');
        }
        const readTitleEl = document.getElementById('nav-reading-title');
        if (readTitleEl) readTitleEl.textContent = meta.readingTitle || '';

        if (navWrap) {
          navWrap.querySelectorAll('a').forEach(a => {
            a.classList.toggle('active', a.getAttribute('data-nav-key') === meta.activeNav);
          });
          // Smooth spring slide of nav pill to the new active tab!
          moveGliderTo(navWrap.querySelector('a.active'), false);
        }
      }

      // Swap view with silky entrance animation
      curAppView.innerHTML = nextAppView.innerHTML;
      curAppView.classList.remove('spa-entering');
      curAppView.offsetHeight;
      curAppView.classList.add('spa-entering');

      if (targetUrl.hash) {
        document.getElementById(targetUrl.hash.slice(1))?.scrollIntoView();
      } else {
        window.scrollTo({ top: 0, behavior: 'instant' });
      }

      mountPageView(curAppView);
      onWindowScroll();
    } catch (_) {
      location.href = targetUrl.href;
    }
  }

  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const link = e.target.closest('a[href]');
    if (!link) return;
    const rawHref = link.getAttribute('href') || '';
    if (!rawHref || rawHref.startsWith('#') || link.target === '_blank' || link.hasAttribute('download')) return;
    const url = new URL(rawHref, location.href);
    if (
      url.origin === location.origin &&
      !url.pathname.endsWith('studio.html') &&
      !location.pathname.endsWith('studio.html') &&
      !url.pathname.endsWith('.xml')
    ) {
      e.preventDefault();
      navigateSpa(url.href, { push: true });
    }
  });

  window.addEventListener('popstate', () => {
    navigateSpa(location.href, { push: false });
  });

  // =========================================================
  // 3. PAGE VIEW MOUNTER (Runs on initial load & every SPA transition)
  // =========================================================
  let refreshArchiveGroupVisibility = null;
  let refreshMomentsMonthUI = null;

  function spawnBurst(x, y) {
    const colors = ['#B8563A', '#E0943A', '#D97254', '#58826B'];
    for (let i = 0; i < 7; i++) {
      const p = document.createElement('span');
      p.className = 'like-particle';
      const angle = (Math.PI * 2 * i) / 7 + (Math.random() - 0.5) * 0.4;
      const dist = 22 + Math.random() * 18;
      p.style.left = `${x - 3}px`;
      p.style.top = `${y - 3}px`;
      p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', `${Math.cos(angle) * dist}px`);
      p.style.setProperty('--dy', `${Math.sin(angle) * dist}px`);
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 600);
    }
  }

  function bindMomentCardEvents(card) {
    bindZoomableImages(card);

    // Heart Applause (Persists to disk in local mode!)
    const likeBtn = card.querySelector('[data-moment-id]');
    if (likeBtn && !likeBtn.dataset.bound) {
      likeBtn.dataset.bound = '1';
      const id = likeBtn.getAttribute('data-moment-id');
      const countEl = likeBtn.querySelector('.like-count');
      const key = `liked-moment-${id}`;
      if (localStorage.getItem(key) === '1') likeBtn.classList.add('liked');

      likeBtn.addEventListener('click', async e => {
        const already = localStorage.getItem(key) === '1';
        const curVal = Number(countEl?.textContent) || 0;
        if (already) {
          localStorage.removeItem(key);
          likeBtn.classList.remove('liked');
          if (countEl) countEl.textContent = String(Math.max(0, curVal - 1));
          if (isLocalDev()) fetch('/api/moment/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, delta: -1 }) });
        } else {
          localStorage.setItem(key, '1');
          likeBtn.classList.add('liked', 'pop');
          if (countEl) countEl.textContent = String(curVal + 1);
          const r = likeBtn.getBoundingClientRect();
          spawnBurst(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2);
          setTimeout(() => likeBtn.classList.remove('pop'), 240);
          if (isLocalDev()) fetch('/api/moment/like', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, delta: 1 }) });
        }
      });
    }

    // Inline Follow-Up Reply (+ 追评)
    const replyToggle = card.querySelector('[data-reply-toggle]');
    const replyBox = card.querySelector('[data-reply-box]');
    const replySend = card.querySelector('[data-reply-send]');
    const notesBox = card.querySelector('[data-notes-for]');
    if (replyToggle && replyBox && !replyToggle.dataset.bound) {
      replyToggle.dataset.bound = '1';
      const inp = replyBox.querySelector('input');
      replyToggle.addEventListener('click', () => {
        replyBox.classList.toggle('open');
        if (replyBox.classList.contains('open')) inp?.focus();
      });

      const submitReply = async () => {
        const txt = inp?.value.trim();
        if (!txt) return;
        const id = replyToggle.getAttribute('data-reply-toggle');
        const res = await fetch('/api/moment/note', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, note: txt }),
        });
        if ((await res.json()).ok) {
          inp.value = '';
          replyBox.classList.remove('open');
          if (notesBox) {
            notesBox.style.display = '';
            const row = document.createElement('div');
            row.innerHTML = `<strong style="color:var(--accent); font-weight:600;">追记：</strong>${escapeHtml(txt)}`;
            notesBox.appendChild(row);
          }
          showGlobalToast('✓ 已追加评论');
        }
      };
      replySend?.addEventListener('click', submitReply);
      inp?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitReply();
        }
      });
    }

    // Inline Edit Publish Time (Backward or Forward)
    const timeToggles = card.querySelectorAll('[data-time-toggle]');
    const timeBox = card.querySelector('[data-time-box]');
    const timeSave = card.querySelector('[data-time-save]');
    if (timeToggles.length && timeBox && !timeBox.dataset.bound) {
      timeBox.dataset.bound = '1';
      const dtInp = timeBox.querySelector('input[type="datetime-local"]');
      const timeLabelEl = card.querySelector('time.font-mono-num');

      timeToggles.forEach(btn => {
        btn.addEventListener('click', () => {
          if (isGuestPreview() || !isLocalDev()) return;
          timeBox.classList.toggle('open');
          if (timeBox.classList.contains('open')) dtInp?.focus();
        });
      });

      const commitTimeChange = async () => {
        const rawVal = dtInp?.value || '';
        if (!rawVal) return;
        const newStamp = rawVal.replace('T', ' ').slice(0, 16);
        const id = timeSave?.getAttribute('data-time-save') || card.getAttribute('data-moment-card');
        const stRes = await fetch('/api/state');
        const stData = await stRes.json();
        const list = Array.isArray(stData.moments) ? stData.moments : [];
        const target = list.find(x => x.id === id);
        if (!target) return;
        target.date = newStamp;
        list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
        const saveRes = await fetch('/api/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'moments', items: list }),
        });
        if ((await saveRes.json()).ok) {
          card.setAttribute('data-moment-date', newStamp);
          card.setAttribute('data-moment-ym', newStamp.slice(0, 7));
          if (timeLabelEl) timeLabelEl.textContent = newStamp;
          timeBox.classList.remove('open');
          const parentStream = card.parentElement;
          if (parentStream) {
            const peers = Array.from(parentStream.querySelectorAll('.moment-card')).filter(el => el !== card);
            const beforeEl = peers.find(el => (el.getAttribute('data-moment-date') || '') < newStamp);
            if (beforeEl) parentStream.insertBefore(card, beforeEl);
            else parentStream.appendChild(card);
          }
          if (refreshMomentsMonthUI) refreshMomentsMonthUI();
          showGlobalToast('发布时间已更新');
        }
      };

      timeSave?.addEventListener('click', commitTimeChange);
      dtInp?.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
          e.preventDefault();
          commitTimeChange();
        } else if (e.key === 'Escape') {
          timeBox.classList.remove('open');
        }
      });
    }

    // Inline Edit / Auto-Detect Moment Location
    const locBox = card.querySelector('[data-loc-box]');
    const locSave = card.querySelector('[data-loc-save]');
    const locAuto = card.querySelector('[data-loc-auto]');
    if (locBox && !locBox.dataset.bound) {
      locBox.dataset.bound = '1';
      const locInp = locBox.querySelector('input[type="text"]');
      const id = locSave?.getAttribute('data-loc-save') || card.getAttribute('data-moment-card');

      card.addEventListener('click', e => {
        const trg = e.target.closest(`[data-loc-toggle="${id}"]`);
        if (!trg || isGuestPreview() || !isLocalDev()) return;
        locBox.classList.toggle('open');
        if (locBox.classList.contains('open')) locInp?.focus();
      });

      locAuto?.addEventListener('click', async () => {
        const prev = locAuto.textContent;
        locAuto.textContent = '定位中…';
        const loc = (autoLocatedText && autoLocatedText.includes('·'))
          ? autoLocatedText
          : (await syncAutoLocation({ preferGps: true, notify: false })) || autoLocatedText;
        locAuto.textContent = prev || '自动获取';
        if (loc && locInp) {
          locInp.value = loc;
          locInp.focus();
          locInp.setSelectionRange(loc.length, loc.length);
        } else {
          showGlobalToast('未能自动获取位置，可直接手动输入');
        }
      });

      const commitLocChange = async () => {
        const newLoc = (locInp?.value || '').trim();
        const stRes = await fetch('/api/state');
        const stData = await stRes.json();
        const list = Array.isArray(stData.moments) ? stData.moments : [];
        const target = list.find(x => x.id === id);
        if (!target) return;
        target.location = newLoc;
        const saveRes = await fetch('/api/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'moments', items: list }),
        });
        if ((await saveRes.json()).ok) {
          const slot = card.querySelector(`[data-loc-slot="${id}"]`);
          if (slot) {
            slot.innerHTML = newLoc
              ? `<span class="moment-loc-tag" data-loc-toggle="${escapeHtml(id)}" style="cursor:pointer;" title="点击修改或清除地点"><svg class="ico" viewBox="0 0 24 24" style="width:12px;height:12px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>${escapeHtml(newLoc)}</span></span>`
              : '';
          }
          locBox.classList.remove('open');
          showGlobalToast(newLoc ? '地点已更新' : '已清除地点');
        }
      };

      locSave?.addEventListener('click', commitLocChange);
      locInp?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.isComposing) {
          e.preventDefault();
          commitLocChange();
        } else if (e.key === 'Escape') {
          locBox.classList.remove('open');
        }
      });
    }

    // Inline Flip Private / Public
    const flipBtn = card.querySelector('[data-flip-priv]');
    if (flipBtn && !flipBtn.dataset.bound) {
      flipBtn.dataset.bound = '1';
      flipBtn.addEventListener('click', async () => {
        const id = flipBtn.getAttribute('data-flip-priv');
        const res = await fetch('/api/moment/toggle-private', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id }),
        });
        const out = await res.json();
        if (out.ok) {
          card.setAttribute('data-private', out.private ? '1' : '0');
          if (!out.private) card.removeAttribute('data-private');
          flipBtn.textContent = out.private ? '设为公开' : '锁为私密';
          const slot = card.querySelector(`[data-priv-slot="${id}"]`);
          if (slot) {
            slot.innerHTML = out.private
              ? `<span class="priv-badge"><svg class="ico" viewBox="0 0 24 24" style="width:12.5px;height:12.5px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>仅自己可见</span></span>`
              : '';
          }
          showGlobalToast(out.private ? '已设为私密' : '已设为公开');
        }
      });
    }

    // Inline Delete Moment
    const delBtn = card.querySelector('[data-del-moment]');
    if (delBtn && !delBtn.dataset.bound) {
      delBtn.dataset.bound = '1';
      delBtn.addEventListener('click', async () => {
        if (!confirm('删除这条日常吗？')) return;
        const id = delBtn.getAttribute('data-del-moment');
        const res = await fetch(`/api/moment?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if ((await res.json()).ok) {
          card.style.transition = 'opacity 0.22s, transform 0.22s';
          card.style.opacity = '0';
          card.style.transform = 'scale(0.96)';
          setTimeout(() => {
            card.remove();
            if (refreshMomentsMonthUI) refreshMomentsMonthUI();
          }, 220);
          showGlobalToast('已删除');
        }
      });
    }
  }

  function mountPageView(scope = document) {
    clearTimeout(twTimer);
    tocScrollHandler = null;

    bindZoomableImages(scope);
    bindMagnetic(scope);
    bindRandomWalk(scope);

    // Cursor Spotlight
    scope.querySelectorAll('[data-spotlight]').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });

    // Scroll Reveal
    const revealItems = scope.querySelectorAll('.reveal-on-scroll');
    if ('IntersectionObserver' in window && revealItems.length) {
      const io = new IntersectionObserver(
        entries => {
          entries.forEach(ent => {
            if (ent.isIntersecting) {
              ent.target.classList.add('is-visible');
              io.unobserve(ent.target);
            }
          });
        },
        { threshold: 0.05 }
      );
      revealItems.forEach(el => io.observe(el));
    } else {
      revealItems.forEach(el => el.classList.add('is-visible'));
    }

    // Count-Up Numbers
    scope.querySelectorAll('[data-countup]').forEach(el => {
      const guest = isGuestPreview();
      const target =
        guest && el.hasAttribute('data-public')
          ? Number(el.getAttribute('data-public'))
          : Number(el.getAttribute('data-countup')) || 0;
      const duration = 520;
      const start = performance.now();
      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (t < 1) requestAnimationFrame(frame);
        else syncPrivacyUI();
      }
      requestAnimationFrame(frame);
    });
    syncPrivacyUI();

    // Typewriter Status Bar
    const twEl = scope.querySelector('#hero-typewriter');
    const phrases = Array.isArray(window.__TYPEWRITER__) ? window.__TYPEWRITER__ : [];
    if (twEl && phrases.length > 1) {
      let pIdx = 0;
      let charIdx = phrases[0].length;
      let deleting = false;
      function tickTw() {
        const full = phrases[pIdx];
        if (!deleting) {
          charIdx++;
          twEl.textContent = full.slice(0, charIdx) || '\u200B';
          if (charIdx >= full.length) {
            deleting = true;
            twTimer = setTimeout(tickTw, 2800);
            return;
          }
          twTimer = setTimeout(tickTw, 72);
        } else {
          charIdx--;
          twEl.textContent = full.slice(0, charIdx) || '\u200B';
          if (charIdx <= 0) {
            deleting = false;
            pIdx = (pIdx + 1) % phrases.length;
            twTimer = setTimeout(tickTw, 240);
            return;
          }
          twTimer = setTimeout(tickTw, 34);
        }
      }
      twTimer = setTimeout(() => {
        deleting = true;
        tickTw();
      }, 2800);
    }

    // Polaroid Deck Shuffle + Quick Upload right from Homepage!
    const deck = scope.querySelector('#polaroid-deck');
    if (deck) {
      const cards = Array.from(deck.querySelectorAll('.polaroid-card'));
      let shuffling = false;
      deck.addEventListener('click', e => {
        if (e.target.closest('#polaroid-upload-btn')) return;
        if (cards.length <= 1 || shuffling) return;
        shuffling = true;
        const frontCard = cards.find(c => c.getAttribute('data-pos') === '0');
        if (frontCard) frontCard.classList.add('tossing');
        setTimeout(() => {
          cards.forEach(c => {
            const cur = Number(c.getAttribute('data-pos')) || 0;
            c.setAttribute('data-pos', String((cur - 1 + cards.length) % cards.length));
          });
        }, 180);
        setTimeout(() => {
          if (frontCard) frontCard.classList.remove('tossing');
          shuffling = false;
        }, 450);
      });

      cards.forEach(c => {
        c.addEventListener('dblclick', e => {
          e.stopPropagation();
          openLightbox(
            cards.map(item => ({ src: item.getAttribute('data-src'), caption: item.getAttribute('data-caption') || '' })),
            cards.indexOf(c)
          );
        });
      });

      const polUpBtn = deck.querySelector('#polaroid-upload-btn');
      polUpBtn?.addEventListener('click', e => {
        e.stopPropagation();
        pickGlobalImages({ multiple: false }, async paths => {
          if (!paths[0]) return;
          const front = cards.find(c => c.getAttribute('data-pos') === '0');
          const cap = front?.getAttribute('data-caption') || '随手拍';
          await fetch('/api/polaroid/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ src: paths[0], caption: cap }),
          });
          if (front) {
            front.setAttribute('data-src', paths[0]);
            front.querySelector('img').src = paths[0];
          }
          showGlobalToast('已更换拍立得照片');
        });
      });
    }

    // Heatmap
    const heatCaption = scope.querySelector('#heat-caption');
    scope.querySelectorAll('.heat-cell').forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        const hiddenPriv = isGuestPreview() && cell.getAttribute('data-priv-cell') === '1';
        const tipText = hiddenPriv ? `${cell.getAttribute('data-tip')?.slice(0, 10) || ''} · 无公开记录` : (cell.getAttribute('data-tip') || '');
        if (heatCaption) heatCaption.textContent = tipText;
        showFloatingTip(cell, tipText);
      });
      cell.addEventListener('mouseleave', () => {
        hideFloatingTip();
        if (heatCaption) heatCaption.textContent = heatCaption.getAttribute('data-default-cap') || '';
      });
      cell.addEventListener('click', () => {
        if (isGuestPreview() && cell.getAttribute('data-priv-cell') === '1') return;
        const href = cell.getAttribute('data-href');
        if (href) navigateSpa(href);
      });
    });

    // Homepage Moments Flip
    const mmBody = scope.querySelector('#moment-mini-body');
    const mmMeta = scope.querySelector('#moment-mini-meta');
    const mmFlipBtn = scope.querySelector('#moment-flip-btn');
    let mmIdx = 0;
    mmFlipBtn?.addEventListener('click', () => {
      const raw = Array.isArray(window.__MOMENTS__) ? window.__MOMENTS__ : [];
      const list = isGuestPreview() ? raw.filter(m => !m.private) : raw;
      if (list.length <= 1 || !mmBody) return;
      mmBody.style.opacity = '0';
      mmBody.style.transform = 'translateY(5px)';
      setTimeout(() => {
        mmIdx = (mmIdx + 1) % list.length;
        const cur = list[mmIdx];
        mmBody.textContent = cur.content;
        if (mmMeta) mmMeta.textContent = `#${cur.mood || '日常'} · ${cur.date}`;
        mmBody.style.opacity = '1';
        mmBody.style.transform = 'translateY(0)';
      }, 170);
    });

    // Zero-Jump Inline Composer on /moments.html (Default = Publish Time, Past/Future Adjustable)!
    const composer = scope.querySelector('#inline-composer');
    if (composer) {
      let icImages = [];
      let icMood = '日常';
      let icCustomTime = false;
      const icText = composer.querySelector('#ic-content');
      const icThumbs = composer.querySelector('#ic-thumbs');
      const icLocDrawer = composer.querySelector('#ic-loc-drawer');
      const icLoc = composer.querySelector('#ic-location');
      const icLocBtn = composer.querySelector('#ic-loc-btn');
      const icLocLabel = composer.querySelector('#ic-loc-label');
      const icLocAuto = composer.querySelector('#ic-loc-auto');
      const icLocClear = composer.querySelector('#ic-loc-clear');
      const icPriv = composer.querySelector('#ic-private');
      const icTimeWrap = composer.querySelector('#ic-time-wrap');
      const icTimeTrigger = composer.querySelector('#ic-time-trigger');
      const icDatetime = composer.querySelector('#ic-datetime');
      const icTimeReset = composer.querySelector('#ic-time-reset');
      const stream = scope.querySelector('#moments-stream');

      function syncIcLocUI() {
        const val = (icLoc?.value || '').trim();
        icLocBtn?.classList.toggle('active', Boolean(val));
        if (icLocLabel) icLocLabel.textContent = val || '位置';
      }

      icLocBtn?.addEventListener('click', () => {
        const open = icLocDrawer?.classList.toggle('open');
        if (open) icLoc?.focus();
      });

      icLoc?.addEventListener('input', syncIcLocUI);

      icLocAuto?.addEventListener('click', async () => {
        const prev = icLocAuto.textContent;
        icLocAuto.textContent = '定位中…';
        const loc = (autoLocatedText && autoLocatedText.includes('·'))
          ? autoLocatedText
          : (await syncAutoLocation({ preferGps: true, notify: false })) || autoLocatedText;
        icLocAuto.textContent = prev || '自动获取';
        if (loc && icLoc) {
          icLoc.value = loc;
          icLocDrawer?.classList.add('open');
          icLoc.focus();
          icLoc.setSelectionRange(loc.length, loc.length);
        } else {
          showGlobalToast('未能自动获取位置，可直接手动输入');
          icLoc?.focus();
        }
        syncIcLocUI();
      });

      icLocClear?.addEventListener('click', () => {
        if (icLoc) icLoc.value = '';
        icLocDrawer?.classList.remove('open');
        syncIcLocUI();
      });

      const nowDtLocal = () => {
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
      };

      function resetIcTime() {
        icCustomTime = false;
        if (icDatetime) icDatetime.value = '';
        icTimeWrap?.classList.remove('is-custom');
        icTimeReset?.classList.remove('visible');
      }

      icTimeTrigger?.addEventListener('click', () => {
        icCustomTime = true;
        if (icDatetime && !icDatetime.value) icDatetime.value = nowDtLocal();
        icTimeWrap?.classList.add('is-custom');
        icTimeReset?.classList.add('visible');
        setTimeout(() => {
          icDatetime?.focus();
          try { icDatetime?.showPicker?.(); } catch (_) {}
        }, 20);
      });

      icTimeReset?.addEventListener('click', e => {
        e.stopPropagation();
        resetIcTime();
      });

      function renderIcThumbs() {
        icThumbs.innerHTML = icImages
          .map(
            (src, i) => `
          <div class="thumb-box">
            <img src="${escapeHtml(src)}" alt="" />
            <button type="button" class="thumb-del" data-ic-rm="${i}">×</button>
          </div>`
          )
          .join('');
        icThumbs.querySelectorAll('[data-ic-rm]').forEach(b => {
          b.addEventListener('click', () => {
            icImages.splice(Number(b.getAttribute('data-ic-rm')), 1);
            renderIcThumbs();
          });
        });
      }

      composer.querySelectorAll('[data-ic-mood]').forEach(btn => {
        btn.addEventListener('click', () => {
          icMood = btn.getAttribute('data-ic-mood');
          composer.querySelectorAll('[data-ic-mood]').forEach(b => b.classList.toggle('active', b === btn));
        });
      });

      composer.querySelector('#ic-add-img')?.addEventListener('click', () => {
        pickGlobalImages({ multiple: true }, paths => {
          icImages.push(...paths);
          icImages = icImages.slice(0, 9);
          renderIcThumbs();
        });
      });

      icText?.addEventListener('paste', async e => {
        const items = Array.from(e.clipboardData?.items || []).filter(i => i.type.startsWith('image/'));
        if (!items.length) return;
        e.preventDefault();
        showGlobalToast('正在粘贴图片……');
        for (const it of items) {
          const f = it.getAsFile();
          if (f && icImages.length < 9) icImages.push(await uploadImageFile(f));
        }
        renderIcThumbs();
        showGlobalToast('✓ 图片已就绪');
      });

      composer.addEventListener('dragover', e => e.preventDefault());
      composer.addEventListener('drop', async e => {
        const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
        if (!files.length) return;
        e.preventDefault();
        showGlobalToast('正在载入拖入的照片……');
        for (const f of files) {
          if (icImages.length < 9) icImages.push(await uploadImageFile(f));
        }
        renderIcThumbs();
      });

      async function submitInlineMoment() {
        const content = icText.value.trim();
        if (!content && !icImages.length) {
          icText.focus();
          showGlobalToast('写两句话或贴张照片再发吧');
          return;
        }
        const chosenStamp =
          icCustomTime && icDatetime?.value
            ? icDatetime.value.replace('T', ' ').slice(0, 16)
            : nowDtLocal().replace('T', ' ');

        const stRes = await fetch('/api/state');
        const stData = await stRes.json();
        const list = Array.isArray(stData.moments) ? stData.moments : [];
        const m = {
          id: 'm-' + Date.now(),
          date: chosenStamp,
          mood: icMood,
          location: icLoc.value.trim(),
          private: icPriv.checked,
          content,
          images: [...icImages],
          notes: [],
          likes: 0,
        };
        list.unshift(m);
        list.sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));

        const res = await fetch('/api/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ kind: 'moments', items: list }),
        });
        const out = await res.json();
        if (out.ok && stream) {
          const dtVal = m.date.replace(' ', 'T').slice(0, 16);
          const imgsHtml = (m.images || []).length
            ? `<div class="moment-gallery" data-count="${Math.min(9, m.images.length)}">
                ${m.images.map(s => `<div class="moment-photo-item"><img src="${escapeHtml(s)}" alt="" data-zoomable /></div>`).join('')}
              </div>`
            : '';
          const privHtml = m.private
            ? `<span class="priv-badge"><svg class="ico" viewBox="0 0 24 24" style="width:12.5px;height:12.5px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg><span>仅自己可见</span></span>`
            : '';
          const locHtml = m.location
            ? `<span class="moment-loc-tag" data-loc-toggle="${escapeHtml(m.id)}" style="cursor:pointer;" title="点击修改或清除地点"><svg class="ico" viewBox="0 0 24 24" style="width:12px;height:12px;"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg><span>${escapeHtml(m.location)}</span></span>`
            : '';

          const moodCls = /随手拍/.test(m.mood)
            ? 'cat-chip cat-emerald'
            : /周末/.test(m.mood)
            ? 'cat-chip cat-amber'
            : /碎碎念/.test(m.mood)
            ? 'cat-chip cat-rose'
            : 'cat-chip cat-sky';
          const card = document.createElement('article');
          card.className = 'moment-card just-posted';
          card.setAttribute('data-spotlight', '');
          card.setAttribute('data-moment-card', m.id);
          card.setAttribute('data-moment-date', m.date);
          card.setAttribute('data-moment-ym', m.date.slice(0, 7));
          if (m.private) card.setAttribute('data-private', '1');
          card.innerHTML = `
            <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; font-size:12px; color:var(--ink-muted); flex-wrap:wrap; gap:8px;">
              <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span class="${moodCls}">#${escapeHtml(m.mood)}</span>
                <span data-priv-slot="${escapeHtml(m.id)}">${privHtml}</span>
                <span data-loc-slot="${escapeHtml(m.id)}">${locHtml}</span>
              </div>
              <div style="display:flex; align-items:center; gap:6px;">
                <span data-owner-only="1" style="display:inline-flex; align-items:center; gap:2px;">
                  <button type="button" class="moment-quick-btn" data-reply-toggle="${escapeHtml(m.id)}">+ 追评</button>
                  <button type="button" class="moment-quick-btn" data-loc-toggle="${escapeHtml(m.id)}">地点</button>
                  <button type="button" class="moment-quick-btn" data-time-toggle="${escapeHtml(m.id)}">改时间</button>
                  <button type="button" class="moment-quick-btn" data-flip-priv="${escapeHtml(m.id)}">${m.private ? '设为公开' : '锁为私密'}</button>
                  <button type="button" class="moment-quick-btn" data-del-moment="${escapeHtml(m.id)}">删除</button>
                </span>
                <time class="font-mono-num" data-time-toggle="${escapeHtml(m.id)}" style="cursor:pointer;" title="点击调整发布时间">${escapeHtml(m.date)}</time>
              </div>
            </div>
            <p style="font-size:15px; line-height:1.85; margin:0 0 10px; color:var(--ink); white-space:pre-line;">${escapeHtml(m.content)}</p>
            ${imgsHtml}
            <div class="moment-notes-box" data-notes-for="${escapeHtml(m.id)}" style="display:none;"></div>
            <div class="inline-reply-row" data-reply-box="${escapeHtml(m.id)}" data-owner-only="1">
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
            </div>
            <div style="display:flex; justify-content:flex-end; margin-top:8px;">
              <button type="button" class="applause-btn" data-moment-id="${escapeHtml(m.id)}" data-base-likes="0">
                <svg class="ico" viewBox="0 0 24 24" style="width:13px;height:13px;"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                <span class="like-count font-mono-num">0</span>
              </button>
            </div>`;
          const beforeEl = Array.from(stream.querySelectorAll('.moment-card')).find(
            el => (el.getAttribute('data-moment-date') || '') < m.date
          );
          if (beforeEl) stream.insertBefore(card, beforeEl);
          else stream.appendChild(card);
          bindMomentCardEvents(card);
          if (refreshMomentsMonthUI) refreshMomentsMonthUI();

          icText.value = '';
          icLoc.value = '';
          icLocDrawer?.classList.remove('open');
          syncIcLocUI();
          icPriv.checked = false;
          icImages = [];
          resetIcTime();
          renderIcThumbs();
          showGlobalToast(m.private ? '私密记录已发出' : '已发布');
        }
      }

      composer.querySelector('#ic-submit')?.addEventListener('click', submitInlineMoment);
      icText?.addEventListener('keydown', e => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
          e.preventDefault();
          submitInlineMoment();
        }
      });
    }

    // Bind existing Moment cards + WeChat Monthly Grouping & Filter on /moments.html
    scope.querySelectorAll('.moment-card').forEach(bindMomentCardEvents);

    const mmStreamEl = scope.querySelector('#moments-stream');
    const mmMonthBarEl = scope.querySelector('#moments-month-bar');
    if (mmStreamEl && mmMonthBarEl) {
      let activeMmYm = 'all';

      refreshMomentsMonthUI = function () {
        const guest = isGuestPreview();
        mmStreamEl.querySelectorAll('.wc-stream-month-head').forEach(h => h.remove());

        const allCards = Array.from(mmStreamEl.querySelectorAll('.moment-card'));
        const eligibleCards = allCards.filter(c => !(guest && c.getAttribute('data-private') === '1'));
        const ymList = Array.from(
          new Set(eligibleCards.map(c => c.getAttribute('data-moment-ym') || String(c.getAttribute('data-moment-date') || '').slice(0, 7)).filter(Boolean))
        ).sort((a, b) => b.localeCompare(a));

        if (activeMmYm !== 'all' && !ymList.includes(activeMmYm)) {
          activeMmYm = 'all';
        }

        const yearsSet = new Set(ymList.map(ym => ym.slice(0, 4)));
        const multiYr = yearsSet.size > 1;

        if (ymList.length > 0) {
          mmMonthBarEl.style.display = '';
          mmMonthBarEl.innerHTML = [
            `<button type="button" class="wc-month-chip ${activeMmYm === 'all' ? 'active' : ''}" data-mm-ym="all">全部月份</button>`,
            ...ymList.map(ym => {
              const [y, m] = ym.split('-');
              const label = multiYr ? `${y} · ${Number(m)}月` : `${Number(m)}月`;
              return `<button type="button" class="wc-month-chip font-mono-num ${activeMmYm === ym ? 'active' : ''}" data-mm-ym="${escapeHtml(ym)}">${escapeHtml(label)}</button>`;
            }),
          ].join('');

          mmMonthBarEl.querySelectorAll('[data-mm-ym]').forEach(chip => {
            chip.addEventListener('click', () => {
              activeMmYm = chip.getAttribute('data-mm-ym') || 'all';
              refreshMomentsMonthUI();
            });
          });
        } else {
          mmMonthBarEl.style.display = 'none';
        }

        let prevYm = '';
        allCards.forEach(card => {
          const ym = card.getAttribute('data-moment-ym') || String(card.getAttribute('data-moment-date') || '').slice(0, 7);
          const hiddenPriv = guest && card.getAttribute('data-private') === '1';
          const matchYm = activeMmYm === 'all' || ym === activeMmYm;
          card.style.display = matchYm ? '' : 'none';

          if (!hiddenPriv && matchYm && ym && ym !== prevYm) {
            prevYm = ym;
            const [y, m] = ym.split('-');
            const head = document.createElement('div');
            head.className = 'wc-stream-month-head';
            head.innerHTML = `<span class="wc-m-big font-serif-cn">${Number(m)}<span style="font-size:13px;font-weight:600;margin-left:2px;">月</span></span><span class="wc-m-sub font-mono-num">${escapeHtml(y)}</span>`;
            mmStreamEl.insertBefore(head, card);
          }
        });
      };

      refreshMomentsMonthUI();
    } else {
      refreshMomentsMonthUI = null;
    }

    // Quick-Add Collection Modal & Delete on /shelf.html
    const openShelfBtn = scope.querySelector('#open-shelf-modal');
    const shelfModal = scope.querySelector('#quick-shelf-modal');
    const shelfGrid = scope.querySelector('#shelf-grid');
    if (openShelfBtn && shelfModal) {
      let pickedRating = 5;
      const starBtns = Array.from(shelfModal.querySelectorAll('[data-star]'));
      function renderStars() {
        starBtns.forEach(b => {
          b.textContent = Number(b.getAttribute('data-star')) <= pickedRating ? '★' : '☆';
        });
      }
      starBtns.forEach(b => {
        b.addEventListener('click', () => {
          pickedRating = Number(b.getAttribute('data-star'));
          renderStars();
        });
      });

      openShelfBtn.addEventListener('click', () => shelfModal.classList.add('open'));
      shelfModal.querySelector('#close-shelf-modal')?.addEventListener('click', () => shelfModal.classList.remove('open'));
      shelfModal.addEventListener('click', e => { if (e.target === shelfModal) shelfModal.classList.remove('open'); });

      shelfModal.querySelector('#qs-upload-btn')?.addEventListener('click', () => {
        pickGlobalImages({ multiple: false }, paths => {
          if (paths[0]) shelfModal.querySelector('#qs-cover').value = paths[0];
        });
      });

      shelfModal.querySelector('#qs-save-btn')?.addEventListener('click', async () => {
        const title = shelfModal.querySelector('#qs-title').value.trim();
        if (!title) return showGlobalToast('请填写名称');
        const payload = {
          type: shelfModal.querySelector('#qs-type').value,
          status: shelfModal.querySelector('#qs-status').value,
          title,
          creator: shelfModal.querySelector('#qs-creator').value.trim(),
          rating: pickedRating,
          cover: shelfModal.querySelector('#qs-cover').value.trim(),
          comment: shelfModal.querySelector('#qs-comment').value.trim(),
        };
        const res = await fetch('/api/shelf/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const out = await res.json();
        if (out.ok && out.item && shelfGrid) {
          const it = out.item;
          const card = document.createElement('article');
          card.className = 'shelf-card moment-card just-posted';
          card.setAttribute('data-shelf-card', it.id);
          card.setAttribute('data-shelf-item', it.type);
          card.innerHTML = `
            <div class="artifact-cover tone-bg-sage">
              ${
                it.cover
                  ? `<img src="${escapeHtml(it.cover)}" alt="${escapeHtml(it.title)}" data-zoomable />`
                  : `<span style="font-size:10px; opacity:0.8; padding-left:4px;">${escapeHtml(it.type)}</span>
                     <span class="font-serif-cn" style="font-size:21px; font-weight:700; padding-left:4px;">${escapeHtml(it.title.slice(0, 2))}</span>`
              }
            </div>
            <div>
              <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:6px;">
                <span class="cat-chip cat-sage">${escapeHtml(it.status)} · ${escapeHtml(it.type)}</span>
                <span class="stars-row">${'★'.repeat(it.rating)}${'☆'.repeat(5 - it.rating)}</span>
              </div>
              <h3 class="font-serif-cn" style="font-size:18px; font-weight:700; margin:0 0 4px;">${escapeHtml(it.title)}</h3>
              <div style="font-size:12px; color:var(--ink-muted); margin-bottom:10px;">${escapeHtml(it.creator)}</div>
              <p style="font-size:13.8px; line-height:1.75; color:var(--ink-secondary); margin:0;">${escapeHtml(it.comment)}</p>
            </div>`;
          shelfGrid.prepend(card);
          bindZoomableImages(card);
          shelfModal.classList.remove('open');
          shelfModal.querySelector('#qs-title').value = '';
          shelfModal.querySelector('#qs-creator').value = '';
          shelfModal.querySelector('#qs-cover').value = '';
          shelfModal.querySelector('#qs-comment').value = '';
          showGlobalToast('✓ 已加入收藏夹');
        }
      });
    }

    scope.querySelectorAll('[data-del-shelf]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('从收藏夹移除这一项吗？')) return;
        const id = btn.getAttribute('data-del-shelf');
        const res = await fetch(`/api/shelf?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
        if ((await res.json()).ok) {
          btn.closest('.shelf-card')?.remove();
          showGlobalToast('已移除');
        }
      });
    });

    // Category & Shelf Filters
    const homeTabs = scope.querySelectorAll('[data-filter-cat]');
    const homeCards = scope.querySelectorAll('.post-card');
    const countHint = scope.querySelector('#home-post-count');
    const homeEmptyHint = scope.querySelector('#home-empty-hint');
    homeTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const cat = tab.getAttribute('data-filter-cat');
        homeTabs.forEach(t => t.classList.toggle('active', t === tab));
        let shown = 0;
        homeCards.forEach(card => {
          const match = cat === 'all' || card.getAttribute('data-cat') === cat;
          card.style.display = match ? '' : 'none';
          if (match) {
            card.classList.remove('card-filtering-in');
            card.offsetHeight;
            card.classList.add('card-filtering-in');
          }
          const hiddenByGuest = isGuestPreview() && card.getAttribute('data-private') === '1';
          if (match && !hiddenByGuest) shown++;
        });
        if (countHint) countHint.textContent = `${shown} POSTS`;
        if (homeEmptyHint) homeEmptyHint.style.display = shown === 0 ? '' : 'none';
      });
    });

    const archPills = scope.querySelectorAll('[data-archive-cat]');
    const archYmChips = scope.querySelectorAll('[data-archive-ym]');
    if (archPills.length || archYmChips.length) {
      let curArchCat = 'all';
      let curArchYm = 'all';

      refreshArchiveGroupVisibility = function () {
        const guest = isGuestPreview();
        scope.querySelectorAll('.year-group').forEach(yrGroup => {
          let visibleInYear = 0;
          const monthGroups = yrGroup.querySelectorAll('.month-group');
          if (monthGroups.length) {
            monthGroups.forEach(mGroup => {
              let visibleInMonth = 0;
              mGroup.querySelectorAll('.timeline-item').forEach(item => {
                const matchCat = curArchCat === 'all' || item.getAttribute('data-cat') === curArchCat;
                const matchYm = curArchYm === 'all' || item.getAttribute('data-ym') === curArchYm;
                const show = matchCat && matchYm;
                item.style.display = show ? '' : 'none';
                const hiddenByGuest = guest && item.getAttribute('data-private') === '1';
                if (show && !hiddenByGuest) visibleInMonth++;
              });
              mGroup.style.display = visibleInMonth > 0 ? '' : 'none';
              visibleInYear += visibleInMonth;
            });
          } else {
            yrGroup.querySelectorAll('.timeline-item').forEach(item => {
              const match = curArchCat === 'all' || item.getAttribute('data-cat') === curArchCat;
              item.style.display = match ? '' : 'none';
              const hiddenByGuest = guest && item.getAttribute('data-private') === '1';
              if (match && !hiddenByGuest) visibleInYear++;
            });
          }
          yrGroup.style.display = visibleInYear > 0 ? '' : 'none';
        });
      };

      archPills.forEach(pill => {
        pill.addEventListener('click', () => {
          curArchCat = pill.getAttribute('data-archive-cat') || 'all';
          archPills.forEach(p => p.classList.toggle('active', p === pill));
          refreshArchiveGroupVisibility();
        });
      });

      archYmChips.forEach(chip => {
        chip.addEventListener('click', () => {
          curArchYm = chip.getAttribute('data-archive-ym') || 'all';
          archYmChips.forEach(c => c.classList.toggle('active', c === chip));
          refreshArchiveGroupVisibility();
        });
      });

      refreshArchiveGroupVisibility();
    } else {
      refreshArchiveGroupVisibility = null;
    }

    const shelfPills = scope.querySelectorAll('[data-shelf-type]');
    shelfPills.forEach(pill => {
      pill.addEventListener('click', () => {
        const t = pill.getAttribute('data-shelf-type');
        shelfPills.forEach(p => p.classList.toggle('active', p === pill));
        scope.querySelectorAll('[data-shelf-item]').forEach(card => {
          const match = t === 'all' || card.getAttribute('data-shelf-item') === t;
          card.style.display = match ? '' : 'none';
        });
      });
    });

    // Article Page: Font Size Switch, Interactive Checkboxes, Code Copy & Margin TOC
    const fontBtn = scope.querySelector('#font-size-toggle');
    const articlePaper = scope.querySelector('#article-paper');
    function syncFontSize() {
      if (!articlePaper || !fontBtn) return;
      const isLarge = localStorage.getItem('blog-font-size') === 'large';
      articlePaper.setAttribute('data-font', isLarge ? 'large' : 'normal');
      fontBtn.textContent = isLarge ? 'A 标准字号' : 'A+ 大字阅读';
    }
    if (fontBtn) {
      syncFontSize();
      fontBtn.addEventListener('click', () => {
        const next = localStorage.getItem('blog-font-size') === 'large' ? 'normal' : 'large';
        localStorage.setItem('blog-font-size', next);
        syncFontSize();
      });
    }

    const articleStage = scope.querySelector('.article-stage[data-post-slug]');
    if (articleStage && isLocalDev()) {
      const slug = articleStage.getAttribute('data-post-slug');
      articleStage.querySelectorAll('.task-item[data-task-idx]').forEach(li => {
        li.classList.add('interactive-task');
        li.title = '点击直接切换完成状态（自动保存回本地文档）';
        li.addEventListener('click', async () => {
          if (isGuestPreview()) return;
          const idx = Number(li.getAttribute('data-task-idx'));
          const box = li.querySelector('.task-box');
          const willDone = !li.classList.contains('done');
          li.classList.toggle('done', willDone);
          if (box) box.textContent = willDone ? '✓' : '';
          await fetch('/api/post/toggle-task', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug, taskIndex: idx }),
          });
          showGlobalToast(willDone ? '✓ 已勾选完成并同步保存' : '已取消勾选');
        });
      });
    }

    scope.querySelectorAll('[data-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        const codeEl = btn.closest('.code-block')?.querySelector('code');
        if (!codeEl) return;
        navigator.clipboard.writeText(codeEl.textContent || '').then(() => {
          const old = btn.textContent;
          btn.textContent = '✓ 已复制';
          setTimeout(() => { btn.textContent = old; }, 1400);
        });
      });
    });

    const tocLinks = scope.querySelectorAll('.margin-toc a[href^="#"]');
    const tocMarker = scope.querySelector('#toc-marker');
    if (tocLinks.length) {
      const sections = Array.from(tocLinks)
        .map(a => document.getElementById(a.getAttribute('href').slice(1)))
        .filter(Boolean);

      tocScrollHandler = function () {
        let currentId = sections[0]?.id;
        const offset = window.scrollY + 120;
        for (const sec of sections) {
          if (sec.offsetTop <= offset) currentId = sec.id;
        }
        tocLinks.forEach(a => {
          const isActive = a.getAttribute('href') === '#' + currentId;
          a.classList.toggle('active', isActive);
          if (isActive && tocMarker) {
            tocMarker.style.transform = `translateY(${a.offsetTop - 26}px)`;
          }
        });
      };
      tocScrollHandler();
    }

    scope.querySelectorAll('.md-spoiler').forEach(sp => {
      sp.addEventListener('click', () => sp.classList.toggle('revealed'));
    });

    mountV12PageHooks(scope);
  }

  // =========================================================
  // 4. V12 SHOW-OFF INTERACTIVE ENGINES:
  //    Web Audio Vinyl Synth · 60fps Stardust/Matrix/Fireworks
  //    3D Holo Glare Tilt · Cipher Scramble · Geek Terminal HUD
  //    Frosted Context Menu · Live 1s Uptime & FPS Telemetry
  // =========================================================
  function triggerRandomWalk() {
    const raw = (window.__SEARCH_INDEX__ || []).filter(i => i.kind === '文章');
    const list = isGuestPreview() ? raw.filter(p => !p.private) : raw;
    if (!list.length) return;
    const others = list.filter(p => !location.pathname.endsWith(p.url.replace(/^\.\.\//, '')));
    const pool = others.length ? others : list;
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (pick?.url) navigateSpa(pick.url);
  }

  // --- Engine A: Real Web Audio API Procedural Turntable Synthesizer ---
  const SYNTH_TRACKS = [
    { name: '01 · 夜雨黑胶', sub: 'LO-FI RAIN · 33⅓ RPM', mode: 'rain' },
    { name: '02 · 晚风电钢', sub: 'RHODES ARP · 72 BPM', mode: 'rhodes' },
    { name: '03 · 深空脉冲', sub: 'AMBIENT DRONE · 432 HZ', mode: 'drone' },
  ];
  let synthCtx = null;
  let masterBusGain = null;
  let synthMaster = null;
  let synthAnalyser = null;
  let synthFreqBuf = null;
  let synthCleanup = null;
  let synthPlaying = false;
  let synthTrackIdx = 0;

  let masterSoundEnabled = localStorage.getItem('blog-master-sound') !== '0';
  let masterVolumePct = Math.min(100, Math.max(0, Number(localStorage.getItem('blog-master-vol') ?? 85)));
  const sfxSub = {
    gravity: localStorage.getItem('blog-sfx-gravity') !== '0',
    mech: localStorage.getItem('blog-sfx-mech') !== '0',
    chime: localStorage.getItem('blog-sfx-chime') !== '0',
  };

  function applyMasterGainValue() {
    if (!synthCtx || !masterBusGain) return;
    const target = masterSoundEnabled ? (masterVolumePct / 100) : 0;
    const now = synthCtx.currentTime;
    masterBusGain.gain.cancelScheduledValues(now);
    masterBusGain.gain.setValueAtTime(masterBusGain.gain.value, now);
    masterBusGain.gain.linearRampToValueAtTime(target, now + 0.04);
  }

  function ensureSynthCtx() {
    if (!synthCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      synthCtx = new AC();
      masterBusGain = synthCtx.createGain();
      masterBusGain.gain.value = masterSoundEnabled ? (masterVolumePct / 100) : 0;
      synthMaster = synthCtx.createGain();
      synthMaster.gain.value = 0.0001;
      synthAnalyser = synthCtx.createAnalyser();
      synthAnalyser.fftSize = 64;
      synthAnalyser.smoothingTimeConstant = 0.82;
      synthFreqBuf = new Uint8Array(synthAnalyser.frequencyBinCount);
      synthMaster.connect(synthAnalyser);
      synthAnalyser.connect(masterBusGain);
      masterBusGain.connect(synthCtx.destination);
    }
    if (synthCtx.state === 'suspended') synthCtx.resume();
    return synthCtx;
  }

  function stopSynthNodes() {
    if (synthCleanup) {
      try { synthCleanup(); } catch (_) {}
      synthCleanup = null;
    }
  }

  function startSynthPatch(mode) {
    const ctx = ensureSynthCtx();
    if (!ctx || !synthMaster) return;
    stopSynthNodes();

    const disposables = [];
    const timers = [];

    if (mode === 'rain') {
      // Filtered pink-noise rain + warm vinyl crackle + gentle Fmaj7 bed
      const bufSize = ctx.sampleRate * 3;
      const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
      const out = noiseBuf.getChannelData(0);
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < bufSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.035;
        b6 = white * 0.115926;
        if (Math.random() < 0.00045) out[i] += (Math.random() * 0.42 - 0.21);
      }
      const rainSrc = ctx.createBufferSource();
      rainSrc.buffer = noiseBuf;
      rainSrc.loop = true;
      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 780;
      const rainGain = ctx.createGain();
      rainGain.gain.value = 0.72;
      rainSrc.connect(lpf);
      lpf.connect(rainGain);
      rainGain.connect(synthMaster);
      rainSrc.start();
      disposables.push(() => { try { rainSrc.stop(); rainSrc.disconnect(); } catch (_) {} });

      [174.61, 220.0, 261.63, 329.63].forEach(freq => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq;
        g.gain.value = 0.028;
        osc.connect(g);
        g.connect(synthMaster);
        osc.start();
        disposables.push(() => { try { osc.stop(); osc.disconnect(); } catch (_) {} });
      });
    } else if (mode === 'rhodes') {
      // Warm Rhodes Major-9th arpeggiator with feedback echo
      const delay = ctx.createDelay();
      delay.delayTime.value = 0.36;
      const fb = ctx.createGain();
      fb.gain.value = 0.34;
      const wet = ctx.createGain();
      wet.gain.value = 0.45;
      delay.connect(fb);
      fb.connect(delay);
      delay.connect(wet);
      wet.connect(synthMaster);

      const chords = [
        [174.61, 220.00, 261.63, 329.63, 392.00], // Fmaj9
        [164.81, 196.00, 246.94, 293.66, 392.00], // Em7
        [146.83, 174.61, 220.00, 261.63, 329.63], // Dm9
        [130.81, 164.81, 196.00, 246.94, 293.66], // Cmaj9
      ];
      let step = 0;
      const playNote = () => {
        if (!synthPlaying) return;
        const chord = chords[Math.floor(step / 6) % chords.length];
        const freq = chord[step % chord.length];
        step++;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const bell = ctx.createOscillator();
        const env = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        bell.type = 'sine';
        bell.frequency.value = freq * 2;
        const bellGain = ctx.createGain();
        bellGain.gain.value = 0.14;

        env.gain.setValueAtTime(0.0001, now);
        env.gain.exponentialRampToValueAtTime(0.16, now + 0.025);
        env.gain.exponentialRampToValueAtTime(0.0008, now + 1.45);

        osc.connect(env);
        bell.connect(bellGain);
        bellGain.connect(env);
        env.connect(synthMaster);
        env.connect(delay);

        osc.start(now);
        bell.start(now);
        osc.stop(now + 1.5);
        bell.stop(now + 1.5);
      };
      playNote();
      const iv = setInterval(playNote, 420);
      timers.push(iv);
      disposables.push(() => { try { delay.disconnect(); fb.disconnect(); wet.disconnect(); } catch (_) {} });
    } else {
      // Deep Space 432Hz Ambient Breathing Pad
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 480;
      filter.connect(synthMaster);

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.11;
      lfoGain.gain.value = 260;
      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      disposables.push(() => { try { lfo.stop(); lfo.disconnect(); filter.disconnect(); } catch (_) {} });

      [144.0, 216.0, 288.0, 324.0, 432.0].forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.value = f + (idx - 2) * 0.35;
        g.gain.value = 0.045;
        osc.connect(g);
        g.connect(filter);
        osc.start();
        disposables.push(() => { try { osc.stop(); osc.disconnect(); } catch (_) {} });
      });
    }

    synthCleanup = () => {
      timers.forEach(clearInterval);
      disposables.forEach(fn => fn());
    };
  }

  function syncVinylUI() {
    const tr = SYNTH_TRACKS[synthTrackIdx];
    const dockOrb = document.getElementById('dock-vinyl-btn');
    dockOrb?.classList.toggle('is-playing', synthPlaying);
    dock?.classList.toggle('music-active', synthPlaying);

    const card = document.getElementById('vinyl-widget');
    if (!card) return;
    card.classList.toggle('is-playing', synthPlaying);
    const nameEl = card.querySelector('#vinyl-track-name');
    const subEl = card.querySelector('#vinyl-track-sub');
    const icoPlay = card.querySelector('#vinyl-ico-play');
    const icoPause = card.querySelector('#vinyl-ico-pause');
    const txtEl = card.querySelector('#vinyl-btn-txt');
    if (nameEl) nameEl.textContent = tr.name;
    if (subEl) subEl.textContent = tr.sub;
    if (icoPlay) icoPlay.style.display = synthPlaying ? 'none' : 'inline-flex';
    if (icoPause) icoPause.style.display = synthPlaying ? 'inline-flex' : 'none';
    if (txtEl) txtEl.textContent = synthPlaying ? '暂停' : '播放';
    card.querySelectorAll('[data-vinyl-idx]').forEach(dot => {
      dot.classList.toggle('active', Number(dot.getAttribute('data-vinyl-idx')) === synthTrackIdx);
    });
  }

  function selectVinylTrack(idx) {
    synthTrackIdx = ((idx % SYNTH_TRACKS.length) + SYNTH_TRACKS.length) % SYNTH_TRACKS.length;
    if (synthPlaying) {
      startSynthPatch(SYNTH_TRACKS[synthTrackIdx].mode);
      syncVinylUI();
      showGlobalToast(`切换至 · ${SYNTH_TRACKS[synthTrackIdx].name}`);
    } else {
      toggleVinyl(true);
    }
  }

  function toggleVinyl(forceState) {
    const next = typeof forceState === 'boolean' ? forceState : !synthPlaying;
    const ctx = ensureSynthCtx();
    if (!ctx) return showGlobalToast('当前浏览器不支持 Web Audio');

    if (next) {
      if (!masterSoundEnabled) {
        masterSoundEnabled = true;
        if (masterVolumePct === 0) masterVolumePct = 85;
        localStorage.setItem('blog-master-sound', '1');
        localStorage.setItem('blog-master-vol', String(masterVolumePct));
        applyMasterGainValue();
        syncMasterAudioUI();
      }
      synthPlaying = true;
      startSynthPatch(SYNTH_TRACKS[synthTrackIdx].mode);
      const now = ctx.currentTime;
      synthMaster.gain.cancelScheduledValues(now);
      synthMaster.gain.setValueAtTime(Math.max(0.0001, synthMaster.gain.value), now);
      synthMaster.gain.linearRampToValueAtTime(0.28, now + 0.35);
      syncVinylUI();
      showGlobalToast(`正在播放 · ${SYNTH_TRACKS[synthTrackIdx].name}`);
    } else {
      synthPlaying = false;
      const now = ctx.currentTime;
      synthMaster.gain.cancelScheduledValues(now);
      synthMaster.gain.setValueAtTime(synthMaster.gain.value, now);
      synthMaster.gain.linearRampToValueAtTime(0.0001, now + 0.22);
      setTimeout(() => {
        if (!synthPlaying) stopSynthNodes();
      }, 240);
      syncVinylUI();
      showGlobalToast('已暂停电台');
    }
  }

  function nextVinylTrack() {
    synthTrackIdx = (synthTrackIdx + 1) % SYNTH_TRACKS.length;
    if (synthPlaying) {
      startSynthPatch(SYNTH_TRACKS[synthTrackIdx].mode);
      syncVinylUI();
      showGlobalToast(`切换至 · ${SYNTH_TRACKS[synthTrackIdx].name}`);
    } else {
      toggleVinyl(true);
    }
  }

  document.getElementById('dock-vinyl-btn')?.addEventListener('click', () => toggleVinyl());

  // --- Engine B: 60fps Dual-Layer Prismatic Canvas (Rainbow Stardust / Meteors / Matrix / Fireworks) ---
  const bgCanvas = document.getElementById('fx-canvas');
  const fgCanvas = document.createElement('canvas');
  fgCanvas.className = 'fx-fg-canvas';
  document.body.appendChild(fgCanvas);
  const cursorRing = document.getElementById('cursor-ring');

  const PRISM_PALETTE = ['#FF5E5B', '#F59E0B', '#10B981', '#06B6D4', '#6366F1', '#EC4899'];
  let fxMode = 'stardust'; // 'stardust' | 'matrix'
  let cw = window.innerWidth;
  let ch = window.innerHeight;
  let mouseX = -999;
  let mouseY = -999;
  let ringX = -999;
  let ringY = -999;
  let prevMouseX = -999;
  let prevMouseY = -999;
  const stardust = [];
  const meteors = [];
  let matrixDrops = [];
  const ripples = [];
  const sparks = [];

  function resizeCanvases() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = window.innerWidth;
    ch = window.innerHeight;
    [bgCanvas, fgCanvas].forEach(c => {
      if (!c) return;
      c.width = Math.floor(cw * dpr);
      c.height = Math.floor(ch * dpr);
      const ctx = c.getContext('2d');
      ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    const cols = Math.max(12, Math.floor(cw / 16));
    matrixDrops = Array.from({ length: cols }, () => Math.random() * -40);
  }

  for (let i = 0; i < 48; i++) {
    stardust.push({
      x: Math.random() * cw,
      y: Math.random() * ch,
      vx: (Math.random() - 0.5) * 0.36,
      vy: (Math.random() - 0.5) * 0.36,
      r: 1.2 + Math.random() * 1.7,
      color: PRISM_PALETTE[i % PRISM_PALETTE.length],
    });
  }
  resizeCanvases();
  window.addEventListener('resize', resizeCanvases);

  function spawnMeteor(customX, customY) {
    const startX = typeof customX === 'number' ? customX : cw * (0.15 + Math.random() * 0.85);
    const startY = typeof customY === 'number' ? customY : -20 - Math.random() * 60;
    const speed = 7 + Math.random() * 6;
    const angle = (Math.PI * 0.68) + (Math.random() - 0.5) * 0.14;
    meteors.push({
      x: startX,
      y: startY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      len: 75 + Math.random() * 65,
      alpha: 0.95,
      color: PRISM_PALETTE[Math.floor(Math.random() * PRISM_PALETTE.length)],
    });
  }

  function launchMeteorShower(count = 14) {
    for (let i = 0; i < count; i++) {
      setTimeout(() => {
        spawnMeteor(cw * (0.1 + Math.random() * 0.95), -10 - Math.random() * 90);
      }, i * 110);
    }
    showGlobalToast('☄ 流星雨掠过夜空');
  }

  // Ambient occasional shooting star every ~5.5 seconds
  setInterval(() => {
    if (fxMode === 'stardust' && !document.hidden && meteors.length < 3) {
      spawnMeteor();
    }
  }, 5500);

  window.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    if (ringX < -500) {
      ringX = mouseX;
      ringY = mouseY;
    }
    if (cursorRing) {
      const inEditable = Boolean(e.target?.closest?.('input, textarea, [contenteditable="true"]'));
      cursorRing.classList.toggle('visible', !inEditable);
      const onInteractive = Boolean(e.target?.closest?.('a, button, [data-tilt], .heat-cell, .gh-day'));
      cursorRing.classList.toggle('is-interactive', onInteractive);
    }
    // Subtle rainbow comet trail on brisk cursor movement
    const moveDist = Math.hypot(mouseX - prevMouseX, mouseY - prevMouseY);
    if (prevMouseX > 0 && moveDist > 18 && sparks.length < 140) {
      sparks.push({
        x: mouseX,
        y: mouseY,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8 + 0.25,
        gravity: 0.01,
        drag: 0.94,
        r: 1.7,
        alpha: 0.68,
        decay: 0.038,
        color: PRISM_PALETTE[Math.floor(Math.random() * PRISM_PALETTE.length)],
      });
      prevMouseX = mouseX;
      prevMouseY = mouseY;
    } else if (prevMouseX < 0 || moveDist > 18) {
      prevMouseX = mouseX;
      prevMouseY = mouseY;
    }
  }, { passive: true });

  let gravityHoldTimer = null;
  let gravityActive = false;
  let gravityStartMs = 0;
  let gravityAudioStop = null;

  function startGravityChargeAudio() {
    if (!masterSoundEnabled || !sfxSub.gravity) return;
    const ctx = ensureSynthCtx();
    if (!ctx || !masterBusGain) return;
    stopGravityChargeAudio();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(420, now + 1.8);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.linearRampToValueAtTime(0.055, now + 0.25);
    osc.connect(g);
    g.connect(masterBusGain);
    osc.start(now);
    gravityAudioStop = () => {
      try {
        const t = ctx.currentTime;
        g.gain.cancelScheduledValues(t);
        g.gain.setValueAtTime(g.gain.value, t);
        g.gain.linearRampToValueAtTime(0.0001, t + 0.05);
        osc.stop(t + 0.06);
      } catch (_) {}
    };
  }

  function stopGravityChargeAudio() {
    if (gravityAudioStop) {
      gravityAudioStop();
      gravityAudioStop = null;
    }
  }

  const SELECTABLE_PROSE_SEL =
    '.prose, .article-main-title, .gh-readme-body, .moment-card p, .moment-notes-box, .code-block pre, .term-output, input, textarea, select, [contenteditable="true"]';

  // Block accidental drag-selection outside actual reading/input blocks (prevents Edge Copilot Mini Menu!)
  document.addEventListener('selectstart', e => {
    const el = e.target?.nodeType === 1 ? e.target : e.target?.parentElement;
    if (gravityActive || !el?.closest?.(SELECTABLE_PROSE_SEL)) {
      e.preventDefault();
    }
  });

  document.addEventListener('dragstart', e => {
    const el = e.target?.nodeType === 1 ? e.target : e.target?.parentElement;
    if (gravityActive || el?.closest?.('a, img')) {
      e.preventDefault();
    }
  });

  window.addEventListener('mousedown', e => {
    if (e.button !== 0) return;
    const c = PRISM_PALETTE[Math.floor(Math.random() * PRISM_PALETTE.length)];
    ripples.push({ x: e.clientX, y: e.clientY, r: 4, maxR: 40, alpha: 0.62, color: c });
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.35;
      const spd = 1.8 + Math.random() * 2.5;
      sparks.push({
        x: e.clientX,
        y: e.clientY,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        gravity: 0.045,
        drag: 0.96,
        r: 2.0,
        alpha: 0.95,
        decay: 0.03,
        color: PRISM_PALETTE[i % PRISM_PALETTE.length],
      });
    }

    // Open-Sky Gravity Singularity Hold-Click (strictly outside interactive/prose elements)
    const blocked = e.target?.closest?.(
      'a, button, input, textarea, select, label, p, h1, h2, h3, h4, li, pre, code, blockquote, article, .bento-widget, .polaroid-deck-wrap, .modal-backdrop, .prose-quote-bar, .ctx-menu, .aura-popover, [contenteditable]'
    );
    clearTimeout(gravityHoldTimer);
    if (!blocked && fxMode === 'stardust') {
      // Blur any focused input safely, then prevent native browser drag-selection / Edge Mini Menu!
      if (document.activeElement && document.activeElement.matches?.('input, textarea, [contenteditable="true"]')) {
        document.activeElement.blur();
      }
      e.preventDefault();
      window.getSelection()?.removeAllRanges();
      gravityHoldTimer = setTimeout(() => {
        gravityActive = true;
        gravityStartMs = performance.now();
        document.documentElement.classList.add('is-gravity-playing');
        window.getSelection()?.removeAllRanges();
        startGravityChargeAudio();
      }, 220);
    }
  });

  function releaseGravitySupernova() {
    clearTimeout(gravityHoldTimer);
    stopGravityChargeAudio();
    document.documentElement.classList.remove('is-gravity-playing');
    if (!gravityActive) return;
    gravityActive = false;
    window.getSelection()?.removeAllRanges();
    const gx = mouseX > 0 ? mouseX : cw / 2;
    const gy = mouseY > 0 ? mouseY : ch / 2;
    ripples.push({ x: gx, y: gy, r: 8, maxR: 130, alpha: 0.85, color: '#8B5CF6' });
    ripples.push({ x: gx, y: gy, r: 4, maxR: 84, alpha: 0.72, color: '#06B6D4' });
    for (let i = 0; i < 56; i++) {
      const ang = (Math.PI * 2 * i) / 56 + (Math.random() - 0.5) * 0.16;
      const spd = 3.2 + Math.random() * 6.8;
      sparks.push({
        x: gx,
        y: gy,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        gravity: 0.045,
        drag: 0.976,
        r: 2.1 + Math.random() * 1.6,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.008,
        color: PRISM_PALETTE[i % PRISM_PALETTE.length],
      });
    }
    stardust.forEach((p, idx) => {
      const ang = Math.atan2(p.y - gy, p.x - gx) + (Math.random() - 0.5) * 0.4;
      p.vx = Math.cos(ang) * (0.35 + (idx % 3) * 0.12);
      p.vy = Math.sin(ang) * (0.35 + (idx % 3) * 0.12);
    });
    playKalimbaNote(523.25, '#8B5CF6', null, 'gravity');
    setTimeout(() => playKalimbaNote(783.99, '#06B6D4', null, 'gravity'), 70);
  }

  window.addEventListener('mouseup', releaseGravitySupernova);
  window.addEventListener('blur', releaseGravitySupernova);

  function launchFireworks(bursts = 5) {
    const palette = ['#FF5E5B', '#FFBE0B', '#10B981', '#00BBF9', '#8338EC', '#EC4899', '#FB5607'];
    for (let b = 0; b < bursts; b++) {
      setTimeout(() => {
        const bx = cw * (0.16 + Math.random() * 0.68);
        const by = ch * (0.15 + Math.random() * 0.44);
        ripples.push({ x: bx, y: by, r: 6, maxR: 84, alpha: 0.7, color: palette[b % palette.length] });
        const count = 50;
        for (let i = 0; i < count; i++) {
          const ang = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.22;
          const spd = 2.0 + Math.random() * 5.4;
          sparks.push({
            x: bx,
            y: by,
            vx: Math.cos(ang) * spd,
            vy: Math.sin(ang) * spd,
            gravity: 0.068,
            drag: 0.982,
            r: 1.9 + Math.random() * 1.8,
            alpha: 1,
            decay: 0.013 + Math.random() * 0.009,
            color: palette[(b + i) % palette.length],
          });
        }
      }, b * 160);
    }
  }

  function spawnConfettiAt(x, y) {
    for (let i = 0; i < 18; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.1;
      const spd = 2.2 + Math.random() * 4.2;
      sparks.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd - 1.2,
        gravity: 0.11,
        drag: 0.97,
        r: 2.3 + Math.random() * 1.4,
        alpha: 1,
        decay: 0.02,
        color: PRISM_PALETTE[i % PRISM_PALETTE.length],
      });
    }
  }

  function toggleMatrixMode() {
    fxMode = fxMode === 'matrix' ? 'stardust' : 'matrix';
    const bctx = bgCanvas?.getContext('2d');
    bctx?.clearRect(0, 0, cw, ch);
    showGlobalToast(fxMode === 'matrix' ? '已开启霓虹代码雨' : '已切回幻彩星尘场');
    return fxMode;
  }

  // --- Live Chromatic Aura Palette Switcher ---
  const AURA_LIST = [
    { id: 'prism', name: '流彩' },
    { id: 'cyber', name: '霓虹' },
    { id: 'aurora', name: '极光' },
    { id: 'nebula', name: '星云' },
    { id: 'sunset', name: '霞光' },
  ];
  const auraBtn = document.getElementById('aura-open-btn');
  const auraPop = document.getElementById('aura-popover');

  function syncAuraActiveUI() {
    const cur = document.documentElement.getAttribute('data-aura') || 'prism';
    auraPop?.querySelectorAll('[data-aura-pick]').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-aura-pick') === cur);
    });
  }

  function setAuraPalette(id, notify = true) {
    const found = AURA_LIST.find(a => a.id === id) || AURA_LIST[0];
    document.documentElement.setAttribute('data-aura', found.id);
    localStorage.setItem('blog-aura', found.id);
    syncAuraActiveUI();
    if (notify) showGlobalToast(`光谱已切换 · ${found.name}`);
    return found;
  }

  function cycleAuraPalette() {
    const cur = document.documentElement.getAttribute('data-aura') || 'prism';
    const idx = AURA_LIST.findIndex(a => a.id === cur);
    return setAuraPalette(AURA_LIST[(idx + 1) % AURA_LIST.length].id, true);
  }

  syncAuraActiveUI();
  auraBtn?.addEventListener('click', e => {
    e.stopPropagation();
    if (!auraPop) return;
    const willOpen = !auraPop.classList.contains('open');
    if (willOpen) {
      const r = auraBtn.getBoundingClientRect();
      auraPop.style.left = `${Math.max(8, Math.min(window.innerWidth - 136, r.right - 124))}px`;
      auraPop.style.top = `${r.bottom + 8}px`;
    }
    auraPop.classList.toggle('open', willOpen);
  });
  auraPop?.querySelectorAll('[data-aura-pick]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      setAuraPalette(btn.getAttribute('data-aura-pick'), true);
      auraPop.classList.remove('open');
    });
  });
  document.addEventListener('click', e => {
    if (auraPop?.classList.contains('open') && !e.target.closest('#aura-popover') && !e.target.closest('#aura-open-btn')) {
      auraPop.classList.remove('open');
    }
  });
  window.addEventListener('scroll', () => auraPop?.classList.remove('open'), { passive: true });

  // Real-time FPS telemetry + 60fps Canvas Loop + Live Audio Spectrum
  let fpsFrames = 0;
  let fpsLastTime = performance.now();
  let currentFps = 60;
  const fpsBadge = document.getElementById('live-fps');
  const MATRIX_CHARS = '01アイウエオカキクケコサシスセソタチツテトナニヌネノABCDEF<>/*+=';

  function renderFxFrame(now) {
    if (document.hidden) {
      fpsLastTime = now;
      fpsFrames = 0;
      requestAnimationFrame(renderFxFrame);
      return;
    }
    fpsFrames++;
    if (now - fpsLastTime >= 1000) {
      currentFps = Math.min(144, Math.max(1, Math.round((fpsFrames * 1000) / (now - fpsLastTime))));
      if (fpsBadge) fpsBadge.textContent = `${currentFps} FPS`;
      fpsFrames = 0;
      fpsLastTime = now;
    }

    // Spring-physics cursor ring update
    if (cursorRing && mouseX > -100) {
      ringX += (mouseX - ringX) * 0.26;
      ringY += (mouseY - ringY) * 0.26;
      cursorRing.style.transform = `translate3d(${ringX.toFixed(1)}px, ${ringY.toFixed(1)}px, 0)`;
    }

    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const bctx = bgCanvas?.getContext('2d');
    if (bctx) {
      if (fxMode === 'stardust') {
        bctx.clearRect(0, 0, cw, ch);
        for (let i = 0; i < stardust.length; i++) {
          const p = stardust[i];
          p.x += p.vx;
          p.y += p.vy;
          if (p.x < 0) p.x = cw;
          if (p.x > cw) p.x = 0;
          if (p.y < 0) p.y = ch;
          if (p.y > ch) p.y = 0;

          const dxm = mouseX - p.x;
          const dym = mouseY - p.y;
          const distM = Math.hypot(dxm, dym);
          if (gravityActive && mouseX > 0 && distM > 2) {
            // Spiral orbital pull toward cursor singularity
            const pull = Math.min(6.4, 240 / Math.max(18, distM));
            const tangX = -dym / distM;
            const tangY = dxm / distM;
            p.x += (dxm / distM) * pull + tangX * 2.4;
            p.y += (dym / distM) * pull + tangY * 2.4;
          } else if (distM < 145 && distM > 1) {
            p.x += (dxm / distM) * 0.32;
            p.y += (dym / distM) * 0.32;
            bctx.save();
            bctx.globalAlpha = (1 - distM / 145) * (isDark ? 0.38 : 0.28);
            bctx.beginPath();
            bctx.moveTo(p.x, p.y);
            bctx.lineTo(mouseX, mouseY);
            bctx.strokeStyle = p.color;
            bctx.lineWidth = 1.0;
            bctx.stroke();
            bctx.restore();
          }

          for (let j = i + 1; j < stardust.length; j++) {
            const q = stardust[j];
            const dist = Math.hypot(p.x - q.x, p.y - q.y);
            if (dist < 98) {
              bctx.save();
              bctx.globalAlpha = (1 - dist / 98) * (isDark ? 0.14 : 0.11);
              bctx.beginPath();
              bctx.moveTo(p.x, p.y);
              bctx.lineTo(q.x, q.y);
              bctx.strokeStyle = p.color;
              bctx.lineWidth = 0.75;
              bctx.stroke();
              bctx.restore();
            }
          }

          bctx.save();
          bctx.globalAlpha = isDark ? 0.62 : 0.46;
          bctx.beginPath();
          bctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          bctx.fillStyle = p.color;
          bctx.fill();
          bctx.restore();
        }

        // Render Shooting Stars (Meteors)
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i];
          m.x += m.vx;
          m.y += m.vy;
          m.alpha -= 0.012;
          if (m.alpha <= 0 || m.x < -120 || m.y > ch + 120) {
            meteors.splice(i, 1);
            continue;
          }
          const mag = Math.hypot(m.vx, m.vy) || 1;
          const tx = m.x - (m.vx / mag) * m.len;
          const ty = m.y - (m.vy / mag) * m.len;
          const grad = bctx.createLinearGradient(m.x, m.y, tx, ty);
          grad.addColorStop(0, m.color);
          grad.addColorStop(1, 'rgba(255,255,255,0)');
          bctx.save();
          bctx.globalAlpha = Math.max(0, m.alpha);
          bctx.beginPath();
          bctx.moveTo(m.x, m.y);
          bctx.lineTo(tx, ty);
          bctx.strokeStyle = grad;
          bctx.lineWidth = 2.0;
          bctx.lineCap = 'round';
          bctx.stroke();
          bctx.beginPath();
          bctx.arc(m.x, m.y, 2.2, 0, Math.PI * 2);
          bctx.fillStyle = '#FFFFFF';
          bctx.fill();
          bctx.restore();
        }
      } else {
        // Chromatic Neon Matrix Digital Rain
        bctx.fillStyle = isDark ? 'rgba(20, 18, 16, 0.16)' : 'rgba(246, 242, 234, 0.20)';
        bctx.fillRect(0, 0, cw, ch);
        bctx.font = '13px Consolas, monospace';
        for (let i = 0; i < matrixDrops.length; i++) {
          const chGlyph = MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          const x = i * 16;
          const y = matrixDrops[i] * 16;
          bctx.fillStyle = PRISM_PALETTE[i % PRISM_PALETTE.length];
          bctx.fillText(chGlyph, x, y);
          if (y > ch && Math.random() > 0.975) matrixDrops[i] = 0;
          matrixDrops[i] += 0.55;
        }
      }
    }

    // Live Rainbow Audio Wave on #vinyl-wave (when present on homepage)
    const waveCanvas = document.getElementById('vinyl-wave');
    if (waveCanvas) {
      const wctx = waveCanvas.getContext('2d');
      const ww = waveCanvas.width;
      const wh = waveCanvas.height;
      wctx.clearRect(0, 0, ww, wh);
      const grad = wctx.createLinearGradient(0, 0, ww, 0);
      grad.addColorStop(0, '#FF5E5B');
      grad.addColorStop(0.25, '#F59E0B');
      grad.addColorStop(0.5, '#10B981');
      grad.addColorStop(0.75, '#06B6D4');
      grad.addColorStop(1, '#8B5CF6');

      wctx.beginPath();
      if (synthPlaying && synthAnalyser && synthFreqBuf) {
        synthAnalyser.getByteFrequencyData(synthFreqBuf);
        const bins = 20;
        for (let i = 0; i <= bins; i++) {
          const val = (synthFreqBuf[i % synthFreqBuf.length] || 0) / 255;
          const x = (i / bins) * ww;
          const y = wh - 4 - val * (wh - 10) - Math.sin(now * 0.006 + i * 0.6) * 2.5;
          if (i === 0) wctx.moveTo(x, y);
          else wctx.lineTo(x, y);
        }
      } else {
        for (let x = 0; x <= ww; x += 10) {
          const y = wh - 7 + Math.sin(now * 0.0025 + x * 0.04) * 2.2;
          if (x === 0) wctx.moveTo(x, y);
          else wctx.lineTo(x, y);
        }
      }
      wctx.strokeStyle = grad;
      wctx.lineWidth = 2;
      wctx.stroke();
    }

    // Foreground Shockwaves, Gravity Accretion Halo & Physics Fireworks / Confetti
    const fctx = fgCanvas.getContext('2d');
    if (fctx && (ripples.length || sparks.length || gravityActive)) {
      fctx.clearRect(0, 0, cw, ch);
      if (gravityActive && mouseX > 0) {
        const charge = Math.min(1, (now - gravityStartMs) / 900);
        const baseR = 16 + charge * 22;
        fctx.save();
        fctx.translate(mouseX, mouseY);
        fctx.rotate(now * 0.005);
        for (let k = 0; k < 3; k++) {
          fctx.beginPath();
          fctx.arc(0, 0, baseR + k * 9, k * 1.2, k * 1.2 + Math.PI * 1.35);
          fctx.strokeStyle = PRISM_PALETTE[(k * 2) % PRISM_PALETTE.length];
          fctx.lineWidth = 2;
          fctx.globalAlpha = 0.72 - k * 0.16;
          fctx.stroke();
        }
        fctx.restore();
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += (rp.maxR - rp.r) * 0.16 + 0.8;
        rp.alpha -= 0.03;
        if (rp.alpha <= 0) {
          ripples.splice(i, 1);
          continue;
        }
        fctx.save();
        fctx.globalAlpha = Math.max(0, rp.alpha);
        fctx.beginPath();
        fctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        fctx.strokeStyle = rp.color || '#8B5CF6';
        fctx.lineWidth = 1.5;
        fctx.stroke();
        fctx.restore();
      }

      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.vx *= s.drag;
        s.vy = s.vy * s.drag + s.gravity;
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= s.decay;
        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        fctx.save();
        fctx.globalAlpha = Math.max(0, s.alpha);
        fctx.beginPath();
        fctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        fctx.fillStyle = s.color;
        fctx.fill();
        fctx.restore();
      }
    } else if (fctx) {
      fctx.clearRect(0, 0, cw, ch);
    }

    requestAnimationFrame(renderFxFrame);
  }
  requestAnimationFrame(renderFxFrame);

  // --- Engine C: Live Second-by-Second Survival Ticker ---
  const uptimeEl = document.getElementById('live-uptime');
  function tickUptime() {
    if (!uptimeEl) return;
    const rawStart = uptimeEl.getAttribute('data-start') || '2026-10-01';
    const startMs = new Date(rawStart + 'T00:00:00').getTime();
    const diff = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
    const d = Math.floor(diff / 86400);
    const h = String(Math.floor((diff % 86400) / 3600)).padStart(2, '0');
    const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
    const s = String(diff % 60).padStart(2, '0');
    uptimeEl.textContent = `RUN ${d}D ${h}:${m}:${s}`;
  }
  tickUptime();
  setInterval(tickUptime, 1000);

  // --- Engine D: 3D Holographic Card Tilt & Cipher Text Scramble ---
  function bindHoloTilt(scope = document) {
    scope.querySelectorAll('[data-tilt]').forEach(card => {
      if (card.dataset.tiltBound) return;
      card.dataset.tiltBound = '1';
      const isWide = card.classList.contains('featured-lead-card');
      const maxDeg = isWide ? 4.2 : 6.5;

      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / Math.max(1, rect.width);
        const py = (e.clientY - rect.top) / Math.max(1, rect.height);
        const rx = (0.5 - py) * maxDeg * 2;
        const ry = (px - 0.5) * maxDeg * 2;
        card.style.transition = 'transform 0.06s linear';
        card.style.transform = `perspective(920px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) translateY(-3px)`;
        card.style.setProperty('--gx', `${(px * 100).toFixed(1)}%`);
        card.style.setProperty('--gy', `${(py * 100).toFixed(1)}%`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.36s cubic-bezier(0.22, 1, 0.36, 1)';
        card.style.transform = '';
      });
    });
  }

  const SCRAMBLE_GLYPHS = '01/<>*#%&@+=~';
  function runScramble(wrap) {
    const target = wrap.getAttribute('data-scramble') || '';
    const inner = wrap.querySelector('.scramble-text') || wrap;
    if (!target || wrap.dataset.scrambling === '1') return;
    wrap.dataset.scrambling = '1';
    let step = 0;
    const total = 12;
    const iv = setInterval(() => {
      step++;
      const revealed = Math.floor((step / total) * target.length);
      let out = '';
      for (let i = 0; i < target.length; i++) {
        out += i < revealed ? target[i] : SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)];
      }
      inner.textContent = out;
      if (step >= total) {
        clearInterval(iv);
        inner.textContent = target;
        wrap.dataset.scrambling = '0';
      }
    }, 26);
  }

  function bindScramble(scope = document) {
    scope.querySelectorAll('[data-scramble]').forEach(el => {
      if (el.dataset.scrBound) return;
      el.dataset.scrBound = '1';
      setTimeout(() => runScramble(el), 120);
      el.addEventListener('mouseenter', () => runScramble(el));
    });
  }

  // --- Engine E: Cyberpunk / macOS Geek Terminal HUD + Playable 60fps Rainbow Neon Snake ---
  const termModal = document.getElementById('geek-terminal');
  const termOut = document.getElementById('term-output');
  const termIn = document.getElementById('term-input');
  let termBooted = false;
  const termHistory = [];
  let termHistIdx = -1;
  let snakeStopFn = null;

  function stopTerminalSnake() {
    if (snakeStopFn) {
      snakeStopFn();
      snakeStopFn = null;
    }
  }

  function startTerminalSnake() {
    if (!termOut) return;
    stopTerminalSnake();

    const wrap = document.createElement('div');
    wrap.className = 'term-snake-wrap';
    let bestScore = Number(localStorage.getItem('blog-snake-best') || 0);
    wrap.innerHTML = `<div class="term-snake-hud font-mono-num"><span>CYBER-SNAKE · <strong id="sn-score" style="color:#34D399;">0</strong></span><span>BEST · <strong id="sn-best" style="color:#FBBF24;">${bestScore}</strong></span><span style="color:#9CA3AF;">WASD/方向键 · R重开 · Q退出</span></div><canvas class="term-snake-canvas" width="440" height="200"></canvas>`;
    termOut.appendChild(wrap);
    wrap.scrollIntoView({ block: 'end' });

    const cvs = wrap.querySelector('canvas');
    const ctx = cvs.getContext('2d');
    const scoreEl = wrap.querySelector('#sn-score');
    const bestEl = wrap.querySelector('#sn-best');

    const COLS = 22;
    const ROWS = 10;
    const CELL = 20;
    let snake = [];
    let dir = { x: 1, y: 0 };
    let nextDir = { x: 1, y: 0 };
    let apple = { x: 15, y: 5, color: '#FF5E5B' };
    let score = 0;
    let gameOver = false;
    let running = true;
    let lastTick = performance.now();
    let rafId = 0;

    function spawnApple() {
      const occupied = new Set(snake.map(s => `${s.x},${s.y}`));
      const free = [];
      for (let x = 0; x < COLS; x++) {
        for (let y = 0; y < ROWS; y++) {
          if (!occupied.has(`${x},${y}`)) free.push({ x, y });
        }
      }
      const pick = free.length ? free[Math.floor(Math.random() * free.length)] : { x: 10, y: 5 };
      apple = {
        x: pick.x,
        y: pick.y,
        color: PRISM_PALETTE[Math.floor(Math.random() * PRISM_PALETTE.length)],
      };
    }

    function resetGame() {
      snake = [
        { x: 6, y: 5 },
        { x: 5, y: 5 },
        { x: 4, y: 5 },
      ];
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      score = 0;
      gameOver = false;
      if (scoreEl) scoreEl.textContent = '0';
      spawnApple();
      lastTick = performance.now();
    }
    resetGame();

    function onSnakeKey(e) {
      if (!running || !termModal?.classList.contains('open')) return;
      const k = e.key.toLowerCase();
      if (k === 'q') {
        e.preventDefault();
        stopTerminalSnake();
        appendTermHtml(`<span class="t-dim">Exited Cyber-Snake (Score: ${score}).</span>`);
        termIn?.focus();
        return;
      }
      if ((k === 'r' || k === ' ') && gameOver) {
        e.preventDefault();
        resetGame();
        return;
      }
      if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        if (dir.y !== 1) nextDir = { x: 0, y: -1 };
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        if (dir.y !== -1) nextDir = { x: 0, y: 1 };
      } else if (k === 'arrowleft' || k === 'a') {
        e.preventDefault();
        if (dir.x !== 1) nextDir = { x: -1, y: 0 };
      } else if (k === 'arrowright' || k === 'd') {
        e.preventDefault();
        if (dir.x !== -1) nextDir = { x: 1, y: 0 };
      }
    }
    window.addEventListener('keydown', onSnakeKey, true);

    function stepSnake() {
      dir = nextDir;
      const head = {
        x: (snake[0].x + dir.x + COLS) % COLS,
        y: (snake[0].y + dir.y + ROWS) % ROWS,
      };
      if (snake.some(seg => seg.x === head.x && seg.y === head.y)) {
        gameOver = true;
        playKalimbaNote(196, '#FF5E5B', null);
        return;
      }
      snake.unshift(head);
      if (head.x === apple.x && head.y === apple.y) {
        score += 10;
        if (scoreEl) scoreEl.textContent = String(score);
        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem('blog-snake-best', String(bestScore));
          if (bestEl) bestEl.textContent = String(bestScore);
        }
        playKalimbaNote(523.25 + (score % 60) * 6, apple.color, null);
        spawnApple();
      } else {
        snake.pop();
      }
    }

    function drawSnake(now) {
      if (!running) return;
      const interval = Math.max(68, 108 - Math.floor(score / 30) * 5);
      if (!gameOver && now - lastTick >= interval) {
        stepSnake();
        lastTick = now;
      }

      ctx.fillStyle = '#0D0B14';
      ctx.fillRect(0, 0, cvs.width, cvs.height);

      // Subtle neon grid lines
      ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
      ctx.lineWidth = 1;
      for (let x = CELL; x < cvs.width; x += CELL) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, cvs.height);
        ctx.stroke();
      }
      for (let y = CELL; y < cvs.height; y += CELL) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(cvs.width, y);
        ctx.stroke();
      }

      // Pulsing neon apple
      const pulse = 1 + Math.sin(now * 0.008) * 0.16;
      ctx.save();
      ctx.translate(apple.x * CELL + CELL / 2, apple.y * CELL + CELL / 2);
      ctx.shadowColor = apple.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = apple.color;
      ctx.beginPath();
      ctx.arc(0, 0, 5.5 * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // Rainbow neon snake body
      snake.forEach((seg, idx) => {
        const c = PRISM_PALETTE[idx % PRISM_PALETTE.length];
        const pad = idx === 0 ? 2 : 3;
        ctx.save();
        if (idx === 0) {
          ctx.shadowColor = c;
          ctx.shadowBlur = 10;
        }
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 4);
        ctx.fill();
        ctx.restore();
      });

      if (gameOver) {
        ctx.fillStyle = 'rgba(13, 11, 20, 0.78)';
        ctx.fillRect(0, 0, cvs.width, cvs.height);
        ctx.fillStyle = '#F8FAFC';
        ctx.font = '700 18px Consolas, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`GAME OVER · ${score}`, cvs.width / 2, cvs.height / 2 - 6);
        ctx.fillStyle = '#A78BFA';
        ctx.font = '12px Consolas, monospace';
        ctx.fillText('按 R / 空格 重来 · 按 Q 退出', cvs.width / 2, cvs.height / 2 + 18);
      }

      rafId = requestAnimationFrame(drawSnake);
    }

    rafId = requestAnimationFrame(drawSnake);
    snakeStopFn = () => {
      running = false;
      cancelAnimationFrame(rafId);
      window.removeEventListener('keydown', onSnakeKey, true);
    };
  }

  function appendTermHtml(html) {
    if (!termOut) return;
    const div = document.createElement('div');
    div.innerHTML = html;
    termOut.appendChild(div);
    termOut.scrollTop = termOut.scrollHeight;
  }

  function buildNeofetchHtml() {
    const posts = (window.__SEARCH_INDEX__ || []).filter(i => i.kind === '文章' && (!isGuestPreview() || !i.private));
    const moments = (window.__MOMENTS__ || []).filter(m => !isGuestPreview() || !m.private);
    const shelfItems = (window.__SEARCH_INDEX__ || []).filter(i => i.kind === '收藏');
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const up = uptimeEl?.textContent || 'RUN';
    const track = synthPlaying ? `${SYNTH_TRACKS[synthTrackIdx].name} [PLAYING]` : 'IDLE';
    return [
      `<span class="t-cmd">  +-----------+</span>   <strong>guest@ziliudi</strong>`,
      `<span class="t-cmd">  |  *     *  |</span>   --------------------------`,
      `<span class="t-cmd">  |   Z L D   |</span>   <span class="t-ok">Engine</span>   Vanilla Node + SPA`,
      `<span class="t-cmd">  |  ~~~~~~~  |</span>   <span class="t-ok">Content</span>  ${posts.length} Posts / ${moments.length} Moments / ${shelfItems.length} Shelf`,
      `<span class="t-cmd">  +-----------+</span>   <span class="t-ok">Uptime</span>   ${escapeHtml(up)} (${currentFps} FPS)`,
      `                  <span class="t-ok">Visual</span>   Theme=${theme} / FX=${fxMode}`,
      `                  <span class="t-ok">Synth</span>    ${escapeHtml(track)}`,
    ].join('\n');
  }

  function execTermCommand(rawCmd) {
    const cmdLine = String(rawCmd || '').trim();
    if (!cmdLine) return;
    stopTerminalSnake();
    termHistory.push(cmdLine);
    termHistIdx = termHistory.length;
    appendTermHtml(`<span class="t-ok">➜ ~</span> <span class="t-cmd">${escapeHtml(cmdLine)}</span>`);

    const [cmd, ...rest] = cmdLine.split(/\s+/);
    const arg = rest.join(' ').trim();
    const low = cmd.toLowerCase();

    if (low === 'help') {
      appendTermHtml(
        [
          `<span class="t-ok">neofetch</span>   系统状态面板          <span class="t-ok">snake</span>      60fps 霓虹贪吃蛇`,
          `<span class="t-ok">aura</span>       切换全站幻彩光谱      <span class="t-ok">meteor</span>     召唤漫天流星雨`,
          `<span class="t-ok">fireworks</span>  全屏物理烟花秀        <span class="t-ok">matrix</span>     切换霓虹代码雨`,
          `<span class="t-ok">play/next</span>  播放或切歌黑胶合成器  <span class="t-ok">ls</span>         列出全部文章`,
          `<span class="t-ok">open &lt;n&gt;</span>   跳转阅读第 n 篇文章   <span class="t-ok">random</span>     随机漫游一篇`,
          `<span class="t-ok">theme</span>      切换日夜光影          <span class="t-ok">clear</span>      清空终端屏幕`,
        ].join('\n')
      );
    } else if (low === 'neofetch') {
      appendTermHtml(buildNeofetchHtml());
    } else if (low === 'snake' || low === 'game') {
      startTerminalSnake();
    } else if (low === 'meteor' || low === 'stars') {
      launchMeteorShower(16);
      appendTermHtml(`<span class="t-ok">☄ Summoned 16-streak prismatic meteor shower.</span>`);
    } else if (low === 'aura' || low === 'color') {
      const picked = arg ? setAuraPalette(arg, true) : cycleAuraPalette();
      appendTermHtml(`Aura Spectrum -> <span class="t-ok">${escapeHtml(picked.name)} (${escapeHtml(picked.id)})</span>`);
    } else if (low === 'matrix') {
      const m = toggleMatrixMode();
      appendTermHtml(`FX Canvas -> <span class="t-ok">${m.toUpperCase()}</span>`);
    } else if (low === 'fireworks' || low === 'fw') {
      launchFireworks(6);
      appendTermHtml(`<span class="t-ok">✦ Launched 6-stage aerial fireworks.</span>`);
    } else if (low === 'play') {
      toggleVinyl();
      appendTermHtml(`Audio Synth -> <span class="t-ok">${synthPlaying ? SYNTH_TRACKS[synthTrackIdx].name : 'PAUSED'}</span>`);
    } else if (low === 'pause' || low === 'stop') {
      toggleVinyl(false);
      appendTermHtml(`Audio Synth -> <span class="t-dim">PAUSED</span>`);
    } else if (low === 'next') {
      nextVinylTrack();
      appendTermHtml(`Switched Track -> <span class="t-ok">${escapeHtml(SYNTH_TRACKS[synthTrackIdx].name)}</span>`);
    } else if (low === 'ls') {
      const posts = (window.__SEARCH_INDEX__ || []).filter(i => i.kind === '文章' && (!isGuestPreview() || !i.private));
      if (!posts.length) {
        appendTermHtml(`<span class="t-dim">(empty)</span>`);
      } else {
        appendTermHtml(
          posts
            .map(
              (p, i) =>
                `<span class="t-dim">[${String(i + 1).padStart(2, '0')}]</span> <span class="t-dim">${escapeHtml(p.date)}</span>  <span class="t-link" data-term-open="${escapeHtml(p.url)}">${escapeHtml(p.title)}</span>`
            )
            .join('\n')
        );
      }
    } else if (low === 'open') {
      const posts = (window.__SEARCH_INDEX__ || []).filter(i => i.kind === '文章' && (!isGuestPreview() || !i.private));
      const idx = Number(arg) - 1;
      if (posts[idx]) {
        closeTerminal();
        navigateSpa(posts[idx].url);
      } else {
        appendTermHtml(`<span class="t-dim">用法: 先输入 ls 查看编号，再输入 open 1</span>`);
      }
    } else if (low === 'random') {
      closeTerminal();
      triggerRandomWalk();
    } else if (low === 'theme') {
      themeBtn?.click();
      appendTermHtml(`<span class="t-ok">Toggled theme.</span>`);
    } else if (low === 'whoami') {
      appendTermHtml(`${escapeHtml(document.title.split('·').pop()?.trim() || 'ziliudi')} · owner of this quiet corner.`);
    } else if (low === 'date') {
      appendTermHtml(`${new Date().toLocaleString('zh-CN', { hour12: false })}`);
    } else if (low === 'clear' || low === 'cls') {
      stopTerminalSnake();
      if (termOut) termOut.innerHTML = '';
    } else {
      appendTermHtml(`<span class="t-dim">zsh: command not found: ${escapeHtml(cmd)} (输入 help 查看可用指令)</span>`);
    }
  }

  function openTerminal() {
    if (!termModal) return;
    termModal.classList.add('open');
    if (!termBooted) {
      termBooted = true;
      appendTermHtml(buildNeofetchHtml());
    }
    setTimeout(() => termIn?.focus(), 40);
  }

  function openTerminalAndSnake() {
    openTerminal();
    execTermCommand('snake');
  }

  function closeTerminal() {
    stopTerminalSnake();
    termModal?.classList.remove('open');
  }

  document.getElementById('terminal-open')?.addEventListener('click', openTerminal);
  document.getElementById('term-close-dot')?.addEventListener('click', closeTerminal);
  document.getElementById('term-esc-btn')?.addEventListener('click', closeTerminal);
  termModal?.addEventListener('click', e => {
    if (e.target === termModal) closeTerminal();
  });

  termOut?.addEventListener('click', e => {
    const link = e.target.closest('[data-term-open]');
    if (link) {
      const url = link.getAttribute('data-term-open');
      closeTerminal();
      if (url) navigateSpa(url);
    }
  });

  document.querySelectorAll('[data-term-cmd]').forEach(chip => {
    chip.addEventListener('click', () => {
      execTermCommand(chip.getAttribute('data-term-cmd'));
      termIn?.focus();
    });
  });

  termIn?.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = termIn.value;
      termIn.value = '';
      execTermCommand(v);
    } else if (e.key === 'ArrowUp' && termHistory.length) {
      e.preventDefault();
      termHistIdx = Math.max(0, termHistIdx - 1);
      termIn.value = termHistory[termHistIdx] || '';
    } else if (e.key === 'ArrowDown' && termHistory.length) {
      e.preventDefault();
      termHistIdx = Math.min(termHistory.length, termHistIdx + 1);
      termIn.value = termHistory[termHistIdx] || '';
    } else if (e.key === 'Escape') {
      closeTerminal();
    }
  });

  // --- Engine F: Bespoke Frosted Right-Click Menu + Global Geek Hotkeys ---
  const ctxMenu = document.getElementById('custom-ctx-menu');
  function closeCtxMenu() {
    ctxMenu?.classList.remove('open');
  }

  const sfxBtn = document.getElementById('sfx-toggle-btn');
  const sfxIcoOn = document.getElementById('sfx-ico-on');
  const sfxIcoOff = document.getElementById('sfx-ico-off');
  const ctxMasterVolIn = document.getElementById('ctx-master-vol');
  const ctxVolPctEl = document.getElementById('ctx-vol-pct');

  function syncMasterAudioUI() {
    const isAudible = masterSoundEnabled && masterVolumePct > 0;
    sfxBtn?.classList.toggle('active', isAudible);
    sfxBtn?.classList.toggle('is-muted', !isAudible);
    if (sfxBtn) {
      sfxBtn.title = isAudible ? `全站声音已开启 · ${masterVolumePct}% (V)` : '全站声音已静音 (V)';
    }
    if (sfxIcoOn) sfxIcoOn.style.display = isAudible ? 'inline-flex' : 'none';
    if (sfxIcoOff) sfxIcoOff.style.display = isAudible ? 'none' : 'inline-flex';

    const dispPct = masterSoundEnabled ? masterVolumePct : 0;
    if (ctxMasterVolIn) ctxMasterVolIn.value = String(dispPct);
    if (ctxVolPctEl) ctxVolPctEl.textContent = `${dispPct}%`;

    ['gravity', 'mech', 'chime'].forEach(key => {
      const sw = document.getElementById(`ctx-sw-${key}`);
      if (!sw) return;
      const on = Boolean(sfxSub[key]) && isAudible;
      sw.textContent = sfxSub[key] ? (isAudible ? '已开' : '总静音') : '已关';
      sw.classList.toggle('is-on', on);
    });
  }
  syncMasterAudioUI();

  function toggleMasterSound() {
    masterSoundEnabled = !masterSoundEnabled;
    if (masterSoundEnabled && masterVolumePct === 0) {
      masterVolumePct = 85;
      localStorage.setItem('blog-master-vol', '85');
    }
    localStorage.setItem('blog-master-sound', masterSoundEnabled ? '1' : '0');
    applyMasterGainValue();
    if (!masterSoundEnabled) stopGravityChargeAudio();
    syncMasterAudioUI();
    if (masterSoundEnabled && sfxSub.mech) playMechThock(1.2);
    showGlobalToast(masterSoundEnabled ? `全站声音已开启 (${masterVolumePct}%)` : '全站声音已静音');
  }

  sfxBtn?.addEventListener('click', toggleMasterSound);

  ctxMasterVolIn?.addEventListener('input', e => {
    e.stopPropagation();
    const v = Math.min(100, Math.max(0, Number(ctxMasterVolIn.value) || 0));
    masterVolumePct = v;
    masterSoundEnabled = v > 0;
    localStorage.setItem('blog-master-vol', String(v));
    localStorage.setItem('blog-master-sound', masterSoundEnabled ? '1' : '0');
    ensureSynthCtx();
    applyMasterGainValue();
    syncMasterAudioUI();
  });

  document.addEventListener('contextmenu', e => {
    if (!ctxMenu) return;
    if (e.target.closest('input, textarea, [contenteditable="true"]')) return;
    const selTxt = window.getSelection()?.toString()?.trim() || '';
    if (selTxt && e.target.closest('.prose')) return;

    e.preventDefault();
    const vLbl = document.getElementById('ctx-vinyl-label');
    if (vLbl) vLbl.textContent = synthPlaying ? '暂停黑胶电台' : '播放黑胶电台';
    syncMasterAudioUI();

    ctxMenu.classList.add('open');
    const menuW = ctxMenu.offsetWidth || 240;
    const menuH = ctxMenu.offsetHeight || 420;
    const x = Math.min(e.clientX, window.innerWidth - menuW - 10);
    const y = Math.min(e.clientY, window.innerHeight - menuH - 10);
    ctxMenu.style.left = `${Math.max(8, x)}px`;
    ctxMenu.style.top = `${Math.max(8, y)}px`;
  });

  document.addEventListener('click', e => {
    if (!e.target.closest('#custom-ctx-menu')) closeCtxMenu();
  });
  window.addEventListener('scroll', closeCtxMenu, { passive: true });
  window.addEventListener('resize', closeCtxMenu);

  ctxMenu?.querySelectorAll('[data-sfx-sub]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const key = btn.getAttribute('data-sfx-sub');
      if (!key || !(key in sfxSub)) return;
      sfxSub[key] = !sfxSub[key];
      localStorage.setItem(`blog-sfx-${key}`, sfxSub[key] ? '1' : '0');
      if (sfxSub[key] && !masterSoundEnabled) {
        masterSoundEnabled = true;
        if (masterVolumePct === 0) masterVolumePct = 85;
        localStorage.setItem('blog-master-sound', '1');
        localStorage.setItem('blog-master-vol', String(masterVolumePct));
        applyMasterGainValue();
      }
      syncMasterAudioUI();
      if (sfxSub[key]) {
        if (key === 'mech') playMechThock(1.18);
        else playKalimbaNote(key === 'gravity' ? 523.25 : 659.25, '#10B981', null, key);
      }
    });
  });

  ctxMenu?.querySelectorAll('[data-ctx-act]').forEach(btn => {
    btn.addEventListener('click', () => {
      const act = btn.getAttribute('data-ctx-act');
      closeCtxMenu();
      if (act === 'random') triggerRandomWalk();
      else if (act === 'search') openSearch();
      else if (act === 'vinyl') toggleVinyl();
      else if (act === 'next-track') nextVinylTrack();
      else if (act === 'snake') openTerminalAndSnake();
      else if (act === 'meteor') launchMeteorShower(14);
      else if (act === 'fireworks') launchFireworks(5);
      else if (act === 'aura') cycleAuraPalette();
      else if (act === 'matrix') toggleMatrixMode();
      else if (act === 'terminal') openTerminal();
      else if (act === 'theme') themeBtn?.click();
      else if (act === 'copy-url') {
        navigator.clipboard?.writeText(location.href).then(() => showGlobalToast('已复制本页链接'));
      }
    });
  });

  // --- Engine G: Master Audio Bus + Individual SFX Channels (Mech / Gravity / Chime) ---
  function playMechThock(pitchMult = 1) {
    if (!masterSoundEnabled || masterVolumePct <= 0 || !sfxSub.mech) return;
    const ctx = ensureSynthCtx();
    if (!ctx || !masterBusGain) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(175 * pitchMult, now);
    osc.frequency.exponentialRampToValueAtTime(58 * pitchMult, now + 0.036);
    g.gain.setValueAtTime(0.06, now);
    g.gain.exponentialRampToValueAtTime(0.0008, now + 0.04);
    osc.connect(g);
    g.connect(masterBusGain);
    osc.start(now);
    osc.stop(now + 0.045);
  }

  document.addEventListener('mousedown', e => {
    if (e.button === 0 && e.target?.closest?.('a, button, .heat-cell, .gh-day, .polaroid-card')) {
      playMechThock(1 + (Math.random() - 0.5) * 0.14);
    }
  });

  function playKalimbaNote(hz, color, btnEl, channel = 'chime') {
    if (btnEl) {
      btnEl.classList.add('playing');
      setTimeout(() => btnEl.classList.remove('playing'), 180);
      const r = btnEl.getBoundingClientRect();
      for (let i = 0; i < 6; i++) {
        sparks.push({
          x: r.left + r.width / 2,
          y: r.top,
          vx: (Math.random() - 0.5) * 2.4,
          vy: -1.6 - Math.random() * 2.2,
          gravity: 0.07,
          drag: 0.96,
          r: 2.1,
          alpha: 0.95,
          decay: 0.032,
          color: color || '#8B5CF6',
        });
      }
    }

    if (!masterSoundEnabled || masterVolumePct <= 0) return;
    if (channel === 'gravity' && !sfxSub.gravity) return;
    if (channel === 'chime' && !sfxSub.chime) return;

    const ctx = ensureSynthCtx();
    if (!ctx || !masterBusGain) return;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const env = ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(hz, now);
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(hz * 2, now);
    const overtoneGain = ctx.createGain();
    overtoneGain.gain.value = 0.22;

    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(0.18, now + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0008, now + 0.95);

    osc1.connect(env);
    osc2.connect(overtoneGain);
    overtoneGain.connect(env);
    env.connect(synthAnalyser || masterBusGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 1.0);
    osc2.stop(now + 1.0);
  }

  // --- Engine H: Prose Selection Floating Pill + High-DPI Prismatic Quote Poster Studio ---
  const pqBar = document.getElementById('prose-quote-bar');
  const posterModal = document.getElementById('quote-poster-modal');
  const posterCanvas = document.getElementById('poster-canvas');
  let activeQuoteText = '';
  let activeQuoteSource = '';
  let activeQuoteDate = '';
  let activePosterTheme = 'dawn';

  const POSTER_THEMES = {
    dawn: {
      stops: ['#FFF7ED', '#FCE7F3', '#E0E7FF'],
      cardBg: 'rgba(255, 255, 255, 0.86)',
      cardStroke: 'rgba(139, 92, 246, 0.22)',
      ink: '#1E1B24',
      sub: '#645D72',
      accent: '#EC4899',
    },
    cyber: {
      stops: ['#0F172A', '#2E1045', '#083344'],
      cardBg: 'rgba(18, 16, 28, 0.84)',
      cardStroke: 'rgba(6, 182, 212, 0.34)',
      ink: '#F8FAFC',
      sub: '#94A3B8',
      accent: '#22D3EE',
    },
    aurora: {
      stops: ['#ECFDF5', '#E0F2FE', '#FEF3C7'],
      cardBg: 'rgba(255, 255, 255, 0.88)',
      cardStroke: 'rgba(16, 185, 129, 0.26)',
      ink: '#142620',
      sub: '#526B63',
      accent: '#10B981',
    },
    nebula: {
      stops: ['#1E1B4B', '#4C1D95', '#831843'],
      cardBg: 'rgba(24, 18, 43, 0.82)',
      cardStroke: 'rgba(244, 114, 182, 0.32)',
      ink: '#FDF4FF',
      sub: '#D8B4FE',
      accent: '#F472B6',
    },
  };

  function hideProseQuoteBar() {
    pqBar?.classList.remove('open');
  }

  document.addEventListener('mouseup', () => {
    setTimeout(() => {
      if (!pqBar) return;
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed || !sel.rangeCount) {
        hideProseQuoteBar();
        return;
      }
      const txt = sel.toString().trim().replace(/\s+/g, ' ');
      const anchorEl = sel.anchorNode?.nodeType === 1 ? sel.anchorNode : sel.anchorNode?.parentElement;
      if (txt.length < 4 || !anchorEl?.closest?.('.prose')) {
        hideProseQuoteBar();
        return;
      }
      const rect = sel.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) return;

      activeQuoteText = txt.slice(0, 220);
      activeQuoteSource =
        document.querySelector('.article-main-title')?.textContent?.trim() ||
        document.title.split('·')[0]?.trim() ||
        '自留地';
      activeQuoteDate =
        document.getElementById('article-poster-btn')?.getAttribute('data-post-date') ||
        new Date().toISOString().slice(0, 10).replace(/-/g, '.');

      const clampedX = Math.min(window.innerWidth - 96, Math.max(96, rect.left + rect.width / 2));
      const clampedY = Math.max(54, rect.top);
      pqBar.style.left = `${clampedX}px`;
      pqBar.style.top = `${clampedY}px`;
      pqBar.classList.add('open');
    }, 15);
  });

  window.addEventListener('scroll', hideProseQuoteBar, { passive: true });
  document.addEventListener('mousedown', e => {
    if (!e.target?.closest?.('#prose-quote-bar')) hideProseQuoteBar();
  });

  document.getElementById('pq-copy-btn')?.addEventListener('click', () => {
    if (!activeQuoteText) return;
    const formatted = `「${activeQuoteText}」—— ${activeQuoteSource}`;
    navigator.clipboard?.writeText(formatted).then(() => showGlobalToast('已复制摘录句子'));
    window.getSelection()?.removeAllRanges();
    hideProseQuoteBar();
  });

  function wrapCanvasText(ctx, text, maxWidth) {
    const lines = [];
    let cur = '';
    for (const ch of text) {
      const test = cur + ch;
      if (ctx.measureText(test).width > maxWidth && cur) {
        lines.push(cur);
        cur = ch;
      } else {
        cur = test;
      }
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 9);
  }

  async function renderPosterCanvas() {
    if (!posterCanvas) return;
    const ctx = posterCanvas.getContext('2d');
    const W = posterCanvas.width;
    const H = posterCanvas.height;
    const th = POSTER_THEMES[activePosterTheme] || POSTER_THEMES.dawn;

    // 1. Multi-stop diagonal gradient canvas backdrop
    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, th.stops[0]);
    bgGrad.addColorStop(0.52, th.stops[1]);
    bgGrad.addColorStop(1, th.stops[2]);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    // Subtle decorative ambient glow orb
    const rad = ctx.createRadialGradient(W * 0.82, H * 0.16, 10, W * 0.82, H * 0.16, 320);
    rad.addColorStop(0, th.accent + '33');
    rad.addColorStop(1, 'transparent');
    ctx.fillStyle = rad;
    ctx.fillRect(0, 0, W, H);

    // 2. Inner Editorial Quartz Card
    const padX = 68;
    const padY = 76;
    const cardW = W - padX * 2;
    const cardH = H - padY * 2;
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
    ctx.shadowBlur = 42;
    ctx.shadowOffsetY = 18;
    ctx.fillStyle = th.cardBg;
    ctx.beginPath();
    ctx.roundRect(padX, padY, cardW, cardH, 36);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = th.cardStroke;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(padX, padY, cardW, cardH, 36);
    ctx.stroke();

    // 3. Decorative Opening Quote Mark
    ctx.fillStyle = th.accent;
    ctx.font = '700 96px Georgia, serif';
    ctx.fillText('“', padX + 54, padY + 122);

    // 4. Quote Body Typography (adaptive size based on length)
    const quoteStr = activeQuoteText || '留一块不受算法打扰的地方，慢慢写字，认真造物。';
    const fontSize = quoteStr.length > 90 ? 32 : quoteStr.length > 48 ? 37 : 42;
    const lineHeight = Math.round(fontSize * 1.72);
    ctx.fillStyle = th.ink;
    ctx.font = `600 ${fontSize}px "Songti SC", "Noto Serif SC", "STSong", Georgia, serif`;
    const lines = wrapCanvasText(ctx, quoteStr, cardW - 120);
    let textY = padY + 190;
    lines.forEach(line => {
      ctx.fillText(line, padX + 60, textY);
      textY += lineHeight;
    });

    // 5. Bottom Attribution Footer inside Card
    const footY = padY + cardH - 122;
    const meta = window.__SITE_META__ || {};
    const rawSrc = (activeQuoteSource || meta.title || '自留地').trim();
    const trimmedSrc = rawSrc.length > 20 ? rawSrc.slice(0, 20) + '…' : rawSrc;
    const srcLabel = `—— 《${trimmedSrc}》`;
    ctx.fillStyle = th.accent;
    ctx.font = '600 21px "Songti SC", "Noto Serif SC", system-ui, serif';
    const srcW = ctx.measureText(srcLabel).width;
    ctx.fillText(srcLabel, padX + cardW - 60 - srcW, footY - 56);

    ctx.strokeStyle = th.cardStroke;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX + 60, footY - 30);
    ctx.lineTo(padX + cardW - 60, footY - 30);
    ctx.stroke();

    const author = meta.author || '自留地';
    const handle = '@' + (meta.handle || 'ziliudi');
    const avatarDom = document.querySelector('img[data-live-avatar]');

    // Draw circular avatar if loaded
    let textOffsetX = padX + 60;
    if (avatarDom && avatarDom.complete && avatarDom.naturalWidth > 0) {
      try {
        ctx.save();
        ctx.beginPath();
        ctx.arc(padX + 92, footY + 20, 32, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarDom, padX + 60, footY - 12, 64, 64);
        ctx.restore();
        textOffsetX = padX + 142;
      } catch (_) {}
    }

    ctx.fillStyle = th.ink;
    ctx.font = '700 24px system-ui, -apple-system, sans-serif';
    ctx.fillText(author, textOffsetX, footY + 14);

    ctx.fillStyle = th.sub;
    ctx.font = '500 19px Consolas, monospace';
    ctx.fillText(`${handle} · ${activeQuoteDate || ''}`, textOffsetX, footY + 44);

    const siteSeal = (meta.title || '自留地').slice(0, 10);
    ctx.fillStyle = th.sub;
    ctx.font = '600 18px "Songti SC", "Noto Serif SC", serif';
    const sealW = ctx.measureText(`✦ ${siteSeal}`).width;
    ctx.fillText(`✦ ${siteSeal}`, padX + cardW - 60 - sealW, footY + 30);
  }

  function openQuotePoster(quoteStr, srcTitle, dateStr) {
    activeQuoteText = (quoteStr || '').trim() || '留一块不受算法打扰的地方，慢慢写字，认真造物。';
    activeQuoteSource = srcTitle || document.querySelector('.article-main-title')?.textContent?.trim() || '自留地';
    activeQuoteDate = dateStr || new Date().toISOString().slice(0, 10).replace(/-/g, '.');
    hideProseQuoteBar();
    posterModal?.classList.add('open');
    renderPosterCanvas();
  }

  function closeQuotePoster() {
    posterModal?.classList.remove('open');
  }

  document.getElementById('pq-poster-btn')?.addEventListener('click', () => {
    window.getSelection()?.removeAllRanges();
    openQuotePoster(activeQuoteText, activeQuoteSource, activeQuoteDate);
  });

  document.getElementById('poster-close-btn')?.addEventListener('click', closeQuotePoster);
  posterModal?.addEventListener('click', e => {
    if (e.target === posterModal) closeQuotePoster();
  });

  document.querySelectorAll('#poster-themes [data-poster-theme]').forEach(dot => {
    dot.addEventListener('click', () => {
      activePosterTheme = dot.getAttribute('data-poster-theme') || 'dawn';
      document.querySelectorAll('#poster-themes [data-poster-theme]').forEach(d => d.classList.toggle('active', d === dot));
      renderPosterCanvas();
    });
  });

  document.getElementById('poster-download-btn')?.addEventListener('click', () => {
    if (!posterCanvas) return;
    const a = document.createElement('a');
    a.download = `quote-card-${Date.now()}.png`;
    a.href = posterCanvas.toDataURL('image/png');
    a.click();
    showGlobalToast('已下载高清金句海报');
  });

  document.getElementById('poster-copy-img')?.addEventListener('click', () => {
    if (!posterCanvas || !navigator.clipboard?.write || typeof ClipboardItem === 'undefined') {
      showGlobalToast('当前环境请直接点击下载 PNG');
      return;
    }
    posterCanvas.toBlob(async blob => {
      if (!blob) return;
      try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
        showGlobalToast('海报图片已复制到剪贴板');
      } catch (_) {
        showGlobalToast('复制受限，已为你准备下载按钮');
      }
    }, 'image/png');
  });

  // Register Ctrl+K Raycast Palette Commands
  cmdRegistry = {
    snake: openTerminalAndSnake,
    aura: cycleAuraPalette,
    vinyl: () => toggleVinyl(),
    'master-sound': toggleMasterSound,
    meteor: () => launchMeteorShower(14),
    fireworks: () => launchFireworks(5),
    matrix: toggleMatrixMode,
    theme: () => themeBtn?.click(),
    random: triggerRandomWalk,
  };

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      closeCtxMenu();
      closeTerminal();
      closeQuotePoster();
      hideProseQuoteBar();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('input, textarea, select, [contenteditable="true"]')) return;

    if (e.key === '`' || e.key === '~') {
      e.preventDefault();
      if (termModal?.classList.contains('open')) closeTerminal();
      else openTerminal();
      return;
    }
    if (
      termModal?.classList.contains('open') ||
      searchBackdrop?.classList.contains('open') ||
      posterModal?.classList.contains('open')
    ) {
      return;
    }

    const k = e.key.toLowerCase();
    if (k === 'p') toggleVinyl();
    else if (k === 'n') nextVinylTrack();
    else if (k === 'm') toggleMatrixMode();
    else if (k === 's') launchMeteorShower(14);
    else if (k === 'v') toggleMasterSound();
    else if (k === 'c') cycleAuraPalette();
    else if (k === 'r') triggerRandomWalk();
    else if (k === 'f') launchFireworks(5);
    else if (k === 'd') themeBtn?.click();
  });

  const floatingTip = document.getElementById('floating-tip');
  function showFloatingTip(anchorEl, text) {
    if (!floatingTip || !anchorEl || !text) return;
    floatingTip.textContent = text.length > 34 ? text.slice(0, 34) + '…' : text;
    const r = anchorEl.getBoundingClientRect();
    const anchorX = r.left + r.width / 2;
    const tipW = floatingTip.offsetWidth || 180;
    const halfW = tipW / 2;
    const clampedX = Math.min(window.innerWidth - halfW - 14, Math.max(halfW + 14, anchorX));
    const arrowOffset = Math.min(tipW - 12, Math.max(12, halfW + (anchorX - clampedX)));
    floatingTip.style.left = `${clampedX}px`;
    floatingTip.style.top = `${r.top}px`;
    floatingTip.style.setProperty('--arrow-left', `${arrowOffset}px`);
    floatingTip.classList.add('show');
  }
  function hideFloatingTip() {
    floatingTip?.classList.remove('show');
  }
  window.addEventListener('scroll', hideFloatingTip, { passive: true });

  function mountV12PageHooks(scope = document) {
    bindHoloTilt(scope);
    bindScramble(scope);
    if (autoLocatedText) paintLiveLocationDOM(autoLocatedText);

    scope.querySelectorAll('[data-relocate-btn]').forEach(btn => {
      if (btn.dataset.locBound) return;
      btn.dataset.locBound = '1';
      btn.addEventListener('click', e => {
        if (isGuestPreview() || !isLocalDev()) return;
        e.preventDefault();
        e.stopPropagation();
        syncAutoLocation({ preferGps: true, notify: true });
      });
    });

    const artPosterBtn = scope.querySelector('#article-poster-btn');
    if (artPosterBtn && !artPosterBtn.dataset.ptBound) {
      artPosterBtn.dataset.ptBound = '1';
      artPosterBtn.addEventListener('click', () => {
        const selTxt = window.getSelection()?.toString()?.trim() || '';
        const fallback =
          artPosterBtn.getAttribute('data-post-summary') ||
          scope.querySelector('.prose p')?.textContent?.trim() ||
          '';
        const title = scope.querySelector('.article-main-title')?.textContent?.trim() || '自留地';
        const dt = artPosterBtn.getAttribute('data-post-date') || '';
        openQuotePoster(selTxt.length >= 4 ? selTxt.slice(0, 220) : fallback.slice(0, 180), title, dt);
      });
    }

    scope.querySelector('#hero-status-trigger')?.addEventListener('click', openTerminal);
    scope.querySelector('#vinyl-play-disc')?.addEventListener('click', () => toggleVinyl());
    scope.querySelector('#vinyl-toggle-btn')?.addEventListener('click', () => toggleVinyl());
    scope.querySelector('#vinyl-next-btn')?.addEventListener('click', () => nextVinylTrack());
    scope.querySelectorAll('[data-vinyl-idx]').forEach(dot => {
      dot.addEventListener('click', () => selectVinylTrack(Number(dot.getAttribute('data-vinyl-idx'))));
    });
    scope.querySelectorAll('#vinyl-piano [data-note-hz]').forEach(keyBtn => {
      const hz = Number(keyBtn.getAttribute('data-note-hz')) || 523.25;
      const kc = keyBtn.style.getPropertyValue('--kc') || '#8B5CF6';
      keyBtn.addEventListener('mousedown', e => {
        e.stopPropagation();
        playKalimbaNote(hz, kc, keyBtn);
      });
      keyBtn.addEventListener('mouseenter', e => {
        if (e.buttons === 1) playKalimbaNote(hz, kc, keyBtn);
      });
    });
    syncVinylUI();

    // Interactive Cyber Fortune Capsule (今日宜忌抽签 + 彩虹纸屑)
    const fortuneBtn = scope.querySelector('#cyber-fortune-btn');
    const fortuneTxt = scope.querySelector('#fortune-text');
    if (fortuneBtn && fortuneTxt && !fortuneBtn.dataset.ftBound) {
      fortuneBtn.dataset.ftBound = '1';
      const FORTUNES = [
        '今日宜 · 深夜造物',
        '今日宜 · 听黑胶摸鱼',
        '今日宜 · 删繁就简',
        '今日宜 · 慢倍速看片',
        '今日忌 · 乱装依赖包',
        '今日宜 · 出门吹晚风',
        '今日宜 · 随手记两行',
        '今日忌 · 通宵改需求',
      ];
      let fIdx = 0;
      fortuneBtn.addEventListener('click', e => {
        fIdx = (fIdx + 1) % FORTUNES.length;
        fortuneBtn.classList.add('flipping');
        const r = fortuneBtn.getBoundingClientRect();
        spawnConfettiAt(e.clientX || r.left + r.width / 2, e.clientY || r.top + r.height / 2);
        setTimeout(() => {
          fortuneTxt.textContent = FORTUNES[fIdx];
        }, 110);
        setTimeout(() => {
          fortuneBtn.classList.remove('flipping');
        }, 340);
      });
    }

    // 1-Click GitHub Avatar Upload (Homepage & About Profile)
    scope.querySelectorAll('[data-avatar-upload]').forEach(el => {
      if (el.dataset.avBound) return;
      el.dataset.avBound = '1';
      el.addEventListener('click', e => {
        if (isGuestPreview() || !isLocalDev()) return;
        e.preventDefault();
        e.stopPropagation();
        pickGlobalImages({ multiple: false }, async paths => {
          if (!paths[0]) return;
          const stRes = await fetch('/api/state');
          const stData = await stRes.json();
          const nextSite = { ...(stData.site || {}), avatar: paths[0] };
          const saveRes = await fetch('/api/site', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(nextSite),
          });
          if ((await saveRes.json()).ok) {
            const inSubdir = /\/posts\//i.test(location.pathname);
            const resolved = inSubdir ? `../${paths[0]}` : paths[0];
            document.querySelectorAll('img[data-live-avatar]').forEach(img => {
              img.src = resolved;
            });
            showGlobalToast('头像已更新');
          }
        });
      });
    });

    // GitHub 4-o'clock Status Bubble + Inline Popover Editor on About Page
    const ghStatusBtn = scope.querySelector('#gh-status-pill');
    const ghStatusPop = scope.querySelector('#gh-status-popover');
    const ghStatusIn = scope.querySelector('#gh-status-input');
    const ghStatusSave = scope.querySelector('#gh-status-save');
    if (ghStatusBtn && !ghStatusBtn.dataset.stBound) {
      ghStatusBtn.dataset.stBound = '1';

      const commitStatus = async val => {
        const clean = String(val || '').trim() || '在线';
        const stRes = await fetch('/api/state');
        const stData = await stRes.json();
        const nextSite = { ...(stData.site || {}), statusText: clean };
        const saveRes = await fetch('/api/site', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nextSite),
        });
        if ((await saveRes.json()).ok) {
          const txtEl = ghStatusBtn.querySelector('#gh-status-text');
          if (txtEl) txtEl.textContent = clean;
          if (ghStatusIn) ghStatusIn.value = clean;
          ghStatusPop?.classList.remove('open');
          showGlobalToast('状态已更新');
        }
      };

      ghStatusBtn.addEventListener('click', e => {
        e.stopPropagation();
        if (!isLocalDev() || isGuestPreview() || !ghStatusPop) {
          openTerminal();
          return;
        }
        const willOpen = !ghStatusPop.classList.contains('open');
        ghStatusPop.classList.toggle('open', willOpen);
        if (willOpen) setTimeout(() => ghStatusIn?.focus(), 30);
      });

      ghStatusSave?.addEventListener('click', () => commitStatus(ghStatusIn?.value));
      ghStatusIn?.addEventListener('keydown', e => {
        if (e.key === 'Enter' && !e.isComposing) {
          e.preventDefault();
          commitStatus(ghStatusIn.value);
        } else if (e.key === 'Escape') {
          ghStatusPop?.classList.remove('open');
        }
      });
      ghStatusPop?.querySelectorAll('[data-status-preset]').forEach(btn => {
        btn.addEventListener('click', () => commitStatus(btn.getAttribute('data-status-preset')));
      });
      document.addEventListener('click', e => {
        if (ghStatusPop?.classList.contains('open') && !e.target.closest('#gh-status-popover') && !e.target.closest('#gh-status-pill')) {
          ghStatusPop.classList.remove('open');
        }
      });
    }

    // GitHub 45-Week Contribution Calendar Hover Floating Tooltip & Click
    const ghTip = scope.querySelector('#gh-contrib-tip');
    scope.querySelectorAll('.gh-contrib-matrix .gh-day:not(.is-future)').forEach(cell => {
      cell.addEventListener('mouseenter', () => {
        const hiddenPriv = isGuestPreview() && cell.getAttribute('data-priv-cell') === '1';
        const tipText = hiddenPriv
          ? `${cell.getAttribute('data-tip')?.slice(0, 10) || ''} · 无记录`
          : (cell.getAttribute('data-tip') || '');
        if (ghTip) ghTip.textContent = tipText;
        showFloatingTip(cell, tipText);
      });
      cell.addEventListener('mouseleave', () => {
        hideFloatingTip();
        if (ghTip) ghTip.textContent = '42 WEEKS';
      });
      cell.addEventListener('click', () => {
        if (isGuestPreview() && cell.getAttribute('data-priv-cell') === '1') return;
        const href = cell.getAttribute('data-href');
        if (href) navigateSpa(href);
      });
    });
  }

  mountPageView(document);

  // Auto-detect real Province & City on load (upgrades missing or province-only strings automatically!)
  if (!autoLocatedText || !autoLocatedText.includes('·') || sessionStorage.getItem('blog-auto-loc-ok') !== '1') {
    syncAutoLocation({ preferGps: false, notify: false });
  }

  // Live Folder Sync (External file edits refresh view seamlessly!)
  if (isLocalDev() && !/\/studio(\.html)?$/i.test(location.pathname)) {
    const es = new EventSource('/__live');
    es.onmessage = e => {
      if (e.data === 'reload') navigateSpa(location.href, { push: false });
    };
  }
})();
