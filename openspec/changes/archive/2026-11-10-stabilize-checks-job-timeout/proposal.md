## Why

GitHub Actions run #211 达到 `checks` job 的 20 分钟上限后被取消，build、deploy 和部署后验证因此跳过；工作流注释显示浏览器交互、339 页冒烟及发布包用例均已有通过结果，但 job 未能以成功终态结束。将完整门禁的运行窗口与实测耗时匹配，避免执行时间波动把已完成的检查变成未验证发布。

## What Changes

- 将唯一工作流的 `checks` job 上限从 20 分钟提高到 30 分钟，保留现有完整静态、浏览器、全站冒烟和发布包检查。
- 为 `checks` job 增加静态超时守卫，要求显式配置至少 25 分钟，并覆盖缺失、低于边界、边界和当前配置的回归测试。
- 在站点运营计划与差距台账记录 #211 的超时证据、调整理由和后续观察要求。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

- `site-operations`: 完整检查须使用有界且足够的运行窗口；超时仍须保持发布失败状态，不得跳过门禁。

## Impact

影响 `.github/workflows/checks.yml`、唯一 Pages publisher 静态守卫及其测试、`docs/plans/site-operations.md` 与 `docs/gaps.md`；不改变学习页面或减少测试范围。
