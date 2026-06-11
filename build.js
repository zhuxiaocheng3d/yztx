// build.js - 非破坏性构建（保留已存在的CSS文件）
const fs = require('fs');
const path = require('path');

// ==================== 配置 ====================
const SITE_TITLE = '艺展天下';
const COPYRIGHT = `© 2025 艺展天下会展服务有限公司 版权所有  上海市嘉定区金沙江西路1069弄5号写字楼907`;
const LOGO_IMG = '艺展天下icon.png';          // 默认Logo文件名（根目录）
const CUSTOM_LOGO_FILENAME = '艺展天下icon2.png'; // 案例目录下可放置的自定义Logo文件名
const FAVICON = 'favicon.ico';

const ROOT_DIR = __dirname;
const CASE_DIR = path.join(ROOT_DIR, 'case');
const TEAM_DIR = path.join(ROOT_DIR, 'team');
const OUTPUT_STYLE = path.join(ROOT_DIR, 'style.css');
const OUTPUT_MOBILE_STYLE = path.join(ROOT_DIR, 'index-shouji.css');
const OUTPUT_DETAIL_CSS = path.join(ROOT_DIR, 'neirong-css.css');

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
  folders.sort((a, b) => {
    const numA = extractSortNumber(a);
    const numB = extractSortNumber(b);
    if (numA === null && numB === null) return a.localeCompare(b);
    if (numA === null) return 1;
    if (numB === null) return -1;
    return numA - numB;
  });
  return folders;
}

function extractSortNumber(folderName) {
  const match = folderName.match(/\((\d+)\)/);
  if (match) return parseInt(match[1], 10);
  return null;
}

function cleanFolderTitle(folderName) {
  let cleaned = folderName;
  cleaned = cleaned.replace(/\([^)]*\)/g, '');
  cleaned = cleaned.replace(/\b\d{6}\b/g, '');
  cleaned = cleaned.replace(/^\d+[\s\-_]+/, '');
  cleaned = cleaned.replace(/[\s\-_]+/g, ' ').trim();
  return cleaned || '未命名案例';
}

function getCaseCover(caseFolderName) {
  const casePath = path.join(CASE_DIR, caseFolderName);
  const mediaFiles = getMediaFiles(casePath);
  if (mediaFiles.length === 0) return null;
  const cleanName = cleanFolderTitle(caseFolderName);
  const lowerCleanName = cleanName.toLowerCase();
  const sameNameFile = mediaFiles.find(file => {
    const baseName = path.basename(file, path.extname(file)).toLowerCase();
    return baseName === lowerCleanName;
  });
  if (sameNameFile) return sameNameFile;
  const imgFile = mediaFiles.find(f => isImageFile(f));
  if (imgFile) return imgFile;
  return mediaFiles[0];
}

function getRandomColor() {
  const colors = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];
  return colors[Math.floor(Math.random() * colors.length)];
}

function extractDateFromFolderName(folderName) {
  const match = folderName.match(/(\d{6})/);
  if (!match) return null;
  const num = match[1];
  const year = 2000 + parseInt(num.slice(0, 2), 10);
  const month = parseInt(num.slice(2, 4), 10);
  const day = parseInt(num.slice(4, 6), 10);
  if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
    return `${year}.${month.toString().padStart(2, '0')}.${day.toString().padStart(2, '0')}`;
  }
  return null;
}

function extractTagFromFolderName(folderName) {
  const regex = /\(([^)]+)\)/g;
  let match;
  let tags = [];
  while ((match = regex.exec(folderName)) !== null) {
    const inner = match[1].trim();
    if (inner !== '' && !/^\d+$/.test(inner)) {
      tags.push(inner);
    }
  }
  if (tags.length === 0) return null;
  return tags[0];
}

function getCaseLabel(folderName) {
  const dateStr = extractDateFromFolderName(folderName);
  const tag = extractTagFromFolderName(folderName);
  if (!dateStr && !tag) return null;
  if (dateStr && tag) return `${dateStr} ${tag}`;
  if (dateStr) return dateStr;
  return tag;
}

