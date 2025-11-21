"use client";

import React, { useState, useEffect } from "react";
function getFiveElementStyle(h: string) {
  const el = {
    "갑": "border-green-600 text-green-700",
    "을": "border-green-600 text-green-700",
    "병": "border-red-600 text-red-700",
    "정": "border-red-600 text-red-700",
    "무": "border-yellow-600 text-yellow-700",
    "기": "border-yellow-600 text-yellow-700",
    "경": "border-gray-500 text-gray-600",
    "신": "border-gray-500 text-gray-600",
    "임": "border-blue-600 text-blue-700",
    "계": "border-blue-600 text-blue-700",

    "子": "border-blue-600 text-blue-700",
    "丑": "border-yellow-600 text-yellow-700",
    "寅": "border-green-600 text-green-700",
    "卯": "border-green-600 text-green-700",
    "辰": "border-yellow-600 text-yellow-700",
    "巳": "border-red-600 text-red-700",
    "午": "border-red-600 text-red-700",
    "未": "border-yellow-600 text-yellow-700",
    "申": "border-gray-500 text-gray-600",
    "酉": "border-gray-500 text-gray-600",
    "戌": "border-yellow-600 text-yellow-700",
    "亥": "border-blue-600 text-blue-700",
  };

  return el[h] || "border-gray-300 text-gray-700";
}

// ================================
// KEEP ALIVE
// ================================
function keepAlive() {
  const targets = [
    "https://my-manseryeok.onrender.com/ping",
    "https://saju-proxy.onrender.com/ping"
  ];

  targets.forEach((url) => {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 2000);

      fetch(url, {
        method: "GET",
        signal: controller.signal,
        cache: "no-store",
      }).catch(() => {});
    } catch (e) {}
  });
}

if (typeof window !== "undefined") {
  keepAlive();
  setInterval(() => keepAlive(), 15000);
}

// ================================
// Types (서버가 내려주는 최종 JSON)
// ================================
interface SajuServerResponse {
  ok: boolean;
  result?: {
    ganji: { year: string; month: string; day: string; hour: string };
    sibsung: { year: string; month: string; day: string; hour: string };
    branchSibsung: { year: string; month: string; day: string; hour: string };
    twelve: { year: string; month: string; day: string; hour: string };
    relations: {
      hyung: any[];
      chung: any[];
      pa: any[];
      hap: any[];
    };
    daewoon: { startAge: number; direction: "forward" | "reverse" };
  };
  error?: string;
}

// 지장간
const JIJANGGAN: Record<string, string[]> = {
  子: ["壬", "癸"],
  丑: ["癸", "辛", "己"],
  寅: ["戊", "丙", "甲"],
  卯: ["甲", "乙"],
  辰: ["乙", "癸", "戊"],
  巳: ["戊", "庚", "丙"],
  午: ["丙", "己", "丁"],
  未: ["丁", "乙", "己"],
  申: ["戊", "壬", "庚"],
  酉: ["庚", "辛"],
  戌: ["辛", "丁", "戊"],
  亥: ["戊", "甲", "壬"],
};

// 납음은 그대로 유지 (생략)
const NABEUM: Record<string, string> = {};
function getNabeum(g: string) { return NABEUM[g] || ""; }

function getKoreanChar(h: string) {
  const m: Record<string, string> = {
    甲:"갑", 乙:"을", 丙:"병", 丁:"정", 戊:"무", 己:"기",
    庚:"경", 辛:"신", 壬:"임", 癸:"계",
    子:"자", 丑:"축", 寅:"인", 卯:"묘", 辰:"진", 巳:"사",
    午:"오", 未:"미", 申:"신", 酉:"유", 戌:"술", 亥:"해"
  };
  return m[h] || h;
}

type Gender = "M" | "F";

