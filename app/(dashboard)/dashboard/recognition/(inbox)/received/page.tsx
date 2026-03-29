import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { RecognitionTabShell } from "../../_components/recognition-tab-shell";
import { RecognitionFeedClient } from "../../_components/recognition-feed-client";

export default async function RecognitionReceivedPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	return (
		<RecognitionTabShell>
			{(onShare) => (
				<RecognitionFeedClient
					filter="received"
					currentUserId={session.user.id}
					emptyTitle="No recognition cards received yet"
					emptyDescription="When a colleague recognizes you, it will appear here."
					onShare={onShare}
				/>
			)}
		</RecognitionTabShell>
	);
}
