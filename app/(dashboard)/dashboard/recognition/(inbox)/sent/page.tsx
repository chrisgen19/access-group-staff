import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { RecognitionFeedClient } from "../../_components/recognition-feed-client";

export default async function RecognitionSentPage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	return (
		<RecognitionFeedClient
			filter="sent"
			currentUserId={session.user.id}
			emptyTitle="You haven't sent any cards yet"
			emptyDescription="Recognize a colleague to get started!"
		/>
	);
}