function parseBannerFromIndexSm() {
  const indexPath = path.join(ROOT_DIR, 'index-sm.txt');
  if (!fs.existsSync(indexPath)) return null;
  const content = fs.readFileSync(indexPath, 'utf-8');
  const match = content.match(/【横幅】\s*([\s\S]*?)(?=\n【案例】|$)/);
  if (!match) return null;
  const bannerText = match[1].trim();
  const lines = bannerText.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return null;
  const chineseTitle = lines[0];
  const englishSub = lines[1] || '';
  const restLines = lines.slice(2);
  let smallText = '';
  if (restLines.length > 0) smallText = restLines.join(' ');
  return { chineseTitle, englishSub, smallText };
}

function parseTeamDescFromIndexSm() {
  const indexPath = path.join(ROOT_DIR, 'index-sm.txt');
  if (!fs.existsSync(indexPath)) return null;
  const content = fs.readFileSync(indexPath, 'utf-8');
  const match = content.match(/【团队】\s*[\s\S]*?About Team\s*\n([^\n]+)\n([\s\S]*?)(?=\n【底部版权】|$)/);
  if (!match) return null;
  const descLine = match[2] ? match[2].trim() : '';
  return descLine || '全球展览搭建服务商，专注展览十余年，联系我们，获得专属免费设计首稿和报价。';
}

function parseTeamDetailFromSm() {
  const teamSmPath = path.join(TEAM_DIR, 'index-sm.txt');
  if (!fs.existsSync(teamSmPath)) return null;
  const content = fs.readFileSync(teamSmPath, 'utf-8');
  const lines = content.split(/\r?\n/);
  let title = '我们的团队';
  let subTitle = '专业、创新、极致——艺展天下汇聚行业顶尖人才，为每一次展会注入灵魂。';
  const members = [];
  let contact = '';
  let i = 0;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i < lines.length) title = lines[i].trim();
  i++;
  while (i < lines.length && lines[i].trim() === '') i++;
  if (i < lines.length) subTitle = lines[i].trim();
  i++;
  while (i < lines.length) {
    let line = lines[i].trim();
    if (line === '') { i++; continue; }
    if (line.includes('联系我们')) {
      i++;
      const contactLines = [];
      while (i < lines.length) {
        const cl = lines[i].trim();
        if (cl !== '') contactLines.push(cl);
        i++;
      }
      contact = contactLines.join('<br>');
      break;
    }
    const name = line;
    i++;
    while (i < lines.length && lines[i].trim() === '') i++;
    if (i >= lines.length) break;
    const roleLine = lines[i].trim();
    let role = roleLine;
    let desc = '';
    if (roleLine.includes('|')) {
      const parts = roleLine.split('|');
      role = parts[0].trim();
      desc = parts[1].trim();
    }
    members.push({ name, role, desc });
    i++;
  }
  return { title, subTitle, members, contact };
}

