## Context

四个页面均加载 `math/assets/js/common.js`，其中 `const PageProgress` 是全局词法绑定而非 window 属性。其他小学页面使用 typeof 安全检查。

## Goals / Non-Goals

让原有门槛达标时能够触发已有记录逻辑；不调整学习题目、门槛或存储方案。

## Decisions

沿用项目中已有的 `typeof PageProgress !== 'undefined'` 判断，以支持接口缺失时短路。测试直接提取四个页面的判断表达式，在全局词法绑定环境执行，并验证缺失和已完成状态。

## Risks / Trade-offs

回归测试验证守卫而非全部挑战 UI 与题目；浏览器端完整挑战路径仍需要人工验证。
