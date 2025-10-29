let letters = [];
let particles = []; // 파티클 배열
let angle = 0;
let previousAngle = 0; // 이전 각도 추적
let baseSpeed = -0.005; // 기본 회전 속도 - 반대 방향
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
let keyPressStartTime = {}; // 각 키의 눌린 시작 시간
let bgColors = [
    [26, 26, 26], // 기본 회색
    [50, 26, 26], // 빨강
    [26, 50, 26], // 초록
    [26, 26, 50], // 파랑
    [50, 50, 26], // 노랑
    [50, 26, 50], // 마젠타
    [26, 50, 50], // 시안
];

// 오디오 관련 변수
let instruments = {};
let instrumentsLoaded = false;
// 전역 오류 로깅 (디버깅 도움)
window.addEventListener('error', function(e) {
    console.error('Global error:', e.message || e);
    let text = document.getElementById('loading-text');
    if (text) text.textContent = 'Error: ' + (e.message || 'See console');
});
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    let text = document.getElementById('loading-text');
    if (text) text.textContent = 'Error: see console';
});
let keyMappings = {
    0: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], // 드럼
    1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], // 베이스
    2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'], // 피아노
    3: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']  // 바이올린
};
// C Major scale notes
let majorScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E'];
let drumSounds = ['C2', 'D2', 'E2', 'F2', 'G2', 'A2', 'B2', 'C3', 'D3', 'E3']; // 드럼용
let isAudioStarted = false;
let lastPlayedAngles = []; // 각 글자가 마지막으로 재생된 각도 추적

function setup() {
    createCanvas(windowWidth, windowHeight);
    textAlign(CENTER, CENTER);
    textSize(32);
    angleMode(RADIANS);
    lastInputTime = millis();
    
    // 성능 최적화
    frameRate(60); // 프레임레이트 제한
    pixelDensity(1); // 레티나 디스플레이 픽셀 밀도 제한
    
    // 오디오 초기화 (사용자 인터랙션 후)
    setupAudio();
}

