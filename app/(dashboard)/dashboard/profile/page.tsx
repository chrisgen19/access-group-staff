import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { ProfileForm } from "./_components/profile-form";

export default async function ProfilePage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const user = await prisma.user.findUniqueOrThrow({
		where: { id: session.user.id },
		include: { department: true },
	});

	return (
		<ProfileForm
			user={{
				firstName: user.firstName,
				lastName: user.lastName,
				displayName: user.displayName,
				email: user.email,
				phone: user.phone,
				position: user.position,
				role: user.role,
				department: user.department,
			}}
		/>
	);
}
