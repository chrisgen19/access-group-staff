export const dynamic = "force-dynamic";

/**
 * Container liveness probe. Deliberately does not touch the database or auth:
 * a deep check would mark every replica unhealthy during a shared-Postgres
 * blip and restart them all at once. This answers only "is the server
 * serving HTTP?".
 */
export function GET() {
	return Response.json({ success: true, data: { status: "ok" } }, { status: 200 });
}
