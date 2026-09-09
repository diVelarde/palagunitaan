import { useMapEvents } from 'react-leaflet';

export default function AddSiteClickListener({ active, onPick }) {
  useMapEvents({
    click(e) {
      if (!active) return;
      onPick({ latitude: e.latlng.lat, longitude: e.latlng.lng });
    },
  });
  return null;
}
