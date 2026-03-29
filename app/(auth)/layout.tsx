import { ForceLight } from "./_components/force-light";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
			<ForceLight />
			{children}
		</div>
	);
}
