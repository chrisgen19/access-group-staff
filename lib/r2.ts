import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env";

function getR2Client(): S3Client {
	if (!env.CLOUDFLARE_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
		throw new Error("R2 environment variables are not configured");
	}
	return new S3Client({
		region: "auto",
		endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
		credentials: {
			accessKeyId: env.R2_ACCESS_KEY_ID,
			secretAccessKey: env.R2_SECRET_ACCESS_KEY,
		},
	});
}

const MIME_EXTENSIONS: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

export function getAvatarKey(userId: string, contentType: string): string {
	const ext = MIME_EXTENSIONS[contentType] ?? "jpg";
	return `avatars/${userId}/${Date.now()}.${ext}`;
}

export function getPublicUrl(key: string): string {
	if (!env.R2_PUBLIC_URL) throw new Error("R2_PUBLIC_URL is not configured");
	return `${env.R2_PUBLIC_URL}/${key}`;
}

/** Extracts the R2 object key from a public URL. Returns null if not an R2 URL. */
export function extractKeyFromUrl(url: string): string | null {
	if (!env.R2_PUBLIC_URL || !url.startsWith(env.R2_PUBLIC_URL)) return null;
	return url.slice(env.R2_PUBLIC_URL.length + 1);
}

export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<void> {
	if (!env.R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not configured");
	await getR2Client().send(
		new PutObjectCommand({
			Bucket: env.R2_BUCKET_NAME,
			Key: key,
			Body: body,
			ContentType: contentType,
		}),
	);
}

export async function deleteFromR2(key: string): Promise<void> {
	if (!env.R2_BUCKET_NAME) throw new Error("R2_BUCKET_NAME is not configured");
	await getR2Client().send(
		new DeleteObjectCommand({
			Bucket: env.R2_BUCKET_NAME,
			Key: key,
		}),
	);
}
