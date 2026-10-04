import { Link } from 'react-router-dom';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <main className="about-page site-page-surface">
      <section className="about-hero">
        <div className="about-page-inner">
          <p className="about-eyebrow">About Palagunitaan</p>
          <h1>A living archive of stories, held by the communities who carry them.</h1>
          <p className="about-hero-deck">
            Palagunitaan documents and preserves Philippine folklore and intangible cultural heritage, beginning with the stories of Camarines Sur.
          </p>
        </div>
        <span className="about-hero-mark" aria-hidden="true">ᜉ</span>
        <p className="about-photo-credit">
          Mount Isarog photo by <a href="https://commons.wikimedia.org/wiki/User:MarvinBikolano" target="_blank" rel="noreferrer">MarvinBikolano</a>
          {' '}via <a href="https://commons.wikimedia.org/wiki/File:Mt._Isarog_Landscape.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>
          {' '}· <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
        </p>
      </section>

      <section className="about-story about-page-inner">
        <div>
          <p className="about-eyebrow">The archive</p>
          <h2>Stories belong to the people who keep telling them.</h2>
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
          <Link to="/browse" className="about-action-link">Explore the collections <span aria-hidden="true">→</span></Link>
        </div>
      </section>

      <section className="about-values">
        <div className="about-page-inner">
          <p className="about-eyebrow">How we preserve</p>
          <div className="about-value-grid">
            <article>
              <span>01</span>
              <h2>Community first</h2>
              <p>Value the people and local knowledge behind each tradition and account.</p>
            </article>
            <article>
              <span>02</span>
              <h2>Context matters</h2>
              <p>Connect stories to their sources, regions, historical periods, and variations.</p>
            </article>
            <article>
              <span>03</span>
              <h2>Shared stewardship</h2>
              <p>Support careful contribution, review, and ongoing care of the collection.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="about-cta about-page-inner">
        <div>
          <p className="about-eyebrow">Keep a story in circulation</p>
          <h2>Know a story that should be remembered?</h2>
        </div>
        <Link to="/dashboard" className="about-action-link">Join the archive <span aria-hidden="true">→</span></Link>
      </section>
    </main>
  );
}
