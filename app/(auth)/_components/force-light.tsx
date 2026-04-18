"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export function ForceLight() {
	const { theme, setTheme } = useTheme();
	const themeRef = useRef(theme);
	themeRef.current = theme;
	const setThemeRef = useRef(setTheme);
	setThemeRef.current = setTheme;

	useEffect(() => {
		const original = themeRef.current;
		const apply = setThemeRef.current;
		apply("light");
		return () => {
			if (original) {
				setThemeRef.current(original);
			}
		};
	}, []);

	return null;
}
