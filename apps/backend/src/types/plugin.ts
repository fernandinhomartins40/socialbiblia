import { Router } from 'express';
import { Application } from 'express';

export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author?: string;
  dependencies?: string[];
  enabled: boolean;
  priority?: number;
}

export interface PluginRoute {
  path: string;
  router: Router;
  middleware?: any[];
}

export interface PluginHooks {
  beforeInit?: () => Promise<void> | void;
  afterInit?: () => Promise<void> | void;
  beforeStart?: (app: Application) => Promise<void> | void;
  afterStart?: (app: Application) => Promise<void> | void;
  beforeShutdown?: () => Promise<void> | void;
}

export interface Plugin {
  metadata: PluginMetadata;
  routes?: PluginRoute[];
  hooks?: PluginHooks;
  init?: () => Promise<void> | void;
  shutdown?: () => Promise<void> | void;
}

export interface PluginConfig {
  enabled: boolean;
  config?: Record<string, any>;
}

export interface PluginRegistry {
  [pluginName: string]: PluginConfig;
}

export interface LoadedPlugin {
  plugin: Plugin;
  config: PluginConfig;
}