import React from 'react';

export const Panel = ({ c, children, style = {}, ...rest }) => (
  <div
    style={{
      background: c.bgPanel,
      border: `1px solid ${c.borderSoft}`,
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      ...style
    }}
    {...rest}
  >
    {children}
  </div>
);

export const PanelHeader = ({ c, children }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      borderBottom: `1px solid ${c.borderSoft}`,
      background: c.bgSurface,
      flexWrap: 'wrap',
      gap: 6
    }}
  >
    {children}
  </div>
);

export const Dot = ({ color }) => (
  <span
    style={{
      width: 6,
      height: 6,
      borderRadius: '50%',
      background: color,
      display: 'inline-block'
    }}
  />
);
