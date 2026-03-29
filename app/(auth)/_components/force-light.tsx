"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export function ForceLight() {
	const { theme, setTheme } = useTheme();
	const savedTheme = useRef<string | undefined>(undefined);

	useEffect(() => {
		savedTheme.current = theme;
		setTheme("light");
		return () => {
			if (savedTheme.current) {
				setTheme(savedTheme.current);
			}
		};
	}, []); // eslint-disable-line react-hooks/exhaustive-deps

	return null;
}
