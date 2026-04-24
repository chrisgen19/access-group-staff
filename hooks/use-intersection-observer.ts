"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface Options {
	rootMargin?: string;
	threshold?: number;
	enabled?: boolean;
}

export function useIntersectionObserver({
	rootMargin = "400px",
	threshold = 0,
	enabled = true,
}: Options = {}) {
	const [isIntersecting, setIsIntersecting] = useState(false);
	const observerRef = useRef<IntersectionObserver | null>(null);

	const ref = useCallback(
		(node: Element | null) => {
			if (observerRef.current) {
				observerRef.current.disconnect();
				observerRef.current = null;
			}
			if (!enabled || !node || typeof IntersectionObserver === "undefined") {
				setIsIntersecting(false);
				return;
			}
			const observer = new IntersectionObserver(
				(entries) => {
					const entry = entries[0];
					if (entry) setIsIntersecting(entry.isIntersecting);
				},
				{ rootMargin, threshold },
			);
			observer.observe(node);
			observerRef.current = observer;
		},
		[enabled, rootMargin, threshold],
	);

	useEffect(() => {
		return () => {
			observerRef.current?.disconnect();
			observerRef.current = null;
		};
	}, []);

	return { ref, isIntersecting };
}
