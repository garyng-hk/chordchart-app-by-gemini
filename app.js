/**
 * YLGC Chordchart App - 固定 ID 最終優化版
 */

let ALL_SCORES = [];

// 1. 設定區：請將 GAS 執行後產生的那串 ID 貼在這裡
const JSON_FILE_ID = '你的_scores_json_固定ID'; 
const API_KEY = '你的_Google_Drive_API_KEY'; 

// 2. 初始化：從 Google Drive 讀取索引
window.onload = async () => {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) {
        loadingDiv.classList.remove('hidden');
        loadingDiv.innerText = "正在同步最新樂譜...";
    }

    // 建立讀取網址 (加上時間戳防止快取)
    const url = `https://www.googleapis.com/drive/v3/files/${JSON_FILE_ID}?alt=media&key=${API_KEY}&v=${new Date().getTime()}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`同步失敗 (代碼 ${response.status})`);
        }
        
        const textData = await response.text();
        // 清理可能存在的 BOM 字元並解析 JSON
        ALL_SCORES = JSON.parse(textData.replace(/^\uFEFF/, "").trim());
        
        if (loadingDiv) loadingDiv.classList.add('hidden');
        console.log("✅ 成功載入 " + ALL_SCORES.length + " 首樂譜");
    } catch (e) {
        if (loadingDiv) {
            loadingDiv.innerText = "同步失敗：請檢查 ID、API Key 或檔案權限。";
            loadingDiv.style.color = "red";
        }
        console.error("❌ 載入錯誤:", e);
    }
};

// 3. 搜尋功能 (包含排除副檔名的精準搜尋)
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
        // --- 核心修正：搜尋前先去掉副檔名 (如 .docx, .pdf) ---
        // 這樣搜尋 C 的時候，就不會被 .docx 的 c 誤導
        const fileNameOnly = item.n.replace(/\.[^/.]+$/, "");
        
        // 歌名比對 (只要包含就中)
        const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
        
        // 調性比對 (精準搜尋：確保 C 不會抓到 Eric 或 Music)
        let keyMatch = true;
        if (songKey) {
            const escapedKey = songKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // 規則：Key 的前後不能是英文字母
            const keyRegex = new RegExp(`(^|[^a-zA-Z])${escapedKey}(?![a-zA-Z#b])`, 'i');
            keyMatch = keyRegex.test(fileNameOnly);
        }
        
        return nameMatch && keyMatch;
    });

    // 渲染搜尋結果
    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; padding:20px; color:gray;">找不到符合的樂譜。</p>';
        return;
    }

    filtered.forEach(file => {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        // 根據檔案類型自動切換下載連結
        let downloadUrl = "";
        if (file.t && file.t.includes('vnd.google-apps.document')) {
            // Google Doc 轉 PDF 下載
            downloadUrl = `https://docs.google.com/document/d/${file.id}/export?format=pdf`;
        } else {
            // 一般檔案直接下載
            downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;
        }

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

// 4. 預覽控制 (維持不變)
function openPreview(fileId, mimeType) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    if (!modal || !iframe) return;

    let previewUrl = (mimeType && mimeType.includes('document')) 
        ? `https://docs.google.com/document/d/${fileId}/preview`
        : `https://drive.google.com/file/d/${fileId}/preview`;
    
    iframe.src = previewUrl;
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

function closePreview() {
    const modal = document.getElementById('previewModal');
    if (modal) modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}
