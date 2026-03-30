"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { markNotificationsReadByCardAction } from "@/lib/actions/notification-actions";

export function MarkNotificationsRead({ cardId }: { cardId: string }) {
	const queryClient = useQueryClient();
	const calledRef = useRef(false);

	useEffect(() => {
		if (calledRef.current) return;
		calledRef.current = true;

		markNotificationsReadByCardAction(cardId).then(() => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		});
	}, [cardId, queryClient]);

	return null;
}
