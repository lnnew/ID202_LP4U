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

// 녹화 관련 변수
let recorder;
let isRecording = false;
let recordingStartAngle = 0;
let chunks = [];
let canDownload = false; // 4바퀴 완료 후 다운로드 가능 여부
let downloadButtonVisible = false; // 다운로드 버튼 표시 여부
let recordingConfig = null; // 녹화 설정 (배경색, LP 이름, 비율)
let uiOpen = false; // 설정 팝업 열림 상태
let isDownloading = false; // 다운로드 중 플래그
let selectedBgColor = null; // 즉시 적용할 배경색 (array rgb)

function applySelectedBgColor(colorKey) {
    try {
        if (!colorKey) return;
        if (colorKey === 'custom') {
            selectedBgColor = [40, 30, 60];
        } else {
            const idx = parseInt(colorKey);
            if (!isNaN(idx) && idx >= 0 && idx < bgColors.length) {
                selectedBgColor = bgColors[idx];
            }
        }
        if (selectedBgColor) {
            // 바로 캔버스 + body에 적용
            background(selectedBgColor[0], selectedBgColor[1], selectedBgColor[2]);
            document.body.style.backgroundColor = `rgb(${selectedBgColor[0]}, ${selectedBgColor[1]}, ${selectedBgColor[2]})`;
        }
    } catch (e) {
        // If called before p5 canvas exists, just update body
        if (selectedBgColor) {
            document.body.style.backgroundColor = `rgb(${selectedBgColor[0]}, ${selectedBgColor[1]}, ${selectedBgColor[2]})`;
        }
    }
}
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
// Reverse mapping per user request: circle 0 should use z/x/c... and circle 3 use numbers
let keyMappings = {
    0: ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.', '/'],  // circle 0
    1: ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', ';'],  // circle 1
    2: ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],  // circle 2
    3: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']   // circle 3
};
// 사용자에게 표시할 악기 이름 (Circle 0..3)
let instrumentNames = ['Chords', 'Drums', 'Bass', 'Piano'];
// 레이블 표시 상태: 원 변경 시 또는 시작 시 3초 동안 표시
let labelVisible = false;
let labelShownAt = 0;
const LABEL_DURATION = 3000; // ms
// Asset 이미지 경로 (Circle 0..3 -> r1..r4)
// Assumption: images are located at ./assets/r1.png etc. Change paths if your folder differs.
// Reordered assets so circle 0 corresponds to the previous r4 and circle 3 to r1
let assetPaths = ['./assets/r4.png', './assets/r3.png', './assets/r2.png', './assets/r1.png'];
let assetImgs = []; // p5.Image objects (populated in preload)

// Keyboard guide images (one per circle). Will be shown only once per circle.
// Guide images reordered to match the reversed circle order
let guidePaths = ['./assets/guide3.png', './assets/guide2.png', './assets/guide1.png', './assets/guide0.png'];
let guideImgs = [];
let guideShown = [false, false, false, false]; // whether we already showed the guide for each circle
let guideTempVisible = false; // currently showing a guide (temporary)
let guideTempShownAt = 0;
const GUIDE_DURATION = 5000; // ms (show guide PNG for 5s per user request)
// Flags for startup guide behavior
let guideStartupFlag = false; // set true in setup() so the first show is marked as startup
let guideShownAtStartup = false; // true while startup guide is being shown

