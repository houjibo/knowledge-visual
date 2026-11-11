## Why

小学计算机已有顺序指令机器人，但课程地图中的重复结构尚未实现。学习者需要看见循环体如何逐轮展开，并区分“书写更简洁”和“执行的方向指令更少”，而不只是观看自动移动。

## What Changes

- 新增“循环指令工坊”，可设置两条方向指令和 1–4 次重复，并比较循环块、展开序列、轮次与网格位置。
- 提供单步、连续运行、暂停、回到起点和恢复示例；参数变化停止旧运行并重新从起点执行。
- 完整程序结束后检查目标与碰撞，成功才记录本机主题完成；保存失败可重试。
- 更新小学目录、计算机入口、首页数量/搜索/进度、发布资源与交互证据。

## Capabilities

### New Capabilities

- `primary-computer-repeat-loops`：有限循环的展开、执行、目标反馈与可访问操作。

### Modified Capabilities

- `computer-ai-learning-subject`：计算机小学增加循环主题与发现路径。
- `subject-progress`：计算机总数从 2 增至 3，小学两主题独立计数。
- `static-release-artifact`：循环主题及资源进入发布包，并在子路径验证。

## Impact

新增 `computer/primary/repeat-loops.html`，使用已有本地样式与 `SubjectProgress`，不新增运行依赖。更新目录、首页、检查脚本及相应测试；保留原机器人与旧 `computer-ai` 书签、记录。教学依据为课程地图中已核验的 Microsoft MakeCode repeat 定义，功能测试不代替真实学习者反馈。
