import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Video, Clock, Lock, Users, Calendar, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

export default function JoinPage() {
  const { meetingId } = useParams();
  const navigate      = useNavigate();
  const { user }      = useAuth();

  const [meeting,  setMeeting]  = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [password, setPassword] = useState('');
  const [joining,  setJoining]  = useState(false);

  useEffect(() => {
    api.get(`/meetings/${meetingId}`)
      .then(r => setMeeting(r.data.meeting))
      .catch(() => setError('Meeting not found. Check the link.'))
      .finally(() => setLoading(false));
  }, [meetingId]);

  const handleJoin = async () => {
    if (!user) {
      // Save intent and redirect to login
      sessionStorage.setItem('join_after_login', meetingId);
      sessionStorage.setItem('join_password',    password);
      navigate('/login');
      return;
    }
    setJoining(true);
    try {
      await api.post('/meetings/join', { meetingId, password: password || '' });
      navigate(`/meeting/${meetingId}`);
    } catch(e) {
      setError(e.response?.data?.message || 'Failed to join');
    } finally { setJoining(false); }
  };

  // After login redirect, auto-join
  useEffect(() => {
    if (!user) return;
    const savedId  = sessionStorage.getItem('join_after_login');
    const savedPwd = sessionStorage.getItem('join_password') || '';
    if (savedId === meetingId) {
      sessionStorage.removeItem('join_after_login');
      sessionStorage.removeItem('join_password');
      api.post('/meetings/join', { meetingId, password: savedPwd })
        .then(() => navigate(`/meeting/${meetingId}`))
        .catch(e => setError(e.response?.data?.message || 'Failed to join'));
    }
  }, [user]);

  if (loading) return (
    <div style={{ minHeight:'100vh', background:'#0B1120', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:28, height:28, border:'2px solid #2D6FFF', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const scheduled  = meeting?.scheduledAt ? new Date(meeting.scheduledAt) : null;
  const diff       = scheduled ? scheduled - Date.now() : 0;
  const canJoin    = !scheduled || diff < 10 * 60 * 1000;
  const minsAway   = scheduled ? Math.ceil(diff / 60000) : 0;
  const hasPassword = meeting?.password;

  return (
    <div style={{ minHeight:'100vh', background:'#0B1120', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:'Inter,system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:440 }}>

        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <Link to="/" style={{ textDecoration:'none' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:10 }}>
              <div style={{ width:36, height:36, background:'#2D6FFF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center' }}>
                <Video size={18} color="#fff"/>
              </div>
              <span style={{ color:'#fff', fontWeight:700, fontSize:20 }}>Memora</span>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:20, padding:28 }}>

          {error && !meeting ? (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <AlertCircle size={40} style={{ color:'#f87171', margin:'0 auto 12px', display:'block' }}/>
              <h2 style={{ color:'#fff', fontWeight:700, fontSize:16, margin:'0 0 6px' }}>Meeting Not Found</h2>
              <p style={{ color:'#4D7AC7', fontSize:13, margin:'0 0 20px' }}>{error}</p>
              <Link to="/" style={{ color:'#1A56DB', fontSize:13 }}>← Back to Home</Link>
            </div>
          ) : meeting?.status === 'ended' ? (
            <div style={{ textAlign:'center', padding:'16px 0' }}>
              <div style={{ width:48, height:48, background:'rgba(100,116,139,.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
                <Clock size={22} color="#4D7AC7"/>
              </div>
              <h2 style={{ color:'#fff', fontWeight:700, fontSize:16, margin:'0 0 6px' }}>Meeting Ended</h2>
              <p style={{ color:'#4D7AC7', fontSize:13, margin:'0 0 20px' }}>This meeting has already ended.</p>
              <Link to="/" style={{ color:'#1A56DB', fontSize:13 }}>← Back to Home</Link>
            </div>
          ) : (
            <>
              {/* Meeting info */}
              <div style={{ marginBottom:22 }}>
                <p style={{ color:'#94B4F0', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 8px' }}>You're invited to</p>
                <h2 style={{ color:'#fff', fontWeight:700, fontSize:20, margin:'0 0 14px', lineHeight:1.3 }}>{meeting?.topic || meetingId}</h2>

                <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                  {scheduled && (
                    <div style={{ display:'flex', alignItems:'center', gap:10, background:'#1A3A6B', borderRadius:10, padding:'10px 14px' }}>
                      <Calendar size={15} color="#1A56DB"/>
                      <div>
                        <p style={{ color:'#e2e8f0', fontSize:13, fontWeight:500, margin:0 }}>
                          {scheduled.toLocaleDateString('en-IN',{weekday:'long',month:'long',day:'numeric',year:'numeric'})}
                        </p>
                        <p style={{ color:'#4D7AC7', fontSize:11, margin:0 }}>
                          {scheduled.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}
                        </p>
                      </div>
                    </div>
                  )}
                  <div style={{ display:'flex', alignItems:'center', gap:10, background:'#1A3A6B', borderRadius:10, padding:'10px 14px' }}>
                    <Users size={15} color="#1A56DB"/>
                    <p style={{ color:'#e2e8f0', fontSize:13, margin:0 }}>
                      Hosted by <strong>{meeting?.hostName}</strong>
                    </p>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:10, background:'#1A3A6B', borderRadius:10, padding:'10px 14px' }}>
                    <Video size={15} color="#1A56DB"/>
                    <p style={{ color:'#7BA8F5', fontSize:12, margin:0, fontFamily:'monospace' }}>{meetingId}</p>
                  </div>
                </div>
              </div>

              {/* Not started yet */}
              {scheduled && !canJoin && diff > 0 && (
                <div style={{ background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)', borderRadius:12, padding:'12px 16px', marginBottom:16, textAlign:'center' }}>
                  <p style={{ color:'#f59e0b', fontSize:12, fontWeight:600, margin:'0 0 2px' }}>Meeting starts in {minsAway} minutes</p>
                  <p style={{ color:'#92400e', fontSize:11, margin:0 }}>You can join 10 minutes before it starts</p>
                </div>
              )}

              {/* Password field */}
              {hasPassword && (
                <div style={{ marginBottom:14 }}>
                  <label style={{ display:'flex', alignItems:'center', gap:6, color:'#7BA8F5', fontSize:12, fontWeight:500, marginBottom:6 }}>
                    <Lock size={11}/>Meeting Password Required
                  </label>
                  <input type="password" value={password} onChange={e=>setPassword(e.target.value)}
                    onKeyDown={e=>e.key==='Enter'&&canJoin&&handleJoin()}
                    style={{ width:'100%', padding:'10px 14px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#fff', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box' }}
                    placeholder="Enter meeting password"/>
                </div>
              )}

              {error && (
                <div style={{ background:'rgba(220,38,38,.1)', border:'1px solid rgba(220,38,38,.3)', borderRadius:8, padding:'8px 12px', color:'#f87171', fontSize:12, marginBottom:14 }}>
                  {error}
                </div>
              )}

              {/* Join button */}
              <button onClick={handleJoin} disabled={joining || (!canJoin && diff > 0)}
                style={{ width:'100%', padding:'12px', background: (!canJoin&&diff>0)?'#1A3A6B':'#2D6FFF', border:'none', color: (!canJoin&&diff>0)?'#94B4F0':'#fff', borderRadius:12, cursor: (joining||(!canJoin&&diff>0))?'not-allowed':'pointer', fontSize:14, fontWeight:700, marginBottom:10, opacity: joining?0.7:1 }}>
                {joining ? 'Joining...' : !user ? 'Sign in to Join' : !canJoin&&diff>0 ? `Opens in ${minsAway} min` : 'Join Meeting'}
              </button>

              {!user && (
                <p style={{ textAlign:'center', color:'#94B4F0', fontSize:12, margin:0 }}>
                  Don't have an account? <Link to="/register" style={{ color:'#1A56DB' }}>Sign up free</Link>
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
