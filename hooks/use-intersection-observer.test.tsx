import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { useIntersectionObserver } from "./use-intersection-observer";

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;

const observerInstances: Array<{
	callback: Callback;
	observe: ReturnType<typeof vi.fn>;
	disconnect: ReturnType<typeof vi.fn>;
}> = [];

beforeEach(() => {
	observerInstances.length = 0;
	class MockIO {
		callback: Callback;
		observe = vi.fn();
		disconnect = vi.fn();
		constructor(cb: Callback) {
			this.callback = cb;
			observerInstances.push({ callback: cb, observe: this.observe, disconnect: this.disconnect });
		}
	}
	vi.stubGlobal("IntersectionObserver", MockIO);
});

afterEach(() => {
	vi.unstubAllGlobals();
});

describe("useIntersectionObserver", () => {
	test("creates an observer when ref is attached and enabled", () => {
		const { result } = renderHook(() => useIntersectionObserver());
		act(() => {
			result.current.ref(document.createElement("div"));
		});
		expect(observerInstances).toHaveLength(1);
		expect(observerInstances[0]?.observe).toHaveBeenCalledTimes(1);
	});

	test("updates isIntersecting when callback fires", () => {
		const { result } = renderHook(() => useIntersectionObserver());
		act(() => {
			result.current.ref(document.createElement("div"));
		});
		expect(result.current.isIntersecting).toBe(false);

		act(() => {
			observerInstances[0]?.callback([{ isIntersecting: true }]);
		});
		expect(result.current.isIntersecting).toBe(true);
	});

	test("does not create observer when disabled", () => {
		const { result } = renderHook(() => useIntersectionObserver({ enabled: false }));
		act(() => {
			result.current.ref(document.createElement("div"));
		});
		expect(observerInstances).toHaveLength(0);
	});

	test("disconnects on unmount", () => {
		const { result, unmount } = renderHook(() => useIntersectionObserver());
		act(() => {
			result.current.ref(document.createElement("div"));
		});
		const instance = observerInstances[0];
		unmount();
		expect(instance?.disconnect).toHaveBeenCalled();
	});
});
