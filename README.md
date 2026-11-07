# knowledge-visual

知识可视化学习站：按 **学科 × 等级** 分类的互动可视化知识点合集。

## 目录结构

```
index.html                 学科总入口
├── math/                  📐 数学（198 个知识点）
│   ├── index.html         小学数学知识地图（124 个主题，topics/）
│   ├── topics/            小学各主题（每个主题一个目录）
│   ├── middle/            初中数学（27 页）
│   ├── high/              高中数学（18 页）
│   └── uni/               大学数学（27 页）
├── physics/               🔭 物理（55 个知识点）
│   ├── middle/            初中物理（18 页）
│   ├── high/              高中物理（16 页）
│   └── uni/               大学物理（19 页）
├── chemistry/             🧪 化学（46 个知识点）
│   ├── middle/            初中化学（13 页）
│   ├── high/              高中化学（14 页）
│   └── uni/               大学化学（17 页）
└── science/               🔬 小学科学（10 页）
```

- 每个等级目录含 `index.html` 导航页、若干 `<topic>.html` 内容页与 `assets/` 共享资源（common.css / common.js / animation.js / touch.js）。
- 初高中及大学内容页为深色自包含页面；小学内容为浅色儿童友好风格。
- 直接用浏览器打开 `index.html`，或用任意静态服务器托管即可。

> 内容合并自 `primary-math-visual` 项目（128 个内容页，按学科和等级重新分类）。
