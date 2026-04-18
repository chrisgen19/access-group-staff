"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export function ForceLight() {
	const { theme, setTheme } = useTheme();
	const themeRef = useRef(theme);
	themeRef.current = theme;

	useEffect(() => {
		const original = themeRef.current;
		setTheme("light");
		return () => {
			if (original) {
				setTheme(original);
			}
		};
	}, [setTheme]);

	return null;
}
