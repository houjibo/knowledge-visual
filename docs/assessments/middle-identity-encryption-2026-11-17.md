# 初中身份与保密实验室：局部课程证据

核查日期：2026-11-17。[义务教育信息科技课程标准日常修订版（2022 年版 2025 年修订）](https://fxzx.qpedu.cn/jhzx/kcjs/kcbz/511631.htm)第四学段互联网应用与创新内容要求第（6）条（印刷页 35）涉及用户标识、密码、身份验证和加密等保护措施；版本与页码沿用[CE25 复核](middle-ce25-content-recheck-2026-11-13.md)的逐页记录；本轮重新获取修订版 PDF 时服务器返回 HTTP 403，未能再次直接核验该附件。身份验证、钓鱼和认证器边界参考 [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html)，密码、额外验证和钓鱼建议参考 [CISA 安全提示](https://www.cisa.gov/sites/default/files/2024-09/Secure-Our-World-4-Easy-Ways-Stay-Safe-Online-Tip-Sheet.pdf)。这些来源用于事实核对，不将美国机构建议描述成我国课程标准原文。

## 学习任务与边界

[身份与保密实验室](../../computer/middle/identity-encryption.html)提供三个虚构账号判断：区分标识与秘密凭据、账号独立密码及额外验证、意外索取验证码时从可信入口独立核验。提示手动验证码也可能被钓鱼，不把多因素描述为绝对安全。

三种符号化传输条件比较明文、密钥未泄露的密文和密钥泄露的密文：先预测接收者及通道观察者是否可读，再看图示和文字。页面不收集真实账号、密码、验证码，不实施加密或联网；密文占位不是算法输出。可读性结论仅在页面写明的安全加密、接收者持有正确密钥及观察者能力假设下成立；加密不自动提供身份认证、完整性或已攻陷设备保护。六项正确后才尝试本机完成记录，失败可重试；既有记录不代替本轮操作。

## 课程计数与未覆盖范围

[CE25 19 条内容映射](../plans/curriculum-crosswalks/middle-information-technology-ce25.json)的互联网第（6）条由缺失变为部分，合计 **0 已验证、10 部分、9 缺失**。[三段学业要求](../plans/curriculum-crosswalks/middle-information-technology-ce25-academic.json)仍均为部分，其 16 个站内诊断点为 **9 部分、7 缺失**；内容条目、学业要求与诊断点不能相加。真实账号配置、密钥管理、网络谣言辨别、不同平台恢复流程和真实学习者迁移仍未验证，页面不证明完整达标。

## 验证记录

模型测试通过；桌面、移动专项及相关进度回归 40/40 通过，涵盖存储损坏和失败重试、资源失败、无外部请求、320px 键盘、文件直开及发布子路径。桌面首屏已目视检查。完整 `npm run check` 通过：功能回归 2536 项通过、8 项按配置跳过，开发站及发布包各 399 页加载通过，发布包专项 9 项通过。[Actions #43935196037](https://github.com/houjibo/knowledge-visual/actions/runs/43935196037) 检查、构建、部署与部署后验证成功；公网 revision 为 `73d6972de2eaec8ad73c4e175b26d18121bc0079`，公网专项 6 项通过、12 项本机注入、文件或发布包专用跳过。变更契约见[OpenSpec](../../openspec/changes/archive/2026-11-17-middle-identity-encryption-lab/proposal.md)。
