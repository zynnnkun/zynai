javascript:(function(){
    if(document.getElementById('zynai-v8-menu')) return;

    /* --- CONFIG & GEMINI API --- */
    const GEMINI_API_KEY = "AIzaSyA7N_MnsxVTC0B6ZoqTqgaiIbpSYJhTruc";
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    let config = { 
        autoAnswer: false, 
        incognito: false, 
        delayMin: 500, 
        delayMax: 1200, 
        isHidden: false, 
        quizitData: [] 
    };

    /* --- LOGIKA SMART SYNC (FIX MULTI-SOAL) --- */
    function processSmartSync() {
        const rawData = prompt("Tempelkan hasil copy dari Quizit di sini:");
        if(!rawData) return;

        const entries = [];
        // Membagi teks berdasarkan pola soal di Quizit
        const blocks = rawData.split(/\n\s*\n/); 
        
        blocks.forEach(block => {
            const lines = block.split('\n').map(l => l.trim()).filter(l => l.length > 2);
            // Menghindari teks sampah seperti "Search", "Filter", dll
            const cleanLines = lines.filter(l => !/filter|search|discover|copyright|helper|assignment|resources|blog|contact/i.test(l));
            
            if(cleanLines.length >= 2) {
                // Baris pertama = Soal, Baris terakhir = Jawaban
                entries.push({ 
                    q: cleanLines[0].toLowerCase(), 
                    a: cleanLines[cleanLines.length - 1] 
                });
            }
        });

        if(entries.length > 0) {
            config.quizitData = entries;
            alert("🔥 Berhasil sinkronisasi " + entries.length + " soal!");
        } else {
            alert("❌ Gagal membaca data. Pastikan teks soal & jawaban ter-copy dengan benar.");
        }
    }

    /* --- LOGIKA SOLVER --- */
    async function solve() {
        const qSelectors = ['.question-text', '[data-test="question-text"]', '.q-text', '.question-container-text', '.custom-question-style'];
        let question = "";
        for(let sel of qSelectors) {
            const el = document.querySelector(sel);
            if(el && el.innerText.trim().length > 3) { question = el.innerText.trim(); break; }
        }
        if(!question) return;

        const ansBox = document.getElementById('v8-ans-box');
        if(ansBox.dataset.lastQ === question) return;
        ansBox.dataset.lastQ = question;
        ansBox.innerText = "Sedang berpikir...";

        // 1. Cek Smart Sync
        const found = config.quizitData.find(x => question.toLowerCase().includes(x.q) || x.q.includes(question.toLowerCase()));
        if(found) {
            ansBox.innerText = "[SYNC] " + found.a;
            if(config.autoAnswer) doClick(found.a);
            return;
        }

        // 2. Tanya Gemini
        try {
            const optEls = Array.from(document.querySelectorAll('.option, [data-test="option"], .p-option, [class*="answer-option"]'))
                                .filter(el => el.offsetParent !== null);
            const options = optEls.map(el => el.innerText.trim());
            
            const res = await fetch(GEMINI_URL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ contents: [{ parts: [{ text: `Pilih jawaban: ${options.join(", ")}. Soal: ${question}. Jawab teksnya saja.` }] }] })
            });
            const data = await res.json();
            const aiAns = data.candidates[0].content.parts[0].text.trim();
            ansBox.innerText = "[AI] " + aiAns;
            if(config.autoAnswer) doClick(aiAns);
        } catch(e) { ansBox.innerText = "API Error / Limit"; }
    }

    function doClick(answer) {
        const delay = Math.floor(Math.random() * (config.delayMax - config.delayMin + 1)) + config.delayMin;
        setTimeout(() => {
            const optEls = document.querySelectorAll('.option, [data-test="option"], .p-option, [class*="answer-option"]');
            for(let el of optEls) {
                if(el.innerText.trim().toLowerCase().includes(answer.toLowerCase()) || answer.toLowerCase().includes(el.innerText.trim().toLowerCase())) {
                    el.click();
                    break;
                }
            }
        }, delay);
    }

    /* --- UI STYLE --- */
    const style = document.createElement('style');
    style.innerHTML = `
        #zynai-v8-menu{position:fixed;top:20px;right:20px;width:220px;background:#0d0d0d;color:#fff;border-radius:10px;z-index:999999;font-family:sans-serif;border:1px solid #333;box-shadow:0 10px 30px rgba(0,0,0,0.5);}
        #v8-header{background:#00ff88;color:#000;padding:10px;font-weight:bold;text-align:center;font-size:12px;border-radius:10px 10px 0 0;}
        .v8-btn{width:100%;padding:8px;margin-bottom:6px;background:#1a1a1a;color:#00ff88;border:1px solid #00ff88;border-radius:6px;cursor:pointer;font-size:10px;font-weight:bold;}
        #v8-ans-box{background:#000;padding:10px;font-size:11px;color:#00ff88;border:1px solid #222;min-height:40px;text-align:center;}
        
        /* Logo Z Polosan Pojok Kanan Bawah */
        #v8-hide-btn { 
            position:fixed; bottom:15px; right:15px; z-index:1000000; cursor:pointer; 
            color: rgba(255,255,255,0.05); font-weight: bold; font-size: 18px; 
            user-select:none; background:none; border:none; transition: 0.3s;
        }
    `;
    document.head.appendChild(style);

    const menu = document.createElement('div');
    menu.id = 'zynai-v8-menu';
    menu.innerHTML = `
        <div id="v8-header">ZYNAI PRO LITE</div>
        <div style="padding:12px;">
            <button id="v8-auto-tg" class="v8-btn">AUTO CLICK: OFF</button>
            <button id="v8-sync-btn" class="v8-btn" style="border-color:#ffcc00;color:#ffcc00">SMART SYNC QUIZIT</button>
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
        hideBtn.style.color = config.isHidden ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.05)';
    };

    document.getElementById('v8-auto-tg').onclick = function() {
        config.autoAnswer = !config.autoAnswer;
        this.style.background = config.autoAnswer ? '#00ff88' : '#1a1a1a';
        this.style.color = config.autoAnswer ? '#000' : '#00ff88';
        this.innerText = `AUTO CLICK: ${config.autoAnswer ? 'ON' : 'OFF'}`;
    };
    
    document.getElementById('v8-sync-btn').onclick = processSmartSync;
    setInterval(solve, 1500);
})();