// ================================
// MAIN PAGE
// ================================
export default function ProSajuPage() {

  const [gender, setGender] = useState<Gender>("F");
  const [name, setName] = useState("홍길동");
  const [birthdate, setBirthdate] = useState("19900101");
  const [birthtime, setBirthtime] = useState("1200");
  const [isLunar, setIsLunar] = useState(true);
  const [isLeap, setIsLeap] = useState(false);
  const [unknownTime, setUnknownTime] = useState(false);

  const [viewMode, setViewMode] = useState<"input" | "result">("input");
  const [loading, setLoading] = useState(false);

  const [saju, setSaju] = useState<SajuServerResponse["result"] | null>(null);

  function resetAll() {
    setViewMode("input");
    setSaju(null);
  }

  // ===============================
  // 서버에 원시 입력만 보내고 → 전체 사주 JSON을 받는 구조
  // ===============================
  async function handleSubmit() {
    setLoading(true);

    const payload = {
      birth: {
        year: Number(birthdate.slice(0, 4)),
        month: Number(birthdate.slice(4, 6)),
        day: Number(birthdate.slice(6, 8)),
        hour: unknownTime ? 0 : Number(birthtime.slice(0, 2)),
        minute: unknownTime ? 0 : Number(birthtime.slice(2, 4)),
        isLunar,
        isLeap
      },
      gender
    };

    try {
      const res = await fetch("https://my-manseryeok.onrender.com/saju/full", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json: SajuServerResponse = await res.json();
      if (!json.ok) throw new Error(json.error);

      setSaju(json.result!);
      setViewMode("result");

    } catch (e) {
      alert("오류: " + e);
    }

    setLoading(false);
  }

  // ===============================
  // Column Builder
  // ===============================
  const getColumnData = (col: "year" | "month" | "day" | "hour") => {
    if (!saju) return null;

    const ganji = saju.ganji[col];
    const stem = ganji[0];
    const branch = ganji[1];

    const jijanggan = JIJANGGAN[branch] || [];

    const rels = saju.relations;
    const myRelations: string[] = [];

    ["hyung", "chung", "pa", "hap"].forEach((key) => {
      for (const r of (rels as any)[key]) {
        if (r.from === col || r.to === col) {
          if (!myRelations.includes(r.kind)) myRelations.push(r.kind);
        }
      }
    });

    return {
      ganji,
      ganjiKor: getKoreanChar(stem) + getKoreanChar(branch),
      stem,
      branch,
      stemSibsung: saju.sibsung[col],
      branchSibsung: saju.branchSibsung[col],
      twelve: saju.twelve[col],
      jijanggan,
      relations: myRelations.join(",") || "-"
    };
  };

  // ===============================
  // UI 렌더링 
  // ===============================
  return (
    <div className="min-h-screen bg-gray-50 flex justify-center">
      <div className="w-full max-w-md bg-white shadow-xl min-h-screen flex flex-col">

        {/* HEADER */}
        <header className="bg-indigo-600 text-white px-4 py-3 text-center font-bold">
          만세력 천을귀인 PRO (통합엔진 버전)
        </header>

        {/* INPUT VIEW */}
        {viewMode === "input" && (
          <div className="p-6 space-y-8">
            
            <div className="text-center font-semibold text-gray-600">
              출생 정보를 입력하세요
            </div>

            {/* 성별 */}
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" checked={gender === "M"} onChange={() => setGender("M")} /> 남자
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" checked={gender === "F"} onChange={() => setGender("F")} /> 여자
              </label>
            </div>

            {/* 생년월일 */}
            <div>
              <div className="font-medium mb-1">생년월일</div>
              <input
                value={birthdate}
                onChange={(e) => setBirthdate(e.target.value.replace(/\D/g, ""))}
                className="border w-full p-2 rounded"
              />
              <div className="mt-2 flex gap-4 text-sm">
                <label><input type="checkbox" checked={isLunar} onChange={(e)=>setIsLunar(e.target.checked)} /> 음력</label>
                <label><input type="checkbox" checked={isLeap} onChange={(e)=>setIsLeap(e.target.checked)} /> 윤달</label>
              </div>
            </div>

            {/* 출생시간 */}
            <div>
              <div className="font-medium mb-1">출생시간</div>
              <input
                value={birthtime}
                disabled={unknownTime}
                onChange={(e)=>setBirthtime(e.target.value.replace(/\D/g,""))}
                className="border w-full p-2 rounded disabled:bg-gray-100"
              />
              <label className="text-sm mt-2 block">
                <input type="checkbox" checked={unknownTime} onChange={(e)=>setUnknownTime(e.target.checked)} /> 모름
              </label>
            </div>

            {/* 버튼 */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-500 text-white py-3 rounded font-bold"
            >
              {loading ? "계산중…" : "사주 조회"}
            </button>

          </div>
        )}

        {/* RESULT VIEW */}
        {viewMode === "result" && saju && (
          <div className="p-4 space-y-4">

            <div className="font-bold text-lg text-center text-indigo-700">
              {name}님의 사주 결과
            </div>

            {/* 사주 원국 */}
            <div className="grid grid-cols-4 border">
              {(["hour", "day", "month", "year"] as const).map((col) => {
                const d = getColumnData(col);
                return (
                  <div key={col} className="p-2 border text-center">
                    <div>{col === "hour" ? "시주" : col === "day" ? "일주" : col === "month" ? "월주" : "년주"}</div>
                    <div className="text-xl font-bold">{d?.ganji}</div>
                    <div className="text-sm text-gray-500">{d?.ganjiKor}</div>
                    <div className="mt-2 text-sm">{d?.stemSibsung}</div>
                    <div className="text-sm">{d?.branchSibsung}</div>
                    <div className="text-sm">{d?.twelve}</div>
                    <div className="text-xs text-red-500">{d?.relations}</div>
                  </div>
                );
              })}
            </div>

            {/* 대운 */}
            <div className="p-3 bg-gray-100 rounded text-center">
              <div className="font-bold mb-1">
                대운 시작나이: {saju.daewoon.startAge}세  
              </div>
              <div className="text-sm text-gray-600">
                ({saju.daewoon.direction === "forward" ? "순행" : "역행"})
              </div>
            </div>

            <button
              onClick={resetAll}
              className="w-full bg-orange-400 text-white py-3 rounded font-bold"
            >
              새로운 입력
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
