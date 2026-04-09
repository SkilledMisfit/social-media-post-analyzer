# PostAnalyzer | Intelligence Dashboard

A zero-dependency, ultra-lightweight client-side application designed to evaluate and score social media drafts for engagement and conversion probability before you hit publish. 

## 🚀 Key Features

* **Zero-Dependency Architecture**: Built entirely in pure Vanilla JavaScript, HTML5, and CSS3. No React, no Tailwind, no external APIs, and no Node.js required. It runs 100% natively in the browser. 
* **Dual-Engine Scoring Algorithm**: Instantly switch between 'Grow Audience' (Engagement/Hook logic) and 'Sell Products' (Ecommerce/Friction logic).
* **Real-Time Friction Heatmap**: Implements a custom dual-layer DOM overlay that highlights Trust signals (Green) and Buyer Friction (Red) instantaneously as the user types without causing cursor lag.
* **Bilingual Unicode Support**: The scoring engine uses a custom Unicode regex pipeline `(^|[\s\p{P}])` to accurately track and score native Devanagari (Hindi) and phonetic Hinglish words without relying on slow translation APIs.
* **Mobile Viewport Simulator**: A visual engine that calculates character limits based on platform APIs and dynamically forces text truncation to illustrate exactly where the "...see more" link will hide your hook on LinkedIn vs Instagram.
* **Multi-Language Bionic Reading**: Employs `[\p{L}\p{N}]+` Native string evaluation to bold the first half of characters in a word across multiple character alphabets, increasing reading speed and glanceability.
* **Procedural Web Audio**: Synthesizes a premium UI broadcast chime mathematically utilizing the browser's native Web Audio API (Oscillator/Gain nodes), keeping the repository lightweight by omitting `.wav` or `.mp3` assets.

## 🛠️ Installation & Deployment

Because this project is a purely static client-side application, there are absolutely no build steps. 

1. Clone the repository: `git clone https://github.com/[your-username]/social-media-post-analyzer.git`
2. Open `index.html` locally in any modern browser.
3. **Alternatively:** Host instantly via Vercel or Netlify Static deployment.

## 🧠 Why No Frameworks?
This project was an architectural study in performance and native browser capabilities. It was intentionally engineered without modern JavaScript frameworks (React/Next.js) to demonstrate mastery of raw DOM mapping, frame-rate preservation (`requestAnimationFrame`) during rapid input cycles, and XSS-safe text injection.
