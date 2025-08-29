// 페이지 로드 시 배경 이미지 로드
document.addEventListener('DOMContentLoaded', function() {
    loadBackgroundImage(); // 배경 이미지 로드
    
    // 테스트 버튼 이벤트 리스너
    document.getElementById('start-test-btn').addEventListener('click', startStabilityTest);
    document.getElementById('stop-test-btn').addEventListener('click', stopStabilityTest);
    
    // navbar 클릭 이벤트 리스너
    document.getElementById('home-link').addEventListener('click', function(e) {
        e.preventDefault();
        showHome();
    });
    
    document.getElementById('info-link').addEventListener('click', function(e) {
        e.preventDefault();
        showInfo();
    });
    
    // 테마 전환 버튼 이벤트 리스너
    document.getElementById('theme-toggle').addEventListener('click', function(e) {
        e.preventDefault();
        toggleTheme();
    });
    
    // 정보 화면에서 홈으로 돌아가기 버튼 이벤트 리스너
    document.getElementById('back-to-home').addEventListener('click', function() {
        showHome();
    });
    
    // 저장된 테마 설정 적용
    applySavedTheme();
    
    // Chart.js 초기화
    initializeChart();
});

// 홈 화면 표시 함수
function showHome() {
    document.getElementById('home-container').style.display = 'block';
    document.getElementById('info-container').style.display = 'none';
}

// 정보 화면 표시 함수
function showInfo() {
    document.getElementById('home-container').style.display = 'none';
    document.getElementById('info-container').style.display = 'block';
}

// 테마 전환 함수
function toggleTheme() {
    const body = document.body;
    const themeToggle = document.getElementById('theme-toggle');
    
    if (body.classList.contains('dark-theme')) {
        // 어두운 테마에서 밝은 테마로 전환
        body.classList.remove('dark-theme');
        themeToggle.textContent = '테마 밝음';
        // 로컬 스토리지에 테마 설정 저장
        localStorage.setItem('theme', 'light');
    } else {
        // 밝은 테마에서 어두운 테마로 전환
        body.classList.add('dark-theme');
        themeToggle.textContent = '테마 어둠';
        // 로컬 스토리지에 테마 설정 저장
        localStorage.setItem('theme', 'dark');
    }
}

// 저장된 테마 설정 적용 함수
function applySavedTheme() {
    const savedTheme = localStorage.getItem('theme');
    const themeToggle = document.getElementById('theme-toggle');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
        themeToggle.textContent = '테마 어둠';
    } else {
        themeToggle.textContent = '테마 밝음';
    }
}

// 전역 변수
let pingChart;
let pingData = [];
let pingTimes = [];
let testInterval;
let isTesting = false;
let testCount = 0; // 테스트 횟수 추적

// Chart.js 초기화
function initializeChart() {
    const ctx = document.getElementById('pingChart').getContext('2d');
    
    pingChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Google.com 핑 시간 (ms)',
                data: [],
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#4a5568'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    },
                    ticks: {
                        color: '#4a5568'
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#4a5568'
                    }
                }
            }
        }
    });
    
    // 어두운 테마용 차트 스타일 설정
    if (document.body.classList.contains('dark-theme')) {
        pingChart.options.scales.y.grid.color = 'rgba(255, 255, 255, 0.1)';
        pingChart.options.scales.x.grid.color = 'rgba(255, 255, 255, 0.1)';
        pingChart.options.scales.y.ticks.color = '#e2e8f0';
        pingChart.options.scales.x.ticks.color = '#e2e8f0';
        pingChart.options.plugins.legend.labels.color = '#e2e8f0';
        pingChart.update();
    }
}

