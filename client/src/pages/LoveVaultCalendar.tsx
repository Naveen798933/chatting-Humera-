import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { VaultNote, CalendarEvent, SharedListItem, LoveMapPin } from '../types';
import { toast } from '../lib/toast';
import { 
  Lock, Calendar, CheckSquare, MapPin, Plus, 
  Key, Sparkles, BookOpen, Clock, Heart, Trash2, CheckCircle2, Mic, StopCircle, Play, Pause, Volume2, ShieldCheck, Eye, EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';
import confetti from 'canvas-confetti';

export const LoveVaultCalendar: React.FC = () => {
  const { currentUser, isVaultUnlocked, unlockVaultWithPin, lockVault } = useAuth();
  const { 
    vaultNotes, addVaultNote, deleteVaultNote,
    calendarEvents, addCalendarEvent,
    todoItems, addTodoItem, toggleTodoItem, deleteTodoItem,
    mapPins, addMapPin, deleteMapPin
  } = useUniverse();

  const [activeSection, setActiveSection] = useState<'calendar' | 'vault' | 'todos' | 'map'>('calendar');
  const [pinInput, setPinInput] = useState('');
  const [pinErr, setPinErr] = useState(false);

  // Form states
  const [newVaultTitle, setNewVaultTitle] = useState('');
  const [newVaultContent, setNewVaultContent] = useState('');
  const [newVaultFutureDate, setNewVaultFutureDate] = useState('');
  const [newVaultAudioData, setNewVaultAudioData] = useState<string | null>(null);

  // Audio recording state for vault notes
  const [isRecordingVaultAudio, setIsRecordingVaultAudio] = useState(false);
  const [vaultRecordingTime, setVaultRecordingTime] = useState(0);
  const vaultMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const vaultAudioChunksRef = useRef<Blob[]>([]);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const currentAudioElementRef = useRef<HTMLAudioElement | null>(null);

  const [newCalTitle, setNewCalTitle] = useState('');
  const [newCalDate, setNewCalDate] = useState('');
  const [newCalCategory, setNewCalCategory] = useState<CalendarEvent['category']>('date');

  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState<SharedListItem['category']>('bucket');

  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinLoc, setNewPinLoc] = useState('');

  // Audio Recording timer
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (isRecordingVaultAudio) {
      timer = setInterval(() => setVaultRecordingTime(p => p + 1), 1000);
    } else {
      setVaultRecordingTime(0);
    }
    return () => clearInterval(timer);
  }, [isRecordingVaultAudio]);

  const handleStartVaultAudioRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder.isTypeSupported === 'function') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }

      const recorder = new MediaRecorder(stream, options);
      vaultMediaRecorderRef.current = recorder;
      vaultAudioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) vaultAudioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const mime = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(vaultAudioChunksRef.current, { type: mime });
        const reader = new FileReader();
        reader.onloadend = () => {
          setNewVaultAudioData(reader.result as string);
          toast.love('Voice capsule recorded! 🎙️');
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecordingVaultAudio(true);
      toast.info('Recording voice letter...');
    } catch (err) {
      toast.error('Microphone access required for voice capsule');
    }
  };

  const handleStopVaultAudioRecording = () => {
    if (vaultMediaRecorderRef.current && isRecordingVaultAudio) {
      vaultMediaRecorderRef.current.stop();
      setIsRecordingVaultAudio(false);
    }
  };

  const handlePlayVoiceCapsule = (audioUrl: string, id: string) => {
    if (playingAudioId === id) {
      currentAudioElementRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (currentAudioElementRef.current) {
      currentAudioElementRef.current.pause();
    }

    const audio = new Audio(audioUrl);
    currentAudioElementRef.current = audio;
    setPlayingAudioId(id);
    audio.play();
    audio.onended = () => setPlayingAudioId(null);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockVaultWithPin(pinInput)) {
      setPinInput('');
      setPinErr(false);
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      toast.love('Vault unlocked! 🔑');
    } else {
      setPinErr(true);
      toast.error('Incorrect secret vault PIN 🔒');
    }
  };

  const handleCreateVaultNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultTitle.trim() && !newVaultContent.trim() && !newVaultAudioData) return;

    const fullContent = newVaultAudioData 
      ? `${newVaultContent.trim()}\n\n[VOICE_CAPSULE_DATA]${newVaultAudioData}[/VOICE_CAPSULE_DATA]`
      : newVaultContent.trim();

    addVaultNote({
      title: newVaultTitle.trim() || 'Untitled Letter',
      content: fullContent,
      unlockDate: newVaultFutureDate ? newVaultFutureDate : undefined,
      isLocked: Boolean(newVaultFutureDate),
      createdBy: currentUser?.uid || 'user_1'
    });

    toast.love('Vault letter & capsule saved! 🔒');
    setNewVaultTitle('');
    setNewVaultContent('');
    setNewVaultFutureDate('');
    setNewVaultAudioData(null);
  };

  const handleCreateCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalTitle.trim() || !newCalDate) return;

    addCalendarEvent({
      title: newCalTitle.trim(),
      date: newCalDate,
      category: newCalCategory,
      createdBy: currentUser?.uid || 'user_1'
    });

    toast.love('Calendar milestone added! 🗓️');
    setNewCalTitle('');
    setNewCalDate('');
  };

  const handleCreateTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoTitle.trim()) return;
    addTodoItem(newTodoTitle.trim(), newTodoCategory);
    toast.success('List item added!');
    setNewTodoTitle('');
  };

  const handleCreateMapPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPinTitle.trim() || !newPinLoc.trim()) return;
    addMapPin({
      title: newPinTitle.trim(),
      latitude: 17.3850,
      longitude: 78.4867,
      locationName: newPinLoc.trim(),
      isBucketList: true
    });
    toast.love('Love map destination added! 📍');
    setNewPinTitle('');
    setNewPinLoc('');
  };

  return (
    <div className="space-y-6 px-3 sm:px-6 pb-28 sm:pb-20 max-w-6xl mx-auto">
      
      {/* Navigation Pills */}
      <div className="glass-panel p-2.5 sm:p-3 rounded-3xl border border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveSection('calendar')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 min-h-[44px] ${
            activeSection === 'calendar'
              ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25 scale-105'
              : 'glass-card text-slate-300 hover:text-white active:scale-95'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Love Calendar</span>
        </button>

        <button
          onClick={() => setActiveSection('vault')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 min-h-[44px] ${
            activeSection === 'vault'
              ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25 scale-105'
              : 'glass-card text-slate-300 hover:text-white active:scale-95'
          }`}
        >
          <Lock className="w-4 h-4 text-pink-300" />
          <span>Locked Diary Vault</span>
        </button>

        <button
          onClick={() => setActiveSection('todos')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 min-h-[44px] ${
            activeSection === 'todos'
              ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25 scale-105'
              : 'glass-card text-slate-300 hover:text-white active:scale-95'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Shared Bucket Lists</span>
        </button>

        <button
          onClick={() => setActiveSection('map')}
          className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 min-h-[44px] ${
            activeSection === 'map'
              ? 'bg-gradient-to-r from-accent-pink to-accent-purple text-white shadow-lg shadow-pink-500/25 scale-105'
              : 'glass-card text-slate-300 hover:text-white active:scale-95'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Love Map</span>
        </button>
      </div>

      {/* SECTION 1: LOVE CALENDAR */}
      {activeSection === 'calendar' && (
        <div className="space-y-6">
          <div className="glass-panel p-6 sm:p-7 rounded-3xl border border-white/10">
            <h3 className="font-extrabold text-lg text-white mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent-pink" />
              <span>Upcoming Milestones &amp; Events</span>
            </h3>

            {/* Add Event Form */}
            <form onSubmit={handleCreateCalendarEvent} className="flex flex-col sm:grid sm:grid-cols-4 gap-3 my-4">
              <input
                type="text"
                value={newCalTitle}
                onChange={(e) => setNewCalTitle(e.target.value)}
                placeholder="Event name e.g. Maldives Getaway"
                className="w-full sm:col-span-2 px-4 py-2.5 rounded-xl glass-input text-xs"
                required
              />
              <input
                type="date"
                value={newCalDate}
                onChange={(e) => setNewCalDate(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white"
                required
              />
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-md min-h-[44px]"
              >
                Add Milestone
              </button>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              {calendarEvents.map((evt) => (
                <div key={evt.id} className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 uppercase">
                      {evt.category}
                    </span>
                    <h4 className="font-bold text-sm text-white mt-1">{evt.title}</h4>
                    <p className="text-xs text-slate-300">{evt.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-pink-300">{evt.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: LOCKED DIARY VAULT */}
      {activeSection === 'vault' && (
        <div className="space-y-6">
          {!isVaultUnlocked ? (
            <div className="glass-panel-glow p-8 rounded-3xl max-w-md mx-auto text-center border border-pink-400/40 space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-pink-500/20 flex items-center justify-center text-pink-300">
                <Key className="w-8 h-8 animate-pulse" />
              </div>
              <h3 className="text-xl font-extrabold text-white">Love Vault Locked</h3>
              <p className="text-xs text-slate-300">Enter your secret 4-digit PIN to access private letters and audio time capsules.</p>

              {pinErr && (
                <p className="text-xs text-rose-400 font-bold">Incorrect PIN. Please try again.</p>
              )}

              <form onSubmit={handleUnlock} className="space-y-4">
                <input
                  type="password"
                  maxLength={4}
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="****"
                  className="w-full text-center tracking-widest text-xl font-extrabold px-4 py-3 rounded-2xl glass-input"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-3 rounded-2xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-xl"
                >
                  Unlock Vault
                </button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-3xl border border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-accent-pink" />
                    <span>Unlocked Private Vault &amp; Voice Capsules</span>
                  </h3>
                  <p className="text-xs text-slate-300">Your protected love notes, time capsules, and future voice letters</p>
                </div>
                <button
                  onClick={lockVault}
                  className="px-4 py-2 rounded-xl glass-card text-xs font-bold text-slate-300 hover:text-white"
                >
                  Lock Vault
                </button>
              </div>

              {/* Write New Vault Note with Voice Capsule */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-pink-400" />
                  <span>Write Secret Letter or Voice Time Capsule</span>
                </h4>
                <form onSubmit={handleCreateVaultNote} className="space-y-3">
                  <input
                    type="text"
                    value={newVaultTitle}
                    onChange={(e) => setNewVaultTitle(e.target.value)}
                    placeholder="Letter Title e.g. Open on our 5th anniversary..."
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                  />
                  <textarea
                    value={newVaultContent}
                    onChange={(e) => setNewVaultContent(e.target.value)}
                    placeholder="Write your heartfelt message here..."
                    className="w-full px-4 py-3 rounded-xl glass-input text-xs h-28"
                  />

                  {/* Voice Capsule Recording Section */}
                  <div className="p-3 rounded-2xl glass-card border border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${isRecordingVaultAudio ? 'bg-rose-500 animate-pulse text-white' : 'bg-pink-500/20 text-pink-400'}`}>
                        <Mic className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white">
                          {isRecordingVaultAudio ? `Recording Voice Capsule (${vaultRecordingTime}s)...` : newVaultAudioData ? 'Voice Capsule Ready' : 'Add Audio Voice Letter'}
                        </p>
                        <p className="text-[10px] text-slate-400">Record a voice letter to lock in time</p>
                      </div>
                    </div>

                    {!isRecordingVaultAudio ? (
                      <button
                        type="button"
                        onClick={handleStartVaultAudioRecording}
                        className="px-3.5 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-xs font-bold border border-pink-500/30"
                      >
                        {newVaultAudioData ? 'Re-record Audio' : 'Record Audio'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleStopVaultAudioRecording}
                        className="px-3.5 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold shadow-md flex items-center gap-1"
                      >
                        <StopCircle className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <div className="flex-1 w-full">
                      <label className="block text-[10px] text-slate-400 font-semibold mb-1">Optional Future Unlock Date:</label>
                      <input
                        type="date"
                        value={newVaultFutureDate}
                        onChange={(e) => setNewVaultFutureDate(e.target.value)}
                        className="w-full px-4 py-2 rounded-xl bg-space-900 border border-white/10 text-xs text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full sm:w-auto py-3 px-8 rounded-xl bg-gradient-to-r from-accent-pink to-accent-purple text-white font-bold text-xs shadow-md self-end min-h-[44px]"
                    >
                      Save to Vault 💌
                    </button>
                  </div>
                </form>
              </div>

              {/* Note Cards with Wax Seal Animation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaultNotes.map((note) => {
                  const hasVoiceCapsule = note.content.includes('[VOICE_CAPSULE_DATA]');
                  let textDisplay = note.content;
                  let audioUrl: string | null = null;

                  if (hasVoiceCapsule) {
                    const match = note.content.match(/\[VOICE_CAPSULE_DATA\](.*?)\[\/VOICE_CAPSULE_DATA\]/s);
                    if (match && match[1]) {
                      audioUrl = match[1];
                      textDisplay = note.content.replace(/\[VOICE_CAPSULE_DATA\].*?\[\/VOICE_CAPSULE_DATA\]/s, '').trim();
                    }
                  }

                  const isFutureLocked = note.unlockDate && new Date(note.unlockDate).getTime() > Date.now();

                  return (
                    <div key={note.id} className="glass-card p-6 rounded-3xl border border-white/10 space-y-3 relative overflow-hidden group">
                      {/* Wax Seal Badge for Future Locked Notes */}
                      {isFutureLocked ? (
                        <div className="text-center py-4 space-y-2">
                          <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-tr from-rose-600 to-amber-600 p-0.5 shadow-xl shadow-rose-600/40 flex items-center justify-center animate-pulse">
                            <Lock className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-extrabold text-sm text-pink-200">{note.title}</h4>
                          <p className="text-xs text-amber-300 font-bold flex items-center justify-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Locked until {note.unlockDate}</span>
                          </p>
                          <p className="text-[10px] text-slate-400 italic">This time capsule is sealed by wax until the special milestone date!</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="w-4 h-4 text-emerald-400" />
                              <h4 className="font-bold text-sm text-pink-200">{note.title}</h4>
                            </div>
                            <button onClick={() => deleteVaultNote(note.id)} className="text-slate-400 hover:text-rose-400 p-1">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          {textDisplay && (
                            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                              {textDisplay}
                            </p>
                          )}

                          {audioUrl && (
                            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 text-xs font-bold text-pink-300">
                                <Volume2 className="w-4 h-4" />
                                <span>Voice Letter Capsule</span>
                              </div>
                              <button
                                onClick={() => handlePlayVoiceCapsule(audioUrl!, note.id)}
                                className="px-3 py-1.5 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-md flex items-center gap-1"
                              >
                                {playingAudioId === note.id ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                                <span>{playingAudioId === note.id ? 'Pause' : 'Play'}</span>
                              </button>
                            </div>
                          )}

                          <p className="text-[9px] text-slate-500 text-right">
                            Created: {new Date(note.createdAt).toLocaleDateString()}
                          </p>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* SECTION 3: SHARED BUCKET LISTS */}
      {activeSection === 'todos' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
          <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-accent-purple" />
            <span>Shared Bucket Lists &amp; Wishlist</span>
          </h3>

          <form onSubmit={handleCreateTodo} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="Add bucket list item e.g. Hot air balloon ride in Cappadocia..."
              className="flex-1 min-w-0 px-4 py-2.5 rounded-xl glass-input text-xs"
              required
            />
            <div className="flex gap-2">
              <select
                value={newTodoCategory}
                onChange={(e) => setNewTodoCategory(e.target.value as any)}
                className="flex-1 sm:flex-none px-3 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white min-h-[44px]"
              >
                <option value="bucket">Bucket List</option>
                <option value="movies">Movies</option>
                <option value="travel">Travel</option>
                <option value="foods">Foods</option>
                <option value="wishlist">Wishlist</option>
              </select>
              <button type="submit" className="px-4 sm:px-5 py-2.5 rounded-xl bg-accent-purple text-white font-bold text-xs min-h-[44px] whitespace-nowrap">
                Add Item
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {todoItems.map((todo) => (
              <div
                key={todo.id}
                onClick={() => toggleTodoItem(todo.id)}
                className={`p-4 rounded-2xl glass-card border border-white/10 flex items-center justify-between cursor-pointer transition-all ${
                  todo.completed ? 'opacity-50 line-through bg-white/5' : 'hover:border-pink-400/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center ${todo.completed ? 'bg-emerald-500 border-emerald-500' : 'border-white/30'}`}>
                    {todo.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs text-white">{todo.title}</p>
                    <span className="text-[9px] uppercase font-bold text-purple-300">{todo.category}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); deleteTodoItem(todo.id); }}
                  className="text-slate-400 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: LOVE MAP */}
      {activeSection === 'map' && (
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
              <MapPin className="w-5 h-5 text-accent-pink" />
              <span>Interactive Love Map &amp; Destinations</span>
            </h3>
            <span className="text-xs font-bold text-pink-300 bg-pink-500/20 px-3 py-1 rounded-full border border-pink-500/30">
              0 km apart in heart ❤️
            </span>
          </div>

          {/* Interactive World / Couple Map Visual Canvas Overlay */}
          <div className="relative w-full h-64 sm:h-80 rounded-3xl overflow-hidden glass-card border border-pink-500/30 bg-space-950 p-4 flex flex-col justify-between">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,112,166,0.15)_0%,transparent_70%)] pointer-events-none" />
            
            {/* Grid Pattern */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

            <div className="relative z-10 flex items-center justify-between text-xs text-slate-300 font-bold">
              <span className="flex items-center gap-1.5"><Sparkles className="w-4 h-4 text-pink-400" /> Couple Radar Map</span>
              <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Live Connected</span>
            </div>

            {/* Simulated Couple Map Pins */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 gap-3 my-auto">
              <div className="p-3 rounded-2xl glass-panel-glow border border-pink-500/40 text-center space-y-1 transform hover:scale-105 transition-transform">
                <span className="text-xl">🏙️</span>
                <p className="font-extrabold text-xs text-white">Naveen's Base</p>
                <p className="text-[10px] text-pink-300">Vijayawada, AP</p>
              </div>

              <div className="p-3 rounded-2xl glass-panel-glow border border-purple-500/40 text-center space-y-1 transform hover:scale-105 transition-transform">
                <span className="text-xl">🌆</span>
                <p className="font-extrabold text-xs text-white">Humera's Base</p>
                <p className="text-[10px] text-purple-300">Medchal, TS</p>
              </div>

              <div className="p-3 rounded-2xl glass-panel-glow border border-amber-500/40 text-center space-y-1 transform hover:scale-105 transition-transform col-span-2 sm:col-span-1">
                <span className="text-xl">🗼</span>
                <p className="font-extrabold text-xs text-white">Honeymoon Wish</p>
                <p className="text-[10px] text-amber-300">Paris, France</p>
              </div>
            </div>

            <div className="relative z-10 text-center">
              <p className="text-[10px] text-slate-400 italic">"Distance is just a test to see how far love can travel."</p>
            </div>
          </div>

          {/* Quick Dream Destination Presets */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-300">Quick Add Dream Destinations:</label>
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1">
              {[
                { title: 'Maldives Overwater Villa', loc: 'Maldives', emoji: '🏝️' },
                { title: 'Eiffel Tower Sunset', loc: 'Paris, France', emoji: '🗼' },
                { title: 'Bali Beach Resort', loc: 'Bali, Indonesia', emoji: '🌺' },
                { title: 'Rome Colosseum Walk', loc: 'Rome, Italy', emoji: '🏛️' },
                { title: 'Swiss Alps Cabin', loc: 'Interlaken, Switzerland', emoji: '🏔️' },
                { title: 'Tokyo Cherry Blossoms', loc: 'Tokyo, Japan', emoji: '🌸' },
              ].map(preset => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => {
                    addMapPin({
                      title: `${preset.emoji} ${preset.title}`,
                      latitude: 0,
                      longitude: 0,
                      locationName: preset.loc,
                      isBucketList: true
                    });
                    toast.love(`Added ${preset.title} to map! 📍`);
                  }}
                  className="px-3 py-1.5 rounded-xl glass-card border border-pink-500/20 text-pink-300 text-[10px] font-bold shrink-0 hover:bg-pink-500/10 flex items-center gap-1 min-h-[36px]"
                >
                  <span>{preset.emoji}</span>
                  <span>{preset.loc}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleCreateMapPin} className="flex flex-col sm:grid sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newPinTitle}
              onChange={(e) => setNewPinTitle(e.target.value)}
              placeholder="Pin title e.g. Eiffel Tower"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
              required
            />
            <input
              type="text"
              value={newPinLoc}
              onChange={(e) => setNewPinLoc(e.target.value)}
              placeholder="Location e.g. Paris, France"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
              required
            />
            <button type="submit" className="w-full py-2.5 rounded-xl bg-accent-pink text-white font-bold text-xs min-h-[44px]">
              Pin Location
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mapPins.map((pin) => (
              <div key={pin.id} className="glass-card p-5 rounded-2xl border border-white/10 space-y-2 relative group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-pink-300">
                    <MapPin className="w-4 h-4" />
                    <h4 className="font-bold text-xs text-white">{pin.title}</h4>
                  </div>
                  <button
                    onClick={() => { deleteMapPin(pin.id); toast.info('Map pin removed'); }}
                    className="text-slate-400 hover:text-rose-400 p-1 rounded-lg"
                    title="Delete Map Pin"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-300">{pin.locationName}</p>
                {pin.isBucketList && (
                  <span className="inline-block px-2 py-0.5 rounded text-[9px] font-bold bg-purple-500/20 text-purple-300">
                    Dream Wishlist
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