function setupAudio() {
    console.log('setupAudio called - loading only required samples...');
    
    // Circle 0: 드럼 (MembraneSynth - 라이브러리에 드럼킷 없음)
    instruments[0] = new Tone.MembraneSynth().toDestination();
    console.log('Drum synth ready');
    
    // 필요한 음계만 정의 (C Major scale)
    const bassNotes = {
        'C1': './samples/bass-electric/C1.mp3',
        'D1': './samples/bass-electric/D1.mp3',
        'E1': './samples/bass-electric/E1.mp3',
        'F1': './samples/bass-electric/F1.mp3',
        'G1': './samples/bass-electric/G1.mp3',
        'A1': './samples/bass-electric/A1.mp3',
        'B1': './samples/bass-electric/B1.mp3',
        'C2': './samples/bass-electric/C2.mp3',
        'D2': './samples/bass-electric/D2.mp3',
        'E2': './samples/bass-electric/E2.mp3'
    };
    
    const pianoNotes = {
        'C4': './samples/piano/C4.mp3',
        'D4': './samples/piano/D4.mp3',
        'E4': './samples/piano/E4.mp3',
        'F4': './samples/piano/F4.mp3',
        'G4': './samples/piano/G4.mp3',
        'A4': './samples/piano/A4.mp3',
        'B4': './samples/piano/B4.mp3',
        'C5': './samples/piano/C5.mp3',
        'D5': './samples/piano/D5.mp3',
        'E5': './samples/piano/E5.mp3'
    };
    
    const violinNotes = {
        'C5': './samples/violin/C5.mp3',
        'D5': './samples/violin/D5.mp3',
        'E5': './samples/violin/E5.mp3',
        'F5': './samples/violin/F5.mp3',
        'G5': './samples/violin/G5.mp3',
        'A5': './samples/violin/A5.mp3',
        'B5': './samples/violin/B5.mp3',
        'C6': './samples/violin/C6.mp3',
        'D6': './samples/violin/D6.mp3',
        'E6': './samples/violin/E6.mp3'
    };
    
    let loadedCount = 0;
    const totalInstruments = 3;
    
    function updateLoadProgress() {
        loadedCount++;
        let progress = loadedCount / totalInstruments;
        let pct = Math.round(progress * 100);
        
        let bar = document.getElementById('loading-bar');
        let text = document.getElementById('loading-text');
        if (bar) bar.style.width = pct + '%';
        if (text) text.textContent = 'Loading... ' + pct + '%';
        console.log('Loading progress: ' + pct + '%');
        
        if (loadedCount === totalInstruments) {
            console.log('All instruments loaded successfully!');
            instrumentsLoaded = true;
            
            let overlay = document.getElementById('loading-overlay');
            if (overlay) overlay.style.display = 'none';
            if (text) text.textContent = 'Ready!';
        }
    }
    
    // 비동기 샘플 확인 및 로드: 각 파일이 실제로 존재하는지 확인하고 존재하는 파일만 로드합니다.
    async function checkUrlExists(url) {
        try {
            let res = await fetch(url, { method: 'HEAD' });
            return res.ok;
        } catch (e) {
            // 일부 서버/환경에서 HEAD를 허용하지 않을 수 있으므로 GET으로 폴백
            try {
                let r2 = await fetch(url, { method: 'GET' });
                return r2.ok;
            } catch (e2) {
                return false;
            }
        }
    }

    async function loadSamplerFor(name, notesObj, index, release) {
        let available = {};
        for (let note in notesObj) {
            let url = notesObj[note];
            let ok = await checkUrlExists(url);
            if (ok) {
                available[note] = url;
            } else {
                console.warn('Missing sample for', name, note, url);
            }
        }

        if (Object.keys(available).length === 0) {
            console.warn('No samples available for', name, '- skipping sampler and marking loaded');
            updateLoadProgress();
            return;
        }

        instruments[index] = new Tone.Sampler({
            urls: available,
            release: release,
            onload: function() {
                console.log(name + ' loaded with ' + Object.keys(available).length + ' samples');
                updateLoadProgress();
            }
        }).toDestination();
    }

    // 시작: 비동기 로더 호출
    (async function() {
        try {
            await loadSamplerFor('Bass', bassNotes, 1, 0.5);
            await loadSamplerFor('Piano', pianoNotes, 2, 1);
            await loadSamplerFor('Violin', violinNotes, 3, 0.8);
        } catch (err) {
            console.error('Error while loading samplers:', err);
        }
    })();
    
    // 타임아웃 (30초)
    setTimeout(function() {
        if (!instrumentsLoaded) {
            console.error('Sample loading timed out');
            let text = document.getElementById('loading-text');
            if (text) text.textContent = 'Loading timeout - check console';
        }
    }, 30000);
}

