import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Shield,
  FileText,
  Receipt,
  Bell,
  Wallet,
  Sparkles,
  Menu,
  X,
  ArrowRight,
  Upload,
  BrainCircuit,
  Database,
  CheckCircle2,
  BadgeCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Welcome.css';

/* ------------------------------------------------------------------
 * useReveal — tiny IntersectionObserver hook that adds `is-visible`
 * to any element with the `reveal` class once it scrolls into view.
 * Respects prefers-reduced-motion by doing nothing (CSS handles the
 * static fallback in that case).
 * ------------------------------------------------------------------ */
const useScrollReveal = () => {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const targets = document.querySelectorAll('.reveal');

    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -60px 0px' }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
};

/* ------------------------------------------------------------------
 * AI showcase — a scripted, purely illustrative conversation. This
 * demonstrates the product; it never calls the API or touches any
 * real user's LifeVault data.
 * ------------------------------------------------------------------ */
const DEMO_QUESTION = 'Which bills do I need to pay soon?';
const DEMO_ANSWER =
  'You have 2 upcoming bills:\n\nElectricity — ₹750 — due in 3 days\nInternet — ₹999 — due in 6 days';

const AIShowcase = () => {
  const [typed, setTyped] = useState('');
  const [started, setStarted] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !started) {
            setStarted(true);
            if (prefersReducedMotion) {
              setTyped(DEMO_ANSWER);
              return;
            }
            let i = 0;
            const interval = setInterval(() => {
              i += 1;
              setTyped(DEMO_ANSWER.slice(0, i));
              if (i >= DEMO_ANSWER.length) clearInterval(interval);
            }, 18);
          }
        });
      },
      { threshold: 0.4 }
    );

    observer.observe(node);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [started]);

  return (
    <div className="ai-demo" ref={containerRef}>
      <div className="ai-demo__window">
        <div className="ai-demo__titlebar">
          <span className="ai-demo__dot" />
          <span className="ai-demo__dot" />
          <span className="ai-demo__dot" />
          <span className="ai-demo__titlebar-label">Ask LifeVault</span>
        </div>
        <div className="ai-demo__body">
          <div className="ai-demo__bubble ai-demo__bubble--user">{DEMO_QUESTION}</div>
          <div className="ai-demo__bubble ai-demo__bubble--ai">
            <Sparkles size={14} className="ai-demo__spark" />
            <span style={{ whiteSpace: 'pre-line' }}>
              {typed}
              {started && typed.length < DEMO_ANSWER.length && <span className="ai-demo__cursor" />}
            </span>
          </div>
        </div>
      </div>
      <p className="ai-demo__disclaimer">
        Illustrative preview — LifeVault AI always answers from your own private vault, never anyone else's.
      </p>
    </div>
  );
};

const FEATURES = [
  {
    icon: FileText,
    title: 'Document Intelligence',
    description: 'Upload a bill and let AI understand it — amounts, due dates, and providers, extracted automatically.',
  },
  {
    icon: Receipt,
    title: 'Smart Expenses',
    description: 'Track where your money goes with clear category breakdowns and month-over-month trends.',
  },
  {
    icon: Wallet,
    title: 'Asset Management',
    description: 'Keep your important assets and warranties organized, with expiry alerts before they lapse.',
  },
  {
    icon: Bell,
    title: 'Smart Reminders',
    description: 'Never miss an important due date — reminders that even mark themselves paid.',
  },
  {
    icon: Sparkles,
    title: 'LifeVault AI',
    description: 'Ask questions about your own personal information and get grounded, private answers.',
  },
];

const AUTOMATION_STEPS = [
  { icon: Upload, label: 'Upload document' },
  { icon: BrainCircuit, label: 'AI understands it' },
  { icon: Database, label: 'Stored in your vault' },
  { icon: Bell, label: 'Reminder created' },
];

const PAYMENT_STEPS = [
  { icon: Bell, label: 'Bill due', tone: 'due' },
  { icon: Receipt, label: 'Expense recorded', tone: 'neutral' },
  { icon: CheckCircle2, label: 'Reminder completed', tone: 'success' },
];

