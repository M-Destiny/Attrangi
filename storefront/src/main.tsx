import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { CartProvider } from './lib/cart';
import { AuthProvider } from './lib/auth';
import App from './App';
createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><AuthProvider><CartProvider><App /></CartProvider></AuthProvider></BrowserRouter></StrictMode>);
