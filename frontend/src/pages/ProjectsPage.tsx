import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { NotificationBell } from '../components/notifications/NotificationBell';

interface Project {
  _id: string;
  title: string;
  language: string;
  owner: { name: string; username: string; avatar: string };
  collaborators: { user: { username: string; avatar: string }; role: string }[];
  createdAt: string;
}

const LANG_COLORS: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f7df1e',
  python: '#3572a5',
  rust: '#ce422b',
  default: '#8a98b3',
};

export default function ProjectsPage() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newLang, setNewLang] = useState('typescript');
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState('');

  const fetchProjects = async () => {
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const { data } = await api.post('/projects', { title: newTitle.trim(), language: newLang });
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

  const handleLogout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    logout();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-[#0a0d12] text-[#f1f3fc]">
      {/* Top Nav */}
      <nav className="border-b border-[#1e2a3a] px-6 py-4 flex items-center justify-between sticky top-0 bg-[#0a0d12]/90 backdrop-blur-[16px] z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center">
            <span className="text-white text-sm font-bold font-mono">D</span>
          </div>
          <span className="text-lg font-semibold font-['Space_Grotesk']">DevVerse</span>
        </div>

        <div className="flex items-center gap-4">
          <NotificationBell />
          
          <button
            onClick={() => navigate(`/profile/${user?.username}`)}
            className="flex items-center gap-2.5 text-sm text-[#8a98b3] hover:text-[#f1f3fc] font-['Inter'] transition-colors"
          >
            {user?.avatar ? (
              <img src={user.avatar} alt="avatar" className="w-7 h-7 rounded-full object-cover" />
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1e2a3a] flex items-center justify-center text-xs font-['Inter']">
                {user?.name?.[0]?.toUpperCase() || 'U'}
              </div>
            )}
            <span>{user?.username}</span>
          </button>

          <button
            onClick={handleLogout}
            className="text-xs text-[#3a4458] hover:text-red-400 font-['Inter'] transition-colors"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <h2 className="text-2xl font-bold font-['Space_Grotesk'] mb-1">Projects</h2>
            <p className="text-[#8a98b3] text-sm font-['Inter']">
              {projects.length > 0
                ? `${projects.length} project${projects.length === 1 ? '' : 's'} in your workspace`
                : 'No projects yet. Create one to get started.'}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-['Inter'] font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-[#7c3aed]/20"
          >
            <span>＋</span>
            New Project
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-red-900/20 border border-red-500/20 text-red-400 text-sm font-['Inter']">
            {error}
          </div>
        )}

        {/* Project Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-36 rounded-xl bg-[#111720] animate-pulse" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#111720] border border-[#1e2a3a] flex items-center justify-center mb-5 text-3xl">
              {'</>'} 
            </div>
            <h3 className="font-['Space_Grotesk'] font-semibold text-[#f1f3fc] mb-2">No projects yet</h3>
            <p className="text-sm text-[#8a98b3] font-['Inter'] max-w-xs">
              Create your first project and start collaborating with your team in real-time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <button
                key={project._id}
                onClick={() => navigate(`/workspace/${project._id}`)}
                className="text-left p-5 rounded-xl bg-[#111720] border border-[#1e2a3a] hover:border-[#a78bfa]/30 hover:bg-[#14202e] transition-all duration-200 group"
              >
                {/* Language badge */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: LANG_COLORS[project.language] || LANG_COLORS.default }}
                  />
                  <span className="text-xs text-[#8a98b3] font-mono">{project.language}</span>
                </div>

                <h3 className="font-['Space_Grotesk'] font-semibold text-[#f1f3fc] mb-1 group-hover:text-[#a78bfa] transition-colors">
                  {project.title}
                </h3>

                <div className="flex items-center gap-2 mt-4">
                  {/* Collaborator avatars */}
                  <div className="flex -space-x-1.5">
                    {project.collaborators.slice(0, 4).map((c, i) => (
                      c.user.avatar ? (
                        <img key={i} src={c.user.avatar} alt={c.user.username} className="w-5 h-5 rounded-full border border-[#0a0d12] object-cover" />
                      ) : (
                        <div key={i} className="w-5 h-5 rounded-full border border-[#0a0d12] bg-[#1e2a3a] flex items-center justify-center text-[8px] text-[#8a98b3]">
                          {c.user.username?.[0]?.toUpperCase()}
                        </div>
                      )
                    ))}
                  </div>
                  <span className="text-xs text-[#3a4458] font-['Inter'] ml-auto">
                    {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0d12]/80 backdrop-blur-[8px]">
          <div className="bg-[#111720] border border-[#1e2a3a] rounded-2xl p-7 w-full max-w-sm shadow-2xl">
            <h3 className="font-['Space_Grotesk'] font-semibold text-lg text-[#f1f3fc] mb-1">New Project</h3>
            <p className="text-sm text-[#8a98b3] font-['Inter'] mb-6">
              Give your project a name and pick a language.
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Project Name</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  autoFocus
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-sm placeholder-[#3a4458] focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                  placeholder="My Awesome App"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Language</label>
                <select
                  value={newLang}
                  onChange={(e) => setNewLang(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-sm focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="flex-1 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#8a98b3] font-['Inter'] text-sm hover:text-[#f1f3fc] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-lg bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-['Inter'] font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-all"
                >
                  {creating ? 'Creating...' : 'Create →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
