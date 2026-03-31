/**
 * YLGC Chordchart App - 增加下載功能版
 */

let ALL_SCORES = [];

window.onload = async () => {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.classList.remove('hidden');

    // 1. 指向 Google Drive 上的 scores.json 檔案 ID
    const JSON_FILE_ID = '1fmo9JxGeG5XxlfvXLOXOiHkh-oNoxYcH0Qf72GifhPHRhmW9MnnWeasR'; 
    const API_KEY = 'AIzaSyDMjNzzDtquOzE-WGUQ-X01wWEOQq5lUKE'; 

    // 2. 使用 Google API 的媒體讀取網址，並加上時間戳記防止快取
    const url = `https://www.googleapis.com/drive/v3/files/${JSON_FILE_ID}?alt=media&key=${API_KEY}&t=${new Date().getTime()}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('讀取雲端索引失敗');
        
        const textData = await response.text();
        ALL_SCORES = JSON.parse(textData.replace(/^\uFEFF/, "").trim());
        
        if (loadingDiv) loadingDiv.classList.add('hidden');
        console.log("✅ 已從雲端硬碟同步 " + ALL_SCORES.length + " 首樂譜");
    } catch (e) {
        if (loadingDiv) loadingDiv.innerText = "自動同步失敗，請檢查網路。";
        console.error(e);
    }
};
function searchScores() {
    const songName = document.getElementById('songName').value.trim().toLowerCase();
    const songKey = document.getElementById('songKey').value.trim().toUpperCase();
    const resultsDiv = document.getElementById('results');
    
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '';

    if (!songName && !songKey) {
        alert('請輸入搜尋條件');
        return;
    }
// 在本地數據中進行篩選
    const filtered = ALL_SCORES.filter(item => {
        // 1. 先處理檔名：把副檔名 (如 .pdf, .docx) 拿掉，只拿主檔名來比對
        // 這樣搜尋 C 的時候，就不會被 .docx 的 c 干擾
        const fileNameWithoutExt = item.n.replace(/\.[^/.]+$/, "");
        
        // 2. 歌名比對：維持寬鬆 (只要包含就中)
        const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
        
        // 3. 調性 (Key) 比對：精準搜尋
        let keyMatch = true;
        if (songKey) {
            // 處理特殊字元 (如 C#)
            const escapedKey = songKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            
            // 使用「字界 \b」搭配「前後非英文字母」的邏輯
            // 這會確保搜 C 時：
            // ✅ 中：Key C, (C), C major
            // ❌ 誤：docx, chord, chart, Eric (因為 c 前後有字母)
            const keyRegex = new RegExp(`(^|[^a-zA-Z])${escapedKey}(?![a-zA-Z#b])`, 'i');
            
            // 重要：我們只在「去掉副檔名」後的名稱裡找 Key
            keyMatch = keyRegex.test(fileNameWithoutExt);
        }
        
        return nameMatch && keyMatch;
    });
    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">找不到樂譜。</p>';
        return;
    }

    filtered.forEach(file => {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        // 根據類型顯示圖示
        let icon = '📄'; 
        if (file.t && file.t.includes('image')) icon = '🖼️';
        if (file.t && file.t.includes('document')) icon = '📝';

        // 產生下載連結：Google Drive 的強制下載格式
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; flex:1;" onclick="openPreview('${file.id}', '${file.t}')">
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

// 預覽與關閉功能保持不變
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
