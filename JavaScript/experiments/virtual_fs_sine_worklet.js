// experiments/virtual_fs_sine_worklet.js
// 【目的】
// ユーザーが指定した「仮想サンプルレート (virtualFs)」で生成した離散サンプルを、
// 実際の AudioContext の sampleRate で出力するため、Zero-Order Hold（サンプル＆ホールド）で鳴らす。
// → virtualFs が低いほど、Nyquist/aliasing を耳で体験できる。

class VirtualFsSineProcessor extends AudioWorkletProcessor {
  constructor() {
    super();

    this.virtualFs = 8000; // 仮想サンプルレート
    this.freq = 440;       // 信号周波数
    this.gain = 0.2;

    this.phase = 0.0;      // rad
    this.hold = 0.0;       // 現在ホールドしているサンプル値
    this.framesUntilNext = 0.0; // 次の仮想サンプル生成までのフレーム数

    this._recalcStep();

    this.port.onmessage = (e) => {
      const msg = e.data || {};
      if (typeof msg.virtualFs === "number" && isFinite(msg.virtualFs) && msg.virtualFs > 0) {
        this.virtualFs = msg.virtualFs;
        this._recalcStep();
      }
      if (typeof msg.freq === "number" && isFinite(msg.freq)) {
        this.freq = msg.freq;
      }
      if (typeof msg.gain === "number" && isFinite(msg.gain)) {
        this.gain = msg.gain;
      }
    };
  }

  _recalcStep() {
    // 1つの仮想サンプルを、実サンプルレート(sampleRate)で何フレーム保持するか
    // stepFrames = sampleRate / virtualFs
    this.stepFrames = sampleRate / this.virtualFs;
    if (!isFinite(this.stepFrames) || this.stepFrames < 1) this.stepFrames = 1;
    this.framesUntilNext = 0; // すぐ更新
  }

  _nextSample() {
    // 仮想サンプルレート基準で位相を進めてサンプル生成
    const x = Math.sin(this.phase) * this.gain;

    this.phase += 2 * Math.PI * (this.freq / this.virtualFs);
    // wrap
    if (this.phase >= 2 * Math.PI) this.phase -= 2 * Math.PI;
    if (this.phase < 0) this.phase += 2 * Math.PI;

    return x;
  }

  process(inputs, outputs) {
    const output = outputs[0];

    for (let ch = 0; ch < output.length; ch++) {
      const out = output[ch];

      for (let i = 0; i < out.length; i++) {
        if (this.framesUntilNext <= 0) {
          this.hold = this._nextSample();
          this.framesUntilNext += this.stepFrames;
        }
        out[i] = this.hold;
        this.framesUntilNext -= 1;
      }
    }
    return true;
  }
}

registerProcessor("virtual-fs-sine", VirtualFsSineProcessor);

