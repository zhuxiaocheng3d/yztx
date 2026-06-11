// build.js - 最终修复版（跨行居中 + 全宽居中）
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const SITE_TITLE = '艺展天下';
const COPYRIGHT = `© 2025 艺展天下会展服务有限公司 版权所有`;
const BANNER_FILE = 'banner.jpg';

const ROOT_DIR = __dirname;
const CASE_DIR = path.join(ROOT_DIR, 'case');
const TEAM_DIR = path.join(ROOT_DIR, 'team');
const OUTPUT_STYLE = path.join(ROOT_DIR, 'style.css');

const IMG_EXT = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const VIDEO_EXT = ['.mp4', '.webm', '.ogg', '.mov'];

function isImageFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return IMG_EXT.includes(ext);
}

function isVideoFile(filename) {
  const ext = path.extname(filename).toLowerCase();
  return VIDEO_EXT.includes(ext);
}

function getMediaFiles(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs.readdirSync(dirPath);
  const mediaFiles = [];
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && (isImageFile(file) || isVideoFile(file))) {
      mediaFiles.push(file);
    }
  }
  return mediaFiles;
}

function getCaseFolders() {
  if (!fs.existsSync(CASE_DIR)) return [];
  const items = fs.readdirSync(CASE_DIR);
  const folders = [];
  for (const item of items) {
    const itemPath = path.join(CASE_DIR, item);
    if (fs.statSync(itemPath).isDirectory()) {
      folders.push(item);
    }
  }
  return folders;
}

function getCaseCover(caseFolderName) {
  const casePath = path.join(CASE_DIR, caseFolderName);
  const mediaFiles = getMediaFiles(casePath);
  if (mediaFiles.length === 0) return null;

  // 1. 优先查找与文件夹同名的文件（不区分扩展名，忽略大小写）
  const lowerFolderName = caseFolderName.toLowerCase();
  const sameNameFile = mediaFiles.find(file => {
    const baseName = path.basename(file, path.extname(file)).toLowerCase();
    return baseName === lowerFolderName;
  });
  if (sameNameFile) return sameNameFile;

  // 2. 其次查找任意图片文件
  const imgFile = mediaFiles.find(f => isImageFile(f));
  if (imgFile) return imgFile;

  // 3. 最后返回第一个媒体文件（可能是视频）
  return mediaFiles[0];
}

