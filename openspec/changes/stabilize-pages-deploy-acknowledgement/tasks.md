## 1. 发布契约与差距记录

- [x] 1.1 保留部署等待、超时失败和后置验证的规格场景；`openspec validate stabilize-pages-deploy-acknowledgement --strict` 通过。
- [x] 1.2 更新站点运营计划和差距台账，注明 #208 状态、实际公网 revision 和待复验门槛；静态 Markdown 链接检查通过。

## 2. 部署窗口和静态守卫

- [x] 2.1 将 `.github/workflows/checks.yml` 中 Pages `deploy` job 超时设为 20 分钟，并保持 `verify-deployment` 依赖 deploy 成功；检查工作流配置。
- [x] 2.2 让 Pages 发布守卫验证 deploy job 超时至少 15 分钟且部署后版本/资源/浏览器核验依赖 deploy；专项测试覆盖低于阈值、缺失和合规配置。

## 3. 集成验证和运行观察

- [x] 3.1 运行 `python3 tests/pages_publisher_test.py`、`npm run check:static` 和 `openspec validate --all --strict`；全部通过。
- [ ] 3.2 推送变更并等待 GitHub Actions 的 checks、build、deploy、verify-deployment 全部成功；公网清单 revision 与提交一致且 `site_files_modified:false`。
- [ ] 3.3 若部署仍超时或返回错误，保留 deployment 状态、job 时长与公网版本证据，继续诊断而不归档；若成功则记录时长及验证结果。
