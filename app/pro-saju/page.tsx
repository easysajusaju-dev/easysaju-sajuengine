"use client";

import React, { useState, useEffect } from "react";
// ================================
// KEEP ALIVE (만세력 + 프록시 서버)
// ================================
function keepAlive() {
  const targets = [
    "https://my-manseryeok.onrender.com/ping",
    "https://saju-proxy.onrender.com/ping"
  ];

  targets.forEach((url) => {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 2000);

      fetch(url, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      }).catch(() => {});
    } catch (e) {}
  });
}

// 페이지 로드 직후 1회 호출
if (typeof window !== "undefined") {
  keepAlive();

  // 15초마다 서버 깨우기 (사용자 입력 중 warm 유지)
  setInterval(() => {
    keepAlive();
  }, 15000);
}

// ==========================================
// Types
// ==========================================
type Gender = "M" | "F";

interface ManseryeokDebug {
  input: {
    year: number; month: number; day: number; hour: number; minute: number;
    isLunar: boolean; leap: boolean; isMale: boolean; pivotMin: number;
  };
  timeCalc: { originalBirth: string; birthAdjusted: string; };
  seasonCalc: { rawTermName: string; rawTermDate: string; };
  finalResult: {
    yearGanji: string; monthGanji: string; dayGanji: string; hourGanji: string;
    yearGod: string; monthGod: string; dayGod: string; hourGod: string;
    daeNum: number; daeDir: string;
    daeWoon: string[]; daeWoonGanji: string[]; daeWoonYear: number[];
    seunYear?: number[]; seunGanji?: string[];
    solarText: string; lunarText: string; termName: string;
  };
}

interface EngineResponse {
  ok: boolean;
  result?: {
    ganji: { year: string; month: string; day: string; hour: string; };
    sibsung: any; branchSibsung: any; twelve: any;
    daewoon: { direction: "forward" | "reverse"; startAge: number; };
    relations?: { hyung: any[]; chung: any[]; pa: any[]; hap: any[]; };
  };
  error?: string;
}


// ==========================================
// Data & Utilities
// ==========================================

// 지지 정규화
function normalizeBranch(b: string): string {
  const map: Record<string, string> = {
    자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
    오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
  };
  return map[b] || b;
}

// 지장간
const JIJANGGAN: Record<string, string[]> = {
  子: ["壬", "癸"],
  丑: ["癸", "辛", "己"],
  寅: ["戊", "丙", "甲"],
  卯: ["甲", "乙"],
  辰: ["乙", "癸", "戊"],
  巳: ["戊", "庚", "丙"],
  午: ["丙", "己", "丁"],
  未: ["丁", "乙", "己"],
  申: ["戊", "壬", "庚"],
  酉: ["庚", "辛"],
  戌: ["辛", "丁", "戊"],
  亥: ["戊", "甲", "壬"],
};

// 납음
const NABEUM: Record<string, string> = {
  甲子: "해중금", 乙丑: "해중금", 丙寅: "노중화", 丁卯: "노중화",
  戊辰: "대림목", 己巳: "대림목", 庚午: "노방토", 辛未: "노방토",
  壬申: "검봉금", 癸酉: "검봉금", 甲戌: "산두화", 乙亥: "산두화",
  丙子: "간하수", 丁丑: "간하수", 戊寅: "성두토", 己卯: "성두토",
  庚辰: "백랍금", 辛巳: "백랍금", 壬午: "양류목", 癸未: "양류목",
  甲申: "천중수", 乙酉: "천중수", 丙戌: "옥상토", 丁亥: "옥상토",
  戊子: "벽력화", 己丑: "벽력화", 庚寅: "송백목", 辛卯: "송백목",
  壬辰: "장流水", 癸巳: "장流水", 甲午: "사중금", 乙未: "사중금",
  丙申: "산하화", 丁酉: "산하화", 戊戌: "평지목", 己亥: "평지목",
  庚子: "벽상토", 辛丑: "벽상토", 壬寅: "금박금", 癸卯: "금박금",
  甲辰: "복등화", 乙巳: "복등화", 丙午: "천하수", 丁未: "천하수",
  戊申: "대역토", 己酉: "대역토", 庚戌: "차천금", 辛亥: "차천금",
  壬子: "상자목", 癸丑: "상자목", 甲寅: "대계수", 乙卯: "대계수",
  丙辰: "사중토", 丁巳: "사중토", 戊午: "천상화", 己未: "천상화",
  庚申: "석류목", 辛酉: "석류목", 壬戌: "대海水", 癸亥: "대海水",
};
function getNabeum(ganji: string) { return NABEUM[ganji] || ""; }

