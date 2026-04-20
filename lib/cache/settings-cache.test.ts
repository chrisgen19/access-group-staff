import { beforeEach, describe, expect, test } from "bun:test";
import {
	type CacheEntry,
	getOrCreateGlobalEntry,
	invalidateEntry,
	readThroughCache,
} from "./settings-cache";

function resetGlobal(key: string) {
	(globalThis as unknown as Record<string, unknown>)[key] = undefined;
}

function deferred<T>() {
	let resolve!: (value: T) => void;
	const promise = new Promise<T>((r) => {
		resolve = r;
	});
	return { promise, resolve };
}

describe("getOrCreateGlobalEntry", () => {
	const KEY = "test.settings.create";

	beforeEach(() => resetGlobal(KEY));

	test("creates a zero-initialized entry on first call", () => {
		const entry = getOrCreateGlobalEntry<number>(KEY);
		expect(entry).toEqual({ data: null, expiry: 0, generation: 0 });
	});

	test("returns the same entry on subsequent calls", () => {
		const first = getOrCreateGlobalEntry<number>(KEY);
		first.data = 42;
		const second = getOrCreateGlobalEntry<number>(KEY);
		expect(second).toBe(first);
		expect(second.data).toBe(42);
	});

	test("replaces an entry left behind with a stale shape (HMR reload)", () => {
		// Simulates an earlier version of the module writing the pre-generation
		// shape. `??=` alone would keep the broken object; this guard replaces it.
		(globalThis as unknown as Record<string, unknown>)[KEY] = {
			data: { foo: "bar" },
			expiry: 123,
		};
		const entry = getOrCreateGlobalEntry<{ foo: string }>(KEY);
		expect(entry).toEqual({ data: null, expiry: 0, generation: 0 });
	});

	test("replaces an entry with a non-numeric generation", () => {
		(globalThis as unknown as Record<string, unknown>)[KEY] = {
			data: null,
			expiry: 0,
			generation: "0",
		};
		const entry = getOrCreateGlobalEntry<number>(KEY);
		expect(entry.generation).toBe(0);
	});
});

describe("invalidateEntry", () => {
	test("clears data and expiry, bumps generation", () => {
		const entry: CacheEntry<number> = { data: 42, expiry: 999, generation: 3 };
		invalidateEntry(entry);
		expect(entry.data).toBeNull();
		expect(entry.expiry).toBe(0);
		expect(entry.generation).toBe(4);
	});
});

describe("readThroughCache", () => {
	let entry: CacheEntry<number>;

	beforeEach(() => {
		entry = { data: null, expiry: 0, generation: 0 };
	});

	test("populates cache on cold read", async () => {
		const result = await readThroughCache(entry, 30_000, async () => 7);
		expect(result).toBe(7);
		expect(entry.data).toBe(7);
		expect(entry.expiry).toBeGreaterThan(Date.now());
	});

	test("returns cached data without calling the fetcher while fresh", async () => {
		entry.data = 11;
		entry.expiry = Date.now() + 60_000;
		let calls = 0;
		const result = await readThroughCache(entry, 30_000, async () => {
			calls += 1;
			return 99;
		});
		expect(result).toBe(11);
		expect(calls).toBe(0);
	});

	test("re-fetches when TTL has expired", async () => {
		entry.data = 11;
		entry.expiry = Date.now() - 1;
		const result = await readThroughCache(entry, 30_000, async () => 22);
		expect(result).toBe(22);
		expect(entry.data).toBe(22);
	});

	test("does not publish a stale read when invalidation happens mid-flight", async () => {
		const gate = deferred<number>();
		const read = readThroughCache(entry, 30_000, async () => gate.promise);

		// Simulate an admin update committing while the fetcher is still awaiting.
		invalidateEntry(entry);
		expect(entry.generation).toBe(1);

		gate.resolve(42);
		const value = await read;

		// The in-flight caller still observes its own fetched value (safe —
		// their request predates the write) …
		expect(value).toBe(42);
		// … but the shared cache remains empty so future readers don't see the
		// pre-invalidation snapshot.
		expect(entry.data).toBeNull();
		expect(entry.expiry).toBe(0);
	});

	test("two concurrent cold reads both write safely when no invalidation occurs", async () => {
		const gateA = deferred<number>();
		const gateB = deferred<number>();
		const a = readThroughCache(entry, 30_000, async () => gateA.promise);
		const b = readThroughCache(entry, 30_000, async () => gateB.promise);

		gateA.resolve(1);
		gateB.resolve(2);

		const [ra, rb] = await Promise.all([a, b]);
		expect(ra).toBe(1);
		expect(rb).toBe(2);
		// Last writer wins; both had generation 0, both published. Acceptable —
		// no stale data is introduced, only a redundant write.
		expect(entry.data).toBe(2);
		expect(entry.generation).toBe(0);
	});
});
