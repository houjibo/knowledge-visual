# 高中化学反应速率概念与键盘核查

日期：2026-11-23。范围：`chemistry/high/reaction-rate.html` 的速率和影响因素文字、主题入口、四题测验及完成反馈。原有画布在隐藏主题首次进入时的绘制修复见[先前核查](../../openspec/changes/archive/2026-11-08-chemistry-reaction-rate-canvas-visibility/proposal.md)。

## 问题与依据

- 原页把 `v=-Δ[A]/Δt=Δ[B]/Δt` 直接写为通式；[IUPAC 反应速率定义](https://goldbook.iupac.org/terms/view/R05156)要求在恒容、无显著中间体积累等前提下按化学计量数归一。现标明 A→B（1:1）和一般 aA→bB 的系数换算。
- 原页将由粒子数和两个档位计算的数字叫“反应速率 v”，却没有体积或真实时间；现改为无量纲模型转化倾向指数并显示计算规则，滑块也称模型档位。浓度用 mol/L、时间用秒时可用 mol/(L·s)，原测验称它为“国际单位”不严谨，已改成带条件的常用单位题。
- 原页称催化剂“不参与反应”。[IUPAC 催化循环定义](https://goldbook.iupac.org/terms/view/08153)明确包含反应物结合、产物释放与催化剂再生；[催化剂定义](https://goldbook.iupac.org/terms/view/C00876)说明其提高速率而不改变反应总标准 Gibbs 能变。现说明可参与步骤并再生、通常不改变平衡位置。
- 原页“升高 10°C 速率约增大 2~4 倍”没有标示适用条件。已删除固定倍数，改为多数反应的定性趋势，具体幅度取决于反应与条件；[IUPAC 阿伦尼乌斯方程](https://goldbook.iupac.org/terms/view/A00446)也表明速率常数对温度的关系依赖活化能等参数，不能推出固定的 10°C 倍数。
- 五个主题入口和选项原是仅有 `onclick` 的 `div`，键盘难以操作；现用原生按钮、可见焦点、选中状态和禁用状态。合格后只在进度写入成功时显示“已记录完成”。

## 验证与边界

- `tests/browser/reaction-rate-concept-access.spec.js` 覆盖公式前提、指数公式与档位同步、温度及催化说明、320px 水平溢出、键盘进入主题与四题作答、作答锁定、完成刷新及存储失败后重试。
- 原画布专项 `reaction-rate-canvas-visibility.spec.js` 同跑，验证改动没有使已修复的八张画布失效。
- 首次全量浏览器矩阵 2,951 项通过、8 项按配置跳过，另有 1 项无关页面“振动与波”在首次动画帧前检查像素失败。第一次复跑中振动页通过，但同类“热学”测试偶发相同失败。两测试原先仅等画布可见即同步读像素；现对同模板的 11 个高中物理/化学画布测试及振动页改为有界轮询可见尺寸与非透明像素，永久空白仍会失败。热学与振动页移动端各重复 20 轮、共 200 项通过；完整门禁复跑以最终日志为准。
- 最终 `CI=1 npm run check` 退出码为 0：静态与 OpenSpec 门禁通过，浏览器交互 2,952 项通过、8 项按配置跳过；421 个本地页面冒烟和 421 个发布包页面加载均通过。窄屏 `file://` 截图人工核对速率与测验页；测验未作答时“下一题”呈禁用外观。
- 实现提交 `5a0b0ab25a0d067c7939521637d3005bd29c665c` 已推送；[Actions run 45096772288](https://github.com/houjibo/knowledge-visual/actions/runs/45096772288) 的核心、桌面/移动交互、构建、部署与部署后核验均成功。公开 `release-version.json` revision 与提交一致；[反应速率页](https://houjibo.github.io/knowledge-visual/chemistry/high/reaction-rate.html)及 `common.css`、`common.js` 均返回 HTTP 200。公开站点 1280px 和 320px Chromium 键盘完成四题、写入进度、无横向溢出且无脚本异常。
- [OpenSpec 变更](../../openspec/changes/archive/2026-11-23-chemistry-reaction-rate-concept-access/proposal.md)已归档；当前行为契约见[主规格](../../openspec/specs/chemistry-reaction-rate-concept-access/spec.md)。
- 本次仍未审计平衡及勒夏特列数值模型的定量准确性，也未进行真实设备和屏幕阅读器人工测试；不能据此宣称整页或高中化学课程完全验收。
