import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.timeout = 10000; // Timeout depois de 10 segundos

export default axios;