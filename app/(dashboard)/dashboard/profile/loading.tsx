import { SkeletonFormCard } from "@/components/shared/skeleton-primitives";

export default function ProfileLoading() {
	return (
		<div className="animate-pulse" role="status" aria-busy="true" aria-label="Loading profile">
			<SkeletonFormCard fieldCount={5} title />
		</div>
	);
}
