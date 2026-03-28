import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { RecognitionForm } from "./_components/recognition-form";
import { RecognitionFeed } from "./_components/recognition-feed";

export default async function RecognitionPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	return (
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div>
				<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
					Recognition Card
				</h1>
				<p className="mt-2 text-base text-muted-foreground">
					Recognize your colleagues with digital thank-you cards tied
					to company values.
				</p>
			</div>
			<RecognitionForm />
			<RecognitionFeed />
		</div>
	);
}
