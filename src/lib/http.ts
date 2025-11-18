import axios from 'axios';

export const http = axios.create({});

http.defaults.headers.post['Content-Type'] = 'application/json';

export default http;
