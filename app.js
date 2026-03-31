/**
 * YLGC Chordchart App - 增加下載功能版
 */

let ALL_SCORES = [];

window.onload = async () => {
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.classList.remove('hidden');

    const url = `./scores.json?v=${new Date().getTime()}`; 
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('無法讀取索引檔');
        const textData = await response.text();
        ALL_SCORES = JSON.parse(textData.replace(/^\uFEFF/, "").trim());
        if (loadingDiv) loadingDiv.classList.add('hidden');
    } catch (e) {
        if (loadingDiv) loadingDiv.innerText = "連線異常，請重新整理。";
        console.error(e);
    }
};

function searchScores() {
    const songName = document.getElementById('songName').value.trim().toLowerCase();
    const songKey = document.getElementById('songKey').value.trim().toUpperCase();
    const resultsDiv = document.getElementById('results');
    
    if (!resultsDiv) return;
    resultsDiv.innerHTML = '';

    if (!songName && !songKey) {
        alert('請輸入搜尋條件');
        return;
    }

    const filtered = ALL_SCORES.filter(item => {
        const nameMatch = songName ? item.n.toLowerCase().includes(songName) : true;
        const keyMatch = songKey ? item.n.toUpperCase().includes(songKey) : true;
        return nameMatch && keyMatch;
    });

    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">找不到樂譜。</p>';
        return;
    }

    filtered.forEach(file => {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        // 根據類型顯示圖示
        let icon = '📄'; 
        if (file.t && file.t.includes('image')) icon = '🖼️';
        if (file.t && file.t.includes('document')) icon = '📝';

        // 產生下載連結：Google Drive 的強制下載格式
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${file.id}`;

        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; flex:1;" onclick="openPreview('${file.id}', '${file.t}')">
                <span style="font-size:1.2em;">${icon}</span>
                <span style="font-weight:500;">${file.n}</span>
            </div>
            <div style="display:flex; gap:15px; align-items:center;">
                <span style="color:#4A90E2; font-size:0.9em; cursor:pointer;" onclick="openPreview('${file.id}', '${file.t}')">查看</span>
                <a href="${downloadUrl}" target="_blank" style="text-decoration:none; color:#27ae60; font-size:0.9em; font-weight:bold;">下載 ↓</a>
            </div>
        `;
        resultsDiv.appendChild(div);
    });
}

// 預覽與關閉功能保持不變
function openPreview(fileId, mimeType) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    if (!modal || !iframe) return;
    iframe.src = '';
    let previewUrl = (mimeType && mimeType.includes('document')) 
        ? `https://docs.google.com/document/d/${fileId}/preview`
        : `https://drive.google.com/file/d/${fileId}/preview`;
    iframe.src = previewUrl;
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
