import { SkeletonFormCard } from "@/components/shared/skeleton-primitives";

export default function EditUserLoading() {
	return (
		<div
			className="max-w-2xl mx-auto mt-2 animate-pulse"
			aria-busy="true"
			aria-label="Loading user form"
		>
			<SkeletonFormCard fieldCount={8} title />
		</div>
	);
}
