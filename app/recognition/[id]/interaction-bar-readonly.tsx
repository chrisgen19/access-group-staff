"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";

interface InteractionBarReadonlyProps {
	reactions: { emoji: string; count: number }[];
	commentCount: number;
}

export function InteractionBarReadonly({
	reactions,
	commentCount,
}: InteractionBarReadonlyProps) {
	const pathname = usePathname();
	const loginUrl = `/login?callbackUrl=${encodeURIComponent(pathname)}`;

	const activeReactions = reactions.filter((r) => r.count > 0);

	return (
		<div className="pt-3 mt-3 border-t border-gray-200">
			<div className="flex flex-wrap items-center gap-1.5">
				{activeReactions.map((r) => (
					<Link
						key={r.emoji}
						href={loginUrl}
						className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
					>
						<span>{r.emoji}</span>
						<span className="text-xs tabular-nums">{r.count}</span>
					</Link>
				))}

				<Link
					href={loginUrl}
					className="ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
				>
					<MessageCircle size={13} />
					<span>
						{commentCount > 0
							? `${commentCount} comment${commentCount !== 1 ? "s" : ""}`
							: "Comment"}
					</span>
				</Link>
			</div>
		</div>
	);
}
