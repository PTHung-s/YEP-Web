import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Vote } from './components/Vote';
import { Tickets } from './components/Tickets';
import { Checkout } from './components/Checkout';

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/lineup" element={<Home />} /> {/* Just redirecting to home for visual for now, though not exact */}
        <Route path="/vote" element={<Vote />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </Layout>
  );
}
