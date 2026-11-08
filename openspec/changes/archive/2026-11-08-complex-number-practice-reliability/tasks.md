## 1. 题库与交互实现

- [x] 1.1 将十道题的题干、全部选项和唯一正确答案登记到桌面与移动浏览器回归，并对照 OpenStax §2.4、§10.5 核验复数运算题；Playwright 断言通过
- [x] 1.2 将选项改为原生键盘按钮，给题组、选中状态和反馈添加可访问语义；桌面与移动 Playwright 用 Enter 和空格回归通过
- [x] 1.3 保留错答反馈、掌握数和会话内回看状态，并在首题与末题禁用越界导航；Playwright 回归验证重复计分和状态恢复通过
- [x] 1.4 根据 `markDone` 结果展示真实保存状态，并在 `math-progress-saved` 后更新反馈；Playwright 写入失败及重试场景通过

## 2. 验收与记录

- [x] 2.1 将新浏览器用例加入 `package.json` 浏览器测试入口，并在桌面和移动项目运行复数练习、旋转画布及高中数学模式键盘回归（26 项通过）
- [x] 2.2 更新交互证据索引和 `docs/gaps.md`，运行 `npm run check:static`（含生成器一致性检查与 `openspec validate --all --strict`）通过
- [x] 2.3 检查 OpenSpec 变更状态、`git diff --check` 和全部相关文件差异，确认验收通过并满足归档条件
