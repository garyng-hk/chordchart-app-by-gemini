/**
 * YLGC Chordchart App - 精簡穩定版 -前端部分優化了正則表達式效能與對 iOS/Android 的 DOM 相容性
 */

let ALL_SCORES = [];

// 設定區
const JSON_FILE_ID = '你的_scores_json_固定ID'; 
const API_KEY = '你的_Google_Drive_API_KEY'; 

// 初始化：載入資料
window.addEventListener('DOMContentLoaded', async () => {
    const loadingDiv = document.getElementById('loading');
    
    // 使用時間戳防快取
    const url = `https://www.googleapis.com/drive/v3/files/${JSON_FILE_ID}?alt=media&key=${API_KEY}&t=${Date.now()}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP 錯誤: ${response.status}`);
        
        const textData = await response.text();
        // 清除 BOM 檔頭並解析
        ALL_SCORES = JSON.parse(textData.replace(/^\uFEFF/, "").trim());
        
        if (loadingDiv) loadingDiv.classList.add('hidden');
        console.log(`✅ 成功同步 ${ALL_SCORES.length} 首樂譜`);
    } catch (e) {
        if (loadingDiv) {
            loadingDiv.style.color = "red";
            loadingDiv.innerText = "同步失敗，請檢查網路連線或更新頁面。";
        }
        console.error("載入失敗:", e);
    }
});

// 搜尋核心
function searchScores() {
    const songNameInput = document.getElementById('songName');
    const songKeyInput = document.getElementById('songKey');
    const resultsDiv = document.getElementById('results');
    
    if (!resultsDiv) return;
    
    const songName = songNameInput ? songNameInput.value.trim().toLowerCase() : '';
    const songKey = songKeyInput ? songKeyInput.value.trim().toUpperCase() : '';

    if (!songName && !songKey) {
        alert('請輸入歌名或 Key 進行搜尋');
        return;
    }

    // 預先建構 Key 的正則表達式 (提高大數據比對效能)
    let keyRegex = null;
    if (songKey) {
        const escapedKey = songKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        keyRegex = new RegExp(`(^|[^a-zA-Z])${escapedKey}(?![a-zA-Z#b])`, 'i');
    }

    const filtered = ALL_SCORES.filter(item => {
        // 1. 先去除副檔名 (例如 .docx, .pdf) 避免誤判 Key
        const fileNameOnly = item.n.replace(/\.[^/.]+$/, "");
        
        // 2. 歌名比對
        const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
        
        // 3. 調性比對
        const keyMatch = keyRegex ? keyRegex.test(fileNameOnly) : true;
        
        return nameMatch && keyMatch;
    });

    renderResults(filtered, resultsDiv);
}

// 渲染結果清單
function renderResults(scores, container) {
    container.innerHTML = '';

    if (scores.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:gray;">找不到符合的樂譜。</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    scores.forEach(file => {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        // 判斷 Google Doc 轉 PDF 下載或是一般檔案下載
        const isGoogleDoc = file.t && file.t.includes('vnd.google-apps.document');
        const downloadUrl = isGoogleDoc
            ? `https://docs.google.com/document/d/${file.id}/export?format=pdf`
            : `https://drive.google.com/uc?export=download&id=${file.id}`;

        div.innerHTML = `
            <div style="flex:1; cursor:pointer;" onclick="openPreview('${file.id}', '${file.t}')">
                <strong>${escapeHtml(file.n)}</strong>
            </div>
            <div style="display:flex; gap:15px; align-items:center;">
                <span style="color:#4A90E2; cursor:pointer;" onclick="openPreview('${file.id}', '${file.t}')">查看</span>
                <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; color:#27ae60; font-weight:bold;">下載 ↓</a>
            </div>
        `;
        fragment.appendChild(div);
    });

    container.appendChild(fragment);
}

// 預覽功能
function openPreview(fileId, mimeType) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    if (!modal || !iframe) return;

    const isGoogleDoc = mimeType && mimeType.includes('document');
    iframe.src = isGoogleDoc 
        ? `https://docs.google.com/document/d/${fileId}/preview`
        : `https://drive.google.com/file/d/${fileId}/preview`;
    
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closePreview() {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    if (modal) modal.style.display = 'none';
    if (iframe) iframe.src = ''; // 清空以釋放記憶體
    document.body.style.overflow = 'auto';
}

// XSS 防護
function escapeHtml(str) {
    return str.replace(/[&<>"']/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[match]));
}