function draw() {
    // 포커스된 원에 따라 배경 색 변경
    let bgColor = bgColors[currentCircleLevel % bgColors.length];
    background(bgColor[0], bgColor[1], bgColor[2]);
    
    // body 배경도 함께 변경
    document.body.style.backgroundColor = `rgb(${bgColor[0]}, ${bgColor[1]}, ${bgColor[2]})`;
    
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
    
    // 블러 효과 적용 (새 원 생성 전)
    // 블러 효과 제거 - 선명하게 유지
    // if (blurAmount > 0.1 && !isWaitingForZoom) {
    //     drawingContext.filter = `blur(${blurAmount}px)`;
    // }
    
    // 모든 원 그리기 (현재 레벨까지) - 퓨어 버전
    noFill();
    stroke(120, 120, 120); // 회색으로 변경
    strokeWeight(1); 
    for (let i = 0; i <= currentCircleLevel; i++) {
        let radius = baseRadius + (i * radiusIncrement);
        circle(centerX, centerY, radius * 2);
        
        // 맨 바깥쪽 원에만 삼각형 침 추가
        if (i === currentCircleLevel) {
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
            
            // 삼각형 침 아래 치직 효과 - 시계 방향 회전에 맞춰 위쪽으로
            let sparkCount = 8;
            let sparkBaseAngle = -PI / 2; // 시계 방향으로 변경
            let sparkRadius = radius + 1;
            for (let s = 0; s < sparkCount; s++) {
                let sparkAngle = sparkBaseAngle + random(-0.12, 0.12);
                let sx = centerX + cos(sparkAngle) * sparkRadius + random(-2,2);
                let sy = centerY + sin(sparkAngle) * sparkRadius + random(-2,2);
                let ex = sx + random(-2, 2);
                let ey = sy + random(-2, 2);
                stroke(220, 220, 255, 120);
                strokeWeight(0.4);
                line(sx, sy, ex, ey);
            }
        }
    }
    
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
        
        // 12시 방향 통과 감지 및 사운드 재생
        checkAndPlayLetterSound(letter, letterAngle, i);

        // 글자가 속한 원의 레벨 (입력 시점에 고정됨)
        let circleLevel = letter.circleLevel;

        // 현재 원의 반지름 계산 - 줌 제거
        let currentRadius = baseRadius + (circleLevel * radiusIncrement);

        // 글자 위치 계산
        let x = cos(letterAngle) * currentRadius;
        let y = sin(letterAngle) * currentRadius;

        translate(x, y);

        // 글자를 항상 읽을 수 있게 회전 보정 - 아랫면이 중심을 향하도록, 오른쪽으로 90도 더 회전
        rotate(letterAngle + PI / 2);

        // 글자 크기 설정 - 누른 정도에 따라
        textSize(letter.size || 32);

        // 글자 더 흰색으로
        // If the letter is currently held, compute opacity from press duration
        if (letter.isHeld && letter.holdStart) {
            let held = millis() - letter.holdStart;
            if (held > 2000) {
                // 2초 지나면 최대 크기와 선명도로 입력
                letter.opacity = 255;
                letter.size = 48;
                letter.isHeld = false;
                delete letter.holdStart;
            } else {
                letter.opacity = 255; // 최소에서도 선명
                // 크기도 업데이트 - 최소 24, 최대 48
                let size = map(held, 0, 2000, 24, 48);
                size = constrain(size, 24, 48);
                letter.size = size;
            }
        }

        let letterAlpha = letter.opacity || 255;
        fill(255, 255, 255, letterAlpha); // ageFactor 제거하여 더 밝게
        noStroke();

        text(letter.char, 0, 0);
        pop();
    }
    
    pop();
    
    // 블러 필터 제거
    drawingContext.filter = 'none';
    
    pop(); // 줌 pop
    
    // 파티클 업데이트 및 그리기 (줌 바깥에서)
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update();
        p.display();
        
        if (p.isDead()) {
            particles.splice(i, 1);
        }
    }
    
    // Instructions
    push();
    fill(150);
    textSize(16);
    if (!instrumentsLoaded) {
        text('Loading instruments...', width / 2, height - 50);
    } else {
        text('Key: add letter | SPACE: 2x speed | →: next circle | ←: prev circle | Scroll: rewind', width / 2, height - 50);
    }
    pop();
}

function keyPressed() {
    // Tone.js 오디오 컨텍스트 시작 (첫 키 입력 시)
    if (!isAudioStarted) {
        Tone.start();
        isAudioStarted = true;
        console.log('Audio started');
    }
    
    // 스페이스바 눌림 감지
    if (keyCode === 32) { // 스페이스바
        isSpacePressed = true;
        return false;
    }
    
    // 오른쪽 화살표 키로 다음 원 추가
    if (keyCode === RIGHT_ARROW) {
        addNewCircleWithZoom();
        return false;
    }
    
    // 왼쪽 화살표 키로 이전 원으로
    if (keyCode === LEFT_ARROW) {
        if (currentCircleLevel > 0) {
            currentCircleLevel--;
            let newMaxRadius = baseRadius + (currentCircleLevel * radiusIncrement);
            targetZoom = Math.max(0.3, (height * 0.85) / (newMaxRadius * 2));
        }
        return false;
    }
    
    // 백스페이스 처리
    if (keyCode === BACKSPACE && letters.length > 0) {
        letters.pop();
        return false;
    }
    
    // 일반 글자 입력 (스페이스 제외) - 눌린 시간 기록
    if (key.length === 1 && keyCode !== 32) {
        // 현재 circle의 키 매핑 확인
        let circleKeys = keyMappings[currentCircleLevel];
        if (!circleKeys || !circleKeys.includes(key)) {
            return false; // 현재 circle에 매핑되지 않은 키는 무시
        }
        
        // 흐림 중에 다른 키 누르면 취소
        if (hasCompletedRotation || isWaitingForZoom) {
            hasCompletedRotation = false;
            isWaitingForZoom = false;
            targetBlur = 0;
            blurAmount = 0;
            lastInputTime = millis();
        }
        
        // 즉시 레터 생성하고 held 상태로 표시
        let pressTime = millis();
        let keyIndex = circleKeys.indexOf(key);
        let newLetter = {
            char: key,
            startAngle: -PI / 2 - angle,
            circleLevel: currentCircleLevel,
            opacity: 255, // start sharp
            size: 24, // start larger
            isHeld: true,
            holdStart: pressTime,
            keyIndex: keyIndex, // 음계 매핑용
            lastPlayedRotation: -1 // 회전 재생 추적
        };
        letters.push(newLetter);
        keyPressStartTime[key] = pressTime;
        
        // 사운드 재생
        playSound(currentCircleLevel, keyIndex, 0.5); // 초기 볼륨
        
        // 파티클 바로 생성
        createParticles();
    }
    
    return false; // 기본 동작 방지
}

