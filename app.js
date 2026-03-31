/**
 * YLGC Chordchart App - Final Stable Build
 */

let ALL_SCORES = [];

// 1. 初始化：載入 GitHub 上的索引檔
window.onload = async () => {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.classList.remove('hidden');

    // 加上時間戳記避免 GitHub Pages 快取
    const url = `./scores.json?v=${new Date().getTime()}`; 
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('無法讀取 scores.json');
        
        const textData = await response.text();
        // 清理隱形字元並解析
        ALL_SCORES = JSON.parse(textData.replace(/^\uFEFF/, "").trim());
        
        if (loadingDiv) loadingDiv.classList.add('hidden');
        console.log("✅ 成功同步：" + ALL_SCORES.length + " 首樂譜");
    } catch (e) {
        if (loadingDiv) loadingDiv.innerText = "同步失敗，請重新整理網頁。";
        console.error("❌ 載入錯誤:", e);
    }
};

// 2. 搜尋邏輯
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

    // 在本地數據中篩選
    const filtered = ALL_SCORES.filter(item => {
        const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
        const keyMatch = songKey ? item.n.toUpperCase().includes(songKey) : true;
        return nameMatch && keyMatch;
    });

    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">找不到符合條件的樂譜。</p>';
        return;
    }

    // 渲染結果
    filtered.forEach(file => {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        let icon = '📄'; 
        if (file.t && file.t.includes('image')) icon = '🖼️';
        if (file.t && file.t.includes('document')) icon = '📝';

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.2em;">${icon}</span>
                <span style="font-weight:500;">${file.n}</span>
            </div>
            <span style="color:#4A90E2; font-size:0.9em; cursor:pointer;">點擊查看 ></span>
        `;
        
        // 綁定點擊事件
        div.onclick = () => openPreview(file.id, file.t);
        resultsDiv.appendChild(div);
    });
}

// 3. 預覽視窗控制 (解決點擊沒反應的關鍵)
function openPreview(fileId, mimeType) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    
    if (!modal || !iframe) return;

    // 先顯示載入中（可選）
    iframe.src = '';

    // 決定預覽連結
    let previewUrl = "";
    if (mimeType && mimeType.includes('document')) {
        previewUrl = `https://docs.google.com/document/d/${fileId}/preview`;
    } else {
        previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    // 強制顯示 Modal 並載入內容
    iframe.src = previewUrl;
    modal.style.display = 'flex'; 
    document.body.style.overflow = 'hidden'; // 禁止背景捲動
}

function closePreview() {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    
    if (modal) modal.style.display = 'none';
    if (iframe) iframe.src = '';
    document.body.style.overflow = 'auto'; // 恢復背景捲動
}
