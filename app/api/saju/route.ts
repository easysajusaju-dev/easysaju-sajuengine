type Gender = "M" | "F";

interface SolarTerm {
  name: string;
  date: string; // ISO 문자열
  isPrincipal: boolean;
}

interface DaewoonResult {
  direction: "forward" | "reverse";
  diffDays: number;
  startAgeFloat: number;
  startAge: number;
  refTermName: string;
  refTermDate: string;
}

function isYangStem(stem: string): boolean {
  // 한자/한글 둘 다 대비
  const yangStems = ["갑", "병", "무", "경", "임", "甲", "丙", "戊", "庚", "壬"];
  return yangStems.includes(stem);
}

/**
 * 연간 음양 + 성별로 순행/역행 결정
 * - 양간 + 남자  → 순행
 * - 음간 + 여자  → 순행
 * - 양간 + 여자  → 역행
 * - 음간 + 남자  → 역행
 */
function getDirection(yearStem: string, gender: Gender): "forward" | "reverse" {
  const yang = isYangStem(yearStem);
  if ((yang && gender === "M") || (!yang && gender === "F")) {
    return "forward";
  }
  return "reverse";
}

/**
 * 대운 시작 나이 계산
 * - 순행: 출생일 기준 "다음" 주기가 되는 절기(주로 절입)까지 날짜 차이
 * - 역행: 출생일 기준 "이전" 절기까지 날짜 차이
 * - 중간에 낀 절기는 isPrincipal=false 로 들어온다고 가정하고 버림
 * - 일수 ÷ 3 후 반올림 → 대운수
 */
function calcDaewoon(
  birthIso: string,
  yearStem: string,
  gender: Gender,
  solarTerms: SolarTerm[]
): DaewoonResult {
  const direction = getDirection(yearStem, gender);

  const birth = new Date(birthIso);
  if (Number.isNaN(birth.getTime())) {
    throw new Error("birth 형식이 잘못되었습니다.");
  }

  // 주기가 되는 절기들만 사용 (isPrincipal = true)
  const principals = solarTerms
    .filter((t) => t.isPrincipal)
    .map((t) => ({
      ...t,
      d: new Date(t.date),
    }))
    .sort((a, b) => a.d.getTime() - b.d.getTime());

  if (principals.length === 0) {
    throw new Error("isPrincipal=true 인 절기가 필요합니다.");
  }

  let ref = principals[0];

  if (direction === "forward") {
    // 출생 이후의 첫 번째 절기
    const found = principals.find((t) => t.d.getTime() > birth.getTime());
    ref = found ?? principals[principals.length - 1];
  } else {
    // 출생 이전의 마지막 절기
    for (let i = principals.length - 1; i >= 0; i--) {
      if (principals[i].d.getTime() < birth.getTime()) {
        ref = principals[i];
        break;
      }
    }
  }

  const diffMs = Math.abs(birth.getTime() - ref.d.getTime());
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  const startAgeFloat = diffDays / 3; // 일수 3으로 나눈 값
  const startAge = Math.round(startAgeFloat); // 반올림

  return {
    direction,
    diffDays: Math.round(diffDays * 1000) / 1000,
    startAgeFloat,
    startAge,
    refTermName: ref.name,
    refTermDate: ref.date,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { yearStem, gender, birth, solarTerms } = body;

    if (!yearStem || !gender || !birth || !Array.isArray(solarTerms)) {
      return Response.json(
        {
          ok: false,
          error: "yearStem, gender, birth, solarTerms 가 필요합니다.",
        },
        { status: 400 }
      );
    }

    const daewoon = calcDaewoon(
      birth,
      yearStem,
      gender as Gender,
      solarTerms as SolarTerm[]
    );

    return Response.json({ ok: true, daewoon });
  } catch (err) {
    console.error("SAJU ENGINE ERROR", err);
    return Response.json(
      {
        ok: false,
        error: String(err),
      },
      { status: 500 }
    );
  }
}

