import { StorageAdapter } from "./adapter";
import { JsonStorageAdapter } from "./json-adapter";
import { PostgresStorageAdapter } from "./postgres-adapter";

let storageInstance: StorageAdapter | null = null;

/**
 * Returns the configured storage adapter.
 * Uses PostgreSQL if DATABASE_URL is configured, otherwise uses local JSON adapter.
 */
export function getStorage(): StorageAdapter {
  if (storageInstance) {
    return storageInstance;
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl && databaseUrl.trim() !== "") {
    storageInstance = new PostgresStorageAdapter(databaseUrl);
  } else {
    storageInstance = new JsonStorageAdapter();
  }

  return storageInstance;
}

export * from "./adapter";
export * from "./json-adapter";
