/* ============================
   TYPE DEFINITIONS
===============================*/

export interface SolarTerm {
  name: string;
  date: string;
  isPrincipal: boolean; // 절입 여부
}

export interface SajuInput {
  yearStem: string;
  yearBranch: string;
  monthStem: string;
  monthBranch: string;
  dayStem: string;
  dayBranch: string;
  hourStem: string;
  hourBranch: string;
  gender: "M" | "F";
  birth: string; // ISO format
  solarTerms: SolarTerm[];
}

export interface SajuResult {
  ganji: any;
  sibsung: any;
  twelve: any;
  daewoon: any;
}

/* ============================
   1) 십성 계산
===============================*/

export function getSibsung(dayStem: string, targetStem: string) {
  const stemToElement = {
    갑:"목", 을:"목",
    병:"화", 정:"화",
    무:"토", 기:"토",
    경:"금", 신:"금",
    임:"수", 계:"수",
    "甲":"목","乙":"목",
    "丙":"화","丁":"화",
    "戊":"토","己":"토",
    "庚":"금","辛":"금",
    "壬":"수","癸":"수"
  } as const;

  const yinYang = {
    갑:"양", 을:"음", 병:"양", 정:"음", 무:"양", 기:"음",
    경:"양", 신:"음", 임:"양", 계:"음",
    "甲":"양","乙":"음","丙":"양","丁":"음","戊":"양","己":"음",
    "庚":"양","辛":"음","壬":"양","癸":"음"
  } as const;

  const generate = { 목:"화", 화:"토", 토:"금", 금:"수", 수:"목" };
  const control  = { 목:"토", 토:"수", 수:"화", 화:"금", 금:"목" };

  const dayEl = stemToElement[dayStem];
  const targetEl = stemToElement[targetStem];
  const sameYinYang = yinYang[dayStem] === yinYang[targetStem];

  if (!dayEl || !targetEl) return "미정";

  // 비겁
  if (dayEl === targetEl) return sameYinYang ? "비견" : "겁재";

  // 인성: 나를 생함
  const whoGeneratesMe = { 화:"목", 토:"화", 금:"토", 수:"금", 목:"수" };
  if (whoGeneratesMe[dayEl] === targetEl)
    return sameYinYang ? "정인" : "편인";

  // 식상: 내가 생함
  if (generate[dayEl] === targetEl)
    return sameYinYang ? "식신" : "상관";

  // 관성: 나를 극함
  const whoControlsMe = { 토:"목", 수:"토", 화:"수", 금:"화", 목:"금" };
  if (whoControlsMe[dayEl] === targetEl)
    return sameYinYang ? "정관" : "편관";

  // 재성: 내가 극함
  if (control[dayEl] === targetEl)
    return sameYinYang ? "정재" : "편재";

  return "미정";
}

/* ============================
   2) 순행 / 역행 판단
===============================*/

function isYangStem(stem: string): boolean {
  const yangStems = ["갑","병","무","경","임","甲","丙","戊","庚","壬"];
  return yangStems.includes(stem);
}

export function getDirection(yearStem: string, gender: "M"|"F") {
  const yang = isYangStem(yearStem);
  if ((yang && gender === "M") || (!yang && gender === "F")) return "forward";
  return "reverse";
}

/* ============================
   3) 대운 계산
===============================*/

export function calcDaewoon(
  birthIso: string,
  yearStem: string,
  gender: "M"|"F",
  solarTerms: SolarTerm[]
) {
  const direction = getDirection(yearStem, gender);

  const birth = new Date(birthIso);

  const principals = solarTerms
    .filter(t => t.isPrincipal)
    .map(t => ({ ...t, d: new Date(t.date) }))
    .sort((a,b) => a.d.getTime() - b.d.getTime());

  let ref = principals[0];

  if (direction === "forward") {
    const found = principals.find(t => t.d.getTime() > birth.getTime());
    ref = found ?? principals[principals.length - 1];
  } else {
    for (let i = principals.length - 1; i >= 0; i--) {
      if (principals[i].d.getTime() < birth.getTime()) {
        ref = principals[i];
        break;
      }
    }
  }

  const diffMs = Math.abs(birth.getTime() - ref.d.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  const startAgeFloat = diffDays / 3;
  const startAge = Math.round(startAgeFloat);

  return {
    direction,
    diffDays: Math.round(diffDays * 1000) / 1000,
    startAgeFloat,
    startAge,
    refTermName: ref.name,
    refTermDate: ref.date
  };
}

/* ============================
   4) MASTER FUNCTION
===============================*/

export function calculateSaju(input: SajuInput): SajuResult {

  // 십성
  const sibsung = {
    year: getSibsung(input.dayStem, input.yearStem),
    month: getSibsung(input.dayStem, input.monthStem),
    day: "비견",
    hour: getSibsung(input.dayStem, input.hourStem)
  };

  // ⭐ 십이운성 계산 추가
  const twelve = {
    year: getSibiunseong(input.dayStem, input.yearBranch),
    month: getSibiunseong(input.dayStem, input.monthBranch),
    day: getSibiunseong(input.dayStem, input.dayBranch),
    hour: getSibiunseong(input.dayStem, input.hourBranch)
  };

  // 대운
  const daewoon = calcDaewoon(
    input.birth,
    input.yearStem,
    input.gender,
    input.solarTerms
  );

  return {
    ganji: {
      year: input.yearStem + input.yearBranch,
      month: input.monthStem + input.monthBranch,
      day: input.dayStem + input.dayBranch,
      hour: input.hourStem + input.hourBranch
    },
    sibsung,
    twelve,   // ← ⭐ 반드시 여기에 포함
    daewoon
  };
}

const twelveUnseong = [
  "장생", "목욕", "관대", "임관", "제왕",
  "쇠", "병", "사", "묘", "절", "태", "양"
];
const jangsaengStartMap: Record<string, string> = {
  "갑": "亥", "甲": "亥",
  "을": "酉", "乙": "酉",
  "병": "申", "丙": "申",
  "정": "申", "丁": "申",
  "무": "申", "戊": "申",
  "기": "申", "己": "申",
  "경": "巳", "庚": "巳",
  "신": "卯", "辛": "卯",
  "임": "寅", "壬": "寅",
  "계": "寅", "癸": "寅",
};
export function getSibiunseong(dayStem: string, branch: string) {
  const startBranch = jangsaengStartMap[dayStem];
  if (!startBranch) return "미정";

  const order = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

  const startIndex = order.indexOf(startBranch);
  const targetIndex = order.indexOf(branch);
  if (startIndex === -1 || targetIndex === -1) return "미정";

  // 거리 차이 (순행)
  const diff = (targetIndex - startIndex + 12) % 12;

  return twelveUnseong[diff];
}
