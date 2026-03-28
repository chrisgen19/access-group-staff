import { Settings } from "lucide-react";

export default function PreferencesPage() {
	return (
		<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden">
			<div className="px-8 pt-8 pb-2">
				<h3 className="text-[1.5rem] leading-tight font-medium text-foreground tracking-tight">
					Preferences
				</h3>
			</div>
			<div className="flex flex-col items-center justify-center px-8 py-16">
				<div className="mb-4 rounded-full bg-background p-4">
					<Settings size={32} className="text-muted-foreground opacity-40" />
				</div>
				<p className="text-base font-medium text-foreground">Coming soon</p>
				<p className="mt-1 text-sm text-muted-foreground">
					Notification settings, theme preferences, and more.
				</p>
			</div>
		</div>
	);
}
