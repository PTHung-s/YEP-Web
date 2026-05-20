import React, { useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Lineup } from './components/Lineup';
import { Vote } from './components/Vote';
import { Tickets } from './components/Tickets';
import { Checkout } from './components/Checkout';
import { Confirmation } from './components/Confirmation';
import { Success } from './components/Success';
import { Admin } from './components/Admin';
import { Checkin } from './components/Checkin';

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
        <Route path="/lineup" element={<Lineup />} />
        <Route path="/vote" element={<Vote />} />
        <Route path="/tickets" element={<Tickets />} />
        <Route path="/confirmation" element={<Confirmation />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/success" element={<Success />} />
        <Route path="/ops-yep-2026" element={<Admin />} />
        <Route path="/checkin-yep-2026" element={<Checkin />} />
      </Routes>
    </Layout>
  );
}
