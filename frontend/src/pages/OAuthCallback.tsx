import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

export default function OAuthCallback() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const hasSynced = useRef(false);

  useEffect(() => {
    // Wait until Clerk user profile is completely loaded
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      // If we land here but aren't signed into Clerk, go back to auth
      navigate('/auth', { replace: true });
      return;
    }

    const syncWithBackend = async () => {
      // Prevent double calls due to React StrictMode
      if (hasSynced.current) return;
      hasSynced.current = true;

      try {
        const primaryEmail = user.primaryEmailAddress?.emailAddress;
        
        // Call the backend to sync MongoDB user with Clerk ID
        const { data } = await api.post('/auth/clerk-sync', {
          clerkId: user.id,
          email: primaryEmail,
          name: user.fullName || '',
          avatar: user.imageUrl || '',
        });

        // Set our own backend JWT and user object
        setAuth(data.accessToken, data.user);

        // Routing based on whether they need to setup a profile
        if (data.needsOnboarding) {
          navigate('/onboarding', { replace: true });
        } else {
          navigate('/projects', { replace: true });
        }
      } catch (error) {
        console.error('Failed to sync authentication with backend', error);
        navigate('/auth', { replace: true });
      }
    };

    syncWithBackend();

  }, [isLoaded, isSignedIn, user, navigate, setAuth]);

  return (
    <div className="min-h-screen bg-[#0a0d12] flex flex-col items-center justify-center">
      <div className="w-16 h-16 border-4 border-[#a78bfa]/20 border-t-[#a78bfa] rounded-full animate-spin mb-6" />
      <h2 className="text-[#f1f3fc] text-xl font-['Space_Grotesk'] font-bold">Verifying Authentication...</h2>
      <p className="text-[#8a98b3] font-['Inter'] mt-2">Setting up your secure environment</p>
    </div>
  );
}
