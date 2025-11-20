"use client";

import React, { useState } from "react";

export default function ProSajuPage() {
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function testFetch() {
    setError(null);
    setResult(null);

    try {
      // 🔥 Postman에서 잘됐던 API 주소 그대로 넣기
      const res = await fetch(
        "https://my-manseryeok.onrender.com/saju/debug?year=1978&month=3&day=24&hour=12&min=30&isMale=true",
        { cache: "no-store" }
      );

      if (!res.ok) {
        throw new Error(`HTTP Error: ${res.status}`);
      }

      const json = await res.json();
      setResult(json);
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>테스트 페이지</h1>
      <button
        onClick={testFetch}
        style={{ padding: "8px 16px", background: "#ccc", marginTop: 10 }}
      >
        API 호출 테스트
      </button>

      {error && (
        <div style={{ color: "red", marginTop: 20 }}>에러: {error}</div>
      )}

      {result && (
        <pre
          style={{
            marginTop: 20,
            padding: 10,
            background: "#f0f0f0",
            borderRadius: 6,
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
