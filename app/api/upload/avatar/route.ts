import { AuthError, requireSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { deleteFromR2, extractKeyFromUrl, getAvatarKey, getPublicUrl, uploadToR2 } from "@/lib/r2";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 500_000; // 500KB — compressed 200×200 should be well under this

export async function POST(request: Request) {
	try {
		const session = await requireSession();

		const formData = await request.formData();
		const file = formData.get("file");

		if (!file || !(file instanceof File)) {
			return Response.json({ success: false, error: "No file provided" }, { status: 400 });
		}

		if (!ALLOWED_TYPES.includes(file.type)) {
			return Response.json(
				{ success: false, error: "Invalid file type. Use JPEG, PNG, or WebP." },
				{ status: 400 },
			);
		}

		if (file.size > MAX_SIZE) {
			return Response.json({ success: false, error: "File too large" }, { status: 400 });
		}

		// Fetch current avatar URL so we can delete the old R2 object after upload
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { avatar: true },
		});

		const buffer = Buffer.from(await file.arrayBuffer());
		const key = getAvatarKey(session.user.id, file.type);

		await uploadToR2(key, buffer, file.type);

		const url = getPublicUrl(key);

		await prisma.user.update({
			where: { id: session.user.id },
			data: { avatar: url },
		});

		// Delete old file from R2 after DB is updated — non-fatal but awaited
		if (user?.avatar) {
			const oldKey = extractKeyFromUrl(user.avatar);
			if (oldKey) {
				await deleteFromR2(oldKey).catch(() => {});
			}
		}

		return Response.json({ success: true, data: { url } });
	} catch (error) {
		if (error instanceof AuthError) {
			return Response.json({ success: false, error: error.message }, { status: error.status });
		}
		const message = error instanceof Error ? error.message : "Upload failed";
		return Response.json({ success: false, error: message }, { status: 500 });
	}
}
