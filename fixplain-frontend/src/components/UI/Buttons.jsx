import React from 'react';
import { mono } from '../../constants/themes';

export const CopyBtn = ({ c, onClick }) => (
  <button
    onClick={onClick}
    style={{
      fontFamily: mono,
      fontSize: 12,
      padding: '4px 12px',
      borderRadius: 20,
      border: `1px solid ${c.border}`,
      background: 'transparent',
      color: c.text2,
      cursor: 'pointer',
      transition: '0.2s'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = c.green;
      e.currentTarget.style.color = c.green;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = c.border;
      e.currentTarget.style.color = c.text2;
    }}
  >
    copy
  </button>
);

export const UseCodeBtn = ({ c, onClick }) => (
  <button
    onClick={onClick}
    style={{
      fontFamily: mono,
      fontSize: 12,
      padding: '4px 12px',
      borderRadius: 20,
      border: `1px solid ${c.border}`,
      background: 'transparent',
      color: c.text2,
      cursor: 'pointer',
      transition: '0.2s'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = c.teal;
      e.currentTarget.style.color = c.teal;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = c.border;
      e.currentTarget.style.color = c.text2;
    }}
  >
    ← use
  </button>
);
