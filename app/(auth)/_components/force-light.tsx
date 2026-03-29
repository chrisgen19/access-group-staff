"use client";

import { useEffect, useRef } from "react";

export function ForceLight() {
	const savedTheme = useRef<string | null>(null);

	useEffect(() => {
		savedTheme.current = localStorage.getItem("theme");

		const html = document.documentElement;
		html.classList.remove("dark");
		html.style.colorScheme = "light";

		return () => {
			const theme = savedTheme.current ?? "system";

			html.style.colorScheme = "";

			if (theme === "dark") {
				html.classList.add("dark");
				html.style.colorScheme = "dark";
			} else if (theme === "system") {
				const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
				if (prefersDark) {
					html.classList.add("dark");
					html.style.colorScheme = "dark";
				}
			}
		};
	}, []);

	return null;
}
