import { execSync } from 'child_process';

const port = Number(process.env.PORT || 5000);

function findListeningPid() {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    const lines = output.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    for (const line of lines) {
      if (!line.includes('LISTENING')) continue;
      const parts = line.split(/\s+/);
      const pid = Number(parts[parts.length - 1]);
      if (Number.isFinite(pid)) {
        return pid;
      }
    }
  } catch {
    return null;
  }
  return null;
}

const pid = findListeningPid();

if (pid) {
  try {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'inherit' });
    console.log(`Freed port ${port} by stopping PID ${pid}`);
  } catch (error) {
    console.error(`Could not free port ${port}. Stop PID ${pid} manually.`);
    process.exit(1);
  }
} else {
  console.log(`Port ${port} is free.`);
}