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
let samplesReady = false;
let drumsReady = false; // set true when all 10 drum samples are loaded

// Lofi 코드 정의 (10개)
let lofiChords = [
    { name: 'Cmaj7', notes: ['C4', 'E4', 'G4', 'B4'] },      // 도-미-솔-시
    { name: 'Fmaj7', notes: ['F3', 'A3', 'C4', 'E4'] },      // 파-라-도-미
    { name: 'Am7', notes: ['A3', 'C4', 'E4', 'G4'] },        // 라-도-미-솔
    { name: 'Dm7', notes: ['D3', 'F3', 'A3', 'C4'] },        // 레-파-라-도
    { name: 'Em7', notes: ['E3', 'G3', 'B3', 'D4'] },        // 미-솔-시-레
    { name: 'G7', notes: ['G3', 'B3', 'D4', 'F4'] },         // 솔-시-레-파
    { name: 'E7', notes: ['E3', 'G#3', 'B3', 'D4'] },        // 미-솔#-시-레
    { name: 'Cmaj9', notes: ['C4', 'E4', 'G4', 'B4', 'D5'] },// 도-미-솔-시-레
    { name: 'Dm9', notes: ['D3', 'F3', 'A3', 'C4', 'E4'] },  // 레-파-라-도-미
    { name: 'Ebmaj7', notes: ['Eb3', 'G3', 'Bb3', 'D4'] }    // 미b-솔-시b-레
];

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
    0: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'], // Lofi 코드 (chords)
    1: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], // 드럼 (drums)
    2: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'], // 베이스 (bass)
    3: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/']  // 피아노 (piano)
};
// 사용자에게 표시할 악기 이름 (Circle 0..3)
let instrumentNames = ['Chords', 'Drums', 'Bass', 'Piano'];
// 레이블 표시 상태: 원 변경 시 또는 시작 시 3초 동안 표시
let labelVisible = false;
let labelShownAt = 0;
const LABEL_DURATION = 3000; // ms
// Asset 이미지 경로 (Circle 0..3 -> r1..r4)
// Assumption: images are located at ./assets/r1.png etc. Change paths if your folder differs.
let assetPaths = ['./assets/r1.png', './assets/r2.png', './assets/r3.png', './assets/r4.png'];
let assetImgs = []; // p5.Image objects (populated in preload)

// Keyboard guide images (one per circle). Will be shown only once per circle.
let guidePaths = ['./assets/guide0.png', './assets/guide1.png', './assets/guide2.png', './assets/guide3.png'];
let guideImgs = [];
let guideShown = [false, false, false, false]; // whether we already showed the guide for each circle
let guideTempVisible = false; // currently showing a guide (temporary)
let guideTempShownAt = 0;
const GUIDE_DURATION = 3000; // ms

// Start overlay for navigation arrows (shows once at start)
let startOverlayVisible = true;
let startOverlayShownAt = 0;
const START_OVERLAY_DURATION = 3000; // ms
// C Major scale notes
let majorScale = ['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C', 'D', 'E'];
// 드럼 샘플을 Sampler에 매핑할 노트 이름 10개
let DRUM_NOTES = ['C1','C#1','D1','D#1','E1','F1','F#1','G1','G#1','A1'];
let isAudioStarted = false;
let lastPlayedAngles = []; // 각 글자가 마지막으로 재생된 각도 추적
let globalLastPlayedAngleKey = -1; // 글로벌 12시 통과 추적용

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
    // 시작 시 레이블 표시
    labelVisible = true;
    labelShownAt = millis();
    // 시작 오버레이 표시 타임스탬프
    startOverlayVisible = true;
    startOverlayShownAt = millis();
    // 시작시 해당 circle의 가이드를 필요하면 표시
    showGuideForCurrentCircle();
}

