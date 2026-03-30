// 設定區
const JSON_FILE_ID = '1HurtrFGqugzTdy5ghNNISRdM2TEzAl1U/view?usp=drive_link'; 
const API_KEY = 'AIzaSyDMjNzzDtquOzE-WGUQ-X01wWEOQq5lUKE'; 

let ALL_SCORES = [];

// 修改 app.js 的 window.onload 部分
window.onload = async () => {
    const loadingDiv = document.getElementById('loading');
    loadingDiv.classList.remove('hidden');
    loadingDiv.innerText = "正在同步本地樂譜清單...";

    // 直接讀取 GitHub 上的 scores.json
    const url = './scores.json'; 
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('找不到 scores.json 檔案');
        
        ALL_SCORES = await response.json();
        
        loadingDiv.classList.add('hidden');
        console.log("成功載入 " + ALL_SCORES.length + " 首樂譜");
    } catch (e) {
        loadingDiv.innerText = "讀取失敗：請確保 scores.json 已上傳至 GitHub。";
        console.error(e);
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

    // 本地快速篩選
    const filtered = ALL_SCORES.filter(item => {
        const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
        const keyMatch = songKey ? item.n.toUpperCase().includes(songKey) : true;
        return nameMatch && keyMatch;
    });

    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; padding:20px;">找不到符合的樂譜。</p>';
        return;
    }

    // 顯示結果
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
    
    // 根據格式選擇預覽方式
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
