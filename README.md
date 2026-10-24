# CodeStudio 26 · AI & Code Motion Engine

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Deployment](https://img.shields.io/badge/Vercel-Live-black.svg)](https://code-animation-26.vercel.app/)
[![React 19](https://img.shields.io/badge/React-19.3-61dafb.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.0-3178c6.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.2-336791.svg)](https://www.postgresql.org/)
[![Auth0](https://img.shields.io/badge/Auth0-RBAC-eb5424.svg)](https://auth0.com/)

A modern, modular React 19 & TypeScript studio for creating cinematic line-by-line coding animations, deep learning architectures (ANN, CNN, RNN, LSTM, YOLO), interactive AI/ML visualizations, and Matplotlib figure animations into frame-accurate recorded MP4 videos.

**Live Production Deployment**: [https://code-animation-26.vercel.app/](https://code-animation-26.vercel.app/)

---

## 👨‍💻 Creator & Principal Architect

- **Name**: **Salek Masud Parvez**
- **Email**: [sakekmasudparvez@gmail.com](mailto:sakekmasudparvez@gmail.com)
- **GitHub**: [@salekmasudparvez1](https://github.com/salekmasudparvez1)
- **Repository**: [https://github.com/salekmasudparvez1/code-studio-26](https://github.com/salekmasudparvez1/code-studio-26)

---

## 🔐 Auth0 RBAC & PostgreSQL Backend

CodeStudio 26 implements enterprise **Role-Based Access Control (RBAC)** powered by PostgreSQL (`studio_users`):

- **ADMIN Role**: Assigned to `sakekmasudparvez@gmail.com` with `APPROVED` permission status. Full access to create animations, plus access to the **Admin RBAC Management Console** in the Dashboard to approve/reject user studio permissions and toggle roles.
- **USER Role**: Permitted developers and educators with approved access to create animations, edit cells, scrub the timeline, and export native MP4 videos.
- **Studio Gatekeeper**: Any account with `PENDING` or `REJECTED` status is gracefully restricted with a status review screen until approved by Administrator Salek Masud Parvez.

### Database Schema (`studio_users`)
- `id` (VARCHAR PRIMARY KEY)
- `email` (VARCHAR UNIQUE NOT NULL)
- `name` (VARCHAR)
- `picture` (TEXT)
- `role` (`'USER'` | `'ADMIN'`)
- `status` (`'PENDING'` | `'APPROVED'` | `'REJECTED'`)
- `created_at`, `updated_at`, `last_login_at` (TIMESTAMPTZ)

---

## 🎨 Photoshop-Inspired Studio & Modular Architecture

- **Photoshop Layers Panel**: Photoshop CC dark-matte layer aesthetics with layer visibility eyes, Adobe-style colored layer thumbnails, signature active layer blue highlight (`#162c4a` with `#0091ff` border), and hover reordering actions.
- **Header with `logo.svg`**: Integrated official vector brand logo.
- **Native MP4 Direct Video Export**: Direct 1-click in-browser `.mp4` video export (H.264/AVC1 codec) supported out of the box with zero external conversion needed in Chromium/Chrome/Edge/Safari.
- **Fullscreen HUD Presentation Mode**: Floating translucent frosted glass control bar with auto-hiding controls on mouse idle, top-right exit pill, and keyboard navigation.
- **Modular Styles in `src/styles/`**:
  - `variables.css`: Photoshop dark theme tokens and color accents.
  - `base.css`: Base resets, body layout, custom dark scrollbars.
  - `navbar.css`: Top global navigation bar with user profile & role badge.
  - `header.css`: Studio header with logo.svg branding.
  - `sidebar.css`: Sidebar layout, Photoshop panel headers, quick stats.
  - `layers.css`: Photoshop-inspired layers stack, active state, eye toggle, badges, dropdown.
  - `inspector.css`: Form inputs, selects, sliders, color pickers, sub-inspector panels.
  - `canvas.css`: 1920x1080 canvas stage preview container & fullscreen HUD overlay.
  - `timeline.css`: Transport controls, time display pill, scrubber.
  - `components.css`: Button variants, badges, cards, export progress bar.
  - `landing.css`: Informative frontend hero, features grid, creator bio, and live preview.
  - `auth.css`: Auth0 login card, error alerts, quick role profiles.
  - `dashboard.css`: User profile overview, metrics cards, and live user access table.
  - `gatekeeper.css`: Studio access restriction and pending review screens.
  - `index.css`: Master aggregator.

---

## 🧠 AI / ML & Deep Learning Visualization Engines

### 1. 🧬 ANN (Artificial Neural Network / MLP)
- Multi-layer feedforward network with forward-pass animated signal pulses and live output softmax probabilities.

### 2. 🖼️ CNN (Convolutional Neural Network)
- 3D input volume slices ($32 \times 32 \times 3$ RGB channels).
- **Animated sliding $3 \times 3$ convolutional kernel window** projecting receptive field onto Conv 1 feature maps.
- MaxPool 2×2 spatial downsampling layer and dense category predictions.

### 3. 🔁 RNN (Recurrent Neural Network Unrolled)
- Folded cell view on left with self-recurrent loop $W_{hh}$.
- **Unrolled sequence view** across time steps ($t=1, 2, 3, 4$) updating hidden states $h_t = \tanh(W_{xh} x_t + W_{hh} h_{t-1} + b)$.

### 4. ⚡ LSTM (Long Short-Term Memory Highway)
- Top highway: Cell State $C_{t-1} \to C_t$.
- Bottom highway: Hidden State $h_{t-1} \to h_t$.
- **Forget Gate** ($\sigma$), **Input Gate** ($\sigma \times \tanh$), and **Output Gate** ($\sigma \times \tanh$) with animated signal illumination.

### 5. 🎯 YOLOv8 (Real-Time Object Detection)
- $S \times S$ feature map grid overlay ($7 \times 7$).
- Anchor box proposals with **Non-Maximum Suppression (NMS)** and target lock bounding boxes (`car 94%`, `person 89%`, `dog 92%`).

### 6. 📊 Matplotlib Custom Code Animation (`plt.show`)
- Authentic Matplotlib Figure window frame with navigation toolbar (Home, Back, Pan, Zoom, Subplots, Save).
- Configurable Python script with progressive curve drawing and live coordinate tracker.

### 7. 🎯 Decision Boundaries (SVM / KNN / Logistic)
- Separating hyperplanes, margin lines, and support vectors.

### 8. 🌌 Embeddings & Clustering (t-SNE / PCA / K-Means)
- 2D dimensionality reduction animation with glowing centroids and dispersion hulls.

### 9. 📉 Gradient Descent Animation
- Convex loss bowl $J(w_1, w_2)$ with optimizer ball stepping downhill along negative gradient vector $-\eta \nabla J(w_t)$.

---

## ⌨️ Studio Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>Space</kbd> | Play / Pause |
| <kbd>R</kbd> | Reset timeline to start |
| <kbd>←</kbd> (Left Arrow) or <kbd>J</kbd> | Step backward **1 second** |
| <kbd>Shift</kbd> + <kbd>←</kbd> | Step backward **5 seconds** |
| <kbd>→</kbd> (Right Arrow) or <kbd>L</kbd> | Step forward **1 second** |
| <kbd>Shift</kbd> + <kbd>→</kbd> | Step forward **5 seconds** |
| <kbd>,</kbd> / <kbd>.</kbd> | Frame-by-frame backward / forward ($1/30$s) |
| <kbd>F</kbd> | Toggle Fullscreen mode |
| <kbd>Esc</kbd> | Exit Fullscreen mode |

---

## 🛠️ Getting Started

```bash
# Clone the repository
git clone https://github.com/salekmasudparvez1/code-studio-26.git
cd code-studio-26

# Install dependencies
pnpm install

# Start Vite development server
pnpm dev

# Build for production
pnpm build

# Run Playwright test suite
pnpm test
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) - Copyright (c) 2026 Salek Masud Parvez.
