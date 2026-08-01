import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { UniverseProvider } from './context/UniverseContext';
import { AmbientBackground } from './components/AmbientBackground';
import { ScreenshotBanner } from './components/ScreenshotBanner';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { AnniversaryOverlay } from './components/AnniversaryOverlay';
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

const AppContent: React.FC = () => {
  const { isAuthenticated, isDecoyActive, toggleDecoyMode } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isAdminOpen, setIsAdminOpen] = useState(false);

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

      <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl mx-auto w-full">
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
