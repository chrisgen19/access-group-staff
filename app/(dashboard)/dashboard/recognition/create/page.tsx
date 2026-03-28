import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { RecognitionForm } from "../_components/recognition-form";

export default async function CreateRecognitionPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	return (
		<div className="max-w-5xl mx-auto py-4">
			<RecognitionForm />
		</div>
	);
}
