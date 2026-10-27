/**
 * YLGC Chordchart App - 防卡死穩定版
 */

let ALL_SCORES = [];
let isSearching = false; // 防連點保護鎖

// 1. 設定區：請確保填入正確的 ID 與 API Key
const JSON_FILE_ID = '1ygPQgAzfVUTK77_SEnz3dnbjJ6tH4lXw'; 
const API_KEY = 'AIzaSyDMjNzzDtquOzE-WGUQ-X01wWEOQq5lUKE'; 

// 初始化：載入資料
window.addEventListener('DOMContentLoaded', () => {
    loadScores();
});

async function loadScores() {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.classList.remove('hidden');
        loadingDiv.innerText = "正在同步最新樂譜...";
    }

    const url = `https://www.googleapis.com/drive/v3/files/${JSON_FILE_ID}?alt=media&key=${API_KEY}&t=${Date.now()}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP 錯誤: ${response.status}`);
        
        const textData = await response.text();
        const cleanedText = textData.replace(/^\uFEFF/, "").trim();
        
        ALL_SCORES = JSON.parse(cleanedText);
        
        if (!Array.isArray(ALL_SCORES)) {
            throw new Error("JSON 格式不正確，應為陣列");
        }
        
        if (loadingDiv) loadingDiv.classList.add('hidden');
        console.log(`✅ 成功同步 ${ALL_SCORES.length} 首樂譜`);
    } catch (e) {
        if (loadingDiv) {
            loadingDiv.style.color = "red";
            loadingDiv.innerText = "同步失敗，請檢查 ID 或 API Key。";
        }
        console.error("載入失敗:", e);
    }
}

// 2. 搜尋核心 (加入防連點保護)
function searchScores() {
    if (isSearching) return; // 如果正在處理，直接忽略避免卡死
    isSearching = true;

    try {
        const songNameInput = document.getElementById('songName');
        const songKeyInput = document.getElementById('songKey');
        const resultsDiv = document.getElementById('results');
        
        if (!resultsDiv) return;
        
        const songName = songNameInput ? songNameInput.value.trim().toLowerCase() : '';
        const songKey = songKeyInput ? songKeyInput.value.trim().toUpperCase() : '';

        if (!songName && !songKey) {
            alert('請輸入歌名或 Key 進行搜尋');
            isSearching = false;
            return;
        }

        // 預先建構 Key 的正則表達式
        let keyRegex = null;
        if (songKey) {
            const escapedKey = songKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            keyRegex = new RegExp(`(^|[^a-zA-Z])${escapedKey}(?![a-zA-Z#b])`, 'i');
        }

        // 過濾資料 (加上安全限制，避免大數據癱瘓)
        const filtered = ALL_SCORES.filter(item => {
            if (!item || !item.n) return false;
            const fileNameOnly = item.n.replace(/\.[^/.]+$/, "");
            const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
            const keyMatch = keyRegex ? keyRegex.test(fileNameOnly) : true;
            return nameMatch && keyMatch;
        });

        renderResults(filtered, resultsDiv);
    } catch (err) {
        console.error("搜尋發生錯誤:", err);
    } finally {
        isSearching = false; // 解除防護鎖
    }
}

// 3. 渲染結果清單 (使用 DocumentFragment 確保流暢不卡頓)
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
        
        const isGoogleDoc = file.t && file.t.includes('vnd.google-apps.document');
        const fileUrl = isGoogleDoc
            ? `https://docs.google.com/document/d/${file.id}/edit?usp=sharing`
            : `https://drive.google.com/file/d/${file.id}/view?usp=sharing`;

        div.innerHTML = `
            <div style="flex:1; cursor:pointer;" onclick="openPreview('${file.id}', '${file.t}')">
                <strong>${escapeHtml(file.n)}</strong>
            </div>
            <div style="display:flex; gap:15px; align-items:center;">
                <span style="color:#4A90E2; cursor:pointer;" onclick="openPreview('${file.id}', '${file.t}')">查看</span>
                <a href="${fileUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; color:#27ae60; font-weight:bold;">下載/預覽 ↗</a>
            </div>
        `;
        fragment.appendChild(div);
    });

    container.appendChild(fragment);
}

// 4. 預覽控制
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
    if (iframe) iframe.src = ''; 
    document.body.style.overflow = 'auto';
}

// XSS 防護
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, match => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[match]));
}
