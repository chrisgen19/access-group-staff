import type { Metadata } from "next";
import { Roboto, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/shared/providers";
import "./globals.css";

const roboto = Roboto({
	variable: "--font-sans",
	subsets: ["latin"],
	weight: ["300", "400", "500", "700"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
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
