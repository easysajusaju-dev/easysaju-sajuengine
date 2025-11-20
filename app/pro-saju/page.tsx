"use client";

import React, { useState } from "react";

export default function ProSajuPage() {
  const [input, setInput] = useState({
    year: 1978,
    month: 3,
    day: 24,
    hour: 12,
    minute: 30,
    gender: "F",
  });

  const [debugData, setDebugData] = useState<any>(null);
  const [engineData, setEngineData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startCalc() {
    setLoading(true);
    setError(null);
    setDebugData(null);
    setEngineData(null);

    try {
      // ======================
      // 1) 만세력 디버그 호출
      // ======================
      const qs = new URLSearchParams({
        year: String(input.year),
        month: String(input.month),
        day: String(input.day),
        hour: String(input.hour),
        min: String(input.minute),
        isMale: input.gender === "M" ? "true" : "false",
        pivotMin: "30",
      });

      const debugUrl =
        "https://my-manseryeok.onrender.com/saju/debug?" + qs.toString();

      const res1 = await fetch(debugUrl, { cache: "no-store" });
      if (!res1.ok) throw new Error("만세력 서버 오류");

      const debugJson = await res1.json();
      setDebugData(debugJson);

      const fr = debugJson.finalResult;

      const [yearStem, yearBranch] = fr.yearGanji.split("");
      const [monthStem, monthBranch] = fr.monthGanji.split("");
      const [dayStem, dayBranch] = fr.dayGanji.split("");
      const [hourStem, hourBranch] = fr.hourGanji.split("");

      const birthIso = debugJson.timeCalc.birthAdjusted
        ? `${debugJson.timeCalc.birthAdjusted}:00+09:00`
        : `${debugJson.timeCalc.originalBirth}:00+09:00`;

      // ======================
      // 2) 우리 사주 엔진 호출
      // ======================
      const payload = {
        yearStem,
        yearBranch,
        monthStem,
        monthBranch,
        dayStem,
        dayBranch,
        hourStem,
        hourBranch,
        gender: input.gender,
        birth: birthIso,
        solarTerms: [
          {
            name: fr.termName,
            date: `${debugJson.seasonCalc.rawTermDate}:00+09:00`,
            isPrincipal: true,
          },
        ],
      };

      const res2 = await fetch("/api/saju", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const engineJson = await res2.json();
      if (!engineJson.ok) throw new Error(engineJson.error || "엔진 오류");

      setEngineData(engineJson.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, fontWeight: "bold" }}>전문 사주 엔진 테스트</h1>

      {/* 입력 */}
      <div
        style={{
          padding: 15,
          border: "1px solid #ddd",
          borderRadius: 10,
          marginTop: 20,
          maxWidth: 400,
        }}
      >
        <h3 style={{ marginBottom: 10 }}>입력값</h3>

        {[
          { key: "year", label: "연도" },
          { key: "month", label: "월" },
          { key: "day", label: "일" },
          { key: "hour", label: "시" },
          { key: "minute", label: "분" },
        ].map((f) => (
          <div key={f.key} style={{ marginBottom: 10 }}>
            <label style={{ fontSize: 13 }}>{f.label}</label>
            <input
              type="number"
              value={(input as any)[f.key]}
              onChange={(e) =>
                setInput({ ...input, [f.key]: Number(e.target.value) })
              }
              style={{
                width: "100%",
                padding: 8,
                marginTop: 3,
                borderRadius: 6,
                border: "1px solid #ccc",
              }}
            />
          </div>
        ))}

        <label style={{ fontSize: 13 }}>성별</label>
        <select
          value={input.gender}
          onChange={(e) => setInput({ ...input, gender: e.target.value })}
          style={{
            width: "100%",
            padding: 8,
            borderRadius: 6,
            border: "1px solid #ccc",
            marginTop: 5,
          }}
        >
          <option value="M">남자</option>
          <option value="F">여자</option>
        </select>

        <button
          onClick={startCalc}
          disabled={loading}
          style={{
            marginTop: 15,
            width: "100%",
            padding: 10,
            background: "#007bff",
            color: "white",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          {loading ? "계산 중..." : "사주 분석 실행"}
        </button>

        {error && (
          <div style={{ color: "red", marginTop: 10 }}>
            오류: {error}
          </div>
        )}
      </div>

      {/* ======================
          사주팔자 출력 (엔진 결과)
      ======================= */}
      {engineData && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: "bold" }}>사주 팔자</h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 10,
              marginTop: 20,
            }}
          >
            {[
              { label: "년주", key: "year" },
              { label: "월주", key: "month" },
              { label: "일주", key: "day" },
              { label: "시주", key: "hour" },
            ].map((item) => {
              const ganji = engineData.ganji[item.key];
              const stem = ganji[0];
              const branch = ganji[1];

              return (
                <div
                  key={item.key}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: 10,
                    padding: 15,
                    textAlign: "center",
                    background: "#fafafa",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {item.label}
                  </div>
                  <div style={{ fontSize: 30, fontWeight: "bold" }}>
                    {stem}
                  </div>
                  <div style={{ fontSize: 26 }}>{branch}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================
          대운 출력 (만세력 디버그 결과)
      ======================= */}
      {debugData && (
        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20, fontWeight: "bold" }}>대운</h2>

          <div
            style={{
              display: "flex",
              gap: 10,
              overflowX: "auto",
              marginTop: 15,
              paddingBottom: 10,
            }}
          >
            {debugData.finalResult.daeWoonYear.map((year: number, idx: number) => (
              <div
                key={year}
                style={{
                  minWidth: 100,
                  border: "1px solid #ccc",
                  borderRadius: 10,
                  padding: 10,
                  textAlign: "center",
                  background: "#fafafa",
                }}
              >
                <div style={{ fontSize: 13, color: "#666" }}>{year}년</div>
                <div style={{ fontSize: 20, fontWeight: "bold" }}>
                  {debugData.finalResult.daeWoonGanji[idx]}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
