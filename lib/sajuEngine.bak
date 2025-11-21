/** ===========================================
 *  TYPE DEFINITIONS
 * ===========================================
 */

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
  birth: string;            // ISO 문자열 (예: 1978-03-02T12:30:00+09:00)
  solarTerms: SolarTerm[];
}

export interface SajuResult {
  ganji: any;
  sibsung: any;
  branchSibsung: any;
  twelve: any;
  daewoon: any;
  relations: any; // 형·충·파·합
  seun?: { years: number[]; ganji: string[] }; // 연운
  wolun?: { year: number; months: number[]; ganji: string[] }; // 월운
}

/** ===========================================
 *  BASIC DATA
 * ===========================================
 */

// 천간 음양
const stemYinYang: Record<string, "양" | "음"> = {
  갑: "양", 을: "음", 병: "양", 정: "음", 무: "양", 기: "음", 경: "양", 신: "음", 임: "양", 계: "음",
  甲: "양", 乙: "음", 丙: "양", 丁: "음", 戊: "양", 己: "음", 庚: "양", 辛: "음", 壬: "양", 癸: "음",
};

// 천간 오행
const stemElement: Record<string, "목" | "화" | "토" | "금" | "수"> = {
  갑: "목", 을: "목", 甲: "목", 乙: "목",
  병: "화", 정: "화", 丙: "화", 丁: "화",
  무: "토", 기: "토", 戊: "토", 己: "토",
  경: "금", 신: "금", 庚: "금", 辛: "금",
  임: "수", 계: "수", 壬: "수", 癸: "수",
};

// 지지 음양
const branchYinYang: Record<string, "양" | "음"> = {
  자: "음", 축: "음", 인: "양", 묘: "음", 진: "양", 사: "양",
  오: "음", 미: "음", 신: "양", 유: "음", 술: "양", 해: "양",
  子: "음", 丑: "음", 寅: "양", 卯: "음", 辰: "양", 巳: "양",
  午: "음", 未: "음", 申: "양", 酉: "음", 戌: "양", 亥: "양",
};

// 지지 오행
const branchElement: Record<string, "목" | "화" | "토" | "금" | "수"> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화",
  오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
  子: "수", 丑: "토", 寅: "목", 卯: "목", 辰: "토", 巳: "화",
  午: "화", 未: "토", 申: "금", 酉: "금", 戌: "토", 亥: "수",
};

// 한글 지지 → 한자 지지
const branchNormalize: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
  子: "子", 丑: "丑", 寅: "寅", 卯: "卯", 辰: "辰", 巳: "巳",
  午: "午", 未: "未", 申: "申", 酉: "酉", 戌: "戌", 亥: "亥",
};

function normalizeBranch(b: string): string {
  return branchNormalize[b] ?? b;
}

/** ===========================================
 *  60갑자 유틸
 * ===========================================
 */

// 한자 10간/12지 (연·월·세운/월운 계산용)
const STEMS_10 = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const BRANCHES_12 = ["子","丑","寅","卯","辰","巳","午","未","申","酉","戌","亥"] as const;

function stemIndex(stem: string): number {
  return STEMS_10.indexOf(stem as any);
}
function branchIndex(branch: string): number {
  const b = normalizeBranch(branch);
  return BRANCHES_12.indexOf(b as any);
}

function stepStem(stem: string, step: number): string {
  const idx = stemIndex(stem);
  if (idx === -1) return stem;
  const next = (idx + step + 10) % 10;
  return STEMS_10[next];
}

function stepBranch(branch: string, step: number): string {
  const idx = branchIndex(branch);
  if (idx === -1) return normalizeBranch(branch);
  const next = (idx + step + 12) % 12;
  return BRANCHES_12[next];
}

/** ===========================================
 *  십성 계산 로직
 * ===========================================
 */

// 내가 생(生)하는 오행
const generate: Record<"목" | "화" | "토" | "금" | "수", "목" | "화" | "토" | "금" | "수"> = {
  목: "화",
  화: "토",
  토: "금",
  금: "수",
  수: "목",
};

// 내가 극(剋)하는 오행
const control: Record<"목" | "화" | "토" | "금" | "수", "목" | "화" | "토" | "금" | "수"> = {
  목: "토",
  토: "수",
  수: "화",
  화: "금",
  금: "목",
};

