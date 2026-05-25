import React, { Component } from 'react';
import { darkTheme } from '../constants/themes';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { crashed: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Fixplain crashed:', error, info);
  }

  render() {
    if (!this.state.crashed) return this.props.children;
    const c = this.props.theme || darkTheme;
    return (
      <div
        style={{
          minHeight: '100vh',
          background: c.bgBase,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 16,
          padding: '2rem',
          fontFamily: "'Sora', sans-serif"
        }}
      >
        <span style={{ fontSize: 34 }}>⚠</span>
        <p style={{ color: c.text1, fontSize: 18, fontWeight: 600, margin: 0 }}>Something went wrong</p>
        <p
          style={{
            color: c.text3,
            fontSize: 14,
            fontFamily: "'JetBrains Mono', monospace",
            margin: 0,
            maxWidth: 400,
            textAlign: 'center',
            lineHeight: 1.6
          }}
        >
          {this.state.error?.message || 'An unexpected error occurred.'}
        </p>
        <button
          onClick={() => {
            this.setState({ crashed: false, error: null });
            window.location.hash = '';
          }}
          style={{
            marginTop: 8,
            padding: '10px 24px',
            borderRadius: 20,
            border: `1px solid ${c.tealDim}`,
            background: c.tealGlow,
            color: c.teal,
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 14
          }}
        >
          ↺ Reload app
        </button>
      </div>
    );
  }
}
