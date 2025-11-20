"use client";

import React, { useState } from "react";

type Gender = "M" | "F";

interface EngineResponse {
  ok: boolean;
  result?: {
    ganji: {
      year: string;
      month: string;
      day: string;
      hour: string;
    };
    sibsung: any;
    branchSibsung: any;
    twelve: any;
    daewoon: {
      direction: "forward" | "reverse";
      diffDays: number;
      startAgeFloat: number;
      startAge: number;
      refTermName: string;
      refTermDate: string;
    };
    relations?: {
      hyung: any[];
      chung: any[];
      pa: any[];
      hap: any[];
    };
  };
  error?: string;
}

interface ManseryeokDebug {
  input: any;
  dbInfo: {
    solarYMD: string;
    lunar: string;
    hy: string;
    hm: string;
    hd: string;
  };
  timeCalc: {
    originalBirth: string;
    birthAdjusted: string;
    hourBranchIndex: number;
    hourJi: string;
    hourGan: string;
    hourGanji: string;
  };
  seasonCalc: {
    rawTermName: string;
    rawTermDate: string;
    termAdjusted: string;
  };
  daeCalc: {
    diffHours: number;
    daeRaw: number;
    daeNum: number;
    startYear: number;
    dir: string;
  };
  finalResult: {
    yearGanji: string;
    monthGanji: string;
    dayGanji: string;
    hourGanji: string;
    yearGod: string;
    monthGod: string;
    dayGod: string;
    hourGod: string;
    daeNum: number;
    daeDir: string;
    daeWoon: string[];
    daeWoonGanji: string[];
    daeWoonYear: number[];
    seunYear: number[];
    seunGanji: string[];
    solarText: string;
    lunarText: string;
    termName: string;
    termDate: string;
  };
}

function buildDebugUrl({
  year,
  month,
  day,
  hour,
  minute,
  gender,
}: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: Gender;
}) {
  const isMale = gender === "M" ? "true" : "false";
  const qs = new URLSearchParams({
    year: String(year),
    month: String(month),
    day: String(day),
    hour: String(hour),
    min: String(minute),
    isMale,
    pivotMin: "30",
    tzAdjust: "-30",
    seasonAdjust: "0",
  });
  return `https://my-manseryeok.onrender.com/saju/debug?${qs.toString()}`;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: "M", label: "남자" },
  { value: "F", label: "여자" },
];

