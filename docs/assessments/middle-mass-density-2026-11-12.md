# 初中质量与密度核查

状态：本地与公网验收完成，[Actions #43248791663](https://github.com/houjibo/knowledge-visual/actions/runs/43248791663) 七个任务通过。范围由[归档 OpenSpec 变更](../../openspec/changes/archive/2026-11-12-middle-mass-density-learning-reliability/proposal.md)界定。

## 复现与知识依据

- 本地页面辅助功能树中三个章节和四个练习选项原为文本而非可操作控件；密度滑块没有关联名称。50 g / 20 cm³ 显示 2.50 g/cm³ 时，旧材料范围重叠但页面只给出“玻璃”。答对后页面不检查 `markDone` 的保存结果。质量对数图最右端原写“10000 t”，代码范围实际是 10⁷ g，即 10 t；密度图第六行绘制到 520px 画布下缘之外。
- [OpenStax 密度定义和表](https://openstax.org/books/college-physics-ap-courses-2e/pages/11-2-density)支持ρ=m/V、水、常见玻璃、铝、铁、铜、铅、金等近似参考值，并将密度作为帮助判断材料的一个特征。[W3C 键盘要求](https://www.w3.org/WAI/WCAG22/Understanding/keyboard)要求页面功能可用键盘完成。本站示意和练习范围由本变更自行设计，参考资料不构成本站教学效果认证。

## 修复与验证

- 章节和选项改为原生按钮、滑块有显式标签、状态有文字反馈及可见焦点；画布不可用时保留计算和练习。
- 密度计算保留公式，改为学习者选择参考材料后显示差值与条件边界，不依据区间或任意阈值猜测唯一材质；练习限定为四种参考纯金属的比较。蓝色立方体边长按体积立方根缩放；对数质量轴刻度与实际范围一致，密度六行完整位于画布内，取消无用途的连续帧重绘。
- 正确答案只接受一次；本机完成记录只有在写入成功后才宣告保存。拒绝写入时保留答对资格并可重试，损坏的旧记录原文不被覆盖。
- `CI=true npx playwright test tests/browser/middle-mass-density-learning-reliability.spec.js`：桌面与移动共16项通过，覆盖320px、键盘、50/20与高值、体积立方根图示、错误后正确、历史记录/拒绝存储、画布不可用、`file://`直开。发布包子路径专项2项通过，能从首页搜索进入并完成比较与练习。
- `npm run check:static` 通过，含严格 OpenSpec 261 项；静态页面清单保持373页，交互风险报告中该页的七个 div 候选已消除，发布资源核验增加本页并覆盖62个资源。
- `CI=true npm run check` 完整通过：功能浏览器2096项通过/6项按配置跳过，开发站373页加载、发布包子路径20项交互及发布包373页加载通过。
- 首次推送 `9380b6e` 的桌面矩阵仅在仓储分拣发布包测试遇到60秒超时，阻止了部署。该用例在返回导航开始后即关闭临时服务器，存在等待未结束请求的风险。修复提交 `4bfa70a` 在导航完成并关闭页面后清理服务器连接；新增未完成HTTP请求的关闭回归。本地发布包相关61项、发布包交互20项、373页加载及该故障用例连续10次通过；随后 Actions 七个任务全部成功。
- 公网 [发布清单](https://houjibo.github.io/knowledge-visual/release-version.json) 的 `revision` 为 `4bfa70a4c53bea91d731606b5bb264ccf5ebb1d6`，`site_files_modified` 为 `false`。在[公网页面](https://houjibo.github.io/knowledge-visual/physics/middle/mass-density.html)实测50 g / 20 cm³得到2.50 g/cm³，选择常见玻璃显示参考2.60与差值0.10；先选铁后选铝可改答，正确后出现本机完成记录已保存。本地页面也已打开检查。

## 后续差距

历史完成记录仍沿用“答对一题即记录主题完成”的既有门槛；这不能证明学习者已理解质量概念或天平称量。应另立变更设计更完整的完成证据，先核查天平模型和题目适龄性。真实设备、整页屏幕阅读器及真实材料鉴定也不在本轮自动化结论内。
