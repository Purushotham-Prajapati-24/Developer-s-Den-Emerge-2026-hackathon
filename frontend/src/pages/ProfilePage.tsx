import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UploadAvatar } from '../components/profile/UploadAvatar';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

import { 
  LinkedinIcon,
  GithubIcon
} from '../components/icons/BrandIcons';
import { 
  Globe, 
  Edit3, 
  Plus, 
  Check, 
  X, 
  ArrowLeft,
  Users,
  Briefcase,
  Code,
  Calendar,
  ExternalLink,
  MapPin,
  Mail,
  UserPlus,
  UserCheck
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    <div className="min-h-screen bg-surface text-on-surface transition-colors duration-300">
      {/* Top Navigation */}
      <nav className="border-b border-surface-accent/30 px-6 py-4 flex items-center justify-between sticky top-0 bg-surface/90 backdrop-blur-xl z-50">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="p-2 rounded-lg hover:bg-surface-accent/50 text-on-surface-muted hover:text-on-surface transition-all flex items-center justify-center"
            title="Go Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-px h-6 bg-surface-accent/30 mx-2" />
          <div className="flex flex-col">
            <h1 className="text-sm font-heading font-bold tracking-tight text-glow-emerald">
              @{profile.username}
            </h1>
            <span className="text-[10px] text-on-surface-muted uppercase tracking-[0.1em]">User Profile</span>
          </div>
        </div>

        {isOwn && !isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-full glass-emerald text-primary text-xs font-semibold hover:bg-primary/20 transition-all border border-primary/20"
          >
            <Edit3 className="w-3.5 h-3.5" />
            Edit Profile
          </button>
        )}
      </nav>

      {/* Hero Banner Section */}
      <div className="relative">
        <div className="h-48 md:h-64 bg-gradient-to-r from-surface-accent via-surface-container to-surface-accent overflow-hidden">
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent" />
        </div>

        <main className="max-w-5xl mx-auto px-6 -mt-24 pb-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8">
            {/* Sidebar Column */}
            <aside className="space-y-6">
              {/* Profile Card */}
              <div className="glass-dark rounded-3xl p-6 border border-white/5 shadow-2xl overflow-hidden relative group">
                {/* Status indicator on card top */}
                <div className="absolute top-0 right-0 p-4">
                   <div className="w-3 h-3 bg-primary rounded-full animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
                </div>

                <div className="flex flex-col items-center text-center">
                  <div className="relative mb-6">
                    <div className="absolute -inset-1 bg-gradient-to-tr from-primary to-secondary rounded-full blur-sm opacity-50 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-32 h-32 rounded-full border-4 border-surface overflow-hidden shadow-2xl bg-surface-container">
                      {isOwn ? (
                        <UploadAvatar currentAvatar={profile.avatar} onUploadSuccess={handleAvatarUpload} />
                      ) : profile.avatar ? (
                        <img src={profile.avatar} alt={profile.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl font-heading font-bold text-on-surface-muted uppercase">
                          {profile.name[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="w-full space-y-4">
                       <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-surface-accent focus:border-primary/50 text-on-surface font-heading font-bold text-center outline-none ring-0 focus:ring-2 focus:ring-primary/10 transition-all"
                        placeholder="Display Name"
                      />
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                        rows={3}
                        maxLength={300}
                        className="w-full px-4 py-2.5 rounded-xl bg-surface border border-surface-accent focus:border-primary/50 text-on-surface-muted text-sm resize-none outline-none ring-0 focus:ring-2 focus:ring-primary/10 transition-all text-center"
                        placeholder="Tell the world about yourself..."
                      />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-2xl font-heading font-bold text-on-surface tracking-tight leading-tight">
                        {profile.name}
                      </h2>
                      <p className="text-primary font-mono text-sm tracking-wide mb-4">
                        @{profile.username}
                      </p>
                      {profile.bio && (
                        <p className="text-on-surface-muted text-sm leading-relaxed max-w-xs mx-auto mb-6 italic italic opacity-80">
                          "{profile.bio}"
                        </p>
                      )}
                    </>
                  )}

                  {!isOwn && (
                    <button
                      onClick={handleFollow}
                      disabled={followLoading}
                      className={cn(
                        "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 transform active:scale-95",
                        isFollowing
                          ? "bg-surface-accent text-on-surface-muted hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20"
                          : "bg-primary text-surface hover:bg-primary-dim shadow-[0_4px_12px_rgba(16,185,129,0.3)]"
                      )}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-4 h-4" />
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4" />
                          Follow User
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-1 mt-8 pt-8 border-t border-surface-accent/30">
                  {[
                    { label: 'Projects', value: profile.projects.length, icon: Code },
                    { label: 'Followers', value: profile.followers.length, icon: Users },
                    { label: 'Following', value: profile.following.length, icon: UserCheck },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex flex-col items-center">
                      <span className="text-lg font-heading font-bold text-on-surface">{value}</span>
                      <span className="text-[10px] text-on-surface-muted uppercase tracking-wider">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact/Social Links Card */}
              <div className="glass-dark rounded-3xl p-6 border border-white/5">
                 <h3 className="text-xs font-heading font-semibold uppercase tracking-widest text-on-surface-muted mb-4 px-1">Social Links</h3>
                 <div className="space-y-3">
                    {isEditing ? (
                      <div className="space-y-3">
                         {[
                          { key: 'github', icon: GithubIcon, placeholder: 'GitHub URL' },
                          { key: 'linkedin', icon: LinkedinIcon, placeholder: 'LinkedIn URL' },
                          { key: 'portfolio', icon: Globe, placeholder: 'Portfolio URL' },
                        ].map(({ key, icon: Icon, placeholder }) => (
                          <div key={key} className="flex items-center gap-3 bg-surface rounded-xl px-3 py-2 border border-surface-accent">
                            <Icon className="w-4 h-4 text-on-surface-muted" />
                            <input
                              type="url"
                              value={(editForm as any)[key]}
                              onChange={(e) => setEditForm((p) => ({ ...p, [key]: e.target.value }))}
                              className="bg-transparent border-none outline-none text-xs text-on-surface flex-1 placeholder:text-on-surface-dim"
                              placeholder={placeholder}
                            />
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        <a 
                          href={profile.socialLinks?.github || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl transition-all group",
                            profile.socialLinks?.github ? "bg-surface-accent/30 hover:bg-surface-accent text-on-surface" : "opacity-30 pointer-events-none"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#24292f] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <GithubIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium">GitHub</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <a 
                          href={profile.socialLinks?.linkedin || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl transition-all group",
                            profile.socialLinks?.linkedin ? "bg-surface-accent/30 hover:bg-surface-accent text-on-surface" : "opacity-30 pointer-events-none"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#0077b5] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <LinkedinIcon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm font-medium">LinkedIn</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                        <a 
                          href={profile.socialLinks?.portfolio || '#'} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-2xl transition-all group",
                            profile.socialLinks?.portfolio ? "bg-surface-accent/30 hover:bg-surface-accent text-on-surface" : "opacity-30 pointer-events-none"
                          )}
                        >
                          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Globe className="w-4 h-4 text-primary" />
                          </div>
                          <span className="text-sm font-medium">Portfolio</span>
                          <ExternalLink className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </>
                    )}
                 </div>
              </div>

              {isEditing && (
                <div className="flex flex-col gap-2 pt-2">
                  <button 
                    onClick={handleSaveProfile} 
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-primary text-surface py-3 rounded-2xl font-bold transition-all hover:bg-primary-dim shadow-xl active:scale-95 disabled:opacity-50"
                  >
                    {saving ? 'Updating...' : <><Check className="w-4 h-4" /> Confirm Changes</>}
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="w-full bg-surface-accent/50 text-on-surface-muted py-3 rounded-2xl font-semibold transition-all hover:bg-surface-accent hover:text-on-surface active:scale-95"
                  >
                    Discard Changes
                  </button>
                </div>
              )}
            </aside>

            {/* Main Content Column */}
            <div className="space-y-8">
              {/* Bio / About Section (Desktop Mobile View) */}
              <section className="glass-dark rounded-3xl p-8 border border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full -mr-16 -mt-16" />
                
                <h3 className="text-lg font-heading font-bold text-on-surface flex items-center gap-2 mb-6">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Professional Overview
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] uppercase tracking-[0.2em] text-on-surface-muted mb-2 font-bold">Skills & Expertise</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills?.length > 0 ? (
                        profile.skills.map((skill) => (
                          <span 
                            key={skill} 
                            className="px-4 py-1.5 rounded-full bg-surface-container border border-surface-accent text-xs font-medium text-on-surface-muted hover:text-primary hover:border-primary/30 transition-all cursor-default"
                          >
                            {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-on-surface-dim italic">No skills listed yet.</span>
                      )}
                    </div>
                  </div>

                  {profile.bio && (
                    <div>
                      <h4 className="text-[10px] uppercase tracking-[0.2em] text-on-surface-muted mb-2 font-bold">Biography</h4>
                      <p className="text-on-surface-muted leading-relaxed text-sm">
                        {profile.bio}
                      </p>
                    </div>
                  )}
                </div>
              </section>

              {/* Projects Grid */}
              <section>
                <div className="flex items-center justify-between mb-6 px-2">
                  <h3 className="text-lg font-heading font-bold text-on-surface flex items-center gap-2">
                    <Code className="w-5 h-5 text-secondary" />
                    Open Source Projects
                  </h3>
                  <span className="bg-surface-accent px-3 py-1 rounded-full text-[10px] font-bold text-on-surface-muted uppercase tracking-wider">
                    {profile.projects.length} Total
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profile.projects.length > 0 ? (
                    profile.projects.map((project) => (
                      <button
                        key={project._id}
                        onClick={() => navigate(`/workspace/${project._id}`)}
                        className="group relative flex flex-col p-6 rounded-3xl bg-surface-container border border-surface-accent/50 hover:border-primary/50 transition-all hover:shadow-2xl hover:shadow-primary/5 text-left overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-4 opacity-30 group-hover:opacity-100 transition-all group-hover:translate-x-1 group-hover:-translate-y-1">
                          <ExternalLink className="w-4 h-4 text-primary" />
                        </div>

                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-10 h-10 rounded-xl glass-emerald flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <Code className="w-5 h-5" />
                           </div>
                           <div className="flex flex-col">
                             <h4 className="text-sm font-heading font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                               {project.title}
                             </h4>
                             <span className="text-[10px] text-on-surface-dim font-mono flex items-center gap-1">
                               <Calendar className="w-2.5 h-2.5" />
                               {new Date(project.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                             </span>
                           </div>
                        </div>

                        <div className="mt-auto flex items-center justify-between">
                           {project.language ? (
                             <span className="px-2 py-0.5 rounded-md bg-surface text-[9px] font-bold text-on-surface-muted border border-surface-accent group-hover:border-primary/20 transition-colors uppercase tracking-widest font-mono">
                               {project.language}
                             </span>
                           ) : <div />}
                           
                           <div className="flex -space-x-2">
                              {/* Placeholder for collaborator avatars or more metrics */}
                              <div className="w-5 h-5 rounded-full border border-surface bg-surface-accent" />
                              <div className="w-5 h-5 rounded-full border border-surface bg-primary/20" />
                           </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center glass-dark rounded-3xl border border-dashed border-surface-accent text-on-surface-dim">
                      <Code className="w-12 h-12 mb-4 opacity-10" />
                      <p className="text-sm font-medium uppercase tracking-widest">No projects launched yet</p>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
