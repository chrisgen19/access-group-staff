"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Roboto } from "next/font/google";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, ChevronDown, X } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { createRecognitionCardAction } from "@/lib/actions/recognition-actions";
import {
	createRecognitionCardSchema,
	type CreateRecognitionCardInput,
} from "@/lib/validations/recognition";
import {
	AccessGroupLogo,
	AccessBusinessLogo,
	BackgroundGraphic,
} from "./card-assets";

const roboto = Roboto({ subsets: ["latin"], weight: ["900"] });

interface ActiveUser {
	id: string;
	firstName: string;
	lastName: string;
	position: string | null;
	department: { name: string } | null;
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

function ValueCheckbox({
	checked,
	onChange,
	label,
	isLarge,
}: {
	checked: boolean;
	onChange: () => void;
	label: string;
	isLarge?: boolean;
}) {
	return (
		<label
			className={`flex items-center ${isLarge ? "gap-2" : "gap-1.5"} cursor-pointer group`}
		>
			<div className="relative flex items-center justify-center">
				<input
					type="checkbox"
					className="sr-only"
					checked={checked}
					onChange={onChange}
				/>
				<div
					className={`transition-colors duration-200 flex-shrink-0 ${
						isLarge ? "w-8 h-8" : "w-3.5 h-3.5 md:w-4 md:h-4"
					} ${checked ? "bg-[#333]" : "bg-[#e5e7eb] group-hover:bg-[#d1d5db]"}`}
				/>
			</div>
			<span
				className={`font-black text-[#222] uppercase ${
					isLarge
						? "text-2xl tracking-tight"
						: "text-[8.5px] md:text-[10px]"
				} ${label === "Continuous Improvement" && !isLarge ? "leading-[1.1]" : ""}`}
			>
				{isLarge ? (
					label
				) : label === "Continuous Improvement" ? (
					<>
						Continuous
						<br />
						Improvement
					</>
				) : (
					label
				)}
			</span>
		</label>
	);
}

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

