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

import { WhatsAppStatusModal, StoryItem } from './components/WhatsAppStatusModal';
import { PartnerProfileDrawer } from './components/PartnerProfileDrawer';
import { CallHistoryModal } from './components/CallHistoryModal';
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
  const [currentTheme, setCurrentTheme] = useState<AppTheme>('cosmic');

  const [stories, setStories] = useState<StoryItem[]>([
    {
      id: 'story_seed_1',
      authorId: partnerUser?.uid || 'humera_uid_140299',
      authorName: partnerUser?.petName || 'Humera',
      authorPhoto: partnerUser?.photoURL || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      text: 'Stargazing tonight thinking of you Bangaram! 💕',
      bgGradient: 'from-pink-600 to-purple-800',
      createdAt: new Date().toISOString()
    }
  ]);

  const {
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    isScreenSharing,
    initializeCall,
    toggleMic,
    toggleCamera,
    switchCamera,
    toggleScreenShare,
    endCall: webrtcEndCall
  } = useWebRTC();

  React.useEffect(() => {
    if (isCallActive && callType && callRole) {
      initializeCall(callType === 'video', callRole);
    } else {
      webrtcEndCall();
    }
  }, [isCallActive, callType, callRole]);

  if (isDecoyActive) {
    return <DecoyCalculator onUnlockRealApp={toggleDecoyMode} />;
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  const starredCount = messages.filter(m => m.isStarred).length;

  return (
    <div className="min-h-screen flex flex-col relative z-10">
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

      <main className={`flex-1 max-w-7xl mx-auto w-full overflow-x-hidden ${
        activeTab === 'chat'
          ? 'px-1 sm:px-4 md:px-8 pt-2 sm:pt-4 md:pt-6 pb-16 md:pb-6'
          : 'px-2.5 sm:px-6 md:px-8 pt-3 sm:pt-6 pb-28 md:pb-10'
      }`}>
        {activeTab === 'home' && <HomeDashboard />}
        {activeTab === 'chat' && <CoreChat />}
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
        onAddStory={(st) => setStories(p => [ { ...st, id: `story_${Date.now()}`, createdAt: new Date().toISOString() }, ...p ])}
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
        isOpen={isCallActive}
        callType={callType}
        partnerUser={partnerUser}
        currentUser={currentUser}
        localStream={localStream}
        remoteStream={remoteStream}
        isMicMuted={isMicMuted}
        isCameraOff={isCameraOff}
        isScreenSharing={isScreenSharing}
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
        onSwitchCamera={switchCamera}
        onToggleScreenShare={toggleScreenShare}
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
