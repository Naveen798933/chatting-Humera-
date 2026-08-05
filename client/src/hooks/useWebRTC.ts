import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// We distinguish 'caller' (made the call) from 'answerer' (received + accepted)
export type CallRole = 'caller' | 'answerer' | null;

interface UseWebRTCOptions {
  onRemoteStream?: (stream: MediaStream) => void;
}

export function useWebRTC(options?: UseWebRTCOptions) {
  const [localStream, setLocalStream]       = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream]     = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted]         = useState(false);
  const [isCameraOff, setIsCameraOff]       = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

  const localStreamRef   = useRef<MediaStream | null>(null);
  const pcRef            = useRef<RTCPeerConnection | null>(null);
  const channelRef       = useRef<any>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const roleRef          = useRef<CallRole>(null);

  const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
  };

  // ── Graceful media acquisition with 3-tier fallback ────────────────────────
  const acquireStream = async (video: boolean): Promise<MediaStream | null> => {
    const audioConstraints: MediaTrackConstraints = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl:  true,
    };
    const videoConstraints: MediaTrackConstraints = {
      width:     { ideal: 1280 },
      height:    { ideal: 720 },
      frameRate: { ideal: 30 },
      facingMode: 'user',
    };

    // Attempt 1: ideal HD
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
        video: video ? videoConstraints : false,
      });
    } catch (_) {}

    // Attempt 2: basic
    try { return await navigator.mediaDevices.getUserMedia({ audio: true, video }); } catch (_) {}

    // Attempt 3: audio only
    try { return await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (_) {}

    console.error('[WebRTC] Could not acquire any media stream');
    return null;
  };

  // ── Build RTCPeerConnection ─────────────────────────────────────────────────
  const buildPC = useCallback((stream: MediaStream): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    stream.getTracks().forEach(t => pc.addTrack(t, stream));

    pc.ontrack = (e) => {
      const s = e.streams?.[0] ?? new MediaStream([e.track]);
      setRemoteStream(s);
      options?.onRemoteStream?.(s);
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'SIGNAL_ICE',
          payload: { candidate: e.candidate },
        }).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => setConnectionState(pc.connectionState);

    return pc;
  }, [options]);

  // ── Drain buffered ICE candidates ──────────────────────────────────────────
  const drainIceQueue = async (pc: RTCPeerConnection) => {
    while (iceCandidateQueue.current.length) {
      const c = iceCandidateQueue.current.shift()!;
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (_) {}
    }
  };

  // ── Main entry: call initializeCall(video, role) ───────────────────────────
  // role = 'caller'   → creates offer, waits for answer
  // role = 'answerer' → waits for offer, creates answer
  const initializeCall = useCallback(async (video: boolean, role: CallRole) => {
    roleRef.current = role;

    const stream = await acquireStream(video);
    if (!stream) return null;

    localStreamRef.current = stream;
    setLocalStream(stream);

    const pc = buildPC(stream);

    if (!isSupabaseConfigured()) return pc;

    // Use a unique session channel so both sides see each other's signals
    const channel = supabase.channel('ou_webrtc_session_v2');
    channelRef.current = channel;

    channel
      // ── Answerer receives offer ──────────────────────────────────────────
      .on('broadcast', { event: 'SIGNAL_OFFER' }, async (payload: any) => {
        if (roleRef.current !== 'answerer') return;  // only answerer handles offer
        const { offer } = payload.payload ?? {};
        if (!offer || pc.signalingState === 'closed') return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await drainIceQueue(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          channel.send({ type: 'broadcast', event: 'SIGNAL_ANSWER', payload: { answer } })
            .catch(() => {});
        } catch (err) { console.error('[WebRTC] offer handling error', err); }
      })
      // ── Caller receives answer ───────────────────────────────────────────
      .on('broadcast', { event: 'SIGNAL_ANSWER' }, async (payload: any) => {
        if (roleRef.current !== 'caller') return;  // only caller handles answer
        const { answer } = payload.payload ?? {};
        if (!answer || pc.signalingState === 'closed') return;
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await drainIceQueue(pc);
        } catch (err) { console.error('[WebRTC] answer handling error', err); }
      })
      // ── Both sides handle ICE ────────────────────────────────────────────
      .on('broadcast', { event: 'SIGNAL_ICE' }, async (payload: any) => {
        const { candidate } = payload.payload ?? {};
        if (!candidate || pc.signalingState === 'closed') return;
        if (pc.remoteDescription) {
          try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (_) {}
        } else {
          iceCandidateQueue.current.push(candidate);
        }
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        if (role === 'caller') {
          // Caller creates & sends offer immediately after subscribe
          try {
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: video,
            });
            await pc.setLocalDescription(offer);
            channel.send({ type: 'broadcast', event: 'SIGNAL_OFFER', payload: { offer } })
              .catch(() => {});
          } catch (err) { console.error('[WebRTC] createOffer error', err); }
        }
        // Answerer just waits — it will receive SIGNAL_OFFER from caller
      });

    return pc;
  }, [buildPC]);

  // ── Toggle mic mute ────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const s = localStreamRef.current ?? localStream;
    if (s) {
      s.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMicMuted(p => !p);
    }
  }, [localStream]);

  // ── Toggle camera ──────────────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    const s = localStreamRef.current ?? localStream;
    if (s) {
      s.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsCameraOff(p => !p);
    }
  }, [localStream]);

  // ── End call and release all resources ─────────────────────────────────────
  const endCall = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);

    pcRef.current?.close();
    pcRef.current = null;

    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch (_) {}
      channelRef.current = null;
    }

    iceCandidateQueue.current = [];
    roleRef.current = null;
    setRemoteStream(null);
    setIsMicMuted(false);
    setIsCameraOff(false);
    setConnectionState('closed');
  }, []);

  useEffect(() => () => { endCall(); }, [endCall]);

  return {
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    connectionState,
    initializeCall,
    toggleMic,
    toggleCamera,
    endCall,
  };
}
