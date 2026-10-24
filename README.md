# Code Animation Studio · Multi‑Cell Pro (React Edition)

A modern, modular React 19 & TypeScript studio for creating line-by-line coding animations, deep learning architectures, interactive AI/ML visualizations, and Matplotlib figure animations into seamless recorded MP4/WebM videos.

## 🎨 Photoshop-Inspired Studio & Modular Architecture

- **Photoshop Layers Panel**: Photoshop CC dark-matte layer aesthetics with layer visibility eyes, Adobe-style colored layer thumbnails, signature active layer blue highlight (`#162c4a` with `#0091ff` border), and hover reordering actions.
- **Header with `logo.svg`**: Integrated official vector brand logo.
- **Native MP4 Direct Video Export**: Direct 1-click in-browser `.mp4` video export (H.264/AVC1 codec) supported out of the box with zero external conversion needed in Chromium/Chrome/Edge/Safari.
- **Modular Styles in `src/styles/`**:
  - `variables.css`: Photoshop dark theme tokens and color accents.
  - `base.css`: Base resets, body layout, custom dark scrollbars.
  - `header.css`: Studio header with logo.svg branding.
  - `sidebar.css`: Sidebar layout, Photoshop panel headers, quick stats.
  - `layers.css`: Photoshop-inspired layers stack, active state, eye toggle, badges, dropdown.
  - `inspector.css`: Form inputs, selects, sliders, color pickers, sub-inspector panels.
  - `canvas.css`: 1920x1080 canvas stage preview container.
  - `timeline.css`: Transport controls, time display pill, scrubber.
  - `components.css`: Button variants, badges, cards, export progress bar.
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

## 🛠️ Getting Started

```bash
# Start Vite development server
pnpm dev

# Build for production
pnpm build

# Run automated Playwright tests
pnpm test
```
