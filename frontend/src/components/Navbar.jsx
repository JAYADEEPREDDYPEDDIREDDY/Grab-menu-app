import { Link } from "react-router-dom";

export default function Navbar({ basePath = "" }) {
  const anchor = (hash) => (basePath ? `${basePath}${hash}` : hash);

  return (
    <header className="landing-header">
      <div className="landing-brand">
        <div className="landing-brand-icon">
          <svg fill="currentColor" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path
              clipRule="evenodd"
              d="M12.0799 24L4 19.2479L9.95537 8.75216L18.04 13.4961L18.0446 4H29.9554L29.96 13.4961L38.0446 8.75216L44 19.2479L35.92 24L44 28.7521L38.0446 39.2479L29.96 34.5039L29.9554 44H18.0446L18.04 34.5039L9.95537 39.2479L4 28.7521L12.0799 24Z"
              fillRule="evenodd"
            />
          </svg>
        </div>
        <h2 className="landing-brand-name">Grab Menu</h2>
      </div>
      <div className="landing-header-actions">
        <nav className="landing-nav">
          <a className="landing-nav-link" href={anchor("#features")}>
            Features
          </a>
          <a className="landing-nav-link" href={anchor("#how-it-works")}>
            How it Works
          </a>
          <a className="landing-nav-link" href={anchor("#pricing")}>
            Pricing
          </a>
          <a className="landing-nav-link" href={anchor("#testimonials")}>
            Testimonials
          </a>
          <Link className="landing-nav-link" to="/contact">
            Contact
          </Link>
        </nav>
        <Link className="landing-btn landing-btn--small landing-btn--header" to="/admin/login">
          Login
        </Link>
      </div>
    </header>
  );
}
