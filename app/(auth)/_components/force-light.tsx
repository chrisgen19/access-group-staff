"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export function ForceLight() {
	const { theme, setTheme } = useTheme();
	const previousTheme = useRef<string | undefined>(undefined);

	useEffect(() => {
		if (theme !== "light") {
			previousTheme.current = theme;
			setTheme("light");
		}

		return () => {
			if (previousTheme.current) {
				setTheme(previousTheme.current);
			}
		};
	}, []);

	return null;
}
