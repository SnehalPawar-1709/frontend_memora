import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MeetingProvider, useMeeting, useTranscription, Constants,
} from '@videosdk.live/react-sdk';
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, ScreenShareOff,
  MessageSquare, Users, Subtitles, MoreVertical, Phone,
  Copy, Check, Download, Smile, Send, X, Radio, StopCircle,
  Globe,
} from 'lucide-react';
import ParticipantTile from '../components/meeting/ParticipantTile';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { io } from 'socket.io-client';

const TOKEN      = import.meta.env.VITE_VIDEOSDK_TOKEN || '';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL     || 'http://localhost:5000';
const REACTIONS  = ['👍','🎉','❤️','😂','👏','🔥','🤔','😮'];
// CAPTION LANGUAGE — what language you want captions shown in
// VideoSDK transcribes speech → text, then we translate to this target language
const LANGUAGES = [
  { code:'en', label:'English',  bcp:'en-US', myMemory:'en-US' },
  { code:'hi', label:'हिंदी',   bcp:'hi-IN', myMemory:'hi-IN' },
  { code:'mr', label:'मराठी',  bcp:'mr-IN', myMemory:'mr-IN' },
];

// Free translation using MyMemory API (no API key, 5000 words/day free)
const translateText = async (text, targetLang) => {
  if (!text || !text.trim()) return text;
  const langMap = { en:'en-US', hi:'hi-IN', mr:'mr-IN' };
  const target  = langMap[targetLang] || 'en-US';
  try {
    const url  = 'https://api.mymemory.translated.net/get?q=' + encodeURIComponent(text) + '&langpair=autodetect|' + target;
    const res  = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data && data.responseStatus === 200 && data.responseData && data.responseData.translatedText) {
      const translated = data.responseData.translatedText;
      // MyMemory sometimes returns QUERY LIMIT error as text
      if (translated.includes('QUERY LIMIT') || translated.includes('MYMEMORY')) return text;
      return translated;
    }
  } catch(e) {
    console.warn('Translation failed:', e.message);
  }
  return text;
};

