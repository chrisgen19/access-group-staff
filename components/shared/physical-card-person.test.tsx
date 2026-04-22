import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { PhysicalCardPerson } from "./physical-card-person";

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

describe("PhysicalCardPerson", () => {
	it("renders the avatar image when an avatar URL is present", () => {
		render(
			<PhysicalCardPerson
				firstName="Riley"
				lastName="Recipient"
				avatar="https://example.com/riley.png"
			/>,
		);

		expect(screen.getByAltText("Riley Recipient")).toBeInTheDocument();
		expect(screen.getByText("Riley Recipient")).toBeInTheDocument();
	});

	it("falls back to initials when the avatar is missing or fails to load", () => {
		const { rerender } = render(<PhysicalCardPerson firstName="Riley" lastName="Recipient" />);

		expect(screen.getByText("RR")).toBeInTheDocument();
		expect(screen.getByText("Riley Recipient")).toBeInTheDocument();

		rerender(
			<PhysicalCardPerson
				firstName="Riley"
				lastName="Recipient"
				avatar="https://example.com/riley.png"
			/>,
		);

		fireEvent.error(screen.getByAltText("Riley Recipient"));

		expect(screen.queryByAltText("Riley Recipient")).not.toBeInTheDocument();
		expect(screen.getByText("RR")).toBeInTheDocument();
	});
});
