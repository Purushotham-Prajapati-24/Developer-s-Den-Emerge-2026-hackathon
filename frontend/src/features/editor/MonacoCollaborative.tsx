import { useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { CollaborationEngine } from './yjsProvider';
import { useAuthStore } from '../../store/useAuthStore';
import './collaboration.css'; // Contains the "Kinetic Terminal" glassmorphic cursor styles

interface MonacoCollaborativeProps {
  projectId: string;
  language?: string;
  role?: string;
}

export const MonacoCollaborative = ({ projectId, language = 'typescript', role = 'reader' }: MonacoCollaborativeProps) => {
  const editorRef = useRef<any>(null);
  const collabEngineRef = useRef<CollaborationEngine>(new CollaborationEngine());
  const { user } = useAuthStore();

  const isReadOnly = role === 'reader' || role === 'commenter';


  const handleEditorDidMount = (editor: any, monacoInstance: any) => {
    editorRef.current = editor;
    // Expose globally so ExecutionTerminal and AIChatPanel can access current code
    (window as any).__monacoEditorInstance = editor;

    // Apply Editorial Design.md Rules: Minimalist theme overlay
    monacoInstance.editor.defineTheme('kinetic-terminal', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { background: '0a0e14' },
        { token: 'keyword', foreground: 'b6a0ff' }
      ],
      colors: {
        'editor.background': '#0a0e14',
        'editorIndentGuide.background': '#ffffff0a',
        'editorIndentGuide.activeBackground': '#ffffff2a'
      }
    });
    monacoInstance.editor.setTheme('kinetic-terminal');
  };

  useEffect(() => {
    // Mount Yjs Bindings only when both Editor and User are ready
    if (!user || !editorRef.current) return;
    
    collabEngineRef.current.connect({
      projectId,
      user: {
        id: user.id || user._id || 'anon',
        name: user.name || 'Anonymous',
        color: '#00e3fd' 
      },
      editor: editorRef.current,
      monacoModel: editorRef.current.getModel()
    });

    return () => {
      collabEngineRef.current.disconnect();
    };
  }, [user, projectId]); // Re-connect if user or project changes

  return (
    <div className="w-full h-full relative rounded-xl overflow-hidden bg-[#0a0e14] shadow-[0_12px_40px_rgba(0,0,0,0.5)]">
      <Editor
        height="100%"
        defaultLanguage={language}
        defaultValue={`// Start coding collaboratively in ${language}...\n`}
        onMount={handleEditorDidMount}
        options={{
          readOnly: isReadOnly,
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 14,
          lineHeight: 24,
          minimap: { enabled: false }, // Minimal setup
          renderLineHighlight: 'none',
          hideCursorInOverviewRuler: true,
          scrollbar: { verticalScrollbarSize: 8 },
        }}
      />
    </div>
  );
};
