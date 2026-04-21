import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MonacoCollaborative } from '../features/editor/MonacoCollaborative';
import { ExecutionTerminal } from '../features/editor/ExecutionTerminal';
import { FileExplorer } from '../features/editor/FileExplorer';
import { AIChatPanel } from '../features/ai/AIChatPanel';
import { ChatPanel } from '../features/collaboration/ChatPanel';
import { CollaboratorsPanel } from '../features/collaboration/CollaboratorsPanel';
import { WorkspaceHeader } from '../components/workspace/WorkspaceHeader';
import { CodePreviewToggle } from '../components/workspace/CodePreviewToggle';
import { WebPreview } from '../features/editor/WebPreview';
import { WebDevAIPanel } from '../features/ai/WebDevAIPanel';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { useCollaborationStore } from '../store/useCollaborationStore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProgrammingProject {
  _id: string;
  title: string;
  language: string;
  projectType: 'programming';
  owner: { name: string; username: string; avatar: string };
  collaborators: { user: { _id: string; username: string; avatar: string }; role: string }[];
  pendingInvitations?: { user: { _id: string; username: string; avatar: string }; role: string; sentAt: string }[];
}

// ─── Invite Modal ─────────────────────────────────────────────────────────────

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
        {/* Glow effect */}
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
                className="w-full px-5 py-4 rounded-2xl bg-surface-bright border border-surface-accent text-white font-mono text-sm placeholder-on-surface-dim/30 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/5 transition-all outline-none"
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
                  ? 'bg-primary/10 border border-primary/20 text-primary shadow-lg shadow-primary/5'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}>
                {status.type === 'success' ? '✓ ' : '✗ '} {status.msg}
              </div>
            )}

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={onClose}
                className="flex-1 py-4 rounded-2xl bg-surface-bright text-on-surface-muted font-black text-xs uppercase tracking-widest hover:text-white hover:bg-white/5 border border-surface-accent transition-all"
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

// ─── Language Badge ───────────────────────────────────────────────────────────

const LANG_BADGE: Record<string, { label: string; color: string }> = {
  typescript:  { label: 'TS',  color: '#34d399' }, // Emerald
  javascript:  { label: 'JS',  color: '#fbbf24' }, // Amber
  python:      { label: 'PY',  color: '#3b82f6' }, // Blue
  rust:        { label: 'RS',  color: '#f87171' }, // Red
  go:          { label: 'GO',  color: '#22d3ee' }, // Cyan
  cpp:         { label: 'C++', color: '#a78bfa' }, // Purple
};

// ─── Main Component ───────────────────────────────────────────────────────────

