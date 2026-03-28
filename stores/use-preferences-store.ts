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

type CardView = "physical" | "simple";
type CardSize = "compact" | "normal" | "expanded";

const CARD_VIEW_OPTIONS = [
	{ id: "physical" as const, label: "Physical Card" },
	{ id: "simple" as const, label: "Simple" },
] as const;

const CARD_SIZE_OPTIONS = [
	{ id: "compact" as const, label: "Compact" },
	{ id: "normal" as const, label: "Normal" },
	{ id: "expanded" as const, label: "Expanded" },
] as const;

interface PreferencesState {
	bgColorId: BgOptionId;
	setBgColor: (id: BgOptionId) => void;
	cardView: CardView;
	setCardView: (view: CardView) => void;
	cardSize: CardSize;
	setCardSize: (size: CardSize) => void;
}

const usePreferencesStore = create<PreferencesState>()(
	persist(
		(set) => ({
			bgColorId: "cream",
			setBgColor: (id) => set({ bgColorId: id }),
			cardView: "physical",
			setCardView: (view) => set({ cardView: view }),
			cardSize: "normal",
			setCardSize: (size) => set({ cardSize: size }),
		}),
		{ name: "user-preferences" },
	),
);

export { usePreferencesStore, BG_OPTIONS, CARD_VIEW_OPTIONS, CARD_SIZE_OPTIONS };
export type { BgOptionId, CardView, CardSize };
