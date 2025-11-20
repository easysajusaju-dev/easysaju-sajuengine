"use client";

import React, { useState } from "react";

type Gender = "M" | "F";

interface EngineResult {
  ganji: {
    year: string;
    month: string;
    day: string;
    hour: string;
  };
  sibsung: Record<string, string>;
  branchSibsung: Record<string, string>;
  twelve: Record<string, string>;
  daewoon: {
    direction: "forward" | "reverse";
    startAge: number;
  };
  relations?: {
    hyung: any[];
    chung: any[];
    pa: any[];
    hap: any[];
  };
}

interface EngineResponse {
  ok: boolean;
  result?: EngineResult;
  error?: string;
}

interface ManseryeokFinal {
  yearGanji: string;
  monthGanji: string;
  dayGanji: string;
  hourGanji: string;
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
}

interface ManseryeokDebug {
  input: any;
  dbInfo: any;
  timeCalc: {
    originalBirth: string;
    birthAdjusted: string;
  };
  seasonCalc: {
    rawTermName: string;
    rawTermDate: string;
  };
  daeCalc: {
    daeNum: number;
  };
  finalResult: ManseryeokFinal;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: "M", label: "남자" },
  { value: "F", label: "여자" },
];

// ─────────────────────────────
// 만세력 디버그 URL 만들기
// ─────────────────────────────
function buildDebugUrl(params: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: Gender;
}) {
  const { year, month, day, hour, minute, gender } = params;

  const qs = new URLSearchParams({
    year: String(year),
    month: String(month),
    day: String(day),
    hour: String(hour),
    min: String(minute),
    isMale: gender === "M" ? "true" : "false",
    isLunar: "false",
    leap: "false",
    pivotMin: "30",
    tzAdjust: "-30",
    seasonAdjust: "0",
  });

  return `https://my-manseryeok.onrender.com/saju/debug?${qs.toString()}`;
}

// ─────────────────────────────
// 오행 컬러 매핑 (브랜드톤: 민트/스카이 계열)
// ─────────────────────────────
type ElementType = "목" | "화" | "토" | "금" | "수" | "기타";

function getElementFromStemOrBranch(ch: string): ElementType {
  const woodStems = "甲乙";
  const fireStems = "丙丁";
  const earthStems = "戊己";
  const metalStems = "庚辛";
  const waterStems = "壬癸";

  const woodBranches = "寅卯";
  const fireBranches = "巳午";
  const earthBranches = "丑辰未戌";
  const metalBranches = "申酉";
  const waterBranches = "子亥";

  if (woodStems.includes(ch) || woodBranches.includes(ch)) return "목";
  if (fireStems.includes(ch) || fireBranches.includes(ch)) return "화";
  if (earthStems.includes(ch) || earthBranches.includes(ch)) return "토";
  if (metalStems.includes(ch) || metalBranches.includes(ch)) return "금";
  if (waterStems.includes(ch) || waterBranches.includes(ch)) return "수";
  return "기타";
}

function getElementClasses(element: ElementType) {
  switch (element) {
    case "목":
      // 민트(브랜드 핵심색)
      return {
        bg: "bg-emerald-100",
        text: "text-emerald-800",
        border: "border-emerald-300",
      };
    case "화":
      return {
        bg: "bg-rose-100",
        text: "text-rose-800",
        border: "border-rose-300",
      };
    case "토":
      return {
        bg: "bg-amber-100",
        text: "text-amber-900",
        border: "border-amber-300",
      };
    case "금":
      return {
        bg: "bg-slate-100",
        text: "text-slate-800",
        border: "border-slate-300",
      };
    case "수":
      return {
        bg: "bg-sky-100",
        text: "text-sky-800",
        border: "border-sky-300",
      };
    default:
      return {
        bg: "bg-slate-100",
        text: "text-slate-800",
        border: "border-slate-300",
      };
  }
}

