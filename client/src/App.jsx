import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { springSmooth } from './lib/motion';
import AppShell from './components/layout/AppShell';
import ErrorBoundary from './components/ui/ErrorBoundary';

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
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/join" element={<JoinQueuePage />} />
            <Route path="/status/:id" element={<MyStatusPage />} />
            <Route path="/status" element={<Navigate to="/" replace />} />
            <Route path="/ticket/:id" element={<MyStatusPage />} />
            <Route path="/ticket" element={<Navigate to="/" replace />} />
            <Route path="/reception" element={<ReceptionPage />} />
            <Route path="/barber/:name" element={<BarberPage />} />
            <Route path="/barber" element={<Navigate to="/barber/ravi" replace />} />
            <Route path="/barbers" element={<Navigate to="/barber/ravi" replace />} />
            <Route path="/display" element={<DisplayTvPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </AppShell>
    </MotionConfig>
  );
};

export default App;