function generateTeamPageFromSm() {
  const teamData = parseTeamDetailFromSm();
  if (!teamData) return generateDefaultTeamPage();
  const { title, subTitle, members, contact } = teamData;
  const membersHtml = members.map((m, idx) => {
    const initial = m.name.charAt(0);
    const bgColor = getRandomColor();
    const avatarSvg = `<svg width="140" height="140" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
      <circle cx="70" cy="70" r="70" fill="${bgColor}"/>
      <text x="70" y="95" font-size="60" font-family="Arial" fill="white" text-anchor="middle">${initial}</text>
    </svg>`;
    return `<div class="team-card-detail">
      <div class="team-avatar-detail"><img src="data:image/svg+xml;utf8,${encodeURIComponent(avatarSvg)}" alt="${m.name}"></div>
      <div class="team-name-detail">${escapeHtml(m.name)}</div>
      <div class="team-role-detail">${escapeHtml(m.role)}</div>
      <div class="team-desc-detail">${escapeHtml(m.desc)}</div>
    </div>`;
  }).join('');
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>关于我们 | ${escapeHtml(title)}</title><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/x-icon" href="/${FAVICON}"><style>
.team-detail-page { max-width: 1200px; margin: 0 auto; padding: 48px 24px; }
.team-header { text-align: center; margin-bottom: 48px; }
.team-header h1 { font-size: 2.2rem; font-weight: 600; margin-bottom: 16px; }
.team-header p { font-size: 1.1rem; color: #555; max-width: 700px; margin: 0 auto; }
.team-grid-detail { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 40px; margin-bottom: 60px; }
.team-card-detail { text-align: center; background: transparent; padding: 28px 20px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); transition: transform 0.2s; }
.team-card-detail:hover { transform: translateY(-5px); }
.team-avatar-detail { width: 120px; height: 120px; margin: 0 auto 20px; border-radius: 50%; overflow: hidden; background: #f5f5f5; display: flex; align-items: center; justify-content: center; }
.team-avatar-detail img { width: 100%; height: 100%; object-fit: cover; }
.team-name-detail { font-size: 1.25rem; font-weight: 600; margin-bottom: 6px; }
.team-role-detail { color: #888; font-size: 0.85rem; margin-bottom: 10px; }
.team-desc-detail { font-size: 0.9rem; color: #555; }
.contact-section { background: transparent; padding: 40px; text-align: center; border-radius: 16px; margin-top: 20px; }
.contact-section h3 { font-size: 1.5rem; margin-bottom: 20px; }
.contact-section p { font-size: 1rem; line-height: 1.6; }
@media (max-width: 640px) { .team-grid-detail { gap: 24px; } }
</style></head>
<body>${getHeader('about', null)}<div class="team-detail-page"><div class="team-header"><h1>${escapeHtml(title)}</h1><p>${escapeHtml(subTitle)}</p></div><div class="team-grid-detail">${membersHtml}</div><div class="contact-section"><h3>联系我们</h3><p>${contact.replace(/\n/g, '<br>')}</p></div></div>${getFooter()}</body></html>`;
}

function generateDefaultTeamPage() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>关于我们 | 艺展天下团队</title><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/x-icon" href="/${FAVICON}"><style>.team-detail{max-width:1000px;margin:0 auto;padding:48px 24px;}</style></head>
<body>${getHeader('about', null)}<div class="team-detail"><h1 style="text-align:center">我们的团队</h1><p style="text-align:center">专业、创新、极致 —— 艺展天下汇聚行业顶尖人才。</p><div style="margin-top:48px;text-align:center"><p>📧 yizhan@example.com &nbsp; 📞 400-882-6688</p></div></div>${getFooter()}</body></html>`;
}

// 支持自定义Logo路径 (logoUrl 为图片路径，可为绝对路径或相对路径)
function getHeader(navActive = 'home', logoUrl = null) {
  const finalLogo = logoUrl ? logoUrl : `/${LOGO_IMG}`;
  return `<header>
  <div class="logo"><a href="/"><img src="${finalLogo}" alt="艺展天下"></a></div>
  <nav>
    <a href="/" class="${navActive === 'home' ? 'active' : ''}">Home</a>
    <a href="/#cases" class="${navActive === 'case' ? 'active' : ''}">Case</a>
    <a href="/team/" class="${navActive === 'about' ? 'active' : ''}">About</a>
  </nav>
</header>`;
}

function getFooter() {
  return `<footer><p>${COPYRIGHT}</p></footer>`;
}

function getDefaultStyle() {
  return `/* 艺展天下 - 统一背景色，所有容器透明 */
* { margin:0; padding:0; box-sizing:border-box; }
body { 
  font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; 
  background-color: #ffffff;  /* 在此修改全局背景色，透明PNG将透出此颜色 */
  color: #1a1a1a; 
  line-height: 1.5; 
}
.container { max-width: 1400px; margin: 0 auto; padding: 0 24px; }
header { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  padding: 20px 32px; 
  background-color: transparent;
}
.logo a { display: inline-flex; align-items: center; text-decoration: none; }
.logo img { height: 44px; width: auto; vertical-align: middle; display: block; }
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
nav a:hover { background-color: rgba(0,0,0,0.05); color: #000; }
nav a.active { color: #000; border-bottom: 2px solid #000; border-radius: 0; background-color: transparent; }
.text-banner { background-color: transparent; padding: 60px 24px; text-align: center; }
.banner-chinese { font-size: 2.5rem; font-weight: 700; color: #111; margin-bottom: 16px; letter-spacing: 2px; }
.banner-english-medium { font-size: 1.5rem; font-weight: 500; color: #333; margin-bottom: 24px; }
.banner-small-text { font-size: 0.75rem; color: #666; max-width: 800px; margin: 0 auto; line-height: 1.6; }
.section { padding: 64px 0; }
.section-title { font-size: 2rem; font-weight: 600; margin-bottom: 48px; text-align: center; color: #111; }
.case-grid { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
  gap: 48px 32px;
}
.case-card {
  background-color: transparent;
  text-decoration: none;
  color: inherit;
  display: block;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  border-radius: 0;
  overflow: visible;
}
.case-card:hover {
  transform: scale(1.02);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
  z-index: 1;
}
.case-thumb {
  position: relative;
  aspect-ratio: 4 / 3;
  width: 100%;
  background-color: transparent;  /* 透明，让透明PNG透出body背景 */
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.case-label {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(2px);
  color: #fff;
  font-size: 0.9rem;
  padding: 5px 12px;
  border-radius: 2px;
  z-index: 5;
  pointer-events: none;
  white-space: nowrap;
  font-weight: normal;
  letter-spacing: 0.5px;
  line-height: 1.3;
}
.case-thumb img, .case-thumb video {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  border-radius: 0;
}
.case-info { padding: 4px 0 0 0; }
.case-title { font-size: 1.2rem; font-weight: 500; color: #222; margin: 0; }
.case-card:hover .case-title { color: #000; }
.team-home { text-align: center; max-width: 700px; margin: 0 auto; }
.team-desc-home { font-size: 1rem; color: #555; margin-bottom: 24px; }
.btn-contact { display: inline-block; background: #000; color: #fff; padding: 12px 28px; border-radius: 40px; text-decoration: none; font-weight: 500; transition: background 0.2s; }
.btn-contact:hover { background: #333; }
footer { text-align: center; padding: 32px 24px; background-color: transparent; color: #888; font-size: 0.85rem; }

@media (max-width: 768px) {
  .container { padding: 0 16px; }
  .section { padding: 48px 0; }
  .section-title { font-size: 1.75rem; }
  header { flex-direction: column; gap: 12px; padding: 16px; }
  nav { gap: 24px; }
  .logo img { height: 36px; }
  .banner-chinese { font-size: 1.8rem; }
  .banner-english-medium { font-size: 1.2rem; }
  .case-grid { gap: 32px 16px; }
  .case-info { padding-top: 4px; }
  .case-label {
    top: 6px;
    right: 6px;
    font-size: 0.8rem;
    padding: 4px 10px;
    white-space: nowrap;
  }
}
@media (max-width: 480px) {
  .case-grid { grid-template-columns: 1fr; gap: 32px; }
  .case-label {
    white-space: nowrap;
    font-size: 0.75rem;
    padding: 3px 9px;
  }
}`;
}

function getDefaultMobileStyle() {
  return `/* 手机设备专用样式 - 默认（可自由修改，不会被构建覆盖） */
@media (max-width: 768px) {
  .case-grid {
    grid-template-columns: repeat(2, 1fr) !important;
    gap: 32px 12px !important;
  }
  .case-title {
    font-size: 0.85rem !important;
  }
  .section {
    padding: 32px 0 !important;
  }
  .container {
    padding: 0 12px !important;
  }
  .case-info {
    padding-top: 4px !important;
  }
}`;
}

// 确保 neirong-css.css 包含移动端三列图片样式及Lightbox基础样式
function ensureDetailCssMobileThreeCols() {
  if (!fs.existsSync(OUTPUT_DETAIL_CSS)) return;
  let css = fs.readFileSync(OUTPUT_DETAIL_CSS, 'utf-8');
  const mobileThreeColsRule = `
/* 手机端 Creative elements 区域三列布局 & Lightbox 样式（自动维护） */
@media (max-width: 768px) {
  .media-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 12px !important;
  }
  /* 确保图片容器在小屏下不会过挤 */
  .media-item img, .media-item video {
    width: 100%;
    height: auto;
    object-fit: cover;
    aspect-ratio: 1 / 1;
  }
}
/* 全局 Lightbox 遮罩层 */
.lightbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.3s ease;
}
.lightbox-overlay.active {
  opacity: 1;
}
.lightbox-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  box-shadow: 0 0 20px rgba(0,0,0,0.5);
}
`;
  // 如果CSS中没有三列规则，则追加
  if (!css.includes('grid-template-columns: repeat(3, 1fr) !important;')) {
    css += mobileThreeColsRule;
    fs.writeFileSync(OUTPUT_DETAIL_CSS, css);
    console.log('🎨 已更新 neirong-css.css：添加移动端三列图片布局及Lightbox样式');
  }
}

function generateHomePage(casesData) {
  const casesHtml = casesData.map(c => {
    let coverHtml = '';
    if (c.coverFile) {
      const coverPath = `/case/${c.folderName}/${c.coverFile}`;
      const isVideo = isVideoFile(c.coverFile);
      coverHtml = isVideo ? `<video src="${coverPath}" muted playsinline></video>` : `<img src="${coverPath}" alt="${c.title}" loading="lazy">`;
    } else {
      coverHtml = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:transparent;color:#999;">暂无预览</div>`;
    }
    const labelHtml = c.label ? `<div class="case-label">${escapeHtml(c.label)}</div>` : '';
    return `<a href="/case/${c.folderName}/" class="case-card"><div class="case-thumb">${coverHtml}${labelHtml}</div><div class="case-info"><div class="case-title">${c.title}</div></div></a>`;
  }).join('');

  const bannerData = parseBannerFromIndexSm();
  let bannerHtml = '';
  if (bannerData) {
    bannerHtml = `<div class="text-banner">
      <div class="banner-chinese">${escapeHtml(bannerData.chineseTitle)}</div>
      <div class="banner-english-medium">${escapeHtml(bannerData.englishSub)}</div>
      <div class="banner-small-text">${escapeHtml(bannerData.smallText)}</div>
    </div>`;
  } else {
    bannerHtml = `<div class="text-banner"><div class="banner-chinese">艺展天下</div><div class="banner-english-medium">Professional Exhibition Services</div></div>`;
  }

  const teamDesc = parseTeamDescFromIndexSm() || '全球展览搭建服务商，专注展览十余年，联系我们，获得专属免费设计首稿和报价。';
  const teamHtml = `<div class="team-home"><div class="team-desc-home">${escapeHtml(teamDesc)}</div><a href="/team/" class="btn-contact">联系我们 →</a></div>`;

  const deviceCheckScript = `<script>
(function() {
  function isMobileDevice() {
    var ua = navigator.userAgent.toLowerCase();
    var mobileKeywords = ['android', 'webos', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone', 'mobile', 'opera mini', 'iemobile', 'tablet'];
    var isMobileUA = mobileKeywords.some(function(keyword) { return ua.indexOf(keyword) !== -1; });
    var platform = navigator.platform.toLowerCase();
    var mobilePlatforms = ['iphone', 'ipad', 'ipod', 'android'];
    var isMobilePlatform = mobilePlatforms.some(function(p) { return platform.indexOf(p) !== -1; });
    var hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (isMobileUA || isMobilePlatform) return true;
    if (hasTouch && window.innerWidth <= 768) return true;
    return false;
  }
  if (isMobileDevice()) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/index-shouji.css';
    document.head.appendChild(link);
    document.documentElement.classList.add('mobile-device');
  }
})();
<\/script>`;

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"><title>艺展天下 | 专业会展服务</title><link rel="stylesheet" href="/style.css"><link rel="icon" type="image/x-icon" href="/${FAVICON}">${deviceCheckScript}</head>
<body>${getHeader('home', null)}${bannerHtml}<main><section id="cases" class="section"><div class="container"><div class="case-grid">${casesHtml || '<p style="text-align:center; width:100%;">暂无案例，请添加 case 目录下的子文件夹及媒体文件</p>'}</div></div></section><section id="team" class="section" style="background-color: transparent;"><div class="container"><h2 class="section-title">About Team</h2>${teamHtml}</div></section></main>${getFooter()}</body></html>`;
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

function containsMediaExtension(str) {
  return /\.(jpg|jpeg|png|gif|webp|mp4|mov|webm|ogg|svg)\b/i.test(str);
}

function processTextBlockWithTags(block) {
  let processed = block;
  let prev;
  do {
    prev = processed;
    processed = processed.replace(/<中>([\s\S]*?)<中\/>/g, (match, content) => {
      let inner = content;
      inner = inner.replace(/<空>/g, ' ');
      inner = inner.replace(/<行\/?>/g, '<br>');
      inner = inner.replace(/\n/g, '<br>');
      return `<span class="text-center">${inner}</span>`;
    });
  } while (processed !== prev);
  processed = processed.replace(/<空>/g, ' ');
  processed = processed.replace(/<行\/?>/g, '<br>');
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
  processed = processed.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  brs.forEach((br, idx) => { processed = processed.replace(`___BR_${idx}___`, br); });
  spans.forEach((span, idx) => { processed = processed.replace(`___SPAN_${idx}___`, span); });
  return processed;
}

function escapeHtml(str) {
  return str.replace(/[&<>]/g, m => m === '&' ? '&amp;' : (m === '<' ? '&lt;' : '&gt;'));
}

function parseShowcaseLayout(txtContent, filesInFolder) {
  const match = txtContent.match(/【展示图】\s*([\s\S]*?)\s*\[keys\]/);
  if (!match) return [];
  const rawBlock = match[1];
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
    if (line === '') { currentTextLines.push(''); continue; }
    const isMedia = containsMediaExtension(line) && !line.startsWith('<');
    if (isMedia) {
      if (currentTextLines.length > 0) {
        rows.push({ type: 'text', content: currentTextLines.join('\n') });
        currentTextLines = [];
      }
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
      currentTextLines.push(line);
    }
  }
  if (currentTextLines.length > 0) rows.push({ type: 'text', content: currentTextLines.join('\n') });
  return rows;
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
  let html = `<div class="media-grid-container"><h3>Creative elements</h3><div class="media-grid" id="creativeGrid">`;
  for (const file of media) {
    html += `<div class="media-item">`;
    if (file.type === 'image') html += `<img src="./${encodeURIComponent(file.name)}" alt="" loading="lazy">`;
    else if (file.type === 'video') html += `<video src="./${encodeURIComponent(file.name)}" controls></video>`;
    html += `</div>`;
  }
  html += `</div></div>`;
  return html;
}

// 生成详情页公用的Lightbox脚本
function getLightboxScript() {
  return `<script>
(function() {
  // 为 Creative elements 区域的所有图片添加点击放大功能
  function initLightbox() {
    const mediaGrid = document.getElementById('creativeGrid');
    if (!mediaGrid) return;
    const images = mediaGrid.querySelectorAll('.media-item img');
    if (images.length === 0) return;
    
    // 创建遮罩层
    const overlay = document.createElement('div');
    overlay.className = 'lightbox-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:10000;cursor:pointer;opacity:0;transition:opacity 0.3s ease;pointer-events:none;';
    const imgElement = document.createElement('img');
    imgElement.className = 'lightbox-image';
    imgElement.style.cssText = 'max-width:90vw;max-height:90vh;object-fit:contain;';
    overlay.appendChild(imgElement);
    document.body.appendChild(overlay);
    
    function showLightbox(src) {
      imgElement.src = src;
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
    }
    function hideLightbox() {
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
      setTimeout(() => { imgElement.src = ''; }, 300);
    }
    overlay.addEventListener('click', hideLightbox);
    // 避免图片点击冒泡导致同时触发展示和隐藏
    images.forEach(img => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        showLightbox(img.src);
      });
    });
    // ESC键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.style.pointerEvents === 'auto') {
        hideLightbox();
      }
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
  } else {
    initLightbox();
  }
})();
<\/script>`;
}

function generateCasePageFromSm(folderName, folderPath, filesInFolder) {
  const smPath = path.join(folderPath, 'index-sm.txt');
  let smContent = '';
  try { smContent = fs.readFileSync(smPath, 'utf-8'); } catch (err) { return null; }
  let pageTitle = cleanFolderTitle(folderName);
  const titleMatch = smContent.match(/【标题】\s*\n([^\n]+)/);
  if (titleMatch) pageTitle = titleMatch[1].trim();
  const showcaseRows = parseShowcaseLayout(smContent, filesInFolder);
  const usedFileNames = new Set();
  for (const row of showcaseRows) {
    if (row.items) for (const item of row.items) if (item.file && item.file.name) usedFileNames.add(item.file.name);
  }
  const remainingFiles = filesInFolder.filter(f => !usedFileNames.has(f.name));
  const showcaseHtml = renderShowcaseArea(showcaseRows);
  const remainingFilesHtml = renderRemainingFilesArea(remainingFiles);
  const remainingMediaHtml = renderRemainingMediaGrid(remainingFiles);
  const mainContent = showcaseHtml + remainingFilesHtml + remainingMediaHtml;
  if (mainContent === '') return null;
  
  // 检测案例目录下是否有自定义Logo
  const customLogoPath = path.join(folderPath, CUSTOM_LOGO_FILENAME);
  const logoUrl = fs.existsSync(customLogoPath) ? `./${CUSTOM_LOGO_FILENAME}` : `/${LOGO_IMG}`;
  
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(pageTitle)} | 艺展天下案例</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/neirong-css.css"><link rel="stylesheet" href="./xiangqing.css"><link rel="icon" type="image/x-icon" href="/${FAVICON}"><style>body{margin:0;padding:0;background:transparent;}.case-detail{max-width:1400px;margin:0 auto;padding:24px;}.back-link{display:block;text-align:center;margin-top:40px;color:#555;text-decoration:none;}.back-link:hover{color:#000;}.text-content{width:100%;}.text-center{display:block;width:100%;text-align:center;}</style></head><body>${getHeader('case', logoUrl)}<div class="case-detail"><h1 style="text-align:center;">${escapeHtml(pageTitle)}</h1>${mainContent}<a href="/" class="back-link">← 返回首页</a></div>${getFooter()}${getLightboxScript()}</body></html>`;
}

