import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './store/CartContext';
import { EventConfigProvider } from './store/EventConfigContext';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename="/yep26">
      <EventConfigProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </EventConfigProvider>
    </BrowserRouter>
  </StrictMode>,
);
