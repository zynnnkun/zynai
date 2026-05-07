javascript:(function(){
    if(document.getElementById('zynai-v8-menu')) return;

    /* --- KONFIGURASI --- */
    const GEMINI_API_KEY = "AIzaSyA7N_MnsxVTC0B6ZoqTqgaiIbpSYJhTruc";
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    let config = {
        autoAnswer: false,
        incognito: false,
        delayMin: 500,
        delayMax: 1500,
        isHidden: false,
        quizitData: []
    };

    /* --- FITUR ANTI-CHEAT --- */
    function enableIncognito() {
        const bypass = () => {
            try {
                Object.defineProperty(document, 'visibilityState', {get: () => 'visible', configurable: true});
                Object.defineProperty(document, 'hidden', {get: () => false, configurable: true});
                document.hasFocus = () => true;
            } catch(e) {}
        };
        bypass();
        const events = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focus', 'mouseleave', 'mouseout'];
        events.forEach(ev => {
            window.addEventListener(ev, e => { if(config.incognito) e.stopImmediatePropagation(); }, true);
        });
        setInterval(() => { if(config.incognito) bypass(); }, 150);
    }

    /* --- LOGIKA SMART SYNC (UNTUK DATA BERANTAKAN) --- */
    function processSmartSync() {
        const rawData = prompt("Tempelkan hasil copy dari Quizit di sini:");
        if(!rawData) return;

        const entries = [];
        // Membagi teks berdasarkan jarak baris kosong yang lebar
        const segments = rawData.split(/\n\s*\n/); 
        
        segments.forEach(seg => {
            const lines = seg.split('\n')
                             .map(l => l.trim())
                             .filter(l => l.length > 2 && !/filter|search|discover|copyright|helper|assignment/i.test(l));
            
            if(lines.length >= 2) {
                // Baris pertama dianggap soal, baris terakhir dianggap jawaban
                entries.push({ q: lines[0].toLowerCase(), a: lines[lines.length - 1] });
            }
        });

        if(entries.length > 0) {
            config.quizitData = entries;
            alert("Berhasil sinkronisasi " + entries.length + " soal!");
        } else {
            alert("Gagal membaca data. Pastikan format soal dan jawaban jelas.");
        }
    }

    /* --- LOGIKA PENCARI JAWABAN --- */
    async function solve() {
        const qSelectors = ['.question-text', '[data-test="question-text"]', '.q-text', '.question-container-text', 'div[class*="question-text"]'];
        let question = "";
        for(let sel of qSelectors) {
            const el = document.querySelector(sel);
            if(el && el.innerText.trim().length > 2) {
                question = el.innerText.trim();
                break;
            }
        }
        if(!question) return;

        const ansBox = document.getElementById('v8-ans-box');
        if(ansBox.dataset.lastQ === question) return;
        ansBox.dataset.lastQ = question;
        ansBox.innerText = "Mencari...";

        // Cek Data Lokal (Smart Sync)
        const found = config.quizitData.find(x => question.toLowerCase().includes(x.q) || x.q.includes(question.toLowerCase()));
        if(found) {
            ansBox.innerText = "[Sync] Jawaban: " + found.a;
            handleAutoClick(found.a);
            return;
        }

        // Tanya Gemini (Jika tidak ada di Sync)
        try {
            const optEls = Array.from(document.querySelectorAll('.option, [data-test="option"], .p-option, [class*="answer-option"]'))
                                .filter(el => el.offsetParent !== null);
            const options = optEls.map(el => el.innerText.trim());
            
            const promptText = `Pilih satu jawaban tepat: ${options.join(", ")}. Soal: ${question}. Jawab hanya teks pilihannya saja.`;
            const res = await fetch(GEMINI_URL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
            });
            const data = await res.json();
            const aiAns = data.candidates[0].content.parts[0].text.trim();
            ansBox.innerText = "[AI] Jawaban: " + aiAns;
            handleAutoClick(aiAns);
        } catch(e) { ansBox.innerText = "Error API (Check Key)"; }
    }

    function handleAutoClick(answer) {
        if(!config.autoAnswer) return;
        const delay = Math.floor(Math.random() * (config.delayMax - config.delayMin + 1)) + config.delayMin;
        setTimeout(() => {
            const optEls = document.querySelectorAll('.option, [data-test="option"], .p-option, [class*="answer-option"]');
            for(let el of optEls) {
                const txt = el.innerText.trim().toLowerCase();
                if(txt === answer.toLowerCase() || txt.includes(answer.toLowerCase())) {
                    el.click();
                    break;
                }
            }
        }, delay);
    }

    /* --- UI & STYLE --- */
    const style = document.createElement('style');
    style.innerHTML = `
        #zynai-v8-menu{position:fixed;top:80px;right:20px;width:230px;background:#0b0b0b;color:#fff;border-radius:8px;z-index:999999;font-family:sans-serif;border:1px solid #00ff88;box-shadow:0 0 15px rgba(0,255,136,0.2);}
        #v8-header{background:#00ff88;color:#000;padding:8px;font-weight:bold;text-align:center;font-size:11px;}
        #v8-body{padding:10px;}
        .v8-btn{width:100%;padding:7px;margin-bottom:5px;background:#1a1a1a;color:#00ff88;border:1px solid #00ff88;border-radius:4px;cursor:pointer;font-size:10px;font-weight:bold;}
        .v8-active{background:#00ff88 !important;color:#000 !important;}
        #v8-ans-box{background:#000;padding:8px;border-radius:4px;font-size:11px;color:#00ff88;border:1px solid #222;min-height:35px;margin-top:5px;}
        
        /* Logo Z Super Transparan */
        #v8-hide-btn { 
            position:fixed; bottom:15px; left:15px; z-index:1000000; cursor:pointer; 
            color: rgba(255,255,255,0.08); font-weight: bold; font-size: 16px; 
            user-select:none; background:none; border:none;
        }
    `;
    document.head.appendChild(style);

    const menu = document.createElement('div');
    menu.id = 'zynai-v8-menu';
    menu.innerHTML = `
        <div id="v8-header">ZYNAI LITE PRO</div>
        <div id="v8-body">
            <button id="v8-auto-tg" class="v8-btn">Auto Answer: OFF</button>
            <button id="v8-inc-tg" class="v8-btn">Incognito: OFF</button>
            <button id="v8-sync-btn" class="v8-btn" style="border-color:#ffcc00;color:#ffcc00">Smart Sync (Quizit)</button>
            <div id="v8-ans-box">Ready.</div>
        </div>
    `;
    document.body.appendChild(menu);

    const hideBtn = document.createElement('div');
    hideBtn.id = 'v8-hide-btn';
    hideBtn.innerText = 'Z';
    document.body.appendChild(hideBtn);

    hideBtn.onclick = () => {
        config.isHidden = !config.isHidden;
        menu.style.display = config.isHidden ? 'none' : 'block';
        hideBtn.style.color = config.isHidden ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)';
    };

    document.getElementById('v8-auto-tg').onclick = function() {
        config.autoAnswer = !config.autoAnswer;
        this.classList.toggle('v8-active');
        this.innerText = `Auto Answer: ${config.autoAnswer ? 'ON' : 'OFF'}`;
    };
    document.getElementById('v8-inc-tg').onclick = function() {
        config.incognito = !config.incognito;
        this.classList.toggle('v8-active');
        this.innerText = `Incognito: ${config.incognito ? 'ON' : 'OFF'}`;
        if(config.incognito) enableIncognito();
    };
    document.getElementById('v8-sync-btn').onclick = processSmartSync;

    setInterval(solve, 1500);
})();
