# 共享传动轴工坊核查

状态：本地模型、专项浏览器、完整门禁、主分支 Actions 七项及公网实际操作通过；变更已归档。范围见[归档 OpenSpec](../../openspec/changes/archive/2026-11-13-shared-line-shaft-workshop/proposal.md)。

## 学习问题与依据

本场景补上“中央动力经一根主轴分给多台机器”的观察问题。[美国国家公园管理局](https://home.nps.gov/spar/learn/historyculture/steam-power.htm)记录中央蒸汽动力通过轴和皮带传给个别机器；[史密森尼藏品](https://www.si.edu/object/counter-shaft-and-belt-shifter%3Anmah_845995)说明主轴、皮带、副轴与单一动力源。页面只抽取这一传动关系，不复原历史工厂。理想带速等式和速比由 [MIT OCW 皮带传动讲义第 10 页](https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/83d81a6f63d1c6f0fb775c08b207bc51_MIT2_72s09_lec12.pdf)核对。

模型规定主轴固定 30/60/90 rpm，两只主动轮直径均为 20 cm；机器 A/B 的从动轮分别可选 10/20/40 cm，接合后 `n_机器 = n_主轴 × 20 / D_从动轮`，断开为 0。主轴与 A 不受 B 接合影响是固定转速假设的推论。两支路均按开口连接示意。未模拟负载反馈、功率、打滑、断开后的惯性、产量、工人或安全设施；图中连接线不是可制造的皮带路径。

## 验证记录

- `node tests/line-shaft-model.test.js` 通过：用独立轮缘速度等式对照 40 cm 与 10 cm 情况，检查未接合、另一支路不变、0.25 秒角度、12 秒边界和非法参数。
- `CI=true npx playwright test tests/browser/simulation-world-line-shaft-workshop.spec.js --reporter=dot`：桌面/移动共 12 项通过，覆盖首页搜索/目录、预测门槛和错误反馈、实际 SVG 旋转、双机独立接合、键盘、320px 视角与无横向溢出、减少动态、页面隐藏、12 秒结束、无脚本降级、file 直开和发布子路径。
- `npm run check` 完整通过，包含静态/OpenSpec、页面链接、目录清单、桌面/移动功能矩阵、全站加载与 377 页发布包加载。`npm run check:browser-projects` 收集桌面与移动各 1091 项，合计 2182 项；这是清单一致性预检，功能矩阵也已实际运行。
- 本地 4173 的真实浏览器辅助树能读到两台机器的接合状态和传动图文字替代；手动“接 A 和 B”→预测“较慢”→揭晓→单步后，主轴/A/B 分别为 60/60/30 rpm 与 90°/90°/45°。桌面视觉检查通过。真实屏幕阅读器、不同移动设备与学习者理解未测。
- [Actions #43315202080](https://github.com/houjibo/knowledge-visual/actions/runs/43315202080) 成功：core、桌面、移动、汇总、构建、部署和部署后校验七项完成；功能矩阵 1087+1089 项通过、6 项既有跳过，开发与发布包各 377 页加载通过。公网版本清单为 `fcabcf8fe42d0b8da65bdefbb5ae3405079f0ffd` 且 `site_files_modified=false`；公网专项交互测试 1 项通过。真实公网浏览器“B 换小轮”→预测“较快”→揭晓→前进 0.25 s，得到主轴/A/B 60/60/120 rpm 和 90°/90°/180°，图示文字同步；本地与公网验收标签页均保留。
