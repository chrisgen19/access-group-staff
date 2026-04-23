import { notFound, redirect } from "next/navigation";
import { DashboardPageHeader } from "@/components/shared/dashboard-page-header";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { RecognitionForm } from "../../_components/recognition-form";

export default async function EditRecognitionPage({ params }: { params: Promise<{ id: string }> }) {
	const session = await getServerSession();
	if (!session) redirect("/login");

	const { id } = await params;
	const card = await prisma.recognitionCard.findUnique({
		where: { id },
		include: {
			recipient: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					position: true,
					department: { select: { name: true } },
				},
			},
		},
	});

	if (!card || card.senderId !== session.user.id) notFound();

	const dateStr = card.date.toISOString().split("T")[0];

	return (
		<div className="mx-auto max-w-7xl space-y-6">
			<DashboardPageHeader
				eyebrow="Recognition"
				title="Edit Recognition Card"
				description={`Update the card for ${card.recipient.firstName} ${card.recipient.lastName} before sending it again.`}
			/>
			<div className="mx-auto max-w-5xl py-2">
				<RecognitionForm
					mode="edit"
					cardId={id}
					defaultValues={{
						recipientId: card.recipientId,
						message: card.message,
						date: dateStr,
						valuesPeople: card.valuesPeople,
						valuesSafety: card.valuesSafety,
						valuesRespect: card.valuesRespect,
						valuesCommunication: card.valuesCommunication,
						valuesContinuousImprovement: card.valuesContinuousImprovement,
					}}
					defaultRecipient={{
						id: card.recipient.id,
						firstName: card.recipient.firstName,
						lastName: card.recipient.lastName,
						position: card.recipient.position,
						department: card.recipient.department,
					}}
				/>
			</div>
		</div>
	);
}
