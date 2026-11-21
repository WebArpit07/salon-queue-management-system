import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { springSmooth } from './lib/motion';
import AppShell from './components/layout/AppShell';

// Page Views
import HomePage from './pages/HomePage';
import JoinQueuePage from './pages/JoinQueuePage';
import MyStatusPage from './pages/MyStatusPage';
import ReceptionPage from './pages/ReceptionPage';
import BarberPage from './pages/BarberPage';
import DisplayTvPage from './pages/DisplayTvPage';
import AdminPage from './pages/AdminPage';

export const App = () => {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={springSmooth}
    >
      <AppShell>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/join" element={<JoinQueuePage />} />
          <Route path="/status/:id" element={<MyStatusPage />} />
          <Route path="/reception" element={<ReceptionPage />} />
          <Route path="/barber/:name" element={<BarberPage />} />
          <Route path="/display" element={<DisplayTvPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </MotionConfig>
  );
};

export default App;
