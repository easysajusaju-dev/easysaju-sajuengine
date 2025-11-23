"use client";

import { useState } from "react";

export default function Home() {
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");
  const [time, setTime] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const testAPI = async () => {
    const start = performance.now();
    setError(null);
    setStatus("idle");

    try {
      const res = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          manseryeok: {
            yearStem: "갑",
            yearBranch: "자",
            monthStem: "을",
            monthBranch: "축",
            dayStem: "병",
            dayBranch: "인",
            hourStem: "정",
            hourBranch: "묘",
            gender: "M",
            birth: "2024-01-01T12:00:00+09:00",
            solarTerms: [
              {
                name: "입춘",
                date: "2024-02-04T11:00:00+09:00",
                isPrincipal: true,
              },
            ],
          },
        }),
      });

      const end = performance.now();

      setTime(Math.round(end - start));
      if (!res.ok) throw new Error("API Response Not OK");

      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "Engine Error");

      setStatus("ok");
      setLog((prev) => [
        `[${new Date().toLocaleTimeString()}] OK (${Math.round(
          end - start
        )} ms)`,
        ...prev,
      ]);
    } catch (e: any) {
      setStatus("error");
      setTime(null);
      setError(e.message);
      setLog((prev) => [
        `[${new Date().toLocaleTimeString()}] ❌ ERROR: ${e.message}`,
        ...prev,
      ]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-xl bg-slate-800 p-6 rounded-2xl shadow-xl border border-slate-700">
        <h1 className="text-2xl font-bold mb-1 text-center">
          🔮 EasySaju Engine – API Monitor
        </h1>
        <p className="text-sm text-slate-400 text-center mb-6">
          엔진 서버 상태, 응답 속도, 최근 로그를 실시간으로 확인합니다.
        </p>

        <button
          onClick={testAPI}
          className="w-full py-3 rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white font-bold transition"
        >
          테스트 요청 보내기
        </button>

        {/* 상태 박스 */}
        <div className="mt-5 p-4 rounded-lg bg-slate-700 text-center">
          <div className="text-sm text-slate-300 mb-1">API 상태</div>
          {status === "idle" && <div className="text-slate-400">-</div>}
          {status === "ok" && (
            <div className="text-green-400 font-bold text-xl">🟢 정상</div>
          )}
          {status === "error" && (
            <div className="text-red-400 font-bold text-xl">🔴 오류</div>
          )}

          {time !== null && (
            <div className="text-slate-300 mt-2 text-sm">
              응답 속도: <span className="font-bold">{time} ms</span>
            </div>
          )}

          {error && (
            <div className="text-red-400 mt-3 text-sm whitespace-pre-wrap">
              {error}
            </div>
          )}
        </div>

        {/* 서버 정보 */}
        <div className="mt-6 p-4 bg-slate-800 border border-slate-700 rounded-lg">
          <h3 className="text-lg font-bold mb-2">서버 정보</h3>
          <ul className="text-sm text-slate-400 space-y-1">
            <li>📡 Framework: Next.js API Route</li>
            <li>🚀 Deployment: Vercel Serverless</li>
            <li>⚙️ Endpoint: /api/saju</li>
            <li>🌍 Region: Automatic</li>
            <li>🔄 Version: Live Production</li>
          </ul>
        </div>

        {/* 로그 */}
        <div className="mt-6 p-4 bg-black rounded-lg h-48 overflow-y-auto text-sm space-y-1 border border-slate-800">
          <div className="text-slate-400 mb-2">📜 Recent Logs</div>
          {log.length === 0 && (
            <div className="text-slate-600">로그 없음</div>
          )}
          {log.map((l, i) => (
            <div key={i} className="text-slate-300">
              {l}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
