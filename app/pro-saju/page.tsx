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
    daeWoonYear: number[];
    seunYear?: number[];
    seunGanji?: string[];
    solarText: string;
    lunarText: string;
    termName: string;
    termDate: string;
  };
}

type BranchKey = "year" | "month" | "day" | "hour";

interface RelationItem {
  from: BranchKey;
  to: BranchKey;
  branches: string; // 예: "午午"
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
    relations?: Relations;
    // 서버 result 안에 sinsal 도 같이 들어옴 (any 로 처리)
    sinsal?: any;
  };
  error?: string;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: "M", label: "남자" },
  { value: "F", label: "여자" },
];

// 천간/지지
const CHEONGAN = "갑을병정무기경신임계";
const JIJI = "자축인묘진사오미신유술해";

// --- 오행 색상 / 스타일 ---
function getOhaengStyles(char: string) {
  const wood = "갑을인묘甲乙寅卯";
  const fire = "병정사오丙丁巳午";
  const earth = "무기진술축미戊己辰戌丑未";
  const metal = "경신신유庚辛申酉";
  const water = "임계해자壬癸亥子";

  if (water.includes(char))
    return { bg: "bg-teal-400", border: "border-teal-600" }; // 수(水)
  if (wood.includes(char))
    return { bg: "bg-green-400", border: "border-green-700" };
  if (fire.includes(char))
    return { bg: "bg-red-400", border: "border-red-700" };
  if (earth.includes(char))
    return { bg: "bg-yellow-300", border: "border-yellow-600" };
  if (metal.includes(char))
    return { bg: "bg-slate-200", border: "border-slate-400" };

  return { bg: "bg-gray-200", border: "border-gray-300" };
}

// 60갑자 배열 생성
const GANJI_60: string[] = [];
for (let i = 0; i < 60; i++) {
  GANJI_60.push(CHEONGAN[i % 10] + JIJI[i % 12]);
}

// 천간 → 한자
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

// 지지 → 한자
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

// 한글 간지 → 한자 간지
function toHanja(ganji: string) {
  const gan = ganji[0];
  const ji = ganji[1];
  const hanGan = HANJA_GAN_MAP[gan] ?? gan;
  const hanJi = HANJA_JI_MAP[ji] ?? ji;
  return hanGan + hanJi;
}

// 특정 연도의 간지 (1984 갑자 기준)
function getGanjiByYear(year: number) {
  const offset = year - 1984;
  let index = offset % 60;
  if (index < 0) index += 60;
  return GANJI_60[index];
}

// 월운 (년두법)
function getMonthlyGanjiList(yearGan: string) {
  const ganIdx = CHEONGAN.indexOf(yearGan);
  if (ganIdx === -1) return [];

  const startStemIdx = (ganIdx % 5) * 2 + 2;
  let currentStemIdx = startStemIdx - 1;
  let currentBranchIdx = 1; // 축(1)부터

  const list: { month: number; ganji: string }[] = [];
  for (let i = 1; i <= 12; i++) {
    const s = CHEONGAN[(currentStemIdx + 10) % 10];
    const b = JIJI[currentBranchIdx % 12];
    list.push({ month: i, ganji: toHanja(s + b) });
    currentStemIdx++;
    currentBranchIdx++;
  }
  return list;
}

// 오행 개수 카운트 (원국 전체)
function countFiveElements(ganji: { [key: string]: string }) {
  const all = Object.values(ganji).join("");
  const result = { 목: 0, 화: 0, 토: 0, 금: 0, 수: 0 };

  for (const ch of all) {
    if ("갑을인묘甲乙寅卯".includes(ch)) result.목++;
    else if ("병정사오丙丁巳午".includes(ch)) result.화++;
    else if ("무기진술축미戊己辰戌丑未".includes(ch)) result.토++;
    else if ("경신신유庚辛申酉".includes(ch)) result.금++;
    else if ("임계해자壬癸亥子".includes(ch)) result.수++;
  }
  return result;
}

