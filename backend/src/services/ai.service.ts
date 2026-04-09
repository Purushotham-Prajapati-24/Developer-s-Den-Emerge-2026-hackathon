import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'mock_groq_api_key'
});

export const requestCodeSuggestion = async (codeContext: string, cursorContext: string) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an elite pair-programmer integrated into the DevVerse Kinetic Terminal. Provide ONLY raw code suggestions that smoothly complete the current statement. DO NOT wrap code in markdown tags if it is an inline completion.'
        },
        {
          role: 'user',
          content: `Here is the current file context:\n${codeContext}\n\nI am currently typing exactly here: ${cursorContext}. Provide the most highly optimized, production-ready completion snippet.`
        }
      ],
      model: 'llama-3.1-8b-instant', // Blazing fast for instant autocomplete
      temperature: 0.1, // Low temp for logic/code rigidity
      max_tokens: 150, // Keep it short and fast
      top_p: 1,
      stream: false
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('Groq LPU Error (Autocomplete):', err);
    throw new Error('AI suggestion failed');
  }
};

export const requestChatResponse = async (messages: { role: string; content: string }[]) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are the DevVerse AI Assistant. You help developers with code analysis, debugging, and project structure. Be concise, technical, and helpful. Use markdown for code blocks.'
        },
        ...messages.map(m => ({ role: m.role as 'user' | 'assistant' | 'system', content: m.content }))
      ],
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 1024,
      top_p: 1,
      stream: false
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('Groq LPU Error (Chat):', err);
    throw new Error('AI chat failed');
  }
};

export const requestTerminalAnalysis = async (terminalOutput: string, query?: string) => {
  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are the DevVerse Terminal Expert. Your goal is to analyze terminal outputs, explain errors (like stack traces, compilation errors, or runtime failures), and suggest specific fixes. 
          Respond in concise markdown. If it's a code error, provide the corrected snippet.`
        },
        {
          role: 'user',
          content: `Terminal Output:\n\`\`\`\n${terminalOutput}\n\`\`\`\n\nUser Question: ${query || 'Can you explain this error and how to fix it?'}`
        }
      ],
      model: 'llama-3.1-70b-versatile', // Using a larger model for complex debugging
      temperature: 0.3,
      max_tokens: 1500,
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('Groq LPU Error (Terminal Analysis):', err);
    throw new Error('Terminal analysis failed');
  }
};
