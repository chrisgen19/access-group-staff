import type { Metadata } from "next";
import { Geist_Mono, Roboto } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import { env } from "@/env";
import "./globals.css";

const roboto = Roboto({
	variable: "--font-sans",
	subsets: ["latin"],
	weight: ["300", "400", "500", "700", "900"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
	title: "Access Recognition",
	description: "Internal employee recognition for Access Group",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
			className={`${roboto.variable} ${geistMono.variable} h-full antialiased`}
		>
			<body className="min-h-full font-sans">
				<Providers>{children}</Providers>
			</body>
		</html>
	);
}
