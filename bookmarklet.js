javascript:(function(){
    if(document.getElementById('zynai-v13-menu')) return;

    /* Konfigurasi dari Guide */
    const GEMINI_KEY = "AIzaSyA7N_MnsxVTC0B6ZoqTqgaiIbpSYJhTruc"; 
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`;
    let config = { auto: false, stealth: true, syncData: [], lastQ: "", delay: 800 };

    /* 🛡️ Stealth Anti-Cheat (Sesuai Guide v8) */
    function initStealth() {
        const bypass = () => {
            Object.defineProperty(document, 'visibilityState', {get: () => 'visible', configurable: true});
            Object.defineProperty(document, 'hidden', {get: () => false, configurable: true});
        };
        bypass();
        ['visibilitychange', 'blur', 'focus'].forEach(e => {
            window.addEventListener(e, x => { if(config.stealth) x.stopImmediatePropagation(); }, true);
        });
        setInterval(bypass, 500); // Interval 500ms sesuai guide
    }

    /* 🧠 Smart Sync (Logika deteksi otomatis) */
    function smartSync() {
        let raw = prompt("Tempel data Quizit (Soal & Jawaban berurutan):");
        if(!raw) return;
        let lines = raw.split('\n').filter(l => l.trim().length > 0);
        for(let i=0; i < lines.length; i++) {
            if(lines[i].includes('?') || lines[i].length > 20) {
                if(lines[i+1]) config.syncData.push({q: lines[i].trim(), a: lines[i+1].trim()});
            }
        }
        alert(`Berhasil sinkron ${config.syncData.length} data.`);
    }

    /* 🤖 Auto Answer (Multi-Selector & Stealth Click) */
    async function solve() {
        const qSelectors = ['.question-text', '[data-test="question-text"]', 'div[class*="question-text"]', '.text-container'];
        let qEl = null;
        for(let s of qSelectors) { qEl = document.querySelector(s); if(qEl) break; }
        
        if(!qEl) return;
        let qText = qEl.innerText.trim();
        const box = document.getElementById('v13-ans-box');
        if(config.lastQ === qText) return;
        config.lastQ = qText;
        box.innerText = "⏳ Memproses...";

        /* Cek Sync Data Terlebih Dahulu (Prioritas agar tidak API Error) */
        let match = config.syncData.find(d => qText.includes(d.q) || d.q.includes(qText));
        if(match) { display(match.a, "SYNC"); return; }

        /* API Fallback */
        try {
            const opts = Array.from(document.querySelectorAll('.option, [data-test="option"], .p-option')).map(e => e.innerText.trim());
            const res = await fetch(API_URL, {
                method: "POST",
                body: JSON.stringify({contents: [{parts: [{text: `Soal: ${qText}. Opsi: ${opts.join(",")}. Jawab singkat!`}]}]})
            });
            const d = await res.json();
            const ans = d.candidates[0].content.parts[0].text.trim();
            display(ans, "AI");
        } catch(e) { box.innerText = "❌ API Limit (Gunakan Sync)"; }
    }

    function display(ans, src) {
        const box = document.getElementById('v13-ans-box');
        box.innerHTML = `<span style="color:#0f8">[${src}]</span>: ${ans}`;
        if(config.auto) {
            setTimeout(() => {
                const els = document.querySelectorAll('.option, .p-option, [data-test="option"]');
                for(let el of els) {
                    if(el.innerText.toLowerCase().includes(ans.toLowerCase())) {
                        /* Stealth Click (Sesuai Guide v8) */
                        el.click();
                        el.dispatchEvent(new MouseEvent('mousedown', {bubbles: true}));
                        el.dispatchEvent(new MouseEvent('mouseup', {bubbles: true}));
                        break;
                    }
                }
            }, config.delay);
        }
    }

    /* UI Minimalis */
    const m = document.createElement('div');
    m.id = 'zynai-v13-menu';
    m.style = "position:fixed;top:10px;right:10px;width:190px;background:#111;color:#0f8;border:1px solid #0f8;z-index:999999;padding:10px;font-family:sans-serif;border-radius:8px;font-size:11px;";
    m.innerHTML = `<div style="font-weight:bold;text-align:center;margin-bottom:8px;">V13 PRO GHOST</div>
        <button id="v13-at" style="width:100%;margin:2px 0;cursor:pointer;">AUTO CLICK: OFF</button>
        <button id="v13-sy" style="width:100%;margin:2px 0;cursor:pointer;">SMART SYNC</button>
        <div id="v13-ans-box" style="margin-top:8px;border-top:1px solid #333;padding-top:5px;">Ready.</div>
        <div id="v13-z" style="position:fixed;bottom:10px;right:10px;opacity:0.1;cursor:pointer;">Z</div>`;
    document.body.appendChild(m);

    document.getElementById('v13-at').onclick = function(){ config.auto = !config.auto; this.innerText = `AUTO: ${config.auto?'ON':'OFF'}`; };
    document.getElementById('v13-sy').onclick = smartSync;
    document.getElementById('v13-z').onclick = () => m.style.display = m.style.display==='none'?'block':'none';

    initStealth();
    setInterval(solve, 1500);
})();
