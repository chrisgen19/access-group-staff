import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { RecognitionCard } from "@/lib/recognition";

type FeedPage = {
	success: boolean;
	data: RecognitionCard[];
	nextCursor: string | null;
};

/**
 * Invalidates the recognition feed without triggering a refetch of every loaded
 * infinite-scroll page. We first slice each cached infinite query down to its
 * first page so the follow-up refetch only hits page 1.
 */
export async function invalidateRecognitionFeed(queryClient: QueryClient) {
	queryClient.setQueriesData<InfiniteData<FeedPage>>({ queryKey: ["recognition-cards"] }, (prev) =>
		prev && Array.isArray(prev.pages) && prev.pages.length > 1
			? { pages: prev.pages.slice(0, 1), pageParams: prev.pageParams.slice(0, 1) }
			: prev,
	);
	await queryClient.invalidateQueries({ queryKey: ["recognition-cards"] });
}
