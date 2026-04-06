import Navbar from "../components/Navbar";
import "./Landing.css";
import "./Contact.css";

export default function Contact() {
  return (
    <div className="landing-page contact-page">
      <Navbar basePath="/" />
      <div className="contact-container">
        <header className="contact-hero">
          <h1 className="contact-title">
            Let&apos;s Get Your <span>Restaurant Digital.</span>
          </h1>
          <p className="contact-subtitle">
            Have questions about QR-based ordering or need a custom plan? Our team is here to help.
          </p>
        </header>

        <section className="contact-grid">
          <form className="contact-form-card">
            <div className="contact-form-grid">
              <label className="contact-field">
                <span className="contact-label">Full Name</span>
                <input
                  className="contact-input"
                  type="text"
                  placeholder="John Doe"
                  name="fullName"
                  autoComplete="name"
                />
              </label>
              <label className="contact-field">
                <span className="contact-label">Restaurant Name</span>
                <input
                  className="contact-input"
                  type="text"
                  placeholder="Ember Bistro"
                  name="restaurantName"
                  autoComplete="organization"
                />
              </label>
              <label className="contact-field contact-field--full">
                <span className="contact-label">Email Address</span>
                <input
                  className="contact-input"
                  type="email"
                  placeholder="john@example.com"
                  name="email"
                  autoComplete="email"
                />
              </label>
              <label className="contact-field contact-field--full">
                <span className="contact-label">Message</span>
                <textarea
                  className="contact-input contact-textarea"
                  placeholder="Tell us how we can help..."
                  name="message"
                  rows={4}
                />
              </label>
            </div>
            <button className="contact-submit" type="button">
              Send Message
            </button>
          </form>

          <div className="contact-info-stack">
            <article className="contact-info-card">
              <div className="contact-info-icon">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <div className="contact-info-body">
                <h3>Sales Inquiry</h3>
                <p>Looking for a custom enterprise plan?</p>
                <span className="contact-info-value">sales@midnightember.com</span>
              </div>
            </article>

            <article className="contact-info-card">
              <div className="contact-info-icon is-teal">
                <span className="material-symbols-outlined">support_agent</span>
              </div>
              <div className="contact-info-body">
                <h3>Customer Support</h3>
                <p>Already using GrabMenu and need help?</p>
                <span className="contact-info-value">+1 (555) 000-0000</span>
              </div>
            </article>

            <article className="contact-info-card">
              <div className="contact-info-icon is-slate">
                <span className="material-symbols-outlined">handshake</span>
              </div>
              <div className="contact-info-body">
                <h3>Partnerships</h3>
                <p>Interested in collaborating with us?</p>
                <span className="contact-info-link">
                  View Partner Program <span aria-hidden="true">→</span>
                </span>
              </div>
            </article>
          </div>
        </section>

        <section className="contact-faq">
          <div className="contact-faq-header">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about getting started.</p>
          </div>

          <div className="contact-faq-list">
            <div className="contact-faq-item">
              <div className="contact-faq-question">
                <span>How long does it take to set up?</span>
                <span className="material-symbols-outlined">expand_more</span>
              </div>
              <p className="contact-faq-answer">
                Most restaurants are up and running within 24 hours. Our onboarding team assists
                you with digitalizing your menu and generating your unique brand QR codes
                instantly.
              </p>
            </div>

            <div className="contact-faq-item">
              <div className="contact-faq-question">
                <span>Can I customize the QR codes?</span>
                <span className="material-symbols-outlined">expand_more</span>
              </div>
              <p className="contact-faq-answer">
                Yes! You can fully customize the QR codes with your restaurant&apos;s logo, brand
                colors, and choose from various styling options to match your table aesthetic.
              </p>
            </div>

            <div className="contact-faq-item">
              <div className="contact-faq-question">
                <span>Is there a limit on menu items?</span>
                <span className="material-symbols-outlined">expand_more</span>
              </div>
              <p className="contact-faq-answer">
                We offer unlimited menu items on our Professional and Enterprise plans. The Basic
                plan supports up to 100 items, which is perfect for most small bistros and cafes.
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}



