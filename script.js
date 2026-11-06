/**
 * ============================================================
 * PRIYAM FATAKA SHOP - PREMIUM DIWALI SPIN & WIN ENGINE
 * Pure Vanilla JavaScript (No frameworks, 100% self-contained)
 * ============================================================
 */

(function () {
  'use strict';

  // --- DEFAULT PRIZES LIST (14 Sections as requested) ---
  const DEFAULT_PRIZES = [
    { id: 1, name: 'Shaktimaan Bomb', type: 'Actual Prize', icon: '💣', weight: 8, bg: '#d91c3d', color: '#ffffff', enabled: true },
    { id: 2, name: 'Anar', type: 'Actual Prize', icon: '✨', weight: 9, bg: '#7928ca', color: '#ffffff', enabled: true },
    { id: 3, name: 'Chakri', type: 'Actual Prize', icon: '🌀', weight: 10, bg: '#0070f3', color: '#ffffff', enabled: true },
    { id: 4, name: 'Rocket', type: 'Actual Prize', icon: '🚀', weight: 9, bg: '#00c853', color: '#ffffff', enabled: true },
    { id: 5, name: 'Murga Bomb', type: 'Actual Prize', icon: '💥', weight: 11, bg: '#ff5722', color: '#ffffff', enabled: true },
    { id: 6, name: '20% Discount', type: 'Discount', icon: '🏷️', weight: 8, bg: '#e67e22', color: '#ffffff', enabled: true },
    { id: 7, name: '15% Discount', type: 'Discount', icon: '🎟️', weight: 10, bg: '#8e44ad', color: '#ffffff', enabled: true },
    { id: 8, name: '10% Discount', type: 'Discount', icon: '🔖', weight: 14, bg: '#2980b9', color: '#ffffff', enabled: true },
    { id: 9, name: '5% Discount', type: 'Discount', icon: '🧧', weight: 18, bg: '#27ae60', color: '#ffffff', enabled: true },
    { id: 10, name: 'Win 50 Shot', type: 'Promo Cracker', icon: '🎆', weight: 2, bg: '#c0392b', color: '#ffffff', enabled: true },
    { id: 11, name: 'Win 12 Shot', type: 'Promo Cracker', icon: '🎇', weight: 4, bg: '#d35400', color: '#ffffff', enabled: true },
    { id: 12, name: '0 Bill', type: 'Mega Jackpot', icon: '👑', weight: 1, bg: '#f39c12', color: '#1a1002', enabled: true },
    { id: 13, name: '50% OFF', type: 'Mega Discount', icon: '🔥', weight: 2, bg: '#b71540', color: '#ffffff', enabled: true },
    { id: 14, name: '90% Discount', type: 'Bumper Win', icon: '⚡', weight: 1, bg: '#6c5ce7', color: '#ffffff', enabled: true }
  ];

  // --- STATE MANAGEMENT ---
  const STORAGE_KEYS = {
    PRIZES: 'pfs_prizes_v2',
    HISTORY: 'pfs_spin_history_v2',
    TOTAL_SPINS: 'pfs_total_spins_v2',
    SOUND_FX: 'pfs_sound_fx_v2',
    BGM: 'pfs_bgm_v2',
    STORE_NAME: 'pfs_store_name_v2',
    SPIN_DURATION: 'pfs_spin_duration_v2'
  };

  let prizes = loadPrizes();
  let spinHistory = loadHistory();
  let totalSpins = parseInt(localStorage.getItem(STORAGE_KEYS.TOTAL_SPINS) || '0', 10);
  let soundEnabled = localStorage.getItem(STORAGE_KEYS.SOUND_FX) !== 'false';
  let bgmEnabled = localStorage.getItem(STORAGE_KEYS.BGM) === 'true';
  let storeName = localStorage.getItem(STORAGE_KEYS.STORE_NAME) || 'Priyam Fataka Shop';
  let spinDuration = parseInt(localStorage.getItem(STORAGE_KEYS.SPIN_DURATION) || '6000', 10);

  let isSpinning = false;
  let currentRotation = 0; // Current canvas rotation angle in radians
  let lastPassedPegIndex = -1;

  // --- DOM ELEMENTS ---
  const wheelCanvas = document.getElementById('wheelCanvas');
  const wheelCtx = wheelCanvas.getContext('2d');
  const bulbContainer = document.getElementById('bulbContainer');
  const wheelPointer = document.getElementById('wheelPointer');
  const spinBtn = document.getElementById('spinBtn');
  const quickSpinBtn = document.getElementById('quickSpinBtn');
  const totalSpinsCountEl = document.getElementById('totalSpinsCount');
  const activePrizesCountEl = document.getElementById('activePrizesCount');
  const recentWinnersList = document.getElementById('recentWinnersList');

  // Audio Controls
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const musicToggleBtn = document.getElementById('musicToggleBtn');

  // Winner Modal Elements
  const winnerModal = document.getElementById('winnerModal');
  const modalPrizeEmoji = document.getElementById('modalPrizeEmoji');
  const modalPrizeName = document.getElementById('modalPrizeName');
  const modalPrizeTag = document.getElementById('modalPrizeTag');
  const modalVoucherCode = document.getElementById('modalVoucherCode');
  const copyCodeBtn = document.getElementById('copyCodeBtn');
  const playAgainBtn = document.getElementById('playAgainBtn');
  const closeModalBtn = document.getElementById('closeModalBtn');

  // Admin Modal Elements
  const adminBtn = document.getElementById('adminBtn');
  const adminModal = document.getElementById('adminModal');
  const closeAdminBtn = document.getElementById('closeAdminBtn');
  const adminPrizesTableBody = document.getElementById('adminPrizesTableBody');
  const totalWeightDisplay = document.getElementById('totalWeightDisplay');
  const activeSlicesCountEl = document.getElementById('activeSlicesCount');
  const savePrizesBtn = document.getElementById('savePrizesBtn');
  const resetDefaultsBtn = document.getElementById('resetDefaultsBtn');
  const adminHistoryTableBody = document.getElementById('adminHistoryTableBody');
  const exportCsvBtn = document.getElementById('exportCsvBtn');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const configStoreName = document.getElementById('configStoreName');
  const saveStoreNameBtn = document.getElementById('saveStoreNameBtn');
  const configSpinDuration = document.getElementById('configSpinDuration');

  // Canvases
  const fireworksCanvas = document.getElementById('fireworksCanvas');
  const confettiCanvas = document.getElementById('confettiCanvas');

  // --- AUDIO SYNTHESIZER (Web Audio API) ---
  // Completely self-contained: no external files or MP3 dependencies!
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  const SoundFX = {
    // Peg ratchet tick sound when wheel passes divider
    tick: function () {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(650, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 0.045);

        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.045);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {
        // Audio error suppression
      }
    },

    // Whoosh launch sound at spin start
    swoosh: function () {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        const bufferSize = ctx.sampleRate * 0.4;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(300, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(2200, ctx.currentTime + 0.25);
        filter.Q.value = 3.0;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.01, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start();
      } catch (e) {}
    },

    // Celebratory victory fanfare chord sequence
    fanfare: function () {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
          setTimeout(() => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, ctx.currentTime);

            gain.gain.setValueAtTime(0.35, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.start();
            osc.stop(ctx.currentTime + 0.85);
          }, idx * 110);
        });
      } catch (e) {}
    },

    // Soft UI Click
    click: function () {
      if (!soundEnabled) return;
      try {
        const ctx = getAudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      } catch (e) {}
    }
  };

  // --- FESTIVE AMBIENT MUSIC ENGINE (Web Audio API Synthesizer) ---
  let bgmInterval = null;
  let bgmStep = 0;
  // Diwali Raag Bhupali festive scale notes: C4, D4, E4, G4, A4, C5
  const ragNotes = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
  const ragPattern = [0, 2, 3, 4, 5, 4, 3, 2, 0, 3, 2, 4, 3, 5, 4, 2];

  function startBgm() {
    stopBgm();
    const ctx = getAudioContext();
    bgmInterval = setInterval(() => {
      if (!bgmEnabled) return;
      try {
        const noteIdx = ragPattern[bgmStep % ragPattern.length];
        const freq = ragNotes[noteIdx];
        bgmStep++;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.38);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } catch (e) {}
    }, 400);
  }

  function stopBgm() {
    if (bgmInterval) {
      clearInterval(bgmInterval);
      bgmInterval = null;
    }
  }

  // --- PERSISTENCE HELPERS ---
  function loadPrizes() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRIZES);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return JSON.parse(JSON.stringify(DEFAULT_PRIZES));
  }

  function savePrizes(data) {
    prizes = data;
    localStorage.setItem(STORAGE_KEYS.PRIZES, JSON.stringify(prizes));
  }

  function loadHistory() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  }

  function saveHistory(item) {
    spinHistory.unshift(item);
    if (spinHistory.length > 100) spinHistory.pop();
    localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(spinHistory));
    renderRecentWinners();
    renderAdminHistory();
  }

  function getActivePrizes() {
    return prizes.filter(p => p.enabled && p.weight > 0);
  }

  // --- WHEEL RENDERING ENGINE (HIGH-DPI CANVAS) ---
  function drawWheel(rotation = 0) {
    const active = getActivePrizes();
    if (active.length === 0) return;

    const width = wheelCanvas.width;
    const height = wheelCanvas.height;
    const cx = width / 2;
    const cy = height / 2;
    const radius = cx - 20;

    wheelCtx.clearRect(0, 0, width, height);
    wheelCtx.save();
    wheelCtx.translate(cx, cy);
    wheelCtx.rotate(rotation);

    const numSlices = active.length;
    const sliceAngle = (2 * Math.PI) / numSlices;

    // 1. Draw Sector Slices
    for (let i = 0; i < numSlices; i++) {
      const item = active[i];
      const startAngle = i * sliceAngle;
      const endAngle = (i + 1) * sliceAngle;

      wheelCtx.beginPath();
      wheelCtx.moveTo(0, 0);
      wheelCtx.arc(0, 0, radius, startAngle, endAngle);
      wheelCtx.closePath();

      // Sector background
      wheelCtx.fillStyle = item.bg;
      wheelCtx.fill();

      // Golden sector dividing line
      wheelCtx.lineWidth = 3;
      wheelCtx.strokeStyle = '#ffd875';
      wheelCtx.stroke();

      // Subtle sector radial gradient overlay for depth
      const grad = wheelCtx.createRadialGradient(0, 0, 50, 0, 0, radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.2)');
      grad.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0.45)');
      wheelCtx.fillStyle = grad;
      wheelCtx.fill();

      // 2. Draw Text and Emojis within the Slice
      wheelCtx.save();
      const textAngle = startAngle + sliceAngle / 2;
      wheelCtx.rotate(textAngle);
      wheelCtx.textAlign = 'right';
      wheelCtx.textBaseline = 'middle';

      // Prize Name
      wheelCtx.fillStyle = item.color || '#ffffff';
      wheelCtx.font = `bold ${numSlices > 12 ? '21px' : '24px'} 'Poppins', sans-serif`;
      wheelCtx.shadowColor = 'rgba(0, 0, 0, 0.9)';
      wheelCtx.shadowBlur = 6;
      wheelCtx.shadowOffsetX = 1;
      wheelCtx.shadowOffsetY = 1;

      // Draw text positioned neatly between outer rim and hub
      const textX = radius - 45;
      wheelCtx.fillText(item.name, textX, 0);

      // Prize Icon / Emoji
      wheelCtx.font = `${numSlices > 12 ? '26px' : '30px'} 'Segoe UI Emoji', sans-serif`;
      wheelCtx.fillText(item.icon, textX - wheelCtx.measureText(item.name).width - 15, 0);

      wheelCtx.restore();

      // 3. Draw Outer Casino Divider Pegs
      const pegAngle = startAngle;
      const pegDistance = radius - 8;
      const pegX = Math.cos(pegAngle) * pegDistance;
      const pegY = Math.sin(pegAngle) * pegDistance;

      wheelCtx.beginPath();
      wheelCtx.arc(pegX, pegY, 5, 0, 2 * Math.PI);
      wheelCtx.fillStyle = '#ffffff';
      wheelCtx.shadowColor = '#ffd875';
      wheelCtx.shadowBlur = 8;
      wheelCtx.fill();
      wheelCtx.lineWidth = 2;
      wheelCtx.strokeStyle = '#df9e1a';
      wheelCtx.stroke();
    }

    // Outer wheel border ring
    wheelCtx.beginPath();
    wheelCtx.arc(0, 0, radius, 0, 2 * Math.PI);
    wheelCtx.lineWidth = 10;
    wheelCtx.strokeStyle = '#ffd875';
    wheelCtx.stroke();

    wheelCtx.restore();
  }

  // --- CASINO MARQUEE LIGHT BULBS ---
  function setupMarqueeBulbs() {
    bulbContainer.innerHTML = '';
    const bulbCount = 36;
    const rPercent = 48; // Percentage from center to perimeter

    for (let i = 0; i < bulbCount; i++) {
      const bulb = document.createElement('div');
      bulb.className = 'casino-bulb';
      const angle = (i / bulbCount) * 2 * Math.PI;
      const left = 50 + rPercent * Math.cos(angle);
      const top = 50 + rPercent * Math.sin(angle);
      bulb.style.left = `${left}%`;
      bulb.style.top = `${top}%`;
      bulbContainer.appendChild(bulb);
    }

    animateBulbs();
  }

  let bulbStep = 0;
  function animateBulbs() {
    const bulbs = bulbContainer.querySelectorAll('.casino-bulb');
    if (!bulbs.length) return;

    setInterval(() => {
      bulbStep++;
      bulbs.forEach((bulb, i) => {
        bulb.classList.remove('active-1', 'active-2');
        if ((i + bulbStep) % 3 === 0) {
          bulb.classList.add('active-1');
        } else if ((i + bulbStep) % 3 === 1) {
          bulb.classList.add('active-2');
        }
      });
    }, 250);
  }

  // --- PROBABILISTIC SELECTION LOGIC ---
  /**
   * Selects a prize index using mathematically certified weighted random choice.
   * Probability of winning prize i = weight_i / total_active_weights
   */
  function pickWinningPrize(activeList) {
    const totalWeight = activeList.reduce((sum, item) => sum + Number(item.weight), 0);
    if (totalWeight <= 0) return 0;

    let rand = Math.random() * totalWeight;
    for (let i = 0; i < activeList.length; i++) {
      if (rand < activeList[i].weight) {
        return i;
      }
      rand -= activeList[i].weight;
    }
    return 0;
  }

  // --- SPIN LOGIC & MATHEMATICAL ACCURACY ---
  /**
   * Mathematical alignment:
   * Pointer is fixed at top center (12 o'clock), which corresponds to angle 1.5 * PI (270 degrees).
   * Slice i covers initial angle range [i * sliceAngle, (i+1) * sliceAngle].
   * Midpoint angle: mid = (i + 0.5) * sliceAngle.
   * When wheel rotates clockwise by angle R, slice i will be positioned under the pointer if:
   * (mid + R) % 2PI == 1.5 * PI
   * => R_final % 2PI = (1.5 * PI - mid) % 2PI.
   */
  function startSpin() {
    if (isSpinning) return;

    const active = getActivePrizes();
    if (active.length === 0) {
      alert('All prizes are currently disabled or have 0 weight! Please enable prizes in Owner Settings.');
      return;
    }

    isSpinning = true;
    spinBtn.classList.add('disabled');
    quickSpinBtn.disabled = true;

    // Pick genuine winner based on weights
    const winningIndex = pickWinningPrize(active);
    const wonPrize = active[winningIndex];

    const numSlices = active.length;
    const sliceAngle = (2 * Math.PI) / numSlices;
    const sliceMidAngle = (winningIndex + 0.5) * sliceAngle;

    // Small random offset within 60% of the slice for natural look
    const jitter = (Math.random() - 0.5) * (sliceAngle * 0.6);
    const targetSliceAngle = sliceMidAngle + jitter;

    // Pointer angle at top (12 o'clock)
    const pointerAngle = 1.5 * Math.PI;

    // Calculate required delta rotation modulo 2*PI
    let desiredRestAngle = (pointerAngle - targetSliceAngle) % (2 * Math.PI);
    if (desiredRestAngle < 0) desiredRestAngle += 2 * Math.PI;

    // Add 8 to 12 full revolutions for dramatic tension
    const fullSpins = (8 + Math.floor(Math.random() * 4)) * (2 * Math.PI);

    // Current canvas angle modulo 2*PI
    const currentNorm = currentRotation % (2 * Math.PI);
    let rotationNeeded = desiredRestAngle - currentNorm;
    if (rotationNeeded < 0) rotationNeeded += 2 * Math.PI;

    const totalRotationToAdd = fullSpins + rotationNeeded;
    const startAngle = currentRotation;
    const targetRotation = startAngle + totalRotationToAdd;

    SoundFX.swoosh();

    const startTime = performance.now();
    const duration = spinDuration; // e.g. 6000ms

    // Cubic-bezier deceleration physics curve (easeOutCubic/Quint)
    function easeOutQuint(t) {
      return 1 - Math.pow(1 - t, 5);
    }

    lastPassedPegIndex = -1;

    function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuint(progress);

      currentRotation = startAngle + totalRotationToAdd * easedProgress;
      drawWheel(currentRotation);

      // Check pegs passing pointer to trigger tick sound and pointer wobble
      const effectiveAngle = (pointerAngle - currentRotation) % (2 * Math.PI);
      const normalizedEffective = effectiveAngle < 0 ? effectiveAngle + 2 * Math.PI : effectiveAngle;
      const currentPegIndex = Math.floor(normalizedEffective / sliceAngle);

      if (currentPegIndex !== lastPassedPegIndex) {
        lastPassedPegIndex = currentPegIndex;
        SoundFX.tick();
        wheelPointer.classList.add('tick');
        setTimeout(() => wheelPointer.classList.remove('tick'), 60);
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Spin Complete!
        currentRotation = targetRotation;
        drawWheel(currentRotation);
        isSpinning = false;
        spinBtn.classList.remove('disabled');
        quickSpinBtn.disabled = false;

        onSpinComplete(wonPrize);
      }
    }

    requestAnimationFrame(animate);
  }

  // --- VOUCHER & WINNER MODAL CELEBRATION ---
  function generateVoucherCode(prizeName) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'PFS-';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const cleanName = prizeName.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 4);
    return `${code}-${cleanName}`;
  }

  function onSpinComplete(prize) {
    // 1. Update stats & history
    totalSpins++;
    localStorage.setItem(STORAGE_KEYS.TOTAL_SPINS, totalSpins.toString());
    totalSpinsCountEl.textContent = totalSpins;

    const voucherCode = generateVoucherCode(prize.name);
    const record = {
      id: Date.now(),
      prize: prize.name,
      icon: prize.icon,
      type: prize.type,
      code: voucherCode,
      timestamp: new Date().toLocaleString()
    };
    saveHistory(record);

    // 2. Play Sound Fanfare
    SoundFX.fanfare();

    // 3. Launch Fireworks & Confetti
    triggerCelebrationBurst();

    // 4. Fill Modal Details
    modalPrizeEmoji.textContent = prize.icon;
    modalPrizeName.textContent = prize.name;
    modalPrizeTag.textContent = prize.type;
    modalVoucherCode.textContent = voucherCode;

    // 5. Open Modal
    winnerModal.classList.add('open');
  }

  // --- RECENT WINNERS LIST UI ---
  function renderRecentWinners() {
    if (!recentWinnersList) return;
    recentWinnersList.innerHTML = '';

    const displayList = spinHistory.slice(0, 6);
    if (displayList.length === 0) {
      recentWinnersList.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 20px;">
          No lucky winners yet! Be the first one to spin and win exciting Diwali prizes!
        </div>
      `;
      return;
    }

    displayList.forEach(item => {
      const card = document.createElement('div');
      card.className = 'winner-card';
      card.innerHTML = `
        <div class="wc-icon">${item.icon || '🎁'}</div>
        <div class="wc-info">
          <div class="wc-prize">${item.prize}</div>
          <div class="wc-sub">
            <span class="wc-code">${item.code}</span>
            <span>${item.timestamp.split(',')[1] || 'Just now'}</span>
          </div>
        </div>
      `;
      recentWinnersList.appendChild(card);
    });
  }

  // --- ADMIN PANEL LOGIC ---
  function renderAdminPrizesTable() {
    adminPrizesTableBody.innerHTML = '';
    const totalWeight = prizes.reduce((sum, p) => p.enabled ? sum + Number(p.weight) : sum, 0);

    totalWeightDisplay.textContent = totalWeight;
    activeSlicesCountEl.textContent = prizes.filter(p => p.enabled && p.weight > 0).length;

    prizes.forEach((prize, idx) => {
      const winChance = (prize.enabled && totalWeight > 0)
        ? ((prize.weight / totalWeight) * 100).toFixed(1)
        : '0.0';

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td style="text-align: center;">
          <input type="checkbox" class="admin-enable-chk" data-idx="${idx}" ${prize.enabled ? 'checked' : ''}>
        </td>
        <td style="text-align: center; font-size: 1.3rem;">
          <input type="text" class="admin-icon-input" data-idx="${idx}" value="${prize.icon}" style="width: 44px; text-align: center;">
        </td>
        <td>
          <input type="text" class="admin-name-input" data-idx="${idx}" value="${prize.name}">
        </td>
        <td>
          <div class="weight-cell">
            <input type="range" class="admin-weight-range" data-idx="${idx}" min="0" max="100" value="${prize.weight}" ${prize.enabled ? '' : 'disabled'}>
            <input type="number" class="admin-weight-num" data-idx="${idx}" min="0" max="500" value="${prize.weight}" ${prize.enabled ? '' : 'disabled'}>
          </div>
        </td>
        <td>
          <span class="chance-badge ${prize.enabled && prize.weight > 0 ? '' : 'zero'}">
            ${winChance}%
          </span>
        </td>
        <td>
          <input type="text" class="admin-type-input" data-idx="${idx}" value="${prize.type}">
        </td>
      `;
      adminPrizesTableBody.appendChild(tr);
    });

    attachAdminRowListeners();
  }

  function attachAdminRowListeners() {
    // Enable/Disable toggles
    adminPrizesTableBody.querySelectorAll('.admin-enable-chk').forEach(chk => {
      chk.addEventListener('change', function () {
        const idx = this.dataset.idx;
        prizes[idx].enabled = this.checked;
        renderAdminPrizesTable();
      });
    });

    // Weight range and number sync
    adminPrizesTableBody.querySelectorAll('.admin-weight-range').forEach(range => {
      range.addEventListener('input', function () {
        const idx = this.dataset.idx;
        const numInput = adminPrizesTableBody.querySelector(`.admin-weight-num[data-idx="${idx}"]`);
        numInput.value = this.value;
        prizes[idx].weight = Number(this.value);
        updateLiveChances();
      });
    });

    adminPrizesTableBody.querySelectorAll('.admin-weight-num').forEach(num => {
      num.addEventListener('input', function () {
        const idx = this.dataset.idx;
        const rangeInput = adminPrizesTableBody.querySelector(`.admin-weight-range[data-idx="${idx}"]`);
        rangeInput.value = this.value;
        prizes[idx].weight = Math.max(0, Number(this.value));
        updateLiveChances();
      });
    });

    // Name edits
    adminPrizesTableBody.querySelectorAll('.admin-name-input').forEach(input => {
      input.addEventListener('change', function () {
        const idx = this.dataset.idx;
        prizes[idx].name = this.value.trim() || 'Prize';
      });
    });

    // Icon edits
    adminPrizesTableBody.querySelectorAll('.admin-icon-input').forEach(input => {
      input.addEventListener('change', function () {
        const idx = this.dataset.idx;
        prizes[idx].icon = this.value.trim() || '🎁';
      });
    });

    // Type edits
    adminPrizesTableBody.querySelectorAll('.admin-type-input').forEach(input => {
      input.addEventListener('change', function () {
        const idx = this.dataset.idx;
        prizes[idx].type = this.value.trim() || 'Diwali Gift';
      });
    });
  }

  function updateLiveChances() {
    const totalWeight = prizes.reduce((sum, p) => p.enabled ? sum + Number(p.weight) : sum, 0);
    totalWeightDisplay.textContent = totalWeight;
    activeSlicesCountEl.textContent = prizes.filter(p => p.enabled && p.weight > 0).length;

    adminPrizesTableBody.querySelectorAll('tr').forEach((tr, idx) => {
      const prize = prizes[idx];
      const badge = tr.querySelector('.chance-badge');
      if (prize && badge) {
        const chance = (prize.enabled && totalWeight > 0)
          ? ((prize.weight / totalWeight) * 100).toFixed(1)
          : '0.0';
        badge.textContent = `${chance}%`;
        if (prize.enabled && prize.weight > 0) {
          badge.classList.remove('zero');
        } else {
          badge.classList.add('zero');
        }
      }
    });
  }

  function renderAdminHistory() {
    adminHistoryTableBody.innerHTML = '';
    if (spinHistory.length === 0) {
      adminHistoryTableBody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; color: #94a3b8; padding: 20px;">
            No spin records logged yet.
          </td>
        </tr>
      `;
      return;
    }

    spinHistory.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${spinHistory.length - idx}</td>
        <td>${item.timestamp}</td>
        <td>${item.icon || ''} <strong>${item.prize}</strong></td>
        <td><code style="color: #ffd875;">${item.code}</code></td>
      `;
      adminHistoryTableBody.appendChild(tr);
    });
  }

  // --- BACKGROUND FIREWORKS ENGINE ---
  let fwCtx = null;
  let fireworksParticles = [];
  let fireworksRockets = [];
  let continuousFireworks = true;

  function initFireworksCanvas() {
    fwCtx = fireworksCanvas.getContext('2d');
    function resize() {
      fireworksCanvas.width = window.innerWidth;
      fireworksCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
    loopFireworks();

    // Click anywhere on screen to launch firework!
    window.addEventListener('pointerdown', (e) => {
      // Don't launch on interactive controls
      if (e.target.closest('button, input, table, .admin-modal-card, .winner-modal-card')) return;
      launchRocket(e.clientX, e.clientY);
    });
  }

  function launchRocket(targetX, targetY) {
    const startX = window.innerWidth / 2 + (Math.random() - 0.5) * (window.innerWidth * 0.6);
    const startY = window.innerHeight;
    fireworksRockets.push({
      x: startX,
      y: startY,
      targetX: targetX || (window.innerWidth * 0.15 + Math.random() * window.innerWidth * 0.7),
      targetY: targetY || (window.innerHeight * 0.1 + Math.random() * window.innerHeight * 0.4),
      speed: 12 + Math.random() * 6,
      angle: Math.atan2((targetY || window.innerHeight * 0.25) - startY, (targetX || window.innerWidth / 2) - startX),
      color: ['#ff5722', '#ffd875', '#00dfd8', '#ff4081', '#00c853'][Math.floor(Math.random() * 5)]
    });
  }

  function createFireworkExplosion(x, y, baseColor) {
    const particleCount = 45;
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * 2 * Math.PI + Math.random() * 0.2;
      const speed = 2 + Math.random() * 6;
      fireworksParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        decay: 0.015 + Math.random() * 0.02,
        color: baseColor || '#ffd875',
        size: 2 + Math.random() * 2
      });
    }
  }

  let lastAutoRocket = 0;
  function loopFireworks(now = 0) {
    requestAnimationFrame(loopFireworks);
    if (!fwCtx) return;

    fwCtx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);

    // Auto-launch rockets periodically if enabled
    if (continuousFireworks && now - lastAutoRocket > 1800) {
      launchRocket();
      lastAutoRocket = now;
    }

    // Update rockets
    for (let i = fireworksRockets.length - 1; i >= 0; i--) {
      const r = fireworksRockets[i];
      const dx = r.targetX - r.x;
      const dy = r.targetY - r.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 15 || r.y <= r.targetY) {
        createFireworkExplosion(r.x, r.y, r.color);
        fireworksRockets.splice(i, 1);
      } else {
        r.x += Math.cos(r.angle) * r.speed;
        r.y += Math.sin(r.angle) * r.speed;

        fwCtx.beginPath();
        fwCtx.arc(r.x, r.y, 2.5, 0, 2 * Math.PI);
        fwCtx.fillStyle = r.color;
        fwCtx.shadowColor = r.color;
        fwCtx.shadowBlur = 8;
        fwCtx.fill();
      }
    }

    // Update particles
    for (let i = fireworksParticles.length - 1; i >= 0; i--) {
      const p = fireworksParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.alpha -= p.decay;

      if (p.alpha <= 0) {
        fireworksParticles.splice(i, 1);
      } else {
        fwCtx.save();
        fwCtx.globalAlpha = p.alpha;
        fwCtx.beginPath();
        fwCtx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
        fwCtx.fillStyle = p.color;
        fwCtx.shadowColor = p.color;
        fwCtx.shadowBlur = 6;
        fwCtx.fill();
        fwCtx.restore();
      }
    }
  }

  // --- CONFETTI CELEBRATION ENGINE ---
  let confCtx = null;
  let confettiPieces = [];
  let confettiActive = false;

  function initConfettiCanvas() {
    confCtx = confettiCanvas.getContext('2d');
    function resize() {
      confettiCanvas.width = window.innerWidth;
      confettiCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();
  }

  function triggerCelebrationBurst() {
    confettiPieces = [];
    confettiActive = true;
    const colors = ['#ffd875', '#f5b82e', '#ff5722', '#d91c3d', '#00dfd8', '#ffffff', '#7928ca'];

    for (let i = 0; i < 180; i++) {
      confettiPieces.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        vx: (Math.random() - 0.5) * 22,
        vy: (Math.random() - 0.8) * 24,
        size: 7 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 12,
        gravity: 0.35 + Math.random() * 0.2,
        alpha: 1
      });
    }

    // Also shoot 4 simultaneous background rockets!
    launchRocket(window.innerWidth * 0.2, window.innerHeight * 0.2);
    launchRocket(window.innerWidth * 0.8, window.innerHeight * 0.2);
    launchRocket(window.innerWidth * 0.5, window.innerHeight * 0.15);

    renderConfetti();
  }

  function renderConfetti() {
    if (!confettiActive || !confCtx) return;

    confCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    let aliveCount = 0;

    confettiPieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.rotation += p.rotSpeed;
      if (p.y > window.innerHeight * 0.7) {
        p.alpha -= 0.015;
      }

      if (p.alpha > 0 && p.y < window.innerHeight + 50) {
        aliveCount++;
        confCtx.save();
        confCtx.globalAlpha = Math.max(0, p.alpha);
        confCtx.translate(p.x, p.y);
        confCtx.rotate((p.rotation * Math.PI) / 180);
        confCtx.fillStyle = p.color;
        confCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        confCtx.restore();
      }
    });

    if (aliveCount > 0) {
      requestAnimationFrame(renderConfetti);
    } else {
      confettiActive = false;
      confCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
  }

  // --- INITIALIZATION & EVENT BINDINGS ---
  function init() {
    // 1. Initial State UI Updates
    totalSpinsCountEl.textContent = totalSpins;
    activePrizesCountEl.textContent = getActivePrizes().length;
    document.title = `🔥 ${storeName} | Diwali Spin & Win`;

    // 2. Setup Audio buttons UI
    updateSoundUI();
    updateMusicUI();

    soundToggleBtn.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      localStorage.setItem(STORAGE_KEYS.SOUND_FX, soundEnabled.toString());
      updateSoundUI();
      if (soundEnabled) SoundFX.click();
    });

    musicToggleBtn.addEventListener('click', () => {
      bgmEnabled = !bgmEnabled;
      localStorage.setItem(STORAGE_KEYS.BGM, bgmEnabled.toString());
      updateMusicUI();
      if (bgmEnabled) {
        startBgm();
      } else {
        stopBgm();
      }
    });

    // 3. Setup Canvases
    drawWheel(0);
    setupMarqueeBulbs();
    initFireworksCanvas();
    initConfettiCanvas();
    renderRecentWinners();

    // 4. Spin Buttons
    spinBtn.addEventListener('click', () => {
      SoundFX.click();
      startSpin();
    });

    quickSpinBtn.addEventListener('click', () => {
      SoundFX.click();
      startSpin();
    });

    // 5. Winner Modal Actions
    playAgainBtn.addEventListener('click', () => {
      SoundFX.click();
      winnerModal.classList.remove('open');
      setTimeout(startSpin, 300);
    });

    closeModalBtn.addEventListener('click', () => {
      SoundFX.click();
      winnerModal.classList.remove('open');
    });

    copyCodeBtn.addEventListener('click', () => {
      SoundFX.click();
      const code = modalVoucherCode.textContent;
      navigator.clipboard.writeText(code).then(() => {
        copyCodeBtn.textContent = '✅ Copied!';
        setTimeout(() => { copyCodeBtn.textContent = '📋 Copy'; }, 2000);
      }).catch(() => {
        alert(`Your coupon code is: ${code}`);
      });
    });

    // 6. Admin Panel Modal Actions
    adminBtn.addEventListener('click', () => {
      SoundFX.click();
      renderAdminPrizesTable();
      renderAdminHistory();
      adminModal.classList.add('open');
    });

    closeAdminBtn.addEventListener('click', () => {
      SoundFX.click();
      adminModal.classList.remove('open');
    });

    // Admin Tab Navigation
    document.querySelectorAll('.admin-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        SoundFX.click();
        document.querySelectorAll('.admin-tabs .tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        this.classList.add('active');
        const targetPane = document.getElementById(this.dataset.tab);
        if (targetPane) targetPane.classList.add('active');
      });
    });

    // Save Prizes
    savePrizesBtn.addEventListener('click', () => {
      SoundFX.click();
      savePrizes(prizes);
      activePrizesCountEl.textContent = getActivePrizes().length;
      drawWheel(currentRotation);
      alert('✅ Wheel prizes and winning probabilities have been successfully updated!');
    });

    // Reset Defaults
    resetDefaultsBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all prizes and probabilities to factory Diwali defaults?')) {
        SoundFX.click();
        savePrizes(JSON.parse(JSON.stringify(DEFAULT_PRIZES)));
        renderAdminPrizesTable();
        activePrizesCountEl.textContent = getActivePrizes().length;
        drawWheel(currentRotation);
      }
    });

    // Clear Spin History
    clearHistoryBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all spin history logs?')) {
        SoundFX.click();
        spinHistory = [];
        localStorage.removeItem(STORAGE_KEYS.HISTORY);
        renderAdminHistory();
        renderRecentWinners();
      }
    });

    // Export CSV
    exportCsvBtn.addEventListener('click', () => {
      SoundFX.click();
      if (spinHistory.length === 0) {
        alert('No spin history to export!');
        return;
      }
      let csv = 'Timestamp,Prize,Coupon Code,Category\n';
      spinHistory.forEach(row => {
        csv += `"${row.timestamp}","${row.prize}","${row.code}","${row.type || ''}"\n`;
      });
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Priyam_Fataka_Spins_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });

    // Quick Store Name Config
    configStoreName.value = storeName;
    saveStoreNameBtn.addEventListener('click', () => {
      SoundFX.click();
      const val = configStoreName.value.trim();
      if (val) {
        storeName = val;
        localStorage.setItem(STORAGE_KEYS.STORE_NAME, storeName);
        document.querySelectorAll('.gold-gradient-text, .footer-title').forEach(el => {
          el.textContent = `🔥 ${storeName.toUpperCase()} 🔥`;
        });
        document.title = `🔥 ${storeName} | Diwali Spin & Win`;
        alert(`Store name updated to: ${storeName}`);
      }
    });

    // Spin Duration Config
    configSpinDuration.value = spinDuration.toString();
    configSpinDuration.addEventListener('change', () => {
      spinDuration = parseInt(configSpinDuration.value, 10);
      localStorage.setItem(STORAGE_KEYS.SPIN_DURATION, spinDuration.toString());
    });

    // Fireworks background toggle
    const configFireworksBg = document.getElementById('configFireworksBg');
    configFireworksBg.addEventListener('change', function () {
      continuousFireworks = this.checked;
    });

    // Marquee bulbs toggle
    const configMarqueeLights = document.getElementById('configMarqueeLights');
    configMarqueeLights.addEventListener('change', function () {
      bulbContainer.style.display = this.checked ? 'block' : 'none';
    });
  }

  function updateSoundUI() {
    soundToggleBtn.querySelector('.btn-icon').textContent = soundEnabled ? '🔊' : '🔇';
    soundToggleBtn.querySelector('.btn-text').textContent = soundEnabled ? 'Sound ON' : 'Sound OFF';
  }

  function updateMusicUI() {
    musicToggleBtn.querySelector('.btn-icon').textContent = bgmEnabled ? '🎶' : '🎵';
    musicToggleBtn.querySelector('.btn-text').textContent = bgmEnabled ? 'Music ON' : 'Music OFF';
  }

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