export default function ProSajuPage() {
  const [year, setYear] = useState(1978);
  const [month, setMonth] = useState(3);
  const [day, setDay] = useState(24);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(30);
  const [gender, setGender] = useState<Gender>("F");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [engineResult, setEngineResult] =
    useState<EngineResponse["result"] | null>(null);
  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEngineResult(null);

    try {
      // 1) 만세력 debug 호출
      const debugUrl = buildDebugUrl({ year, month, day, hour, minute, gender });
      const debugRes = await fetch(debugUrl, { cache: "no-store" });
      if (!debugRes.ok) {
        throw new Error(`만세력 서버 에러: ${debugRes.status}`);
      }
      const debugJson = (await debugRes.json()) as ManseryeokDebug;
      setDebugData(debugJson);

      // 2) debug 결과에서 사주 엔진 입력값 구성
      const final = debugJson.finalResult;

      const [yearStem, yearBranch] = final.yearGanji.split("");
      const [monthStem, monthBranch] = final.monthGanji.split("");
      const [dayStem, dayBranch] = final.dayGanji.split("");
      const [hourStem, hourBranch] = final.hourGanji.split("");

      const birthIso = debugJson.timeCalc.birthAdjusted
        ? `${debugJson.timeCalc.birthAdjusted}:00+09:00`
        : `${debugJson.timeCalc.originalBirth}:00+09:00`;

      const solarTerms = [
        {
          name: debugJson.seasonCalc.rawTermName || final.termName,
          date: `${debugJson.seasonCalc.rawTermDate}:00+09:00`,
          isPrincipal: true,
        },
      ];

      const enginePayload = {
        yearStem,
        yearBranch,
        monthStem,
        monthBranch,
        dayStem,
        dayBranch,
        hourStem,
        hourBranch,
        gender,
        birth: birthIso,
        solarTerms,
      };

      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enginePayload),
      });

      const engineJson: EngineResponse = await engineRes.json();
      if (!engineJson.ok) {
        throw new Error(engineJson.error || "사주 엔진 에러");
      }

      setEngineResult(engineJson.result!);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "알 수 없는 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const showResult = !!engineResult;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* 헤더 */}
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-500 flex items-center justify-center text-xs tracking-[0.35em] font-bold">
            理知
          </div>
          <div>
            <div className="text-sm font-semibold">이지사주 · Saju Lab</div>
            <div className="text-[11px] text-slate-400">만세력 전문가용 분석 콘솔</div>
          </div>
        </div>
        <div className="text-[11px] text-slate-500">
          Powered by my-manseryeok · easysaju-sajuengine
        </div>
      </header>

      {/* 메인 */}
      <main className="flex-1 flex flex-col lg:flex-row gap-4 px-4 py-4 lg:px-6 lg:py-6 max-w-6xl w-full mx-auto">
        {/* 왼쪽: 입력 패널 */}
        <section className="lg:w-72 w-full">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl shadow-slate-950/40 backdrop-blur">
            <h2 className="text-sm font-semibold mb-3 flex items-center justify-between">
              사주 입력
              <span className="text-[10px] text-slate-500">
                양력 기준 · pivot 30분
              </span>
            </h2>

            <form className="space-y-3 text-sm" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    연도
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    월
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    value={month}
                    onChange={(e) => setMonth(Number(e.target.value))}
                    min={1}
                    max={12}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    일
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    value={day}
                    onChange={(e) => setDay(Number(e.target.value))}
                    min={1}
                    max={31}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    시
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    value={hour}
                    onChange={(e) => setHour(Number(e.target.value))}
                    min={0}
                    max={23}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    분
                  </label>
                  <input
                    type="number"
                    className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    value={minute}
                    onChange={(e) => setMinute(Number(e.target.value))}
                    min={0}
                    max={59}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    성별
                  </label>
                  <select
                    className="w-full rounded-md bg-slate-900 border border-slate-700 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-cyan-400"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as Gender)}
                  >
                    {genderOptions.map((g) => (
                      <option key={g.value} value={g.value}>
                        {g.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 text-xs font-semibold py-2 shadow-lg shadow-cyan-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "분석 중..." : "만세력 · 사주 분석하기"}
                </button>
              </div>

              {error && (
                <div className="text-[11px] text-red-400 bg-red-900/20 border border-red-700/50 rounded-md px-2 py-1">
                  {error}
                </div>
              )}

              {debugData && (
                <div className="mt-2 text-[11px] text-slate-400 space-y-0.5 border-t border-slate-800 pt-2">
                  <div>만세력: {debugData.finalResult?.solarText}</div>
                  <div>절기: {debugData.finalResult?.termName}</div>
                  <div>대운수(원본): {debugData.daeCalc.daeNum}</div>
                </div>
              )}
            </form>
          </div>
        </section>

        {/* 오른쪽: 결과 패널 */}
        <section className="flex-1 flex flex-col gap-4">
          {/* 1) 사주 팔자 & 십성/12운성 */}
          {showResult && engineResult && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl shadow-slate-950/40 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">사주 팔자 · 전문가 뷰</h2>
                <div className="text-[11px] text-slate-500">
                  대운 시작 {engineResult.daewoon.startAge}세 ·{" "}
                  {engineResult.daewoon.direction === "forward" ? "순행" : "역행"}
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(["year", "month", "day", "hour"] as const).map((col) => {
                  const labelMap: Record<string, string> = {
                    year: "년주",
                    month: "월주",
                    day: "일주",
                    hour: "시주",
                  };
                  const ganji = engineResult.ganji[col];
                  const sib = engineResult.sibsung[col === "day" ? "day" : col];
                  const bsib = engineResult.branchSibsung?.[col];
                  const tw = engineResult.twelve[col];

                  const stem = ganji?.[0] ?? "";
                  const branch = ganji?.[1] ?? "";

                  return (
                    <div
                      key={col}
                      className="relative overflow-hidden rounded-2xl bg-slate-950/80 border border-slate-800 px-3 py-3 flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{labelMap[col]}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full border border-slate-700">
                          {tw || "12운성"}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-1">
                        <div className="text-3xl font-semibold tracking-tight">
                          <span className="text-cyan-300">{stem}</span>
                          <span className="ml-1 text-emerald-300">{branch}</span>
                        </div>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1 text-[11px]">
                        <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          십성: {sib}
                        </span>
                        {bsib && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            지지십성: {bsib}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2) 대운 타임라인 */}
          {debugData && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl shadow-slate-950/40 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold">대운 타임라인</h2>
                <div className="text-[11px] text-slate-500">
                  {debugData.finalResult.daeDir === "역사" ? "역행 대운" : "순행 대운"}
                  <span className="ml-2">
                    (원본 대운수: {debugData.finalResult.daeNum})
                  </span>
                </div>
              </div>
              <div className="overflow-x-auto pb-1">
                <div className="flex gap-3 min-w-max">
                  {debugData.finalResult.daeWoonYear.map((y, idx) => {
                    const ganji = debugData.finalResult.daeWoonGanji[idx];
                    return (
                      <div
                        key={y}
                        className="min-w-[90px] rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-[11px]"
                      >
                        <div className="text-slate-400 mb-0.5">{y}년</div>
                        <div className="text-sm font-semibold text-emerald-300">
                          {ganji}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          {10 * (idx + 1)}대운
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3) 형·충·파·합 뷰어 */}
          {engineResult?.relations && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl shadow-slate-950/40 backdrop-blur">
              <h2 className="text-sm font-semibold mb-2">형 · 충 · 파 · 합</h2>
              <div className="grid md:grid-cols-4 gap-3 text-[11px]">
                {([
                  { key: "hyung", label: "형", color: "bg-fuchsia-500/15 border-fuchsia-500/40" },
                  { key: "chung", label: "충", color: "bg-red-500/15 border-red-500/40" },
                  { key: "pa", label: "파", color: "bg-amber-500/15 border-amber-500/40" },
                  { key: "hap", label: "합", color: "bg-sky-500/15 border-sky-500/40" },
                ] as const).map((item) => {
                  const list = (engineResult.relations as any)[item.key] as any[];
                  return (
                    <div key={item.key}>
                      <div className="mb-1 text-slate-300">{item.label}</div>
                      {list && list.length > 0 ? (
                        <div className="space-y-1">
                          {list.map((r, idx) => (
                            <div
                              key={idx}
                              className={`rounded-full ${item.color} border px-2 py-1 flex items-center justify-between`}
                            >
                              <span>{r.branches}</span>
                              <span className="text-[10px] text-slate-300">
                                {r.from} → {r.to}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-slate-500">없음</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
