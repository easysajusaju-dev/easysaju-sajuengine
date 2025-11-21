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

const genderOptions: { value: Gender; label: string }[] = [
  { value: "M", label: "남자" },
  { value: "F", label: "여자" },
];


// 오행 색상 (배경, 글자색, 테두리)
// [수정된 함수] 오행 색상 (한글 + 한자 모두 지원)
function getOhaengStyles(char: string) {
  // 한글과 한자를 모두 포함시킴
  const wood = "갑을인묘甲乙寅卯";
  const fire = "병정사오丙丁巳午";
  const earth = "무기진술축미戊己辰戌丑未";
  const metal = "경신신유庚辛申酉";
  const water = "임계해자壬癸亥子";

  // 목(Wood): 초록색
  if (wood.includes(char))
    return { bg: "bg-green-600", text: "text-white", border: "border-green-800" };
  
  // 화(Fire): 빨간색
  if (fire.includes(char))
    return { bg: "bg-red-600", text: "text-white", border: "border-red-800" };
  
  // 토(Earth): 노란색 (글자는 검정)
  if (earth.includes(char))
    return { bg: "bg-yellow-400", text: "text-black", border: "border-yellow-600" };
  
  // 금(Metal): 흰색/회색 (글자는 검정)
  if (metal.includes(char))
    return { bg: "bg-slate-100", text: "text-black", border: "border-slate-400" };
  
  // 수(Water): 검정색 (글자는 흰색)
  if (water.includes(char))
    return { bg: "bg-black", text: "text-white", border: "border-slate-600" };

  // 기본값: 회색
  return { bg: "bg-gray-200", text: "text-gray-500", border: "border-gray-300" };
}

// 지장간 데이터 (간단 매핑 - 실제 엔진에서 넘어오면 그걸 쓰세요)
function getJijanggan(branch: string) {
  const map: Record<string, string[]> = {
    자: ["壬", "", "癸"],
    축: ["癸", "辛", "己"],
    인: ["戊", "丙", "甲"],
    묘: ["甲", "", "乙"],
    진: ["乙", "癸", "戊"],
    사: ["戊", "庚", "丙"],
    오: ["丙", "己", "丁"],
    미: ["丁", "乙", "己"],
    신: ["戊", "壬", "庚"],
    유: ["庚", "", "辛"],
    술: ["辛", "丁", "戊"],
    해: ["戊", "甲", "壬"],
  };
  return map[branch] || ["", "", ""];
}

