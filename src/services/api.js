import Axios from 'axios';
import { API_URL } from '../../config';

const api = Axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export default api;
