import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Landing.css";

export default function Landing() {
  const [isDemoOpen, setIsDemoOpen] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    if (!isDemoOpen) {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
      document.body.style.overflow = "";
      return;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDemoOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isDemoOpen]);

  const openDemo = () => setIsDemoOpen(true);
  const closeDemo = () => setIsDemoOpen(false);

  return (
    <div className="landing-page">
      <div className="landing-shell">
        <Navbar />
        <section className="landing-hero">
          <div className="landing-hero-content">
            <div className="landing-hero-text">
              <h1 className="landing-hero-title">
                Scan. Order. <br />
                <span className="landing-hero-highlight">Enjoy.</span>
              </h1>
              <p className="landing-hero-subtitle">
                Transform your restaurant with QR-based ordering. Faster service, contactless
                experience, and seamless digital management for the modern era.
              </p>
            </div>
            <div className="landing-hero-actions">
              <Link className="landing-btn landing-btn--primary" to="/contact">
                Get Started
              </Link>
              <button className="landing-btn landing-btn--ghost" type="button" onClick={openDemo}>
                View Demo
              </button>
            </div>
            <div className="landing-hero-note">
              <span className="material-symbols-outlined landing-icon-fill">check_circle</span>
              No credit card required
              <span className="landing-note-divider">|</span>
              14-day free trial
            </div>
          </div>
          <div className="landing-hero-media">
            <div className="landing-hero-glow" />
            <div className="landing-hero-frame">
              <img
                alt="High-fidelity dark mode smartphone mockup showing a vibrant restaurant menu UI with gourmet food photos and a glowing neon QR code illustration"
                className="landing-hero-image"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAXIzye0Rk02u_MSwvUGaz_TQIxJ-MqeJbZljvkTlB7iOjXScip-3iy7-zRrfBwVJlomMPf95c5crbWYVc2g7hYvYzyRGcYc3iXfqFISuA_OAzx7ExSOjW0J9_cRN-SFIzOgyDG9YZbiiO-cWYa91Ua3_2cjngY9az_WE3kWAWnSWfZidA3eqh3bS-j-s5I7PC5XZfMcpT2t68pCJfzYFU4AAqiUKu9DvbPC0CoKsfmRIDBC7YjMc0PkonuWCfIGmNadjNX6LAiQ7qr"
              />
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--muted landing-section--compact" id="how-it-works">
          <div className="landing-section-heading landing-section-heading--center">
            <h2 className="landing-section-title">How It Works</h2>
            <p className="landing-section-subtitle">
              Three simple steps to digitize your dining experience and boost kitchen efficiency.
            </p>
          </div>
          <div className="landing-steps">
            <div className="landing-step-card">
              <span className="landing-step-accent landing-step-accent--primary" />
              <div className="landing-step-icon landing-step-icon--primary">
                <span className="material-symbols-outlined">qr_code_2</span>
              </div>
              <div className="landing-step-body">
                <h3 className="landing-step-title">1. Scan QR</h3>
                <p className="landing-step-text">
                  Customers scan the unique QR code on their table using any smartphone camera to
                  instantly access your digital menu.
                </p>
              </div>
            </div>
            <div className="landing-step-card">
              <span className="landing-step-accent landing-step-accent--secondary" />
              <div className="landing-step-icon landing-step-icon--secondary">
                <span className="material-symbols-outlined">restaurant_menu</span>
              </div>
              <div className="landing-step-body">
                <h3 className="landing-step-title">2. Browse Menu</h3>
                <p className="landing-step-text">
                  Your beautiful, high-fidelity menu displays items with vivid photos, detailed
                  ingredients, and nutritional information.
                </p>
              </div>
            </div>
            <div className="landing-step-card">
              <span className="landing-step-accent landing-step-accent--tertiary" />
              <div className="landing-step-icon landing-step-icon--tertiary">
                <span className="material-symbols-outlined">shopping_cart_checkout</span>
              </div>
              <div className="landing-step-body">
                <h3 className="landing-step-title">3. Place Order</h3>
                <p className="landing-step-text">
                  Orders go straight to the kitchen display. No waiting for servers, no manual
                  entry errors, just fast service.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="features">
          <div className="landing-features-header">
            <div className="landing-features-heading">
              <span className="landing-kicker">Powerful Engine</span>
              <h2 className="landing-features-title">Features for Modern Restaurants</h2>
            </div>
            <button className="landing-feature-link" type="button">
              Explore all features <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
          <div className="landing-feature-grid">
            <div className="landing-feature-card">
              <span className="material-symbols-outlined landing-feature-icon">dynamic_feed</span>
              <h4 className="landing-feature-title">Real-time Inventory</h4>
              <p className="landing-feature-text">
                Update item availability instantly across all tables. Prevent ordering of
                out-of-stock dishes.
              </p>
            </div>
            <div className="landing-feature-card">
              <span className="material-symbols-outlined landing-feature-icon">analytics</span>
              <h4 className="landing-feature-title">Sales Analytics</h4>
              <p className="landing-feature-text">
                Deep dive into your best sellers and peak hours with our integrated dashboard.
              </p>
            </div>
            <div className="landing-feature-card">
              <span className="material-symbols-outlined landing-feature-icon">payments</span>
              <h4 className="landing-feature-title">Instant Payments</h4>
              <p className="landing-feature-text">
                Accept Apple Pay, Google Pay, and Credit Cards directly from the table QR.
              </p>
            </div>
            <div className="landing-feature-card">
              <span className="material-symbols-outlined landing-feature-icon">table_restaurant</span>
              <h4 className="landing-feature-title">Table Management</h4>
              <p className="landing-feature-text">
                Unique QR codes for every table allow you to track service time and seat turnover.
              </p>
            </div>
            <div className="landing-feature-card">
              <span className="material-symbols-outlined landing-feature-icon">translate</span>
              <h4 className="landing-feature-title">Multi-language Menu</h4>
              <p className="landing-feature-text">
                Automatically translate your menu for international tourists with AI precision.
              </p>
            </div>
            <div className="landing-feature-card">
              <span className="material-symbols-outlined landing-feature-icon">phonelink_setup</span>
              <h4 className="landing-feature-title">No App Required</h4>
              <p className="landing-feature-text">
                Web-based ordering means zero friction. Just scan and start browsing in seconds.
              </p>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--dark">
          <div className="landing-showcase">
            <div className="landing-showcase-content">
              <div className="landing-showcase-text">
                <h2 className="landing-showcase-title">Total Control in Your Hands</h2>
                <p className="landing-showcase-subtitle">
                  Manage orders, update prices, and view live kitchen status from any device. Our
                  admin dashboard is as intuitive as the customer menu.
                </p>
              </div>
              <div className="landing-showcase-list">
                <div className="landing-showcase-item">
                  <div className="landing-showcase-icon">
                    <span className="material-symbols-outlined">bolt</span>
                  </div>
                  <div>
                    <h5 className="landing-showcase-item-title">Sub-second Sync</h5>
                    <p className="landing-showcase-item-text">
                      Zero delay between order placement and kitchen ticket printing.
                    </p>
                  </div>
                </div>
                <div className="landing-showcase-item">
                  <div className="landing-showcase-icon">
                    <span className="material-symbols-outlined">group</span>
                  </div>
                  <div>
                    <h5 className="landing-showcase-item-title">Staff Permissions</h5>
                    <p className="landing-showcase-item-text">
                      Assign different access levels for waiters, chefs, and managers.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="landing-showcase-media">
              <div className="landing-showcase-glow" />
              <div className="landing-showcase-frame">
                <img
                  alt="Sophisticated dark mode admin dashboard interface showing real-time sales charts, pending order lists, and a sleek navigation sidebar with emerald green accents"
                  className="landing-showcase-image"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8SopaECmS3D_ryA55DsMl2hsIbKUjVzJbC_cxUy3R0Qx9Ny0STP13Ob-y5ojBcuRl1n6WmCUrPrSzTTdnVtOSobrSYDv4XPD1AuX4wpJlrKHj9UkeSiFAYSC-ouL0do0npg0npIC92k50V4eWe9sLUP5Wwm5tXeRaU9ZAJ45owb5ep_Iu8wDHY2MxdZGhyrCYH9_mWcnSUoqq0MM0oIgGuSM5qomaea8Uyy9efe6QAFn8dGzKHP_JcJ9qEKILto8yqyr5sTkTCT2c"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-benefits">
            <div className="landing-benefits-content">
              <h2 className="landing-benefits-title">Built for Efficiency. Optimized for Revenue.</h2>
              <p className="landing-benefits-text">
                Restaurants using Grab Menu see a 20% increase in average order value and a 30%
                reduction in staff workload.
              </p>
            </div>
            <div className="landing-benefits-stats">
              <div className="landing-benefits-stat">
                <div className="landing-benefits-value">20%</div>
                <div className="landing-benefits-label">Order Value Up</div>
              </div>
              <div className="landing-benefits-stat">
                <div className="landing-benefits-value">15m</div>
                <div className="landing-benefits-label">Faster Turnover</div>
              </div>
              <div className="landing-benefits-stat">
                <div className="landing-benefits-value">Zero</div>
                <div className="landing-benefits-label">Order Errors</div>
              </div>
              <div className="landing-benefits-stat">
                <div className="landing-benefits-value">100%</div>
                <div className="landing-benefits-label">Contactless</div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section landing-section--muted" id="testimonials">
          <div className="landing-section-heading landing-section-heading--center">
            <h2 className="landing-section-title">Loved by Restaurateurs</h2>
          </div>
          <div className="landing-testimonial-grid">
            <div className="landing-testimonial-card">
              <p className="landing-testimonial-quote">
                "Grab Menu changed the game for us. During the weekend rush, our staff can finally
                focus on hospitality rather than just taking orders. Our sales increased as people
                order more drinks without waiting."
              </p>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar">
                  <img
                    alt="Professional portrait of a middle-aged restaurant owner smiling in front of a modern bistro setting"
                    className="landing-testimonial-image"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAsDjeEcTc2ywY200LpmP6mDMUmcd9Hs4in2Pilx4rmjCrClsG4__PGpcOUWG_wje_ItQZSG-zpCNHIba1rA_92HOwM0vpz9GVn0DmeDZvOuv7d_2jhXOjdJdZaNBumVJJMycw-ch0ou3VE3yXOUTd65ol4XRLQiQ-euciTlz8eNKNJE0zpO3Un5mGUtO5j365kr93RqGjG_i-rXaqhNraWuHtRP_tthJXqJaIUM9UnIRXtUeLxkUaX_cjM6vVk5aKAtVeSTvKihvoL"
                  />
                </div>
                <div>
                  <div className="landing-testimonial-name">Marco Rossi</div>
                  <div className="landing-testimonial-role">Owner, The Oak Bistro</div>
                </div>
              </div>
            </div>
            <div className="landing-testimonial-card">
              <p className="landing-testimonial-quote">
                "The setup was incredibly easy. We had all 40 tables live with custom QR codes in
                less than an afternoon. The interface is stunning and customers love how fast it
                is."
              </p>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar">
                  <img
                    alt="Headshot of a confident young woman, cafe manager, wearing a stylish apron in a sunlit coffee shop"
                    className="landing-testimonial-image"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKpCRg_BENGN_MdgWUuRlHcP5iXdOYlAixnnAPkPYU2BB7Bmd7jLjDsan6K2Is38-GMGDe1mbEGrD6FDQH19Gb4KBTUOn5vMdCIG8V2fdAqbD8H6IfT0Wzsf-hQBKP4x2nAOlRMnhthz_ezXehFWyE_9ZWFfjblC7xkEVJ-Rs-72OVEnGwvP-SbhfSuHBETeWDNUIxHFxYAhqpb0fU7X_uaXrsTqcuHeYBAHy-Y5aryHSRTJNT1b4zkh30cpc_Z7vdYkSnZTvE9Y-X"
                  />
                </div>
                <div>
                  <div className="landing-testimonial-name">Sarah Jenkins</div>
                  <div className="landing-testimonial-role">Manager, Brew & Byte</div>
                </div>
              </div>
            </div>
            <div className="landing-testimonial-card">
              <p className="landing-testimonial-quote">
                "Finally a QR menu that doesn't feel like a 2010 PDF. The photos look appetizing,
                the upsells work perfectly, and our kitchen has never been more organized."
              </p>
              <div className="landing-testimonial-author">
                <div className="landing-testimonial-avatar">
                  <img
                    alt="Portrait of a head chef in white uniform standing in a professional kitchen with soft background bokeh"
                    className="landing-testimonial-image"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoJ3cg-uxPD7TTrDRhaPHmIcvK7ngSvNqlcPKZpjMKbB1qyfPeAfGg8atNSMyuQzplFswnGMlTARe3ND9E8ZZIAGFa2WeUECR_F6Or3mnfooeN6xwlGh4kRlwY3tb8MjEgM6-m6attuSPxYDuv1EEp4nVf70TewxkpdpEBCflz5WlIEAz9Vp7Fou8arlqTjLDkUqI5GmcFuDpR6Q-dyBxLWSx4G3LUUjzzaZd_mYVSVQb0Ll5yFRBAtQEsnNodfuAksIoN6Q3XBFrN"
                  />
                </div>
                <div>
                  <div className="landing-testimonial-name">David Chen</div>
                  <div className="landing-testimonial-role">Chef/Owner, Umami Lounge</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="landing-section" id="pricing">
          <div className="landing-section-heading landing-section-heading--center">
            <h2 className="landing-section-title">Simple, Transparent Pricing</h2>
            <p className="landing-section-subtitle">Choose the plan that fits your restaurant scale.</p>
          </div>
          <div className="landing-pricing-grid">
            <div className="landing-pricing-card">
              <div className="landing-pricing-header">
                <h4 className="landing-pricing-title">Basic</h4>
                <div className="landing-pricing-price">
                  $49<span className="landing-pricing-term">/mo</span>
                </div>
                <p className="landing-pricing-description">Perfect for small cafes and boutiques.</p>
              </div>
              <ul className="landing-pricing-list">
                <li>
                  <span className="material-symbols-outlined landing-list-icon">check</span>
                  Up to 10 tables
                </li>
                <li>
                  <span className="material-symbols-outlined landing-list-icon">check</span>
                  Digital Menu
                </li>
                <li>
                  <span className="material-symbols-outlined landing-list-icon">check</span>
                  Core Analytics
                </li>
              </ul>
              <Link className="landing-btn landing-btn--outline landing-btn--full" to="/contact">
                Get Started
              </Link>
            </div>
            <div className="landing-pricing-card landing-pricing-card--featured">
              <div className="landing-pricing-badge">Most Popular</div>
              <div className="landing-pricing-header">
                <h4 className="landing-pricing-title">Pro</h4>
                <div className="landing-pricing-price">
                  $99<span className="landing-pricing-term">/mo</span>
                </div>
                <p className="landing-pricing-description">Full power for busy restaurants.</p>
              </div>
              <ul className="landing-pricing-list landing-pricing-list--bold">
                <li>
                  <span className="material-symbols-outlined landing-list-icon">check</span>
                  Unlimited tables
                </li>
                <li>
                  <span className="material-symbols-outlined landing-list-icon">check</span>
                  Payment integration
                </li>
                <li>
                  <span className="material-symbols-outlined landing-list-icon">check</span>
                  AI Menu Translator
                </li>
                <li>
                  <span className="material-symbols-outlined landing-list-icon">check</span>
                  Priority Support
                </li>
              </ul>
              <Link className="landing-btn landing-btn--primary landing-btn--full" to="/contact">
                Get Started Now
              </Link>
            </div>
            <div className="landing-pricing-card">
              <div className="landing-pricing-header">
                <h4 className="landing-pricing-title">Enterprise</h4>
                <div className="landing-pricing-price">Custom</div>
                <p className="landing-pricing-description">
                  For franchises and large hotel groups.
                </p>
              </div>
              <ul className="landing-pricing-list">
                <li>
                  <span className="material-symbols-outlined landing-list-icon">check</span>
                  Multi-location sync
                </li>
                <li>
                  <span className="material-symbols-outlined landing-list-icon">check</span>
                  Custom API integration
                </li>
                <li>
                  <span className="material-symbols-outlined landing-list-icon">check</span>
                  Dedicated Manager
                </li>
              </ul>
              <button className="landing-btn landing-btn--outline landing-btn--full" type="button">
                Contact Sales
              </button>
            </div>
          </div>
        </section>

        <section className="landing-cta">
          <div className="landing-cta-glow" />
          <div className="landing-cta-content">
            <h2 className="landing-cta-title">Start your digital restaurant today.</h2>
            <p className="landing-cta-subtitle">
              Join over 1,500 restaurants worldwide creating better experiences with Grab Menu.
            </p>
            <div className="landing-cta-actions">
              <Link className="landing-btn landing-btn--primary landing-btn--cta" to="/contact">
                Get Started for Free
              </Link>
              <button
                className="landing-btn landing-btn--cta landing-btn--outline"
                type="button"
                onClick={openDemo}
              >
                View Live Demo
              </button>
            </div>
          </div>
        </section>

        {isDemoOpen ? (
          <div className="landing-modal" role="dialog" aria-modal="true" aria-label="Grab Menu demo video" onClick={closeDemo}>
            <div className="landing-modal-card" onClick={(event) => event.stopPropagation()}>
              <div className="landing-modal-header">
                <h3 className="landing-modal-title">Grab Menu Demo</h3>
                <button className="landing-modal-close" type="button" onClick={closeDemo} aria-label="Close">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="landing-modal-body">
                <video
                  ref={videoRef}
                  className="landing-demo-video"
                  src="/demo_video.mp4"
                  controls
                  autoPlay
                  playsInline
                />
              </div>
            </div>
          </div>
        ) : null}

        <footer className="landing-footer">
          <div className="landing-footer-inner">
            <div className="landing-footer-brand">
              <div className="landing-brand-icon">
                <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z"></path>
                </svg>
              </div>
              <h2 className="landing-brand-name">Grab Menu</h2>
            </div>
            <div className="landing-footer-links">
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
              <Link to="/contact">Contact</Link>
            </div>
            <div className="landing-footer-copy">&copy; 2024 Grab Menu Inc. All rights reserved.</div>
          </div>
        </footer>
      </div>
    </div>
  );
}


