"use client";

import React, { useState, useEffect, useRef } from "react";

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
    daeWoonYear: number[]; // 대운 시작 연도 배열
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

// --- [간지 계산 로직] ---
const CHEONGAN = "갑을병정무기경신임계";
const지지 = "자축인묘진사오미신유술해";

// 오행 색상
function getOhaengStyles(char: string) {
  const wood = "갑을인묘甲乙寅卯";
  const fire = "병정사오丙丁巳午";
  const earth = "무기진술축미戊己辰戌丑未";
  const metal = "경신신유庚辛申酉";
  const water = "임계해자壬癸亥子";

  // 배경색(bg), 글자색(text), 테두리(border)
  if (wood.includes(char)) return { bg: "bg-green-500", text: "text-white", border: "border-green-700" };
  if (fire.includes(char)) return { bg: "bg-red-500", text: "text-white", border: "border-red-700" };
  if (earth.includes(char)) return { bg: "bg-yellow-400", text: "text-black", border: "border-yellow-600" };
  if (metal.includes(char)) return { bg: "bg-slate-200", text: "text-black", border: "border-slate-400" };
  if (water.includes(char)) return { bg: "bg-slate-900", text: "text-white", border: "border-black" };

  return { bg: "bg-gray-200", text: "text-gray-500", border: "border-gray-300" };
}

// 60갑자 배열 생성
const GANJI_60 = [];
for (let i = 0; i < 60; i++) {
  GANJI_60.push(CHEONGAN[i % 10] + 지지[i % 12]);
}
// 한자 매핑용 (간단 변환)
const HANJA_MAP: Record<string, string> = {
  갑: "甲", 을: "乙", 병: "丙", 정: "丁", 무: "戊", 기: "己", 경: "庚", 신: "辛", 임: "壬", 계: "癸",
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳", 오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥"
};
function toHanja(ganji: string) {
  return (HANJA_MAP[ganji[0]] || ganji[0]) + (HANJA_MAP[ganji[1]] || ganji[1]);
}

// 특정 연도의 간지 구하기 (1984년 = 갑자년 기준)
function getGanjiByYear(year: number) {
  // 1984년이 갑자(0번 인덱스)
  const offset = year - 1984;
  let index = offset % 60;
  if (index < 0) index += 60;
  return GANJI_60[index];
}

