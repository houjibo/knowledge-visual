# high-chemistry-electrochemistry-tabs-accessibility Specification

## Purpose
确保高中化学电化学页面的四个主题入口可由键盘和辅助技术发现、切换与确认，同时保持内容面板、指针操作及窄屏布局的一致性，并方便不同设备的学习者访问。

## Requirements

### Requirement: 高中化学电化学主题页签可访问

电化学页面 MUST 将原电池、电解池、腐蚀与防护和互动练习作为同一水平页签组呈现。页签组 MUST 有可访问名称，每个页签 MUST 暴露 `tab` 语义、可访问名称、选中状态和关联面板；当前内容 MUST 作为有标签的 `tabpanel` 提供。页签组 MUST 只有一个 Tab 停靠点，并支持 Left/Right Arrow 循环移动且自动显示对应内容；Home 和 End MUST 分别移动并激活首个和末个页签。原生 Enter、Space、点击和触屏激活 MUST 保持可用。页面 MUST 显示键盘焦点。

#### Scenario: 初始页签状态可识别
- **WHEN** 学习者打开电化学页面
- **THEN** 四个有名称的页签位于命名页签组中，只有“原电池”被选中，且内容面板标记其标题来源

#### Scenario: 使用键盘切换主题
- **WHEN** 键盘焦点位于任一页签并按 Left/Right Arrow、Home 或 End
- **THEN** 焦点移动到对应页签，选中状态同步更新，面板显示匹配的电化学主题

#### Scenario: 原生键盘及指针激活
- **WHEN** 学习者通过 Enter、Space、鼠标或触屏激活一个主题
- **THEN** 该页签成为唯一选中项并展示对应内容

#### Scenario: 窄屏使用主题页签
- **WHEN** 学习者在 320 CSS 像素宽度浏览电化学页面
- **THEN** 四个页签均可见、可操作并能换行布局，页面不出现横向溢出