// 한자 → 한글
function getKoreanChar(h: string) {
  const m: Record<string, string> = {
    甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무", 己: "기",
    庚: "경", 辛: "신", 壬: "임", 癸: "계",
    子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사",
    午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
  };
  return m[h] || h;
}

// 색상
function getFiveElementStyle(char: string) {
  if ("갑을인묘甲乙寅卯".includes(char)) return "bg-green-600 text-white border-black";
  if ("병정사오丙丁巳午".includes(char)) return "bg-red-600 text-white border-black";
  if ("무기진술축미戊己辰戌丑未".includes(char)) return "bg-amber-400 text-black border-black";
  if ("경신신유庚辛申酉".includes(char)) return "bg-white text-black border-black";
  if ("임계해자壬癸亥子".includes(char)) return "bg-slate-800 text-white border-black";
  return "bg-gray-100 text-black border-black";
}

const genderOptions = [
  { value: "M", label: "남자" },
  { value: "F", label: "여자" },
];

// =========================
// 여기까지가 1/3
// =========================
// ==========================================
// MAIN COMPONENT
// ==========================================
export default function ProSajuPage() {

  // --- KEEP ALIVE 실행 (처음 진입 시 Render 부팅 시작) ---
  useEffect(() => {
    keepAlive()
  }, []);

  // Input State
  const [gender, setGender] = useState<Gender>("F");
  const [name, setName] = useState("안미정");
  const [birthdate, setBirthdate] = useState("19780216");
  const [birthtime, setBirthtime] = useState("1230");
  const [isLunar, setIsLunar] = useState(true);
  const [isLeap, setIsLeap] = useState(false);
  const [unknownTime, setUnknownTime] = useState(false);

  // View State
  const [viewMode, setViewMode] = useState<"input" | "result">("input");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResponse["result"] | null>(null);

  function handleReset() {
    setDebugData(null);
    setEngineResult(null);
    setViewMode("input");
    setError(null);
  }

  // ====================
  // 1) 만세력 서버 호출
  // ====================
  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const year = Number(birthdate.slice(0, 4));
      const month = Number(birthdate.slice(4, 6));
      const day = Number(birthdate.slice(6, 8));
      const hour = unknownTime ? 0 : Number(birthtime.slice(0, 2));
      const min = unknownTime ? 0 : Number(birthtime.slice(2, 4));

      const qs = new URLSearchParams({
        year: String(year),
        month: String(month),
        day: String(day),
        hour: String(hour),
        min: String(min),
        isLunar: String(isLunar),
        leap: String(isLeap),
        isMale: gender === "M" ? "true" : "false",
        pivotMin: "30",
        tzAdjust: "-30",
        seasonAdjust: "0",
      });

      const debugRes = await fetch(
        `https://my-manseryeok.onrender.com/saju/debug?${qs.toString()}`,
        { cache: "no-store" }
      );

      if (!debugRes.ok) throw new Error("만세력 서버 오류 (Render Free 딜레이)");

      const debugJson: ManseryeokDebug = await debugRes.json();
      setDebugData(debugJson);

      // =========================
      // 2) 사주 엔진 API 호출
      // =========================

      const final = debugJson.finalResult;

      const birthIso = debugJson.timeCalc.birthAdjusted
        ? `${debugJson.timeCalc.birthAdjusted}:00+09:00`
        : `${debugJson.timeCalc.originalBirth}:00+09:00`;

      const payload = {
        yearStem: final.yearGanji[0], yearBranch: final.yearGanji[1],
        monthStem: final.monthGanji[0], monthBranch: final.monthGanji[1],
        dayStem: final.dayGanji[0], dayBranch: final.dayGanji[1],
        hourStem: final.hourGanji[0], hourBranch: final.hourGanji[1],
        gender,
        birth: birthIso,
        solarTerms: [
          {
            name: debugJson.seasonCalc.rawTermName || final.termName,
            date: `${debugJson.seasonCalc.rawTermDate}:00+09:00`,
            isPrincipal: true,
          }
        ]
      };

      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!engineRes.ok) throw new Error("사주 엔진 오류");

      const engineJson = await engineRes.json();
      if (!engineJson.ok) throw new Error(engineJson.error);

      setEngineResult(engineJson.result);
      setViewMode("result");

    } catch (err: any) {
      setError(err.message || "오류 발생");
    } finally {
      setLoading(false);
    }
  }

  // ================
  // Column Data Logic
  // ================
  const getColumnData = (col: "hour" | "day" | "month" | "year") => {
    if (!engineResult || !debugData) return null;

    const ganji = engineResult.ganji[col];
    const stem = ganji[0];
    const branch = ganji[1];

    const normBranch = normalizeBranch(branch);
    const jijangganChars = JIJANGGAN[normBranch] || [];

    const rels = engineResult.relations;
    const myRelations: string[] = [];

    if (rels) {
      ["hyung", "chung", "pa", "hap"].forEach((type) => {
        (rels[type as keyof typeof rels] as any[]).forEach((r) => {
          if (r.from === col || r.to === col) {
            if (!myRelations.includes(r.kind)) myRelations.push(r.kind);
          }
        });
      });
    }

    return {
      ganji,
      ganjiKor: `${getKoreanChar(stem)}${getKoreanChar(branch)}`,
      stem,
      branch,
      stemSibsung: col === "day" ? "일간(나)" : engineResult.sibsung[col],
      branchSibsung: engineResult.branchSibsung[col],
      twelve: engineResult.twelve[col],
      relations: myRelations.join(",") || "-",
      jijangganChars,
      nabeum: getNabeum(ganji),
    };
  };
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl min-h-screen flex flex-col relative">

        {/* HEADER */}
        <header className="bg-[#3F51B5] text-white shadow-md z-20">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-lg font-medium">만세력 천을귀인 V4.16</h1>
            <div className="flex gap-4 text-xl"><span>👁️</span><span>⋮</span></div>
          </div>

          <div className="flex text-sm font-medium text-center">
            <div
              onClick={handleReset}
              className={`flex-1 py-3 cursor-pointer ${
                viewMode === "input"
                  ? "border-b-2 border-pink-400 text-white"
                  : "text-indigo-200"
              }`}
            >
              새로 입력
            </div>
            <div className="flex-1 py-3 cursor-pointer text-indigo-200">저장 목록</div>
            <div className="flex-1 py-3 cursor-pointer text-indigo-200">도움 말</div>
          </div>
        </header>

        {/* ------------------------------ */}
        {/* INPUT VIEW                    */}
        {/* ------------------------------ */}

        {viewMode === "input" && (
          <div className="flex-1 flex flex-col bg-white pb-20">

            {/* 상단 안내 */}
            <div className="bg-pink-500 text-white px-4 py-3 flex flex-col items-center text-center shadow-inner">
              <div className="font-bold text-sm text-yellow-300 mb-1">만세력PRO (PC겸용)</div>
              <div className="text-xs leading-tight">
                용어설명, 용신분석, 사주관리/메모<br />
                <span className="text-yellow-200 font-bold">인공지능 사주풀이</span> 사주·대운·일운까지 A.I 자동풀이
              </div>
            </div>

            {/* 옵션 */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="text-blue-500">👁️</span> 만세력 화면보기 설정(맨위)
              </div>
              <button className="bg-gray-500 text-white text-xs px-3 py-1.5 rounded shadow">
                ▦ 일진달력
              </button>
            </div>

            {/* 입력 폼 */}
            <div className="px-8 py-6 space-y-8 mt-2">

              {/* 성별 */}
              <div className="flex items-center">
                <span className="w-24 text-gray-800 text-base font-medium text-right pr-4">성별 :</span>
                <div className="flex items-center gap-6">
                  {genderOptions.map((g) => (
                    <label key={g.value} className="flex items-center gap-2 cursor-pointer">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          gender === g.value
                            ? g.value === "M"
                              ? "border-blue-500"
                              : "border-pink-500"
                            : "border-gray-400"
                        }`}
                      >
                        {gender === g.value && (
                          <div
                            className={`w-2.5 h-2.5 rounded-full ${
                              g.value === "M" ? "bg-blue-500" : "bg-pink-500"
                            }`}
                          />
                        )}
                      </div>
                      <span className="text-gray-700 text-base">{g.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 이름 */}
              <div className="flex items-center">
                <span className="w-24 text-gray-800 text-base font-medium text-right pr-4">이름 :</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 border-b-2 border-gray-300 focus:border-pink-500 outline-none py-1 text-lg"
                />
              </div>

              {/* 생년월일 */}
              <div className="flex items-center">
                <span className="w-24 text-gray-800 text-base font-medium text-right pr-4">
                  생년월일 :
                </span>
                <div className="flex flex-1 items-center gap-3">
                  <input
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value.replace(/\D/g, ""))}
                    className="w-32 border-b-2 border-gray-300 focus:border-pink-500 outline-none py-1 text-lg tracking-wide"
                    placeholder="19780216"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLunar}
                      onChange={(e) => setIsLunar(e.target.checked)}
                      className="w-5 h-5 accent-pink-500"
                    />
                    <span className="text-gray-700 text-sm">음력</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isLeap}
                      onChange={(e) => setIsLeap(e.target.checked)}
                      className="w-5 h-5 accent-pink-500"
                    />
                    <span className="text-gray-700 text-sm">윤달</span>
                  </label>
                </div>
              </div>

              {/* 출생시간 */}
              <div className="flex items-center">
                <span className="w-24 text-gray-800 text-base font-medium text-right pr-4">
                  출생시간 :
                </span>
                <div className="flex flex-1 items-center gap-6">
                  <input
                    value={birthtime}
                    disabled={unknownTime}
                    onChange={(e) =>
                      setBirthtime(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-24 border-b-2 border-gray-300 focus:border-pink-500 outline-none py-1 text-lg tracking-wide disabled:text-gray-300"
                    placeholder="1230"
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={unknownTime}
                      onChange={(e) => setUnknownTime(e.target.checked)}
                      className="w-5 h-5 accent-pink-500"
                    />
                    <span className="text-gray-700 text-sm">모름</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="fixed bottom-0 w-full max-w-md grid grid-cols-3 h-14 text-white font-bold text-lg shadow-lg z-30">
              <button onClick={handleReset} className="bg-[#FFB74D]">
                새로고침
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-[#4FC3F7]"
              >
                {loading ? "분석중…" : "사주조회"}
              </button>
              <button className="bg-[#81C784]">저장하기</button>
            </div>
          </div>
        )}

        {/* ------------------------------ */}
        {/* RESULT VIEW                   */}
        {/* ------------------------------ */}

        {viewMode === "result" && engineResult && debugData && (
          <main className="flex-1 overflow-y-auto bg-white pb-20">

            {/* ------------------ */}
            {/* 사용자 요약 정보  */}
            {/* ------------------ */}

            <div className="bg-[#3F51B5] text-white px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl">
                  👤
                </div>
                <div>
                  <div className="font-bold text-lg">
                    {name}(
                    {new Date().getFullYear() -
                      parseInt(birthdate.slice(0, 4)) +
                      1}
                    세)
                    <span className="text-sm font-normal opacity-90 ml-1">
                      (양) {debugData.finalResult.solarText.slice(0, 10)},{" "}
                      {birthtime.slice(0, 2)}시 {birthtime.slice(2, 4)}분(-30)
                    </span>
                  </div>

                  <div className="text-xs opacity-80 mt-0.5">
                    (음) {debugData.finalResult.lunarText}
                  </div>
                </div>
              </div>
            </div>

            {/* ======================= */}
            {/* 사주 원국 테이블 (FULL) */}
            {/* ======================= */}

            <section className="border-b-2 border-gray-300">
              {/* Header */}
              <div className="grid grid-cols-4 text-center bg-gray-300 text-gray-800 text-sm font-bold border-b border-gray-400">
                {["hour", "day", "month", "year"].map((col) => (
                  <div key={col} className="py-1 border-r border-gray-400 last:border-r-0">
                    {col === "hour" ? "시주" : col === "day" ? "일주" : col === "month" ? "월주" : "년주"}
                    <div className="font-normal text-xs">
                      ({getColumnData(col as any)?.ganjiKor})
                    </div>
                  </div>
                ))}
              </div>

              {/* TOP RELATIONS */}
              <div className="grid grid-cols-4 text-center text-xs font-bold h-6 items-center bg-[#FFF9C4] border-b border-gray-400 text-red-600">
                {["hour", "day", "month", "year"].map((col) => (
                  <div key={col} className="border-r border-gray-400 last:border-none">
                    {getColumnData(col as any)?.relations !== "-"
                      ? getColumnData(col as any)?.relations
                      : ""}
                  </div>
                ))}
              </div>

              {/* Stem Sibsung */}
              <div className="grid grid-cols-4 text-center text-base font-medium py-0.5 border-b border-gray-200 text-black">

                {["hour", "day", "month", "year"].map((col) => (
                  <div
                    key={col}
                    className={`border-r border-gray-200 last:border-none ${
                      col === "day" ? "text-blue-600 font-bold" : ""
                    }`}
                  >
                    {getColumnData(col as any)?.stemSibsung}
                  </div>
                ))}
              </div>

              {/* 10간 / 12지지 박스 */}
              <div className="grid grid-cols-4 gap-1 px-1 py-1 border-b border-black">
                {/* 천간 */}
                {["hour", "day", "month", "year"].map((col) => {
                  const d = getColumnData(col as any);
                  return (
                    <div key={`stem-${col}`} className="flex justify-center">
                      <div
                        className={`w-[85px] h-[85px] flex items-center justify-center text-6xl font-serif border-[3px] rounded-sm ${getFiveElementStyle(
                          d?.stem || ""
                        )}`}
                      >
                        {d?.stem}
                      </div>
                    </div>
                  );
                })}

                {/* 지지 */}
                {["hour", "day", "month", "year"].map((col) => {
                  const d = getColumnData(col as any);
                  return (
                    <div key={`branch-${col}`} className="flex justify-center">
                      <div
                        className={`w-[85px] h-[85px] flex items-center justify-center text-6xl font-serif border-[3px] rounded-sm ${getFiveElementStyle(
                          d?.branch || ""
                        )}`}
                      >
                        {d?.branch}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Branch Sibsung */}
              <div className="grid grid-cols-4 text-center text-base font-bold py-1 border-b border-gray-300 text-black">

                {["hour", "day", "month", "year"].map((col) => (
                  <div key={col} className="border-r border-gray-300 last:border-none">
                    {getColumnData(col as any)?.branchSibsung}
                  </div>
                ))}
              </div>

              {/* 지장간 */}
              <div className="grid grid-cols-4 text-center text-sm border-b border-gray-300 bg-white py-1">
                {["hour", "day", "month", "year"].map((col) => {
                  const d = getColumnData(col as any);
                  const chars = d?.jijangganChars || [];
                  return (
                    <div key={col} className="border-r border-gray-300 last:border-none flex flex-col justify-center">
                      {chars.map((char, idx) => {
                        const label =
                          chars.length === 2
                            ? idx === 0
                              ? "여기"
                              : "본기"
                            : idx === 0
                            ? "여기"
                            : idx === 1
                            ? "중기"
                            : "본기";
                        return (
                          <div key={idx} className="flex justify-center items-center gap-1 text-xs">
                            <span className="font-bold text-black text-sm">{char}</span>
                            <span className="text-gray-500">{label}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              {/* 12운성 */}
              <div className="grid grid-cols-4 text-center text-base font-bold py-1 border-b border-gray-300 text-black">

                {["hour", "day", "month", "year"].map((col) => (
                  <div key={col} className="border-r border-gray-300 last:border-none">
                    {getColumnData(col as any)?.twelve}
                    <div className="text-xs text-gray-500">
                      ({getColumnData(col as any)?.twelve})
                    </div>
                  </div>
                ))}
              </div>

              {/* 납음 */}
              <div className="grid grid-cols-4 text-center text-sm py-1 bg-gray-50 border-b border-gray-300">
                {["hour", "day", "month", "year"].map((col) => (
                  <div key={col} className="border-r border-gray-300 last:border-none">
                    {getColumnData(col as any)?.nabeum}
                  </div>
                ))}
              </div>

              {/* 하단 관계 */}
              <div className="grid grid-cols-4 text-center text-xs font-bold h-8 items-center bg-[#FFF9C4] border-t border-gray-400">
                {["hour", "day", "month", "year"].map((col) => (
                  <div key={col} className="border-r border-gray-400 last:border-none flex flex-col justify-center">
                    {getColumnData(col as any)?.relations}
                  </div>
                ))}
              </div>

              {/* 공망/귀인 */}
              <div className="text-center text-sm py-1 bg-white border-t border-black">
                공망: [년]{engineResult.ganji.year} [일]{engineResult.ganji.day},  
                천을귀인: 子申, 월령: 庚
              </div>
            </section>

            {/* ============================ */}
            {/* 대운 */}
            {/* ============================ */}
            <section className="mt-2 border-t-4 border-gray-300">
              <div className="bg-white text-center py-1.5 font-bold text-base border-b border-gray-400">
               전통나이 (대운수:{engineResult.daewoon.startAge},{" "}
  {engineResult.daewoon.direction === "forward" ? "순행" : "역행"})

              </div>

              <div className="overflow-x-auto">
                <div className="min-w-[350px]">

                  {/* 나이 라인 */}
                  <div className="grid grid-cols-10 bg-white border-b border-gray-300 text-sm text-center font-medium">
                    {debugData.finalResult.daeWoonYear.map((y, i) => (
                      <div key={i} className="py-1 border-r border-gray-300 last:border-none">
                        {(i + 1) * 10 - (10 - debugData.finalResult.daeNum)}
                      </div>
                    ))}
                  </div>

                  {/* 대운 간지 */}
                  <div className="grid grid-cols-10 bg-white border-b border-black">
                    {debugData.finalResult.daeWoonGanji.map((ganji, i) => (
                      <div
                        key={i}
                        className="flex flex-col items-center py-1 border-r border-gray-300 last:border-none"
                      >
                        <div
                          className={`w-8 h-8 mb-0.5 flex items-center justify-center text-lg font-bold border ${getFiveElementStyle(
                            ganji[0]
                          )}`}
                        >
                          {ganji[0]}
                        </div>
                        <div
                          className={`w-8 h-8 flex items-center justify-center text-lg font-bold border ${getFiveElementStyle(
                            ganji[1]
                          )}`}
                        >
                          {ganji[1]}
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </section>

            {/* ============================ */}
            {/* 세운 */}
            {/* ============================ */}
            {debugData.finalResult.seunYear && (
              <section className="mt-1 border-t-4 border-gray-300">
                <div className="bg-white text-center py-1.5 font-bold text-base border-b border-gray-400">
                  세운 (년운)
                </div>

                <div className="grid grid-cols-5 sm:grid-cols-10 border-b border-gray-300">
                  {debugData.finalResult.seunYear.slice(0, 10).map((year, idx) => {
                    const ganji = debugData.finalResult.seunGanji?.[idx] || "--";
                    const isThisYear = year === new Date().getFullYear();

                    return (
                      <div
                        key={year}
                        className={`flex flex-col items-center py-2 border-r border-gray-300 ${
                          isThisYear
                            ? "bg-blue-50 ring-2 ring-blue-600"
                            : "bg-white"
                        }`}
                      >
                        <span
                          className={`text-sm mb-1 font-bold ${
                            isThisYear ? "text-blue-600" : "text-black"
                          }`}
                        >
                          {year}
                        </span>

                        <div
                          className={`w-8 h-8 mb-1 flex items-center justify-center font-bold border ${getFiveElementStyle(
                            ganji[0]
                          )}`}
                        >
                          {ganji[0]}
                        </div>

                        <div
                          className={`w-8 h-8 flex items-center justify-center font-bold border ${getFiveElementStyle(
                            ganji[1]
                          )}`}
                        >
                          {ganji[1]}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* 하단 버튼 */}
            <div className="fixed bottom-0 w-full max-w-md grid grid-cols-3 h-14 text-white font-bold text-lg shadow-lg z-30">
              <button onClick={handleReset} className="bg-[#FFB74D]">
                새로고침
              </button>
              <button onClick={handleReset} className="bg-[#4FC3F7]">
                다시조회
              </button>
              <button className="bg-[#81C784]">저장하기</button>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}