const NAV_LINKS = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
  { href: '#ai', label: 'AI' },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useScrollReveal();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  const handleNavClick = (href) => (e) => {
    e.preventDefault();
    closeMobileNav();
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="welcome">
      {/* ---------------- Navigation ---------------- */}
      <header className={`welcome-nav ${scrolled ? 'welcome-nav--scrolled' : ''}`}>
        <div className="welcome-nav__inner">
          <Link to="/" className="welcome-nav__brand">
            <span className="welcome-nav__logo">
              <Shield size={20} />
            </span>
            <span>LifeVault</span>
          </Link>

          <nav className="welcome-nav__links" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={handleNavClick(link.href)}>
                {link.label}
              </a>
            ))}
          </nav>

          <div className="welcome-nav__actions">
            {user ? (
              <button type="button" className="btn btn--primary btn--sm" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
                <ArrowRight size={16} />
              </button>
            ) : (
              <>
                <Link to="/login" className="btn btn--ghost btn--sm">
                  Sign In
                </Link>
                <Link to="/register" className="btn btn--primary btn--sm">
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            className="welcome-nav__toggle"
            onClick={() => setMobileNavOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={mobileNavOpen}
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileNavOpen && (
          <div className="welcome-nav__mobile">
            {NAV_LINKS.map((link) => (
              <a key={link.href} href={link.href} onClick={handleNavClick(link.href)}>
                {link.label}
              </a>
            ))}
            <div className="welcome-nav__mobile-actions">
              {user ? (
                <button type="button" className="btn btn--primary btn--full" onClick={() => navigate('/dashboard')}>
                  Go to Dashboard
                </button>
              ) : (
                <>
                  <Link to="/login" className="btn btn--ghost btn--full" onClick={closeMobileNav}>
                    Sign In
                  </Link>
                  <Link to="/register" className="btn btn--primary btn--full" onClick={closeMobileNav}>
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ---------------- Hero ---------------- */}
      <section className="welcome-hero">
        <div className="welcome-hero__glow welcome-hero__glow--1" aria-hidden="true" />
        <div className="welcome-hero__glow welcome-hero__glow--2" aria-hidden="true" />
        <div className="welcome-hero__glow welcome-hero__glow--3" aria-hidden="true" />

        <div className="welcome-hero__inner">
          <div className="welcome-hero__copy reveal">
            <span className="welcome-eyebrow">
              <Sparkles size={14} />
              AI-powered personal vault
            </span>
            <h1 className="welcome-hero__title">
              Your personal life,
              <br />
              organized intelligently.
            </h1>
            <p className="welcome-hero__subtitle">
              LifeVault brings your documents, expenses, assets, reminders, and AI assistance together in one
              intelligent personal vault.
            </p>
            <div className="welcome-hero__actions">
              <Link to={user ? '/dashboard' : '/register'} className="btn btn--primary btn--lg">
                {user ? 'Go to Dashboard' : 'Get Started'}
                <ArrowRight size={18} />
              </Link>
              {!user && (
                <Link to="/login" className="btn btn--ghost btn--lg">
                  Sign In
                </Link>
              )}
            </div>
          </div>

          {/* Signature hero visual — LifeVault dashboard orbited by its modules */}
          <div className="welcome-orbit reveal reveal--delay-1" aria-hidden="true">
            <div className="welcome-orbit__rings" />
            <div className="welcome-orbit__center">
              <Shield size={26} />
              <span>LifeVault</span>
              <small>Dashboard</small>
            </div>

            <div className="welcome-orbit__card welcome-orbit__card--doc">
              <FileText size={18} />
              <span>Document</span>
            </div>
            <div className="welcome-orbit__card welcome-orbit__card--reminder">
              <Bell size={18} />
              <span>Reminder</span>
            </div>
            <div className="welcome-orbit__card welcome-orbit__card--expense">
              <Receipt size={18} />
              <span>Expense</span>
            </div>
            <div className="welcome-orbit__card welcome-orbit__card--asset">
              <Wallet size={18} />
              <span>Asset</span>
            </div>
            <div className="welcome-orbit__card welcome-orbit__card--ai">
              <Sparkles size={18} />
              <span>AI</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- Features ---------------- */}
      <section id="features" className="welcome-section">
        <div className="welcome-section__header reveal">
          <span className="welcome-eyebrow">Everything in one place</span>
          <h2>Five modules. One intelligent vault.</h2>
        </div>

        <div className="welcome-features">
          {FEATURES.map(({ icon: Icon, title, description }, idx) => (
            <div key={title} className={`welcome-feature-card reveal reveal--delay-${(idx % 4) + 1}`}>
              <div className="welcome-feature-card__icon">
                <Icon size={22} />
              </div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- AI Showcase ---------------- */}
      <section id="ai" className="welcome-section welcome-section--tinted">
        <div className="welcome-ai-layout">
          <div className="welcome-section__header welcome-section__header--left reveal">
            <span className="welcome-eyebrow">
              <Sparkles size={14} />
              LifeVault AI
            </span>
            <h2>Ask your vault a question. Get a grounded answer.</h2>
            <p className="welcome-section__lead">
              LifeVault AI answers using only your own stored information — never anyone else's, and never
              information it wasn't given.
            </p>
          </div>
          <div className="reveal reveal--delay-2">
            <AIShowcase />
          </div>
        </div>
      </section>

      {/* ---------------- Smart Automation ---------------- */}
      <section id="how-it-works" className="welcome-section">
        <div className="welcome-section__header reveal">
          <span className="welcome-eyebrow">How it works</span>
          <h2>From upload to understanding, automatically.</h2>
        </div>

        <div className="welcome-flow reveal reveal--delay-1">
          {AUTOMATION_STEPS.map(({ icon: Icon, label }, idx) => (
            <div className="welcome-flow__step" key={label}>
              <div className="welcome-flow__node">
                <Icon size={20} />
              </div>
              <span className="welcome-flow__label">{label}</span>
              {idx < AUTOMATION_STEPS.length - 1 && <div className="welcome-flow__connector" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Payment Automation ---------------- */}
      <section className="welcome-section welcome-section--tinted">
        <div className="welcome-section__header reveal">
          <span className="welcome-eyebrow">
            <BadgeCheck size={14} />
            Payment sync
          </span>
          <h2>Pay a bill. LifeVault closes the loop.</h2>
          <p className="welcome-section__lead">
            Record a payment and the matching reminder is marked complete automatically — no unnecessary due
            alerts, no manual cleanup.
          </p>
        </div>

        <div className="welcome-flow welcome-flow--payment reveal reveal--delay-1">
          {PAYMENT_STEPS.map(({ icon: Icon, label, tone }, idx) => (
            <div className="welcome-flow__step" key={label}>
              <div className={`welcome-flow__node welcome-flow__node--${tone}`}>
                <Icon size={20} />
              </div>
              <span className="welcome-flow__label">{label}</span>
              {idx < PAYMENT_STEPS.length - 1 && <div className="welcome-flow__connector" aria-hidden="true" />}
            </div>
          ))}
        </div>
      </section>

      {/* ---------------- Final CTA ---------------- */}
      <section className="welcome-cta reveal">
        <h2>Take control of your everyday life.</h2>
        <p>Keep everything important in one intelligent place.</p>
        <Link to={user ? '/dashboard' : '/register'} className="btn btn--primary btn--lg">
          {user ? 'Go to Dashboard' : 'Create Your LifeVault'}
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* ---------------- Footer ---------------- */}
      <footer className="welcome-footer">
        <div className="welcome-footer__inner">
          <div className="welcome-footer__brand">
            <span className="welcome-nav__logo">
              <Shield size={18} />
            </span>
            <div>
              <strong>LifeVault</strong>
              <p>Your personal life, organized intelligently.</p>
            </div>
          </div>
          <nav className="welcome-footer__links" aria-label="Footer">
            <a href="#features" onClick={handleNavClick('#features')}>Features</a>
            <a href="#how-it-works" onClick={handleNavClick('#how-it-works')}>How It Works</a>
            <a href="#ai" onClick={handleNavClick('#ai')}>AI</a>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Get Started</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
};

export default Welcome;