// 네트워크 안정성 테스트 시작 함수
function startStabilityTest() {
    if (isTesting) return;
    
    isTesting = true;
    testCount = 0; // 테스트 횟수 초기화
    
    // UI 업데이트
    const startButton = document.getElementById('start-test-btn');
    const stopButton = document.getElementById('stop-test-btn');
    const statusCircle = document.getElementById('status-circle');
    const statusText = document.getElementById('status-text');
    
    startButton.style.display = 'none';
    stopButton.style.display = 'inline-block';
    statusCircle.className = 'status-circle';
    statusText.textContent = '테스트 중...';
    
    // 데이터 초기화
    pingData = [];
    pingTimes = [];
    pingChart.data.labels = [];
    pingChart.data.datasets[0].data = [];
    pingChart.update();
    
    // 통계 값 초기화
    document.getElementById('current-ping').textContent = '0 ms';
    document.getElementById('avg-ping').textContent = '0 ms';
    document.getElementById('max-ping').textContent = '0 ms';
    
    // 1초마다 핑 테스트 실행
    testInterval = setInterval(() => {
        testGooglePing();
    }, 1000);
}

// 네트워크 안정성 테스트 중지 함수
function stopStabilityTest() {
    if (!isTesting) return;
    
    isTesting = false;
    clearInterval(testInterval);
    
    // UI 업데이트
    const startButton = document.getElementById('start-test-btn');
    const stopButton = document.getElementById('stop-test-btn');
    
    startButton.style.display = 'inline-block';
    stopButton.style.display = 'none';
    
    // 테스트 결과 표시
    displayTestResult();
}

// 테스트 결과 표시 함수
function displayTestResult() {
    if (pingTimes.length === 0) return;
    
    const statusCircle = document.getElementById('status-circle');
    const statusText = document.getElementById('status-text');
    
    // 평균 핑 시간 계산
    const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;
    
    // 네트워크 품질 판단 및 표시 (조정된 기준 적용)
    // 안정적: 평균 핑이 50ms 이하이고, 표준편차가 20 이하일 경우
    // 양호: 평균 핑이 50-300ms 사이이고, 표준편차가 50 이하일 경우
    // 불안정: 그 외의 경우
    
    // 변동성 계산 (표준편차)
    const variance = pingTimes.reduce((a, b) => a + Math.pow(b - avgPing, 2), 0) / pingTimes.length;
    const stdDev = Math.sqrt(variance);
    
    if (avgPing <= 50 && stdDev <= 20) {
        statusCircle.className = 'status-circle stable'; // 안정적 - 초록색
        statusText.textContent = '네트워크 안정적';
    } else if (avgPing > 50 && avgPing <= 300 && stdDev <= 50) {
        statusCircle.className = 'status-circle good'; // 양호 - 초록색
        statusText.textContent = '네트워크 양호';
    } else {
        statusCircle.className = 'status-circle poor'; // 불안정 - 빨간색
        statusText.textContent = '네트워크 불안정';
    }
}

// Google.com 핑 테스트 함수
function testGooglePing() {
    return new Promise((resolve) => {
        const startTime = Date.now();
        const timeout = 5000; // 5초 타임아웃
        
        // Google.com에 HEAD 요청을 보내 핑 시간 측정
        fetch('https://www.google.com', { 
            method: 'HEAD',
            mode: 'no-cors'
        })
        .then(() => {
            const endTime = Date.now();
            const pingTime = endTime - startTime;
            resolve(pingTime);
        })
        .catch(() => {
            // CORS 오류가 발생해도 시간 측정은 가능
            const endTime = Date.now();
            const pingTime = endTime - startTime;
            resolve(pingTime);
        });
        
        // 타임아웃 처리
        setTimeout(() => {
            resolve(-1); // 타임아웃 시 -1 반환
        }, timeout);
    })
    .then(pingTime => {
        if (!isTesting) return;
        
        // 타임아웃 또는 오류 발생 시
        if (pingTime === -1) {
            pingTime = 5000; // 타임아웃은 5000ms로 표시
        }
        
        // 데이터 저장
        pingTimes.push(pingTime);
        pingData.push({
            time: new Date(),
            ping: pingTime
        });
        
        // 테스트 횟수 증가
        testCount++;
        
        // 20개의 핑 체크가 완료되면 테스트 중지
        if (testCount >= 20) {
            stopStabilityTest();
            return;
        }
        
        // 데이터가 20개를 넘어가면 가장 오래된 데이터 삭제
        if (pingTimes.length > 20) {
            pingTimes.shift();
            pingData.shift();
        }
        
        // 차트 업데이트
        const timeLabel = new Date().toLocaleTimeString();
        pingChart.data.labels.push(timeLabel);
        pingChart.data.datasets[0].data.push(pingTime);
        
        // 차트에 표시할 데이터 수 제한 (최근 20개만 표시)
        if (pingChart.data.labels.length > 20) {
            pingChart.data.labels.shift();
            pingChart.data.datasets[0].data.shift();
        }
        
        pingChart.update();
        
        // 통계 업데이트
        updateStatistics();
        
        // 상태 표시등 업데이트
        updateStatusIndicator();
    });
}

