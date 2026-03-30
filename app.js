let ALL_SCORES = [];

// 頁面初始化：直接讀取 GitHub 上的 scores.json
window.onload = async () => {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.classList.remove('hidden');
    loadingDiv.innerText = "正在讀取樂譜清單...";

    // 使用絕對路徑，避免相對路徑的誤判
    const url = 'https://app.ylgcmusic.org/scores.json'; 
    
    try {
        // 加入快取控制，確保每次都讀取最新版
        const response = await fetch(url, { cache: "no-store" }); 
        
        if (!response.ok) {
            throw new Error(`HTTP 錯誤! 狀態碼: ${response.status}`);
        }
        
        ALL_SCORES = await response.json();
        
        loadingDiv.classList.add('hidden');
        console.log("成功載入 " + ALL_SCORES.length + " 首樂譜");
    } catch (e) {
        // 將詳細錯誤印在畫面上，方便我們診斷
        loadingDiv.innerText = `讀取失敗: ${e.message}`;
        console.error("錯誤詳情:", e);
    }
};
function searchScores() {
    const songName = document.getElementById('songName').value.trim().toLowerCase();
    const songKey = document.getElementById('songKey').value.trim().toUpperCase();
    const resultsDiv = document.getElementById('results');
    
    resultsDiv.innerHTML = '';

    if (!songName && !songKey) {
        alert('請輸入搜尋關鍵字');
        return;
    }

    // 本地搜尋邏輯
    const filtered = ALL_SCORES.filter(item => {
        const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
        // 假設 Key 寫在檔名中，例如 "Amazing Grace (C).pdf"
        const keyMatch = songKey ? item.n.toUpperCase().includes(songKey) : true;
        return nameMatch && keyMatch;
    });

    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; padding:20px;">找不到符合的樂譜。</p>';
        return;
    }

    filtered.forEach(file => {
        const div = document.createElement('div');
        div.className = 'result-item';
        let icon = file.t.includes('pdf') ? '📄' : (file.t.includes('image') ? '🖼️' : '📝');
        
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span>${icon}</span>
                <span>${file.n}</span>
            </div>
            <span style="color:#4A90E2;">查看 ></span>
        `;
        div.onclick = () => openPreview(file.id, file.t);
        resultsDiv.appendChild(div);
    });
}

function openPreview(fileId, mimeType) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    
    // 預覽連結
    if (mimeType.includes('document')) {
        iframe.src = `https://docs.google.com/document/d/${fileId}/preview`;
    } else {
        iframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closePreview() {
    document.getElementById('previewModal').classList.add('hidden');
    document.getElementById('previewFrame').src = '';
    document.body.style.overflow = 'auto';
}
