"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { updateAvatarAction } from "@/lib/actions/profile-actions";
import { UserAvatar } from "@/components/shared/user-avatar";
import { cn } from "@/lib/utils";

interface AvatarUploadProps {
	firstName: string;
	lastName: string;
	currentAvatar: string | null;
	currentImage: string | null;
}

export function AvatarUpload({
	firstName,
	lastName,
	currentAvatar,
	currentImage,
}: AvatarUploadProps) {
	const router = useRouter();
	const inputRef = useRef<HTMLInputElement>(null);
	const [preview, setPreview] = useState<string | null>(null);
	const [isSaving, setIsSaving] = useState(false);
	const [isRemoving, setIsRemoving] = useState(false);

	function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			const img = new Image();
			img.onload = () => {
				const canvas = document.createElement("canvas");
				canvas.width = 200;
				canvas.height = 200;
				const ctx = canvas.getContext("2d");
				if (!ctx) return;

				// Centre-crop to square before resizing
				const size = Math.min(img.width, img.height);
				const sx = (img.width - size) / 2;
				const sy = (img.height - size) / 2;
				ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);

				setPreview(canvas.toDataURL("image/jpeg", 0.8));
			};
			img.src = ev.target?.result as string;
		};
		reader.readAsDataURL(file);
		// Reset so the same file can be re-selected
		e.target.value = "";
	}

	async function handleSave() {
		if (!preview) return;
		setIsSaving(true);
		try {
			const result = await updateAvatarAction(preview);
			if (result.success) {
				toast.success("Photo updated");
				setPreview(null);
				router.refresh();
			} else {
				toast.error(typeof result.error === "string" ? result.error : "Failed to save photo");
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
			const result = await updateAvatarAction(null);
			if (result.success) {
				toast.success("Photo removed");
				router.refresh();
			} else {
				toast.error(typeof result.error === "string" ? result.error : "Failed to remove photo");
			}
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsRemoving(false);
		}
	}

	const displayAvatar = preview ?? currentAvatar;
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
					size="lg"
					className={cn(
						"!h-20 !w-20 !text-2xl border-2 border-gray-200 dark:border-white/10",
						!displayAvatar && !currentImage && "bg-[oklch(0.96_0.03_18)] text-primary dark:bg-primary/15",
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
					JPG, PNG or GIF. Auto-resized to 200×200px.
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
