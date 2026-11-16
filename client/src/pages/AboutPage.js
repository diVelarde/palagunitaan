import { Link } from 'react-router-dom';
import { SITE_TEXT } from '../config/siteText';
import './AboutPage.css';

const ABOUT_HERO_IMAGE = '/images/about-bell-tower.jpg';

export default function AboutPage() {
  return (
    <main className="about-page site-page-surface">
      <section className="about-hero">
        <figure className="about-hero-image">
          <img
            src={ABOUT_HERO_IMAGE}
            alt="AI-generated sepia illustration of a Philippine stone church and bell tower beneath a mountain sky"
            width="1536"
            height="1024"
            loading="lazy"
          />
          <figcaption className="about-hero-credit">
            AI-generated illustration
          </figcaption>
        </figure>
        <div className="about-page-inner about-hero-layout">
          <div className="about-hero-copy">
            <p className="about-eyebrow">About the archive</p>
            <h1>Stories are held by the communities who carry them.</h1>
            <p className="about-hero-deck">{SITE_TEXT.aboutIntroduction}</p>
          </div>
        </div>
      </section>

      <nav className="about-explore about-page-inner" aria-label="Explore Palagunitaan">
        <Link to="/browse" className="about-explore-link">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M4 5h16v4H4zM6 9v10h12V9M9 13h6M9 16h6" />
          </svg>
          <span className="about-explore-title">Collections</span>
          <span className="about-explore-description">Browse stories and cultural records.</span>
        </Link>
        <Link to="/map" className="about-explore-link">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M19 10.1c0 5.2-7 11-7 11s-7-5.8-7-11a7 7 0 1 1 14 0Z" />
            <circle cx="12" cy="10" r="2.2" />
          </svg>
          <span className="about-explore-title">Heritage Sites</span>
          <span className="about-explore-description">Explore the places connected to local heritage.</span>
        </Link>
        <Link to="/browse?category=Legends%20%26%20Myths" className="about-explore-link">
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 4.5h5.5A3.5 3.5 0 0 1 14 8v12a3.5 3.5 0 0 0-3.5-3.5H5z" />
            <path d="M19 4.5h-1.5A3.5 3.5 0 0 0 14 8m5-3.5v13h-1.5A3.5 3.5 0 0 0 14 21" />
          </svg>
          <span className="about-explore-title">Folklore</span>
          <span className="about-explore-description">Read legends, myths, and oral traditions.</span>
        </Link>
      </nav>

      <section className="about-story about-page-inner">
        <div>
          <p className="about-eyebrow">Community knowledge</p>
          <h2>Living heritage is more than a record of the past.</h2>
        </div>
        <div className="about-story-copy">
          <p>
            Folklore is more than a record of the past. It is knowledge shared across generations—in legends, songs, rituals, beliefs, crafts, food, and everyday memory.
          </p>
          <p>
            Palagunitaan is a community-centered archive for gathering these accounts, connecting them to their places and sources, and making them easier to discover and learn from.
          </p>
          <p>
            Each entry is part of a living tradition. The archive aims to preserve context and recognize the contributors and communities whose knowledge makes it possible.
          </p>
          <Link to="/browse" className="about-action-link">Explore the archive <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="about-review">
        <div className="about-page-inner">
          <p className="about-eyebrow">A careful, shared process</p>
          <h2>How review works</h2>
          <div className="about-review-grid">
            <article>
              <span>01</span>
              <h3>Contributors share</h3>
              <p>People submit accounts with the sources, context, and names they are able to provide.</p>
            </article>
            <article>
              <span>02</span>
              <h3>Validators review</h3>
              <p>Reviewers consider the submitted sources and context, including local and community knowledge.</p>
            </article>
            <article>
              <span>03</span>
              <h3>Differences stay visible</h3>
              <p>Entries may be marked verified, unverified, or disputed. These labels describe review status, not the worth of a tradition or its tellers.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="about-alternate about-page-inner">
        <div>
          <p className="about-eyebrow">Names and variations</p>
          <h2>One story may be known by many names.</h2>
        </div>
        <div className="about-story-copy">
          <p>
            Names and tellings can vary across language, place, family, and generation. When
            contributors share alternate names or spellings, the archive records them as part
            of a story’s history—not as errors to correct or evidence that one account is the
            only valid one.
          </p>
          <p>
            The aim is to help people find related accounts while preserving the distinctions
            and context that communities consider important.
          </p>
        </div>
      </section>

      <section className="about-cta about-page-inner">
        <div>
          <p className="about-eyebrow">Shared stewardship</p>
          <h2>Know a story that belongs in the archive?</h2>
        </div>
        <Link to="/dashboard/submit" className="btn-outline">Share a story</Link>
      </section>
    </main>
  );
}