function getRandomColor() {
  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createSampleCaseIfNeeded() {
  const caseFolders = getCaseFolders();
  if (caseFolders.length === 0) {
    console.log('📁 未检测到案例目录，正在创建示例案例...');
    const sampleCases = [
      { name: '科技未来展', desc: '沉浸式科技体验，探索未来世界' },
      { name: '艺术元宇宙', desc: '数字艺术与虚拟现实的完美融合' },
      { name: '绿色生态展', desc: '环保理念与创新设计的碰撞' }
    ];
    for (let i = 0; i < sampleCases.length; i++) {
      const caseName = `case${i+1}_${sampleCases[i].name}`;
      const casePath = path.join(CASE_DIR, caseName);
      if (!fs.existsSync(casePath)) {
        fs.mkdirSync(casePath, { recursive: true });
        const color = getRandomColor();
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
          <rect width="800" height="600" fill="${color}"/>
          <text x="400" y="300" font-size="40" font-family="Arial" fill="white" text-anchor="middle" dominant-baseline="middle">${sampleCases[i].name}</text>
          <text x="400" y="360" font-size="20" font-family="Arial" fill="#eee" text-anchor="middle">${sampleCases[i].desc}</text>
        </svg>`;
        fs.writeFileSync(path.join(casePath, 'cover.svg'), svgContent);
        const svgContent2 = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
          <rect width="800" height="600" fill="${getRandomColor()}"/>
          <text x="400" y="300" font-size="40" font-family="Arial" fill="white" text-anchor="middle" dominant-baseline="middle">${sampleCases[i].name} - 现场掠影</text>
        </svg>`;
        fs.writeFileSync(path.join(casePath, 'scene.svg'), svgContent2);
        const descContent = `${sampleCases[i].desc}\n\n这是一场令人难忘的展览，吸引了众多观众参与。`;
        fs.writeFileSync(path.join(casePath, 'description.txt'), descContent);
        console.log(`  ✅ 创建案例: ${caseName}`);
      }
    }
  }
}

function createSampleBannerIfNeeded() {
  const bannerPath = path.join(ROOT_DIR, BANNER_FILE);
  if (!fs.existsSync(bannerPath)) {
    console.log('🖼️  未检测到 banner.jpg，正在创建示例横幅...');
    const svgBanner = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="400" viewBox="0 0 1600 400">
      <defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#1e1b2e"/><stop offset="100%" stop-color="#2d2a4a"/></linearGradient></defs>
      <rect width="1600" height="400" fill="url(#grad)"/>
      <text x="800" y="180" font-size="64" font-family="Arial, sans-serif" fill="white" text-anchor="middle" font-weight="bold">艺展天下</text>
      <text x="800" y="250" font-size="28" font-family="Arial, sans-serif" fill="#ccc" text-anchor="middle">专业会展服务 · 创意无限</text>
    </svg>`;
    fs.writeFileSync(bannerPath, svgBanner);
    console.log('  ✅ 创建示例 banner.jpg');
  }
}

function createTeamPageIfNeeded() {
  if (!fs.existsSync(TEAM_DIR)) {
    fs.mkdirSync(TEAM_DIR, { recursive: true });
    const teamMembers = [
      { name: '陈思远', role: '创意总监', desc: '15年会展策划经验，曾服务上百家国际品牌' },
      { name: '李美琳', role: '设计主管', desc: '红点设计奖得主，擅长空间叙事与沉浸体验' },
      { name: '王知行', role: '技术顾问', desc: '互动多媒体专家，打造科技与艺术的桥梁' },
      { name: '赵雅欣', role: '运营经理', desc: '精细化流程管理，确保每个环节完美呈现' }
    ];
    for (let i = 0; i < teamMembers.length; i++) {
      const m = teamMembers[i];
      const avatarColor = getRandomColor();
      const svgAvatar = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
        <circle cx="100" cy="100" r="100" fill="${avatarColor}"/>
        <text x="100" y="110" font-size="70" font-family="Arial" fill="white" text-anchor="middle" dominant-baseline="middle">${m.name[0]}</text>
      </svg>`;
      fs.writeFileSync(path.join(TEAM_DIR, `avatar_${i+1}.svg`), svgAvatar);
    }
    console.log('👥 已创建团队页面示例图片');
  }
}

function getHeader(navActive = 'home') {
  return `<header>
  <div class="logo">艺展天下</div>
  <nav>
    <a href="/" class="${navActive === 'home' ? 'active' : ''}">Home</a>
    <a href="/#cases" class="${navActive === 'case' ? 'active' : ''}">Case</a>
    <a href="/team/" class="${navActive === 'about' ? 'active' : ''}">About</a>
  </nav>
</header>`;
}

function getFooter() {
  return `<footer>
  <p>${COPYRIGHT}</p>
</footer>`;
}

