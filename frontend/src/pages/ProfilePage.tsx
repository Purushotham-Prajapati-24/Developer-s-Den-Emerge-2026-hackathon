import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UploadAvatar } from '../components/profile/UploadAvatar';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

interface UserProfile {
  _id: string;
  name: string;
  username: string;
  bio: string;
  avatar: string;
  email: string;
  skills: string[];
  followers: { _id: string; username: string; avatar: string }[];
  following: { _id: string; username: string; avatar: string }[];
  projects: { _id: string; title: string; createdAt: string; language?: string }[];
  socialLinks: { github?: string; linkedin?: string; portfolio?: string };
}

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser, setAuth, accessToken } = useAuthStore();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', bio: '', github: '', linkedin: '', portfolio: '' });
  const [saving, setSaving] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState('');

  const isOwn = currentUser?.username === username;

  const fetchProfile = async () => {
    try {
      const { data } = await api.get(`/profile/${username}`);
      setProfile(data);
      setIsFollowing(data.followers.some((f: any) => f._id === currentUser?._id));
      setEditForm({
        name: data.name,
        bio: data.bio || '',
        github: data.socialLinks?.github || '',
        linkedin: data.socialLinks?.linkedin || '',
        portfolio: data.socialLinks?.portfolio || '',
      });
    } catch (err) {
      setError('Profile not found');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [username]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await api.patch('/profile', {
        name: editForm.name,
        bio: editForm.bio,
        socialLinks: {
          github: editForm.github,
          linkedin: editForm.linkedin,
          portfolio: editForm.portfolio,
        },
      });
      setProfile(data);
      setAuth(accessToken!, { ...currentUser, name: data.name });
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;
    setFollowLoading(true);
    try {
      const { data } = await api.post(`/profile/${profile._id}/follow`);
      setIsFollowing(data.following);
      setProfile((prev) => {
        if (!prev) return prev;
        if (data.following) {
          return { ...prev, followers: [...prev.followers, { _id: currentUser!._id!, username: currentUser!.username, avatar: currentUser!.avatar || '' }] };
        } else {
          return { ...prev, followers: prev.followers.filter((f) => f._id !== currentUser?._id) };
        }
      });
    } catch (err) {
      setError('Follow action failed');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    try {
      await api.post('/profile/avatar', { avatarUrl: url });
      setProfile((prev) => prev ? { ...prev, avatar: url } : prev);
      setAuth(accessToken!, { ...currentUser, avatar: url });
    } catch { /* non-critical */ }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
        <div className="flex items-center gap-3 text-[#8a98b3] font-['Inter'] text-sm">
          <span className="w-5 h-5 border-2 border-[#3a4458] border-t-[#a78bfa] rounded-full animate-spin" />
          Loading profile...
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center">
        <p className="text-[#8a98b3] font-['Inter'] text-sm">{error}</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-[#0a0d12] text-[#f1f3fc]">
      {/* Nav */}
      <nav className="border-b border-[#1e2a3a] px-6 py-4 flex items-center gap-4 sticky top-0 bg-[#0a0d12]/90 backdrop-blur-[16px] z-50">
        <button onClick={() => navigate(-1)} className="text-[#8a98b3] hover:text-[#f1f3fc] text-sm font-['Inter'] transition-colors">← Back</button>
        <div className="w-px h-4 bg-[#1e2a3a]" />
        <h1 className="text-sm font-['Space_Grotesk'] font-semibold">@{profile.username}</h1>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Profile Header */}
        <div className="bg-[#111720]/80 backdrop-blur-[20px] border border-[#1e2a3a] rounded-2xl p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {isOwn ? (
                <UploadAvatar currentAvatar={profile.avatar} onUploadSuccess={handleAvatarUpload} />
              ) : profile.avatar ? (
                <img src={profile.avatar} alt={profile.name} className="w-20 h-20 rounded-full object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center text-2xl font-bold text-white">
                  {profile.name[0].toUpperCase()}
                </div>
              )}
              {isOwn && !isEditing && (
                <div className="absolute bottom-0 right-0 w-5 h-5 bg-[#28c840] rounded-full border-2 border-[#0a0d12]" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <form onSubmit={handleSaveProfile} className="space-y-3">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Space_Grotesk'] font-bold text-xl focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                    placeholder="Display Name"
                  />
                  <textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                    rows={2}
                    maxLength={300}
                    className="w-full px-3 py-2 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#c9d1d9] font-['Inter'] text-sm resize-none focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                    placeholder="Tell the world about yourself..."
                  />
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      { key: 'github', placeholder: 'https://github.com/you' },
                      { key: 'linkedin', placeholder: 'https://linkedin.com/in/you' },
                      { key: 'portfolio', placeholder: 'https://yoursite.dev' },
                    ].map(({ key, placeholder }) => (
                      <input
                        key={key}
                        type="url"
                        value={(editForm as any)[key]}
                        onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                        className="w-full px-3 py-1.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-xs focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                        placeholder={placeholder}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-1.5 rounded-lg bg-[#1e2a3a] text-[#8a98b3] text-sm font-['Inter'] hover:text-[#f1f3fc] transition-colors">Cancel</button>
                    <button type="submit" disabled={saving} className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white text-sm font-['Inter'] font-medium disabled:opacity-50 hover:opacity-90 transition-all">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-xl font-bold font-['Space_Grotesk']">{profile.name}</h2>
                    {isOwn ? (
                      <button onClick={() => setIsEditing(true)} className="text-xs text-[#8a98b3] hover:text-[#a78bfa] font-['Inter'] border border-[#1e2a3a] rounded-lg px-2.5 py-1 transition-colors">Edit</button>
                    ) : (
                      <button
                        onClick={handleFollow}
                        disabled={followLoading}
                        className={`text-xs font-['Inter'] font-medium px-4 py-1.5 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                          isFollowing
                            ? 'bg-[#1e2a3a] text-[#8a98b3] hover:bg-red-900/20 hover:text-red-400 border border-[#1e2a3a]'
                            : 'bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white hover:opacity-90'
                        }`}
                      >
                        {followLoading ? '...' : isFollowing ? 'Unfollow' : 'Follow'}
                      </button>
                    )}
                  </div>
                  <p className="text-[#8a98b3] font-mono text-sm mb-3">@{profile.username}</p>
                  {profile.bio && <p className="text-[#c9d1d9] font-['Inter'] text-sm leading-relaxed mb-4">{profile.bio}</p>}

                  {/* Social Links */}
                  <div className="flex items-center gap-4 flex-wrap mb-4">
                    {profile.socialLinks?.github && (
                      <a href={profile.socialLinks.github} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8a98b3] hover:text-[#f1f3fc] font-['Inter'] flex items-center gap-1 transition-colors">
                        ⌥ GitHub
                      </a>
                    )}
                    {profile.socialLinks?.linkedin && (
                      <a href={profile.socialLinks.linkedin} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8a98b3] hover:text-[#f1f3fc] font-['Inter'] flex items-center gap-1 transition-colors">
                        ⊕ LinkedIn
                      </a>
                    )}
                    {profile.socialLinks?.portfolio && (
                      <a href={profile.socialLinks.portfolio} target="_blank" rel="noopener noreferrer" className="text-xs text-[#8a98b3] hover:text-[#f1f3fc] font-['Inter'] flex items-center gap-1 transition-colors">
                        ◈ Portfolio
                      </a>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6">
                    {[
                      { label: 'Projects', value: profile.projects.length },
                      { label: 'Followers', value: profile.followers.length },
                      { label: 'Following', value: profile.following.length },
                    ].map(({ label, value }) => (
                      <div key={label} className="text-center">
                        <p className="text-lg font-bold font-['Space_Grotesk'] text-[#f1f3fc]">{value}</p>
                        <p className="text-xs text-[#8a98b3] font-['Inter']">{label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Skills */}
                  {profile.skills && profile.skills.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-[#1e2a3a]">
                      <p className="text-xs text-[#8a98b3] font-['Inter'] uppercase tracking-wider mb-2">Skills</p>
                      <div className="flex flex-wrap gap-1.5">
                        {profile.skills.map((skill) => (
                          <span key={skill} className="px-2.5 py-1 rounded-md bg-[#a78bfa]/10 border border-[#a78bfa]/20 text-[#a78bfa] text-xs font-['Inter'] font-medium">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Projects */}
        {profile.projects.length > 0 && (
          <div className="bg-[#111720]/80 backdrop-blur-[20px] border border-[#1e2a3a] rounded-2xl p-6">
            <h3 className="font-['Space_Grotesk'] font-semibold text-[#f1f3fc] mb-4">Projects</h3>
            <div className="space-y-2">
              {profile.projects.map((project) => (
                <button
                  key={project._id}
                  onClick={() => navigate(`/workspace/${project._id}`)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-[#0a0d12] border border-transparent hover:border-[#1e2a3a] text-left transition-all group"
                >
                  <div>
                    <p className="text-sm font-['Inter'] text-[#f1f3fc] group-hover:text-[#a78bfa] transition-colors">{project.title}</p>
                    {project.language && <p className="text-xs text-[#3a4458] font-mono mt-0.5">{project.language}</p>}
                  </div>
                  <span className="text-xs text-[#3a4458] font-['Inter']">
                    {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