function keyReleased() {
    // 스페이스바 뗌 감지
    if (keyCode === 32) {
        isSpacePressed = false;
    }
    
    // 일반 글자 입력 (스페이스 제외)
    if (key.length === 1 && keyCode !== 32) {
        // 흐림 중에 다른 키 누르면 취소 (keyReleased에서도 처리)
        if (hasCompletedRotation || isWaitingForZoom) {
            hasCompletedRotation = false;
            isWaitingForZoom = false;
            targetBlur = 0;
            blurAmount = 0;
        }
        
        lastInputTime = millis(); // 입력 시간 갱신
        targetBlur = 0; // 블러 즉시 제거
        hasCompletedRotation = false; // 블러 진행 중이었다면 취소
        
        // 키를 누른 시간 계산 (0.5초 ~ 3초)
        let pressDuration = 0;
        if (keyPressStartTime[key]) {
            pressDuration = millis() - keyPressStartTime[key];
            delete keyPressStartTime[key]; // 기록 삭제
            // finalize the most recent held letter matching this char
            for (let i = letters.length - 1; i >= 0; i--) {
                if (letters[i].char === key && letters[i].isHeld) {
                    let finalOpacity = map(pressDuration, 0, 2000, 255, 255); // always sharp
                    finalOpacity = constrain(finalOpacity, 255, 255);
                    letters[i].opacity = finalOpacity;
                    let finalSize = map(pressDuration, 0, 2000, 24, 48);
                    finalSize = constrain(finalSize, 24, 48);
                    letters[i].size = finalSize;
                    letters[i].isHeld = false;
                    delete letters[i].holdStart;
                    
                    // 최종 볼륨으로 다시 재생
                    let finalVolume = map(pressDuration, 0, 2000, 0.5, 1.0);
                    finalVolume = constrain(finalVolume, 0.5, 1.0);
                    playSound(letters[i].circleLevel, letters[i].keyIndex, finalVolume);
                    
                    break;
                }
            }
        }
        
        // 파티클 효과는 이미 keyPressed에서 생성했음
    }
    
    return false;
}

