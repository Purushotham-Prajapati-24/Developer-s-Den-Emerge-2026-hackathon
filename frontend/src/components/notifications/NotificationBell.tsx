import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';

interface Notification {
  _id: string;
  sender: { name: string; username: string; avatar: string };
  project: { title: string; language: string };
  role: string;
  createdAt: string;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications);
    } catch (err) {
      console.error('Failed to fetch notifications');
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Polling every 30s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleResponse = async (id: string, status: 'accepted' | 'rejected') => {
    try {
      await api.post(`/notifications/${id}/respond`, { status });
      setNotifications((prev) => prev.filter((n) => n._id !== id));
      if (status === 'accepted') {
        window.location.reload(); // Refresh to show new project or update role
      }
    } catch (err) {
      console.error('Failed to respond to notification');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-[#1e2a3a] transition-all text-[#8a98b3] hover:text-[#f1f3fc]"
      >
        <span className="text-xl">🔔</span>
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-[#0a0d12] rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#111720] border border-[#1e2a3a] rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="p-4 border-b border-[#1e2a3a] bg-[#1a2330]">
            <h3 className="text-sm font-semibold text-[#f1f3fc] font-['Space_Grotesk']">Notifications</h3>
          </div>
          
          <div className="max-h-96 overflow-y-auto p-2 space-y-2">
            {notifications.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-[#3a4458] font-['Inter']">No pending invitations.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className="p-3 rounded-lg bg-[#0a0d12] border border-[#1e2a3a]">
                  <div className="flex gap-3 mb-3">
                    {n.sender.avatar ? (
                      <img src={n.sender.avatar} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[#1e2a3a] flex items-center justify-center text-xs text-[#8a98b3]">
                        {n.sender.username[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-[#f1f3fc] font-['Inter']">
                        <span className="font-bold">@{n.sender.username}</span> invited you to <span className="text-[#a78bfa] font-semibold">{n.project.title}</span>
                      </p>
                      <p className="text-[10px] text-[#3a4458] mt-0.5 uppercase tracking-wider">{n.role}</p>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleResponse(n._id, 'accepted')}
                      className="flex-1 py-1.5 rounded-md bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600 hover:text-white text-[10px] font-bold transition-all"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleResponse(n._id, 'rejected')}
                      className="flex-1 py-1.5 rounded-md bg-red-600/20 text-red-400 hover:bg-red-600 hover:text-white text-[10px] font-bold transition-all"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
