import { calculateSaju } from "../../../../lib/sajuEngine";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const result = calculateSaju(body);

    return Response.json({
      ok: true,
      result
    });

  } catch (err) {
    return Response.json(
      { ok: false, error: String(err) },
      { status: 500 }
    );
  }
}