// ─────────────────────────────
// 메인 페이지 컴포넌트
// ─────────────────────────────
export default function ProSajuPage() {
  // 기본값은 네가 테스트했던 1978-03-24 12:30 / 여자
  const [name, setName] = useState("테스트");
  const [year, setYear] = useState(1978);
  const [month, setMonth] = useState(3);
  const [day, setDay] = useState(24);
  const [hour, setHour] = useState(12);
  const [minute, setMinute] = useState(30);
  const [gender, setGender] = useState<Gender>("F");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [engineResult, setEngineResult] = useState<EngineResult | null>(null);
  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);

  // ─────────────────────────────
  // 분석 실행
  // ─────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setEngineResult(null);

    try {
      // 1) 만세력 디버그 호출
      const debugUrl = buildDebugUrl({
        year,
        month,
        day,
        hour,
        minute,
        gender,
      });

      const debugRes = await fetch(debugUrl, { cache: "no-store" });
      if (!debugRes.ok) {
        throw new Error(`만세력 서버 오류 (${debugRes.status})`);
      }

      const debugJson = (await debugRes.json()) as ManseryeokDebug;
      setDebugData(debugJson);

      const final = debugJson.finalResult;

      // 간지 분리
      const [yearStem, yearBranch] = final.yearGanji.split("");
      const [monthStem, monthBranch] = final.monthGanji.split("");
      const [dayStem, dayBranch] = final.dayGanji.split("");
      const [hourStem, hourBranch] = final.hourGanji.split("");

      const birthIso = debugJson.timeCalc.birthAdjusted
        ? `${debugJson.timeCalc.birthAdjusted}:00+09:00`
        : `${debugJson.timeCalc.originalBirth}:00+09:00`;

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
            name: final.termName || debugJson.seasonCalc.rawTermName,
            date: `${debugJson.seasonCalc.rawTermDate}:00+09:00`,
            isPrincipal: true,
          },
        ],
      };

      // 2) 사주 엔진 호출
      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const engineJson = (await engineRes.json()) as EngineResponse;
      if (!engineJson.ok || !engineJson.result) {
        throw new Error(engineJson.error || "사주 엔진 오류");
      }

      setEngineResult(engineJson.result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const hasMainResult = !!engineResult && !!debugData;

  // 간단한 한글 라벨 맵
  const ganjiLabelMap: Record<"year" | "month" | "day" | "hour", string> = {
    year: "년주",
    month: "월주",
    day: "일주",
    hour: "시주",
  };

  // 실제 브라우저에서 확인할 주소 예시:
  // https://easysaju-sajuengine.vercel.app/pro-saju

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* 상단 헤더 (브랜드 바) */}
      <header className="bg-gradient-to-r from-sky-200 via-emerald-200 to-white border-b border-sky-100">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center text-xs font-bold shadow-sm">
              理知
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold text-slate-900">
                이지사주 전문 만세력
              </div>
              <div className="text-[11px] text-slate-600">
                my-manseryeok · 사주엔진 디버그 전용 화면
              </div>
            </div>
          </div>
          <div className="hidden sm:block text-[11px] text-slate-500">
            v0.1 · 내부 테스트용
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="flex-1">
        <div className="max-w-5xl mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row gap-4 md:gap-6">
          {/* 입력 패널 */}
          <section className="w-full md:w-72 shrink-0">
            <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center justify-between">
                기본 입력
                <span className="text-[11px] text-slate-400">
                  양력 · pivot -30분
                </span>
              </h2>

              <form className="space-y-3 text-sm" onSubmit={handleSubmit}>
                {/* 이름 */}
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">
                    이름
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400 bg-slate-50"
                    placeholder="이름(선택)"
                  />
                </div>

                {/* 날짜/시간 */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      연도
                    </label>
                    <input
                      type="number"
                      value={year}
                      onChange={(e) => setYear(Number(e.target.value))}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      월
                    </label>
                    <input
                      type="number"
                      value={month}
                      onChange={(e) => setMonth(Number(e.target.value))}
                      min={1}
                      max={12}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      일
                    </label>
                    <input
                      type="number"
                      value={day}
                      onChange={(e) => setDay(Number(e.target.value))}
                      min={1}
                      max={31}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      시
                    </label>
                    <input
                      type="number"
                      value={hour}
                      onChange={(e) => setHour(Number(e.target.value))}
                      min={0}
                      max={23}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      분
                    </label>
                    <input
                      type="number"
                      value={minute}
                      onChange={(e) => setMinute(Number(e.target.value))}
                      min={0}
                      max={59}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-1">
                      성별
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as Gender)}
                      className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-sky-400 focus:border-sky-400"
                    >
                      {genderOptions.map((g) => (
                        <option key={g.value} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 버튼 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 rounded-full bg-sky-500 text-white text-xs font-semibold py-2 shadow-sm hover:bg-sky-600 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "분석 중..." : "사주 분석 실행"}
                </button>

                {error && (
                  <div className="text-[11px] text-rose-600 bg-rose-50 border border-rose-200 rounded-md px-2 py-1 mt-1">
                    {error}
                  </div>
                )}

                {debugData && (
                  <div className="mt-2 border-t border-slate-100 pt-2 text-[11px] text-slate-500 space-y-0.5">
                    <div>{debugData.finalResult.solarText}</div>
                    <div>{debugData.finalResult.lunarText}</div>
                    <div>
                      절기: {debugData.finalResult.termName}{" "}
                      ({debugData.finalResult.termDate})
                    </div>
                    <div>대운수: {debugData.finalResult.daeNum}</div>
                  </div>
                )}
              </form>
            </div>
          </section>

          {/* 결과 패널 */}
          <section className="flex-1 flex flex-col gap-4">
            {/* 프로필 & 요약 */}
            {hasMainResult && debugData && (
              <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-emerald-400 text-white flex items-center justify-center text-sm font-semibold">
                      {name ? name[0] : "명"}
                    </div>
                    <div className="text-sm">
                      <div className="font-semibold">
                        {name || "미입력"}{" "}
                        <span className="text-[11px] text-slate-500">
                          ({gender === "M" ? "남" : "여"})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {year}년 {month}월 {day}일 {hour}시 {minute}분 (양력, -30분
                        보정)
                      </div>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    대운 시작: {engineResult?.daewoon.startAge}세 ·{" "}
                    {engineResult?.daewoon.direction === "forward"
                      ? "순행"
                      : "역행"}
                  </div>
                </div>
              </div>
            )}

            {/* 사주 팔자 */}
            {engineResult && debugData && (
              <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-4">
                <h2 className="text-sm font-semibold mb-3">사주 팔자</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {(["year", "month", "day", "hour"] as const).map((key) => {
                    const ganji = engineResult.ganji[key] || "";
                    const stem = ganji[0] || "";
                    const branch = ganji[1] || "";

                    const element = getElementFromStemOrBranch(stem || branch);
                    const classes = getElementClasses(element);

                    const sib =
                      engineResult.sibsung?.[key === "day" ? "day" : key] ?? "";
                    const bsib = engineResult.branchSibsung?.[key] ?? "";
                    const twelve = engineResult.twelve?.[key] ?? "";

                    return (
                      <div
                        key={key}
                        className="rounded-2xl border border-slate-100 bg-slate-50 overflow-hidden flex flex-col"
                      >
                        {/* 상단 라벨 */}
                        <div className="px-3 py-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50">
                          <span>{ganjiLabelMap[key]}</span>
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">
                            {twelve || "12운성"}
                          </span>
                        </div>

                        {/* 천간/지지 박스 */}
                        <div
                          className={`flex-1 flex flex-col items-center justify-center gap-2 px-3 py-3 ${classes.bg}`}
                        >
                          <div className="text-[10px] text-slate-500">
                            오행: {element}
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <div
                              className={`w-12 h-12 rounded-xl border-2 ${classes.border} bg-white flex items-center justify-center text-2xl font-bold ${classes.text}`}
                            >
                              {stem || "-"}
                            </div>
                            <div
                              className={`w-12 h-12 rounded-xl border-2 ${classes.border} bg-white flex items-center justify-center text-2xl font-bold ${classes.text}`}
                            >
                              {branch || "-"}
                            </div>
                          </div>
                        </div>

                        {/* 십성 정보 */}
                        <div className="px-3 py-2 border-t border-slate-100 text-[11px] bg-white">
                          <div className="flex flex-wrap gap-1">
                            {sib && (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                십성: {sib}
                              </span>
                            )}
                            {bsib && (
                              <span className="px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                                지지십성: {bsib}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 대운 타임라인 */}
            {debugData && (
              <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">대운</h2>
                  <div className="text-[11px] text-slate-500">
                    대운수: {debugData.finalResult.daeNum} ·{" "}
                    {debugData.finalResult.daeDir === "역행"
                      ? "역행"
                      : "순행"}{" "}
                    (전통나이 기준)
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1">
                  {debugData.finalResult.daeWoonYear.map((y, idx) => {
                    const ganji =
                      debugData.finalResult.daeWoonGanji[idx] || "";
                    const stem = ganji[0] || "";
                    const branch = ganji[1] || "";
                    const element = getElementFromStemOrBranch(stem || branch);
                    const classes = getElementClasses(element);

                    return (
                      <div
                        key={`${y}-${idx}`}
                        className={`min-w-[90px] rounded-xl border ${classes.border} bg-white shadow-sm flex flex-col items-center px-3 py-2 text-[11px]`}
                      >
                        <div className="text-slate-500 mb-0.5">{y}년</div>
                        <div
                          className={`w-10 h-10 rounded-lg ${classes.bg} flex items-center justify-center text-lg font-bold ${classes.text}`}
                        >
                          {ganji || "-"}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          {10 * (idx + 1)}대운
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 세운 (연운) */}
            {debugData && (
              <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold">세운 (연운)</h2>
                  <div className="text-[11px] text-slate-500">
                    {debugData.finalResult.seunYear[0]}년 ~{" "}
                    {
                      debugData.finalResult.seunYear[
                        debugData.finalResult.seunYear.length - 1
                      ]
                    }
                    년
                  </div>
                </div>

                <div className="flex gap-3 overflow-x-auto pb-1">
                  {debugData.finalResult.seunYear.map((y, idx) => {
                    const ganji = debugData.finalResult.seunGanji[idx] || "";
                    const stem = ganji[0] || "";
                    const branch = ganji[1] || "";
                    const element = getElementFromStemOrBranch(stem || branch);
                    const classes = getElementClasses(element);

                    return (
                      <div
                        key={`${y}-${idx}`}
                        className="min-w-[80px] rounded-xl border border-slate-100 bg-slate-50 flex flex-col items-center px-2.5 py-2 text-[11px]"
                      >
                        <div className="text-slate-500 text-[10px] mb-0.5">
                          {y}년
                        </div>
                        <div
                          className={`w-9 h-9 rounded-lg ${classes.bg} flex items-center justify-center text-base font-semibold ${classes.text}`}
                        >
                          {ganji || "-"}
                        </div>
                        <div className="mt-0.5 text-[10px] text-slate-500">
                          {element}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