export function getSibsung(dayStem: string, target: string, isBranch = false): string {
  const myEl = stemElement[dayStem];
  const myYY = stemYinYang[dayStem];

  const targetEl = isBranch ? branchElement[target] : stemElement[target];
  const targetYY = isBranch ? branchYinYang[target] : stemYinYang[target];

  if (!myEl || !targetEl || !myYY || !targetYY) return "미정";

  const same = myYY === targetYY;

  if (myEl === targetEl) return same ? "비견" : "겁재";
  if (generate[myEl] === targetEl) return same ? "식신" : "상관";
  if (control[myEl] === targetEl) return same ? "편재" : "정재";

  const controlsMe: Record<"목" | "화" | "토" | "금" | "수", "목" | "화" | "토" | "금" | "수"> = {
    목: "금",
    화: "수",
    토: "목",
    금: "화",
    수: "토",
  };
  if (controlsMe[myEl] === targetEl) return same ? "편관" : "정관";

  const generatesMe: Record<"목" | "화" | "토" | "금" | "수", "목" | "화" | "토" | "금" | "수"> = {
    목: "수",
    화: "목",
    토: "화",
    금: "토",
    수: "금",
  };
  if (generatesMe[myEl] === targetEl) return same ? "편인" : "정인";

  return "미정";
}

/** ===========================================
 *  12운성
 * ===========================================
 */

const twelveUnseongTable: Record<string, Record<string, string>> = {
  寅: { 甲: "건록", 乙: "제왕", 丙: "장생", 丁: "사지", 戊: "장생", 己: "사지", 庚: "절지", 辛: "태지", 壬: "병지", 癸: "목욕" },
  卯: { 甲: "제왕", 乙: "건록", 丙: "목욕", 丁: "병지", 戊: "목욕", 己: "병지", 庚: "태지", 辛: "절지", 壬: "사지", 癸: "장생" },
  辰: { 甲: "쇠지", 乙: "관대", 丙: "관대", 丁: "쇠지", 戊: "관대", 己: "쇠지", 庚: "양지", 辛: "묘지", 壬: "묘지", 癸: "양지" },
  巳: { 甲: "병지", 乙: "목욕", 丙: "건록", 丁: "제왕", 戊: "건록", 己: "제왕", 庚: "장생", 辛: "사지", 壬: "절지", 癸: "태지" },
  午: { 甲: "사지", 乙: "장생", 丙: "제왕", 丁: "건록", 戊: "제왕", 己: "건록", 庚: "목욕", 辛: "병지", 壬: "태지", 癸: "절지" },
  未: { 甲: "묘지", 乙: "양지", 丙: "쇠지", 丁: "관대", 戊: "쇠지", 己: "관대", 庚: "쇠지", 辛: "양지", 壬: "묘지", 癸: "묘지" },
  申: { 甲: "절지", 乙: "태지", 丙: "병지", 丁: "목욕", 戊: "병지", 己: "목욕", 庚: "건록", 辛: "제왕", 壬: "장생", 癸: "사지" },
  酉: { 甲: "태지", 乙: "절지", 丙: "사지", 丁: "장생", 戊: "사지", 己: "장생", 庚: "제왕", 辛: "건록", 壬: "목욕", 癸: "병지" },
  戌: { 甲: "양지", 乙: "묘지", 丙: "묘지", 丁: "양지", 戊: "묘지", 己: "양지", 庚: "쇠지", 辛: "관대", 壬: "관대", 癸: "쇠지" },
  亥: { 甲: "장생", 乙: "사지", 丙: "절지", 丁: "태지", 戊: "절지", 己: "태지", 庚: "병지", 辛: "목욕", 壬: "건록", 癸: "제왕" },
  子: { 甲: "목욕", 乙: "병지", 丙: "태지", 丁: "절지", 戊: "태지", 己: "절지", 庚: "사지", 辛: "장생", 壬: "제왕", 癸: "건록" },
  丑: { 甲: "관대", 乙: "쇠지", 丙: "양지", 丁: "묘지", 戊: "양지",
        己: "묘지", 庚: "양지", 辛: "쇠지", 壬: "절지", 癸: "관대" },
};

