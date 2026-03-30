import { Suspense } from "react";
import { RegisterForm } from "./_components/register-form";

export default function RegisterPage() {
	return (
		<Suspense>
			<RegisterForm />
		</Suspense>
	);
}
