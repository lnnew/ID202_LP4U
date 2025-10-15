let letters = [];
let angle = 0;
let rotationSpeed = 0.005; // 느린 회전 속도
let baseRadius = 200; // 첫 번째 원의 반지름
let radiusIncrement = 60; // 각 원 사이의 간격

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
    
    // 회전 각도 업데이트
    angle += rotationSpeed;
    
    // 필요한 원의 개수 계산 (첫 글자가 몇 바퀴 돌았는지)
    let maxCircles = 1;
    if (letters.length > 0) {
        let firstLetter = letters[0];
        let totalRotation = firstLetter.startAngle + angle + PI / 2; // 12시 기준으로 계산
        maxCircles = Math.max(1, Math.floor(Math.abs(totalRotation) / (TWO_PI)) + 1);
    }
    
    // 중심 원들 그리기 (가이드)
    push();
    noFill();
    stroke(80, 80, 80);
    strokeWeight(1);
    for (let i = 0; i < maxCircles; i++) {
        let radius = baseRadius + (i * radiusIncrement);
        circle(centerX, centerY, radius * 2);
    }
    pop();
    
    // 모든 글자 그리기
    push();
    translate(centerX, centerY);
    
    for (let i = 0; i < letters.length; i++) {
        let letter = letters[i];
        
        push();
        
        // 각 글자의 현재 각도 = 입력 시점 각도 + 전체 회전
        let letterAngle = letter.startAngle + angle;
        
        // 글자가 몇 바퀴 돌았는지 계산 (12시 기준)
        let totalRotation = letterAngle + PI / 2; // 12시가 0이 되도록
        let circleLevel = Math.floor(Math.abs(totalRotation) / TWO_PI);
        
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
    text('Press any key to add letters', width / 2, height - 50);
    pop();
}

function keyPressed() {
    // 특수 키 제외
    if (key.length === 1) {
        // 새 글자는 항상 12시 방향(-PI/2)에서 시작
        // 현재 회전 각도를 빼서, 전역 회전이 더해졌을 때 12시가 되도록 함
        letters.push({
            char: key,
            startAngle: -PI / 2 - angle
        });
        
        // 너무 많은 글자가 쌓이지 않도록 제한 (옵션)
        if (letters.length > 50) {
            letters.shift();
        }
    }
    
    // 스페이스바나 백스페이스 처리
    if (keyCode === BACKSPACE && letters.length > 0) {
        letters.pop();
    }
    
    return false; // 기본 동작 방지
}
