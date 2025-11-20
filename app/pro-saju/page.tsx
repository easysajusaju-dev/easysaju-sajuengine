"use client";

import React, { useState } from "react";

type Gender = "M" | "F";

interface ManseryeokDebug {
  input: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    isLunar: boolean;
    leap: boolean;
    isMale: boolean;
    pivotMin: number;
    tzAdjust?: number;
    seasonAdjust?: number;
  };
  timeCalc: {
    originalBirth: string; // "1978-03-24T12:30"
    birthAdjusted: string; // "1978-03-24T12:00"
  };
  seasonCalc: {
    rawTermName: string;
    rawTermDate: string; // "1978-04-05 12:39"
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
    daeDir: string; // "정사" 등
    daeWoon: string[]; // "10대운(순행)" ...
    daeWoonGanji: string[];
    daeWoonYear: number[];
    seunYear?: number[];
    seunGanji?: string[];
    solarText: string;
    lunarText: string;
    termName: string;
    termDate: string;
  };
}

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
      startAge: number;
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

/** 간단 색상 매핑 – 나중에 실제 오행 컬러로 교체 가능 */
function getGanjiColor(ganji: string) {
  const j = ganji[0] ?? "";
  if ("갑을" .includes(j)) return "bg-emerald-500";
  if ("병정" .includes(j)) return "bg-red-500";
  if ("무기" .includes(j)) return "bg-amber-400";
  if ("경신" .includes(j)) return "bg-slate-500";
  if ("임계" .includes(j)) return "bg-sky-500";
  return "bg-slate-700";
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: "M", label: "남자" },
  { value: "F", label: "여자" },
];