// preload에서 에셋 이미지를 로드합니다. p5가 preload를 완료한 뒤 setup이 실행됩니다.
function preload() {
    // 안전하게 경로를 순회하며 loadImage 호출
    for (let i = 0; i < assetPaths.length; i++) {
        // loadImage will throw an error if missing; provide error callback to avoid hard fail
        assetImgs[i] = loadImage(assetPaths[i],
            () => { /* loaded */ },
            (err) => { console.warn('Asset load failed:', assetPaths[i], err); }
        );
    }
    // load guide images as well
    for (let i = 0; i < guidePaths.length; i++) {
        guideImgs[i] = loadImage(guidePaths[i],
            () => { /* loaded */ },
            (err) => { console.warn('Guide load failed:', guidePaths[i], err); }
        );
    }
}

function setupAudio() {
    console.log('setupAudio called - loading lofi samples...');
    
    let loadedCount = 0;
    const totalFiles = 4; // 코드용 신스(voices 모두 로드되면 1로 카운트) + 드럼(10개 모두 로드되면 1로 카운트) + 베이스 + 피아노
    
    function updateLoadProgress() {
        loadedCount++;
        let progress = loadedCount / totalFiles;
        let pct = Math.round(progress * 100);
        
        let bar = document.getElementById('loading-bar');
        let text = document.getElementById('loading-text');
        if (bar) bar.style.width = pct + '%';
        if (text) text.textContent = 'Loading... ' + loadedCount + '/' + totalFiles + ' (' + pct + '%)';
        console.log('Loading progress: ' + loadedCount + '/' + totalFiles + ' (' + pct + '%)');
        
        if (loadedCount >= totalFiles) {
            console.log('All samples loaded successfully!');
            instrumentsLoaded = true;
            samplesReady = true;
            
            let overlay = document.getElementById('loading-overlay');
            if (overlay) {
                setTimeout(() => {
                    overlay.style.display = 'none';
                }, 300);
            }
            if (text) text.textContent = 'Ready!';
        }
    }
    
    // Circle 0: Lofi 코드 - 최대 5개 음을 동시 재생하기 위해 5개 Sampler 생성
    console.log('Loading chord synths (5 voices for chords)...');
    
    let loadedVoices = 0;
    instruments[0] = {
        voices: [],
        activeNotes: [] // 현재 재생 중인 음들 추적
    };
    
    // 5개의 독립적인 Sampler voice 생성
    for (let i = 0; i < 5; i++) {
        const voice = new Tone.Sampler({
            urls: {
                'C4': './lofi/lofi_synth.wav'
            },
            release: 2,
            onload: () => {
                loadedVoices++;
                console.log(`✓ Chord voice ${loadedVoices}/5 loaded`);
                if (loadedVoices === 5) {
                    updateLoadProgress();
                }
            },
            onerror: (err) => {
                loadedVoices++;
                console.error(`✗ Chord voice ${loadedVoices}/5 error:`, err);
                if (loadedVoices === 5) {
                    updateLoadProgress();
                }
            }
        }).toDestination();
        
        instruments[0].voices.push(voice);
    }

    // Circle 1: 드럼 - 6개 기본 + house에서 4개 랜덤 총 10개 (Sampler 하나에 매핑)
    console.log('Loading drum samples as a single Sampler...');
    const drumSamples = [
        './lofi/drum/kick_soft.wav',
        './lofi/drum/snare_heavy.wav',
        './lofi/drum/snare_lofigirl.wav',
        './lofi/drum/snare_slideee.wav',
        './lofi/drum/hihat_classic.wav',
        './lofi/drum/hihat_dusty.wav'
    ];
    const houseSamples = [
        './lofi/house/book_close.wav',
        './lofi/house/cap_flick.wav',
        './lofi/house/case_lock.wav',
        './lofi/house/crunch.wav',
        './lofi/house/dark_warm_rim.wav',
        './lofi/house/double_tap.wav',
        './lofi/house/dress_shoe.wav',
        './lofi/house/dusty_drawer.wav',
        './lofi/house/hangers_shaker.wav',
        './lofi/house/hing_clothes_2.wav',
        './lofi/house/laptop_key.wav',
        './lofi/house/study_session.wav',
        './lofi/house/vhs_rewind.wav'
    ];
    const shuffled = houseSamples.sort(() => 0.5 - Math.random());
    const selectedHouse = shuffled.slice(0, 4);
    const allDrumSamples = [...drumSamples, ...selectedHouse];
    
    // Sampler urls 매핑 객체 구성 (노트명 -> 파일 경로)
    const drumUrlsMap = {};
    allDrumSamples.forEach((url, index) => {
        const safeUrl = encodeURI(url);
        const note = DRUM_NOTES[index];
        drumUrlsMap[note] = safeUrl;
    });
    instruments[1] = new Tone.Sampler({
        urls: drumUrlsMap,
        release: 0.01,
        onload: () => {
            console.log('✓ Drum Sampler loaded (10 mapped samples)');
            drumsReady = true;
            updateLoadProgress();
        },
        onerror: (err) => {
            console.error('✗ Drum Sampler loading error:', err);
            // 진행률은 올리지 않음 (명확한 실패 표시)
        }
    }).toDestination();
    
    // Circle 2: 베이스 - bass_house_c.wav
    console.log('Loading bass sample...');
    instruments[2] = new Tone.Sampler({
        urls: {
            'C1': './lofi/bass_house_c.wav'
        },
        release: 0.5,
        onload: () => {
            console.log('✓ Bass (bass_house_c.wav) loaded');
            updateLoadProgress();
        },
        onerror: (err) => {
            console.error('✗ Bass loading error:', err);
            // 에러 시 로딩 실패 처리
        }
    }).toDestination();
    
    // Circle 3: 피아노 - lofi_synth.wav를 피아노 음역대(C3 기준)로
    console.log('Loading piano sample (using lofi_synth.wav)...');
    instruments[3] = new Tone.Sampler({
        urls: {
            'C3': './lofi/lofi_synth.wav'
        },
        release: 1,
        onload: () => {
            console.log('✓ Piano (lofi_synth.wav at C3) loaded');
            updateLoadProgress();
        },
        onerror: (err) => {
            console.error('✗ Piano loading error:', err);
            updateLoadProgress();
        }
    }).toDestination();
    
    // 타임아웃 (2분)
    setTimeout(() => {
        if (!instrumentsLoaded) {
            console.error('⚠ Sample loading timed out after 2 minutes');
            console.log('Loaded count:', loadedCount, '/', totalFiles);
            let text = document.getElementById('loading-text');
            if (text) text.textContent = 'Timeout: ' + loadedCount + '/' + totalFiles + ' loaded';
        }
    }, 120000);
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
        // Auto-advance on rotation removed. Circle changes only happen
        // when the user presses LEFT/RIGHT arrow keys.
        targetBlur = 0;
    
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
           // rotation completed — do NOT auto-advance anymore
           // previously we used hasCompletedRotation to trigger an automatic
           // addNewCircleWithZoom() after a timeout; that behavior is removed
           // so we only update the last input timestamp.
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
        
        // 맨 바깥쪽 원에만 삼각형 침 추가 및 현재 악기 라벨 표시 (12시)
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

            // 현재 활성 악기 이름 라벨 (삼각형 위)
            textFont('Arial');
            textSize(14);
            textAlign(CENTER, CENTER);
            let labelText = instrumentNames[currentCircleLevel] || '';
            let labelY = triangleY - 14; // 삼각형보다 위쪽에 배치

            // 레이블/이미지 페이드 로직
            if (labelVisible) {
                let elapsed = millis() - labelShownAt;
                if (elapsed >= LABEL_DURATION) {
                    labelVisible = false;
                }

                // fadeFactor: 1 -> fully visible at start, 0 -> hidden at end
                let fadeFactor = constrain(1 - (elapsed / LABEL_DURATION), 0, 1);

                // 텍스트 페이드 (회색, alpha 적용)
                noStroke();
                let textAlpha = Math.round(255 * fadeFactor);
                fill(180, textAlpha);
                text(labelText, centerX, labelY);

                // 이미지 페이드: 기본 50% 투명도에 페이드 팩터 적용
                let img = assetImgs[currentCircleLevel];
                if (img) {
                    let imgSize = (radius * 2) * 0.3;
                    imageMode(CENTER);
                    // 이미지 알파: 50% (127) * fadeFactor
                    let imgAlpha = Math.round(255 * 0.5 * fadeFactor);
                    tint(255, imgAlpha);
                    if (img.width && img.height) {
                        let aspect = img.height / img.width;
                        image(img, centerX, centerY, imgSize, imgSize * aspect);
                    } else {
                        image(img, centerX, centerY, imgSize, imgSize);
                    }
                    noTint();
                }
            }

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
    
    // 먼저 이번 프레임에 12시를 통과하는 circle 0 글자들 찾기
    let currentAngleKey = Math.floor(angle * 100);
    let circle0LettersAt12 = [];
    
    for (let i = 0; i < letters.length; i++) {
        let letter = letters[i];
        let letterAngle = letter.startAngle + angle;
        let normalizedAngle = (letterAngle % TWO_PI + TWO_PI) % TWO_PI;
        let targetAngle = 3 * PI / 2;
        let threshold = 0.05;
        let isNear12 = Math.abs(normalizedAngle - targetAngle) < threshold || 
                       Math.abs(normalizedAngle - targetAngle) > (TWO_PI - threshold);
        
        if (isNear12 && !letter.isHeld && letter.circleLevel === 0 && 
            letter.lastPlayedAngleKey !== currentAngleKey) {
            circle0LettersAt12.push(letter);
        }
    }
    
    // Circle 0 코드가 있으면 가장 마지막 글자만 코드 변경
    if (circle0LettersAt12.length > 0) {
        stopCurrentChord();
        let lastLetter = circle0LettersAt12[circle0LettersAt12.length - 1];
        let volume = map(lastLetter.size, 24, 48, 0.3, 0.8);
        volume = constrain(volume, 0.3, 0.8);
        playSound(0, lastLetter.keyIndex, volume);
        // trigger shake animation for the letter that caused the chord
        lastLetter.shakeStart = millis();
        lastLetter.shakeDuration = 400; // ms
        lastLetter.shakeMagnitude = map(lastLetter.size || 32, 24, 48, 2, 8);
        // 모든 circle 0 글자들의 lastPlayedAngleKey 업데이트
        circle0LettersAt12.forEach(letter => {
            letter.lastPlayedAngleKey = currentAngleKey;
        });
    }
    
    for (let i = 0; i < letters.length; i++) {
        let letter = letters[i];

        push();

        // 각 글자의 현재 각도 = 입력 시점 각도 + 전체 회전
        let letterAngle = letter.startAngle + angle;
        
        // 12시 방향 통과 감지 및 사운드 재생 (circle 0 제외)
        if (letter.circleLevel !== 0) {
            checkAndPlayLetterSound(letter, letterAngle, i);
        }

        // 글자가 속한 원의 레벨 (입력 시점에 고정됨)
        let circleLevel = letter.circleLevel;

        // 현재 원의 반지름 계산 - 줌 제거
        let currentRadius = baseRadius + (circleLevel * radiusIncrement);

        // 글자 위치 계산
        let x = cos(letterAngle) * currentRadius;
        let y = sin(letterAngle) * currentRadius;

        translate(x, y);

        // if this letter has a recent 12-o'clock trigger, apply a brief shake
        if (letter.shakeStart) {
            let elapsed = millis() - letter.shakeStart;
            if (elapsed < (letter.shakeDuration || 300)) {
                let p = 1 - (elapsed / (letter.shakeDuration || 300));
                // scale overall shake down to 70%
                let mag = (letter.shakeMagnitude || 4) * p * 0.7;
                // vertical (Y) should be 80% of magnitude, horizontal (X) 60%
                let jitterX = random(-mag * 0.6, mag * 0.6);
                let jitterY = random(-mag * 0.8, mag * 0.8);
                translate(jitterX, jitterY);
            } else {
                // cleanup
                delete letter.shakeStart;
                delete letter.shakeDuration;
                delete letter.shakeMagnitude;
            }
        }

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
    
    // 이전 하단 지시문 제거 — 현재 악기 라벨은 12시 방향에서 표시합니다.

    // Start overlay ("<- -> to move between circles") shown only at startup
    if (startOverlayVisible) {
        let elapsed = millis() - startOverlayShownAt;
        if (elapsed >= START_OVERLAY_DURATION) {
            startOverlayVisible = false;
        } else {
            push();
            rectMode(CENTER);
            fill(0, 140);
            noStroke();
            let boxW = 420;
            let boxH = 56;
            rect(width/2, height/2 - 40, boxW, boxH, 8);
            fill(255);
            textSize(20);
            textAlign(CENTER, CENTER);
            text('<- -> to move between circles', width/2, height/2 - 40);
            pop();
        }
    }

    // Temporary per-circle guide: shows once the first time a circle appears
    if (guideTempVisible) {
        let gElapsed = millis() - guideTempShownAt;
        if (gElapsed >= GUIDE_DURATION) {
            guideTempVisible = false;
        } else {
            let guideImg = guideImgs[currentCircleLevel];
            if (guideImg) {
                let currentRadius = baseRadius + (currentCircleLevel * radiusIncrement);
                let imgSize = (currentRadius * 2) * 0.6; // 60% of circle diameter
                imageMode(CENTER);
                // full opacity for guide
                if (guideImg.width && guideImg.height) {
                    let aspect = guideImg.height / guideImg.width;
                    image(guideImg, width/2, height * 0.78, imgSize, imgSize * aspect);
                } else {
                    image(guideImg, width/2, height * 0.78, imgSize, imgSize);
                }
            }
        }
    }
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
            // 이전 원으로 바뀔 때 레이블 표시 시작
            labelVisible = true;
            labelShownAt = millis();
                // 이전 원으로 바뀔 때 해당 circle 가이드를 표시 (최초 1회)
                showGuideForCurrentCircle();
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
            lastPlayedAngleKey: -1 // 글로벌 angle 기준 재생 추적
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
        // rotation completed — do NOT auto-advance anymore
        // previously we used hasCompletedRotation to trigger an automatic
        // addNewCircleWithZoom() after a timeout; that behavior is removed
        // so we only update the last input timestamp.
        lastInputTime = millis();
    }
    
    return false; // 기본 스크롤 동작 방지
}