// --- 지장간 계산용 테이블 ---
const BRANCH_NORMALIZE: Record<string, string> = {
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
  子: "子",
  丑: "丑",
  寅: "寅",
  卯: "卯",
  辰: "辰",
  巳: "巳",
  午: "午",
  未: "未",
  申: "申",
  酉: "酉",
  戌: "戌",
  亥: "亥",
};

function normBranch(ch: string) {
  return BRANCH_NORMALIZE[ch] ?? ch;
}

// 지장간 표
const HIDDEN_STEMS_BY_BRANCH: Record<string, string[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "戊", "庚"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

function getJijanggan(branchChar: string): string[] {
  const b = normBranch(branchChar);
  return HIDDEN_STEMS_BY_BRANCH[b] ?? [];
}

// --- 메인 컴포넌트 ---
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
  const [engineResult, setEngineResult] =
    useState<EngineResponse["result"] | null>(null);

  // UI 상태
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const seunContainerRef = useRef<HTMLDivElement>(null);
  const COLS = ["hour", "day", "month", "year"] as const;

  // 고급 정보 ON/OFF 체크박스
  const [viewOptions, setViewOptions] = useState({
    five: true,
    hidden: true,
    relations: true,
  });

  const toggleView = (key: keyof typeof viewOptions) => {
    setViewOptions((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // --- API 호출 ---
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (birthdate.length !== 8)
        throw new Error("생년월일 8자리를 입력해주세요.");
      const year = Number(birthdate.slice(0, 4));
      const month = Number(birthdate.slice(4, 6));
      const day = Number(birthdate.slice(6, 8));

      let hour = 0,
        minute = 0;
      if (!unknownTime) {
        if (birthtime.length !== 4)
          throw new Error("출생시간 4자리를 입력해주세요.");
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

      const debugRes = await fetch(
        `https://my-manseryeok.onrender.com/saju/debug?${qs}`
      );
      if (!debugRes.ok) throw new Error("서버 연결 실패");
      const debugJson: ManseryeokDebug = await debugRes.json();
      setDebugData(debugJson);

      const final = debugJson.finalResult;

      const birthIso = debugJson.timeCalc.birthAdjusted
        ? `${debugJson.timeCalc.birthAdjusted}:00+09:00`
        : `${debugJson.timeCalc.originalBirth}:00+09:00`;

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
  }

  // 세운 자동 스크롤
  useEffect(() => {
    if (engineResult && seunContainerRef.current) {
      setTimeout(() => {
        const targetEl = document.getElementById(`year-${selectedYear}`);
        if (targetEl) {
          targetEl.scrollIntoView({
            behavior: "smooth",
            inline: "center",
            block: "nearest",
          });
        }
      }, 300);
    }
  }, [engineResult, selectedYear]);

  // --- 데이터 가공 ---
  const hasResult = !!(debugData && engineResult);
  const currentYear = new Date().getFullYear();
  const birthYear = debugData ? Number(birthdate.slice(0, 4)) : 0;
  const koreanAge = birthYear ? currentYear - birthYear + 1 : 0;

  // 세운 (태어난 해 ~ 100년)
  const seunList: { year: number; age: number; ganji: string }[] = [];
  if (hasResult) {
    for (let i = 0; i <= 100; i++) {
      const y = birthYear + i;
      const g = toHanja(getGanjiByYear(y));
      seunList.push({ year: y, age: 1 + i, ganji: g });
    }
  }

  // 선택된 년도의 월운
  const selectedYearGanjiHangul = hasResult
    ? getGanjiByYear(selectedYear)
    : "갑자";
  const selectedYearStem = selectedYearGanjiHangul[0];
  const wolunList = hasResult ? getMonthlyGanjiList(selectedYearStem) : [];

  // 오행 개수
  const five =
    hasResult && engineResult ? countFiveElements(engineResult.ganji) : null;

  // 지장간
  const hidden =
    hasResult && engineResult
      ? {
          year: getJijanggan(engineResult.ganji.year[1]),
          month: getJijanggan(engineResult.ganji.month[1]),
          day: getJijanggan(engineResult.ganji.day[1]),
          hour: getJijanggan(engineResult.ganji.hour[1]),
        }
      : null;

  // 🔥 신살 (백엔드에서 내려준 값 사용)
  const sinsal =
    hasResult && engineResult && (engineResult as any).sinsal
      ? (engineResult as any).sinsal
      : null;

  const POS_LABEL: Record<BranchKey, string> = {
    year: "년",
    month: "월",
    day: "일",
    hour: "시",
  };

  const formatRelationItem = (r: RelationItem) =>
    `${POS_LABEL[r.from]}-${POS_LABEL[r.to]} (${r.branches})`;

  // ========================= JSX =========================
  return (
    <div className="min-h-screen bg-gray-100 flex justify-center font-sans text-gray-900 select-none">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen md:min-h-0 md:h-auto md:my-5 md:rounded-xl overflow-hidden">
        {/* 헤더 */}
        <header className="bg-indigo-600 text-white px-4 py-3 flex justify-between items-center shadow sticky top-0 z-10">
          <h1 className="font-bold text-lg">이지사주 만세력 Pro</h1>
          <button
            onClick={() => setIsFormOpen(!isFormOpen)}
            className="text-xs bg-white/20 px-3 py-1 rounded hover:bg-white/30 transition"
          >
            {isFormOpen ? "닫기" : "입력 열기"}
          </button>
        </header>

        {/* 에러 메시지 */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs px-4 py-2 border-b border-red-100">
            {error}
          </div>
        )}

        {/* 입력 폼 */}
        {isFormOpen && (
          <div className="p-6 bg-gray-50">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex p-1 bg-gray-200 rounded-lg">
                {genderOptions.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={`flex-1 py-2 rounded-md text-sm font-bold ${
                      gender === g.value
                        ? "bg-white shadow text-indigo-600"
                        : "text-gray-500"
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border rounded-lg text-sm"
                placeholder="이름"
              />

              <input
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value)}
                className="w-full p-3 border rounded-lg text-sm"
                placeholder="생년월일 (예: 19780324)"
                type="tel"
                maxLength={8}
              />

              <div className="flex gap-3 text-sm text-gray-600 justify-end">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={isLunar}
                    onChange={(e) => setIsLunar(e.target.checked)}
                  />
                  음력
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={isLeap}
                    onChange={(e) => setIsLeap(e.target.checked)}
                  />
                  윤달
                </label>
              </div>

              <div className="flex gap-2">
                <input
                  value={birthtime}
                  onChange={(e) => setBirthtime(e.target.value)}
                  disabled={unknownTime}
                  className="flex-1 p-3 border rounded-lg text-sm"
                  placeholder="시간 (예: 1230)"
                  type="tel"
                  maxLength={4}
                />
                <label className="flex items-center gap-2 px-3 border rounded-lg bg-white text-sm">
                  <input
                    type="checkbox"
                    checked={unknownTime}
                    onChange={(e) => setUnknownTime(e.target.checked)}
                  />
                  모름
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-60"
              >
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
                <span className="text-sm text-gray-600">
                  {gender === "M" ? "남" : "여"}, {koreanAge}세
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                (양) {debugData.finalResult.solarText} / (음){" "}
                {debugData.finalResult.lunarText}
              </div>
            </div>

            {/* 원국표 */}
            <div className="mx-2 bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 mb-2">
              {/* 헤더 */}
              <div className="grid grid-cols-4 text-center bg-gray-50 py-2 text-sm font-bold text-gray-700 border-b">
                <div>시주</div>
                <div>일주</div>
                <div>월주</div>
                <div>년주</div>
              </div>

              {/* 천간 */}
              <div className="grid grid-cols-4 border-b border-gray-100 bg-white">
                {COLS.map((col) => {
                  const [stem] = engineResult.ganji[col].split("");
                  const sStyle = getOhaengStyles(stem);
                  const ganSibsung =
                    col === "day"
                      ? "일간(나)"
                      : engineResult.sibsung?.[col] || "-";

                  return (
                    <div
                      key={`stem-${col}`}
                      className="py-2 flex flex-col items-center border-r last:border-r-0 border-gray-100"
                    >
                      <span className="mb-1 text-sm font-bold text-indigo-700">
                        {ganSibsung}
                      </span>
                      <div
                        className={`w-full max-w-[90px] aspect-square flex items-center justify-center text-[2.4rem] font-bold text-black rounded-md shadow-sm border ${sStyle.bg} ${sStyle.border}`}
                      >
                        {stem}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 지지 */}
              <div className="grid grid-cols-4 border-b border-gray-100 bg-white">
                {COLS.map((col) => {
                  const [, branch] = engineResult.ganji[col].split("");
                  const bStyle = getOhaengStyles(branch);

                  return (
                    <div
                      key={`branch-${col}`}
                      className="py-2 flex flex-col items-center border-r last:border-r-0 border-gray-100"
                    >
                      <div
                        className={`w-full max-w-[90px] aspect-square flex items-center justify-center text-[2.4rem] font-bold text-black rounded-md shadow-sm border ${bStyle.bg} ${bStyle.border}`}
                      >
                        {branch}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 지지 십성 */}
              <div className="grid grid-cols-4 border-b border-gray-100 bg-white">
                {COLS.map((col) => {
                  const jiSibsung = engineResult.branchSibsung?.[col] || "-";
                  return (
                    <div
                      key={`ji-sibsung-${col}`}
                      className="py-1.5 flex items-center justify-center border-r last:border-r-0 border-gray-100"
                    >
                      <span className="text-sm font-semibold text-blue-600">
                        {jiSibsung}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* 12운성 */}
              <div className="grid grid-cols-4 bg-white">
                {COLS.map((col) => {
                  const star = engineResult.twelve?.[col] || "-";
                  return (
                    <div
                      key={`twelve-${col}`}
                      className="py-1.5 flex items-center justify-center border-r last:border-r-0 border-gray-100"
                    >
                      <span className="inline-block px-2 py-0.5 rounded-full bg-indigo-600 text-white text-sm font-semibold">
                        {star}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ✅ 고급 정보 체크박스 */}
            <div className="mx-2 mb-2 bg-white rounded-lg border border-gray-200 px-3 py-2 flex flex-wrap gap-3 items-center">
              <span className="text-xs font-semibold text-gray-600">
                표시 설정
              </span>
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={viewOptions.five}
                  onChange={() => toggleView("five")}
                  className="w-3 h-3"
                />
                <span
                  className={
                    viewOptions.five
                      ? "text-indigo-600 font-semibold"
                      : "text-gray-400"
                  }
                >
                  오행 분포
                </span>
              </label>
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={viewOptions.hidden}
                  onChange={() => toggleView("hidden")}
                  className="w-3 h-3"
                />
                <span
                  className={
                    viewOptions.hidden
                      ? "text-indigo-600 font-semibold"
                      : "text-gray-400"
                  }
                >
                  지장간·신살
                </span>
              </label>
              <label className="flex items-center gap-1 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={viewOptions.relations}
                  onChange={() => toggleView("relations")}
                  className="w-3 h-3"
                />
                <span
                  className={
                    viewOptions.relations
                      ? "text-indigo-600 font-semibold"
                      : "text-gray-400"
                  }
                >
                  형·충·파·합
                </span>
              </label>
            </div>

            {/* 오행 분포 */}
            {five && viewOptions.five && (
              <div className="mx-2 mb-3 bg-white rounded-lg p-3 border shadow-sm">
                <div className="text-sm font-bold text-gray-700 mb-2">
                  오행 분포
                </div>
                <div className="flex justify-between text-sm font-semibold text-gray-800">
                  <span>목(木) {five.목}</span>
                  <span>화(火) {five.화}</span>
                  <span>토(土) {five.토}</span>
                  <span>금(金) {five.금}</span>
                  <span>수(水) {five.수}</span>
                </div>
              </div>
            )}

            {/* 지장간 · 신살 (지장간 우선 표시) */}
            {viewOptions.hidden && hidden && (
              <div className="mx-2 mb-3 bg-white rounded-lg border shadow-sm">
                <div className="flex justify-between items-center px-3 py-2 border-b bg-indigo-50">
                  <span className="text-sm font-bold text-gray-800">
                    지장간 · 신살
                  </span>
                  <span className="text-[11px] text-gray-500">
                    (지장간만 우선 적용)
                  </span>
                </div>
                <div className="grid grid-cols-4 text-center text-xs font-bold text-gray-600 border-b py-2">
                  <div>년주</div>
                  <div>월주</div>
                  <div>일주</div>
                  <div>시주</div>
                </div>
                <div className="grid grid-cols-4 text-center text-sm py-2">
                  {[hidden.year, hidden.month, hidden.day, hidden.hour].map(
                    (arr, idx) => (
                      <div key={idx} className="border-r last:border-r-0">
                        {arr.length === 0 ? (
                          <div className="text-gray-400">지장간 없음</div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="font-bold tracking-widest">
                              {arr.join(" ")}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* 🔥 신살 카드 */}
            {viewOptions.hidden && sinsal && (
              <div className="mx-2 mb-3 bg-white rounded-lg border shadow-sm">
                <div className="flex justify-between items-center px-3 py-2 border-b bg-indigo-50">
                  <span className="text-sm font-bold text-gray-800">신살</span>
                  <span className="text-[11px] text-gray-500">원국 기준</span>
                </div>

                <div className="grid grid-cols-4 text-center text-xs font-bold text-gray-600 border-b py-2">
                  <div>년주</div>
                  <div>월주</div>
                  <div>일주</div>
                  <div>시주</div>
                </div>

                <div className="grid grid-cols-4 text-center text-sm py-2">
                  {(["year", "month", "day", "hour"] as BranchKey[]).map(
                    (key) => (
                      <div
                        key={key}
                        className="border-r last:border-r-0 px-1 space-y-0.5"
                      >
                        {sinsal[key] && sinsal[key].length > 0 ? (
                          sinsal[key].map((s: string, idx: number) => (
                            <div
                              key={idx}
                              className="text-[12px] bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded"
                            >
                              {s}
                            </div>
                          ))
                        ) : (
                          <div className="text-gray-400 text-xs">없음</div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* 형·충·파·합 관계표 */}
            {viewOptions.relations && engineResult.relations && (
              <div className="mx-2 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow-sm">
                <div className="px-3 py-1.5 border-b border-yellow-200 flex justify-between items-center">
                  <span className="text-sm font-bold text-gray-800">
                    형·충·파·합 관계표
                  </span>
                  <span className="text-[11px] text-gray-500">
                    원국 4지지 기준
                  </span>
                </div>
                <div className="grid grid-cols-4 text-center text-xs font-bold text-gray-700 bg-yellow-50 py-1">
                  <div>형</div>
                  <div>충</div>
                  <div>파</div>
                  <div>합</div>
                </div>
                <div className="grid grid-cols-4 text-center text-[11px] bg-yellow-50 pb-2">
                  {(["hyung", "chung", "pa", "hap"] as const).map((key) => {
                    const list = (engineResult.relations as any)[key] as
                      | RelationItem[]
                      | undefined;
                    return (
                      <div
                        key={key}
                        className="px-2 border-l border-yellow-200 first:border-l-0"
                      >
                        {list && list.length > 0 ? (
                          list.map((r, idx) => (
                            <div key={idx} className="py-0.5">
                              <span className="inline-block px-1.5 py-0.5 rounded-full bg-white/80 text-gray-800 border border-yellow-300">
                                {formatRelationItem(r)}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="py-1 text-gray-400">-</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 대운 */}
            <div className="mx-2 mb-3">
              <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-t-lg flex justify-between items-center">
                <span>대운 (대운수: {debugData.finalResult.daeNum})</span>
                <span className="opacity-90">
                  {engineResult.daewoon.direction === "forward"
                    ? "순행"
                    : "역행"}
                </span>
              </div>
              <div className="bg-white rounded-b-lg border border-gray-200 px-2 py-1 overflow-x-auto">
                <div className="flex gap-1 min-w-[360px]">
                  {debugData.finalResult.daeWoonYear.map((startYear, i) => {
                    const age = i * 10 + debugData.finalResult.daeNum;
                    const nextAge = age + 10;
                    const isCurrent =
                      koreanAge >= age && koreanAge < nextAge;

                    const [s, b] =
                      debugData.finalResult.daeWoonGanji[i].split("");
                    const sStyle = getOhaengStyles(s);
                    const bStyle = getOhaengStyles(b);

                    return (
                      <div
                        key={i}
                        className={`flex flex-col items-center px-1 py-0.5 rounded-lg transition-all ${
                          isCurrent
                            ? "ring-2 ring-blue-500 bg-blue-50 scale-105 z-10 shadow-md"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`text-[12px] mb-1 font-bold ${
                            isCurrent ? "text-blue-700" : "text-gray-400"
                          }`}
                        >
                          {age}
                        </span>
                        <div
                          className={`w-10 h-10 mb-1 flex items-center justify-center text-xl font-bold text-black rounded border ${sStyle.bg} ${sStyle.border}`}
                        >
                          {s}
                        </div>
                        <div
                          className={`w-10 h-10 flex items-center justify-center text-xl font-bold text-black rounded border ${bStyle.bg} ${bStyle.border}`}
                        >
                          {b}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 세운 (년운) */}
            <div className="mx-2 mb-2">
              <div className="bg-gray-800 text-white text-xs font-bold px-3 py-1 rounded-t-lg">
                세운 (년운) - {selectedYear}년
              </div>
              <div
                ref={seunContainerRef}
                className="bg-white rounded-b-lg border border-gray-200 overflow-x-auto scrollbar-hide"
              >
                <div className="flex px-2 py-1 w-max">
                  {seunList.map((item) => {
                    const isSelected = item.year === selectedYear;
                    const [s, b] = item.ganji.split("");
                    const sStyle = getOhaengStyles(s);
                    const bStyle = getOhaengStyles(b);

                    return (
                      <div
                        key={item.year}
                        id={`year-${item.year}`}
                        onClick={() => setSelectedYear(item.year)}
                        className={`flex flex-col items-center mx-1 px-1 py-0.5 rounded-lg cursor-pointer transition-all duration-200 ${
                          isSelected
                            ? "bg-gray-100 ring-2 ring-gray-700 scale-110 z-10 shadow-md"
                            : "hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`text-[12px] font-bold mb-1 ${
                            isSelected ? "text-gray-900" : "text-gray-400"
                          }`}
                        >
                          {item.year}
                        </span>
                        <div
                          className={`w-10 h-10 mb-1 flex items-center justify-center text-xl font-bold text-black rounded shadow-sm border ${sStyle.bg} ${sStyle.border}`}
                        >
                          {s}
                        </div>
                        <div
                          className={`w-10 h-10 flex items-center justify-center text-xl font-bold text-black rounded shadow-sm border ${bStyle.bg} ${bStyle.border}`}
                        >
                          {b}
                        </div>
                        <span className="text-[12px] text-gray-500 mt-1">
                          {item.age}세
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 월운 */}
            <div className="mx-2 mb-4">
              <div className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-t-lg">
                월운 ({selectedYear}년)
              </div>
              <div className="bg-white rounded-b-lg border border-gray-200 overflow-x-auto scrollbar-hide">
                <div className="flex px-2 py-1 w-max justify-between min-w-full">
                  {wolunList.map((item) => {
                    const [s, b] = item.ganji.split("");
                    const sStyle = getOhaengStyles(s);
                    const bStyle = getOhaengStyles(b);

                    return (
                      <div
                        key={item.month}
                        className="flex flex-col items-center mx-2 min-w-[44px]"
                      >
                        <span className="text-[12px] font-bold text-gray-600 mb-1">
                          {item.month}월
                        </span>
                        <div
                          className={`w-9 h-9 mb-1 flex items-center justify-center text-lg font-bold text-black rounded shadow-sm border ${sStyle.bg} ${sStyle.border}`}
                        >
                          {s}
                        </div>
                        <div
                          className={`w-9 h-9 flex items-center justify-center text-lg font-bold text-black rounded shadow-sm border ${bStyle.bg} ${bStyle.border}`}
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
