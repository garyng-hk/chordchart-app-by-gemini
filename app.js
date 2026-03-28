// 替換為你產出的 scores.json 的檔案 ID
const JSON_FILE_ID = '你在上一步產生的scores.json的ID'; 
const API_KEY = 'AIzaSyDMjNzzDtquOzE-WGUQ-X01wWEOQq5lUKE'; // 僅用於下載檔案內容

let ALL_SCORES = [];

// 頁面載入時先抓取清單
window.onload = async () => {
    const url = `https://www.googleapis.com/drive/v3/files/${JSON_FILE_ID}?alt=media&key=${API_KEY}`;
    try {
        const response = await fetch(url);
        ALL_SCORES = await response.json();
        console.log("成功載入 " + ALL_SCORES.length + " 首樂譜");
    } catch (e) {
        console.error("載入索引失敗", e);
    }
};

function searchScores() {
    const songName = document.getElementById('songName').value.trim().toLowerCase();
    const songKey = document.getElementById('songKey').value.trim().toUpperCase();
    
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    // 本地搜尋，完全不需等待 Google 回應
    const filtered = ALL_SCORES.filter(item => {
        const matchName = songName ? item.name.toLowerCase().includes(songName) : true;
        const matchKey = songKey ? item.name.toUpperCase().includes(songKey) : true;
        return matchName && matchKey;
    });

    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p>找不到符合條件的樂譜。</p>';
        return;
    }

    filtered.forEach(file => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `<span>📄 ${file.name}</span><span style="color:#4A90E2;">預覽</span>`;
        item.onclick = () => openPreview(file.id, file.type);
        resultsDiv.appendChild(item);
    });
}

function openPreview(fileId, mimeType) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    iframe.src = mimeType.includes('document') 
        ? `https://docs.google.com/document/d/${fileId}/preview`
        : `https://drive.google.com/file/d/${fileId}/preview`;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closePreview() {
    document.getElementById('previewModal').classList.add('hidden');
    document.getElementById('previewFrame').src = '';
    document.body.style.overflow = 'auto';
}
