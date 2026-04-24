import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/hooks/use-unread-card-ids", () => ({
	useUnreadCardIds: () => ({ unreadCardIds: new Set<string>() }),
}));

vi.mock("@/stores/use-preferences-store", () => ({
	usePreferencesStore: (selector: (s: { cardView: string; cardSize: string }) => unknown) =>
		selector({ cardView: "list", cardSize: "md" }),
}));

vi.mock("./card-interaction-bar", () => ({
	CardInteractionBar: () => <div data-testid="interaction-bar" />,
}));

vi.mock("./recognition-card-mini", () => ({
	RecognitionCardMini: () => <div />,
}));

const intersectingState = { current: false };
vi.mock("@/hooks/use-intersection-observer", () => ({
	useIntersectionObserver: () => ({ ref: () => {}, isIntersecting: intersectingState.current }),
}));

import { RecognitionFeed } from "./recognition-feed";

function makeCard(id: string) {
	return {
		id,
		message: `message ${id}`,
		date: "2026-04-22T00:00:00.000Z",
		createdAt: "2026-04-22T00:00:00.000Z",
		sender: { id: "s", firstName: "Sa", lastName: "Se", avatar: null, position: null },
		recipient: { id: "r", firstName: "Re", lastName: "Ri", avatar: null, position: null },
		interactionCounts: { reactions: 0, comments: 0 },
		reactionSummary: [],
	};
}

function wrapper(client: QueryClient) {
	return ({ children }: { children: ReactNode }) => (
		<QueryClientProvider client={client}>{children}</QueryClientProvider>
	);
}

const fetchMock = vi.fn();

beforeEach(() => {
	fetchMock.mockReset();
	intersectingState.current = false;
	vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
	cleanup();
	vi.unstubAllGlobals();
});

describe("RecognitionFeed (static)", () => {
	test("fetches once, forwards limit, and renders no Load more", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				data: [makeCard("a")],
				nextCursor: null,
			}),
		});

		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		render(<RecognitionFeed filter="all" limit={25} />, { wrapper: wrapper(client) });

		await waitFor(() => expect(screen.getByText("message a")).toBeInTheDocument());
		expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();

		const call = fetchMock.mock.calls[0]?.[0] as string;
		expect(call).toContain("limit=25");
		expect(call).not.toContain("filter=all");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
});

describe("RecognitionFeed (infinite)", () => {
	test("loads first page and renders Load more when nextCursor present", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				data: [makeCard("a"), makeCard("b")],
				nextCursor: "b",
			}),
		});

		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		render(<RecognitionFeed filter="received" limit={2} infinite />, { wrapper: wrapper(client) });

		await waitFor(() => expect(screen.getByText("message a")).toBeInTheDocument());
		expect(screen.getByRole("button", { name: /load more/i })).toBeInTheDocument();

		const call = fetchMock.mock.calls[0]?.[0] as string;
		expect(call).toContain("filter=received");
		expect(call).toContain("limit=2");
		expect(call).not.toContain("cursor=");
	});

	test("clicking Load more appends next page with cursor", async () => {
		fetchMock
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: [makeCard("a"), makeCard("b")],
					nextCursor: "b",
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: [makeCard("c")],
					nextCursor: null,
				}),
			});

		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		render(<RecognitionFeed filter="received" limit={2} infinite />, { wrapper: wrapper(client) });

		await waitFor(() => expect(screen.getByText("message a")).toBeInTheDocument());
		await act(async () => {
			await userEvent.click(screen.getByRole("button", { name: /load more/i }));
		});
		await waitFor(() => expect(screen.getByText("message c")).toBeInTheDocument());

		expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
		const secondCall = fetchMock.mock.calls[1]?.[0] as string;
		expect(secondCall).toContain("cursor=b");
	});

	test("throws when body.success is false (consistent error envelope)", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ success: false, error: "nope" }),
		});

		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		render(<RecognitionFeed filter="received" limit={5} infinite />, { wrapper: wrapper(client) });

		// Query errors cause isPending to finish without populating data; skeletons linger on error.
		await waitFor(() =>
			expect(
				client.getQueryState(["recognition-cards", "received", { limit: 5, infinite: true }])
					?.status,
			).toBe("error"),
		);
	});

	test("auto-fetches next page when sentinel intersects after a user scroll", async () => {
		fetchMock
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: [makeCard("a"), makeCard("b")],
					nextCursor: "b",
				}),
			})
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					data: [makeCard("c")],
					nextCursor: null,
				}),
			});

		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		render(<RecognitionFeed filter="received" limit={2} infinite />, { wrapper: wrapper(client) });
		await waitFor(() => expect(screen.getByText("message a")).toBeInTheDocument());

		// Sentinel is in view but user hasn't scrolled yet — no second fetch.
		await act(async () => {
			intersectingState.current = true;
			window.dispatchEvent(new Event("resize"));
		});
		expect(fetchMock).toHaveBeenCalledTimes(1);

		// First user scroll flips the gate; sentinel still intersecting → fetch fires.
		await act(async () => {
			window.dispatchEvent(new Event("scroll"));
		});
		await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

		const secondCall = fetchMock.mock.calls[1]?.[0] as string;
		expect(secondCall).toContain("cursor=b");
	});

	test("hides Load more when nextCursor is null on first page", async () => {
		fetchMock.mockResolvedValueOnce({
			ok: true,
			json: async () => ({
				success: true,
				data: [makeCard("a")],
				nextCursor: null,
			}),
		});

		const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
		render(<RecognitionFeed filter="sent" limit={10} infinite />, { wrapper: wrapper(client) });

		await waitFor(() => expect(screen.getByText("message a")).toBeInTheDocument());
		expect(screen.queryByRole("button", { name: /load more/i })).not.toBeInTheDocument();
	});
});
