## Context

已有[皮带与带轮模拟](../../../../simulation-world/belt-pulley.html)聚焦一对带轮，[工业流水线](../../../../simulation-world/assembly-line.html)聚焦串行工位。[美国国家公园管理局 Springfield Armory 说明](https://home.nps.gov/spar/learn/historyculture/steam-power.htm)记录中央蒸汽动力通过轴和皮带传给个别机器；[史密森尼传动轴藏品说明](https://www.si.edu/object/counter-shaft-and-belt-shifter%3Anmah_845995)记录单一动力源经主轴、皮带和副轴驱动多台机器。页面只取这一结构为历史背景，不复原某一工厂。[MIT OCW 皮带传动讲义第 10 页](https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/83d81a6f63d1c6f0fb775c08b207bc51_MIT2_72s09_lec12.pdf)给出无打滑时带速与两轮直径/角速度的关系。

## Decisions

- 使用固定主轴转速 30/60/90 rpm，主轴上两只主动轮的有效直径均为 20 cm；A、B 从动轮各可选 10/20/40 cm，支路可独立接合。理想无打滑时，接合支路的转速 `n_machine=n_shaft×20/D_machine`，未接合为 0；主轴转速不随接合或轮径变化。所有皮带按开口连接示意，同向转动。数值仅用于本教学模型，不推断实际负载或功率。
- 先选择“B 相对主轴为停转/较慢/相同/较快”，才可揭晓读数和开始时间演示。参数一变，清空预测反馈、时间和角度。提供三个可复现预设：单机、双机、B 小轮；它们只是快捷设定。
- 图示为可读的传动关系示意，不假装是皮带实际切线或可制造结构。主轴和两个主动轮总按主轴角度转；只有接合的从动轮随对应速度转。SVG 动态 `aria-label` 与图外文字同步，未接合支路用虚线和“未接合”标识，避免用颜色单独表达。
- 单步 0.25 s，主动播放按实际时间推进至 12 s 后停止。只持有一个 `requestAnimationFrame`；暂停、隐藏页面、参数变化或减少动态偏好立即取消。减少动态时仍可单步，偏好恢复不会自动播放。
- 原生 select、checkbox、button 提供键盘操作；移动端图示可切换“动力与 A”“B 支路”视角，全部数值和解释保持可见。页面直接文件打开、GitHub Pages 项目子路径和无 JS 时都有明确状态。

## Verification

模型独立测试速比、停转、主轴不受第二支路影响、角度与 12 秒边界。浏览器测试首页与目录入口、先预测后揭晓、三个预设、真实 SVG 旋转与文字一致、键盘、320px、减少动态、隐藏页面、`file://` 和发布子路径。静态/完整本地门禁及 Actions、公网页面另记证据；不以模型测试代替视觉验收。
