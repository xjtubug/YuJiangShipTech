import { NextResponse } from "next/server";

export async function POST() {
	return NextResponse.json(
		{ success: false, error: "Follow-up endpoint is not implemented yet." },
		{ status: 501 },
	);
}
