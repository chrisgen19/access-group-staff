import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { env } from "@/env";

export const r2 = new S3Client({
	region: "auto",
	endpoint: `https://${env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: env.R2_ACCESS_KEY_ID,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY,
	},
});

export function getAvatarKey(userId: string): string {
	return `avatars/${userId}/${Date.now()}.jpg`;
}

export function getPublicUrl(key: string): string {
	return `${env.R2_PUBLIC_URL}/${key}`;
}

/** Extracts the R2 object key from a public URL. Returns null if not an R2 URL. */
export function extractKeyFromUrl(url: string): string | null {
	if (!url.startsWith(env.R2_PUBLIC_URL)) return null;
	return url.slice(env.R2_PUBLIC_URL.length + 1);
}

export async function uploadToR2(key: string, body: Buffer, contentType: string): Promise<void> {
	await r2.send(
		new PutObjectCommand({
			Bucket: env.R2_BUCKET_NAME,
			Key: key,
			Body: body,
			ContentType: contentType,
		}),
	);
}

export async function deleteFromR2(key: string): Promise<void> {
	await r2.send(
		new DeleteObjectCommand({
			Bucket: env.R2_BUCKET_NAME,
			Key: key,
		}),
	);
}
