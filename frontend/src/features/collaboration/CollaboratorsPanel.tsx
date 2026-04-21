import { useState } from 'react';
import { useCollaborationStore } from '../../store/useCollaborationStore';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import { useRealTime } from '../../hooks/useRealTime';

interface UserInfo {
  _id: string;
  username: string;
  avatar: string;
}

interface Collaborator {
  user: UserInfo;
  role: string;
}

interface PendingInvite {
  user: UserInfo;
  role: string;
  sentAt: string;
}

interface CollaboratorsPanelProps {
  projectId: string;
  owner: { _id?: string; name: string; username: string; avatar: string };
  collaborators: Collaborator[];
  pendingInvites: PendingInvite[];
  onInviteClick: () => void;
  onRefresh: () => void;
}

export const CollaboratorsPanel = ({ 
  projectId,
  owner, 
  collaborators, 
  pendingInvites, 
  onInviteClick,
  onRefresh
}: CollaboratorsPanelProps) => {
  const { users: onlineUsers } = useCollaborationStore();
  const { user: currentUser } = useAuthStore();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  useRealTime('collaborator-list-updated', () => {
    onRefresh();
  });

  const isOnline = (username: string) => onlineUsers.some(u => u.name === username);

  const currentUserId = currentUser?.id || currentUser?._id;
  const currentUserRole = currentUserId === owner._id ? 'owner' : 
    (collaborators.find(c => c.user._id === currentUserId)?.role || 'reader');

  const isOwner = currentUserRole === 'owner';
  const isOwnerOrEditor = isOwner || currentUserRole === 'editor';

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingAction(`role-${userId}`);
    try {
      await api.patch(`/projects/${projectId}/collaborators/${userId}`, { role: newRole });
      onRefresh();
    } catch (err) {
      console.error('Failed to update role', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleRemove = async (userId: string) => {
    if (!window.confirm('Are you sure you want to remove this collaborator?')) return;
    setLoadingAction(`remove-${userId}`);
    try {
      await api.delete(`/projects/${projectId}/collaborators/${userId}`);
      onRefresh();
    } catch (err) {
      console.error('Failed to remove collaborator', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCancelInvite = async (recipientId: string) => {
    setLoadingAction(`cancel-${recipientId}`);
    try {
      await api.delete(`/projects/${projectId}/invitations/${recipientId}`);
      onRefresh();
    } catch (err) {
      console.error('Failed to cancel invitation', err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0d12] border-l border-[#1e2a3a]">
      {/* Header */}
      <div className="p-4 border-b border-[#1e2a3a] flex items-center justify-between bg-[#111720]">
        <h3 className="text-sm font-semibold text-[#f1f3fc] font-['Space_Grotesk']">Team</h3>
        {isOwner && (
          <button
            onClick={onInviteClick}
            className="text-[10px] px-2 py-1 rounded bg-[#a78bfa]/10 text-[#a78bfa] border border-[#a78bfa]/20 hover:bg-[#a78bfa] hover:text-white transition-all font-bold uppercase tracking-wider"
          >
            + Invite
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-[#1e2a3a]">
        {/* Owner Section */}
        <div>
          <h4 className="text-[10px] text-[#3a4458] font-bold uppercase tracking-[0.2em] mb-3">Owner</h4>
          <div className="flex items-center justify-between p-2 rounded-xl bg-[#111720]/50 border border-[#1e2a3a]/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                {owner.avatar ? (
                  <img src={owner.avatar} alt={owner.username} className="w-8 h-8 rounded-full border border-[#1e2a3a]" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#1e2a3a] flex items-center justify-center text-xs text-[#8a98b3]">
                    {owner.username?.[0]?.toUpperCase()}
                  </div>
                )}
                {isOnline(owner.username) && (
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0a0d12]" />
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-[#f1f3fc] font-medium">@{owner.username}</span>
                <span className="text-[10px] text-[#8a98b3] font-mono">Full Access</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collaborators Section */}
        <div>
          <h4 className="text-[10px] text-[#3a4458] font-bold uppercase tracking-[0.2em] mb-3">Collaborators ({collaborators.length - 1})</h4>
          <div className="space-y-2">
            {collaborators.filter(c => c.user._id !== owner._id).map((c, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-xl hover:bg-[#111720]/50 transition-all border border-transparent hover:border-[#1e2a3a]/30 group">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {c.user.avatar ? (
                      <img src={c.user.avatar} alt={c.user.username} className="w-8 h-8 rounded-full border border-[#1e2a3a]" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1e2a3a] flex items-center justify-center text-xs text-[#8a98b3]">
                        {c.user.username?.[0]?.toUpperCase()}
                      </div>
                    )}
                    {isOnline(c.user.username) && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-[#0a0d12]" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm text-[#f1f3fc] font-medium">@{c.user.username}</span>
                    {isOwner ? (
                      <select
                        disabled={loadingAction === `role-${c.user._id}`}
                        value={c.role}
                        onChange={(e) => handleRoleChange(c.user._id, e.target.value)}
                        className="bg-transparent border-none text-[10px] text-[#a78bfa] font-mono focus:ring-0 p-0 cursor-pointer hover:underline appearance-none"
                      >
                        <option value="editor">Editor</option>
                        <option value="commenter">Commenter</option>
                        <option value="reader">Reader</option>
                      </select>
                    ) : (
                      <span className="text-[10px] text-[#8a98b3] font-mono capitalize">{c.role}</span>
                    )}
                  </div>
                </div>
                
                {isOwner && (
                  <button
                    onClick={() => handleRemove(c.user._id)}
                    disabled={loadingAction === `remove-${c.user._id}`}
                    className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400 hover:bg-red-400/10 transition-all text-[10px]"
                    title="Remove Collaborator"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            {collaborators.length <= 1 && (
              <p className="text-[11px] text-[#3a4458] italic py-2 px-1">No other collaborators.</p>
            )}
          </div>
        </div>

        {/* Pending Invites Section - Visible to All */}
        {pendingInvites.length > 0 && (
          <div>
            <h4 className="text-[10px] text-[#3a4458] font-bold uppercase tracking-[0.2em] mb-3">Pending ({pendingInvites.length})</h4>
            <div className="space-y-2">
              {pendingInvites.map((invite, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-[#0a0d12] border border-dashed border-[#1e2a3a] group/invite">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1e2a3a] border border-dashed border-[#a78bfa]/30 flex items-center justify-center text-xs text-[#8a98b3]">
                      {invite.user.username?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm text-[#8a98b3] font-medium">@{invite.user.username}</span>
                      <span className="text-[10px] text-[#3a4458] font-mono capitalize">{invite.role}</span>
                    </div>
                  </div>
                  
                  {isOwner ? (
                    <button
                      onClick={() => handleCancelInvite(invite.user._id)}
                      className="p-1 px-2 text-[9px] font-bold text-red-500/60 hover:text-red-500 transition-colors uppercase tracking-tight"
                    >
                      Cancel
                    </button>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-[#a78bfa] animate-pulse" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-[#1e2a3a] bg-[#111720]/30 text-center">
        <p className="text-[10px] text-[#3a4458] leading-relaxed">
          {isOwner 
            ? "Manage teammates or adjust permissions." 
            : "Collaboration is live. Syncing via CRDTs."}
        </p>
      </div>
    </div>
  );
};
