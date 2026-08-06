import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUniverse } from '../context/UniverseContext';
import { VaultNote, CalendarEvent, SharedListItem, LoveMapPin } from '../types';
import { toast } from '../lib/toast';
import { 
  Lock, Calendar, CheckSquare, MapPin, Plus, 
  Key, Sparkles, BookOpen, Clock, Heart, Trash2, CheckCircle2 
} from 'lucide-react';
import { motion, AnimatePresence } from '../components/motion';

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

  const [newCalTitle, setNewCalTitle] = useState('');
  const [newCalDate, setNewCalDate] = useState('');
  const [newCalCategory, setNewCalCategory] = useState<CalendarEvent['category']>('date');

  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [newTodoCategory, setNewTodoCategory] = useState<SharedListItem['category']>('bucket');

  const [newPinTitle, setNewPinTitle] = useState('');
  const [newPinLoc, setNewPinLoc] = useState('');

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (unlockVaultWithPin(pinInput)) {
      setPinInput('');
      setPinErr(false);
      toast.love('Vault unlocked! 🔑');
    } else {
      setPinErr(true);
      toast.error('Incorrect secret vault PIN 🔒');
    }
  };

  const handleCreateVaultNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVaultTitle.trim() || !newVaultContent.trim()) return;

    addVaultNote({
      title: newVaultTitle.trim(),
      content: newVaultContent.trim(),
      unlockDate: newVaultFutureDate ? newVaultFutureDate : undefined,
      isLocked: Boolean(newVaultFutureDate),
      createdBy: currentUser?.uid ?? 'naveen_uid_798933'
    });

    toast.love('Vault note locked & saved! 🔒');
    setNewVaultTitle('');
    setNewVaultContent('');
    setNewVaultFutureDate('');
  };

  const handleCreateCalendarEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCalTitle.trim() || !newCalDate) return;

    addCalendarEvent({
      title: newCalTitle.trim(),
      date: newCalDate,
      category: newCalCategory,
      createdBy: currentUser?.uid ?? 'naveen_uid_798933'
    });

    toast.love('Calendar event added! 🗓️');
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
    toast.love('Love map pin added! 📍');
    setNewPinTitle('');
    setNewPinLoc('');
  };

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      
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
          <div className="glass-panel p-6 rounded-3xl border border-white/10">
            <h3 className="font-extrabold text-lg text-white mb-2 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent-pink" />
              <span>Upcoming Milestones & Events</span>
            </h3>

            {/* Add Event Form */}
            <form onSubmit={handleCreateCalendarEvent} className="grid grid-cols-1 sm:grid-cols-4 gap-3 my-4">
              <input
                type="text"
                value={newCalTitle}
                onChange={(e) => setNewCalTitle(e.target.value)}
                placeholder="Event name e.g. Maldives Trip"
                className="sm:col-span-2 px-4 py-2.5 rounded-xl glass-input text-xs"
                required
              />
              <input
                type="date"
                value={newCalDate}
                onChange={(e) => setNewCalDate(e.target.value)}
                className="px-4 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white"
                required
              />
              <button
                type="submit"
                className="py-2.5 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-md"
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
              <p className="text-xs text-slate-300">Enter your secret 4-digit PIN to access private letters.</p>

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
                    <span>Unlocked Private Vault & Letters</span>
                  </h3>
                  <p className="text-xs text-slate-300">Your protected love notes and future messages</p>
                </div>
                <button
                  onClick={lockVault}
                  className="px-4 py-2 rounded-xl glass-card text-xs font-bold text-slate-300 hover:text-white"
                >
                  Lock Vault
                </button>
              </div>

              {/* Write New Vault Note */}
              <div className="glass-panel p-6 rounded-3xl border border-white/10">
                <h4 className="font-bold text-sm text-white mb-3">Write Secret Letter or Future Note</h4>
                <form onSubmit={handleCreateVaultNote} className="space-y-3">
                  <input
                    type="text"
                    value={newVaultTitle}
                    onChange={(e) => setNewVaultTitle(e.target.value)}
                    placeholder="Letter Title e.g. Open on our 3rd anniversary..."
                    className="w-full px-4 py-2.5 rounded-xl glass-input text-xs"
                    required
                  />
                  <textarea
                    value={newVaultContent}
                    onChange={(e) => setNewVaultContent(e.target.value)}
                    placeholder="Write your heart out here..."
                    className="w-full px-4 py-3 rounded-xl glass-input text-xs h-28"
                    required
                  />
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
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
                      className="py-3 px-6 rounded-xl bg-accent-pink text-white font-bold text-xs shadow-md self-end"
                    >
                      Save Letter
                    </button>
                  </div>
                </form>
              </div>

              {/* Note Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {vaultNotes.map((note) => (
                  <div key={note.id} className="glass-card p-6 rounded-3xl border border-white/10 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-sm text-pink-200">{note.title}</h4>
                      <button onClick={() => deleteVaultNote(note.id)} className="text-slate-400 hover:text-rose-400">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {note.content}
                    </p>

                    {note.unlockDate && (
                      <p className="text-[10px] font-bold text-amber-300 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Future Lock Date: {note.unlockDate}</span>
                      </p>
                    )}
                  </div>
                ))}
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
            <span>Shared Bucket Lists & Wishlist</span>
          </h3>

          <form onSubmit={handleCreateTodo} className="flex gap-2">
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="Add bucket list item e.g. Hot air balloon in Turkey"
              className="flex-1 px-4 py-2.5 rounded-xl glass-input text-xs"
              required
            />
            <select
              value={newTodoCategory}
              onChange={(e) => setNewTodoCategory(e.target.value as any)}
              className="px-4 py-2.5 rounded-xl bg-space-900 border border-white/10 text-xs text-white"
            >
              <option value="bucket">Bucket List</option>
              <option value="movies">Movies</option>
              <option value="travel">Travel</option>
              <option value="foods">Foods</option>
            </select>
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-accent-purple text-white font-bold text-xs">
              Add Item
            </button>
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
          <h3 className="font-extrabold text-lg text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-accent-pink" />
            <span>Love Map & Visited Destinations</span>
          </h3>

          <form onSubmit={handleCreateMapPin} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newPinTitle}
              onChange={(e) => setNewPinTitle(e.target.value)}
              placeholder="Pin title e.g. Eiffel Tower"
              className="px-4 py-2.5 rounded-xl glass-input text-xs"
              required
            />
            <input
              type="text"
              value={newPinLoc}
              onChange={(e) => setNewPinLoc(e.target.value)}
              placeholder="Location e.g. Paris, France"
              className="px-4 py-2.5 rounded-xl glass-input text-xs"
              required
            />
            <button type="submit" className="py-2.5 rounded-xl bg-accent-pink text-white font-bold text-xs">
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
