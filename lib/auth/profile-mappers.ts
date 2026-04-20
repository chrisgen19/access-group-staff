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

export function mapMicrosoftProfile(profile: MicrosoftProfile): MappedUser {
	const fallbackSource =
		profile.name ?? profile.preferred_username ?? profile.email?.split("@")[0] ?? "";
	const [fallbackFirst, ...fallbackRest] = fallbackSource.trim().split(/\s+/);
	const firstName = profile.given_name ?? fallbackFirst ?? "";
	const lastName = profile.family_name ?? (fallbackRest.join(" ") || firstName);
	return {
		firstName,
		lastName,
		name: profile.name ?? `${firstName} ${lastName}`.trim(),
	};
}