function getGlobalStyle() {
  return `/* 艺展天下 - 纯白扁平风格（卡片整体放大 + 菜单底色） */
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #ffffff; color: #1a1a1a; line-height: 1.5; }
.container { max-width: 1400px; margin: 0 auto; padding: 0 24px; }
header { display: flex; justify-content: space-between; align-items: center; padding: 20px 32px; background-color: #ffffff; }
.logo { font-size: 1.5rem; font-weight: 600; letter-spacing: 1px; color: #111; }
nav { display: flex; gap: 32px; }
nav a {
  text-decoration: none;
  color: #555;
  font-weight: 500;
  font-size: 1rem;
  padding: 6px 12px;
  border-radius: 30px;
  transition: background-color 0.2s, color 0.2s;
}
nav a:hover {
  background-color: #f0f0f0;
  color: #000;
}
nav a.active {
  color: #000;
  border-bottom: 2px solid #000;
  border-radius: 0;
  background-color: transparent;
}
.banner { width: 100%; background-color: #f5f5f5; display: block; }
.banner img { width: 100%; height: auto; display: block; object-fit: cover; max-height: 400px; }
.section { padding: 64px 0; }
.section-title { font-size: 2rem; font-weight: 600; margin-bottom: 48px; text-align: center; color: #111; }
.case-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 32px; }
.case-card {
  background-color: #ffffff;
  text-decoration: none;
  color: inherit;
  display: block;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 8px;  /* 可选，增加圆角更美观 */
  overflow: hidden;    /* 保证放大时不会超出网格边界 */
}
.case-card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  z-index: 1;          /* 确保放大后在其他卡片之上 */
}
.case-thumb {
  aspect-ratio: 4 / 3;
  width: 100%;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  /* 移除 overflow: hidden，避免裁剪 */
  overflow: visible;
}
.case-thumb img, .case-thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  /* 移除图片单独的过渡和缩放 */
}
.case-info { padding: 20px 0 0 0; }
.case-title { font-size: 1.2rem; font-weight: 500; color: #222; transition: color 0.2s; }
.case-card:hover .case-title { color: #000; }
.team-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 40px; margin-top: 24px; }
.team-card { text-align: center; background-color: #ffffff; padding: 24px; }
.team-avatar { width: 140px; height: 140px; border-radius: 50%; margin: 0 auto 20px; overflow: hidden; background-color: #f5f5f5; }
.team-avatar img { width: 100%; height: 100%; object-fit: cover; }
.team-name { font-size: 1.25rem; font-weight: 600; margin-bottom: 6px; color: #111; }
.team-role { color: #777; font-size: 0.85rem; margin-bottom: 12px; }
.team-desc { font-size: 0.9rem; color: #555; }
footer { text-align: center; padding: 32px 24px; background-color: #fafafa; color: #888; font-size: 0.85rem; }
@media (max-width: 768px) {
  .container { padding: 0 16px; }
  .section { padding: 48px 0; }
  .section-title { font-size: 1.75rem; }
  header { flex-direction: column; gap: 12px; padding: 16px; }
  nav { gap: 24px; }
  nav a { padding: 4px 8px; }
  .case-card:hover { transform: scale(1.01); }  /* 手机上轻微放大 */
}
@media (max-width: 480px) {
  .case-grid, .team-grid { grid-template-columns: 1fr; }
}`;
}

