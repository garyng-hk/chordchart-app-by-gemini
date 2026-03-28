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
        "trashed=false",
        "(mimeType='application/pdf' or mimeType='application/vnd.google-apps.document' or mimeType='image/png' or mimeType='image/jpeg')"
    ];

    // 根據輸入動態加入條件
    if (songName) queryParts.push(`name contains '${songName}'`);
    if (songKey) queryParts.push(`name contains '${songKey}'`); // 假設調性寫在檔名中
    if (lyrics) queryParts.push(`fullText contains '${lyrics}'`);

    const q = queryParts.join(' and ');
    
    // Google Drive API 請求網址
    // 注意：如果是純前端使用 API Key，目標資料夾及檔案必須設為「知道連結的人均可檢視」
    const url = `https://www.googleapis.com/drive/v3/files?key=${API_KEY}&q=${encodeURIComponent(q)}&fields=files(id,name,mimeType)&pageSize=50`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        loadingDiv.classList.add('hidden');

        if (data.error) {
            console.error('API 錯誤:', data.error);
            resultsDiv.innerHTML = `<p style="color:red;">搜尋發生錯誤，請檢查設定。</p>`;
            return;
        }

        const files = data.files || [];
        
        if (files.length === 0) {
            resultsDiv.innerHTML = '<p>找不到符合的樂譜。</p>';
            return;
        }

        files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'result-item';
            
            // 判斷檔案類型顯示不同小圖示
            let typeIcon = '📄';
            if (file.mimeType.includes('image')) typeIcon = '🖼️';
            if (file.mimeType.includes('document')) typeIcon = '📝';

            item.innerHTML = `<span>${typeIcon} ${file.name}</span>`;
            
            // 點擊後開啟覆蓋層
            item.onclick = () => openPreview(file.id);
            resultsDiv.appendChild(item);
        });

    } catch (error) {
        loadingDiv.classList.add('hidden');
        resultsDiv.innerHTML = '<p style="color:red;">網路連線錯誤。</p>';
        console.error(error);
    }
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