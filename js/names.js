/**
 * Names State Manager & Persistence - Lean & Minimalist with Avatar Support
 * Enforces exclusive theme colors for preset company members and unique custom colors for new characters.
 */

// 7 Preset Company Members Exclusive Colors
const EXCLUSIVE_MEMBER_COLORS = {
  'haley': '#E86262',
  'rhea': '#80BEFD',
  'vivian': '#94E1C1',
  'sarah': '#FE9F62',
  'chang': '#55C2C0',
  'daniel': '#FEB313',
  'rachel': '#B87FFC'
};

const EXCLUSIVE_COLOR_SET = new Set(
  Object.values(EXCLUSIVE_MEMBER_COLORS).map(c => c.toUpperCase())
);

// Curated Palette of non-exclusive custom colors for newly added characters
const CUSTOM_PALETTE = [
  '#FF70A6', // Rose Pink
  '#4D96FF', // Vibrant Cobalt
  '#6BCB77', // Jade Green
  '#FFD93D', // Sunflower Yellow
  '#FF6B8B', // Flamingo Pink
  '#00D2D3', // Bright Cyan
  '#A66CFF', // Royal Lavender
  '#FFA07A', // Light Salmon
  '#20BF6B', // Emerald Sea
  '#45AAF2', // Sky Azure
  '#FA8231', // Tangerine
  '#8854D0', // Deep Violet
  '#26DE81', // Neon Mint
  '#4B7BEC', // Periwinkle Blue
  '#FC5C65', // Sunset Coral
  '#FED330', // Mustard Gold
  '#2BCBBA', // Ocean Turquoise
  '#FD9644', // Amber Apricot
  '#45B649', // Fresh Green
  '#E056FD', // Orchid
  '#686DE0', // Slate Indigo
  '#30336B', // Deep Sapphire
  '#FFBE76', // Mellow Peach
  '#BADC58', // Olive Lime
  '#F6E58D', // Vanilla Yellow
  '#7ED6DF', // Arctic Cyan
  '#E05DA9', // Deep Fuchsia
  '#48DBFB', // Electric Sky
  '#1DD1A1', // Tropical Aqua
  '#F368E0', // Soft Magenta
  '#00B894', // Mint Leaf
  '#0984E3', // Electron Blue
  '#6C5CE7', // Gloomy Purple
  '#D63031', // Chi-Gong Red
  '#E17055', // Orange Hibiscus
  '#FDCB6E', // Yolk Yellow
  '#00CEC9', // Robin Egg
  '#E84393', // Prunus Avium
  '#2D3436', // Charcoal
  '#575FCF'  // Iris
].filter(c => !EXCLUSIVE_COLOR_SET.has(c.toUpperCase()));

function hslToHex(h, s, l) {
  l /= 100;
  const a = s * Math.min(l, 1 - l) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

class NamesManager {
  constructor() {
    this.storageKey = 'lucky_wheel_names_v5';
    this.historyKey = 'lucky_wheel_history_v5';
    this.defaultNames = ['Haley', 'Rhea', 'Vivian', 'Sarah', 'Chang', 'Daniel', 'Rachel'];

    this.items = this.loadItems();
    this.history = this.loadHistory();
  }

  /**
   * Check if a name belongs to official preset company members
   */
  isPresetMember(name) {
    if (!name) return false;
    const clean = name.trim().toLowerCase();
    return Object.prototype.hasOwnProperty.call(EXCLUSIVE_MEMBER_COLORS, clean);
  }

  getPresetMemberColor(name) {
    if (!name) return null;
    const clean = name.trim().toLowerCase();
    return EXCLUSIVE_MEMBER_COLORS[clean] || null;
  }

  getDefaultItems() {
    if (window.COMPANY_MEMBERS && Array.isArray(window.COMPANY_MEMBERS) && window.COMPANY_MEMBERS.length > 0) {
      return window.COMPANY_MEMBERS.map(member => this.createItem(member));
    }
    return this.defaultNames.map(name => this.createItem(name));
  }

  /**
   * Find an unused custom color that is NOT in the exclusive set and NOT already used
   */
  getUniqueCustomColor(usedColorSet = new Set()) {
    // 1. Try curated custom palette first
    for (const color of CUSTOM_PALETTE) {
      const upper = color.toUpperCase();
      if (!EXCLUSIVE_COLOR_SET.has(upper) && !usedColorSet.has(upper)) {
        usedColorSet.add(upper);
        return color;
      }
    }

    // 2. Generate non-colliding HSL colors using Golden Ratio stepping
    for (let i = 0; i < 360; i++) {
      const hue = Math.round((i * 137.508) % 360);
      const hex = hslToHex(hue, 70, 60);
      const upper = hex.toUpperCase();
      if (!EXCLUSIVE_COLOR_SET.has(upper) && !usedColorSet.has(upper)) {
        usedColorSet.add(upper);
        return hex;
      }
    }

    return '#FF70A6';
  }

  loadItems() {
    try {
      const saved = localStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const usedColors = new Set();

          // Pass 1: Assign and reserve colors for preset members
          parsed.forEach(item => {
            if (this.isPresetMember(item.name)) {
              item.color = this.getPresetMemberColor(item.name);
              usedColors.add(item.color.toUpperCase());
              if (!item.avatar && window.COMPANY_MEMBERS) {
                const m = window.COMPANY_MEMBERS.find(cm => cm.name.toLowerCase() === item.name.toLowerCase());
                if (m) item.avatar = m.avatar;
              }
            }
          });

          // Pass 2: Ensure all custom members have UNIQUE, NON-EXCLUSIVE colors
          parsed.forEach(item => {
            if (!this.isPresetMember(item.name)) {
              const currentUpper = item.color ? item.color.toUpperCase() : '';
              // If color is missing, exclusive, or already used by another item
              if (!currentUpper || EXCLUSIVE_COLOR_SET.has(currentUpper) || usedColors.has(currentUpper)) {
                item.color = this.getUniqueCustomColor(usedColors);
              } else {
                usedColors.add(currentUpper);
              }
            }
          });

          return parsed;
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

  createItem(itemData) {
    let name = '';
    let avatar = '';
    let color = '';
    let enabled = true;

    if (typeof itemData === 'string') {
      name = itemData.trim();
      avatar = this.findAvatarForName(name);
    } else if (itemData && typeof itemData === 'object') {
      name = (itemData.name || '').trim();
      avatar = itemData.avatar || this.findAvatarForName(name);
      if (itemData.color) color = itemData.color;
      if (itemData.enabled !== undefined) enabled = !!itemData.enabled;
    }

    // Determine exclusive vs custom color
    if (this.isPresetMember(name)) {
      color = this.getPresetMemberColor(name);
    } else {
      // Newly added member: calculate current used colors
      const usedColors = new Set(this.items ? this.items.map(i => i.color ? i.color.toUpperCase() : '') : []);
      // Preset colors are also reserved
      EXCLUSIVE_COLOR_SET.forEach(c => usedColors.add(c));

      const upper = color ? color.toUpperCase() : '';
      if (!upper || EXCLUSIVE_COLOR_SET.has(upper) || usedColors.has(upper)) {
        color = this.getUniqueCustomColor(usedColors);
      }
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

  getActiveItems() {
    return this.items.filter(item => item.enabled);
  }

  addWinnerToHistory(name, avatar = '') {
    const record = {
      id: 'rec_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 4),
      name: name,
      avatar: avatar || this.findAvatarForName(name),
      timestamp: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
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