function generateHomePage(casesData) {
  const casesHtml = casesData.map(c => {
    let coverHtml = '';
    if (c.coverFile) {
      const coverPath = `/case/${c.folderName}/${c.coverFile}`;
      const isVideo = isVideoFile(c.coverFile);
      coverHtml = isVideo ?
        `<video src="${coverPath}" muted playsinline></video>` :
        `<img src="${coverPath}" alt="${c.title}" loading="lazy">`;
    } else {
      coverHtml = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#f0f0f0;color:#999;">暂无预览</div>`;
    }
    return `<a href="/case/${c.folderName}/" class="case-card">
  <div class="case-thumb">${coverHtml}</div>
  <div class="case-info"><div class="case-title">${c.title}</div></div>
</a>`;
  }).join('');

  const teamMembersExist = fs.existsSync(TEAM_DIR) && fs.readdirSync(TEAM_DIR).some(f => f.startsWith('avatar_'));
  const teamHtml = teamMembersExist ? `
  <div class="team-grid">
    <div class="team-card"><div class="team-avatar"><img src="/team/avatar_1.svg" alt="陈思远"></div><div class="team-name">陈思远</div><div class="team-role">创意总监</div><div class="team-desc">15年会展策划经验，曾服务上百家国际品牌</div></div>
    <div class="team-card"><div class="team-avatar"><img src="/team/avatar_2.svg" alt="李美琳"></div><div class="team-name">李美琳</div><div class="team-role">设计主管</div><div class="team-desc">红点设计奖得主，擅长空间叙事与沉浸体验</div></div>
    <div class="team-card"><div class="team-avatar"><img src="/team/avatar_3.svg" alt="王知行"></div><div class="team-name">王知行</div><div class="team-role">技术顾问</div><div class="team-desc">互动多媒体专家，打造科技与艺术的桥梁</div></div>
    <div class="team-card"><div class="team-avatar"><img src="/team/avatar_4.svg" alt="赵雅欣"></div><div class="team-name">赵雅欣</div><div class="team-role">运营经理</div><div class="team-desc">精细化流程管理，确保每个环节完美呈现</div></div>
  </div>` : `<p style="text-align:center; color:#888;">团队风采即将呈现</p>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><title>艺展天下 | 专业会展服务</title><link rel="stylesheet" href="/style.css"></head>
<body>${getHeader('home')}<div class="banner"><img src="/${BANNER_FILE}" alt="艺展天下 banner"></div><main><section id="cases" class="section"><div class="container"><h2 class="section-title">Our Work</h2><div class="case-grid">${casesHtml || '<p style="text-align:center; width:100%;">暂无案例，请添加 case 目录下的子文件夹及媒体文件</p>'}</div></div></section><section id="team" class="section" style="background-color: #ffffff;"><div class="container"><h2 class="section-title">核心团队</h2>${teamHtml}</div></section></main>${getFooter()}</body></html>`;
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function getFilesInFolder(folderPath) {
  if (!fs.existsSync(folderPath)) return [];
  const items = fs.readdirSync(folderPath);
  const files = [];
  for (const item of items) {
    const fullPath = path.join(folderPath, item);
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && item !== 'index.html' && item !== 'index-sm.txt' && !item.startsWith('.')) {
      const ext = path.extname(item).toLowerCase();
      let type = 'other';
      if (IMG_EXT.includes(ext)) type = 'image';
      else if (VIDEO_EXT.includes(ext)) type = 'video';
      else type = 'file';
      files.push({ name: item, size: stat.size, type: type });
    }
  }
  return files;
}

