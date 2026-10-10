import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import blogService from '../services/blogService';
import heritageService from '../services/heritageService';
import highlightService from '../services/highlightService';
import mapService from '../services/mapService';
import multimediaService from '../services/multimediaService';
import './LandingPage.css';

const MAP_CENTER = [13.58, 123.29];

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

const HERO_IMAGE = 'https://commons.wikimedia.org/wiki/Special:Redirect/file/Mt.%20Isarog%20Landscape.jpg?width=2200';
const CRAFT_IMAGE = 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=1800&q=85';

function SectionHeading({ children, linkTo, linkLabel = 'View All →' }) {
  return (
    <div className="lp-section-heading">
      <h2>{children}</h2>
      {linkTo && <Link to={linkTo}>{linkLabel}</Link>}
    </div>
  );
}

function LatestStoryLink({ entry }) {
  const description = entry.euphemistic_content || entry.raw_content || '';
  const metadata = [entry.category_auto, entry.region].filter(Boolean).join(' · ');

  return (
    <Link to={`/entries/${entry.id}`} className="lp-latest-story">
      {entry.cover_image_url ? (
        <img className="lp-latest-story-image" src={entry.cover_image_url} alt="" />
      ) : (
        <span className="lp-latest-story-image lp-latest-story-placeholder" aria-hidden="true">
          {entry.title?.charAt(0) || 'P'}
        </span>
      )}
      <span className="lp-latest-story-copy">
        {metadata && <span className="lp-latest-story-meta">{metadata}</span>}
        <strong>{entry.title}</strong>
        {description && <span className="lp-latest-story-description">{description}</span>}
      </span>
    </Link>
  );
}

function formatAudioLocation(entry) {
  return [entry.region_name, entry.region, entry.region_province]
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(' · ');
}

