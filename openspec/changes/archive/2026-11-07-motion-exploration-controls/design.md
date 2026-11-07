## 设计

沿用已有单选外观和点击处理逻辑，使用原生 button 获得 Tab、Enter、Space 行为；每组以 aria-pressed 表示当前选择，并显示 focus-visible 轮廓。速度选择继续更新速度与运动模拟；图像选择继续重绘画布。以浏览器实际交互验证，不改变运动模型。
