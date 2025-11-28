"use client";

import React from "react";

export default function PrivacyPage() {
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
        <h1 className="text-lg font-bold">개인정보처리방침</h1>
      </header>

      {/* 본문 */}
      <main className="px-5 py-6 leading-relaxed text-[15px]">

        <h2 className="font-bold text-lg mt-6 mb-2">1. 개인정보의 수집 및 이용 목적</h2>
        <p>
          이지사주(이하 “회사”)는 다음의 목적을 위하여 개인정보를 처리합니다.
          처리되는 개인정보는 본 목적 이외의 용도로 이용되지 않으며, 이용 목적이
          변경될 경우 개인정보보호법에 따라 별도의 동의를 받습니다.
        </p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>사주 분석 요청에 따른 상담, 분석서(PDF) 제작 및 전달</li>
          <li>서비스 이용 관련 문의 응대 및 추가 질문 처리</li>
          <li>신규 서비스·이벤트·프로모션 등 마케팅 정보의 제공 (사전 동의 시)</li>
        </ul>

        <h2 className="font-bold text-lg mt-6 mb-2">2. 수집하는 개인정보 항목</h2>
        <p>회사는 다음과 같은 정보를 수집합니다.</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>이름, 생년월일시, 성별</li>
          <li>전화번호, 이메일 주소</li>
          <li>서비스 이용 기록(상담 요청 일시, 결제 여부 등)</li>
        </ul>

        <h2 className="font-bold text-lg mt-6 mb-2">3. 개인정보의 보유 및 이용 기간</h2>
        <p>
          회사는 서비스 제공 완료일로부터 1년간 개인정보를 보관하며, 이후에는 지체 없이
          파기합니다. 단, 관계법령에 특별한 규정이 있는 경우 해당 기간까지 보존합니다.
        </p>
        <p className="mt-2">
          마케팅 및 이벤트 안내에 동의한 고객의 정보는 동의 철회 요청 시 즉시 삭제됩니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">4. 개인정보의 제3자 제공</h2>
        <p>회사는 원칙적으로 고객의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>이용자가 사전에 동의한 경우</li>
          <li>법령의 규정에 따라 제출 의무가 있는 경우</li>
        </ul>

        <h2 className="font-bold text-lg mt-6 mb-2">5. 개인정보 처리위탁</h2>
        <p>
          회사는 서비스 운영을 위해 필요한 업무 중 일부를 외부에 위탁할 수 있으며,
          위탁받은 업체가 개인정보보호법 등 관련 법령을 준수하도록 관리·감독합니다.
        </p>
        <p className="mt-2">(예: 이메일 발송 또는 알림톡 전송 플랫폼 등)</p>

        <h2 className="font-bold text-lg mt-6 mb-2">6. 개인정보의 파기</h2>
        <p>
          회사는 보유기간 경과 또는 처리 목적 달성 시 해당 개인정보를 지체 없이
          안전한 방법으로 파기합니다.
        </p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>전자적 파일 형태: 복구 불가한 기술적 방법으로 삭제</li>
          <li>인쇄물 등 문서 형태: 분쇄 또는 소각</li>
        </ul>

        <h2 className="font-bold text-lg mt-6 mb-2">7. 이용자의 권리와 행사방법</h2>
        <p>
          이용자는 언제든 회사가 보유한 본인 개인정보의 열람·정정·삭제·처리정지를 요청할 수 있으며,
          마케팅 수신 동의 또한 철회할 수 있습니다. 요청은 이메일 또는 전화 등으로 접수 가능합니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">8. 개인정보의 안전성 확보조치</h2>
        <p>회사는 개인정보의 안전한 처리를 위하여 다음과 같은 조치를 시행합니다.</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>접근 권한 관리 및 최소화</li>
          <li>비밀번호 등 주요 정보 암호화 저장</li>
          <li>정기적 보안 점검 및 접근 기록 보관</li>
        </ul>

        <h2 className="font-bold text-lg mt-6 mb-2">9. 개인정보 보호책임자 및 담당자</h2>
        <p>회사는 개인정보처리와 관련한 고객 문의를 신속히 처리하기 위하여 아래와 같이 개인정보보호책임자를 지정합니다.</p>
        <ul className="list-disc ml-5 mt-2 space-y-1">
          <li>성명: 안미정</li>
          <li>직책: 대표</li>
          <li>
            이메일:{" "}
            <a href="mailto:easysaju.saju@gmail.com" className="text-blue-600 underline">
              easysaju.saju@gmail.com
            </a>
          </li>
          <li>전화: 010-2151-3949</li>
        </ul>

        <h2 className="font-bold text-lg mt-6 mb-2">10. 쿠키의 사용</h2>
        <p>
          회사는 별도의 로그인 기능이나 맞춤형 광고를 제공하지 않으며, 현재 웹사이트에서는 쿠키를 이용하지 않습니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">11. 개인정보 처리방침의 변경</h2>
        <p>
          법령, 정책 또는 보안기술 변경에 따라 내용이 추가·삭제·수정될 수 있습니다.
          변경 사항은 홈페이지를 통해 공개되며, 개정 시점부터 효력이 발생합니다.
        </p>

        <h2 className="font-bold text-lg mt-6 mb-2">12. 부칙</h2>
        <p>본 방침은 2025년 10월 1일부터 시행됩니다.</p>

      </main>
    </div>
  );
}
