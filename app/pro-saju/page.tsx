"use client";

import React, { useState } from "react";

// ==========================================
// Types
// ==========================================
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
    originalBirth: string;
    birthAdjusted: string;
  };
  seasonCalc: {
    rawTermName: string;
    rawTermDate: string;
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

// ==========================================
// Style Utilities
// ==========================================
function getFiveElementStyle(char: string) {
  if ("갑을인묘甲乙寅卯".includes(char)) return "bg-green-600 text-white border-black";
  if ("병정사오丙丁巳午".includes(char)) return "bg-red-600 text-white border-black";
  if ("무기진술축미戊己辰戌丑未".includes(char)) return "bg-amber-400 text-black border-black";
  if ("경신신유庚辛申酉".includes(char)) return "bg-white text-black border-black";
  if ("임계해자壬癸亥子".includes(char)) return "bg-slate-800 text-white border-black";
  return "bg-gray-100 text-black border-black";
}

function getKoreanChar(hanja: string) {
  const map: Record<string, string> = {
    甲: "갑", 乙: "을", 丙: "병", 丁: "정", 戊: "무", 己: "기", 庚: "경", 辛: "신", 壬: "임", 癸: "계",
    子: "자", 丑: "축", 寅: "인", 卯: "묘", 辰: "진", 巳: "사", 午: "오", 未: "미", 申: "신", 酉: "유", 戌: "술", 亥: "해",
  };
  return map[hanja] || hanja;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: "M", label: "남자" },
  { value: "F", label: "여자" },
];

