// src/api/index.js
import axios from 'axios';

// 選手一覧を取得
export const fetchPlayers = () =>
  axios.get('/players').then(res => res.data);

// 保護者一覧を取得
export const fetchLineUsers = () =>
  axios.get('/line_user').then(res => res.data);

// （紐づけ用の更新 API。保護者の family_id を変更する想定）
export const updateLineUserFamily = (lineUserId, familyId) =>
  axios.patch(`/line_user/${lineUserId}`, { family_id: familyId });
