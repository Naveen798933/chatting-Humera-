import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UniverseProvider, useUniverse } from './context/UniverseContext';
import { AmbientBackground } from './components/AmbientBackground';
import { ScreenshotBanner } from './components/ScreenshotBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { AnniversaryOverlay } from './components/AnniversaryOverlay';
import { IncomingCallModal } from './components/IncomingCallModal';
import { ActiveCallOverlay } from './components/ActiveCallOverlay';
import { useWebRTC } from './hooks/useWebRTC';
import { Navigation, TabType } from './components/Navigation';
import { AuthPage } from './pages/AuthPage';
import { HomeDashboard } from './pages/HomeDashboard';
import { CoreChat } from './pages/CoreChat';
import { MemoriesGallery } from './pages/MemoriesGallery';
import { LoveVaultCalendar } from './pages/LoveVaultCalendar';
import { TogetherTime } from './pages/TogetherTime';
import { LoveAIAssistant } from './components/LoveAIAssistant';
import { AdminBackupModal } from './components/AdminBackupModal';
import { DecoyCalculator } from './components/DecoyCalculator';
import { ToastContainer } from './components/Toast';

import { WhatsAppStatusModal } from './components/WhatsAppStatusModal';
import { StoryItem } from './types';
import { PartnerProfileDrawer } from './components/PartnerProfileDrawer';
import { CallHistoryModal } from './components/CallHistoryModal';
import { supabase, isSupabaseConfigured } from './lib/supabase';
import { toast } from './lib/toast';
import { ThemeSelectorModal, AppTheme } from './components/ThemeSelectorModal';
import { DailyQuestionModal } from './components/DailyQuestionModal';

