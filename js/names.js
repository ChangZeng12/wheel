/**
 * Names State Manager & Persistence - Lean & Minimalist with Avatar Support
 */
class NamesManager {
  constructor() {
    this.storageKey = 'lucky_wheel_names_v3';
    this.historyKey = 'lucky_wheel_history_v3';
    this.defaultNames = ['张伟', '王芳', '李强', '刘洋', '陈静', '杨光', '赵敏', '孙宇'];

    this.items = this.loadItems();
    this.history = this.loadHistory();
  }

  getDefaultItems() {
    if (window.COMPANY_MEMBERS && Array.isArray(window.COMPANY_MEMBERS) && window.COMPANY_MEMBERS.length > 0) {
      return window.COMPANY_MEMBERS.map(member => this.createItem(member));
    }
    return this.defaultNames.map(name => this.createItem(name));
  }

  loadItems() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Sync with COMPANY_MEMBERS avatars & colors if available
          return parsed.map(item => {
            if (window.COMPANY_MEMBERS) {
              const matched = window.COMPANY_MEMBERS.find(m => m.name.trim().toLowerCase() === item.name.trim().toLowerCase());
              if (matched) {
                if (!item.avatar && matched.avatar) item.avatar = matched.avatar;
                item.color = matched.color || item.color;
              }
            }
            return item;
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load names from localStorage', e);
    }
    return this.getDefaultItems();
  }

  findAvatarForName(name) {
    if (!name) return '';
    const clean = name.trim().toLowerCase();
    if (window.COMPANY_MEMBERS && Array.isArray(window.COMPANY_MEMBERS)) {
      const matched = window.COMPANY_MEMBERS.find(m => m.name.trim().toLowerCase() === clean);
      if (matched && matched.avatar) return matched.avatar;
    }
    return '';
  }

  findColorForName(name) {
    if (!name) return '';
    const clean = name.trim().toLowerCase();
    if (window.COMPANY_MEMBERS && Array.isArray(window.COMPANY_MEMBERS)) {
      const matched = window.COMPANY_MEMBERS.find(m => m.name.trim().toLowerCase() === clean);
      if (matched && matched.color) return matched.color;
    }
    return '';
  }

  createItem(itemData) {
    let name = '';
    let avatar = '';
    let color = '';
    let enabled = true;

    if (typeof itemData === 'string') {
      name = itemData.trim();
      avatar = this.findAvatarForName(name);
      color = this.findColorForName(name);
    } else if (itemData && typeof itemData === 'object') {
      name = (itemData.name || '').trim();
      avatar = itemData.avatar || this.findAvatarForName(name);
      color = itemData.color || this.findColorForName(name);
      if (itemData.enabled !== undefined) enabled = !!itemData.enabled;
    }

    return {
      id: 'id_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36),
      name: name,
      avatar: avatar,
      color: color,
      enabled: enabled
    };
  }

  saveItems() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));
    } catch (e) {}
  }

  resetToPresets() {
    this.items = this.getDefaultItems();
    this.saveItems();
    return this.items;
  }

  loadHistory() {
    try {
      const saved = localStorage.getItem(this.historyKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [];
  }

  saveHistory() {
    try {
      localStorage.setItem(this.historyKey, JSON.stringify(this.history));
    } catch (e) {}
  }

  add(name, avatar = '') {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const newItem = this.createItem({ name: trimmed, avatar: avatar || this.findAvatarForName(trimmed) });
    this.items.unshift(newItem);
    this.saveItems();
    return newItem;
  }

  remove(id) {
    this.items = this.items.filter(item => item.id !== id);
    this.saveItems();
  }

  toggle(id) {
    const item = this.items.find(item => item.id === id);
    if (item) {
      item.enabled = !item.enabled;
      this.saveItems();
    }
    return item;
  }

  setAll(enabled = true) {
    this.items.forEach(item => {
      item.enabled = enabled;
    });
    this.saveItems();
  }

  shuffle() {
    for (let i = this.items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.items[i], this.items[j]] = [this.items[j], this.items[i]];
    }
    this.saveItems();
  }

  clear() {
    this.items = [];
    this.saveItems();
  }

  batchImport(text, mode = 'append') {
    if (!text || !text.trim()) return 0;
    const tokens = text.split(/[\n\r,，;；]+/).map(s => s.trim()).filter(s => s.length > 0);
    if (tokens.length === 0) return 0;

    const newItems = tokens.map(token => this.createItem(token));
    if (mode === 'replace') {
      this.items = newItems;
    } else {
      this.items = [...this.items, ...newItems];
    }
    this.saveItems();
    return tokens.length;
  }

  getActiveItems() {
    return this.items.filter(item => item.enabled);
  }

  addWinnerToHistory(name, avatar = '') {
    const record = {
      id: 'rec_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      name: name,
      avatar: avatar || this.findAvatarForName(name),
      timestamp: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    this.history.unshift(record);
    if (this.history.length > 50) {
      this.history = this.history.slice(0, 50);
    }
    this.saveHistory();
    return record;
  }

  clearHistory() {
    this.history = [];
    this.saveHistory();
  }
}

window.namesManager = new NamesManager();

