"use client";

import { useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/utils";

const SAFETY_FACTOR = 0.98;

interface FitTextProps {
	children: string;
	className?: string;
	minFontSize?: number;
}

export function FitText({
	children,
	className,
	minFontSize = 11,
}: FitTextProps) {
	const ref = useRef<HTMLSpanElement>(null);

	useLayoutEffect(() => {
		const el = ref.current;
		if (!el) return;
		const parent = el.parentElement;
		if (!parent) return;

		const measure = () => {
			el.style.fontSize = "";
			const baseSize = Number.parseFloat(getComputedStyle(el).fontSize);
			const style = getComputedStyle(parent);
			const available =
				parent.clientWidth -
				Number.parseFloat(style.paddingLeft) -
				Number.parseFloat(style.paddingRight);

			if (el.scrollWidth > available && available > 0) {
				const scaled =
					(available / el.scrollWidth) * baseSize * SAFETY_FACTOR;
				el.style.fontSize = `${Math.max(minFontSize, scaled)}px`;
			}
		};

		measure();
		const ro = new ResizeObserver(measure);
		ro.observe(parent);
		return () => {
			ro.disconnect();
			el.style.fontSize = "";
		};
	}, [children, minFontSize]);

	return (
		<span
			ref={ref}
			className={cn(
				"block whitespace-nowrap overflow-hidden text-ellipsis",
				className,
			)}
		>
			{children}
		</span>
	);
}
