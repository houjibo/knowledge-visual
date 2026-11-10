## 1. 设置可验证的 CI 运行窗口

- [x] 1.1 将 `.github/workflows/checks.yml` 中 `checks` job 的显式上限设为 30 分钟；查看工作流配置确认只有目标 job 被修改。
- [x] 1.2 扩展唯一发布者静态守卫，要求 `checks` job 明确配置至少 25 分钟上限；运行正反例测试验证缺失、低值、边界和 30 分钟配置。
- [x] 1.3 将 `checks` job 上限加入现有静态测试夹具和 `npm run check:static`；运行 `python3 tests/pages_publisher_test.py` 确认旧发布守卫及新边界测试均通过。

## 2. 记录运行证据并集成验证

- [x] 2.1 更新站点运营计划和差距台账，记录 #211 的取消状态、各测试套件结果与新时限依据；运行静态检查确认文档及链接无回归。
- [x] 2.2 运行 `openspec validate --all --strict`、`npm run check:static` 和 `npm run check`；各命令均以零状态结束，浏览器测试及两组 339 页检查通过，2 项既有用例跳过。
- [x] 2.3 推送提交 `844cda0` 并核对 Actions [run #212](https://github.com/houjibo/knowledge-visual/actions/runs/42759471240)：checks、发布构建、Pages 部署及部署后验证全部成功；checks 耗时 13 分 22 秒。
- [x] 2.4 归档变更并同步主规格；再次运行严格 OpenSpec 校验和静态检查确认归档结果一致。
