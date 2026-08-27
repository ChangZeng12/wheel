# Lucky Wheel WebApp

A modern, fast, and ready-to-use lucky wheel web application for name selection and raffles.

---

## Core Features

1. **Central High-Definition Canvas Wheel**:
   - Dynamic sector angle calculation and adaptive color schemes with 4K/Retina high-DPI antialiasing support.
   - Realistic physics deceleration engine (quintic smooth curve) with top pointer collision micro-animation (`tick-bounce`).
   - Integrated Web Audio API mechanical gear ticking, spin-up sound effects, and victory fanfare chords.
2. **Name and Participant Management**:
   - **Selection Control**: Check or uncheck candidates anytime to dynamically add or remove wheel sectors in real time.
   - **Single Add & Batch Import**: Support single name input or large text pasting (with automatic splitting by commas or line breaks).
   - **Quick Actions**: One-click Select All, Deselect All, Shuffle, and Clear All.
3. **Winner Modal and Flow**:
   - Full-screen colorful confetti celebration triggered upon winning.
   - **Close**: Keep the winner in the wheel candidate pool.
   - **Remove from Wheel**: Automatically uncheck the winner in the list, reallocating wheel sectors evenly for consecutive non-repeating draws.
   - **Spin Again**: Instantly trigger the next spin round.
4. **User Experience Enhancements**:
   - Sound toggle (mute/unmute).
   - Side drawer for winning history log with timestamps.
   - Keyboard shortcuts: **Space** to spin, **Esc** to close modals.

---

## Project Structure

```
wheel/
├── index.html          # Main HTML structure and semantic layout
├── assets/             # Icons, sounds, and media resources
├── styles/
│   ├── main.css        # Global theme, layout, typography, and controls
│   ├── wheel.css       # Wheel container, indicator, and animations
│   └── modal.css       # Winner dialog, batch import, and history drawer
├── js/
│   ├── audio.js        # Web Audio API sound synthesizer (no external audio files required)
│   ├── confetti.js     # Fullscreen confetti particle physics engine
│   ├── wheel.js        # Canvas 2D wheel renderer, physics, and collision detection
│   ├── names.js        # State management, local storage persistence, and presets
│   ├── members.js      # Default member list presets
│   └── app.js          # Main application controller and UI event bindings
├── server.js           # Lightweight static HTTP server (Node.js built-in module)
└── README.md           # Project documentation and guide
```

---

## Getting Started

Built with vanilla web platform technologies and **zero third-party npm dependencies**, this project runs directly on any computer with a modern browser or Node.js.

### Option 1: Node.js Local Server (Recommended)
Open a terminal in the project directory and run:
```bash
node server.js
```
Then visit in your browser: `http://localhost:3000`

### Option 2: Direct File Open
Simply double-click `index.html` in any modern web browser (Chrome, Edge, Safari, Firefox) to run the application immediately.
