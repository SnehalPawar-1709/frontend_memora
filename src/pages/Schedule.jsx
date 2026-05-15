import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, Trash2, Copy, Check, ChevronLeft, ChevronRight, Link2, Video, Lock, X, Play, Users, Bell } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';

const fmt2 = n => String(n).padStart(2,'0');

function getCountdown(scheduledAt) {
  const diff = new Date(scheduledAt) - new Date();
  if (diff <= 0) return null;
  const days  = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins  = Math.floor((diff % 3600000)  / 60000);
  const secs  = Math.floor((diff % 60000)    / 1000);
  return { days, hours, mins, secs, total: diff };
}

function formatScheduled(dt) {
  return new Date(dt).toLocaleString('en-IN', { weekday:'short', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', hour12:true });
}

// ── Countdown ─────────────────────────────────────────────────
function Countdown({ scheduledAt, onStart }) {
  const [cd, setCd] = useState(getCountdown(scheduledAt));
  useEffect(() => {
    const t = setInterval(() => { const n = getCountdown(scheduledAt); setCd(n); if(!n) onStart(); }, 1000);
    return () => clearInterval(t);
  }, [scheduledAt]);

  if (!cd) return <span style={{ color:'#34d399', fontSize:12, fontWeight:600 }}>● Starting now!</span>;

  const units = cd.days > 0
    ? [['d',cd.days],['h',cd.hours],['m',cd.mins],['s',cd.secs]]
    : [['h',cd.hours],['m',cd.mins],['s',cd.secs]];

  return (
    <div style={{ display:'flex', gap:5, alignItems:'center' }}>
      {units.map(([l,v]) => (
        <div key={l} style={{ textAlign:'center' }}>
          <div style={{ background:'rgba(45,111,255,.15)', borderRadius:6, padding:'3px 7px' }}>
            <span style={{ color:'#1A56DB', fontSize:13, fontWeight:700, fontFamily:'monospace' }}>{fmt2(v)}</span>
          </div>
          <span style={{ color:'#3A5A9A', fontSize:8, display:'block' }}>{l}</span>
        </div>
      ))}
      <span style={{ color:'#94B4F0', fontSize:11, marginLeft:4 }}>until start</span>
    </div>
  );
}

// ── Calendar ──────────────────────────────────────────────────
function MiniCalendar({ selected, onSelect, meetingDates = [] }) {
  const selDate = selected ? new Date(selected) : new Date();
  const [view, setView] = useState(new Date(selDate.getFullYear(), selDate.getMonth(), 1));
  const year = view.getFullYear(), month = view.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const isSel  = d => { if(!d||!selected) return false; const s=new Date(selected); return s.getDate()===d&&s.getMonth()===month&&s.getFullYear()===year; };
  const isToday= d => d&&today.getDate()===d&&today.getMonth()===month&&today.getFullYear()===year;
  const isPast = d => d && new Date(year,month,d) < new Date(today.getFullYear(),today.getMonth(),today.getDate());
  const hasMtg = d => { if(!d) return false; return meetingDates.some(m=>{ const md=new Date(m); return md.getDate()===d&&md.getMonth()===month&&md.getFullYear()===year; }); };

  const pick = d => {
    if(!d || isPast(d)) return;
    const base = selected ? new Date(selected) : new Date();
    const next = new Date(year, month, d, base.getHours(), base.getMinutes());
    onSelect(next.toISOString().slice(0,16));
  };

  return (
    <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:14, padding:18 }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
        <button onClick={()=>setView(new Date(year,month-1,1))} style={{ background:'#1A3A6B', border:'none', color:'#4D7AC7', borderRadius:7, width:26, height:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronLeft size={12}/></button>
        <span style={{ color:'#fff', fontSize:12, fontWeight:600 }}>{MONTHS[month]} {year}</span>
        <button onClick={()=>setView(new Date(year,month+1,1))} style={{ background:'#1A3A6B', border:'none', color:'#4D7AC7', borderRadius:7, width:26, height:26, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronRight size={12}/></button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1, marginBottom:3 }}>
        {DAYS.map(d=><div key={d} style={{ textAlign:'center', color:'#3A5A9A', fontSize:9, fontWeight:600, padding:'2px 0' }}>{d}</div>)}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:1 }}>
        {cells.map((d,i)=>(
          <div key={i} onClick={()=>pick(d)}
            style={{ textAlign:'center', padding:'5px 1px', borderRadius:6, fontSize:11, fontWeight:500, cursor:d&&!isPast(d)?'pointer':'default', position:'relative',
              background: isSel(d)?'#2D6FFF':'transparent',
              color: isSel(d)?'#fff': isToday(d)?'#1A56DB': isPast(d)?'#1A3A6B': d?'#E8F0FF':'transparent',
              border: isToday(d)&&!isSel(d)?'1px solid rgba(79,70,229,.5)':'1px solid transparent' }}
            onMouseOver={e=>{ if(d&&!isSel(d)&&!isPast(d)) e.currentTarget.style.background='#1A3A6B'; }}
            onMouseOut={e=>{ if(d&&!isSel(d)) e.currentTarget.style.background='transparent'; }}>
            {d||''}
            {hasMtg(d)&&!isSel(d)&&<span style={{ position:'absolute', bottom:1, left:'50%', transform:'translateX(-50%)', width:3, height:3, background:'#1A56DB', borderRadius:'50%', display:'block' }}/>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Time Picker ───────────────────────────────────────────────
function TimePicker({ value, onChange }) {
  const dt = value ? new Date(value) : (() => { const d=new Date(); d.setHours(d.getHours()+1,0,0,0); return d; })();
  const h = dt.getHours(), m = dt.getMinutes(), isPM = h>=12, h12 = h%12||12;
  const set = (nh,nm) => { const b=value?new Date(value):new Date(); b.setHours(nh,nm,0,0); onChange(b.toISOString().slice(0,16)); };
  const Spin = ({label,val,onUp,onDown}) => (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
      <button onClick={onUp}   style={{ background:'#1A3A6B', border:'none', color:'#4D7AC7', borderRadius:6, width:26, height:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronLeft size={10} style={{ transform:'rotate(90deg)' }}/></button>
      <div style={{ background:'#1A3A6B', borderRadius:8, padding:'6px 10px', color:'#fff', fontSize:17, fontWeight:700, fontFamily:'monospace', minWidth:42, textAlign:'center' }}>{fmt2(val)}</div>
      <button onClick={onDown} style={{ background:'#1A3A6B', border:'none', color:'#4D7AC7', borderRadius:6, width:26, height:20, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><ChevronLeft size={10} style={{ transform:'rotate(-90deg)' }}/></button>
      <span style={{ color:'#94B4F0', fontSize:9, fontWeight:600, textTransform:'uppercase' }}>{label}</span>
    </div>
  );
  return (
    <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:14, padding:18 }}>
      <p style={{ color:'#94B4F0', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 14px' }}>Select Time</p>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
        <Spin label="Hour" val={h12}  onUp={()=>set((h+1)%24,m)}    onDown={()=>set((h-1+24)%24,m)}/>
        <span style={{ color:'#2D6FFF', fontSize:20, fontWeight:700, paddingBottom:14 }}>:</span>
        <Spin label="Min"  val={m}    onUp={()=>set(h,(m+15)%60)}   onDown={()=>set(h,(m-15+60)%60)}/>
        <div style={{ display:'flex', flexDirection:'column', gap:4, paddingBottom:14 }}>
          <button onClick={()=>{ if(isPM) set(h-12,m); }} style={{ padding:'4px 9px', background:!isPM?'#2D6FFF':'#1A3A6B', border:'none', color:'#fff', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:600 }}>AM</button>
          <button onClick={()=>{ if(!isPM) set(h+12,m); }} style={{ padding:'4px 9px', background:isPM?'#2D6FFF':'#1A3A6B', border:'none', color:'#fff', borderRadius:6, cursor:'pointer', fontSize:11, fontWeight:600 }}>PM</button>
        </div>
      </div>
      <div style={{ marginTop:10, textAlign:'center', background:'rgba(45,111,255,.08)', borderRadius:8, padding:'6px 0' }}>
        <span style={{ color:'#1A56DB', fontSize:12, fontWeight:600 }}>{dt.toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>
        {value&&<span style={{ color:'#94B4F0', fontSize:11, marginLeft:8 }}>{new Date(value).toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'})}</span>}
      </div>
    </div>
  );
}

// ── Share Modal ───────────────────────────────────────────────
function ShareModal({ meeting, onClose }) {
  const [copied, setCopied] = useState('');
  const BASE = `${window.location.origin}/join/${meeting.meetingId}`;
  const copy = (text, key) => { navigator.clipboard?.writeText(text); setCopied(key); setTimeout(()=>setCopied(''),2500); };
  const invite = [`You're invited to a Memora meeting!`, ``, `📌 Topic: ${meeting.topic}`, `📅 When:  ${formatScheduled(meeting.scheduledAt)}`, `🔗 Join:  ${BASE}`, `🆔 ID:    ${meeting.meetingId}`, meeting.password?`🔒 Pass:  ${meeting.password}`:null].filter(l=>l!==null).join('\n');

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(45,111,255,.15)', backdropFilter:'blur(4px)', zIndex:60, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:20, width:'100%', maxWidth:480, padding:28 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <h2 style={{ color:'#fff', fontSize:16, fontWeight:700, margin:0 }}>Share Meeting Invite</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#4D7AC7', cursor:'pointer' }}><X size={18}/></button>
        </div>
        <div style={{ background:'rgba(45,111,255,.08)', border:'1px solid rgba(45,111,255,.18)', borderRadius:12, padding:14, marginBottom:16 }}>
          <p style={{ color:'#fff', fontWeight:600, fontSize:14, margin:'0 0 4px' }}>{meeting.topic}</p>
          <p style={{ color:'#1A56DB', fontSize:12, margin:0, display:'flex', alignItems:'center', gap:5 }}><Calendar size={11}/>{formatScheduled(meeting.scheduledAt)}</p>
          {meeting.password&&<p style={{ color:'#f59e0b', fontSize:11, margin:'4px 0 0', display:'flex', alignItems:'center', gap:4 }}><Lock size={9}/>Password: <strong>{meeting.password}</strong></p>}
        </div>

        {[['Join Link', BASE,'link'],['Meeting ID', meeting.meetingId,'id']].map(([label,val,key])=>(
          <div key={key} style={{ marginBottom:12 }}>
            <p style={{ color:'#4D7AC7', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 5px' }}>{label}</p>
            <div style={{ display:'flex', gap:8 }}>
              <div style={{ flex:1, background:'#1A3A6B', borderRadius:10, padding:'9px 12px', color: key==='id'?'#fff':'#1A56DB', fontSize:12, fontFamily:'monospace', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{val}</div>
              <button onClick={()=>copy(val,key)} style={{ display:'flex', alignItems:'center', gap:5, padding:'9px 14px', background: key==='link'?'#2D6FFF':'#1A3A6B', border: key==='link'?'none':'1px solid #1A2E55', color:'#fff', borderRadius:10, cursor:'pointer', fontSize:12, fontWeight:600, flexShrink:0 }}>
                {copied===key?<><Check size={12}/>Copied</>:<><Copy size={12}/>Copy</>}
              </button>
            </div>
          </div>
        ))}

        <div style={{ marginBottom:16 }}>
          <p style={{ color:'#4D7AC7', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.06em', margin:'0 0 5px' }}>Full Invite Text</p>
          <textarea readOnly value={invite} style={{ width:'100%', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#7BA8F5', borderRadius:10, padding:12, fontSize:11, fontFamily:'monospace', lineHeight:1.7, resize:'none', outline:'none', boxSizing:'border-box', height:120 }}/>
          <button onClick={()=>copy(invite,'msg')} style={{ marginTop:6, display:'flex', alignItems:'center', gap:6, padding:'7px 14px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#E8F0FF', borderRadius:9, cursor:'pointer', fontSize:12 }}>
            {copied==='msg'?<><Check size={12} color="#34d399"/>Copied!</>:<><Copy size={12}/>Copy Full Invite</>}
          </button>
        </div>

        <button onClick={onClose} style={{ width:'100%', padding:'10px', background:'#2D6FFF', border:'none', color:'#fff', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600 }}>Done</button>
      </div>
    </div>
  );
}

// ── Meeting Card ──────────────────────────────────────────────
function MeetingCard({ meeting, userId, onShare, onCancel, onJoin }) {
  const [cd, setCd] = useState(getCountdown(meeting.scheduledAt));
  const isHost  = String(meeting.hostId) === String(userId);
  const canJoin = !cd || cd.total < 5*60*1000; // joinable 5min before
  const isNow   = !cd;
  useEffect(() => { const t=setInterval(()=>setCd(getCountdown(meeting.scheduledAt)),1000); return ()=>clearInterval(t); }, [meeting.scheduledAt]);

  return (
    <div style={{ background:'#111C35', border:`1px solid ${isNow?'#2D6FFF':canJoin?'rgba(45,111,255,.2)':'#1A3A6B'}`, borderRadius:16, padding:20, transition:'border-color .5s' }}>
      <div style={{ display:'flex', gap:14 }}>
        {/* Date badge */}
        <div style={{ background:isNow?'rgba(45,111,255,.18)':'rgba(79,70,229,.07)', borderRadius:12, padding:'10px 12px', textAlign:'center', flexShrink:0, minWidth:52, alignSelf:'flex-start' }}>
          <p style={{ color:'#1A56DB', fontSize:20, fontWeight:700, margin:0, lineHeight:1 }}>{new Date(meeting.scheduledAt).getDate()}</p>
          <p style={{ color:'#94B4F0', fontSize:9, margin:'3px 0 0', fontWeight:600, textTransform:'uppercase' }}>{new Date(meeting.scheduledAt).toLocaleString('en',{month:'short'})}</p>
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color:'#fff', fontWeight:600, fontSize:15, margin:'0 0 6px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{meeting.topic}</p>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, flexWrap:'wrap' }}>
            <span style={{ color:'#4D7AC7', fontSize:11, display:'flex', alignItems:'center', gap:4 }}><Clock size={10}/>{new Date(meeting.scheduledAt).toLocaleTimeString('en-IN',{hour:'2-digit',minute:'2-digit',hour12:true})}</span>
            <span style={{ color:'#4D7AC7', fontSize:11, display:'flex', alignItems:'center', gap:4 }}><Users size={10}/>{meeting.participants?.length||1} invited</span>
            {isHost&&<span style={{ color:'#1A56DB', fontSize:10, background:'rgba(45,111,255,.15)', padding:'1px 7px', borderRadius:9999 }}>Host</span>}
            {meeting.password&&<span style={{ color:'#f59e0b', fontSize:10, display:'flex', alignItems:'center', gap:3 }}><Lock size={9}/>Protected</span>}
          </div>
          {isNow
            ? <span style={{ color:'#34d399', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}><span style={{ width:6, height:6, background:'#34d399', borderRadius:'50%', animation:'pulse 1s ease infinite' }}/>Happening now — Join!</span>
            : <Countdown scheduledAt={meeting.scheduledAt} onStart={()=>setCd(null)}/>
          }
          <p style={{ color:'#1A2E55', fontSize:10, fontFamily:'monospace', margin:'8px 0 0' }}>{meeting.meetingId}</p>
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginTop:16, flexWrap:'wrap' }}>
        {canJoin&&(
          <button onClick={()=>onJoin(meeting.meetingId)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', background:isNow?'#2D6FFF':'rgba(45,111,255,.15)', border:isNow?'none':'1px solid rgba(45,111,255,.25)', color:isNow?'#fff':'#1A56DB', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600 }}>
            <Play size={13}/>{isNow?'Join Now':'Join Early'}
          </button>
        )}
        <button onClick={()=>onShare(meeting)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#E8F0FF', borderRadius:10, cursor:'pointer', fontSize:12 }}>
          <Link2 size={13}/>Share Invite
        </button>
        {isHost&&(
          <button onClick={()=>onCancel(meeting.meetingId)} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#4D7AC7', borderRadius:10, cursor:'pointer', fontSize:12, marginLeft:'auto' }}>
            <Trash2 size={13}/>Cancel
          </button>
        )}
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────
export default function Schedule() {
  const { user }   = useAuth();
  const navigate   = useNavigate();
  const [meetings,    setMeetings]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [shareTarget, setShareTarget] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const defDt = () => { const d=new Date(); d.setHours(d.getHours()+1,0,0,0); return d.toISOString().slice(0,16); };
  const [topic,       setTopic]       = useState('');
  const [scheduledAt, setScheduledAt] = useState(defDt());
  const [usePassword, setUsePassword] = useState(false);
  const [password,    setPassword]    = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api.get('/meetings/scheduled').then(r=>setMeetings(r.data.meetings||[])).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  useEffect(()=>{ load(); }, [load]);

  const handleSchedule = async () => {
    if (!topic.trim())  { setError('Meeting topic is required'); return; }
    if (!scheduledAt)   { setError('Please pick a date and time'); return; }
    if (new Date(scheduledAt) <= new Date()) { setError('Please pick a future date and time'); return; }
    setSaving(true); setError('');
    try {
      const { data } = await api.post('/meetings/create', { topic: topic.trim(), scheduledAt: new Date(scheduledAt).toISOString(), password: usePassword&&password.trim()?password.trim():null });
      setShowForm(false); setTopic(''); setPassword(''); setUsePassword(false); setScheduledAt(defDt());
      load();
      // Auto-open share modal for newly created meeting
      setTimeout(() => setShareTarget({ ...data, scheduledAt, password: usePassword?password:null }), 300);
    } catch(e) { setError(e.response?.data?.message||'Failed to schedule meeting'); }
    finally { setSaving(false); }
  };

  const handleCancel = async (meetingId) => {
    if (!window.confirm('Cancel this meeting?')) return;
    try { await api.delete(`/meetings/${meetingId}`); load(); } catch(_) { load(); }
  };

  const handleJoin = async (meetingId) => {
    try {
      const { data } = await api.post('/meetings/join', { meetingId });
      if (data.status === 'scheduled' && data.scheduledAt && new Date(data.scheduledAt) > new Date()) {
        alert(`This meeting hasn't started yet.\nScheduled for: ${formatScheduled(data.scheduledAt)}`);
        return;
      }
      navigate(`/meeting/${meetingId}`);
    } catch(e) { alert(e.response?.data?.message||'Failed to join'); }
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#0B1120', fontFamily:'Inter,system-ui,sans-serif' }}>
      <Sidebar/>
      <main style={{ flex:1, overflowY:'auto' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'32px 24px' }}>
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:28, flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 style={{ color:'#fff', fontSize:22, fontWeight:700, margin:'0 0 4px' }}>Scheduled Meetings</h1>
              <p style={{ color:'#94B4F0', fontSize:13, margin:0 }}>Create meetings with shareable invite links · Auto-start at scheduled time</p>
            </div>
            <button onClick={()=>{ setShowForm(true); setError(''); }}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 18px', background:'#2D6FFF', border:'none', color:'#fff', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600 }}>
              <Plus size={16}/>Schedule Meeting
            </button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 310px', gap:20, alignItems:'start' }}>
            {/* Left */}
            <div>
              {loading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:60 }}><div style={{ width:26, height:26, border:'2px solid #2D6FFF', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }}/></div>
              ) : meetings.length===0 ? (
                <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:16, padding:56, textAlign:'center' }}>
                  <Calendar size={36} style={{ color:'#1A3A6B', margin:'0 auto 14px', display:'block' }}/>
                  <p style={{ color:'#94B4F0', fontSize:14, fontWeight:500, margin:'0 0 6px' }}>No upcoming meetings</p>
                  <p style={{ color:'#3A5A9A', fontSize:12, margin:'0 0 20px' }}>Schedule a meeting and share the invite link with participants</p>
                  <button onClick={()=>setShowForm(true)} style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'9px 20px', background:'rgba(45,111,255,.15)', border:'1px solid rgba(45,111,255,.25)', color:'#1A56DB', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:500 }}>
                    <Plus size={14}/>Create your first meeting
                  </button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  {meetings.map(m=>(
                    <MeetingCard key={m._id} meeting={m} userId={user?.id} onShare={setShareTarget} onCancel={handleCancel} onJoin={handleJoin}/>
                  ))}
                </div>
              )}
            </div>

            {/* Right — calendar + clock */}
            <div style={{ display:'flex', flexDirection:'column', gap:12, position:'sticky', top:24 }}>
              <MiniCalendar selected={scheduledAt} onSelect={setScheduledAt} meetingDates={meetings.map(m=>m.scheduledAt).filter(Boolean)}/>
              <TimePicker value={scheduledAt} onChange={setScheduledAt}/>
              <button onClick={()=>{ setShowForm(true); setError(''); }}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'10px', background:'rgba(45,111,255,.12)', border:'1px solid rgba(45,111,255,.2)', color:'#1A56DB', borderRadius:12, cursor:'pointer', fontSize:13, fontWeight:600 }}>
                <Plus size={14}/>Schedule at This Time
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Form Modal */}
      {showForm&&(
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.75)', backdropFilter:'blur(4px)', zIndex:50, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:20, width:'100%', maxWidth:460, padding:28 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22 }}>
              <div>
                <h2 style={{ color:'#fff', fontWeight:700, fontSize:16, margin:'0 0 2px' }}>Schedule a Meeting</h2>
                <p style={{ color:'#94B4F0', fontSize:12, margin:0 }}>A shareable invite link will be generated</p>
              </div>
              <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', color:'#4D7AC7', cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              <div>
                <label style={{ display:'block', color:'#7BA8F5', fontSize:12, fontWeight:500, marginBottom:6 }}>Meeting Topic *</label>
                <input autoFocus value={topic} onChange={e=>setTopic(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSchedule()}
                  style={{ width:'100%', padding:'10px 14px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#fff', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box' }} placeholder="e.g. Weekly Team Standup"/>
              </div>
              <div>
                <label style={{ display:'block', color:'#7BA8F5', fontSize:12, fontWeight:500, marginBottom:6 }}>Date & Time *</label>
                <input type="datetime-local" value={scheduledAt} onChange={e=>setScheduledAt(e.target.value)} min={new Date().toISOString().slice(0,16)}
                  style={{ width:'100%', padding:'10px 14px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#fff', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box', colorScheme:'dark' }}/>
                {scheduledAt&&new Date(scheduledAt)>new Date()&&(
                  <p style={{ color:'#1A56DB', fontSize:11, margin:'5px 0 0', display:'flex', alignItems:'center', gap:4 }}>
                    <Bell size={10}/>{new Date(scheduledAt).toLocaleString('en-IN',{weekday:'long',month:'long',day:'numeric',year:'numeric',hour:'2-digit',minute:'2-digit',hour12:true})}
                  </p>
                )}
              </div>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }} onClick={()=>setUsePassword(v=>!v)}>
                  <div style={{ width:36, height:20, borderRadius:10, background:usePassword?'#2D6FFF':'#1A3A6B', border:`1px solid ${usePassword?'#2D6FFF':'#1A2E55'}`, position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <div style={{ width:16, height:16, borderRadius:'50%', background:'#111C35', position:'absolute', top:1, left:usePassword?18:2, transition:'left .2s' }}/>
                  </div>
                  <span style={{ color:'#7BA8F5', fontSize:12, display:'flex', alignItems:'center', gap:4 }}><Lock size={11}/>Require password</span>
                </div>
                {usePassword&&<input value={password} onChange={e=>setPassword(e.target.value)} type="text"
                  style={{ width:'100%', padding:'10px 14px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#fff', borderRadius:10, fontSize:13, outline:'none', boxSizing:'border-box', marginTop:8 }} placeholder="Set a join password"/>}
              </div>
              {error&&<div style={{ background:'rgba(220,38,38,.1)', border:'1px solid rgba(220,38,38,.3)', borderRadius:8, padding:'8px 12px', color:'#f87171', fontSize:12 }}>{error}</div>}
              <div style={{ display:'flex', gap:10, marginTop:4 }}>
                <button onClick={()=>setShowForm(false)} style={{ flex:1, padding:'10px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#E8F0FF', borderRadius:10, cursor:'pointer', fontSize:13 }}>Cancel</button>
                <button onClick={handleSchedule} disabled={saving} style={{ flex:1, padding:'10px', background:saving?'#1E3A8A':'#2D6FFF', border:'none', color:'#fff', borderRadius:10, cursor:saving?'not-allowed':'pointer', fontSize:13, fontWeight:600, opacity:saving?0.7:1 }}>
                  {saving?'Scheduling...':'Schedule & Get Link'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {shareTarget&&<ShareModal meeting={shareTarget} onClose={()=>setShareTarget(null)}/>}
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
    </div>
  );
}
