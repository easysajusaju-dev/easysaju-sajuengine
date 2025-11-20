/* ===========================================
   TYPE DEFINITIONS
=========================================== */
export interface SolarTerm {
  name: string;
  date: string;
  isPrincipal: boolean;
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
  birth: string;
  solarTerms: SolarTerm[];
}

export interface SajuResult {
  ganji: any;
  sibsung: any;
  branchSibsung: any;
  twelve: any;
  daewoon: any;
}

/* ===========================================
   1. 음양 & 오행 매핑
=========================================== */

// 천간 음양
const stemYinYang: Record<string, "양" | "음"> = {
  "갑": "양","을": "음","병": "양","정": "음","무": "양","기": "음","경": "양","신": "음","임": "양","계": "음",
  "甲": "양","乙": "음","丙": "양","丁": "음","戊": "양","己": "음","庚": "양","辛": "음","壬": "양","癸": "음",
};

// 천간 오행
const stemElement: Record<string, "목"|"화"|"토"|"금"|"수"> = {
  갑:"목", 을:"목", 甲:"목", 乙:"목",
  병:"화", 정:"화", 丙:"화", 丁:"화",
  무:"토", 기:"토", 戊:"토", 己:"토",
  경:"금", 신:"금", 庚:"금", 辛:"금",
  임:"수", 계:"수", 壬:"수", 癸:"수",
};

// 🔥 너가 정한 지지 음양 (한글 + 한자 둘 다 지원)
const branchYinYang: Record<string,"양"|"음"> = {
  // 한글
  "자":"음","축":"음","인":"양","묘":"음","진":"양","사":"양","오":"음","미":"음","신":"양","유":"음","술":"양","해":"양",
  // 한자
  "子":"음","丑":"음","寅":"양","卯":"음","辰":"양","巳":"양","午":"음","未":"음","申":"양","酉":"음","戌":"양","亥":"양",
};

// 지지 오행 (한글 + 한자)
const branchElement: Record<string,"목"|"화"|"토"|"금"|"수"> = {
  // 한글
  "자":"수","축":"토","인":"목","묘":"목","진":"토","사":"화","오":"화","미":"토","신":"금","유":"금","술":"토","해":"수",
  // 한자
  "子":"수","丑":"토","寅":"목","卯":"목","辰":"토","巳":"화","午":"화","未":"토","申":"금","酉":"금","戌":"토","亥":"수",
};

/* ===========================================
   2. 십성 계산 (천간 / 지지 공통)
   ─ 네가 올린 규칙 그대로 사용 ─
=========================================== */

const generate = { 목:"화", 화:"토", 토:"금", 금:"수", 수:"목" }; // 내가 생하는 오행
const control  = { 목:"토", 토:"수", 수:"화", 화:"금", 금:"목" }; // 내가 극하는 오행

export function getSibsung(dayStem: string, target: string, isBranch = false): string {
  const myEl = stemElement[dayStem];
  const myYY = stemYinYang[dayStem];

  const targetEl = isBranch ? branchElement[target] : stemElement[target];
  const targetYY = isBranch ? branchYinYang[target] : stemYinYang[target];

  if (!myEl || !targetEl || !myYY || !targetYY) return "미정";

  const sameYinYang = (myYY === targetYY);

  // ① 오행 같음 → 비겁
  if (myEl === targetEl) {
    return sameYinYang ? "비견" : "겁재";
  }

  // ② 일간이 생(生)함 → 식상
  if (generate[myEl] === targetEl) {
    return sameYinYang ? "식신" : "상관";
  }

  // ③ 일간이 극(剋)함 → 재성
  if (control[myEl] === targetEl) {
    return sameYinYang ? "편재" : "정재";
  }

  // ④ 일간을 극(剋)함 → 관성
  const whoControlsMe = { 목:"금", 화:"수", 토:"목", 금:"화", 수:"토" };
  if (whoControlsMe[myEl] === targetEl) {
    return sameYinYang ? "편관" : "정관";
  }

  // ⑤ 일간을 생(生)함 → 인성
  const whoGeneratesMe = { 목:"수", 화:"목", 토:"화", 금:"토", 수:"금" };
  if (whoGeneratesMe[myEl] === targetEl) {
    return sameYinYang ? "편인" : "정인";
  }

  return "미정";
}

