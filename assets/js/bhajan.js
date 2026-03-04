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
      songTitle: 'Om Jai Surya Bhagwan',
      videoId: 'F9uURnkc8iA',
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
      songTitle: 'Om Namah Shivaya Dhun',
      videoId: 'b4Tt5eglNE4',
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
      songTitle: 'Hanuman Chalisa',
      videoId: 'AETFvQonfV8',
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
      songTitle: 'Achyutam Keshavam',
      videoId: 'pzzPowh241o',
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
      songTitle: 'Om Sai Ram Dhun',
      videoId: '8NQKfBx2OYQ',
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
      songTitle: 'Lakshmi Aarti',
      videoId: 'SyqgAt-T0iQ',
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
      songTitle: 'Shani Chalisa',
      videoId: 'MJ14wONWjWg',
      ytSearch: 'shani+dev+chalisa+bhajan'
    }
  ];

  function getTodaysDeity() {
    return DEITIES[new Date().getDay()];
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
            <div class="bhajan-song-bar-title">${d.songTitle}</div>
            <div class="bhajan-song-bar-hint">Plays here · YouTube</div>
          </div>
          <button class="bhajan-play-btn"
                  onclick="window.DailyBhajan.playBhajan()"
                  aria-label="Play ${d.songTitle}">
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
    el.innerHTML = `
      <div class="rahu-deity-mini" style="--accent:${d.accentColor}">
        <span class="rdm-emoji">${d.emoji}</span>
        <div class="rdm-body">
          <div class="rdm-deity">${d.deity}</div>
          <div class="rdm-mantra">${d.mantra}</div>
        </div>
        <button class="rdm-play-btn"
                onclick="window.DailyBhajan.playBhajan()"
                aria-label="Play ${d.songTitle}">
          ▶ Play
        </button>
      </div>
    `;
  }

  function syncPlayButtons(isPlaying) {
    const d = getTodaysDeity();
    const label = isPlaying ? '⏹ Stop' : '▶ Play';
    document.querySelectorAll('.rdm-play-btn, .bhajan-play-btn').forEach(btn => {
      btn.textContent = label;
      btn.classList.remove('loading');
      btn.disabled = false;
      btn.setAttribute('aria-label', isPlaying ? 'Stop bhajan' : `Play ${d.songTitle}`);
    });
  }

  // ── In-page floating player (simple iframe — no YT API, no popups) ──

  function playBhajan() {
    // Toggle: if already playing, stop
    if (document.body.classList.contains('bhajan-playing')) {
      closeMiniPlayer();
      return;
    }

    const d = getTodaysDeity();
    _startPlayer(d.videoId, `${d.emoji} ${d.deity}`, d.songTitle);
  }

  /**
   * Shared player: creates a visible YouTube iframe inside the floating bar.
   * Works on iOS because the iframe is visible and user-gesture-triggered.
   */
  function _startPlayer(videoId, deityLabel, songTitle) {
    const container = document.getElementById('bhajanMiniPlayer');
    const fallback  = document.getElementById('bhajanFallbackLink');
    if (!container) return;

    // Update header info
    const deityEl = document.getElementById('bhajanPlayerDeity');
    const titleEl = document.getElementById('bhajanPlayerTitle');
    if (deityEl) deityEl.textContent = deityLabel;
    if (titleEl) titleEl.textContent = songTitle;
    if (fallback) fallback.href = `https://www.youtube.com/watch?v=${videoId}`;

    // Move frame wrapper inside the bar as a small thumbnail
    const wrap = container.querySelector('.bmp-frame-wrap');
    const bar = container.querySelector('.bmp-bar');
    if (bar && wrap.parentNode !== bar) {
      bar.insertBefore(wrap, bar.firstChild);
    }

    // Create a plain iframe — no API, no popups, just embed + autoplay
    wrap.innerHTML = `<iframe
      src="https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&rel=0&modestbranding=1"
      allow="autoplay; encrypted-media"
      allowfullscreen
      frameborder="0"
      title="${songTitle}"
      style="width:64px;height:48px;border:none;">
    </iframe>`;

    // Show the bar
    container.classList.add('show', 'audio-only');
    document.body.classList.add('bhajan-playing');
    syncPlayButtons(true);
  }

  function closeMiniPlayer() {
    const container = document.getElementById('bhajanMiniPlayer');
    if (container) {
      container.classList.remove('show', 'audio-only');
      // Move frame wrapper back and clear iframe
      const wrap = container.querySelector('.bmp-frame-wrap');
      const bar = container.querySelector('.bmp-bar');
      if (wrap && bar && wrap.parentNode === bar) {
        container.appendChild(wrap);
      }
      if (wrap) wrap.innerHTML = '';
    }
    document.body.classList.remove('bhajan-playing');
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

  return { render, renderMiniInWidget, loadVisitCount, playBhajan, closeMiniPlayer, _startPlayer };

})();