export default function ProSajuPage() {
  // 입력 상태
  const [gender, setGender] = useState<Gender>("M");
  const [name, setName] = useState("홍길동");
  const [birthdate, setBirthdate] = useState("19780324"); // yyyymmdd
  const [birthtime, setBirthtime] = useState("1230"); // HHmm
  const [isLunar, setIsLunar] = useState(false);
  const [isLeap, setIsLeap] = useState(false);
  const [unknownTime, setUnknownTime] = useState(false);

  // 결과 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResponse["result"] | null>(null);

  function parseBirth() {
    if (birthdate.length !== 8) {
      throw new Error("생년월일은 8자리(예: 19780324)로 입력해주세요.");
    }
    const year = Number(birthdate.slice(0, 4));
    const month = Number(birthdate.slice(4, 6));
    const day = Number(birthdate.slice(6, 8));

    let hour = 0;
    let minute = 0;
    if (!unknownTime) {
      if (birthtime.length !== 4) {
        throw new Error("출생시간은 4자리(예: 1230)로 입력하거나 모름에 체크하세요.");
      }
      hour = Number(birthtime.slice(0, 2));
      minute = Number(birthtime.slice(2, 4));
    }

    if (
      Number.isNaN(year) ||
      Number.isNaN(month) ||
      Number.isNaN(day) ||
      month < 1 ||
      month > 12 ||
      day < 1 ||
      day > 31
    ) {
      throw new Error("생년월일이 올바르지 않습니다.");
    }
    if (!unknownTime && (hour < 0 || hour > 23 || minute < 0 || minute > 59)) {
      throw new Error("출생시간이 올바르지 않습니다.");
    }

    return { year, month, day, hour, minute };
  }

  function buildDebugUrl() {
    const { year, month, day, hour, minute } = parseBirth();

    const qs = new URLSearchParams({
      year: String(year),
      month: String(month),
      day: String(day),
      hour: String(hour),
      min: String(minute),
      isLunar: String(isLunar),
      leap: String(isLeap),
      isMale: gender === "M" ? "true" : "false",
      pivotMin: "30",
      tzAdjust: "-30",
      seasonAdjust: "0",
    });

    return `https://my-manseryeok.onrender.com/saju/debug?${qs.toString()}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDebugData(null);
    setEngineResult(null);

    try {
      // 1) 만세력 디버그 호출
      const debugUrl = buildDebugUrl();
      const res = await fetch(debugUrl, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`만세력 서버 오류 (${res.status})`);
      }
      const debugJson: ManseryeokDebug = await res.json();
      setDebugData(debugJson);

      // 2) 사주엔진 호출 – 디버그 결과에서 간지 추출해서 너 서버로 보냄
      const final = debugJson.finalResult;
      const [yearStem, yearBranch] = final.yearGanji.split("");
      const [monthStem, monthBranch] = final.monthGanji.split("");
      const [dayStem, dayBranch] = final.dayGanji.split("");
      const [hourStem, hourBranch] = final.hourGanji.split("");

      const birthIso = debugJson.timeCalc.birthAdjusted
        ? `${debugJson.timeCalc.birthAdjusted}:00+09:00`
        : `${debugJson.timeCalc.originalBirth}:00+09:00`;

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
        body: JSON.stringify(enginePayload),
      });

      const engineJson: EngineResponse = await engineRes.json();
      if (!engineJson.ok) {
        throw new Error(engineJson.error || "사주 엔진 오류");
      }
      setEngineResult(engineJson.result || null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const hasResult = debugData && engineResult;

  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-5xl bg-slate-900 text-slate-50">
        {/* 상단 헤더 – 타사 앱 느낌 */}
        <header className="bg-indigo-700 px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-pink-200 flex items-center justify-center text-xs font-semibold text-slate-900">
            {name.slice(0, 1) || "이"}
          </div>
          <div className="flex flex-col text-sm">
            <div className="font-bold">
              {name || "이름미입력"}
              {gender === "M" ? "(남자)" : "(여자)"}
            </div>
            {debugData && (
              <>
                <div className="text-xs">
                  (양) {debugData.finalResult.solarText}
                </div>
                <div className="text-xs">
                  (음) {debugData.finalResult.lunarText}
                </div>
              </>
            )}
            {!debugData && (
              <div className="text-xs text-slate-200">
                (예) 1978년 03월 24일, 12시 30분(-30)
              </div>
            )}
          </div>
        </header>

        {/* 메인 영역 */}
        <main className="px-4 py-4 bg-slate-900">
          {/* 입력 폼 */}
          <section className="mb-4 border border-slate-700 rounded-md bg-slate-800/70 p-3 text-sm">
            <h2 className="font-semibold mb-3">
              기본 입력양식 · pivot -30분
            </h2>
            <form onSubmit={handleSubmit} className="space-y-2">
              <div className="flex items-center gap-4">
                <span className="w-16">성별</span>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    className="accent-blue-500"
                    value="M"
                    checked={gender === "M"}
                    onChange={() => setGender("M")}
                  />
                  <span>남자</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="radio"
                    className="accent-blue-500"
                    value="F"
                    checked={gender === "F"}
                    onChange={() => setGender("F")}
                  />
                  <span>여자</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <span className="w-16">이름</span>
                <input
                  type="text"
                  className="flex-1 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="입력하세요"
                />
              </div>

              <div className="flex items-center gap-4">
                <span className="w-16">생년월일</span>
                <input
                  type="text"
                  className="w-32 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm"
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value.replace(/\D/g, ""))}
                  placeholder="19780324"
                />
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={isLunar}
                    onChange={(e) => setIsLunar(e.target.checked)}
                  />
                  <span>음력</span>
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={isLeap}
                    onChange={(e) => setIsLeap(e.target.checked)}
                  />
                  <span>윤달</span>
                </label>
              </div>

              <div className="flex items-center gap-4">
                <span className="w-16">출생시간</span>
                <input
                  type="text"
                  className="w-20 rounded border border-slate-600 bg-slate-900 px-2 py-1 text-sm disabled:opacity-60"
                  value={birthtime}
                  onChange={(e) => setBirthtime(e.target.value.replace(/\D/g, ""))}
                  disabled={unknownTime}
                  placeholder="1230"
                />
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    className="accent-blue-500"
                    checked={unknownTime}
                    onChange={(e) => setUnknownTime(e.target.checked)}
                  />
                  <span>모름</span>
                </label>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-sm font-semibold disabled:opacity-60"
                >
                  {loading ? "분석 중..." : "사주 분석 실행"}
                </button>
              </div>

              {error && (
                <div className="mt-2 text-xs text-red-300 bg-red-900/30 border border-red-700/60 rounded px-2 py-1">
                  {error}
                </div>
              )}
            </form>
          </section>

          {/* 결과 영역 */}
          {hasResult && debugData && engineResult && (
            <section className="space-y-4 text-xs leading-relaxed">
              {/* 사주 팔자 표 – 타사 레이아웃 비슷하게 */}
              <div className="border border-slate-700 bg-slate-800/80 rounded-md overflow-hidden">
                {/* 상단 라벨 줄 */}
                <div className="grid grid-cols-4 bg-slate-100 text-slate-900 text-[11px] font-semibold text-center">
                  <div className="border-r border-slate-300 py-1">
                    시주
                    <div className="text-[10px] text-slate-600">(임오)</div>
                  </div>
                  <div className="border-r border-slate-300 py-1">
                    일주
                    <div className="text-[10px] text-slate-600">(을유)</div>
                  </div>
                  <div className="border-r border-slate-300 py-1">
                    월주
                    <div className="text-[10px] text-slate-600">(을묘)</div>
                  </div>
                  <div className="py-1">
                    년주
                    <div className="text-[10px] text-slate-600">(무오)</div>
                  </div>
                </div>

                {/* 중간: 충/형/정재 같은 라인 – 간단히만 */}
                <div className="grid grid-cols-4 bg-amber-100 text-slate-900 text-[11px] text-center border-b border-slate-300">
                  <div className="border-r border-slate-300 py-0.5">충</div>
                  <div className="border-r border-slate-300 py-0.5">-</div>
                  <div className="border-r border-slate-300 py-0.5">-</div>
                  <div className="py-0.5">충</div>
                </div>

                {/* 간지 컬러 박스 라인 */}
                <div className="grid grid-cols-4 bg-slate-50 text-slate-900 text-center">
                  {(["hour", "day", "month", "year"] as const).map((col) => {
                    const ganji = engineResult.ganji[col] || "";
                    const stem = ganji[0] ?? "";
                    const branch = ganji[1] ?? "";
                    const boxColor = getGanjiColor(stem);

                    return (
                      <div
                        key={col}
                        className="border-r last:border-r-0 border-slate-300 px-2 py-2 flex flex-col items-center gap-2"
                      >
                        <div className="text-[11px] font-semibold mb-1">
                          {col === "hour"
                            ? "식신"
                            : col === "day"
                            ? "일간(나)"
                            : col === "month"
                            ? "비견"
                            : "정재"}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div
                            className={`w-16 h-16 border-4 border-slate-900 ${boxColor} flex items-center justify-center text-3xl font-bold text-white`}
                          >
                            {stem || "-"}
                          </div>
                          <div
                            className={`w-16 h-16 border-4 border-slate-900 bg-white flex items-center justify-center text-3xl font-bold`}
                          >
                            {branch || "-"}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 대운 테이블 */}
              <div className="border border-slate-700 bg-slate-800/80 rounded-md overflow-hidden">
                <div className="bg-slate-100 text-slate-900 text-center text-[11px] font-semibold py-1 border-b border-slate-300">
                  전통나이(대운수:{debugData.finalResult.daeNum},{" "}
                  {engineResult.daewoon.direction === "forward" ? "순행" : "역행"})
                </div>

                <div className="grid grid-cols-10 gap-px bg-slate-700 text-[11px] text-center">
                  {/* 나이줄 – 단순 10년씩 증가 (타사와 비슷한 형식) */}
                  {debugData.finalResult.daeWoonYear.map((startYear, idx) => {
                    const textAge = `${(idx + 1) * 10 + 30}`; // 대략 36, 46... 대충 표시
                    return (
                      <div
                        key={`age-${startYear}`}
                        className="bg-slate-100 text-slate-900 py-0.5"
                      >
                        {textAge}
                      </div>
                    );
                  })}
                </div>

                {/* 대운 간지 박스 */}
                <div className="grid grid-cols-10 gap-px bg-slate-700">
                  {debugData.finalResult.daeWoonGanji.map((gj, idx) => (
                    <div
                      key={`dae-${idx}`}
                      className="bg-slate-50 text-slate-900 flex flex-col items-center justify-center py-1"
                    >
                      <div
                        className={`w-10 h-10 ${getGanjiColor(
                          gj[0] ?? ""
                        )} border-2 border-slate-900 flex items-center justify-center text-xl font-bold text-white`}
                      >
                        {gj[0]}
                      </div>
                      <div className="w-10 h-10 bg-slate-900 border-2 border-slate-900 flex items-center justify-center text-xl font-bold text-white">
                        {gj[1]}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 세운 / 월운은 데이터만 간단 나열 (나중에 더 디테일하게) */}
              {debugData.finalResult.seunYear &&
                debugData.finalResult.seunGanji && (
                  <div className="border border-slate-700 bg-slate-800/80 rounded-md overflow-hidden">
                    <div className="bg-slate-100 text-slate-900 text-center text-[11px] font-semibold py-1 border-b border-slate-300">
                      세운(년운)
                    </div>
                    <div className="grid grid-cols-10 gap-px bg-slate-700 text-[11px] text-center">
                      {debugData.finalResult.seunYear.map((y) => (
                        <div
                          key={`sy-${y}`}
                          className="bg-slate-100 text-slate-900 py-0.5"
                        >
                          {y}
                        </div>
                      ))}
                    </div>
                    <div className="grid grid-cols-10 gap-px bg-slate-700">
                      {debugData.finalResult.seunGanji.map((gj, idx) => (
                        <div
                          key={`sg-${idx}`}
                          className="bg-slate-50 text-slate-900 flex flex-col items-center justify-center py-1"
                        >
                          <div
                            className={`w-10 h-10 ${getGanjiColor(
                              gj[0] ?? ""
                            )} border-2 border-slate-900 flex items-center justify-center text-xl font-bold text-white`}
                          >
                            {gj[0]}
                          </div>
                          <div className="w-10 h-10 bg-slate-900 border-2 border-slate-900 flex items-center justify-center text-xl font-bold text-white">
                            {gj[1]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
