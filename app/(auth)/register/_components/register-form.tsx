"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { registerSchema, type RegisterInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export function RegisterForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<RegisterInput>({
		resolver: zodResolver(registerSchema),
	});

	async function onSubmit(data: RegisterInput) {
		setIsLoading(true);
		try {
			const result = await signUp.email({
				email: data.email,
				password: data.password,
				name: `${data.firstName} ${data.lastName}`,
				firstName: data.firstName,
				lastName: data.lastName,
			});

			if (result.error) {
				toast.error(result.error.message ?? "Registration failed");
				return;
			}

			toast.success("Account created successfully!");
			router.push("/dashboard");
			router.refresh();
		} catch {
			toast.error("Something went wrong. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Card className="w-full max-w-md">
			<CardHeader className="text-center">
				<CardTitle className="text-2xl font-bold">Create Account</CardTitle>
				<CardDescription>Join Access Recognition</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="firstName">First Name</Label>
							<Input id="firstName" placeholder="John" {...register("firstName")} />
							{errors.firstName && (
								<p className="text-sm text-destructive">{errors.firstName.message}</p>
							)}
						</div>
						<div className="space-y-2">
							<Label htmlFor="lastName">Last Name</Label>
							<Input id="lastName" placeholder="Doe" {...register("lastName")} />
							{errors.lastName && (
								<p className="text-sm text-destructive">{errors.lastName.message}</p>
							)}
						</div>
					</div>

					<div className="space-y-2">
						<Label htmlFor="email">Email</Label>
						<Input
							id="email"
							type="email"
							placeholder="name@accessgroup.com.au"
							{...register("email")}
						/>
						{errors.email && (
							<p className="text-sm text-destructive">{errors.email.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="password">Password</Label>
						<Input id="password" type="password" {...register("password")} />
						{errors.password && (
							<p className="text-sm text-destructive">{errors.password.message}</p>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="confirmPassword">Confirm Password</Label>
						<Input id="confirmPassword" type="password" {...register("confirmPassword")} />
						{errors.confirmPassword && (
							<p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
						)}
					</div>

					<Button type="submit" className="w-full" disabled={isLoading}>
						{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
						Create Account
					</Button>
				</form>
			</CardContent>
			<CardFooter className="justify-center">
				<p className="text-sm text-muted-foreground">
					Already have an account?{" "}
					<Link href="/login" className="text-primary hover:underline font-medium">
						Sign in
					</Link>
				</p>
			</CardFooter>
		</Card>
	);
}
