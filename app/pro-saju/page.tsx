"use client";

import EasySajuInputCard from "./components/EasySajuInputCard";
import React, { useState, useEffect, useRef } from "react";

// --- 타입 정의 ---
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
    hiddenStems?: {
      year: string[];
      month: string[];
      day: string[];
      hour: string[];
    };
  };
  error?: string;
}

// ---- 갑자/지지 ----
const CHEONGAN = "갑을병정무기경신임계";
const JIJI = "자축인묘진사오미신유술해";
const GANJI_60: string[] = [];

for (let i = 0; i < 60; i++) {
  GANJI_60.push(CHEONGAN[i % 10] + JIJI[i % 12]);
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
    arr.push({
      month: i,
      ganji: CHEONGAN[s % 10] + JIJI[b % 12],
    });
    s++;
    b++;
  }
  return arr;
}

// ---- 오행 ----
function getOhaengStyles(ch: string) {
  if ("갑을인묘甲乙寅卯".includes(ch))
    return { bg: "bg-green-400", border: "border-green-700" };
  if ("병정사오丙丁巳午".includes(ch))
    return { bg: "bg-red-400", border: "border-red-700" };
  if ("무기진술축미戊己辰戌丑未".includes(ch))
    return { bg: "bg-yellow-300", border: "border-yellow-600" };
  if ("경신신유庚辛申酉".includes(ch))
    return { bg: "bg-slate-200", border: "border-slate-400" };
  if ("임계해자壬癸亥子".includes(ch))
    return { bg: "bg-sky-400", border: "border-sky-700" };
  return { bg: "bg-gray-200", border: "border-gray-300" };
}

// --- ❌ 기존 지장간 테이블, getJijanggan 전부 제거함 ---


