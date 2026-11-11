# 小学条件分支机器人核查

## 差距与学习目标

小学计算机已公开顺序与循环主题，代码核查确认这两页没有可编辑的布尔条件及if/else执行观察。根据[计算机课程计划](../plans/computer-curriculum.md)，本轮增加[条件分支机器人](../../computer/primary/conditional-robot.html)，目标是看清“判断一次，只执行一个分支”。选题依据是课程与实现差距，不是假称已经取得真实学习者反馈。

[Microsoft MakeCode if官方说明](https://makecode.microbit.org/blocks/logic/if)把if/else解释为依据布尔条件真假执行对应代码。本页使用固定地图和两个方向动作展示该语义；来源不代表本站地图、完成规则、年龄适配或学习效果得到认证。

## 模型与关键边界

5列3行，起点(1,3)、目标(5,1)、墙(3,3)/(5,2)。检查方向为右或上，真假动作各可选四个绝对方向，机器人没有朝向。墙与地图边界均使条件成立；检查方向与动作方向分别计算，条件成立不意味着所选动作安全。每次点击只判断一次并执行一个分支，无自动循环、计时器或用户代码执行。

| 规则 | 无碰撞的动作后位置 | 真假次数 |
| --- | --- | --- |
| 查右，成立上、不成立右 | (2,3)→(2,2)→(3,2)→(4,2)→(4,1)→(5,1) | 真2、假4 |
| 查上，成立右、不成立上 | (1,2)→(1,1)→(2,1)→(3,1)→(4,1)→(5,1) | 真4、假2 |

默认最后一次判断从(4,1)检查(5,1)，结果为假，执行else向右到达目标。新位置(5,1)右侧是边界，不能用这个新条件覆盖刚才的假。地图上的“判／查”、分支唯一高亮和右侧快照均保留同一动作前信息。边界外检查与动作目标既显示坐标，也明确标注地图外。

同一规则下无碰撞、观察真假两类结果并抵达目标才赢得完成；任一参数变化重置当前探索。已有完成及本页先前赢得但未保存的资格保留，重试按共享`SubjectProgress.markComplete`实际返回值报告结果，损坏记录原文不自动覆盖；当前探索和历史资格分别说明。

## 验证范围

- [纯模型单元](../../tests/condition-robot-model.test.js)：6项通过，包含两条独立期望路径、32种规则的有限状态遍历、13个可走格与32规则的快照核对、墙/边界和动作分离、冻结输入不变。固定地图只有两条成功规则，不推广为一般程序的穷举证明。
- [浏览器专项](../../tests/browser/primary-computer-condition-branches.spec.js)：旧位置快照、两条路线、唯一分支、碰撞、参数与重置、历史记录、写入拒绝/恢复、损坏原文、先前资格保留、手动等待无额外动作、键盘/320px/减少动态、同屏布局、发现进度与file协议。
- [发布子路径](../../tests/browser/published-site.spec.js)：从首页搜索进入，加载纯模型和控制器，执行六步并核对最后假条件、目标及三项独立学习记录；资源验证包含新HTML与两份JS。

## 执行证据

- 模型6项、受影响主题桌面/移动专项58项及新增同屏布局2项通过，合计60项专项。布局检查在1280×720将地图、规则、上次快照、按钮及反馈保留在同一可见操作区；320px键盘与减少动态另行检查。
- CUA本地六次手动操作：目标(5,1)，判断6、真2、假4、碰撞0；最后快照从(4,1)检查(5,1)畅通，显示false/else/向右，地图与成功保存文字一致，已保留可验收预览。
- 独立只读审查未发现快照、保存资格、计时器或主契约分母阻断；实际共享API为`markComplete`，本变更工件已按源码校正。边界外的检查与动作目标同时显示坐标及边界说明。
- 完整检查静态阶段通过，含251项严格OpenSpec与发布资源34项契约；真实收集比较为desktop949、mobile949，共1898，指纹`7946f61f9635a8de61928c7992f02fccd795f066967b03db30b0b76cb2320163`。收集不代表实际执行结果。

- `CI=true npm run check`完整通过：功能回归1896通过、原有2项移动专属测试在桌面跳过，开发站363页、发布包交互8项及发布包363页全部通过。

本轮先在`codex/primary-condition-branches`独立分支交付。历史快照截至21:02:28 UTC，main #258/#259为queued、jobs均为0，公开revision为`18ef7b479a213140ff3e62ad2c6e39886ddbd3d0`；当时主分支公开更新受到队列阻塞。随后功能快速前进集成main，当前已由下述 #262 完成自动发布与版本核验。公开人工交互验收已通过，OpenSpec随证据归档。真实设备、屏幕阅读器、完整编程课程覆盖及学习者理解效果仍未全面验证。

范围：[OpenSpec提案](../../openspec/changes/archive/2026-11-12-primary-condition-robot/proposal.md)、[设计](../../openspec/changes/archive/2026-11-12-primary-condition-robot/design.md)、[任务](../../openspec/changes/archive/2026-11-12-primary-condition-robot/tasks.md)。

## 独立分支远端质量结果

功能提交`d8186efc669050d7520d94570049c4bf1dc8c1c1`的[Actions #260](https://github.com/houjibo/knowledge-visual/actions/runs/43100973643)于2026-11-11 UTC 21:21:07完成并成功。实际执行注释：

- [desktop](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130792029951/annotations)：947通过、原有2项跳过。
- [mobile](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130792036536/annotations)：949通过。
- [core](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130792047390/annotations)：开发站363页、发布路径8项、发布包363页均通过。

core、两matrix及checks四个检查job均成功；build-release、deploy、verify-deployment三个job按非main条件跳过，不能作为已发布证据。这些数字来自执行摘要，清单指纹另见前述收集结果。后续证据文档更新保持功能、测试清单和工作流与该提交一致。

main #258/#259截至21:22:24的历史快照仍为queued且未创建job。官方故障及并发调查见[发布队列核查](release-backlog-2026-11-12.md)；该快照保留等待证据，当前发布状态以 #262 为准。

功能与证据提交d8186ef、bb44a5d已通过快速前进合入main。集成后的补充仅更新交付记录；页面、模型、控制器、浏览器测试和工作流与已验证的功能提交保持一致。

## 主分支自动发布与人工验收进度

[Actions #262](https://github.com/houjibo/knowledge-visual/actions/runs/43103626270) 对主分支 `a18061841c2b1b58aae5fb052c5a7e51cf81645d` 的core、两matrix、checks、build-release、deploy、verify-deployment七个job全部成功，最后核验于21:39:00 UTC完成。实际执行注释为[desktop 947通过/2跳过](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130801166425/annotations)、[mobile 949通过](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130801166540/annotations)，合计1896通过/2跳过；[core](https://api.github.com/repos/houjibo/knowledge-visual/check-runs/130801167036/annotations)确认开发站363页、发布路径8项、发布包363页通过。

已直接读取[公开版本清单](https://houjibo.github.io/knowledge-visual/release-version.json?verify=a18061841c2b1b58aae5fb052c5a7e51cf81645d)，HTTP200、revision匹配该提交且 `site_files_modified:false`。发布资源检查通过，工业场景三资源另有[逐字节核验](assembly-line-2026-11-12.md)。当前自动发布阻塞已解除。CUA从公开小学目录的第三卡进入，六次判断到达(5,1)，显示真2/假4/碰撞0、完成保存；最后快照从(4,1)检查(5,1)畅通，显示false/else/向右，保持旧位置判断。返回目录从原2/3变为3/3，三个主题徽章均保留；重新进入显示历史已完成而当前探索为起点0次。公开人工验收与自动化结果一致，已保存截图并归档变更。
