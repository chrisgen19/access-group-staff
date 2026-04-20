"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { TableRow } from "@/components/ui/table";

export function ClickableTicketRow({ href, children }: { href: string; children: ReactNode }) {
	const router = useRouter();

	return (
		<TableRow
			onClick={(e) => {
				const target = e.target as HTMLElement;
				if (target.closest("a")) return;
				if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
				const selection = window.getSelection();
				if (selection && selection.toString().length > 0) return;
				router.push(href);
			}}
			className="cursor-pointer hover:bg-muted/40"
		>
			{children}
		</TableRow>
	);
}
