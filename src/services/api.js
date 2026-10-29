import Axios from 'axios';
import { API_URL } from '../../config';

const api = Axios.create({
  baseURL: API_URL,
  // The session is an HttpOnly cookie set by the API
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export default api;
