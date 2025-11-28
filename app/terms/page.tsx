"use client";

import React from "react";
import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* 헤더 */}
      <header className="flex items-center px-4 py-3 border-b bg-gray-50">
        <button
          onClick={() => history.back()}
          className="text-xl mr-3 text-gray-600"
        >
          ＜
        </button>
        <h1 className="text-lg font-bold">이용약관</h1>
      </header>

      {/* 본문 */}
      <main className="px-5 py-6 leading-relaxed text-[15px]">

        <h2 className="font-bold text-lg mt-6 mb-2">제1조 (목적)</h2>
        <p>
          이 약관은 이지사주(이하 “회사”라 합니다)가 제공하는 사주 분석 및 관련
          서비스(이하 “서비스”)의 이용조건과 절차, 그리고 회사와 이용자 간의
          권리·의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">제2조 (정의)</h2>
        <p>이 약관에서 사용하는 주요 용어는 다음과 같습니다.</p>
        <p className="mt-2">
          ① “이용자”란 본 약관에 따라 회사가 제공하는 서비스를 이용하는 자를
          말합니다.<br />
          ② “서비스”란 이용자가 생년월일시 등 정보를 제공하면 회사가 이를 바탕으로
          사주 분석 결과서를 제작·전송하는 과정을 말합니다.<br />
          ③ “결과물”이란 회사가 제공하는 사주 분석서(PDF 등 파일 형식)를 말합니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">제3조 (약관의 효력 및 변경)</h2>
        <p>
          ① 회사는 본 약관을 홈페이지에 게시하고, 이용자가 열람할 수 있도록 합니다.<br />
          ② 회사는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있으며,
          개정 시 홈페이지 공지로 효력이 발생합니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">제4조 (서비스 내용)</h2>
        <p>
          ① 회사는 이용자가 입력한 개인정보를 바탕으로 사주 분석서를 제작하여 이메일
          또는 카카오톡 등으로 제공합니다.<br />
          ② 서비스의 구체적인 내용과 제공 방식은 회사의 정책에 따라 변경될 수 있습니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">제5조 (이용계약의 성립)</h2>
        <p>
          ① 이용계약은 이용자가 신청서 작성 및 결제를 완료한 후, 회사가 이를 승인함으로써
          성립됩니다.<br />
          ② 회사는 필요한 경우 부정확한 정보 입력, 타인 명의 도용 등 사유가 있을 때 신청을
          거부할 수 있습니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">제6조 (결제 및 환불)</h2>
        <p>
          ① 서비스는 유료로 제공되며, 결제 방식은 회사가 지정한 방법을 따릅니다.<br />
          ② 분석 작업이 이미 착수된 경우에는 환불이 제한될 수 있습니다.<br />
          ③ 회사의 귀책 사유로 분석 결과가 제공되지 못한 경우 전액 환불합니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">제7조 (이용자의 의무)</h2>
        <p>
          ① 이용자는 서비스 이용 시 허위 정보를 제공하거나 타인의 정보를 무단 사용하지
          않아야 합니다.<br />
          ② 이용자는 결과물을 상업적·불법적으로 복제, 배포하거나 서비스 방해 행위를
          해서는 안 됩니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">제8조 (저작권 및 결과물 이용)</h2>
        <p>
          ① 서비스의 분석 결과물과 콘텐츠의 저작권은 회사에 귀속됩니다.<br />
          ② 이용자는 개인적 참고 목적 외의 상업적 이용을 금지합니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">제9조 (마케팅 및 정보 수신 동의)</h2>
        <p>
          ① 회사는 이용자의 명시적 동의가 있는 경우, 서비스 관련 소식·이벤트·프로모션
          정보를 문자, 이메일 또는 카카오 알림톡으로 발송할 수 있습니다.<br />
          ② 이용자는 언제든지 수신 거부 또는 동의 철회를 요청할 수 있으며, 회사는 즉시
          처리합니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">제10조 (면책조항)</h2>
        <p>
          ① 사주 분석 결과는 통계적·전통적 참고 자료로 제공되는 것으로, 실제 결과나 효력을
          보장하지 않습니다.<br />
          ② 회사는 천재지변, 통신장애 등 불가항력적인 사유로 인한 손해에 대해서는 책임을
          지지 않습니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">제11조 (약관 변경 및 공지)</h2>
        <p>
          회사는 필요 시 본 약관을 변경할 수 있으며, 변경된 약관은 홈페이지 게시를 통해
          공지함으로써 효력이 발생합니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">제12조 (준거법 및 관할법원)</h2>
        <p>
          본 약관은 대한민국 법령에 따르며, 회사와 이용자 간 분쟁이 발생할 경우 회사의 주소지를
          관할하는 법원을 전속 관할법원으로 합니다.
        </p>

        <p className="text-gray-500 text-sm mt-10">
          ※ 본 약관은 2025년 10월 1일부터 시행합니다.
        </p>
      </main>
    </div>
  );
}
