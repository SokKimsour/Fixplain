import React, { useState } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import { darkTheme, lightTheme } from './constants/themes';

export default function App() {
  const [isDark] = useState(true);
  return (
    <ErrorBoundary theme={isDark ? darkTheme : lightTheme}>
      <Dashboard />
    </ErrorBoundary>
  );
}