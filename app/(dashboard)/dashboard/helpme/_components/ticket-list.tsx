import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { TICKET_CATEGORIES } from "@/lib/validations/helpme";

type TicketRow = {
	id: string;
	subject: string;
	category: "HR" | "IT_WEBSITE" | "FACILITIES" | "OTHER";
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

const CATEGORY_LABEL = Object.fromEntries(
	TICKET_CATEGORIES.map((c) => [c.value, c.label]),
) as Record<TicketRow["category"], string>;

function formatDate(date: Date) {
	return new Intl.DateTimeFormat("en-AU", {
		day: "2-digit",
		month: "short",
		year: "numeric",
	}).format(date);
}

export function TicketList({ tickets, isAdmin }: { tickets: TicketRow[]; isAdmin: boolean }) {
	if (tickets.length === 0) {
		return (
			<div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
				{isAdmin ? "No tickets have been raised yet." : "You haven’t raised any tickets yet."}
			</div>
		);
	}

	return (
		<div className="rounded-lg border">
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Subject</TableHead>
						<TableHead>Category</TableHead>
						<TableHead>Status</TableHead>
						{isAdmin && <TableHead>Raised by</TableHead>}
						<TableHead>Replies</TableHead>
						<TableHead>Created</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{tickets.map((t) => (
						<TableRow key={t.id} className="cursor-pointer hover:bg-muted/40">
							<TableCell className="font-medium">
								<Link href={`/dashboard/helpme/${t.id}`} className="hover:underline">
									{t.subject}
								</Link>
							</TableCell>
							<TableCell>{CATEGORY_LABEL[t.category]}</TableCell>
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
					))}
				</TableBody>
			</Table>
		</div>
	);
}
