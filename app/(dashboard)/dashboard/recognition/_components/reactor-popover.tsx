"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/shared/user-avatar";
import type { CardReactionUser } from "@/lib/recognition";
import { cn } from "@/lib/utils";

interface TriggerProps {
	onClick: (e: React.MouseEvent) => void;
	onMouseEnter: () => void;
	onMouseLeave: () => void;
	onPointerDown: (e: React.PointerEvent) => void;
	onPointerUp: () => void;
	onPointerCancel: () => void;
}

interface ReactorPopoverProps {
	emoji: string;
	users: CardReactionUser[];
	onActivate: () => void;
	align?: "start" | "center" | "end";
	children: (trigger: TriggerProps) => ReactNode;
}

const HOVER_CLOSE_DELAY = 150;

export function ReactorPopover({
	emoji,
	users,
	onActivate,
	align = "center",
	children,
}: ReactorPopoverProps) {
	const [open, setOpen] = useState(false);
	const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
	const suppressNextClick = useRef(false);
	const containerRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (!open) return;
		function handleDocClick(e: MouseEvent) {
			if (!containerRef.current?.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("pointerdown", handleDocClick);
		return () => document.removeEventListener("pointerdown", handleDocClick);
	}, [open]);

	useEffect(() => {
		return () => {
			if (longPressTimer.current) clearTimeout(longPressTimer.current);
			if (hoverCloseTimer.current) clearTimeout(hoverCloseTimer.current);
		};
	}, []);

	function isHoverCapable() {
		return typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches;
	}

	function cancelHoverClose() {
		if (hoverCloseTimer.current) {
			clearTimeout(hoverCloseTimer.current);
			hoverCloseTimer.current = null;
		}
	}

	function scheduleHoverClose() {
		cancelHoverClose();
		hoverCloseTimer.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
	}

	function onMouseEnter() {
		if (!isHoverCapable()) return;
		cancelHoverClose();
		setOpen(true);
	}

	function onMouseLeave() {
		if (!isHoverCapable()) return;
		scheduleHoverClose();
	}

	function onPointerDown(e: React.PointerEvent) {
		if (e.pointerType === "mouse") return;
		longPressTimer.current = setTimeout(() => {
			setOpen(true);
			suppressNextClick.current = true;
		}, 450);
	}

	function clearLongPress() {
		if (longPressTimer.current) {
			clearTimeout(longPressTimer.current);
			longPressTimer.current = null;
		}
	}

	function onClick(e: React.MouseEvent) {
		if (suppressNextClick.current) {
			e.preventDefault();
			e.stopPropagation();
			suppressNextClick.current = false;
			return;
		}
		onActivate();
	}

	const hasUsers = users.length > 0;
	const popoverPositionClass =
		align === "start"
			? "absolute bottom-full left-0 z-50 pt-1 pb-2"
			: align === "end"
				? "absolute bottom-full right-0 z-50 pt-1 pb-2"
				: "absolute bottom-full left-1/2 -translate-x-1/2 z-50 pt-1 pb-2";

	return (
		<span ref={containerRef} className="relative inline-flex">
			{children({
				onClick,
				onMouseEnter,
				onMouseLeave,
				onPointerDown,
				onPointerUp: clearLongPress,
				onPointerCancel: clearLongPress,
			})}
			{open && hasUsers && (
				<div
					role="dialog"
					aria-label={`People who reacted with ${emoji}`}
					onMouseEnter={cancelHoverClose}
					onMouseLeave={scheduleHoverClose}
					className={cn(
						popoverPositionClass,
						"min-w-[180px] max-w-[240px]",
						"animate-in fade-in-0 zoom-in-95 duration-100",
					)}
				>
					<div
						className={cn(
							"rounded-xl border border-border/60 bg-popover text-popover-foreground shadow-lg p-2",
						)}
					>
						<div className="flex items-center gap-1.5 px-1.5 py-1 border-b border-border/40 mb-1">
							<span className="text-base leading-none">{emoji}</span>
							<span className="text-[11px] font-medium text-muted-foreground">
								{users.length} {users.length === 1 ? "person" : "people"}
							</span>
						</div>
						<ul className="max-h-48 overflow-y-auto space-y-1">
							{users.map((u) => (
								<li key={u.id} className="flex items-center gap-2 rounded-md px-1.5 py-1">
									<UserAvatar
										firstName={u.firstName}
										lastName={u.lastName}
										avatar={u.avatar}
										size="xs"
										className="bg-primary/10 text-primary"
									/>
									<span className="text-xs text-foreground truncate">
										{u.firstName} {u.lastName}
									</span>
								</li>
							))}
						</ul>
					</div>
				</div>
			)}
		</span>
	);
}