// 월운 구하기 (년두법: 연간 -> 인월의 천간 결정)
function getMonthlyGanjiList(yearGan: string) {
  // yearGan(연간)이 甲/己(0,5) -> 丙寅(2) 시작
  // 乙/庚(1,6) -> 戊寅(4) 시작
  // 丙/辛(2,7) -> 庚寅(6) 시작
  // 丁/壬(3,8) -> 壬寅(8) 시작
  // 戊/癸(4,9) -> 甲寅(0) 시작
  
  const ganIdx = CHEONGAN.indexOf(yearGan); // 한글이어야 함
  if (ganIdx === -1) return []; // 한자라면 변환 필요하지만 여기선 한글 로직 사용 가정

  // 인월(3번째 지지)의 천간 인덱스 공식: (연간idx % 5) * 2 + 2
  const startStemIdx = (ganIdx % 5) * 2 + 2; 
  
  // 보통 양력 1월은 축월(소한~입춘), 2월이 인월(입춘~경칩)
  // 상용 앱처럼 1월, 2월... 12월로 표시하되, 간지는 절기력 기준 근사치로 매핑
  // 편의상 1월(축월)부터 시작하도록 역산. 인월이 startStemIdx니까 축월은 -1
  let currentStemIdx = startStemIdx - 1;
  let currentBranchIdx = 1; // 축(1)부터 시작 (자0, 축1, 인2...)

  const list = [];
  for (let i = 1; i <= 12; i++) {
    const s = CHEONGAN[(currentStemIdx + 10) % 10];
    const b = 지지[currentBranchIdx % 12];
    list.push({ month: i, ganji: toHanja(s + b) });
    currentStemIdx++;
    currentBranchIdx++;
  }
  return list;
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
  const [isFormOpen, setIsFormOpen] = useState(true);

  // 결과 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResponse["result"] | null>(null);

  // UI 상태 (년운 선택)
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // 스크롤 Refs
  const seunContainerRef = useRef<HTMLDivElement>(null);

  // --- [API 호출 핸들러] ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. 입력값 검증 및 파싱
      if (birthdate.length !== 8) throw new Error("생년월일 8자리를 입력해주세요.");
      const year = Number(birthdate.slice(0, 4));
      const month = Number(birthdate.slice(4, 6));
      const day = Number(birthdate.slice(6, 8));
      let hour = 0, minute = 0;
      if (!unknownTime) {
        if (birthtime.length !== 4) throw new Error("출생시간 4자리를 입력해주세요.");
        hour = Number(birthtime.slice(0, 2));
        minute = Number(birthtime.slice(2, 4));
      }

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

      // 2. 서버 통신
      const debugRes = await fetch(`https://my-manseryeok.onrender.com/saju/debug?${qs}`);
      if (!debugRes.ok) throw new Error("서버 연결 실패");
      const debugJson: ManseryeokDebug = await debugRes.json();
      setDebugData(debugJson);

      // 3. 엔진 통신
      const final = debugJson.finalResult;
      const birthIso = debugJson.timeCalc.birthAdjusted 
        ? `${debugJson.timeCalc.birthAdjusted}:00+09:00` 
        : `${debugJson.timeCalc.originalBirth}:00+09:00`;

      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          yearStem: final.yearGanji[0], yearBranch: final.yearGanji[1],
          monthStem: final.monthGanji[0], monthBranch: final.monthGanji[1],
          dayStem: final.dayGanji[0], dayBranch: final.dayGanji[1],
          hourStem: final.hourGanji[0], hourBranch: final.hourGanji[1],
          gender, birth: birthIso,
          solarTerms: [{ name: final.termName, date: `${debugJson.seasonCalc.rawTermDate}:00+09:00`, isPrincipal: true }],
        }),
      });
      const engineJson = await engineRes.json();
      setEngineResult(engineJson.result || null);
      
      setIsFormOpen(false);
      
      // 조회 후 현재 년도로 선택 초기화
      setSelectedYear(new Date().getFullYear());

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // --- [자동 스크롤 효과] ---
  useEffect(() => {
    if (engineResult && seunContainerRef.current) {
      // 렌더링 후 약간의 딜레이를 두고 스크롤 이동 (DOM 생성 대기)
      setTimeout(() => {
        const targetEl = document.getElementById(`year-${selectedYear}`);
        if (targetEl && seunContainerRef.current) {
          targetEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        }
      }, 300);
    }
  }, [engineResult]); // 결과가 나오면 실행

  // --- [데이터 가공] ---
  const hasResult = !!(debugData && engineResult);
  const currentYear = new Date().getFullYear();
  const birthYear = debugData ? Number(birthdate.slice(0, 4)) : 0;
  const koreanAge = birthYear ? currentYear - birthYear + 1 : 0;

  // 100년치 세운 생성 (태어난 해 ~ +100년)
  const seunList = [];
  if (hasResult) {
    for (let i = 0; i <= 100; i++) {
      const y = birthYear + i;
      const g = toHanja(getGanjiByYear(y)); // 한글 간지 -> 한자로 변환
      seunList.push({ year: y, age: 1 + i, ganji: g });
    }
  }

  // 선택된 년도의 월운 생성
  // 1. 선택된 년도의 천간을 구한다 (한글로 역변환 필요하거나, getGanjiByYear 사용)
  const selectedYearGanjiHangul = hasResult ? getGanjiByYear(selectedYear) : "갑자";
  const selectedYearStem = selectedYearGanjiHangul[0]; // "갑"
  const wolunList = hasResult ? getMonthlyGanjiList(selectedYearStem) : [];


  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-gray-900 select-none">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen md:min-h-0 md:h-auto md:my-5 md:rounded-xl overflow-hidden">
        
        {/* 헤더 */}
        <header className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center shadow z-10 sticky top-0">
          <h1 className="font-bold text-lg">만세력 Pro</h1>
          <button onClick={() => setIsFormOpen(!isFormOpen)} className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition">
            {isFormOpen ? "닫기" : "입력 열기"}
          </button>
        </header>

        {/* 입력 폼 (생략 없이 유지) */}
        {isFormOpen && (
          <div className="p-6 bg-gray-50 animate-fade-in">
             <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex p-1 bg-gray-200 rounded-lg">
                   {genderOptions.map(g => (
                     <button key={g.value} type="button" onClick={() => setGender(g.value)} className={`flex-1 py-2 rounded-md text-sm font-bold ${gender === g.value ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>{g.label}</button>
                   ))}
                </div>
                <input value={name} onChange={e=>setName(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="이름" />
                <input value={birthdate} onChange={e=>setBirthdate(e.target.value)} className="w-full p-3 border rounded-lg" placeholder="생년월일(19900101)" type="tel" maxLength={8}/>
                <div className="flex gap-2 text-sm text-gray-600 justify-end">
                  <label><input type="checkbox" checked={isLunar} onChange={e=>setIsLunar(e.target.checked)} /> 음력</label>
                  <label><input type="checkbox" checked={isLeap} onChange={e=>setIsLeap(e.target.checked)} /> 윤달</label>
                </div>
                <div className="flex gap-2">
                   <input value={birthtime} onChange={e=>setBirthtime(e.target.value)} disabled={unknownTime} className="flex-1 p-3 border rounded-lg" placeholder="시간(1330)" type="tel" maxLength={4}/>
                   <label className="flex items-center gap-2 px-3 border rounded-lg bg-white"><input type="checkbox" checked={unknownTime} onChange={e=>setUnknownTime(e.target.checked)}/>모름</label>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700">
                  {loading ? "계산 중..." : "조회하기"}
                </button>
             </form>
          </div>
        )}

        {/* 결과 화면 */}
        {hasResult && debugData && engineResult && !isFormOpen && (
          <main className="bg-slate-50 pb-20">
            {/* 요약 카드 */}
            <div className="bg-white p-5 border-b border-gray-200 shadow-sm mb-2">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{name}</span>
                <span className="text-sm text-gray-500">{gender === "M" ? "남" : "여"}, {koreanAge}세</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                 (양) {debugData.finalResult.solarText} / (음) {debugData.finalResult.lunarText}
              </div>
            </div>

            {/* 원국표 */}
            <div className="mx-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-4">
               <div className="grid grid-cols-4 text-center bg-gray-50 py-1 text-xs font-bold text-gray-500 border-b">
                 <div>시주</div><div>일주</div><div>월주</div><div>년주</div>
               </div>
               <div className="grid grid-cols-4 border-b border-gray-100">
                 {(["hour", "day", "month", "year"] as const).map(col => {
                    const [s, b] = engineResult.ganji[col].split("");
                    const sStyle = getOhaengStyles(s);
                    return (
                      <div key={col} className="py-3 flex flex-col items-center border-r last:border-r-0 border-gray-100">
                        <span className="text-[10px] px-1 bg-indigo-50 text-indigo-600 rounded mb-1 font-bold">{engineResult.sibsung?.[col] || "-"}</span>
                        <div className={`w-12 h-12 flex items-center justify-center text-2xl font-bold text-white rounded-md shadow-sm ${sStyle.bg} ${sStyle.border}`}>{s}</div>
                      </div>
                    )
                 })}
               </div>
               <div className="grid grid-cols-4">
                 {(["hour", "day", "month", "year"] as const).map(col => {
                    const [s, b] = engineResult.ganji[col].split("");
                    const bStyle = getOhaengStyles(b);
                    return (
                      <div key={col} className="py-3 flex flex-col items-center border-r last:border-r-0 border-gray-100">
                        <div className={`w-12 h-12 flex items-center justify-center text-2xl font-bold text-white rounded-md shadow-sm mb-1 ${bStyle.bg} ${bStyle.border}`}>{b}</div>
                        <span className="text-[10px] text-gray-400">{engineResult.twelve?.[col]}</span>
                      </div>
                    )
                 })}
               </div>
            </div>

            {/* 대운 (현재 대운 박스 강조) */}
            <div className="mx-2 mb-4">
              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-t-lg flex justify-between items-center">
                 <span>대운 (대운수: {debugData.finalResult.daeNum})</span>
                 <span className="opacity-80">{engineResult.daewoon.direction === "forward" ? "순행" : "역행"}</span>
              </div>
              <div className="bg-white rounded-b-lg border border-gray-200 p-2 overflow-x-auto">
                 <div className="flex justify-between min-w-[320px]">
                    {debugData.finalResult.daeWoonYear.map((startYear, i) => {
                       // 대운 나이 계산 (1대운, 11대운...)
                       const age = (i * 10) + debugData.finalResult.daeNum;
                       const nextAge = age + 10;
                       // 현재 나이가 이 대운 범위에 있는지?
                       const isCurrent = koreanAge >= age && koreanAge < nextAge;

                       const [s, b] = debugData.finalResult.daeWoonGanji[i].split("");
                       const sStyle = getOhaengStyles(s);
                       const bStyle = getOhaengStyles(b);

                       return (
                         <div key={i} className={`flex flex-col items-center p-1 rounded-lg transition-all ${isCurrent ? 'ring-2 ring-blue-500 bg-blue-50 scale-105 z-10' : 'opacity-90'}`}>
                            <span className={`text-[10px] mb-1 font-bold ${isCurrent ? 'text-blue-600' : 'text-gray-400'}`}>{age}</span>
                            <div className={`w-7 h-7 mb-1 flex items-center justify-center text-sm font-bold text-white rounded ${sStyle.bg}`}>{s}</div>
                            <div className={`w-7 h-7 flex items-center justify-center text-sm font-bold text-white rounded ${bStyle.bg}`}>{b}</div>
                         </div>
                       )
                    })}
                 </div>
              </div>
            </div>

            {/* 세운 (년운) - 100년치 스크롤 + 중앙 정렬 */}
            <div className="mx-2 mb-4">
               <div className="bg-gray-800 text-white text-xs font-bold px-3 py-1.5 rounded-t-lg">
                  세운 (년운) - {selectedYear}년 선택됨
               </div>
               <div 
                 ref={seunContainerRef}
                 className="bg-white rounded-b-lg border border-gray-200 overflow-x-auto scrollbar-hide"
               >
                  <div className="flex px-2 py-3 w-max">
                     {seunList.map((item) => {
                        const isSelected = item.year === selectedYear;
                        const [s, b] = item.ganji.split("");
                        const sStyle = getOhaengStyles(s);
                        const bStyle = getOhaengStyles(b);
                        
                        return (
                          <div 
                            key={item.year} 
                            id={`year-${item.year}`} // 스크롤 타겟용 ID
                            onClick={() => setSelectedYear(item.year)}
                            className={`flex flex-col items-center mx-1 p-1.5 rounded-lg cursor-pointer transition-all duration-200
                              ${isSelected ? 'bg-gray-100 ring-2 ring-gray-600 scale-110 z-10 shadow-md' : 'hover:bg-gray-50'}
                            `}
                          >
                             <span className={`text-[10px] font-bold mb-1 ${isSelected ? 'text-gray-900' : 'text-gray-400'}`}>{item.year}</span>
                             <div className={`w-8 h-8 mb-1 flex items-center justify-center text-lg font-bold text-white rounded shadow-sm ${sStyle.bg}`}>{s}</div>
                             <div className={`w-8 h-8 flex items-center justify-center text-lg font-bold text-white rounded shadow-sm ${bStyle.bg}`}>{b}</div>
                             <span className="text-[9px] text-gray-400 mt-1">{item.age}세</span>
                          </div>
                        )
                     })}
                  </div>
               </div>
            </div>

            {/* 월운 (선택된 년도에 따라 변경) */}
            <div className="mx-2 mb-10">
               <div className="bg-indigo-500 text-white text-xs font-bold px-3 py-1.5 rounded-t-lg">
                  월운 ({selectedYear}년)
               </div>
               <div className="bg-white rounded-b-lg border border-gray-200 overflow-x-auto scrollbar-hide">
                  <div className="flex px-2 py-3 w-max justify-between min-w-full">
                     {wolunList.map((item) => {
                        const [s, b] = item.ganji.split("");
                        const sStyle = getOhaengStyles(s);
                        const bStyle = getOhaengStyles(b);
                        
                        return (
                          <div key={item.month} className="flex flex-col items-center mx-1.5 min-w-[40px]">
                             <span className="text-[10px] font-bold text-gray-500 mb-1">{item.month}월</span>
                             <div className={`w-8 h-8 mb-1 flex items-center justify-center text-lg font-bold text-white rounded shadow-sm ${sStyle.bg}`}>{s}</div>
                             <div className={`w-8 h-8 flex items-center justify-center text-lg font-bold text-white rounded shadow-sm ${bStyle.bg}`}>{b}</div>
                          </div>
                        )
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
