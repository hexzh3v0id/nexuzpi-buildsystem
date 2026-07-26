import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BuildDashboard } from './components/BuildDashboard';
import { TerminalConsole } from './components/TerminalConsole';
import { RootfsExplorer } from './components/RootfsExplorer';
import { DependenciesManager } from './components/DependenciesManager';
import { HardwareConfigurator } from './components/HardwareConfigurator';
import { FhsComparisonModal } from './components/FhsComparisonModal';
import { AppConfig, LogEntry, FhsLayoutType, ToolchainType } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [config, setConfig] = useState<AppConfig | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isFhsModalOpen, setIsFhsModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Fetch App Configuration
  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      setConfig(data);
    } catch (err) {
      console.error('Fehler beim Laden der App-Konfiguration:', err);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  // Set up Server-Sent Events (SSE) Stream
  useEffect(() => {
    const eventSource = new EventSource('/api/build/stream');

    eventSource.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        if (data.type === 'init') {
          if (data.logs) setLogs(data.logs);
          setConfig(prev => prev ? {
            ...prev,
            progress: data.progress,
            eventState: data.event,
            statusMessage: data.message,
            activeBuild: data.activeBuild
          } : null);
        } else if (data.type === 'progress') {
          setConfig(prev => prev ? {
            ...prev,
            progress: data.progress,
            eventState: data.event,
            statusMessage: data.message,
            activeBuild: true
          } : null);
        } else if (data.type === 'log') {
          setLogs(prev => [...prev.slice(-1500), data.log]);
        } else if (data.type === 'finished') {
          setConfig(prev => prev ? {
            ...prev,
            progress: data.progress,
            eventState: 'FINISHED',
            statusMessage: data.message,
            activeBuild: false
          } : null);
          setNotification({ type: 'success', message: 'Build erfolgreich abgeschlossen! RootFS liegt in work/build/rootfs bereit.' });
        } else if (data.type === 'cancelled') {
          setConfig(prev => prev ? {
            ...prev,
            eventState: 'CANCELLED',
            statusMessage: data.message,
            activeBuild: false
          } : null);
          setNotification({ type: 'info', message: 'Build wurde abgebrochen.' });
        }
      } catch (err) {
        console.error('SSE Stream Error:', err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const handleStartBuild = async (fhs: FhsLayoutType, toolchain: ToolchainType, dryRun: boolean) => {
    try {
      const res = await fetch('/api/build/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fhs, toolchain, dryRun })
      });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: 'info', message: `Build gestartet mit Layout ${fhs.toUpperCase()} und Toolchain ${toolchain.toUpperCase()}` });
      } else {
        setNotification({ type: 'error', message: data.error || 'Fehler beim Starten des Builds' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleCancelBuild = async () => {
    try {
      await fetch('/api/build/cancel', { method: 'POST' });
    } catch (err: any) {
      console.error(err);
    }
  };

  const handleInstallDeps = async () => {
    setNotification({ type: 'info', message: 'Starte Paket-Installation via apt-get...' });
    try {
      const res = await fetch('/api/install-deps', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setNotification({ type: 'success', message: 'System-Abhängigkeiten erfolgreich installiert!' });
      } else {
        setNotification({ type: 'error', message: data.error || 'Fehler bei der Installation' });
      }
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    }
  };

  const handleSendTerminalCommand = async (command: string) => {
    try {
      await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
    } catch (err: any) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Toast Notification Banner */}
      {notification && (
        <div className="fixed top-20 right-4 z-50 max-w-md animate-slideIn">
          <div className={`p-4 rounded-xl border shadow-2xl flex items-center justify-between gap-3 text-xs font-mono ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-200'
              : notification.type === 'error'
              ? 'bg-red-950 border-red-500 text-red-200'
              : 'bg-cyan-950 border-cyan-500 text-cyan-200'
          }`}>
            <span>{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-200 font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main App Header */}
      <Header
        config={config}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onInstallDeps={handleInstallDeps}
      />

      {/* Main Workspace Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <BuildDashboard
            config={config}
            onStartBuild={handleStartBuild}
            onCancelBuild={handleCancelBuild}
            onOpenTerminal={() => setActiveTab('terminal')}
            onOpenFhsModal={() => setIsFhsModalOpen(true)}
          />
        )}

        {activeTab === 'terminal' && (
          <TerminalConsole
            logs={logs}
            onClearLogs={() => setLogs([])}
            onSendTerminalCommand={handleSendTerminalCommand}
            isBuilding={config?.activeBuild || false}
          />
        )}

        {activeTab === 'explorer' && (
          <RootfsExplorer rootfsDir={config?.rootfsDir || ''} />
        )}

        {activeTab === 'dependencies' && (
          <DependenciesManager onInstallDeps={handleInstallDeps} />
        )}

        {activeTab === 'hardware' && (
          <HardwareConfigurator />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 px-4 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>NexuzPi OS Buildsystem • Raspberry Pi 5 (BCM2712 ARM64)</span>
          <div className="flex items-center gap-3 text-slate-400">
            <a href="https://metanexuz.de" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">
              metanexuz.de
            </a>
            <span>•</span>
            <a href="https://nexuzcode.de" target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline">
              nexuzcode.de
            </a>
          </div>
        </div>
      </footer>

      {/* FHS Comparison Modal */}
      <FhsComparisonModal
        isOpen={isFhsModalOpen}
        onClose={() => setIsFhsModalOpen(false)}
      />
    </div>
  );
}
