import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { AvatarUpload } from "./_components/avatar-upload";
import { ProfileForm } from "./_components/profile-form";

export default async function ProfilePage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const user = await prisma.user.findUniqueOrThrow({
		where: { id: session.user.id },
		select: {
			firstName: true,
			lastName: true,
			displayName: true,
			phone: true,
			position: true,
			branch: true,
			avatar: true,
			image: true,
		},
	});

	return (
		<div className="space-y-6">
			<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card px-8 py-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
				<AvatarUpload
					firstName={user.firstName}
					lastName={user.lastName}
					currentAvatar={user.avatar}
					currentImage={user.image}
				/>
			</div>
			<ProfileForm user={user} />
		</div>
	);
}
