import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { CartProvider } from './lib/cart';
import { AuthProvider } from './lib/auth';
import App from './App';
import { Analytics } from '@vercel/analytics/react';
createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><AuthProvider><CartProvider><App /><Analytics /></CartProvider></AuthProvider></BrowserRouter></StrictMode>);
