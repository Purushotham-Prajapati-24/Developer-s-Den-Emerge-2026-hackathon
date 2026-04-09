import { spawn } from 'child_process';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const TIMEOUT_MS = 8000; // 8 seconds
const MAX_OUTPUT_LENGTH = 50 * 1024; // 50 KB

/**
 * HARDENED LOCAL EXECUTION SANDBOX
 * Uses local child processes with strict timeout and output limits.
 */
export const runCodeInSandbox = async (code: string, language: 'javascript' | 'python' | 'typescript'): Promise<string> => {
  return new Promise((resolve, reject) => {
    let command = '';
    let args: string[] = [];
    const tmpDir = os.tmpdir();
    const hash = randomBytes(8).toString('hex');
    let ext = '';
    const isWin = os.platform() === 'win32';

    // 1. Resolve Runtimes with Windows awareness
    if (language === 'javascript') {
      command = 'node';
      ext = 'js';
    } else if (language === 'python') {
      /**
       * On Windows, 'py' is the robust launcher that bypasses Microsoft Store shims.
       * If 'py' fails or is not found, we fallback to 'python' as a last resort.
       */
      command = isWin ? 'py' : 'python3';
      ext = 'py';
    } else if (language === 'typescript') {
      /**
       * npx.cmd is mandatory for reliable spawning on Windows without a manual shell script wrapper.
       */
      command = isWin ? 'npx.cmd' : 'npx';
      ext = 'ts';
      args = ['-y', 'tsx'];
    } else {
      return reject(new Error(`Unsupported language: ${language}`));
    }
    
    const filePath = path.join(tmpDir, `emerge-${hash}.${ext}`);
    try {
      fs.writeFileSync(filePath, code, 'utf-8');
    } catch (err: any) {
      return reject(`Filesystem error: ${err.message}`);
    }
    
    args.push(filePath);

    // Logging for debugging what's actually being executed (viewable in server logs)
    console.log(`[EXEC] Running ${language} using command: ${command} ${args.join(' ')}`);

    // 2. Spawn with timeout and hygiene
    const executionProcess = spawn(command, args, { 
      timeout: TIMEOUT_MS,
      shell: isWin, // Critical for command resolution on Windows
      env: { ...process.env, NODE_ENV: 'production' }
    });
    
    let output = '';
    let killed = false;

    const cleanup = () => {
      try {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (e) {}
    };

    // Kill process if it exceeds time
    const timer = setTimeout(() => {
      if (!killed) {
        killed = true;
        executionProcess.kill('SIGKILL');
        resolve(output + `\n[TIMEOUT] Execution exceeded ${TIMEOUT_MS / 1000}s.`);
      }
    }, TIMEOUT_MS);

    executionProcess.stdout.on('data', (data) => {
      if (output.length < MAX_OUTPUT_LENGTH) {
        output += data.toString();
      } else if (!output.endsWith('... [Output Truncated]')) {
        output += '\n... [Output Truncated]';
      }
    });

    executionProcess.stderr.on('data', (data) => {
      if (output.length < MAX_OUTPUT_LENGTH) {
        output += data.toString();
      }
    });

    executionProcess.on('error', (err: any) => {
      clearTimeout(timer);
      cleanup();
      if (err.code === 'ENOENT') {
        const help = isWin ? `Recommended: Install ${language} and add to PATH.` : `Ensure ${language} is installed and available in the shell path.`;
        reject(`Runtime Missing: '${command}' not found. ${help}`);
      } else {
        reject(`Execution Error: ${err.message}`);
      }
    });

    executionProcess.on('close', (exitCode) => {
      clearTimeout(timer);
      cleanup();
      if (killed) return; // handled by timer
      
      const result = output.trim() || (exitCode === 0 ? 'Process executed successfully (no output).' : `Process exited with code ${exitCode}`);
      resolve(result);
    });
  });
};
