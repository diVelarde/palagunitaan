import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

import { useAuth } from '../context/AuthContext';
import mapService from '../services/mapService';
import heritageSiteService from '../services/heritageSiteService';
import MapFilterSidebar, { defaultFilters, applyFilters } from '../components/MapFilterSidebar';
import AddSiteClickListener from '../components/AddSiteClickListener';
import AdminSiteMarkerForm from '../components/AdminSiteMarkerForm';

const DEFAULT_CENTER = [13.6218, 123.1948];
const DEFAULT_ZOOM = 11;

function dotIcon(color) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block; width:14px; height:14px; border-radius:50%; background:${color}; border:2px solid white; box-shadow:0 0 0 1px rgba(0,0,0,0.25);"></span>`,
    iconSize: [14, 14], iconAnchor: [7, 7], popupAnchor: [0, -8],
  });
}

const ICONS = { entry: dotIcon('#1e3a8a'), site: dotIcon('#B98A2E'), siteHighlighted: dotIcon('#7A2430') };
function iconFor(marker) {
  if (marker.type === 'site') return marker.isHighlighted ? ICONS.siteHighlighted : ICONS.site;
  return ICONS.entry;
}

export default function MapPage({ fetchMapData = mapService.getMapData, createSite = heritageSiteService.createSite }) {
  const { user } = useAuth(); // real DB role, not the view-role — admin tools must not be spoofable via the switcher
  const isAdmin = user?.role === 'admin';

  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState(defaultFilters());

  const [addingSite, setAddingSite] = useState(false);
  const [pickedCoords, setPickedCoords] = useState(null);
  const [saveError, setSaveError] = useState(null);

  function loadMarkers() {
    setLoading(true);
    return fetchMapData().then((data) => { setMarkers(data || []); setLoading(false); });
  }

  useEffect(() => {
    let active = true;
    loadMarkers().catch(() => active && setLoading(false));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchMapData]);

  const visibleMarkers = useMemo(() => applyFilters(markers, filters), [markers, filters]);

  async function handleSaveSite(siteData) {
    setSaveError(null);
    try {
      await createSite(siteData);
      setAddingSite(false);
      setPickedCoords(null);
      await loadMarkers();
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Could not save this site.');
      throw err;
    }
  }

  return (
    <div className="relative">
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Heritage Map</h1>
          <p className="text-sm text-gray-600">Documented entries and marked heritage sites across Camarines Sur.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { setAddingSite((v) => !v); setPickedCoords(null); }}
            className={`px-4 py-2 text-sm rounded-md font-medium ${addingSite ? 'bg-gray-200 text-gray-800' : 'bg-blue-900 text-white hover:bg-blue-800'}`}
          >
            {addingSite ? 'Cancel adding site' : '+ Add site'}
          </button>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12 flex gap-6">
        <MapFilterSidebar markers={markers} onChange={setFilters} />

        <div className="flex-1 flex gap-6">
          <div className="flex-1 rounded-lg overflow-hidden border border-gray-200" style={{ height: '560px' }}>
            {addingSite && (
              <div className="bg-amber-50 text-amber-800 text-xs text-center py-1.5">
                Click anywhere on the map to place the new site
              </div>
            )}
            <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: addingSite ? 'calc(100% - 28px)' : '100%', width: '100%' }}>
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
                          <Link to={`/entries/${marker.id}`} className="text-blue-800 text-xs hover:underline">View entry →</Link>
                        </>
                      ) : (
                        marker.description && <p className="text-gray-600 text-xs">{marker.description}</p>
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
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-8 -mt-6">
        {saveError && <p className="text-sm text-red-600 mb-2">{saveError}</p>}
        {!loading && visibleMarkers.length === 0 && (
          <p className="text-sm text-gray-500 text-center">No entries or sites match the current filters.</p>
        )}
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-900 inline-block" /> Heritage entry</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#B98A2E' }} /> Heritage site</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#7A2430' }} /> Highlighted site</span>
        </div>
      </div>
    </div>
  );
}
