import { requireRole } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default async function SuperAdminPage() {
	try {
		await requireRole("SUPERADMIN");
	} catch {
		redirect("/dashboard");
	}

	return (
		<div className="max-w-7xl mx-auto space-y-8 mt-2">
			<div>
				<h1 className="text-[2.25rem] leading-tight font-medium text-foreground tracking-tight">
					Super Admin
				</h1>
				<p className="mt-2 text-base text-muted-foreground">
					System-level administration and advanced controls.
				</p>
			</div>
			<div className="flex flex-col items-center justify-center rounded-[2rem] border border-gray-200 dark:border-white/10 bg-card p-16 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
				<div className="mb-6 rounded-full bg-background p-6">
					<ShieldCheck
						size={48}
						className="text-muted-foreground opacity-40"
					/>
				</div>
				<p className="text-[1.5rem] font-medium text-foreground">
					Super admin panel coming soon
				</p>
				<p className="mt-2 text-base text-muted-foreground">
					System administration and advanced controls will appear
					here.
				</p>
			</div>
		</div>
	);
}
