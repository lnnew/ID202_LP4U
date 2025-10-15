let letters = [];
let particles = []; // 파티클 배열
let angle = 0;
let previousAngle = 0; // 이전 각도 추적
let baseSpeed = 0.005; // 기본 회전 속도
let rotationSpeed = 0.005; // 현재 회전 속도
let baseRadius = 200; // 첫 번째 원의 반지름
let radiusIncrement = 60; // 각 원 사이의 간격
let isSpacePressed = false; // 스페이스바 눌림 상태
let currentCircleLevel = 0; // 현재 활성화된 원의 레벨
let totalRotations = 0; // 총 회전 수
let zoomLevel = 1; // 줌 레벨
let targetZoom = 1; // 목표 줌 레벨
let lastInputTime = 0; // 마지막 입력 시간
let hasCompletedRotation = false; // 한 바퀴 완료 여부
let isWaitingForZoom = false; // 줌아웃 대기 중
let blurAmount = 0; // 블러 강도
let targetBlur = 0; // 목표 블러 강도
let isRewinding = false; // 리와인드 중 여부

function setup() {
    createCanvas(800, 800);
    textAlign(CENTER, CENTER);
    textSize(32);
    angleMode(RADIANS);
    lastInputTime = millis();
    
    // 성능 최적화
    frameRate(60); // 프레임레이트 제한
    pixelDensity(1); // 레티나 디스플레이 픽셀 밀도 제한
}

