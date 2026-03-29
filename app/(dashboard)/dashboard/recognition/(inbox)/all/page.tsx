import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth-utils";
import { hasMinRole } from "@/lib/permissions";
import type { Role } from "@/app/generated/prisma/client";
import { RecognitionTable } from "../../_components/recognition-table";

export default async function RecognitionAllPage() {
	let session: Awaited<ReturnType<typeof requireSession>>;
	try {
		session = await requireSession();
	} catch {
		redirect("/login");
	}

	const userRole = (session.user.role as Role) ?? "STAFF";
	if (!hasMinRole(userRole, "ADMIN")) {
		redirect("/dashboard/recognition/received");
	}

	return <RecognitionTable />;
}
