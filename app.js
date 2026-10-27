/**
 * YLGC 樂譜索引生成器 - 終極精簡穩定版
 */
const ROOT_FOLDER_ID = '10ZuF87OUmjYRJphLWbGcpIlEUyX1ryWt'; // 請填入你的主資料夾 ID

function updateJsonFile() {
  try {
    const rootFolder = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const results = [];
    const visitedFolders = new Set(); // 記錄已掃描資料夾，防止死迴圈
    const fileIds = new Set();       // 記錄已加入檔案，防止重複

    console.log("🚀 開始掃描樂譜庫...");
    scanFolder(rootFolder, results, visitedFolders, fileIds);

    if (results.length === 0) {
      console.warn("⚠️ 未找到任何樂譜檔案！");
      return;
    }

    const jsonString = JSON.stringify(results);
    const fileName = "scores.json";
    
    // 尋找現有的 scores.json（確保永久 ID）
    const existingFiles = rootFolder.getFilesByName(fileName);
    let targetFile;

    if (existingFiles.hasNext()) {
      targetFile = existingFiles.next();
      targetFile.setContent(jsonString);
    } else {
      const blob = Utilities.newBlob(jsonString, 'application/json', fileName);
      targetFile = rootFolder.createFile(blob);
    }

    // 確保公開檢視權限
    targetFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    console.log(`✅ 同步完成！共匯入 ${results.length} 首樂譜。`);
    console.log(`📌 樂譜索引檔固定 ID: ${targetFile.getId()}`);

  } catch (e) {
    console.error("❌ 執行出錯: " + e.message);
  }
}

/**
 * 核心遞迴掃描函式
 */
function scanFolder(folder, results, visitedFolders, fileIds) {
  const folderId = folder.getId();
  if (visitedFolders.has(folderId)) return; // 避免循環引用
  visitedFolders.add(folderId);

  // 1. 掃描當前資料夾的檔案
  const files = folder.getFiles();
  while (files.hasNext()) {
    const file = files.next();
    const id = file.getId();
    const name = file.getName();
    const mime = file.getMimeType();

    if (name === "scores.json") continue;

    // 排除資料夾與捷徑類型
    if (mime !== "application/vnd.google-apps.folder" && 
        mime !== "application/vnd.google-apps.shortcut" && 
        !fileIds.has(id)) {
      
      fileIds.add(id);
      results.push({ n: name, id: id, t: mime });
    }
  }

  // 2. 進入子資料夾
  const subFolders = folder.getFolders();
  while (subFolders.hasNext()) {
    scanFolder(subFolders.next(), results, visitedFolders, fileIds);
  }

  // 3. 處理資料夾捷徑
  const shortcuts = folder.getFilesByType(MimeType.SHORTCUT);
  while (shortcuts.hasNext()) {
    try {
      const shortcut = shortcuts.next();
      if (shortcut.getTargetMimeType() === "application/vnd.google-apps.folder") {
        const targetFolder = DriveApp.getFolderById(shortcut.getTargetId());
        scanFolder(targetFolder, results, visitedFolders, fileIds);
      }
    } catch (e) {
      // 忽略無效或無權限的捷徑
    }
  }
}
