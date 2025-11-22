console.log("📤 엔진으로 보낸 값:", enginePayload);

// src/hooks/useSaju.ts
import { useState } from "react";

// 입력 데이터 타입
export interface SajuInput {
  name?: string;
  gender: "M" | "F";
  birthdate: string; // "19780324"
  birthtime: string; // "1230"
  isLunar: boolean;
  isLeap: boolean;
  unknownTime: boolean;
}

// 결과 데이터 타입 (디버그 정보 + 엔진 분석 결과 합침)
export interface SajuResult {
  debugData: any;    // 만세력 서버의 원본 데이터 (대운수, 절기 등)
  engineResult: any; // 분석된 데이터 (십신, 12운성, 신살 등)
}

export function useSaju() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SajuResult | null>(null);

  const executeSaju = async (input: SajuInput) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 1. 입력값 파싱
      const year = Number(input.birthdate.slice(0, 4));
      const month = Number(input.birthdate.slice(4, 6));
      const day = Number(input.birthdate.slice(6, 8));
      let hour = 0;
      let minute = 0;
      
      if (!input.unknownTime) {
        hour = Number(input.birthtime.slice(0, 2));
        minute = Number(input.birthtime.slice(2, 4));
      }

      // 2. 쿼리 스트링 생성
      const qs = new URLSearchParams({
        year: String(year),
        month: String(month),
        day: String(day),
        hour: String(hour),
        min: String(minute),
        isLunar: String(input.isLunar),
        leap: String(input.isLeap),
        isMale: input.gender === "M" ? "true" : "false",
        pivotMin: "30",
        tzAdjust: "-30",
        seasonAdjust: "0",
      });

      // 3. 만세력 서버 호출 (기본 데이터 확보)
      const debugRes = await fetch(`https://my-manseryeok.onrender.com/saju/debug?${qs}`);
      if (!debugRes.ok) throw new Error("만세력 서버 연결 실패");
      const debugJson = await debugRes.json();

      // 4. 분석 엔진 호출을 위한 데이터 가공
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
        gender: input.gender,
        birth: birthIso,
        solarTerms: [{ 
            name: final.termName, 
            date: `${debugJson.seasonCalc.rawTermDate}:00+09:00`, 
            isPrincipal: true 
        }],
      };

      // 5. Next.js 분석 엔진 호출 (API Route)
      const engineRes = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(enginePayload),
      });

      if (!engineRes.ok) throw new Error("분석 엔진 오류");
      const engineJson = await engineRes.json();
      
      if (!engineJson.ok) throw new Error(engineJson.error || "분석 실패");

      // 6. 결과 저장
      setResult({
        debugData: debugJson,
        engineResult: engineJson.result
      });
      
      return { debugData: debugJson, engineResult: engineJson.result }; // 함수 호출한 곳으로 바로 리턴도 해줌

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { executeSaju, result, loading, error };
}
