"use client";

import React, { useState } from "react";

// --- [타입 정의] ---
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
  };
  error?: string;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: "M", label: "남자" },
  { value: "F", label: "여자" },
];

// --- [헬퍼 함수: 오행 색상 (한글+한자 지원)] ---
function getOhaengStyles(char: string) {
  const wood = "갑을인묘甲乙寅卯";
  const fire = "병정사오丙丁巳午";
  const earth = "무기진술축미戊己辰戌丑未";
  const metal = "경신신유庚辛申酉";
  const water = "임계해자壬癸亥子";

  if (wood.includes(char))
    return { bg: "bg-green-600", text: "text-white", border: "border-green-800" };
  if (fire.includes(char))
    return { bg: "bg-red-600", text: "text-white", border: "border-red-800" };
  if (earth.includes(char))
    return { bg: "bg-yellow-400", text: "text-black", border: "border-yellow-600" };
  if (metal.includes(char))
    return { bg: "bg-slate-100", text: "text-black", border: "border-slate-400" };
  if (water.includes(char))
    return { bg: "bg-slate-900", text: "text-white", border: "border-black" }; // 수는 아주 진한 검정

  return { bg: "bg-gray-200", text: "text-gray-500", border: "border-gray-300" };
}

// 지장간 데이터 (표시용 더미)
function getJijanggan(branch: string) {
  const map: Record<string, string[]> = {
    자: ["壬", "", "癸"], 子: ["壬", "", "癸"],
    축: ["癸", "辛", "己"], 丑: ["癸", "辛", "己"],
    인: ["戊", "丙", "甲"], 寅: ["戊", "丙", "甲"],
    묘: ["甲", "", "乙"], 卯: ["甲", "", "乙"],
    진: ["乙", "癸", "戊"], 辰: ["乙", "癸", "戊"],
    사: ["戊", "庚", "丙"], 巳: ["戊", "庚", "丙"],
    오: ["丙", "己", "丁"], 午: ["丙", "己", "丁"],
    미: ["丁", "乙", "己"], 未: ["丁", "乙", "己"],
    신: ["戊", "壬", "庚"], 申: ["戊", "壬", "庚"],
    유: ["庚", "", "辛"], 酉: ["庚", "", "辛"],
    술: ["辛", "丁", "戊"], 戌: ["辛", "丁", "戊"],
    해: ["戊", "甲", "壬"], 亥: ["戊", "甲", "壬"],
  };
  return map[branch] || ["", "", ""];
}

