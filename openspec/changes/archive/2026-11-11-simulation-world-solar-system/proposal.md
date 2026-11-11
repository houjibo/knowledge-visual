## Why

站点目前按学科组织知识主题，缺少用于探索完整、动态场景的独立入口。提供“模拟世界”分类，并以太阳系为首个三维体验，让学习者能旋转、缩放、改变模拟速度和参考中心，观察行星相对运动。

## What Changes

- 在首页和本地主题搜索中新增独立的“模拟世界”分类；它不属于学科或学段，也不伪造学习进度。
- 新增模拟世界目录和“太阳系模拟”主题，保留太阳、八大行星、地球月球、轨道、小行星带、公转速度、参考系切换和视角控制。
- 将页面依赖的 Three.js 固定版本脚本随站点发布，避免运行时依赖外部 CDN；改进键盘标签、窄屏控制、WebGL 不可用反馈和模型边界说明。
- 将新主题纳入页面库存、首页目录、静态检查、发布包及浏览器回归。

## Capabilities

### New Capabilities

- `simulation-world-browsing`: 提供不带学科阶段或学习进度含义的模拟世界分类与可探索模拟主题。

### Modified Capabilities

- `site-topic-discovery`: 首页目录支持无学段模拟主题，并按“模拟世界”过滤。
- `learning-page-inventory`: 将模拟世界目录识别为导航页、模拟页识别为无学段主题。
- `static-release-artifact`: 将模拟页面和随附的本地 Three.js 脚本纳入可从站点根路径及 GitHub Pages 子路径加载的发布包。

## Impact

- 影响 `index.html`、`assets/topic-catalog.js` 生成逻辑、`scripts/inventory_pages.py`、`scripts/check_site.py`、首页主题数量校验、发布构建/验证、`README.md`、架构/差距/路线图文档及浏览器测试。
- 太阳系模拟采用定性示意参数，不模拟真实引力、多体摄动、真实天体历表或按比例的天体尺寸/距离；页面须明确这一边界。
- 不新增服务端，不保存或上传模拟操作，不计入学习完成进度。
