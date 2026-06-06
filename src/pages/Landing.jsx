import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Video, Users, Shield, Zap, Globe, MessageSquare, ChevronRight, Menu, X, Brain, Film } from 'lucide-react';

const features = [
  { icon: Video,         title: 'HD Video Meetings',    desc: 'Crystal clear video with real-time WebRTC technology for seamless communication.' },
  { icon: Brain,         title: 'AI-Powered Summaries', desc: 'Auto-generated meeting summaries with key points, decisions and action items.' },
  { icon: MessageSquare, title: 'Live Transcription',   desc: 'Real-time captions in English, Hindi and Marathi with auto-translation.' },
  { icon: Users,         title: 'Multi-Participant',    desc: 'Host meetings with multiple participants and screen sharing.' },
  { icon: Globe,         title: 'Email Summaries',      desc: 'PDF summary with recording link auto-emailed to all participants.' },
  { icon: Film,          title: 'Cloud Recordings',     desc: 'Record meetings and store on Cloudinary. Stream or download anytime.' },
];

const stats = [
  { value: '100%', label: 'Free to use' },
  { value: 'HD',   label: 'Video quality' },
  { value: '3',    label: 'Languages' },
  { value: 'AI',   label: 'Summaries' },
];

export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-dark-900" style={{ fontFamily:'Inter,system-ui,sans-serif' }}>

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-dark-900/90 backdrop-blur border-b border-dark-700">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center" style={{ boxShadow:'0 4px 12px rgba(45,111,255,.4)' }}>
              <Video className="w-4 h-4 text-white" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight">AI POWERED SMART ONLINE MEETING PLATFORM</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-dark-300 hover:text-white text-sm transition-colors">Features</a>
            <a href="#how" className="text-dark-300 hover:text-white text-sm transition-colors">How it works</a>
            <Link to="/login"    className="text-dark-300 hover:text-white text-sm transition-colors">Sign In</Link>
            <Link to="/register" className="btn-primary text-sm px-5 py-2">Get Started →</Link>
          </div>
          <button className="md:hidden text-dark-300" onClick={() => setMenuOpen(v => !v)}>
            {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
        {menuOpen && (
          <div className="md:hidden bg-dark-800 border-t border-dark-700 px-6 py-4 space-y-3">
            <Link to="/login"    className="block text-dark-300 text-sm py-2" onClick={() => setMenuOpen(false)}>Sign In</Link>
            <Link to="/register" className="btn-primary justify-center block text-center py-2" onClick={() => setMenuOpen(false)}>Get Started</Link>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="pt-36 pb-24 px-4" style={{ background:'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(45,111,255,.15) 0%, transparent 60%)' }}>
        <div className="max-w-4xl mx-auto text-center">

          {/* Badge — NO "Powered by VideoSDK" */}
          <div className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full border border-dark-600" style={{ background:'rgba(45,111,255,.08)' }}>
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-dark-300 text-xs font-medium">AI-Powered Smart Meeting Platform</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-tight tracking-tight">
            Meet Smarter<br/>
            <span style={{ background:'linear-gradient(135deg, #7BA8F5, #2D6FFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>
              with Memora
            </span>
          </h1>

          <p className="text-dark-300 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Video meetings with live AI transcription, auto-translation in Hindi & Marathi, 
            smart summaries, cloud recordings and email delivery.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <Link to="/register" className="btn-primary px-8 py-3 text-base" style={{ boxShadow:'0 0 30px rgba(45,111,255,.4)' }}>
              Start Meeting Free <ChevronRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="btn-secondary px-8 py-3 text-base">
              Sign In
            </Link>
          </div>
          <p className="text-dark-500 text-xs">No credit card required · Free forever</p>
        </div>

        {/* ── Hero visual — Meeting room mockup ── */}
        <div className="max-w-5xl mx-auto mt-20">
          <div className="rounded-2xl border border-dark-700 overflow-hidden" style={{ background:'#111C35', boxShadow:'0 40px 80px rgba(0,0,0,.5), 0 0 0 1px rgba(45,111,255,.1)' }}>
            {/* Browser bar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-dark-700" style={{ background:'#0D1626' }}>
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
              <div className="w-3 h-3 rounded-full bg-green-500/80" />
              <div className="ml-3 flex-1 max-w-xs bg-dark-700 rounded-md px-3 py-1">
                <span className="text-dark-400 text-xs">memora.app/meeting</span>
              </div>
            </div>
            {/* Participants grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
              {[
                { name:'Snehal P',   init:'S', from:'from-violet-900', to:'to-purple-700',  host:true  },
                { name:'Vaishnavi D',init:'V', from:'from-blue-900',   to:'to-indigo-700',  host:false },
                { name:'Aniket D',   init:'A', from:'from-emerald-900',to:'to-teal-700',    host:false },
                { name:'Omkar P',    init:'O', from:'from-rose-900',   to:'to-pink-700',    host:false },
              ].map((p, i) => (
                <div key={i} className={`aspect-video bg-gradient-to-br ${p.from} ${p.to} rounded-xl flex flex-col items-center justify-center relative`}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg mb-2" style={{ background:'rgba(255,255,255,.15)' }}>
                    {p.init}
                  </div>
                  <p className="text-white/90 text-xs font-medium">{p.name}</p>
                  {p.host && (
                    <div className="mt-1 flex items-center gap-1">
                      <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                      <span className="text-green-400 text-[10px] font-medium">Host</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {/* Caption bar */}
            <div className="mx-4 mb-4 rounded-xl px-4 py-2.5 flex items-center gap-2" style={{ background:'rgba(45,111,255,.08)', border:'1px solid rgba(45,111,255,.15)' }}>
              <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" />
              <p className="text-dark-300 text-xs">"AI is transforming how we collaborate in meetings..."</p>
              <span className="ml-auto text-dark-500 text-[10px] font-mono">🌐 Translated · हिंदी</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 border-y border-dark-700" style={{ background:'rgba(45,111,255,.04)' }}>
        <div className="max-w-4xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-extrabold text-white mb-1" style={{ background:'linear-gradient(135deg,#7BA8F5,#2D6FFF)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent' }}>{s.value}</div>
              <div className="text-dark-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Everything you need</h2>
            <p className="text-dark-400 max-w-xl mx-auto">All features built-in. No plugins. No extra cost.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div key={i} className="card p-6 group" style={{ transition:'all .2s' }}
                onMouseOver={e => { e.currentTarget.style.borderColor='rgba(45,111,255,.5)'; e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 12px 30px rgba(45,111,255,.1)'; }}
                onMouseOut={e  => { e.currentTarget.style.borderColor=''; e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background:'rgba(45,111,255,.1)' }}>
                  <f.icon className="w-5 h-5 text-primary-400" />
                </div>
                <h3 className="text-white font-semibold mb-2">{f.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section id="how" className="py-24 px-4 border-t border-dark-700" style={{ background:'rgba(45,111,255,.03)' }}>
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">How it works</h2>
          <p className="text-dark-400 mb-16">Get started in 3 simple steps</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step:'01', title:'Create a Meeting', desc:'Click New Meeting, give it a topic, get a shareable link instantly.' },
              { step:'02', title:'Invite Participants', desc:'Share the meeting ID or link. Anyone with the link can join.' },
              { step:'03', title:'Meet & Get Summary', desc:'Meeting ends → AI summary + recording emailed to everyone automatically.' },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 font-bold text-lg text-white" style={{ background:'linear-gradient(135deg,rgba(45,111,255,.3),rgba(45,111,255,.1))', border:'1px solid rgba(45,111,255,.3)' }}>
                  {s.step}
                </div>
                <h3 className="text-white font-semibold mb-2">{s.title}</h3>
                <p className="text-dark-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="rounded-2xl p-12" style={{ background:'linear-gradient(135deg,rgba(45,111,255,.15),rgba(45,111,255,.05))', border:'1px solid rgba(45,111,255,.2)' }}>
            <h2 className="text-4xl font-bold text-white mb-4">Ready to start?</h2>
            <p className="text-dark-400 mb-10">Create your first meeting in seconds.</p>
            {/* Fixed button — no arrow icon cutting into it, proper rounded */}
            <Link to="/register"
              style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', padding:'14px 48px', background:'#2D6FFF', color:'#fff', borderRadius:12, fontSize:16, fontWeight:700, textDecoration:'none', boxShadow:'0 0 40px rgba(45,111,255,.5)', transition:'all .2s', letterSpacing:'-.2px' }}
              onMouseOver={e => { e.currentTarget.style.background='#1A56DB'; e.currentTarget.style.transform='translateY(-2px)'; }}
              onMouseOut={e  => { e.currentTarget.style.background='#2D6FFF'; e.currentTarget.style.transform='none'; }}>
              Start for Free
            </Link>
            <p className="text-dark-600 text-xs mt-6">No credit card · Free forever · Cancel anytime</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-dark-700 py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <Video className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-bold">Memora</span>
          </div>
          <p className="text-dark-500 text-sm">© {new Date().getFullYear()} Memora — Smart Meeting System</p>
          <div className="flex gap-4 text-dark-500 text-sm">
            <Link to="/login" className="hover:text-white transition-colors">Sign In</Link>
            <Link to="/register" className="hover:text-white transition-colors">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
