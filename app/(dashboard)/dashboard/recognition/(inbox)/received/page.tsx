import { getServerSession } from "@/lib/auth-utils";
import { RecognitionFeedClient } from "../../_components/recognition-feed-client";

export default async function RecognitionReceivedPage() {
	const session = await getServerSession();

	return (
		<RecognitionFeedClient
			filter="received"
			currentUserId={session!.user.id}
			emptyTitle="No recognition cards received yet"
			emptyDescription="When a colleague recognizes you, it will appear here."
		/>
	);
}
