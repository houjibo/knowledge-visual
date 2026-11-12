# 质量与密度：天平称量与完成证据核查

状态：本地与公网验收完成，[Actions #43263125786](https://github.com/houjibo/knowledge-visual/actions/runs/43263125786) 七项成功。范围由 [归档 OpenSpec 变更](../../openspec/changes/archive/2026-11-13-middle-mass-density-balance-evidence/proposal.md)界定。

## 差距与依据

原页面先展示待测物为 25.4 g，再提示与目标差多少克；学习者可直接凑已知答案。答对一道密度题便写入整页完成记录，不能说明已尝试称量。既有完成值只存时间戳，无法反推当时做过哪些任务。

[福州市教育局 2025 年初中物理实验技能考查方案](https://jyj.fuzhou.gov.cn/zfxxgkzl/gkml/ywgz/zdjy/202503/P020250320376488239559.pdf)列出游码归零、空载调平、左物右码、由大到小取砝码、游码细调与读数步骤。本页据此做可操作的简化示意，省略实际调平螺母和指针摆动，不作为实物操作考核。

## 改动与验收范围

- 初始游码偏离零；先归零、调平、放物，再使用 100、50、20、20、10、5 g 的有限砝码和 0–5 g、0.1 g 刻度游码。八个内置未知物目标均可解。未正确读数前，页面和画布均不展示真实质量或目标差值；偏轻、偏重、平衡仍以文字和图形提示。
- 平衡后需独立输入砝码加游码的读数。过重砝码可取下，读错可重试；新物体重开称量流程。正确读数与密度练习两项在同次打开期间按任一顺序完成，才尝试写入原有本机完成记录。旧时间戳保留并注明可能按旧规则产生；写入失败明确提示并允许重试。刷新未完成的会话会重新开始两项任务。
- 桌面与移动专项 `CI=true npx playwright test tests/browser/middle-mass-density-learning-reliability.spec.js --reporter=dot`：22/22 通过，覆盖准备顺序、八个可解目标、库存、错误恢复、两任务顺序、旧记录、存储拒绝、320px/键盘、无画布与 `file://`。发布包子路径专项 2/2 通过。专项测试证明可复现路径，不证明真实学习效果或整页辅助技术体验。

- `npm run check:static` 通过，含严格OpenSpec 262项。完整功能浏览器回归2102项通过、6项按配置跳过；新场景草稿在回归运行中进入工作区，使随后清单检查提示过期。暂移该未登记草稿后，原提交范围的开发站373页加载、发布包20项交互、发布包373页加载全部通过。此次时序与后续新场景的全量检查分别记录，不把首次中断说成全量通过。
- 提交 `d7d651e` 的 [Actions #43263125786](https://github.com/houjibo/knowledge-visual/actions/runs/43263125786) 中，core、桌面/移动、汇总、构建、部署、部署后验证七项均成功。公网[版本清单](https://houjibo.github.io/knowledge-visual/release-version.json)为 `d7d651ebd0a44998e428d2bfd1680f956cd8c4be`，`site_files_modified` 为 `false`。
- 在[公网页面](https://houjibo.github.io/knowledge-visual/physics/middle/mass-density.html)实际看到旧时间戳提示“可能按旧规则保存”和初始“未知”物体；游码归零、调平、放物后以20 g＋5 g砝码和0.4 g游码达到平衡，独立输入25.4 g才揭晓质量。此时状态显示本次称量已完成、密度练习仍待完成，旧记录未被解释为新规则证据。

真实天平操作、学习效果和整页屏幕阅读器体验仍需单独评估。
