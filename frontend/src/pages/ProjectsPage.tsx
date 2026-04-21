import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationBell } from '../components/notifications/NotificationBell';
import { useRealTime } from '../hooks/useRealTime';

interface Project {
  _id: string;
  title: string;
  language: string;
  projectType: 'programming' | 'web-development';
  owner: { _id: string; name: string; username: string; avatar: string };
  collaborators: { user: { username: string; avatar: string }; role: string }[];
  createdAt: string;
}

const LANG_ICONS: Record<string, string> = {
  typescript: 'TS',
  javascript: 'JS',
  python: 'PY',
  rust: 'RS',
  html: 'HTML',
};

// ─── Delete Confirmation Modal ───────────────────────────────────────────────
const DeleteModal = ({
  project,
  onConfirm,
  onCancel,
  loading,
}: {
  project: Project;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) => (
  <div className="fixed inset-0 z-[60] flex items-center justify-center bg-surface/90 backdrop-blur-md p-4">
    <div className="bg-surface-bright border border-red-500/20 rounded-[32px] p-8 w-full max-w-sm shadow-3xl animate-in zoom-in-95 duration-200">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6 text-3xl shadow-lg shadow-red-500/5">
        🗑️
      </div>
      <h3 className="font-heading font-bold text-2xl text-white mb-2">
        Delete Project
      </h3>
      <p className="text-sm text-on-surface-muted mb-6 leading-relaxed">
        Are you sure you want to terminate <span className="text-white font-bold">"{project.title}"</span>? This will permanently delete all associated metadata.
      </p>
      <div className="flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-3.5 rounded-2xl bg-surface border border-surface-accent text-on-surface-muted font-bold text-sm hover:text-white transition-all"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="flex-1 py-4 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm disabled:opacity-50 transition-all shadow-xl shadow-red-600/20"
        >
          {loading ? 'Deleting...' : 'Terminate'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Project Card ─────────────────────────────────────────────────────────────
const ProjectCard = ({
  project,
  isOwner,
  onOpen,
  onDelete,
  onRename,
}: {
  project: Project;
  isOwner: boolean;
  onOpen: () => void;
  onDelete: () => void;
  onRename: (newTitle: string) => void;
}) => {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(project.title);
  const inputRef = useRef<HTMLInputElement>(null);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(project.title);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commitEdit = () => {
    const trimmed = editTitle.trim();
    if (trimmed && trimmed !== project.title) {
      onRename(trimmed);
    }
    setEditing(false);
  };

  const langIcon = LANG_ICONS[project.language] || '{}';

  return (
    <div
      className="group relative rounded-[28px] glass border-surface-accent/30 hover:border-primary/40 hover:bg-surface-bright/40 transition-all duration-500 overflow-hidden shadow-sm hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1.5"
    >
      <button
        onClick={onOpen}
        className="w-full text-left p-7 block"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="w-12 h-12 rounded-2xl bg-surface-bright border border-surface-accent flex items-center justify-center text-xs font-black font-mono text-primary shadow-inner">
            {langIcon}
          </div>
          
          <div className="flex items-center gap-2">
            {project.projectType === 'web-development' ? (
              <span className="flex items-center gap-1.5 text-[10px] font-heading font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Web Dev
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-heading font-black uppercase tracking-widest px-3 py-1.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                Scripting
              </span>
            )}
          </div>
        </div>

        {!editing && (
          <h3 className="font-heading font-bold text-xl text-white mb-2 group-hover:text-primary transition-colors truncate">
            {project.title}
          </h3>
        )}

        <p className="text-xs text-on-surface-dim font-mono mb-8 flex items-center gap-2">
          <span className="w-1 h-1 rounded-full bg-on-surface-dim opacity-30" />
          {project.language}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex -space-x-2">
            {project.collaborators.slice(0, 4).map((c, i) =>
              c.user.avatar ? (
                <img key={i} src={c.user.avatar} alt={c.user.username} className="w-7 h-7 rounded-lg border-2 border-surface-container object-cover" />
              ) : (
                <div key={i} className="w-7 h-7 rounded-lg border-2 border-surface-container bg-surface-bright flex items-center justify-center text-[10px] font-bold text-on-surface-muted">
                  {c.user.username?.[0]?.toUpperCase()}
                </div>
              )
            )}
            {project.collaborators.length > 4 && (
              <div className="w-7 h-7 rounded-lg border-2 border-surface-container bg-surface-accent flex items-center justify-center text-[8px] font-black text-white">
                +{project.collaborators.length - 4}
              </div>
            )}
          </div>
          <span className="text-[10px] font-bold text-on-surface-dim uppercase tracking-widest">
            {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </button>

      {editing && (
        <div className="absolute inset-0 flex items-center px-7 bg-surface-bright/95 backdrop-blur-md z-10">
          <div className="w-full">
            <label className="block text-[10px] font-black text-primary mb-2 uppercase tracking-widest">Rename Workspace</label>
            <input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit();
                if (e.key === 'Escape') setEditing(false);
              }}
              className="w-full bg-transparent border-b-2 border-primary outline-none text-white font-heading font-bold text-xl py-1"
            />
          </div>
        </div>
      )}

      {isOwner && !editing && (
        <div className="absolute bottom-6 right-6 flex items-center gap-2 translate-y-12 group-hover:translate-y-0 transition-all duration-500 ease-out">
          <button
            onClick={startEdit}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-surface-bright border border-surface-accent text-on-surface-muted hover:text-white hover:border-white/20 transition-all shadow-xl"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all shadow-xl"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState('typescript');
  const [newProjectType, setNewProjectType] = useState<'programming' | 'web-development'>('web-development');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
    } catch {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  useRealTime('project-list-updated', () => {
    fetchProjects();
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    setError('');
    try {
      const languageToSave = newProjectType === 'web-development' ? 'html' : newLang;
      const { data } = await api.post('/projects', {
        title: newTitle.trim(),
        language: languageToSave,
        projectType: newProjectType,
      });
      setProjects((prev) => [data.project, ...prev]);
      setShowCreate(false);
      setNewTitle('');
      navigate(`/workspace/${data.project._id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (projectId: string, newTitle: string) => {
    try {
      const { data } = await api.patch(`/projects/${projectId}`, { title: newTitle });
      setProjects((prev) =>
        prev.map((p) => (p._id === projectId ? { ...p, title: data.project.title } : p))
      );
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to rename project');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/projects/${deleteTarget._id}`);
      setProjects((prev) => prev.filter((p) => p._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/auth');
  };

  const isProjectOwner = (project: Project) =>
    project.owner._id === (user as any)?._id ||
    project.owner._id === (user as any)?.id ||
    project.owner.username === user?.username;

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      {/* Top Nav */}
      <nav className="border-b border-surface-accent px-8 py-5 flex items-center justify-between sticky top-0 glass-dark z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary to-primary-dim flex items-center justify-center shadow-2xl shadow-primary/20">
            <span className="text-white text-xl font-bold font-mono">E</span>
          </div>
          <span className="text-2xl font-bold font-heading tracking-tight text-white leading-none">Developer's Den</span>
        </div>

        <div className="flex items-center gap-8">
          <NotificationBell />
          <button
            onClick={() => navigate(`/profile/${user?.username}`)}
            className="flex items-center gap-3.5 group transition-all duration-300"
          >
            <div className="relative">
              {user?.avatar ? (
                <img src={user.avatar} alt="avatar" className="w-9 h-9 rounded-2xl object-cover ring-2 ring-surface-accent group-hover:ring-primary/50 transition-all" />
              ) : (
                <div className="w-9 h-9 rounded-2xl bg-surface-bright border border-surface-accent flex items-center justify-center text-xs font-heading group-hover:border-primary/50 transition-all">
                  {user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-primary border-2 border-surface rounded-full shadow-lg" />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-sm font-bold text-white group-hover:text-primary transition-colors">{user?.username}</span>
              <span className="text-[10px] text-on-surface-dim font-medium lowercase">Collaborator</span>
            </div>
          </button>
          <button
            onClick={handleLogout}
            className="px-5 py-2 rounded-xl bg-surface-bright border border-surface-accent text-xs text-on-surface-muted hover:text-red-400 hover:border-red-400/30 transition-all font-black uppercase tracking-widest"
          >
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-8 py-16">
        <div className="flex items-end justify-between mb-16 px-2">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest border border-primary/20">Dashboard</span>
              <div className="w-1 h-1 rounded-full bg-on-surface-dim opacity-30" />
              <span className="text-[10px] text-on-surface-dim font-bold uppercase tracking-widest">{projects.length} Workspace{projects.length !== 1 && 's'}</span>
            </div>
            <h2 className="text-5xl font-bold font-heading mb-3 text-white tracking-tight">Your Labs</h2>
            <p className="text-on-surface-muted text-base max-w-xl leading-relaxed">
              Real-time multi-player environments for high-performance development. Choose a project or bootstrap a new one.
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="group flex items-center gap-3 px-8 py-4 rounded-[24px] bg-primary text-surface font-black text-sm hover:brightness-110 active:scale-[0.98] transition-all duration-300 shadow-2xl shadow-primary/30"
          >
            <span className="text-xl group-hover:rotate-90 transition-transform duration-300">＋</span>
            Bootstrap New Lab
          </button>
        </div>

        {error && (
          <div className="mb-12 px-6 py-5 rounded-[24px] bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between animate-in fade-in slide-in-from-top-4 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <span className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-lg">!</span>
              <span className="font-semibold">{error}</span>
            </div>
            <button onClick={() => setError('')} className="w-8 h-8 rounded-full hover:bg-white/5 transition-colors">✕</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 rounded-[28px] bg-surface-bright/30 border border-surface-accent/20 animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-40 text-center glass rounded-[40px] border-dashed border-2 border-surface-accent/30 mx-2">
            <div className="w-28 h-28 rounded-[36px] bg-surface-bright border border-surface-accent flex items-center justify-center mb-8 text-5xl grayscale opacity-30 shadow-inner">
              {'🧪'}
            </div>
            <h3 className="text-3xl font-bold font-heading text-white mb-4">No active labs discovered</h3>
            <p className="text-on-surface-muted max-w-sm mb-12 text-lg">
              Every revolution starts with a single line of code. Initialize your first collaborative workspace.
            </p>
            <button 
              onClick={() => setShowCreate(true)}
              className="px-10 py-4 rounded-2xl border-2 border-primary/30 text-primary font-black uppercase tracking-widest hover:bg-primary/5 hover:border-primary transition-all active:scale-95"
            >
              Start Bootstrapping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {projects.map((project) => (
              <ProjectCard
                key={project._id}
                project={project}
                isOwner={isProjectOwner(project)}
                onOpen={() => navigate(`/workspace/${project._id}`)}
                onDelete={() => setDeleteTarget(project)}
                onRename={(newTitle) => handleRename(project._id, newTitle)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-surface/95 backdrop-blur-md p-4">
          <div className="bg-surface-bright border border-white/5 rounded-[40px] p-10 w-full max-w-xl shadow-full animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-3xl font-bold font-heading text-white mb-2">Bootstrap Lab</h3>
                <p className="text-sm text-on-surface-dim font-medium">Ready to initialize a new development environment.</p>
              </div>
              <button 
                onClick={() => setShowCreate(false)}
                className="w-12 h-12 rounded-2xl bg-surface border border-surface-accent flex items-center justify-center text-on-surface-dim hover:text-white transition-all shadow-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-primary uppercase tracking-[0.25em] px-1">Workspace Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-7 py-5 rounded-[24px] bg-surface border-2 border-surface-accent text-white font-heading font-bold text-lg placeholder-white/20 focus:outline-none focus:border-primary/50 focus:ring-8 focus:ring-primary/5 transition-all shadow-inner"
                  placeholder="The Next Big Thing..."
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-black text-primary uppercase tracking-[0.25em] px-1">Infrastructure Profile</label>
                <div className="grid grid-cols-2 gap-4 p-2 bg-surface rounded-[32px] border-2 border-surface-accent shadow-inner">
                  <button
                    type="button"
                    onClick={() => setNewProjectType('web-development')}
                    className={`flex flex-col items-start px-6 py-6 rounded-[24px] transition-all duration-500 overflow-hidden relative group ${
                      newProjectType === 'web-development' 
                        ? 'bg-primary text-surface shadow-2xl shadow-primary/20 scale-[1.02]' 
                        : 'text-on-surface-muted hover:bg-white/5'
                    }`}
                  >
                    <span className="text-lg font-black font-heading mb-1 z-10">Web App</span>
                    <span className={`text-[11px] font-mono z-10 ${newProjectType === 'web-development' ? 'text-surface/70' : 'text-on-surface-dim'}`}>Full Frontend Stack</span>
                    {newProjectType === 'web-development' && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewProjectType('programming')}
                    className={`flex flex-col items-start px-6 py-6 rounded-[24px] transition-all duration-500 overflow-hidden relative group ${
                      newProjectType === 'programming' 
                        ? 'bg-secondary text-surface shadow-2xl shadow-secondary/20 scale-[1.02]' 
                        : 'text-on-surface-muted hover:bg-white/5'
                    }`}
                  >
                    <span className="text-lg font-black font-heading mb-1 z-10">Logic Only</span>
                    <span className={`text-[11px] font-mono z-10 ${newProjectType === 'programming' ? 'text-surface/70' : 'text-on-surface-dim'}`}>Isolated Scripts</span>
                    {newProjectType === 'programming' && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
                  </button>
                </div>
              </div>

              {newProjectType === 'programming' && (
                <div className="space-y-3 animate-in fade-in slide-in-from-top-4 duration-500">
                  <label className="block text-[10px] font-black text-primary uppercase tracking-[0.25em] px-1">Source Language</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['typescript', 'javascript', 'python', 'rust'].map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setNewLang(lang)}
                        className={`py-3.5 rounded-2xl border-2 font-mono text-[11px] font-black uppercase transition-all ${
                          newLang === lang 
                            ? 'bg-secondary/10 border-secondary text-secondary shadow-lg shadow-secondary/10' 
                            : 'bg-surface border-surface-accent text-on-surface-dim hover:text-white hover:border-white/20'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-5 rounded-[24px] border-2 border-surface-accent text-on-surface-muted font-black uppercase tracking-widest text-xs hover:text-white hover:bg-white/5 transition-all"
                >
                  Abort
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-[2] py-5 rounded-[24px] bg-primary text-surface font-black uppercase tracking-[0.25em] text-sm hover:brightness-110 disabled:opacity-50 transition-all shadow-2xl shadow-primary/20"
                >
                  {creating ? 'Sequencing...' : 'Initiate Boot sequence →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <DeleteModal
          project={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={deleting}
        />
      )}
    </div>
  );
}