export function getTwelveUnseong(dayStem: string, branch: string) {
  const b = normalizeBranch(branch);
  const row = twelveUnseongTable[b];
  if (!row) return "미정";
  return row[dayStem] ?? "미정";
}

export function getTwelve(dayStem: string, branch: string) {
  return getTwelveUnseong(dayStem, branch);
}

/** ===========================================
 *  대운수 방향 결정
 * ===========================================
 */

function isYangStem(stem: string) {
  return stemYinYang[stem] === "양";
}

export function getDirection(yearStem: string, gender: "M" | "F") {
  const yang = isYangStem(yearStem);
  if ((yang && gender === "M") || (!yang && gender === "F")) return "forward";
  return "reverse";
}

/** ===========================================
 *  대운수 계산
 * ===========================================
 */

export function calcDaewoon(
  birthIso: string,
  yearStem: string,
  gender: "M" | "F",
  solarTerms: SolarTerm[]
) {
  const direction = getDirection(yearStem, gender);
  const birth = new Date(birthIso);

  const principals = solarTerms
    .filter((t) => t.isPrincipal)
    .map((t) => ({ ...t, d: new Date(t.date) }))
    .sort((a, b) => a.d.getTime() - b.d.getTime());

  if (principals.length === 0) {
    return { direction, diffDays: 0, startAgeFloat: 0, startAge: 0, refTermName: "", refTermDate: "" };
  }

  let ref = principals[0];

  if (direction === "forward") {
    const found = principals.find((t) => t.d > birth);
    ref = found ?? principals[principals.length - 1];
  } else {
    for (let i = principals.length - 1; i >= 0; i--) {
      if (principals[i].d < birth) {
        ref = principals[i];
        break;
      }
    }
  }

  const diffMs = Math.abs(birth.getTime() - ref.d.getTime());
  const diffDays = diffMs / 86400000;
  const startAgeFloat = diffDays / 3;
  const startAge = Math.round(startAgeFloat);

  return {
    direction,
    diffDays: Math.round(diffDays * 1000) / 1000,
    startAgeFloat,
    startAge,
    refTermName: ref.name,
    refTermDate: ref.date,
  };
}

/** ===========================================
 *  세운(연운) 계산
 *  - 출생연도부터 10년치 기본 세운
 *  - 60갑자 순환
 * ===========================================
 */

function calcSeun(input: SajuInput, count = 10) {
  const birthDate = new Date(input.birth);
  const birthYear = birthDate.getFullYear();

  const years: number[] = [];
  const ganji: string[] = [];

  let stem = input.yearStem;
  let branch = normalizeBranch(input.yearBranch);

  for (let i = 0; i < count; i++) {
    const year = birthYear + i;
    years.push(year);

    if (i > 0) {
      stem = stepStem(stem, 1);
      branch = stepBranch(branch, 1);
    }

    ganji.push(stem + branch);
  }

  return { years, ganji };
}

/** ===========================================
 *  월운 계산 (기본 월건법)
 *  - 해당 해의 간지를 기준으로 12개월 간지 생성
 *  - 1월 지지는 항상 寅부터 시작, 순행
 *  - 1월 간지는 연간 그룹에 따라 시작 간지 결정
 *    (甲己: 丙寅 · 乙庚: 戊寅 · 丙辛: 庚寅 · 丁壬: 壬寅 · 戊癸: 甲寅)
 * ===========================================
 */

const MONTH_BRANCH_ORDER = ["寅","卯","辰","巳","午","未","申","酉","戌","亥","子","丑"];

const MONTH_STEM_START_BY_YEAR_STEM: Record<string, string> = {
  甲: "丙", 己: "丙",
  乙: "戊", 庚: "戊",
  丙: "庚", 辛: "庚",
  丁: "壬", 壬: "壬",
  戊: "甲", 癸: "甲",
};

function calcWolun(input: SajuInput) {
  const birthDate = new Date(input.birth);
  const year = birthDate.getFullYear();

  const yearStem = input.yearStem;
  const firstStem = MONTH_STEM_START_BY_YEAR_STEM[yearStem];

  if (!firstStem) {
    // 규칙에 안 맞으면 월운은 빈 값으로 반환
    return { year, months: [] as number[], ganji: [] as string[] };
  }

  const months: number[] = [];
  const ganji: string[] = [];

  let stem = firstStem;

  for (let i = 0; i < 12; i++) {
    const month = i + 1;
    const branch = MONTH_BRANCH_ORDER[i];

    months.push(month);
    ganji.push(stem + branch);

    stem = stepStem(stem, 1);
  }

  return { year, months, ganji };
}

