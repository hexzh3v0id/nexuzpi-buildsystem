import express, { Response } from 'express';
import path from 'path';
import os from 'os';
import fs from 'fs';
import { spawn, exec, ChildProcess } from 'child_process';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());

// Workspace directories
const APP_DIR = path.join(os.homedir(), 'nexuzpi-development');
const WORK_DIR = path.join(APP_DIR, 'work');
const ROOTFS_DIR = path.join(WORK_DIR, 'build', 'rootfs');
const LOGS_DIR = path.join(WORK_DIR, 'logs');

// Ensure base directories exist
[APP_DIR, WORK_DIR, ROOTFS_DIR, LOGS_DIR].forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

// Active build process state
let activeBuildProcess: ChildProcess | null = null;
let currentProgress = 0;
let currentEvent = 'IDLE';
let currentMessage = 'Bereit für Build-Start';
const logHistory: Array<{ timestamp: string; stream: 'stdout' | 'stderr' | 'system'; line: string }> = [];
const sseClients: Response[] = [];

// Helper to broadcast SSE event to all connected web clients
function broadcastSSE(data: object) {
  const payload = `data: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach(res => {
    try {
      res.write(payload);
    } catch {
      // Ignore broken connections
    }
  });
}

function pushLog(stream: 'stdout' | 'stderr' | 'system', line: string) {
  const entry = {
    timestamp: new Date().toLocaleTimeString('de-DE'),
    stream,
    line
  };
  logHistory.push(entry);
  if (logHistory.length > 2000) logHistory.shift();
  broadcastSSE({ type: 'log', log: entry });
}

// 1. App Configuration Endpoint
app.get('/api/config', (req, res) => {
  res.json({
    appDir: APP_DIR,
    workDir: WORK_DIR,
    rootfsDir: ROOTFS_DIR,
    organization: 'Metanexuz.de / Nexuzcode.de',
    targetDevice: 'Raspberry Pi 5 (BCM2712 ARM64)',
    fhsLayouts: [
      {
        id: 'standard',
        name: 'Standard FHS Layout',
        description: 'Klassische Linux Hierarchie (/bin, /etc, /lib, /usr, /var, /home, /dev, /proc, /tmp...)',
        readOnly: false
      },
      {
        id: 'readonly',
        name: 'Nexuz-Secure Read-Only FHS',
        description: 'Unveränderliches System (/usr, /bin RO). Nutzt OverlayFS & tmpfs für /var, /tmp & /etc',
        readOnly: true
      }
    ],
    toolchains: [
      { id: 'gnu', name: 'GNU Toolchain', prefix: 'aarch64-linux-gnu-', lib: 'glibc' },
      { id: 'musl', name: 'Musl Toolchain', prefix: 'aarch64-linux-musl-', lib: 'musl' },
      { id: 'uclibc', name: 'uClibc Toolchain', prefix: 'aarch64-buildroot-linux-uclibc-', lib: 'uclibc' }
    ],
    activeBuild: activeBuildProcess !== null,
    progress: currentProgress,
    statusMessage: currentMessage,
    eventState: currentEvent
  });
});

// 2. System Dependencies Check Endpoint
app.get('/api/system-deps', (req, res) => {
  exec('which aarch64-linux-gnu-gcc musl-gcc git make bison flex bc rsync tar cpio python3', (err, stdout) => {
    const found = stdout.split('\n').map(s => s.trim()).filter(Boolean);
    const deps = [
      { pkg: 'gcc-aarch64-linux-gnu', installed: found.some(p => p.includes('aarch64-linux-gnu-gcc')) },
      { pkg: 'musl-tools', installed: found.some(p => p.includes('musl-gcc')) },
      { pkg: 'git', installed: found.some(p => p.includes('git')) },
      { pkg: 'make', installed: found.some(p => p.includes('make')) },
      { pkg: 'bison', installed: found.some(p => p.includes('bison')) },
      { pkg: 'flex', installed: found.some(p => p.includes('flex')) },
      { pkg: 'bc', installed: found.some(p => p.includes('bc')) },
      { pkg: 'rsync', installed: found.some(p => p.includes('rsync')) },
      { pkg: 'tar', installed: found.some(p => p.includes('tar')) },
      { pkg: 'cpio', installed: found.some(p => p.includes('cpio')) },
      { pkg: 'python3', installed: found.some(p => p.includes('python3')) }
    ];
    res.json({ dependencies: deps });
  });
});

// 3. Install System Dependencies via apt-get
app.post('/api/install-deps', (req, res) => {
  pushLog('system', '[DEPS] Starte Installation der System-Abhängigkeiten via apt-get...');
  
  const cmd = 'apt-get update && apt-get install -y gcc-aarch64-linux-gnu g++-aarch64-linux-gnu musl-tools git make bison flex bc rsync tar cpio python3';
  
  exec(cmd, (error, stdout, stderr) => {
    if (stdout) pushLog('stdout', stdout);
    if (stderr) pushLog('stderr', stderr);
    
    if (error) {
      pushLog('stderr', `[DEPS] Fehler bei Paketinstallation: ${error.message}`);
      res.status(500).json({ error: error.message });
    } else {
      pushLog('system', '[DEPS] Paketinstallation erfolgreich abgeschlossen!');
      res.json({ success: true, message: 'Pakete erfolgreich installiert' });
    }
  });
});

// 4. Start Build Process
app.post('/api/build/start', (req, res) => {
  if (activeBuildProcess) {
    res.status(400).json({ error: 'Ein Build-Prozess läuft bereits!' });
    return;
  }

  const { fhs = 'standard', toolchain = 'gnu', dryRun = false } = req.body;

  logHistory.length = 0; // Clear previous logs
  currentProgress = 0;
  currentEvent = 'START';
  currentMessage = 'Starte Python Build Engine...';

  pushLog('system', `[BUILD START] FHS Layout: ${fhs.toUpperCase()} | Toolchain: ${toolchain.toUpperCase()}`);

  const enginePath = path.join(process.cwd(), 'nexuzpi_engine.py');
  const args = [
    enginePath,
    '--fhs', fhs,
    '--toolchain', toolchain,
    '--app-dir', APP_DIR
  ];
  if (dryRun) args.push('--dry-run');

  try {
    activeBuildProcess = spawn('python3', args, { cwd: process.cwd() });

    activeBuildProcess.stdout?.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n');
      lines.forEach(line => {
        if (!line.trim()) return;
        if (line.includes('__NEXUZ_EVENT__')) {
          try {
            const rawJson = line.split('__NEXUZ_EVENT__')[1];
            const eventObj = JSON.parse(rawJson);
            if (eventObj.progress !== undefined) currentProgress = eventObj.progress;
            if (eventObj.event) currentEvent = eventObj.event;
            if (eventObj.message) currentMessage = eventObj.message;

            broadcastSSE({
              type: 'progress',
              progress: currentProgress,
              event: currentEvent,
              message: currentMessage,
              details: eventObj.details
            });
          } catch {
            pushLog('stdout', line);
          }
        } else if (line.includes('__NEXUZ_LOG__')) {
          try {
            const rawJson = line.split('__NEXUZ_LOG__')[1];
            const logObj = JSON.parse(rawJson);
            pushLog(logObj.stream || 'stdout', logObj.line);
          } catch {
            pushLog('stdout', line);
          }
        } else {
          pushLog('stdout', line);
        }
      });
    });

    activeBuildProcess.stderr?.on('data', (data: Buffer) => {
      pushLog('stderr', data.toString().trim());
    });

    activeBuildProcess.on('close', (code) => {
      activeBuildProcess = null;
      if (code === 0) {
        currentProgress = 100;
        currentEvent = 'FINISHED';
        currentMessage = 'Build erfolgreich abgeschlossen!';
        pushLog('system', '[BUILD COMPLETE] RootFS wurde erfolgreich erstellt!');
      } else {
        currentEvent = 'FAILED';
        currentMessage = `Build fehlgeschlagen mit Fehlercode ${code}`;
        pushLog('stderr', `[BUILD FAILED] Prozess beendet mit Code ${code}`);
      }

      broadcastSSE({
        type: 'finished',
        code,
        progress: currentProgress,
        message: currentMessage
      });
    });

    res.json({ success: true, message: 'Build wurde gestartet' });
  } catch (err: any) {
    activeBuildProcess = null;
    res.status(500).json({ error: err.message });
  }
});

// 5. Cancel Build Process
app.post('/api/build/cancel', (req, res) => {
  if (activeBuildProcess) {
    activeBuildProcess.kill('SIGTERM');
    activeBuildProcess = null;
    currentEvent = 'CANCELLED';
    currentMessage = 'Build manuell abgebrochen';
    pushLog('system', '[BUILD CANCELLED] Vom Benutzer abgebrochen');
    broadcastSSE({ type: 'cancelled', message: currentMessage });
    res.json({ success: true, message: 'Build wurde abgebrochen' });
  } else {
    res.status(400).json({ error: 'Kein aktiver Build-Prozess' });
  }
});

// 6. SSE Real-time Streaming Endpoint
app.get('/api/build/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send initial snapshot
  res.write(`data: ${JSON.stringify({
    type: 'init',
    progress: currentProgress,
    event: currentEvent,
    message: currentMessage,
    activeBuild: activeBuildProcess !== null,
    logs: logHistory.slice(-500)
  })}\n\n`);

  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) sseClients.splice(idx, 1);
  });
});

// 7. RootFS File Tree Explorer
function getDirTree(dirPath: string, relativeBase = ''): any[] {
  if (!fs.existsSync(dirPath)) return [];
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  return entries.map(ent => {
    const full = path.join(dirPath, ent.name);
    const rel = path.join(relativeBase, ent.name);
    const stats = fs.statSync(full);

    if (ent.isDirectory()) {
      return {
        name: ent.name,
        path: rel,
        type: 'directory',
        children: getDirTree(full, rel)
      };
    } else {
      return {
        name: ent.name,
        path: rel,
        type: 'file',
        size: stats.size,
        mode: (stats.mode & 0o777).toString(8)
      };
    }
  });
}

app.get('/api/rootfs/tree', (req, res) => {
  if (!fs.existsSync(ROOTFS_DIR)) {
    res.json({ exists: false, tree: [] });
    return;
  }
  const tree = getDirTree(ROOTFS_DIR);
  res.json({ exists: true, rootfsDir: ROOTFS_DIR, tree });
});

// 8. View specific file contents from RootFS
app.get('/api/rootfs/file', (req, res) => {
  const relPath = req.query.path as string;
  if (!relPath) {
    res.status(400).json({ error: 'Pfad erforderlich' });
    return;
  }
  const target = path.join(ROOTFS_DIR, relPath);
  if (!target.startsWith(ROOTFS_DIR)) {
    res.status(403).json({ error: 'Sicherheitsfehler: Zugriff verweigert' });
    return;
  }
  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    const content = fs.readFileSync(target, 'utf-8');
    res.json({ path: relPath, content });
  } else {
    res.status(404).json({ error: 'Datei nicht gefunden' });
  }
});

// 9. Interactive Custom Terminal Command Runner
app.post('/api/terminal/exec', (req, res) => {
  const { command } = req.body;
  if (!command) {
    res.status(400).json({ error: 'Befehl erforderlich' });
    return;
  }

  pushLog('system', `$ ${command}`);
  exec(command, { cwd: APP_DIR }, (err, stdout, stderr) => {
    if (stdout) pushLog('stdout', stdout);
    if (stderr) pushLog('stderr', stderr);
    if (err) {
      res.json({ success: false, error: err.message, stdout, stderr });
    } else {
      res.json({ success: true, stdout, stderr });
    }
  });
});

async function startServer() {
  // Vite middleware in development mode
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NEXUZPI OS SERVER] Running on http://localhost:${PORT}`);
  });
}

startServer();