	const senderName = session?.user
		? `${session.user.firstName} ${session.user.lastName}`
		: "";

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
	} = useForm<CreateRecognitionCardInput>({
		resolver: zodResolver(createRecognitionCardSchema),
		defaultValues: {
			recipientId: "",
			message: "",
			date: new Date(
				Date.now() - new Date().getTimezoneOffset() * 60_000,
			)
				.toISOString()
				.split("T")[0],
			valuesPeople: false,
			valuesSafety: false,
			valuesRespect: false,
			valuesCommunication: false,
			valuesContinuousImprovement: false,
		},
	});

	const watchedMessage = watch("message");
	const watchedDate = watch("date");

	const { data: usersData } = useQuery<{
		success: boolean;
		data: ActiveUser[];
	}>({
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
		return () =>
			document.removeEventListener("mousedown", handleClickOutside);
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

	function toggleValue(key: (typeof COMPANY_VALUES)[number]["key"]) {
		setValue(key, !watch(key), { shouldValidate: true });
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
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col items-center gap-8"
		>
			{/* --- CARD 1 (FRONT) --- */}
			<div className="w-full max-w-5xl bg-[#e6e7e8] relative shadow-2xl flex flex-col overflow-hidden">
				{/* Red Header */}
				<div className="bg-[#e31837] h-28 flex items-center justify-between px-6 md:px-12 z-10">
					<AccessGroupLogo color="#ffffff" />
					<AccessBusinessLogo color="#ffffff" />
				</div>

				{/* Content Area */}
				<div className="flex flex-col md:flex-row p-6 md:p-8 gap-8 relative">
					{/* Left Column (Preview Fields) */}
					<div className="flex-1 flex flex-col gap-3 z-10">
						<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm">
							<span className="text-xs font-black text-black mb-1">
								TEAM MEMBER NAME
							</span>
							<span className="text-lg text-[#222] min-h-[1.75rem]">
								{selectedUser
									? `${selectedUser.firstName} ${selectedUser.lastName}`
									: ""}
							</span>
						</div>

						<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm min-h-[160px] flex-grow">
							<span className="text-xs font-black text-black mb-1">
								WHAT TEAM MEMBER DID
							</span>
							<p className="text-base text-[#222] whitespace-pre-wrap">
								{watchedMessage}
							</p>
						</div>

						<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm">
							<span className="text-xs font-black text-black mb-1">
								DEPARTMENT/LOCATION
							</span>
							<span className="text-lg text-[#222] min-h-[1.75rem]">
								{selectedUser?.department?.name ?? ""}
							</span>
						</div>

						<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm">
							<span className="text-xs font-black text-black mb-1">
								MY NAME
							</span>
							<span className="text-lg text-[#222] min-h-[1.75rem]">
								{senderName}
							</span>
						</div>

						<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm">
							<span className="text-xs font-black text-black mb-1">
								DATE
							</span>
							<span className="text-lg text-[#222] min-h-[1.75rem]">
								{watchedDate}
							</span>
						</div>
					</div>

					{/* Right Column (Text) */}
					<div className="flex-1 flex flex-col justify-center pl-4 md:pl-8 z-10 min-w-0">
						<h1
							className={`${roboto.className} text-[#e31837] text-xl sm:text-2xl md:text-3xl lg:text-[2rem] uppercase leading-none mb-4 md:mb-6 tracking-tight whitespace-nowrap`}
						>
							Thank you for your
							<br />
							contribution
						</h1>
						<h2
							className={`${roboto.className} text-[#222] text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] uppercase leading-[0.95] tracking-tighter whitespace-nowrap`}
						>
							Access is proud
							<br />
							because of team
							<br />
							members like you.
						</h2>
					</div>

					{/* Large Faint White Graphic */}
					<div className="absolute left-[45%] top-[10%] w-[60%] h-[90%] pointer-events-none text-white opacity-60">
						<BackgroundGraphic
							preserveAspectRatio="xMinYMin meet"
							className="w-full h-full scale-[1.7] md:scale-[2] origin-top-left"
						/>
					</div>
				</div>
			</div>

			{/* --- CARD 2 (BACK / EDITABLE FORM) --- */}
			<div className="w-full max-w-5xl bg-[#e6e7e8] p-4 md:p-8 relative shadow-2xl flex flex-col md:flex-row gap-4 md:gap-6">
				{/* Crop Marks */}
				<div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-gray-400" />
				<div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-gray-400" />
				<div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-gray-400" />
				<div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-gray-400" />

				{/* Left Column */}
				<div className="flex-1 flex flex-col gap-4">
					{/* TO — Searchable Combobox */}
					<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col h-20 shadow-sm relative">
						<span className="text-xs font-black text-black mb-1">
							TO
						</span>
						<div className="relative flex-1" ref={dropdownRef}>
							{selectedUser ? (
								<div className="flex items-center justify-between h-full">
									<span className="text-lg text-[#222]">
										{selectedUser.firstName}{" "}
										{selectedUser.lastName}
									</span>
									<button
										type="button"
										onClick={handleClearSelection}
										className="text-gray-400 hover:text-[#222] transition-colors"
									>
										<X size={16} />
									</button>
								</div>
							) : (
								<>
									<div className="relative h-full flex items-center">
										<Search
											size={14}
											className="absolute left-0 text-gray-400"
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
											onFocus={() =>
												setIsDropdownOpen(true)
											}
											className="w-full pl-5 outline-none text-lg bg-transparent placeholder:text-gray-400"
											spellCheck="false"
										/>
										<ChevronDown
											size={14}
											className="absolute right-0 text-gray-400 pointer-events-none"
										/>
									</div>
									{isDropdownOpen && (
										<div className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-sm">
											{filteredUsers.length === 0 ? (
												<div className="px-4 py-3 text-sm text-gray-400">
													No users found
												</div>
											) : (
												filteredUsers.map((user) => (
													<button
														key={user.id}
														type="button"
														onMouseDown={(e) =>
															e.preventDefault()
														}
														onClick={() =>
															handleSelectUser(
																user,
															)
														}
														className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors"
													>
														<div>
															<span className="font-medium text-[#222]">
																{user.firstName}{" "}
																{user.lastName}
															</span>
															{user.department && (
																<span className="ml-2 text-gray-400">
																	{
																		user
																			.department
																			.name
																	}
																</span>
															)}
														</div>
													</button>
												))
											)}
										</div>
									)}
								</>
							)}
						</div>
						{errors.recipientId && (
							<p className="absolute -bottom-5 left-0 text-xs text-red-600">
								{errors.recipientId.message}
							</p>
						)}
					</div>

					{/* WHAT YOU DID */}
					<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col flex-grow min-h-[300px] shadow-sm relative">
						<span className="text-xs font-black text-black mb-2">
							WHAT YOU DID
						</span>
						<textarea
							{...register("message")}
							className="w-full flex-grow outline-none resize-none text-base bg-transparent mb-12 text-[#222] placeholder:text-gray-400"
							placeholder="Describe what this team member did..."
							spellCheck="false"
						/>
						{errors.message && (
							<p className="text-xs text-red-600 mb-2">
								{errors.message.message}
							</p>
						)}

						{/* Small Value Checkboxes */}
						<div className="absolute bottom-4 left-4 right-4">
							<span className="text-[10px] font-black text-black mb-2 block uppercase">
								Which values were demonstrated?
							</span>
							<div className="flex justify-between items-center w-full gap-1">
								{COMPANY_VALUES.map((v) => (
									<ValueCheckbox
										key={v.key}
										checked={watch(v.key)}
										onChange={() => toggleValue(v.key)}
										label={v.label}
									/>
								))}
							</div>
							{errors.valuesPeople && (
								<p className="text-xs text-red-600 mt-1">
									{errors.valuesPeople.message}
								</p>
							)}
						</div>
					</div>

					{/* FROM + DATE */}
					<div className="flex gap-4">
						<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col flex-1 h-20 shadow-sm">
							<span className="text-xs font-black text-black mb-1">
								FROM
							</span>
							<span className="text-lg text-[#222]">
								{senderName}
							</span>
						</div>
						<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col flex-1 h-20 shadow-sm">
							<span className="text-xs font-black text-black mb-1">
								DATE
							</span>
							<input
								type="date"
								{...register("date")}
								className="w-full outline-none text-lg bg-transparent text-[#222]"
							/>
							{errors.date && (
								<p className="text-xs text-red-600">
									{errors.date.message}
								</p>
							)}
						</div>
					</div>
				</div>

				{/* Right Column */}
				<div className="flex-1 flex flex-col gap-4">
					{/* Logos */}
					<div className="h-24 flex items-center justify-between px-2">
						<AccessGroupLogo color="#e31837" />
						<AccessBusinessLogo color="#e31837" />
					</div>

					{/* Large Value Checkboxes */}
					<div className="bg-white p-6 md:p-8 rounded-sm flex flex-col flex-grow shadow-sm relative overflow-hidden">
						<div className="absolute left-[20%] top-[10%] w-[80%] h-[90%] pointer-events-none text-black opacity-[0.05]">
							<BackgroundGraphic
								preserveAspectRatio="xMinYMin meet"
								className="w-full h-full scale-[1.7] md:scale-[2] origin-top-left"
							/>
						</div>

						<h2 className="text-[#e31837] text-[15px] font-bold mb-8 relative z-10">
							WHICH ACCESS VALUES WERE DEMONSTRATED?
						</h2>

						<div className="flex flex-col gap-5 relative z-10">
							{COMPANY_VALUES.map((v) => (
								<ValueCheckbox
									key={v.key}
									checked={watch(v.key)}
									onChange={() => toggleValue(v.key)}
									label={v.label}
									isLarge
								/>
							))}
						</div>
					</div>
				</div>
			</div>

			{/* Submit / Cancel */}
			<div className="w-full max-w-5xl flex flex-row-reverse gap-3">
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
	);
}
