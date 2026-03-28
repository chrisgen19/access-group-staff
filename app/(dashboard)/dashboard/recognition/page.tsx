import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
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
			<RecognitionFeed />

			<Link
				href="/dashboard/recognition/create"
				className="fixed bottom-8 right-8 z-50 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200"
			>
				<Plus size={20} strokeWidth={2.5} />
				Send Recognition Card
			</Link>
		</div>
	);
}
