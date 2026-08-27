/**
 * Name Lucky Wheel Canvas 2D Engine - Nintendo Switch 2 Light Minimalist Style
 * Features: High-DPI Canvas Rendering, Solid Flat Slices without internal divider lines,
 * Dynamic Fan-Out / Collapse Slice Transitions on Add/Remove.
 */
class LuckyWheel {
  constructor(canvasId = 'wheelCanvas', options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.slices = []; // Array of { id, name, avatar, color, textColor, currentWeight, targetWeight, startWeight, animStartTime, animDuration }
    this.currentAngle = 0; // in radians
    this.isSpinning = false;
    this.isInitialized = false;
    this.pointerEl = document.getElementById('wheelPointer');
    this.imageCache = new Map();
    this.transitionAnimId = null;

    // Callbacks
    this.onSpinStart = options.onSpinStart || (() => {});
    this.onSpinEnd = options.onSpinEnd || (() => {});

    // Member fixed theme color palette (EXCLUSIVE to the 7 company members)
    this.memberThemeColors = {
      'haley': '#E86262',
      'rhea': '#80BEFD',
      'vivian': '#94E1C1',
      'sarah': '#FE9F62',
      'chang': '#55C2C0',
      'daniel': '#FEB313',
      'rachél': '#B87FFC'
    };

    this.exclusiveColors = new Set(
      Object.values(this.memberThemeColors).map(c => c.toUpperCase())
    );

    // Curated custom palette for all other / new candidates
    this.customPalette = [
      '#FF70A6', '#4D96FF', '#6BCB77', '#FFD93D', '#FF6B8B', '#00D2D3',
      '#A66CFF', '#FFA07A', '#20BF6B', '#45AAF2', '#FA8231', '#8854D0',
      '#26DE81', '#4B7BEC', '#FC5C65', '#FED330', '#2BCBBA', '#FD9644',
      '#45B649', '#E056FD', '#686DE0', '#30336B', '#FFBE76', '#BADC58',
      '#F6E58D', '#7ED6DF', '#E05DA9', '#48DBFB', '#1DD1A1', '#F368E0'
    ].filter(c => !this.exclusiveColors.has(c.toUpperCase()));

    this.lastTickSliceId = null;
    this.initCanvas();
    window.addEventListener('resize', () => this.initCanvas());
  }

  get items() {
    return this.slices.filter(s => s.targetWeight > 0);
  }

  initCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.min(rect.width, rect.height) || 500;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.ctx = this.canvas.getContext('2d');
    this.ctx.scale(dpr, dpr);
    this.size = size;
    this.draw();
  }

  /**
   * Set active items with smooth in-place fan-out / collapse slice transitions
   * Guarantees:
   * 1. Preset members exclusively own their theme colors.
   * 2. New members never receive preset theme colors.
   * 3. No duplicate slice colors appear on the wheel.
   */
  setItems(namesList) {
    const usedColorsOnWheel = new Set();

    // Pass 1: Reserve exclusive colors for preset members
    namesList.forEach((item) => {
      const name = typeof item === 'string' ? item : item.name;
      const cleanName = (name || '').trim().toLowerCase();
      if (this.memberThemeColors[cleanName]) {
        usedColorsOnWheel.add(this.memberThemeColors[cleanName].toUpperCase());
      }
    });

    const incomingItems = namesList.map((item, index) => {
      const name = typeof item === 'string' ? item : item.name;
      const id = typeof item === 'object' && item.id !== undefined ? item.id : `slice_${name}_${index}`;
      const avatar = typeof item === 'object' ? (item.avatar || '') : '';

      const cleanName = (name || '').trim().toLowerCase();
      let color = '';

      if (this.memberThemeColors[cleanName]) {
        // Preset member exclusively gets their color
        color = this.memberThemeColors[cleanName];
      } else {
        // Custom candidate: check if item has a valid, non-exclusive, non-duplicate color
        let candidateColor = (typeof item === 'object' && item.color) ? item.color : '';
        const upper = candidateColor ? candidateColor.toUpperCase() : '';

        if (upper && !this.exclusiveColors.has(upper) && !usedColorsOnWheel.has(upper)) {
          color = candidateColor;
          usedColorsOnWheel.add(upper);
        } else {
          // Find next available color from custom palette
          let assigned = false;
          for (const palColor of this.customPalette) {
            const palUpper = palColor.toUpperCase();
            if (!this.exclusiveColors.has(palUpper) && !usedColorsOnWheel.has(palUpper)) {
              color = palColor;
              usedColorsOnWheel.add(palUpper);
              assigned = true;
              break;
            }
          }

          if (!assigned) {
            // Golden angle HSL fallback
            for (let i = 0; i < 360; i++) {
              const hue = Math.round((i * 137.508) % 360);
              const hex = `hsl(${hue}, 70%, 60%)`;
              if (!usedColorsOnWheel.has(hex)) {
                color = hex;
                usedColorsOnWheel.add(hex);
                break;
              }
            }
          }
        }
      }

      if (avatar && !this.imageCache.has(avatar)) {
        const img = new Image();
        img.onload = () => this.draw();
        img.src = avatar;
        this.imageCache.set(avatar, img);
      }

      return {
        id,
        name,
        avatar,
        color,
        textColor: '#1A1A1A'
      };
    });

    const now = performance.now();

    // First load setup without animation flash
    if (!this.isInitialized) {
      this.isInitialized = true;
      this.slices = incomingItems.map(item => ({
        ...item,
        currentWeight: 1,
        targetWeight: 1,
        startWeight: 1,
        animStartTime: now,
        animDuration: 400
      }));
      this.draw();
      return;
    }

    const incomingMap = new Map(incomingItems.map(item => [item.id, item]));
    const existingMap = new Map(this.slices.map(s => [s.id, s]));

    // Mark removed slices with targetWeight = 0
    for (const s of this.slices) {
      if (!incomingMap.has(s.id)) {
        if (s.targetWeight !== 0) {
          s.startWeight = s.currentWeight;
          s.targetWeight = 0;
          s.animStartTime = now;
          s.animDuration = 450;
        }
      }
    }

    // Merge maintaining sequence
    const mergedSlices = [];
    const processedExisting = new Set();

    for (let i = 0; i < incomingItems.length; i++) {
      const incoming = incomingItems[i];

      if (existingMap.has(incoming.id)) {
        const existing = existingMap.get(incoming.id);
        const existingIdx = this.slices.indexOf(existing);

        // Include any collapsing slices that were positioned before this slice
        for (let j = 0; j < existingIdx; j++) {
          const prev = this.slices[j];
          if (!processedExisting.has(prev.id) && prev.targetWeight === 0 && prev.currentWeight > 0.0001) {
            mergedSlices.push(prev);
            processedExisting.add(prev.id);
          }
        }

        if (existing.targetWeight !== 1) {
          existing.startWeight = existing.currentWeight;
          existing.targetWeight = 1;
          existing.animStartTime = now;
          existing.animDuration = 450;
        }
        existing.name = incoming.name;
        existing.avatar = incoming.avatar;
        existing.color = incoming.color;

        if (!processedExisting.has(existing.id)) {
          mergedSlices.push(existing);
          processedExisting.add(existing.id);
        }
      } else {
        // Brand new slice expanding from weight 0 to 1
        const newSlice = {
          ...incoming,
          currentWeight: 0,
          targetWeight: 1,
          startWeight: 0,
          animStartTime: now,
          animDuration: 450
        };
        mergedSlices.push(newSlice);
        processedExisting.add(newSlice.id);
      }
    }

    // Add any remaining collapsing slices
    for (const s of this.slices) {
      if (!processedExisting.has(s.id) && s.targetWeight === 0 && s.currentWeight > 0.0001) {
        mergedSlices.push(s);
        processedExisting.add(s.id);
      }
    }

    this.slices = mergedSlices;
    this.startTransition();
  }

  /**
   * Run transition animation loop for expanding / collapsing slices with Ease-Out curve
   */
  startTransition() {
    if (this.transitionAnimId) return;

    const animateTransition = (currentTime) => {
      let hasActiveAnimation = false;

      for (let i = 0; i < this.slices.length; i++) {
        const s = this.slices[i];
        if (Math.abs(s.currentWeight - s.targetWeight) > 0.0005) {
          const elapsed = Math.max(0, currentTime - s.animStartTime);
          const duration = s.animDuration || 450;
          const progress = Math.min(Math.max(elapsed / duration, 0), 1);
          
          // Pure Ease-Out Quartic Curve: snappy responsive start with silky smooth deceleration
          const ease = 1 - Math.pow(1 - progress, 4);
          s.currentWeight = s.startWeight + (s.targetWeight - s.startWeight) * ease;

          if (progress < 1) {
            hasActiveAnimation = true;
          } else {
            s.currentWeight = s.targetWeight;
          }
        } else {
          s.currentWeight = s.targetWeight;
        }
      }

      // Filter out completely collapsed slices
      this.slices = this.slices.filter(s => !(s.targetWeight === 0 && s.currentWeight <= 0.0005));

      this.draw();

      if (hasActiveAnimation) {
        this.transitionAnimId = requestAnimationFrame(animateTransition);
      } else {
        this.transitionAnimId = null;
      }
    };

    this.transitionAnimId = requestAnimationFrame(animateTransition);
  }

  /**
   * Main Drawing Routine - Slices without internal black divider lines
   */
  draw() {
    if (!this.ctx || !this.size) return;
    const ctx = this.ctx;
    const size = this.size;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 8;

    ctx.clearRect(0, 0, size, size);

    const visibleSlices = this.slices.filter(s => s.currentWeight > 0.0001);
    const totalWeight = visibleSlices.reduce((sum, s) => sum + s.currentWeight, 0);

    if (visibleSlices.length === 0 || totalWeight <= 0.0001) {
      this.drawEmptyWheel(ctx, cx, cy, radius);
      return;
    }

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(this.currentAngle);

    // Draw Slices: Solid flat color fills, ABSOLUTELY NO BLACK DIVIDER LINES
    let startAngle = 0;
    for (let i = 0; i < visibleSlices.length; i++) {
      const slice = visibleSlices[i];
      const sliceAngle = (slice.currentWeight / totalWeight) * (Math.PI * 2);
      const endAngle = startAngle + sliceAngle;

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Solid member theme fill
      ctx.fillStyle = slice.color;
      ctx.fill();

      // NO ctx.stroke() here! Zero black divider lines between slices.

      // Draw Slice Text and Avatar
      const alpha = Math.min(1, slice.currentWeight / 0.6);
      this.drawSliceContent(ctx, slice, startAngle, sliceAngle, radius, alpha);

      startAngle = endAngle;
    }

    // Outer wheel border edge (Solid crisp outer ring)
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1A1A1A';
    ctx.stroke();

    ctx.restore();
  }

  drawSliceContent(ctx, item, startAngle, sliceAngle, radius, alpha = 1) {
    if (sliceAngle < 0.08 || alpha < 0.01) return; // Don't draw text if slice is too narrow

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.rotate(startAngle + sliceAngle / 2);

    const activeCount = this.slices.filter(s => s.targetWeight > 0).length || 1;
    let fontSize = 18;
    if (activeCount > 30) fontSize = 11;
    else if (activeCount > 20) fontSize = 13;
    else if (activeCount > 12) fontSize = 15;
    else if (activeCount <= 4) fontSize = 24;

    ctx.font = `800 ${fontSize}px "Outfit", "Noto Sans SC", sans-serif`;
    ctx.fillStyle = '#1A1A1A';
    ctx.textBaseline = 'middle';

    const img = item.avatar ? this.imageCache.get(item.avatar) : null;
    const hasImage = img && img.complete && img.naturalWidth > 0 && activeCount <= 16;

    if (hasImage) {
      const avatarSize = activeCount <= 8 ? 34 : (activeCount <= 12 ? 28 : 22);
      const avatarRadius = avatarSize / 2;
      const avatarX = radius - 18 - avatarRadius;
      const avatarY = 0;

      // Draw circular avatar
      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, avatarX - avatarRadius, avatarY - avatarRadius, avatarSize, avatarSize);
      ctx.restore();

      // White ring around avatar
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, avatarRadius, 0, Math.PI * 2);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();

      // Text position to the left of the avatar
      ctx.textAlign = 'right';
      const maxTextWidth = Math.max(10, avatarX - avatarRadius - 15);
      let displayText = item.name;
      if (ctx.measureText(displayText).width > maxTextWidth) {
        while (ctx.measureText(displayText + '…').width > maxTextWidth && displayText.length > 1) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '…';
      }
      ctx.fillText(displayText, avatarX - avatarRadius - 8, 0);
    } else {
      ctx.textAlign = 'right';
      const maxTextWidth = radius * 0.68;
      let displayText = item.name;
      if (ctx.measureText(displayText).width > maxTextWidth) {
        while (ctx.measureText(displayText + '…').width > maxTextWidth && displayText.length > 1) {
          displayText = displayText.slice(0, -1);
        }
        displayText += '…';
      }
      ctx.fillText(displayText, radius - 20, 0);
    }

    ctx.restore();
  }

  drawEmptyWheel(ctx, cx, cy, radius) {
    ctx.save();
    ctx.translate(cx, cy);

    // Empty wheel disc base
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1A1A1A';
    ctx.stroke();

    // Subtle dashed track ring
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.56, 0, Math.PI * 2);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#E2E8F0';
    ctx.setLineDash([4, 6]);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.restore();
  }

  /**
   * Get the winner at the right pointer (angle = 0 / 3 o'clock)
   */
  getCurrentWinner() {
    const visibleSlices = this.slices.filter(s => s.currentWeight > 0.0001 && s.targetWeight > 0);
    if (visibleSlices.length === 0) return null;

    const totalWeight = visibleSlices.reduce((sum, s) => sum + s.currentWeight, 0);
    if (totalWeight <= 0) return null;

    // Pointer is at RIGHT = 0 radians (0 degrees / 3 o'clock position)
    const pointerAngle = 0;

    // Normalize wheel angle to [0, 2PI)
    let normalizedWheelAngle = this.currentAngle % (Math.PI * 2);
    if (normalizedWheelAngle < 0) normalizedWheelAngle += Math.PI * 2;

    // Relative angle where pointer hits the wheel
    let relativeAngle = (pointerAngle - normalizedWheelAngle) % (Math.PI * 2);
    if (relativeAngle < 0) relativeAngle += Math.PI * 2;

    let accumAngle = 0;
    for (const slice of visibleSlices) {
      const sliceAngle = (slice.currentWeight / totalWeight) * (Math.PI * 2);
      if (relativeAngle >= accumAngle && relativeAngle < accumAngle + sliceAngle) {
        return slice;
      }
      accumAngle += sliceAngle;
    }

    return visibleSlices[visibleSlices.length - 1];
  }

  /**
   * Check which slice is currently passing under the pointer for tick sound
   */
  checkPointerTick() {
    const visibleSlices = this.slices.filter(s => s.currentWeight > 0.0001 && s.targetWeight > 0);
    if (visibleSlices.length === 0) return;

    const winner = this.getCurrentWinner();
    if (!winner) return;

    if (winner.id !== this.lastTickSliceId) {
      this.lastTickSliceId = winner.id;

      // Trigger Web Audio Tick Sound
      if (window.soundEngine) {
        window.soundEngine.playTick();
      }

      // Trigger Pointer micro bounce
      if (this.pointerEl) {
        this.pointerEl.classList.remove('tick-bounce');
        void this.pointerEl.offsetWidth; // Trigger reflow
        this.pointerEl.classList.add('tick-bounce');
      }
    }
  }

  /**
   * Spin Animation with Physics Quintic Easing
   */
  spin(durationSeconds = 5) {
    const activeItems = this.slices.filter(s => s.targetWeight > 0);
    if (this.isSpinning || activeItems.length === 0) return;

    this.isSpinning = true;
    this.onSpinStart();

    if (window.soundEngine) {
      window.soundEngine.playSpinStart();
    }

    const duration = durationSeconds * 1000;
    const startTime = performance.now();
    const startAngle = this.currentAngle;

    // Minimum full rotations + random landing angle
    const minTurns = 5 + Math.floor(durationSeconds * 1.5);
    const targetRandomTurns = minTurns + Math.random() * 2;
    const totalRotation = targetRandomTurns * Math.PI * 2;

    // Quintic Ease-Out curve for realistic deceleration
    const easeOutQuint = (t) => 1 - Math.pow(1 - t, 5);

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuint(progress);

      this.currentAngle = startAngle + totalRotation * easedProgress;
      this.draw();
      this.checkPointerTick();

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.isSpinning = false;
        const winner = this.getCurrentWinner();

        if (window.soundEngine) {
          window.soundEngine.playWin();
        }

        this.onSpinEnd(winner);
      }
    };

    requestAnimationFrame(animate);
  }
}
