const canvas = document.getElementById('oscilloscope');
const ctx = canvas.getContext('2d');
let isPowerOn = false;
let isAudioOn = false;
let audioCtx = null;
let currentSource = null;


const powerBtn = document.getElementById('powerBtn');
const audioBtn = document.getElementById('audioBtn');
const processBtn = document.getElementById('processBtn');


const NEON_GREEN = '#E7FE00';
const NEON_BLUE = '#55CFCF';

function drawFlatline() {
    ctx.fillStyle = '#050808';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!isPowerOn) return;
    
    ctx.lineWidth = 2;
    ctx.strokeStyle = NEON_BLUE;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
}
drawFlatline();


powerBtn.addEventListener('click', () => {
    isPowerOn = !isPowerOn;
    powerBtn.innerText = isPowerOn ? "POWER: ON" : "POWER: OFF";
    powerBtn.classList.toggle('on', isPowerOn);
    audioBtn.disabled = !isPowerOn;
    processBtn.disabled = !isPowerOn;
    
    if (!isPowerOn) {
        if (currentSource) currentSource.stop();
        drawFlatline();
    } else {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        fetchCloudData();
    }
});


audioBtn.addEventListener('click', () => {
    if (!isPowerOn) return;
    isAudioOn = !isAudioOn;
    audioBtn.innerText = isAudioOn ? "AUDIO: LIVE" : "AUDIO: MUTED";
    audioBtn.classList.toggle('on', isAudioOn);
    
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    fetchCloudData(); 
});


processBtn.addEventListener('click', fetchCloudData);

async function fetchCloudData() {
    if (!isPowerOn) return;
    processBtn.innerText = "SYNCING...";

    const payload = {
        sig1Type: document.getElementById('sig1Type').value,
        sig1Freq: parseFloat(document.getElementById('sig1Freq').value),
        sig2Type: document.getElementById('sig2Type').value,
        sig2Freq: parseFloat(document.getElementById('sig2Freq').value),
        operation: document.getElementById('operation').value
    };

    try {
        const response = await fetch('/api/process', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        
        drawOscilloscope(data.sig1, data.result);
        if (isAudioOn) playAudioBuffer(data.result);
        
        processBtn.innerText = "SYNC TO CLOUD";
    } catch (err) {
        console.error("Cloud processing failed", err);
        processBtn.innerText = "ERROR";
    }
}


function drawOscilloscope(sig1, result) {
    ctx.fillStyle = '#050808';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = 'rgba(85, 207, 207, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for(let i=0; i<canvas.height; i+=30) { ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); }
    for(let i=0; i<canvas.width; i+=50) { ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); }
    ctx.stroke();

    const drawWave = (dataArray, color) => {
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        // Adding glow effect
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        
        const sliceWidth = canvas.width / dataArray.length;
        let x = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const y = (dataArray[i] * -0.4 + 0.5) * canvas.height; 
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
            x += sliceWidth;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; 
    };

    drawWave(sig1, NEON_GREEN);
    drawWave(result, NEON_BLUE);
}


function playAudioBuffer(audioData) {
    if (currentSource) currentSource.stop();
    
    const buffer = audioCtx.createBuffer(1, audioData.length, 44100);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < audioData.length; i++) {
        channelData[i] = audioData[i];
    }
    
    currentSource = audioCtx.createBufferSource();
    currentSource.buffer = buffer;
    currentSource.loop = true; 
    currentSource.connect(audioCtx.destination);
    currentSource.start();
}
