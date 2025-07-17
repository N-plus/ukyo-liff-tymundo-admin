// src/index.js
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';      // Tailwind／グローバルスタイル
import App from './App';   // あなたの App コンポーネント

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
