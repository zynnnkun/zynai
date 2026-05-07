(function(){
    if(document.getElementById('zynai-menu')) return;

    /* --- KONFIGURASI --- */
    const GEMINI_API_KEY = "AIzaSyA7N_MnsxVTC0B6ZoqTqgaiIbpSYJhTruc";
    const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

    let config = {
        autoAnswer: false,
        incognito: false,
        delay: 1,
        isHidden: false,
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
        const events = ['visibilitychange', 'webkitvisibilitychange', 'blur', 'focus', 'mouseleave', 'mouseout'];
        events.forEach(ev => {
            window.addEventListener(ev, e => { if(config.incognito) e.stopImmediatePropagation(); }, true);
            document.addEventListener(ev, e => { if(config.incognito) e.stopImmediatePropagation(); }, true);
        });
        setInterval(() => { if(config.incognito) bypass(); }, 100);
    }

    /* --- FITUR 2: SMART SYNC (LOGIKA PEMBERSIH DATA ACAK) --- */
    function smartSync() {
        const rawData = prompt("Tempelkan data acak dari Quizit di sini:");
        if(!rawData) return;

        // Membersihkan teks navigasi & memisahkan berdasarkan baris kosong
        const segments = rawData.split(/\n\s*\n/);
        const newEntries = [];

        segments.forEach(seg => {
            const lines = seg.split('\n').map(l => l.trim()).filter(l => l.length > 0);
            // Logika: Baris pertama biasanya soal, baris terakhir biasanya jawaban
            if(lines.length >= 2) {
                const question = lines[0].toLowerCase();
                const answer = lines[lines.length - 1];
                // Abaikan jika itu teks navigasi (seperti "Search in questions" atau "Copyright")
                if(!question.includes('search in') && !question.includes('copyright')) {
                    newEntries.push({ q: question, a: answer });
                }
            }
        });

        config.localAnswers = newEntries;
        alert(`Smart Sync Berhasil! Berhasil mengekstrak ${newEntries.length} soal & jawaban.`);
    }

    /* --- FITUR 3: LOGIKA PENCARI JAWABAN --- */
    async function getAnswer(question, options) {
        const qLower = question.toLowerCase();
        // Cek database lokal hasil Smart Sync
        const found = config.localAnswers.find(x => qLower.includes(x.q) || x.q.includes(qLower));
        if (found) return { text: found.a, source: "Smart Sync" };

        // Tanya Gemini jika tidak ada di lokal
        const promptText = `Pilih satu jawaban tepat: ${options.join(", ")}. Soal: ${question}. Jawab hanya teks pilihannya.`;
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
                    const elText = el.innerText.trim().toLowerCase();
                    const aiAns = result.text.toLowerCase();
                    if(elText === aiAns || elText.includes(aiAns) || aiAns.includes(elText)) {
                        el.click();
                        el.dispatchEvent(new Event('click', {bubbles: true}));
                        break;
                    }
                }
            }, config.delay);
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
        
        /* Tombol Logo Z di Pojok Kiri Bawah */
        #zyn-logo-btn { 
            position:fixed; bottom:10px; left:10px; width:25px; height:25px; 
            background: rgba(0, 255, 136, 0.1); border: 1px solid rgba(0, 255, 136, 0.2); 
            border-radius: 5px; z-index:1000000; cursor:pointer; 
            display:flex; align-items:center; justify-content:center; 
            color: rgba(0, 255, 136, 0.3); font-weight: bold; font-size: 14px; 
            user-select:none; transition: 0.3s;
        }
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

    const logoBtn = document.createElement('div');
    logoBtn.id = 'zyn-logo-btn';
    logoBtn.innerText = 'Z';
    document.body.appendChild(logoBtn);

    logoBtn.onclick = () => {
        config.isHidden = !config.isHidden;
        menu.style.display = config.isHidden ? 'none' : 'block';
        logoBtn.style.opacity = config.isHidden ? '0.8' : '0.3';
    };

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
