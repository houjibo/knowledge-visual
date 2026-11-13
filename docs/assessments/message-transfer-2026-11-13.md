# 初中消息传输实验室核查

核查日期：2026-11-13。范围：[消息传输实验室](../../computer/middle/message-transfer.html)、[纯模型](../../computer/middle/assets/message-transfer-model.js)、[归档 OpenSpec 变更](../../openspec/changes/archive/2026-11-13-middle-computer-message-transfer/proposal.md)。对应课程映射 `CE22-IT-L4-INET-04` 仍为**部分覆盖**，见[逐项对照](middle-information-technology-crosswalk-2026-11-13.md)。

## 内容与模型

- 页面用浏览器 `TextEncoder` 和 `TextDecoder` 实际编码、还原 UTF-8；`AI!` 对应 `41 49 21`，“你好”对应 `E4 BD A0 E5 A5 BD`。汉字的字节跨越本页 2 字节教学块，接收端必须等完整有序字节齐备才解码。
- 页面固定每块最多 2 字节、编号从 1 起、接收端知道总块数，模拟正常、倒序和第 2 块缺失后主动重发。块号与按钮不是 IP/TCP 报文或可靠传输实现；页面内已说明确认、超时、拥塞、路由等未模拟。
- [RFC 3629](https://www.rfc-editor.org/rfc/rfc3629.html)为 UTF-8 依据；[RFC 9293](https://www.rfc-editor.org/rfc/rfc9293.html)为 TCP 序号、分段和重传的对照依据；[教育部信息科技课程标准（2022年版）](https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582361024968.pdf)第四学段互联网应用与创新内容要求（4）为课程来源。

## 本地验证

- 纯模型独立核对 ASCII/汉字字节，正常、乱序、缺块、重发和非法输入：3/3 通过。
- 新主题桌面/移动浏览器：14/14 通过；与相邻网络路径主题合跑 28/28 通过。覆盖预测门槛、逐块反馈、乱序、缺块、重发、保存失败重试、首页搜索和进度、控制就绪前禁用、320px 键盘、file 直开及发布子路径。
- 页面 320px 与桌面截图人工检查：控制与字节块可读，320px 无横向滚动。首次发现页脚全角空格导致 321px 滚动宽度，修复为换行布局后专项通过。
- `npm run check:static` 通过，含 379 个 HTML 的链接/目录核对、课程映射校验和严格 OpenSpec；旧计算机首页分母断言已调整，相关 9 个测试文件的 182 项浏览器回归通过，4 项按既有配置跳过。
- 完整 `npm run check` 通过：功能浏览器 2,216 项通过、6 项按既有配置跳过；开发站 379 页加载、发布包 22 项关键流程及发布包 379 页加载均通过。

## 公开发布

提交 `537db0bb1446ba1e1b8e39883ac61059a11e2dd1` 的 [GitHub Actions run #43375601896](https://github.com/houjibo/knowledge-visual/actions/runs/43375601896) 七个任务全部成功，包含核心检查、桌面/移动功能、构建、部署和部署后验证。公开 `release-version.json` 的 revision 与该提交完全相同，`site_files_modified=false`。公开主题页在浏览器中可打开并显示本地脚本产生的 UTF-8 字节；针对真实公网地址运行主题专项 4 项通过、3 项按公网配置跳过。本地和公网验收标签同时打开。

这些证据不表示整条课程要求已达成。真实设备、完整屏幕阅读器、学习者理解和真实网络报文都未验证。
