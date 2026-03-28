import { create } from "zustand";
import { persist } from "zustand/middleware";

const BG_OPTIONS = [
	{ id: "default", label: "Light Gray", value: "#f8f8f8" },
	{ id: "warm", label: "Warm White", value: "#faf8f5" },
	{ id: "cool", label: "Cool White", value: "#f5f7fa" },
	{ id: "pure", label: "Pure White", value: "#ffffff" },
	{ id: "cream", label: "Cream", value: "#fdf6ec" },
	{ id: "slate", label: "Slate", value: "#f1f3f5" },
] as const;

type BgOptionId = (typeof BG_OPTIONS)[number]["id"];

interface PreferencesState {
	bgColorId: BgOptionId;
	setBgColor: (id: BgOptionId) => void;
}

const usePreferencesStore = create<PreferencesState>()(
	persist(
		(set) => ({
			bgColorId: "default",
			setBgColor: (id) => set({ bgColorId: id }),
		}),
		{ name: "user-preferences" },
	),
);

export { usePreferencesStore, BG_OPTIONS };
export type { BgOptionId };