// 통계 업데이트 함수
function updateStatistics() {
    if (pingTimes.length === 0) return;
    
    const currentPing = pingTimes[pingTimes.length - 1];
    const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;
    const maxPing = Math.max(...pingTimes);
    
    document.getElementById('current-ping').textContent = currentPing + ' ms';
    document.getElementById('avg-ping').textContent = Math.round(avgPing) + ' ms';
    document.getElementById('max-ping').textContent = maxPing + ' ms';
}

// 상태 표시등 업데이트 함수
function updateStatusIndicator() {
    if (pingTimes.length === 0) return;
    
    const statusCircle = document.getElementById('status-circle');
    const statusText = document.getElementById('status-text');
    const currentPing = pingTimes[pingTimes.length - 1];
    const avgPing = pingTimes.reduce((a, b) => a + b, 0) / pingTimes.length;
    
    // 변동성 계산 (표준편차)
    const variance = pingTimes.reduce((a, b) => a + Math.pow(b - avgPing, 2), 0) / pingTimes.length;
    const stdDev = Math.sqrt(variance);
    
    // 테스트 중에는 실시간 상태 표시
    if (isTesting) {
        if (currentPing > 1000 || avgPing > 1000) {
            statusCircle.className = 'status-circle poor';
            statusText.textContent = '네트워크 불안정';
        } else if (avgPing <= 50 && stdDev <= 20) {
            statusCircle.className = 'status-circle stable';
            statusText.textContent = '네트워크 안정적';
        } else if (avgPing > 50 && avgPing <= 300 && stdDev <= 50) {
            statusCircle.className = 'status-circle good';
            statusText.textContent = '네트워크 양호';
        } else {
            statusCircle.className = 'status-circle poor';
            statusText.textContent = '네트워크 불안정';
        }
    }
}

// 배경 이미지 가져오기 (어두운 사진으로)
function loadBackgroundImage() {
    const body = document.body;
    
    // 로컬 스토리지에서 마지막 업데이트 시간 확인
    const lastUpdate = localStorage.getItem('backgroundLastUpdate');
    const cachedImage = localStorage.getItem('backgroundImage');
    const now = new Date();
    
    // 오늘 이미지를 이미 가져왔는지 확인 (매일 오전 6시 기준)
    if (lastUpdate) {
        const lastUpdateDate = new Date(lastUpdate);
        
        // 마지막 업데이트 날짜의 오전 6시 생성
        const lastUpdateMorning = new Date(lastUpdateDate);
        lastUpdateMorning.setHours(6, 0, 0, 0);
        
        // 현재 시간의 오전 6시 생성
        const todayMorning = new Date(now);
        todayMorning.setHours(6, 0, 0, 0);
        
        // 마지막 업데이트가 오늘 오전 6시 이후이고, 현재 시간이 오늘 오전 6시 이후인 경우
        if (lastUpdateDate >= todayMorning) {
            // 캐시된 이미지가 있으면 사용
            if (cachedImage) {
                body.style.setProperty('--background-image', `url(${cachedImage})`);
                return;
            }
        }
    }
    
    // 로컬 스토리지에서 이미지를 사용하거나 로컬 이미지 사용
    // (Picsum Photos 대신 그라데이션 배경만 사용)
    body.style.setProperty('--background-image', 'none');
    localStorage.setItem('backgroundLastUpdate', now.toISOString());
}