function generateSimpleCasePage(folderName, mediaFiles, descText) {
  const mediaHtml = mediaFiles.map(file => {
    const filePath = `./${file}`;
    const isVideo = isVideoFile(file);
    return `<div class="media-item">${isVideo ? `<video src="${filePath}" controls poster="${filePath}"></video>` : `<img src="${filePath}" alt="${file}" loading="lazy">`}</div>`;
  }).join('');
  const title = cleanFolderTitle(folderName);
  const folderPath = path.join(CASE_DIR, folderName);
  const customLogoPath = path.join(folderPath, CUSTOM_LOGO_FILENAME);
  const logoUrl = fs.existsSync(customLogoPath) ? `./${CUSTOM_LOGO_FILENAME}` : `/${LOGO_IMG}`;
  
  return `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title} | 艺展天下案例</title><link rel="stylesheet" href="/style.css"><link rel="stylesheet" href="/neirong-css.css"><link rel="stylesheet" href="./xiangqing.css"><link rel="icon" type="image/x-icon" href="/${FAVICON}"><style>body{background:transparent;}</style></head><body>${getHeader('case', logoUrl)}<div class="case-detail"><h1 style="text-align:center;">${title}</h1>${descText ? `<p style="margin-bottom:24px;color:#555;">${descText}</p>` : ''}<div class="media-grid-container"><h3>Creative elements</h3><div class="media-grid" id="creativeGrid">${mediaHtml || '<p>暂无媒体文件</p>'}</div></div><a href="/" class="back-link">← 返回首页</a></div>${getFooter()}${getLightboxScript()}</body></html>`;
}

