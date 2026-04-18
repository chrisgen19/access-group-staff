import { getServerSession } from "@/lib/auth-utils";
import { getUserRole, hasMinRole } from "@/lib/permissions";
import { RecognitionFeedClient } from "../../_components/recognition-feed-client";

export default async function RecognitionSentPage() {
	const session = await getServerSession();

	return (
		<RecognitionFeedClient
			filter="sent"
			currentUserId={session!.user.id}
			isAdmin={hasMinRole(getUserRole(session), "ADMIN")}
			emptyTitle="You haven't sent any cards yet"
			emptyDescription="Recognize a colleague to get started!"
		/>
	);
}
