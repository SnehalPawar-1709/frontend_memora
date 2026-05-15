import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Clock, Video, Copy, Check, X, ArrowRight } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

function StatCard({ icon: Icon, label, value, bg, iconColor }) {
  return (
    <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:14, padding:20, display:'flex', alignItems:'center', gap:14, boxShadow:'0 1px 8px rgba(45,111,255,.08)' }}>
      <div style={{ width:46, height:46, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:bg, flexShrink:0 }}>
        <Icon size={20} color={iconColor}/>
      </div>
      <div>
        <p style={{ color:'#E8F0FF', fontSize:26, fontWeight:700, margin:0, lineHeight:1 }}>{value}</p>
        <p style={{ color:'#4D7AC7', fontSize:13, margin:'4px 0 0' }}>{label}</p>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.7)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:20, width:'100%', maxWidth:420, padding:28, boxShadow:'0 20px 60px rgba(45,111,255,.2)' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
          <h2 style={{ color:'#E8F0FF', fontWeight:700, fontSize:17, margin:0 }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#3A5A9A', cursor:'pointer', fontSize:20 }}><X size={20}/></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [modal,    setModal]   = useState('');
  const [topic,    setTopic]   = useState('');
  const [joinId,   setJoinId]  = useState('');
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [history,  setHistory] = useState([]);
  const [copied,   setCopied]  = useState('');

  useEffect(() => {
    api.get('/meetings/history?limit=5')
      .then(r => setHistory(r.data.meetings || []))
      .catch(() => {});
  }, []);

  const userId  = String(user?.id || '');
  const hosted  = history.filter(m => String(m.hostId) === userId).length;
  const joined  = history.filter(m => String(m.hostId) !== userId).length;
  const total   = history.length;

  const openModal  = (type) => { setModal(type); setError(''); setTopic(''); setJoinId(''); };
  const closeModal = () => { setModal(''); setError(''); };

  const createMeeting = async () => {
    if (!topic.trim()) { setError('Enter a meeting topic'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/meetings/create', { topic: topic.trim() });
      navigate(`/meeting/${data.meetingId}`);
    } catch(e) { setError(e.response?.data?.message || 'Failed to create meeting'); }
    finally { setLoading(false); }
  };

  const joinMeeting = async () => {
    if (!joinId.trim()) { setError('Enter a meeting ID'); return; }
    setLoading(true); setError('');
    try {
      const { data } = await api.post('/meetings/join', { meetingId: joinId.trim() });
      navigate(`/meeting/${data.meetingId}`);
    } catch(e) { setError(e.response?.data?.message || 'Meeting not found'); }
    finally { setLoading(false); }
  };

  const copy = (id) => { navigator.clipboard?.writeText(id); setCopied(id); setTimeout(()=>setCopied(''),2000); };

  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };

  const inp = { width:'100%', padding:'10px 14px', background:'#0D1626', border:'1.5px solid #1A3A6B', color:'#E8F0FF', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box', transition:'border .2s' };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0B1120', fontFamily:'Inter,system-ui,sans-serif' }}>
      <Sidebar/>
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'32px 24px' }}>

          {/* Header */}
          <div style={{ marginBottom:28 }}>
            <h1 style={{ color:'#E8F0FF', fontSize:22, fontWeight:700, margin:'0 0 4px' }}>
              {greeting()}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color:'#4D7AC7', fontSize:13, margin:0 }}>Ready to meet? Start or join a meeting below.</p>
          </div>

          {/* Quick actions */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:24 }}>
            <button onClick={() => openModal('create')}
              style={{ background:'#111C35', border:'1.5px solid #1A3A6B', borderRadius:16, padding:22, textAlign:'left', cursor:'pointer', transition:'all .2s', boxShadow:'0 1px 8px rgba(45,111,255,.08)' }}
              onMouseOver={e=>{e.currentTarget.style.borderColor='#2D6FFF'; e.currentTarget.style.boxShadow='0 4px 20px rgba(45,111,255,.2)';}}
              onMouseOut={e=>{e.currentTarget.style.borderColor='#1A3A6B'; e.currentTarget.style.boxShadow='0 1px 8px rgba(45,111,255,.08)';}}>
              <div style={{ width:42, height:42, background:'#2D6FFF', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, boxShadow:'0 4px 12px rgba(45,111,255,.35)' }}>
                <Plus size={20} color="#fff"/>
              </div>
              <p style={{ color:'#E8F0FF', fontWeight:700, fontSize:15, margin:'0 0 4px' }}>New Meeting</p>
              <p style={{ color:'#3A5A9A', fontSize:12, margin:0 }}>Start an instant meeting</p>
            </button>
            <button onClick={() => openModal('join')}
              style={{ background:'#111C35', border:'1.5px solid #1A3A6B', borderRadius:16, padding:22, textAlign:'left', cursor:'pointer', transition:'all .2s', boxShadow:'0 1px 8px rgba(45,111,255,.08)' }}
              onMouseOver={e=>{e.currentTarget.style.borderColor='#2D6FFF'; e.currentTarget.style.boxShadow='0 4px 20px rgba(45,111,255,.2)';}}
              onMouseOut={e=>{e.currentTarget.style.borderColor='#1A3A6B'; e.currentTarget.style.boxShadow='0 1px 8px rgba(45,111,255,.08)';}}>
              <div style={{ width:42, height:42, background:'#0B1120', border:'1.5px solid #1A3A6B', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14 }}>
                <Users size={20} color="#2D6FFF"/>
              </div>
              <p style={{ color:'#E8F0FF', fontWeight:700, fontSize:15, margin:'0 0 4px' }}>Join Meeting</p>
              <p style={{ color:'#3A5A9A', fontSize:12, margin:0 }}>Enter a meeting ID</p>
            </button>
          </div>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:28 }}>
            <StatCard icon={Video}   label="Total Meetings"  value={total}  bg="#0B1120" iconColor="#2D6FFF"/>
            <StatCard icon={Users}   label="As Host"         value={hosted} bg="rgba(16,185,129,.15)" iconColor="#10B981"/>
            <StatCard icon={Clock}   label="As Participant"  value={joined} bg="rgba(217,119,6,.15)" iconColor="#D97706"/>
          </div>

          {/* Recent meetings */}
          {history.length > 0 && (
            <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:16, overflow:'hidden', boxShadow:'0 1px 8px rgba(45,111,255,.08)' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderBottom:'1px solid #1A3A6B' }}>
                <h2 style={{ color:'#E8F0FF', fontWeight:600, fontSize:14, margin:0 }}>Recent Meetings</h2>
                <a href="/history" style={{ color:'#2D6FFF', fontSize:12, textDecoration:'none', display:'flex', alignItems:'center', gap:4, fontWeight:500 }}>
                  View all <ArrowRight size={12}/>
                </a>
              </div>
              {history.slice(0,5).map((m, idx) => (
                <div key={m._id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 20px', borderBottom: idx<Math.min(history.length,5)-1?'1px solid #0D1626':'none', transition:'background .15s' }}
                  onMouseOver={e=>e.currentTarget.style.background='#0D1626'}
                  onMouseOut={e=>e.currentTarget.style.background='transparent'}>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ width:36, height:36, background:'#0B1120', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                      <Video size={15} color="#2D6FFF"/>
                    </div>
                    <div>
                      <p style={{ color:'#E8F0FF', fontSize:13, fontWeight:600, margin:'0 0 2px' }}>{m.topic}</p>
                      <p style={{ color:'#3A5A9A', fontSize:11, margin:0 }}>{m.hostName} · {m.duration||0} min · {new Date(m.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ padding:'2px 10px', borderRadius:9999, fontSize:11, fontWeight:600, background: m.status==='ended'?'#1A2E55':'rgba(16,185,129,.15)', color: m.status==='ended'?'#4D7AC7':'#34D399' }}>
                      {m.status==='ended'?'Ended':'Active'}
                    </span>
                    <button onClick={()=>copy(m.meetingId)} style={{ background:'none', border:'none', color:'#3A5A9A', cursor:'pointer', padding:4, borderRadius:6, transition:'color .15s' }}
                      onMouseOver={e=>e.currentTarget.style.color='#2D6FFF'} onMouseOut={e=>e.currentTarget.style.color='#3A5A9A'}>
                      {copied===m.meetingId ? <Check size={14} color="#10B981"/> : <Copy size={14}/>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create modal */}
      {modal==='create' && (
        <Modal title="New Meeting" onClose={closeModal}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', color:'#94B4F0', fontSize:12, fontWeight:600, marginBottom:6 }}>Meeting Topic *</label>
              <input autoFocus value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==='Enter'&&createMeeting()}
                style={inp} placeholder="e.g. Weekly Standup"
                onFocus={e=>e.target.style.borderColor='#2D6FFF'} onBlur={e=>e.target.style.borderColor='#1A3A6B'}/>
            </div>
            {error && <p style={{ color:'#EF4444', fontSize:12, margin:0 }}>{error}</p>}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={closeModal} style={{ flex:1, padding:'10px', background:'#1A2E55', border:'none', color:'#94B4F0', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:500 }}>Cancel</button>
              <button onClick={createMeeting} disabled={loading} style={{ flex:1, padding:'10px', background:'#2D6FFF', border:'none', color:'#fff', borderRadius:10, cursor:loading?'not-allowed':'pointer', fontSize:13, fontWeight:700, boxShadow:'0 4px 12px rgba(45,111,255,.35)', opacity:loading?0.7:1 }}>
                {loading ? 'Creating...' : 'Start Meeting'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Join modal */}
      {modal==='join' && (
        <Modal title="Join Meeting" onClose={closeModal}>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', color:'#94B4F0', fontSize:12, fontWeight:600, marginBottom:6 }}>Meeting ID *</label>
              <input autoFocus value={joinId} onChange={e=>setJoinId(e.target.value)} onKeyDown={e=>e.key==='Enter'&&joinMeeting()}
                style={{ ...inp, fontFamily:'monospace' }} placeholder="Enter meeting ID"
                onFocus={e=>e.target.style.borderColor='#2D6FFF'} onBlur={e=>e.target.style.borderColor='#1A3A6B'}/>
            </div>
            {error && <p style={{ color:'#EF4444', fontSize:12, margin:0 }}>{error}</p>}
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={closeModal} style={{ flex:1, padding:'10px', background:'#1A2E55', border:'none', color:'#94B4F0', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:500 }}>Cancel</button>
              <button onClick={joinMeeting} disabled={loading} style={{ flex:1, padding:'10px', background:'#2D6FFF', border:'none', color:'#fff', borderRadius:10, cursor:loading?'not-allowed':'pointer', fontSize:13, fontWeight:700, boxShadow:'0 4px 12px rgba(45,111,255,.35)', opacity:loading?0.7:1 }}>
                {loading ? 'Joining...' : 'Join Now'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
