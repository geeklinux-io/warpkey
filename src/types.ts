export interface Env {
  DB: D1Database;
  APP_NAME?: string;
  COLLECTION_CRON?: string;
  PUBLIC_BASE_URL?: string;
  WEBHOOK_ENABLED?: string;
  WEBHOOK_URL?: string;
  WEBHOOK_SECRET?: string;
  WEBHOOK_EVENTS?: string;
}

export type RunTrigger = 'cron' | 'manual';

export interface Source {
  id: string;
  name: string;
  url: string;
  enabled: number;
  created_at: number;
  updated_at: number;
}

export interface CollectionResult {
  runId: string;
  status: 'success' | 'partial' | 'failed' | 'skipped';
  found: string[];
  added: string[];
  removed: string[];
  fetchedSourceCount: number;
  sourceCount: number;
  startedAt: number;
  finishedAt: number;
  error?: string;
}
