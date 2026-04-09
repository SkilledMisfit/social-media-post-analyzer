const DOM = {
    input: document.getElementById('post-input'),
    btnAnalyze: document.getElementById('btn-analyze'),
    btnPreview: document.getElementById('btn-preview'),
    btnDemo: document.getElementById('btn-demo'),
    charCount: document.getElementById('char-count'),
    editorContainer: document.getElementById('editor-container'),
    overlay: document.getElementById('overlay-display'),
    heatmapOverlay: document.getElementById('heatmap-overlay'),
    heatmapToggleWrap: document.getElementById('heatmap-toggle-wrapper'),
    toggleHeatmap: document.getElementById('toggle-heatmap'),
    dimmer: document.getElementById('dimmer'),
    toast: document.getElementById('toast'),
    tabs: document.getElementById('platform-tabs'),
    results: document.getElementById('results-section'),
    toggleEcom: document.getElementById('toggle-ecom'),
    
    // Sim nodes
    simModal: document.getElementById('sim-modal'),
    btnCloseSim: document.getElementById('btn-close-sim'),
    simContent: document.getElementById('sim-content'),
    simLabel: document.getElementById('sim-label'),
    simHint: document.getElementById('sim-platform-hint'),
    toggleBionic: document.getElementById('toggle-bionic'),
    
    body: document.body
};

const Tokens = { forest: '#00E676', gold: '#D4AF37', amber: '#FF9100', red: '#FF3366', cyan: '#00E5FF' };
let state = { platform: 'LinkedIn', processing: false, isEcomMode: false, lastReport: null };

const toast = msg => { DOM.toast.textContent = msg; DOM.toast.classList.add('show'); setTimeout(() => DOM.toast.classList.remove('show'), 3000); };

let audioCtx;
const playChime = () => {
    try {
        if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if(audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator(), gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);
        osc.type = 'triangle'; osc.frequency.setValueAtTime(440, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5);
        osc.start(audioCtx.currentTime); osc.stop(audioCtx.currentTime + 0.5);
    } catch(e) {}
};

const fW = ["buy", "buying", "pay", "cost", "price", "expensive", "credit card", "sign up", "खरीदें", "पैसे", "महंगा", "kharido", "kharid", "paise", "daam", "mehenga"];
const rW = ["guarantee", "refund", "free shipping", "cancel anytime", "no questions", "warranty", "secure", "गारंटी", "पैसे वापस", "मुफ़्त", "paisa wapas", "refund milega", "free delivery", "tension mat lo"];

// Friction Heatmap Engine
const updateHeatmap = () => {
    if(!state.isEcomMode || !DOM.toggleHeatmap.checked) { DOM.heatmapOverlay.style.display = 'none'; return; }
    DOM.heatmapOverlay.style.display = 'block';
    
    let text = DOM.input.value;
    // Escape HTML first to prevent XSS in heatmap overlay
    text = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    
    // Highlight Reds
    fW.forEach(w => { text = text.replace(new RegExp(`(^|[\\s\\p{P}])(${w})([\\s\\p{P}]|$)`, 'giu'), '$1<mark class="red-heat">$2</mark>$3'); });
    // Highlight Greens
    rW.forEach(w => { text = text.replace(new RegExp(`(^|[\\s\\p{P}])(${w})([\\s\\p{P}]|$)`, 'giu'), '$1<mark class="green-heat">$2</mark>$3'); });
    
    DOM.heatmapOverlay.innerHTML = text;
};

// Sync textarea scrolling with overlay
DOM.input.addEventListener('scroll', () => { DOM.heatmapOverlay.scrollTop = DOM.input.scrollTop; });

