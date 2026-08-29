import React, { useState, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UniverseProvider, useUniverse } from './context/UniverseContext';
import { AmbientBackground } from './components/AmbientBackground';
import { ScreenshotBanner } from './components/ScreenshotBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { IncomingCallModal } from './components/IncomingCallModal';
import { ActiveCallOverlay } from './components/ActiveCallOverlay';
import { useWebRTC } from './hooks/useWebRTC';
import { Navigation, TabType } from './components/Navigation';
import { AuthPage } from './pages/AuthPage';

// Lazy-loaded pages for code splitting
const HomeDashboard = lazy(() => import('./pages/HomeDashboard').then(m => ({ default: m.HomeDashboard })));
const CoreChat      = lazy(() => import('./pages/CoreChat').then(m => ({ default: m.CoreChat })));
const MemoriesGallery = lazy(() => import('./pages/MemoriesGallery').then(m => ({ default: m.MemoriesGallery })));
const LoveVaultCalendar = lazy(() => import('./pages/LoveVaultCalendar').then(m => ({ default: m.LoveVaultCalendar })));
const TogetherTime  = lazy(() => import('./pages/TogetherTime').then(m => ({ default: m.TogetherTime })));
import { DecoyCalculator } from './components/DecoyCalculator';
import { ToastContainer } from './components/Toast';
import { WhatsAppStatusModal } from './components/WhatsAppStatusModal';
import { StoryItem } from './types';
import { PartnerProfileDrawer } from './components/PartnerProfileDrawer';
import { toast } from './lib/toast';
import { ThemeSelectorModal, AppTheme } from './components/ThemeSelectorModal';
import { PrivacyShieldOverlay } from './components/PrivacyShieldOverlay';
import { UserSearchModal } from './components/UserSearchModal';
import { FriendsDrawer } from './components/FriendsDrawer';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { PrivacySettingsModal } from './components/PrivacySettingsModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CreateGroupModal } from './components/CreateGroupModal';
import { supabase, isSupabaseConfigured } from './lib/supabase';

const AppContent: React.FC = () => {
  const { currentUser, partnerUser, isAuthenticated, isDecoyActive, toggleDecoyMode } = useAuth();
  const { isCallActive, callType, callRole, incomingCall, acceptCall, declineCall, endCall, startCall, messages, memories } = useUniverse();
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isStatusOpen, setIsStatusOpen] = useState(false);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Multi-user platform modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  const [currentTheme, setCurrentTheme] = useState<AppTheme>(() => {
    return (localStorage.getItem('ou_theme') as AppTheme) || 'cosmic';
  });

  // Sync theme to document dataset & localStorage
  React.useEffect(() => {
    document.documentElement.dataset.theme = currentTheme;
    try { localStorage.setItem('ou_theme', currentTheme); } catch (_) {}
  }, [currentTheme]);

  // Global Escape & Panic Shortcut listener
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.altKey && e.key.toLowerCase() === 'l') || (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'l')) {
        e.preventDefault();
        toast.info('Emergency Stealth mode activated!');
        toggleDecoyMode();
        return;
      }

      if (e.key === 'Escape') {
        if (isThemeOpen) { setIsThemeOpen(false); return; }
        if (isStatusOpen) { setIsStatusOpen(false); return; }
        if (isProfileDrawerOpen) { setIsProfileDrawerOpen(false); return; }
        if (isSearchOpen) { setIsSearchOpen(false); return; }
        if (isFriendsOpen) { setIsFriendsOpen(false); return; }
        if (isNotificationsOpen) { setIsNotificationsOpen(false); return; }
        if (isPrivacyOpen) { setIsPrivacyOpen(false); return; }
        if (isProfileOpen) { setIsProfileOpen(false); return; }
        if (isCreateGroupOpen) { setIsCreateGroupOpen(false); return; }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isThemeOpen, isStatusOpen, isProfileDrawerOpen,
    isSearchOpen, isFriendsOpen, isNotificationsOpen,
    isPrivacyOpen, isProfileOpen, isCreateGroupOpen, toggleDecoyMode
  ]);

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
      const callRoomId = [currentUser?.uid || 'u1', partnerUser?.uid || 'u2'].sort().join('_');
      initializeCall(callType === 'video', callRole, callRoomId);
    } else if (!isCallActive && !callRole) {
      webrtcEndCall();
    }
  }, [isCallActive, callType, callRole, currentUser?.uid, partnerUser?.uid]);

  if (isDecoyActive) {
    return <DecoyCalculator onUnlockRealApp={toggleDecoyMode} />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const starredCount = messages.filter(m => m.isStarred).length;

  return (
    <div className="min-h-screen h-full flex flex-col relative z-10">
      {/* App Switcher Multitasking Privacy Mask Shield */}
      <PrivacyShieldOverlay />
      <ScreenshotBanner />
      <PWAInstallPrompt />
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenStatus={() => setIsStatusOpen(true)}
        onOpenTheme={() => setIsThemeOpen(true)}
        onOpenPartnerProfile={() => setIsProfileDrawerOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenPrivacy={() => setIsPrivacyOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Multi-User Modals */}
      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUserForChat={() => setActiveTab('chat')}
      />
      <FriendsDrawer
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onStartChat={() => setActiveTab('chat')}
        onStartGame={() => setActiveTab('together')}
      />
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectChat={() => setActiveTab('chat')}
        onOpenGames={() => setActiveTab('together')}
        onOpenFriends={() => setIsFriendsOpen(true)}
      />
      <PrivacySettingsModal
        isOpen={isPrivacyOpen}
        onClose={() => setIsPrivacyOpen(false)}
      />
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={() => setActiveTab('chat')}
      />

      {/* Page content with Suspense fallback */}
      <Suspense fallback={
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-pink-500/30 border-t-pink-500 animate-spin" />
            <p className="text-xs text-slate-400 animate-pulse">Loading...</p>
          </div>
        </div>
      }>
        <main className={`flex-1 w-full overflow-x-hidden min-h-0 ${
          activeTab === 'chat'
            ? 'max-w-7xl mx-auto px-0 sm:px-4 md:px-8 pt-0 sm:pt-4 md:pt-6 pb-0 md:pb-6 flex flex-col overflow-hidden'
            : 'max-w-7xl mx-auto px-2.5 sm:px-6 md:px-8 pt-3 sm:pt-6 pb-28 md:pb-10 overflow-y-auto'
        }`}>
          {activeTab === 'home'     && <HomeDashboard />}
          {activeTab === 'chat'     && <CoreChat onBackToHome={() => setActiveTab('home')} />}
          {activeTab === 'together' && <TogetherTime />}
          {activeTab === 'memories' && <MemoriesGallery />}
          {activeTab === 'vault'    && <LoveVaultCalendar />}
        </main>
      </Suspense>

      <ThemeSelectorModal
        isOpen={isThemeOpen}
        onClose={() => setIsThemeOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={(t) => { setCurrentTheme(t); setIsThemeOpen(false); }}
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
