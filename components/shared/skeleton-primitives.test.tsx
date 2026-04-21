import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { SkeletonCard } from "./skeleton-primitives";

describe("SkeletonCard", () => {
	afterEach(() => {
		cleanup();
	});

	it("forwards role, aria-busy, and aria-label onto the container", () => {
		render(<SkeletonCard role="status" aria-busy="true" aria-label="Loading dashboard" />);

		const container = screen.getByRole("status", { name: "Loading dashboard" });
		expect(container).toHaveAttribute("aria-busy", "true");
	});

	it("renders children inside the container", () => {
		render(
			<SkeletonCard role="status" aria-label="Loading">
				<span data-testid="inner">content</span>
			</SkeletonCard>,
		);

		const container = screen.getByRole("status", { name: "Loading" });
		expect(container).toContainElement(screen.getByTestId("inner"));
	});

	it("merges className with the primitive's base classes", () => {
		render(<SkeletonCard role="status" aria-label="Loading" className="custom-class" />);

		const container = screen.getByRole("status", { name: "Loading" });
		expect(container).toHaveClass("custom-class");
		expect(container).toHaveClass("rounded-[2rem]");
	});
});
