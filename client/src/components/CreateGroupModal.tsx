import React, { useState } from 'react';
import { Users, Plus, Check, X, Image, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from './motion';
import { useUniverse } from '../context/UniverseContext';
import { toast } from '../lib/toast';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGroupCreated?: (groupId: string) => void;
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onGroupCreated
}) => {
  const { friends, createGroupChat } = useUniverse();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMemberUids, setSelectedMemberUids] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleToggleMember = (uid: string) => {
    setSelectedMemberUids(prev =>
      prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Please enter a group name');
      return;
    }
    if (selectedMemberUids.length === 0) {
      toast.error('Please select at least one friend to join the group');
      return;
    }

    setIsSubmitting(true);
    const groupId = await createGroupChat(name.trim(), selectedMemberUids, description.trim());
    setIsSubmitting(false);
    onClose();
    if (onGroupCreated) {
      onGroupCreated(groupId);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="glass-panel w-full max-w-lg rounded-3xl border border-white/10 p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
                <Users className="w-4 h-4 text-cyan-400" />
              </div>
              <h3 className="font-extrabold text-white text-base">Create Group Chat</h3>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-xl glass-card text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleCreate} className="flex-1 flex flex-col min-h-0 space-y-4 pt-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Group Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dream Team 🚀"
                className="w-full px-4 py-2.5 rounded-2xl glass-input text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider">
                Description (Optional)
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What is this group about?"
                className="w-full px-4 py-2.5 rounded-2xl glass-input text-xs"
              />
            </div>

            {/* Select Members */}
            <div className="flex-1 flex flex-col min-h-0">
              <label className="block text-[11px] font-bold text-slate-300 mb-1.5 uppercase tracking-wider flex justify-between">
                <span>Select Members ({selectedMemberUids.length} selected)</span>
              </label>

              <div className="flex-1 overflow-y-auto space-y-2 border border-white/10 rounded-2xl p-2.5 bg-space-950/40 scrollbar-none max-h-48">
                {friends.length > 0 ? (
                  friends.map((friend) => {
                    const isSelected = selectedMemberUids.includes(friend.uid);
                    return (
                      <div
                        key={friend.uid}
                        onClick={() => handleToggleMember(friend.uid)}
                        className={`p-2.5 rounded-xl cursor-pointer flex items-center justify-between transition-all ${
                          isSelected
                            ? 'bg-pink-500/20 border border-pink-500/40'
                            : 'glass-card border-white/5 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={friend.photoURL}
                            alt={friend.displayName}
                            className="w-8 h-8 rounded-full object-cover"
                          />
                          <div className="min-w-0">
                            <p className="font-bold text-xs text-white truncate">{friend.displayName}</p>
                            <p className="text-[10px] text-pink-300">@{friend.username}</p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                          isSelected ? 'bg-pink-500 border-pink-500 text-white' : 'border-white/20'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No friends available to add. Connect with users first!
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !name.trim() || selectedMemberUids.length === 0}
              className="btn-love w-full py-3.5 rounded-2xl text-xs font-bold disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Group...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Create Group Chat</span>
                </>
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
