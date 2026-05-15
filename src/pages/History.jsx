import React, { useEffect, useState } from 'react';
import { Video, Clock, Users, Copy, Check, ChevronRight, MessageSquare, Zap } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import api from '../utils/api';

function SummaryModal({ meeting, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }} onClick={onClose}>
      <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:20, width:'100%', maxWidth:600, maxHeight:'85vh', overflow:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ padding:24 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h2 style={{ color:'#fff', fontWeight:700, fontSize:16, margin:0 }}>{meeting.topic}</h2>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'#4D7AC7', cursor:'pointer', fontSize:20 }}>✕</button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
            {[['Host',meeting.hostName],['Duration',`${meeting.duration||0} min`],['Participants',meeting.participants?.length||0],['Date',meeting.createdAt?new Date(meeting.createdAt).toLocaleDateString('en-IN'):'N/A']].map(([l,v])=>(
              <div key={l} style={{ background:'#1A3A6B', borderRadius:10, padding:12 }}>
                <p style={{ color:'#94B4F0', fontSize:11, margin:'0 0 4px' }}>{l}</p>
                <p style={{ color:'#E8F0FF', fontSize:13, fontWeight:500, margin:0 }}>{v}</p>
              </div>
            ))}
          </div>
          {meeting.summary && (
            <div style={{ background:'#1A3A6B', borderRadius:12, padding:16, marginBottom:12 }}>
              <p style={{ color:'#1A56DB', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 10px' }}>AI Summary</p>
              <pre style={{ color:'#7BA8F5', fontSize:12, whiteSpace:'pre-wrap', lineHeight:1.6, margin:0, maxHeight:160, overflowY:'auto' }}>{meeting.summary}</pre>
            </div>
          )}
          {meeting.keyPoints?.length>0 && (
            <div style={{ background:'#1A3A6B', borderRadius:12, padding:16, marginBottom:12 }}>
              <p style={{ color:'#1A56DB', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 10px' }}>Key Points</p>
              <ul style={{ margin:0, paddingLeft:16 }}>{meeting.keyPoints.map((k,i)=><li key={i} style={{ color:'#7BA8F5', fontSize:12, marginBottom:4 }}>{k}</li>)}</ul>
            </div>
          )}
          {meeting.actionItems?.length>0 && (
            <div style={{ background:'#1A3A6B', borderRadius:12, padding:16 }}>
              <p style={{ color:'#f59e0b', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 10px' }}>⚡ Action Items</p>
              <ul style={{ margin:0, paddingLeft:16 }}>{meeting.actionItems.map((a,i)=><li key={i} style={{ color:'#7BA8F5', fontSize:12, marginBottom:4 }}>{a}</li>)}</ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function History() {
  const [meetings, setMeetings] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [copied,   setCopied]   = useState('');
  const [page,     setPage]     = useState(1);
  const [pages,    setPages]    = useState(1);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setLoading(true);
    api.get(`/meetings/history?page=${page}&limit=10`)
      .then(r => { setMeetings(r.data.meetings||[]); setPages(r.data.pages||1); })
      .catch(()=>{}).finally(()=>setLoading(false));
  }, [page]);

  const copy = (id) => { navigator.clipboard?.writeText(id); setCopied(id); setTimeout(()=>setCopied(''),2000); };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0B1120' }}>
      <Sidebar/>
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ maxWidth:1000, margin:'0 auto', padding:'32px 24px' }}>
          <div style={{ marginBottom:28 }}>
            <h1 style={{ color:'#fff', fontSize:22, fontWeight:700, margin:'0 0 4px' }}>Meeting History</h1>
            <p style={{ color:'#94B4F0', fontSize:13, margin:0 }}>All your past and current meetings with AI summaries</p>
          </div>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:60 }}>
              <div style={{ width:28, height:28, border:'2px solid #2D6FFF', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
            </div>
          ) : meetings.length===0 ? (
            <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:16, padding:60, textAlign:'center' }}>
              <Video size={36} style={{ color:'#1A2E55', margin:'0 auto 12px', display:'block' }}/>
              <p style={{ color:'#94B4F0', fontSize:14, margin:0 }}>No meetings yet. Start one from the dashboard!</p>
            </div>
          ) : (
            <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:16, overflow:'hidden' }}>
              {meetings.map((m, idx) => (
                <div key={m._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom: idx<meetings.length-1?'1px solid #1A3A6B':'none', cursor:'pointer', transition:'background .15s' }}
                  onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,.02)'}
                  onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                    <div style={{ width:38, height:38, background:'rgba(45,111,255,.12)', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Video size={16} color="#1A56DB"/>
                    </div>
                    <div>
                      <p style={{ color:'#fff', fontSize:14, fontWeight:500, margin:'0 0 3px' }}>{m.topic}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                        <span style={{ color:'#94B4F0', fontSize:11, display:'flex', alignItems:'center', gap:3 }}><Users size={10}/>{m.participants?.length||0}</span>
                        <span style={{ color:'#94B4F0', fontSize:11, display:'flex', alignItems:'center', gap:3 }}><Clock size={10}/>{m.duration||0} min</span>
                        <span style={{ color:'#94B4F0', fontSize:11 }}>{m.createdAt?new Date(m.createdAt).toLocaleDateString('en-IN'):''}</span>
                        {m.summary && <span style={{ color:'#1A56DB', fontSize:11, display:'flex', alignItems:'center', gap:3 }}><MessageSquare size={10}/>Summary</span>}
                        {m.isRecorded && <span style={{ color:'#34d399', fontSize:11, display:'flex', alignItems:'center', gap:3 }}>● Recorded</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <span style={{ padding:'2px 10px', borderRadius:9999, fontSize:11, fontWeight:500, background: m.status==='ended'?'#1A3A6B':'rgba(16,185,129,.1)', color: m.status==='ended'?'#94B4F0':'#34d399' }}>
                      {m.status==='ended'?'Ended':'Live'}
                    </span>
                    {m.summary && (
                      <button onClick={()=>setSelected(m)} style={{ display:'flex', alignItems:'center', gap:4, padding:'4px 10px', background:'rgba(45,111,255,.12)', border:'1px solid rgba(45,111,255,.25)', color:'#1A56DB', borderRadius:8, cursor:'pointer', fontSize:11 }}>
                        <Zap size={10}/>Summary
                      </button>
                    )}
                    <button onClick={()=>copy(m.meetingId)} style={{ background:'none', border:'none', color:'#94B4F0', cursor:'pointer', padding:4 }}>
                      {copied===m.meetingId?<Check size={14} color="#34d399"/>:<Copy size={14}/>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pages>1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:12, marginTop:20 }}>
              <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} style={{ padding:'6px 16px', background:'#1A3A6B', border:'1px solid #1A2E55', color: page===1?'#3A5A9A':'#E8F0FF', borderRadius:8, cursor: page===1?'not-allowed':'pointer', fontSize:13 }}>Prev</button>
              <span style={{ color:'#94B4F0', fontSize:13 }}>Page {page} of {pages}</span>
              <button onClick={()=>setPage(p=>Math.min(pages,p+1))} disabled={page===pages} style={{ padding:'6px 16px', background:'#1A3A6B', border:'1px solid #1A2E55', color: page===pages?'#3A5A9A':'#E8F0FF', borderRadius:8, cursor: page===pages?'not-allowed':'pointer', fontSize:13 }}>Next</button>
            </div>
          )}
        </div>
      </main>
      {selected && <SummaryModal meeting={selected} onClose={()=>setSelected(null)}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
