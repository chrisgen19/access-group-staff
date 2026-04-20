import { Check } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { CardInteractionBar } from "@/app/(dashboard)/dashboard/recognition/_components/card-interaction-bar";
import type { Role } from "@/app/generated/prisma/client";
import {
	AccessBusinessLogo,
	AccessGroupLogo,
	BackgroundGraphic,
} from "@/components/shared/access-logos";
import { FitText } from "@/components/shared/fit-text";
import { getServerSession } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import { getCardReactionSummary } from "@/lib/interactions";
import { hasMinRole } from "@/lib/permissions";
import { COMPANY_VALUES, formatRecognitionDate } from "@/lib/recognition";
import { cn } from "@/lib/utils";
import { FlipCard } from "./flip-card";
import { InteractionBarReadonly } from "./interaction-bar-readonly";

const getCard = cache(async function getCard(id: string) {
	const card = await prisma.recognitionCard.findUnique({
		where: { id },
		include: {
			sender: {
				select: {
					id: true,
					firstName: true,
					lastName: true,
					position: true,
					department: { select: { name: true } },
				},
			},
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
	return card;
});

export async function generateMetadata({
	params,
}: {
	params: Promise<{ id: string }>;
}): Promise<Metadata> {
	const { id } = await params;
	const card = await getCard(id);

	if (!card) {
		return { title: "Card Not Found" };
	}

	const recipientName = `${card.recipient.firstName} ${card.recipient.lastName}`;
	const senderName = `${card.sender.firstName} ${card.sender.lastName}`;
	const title = `Recognition for ${recipientName}`;
	const description = `${senderName} recognized ${recipientName}: ${card.message.slice(0, 120)}${card.message.length > 120 ? "..." : ""}`;

	return {
		title,
		description,
		openGraph: {
			title,
			description,
			type: "article",
			images: [
				{
					url: `/recognition/${id}/opengraph-image`,
					width: 1200,
					height: 630,
					alt: title,
				},
			],
		},
		twitter: {
			card: "summary_large_image",
			title,
			description,
		},
	};
}

function ValueIndicator({
	checked,
	label,
	isLarge,
}: {
	checked: boolean;
	label: string;
	isLarge?: boolean;
}) {
	return (
		<div className="flex items-center gap-1.5">
			<div
				role="img"
				aria-label={`${label}: ${checked ? "demonstrated" : "not demonstrated"}`}
				className={cn(
					"flex-shrink-0 flex items-center justify-center",
					isLarge ? "w-6 h-6" : "w-3 h-3",
					checked ? "bg-[#333]" : "bg-[#e5e7eb]",
				)}
			>
				{checked && <Check size={isLarge ? 14 : 7} strokeWidth={3} className="text-white" />}
			</div>
			<span
				className={cn(
					"font-black text-[#222] uppercase tracking-tight",
					isLarge ? "text-lg" : "text-[8px]",
				)}
			>
				{label}
			</span>
		</div>
	);
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;
	const [card, session] = await Promise.all([getCard(id), getServerSession()]);

	if (!card) notFound();

	const userId = session?.user.id;
	const isAdmin = session ? hasMinRole(session.user.role as Role, "ADMIN") : false;
	const canInteract = Boolean(session);

	const { publicReactions, initialReactions, commentCount } = await getCardReactionSummary(
		id,
		userId,
	);

	const recipientName = `${card.recipient.firstName} ${card.recipient.lastName}`;
	const senderName = `${card.sender.firstName} ${card.sender.lastName}`;
	const department = card.recipient.department?.name ?? "";

	const card1Front = (
		<div className="w-full bg-[#e6e7e8] relative shadow-2xl flex flex-col overflow-hidden">
			<div className="bg-[#e31837] h-28 flex items-center justify-between px-6 md:px-12 z-10">
				<AccessGroupLogo color="#ffffff" />
				<AccessBusinessLogo color="#ffffff" />
			</div>

			<div className="flex flex-col md:flex-row p-6 md:p-8 gap-8 relative">
				<div className="flex-1 flex flex-col gap-3 z-10">
					<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm">
						<span className="text-xs font-black text-black mb-1">TEAM MEMBER NAME</span>
						<FitText className="text-lg text-[#222]">{recipientName}</FitText>
					</div>

					<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm min-h-[160px] flex-grow">
						<span className="text-xs font-black text-black mb-1">WHAT TEAM MEMBER DID</span>
						<p className="text-base text-[#222] whitespace-pre-wrap">{card.message}</p>
					</div>

					<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm">
						<span className="text-xs font-black text-black mb-1">DEPARTMENT/LOCATION</span>
						<span className="text-lg text-[#222]">{department}</span>
					</div>

					<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm">
						<span className="text-xs font-black text-black mb-1">MY NAME</span>
						<FitText className="text-lg text-[#222]">{senderName}</FitText>
					</div>

					<div className="bg-white p-3 rounded-sm flex flex-col shadow-sm">
						<span className="text-xs font-black text-black mb-1">DATE</span>
						<span className="text-lg text-[#222]">
							{formatRecognitionDate(card.date.toISOString())}
						</span>
					</div>
				</div>

				<div className="flex-1 flex flex-col justify-center pl-4 md:pl-8 z-10 min-w-0">
					<h1 className="font-sans text-[#e31837] text-xl sm:text-2xl md:text-3xl lg:text-[2rem] uppercase leading-none mb-4 md:mb-6 tracking-tight whitespace-nowrap font-black">
						Thank you for your
						<br />
						contribution
					</h1>
					<h2 className="font-sans text-[#222] text-2xl sm:text-3xl md:text-4xl lg:text-[2.75rem] uppercase leading-[0.95] tracking-tighter whitespace-nowrap font-black">
						Access is proud
						<br />
						because of team
						<br />
						members like you.
					</h2>
				</div>

				<div
					className="absolute left-[45%] top-[10%] w-[60%] h-[90%] pointer-events-none text-white opacity-60"
					aria-hidden="true"
				>
					<BackgroundGraphic
						preserveAspectRatio="xMinYMin meet"
						className="w-full h-full scale-[1.7] md:scale-[2] origin-top-left"
					/>
				</div>
			</div>
		</div>
	);

	const card2Back = (
		<div className="w-full bg-[#e6e7e8] p-4 md:p-8 relative shadow-2xl flex flex-col md:flex-row gap-4 md:gap-6">
			<div
				className="absolute top-2 left-2 w-4 h-4 border-t border-l border-gray-400"
				aria-hidden="true"
			/>
			<div
				className="absolute top-2 right-2 w-4 h-4 border-t border-r border-gray-400"
				aria-hidden="true"
			/>
			<div
				className="absolute bottom-2 left-2 w-4 h-4 border-b border-l border-gray-400"
				aria-hidden="true"
			/>
			<div
				className="absolute bottom-2 right-2 w-4 h-4 border-b border-r border-gray-400"
				aria-hidden="true"
			/>

			{/* Left Column */}
			<div className="flex-1 flex flex-col gap-4">
				<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col min-h-20 shadow-sm">
					<span className="text-xs font-black text-black mb-1">TO</span>
					<FitText className="text-lg text-[#222]">{recipientName}</FitText>
				</div>

				<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col flex-grow min-h-[300px] shadow-sm relative">
					<span className="text-xs font-black text-black mb-2">WHAT YOU DID</span>
					<p className="text-base text-[#222] whitespace-pre-wrap mb-12">{card.message}</p>

					<div className="absolute bottom-4 left-4 right-4">
						<span className="text-[10px] font-black text-black mb-2 block uppercase">
							Which values were demonstrated?
						</span>
						<div className="flex justify-between items-center w-full gap-1">
							{COMPANY_VALUES.map((v) => {
								const checked = card[v.key as keyof typeof card] === true;
								return (
									<ValueIndicator
										key={v.key}
										checked={checked}
										label={
											v.wrap
												? `${v.label.split(" ").slice(0, -1).join(" ")}\n${v.label.split(" ").at(-1)}`
												: v.label
										}
									/>
								);
							})}
						</div>
					</div>
				</div>

				<div className="flex gap-4">
					<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col flex-1 min-h-20 shadow-sm">
						<span className="text-xs font-black text-black mb-1">FROM</span>
						<FitText className="text-lg text-[#222]">{senderName}</FitText>
					</div>
					<div className="bg-white p-3 md:p-4 rounded-sm flex flex-col flex-1 min-h-20 shadow-sm">
						<span className="text-xs font-black text-black mb-1">DATE</span>
						<span className="text-lg text-[#222]">
							{formatRecognitionDate(card.date.toISOString())}
						</span>
					</div>
				</div>
			</div>

			{/* Right Column */}
			<div className="flex-1 flex flex-col gap-4">
				<div className="h-24 flex items-center justify-between px-2">
					<AccessGroupLogo color="#e31837" />
					<AccessBusinessLogo color="#e31837" />
				</div>

				<div className="bg-white p-6 md:p-8 rounded-sm flex flex-col flex-grow shadow-sm relative overflow-hidden">
					<div
						className="absolute left-[20%] top-[10%] w-[80%] h-[90%] pointer-events-none text-black opacity-[0.05]"
						aria-hidden="true"
					>
						<BackgroundGraphic
							preserveAspectRatio="xMinYMin meet"
							className="w-full h-full scale-[1.7] md:scale-[2] origin-top-left"
						/>
					</div>

					<h2 className="text-[#e31837] text-[15px] font-bold mb-8 relative z-10">
						WHICH ACCESS VALUES WERE DEMONSTRATED?
					</h2>

					<div className="flex flex-col gap-5 relative z-10">
						{COMPANY_VALUES.map((v) => {
							const checked = card[v.key as keyof typeof card] === true;
							return <ValueIndicator key={v.key} checked={checked} label={v.label} isLarge />;
						})}
					</div>
				</div>
			</div>
		</div>
	);

	return (
		<div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center py-8 px-4">
			<FlipCard front={card1Front} back={card2Back} />

			{canInteract && userId ? (
				<div className="relative z-10 w-full max-w-4xl mt-4 rounded-[2rem] border border-gray-200/60 bg-white px-6 py-4 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
					<CardInteractionBar
						cardId={id}
						currentUserId={userId}
						isAdmin={isAdmin}
						initialCommentCount={commentCount}
						initialReactions={initialReactions}
					/>
				</div>
			) : !session ? (
				<div className="relative z-10 w-full max-w-4xl mt-4 rounded-[2rem] border border-gray-200/60 bg-white px-6 py-4 shadow-[0_2px_20px_-4px_rgba(0,0,0,0.03)]">
					<InteractionBarReadonly reactions={publicReactions} commentCount={commentCount} />
				</div>
			) : null}

			<div className="mt-8 text-center">
				<p className="text-sm text-gray-500">
					Powered by{" "}
					<Link href="/login" className="text-[#e31837] font-medium hover:underline">
						Access Recognition
					</Link>
				</p>
			</div>
		</div>
	);
}
