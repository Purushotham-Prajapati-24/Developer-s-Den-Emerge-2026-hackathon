import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

const PRESET_SKILLS = [
  'React', 'Next.js', 'Vue', 'Angular', 'Svelte',
  'TypeScript', 'JavaScript', 'Python', 'Rust', 'Go',
  'Node.js', 'Express', 'FastAPI', 'Django', 'Spring Boot',
  'PostgreSQL', 'MongoDB', 'Redis', 'GraphQL', 'REST APIs',
  'Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure',
  'Git', 'Linux', 'WebAssembly', 'TensorFlow', 'LLMs',
];

export default function OnboardingPage() {
  const { setAuth, user } = useAuthStore();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: user?.username || '',
    bio: '',
    github: '',
    linkedin: '',
    portfolio: '',
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const handleChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill].slice(0, 20)
    );
  };

  const addCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed || selectedSkills.includes(trimmed) || selectedSkills.length >= 20) return;
    setSelectedSkills((prev) => [...prev, trimmed]);
    setCustomSkill('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/onboard', {
        username: form.username.toLowerCase().replace(/\s/g, '_'),
        bio: form.bio,
        skills: selectedSkills,
        socialLinks: {
          github: form.github,
          linkedin: form.linkedin,
          portfolio: form.portfolio,
        },
      });

      setAuth(useAuthStore.getState().accessToken!, data.user);
      navigate('/projects');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Onboarding failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0d12] flex items-center justify-center relative overflow-hidden">
      {/* Ambient glows */}
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] rounded-full bg-[#a78bfa]/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-[#4ade80]/4 blur-[120px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl px-4 py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-['Space_Grotesk'] transition-all duration-300 ${
                step === s
                  ? 'bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] text-white shadow-lg shadow-[#a78bfa]/30'
                  : step > s
                  ? 'bg-[#1e2a3a] text-[#a78bfa]'
                  : 'bg-[#1e2a3a] text-[#3a4458]'
              }`}>
                {step > s ? '✓' : s}
              </div>
              {s < 2 && <div className={`w-12 h-px transition-colors duration-300 ${step > s ? 'bg-[#a78bfa]/50' : 'bg-[#1e2a3a]'}`} />}
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#a78bfa] to-[#7c3aed] flex items-center justify-center shadow-lg shadow-[#a78bfa]/20">
            <span className="text-2xl">{step === 1 ? '👤' : '⚡'}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#f1f3fc] font-['Space_Grotesk'] mb-1">
            {step === 1 ? 'Your Identity' : 'Your Skills'}
          </h1>
          <p className="text-[#8a98b3] text-sm font-['Inter']">
            {step === 1 ? 'How the community will know you.' : 'What do you build with? Pick up to 20.'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-[#111720]/80 backdrop-blur-[20px] border border-[#1e2a3a] rounded-2xl p-7 shadow-xl">
          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg bg-red-900/20 border border-red-500/20 text-red-400 text-sm font-['Inter']">
              {error}
            </div>
          )}

          {step === 1 ? (
            // ─── Step 1: Profile details ───────────────────────────────────────
            <div className="space-y-5">
              {/* Username */}
              <div>
                <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">
                  Username <span className="text-[#a78bfa]">*</span>
                </label>
                <div className="flex items-center rounded-lg bg-[#0a0d12] border border-[#1e2a3a] focus-within:border-[#a78bfa]/50 transition-colors">
                  <span className="pl-4 text-[#3a4458] font-mono text-sm">@</span>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => handleChange('username', e.target.value.toLowerCase().replace(/\s/g, '_'))}
                    required
                    minLength={3}
                    maxLength={30}
                    className="flex-1 px-2 py-2.5 bg-transparent text-[#f1f3fc] font-mono text-sm placeholder-[#3a4458] focus:outline-none"
                    placeholder="ada_lovelace"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs text-[#8a98b3] mb-1.5 font-['Inter'] uppercase tracking-wider">Bio</label>
                <textarea
                  value={form.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  maxLength={300}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-sm placeholder-[#3a4458] focus:outline-none focus:border-[#a78bfa]/50 transition-colors resize-none"
                  placeholder="I build things with code. Open-source enthusiast."
                />
                <p className="text-right text-xs text-[#3a4458] mt-1 font-['Inter']">{form.bio.length}/300</p>
              </div>

              {/* Social Links */}
              <div>
                <label className="block text-xs text-[#8a98b3] mb-3 font-['Inter'] uppercase tracking-wider">Social Links</label>
                <div className="space-y-3">
                  {[
                    { key: 'github', icon: '⌥', placeholder: 'https://github.com/username', label: 'GitHub' },
                    { key: 'linkedin', icon: '⊕', placeholder: 'https://linkedin.com/in/username', label: 'LinkedIn' },
                    { key: 'portfolio', icon: '◈', placeholder: 'https://yourportfolio.dev', label: 'Portfolio' },
                  ].map(({ key, icon, placeholder, label }) => (
                    <div key={key} className="flex items-center rounded-lg bg-[#0a0d12] border border-[#1e2a3a] focus-within:border-[#a78bfa]/50 transition-colors">
                      <span className="pl-4 text-[#3a4458] font-mono text-sm w-8">{icon}</span>
                      <input
                        type="url"
                        value={(form as any)[key]}
                        onChange={(e) => handleChange(key, e.target.value)}
                        className="flex-1 px-2 py-2.5 bg-transparent text-[#f1f3fc] font-['Inter'] text-sm placeholder-[#3a4458] focus:outline-none"
                        placeholder={placeholder}
                        aria-label={label}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (!form.username || form.username.length < 3) {
                    setError('Username must be at least 3 characters.');
                    return;
                  }
                  setError('');
                  setStep(2);
                }}
                className="w-full py-3 mt-2 rounded-lg bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-['Inter'] font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200"
              >
                Next: Add Skills →
              </button>
            </div>
          ) : (
            // ─── Step 2: Skills picker ─────────────────────────────────────────
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Preset grid */}
              <div className="flex flex-wrap gap-2">
                {PRESET_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-['Inter'] font-medium transition-all duration-150 border ${
                      selectedSkills.includes(skill)
                        ? 'bg-[#a78bfa]/15 border-[#a78bfa]/50 text-[#a78bfa]'
                        : 'bg-[#0a0d12] border-[#1e2a3a] text-[#8a98b3] hover:border-[#a78bfa]/30 hover:text-[#f1f3fc]'
                    }`}
                  >
                    {selectedSkills.includes(skill) && <span className="mr-1">✓</span>}
                    {skill}
                  </button>
                ))}
              </div>

              {/* Custom skill input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customSkill}
                  onChange={(e) => setCustomSkill(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } }}
                  maxLength={50}
                  placeholder="Add custom skill..."
                  className="flex-1 px-3 py-2 rounded-lg bg-[#0a0d12] border border-[#1e2a3a] text-[#f1f3fc] font-['Inter'] text-sm placeholder-[#3a4458] focus:outline-none focus:border-[#a78bfa]/50 transition-colors"
                />
                <button
                  type="button"
                  onClick={addCustomSkill}
                  disabled={!customSkill.trim() || selectedSkills.length >= 20}
                  className="px-4 py-2 rounded-lg bg-[#1e2a3a] text-[#a78bfa] text-sm font-['Inter'] font-medium hover:bg-[#a78bfa]/10 disabled:opacity-40 transition-all"
                >
                  + Add
                </button>
              </div>

              {/* Selected count */}
              <p className="text-xs text-[#3a4458] font-['Inter']">
                {selectedSkills.length}/20 skills selected
                {selectedSkills.length > 0 && (
                  <button type="button" onClick={() => setSelectedSkills([])} className="ml-3 text-[#8a98b3] hover:text-red-400 transition-colors">
                    Clear all
                  </button>
                )}
              </p>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-lg bg-[#1e2a3a] text-[#8a98b3] font-['Inter'] font-medium text-sm hover:text-[#f1f3fc] transition-colors"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] py-3 rounded-lg bg-gradient-to-r from-[#a78bfa] to-[#7c3aed] text-white font-['Inter'] font-semibold text-sm hover:opacity-90 active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Setting up...
                    </span>
                  ) : (
                    'Complete Setup →'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[#3a4458] mt-5 font-['Inter']">
          You can always update your profile later from your settings.
        </p>
      </div>
    </div>
  );
}
