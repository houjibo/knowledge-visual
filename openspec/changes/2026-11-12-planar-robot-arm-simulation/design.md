## 教学模型

固定基座 O=(0,0)，两段杆长 L1、L2。肩角 θ1 为第一杆相对水平正向的角度，肘角 θ2 为第二杆相对第一杆的角度。肘点 A=(L1 cosθ1,L1 sinθ1)，末端 B=A+(L2 cos(θ1+θ2),L2 sin(θ1+θ2))。理想两关节均允许 -180° 到 180°，所以仅看径向距离时，完整可达区域为 |L1-L2|≤r≤L1+L2。SVG 使用相同比例，不把外形当作真实工业设备。

目标坐标由预设、数字框或 SVG 指针指定。预测检查只揭示可达性，不自动改变角度；“转到目标”在可达时用余弦定理给出一个肘向，第二个按钮切换符号以展示两解。角度取 0.1° 刻度，末端误差可能小于 1 mm，页面说明显示精度。不可达目标不生成虚假解；长度变化会重新判定。未要求动画，因此默认静止，减少动态偏好不会影响观察。

依据：[MIT OCW 2.086 Problem Set 5](https://ocw.mit.edu/courses/2-086-numerical-computation-for-mechanical-engineers-fall-2012/3a6ea77d5d5d63905832eb9a597293db_MIT2_086F12_pset5.pdf)给出两连杆正向运动学；[Modern Robotics, Inverse Kinematics of Open Chains](https://modernrobotics.northwestern.edu/nu-gm-book-resource/inverse-kinematics-of-open-chains/)说明 2R 平面机构与工作空间内外边界。本站预设与练习由本项目设计，不是来源对工业设备能力的承诺。

## 验收

独立几何基准验证杆长、端点、边界、两种逆解及不可达不变；桌面/320px 移动覆盖预测纠错、改长度、双肘向、SVG 目标拖动、键盘、文字与图形同步、直接文件和无进度写入。首页/目录、静态包与公开子路径逐一核对。
