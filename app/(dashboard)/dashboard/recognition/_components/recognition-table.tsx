"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	ChevronLeft,
	ChevronRight,
	Eye,
	Heart,
	Pencil,
	Search,
	Share2,
	Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { deleteRecognitionCardAction } from "@/lib/actions/recognition-actions";
import { useSession } from "@/lib/auth-client";
import { getUserRole, hasMinRole } from "@/lib/permissions";
import {
	type ExportRecognitionCard,
	formatRecognitionDate,
	generateRecognitionCsv,
	getSelectedValues,
	type RecognitionCard,
} from "@/lib/recognition";
import { RecognitionFilterBar } from "./recognition-filter-bar";
import { ShareDialog } from "./share-dialog";

const PAGE_SIZE = 20;

interface PaginatedResponse {
	success: boolean;
	data: RecognitionCard[];
	pagination: {
		page: number;
		pageSize: number;
		total: number;
		totalPages: number;
	};
}

function TableSkeleton() {
	return (
		<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden">
			<div className="animate-pulse">
				<div className="h-10 bg-muted/30 border-b" />
				{["r0", "r1", "r2", "r3", "r4"].map((key) => (
					<div key={key} className="flex items-center gap-4 px-4 py-3 border-b last:border-0">
						<div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
						<div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
						<div className="h-4 w-48 bg-gray-200 dark:bg-white/10 rounded flex-1" />
						<div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded" />
						<div className="h-4 w-20 bg-gray-200 dark:bg-white/10 rounded" />
					</div>
				))}
			</div>
		</div>
	);
}