function draw() {
    background(26, 26, 26);
    
    // 중심점
    let centerX = width / 2;
    let centerY = height / 2;
    
    // 줌 레벨 부드럽게 전환
    zoomLevel = lerp(zoomLevel, targetZoom, 0.05);
    
    // 블러 효과 부드럽게 전환
    blurAmount = lerp(blurAmount, targetBlur, 0.08);
    
    // 한 바퀴 완료 후 3초간 입력 없으면 새 원 생성
    if (hasCompletedRotation && !isWaitingForZoom) {
        let timeSinceInput = millis() - lastInputTime;
        
        // 즉시 블러 시작, 3초에 최대
        if (timeSinceInput > 0) {
            let progress = map(timeSinceInput, 0, 3000, 0, 1);
            progress = constrain(progress, 0, 1);
            
            targetBlur = progress * 10; // 블러 강도 증가
        }
        
        if (timeSinceInput > 3000) {
            isWaitingForZoom = true;
            // 잠깐 멈춤
            setTimeout(() => {
                addNewCircleWithZoom();
                isWaitingForZoom = false;
                hasCompletedRotation = false;
                targetBlur = 0; // 블러 제거
            }, 500);
        }
    } else {
        targetBlur = 0; // 입력 중에는 블러 없음
    }
    
    // 스페이스바 눌렸을 때 속도 2배
    if (!isWaitingForZoom) {
        rotationSpeed = isSpacePressed ? baseSpeed * 2 : baseSpeed;
    } else {
        rotationSpeed = 0; // 줌아웃 중에는 회전 멈춤
    }
    
    // 회전 각도 업데이트
    previousAngle = angle;
    angle += rotationSpeed;
    
    // 한 바퀴(2π) 회전 감지 - 앞으로든 뒤로든
    let prevRotations = Math.floor(previousAngle / TWO_PI);
    let currRotations = Math.floor(angle / TWO_PI);
    
    if (currRotations > prevRotations) {
        hasCompletedRotation = true;
        lastInputTime = millis();
    }
    
    // 줌 적용
    push();
    translate(centerX, centerY);
    scale(zoomLevel);
    translate(-centerX, -centerY);
    
    // 블러 효과 적용
    if (blurAmount > 0.1) {
        drawingContext.filter = `blur(${blurAmount}px)`;
    }
    
    // 모든 원 그리기 (현재 레벨까지)
    push();
    noFill();
    stroke(80, 80, 80);
    strokeWeight(2); // 선 두께 증가하여 더 잘 보이도록
    for (let i = 0; i <= currentCircleLevel; i++) {
        let radius = baseRadius + (i * radiusIncrement);
        circle(centerX, centerY, radius * 2);
        // 각 원마다 12시 방향 눈금 - 아래쪽이 뾰족한 삼각형
        push();
        fill(200, 200, 200);
        noStroke();
        let triangleSize = 12;
        let triangleY = centerY - radius - triangleSize;
        triangle(
            centerX, triangleY + triangleSize,
            centerX - triangleSize/2, triangleY - triangleSize/2,
            centerX + triangleSize/2, triangleY - triangleSize/2
        );
        pop();
        // 눈금과 원이 맞닿는 부분에 잔잔한 치직 효과 (리와인드 중에는 없음)
        if (!isRewinding) {
            let sparkCount = 8;
            let sparkBaseAngle = -PI / 2;
            let sparkRadius = radius + 1;
            for (let s = 0; s < sparkCount; s++) {
                let sparkAngle = sparkBaseAngle + random(-0.12, 0.12);
                let sx = centerX + cos(sparkAngle) * sparkRadius + random(-2,2);
                let sy = centerY + sin(sparkAngle) * sparkRadius + random(-2,2);
                let ex = sx + random(-2, 2); // width 1/3로 줄임
                let ey = sy + random(-2, 2);
                stroke(220, 220, 255, 120);
                strokeWeight(0.4); // 1/3로 줄임
                line(sx, sy, ex, ey);
            }
            noStroke();
        }
    }
    pop();
    
    // 모든 글자 그리기
    push();
    translate(centerX, centerY);
    
    // 글자 렌더링 최적화
    textFont('Arial'); // 시스템 폰트 사용
    
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
    
    // 블러 필터 제거
    drawingContext.filter = 'none';
    
    // 파티클 업데이트 및 그리기 (줌 바깥에서)
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.display();
        
        if (p.isDead()) {
            particles.splice(i, 1);
        }
    }
    
    pop(); // 줌 pop
    
    // Instructions
    push();
    fill(150);
    textSize(16);
    text('Press any key to add letters | Hold SPACE for 2x speed | Scroll to rewind/forward', width / 2, height - 50);
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
        lastInputTime = millis(); // 입력 시간 갱신
        targetBlur = 0; // 블러 즉시 제거
        hasCompletedRotation = false; // 블러 진행 중이었다면 취소
        
        // 새 글자는 현재 활성화된 원(맨 바깥쪽)에 추가
        letters.push({
            char: key,
            startAngle: -PI / 2 - angle,
            circleLevel: currentCircleLevel // 현재 원 레벨에 고정
        });
        
        // 파티클 효과 생성 (12시 방향)
        createParticles();
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
    // 뒤로 감기(rewind) 감지 - 파티클 효과
    if (scrollAmount < 0) {
        isRewinding = true;
        let scrollSpeed = abs(scrollAmount);
        createRewindParticles(scrollSpeed);
    } else {
        isRewinding = false;
    }
    
    // 한 바퀴(2π) 회전 감지 (스크롤로도)
    let prevRotations = Math.floor(previousAngle / TWO_PI);
    let currRotations = Math.floor(angle / TWO_PI);
    
    if (currRotations > prevRotations) {
        hasCompletedRotation = true;
        lastInputTime = millis();
    }
    
    return false; // 기본 스크롤 동작 방지
}

// 새 원 추가 함수
function addNewCircle() {
    currentCircleLevel++;
}

// 줌아웃과 함께 새 원 추가
function addNewCircleWithZoom() {
    currentCircleLevel++;
    // 줌아웃 효과 - 새로 추가된 원까지 포함하여 계산
    let newMaxRadius = baseRadius + (currentCircleLevel * radiusIncrement);
    targetZoom = (height * 0.9) / (newMaxRadius * 2); // 여유있게 0.9로 조정
}

