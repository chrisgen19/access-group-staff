import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import type { RecognitionCard } from "@/lib/recognition";
import { RecognitionCardMini } from "./recognition-card-mini";

class ResizeObserverMock {
	observe() {}
	disconnect() {}
}

beforeAll(() => {
	Object.defineProperty(window, "ResizeObserver", {
		writable: true,
		configurable: true,
		value: ResizeObserverMock,
	});
});

afterEach(() => {
	cleanup();
});

const card: RecognitionCard = {
	id: "card-1",
	message: "Thanks for helping the team.",
	date: "2026-04-22T00:00:00.000Z",
	createdAt: "2026-04-22T00:00:00.000Z",
	sender: {
		id: "sender-1",
		firstName: "Sam",
		lastName: "Sender",
		avatar: "https://example.com/sender.png",
		position: "Coordinator",
	},
	recipient: {
		id: "recipient-1",
		firstName: "Riley",
		lastName: "Recipient",
		avatar: "https://example.com/recipient.png",
		position: "Specialist",
	},
	valuesPeople: true,
	valuesSafety: false,
	valuesRespect: true,
	valuesCommunication: false,
	valuesContinuousImprovement: true,
	interactionCounts: null,
};

describe("RecognitionCardMini", () => {
	it("renders the recipient avatar and keeps the sender as plain text", () => {
		render(<RecognitionCardMini card={card} />);

		expect(screen.getByAltText("Riley Recipient")).toBeInTheDocument();
		expect(screen.queryByAltText("Sam Sender")).not.toBeInTheDocument();
		expect(screen.getByText("Sam Sender")).toBeInTheDocument();
	});

	it("still renders the recipient name when the recipient avatar is missing", () => {
		render(
			<RecognitionCardMini
				card={{
					...card,
					recipient: {
						...card.recipient,
						avatar: null,
					},
				}}
			/>,
		);

		expect(screen.queryByAltText("Riley Recipient")).not.toBeInTheDocument();
		expect(screen.getByText("Riley Recipient")).toBeInTheDocument();
		expect(screen.getByText("RR")).toBeInTheDocument();
	});
});