// ---- 본문 컴포넌트 ----
export default function ProSajuPage() {
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);
  const [engineResult, setEngineResult] =
    useState<EngineResponse["result"] | null>(null);

  const [userName, setUserName] = useState("");
  const seunRef = useRef<HTMLDivElement>(null);
  const COLS = ["year", "month", "day", "hour"] as const;

  const [viewOptions, setViewOptions] = useState({
    five: true,
    hidden: true,
    relations: true,
  });

  const toggleView = (k: keyof typeof viewOptions) =>
    setViewOptions((p) => ({ ...p, [k]: !p[k] }));

  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear()
  );

  // ---- handleSubmit ----
  async function handleSubmit(formData: any) {
    setLoading(true);
    setError(null);

    try {
      const {
        gender,
        name,
        birthdate,
        birthtime,
        isLunar,
        isLeap,
        unknownTime,
      } = formData;

      setUserName(name);

      if (birthdate.length !== 8)
        throw new Error("생년월일 8자리 입력");

      const Y = Number(birthdate.slice(0, 4));
      const M = Number(birthdate.slice(4, 6));
      const D = Number(birthdate.slice(6, 8));

      let hh = 0,
        mm = 0;

      if (!unknownTime) {
        if (birthtime.length !== 4)
          throw new Error("출생시간 4자리 입력");
        hh = Number(birthtime.slice(0, 2));
        mm = Number(birthtime.slice(2, 4));
      }

      const qs = new URLSearchParams({
        year: String(Y),
        month: String(M),
        day: String(D),
        hour: String(hh),
        min: String(mm),
        isLunar: String(isLunar),
        leap: String(isLeap),
        isMale: gender === "M" ? "true" : "false",
        pivotMin: "30",
        tzAdjust: "-30",
        seasonAdjust: "0",
      });

      const debugRes = await fetch(
        `https://my-manseryeok.onrender.com/saju/debug?${qs}`
      );
      const debugJson = await debugRes.json();
      setDebugData(debugJson);

      const f = debugJson.finalResult;
      const birthIso = `${
        debugJson.timeCalc.birthAdjusted ||
        debugJson.timeCalc.originalBirth
      }:00+09:00`;

      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearStem: f.yearGanji[0],
          yearBranch: f.yearGanji[1],
          monthStem: f.monthGanji[0],
          monthBranch: f.monthGanji[1],
          dayStem: f.dayGanji[0],
          dayBranch: f.dayGanji[1],
          hourStem: f.hourGanji[0],
          hourBranch: f.hourGanji[1],
          gender,
          birth: birthIso,
          solarTerms: [
            {
              name: f.termName,
              date: `${debugJson.seasonCalc.rawTermDate}:00+09:00`,
              isPrincipal: true,
            },
          ],
        }),
      });

      const engineJson = await engineRes.json();
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

  // 세운 리스트
  const seunList: { year: number; age: number; ganji: string }[] = [];
  if (hasResult) {
    for (let i = 0; i <= 100; i++) {
      const year = birthYear + i;
      seunList.push({
        year,
        age: i + 1,
        ganji: getGanjiByYear(year),
      });
    }
  }

  const selectedYearGanji = hasResult ? getGanjiByYear(selectedYear) : "갑자";
  const wolunList = hasResult
    ? getMonthlyGanjiList(selectedYearGanji[0])
    : [];

  // 오행 분포
  const five =
    hasResult && engineResult
      ? (() => {
          const str = Object.values(engineResult.ganji).join("");
          return {
            목: [...str].filter((c) => "갑을인묘甲乙寅卯".includes(c)).length,
            화: [...str].filter((c) => "병정사오丙丁巳午".includes(c)).length,
            토: [...str].filter((c) => "무기진술축미戊己辰戌丑未".includes(c)).length,
            금: [...str].filter((c) => "경신신유庚辛申酉".includes(c)).length,
            수: [...str].filter((c) => "임계해자壬癸亥子".includes(c)).length,
          };
        })()
      : null;

  // --- 🔥 핵심 수정: 지장간은 서버 값 그대로 사용 ---
  const hidden = engineResult?.hiddenStems ?? null;

  const sinsal =
    hasResult && engineResult && engineResult.sinsal
      ? engineResult.sinsal
      : null;

  const formatR = (r: RelationItem) =>
    `${{ year: "년", month: "월", day: "일", hour: "시" }[r.from]}-${{
      year: "년",
      month: "월",
      day: "일",
      hour: "시",
    }[r.to]} (${r.branches})`;

  // 세운 자동 스크롤
  useEffect(() => {
    if (engineResult && seunRef.current) {
      setTimeout(() => {
        const target = document.getElementById(`year-${selectedYear}`);
        if (target) {
          target.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      }, 300);
    }
  }, [engineResult, selectedYear]);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center text-gray-900 select-none font-sans">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen md:min-h-0 md:h-auto md:my-5 md:rounded-xl overflow-hidden">

        {/* 지장간 */}
        {viewOptions.hidden && hidden && (
          <div className="mx-2 mb-3 bg-white rounded-lg border shadow-sm">

            <div className="flex justify-between px-3 py-2 border-b bg-indigo-50">
              <span className="font-bold text-sm">지장간</span>
            </div>

            <div className="grid grid-cols-4 text-center py-2 border-b text-xs font-bold text-gray-600">
              <div>년주</div>
              <div>월주</div>
              <div>일주</div>
              <div>시주</div>
            </div>

            <div className="grid grid-cols-4 text-center py-2 text-sm">
              {[hidden.year, hidden.month, hidden.day, hidden.hour].map((arr, idx) => (
                <div
                  key={idx}
                  className="border-r last:border-r-0 flex flex-col items-center"
                >
                  {arr.length === 0 ? (
                    <div className="text-gray-400 text-xs">없음</div>
                  ) : (
                    <div className="font-bold flex flex-col items-center space-y-0.5 leading-tight">
                      {arr.map((h, i) => (
                        <div key={i} className="block">
                          {h}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

            {/* 신살 */}
            {viewOptions.hidden && sinsal && (
              <div className="mx-2 mb-3 bg-white rounded-lg border shadow-sm">
                <div className="flex justify-between px-3 py-2 border-b bg-indigo-50">
                  <span className="font-bold text-sm">신살</span>
                  <span className="text-[11px] text-gray-500">원국 기준</span>
                </div>

                <div className="grid grid-cols-4 text-center py-2 border-b text-xs font-bold text-gray-600">
                  <div>년</div>
                  <div>월</div>
                  <div>일</div>
                  <div>시</div>
                </div>

                <div className="grid grid-cols-4 text-center py-2">
                  {["year", "month", "day", "hour"].map((key) => (
                    <div key={key} className="border-r last:border-r-0">
                      {sinsal[key] && sinsal[key].length > 0 ? (
                        sinsal[key].map((s: string, idx: number) => (
                          <div
                            key={idx}
                            className="text-[12px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 mb-1 rounded"
                          >
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

            {/* 형충파합 */}
            {viewOptions.relations && engineResult.relations && (
              <div className="mx-2 mb-3 bg-yellow-50 rounded-lg border border-yellow-200 shadow-sm">
                <div className="px-3 py-1.5 border-b flex justify-between">
                  <span className="font-bold text-sm">형·충·파·합</span>
                  <span className="text-[11px] text-gray-500">원국 기준</span>
                </div>

                <div className="grid grid-cols-4 text-center py-1 text-xs font-bold text-gray-700">
                  <div>형</div>
                  <div>충</div>
                  <div>파</div>
                  <div>합</div>
                </div>

                <div className="grid grid-cols-4 text-center pb-2 text-[11px]">
                  {["hyung", "chung", "pa", "hap"].map((k) => (
                    <div
                      key={k}
                      className="border-l first:border-l-0 border-yellow-200 px-2"
                    >
                      {(engineResult.relations as any)[k]?.length > 0 ? (
                        (engineResult.relations as any)[k].map(
                          (r: RelationItem, i: number) => (
                            <div key={i} className="py-0.5">
                              <span className="bg-white px-1.5 py-0.5 rounded border border-yellow-300">
                                {formatR(r)}
                              </span>
                            </div>
                          )
                        )
                      ) : (
                        <div className="text-gray-400 py-1">-</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 대운 */}
            <div className="mx-2 mb-3">
              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-t-lg flex justify-between">
                <span>대운 (대운수: {debugData.finalResult.daeNum})</span>
                <span>
                  {engineResult.daewoon.direction === "forward"
                    ? "순행"
                    : "역행"}
                </span>
              </div>

              <div className="bg-white border border-gray-200 rounded-b-lg px-2 py-1 overflow-x-auto">
                <div className="flex gap-1 min-w-[360px]">
                  {debugData.finalResult.daeWoonYear.map(
                    (startYear: number, i: number) => {
                      const age = debugData.finalResult.daeNum + i * 10;
                      const isCur =
                        koreanAge >= age && koreanAge < age + 10;

                      const [s, b] =
                        debugData.finalResult.daeWoonGanji[i].split("");

                      const sS = getOhaengStyles(s);
                      const bS = getOhaengStyles(b);

                      return (
                        <div
                          key={i}
                          className={`flex flex-col items-center px-1 py-0.5 rounded-lg ${
                            isCur
                              ? "ring-2 ring-blue-500 bg-blue-50 scale-105 shadow-md"
                              : "hover:bg-gray-50"
                          }`}
                        >
                          <span
                            className={`text-[12px] font-bold mb-1 ${
                              isCur ? "text-blue-700" : "text-gray-400"
                            }`}
                          >
                            {age}
                          </span>

                          <div
                            className={`w-10 h-10 flex items-center justify-center text-xl border rounded ${sS.bg} ${sS.border}`}
                          >
                            {s}
                          </div>
                          <div
                            className={`w-10 h-10 flex items-center justify-center text-xl border rounded mt-1 ${bS.bg} ${bS.border}`}
                          >
                            {b}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              </div>
            </div>

            {/* 세운 */}
            <div className="mx-2 mb-3">
              <div className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-t-lg">
                세운 (년운) - {selectedYear}년
              </div>

              <div
                ref={seunRef}
                className="bg-white border border-gray-200 rounded-b-lg overflow-x-auto"
              >
                <div className="flex px-2 py-1 w-max">
                  {seunList.map((e) => {
                    const isSel = e.year === selectedYear;
                    const [s, b] = e.ganji.split("");
                    const sS = getOhaengStyles(s);
                    const bS = getOhaengStyles(b);

                    return (
                      <div
                        key={e.year}
                        id={`year-${e.year}`}
                        onClick={() => setSelectedYear(e.year)}
                        className={`flex flex-col items-center px-1 mx-1 py-1 rounded-lg cursor-pointer ${
                          isSel
                            ? "bg-gray-100 ring-2 ring-gray-800 scale-110 shadow-md"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`text-[12px] font-bold mb-1 ${
                            isSel ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {e.year}
                        </span>

                        <div
                          className={`w-10 h-10 flex items-center justify-center text-xl rounded shadow-sm border ${sS.bg} ${sS.border}`}
                        >
                          {s}
                        </div>
                        <div
                          className={`w-10 h-10 flex items-center justify-center text-xl rounded shadow-sm border mt-1 ${bS.bg} ${bS.border}`}
                        >
                          {b}
                        </div>

                        <span className="text-[12px] text-gray-500 mt-1">
                          {e.age}세
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 월운 */}
            <div className="mx-2 mb-10">
              <div className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-t-lg">
                월운 ({selectedYear}년)
              </div>

              <div className="bg-white border border-gray-200 rounded-b-lg overflow-x-auto">
                <div className="flex px-2 py-1 w-max">
                  {wolunList.map((e) => {
                    const [s, b] = e.ganji.split("");
                    const sS = getOhaengStyles(s);
                    const bS = getOhaengStyles(b);

                    return (
                      <div
                        key={e.month}
                        className="flex flex-col items-center mx-2 min-w-[44px]"
                      >
                        <span className="text-[12px] font-bold text-gray-600 mb-1">
                          {e.month}월
                        </span>
                        <div
                          className={`w-9 h-9 flex items-center justify-center text-lg rounded shadow-sm border ${sS.bg} ${sS.border}`}
                        >
                          {s}
                        </div>
                        <div
                          className={`w-9 h-9 flex items-center justify-center text-lg rounded shadow-sm border mt-1 ${bS.bg} ${bS.border}`}
                        >
                          {b}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