// Start overlay for navigation arrows (time-based trigger after one normal revolution duration)
let startOverlayVisible = false;
let startOverlayShownAt = 0;
let overlayTriggered = false; // ensure we show it once per app start
let appStartMillis = 0; // capture setup() time
let overlayDelayMs = 0; // computed from normal rotation duration
const START_OVERLAY_DURATION = 5000; // ms visible duration once shown
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

    // 다운로드/설정 UI 초기화 (CSP 대응: 모든 핸들러는 JS에서 등록)
    initRecordingUI();
    // 시작 시 레이블 표시
    labelVisible = true;
    labelShownAt = millis();
    // Start overlay timing setup: compute delay as one normal revolution time
    appStartMillis = millis();
    startOverlayVisible = false; // will appear after computed delay
    startOverlayShownAt = 0;
    overlayTriggered = false;
    // Normal speed uses |baseSpeed| radians per frame; with target 60fps
    // Duration (sec) for one revolution ≈ (2π) / (|baseSpeed| * 60)
    const targetFps = 60;
    const revSeconds = TWO_PI / (Math.abs(baseSpeed) * targetFps);
    overlayDelayMs = Math.round(revSeconds * 1000);
    // 시작시 해당 circle의 가이드를 필요하면 표시
    guideStartupFlag = true; // mark that the next guide shown is the startup guide
    showGuideForCurrentCircle();
    // Compute an initial target zoom so the starting circle is sized appropriately
    {
        let newMaxRadius = baseRadius + (currentCircleLevel * radiusIncrement);
    // Use the smaller screen dimension and a smaller fit factor
    // to make the initial circle view noticeably smaller
    const fitBase = Math.min(width, height);
    targetZoom = Math.max(0.25, (fitBase * 0.80) / (newMaxRadius * 2));
        // set zoomLevel immediately to avoid an initially tiny scale
        zoomLevel = targetZoom;
    }
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
    // Trigger the start overlay after the computed normal-revolution delay (time-based)
    if (!overlayTriggered && (millis() - appStartMillis) >= overlayDelayMs) {
        startOverlayVisible = true;
        startOverlayShownAt = millis();
        overlayTriggered = true;
    }
    // 포커스된 원에 따라 배경 색 변경
    let bgColor;
    
    // 녹화 중이면 설정된 배경색 사용
    if (isRecording && recordingConfig && recordingConfig.bgColor) {
        bgColor = recordingConfig.bgColor;
    } else if (selectedBgColor) {
        // 사용자가 선택한 색을 우선 적용
        bgColor = selectedBgColor;
    } else {
        bgColor = bgColors[currentCircleLevel % bgColors.length];
    }
    
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
    // 다운로드 중이면 애니메이션 멈춤
    if (isDownloading) {
        rotationSpeed = 0;
    }
    
    // 회전 각도 업데이트
    previousAngle = angle;
    angle += rotationSpeed;
    
    // 한 바퀴(2π) 회전 감지 - 앞으로든 뒤로든
    let prevRotations = Math.floor(previousAngle / TWO_PI);
    let currRotations = Math.floor(angle / TWO_PI);

    if (currRotations > prevRotations) {
        // rotation completed — update last input timestamp
        lastInputTime = millis();
        // No longer triggering overlay here; it is time-based now
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
    
    // LP 타이틀 그리기 (녹화 중일 때만)
    if (isRecording && recordingConfig && recordingConfig.lpTitle) {
        push();
        translate(centerX, centerY);
        rotate(angle); // 회전과 함께 움직임
        
        textAlign(CENTER, CENTER);
        textSize(36);
        fill(255, 255, 255, 200);
        noStroke();
        text(recordingConfig.lpTitle, 0, 0);
        
        pop();
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
    
    // Circle 0 (chords): trigger once when letters ENTER the 12 o'clock zone (entry-only, hysteresis)
    // This re-enables chord playback at 12 o'clock without the previous rapid repeats.
    let enteredAt12 = [];
    for (let i = 0; i < letters.length; i++) {
        const L = letters[i];
        if (L.circleLevel !== 0) continue;
        const letterAngle = L.startAngle + angle;
        const norm = (letterAngle % TWO_PI + TWO_PI) % TWO_PI;
        const target = 3 * PI / 2; // 12 o'clock
        const th = 0.05; // ~3 degrees
        const near = Math.abs(norm - target) < th || Math.abs(norm - target) > (TWO_PI - th);
        const wasNear = !!L._near12;
        if (near && !wasNear && !L.isHeld) {
            enteredAt12.push(L);
        }
        L._near12 = near;
    }
    if (enteredAt12.length > 0) {
        stopCurrentChord();
        const last = enteredAt12[enteredAt12.length - 1];
        let vol = map(last.size, 24, 48, 0.3, 0.8);
        vol = constrain(vol, 0.3, 0.8);
        playSound(0, last.keyIndex, vol);
        // subtle shake visual
        last.shakeStart = millis();
        last.shakeDuration = 400;
        last.shakeMagnitude = map(last.size || 32, 24, 48, 2, 8);
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

    // Start overlay text: show a small instruction underneath the guide image
    if (startOverlayVisible) {
        let elapsed = millis() - startOverlayShownAt;
        if (elapsed >= START_OVERLAY_DURATION) {
            startOverlayVisible = false;
        } else {
            push();
            textAlign(CENTER, CENTER);
            textSize(14);
            fill(210, 220);
            // place instruction near the bottom area where guide image appears
            let yPos = Math.min(height * 0.9, height * 0.82 + 48);
            text('<-   ->   to move between circles', width/2, yPos);
            pop();
        }
    }

    // Temporary per-circle guide: shows once the first time a circle appears
    if (guideTempVisible) {
        let gElapsed = millis() - guideTempShownAt;
        // If this was the startup guide, show 2s longer
        let thisDuration = GUIDE_DURATION + (guideShownAtStartup ? 2000 : 0);
        if (gElapsed >= thisDuration) {
            guideTempVisible = false;
            // clear startup marker once finished
            guideShownAtStartup = false;
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
    
    // ===== 녹화 로직 =====
    // Circle 3(네 번째 원) 도달 시 다운로드 버튼 표시
    if (currentCircleLevel >= 3 && !canDownload && !isRecording) {
        canDownload = true;
        showDownloadButton();
        console.log('✓ Circle 3 reached! Download button is now available.');
    }
    
    // 녹화 진행 상황 체크 (한 바퀴 완료되면 자동 중지)
    if (isRecording) {
        checkRecordingProgress();
    }

    // 녹화 중 워터마크 표시 (영상 하단 중앙)
    if (isRecording) {
        push();
        textAlign(CENTER, BOTTOM);
        // 화면 크기에 따라 가변 폰트 크기
        let base = Math.min(width, height);
        let fontSize = Math.max(18, Math.floor(base * 0.03)); // 약 3% 크기, 최소 18px
        // Use Inter font if available (we load it in index.html)
        textFont('Inter');
        textSize(fontSize);
        // Draw slight shadow then the label (only 'LP4U')
        noStroke();
        fill(0, 180);
        text('LP4U', width / 2, height - 28);
        fill(255, 230);
        text('LP4U', width / 2, height - 32);
        pop();
    }
}

function keyPressed() {
    // If an input or textarea has focus, allow native typing (don't treat as instrument keys)
    try {
        const active = document && document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
            return true; // allow default behavior so user can type LP title
        }
        // If the settings UI is open but focus is not inside an input, block instrument keys
        if (uiOpen) {
            return false;
        }
    } catch (e) {
        // ignore DOM access errors
    }
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
    // 입력창 포커스 시 또는 UI 열림 시 악기키 동작 차단
    try {
        const active = document && document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
            return true; // 텍스트 입력 유지
        }
        if (uiOpen) {
            return false;
        }
    } catch (e) {}
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
        // If this was triggered at startup, record that so we extend duration by 2s
        if (guideStartupFlag) {
            guideShownAtStartup = true;
            guideStartupFlag = false;
        }
    }
}

// 줌아웃과 함께 새 원 추가
function addNewCircleWithZoom() {
    // 최대 circle 3까지 허용 (0: Chords, 1: Drums, 2: Bass, 3: Piano)
    if (currentCircleLevel >= 3) {
        console.log('Maximum circle level reached (3)');
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
    // 입력창 포커스 시 또는 UI 열림 시 기본 입력 허용
    try {
        const active = document && document.activeElement;
        if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) {
            return true;
        }
        if (uiOpen) {
            return false;
        }
    } catch (e) {}
    // Enter 키 기능 제거 (Right Arrow로 이동)
    // if (key === '\n' || key === '\r') { // Enter 키
    //     hasCompletedRotation = true;
    //     lastInputTime = millis() - 3000;
    // }
    return false;
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
    // Recompute target zoom on resize so the current circle fits nicely
    let newMaxRadius = baseRadius + (currentCircleLevel * radiusIncrement);
    const fitBase = Math.min(width, height);
    targetZoom = Math.max(0.25, (fitBase * 0.80) / (newMaxRadius * 2));
    // Apply immediately to avoid transient tiny scale after resize
    zoomLevel = targetZoom;
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
        // Lofi chord: sustain the chord until the next chord is played
        const chord = lofiChords[keyIndex];
        if (chord && instruments[0].voices && instruments[0].voices.length > 0) {
            console.log('Playing chord (sustain until next):', chord.name, chord.notes);
            // Stop any currently playing chord first
            stopCurrentChord();
            chord.notes.forEach((note, index) => {
                if (index < instruments[0].voices.length) {
                    const voice = instruments[0].voices[index];
                    if (voice && voice.loaded) {
                        try {
                            // triggerAttack without scheduled release so it sustains
                            voice.triggerAttack(note, Tone.now(), volume);
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

// ==================== 녹화 관련 함수 ====================

function showDownloadButton() {
    const btn = document.getElementById('download-button');
    console.log('Showing download button, element:', btn);
    if (btn) {
        btn.style.display = 'flex';
        console.log('✓ Download button is now visible');
    } else {
        console.error('✗ Download button element not found!');
    }
}

function hideDownloadButton() {
    const btn = document.getElementById('download-button');
    if (btn) {
        btn.style.display = 'none';
        console.log('Download button hidden');
    }
}

// HTML에서 호출되는 전역 함수
window.beginRecordingWithSettings = function(lpTitle, colorIndex, ratio) {
    console.log('=== beginRecordingWithSettings called ===');
    console.log('lpTitle:', lpTitle);
    console.log('colorIndex:', colorIndex);
    console.log('ratio:', ratio);
    
    recordingConfig = {
        lpTitle: lpTitle,
        colorIndex: colorIndex,
        ratio: ratio
    };
    
    console.log('Recording config:', recordingConfig);
    
    // 캔버스 크기 조정
    resizeCanvasForRecording(ratio);
    
    // 배경색 변경
    if (colorIndex !== 'custom') {
        const colorIdx = parseInt(colorIndex);
        if (colorIdx >= 0 && colorIdx < bgColors.length) {
            // 임시로 배경색 변경
            recordingConfig.bgColor = bgColors[colorIdx];
        }
    } else {
        // 커스텀 그라디언트 색상
        recordingConfig.bgColor = [40, 30, 60]; // 보라색 계열
    }
    
    // 잠시 후 녹화 시작 (캔버스 크기 조정 후)
    setTimeout(() => {
        // 시작 각도를 0도로 리셋하여 녹화가 똑바로(0도)에서 시작하도록 함
        angle = 0;
        previousAngle = angle;
        setupRecorderWithConfig();
        startRecording();
    }, 500);
};

function resizeCanvasForRecording(ratio) {
    if (ratio === 'square') {
        resizeCanvas(1080, 1080);
    } else if (ratio === 'mobile') {
        resizeCanvas(1080, 1920);
    }
}

function setupRecorderWithConfig() {
    // MediaRecorder 설정 (캔버스와 오디오 캡처)
    try {
        // 캔버스 스트림 가져오기
        const canvas = document.querySelector('canvas');
        if (!canvas) {
            console.warn('Canvas not found for recording');
            return;
        }
        
        const canvasStream = canvas.captureStream(60); // 60 FPS
        
        // Tone.js 오디오 출력 캡처를 위한 설정
        const audioContext = Tone.context;
        const dest = audioContext.createMediaStreamDestination();
        
        // Tone.Destination이 아직 연결되지 않았다면 연결
        if (!Tone.Destination._connectedToDest) {
            Tone.Destination.connect(dest);
            Tone.Destination._connectedToDest = true;
        }
        
        // 캔버스 비디오 트랙과 오디오 트랙 결합
        const videoTrack = canvasStream.getVideoTracks()[0];
        const audioTrack = dest.stream.getAudioTracks()[0];
        
        const combinedStream = new MediaStream([videoTrack, audioTrack]);
        
        // MediaRecorder 생성
        recorder = new MediaRecorder(combinedStream, {
            mimeType: 'video/webm;codecs=vp9',
            videoBitsPerSecond: 5000000 // 5 Mbps
        });
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunks.push(e.data);
            }
        };
        
        recorder.onstop = () => {
            // 녹화 완료 시 파일 다운로드
            // 다운로드 중에는 LP 애니메이션을 멈춤
            isDownloading = true;
            console.log('⤓ Download starting - pausing animation');
            const blob = new Blob(chunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // 파일명 생성
            const now = new Date();
            const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}_${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
            const fileName = recordingConfig.lpTitle 
                ? `${recordingConfig.lpTitle.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_${timestamp}.webm`
                : `lofi_circle_${timestamp}.webm`;
            a.download = fileName;
            
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            chunks = [];
            console.log('✓ Recording saved:', fileName);

            // 캔버스 크기 원래대로 복원
            resizeCanvas(windowWidth, windowHeight);
            recordingConfig = null;
            // 다운로드 끝났으니 애니메이션 복원
            isDownloading = false;
            console.log('⤒ Download finished - resuming animation');
        };
        
        console.log('✓ Recorder setup complete with config');
    } catch (err) {
        console.error('✗ Recorder setup failed:', err);
    }
}

function setupRecorder() {
    // 기본 설정 (사용하지 않지만 유지)
    console.log('Basic recorder setup - use setupRecorderWithConfig instead');
}

// ---------- UI wiring (CSP-safe) ----------
function initRecordingUI() {
    // Download button opens config popup
    const downloadBtn = document.getElementById('download-button');
    const popup = document.getElementById('config-popup');
    const cancelBtn = popup ? popup.querySelector('.btn-cancel') : null;
    const startBtn = popup ? popup.querySelector('.btn-start') : null;

    if (downloadBtn && popup) {
        downloadBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('[UI] Download button clicked');
            popup.style.display = 'flex';
            uiOpen = true;
            // focus LP title input for convenience
            const lpInput = document.getElementById('lp-title');
            if (lpInput) {
                setTimeout(() => lpInput.focus(), 50);
            }
        });
    }

    // clicking outside the panel closes the popup
    if (popup) {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                closeConfigPopup();
            }
        });
    }

    if (cancelBtn && popup) {
        cancelBtn.addEventListener('click', () => closeConfigPopup());
    }

    if (startBtn && popup) {
        startBtn.addEventListener('click', () => startRecordingWithConfig());
    }

    // Color picker selection
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', function() {
            document.querySelectorAll('.color-option').forEach(o => o.classList.remove('selected'));
            this.classList.add('selected');
            // 즉시 배경 색 적용
            const colorKey = this.dataset.color;
            applySelectedBgColor(colorKey);
        });
    });

    // Ratio selection
    document.querySelectorAll('.ratio-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.ratio-btn').forEach(b => b.classList.remove('selected'));
            this.classList.add('selected');
        });
    });
}

