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
      videoId: 'IxQzVoMd-rg',
      songTitle: 'Jai Jai Jai Suryadeva',
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
      videoId: 'NfhqUFWtjzA',
      songTitle: 'Om Namah Shivaya',
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
      videoId: 'AETFvQonfV8',
      songTitle: 'Hanuman Chalisa',
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
      videoId: 'dOT_w4gJAUM',
      songTitle: 'Achyutam Keshavam',
      ytSearch: 'achyutam+keshavam+krishna+damodaram+bhajan'
    },
    { // 4 – Thursday
      day: 'Thursday',
      deity: 'Lord Vishnu & Brihaspati',
      hindiName: 'भगवान विष्णु & बृहस्पति',
      emoji: '🪷',
      mantra: 'Om Namo Bhagavate Vasudevaya',
      mantraHi: 'ॐ नमो भगवते वासुदेवाय',
      blessing: 'Offer yellow flowers & bananas for prosperity & wisdom',
      accentColor: '#059669',
      videoId: 'kfejnJzZ_6s',
      songTitle: 'Om Namo Bhagavate Vasudevaya',
      ytSearch: 'om+namo+bhagavate+vasudevaya+vishnu+bhajan'
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
      videoId: 'SjjMJe4UNio',
      songTitle: 'Jai Laxmi Mata Aarti',
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
      videoId: 'sXZ5v7QLzIk',
      songTitle: 'Shani Dev Chalisa',
      ytSearch: 'shani+dev+chalisa+aarti+bhajan'
    }
  ];

  function getTodaysDeity() {
    return DEITIES[new Date().getDay()];
  }

  // ── Render the daily devotional card ──────────────────────
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

        <!-- Song / play area -->
        <div class="bhajan-player-area" id="bhajanPlayerArea">
          <div class="bhajan-thumb-wrap" id="bhajanThumbWrap">
            <img
              src="https://img.youtube.com/vi/${d.videoId}/hqdefault.jpg"
              alt="${d.songTitle}"
              class="bhajan-thumb-img"
              onerror="this.style.display='none';document.getElementById('bhajanThumbFallback').style.display='flex'"
            />
            <!-- Fallback if YouTube thumbnail 404s -->
            <div class="bhajan-thumb-fallback" id="bhajanThumbFallback" style="display:none">
              <span class="bhajan-fb-emoji">${d.emoji}</span>
            </div>
            <!-- Click-to-play overlay -->
            <button class="bhajan-play-overlay" onclick="window.DailyBhajan.loadPlayer()" aria-label="Play ${d.songTitle}">
              <div class="bhajan-play-circle">▶</div>
              <div class="bhajan-song-meta">
                <div class="bhajan-song-name">${d.songTitle}</div>
                <div class="bhajan-tap-hint">Tap to play</div>
              </div>
            </button>
          </div>
        </div>

        <!-- YouTube link -->
        <a class="bhajan-yt-link"
           href="https://www.youtube.com/results?search_query=${d.ytSearch}"
           target="_blank" rel="noopener noreferrer">
          Search on YouTube ↗
        </a>

      </div>
    `;
  }

  // ── Swap thumbnail for live YouTube embed ─────────────────
  function loadPlayer() {
    const d = getTodaysDeity();
    const area = document.getElementById('bhajanPlayerArea');
    if (!area) return;
    area.innerHTML = `
      <iframe
        class="bhajan-iframe"
        src="https://www.youtube-nocookie.com/embed/${d.videoId}?autoplay=1&rel=0&modestbranding=1&color=white"
        title="${d.songTitle}"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowfullscreen
      ></iframe>
    `;
  }

  // ── Visit Counter via countapi.xyz (free, no key needed) ──
  async function loadVisitCount() {
    const el = document.getElementById('visitCountNum');
    if (!el) return;

    // Increment visit in localStorage (per-device)
    const localKey = 'bay_temples_visits';
    const localCount = parseInt(localStorage.getItem(localKey) || '0', 10) + 1;
    localStorage.setItem(localKey, localCount);

    try {
      // Try free global counter
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

  return { render, loadPlayer, loadVisitCount };

})();
