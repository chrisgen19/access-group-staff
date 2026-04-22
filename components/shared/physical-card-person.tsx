import { FitText } from "@/components/shared/fit-text";
import { type AvatarSize, UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

interface PhysicalCardPersonProps {
	firstName: string;
	lastName: string;
	avatar?: string | null;
	avatarSize?: AvatarSize;
	className?: string;
	textClassName?: string;
	avatarClassName?: string;
}

export function PhysicalCardPerson({
	firstName,
	lastName,
	avatar,
	avatarSize = "md",
	className,
	textClassName,
	avatarClassName,
}: PhysicalCardPersonProps) {
	return (
		<div className={cn("flex items-center gap-2 min-w-0", className)}>
			<UserAvatar
				firstName={firstName}
				lastName={lastName}
				avatar={avatar}
				size={avatarSize}
				className={cn("border border-black/10 bg-[#333] text-white shadow-sm", avatarClassName)}
			/>
			<div className="min-w-0 flex-1">
				<FitText className={cn("text-[#222]", textClassName)}>{`${firstName} ${lastName}`}</FitText>
			</div>
		</div>
	);
}
