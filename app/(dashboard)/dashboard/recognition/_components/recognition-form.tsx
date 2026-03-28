"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, ChevronDown, X } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { createRecognitionCardAction } from "@/lib/actions/recognition-actions";
import {
	createRecognitionCardSchema,
	type CreateRecognitionCardInput,
} from "@/lib/validations/recognition";

const inputClass =
	"block w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-card focus:ring-4 focus:ring-primary/30 focus:border-primary transition-all duration-200";

interface ActiveUser {
	id: string;
	firstName: string;
	lastName: string;
	position: string | null;
}

const COMPANY_VALUES = [
	{ key: "valuesPeople" as const, label: "People" },
	{ key: "valuesSafety" as const, label: "Safety" },
	{ key: "valuesRespect" as const, label: "Respect" },
	{ key: "valuesCommunication" as const, label: "Communication" },
	{
		key: "valuesContinuousImprovement" as const,
		label: "Continuous Improvement",
	},
];

export function RecognitionForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: session } = useSession();
	const [isLoading, setIsLoading] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");
	const [isDropdownOpen, setIsDropdownOpen] = useState(false);
	const [selectedUser, setSelectedUser] = useState<ActiveUser | null>(null);
	const dropdownRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		reset,
		formState: { errors },
	} = useForm<CreateRecognitionCardInput>({
		resolver: zodResolver(createRecognitionCardSchema),
		defaultValues: {
			recipientId: "",
			message: "",
			date: new Date().toISOString().split("T")[0],
			valuesPeople: false,
			valuesSafety: false,
			valuesRespect: false,
			valuesCommunication: false,
			valuesContinuousImprovement: false,
		},
	});

	const { data: usersData } = useQuery<{ success: boolean; data: ActiveUser[] }>({
		queryKey: ["active-users"],
		queryFn: async () => {
			const res = await fetch("/api/recognition/users");
			if (!res.ok) throw new Error("Failed to fetch users");
			return res.json();
		},
	});

	const availableUsers = (usersData?.data ?? []).filter(
		(user) => user.id !== session?.user?.id,
	);

	const filteredUsers = availableUsers.filter((user) => {
		const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
		return fullName.includes(searchQuery.toLowerCase());
	});

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (
				dropdownRef.current &&
				!dropdownRef.current.contains(event.target as Node)
			) {
				setIsDropdownOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	function handleSelectUser(user: ActiveUser) {
		setSelectedUser(user);
		setValue("recipientId", user.id, { shouldValidate: true });
		setSearchQuery("");
		setIsDropdownOpen(false);
	}

	function handleClearSelection() {
		setSelectedUser(null);
		setValue("recipientId", "", { shouldValidate: true });
		setSearchQuery("");
		inputRef.current?.focus();
	}

	async function onSubmit(data: CreateRecognitionCardInput) {
		setIsLoading(true);
		try {
			const result = await createRecognitionCardAction(data);

			if (!result.success) {
				const errorMsg =
					typeof result.error === "string"
						? result.error
						: "Validation failed. Check the form fields.";
				toast.error(errorMsg);
				return;
			}

			toast.success("Recognition card sent!");
			await queryClient.invalidateQueries({
				queryKey: ["recognition-cards"],
			});
			router.push("/dashboard/recognition");
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
					Send Recognition
				</h3>
				<p className="mt-1 text-sm text-muted-foreground">
					Recognize a colleague for demonstrating company values.
				</p>
			</div>
			<form onSubmit={handleSubmit(onSubmit)}>
				<div className="px-8 py-6 space-y-5">
					{/* Recipient Combobox */}
					<div>
						<label className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5">
							Recipient
						</label>
						<div className="relative" ref={dropdownRef}>
							{selectedUser ? (
								<div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 px-4 py-3">
									<span className="text-sm text-foreground">
										{selectedUser.firstName} {selectedUser.lastName}
										{selectedUser.position && (
											<span className="text-muted-foreground">
												{" "}
												— {selectedUser.position}
											</span>
										)}
									</span>
									<button
										type="button"
										onClick={handleClearSelection}
										className="ml-2 text-muted-foreground hover:text-foreground transition-colors"
									>
										<X size={16} />
									</button>
								</div>
							) : (
								<div className="relative">
									<Search
										size={16}
										className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground"
									/>
									<input
										ref={inputRef}
										type="text"
										placeholder="Search for a colleague..."
										value={searchQuery}
										onChange={(e) => {
											setSearchQuery(e.target.value);
											setIsDropdownOpen(true);
										}}
										onFocus={() => setIsDropdownOpen(true)}
										className={`${inputClass} pl-10 pr-10`}
									/>
									<ChevronDown
										size={16}
										className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
									/>
								</div>
							)}

							{isDropdownOpen && !selectedUser && (
								<div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-gray-200 dark:border-white/10 bg-card shadow-lg">
									{filteredUsers.length === 0 ? (
										<div className="px-4 py-3 text-sm text-muted-foreground">
											No users found
										</div>
									) : (
										filteredUsers.map((user) => (
											<button
												key={user.id}
												type="button"
												onMouseDown={(e) => e.preventDefault()}
												onClick={() => handleSelectUser(user)}
												className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
											>
												<div>
													<span className="font-medium text-foreground">
														{user.firstName} {user.lastName}
													</span>
													{user.position && (
														<span className="ml-2 text-muted-foreground">
															{user.position}
														</span>
													)}
												</div>
											</button>
										))
									)}
								</div>
							)}
						</div>
						{errors.recipientId && (
							<p className="mt-1 text-sm text-destructive">
								{errors.recipientId.message}
							</p>
						)}
					</div>

					{/* Message */}
					<div>
						<label
							htmlFor="message"
							className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
						>
							Message
						</label>
						<textarea
							id="message"
							rows={3}
							placeholder="What did they do that you appreciate?"
							className={`${inputClass} resize-none`}
							{...register("message")}
						/>
						{errors.message && (
							<p className="mt-1 text-sm text-destructive">
								{errors.message.message}
							</p>
						)}
					</div>

					{/* Date */}
					<div>
						<label
							htmlFor="date"
							className="block text-sm font-medium text-foreground/70 ml-1 mb-1.5"
						>
							Date
						</label>
						<input
							id="date"
							type="date"
							className={inputClass}
							{...register("date")}
						/>
						{errors.date && (
							<p className="mt-1 text-sm text-destructive">
								{errors.date.message}
							</p>
						)}
					</div>

					{/* Company Values */}
					<div>
						<label className="block text-sm font-medium text-foreground/70 ml-1 mb-2">
							Company Values
						</label>
						<div className="flex flex-wrap gap-3">
							{COMPANY_VALUES.map((value) => {
								const checked = watch(value.key);
								return (
									<label
										key={value.key}
										className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-200 ${
											checked
												? "border-primary bg-primary/10 text-primary dark:bg-primary/15"
												: "border-gray-200 dark:border-white/10 text-muted-foreground hover:border-gray-300 dark:hover:border-white/20"
										}`}
									>
										<input
											type="checkbox"
											checked={checked}
											onChange={(e) =>
												setValue(value.key, e.target.checked, {
													shouldValidate: true,
												})
											}
											className="sr-only"
										/>
										{value.label}
									</label>
								);
							})}
						</div>
						{errors.valuesPeople && (
							<p className="mt-2 text-sm text-destructive">
								{errors.valuesPeople.message}
							</p>
						)}
					</div>
				</div>

				<div className="px-8 py-6 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-200/60 dark:border-white/10 flex flex-row-reverse gap-3">
					<button
						type="submit"
						disabled={isLoading}
						className="inline-flex justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 disabled:opacity-50"
					>
						{isLoading && (
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
						)}
						Send Recognition
					</button>
					<button
						type="button"
						onClick={() => router.push("/dashboard/recognition")}
						className="inline-flex justify-center rounded-full border border-gray-200 dark:border-white/10 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-white/10 transition-all duration-200"
					>
						Cancel
					</button>
				</div>
			</form>
		</div>
	);
}
