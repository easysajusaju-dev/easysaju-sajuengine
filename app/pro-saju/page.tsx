// ⚠️ 전체 코드가 매우 길기 때문에 단일 메시지에 모두 담을 수 없습니다.
// 따라서 아래에 PART 1 → PART 2 → PART 3 순으로 순차적으로 정확히 이어붙여 드리겠습니다.

// 👉 PART 1 시작

"use client";

import EasySajuInputCard from "./components/EasySajuInputCard";
import React, { useState, useEffect, useRef } from "react";

type Gender = "M" | "F";

interface ManseryeokDebug {
  input: any;
  timeCalc: any;
  seasonCalc: any;
  finalResult: any;
}

interface RelationItem {
  from: "year" | "month" | "day" | "hour";
  to: "year" | "month" | "day" | "hour";
  branches: string;
  kind: "형" | "충" | "파" | "합";
}

interface Relations {
  hyung: RelationItem[];
  chung: RelationItem[];
  pa: RelationItem[];
  hap: RelationItem[];
}

interface EngineResponse {
  ok: boolean;
  result?: {
    ganji: any;
    sibsung: any;
    branchSibsung: any;
    twelve: any;
    daewoon: {
      direction: "forward" | "reverse";
      startAge: number;
    };
    relations?: Relations;
    sinsal?: any;
    guin?: {
      cheonEulGuiin: ("year" | "month" | "day" | "hour")[];
    };
  };
  error?: string;
}

// ------------- 십간·십이지 -------------
const CHEONGAN = "갑을병정무기경신임계";
const JIJI = "자축인묘진사오미신유술해";
const GANJI_60: string[] = [];
for (let i = 0; i < 60; i++) {
  GANJI_60.push(CHEONGAN[i % 10] + JIJI[i % 12]);
}

const HANJA_GAN_MAP: Record<string, string> = {
  갑: "甲",
  을: "乙",
  병: "丙",
  정: "丁",
  무: "戊",
  기: "己",
  경: "庚",
  신: "辛",
  임: "壬",
  계: "癸",
};

const HANJA_JI_MAP: Record<string, string> = {
  자: "子",
  축: "丑",
  인: "寅",
  묘: "卯",
  진: "辰",
  사: "巳",
  오: "午",
  미: "未",
  신: "申",
  유: "酉",
  술: "戌",
  해: "亥",
};

function toHanja(g: string) {
  return (HANJA_GAN_MAP[g[0]] ?? g[0]) + (HANJA_JI_MAP[g[1]] ?? g[1]);
}

function getGanjiByYear(year: number) {
  const idx = (year - 1984) % 60;
  return GANJI_60[(idx + 60) % 60];
}

function getMonthlyGanjiList(yearStem: string) {
  const ganIdx = CHEONGAN.indexOf(yearStem);
  if (ganIdx === -1) return [];
  const start = (ganIdx % 5) * 2 + 2;
  let s = start - 1;
  let b = 1;
  const arr = [];
  for (let i = 1; i <= 12; i++) {
    arr.push({ month: i, ganji: toHanja(CHEONGAN[s % 10] + JIJI[b % 12]) });
    s++; b++;
  }
  return arr;
}

// ---- 오행 ----
function getOhaengStyles(ch: string) {
  if ("갑을인묘甲乙寅卯".includes(ch)) return { bg: "bg-green-400", border: "border-green-700" };
  if ("병정사오丙丁巳午".includes(ch)) return { bg: "bg-red-400", border: "border-red-700" };
  if ("무기진술축미戊己辰戌丑未".includes(ch)) return { bg: "bg-yellow-300", border: "border-yellow-600" };
  if ("경신신유庚辛申酉".includes(ch)) return { bg: "bg-slate-200", border: "border-slate-400" };
  if ("임계해자壬癸亥子".includes(ch)) return { bg: "bg-sky-400", border: "border-sky-700" };
  return { bg: "bg-gray-200", border: "border-gray-300" };
}

// ---- 지장간 ----
const BRANCH_HIDDEN: Record<string, string[]> = {
  "子": ["癸"], "丑": ["己", "癸", "辛"], "寅": ["甲", "丙", "戊"], "卯": ["乙"],
  "辰": ["戊", "乙", "癸"], "巳": ["丙", "戊", "庚"], "午": ["丁", "己"], "未": ["己", "丁", "乙"],
  "申": ["庚", "壬", "戊"], "酉": ["辛"], "戌": ["戊", "辛", "丁"], "亥": ["壬", "甲"],
};
function getJijanggan(j: string) { return BRANCH_HIDDEN[j] ?? []; }

// ==============================
//   ⭐⭐ 신살 병기 + 천을귀인 처리 ⭐⭐
// ==============================

