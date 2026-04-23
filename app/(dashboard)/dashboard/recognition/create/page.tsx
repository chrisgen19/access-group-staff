import { redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { getServerSession } from "@/lib/auth-utils";
import { RecognitionForm } from "../_components/recognition-form";

export default async function CreateRecognitionPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<DashboardPageHeader
				eyebrow="Recognition"
				title="Send Recognition Card"
				description="Create and review a recognition card before sending it to a colleague."
			/>
			<div className="mx-auto max-w-5xl py-2">
				<RecognitionForm />
			</div>
		</div>
	);
}
