import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Render 서버 주소
    const ENGINE_URL =
      "https://my-manseryeok.onrender.com/saju/full";

    // 프론트에서 받은 값 → Render 서버로 전달
    const qs = new URLSearchParams({
      year: body.year.toString(),
      month: body.month.toString(),
      day: body.day.toString(),
      hour: body.hour.toString(),
      min: body.minute.toString(),
      isLunar: String(body.isLunar),
      leap: String(body.leap),
      isMale: body.gender === "M" ? "true" : "false",
    });

    const res = await fetch(`${ENGINE_URL}?${qs.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const json = await res.json();

    // Render 서버에서 에러면 그대로 전달
    if (!json.ok) {
      return NextResponse.json(
        { ok: false, error: json.error || "ENGINE_ERROR" },
        { status: 400 }
      );
    }

    // 성공 → 프론트에서 그대로 쓸 형태로 전달
    return NextResponse.json({ ok: true, result: json.result });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err.message || "UNKNOWN_ERROR" },
      { status: 500 }
    );
  }
}
