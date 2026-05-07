javascript:(function(){
    if(document.getElementById('zynai-v12-menu')) return;

    /* --- CONFIG & API --- */
    const GEMINI_KEY = "AIzaSyA7N_MnsxVTC0B6ZoqTqgaiIbpSYJhTruc"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    let config = { auto: false, stealth: false, syncData: [], lastQ: "" };

    /* --- CORE FUNCTIONS --- */
    function initStealth() {
        const p = (o, k, v) => Object.defineProperty(o, k, {get: () => v, configurable: true});
        p(document, 'visibilityState', 'visible'); p(document, 'hidden', false);
        document.hasFocus = () => true;
        ['visibilitychange','webkitvisibilitychange','blur','focus','mouseleave'].forEach(ev => {
            window.addEventListener(ev, e => { if(config.stealth) e.stopImmediatePropagation(); }, true);
        });
        setInterval(() => { if(config.stealth) p(document, 'visibilityState', 'visible'); }, 200);
    }

    async function solve() {
        /* Selector Wayground & Quizizz New */
        const qEl = document.querySelector('.question-text, [data-test="question-text"], div[class*="question-text"], .q-text');
        if(!qEl) return;
        const qText = qEl.innerText.trim();
        const box = document.getElementById('v12-ans-box');
        if(config.lastQ === qText) return;
        config.lastQ = qText;
        box.innerText = "🔍 Mencari...";

        const optEls = Array.from(document.querySelectorAll('.option, [data-test="option"], .p-option, div[class*="answer-option"]'))
                            .filter(el => el.offsetParent !== null);
        const options = optEls.map(el => el.innerText.trim());

        /* 1. Cek Local Sync Data (Quizit) */
        const localMatch = config.syncData.find(d => d.q.toLowerCase().includes(qText.toLowerCase()) || qText.toLowerCase().includes(d.q.toLowerCase()));
        if(localMatch) {
            displayAns(localMatch.a, "SYNC", optEls);
            return;
        }

        /* 2. Tanya Gemini AI */
        try {
            const res = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({contents: [{parts: [{text: `Soal: ${qText}\nOpsi: ${options.join(", ")}\nJawab dengan teks jawabannya saja, singkat!`}]}]})
            });
            const d = await res.json();
            const aiAns = d.candidates[0].content.parts[0].text.trim();
            displayAns(aiAns, "AI", optEls);
        } catch(e) { box.innerText = "❌ API Limit/Error"; }
    }

    function displayAns(ans, src, optEls) {
        const box = document.getElementById('v12-ans-box');
        box.innerHTML = `<b style="color:#fff">[${src}]</b>: ${ans}`;
        if(config.auto) {
            setTimeout(() => {
                for(let el of optEls) {
                    if(el.innerText.toLowerCase().includes(ans.toLowerCase()) || ans.toLowerCase().includes(el.innerText.toLowerCase())) {
                        el.click(); break;
                    }
                }
            }, 1000);
        }
    }

    /* --- UI & STYLES --- */
    const style = document.createElement('style');
    style.innerHTML = `
        #zynai-v12-menu{position:fixed;top:50px;right:20px;width:210px;background:#0d0d0d;color:#0f8;border:1px solid #0f8;z-index:999999;font-family:monospace;padding:12px;border-radius:10px;box-shadow:0 0 15px rgba(0,255,136,0.2);}
        .v12-btn{width:100%;margin:4px 0;background:#1a1a1a;color:#0f8;border:1px solid #0f8;font-size:10px;padding:7px;cursor:pointer;border-radius:4px;font-weight:bold;}
        .v12-btn:active{background:#0f8;color:#000;}
        #v12-ans-box{background:#000;padding:8px;font-size:11px;margin-top:8px;border:1px solid #222;min-height:35px;border-radius:4px;}
        #v12-z{position:fixed;bottom:10px;right:10px;z-index:1000000;color:rgba(255,255,255,0.05);cursor:pointer;font-size:14px;font-family:sans-serif;}
    `;
    document.head.appendChild(style);

    const m = document.createElement('div');
    m.id = 'zynai-v12-menu';
    m.innerHTML = `
        <div style="text-align:center;font-weight:bold;border-bottom:1px solid #222;margin-bottom:8px;padding-bottom:5px;">ZYNAI V12 LITE</div>
        <button id="v12-tg-at" class="v12-btn">AUTO CLICK: OFF</button>
        <button id="v12-tg-st" class="v12-btn">STEALTH: OFF</button>
        <button id="v12-sync" class="v12-btn" style="color:#ff0;border-color:#ff0">SYNC QUIZIT</button>
        <div id="v12-ans-box">Ready.</div>
    `;
    document.body.appendChild(m);

    const z = document.createElement('div'); z.id = 'v12-z'; z.innerText = 'Z'; document.body.appendChild(z);
    z.onclick = () => m.style.display = m.style.display === 'none' ? 'block' : 'none';

    /* --- INTERACTION --- */
    document.getElementById('v12-tg-at').onclick = function() { 
        config.auto = !config.auto; this.innerText = `AUTO CLICK: ${config.auto?'ON':'OFF'}`;
        this.style.background = config.auto ? "#0f8" : "#1a1a1a";
        this.style.color = config.auto ? "#000" : "#0f8";
    };
    document.getElementById('v12-tg-st').onclick = function() { 
        config.stealth = !config.stealth; this.innerText = `STEALTH: ${config.stealth?'ON':'OFF'}`;
        this.style.background = config.stealth ? "#0f8" : "#1a1a1a";
        this.style.color = config.stealth ? "#000" : "#0f8";
    };
    document.getElementById('v12-sync').onclick = () => {
        let raw = prompt("Tempel data (Format: Soal|Jawaban):");
        if(raw) {
            raw.split('\n').forEach(l => {
                let p = l.split('|');
                if(p.length>=2) config.syncData.push({q:p[0].trim(), a:p[1].trim()});
            });
            alert("Synced " + config.syncData.length + " items");
        }
    };

    initStealth();
    setInterval(solve, 1500);
})();
