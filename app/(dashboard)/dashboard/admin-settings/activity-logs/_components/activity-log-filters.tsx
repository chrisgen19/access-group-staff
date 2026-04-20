"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ActivityAction } from "@/app/generated/prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

const ACTION_LABELS: Record<ActivityAction, string> = {
	USER_SIGNED_IN: "Signed in",
	USER_SIGNED_OUT: "Signed out",
	SIGN_IN_FAILED: "Sign-in failed",
	OAUTH_ACCOUNT_LINKED: "OAuth linked",
	PASSWORD_CHANGED: "Password changed",
	PASSWORD_RESET: "Password reset",
};

interface ActivityLogFiltersProps {
	users: Array<{ id: string; firstName: string; lastName: string; email: string }>;
	actions: ActivityAction[];
	initial: {
		actor: string;
		action: string;
		from: string;
		to: string;
		target: string;
	};
}

const ALL = "__all__";

export function ActivityLogFilters({ users, actions, initial }: ActivityLogFiltersProps) {
	const router = useRouter();
	const [actor, setActor] = useState(initial.actor || ALL);
	const [action, setAction] = useState(initial.action || ALL);
	const [from, setFrom] = useState(initial.from);
	const [to, setTo] = useState(initial.to);
	const [target, setTarget] = useState(initial.target);

	function apply() {
		const sp = new URLSearchParams();
		if (actor && actor !== ALL) sp.set("actor", actor);
		if (action && action !== ALL) sp.set("action", action);
		if (from) sp.set("from", from);
		if (to) sp.set("to", to);
		if (target.trim()) sp.set("target", target.trim());
		const qs = sp.toString();
		router.push(qs ? `?${qs}` : "?");
	}

	function reset() {
		setActor(ALL);
		setAction(ALL);
		setFrom("");
		setTo("");
		setTarget("");
		router.push("?");
	}

	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] p-6 space-y-4">
			<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
				<div className="space-y-1.5">
					<Label>Actor</Label>
					<Select
						value={actor}
						onValueChange={(val) => {
							if (val !== null) setActor(val);
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="All actors" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>All actors</SelectItem>
							{users.map((u) => (
								<SelectItem key={u.id} value={u.id}>
									{u.firstName} {u.lastName}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<Label>Action</Label>
					<Select
						value={action}
						onValueChange={(val) => {
							if (val !== null) setAction(val);
						}}
					>
						<SelectTrigger>
							<SelectValue placeholder="All actions" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value={ALL}>All actions</SelectItem>
							{actions.map((a) => (
								<SelectItem key={a} value={a}>
									{ACTION_LABELS[a]}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
				</div>

				<div className="space-y-1.5">
					<Label>From</Label>
					<Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
				</div>

				<div className="space-y-1.5">
					<Label>To</Label>
					<Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
				</div>

				<div className="space-y-1.5">
					<Label>Target</Label>
					<Input
						placeholder="e.g. google"
						value={target}
						onChange={(e) => setTarget(e.target.value)}
					/>
				</div>
			</div>

			<div className="flex justify-end gap-2">
				<Button variant="outline" onClick={reset}>
					Reset
				</Button>
				<Button onClick={apply}>Apply filters</Button>
			</div>
		</div>
	);
}
