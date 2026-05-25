import React, { useState, useEffect } from 'react';

export default function YouTubeCard({ query, c, locale }) {
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    setFailed(false);
    setVideo(null);
    fetch(`https://ffxplain-api.onrender.com/api/youtube?q=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(d => {
        if (d.video) setVideo(d.video);
        else setFailed(true);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, [query]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'rgba(248,113,113,0.06)', borderRadius: 8, border: `1px solid rgba(248,113,113,0.15)` }}>
        <div style={{ width: 80, height: 45, background: 'rgba(248,113,113,0.1)', borderRadius: 6, flexShrink: 0, animation: 'fpShimmer 1.4s ease-in-out infinite' }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
          <div style={{ height: 9, width: '80%', background: 'rgba(248,113,113,0.1)', borderRadius: 4, animation: 'fpShimmer 1.4s ease-in-out 0.1s infinite' }} />
          <div style={{ height: 8, width: '50%', background: 'rgba(248,113,113,0.08)', borderRadius: 4, animation: 'fpShimmer 1.4s ease-in-out 0.2s infinite' }} />
        </div>
      </div>
    );
  }

  if (failed || !video) return null;

  return (
    <a
      href={video.url}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        background: 'rgba(248,113,113,0.06)',
        borderRadius: 8,
        border: `1px solid rgba(248,113,113,0.2)`,
        transition: '0.15s',
        cursor: 'pointer'
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = 'rgba(248,113,113,0.12)';
        e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = 'rgba(248,113,113,0.06)';
        e.currentTarget.style.borderColor = 'rgba(248,113,113,0.2)';
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <img src={video.thumbnail} alt="" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 6, display: 'block' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)">
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        </div>
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 13,
            color: '#f87171',
            margin: '0 0 3px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontWeight: 500
          }}
        >
          {video.title}
        </p>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: c.text3, margin: 0 }}>
          {video.channel}{video.viewCount ? ` · ${video.viewCount} views` : ''}
        </p>
      </div>
    </a>
  );
}