// ==========================================
// Main Component
// ==========================================
export default function ProSajuPage() {
  // --- Input State ---
  const [gender, setGender] = useState<Gender>("F"); // 기본값 여자(이미지 참고)
  const [name, setName] = useState("안미정");
  const [birthdate, setBirthdate] = useState("19780216");
  const [birthtime, setBirthtime] = useState("1230");
  const [isLunar, setIsLunar] = useState(true); // 이미지상 음력 체크됨
  const [isLeap, setIsLeap] = useState(false);
  const [unknownTime, setUnknownTime] = useState(false);

  // --- View State ---
  const [viewMode, setViewMode] = useState<"input" | "result">("input");

  // --- Result State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResponse["result"] | null>(null);

  // --- Logic ---
  function parseBirth() {
    if (birthdate.length !== 8) throw new Error("생년월일은 8자리(예: 19780216)로 입력해주세요.");
    const year = Number(birthdate.slice(0, 4));
    const month = Number(birthdate.slice(4, 6));
    const day = Number(birthdate.slice(6, 8));
    let hour = 0;
    let minute = 0;
    if (!unknownTime) {
      if (birthtime.length !== 4) throw new Error("출생시간 4자리 입력 또는 '모름' 체크.");
      hour = Number(birthtime.slice(0, 2));
      minute = Number(birthtime.slice(2, 4));
    }
    if (isNaN(year) || isNaN(month) || isNaN(day)) throw new Error("날짜 형식이 잘못되었습니다.");
    return { year, month, day, hour, minute };
  }

  function handleReset() {
    setDebugData(null);
    setEngineResult(null);
    setViewMode("input");
    setError(null);
    // 입력값 초기화가 필요하면 여기서 수행
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    try {
      const { year, month, day, hour, minute } = parseBirth();
      
      // 1. 만세력 API 호출
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
      
      const debugUrl = `https://my-manseryeok.onrender.com/saju/debug?${qs.toString()}`;
      const res = await fetch(debugUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("만세력 서버 오류");
      const debugJson: ManseryeokDebug = await res.json();
      setDebugData(debugJson);

      // 2. Saju Engine API Payload 준비
      const final = debugJson.finalResult;
      const [yearStem, yearBranch] = final.yearGanji.split("");
      const [monthStem, monthBranch] = final.monthGanji.split("");
      const [dayStem, dayBranch] = final.dayGanji.split("");
      const [hourStem, hourBranch] = final.hourGanji.split("");

      const birthIso = debugJson.timeCalc.birthAdjusted
        ? `${debugJson.timeCalc.birthAdjusted}:00+09:00`
        : `${debugJson.timeCalc.originalBirth}:00+09:00`;

      const solarTermName = debugJson.seasonCalc.rawTermName || final.termName;
      const solarTermDate = `${debugJson.seasonCalc.rawTermDate}:00+09:00`;

      const enginePayload = {
        yearStem, yearBranch,
        monthStem, monthBranch,
        dayStem, dayBranch,
        hourStem, hourBranch,
        gender,
        birth: birthIso,
        solarTerms: [{ name: solarTermName, date: solarTermDate, isPrincipal: true }],
      };

      // 3. Saju Engine API 호출
      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enginePayload),
      });

      if (!engineRes.ok) throw new Error("사주 엔진 오류");
      const engineJson: EngineResponse = await engineRes.json();
      if (!engineJson.ok) throw new Error(engineJson.error || "엔진 오류");

      setEngineResult(engineJson.result || null);
      setViewMode("result"); // 결과 화면으로 전환

    } catch (err: any) {
      setError(err.message);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- Helper: 기둥별 데이터 추출 (결과 화면용) ---
  const getColumnData = (col: "hour" | "day" | "month" | "year") => {
    if (!engineResult || !debugData) return null;
    const ganji = engineResult.ganji[col]; 
    const stem = ganji[0];
    const branch = ganji[1];
    const stemSibsung = col === "day" ? "일간(나)" : engineResult.sibsung[col];
    const branchSibsung = engineResult.branchSibsung[col];
    const twelve = engineResult.twelve[col];
    const rels = engineResult.relations;
    const myRelations: string[] = [];
    if (rels) {
        ["hyung", "chung", "pa", "hap"].forEach((type) => {
            const list = rels[type as keyof typeof rels] as any[];
            list.forEach((r) => {
                if (r.from === col || r.to === col) {
                   if(!myRelations.includes(r.kind)) myRelations.push(r.kind);
                }
            });
        });
    }
    return {
      ganjiKor: `${getKoreanChar(stem)}${getKoreanChar(branch)}`,
      stem,
      branch,
      stemSibsung,
      branchSibsung,
      twelve,
      relations: myRelations.join("·") || "-",
    };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-2xl min-h-screen flex flex-col relative">
        
        {/* ===========================================
            공통 헤더 (천을귀인 스타일)
            =========================================== */}
        <header className="bg-[#3F51B5] text-white shadow-md z-20">
            {/* 상단 타이틀 바 */}
            <div className="flex items-center justify-between px-4 py-3">
                <h1 className="text-lg font-medium">만세력 천을귀인 V4.16</h1>
                <div className="flex gap-4">
                    <span className="cursor-pointer text-xl">👁️</span>
                    <span className="cursor-pointer text-xl">⋮</span>
                </div>
            </div>
            {/* 탭 메뉴 */}
            <div className="flex text-sm font-medium text-center">
                <div 
                  onClick={handleReset}
                  className={`flex-1 py-3 cursor-pointer ${viewMode === 'input' ? 'border-b-2 border-pink-400 text-white' : 'text-indigo-200'}`}
                >
                    새로 입력
                </div>
                <div className="flex-1 py-3 cursor-pointer text-indigo-200">저장 목록</div>
                <div className="flex-1 py-3 cursor-pointer text-indigo-200">도움 말</div>
            </div>
        </header>

        {/* ===========================================
            1. 입력 화면 (Input View)
            =========================================== */}
        {viewMode === "input" && (
            <div className="flex-1 flex flex-col bg-white pb-20">
                {/* 광고 배너 (모양만 흉내) */}
                <div className="bg-pink-500 text-white px-4 py-3 flex flex-col justify-center items-center text-center shadow-inner">
                    <div className="font-bold text-sm text-yellow-300 mb-1">
                        만세력PRO (PC겸용)
                    </div>
                    <div className="text-xs leading-tight">
                        용어설명, 용신분석, 사주관리/메모<br/>
                        <span className="text-yellow-200 font-bold">인공지능 사주풀이</span> 사주, 대운, 일운까지 A.I 풀이
                    </div>
                </div>

                {/* 설정 바 */}
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
                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${gender === g.value ? (g.value === 'M' ? 'border-blue-500' : 'border-pink-500') : 'border-gray-400'}`}>
                                        {gender === g.value && <div className={`w-2.5 h-2.5 rounded-full ${g.value === 'M' ? 'bg-blue-500' : 'bg-pink-500'}`} />}
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
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="flex-1 border-b-2 border-gray-300 focus:border-pink-500 outline-none py-1 text-lg text-gray-900 bg-transparent transition-colors"
                        />
                    </div>

                    {/* 생년월일 */}
                    <div className="flex items-center">
                        <span className="w-24 text-gray-800 text-base font-medium text-right pr-4">생년월일 :</span>
                        <div className="flex flex-1 items-center gap-3">
                            <input 
                                type="text" 
                                value={birthdate}
                                onChange={(e) => setBirthdate(e.target.value.replace(/\D/g, ""))}
                                className="w-32 border-b-2 border-gray-300 focus:border-pink-500 outline-none py-1 text-lg text-gray-900 bg-transparent transition-colors tracking-wide"
                                placeholder="19780216"
                            />
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={isLunar} onChange={(e) => setIsLunar(e.target.checked)} className="w-5 h-5 accent-pink-500" />
                                <span className="text-gray-700 text-sm">음력</span>
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={isLeap} onChange={(e) => setIsLeap(e.target.checked)} className="w-5 h-5 accent-pink-500" />
                                <span className="text-gray-700 text-sm">윤달</span>
                            </label>
                        </div>
                    </div>

                    {/* 출생시간 */}
                    <div className="flex items-center">
                        <span className="w-24 text-gray-800 text-base font-medium text-right pr-4">출생시간 :</span>
                        <div className="flex flex-1 items-center gap-6">
                            <input 
                                type="text" 
                                value={birthtime}
                                disabled={unknownTime}
                                onChange={(e) => setBirthtime(e.target.value.replace(/\D/g, ""))}
                                className="w-24 border-b-2 border-gray-300 focus:border-pink-500 outline-none py-1 text-lg text-gray-900 bg-transparent transition-colors tracking-wide disabled:text-gray-300"
                                placeholder="1230"
                            />
                            <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" checked={unknownTime} onChange={(e) => setUnknownTime(e.target.checked)} className="w-5 h-5 border-2 border-gray-400 rounded-sm accent-pink-500" />
                                <span className="text-gray-700 text-sm">모름</span>
                            </label>
                        </div>
                    </div>
                </div>
                
                {/* 하단 3색 버튼 (고정) */}
                <div className="fixed bottom-0 w-full max-w-md grid grid-cols-3 h-14 text-white font-bold text-lg shadow-lg z-30">
                    <button 
                        onClick={handleReset}
                        className="bg-[#FFB74D] hover:bg-orange-400 active:bg-orange-500 flex items-center justify-center"
                    >
                        새로고침
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="bg-[#4FC3F7] hover:bg-sky-400 active:bg-sky-500 flex items-center justify-center"
                    >
                        {loading ? "분석중.." : "사주조회"}
                    </button>
                    <button className="bg-[#81C784] hover:bg-green-400 active:bg-green-500 flex items-center justify-center">
                        저장하기
                    </button>
                </div>
            </div>
        )}

        {/* ===========================================
            2. 결과 화면 (Result View)
            =========================================== */}
        {viewMode === "result" && engineResult && debugData && (
            <main className="flex-1 overflow-y-auto bg-white pb-20">
                
                {/* 상단 정보 바 (파란색) */}
                <div className="bg-[#3F51B5] text-white px-4 py-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                            👤
                        </div>
                        <div>
                            <div className="font-bold text-base">
                                {name}({gender === 'M' ? '남' : '여'}) 
                                <span className="ml-2 font-normal opacity-80 text-sm">
                                    {/* 만나이 계산 로직은 생략, 예시값 */}
                                    {new Date().getFullYear() - parseInt(birthdate.slice(0,4))}세
                                </span>
                            </div>
                            <div className="text-xs opacity-80 mt-0.5 space-y-0.5">
                                <p>(양) {debugData.finalResult.solarText}</p>
                                <p>(음) {debugData.finalResult.lunarText}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 사주 팔자 테이블 */}
                <section className="border-b-2 border-gray-300">
                    <div className="grid grid-cols-4 text-center bg-gray-200 text-gray-700 text-sm font-bold border-b border-gray-300">
                        <div className="py-1 border-r border-gray-300">시주</div>
                        <div className="py-1 border-r border-gray-300">일주</div>
                        <div className="py-1 border-r border-gray-300">월주</div>
                        <div className="py-1">년주</div>
                    </div>

                    <div className="grid grid-cols-4 text-center text-sm bg-gray-100 border-b border-gray-300">
                        {["hour", "day", "month", "year"].map((col) => (
                            <div key={col} className="py-1 border-r border-gray-300 last:border-none font-medium">
                                ({getColumnData(col as any)?.ganjiKor})
                            </div>
                        ))}
                    </div>
                    
                    <div className="grid grid-cols-4 text-center text-xs font-bold h-6 items-center bg-[#FFF9C4] border-b border-gray-300">
                         {["hour", "day", "month", "year"].map((col) => (
                             <div key={col} className="border-r border-gray-300 h-full flex items-center justify-center last:border-none">
                                 {getColumnData(col as any)?.relations !== '-' ? getColumnData(col as any)?.relations : ''}
                             </div>
                         ))}
                    </div>

                    <div className="grid grid-cols-4 text-center text-sm text-gray-800 py-1 border-b border-gray-200 bg-white">
                        {["hour", "day", "month", "year"].map((col) => (
                             <div key={col} className={`border-r border-gray-200 last:border-none ${col==='day' ? 'text-blue-600 font-bold' : ''}`}>
                                {getColumnData(col as any)?.stemSibsung}
                             </div>
                        ))}
                    </div>

                    {/* === 왕따시만한 글자 박스 === */}
                    <div className="grid grid-cols-4 gap-1 px-1 py-2 bg-white">
                         {["hour", "day", "month", "year"].map((col) => {
                             const d = getColumnData(col as any);
                             return (
                                 <div key={`stem-${col}`} className="flex justify-center">
                                     <div className={`w-20 h-20 flex items-center justify-center text-5xl font-serif border-4 shadow-sm rounded-sm ${getFiveElementStyle(d?.stem || '')}`}>
                                         {d?.stem}
                                     </div>
                                 </div>
                             )
                         })}
                         {["hour", "day", "month", "year"].map((col) => {
                             const d = getColumnData(col as any);
                             return (
                                 <div key={`branch-${col}`} className="flex justify-center">
                                     <div className={`w-20 h-20 flex items-center justify-center text-5xl font-serif border-4 shadow-sm rounded-sm ${getFiveElementStyle(d?.branch || '')}`}>
                                         {d?.branch}
                                     </div>
                                 </div>
                             )
                         })}
                    </div>

                    <div className="grid grid-cols-4 text-center text-sm border-t border-gray-300 bg-white">
                        {["hour", "day", "month", "year"].map((col) => (
                            <div key={col} className="py-1 border-r border-gray-300 last:border-none">
                                {getColumnData(col as any)?.branchSibsung}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-4 text-center text-sm py-1 border-t border-gray-200 bg-white">
                        {["hour", "day", "month", "year"].map((col) => (
                            <div key={col} className="border-r border-gray-200 last:border-none flex flex-col justify-center h-8">
                                <span className="font-medium text-gray-800">{getColumnData(col as any)?.twelve}</span>
                            </div>
                        ))}
                    </div>
                    
                    {/* 납음오행 등 추가 정보 (이미지 하단 글자들 흉내) */}
                    <div className="grid grid-cols-4 text-center text-xs py-1 border-t border-gray-200 bg-gray-50">
                         <div className="border-r">노방토</div>
                         <div className="border-r">대역토</div>
                         <div className="border-r">사중토</div>
                         <div>상자목</div>
                    </div>
                </section>

                {/* 대운 */}
                <section className="mt-2 border-t-4 border-gray-200">
                    <div className="bg-gray-100 text-center py-1.5 font-bold text-sm border-b border-gray-300">
                        전통나이 (대운수:{debugData.finalResult.daeNum}, {engineResult.daewoon.direction === 'forward' ? '순행' : '역행'})
                    </div>
                    <div className="overflow-x-auto pb-2">
                        <div className="min-w-[320px]">
                            <div className="grid grid-cols-10 bg-gray-50 border-b border-gray-300 text-xs text-center">
                                {debugData.finalResult.daeWoonYear.map((y, i) => (
                                    <div key={i} className="py-1 border-r border-gray-200 last:border-none">
                                        {(i + 1) * 10 - (10 - debugData.finalResult.daeNum)}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-10 bg-white">
                                {debugData.finalResult.daeWoonGanji.map((ganji, i) => (
                                    <div key={i} className="flex flex-col items-center py-1 border-r border-gray-200 border-b last:border-r-0">
                                        <div className={`w-8 h-8 mb-0.5 flex items-center justify-center text-lg font-bold border ${getFiveElementStyle(ganji[0])}`}>
                                            {ganji[0]}
                                        </div>
                                        <div className={`w-8 h-8 flex items-center justify-center text-lg font-bold border ${getFiveElementStyle(ganji[1])}`}>
                                            {ganji[1]}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 세운 */}
                {debugData.finalResult.seunYear && (
                    <section className="mt-1 border-t-4 border-gray-200">
                         <div className="bg-gray-100 text-center py-1.5 font-bold text-sm border-b border-gray-300">
                             세운 (년운)
                        </div>
                        <div className="grid grid-cols-5 sm:grid-cols-10 border-b border-gray-300">
                            {debugData.finalResult.seunYear.slice(0,10).map((year, idx) => {
                                const ganji = debugData.finalResult.seunGanji?.[idx] || "??";
                                const isThisYear = year === new Date().getFullYear();
                                return (
                                    <div key={year} className={`flex flex-col items-center py-2 border-r border-gray-200 ${isThisYear ? 'bg-blue-50 ring-2 ring-blue-500 inset-0 z-10' : 'bg-white'}`}>
                                        <span className={`text-xs mb-1 ${isThisYear ? 'font-bold text-blue-600' : 'text-gray-500'}`}>{year}</span>
                                        <div className={`w-8 h-8 mb-1 flex items-center justify-center font-bold border ${getFiveElementStyle(ganji[0])}`}>
                                            {ganji[0]}
                                        </div>
                                        <div className={`w-8 h-8 flex items-center justify-center font-bold border ${getFiveElementStyle(ganji[1])}`}>
                                            {ganji[1]}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </section>
                )}
                
                {/* 하단 버튼 (결과 화면에도 동일하게 표시) */}
                <div className="fixed bottom-0 w-full max-w-md grid grid-cols-3 h-14 text-white font-bold text-lg shadow-lg z-30">
                    <button 
                        onClick={handleReset}
                        className="bg-[#FFB74D] hover:bg-orange-400 active:bg-orange-500 flex items-center justify-center"
                    >
                        새로고침
                    </button>
                    <button 
                        onClick={handleReset} 
                        className="bg-[#4FC3F7] hover:bg-sky-400 active:bg-sky-500 flex items-center justify-center"
                    >
                        사주조회
                    </button>
                    <button className="bg-[#81C784] hover:bg-green-400 active:bg-green-500 flex items-center justify-center">
                        저장하기
                    </button>
                </div>
            </main>
        )}
      </div>
    </div>
  );
}