// 파티클 생성
function createParticles() {
    let centerX = width / 2;
    let centerY = height / 2;
    let currentRadius = baseRadius + (currentCircleLevel * radiusIncrement);
    
    // 12시 방향 위치 계산 (고정된 눈금 위치)
    let angle12 = -PI / 2; // 고정된 12시 방향
    
    // 줌을 고려한 반지름
    let zoomedRadius = currentRadius * zoomLevel;
    
    // 고정된 12시 방향 눈금 위치
    let particleX = centerX + cos(angle12) * zoomedRadius;
    let particleY = centerY + sin(angle12) * zoomedRadius;
    
    // 파티클 개수 줄이기 (8 -> 5)
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(particleX, particleY));
    }
}

// Rewind 파티클 생성 (바깥쪽으로)
function createRewindParticles(scrollSpeed) {
    let centerX = width / 2;
    let centerY = height / 2;
    let currentRadius = baseRadius + (currentCircleLevel * radiusIncrement);
    
    // 고정된 12시 방향 (회전 각도와 무관하게)
    let angle12 = -PI / 2;
    
    // 줌을 고려한 반지름
    let zoomedRadius = currentRadius * zoomLevel;
    
    // 12시 방향 위치 (항상 눈금 근처)
    let particleX = centerX + cos(angle12) * zoomedRadius;
    let particleY = centerY + sin(angle12) * zoomedRadius;
    
    // 왼쪽 방향 (PI = 180도)
    let leftDirection = PI;
    
    // 스크롤 속도에 비례한 파티클 수와 속도
    let particleCount = Math.min(Math.floor(scrollSpeed * 500), 10); // 최대 10개
    let speedMultiplier = 1 + scrollSpeed * 100; // 속도 배율
    
    // 왼쪽으로 튀는 파티클
    for (let i = 0; i < particleCount; i++) {
        particles.push(new RewindParticle(particleX, particleY, leftDirection, speedMultiplier));
    }
}

// 파티클 클래스
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        // 사방으로 부드럽게 퍼짐
        let angle = random(TWO_PI);
        let speed = random(0.5, 2);
        this.vx = cos(angle) * speed;
        this.vy = sin(angle) * speed;
        this.alpha = 200;
        this.size = random(1.5, 3); // 아주 작게
        this.life = 0; // 생명 카운터 추가
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        // 빠르게 감속
        this.vx *= 0.92;
        this.vy *= 0.92;
        this.alpha -= 10; // 빠르게 페이드
        this.life++;
    }
    
    display() {
        noStroke();
        fill(255, 255, 255, this.alpha);
        circle(this.x, this.y, this.size);
    }
    
    isDead() {
        return this.alpha <= 0 || this.life > 25; // 최대 생명 제한
    }
}

// Rewind 파티클 클래스 (바깥쪽으로 튐)
class RewindParticle {
    constructor(x, y, direction, speedMultiplier = 1) {
        this.x = x;
        this.y = y;
        // 왼쪽으로 튀고, 위쪽으로도 살짝 튐 (조금 더 느리고 가까이)
        let baseSpeed = random(4, 8); // 더 느리고 가까이
        let speed = baseSpeed * speedMultiplier * 0.7; // 전체적으로 덜 빠르게
        let angleVariation = random(-0.15, 0.4); // 아래로는 적게, 위로는 더 많이
        this.vx = cos(direction + angleVariation) * speed;
        this.vy = sin(direction + angleVariation) * speed;
        this.alpha = 220;
        this.size = random(2, 5);
        this.life = 0;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        // 더 강한 감속
        this.vx *= 0.93;
        this.vy *= 0.93;
        this.alpha -= 5;
        this.life++;
    }
    
    display() {
        noStroke();
        fill(150, 200, 255, this.alpha);
        circle(this.x, this.y, this.size);
    }
    
    isDead() {
        return this.alpha <= 0 || this.life > 45;
    }
}

// 키보드로 새 원 추가 또는 블러 시작 (예: Enter 키)
function keyTyped() {
    if (key === '\n' || key === '\r') { // Enter 키
        // 회전 완료 상태로 설정하여 블러 효과 즉시 시작
        hasCompletedRotation = true;
        lastInputTime = 0; // 블러가 바로 시작되도록 설정
    }
    return false;
}