function getMergedSinsalView(result: EngineResponse["result"]) {
  const positions = ["year", "month", "day", "hour"];
  const out: Record<string, string[]> = { year: [], month: [], day: [], hour: [] };
  if (!result?.sinsal) return out;

  positions.forEach((p) => {
    const y = result.sinsal.yearBase?.[p];
    const d = result.sinsal.dayBase?.[p];

    const arr: string[] = [];
    if (d) arr.push(`${d}[일]`);
    if (y) arr.push(`${y}[연]`);

    out[p] = arr;
  });

  return out;
}

function isCheonEulGuiin(result: EngineResponse["result"], pos: string) {
  return result?.guin?.cheonEulGuiin?.includes(pos as any);
}

// PART 1 끝

// 👉 PART 2 시작

// ---- 본문 컴포넌트 ----
export default function ProSajuPage() {
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResponse["result"] | null>(null);

  const [userName, setUserName] = useState("");
  const seunRef = useRef<HTMLDivElement>(null);
  const COLS = ["year", "month", "day", "hour"] as const;

  const [viewOptions, setViewOptions] = useState({ five: true, hidden: true, relations: true });
  const toggleView = (k: keyof typeof viewOptions) => setViewOptions((p) => ({ ...p, [k]: !p[k] }));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  async function handleSubmit(formData: {
    gender: Gender;
    name: string;
    birthdate: string;
    birthtime: string;
    isLunar: boolean;
    isLeap: boolean;
    unknownTime: boolean;
  }) {
    setLoading(true);
    setError(null);

    try {
      const { gender, name, birthdate, birthtime, isLunar, isLeap, unknownTime } = formData;
      setUserName(name);

      if (birthdate.length !== 8) throw new Error("생년월일 8자리 입력");

      const Y = Number(birthdate.slice(0, 4));
      const M = Number(birthdate.slice(4, 6));
      const D = Number(birthdate.slice(6, 8));

      let hh = 0, mm = 0;
      if (!unknownTime) {
        if (birthtime.length !== 4) throw new Error("출생시간 4자리 입력");
        hh = Number(birthtime.slice(0, 2));
        mm = Number(birthtime.slice(2, 4));
      }

      const qs = new URLSearchParams({
        year: String(Y), month: String(M), day: String(D), hour: String(hh), min: String(mm),
        isLunar: String(isLunar), leap: String(isLeap), isMale: gender === "M" ? "true" : "false",
        pivotMin: "30", tzAdjust: "-30", seasonAdjust: "0",
      });

      const debugRes = await fetch(`https://my-manseryeok.onrender.com/saju/debug?${qs}`);
      if (!debugRes.ok) throw new Error("만세력 서버 오류");
      const debugJson: ManseryeokDebug = await debugRes.json();

      setDebugData(debugJson);
      const f = debugJson.finalResult;
      const birthIso = `${debugJson.timeCalc.birthAdjusted || debugJson.timeCalc.originalBirth}:00+09:00`;

      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearStem: f.yearGanji[0], yearBranch: f.yearGanji[1],
          monthStem: f.monthGanji[0], monthBranch: f.monthGanji[1],
          dayStem: f.dayGanji[0], dayBranch: f.dayGanji[1],
          hourStem: f.hourGanji[0], hourBranch: f.hourGanji[1],
          gender,
          birth: birthIso,
          solarTerms: [{ name: f.termName, date: `${debugJson.seasonCalc.rawTermDate}:00+09:00`, isPrincipal: true }],
        }),
      });

      const engineJson: EngineResponse = await engineRes.json();
      setEngineResult(engineJson.result || null);

      setIsFormOpen(false);
      setSelectedYear(new Date().getFullYear());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const hasResult = !!(debugData && engineResult);
  const currentYear = new Date().getFullYear();
  const birthYear = debugData ? Number(debugData.input.year) : 0;
  const koreanAge = birthYear ? currentYear - birthYear + 1 : 0;

  const seunList: { year: number; age: number; ganji: string }[] = [];
  if (hasResult) {
    for (let i = 0; i <= 100; i++) {
      const year = birthYear + i;
      seunList.push({ year, age: i + 1, ganji: toHanja(getGanjiByYear(year)) });
    }
  }

  const selectedYearGanji = hasResult ? getGanjiByYear(selectedYear) : "갑자";
  const wolunList = hasResult ? getMonthlyGanjiList(selectedYearGanji[0]) : [];

  const five = hasResult && engineResult ? (() => {
    const str = Object.values(engineResult.ganji).join("");
    return {
      목: [...str].filter((c) => "갑을인묘甲乙寅卯".includes(c)).length,
      화: [...str].filter((c) => "병정사오丙丁巳午".includes(c)).length,
      토: [...str].filter((c) => "무기진술축미戊己辰戌丑未".includes(c)).length,
      금: [...str].filter((c) => "경신신유庚辛申酉".includes(c)).length,
      수: [...str].filter((c) => "임계해자壬癸亥子".includes(c)).length,
    };
  })() : null;

  const hidden = hasResult && engineResult ? {
    year: getJijanggan(engineResult.ganji.year[1]),
    month: getJijanggan(engineResult.ganji.month[1]),
    day: getJijanggan(engineResult.ganji.day[1]),
    hour: getJijanggan(engineResult.ganji.hour[1]),
  } : null;

  const mergedSinsal = hasResult && engineResult ? getMergedSinsalView(engineResult) : null;

