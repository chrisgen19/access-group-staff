"use client";

import { useEffect } from "react";

export function ForceLight() {
	useEffect(() => {
		const html = document.documentElement;
		html.classList.remove("dark");
		html.style.colorScheme = "light";

		return () => {
			html.style.colorScheme = "";
		};
	}, []);

	return null;
}
