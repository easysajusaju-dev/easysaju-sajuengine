"use client";

import React, { useState } from "react";

type Gender = "M" | "F";

interface EngineResult {
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
}

interface EngineResponse {
  ok: boolean;
  result?: EngineResult;
  error?: string;
}

interface ManseryeokFinal {
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
  solarText: string;
  lunarText: string;
  termName: string;
  termDate: string;
}

interface ManseryeokDebug {
  input: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    isMale: boolean;
  };
  timeCalc: {
    originalBirth: string;
    birthAdjusted: string;
  };
  seasonCalc: {
    rawTermName: string;
    rawTermDate: string;
  };
  daeCalc: {
    daeNum: number;
  };
  finalResult: ManseryeokFinal;
}

// my-manseryeok 디버그 URL 구성
function buildDebugUrl({
  year,
  month,
  day,
  hour,
  minute,
  gender,
}: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  gender: Gender;
}) {
  const qs = new URLSearchParams({
    year: String(year),
    month: String(month),
    day: String(day),
    hour: String(hour),
    min: String(minute),
    isMale: gender === "M" ? "true" : "false",
    isLunar: "false",
    leap: "false",
    pivotMin: "30",
    tzAdjust: "-30",
    seasonAdjust: "0",
  });

  return `https://my-manseryeok.onrender.com/saju/debug?${qs.toString()}`;
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: "M", label: "남자" },
  { value: "F", label: "여자" },
];

