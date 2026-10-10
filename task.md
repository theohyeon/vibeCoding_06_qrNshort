# 📝 작업 진행 현황 (Task Checklist)

## 📌 신규 요구사항 구현 현황 (QR코드 & URL 단축 웹 앱 통합)

### 1. 상단 내비게이션 및 연결 ('QR코드', 'URL단축' 버튼)
- [x] 메인 포털(`index.html`) 상단 헤더에 'QR코드' 및 'URL단축' 탭 버튼 추가
- [x] 메인 포털 본문에 대형 피처 카드 2종 및 바로가기 버튼 제공
- [x] 'QR코드' 버튼 클릭 시 `[url2qr]` 폴더 `index.html`과 연결
- [x] 'URL단축' 버튼 클릭 시 `[urlShort]` 폴더 `index.html`과 연결
- [x] 각 서브 모듈 헤더에도 서비스 전환 탭을 배치하여 원활한 왕복 네비게이션 제공

### 2. [url2qr] 폴더 구성 및 모듈화
- [x] `[url2qr]` 폴더 내 독립 웹 앱 구성 (`url2qr/index.html`, `url2qr/style.css`, `url2qr/script.js`)
- [x] 기존 QR 코드 생성 엔진 및 고해상도 800×800 JPG 다운로드 무손실 유지
- [x] 쿼리 파라미터(`?url=...`) 지원으로 단축된 링크를 즉시 QR코드로 변환 연동

### 3. [urlShort] 폴더 신규 개발 (URL 단축기)
- [x] **3-1**: 'URL 입력'창(`shortenUrlInput`), '단축하기' 버튼(`shortenBtn`), 읽기 전용 출력 상자(`shortenedResultInput`), '복사' 버튼(`copyBtn`) UI 구현
- [x] **3-2**: 입력 필드가 비어 있을 때 '단축하기' 버튼 비활성화(`disabled`) 및 시각적 비활성화 스타일 처리, 입력 시 실시간 활성화
- [x] **3-3**: '단축하기' 클릭 시 OpenAPI(`is.gd` 공식 JSONP API 및 Fallback) 연동으로 URL 단축 요청 및 읽기 전용 상자에 결과 출력
- [x] **3-4**: '복사' 버튼 클릭 시 클립보드 자동 복사 및 '복사하였습니다' 알림 모달 창 + 토스트 알림 팝업 구현
- [x] 단축 URL 즉시 열기(새 탭) 및 '이 단축 URL로 QR코드 만들기' 교차 기능 연동

### 4. 프로젝트 산출물 및 문서화
- [x] 프로젝트 개요 및 기능 명세서 작성 완료 (`PROJECT_SPECIFICATION.md`)
- [x] 반응형 및 웜 라이트 디자인 시스템 통합 적용
