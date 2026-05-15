import React from 'react';
import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Landing     from './pages/Landing';
import Login       from './pages/Login';
import Register    from './pages/Register';
import Dashboard   from './pages/Dashboard';
import MeetingRoom from './pages/MeetingRoom';
import History     from './pages/History';
import Recordings  from './pages/Recordings';
import Schedule    from './pages/Schedule';

const Protected = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
};

const Guest = ({ children }) => {
  const { user } = useAuth();
  return !user ? children : <Navigate to="/dashboard" replace />;
};

// Public join page — redirects to login if not logged in, then to meeting
function JoinRedirect() {
  const { meetingId } = useParams();
  const { user }      = useAuth();
  const navigate      = useNavigate();

  React.useEffect(() => {
    if (user) {
      // Logged in — go straight to join
      navigate(`/meeting/${meetingId}`, { replace: true });
    } else {
      // Not logged in — go to login, then return here
      navigate(`/login?redirect=/join/${meetingId}`, { replace: true });
    }
  }, [user, meetingId]);

  return (
    <div style={{ minHeight:'100vh', background:'#0a0f1e', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ color:'#475569', fontSize:14 }}>Redirecting to meeting...</div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/"              element={<Landing />} />
      <Route path="/login"         element={<Guest><Login /></Guest>} />
      <Route path="/register"      element={<Guest><Register /></Guest>} />
      <Route path="/dashboard"     element={<Protected><Dashboard /></Protected>} />
      <Route path="/history"       element={<Protected><History /></Protected>} />
      <Route path="/recordings"    element={<Protected><Recordings /></Protected>} />
      <Route path="/schedule"      element={<Protected><Schedule /></Protected>} />
      <Route path="/meeting/:meetingId" element={<Protected><MeetingRoom /></Protected>} />
      {/* Public shareable join link */}
      <Route path="/join/:meetingId"    element={<JoinRedirect />} />
      <Route path="*"              element={<Navigate to="/" replace />} />
    </Routes>
  );
}
