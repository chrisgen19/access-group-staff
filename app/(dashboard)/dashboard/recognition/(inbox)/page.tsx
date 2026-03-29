import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { getUserRole, hasMinRole } from "@/lib/permissions";

export default async function RecognitionPage() {
	const session = await getServerSession();
	const isAdmin = hasMinRole(getUserRole(session), "ADMIN");

	redirect(isAdmin ? "/dashboard/recognition/all" : "/dashboard/recognition/received");
}
