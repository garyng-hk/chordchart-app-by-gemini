/**
 * YLGC Chordchart App - 最終穩定優化版
 */

let ALL_SCORES = [];

// 1. 初始化：載入索引檔
window.onload = async () => {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.classList.remove('hidden');
        loadingDiv.innerText = "正在同步最新樂譜清單...";
    }

    // 這裡使用相對路徑讀取 GitHub 上的 scores.json
    const url = `./scores.json?v=${new Date().getTime()}`; 
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`找不到檔案 (HTTP ${response.status})`);
        
        let textData = await response.text();
        // 清理隱形字元並解析
        ALL_SCORES = JSON.parse(textData.replace(/^\uFEFF/, "").trim());
        
        if (loadingDiv) loadingDiv.classList.add('hidden');
        console.log("✅ 成功同步：" + ALL_SCORES.length + " 首樂譜");
    } catch (e) {
        if (loadingDiv) {
            loadingDiv.innerText = "同步失敗：請確認 scores.json 是否在 GitHub 上。";
            loadingDiv.style.color = "red";
        }
        console.error("❌ 載入錯誤:", e);
    }
};

// 2. 搜尋功能 (包含排除副檔名的精準搜尋)
function searchScores() {
    const songName = document.getElementById('songName').value.trim().toLowerCase();
    const songKey = document.getElementById('songKey').value.trim().toUpperCase();
    const resultsDiv = document.getElementById('results');
    
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '';

    if (!songName && !songKey) {
        alert('請輸入歌名或 Key 進行搜尋');
        return;
    }

    const filtered = ALL_SCORES.filter(item => {
        // 先把副檔名 (如 .pdf, .docx) 拿掉，避免 .docx 的 c 干擾 Key 搜尋
        const fileNameOnly = item.n.replace(/\.[^/.]+$/, "");
        
        // 歌名比對 (寬鬆)
        const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
        
        // 調性比對 (精準：前後不能是英文字母)
        let keyMatch = true;
        if (songKey) {
            const escapedKey = songKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // 規則：前面不是字母，後面不是字母/升降記號
            const keyRegex = new RegExp(`(^|[^a-zA-Z])${escapedKey}(?![a-zA-Z#b])`, 'i');
            keyMatch = keyRegex.test(fileNameOnly);
        }
        
        return nameMatch && keyMatch;
    });

    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">找不到符合條件的樂譜。</p>';
        return;
    }

    // 渲染搜尋結果
    filtered.forEach(file => {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        let icon = '📄'; 
        if (file.t && file.t.includes('image')) icon = '🖼️';
        if (file.t && file.t.includes('document')) icon = '📝';

        const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; flex:1; cursor:pointer;" onclick="openPreview('${file.id}', '${file.t}')">
                <span style="font-size:1.2em;">${icon}</span>
                <span style="font-weight:500;">${file.n}</span>
            </div>
            <div style="display:flex; gap:15px; align-items:center;">
                <span style="color:#4A90E2; font-size:0.9em; cursor:pointer;" onclick="openPreview('${file.id}', '${file.t}')">查看</span>
                <a href="${downloadUrl}" target="_blank" style="text-decoration:none; color:#27ae60; font-size:0.9em; font-weight:bold;">下載 ↓</a>
            </div>
        `;
        resultsDiv.appendChild(div);
    });
}

// 3. 預覽控制
function openPreview(fileId, mimeType) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    
    if (!modal || !iframe) return;

    iframe.src = '';
    let previewUrl = (mimeType && mimeType.includes('document')) 
        ? `https://docs.google.com/document/d/${fileId}/preview`
        : `https://drive.google.com/file/d/${fileId}/preview`;
    
    iframe.src = previewUrl;
    modal.style.display = 'flex'; 
    document.body.style.overflow = 'hidden';
}

function closePreview() {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    if (modal) modal.style.display = 'none';
    if (iframe) iframe.src = '';
    document.body.style.overflow = 'auto';
}
