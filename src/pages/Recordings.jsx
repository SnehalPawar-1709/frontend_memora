import React, { useEffect, useState, useCallback } from 'react';
import { Play, Download, Trash2, RefreshCw, Search, X } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import api from '../utils/api';

const formatDur = (mins) => {
  if (!mins || mins === 0) return '0m';
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins/60)}h ${mins % 60}m`;
};

function VideoModal({ rec, onClose }) {
  return (
    <div
      onClick={onClose}
      style={{ position:'fixed', inset:0, background:'rgba(45,111,255,.2)', zIndex:100,
               display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:16,
                 overflow:'hidden', width:'100%', maxWidth:800 }}
      >
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      padding:'14px 20px', borderBottom:'1px solid #1A3A6B' }}>
          <div>
            <p style={{ color:'#fff', fontWeight:600, fontSize:15, margin:0 }}>{rec.topic}</p>
            <p style={{ color:'#94B4F0', fontSize:12, margin:'3px 0 0' }}>
              {new Date(rec.createdAt).toLocaleDateString()} · {formatDur(rec.duration)}
            </p>
          </div>
          <button onClick={onClose}
            style={{ background:'none', border:'none', color:'#4D7AC7', cursor:'pointer', fontSize:22, lineHeight:1 }}>
            ✕
          </button>
        </div>

        {/* Video player */}
        <video
          src={rec.recordingUrl}
          controls
          autoPlay
          style={{ width:'100%', display:'block', background:'#000', maxHeight:460 }}
        />

        {/* Download */}
        <div style={{ padding:16, display:'flex', gap:10 }}>
          <a href={rec.recordingUrl} target="_blank" rel="noopener noreferrer"
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 18px',
                     background:'#2D6FFF', color:'#fff', borderRadius:10,
                     textDecoration:'none', fontSize:13, fontWeight:600 }}>
            <Play size={14}/> Open Full
          </a>
          <a href={rec.recordingUrl} download={`${rec.topic}.webm`}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
                     background:'#1A3A6B', color:'#E8F0FF', borderRadius:10,
                     textDecoration:'none', fontSize:13, border:'1px solid #1A2E55' }}>
            <Download size={14}/> Download
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Recordings() {
  const [recordings, setRecordings] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [search,     setSearch]     = useState('');
  const [playing,    setPlaying]    = useState(null);
  const [deleting,   setDeleting]   = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/recordings');
      console.log('\n📋 Recordings fetched:', data.recordings?.length || 0);
      data.recordings?.forEach(r => console.log('   ✅', r.topic, '→', r.recordingUrl));
      setRecordings(data.recordings || []);
    } catch(e) {
      const msg = e.response?.data?.message || e.message;
      setError('Failed to load: ' + msg);
      console.error('Recordings error:', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (meetingId, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this recording? This cannot be undone.')) return;
    setDeleting(meetingId);
    try {
      await api.delete(`/recordings/${meetingId}`);
      setRecordings(r => r.filter(x => x.meetingId !== meetingId));
    } catch(e) {
      alert(e.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting('');
    }
  };

  const filtered = recordings.filter(r =>
    !search ||
    r.topic?.toLowerCase().includes(search.toLowerCase()) ||
    r.meetingId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0B1120',
                  fontFamily:'Inter,system-ui,sans-serif' }}>
      <Sidebar />
      <main style={{ flex:1, padding:'32px 32px', overflowY:'auto', maxWidth:1100 }}>

        {/* Title */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                      marginBottom:24, flexWrap:'wrap', gap:12 }}>
          <h1 style={{ color:'#fff', fontSize:24, fontWeight:700, margin:0 }}>Recordings</h1>
          <button onClick={load} disabled={loading}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 14px',
                     background:'#1A3A6B', border:'1px solid #1A2E55', color:'#7BA8F5',
                     borderRadius:9, cursor:'pointer', fontSize:13 }}>
            <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
            Refresh
          </button>
        </div>

        {/* Search */}
        {recordings.length > 3 && (
          <div style={{ position:'relative', marginBottom:20, maxWidth:360 }}>
            <Search size={13} style={{ position:'absolute', left:11, top:'50%',
                                       transform:'translateY(-50%)', color:'#94B4F0' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search recordings..."
              style={{ width:'100%', padding:'8px 12px 8px 33px', background:'#111C35',
                       border:'1px solid #1A3A6B', color:'#fff', borderRadius:9,
                       fontSize:13, outline:'none', boxSizing:'border-box' }}
            />
            {search && (
              <button onClick={() => setSearch('')}
                style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)',
                         background:'none', border:'none', color:'#94B4F0', cursor:'pointer' }}>
                <X size={12}/>
              </button>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ background:'rgba(220,38,38,.08)', border:'1px solid rgba(220,38,38,.2)',
                        borderRadius:10, padding:'10px 16px', color:'#f87171', fontSize:13,
                        marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span>⚠ {error}</span>
            <button onClick={load}
              style={{ background:'none', border:'1px solid #f87171', color:'#f87171',
                       borderRadius:6, padding:'2px 10px', cursor:'pointer', fontSize:12 }}>
              Retry
            </button>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div style={{ display:'flex', alignItems:'center', gap:12, padding:60,
                        justifyContent:'center' }}>
            <div style={{ width:24, height:24, border:'2.5px solid #2D6FFF',
                          borderTopColor:'transparent', borderRadius:'50%',
                          animation:'spin 1s linear infinite' }}/>
            <span style={{ color:'#94B4F0', fontSize:14 }}>Loading recordings...</span>
          </div>

        /* Empty */
        ) : filtered.length === 0 ? (
          <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:14,
                        padding:'56px 24px', textAlign:'center', maxWidth:860 }}>
            <div style={{ fontSize:44, marginBottom:14 }}>⏺</div>
            <p style={{ color:'#7BA8F5', fontSize:15, fontWeight:500, margin:'0 0 8px' }}>
              {search ? `No recordings match "${search}"` : 'No recordings yet'}
            </p>
            <p style={{ color:'#94B4F0', fontSize:13, margin:0 }}>
              {search
                ? 'Try a different search'
                : 'Start a meeting → More → Start Recording → End Meeting'}
            </p>
          </div>

        /* List — exactly matching screenshot style */
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:10, maxWidth:860 }}>
            {filtered.map(rec => (
              <div key={rec._id || rec.meetingId}
                onClick={() => setPlaying(rec)}
                style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:12,
                         padding:'16px 22px', display:'flex', alignItems:'center',
                         justifyContent:'space-between', cursor:'pointer',
                         transition:'border-color .15s' }}
                onMouseOver={e => e.currentTarget.style.borderColor = '#2D6FFF'}
                onMouseOut={e  => e.currentTarget.style.borderColor = '#1A3A6B'}
              >
                {/* Left — title + date */}
                <div>
                  <h3 style={{ color:'#fff', fontWeight:600, fontSize:15,
                               margin:'0 0 5px' }}>
                    {rec.topic || 'Meeting Recording'}
                  </h3>
                  <p style={{ color:'#94B4F0', fontSize:12, margin:0 }}>
                    {rec.createdAt
                      ? new Date(rec.createdAt).toLocaleDateString()
                      : 'N/A'}
                    {' · '}
                    {formatDur(rec.duration)}
                  </p>
                </div>

                {/* Right — buttons */}
                <div style={{ display:'flex', alignItems:'center', gap:8 }}
                     onClick={e => e.stopPropagation()}>
                  {/* Play — pill button matching screenshot */}
                  <button
                    onClick={() => setPlaying(rec)}
                    style={{ display:'flex', alignItems:'center', gap:6,
                             padding:'8px 22px', background:'#2D6FFF', border:'none',
                             color:'#fff', borderRadius:9999, cursor:'pointer',
                             fontSize:14, fontWeight:600 }}>
                    <Play size={13} style={{ marginLeft:2 }}/> Play
                  </button>

                  {/* Download icon */}
                  <a href={rec.recordingUrl} download onClick={e => e.stopPropagation()}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center',
                             width:36, height:36, background:'#1A3A6B',
                             border:'1px solid #1A2E55', color:'#4D7AC7',
                             borderRadius:9, textDecoration:'none',
                             transition:'color .15s' }}
                    onMouseOver={e => e.currentTarget.style.color='#fff'}
                    onMouseOut={e  => e.currentTarget.style.color='#4D7AC7'}>
                    <Download size={15}/>
                  </a>

                  {/* Delete icon */}
                  <button
                    onClick={e => handleDelete(rec.meetingId, e)}
                    disabled={deleting === rec.meetingId}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center',
                             width:36, height:36, background:'#1A3A6B',
                             border:'1px solid #1A2E55',
                             color: deleting === rec.meetingId ? '#3A5A9A' : '#4D7AC7',
                             borderRadius:9, cursor:'pointer', transition:'color .15s' }}
                    onMouseOver={e => { if (deleting !== rec.meetingId) e.currentTarget.style.color='#f87171'; }}
                    onMouseOut={e  => { e.currentTarget.style.color='#4D7AC7'; }}>
                    {deleting === rec.meetingId
                      ? <div style={{ width:13, height:13, border:'1.5px solid #4D7AC7',
                                      borderTopColor:'transparent', borderRadius:'50%',
                                      animation:'spin 1s linear infinite' }}/>
                      : <Trash2 size={15}/>
                    }
                  </button>
                </div>
              </div>
            ))}

            <p style={{ color:'#1A2E55', fontSize:12, textAlign:'center', marginTop:8 }}>
              {filtered.length} recording{filtered.length !== 1 ? 's' : ''} · stored on Cloudinary
            </p>
          </div>
        )}
      </main>

      {playing && <VideoModal rec={playing} onClose={() => setPlaying(null)} />}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
