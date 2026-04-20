export type MicrosoftProfile = {
	given_name?: string;
	family_name?: string;
	name?: string;
	preferred_username?: string;
	email?: string;
};

export type GoogleProfile = {
	given_name: string;
	family_name: string;
};

export type MappedUser = {
	firstName: string;
	lastName: string;
	name: string;
};

export function mapGoogleProfile(profile: GoogleProfile): MappedUser {
	return {
		firstName: profile.given_name,
		lastName: profile.family_name,
		name: `${profile.given_name} ${profile.family_name}`,
	};
}

function stripEmailDomain(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const at = value.indexOf("@");
	return at === -1 ? value : value.slice(0, at);
}

export function mapMicrosoftProfile(profile: MicrosoftProfile): MappedUser {
	const fallbackSource = (
		profile.name ??
		stripEmailDomain(profile.preferred_username) ??
		stripEmailDomain(profile.email) ??
		""
	).trim();
	const [fallbackFirst, ...fallbackRest] = fallbackSource.split(/\s+/);
	const firstName = profile.given_name ?? fallbackFirst ?? "";
	const lastName = profile.family_name ?? (fallbackRest.join(" ") || firstName);
	return {
		firstName,
		lastName,
		name: profile.name ?? (fallbackSource || `${firstName} ${lastName}`.trim()),
	};
}
