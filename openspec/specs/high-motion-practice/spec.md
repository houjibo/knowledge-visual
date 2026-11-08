# high-motion-practice Specification

## Purpose
TBD - created by archiving change motion-practice-learning-reliability. Update Purpose after archive.

## Requirements

### Requirement: 高中运动练习按五道不同题逐题作答

高中物理“运动的描述”练习 SHALL 按固定顺序展示五道不同题，显示题号、本轮状态和逐题反馈。每题首次作答后 SHALL 锁定全部选项；切换到其他学习模式并返回 SHALL 保留当前题及其已答状态；完成本轮后 SHALL 提供重新练习入口。

#### Scenario: 按顺序完成练习

- **WHEN** 学习者进入互动练习并逐题作答、前进
- **THEN** 页面依次显示五题并在完成后显示本轮结果和重练入口

#### Scenario: 锁定已答题并返回

- **WHEN** 学习者选择本题答案，切换到另一学习模式后返回
- **THEN** 本题答案与反馈保留，所有选项仍不可再次选择

#### Scenario: 重练错题

- **WHEN** 学习者完成一轮后选择重新练习
- **THEN** 题目从第一题开始且允许重新作答；之前已答对的题不重复增加掌握数

### Requirement: 练习选项支持键盘并播报状态

页面模式入口与练习答案 SHALL 使用原生可聚焦按钮并支持键盘激活。答案反馈和不同题掌握进度 SHALL 通过实时状态区域呈现。

#### Scenario: 键盘作答

- **WHEN** 学习者使用键盘聚焦互动练习模式入口并按 Enter，再聚焦一个答案并按 Enter 或 Space
- **THEN** 页面进入练习、提交该答案、显示正确性并锁定本题

### Requirement: 练习画布与题目上下文一致

练习 SHALL 隐藏与当前题目无关的 v-t 图。考查 v-t 图面积的题目 SHALL 显示阴影面积与位移对应的图像；考查匀加速直线运动图像的题目 SHALL 显示斜直线 v-t 图。可见画布 SHALL 提供与当前图像一致的可访问名称。

#### Scenario: 概念题不显示无关图像

- **WHEN** 学习者回答质点、位移或加速度概念题
- **THEN** 页面不展示 v-t 面积图

#### Scenario: 图像题显示对应可视上下文

- **WHEN** 学习者进入 v-t 面积题或匀加速运动图像题
- **THEN** 页面分别显示面积/位移图或匀加速斜直线图，并给出与图像内容一致的可访问名称

### Requirement: 完成进度按不同题正确作答

高中物理“运动的描述” SHALL 仅在本次页面会话中累计答对至少三道不同题后标记知识点完成；重复作答同题 SHALL NOT 重复计数或重复写入完成标记。

#### Scenario: 答错与重复答题不计为掌握

- **WHEN** 学习者答错、重复触发已锁定答案，或在重练中再次答对已掌握的题
- **THEN** 掌握进度只增加首次答对的新题，已有完成状态不重复写入

#### Scenario: 达到三道不同题

- **WHEN** 学习者累计答对三道不同题
- **THEN** `motion` 知识点被标记完成且后续正确作答不再重复写入完成标记
