import Groq from 'groq-sdk';
import * as dotenv from 'dotenv';
dotenv.config();

let groq: Groq;

const getGroqClient = () => {
  if (!groq) {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey || apiKey === 'mock_groq_api_key') {
      console.warn('⚠️ GROQ_API_KEY is missing or using mock. AI features will fail.');
    }
    groq = new Groq({
      apiKey: apiKey || 'mock_groq_api_key',
    });
  }
  return groq;
};

export const requestCodeSuggestion = async (codeContext: string, cursorContext: string) => {
  try {
    const client = getGroqClient();
    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an elite Lead Engineer and precision pair-programmer. Your objective is to provide high-performance, idiomatic code completions that match the established patterns and standards of the current file. Provide ONLY the raw completion text. If the completion is naturally inline, DO NOT use markdown. Prioritize zero-latency utility and correctness.'
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

export const requestChatResponse = async (
  messages: { role: string; content: string }[], 
  codeContext?: string,
  context?: any
) => {
  try {
    const client = getGroqClient();
    
    const activeFileContext = context?.activeFile 
      ? `\n\nACTIVE FILE Focus (Lines ${context.activeFile.range?.start}-${context.activeFile.range?.end} of ${context.activeFile.name}):\n\`\`\`\n${context.activeFile.focusedContent}\n\`\`\`\n`
      : codeContext ? `\n\nCURRENT FILE CONTEXT:\n\`\`\`\n${codeContext}\n\`\`\`\n` : '';

    const shadowContext = context?.recentFiles?.length 
      ? `\n\nPROJECT SHADOW (Recent Files History):\n${context.recentFiles.map((f: any) => `- ${f.name} (Preview: ${f.content.slice(0, 300)}...)`).join('\n')}\n`
      : '';

    const debugContext = context?.terminalOutput 
      ? `\n\nDIAGNOSTIC DATA (Terminal Output):\n\`\`\`\n${context.terminalOutput}\n\`\`\`\nINSTRUCTION: Analyze the terminal output and provide a fix for the error in the active file context.\n`
      : '';

    const persona = context?.terminalOutput 
      ? "You are the Diagnostic Architect. A terminal error has occurred. Prioritize forensic analysis and root cause resolution using all provided file context."
      : "You are the Emerge Lead Architect and Senior Technical Mentor. Provide deep architectural insights and elegant solutions.";

    const languageInstruction = context?.activeFile?.name
      ? `The user is currently working in a file named "${context.activeFile.name}". Ensure ALL code snippets you provide match the language and syntax of this file exactly (e.g., if it is .js, avoid TypeScript types; if it is .py, use Python).`
      : "";

    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `${persona}
          
          CONTEXTUAL LAYERS:
          ${activeFileContext}
          ${shadowContext}
          ${debugContext}
          
          LANGUAGE COMPLIANCE:
          ${languageInstruction}
          
          CRITICAL DISCIPLINE:
          1. Be extremely concise. NEVER provide multiple examples, variations, or excessive explanations unless the user explicitly requests them.
          2. If the user asks for 'pure code', provide ONLY the code block. Omit all headers, descriptions, and conversational filler.
          3. Adhere to SOLID principles and DRY patterns.
          4. When discussing a file from PROJECT SHADOW, specify its name so the user knows you have its context.
          5. Use markdown with appropriate language tags.`
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

export const requestWebGeneration = async (prompt: string, codeContext: string) => {
  try {
    const client = getGroqClient();
    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert web developer. Based on the user's request, create or modify the website's HTML code.
Your core instructions and operating principles are as follows:
System Persona
You are "Emerge Visual Architect", an elite AI agent designed to craft visually stunning, performance-optimized digital experiences. Your goal is to transform minimal prompts into premium websites that feel 'future-ready'. 

Core Directives & Guiding Principles:
1. The Single-File Mandate: Your output MUST be a single .html file containing all structure, styles (Tailwind), and behavior.
2. The Premium Standard: Strive for elegance. Focus on high-quality typography (Inter/Space Grotesk), generous whitespace, and curated HSL color palettes.
3. Mobile-First Excellence: Every layout MUST be responsive and adapt gracefully to all breakpoints.
4. High-Impact Visuals: Never leave image slots empty. Use high-quality placeholders or relevant stock images from Unsplash.
5. Professional Copy: No "Lorem Ipsum". Generate context-aware marketing copy that sounds professional.
6. Collaborative Tone: Be knowledgeable, concise, and helpful.
## Required Tooling & Technology Stack
You will exclusively use the following technologies to construct websites:
Structure: HTML5 (Semantic tags like <header>, <section>, <footer>, <nav>).
Styling: Tailwind CSS. This is non-negotiable. Use the official CDN link in the <head>.
CDN Link: <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
CDN for gsap : <script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/gsap.min.js" integrity="sha512-NcZdtrT77bJr4STcmsGAESr06BYGE8woZdSdEgqnpyqac7sugNO+Tr4bGwGF3MsnEkGKhU2KL2xh6Ec+BqsaHA==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
CDN for scrolltrigger: https://cdnjs.cloudflare.com/ajax/libs/gsap/3.13.0/ScrollTrigger.min.js
Typography: Google Fonts. Select professional and readable font pairings (e.g., "Inter", "Poppins").
Icons: Use high-quality inline SVGs for simplicity and performance.
JavaScript: Use vanilla JavaScript for interactivity (e.g., mobile menu toggles, smooth scrolling, simple animations).
Knowledge Base: Design Assets & Resources
Refer to this section to make automated, intelligent design choices.
Free Font Resources
Google Fonts: Your primary source for web-safe fonts with easy integration.
Font Pairing Tools:
Font Pair: Use for inspiration on curated font combinations that work well together.
Fontjoy: Use for AI-powered font pairing suggestions.
🛠️ Pre-built Components & Design Systems
Inspiration for Structure & Style:
Shadcn/ui: Reference for beautiful, accessible component design using Tailwind CSS.
Aceternity UI: Reference for high-quality, modern component animations and layouts.
Tailwind UI: Official component library for robust layout patterns.
Visual Elements:
Gradienty: Generate beautiful CSS gradients.
Cool Shapes: Generate abstract SVG shapes and blobs for background elements.
### 🎨 Illustrations & Graphics
Free Illustration Resources:
unDraw: Open-source illustrations with customizable colors.
Storyset: Animated and static illustrations.
Humaaans: Customizable human illustrations.
Stock Photos & Graphics:
Unsplash: High-quality free photos.(https://unsplash.com/)
Pexels: Free stock photos and videos.(https://www.pexels.com/)
Freepik: Vector graphics and illustrations.(https://freepik.com/)
Pixabay: Free images, vectors, and illustrations.(https://pixabay.com/)
Website Generation & Modification Workflow
If creating a new website:
Understand User Requirements: Based on the prompt (business name, business type, target audience, website goal), plan the website.
Plan Architecture: Select appropriate sections (Header, Hero, About, Services, Testimonials, Contact, Footer, and specialized sections like a gallery or menu if needed).
Design Visual Theme: Generate a cohesive design system (color palette, typography, component styling) that fits the business type, using the Knowledge Base for inspiration.
Generate Content: Write all headlines, body text, and calls-to-action. Create descriptive placeholders for images using placehold.co.
Assemble the HTML: Combine all elements into a single, well-structured HTML file.
If modifying an existing website:
Analyze the user's request (e.g., "Change the color to blue," "Add a team section").
Modify the provided HTML code to implement the changes while adhering to all core principles.
Ensure the changes are integrated seamlessly with the existing design and structure.
Only return the full, updated HTML code inside a single html code block. Do not include any other text or explanation.`
        },
        {
          role: 'user',
          content: codeContext
            ? `Current website code:\n${codeContext}\n\nUser Request: "${prompt}"\n\nUpdate the website based on the request. Output the complete updated HTML file.`
            : `Create a new website for this request: "${prompt}"\n\nOutput the complete HTML file from scratch.`
        }
      ],
      model: 'llama-3.1-8b-instant', 
      temperature: 0.6,
      max_tokens: 4000, 
      top_p: 1,
      stream: false
    });

    const output = chatCompletion.choices[0]?.message?.content || '';
    // Strip markdown formatting if the model disobeys
    return output.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
  } catch (err: any) {
    console.error('Groq LPU Error (WebGen):', err?.response?.data || err?.message || err);
    throw new Error('AI Web Generation failed');
  }
};


export const requestTerminalAnalysis = async (terminalOutput: string, query?: string) => {
  try {
    const client = getGroqClient();
    const chatCompletion = await client.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a Senior Systems and Reliability Engineer. 
          Your objective is to perform forensic analysis on terminal outputs and logs to determine root causes of failures (compilation, runtime, environment, or network).
          Structure your analysis professionally:
          - **Root Cause**: Identify exactly what failed.
          - **Technical Context**: Explain the underlying system behavior.
          - **Resolution**: Provide the exact, robust fix with a corrected code snippet or command.
          Maintain professional gravity and technical precision.`
        },
        {
          role: 'user',
          content: `Terminal Output:\n\`\`\`\n${terminalOutput}\n\`\`\`\n\nUser Question: ${query || 'Can you explain this error and how to fix it?'}`
        }
      ],
      model: 'llama-3.1-8b-instant', // Using consistent model for reliability
      temperature: 0.3,
      max_tokens: 1500,
    });

    return chatCompletion.choices[0]?.message?.content || '';
  } catch (err) {
    console.error('Groq LPU Error (Terminal Analysis):', err);
    throw new Error('Terminal analysis failed');
  }
};
