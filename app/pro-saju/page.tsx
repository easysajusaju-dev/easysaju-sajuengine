"use client";

import React, { useState } from "react";

// ==========================================
// Types (기존 타입 유지)
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
// Style Utilities (디자인용)
// ==========================================

/** 오행에 따른 스타일 반환 (배경색, 글자색, 테두리) */
function getFiveElementStyle(char: string) {
  // 목 (Wood)
  if ("갑을인묘甲乙寅卯".includes(char)) {
    return "bg-green-600 text-white border-black";
  }
  // 화 (Fire)
  if ("병정사오丙丁巳午".includes(char)) {
    return "bg-red-600 text-white border-black";
  }
  // 토 (Earth)
  if ("무기진술축미戊己辰戌丑未".includes(char)) {
    return "bg-amber-400 text-black border-black";
  }
  // 금 (Metal)
  if ("경신신유庚辛申酉".includes(char)) {
    return "bg-white text-black border-black";
  }
  // 수 (Water)
  if ("임계해자壬癸亥子".includes(char)) {
    return "bg-slate-800 text-white border-black";
  }
  return "bg-gray-100 text-black border-black";
}

/** 간지 한글 매핑 (필요시 사용) */
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
  const [gender, setGender] = useState<Gender>("M");
  const [name, setName] = useState("홍길동");
  const [birthdate, setBirthdate] = useState("19780324");
  const [birthtime, setBirthtime] = useState("1230");
  const [isLunar, setIsLunar] = useState(false);
  const [isLeap, setIsLeap] = useState(false);
  const [unknownTime, setUnknownTime] = useState(false);

  // --- Result State ---
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResponse["result"] | null>(null);

  // --- Logic ---
  function parseBirth() {
    if (birthdate.length !== 8) throw new Error("생년월일은 8자리(예: 19780324)로 입력해주세요.");
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
      // 1. 만세력 Debug API
      const debugUrl = buildDebugUrl();
      const res = await fetch(debugUrl, { cache: "no-store" });
      if (!res.ok) throw new Error("만세력 서버 오류");
      const debugJson: ManseryeokDebug = await res.json();
      setDebugData(debugJson);

      // 2. Saju Engine API Payload 준비
      const final = debugJson.finalResult;
      // 만세력의 한글 간지(예: 갑자)를 사용하는 경우도 있고 한자를 쓰는 경우도 있어 체크 필요
      // 여기서는 debugJson의 finalResult가 한자(戊午)라고 가정하거나, 엔진이 처리하도록 함
      // 보통 debugJson은 "戊午" 처럼 나옴.
      
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
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- 렌더링 헬퍼 ---
  // 기둥별 데이터 추출 (col: "hour" | "day" | "month" | "year")
  const getColumnData = (col: "hour" | "day" | "month" | "year") => {
    if (!engineResult || !debugData) return null;
    
    // 간지 문자 (사주엔진 결과 사용)
    const ganji = engineResult.ganji[col]; // 예: "甲子"
    const stem = ganji[0];
    const branch = ganji[1];
    
    // 십성 (천간)
    const stemSibsung = col === "day" ? "일간(나)" : engineResult.sibsung[col];
    // 십성 (지지)
    const branchSibsung = engineResult.branchSibsung[col];
    // 12운성
    const twelve = engineResult.twelve[col];
    
    // 형충회합 (relations) - 간단히 표시하기 위해 해당 기둥이 포함된 관계 찾기
    const rels = engineResult.relations;
    const myRelations: string[] = [];
    
    // 관계 데이터에서 현재 기둥(col)과 관련된 것만 필터링
    if (rels) {
        ["hyung", "chung", "pa", "hap"].forEach((type) => {
            const list = rels[type as keyof typeof rels] as any[];
            list.forEach((r) => {
                if (r.from === col || r.to === col) {
                   // 중복 제거 및 짧은 이름(충, 합 등) 추가
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
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans pb-10">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col">
        
        {/* 1. 헤더 (파란색 배경) */}
        <header className="bg-blue-600 text-white p-4 shadow-md z-10">
            <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                    <span className="text-gray-600 text-2xl font-bold">👤</span>
                </div>
                <div>
                    <div className="text-lg font-bold">
                        {name} <span className="text-sm font-normal opacity-90">({gender === 'M' ? '남' : '여'})</span>
                    </div>
                    {debugData ? (
                         <div className="text-xs opacity-90 space-y-0.5">
                            <p>(양) {debugData.finalResult.solarText}</p>
                            <p>(음) {debugData.finalResult.lunarText}</p>
                        </div>
                    ) : (
                        <div className="text-xs opacity-80">정보를 입력해주세요</div>
                    )}
                </div>
            </div>
        </header>

        {/* 2. 입력 폼 (결과 없을 때만 크게 보이거나, 상단에 접이식으로 배치 가능. 여기선 항상 노출하되 심플하게) */}
        {!debugData && (
          <section className="p-4 border-b bg-slate-50">
             <form onSubmit={handleSubmit} className="space-y-3 text-sm">
                <div className="flex gap-2">
                    <input 
                        type="text" value={name} onChange={e=>setName(e.target.value)} 
                        className="border p-2 rounded w-1/3" placeholder="이름"
                    />
                    <div className="flex items-center gap-2 bg-white border px-2 rounded">
                         {genderOptions.map(g => (
                             <label key={g.value} className="flex items-center gap-1 cursor-pointer">
                                 <input type="radio" checked={gender === g.value} onChange={()=>setGender(g.value)} />
                                 {g.label}
                             </label>
                         ))}
                    </div>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="text" value={birthdate} onChange={e=>setBirthdate(e.target.value)}
                        className="border p-2 rounded w-1/2" placeholder="YYYYMMDD"
                    />
                     <input 
                        type="text" value={birthtime} onChange={e=>setBirthtime(e.target.value)}
                        disabled={unknownTime}
                        className="border p-2 rounded w-1/4 disabled:bg-gray-100" placeholder="HHmm"
                    />
                    <label className="flex items-center gap-1 text-xs">
                        <input type="checkbox" checked={unknownTime} onChange={e=>setUnknownTime(e.target.checked)} />
                        시간모름
                    </label>
                </div>
                <button disabled={loading} className="w-full bg-slate-700 text-white py-2 rounded font-bold">
                    {loading ? "분석 중..." : "사주 조회"}
                </button>
                {error && <p className="text-red-500 text-xs">{error}</p>}
             </form>
          </section>
        )}

        {/* 3. 메인 결과 화면 */}
        {engineResult && debugData && (
            <main className="flex-1 overflow-y-auto bg-white">
                
                {/* 사주 팔자 테이블 (4 Pillars) */}
                <section className="border-b-2 border-gray-300">
                    {/* 헤더 (시주 일주 월주 년주) - 우측부터 년주 */}
                    <div className="grid grid-cols-4 text-center bg-gray-200 text-gray-700 text-sm font-bold border-b border-gray-300">
                        <div className="py-1 border-r border-gray-300">시주</div>
                        <div className="py-1 border-r border-gray-300">일주</div>
                        <div className="py-1 border-r border-gray-300">월주</div>
                        <div className="py-1">년주</div>
                    </div>

                    {/* 간지 한글 이름 (예: 신미 기유 정사 계축) */}
                    <div className="grid grid-cols-4 text-center text-sm bg-gray-100 border-b border-gray-300">
                        {["hour", "day", "month", "year"].map((col) => (
                            <div key={col} className="py-1 border-r border-gray-300 last:border-none">
                                {getColumnData(col as any)?.ganjiKor}
                            </div>
                        ))}
                    </div>
                    
                     {/* 천간 관계 (충/합 등 표시) - 상단 */}
                     <div className="grid grid-cols-4 text-center text-xs text-red-600 font-bold h-6 items-center">
                        {/* 구현 복잡도상 placeholder 또는 simple logic */}
                         <div className="border-r h-full flex items-center justify-center">-</div>
                         <div className="border-r h-full flex items-center justify-center">-</div>
                         <div className="border-r h-full flex items-center justify-center">-</div>
                         <div className="h-full flex items-center justify-center">-</div>
                     </div>

                    {/* 천간 십성 */}
                    <div className="grid grid-cols-4 text-center text-sm text-gray-800 py-1 border-t border-gray-200">
                        {["hour", "day", "month", "year"].map((col) => (
                             <div key={col} className={`border-r border-gray-200 last:border-none ${col==='day' ? 'text-blue-600 font-bold' : ''}`}>
                                {getColumnData(col as any)?.stemSibsung}
                             </div>
                        ))}
                    </div>

                    {/* === 핵심: 왕따시만한 글자 박스 === */}
                    <div className="grid grid-cols-4 gap-1 px-1 py-2 bg-white">
                         {/* 천간 줄 */}
                         {["hour", "day", "month", "year"].map((col) => {
                             const d = getColumnData(col as any);
                             return (
                                 <div key={`stem-${col}`} className="flex justify-center">
                                     <div className={`w-20 h-20 flex items-center justify-center text-5xl font-serif border-4 shadow-sm ${getFiveElementStyle(d?.stem || '')}`}>
                                         {d?.stem}
                                     </div>
                                 </div>
                             )
                         })}
                         {/* 지지 줄 */}
                         {["hour", "day", "month", "year"].map((col) => {
                             const d = getColumnData(col as any);
                             return (
                                 <div key={`branch-${col}`} className="flex justify-center">
                                     <div className={`w-20 h-20 flex items-center justify-center text-5xl font-serif border-4 shadow-sm ${getFiveElementStyle(d?.branch || '')}`}>
                                         {d?.branch}
                                     </div>
                                 </div>
                             )
                         })}
                    </div>

                    {/* 지지 십성 (하단) */}
                    <div className="grid grid-cols-4 text-center text-sm border-t border-gray-300">
                        {["hour", "day", "month", "year"].map((col) => (
                            <div key={col} className="py-1 border-r border-gray-300 last:border-none">
                                {getColumnData(col as any)?.branchSibsung}
                            </div>
                        ))}
                    </div>

                    {/* 지장간 (간단 흉내 - 엔진 데이터 부족으로 placeholder 느낌으로 12운성 배치) */}
                    {/* 참고: 원래는 여기에 지장간이 들어가야 함. 현재는 12운성으로 대체 */}
                    <div className="grid grid-cols-4 text-center text-sm py-1 border-t border-gray-200 bg-gray-50">
                        {["hour", "day", "month", "year"].map((col) => (
                            <div key={col} className="border-r border-gray-200 last:border-none flex flex-col gap-0.5">
                                <span className="text-gray-500 text-xs">12운성</span>
                                <span className="font-bold">{getColumnData(col as any)?.twelve}</span>
                            </div>
                        ))}
                    </div>

                     {/* 지지 관계 (합/충) */}
                     <div className="grid grid-cols-4 text-center text-xs py-1 border-t border-gray-300 bg-yellow-50 text-red-700 font-bold">
                         {["hour", "day", "month", "year"].map((col) => (
                             <div key={col} className="border-r border-gray-300 last:border-none min-h-[1.5rem] flex items-center justify-center">
                                 {getColumnData(col as any)?.relations}
                             </div>
                         ))}
                     </div>
                </section>

                {/* 4. 대운 (Scrollable or Grid) */}
                <section className="mt-2 border-t-4 border-gray-200">
                    <div className="bg-gray-100 text-center py-2 font-bold text-sm border-b border-gray-300">
                        대운 (대운수: {debugData.finalResult.daeNum}, {engineResult.daewoon.direction === 'forward' ? '순행' : '역행'})
                    </div>
                    
                    {/* 대운 Grid System */}
                    <div className="overflow-x-auto">
                        <div className="min-w-[320px]">
                            {/* 나이 행 */}
                            <div className="grid grid-cols-10 bg-gray-50 border-b border-gray-300 text-xs text-center">
                                {debugData.finalResult.daeWoonYear.map((y, i) => (
                                    <div key={i} className="py-1 border-r border-gray-200 last:border-none">
                                        {/* 만세력 데이터의 나이 계산이 필요하지만, 여기선 단순히 표시 */}
                                        {(i + 1) * 10 - (10 - debugData.finalResult.daeNum)}
                                    </div>
                                ))}
                            </div>
                            {/* 간지 박스 행 */}
                            <div className="grid grid-cols-10 bg-white">
                                {debugData.finalResult.daeWoonGanji.map((ganji, i) => (
                                    <div key={i} className="flex flex-col items-center py-1 border-r border-gray-200 border-b last:border-r-0">
                                        {/* 대운 천간 */}
                                        <div className={`w-8 h-8 mb-0.5 flex items-center justify-center text-lg font-bold border ${getFiveElementStyle(ganji[0])}`}>
                                            {ganji[0]}
                                        </div>
                                        {/* 대운 지지 */}
                                        <div className={`w-8 h-8 flex items-center justify-center text-lg font-bold border ${getFiveElementStyle(ganji[1])}`}>
                                            {ganji[1]}
                                        </div>
                                        {/* 간단 십성 표시 (선택사항) */}
                                        <div className="text-[10px] mt-0.5 text-gray-500 text-center leading-tight">
                                            {/* 공간 부족으로 생략하거나 십성 로직 추가 필요 */}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* 5. 세운 (올해 기준 전후 5년 등) */}
                {debugData.finalResult.seunYear && (
                    <section className="mt-2 border-t-4 border-gray-200 mb-10">
                         <div className="bg-gray-100 text-center py-2 font-bold text-sm border-b border-gray-300">
                             세운 (년운)
                        </div>
                        <div className="grid grid-cols-5 sm:grid-cols-10 border-b border-gray-300">
                            {debugData.finalResult.seunYear.slice(0,10).map((year, idx) => {
                                const ganji = debugData.finalResult.seunGanji?.[idx] || "??";
                                const isThisYear = year === new Date().getFullYear();
                                return (
                                    <div key={year} className={`flex flex-col items-center py-2 border-r border-gray-200 ${isThisYear ? 'bg-blue-50 ring-2 ring-blue-400 inset-0 z-10' : 'bg-white'}`}>
                                        <span className="text-xs text-gray-500 mb-1">{year}</span>
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

            </main>
        )}
      </div>
    </div>
  );
}
