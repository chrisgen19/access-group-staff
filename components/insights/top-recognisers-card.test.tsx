import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { TopRecognisersCard } from "./top-recognisers-card";

afterEach(() => {
	cleanup();
});

const fixture = (count: number) => ({
	userId: `u${count}`,
	firstName: "User",
	lastName: `${count}`,
	avatar: null,
	count,
});

describe("TopRecognisersCard", () => {
	it("renders the empty-state copy when there are no recognisers", () => {
		render(<TopRecognisersCard data={[]} daysBack={30} />);
		expect(screen.getByText(/no recognition activity in this window yet/i)).toBeInTheDocument();
		// No <ol> is rendered in the empty state.
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});

	it("renders one list item per recogniser with rank and count", () => {
		render(<TopRecognisersCard data={[fixture(12), fixture(7), fixture(3)]} daysBack={30} />);

		const items = screen.getAllByRole("listitem");
		expect(items).toHaveLength(3);

		// Rank prefix renders alongside the count for each row.
		expect(items[0]?.textContent).toMatch(/1.*User 12.*12$/);
		expect(items[1]?.textContent).toMatch(/2.*User 7.*7$/);
		expect(items[2]?.textContent).toMatch(/3.*User 3.*3$/);
	});

	it("uses the leader's count to scale all bars (regression: don't assume sorted)", () => {
		// Pass deliberately-unsorted data; component should still scale bars
		// against the in-data max, not data[0].
		const { container } = render(
			<TopRecognisersCard data={[fixture(2), fixture(10), fixture(6)]} daysBack={30} />,
		);
		const bars = Array.from(container.querySelectorAll<HTMLDivElement>("li > div > div > div"));
		// Leader (count=10) -> 100%, count=6 -> 60%, count=2 -> 20%.
		const widths = bars.map((b) => b.style.width);
		expect(widths).toEqual(["20%", "100%", "60%"]);
	});

	it("renders zero-width bars when every count is zero", () => {
		const { container } = render(
			<TopRecognisersCard
				data={[
					{ ...fixture(0), userId: "u_a" },
					{ ...fixture(0), userId: "u_b" },
				]}
				daysBack={30}
			/>,
		);
		const bars = Array.from(container.querySelectorAll<HTMLDivElement>("li > div > div > div"));
		expect(bars.every((b) => b.style.width === "0%")).toBe(true);
	});
});
