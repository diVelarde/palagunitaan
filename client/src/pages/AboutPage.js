import { Link } from 'react-router-dom';
import { SITE_TEXT } from '../config/siteText';
import './AboutPage.css';

export default function AboutPage() {
  return (
    <main className="about-page site-page-surface">
      <section className="about-hero">
        <img
          className="about-hero-photo"
          src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Mt.%20Isarog%20Landscape.jpg?width=1800"
          alt="A mountain landscape at Mount Isarog"
        />
        <div className="about-hero-overlay" aria-hidden="true" />
        <div className="about-page-inner">
          <p className="about-eyebrow">About the archive</p>
          <h1>Stories are held by the communities who carry them.</h1>
          <p className="about-hero-deck">{SITE_TEXT.aboutIntroduction}</p>
        </div>
        <p className="about-photo-credit">
          Mount Isarog photo by <a href="https://commons.wikimedia.org/wiki/User:MarvinBikolano" target="_blank" rel="noreferrer">MarvinBikolano</a>
          {' '}via <a href="https://commons.wikimedia.org/wiki/File:Mt._Isarog_Landscape.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>
          {' '}· <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
        </p>
      </section>

      <section className="about-story about-page-inner">
        <div>
          <p className="about-eyebrow">Community knowledge</p>
          <h2>Living heritage is more than a record of the past.</h2>
        </div>
        <div className="about-story-copy">
          <p>
            It is knowledge shared across generations—in stories, songs, practices, beliefs,
            crafts, foodways, and everyday memory.
          </p>
          <p>
            Palagunitaan brings accounts together with the places, sources, and context people
            choose to share. Community knowledge and lived experience matter alongside written
            records.
          </p>
          <p>
            An archive entry is one record of a living tradition, not a substitute for the
            people who practice, remember, and interpret it.
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
