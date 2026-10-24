import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  Layers,
  Video,
  LineChart,
  Split,
  ShieldCheck,
  CheckCircle2,
  Mail,
  Copy,
  Check,
  ExternalLink,
  Play,
  Lock,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LandingPageProps {
  onNavigate: (view: 'home' | 'studio' | 'dashboard' | 'login') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { isAuthenticated, isPermitted } = useAuth();
  const [copiedEmail, setCopiedEmail] = useState(false);

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('sakekmasudparvez@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  return (
    <div className="landing-page-root">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-glow-backdrop" />
        <div className="hero-container">
          <div className="hero-badge">
            <Sparkles size={14} className="hero-badge-icon" />
            <span>CodeStudio 26 • Next-Gen AI & Code Animation Studio</span>
          </div>

          <h1 className="hero-title">
            Animate Source Code & <br />
            <span className="gradient-text">Deep Learning Architectures</span>
          </h1>

          <p className="hero-subtitle">
            Turn coding tutorials, machine learning research, and technical presentations into
            frame-accurate animations. Create progressive code typing, CNN/RNN/LSTM/YOLO model
            diagrams, and Matplotlib simulations — with native 1080p/4K MP4 export directly from your browser.
          </p>

          <div className="hero-cta-group">
            <button
              type="button"
              className="btn btn-primary btn-hero"
              onClick={() => (isPermitted ? onNavigate('studio') : onNavigate('login'))}
            >
              <Video size={18} />
              <span>{isPermitted ? 'Launch Studio Workspace' : 'Get Studio Access'}</span>
              <ArrowRight size={16} />
            </button>

            <a href="#about-creator-section" className="btn btn-secondary btn-hero">
              <Mail size={16} />
              <span>About Creator</span>
            </a>

            {isAuthenticated && (
              <button
                type="button"
                className="btn btn-secondary btn-hero"
                onClick={() => onNavigate('dashboard')}
              >
                <ShieldCheck size={16} />
                <span>Open Dashboard</span>
              </button>
            )}
          </div>

          {/* Quick RBAC Banner */}
          <div className="hero-rbac-notice">
            <ShieldCheck size={14} className="text-emerald" />
            <span>
              Protected by <strong>Auth0 RBAC</strong> — Admin approval required for studio video generation.
            </span>
          </div>

          {/* Live Studio Interactive Preview Showcase */}
          <div className="hero-preview-wrapper">
            <div className="hero-preview-window">
              <div className="window-header">
                <div className="window-dots">
                  <span className="dot dot-red" />
                  <span className="dot dot-yellow" />
                  <span className="dot dot-green" />
                </div>
                <div className="window-title">code_studio_preview.py — 1920×1080 60FPS</div>
                <div className="window-status-badge">
                  <span className="pulse-indicator" /> LIVE ENGINE
                </div>
              </div>

              <div className="hero-preview-body">
                <div className="preview-code-pane">
                  <pre className="code-snippet">
                    <code>
                      <span className="code-kw">import</span> torch{'\n'}
                      <span className="code-kw">import</span> torch.nn <span className="code-kw">as</span> nn{'\n'}
                      {'\n'}
                      <span className="code-comment"># Modern Vision & Sequence Models</span>{'\n'}
                      cnn = nn.Conv2d(in_channels=<span className="code-num">3</span>, out_channels=<span className="code-num">16</span>, kernel_size=<span className="code-num">3</span>){'\n'}
                      lstm = nn.LSTM(input_size=<span className="code-num">64</span>, hidden_size=<span className="code-num">128</span>, batch_first=<span className="code-bool">True</span>){'\n'}
                      yolo = YOLOv8(weights=<span className="code-str">"yolov8x.pt"</span>, grid_size=<span className="code-num">7</span>){'\n'}
                      {'\n'}
                      <span className="code-fn">print</span>(<span className="code-str">"CodeStudio 26: Ready to animate!"</span>)
                    </code>
                  </pre>
                </div>

                <div className="preview-art-pane">
                  <div className="diagram-card">
                    <div className="diagram-chip">CNN 3D Feature Map</div>
                    <div className="diagram-art cnn-art">
                      <div className="cube-layer c-in" />
                      <div className="cube-arrow">→</div>
                      <div className="cube-layer c-k" />
                      <div className="cube-arrow">→</div>
                      <div className="cube-layer c-out" />
                    </div>
                  </div>

                  <div className="diagram-card">
                    <div className="diagram-chip">YOLO Detection Grid</div>
                    <div className="diagram-art yolo-art">
                      <div className="grid-box b1" />
                      <div className="grid-box b2" />
                      <span className="grid-label">Car: 94%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hero-preview-footer">
                <div className="preview-playback-snippet">
                  <Play size={13} fill="currentColor" />
                  <span>Timeline: 00:14.0 / 00:48.0</span>
                  <div className="preview-mini-track">
                    <div className="preview-mini-progress" style={{ width: '45%' }} />
                  </div>
                </div>
                <div className="preview-tag-list">
                  <span className="tag">Photoshop Layers</span>
                  <span className="tag">Native MP4</span>
                  <span className="tag">Auth0 RBAC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid Section */}
      <section id="features-section" className="features-section">
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-kicker">POWERFUL CAPABILITIES</span>
            <h2 className="section-title">Built for Modern AI Engineers & Educators</h2>
            <p className="section-desc">
              Everything you need to create captivating technical visual content without heavy desktop video editing suites.
            </p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-box">
                <Code2 size={24} className="text-blue" />
              </div>
              <h3 className="feature-name">Progressive Code Typing</h3>
              <p className="feature-text">
                Character-by-character syntax-highlighted typing animations with auto-scrolling, active line highlight, and blinking terminal cursor.
              </p>
              <ul className="feature-points">
                <li><CheckCircle2 size={13} /> Tokenized syntax highlighting</li>
                <li><CheckCircle2 size={13} /> Configurable typing speed & pauses</li>
                <li><CheckCircle2 size={13} /> Integrated notebook outputs</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <Cpu size={24} className="text-purple" />
              </div>
              <h3 className="feature-name">Deep Learning Visualizers</h3>
              <p className="feature-text">
                Animated neural network architectures: Multi-Layer Perceptrons (ANN), CNN sliding kernels, RNN unrolled loops, LSTM cell highway gates, and YOLOv8 object detection grids.
              </p>
              <ul className="feature-points">
                <li><CheckCircle2 size={13} /> Dynamic synapse pulses & softmax bars</li>
                <li><CheckCircle2 size={13} /> Forget, input & output gate equations</li>
                <li><CheckCircle2 size={13} /> NMS bounding box evaluation</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <LineChart size={24} className="text-cyan" />
              </div>
              <h3 className="feature-name">Matplotlib Figure Simulation</h3>
              <p className="feature-text">
                Authentic Matplotlib window simulation complete with coordinate readouts, interactive navigation toolbar, and progressive curve rendering.
              </p>
              <ul className="feature-points">
                <li><CheckCircle2 size={13} /> Real matplotlib look and toolbar icons</li>
                <li><CheckCircle2 size={13} /> Loss curves & accuracy trajectories</li>
                <li><CheckCircle2 size={13} /> Live canvas coordinate tracking</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <Split size={24} className="text-emerald" />
              </div>
              <h3 className="feature-name">Decision Boundaries & Clustering</h3>
              <p className="feature-text">
                2D classification surfaces for SVM (RBF kernels), Logistic Regression, and KNN, plus t-SNE / PCA clustering and 2D loss contour gradient descent.
              </p>
              <ul className="feature-points">
                <li><CheckCircle2 size={13} /> Contour decision boundaries</li>
                <li><CheckCircle2 size={13} /> Gradient vector downhill paths</li>
                <li><CheckCircle2 size={13} /> Centroid convergence animations</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <Layers size={24} className="text-amber" />
              </div>
              <h3 className="feature-name">Photoshop CC Layers Workflow</h3>
              <p className="feature-text">
                Manage your animation timeline with an authentic CC Layers palette aesthetic: visibility eye toggles, color badges, ordering controls, and live selection previews.
              </p>
              <ul className="feature-points">
                <li><CheckCircle2 size={13} /> Instant stage preview on cell selection</li>
                <li><CheckCircle2 size={13} /> One-click mute / eye toggling</li>
                <li><CheckCircle2 size={13} /> Deep Adobe blue active selection state</li>
              </ul>
            </div>

            <div className="feature-card">
              <div className="feature-icon-box">
                <Video size={24} className="text-rose" />
              </div>
              <h3 className="feature-name">Native MP4 Video Export</h3>
              <p className="feature-text">
                Export native, frame-accurate `.mp4` video files directly from browser memory using pure AVC1/H.264 streams with zero server lag and multi-resolution auto-export.
              </p>
              <ul className="feature-points">
                <li><CheckCircle2 size={13} /> High-compatibility H.264 / AVC1</li>
                <li><CheckCircle2 size={13} /> 1080p, 2K, and 4K resolutions</li>
                <li><CheckCircle2 size={13} /> 100% client-side zero server compute</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Creator / About Me Section (Required by User) */}
      <section id="about-creator-section" className="about-creator-section">
        <div className="section-container">
          <div className="creator-card">
            <div className="creator-grid">
              {/* Creator Details */}
              <div className="creator-details">
                <div className="creator-badge">
                  <ShieldCheck size={14} className="text-amber" />
                  <span>CREATOR & PRINCIPAL ARCHITECT</span>
                </div>

                <h2 className="creator-name">Salek Masud Parvez</h2>
                <div className="creator-role-title">
                  Full-Stack AI/ML Engineer & Systems Developer
                </div>

                <p className="creator-bio">
                  Hi! I'm <strong>Salek Masud Parvez</strong>. I designed and built{' '}
                  <strong>CodeStudio 26</strong> to solve a fundamental problem in software
                  and AI education: making code motion and complex deep learning concepts
                  visually intuitive, effortless to animate, and ready to share instantly.
                </p>

                <p className="creator-bio">
                  With a background spanning React 19, TypeScript, PostgreSQL databases, Canvas 2D
                  rendering architectures, and PyTorch deep learning models, I build software that
                  merges engineering rigor with delightful user experience.
                </p>

                {/* Contact Information & Action Pills */}
                <div className="creator-contact-box">
                  <div className="contact-row">
                    <div className="contact-item">
                      <Mail size={16} className="contact-icon text-blue" />
                      <div className="contact-text-wrap">
                        <span className="contact-label">Email Address</span>
                        <a
                          href="mailto:sakekmasudparvez@gmail.com"
                          className="contact-value"
                        >
                          sakekmasudparvez@gmail.com
                        </a>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-copy-email"
                      onClick={handleCopyEmail}
                      title="Copy email to clipboard"
                    >
                      {copiedEmail ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                      <span>{copiedEmail ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div className="contact-row">
                    <div className="contact-item">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="contact-icon text-purple"
                      >
                        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
                      </svg>
                      <div className="contact-text-wrap">
                        <span className="contact-label">GitHub Profile</span>
                        <a
                          href="https://github.com/salekmasudparvez1"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="contact-value"
                        >
                          github.com/salekmasudparvez1
                        </a>
                      </div>
                    </div>
                    <a
                      href="https://github.com/salekmasudparvez1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-external-link"
                      title="Open GitHub"
                    >
                      <ExternalLink size={14} />
                      <span>Visit</span>
                    </a>
                  </div>
                </div>

                {/* Tech Stack Chips */}
                <div className="creator-skills-wrap">
                  <span className="skills-heading">Technical Stack & Architecture:</span>
                  <div className="skills-badges">
                    <span className="skill-chip">React 19</span>
                    <span className="skill-chip">TypeScript 7</span>
                    <span className="skill-chip">PostgreSQL (Pooled)</span>
                    <span className="skill-chip">Auth0 RBAC</span>
                    <span className="skill-chip">Canvas 2D API</span>
                    <span className="skill-chip">Vite 8</span>
                    <span className="skill-chip">PyTorch & DL</span>
                    <span className="skill-chip">MediaRecorder MP4</span>
                  </div>
                </div>
              </div>

              {/* Creator Card Right / RBAC Summary */}
              <div className="creator-side-card">
                <div className="creator-avatar-wrap">
                  <div className="creator-avatar-placeholder">
                    <span>SMP</span>
                  </div>
                  <div className="creator-status-ring">
                    <span className="online-dot" />
                    <span>Project Administrator</span>
                  </div>
                </div>

                <div className="admin-status-panel">
                  <div className="panel-title-row">
                    <ShieldCheck size={16} className="text-amber" />
                    <h4>Studio Security & Access Control</h4>
                  </div>
                  <p className="panel-desc">
                    CodeStudio 26 implements enterprise <strong>Role-Based Access Control (RBAC)</strong>.
                    Only users with <strong>APPROVED</strong> permission status can generate video content in the Studio.
                  </p>

                  <div className="rbac-roles-list">
                    <div className="rbac-role-card">
                      <div className="rbac-role-header">
                        <span className="role-badge role-admin">ADMIN</span>
                        <span className="role-status-tag">Full Control</span>
                      </div>
                      <p className="role-desc">
                        Assigned to <code>sakekmasudparvez@gmail.com</code>. Can approve/reject studio access, manage users, and configure the platform.
                      </p>
                    </div>

                    <div className="rbac-role-card">
                      <div className="rbac-role-header">
                        <span className="role-badge role-user">USER</span>
                        <span className="role-status-tag">Permitted Access</span>
                      </div>
                      <p className="role-desc">
                        Approved developers and educators with access to create animations, edit cells, and export MP4 videos.
                      </p>
                    </div>
                  </div>

                  <div className="admin-actions-box">
                    {isAuthenticated ? (
                      <button
                        type="button"
                        className="btn btn-primary btn-block"
                        onClick={() => onNavigate('dashboard')}
                      >
                        <ShieldCheck size={15} />
                        <span>Open RBAC Management Console</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-block"
                        onClick={() => onNavigate('login')}
                      >
                        <Lock size={15} />
                        <span>Sign In with Auth0 to Request Access</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <img src="/logo.svg" alt="CodeStudio 26 Logo" className="footer-logo" />
            <span className="footer-brand-name">CodeStudio 26</span>
          </div>

          <p className="footer-copy">
            Designed & Developed by <strong>Salek Masud Parvez</strong> (
            <a href="mailto:sakekmasudparvez@gmail.com">sakekmasudparvez@gmail.com</a> •{' '}
            <a href="https://github.com/salekmasudparvez1" target="_blank" rel="noopener noreferrer">
              @salekmasudparvez1
            </a>
            ). Licensed under MIT.
          </p>

          <div className="footer-links">
            <button type="button" onClick={() => onNavigate('home')}>Home</button>
            <button type="button" onClick={() => onNavigate('studio')}>Studio</button>
            <button type="button" onClick={() => onNavigate('login')}>Login</button>
          </div>
        </div>
      </footer>
    </div>
  );
};
