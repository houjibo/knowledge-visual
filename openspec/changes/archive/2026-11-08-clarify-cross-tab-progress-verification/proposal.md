## Why

远端双标签页进度测试偶发丢失首条记录，而本机连续复跑未重现。同步 localStorage 不是跨标签页事务，测试未区分首条记录尚未传播与已传播后仍使用旧缓存。

## What Changes

- 在首个标签页写入前监听第二个标签页的 storage 事件，收到后验证可见性并再写第二条。
- 保留并明确无事务保障的边界；记录远端失败和本地复现结果，不推断故障根因。

## Capabilities

### New Capabilities

- `cross-tab-progress-verification`: 验证传播后的顺序写入不会覆盖已存在的进度。

### Modified Capabilities

无。

## Impact

影响浏览器测试和运营证据，不更改存储实现或承诺并发事务。
