let letters = [];
let angle = 0;
let rotationSpeed = 0.005; // 느린 회전 속도

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
    
    // 원의 반지름
    let radius = 250;
    
    // 회전 각도 업데이트
    angle += rotationSpeed;
    
    // 중심 원 그리기 (가이드)
    push();
    noFill();
    stroke(80, 80, 80);
    strokeWeight(1);
    circle(centerX, centerY, radius * 2);
    pop();
    
    // 모든 글자 그리기
    push();
    translate(centerX, centerY);
    rotate(angle);
    
    for (let i = 0; i < letters.length; i++) {
        push();
        
        // 각 글자의 각도 계산 (12시 방향부터 시작)
        let letterAngle = -PI / 2; // 12시 방향 (-90도)
        
        // 글자 위치 계산
        let x = cos(letterAngle) * radius;
        let y = sin(letterAngle) * radius;
        
        translate(x, y);
        
        // 글자를 항상 읽을 수 있게 회전 보정
        rotate(-angle);
        
        // 글자 색상 (오래된 것일수록 어둡게)
        let alpha = map(i, 0, letters.length - 1, 100, 255);
        fill(255, 255, 255, alpha);
        noStroke();
        
        text(letters[i], 0, 0);
        pop();
    }
    
    pop();
    
    // 안내 문구
    push();
    fill(150);
    textSize(16);
    text('키보드를 눌러 글자를 추가하세요', width / 2, height - 50);
    pop();
}

function keyPressed() {
    // 특수 키 제외
    if (key.length === 1) {
        letters.push(key);
        
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
