import { useState } from 'react';
import { useCollaborationStore } from '../../store/useCollaborationStore';

interface FileExplorerProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export const FileExplorer = ({ isOpen = true, onToggle }: FileExplorerProps) => {
  const { files, activeFileId, setActiveFileId } = useCollaborationStore();
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editFileName, setEditFileName] = useState('');

  const getLanguageFromExtension = (filename: string) => {
    if (filename.endsWith('.js')) return 'javascript';
    if (filename.endsWith('.ts')) return 'typescript';
    if (filename.endsWith('.py')) return 'python';
    if (filename.endsWith('.html')) return 'html';
    if (filename.endsWith('.css')) return 'css';
    if (filename.endsWith('.json')) return 'json';
    return 'javascript'; // Default
  };
  
  const getFileIcon = (filename: string) => {
    if (filename.endsWith('.js')) return '🟨';
    if (filename.endsWith('.ts')) return '🟦';
    if (filename.endsWith('.py')) return '🐍';
    if (filename.endsWith('.html')) return '🌐';
    if (filename.endsWith('.css')) return '🎨';
    if (filename.endsWith('.json')) return '📦';
    return '📄';
  };

  const handleCreateFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName.trim()) {
      setIsCreating(false);
      return;
    }
    
    let name = newFileName.trim();
    if (!name.includes('.')) {
      name += '.js';
    }
    
    const fileId = 'file_' + Math.random().toString(36).substring(2, 11);
    const language = getLanguageFromExtension(name);
    
    const yFilesMeta = (window as any).__collabFiles;
    if (yFilesMeta) {
      yFilesMeta.set(fileId, {
        id: fileId,
        name,
        language,
        isMain: false
      });
      setActiveFileId(fileId);
    }
    
    setNewFileName('');
    setIsCreating(false);
  };

  const handleRenameSubmit = (e: React.FormEvent | React.FocusEvent, fileId: string) => {
    e.preventDefault();
    if (!editFileName.trim()) {
      setEditingFileId(null);
      return;
    }
    const yFilesMeta = (window as any).__collabFiles;
    if (yFilesMeta && yFilesMeta.has(fileId)) {
      const fileData = yFilesMeta.get(fileId);
      yFilesMeta.set(fileId, { ...fileData, name: editFileName.trim(), language: getLanguageFromExtension(editFileName.trim()) });
    }
    setEditingFileId(null);
  };

  const handleDeleteFile = (fileId: string, isMain: boolean) => {
    if (isMain) return; // Cannot delete main file
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    const yFilesMeta = (window as any).__collabFiles;
    if (yFilesMeta && yFilesMeta.has(fileId)) {
      yFilesMeta.delete(fileId);
      if (activeFileId === fileId) {
        const nextFile = files.find(f => f.id !== fileId);
        if (nextFile) setActiveFileId(nextFile.id);
      }
    }
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center py-6 w-full h-full glass-dark border-r border-surface-accent z-50">
        <button 
          onClick={onToggle}
          className="w-10 h-10 flex items-center justify-center mb-6 hover:bg-white/5 rounded-2xl text-on-surface-muted hover:text-white transition-all duration-300 border border-transparent hover:border-surface-accent"
          title="Expand Explorer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
        </button>
        <div className="flex flex-col gap-3 w-full px-2" title="Expand to view files">
          {files.slice(0, 8).map(f => (
            <div 
              key={f.id} 
              onClick={() => { onToggle(); setActiveFileId(f.id); }} 
              className={`w-10 h-10 flex items-center justify-center rounded-2xl cursor-pointer transition-all duration-300 ${
                activeFileId === f.id 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' 
                  : 'text-on-surface-dim hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-sm">{getFileIcon(f.name)}</span>
            </div>
          ))}
          {files.length > 8 && (
            <div className="w-10 h-10 flex items-center justify-center rounded-2xl text-[10px] font-black text-on-surface-muted bg-surface-bright border border-surface-accent">
              +{files.length - 8}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full glass border-r border-surface-accent w-full z-50 overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-6 py-4 border-b border-surface-accent flex-shrink-0">
        <div className="flex items-center gap-3">
           <button 
             onClick={onToggle}
             className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/5 text-on-surface-dim hover:text-white transition-all border border-transparent hover:border-surface-accent"
             title="Collapse Explorer"
           >
             <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
               <path d="m11 18-6-6 6-6"/>
             </svg>
           </button>
           <h3 className="font-heading font-black text-[10px] text-primary uppercase tracking-[0.25em]">Explorer</h3>
        </div>
        <button 
          onClick={() => setIsCreating(true)}
          className="w-8 h-8 flex items-center justify-center rounded-xl bg-surface-bright border border-surface-accent text-on-surface-dim hover:text-primary hover:border-primary/50 transition-all shadow-sm"
          title="New File"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
          </svg>
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
        {files.map(file => (
          <div 
            key={file.id}
            onClick={() => setActiveFileId(file.id)}
            className={`group/file relative flex items-center justify-between px-6 py-2.5 cursor-pointer transition-all duration-300 ${
              activeFileId === file.id
                ? 'bg-primary/5 text-white'
                : 'text-on-surface-muted hover:bg-white/5 hover:text-on-surface'
            }`}
          >
            {activeFileId === file.id && (
              <div className="absolute left-0 top-2 bottom-2 w-1 bg-primary rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            )}

            {editingFileId === file.id ? (
              <form onSubmit={(e) => handleRenameSubmit(e, file.id)} className="flex-1 flex items-center gap-2.5">
                <span className="text-xs opacity-80">{getFileIcon(file.name)}</span>
                <input
                  type="text"
                  autoFocus
                  value={editFileName}
                  onChange={(e) => setEditFileName(e.target.value)}
                  onBlur={(e) => handleRenameSubmit(e, file.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditingFileId(null);
                  }}
                  className="flex-1 bg-surface-bright border-b-2 border-primary outline-none text-white text-xs font-bold py-1 px-2 rounded-t-sm"
                />
              </form>
            ) : (
              <>
                <div className="flex-1 flex items-center gap-3 truncate">
                  <span className={`text-base transition-transform duration-300 group-hover/file:scale-110 ${activeFileId === file.id ? 'opacity-100' : 'opacity-60'}`}>
                    {getFileIcon(file.name)}
                  </span>
                  <span className={`truncate text-sm font-medium ${activeFileId === file.id ? 'font-bold' : ''}`}>
                    {file.name}
                  </span>
                </div>

                <div className="opacity-0 group-hover/file:opacity-100 flex items-center gap-2 transition-opacity">
                  {!file.isMain && (
                    <>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setEditingFileId(file.id); setEditFileName(file.name); }} 
                        className="w-7 h-7 flex items-center justify-center hover:bg-white/10 rounded-lg text-on-surface-dim hover:text-white transition-all shadow-sm" 
                        title="Rename"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id, !!file.isMain); }} 
                        className="w-7 h-7 flex items-center justify-center hover:bg-red-500/20 rounded-lg text-on-surface-dim hover:text-red-400 transition-all shadow-sm" 
                        title="Delete"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
        
        {isCreating && (
          <form onSubmit={handleCreateFile} className="px-6 py-2.5 flex items-center gap-3 animate-in slide-in-from-left-2 duration-300">
            <span className="text-base opacity-40">📄</span>
            <input
              type="text"
              autoFocus
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onBlur={() => { if (!newFileName.trim()) setIsCreating(false); }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') { setIsCreating(false); setNewFileName(''); }
              }}
              placeholder="filename.ext"
              className="flex-1 bg-surface-bright border-b-2 border-primary/50 outline-none text-white text-xs font-bold py-1 px-2 rounded-t-sm placeholder-on-surface-dim/40"
            />
          </form>
        )}
      </div>

      <div className="p-6 border-t border-surface-accent bg-surface-bright/20">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-surface-bright border border-surface-accent">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_4px_rgba(16,185,129,0.8)]" />
          <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-muted">Live Sync Active</span>
        </div>
      </div>
    </div>
  );
};
