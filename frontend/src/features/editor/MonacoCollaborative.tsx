import { useEffect, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { CollaborationEngine } from './yjsProvider';
import { useAuthStore } from '../../store/useAuthStore';
import './collaboration.css';

interface MonacoCollaborativeProps {
  projectId: string;
  language?: string;
  role?: string;
}

// Deterministic color from user ID so the same user always gets the same color
function colorFromId(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 70%, 65%)`;
}

export const MonacoCollaborative = ({ projectId, language = 'typescript', role = 'editor' }: MonacoCollaborativeProps) => {
  const editorRef = useRef<any>(null);
  const engineRef = useRef<CollaborationEngine | null>(null);
  const [engineReady, setEngineReady] = useState(false);
  const { user } = useAuthStore();

  // owner and editor roles can type; reader/commenter cannot
  const isReadOnly = role === 'reader' || role === 'commenter';
  // Note: 'owner' and 'editor' both allow editing

  const handleEditorDidMount = (editor: any, monacoInstance: any) => {
    editorRef.current = editor;
    (window as any).__monacoEditorInstance = editor;

    // Kinetic Terminal theme
    monacoInstance.editor.defineTheme('kinetic-terminal', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', background: '0a0e14' },
        { token: 'keyword', foreground: 'b6a0ff' },
        { token: 'string', foreground: '98d379' },
        { token: 'comment', foreground: '4a5568', fontStyle: 'italic' },
        { token: 'number', foreground: 'e5c07b' },
      ],
      colors: {
        'editor.background': '#0a0e14',
        'editor.foreground': '#abb2bf',
        'editorCursor.foreground': '#a78bfa',
        'editor.selectionBackground': '#a78bfa30',
        'editor.lineHighlightBackground': '#ffffff06',
        'editorIndentGuide.background': '#ffffff0a',
        'editorIndentGuide.activeBackground': '#ffffff2a',
        'editorLineNumber.foreground': '#3a4458',
        'editorLineNumber.activeForeground': '#8a98b3',
      },
    });
    monacoInstance.editor.setTheme('kinetic-terminal');

    setEngineReady(true);
  };

  useEffect(() => {
    if (!user || !editorRef.current || !engineReady) return;

    const userId = user.id || user._id || 'anon';
    const userName = user.name || user.username || 'Anonymous';

    // Tear down previous engine
    if (engineRef.current) {
      engineRef.current.disconnect();
      engineRef.current = null;
    }

    const engine = new CollaborationEngine();
    engineRef.current = engine;

    // Expose globally so ChatPanel can call engine.sendMessage()
    (window as any).__collabEngine = engine;

    engine.connect({
      projectId,
      user: {
        id: userId,
        name: userName,
        color: colorFromId(userId),
      },
      editor: editorRef.current,
      monacoModel: editorRef.current.getModel(),
    });

    return () => {
      engine.disconnect();
      engineRef.current = null;
      (window as any).__collabEngine = null;
    };
  }, [user, projectId, engineReady]);

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-[#0a0e14] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={`// ${language} workspace — start coding collaboratively!\n`}
        onMount={handleEditorDidMount}
        options={{
          readOnly: isReadOnly,
          fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          fontLigatures: true,
          fontSize: 14,
          lineHeight: 24,
          minimap: { enabled: false },
          renderLineHighlight: 'line',
          hideCursorInOverviewRuler: true,
          scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
          padding: { top: 16, bottom: 16 },
          smoothScrolling: true,
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          bracketPairColorization: { enabled: true },
          suggest: { showIcons: true },
          tabSize: 2,
        }}
      />
      {isReadOnly && (
        <div className="absolute top-3 right-4 px-2 py-0.5 rounded text-[10px] font-mono bg-[#1e2a3a] text-[#8a98b3]">
          read-only
        </div>
      )}
    </div>
  );
};
