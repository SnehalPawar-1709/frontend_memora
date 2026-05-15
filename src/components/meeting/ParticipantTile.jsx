import React, { useRef, useEffect } from 'react';
import { useParticipant } from '@videosdk.live/react-sdk';
import { MicOff, Monitor } from 'lucide-react';

export default function ParticipantTile({ participantId, isLarge = false }) {
  const {
    webcamStream, micStream, screenShareStream,
    webcamOn, micOn, screenShareOn,
    isLocal, displayName,
  } = useParticipant(participantId);

  const videoRef       = useRef(null);
  const audioRef       = useRef(null);
  const screenShareRef = useRef(null);

  // Webcam
  useEffect(() => {
    if (videoRef.current) {
      if (webcamOn && webcamStream) {
        const ms = new MediaStream();
        ms.addTrack(webcamStream.track);
        videoRef.current.srcObject = ms;
        videoRef.current.play().catch(() => {});
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [webcamStream, webcamOn]);

  // Audio
  useEffect(() => {
    if (audioRef.current) {
      if (!isLocal && micOn && micStream) {
        const ms = new MediaStream();
        ms.addTrack(micStream.track);
        audioRef.current.srcObject = ms;
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn, isLocal]);

  // Screen share
  useEffect(() => {
    if (screenShareRef.current) {
      if (screenShareOn && screenShareStream) {
        const ms = new MediaStream();
        ms.addTrack(screenShareStream.track);
        screenShareRef.current.srcObject = ms;
        screenShareRef.current.play().catch(() => {});
      } else {
        screenShareRef.current.srcObject = null;
      }
    }
  }, [screenShareStream, screenShareOn]);

  const initials = (displayName || '?').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{
      position: 'relative',
      background: '#1A3A6B',
      borderRadius: 16,
      overflow: 'hidden',
      border: '1px solid #1A2E55',
      aspectRatio: isLarge ? 'auto' : '16/9',
      height: isLarge ? '100%' : 'auto',
    }}>
      <audio ref={audioRef} autoPlay muted={isLocal} />

      {/* Screen share takes priority over webcam */}
      {screenShareOn ? (
        <>
          <video
            ref={screenShareRef}
            autoPlay
            playsInline
            muted={isLocal}
            style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
          />
          {/* Small webcam PiP if webcam is also on */}
          {webcamOn && (
            <div style={{ position: 'absolute', bottom: 40, right: 8, width: 100, height: 72, borderRadius: 8, overflow: 'hidden', border: '2px solid #2D6FFF' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }}
              />
            </div>
          )}
          {/* Screen share indicator */}
          <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(59,130,246,.95)', borderRadius: 8, padding: '3px 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Monitor size={11} color="#fff" />
            <span style={{ color: '#fff', fontSize: 11, fontWeight: 600 }}>Sharing Screen</span>
          </div>
        </>
      ) : webcamOn ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          style={{ width: '100%', height: '100%', objectFit: 'cover', transform: isLocal ? 'scaleX(-1)' : 'none' }}
        />
      ) : (
        /* No video — show avatar */
        <div style={{ width: '100%', height: '100%', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1A3A6B, #111C35)' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#2D6FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 22 }}>
            {initials}
          </div>
        </div>
      )}

      {/* Name badge */}
      <div style={{ position: 'absolute', bottom: 8, left: 8, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 8 }}>
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 500, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayName || 'Unknown'}{isLocal ? ' (You)' : ''}
        </span>
        {!micOn && <MicOff size={11} color="#f87171" />}
      </div>

      {/* Host badge */}
      {isLocal && (
        <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(79,70,229,.8)', padding: '2px 8px', borderRadius: 8, color: '#fff', fontSize: 10, fontWeight: 600 }}>
          You
        </div>
      )}
    </div>
  );
}
