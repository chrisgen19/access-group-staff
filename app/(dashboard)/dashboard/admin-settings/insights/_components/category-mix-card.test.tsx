import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { CategoryTally } from "@/lib/insights/queries";
import { CategoryMixCard } from "./category-mix-card";

afterEach(() => {
	cleanup();
});

const allZero: CategoryTally[] = [
	{ category: "HR", count: 0 },
	{ category: "IT_WEBSITE", count: 0 },
	{ category: "PAYROLL", count: 0 },
	{ category: "FACILITIES", count: 0 },
	{ category: "OTHER", count: 0 },
];

describe("CategoryMixCard", () => {
	it("renders the empty-state copy when total is zero, even if data has entries", () => {
		// Important: the query always returns 5 zero-fill entries when no
		// tickets exist. The card should still render the empty-state message.
		render(<CategoryMixCard data={allZero} daysBack={30} />);
		expect(screen.getByText(/no tickets created in this window yet/i)).toBeInTheDocument();
		expect(screen.queryByRole("list")).not.toBeInTheDocument();
	});

	it("renders one row per category with humanised label and share %", () => {
		render(
			<CategoryMixCard
				data={[
					{ category: "HR", count: 6 },
					{ category: "IT_WEBSITE", count: 3 },
					{ category: "PAYROLL", count: 1 },
					{ category: "FACILITIES", count: 0 },
					{ category: "OTHER", count: 0 },
				]}
				daysBack={30}
			/>,
		);

		const items = screen.getAllByRole("listitem");
		expect(items).toHaveLength(5);

		// Labels are humanised (IT_WEBSITE -> "IT / Website").
		expect(screen.getByText("HR")).toBeInTheDocument();
		expect(screen.getByText("IT / Website")).toBeInTheDocument();

		// Share % is rounded against total=10. HR=60%, IT=30%, Payroll=10%.
		expect(items[0]?.textContent).toMatch(/HR.*6.*\(60%\)/);
		expect(items[1]?.textContent).toMatch(/IT \/ Website.*3.*\(30%\)/);
		expect(items[2]?.textContent).toMatch(/Payroll.*1.*\(10%\)/);
	});

	it("scales bars against in-data max (regression: don't assume sorted desc)", () => {
		// Deliberately-unsorted input — bar widths should still scale against
		// the leader (count=8 = 100%), not data[0].
		const { container } = render(
			<CategoryMixCard
				data={[
					{ category: "FACILITIES", count: 2 },
					{ category: "HR", count: 8 },
					{ category: "OTHER", count: 4 },
					{ category: "IT_WEBSITE", count: 0 },
					{ category: "PAYROLL", count: 0 },
				]}
				daysBack={30}
			/>,
		);
		const bars = Array.from(container.querySelectorAll<HTMLDivElement>("li > div > div"));
		const widths = bars.map((b) => b.style.width);
		// 2/8=25%, 8/8=100%, 4/8=50%, 0=0%, 0=0%
		expect(widths).toEqual(["25%", "100%", "50%", "0%", "0%"]);
	});
});