function closeConfigPopup() {
    const popup = document.getElementById('config-popup');
    if (popup) popup.style.display = 'none';
    uiOpen = false;
}

function startRecordingWithConfig() {
    const lpInput = document.getElementById('lp-title');
    const lpTitle = lpInput ? lpInput.value.trim() : '';
    const colorEl = document.querySelector('.color-option.selected');
    const ratioEl = document.querySelector('.ratio-btn.selected');
    const selectedColor = colorEl ? colorEl.dataset.color : '0';
    const selectedRatio = ratioEl ? ratioEl.dataset.ratio : 'square';

    console.log('[UI] Start recording with', { lpTitle, selectedColor, selectedRatio });
    if (typeof window.beginRecordingWithSettings === 'function') {
        window.beginRecordingWithSettings(lpTitle, selectedColor, selectedRatio);
        closeConfigPopup();
    } else {
        console.error('beginRecordingWithSettings not available');
    }
}

function startRecording() {
    if (!recorder || isRecording) return;
    
    try {
        chunks = [];
        recorder.start();
        isRecording = true;
        recordingStartAngle = angle;
        console.log('🔴 Recording started at angle:', angle);
        
        // 화면에 녹화 중 표시
        showRecordingIndicator();
        
        // 다운로드 버튼 숨기기
        hideDownloadButton();
    } catch (err) {
        console.error('✗ Failed to start recording:', err);
    }
}

