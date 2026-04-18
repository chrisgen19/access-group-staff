import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { VALUE_LABELS } from "@/lib/recognition";

export const runtime = "nodejs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params;

	const card = await prisma.recognitionCard.findUnique({
		where: { id },
		include: {
			sender: {
				select: { firstName: true, lastName: true },
			},
			recipient: {
				select: { firstName: true, lastName: true },
			},
		},
	});

	if (!card) {
		return new ImageResponse(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					backgroundColor: "#e6e7e8",
					fontSize: 32,
					color: "#222",
				}}
			>
				Card not found
			</div>,
			{ ...size },
		);
	}

	const recipientName = `${card.recipient.firstName} ${card.recipient.lastName}`;
	const senderName = `${card.sender.firstName} ${card.sender.lastName}`;
	const message = card.message.length > 150 ? `${card.message.slice(0, 150)}...` : card.message;
	const [year, month, day] = card.date.toISOString().split("T")[0].split("-");
	const dateStr = new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(
		"en-US",
		{
			month: "short",
			day: "numeric",
			year: "numeric",
		},
	);

	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				backgroundColor: "#e6e7e8",
				fontFamily: "sans-serif",
			}}
		>
			{/* Red Header */}
			<div
				style={{
					height: 80,
					backgroundColor: "#e31837",
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					padding: "0 48px",
				}}
			>
				<div
					style={{
						color: "white",
						fontSize: 28,
						fontWeight: 900,
						letterSpacing: "-0.5px",
					}}
				>
					ACCESS GROUP AUSTRALIA
				</div>
				<div
					style={{
						color: "white",
						fontSize: 16,
						fontWeight: 700,
					}}
				>
					RECOGNITION CARD
				</div>
			</div>

			{/* Content */}
			<div
				style={{
					flex: 1,
					display: "flex",
					flexDirection: "row",
					padding: 32,
					gap: 24,
				}}
			>
				{/* Left */}
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						gap: 12,
					}}
				>
					{/* TO */}
					<div
						style={{
							backgroundColor: "white",
							padding: "12px 16px",
							display: "flex",
							flexDirection: "column",
							borderRadius: 2,
						}}
					>
						<div
							style={{
								fontSize: 10,
								fontWeight: 900,
								color: "#000",
								marginBottom: 4,
							}}
						>
							TO
						</div>
						<div
							style={{
								fontSize: 22,
								color: "#222",
								fontWeight: 600,
							}}
						>
							{recipientName}
						</div>
					</div>

					{/* Message */}
					<div
						style={{
							backgroundColor: "white",
							padding: "12px 16px",
							display: "flex",
							flexDirection: "column",
							borderRadius: 2,
							flex: 1,
						}}
					>
						<div
							style={{
								fontSize: 10,
								fontWeight: 900,
								color: "#000",
								marginBottom: 4,
							}}
						>
							WHAT YOU DID
						</div>
						<div
							style={{
								fontSize: 16,
								color: "#222",
								lineHeight: 1.5,
							}}
						>
							{message}
						</div>
					</div>

					{/* FROM + DATE */}
					<div style={{ display: "flex", gap: 12 }}>
						<div
							style={{
								flex: 1,
								backgroundColor: "white",
								padding: "12px 16px",
								display: "flex",
								flexDirection: "column",
								borderRadius: 2,
							}}
						>
							<div
								style={{
									fontSize: 10,
									fontWeight: 900,
									color: "#000",
									marginBottom: 4,
								}}
							>
								FROM
							</div>
							<div
								style={{
									fontSize: 18,
									color: "#222",
								}}
							>
								{senderName}
							</div>
						</div>
						<div
							style={{
								flex: 1,
								backgroundColor: "white",
								padding: "12px 16px",
								display: "flex",
								flexDirection: "column",
								borderRadius: 2,
							}}
						>
							<div
								style={{
									fontSize: 10,
									fontWeight: 900,
									color: "#000",
									marginBottom: 4,
								}}
							>
								DATE
							</div>
							<div
								style={{
									fontSize: 18,
									color: "#222",
								}}
							>
								{dateStr}
							</div>
						</div>
					</div>
				</div>

				{/* Right — Values */}
				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						gap: 12,
					}}
				>
					<div
						style={{
							backgroundColor: "white",
							padding: "24px",
							display: "flex",
							flexDirection: "column",
							borderRadius: 2,
							flex: 1,
						}}
					>
						<div
							style={{
								fontSize: 12,
								fontWeight: 700,
								color: "#e31837",
								marginBottom: 20,
							}}
						>
							WHICH ACCESS VALUES WERE DEMONSTRATED?
						</div>
						<div
							style={{
								display: "flex",
								flexDirection: "column",
								gap: 14,
							}}
						>
							{Object.entries(VALUE_LABELS).map(([key, label]) => {
								const checked = card[key as keyof typeof card] === true;
								return (
									<div
										key={key}
										style={{
											display: "flex",
											alignItems: "center",
											gap: 10,
										}}
									>
										<div
											style={{
												width: 24,
												height: 24,
												backgroundColor: checked ? "#333" : "#e5e7eb",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											{checked && (
												<div
													style={{
														color: "white",
														fontSize: 14,
														fontWeight: 900,
													}}
												>
													&#10003;
												</div>
											)}
										</div>
										<div
											style={{
												fontSize: 20,
												fontWeight: 900,
												color: "#222",
												textTransform: "uppercase",
												letterSpacing: "-0.5px",
											}}
										>
											{label}
										</div>
									</div>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>,
		{ ...size },
	);
}
