import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { getUserRole, hasMinRole } from "@/lib/permissions";
import { RecognitionTable } from "../../_components/recognition-table";

export default async function RecognitionAllPage() {
	const session = await getServerSession();

	if (!hasMinRole(getUserRole(session), "ADMIN")) {
		redirect("/dashboard/recognition/received");
	}

	return <RecognitionTable />;
}
