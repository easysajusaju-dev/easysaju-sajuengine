"use client";

import { useState } from "react";

export default function EasySajuInputCard({ onSubmit, loading }: any) {
  const [gender, setGender] = useState<"M" | "F">("M");
  const [name, setName] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [birthtime, setBirthtime] = useState("");
  const [isLunar, setIsLunar] = useState(false);
  const [isLeap, setIsLeap] = useState(false);
  const [unknownTime, setUnknownTime] = useState(false);

  const handleSubmit = () => {
    if (!name || !birthdate) {
      alert("이름과 생년월일을 입력해주세요!");
      return;
    }

    onSubmit({
      name,
      gender,
      birthdate,
      birthtime,
      isLunar,
      isLeap,
      unknownTime,
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto">

      {/* ====== 배너 ====== */}
      <div className="relative h-40 w-full mb-6">
        <img
          src="https://easysajusaju-dev.github.io/images/card-individual.png"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1d2b50b3] to-[#2c3e5080]" />
        <div className="relative z-10 p-4 text-white">
          <p className="text-sm opacity-90">당신의 운명을 풀어내는 곳</p>
          <h2 className="text-3xl font-bold mt-1">이지사주</h2>
          <p className="text-base opacity-95">만세력 조회</p>
        </div>
      </div>

      {/* ====== 입력 카드 ====== */}
      <div className="bg-white rounded-xl shadow p-5 space-y-4 mb-10">
        {/* 성별 */}
        <div className="grid grid-cols-2 rounded-md bg-gray-100 p-1">
          <button
            className={`py-2 rounded-md font-semibold ${
              gender === "M" ? "bg-white shadow" : "text-gray-500"
            }`}
            onClick={() => setGender("M")}
          >
            남자
          </button>
          <button
            className={`py-2 rounded-md font-semibold ${
              gender === "F" ? "bg-white shadow" : "text-gray-500"
            }`}
            onClick={() => setGender("F")}
          >
            여자
          </button>
        </div>

        {/* 이름 */}
        <input
          className="w-full border rounded-md px-4 py-3 text-base"
          placeholder="이름 (예: 홍길동)"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* 생년월일 */}
        <input
          className="w-full border rounded-md px-4 py-3 text-base"
          placeholder="생년월일 (예: 19780324)"
          value={birthdate}
          onChange={(e) => setBirthdate(e.target.value)}
        />

        {/* 체크박스 */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
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

        {/* 출생시간 */}
        <div className="flex items-center gap-3">
          <input
            className="flex-1 border rounded-md px-4 py-3 text-base"
            placeholder="출생시간 (예: 1230)"
            disabled={unknownTime}
            value={birthtime}
            onChange={(e) => setBirthtime(e.target.value)}
          />

          <label className="flex items-center gap-1 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={unknownTime}
              onChange={(e) => setUnknownTime(e.target.checked)}
            />
            모름
          </label>
        </div>

        <button
          className="w-full bg-[#7c80f5] text-white font-bold py-3 rounded-lg text-lg shadow active:scale-[0.98]"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "계산 중..." : "만세력 계산하기"}
        </button>
      </div>
    </div>
  );
}
