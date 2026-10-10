import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

import { useAuth } from '../context/AuthContext';
import mapService from '../services/mapService';
import heritageSiteService from '../services/heritageSiteService';
import MapFilterSidebar, { defaultFilters, applyFilters } from '../components/MapFilterSidebar';
import AddSiteClickListener from '../components/AddSiteClickListener';
import AdminSiteMarkerForm from '../components/AdminSiteMarkerForm';
import './MapPage.css';

const DEFAULT_CENTER = [13.6218, 123.1948];
const DEFAULT_ZOOM = 11;

function FitMarkers({ markers }) {
  const map = useMap();
  useEffect(() => {
    if (!markers.length) return;
    const bounds = L.latLngBounds(markers.map((marker) => [marker.latitude, marker.longitude]));
    map.fitBounds(bounds, { padding: [32, 32], maxZoom: 11 });
  }, [map, markers]);
  return null;
}

function markerIcon(kind) {
  const marker = kind === 'entry'
    ? '<span class="map-marker-shape map-marker-entry"></span>'
    : kind === 'featured'
      ? '<span class="map-marker-shape map-marker-featured" aria-hidden="true"><span>★</span></span>'
      : '<span class="map-marker-shape map-marker-site"></span>';
  return L.divIcon({
    className: 'map-marker-icon',
    html: marker,
    iconSize: [18, 20], iconAnchor: [9, 17], popupAnchor: [0, -17],
  });
}

const ICONS = {
  entry: markerIcon('entry'),
  site: markerIcon('site'),
  siteHighlighted: markerIcon('featured'),
};
function iconFor(marker) {
  if (marker.type === 'site') return marker.isHighlighted ? ICONS.siteHighlighted : ICONS.site;
  return ICONS.entry;
}

export default function MapPage({
  fetchMapData = mapService.getMapData,
  fetchRegions = mapService.getRegions,
  createSite = heritageSiteService.createSite,
}) {
  const { user } = useAuth(); // real DB role, not the view-role — admin tools must not be spoofable via the switcher
  const isAdmin = user?.role === 'admin';

  const [markers, setMarkers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters());
  const [loadError, setLoadError] = useState('');
  const [regionsError, setRegionsError] = useState('');

  const [addingSite, setAddingSite] = useState(false);
  const [pickedCoords, setPickedCoords] = useState(null);
  const [saveError, setSaveError] = useState(null);

  function loadMarkers() {
    setLoading(true);
    return fetchMapData()
      .then((data) => {
        setMarkers(data || []);
        setLoadError('');
      })
      .catch((err) => {
        setLoadError(err.response?.data?.message || 'Could not refresh map data. Please try again later.');
        throw err;
      })
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    let active = true;
    Promise.allSettled([fetchMapData(), fetchRegions()])
      .then(([mapResult, regionResult]) => {
        if (!active) return;
        if (mapResult.status === 'fulfilled') {
          setMarkers(mapResult.value || []);
          setLoadError('');
        } else {
          setLoadError(mapResult.reason.response?.data?.message || 'Could not load map data. Please try again later.');
        }
        if (regionResult.status === 'fulfilled') {
          setRegions(regionResult.value || []);
          setRegionsError('');
        } else {
          setRegionsError('Region filters could not be loaded.');
        }
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMapData, fetchRegions]);

  const visibleMarkers = useMemo(() => applyFilters(markers, filters), [markers, filters]);

  async function handleSaveSite(siteData) {
    setSaveError(null);
    try {
      await createSite(siteData);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Could not save this site.');
      throw err;
    }
    setAddingSite(false);
    setPickedCoords(null);
    try {
      await loadMarkers();
    } catch {
      // loadMarkers surfaces refresh failures in the map error banner.
    }
  }

  return (
    <main className="heritage-map-page">
      <aside className="heritage-map-sidebar">
        <MapFilterSidebar markers={markers} regions={regions} onChange={setFilters} />
        <div className="map-sidebar-footer">
          <span><i className="map-legend-dot map-legend-entry" />Heritage entry</span>
          <span><i className="map-legend-dot map-legend-site" />Heritage site</span>
          <span><i className="map-legend-dot map-legend-highlighted">★</i>Featured site</span>
        </div>
      </aside>

      <section className="heritage-map-stage">
        {regionsError && <p className="map-load-error" role="status">{regionsError} The map is still available.</p>}
        <div className="heritage-map-toolbar">
          <div>
            <h1>Explore the Heritage Map</h1>
            <p>Stories and heritage sites across Camarines Sur and the Bicol Region.</p>
          </div>
          {isAdmin && (
            <button
              onClick={() => { setAddingSite((v) => !v); setPickedCoords(null); }}
              className={`map-add-site-button ${addingSite ? 'map-add-site-cancel' : ''}`}
            >
              {addingSite ? 'Cancel adding site' : '+ Add heritage site'}
            </button>
          )}
        </div>
        {loadError && <p className="map-load-error" role="alert">{loadError}</p>}
        <div className="heritage-map-canvas">
          {addingSite && (
            <div className="map-place-hint">
              Click anywhere on the map to place the new site
            </div>
          )}
          <div className="heritage-map-leaflet">
            {addingSite && (
              pickedCoords && <div className="map-picked-coordinates">Pinned at {pickedCoords.latitude.toFixed(4)}, {pickedCoords.longitude.toFixed(4)}</div>
            )}
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
              <FitMarkers markers={visibleMarkers} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <AddSiteClickListener active={addingSite} onPick={setPickedCoords} />
              {visibleMarkers.map((marker) => (
                <Marker key={`${marker.type}-${marker.id}`} position={[marker.latitude, marker.longitude]} icon={iconFor(marker)}>
                  <Popup>
                    <div className="text-sm">
                      <p className="font-medium text-gray-900 mb-1">{marker.title}</p>
                      {marker.type === 'entry' ? (
                        <>
                          {marker.category && <p className="text-gray-500 text-xs mb-2">{marker.category}</p>}
                          {marker.approximateLocation && <p className="text-gray-500 text-xs mb-2">Approximate province location</p>}
                          <Link to={`/entries/${marker.id}`} className="map-popup-link">View entry →</Link>
                        </>
                      ) : (
                        <>
                          {marker.imageUrl && (
                            <img
                              src={marker.imageUrl}
                              alt={`Photo of ${marker.title}`}
                              className="map-popup-photo"
                            />
                          )}
                          {marker.description && <p className="text-gray-600 text-xs">{marker.description}</p>}
                        </>
                      )}
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {addingSite && (
            <AdminSiteMarkerForm
              initialCoords={pickedCoords}
              onSubmit={handleSaveSite}
              onCancel={() => { setAddingSite(false); setPickedCoords(null); }}
            />
          )}
        </div>
        {saveError && <p className="map-load-error" role="alert">{saveError}</p>}
        {!loading && !loadError && visibleMarkers.length === 0 && (
          <p className="map-empty-state">No entries or sites match the current filters.</p>
        )}
      </section>
    </main>
  );
}
