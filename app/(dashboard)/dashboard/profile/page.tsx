import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
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
		},
	});

	return <ProfileForm user={user} />;
}
