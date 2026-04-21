import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { MonacoCollaborative } from '../features/editor/MonacoCollaborative';
import { FileExplorer } from '../features/editor/FileExplorer';
import { WebPreview } from '../features/editor/WebPreview';
import { WebDevAIPanel } from '../features/ai/WebDevAIPanel';
import { CodePreviewToggle } from '../components/workspace/CodePreviewToggle';
import { ChatPanel } from '../features/collaboration/ChatPanel';
import { CollaboratorsPanel } from '../features/collaboration/CollaboratorsPanel';
import { WorkspaceHeader } from '../components/workspace/WorkspaceHeader';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WebDevProject {
  _id: string;
  title: string;
  language: string;
  projectType: 'web-development';
  owner: { name: string; username: string; avatar: string };
  collaborators: { user: { _id: string; username: string; avatar: string }; role: string }[];
  pendingInvitations?: { user: { _id: string; username: string; avatar: string }; role: string; sentAt: string }[];
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

const InviteModal = ({ projectId, onClose }: { projectId: string; onClose: () => void }) => {
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('editor');
  const [status, setStatus] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      await api.post(`/projects/${projectId}/invite`, { username, role });
      setStatus({ type: 'success', msg: `${username} added. Sending transmission...` });
      setUsername('');
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Uplink failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="glass-dark border border-white/10 rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl relative overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-[80px] group-hover:bg-primary/20 transition-all duration-1000" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-lg shadow-primary/5">
              <span className="text-xl">🤝</span>
            </div>
            <div>
              <h3 className="font-heading font-black text-xl text-white tracking-tight uppercase leading-none mb-1">Collaborator Uplink</h3>
              <p className="text-xs text-on-surface-muted font-bold uppercase tracking-widest">Expansion Protocol</p>
            </div>
          </div>

          <form onSubmit={handleInvite} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Terminal Handle</label>
              <input
                type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                required autoFocus
                className="w-full px-5 py-4 rounded-2xl bg-surface-bright border border-surface-accent text-white font-mono text-sm placeholder-on-surface-dim/30 focus:outline-none focus:border-primary/50 transition-all outline-none"
                placeholder="@username"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-primary uppercase tracking-[0.2em] ml-1">Access Level</label>
              <div className="grid grid-cols-3 gap-2">
                {['editor', 'commenter', 'reader'].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      role === r 
                        ? 'bg-primary text-surface shadow-lg shadow-primary/20' 
                        : 'bg-surface-bright text-on-surface-muted border border-surface-accent hover:border-primary/30'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {status && (
              <div className={`px-5 py-4 rounded-2xl text-xs font-bold animate-in zoom-in-95 duration-300 ${
                status.type === 'success'
                  ? 'bg-primary/10 border border-primary/20 text-primary'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {status.msg}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-surface-bright text-on-surface-muted font-black text-xs uppercase tracking-widest hover:text-white border border-surface-accent transition-all"
              >Abort</button>
              <button type="submit" disabled={loading}
                className="flex-[1.5] py-4 rounded-2xl bg-primary text-surface font-black text-xs uppercase tracking-[0.2em] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] disabled:opacity-50 transition-all shadow-xl shadow-primary/20"
              >{loading ? 'Transmitting...' : 'Link User'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

interface WebDevWorkspaceProps {
  project: WebDevProject;
  onRefresh: () => void;
}

export const WebDevWorkspace = ({ project, onRefresh }: WebDevWorkspaceProps) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuthStore();

  const [showInvite, setShowInvite] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'chat' | 'weaver'>('weaver');
  const [chatOpen, setChatOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');

  const pendingInvites = project.pendingInvitations || [];
  const myId = user?._id || user?.id;
  const isOwner = project.owner && ((project.owner as any)._id === myId || (project.owner as any).id === myId || (project.owner as any) === myId);
  const collabEntry = project.collaborators.find((c) => c.user._id === myId || (c.user as any) === myId || (c.user as any).id === myId);
  const myRole = isOwner ? 'owner' : collabEntry?.role || 'editor';

  // Center slot: Code/Preview toggle
  const centerSlot = (
    <CodePreviewToggle view={viewMode} onChange={setViewMode} />
  );

  // No AI toggle button — WebDevAIPanel is always visible as fixed column

  return (
    <div className="h-screen bg-[#0a0d12] flex flex-col overflow-hidden">
      {/* Header — green accent for web dev brand */}
      <WorkspaceHeader
        title={project.title}
        collaborators={project.collaborators}
        pendingInvites={pendingInvites}
        onCollabClick={() => { setCollabOpen((o) => !o); if (!collabOpen) setChatOpen(false); }}
        collabOpen={collabOpen}
        onInviteClick={() => setShowInvite(true)}
        onChatClick={() => { setChatOpen((o) => !o); if (!chatOpen) setCollabOpen(false); }}
        chatOpen={chatOpen}
        centerSlot={centerSlot}
        showDeploy={true}
      />

      {/* ── Main layout: explorer | editor/preview | AI panel | optional right panels ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* File Explorer */}
        <div className={`flex-shrink-0 transition-all duration-300 flex ${explorerOpen ? 'w-56' : 'w-12'} bg-[#0d1117] border-r border-[#1e2a3a] overflow-hidden`}>
          <FileExplorer isOpen={explorerOpen} onToggle={() => setExplorerOpen(!explorerOpen)} />
        </div>

        {/* Editor / Preview area — NOT the full flex-1, leaves room for always-visible AI panel */}
        <div className="flex flex-col flex-1 overflow-hidden border-r border-[#1e2a3a]">
          <div className="flex-1 overflow-hidden relative">
            {/* Monaco editor — hidden (not unmounted) during preview so Yjs binding stays alive */}
            <div className={`absolute inset-0 transition-opacity duration-200 ${viewMode !== 'code' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <MonacoCollaborative
                projectId={projectId!}
                language="html"
                role={myRole}
                projectType="web-development"
              />
            </div>

            {/* WebPreview iframe — only rendered when in preview mode */}
            <div className={`absolute inset-0 p-2 transition-opacity duration-200 ${viewMode !== 'preview' ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
              <WebPreview isActive={viewMode === 'preview'} />
            </div>
          </div>
          {/* NO ExecutionTerminal here — web dev only needs the browser preview */}
        </div>

        {/* ── Web Dev AI Panel — ALWAYS VISIBLE fixed right column ── */}
        <div className="w-72 flex-shrink-0 border-r border-[#1e2a3a] overflow-hidden">
          <WebDevAIPanel />
        </div>

        {/* Collapsible panels: chat + collaborators */}
        <div className={`flex transition-all duration-300 overflow-hidden ${chatOpen || collabOpen ? 'w-72' : 'w-0'}`}>
          {chatOpen && (
            <div className="w-72 flex-shrink-0 h-full">
              <ChatPanel />
            </div>
          )}
          {collabOpen && (
            <div className="w-72 flex-shrink-0 h-full">
              <CollaboratorsPanel
                projectId={projectId!}
                owner={project.owner}
                collaborators={project.collaborators}
                pendingInvites={pendingInvites}
                onInviteClick={() => setShowInvite(true)}
                onRefresh={onRefresh}
              />
            </div>
          )}
        </div>
      </div>

      {showInvite && <InviteModal projectId={projectId!} onClose={() => setShowInvite(false)} />}
    </div>
  );
};
