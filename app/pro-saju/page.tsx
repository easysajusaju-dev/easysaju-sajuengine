"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Gender = "M" | "F";

interface EngineResponse {
  ok: boolean;
  result?: {
    ganji: { year: string; month: string; day: string; hour: string };
    sibsung: any;
    branchSibsung: any;
    twelve: any;
    daewoon: {
      direction: "forward" | "reverse";
      startAge: number;
    };
    relations?: { hyung: any[]; chung: any[]; pa: any[]; hap: any[] };
  };
  error?: string;
}

interface ManseryeokDebug {
  finalResult: {
    yearGanji: string;
    monthGanji: string;
    dayGanji: string;
    hourGanji: string;

    daeNum: number;
    daeDir: string;
    daeWoon: string[];
    daeWoonGanji: string[];
    daeWoonYear: number[];
    solarText: string;
    termName: string;
  };
  seasonCalc: { rawTermName: string; rawTermDate: string };
  timeCalc: { originalBirth: string; birthAdjusted: string };
  daeCalc: { daeNum: number };
}

function buildDebugUrl({
  year, month, day, hour, minute, gender,
}: {
  year: number; month: number; day: number; hour: number; minute: number; gender: Gender;
}) {
  const isMale = gender === "M" ? "true" : "false";

  const qs = new URLSearchParams({
    year: String(year),
    month: String(month),
    day: String(day),
    hour: String(hour),
    min: String(minute),
    isMale,
    pivotMin: "30"
  });

  return `https://my-manseryeok.onrender.com/saju/debug?${qs.toString()}`;
}

const genderOptions = [
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
      // 1) 만세력 디버그 호출
      const debugUrl = buildDebugUrl({ year, month, day, hour, minute, gender });
      const debugRes = await fetch(debugUrl, { cache: "no-store" });

      if (!debugRes.ok) throw new Error("만세력 서버 오류");

      const debugJson = await debugRes.json();
      setDebugData(debugJson);

      const final = debugJson.finalResult;

      const [yearStem, yearBranch] = final.yearGanji.split("");
      const [monthStem, monthBranch] = final.monthGanji.split("");
      const [dayStem, dayBranch] = final.dayGanji.split("");
      const [hourStem, hourBranch] = final.hourGanji.split("");

      const birthIso =
        debugJson.timeCalc.birthAdjusted
          ? `${debugJson.timeCalc.birthAdjusted}:00+09:00`
          : `${debugJson.timeCalc.originalBirth}:00+09:00`;

      // 2) 사주 엔진 호출
      const payload = {
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
        solarTerms: [
          {
            name: final.termName,
            date: `${debugJson.seasonCalc.rawTermDate}:00+09:00`,
            isPrincipal: true,
          },
        ],
      };

      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const engineJson = await engineRes.json();

      if (!engineJson.ok) throw new Error(engineJson.error || "사주 엔진 오류");

      setEngineResult(engineJson.result);
    } catch (err: any) {
      setError(err.message || "오류 발생");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">

      {/* 헤더 */}
      <header className="border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-300 to-cyan-500 flex items-center justify-center text-xs font-bold tracking-widest">
            理知
          </div>
          <div>
            <div className="text-sm font-semibold">이지사주 · Saju Lab</div>
            <div className="text-[11px] text-slate-400">
              전문가용 사주 분석 콘솔
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4 max-w-6xl w-full mx-auto">

        {/* 입력 패널 */}
        <section className="lg:w-72 w-full">
          <motion.div
            className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-sm font-semibold mb-3">사주 입력</h2>

            <form className="space-y-3 text-sm" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-2">
                {/* 연, 월, 일, 시, 분, 성별 */}
                {[{
                  label: "연도", value: year, setter: setYear
                }, {
                  label: "월", value: month, setter: setMonth
                }, {
                  label: "일", value: day, setter: setDay
                }, {
                  label: "시", value: hour, setter: setHour
                }, {
                  label: "분", value: minute, setter: setMinute
                }].map((item, idx) => (
                  <div key={idx}>
                    <label className="block text-[11px] text-slate-400 mb-1">
                      {item.label}
                    </label>
                    <input
                      type="number"
                      className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs"
                      value={item.value}
                      onChange={(e) => item.setter(Number(e.target.value))}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">
                    성별
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-1.5 text-xs"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-cyan-400 to-emerald-400 text-slate-950 font-semibold rounded-full py-2 text-xs shadow"
              >
                {loading ? "분석 중..." : "분석하기"}
              </button>

              {error && (
                <div className="text-[11px] text-red-400 bg-red-900/20 px-2 py-1 rounded">
                  {error}
                </div>
              )}
            </form>
          </motion.div>
        </section>

        {/* 결과 */}
        <section className="flex-1 flex flex-col gap-4">

          {/* 사주팔자 */}
          <AnimatePresence>
            {engineResult && (
              <motion.div
                key="main-cards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur"
              >
                <h2 className="text-sm font-semibold mb-3">사주 팔자</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(["year", "month", "day", "hour"] as const).map((col) => {
                    const ganji = engineResult.ganji[col] || "";
                    const stem = ganji[0] || "-";
                    const branch = ganji[1] || "-";

                    return (
                      <div
                        key={col}
                        className="rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-3"
                      >
                        <div className="text-[11px] text-slate-400 mb-1">
                          {col === "year" ? "년주" :
                            col === "month" ? "월주" :
                              col === "day" ? "일주" : "시주"}
                        </div>
                        <div className="text-3xl font-bold">
                          <span className="text-cyan-300">{stem}</span>
                          <span className="text-emerald-300">{branch}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 대운 */}
          {debugData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 backdrop-blur"
            >
              <h2 className="text-sm font-semibold mb-3">대운</h2>

              <div className="flex gap-3 overflow-x-auto">
                {debugData.finalResult.daeWoonYear.map((y, idx) => (
                  <div
                    key={y}
                    className="min-w-[90px] rounded-xl border border-slate-800 bg-slate-950/80 px-3 py-2 text-[11px]"
                  >
                    <div className="text-slate-400">{y}년</div>
                    <div className="text-sm font-bold text-emerald-300">
                      {debugData.finalResult.daeWoonGanji[idx]}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </section>
      </main>
    </div>
  );
}
