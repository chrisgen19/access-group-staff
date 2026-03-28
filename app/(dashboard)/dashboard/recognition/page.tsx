import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Heart } from "lucide-react";

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
					Recognize your colleagues with digital thank-you cards tied to
					company values.
				</p>
			</div>
			<div className="flex flex-col items-center justify-center rounded-[2rem] border border-gray-200 dark:border-white/10 bg-card p-16 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="mb-6 rounded-full bg-background p-6">
					<Heart
						size={48}
						className="text-muted-foreground opacity-40"
					/>
				</div>
				<p className="text-[1.5rem] font-medium text-foreground">
					Recognition cards coming soon
				</p>
				<p className="mt-2 text-base text-muted-foreground">
					This is where you&apos;ll send and view recognition cards for
					your colleagues.
				</p>
			</div>
		</div>
	);
}