const setBriefingText = () => {
    const list = document.getElementById('briefing-bullets');
    if(state.isEcomMode){
        list.innerHTML = `
            <li><strong>Buyer Friction:</strong> People hate the idea of "paying". The live heatmap will glow <span style="color:var(--red-alert)">RED</span> on demanding words.</li>
            <li><strong>Trust & Guarantees:</strong> Mentioning free shipping or guarantees builds absolute trust. The heatmap tracks these in <span style="color:var(--forest)">GREEN</span>.</li>
            <li><strong>Urgency / FOMO:</strong> Does your post create a reason to buy <em>today</em>?</li>
            <li><strong>Platform Rules:</strong> Missing a "Link in Bio" on Instagram kills your sales automatically.</li>`;
        DOM.heatmapToggleWrap.style.display = 'flex';
        DOM.heatmapToggleWrap.classList.add('heatmap-active');
        DOM.toggleHeatmap.checked = true;
        updateHeatmap();
    } else {
        list.innerHTML = `
            <li><strong>Catchy Opening:</strong> The first sentence determines if someone stops scrolling. We check its punchiness.</li>
            <li><strong>Emotional Pull:</strong> Posts that trigger emotion (awe, joy, anger) get shared 3x more.</li>
            <li><strong>Call to Action:</strong> If you don't tell the reader exactly what to do at the end, they will just keep scrolling.</li>
            <li><strong>Readability:</strong> Huge blocks of text are intimidating. We grade your formatting.</li>`;
        DOM.heatmapToggleWrap.style.display = 'none';
        DOM.heatmapOverlay.style.display = 'none';
    }
};
setBriefingText();

DOM.toggleHeatmap.addEventListener('change', (e) => {
    DOM.heatmapToggleWrap.classList.toggle('heatmap-active', e.target.checked);
    updateHeatmap();
});

DOM.toggleEcom.addEventListener('change', (e) => {
    state.isEcomMode = e.target.checked;
    if(state.isEcomMode) {
        DOM.body.classList.add('mode-ecom');
        document.getElementById('label-ecom').classList.add('active');
        document.getElementById('label-brand').classList.remove('active');
    } else {
        DOM.body.classList.remove('mode-ecom');
        document.getElementById('label-brand').classList.add('active');
        document.getElementById('label-ecom').classList.remove('active');
    }
    setBriefingText();
    DOM.results.classList.remove('show');
    DOM.input.dispatchEvent(new Event('input')); 
});

const setPlatform = p => {
    state.platform = p;
    Array.from(DOM.tabs.children).forEach(b => {
        const isActive = b.dataset.platform === p;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive);
    });
};
DOM.tabs.addEventListener('click', e => { const b = e.target.closest('button'); if(b) setPlatform(b.dataset.platform); });

