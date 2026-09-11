import api from '../api/axios';

async function getMapData() {
  const res = await api.get('/api/map/data');
  return res.data.markers;
}

export default { getMapData };
