# 初中传感与控制实验室核查

核查日期：2026-11-14。范围为[传感与控制实验室](../../computer/middle/iot-sensor-feedback.html)、[纯模型](../../computer/middle/assets/iot-sensor-feedback-model.js)及[OpenSpec 变更](../../openspec/changes/middle-iot-sensor-feedback/proposal.md)。课程来源是[义务教育信息科技课程标准 2025 年日常修订版](https://fxzx.qpedu.cn/wcm.files/upload/CMSfxzx/202603/202603180409032.pdf)第四学段物联网实践与探索内容要求（2）—（4）及同模块学业要求（印刷页 37—38）；2022 版[教育部原件](https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582361024968.pdf)作历史对照。物联网组成参考[NIST SP 800-183](https://csrc.nist.gov/pubs/sp/800/183/final)与[W3C Web of Things Architecture 1.1](https://www.w3.org/TR/wot-architecture11/)。

## 学习任务和证据

页面给定三种虚构场景：湿度指数 25 的两轮反馈（开泵后 45，再关泵后 40）、指数 55 时关泵后 50，以及指数 45 的消息丢失时旧命令仍为开、结果 65。阈值 40、开泵加 20、关泵减 5、范围 0–100 和消息丢失后的行为都是**教学规则**，不是实际土壤测量、网络可靠性或安全控制策略。学习者每轮先预测命令和下一指数，再逐环观察传感器、网关、控制器和水泵环境。三场景正确完成才尝试写入本机进度；错误预测或少观察一环不能取得本轮完成资格。

[CE25 内容映射](../plans/curriculum-crosswalks/middle-information-technology-ce25.json)仍为 0 已验证，局部证据使 IOT-02 和 IOT-04 从缺失调整为部分，三模块合计 6 部分、13 缺失。IOT-03 保持缺失：网页没有搭建实物原型、实验规程或真实设备数据汇集。[三段学业要求映射](../plans/curriculum-crosswalks/middle-information-technology-ce25-academic.json)中，物联网段落及其“设备数据与控制”诊断点调整为部分；三段合计 3 部分、0 缺失，16 个站内诊断点为 6 部分、10 缺失。诊断点不计作新增官方要求。[此前审计](middle-information-technology-ce25-academic-themes-2026-11-13.md)的 19 条内容、3 段学业要求、5 个跨学科活动和阶段质量仍分开计数。

## 验证与未覆盖

- 纯模型校验两轮反馈、消息丢失的反事实、阈值与范围边界，3/3 通过。
- 专项浏览器 14/14（桌面和移动各 7 项）检查完整四环、三场景完成门槛、错误预测、存储失败重试、搜索及目录计数、320px、键盘、直接文件和发布子路径；受首页分母影响的相邻回归与专项共 228 通过、4 项按原配置跳过。
- 完整 `npm run check` 通过：功能回归 2,244 通过、6 项按配置跳过；开发站 380 页加载、发布包关键流程 22 项及发布包 380 页加载全部通过。公开发布结果在变更 tasks 中追加。
- 未验证真实传感器、设备连接、实时网络、实物实验规程、屏幕阅读器完整朗读或真实学习者对物联网的理解。后续需按适用地区教材与课标先补设备搭建、数据汇集和固定规则与 AI 的区别。
