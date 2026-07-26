export type FhsLayoutType = 'standard' | 'readonly';
export type ToolchainType = 'gnu' | 'musl' | 'uclibc';

export interface FhsOption {
  id: FhsLayoutType;
  name: string;
  description: string;
  readOnly: boolean;
}

export interface ToolchainOption {
  id: ToolchainType;
  name: string;
  prefix: string;
  lib: string;
}

export interface SystemDependency {
  pkg: string;
  installed: boolean;
}

export interface LogEntry {
  timestamp: string;
  stream: 'stdout' | 'stderr' | 'system';
  line: string;
}

export interface FhsNode {
  name: string;
  path: string;
  type: 'directory' | 'file';
  size?: number;
  mode?: string;
  children?: FhsNode[];
}

export interface AppConfig {
  appDir: string;
  workDir: string;
  rootfsDir: string;
  organization: string;
  targetDevice: string;
  fhsLayouts: FhsOption[];
  toolchains: ToolchainOption[];
  activeBuild: boolean;
  progress: number;
  statusMessage: string;
  eventState: string;
}
