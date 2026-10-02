import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import blogService from '../services/blogService';
import heritageService from '../services/heritageService';
import highlightService from '../services/highlightService';
import './LandingPage.css';

const CATEGORIES = [
  { title: 'Legends & Myths', subtitle: 'Origin stories & lore', image: 'photo-1500530855697-b586d89ba3ee' },
  { title: 'Folk Songs & Chants', subtitle: 'Music & verse', image: 'photo-1516280440614-37939bbacd81' },
  { title: 'Rituals & Ceremonies', subtitle: 'Spiritual practice', image: 'photo-1518837695005-2083093ee35b' },
  { title: 'Folk Dance', subtitle: 'Movement traditions', image: 'photo-1504609813442-a8924e83f76e' },
  { title: 'Culinary Heritage', subtitle: 'Food traditions', image: 'photo-1504674900247-0877df9cc836' },
  { title: 'Oral Traditions', subtitle: 'Spoken knowledge', image: 'photo-1470770841072-f978cf4d019e' },
  { title: 'Beliefs & Superstitions', subtitle: 'Folk beliefs', image: 'photo-1500534623283-312aade485b7' },
  { title: 'Crafts', subtitle: 'Material culture', image: 'photo-1452860606245-08befc0ff44b' },
];

const REGIONS = [
  { name: 'Naga City', area: 'Camarines Sur' },
  { name: 'Camarines Sur', area: 'Bicol Region' },
  { name: 'Pili', area: 'Camarines Sur' },
  { name: 'Iriga City', area: 'Camarines Sur' },
];

const HERO_IMAGE = 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2200&q=85';

function SectionHeading({ children, linkTo, linkLabel = 'View All →' }) {
  return (
    <div className="lp-section-heading">
      <h2>{children}</h2>
      {linkTo && <Link to={linkTo}>{linkLabel}</Link>}
    </div>
  );
}

