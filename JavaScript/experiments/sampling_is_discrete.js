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
// Canvas 初期化
// ==========================
const canvas  = document.getElementById("c");
const context = canvas.getContext("2d");

// ==========================
// 軸の描画
// ==========================
function drawAxes() {
    const W = canvas.width;
    const H = canvas.height;

    const left = 40;
    const right = 10;
    const top = 10;
    const bottom = 30;

    context.strokeStyle = "#888";
    context.lineWidth = 1;

    // y-axis (amplitude)
    context.beginPath();
    context.moveTo(left, top);
    context.lineTo(left, H - bottom);
    context.stroke();

    // x-axis (time)
    context.beginPath();
    context.moveTo(left, H / 2);
    context.lineTo(W - right, H / 2);
    context.stroke();

    // labels
    context.fillStyle = "#000";
    context.font = "12px sans-serif";
    context.fillText("Amplitude", 5, 20);
    context.fillText("Time (sample index)", W / 2 - 60, H - 10);

    // ---- ticks ----
    // y = 0 (amplitude)
    context.fillText("0", left - 15, H / 2 + 4);
    // x = 0 (time origin)
    context.fillText("0", left - 5, H / 2 + 20);
}

// ==========================
// 波形描画
// ==========================
function drawWave(samples) {
    const W = canvas.width;
    const H = canvas.height;

    const left   = 40;
    const right  = 10;
    const top    = 10;
    const bottom = 30;

    const plotW = W - left - right;
    const plotH = H - top - bottom;

    context.strokeStyle = "black";
    context.lineWidth = 2;
    context.beginPath();

    samples.forEach((v, i) => {
        const x = left + (i / (samples.length - 1)) * plotW;
        const y = top + plotH / 2 - v * (plotH / 2 * 0.9);
        if (i === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
    });

    context.stroke();
}

// ==========================
// サンプル描画
// ==========================
function drawDots(samples) {
    const W = canvas.width;
    const H = canvas.height;

    const left   = 40;
    const right  = 10;
    const top    = 10;
    const bottom = 30;

    const plotW = W - left - right;
    const plotH = H - top - bottom;

    context.fillStyle = "red";

    samples.forEach((v, i) => {
        const x = left + (i / (samples.length - 1)) * plotW;
        const y = top + plotH / 2 - v * (plotH / 2 * 0.9);
        context.beginPath();
        context.fillStyle = (i === 0) ? "blue" : "red"
        context.arc(x, y, 3, 0, 2 * Math.PI);
        context.fill();
    });

    context.stroke();
}

// ==========================
// 実行
// ==========================
function render(samples) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawAxes();         // 基準座標系
    drawWave(samples);　// 補間された波形（線）
    drawDots(samples);  // 実際のサンプル（点）
}


// ==========================
// サンプリング設定
// ==========================

let fs = 8000;
let f  = 440;
let N  = 100;

// sampling rate [Hz]
const fsInput = document.getElementById("fsInput");  
// signal frequency [Hz]
const fInput  = document.getElementById("fInput");  
// number of samples
const nInput       = document.getElementById("NInput");     
const btn = document.getElementById("updateBtn");

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

// Workletへ現在パラメータを送る
function sendAudioParams() {
  if (!workletNode) return;

  // 数値の安全な補正
  const vFs = (isFinite(fs) && fs > 0) ? fs : 8000;
  const vF  = (isFinite(f)) ? f : 440;

  workletNode.port.postMessage({
    virtualFs: vFs,
    freq: vF,
    gain: 0.2
  });

  if (audioCtx && audioInfo) {
    audioInfo.textContent = 
        `audio sampleRate=${audioCtx.sampleRate}Hz / virtualFs=${vFs}Hz / f=${vF}Hz`;
  }
}

async function startAudio() {
  if (isAudioRunning) return;

  // 注意：ブラウザのポリシーにより、ユーザーの操作（クリック等）なしでは開始できない場合がある
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  await audioCtx.resume();

  // Workletモジュールの読み込み（通常、サーバーまたはlocalhost環境でのみ動作します）
  await audioCtx.audioWorklet.addModule("experiments/virtual_fs_sine_worklet.js");

  workletNode = new AudioWorkletNode(audioCtx, "virtual-fs-sine");
  workletNode.connect(audioCtx.destination);

  isAudioRunning = true;
  sendAudioParams();
}

async function stopAudio() {
  if (!audioCtx) return;
  try {
    if (workletNode) workletNode.disconnect();
    await audioCtx.close();
  } finally {
    workletNode = null;
    audioCtx = null;
    isAudioRunning = false;
    if (audioInfo) audioInfo.textContent = "";
  }
}

// ボタンイベント（ボタンが存在しない場合はスキップ）
if (startAudioBtn) {
  startAudioBtn.addEventListener("click", () => {
    startAudio().catch(err => {
      console.error(err);
      alert("Audio start failed. (Check console)  ※ file:// では動かない可能性あり");
    });
  });
}

if (stopAudioBtn) {
  stopAudioBtn.addEventListener("click", () => {
    stopAudio().catch(console.error);
  });
}

// ユーザーの入力を反映
btn.addEventListener("click", () => {
  fs = Number(fsInput.value);
  f = Number(fInput.value);
  N = Number(nInput.value);

  samples = generateSamples(fs, f, N);
  render(samples);

  if (isAudioRunning) sendAudioParams();

  console.log(`fs=${fs}, f=${f}, N=${N}`);
});
