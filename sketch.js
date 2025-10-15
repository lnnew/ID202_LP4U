let letters = [];
let angle = 0;
let previousAngle = 0; // 이전 각도 추적
let baseSpeed = 0.005; // 기본 회전 속도
let rotationSpeed = 0.005; // 현재 회전 속도
let baseRadius = 200; // 첫 번째 원의 반지름
let radiusIncrement = 60; // 각 원 사이의 간격
let isSpacePressed = false; // 스페이스바 눌림 상태
let currentCircleLevel = 0; // 현재 활성화된 원의 레벨
let totalRotations = 0; // 총 회전 수

function setup() {
    createCanvas(800, 800);
    textAlign(CENTER, CENTER);
    textSize(32);
    angleMode(RADIANS);
}

function draw() {
    background(26, 26, 26);
    
    // 중심점
    let centerX = width / 2;
    let centerY = height / 2;
    
    // 스페이스바 눌렸을 때 속도 2배
    rotationSpeed = isSpacePressed ? baseSpeed * 2 : baseSpeed;
    
    // 회전 각도 업데이트
    previousAngle = angle;
    angle += rotationSpeed;
    
    // 한 바퀴(2π) 회전 감지
    let prevRotations = Math.floor(previousAngle / TWO_PI);
    let currRotations = Math.floor(angle / TWO_PI);
    
    if (currRotations > prevRotations) {
        // 한 바퀴 완료 - 새 원 추가
        addNewCircle();
    }
    
    // 모든 원 그리기 (현재 레벨까지)
    push();
    noFill();
    stroke(80, 80, 80);
    strokeWeight(1);
    for (let i = 0; i <= currentCircleLevel; i++) {
        let radius = baseRadius + (i * radiusIncrement);
        circle(centerX, centerY, radius * 2);
    }
    pop();
    
    // 12시 방향 눈금 표시
    push();
    stroke(200, 200, 200);
    strokeWeight(3);
    let tickLength = 15;
    line(centerX, centerY - baseRadius + tickLength, 
         centerX, centerY - baseRadius - tickLength);
    pop();
    
    // 모든 글자 그리기
    push();
    translate(centerX, centerY);
    
    for (let i = 0; i < letters.length; i++) {
        let letter = letters[i];
        
        push();
        
        // 각 글자의 현재 각도 = 입력 시점 각도 + 전체 회전
        let letterAngle = letter.startAngle + angle;
        
        // 글자가 속한 원의 레벨 (입력 시점에 고정됨)
        let circleLevel = letter.circleLevel;
        
        // 현재 원의 반지름 계산
        let currentRadius = baseRadius + (circleLevel * radiusIncrement);
        
        // 글자 위치 계산
        let x = cos(letterAngle) * currentRadius;
        let y = sin(letterAngle) * currentRadius;
        
        translate(x, y);
        
        // 글자를 항상 읽을 수 있게 회전 보정
        rotate(-angle);
        
        // 글자 색상 (오래된 것일수록 어둡게)
        let alpha = map(i, 0, max(letters.length - 1, 1), 100, 255);
        fill(255, 255, 255, alpha);
        noStroke();
        
        text(letter.char, 0, 0);
        pop();
    }
    
    pop();
    
    // Instructions
    push();
    fill(150);
    textSize(16);
    text('Press any key to add letters | Hold SPACE for 2x speed | Scroll to rewind/forward', width / 2, height - 50);
    pop();
    
    // Credit
    push();
    fill(150);
    textSize(14);
    textAlign(RIGHT, BOTTOM);
    text('Jihyun', width - 30, height - 30);
    pop();
}

function keyPressed() {
    // 스페이스바 눌림 감지
    if (keyCode === 32) { // 스페이스바
        isSpacePressed = true;
        return false;
    }
    
    // 백스페이스 처리
    if (keyCode === BACKSPACE && letters.length > 0) {
        letters.pop();
        return false;
    }
    
    // 일반 글자 입력 (스페이스 제외)
    if (key.length === 1 && keyCode !== 32) {
        // 새 글자는 현재 활성화된 원(맨 바깥쪽)에 추가
        letters.push({
            char: key,
            startAngle: -PI / 2 - angle,
            circleLevel: currentCircleLevel // 현재 원 레벨에 고정
        });
    }
    
    return false; // 기본 동작 방지
}

function keyReleased() {
    // 스페이스바 뗌 감지
    if (keyCode === 32) {
        isSpacePressed = false;
    }
    return false;
}

function mouseWheel(event) {
    // 마우스 휠로 시간 제어 (회전 각도 조절)
    let scrollAmount = event.delta * 0.001; // 스크롤 감도 조절
    
    previousAngle = angle;
    angle += scrollAmount;
    
    // 한 바퀴(2π) 회전 감지 (스크롤로도)
    let prevRotations = Math.floor(previousAngle / TWO_PI);
    let currRotations = Math.floor(angle / TWO_PI);
    
    if (currRotations > prevRotations) {
        // 한 바퀴 완료 - 새 원 추가
        addNewCircle();
    }
    
    return false; // 기본 스크롤 동작 방지
}

// 새 원 추가 함수 (수동으로 호출)
function addNewCircle() {
    currentCircleLevel++;
}

// 키보드로 새 원 추가 (예: Enter 키)
function keyTyped() {
    if (key === '\n' || key === '\r') { // Enter 키
        addNewCircle();
    }
    return false;
}