function EntryCard({ entry }) {
  const description = entry.euphemistic_content || entry.raw_content || '';

  return (
    <Link to={`/entries/${entry.id}`} className="lp-entry-card">
      {entry.cover_image_url ? (
        <img className="lp-entry-image" src={entry.cover_image_url} alt="" />
      ) : (
        <div className="lp-entry-image lp-entry-image-placeholder" aria-hidden="true">P</div>
      )}
      <div className="lp-entry-content">
        <div className="lp-entry-meta">
          <span className={`lp-status lp-status-${entry.verification_status || 'unverified'}`}>
            {entry.verification_status || 'Unverified'}
          </span>
          {entry.category_auto && <span>{entry.category_auto}</span>}
        </div>
        <h3>{entry.title}</h3>
        <p>{description}</p>
        <div className="lp-entry-details">
          {entry.region && <span>{entry.region}</span>}
          {entry.historical_period && <span>{entry.historical_period}</span>}
        </div>
      </div>
    </Link>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [keyword, setKeyword] = useState('');
  const [entries, setEntries] = useState([]);
  const [highlight, setHighlight] = useState(null);
  const [posts, setPosts] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      heritageService.getPublishedEntries({ limit: 4 }),
      highlightService.getCurrentHighlights(),
      blogService.getPosts({ limit: 2 }),
    ]).then(([entriesResult, highlightResult, postsResult]) => {
      if (!active) return;

      if (entriesResult.status === 'fulfilled') {
        setEntries(entriesResult.value || []);
      } else {
        setErrors((current) => ({ ...current, entries: 'Latest entries are temporarily unavailable.' }));
      }

      if (highlightResult.status === 'fulfilled') {
        setHighlight(highlightResult.value?.week || null);
      } else {
        setErrors((current) => ({ ...current, highlight: 'The weekly highlight is temporarily unavailable.' }));
      }

      if (postsResult.status === 'fulfilled') {
        setPosts(postsResult.value || []);
      } else {
        setErrors((current) => ({ ...current, posts: 'Community posts are temporarily unavailable.' }));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    const query = keyword.trim();
    navigate(query ? `/browse?keyword=${encodeURIComponent(query)}` : '/browse');
  }

  return (
    <main className="lp-home">
      <section className="lp-hero" style={{ '--lp-hero-image': `url("${HERO_IMAGE}")` }}>
        <div className="lp-hero-content">
          <p className="lp-eyebrow">Camarines Sur · Bicol Region</p>
          <h1>Preserving the Stories of <span>Bicol</span></h1>
          <p className="lp-hero-description">
            A living archive of Philippine regional folklore and intangible cultural
            heritage — documented, validated, and shared.
          </p>
          <form className="lp-search" onSubmit={handleSearch}>
            <input
              aria-label="Search the heritage archive"
              type="search"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search legends, songs, rituals..."
            />
            <button type="submit">Search</button>
          </form>
          <div className="lp-hero-links">
            <Link to="/browse" className="lp-hero-primary-link">Browse all entries →</Link>
            <Link to="/map"><span aria-hidden="true">⌖</span> Explore map</Link>
            <Link to="/timeline"><span aria-hidden="true">◷</span> View timeline</Link>
          </div>
        </div>
      </section>

      {highlight && (
        <section className="lp-section lp-highlight-section">
          <SectionHeading>Highlight of the Week</SectionHeading>
          <Link to={`/entries/${highlight.heritage_entry_id}`} className="lp-highlight-card">
            <div className="lp-highlight-photo" style={{ backgroundImage: `url("${HERO_IMAGE}")` }} />
            <div className="lp-highlight-copy">
              <p className="lp-highlight-label">★ &nbsp; Highlight of the Week</p>
              <h3>{highlight.title}</h3>
              <p className="lp-highlight-description">{highlight.euphemistic_content}</p>
              {highlight.category_auto && <span className="lp-category-pill">{highlight.category_auto}</span>}
              <span className="lp-read-link">Read full entry →</span>
            </div>
          </Link>
        </section>
      )}
      {errors.highlight && <p className="lp-feed-error">{errors.highlight}</p>}

      <section className="lp-section">
        <SectionHeading linkTo="/browse">Browse by Category</SectionHeading>
        <div className="lp-category-grid">
          {CATEGORIES.map((category) => (
            <Link
              key={category.title}
              to={`/browse?category=${encodeURIComponent(category.title)}`}
              className="lp-category-card"
            >
              <div
                className="lp-category-photo"
                style={{ backgroundImage: `linear-gradient(0deg, rgba(36, 24, 18, .82), rgba(36, 24, 18, .05)), url("https://images.unsplash.com/${category.image}?auto=format&fit=crop&w=700&q=80")` }}
              />
              <div className="lp-category-copy">
                <h3>{category.title}</h3>
                <p>{category.subtitle}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="lp-section lp-region-section">
        <SectionHeading>Browse by Region</SectionHeading>
        <div className="lp-region-grid">
          {REGIONS.map((region) => (
            <Link
              key={region.name}
              to={`/browse?region=${encodeURIComponent(region.name)}`}
              className="lp-region-card"
            >
              <span className="lp-region-icon" aria-hidden="true">⌖</span>
              <span>
                <strong>{region.name}</strong>
                <small>{region.area}</small>
              </span>
              <span className="lp-region-arrow" aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="lp-section">
        <SectionHeading linkTo="/browse" linkLabel="Browse All →">Recently Added</SectionHeading>
        {errors.entries ? (
          <p className="lp-feed-error">{errors.entries}</p>
        ) : entries.length > 0 ? (
          <div className="lp-entry-grid">
            {entries.slice(0, 4).map((entry) => <EntryCard key={entry.id} entry={entry} />)}
          </div>
        ) : (
          <p className="lp-empty-message">New heritage entries will appear here as they are published.</p>
        )}
      </section>

      <section className="lp-section lp-blog-section">
        <SectionHeading linkTo="/blog" linkLabel="All Posts →">From the Blog</SectionHeading>
        {errors.posts ? (
          <p className="lp-feed-error">{errors.posts}</p>
        ) : posts.length > 0 ? (
          <div className="lp-blog-grid">
            {posts.slice(0, 2).map((post) => (
              <Link key={post.id} to="/blog" className="lp-blog-card">
                <span>COMMUNITY STORIES</span>
                <h3>{post.title}</h3>
                <p>{post.content}</p>
                <strong>Read on the community blog →</strong>
              </Link>
            ))}
          </div>
        ) : (
          <p className="lp-empty-message">There are no community posts yet.</p>
        )}
      </section>

    </main>
  );
}
