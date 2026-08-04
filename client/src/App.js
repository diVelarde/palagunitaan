import { useEffect } from 'react';
import api from './api/axios';

console.log('API URL:', process.env.REACT_APP_API_URL);

function App() {
  useEffect(() => {

    api.get('/api/test')
      .then(res => console.log(res.data))
      .catch(err => console.error(err));
  }, []);

  return (
    <div>
      <h1>Palagunitaan</h1>
    </div>
  );
}

export default App;