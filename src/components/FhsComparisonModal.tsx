import React from 'react';
import { X, Lock, Unlock, FolderTree, ShieldCheck, HardDrive } from 'lucide-react';

interface FhsComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FhsComparisonModal: React.FC<FhsComparisonModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="max-w-3xl w-full rounded-2xl bg-slate-950 border border-cyan-500/40 shadow-[0_0_30px_rgba(0,243,255,0.2)] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-cyan-400" />
            <h3 className="font-mono font-bold text-sm text-slate-100">
              FHS Layout Vergleich (Standard vs. Nexuz-Secure Read-Only)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto font-sans">
          <p className="text-xs text-slate-300 leading-relaxed font-mono">
            Das Metanexuz.de / Nexuzcode.de Buildsystem bietet 2 maßgeschneiderte Filesystem Hierarchy Standard (FHS) Architektur-Varianten für das Raspberry Pi 5 (BCM2712) an:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Standard FHS */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-cyan-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Unlock className="w-4 h-4 text-cyan-400" />
                <h4 className="font-mono font-bold text-sm text-cyan-300">1. Standard FHS Layout</h4>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Das klassische beschreibbare FHS Layout für traditionelle Linux-Systeme.
              </p>
              <ul className="text-xs text-slate-300 font-mono space-y-1.5 list-disc list-inside">
                <li><code className="text-cyan-400">/bin</code>, <code className="text-cyan-400">/usr/bin</code>: Ausführbare Programme</li>
                <li><code className="text-cyan-400">/etc</code>: Systemkonfiguration</li>
                <li><code className="text-cyan-400">/lib</code>, <code className="text-cyan-400">/lib64</code>: Shared Libraries</li>
                <li><code className="text-cyan-400">/var</code>, <code className="text-cyan-400">/home</code>: Dynamische Daten</li>
                <li><code className="text-cyan-400">/dev</code>, <code className="text-cyan-400">/proc</code>, <code className="text-cyan-400">/tmp</code>: System-Mounts</li>
              </ul>
            </div>

            {/* Read-Only Immutable FHS */}
            <div className="p-4 rounded-xl bg-fuchsia-950/40 border border-fuchsia-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-fuchsia-400" />
                <h4 className="font-mono font-bold text-sm text-fuchsia-300">2. Nexuz-Secure Read-Only FHS</h4>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Unveränderliches OS für SD-Karten-Schutz & maximale Ausfallsicherheit.
              </p>
              <ul className="text-xs text-slate-300 font-mono space-y-1.5 list-disc list-inside">
                <li><code className="text-fuchsia-400">/usr</code>: Read-Only mounted Base</li>
                <li><code className="text-fuchsia-400">/bin, /lib, /sbin</code>: Symlinks nach <code className="text-fuchsia-400">/usr/*</code></li>
                <li><code className="text-emerald-400">/tmp, /var</code>: Writable tmpfs in RAM</li>
                <li><code className="text-emerald-400">/etc</code>: OverlayFS Read-Write Layer</li>
                <li>Schützt SD-Karten vor Flash-Wearouts & Stromausfällen!</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-bold transition-all"
          >
            Verstanden
          </button>
        </div>
      </div>
    </div>
  );
};