function createSampleCaseIfNeeded() {
  const caseFolders = getCaseFolders();
  if (caseFolders.length === 0) {
    console.log('📁 未检测到案例目录，正在创建示例案例...');
    const sampleCases = [
      { name: '(0) 科技未来展', desc: '沉浸式科技体验' },
      { name: '(1) 艺术元宇宙', desc: '数字艺术与虚拟现实' },
      { name: '(2) 绿色生态展', desc: '环保理念与创新设计' }
    ];
    for (let i = 0; i < sampleCases.length; i++) {
      const caseName = sampleCases[i].name;
      const casePath = path.join(CASE_DIR, caseName);
      if (!fs.existsSync(casePath)) {
        fs.mkdirSync(casePath, { recursive: true });
        const color = getRandomColor();
        const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="${color}"/><text x="400" y="300" font-size="40" fill="white" text-anchor="middle">${sampleCases[i].name.replace(/\(\d+\)\s*/, '')}</text></svg>`;
        fs.writeFileSync(path.join(casePath, 'cover.svg'), svgContent);
        fs.writeFileSync(path.join(casePath, 'description.txt'), sampleCases[i].desc);
        console.log(`  ✅ 创建案例: ${caseName}`);
      }
    }
  }
}

function createSampleTeamSmIfNeeded() {
  const teamSmPath = path.join(TEAM_DIR, 'index-sm.txt');
  if (!fs.existsSync(teamSmPath)) {
    if (!fs.existsSync(TEAM_DIR)) fs.mkdirSync(TEAM_DIR, { recursive: true });
    const defaultTeamContent = `我们的团队
专业、创新、极致——艺展天下汇聚行业顶尖人才，为每一次展会注入灵魂。

朱小橙
创意总监|10年策展经验

詹美英
运营经理|精细化流畅管理

关天知
施工技术|现场工艺把关

联系我们
180-3025-1013
上海市嘉定区金沙江西路1069弄5号写字楼907`;
    fs.writeFileSync(teamSmPath, defaultTeamContent);
    console.log('📝 创建团队描述文件 team/index-sm.txt');
  }
}

async function build() {
  console.log('🚀 开始构建艺展天下静态网站...\n');
  createSampleCaseIfNeeded();
  createSampleTeamSmIfNeeded();
  
  // 确保详情页CSS包含手机三列和Lightbox样式（仅在首次构建时更新，不破坏用户自定义）
  ensureDetailCssMobileThreeCols();
  
  const caseFolders = getCaseFolders();
  const casesData = [];
  // 性能提示：使用 for...of 处理大量案例时保持顺序，同步 I/O 在数百案例下仍可接受（约2-5秒）
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
      console.log(`  📄 生成案例页(默认): case/${folder}/index.html`);
    } else {
      console.log(`  📄 生成案例页(基于sm): case/${folder}/index.html`);
    }
    fs.writeFileSync(path.join(casePath, 'index.html'), caseHtml);
    const title = cleanFolderTitle(folder);
    const label = getCaseLabel(folder);
    casesData.push({ folderName: folder, title: title, coverFile: coverFile, label: label });
  }
  
  const homeHtml = generateHomePage(casesData);
  fs.writeFileSync(path.join(ROOT_DIR, 'index.html'), homeHtml);
  console.log(`\n🏠 生成首页 index.html (${casesData.length} 个案例) - 已移除 'Our Work' 标题`);
  
  const teamHtml = generateTeamPageFromSm();
  fs.writeFileSync(path.join(TEAM_DIR, 'index.html'), teamHtml);
  console.log(`👥 生成团队页面 team/index.html (基于 team/index-sm.txt)`);
  
  if (!fs.existsSync(OUTPUT_STYLE)) {
    fs.writeFileSync(OUTPUT_STYLE, getDefaultStyle());
    console.log(`🎨 创建默认样式文件 style.css (可自由修改，不会被覆盖)`);
  } else {
    console.log(`✅ 已存在 style.css，保留您的自定义样式`);
  }
  
  if (!fs.existsSync(OUTPUT_MOBILE_STYLE)) {
    fs.writeFileSync(OUTPUT_MOBILE_STYLE, getDefaultMobileStyle());
    console.log(`📱 创建默认手机样式文件 index-shouji.css (可自由修改，不会被覆盖)`);
  } else {
    console.log(`✅ 已存在 index-shouji.css，保留您的自定义样式`);
  }
  
  console.log('\n✅ 构建完成！');
  console.log('📂 目录结构:');
  console.log('   ├── index.html (首页)');
  console.log('   ├── style.css (可手动修改，构建时保留)');
  console.log('   ├── index-shouji.css (可手动修改，构建时保留)');
  console.log('   ├── neirong-css.css (已添加手机三列图片及Lightbox样式)');
  console.log('   ├── 艺展天下icon.png');
  console.log('   ├── favicon.ico');
  console.log('   ├── case/ (案例子目录，支持自定义 艺展天下icon2.png 切换Logo)');
  console.log('   ├── team/index.html');
  console.log('   └── index-sm.txt, team/index-sm.txt');
  console.log('\n🌐 可直接部署到任意静态服务器');
}

build().catch(err => { console.error('❌ 构建出错:', err); process.exit(1); });