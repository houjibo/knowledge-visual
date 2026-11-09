## 1. 有限挑战选项

- [x] 1.1 增加浏览器回归，固定 0 和接近 1 的随机值验证题目、四个互异选项、唯一正确答案和下一题；桌面与移动均通过
- [x] 1.2 从 1–81 有限候选中抽取三个干扰项；专项回归 6/6 通过并覆盖 320px 窄屏

## 2. 项目证据与完整验证

- [x] 2.1 登记回归并更新交互证据、风险清单和差距台账；生成索引且严格 OpenSpec 校验通过
- [x] 2.2 运行 `npm run check`，确认全量浏览器测试、330 页站点冒烟与 330 页发布包加载检查通过

## 3. 发布与归档

- [x] 3.1 提交 `5b03f07cf8336c9526055764462ddc3b95251523` 并推送；Actions [run #203](https://github.com/houjibo/knowledge-visual/actions/runs/42708711026) 的检查、构建、Pages 部署和部署后核验全部成功，且本地与公开乘法挑战页均已打开确认
- [x] 3.2 已归档至 `2026-11-10-bounded-multiplication-challenge-options`，能力规格已同步到 `openspec/specs/multiplication-challenge-reliability/`；`openspec validate --all --strict` 通过（229 项）
