import { cn, getInitials } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

const SIZE_CLASSES: Record<AvatarSize, string> = {
	xs: "h-7 w-7 text-[10px]",
	sm: "h-8 w-8 text-xs",
	md: "h-9 w-9 text-xs",
	lg: "h-10 w-10 text-sm",
};

interface UserAvatarProps {
	firstName: string;
	lastName: string;
	avatar?: string | null;
	image?: string | null;
	size?: AvatarSize;
	className?: string;
}

export function UserAvatar({
	firstName,
	lastName,
	avatar,
	image,
	size = "lg",
	className,
}: UserAvatarProps) {
	const src = avatar ?? image ?? null;

	if (src) {
		return (
			<img
				src={src}
				alt={`${firstName} ${lastName}`}
				className={cn(
					"rounded-full object-cover shrink-0",
					SIZE_CLASSES[size],
					className,
				)}
			/>
		);
	}

	return (
		<div
			className={cn(
				"flex items-center justify-center rounded-full shrink-0 font-semibold",
				SIZE_CLASSES[size],
				className,
			)}
		>
			{getInitials(firstName, lastName)}
		</div>
	);
}
