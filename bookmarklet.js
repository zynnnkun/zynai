(function(){
    if(document.getElementById('ai-helper-menu')) return;

    const GEMINI_API_KEY = "AIzaSyA7N_MnsxVTC0B6ZoqTqgaiIbpSYJhTruc";
    const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    const style = document.createElement('style');
    style.innerHTML = `
        #ai-helper-menu{position:fixed;top:80px;right:20px;width:250px;background:#1a1a2e;color:#fff;border-radius:12px;z-index:999999;font-family:sans-serif;box-shadow:0 4px 24px rgba(99,102,241,0.3);border:1px solid #3b3b5c;}
        #ai-header{background:linear-gradient(90deg,#6366f1,#8b5cf6);padding:10px 14px;cursor:move;font-weight:bold;display:flex;justify-content:space-between;align-items:center;font-size:13px;user-select:none;border-radius:12px 12px 0 0;}
        #ai-body{padding:12px;}
        #ai-ans-box{background:#0f0f1a;padding:10px;border-radius:8px;font-size:12px;color:#a5b4fc;border:1px solid #3b3b5c;min-height:50px;margin-bottom:10px;word-wrap:break-word;line-height:1.6;}
        #ai-scan-btn{background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#fff;border:none;padding:8px;border-radius:8px;font-size:12px;font-weight:bold;cursor:pointer;width:100%;}
    `;
    document.head.appendChild(style);

    const menu = document.createElement('div');
    menu.id = 'ai-helper-menu';
    menu.innerHTML = `
        <div id="ai-header">
            <span>🤖 AI Helper</span>
            <div style="display:flex;gap:10px;">
                <span id="ai-min" style="cursor:pointer">—</span>
                <span id="ai-cls" style="cursor:pointer">✕</span>
            </div>
        </div>
        <div id="ai-body">
            <div id="ai-ans-box">Klik tombol di bawah untuk scan soal.</div>
            <button id="ai-scan-btn">🔍 Scan Soal</button>
        </div>
    `;
    document.body.appendChild(menu);

    document.getElementById('ai-min').onclick = () => {
        const b = document.getElementById('ai-body');
        b.style.display = b.style.display === 'none' ? 'block' : 'none';
    };
    document.getElementById('ai-cls').onclick = () => menu.remove();

    let drag=false,ox,oy;
    document.getElementById('ai-header').onmousedown = e => { drag=true; ox=e.clientX-menu.offsetLeft; oy=e.clientY-menu.offsetTop; };
    document.onmousemove = e => { if(drag){ menu.style.left=(e.clientX-ox)+'px'; menu.style.top=(e.clientY-oy)+'px'; menu.style.right='auto'; }};
    document.onmouseup = () => drag=false;

    document.getElementById('ai-scan-btn').onclick = async () => {
        const box = document.getElementById('ai-ans-box');
        box.style.color = '#facc15';
        box.innerText = '⏳ Membaca soal...';

        let question = '';
        const qSels = ['.question-text','[data-test="question-text"]','.q-text','div[class*="question"]'];
        for(let s of qSels){
            const el = document.querySelector(s);
            if(el && el.innerText.trim().length > 5){ question = el.innerText.trim(); break; }
        }
        if(!question){
            let max=0;
            document.querySelectorAll('div,p,span').forEach(el => {
                const t = el.innerText?.trim();
                if(t && t.length > max && /\?/.test(t) && el.offsetParent){ question=t; max=t.length; }
            });
        }
        if(!question){ box.style.color='#f87171'; box.innerText='❌ Soal tidak ditemukan.'; return; }

        let options = [];
        const oSels = ['.option','[data-test="option"]','.p-option','div[class*="option"]','div[role="button"]'];
        for(let s of oSels){
            const els = Array.from(document.querySelectorAll(s)).filter(e => e.offsetParent && e.innerText.trim().length > 0 && e.innerText.trim().length < 200);
            if(els.length >= 2){ options = els.map(e => e.innerText.trim()); break; }
        }

        const prompt = options.length > 0
            ? `Pertanyaan: "${question}"\nPilihan: ${options.map((o,i)=>`${i+1}. ${o}`).join(', ')}\nJawab singkat: pilihan mana yang benar dan alasan 1 kalimat.`
            : `Pertanyaan: "${question}"\nJawab singkat dalam 1-2 kalimat.`;

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ contents:[{ parts:[{ text: prompt }] }] })
            });
            const data = await res.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Tidak ada jawaban.';
            box.style.color = '#a5b4fc';
            box.innerText = '💡 ' + reply;
        } catch(e) {
            box.style.color = '#f87171';
            box.innerText = '❌ Error: Gagal menghubungi API.';
        }
    };
})();
