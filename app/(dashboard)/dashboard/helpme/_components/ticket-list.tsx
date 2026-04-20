"use client";

import { LifeBuoy } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

type TicketRow = {
	id: string;
	subject: string;
	category: "HR" | "IT_WEBSITE" | "PAYROLL" | "FACILITIES" | "OTHER";
	status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";
	createdAt: Date;
	updatedAt: Date;
	createdBy: {
		id: string;
		firstName: string;
		lastName: string;
		avatar: string | null;
	};
	_count: { replies: number };
};

const STATUS_STYLES: Record<TicketRow["status"], string> = {
	OPEN: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
	IN_PROGRESS: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
	RESOLVED: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
	CLOSED: "bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

const STATUS_LABEL: Record<TicketRow["status"], string> = {
	OPEN: "Open",
	IN_PROGRESS: "In Progress",
	RESOLVED: "Resolved",
	CLOSED: "Closed",
};

const CATEGORY_LABEL: Record<TicketRow["category"], string> = {
	HR: "HR",
	IT_WEBSITE: "IT / Website",
	PAYROLL: "Payroll",
	FACILITIES: "Facilities",
	OTHER: "Other",
};

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en-AU", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}

export function TicketList({ tickets, isAdmin }: { tickets: TicketRow[]; isAdmin: boolean }) {
	const router = useRouter();

	if (tickets.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center rounded-xl border border-gray-200 dark:border-white/10 bg-card p-16">
				<div className="mb-6 rounded-full bg-background p-6">
					<LifeBuoy size={48} className="text-muted-foreground opacity-40" />
				</div>
				<p className="text-[1.5rem] font-medium text-foreground">
					{isAdmin ? "No tickets yet" : "No tickets raised yet"}
				</p>
				<p className="mt-2 text-base text-muted-foreground">
					{isAdmin
						? "Tickets raised by staff will appear here."
						: "Need a hand? Raise a ticket and the right team will follow up."}
				</p>
			</div>
		);
	}

	return (
		<div className="rounded-xl border border-gray-200/60 dark:border-white/10 bg-card overflow-hidden shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
			<Table>
				<TableHeader>
					<TableRow className="bg-muted/30 hover:bg-muted/30">
						<TableHead>Subject</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Status</TableHead>
						{isAdmin && <TableHead>Raised by</TableHead>}
						<TableHead>Replies</TableHead>
						<TableHead>Created</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{tickets.map((t) => {
						const href = `/dashboard/helpme/${t.id}`;
						return (
							<TableRow
								key={t.id}
								onClick={() => router.push(href)}
								onMouseEnter={() => router.prefetch(href)}
								className="cursor-pointer hover:bg-muted/40"
							>
								<TableCell className="font-medium">
									<Link
										href={href}
										onClick={(e) => e.stopPropagation()}
										className="hover:underline focus-visible:underline focus-visible:outline-none"
									>
										{t.subject}
									</Link>
								</TableCell>
								<TableCell>
									<span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-2 py-0.5 text-xs font-medium text-primary dark:bg-primary/10">
										{CATEGORY_LABEL[t.category]}
									</span>
								</TableCell>
								<TableCell>
									<Badge variant="secondary" className={STATUS_STYLES[t.status]}>
										{STATUS_LABEL[t.status]}
									</Badge>
								</TableCell>
								{isAdmin && (
									<TableCell>
										{t.createdBy.firstName} {t.createdBy.lastName}
									</TableCell>
								)}
								<TableCell>{t._count.replies}</TableCell>
								<TableCell className="text-muted-foreground">{formatDate(t.createdAt)}</TableCell>
							</TableRow>
						);
					})}
				</TableBody>
			</Table>
		</div>
	);
}
