## 1. 来源与契约

- [x] 1.1 目视核对 CE25 第四学段互联网第（3）条印刷页 35、现有页面和诊断点；提案及[评估](../../../../docs/assessments/middle-webpage-publishing-2026-11-14.md)明确真实发布缺口与映射口径。
- [x] 1.2 场景明确数据编辑、预览、版本快照、理解检查及保存失败行为；严格 OpenSpec 校验随 `npm run check:static` 通过。

## 2. 实现与集成

- [x] 2.1 白名单链接、字段校验、快照和差异纯模型通过 `node tests/webpage-publishing-model.test.js`，覆盖空值、超长、脚本形文本和快照独立性。
- [x] 2.2 初中计算机学习页桌面／移动专项 12/12 通过，覆盖草稿/发布时序、两次版本、错误反馈、键盘、320px、`file://` 和子路径。
- [x] 2.3 目录、检索与进度分母、页面清单、交互证据、课程映射和差距已更新；`npm run check:static` 通过。

## 3. 验证与交付

- [x] 3.1 完整 `npm run check` 通过（功能浏览器 2,272 通过／6 跳过、开发及发布包各 383 页加载、发布关键流程 22 项），桌面与 320px 已目视检查，未测范围见[评估](../../../../docs/assessments/middle-webpage-publishing-2026-11-14.md)。
- [x] 3.2 功能提交 `8df20cc` 已推送；[Actions 七项](https://github.com/houjibo/knowledge-visual/actions/runs/43555426274)成功，公网版本清单命中该提交，公网桌面／移动专项 6 项通过、6 项按本地专用条件跳过；本地与公网验收页均已打开。
- [x] 3.3 全量严格校验 276 项通过；归档 OpenSpec，并修复归档后 Purpose 与相对链接，再以静态门禁验证文档增量并推送。