function mouseWheel(event) {
    // 마우스 휠로 시간 제어 (회전 각도 조절)
    let scrollAmount = event.delta * 0.001; // 스크롤 감도 조절
    previousAngle = angle;
    angle += scrollAmount;
    // 뒤로 감기(rewind) 감지 - 파티클 효과
    if (scrollAmount > 0) {
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
    targetBlur = 0;
    blurAmount = 0;
    hasCompletedRotation = false;
    
    // 줌아웃 효과 - 새로 추가된 원까지 포함하여 계산
    let newMaxRadius = baseRadius + (currentCircleLevel * radiusIncrement);
    targetZoom = Math.max(0.3, (height * 0.85) / (newMaxRadius * 2)); // 최소 줌 레벨 설정
}

// 파티클 생성 - 레터 입력시
function createParticles() {
    let centerX = width / 2;
    let centerY = height / 2;
    let currentRadius = baseRadius + (currentCircleLevel * radiusIncrement);
    
    // 12시 방향 위치 계산
    let angle12 = -PI / 2;
    
    // 줌을 고려한 반지름
    let zoomedRadius = currentRadius * zoomLevel;
    
    let particleX = centerX + cos(angle12) * zoomedRadius;
    let particleY = centerY + sin(angle12) * zoomedRadius;
    
    // 파티클 생성
    for (let i = 0; i < 5; i++) {
        particles.push(new Particle(particleX, particleY));
    }
}

// Rewind 파티클 생성 (파란색)
function createRewindParticles(scrollSpeed) {
    let centerX = width / 2;
    let centerY = height / 2;
    let currentRadius = baseRadius + (currentCircleLevel * radiusIncrement);
    
    // 12시 방향 위치
    let angle12 = -PI / 2;
    
    // 줌을 고려한 반지름
    let zoomedRadius = currentRadius * zoomLevel;
    
    let particleX = centerX + cos(angle12) * zoomedRadius;
    let particleY = centerY + sin(angle12) * zoomedRadius;
    
    // 왼쪽 방향
    let leftDirection = PI;
    
    // 스크롤 속도에 비례한 파티클
    let particleCount = Math.min(Math.floor(scrollSpeed * 500), 10);
    let speedMultiplier = 1 + scrollSpeed * 100;
    
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

// 키보드로 블러 시작 (Enter 키) - 사용 안함
function keyTyped() {
    // Enter 키 기능 제거 (Right Arrow로 이동)
    // if (key === '\n' || key === '\r') { // Enter 키
    //     hasCompletedRotation = true;
    //     lastInputTime = millis() - 3000;
    // }
    return false;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// 사운드 재생 함수
function playSound(circleLevel, keyIndex, volume = 0.5) {
    if (!instruments[circleLevel]) return;
    
    let note;
    let duration = "8n"; // 8분음표 기본
    
    if (circleLevel === 0) {
        // 드럼 - 각기 다른 드럼 소리 (MembraneSynth)
        note = drumSounds[keyIndex % drumSounds.length];
        instruments[0].triggerAttackRelease(note, "8n", undefined, volume);
    } else if (circleLevel === 1) {
        // 베이스 - 낮은 옥타브 (C1-E2)
        let octave = 1;
        note = majorScale[keyIndex % majorScale.length] + octave;
        instruments[1].triggerAttackRelease(note, "4n", undefined, volume);
    } else if (circleLevel === 2) {
        // 피아노 - 중간 옥타브 (C4-E5)
        let octave = 4;
        note = majorScale[keyIndex % majorScale.length] + octave;
        instruments[2].triggerAttackRelease(note, "8n", undefined, volume);
    } else if (circleLevel === 3) {
        // 바이올린 - 높은 옥타브 (C5-E6)
        let octave = 5;
        note = majorScale[keyIndex % majorScale.length] + octave;
        instruments[3].triggerAttackRelease(note, "4n", undefined, volume);
    }
}

// 12시 방향 통과 시 사운드 재생
function checkAndPlayLetterSound(letter, letterAngle, letterIndex) {
    // 각도를 0-2π 범위로 정규화
    let normalizedAngle = (letterAngle % TWO_PI + TWO_PI) % TWO_PI;
    
    // 12시 방향은 -PI/2를 기준으로 하므로, 이를 0-2π 범위로 변환
    // -PI/2 -> 3PI/2
    let targetAngle = 3 * PI / 2;
    
    // 현재 회전 수 계산
    let currentRotation = Math.floor(angle / TWO_PI);
    
    // 12시 방향 근처 통과 감지 (작은 범위)
    let threshold = 0.05; // 약 3도
    let isNear12 = Math.abs(normalizedAngle - targetAngle) < threshold || 
                   Math.abs(normalizedAngle - targetAngle) > (TWO_PI - threshold);
    
    // 이번 회전에서 아직 재생 안됐으면 재생
    if (isNear12 && letter.lastPlayedRotation !== currentRotation && !letter.isHeld) {
        letter.lastPlayedRotation = currentRotation;
        
        // 볼륨은 글자 크기에 비례
        let volume = map(letter.size, 24, 48, 0.3, 0.8);
        volume = constrain(volume, 0.3, 0.8);
        
        playSound(letter.circleLevel, letter.keyIndex, volume);
    }
}
