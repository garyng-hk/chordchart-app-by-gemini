let ALL_SCORES = [];

// 1. 這裡貼上你剛剛複製的「網頁應用程式 URL」
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbz2_IH_-CFmlepaA44Bw6JJ8FM75Hd6VQ-gB5MLxS7RfrSYoUc3rRCFaaIZjbbDLs9F/exec';

window.onload = async () => {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.classList.remove('hidden');

    try {
        // 直接從 GAS 拿最新的資料，完全不需要 API Key
        const response = await fetch(GAS_WEB_APP_URL);
        if (!response.ok) throw new Error('伺服器反應異常');
        
        ALL_SCORES = await response.json();
        
        if (loadingDiv) loadingDiv.classList.add('hidden');
        console.log("✅ 全自動同步成功：" + ALL_SCORES.length + " 首樂譜");
    } catch (e) {
        if (loadingDiv) {
            loadingDiv.innerText = "自動同步失敗，請確認 Script 部署權限。";
            loadingDiv.style.color = "red";
        }
        console.error(e);
    }
};

// 2. 搜尋功能 (包含排除副檔名的精準搜尋，修復 Way Maker 的 C 字誤判)
function searchScores() {
    const songName = document.getElementById('songName').value.trim().toLowerCase();
    const songKey = document.getElementById('songKey').value.trim().toUpperCase();
    const resultsDiv = document.getElementById('results');
    
    if (!resultsDiv || (!songName && !songKey)) return;
    resultsDiv.innerHTML = '';

    const filtered = ALL_SCORES.filter(item => {
        // 排除副檔名干擾
        const fileNameOnly = item.n.replace(/\.[^/.]+$/, "");
        const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
        
        let keyMatch = true;
        if (songKey) {
            const escapedKey = songKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // 精準正規表達式：確保 C 不會抓到 .docx
            const keyRegex = new RegExp(`(^|[^a-zA-Z])${escapedKey}(?![a-zA-Z#b])`, 'i');
            keyMatch = keyRegex.test(fileNameOnly);
        }
        return nameMatch && keyMatch;
    });

    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; padding:20px;">找不到符合的樂譜。</p>';
        return;
    }

    filtered.forEach(file => {
        const div = document.createElement('div');
        div.className = 'result-item';
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
        
        div.innerHTML = `
            <div style="flex:1; cursor:pointer;" onclick="openPreview('${file.id}', '${file.t}')">
                <strong>${file.n}</strong>
            </div>
            <div style="display:flex; gap:15px;">
                <span style="color:#4A90E2; cursor:pointer;" onclick="openPreview('${file.id}', '${file.t}')">查看</span>
                <a href="${downloadUrl}" target="_blank" style="text-decoration:none; color:#27ae60; font-weight:bold;">下載 ↓</a>
            </div>
        `;
        resultsDiv.appendChild(div);
    });
}

// 預覽功能 (維持不變)
function openPreview(fileId, mimeType) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    if (!modal || !iframe) return;
    iframe.src = (mimeType && mimeType.includes('document')) 
        ? `https://docs.google.com/document/d/${fileId}/preview`
        : `https://drive.google.com/file/d/${fileId}/preview`;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closePreview() {
    const modal = document.getElementById('previewModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}
