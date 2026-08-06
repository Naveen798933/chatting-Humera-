import React, { useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { AmbientEffect } from '../types';
import { 
  ShieldCheck, Download, Upload, HardDrive, Sparkles, X, 
  UserCheck, Heart, LogOut, Check, EyeOff, Lock 
} from 'lucide-react';
import { motion } from './motion';

interface AdminBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminBackupModal: React.FC<AdminBackupModalProps> = ({ isOpen, onClose }) => {
  const { currentUser, partnerUser, logout, updatePetName, toggleDecoyMode } = useAuth();
  const { 
    messages, memories, vaultNotes, calendarEvents, 
    todoItems, mapPins, ambientEffect, setAmbientEffect, importDatabaseBackup 
  } = useUniverse();

  const [newPetName, setNewPetName] = useState(currentUser?.petName || '');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleExportDatabaseJSON = () => {
    const archiveData = {
      universe: 'Our Universe — Naveen & Humera Private Space',
      exportDate: new Date().toISOString(),
      owner: currentUser,
      partner: partnerUser,
      messages,
      memories,
      vaultNotes,
      calendarEvents,
      todoItems,
      mapPins
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(archiveData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `OurUniverse_FullBackup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (importDatabaseBackup(content)) {
          setImportSuccess('Database backup imported successfully!');
          setTimeout(() => setImportSuccess(null), 4000);
        } else {
          setImportSuccess('Invalid JSON backup file structure.');
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSavePetName = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPetName.trim()) {
      updatePetName(newPetName.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  const particleModes: { id: AmbientEffect; label: string; icon: string }[] = [
    { id: 'hearts', label: 'Floating Hearts', icon: '❤️' },
    { id: 'stars', label: 'Twinkling Stars', icon: '✨' },
    { id: 'galaxy', label: 'Deep Galaxy', icon: '🌌' },
    { id: 'rain', label: 'Soft Rain', icon: '🌧️' },
    { id: 'snow', label: 'Soft Snow', icon: '❄️' },
    { id: 'none', label: 'Disabled', icon: '🚫' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <motion.div className="glass-panel-glow p-6 sm:p-8 rounded-3xl max-w-lg w-full border border-pink-400/40 space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Owner Admin & Universe Settings</h3>
              <p className="text-[10px] text-pink-300 font-medium">Controlled exclusively by {currentUser?.realName}</p>
            </div>
          </div>

          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pet Name Customizer */}
        <div className="glass-card p-4 rounded-2xl space-y-2 border border-white/10">
          <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-accent-pink" />
            <span>Customize Display Pet Name</span>
          </h4>
          <form onSubmit={handleSavePetName} className="flex gap-2">
            <input
              type="text"
              value={newPetName}
              onChange={(e) => setNewPetName(e.target.value)}
              placeholder="e.g. Bangaram ❤️"
              className="flex-1 px-3 py-2 rounded-xl glass-input text-xs"
            />
            <button type="submit" className="px-4 py-2 rounded-xl bg-accent-pink text-white font-bold text-xs">
              Save
            </button>
          </form>
          {saveSuccess && <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1"><Check className="w-3 h-3"/> Pet name updated!</p>}
        </div>

        {/* Stealth Decoy Toggle */}
        <div className="glass-card p-4 rounded-2xl border border-white/10 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
              <EyeOff className="w-4 h-4 text-amber-400" />
              <span>Decoy Calculator Stealth Mode</span>
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5">Switch interface into a working calculator screen</p>
          </div>
          <button
            onClick={() => { onClose(); toggleDecoyMode(); }}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500 hover:text-white transition-all"
          >
            Activate Stealth
          </button>
        </div>

        {/* Ambient Particle Mode Selector */}
        <div className="glass-card p-4 rounded-2xl space-y-2 border border-white/10">
          <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>Ambient Background Particle Mode</span>
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {particleModes.map((pm) => (
              <button
                key={pm.id}
                onClick={() => setAmbientEffect(pm.id)}
                className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                  ambientEffect === pm.id
                    ? 'bg-accent-purple text-white shadow-md scale-105'
                    : 'glass-card text-slate-300 hover:text-white'
                }`}
              >
                <span>{pm.icon}</span>
                <span className="text-[10px]">{pm.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Backup & Restore Database */}
        <div className="glass-card p-4 rounded-2xl space-y-3 border border-white/10">
          <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-teal-400" />
            <span>Data Storage & Database Backup/Restore</span>
          </h4>
          <div className="text-[10px] text-slate-300 space-y-1">
            <p>• Encrypted Messages: <strong>{messages.length}</strong> items</p>
            <p>• Stored Memories: <strong>{memories.length}</strong> items</p>
            <p>• Vault Notes: <strong>{vaultNotes.length}</strong> items</p>
          </div>

          {importSuccess && (
            <p className="text-xs text-emerald-400 font-semibold">{importSuccess}</p>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleExportDatabaseJSON}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-600 text-white font-bold text-xs shadow-lg flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON Archive</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleRestoreFile}
              accept=".json"
              style={{ display: 'none' }}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 py-2.5 rounded-xl glass-card border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4" />
              <span>Restore JSON Backup</span>
            </button>
          </div>
        </div>

        {/* Logout */}
        <div className="pt-2 border-t border-white/10 flex justify-between items-center">
          <span className="text-xs text-slate-400">Authenticated UID: {currentUser?.uid}</span>
          <button
            onClick={logout}
            className="px-4 py-2 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-2 hover:bg-rose-500 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
