// ============================================================
// Daily Devotional Bhajan + Visit Counter
// Deity of the day (Sun–Sat) and site-wide visit counter
// ============================================================

window.DailyBhajan = (() => {

  // ── Day → Deity mapping (0 = Sunday … 6 = Saturday) ──────
  // Video IDs verified via YouTube oEmbed API, March 2026
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
        { t: 'Om Jai Surya Bhagwan (Anuradha Paudwal)', v: 'F9uURnkc8iA' },
        { t: 'Surya Aarti — Om Jai Surya Bhagwan',      v: 'Pj3IQy6KTCw' },
        { t: 'Ravivaar Special Surya Dev Aarti',        v: 'g-VsdrTmOTE' },
        { t: 'Surya Dev Aarti — Sunday Special',        v: 'OLui1rZ9ZG8' },
        { t: 'Ravivaar Bhakti — Surya Bhajans',         v: '939Vr48dVVw' }
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
        { t: 'Om Namah Shivaya Dhun',                    v: 'b4Tt5eglNE4' },
        { t: 'Shiv Dhun (Anuradha Paudwal)',             v: '3FcBh45t9Vs' },
        { t: 'Peaceful Om Namah Shivay Dhun',            v: 'C9dwTF1cTto' },
        { t: 'Om Namah Shivaya — Shiv Bhajan',           v: 'E1I_05xu-ro' },
        { t: 'Om Namah Shivay Dhoon (Hemant Chauhan)',   v: '4hiszMuQU4w' }
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
        { t: 'Hanuman Chalisa (Gulshan Kumar)',          v: 'AETFvQonfV8' },
        { t: 'Hanuman Chalisa (Hariharan)',              v: 'PlgIlN5gmQw' },
        { t: 'Sankat Mochan Hanuman Ashtak',             v: 'HH_a6aRO1TE' },
        { t: 'Hanuman Jayanti Bhajans',                  v: 'ASb9b3pHglU' },
        { t: 'Shree Hanuman Chalisa Bhajans',            v: 'A_B_1nwK5Zs' }
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
        { t: 'Achyutam Keshavam',                        v: 'pzzPowh241o' },
        { t: 'Hare Krishna Hare Rama — Maha Mantra',     v: 'Zdcth9NndEA' },
        { t: 'Hare Krishna Maha Mantra (Prabhupada)',    v: 'MNzH-emA3Sk' },
        { t: 'Achyutam Keshavam (Ankit Batra)',          v: 'gvu891ubYWE' },
        { t: 'Achyutam Keshavam — Krishna Bhajan',       v: 'qPFGGpGbZEs' }
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
        { t: 'Om Sai Ram Dhun',                          v: '8NQKfBx2OYQ' },
        { t: 'Om Sai Ram — Full Song',                   v: 'SvLVru_Tnlo' },
        { t: 'Om Sai Ram, Om Sai Shyam (Suresh Wadkar)', v: '-h5__qZMWEs' },
        { t: 'Hey Sai Ram (Suresh Wadkar)',              v: 'hzAmIj2Nwv4' },
        { t: 'Jai Jai Sai Ram',                          v: 'xjbi3YbWneI' }
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
        { t: 'Lakshmi Aarti (Anuradha Paudwal)',         v: 'SyqgAt-T0iQ' },
        { t: 'Lakshmi Ji Ki Aarti',                      v: 'AeSXsYxgeVI' },
        { t: 'Om Jai Lakshmi Mata',                      v: '0J1aNK16sFM' },
        { t: 'Om Jai Lakshmi Mata (Sonu Nigam)',         v: 'n8IlWgH0iP8' },
        { t: 'Lakshmi Aarti for Wealth & Prosperity',    v: '0D3VbBoJBrM' }
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
        { t: 'Shani Chalisa',                            v: 'MJ14wONWjWg' },
        { t: 'Shani Mantra 108 Times (Anuradha Paudwal)',v: 'KnMWL5jVx3s' },
        { t: 'Jai Jai Shani Dev Aarti',                  v: '42fouuhg9Pw' },
        { t: 'Shani Chalisa, Stuti & Aarti',             v: 'HAIrrpAYbK0' },
        { t: 'Jai Shani Dev — Shani Aarti',              v: 'tcQMwShHwI8' }
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

  // ── Auto-start today's bhajan on every page load ────────────
  // Starts muted (browser autoplay rules allow that), then tries to
  // unmute; if the browser blocks it, the Unmute chip appears.
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
      if (!document.body.classList.contains('bhajan-playing')) playBhajan();
    }, 800);
  });

  return { render, renderMiniInWidget, loadVisitCount, playBhajan, closeMiniPlayer, _startPlayer };

})();
