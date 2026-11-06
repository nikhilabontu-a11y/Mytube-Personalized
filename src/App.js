
import React, { useState, useEffect, useCallback, useRef } from 'react';

const API_KEY = process.env.REACT_APP_YT_API_KEY;
const PLAYLIST_ID = 'PLN7bpC8YROf4';

export default function App() {
  const [videos, setVideos] = useState([]);
  const [selected, setSelected] = useState(null);
  const [nextPage, setNextPage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadingRef = useRef(false);

  const loadVideos = useCallback(async (replace = false, pageToken = '') => {
    if (loadingRef.current) return;

    if (!API_KEY) {
      setError('API key is missing. Check your .env.local file.');
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        part: 'snippet',
        maxResults: '50',
        playlistId: PLAYLIST_ID,
        key: API_KEY
      });

      if (pageToken) {
        params.set('pageToken', pageToken);
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?${params}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Unable to load playlist.');
      }

      const newVideos = (data.items || [])
        .filter(item => item.snippet?.resourceId?.videoId)
        .map(item => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail:
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.default?.url
        }));

      setVideos(previous => {
        if (replace) return newVideos;

        const existing = new Set(previous.map(video => video.id));

        return [
          ...previous,
          ...newVideos.filter(video => !existing.has(video.id))
        ];
      });

      setNextPage(data.nextPageToken || null);

      if (replace) {
        setSelected(current =>
          newVideos.find(video => video.id === current?.id) ||
          newVideos[0] ||
          null
        );
      } else {
        setSelected(current => current || newVideos[0] || null);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // Fetch playlist when Karmaa opens.
  useEffect(() => {
    loadVideos(true);
  }, [loadVideos]);

  // Refresh when returning to Karmaa.
  useEffect(() => {
    const refreshPlaylist = () => {
      if (document.visibilityState === 'visible') {
        loadVideos(true);
      }
    };

    document.addEventListener('visibilitychange', refreshPlaylist);

    return () => {
      document.removeEventListener('visibilitychange', refreshPlaylist);
    };
  }, [loadVideos]);

  return (
    <main style={{
      minHeight: '100vh',
      background: '#1e1410',
      color: '#f4e6c8',
      padding: '16px',
      fontFamily: 'Arial, sans-serif',
      boxSizing: 'border-box'
    }}>

      <header style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '20px'
      }}>
        <img
          src="/icons/icon-192.png"
          alt="Karmaa"
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%'
          }}
        />

        <div>
          <h1 style={{ margin: 0 }}>Karmaa</h1>
          <small>My personal playlist</small>
        </div>
      </header>

      {selected && (
        <section>
          <div style={{
            position: 'relative',
            width: '100%',
            paddingTop: '56.25%',
            background: '#000',
            borderRadius: '12px',
            overflow: 'hidden'
          }}>
            <iframe
              key={selected.id}
              src={`https://www.youtube-nocookie.com/embed/${selected.id}`}
              title={selected.title}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                border: 0
              }}
            />
          </div>

          <h3>{selected.title}</h3>
        </section>
      )}

      <section>
        <h2>My Videos ({videos.length})</h2>

        {videos.map((video, index) => (
          <button
            key={video.id}
            onClick={() => setSelected(video)}
            style={{
              display: 'flex',
              alignItems: 'center',
              width: '100%',
              gap: '12px',
              padding: '10px',
              marginBottom: '8px',
              border: 'none',
              borderRadius: '8px',
              background: selected?.id === video.id
                ? '#59402b'
                : '#30221a',
              color: '#fff',
              textAlign: 'left',
              cursor: 'pointer'
            }}
          >
            <img
              src={video.thumbnail}
              alt=""
              style={{
                width: '120px',
                height: '68px',
                objectFit: 'cover',
                borderRadius: '6px',
                flexShrink: 0
              }}
            />

            <span style={{ fontSize: '14px' }}>
              {index + 1}. {video.title}

              {selected?.id === video.id && (
                <span style={{
                  display: 'block',
                  color: '#e5c17b',
                  marginTop: '5px'
                }}>
                  Playing
                </span>
              )}
            </span>
          </button>
        ))}
      </section>

      {loading && <p>Loading playlist...</p>}

      {error && (
        <p style={{ color: '#ff9999' }}>{error}</p>
      )}

      {nextPage && (
        <button
          onClick={() => loadVideos(false, nextPage)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '14px',
            background: '#c6a36a',
            color: '#21170f',
            border: 0,
            borderRadius: '8px',
            fontWeight: 'bold'
          }}
        >
          Load More Videos
        </button>
      )}
    </main>
  );
}