// ── Toast ─────────────────────────────────────────────────────
function Toast({ messages }) {
  return (
    <div style={{ position:'fixed', top:16, right:16, zIndex:9999, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
      {messages.map(m => (
        <div key={m.id} style={{
          padding:'10px 16px', borderRadius:12, fontSize:13, fontWeight:500, boxShadow:'0 8px 24px rgba(30,58,138,.1)',
          background: m.type==='error'?'#450a0a': m.type==='success'?'#052e16':'#1A3A6B',
          color:      m.type==='error'?'#fca5a5': m.type==='success'?'#6ee7b7':'#e2e8f0',
          border:     `1px solid ${m.type==='error'?'#7f1d1d': m.type==='success'?'#14532d':'#1A2E55'}`,
          animation:  'fadeIn .2s ease',
        }}>
          {m.text}
        </div>
      ))}
    </div>
  );
}

// ── Chat Panel ────────────────────────────────────────────────
function ChatPanel({ messages, onSend, onClose }) {
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages]);
  const send = () => { if (!text.trim()) return; onSend(text.trim()); setText(''); };
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #1A3A6B' }}>
        <span style={{ color:'#fff', fontWeight:600, fontSize:14 }}>Chat</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#4D7AC7', cursor:'pointer' }}><X size={16}/></button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:10 }}>
        {messages.length===0 && <p style={{ color:'#94B4F0', fontSize:12, textAlign:'center', marginTop:24 }}>No messages yet</p>}
        {messages.map((m,i) => (
          <div key={i}>
            <p style={{ color:'#1A56DB', fontSize:11, marginBottom:3 }}>{m.senderName}</p>
            <div style={{ background:'#1A3A6B', borderRadius:10, padding:'8px 12px' }}>
              <p style={{ color:'#E8F0FF', fontSize:13, margin:0 }}>{m.message}</p>
            </div>
            <p style={{ color:'#3A5A9A', fontSize:10, marginTop:2 }}>{new Date(m.timestamp).toLocaleTimeString()}</p>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div style={{ padding:'8px 12px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, background:'#1A3A6B', borderRadius:12, padding:'8px 12px' }}>
          <input value={text} onChange={e=>setText(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(); }}}
            style={{ flex:1, background:'transparent', border:'none', color:'#fff', fontSize:13, outline:'none' }}
            placeholder="Type a message..." />
          <button onClick={send} disabled={!text.trim()} style={{ background:'none', border:'none', color:text.trim()?'#1A56DB':'#3A5A9A', cursor:text.trim()?'pointer':'default' }}>
            <Send size={16}/>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Transcript Panel ──────────────────────────────────────────
function TranscriptPanel({ lines, lang, setLang, ccOn, onToggleCC, onClose, onDownload }) {
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [lines]);
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #1A3A6B' }}>
        <span style={{ color:'#fff', fontWeight:600, fontSize:14 }}>Live Transcript</span>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <select value={lang} onChange={e=>setLang(e.target.value)}
            style={{ background:'#1A3A6B', border:'1px solid #1A2E55', color:'#E8F0FF', borderRadius:8, padding:'3px 8px', fontSize:11, cursor:'pointer' }}>
            {LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.label}</option>)}
          </select>
          {lines.length>0 && <button onClick={onDownload} style={{ background:'none', border:'none', color:'#4D7AC7', cursor:'pointer' }}><Download size={14}/></button>}
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#4D7AC7', cursor:'pointer' }}><X size={16}/></button>
        </div>
      </div>

      {/* CC Toggle inside panel */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid #1A3A6B', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <span style={{ color:'#7BA8F5', fontSize:12 }}>{ccOn ? '● Live captions ON' : 'Captions OFF'}</span>
        <button onClick={onToggleCC} style={{ padding:'4px 12px', background: ccOn?'rgba(45,111,255,.15)':'#1A3A6B', border:`1px solid ${ccOn?'#2D6FFF':'#1A2E55'}`, color: ccOn?'#1A56DB':'#4D7AC7', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:500 }}>
          {ccOn ? 'Disable' : 'Enable'}
        </button>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:10 }}>
        {lines.length===0 && (
          <div style={{ textAlign:'center', marginTop:32 }}>
            <Subtitles size={28} style={{ color:'#1A2E55', marginBottom:8 }}/>
            <p style={{ color:'#94B4F0', fontSize:13, margin:'0 0 4px' }}>No transcript yet</p>
            <p style={{ color:'#3A5A9A', fontSize:11, margin:0 }}>{ccOn ? 'Start speaking to see captions' : 'Enable captions above to start'}</p>
          </div>
        )}
        {lines.map((l,i) => (
          <div key={i} style={{ animation:'fadeIn .2s ease', borderBottom:'1px solid #0D1626', paddingBottom:8 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
              <p style={{ color:'#1A56DB', fontSize:11, fontWeight:600, margin:0 }}>{l.speaker}</p>
              <p style={{ color:'#3A5A9A', fontSize:10, margin:0 }}>{l.time}</p>
            </div>
            {/* Translated text (primary) */}
            <p style={{ color:'#E8F0FF', fontSize:13, lineHeight:1.5, margin:0, fontWeight:500 }}>{l.text}</p>
            {/* Original text (secondary) — only show if different from translated */}
            {l.original && l.original !== l.text && (
              <p style={{ color:'#3A5A9A', fontSize:11, lineHeight:1.4, margin:'3px 0 0', fontStyle:'italic' }}>
                Original: {l.original}
              </p>
            )}
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
    </div>
  );
}

// ── Participants Panel ────────────────────────────────────────
function ParticipantsPanel({ participants, onClose }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid #1A3A6B' }}>
        <span style={{ color:'#fff', fontWeight:600, fontSize:14 }}>Participants ({participants.size})</span>
        <button onClick={onClose} style={{ background:'none', border:'none', color:'#4D7AC7', cursor:'pointer' }}><X size={16}/></button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:4 }}>
        {[...participants.keys()].map(id => {
          const p = participants.get(id);
          return (
            <div key={id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 12px', borderRadius:10, background:'#1A3A6B' }}>
              <div style={{ width:32, height:32, borderRadius:'50%', background:'#2D6FFF', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight:700, fontSize:14, flexShrink:0 }}>
                {(p.displayName||'?')[0].toUpperCase()}
              </div>
              <span style={{ color:'#E8F0FF', fontSize:13 }}>{p.displayName||'Unknown'}{p.isLocal?' (You)':''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Ended Screen ──────────────────────────────────────────────
function EndedScreen({ data, onHome }) {
  const download = () => {
    const text = `MEMORA MEETING SUMMARY\n\nTopic: ${data.topic||''}\nDuration: ${data.duration||0} min\n\nOVERVIEW:\n${data.overview||''}\n\nSUMMARY:\n${data.summary||''}\n\nKEY POINTS:\n${(data.keyPoints||[]).map(k=>`• ${k}`).join('\n')}\n\nDECISIONS:\n${(data.decisions||[]).map(d=>`• ${d}`).join('\n')}\n\nACTION ITEMS:\n${(data.actionItems||[]).map(a=>`• ${a}`).join('\n')}`;
    const blob = new Blob([text],{type:'text/plain'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='meeting-summary.txt'; a.click();
  };
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0B1120 0%,#1A3A6B 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Inter,system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:640 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ width:52, height:52, background:'rgba(16,185,129,.1)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <Check size={26} color="#34d399"/>
          </div>
          <h2 style={{ color:'#fff', fontSize:22, fontWeight:700, margin:'0 0 6px' }}>Meeting Ended</h2>
          <p style={{ color:'#94B4F0', fontSize:13, margin:0 }}>Duration: {data.duration||0} min · Summary emailed to all participants</p>
        </div>

        {data.overview && (
          <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:14, padding:20, marginBottom:12 }}>
            <p style={{ color:'#1A56DB', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 8px' }}>Overview</p>
            <p style={{ color:'#E8F0FF', fontSize:13, lineHeight:1.7, margin:0 }}>{data.overview}</p>
          </div>
        )}
        {data.keyPoints?.length>0 && (
          <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:14, padding:20, marginBottom:12 }}>
            <p style={{ color:'#1A56DB', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 8px' }}>Key Points</p>
            <ul style={{ margin:0, paddingLeft:18 }}>{data.keyPoints.map((k,i)=><li key={i} style={{ color:'#E8F0FF', fontSize:13, marginBottom:5 }}>{k}</li>)}</ul>
          </div>
        )}
        {data.decisions?.length>0 && (
          <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:14, padding:20, marginBottom:12 }}>
            <p style={{ color:'#10b981', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 8px' }}>✓ Decisions</p>
            <ul style={{ margin:0, paddingLeft:18 }}>{data.decisions.map((d,i)=><li key={i} style={{ color:'#E8F0FF', fontSize:13, marginBottom:5 }}>{d}</li>)}</ul>
          </div>
        )}
        {data.actionItems?.length>0 && (
          <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:14, padding:20, marginBottom:16 }}>
            <p style={{ color:'#f59e0b', fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', margin:'0 0 8px' }}>⚡ Action Items</p>
            <ul style={{ margin:0, paddingLeft:18 }}>{data.actionItems.map((a,i)=><li key={i} style={{ color:'#E8F0FF', fontSize:13, marginBottom:5 }}>{a}</li>)}</ul>
          </div>
        )}
        <div style={{ display:'flex', gap:12 }}>
          {(data.summary||data.overview) && (
            <button onClick={download} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 20px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#E8F0FF', borderRadius:12, fontSize:13, fontWeight:500, cursor:'pointer' }}>
              <Download size={15}/>Download Summary
            </button>
          )}
          <button onClick={onHome} style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:'10px 20px', background:'#2D6FFF', border:'none', color:'#fff', borderRadius:12, fontSize:13, fontWeight:500, cursor:'pointer' }}>
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Control button ────────────────────────────────────────────
function CtrlBtn({ icon, label, onClick, active, badge=0 }) {
  return (
    <button onClick={onClick} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, background:'none', border:'none', cursor:'pointer', padding:'4px 6px', position:'relative' }}>
      <div style={{ width:44, height:44, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background: active?'#2D6FFF':'#1A3A6B', color:'#fff', transition:'all .15s', flexShrink:0 }}>
        {icon}
      </div>
      <span style={{ color:'#94B4F0', fontSize:10 }}>{label}</span>
      {badge>0 && (
        <div style={{ position:'absolute', top:2, right:2, minWidth:16, height:16, background:'#dc2626', borderRadius:9999, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontSize:9, fontWeight:700, padding:'0 3px' }}>
          {badge>9?'9+':badge}
        </div>
      )}
    </button>
  );
}

// ── Inner Meeting ─────────────────────────────────────────────
function MeetingInner({ meetingId, topic, onEnded }) {
  const { user }                           = useAuth();
  const [micOn,        setMicOn]           = useState(true);
  const [camOn,        setCamOn]           = useState(true);
  const [lang,         setLang]            = useState('en');
  const [panel,        setPanel]           = useState('');
  const [messages,     setMessages]        = useState([]);
  const [transcript,   setTranscript]      = useState([]);
  const [ccText,       setCcText]          = useState('');
  const [reactions,    setReactions]       = useState([]);
  const [recording,    setRecording]       = useState(false);
  const [recUploading, setRecUploading]    = useState(false);
  const [copied,       setCopied]          = useState(false);
  const [ending,       setEnding]          = useState(false);
  const [timer,        setTimer]           = useState(0);
  const [showMore,     setShowMore]        = useState(false);
  const [toasts,       setToasts]          = useState([]);

  const mrRef      = useRef(null);
  const chunksRef  = useRef([]);
  const socketRef  = useRef(null);
  const timerRef   = useRef(null);
  const ccTimerRef = useRef(null);
  const langRef    = useRef('en'); // BUG FIX: use ref so closure always gets latest lang

  const toast = useCallback((text, type='info', dur=3500) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, text, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), dur);
  }, []);

  // BUG FIX: keep langRef in sync so onTranscriptionText always uses current language
  useEffect(() => { langRef.current = lang; }, [lang]);

  // ── VideoSDK useMeeting ───────────────────────────────────────
  const {
    join, leave, end,
    toggleMic, toggleWebcam,
    enableScreenShare, disableScreenShare,
    participants, presenterId,
    transcriptionState,           // ← critical: get from useMeeting
  } = useMeeting({
    onMeetingJoined: () => {
      timerRef.current = setInterval(() => setTimer(t => t+1), 1000);
      socketRef.current?.emit('join-room', { meetingId, userName: user?.name });
      toast('You joined the meeting', 'success');
    },
    onMeetingLeft: () => {
      clearInterval(timerRef.current);
    },
    onParticipantJoined: (p) => {
      toast(`${p.displayName} joined`);
    },
    onParticipantLeft: (p) => {
      toast(`${p.displayName} left`);
    },
    onPresenterChanged: (id) => {
      if (id) {
        toast('Screen sharing started');
      } else {
        toast('Screen sharing stopped');
      }
      // screenOn is now computed from presenterId directly — no setState needed
    },
    onError: (e) => {
      console.error('Meeting error:', e);
      toast(e?.message || 'Meeting error', 'error');
    },
  });

  // ── VideoSDK useTranscription ─────────────────────────────────
  const { startTranscription, stopTranscription } = useTranscription({
    onTranscriptionStateChanged: (status) => {
      console.log('Transcription state:', status);
    },
    onTranscriptionText: async (data) => {
      if (!data?.text) return;

      const originalText = data.text;
      const targetLang   = langRef.current;
      const speaker      = data.participantName || user?.name || 'Speaker';
      const time         = new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

      // Show original text immediately (no delay)
      setCcText(originalText);
      clearTimeout(ccTimerRef.current);
      ccTimerRef.current = setTimeout(() => setCcText(''), 6000);

      // Translate to target language
      let displayText = originalText;
      try {
        displayText = await translateText(originalText, targetLang);
      } catch(_) {}

      const line = {
        speaker,
        text:     displayText,
        original: originalText,
        time,
        lang:     targetLang,
      };

      setTranscript(t => [...t, line]);
      // Update caption overlay with translated text
      setCcText(displayText);
      clearTimeout(ccTimerRef.current);
      ccTimerRef.current = setTimeout(() => setCcText(''), 6000);

      // Save translated text to backend
      api.post(`/meetings/${meetingId}/transcript`, {
        speaker,
        text:     displayText,
        language: targetLang,
      }).catch(() => {});
    },
  });

  // ── Transcription state from Constants (official API) ─────────
  const STARTED  = Constants.transcriptionEvents.TRANSCRIPTION_STARTED;
  const STARTING = Constants.transcriptionEvents.TRANSCRIPTION_STARTING;
  const STOPPED  = Constants.transcriptionEvents.TRANSCRIPTION_STOPPED;

  const ccOn      = transcriptionState === STARTED || transcriptionState === STARTING;
  const ccStarting = transcriptionState === STARTING;

  // ── Toggle captions ───────────────────────────────────────────
  const toggleCC = () => {
    if (transcriptionState === STARTED) {
      stopTranscription();
      setCcText('');
      toast('Captions disabled');
    } else if (transcriptionState === STOPPED || transcriptionState === undefined) {
      // VideoSDK always uses en-US for speech detection
      // We translate the output to the target language ourselves
      startTranscription({ language: 'en-US' });
      const targetLabel = LANGUAGES.find(l => l.code === langRef.current)?.label || 'English';
      toast(`Starting captions → translated to ${targetLabel}`);
      console.log('Transcription started | translation target:', langRef.current);
    }
    // If STARTING — wait
  };

  // When user changes target language — no need to restart VideoSDK
  // Translation happens client-side on each new transcript line
  const handleLangChange = (newLang) => {
    setLang(newLang);
    langRef.current = newLang;
    const label = LANGUAGES.find(l => l.code === newLang)?.label || 'English';
    toast(`Caption language → ${label}`);
    console.log('Translation target changed to:', newLang);
  };

  // ── Socket setup ──────────────────────────────────────────────
  useEffect(() => {
    const s = io(SOCKET_URL, {
      transports:         ['websocket'],
      reconnection:       true,
      reconnectionAttempts: 5,
      reconnectionDelay:  1000,
    });
    socketRef.current = s;
    s.on('connect',           () => console.log('Socket connected'));
    s.on('disconnect',        () => console.log('Socket disconnected'));
    s.on('chat-message',      msg => setMessages(m => [...m, msg]));
    s.on('reaction',          ({ emoji, senderName }) => {
      const id = Date.now();
      setReactions(r => [...r, { id, emoji, senderName }]);
      setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 3500);
    });
    s.on('recording-started', () => toast('Host started recording'));
    s.on('meeting-ended',     () => {
      toast('Meeting ended by host');
      setTimeout(() => onEnded({}), 1500);
    });
    return () => s.disconnect();
  }, []);

  useEffect(() => {
    join();
    return () => clearInterval(timerRef.current);
  }, []);

  // ── Screen share ──────────────────────────────────────────────
  // screenOn is now derived from presenterId (VideoSDK source of truth)
  // We find local participant id from the participants map
  const localParticipantId = [...(participants?.keys() || [])].find(
    id => participants.get(id)?.isLocal
  );
  // screenOn = true when the local user is the presenter
  const isLocalSharing = !!presenterId && presenterId === localParticipantId;

  const handleScreenShare = async () => {
    try {
      if (isLocalSharing) {
        await disableScreenShare();
      } else {
        if (presenterId && !isLocalSharing) {
          toast('Someone else is already sharing', 'error');
          return;
        }
        await enableScreenShare();
        toast('Screen sharing started', 'success');
      }
    } catch(e) {
      const name = e?.name || '';
      const msg  = e?.message || String(e);
      if (name === 'NotAllowedError' || msg.includes('NotAllowed') || msg.includes('Permission')) {
        toast('Screen share denied — click Allow in the browser popup', 'error');
      } else if (name === 'NotSupportedError') {
        toast('Screen share not supported in this browser', 'error');
      } else if (!msg.includes('cancel') && !msg.includes('abort')) {
        toast('Screen share error: ' + msg, 'error');
      }
      console.error('Screen share error:', e);
    }
  };

  // ── Recording ─────────────────────────────────────────────────
  // Flow: getUserMedia → MediaRecorder → blob → fetch POST → Cloudinary → MongoDB
  const uploadPromiseRef = useRef(null);
  const streamRef        = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const startRecording = async () => {
    try {
      // Get fresh local stream for recording (independent of VideoSDK)
      let localStream;
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        toast('Recording started (video + audio) ●', 'success');
      } catch(_) {
        try {
          localStream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          toast('Recording started (audio only) ●', 'success');
        } catch(e2) {
          toast('Permission denied — allow camera/mic and try again', 'error');
          return;
        }
      }

      streamRef.current  = localStream;
      chunksRef.current  = [];

      const mimeType =
        MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' :
        MediaRecorder.isTypeSupported('video/webm;codecs=vp8') ? 'video/webm;codecs=vp8' :
        'video/webm';

      const mr = new MediaRecorder(localStream, { mimeType });

      mr.ondataavailable = e => { if (e.data?.size > 0) chunksRef.current.push(e.data); };

      mr.onstop = () => {
        // Stop all tracks
        streamRef.current?.getTracks().forEach(t => t.stop());
        streamRef.current = null;
        // Begin upload and store the promise so handleEnd can await it
        uploadPromiseRef.current = uploadRecording();
      };

      mr.onerror = e => {
        console.error('MediaRecorder error:', e);
        toast('Recording error: ' + (e?.error?.message || 'unknown'), 'error');
      };

      mr.start(1000);
      mrRef.current = mr;
      setRecording(true);
      socketRef.current?.emit('recording-started', { meetingId });
      console.log('Recording started | mimeType:', mr.mimeType);
    } catch(e) {
      console.error('startRecording error:', e);
      toast('Failed to start recording: ' + e.message, 'error');
    }
  };

  const stopRecording = () => {
    if (mrRef.current && mrRef.current.state !== 'inactive') {
      mrRef.current.stop();
      setRecording(false);
      toast('Recording stopped — uploading to Cloudinary...');
    }
  };

  const uploadRecording = async () => {
    if (!chunksRef.current.length) {
      console.warn('uploadRecording: no chunks collected');
      toast('No recording data — nothing to upload', 'error');
      return;
    }

    setRecUploading(true);
    setUploadProgress(0);

    const blob   = new Blob(chunksRef.current, { type: 'video/webm' });
    const sizeMB = (blob.size / 1024 / 1024).toFixed(2);

    console.log('\n📹 Starting recording upload...');
    console.log('   Meeting ID:', meetingId);
    console.log('   File size :', sizeMB, 'MB');

    if (blob.size < 1000) {
      toast('Recording too short to upload', 'error');
      setRecUploading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append('recording', blob, `recording-${meetingId}-${Date.now()}.webm`);
      formData.append('meetingId', meetingId);

      const token  = localStorage.getItem('memora_token');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

      // Use XMLHttpRequest for upload progress tracking
      const cloudinaryUrl = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100);
            setUploadProgress(pct);
            if (pct % 20 === 0) console.log('   Upload progress:', pct + '%');
          }
        };

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status === 200 && data.success) {
              resolve(data.recordingUrl);
            } else {
              reject(new Error(data.message || `Server error ${xhr.status}`));
            }
          } catch(_) {
            reject(new Error('Invalid server response'));
          }
        };

        xhr.onerror   = () => reject(new Error('Network error — check if backend is running'));
        xhr.ontimeout = () => reject(new Error('Upload timed out — file may be too large'));
        xhr.timeout   = 5 * 60 * 1000; // 5 minutes

        xhr.open('POST', `${apiUrl}/recordings/upload`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        // DO NOT set Content-Type — browser sets it with multipart boundary
        xhr.send(formData);
      });

      // ── SUCCESS ───────────────────────────────────────────
      console.log('\n   ✅ Recording uploaded successfully:', cloudinaryUrl);
      console.log('   Meeting ID:', meetingId);
      console.log('   File size :', sizeMB, 'MB\n');

      setUploadProgress(100);
      toast(`Recording saved to Cloudinary (${sizeMB} MB) ✓`, 'success');

      // Also store in localStorage so dashboard can show it immediately
      try {
        const stored = JSON.parse(localStorage.getItem('memora_recordings') || '[]');
        const exists = stored.find(r => r.meetingId === meetingId);
        if (!exists) {
          stored.unshift({ meetingId, recordingUrl: cloudinaryUrl, sizeMB, savedAt: new Date().toISOString() });
          localStorage.setItem('memora_recordings', JSON.stringify(stored.slice(0, 50)));
        }
      } catch(_) {}

    } catch(e) {
      console.error('\n   ❌ Upload failed:', e.message, '\n');
      toast('Upload failed: ' + e.message, 'error');

      // Fallback: auto-download locally so recording is not lost
      try {
        console.log('   Saving recording locally as fallback...');
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `memora-recording-${meetingId}.webm`;
        a.click();
        URL.revokeObjectURL(url);
        toast('Saved locally as fallback (check Downloads)', 'info');
      } catch(_) {}
    } finally {
      setRecUploading(false);
      setUploadProgress(0);
    }
  };

    // ── Chat ──────────────────────────────────────────────────────
  const sendChat = (text) => {
    const msg = { senderName: user?.name || 'You', message: text, timestamp: new Date() };
    socketRef.current?.emit('chat-message', { meetingId, ...msg });
    setMessages(m => [...m, msg]);
    api.post(`/meetings/${meetingId}/chat`, { message: text }).catch(() => {});
  };

  // ── Reactions ─────────────────────────────────────────────────
  const sendReaction = (emoji) => {
    socketRef.current?.emit('reaction', { meetingId, emoji, senderName: user?.name });
    const id = Date.now();
    setReactions(r => [...r, { id, emoji, senderName: 'You' }]);
    setTimeout(() => setReactions(r => r.filter(x => x.id !== id)), 3500);
    setPanel('');
  };

  // ── End meeting ───────────────────────────────────────────────
  const handleEnd = async () => {
    setEnding(true);
    try {
      if (transcriptionState === STARTED) { stopTranscription(); setCcText(''); }

      // FIX: stop recording and WAIT for upload to fully complete
      if (recording) {
        stopRecording();
        // Give MediaRecorder time to flush remaining chunks (onstop fires async)
        await new Promise(r => setTimeout(r, 1500));
        // Now wait for the actual upload promise to resolve
        if (uploadPromiseRef.current) {
          toast('Waiting for recording upload to finish...');
          await uploadPromiseRef.current;
        }
      }

      clearInterval(timerRef.current);

      const fullTranscript = transcript.map(l => `[${l.speaker}]: ${l.text}`).join('\n');
      const { data } = await api.put(`/meetings/${meetingId}/end`, { fullTranscript });

      socketRef.current?.emit('meeting-ended', { meetingId });
      try { end(); } catch(_) {}

      onEnded({
        summary:     data.summary,
        overview:    data.overview,
        keyPoints:   data.keyPoints,
        decisions:   data.decisions,
        actionItems: data.actionItems,
        duration:    data.duration,
      });
    } catch(e) {
      toast('Failed to end meeting: ' + e.message, 'error');
      setEnding(false);
    }
  };

  const handleLeave = () => {
    socketRef.current?.emit('leave-room', { meetingId });
    if (transcriptionState === STARTED) stopTranscription();
    // Stop recording gracefully if active (upload continues in background)
    if (recording) stopRecording();
    clearInterval(timerRef.current);
    leave();
    onEnded({});
  };

  const copy = () => {
    navigator.clipboard?.writeText(meetingId);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast('Meeting ID copied!');
  };

  const downloadTranscript = () => {
    const text = transcript.map(l => `[${l.time}] ${l.speaker}: ${l.text}`).join('\n');
    const blob = new Blob([`MEMORA TRANSCRIPT\n\nTopic: ${topic}\nDate: ${new Date().toLocaleString()}\n\n${text}`], { type:'text/plain' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `transcript_${meetingId}.txt`;
    a.click();
  };

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const pIds = [...participants.keys()];
  const gridCols = pIds.length<=1?1:pIds.length<=2?2:pIds.length<=4?2:3;
  const togglePanel = (p) => { setPanel(v => v===p ? '' : p); setShowMore(false); };

  return (
    <div style={{ height:'100vh', background:'#0B1120', display:'flex', flexDirection:'column', overflow:'hidden', fontFamily:'Inter,system-ui,sans-serif' }}>
      <Toast messages={toasts}/>

      {/* ── Header ── */}
      <div style={{ height:56, background:'#111C35', borderBottom:'1px solid #1A3A6B', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 16px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:28, height:28, background:'#2D6FFF', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Video size={14} color="#fff"/>
          </div>
          <div>
            <p style={{ color:'#fff', fontSize:13, fontWeight:600, margin:0, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{topic}</p>
            <p style={{ color:'#94B4F0', fontSize:11, margin:0, fontFamily:'monospace' }}>{meetingId}</p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {recording && (
            <span style={{ display:'flex', alignItems:'center', gap:5, color:'#f87171', fontSize:12, fontWeight:600 }}>
              <span style={{ width:7, height:7, background:'#f87171', borderRadius:'50%', animation:'pulse 1.5s ease infinite' }}/>REC
            </span>
          )}
          {recUploading && (
            <span style={{ display:'flex', alignItems:'center', gap:6, color:'#1A56DB', fontSize:11 }}>
              <div style={{ width:60, height:4, background:'#1A3A6B', borderRadius:9999, overflow:'hidden' }}>
                <div style={{ width:`${uploadProgress}%`, height:'100%', background:'#1A56DB', borderRadius:9999, transition:'width .3s' }}/>
              </div>
              {uploadProgress}%
            </span>
          )}
          {ccStarting && <span style={{ color:'#f59e0b', fontSize:11 }}>Starting captions...</span>}
          {ccOn && !ccStarting && (
            <span style={{ display:'flex', alignItems:'center', gap:5, color:'#34d399', fontSize:11 }}>
              <span style={{ width:6, height:6, background:'#34d399', borderRadius:'50%', animation:'pulse 1.5s ease infinite' }}/>CC Live
            </span>
          )}
          <span style={{ background:'#1A3A6B', padding:'4px 10px', borderRadius:8, color:'#7BA8F5', fontSize:11, fontFamily:'monospace' }}>{fmt(timer)}</span>
          <span style={{ display:'flex', alignItems:'center', gap:4, color:'#4D7AC7', fontSize:12 }}><Users size={13}/>{pIds.length}</span>
          <button onClick={copy} style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#E8F0FF', borderRadius:8, fontSize:12, fontWeight:500, cursor:'pointer' }}>
            {copied ? <><Check size={12} color="#34d399"/><span style={{color:'#34d399'}}>Copied</span></> : <><Copy size={12}/><span>Copy ID</span></>}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>
        {/* Video grid */}
        <div style={{ flex:1, padding:12, position:'relative', overflow:'hidden' }}>
          {presenterId ? (
            /* Screen share layout: presenter large on left, others in column on right */
            <div style={{ display:'flex', gap:12, height:'100%' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <ParticipantTile key={presenterId} participantId={presenterId} isLocal={participants.get(presenterId)?.isLocal} isLarge={true}/>
              </div>
              {pIds.length > 1 && (
                <div style={{ width:180, display:'flex', flexDirection:'column', gap:8, overflowY:'auto' }}>
                  {pIds.filter(id => id !== presenterId).map(id => (
                    <div key={id} style={{ flexShrink:0 }}>
                      <ParticipantTile participantId={id} isLocal={participants.get(id)?.isLocal}/>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Normal grid */
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${gridCols},1fr)`, gap:12, height:'100%' }}>
              {pIds.map(id => <ParticipantTile key={id} participantId={id} isLocal={participants.get(id)?.isLocal}/>)}
            </div>
          )}

          {/* ── Live caption overlay ── */}
          {ccOn && (
            <div style={{ position:'absolute', bottom:16, left:'50%', transform:'translateX(-50%)', width:'88%', maxWidth:640, zIndex:10 }}>
              {ccText ? (
                <div style={{ background:'rgba(0,0,0,.88)', backdropFilter:'blur(8px)', borderRadius:14, padding:'12px 22px', textAlign:'center', border:'1px solid rgba(255,255,255,.08)', animation:'fadeIn .2s ease' }}>
                  <p style={{ color:'#93C5FD', fontSize:11, margin:'0 0 5px', fontWeight:500, display:'flex', alignItems:'center', gap:4 }}>
                    <span>🌐</span>
                    {LANGUAGES.find(l=>l.code===lang)?.label}
                    {lang !== 'en' && <span style={{ fontSize:10, opacity:.7 }}>• translated</span>}
                  </p>
                  <p style={{ color:'#fff', fontSize:15, lineHeight:1.5, margin:0 }}>{ccText}</p>
                </div>
              ) : (
                <div style={{ display:'flex', justifyContent:'center' }}>
                  <div style={{ background:'rgba(0,0,0,.7)', borderRadius:10, padding:'6px 14px', display:'flex', alignItems:'center', gap:8 }}>
                    {ccStarting ? (
                      <span style={{ color:'#f59e0b', fontSize:11 }}>Starting captions...</span>
                    ) : (
                      <>
                        <span style={{ display:'flex', gap:3 }}>
                          {[0,150,300].map(d=>(
                            <span key={d} style={{ width:5, height:5, background:'#1A56DB', borderRadius:'50%', display:'inline-block', animation:`pulse 1.5s ${d}ms ease infinite` }}/>
                          ))}
                        </span>
                        <span style={{ color:'#94B4F0', fontSize:11 }}>Listening...</span>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Reactions */}
          <div style={{ position:'absolute', bottom:72, right:16, display:'flex', flexDirection:'column', gap:8, zIndex:10 }}>
            {reactions.map(r => (
              <div key={r.id} style={{ background:'rgba(15,23,42,.92)', backdropFilter:'blur(8px)', borderRadius:12, padding:'6px 12px', display:'flex', alignItems:'center', gap:8, border:'1px solid #1A3A6B', animation:'slideUp .3s ease' }}>
                <span style={{ fontSize:20 }}>{r.emoji}</span>
                <span style={{ color:'#7BA8F5', fontSize:11 }}>{r.senderName}</span>
              </div>
            ))}
          </div>

          {/* More menu */}
          {showMore && (
            <div style={{ position:'absolute', top:16, right:16, background:'#111C35', border:'1px solid #1A3A6B', borderRadius:16, padding:8, zIndex:20, minWidth:230, boxShadow:'0 20px 40px rgba(30,58,138,.15)' }}>
              <p style={{ color:'#94B4F0', fontSize:10, fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', padding:'8px 12px 4px', margin:0 }}>More Options</p>

              <button onClick={() => { toggleCC(); setShowMore(false); }}
                disabled={ccStarting}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'none', border:'none', color: ccStarting?'#94B4F0':'#E8F0FF', fontSize:13, borderRadius:10, cursor: ccStarting?'not-allowed':'pointer', textAlign:'left' }}>
                <Subtitles size={15} color={ccOn?'#1A56DB':'currentColor'}/>
                {ccStarting ? 'Starting...' : ccOn ? 'Disable Captions' : 'Enable Captions'}
              </button>

              <button onClick={() => { togglePanel('transcript'); }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'none', border:'none', color:'#E8F0FF', fontSize:13, borderRadius:10, cursor:'pointer', textAlign:'left' }}>
                <Globe size={15}/>Transcript & Language
              </button>

              <button onClick={() => { recording ? stopRecording() : startRecording(); setShowMore(false); }}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 12px', background:'none', border:'none', color: recording?'#f87171':'#E8F0FF', fontSize:13, borderRadius:10, cursor:'pointer', textAlign:'left' }}>
                {recording ? <StopCircle size={15}/> : <Radio size={15}/>}
                {recording ? 'Stop Recording' : 'Start Recording'}
              </button>
            </div>
          )}
        </div>

        {/* Side panel */}
        {panel && (
          <div style={{ width:284, background:'#111C35', borderLeft:'1px solid #1A3A6B', display:'flex', flexDirection:'column', overflow:'hidden', flexShrink:0 }}>
            {panel==='chat'         && <ChatPanel messages={messages} onSend={sendChat} onClose={()=>setPanel('')}/>}
            {panel==='transcript'   && (
              <TranscriptPanel
                lines={transcript}
                lang={lang}
                setLang={handleLangChange}
                ccOn={ccOn}
                onToggleCC={() => { toggleCC(); }}
                onClose={()=>setPanel('')}
                onDownload={downloadTranscript}
              />
            )}
            {panel==='participants' && <ParticipantsPanel participants={participants} onClose={()=>setPanel('')}/>}
            {panel==='reactions'    && (
              <div style={{ padding:16 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                  <span style={{ color:'#fff', fontWeight:600, fontSize:14 }}>Reactions</span>
                  <button onClick={()=>setPanel('')} style={{ background:'none', border:'none', color:'#4D7AC7', cursor:'pointer' }}><X size={16}/></button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
                  {REACTIONS.map(e => (
                    <button key={e} onClick={()=>sendReaction(e)}
                      style={{ fontSize:28, background:'#1A3A6B', border:'none', borderRadius:10, padding:'10px 0', cursor:'pointer', transition:'transform .15s' }}
                      onMouseOver={ev=>ev.currentTarget.style.transform='scale(1.2)'}
                      onMouseOut={ev=>ev.currentTarget.style.transform='scale(1)'}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Control bar ── */}
      <div style={{ height:80, background:'#111C35', borderTop:'1px solid #1A3A6B', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 24px', flexShrink:0 }}>
        {/* Left */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <CtrlBtn icon={micOn?<Mic size={20}/>:<MicOff size={20}/>}         label={micOn?'Mute':'Unmute'}         active={micOn}      onClick={()=>{ toggleMic();       setMicOn(v=>!v); }}/>
          <CtrlBtn icon={camOn?<Video size={20}/>:<VideoOff size={20}/>}      label={camOn?'Stop Video':'Start Vid'} active={camOn}      onClick={()=>{ toggleWebcam();    setCamOn(v=>!v); }}/>
          <CtrlBtn icon={isLocalSharing?<ScreenShareOff size={20}/>:<ScreenShare size={20}/>} label={isLocalSharing?'Stop Share':'Share'} active={isLocalSharing} onClick={handleScreenShare}/>
        </div>

        {/* Center */}
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <CtrlBtn icon={<MessageSquare size={20}/>} label="Chat"       active={panel==='chat'}         onClick={()=>togglePanel('chat')}         badge={panel!=='chat'?messages.length:0}/>
          <CtrlBtn icon={<Users size={20}/>}          label="People"     active={panel==='participants'} onClick={()=>togglePanel('participants')}/>
          <CtrlBtn icon={<Subtitles size={20}/>}      label={ccStarting?'Starting...':ccOn?LANGUAGES.find(l=>l.code===lang)?.label||'CC On':'CC Off'} active={ccOn} onClick={()=>{ toggleCC(); }}/>
          <CtrlBtn icon={<Smile size={20}/>}          label="React"      active={panel==='reactions'}    onClick={()=>togglePanel('reactions')}/>
          <CtrlBtn icon={<MoreVertical size={20}/>}   label="More"       active={showMore}               onClick={()=>{ setShowMore(v=>!v); if(panel) setPanel(''); }}/>
        </div>

        {/* Right */}
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={handleLeave} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 16px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#E8F0FF', borderRadius:10, fontSize:13, fontWeight:500, cursor:'pointer' }}>
            <Phone size={15} style={{ transform:'rotate(135deg)' }}/>Leave
          </button>
          <button onClick={handleEnd} disabled={ending} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 18px', background: ending?'#7f1d1d':'#dc2626', border:'none', color:'#fff', borderRadius:10, fontSize:13, fontWeight:600, cursor: ending?'not-allowed':'pointer', opacity: ending?0.7:1 }}>
            {ending
              ? <div style={{ width:14, height:14, border:'2px solid #fff', borderTopColor:'transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
              : <Phone size={15} style={{ transform:'rotate(135deg)' }}/>}
            {ending ? 'Ending...' : 'End Meeting'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes pulse  { 0%,100%{opacity:1}    50%{opacity:.35} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes fadeIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp{ from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}

// ── Outer wrapper ─────────────────────────────────────────────
export default function MeetingRoom() {
  const { meetingId }         = useParams();
  const navigate              = useNavigate();
  const { user }              = useAuth();
  const [topic,    setTopic]  = useState('Meeting');
  const [ended,    setEnded]  = useState(false);
  const [endData,  setEndData]= useState({});

  useEffect(() => {
    api.get(`/meetings/${meetingId}`)
      .then(r => setTopic(r.data.meeting?.topic || 'Meeting'))
      .catch(() => {});
  }, [meetingId]);

  const handleEnded = useCallback((data) => {
    setEndData({ ...data, topic });
    setEnded(true);
  }, [topic]);

  if (!TOKEN) return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0B1120 0%,#1A3A6B 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:24, fontFamily:'Inter,system-ui,sans-serif' }}>
      <div style={{ background:'#111C35', border:'1px solid #1A3A6B', borderRadius:16, padding:32, maxWidth:400, textAlign:'center' }}>
        <h2 style={{ color:'#f87171', fontWeight:700, fontSize:18, margin:'0 0 10px' }}>VideoSDK Token Missing</h2>
        <p style={{ color:'#4D7AC7', fontSize:13, margin:'0 0 20px' }}>
          Add <code style={{ background:'#1A3A6B', padding:'2px 6px', borderRadius:4 }}>VITE_VIDEOSDK_TOKEN</code> to <code style={{ background:'#1A3A6B', padding:'2px 6px', borderRadius:4 }}>frontend/.env</code>
        </p>
        <button onClick={() => navigate('/dashboard')} style={{ padding:'8px 20px', background:'#1A3A6B', border:'1px solid #1A2E55', color:'#E8F0FF', borderRadius:10, cursor:'pointer', fontSize:13 }}>Go Back</button>
      </div>
    </div>
  );

  if (ended) return <EndedScreen data={endData} onHome={() => navigate('/dashboard')}/>;

  return (
    <MeetingProvider
      token={TOKEN}
      config={{ meetingId, name: user?.name || 'Guest', micEnabled: true, webcamEnabled: true }}
      joinWithoutUserInteraction
    >
      <MeetingInner meetingId={meetingId} topic={topic} onEnded={handleEnded}/>
    </MeetingProvider>
  );
}
