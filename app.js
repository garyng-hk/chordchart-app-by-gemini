// 渲染結果清單 (修正下載與預覽邏輯)
function renderResults(scores, container) {
    container.innerHTML = '';

    if (scores.length === 0) {
        container.innerHTML = '<p style="text-align:center; padding:20px; color:gray;">找不到符合的樂譜。</p>';
        return;
    }

    const fragment = document.createDocumentFragment();

    scores.forEach(file => {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        const isGoogleDoc = file.t && file.t.includes('vnd.google-apps.document');
        
        // --- 修正下載網址 ---
        // Google Doc 匯出為 PDF，一般檔案使用 Google Drive 官方標準下載格式
        const downloadUrl = isGoogleDoc
            ? `https://docs.google.com/document/d/${file.id}/export?format=pdf`
            : `https://drive.google.com/uc?export=download&confirm=t&id=${file.id}`;

        div.innerHTML = `
            <div style="flex:1; cursor:pointer;" onclick="openPreview('${file.id}', '${file.t}')">
                <strong>${escapeHtml(file.n)}</strong>
            </div>
            <div style="display:flex; gap:15px; align-items:center;">
                <span style="color:#4A90E2; cursor:pointer;" onclick="openPreview('${file.id}', '${file.t}')">查看</span>
                <a href="${downloadUrl}" target="_blank" rel="noopener noreferrer" style="text-decoration:none; color:#27ae60; font-weight:bold;">下載 ↓</a>
            </div>
        `;
        fragment.appendChild(div);
    });

    container.appendChild(fragment);
}
