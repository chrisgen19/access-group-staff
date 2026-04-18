"use client";

import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateProfileAction } from "@/lib/actions/profile-actions";

const inputClass =
	"block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200";

const selectClass =
	"block w-full appearance-none rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200";

interface ProfileFormProps {
	user: {
		firstName: string;
		lastName: string;
		displayName: string | null;
		phone: string | null;
		position: string | null;
		branch: string | null;
	};
}

export function ProfileForm({ user }: ProfileFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const defaultValues = {
		firstName: user.firstName,
		lastName: user.lastName,
		displayName: user.displayName ?? "",
		phone: user.phone ?? "",
		position: user.position ?? "",
		branch: user.branch ?? null,
	};

	const { register, handleSubmit, watch, setValue } = useForm({
		defaultValues,
	});

	async function onSubmit(data: typeof defaultValues) {
		setIsLoading(true);
		try {
			const result = await updateProfileAction(data);
			if (result.success) {
				toast.success("Profile updated");
				router.refresh();
			} else {
				const errorMsg = typeof result.error === "string" ? result.error : "Update failed";
				toast.error(errorMsg);
			}
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
			<div className="px-8 pt-8 pb-2">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Edit Profile
				</h3>
			</div>

			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="px-8 py-6 space-y-5">
					<div className="grid grid-cols-2 gap-5">
						<div>
							<label
								htmlFor="firstName"
								className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
							>
								First Name
							</label>
							<input id="firstName" className={inputClass} {...register("firstName")} />
						</div>
						<div>
							<label
								htmlFor="lastName"
								className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
							>
								Last Name
							</label>
							<input id="lastName" className={inputClass} {...register("lastName")} />
						</div>
					</div>

					<div>
						<label
							htmlFor="displayName"
							className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
						>
							Display Name
						</label>
						<input id="displayName" className={inputClass} {...register("displayName")} />
					</div>

					<div className="grid grid-cols-2 gap-5">
						<div>
							<label
								htmlFor="phone"
								className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
							>
								Phone
							</label>
							<input id="phone" className={inputClass} {...register("phone")} />
						</div>
						<div>
							<label
								htmlFor="position"
								className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
							>
								Position
							</label>
							<input id="position" className={inputClass} {...register("position")} />
						</div>
					</div>

					<div>
						<label className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
							Branch
						</label>
						<select
							value={watch("branch") ?? "none"}
							onChange={(e) =>
								setValue("branch", e.target.value === "none" ? null : e.target.value)
							}
							className={selectClass}
						>
							<option value="none">No Branch</option>
							<option value="ISO">ISO</option>
							<option value="PERTH">Perth</option>
						</select>
					</div>
				</div>

				<div className="px-8 py-6 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200/60 dark:border-white/10 flex justify-end">
					<button
						type="submit"
						disabled={isLoading}
						className="inline-flex justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50"
					>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Save Changes
					</button>
				</div>
			</form>
		</div>
	);
}