function FitLandingMarkers({ markers }) {
  const map = useMap();

  useEffect(() => {
    if (!markers.length) return;
    const bounds = L.latLngBounds(markers.map((marker) => [marker.latitude, marker.longitude]));
    map.fitBounds(bounds, { padding: [24, 24], maxZoom: 9 });
  }, [map, markers]);

  return null;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const audioRef = useRef(null);
  const playAfterTrackChange = useRef(false);
  const [keyword, setKeyword] = useState('');
  const [entries, setEntries] = useState([]);
  const [audioTracks, setAudioTracks] = useState([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [highlight, setHighlight] = useState(null);
  const [posts, setPosts] = useState([]);
  const [errors, setErrors] = useState({});
  const [mapMarkers, setMapMarkers] = useState([]);
  const [mapLoading, setMapLoading] = useState(true);
  const [mapLoadError, setMapLoadError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.allSettled([
      heritageService.getPublishedEntries({ limit: 20 }),
      highlightService.getCurrentHighlights(),
      blogService.getPosts({ limit: 2 }),
    ]).then(([entriesResult, highlightResult, postsResult]) => {
      if (!active) return;

      if (entriesResult.status === 'fulfilled') {
        const publishedEntries = entriesResult.value || [];
        setEntries(publishedEntries.slice(0, 5));
        Promise.allSettled(
          publishedEntries.map(async (entry) => {
            const assets = await multimediaService.getEntryMedia(entry.id);
            return assets
              .filter((asset) => asset.file_type !== 'image' && asset.file_url)
              .map((asset) => ({ ...asset, entry }));
          })
        ).then((mediaResults) => {
          if (!active) return;
          const tracks = mediaResults.flatMap((result) => (
            result.status === 'fulfilled' ? result.value : []
          ));
          setAudioTracks(tracks);
          if (mediaResults.some((result) => result.status === 'rejected')) {
            setErrors((current) => ({
              ...current,
              audio: 'Some archive recordings could not be loaded.',
            }));
          }
        });
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

  useEffect(() => {
    let active = true;

    mapService.getMapData()
      .then((markers) => {
        if (active) setMapMarkers(markers || []);
      })
      .catch(() => {
        if (active) setMapLoadError('Heritage locations could not be loaded.');
      })
      .finally(() => {
        if (active) setMapLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const currentTrack = audioTracks[currentTrackIndex];
  const validMapMarkers = useMemo(() => mapMarkers
    .filter((marker) => marker.latitude !== null
      && marker.latitude !== undefined
      && marker.latitude !== ''
      && marker.longitude !== null
      && marker.longitude !== undefined
      && marker.longitude !== '')
    .map((marker) => ({
      ...marker,
      latitude: Number(marker.latitude),
      longitude: Number(marker.longitude),
    }))
    .filter((marker) => (
      Number.isFinite(marker.latitude)
      && marker.latitude >= -90
      && marker.latitude <= 90
      && Number.isFinite(marker.longitude)
      && marker.longitude >= -180
      && marker.longitude <= 180
    )), [mapMarkers]);

  useEffect(() => {
    if (!playAfterTrackChange.current || !audioRef.current) return;
    playAfterTrackChange.current = false;
    audioRef.current.play().catch(() => {
      setErrors((current) => ({
        ...current,
        audio: 'Playback did not start. Use the play control to try again.',
      }));
    });
  }, [currentTrackIndex, currentTrack]);

  function changeAudioTrack(direction) {
    if (audioTracks.length < 2) return;
    playAfterTrackChange.current = true;
    setCurrentTrackIndex((index) => (
      (index + direction + audioTracks.length) % audioTracks.length
    ));
  }

  function handleSearch(event) {
    event.preventDefault();
    const query = keyword.trim();
    navigate(query ? `/browse?keyword=${encodeURIComponent(query)}` : '/browse');
  }

  return (
    <main className="lp-home">
      <section className="lp-hero" style={{ '--lp-hero-image': `url("${HERO_IMAGE}")` }}>
        <div className="lp-hero-content">
          <p className="lp-eyebrow">A living folklore archive · Bicol, Philippines</p>
          <h1>Preserving the Stories of <span>Bicol</span></h1>
          <p className="lp-hero-description">
            A living archive of Philippine regional folklore and intangible cultural heritage.
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
            <Link to="/browse" className="lp-hero-primary-link">Browse the archives <span aria-hidden="true">→</span></Link>
            <span className="lp-hero-index">Field notes from Camarines Sur</span>
          </div>
          <p className="lp-photo-credit">
            Mount Isarog photo by <a href="https://commons.wikimedia.org/wiki/User:MarvinBikolano" target="_blank" rel="noreferrer">MarvinBikolano</a>
            {' '}via <a href="https://commons.wikimedia.org/wiki/File:Mt._Isarog_Landscape.jpg" target="_blank" rel="noreferrer">Wikimedia Commons</a>
            {' '}· <a href="https://creativecommons.org/licenses/by-sa/4.0/" target="_blank" rel="noreferrer">CC BY-SA 4.0</a>
          </p>
        </div>
      </section>

      <section className="lp-archive-feature" aria-labelledby="lp-archive-feature-title">
        <div className="lp-archive-feature-copy">
          <p className="lp-archive-feature-kicker">From the archive</p>
          <h2 id="lp-archive-feature-title">Let every story show where it came from.</h2>
          <p className="lp-archive-feature-description">
            Folklore lives in more than its telling. We preserve the places, people, memories, and source details that give each account its history.
          </p>
          <Link to="/browse" className="lp-archive-feature-link">
            Explore collection records <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="lp-archive-artifact" aria-label="Illustration of an archival field note">
          <div className="lp-archive-paper-back" aria-hidden="true" />
          <article className="lp-archive-paper">
            <div className="lp-archive-stamp" aria-hidden="true">
              <span>PALAGUNITAAN</span>
              <span>FIELD RECORD</span>
              <span>019</span>
            </div>
            <p className="lp-archive-paper-kicker">Field notes · oral tradition</p>
            <h3>A mountain remembered at dusk</h3>
            <blockquote>
              “As evening settled, the elders spoke of the mountain as a presence—known by name, watched over, and spoken of with care.”
            </blockquote>
            <p className="lp-archive-paper-note">
              A story is held not only in its words, but in the voices and places that carry it.
            </p>
            <div className="lp-archive-paper-rule" />
            <p className="lp-archive-paper-meta">Camarines Sur · Oral tradition · Archive preview</p>
          </article>
        </div>
      </section>

      <section className="lp-section lp-media-section" aria-labelledby="lp-media-title">
        <p className="lp-media-kicker">Voices of the archive</p>
        <h2 id="lp-media-title">Folklore was heard before it was read.</h2>
        {currentTrack ? (
          <div className="lp-audio-player">
            <Link
              to={`/entries/${currentTrack.entry.id}`}
              className="lp-audio-artwork"
              style={{
                backgroundImage: `linear-gradient(0deg, rgb(13 13 12 / 62%), transparent 52%), url("${currentTrack.entry.cover_image_url || HERO_IMAGE}")`,
              }}
              aria-label={`Open ${currentTrack.entry.title}`}
            >
              <span>Field recording · Bicol</span>
            </Link>
            <div className="lp-audio-content">
              <p className="lp-audio-label">Archive recording</p>
              <Link to={`/entries/${currentTrack.entry.id}`} className="lp-audio-title-link">
                <h3>{currentTrack.entry.title}</h3>
              </Link>
              <p className="lp-audio-meta">
                {[formatAudioLocation(currentTrack.entry), currentTrack.entry.category_auto]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
              <div className="lp-audio-controls">
                <button
                  type="button"
                  onClick={() => changeAudioTrack(-1)}
                  disabled={audioTracks.length < 2}
                  aria-label="Play previous recording"
                >
                  <span aria-hidden="true">|◀</span>
                </button>
                <audio
                  ref={audioRef}
                  key={currentTrack.id}
                  controls
                  src={currentTrack.file_url}
                  onEnded={() => changeAudioTrack(1)}
                  aria-label={`Play recording: ${currentTrack.entry.title}`}
                />
                <button
                  type="button"
                  onClick={() => changeAudioTrack(1)}
                  disabled={audioTracks.length < 2}
                  aria-label="Play next recording"
                >
                  <span aria-hidden="true">▶|</span>
                </button>
              </div>
              <p className="lp-audio-track-count">
                Recording {currentTrackIndex + 1} of {audioTracks.length}
              </p>
              <Link to="/browse?category=Oral%20Traditions" className="lp-audio-browse-link">
                Explore more voices <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="lp-audio-empty">
            <p>
              Published entries with recordings will be playable here. Explore songs,
              language, and oral traditions in the archive.
            </p>
            <Link to="/browse?category=Folk%20Songs%20%26%20Chants">
              Browse songs and chants <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
        {errors.audio && <p className="lp-audio-error" role="status">{errors.audio}</p>}
      </section>

      {highlight && (
        <section className="lp-section lp-highlight-section">
          <SectionHeading>Highlight of the Week</SectionHeading>
          <Link to={`/entries/${highlight.heritage_entry_id}`} className="lp-highlight-card">
            <div
              className="lp-highlight-photo"
              style={{ backgroundImage: `url("${highlight.cover_image_url || HERO_IMAGE}")` }}
            />
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
                style={{ backgroundImage: `url("https://images.unsplash.com/${category.image}?auto=format&fit=crop&w=700&q=80")` }}
                aria-hidden="true"
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
        <SectionHeading linkTo="/map" linkLabel="Open the map →">Explore the Region</SectionHeading>
        <div className="lp-region-explorer">
          <div className="lp-region-list">
            <p className="lp-region-kicker">Stories by place</p>
            {REGIONS.map((region, index) => (
              <Link
                key={region.name}
                to={`/browse?region=${encodeURIComponent(region.name)}`}
                className="lp-region-card"
              >
                <span className="lp-region-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="lp-region-copy">
                  <strong>{region.name}</strong>
                  <small>{region.area}</small>
                </span>
                <span className="lp-region-arrow" aria-hidden="true">→</span>
              </Link>
            ))}
          </div>
          <div className="lp-region-map">
            <MapContainer
              center={MAP_CENTER}
              zoom={9}
              scrollWheelZoom={false}
              aria-label="Map of heritage locations in Camarines Sur"
            >
              <FitLandingMarkers markers={validMapMarkers} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {validMapMarkers.map((marker) => {
                const markerColor = marker.type === 'entry'
                  ? '#e6a800'
                  : marker.isHighlighted
                    ? '#6750a4'
                    : '#176b5b';
                return (
                  <CircleMarker
                    key={`${marker.type}-${marker.id}`}
                    center={[marker.latitude, marker.longitude]}
                    radius={6}
                    pathOptions={{ color: '#181816', fillColor: markerColor, fillOpacity: 1, weight: 2 }}
                  >
                    <Popup>
                      <div className="lp-map-popup">
                        <strong>{marker.title}</strong>
                        {marker.approximateLocation && <small>Approximate province location</small>}
                        {marker.type === 'entry'
                          ? <Link to={`/entries/${marker.id}`}>View entry →</Link>
                          : marker.description && <p>{marker.description}</p>}
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </MapContainer>
            {(mapLoading || mapLoadError || (!validMapMarkers.length && !mapLoading)) && (
              <div className="lp-map-status" role={mapLoadError ? 'alert' : 'status'}>
                {mapLoadError || (mapLoading ? 'Loading heritage locations…' : 'No mapped heritage locations yet.')}
              </div>
            )}
            <Link to="/map" className="lp-map-link">Explore the interactive map <span aria-hidden="true">↗</span></Link>
          </div>
        </div>
      </section>

      <section
        className="lp-latest-archive"
        aria-labelledby="lp-latest-archive-title"
        style={{ '--lp-latest-image': `url("${entries[0]?.cover_image_url || CRAFT_IMAGE}")` }}
      >
        <div className="lp-latest-archive-inner">
          <div className="lp-latest-archive-heading">
            <p className="lp-latest-archive-kicker">Browse the archive</p>
            <Link to="/browse" className="lp-latest-archive-all">View all records <span aria-hidden="true">→</span></Link>
            <h2 id="lp-latest-archive-title">Stories, traditions, and places arranged like an editorial archive.</h2>
          </div>
          {errors.entries ? (
            <p className="lp-feed-error">{errors.entries}</p>
          ) : entries.length > 0 ? (
            <div className="lp-latest-archive-grid">
              <Link
                to={`/entries/${entries[0].id}`}
                className="lp-latest-feature"
                style={{ '--lp-latest-feature-image': `url("${entries[0].cover_image_url || CRAFT_IMAGE}")` }}
              >
                <span className="lp-latest-feature-content">
                  <span className="lp-latest-feature-meta">
                    Featured record{entries[0].category_auto ? ` · ${entries[0].category_auto}` : ''}
                  </span>
                  <strong>{entries[0].title}</strong>
                  <span className="lp-latest-feature-details">
                    {[entries[0].region, entries[0].historical_period].filter(Boolean).join(' · ')}
                  </span>
                  <span className="lp-latest-feature-link">Explore the collection <span aria-hidden="true">→</span></span>
                </span>
              </Link>
              <div className="lp-latest-stories">
                <h3>Latest stories</h3>
                {entries.slice(1, 4).map((entry) => (
                  <LatestStoryLink key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          ) : (
            <p className="lp-empty-message">New heritage entries will appear here as they are published.</p>
          )}
        </div>
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
