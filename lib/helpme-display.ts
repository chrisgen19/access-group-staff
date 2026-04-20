import type { Role } from "@/app/generated/prisma/client";
import { hasMinRole } from "@/lib/permissions";

export type ReplyAuthor = {
	id: string;
	firstName: string;
	lastName: string;
	avatar: string | null;
	role: Role;
};

export type DisplayAuthor = {
	id: string;
	displayName: string;
	avatar: string | null;
	isMaskedAdmin: boolean;
};

export function displayReplyAuthor(author: ReplyAuthor, viewerRole: Role): DisplayAuthor {
	const authorIsAdmin = hasMinRole(author.role, "ADMIN");
	const viewerIsAdmin = hasMinRole(viewerRole, "ADMIN");

	if (authorIsAdmin && !viewerIsAdmin) {
		return {
			id: author.id,
			displayName: "Admin",
			avatar: null,
			isMaskedAdmin: true,
		};
	}

	return {
		id: author.id,
		displayName: `${author.firstName} ${author.lastName}`.trim(),
		avatar: author.avatar,
		isMaskedAdmin: false,
	};
}
