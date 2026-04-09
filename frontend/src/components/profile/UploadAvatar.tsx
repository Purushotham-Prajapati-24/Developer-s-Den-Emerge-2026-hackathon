import { IKContext, IKUpload } from 'imagekitio-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';

const publicKey = import.meta.env.VITE_IMAGEKIT_PUBLIC_KEY || '';
const urlEndpoint = import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT || '';
const authenticationEndpoint = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'}/profile/imagekit-auth`;

interface UploadAvatarProps {
  currentAvatar?: string;
  onUploadSuccess: (url: string) => void;
}

export const UploadAvatar = ({ currentAvatar, onUploadSuccess }: UploadAvatarProps) => {
  const { accessToken } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const authenticator = async () => {
    try {
      const response = await fetch(authenticationEndpoint, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (!response.ok) throw new Error(`Authentication request failed: ${response.status}`);
      const data = await response.json();
      return { signature: data.signature, expire: data.expire, token: data.token };
    } catch (error: any) {
      throw new Error(`Authentication request failed: ${error.message}`);
    }
  };

  const onError = (err: any) => {
    console.error('Error uploading avatar:', err);
    setLoading(false);
  };

  const onSuccess = (res: any) => {
    console.log('Success', res);
    setLoading(false);
    onUploadSuccess(res.url); // Pass the newly hosted ImageKit URL back
  };

  return (
    <div className="relative group rounded-full overflow-hidden w-24 h-24 bg-[#1b2028] flex items-center justify-center border border-transparent hover:border-[#1b2028]/20 transition-all duration-200">
      {currentAvatar ? (
        <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <span className="text-[#f1f3fc]/50 text-sm font-inter">No Avatar</span>
      )}
      
      {/* Glassmorphic Hover Overlay */}
      <div className="absolute inset-0 bg-[#0f141a]/60 backdrop-blur-[4px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
        <IKContext 
          publicKey={publicKey} 
          urlEndpoint={urlEndpoint} 
          authenticator={authenticator}
        >
          {/* Custom IKUpload component logic mapped to a label */}
          <label className="cursor-pointer text-[#b6a0ff] font-inter text-xs tracking-wider uppercase">
            {loading ? 'Uploading' : 'Change'}
            <IKUpload
              style={{ display: 'none' }}
              folder="/devverse/avatars"
              validateFile={(file: File) => file.size < 2000000} // 2MB limit
              onChange={() => setLoading(true)}
              onError={onError}
              onSuccess={onSuccess}
            />
          </label>
        </IKContext>
      </div>
    </div>
  );
};
