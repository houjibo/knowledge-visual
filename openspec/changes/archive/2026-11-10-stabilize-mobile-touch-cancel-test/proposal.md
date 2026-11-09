## Why

GitHub Actions 曾在移动端弹簧实验中，因触摸取消事件尚未处理完就立即读取状态而偶发失败。本地完整回归可通过，远端失败证据显示断言读到了取消处理前的状态。测试应等待有限时间让事件循环完成，并继续要求状态确实复位。

## What Changes

- 将触摸取消后的同步状态断言改为 Playwright 有界轮询断言。
- 保留对弹簧形变、拖动标志和活动指针均已复位的严格要求。
- 通过移动端重复运行回归验证这项同步调整。

## Capabilities

### New Capabilities

无。

### Modified Capabilities

无。此变更仅稳定测试中的异步事件检查，不改变产品行为。

## Impact

- 修改 `tests/browser/forces-learning.spec.js`。
- 不修改站点代码或发布产物；`.openspec.yaml` 使用 `skip_specs: true`。
