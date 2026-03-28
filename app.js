// 引入 data.js 後，SCORE_DATA 就可以直接使用

function searchScores() {
    const songName = document.getElementById('songName').value.trim().toLowerCase();
    const songKey = document.getElementById('songKey').value.trim().toUpperCase();
    const lyrics = document.getElementById('lyrics').value.trim().toLowerCase();
    
    if (!songName && !songKey && !lyrics) {
        alert('請輸入搜尋條件');
        return;
    }

    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    // 在本地數據中篩選
    const filtered = SCORE_DATA.filter(item => {
        const matchName = songName ? item.name.toLowerCase().includes(songName) : true;
        const matchKey = songKey ? item.key.toUpperCase() === songKey : true;
        const matchLyrics = lyrics ? item.lyrics.toLowerCase().includes(lyrics) : true;
        return matchName && matchKey && matchLyrics;
    });

    if (filtered.length === 0) {
        resultsDiv.innerHTML = '<p>找不到符合條件的樂譜。</p>';
        return;
    }

    filtered.forEach(file => {
        const item = document.createElement('div');
        item.className = 'result-item';
        item.innerHTML = `
            <div>
                <strong>${file.name}</strong> <span style="color:#666">[${file.key}]</span>
            </div>
            <span style="color: #4A90E2;">點擊預覽</span>
        `;
        // 預覽依然使用 Google Drive 的連結，這部分不受 API Key 限制
        item.onclick = () => openPreview(file.id);
        resultsDiv.appendChild(item);
    });
}

function openPreview(fileId) {
    const modal = document.getElementById('previewModal');
    const iframe = document.getElementById('previewFrame');
    iframe.src = `https://drive.google.com/file/d/${fileId}/preview`;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closePreview() {
    document.getElementById('previewModal').classList.add('hidden');
    document.getElementById('previewFrame').src = '';
    document.body.style.overflow = 'auto';
}
