"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import { BG_OPTIONS, usePreferencesStore } from "@/stores/use-preferences-store";

export function BgProvider() {
	const bgColorId = usePreferencesStore((s) => s.bgColorId);
	const { resolvedTheme } = useTheme();

	useEffect(() => {
		if (resolvedTheme === "dark") {
			document.documentElement.style.removeProperty("--background");
			return;
		}

		const option = BG_OPTIONS.find((o) => o.id === bgColorId);
		if (option) {
			document.documentElement.style.setProperty("--background", option.value);
		}
		return () => {
			document.documentElement.style.removeProperty("--background");
		};
	}, [bgColorId, resolvedTheme]);

	return null;
}
