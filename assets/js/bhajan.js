// ============================================================
// Daily Devotional Bhajan + Visit Counter
// Deity of the day (Sun–Sat) and site-wide visit counter
// ============================================================

window.DailyBhajan = (() => {

  // ── Day → Deity mapping (0 = Sunday … 6 = Saturday) ──────
  // All videos are 3–4 minutes long (single bhajans, not jukeboxes
  // or hour-long dhuns). Durations and embeddability verified
  // against YouTube, August 2026.
  const DEITIES = [
    { // 0 – Sunday
      day: 'Sunday',
      deity: 'Surya Dev',
      hindiName: 'सूर्य देव',
      emoji: '☀️',
      mantra: 'Om Suryaya Namaha',
      mantraHi: 'ॐ सूर्याय नमः',
      blessing: 'Seek blessings of the Sun God for health & vitality',
      accentColor: '#d97706',
      songs: [
        { t: 'Om Jai Surya Bhagwan Aarti',               v: '_3jJahZ3L9g' }, // 3:42
        { t: 'Suryashtakam (Anuradha Paudwal)',          v: 'BPMgPs_R9J4' }, // 3:06
        { t: 'Surya Mandala Stotram',                    v: '32TGOFRIVmE' }, // 3:50
        { t: 'Jo Suraj Ko Pooje (Hariharan)',            v: 'XfwM8tLvyXg' }, // 4:10
        { t: 'Aditya Hridayam — 4-Minute Recitation',    v: 'EsCbuTke7yw' }  // 4:15
      ],
      ytSearch: 'surya+dev+aarti+om+jai+surya+bhagwan+anuradha+paudwal'
    },
    { // 1 – Monday
      day: 'Monday',
      deity: 'Lord Shiva',
      hindiName: 'भगवान शिव',
      emoji: '🔱',
      mantra: 'Om Namah Shivaya',
      mantraHi: 'ॐ नमः शिवाय',
      blessing: 'Offer milk & bilva leaves for peace and liberation',
      accentColor: '#7c3aed',
      songs: [
        { t: 'Shiv Panchakshar Stotra (Sachet–Parampara)',    v: 'im0P-4Ds2Dk' }, // 3:26
        { t: 'Siva Panchakshara Stotram (M.S. Subbulakshmi)', v: 'i1v_XnyxEDE' }, // 3:17
        { t: 'Karpur Gauram Karunavtaram',                    v: 'wR-agGIqgik' }, // 4:13
        { t: 'Shiv Panchakshar Stotram (Rameshbhai Oza)',     v: '9JaXutSnZ94' }, // 3:59
        { t: 'Shiv Dhyan Mantra — Deep Meditation',           v: 'Ur2SsvKhIdo' }  // 3:09
      ],
      ytSearch: 'om+namah+shivaya+dhun+anuradha+paudwal'
    },
    { // 2 – Tuesday
      day: 'Tuesday',
      deity: 'Hanuman & Durga',
      hindiName: 'श्री हनुमान & माँ दुर्गा',
      emoji: '🪬',
      mantra: 'Jai Bajrang Bali',
      mantraHi: 'जय बजरंग बली',
      blessing: 'Fast or offer sindoor to Hanuman for courage & strength',
      accentColor: '#dc2626',
      songs: [
        { t: 'Aarti Kije Hanuman Lala Ki (Rasraj Ji Maharaj)', v: 'YRB6Xxdm3Do' }, // 3:23
        { t: 'Aarti Kije Hanuman Lala Ki (Hariharan)',         v: 'gbYXo2Xqlmk' }, // 4:08
        { t: 'Jai Ambe Gauri Aarti (Anuradha Paudwal)',        v: 'OH8mxbIp_Ro' }, // 3:37
        { t: 'Om Jai Ambe Gauri — Durga Mata Aarti',           v: '3sEvIPncLkE' }, // 3:36
        { t: 'Superfast Hanuman Chalisa',                      v: '_VzGJOezxB8' }  // 3:51
      ],
      ytSearch: 'hanuman+chalisa+gulshan+kumar+hariharan'
    },
    { // 3 – Wednesday
      day: 'Wednesday',
      deity: 'Lord Krishna',
      hindiName: 'भगवान कृष्ण',
      emoji: '🦚',
      mantra: 'Hare Krishna Hare Rama',
      mantraHi: 'हरे कृष्ण हरे राम',
      blessing: 'Offer tulsi & yellow flowers for wisdom & love',
      accentColor: '#0369a1',
      songs: [
        { t: 'Achyutam Keshavam (Ayanty Ray)',           v: 'PKZL5f1LUpk' }, // 3:18
        { t: 'Hare Krishna Hare Rama — Morning Mantra',  v: '5F81ehtPqmM' }, // 3:50
        { t: 'Hare Krishna Hare Rama Mantra',            v: 'Nr5ZIIZGJhY' }, // 3:08
        { t: 'Madhurashtakam — Adharam Madhuram',        v: '1jnQZN8iUsc' }, // 4:14
        { t: 'Om Jai Jagdish Hare',                      v: 'uXAOJtltKcg' }  // 4:09
      ],
      ytSearch: 'achyutam+keshavam+krishna+damodaram+bhajan'
    },
    { // 4 – Thursday
      day: 'Thursday',
      deity: 'Sai Baba & Raghavendra Swamiji',
      hindiName: 'साईं बाबा & श्री राघवेंद्र स्वामी',
      emoji: '🪔',
      mantra: 'Om Sai Ram · Sri Gurubhyo Namaha',
      mantraHi: 'ॐ साईं राम · श्री गुरुभ्यो नमः',
      blessing: 'Seek the Guru\'s grace — offer flowers & light a diya on Guruvaar',
      accentColor: '#b45309',
      songs: [
        { t: 'Sai Baba Aarti (Rajshri Soul)',            v: 'DT5PaaxItzY' }, // 3:13
        { t: 'Shirdi Sai Baba Aarti (with lyrics)',      v: 'WXMpcM8SQFM' }, // 3:22
        { t: 'Aarati Saibaba — Soukhya Datar Jeeva',     v: 'Bes4ivvkzXk' }, // 2:55
        { t: 'Om Om Sai Ram — Shirdi Sai Bhajan',        v: 'NKE6HSs2_zw' }, // 4:21
        { t: 'Poojyaya Raghavendraya',                   v: 'Vrb1yfD_ch8' }  // 4:21
      ],
      ytSearch: 'om+sai+ram+dhun+shirdi+sai+baba+bhajan'
    },
    { // 5 – Friday
      day: 'Friday',
      deity: 'Goddess Lakshmi',
      hindiName: 'माँ लक्ष्मी',
      emoji: '🌸',
      mantra: 'Om Shri Mahalakshmyai Namaha',
      mantraHi: 'ॐ श्री महालक्ष्म्यै नमः',
      blessing: 'Light a diya with ghee & offer lotus for wealth & grace',
      accentColor: '#db2777',
      songs: [
        { t: 'Mahalakshmi Ashtakam (Rajshri Soul)',      v: 'FrUa0ovoZJQ' }, // 3:32
        { t: 'Mahalakshmi Ashtakam — Chanting',          v: 'lCIHz9Nf68Y' }, // 3:23
        { t: 'Shri Mahalakshmi Ashtakam',                v: 'k955jzEVdYo' }, // 3:48
        { t: 'Om Jai Lakshmi Mata (Rahul Vaidya)',       v: 'J7zkL1zkPYU' }, // 4:24
        { t: 'Superfast Lakshmi Chalisa',                v: '6BVyuMC02dw' }  // 3:17
      ],
      ytSearch: 'om+jai+lakshmi+mata+aarti+anuradha+paudwal'
    },
    { // 6 – Saturday
      day: 'Saturday',
      deity: 'Shani Dev & Hanuman',
      hindiName: 'शनि देव & श्री हनुमान',
      emoji: '🌑',
      mantra: 'Om Sham Shanicharaya Namaha',
      mantraHi: 'ॐ शं शनिश्चराय नमः',
      blessing: 'Offer sesame oil & black sesame to Shani for protection',
      accentColor: '#374151',
      songs: [
        { t: 'Jai Shani Dev — Shani Aarti',              v: 'tcQMwShHwI8' }, // 4:03
        { t: 'Shani Dev Aarti — Jai Jai Shani Dev',      v: 'fZrQrTpRr7g' }, // 3:28
        { t: 'Shree Shanidevachi Aarti (Marathi)',       v: 'oZ4HNJf1MVM' }, // 3:02
        { t: 'Superfast Hanuman Chalisa (Shankar Mahadevan)', v: '9q8kkmCa9GY' }, // 2:58
        { t: '3-Minute Hanuman Chalisa (Nitika Gautam)', v: 'xq4VWY7KxKc' }  // 3:00
      ],
      ytSearch: 'shani+dev+chalisa+bhajan'
    }
  ];

  function getTodaysDeity() {
    return DEITIES[new Date().getDay()];
  }

  // ── Song rotation: a different bhajan from today's pool on every
  //    page load (counter persists in localStorage and cycles). ──
  const _songIndex = (() => {
    try {
      const n = (parseInt(localStorage.getItem('bhajan_song_idx') || '-1', 10) + 1) % 9999;
      localStorage.setItem('bhajan_song_idx', String(n));
      return n;
    } catch (_) { return Math.floor(Math.random() * 9999); }
  })();
  let _songSkip = 0; // advanced when a video fails to load

  function getTodaysSong() {
    const d = getTodaysDeity();
    return d.songs[(_songIndex + _songSkip) % d.songs.length];
  }

  // ── Render the full daily devotional card (bottom section) ─
  function render() {
    const d = getTodaysDeity();
    const section = document.getElementById('bhajan-card-wrap');
    if (!section) return;

    section.innerHTML = `
      <div class="bhajan-card" style="--accent:${d.accentColor}">

        <!-- Header row -->
        <div class="bhajan-header">
          <div class="bhajan-day-pill">${d.day}</div>
          <span class="bhajan-title-text">🎵 Today's Devotional</span>
        </div>

        <!-- Deity info -->
        <div class="bhajan-deity-row">
          <div class="bhajan-emoji-wrap">${d.emoji}</div>
          <div class="bhajan-deity-info">
            <div class="bhajan-deity-name">${d.deity}</div>
            <div class="bhajan-deity-hindi">${d.hindiName}</div>
          </div>
        </div>

        <!-- Mantra -->
        <div class="bhajan-mantra-block">
          <div class="bhajan-mantra">${d.mantra}</div>
          <div class="bhajan-mantra-hi">${d.mantraHi}</div>
          <div class="bhajan-blessing">${d.blessing}</div>
        </div>

        <!-- Song player bar -->
        <div class="bhajan-song-bar">
          <span class="bhajan-music-icon">🎵</span>
          <div class="bhajan-song-bar-info">
            <div class="bhajan-song-bar-title">${getTodaysSong().t}</div>
            <div class="bhajan-song-bar-hint">Plays here · YouTube · new song each visit</div>
          </div>
          <button class="bhajan-play-btn"
                  onclick="window.DailyBhajan.playBhajan()"
                  aria-label="Play ${getTodaysSong().t}">
            ▶ Play
          </button>
        </div>

      </div>
    `;
  }

  // ── Mini widget rendered inside the Rahu Kalam callout ─────
  function renderMiniInWidget() {
    const el = document.getElementById('rahuDailyDeity');
    if (!el) return;
    const d = getTodaysDeity();
    const s = getTodaysSong();
    el.innerHTML = `
      <div class="rahu-deity-mini" style="--accent:${d.accentColor}">
        <span class="rdm-emoji">${d.emoji}</span>
        <div class="rdm-body">
          <div class="rdm-deity">${d.deity}</div>
          <div class="rdm-mantra">${d.mantra}</div>
          <div class="rdm-mantra" style="opacity:.8">🎵 ${s.t}</div>
        </div>
        <button class="rdm-play-btn"
                onclick="window.DailyBhajan.playBhajan()"
                aria-label="Play ${s.t}">
          ▶ Play
        </button>
      </div>
    `;
  }

  function syncPlayButtons(isPlaying) {
    const label = isPlaying ? '⏹ Stop' : '▶ Play';
    document.querySelectorAll('.rdm-play-btn, .bhajan-play-btn').forEach(btn => {
      btn.textContent = label;
      btn.classList.remove('loading');
      btn.disabled = false;
      btn.setAttribute('aria-label', isPlaying ? 'Stop bhajan' : `Play ${getTodaysSong().t}`);
    });
  }

  // ── YouTube IFrame API ──────────────────────────────────────
  // Loaded eagerly so it's ready when user clicks Play.
  let _ytReady = false;
  let _ytPlayer = null;

  (function loadYTAPI() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
  })();

  window.onYouTubeIframeAPIReady = function () { _ytReady = true; };

  // ── In-page floating mini-player ────────────────────────────
  // iOS autoplay trick: start muted (allowed), then unmute via API.

  function playBhajan() {
    if (document.body.classList.contains('bhajan-playing')) {
      closeMiniPlayer();
      return;
    }
    const d = getTodaysDeity();
    const s = getTodaysSong();
    _startPlayer(s.v, `${d.emoji} ${d.deity}`, s.t);
  }

  // Advance to the next song in today's pool without a page reload
  function nextBhajan() {
    _songSkip++;
    const d = getTodaysDeity();
    const s = getTodaysSong();
    render();
    renderMiniInWidget();
    document.body.classList.remove('bhajan-playing');
    _startPlayer(s.v, `${d.emoji} ${d.deity}`, s.t);
  }

  function _startPlayer(videoId, deityLabel, songTitle) {
    const container = document.getElementById('bhajanMiniPlayer');
    const fallback  = document.getElementById('bhajanFallbackLink');
    if (!container) return;

    // If something is already playing, stop it first
    if (document.body.classList.contains('bhajan-playing')) {
      closeMiniPlayer();
    }

    // Update header info
    const deityEl = document.getElementById('bhajanPlayerDeity');
    const titleEl = document.getElementById('bhajanPlayerTitle');
    if (deityEl) deityEl.textContent = deityLabel;
    if (titleEl) titleEl.textContent = songTitle;
    if (fallback) fallback.href = `https://www.youtube.com/watch?v=${videoId}`;

    // Prepare target div for YT player
    const wrap = container.querySelector('.bmp-frame-wrap');
    wrap.innerHTML = '<div id="bhajanYTTarget"></div>';

    // Show the mini-player
    container.classList.add('show');
    document.body.classList.add('bhajan-playing');
    syncPlayButtons(true);

    function createPlayer() {
      if (_ytPlayer) {
        try { _ytPlayer.destroy(); } catch (_) {}
        _ytPlayer = null;
      }
      _ytPlayer = new YT.Player('bhajanYTTarget', {
        videoId: videoId,
        playerVars: {
          autoplay: 1,
          mute: 1,          // iOS requires muted for autoplay
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: 1
        },
        events: {
          onReady: function (e) {
            e.target.playVideo();
            // Unmute after a short delay — iOS allows this once playback starts
            setTimeout(function () {
              e.target.unMute();
              e.target.setVolume(100);
              // If the browser refused the unmute (page-load autoplay
              // without a user gesture), offer a tap-to-unmute chip.
              setTimeout(_showUnmuteHintIfMuted, 700);
            }, 500);
          },
          onStateChange: function (e) {
            if (e.data === 0) closeMiniPlayer(); // ended
          },
          onError: function () {
            // Video unavailable — advance to the next song in today's pool
            const d = getTodaysDeity();
            if (_songSkip < d.songs.length - 1) {
              _songSkip++;
              const s = getTodaysSong();
              document.body.classList.remove('bhajan-playing');
              _startPlayer(s.v, `${d.emoji} ${d.deity}`, s.t);
            }
          }
        }
      });
    }

    if (_ytReady) {
      createPlayer();
    } else {
      // Wait for API to load (should be fast since we preloaded it)
      const t = setInterval(function () {
        if (_ytReady) { clearInterval(t); createPlayer(); }
      }, 100);
    }
  }

  function _unmuteNow() {
    try {
      if (_ytPlayer && typeof _ytPlayer.isMuted === 'function' && _ytPlayer.isMuted()) {
        _ytPlayer.unMute();
        _ytPlayer.setVolume(100);
        _ytPlayer.playVideo();
      }
    } catch (_) { /* non-critical */ }
    document.getElementById('bmpUnmuteBtn')?.remove();
    _disarmAutoUnmute();
  }

  // Any first user interaction (tap, click, key) counts as a browser
  // "gesture" — use it to switch sound on automatically.
  const _UNMUTE_EVENTS = ['pointerdown', 'keydown', 'touchend'];
  function _armAutoUnmute() {
    _UNMUTE_EVENTS.forEach(ev => document.addEventListener(ev, _unmuteNow, true));
  }
  function _disarmAutoUnmute() {
    _UNMUTE_EVENTS.forEach(ev => document.removeEventListener(ev, _unmuteNow, true));
  }

  function _showUnmuteHintIfMuted() {
    try {
      if (!_ytPlayer || typeof _ytPlayer.isMuted !== 'function' || !_ytPlayer.isMuted()) return;
      _armAutoUnmute();
      const bar = document.querySelector('#bhajanMiniPlayer .bmp-bar');
      if (!bar || document.getElementById('bmpUnmuteBtn')) return;
      const btn = document.createElement('button');
      btn.id = 'bmpUnmuteBtn';
      btn.textContent = '🔊 Tap anywhere for sound';
      btn.setAttribute('aria-label', 'Unmute bhajan');
      btn.style.cssText = 'margin-right:.4rem;padding:.2rem .6rem;border:none;border-radius:999px;' +
        'background:#fff;color:#7b1a0e;font-size:.72rem;font-weight:600;cursor:pointer;flex-shrink:0';
      btn.onclick = _unmuteNow;
      bar.insertBefore(btn, bar.querySelector('.bmp-close'));
    } catch (_) { /* non-critical */ }
  }

  function closeMiniPlayer() {
    const container = document.getElementById('bhajanMiniPlayer');
    if (container) {
      container.classList.remove('show');
      const wrap = container.querySelector('.bmp-frame-wrap');
      if (wrap) wrap.innerHTML = '';
    }
    document.getElementById('bmpUnmuteBtn')?.remove();
    _disarmAutoUnmute();
    document.body.classList.remove('bhajan-playing');
    if (_ytPlayer) {
      try { _ytPlayer.destroy(); } catch (_) {}
      _ytPlayer = null;
    }
    syncPlayButtons(false);
  }

  // ── Visit Counter via countapi.xyz (free, no key needed) ──
  async function loadVisitCount() {
    const el = document.getElementById('visitCountNum');
    if (!el) return;

    // Increment per-device count in localStorage
    const localKey   = 'bay_temples_visits';
    const localCount = parseInt(localStorage.getItem(localKey) || '0', 10) + 1;
    localStorage.setItem(localKey, localCount);

    try {
      const r = await fetch(
        'https://api.countapi.xyz/hit/chaiprojects-hindu-temples/visits',
        { cache: 'no-store' }
      );
      if (r.ok) {
        const data = await r.json();
        el.textContent = formatCount(data.value);
        return;
      }
    } catch (_) { /* ignore */ }

    // Fallback: show local count
    el.textContent = formatCount(localCount);
    document.getElementById('visitCountLabel').textContent = 'visits from this device';
  }

  function formatCount(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return n.toLocaleString();
  }

  return { render, renderMiniInWidget, loadVisitCount, playBhajan, nextBhajan, closeMiniPlayer, _startPlayer };

})();
