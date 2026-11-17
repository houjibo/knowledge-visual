# 大学数学：Haar 基变换与图像系数截断核查

日期：2026-11-17。来源：[MIT 18.06SC《Change of basis; image compression》讲义](https://ocw.mit.edu/courses/18-06sc-linear-algebra-fall-2011/7ce6815ffe9ec37129e581485494acde_MIT18_06SCF11_Ses3.7sum.pdf)。讲义以 `x=Wc`、正交基和丢弃小系数说明图像重建。本页把讲义的高维示例缩成一个可完整核验的 2×2 灰度块，并不声称这是 JPEG 的编码算法。

## 差距与实现

本站[矩阵变换](../../math/uni/matrix.html)和[SVD 工作台](../../math/uni/svd.html)尚不能让学习者把数据换成基系数并验证截断后的误差。新增[四像素实验](../../math/uni/haar-basis-compression.html)：编辑 0–255 整数像素，选择保留绝对值最大的 1–4 个系数，预测均匀系数、重建左上像素、平方误差及是否精确重建。揭示后并排显示原始与重建灰度块。

四个正交 Haar 型方向的每项为 ±1/2。模型以整数保存 `2c`、`4x̂`，因此系数、重建值和误差都精确到四分之一；验证 `WᵀW=I₄`、完整往返、Parseval 能量恒等式和“像素平方误差＝丢弃系数平方和”。灰度预览对超出 0–255 的重建值限幅，但数值和误差不变。丢弃零系数仍可精确重建；保留个数不是实际文件字节数。

## 验证记录

- `node tests/haar-compression-model.test.js`：穷举 0–4 四像素与 1–4 保留数的 2500 种组合，独立核对系数能量、重建、误差与精确重建条件；另检查默认案例和输入边界。
- 浏览器桌面／移动专项 8/8 通过，覆盖先错后改、查看示范不记完成、均匀、对角、全黑、全部保留、无效输入、320px、键盘、目录、文件直开与发布包子路径。
- 完整 `CI=1 npm run check` 通过：2670 项浏览器功能回归通过、8 项按项目配置跳过；开发站与发布包各 408 页加载通过，发布包功能专项通过。[Actions run #418](https://github.com/houjibo/knowledge-visual/actions/runs/44107577335) 整体成功；公网 `release-version.json` revision 为 `df83d463b4f9d921701f9dfd507c0eb2885e9c79`，`site_files_modified:false`。新页及两个脚本资源均返回 HTTP 200；公网桌面／移动专项 6/6 通过，另 2 项为本地发布包专用而跳过。

## 剩余差距

一般非正交基的逆矩阵坐标变换、`B=M⁻¹AM` 相似变换、实际图像编码和压缩率、真实学习者理解及完整屏幕阅读器操作仍待核。
