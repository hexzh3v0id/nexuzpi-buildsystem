import React from 'react';
import { Cpu, Terminal, Shield, FolderCheck, Activity, Layers, ExternalLink } from 'lucide-react';
import { AppConfig } from '../types';

interface HeaderProps {
  config: AppConfig | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onInstallDeps: () => void;
}

export const Header: React.FC<HeaderProps> = ({ config, activeTab, setActiveTab, onInstallDeps }) => {
  return (
    <header className="border-b border-cyan-900/50 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand & Organization */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-fuchsia-500/20 border border-cyan-500/40 shadow-[0_0_15px_rgba(0,243,255,0.2)]">
            <Cpu className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-950 shadow-[0_0_8px_#10b981]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
                NexuzPi OS Buildsystem
              </h1>
              <span className="px-2 py-0.5 text-xs font-mono rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                v2.5 BCM2712
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mt-0.5">
              <span className="text-fuchsia-400 font-semibold">metanexuz.de</span>
              <span>/</span>
              <span className="text-emerald-400 font-semibold">nexuzcode.de</span>
              <span className="hidden sm:inline text-slate-600">•</span>
              <span className="hidden sm:inline text-slate-400">Raspberry Pi 5 (ARM64)</span>
            </div>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono">
            <Activity className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="text-slate-400">Status:</span>
            <span className={`font-semibold ${config?.activeBuild ? 'text-amber-400 animate-pulse' : 'text-emerald-400'}`}>
              {config?.activeBuild ? `BUILDING (${config.progress}%)` : 'IDLE / BEREIT'}
            </span>
          </div>

          <button
            onClick={onInstallDeps}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-cyan-950/60 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 hover:border-cyan-400 transition-all shadow-[0_0_10px_rgba(0,243,255,0.15)]"
            title="System-Abhängigkeiten installieren"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            <span>Debian Tools</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="max-w-7xl mx-auto px-4 flex items-center gap-2 overflow-x-auto border-t border-slate-800/80 pt-2 pb-1">
        {[
          { id: 'dashboard', label: 'Build Dashboard', icon: Layers },
          { id: 'terminal', label: 'Echtzeit Konsole', icon: Terminal },
          { id: 'explorer', label: 'FHS RootFS Explorer', icon: FolderCheck },
          { id: 'dependencies', label: 'Toolchains & Pakete', icon: Shield },
          { id: 'hardware', label: 'RPi5 BCM2712 Config', icon: Cpu }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg font-mono text-xs font-medium transition-all whitespace-nowrap border-b-2 ${
                isActive
                  ? 'bg-slate-900 text-cyan-300 border-cyan-400 shadow-[0_-2px_12px_rgba(0,243,255,0.2)]'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-900/40'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.id === 'terminal' && config?.activeBuild && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
              )}
            </button>
          );
        })}
      </div>
    </header>
  );
};