// 새 원 추가 함수
function addNewCircle() {
    currentCircleLevel++;
}

// Show the guide for the current circle if it hasn't been shown before.
function showGuideForCurrentCircle() {
    if (!guideShown[currentCircleLevel]) {
        guideShown[currentCircleLevel] = true;
        guideTempVisible = true;
        guideTempShownAt = millis();
    }
}

// 줌아웃과 함께 새 원 추가
function addNewCircleWithZoom() {
    // 최대 circle 3까지만 (0: 코드, 1: 드럼, 2: 베이스, 3: 피아노)
    if (currentCircleLevel >= 3) {
        console.log('Maximum circle level reached (2)');
        return;
    }
    
    currentCircleLevel++;
    targetBlur = 0;
    blurAmount = 0;
    hasCompletedRotation = false;
    // 새 원으로 바뀔 때 레이블 표시 시작
    labelVisible = true;
    labelShownAt = millis();
    // 새 원으로 바뀔 때 해당 circle 가이드(최초 1회)를 표시
    showGuideForCurrentCircle();
    
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
function playSound(circleLevel, keyIndex, volume = 0.5, sustain = false) {
    if (!instrumentsLoaded || !samplesReady) {
        console.warn('Instruments not ready yet');
        return;
    }
    
    if (!instruments[circleLevel]) {
        console.warn('Instrument for circle', circleLevel, 'not found');
        return;
    }
    
    if (circleLevel === 0) {
        // Lofi 코드 - 이전 코드 정지하고 새 코드 연속 재생
        stopCurrentChord();
        
        const chord = lofiChords[keyIndex];
        if (chord && instruments[0].voices && instruments[0].voices.length > 0) {
            console.log('Playing chord:', chord.name, chord.notes);
            
            // 코드의 각 음을 별도의 voice로 재생 (sustain)
            chord.notes.forEach((note, index) => {
                if (index < instruments[0].voices.length) {
                    const voice = instruments[0].voices[index];
                    // 버퍼 로드 확인
                    if (voice && voice.loaded) {
                        try {
                            voice.triggerAttack(note, Tone.now(), volume);
                            // 현재 재생 중인 음 추적
                            instruments[0].activeNotes.push({ voice: voice, note: note });
                        } catch (err) {
                            console.error('Error playing chord note:', err);
                        }
                    } else {
                        console.warn('Voice', index, 'not loaded yet');
                    }
                }
            });
        }
    } else if (circleLevel === 1) {
        // 드럼 - Sampler에 매핑된 노트 재생
        if (!instruments[1] || !instruments[1].loaded) {
            console.warn('Drum sampler not loaded yet');
            return;
        }
        const note = DRUM_NOTES[keyIndex % DRUM_NOTES.length];
        try {
            instruments[1].triggerAttackRelease(note, '16n', Tone.now(), volume);
        } catch (err) {
            console.error('Error triggering drum sampler', err);
        }
    } else if (circleLevel === 2) {
        // 베이스 - C1 기준
        if (!instruments[2] || !instruments[2].loaded) {
            console.warn('Bass not loaded yet');
            return;
        }
        // revert: play bass at original octave (C1)
        let note = majorScale[keyIndex % majorScale.length] + "1";
        try {
            instruments[2].triggerAttackRelease(note, "4n", Tone.now(), volume);
        } catch (err) {
            console.error('Error playing bass:', err);
        }
    } else if (circleLevel === 3) {
        // 피아노 - C3 기준
        if (!instruments[3] || !instruments[3].loaded) {
            console.warn('Piano not loaded yet');
            return;
        }
        let note = majorScale[keyIndex % majorScale.length] + "3";
        try {
            // boost volume for circle 4 (user-facing numbering) -> our circleLevel 3
            let boosted = Math.min(volume * 1.5, 1.0);
            instruments[3].triggerAttackRelease(note, "8n", Tone.now(), boosted);
        } catch (err) {
            console.error('Error playing piano:', err);
        }
    }
}

// 코드 정지 함수
function stopCurrentChord() {
    if (instruments[0] && instruments[0].activeNotes) {
        // 모든 활성 음 정지
        instruments[0].activeNotes.forEach(({ voice, note }) => {
            try {
                if (voice && voice.loaded) {
                    voice.triggerRelease(note, Tone.now());
                }
            } catch (err) {
                console.error('Error releasing chord note:', err);
            }
        });
        instruments[0].activeNotes = [];
    }
}

// 12시 방향 통과 시 사운드 재생 (circle 1-3, entry-only trigger with hysteresis)
function checkAndPlayLetterSound(letter, letterAngle, letterIndex) {
    // 각도를 0-2π 범위로 정규화
    let normalizedAngle = (letterAngle % TWO_PI + TWO_PI) % TWO_PI;
    
    // 12시 방향은 -PI/2를 기준으로 하므로, 이를 0-2π 범위로 변환
    // -PI/2 -> 3PI/2
    let targetAngle = 3 * PI / 2;
    
    // 12시 방향 근처 통과 감지 (작은 범위)
    let threshold = 0.05; // 약 3도
    let isNear12 = Math.abs(normalizedAngle - targetAngle) < threshold || 
                   Math.abs(normalizedAngle - targetAngle) > (TWO_PI - threshold);
    
    // entry-only trigger: 영역에 들어오는 순간 1회만 재생
    const wasNear = !!letter._near12;
    if (isNear12 && !wasNear && !letter.isHeld) {
        // 볼륨은 글자 크기에 비례
        let volume = map(letter.size, 24, 48, 0.3, 0.8);
        volume = constrain(volume, 0.3, 0.8);
        playSound(letter.circleLevel, letter.keyIndex, volume);
        // add a brief shake animation when the letter triggers at 12 o'clock
        letter.shakeStart = millis();
        letter.shakeDuration = 300; // ms
        letter.shakeMagnitude = map(letter.size || 24, 24, 48, 2, 6);
    }
    // 상태 갱신
    letter._near12 = isNear12;
}
