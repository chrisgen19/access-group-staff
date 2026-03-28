"use client";

import { useEffect } from "react";
import { usePreferencesStore, BG_OPTIONS } from "@/stores/use-preferences-store";

export function BgProvider() {
	const bgColorId = usePreferencesStore((s) => s.bgColorId);

	useEffect(() => {
		const option = BG_OPTIONS.find((o) => o.id === bgColorId);
		if (option) {
			document.documentElement.style.setProperty("--background", option.value);
		}
		return () => {
			document.documentElement.style.removeProperty("--background");
		};
	}, [bgColorId]);

	return null;
}
