javascript:(function(){
    if(document.getElementById('zynai-v10-menu')) return;

    /* --- GANTI API KEY KAMU DI SINI --- */
    const GEMINI_KEY = "AIzaSyA7N_MnsxVTC0B6ZoqTqgaiIbpSYJhTruc"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;

    let config = { autoAnswer: false, incognito: true, delayMin: 500, delayMax: 1200, isHidden: false, quizitData: [] };

    /* --- 1. INVISIBLE SWITCH (ANTI-CHEAT) --- */
    function initAntiCheat() {
        const bypass = () => {
            try {
                Object.defineProperty(document, 'visibilityState', {get: () => 'visible', configurable: true});
                Object.defineProperty(document, 'hidden', {get: () => false, configurable: true});
                Object.defineProperty(document, 'webkitVisibilityState', {get: () => 'visible', configurable: true});
                document.hasFocus = () => true;
            } catch(e) {}
        };
        bypass();
        
        const events = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focus', 'mouseleave'];
        events.forEach(ev => {
            window.addEventListener(ev, e => { e.stopImmediatePropagation(); }, true);
            document.addEventListener(ev, e => { e.stopImmediatePropagation(); }, true);
        });

        // Matikan listener bawaan web kuis
        window.onblur = null;
        window.onfocus = null;
        document.onvisibilitychange = null;
        
        setInterval(bypass, 100);
        console.log("🛡️ Invisible Switch Active");
    }

    /* --- 2. LOGIKA SOLVER --- */
    async function solve() {
        const qSelectors = ['.question-text', '[data-test="question-text"]', '.q-text', '.custom-question-style'];
        let question = "";
        for(let sel of qSelectors) {
            const el = document.querySelector(sel);
            if(el && el.innerText.trim().length > 3) { question = el.innerText.trim(); break; }
        }
        if(!question) return;

        const ansBox = document.getElementById('v10-ans-box');
        if(ansBox.dataset.lastQ === question) return;
        ansBox.dataset.lastQ = question;
        ansBox.innerText = "⏳ Sedang berpikir...";

        try {
            const optEls = Array.from(document.querySelectorAll('.option, [data-test="option"], .p-option'))
                                .filter(el => el.offsetParent !== null);
            const options = optEls.map(el => el.innerText.trim());
            
            const response = await fetch(API_URL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    contents: [{ parts: [{ text: `Soal: ${question}\nPilihan: ${options.join(", ")}\nJawab dengan teks jawabannya saja, singkat!` }] }]
                })
            });

            const data = await response.json();
            if(data.error) throw new Error(data.error.message);
            
            const aiAns = data.candidates[0].content.parts[0].text.trim();
            ansBox.innerText = "✅ JAWABAN: " + aiAns;

            if(config.autoAnswer) {
                const delay = Math.floor(Math.random() * (config.delayMax - config.delayMin + 1)) + config.delayMin;
                setTimeout(() => {
                    for(let el of optEls) {
                        if(el.innerText.trim().toLowerCase().includes(aiAns.toLowerCase()) || aiAns.toLowerCase().includes(el.innerText.trim().toLowerCase())) {
                            el.click(); break;
                        }
                    }
                }, delay);
            }
        } catch(e) { 
            ansBox.innerText = "❌ API Error: Check Key/Quota"; 
            console.error(e);
        }
    }

    /* --- 3. UI STYLE & POSITION --- */
    const style = document.createElement('style');
    style.innerHTML = `
        #zynai-v10-menu{position:fixed;top:20px;right:20px;width:220px;background:#0a0a0a;color:#fff;border-radius:12px;z-index:999999;font-family:sans-serif;border:1px solid #00ff88;box-shadow:0 10px 30px rgba(0,0,0,0.8);}
        #v10-header{background:#00ff88;color:#000;padding:10px;font-weight:bold;text-align:center;border-radius:12px 12px 0 0;font-size:11px;}
        .v10-btn{width:90%;padding:8px;margin:5px 5%;background:#111;color:#00ff88;border:1px solid #00ff88;border-radius:6px;cursor:pointer;font-size:10px;font-weight:bold;transition:0.2s;}
        .v10-btn:hover{background:#00ff88;color:#000;}
        #v10-ans-box{background:#000;padding:10px;font-size:11px;color:#00ff88;min-height:40px;text-align:center;border-top:1px solid #222;}
        
        /* Logo Z di Pojok Kanan Bawah */
        #v10-hide-btn { 
            position:fixed !important; bottom:15px !important; right:15px !important; 
            z-index:1000000 !important; cursor:pointer; 
            color: rgba(255,255,255,0.1); font-weight: bold; font-size: 16px; 
            background:none; border:none; user-select:none;
        }
    `;
    document.head.appendChild(style);

    const menu = document.createElement('div');
    menu.id = 'zynai-v10-menu';
    menu.innerHTML = `
        <div id="v10-header">ZYNAI V10 PRO</div>
        <div style="padding:10px;">
            <button id="v10-auto-tg" class="v10-btn">AUTO CLICK: OFF</button>
            <div id="v10-ans-box">Ready.</div>
        </div>
    `;
    document.body.appendChild(menu);

    const hideBtn = document.createElement('div');
    hideBtn.id = 'v10-hide-btn';
    hideBtn.innerText = 'Z';
    document.body.appendChild(hideBtn);

    hideBtn.onclick = () => {
        config.isHidden = !config.isHidden;
        menu.style.display = config.isHidden ? 'none' : 'block';
        hideBtn.style.color = config.isHidden ? 'rgba(0,255,136,0.4)' : 'rgba(255,255,255,0.1)';
    };

    document.getElementById('v10-auto-tg').onclick = function() {
        config.autoAnswer = !config.autoAnswer;
        this.innerText = `AUTO CLICK: ${config.autoAnswer ? 'ON' : 'OFF'}`;
        this.style.background = config.autoAnswer ? '#00ff88' : '#111';
        this.style.color = config.autoAnswer ? '#000' : '#00ff88';
    };

    initAntiCheat();
    setInterval(solve, 1500);
})();
