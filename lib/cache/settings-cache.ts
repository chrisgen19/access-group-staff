export type CacheEntry<T> = {
	data: T | null;
	expiry: number;
	generation: number;
};

function isValidEntry(value: unknown): value is CacheEntry<unknown> {
	if (typeof value !== "object" || value === null) return false;
	const v = value as Record<string, unknown>;
	return "data" in v && typeof v.expiry === "number" && typeof v.generation === "number";
}

// Attach an entry to globalThis so it behaves as a true process-wide singleton —
// Server Actions and Route Handlers can compile to separate server bundles with
// distinct module-scoped variables, and a plain module-level `let` would mean
// the Server Action invalidates a different cache instance than the one readers
// consult.
//
// Note: globalThis is per-process. On multi-instance serverless (Vercel
// lambdas, multiple containers), each instance still holds its own cache and
// can serve stale values for up to the TTL after an update. This helper only
// eliminates the intra-process bundle split.
export function getOrCreateGlobalEntry<T>(key: string): CacheEntry<T> {
	const store = globalThis as unknown as Record<string, unknown>;
	if (!isValidEntry(store[key])) {
		// Replaces stale shapes left over across HMR reloads in dev, where a
		// prior version of this file may have written an entry without the
		// `generation` field. Without this guard, `generation += 1` on such an
		// entry yields NaN and the cache never publishes a fresh read.
		store[key] = { data: null, expiry: 0, generation: 0 } satisfies CacheEntry<T>;
	}
	return store[key] as CacheEntry<T>;
}

export function invalidateEntry<T>(entry: CacheEntry<T>): void {
	entry.data = null;
	entry.expiry = 0;
	entry.generation += 1;
}

// `generation` guards against a read/invalidate race: a reader captures the
// generation before awaiting the fetcher and only publishes its result back
// into the shared cache if no invalidation happened during the await. Without
// it, an in-flight reader holding pre-update data would re-poison the cache
// right after an admin invalidates it. The caller still receives the fresh
// read — linearizability is preserved since its request predates the write.
export async function readThroughCache<T>(
	entry: CacheEntry<T>,
	ttlMs: number,
	fetcher: () => Promise<T>,
): Promise<T> {
	if (entry.data !== null && Date.now() < entry.expiry) {
		return entry.data;
	}

	const generation = entry.generation;
	const fresh = await fetcher();

	if (entry.generation === generation) {
		entry.data = fresh;
		entry.expiry = Date.now() + ttlMs;
	}

	return fresh;
}
