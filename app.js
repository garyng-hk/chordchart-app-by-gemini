/**
 * YLGC Chordchart App - 精簡搜尋版
 * 功能：僅保留「歌名」與「Key」搜尋，確保讀取 GitHub 索引
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
        if (!response.ok) throw new Error('無法讀取索引檔');
        
        const textData = await response.text();
        // 清理隱形字元 (BOM) 並解析 JSON
        ALL_SCORES = JSON.parse(textData.replace(/^\uFEFF/, "").trim());
        
        if (loadingDiv) loadingDiv.classList.add('hidden');
        console.log("✅ 索引載入成功，共 " + ALL_SCORES.length + " 首樂譜");
    } catch (e) {
        if (loadingDiv) {
            loadingDiv.innerText = "連線異常，請重新整理網頁。";
            loadingDiv.style.color = "red";
        }
        console.error("❌ 載入錯誤:", e);
    }
};

// 2. 搜尋邏輯 (移除歌詞搜尋)
function searchScores() {
    const songName = document.getElementById('songName').value.trim().toLowerCase();
    const songKey = document.getElementById('songKey').value.trim().toUpperCase();
    const resultsDiv = document.getElementById('results');
    
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '';

    // 如果兩個框都沒填，提醒使用者
    if (!songName && !songKey) {
        alert('請輸入歌名或 Key 進行搜尋');
        return;
    }

    // 在本地數據中進行篩選
    const filtered = ALL_SCORES.filter(item => {
        // 檢查歌名是否符合 (n 是檔名)
        const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
        // 檢查 Key 是否符合 (通常 Key 會寫在檔名括號裡)
        const keyMatch = songKey ? item.n.toUpperCase().includes(songKey) : true;
        
        return nameMatch && keyMatch;
    });

    // 顯示結果數量
    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">找不到符合條件的樂譜。</p>';
        return;
    }

    // 3. 渲染結果清單
    filtered.forEach(file => {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        // 根據類型顯示圖示
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
        
        // 綁定點擊預覽事件
        div.onclick = () => openPreview(file.id, file.t);
        resultsDiv.appendChild(div);
    });
}

// 4. 預覽視窗控制
function openPreview(fileId, mimeType) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    
    if (!modal || !iframe) return;

    // 清空舊畫面並設定新網址
    iframe.src = '';
    let previewUrl = "";
    
    if (mimeType && mimeType.includes('document')) {
        previewUrl = `https://docs.google.com/document/d/${fileId}/preview`;
    } else {
        previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;
    }
    
    iframe.src = previewUrl;
    modal.style.display = 'flex'; // 顯示 Modal
    document.body.style.overflow = 'hidden'; // 鎖定滾動
}

function closePreview() {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    
    if (modal) modal.style.display = 'none';
    if (iframe) iframe.src = '';
    document.body.style.overflow = 'auto'; // 恢復滾動
}