// ========== 核心：将整个【展示图】区域作为整体处理 ==========
function parseShowcaseLayout(txtContent, filesInFolder) {
  // 提取 【展示图】 和 [keys] 之间的全部内容（保留换行）
  const match = txtContent.match(/【展示图】\s*([\s\S]*?)\s*\[keys\]/);
  if (!match) return [];
  const rawBlock = match[1];
  
  // 将内容按行拆分，但需要识别媒体行（包含图片/视频扩展名且不以 < 开头避免误判标签）
  const lines = rawBlock.split(/\r?\n/);
  
  const rows = [];
  const fileMap = new Map();
  filesInFolder.forEach(file => {
    fileMap.set(file.name.toLowerCase(), file);
    const baseName = path.basename(file.name, path.extname(file.name)).toLowerCase();
    if (!fileMap.has(baseName)) fileMap.set(baseName, file);
  });

  function isMediaFile(fileName) {
    const ext = path.extname(fileName).toLowerCase();
    return IMG_EXT.includes(ext) || VIDEO_EXT.includes(ext);
  }

  let currentTextLines = [];
  
  for (let line of lines) {
    line = line.trim();
    if (line === '') {
      // 保留空行作为文本块的一部分（空行会转为 <br>）
      currentTextLines.push('');
      continue;
    }
    
    // 判断是否为媒体行：包含媒体扩展名，且不是以 < 开头（避免把 <中> 这类误判为媒体）
    const isMedia = containsMediaExtension(line) && !line.startsWith('<');
    
    if (isMedia) {
      // 先 flush 文本块
      if (currentTextLines.length > 0) {
        const textBlock = currentTextLines.join('\n');
        rows.push({ type: 'text', content: textBlock });
        currentTextLines = [];
      }
      // 处理媒体行
      let rawLine = line.replace(/\/\/.*$/, '').trim();
      let aspectRatio = null;
      const ratioMatch = rawLine.match(/<(\d+):(\d+)>$/);
      if (ratioMatch) {
        aspectRatio = `${ratioMatch[1]}:${ratioMatch[2]}`;
        rawLine = rawLine.replace(/<\d+:\d+>$/, '').trim();
      }
      let items = rawLine.split(/[,，]/).map(s => s.trim()).filter(s => s !== '');
      if (items.length === 0) continue;
      
      const allSlash = items.every(item => item.endsWith('/'));
      const hasSlash = items.some(item => item.endsWith('/'));
      let rowType = 'media';
      if (allSlash) rowType = 'file';
      else if (hasSlash) {
        const slashCount = items.filter(item => item.endsWith('/')).length;
        rowType = slashCount > items.length / 2 ? 'file' : 'media';
      }
      const cleanItems = items.map(item => item.endsWith('/') ? item.slice(0, -1) : item);
      const matchedItems = [];
      for (const name of cleanItems) {
        let file = fileMap.get(name.toLowerCase());
        if (!file) file = filesInFolder.find(f => f.name.toLowerCase() === name.toLowerCase());
        if (file) matchedItems.push({ file: file, fileName: name });
        else console.warn(`  警告: 未找到文件: ${name}`);
      }
      if (matchedItems.length === 0) continue;
      
      if (rowType === 'file') {
        rows.push({ type: 'file', items: matchedItems });
      } else {
        const mediaItems = matchedItems.filter(item => isMediaFile(item.file.name));
        if (mediaItems.length > 0) rows.push({ type: 'media', items: mediaItems, aspectRatio: aspectRatio });
        const nonMediaItems = matchedItems.filter(item => !isMediaFile(item.file.name));
        if (nonMediaItems.length > 0) rows.push({ type: 'file', items: nonMediaItems });
      }
    } else {
      // 非媒体行：加入文本块
      currentTextLines.push(line);
    }
  }
  // 最后的文本块
  if (currentTextLines.length > 0) {
    const textBlock = currentTextLines.join('\n');
    rows.push({ type: 'text', content: textBlock });
  }
  return rows;
}

function containsMediaExtension(str) {
  return /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm|ogg|svg)\b/i.test(str);
}