/* ===========================================
   3. 십이운성 (각 기둥의 "천간" 기준)
   ─ 이 사주 기준 정답:
   년: 장생, 월: 건록, 일: 절, 시: 장생
=========================================== */

const twelveUnseong = [
  "장생","목욕","관대","건록", // ★ 건록으로 표기
  "제왕","쇠","병","사","묘","절","태","양",
];

// 일간(또는 각 기둥의 천간)별 장생 시작지
// 지금은 네가 확인한 乙, 戊, 壬 중심으로 먼저 맞춰둠.
// (다른 간은 필요할 때 하나씩 추가해도 돼)
const jangStart: Record<string,string> = {
  "을":"子","乙":"子", // 乙 일간: 子에서 장생 시작 → 卯=건록, 酉=절
  "무":"午","戊":"午", // 戊: 午에서 장생 시작
  "임":"午","壬":"午", // 壬: 午에서 장생 시작
};

const branchOrder = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

export function getTwelve(stem: string, branch: string): string {
  const startBranch = jangStart[stem];
  if (!startBranch) return "미정";

  // branch 가 한글(오, 묘 등)으로 들어오면 한자 대응으로 바꿔줌
  const hangulToHanja: Record<string,string> = {
    "자":"子","축":"丑","인":"寅","묘":"卯","진":"辰","사":"巳",
    "오":"午","미":"未","신":"申","유":"酉","술":"戌","해":"亥",
  };
  const b = branchOrder.includes(branch) ? branch : (hangulToHanja[branch] ?? branch);

  const sIdx = branchOrder.indexOf(startBranch);
  const tIdx = branchOrder.indexOf(b);
  if (sIdx === -1 || tIdx === -1) return "미정";

  const diff = (tIdx - sIdx + 12) % 12;
  return twelveUnseong[diff];
}

/* ===========================================
   4. 대운 계산 (앞에서 이미 맞춰둔 로직)
=========================================== */

function isYangStem(stem: string): boolean {
  return stemYinYang[stem] === "양";
}

export function getDirection(yearStem: string, gender: "M"|"F") {
  const yang = isYangStem(yearStem);
  if ((yang && gender === "M") || (!yang && gender === "F")) return "forward";
  return "reverse";
}

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

  if (principals.length === 0) {
    return {
      direction,
      diffDays: 0,
      startAgeFloat: 0,
      startAge: 0,
      refTermName: "",
      refTermDate: ""
    };
  }

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

/* ===========================================
   5. MASTER FUNCTION
=========================================== */

export function calculateSaju(input: SajuInput): SajuResult {
  const sibsung = {
    year:  getSibsung(input.dayStem, input.yearStem),
    month: getSibsung(input.dayStem, input.monthStem),
    day:   "비견",
    hour:  getSibsung(input.dayStem, input.hourStem),
  };

  const branchSibsung = {
    year:  getSibsung(input.dayStem, input.yearBranch, true),
    month: getSibsung(input.dayStem, input.monthBranch, true),
    day:   getSibsung(input.dayStem, input.dayBranch, true),
    hour:  getSibsung(input.dayStem, input.hourBranch, true),
  };

  const twelve = {
    year:  getTwelve(input.yearStem,  input.yearBranch),
    month: getTwelve(input.monthStem, input.monthBranch),
    day:   getTwelve(input.dayStem,   input.dayBranch),
    hour:  getTwelve(input.hourStem,  input.hourBranch),
  };

  const daewoon = calcDaewoon(
    input.birth,
    input.yearStem,
    input.gender,
    input.solarTerms
  );

  return {
    ganji: {
      year:  input.yearStem  + input.yearBranch,
      month: input.monthStem + input.monthBranch,
      day:   input.dayStem   + input.dayBranch,
      hour:  input.hourStem  + input.hourBranch,
    },
    sibsung,
    branchSibsung,
    twelve,
    daewoon,
  };
}
