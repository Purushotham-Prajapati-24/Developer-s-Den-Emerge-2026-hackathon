import { useNavigate } from 'react-router-dom';
import { NotificationBell } from '../../components/notifications/NotificationBell';
import { DeployButton } from './DeployButton';
import { useParams } from 'react-router-dom';

interface Collaborator {
  user: { _id: string; username: string; avatar: string };
  role: string;
}

interface PendingInvite {
  user: { _id: string; username: string; avatar: string };
  role: string;
  sentAt: string;
}

interface Owner {
  name: string;
  username: string;
  avatar: string;
}

interface WorkspaceHeaderProps {
  /** Project title shown in the header */
  title: string;
  /** Collaborator list for the avatar strip */
  collaborators: Collaborator[];
  /** Pending invitations (shown as faded avatars) */
  pendingInvites?: PendingInvite[];
  /** Called when the user clicks the collaborator strip */
  onCollabClick: () => void;
  /** Whether collaborator panel is open (controls highlight) */
  collabOpen: boolean;
  /** Called when "Invite" is clicked */
  onInviteClick: () => void;
  /** Called when chat toggle is clicked */
  onChatClick: () => void;
  /** Whether chat panel is open */
  chatOpen: boolean;
  /** Extra controls injected between title and collab strip (e.g. Code/Preview toggle) */
  centerSlot?: React.ReactNode;
  /** Extra controls injected to right of chat button (e.g. AI toggle) */
  rightSlot?: React.ReactNode;
  /** Whether to show the Vercel Deploy button */
  showDeploy?: boolean;
}

/**
 * Shared workspace header.
 * Both ProgrammingWorkspace and WebDevWorkspace use this to avoid duplicating header chrome.
 */
export const WorkspaceHeader = ({
  title,
  collaborators,
  pendingInvites = [],
  onCollabClick,
  collabOpen,
  onInviteClick,
  onChatClick,
  chatOpen,
  centerSlot,
  rightSlot,
  showDeploy,
}: WorkspaceHeaderProps) => {
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-surface-accent flex-shrink-0 glass-dark z-[60] relative">
      {/* ── Left Sector ── */}
      <div className="flex items-center gap-5">
        <button
          onClick={() => navigate('/projects')}
          className="w-10 h-10 flex items-center justify-center rounded-2xl text-on-surface-muted hover:text-white hover:bg-white/5 transition-all duration-300 border border-transparent hover:border-surface-accent shadow-sm active:scale-95"
          title="Back to Labs"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6"/>
          </svg>
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Active Workspace</span>
          </div>
          <h1 className="font-heading font-black text-sm text-white tracking-tight uppercase">
            {title}
          </h1>
        </div>

        {centerSlot && (
          <div className="ml-4 pl-6 border-l border-surface-accent h-8 flex items-center">
            {centerSlot}
          </div>
        )}
      </div>

      {/* ── Right Sector ── */}
      <div className="flex items-center gap-4">
        {/* Collaborators Strip */}
        <div className="flex items-center gap-1.5 pr-4 border-r border-surface-accent mr-2">
          <button
            onClick={onCollabClick}
            className={`flex items-center -space-x-2.5 p-1.5 rounded-2xl transition-all duration-300 hover:bg-white/5 ${
              collabOpen ? 'bg-primary/5 ring-1 ring-primary/30' : ''
            }`}
          >
            {collaborators.slice(0, 5).map((c, i) =>
              c.user.avatar ? (
                <img
                  key={i}
                  src={c.user.avatar}
                  alt={c.user.username}
                  className="w-8 h-8 rounded-xl border-2 border-surface object-cover ring-1 ring-white/5 shadow-xl"
                />
              ) : (
                <div
                  key={i}
                  className="w-8 h-8 rounded-xl border-2 border-surface bg-surface-bright flex items-center justify-center text-[10px] text-on-surface-muted font-black ring-1 ring-white/5 shadow-xl"
                >
                  {c.user.username?.[0]?.toUpperCase()}
                </div>
              )
            )}

            {pendingInvites.map((invite, i) => (
              <div key={`pending-${i}`} className="relative opacity-30 hover:opacity-100 transition-all cursor-help scale-90 group">
                <div className="w-8 h-8 rounded-xl border-2 border-dashed border-primary/40 bg-surface-bright flex items-center justify-center text-[8px] text-on-surface-dim font-black">
                  {invite.user.username?.[0]?.toUpperCase()}
                </div>
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-surface shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
              </div>
            ))}
          </button>

          <button
            onClick={onInviteClick}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-surface transition-all duration-300 shadow-lg shadow-primary/5"
            title="Invite collaborators"
          >
            <span className="text-sm font-bold">＋</span>
          </button>
        </div>

        <NotificationBell />

        {showDeploy && projectId && (
          <div className="mx-2">
            <DeployButton projectId={projectId} />
          </div>
        )}

        <div className="flex items-center gap-2 ml-2">
          <button
            onClick={onChatClick}
            className={`group relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl transition-all duration-500 overflow-hidden ${
              chatOpen
                ? 'bg-white text-surface shadow-xl shadow-white/10'
                : 'bg-surface-bright text-on-surface-muted hover:text-white hover:bg-white/5 border border-surface-accent'
            }`}
          >
            <span className={`text-base ${chatOpen ? 'text-surface' : 'text-on-surface-dim group-hover:text-white'}`}>💬</span>
            <span className="text-[11px] font-black uppercase tracking-widest">Chat</span>
            {chatOpen && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
          </button>

          {rightSlot}
        </div>
      </div>
    </header>
  );
};