// --- [메인 컴포넌트] ---
export default function ProSajuPage() {
  // 입력 상태
  const [gender, setGender] = useState<Gender>("F");
  const [name, setName] = useState("홍길동");
  const [birthdate, setBirthdate] = useState("19780324");
  const [birthtime, setBirthtime] = useState("1230");
  const [isLunar, setIsLunar] = useState(false);
  const [isLeap, setIsLeap] = useState(false);
  const [unknownTime, setUnknownTime] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(true); // 폼 열기/접기

  // 결과 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResponse["result"] | null>(null);

  function parseBirth() {
    // ... (기존과 동일한 파싱 로직)
    if (birthdate.length !== 8) throw new Error("생년월일 8자리 입력");
    const year = Number(birthdate.slice(0, 4));
    const month = Number(birthdate.slice(4, 6));
    const day = Number(birthdate.slice(6, 8));
    let hour = 0;
    let minute = 0;
    if (!unknownTime) {
      if (birthtime.length !== 4) throw new Error("시간 4자리 입력");
      hour = Number(birthtime.slice(0, 2));
      minute = Number(birthtime.slice(2, 4));
    }
    return { year, month, day, hour, minute };
  }

  function buildDebugUrl() {
    // ... (기존과 동일)
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

    try {
      // 1. Debug API
      const debugUrl = buildDebugUrl();
      const res = await fetch(debugUrl);
      if (!res.ok) throw new Error("만세력 서버 오류");
      const debugJson: ManseryeokDebug = await res.json();
      setDebugData(debugJson);

      // 2. Engine Payload
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
        yearStem, yearBranch, monthStem, monthBranch, dayStem, dayBranch, hourStem, hourBranch,
        gender, birth: birthIso,
        solarTerms: [{ name: solarTermName, date: solarTermDate, isPrincipal: true }],
      };

      // 3. Engine API
      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enginePayload),
      });
      if (!engineRes.ok) throw new Error("사주 엔진 오류");
      const engineJson: EngineResponse = await engineRes.json();
      if (!engineJson.ok) throw new Error(engineJson.error || "엔진 오류");

      setEngineResult(engineJson.result || null);
      setIsFormOpen(false); // 결과 나오면 폼 접기
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const hasResult = !!(debugData && engineResult);
  
  // 나이 계산 (만 나이/세는 나이 단순화)
  const currentYear = new Date().getFullYear();
  const birthYear = debugData ? Number(birthdate.slice(0,4)) : 0;
  const koreanAge = birthYear ? currentYear - birthYear + 1 : 0;

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white shadow-lg">
        
        {/* [헤더] 앱바 스타일 */}
        <header className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shadow-md">
          <div className="text-lg font-bold">만세력 Pro V1.0</div>
          <button 
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="text-xs bg-indigo-800 px-2 py-1 rounded hover:bg-indigo-700"
          >
            {isFormOpen ? "접기" : "입력 열기"}
          </button>
        </header>

        {/* [입력 폼] */}
        {isFormOpen && (
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-3 text-sm">
              <div className="flex gap-2">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border p-2 rounded w-1/3"
                  placeholder="이름"
                />
                <div className="flex border rounded overflow-hidden">
                  {genderOptions.map((g) => (
                    <button
                      key={g.value}
                      type="button"
                      onClick={() => setGender(g.value)}
                      className={`px-3 py-2 ${gender === g.value ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="border p-2 rounded flex-1"
                  placeholder="YYYYMMDD"
                  maxLength={8}
                />
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={isLunar} onChange={e=>setIsLunar(e.target.checked)} />
                  음력
                </label>
              </div>
              <div className="flex gap-2 items-center">
                <input
                  value={birthtime}
                  onChange={(e) => setBirthtime(e.target.value)}
                  className="border p-2 rounded w-24"
                  placeholder="HHmm"
                  maxLength={4}
                  disabled={unknownTime}
                />
                <label className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={unknownTime} onChange={e=>setUnknownTime(e.target.checked)} />
                  시간모름
                </label>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 text-white py-2 rounded font-bold hover:bg-red-700"
                >
                  {loading ? "조회 중.." : "조회하기"}
                </button>
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
            </form>
          </div>
        )}

        {/* [결과 화면] */}
        {hasResult && debugData && engineResult && (
          <main className="pb-10">
            {/* [사용자 정보 요약] */}
            <div className="bg-indigo-500 text-white p-3 text-sm leading-snug">
              <div className="flex items-end gap-2 mb-1">
                <span className="text-xl font-bold">{name}</span>
                <span className="opacity-90">({gender === "M" ? "남" : "여"}, {koreanAge}세)</span>
              </div>
              <div className="text-xs opacity-80">
                (양) {debugData.finalResult.solarText} <br/>
                (음) {debugData.finalResult.lunarText}
              </div>
            </div>

            {/* [원국표 (사주팔자)] */}
            <div className="border-b-2 border-gray-400 bg-white">
              {/* 헤더 (시주 일주 월주 년주) */}
              <div className="grid grid-cols-4 text-center text-xs bg-gray-200 border-b border-gray-300 text-gray-700 font-bold">
                <div className="py-1 border-r border-gray-300">시주</div>
                <div className="py-1 border-r border-gray-300">일주</div>
                <div className="py-1 border-r border-gray-300">월주</div>
                <div className="py-1">년주</div>
              </div>

              {/* 관계 (형충파해) - 예시 로직 */}
              <div className="grid grid-cols-4 text-center text-[10px] text-red-600 font-bold bg-yellow-50 border-b border-gray-200 h-5 items-center">
                 {/* 실제 엔진에서 관계 데이터를 가져와 매핑해야 함. 여기선 공란 처리 */}
                 <div className="border-r border-gray-200">-</div>
                 <div className="border-r border-gray-200">-</div>
                 <div className="border-r border-gray-200">-</div>
                 <div>-</div>
              </div>

              {/* 천간 (Stems) */}
              <div className="grid grid-cols-4 text-center border-b border-gray-300">
                {(["hour", "day", "month", "year"] as const).map((col) => {
                  const gan = engineResult.ganji[col][0]; // 천간 글자
                  const style = getOhaengStyles(gan);
                  const sibsung = col === 'day' ? "일간" : engineResult.sibsung?.[col] || ""; // 십신

                  return (
                    <div key={`stem-${col}`} className="border-r last:border-r-0 border-gray-200 p-1 pb-2 flex flex-col items-center">
                      {/* 십신 라벨 */}
                      <div className="mb-1 px-1 py-0.5 bg-blue-600 text-white text-[10px] rounded-sm w-full max-w-[50px]">
                        {sibsung}
                      </div>
                      {/* 글자 박스 */}
                      <div className={`w-14 h-14 flex items-center justify-center text-3xl font-serif font-bold border-2 ${style.bg} ${style.text} ${style.border} shadow-sm`}>
                        {gan}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 지지 (Branches) */}
              <div className="grid grid-cols-4 text-center border-b border-gray-300">
                {(["hour", "day", "month", "year"] as const).map((col) => {
                  const ji = engineResult.ganji[col][1]; // 지지 글자
                  const style = getOhaengStyles(ji);
                  const jiSibsung = engineResult.branchSibsung?.[col] || ""; // 지장간 십신(본기)

                  return (
                    <div key={`branch-${col}`} className="border-r last:border-r-0 border-gray-200 p-1 pt-2 flex flex-col items-center">
                      {/* 글자 박스 */}
                      <div className={`w-14 h-14 flex items-center justify-center text-3xl font-serif font-bold border-2 mb-1 ${style.bg} ${style.text} ${style.border} shadow-sm`}>
                        {ji}
                      </div>
                      {/* 십신 라벨 */}
                      <div className="px-1 py-0.5 bg-blue-500 text-white text-[10px] rounded-sm w-full max-w-[50px]">
                        {jiSibsung}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 지장간 (Hidden Stems) */}
              <div className="grid grid-cols-4 text-center border-b border-gray-300 bg-gray-50">
                {(["hour", "day", "month", "year"] as const).map((col) => {
                   const ji = engineResult.ganji[col][1];
                   const jijanggan = getJijanggan(ji); // [여기, 중기, 본기]
                   return (
                     <div key={`hide-${col}`} className="border-r last:border-r-0 border-gray-300 text-[10px] py-1">
                        <div className="grid grid-rows-3 gap-0.5 h-12 items-center justify-center">
                          {/* 여기 */}
                          {jijanggan[0] && <span className="text-gray-500">{jijanggan[0]} <span className="text-[8px] text-gray-400">여기</span></span>}
                          {/* 중기 */}
                          {jijanggan[1] && <span className="text-gray-600">{jijanggan[1]} <span className="text-[8px] text-gray-400">중기</span></span>}
                          {/* 본기 */}
                          <span className="font-bold text-black">{jijanggan[2]} <span className="text-[8px] text-gray-400">본기</span></span>
                        </div>
                     </div>
                   )
                })}
              </div>

              {/* 12운성 (Twelve) */}
              <div className="grid grid-cols-4 text-center border-b border-gray-300">
                 {(["hour", "day", "month", "year"] as const).map((col) => {
                    const star = engineResult.twelve?.[col] || "";
                    return (
                      <div key={`twelve-${col}`} className="border-r last:border-r-0 border-gray-300 py-1 flex justify-center">
                         <div className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded shadow-sm">
                            {star}
                         </div>
                      </div>
                    )
                 })}
              </div>

               {/* 기타 (납음/신살 등 - 자리표시용) */}
               <div className="grid grid-cols-4 text-center bg-white text-[10px] py-1 text-gray-600">
                  <div className="border-r border-gray-200">천상화</div>
                  <div className="border-r border-gray-200">대계수</div>
                  <div className="border-r border-gray-200">천중수</div>
                  <div>양류목</div>
               </div>
            </div>

            {/* [대운 표] */}
            <div className="mt-4 bg-white border-t border-b border-gray-300">
              <div className="bg-blue-500 text-white text-center text-xs font-bold py-1">
                전통나이 (대운수: {debugData.finalResult.daeNum}, {engineResult.daewoon.direction === "forward" ? "순행" : "역행"})
              </div>
              
              {/* 대운 그리드 (스크롤 대신 10개 꽉 채우기) */}
              <div className="grid grid-cols-10 border-b border-gray-300">
                 {/* 나이 행 */}
                 {debugData.finalResult.daeWoonYear.map((year, i) => (
                   <div key={i} className="text-center text-[10px] py-1 border-r last:border-r-0 border-gray-200 bg-gray-100">
                      { (i + 1) * 10 - (10 - debugData.finalResult.daeNum) }
                   </div>
                 ))}
                 {/* 간지 행 */}
                 {debugData.finalResult.daeWoonGanji.map((ganji, i) => {
                    const [s, b] = ganji.split("");
                    const sStyle = getOhaengStyles(s);
                    const bStyle = getOhaengStyles(b);
                    return (
                      <div key={i} className="flex flex-col items-center py-1 border-r last:border-r-0 border-gray-200">
                         <div className={`w-8 h-8 mb-0.5 flex items-center justify-center text-sm font-bold text-white ${sStyle.bg} border border-gray-400 rounded-sm`}>
                            {s}
                         </div>
                         <div className={`w-8 h-8 flex items-center justify-center text-sm font-bold text-white ${bStyle.bg} border border-gray-400 rounded-sm`}>
                            {b}
                         </div>
                      </div>
                    );
                 })}
              </div>
            </div>

            {/* [세운 (년운) 표] */}
            {debugData.finalResult.seunYear && debugData.finalResult.seunGanji && (
              <div className="mt-4 bg-white border-t border-b border-gray-300">
                <div className="bg-gray-700 text-white text-center text-xs font-bold py-1">
                  세운 (년운)
                </div>
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-10 min-w-[320px]">
                    {/* 연도 */}
                    {debugData.finalResult.seunYear.map((y, i) => (
                      <div key={i} className="text-center text-[10px] py-1 border-r border-gray-200 bg-gray-50">
                        {y}
                      </div>
                    ))}
                    {/* 간지 */}
                    {debugData.finalResult.seunGanji.map((ganji, i) => {
                       const [s, b] = ganji.split("");
                       return (
                         <div key={i} className="flex flex-col items-center py-1 border-r border-gray-200 border-b border-gray-300">
                             <div className="text-sm font-bold">{s}</div>
                             <div className="text-sm font-bold">{b}</div>
                         </div>
                       )
                    })}
                  </div>
                </div>
              </div>
            )}
            
            {/* 하단 여백 */}
            <div className="h-12"></div>
          </main>
        )}
      </div>
    </div>
  );
}
