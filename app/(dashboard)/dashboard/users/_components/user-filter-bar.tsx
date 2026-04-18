"use client";

import { Download, Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface DepartmentOption {
	id: string;
	name: string;
}

export const ROLE_OPTIONS = [
	{ value: "STAFF", label: "Staff" },
	{ value: "ADMIN", label: "Admin" },
	{ value: "SUPERADMIN", label: "Super Admin" },
] as const;

export const BRANCH_OPTIONS = [
	{ value: "ISO", label: "ISO" },
	{ value: "PERTH", label: "Perth" },
] as const;

interface UserFilterBarProps {
	search: string;
	onSearchChange: (value: string) => void;
	selectedRoles: string[];
	onSelectedRolesChange: (values: string[]) => void;
	showDeleted: boolean;
	onShowDeletedChange: (value: boolean) => void;
	selectedDepartmentId: string;
	onDepartmentChange: (value: string) => void;
	selectedBranch: string;
	onBranchChange: (value: string) => void;
	departments: DepartmentOption[];
	showRoleFilter: boolean;
	hasActiveFilters: boolean;
	onClear: () => void;
	onExport: () => void;
	isExporting: boolean;
}

export function UserFilterBar({
	search,
	onSearchChange,
	selectedRoles,
	onSelectedRolesChange,
	showDeleted,
	onShowDeletedChange,
	selectedDepartmentId,
	onDepartmentChange,
	selectedBranch,
	onBranchChange,
	departments,
	showRoleFilter,
	hasActiveFilters,
	onClear,
	onExport,
	isExporting,
}: UserFilterBarProps) {
	function toggle(list: string[], setter: (values: string[]) => void, value: string) {
		if (list.includes(value)) {
			setter(list.filter((v) => v !== value));
		} else {
			setter([...list, value]);
		}
	}

	return (
		<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card p-4 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
			<div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-center">
				<div className="relative min-w-0 lg:w-64">
					<Search
						size={16}
						className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
					/>
					<input
						type="text"
						placeholder="Search name, email, position..."
						value={search}
						onChange={(e) => onSearchChange(e.target.value)}
						className="h-9 w-full rounded-full border border-input bg-transparent pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
					/>
				</div>

				{showRoleFilter && (
					<div className="flex flex-wrap items-center gap-1.5">
						{ROLE_OPTIONS.map((role) => {
							const isActive = selectedRoles.includes(role.value);
							return (
								<button
									key={role.value}
									type="button"
									onClick={() => toggle(selectedRoles, onSelectedRolesChange, role.value)}
									className={cn(
										"inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
										isActive
											? "border-primary/20 bg-primary/5 text-primary dark:bg-primary/10"
											: "border-gray-200 dark:border-white/10 bg-transparent text-muted-foreground hover:border-gray-300 dark:hover:border-white/20",
									)}
								>
									{role.label}
								</button>
							);
						})}
					</div>
				)}

				<label className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground select-none cursor-pointer">
					<input
						type="checkbox"
						checked={showDeleted}
						onChange={(e) => onShowDeletedChange(e.target.checked)}
						className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary"
					/>
					Show deleted
				</label>

				<div className="flex items-center gap-2 lg:ml-auto">
					<select
						value={selectedDepartmentId}
						onChange={(e) => onDepartmentChange(e.target.value)}
						className={cn(
							"h-9 rounded-lg border border-input bg-transparent px-2.5 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
							!selectedDepartmentId && "text-muted-foreground",
						)}
					>
						<option value="">Department</option>
						{departments.map((dept) => (
							<option key={dept.id} value={dept.id}>
								{dept.name}
							</option>
						))}
					</select>
					<select
						value={selectedBranch}
						onChange={(e) => onBranchChange(e.target.value)}
						className={cn(
							"h-9 rounded-lg border border-input bg-transparent px-2.5 pr-8 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30",
							!selectedBranch && "text-muted-foreground",
						)}
					>
						<option value="">Branch</option>
						{BRANCH_OPTIONS.map((b) => (
							<option key={b.value} value={b.value}>
								{b.label}
							</option>
						))}
					</select>
				</div>

				<div className="flex items-center gap-1 shrink-0">
					<Button
						variant="ghost"
						size="sm"
						onClick={onClear}
						className={cn("gap-1 text-muted-foreground", !hasActiveFilters && "invisible")}
					>
						<X size={14} />
						Clear
					</Button>
					<Button
						variant="outline"
						size="sm"
						onClick={onExport}
						disabled={isExporting}
						className="gap-1"
					>
						{isExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
						{isExporting ? "Exporting..." : "Export"}
					</Button>
				</div>
			</div>
		</div>
	);
}
