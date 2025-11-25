/** ===========================================
 * TYPE DEFINITIONS
 * ============================================
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
  birth: string;         // ISO 문자열
  solarTerms: SolarTerm[];
}

export interface SajuResult {
  ganji: any;
  sibsung: any;
  branchSibsung: any;
  twelve: any;
  daewoon: any;
  relations: any;     // 형·충·파·합
  hiddenStems: any;   // 지장간
  hiddenSibsung: any; // 지장간 십성
  sinsal: any;        // { yearBase, dayBase }
  guin?: {            // 천을귀인 위치
    cheonEulGuiin: ("year" | "month" | "day" | "hour")[];
  };
}

/* ===========================================
 *  공통 표 : 천간/지지 음양·오행
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

// 지지 음양 (한글 + 한자)
const branchYinYang: Record<string, "양" | "음"> = {
  자: "음", 축: "음", 인: "양", 묘: "음", 진: "양", 사: "양", 오: "음", 미: "음", 신: "양", 유: "음", 술: "양", 해: "양",
  子: "음", 丑: "음", 寅: "양", 卯: "음", 辰: "양", 巳: "양", 午: "음", 未: "음", 申: "양", 酉: "음", 戌: "양", 亥: "양",
};

// 지지 오행 (한글 + 한자)
const branchElement: Record<string, "목" | "화" | "토" | "금" | "수"> = {
  자: "수", 축: "토", 인: "목", 묘: "목", 진: "토", 사: "화", 오: "화", 미: "토", 신: "금", 유: "금", 술: "토", 해: "수",
  子: "수", 丑: "토", 寅: "목", 卯: "목", 辰: "토", 巳: "화", 午: "화", 未: "토", 申: "금", 酉: "금", 戌: "토", 亥: "수",
};

// 지지 한글 → 한자 정규화
const branchNormalize: Record<string, string> = {
  자: "子", 축: "丑", 인: "寅", 묘: "卯", 진: "辰", 사: "巳",
  오: "午", 미: "未", 신: "申", 유: "酉", 술: "戌", 해: "亥",
  子: "子", 丑: "丑", 寅: "寅", 卯: "卯", 辰: "辰", 巳: "巳",
  午: "午", 未: "未", 申: "申", 酉: "酉", 戌: "戌", 亥: "亥",
};

function normalizeBranch(b: string): string {
  return branchNormalize[b] ?? b;
}

/* ===========================================
 *  지장간(藏干) 표 + 헬퍼
 * ===========================================
 */

// 지장간 표 (지지 한자 기준)
const hiddenStemTable: Record<string, string[]> = {
  子: ["癸"],
  丑: ["己", "癸", "辛"],
  寅: ["甲", "丙", "戊"],
  卯: ["乙"],
  辰: ["戊", "乙", "癸"],
  巳: ["丙", "庚", "戊"],
  午: ["丁", "己"],
  未: ["己", "丁", "乙"],
  申: ["庚", "壬", "戊"],
  酉: ["辛"],
  戌: ["戊", "辛", "丁"],
  亥: ["壬", "甲"],
};

// 지지 → 지장간 배열
export function getHiddenStems(branch: string): string[] {
  const b = normalizeBranch(branch);
  return hiddenStemTable[b] ?? [];
}

/* ===========================================
 *  십성 계산
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

  const sameYinYang = myYY === targetYY;

  // ① 오행 같음 → 비겁
  if (myEl === targetEl) {
    return sameYinYang ? "비견" : "겁재";
  }

  // ② 내가 생(生)함 → 식상
  if (generate[myEl] === targetEl) {
    return sameYinYang ? "식신" : "상관";
  }

  // ③ 내가 극(剋)함 → 재성
  if (control[myEl] === targetEl) {
    return sameYinYang ? "편재" : "정재";
  }

  // ④ 나를 극함 → 관성
  const whoControlsMe: Record<"목" | "화" | "토" | "금" | "수", "목" | "화" | "토" | "금" | "수"> = {
    목: "금",
    화: "수",
    토: "목",
    금: "화",
    수: "토",
  };
  if (whoControlsMe[myEl] === targetEl) {
    return sameYinYang ? "편관" : "정관";
  }

  // ⑤ 나를 생(生)함 → 인성
  const whoGeneratesMe: Record<"목" | "화" | "토" | "금" | "수", "목" | "화" | "토" | "금" | "수"> = {
    목: "수",
    화: "목",
    토: "화",
    금: "토",
    수: "금",
  };
  if (whoGeneratesMe[myEl] === targetEl) {
    return sameYinYang ? "편인" : "정인";
  }

  return "미정";
}

/* ===========================================
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
  丑: { 甲: "관대", 乙: "쇠지", 丙: "양지", 丁: "묘지", 戊: "양지", 己: "묘지",庚: "양지", 辛: "쇠지", 壬: "절지", 癸: "관대" },
};

export function getTwelveUnseong(dayStem: string, branch: string): string {
  const b = normalizeBranch(branch);
  const row = twelveUnseongTable[b];
  if (!row) return "미정";
  return row[dayStem] ?? "미정";
}

// alias
export function getTwelve(dayStem: string, branch: string): string {
  return getTwelveUnseong(dayStem, branch);
}

/* ===========================================
 *  대운 방향 + 수치
 * ===========================================
 */