DOM.input.addEventListener('input', () => {
    const v = DOM.input.value;
    DOM.charCount.textContent = `${v.length} characters`;
    const hasText = v.trim().length > 0;
    DOM.btnAnalyze.disabled = !hasText;
    DOM.btnPreview.disabled = !hasText;
    
    updateHeatmap();
    
    if(!state.processing) {
        const h = (v.match(/#\w+/g)||[]).length;
        let det = h > 5 ? 'Instagram' : (/\b(subscribe|channel|video)\b/i.test(v) ? 'YouTube' : (/\b(connections|thrilled|excited to share|milestone)\b/i.test(v) ? 'LinkedIn' : (/@\w+/.test(v) ? 'X' : null)));
        if(det && det !== state.platform) { setPlatform(det); toast(`Auto-switched to ${det}`); }
    }
});

DOM.btnDemo.addEventListener('click', () => {
    if(state.isEcomMode) {
        DOM.input.value = "We just dropped our limited edition summer collection.\n\nDon't let high prices stop you when you can get the same quality for 50% less.\n\n100% money-back guarantee. Free shipping on all orders today.\n\nStock is almost sold out, grab yours before they're gone!\n\nLink in bio. 👇\n#streetwear #summerdrop";
        setPlatform('Instagram');
    } else {
        DOM.input.value = "I was rejected from 12 companies before landing my dream job.\n\nHere's what nobody tells you about interviews:\n\nThey're not testing your skills. They're testing your story.\n\nDid you get a job you felt unqualified for? Drop your story below 👇\n\n#careers #jobsearch #interviewtips";
        setPlatform('LinkedIn');
    }
    DOM.input.dispatchEvent(new Event('input'));
});

// ==========================================
// WOW FACTOR 1 & 3: GLANCE SIMULATOR + BIONIC
// ==========================================
const renderMobilePreview = () => {
    DOM.simLabel.textContent = state.platform;
    DOM.simHint.textContent = `Just now • ${state.platform}`;
    let rawLines = DOM.input.value.split('\n');
    
    // Truncation Constraints
    let maxLines, maxChars;
    if(state.platform === 'LinkedIn') { maxLines = 5; maxChars = 210; }
    else if (state.platform === 'Instagram') { maxLines = 3; maxChars = 125; }
    else if (state.platform === 'YouTube') { maxLines = 2; maxChars = 100; }
    else if (state.platform === 'Facebook') { maxLines = 7; maxChars = 400; }
    else { maxLines = 100; maxChars = 1000; } // X has no 'see more' block, just a limit

    let visualText = "";
    let isTruncated = false;
    let currentChars = 0;
    
    for(let i=0; i<rawLines.length; i++){
        if(i >= maxLines || currentChars >= maxChars) { isTruncated = true; break; }
        
        let lineStr = rawLines[i];
        if(currentChars + lineStr.length > maxChars) {
            let sliceLen = maxChars - currentChars;
            visualText += lineStr.substring(0, sliceLen) + "...";
            isTruncated = true; break;
        } else {
            visualText += lineStr + (i < rawLines.length-1 ? "\n" : "");
            currentChars += lineStr.length + 1; // +1 for newline
        }
    }
    
    // Escape HTML for XSS safety
    let safeHtml = visualText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Apply WOW Factor 3: Bionic Format for ALL Languages
    if(DOM.toggleBionic.checked) {
        safeHtml = safeHtml.replace(/(^|[\s\p{P}])([\p{L}\p{N}]+)(?=[\s\p{P}]|$)/gu, (match, prefix, word) => {
            if(word.length <= 2) return `${prefix}<strong>${word}</strong>`;
            const half = Math.ceil(word.length / 2);
            return `${prefix}<strong>${word.substring(0, half)}</strong>${word.substring(half)}`;
        });
    }

    if(isTruncated) safeHtml += ` <span class="see-more-link">...see more</span>`;
    
    DOM.simContent.innerHTML = safeHtml;
};

DOM.btnPreview.addEventListener('click', () => {
    renderMobilePreview();
    DOM.simModal.classList.add('active');
});

DOM.btnCloseSim.addEventListener('click', () => { DOM.simModal.classList.remove('active'); });
DOM.toggleBionic.addEventListener('change', renderMobilePreview);


// ==========================================
// ENGINE
// ==========================================
const engine = (text, isEcom) => {
    const clamp = (v, min=0, max=100) => Math.max(min, Math.min(max, Math.round(v)));
    
    let cta = 0, read = 0;
    const cw = ["comment","share","follow","dm","save","link in bio","subscribe","drop","tell me","let me know","buy","shop","get","claim","grab", "कमेंट", "शेयर", "फॉलो", "खरीदें", "comment karo", "share karo", "follow karein", "link bio me"];
    const matchedCTAs = new Set();
    cw.forEach(w => { if (new RegExp(`(^|[\\s\\p{P}])${w}([\\s\\p{P}]|$)`, 'iu').test(text)) matchedCTAs.add(w); });
    cta += Math.min(60, matchedCTAs.size * 20); 
    if(matchedCTAs.size > 0 && cw.some(w=>new RegExp(`(^|[\\s\\p{P}])${w}([\\s\\p{P}]|$)`,'iu').test(text.slice(-Math.floor(text.length*0.3))))) cta+=30;
    if(/[?👇⬇]$/.test(text.trim())) cta+=20; 

    const linksCount = (text.match(/https?:\/\/[^\s]+/g)||[]).length;
    let platformPenalty = 0;
    let platformAdvice = "";

    if (state.platform === 'Instagram' && linksCount > 0 && !/\blink (in )?bio\b/i.test(text)) {
        platformPenalty -= 30; platformAdvice = "Instagram doesn't allow clickable links. Say 'Link in Bio'.";
    } else if (state.platform === 'LinkedIn' && linksCount > 0) {
        platformPenalty -= 10; platformAdvice = "Links in the post body can reduce your views on LinkedIn.";
    } else if (state.platform === 'TikTok' || state.platform === 'YouTube') {
        if (linksCount === 0) { platformPenalty -= 10; platformAdvice = "Make sure to tell viewers where to click (e.g. pinned comment)."; }
    }
    cta = clamp(cta + platformPenalty);

    const words = text.split(/\s+/).filter(w=>w).length || 1;
    const lines = (text.match(/\n/g)||[]).length;
    read += words>=50&&words<=250?30:words>250?10:20;
    read += lines>=3?40:lines===0?0:20;
    if(!text.split(/[.!?]+/).some(s=>s.split(/\s+/).length>30)) read+=30; read=clamp(read);

    if(isEcom) {
        let friction = 100, risk = 0, urgency = 0;
        let matchedFriction = 0;
        fW.forEach(w => {
            const matches = text.match(new RegExp(`(^|[\\s\\p{P}])${w}([\\s\\p{P}]|$)`, 'giu'));
            if (matches) matchedFriction += matches.length;
        });
        friction = clamp(100 - Math.min(60, matchedFriction * 15));

        let rCount = 0; rW.forEach(w => { if (new RegExp(`(^|[\\s\\p{P}])${w}([\\s\\p{P}]|$)`, 'iu').test(text)) rCount++; });
        risk += Math.min(100, rCount * 35); 
        
        const uW = ["limited", "sold out", "ending soon", "today only", "last chance", "hurry", "expire", "सीमित", "सिर्फ आज", "जल्दी", "jaldi karo", "last chance", "khatam", "turant"];
        let uCount = 0; uW.forEach(w => { if (new RegExp(`(^|[\\s\\p{P}])${w}([\\s\\p{P}]|$)`, 'iu').test(text)) uCount++; });
        urgency += Math.min(100, uCount * 40);

        let overall = clamp(friction*0.25 + risk*0.3 + urgency*0.25 + cta*0.2);
        return { o: overall, m: [
            {n: "Buyer Friction", v: friction, t: friction<70?"You asked them to 'buy/pay' too directly. Try softer words like 'get' or 'claim'.":"Great! You aren't scaring off buyers with harsh words."},
            {n: "Trust & Guarantees", v: risk, t: risk<70?"Add a guarantee or mention free shipping to build trust.":"Strong trust signals detected!"},
            {n: "Urgency / FOMO", v: urgency, t: urgency<70?"Give them a reason to act today (like 'limited time').":"Excellent urgency! They will want to tap quickly."},
            {n: "Platform Fit", v: cta, t: platformAdvice || (cta<70?"Make your Call-To-Action much clearer.":"Perfect Call-To-Action.")},
            {n: "Readability", v: read, t: read<70?"Break your text into smaller, readable paragraphs.":"Easy to read and well spaced."}
        ]};
    } else {
        let hook = 0, emotion = 0, hashScore = 0;
        const firstLine = text.split('\n')[0].split('.')[0].trim();
        const hookLen = firstLine.split(/\s+/).filter(w=>w).length;
        hook += hookLen<=8?40:hookLen<=15?20:5;
        if(/\?$/.test(firstLine)) hook+=20; if(/^\d/.test(firstLine)) hook+=15;
        if(new RegExp(`(^|[\\s\\p{P}])(stop|secret|truth|never|always|warning|how|why|ruko|raaz|sach|kabhi mat|jaan lo)([\\s\\p{P}]|$)`, 'iu').test(firstLine)) hook+=25;
        if(hookLen>20) hook-=20; hook=clamp(hook);

        const ew = ["amazing","hate","love","fear","excited","proud","angry","broken","struggle","win","fail", "शानदार", "प्यार", "गर्व", "gajab", "mast", "bekar", "dard"];
        let eCount = 0; ew.forEach(w => { if (new RegExp(`(^|[\\s\\p{P}])${w}([\\s\\p{P}]|$)`, 'iu').test(text)) eCount++; });
        emotion += Math.min(50, eCount * 15);
        if(new RegExp(`(^|[\\s\\p{P}])(I|me|my|you|your|tum|main|mera)([\\s\\p{P}]|$)`, 'iu').test(text)) emotion+=30;
        if(/\p{Emoji}/u.test(text)) emotion+=15; emotion=clamp(emotion);

        const hashes = (text.match(/#\w+/g)||[]).length;
        hashScore = state.platform==='LinkedIn' ? (hashes===0?20:hashes<=3?100:hashes<=5?70:20) :
                    state.platform==='Instagram' ? (hashes===0?10:hashes<=10?90:hashes<=15?100:60) :
                    state.platform==='YouTube' ? (hashes===0?40:hashes<=3?100:hashes<=5?60:20) :
                    state.platform==='Facebook' ? (hashes===0?50:hashes<=2?100:hashes<=4?50:10) :
                    (hashes===0?40:hashes<=2?100:hashes<=4?60:20);

        return { o: clamp(hook*0.25 + emotion*0.2 + cta*0.2 + hashScore*0.15 + read*0.2), m: [
            {n: "Catchy Opening", v: hook, t: hook<70?"Make your first sentence shorter and punchier to stop the scroll.":"Fantastic opening line!"},
            {n: "Emotional Pull", v: emotion, t: emotion<70?"Try to use more feeling-based words to connect with readers.":"Very relatable and emotional copy."},
            {n: "Call To Action", v: cta, t: platformAdvice || (cta<70?"Tell your readers exactly what you want them to do next.":"Great clear instructions for the reader.")},
            {n: "Hashtag Use", v: hashScore, t: hashScore<70?"You are using too many or too few hashtags for this platform.":"Perfect hashtag density for this app."},
            {n: "Readability", v: read, t: read<70?"Break up large walls of chunked text with spacing.":"Easy to read formatting."}
        ]};
    }
};

DOM.btnAnalyze.addEventListener('click', async () => {
    const raw = DOM.input.value.trim(); if(!raw) return;
    state.processing = true; DOM.btnAnalyze.disabled = true;
    DOM.heatmapOverlay.style.display = 'none'; // hide heatmap during laser
    DOM.input.style.color = 'transparent';
    playChime(); 
    
    DOM.dimmer.classList.add('active'); DOM.editorContainer.classList.add('scan-active');
    
    DOM.overlay.innerHTML = '';
    DOM.overlay.style.display = 'block';
    
    const chunks = raw.split(/(\s+)/);
    chunks.forEach((chunk, i) => {
        if (/\s+/.test(chunk)) {  DOM.overlay.appendChild(document.createTextNode(chunk)); } 
        else if (chunk.length > 0) {
            const span = document.createElement('span'); span.id = `w-${i}`; span.textContent = chunk; DOM.overlay.appendChild(span);
        }
    });
    
    const words = Array.from(DOM.overlay.querySelectorAll('span'));
    if (words.length > 0) {
        let fIdx = 0; const fInt = setInterval(()=>{
            if(fIdx>0 && words[fIdx-1]) words[fIdx-1].classList.remove('word-flash');
            if(words[fIdx]) words[fIdx].classList.add('word-flash');
            fIdx+=4;
        }, 20);

        let lIdx=0; const lbls=["Reading text...", "Grading rules...", "Finalizing score..."];
        const lInt = setInterval(()=>DOM.btnAnalyze.textContent=lbls[lIdx++%3], 200);

        await new Promise(r=>setTimeout(r, 800));
        clearInterval(fInt); clearInterval(lInt);
    } else {
        await new Promise(r=>setTimeout(r, 800));
    }
    
    DOM.editorContainer.classList.remove('scan-active'); DOM.overlay.style.display='none';
    DOM.input.style.color='var(--text-main)'; 
    updateHeatmap(); // restore heatmap if active
    DOM.btnAnalyze.textContent= "Grade My Post"; 
    DOM.dimmer.classList.remove('active');
    
    const results = engine(raw, state.isEcomMode);
    state.lastReport = results;
    render(results);
});

const render = data => {
    DOM.results.classList.add('show');
    DOM.results.scrollIntoView({behavior:'smooth'});
    const getC = v => v>=85?Tokens.forest:v>=70?(state.isEcomMode ? Tokens.cyan : Tokens.gold):v>=50?Tokens.amber:Tokens.red;
    document.getElementById('verdict-headline').textContent = data.o>=85?"READY TO PUBLISH: Looks Great!":data.o>=70?"GOOD: But could use some tweaks":data.o>=50?"FAIR: You should rewrite this":"POOR: Do not publish this yet";
    
    const sNum = document.getElementById('overall-score'); let cur=0;
    if(window._scoreAnim) cancelAnimationFrame(window._scoreAnim);
    const anim = () => { cur+=Math.ceil((data.o-cur)*0.15); sNum.textContent=cur; if(cur<data.o) window._scoreAnim = requestAnimationFrame(anim); }; anim();

    document.getElementById('editorial-summary').innerHTML = state.isEcomMode ? 
        (data.o>=80 ? "<strong>Great pitch!</strong> You handled objections, built trust, and created urgency without sounding too demanding." : "<strong>Warning:</strong> You are missing key sales elements. Review the scores below and add guarantees or urgency.") : 
        (data.o>=80 ? "<strong>Highly Engaging!</strong> This post hits all the right emotional notes and is formatted perfectly for the algorithm." : "<strong>Needs work:</strong> The post is a bit flat. Look at the specific metrics below to see where you lost points.");

    const grid = document.getElementById('metrics-container'); grid.innerHTML='';
    data.m.forEach(m => {
        const color = getC(m.v);
        let html = `<div class="metric-card">
            <div class="metric-header"><span class="metric-name">${m.n}</span><div style="color:${color}"><span class="metric-val">${m.v}</span><span style="font-size:14px; font-weight:bold;">/100</span></div></div>
            <div class="progress-track"><div class="progress-fill" style="width:0%; background:${color};"></div></div>
            <div class="metric-advice">${m.t}</div>
        </div>`;
        grid.insertAdjacentHTML('beforeend', html);
        setTimeout(()=>grid.lastElementChild.querySelector('.progress-fill').style.width=m.v+'%', 50);
    });
};

document.getElementById('btn-new').addEventListener('click', () => { window.scrollTo({top:0,behavior:'smooth'}); setTimeout(()=>DOM.results.classList.remove('show'),500); state.processing=false; DOM.btnAnalyze.disabled=true; DOM.input.value=''; DOM.charCount.textContent='0 characters'; state.lastReport=null; });
document.getElementById('btn-copy').addEventListener('click', () => { 
    if (!state.lastReport) return;
    const modeName = state.isEcomMode ? "E-Commerce" : "Brand Audience";
    let reportText = `Score: ${state.lastReport.o}/100 (${modeName} Mode)\nPlatform: ${state.platform}\n\nBreakdown:\n`;
    state.lastReport.m.forEach(met => { reportText += `- ${met.n}: ${met.v}/100\n`; });
    navigator.clipboard.writeText(reportText); 
    toast('Scores copied!'); 
});
