# 初中资料共享与同步：有限模型证据

核查日期：2026-11-14。[义务教育信息科技课程标准日常修订版（2022 年版 2025 年修订）](https://fxzx.qpedu.cn/wcm.files/upload/CMSfxzx/202603/202603180409032.pdf)第四学段“互联网应用与创新”内容要求第（1）条（印刷页 34）要求借在线活动分析互联网应用特征及其创新价值。本站依照[2025 版来源及页码复核](middle-ce25-content-recheck-2026-11-13.md)建立本项；[教育部教育技术与资源发展中心实验目录](https://www.ncet.edu.cn/u/cms/www/202311/241430136xjv.pdf)提供应用特点比较的实验线索。义务教育信息科技的现行人教版审定教科书尚未核定，故本页不宣称对应某一教材章节。

## 可观察的学习任务

- [资料共享与同步实验室](../../computer/middle/online-collaboration.html)让学习者在独立副本、两人已连接的在线共享、C 暂时断线三个情境中，先预测 B、C 的版本，再推进一步。页面同时列出 A、模拟服务、B、C 的版本及逐步记录。
- 独立副本中，A 手动递送给一人只更新那个人；在线情境中，一次模拟同步更新已连接者；C 断线后先保留旧版，重连本身仍不更新，下一次同步才取得新版。题目要求比较有条件的传播效率，而非声称离线无法合作或联网保证瞬时传播。
- 三个情境每步都正确并核对结论后，才尝试保存本机完成标记。预测错误仍可观察结果，但要重做该情境才获本轮标记；历史完成不替代本轮过程，存储失败可重试。

## 课程映射与边界

[CE25 信息科技三个模块 19 条内容要求](../plans/curriculum-crosswalks/middle-information-technology-ce25.json)现在是 **0 已验证、8 部分、11 缺失**：第（1）条从缺失改为部分。三段[学业要求映射](../plans/curriculum-crosswalks/middle-information-technology-ce25-academic.json)仍为 3 部分，其下 16 个站内诊断点仍为 7 部分、9 缺失，三种分母不相加。模拟活动没有真实联网、多人账号、资料上传、权限、冲突或网络延迟测量，也没有具体社会创新案例及真实学习者解释证据；因此不能把第（1）条记为已验证，亦不把本页当作在线协作实践。

## 验证记录

- `node tests/online-collaboration-model.test.js`：5 项通过，独立预期覆盖两种手动递送顺序、共享一步传播、断线重连不自动更新、错误及非法操作、结论边界。
- `npx playwright test tests/browser/middle-online-collaboration.spec.js --project=desktop --project=mobile`：14/14 通过，覆盖版本流、先预测再观察、错误重做、结论门槛、进度保存失败重试、搜索与目录、加载就绪、320px、键盘、直接文件与发布子路径。
- 功能提交 `342986b` 的完整 `npm run check` 通过：静态检查、严格 OpenSpec 校验及课程映射通过；功能浏览器 2,312 项通过、6 项按既有条件跳过；开发站 384 页、发布包关键流程 22 项及发布包 384 页加载通过。文案修复提交 `6e1e216` 后，纯模型、桌面／移动专项 14/14 与静态检查再次通过，Actions #338 对修复版完成全量门禁。本地实验页已打开并目视检查桌面布局；窄屏无横向溢出由浏览器断言验证。
- [Actions #337 功能提交](https://github.com/houjibo/knowledge-visual/actions/runs/43584669523)和[Actions #338 文案修复](https://github.com/houjibo/knowledge-visual/actions/runs/43586023414)的六个工作节点全部成功，包括检查、构建、部署及部署后验证。最终公网 `release-version.json` 指向 `6e1e216cc0a636b1d9407e9a2c61e2f1e9521dc7`，`site_files_modified:false`。
- 公网桌面／移动专项：8 项通过、6 项按本地专用条件跳过。已打开[公网实验页](https://houjibo.github.io/knowledge-visual/computer/middle/online-collaboration.html)与[本地实验页](http://127.0.0.1:4173/computer/middle/online-collaboration.html)。公网实际操作发现重连后的旧反馈仍声称“断线者保留旧版”，由修复提交 `6e1e216` 改为按连接状态描述；重载后确认首次同步 B=2、C=1，重连 C 仍为 1，下一次同步 C=2 且反馈说明已重连。
- 对应[归档 OpenSpec 变更](../../openspec/changes/archive/2026-11-14-online-collaboration-sync-lab/proposal.md)。
