import api from '../api/axios';

async function getMapData() {
  const res = await api.get('/api/map/data');
  return res.data.markers;
}

async function getRegions() {
  const res = await api.get('/api/map/regions');
  return res.data.regions;
}

const mapService = { getMapData, getRegions };

export default mapService;
