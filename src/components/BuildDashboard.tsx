import React, { useState } from 'react';
import {
  Play,
  Square,
  HardDrive,
  Cpu,
  Layers,
  GitBranch,
  ShieldAlert,
  FolderTree,
  CheckCircle2,
  AlertCircle,
  Download,
  Terminal,
  Zap,
  Info
} from 'lucide-react';
import { FhsLayoutType, ToolchainType, AppConfig } from '../types';

interface BuildDashboardProps {
  config: AppConfig | null;
  onStartBuild: (fhs: FhsLayoutType, toolchain: ToolchainType, dryRun: boolean) => void;
  onCancelBuild: () => void;
  onOpenTerminal: () => void;
  onOpenFhsModal: () => void;
}

export const BuildDashboard: React.FC<BuildDashboardProps> = ({
  config,
  onStartBuild,
  onCancelBuild,
  onOpenTerminal,
  onOpenFhsModal
}) => {
  const [selectedFhs, setSelectedFhs] = useState<FhsLayoutType>('standard');
  const [selectedToolchain, setSelectedToolchain] = useState<ToolchainType>('gnu');
  const [useDemoMode, setUseDemoMode] = useState<boolean>(false);

  const isBuilding = config?.activeBuild || false;
  const progress = config?.progress || 0;
  const eventState = config?.eventState || 'IDLE';
  const statusMessage = config?.statusMessage || 'Bereit zum Starten';

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: App Folder */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-900/50 shadow-[0_0_15px_rgba(0,243,255,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950 text-cyan-400 border border-cyan-500/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400">App Verzeichnis ($HOME)</span>
              <p className="text-sm font-mono font-semibold text-slate-200 truncate max-w-[200px]" title={config?.appDir}>
                {config?.appDir || '~/nexuzpi-development'}
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400 flex justify-between">
            <span>Work Ordner:</span>
            <span className="text-cyan-400 font-semibold">work/build/rootfs</span>
          </div>
        </div>

        {/* Card 2: Target Hardware */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-fuchsia-900/50 shadow-[0_0_15px_rgba(217,70,239,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-2xl group-hover:bg-fuchsia-500/20 transition-all" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-fuchsia-950 text-fuchsia-400 border border-fuchsia-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400">Ziel-Plattform</span>
              <p className="text-sm font-mono font-semibold text-fuchsia-300">
                Raspberry Pi 5 (BCM2712)
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400 flex justify-between">
            <span>Architektur:</span>
            <span className="text-fuchsia-400 font-semibold">ARM64 / aarch64</span>
          </div>
        </div>

        {/* Card 3: Organization */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-emerald-900/50 shadow-[0_0_15px_rgba(16,185,129,0.05)] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all" />
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-500/30">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-mono text-slate-400">Entwickler Organisation</span>
              <p className="text-sm font-mono font-semibold text-emerald-300">
                Metanexuz.de / Nexuzcode.de
              </p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-slate-800 text-xs font-mono text-slate-400 flex justify-between">
            <span>Distribution Basis:</span>
            <span className="text-emerald-400 font-semibold">NexuzPi Custom Slim Linux</span>
          </div>
        </div>
      </div>

      {/* Main Configuration Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FHS Layout Selector */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-cyan-900/40 shadow-xl relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FolderTree className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100 font-mono">1. FHS Layout Auswählen</h2>
            </div>
            <button
              onClick={onOpenFhsModal}
              className="text-xs font-mono text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
            >
              <Info className="w-3.5 h-3.5" /> FHS Vergleich
            </button>
          </div>

          <div className="space-y-3">
            {/* Option 1: Standard FHS */}
            <div
              onClick={() => !isBuilding && setSelectedFhs('standard')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedFhs === 'standard'
                  ? 'bg-cyan-950/40 border-cyan-400 shadow-[0_0_15px_rgba(0,243,255,0.15)]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              } ${isBuilding ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-cyan-300">Standard FHS Layout</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-800 text-slate-300">
                      Standard
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    Klassische Hierarchie: <code className="text-cyan-400">/bin</code>, <code className="text-cyan-400">/etc</code>, <code className="text-cyan-400">/lib</code>, <code className="text-cyan-400">/usr</code>, <code className="text-cyan-400">/var</code>, <code className="text-cyan-400">/home</code>, <code className="text-cyan-400">/dev</code>, <code className="text-cyan-400">/proc</code>, <code className="text-cyan-400">/tmp</code>, <code className="text-cyan-400">/lib64</code>, <code className="text-cyan-400">/usr/bin</code>, <code className="text-cyan-400">/usr/lib</code>, <code className="text-cyan-400">/usr/sbin</code>, <code className="text-cyan-400">/usr/libexec</code>.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedFhs === 'standard' ? 'border-cyan-400 bg-cyan-500/20' : 'border-slate-700'}`}>
                  {selectedFhs === 'standard' && <div className="w-2.5 h-2.5 rounded-full bg-cyan-400" />}
                </div>
              </div>
            </div>

            {/* Option 2: Immutable Read-Only FHS */}
            <div
              onClick={() => !isBuilding && setSelectedFhs('readonly')}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                selectedFhs === 'readonly'
                  ? 'bg-fuchsia-950/40 border-fuchsia-400 shadow-[0_0_15px_rgba(217,70,239,0.15)]'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              } ${isBuilding ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-fuchsia-300">Nexuz-Secure Read-Only FHS</span>
                    <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-fuchsia-950 text-fuchsia-300 border border-fuchsia-500/30">
                      Immutable RO
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 font-sans">
                    Read-Only System-Ordner (<code className="text-fuchsia-400">/usr</code>, <code className="text-fuchsia-400">/bin</code> symlinks). Nur <code className="text-emerald-400">/var</code>, <code className="text-emerald-400">/tmp</code> & <code className="text-emerald-400">/etc</code> nutzen tmpfs / OverlayFS RW Mounts für maximale Zuverlässigkeit auf SD-Karten.
                  </p>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedFhs === 'readonly' ? 'border-fuchsia-400 bg-fuchsia-500/20' : 'border-slate-700'}`}>
                  {selectedFhs === 'readonly' && <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-400" />}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Toolchain Selector */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-fuchsia-900/40 shadow-xl relative">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-fuchsia-400" />
              <h2 className="text-base font-bold text-slate-100 font-mono">2. Toolchain C-Bibliothek Wählen</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">Prefix Export: ARCH=arm64</span>
          </div>

          <div className="space-y-3">
            {[
              {
                id: 'gnu',
                name: 'GNU C Library (Glibc)',
                prefix: 'CROSS_COMPILE=aarch64-linux-gnu-',
                desc: 'Standard GNU Toolchain für maximale Software-Kompatibilität.'
              },
              {
                id: 'musl',
                name: 'Musl C Library (Musl)',
                prefix: 'CROSS_COMPILE=aarch64-linux-musl-',
                desc: 'Schlanke, extrem performante C-Bibliothek ideal für eingebettete Systeme.'
              },
              {
                id: 'uclibc',
                name: 'uClibc-ng Library (uClibc)',
                prefix: 'CROSS_COMPILE=aarch64-buildroot-linux-uclibc-',
                desc: 'Minimalistische C-Bibliothek für minimale Memory Footprints.'
              }
            ].map(tc => (
              <div
                key={tc.id}
                onClick={() => !isBuilding && setSelectedToolchain(tc.id as ToolchainType)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedToolchain === tc.id
                    ? 'bg-fuchsia-950/40 border-fuchsia-400 shadow-[0_0_12px_rgba(217,70,239,0.15)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                } ${isBuilding ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-200">{tc.name}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{tc.desc}</p>
                    <code className="inline-block mt-1 text-[10px] font-mono text-fuchsia-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                      {tc.prefix}
                    </code>
                  </div>
                  <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${selectedToolchain === tc.id ? 'border-fuchsia-400 bg-fuchsia-500/20' : 'border-slate-700'}`}>
                    {selectedToolchain === tc.id && <div className="w-2 h-2 rounded-full bg-fuchsia-400" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Target Source Repositories & Execution Controls */}
      <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-2xl relative">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold font-mono text-slate-100 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-emerald-400" />
              3. Quellcodes & Build Aktionen
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Die Quelltexte werden nach <code className="text-cyan-400 font-mono">$HOME/nexuzpi-development/work/downloads</code> geladen & kompiliert.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-mono text-slate-400 cursor-pointer bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
              <input
                type="checkbox"
                checked={useDemoMode}
                onChange={e => setUseDemoMode(e.target.checked)}
                className="rounded border-slate-700 text-cyan-500 focus:ring-cyan-400"
              />
              <span>Demo / Test Build Modus</span>
            </label>

            {!isBuilding ? (
              <button
                onClick={() => onStartBuild(selectedFhs, selectedToolchain, useDemoMode)}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-sm font-bold bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-slate-950 shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all hover:scale-[1.02] active:scale-95"
              >
                <Play className="w-4 h-4 fill-slate-950" />
                <span>BUILD STARTEN</span>
              </button>
            ) : (
              <button
                onClick={onCancelBuild}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl font-mono text-sm font-bold bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all"
              >
                <Square className="w-4 h-4 fill-red-400" />
                <span>BUILD ABBRECHEN</span>
              </button>
            )}
          </div>
        </div>

        {/* Source Repos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {[
            {
              name: 'BusyBox (aarch64)',
              url: 'https://git.busybox.net/busybox/',
              desc: 'Basis Werkzeuge & Shell applets',
              color: 'border-cyan-500/30 bg-cyan-950/20'
            },
            {
              name: 'Coreutils',
              url: 'https://github.com/coreutils/coreutils',
              desc: 'GNU Kern-Dienstprogramme',
              color: 'border-fuchsia-500/30 bg-fuchsia-950/20'
            },
            {
              name: 'Toybox',
              url: 'http://codeberg.org/landley/toybox',
              desc: 'Multi-call binary utilities',
              color: 'border-emerald-500/30 bg-emerald-950/20'
            },
            {
              name: 'RPi Target FS',
              url: 'github.com/raspberrypi/target_fs',
              desc: 'BCM2712 Firmware & Kernel Stubs',
              color: 'border-amber-500/30 bg-amber-950/20'
            }
          ].map(repo => (
            <div key={repo.name} className={`p-3 rounded-xl border ${repo.color}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-slate-200">{repo.name}</span>
                <Download className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">{repo.desc}</p>
              <span className="text-[10px] font-mono text-slate-500 truncate block mt-1">{repo.url}</span>
            </div>
          ))}
        </div>

        {/* Real-time Progress Bar & Status Event Banner */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Aktueller Status-Event:</span>
              <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-bold border border-cyan-500/30">
                {eventState}
              </span>
              <span className="text-slate-300 truncate max-w-xs md:max-w-md">{statusMessage}</span>
            </div>
            <span className="text-cyan-400 font-bold">{progress}%</span>
          </div>

          {/* Animated Glowing Progress Bar */}
          <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800 relative">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-fuchsia-500 to-emerald-400 transition-all duration-300 shadow-[0_0_12px_rgba(0,243,255,0.6)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2">
            <span>Metanexuz.de Firmware Pipeline</span>
            <button
              onClick={onOpenTerminal}
              className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
            >
              <Terminal className="w-3.5 h-3.5" /> Konsolen-Ausgabe anzeigen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
