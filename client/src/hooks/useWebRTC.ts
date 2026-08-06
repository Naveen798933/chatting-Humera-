import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export type CallRole = 'caller' | 'answerer' | null;

interface UseWebRTCOptions {
  onRemoteStream?: (stream: MediaStream) => void;
}

export function useWebRTC(options?: UseWebRTCOptions) {
  const [localStream, setLocalStream]           = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream]         = useState<MediaStream | null>(null);
  const [isMicMuted, setIsMicMuted]             = useState(false);
  const [isCameraOff, setIsCameraOff]           = useState(false);
  const [isScreenSharing, setIsScreenSharing]   = useState(false);
  const [facingMode, setFacingMode]             = useState<'user' | 'environment'>('user');
  const [connectionState, setConnectionState]   = useState<RTCPeerConnectionState>('new');

  const localStreamRef    = useRef<MediaStream | null>(null);
  const remoteStreamRef   = useRef<MediaStream | null>(null);
  const screenStreamRef   = useRef<MediaStream | null>(null);
  const pcRef             = useRef<RTCPeerConnection | null>(null);
  const channelRef        = useRef<any>(null);
  const iceCandidateQueue = useRef<RTCIceCandidateInit[]>([]);
  const roleRef           = useRef<CallRole>(null);
  const isVideoRef        = useRef<boolean>(true);

  const ICE_SERVERS: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:global.stun.twilio.com:3478' },
    ],
  };

  // ── Optimize SDP for 510kbps Opus Stereo & HD Video Codec ─────────────────
  const optimizeSDP = (sdp: string): string => {
    return sdp.replace(
      /a=fmtp:(\d+) (.*opus.*)/gi,
      'a=fmtp:$1 $2;maxaveragebitrate=510000;stereo=1;sprop-stereo=1;useinbandfec=1;usedtx=0;cbr=1'
    );
  };

  // ── Apply High Bitrate Senders (3.5Mbps Video, 510kbps Audio) ───────────────
  const applyHighQualityBitrates = (pc: RTCPeerConnection) => {
    pc.getSenders().forEach((sender) => {
      if (sender.track?.kind === 'video') {
        const params = sender.getParameters();
        if (!params.encodings || params.encodings.length === 0) {
          params.encodings = [{}];
        }
        params.encodings[0].maxBitrate = 3500000; // 3.5 Mbps HD 1080p 60fps
        params.encodings[0].maxFramerate = 60;
        params.encodings[0].priority = 'high';
        params.encodings[0].networkPriority = 'high';
        sender.setParameters(params).catch(() => {});
      } else if (sender.track?.kind === 'audio') {
        const params = sender.getParameters();
        if (!params.encodings || params.encodings.length === 0) {
          params.encodings = [{}];
        }
        params.encodings[0].maxBitrate = 510000; // 510 kbps Studio Audio
        params.encodings[0].priority = 'high';
        sender.setParameters(params).catch(() => {});
      }
    });
  };

  // ── Acquire Studio Audio & Low-Latency Video Stream ─────────────────────────
  const acquireStream = async (video: boolean, mode: 'user' | 'environment' = 'user'): Promise<MediaStream | null> => {
    const studioAudioConstraints: MediaTrackConstraints & Record<string, any> = {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      sampleRate: { ideal: 48000 },
      sampleSize: { ideal: 16 },
      channelCount: { ideal: 2 },
      googEchoCancellation: true,
      googAutoGainControl: true,
      googNoiseSuppression: true,
      googHighpassFilter: true
    };

    const hdVideoConstraints: MediaTrackConstraints = {
      width:       { ideal: 1280, max: 1920 },
      height:      { ideal: 720, max: 1080 },
      frameRate:   { ideal: 30, max: 30 },
      facingMode:  mode,
      aspectRatio: { ideal: 1.777777778 },
    };

    // Attempt 1: HD 30fps Low-Latency Video + Studio Stereo Audio
    try {
      if (video) {
        return await navigator.mediaDevices.getUserMedia({
          audio: studioAudioConstraints,
          video: hdVideoConstraints,
        });
      }
    } catch (_) {}

    // Attempt 2: Standard HD Video + Studio Audio
    try {
      if (video) {
        return await navigator.mediaDevices.getUserMedia({
          audio: studioAudioConstraints,
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 30 }, facingMode: mode },
        });
      }
    } catch (_) {}

    // Attempt 3: Basic Video + Audio
    try {
      if (video) {
        return await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      }
    } catch (_) {}

    // Attempt 4: Studio Audio only fallback
    try {
      return await navigator.mediaDevices.getUserMedia({ audio: studioAudioConstraints });
    } catch (_) {}

    console.error('[WebRTC] Could not acquire high quality stream');
    return null;
  };

  // ── Build RTCPeerConnection ─────────────────────────────────────────────────
  const buildPC = useCallback((stream: MediaStream): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);
    pcRef.current = pc;

    // Create a persistent remote stream
    const rStream = new MediaStream();
    remoteStreamRef.current = rStream;
    setRemoteStream(rStream);

    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });

    pc.ontrack = (event) => {
      console.log('[WebRTC] Remote track received:', event.track.kind);
      if (event.streams && event.streams[0]) {
        setRemoteStream(event.streams[0]);
        remoteStreamRef.current = event.streams[0];
        options?.onRemoteStream?.(event.streams[0]);
      } else {
        if (remoteStreamRef.current) {
          if (!remoteStreamRef.current.getTracks().some((t) => t.id === event.track.id)) {
            remoteStreamRef.current.addTrack(event.track);
          }
          const updated = new MediaStream(remoteStreamRef.current.getTracks());
          setRemoteStream(updated);
          options?.onRemoteStream?.(updated);
        }
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'SIGNAL_ICE',
          payload: { candidate: event.candidate },
        }).catch(() => {});
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      setConnectionState(pc.connectionState);
      if (pc.connectionState === 'connected') {
        applyHighQualityBitrates(pc);
      }
    };

    return pc;
  }, [options]);

  // ── Drain buffered ICE candidates ──────────────────────────────────────────
  const drainIceQueue = async (pc: RTCPeerConnection) => {
    while (iceCandidateQueue.current.length > 0) {
      const candidate = iceCandidateQueue.current.shift()!;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (_) {}
    }
  };

  // ── Send Offer Helper ──────────────────────────────────────────────────────
  const createAndSendOffer = async (pc: RTCPeerConnection, channel: any, video: boolean) => {
    try {
      console.log('[WebRTC] Creating & Sending HD Offer...');
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: video,
      });
      
      const optimizedSDP = optimizeSDP(offer.sdp || '');
      const optimizedOffer = new RTCSessionDescription({ type: offer.type, sdp: optimizedSDP });

      await pc.setLocalDescription(optimizedOffer);
      applyHighQualityBitrates(pc);

      await channel.send({
        type: 'broadcast',
        event: 'SIGNAL_OFFER',
        payload: { offer: optimizedOffer },
      });
    } catch (err) {
      console.error('[WebRTC] createOffer error:', err);
    }
  };

  // ── Main Entry: Initialize Call ─────────────────────────────────────────────
  const initializeCall = useCallback(async (video: boolean, role: CallRole) => {
    roleRef.current = role;
    isVideoRef.current = video;

    const stream = await acquireStream(video, facingMode);
    if (!stream) return null;

    localStreamRef.current = stream;
    setLocalStream(stream);

    const pc = buildPC(stream);

    if (!isSupabaseConfigured()) return pc;

    // Use WebRTC session channel
    const channel = supabase.channel('ou_webrtc_session_v3');
    channelRef.current = channel;

    channel
      .on('broadcast', { event: 'SIGNAL_READY' }, async () => {
        if (roleRef.current === 'caller' && pc.signalingState !== 'closed') {
          console.log('[WebRTC] Received SIGNAL_READY from Answerer -> Sending HD Offer');
          await createAndSendOffer(pc, channel, isVideoRef.current);
        }
      })
      .on('broadcast', { event: 'SIGNAL_OFFER' }, async (payload: any) => {
        if (roleRef.current !== 'answerer') return;
        const { offer } = payload.payload ?? {};
        if (!offer || pc.signalingState === 'closed') return;
        try {
          console.log('[WebRTC] Answerer received SIGNAL_OFFER -> Creating Answer');
          await pc.setRemoteDescription(new RTCSessionDescription(offer));
          await drainIceQueue(pc);
          const answer = await pc.createAnswer();
          const optimizedSDP = optimizeSDP(answer.sdp || '');
          const optimizedAnswer = new RTCSessionDescription({ type: answer.type, sdp: optimizedSDP });

          await pc.setLocalDescription(optimizedAnswer);
          applyHighQualityBitrates(pc);

          await channel.send({
            type: 'broadcast',
            event: 'SIGNAL_ANSWER',
            payload: { answer: optimizedAnswer },
          });
        } catch (err) {
          console.error('[WebRTC] Offer handling error:', err);
        }
      })
      .on('broadcast', { event: 'SIGNAL_ANSWER' }, async (payload: any) => {
        if (roleRef.current !== 'caller') return;
        const { answer } = payload.payload ?? {};
        if (!answer || pc.signalingState === 'closed') return;
        try {
          console.log('[WebRTC] Caller received SIGNAL_ANSWER');
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
          await drainIceQueue(pc);
          applyHighQualityBitrates(pc);
        } catch (err) {
          console.error('[WebRTC] Answer handling error:', err);
        }
      })
      .on('broadcast', { event: 'SIGNAL_ICE' }, async (payload: any) => {
        const { candidate } = payload.payload ?? {};
        if (!candidate || pc.signalingState === 'closed') return;
        if (pc.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch (_) {}
        } else {
          iceCandidateQueue.current.push(candidate);
        }
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') return;
        console.log(`[WebRTC] Channel Subscribed as ${role}`);

        if (role === 'answerer') {
          await channel.send({
            type: 'broadcast',
            event: 'SIGNAL_READY',
            payload: {},
          }).catch(() => {});
        } else if (role === 'caller') {
          await createAndSendOffer(pc, channel, video);
        }
      });

    return pc;
  }, [buildPC, facingMode]);

  // ── Toggle Mic Mute ────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    const s = localStreamRef.current ?? localStream;
    if (s) {
      const audioTracks = s.getAudioTracks();
      const nextState = !isMicMuted;
      audioTracks.forEach(t => { t.enabled = !nextState; });
      setIsMicMuted(nextState);
    }
  }, [localStream, isMicMuted]);

  // ── Toggle Camera On/Off ───────────────────────────────────────────────────
  const toggleCamera = useCallback(() => {
    const s = localStreamRef.current ?? localStream;
    if (s) {
      const videoTracks = s.getVideoTracks();
      const nextState = !isCameraOff;
      videoTracks.forEach(t => { t.enabled = !nextState; });
      setIsCameraOff(nextState);
    }
  }, [localStream, isCameraOff]);

  // ── Switch Front/Back Camera (Mobile) ──────────────────────────────────────
  const switchCamera = useCallback(async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);

    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.stop());
    }

    try {
      const newStream = await acquireStream(isVideoRef.current, newMode);
      if (newStream && pcRef.current) {
        const newVideoTrack = newStream.getVideoTracks()[0];
        if (newVideoTrack) {
          const senders = pcRef.current.getSenders();
          const videoSender = senders.find(s => s.track && s.track.kind === 'video');
          if (videoSender) {
            await videoSender.replaceTrack(newVideoTrack);
          }
        }
        setLocalStream(newStream);
        localStreamRef.current = newStream;
      }
    } catch (err) {
      console.error('[WebRTC] Error switching camera:', err);
    }
  }, [facingMode]);

  // ── Toggle Screen Sharing ──────────────────────────────────────────────────
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop Screen Share & revert to webcam
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);

      if (localStreamRef.current && pcRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
        if (videoSender && videoTrack) {
          await videoSender.replaceTrack(videoTrack);
        }
      }
    } else {
      // Start Screen Share
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          console.warn('[WebRTC] Screen sharing is not supported on mobile browsers');
          alert('Screen sharing is not supported on mobile browsers. Please use a desktop browser for screen sharing 🖥️');
          return;
        }

        const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        screenStreamRef.current = displayStream;
        setIsScreenSharing(true);

        const screenTrack = displayStream.getVideoTracks()[0];
        if (pcRef.current) {
          const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
          if (videoSender && screenTrack) {
            await videoSender.replaceTrack(screenTrack);
          }
        }

        // When user stops screen share via native browser bar
        screenTrack.onended = () => {
          setIsScreenSharing(false);
          if (localStreamRef.current && pcRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            const videoSender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'video');
            if (videoSender && videoTrack) {
              videoSender.replaceTrack(videoTrack).catch(() => {});
            }
          }
        };
      } catch (err) {
        console.warn('[WebRTC] Screen share error or cancelled:', err);
      }
    }
  }, [isScreenSharing]);

  // ── End Call & Cleanup ─────────────────────────────────────────────────────
  const endCall = useCallback(() => {
    console.log('[WebRTC] Ending Call & Cleaning Up');
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    setLocalStream(null);

    screenStreamRef.current?.getTracks().forEach(t => t.stop());
    screenStreamRef.current = null;
    setIsScreenSharing(false);

    remoteStreamRef.current?.getTracks().forEach(t => t.stop());
    remoteStreamRef.current = null;
    setRemoteStream(null);

    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }

    if (channelRef.current) {
      try { supabase.removeChannel(channelRef.current); } catch (_) {}
      channelRef.current = null;
    }

    iceCandidateQueue.current = [];
    roleRef.current = null;
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
    isScreenSharing,
    facingMode,
    connectionState,
    initializeCall,
    toggleMic,
    toggleCamera,
    switchCamera,
    toggleScreenShare,
    endCall,
  };
}
