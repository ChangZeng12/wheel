# 项目设计规范文档 (Design Specification) - 浅色模式 (Nintendo Switch 2 风格)

> **核心原则**：本项目所有 UI/UX 设计、样式定义、图形渲染与动效实现必须**严格遵循**本文档规范。任何后续代码提交与功能迭代均以此规范为最高准则。

---

## 🚫 硬性约束与禁令 (Strict Constraints)

1. **严禁任何蓝色或紫色的渐变设计**：
   - ❌ 绝对禁止使用任何包含蓝色或紫色的渐变色（`linear-gradient`、`radial-gradient`）。
   - ❌ 绝对禁止使用弥散光影、发光晕染（Glow / Blur / Ambient Haze）。
2. **拒绝过度装饰与拟物化**：
   - ❌ 禁用厚重模糊阴影、繁杂纹理、毛玻璃高斯模糊。
   - ✅ 采用纯粹的**极简平面几何风格（Minimalist Flat Geometric Style）**，参考任天堂 Switch 2 浅色模式 UI。

---

## 🎨 视觉风格：任天堂 Switch 2 极简浅色几何风格

- **基底主调**：指定背景色 `#EBEBEB`，搭配纯白卡片 `#FFFFFF` 与高对比度深黑文字 `#1F1F1F`。
- **标志性配色**：以任天堂经典红（Switch Red `#E60012`）、暗炭黑（`#2D2D2D`）、纯白与高饱和平面几何对比色为主。
- **结构与交互**：
  - 模块如同 Switch 主界面卡片（Tiles），边界清晰（`1px~2px solid #D8D8D8`）。
  - 按键具备鲜明实体感与即时按压反馈。
  - 排版利落，具有清晰的信息层级与高可读性。

---

## 📐 色彩系统 (Color Palette)

### 1. 中性浅色基底 (Light Surfaces & Structure)
- **主背景色 (Bg Base)**: `#EBEBEB` (硬性指定)
- **主要面板/卡片 (Panel / Card)**: `#FFFFFF` (纯白平面卡片)
- **次级表面/悬停 (Surface / Hover)**: `#F5F5F5` / `#EAEAEA`
- **输入框底色 (Input Bg)**: `#FFFFFF`
- **几何边界线 (Borders)**: 
  - 常规分割线：`#D8D8D8` (1px Solid)
  - 强调/聚焦边界：`#E60012` 或 `#2D2D2D` (2px Solid)

### 2. 标志与强调色 (Accents - Solid Only)
- **主强调色 (Primary - Switch Red)**: `#E60012` (悬停: `#CC0010`)
- **辅助几何色 (Geometric Color Accents)**:
  - 经典暗炭黑 (Charcoal): `#2D2D2D`
  - 阳光金黄 (Amber / Gold): `#F5A623`
  - 薄荷绿 (Mint Emerald): `#00C389`
  - 活力橙 (Tangerine): `#FF6B00`
  - 珊瑚粉 (Coral): `#FF5A5F`
- **文字层级 (Typography Colors)**:
  - 主标题/重点文字: `#1F1F1F` (高对比度深灰黑)
  - 正文/次要信息: `#595959`
  - 辅助/占位文字: `#8C8C8C`

---

## 🔲 几何形状与组件规范 (Components)

### 1. 转盘核心 (Canvas Wheel)
- **背景与外圈**：纯白 `#FFFFFF` 底盘，搭配 `#2D2D2D` 或 `#D8D8D8` 纯净双圈外边框。
- **扇区填充**：使用 Switch 风格平涂纯色，相邻扇区使用 `2px solid #FFFFFF` 纯白线条干净切割。
- **指针与中心轴**：Switch Red `#E60012` 纯几何指针与中心实体圆轴。

### 2. 按钮与操作控件
- **主按钮**：Switch Red `#E60012` 实心纯色按钮，白字加粗，清晰按压态。
- **操作卡片与芯片**：白底黑字，`1px solid #D8D8D8`，悬停即时深色反差。

### 3. 弹窗与抽屉 (Modals)
- **背景遮罩**：`rgba(0, 0, 0, 0.45)` 干净暗化。
- **弹窗主体**：纯白 `#FFFFFF` 面板，`2px solid #2D2D2D` 实体硬边。
