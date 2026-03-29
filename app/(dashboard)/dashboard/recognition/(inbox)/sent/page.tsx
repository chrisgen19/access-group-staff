import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { RecognitionTabShell } from "../../_components/recognition-tab-shell";
import { RecognitionFeedClient } from "../../_components/recognition-feed-client";

export default async function RecognitionSentPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	return (
		<RecognitionTabShell>
			{(onShare) => (
				<RecognitionFeedClient
					filter="sent"
					currentUserId={session.user.id}
					emptyTitle="You haven't sent any cards yet"
					emptyDescription="Recognize a colleague to get started!"
					onShare={onShare}
				/>
			)}
		</RecognitionTabShell>
	);
}
