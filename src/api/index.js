// src/api/index.js
import axios from 'axios';

const api = axios.create({ baseURL: '/liff/admin/api' });

// Log any API errors to aid debugging
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API request failed:', error);
    return Promise.reject(error);
  }
);

// （紐づけ用の更新 API。保護者の family_id を変更する想定）
export const updateLineUserFamily = (lineUserId, familyId) =>
  api.patch(`/line_user.php?id=${lineUserId}`, { family_id: familyId })
    .then(r => r.data);

// 選手の family_id 更新
export const updatePlayerFamily = (playerId, familyId) =>
  api.patch(`/players.php?id=${playerId}`, { family_id: familyId });

// src/api/index.js
export const fetchPlayers = () => api.get('/players.php').then(r => r.data);
export const addPlayer = name =>
  api.post('/players.php', { name }).then(r => r.data);
export const updatePlayerFam = (id, fid) => api.patch(`/players.php?id=${id}`, { family_id: fid });
export const deletePlayer = id => api.delete(`/players.php?id=${id}`);

export const deleteRenkeiPlayer = (lineUserId) =>
  api.patch(`/line_user.php?id=${lineUserId}`, { family_id: null })
    .then(r => r.data);

export const fetchLineUsers = () => api.get('/line_user.php').then(r => r.data);
export const updateLineFam = (id, fid) => api.patch(`/line_user.php?id=${id}`, { family_id: fid });
export const updatePlayerSubCount = (id, count) =>
  api.patch(`/players.php?id=${id}`, { substitute_count: count });