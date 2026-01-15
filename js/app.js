import toolsConfig from './config.js';

const navList = document.getElementById('nav-list');
const toolTitle = document.getElementById('tool-title');
const toolContainer = document.getElementById('tool-container');
const sidebar = document.querySelector('.sidebar');
const sidebarToggle = document.getElementById('sidebar-toggle');

// 1. 初始化导航菜单
function initNav() {
    navList.innerHTML = '';

    toolsConfig.forEach(tool => {
        if (tool.children && tool.children.length > 0) {
            // 分组标题
            const groupTitle = document.createElement('div');
            groupTitle.style.cssText = 'padding: 12px 15px 5px 15px; font-size: 12px; color: #9ca3af; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px;';
            groupTitle.innerHTML = `${tool.icon} ${tool.name}`;
            navList.appendChild(groupTitle);

            // 子菜单
            tool.children.forEach(child => {
                const btn = createNavBtn(child, true);
                navList.appendChild(btn);
            });

        } else {
            // 顶级菜单
            const btn = createNavBtn(tool, false);
            navList.appendChild(btn);
        }
    });
}

// 封装：创建导航按钮 DOM
function createNavBtn(item, isChild) {
    const btn = document.createElement('div');
    btn.className = 'nav-item';

    // ✅ 关键修改：绑定 ID 和图标
    btn.dataset.id = item.id;
    btn.dataset.icon = item.icon || '•';

    if (isChild) {
        btn.style.paddingLeft = '30px';
        btn.style.fontSize = '13.5px';
        btn.textContent = item.name;
    } else {
        btn.innerHTML = `${item.icon || ''} ${item.name}`;
    }

    btn.onclick = () => loadTool(item, btn);
    return btn;
}

// 2. 加载工具逻辑
async function loadTool(tool, navItem) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if(navItem) navItem.classList.add('active');

    toolTitle.textContent = tool.name;
    toolContainer.innerHTML = '<div class="loading" style="text-align:center; margin-top:50px; color:#6b7280;">加载中...</div>';

    try {
        const module = await import(`./tools/${tool.file}`);
        toolContainer.innerHTML = module.render();
        if (module.init) {
            module.init();
        }
    } catch (e) {
        console.error(e);
        toolContainer.innerHTML = `<div style="color:red; text-align:center; margin-top:20px;">工具加载失败: ${e.message}</div>`;
    }
}

// 3. 侧边栏展开/收缩功能
function initSidebarToggle() {
    sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
    });
}

// 启动初始化
initNav();
initSidebarToggle();

// ✅ 关键修改：默认点击 JSON 工具
setTimeout(() => {
    const defaultBtn = document.querySelector('.nav-item[data-id="json"]');
    if (defaultBtn) defaultBtn.click();
}, 0);
