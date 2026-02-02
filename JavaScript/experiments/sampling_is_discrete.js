/**
 * 【目的】
 * デジタルオーディオは連続信号ではなく、
 * 一定間隔でサンプリングされた「離散信号」であることを確認する。
 *
 * 【座標系の定義】
 * - 横軸 (x) : 時間（サンプルインデックス n）
 * - 縦軸 (y) : 振幅（正規化された値 -1.0 ～ +1.0）
 *
 * ※ 表示される波形は連続信号ではなく、
 *    離散サンプルを線で結んだ「視覚化」に過ぎない。
 * 
 * 注意：
 *   赤い点は離散サンプルそのものを示す。
 *   線は視覚化のための補間であり、連続信号ではない。
 */

// ==========================
// Canvas 初期化
// ==========================
const canvas  = document.getElementById("c");
const context = canvas.getContext("2d");

// ==========================
// グローバル状態
// ==========================
let fs = 8000;
let f  = 440;
let N  = 100;

// 座標系（★ここを触れば自由に動く）
const origin = {
    x: 60,      // x = 0
    y: 180      // y = 0（x軸）
};

const scale = {
    x: 6,       // sample index → pixel
    y: 80       // amplitude → pixel
};

// ==========================
// サンプル生成
// ==========================
function generateSamples(fs, f, N) {
    let samples = [];
    for (let n = 0; n < N; n++) {
        samples.push(Math.sin(2 * Math.PI * f * n / fs));
    }
    console.log("Sample result:", samples);
    return samples;
}

// ==========================
// 軸の描画
// ==========================
function drawAxes() {

    const W = canvas.width;
    const H = canvas.height;

    context.strokeStyle = "#888";
    context.lineWidth = 1;

    // y-axis (amplitude)
    context.beginPath();
    context.moveTo(origin.x, 10);
    context.lineTo(origin.x, H - 30);
    context.stroke();

    // x-axis (time)
    context.beginPath();
    context.moveTo(origin.x, origin.y);
    context.lineTo(W - 10, origin.y);
    context.stroke();

    // labels
    context.fillStyle = "#000";
    context.font = "12px sans-serif";

    // x-axis label
    context.textAlign = "center";
    context.textBaseline = "bottom";
    context.fillText("Time (sample index)", W / 2, H - 18);

    // y-axis label
    context.textAlign = "left";
    context.textBaseline = "top";
    context.fillText("Amplitude", 10, 20);

    // origin labels
    context.textAlign = "bottom";
    context.textBaseline = "middle";
    context.fillText("0", origin.x - 6, origin.y);

    context.textAlign = "center";
    context.textBaseline = "bottom";
    context.fillText("0", origin.x, origin.y + 4);
}

// ==========================
// 波形・サンプル描画
// ==========================
function drawSignal(samples) {
    if (!samples.length) return;
    context.strokeStyle = "#000";
    context.lineWidth = 2;
    context.beginPath();

    samples.forEach((v, i) => {
        const x = origin.x + i * scale.x;
        const y = origin.y - v * scale.y;
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
    });
    context.stroke();

    // sample points
    context.fillStyle = "red";
    samples.forEach((v, i) => {
        const x = origin.x + i * scale.x;
        const y = origin.y - v * scale.y;
        context.beginPath();
        context.arc(x, y, 3, 0, Math.PI * 2);
        context.fill();
    });
}

// ==========================
// 実行
// ==========================
function render(samples) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();         // 基準座標系
    drawSignal(samples);    
}

// ==========================
// UI
// ==========================
const fsInput = document.getElementById("fsInput");  
const fInput  = document.getElementById("fInput");  
const nInput  = document.getElementById("NInput");     
const btn     = document.getElementById("updateBtn");

// 初期レンダー
let samples = generateSamples(fs, f, N);
render(samples);

// ==========================
// Audio (Web Audio API) 追加
// ==========================
let audioCtx = null;
let workletNode = null;
let isAudioRunning = false;

const startAudioBtn = document.getElementById("startAudioBtn");
const stopAudioBtn  = document.getElementById("stopAudioBtn");
const audioInfo     = document.getElementById("audioInfo");

function sendAudioParams() {
    if (!workletNode) return;

    workletNode.port.postMessage({
        virtualFs: fs,
        freq: f,
        gain: 0.2
    });

    audioInfo.textContent =
        `audio SR=${audioCtx.sampleRate}Hz / virtualFs=${fs}Hz / f=${f}Hz`;
}

async function startAudio() {
    if (isAudioRunning) return;

    audioCtx = new AudioContext();
    await audioCtx.resume();
    await audioCtx.audioWorklet.addModule(
        "experiments/virtual_fs_sine_worklet.js"
    );

    workletNode = new AudioWorkletNode(audioCtx, "virtual-fs-sine");
    workletNode.connect(audioCtx.destination);

    isAudioRunning = true;
    sendAudioParams();
}

async function stopAudio() {
    if (!audioCtx) return;
    if (workletNode) workletNode.disconnect();
    await audioCtx.close();
    audioCtx = null;
    workletNode = null;
    isAudioRunning = false;
    audioInfo.textContent = "";
}

startAudioBtn?.addEventListener("click", () =>
    startAudio().catch(console.error)
);
stopAudioBtn?.addEventListener("click", () =>
    stopAudio().catch(console.error)
);
