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
   음양 & 오행 매핑
=========================================== */

// 천간 음양
const stemYinYang: Record<string, "양" | "음"> = {
  "갑": "양", "을": "음",
  "병": "양", "정": "음",
  "무": "양", "기": "음",
  "경": "양", "신": "음",
  "임": "양", "계": "음",

  "甲": "양","乙": "음","丙":"양","丁":"음",
  "戊":"양","己":"음","庚":"양","辛":"음",
  "壬":"양","癸":"음"
};

// 천간 오행
const stemElement: Record<string,"목"|"화"|"토"|"금"|"수"> = {
  갑:"목", 을:"목", 甲:"목", 乙:"목",
  병:"화", 정:"화", 丙:"화", 丁:"화",
  무:"토", 기:"토", 戊:"토", 己:"토",
  경:"금", 신:"금", 庚:"금", 辛:"금",
  임:"수", 계:"수", 壬:"수", 癸:"수"
};

// 🔥 너가 직접 확정한 지지 음양표
const branchYinYang: Record<string,"양"|"음"> = {
  "자":"음",
  "축":"음",
  "인":"양",
  "묘":"음",
  "진":"양",
  "사":"양",
  "오":"음",
  "미":"음",
  "신":"양",
  "유":"음",
  "술":"양",
  "해":"양"
};

// 지지 오행
const branchElement: Record<string,"목"|"화"|"토"|"금"|"수"> = {
  "자":"수",
  "축":"토",
  "인":"목",
  "묘":"목",
  "진":"토",
  "사":"화",
  "오":"화",
  "미":"토",
  "신":"금",
  "유":"금",
  "술":"토",
  "해":"수"
};

/* ===========================================
   십성 계산 (천간 / 지지 공통 로직)
=========================================== */

const generate = { 목:"화", 화:"토", 토:"금", 금:"수", 수:"목" };
const control  = { 목:"토", 토:"수", 수:"화", 화:"금", 금:"목" };

export function getSibsung(dayStem: string, target: string, isBranch=false) {

  const dayEl = stemElement[dayStem];
  const dayYY = stemYinYang[dayStem];

  const targetEl = isBranch ? branchElement[target] : stemElement[target];
  const targetYY = isBranch ? branchYinYang[target] : stemYinYang[target];

  if (!dayEl || !targetEl) return "미정";

  const sameYinYang = (dayYY === targetYY);

  // 비겁
  if (dayEl === targetEl) return sameYinYang ? "비견" : "겁재";

  // 인성 (나를 생해주는 경우)
  const whoGeneratesMe = { 화:"목", 토:"화", 금:"토", 수:"금", 목:"수" };
  if (whoGeneratesMe[dayEl] === targetEl)
    return sameYinYang ? "정인" : "편인";

  // 식상 (내가 나가는 기운)
  if (generate[dayEl] === targetEl)
    return sameYinYang ? "식신" : "상관";

  // 관성 (나를 극함)
  const whoControlsMe = { 토:"목", 수:"토", 화:"수", 금:"화", 목:"금" };
  if (whoControlsMe[dayEl] === targetEl)
    return sameYinYang ? "편관" : "정관";

  // 재성 (내가 극함)
  if (control[dayEl] === targetEl)
    return sameYinYang ? "정재" : "편재";

  return "미정";
}

/* ===========================================
   십이운성
=========================================== */

const twelveUnseong = [
  "장생","목욕","관대","임관","제왕",
  "쇠","병","사","묘","절","태","양"
];

const jangStart: Record<string,string> = {
  "갑":"亥","甲":"亥",
  "을":"酉","乙":"酉",
  "병":"申","丙":"申",
  "정":"申","丁":"申",
  "무":"申","戊":"申",
  "기":"申","己":"申",
  "경":"巳","庚":"巳",
  "신":"卯","辛":"卯",
  "임":"寅","壬":"寅",
  "계":"寅","癸":"寅"
};

const order = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"];

export function getTwelve(dayStem: string, branch: string) {
  const start = jangStart[dayStem];
  if (!start) return "미정";

  const s = order.indexOf(start);
  const t = order.indexOf(branch);

  if (s < 0 || t < 0) return "미정";

  const diff = (t - s + 12) % 12;
  return twelveUnseong[diff];
}

/* ===========================================
   대운 계산
=========================================== */

function isYang(stem:string){ return stemYinYang[stem] === "양"; }

export function getDirection(yearStem: string, gender: "M"|"F") {
  const yang = isYang(yearStem);
  if ((yang && gender==="M") || (!yang && gender==="F")) return "forward";
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
    .filter(t=>t.isPrincipal)
    .map(t=>({...t, d:new Date(t.date)}))
    .sort((a,b)=>a.d.getTime() - b.d.getTime());

  let ref = principals[0];

  if (direction === "forward") {
    const found = principals.find(t => t.d.getTime() > birth.getTime());
    ref = found ?? principals[principals.length -1];
  } else {
    for (let i = principals.length-1; i >= 0; i--) {
      if (principals[i].d.getTime() < birth.getTime()) {
        ref = principals[i];
        break;
      }
    }
  }

  const diffMs = Math.abs(birth.getTime() - ref.d.getTime());
  const diffDays = diffMs / (1000*60*60*24);
  const startAgeFloat = diffDays / 3;
  const startAge = Math.round(startAgeFloat);

  return {
    direction,
    diffDays: Math.round(diffDays*1000)/1000,
    startAgeFloat,
    startAge,
    refTermName: ref.name,
    refTermDate: ref.date
  };
}

/* ===========================================
   MASTER FUNCTION
=========================================== */

export function calculateSaju(input: SajuInput): SajuResult {

  const sibsung = {
    year:  getSibsung(input.dayStem, input.yearStem),
    month: getSibsung(input.dayStem, input.monthStem),
    day:   "비견",
    hour:  getSibsung(input.dayStem, input.hourStem)
  };

  const branchSibsung = {
    year:  getSibsung(input.dayStem, input.yearBranch, true),
    month: getSibsung(input.dayStem, input.monthBranch, true),
    day:   getSibsung(input.dayStem, input.dayBranch, true),
    hour:  getSibsung(input.dayStem, input.hourBranch, true)
  };

  const twelve = {
    year:  getTwelve(input.dayStem, input.yearBranch),
    month: getTwelve(input.dayStem, input.monthBranch),
    day:   getTwelve(input.dayStem, input.dayBranch),
    hour:  getTwelve(input.dayStem, input.hourBranch)
  };

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
    branchSibsung,
    twelve,
    daewoon
  };
}
