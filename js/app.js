/**
 * Main Application Controller
 * Handles UI events, state synchronizations, modal transitions and shortcuts.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const spinBtn = document.getElementById('spinBtn');
  const spinBtnText = document.getElementById('spinBtnText');
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  const soundIconOn = document.getElementById('soundIconOn');
  const soundIconOff = document.getElementById('soundIconOff');

  // Sidebar Elements
  const addNameForm = document.getElementById('addNameForm');
  const newNameInput = document.getElementById('newNameInput');
  const namesList = document.getElementById('namesList');
  const emptyListState = document.getElementById('emptyListState');
  const activeNamesCount = document.getElementById('activeNamesCount');
  const totalNamesCount = document.getElementById('totalNamesCount');
  const resetMembersBtn = document.getElementById('resetMembersBtn');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const deselectAllBtn = document.getElementById('deselectAllBtn');
  const shuffleBtn = document.getElementById('shuffleBtn');
  const clearAllBtn = document.getElementById('clearAllBtn');
  const batchImportBtn = document.getElementById('batchImportBtn');

  // Winner Modal Elements
  const winnerModal = document.getElementById('winnerModal');
  const winnerName = document.getElementById('winnerName');
  const winnerAvatar = document.getElementById('winnerAvatar');
  const winnerCloseBtn = document.getElementById('winnerCloseBtn');
  const winnerRemoveBtn = document.getElementById('winnerRemoveBtn');
  const winnerSpinAgainBtn = document.getElementById('winnerSpinAgainBtn');

  // Batch Import Modal Elements
  const batchImportModal = document.getElementById('batchImportModal');
  const batchCancelIconBtn = document.getElementById('batchCancelIconBtn');
  const batchCancelBtn = document.getElementById('batchCancelBtn');
  const batchConfirmBtn = document.getElementById('batchConfirmBtn');
  const batchTextarea = document.getElementById('batchTextarea');

  // History Elements
  const historyBtn = document.getElementById('historyBtn');
  const historyDrawer = document.getElementById('historyDrawer');
  const closeHistoryBtn = document.getElementById('closeHistoryBtn');
  const historyList = document.getElementById('historyList');
  const historyEmptyState = document.getElementById('historyEmptyState');
  const clearHistoryBtn = document.getElementById('clearHistoryBtn');
  const historyCountBadge = document.getElementById('historyCountBadge');

  const toastContainer = document.getElementById('toastContainer');

  let currentWinner = null;
  const winnerAvatars = ['👑', '🌟', '🎉', '🍀', '✨', '🏆', '💎', '🎯', '🔥'];

  // Global Interaction Sound Feedback (plays assets/sounds/Enter & Back.wav)
  let lastInteractionSoundTime = 0;
  function triggerInteractionSound() {
    const now = performance.now();
    if (now - lastInteractionSoundTime < 35) return;
    lastInteractionSoundTime = now;
    if (window.soundManager) {
      window.soundManager.playClick();
    }
  }

  // Universal interaction sound listener for interactive elements
  document.addEventListener('pointerdown', (e) => {
    const target = e.target;
    if (!target) return;
    const interactive = target.closest('button, a, input, textarea, select, [role="button"], [tabindex], label, .member-card, .action-chip, .modal-btn, .close-icon-btn, .badge-cancel, .modal-overlay, .drawer-overlay');
    if (interactive) {
      triggerInteractionSound();
    }
  }, { passive: true });

  // Initialize Wheel Engine
  const wheel = new LuckyWheel('wheelCanvas', {
    onSpinStart: () => {
      spinBtn.disabled = true;
      spinBtn.classList.add('spinning');
      spinBtnText.textContent = '旋转中...';
    },
    onSpinEnd: (winnerItem) => {
      spinBtn.disabled = false;
      spinBtn.classList.remove('spinning');
      spinBtnText.textContent = '开始旋转';

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

    // Update history count badge
    const historyCount = window.namesManager.history.length;
    historyCountBadge.textContent = historyCount;
  }

  // Render Name List items in Sidebar (Figma Avatar Grid)
  function renderList() {
    namesList.innerHTML = '';

    window.namesManager.items.forEach((item) => {
      const li = document.createElement('li');
      li.className = `member-card ${item.enabled ? 'selected' : ''}`;
      li.dataset.id = item.id;
      li.setAttribute('tabindex', '0');
      li.setAttribute('role', 'button');
      li.setAttribute('aria-pressed', item.enabled ? 'true' : 'false');
      li.setAttribute('title', item.enabled ? `点击取消选择 ${item.name}` : `点击选择 ${item.name}`);

      const avatarContent = item.avatar
        ? `<img src="${item.avatar}" class="member-avatar-img" alt="${item.name}" onerror="this.outerHTML='<div class=\\'avatar-fallback\\'>${item.name.charAt(0)}</div>'" />`
        : `<div class="avatar-fallback">${item.name.charAt(0)}</div>`;

      li.innerHTML = `
        <div class="avatar-wrapper">
          <div class="avatar-ring">
            ${avatarContent}
          </div>
          <!-- Top-right Checkmark Badge (Shown when selected) -->
          <div class="badge-check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <!-- Bottom-right Cancel Badge (Shown on hover when selected) -->
          <button type="button" class="badge-cancel" title="取消选择 ${item.name}" aria-label="取消选择">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <span class="member-name" title="${item.name}">${item.name}</span>
      `;

      // Click to toggle selection
      li.addEventListener('click', (e) => {
        if (e.target.closest('.badge-cancel')) {
          e.stopPropagation();
          if (item.enabled) {
            window.namesManager.toggle(item.id);
            renderList();
            showToast(`已取消选择 “${item.name}”`);
          }
          return;
        }

        window.namesManager.toggle(item.id);
        renderList();
      });

      // Keyboard accessibility (Space or Enter to toggle)
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.namesManager.toggle(item.id);
          renderList();
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
      showToast('请输入名字或选项内容', 'warn');
      return;
    }

    window.namesManager.add(val);
    newNameInput.value = '';
    renderList();
    showToast(`已添加 “${val}”`);

    // Auto scroll list to top
    const wrapper = document.querySelector('.names-list-wrapper');
    if (wrapper) wrapper.scrollTop = 0;
  });

  // Reset Presets / Select All / Deselect All / Shuffle / Clear All
  if (resetMembersBtn) {
    resetMembersBtn.addEventListener('click', () => {
      window.namesManager.resetToPresets();
      renderList();
      showToast('已恢复为预设公司成员名单');
    });
  }

  selectAllBtn.addEventListener('click', () => {
    window.namesManager.setAll(true);
    renderList();
    showToast('已全选所有名字');
  });

  deselectAllBtn.addEventListener('click', () => {
    window.namesManager.setAll(false);
    renderList();
    showToast('已取消勾选全部名字');
  });

  shuffleBtn.addEventListener('click', () => {
    window.namesManager.shuffle();
    renderList();
    showToast('已随机打乱顺序');
  });

  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      if (window.namesManager.items.length === 0) {
        showToast('名单已经是空的了', 'warn');
        return;
      }
      window.namesManager.clear();
      renderList();
      showToast('名单已清空');
    });
  }

  // Spin Button Handler
  function triggerSpin() {
    if (wheel.isSpinning) return;
    const active = window.namesManager.getActiveItems();
    if (active.length === 0) {
      showToast('⚠️ 当前转轮没有可选人名，请先在右侧勾选或添加！', 'warn');
      return;
    }
    wheel.spin(5);
  }

  spinBtn.addEventListener('click', triggerSpin);

  // Keyboard shortcut: Spacebar to spin
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      triggerInteractionSound();
      // If winner modal is open, space can close it or spin again
      if (!winnerModal.classList.contains('hidden')) {
        closeWinnerModal();
        setTimeout(triggerSpin, 200);
      } else {
        triggerSpin();
      }
    } else if (e.key === 'Escape') {
      triggerInteractionSound();
      closeWinnerModal();
      closeBatchModal();
      closeHistoryDrawer();
    }
  });

  // Winner Modal Display & Actions
  function showWinnerModal(item) {
    winnerName.textContent = item.name;
    if (item.avatar) {
      winnerAvatar.innerHTML = `<img src="${item.avatar}" alt="${item.name}" class="winner-avatar-img" onerror="this.parentNode.textContent='🌟'" />`;
    } else {
      winnerAvatar.textContent = winnerAvatars[Math.floor(Math.random() * winnerAvatars.length)];
    }
    winnerModal.classList.remove('hidden');

    // Add to history
    window.namesManager.addWinnerToHistory(item.name, item.avatar);
    updateStats();

    // Sound and Confetti
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

  // 1. 直接关闭 (Keep & Close)
  winnerCloseBtn.addEventListener('click', () => {
    closeWinnerModal();
  });

  // 2. 从转轮中移除并关闭 (Remove / Disable from wheel & Close)
  winnerRemoveBtn.addEventListener('click', () => {
    if (currentWinner) {
      // Uncheck from list so it doesn't appear on the wheel anymore
      const found = window.namesManager.items.find(i => i.id === currentWinner.id || i.name === currentWinner.name);
      if (found) {
        found.enabled = false;
        window.namesManager.saveItems();
        renderList();
        showToast(`已将 “${currentWinner.name}” 从转轮中移除`);
      }
    }
    closeWinnerModal();
  });

  // 3. 再转一次 (Spin Again)
  winnerSpinAgainBtn.addEventListener('click', () => {
    closeWinnerModal();
    setTimeout(() => {
      triggerSpin();
    }, 250);
  });

  // Batch Import Modal Handlers
  function openBatchModal() {
    batchTextarea.value = '';
    batchImportModal.classList.remove('hidden');
    batchTextarea.focus();
  }

  function closeBatchModal() {
    batchImportModal.classList.add('hidden');
  }

  if (batchImportBtn) {
    batchImportBtn.addEventListener('click', openBatchModal);
  }
  batchCancelBtn.addEventListener('click', closeBatchModal);
  batchCancelIconBtn.addEventListener('click', closeBatchModal);

  batchImportModal.addEventListener('click', (e) => {
    if (e.target === batchImportModal) {
      closeBatchModal();
    }
  });

  batchConfirmBtn.addEventListener('click', () => {
    const text = batchTextarea.value;
    const mode = document.querySelector('input[name="importMode"]:checked').value;
    const importedCount = window.namesManager.batchImport(text, mode);

    if (importedCount > 0) {
      renderList();
      closeBatchModal();
      showToast(`成功导入 ${importedCount} 个人名`);
    } else {
      showToast('未识别到有效人名，请检查输入格式', 'warn');
    }
  });

  // Sound Toggle Handler
  soundToggleBtn.addEventListener('click', () => {
    const isMuted = window.soundManager.toggleMute();
    if (isMuted) {
      soundIconOn.classList.add('hidden');
      soundIconOff.classList.remove('hidden');
      showToast('音效已静音');
    } else {
      soundIconOn.classList.remove('hidden');
      soundIconOff.classList.add('hidden');
      showToast('音效已开启');
      window.soundManager.playClick();
    }
  });

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

  historyBtn.addEventListener('click', openHistoryDrawer);
  closeHistoryBtn.addEventListener('click', closeHistoryDrawer);
  historyDrawer.addEventListener('click', (e) => {
    if (e.target === historyDrawer) {
      closeHistoryDrawer();
    }
  });

  clearHistoryBtn.addEventListener('click', () => {
    if (window.namesManager.history.length === 0) {
      showToast('历史记录已经是空的了', 'warn');
      return;
    }
    window.namesManager.clearHistory();
    renderHistory();
    updateStats();
    showToast('中奖历史记录已清空');
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
