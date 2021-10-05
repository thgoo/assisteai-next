import Axios from 'axios';

const URL_PREFIX = {
  development: 'https://api.assisteai.com.br',
  production: 'https://api.assisteai.com.br',
};

const api = Axios.create({
  baseURL: URL_PREFIX[process.env.NODE_ENV],
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

export default api;
