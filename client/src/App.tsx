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
import { PartnerProfileDrawer } from './components/PartnerProfileDrawer';
import { toast } from './lib/toast';
import { ThemeSelectorModal, AppTheme } from './components/ThemeSelectorModal';
import { PrivacyShieldOverlay } from './components/PrivacyShieldOverlay';
import { UserSearchModal } from './components/UserSearchModal';
import { FriendsDrawer } from './components/FriendsDrawer';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { UserProfileModal } from './components/UserProfileModal';
import { CreateGroupModal } from './components/CreateGroupModal';

const AppContent: React.FC = () => {
  const { currentUser, partnerUser, isAuthenticated, isDecoyActive, toggleDecoyMode } = useAuth();
  const {
    isCallActive, callType, callRole, incomingCall,
    acceptCall, declineCall, endCall, startCall,
    messages, memories, startDirectChatWithUser, setActiveChatId
  } = useUniverse();
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  // Multi-user platform modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFriendsOpen, setIsFriendsOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
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
        if (isProfileDrawerOpen) { setIsProfileDrawerOpen(false); return; }
        if (isSearchOpen) { setIsSearchOpen(false); return; }
        if (isFriendsOpen) { setIsFriendsOpen(false); return; }
        if (isNotificationsOpen) { setIsNotificationsOpen(false); return; }
        if (isProfileOpen) { setIsProfileOpen(false); return; }
        if (isCreateGroupOpen) { setIsCreateGroupOpen(false); return; }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isThemeOpen, isProfileDrawerOpen,
    isSearchOpen, isFriendsOpen, isNotificationsOpen,
    isProfileOpen, isCreateGroupOpen, toggleDecoyMode
  ]);

  // WebRTC Audio/Video setup
  const {
    localStream, remoteStream,
    connectionState, isMicMuted, isCameraOff,
    isScreenSharing, isSpeakerOn, supportsAudioOutputSelection,
    initializeCall, toggleMic, toggleCamera, switchCamera,
    toggleScreenShare, toggleAudioOutput, endCall: webrtcEndCall
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
    <div className={`h-[100dvh] max-h-[100dvh] flex flex-col relative z-10 ${activeTab === 'chat' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
      {/* App Switcher Multitasking Privacy Mask Shield */}
      <PrivacyShieldOverlay />
      <ScreenshotBanner />
      <PWAInstallPrompt />
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenTheme={() => setIsThemeOpen(true)}
        onOpenPartnerProfile={() => setIsProfileDrawerOpen(true)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenFriends={() => setIsFriendsOpen(true)}
        onOpenNotifications={() => setIsNotificationsOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
      />

      {/* Multi-User Modals */}
      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectUserForChat={(user) => {
          if (user) startDirectChatWithUser(user);
          setActiveTab('chat');
        }}
      />
      <FriendsDrawer
        isOpen={isFriendsOpen}
        onClose={() => setIsFriendsOpen(false)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onStartChat={(friend) => {
          if (friend) startDirectChatWithUser(friend);
          setActiveTab('chat');
        }}
        onStartGame={() => setActiveTab('together')}
      />
      <NotificationCenterModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        onSelectChat={(chatId) => {
          if (chatId) setActiveChatId(chatId);
          setActiveTab('chat');
        }}
        onOpenGames={() => setActiveTab('together')}
        onOpenFriends={() => setIsFriendsOpen(true)}
      />
      <UserProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentTheme={currentTheme}
        onSelectTheme={(t) => setCurrentTheme(t)}
      />
      <CreateGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
        onGroupCreated={(groupId) => {
          if (groupId) setActiveChatId(groupId);
          setActiveTab('chat');
        }}
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
        <main className={`flex-1 w-full min-h-0 flex flex-col ${
          activeTab === 'chat'
            ? 'max-w-7xl mx-auto px-0 sm:px-4 md:px-8 pt-0 sm:pt-2 md:pt-4 pb-[72px] md:pb-4 overflow-hidden h-full'
            : 'max-w-7xl mx-auto px-2 xs:px-3 sm:px-6 md:px-8 pt-2.5 sm:pt-6 pb-mobile-safe md:pb-10 overflow-y-auto'
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
        onEndCall={endCall}
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
