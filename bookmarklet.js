(function(){
    if(document.getElementById('zynai-menu')) return;

    /* --- KONFIGURASI --- */
    const GEMINI_API_KEY = "AIzaSyA7N_MnsxVTC0B6ZoqTqgaiIbpSYJhTruc";
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    let config = {
        autoAnswer: false,
        incognito: false,
        delay: 800,
        isHidden: false,
        localAnswers: []
    };

    /* --- FITUR 1: INVISIBLE SWITCH --- */
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

    /* --- FITUR 2: DEEP SCAN SOAL & JAWABAN --- */
    async function solve() {
        let question = "";
        let optionEls = [];

        // 1. Scan Soal (Mencari teks terpanjang yang mirip soal)
        const allTexts = Array.from(document.querySelectorAll('div, p, span, h1, h2'))
                             .filter(el => el.innerText.trim().length > 10);
        
        let bestQ = null;
        let maxLen = 0;

        for (let el of allTexts) {
            const txt = el.innerText.trim();
            // Prioritas soal: mengandung tanda tanya atau teks sangat panjang (>40 karakter)
            if ((txt.includes('?') || txt.length > 40) && txt.length > maxLen) {
                if (!txt.includes('ZYNAI') && !txt.includes('Ready')) {
                    bestQ = el;
                    maxLen = txt.length;
                }
            }
        }
        if (bestQ) question = bestQ.innerText.trim();

        // 2. Scan Pilihan Jawaban
        const optSelectors = ['.option', '[data-test="option"]', '.p-option', '[class*="answer-option"]', '[role="button"]'];
        for (let sel of optSelectors) {
            const found = Array.from(document.querySelectorAll(sel)).filter(el => el.innerText.trim().length > 0);
            if (found.length >= 2) {
                optionEls = found;
                break;
            }
        }

        const ansBox = document.getElementById('zyn-ans-box');
        if (!question || optionEls.length < 2) {
            ansBox.innerText = "Mencari elemen kuis...";
            return;
        }

        if (ansBox.dataset.lastQ === question) return;
        ansBox.dataset.lastQ = question;
        ansBox.innerText = "Menganalisis soal...";

        // 3. Logika Pencocokan (Smart Sync vs AI)
        const qLower = question.toLowerCase();
        let result = null;

        const foundLocal = config.localAnswers.find(x => qLower.includes(x.q) || x.q.includes(qLower));
        if (foundLocal) {
            result = { text: foundLocal.a, source: "Smart Sync" };
        } else {
            const options = optionEls.map(el => el.innerText.trim());
            const promptText = `Pilih satu jawaban tepat: ${options.join(", ")}. Soal: ${question}. Jawab hanya teks pilihannya saja.`;
            try {
                const res = await fetch(GEMINI_URL, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
                });
                const data = await res.json();
                result = { text: data.candidates[0].content.parts[0].text.trim(), source: "Gemini AI" };
            } catch(e) { result = { text: "Error API", source: "System" }; }
        }

        // 4. Eksekusi Jawaban
        if (result && result.text) {
            ansBox.innerText = `[${result.source}] Jawaban: ${result.text}`;
            if (config.autoAnswer) {
                setTimeout(() => {
                    for (let el of optionEls) {
                        const elTxt = el.innerText.trim().toLowerCase();
                        const aiTxt = result.text.toLowerCase();
                        if (elTxt === aiTxt || elTxt.includes(aiTxt) || aiTxt.includes(elTxt)) {
                            el.click();
                            break;
                        }
                    }
                }, config.delay);
            }
        }
    }

    /* --- UI & STYLING --- */
    const style = document.createElement('style');
    style.innerHTML = `
        #zynai-menu { position:fixed; top:10px; right:10px; width:220px; background:#111; color:#fff; border-radius:10px; z-index:999999; font-family:sans-serif; border:1px solid #00ff88; box-shadow:0 0 15px rgba(0,255,136,0.5); }
        .zyn-header { background:#00ff88; color:#000; padding:10px; font-weight:bold; text-align:center; border-radius:10px 10px 0 0; font-size:12px; }
        .zyn-body { padding:10px; }
        .zyn-btn { width:100%; padding:8px; margin-bottom:5px; background:#222; color:#00ff88; border:1px solid #00ff88; border-radius:5px; cursor:pointer; font-size:10px; font-weight:bold; }
        .zyn-active { background:#00ff88 !important; color:#000 !important; }
        #zyn-ans-box { background:#000; padding:8px; border-radius:5px; font-size:11px; color:#00ff88; border:1px solid #333; min-height:40px; }
        #zyn-logo-btn { position:fixed; bottom:10px; left:10px; width:25px; height:25px; background:rgba(0,255,136,0.1); border:1px solid rgba(0,255,136,0.1); border-radius:5px; z-index:1000000; cursor:pointer; display:flex; align-items:center; justify-content:center; color:rgba(0,255,136,0.2); font-weight:bold; font-size:14px; }
    `;
    document.head.appendChild(style);

    const menu = document.createElement('div');
    menu.id = 'zynai-menu';
    menu.innerHTML = `<div class="zyn-header">ZYNAI LITE PRO</div><div class="zyn-body">
        <button id="btn-auto" class="zyn-btn">Auto Answer: OFF</button>
        <button id="btn-incog" class="zyn-btn">Incognito: OFF</button>
        <button id="btn-sync" class="zyn-btn">Smart Sync (Paste All)</button>
        <div id="zyn-ans-box">Ready.</div>
    </div>`;
    document.body.appendChild(menu);

    const logoBtn = document.createElement('div');
    logoBtn.id = 'zyn-logo-btn';
    logoBtn.innerText = 'Z';
    document.body.appendChild(logoBtn);

    logoBtn.onclick = () => {
        config.isHidden = !config.isHidden;
        menu.style.display = config.isHidden ? 'none' : 'block';
    };

    /* --- EVENT LISTENERS --- */
    document.getElementById('btn-auto').onclick = function() {
        config.autoAnswer = !config.autoAnswer;
        this.classList.toggle('zyn-active');
        this.innerText = `Auto Answer: ${config.autoAnswer ? 'ON' : 'OFF'}`;
    };
    document.getElementById('btn-incog').onclick = function() {
        config.incognito = !config.incognito;
        this.classList.toggle('zyn-active');
        this.innerText = `Incognito: ${config.incognito ? 'ON' : 'OFF'}`;
        if(config.incognito) enableIncognito();
    };
    document.getElementById('btn-sync').onclick = () => {
        const raw = prompt("Tempel data Quizit:");
        if(raw) {
            const parts = raw.split(/\n\s*\n/);
            config.localAnswers = parts.map(p => {
                const lines = p.split('\n').filter(l => l.trim().length > 0);
                return lines.length >= 2 ? { q: lines[0].trim().toLowerCase(), a: lines[lines.length-1].trim() } : null;
            }).filter(x => x);
            alert(`Berhasil sinkron ${config.localAnswers.length} soal.`);
        }
    };

    setInterval(solve, 2000);
})();