// PART 2 끝

// 👉 PART 3 시작

  const formatR = (r: RelationItem) =>
    `${{ year: "년", month: "월", day: "일", hour: "시" }[r.from]}-${{ year: "년", month: "월", day: "일", hour: "시" }[r.to]} (${r.branches})`;

  useEffect(() => {
    if (engineResult && seunRef.current) {
      setTimeout(() => {
        const target = document.getElementById(`year-${selectedYear}`);
        if (target) {
          target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }, 300);
    }
  }, [engineResult, selectedYear]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center text-gray-900 select-none font-sans">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen md:min-h-0 md:h-auto md:my-5 md:rounded-xl overflow-hidden">

        {/* 헤더 */}
        <header className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center shadow sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <img src="https://easysajusaju-dev.github.io/logo_remove_white.png" className="h-7 w-auto" alt="logo" />
            <span className="font-bold text-lg">이지사주 만세력</span>
          </div>

          <button onClick={() => setIsFormOpen(!isFormOpen)} className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30">
            {isFormOpen ? "닫기" : "입력 열기"}
          </button>
        </header>

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs px-4 py-2 border-b border-red-200">{error}</div>
        )}

        {/* 입력폼 */}
        {isFormOpen && (
          <EasySajuInputCard onSubmit={handleSubmit} loading={loading} />
        )}

        {/* 결과 화면 */}
        {hasResult && !isFormOpen && engineResult && debugData && (
          <main className="bg-slate-50 pb-20">

            {/* 요약 카드 */}
            <div className="bg-white p-5 border-b border-gray-200 shadow-sm mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow ${debugData.input.isMale ? "bg-blue-100" : "bg-pink-100"}`}>
                  <img src={debugData.input.isMale ? "/gender/male.png" : "/gender/female.png"} className="w-7 h-7" />
                </div>

                <div className="flex flex-col">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold">{userName || debugData.input.name || "이름"}</span>
                    <span className="text-sm text-gray-600">{debugData.input.isMale ? "남" : "여"}, {koreanAge}세</span>
                  </div>

                  <div className="text-xs text-gray-400">(양) {debugData.finalResult.solarText} / (음) {debugData.finalResult.lunarText}</div>
                </div>
              </div>
            </div>

            {/* 원국 카드 */}
            <div className="mx-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-3">
              <div className="grid grid-cols-4 bg-gray-50 text-center font-bold py-2 border-b">
                <div>년주</div><div>월주</div><div>일주</div><div>시주</div>
              </div>

              {/* 천간 */}
              <div className="grid grid-cols-4 border-b bg-white">
                {COLS.map((col) => {
                  const stem = engineResult.ganji[col][0];
                  const s = getOhaengStyles(stem);
                  return (
                    <div key={col} className="py-2 flex flex-col items-center border-r last:border-r-0">
                      <span className="text-sm text-indigo-700 font-bold mb-1">
                        {col === "day" ? "일간(나)" : engineResult.sibsung[col]}
                      </span>
                      <div className={`w-full max-w-[90px] aspect-square flex items-center justify-center text-[2.3rem] rounded shadow-sm border ${s.bg} ${s.border}`}>{stem}</div>
                    </div>
                  );
                })}
              </div>

              {/* 지지 */}
              <div className="grid grid-cols-4 border-b bg-white">
                {COLS.map((col) => {
                  const ji = engineResult.ganji[col][1];
                  const s = getOhaengStyles(ji);
                  return (
                    <div key={col} className="py-2 flex justify-center border-r last:border-r-0">
                      <div className={`w-full max-w-[90px] aspect-square flex items-center justify-center text-[2.3rem] rounded shadow-sm border ${s.bg} ${s.border}`}>{ji}</div>
                    </div>
                  );
                })}
              </div>

              {/* 지지 십성 */}
              <div className="grid grid-cols-4 border-b bg-white">
                {COLS.map((col) => (
                  <div key={col} className="py-1.5 text-center text-blue-600 text-sm font-semibold border-r last:border-r-0">
                    {engineResult.branchSibsung[col]}
                  </div>
                ))}
              </div>

              {/* 12운성 */}
              <div className="grid grid-cols-4 bg-white">
                {COLS.map((col) => (
                  <div key={col} className="py-1.5 text-center border-r last:border-r-0">
                    <span className="px-2 py-0.5 bg-indigo-600 text-white text-sm font-semibold rounded-full">{engineResult.twelve[col]}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 표시 옵션 */}
            <div className="mx-2 mb-3 bg-white rounded-lg border px-3 py-2 flex flex-wrap gap-3">
              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={viewOptions.five} onChange={() => toggleView("five")} className="w-3 h-3" />
                <span className={viewOptions.five ? "text-indigo-600 font-semibold" : "text-gray-400"}>오행 분포</span>
              </label>

              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={viewOptions.hidden} onChange={() => toggleView("hidden")} className="w-3 h-3" />
                <span className={viewOptions.hidden ? "text-indigo-600 font-semibold" : "text-gray-400"}>지장간·신살</span>
              </label>

              <label className="flex items-center gap-1 text-xs">
                <input type="checkbox" checked={viewOptions.relations} onChange={() => toggleView("relations")} className="w-3 h-3" />
                <span className={viewOptions.relations ? "text-indigo-600 font-semibold" : "text-gray-400"}>형·충·파·합</span>
              </label>
            </div>

// PART 3 끝

// 👉 PART 4 시작 (신살 출력 + 이후 모든 렌더링)

            {/* 지장간 */}
            {viewOptions.hidden && hidden && (
              <div className="mx-2 mb-3 bg-white rounded-lg border shadow-sm">
                <div className="flex justify-between px-3 py-2 border-b bg-indigo-50">
                  <span className="font-bold text-sm">지장간</span>
                </div>

                <div className="grid grid-cols-4 text-center py-2 border-b text-xs font-bold text-gray-600">
                  <div>년주</div><div>월주</div><div>일주</div><div>시주</div>
                </div>

                <div className="grid grid-cols-4 text-center py-2 text-sm">
                  {[hidden.year, hidden.month, hidden.day, hidden.hour].map((arr, idx) => (
                    <div key={idx} className="border-r last:border-r-0">
                      {arr.length === 0 ? (
                        <div className="text-gray-400 text-xs">없음</div>
                      ) : (
                        <div className="space-y-0.5 font-bold">{arr.join(" ")}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 신살 */}
            {viewOptions.hidden && mergedSinsal && (
              <div className="mx-2 mb-3 bg-white rounded-lg border shadow-sm">
                <div className="flex justify-between px-3 py-2 border-b bg-indigo-50">
                  <span className="font-bold text-sm">신살</span>
                  <span className="text-[11px] text-gray-500">연·일 기준 병기</span>
                </div>

                <div className="grid grid-cols-4 text-center py-2 border-b text-xs font-bold text-gray-600">
                  <div>년</div><div>월</div><div>일</div><div>시</div>
                </div>

                <div className="grid grid-cols-4 text-center py-2">
                  {["year", "month", "day", "hour"].map((key) => (
                    <div key={key} className="border-r last:border-r-0">
                      {mergedSinsal[key].length > 0 ? (
                        mergedSinsal[key].map((s, idx) => (
                          <div key={idx} className="text-[12px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 mb-1 rounded">
                            {s}
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 text-xs">없음</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 형 충 파 합 */}
            {viewOptions.relations && engineResult.relations && (
              <div className="mx-2 mb-3 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
                <div className="px-3 py-1.5 border-b flex justify-between">
                  <span className="font-bold text-sm">형·충·파·합</span>
                  <span className="text-[11px] text-gray-500">원국 기준</span>
                </div>

                <div className="grid grid-cols-4 text-center py-1 text-xs font-bold text-gray-700">
                  <div>형</div><div>충</div><div>파</div><div>합</div>
                </div>

                <div className="grid grid-cols-4 text-center pb-2 text-[11px]">
                  {["hyung", "chung", "pa", "hap"].map((k) => (
                    <div key={k} className="border-l first:border-l-0 border-yellow-200 px-2">
                      {engineResult.relations[k]?.length > 0 ? (
                        engineResult.relations[k].map((r, i) => (
                          <div key={i} className="py-0.5">
                            <span className="bg-white px-1.5 py-0.5 rounded border border-yellow-300">{formatR(r)}</span>
                          </div>
                        ))
                      ) : (
                        <div className="text-gray-400 py-1">-</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* (이하 대운/세운/월운 부분은 기존 그대로) */}

          </main>
        )}

      </div>
    </div>
  );
}

// PART 4 끝