const AppContent: React.FC = () => {
  const { currentUser, partnerUser, isAuthenticated, isDecoyActive, toggleDecoyMode } = useAuth();
  const { isCallActive, callType, callRole, incomingCall, acceptCall, declineCall, endCall, startCall, messages, memories } = useUniverse();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isCallHistoryOpen, setIsCallHistoryOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [isDailyQuestionOpen, setIsDailyQuestionOpen] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('ou_theme') as AppTheme) || 'cosmic';
  });

  // Sync theme to document dataset & localStorage
  React.useEffect(() => {
    document.documentElement.dataset.theme = currentTheme;
    try { localStorage.setItem('ou_theme', currentTheme); } catch (_) {}
  }, [currentTheme]);

  // Global Escape key listener to close active modals
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isAdminOpen) { setIsAdminOpen(false); return; }
        if (isThemeOpen) { setIsThemeOpen(false); return; }
        if (isDailyQuestionOpen) { setIsDailyQuestionOpen(false); return; }
        if (isStatusOpen) { setIsStatusOpen(false); return; }
        if (isProfileDrawerOpen) { setIsProfileDrawerOpen(false); return; }
        if (isCallHistoryOpen) { setIsCallHistoryOpen(false); return; }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAdminOpen, isThemeOpen, isDailyQuestionOpen, isStatusOpen, isProfileDrawerOpen, isCallHistoryOpen]);

  const [stories, setStories] = useState<StoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ou_shared_stories');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return [
      {
        id: 'story_seed_1',
        authorId: partnerUser?.uid || 'humera_uid_140299',
        authorName: partnerUser?.petName || 'Humera (Jaanu ❤️)',
        authorPhoto: partnerUser?.photoURL || 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
        text: 'Stargazing tonight thinking of you Bangaram! 💕',
        bgGradient: 'from-pink-600 to-purple-800',
        createdAt: new Date().toISOString()
      }
    ];
  });

  // Ref to the subscribed story broadcast channel (must be subscribed before send)
  const storyChannelRef = React.useRef<any>(null);

  const handleAddStory = (st: Omit<StoryItem, 'id' | 'createdAt'>) => {
    const newStory: StoryItem = {
      ...st,
      id: `story_${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    setStories(prev => {
      const updated = [newStory, ...prev];
      try { localStorage.setItem('ou_shared_stories', JSON.stringify(updated)); } catch (_) {}
      return updated;
    });

    // Broadcast to partner via the already-subscribed storyChannelRef
    if (isSupabaseConfigured() && storyChannelRef.current) {
      try {
        storyChannelRef.current.send({
          type: 'broadcast',
          event: 'NEW_STORY',
          payload: { story: newStory }
        }).catch(() => {});
      } catch (_) {}
    }
  };

  // Subscribe to real-time partner stories broadcast
  React.useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const channel = supabase.channel('ou_story_broadcast');
    storyChannelRef.current = channel;
    channel.on('broadcast', { event: 'NEW_STORY' }, (payload: any) => {
      const { story } = payload.payload || {};
      if (story && story.authorId !== currentUser?.uid) {
        setStories(prev => {
          if (prev.some(s => s.id === story.id)) return prev;
          const updated = [story, ...prev];
          try { localStorage.setItem('ou_shared_stories', JSON.stringify(updated)); } catch (_) {}
          return updated;
        });
        toast.love(`New status update from ${story.authorName}! 🌸`);
      }
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
      storyChannelRef.current = null;
    };
  }, [currentUser]);

  const {
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    isSpeakerOn,
    supportsAudioOutputSelection,
    connectionState,
    initializeCall,
    toggleMic,
    toggleCamera,
    switchCamera,
    toggleAudioOutput,
    toggleScreenShare,
    endCall: webrtcEndCall
  } = useWebRTC();

  React.useEffect(() => {
    if (isCallActive && callType && callRole) {
      // Call is connected — initialise WebRTC peer connection
      initializeCall(callType === 'video', callRole);
    } else if (!isCallActive && !callRole) {
      // Call fully ended (not just ringing) — tear down WebRTC
      webrtcEndCall();
    }
    // Don't tear down WebRTC during ringing phase (callRole set, isCallActive false)
  }, [isCallActive, callType, callRole]);

  if (isDecoyActive) {
    return <DecoyCalculator onUnlockRealApp={toggleDecoyMode} />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const starredCount = messages.filter(m => m.isStarred).length;

  return (
    <div className="min-h-screen h-full flex flex-col relative z-10">
      <ScreenshotBanner />
      <PWAInstallPrompt />
      <AnniversaryOverlay />
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenStatus={() => setIsStatusOpen(true)}
        onOpenCallHistory={() => setIsCallHistoryOpen(true)}
        onOpenTheme={() => setIsThemeOpen(true)}
        onOpenDailyQuestion={() => setIsDailyQuestionOpen(true)}
      />

      <main className={`flex-1 w-full overflow-x-hidden min-h-0 ${
        activeTab === 'chat'
          ? 'max-w-7xl mx-auto px-0 sm:px-4 md:px-8 pt-0 sm:pt-4 md:pt-6 pb-0 md:pb-6 flex flex-col overflow-hidden'
          : 'max-w-7xl mx-auto px-2.5 sm:px-6 md:px-8 pt-3 sm:pt-6 pb-28 md:pb-10 overflow-y-auto'
      }`}>
        {activeTab === 'home' && <HomeDashboard />}
        {activeTab === 'chat' && <CoreChat onBackToHome={() => setActiveTab('home')} />}
        {activeTab === 'together' && <TogetherTime />}
        {activeTab === 'memories' && <MemoriesGallery />}
        {activeTab === 'vault' && <LoveVaultCalendar />}
      </main>

      <AdminBackupModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
      <ThemeSelectorModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={(t) => { setCurrentTheme(t); setIsThemeOpen(false); }}
      />
      <DailyQuestionModal
        isOpen={isDailyQuestionOpen}
        onClose={() => setIsDailyQuestionOpen(false)}
        currentPetName={currentUser?.petName || 'Naveen'}
        partnerPetName={partnerUser?.petName || 'Humera'}
      />
      <WhatsAppStatusModal
        isOpen={isStatusOpen}
        onClose={() => setIsStatusOpen(false)}
        currentUser={currentUser}
        partnerUser={partnerUser}
        stories={stories}
        onAddStory={handleAddStory}
      />
      <PartnerProfileDrawer
        isOpen={isProfileDrawerOpen}
        onClose={() => setIsProfileDrawerOpen(false)}
        partnerUser={partnerUser}
        memories={memories}
        starredCount={starredCount}
        onStartVoiceCall={() => { setIsProfileDrawerOpen(false); startCall('voice'); }}
        onStartVideoCall={() => { setIsProfileDrawerOpen(false); startCall('video'); }}
      />
      <CallHistoryModal
        isOpen={isCallHistoryOpen}
        onClose={() => setIsCallHistoryOpen(false)}
        messages={messages}
        partnerUser={partnerUser}
        onStartCall={(type) => { setIsCallHistoryOpen(false); startCall(type); }}
      />
      <IncomingCallModal
        incomingCall={incomingCall}
        onAccept={acceptCall}
        onDecline={declineCall}
      />
      <ActiveCallOverlay
        isOpen={isCallActive || callRole === 'caller'}
        callType={callType}
        callRole={callRole}
        connectionState={connectionState}
        partnerUser={partnerUser}
        currentUser={currentUser}
        localStream={localStream}
        remoteStream={remoteStream}
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        isSpeakerOn={isSpeakerOn}
        supportsAudioOutputSelection={supportsAudioOutputSelection}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onSwitchCamera={switchCamera}
        onToggleScreenShare={toggleScreenShare}
        onToggleAudioOutput={toggleAudioOutput}
        onEndCall={() => {
          endCall();
          webrtcEndCall();
        }}
      />
      <ToastContainer />
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <UniverseProvider>
        <AmbientBackground />
        <AppContent />
      </UniverseProvider>
    </AuthProvider>
  );
}

export default App;
