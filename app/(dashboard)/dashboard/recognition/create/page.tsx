import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { RecognitionForm } from "../_components/recognition-form";

export default async function CreateRecognitionPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	return (
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div>
				<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
					Send Recognition Card
				</h1>
				<p className="mt-2 text-base text-muted-foreground">
					Recognize a colleague for demonstrating company values.
				</p>
			</div>
			<RecognitionForm />
		</div>
	);
}
