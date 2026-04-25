import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { ChangePasswordForm } from "../_components/change-password-form";
import { SetPasswordForm } from "../_components/set-password-form";

export default async function SecurityPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const credentialAccount = await prisma.account.findFirst({
		where: { userId: session.user.id, providerId: "credential" },
		select: { id: true },
	});

	if (!credentialAccount) {
		return <SetPasswordForm />;
	}

	return <ChangePasswordForm />;
}
