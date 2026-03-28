"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Search, ChevronDown, X, Check } from "lucide-react";
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

interface ActiveUser {
	id: string;
	firstName: string;
	lastName: string;
	position: string | null;
	department: { name: string } | null;
}

const COMPANY_VALUES = [
	{ key: "valuesPeople" as const, label: "People", wrap: false },
	{ key: "valuesSafety" as const, label: "Safety", wrap: false },
	{ key: "valuesRespect" as const, label: "Respect", wrap: false },
	{ key: "valuesCommunication" as const, label: "Communication", wrap: false },
	{
		key: "valuesContinuousImprovement" as const,
		label: "Continuous Improvement",
		wrap: true,
	},
];

const STEPS = [
	{ number: 1, label: "Fill Card" },
	{ number: 2, label: "Review & Submit" },
];

function ProgressBar({ currentStep }: { currentStep: 1 | 2 }) {
	return (
		<ol className="w-full max-w-5xl flex items-center gap-0" aria-label="Form steps">
			{STEPS.map((s, i) => {
				const isCompleted = s.number < currentStep;
				const isActive = s.number === currentStep;
				return (
					<li
						key={s.number}
						className="flex items-center flex-1 last:flex-none"
						aria-current={isActive ? "step" : undefined}
					>
						<div className="flex items-center gap-2">
							<div
								className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors duration-300 ${
									isCompleted || isActive
										? "bg-[#e31837] text-white"
										: "bg-[#e5e7eb] text-[#999]"
								}`}
							>
								{isCompleted ? <Check size={16} strokeWidth={3} /> : s.number}
							</div>
							<span
								className={`text-sm font-medium whitespace-nowrap ${
									isActive || isCompleted ? "text-[#222]" : "text-[#999]"
								}`}
							>
								{s.label}
							</span>
						</div>
						{i < STEPS.length - 1 && (
							<div className="flex-1 mx-4">
								<div className="h-0.5 bg-[#e5e7eb] relative">
									<div
										className={`absolute inset-y-0 left-0 bg-[#e31837] transition-all duration-500 ${
											isCompleted ? "w-full" : "w-0"
										}`}
									/>
								</div>
							</div>
						)}
					</li>
				);
			})}
		</ol>
	);
}

function ValueCheckbox({
	checked,
	onChange,
	label,
	isLarge,
	wrap,
}: {
	checked: boolean;
	onChange: () => void;
	label: string;
	isLarge?: boolean;
	wrap?: boolean;
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
					className={`transition-colors duration-200 flex-shrink-0 flex items-center justify-center ${
						isLarge ? "w-8 h-8" : "w-3.5 h-3.5 md:w-4 md:h-4"
					} ${checked ? "bg-[#333]" : "bg-[#e5e7eb] group-hover:bg-[#d1d5db]"}`}
				>
					{checked && (
						<Check
							size={isLarge ? 18 : 10}
							strokeWidth={3}
							className="text-white"
						/>
					)}
				</div>
			</div>
			<span
				className={`font-black text-[#222] uppercase ${
					isLarge
						? "text-2xl tracking-tight"
						: "text-[8.5px] md:text-[10px]"
				} ${wrap && !isLarge ? "leading-[1.1]" : ""}`}
			>
				{!isLarge && wrap ? (
					<>
						{label.split(" ").slice(0, -1).join(" ")}
						<br />
						{label.split(" ").at(-1)}
					</>
				) : (
					label
				)}
			</span>
		</label>
	);
}

function RecipientCombobox({
	selectedUser,
	searchQuery,
	setSearchQuery,
	isDropdownOpen,
	setIsDropdownOpen,
	filteredUsers,
	handleSelectUser,
	handleClearSelection,
	inputRef,
	dropdownRef,
	error,
}: {
	selectedUser: ActiveUser | null;
	searchQuery: string;
	setSearchQuery: (q: string) => void;
	isDropdownOpen: boolean;
	setIsDropdownOpen: (open: boolean) => void;
	filteredUsers: ActiveUser[];
	handleSelectUser: (user: ActiveUser) => void;
	handleClearSelection: () => void;
	inputRef: React.RefObject<HTMLInputElement | null>;
	dropdownRef: React.RefObject<HTMLDivElement | null>;
	error?: string;
}) {
	return (
		<div className="relative flex-1" ref={dropdownRef} role="combobox" aria-expanded={isDropdownOpen && !selectedUser} aria-haspopup="listbox">
			{selectedUser ? (
				<div className="flex items-center justify-between h-full">
					<span className="text-lg text-[#222]">
						{selectedUser.firstName} {selectedUser.lastName}
					</span>
					<button
						type="button"
						onClick={handleClearSelection}
						aria-label="Clear recipient selection"
						className="text-gray-400 hover:text-[#222] transition-colors"
					>
						<X size={16} aria-hidden="true" />
					</button>
				</div>
			) : (
				<>
					<div className="relative h-full flex items-center">
						<Search size={14} className="absolute left-0 text-gray-400" />
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
							className="w-full pl-5 outline-none text-lg bg-transparent placeholder:text-gray-400"
							spellCheck="false"
						/>
						<ChevronDown
							size={14}
							className="absolute right-0 text-gray-400 pointer-events-none"
						/>
					</div>
					{isDropdownOpen && (
						<div role="listbox" className="absolute top-full left-0 right-0 z-50 mt-2 max-h-60 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-sm">
							{filteredUsers.length === 0 ? (
								<div className="px-4 py-3 text-sm text-gray-400">
									No users found
								</div>
							) : (
								filteredUsers.map((user) => (
									<button
										key={user.id}
										type="button"
										onMouseDown={(e) => e.preventDefault()}
										onClick={() => handleSelectUser(user)}
										className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors"
									>
										<div>
											<span className="font-medium text-[#222]">
												{user.firstName} {user.lastName}
											</span>
											{user.department && (
												<span className="ml-2 text-gray-400">
													{user.department.name}
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
			{error && (
				<p className="absolute -bottom-5 left-0 text-xs text-red-600">
					{error}
				</p>
			)}
		</div>
	);
}

export function RecognitionForm() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: session } = useSession();
	const [step, setStep] = useState<1 | 2>(1);
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
		trigger,
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

	async function handleReview() {
		const isValid = await trigger();
		if (isValid) {
			setStep(2);
			window.scrollTo({ top: 0, behavior: "smooth" });
		}
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

	const comboboxProps = {
		selectedUser,
		searchQuery,
		setSearchQuery,
		isDropdownOpen,
		setIsDropdownOpen,
		filteredUsers,
		handleSelectUser,
		handleClearSelection,
		inputRef,
		dropdownRef,
	};

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col items-center gap-8"
		>
			{/* Progress Bar */}
			<ProgressBar currentStep={step} />

			{/* ============================================ */}
			{/* STEP 1 — Card 2 (Back / Fill Card)          */}
			{/* ============================================ */}
			{step === 1 && (
				<>
					<div className="w-full max-w-5xl bg-[#e6e7e8] p-4 md:p-8 relative shadow-2xl flex flex-col md:flex-row gap-4 md:gap-6">
						{/* Crop Marks */}
						<div className="absolute top-2 left-2 w-4 h-4 border-t border-l border-gray-400" aria-hidden="true" />
						<div className="absolute top-2 right-2 w-4 h-4 border-t border-r border-gray-400" aria-hidden="true" />
						<div className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-gray-400" aria-hidden="true" />
						<div className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-gray-400" aria-hidden="true" />

						{/* Left Column */}
						<div className="flex-1 flex flex-col gap-4">
							{/* TO */}
							<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col h-20 shadow-sm relative">
								<span className="text-xs font-black text-black mb-1">TO</span>
								<RecipientCombobox
									{...comboboxProps}
									error={errors.recipientId?.message}
								/>
							</div>

							{/* WHAT YOU DID */}
							<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col flex-grow min-h-[300px] shadow-sm relative">
								<span className="text-xs font-black text-black mb-2">
									WHAT YOU DID
								</span>
								<textarea
									{...register("message")}
									className="w-full flex-grow outline-none resize-none text-base bg-transparent mb-16 text-[#222] placeholder:text-gray-400"
									placeholder="Describe what this team member did..."
									spellCheck="false"
								/>

								{/* Small Value Checkboxes + Errors */}
								<div className="absolute bottom-4 left-4 right-4">
									{(errors.message || errors.valuesPeople) && (
										<div className="mb-2 space-y-1">
											{errors.message && (
												<p className="text-xs text-red-600">
													{errors.message.message}
												</p>
											)}
											{errors.valuesPeople && (
												<p className="text-xs text-red-600">
													{errors.valuesPeople.message}
												</p>
											)}
										</div>
									)}
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
												wrap={v.wrap}
											/>
										))}
									</div>
								</div>
							</div>

							{/* FROM + DATE */}
							<div className="flex gap-4">
								<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col flex-1 h-20 shadow-sm">
									<span className="text-xs font-black text-black mb-1">FROM</span>
									<span className="text-lg text-[#222]">{senderName}</span>
								</div>
								<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col flex-1 h-20 shadow-sm">
									<span className="text-xs font-black text-black mb-1">DATE</span>
									<input
										type="date"
										{...register("date")}
										className="w-full outline-none text-lg bg-transparent text-[#222]"
									/>
									{errors.date && (
										<p className="text-xs text-red-600">{errors.date.message}</p>
									)}
								</div>
							</div>
						</div>

						{/* Right Column */}
						<div className="flex-1 flex flex-col gap-4">
							<div className="h-24 flex items-center justify-between px-2">
								<AccessGroupLogo color="#e31837" />
								<AccessBusinessLogo color="#e31837" />
							</div>

							<div className="bg-white p-6 md:p-8 rounded-sm flex flex-col flex-grow shadow-sm relative overflow-hidden">
								<div className="absolute left-[20%] top-[10%] w-[80%] h-[90%] pointer-events-none text-black opacity-[0.05]" aria-hidden="true">
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
											wrap={v.wrap}
											isLarge
										/>
									))}
								</div>
							</div>
						</div>
					</div>

					{/* Step 1 Buttons */}
					<div className="w-full max-w-5xl flex flex-row-reverse gap-3">
						<button
							type="button"
							onClick={handleReview}
							className="inline-flex justify-center rounded-full bg-[#e31837] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#c41430] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#e31837]/30 transition-all duration-200"
						>
							Review Before Submit
						</button>
						<button
							type="button"
							onClick={() => router.push("/dashboard/recognition")}
							className="inline-flex justify-center rounded-full border border-gray-200 dark:border-white/10 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-white/10 transition-all duration-200"
						>
							Cancel
						</button>
					</div>
				</>
			)}

			{/* ============================================ */}
			{/* STEP 2 — Card 1 (Front / Review & Submit)   */}
			{/* ============================================ */}
			{step === 2 && (
				<>
					<div className="w-full max-w-5xl bg-[#e6e7e8] relative shadow-2xl flex flex-col overflow-hidden">
						{/* Red Header */}
						<div className="bg-[#e31837] h-28 flex items-center justify-between px-6 md:px-12 z-10">
							<AccessGroupLogo color="#ffffff" />
							<AccessBusinessLogo color="#ffffff" />
						</div>

						{/* Content Area */}
						<div className="flex flex-col md:flex-row p-6 md:p-8 gap-8 relative">
							{/* Left Column (Editable Fields) */}
							<div className="flex-1 flex flex-col gap-3 z-10">
								<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm relative">
									<span className="text-xs font-black text-black mb-1">
										TEAM MEMBER NAME
									</span>
									<RecipientCombobox
										{...comboboxProps}
										error={errors.recipientId?.message}
									/>
								</div>

								<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm min-h-[160px] flex-grow">
									<span className="text-xs font-black text-black mb-1">
										WHAT TEAM MEMBER DID
									</span>
									<textarea
										{...register("message")}
										className="w-full flex-grow outline-none resize-none text-base bg-transparent text-[#222] placeholder:text-gray-400"
										spellCheck="false"
									/>
									{errors.message && (
										<p className="text-xs text-red-600 mt-1">
											{errors.message.message}
										</p>
									)}
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
									<input
										type="date"
										{...register("date")}
										className="w-full outline-none text-lg bg-transparent text-[#222]"
									/>
									{errors.date && (
										<p className="text-xs text-red-600 mt-1">
											{errors.date.message}
										</p>
									)}
								</div>
							</div>

							{/* Right Column (Text) */}
							<div className="flex-1 flex flex-col justify-center pl-4 md:pl-8 z-10 min-w-0">
								<h1
									className={`font-sanstext-[#e31837] text-xl sm:text-2xl md:text-3xl lg:text-[2rem] uppercase leading-none mb-4 md:mb-6 tracking-tight whitespace-nowrap`}
								>
									Thank you for your
									<br />
									contribution
								</h1>
								<h2
									className={`font-sanstext-[#222] text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] uppercase leading-[0.95] tracking-tighter whitespace-nowrap`}
								>
									Access is proud
									<br />
									because of team
									<br />
									members like you.
								</h2>
							</div>

							{/* Background Watermark */}
							<div className="absolute left-[45%] top-[10%] w-[60%] h-[90%] pointer-events-none text-white opacity-60" aria-hidden="true">
								<BackgroundGraphic
									preserveAspectRatio="xMinYMin meet"
									className="w-full h-full scale-[1.7] md:scale-[2] origin-top-left"
								/>
							</div>
						</div>
					</div>

					{/* Step 2 Buttons */}
					<div className="w-full max-w-5xl flex flex-row-reverse gap-3">
						<button
							type="submit"
							disabled={isLoading}
							className="inline-flex justify-center rounded-full bg-[#e31837] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#c41430] hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#e31837]/30 transition-all duration-200 disabled:opacity-50"
						>
							{isLoading && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Send Recognition
						</button>
						<button
							type="button"
							onClick={() => {
								setStep(1);
								window.scrollTo({ top: 0, behavior: "smooth" });
							}}
							className="inline-flex justify-center rounded-full border border-gray-200 dark:border-white/10 bg-card px-6 py-2.5 text-sm font-medium text-foreground hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-4 focus:ring-gray-200 dark:focus:ring-white/10 transition-all duration-200"
						>
							Back
						</button>
					</div>
				</>
			)}
		</form>
	);
}
