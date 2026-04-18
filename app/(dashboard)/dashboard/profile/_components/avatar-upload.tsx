"use client";

import { Camera, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { removeAvatarAction } from "@/lib/actions/profile-actions";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
	firstName: string;
	lastName: string;
	currentAvatar: string | null;
	currentImage: string | null;
}

interface Preview {
	dataUrl: string;
	blob: Blob;
	filename: string;
}

const MIME_EXT: Record<string, string> = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

function compressToBlob(file: File): Promise<Preview> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = (ev) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = 200;
				canvas.height = 200;
				const ctx = canvas.getContext("2d");
				if (!ctx) return reject(new Error("Canvas not available"));

				// Only fill white for JPEG (no alpha channel) — preserve transparency for PNG/WebP
				const outputType = MIME_EXT[file.type] ? file.type : "image/jpeg";
				if (outputType === "image/jpeg") {
					ctx.fillStyle = "#ffffff";
					ctx.fillRect(0, 0, 200, 200);
				}

				// Centre-crop to square before resizing
				const size = Math.min(img.width, img.height);
				const sx = (img.width - size) / 2;
				const sy = (img.height - size) / 2;
				ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);

				const quality = outputType === "image/png" ? undefined : 0.8;
				const ext = MIME_EXT[outputType] ?? "jpg";
				const dataUrl = canvas.toDataURL(outputType, quality);
				canvas.toBlob(
					(blob) => {
						if (blob) resolve({ dataUrl, blob, filename: `avatar.${ext}` });
						else reject(new Error("Compression failed"));
					},
					outputType,
					quality,
				);
			};
			img.onerror = reject;
			img.src = ev.target?.result as string;
		};
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

export function AvatarUpload({
	firstName,
	lastName,
	currentAvatar,
	currentImage,
}: AvatarUploadProps) {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [preview, setPreview] = useState<Preview | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);

	async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;
		e.target.value = "";

		try {
			const compressed = await compressToBlob(file);
			setPreview(compressed);
		} catch {
			toast.error("Failed to process image");
		}
	}

	async function handleSave() {
		if (!preview) return;
		setIsSaving(true);
		try {
			const formData = new FormData();
			formData.append("file", preview.blob, preview.filename);

			const res = await fetch("/api/upload/avatar", {
				method: "POST",
				body: formData,
			});
			const result = await res.json();

			if (result.success) {
				toast.success("Photo updated");
				setPreview(null);
				// updateUser triggers the session broadcast so useSession() picks up the change
				await authClient.updateUser({ avatar: result.data.url });
				router.refresh();
			} else {
				toast.error(result.error ?? "Failed to save photo");
			}
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsSaving(false);
		}
	}

	async function handleRemove() {
		setIsRemoving(true);
		try {
			const result = await removeAvatarAction();
			if (result.success) {
				toast.success("Photo removed");
				// Trigger session broadcast with a no-op name update — avatar is
				// already null from removeAvatarAction, so we must not overwrite it
				await authClient.updateUser({ name: `${firstName} ${lastName}` });
				router.refresh();
			} else {
				toast.error(result.error ?? "Failed to remove photo");
			}
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsRemoving(false);
		}
	}

	const displayAvatar = preview?.dataUrl ?? currentAvatar;
	const hasPhoto = !!displayAvatar || !!currentImage;

	return (
		<div className="flex items-center gap-6">
			{/* Avatar with camera overlay */}
			<div className="relative shrink-0">
				<UserAvatar
					firstName={firstName}
					lastName={lastName}
					avatar={displayAvatar}
					image={currentImage}
					size="xl"
					className={cn(
						"border-2 border-gray-200 dark:border-white/10",
						!displayAvatar &&
							!currentImage &&
							"bg-[oklch(0.96_0.03_18)] text-primary dark:bg-primary/15",
					)}
				/>
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 hover:opacity-100 focus:opacity-100 transition-opacity"
					aria-label="Upload photo"
				>
					<Camera size={20} className="text-white" />
				</button>
				<input
					ref={inputRef}
					type="file"
					accept="image/*"
					className="hidden"
					onChange={handleFileSelect}
				/>
			</div>

			<div className="flex flex-col gap-2">
				<p className="text-sm font-medium text-foreground">Profile Photo</p>
				<p className="text-xs text-muted-foreground">
					JPG, PNG or WebP. Auto-resized to 200×200px.
				</p>

				<div className="flex gap-2 mt-1">
					{preview ? (
						<>
							<button
								type="button"
								onClick={handleSave}
								disabled={isSaving}
								className="inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
							>
								{isSaving && <Loader2 size={12} className="animate-spin" />}
								Save photo
							</button>
							<button
								type="button"
								onClick={() => setPreview(null)}
								disabled={isSaving}
								className="inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-white/10 px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
							>
								<X size={12} />
								Cancel
							</button>
						</>
					) : (
						<>
							<button
								type="button"
								onClick={() => inputRef.current?.click()}
								className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-white/10 px-4 py-1.5 text-xs font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
							>
								<Camera size={12} />
								{hasPhoto ? "Change photo" : "Upload photo"}
							</button>
							{currentAvatar && (
								<button
									type="button"
									onClick={handleRemove}
									disabled={isRemoving}
									className="inline-flex items-center gap-1 rounded-full border border-red-200 dark:border-red-500/20 px-4 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
								>
									{isRemoving ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
									Remove
								</button>
							)}
						</>
					)}
				</div>
			</div>
		</div>
	);
}
