"use client";

import React, { useState, useEffect, useRef } from "react";
import EasySajuInputCard from "./components/EasySajuInputCard";

// ================= 기본 타입 =================
type Gender = "M" | "F";

interface EngineResponse {
  ok: boolean;
  result?: any;
  error?: string;
}

interface ManseryeokDebug {
  input: any;
  timeCalc: any;
  seasonCalc: any;
  finalResult: any;
}

// ================== 공통 함수 ==================
const CHEONGAN = "갑을병정무기경신임계";
const JIJI = "자축인묘진사오미신유술해";

const HANJA_GAN_MAP: any = {
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

const HANJA_JI_MAP: any = {
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

function toHanja(ganji: string) {
  const [g, j] = ganji.split("");
  return (HANJA_GAN_MAP[g] || g) + (HANJA_JI_MAP[j] || j);
}

function getGanjiByYear(year: number) {
  const base = 1984; // 갑자 기준
  const index = ((year - base) % 60 + 60) % 60;
  return CHEONGAN[index % 10] + JIJI[index % 12];
}

function getOhaengStyles(ch: string) {
  if ("갑을인묘甲乙寅卯".includes(ch)) return { bg: "bg-green-400", border: "border-green-700" };
  if ("병정사오丙丁巳午".includes(ch)) return { bg: "bg-red-400", border: "border-red-700" };
  if ("무기진술축미戊己辰戌丑未".includes(ch)) return { bg: "bg-yellow-300", border: "border-yellow-600" };
  if ("경신신유庚辛申酉".includes(ch)) return { bg: "bg-slate-200", border: "border-slate-400" };
  if ("임계해자壬癸亥子".includes(ch)) return { bg: "bg-teal-400", border: "border-teal-600" };
  return { bg: "bg-gray-200", border: "border-gray-300" };
}

// ==================================================
//  🌟 메인 페이지 — 전체 완성본
// ==================================================
export default function ProSajuPage() {
  const [isFormOpen, setIsFormOpen] = useState(true);

  // 입력값
  const [input, setInput] = useState<any>(null);

  // 결과값
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);
  const [engineResult, setEngineResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  // UI
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const seunContainerRef = useRef<HTMLDivElement>(null);

  // =============== 입력 폼에서 전달받기 ===============
  const handleFormSubmit = async (formData: any) => {
    setInput(formData);
    await handleSubmit(formData);
  };

  // =============== 백엔드 호출 ===============
  const handleSubmit = async (form: any) => {
    try {
      setLoading(true);
      setError(null);

      const { birthdate, birthtime, unknownTime, name, gender, isLunar, isLeap } = form;

      if (!birthdate || birthdate.length !== 8) throw new Error("생년월일 8자리를 입력해주세요.");

      const year = Number(birthdate.slice(0, 4));
      const month = Number(birthdate.slice(4, 6));
      const day = Number(birthdate.slice(6, 8));

      let hour = 0;
      let minute = 0;

      if (!unknownTime) {
        if (birthtime.length !== 4) throw new Error("출생시간 4자리를 입력해주세요.");
        hour = Number(birthtime.slice(0, 2));
        minute = Number(birthtime.slice(2, 4));
      }

      // 🔹 Render 만세력 서버 호출
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
      });

      const debugRes = await fetch(
        `https://my-manseryeok.onrender.com/saju/debug?${qs}`
      );
      if (!debugRes.ok) throw new Error("서버 연결 실패");

      const debugJson = await debugRes.json();
      setDebugData(debugJson);

      // 🔹 프론트 사주엔진 호출
      const final = debugJson.finalResult;
      const birthIso = `${debugJson.timeCalc.birthAdjusted || debugJson.timeCalc.originalBirth}:00+09:00`;

      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearStem: final.yearGanji[0],
          yearBranch: final.yearGanji[1],
          monthStem: final.monthGanji[0],
          monthBranch: final.monthGanji[1],
          dayStem: final.dayGanji[0],
          dayBranch: final.dayGanji[1],
          hourStem: final.hourGanji[0],
          hourBranch: final.hourGanji[1],
          gender,
          birth: birthIso,
          solarTerms: [
            {
              name: final.termName,
              date: `${debugJson.seasonCalc.rawTermDate}:00+09:00`,
              isPrincipal: true,
            },
          ],
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
  };

  // ================== 세운 자동 스크롤 ==================
  useEffect(() => {
    if (engineResult && seunContainerRef.current) {
      setTimeout(() => {
        const element = document.getElementById(`year-${selectedYear}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", inline: "center" });
        }
      }, 300);
    }
  }, [engineResult, selectedYear]);

  const hasResult = !!(debugData && engineResult);

  // ==================================================
  //  JSX 렌더링
  // ==================================================
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-gray-900 select-none">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen md:rounded-xl overflow-hidden">

        {/* 헤더 */}
        <header className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center shadow sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <img
              src="https://easysajusaju-dev.github.io/logo_remove_white.png"
              className="h-7 w-auto"
            />
            <span className="font-bold text-lg">만세력 Pro</span>
          </div>

          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="text-xs bg-white/20 px-3 py-1 rounded"
          >
            {isFormOpen ? "닫기" : "입력 열기"}
          </button>
        </header>

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-2 text-sm border-b border-red-200">
            {error}
          </div>
        )}

        {/* 입력폼 */}
        {isFormOpen && (
          <EasySajuInputCard
            onSubmit={handleFormSubmit}
            loading={loading}
          />
        )}

        {/* 결과 */}
        {hasResult && !isFormOpen && (
          <main className="pb-28 px-2">

            {/* 요약 */}
            <div className="bg-white p-4 mt-2 shadow rounded-lg border">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{input.name}</span>
                <span className="text-sm text-gray-500">
                  {input.gender === "M" ? "남" : "여"}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                (양) {debugData!.finalResult.solarText} / (음) {debugData!.finalResult.lunarText}
              </div>
            </div>

            {/* ==================== 원국 ==================== */}
            <div className="bg-white mt-3 border shadow-sm rounded-lg overflow-hidden">
              <div className="grid grid-cols-4 text-center font-bold py-2 bg-gray-50 border-b">
                <div>시주</div><div>일주</div><div>월주</div><div>년주</div>
              </div>

              {/* 천간 */}
              <div className="grid grid-cols-4 border-b">
                {["hour","day","month","year"].map((col) => {
                  const stem = engineResult.ganji[col][0];
                  const style = getOhaengStyles(stem);

                  return (
                    <div key={col} className="flex flex-col items-center py-2">
                      <span className="text-sm text-indigo-700 font-bold">
                        {col==="day" ? "일간(나)" : engineResult.sibsung[col]}
                      </span>
                      <div className={`w-14 h-14 flex items-center justify-center text-3xl font-bold rounded shadow border ${style.bg} ${style.border}`}>
                        {stem}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 지지 */}
              <div className="grid grid-cols-4">
                {["hour","day","month","year"].map((col) => {
                  const branch = engineResult.ganji[col][1];
                  const style = getOhaengStyles(branch);
                  return (
                    <div key={col} className="flex justify-center py-2">
                      <div className={`w-14 h-14 flex items-center justify-center text-3xl font-bold rounded shadow border ${style.bg} ${style.border}`}>
                        {branch}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ==================== 대운 ==================== */}
            <div className="mt-4">
              <div className="bg-blue-600 text-white px-3 py-1 text-sm font-bold rounded-t-lg">
                대운 (대운수: {debugData!.finalResult.daeNum})
              </div>
              <div className="bg-white border rounded-b-lg overflow-x-auto px-2 py-1">
                <div className="flex gap-2">
                  {debugData!.finalResult.daeWoonYear.map((y: number, i: number) => {
                    const age = i * 10 + debugData!.finalResult.daeNum;
                    const ganji = debugData!.finalResult.daeWoonGanji[i];
                    const [gs, gb] = ganji.split("");

                    const gsStyle = getOhaengStyles(gs);
                    const gbStyle = getOhaengStyles(gb);

                    return (
                      <div key={i} className="flex flex-col items-center px-1">
                        <span className="text-xs text-gray-500">{age}</span>
                        <div className={`w-10 h-10 flex items-center justify-center text-xl font-bold rounded border ${gsStyle.bg} ${gsStyle.border}`}>{gs}</div>
                        <div className={`w-10 h-10 flex items-center justify-center text-xl font-bold rounded border ${gbStyle.bg} ${gbStyle.border}`}>{gb}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* ==================== 세운 ==================== */}
            <div className="mt-4">
              <div className="bg-gray-700 text-white px-3 py-1 text-sm font-bold rounded-t-lg">
                세운 (년운)
              </div>
              <div ref={seunContainerRef} className="bg-white border rounded-b-lg overflow-x-auto px-2 py-1">
                <div className="flex gap-2 w-max">
                  {Array.from({ length: 100 }).map((_, i) => {
                    const y = Number(input.birthdate.slice(0,4)) + i;
                    const g = toHanja(getGanjiByYear(y));

                    const style1 = getOhaengStyles(g[0]);
                    const style2 = getOhaengStyles(g[1]);

                    const isSel = y === selectedYear;

                    return (
                      <div
                        key={y}
                        id={`year-${y}`}
                        onClick={() => setSelectedYear(y)}
                        className={`flex flex-col items-center px-1 py-1 rounded cursor-pointer ${
                          isSel ? "bg-gray-200 ring-2 ring-gray-700" : ""
                        }`}
                      >
                        <span className="text-xs text-gray-500 mb-1">{y}</span>
                        <div className={`w-9 h-9 flex items-center justify-center rounded text-xl font-bold border ${style1.bg} ${style1.border}`}>
                          {g[0]}
                        </div>
                        <div className={`w-9 h-9 flex items-center justify-center rounded text-xl font-bold border ${style2.bg} ${style2.border}`}>
                          {g[1]}
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
