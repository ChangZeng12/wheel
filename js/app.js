/**
 * Main Application Controller - Minimalist Floating UI
 * Handles UI events, state synchronizations, modal transitions and keyboard shortcuts.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements - Wheel & Spin
  const spinBtn = document.getElementById('spinBtn');
  const spinBtnText = document.getElementById('spinBtnText');

  // Sound Toggle & History (Top-Right)
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');
  const historyCircleBtn = document.getElementById('historyCircleBtn');

  // Date Pill (Top-Left)
  const datePillText = document.getElementById('datePillText');

  // Sidebar Elements
  const addNameForm = document.getElementById('addNameForm');
  const newNameInput = document.getElementById('newNameInput');
  const namesList = document.getElementById('namesList');
  const emptyListState = document.getElementById('emptyListState');
  const activeNamesCount = document.getElementById('activeNamesCount');
  const totalNamesCount = document.getElementById('totalNamesCount');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const deselectAllBtn = document.getElementById('deselectAllBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');

  // Winner Modal Elements
  const winnerModal = document.getElementById('winnerModal');
  const winnerName = document.getElementById('winnerName');
  const winnerAvatar = document.getElementById('winnerAvatar');
  const winnerCloseBtn = document.getElementById('winnerCloseBtn');
  const winnerRemoveBtn = document.getElementById('winnerRemoveBtn');

  // History Drawer Elements
  const historyDrawer = document.getElementById('historyDrawer');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const historyList = document.getElementById('historyList');
  const historyEmptyState = document.getElementById('historyEmptyState');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');

  const toastContainer = document.getElementById('toastContainer');

  let currentWinner = null;
  const winnerAvatars = ['👑', '🌟', '🎉', '🍀', '✨', '🏆', '💎', '🎯', '🔥'];

  // Global Interaction Sound Feedback
  let lastInteractionSoundTime = 0;
  function triggerInteractionSound() {
    const now = performance.now();
    if (now - lastInteractionSoundTime < 80) return;
    lastInteractionSoundTime = now;
    if (window.soundManager) {
      window.soundManager.playClick();
    }
  }

  // Update Dynamic Date in Bottom-Right Pill
  function updateDatePill() {
    if (!datePillText) return;
    const now = new Date();
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    try {
      datePillText.textContent = now.toLocaleDateString('en-US', options);
    } catch (e) {
      datePillText.textContent = now.toDateString();
    }
  }
  updateDatePill();

  // Sound Mode Handlers (Top-Right Circular Button)
  function updateSoundUI(isMuted) {
    if (!soundToggleBtn || !soundIconOn || !soundIconOff) return;
    if (isMuted) {
      soundIconOn.classList.add('hidden');
      soundIconOff.classList.remove('hidden');
      soundToggleBtn.setAttribute('data-tooltip', 'Enable Sound');
      soundToggleBtn.setAttribute('aria-label', 'Enable Sound');
    } else {
      soundIconOn.classList.remove('hidden');
      soundIconOff.classList.add('hidden');
      soundToggleBtn.setAttribute('data-tooltip', 'Mute Sound');
      soundToggleBtn.setAttribute('aria-label', 'Mute Sound');
    }
  }

  if (soundToggleBtn) {
    soundToggleBtn.addEventListener('click', () => {
      if (window.soundManager) {
        const isMuted = window.soundManager.toggleMute();
        updateSoundUI(isMuted);
        if (isMuted) {
          showToast('Sound muted');
        } else {
          showToast('Sound enabled');
          window.soundManager.playClick();
        }
      }
    });

    if (window.soundManager) {
      updateSoundUI(window.soundManager.muted);
    }
  }

  // Initialize Wheel Engine
  const wheel = new LuckyWheel('wheelCanvas', {
    onSpinStart: () => {
      spinBtn.disabled = true;
      spinBtn.classList.add('spinning');
      spinBtnText.textContent = 'Spinning...';
    },
    onSpinEnd: (winnerItem) => {
      spinBtn.disabled = false;
      spinBtn.classList.remove('spinning');
      spinBtnText.textContent = 'Spin Now';

      if (winnerItem) {
        currentWinner = winnerItem;
        showWinnerModal(winnerItem);
      }
    }
  });

  // Sync Wheel with active items
  function syncWheel() {
    const active = window.namesManager.getActiveItems();
    wheel.setItems(active);
    updateStats();
  }

  // Update Counters & Stats
  function updateStats() {
    const total = window.namesManager.items.length;
    const active = window.namesManager.getActiveItems().length;
    activeNamesCount.textContent = active;
    totalNamesCount.textContent = total;

    if (total === 0) {
      emptyListState.classList.remove('hidden');
    } else {
      emptyListState.classList.add('hidden');
    }
  }

  // Render Name List items in Floating Sidebar
  function renderList() {
    namesList.innerHTML = '';

    window.namesManager.items.forEach((item) => {
      const isPreset = window.namesManager.isPresetMember(item.name);
      const li = document.createElement('li');
      li.className = `member-card ${item.enabled ? 'selected' : ''}`;
      li.dataset.id = item.id;
      li.setAttribute('tabindex', '0');
      li.setAttribute('role', 'button');
      li.setAttribute('aria-pressed', item.enabled ? 'true' : 'false');
      li.setAttribute('title', item.enabled ? `Click to deselect ${item.name}` : `Click to select ${item.name}`);

      const avatarContent = item.avatar
        ? `<img src="${item.avatar}" class="member-avatar-img" alt="${item.name}" onerror="this.outerHTML='<div class=\\'avatar-fallback\\'>${item.name.charAt(0)}</div>'" />`
        : `<div class="avatar-fallback">${item.name.charAt(0)}</div>`;

      // Only custom / added candidates show the delete button on hover
      const deleteBadgeHtml = isPreset ? '' : `
        <!-- Bottom-right Delete Badge (Only for custom/added candidates) -->
        <button type="button" class="badge-cancel" title="Delete ${item.name} from candidates" aria-label="Delete ${item.name}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `;

      li.innerHTML = `
        <div class="avatar-wrapper">
          <div class="avatar-ring" style="${item.enabled && item.color ? `border-color: ${item.color};` : ''}">
            ${avatarContent}
          </div>
          <!-- Top-right Checkmark Badge -->
          <div class="badge-check" style="${item.color ? `background-color: ${item.color};` : ''}" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          ${deleteBadgeHtml}
        </div>
        <span class="member-name" title="${item.name}">${item.name}</span>
      `;

      // Bottom-right button: Delete candidate completely from list
      const deleteBtn = li.querySelector('.badge-cancel');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          window.namesManager.remove(item.id);
          renderList();
          showToast(`Deleted "${item.name}" from candidates`);
        });
      }

      // Card click: Toggle selection (add to / remove from wheel)
      li.addEventListener('click', (e) => {
        if (e.target.closest('.badge-cancel')) return;
        const wasEnabled = item.enabled;
        window.namesManager.toggle(item.id);
        renderList();
        if (wasEnabled) {
          showToast(`Removed "${item.name}" from wheel`);
        } else {
          showToast(`Added "${item.name}" to wheel`);
        }
      });

      // Keyboard accessibility
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const wasEnabled = item.enabled;
          window.namesManager.toggle(item.id);
          renderList();
          if (wasEnabled) {
            showToast(`Removed "${item.name}" from wheel`);
          } else {
            showToast(`Added "${item.name}" to wheel`);
          }
        }
      });

      namesList.appendChild(li);
    });

    syncWheel();
  }

  // Add Name Form Submit
  addNameForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = newNameInput.value.trim();
    if (!val) {
      showToast('Please enter a name or option', 'warn');
      return;
    }

    window.namesManager.add(val);
    newNameInput.value = '';
    renderList();
    showToast(`Added "${val}"`);

    const wrapper = document.querySelector('.names-list-wrapper');
    if (wrapper) wrapper.scrollTop = 0;
  });

  // Select All / Deselect All / Shuffle

  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      window.namesManager.setAll(true);
      renderList();
      showToast('Selected all candidates');
    });
  }

  if (deselectAllBtn) {
    deselectAllBtn.addEventListener('click', () => {
      window.namesManager.setAll(false);
      renderList();
      showToast('Deselected all candidates');
    });
  }

  if (shuffleBtn) {
    shuffleBtn.addEventListener('click', () => {
      window.namesManager.shuffle();
      renderList();
      showToast('Shuffled order');
    });
  }

  // Universal interaction sound listener for real interactive elements ONLY
  document.addEventListener('pointerdown', (e) => {
    const target = e.target;
    if (!target) return;

    // Must be a genuine interactive action element
    const interactive = target.closest('button, a, input, select, textarea, [role="button"], label, .member-card, .circle-btn, .winner-action-btn, .close-icon-btn, .badge-cancel');
    if (!interactive) return;

    // Ignore disabled elements
    if (interactive.disabled || interactive.hasAttribute('disabled') || interactive.getAttribute('aria-disabled') === 'true' || interactive.classList.contains('disabled')) {
      return;
    }

    // Ignore Spin Button if already spinning
    if (interactive.id === 'spinBtn' && (wheel.isSpinning || interactive.classList.contains('spinning'))) {
      return;
    }

    triggerInteractionSound();
  }, { passive: true });

  // Spin Button Handler
  function triggerSpin() {
    if (wheel.isSpinning) return;
    const active = window.namesManager.getActiveItems();
    if (active.length === 0) {
      showToast('⚠️ No candidates available. Please select or add members!', 'warn');
      return;
    }
    wheel.spin(5);
  }

  spinBtn.addEventListener('click', triggerSpin);

  // Keyboard shortcuts: Spacebar to spin, R to shuffle, Escape to close
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      // Ignore if wheel is already spinning
      if (wheel.isSpinning) return;

      const active = window.namesManager.getActiveItems();
      if (active.length === 0) {
        showToast('⚠️ No candidates available. Please select or add members!', 'warn');
        return;
      }

      triggerInteractionSound();
      if (!winnerModal.classList.contains('hidden')) {
        closeWinnerModal();
        setTimeout(triggerSpin, 200);
      } else {
        triggerSpin();
      }
    } else if ((e.key === 'r' || e.key === 'R') && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      if (wheel.isSpinning) return;
      triggerInteractionSound();
      window.namesManager.shuffle();
      renderList();
      showToast('Shuffled order');
    } else if (e.key === 'Escape') {
      const isModalOpen = !winnerModal.classList.contains('hidden');
      const isDrawerOpen = !historyDrawer.classList.contains('hidden');
      if (isModalOpen || isDrawerOpen) {
        triggerInteractionSound();
        closeWinnerModal();
        closeHistoryDrawer();
      }
    }
  });

  // Winner Modal Display & Actions
  function showWinnerModal(item) {
    currentWinner = item;
    winnerName.textContent = item.name;
    if (item.avatar) {
      winnerAvatar.innerHTML = `<img src="${item.avatar}" alt="${item.name}" class="winner-avatar-img" />`;
    } else {
      const initial = item.name ? item.name.charAt(0).toUpperCase() : '?';
      const bgColor = item.color || '#55C2C0';
      winnerAvatar.innerHTML = `<div class="winner-avatar-fallback" style="background-color: ${bgColor};">${initial}</div>`;
    }
    winnerModal.classList.remove('hidden');

    window.namesManager.addWinnerToHistory(item.name, item.avatar);
    updateStats();

    if (window.soundManager) {
      window.soundManager.playWinFanfare();
    }
    if (window.confettiEngine) {
      window.confettiEngine.burst(180);
    }
  }

  function closeWinnerModal() {
    winnerModal.classList.add('hidden');
    if (window.confettiEngine) {
      window.confettiEngine.stop();
    }
  }

  if (winnerCloseBtn) {
    winnerCloseBtn.addEventListener('click', closeWinnerModal);
  }

  if (winnerRemoveBtn) {
    winnerRemoveBtn.addEventListener('click', () => {
      if (currentWinner) {
        const found = window.namesManager.items.find(i => i.id === currentWinner.id || i.name === currentWinner.name);
        if (found) {
          found.enabled = false;
          window.namesManager.saveItems();
          renderList();
          showToast(`Removed "${currentWinner.name}" from wheel`);
        }
      }
      closeWinnerModal();
    });
  }

  // History Drawer Handlers
  function openHistoryDrawer() {
    renderHistory();
    historyDrawer.classList.remove('hidden');
  }

  function closeHistoryDrawer() {
    historyDrawer.classList.add('hidden');
  }

  function renderHistory() {
    const history = window.namesManager.history;
    historyList.innerHTML = '';

    if (!history || history.length === 0) {
      historyEmptyState.classList.remove('hidden');
    } else {
      historyEmptyState.classList.add('hidden');
      history.forEach((rec, idx) => {
        const li = document.createElement('li');
        li.className = 'history-item';
        let avatarThumb = '';
        if (rec.avatar) {
          avatarThumb = `<img src="${rec.avatar}" class="history-avatar-img" alt="${rec.name}" onerror="this.style.display='none'" />`;
        }
        li.innerHTML = `
          <div class="history-item-left">
            <span class="history-index">${history.length - idx}</span>
            ${avatarThumb}
            <span class="history-name">${rec.name}</span>
          </div>
          <span class="history-time">${rec.timestamp}</span>
        `;
        historyList.appendChild(li);
      });
    }
  }

  if (historyCircleBtn) {
    historyCircleBtn.addEventListener('click', openHistoryDrawer);
  }
  closeHistoryBtn.addEventListener('click', closeHistoryDrawer);
  historyDrawer.addEventListener('click', (e) => {
    if (e.target === historyDrawer) {
      closeHistoryDrawer();
    }
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (window.namesManager.history.length === 0) {
      showToast('History is already empty', 'warn');
      return;
    }
    window.namesManager.clearHistory();
    renderHistory();
    updateStats();
    showToast('Draw history cleared');
  });

  // Toast Notification System
  function showToast(msg, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <span>${type === 'warn' ? '⚠️' : '✨'}</span>
      <span>${msg}</span>
    `;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 3000);
  }

  // Initial Boot
  renderList();
});
