# Rotating Letter Circle

p5.js를 사용한 인터랙티브 시각 디자인 작품입니다.

## 기능
- 중심에서 느리게 회전하는 원
- 키보드 입력 시 12시 방향에 글자가 추가됨
- 모든 글자가 원과 함께 회전
- Backspace로 마지막 글자 삭제 가능

## 로컬에서 실행하기
1. `index.html` 파일을 브라우저로 열기
2. 또는 로컬 서버 사용:
   ```
   python -m http.server 8000
   ```

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
