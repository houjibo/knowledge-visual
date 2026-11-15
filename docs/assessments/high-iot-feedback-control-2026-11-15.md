# 高中物联网反馈控制实验室核查

核查日期：2026-11-15。页面：[物联网反馈控制实验室](../../computer/high/iot-feedback-control.html)；实现依据：[已归档 OpenSpec 变更](../../openspec/changes/archive/2026-11-15-hs25-iot-feedback-control-lab/proposal.md)。对应 [HS25 信息科技两必修模块映射](../plans/curriculum-crosswalks/high-information-technology-hs25.json)的必修 2 内容要求 2.4。当前增加的是 `partial` 教学证据，不代表整项要求或高中课程已覆盖。

## 来源与教材定位

[2025 年高中信息科技标准公开 PDF](https://qn1-next.xuetangonline.com/17921378608052.pdf)印刷页 15 的 2.4 关注物联系统反馈对信息系统的优化，以及物联网自主可控的意义。该 PDF 来自教育平台公开镜像，**不是政府机构附件**；版本与文件校验值见[标准来源核查](high-information-technology-hs25-2026-11-15.md)。

教材使用用户选定的人教版作为章次示例。[人教版与中国地图出版社合作出版的必修 2《信息系统与社会》](../plans/pep-high-information-technology-books.md)公开目录含“信息安全与社会责任”一章，可作为系统安全议题的教学定位线索；目前未核到一个直接对应现行 2.4 的具体小节，旧教材目录也不证明 2025 年标准已由教材同步落实。因此教材没有作为这条映射的覆盖证据。

系统框图和部署讨论参考 [W3C Web of Things Architecture 1.1](https://www.w3.org/TR/wot-architecture11/)的设备行为与交互边界，以及 [NISTIR 8259A IoT 设备网络安全能力基线](https://csrc.nist.gov/pubs/ir/8259/a/final)涉及的设备识别、配置、数据保护、接口访问和软件更新能力。这些来源只用于界定技术问题，不能替代中国课程标准、国家安全评估或产品认证。

## 学习任务与模型

1. 学习者先预测定时控制或传感反馈在五轮结束时哪一种更接近目标，再逐轮查看开始状态、扰动、传感读数、动作和结果。
2. 设定目标 22、24、26 或 28。教学模型以 32 为初始温度，风扇和加热器每轮分别改变 3 个模型单位；反馈规则在读数高于目标 1 以上时开风扇，低于目标 1 以上时开加热器，否则暂停。定时方案固定前两轮开风扇、其余轮次暂停。
3. 选择稳定环境或第 3 轮热量增加 5 个模型单位。以目标 24 和扰动情境为例，定时方案终温为 31、五轮目标偏差合计 28；反馈方案终温为 25、合计 13。该合计只描述固定输入，不代表普遍性能、能耗或安全结论。目标 26 且环境稳定时，两方案偏差合计均为 3，页面也要求学习者识别同分情况。
4. 对照本地控制与云端决策。本地反馈规则在断网时仍可动作；云端方案断网时按本例预设暂停回退。图示将本地传感器→控制器→执行器路径与旁路网络分开，将云端命令路径显示为经过网络。真实系统可以采用缓存或本地冗余，断网行为取决于具体设计。
5. 判断“可以离线运行”是否足以证明自主可控。页面将它限定为一项运行证据，并提示还需核查设备、软件、更新、数据、接口权限和维护等具体环节。

## 边界

温度、执行器效果、定时表、反馈规则和云端静止回退全是固定教学数据。页面不连接真实传感器、执行器、云端服务或生成式 AI，不执行用户代码，不测量真实系统性能、能耗、可靠性或安全性。模型说明反馈可针对状态变化作调整，但不声称反馈总优于定时，也不把离线运行推断为完整自主可控。

## 验证记录

### 本地模型和浏览器

- `node tests/iot-feedback-control-model.test.js` 通过，核对稳定/扰动场景、同分边界、反馈动作、输入范围、本地断网继续和云端断网回退。
- `npx playwright test tests/browser/high-iot-feedback-control.spec.js` 桌面/移动专项 12 项通过，覆盖预测门槛、五轮轨迹、偏差与同分、本地旁路/云端网络路径、错误重试、自主可控判断、进度保存/损坏与拒写恢复、首页计数和搜索、320px 键盘、直接文件和项目子路径。
- `npm run check` 通过：静态和严格 OpenSpec 检查、桌面/移动项目浏览器矩阵、396 个 HTML 页加载冒烟、发布包测试及发布路径专项均完成。`npm run check:browser-projects` 核对桌面与移动各 1,241 项收集身份一致；收集数量不是单独的通过数。
- `python3 scripts/check_curriculum_crosswalk.py` 确认高中信息科技 15 条要求当前为 0 已验证、11 部分、4 缺失；`python3 scripts/check_curriculum_gap_map.py` 确认主题矩阵与逐页清单一致。页面只增加 M2-04 的局部证据。

自动化用例不能证明真实设备性能、安全性或真实学习者迁移效果。

### 公网发布验收

本地完整门禁已通过。功能提交 [`62474e7`](https://github.com/houjibo/knowledge-visual/commit/62474e756f8c5db8fe2b115f6d1f251d78c3d720) 已推送；[GitHub Actions 发布流水线](https://github.com/houjibo/knowledge-visual/actions/runs/43711753134) 的桌面/移动浏览器矩阵、构建、部署、公开 revision 与资源核验、公开页面浏览器检查均通过。

公开 `release-version.json` 已报告 revision `62474e756f8c5db8fe2b115f6d1f251d78c3d720` 且 `site_files_modified` 为 `false`。流水线 `verify-deployment` 对发布路径及代表性公开资源检查通过。发布后的[物联网反馈控制实验室](https://houjibo.github.io/knowledge-visual/computer/high/iot-feedback-control.html)可正常加载，标题、HS25 必修 2.4 定位、反馈实验控件、本地/云端比较和边界说明均可见；本地服务与公网页面已同时打开供验收。

OpenSpec 变更在完成发布验收后归档；本条记录及归档提交只补充交付证据，不改变已发布站点内容。