function isYangStem(stem: string): boolean {
  return stemYinYang[stem] === "양";
}

export function getDirection(yearStem: string, gender: "M" | "F") {
  const yang = isYangStem(yearStem);
  if ((yang && gender === "M") || (!yang && gender === "F")) return "forward";
  return "reverse";
}

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
    return {
      direction,
      diffDays: 0,
      startAgeFloat: 0,
      startAge: 0,
      refTermName: "",
      refTermDate: "",
    };
  }

  let ref = principals[0];

  if (direction === "forward") {
    const found = principals.find((t) => t.d.getTime() > birth.getTime());
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
    refTermDate: ref.date,
  };
}

/* ===========================================
 *  형·충·파·합
 * ===========================================
 */

const HYUNG_SET = new Set<string>([
  "寅巳","巳寅","寅申","申寅","巳申","申巳", // 인사신 삼형
  "丑戌","戌丑","丑未","未丑","戌未","未戌", // 축술미 삼형
  "子卯","卯子",                           // 자묘 형
  "辰辰","午午","酉酉","亥亥",             // 자형
]);

const CHUNG_SET = new Set<string>([
  "子午","午子",
  "丑未","未丑",
  "寅申","申寅",
  "卯酉","酉卯",
  "辰戌","戌辰",
  "巳亥","亥巳",
]);

const PA_SET = new Set<string>([
  "子酉","酉子",
  "丑辰","辰丑",
  "寅亥","亥寅",
  "巳申","申巳",
  "午卯","卯午",
  "戌未","未戌",
]);

const HAP_SET = new Set<string>([
  "子丑","丑子",
  "寅亥","亥寅",
  "卯戌","戌卯",
  "辰酉","酉辰",
  "巳申","申巳",
  "午未","未午",
]);

type BranchKey = "year" | "month" | "day" | "hour";

interface RelationItem {
  from: BranchKey;
  to: BranchKey;
  branches: string;
  kind: "형" | "충" | "파" | "합";
}

