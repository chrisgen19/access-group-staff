import { SkeletonFormCard } from "@/components/shared/skeleton-primitives";

export default function ProfileLoading() {
	return (
		<div
			className="animate-pulse"
			aria-busy="true"
			aria-label="Loading profile"
		>
			<SkeletonFormCard fieldCount={5} title />
		</div>
	);
}
