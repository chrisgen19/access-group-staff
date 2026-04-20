import { prisma } from "@/lib/db";
import { deleteFromR2, getAvatarKey, getPublicUrl, uploadToR2 } from "@/lib/r2";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 2_000_000;
const GRAPH_PHOTO_URL = "https://graph.microsoft.com/v1.0/me/photo/$value";

export async function syncMicrosoftAvatar(userId: string, accessToken: string): Promise<void> {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { avatar: true },
	});
	if (!user || user.avatar) return;

	const res = await fetch(GRAPH_PHOTO_URL, {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	if (!res.ok) return;

	const rawContentType = res.headers.get("content-type") ?? "image/jpeg";
	const contentType = rawContentType.split(";")[0]?.trim() ?? "image/jpeg";
	if (!ALLOWED_TYPES.includes(contentType)) return;

	const buffer = Buffer.from(await res.arrayBuffer());
	if (buffer.byteLength === 0 || buffer.byteLength > MAX_SIZE) return;

	const key = getAvatarKey(userId, contentType);
	await uploadToR2(key, buffer, contentType);

	// Conditional update: only writes if avatar is still null. If the user
	// uploaded a custom avatar while we were fetching from Graph, count === 0
	// and we clean up the orphaned R2 object. Guarantees manual upload wins.
	const result = await prisma.user.updateMany({
		where: { id: userId, avatar: null },
		data: { avatar: getPublicUrl(key) },
	});

	if (result.count === 0) {
		await deleteFromR2(key).catch(() => {});
	}
}
