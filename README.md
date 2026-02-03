# 🧪 Digital Audio Lab 
サンプリング（離散時間信号）を「見て・聴いて」理解する実験集です。

## 🎯 プロジェクトの目的
- サンプルレート(fs), 周波数(f), サンプル数(N)を変えながら、離散サンプルの振る舞いを可視化する
- AudioWorklet で「virtualFs（仮想サンプルレート）」で生成したサンプルを ZOH（Sample & Hold）で出力し、
  Nyquist 近傍や virtualFs を下げたときの aliasing を耳で体験する
- 画面表示（点＋線の可視化）と、実際の再生（ZOH）との差を理解する

## 📂 ディレクトリ構成
- **[JavaScript](./JavaScript)**: `Web Audio API` と `Canvas` を用いたブラウザベースのリアルタイム・ビジュアライザー
- **[Python](./Python)**: `NumPy`, `SciPy` を活用したデータ分析およびFFTアルゴリズムのプロトタイピング
- **[Cpp](./Cpp)**: `JUCE` フレームワークや標準ライブラリを用いた高性能・低遅延のリアルタイム処理

## 🛠 技術スタック / Tech Stack
- **Languages**: JavaScript, Python, C++
- **Key Concepts**:
  - FFT (Fast Fourier Transform)
  - Sampling Rate & Latency Control
  - **Object-Oriented Programming (OOP)**:
