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
  const iceCandidatesQueue = useRef<RTCIceCandidateInit[]>([]);

  // High-availability STUN servers for peer-to-peer NAT traversal across cellular & WiFi networks
  const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' }
    ]
  };

  // Safe user media stream acquisition with graceful fallbacks
  const getMediaStream = async (video: boolean): Promise<MediaStream | null> => {
    try {
      // Preferred HD Media constraints
      return await navigator.mediaDevices.getUserMedia({
        video: video ? { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' } : false,
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true }
      });
    } catch (e1) {
      try {
        // Fallback 1: Basic video + audio
        return await navigator.mediaDevices.getUserMedia({
          video: video,
          audio: true
        });
      } catch (e2) {
        try {
          // Fallback 2: Audio only (if camera is unavailable/blocked)
          return await navigator.mediaDevices.getUserMedia({
            audio: true
          });
        } catch (e3) {
          console.error('All media devices acquisition attempts failed:', e3);
          return null;
        }
      }
    }
  };

  const createPeerConnection = useCallback((stream: MediaStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionRef.current = pc;

    // Add all local audio & video tracks to peer connection
    stream.getTracks().forEach(track => {
      pc.addTrack(track, stream);
    });

    // Receive partner's remote audio/video tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        options?.onRemoteStream?.(event.streams[0]);
      } else if (event.track) {
        const newStream = new MediaStream([event.track]);
        setRemoteStream(newStream);
        options?.onRemoteStream?.(newStream);
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
    const stream = await getMediaStream(video);
    if (!stream) return null;

    localStreamRef.current = stream;
    setLocalStream(stream);

    const pc = createPeerConnection(stream);

    // Connect Supabase Realtime Signaling Channel
    if (isSupabaseConfigured()) {
      const channel = supabase.channel('ou_webrtc_signaling');
      channelRef.current = channel;

      const processQueuedIceCandidates = async () => {
        while (iceCandidatesQueue.current.length > 0) {
          const candidate = iceCandidatesQueue.current.shift();
          if (candidate && pc.remoteDescription) {
            try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
          }
        }
      };

      channel
        .on('broadcast', { event: 'REQUEST_OFFER' }, async () => {
          if (pc && pc.signalingState !== 'closed') {
            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: video });
            await pc.setLocalDescription(offer);
            channel.send({ type: 'broadcast', event: 'SIGNAL_OFFER', payload: { offer } });
          }
        })
        .on('broadcast', { event: 'SIGNAL_OFFER' }, async (payload) => {
          const { offer } = payload.payload || {};
          if (offer && pc && pc.signalingState !== 'closed') {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            await processQueuedIceCandidates();
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
            await processQueuedIceCandidates();
          }
        })
        .on('broadcast', { event: 'SIGNAL_ICE' }, async (payload) => {
          const { candidate } = payload.payload || {};
          if (candidate && pc && pc.signalingState !== 'closed') {
            if (pc.remoteDescription) {
              try { await pc.addIceCandidate(new RTCIceCandidate(candidate)); } catch (e) {}
            } else {
              iceCandidatesQueue.current.push(candidate);
            }
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            // Send request offer or send initial offer
            channel.send({ type: 'broadcast', event: 'REQUEST_OFFER', payload: {} });

            const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: video });
            await pc.setLocalDescription(offer);
            channel.send({ type: 'broadcast', event: 'SIGNAL_OFFER', payload: { offer } });
          }
        });
    }

    return pc;
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

    iceCandidatesQueue.current = [];
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