export const ProgrammingWorkspace = ({ project, onRefresh }: ProgrammingWorkspaceProps) => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuthStore();
  const { files, activeFileId } = useCollaborationStore();

  const [showInvite, setShowInvite] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiMode, setAiMode] = useState<'chat' | 'weaver'>('chat');
  const [chatOpen, setChatOpen] = useState(false);
  const [collabOpen, setCollabOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(true);
  const [viewMode, setViewMode] = useState<'code' | 'preview'>('code');
 
  useEffect(() => {
    const handleOpenAI = () => {
      setAiOpen(true);
      setChatOpen(false);
      setCollabOpen(false);
    };
    window.addEventListener('open-ai-chat', handleOpenAI);
    return () => window.removeEventListener('open-ai-chat', handleOpenAI);
  }, []);

  const activeFile = files.find(f => f.id === activeFileId);
  const isWebFile = activeFile?.name.endsWith('.html') || activeFile?.name.endsWith('.htm');
  const pendingInvites = project.pendingInvitations || [];
  const myId = user?._id || user?.id;
  const isOwner = project.owner && ((project.owner as any)._id === myId || (project.owner as any).id === myId || (project.owner as any) === myId);
  const collabEntry = project.collaborators.find((c) => c.user._id === myId || (c.user as any) === myId || (c.user as any).id === myId);
  const myRole = isOwner ? 'owner' : collabEntry?.role || 'editor';

  const badge = LANG_BADGE[project.language?.toLowerCase()] || { label: project.language?.toUpperCase() || 'CODE', color: '#10b981' };

  // Center slot: language badge + optional preview toggle
  const centerSlot = (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-bright border border-surface-accent shadow-sm">
        <span className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" style={{ backgroundColor: badge.color }} />
        <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: badge.color }}>
          {badge.label} Platform
        </span>
      </div>
      {isWebFile && (
        <div className="scale-90 origin-left">
          <CodePreviewToggle view={viewMode} onChange={setViewMode} />
        </div>
      )}
    </div>
  );

  // Right slot: AI toggle
  const rightSlot = (
    <button
      onClick={() => { setAiOpen((o) => !o); if (!aiOpen) { setChatOpen(false); setCollabOpen(false); } }}
      className={`group relative flex items-center gap-2.5 px-5 py-2.5 rounded-2xl transition-all duration-500 overflow-hidden ${
        aiOpen
          ? 'bg-primary text-surface shadow-xl shadow-primary/20'
          : 'bg-surface-bright text-on-surface-muted hover:text-white hover:bg-white/5 border border-surface-accent'
      }`}
    >
      <span className={`text-base ${aiOpen ? 'text-surface' : 'text-on-surface-dim group-hover:text-white'}`}>🤖</span>
      <span className="text-[11px] font-black uppercase tracking-widest">Architect</span>
      {aiOpen && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
    </button>
  );

  return (
    <div className="h-screen bg-surface flex flex-col overflow-hidden text-on-surface select-none">
      <WorkspaceHeader
        title={project.title}
        collaborators={project.collaborators}
        pendingInvites={pendingInvites}
        onCollabClick={() => { setCollabOpen((o) => !o); if (!collabOpen) { setAiOpen(false); setChatOpen(false); } }}
        collabOpen={collabOpen}
        onInviteClick={() => setShowInvite(true)}
        onChatClick={() => { setChatOpen((o) => !o); if (!chatOpen) { setAiOpen(false); setCollabOpen(false); } }}
        chatOpen={chatOpen}
        centerSlot={centerSlot}
        rightSlot={rightSlot}
        showDeploy={isWebFile}
      />

      <div className="flex flex-1 overflow-hidden relative">
        {/* File Explorer */}
        <div className={`flex-shrink-0 transition-all duration-500 ease-in-out flex ${explorerOpen ? 'w-72' : 'w-16'} overflow-hidden relative z-40`}>
          <FileExplorer isOpen={explorerOpen} onToggle={() => setExplorerOpen(!explorerOpen)} />
        </div>

        {/* Editor + Terminal */}
        <div className="flex flex-col flex-1 overflow-hidden relative z-30">
          <div className="flex-1 overflow-hidden relative bg-surface-bright/10">
            {/* Monaco editor */}
            <div className={`absolute inset-0 transition-all duration-500 ${viewMode !== 'code' ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
              <MonacoCollaborative
                projectId={projectId!}
                language={project.language}
                role={myRole}
                projectType="programming"
              />
            </div>

            {/* Web Preview */}
            {isWebFile && (
              <div className={`absolute inset-0 p-4 transition-all duration-500 ${viewMode !== 'preview' ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'}`}>
                <div className="w-full h-full rounded-3xl overflow-hidden glass shadow-2xl border border-white/5">
                   <WebPreview isActive={viewMode === 'preview'} />
                </div>
              </div>
            )}
          </div>
          
          {/* Execution Terminal — Programming ONLY */}
          {!isWebFile && !aiOpen && !chatOpen && !collabOpen && (
            <div className="h-64 flex-shrink-0 relative z-40 animate-in slide-in-from-bottom duration-500">
              <ExecutionTerminal defaultLanguage={project.language} />
            </div>
          )}
        </div>

        {/* Right side panels */}
        <div className={`flex flex-col flex-shrink-0 transition-all duration-500 ease-in-out glass-dark border-l border-surface-accent z-40 overflow-hidden ${aiOpen || chatOpen || collabOpen ? 'w-[400px]' : 'w-0'}`}>
          {aiOpen && (
            <div className="flex-1 flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-500">
              {/* AI Panel Header with Switcher */}
              {isWebFile && (
                <div className="flex bg-surface-bright/50 border-b border-surface-accent p-2 gap-2">
                  <button
                    onClick={() => setAiMode('chat')}
                    className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${
                      aiMode === 'chat' ? 'bg-primary text-surface shadow-lg shadow-primary/10' : 'text-on-surface-muted hover:bg-white/5'
                    }`}
                  >
                    Architect
                  </button>
                  <button
                    onClick={() => setAiMode('weaver')}
                    className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 ${
                      aiMode === 'weaver' ? 'bg-cyan-500 text-surface shadow-lg shadow-cyan-500/10' : 'text-on-surface-muted hover:bg-white/5'
                    }`}
                  >
                    Web Weaver
                  </button>
                </div>
              )}
              
              <div className="flex-1 overflow-hidden relative">
                <div className={`absolute inset-0 transition-all duration-500 ${aiMode === 'chat' ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12 pointer-events-none'}`}>
                   <AIChatPanel />
                </div>
                {isWebFile && (
                  <div className={`absolute inset-0 transition-all duration-500 ${aiMode === 'weaver' ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12 pointer-events-none'}`}>
                    <WebDevAIPanel />
                  </div>
                )}
              </div>
            </div>
          )}
          {chatOpen && (
            <div className="flex-1 h-full animate-in slide-in-from-right duration-500">
              <ChatPanel />
            </div>
          )}
          {collabOpen && (
            <div className="flex-1 h-full animate-in slide-in-from-right duration-500">
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