export function RecognitionTable() {
	const router = useRouter();
	const queryClient = useQueryClient();
	const { data: session } = useSession();
	const userRole = getUserRole(session);
	const canDelete = hasMinRole(userRole, "ADMIN");
	const [page, setPage] = useState(1);
	const [search, setSearch] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [selectedValues, setSelectedValues] = useState<string[]>([]);
	const [selectedMonth, setSelectedMonth] = useState("");
	const [selectedYear, setSelectedYear] = useState("");
	const [isExporting, setIsExporting] = useState(false);
	const [shareCardId, setShareCardId] = useState<string | null>(null);
	const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => setDebouncedSearch(search), 300);
		return () => clearTimeout(timer);
	}, [search]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: filter values are triggers, not read inside effect
	useEffect(() => {
		setPage(1);
	}, [debouncedSearch, selectedValues, selectedMonth, selectedYear]);

	const hasActiveFilters =
		search.length > 0 ||
		selectedValues.length > 0 ||
		selectedMonth.length > 0 ||
		selectedYear.length > 0;

	function clearFilters() {
		setSearch("");
		setDebouncedSearch("");
		setSelectedValues([]);
		setSelectedMonth("");
		setSelectedYear("");
	}

	function getDateRange() {
		if (selectedMonth && selectedYear) {
			const year = Number(selectedYear);
			const month = Number(selectedMonth);
			const from = `${year}-${String(month).padStart(2, "0")}-01`;
			const lastDay = new Date(year, month, 0).getDate();
			const to = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
			return { dateFrom: from, dateTo: to };
		}

		if (selectedYear) {
			const year = Number(selectedYear);
			return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` };
		}

		return { dateFrom: "", dateTo: "" };
	}

	async function exportCards() {
		setIsExporting(true);
		try {
			const params = new URLSearchParams({ export: "true" });
			if (search) params.set("search", search);
			if (selectedValues.length > 0) params.set("values", selectedValues.join(","));
			const { dateFrom, dateTo } = getDateRange();
			if (dateFrom) params.set("dateFrom", dateFrom);
			if (dateTo) params.set("dateTo", dateTo);

			const res = await fetch(`/api/recognition?${params}`);
			if (!res.ok) throw new Error("Failed to fetch recognition cards");

			const json = (await res.json()) as { success: boolean; data: ExportRecognitionCard[] };
			if (!json.success) throw new Error("Export failed");

			const csv = generateRecognitionCsv(json.data);
			const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = `recognition-export-${new Date().toISOString().split("T")[0]}.csv`;
			link.click();
			URL.revokeObjectURL(url);
			toast.success(`Exported ${json.data.length} recognition cards`);
		} catch {
			toast.error("Failed to export recognition cards");
		} finally {
			setIsExporting(false);
		}
	}

	const { data, isPending, isError } = useQuery<PaginatedResponse>({
		queryKey: [
			"recognition-cards",
			"all",
			page,
			debouncedSearch,
			selectedValues,
			selectedMonth,
			selectedYear,
		],
		queryFn: async () => {
			const params = new URLSearchParams({
				paginated: "true",
				page: String(page),
				pageSize: String(PAGE_SIZE),
			});
			if (debouncedSearch) params.set("search", debouncedSearch);
			if (selectedValues.length > 0) params.set("values", selectedValues.join(","));
			const { dateFrom, dateTo } = getDateRange();
			if (dateFrom) params.set("dateFrom", dateFrom);
			if (dateTo) params.set("dateTo", dateTo);

			const res = await fetch(`/api/recognition?${params}`);
			if (!res.ok) throw new Error("Failed to fetch recognition cards");
			return res.json();
		},
		staleTime: 30_000,
	});

	const cards = data?.data ?? [];
	const pagination = data?.pagination;

	async function handleDelete() {
		if (!deleteCardId) return;
		setIsDeleting(true);
		try {
			const result = await deleteRecognitionCardAction(deleteCardId);
			if (result.success) {
				toast.success("Recognition card deleted");
				queryClient.invalidateQueries({ queryKey: ["recognition-cards"] });
			} else {
				toast.error(result.error);
			}
		} catch {
			toast.error("Failed to delete recognition card");
		} finally {
			setIsDeleting(false);
			setDeleteCardId(null);
		}
	}

	if (isPending) {
		return <TableSkeleton />;
	}

	if (isError) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-card p-16">
				<p className="text-[1.5rem] font-medium text-foreground">Something went wrong</p>
				<p className="mt-2 text-base text-muted-foreground">
					Failed to load recognition cards. Please try again later.
				</p>
			</div>
		);
	}

	if (cards.length === 0 && page === 1 && !hasActiveFilters) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-card p-16">
				<div className="mb-6 rounded-full bg-background p-6">
					<Heart size={48} className="text-muted-foreground opacity-40" />
				</div>
				<p className="text-[1.5rem] font-medium text-foreground">No recognition cards yet</p>
				<p className="mt-2 text-base text-muted-foreground">
					No one has sent a recognition card yet.
				</p>
			</div>
		);
	}

	return (
		<>
			<RecognitionFilterBar
				search={search}
				onSearchChange={setSearch}
				selectedValues={selectedValues}
				onSelectedValuesChange={setSelectedValues}
				selectedMonth={selectedMonth}
				onMonthChange={setSelectedMonth}
				selectedYear={selectedYear}
				onYearChange={setSelectedYear}
				hasActiveFilters={hasActiveFilters}
				onClear={clearFilters}
				onExport={exportCards}
				isExporting={isExporting}
			/>

			{cards.length === 0 && hasActiveFilters ? (
				<div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-card p-16">
					<div className="mb-6 rounded-full bg-background p-6">
						<Search size={48} className="text-muted-foreground opacity-40" />
					</div>
					<p className="text-[1.5rem] font-medium text-foreground">No matching cards</p>
					<p className="mt-2 text-base text-muted-foreground">
						No recognition cards match your current filters.
					</p>
					<button
						type="button"
						onClick={clearFilters}
						className="mt-4 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
					>
						Clear all filters
					</button>
				</div>
			) : (
				<>
					<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
						<Table>
							<TableHeader>
								<TableRow className="bg-muted/30 hover:bg-muted/30">
									<TableHead>From</TableHead>
									<TableHead>To</TableHead>
									<TableHead>Message</TableHead>
									<TableHead>Values</TableHead>
									<TableHead>Date</TableHead>
									<TableHead className="text-right">Actions</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{cards.map((card) => {
									const values = getSelectedValues(card);
									return (
										<TableRow key={card.id}>
											<TableCell>
												<div className="flex items-center gap-2">
													<UserAvatar
														firstName={card.sender.firstName}
														lastName={card.sender.lastName}
														avatar={card.sender.avatar}
														size="sm"
														className="bg-primary/10 text-primary"
													/>
													<div className="min-w-0">
														<p className="text-sm font-medium text-foreground truncate">
															{card.sender.firstName} {card.sender.lastName}
														</p>
														{card.sender.position && (
															<p className="text-xs text-muted-foreground truncate">
																{card.sender.position}
															</p>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell>
												<div className="flex items-center gap-2">
													<UserAvatar
														firstName={card.recipient.firstName}
														lastName={card.recipient.lastName}
														avatar={card.recipient.avatar}
														size="sm"
														className="bg-primary/10 text-primary"
													/>
													<div className="min-w-0">
														<p className="text-sm font-medium text-foreground truncate">
															{card.recipient.firstName} {card.recipient.lastName}
														</p>
														{card.recipient.position && (
															<p className="text-xs text-muted-foreground truncate">
																{card.recipient.position}
															</p>
														)}
													</div>
												</div>
											</TableCell>
											<TableCell className="max-w-xs">
												<p className="text-sm text-foreground/80 truncate">{card.message}</p>
											</TableCell>
											<TableCell>
												<div className="flex flex-wrap gap-1">
													{values.map((value) => (
														<span
															key={value}
															className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary/10"
														>
															{value}
														</span>
													))}
												</div>
											</TableCell>
											<TableCell>
												<span className="text-sm text-muted-foreground">
													{formatRecognitionDate(card.date)}
												</span>
											</TableCell>
											<TableCell className="text-right">
												<div className="flex justify-end gap-1">
													<button
														type="button"
														onClick={() => router.push(`/dashboard/recognition/${card.id}`)}
														className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors"
														aria-label="View card"
													>
														<Eye size={16} />
													</button>
													<button
														type="button"
														onClick={() => setShareCardId(card.id)}
														className="rounded-full p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
														aria-label="Share card"
													>
														<Share2 size={16} />
													</button>
													<button
														type="button"
														disabled={session?.user?.id !== card.sender.id}
														onClick={() => router.push(`/dashboard/recognition/${card.id}/edit`)}
														className="rounded-full p-2 text-muted-foreground hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-30 disabled:pointer-events-none"
														aria-label="Edit card"
													>
														<Pencil size={16} />
													</button>
													{canDelete && (
														<button
															type="button"
															onClick={() => setDeleteCardId(card.id)}
															className="rounded-full p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 transition-colors"
															aria-label="Delete card"
														>
															<Trash2 size={16} />
														</button>
													)}
												</div>
											</TableCell>
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</div>

					{pagination && pagination.totalPages > 1 && (
						<div className="flex items-center justify-between pt-2">
							<p className="text-sm text-muted-foreground">
								Showing {(pagination.page - 1) * pagination.pageSize + 1}–
								{Math.min(pagination.page * pagination.pageSize, pagination.total)} of{" "}
								{pagination.total} cards
							</p>
							<div className="flex items-center gap-2">
								<button
									type="button"
									disabled={page === 1}
									onClick={() => setPage((p) => p - 1)}
									className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
								>
									<ChevronLeft size={16} />
									Previous
								</button>
								<span className="text-sm font-medium text-foreground">
									{pagination.page} / {pagination.totalPages}
								</span>
								<button
									type="button"
									disabled={page >= pagination.totalPages}
									onClick={() => setPage((p) => p + 1)}
									className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors disabled:opacity-30 disabled:pointer-events-none"
								>
									Next
									<ChevronRight size={16} />
								</button>
							</div>
						</div>
					)}
				</>
			)}

			<AlertDialog open={!!deleteCardId} onOpenChange={(open) => !open && setDeleteCardId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete recognition card?</AlertDialogTitle>
						<AlertDialogDescription>
							This action cannot be undone. This will permanently delete the recognition card.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
						<AlertDialogAction onClick={handleDelete} disabled={isDeleting} variant="destructive">
							{isDeleting ? "Deleting..." : "Delete"}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			<ShareDialog
				open={!!shareCardId}
				cardId={shareCardId}
				onClose={() => setShareCardId(null)}
				redirectOnClose={false}
			/>
		</>
	);
}
