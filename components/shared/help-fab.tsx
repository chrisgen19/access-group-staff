"use client";

import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSession } from "@/lib/auth-client";

const TARGET_HREF = "/dashboard/helpme/new";

export function HelpFab() {
	const pathname = usePathname();
	const { data: session, isPending } = useSession();

	if (!pathname.startsWith("/dashboard")) return null;
	if (pathname.startsWith("/dashboard/helpme")) return null;

	const href =
		isPending || session?.user
			? TARGET_HREF
			: `/login?callbackUrl=${encodeURIComponent(TARGET_HREF)}`;

	return (
		<Tooltip>
			<TooltipTrigger
				render={
					<Link
						href={href}
						aria-label="Open help ticket"
						className="fixed bottom-6 right-6 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-200 hover:bg-primary/90 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
					>
						<HelpCircle className="h-6 w-6" />
					</Link>
				}
			/>
			<TooltipContent side="left">Need help? Raise a ticket</TooltipContent>
		</Tooltip>
	);
}
