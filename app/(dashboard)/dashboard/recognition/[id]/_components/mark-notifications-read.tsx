"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { markNotificationsReadByCardAction } from "@/lib/actions/notification-actions";

export function MarkNotificationsRead({ cardId }: { cardId: string }) {
	const queryClient = useQueryClient();
	const lastCardIdRef = useRef<string | null>(null);

	useEffect(() => {
		if (lastCardIdRef.current === cardId) return;
		lastCardIdRef.current = cardId;

		markNotificationsReadByCardAction(cardId).then(() => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
			queryClient.invalidateQueries({ queryKey: ["unread-card-ids"] });
		});
	}, [cardId, queryClient]);

	return null;
}
