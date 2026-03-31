import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json(
		{
			success: false,
			error: "Product expert-reviews endpoint is not implemented yet.",
		},
		{ status: 501 },
	);
}
