export async function searchYouTube(req, res) {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing query' });
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) return res.status(503).json({ error: 'YouTube API not configured' });

  try {
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=1&relevanceLanguage=en&key=${key}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) throw new Error(`YouTube API ${searchRes.status}`);
    const searchData = await searchRes.json();

    const item = searchData.items?.[0];
    if (!item) return res.json({ video: null });

    const videoId = item.id?.videoId;
    const snippet = item.snippet;

    // Get view count via videos endpoint
    const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${key}`;
    const statsRes = await fetch(statsUrl);
    const statsData = await statsRes.json();
    const viewCount = statsData.items?.[0]?.statistics?.viewCount || null;

    res.json({
      video: {
        videoId,
        title: snippet.title,
        channel: snippet.channelTitle,
        thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url,
        viewCount: viewCount ? parseInt(viewCount).toLocaleString() : null,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      }
    });
  } catch (err) {
    console.error('[YouTube]', err.message);
    res.status(500).json({ error: 'YouTube search failed' });
  }
}
