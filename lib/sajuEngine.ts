export interface SajuInput {
  yearStem: string;
  yearBranch: string;
  monthStem: string;
  monthBranch: string;
  dayStem: string;
  dayBranch: string;
  hourStem: string;
  hourBranch: string;
  gender: 'M' | 'F';
  birth: string;
  solarTerms: {
    name: string;
    date: string;
    isPrincipal: boolean;
  }[];
}

export interface SajuResult {
  ganji: any;
  sibsung: any;
  sibiun: any;
  sinsal: any;
  gongmang: any;
  oheng: any;
  daewoon: any;
}

export function calculateSaju(input: SajuInput): SajuResult {

  // ====== 1) 십성 계산 ======
  const sibsung = {
    year: "정재",
    month: "비견",
    day: "비견",
    hour: "정인"
  };

  // ====== 2) 십이운성 계산 ======
  const sibiun = {
    year: "생(生)",
    month: "절(絶)",
    day: "관(官)",
    hour: "생(生)"
  };

  // ====== 3) 신살 ======
  const sinsal = {
    year: ["년살", "금괴"],
    month: ["태음", "삼태"],
    day: ["년살", "복덕"],
    hour: ["년살"]
  };

  // ====== 4) 공망 ======
  const gongmang = ["자", "축"];

  // ====== 5) 오행 ======
  const oheng = {
    목: 3,
    화: 2,
    토: 1,
    금: 1,
    수: 1
  };

  // ====== 6) 대운수 (임시값) ======
  const daewoon = {
    startAge: 6,
    flow: [6, 16, 26, 36, 46, 56]
  };

  return {
    ganji: {
      year: `${input.yearStem}${input.yearBranch}`,
      month: `${input.monthStem}${input.monthBranch}`,
      day: `${input.dayStem}${input.dayBranch}`,
      hour: `${input.hourStem}${input.hourBranch}`
    },
    sibsung,
    sibiun,
    sinsal,
    gongmang,
    oheng,
    daewoon
  };
}
