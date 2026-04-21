import { useState, useCallback } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import { useCollaborationStore } from '../../store/useCollaborationStore';

const MAX_HISTORY = 50;

interface ExecutionTerminalProps {
  defaultLanguage?: string;
}

export const ExecutionTerminal = ({ defaultLanguage = 'javascript' }: ExecutionTerminalProps) => {
  const [output, setOutput] = useState<string[]>(['// Terminal ready. Run code to see output.']);
  const [input] = useState('');
  const [running, setRunning] = useState(false);
  const { accessToken } = useAuthStore();
  const { files, activeFileId } = useCollaborationStore();
  
  const language = files.find(f => f.id === activeFileId)?.language || defaultLanguage;

  const getEditorContent = useCallback((): string => {
    const editorInstance = (window as any).__monacoEditorInstance;
    if (editorInstance) {
      return editorInstance.getValue();
    }
    return input;
  }, [input]);

  const runCode = async () => {
    if (!accessToken) {
      setOutput((prev) => [...prev.slice(-MAX_HISTORY), '⚠ Please log in to execute code.']);
      return;
    }

    const code = getEditorContent();
    if (!code.trim()) {
      setOutput((prev) => [...prev.slice(-MAX_HISTORY), '// No code to execute.']);
      return;
    }

    setRunning(true);
    setOutput((prev) => [
      ...prev.slice(-MAX_HISTORY),
      `$ Running ${language} code...`,
      '─'.repeat(60),
    ]);

    try {
      const { data } = await api.post('/execute', { code, language });
      const lines = (data.output || '').split('\n');
      setOutput((prev) => [
        ...prev.slice(-MAX_HISTORY),
        ...lines,
        '─'.repeat(60),
        `✓ Execution complete`,
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.output || 'Execution failed';
      setOutput((prev) => [
        ...prev.slice(-MAX_HISTORY),
        `✗ Error: ${msg}`,
      ]);
    } finally {
      setRunning(false);
    }
  };

  const clearTerminal = () => {
    setOutput(['// Terminal cleared.']);
  };

  return (
    <div className="flex flex-col h-full bg-surface-bright/30 font-mono text-[13px] relative group border-t border-surface-accent glass-dark">
      {/* Terminal Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-surface-accent flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50 hover:bg-red-500 transition-colors shadow-sm" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50 hover:bg-amber-500 transition-colors shadow-sm" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50 hover:bg-emerald-500 transition-colors shadow-sm" />
          </div>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-on-surface-muted" />
            <span className="font-heading font-black text-[10px] text-on-surface-dim uppercase tracking-[.2em]">Console — {language}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={clearTerminal}
            className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest text-on-surface-muted hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-surface-accent"
          >
            Reset
          </button>
          <button
            onClick={runCode}
            disabled={running}
            className={`flex items-center gap-2.5 px-6 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-500 group/run ${
              running
                ? 'bg-surface-bright text-on-surface-dim cursor-not-allowed border border-surface-accent'
                : 'bg-primary text-surface shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] border border-primary hover:scale-[1.02] active:scale-95'
            }`}
          >
            {running ? (
              <>
                <span className="w-3 h-3 border-2 border-surface/20 border-t-surface rounded-full animate-spin" />
                Executing
              </>
            ) : (
              <>
                <span className="group-hover/run:animate-pulse">▶</span>
                Run Lab
              </>
            )}
          </button>
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar leading-relaxed">
        {output.map((line, i) => (
          <div
            key={i}
            className={`mb-1 transition-all duration-300 ${
              line.startsWith('✗')
                ? 'text-red-400 font-bold bg-red-500/5 px-2 rounded-md'
                : line.startsWith('✓')
                ? 'text-primary font-bold bg-primary/5 px-2 rounded-md'
                : line.startsWith('$')
                ? 'text-cyan-400 font-bold opacity-80'
                : line.startsWith('─')
                ? 'text-surface-accent opacity-50'
                : 'text-on-surface opacity-90'
            }`}
          >
            {line}
          </div>
        ))}
        {running && (
          <div className="flex items-center gap-2 text-on-surface-dim mt-2 pl-2">
             <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
             <span className="italic opacity-50">Processing output streams...</span>
          </div>
        )}
        
        {/* Quick Fix Shortcut */}
        {!running && output.some(l => l.startsWith('✗')) && (
          <div className="mt-6 animate-in fade-in slide-in-from-left duration-700">
            <button
               onClick={async () => {
                 const terminalData = output.join('\n');
                 const { data } = await api.post('/ai/analyze-terminal', { terminalOutput: terminalData });
                 // Push to AI Store so it shows up in chat
                 const aiStore = (await import('../../store/useAIStore')).useAIStore.getState();
                 const projectId = window.location.pathname.split('/').pop() || 'temp';
                 aiStore.addMessage(projectId, { role: 'user', content: 'Explain this error and fix it.' });
                 aiStore.addMessage(projectId, { role: 'assistant', content: data.analysis });
                 // Auto-open AI panel if possible (via window event or global state)
                 window.dispatchEvent(new CustomEvent('open-ai-chat'));
               }}
               className="group flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-[#f8717110] text-red-400 border border-red-500/20 hover:bg-[#f8717120] hover:border-red-500/40 transition-all font-heading font-black text-[10px] uppercase tracking-[.2em]"
            >
              <span>🤖 Identify Root Cause</span>
              <span className="opacity-0 group-hover:opacity-100 transition-opacity ml-1">→</span>
            </button>
          </div>
        )}
      </div>

      {/* Background Decor */}
      <div className="absolute bottom-4 right-6 pointer-events-none select-none opacity-[0.03] scale-150 origin-bottom-right">
        <h2 className="text-9xl font-black italic uppercase tracking-tighter">EMERGE</h2>
      </div>
    </div>
  );
};
