import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Video, Eye, EyeOff } from 'lucide-react';

const inp = { width:'100%', padding:'11px 14px', background:'#0D1626', border:'1.5px solid #1A3A6B', color:'#E8F0FF', borderRadius:10, fontSize:14, outline:'none', boxSizing:'border-box', transition:'border .2s' };
const onF  = e => e.target.style.borderColor = '#2D6FFF';
const onB  = e => e.target.style.borderColor = '#1A3A6B';

export function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/dashboard';
  const [form,  setForm]  = useState({ email:'', password:'' });
  const [error, setError] = useState('');
  const [show,  setShow]  = useState(false);

  const handle = async e => {
    e.preventDefault(); setError('');
    const r = await login(form.email, form.password);
    if (r?.success === false) setError(r.message);
    else navigate(redirectTo, { replace:true });
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0B1120 0%,#111C35 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:'Inter,system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, background:'#2D6FFF', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 8px 24px rgba(45,111,255,.4)' }}>
            <Video size={24} color="#fff"/>
          </div>
          <h1 style={{ color:'#E8F0FF', fontSize:26, fontWeight:800, margin:'0 0 6px', letterSpacing:'-.5px' }}>Memora</h1>
          <p style={{ color:'#4D7AC7', fontSize:13, margin:0 }}>Smart Meeting System</p>
        </div>
        <div style={{ background:'#111C35', borderRadius:20, padding:32, boxShadow:'0 8px 40px rgba(45,111,255,.15)', border:'1px solid #1A3A6B' }}>
          <h2 style={{ color:'#E8F0FF', fontSize:18, fontWeight:700, margin:'0 0 22px', textAlign:'center' }}>Sign in to your account</h2>
          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', color:'#94B4F0', fontSize:12, fontWeight:600, marginBottom:6 }}>Email</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required style={inp} placeholder="you@email.com" onFocus={onF} onBlur={onB}/>
            </div>
            <div>
              <label style={{ display:'block', color:'#94B4F0', fontSize:12, fontWeight:600, marginBottom:6 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={show?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required style={{ ...inp, paddingRight:40 }} placeholder="••••••••" onFocus={onF} onBlur={onB}/>
                <button type="button" onClick={()=>setShow(s=>!s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#4D7AC7', cursor:'pointer' }}>
                  {show?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>
            {error && <p style={{ color:'#F87171', fontSize:12, margin:0, background:'rgba(239,68,68,.1)', padding:'8px 12px', borderRadius:8 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ padding:'12px', background:'#2D6FFF', border:'none', color:'#fff', borderRadius:10, cursor:loading?'not-allowed':'pointer', fontSize:14, fontWeight:700, boxShadow:'0 4px 14px rgba(45,111,255,.35)', opacity:loading?0.7:1, marginTop:4 }}>
              {loading?'Signing in...':'Sign In'}
            </button>
          </form>
          <p style={{ color:'#4D7AC7', fontSize:13, textAlign:'center', margin:'18px 0 0' }}>
            Don't have an account?{' '}<Link to="/register" style={{ color:'#7BA8F5', fontWeight:600, textDecoration:'none' }}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [form,  setForm]  = useState({ name:'', email:'', password:'' });
  const [error, setError] = useState('');
  const [show,  setShow]  = useState(false);

  const handle = async e => {
    e.preventDefault(); setError('');
    const r = await register(form.name, form.email, form.password);
    if (r?.success === false) setError(r.message);
    else navigate('/dashboard');
  };

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0B1120 0%,#111C35 100%)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, fontFamily:'Inter,system-ui,sans-serif' }}>
      <div style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ width:52, height:52, background:'#2D6FFF', borderRadius:16, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px', boxShadow:'0 8px 24px rgba(45,111,255,.4)' }}>
            <Video size={24} color="#fff"/>
          </div>
          <h1 style={{ color:'#E8F0FF', fontSize:26, fontWeight:800, margin:'0 0 6px', letterSpacing:'-.5px' }}>Memora</h1>
          <p style={{ color:'#4D7AC7', fontSize:13, margin:0 }}>Smart Meeting System</p>
        </div>
        <div style={{ background:'#111C35', borderRadius:20, padding:32, boxShadow:'0 8px 40px rgba(45,111,255,.15)', border:'1px solid #1A3A6B' }}>
          <h2 style={{ color:'#E8F0FF', fontSize:18, fontWeight:700, margin:'0 0 22px', textAlign:'center' }}>Create your account</h2>
          <form onSubmit={handle} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div>
              <label style={{ display:'block', color:'#94B4F0', fontSize:12, fontWeight:600, marginBottom:6 }}>Full Name</label>
              <input type="text" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required style={inp} placeholder="Your full name" onFocus={onF} onBlur={onB}/>
            </div>
            <div>
              <label style={{ display:'block', color:'#94B4F0', fontSize:12, fontWeight:600, marginBottom:6 }}>Email</label>
              <input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required style={inp} placeholder="you@email.com" onFocus={onF} onBlur={onB}/>
            </div>
            <div>
              <label style={{ display:'block', color:'#94B4F0', fontSize:12, fontWeight:600, marginBottom:6 }}>Password</label>
              <div style={{ position:'relative' }}>
                <input type={show?'text':'password'} value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required style={{ ...inp, paddingRight:40 }} placeholder="Min 6 characters" onFocus={onF} onBlur={onB}/>
                <button type="button" onClick={()=>setShow(s=>!s)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', color:'#4D7AC7', cursor:'pointer' }}>
                  {show?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>
            {error && <p style={{ color:'#F87171', fontSize:12, margin:0, background:'rgba(239,68,68,.1)', padding:'8px 12px', borderRadius:8 }}>{error}</p>}
            <button type="submit" disabled={loading} style={{ padding:'12px', background:'#2D6FFF', border:'none', color:'#fff', borderRadius:10, cursor:loading?'not-allowed':'pointer', fontSize:14, fontWeight:700, boxShadow:'0 4px 14px rgba(45,111,255,.35)', opacity:loading?0.7:1, marginTop:4 }}>
              {loading?'Creating...':'Create Account'}
            </button>
          </form>
          <p style={{ color:'#4D7AC7', fontSize:13, textAlign:'center', margin:'18px 0 0' }}>
            Already have an account?{' '}<Link to="/login" style={{ color:'#7BA8F5', fontWeight:600, textDecoration:'none' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
