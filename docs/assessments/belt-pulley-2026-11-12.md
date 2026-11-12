# 皮带与带轮模拟核查

状态：开发与验证中。范围由[当前 OpenSpec 变更](../../openspec/changes/2026-11-12-belt-pulley-simulation/proposal.md)界定。

## 差距与依据

齿轮场景展示外啮合刚性传动，但模拟世界缺相隔两轴间的柔性带、开口/交叉旋向和打滑边界。依据 [MIT OCW 皮带传动运动学](https://ocw.mit.edu/courses/2-72-elements-of-mechanical-design-spring-2009/83d81a6f63d1c6f0fb775c08b207bc51_MIT2_72s09_lec12.pdf)、[NPTEL 开口与交叉皮带](https://archive.nptel.ac.in/content/storage2/courses/112105125/pdf/mod13les1.pdf)及 [Penn State 无打滑约束](https://mechanicsmap.psu.edu/websites/12_rigid_body_kinematics/12-3_belt_and_gear_driven_systems/belt_and_gear_driven_systems.html)建立教学模型。无打滑时两轮轮缘线速度相等，开口同向、交叉反向；观察到打滑后实际转速需要测量。

## 已完成的核查

- 纯模型遍历六种主动/从动直径、十种输入转速和两种连接方式，共720组条件，对照独立的每分钟带行程计算输出转数；两种打滑状态另核对参考与实际值分离。
- 对72组带路组合检查两段直线端点在轮缘、与轮缘半径垂直，交叉方式恰好发生线段交叉；非法参数和输入对象不变性通过。
- 桌面/移动专项共12项通过：分类搜索、减速/加速/等速与交叉预测、数字/文字/SVG步进一致、打滑后实际值未知、修改条件及隐藏/减少动态暂停、file直开、320px键盘与无外部加载。首轮搜索索引未生成、动态偏好断言过早取样；生成目录并等待暂停事件后重跑全部通过。
- `npm run check:static` 通过；发布包子路径专项可从首页搜索进入，揭晓30 rpm并让从动轮按45°步进，返回模拟目录。新页面在本地浏览器实测开口、交叉带路和轮径比例，交叉画面呈两条带段相交。
- `CI=true npm run check` 全部通过：严格OpenSpec及静态检查、功能浏览器2080项通过/6项按配置跳过、开发站373页加载、发布包子路径18项交互及发布包373页加载。正式发布包的带轮页面加载测试亦通过。本地人工操作交叉预设为160/80 mm、60→120 rpm，双预测正确，输入轮单步90°对应从动轮反向180°。

## 待完成

Actions和公网操作尚待验收。真实学习者理解、真实设备与屏幕阅读器未纳入本轮自动化结论。
