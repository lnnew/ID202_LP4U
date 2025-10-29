# Rotating Letter Circle

p5.js를 사용한 인터랙티브 시각 디자인 작품입니다.

## 기능
- 중심에서 느리게 회전하는 원
- 키보드 입력 시 12시 방향에 글자가 추가됨
- 모든 글자가 원과 함께 회전
- Backspace로 마지막 글자 삭제 가능

## 로컬에서 실행하기
1. 권장: 로컬 HTTP 서버에서 실행 (브라우저의 CORS 및 샘플 로딩 문제 방지)
   ```powershell
   python -m http.server 8000
   # 그리고 http://localhost:8000 열기
   ```
2. (옵션) 샘플을 프로젝트에 미리 내려받아 로딩 시간을 줄이기:
   - PowerShell에서 `download_samples.ps1` 스크립트를 실행하세요 (git 필요):
     ```powershell
     .\download_samples.ps1
     ```
   - 스크립트가 `./samples/` 폴더를 생성하고 필요한 악기(s: bass-electric, piano, violin)를 복사합니다.

### 샘플 사용 방식
이 프로젝트는 로컬 `./samples/` 폴더의 샘플을 사용하도록 `sketch.js`의 `setupAudio()`가 설정되어 있습니다. 원격 샘플을 쓰려면 `setupAudio()`의 `baseUrl`을 원격 URL로 변경하세요.

## GitHub Pages 배포하기
1. GitHub에 저장소 생성
2. 이 폴더의 파일들을 저장소에 푸시
3. Settings > Pages에서 `main` 브랜치 선택
4. 배포된 URL로 접속

## 커스터마이징
`sketch.js`에서 다음을 수정할 수 있습니다:
- `rotationSpeed`: 회전 속도 (기본값: 0.005)
- `radius`: 원의 반지름 (기본값: 250)
- `textSize`: 글자 크기 (기본값: 32)
- 배경색, 글자색 등
