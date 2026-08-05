import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface UseWebRTCOptions {
  onRemoteStream?: (stream: MediaStream) => void;
}

export function useWebRTC(options?: UseWebRTCOptions) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [connectionState, setConnectionState] = useState<RTCPeerConnectionState>('new');

  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const channelRef = useRef<any>(null);

  // High-availability STUN servers for peer-to-peer NAT traversal across cellular/WiFi networks
  const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' }
    ]
  };

  const createPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add all local audio & video tracks to the peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Receive partner's remote audio/video tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        options?.onRemoteStream?.(event.streams[0]);
      }
    };

    // Send ICE candidates to partner over Supabase Realtime channel
    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        try {
          channelRef.current.send({
            type: 'broadcast',
            event: 'SIGNAL_ICE',
            payload: { candidate: event.candidate }
          });
        } catch (e) {}
      }
    };

    pc.onconnectionstatechange = () => {
      setConnectionState(pc.connectionState);
    };

    return pc;
  }, [options]);

  const initializeCall = useCallback(async (video: boolean = true) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: video ? {
          width: { ideal: 1920, min: 1280 },
          height: { ideal: 1080, min: 720 },
          frameRate: { ideal: 30, max: 60 },
          facingMode: 'user'
        } : false,
        audio: {
          sampleRate: 48000,
          sampleSize: 16,
          channelCount: 2,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection(stream);

      // Connect Supabase Realtime Signaling Channel
      if (isSupabaseConfigured()) {
        const channel = supabase.channel('ou_webrtc_signaling');
        channelRef.current = channel;

        channel
          .on('broadcast', { event: 'SIGNAL_OFFER' }, async (payload) => {
            const { offer } = payload.payload || {};
            if (offer && pc && pc.signalingState !== 'closed') {
              await pc.setRemoteDescription(new RTCSessionDescription(offer));
              const answer = await pc.createAnswer();
              await pc.setLocalDescription(answer);

              channel.send({
                type: 'broadcast',
                event: 'SIGNAL_ANSWER',
                payload: { answer }
              });
            }
          })
          .on('broadcast', { event: 'SIGNAL_ANSWER' }, async (payload) => {
            const { answer } = payload.payload || {};
            if (answer && pc && pc.signalingState !== 'closed') {
              await pc.setRemoteDescription(new RTCSessionDescription(answer));
            }
          })
          .on('broadcast', { event: 'SIGNAL_ICE' }, async (payload) => {
            const { candidate } = payload.payload || {};
            if (candidate && pc && pc.signalingState !== 'closed') {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {}
            }
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              // Initiate SDP offer as caller
              const offer = await pc.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: video
              });
              await pc.setLocalDescription(offer);

              channel.send({
                type: 'broadcast',
                event: 'SIGNAL_OFFER',
                payload: { offer }
              });
            }
          });
      }

      return pc;
    } catch (err) {
      console.error('Error accessing media devices for WebRTC call:', err);
      return null;
    }
  }, [createPeerConnection]);

  const toggleMic = useCallback(() => {
    const stream = localStreamRef.current || localStream;
    if (stream) {
      stream.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMicMuted(prev => !prev);
    }
  }, [localStream]);

  const toggleCamera = useCallback(() => {
    const stream = localStreamRef.current || localStream;
    if (stream) {
      stream.getVideoTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(prev => !prev);
    }
  }, [localStream]);

  const endCall = useCallback(() => {
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch (e) {}
      channelRef.current = null;
    }

    setRemoteStream(null);
    setIsMicMuted(false);
    setIsCameraOff(false);
    setConnectionState('closed');
  }, []);

  useEffect(() => {
    return () => {
      endCall();
    };
  }, [endCall]);

  return {
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    connectionState,
    initializeCall,
    toggleMic,
    toggleCamera,
    endCall
  };
}
