// 替換為你的 API Key (請記得在 Google Cloud 設定限制網域)
const API_KEY = 'AIzaSyDMjNzzDtquOzE-WGUQ-X01wWEOQq5lUKE';

async function searchScores() {
    const songName = document.getElementById('songName').value.trim();
    const songKey = document.getElementById('songKey').value.trim();
    const lyrics = document.getElementById('lyrics').value.trim();
    
    if (!songName && !songKey && !lyrics) {
        alert('請至少輸入一項搜尋條件！');
        return;
    }

    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    
    resultsDiv.innerHTML = '';
    loadingDiv.classList.remove('hidden');

    // 建立搜尋條件 (q)
    // 限制檔案類型為 PDF, GDoc, PNG, JPG
   let queryParts = [
        "trashed = false",
        "(mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'image/png' or mimeType = 'image/jpeg' or mimeType = 'image/jpg')"
    ];

    if (songName) queryParts.push(`name contains '${songName}'`);
    if (songKey) queryParts.push(`name contains '${songKey}'`);
    if (lyrics) queryParts.push(`fullText contains '${lyrics}'`);

    const q = queryParts.join(' and ');
    
    // 修正 URL：加入 includeItemsFromAllDrives 與 supportsAllDrives
    // 這能解決部分權限導致的 403/404
    const url = `https://www.googleapis.com/drive/v3/files?key=${API_KEY}&q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)&pageSize=50&includeItemsFromAllDrives=true&supportsAllDrives=true`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.error('詳細錯誤資訊:', data.error);
            // 如果看到 403 "The domain policy has disabled..." 則代表 API key 限制有誤
            resultsDiv.innerHTML = `<p style="color:red;">錯誤代碼 ${data.error.code}: ${data.error.message}</p>`;
            return;
        }
        // ... 後續顯示邏輯 ...
    } catch (e) { /* ... */ }
}

function openPreview(fileId) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    // 使用 Google Drive 的 preview 端點，確保不會跳轉到 App
    iframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
    modal.classList.remove('hidden');
    // 防止背景捲動
    document.body.style.overflow = 'hidden';
}

function closePreview() {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    iframe.src = ''; // 清空 iframe 以停止載入
    modal.classList.add('hidden');
    // 恢復背景捲動
    document.body.style.overflow = 'auto';
}// JavaScript Document
