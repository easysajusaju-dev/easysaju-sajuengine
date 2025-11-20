"use client";

import React from "react";

export default function ProSajuPage() {
  return (
    <div className="w-full flex justify-center bg-[#f5f5f5] min-h-screen py-6">
      <div className="w-[390px] bg-white rounded-xl shadow-md overflow-hidden">

        {/* 인적사항 박스 */}
        <div className="p-5 border-b">
          <div className="text-lg font-bold mb-1">홍길동 (남자)</div>
          <div className="text-sm text-gray-600">1978년 03월 24일 12:30</div>
          <div className="text-sm text-gray-600">양력 / 음력(평달)</div>
        </div>

        {/* 원국 4주 */}
        <div className="p-5">
          <div className="text-lg font-bold mb-3">원국(四柱)</div>

          <div className="grid grid-cols-4 text-center border rounded-lg overflow-hidden">
            {["년주", "월주", "일주", "시주"].map((t, i) => (
              <div key={i} className="bg-gray-100 py-2 text-sm font-medium border-b">
                {t}
              </div>
            ))}

            {/* 천간 */}
            {["癸", "丙", "丁", "丁"].map((gan, i) => (
              <div key={i} className="py-3 text-xl font-bold border-r last:border-r-0">
                {gan}
              </div>
            ))}

            {/* 지지 */}
            {["丑", "辰", "丑", "未"].map((ji, i) => (
              <div key={i} className="py-3 text-xl font-bold border-t border-r last:border-r-0">
                {ji}
              </div>
            ))}
          </div>
        </div>

        {/* 지장간 / 십성 / 12운성 */}
        <div className="px-5 pb-5 space-y-4">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="text-xs text-gray-500">지장간</div>
            <div className="text-xs text-gray-500">십성</div>
            <div className="text-xs text-gray-500">지지십성</div>
            <div className="text-xs text-gray-500">12운성</div>

            {[
              ["癸 辛 己", "편관", "식신", "묘지"],
              ["乙 癸 戊", "겁재", "상관", "쇠지"],
              ["癸 辛 己", "비견", "식신", "묘지"],
              ["乙 丁 己", "비견", "식신", "관대"],
            ].map((row, idx) => (
              <React.Fragment key={idx}>
                <div className="py-1 text-sm">{row[0]}</div>
                <div className="py-1 text-sm">{row[1]}</div>
                <div className="py-1 text-sm">{row[2]}</div>
                <div className="py-1 text-sm">{row[3]}</div>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 대운 */}
        <div className="p-5 border-t">
          <div className="text-lg font-bold mb-3">대운 (2세 시작 · 역행)</div>

          <div className="overflow-x-auto">
            <div className="flex gap-3">
              {[
                { year: 1980, ganji: "乙卯" },
                { year: 1990, ganji: "甲寅" },
                { year: 2000, ganji: "癸丑" },
                { year: 2010, ganji: "壬子" },
                { year: 2020, ganji: "辛亥" },
                { year: 2030, ganji: "庚戌" },
              ].map((d, i) => (
                <div
                  key={i}
                  className="min-w-[80px] p-2 border rounded-lg text-center bg-gray-50"
                >
                  <div className="text-sm text-gray-500">{d.year}년</div>
                  <div className="text-lg font-bold">{d.ganji}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 세운 */}
        <div className="p-5 border-t">
          <div className="text-lg font-bold mb-3">세운</div>

          <div className="grid grid-cols-5 text-center gap-2 text-sm">
            {["2021", "2022", "2023", "2024", "2025"].map((y, i) => (
              <div key={i} className="p-2 border rounded bg-gray-50">
                <div className="text-gray-500">{y}</div>
                <div className="font-bold">癸卯</div>
              </div>
            ))}
          </div>
        </div>

        {/* 월운 */}
        <div className="p-5 border-t">
          <div className="text-lg font-bold mb-3">월운</div>

          <div className="grid grid-cols-6 text-center gap-2 text-sm">
            {[
              ["1월", "丙子"],
              ["2월", "丁丑"],
              ["3월", "戊寅"],
              ["4월", "己卯"],
              ["5월", "庚辰"],
              ["6월", "辛巳"],
            ].map(([m, g], idx) => (
              <div key={idx} className="p-2 border rounded bg-gray-50">
                <div className="text-gray-500">{m}</div>
                <div className="font-bold">{g}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 버튼 */}
        <div className="p-5 flex gap-3">
          <button className="flex-1 py-3 bg-blue-600 text-white rounded-md text-sm font-bold">
            상세해설 보기
          </button>
          <button className="flex-1 py-3 bg-gray-200 text-gray-800 rounded-md text-sm font-bold">
            PDF 저장
          </button>
        </div>
      </div>
    </div>
  );
}