export function getBranchRelations(input: SajuInput) {
  const branches: Record<BranchKey, string> = {
    year: normalizeBranch(input.yearBranch),
    month: normalizeBranch(input.monthBranch),
    day: normalizeBranch(input.dayBranch),
    hour: normalizeBranch(input.hourBranch),
  };

  const keys: BranchKey[] = ["year", "month", "day", "hour"];
  const hyung: RelationItem[] = [];
  const chung: RelationItem[] = [];
  const pa: RelationItem[] = [];
  const hap: RelationItem[] = [];

  function push(list: RelationItem[], kind: RelationItem["kind"], a: BranchKey, b: BranchKey) {
    list.push({
      from: a,
      to: b,
      branches: branches[a] + branches[b],
      kind,
    });
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

/* ===========================================
 *  신살 (12신살 + 천을귀인)
 * ===========================================
 */

// 삼합국 지지 그룹 정의
const SINSAL_GROUPS: Record<string, string[]> = {
  "사유축": ["巳", "酉", "丑"],
  "해묘미": ["亥", "卯", "未"],
  "인오술": ["寅", "午", "戌"],
  "신자진": ["申", "子", "辰"],
};

// 신살표 (12신살 순서)
const SINSAL_NAMES = [
  "겁살", "재살", "천살", "지살",
  "연살", "월살", "망신살", "장성살",
  "반안살", "역마살", "육해살", "화개살",
];

// 각 삼합국의 순서에 따른 지지 배치
const SINSAL_MATRIX: Record<string, string[]> = {
  "사유축": ["申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰", "巳", "午", "未"],
  "해묘미": ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"],
  "인오술": ["寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑"],
  "신자진": ["巳", "午", "未", "申", "酉", "戌", "亥", "子", "丑", "寅", "卯", "辰"],
};

// 천을귀인 정의
const CHEON_EUL_GUIIN: Record<string, string[]> = {
  갑: ["丑", "亥"],
  을: ["子", "戌"],
  병: ["丑", "亥"],
  정: ["子", "戌"],
  무: ["寅", "子"],
  기: ["酉", "亥"],
  경: ["寅", "子"],
  신: ["酉", "亥"],
  임: ["卯", "丑"],
  계: ["申", "午"],
};

// 기준지지와 비교지지를 기반으로 신살 추출
function getSinsalByBase(baseBranch: string, targetBranch: string): string | null {
  const groupKey = Object.keys(SINSAL_GROUPS).find(
    key => SINSAL_GROUPS[key].includes(baseBranch)
  );
  if (!groupKey) return null;

  const sinsalRow = SINSAL_MATRIX[groupKey];
  const index = sinsalRow.indexOf(targetBranch);
  return index !== -1 ? SINSAL_NAMES[index] : null;
}

// 천을귀인 판단 → 위치 반환 ("year" | "month" | "day" | "hour")
function getCheonEulGuiin(dayStem: string, branches: Record<BranchKey, string>): BranchKey[] {
  const valid = CHEON_EUL_GUIIN[dayStem] || [];
  const result: BranchKey[] = [];

  (["year", "month", "day", "hour"] as BranchKey[]).forEach((pos) => {
    if (valid.includes(branches[pos])) {
      result.push(pos);
    }
  });

  return result;
}

// 메인 신살 추출 함수
export function getSinsal(input: SajuInput) {
  const branches: Record<BranchKey, string> = {
    year: normalizeBranch(input.yearBranch),
    month: normalizeBranch(input.monthBranch),
    day: normalizeBranch(input.dayBranch),
    hour: normalizeBranch(input.hourBranch),
  };

  const yearBase = branches.year;
  const dayBase = branches.day;

  function calcAllBy(base: string) {
    return {
      year: getSinsalByBase(base, branches.year),
      month: getSinsalByBase(base, branches.month),
      day: getSinsalByBase(base, branches.day),
      hour: getSinsalByBase(base, branches.hour),
    };
  }

  const yearBaseMap = calcAllBy(yearBase); // 연지 기준
  const dayBaseMap = calcAllBy(dayBase);   // 일지 기준
  const cheonEulGuiin = getCheonEulGuiin(input.dayStem, branches);

  return {
    yearBase: yearBaseMap,
    dayBase: dayBaseMap,
    cheonEulGuiin,
  };
}

/* ===========================================
 *  지장간 십성 (한 기둥)
 * ===========================================
 */

function getHiddenSibsungForBranch(dayStem: string, branch: string): string[] {
  const stems = getHiddenStems(branch);
  return stems.map((hs) => getSibsung(dayStem, hs));
}

/* ===========================================
 *  메인 엔진
 * ===========================================
 */

export function calculateSaju(input: SajuInput): SajuResult {
  // 1) 천간 십성
  const sibsung = {
    year:  getSibsung(input.dayStem, input.yearStem),
    month: getSibsung(input.dayStem, input.monthStem),
    day:   "비견",
    hour:  getSibsung(input.dayStem, input.hourStem),
  };

  // 2) 지지 십성
  const branchSibsung = {
    year:  getSibsung(input.dayStem, input.yearBranch, true),
    month: getSibsung(input.dayStem, input.monthBranch, true),
    day:   getSibsung(input.dayStem, input.dayBranch, true),
    hour:  getSibsung(input.dayStem, input.hourBranch, true),
  };

  // 3) 12운성
  const twelve = {
    year:  getTwelve(input.dayStem, input.yearBranch),
    month: getTwelve(input.dayStem, input.monthBranch),
    day:   getTwelve(input.dayStem, input.dayBranch),
    hour:  getTwelve(input.dayStem, input.hourBranch),
  };

  // 4) 대운
  const daewoon = calcDaewoon(
    input.birth,
    input.yearStem,
    input.gender,
    input.solarTerms
  );

  // 5) 형·충·파·합
  const relations = getBranchRelations(input);

  // 6) 지장간 + 지장간 십성
  const hiddenStems = {
    year:  getHiddenStems(input.yearBranch),
    month: getHiddenStems(input.monthBranch),
    day:   getHiddenStems(input.dayBranch),
    hour:  getHiddenStems(input.hourBranch),
  };

  const hiddenSibsung = {
    year:  getHiddenSibsungForBranch(input.dayStem, input.yearBranch),
    month: getHiddenSibsungForBranch(input.dayStem, input.monthBranch),
    day:   getHiddenSibsungForBranch(input.dayStem, input.dayBranch),
    hour:  getHiddenSibsungForBranch(input.dayStem, input.hourBranch),
  };

  // 7) 신살 + 천을귀인
  const sinsalAll = getSinsal(input);

  // 8) 결과 합치기
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
    relations,
    hiddenStems,
    hiddenSibsung,
    sinsal: {
      yearBase: sinsalAll.yearBase,
      dayBase: sinsalAll.dayBase,
    },
    guin: {
      cheonEulGuiin: sinsalAll.cheonEulGuiin,
    },
  };
}
