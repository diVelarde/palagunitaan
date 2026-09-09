import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

const DEFAULT_CENTER = [13.6218, 123.1948]; // Naga City, Camarines Sur
const DEFAULT_ZOOM = 11;

function dotIcon(color) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block; width:14px; height:14px; border-radius:50%; background:${color}; border:2px solid white; box-shadow:0 0 0 1px rgba(0,0,0,0.25);"></span>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -8],
  });
}

const ICONS = {
  entry: dotIcon('#1e3a8a'),
  site: dotIcon('#B98A2E'),
  siteHighlighted: dotIcon('#7A2430'),
};

function iconFor(marker) {
  if (marker.type === 'site') return marker.isHighlighted ? ICONS.siteHighlighted : ICONS.site;
  return ICONS.entry;
}

export default function MapPage({ fetchMapData = async () => [] }) {
  const [markers, setMarkers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchMapData().then((data) => {
      if (active) { setMarkers(data || []); setLoading(false); }
    });
    return () => { active = false; };
  }, [fetchMapData]);

  return (
    <div className="relative">
      <div className="max-w-6xl mx-auto px-6 pt-8 pb-4">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Heritage Map</h1>
        <p className="text-sm text-gray-600">Documented entries and marked heritage sites across Camarines Sur.</p>
      </div>

      <div className="max-w-6xl mx-auto px-6 pb-12">
        <div className="rounded-lg overflow-hidden border border-gray-200" style={{ height: '560px' }}>
          <MapContainer center={DEFAULT_CENTER} zoom={DEFAULT_ZOOM} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {markers.map((marker) => (
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

        {!loading && markers.length === 0 && (
          <p className="text-sm text-gray-500 mt-4 text-center">No mapped entries or sites yet.</p>
        )}

        <div className="flex items-center gap-6 mt-4 text-xs text-gray-500">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-blue-900 inline-block" /> Heritage entry</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#B98A2E' }} /> Heritage site</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: '#7A2430' }} /> Highlighted site</span>
        </div>
      </div>
    </div>
  );
}
