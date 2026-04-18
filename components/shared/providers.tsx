"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { type ReactNode, useState } from "react";
import { Toaster } from "sonner";
import { BgProvider } from "@/components/shared/bg-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

export function Providers({ children }: { children: ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60 * 1000,
					},
				},
			}),
	);

	return (
		<ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
			<QueryClientProvider client={queryClient}>
				<TooltipProvider>
					<BgProvider />
					{children}
					<Toaster richColors position="top-right" />
				</TooltipProvider>
			</QueryClientProvider>
		</ThemeProvider>
	);
}
