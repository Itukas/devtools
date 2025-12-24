import toolsConfig from './config.js';

const navList = document.getElementById('nav-list');
const toolTitle = document.getElementById('tool-title');
const toolContainer = document.getElementById('tool-container');

// 1. 初始化导航菜单
function initNav() {
    toolsConfig.forEach(tool => {
        const item = document.createElement('div');
        item.className = 'nav-item';
        item.textContent = `${tool.icon} ${tool.name}`;
        item.onclick = () => loadTool(tool, item);
        navList.appendChild(item);
    });
}

// 2. 加载工具逻辑
async function loadTool(tool, navItem) {
    // 高亮菜单
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    navItem.classList.add('active');

    // 设置标题
    toolTitle.textContent = tool.name;
    toolContainer.innerHTML = '<div class="loading">加载中...</div>';

    try {
        // 动态导入工具模块
        const module = await import(`./tools/${tool.file}`);

        // 渲染 HTML
        toolContainer.innerHTML = module.render();

        // 执行工具的初始化脚本 (绑定事件等)
        if (module.init) {
            module.init();
        }
    } catch (e) {
        console.error(e);
        toolContainer.innerHTML = `<div style="color:red">工具加载失败: ${e.message}</div>`;
    }
}

// 启动
initNav();