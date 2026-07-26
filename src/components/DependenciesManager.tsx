import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Download, Terminal, Copy, Check, RefreshCw } from 'lucide-react';
import { SystemDependency } from '../types';

interface DependenciesManagerProps {
  onInstallDeps: () => void;
}

export const DependenciesManager: React.FC<DependenciesManagerProps> = ({ onInstallDeps }) => {
  const [dependencies, setDependencies] = useState<SystemDependency[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeToolchainPrefix, setActiveToolchainPrefix] = useState('aarch64-linux-gnu-');

  const fetchDeps = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system-deps');
      const data = await res.json();
      if (data.dependencies) {
        setDependencies(data.dependencies);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeps();
  }, []);

  const exportScript = `# NexuzPi OS Cross-Compile Environment Exports for BCM2712 (ARM64)
# Metanexuz.de / Nexuzcode.de

export ARCH=arm64
export CROSS_COMPILE=${activeToolchainPrefix}
export SYSROOT=$HOME/nexuzpi-development/work/build/rootfs
export PATH=$PATH:$SYSROOT/usr/bin:$SYSROOT/bin

# Build flags
export CFLAGS="-O2 -mcpu=cortex-a76 -march=armv8.2-a+crypto"
export CXXFLAGS="-O2 -mcpu=cortex-a76 -march=armv8.2-a+crypto"
echo "[NEXUZ-PI] ARM64 Cross-Compile Umgebung für BCM2712 geladen!"
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(exportScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const installedCount = dependencies.filter(d => d.installed).length;

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-900/40 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            <h2 className="text-lg font-bold font-mono text-slate-100">
              Ubuntu/Debian Firmware Entwicklungs-Abhängigkeiten
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl font-sans">
            Automatische Prüfung & Installation aller benötigten Toolchains, Cross-Compiler, C-Bibliotheken (GNU, Musl, uClibc) und Build-Tools für das Raspberry Pi 5 (BCM2712 ARM64).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDeps}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-all"
            title="Prüfung wiederholen"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onInstallDeps}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-mono text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_15px_rgba(0,243,255,0.25)] transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Fehlende Pakete Installieren (apt-get)</span>
          </button>
        </div>
      </div>

      {/* Package Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {dependencies.map(dep => (
          <div
            key={dep.pkg}
            className={`p-4 rounded-xl border transition-all ${
              dep.installed
                ? 'bg-slate-900/60 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.05)]'
                : 'bg-slate-900/40 border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-slate-200">{dep.pkg}</span>
              {dep.installed ? (
                <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30">
                  <CheckCircle className="w-3 h-3" /> Installiert
                </span>
              ) : (
                <span className="flex items-center gap-1 text-[11px] font-mono text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-500/30">
                  <XCircle className="w-3 h-3" /> Fehlt
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Cross-Compiler Environment Export Generator */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-fuchsia-900/40 shadow-2xl relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
              <Terminal className="w-5 h-5 text-fuchsia-400" />
              Cross-Compiler Environment Export Script
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Setzt die Pfade <code className="text-fuchsia-400">ARCH=arm64</code>, <code className="text-fuchsia-400">CROSS_COMPILE</code> und den Sysroot Pfad.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={activeToolchainPrefix}
              onChange={e => setActiveToolchainPrefix(e.target.value)}
              className="bg-slate-900 text-fuchsia-300 text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none"
            >
              <option value="aarch64-linux-gnu-">GNU (aarch64-linux-gnu-)</option>
              <option value="aarch64-linux-musl-">Musl (aarch64-linux-musl-)</option>
              <option value="aarch64-buildroot-linux-uclibc-">uClibc (aarch64-buildroot-linux-uclibc-)</option>
            </select>

            <button
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 font-mono text-xs border border-slate-800 transition-all"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
            </button>
          </div>
        </div>

        <pre className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-200 overflow-x-auto leading-relaxed select-all">
          {exportScript}
        </pre>
      </div>
    </div>
  );
};
