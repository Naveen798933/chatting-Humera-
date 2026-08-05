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

const AppContent: React.FC = () => {
  const { currentUser, partnerUser, isAuthenticated, isDecoyActive, toggleDecoyMode } = useAuth();
  const { isCallActive, callType, callRole, incomingCall, acceptCall, declineCall, endCall } = useUniverse();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const {
    localStream,
    remoteStream,
    isMicMuted,
    isCameraOff,
    initializeCall,
    toggleMic,
    toggleCamera,
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

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      <ScreenshotBanner />
      <PWAInstallPrompt />
      <AnniversaryOverlay />
      <Navigation
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      <main className={`flex-1 px-2.5 sm:px-6 md:px-8 pt-3 sm:pt-6 max-w-7xl mx-auto w-full overflow-x-hidden ${activeTab === 'chat' ? 'pb-20 md:pb-6' : 'pb-28 md:pb-10'}`}>
        {activeTab === 'home' && <HomeDashboard />}
        {activeTab === 'chat' && <CoreChat />}
        {activeTab === 'memories' && <MemoriesGallery />}
        {activeTab === 'vault' && <LoveVaultCalendar />}
        {activeTab === 'together' && <TogetherTime />}
        {activeTab === 'ai' && <LoveAIAssistant />}
      </main>

      <AdminBackupModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
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
        onToggleMic={toggleMic}
        onToggleCamera={toggleCamera}
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