// 处理文本块，将 <中>...</中/> 转为 <span class="text-center">，并处理 <空> <行/>
function processTextBlockWithTags(block) {
  // 1. 先将整个块中的 <中>...</中/> 替换（跨行）
  let processed = block;
  let prev;
  do {
    prev = processed;
    processed = processed.replace(/<中>([\s\S]*?)<中\/>/g, (match, content) => {
      // 对内部内容处理 <空> 和 <行/>，以及普通换行转 <br>
      let inner = content;
      inner = inner.replace(/<空>/g, ' ');
      inner = inner.replace(/<行\/?>/g, '<br>');
      inner = inner.replace(/\n/g, '<br>');
      return `<span class="text-center">${inner}</span>`;
    });
  } while (processed !== prev);
  
  // 2. 处理剩余的 <空> 和 <行/>
  processed = processed.replace(/<空>/g, ' ');
  processed = processed.replace(/<行\/?>/g, '<br>');
  
  // 3. 转义其余 HTML 字符，但保护已生成的 <span> 和 <br>
  // 保护 span 和 br
  const spans = [];
  processed = processed.replace(/<span class="text-center">(.*?)<\/span>/gs, (match, inner) => {
    spans.push(`<span class="text-center">${inner}</span>`);
    return `___SPAN_${spans.length-1}___`;
  });
  const brs = [];
  processed = processed.replace(/<br>/g, () => {
    brs.push('<br>');
    return `___BR_${brs.length-1}___`;
  });
  // 转义 & < >
  processed = processed.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // 恢复 <br>
  brs.forEach((br, idx) => {
    processed = processed.replace(`___BR_${idx}___`, br);
  });
  // 恢复 span
  spans.forEach((span, idx) => {
    processed = processed.replace(`___SPAN_${idx}___`, span);
  });
  
  return processed;
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function renderShowcaseArea(rows) {
  if (rows.length === 0) return '';
  let html = '<div class="showcase-dynamic-area">';
  for (const row of rows) {
    if (row.type === 'text') {
      const processed = processTextBlockWithTags(row.content);
      html += `<div class="dynamic-row text-row"><div class="text-content">${processed}</div></div>`;
    } else if (row.type === 'media') {
      const itemCount = row.items.length;
      let colClass = '';
      if (itemCount === 1) colClass = 'single-col';
      else if (itemCount === 2) colClass = 'two-col';
      else colClass = 'three-col';
      let ratioClass = '';
      if (row.aspectRatio) ratioClass = ` aspect-ratio-${row.aspectRatio.replace(':', '-')}`;
      html += `<div class="dynamic-row ${colClass}${ratioClass}">`;
      for (const item of row.items) {
        const file = item.file;
        html += `<div class="dynamic-item"><div class="dynamic-media-container">`;
        if (file.type === 'image') html += `<img src="./${encodeURIComponent(file.name)}" alt="" loading="lazy">`;
        else if (file.type === 'video') html += `<video src="./${encodeURIComponent(file.name)}" controls></video>`;
        html += `</div></div>`;
      }
      html += `</div>`;
    } else if (row.type === 'file') {
      const itemCount = row.items.length;
      let colClass = '';
      if (itemCount === 1) colClass = 'single-col';
      else if (itemCount === 2) colClass = 'two-col';
      else colClass = 'three-col';
      html += `<div class="dynamic-row file-row ${colClass}">`;
      for (const item of row.items) {
        const file = item.file;
        const fileSize = file.size ? formatFileSize(file.size) : '';
        html += `<div class="dynamic-file-item">
          <div class="dynamic-file-name"><span>${escapeHtml(file.name)}</span><span class="file-size">${fileSize}</span></div>
          <a href="./${encodeURIComponent(file.name)}" class="dynamic-download-button" download>下载</a>
        </div>`;
      }
      html += `</div>`;
    }
  }
  html += '</div>';
  return html;
}

function renderRemainingFilesArea(filesNotInShowcase) {
  const nonMedia = filesNotInShowcase.filter(f => f.type !== 'image' && f.type !== 'video');
  if (nonMedia.length === 0) return '';
  let html = `<div class="text-files-container"><h3>文件下载</h3><div class="text-grid">`;
  for (const file of nonMedia) {
    const fileSize = file.size ? formatFileSize(file.size) : '';
    html += `<div class="text-file-item-container">
      <div class="text-file-name"><span>${escapeHtml(file.name)}</span><span class="file-size">${fileSize}</span></div>
      <a href="./${encodeURIComponent(file.name)}" class="download-button" download>下载</a>
    </div>`;
  }
  html += `</div></div>`;
  return html;
}

function renderRemainingMediaGrid(filesNotInShowcase) {
  const media = filesNotInShowcase.filter(f => f.type === 'image' || f.type === 'video');
  if (media.length === 0) return '';
  let html = `<div class="media-grid-container"><h3>贴图/参考图</h3><div class="media-grid">`;
  for (const file of media) {
    html += `<div class="media-item">`;
    if (file.type === 'image') html += `<img src="./${encodeURIComponent(file.name)}" alt="" loading="lazy">`;
    else if (file.type === 'video') html += `<video src="./${encodeURIComponent(file.name)}" controls></video>`;
    html += `</div>`;
  }
  html += `</div></div>`;
  return html;
}

function generateCasePageFromSm(folderName, folderPath, filesInFolder) {
  const smPath = path.join(folderPath, 'index-sm.txt');
  let smContent = '';
  try {
    smContent = fs.readFileSync(smPath, 'utf-8');
  } catch (err) {
    console.log(`  ⚠️ 读取 ${smPath} 失败: ${err.message}`);
    return null;
  }

  let pageTitle = folderName.replace(/^case\d+_/, '').replace(/_/g, ' ');
  const titleMatch = smContent.match(/【标题】\s*\n([^\n]+)/);
  if (titleMatch) pageTitle = titleMatch[1].trim();

  const showcaseRows = parseShowcaseLayout(smContent, filesInFolder);
  const usedFileNames = new Set();
  for (const row of showcaseRows) {
    if (row.items) {
      for (const item of row.items) {
        if (item.file && item.file.name) usedFileNames.add(item.file.name);
      }
    }
  }
  const remainingFiles = filesInFolder.filter(f => !usedFileNames.has(f.name));
  const showcaseHtml = renderShowcaseArea(showcaseRows);
  const remainingFilesHtml = renderRemainingFilesArea(remainingFiles);
  const remainingMediaHtml = renderRemainingMediaGrid(remainingFiles);
  const mainContent = showcaseHtml + remainingFilesHtml + remainingMediaHtml;
  if (mainContent === '') return null;
  
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(pageTitle)} | 艺展天下案例</title>
  <link rel="stylesheet" href="/neirong-css.css">
  <style>
    body { margin: 0; padding: 0; background: #fff; }
    .case-detail { max-width: 1400px; margin: 0 auto; padding: 24px; }
    .back-link { display: block; text-align: center; margin-top: 40px; color: #555; text-decoration: none; }
    .back-link:hover { color: #000; }
    /* 关键修复：让居中块占满整行宽度 */
    .text-content { width: 100%; }
    .text-center {
      display: block;
      width: 100%;
      text-align: center;
    }
    .text-center br {
      display: block;
      content: "";
      margin: 0.5em 0;
    }
  </style>
</head>
<body>
  ${getHeader('case')}
  <div class="case-detail">
    <h1 style="text-align: center;">${escapeHtml(pageTitle)}</h1>
    ${mainContent}
    <a href="/" class="back-link">← 返回首页</a>
  </div>
  ${getFooter()}
</body>
</html>`;
}

function generateSimpleCasePage(folderName, mediaFiles, descText) {
  const mediaHtml = mediaFiles.map(file => {
    const filePath = `./${file}`;
    const isVideo = isVideoFile(file);
    return `<div class="media-item">
      ${isVideo ? `<video src="${filePath}" controls poster="${filePath}"></video>` : `<img src="${filePath}" alt="${file}" loading="lazy">`}
    </div>`;
  }).join('');
  const title = folderName.replace(/^case\d+_/, '').replace(/_/g, ' ');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title} | 艺展天下案例</title><link rel="stylesheet" href="/neirong-css.css"></head>
<body>${getHeader('case')}<div class="case-detail"><h1 style="text-align: center;">${title}</h1>${descText ? `<p style="margin-bottom:24px;color:#555;">${descText}</p>` : ''}<div class="case-media-grid">${mediaHtml || '<p>暂无媒体文件</p>'}</div><a href="/" class="back-link">← 返回首页</a></div>${getFooter()}</body></html>`;
}

function generateTeamPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>关于我们 | 艺展天下团队</title><link rel="stylesheet" href="/style.css"><style>.team-detail{max-width:1000px;margin:0 auto;padding:48px 24px;}.team-intro{text-align:center;margin-bottom:48px;}.team-intro p{font-size:1.1rem;color:#555;max-width:700px;margin:16px auto 0;}</style></head>
<body>${getHeader('about')}<div class="team-detail"><div class="team-intro"><h1>我们的团队</h1><p>专业、创新、极致 —— 艺展天下汇聚行业顶尖人才，为每一次展会注入灵魂。</p></div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:40px;">${['陈思远','李美琳','王知行','赵雅欣'].map((n,i)=>`<div style="text-align:center;background:#fff;padding:28px;"><div style="width:140px;height:140px;border-radius:50%;margin:0 auto 20px;overflow:hidden;background:#f0f0f0;"><img src="/team/avatar_${i+1}.svg" style="width:100%;height:100%;object-fit:cover;"></div><h3 style="font-size:1.25rem;">${n}</h3><p style="color:#888;margin:6px 0 12px;">${['创意总监','设计主管','技术顾问','运营经理'][i]}</p><p style="font-size:0.9rem;color:#555;">${['15年会展策划经验','红点设计奖得主','互动多媒体专家','精细化流程管理'][i]}</p></div>`).join('')}</div><div style="margin-top:64px;padding:32px;background:#f8f8f8;text-align:center;"><h3 style="margin-bottom:16px;">联系我们</h3><p>📧 yizhan@example.com &nbsp;&nbsp; 📞 400-882-6688</p><p style="margin-top:12px;font-size:0.85rem;">北京市朝阳区艺术园区88号艺展大厦</p></div></div>${getFooter()}</body></html>`;
}

async function build() {
  console.log('🚀 开始构建艺展天下静态网站...\n');
  createSampleCaseIfNeeded();
  createSampleBannerIfNeeded();
  createTeamPageIfNeeded();
  
  const caseFolders = getCaseFolders();
  const casesData = [];
  
  for (const folder of caseFolders) {
    const casePath = path.join(CASE_DIR, folder);
    const filesInFolder = getFilesInFolder(casePath);
    const coverFile = getCaseCover(folder);
    let descText = '';
    const descFile = path.join(casePath, 'description.txt');
    if (fs.existsSync(descFile)) descText = fs.readFileSync(descFile, 'utf-8').slice(0, 150);
    
    let caseHtml = generateCasePageFromSm(folder, casePath, filesInFolder);
    if (!caseHtml) {
      const mediaFiles = getMediaFiles(casePath);
      caseHtml = generateSimpleCasePage(folder, mediaFiles, descText);
      console.log(`  📄 生成案例页(默认): case/${folder}/index.html (${mediaFiles.length} 个媒体文件)`);
    } else {
      console.log(`  📄 生成案例页(基于sm): case/${folder}/index.html`);
    }
    fs.writeFileSync(path.join(casePath, 'index.html'), caseHtml);
    const title = folder.replace(/^case\d+_/, '').replace(/_/g, ' ');
    casesData.push({ folderName: folder, title: title, coverFile: coverFile });
  }
  
  const homeHtml = generateHomePage(casesData);
  fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), homeHtml);
  console.log(`\n🏠 生成首页 index.html (${casesData.length} 个案例)`);
  
  const teamHtml = generateTeamPage();
  fs.writeFileSync(path.join(TEAM_DIR, 'index.html'), teamHtml);
  console.log(`👥 生成团队页面 team/index.html`);
  
  fs.writeFileSync(OUTPUT_STYLE, getGlobalStyle());
  console.log(`🎨 生成样式文件 style.css`);
  
  const txtPath = path.join(ROOT_DIR, 'index-sm.txt');
  if (!fs.existsSync(txtPath)) {
    const txtContent = `【公司名称】\n艺展天下\n\n【横幅】\nbanner.jpg\n\n【案例】\n自动加载根目录下的case文件夹和子文件夹里的所有图片和视频，4比3的比例展示，铺满屏幕根据页面宽度动态调整每行展示数量，每个图片都能超链接到对应文件夹里的各自的html案例页\n\n【团队】\n这里用来介绍团队，有图有文字\n\n【底部版权】\n${COPYRIGHT}`;
    fs.writeFileSync(txtPath, txtContent);
    console.log(`📄 创建说明文件 index-sm.txt`);
  }
  
  console.log('\n✅ 构建完成！');
  console.log('📂 目录结构:');
  console.log('   ├── index.html (首页)');
  console.log('   ├── style.css (首页样式)');
  console.log('   ├── neirong-css.css (详情页样式，需手动放置)');
  console.log('   ├── banner.jpg');
  console.log('   ├── case/ (每个子目录包含独立案例页，可使用index-sm.txt自定义布局)');
  console.log('   ├── team/index.html');
  console.log('   └── index-sm.txt');
  console.log('\n🌐 可直接部署到 Cloudflare Pages 或任何静态服务器');
}

build().catch(err => {
  console.error('❌ 构建出错:', err);
  process.exit(1);
});