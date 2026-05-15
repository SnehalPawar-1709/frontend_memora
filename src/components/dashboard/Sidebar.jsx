import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Video, LayoutDashboard, Clock, Calendar, Film, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const items = [
  { path:'/dashboard',  icon:LayoutDashboard, label:'Home' },
  { path:'/schedule',   icon:Calendar,        label:'Schedule' },
  { path:'/history',    icon:Clock,           label:'Meeting History' },
  { path:'/recordings', icon:Film,            label:'Recordings' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside style={{
      width:220, flexShrink:0,
      background:'#0D1626',
      borderRight:'1px solid #1A3A6B',
      display:'flex', flexDirection:'column',
      height:'100vh', position:'sticky', top:0,
      boxShadow:'1px 0 20px rgba(45,111,255,.08)',
    }}>
      {/* Logo */}
      <div style={{ height:64, display:'flex', alignItems:'center', gap:10, padding:'0 20px', borderBottom:'1px solid #1A3A6B' }}>
        <div style={{ width:32, height:32, background:'#2D6FFF', borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 12px rgba(45,111,255,.4)' }}>
          <Video size={16} color="#fff"/>
        </div>
        <span style={{ color:'#E8F0FF', fontWeight:700, fontSize:18, letterSpacing:'-.3px' }}>Memora</span>
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'12px 10px', display:'flex', flexDirection:'column', gap:2 }}>
        {items.map(({ path, icon: Icon, label }) => {
          const active = pathname === path;
          return (
            <Link key={path} to={path} style={{
              display:'flex', alignItems:'center', gap:10,
              padding:'9px 12px', borderRadius:10,
              fontSize:13, fontWeight: active ? 600 : 500,
              textDecoration:'none', transition:'all .15s',
              background: active ? 'rgba(45,111,255,.15)' : 'transparent',
              color:      active ? '#7BA8F5' : '#4D7AC7',
              borderLeft: active ? '3px solid #2D6FFF' : '3px solid transparent',
            }}
            onMouseOver={e => { if (!active) { e.currentTarget.style.background='rgba(45,111,255,.08)'; e.currentTarget.style.color='#E8F0FF'; }}}
            onMouseOut={e  => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#4D7AC7'; }}}>
              <Icon size={16}/>
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding:12, borderTop:'1px solid #1A3A6B' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px' }}>
          <div style={{ width:34, height:34, background:'rgba(45,111,255,.15)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', color:'#7BA8F5', fontWeight:700, fontSize:13, flexShrink:0 }}>
            {(user?.name||'U')[0].toUpperCase()}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ color:'#E8F0FF', fontSize:13, fontWeight:600, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.name}</p>
            <p style={{ color:'#3A5A9A', fontSize:11, margin:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{user?.email}</p>
          </div>
        </div>
        <button onClick={logout}
          style={{ display:'flex', alignItems:'center', gap:8, width:'100%', padding:'8px 10px', background:'none', border:'none', color:'#4D7AC7', cursor:'pointer', fontSize:13, borderRadius:8, transition:'all .15s' }}
          onMouseOver={e=>{ e.currentTarget.style.background='rgba(239,68,68,.1)'; e.currentTarget.style.color='#F87171'; }}
          onMouseOut={e =>{ e.currentTarget.style.background='none'; e.currentTarget.style.color='#4D7AC7'; }}>
          <LogOut size={14}/>Sign Out
        </button>
      </div>
    </aside>
  );
}
