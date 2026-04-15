import {
	SkeletonLine,
	SkeletonCard,
} from "@/components/shared/skeleton-primitives";

export default function UserDetailLoading() {
	return (
		<div
			className="max-w-5xl mx-auto space-y-8 mt-2 animate-pulse"
			aria-busy="true"
			aria-label="Loading user details"
		>
			{/* Header: back button + name + edit button */}
			<div className="flex items-center gap-4">
				<SkeletonLine className="h-10 w-10 rounded-full" />
				<div className="flex-1 space-y-2">
					<SkeletonLine className="h-10 w-56" />
					<SkeletonLine className="h-5 w-48" />
				</div>
				<SkeletonLine className="h-10 w-32 rounded-full" />
			</div>

			{/* Two-column info cards */}
			<div className="grid gap-6 md:grid-cols-2">
				{/* Personal Info */}
				<SkeletonCard className="overflow-hidden">
					<div className="px-8 pt-8 pb-2">
						<SkeletonLine className="h-6 w-32" />
					</div>
					<div className="px-8 py-6 space-y-4">
						{["First Name", "Last Name", "Display Name", "Email", "Phone"].map(
							(field) => (
								<div key={field} className="flex justify-between py-1">
									<SkeletonLine className="h-4 w-24" />
									<SkeletonLine className="h-4 w-32" />
								</div>
							),
						)}
					</div>
				</SkeletonCard>

				{/* Work Info */}
				<SkeletonCard className="overflow-hidden">
					<div className="px-8 pt-8 pb-2">
						<SkeletonLine className="h-6 w-24" />
					</div>
					<div className="px-8 py-6 space-y-4">
						{[1, 2, 3, 4, 5, 6].map((i) => (
							<div key={`work-${i}`} className="flex justify-between py-1">
								<SkeletonLine className="h-4 w-24" />
								<SkeletonLine className="h-4 w-28" />
							</div>
						))}
					</div>
				</SkeletonCard>
			</div>
		</div>
	);
}
