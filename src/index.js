// frontend/src/index.js

import React from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
import { Provider } from 'react-redux';
import { store } from './store/store';

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);
