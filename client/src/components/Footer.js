import { Link } from 'react-router-dom';
import { SITE_TEXT } from '../config/siteText';

export default function Footer() {
  return (
    <footer className="site-footer border-t">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-12 md:grid-cols-[1.6fr_1fr_1fr]">
        <div>
          <h2 className="mb-3 font-serif text-2xl font-bold">Palagunitaan</h2>
          <p className="site-footer-copy max-w-md text-sm leading-6">{SITE_TEXT.footerArchiveDescription}</p>
          <Link to="/about" className="site-footer-about-link mt-5 inline-block text-xs font-semibold uppercase tracking-[.1em]">
            About the archive <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div>
          <h3 className="site-footer-heading mb-4 text-sm font-bold uppercase tracking-[.14em]">Discover</h3>
          <div className="site-footer-links flex flex-col items-start gap-3 text-sm">
            <Link to="/" className="hover:text-[var(--site-footer-ink)]">Explore</Link>
            <Link to="/map" className="hover:text-[var(--site-footer-ink)]">Places</Link>
            <Link to="/browse" className="hover:text-[var(--site-footer-ink)]">Collections</Link>
            <Link to="/timeline" className="hover:text-[var(--site-footer-ink)]">Timeline</Link>
            <Link to="/blog" className="hover:text-[var(--site-footer-ink)]">Community stories</Link>
          </div>
        </div>
        <div>
          <h3 className="site-footer-heading mb-4 text-sm font-bold uppercase tracking-[.14em]">Contribute</h3>
          <p className="site-footer-copy mb-4 text-sm leading-6">{SITE_TEXT.footerContributionDescription}</p>
          <Link to="/dashboard" className="site-footer-about-link text-xs font-semibold uppercase tracking-[.1em]">
            Join the archive <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <div className="site-footer-bottom border-t px-6 py-4 text-center text-xs">
        © {new Date().getFullYear()} Palagunitaan · Ateneo de Naga University
      </div>
    </footer>
  );
}
