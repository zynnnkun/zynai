(function(){
    if(document.getElementById('zynai-menu')) return;

    /* --- KONFIGURASI --- */
    const GEMINI_API_KEY = "AIzaSyA7N_MnsxVTC0B6ZoqTqgaiIbpSYJhTruc"; // API Key kamu
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    let config = {
        autoAnswer: false,
        incognito: false,
        delay: 1, // Default delay 1ms sesuai screenshot
        localAnswers: []
    };

    /* --- FITUR 1: INVISIBLE SWITCH (ANTI-CHEAT) --- */
    function enableIncognito() {
        const bypass = () => {
            try {
                Object.defineProperty(document, 'visibilityState', {get: () => 'visible', configurable: true});
                Object.defineProperty(document, 'hidden', {get: () => false, configurable: true});
                document.hasFocus = () => true;
            } catch(e) {}
        };
        bypass();
        // Memblokir event deteksi sesuai instruksi di screenshot
        const events = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focus', 'mouseleave'];
        events.forEach(ev => {
            window.addEventListener(ev, e => { if(config.incognito) e.stopImmediatePropagation(); }, true);
        });
        setInterval(() => { if(config.incognito) bypass(); }, 100);
    }

    /* --- FITUR 2: SMART SYNC (QUIZIT FORMAT) --- */
    async function smartSync() {
        const rawData = prompt("Tempelkan data jawaban dari Quizit di sini (Format: Soal|Jawaban):");
        if(rawData) {
            const lines = rawData.split('\n');
            config.localAnswers = lines.map(l => {
                const parts = l.split('|');
                return parts.length >= 2 ? { q: parts[0].trim().toLowerCase(), a: parts[1].trim() } : null;
            }).filter(x => x);
            alert(`Smart Sync Berhasil! ${config.localAnswers.length} soal terdeteksi.`);
        }
    }

    /* --- FITUR 3: LOGIKA PENCARI JAWABAN (GEMINI + LOCAL) --- */
    async function getAnswer(question, options) {
        // Cek database lokal (Smart Sync) dulu
        const found = config.localAnswers.find(x => question.toLowerCase().includes(x.q) || x.q.includes(question.toLowerCase()));
        if (found) return { text: found.a, source: "Smart Sync" };

        // Jika tidak ada di lokal, tanya Gemini
        const promptText = `Pilih jawaban yang benar dari opsi ini: ${options.join(", ")}. Soal: ${question}. Jawab hanya dengan teks pilihannya saja.`;
        try {
            const res = await fetch(GEMINI_URL, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({ contents: [{ parts: [{ text: promptText }] }] })
            });
            const data = await res.json();
            return { text: data.candidates[0].content.parts[0].text.trim(), source: "Gemini AI" };
        } catch(e) { return { text: null, source: "Error" }; }
    }

    async function solve() {
        const qEl = document.querySelector('.question-text, [data-test="question-text"], .q-text, .question-container-text');
        if(!qEl) return;
        
        const question = qEl.innerText.trim();
        const ansBox = document.getElementById('zyn-ans-box');
        if(ansBox.dataset.lastQ === question) return;
        ansBox.dataset.lastQ = question;

        const optEls = Array.from(document.querySelectorAll('.option, [data-test="option"], .p-option, [class*="answer-option"]'))
                            .filter(el => el.offsetParent !== null);
        const options = optEls.map(el => el.innerText.trim());

        const result = await getAnswer(question, options);
        ansBox.innerText = `[${result.source}] Jawaban: ${result.text}`;

        if(config.autoAnswer && result.text) {
            setTimeout(() => {
                for(let el of optEls) {
                    if(el.innerText.trim().toLowerCase().includes(result.text.toLowerCase())) {
                        el.click(); // Klik biasa
                        el.dispatchEvent(new Event('click', {bubbles: true})); // Force click event sesuai screenshot
                        break;
                    }
                }
            }, config.delay);
        }
    }

    /* --- UI INTERFACE --- */
    const style = document.createElement('style');
    style.innerHTML = `
        #zynai-menu { position:fixed; top:10px; right:10px; width:220px; background:#111; color:#fff; border-radius:10px; z-index:999999; font-family:sans-serif; border:1px solid #00ff88; box-shadow:0 0 15px rgba(0,255,136,0.5); }
        .zyn-header { background:#00ff88; color:#000; padding:10px; font-weight:bold; text-align:center; border-radius:10px 10px 0 0; font-size:12px; }
        .zyn-body { padding:10px; }
        .zyn-btn { width:100%; padding:8px; margin-bottom:5px; background:#222; color:#00ff88; border:1px solid #00ff88; border-radius:5px; cursor:pointer; font-size:10px; font-weight:bold; }
        .zyn-active { background:#00ff88 !important; color:#000 !important; }
        #zyn-ans-box { background:#000; padding:8px; border-radius:5px; font-size:11px; color:#00ff88; border:1px solid #333; min-height:40px; }
    `;
    document.head.appendChild(style);

    const menu = document.createElement('div');
    menu.id = 'zynai-menu';
    menu.innerHTML = `
        <div class="zyn-header">ZYNAI LITE PRO</div>
        <div class="zyn-body">
            <button id="btn-auto" class="zyn-btn">Jawab Otomatis: OFF</button>
            <button id="btn-incog" class="zyn-btn">Incognito: OFF</button>
            <button id="btn-sync" class="zyn-btn">Smart Sync (Paste All)</button>
            <div id="zyn-ans-box">Ready.</div>
        </div>
    `;
    document.body.appendChild(menu);

    /* --- EVENT LISTENERS --- */
    document.getElementById('btn-auto').onclick = function() {
        config.autoAnswer = !config.autoAnswer;
        this.classList.toggle('zyn-active');
        this.innerText = `Jawab Otomatis: ${config.autoAnswer ? 'ON' : 'OFF'}`;
    };
    document.getElementById('btn-incog').onclick = function() {
        config.incognito = !config.incognito;
        this.classList.toggle('zyn-active');
        this.innerText = `Incognito: ${config.incognito ? 'ON' : 'OFF'}`;
        if(config.incognito) enableIncognito();
    };
    document.getElementById('btn-sync').onclick = smartSync;

    setInterval(solve, 1500);
})();
