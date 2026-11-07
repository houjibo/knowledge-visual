## Context
仓库已有完整检查及发布包脚本，Pages 尚未启用。只有同一提交的检查完成后才可生成并部署发布包。

## Decisions
检查成功后，仅主分支 push 或手动运行触发构建；独立部署任务获得 Pages 与 OIDC 权限。工作流按 ref 取消旧运行，构建与部署前再次核对 main 最新提交，降低旧提交较晚发布的风险；部署时主分支仍可能在最终核对之后变化。使用 GitHub 官方 Pages 构建与部署操作，记录启用步骤；PR 不发布。实际环境配置、成功发布和回退均需单独核验。

## Evidence
[GitHub Pages 工作流配置](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site) 与 [自动部署示例](https://docs.github.com/en/get-started/start-your-journey/deploying-your-website-automatically)。
