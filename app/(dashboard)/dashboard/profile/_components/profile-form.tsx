"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateProfileAction } from "@/lib/actions/profile-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProfileFormProps {
	user: {
		firstName: string;
		lastName: string;
		displayName: string | null;
		email: string;
		phone: string | null;
		position: string | null;
		role: string;
		department: { name: string } | null;
	};
}

export function ProfileForm({ user }: ProfileFormProps) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const { register, handleSubmit } = useForm({
		defaultValues: {
			firstName: user.firstName,
			lastName: user.lastName,
			displayName: user.displayName ?? "",
			phone: user.phone ?? "",
			position: user.position ?? "",
		},
	});

	async function onSubmit(data: Record<string, string>) {
		setIsLoading(true);
		try {
			const result = await updateProfileAction(data);
			if (result.success) {
				toast.success("Profile updated");
				router.refresh();
			} else {
				const errorMsg =
					typeof result.error === "string" ? result.error : "Update failed";
				toast.error(errorMsg);
			}
		} catch {
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<div className="space-y-6 max-w-2xl">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">My Profile</h2>
				<div className="flex items-center gap-2 mt-1">
					<p className="text-muted-foreground">{user.email}</p>
					<Badge variant="outline">{user.role}</Badge>
					{user.department && (
						<Badge variant="secondary">{user.department.name}</Badge>
					)}
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Edit Profile</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="firstName">First Name</Label>
								<Input id="firstName" {...register("firstName")} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="lastName">Last Name</Label>
								<Input id="lastName" {...register("lastName")} />
							</div>
						</div>

						<div className="space-y-2">
							<Label htmlFor="displayName">Display Name</Label>
							<Input id="displayName" {...register("displayName")} />
						</div>

						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="phone">Phone</Label>
								<Input id="phone" {...register("phone")} />
							</div>
							<div className="space-y-2">
								<Label htmlFor="position">Position</Label>
								<Input id="position" {...register("position")} />
							</div>
						</div>

						<Button type="submit" disabled={isLoading}>
							{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Save Changes
						</Button>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
