// ==========================================
// YLGC 樂譜搜尋系統 - 核心邏輯 (app.js)
// ==========================================

// 1. 設定區 (請確保 API KEY 在 Google Cloud Console 已開啟 Google Drive API 權限)
const API_KEY = 'AIzaSyDMjNzzDtquOzE-WGUQ-X01wWEOQq5lUKE'; 
const FOLDER_ID = '10ZuF87OUmjYRJphLWbGcpIlEUyX1ryWt';

async function searchScores() {
    const songName = document.getElementById('songName').value.trim();
    const songKey = document.getElementById('songKey').value.trim();
    const lyrics = document.getElementById('lyrics').value.trim();
    
    // 基本檢查
    if (!songName && !songKey && !lyrics) {
        alert('請至少輸入一個搜尋條件（歌名、Key 或 歌詞）');
        return;
    }

    const resultsDiv = document.getElementById('results');
    const loadingDiv = document.getElementById('loading');
    
    resultsDiv.innerHTML = '';
    loadingDiv.classList.remove('hidden');

    // 2. 建立搜尋指令 (Query)
    // 注意：由於 API Key 的限制，我們搜尋「所有公開檔案」並過濾格式
    let queryParts = [
        "trashed = false",
        "(mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.document' or mimeType = 'image/png' or mimeType = 'image/jpeg' or mimeType = 'image/jpg')"
    ];

    // 如果你有數百個子資料夾，'in parents' 會導致搜不到深層檔案
    // 所以我們改用名稱過濾。如果你發現搜到無關的檔案，再取消下面這一行的註解：
    // queryParts.push(`'${FOLDER_ID}' in parents`); 

    if (songName) {
        queryParts.push(`name contains '${songName}'`);
    }
    
    if (songKey) {
        queryParts.push(`name contains '${songKey}'`);
    }

    if (lyrics) {
        // fullText 搜尋在 API Key 模式下有時會因權限較嚴格而報錯
        // 如果持續報 403，請考慮將此行暫時註解掉
        queryParts.push(`fullText contains '${lyrics}'`);
    }

    const q = queryParts.join(' and ');
    
    // 3. 組裝 API 請求網址
    // 加上 supportsAllDrives=true 是解決 403/404 的關鍵
    const fields = "files(id,name,mimeType)";
    const url = `https://www.googleapis.com/drive/v3/files?key=${API_KEY}` +
                `&q=${encodeURIComponent(q)}` +
                `&fields=${encodeURIComponent(fields)}` +
                `&pageSize=40` +
                `&includeItemsFromAllDrives=true` +
                `&supportsAllDrives=true`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        loadingDiv.classList.add('hidden');

        if (data.error) {
            console.error('Google API Error:', data.error);
            resultsDiv.innerHTML = `
                <div style="color: #ff4757; padding: 20px; background: white; border-radius: 8px;">
                    <h3>搜尋失敗 (Error ${data.error.code})</h3>
                    <p>${data.error.message}</p>
                    <small>請檢查 Google Cloud 的 API Key 是否已解除網域限制。</small>
                </div>`;
            return;
        }

        const files = data.files || [];
        
        if (files.length === 0) {
            resultsDiv.innerHTML = '<p style="text-align:center; color:#666;">找不到符合條件的樂譜，請嘗試減少關鍵字。</p>';
            return;
        }

        // 4. 渲染搜尋結果
        files.forEach(file => {
            const item = document.createElement('div');
            item.className = 'result-item';
            
            let icon = '📄'; // 預設 PDF
            if (file.mimeType.includes('image')) icon = '🖼️';
            if (file.mimeType.includes('document')) icon = '📝';

            item.innerHTML = `
                <div style="display:flex; align-items:center; gap:10px;">
                    <span style="font-size:1.2em;">${icon}</span>
                    <span style="font-weight:500;">${file.name}</span>
                </div>
                <span style="color: #4A90E2; font-size: 0.9em;">點擊預覽 ></span>
            `;
            
            // 點擊後開啟覆蓋層
            item.onclick = () => openPreview(file.id, file.mimeType);
            resultsDiv.appendChild(item);
        });

    } catch (error) {
        loadingDiv.classList.add('hidden');
        resultsDiv.innerHTML = '<p style="color:red; text-align:center;">網路連線異常，請稍後再試。</p>';
        console.error('Fetch error:', error);
    }
}

// 5. 覆蓋層預覽邏輯
function openPreview(fileId, mimeType)
