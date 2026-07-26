import React, { useState, useEffect } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  HardDrive,
  Code,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { FhsNode } from '../types';

interface RootfsExplorerProps {
  rootfsDir: string;
}

export const RootfsExplorer: React.FC<RootfsExplorerProps> = ({ rootfsDir }) => {
  const [treeData, setTreeData] = useState<FhsNode[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    'bin': true,
    'etc': true,
    'boot': true,
    'usr': true
  });

  const fetchTree = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/rootfs/tree');
      const data = await res.json();
      if (data.exists && data.tree) {
        setTreeData(data.tree);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTree();
  }, []);

  const handleSelectFile = async (filePath: string) => {
    setSelectedFile(filePath);
    setFileLoading(true);
    try {
      const res = await fetch(`/api/rootfs/file?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      if (data.content !== undefined) {
        setFileContent(data.content);
      } else {
        setFileContent('// Keine Textdatei oder Vorschau nicht verfügbar');
      }
    } catch {
      setFileContent('Fehler beim Laden der Datei');
    } finally {
      setFileLoading(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders(prev => ({ ...prev, [path]: !prev[path] }));
  };

  // Helper to determine if path is Read-Only or Read-Write in immutable layout
  const isReadOnlyPath = (path: string) => {
    if (path.startsWith('var') || path.startsWith('tmp') || path.startsWith('home')) return false;
    return true;
  };

  const renderNode = (node: FhsNode) => {
    const isDir = node.type === 'directory';
    const isExpanded = expandedFolders[node.path];
    const isRo = isReadOnlyPath(node.path);

    if (isDir) {
      return (
        <div key={node.path} className="ml-3 font-mono text-xs">
          <div
            onClick={() => toggleFolder(node.path)}
            className="flex items-center gap-2 py-1 px-2 rounded hover:bg-slate-900/80 cursor-pointer text-slate-300 transition-colors"
          >
            {isExpanded ? (
              <FolderOpen className="w-4 h-4 text-cyan-400 shrink-0" />
            ) : (
              <Folder className="w-4 h-4 text-cyan-500/70 shrink-0" />
            )}
            <span className="font-bold text-slate-200">{node.name}</span>
            <span className="text-[10px] text-slate-500 font-normal">({node.children?.length || 0})</span>

            {/* RO/RW Badge */}
            {isRo ? (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-fuchsia-400 bg-fuchsia-950/60 px-1.5 py-0.2 rounded border border-fuchsia-500/20">
                <Lock className="w-2.5 h-2.5" /> RO
              </span>
            ) : (
              <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/20">
                <Unlock className="w-2.5 h-2.5" /> RW
              </span>
            )}
          </div>

          {isExpanded && node.children && (
            <div className="border-l border-slate-800 ml-2.5 pl-1 my-0.5 space-y-0.5">
              {node.children.map(child => renderNode(child))}
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        key={node.path}
        onClick={() => handleSelectFile(node.path)}
        className={`ml-3 flex items-center justify-between py-1 px-2 rounded cursor-pointer font-mono text-xs transition-colors ${
          selectedFile === node.path
            ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(0,243,255,0.1)]'
            : 'hover:bg-slate-900 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{node.name}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-500 shrink-0">
          <span>{node.mode || '0755'}</span>
          <span>{node.size !== undefined ? `${node.size} B` : ''}</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Info Bar */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold font-mono text-slate-100 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            FHS RootFS Verzeichnisstruktur Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-0.5 font-mono">
            {rootfsDir || '$HOME/nexuzpi-development/work/build/rootfs'}
          </p>
        </div>

        <button
          onClick={fetchTree}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-300 font-mono text-xs border border-slate-800 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Baum Aktualisieren</span>
        </button>
      </div>

      {/* Main Split Grid: Tree on Left, File Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Directory Tree */}
        <div className="lg:col-span-5 p-4 rounded-2xl bg-slate-950 border border-cyan-900/40 shadow-xl max-h-[600px] overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
              RootFS Hierarchie (/rootfs)
            </span>
            <span className="text-[10px] font-mono text-slate-500">{treeData.length} Hauptordner</span>
          </div>

          {treeData.length === 0 ? (
            <div className="p-8 text-center text-slate-500 font-mono text-xs space-y-2">
              <AlertTriangle className="w-6 h-6 mx-auto text-amber-500/60" />
              <p>Noch kein RootFS im Zielverzeichnis erstellt.</p>
              <p className="text-[11px] text-slate-600">Starte den Build-Prozess im Dashboard um das FHS-Layout zu generieren.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {treeData.map(node => renderNode(node))}
            </div>
          )}
        </div>

        {/* Right Side: File Content Inspector */}
        <div className="lg:col-span-7 p-4 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl flex flex-col h-[600px]">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
            <div className="flex items-center gap-2">
              <Code className="w-4 h-4 text-fuchsia-400" />
              <span className="font-mono text-xs font-bold text-slate-200">
                {selectedFile ? `Datei: /${selectedFile}` : 'Datei-Vorschau Inspector'}
              </span>
            </div>
            {selectedFile && (
              <span className="text-[10px] font-mono bg-fuchsia-950 text-fuchsia-300 px-2 py-0.5 rounded border border-fuchsia-500/30">
                Read-Only Preview
              </span>
            )}
          </div>

          <div className="flex-1 bg-slate-900/90 rounded-xl p-4 font-mono text-xs overflow-auto text-slate-200 border border-slate-800/80">
            {!selectedFile ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Eye className="w-8 h-8 text-fuchsia-500/40" />
                <p>Klicke auf eine Datei im FHS-Baum auf der linken Seite (z.B. <code className="text-cyan-400">etc/fstab</code>, <code className="text-cyan-400">boot/config.txt</code>, <code className="text-cyan-400">etc/issue</code>).</p>
              </div>
            ) : fileLoading ? (
              <div className="h-full flex items-center justify-center text-slate-400 font-mono">
                <RefreshCw className="w-5 h-5 animate-spin mr-2 text-cyan-400" />
                Lade Datei-Inhalt...
              </div>
            ) : (
              <pre className="whitespace-pre-wrap leading-relaxed text-slate-200 font-mono selection:bg-cyan-900">
                {fileContent}
              </pre>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
