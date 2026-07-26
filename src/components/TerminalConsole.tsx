import React, { useState, useEffect, useRef } from 'react';
import {
  Terminal as TerminalIcon,
  Search,
  Trash2,
  Download,
  Play,
  Pause,
  ArrowDownCircle,
  Send,
  CornerDownLeft,
  Sparkles
} from 'lucide-react';
import { LogEntry } from '../types';

interface TerminalConsoleProps {
  logs: LogEntry[];
  onClearLogs: () => void;
  onSendTerminalCommand: (cmd: string) => Promise<void>;
  isBuilding: boolean;
}

export const TerminalConsole: React.FC<TerminalConsoleProps> = ({
  logs,
  onClearLogs,
  onSendTerminalCommand,
  isBuilding
}) => {
  const [filterText, setFilterText] = useState('');
  const [commandInput, setCommandInput] = useState('');
  const [autoScroll, setAutoScroll] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [executingCmd, setExecutingCmd] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  const filteredLogs = logs.filter(
    l => l.line.toLowerCase().includes(filterText.toLowerCase()) || l.stream.includes(filterText.toLowerCase())
  );

  useEffect(() => {
    if (autoScroll && !isPaused) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll, isPaused]);

  const handleCommandSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commandInput.trim() || executingCmd) return;
    setExecutingCmd(true);
    const cmd = commandInput;
    setCommandInput('');
    await onSendTerminalCommand(cmd);
    setExecutingCmd(false);
  };

  const handleExportLogs = () => {
    const text = logs.map(l => `[${l.timestamp}] [${l.stream.toUpperCase()}] ${l.line}`).join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexuzpi-build-${Date.now()}.log`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-2xl bg-slate-950 border border-cyan-900/40 shadow-2xl overflow-hidden flex flex-col h-[680px]">
      {/* Terminal Top Control Bar */}
      <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
          </div>
          <TerminalIcon className="w-4 h-4 text-cyan-400" />
          <span className="font-mono text-xs font-bold text-slate-200">
            Echtzeit Terminal Output (STDOUT / STDERR / STDIN)
          </span>
          {isBuilding && (
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
              LIVE STREAMING
            </span>
          )}
        </div>

        {/* Filter & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Search/Filter Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Logs filtern..."
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="pl-8 pr-3 py-1 text-xs font-mono bg-slate-950 text-slate-200 rounded-lg border border-slate-800 focus:border-cyan-500 focus:outline-none w-36 sm:w-48"
            />
          </div>

          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-all ${
              autoScroll
                ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title="Auto-Scroll Umschalten"
          >
            <ArrowDownCircle className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-1.5 rounded-lg border text-xs font-mono transition-all ${
              isPaused
                ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800'
            }`}
            title={isPaused ? 'Fortsetzen' : 'Pausieren'}
          >
            {isPaused ? <Play className="w-4 h-4 text-amber-400" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={handleExportLogs}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
            title="Logs Herunterladen"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={onClearLogs}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 text-slate-400 hover:text-red-400 border border-slate-800 transition-all"
            title="Konsole Leeren"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Content Stream Output Window */}
      <div className="flex-1 p-4 font-mono text-xs overflow-y-auto space-y-1 select-text bg-slate-950 scrollbar-thin scrollbar-thumb-slate-800">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
            <Sparkles className="w-8 h-8 text-cyan-500/40 animate-pulse" />
            <p>Keine Konsolenausgaben vorhanden. Starte einen Build um Echtzeit-Logs zu empfangen.</p>
          </div>
        ) : (
          filteredLogs.map((entry, idx) => {
            let textColor = 'text-slate-300';
            let badgeBg = 'bg-slate-900 text-slate-400';

            if (entry.stream === 'stderr') {
              textColor = 'text-red-400 font-semibold';
              badgeBg = 'bg-red-950/80 text-red-300 border border-red-500/30';
            } else if (entry.stream === 'system') {
              textColor = 'text-cyan-300 font-semibold';
              badgeBg = 'bg-cyan-950/80 text-cyan-300 border border-cyan-500/30';
            } else if (entry.line.includes('SUCCESS') || entry.line.includes('erfolgreich')) {
              textColor = 'text-emerald-400 font-bold';
            } else if (entry.line.includes('ERR') || entry.line.includes('Fehler')) {
              textColor = 'text-fuchsia-400 font-bold';
            }

            return (
              <div key={idx} className="flex items-start gap-2 leading-relaxed hover:bg-slate-900/50 rounded px-1 py-0.5 transition-colors">
                <span className="text-[10px] text-slate-500 select-none shrink-0 pt-0.5">
                  [{entry.timestamp}]
                </span>
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 ${badgeBg}`}>
                  {entry.stream}
                </span>
                <span className={`break-all whitespace-pre-wrap ${textColor}`}>
                  {entry.line}
                </span>
              </div>
            );
          })
        )}
        <div ref={logsEndRef} />
      </div>

      {/* Interactive Command STDIN Input Line */}
      <form onSubmit={handleCommandSubmit} className="p-3 bg-slate-900/90 border-t border-slate-800 flex items-center gap-2">
        <span className="font-mono text-cyan-400 font-bold text-sm shrink-0 flex items-center gap-1">
          <span className="text-fuchsia-400">nexuzpi@bcm2712</span>:<span className="text-emerald-400">~/work</span>$
        </span>
        <input
          type="text"
          value={commandInput}
          onChange={e => setCommandInput(e.target.value)}
          placeholder="Befehl im Workspace ausführen (z.B. ls -la, make -v, python3 --version)..."
          disabled={executingCmd}
          className="flex-1 bg-slate-950 text-slate-100 font-mono text-xs px-3 py-2 rounded-lg border border-slate-800 focus:border-cyan-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={executingCmd || !commandInput.trim()}
          className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,243,255,0.3)] transition-all"
        >
          {executingCmd ? (
            <span className="animate-spin text-slate-950">⌛</span>
          ) : (
            <>
              <span>Execute</span>
              <CornerDownLeft className="w-3 h-3" />
            </>
          )}
        </button>
      </form>
    </div>
  );
};
