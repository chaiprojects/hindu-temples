// ============================================================
// Daily Devotional Bhajan + Visit Counter
// Deity of the day (Sun–Sat) and site-wide visit counter
// ============================================================

window.DailyBhajan = (() => {

  // ── Day → Deity mapping (0 = Sunday … 6 = Saturday) ──────
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
      songTitle: 'Jai Jai Jai Suryadeva',
      videoId: 'opk44DquQ8A',
      ytSearch: 'surya+dev+aarti+jai+jai+suryadeva+bhajan'
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
      songTitle: 'Om Namah Shivaya',
      videoId: 'Ca4v0RI0kag',
      ytSearch: 'om+namah+shivaya+bhajan+anuradha+paudwal'
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
      videoId: 'o7fDt1OhDQQ',
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
      songTitle: 'Hare Krishna',
      videoId: 'h2sTcbGTw30',
      ytSearch: 'hare+krishna+bhajan+mantra'
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
      songTitle: 'Om Sai Ram',
      videoId: '2tC9F0XaIkI',
      ytSearch: 'om+sai+ram+bhajan+guruvaar+shirdi+sai+baba'
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
      songTitle: 'Jai Laxmi Mata',
      videoId: 'gK2jD5X6pzk',
      ytSearch: 'jai+laxmi+mata+aarti+anuradha+paudwal+lakshmi'
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
      songTitle: 'Shani Dev Chalisa',
      videoId: 'sLQiyA4H_qA',
      ytSearch: 'shani+dev+chalisa+aarti+bhajan'
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
    // Keep both selectors in case the full card is ever re-enabled.
    document.querySelectorAll('.rdm-play-btn, .bhajan-play-btn').forEach(btn => {
      btn.textContent = label;
      btn.setAttribute('aria-label', isPlaying ? 'Stop bhajan' : `Play ${d.songTitle}`);
    });
  }

  // ── In-page floating player ─────────────────────────────────
  function playBhajan() {
    const d = getTodaysDeity();
    const player  = document.getElementById('bhajanMiniPlayer');
    const iframe  = document.getElementById('bhajanYTIframe');
    const fallback = document.getElementById('bhajanFallbackLink');
    if (!player || !iframe) return;

    // Toggle behavior: clicking Play again stops playback.
    if (document.body.classList.contains('bhajan-playing')) {
      closeMiniPlayer();
      return;
    }

    // Update header info (small mini-bar only)
    const deityEl = document.getElementById('bhajanPlayerDeity');
    const titleEl = document.getElementById('bhajanPlayerTitle');
    if (deityEl) deityEl.textContent = `${d.emoji} ${d.deity}`;
    if (titleEl) titleEl.textContent  = d.songTitle;

    // Always provide a fallback link (works even if embeds are blocked).
    if (fallback) fallback.href = `https://www.youtube.com/watch?v=${d.videoId}`;

    // Show player in audio-only mode (no video area) so deity song plays as audio only.
    player.classList.add('audio-only');
    player.classList.add('show');

    // Use the direct video ID for reliable embedding. playsinline=1 helps on iOS.
    iframe.src = `https://www.youtube.com/embed/${d.videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`;

    document.body.classList.add('bhajan-playing');
    syncPlayButtons(true);
  }

  function closeMiniPlayer() {
    const player = document.getElementById('bhajanMiniPlayer');
    const iframe  = document.getElementById('bhajanYTIframe');
    if (player) {
      player.classList.remove('show');
      player.classList.remove('audio-only'); // reset for next open
    }
    document.body.classList.remove('bhajan-playing');
    // Stop playback & free resources
    if (iframe) iframe.src = '';
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

  return { render, renderMiniInWidget, loadVisitCount, playBhajan, closeMiniPlayer };

})();
