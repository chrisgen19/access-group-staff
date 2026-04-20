import { Inbox, Send } from "lucide-react";
import { redirect } from "next/navigation";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { AvatarUpload } from "./_components/avatar-upload";
import { ProfileForm } from "./_components/profile-form";

export default async function ProfilePage() {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const [user, lifetimeSent, lifetimeReceived] = await Promise.all([
		prisma.user.findUniqueOrThrow({
			where: { id: session.user.id },
			select: {
				firstName: true,
				lastName: true,
				displayName: true,
				phone: true,
				position: true,
				branch: true,
				avatar: true,
				image: true,
			},
		}),
		prisma.recognitionCard.count({ where: { senderId: session.user.id } }),
		prisma.recognitionCard.count({ where: { recipientId: session.user.id } }),
	]);

	return (
		<div className="space-y-6">
			<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card px-8 py-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
				<AvatarUpload
					firstName={user.firstName}
					lastName={user.lastName}
					currentAvatar={user.avatar}
					currentImage={user.image}
				/>
			</div>
			<ProfileForm user={user} />
			<div className="rounded-[2rem] border border-gray-200/60 dark:border-white/10 bg-card px-8 py-6 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.05)]">
				<h2 className="text-[1.25rem] font-medium text-foreground tracking-tight">
					Recognition history
				</h2>
				<p className="text-xs uppercase tracking-wide text-muted-foreground mt-1">All time</p>
				<div className="grid grid-cols-2 gap-4 mt-6">
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
							<Send size={18} className="text-primary" />
						</div>
						<div>
							<p className="text-2xl font-semibold text-foreground">{lifetimeSent}</p>
							<p className="text-xs text-muted-foreground">Cards Sent</p>
						</div>
					</div>
					<div className="flex items-center gap-3">
						<div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
							<Inbox size={18} className="text-primary" />
						</div>
						<div>
							<p className="text-2xl font-semibold text-foreground">{lifetimeReceived}</p>
							<p className="text-xs text-muted-foreground">Cards Received</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
