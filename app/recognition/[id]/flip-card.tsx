"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";

export function FlipCard({
	front,
	back,
}: {
	front: React.ReactNode;
	back: React.ReactNode;
}) {
	const [isFlipped, setIsFlipped] = useState(false);

	return (
		<div className="w-full max-w-5xl flex flex-col items-center">
			{/* Flip hint */}
			<button
				type="button"
				onClick={() => setIsFlipped(!isFlipped)}
				className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-medium text-[#222] shadow-sm hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer"
			>
				<RotateCcw size={16} className="text-[#e31837]" />
				{isFlipped ? "Flip to back" : "Flip to front"}
			</button>

			{/* Card container with perspective */}
			<div
				className="relative w-full"
				style={{ perspective: "2000px" }}
			>
				<div
					className="relative w-full transition-transform duration-700 ease-in-out"
					style={{
						transformStyle: "preserve-3d",
						transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
					}}
				>
					{/* Card 2 (Back of physical card) — shown first */}
					<div
						className="w-full"
						style={{ backfaceVisibility: "hidden" }}
					>
						{back}
					</div>

					{/* Card 1 (Front of physical card) — revealed on flip */}
					<div
						className="absolute inset-0 w-full"
						style={{
							backfaceVisibility: "hidden",
							transform: "rotateY(180deg)",
						}}
					>
						{front}
					</div>
				</div>
			</div>
		</div>
	);
}