/** ===========================================
 *  형·충·파·합
 * ===========================================
 */

const HYUNG_SET = new Set([
  "寅巳","巳寅","寅申","申寅","巳申","申巳",
  "丑戌","戌丑","丑未","未丑","戌未","未戌",
  "子卯","卯子",
  "辰辰","午午","酉酉","亥亥",
]);

const CHUNG_SET = new Set([
  "子午","午子",
  "丑未","未丑",
  "寅申","申寅",
  "卯酉","酉卯",
  "辰戌","戌辰",
  "巳亥","亥巳",
]);

const PA_SET = new Set([
  "子酉","酉子",
  "丑辰","辰丑",
  "寅亥","亥寅",
  "巳申","申巳",
  "午卯","卯午",
  "戌未","未戌",
]);

const HAP_SET = new Set([
  "子丑","丑子",
  "寅亥","亥寅",
  "卯戌","戌卯",
  "辰酉","酉辰",
  "巳申","申巳",
  "午未","未午",
]);

type BranchKey = "year" | "month" | "day" | "hour";

export function getBranchRelations(input: SajuInput) {
  const branches: Record<BranchKey, string> = {
    year: normalizeBranch(input.yearBranch),
    month: normalizeBranch(input.monthBranch),
    day: normalizeBranch(input.dayBranch),
    hour: normalizeBranch(input.hourBranch),
  };

  const keys: BranchKey[] = ["year", "month", "day", "hour"];
  const hyung: any[] = [];
  const chung: any[] = [];
  const pa: any[] = [];
  const hap: any[] = [];

  function push(list: any[], kind: any, a: BranchKey, b: BranchKey) {
    list.push({ from: a, to: b, branches: branches[a] + branches[b], kind });
  }

  for (let i = 0; i < keys.length; i++) {
    for (let j = i + 1; j < keys.length; j++) {
      const a = keys[i];
      const b = keys[j];
      const pair = branches[a] + branches[b];

      if (HYUNG_SET.has(pair)) push(hyung, "형", a, b);
      if (CHUNG_SET.has(pair)) push(chung, "충", a, b);
      if (PA_SET.has(pair)) push(pa, "파", a, b);
      if (HAP_SET.has(pair)) push(hap, "합", a, b);
    }
  }

  return { hyung, chung, pa, hap };
}

/** ===========================================
 *  MAIN
 * ===========================================
 */

export function calculateSaju(input: SajuInput): SajuResult {
  const sibsung = {
    year: getSibsung(input.dayStem, input.yearStem),
    month: getSibsung(input.dayStem, input.monthStem),
    day: "비견",
    hour: getSibsung(input.dayStem, input.hourStem),
  };

  const branchSibsung = {
    year: getSibsung(input.dayStem, input.yearBranch, true),
    month: getSibsung(input.dayStem, input.monthBranch, true),
    day: getSibsung(input.dayStem, input.dayBranch, true),
    hour: getSibsung(input.dayStem, input.hourBranch, true),
  };

  const twelve = {
    year: getTwelve(input.dayStem, input.yearBranch),
    month: getTwelve(input.dayStem, input.monthBranch),
    day: getTwelve(input.dayStem, input.dayBranch),
    hour: getTwelve(input.dayStem, input.hourBranch),
  };

  const daewoon = calcDaewoon(
    input.birth,
    input.yearStem,
    input.gender,
    input.solarTerms
  );

  const relations = getBranchRelations(input);

  const seun = calcSeun(input, 10);
  const wolun = calcWolun(input);

  return {
    ganji: {
      year: input.yearStem + input.yearBranch,
      month: input.monthStem + input.monthBranch,
      day: input.dayStem + input.dayBranch,
      hour: input.hourStem + input.hourBranch,
    },
    sibsung,
    branchSibsung,
    twelve,
    daewoon,
    relations,
    seun,
    wolun,
  };
}