export default function ProSajuPage() {
  // 입력 상태
  const [gender, setGender] = useState<Gender>("F");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [birthtime, setBirthtime] = useState("");
  const [isLunar, setIsLunar] = useState(false);
  const [isLeap, setIsLeap] = useState(false);
  const [unknownTime, setUnknownTime] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(true);

  // 결과 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResponse["result"] | null>(null);

  function parseBirth() {
    if (birthdate.length !== 8) throw new Error("생년월일 8자리를 입력해주세요.");
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
    return { year, month, day, hour, minute };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
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

      // 1. Debug API
      const debugRes = await fetch(`https://my-manseryeok.onrender.com/saju/debug?${qs}`);
      if (!debugRes.ok) throw new Error("만세력 서버 연결 실패");
      const debugJson: ManseryeokDebug = await debugRes.json();
      setDebugData(debugJson);

      // 2. Engine API
      const final = debugJson.finalResult;
      const [yearStem, yearBranch] = final.yearGanji.split("");
      const [monthStem, monthBranch] = final.monthGanji.split("");
      const [dayStem, dayBranch] = final.dayGanji.split("");
      const [hourStem, hourBranch] = final.hourGanji.split("");

      const birthIso = debugJson.timeCalc.birthAdjusted
        ? `${debugJson.timeCalc.birthAdjusted}:00+09:00`
        : `${debugJson.timeCalc.originalBirth}:00+09:00`;

      const enginePayload = {
        yearStem, yearBranch, monthStem, monthBranch, dayStem, dayBranch, hourStem, hourBranch,
        gender, birth: birthIso,
        solarTerms: [{ name: final.termName, date: `${debugJson.seasonCalc.rawTermDate}:00+09:00`, isPrincipal: true }],
      };

      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enginePayload),
      });
      if (!engineRes.ok) throw new Error("분석 엔진 오류");
      const engineJson: EngineResponse = await engineRes.json();
      if (!engineJson.ok) throw new Error(engineJson.error || "분석 실패");

      setEngineResult(engineJson.result || null);
      setIsFormOpen(false); // 결과 나오면 폼 닫기
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const hasResult = !!(debugData && engineResult);
  const currentYear = new Date().getFullYear();
  const birthYear = debugData ? Number(birthdate.slice(0, 4)) : 0;
  const koreanAge = birthYear ? currentYear - birthYear + 1 : 0;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-gray-900">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen md:min-h-0 md:h-auto md:my-10 md:rounded-xl overflow-hidden">
        
        {/* [헤더] */}
        <header className="bg-indigo-600 text-white px-5 py-4 flex items-center justify-between shadow-md z-10 relative">
          <div className="text-lg font-bold tracking-wide">만세력 Pro</div>
          {hasResult && (
            <button 
              onClick={() => setIsFormOpen(!isFormOpen)}
              className="text-xs bg-white/20 hover:bg-white/30 backdrop-blur-sm px-3 py-1.5 rounded transition"
            >
              {isFormOpen ? "결과 보기" : "다시 조회"}
            </button>
          )}
        </header>

        {/* [입력 폼] - 디자인 대폭 수정 */}
        {isFormOpen && (
          <div className="p-6 bg-white animate-fade-in">
            <h2 className="text-xl font-bold text-gray-800 mb-6 text-center">사주 정보를 입력해주세요</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 1. 성별 & 이름 */}
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1 flex p-1 bg-gray-100 rounded-lg">
                  {genderOptions.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGender(g.value)}
                      className={`flex-1 rounded-md text-sm font-bold transition-all ${
                        gender === g.value 
                          ? "bg-white text-indigo-600 shadow-sm" 
                          : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
                <div className="col-span-2">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-full px-4 bg-gray-50 border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="이름 (예: 홍길동)"
                  />
                </div>
              </div>

              {/* 2. 생년월일 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">생년월일 (8자리)</label>
                <div className="relative">
                  <input
                    type="tel" // 모바일에서 숫자 키패드
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-lg font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                    placeholder="예) 19880123"
                    maxLength={8}
                  />
                </div>
                <div className="flex gap-4 mt-2 px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isLunar ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                       {isLunar && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input type="checkbox" className="hidden" checked={isLunar} onChange={e => setIsLunar(e.target.checked)} />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">음력</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-5 h-5 rounded border flex items-center justify-center ${isLeap ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                       {isLeap && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <input type="checkbox" className="hidden" checked={isLeap} onChange={e => setIsLeap(e.target.checked)} />
                    <span className="text-sm text-gray-600 group-hover:text-gray-900">윤달</span>
                  </label>
                </div>
              </div>

              {/* 3. 태어난 시간 */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 ml-1">태어난 시간 (4자리)</label>
                <div className="flex gap-3">
                  <input
                    type="tel"
                    value={birthtime}
                    onChange={(e) => setBirthtime(e.target.value.replace(/\D/g, ""))}
                    className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-lg font-medium text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition disabled:opacity-50 disabled:bg-gray-100"
                    placeholder="예) 1430"
                    maxLength={4}
                    disabled={unknownTime}
                  />
                  <label className="flex items-center gap-2 px-3 cursor-pointer border border-gray-200 rounded-lg hover:bg-gray-50 transition h-[52px]">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500"
                      checked={unknownTime} 
                      onChange={e => setUnknownTime(e.target.checked)} 
                    />
                    <span className="text-sm font-medium text-gray-600">시간 모름</span>
                  </label>
                </div>
              </div>

              {/* 에러 메시지 */}
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </div>
              )}

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all transform hover:scale-[1.01] disabled:opacity-70 disabled:scale-100 text-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    분석 중...
                  </span>
                ) : "내 사주 분석하기"}
              </button>
            </form>
          </div>
        )}

        {/* [결과 화면] */}
        {hasResult && debugData && engineResult && !isFormOpen && (
          <main className="bg-white min-h-screen md:min-h-0 pb-10 animate-fade-in">
            {/* 사용자 정보 요약 */}
            <div className="bg-indigo-50 p-5 border-b border-indigo-100">
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-gray-900">{name || "이름없음"}</span>
                <span className="text-gray-600 text-sm font-medium">
                  {gender === "M" ? "남" : "여"}, {koreanAge}세
                </span>
              </div>
              <div className="text-sm text-gray-500 space-y-0.5">
                <p>(양) {debugData.finalResult.solarText}</p>
                <p>(음) {debugData.finalResult.lunarText}</p>
              </div>
            </div>

            {/* 원국표 */}
            <div className="p-1">
              {/* 헤더 */}
              <div className="grid grid-cols-4 text-center bg-gray-100 py-2 rounded-t-lg border-b border-gray-200">
                {["시주", "일주", "월주", "년주"].map(t => (
                   <div key={t} className="text-xs font-bold text-gray-600">{t}</div>
                ))}
              </div>
              
              {/* 메인 원국 */}
              <div className="border-x border-b border-gray-200 rounded-b-lg bg-white">
                {/* 천간 */}
                <div className="grid grid-cols-4 text-center border-b border-gray-100">
                  {(["hour", "day", "month", "year"] as const).map((col) => {
                    const gan = engineResult.ganji[col][0];
                    const style = getOhaengStyles(gan);
                    const sibsung = col === 'day' ? "일간" : engineResult.sibsung?.[col] || "";
                    return (
                      <div key={`s-${col}`} className="p-2 flex flex-col items-center border-r last:border-r-0 border-gray-100">
                        <span className="mb-1 px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">{sibsung}</span>
                        <div className={`w-14 h-14 flex items-center justify-center text-3xl font-serif font-bold border-2 rounded shadow-sm ${style.bg} ${style.text} ${style.border}`}>
                          {gan}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 지지 */}
                <div className="grid grid-cols-4 text-center border-b border-gray-100">
                   {(["hour", "day", "month", "year"] as const).map((col) => {
                    const ji = engineResult.ganji[col][1];
                    const style = getOhaengStyles(ji);
                    const jiSibsung = engineResult.branchSibsung?.[col] || "";
                    return (
                      <div key={`b-${col}`} className="p-2 flex flex-col items-center border-r last:border-r-0 border-gray-100">
                        <div className={`w-14 h-14 mb-1 flex items-center justify-center text-3xl font-serif font-bold border-2 rounded shadow-sm ${style.bg} ${style.text} ${style.border}`}>
                          {ji}
                        </div>
                        <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] font-bold rounded">{jiSibsung}</span>
                      </div>
                    );
                  })}
                </div>

                {/* 지장간 */}
                <div className="grid grid-cols-4 text-center bg-gray-50/50 border-b border-gray-100 py-2">
                  {(["hour", "day", "month", "year"] as const).map((col) => {
                    const ji = engineResult.ganji[col][1];
                    const jijanggan = getJijanggan(ji);
                    return (
                      <div key={`j-${col}`} className="text-[10px] border-r last:border-r-0 border-gray-200 px-1">
                         <div className="flex flex-col gap-0.5 text-gray-500">
                            {jijanggan[0] && <span>{jijanggan[0]}</span>}
                            {jijanggan[1] && <span>{jijanggan[1]}</span>}
                            <span className="font-bold text-gray-800">{jijanggan[2]}</span>
                         </div>
                      </div>
                    )
                  })}
                </div>

                {/* 12운성 */}
                <div className="grid grid-cols-4 text-center py-2">
                   {(["hour", "day", "month", "year"] as const).map((col) => (
                      <div key={`12-${col}`} className="border-r last:border-r-0 border-gray-100">
                         <span className="inline-block px-2 py-0.5 bg-indigo-600 text-white text-[11px] rounded-full">
                           {engineResult.twelve?.[col] || "-"}
                         </span>
                      </div>
                   ))}
                </div>
              </div>
            </div>

            {/* 대운 */}
            <div className="mt-4 px-1">
               <div className="bg-blue-600 text-white text-center py-1.5 text-xs font-bold rounded-t-md">
                 대운 (대운수: {debugData.finalResult.daeNum}, {engineResult.daewoon.direction === "forward" ? "순행" : "역행"})
               </div>
               <div className="bg-white border-x border-b border-gray-200 rounded-b-md overflow-hidden">
                  <div className="flex divide-x divide-gray-200">
                    {debugData.finalResult.daeWoonYear.map((year, i) => {
                      const age = (i + 1) * 10 - (10 - debugData.finalResult.daeNum);
                      const ganji = debugData.finalResult.daeWoonGanji[i];
                      const [s, b] = ganji.split("");
                      const sStyle = getOhaengStyles(s);
                      const bStyle = getOhaengStyles(b);
                      
                      return (
                        <div key={i} className="flex-1 py-2 flex flex-col items-center hover:bg-gray-50">
                           <span className="text-[10px] text-gray-500 mb-1">{age}</span>
                           <div className={`w-6 h-6 mb-0.5 flex items-center justify-center text-xs font-bold border rounded-sm ${sStyle.bg} ${sStyle.text} ${sStyle.border}`}>{s}</div>
                           <div className={`w-6 h-6 flex items-center justify-center text-xs font-bold border rounded-sm ${bStyle.bg} ${bStyle.text} ${bStyle.border}`}>{b}</div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>

            {/* 세운 */}
            {debugData.finalResult.seunYear && (
               <div className="mt-4 px-1">
                 <div className="bg-gray-700 text-white text-center py-1.5 text-xs font-bold rounded-t-md">세운 (년운)</div>
                 <div className="bg-white border-x border-b border-gray-200 rounded-b-md overflow-x-auto">
                    <div className="flex min-w-max divide-x divide-gray-200">
                      {debugData.finalResult.seunYear.map((y, i) => {
                         const ganji = debugData.finalResult.seunGanji?.[i] || "";
                         const [s, b] = ganji.split("");
                         return (
                           <div key={i} className="w-10 py-2 flex flex-col items-center">
                             <span className="text-[10px] text-gray-500 mb-1">{y}</span>
                             <div className="font-bold text-sm text-gray-800">{s}</div>
                             <div className="font-bold text-sm text-gray-800">{b}</div>
                           </div>
                         )
                      })}
                    </div>
                 </div>
               </div>
            )}

          </main>
        )}
      </div>
    </div>
  );
}