function stopRecording() {
    if (!recorder || !isRecording) return;
    
    try {
        recorder.stop();
        isRecording = false;
        console.log('⏹ Recording stopped');
        
        // 녹화 중 표시 제거
        hideRecordingIndicator();
        
        // 다운로드 버튼 다시 표시
        showDownloadButton();
    } catch (err) {
        console.error('✗ Failed to stop recording:', err);
    }
}

function showRecordingIndicator() {
    // 화면 우측 상단에 녹화 중 표시
    const indicator = document.createElement('div');
    indicator.id = 'recording-indicator';
    indicator.style.position = 'fixed';
    indicator.style.top = '20px';
    indicator.style.right = '20px';
    indicator.style.padding = '10px 20px';
    // 흑백 심플 스타일
    indicator.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
    indicator.style.color = '#111';
    indicator.style.borderRadius = '5px';
    indicator.style.fontFamily = 'Arial, sans-serif';
    indicator.style.fontSize = '16px';
    indicator.style.fontWeight = 'bold';
    indicator.style.zIndex = '10000';
    indicator.style.display = 'flex';
    indicator.style.alignItems = 'center';
    indicator.style.gap = '10px';
    
    // 깜빡이는 점 추가
    const dot = document.createElement('div');
    dot.style.width = '10px';
    dot.style.height = '10px';
    dot.style.backgroundColor = '#111';
    dot.style.borderRadius = '50%';
    dot.style.animation = 'blink 1s infinite';
    
    indicator.appendChild(dot);
    indicator.appendChild(document.createTextNode('REC'));
    
    document.body.appendChild(indicator);
    
    // 깜빡임 애니메이션 추가
    if (!document.getElementById('blink-style')) {
        const style = document.createElement('style');
        style.id = 'blink-style';
        style.textContent = `
            @keyframes blink {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.3; }
            }
        `;
        document.head.appendChild(style);
    }
}

function hideRecordingIndicator() {
    const indicator = document.getElementById('recording-indicator');
    if (indicator) {
        indicator.remove();
    }
}

function checkRecordingProgress() {
    if (!isRecording) return;
    
    // 한 바퀴(2π) 완료 확인
    let angleDiff = angle - recordingStartAngle;
    
    // 각도 차이가 한 바퀴(2π) 이상이면 녹화 중지
    if (angleDiff <= -TWO_PI) {
        stopRecording();
    }
}

// 테스트용 전역 함수들
window.testShowDownloadButton = function() {
    console.log('Test: Showing download button');
    showDownloadButton();
};

window.testCircleLevel = function() {
    console.log('Current circle level:', currentCircleLevel);
    console.log('Can download:', canDownload);
};
