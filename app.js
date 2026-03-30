/**
 * YLGC Chordchart App - 最終穩定版 (GitHub Index 方案)
 * 邏輯：從 GitHub 讀取 scores.json 清單，從 Google Drive 預覽檔案
 */

let ALL_SCORES = [];

// 1. 頁面初始化：讀取索引檔
window.onload = async () => {
    const loadingDiv = document.getElementById('loading');
    if (!loadingDiv) return;
    
    loadingDiv.classList.remove('hidden');
    loadingDiv.innerText = "正在同步樂譜清單...";

    // 使用時間戳記防止 GitHub Pages 讀到舊快取
    const url = `./scores.json?t=${new Date().getTime()}`; 
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`找不到索引檔 (HTTP ${response.status})`);
        }

        let textData = await response.text();
        
        // 清理隱形字元 (BOM) 與前後空白
        textData = textData.replace(/^\uFEFF/, "").trim();
        
        try {
            // 解析 JSON
            ALL_SCORES = JSON.parse(textData);
            loadingDiv.classList.add('hidden');
            console.log("✅ 成功同步：" + ALL_SCORES.length + " 首樂譜");
        } catch (jsonErr) {
            console.error("❌ JSON 解析錯誤:", jsonErr);
            loadingDiv.innerText = "資料格式錯誤，請檢查 scores.json 內容。";
        }

    } catch (e) {
        loadingDiv.innerText = `讀取失敗: ${e.message}`;
        console.error("❌ Fetch 錯誤:", e);
    }
};

// 2. 搜尋功能
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

    // 在本地數據中進行快速篩選 (n 為檔名, id 為雲端 ID)
    const filtered = ALL_SCORES.filter(item => {
        const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
        // Key 搜尋通常也是檢查檔名中是否包含該字元 (例如: "Amazing Grace (G).pdf")
        const keyMatch = songKey ? item.n.toUpperCase().includes(songKey) : true;
        return nameMatch && keyMatch;
    });

    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">找不到符合條件的樂譜。</p>';
        return;
    }

    // 3. 渲染結果列表
    filtered.forEach(file => {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        // 根據副檔名顯示圖示
        let icon = '📄'; 
        if (file.t && file.t.includes('image')) icon = '🖼️';
        if (file.t && file.t.includes('document')) icon = '📝';

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:1.2em;">${icon}</span>
                <span style="font-weight:500;">${file.n}</span>
            </div>
            <span style="color:#4A90E2; font-size:0.9em;">點擊查看 ></span>
        `;
        
        // 點擊觸發預覽 (傳入 ID 與 類型)
        div.onclick = () => openPreview(file.id, file.t);
        resultsDiv.appendChild(div);
    });
}