export default function ProSajuPage() {
  const [name, setName] = useState("테스트");
  const [gender, setGender] = useState<Gender>("F");
  const [birthYmd, setBirthYmd] = useState("19780324"); // YYYYMMDD
  const [birthTime, setBirthTime] = useState("1230"); // HHmm

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [debugData, setDebugData] = useState<ManseryeokDebug | null>(null);
  const [engineResult, setEngineResult] = useState<EngineResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // 입력 검증
    const ymd = birthYmd.trim();
    const hm = birthTime.trim();

    if (!/^\d{8}$/.test(ymd)) {
      setError("생년월일을 8자리 숫자로 입력해주세요. (예: 19780324)");
      return;
    }
    if (!/^\d{4}$/.test(hm)) {
      setError("출생시간을 4자리 숫자로 입력해주세요. (예: 1230)");
      return;
    }

    const year = Number(ymd.slice(0, 4));
    const month = Number(ymd.slice(4, 6));
    const day = Number(ymd.slice(6, 8));
    const hour = Number(hm.slice(0, 2));
    const minute = Number(hm.slice(2, 4));

    if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) {
      setError("유효한 날짜/시간을 입력해주세요.");
      return;
    }

    setLoading(true);
    setDebugData(null);
    setEngineResult(null);

    try {
      // 1) 만세력 디버그 호출
      const debugUrl = buildDebugUrl({ year, month, day, hour, minute, gender });
      const debugRes = await fetch(debugUrl, { cache: "no-store" });
      if (!debugRes.ok) {
        throw new Error(`만세력 서버 오류 (${debugRes.status})`);
      }
      const debugJson = (await debugRes.json()) as ManseryeokDebug;
      setDebugData(debugJson);

      const final = debugJson.finalResult;

      // 2) 우리 사주엔진 호출 (대운수는 여기 startAge 사용!)
      const [yearStem, yearBranch] = final.yearGanji.split("");
      const [monthStem, monthBranch] = final.monthGanji.split("");
      const [dayStem, dayBranch] = final.dayGanji.split("");
      const [hourStem, hourBranch] = final.hourGanji.split("");

      const birthIso = debugJson.timeCalc.birthAdjusted
        ? `${debugJson.timeCalc.birthAdjusted}:00+09:00`
        : `${debugJson.timeCalc.originalBirth}:00+09:00`;

      const payload = {
        yearStem,
        yearBranch,
        monthStem,
        monthBranch,
        dayStem,
        dayBranch,
        hourStem,
        hourBranch,
        gender,
        birth: birthIso,
        solarTerms: [
          {
            name: final.termName,
            date: `${debugJson.seasonCalc.rawTermDate || final.termDate}:00+09:00`,
            isPrincipal: true,
          },
        ],
      };

      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const engineJson = (await engineRes.json()) as EngineResponse;
      if (!engineJson.ok || !engineJson.result) {
        throw new Error(engineJson.error || "사주 엔진 오류");
      }

      setEngineResult(engineJson.result);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const final = debugData?.finalResult;
  const daeStartAge = engineResult?.daewoon.startAge; // 우리 로직 대운수
  const daeDirection = engineResult?.daewoon.direction === "reverse" ? "역행" : "순행";

  return (
    <div className="min-h-screen bg-slate-100 flex justify-center px-3 py-6">
      <div className="w-full max-w-md bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        {/* 상단 파란 헤더 – 타사 앱 느낌 */}
        <div className="bg-indigo-600 text-white px-4 py-3">
          <div className="text-lg font-semibold">이지사주 전문 만세력</div>
          <div className="mt-1 text-xs text-indigo-100">
            (테스트용) my-manseryeok + 이지사주 사주엔진
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="px-4 py-4 space-y-4 text-sm">
          {/* 입력 폼 */}
          <section>
            <h2 className="text-base font-semibold mb-3">
              기본 입력양식 · <span className="text-blue-600">pivot -30분</span>
            </h2>

            <form className="space-y-3" onSubmit={handleSubmit}>
              {/* 성별 */}
              <div className="flex items-center gap-4">
                <div className="font-medium w-16">성별</div>
                <div className="flex gap-4">
                  {genderOptions.map((g) => (
                    <label key={g.value} className="flex items-center gap-1">
                      <input
                        type="radio"
                        name="gender"
                        value={g.value}
                        checked={gender === g.value}
                        onChange={() => setGender(g.value)}
                      />
                      <span>{g.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* 이름 */}
              <div className="flex items-center gap-4">
                <div className="font-medium w-16">이름</div>
                <input
                  type="text"
                  className="flex-1 border border-slate-300 rounded px-2 py-1 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={20}
                  placeholder="입력하세요(최대 20자)"
                />
              </div>

              {/* 생년월일 */}
              <div className="flex items-center gap-4">
                <div className="font-medium w-16">생년월일</div>
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="text"
                    className="border border-slate-300 rounded px-2 py-1 text-sm"
                    value={birthYmd}
                    onChange={(e) => setBirthYmd(e.target.value)}
                    placeholder="예: 19780324"
                  />
                  <div className="flex gap-3 text-xs text-slate-600">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" disabled /> <span>음력</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input type="checkbox" disabled /> <span>윤달</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 출생시간 */}
              <div className="flex items-center gap-4">
                <div className="font-medium w-16">출생시간</div>
                <div className="flex-1 flex flex-col gap-1">
                  <input
                    type="text"
                    className="border border-slate-300 rounded px-2 py-1 text-sm"
                    value={birthTime}
                    onChange={(e) => setBirthTime(e.target.value)}
                    placeholder="예: 1230"
                  />
                  <div className="flex gap-3 text-xs text-slate-600">
                    <label className="flex items-center gap-1">
                      <input type="checkbox" disabled /> <span>모름</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* 버튼 + 에러 */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-slate-400 text-white font-semibold rounded-md py-2 text-sm"
                >
                  {loading ? "분석 중..." : "사주 분석 실행"}
                </button>
              </div>

              {error && (
                <div className="text-xs text-red-500 bg-red-50 border border-red-200 rounded px-2 py-1">
                  {error}
                </div>
              )}
            </form>
          </section>

          {/* 결과 섹션들 – 실제 호출 후에만 보이게 */}
          {final && (
            <>
              {/* 요약 */}
              <section className="border-t border-slate-200 pt-3">
                <h3 className="text-sm font-semibold mb-2">기본 정보</h3>
                <div className="text-xs text-slate-700 space-y-1">
                  <div>
                    <span className="font-medium">양력:</span> {final.solarText}
                  </div>
                  <div>
                    <span className="font-medium">음력:</span> {final.lunarText}
                  </div>
                  <div>
                    <span className="font-medium">절기:</span> {final.termName} (
                    {final.termDate})
                  </div>
                </div>
              </section>

              {/* 사주 팔자 – 타사 레이아웃 비슷하게 */}
              <section className="border-t border-slate-200 pt-3">
                <h3 className="text-base font-semibold mb-3">사주 팔자</h3>

                <div className="grid grid-cols-4 gap-2 text-center text-xs">
                  {[
                    {
                      key: "hour",
                      label: "시주",
                      ganji: final.hourGanji,
                      god: final.hourGod,
                    },
                    {
                      key: "day",
                      label: "일주(나)",
                      ganji: final.dayGanji,
                      god: final.dayGod,
                    },
                    {
                      key: "month",
                      label: "월주",
                      ganji: final.monthGanji,
                      god: final.monthGod,
                    },
                    {
                      key: "year",
                      label: "년주",
                      ganji: final.yearGanji,
                      god: final.yearGod,
                    },
                  ].map((col) => (
                    <div
                      key={col.key}
                      className="flex flex-col items-center gap-1 bg-slate-50 border border-slate-200 rounded-md py-2"
                    >
                      <div className="text-[11px] text-slate-600">{col.label}</div>
                      <div className="w-12 h-16 bg-slate-900 text-white flex items-center justify-center text-3xl font-bold rounded">
                        {col.ganji}
                      </div>
                      <div className="text-[11px] text-blue-700">{col.god}</div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 대운 – 대운수는 우리 엔진 startAge 사용 */}
              {final.daeWoonYear && engineResult && (
                <section className="border-t border-slate-200 pt-3 pb-2">
                  <h3 className="text-base font-semibold mb-2">
                    전통나이
                    {daeStartAge !== undefined && (
                      <>
                        {" "}
                        <span className="text-sm font-normal text-slate-600">
                          (대운수: {daeStartAge}, {daeDirection})
                        </span>
                      </>
                    )}
                  </h3>

                  <div className="flex gap-2 overflow-x-auto pb-1 text-xs">
                    {final.daeWoonYear.map((y, idx) => (
                      <div
                        key={y}
                        className="min-w-[72px] rounded-md border border-slate-300 bg-slate-50 px-2 py-1 text-center"
                      >
                        <div className="text-[11px] text-slate-600">{y}년</div>
                        <div className="mt-1 text-lg font-semibold text-emerald-700">
                          {final.daeWoonGanji[idx]}
                        </div>
                        <div className="mt-1 text-[10px] text-slate-500">
                          {final.daeWoon[idx] || ""}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
