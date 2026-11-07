# chemical-bond-learning Specification

## Purpose
TBD - created by archiving change chemical-bond-accessible-learning. Update Purpose after archive.

## Requirements

### Requirement: 主题主要选择可键盘操作
主题 SHALL 使用原生控件选择模式、键型、杂化、分子和极性，并同步选中状态与说明。

#### Scenario: 通过键盘选择水分子
- **WHEN** 学习者进入分子构型并选中 H₂O
- **THEN** 所选状态和 V 形分子说明同步更新

### Requirement: 不重复计数并可靠反馈进度
系统 SHALL 以不同题目的正确作答累计六题完成，写入失败时提供未保存提示与重试。

#### Scenario: 反复访问已答对题目
- **WHEN** 学习者返回已答对的题目
- **THEN** 正确状态保留，不能重复计入完成数量

#### Scenario: 达标但写入失败
- **WHEN** 六题达标但存储被拒绝
- **THEN** 显示未保存并可在存储恢复后重试

### Requirement: 分子极性说明不得使用绝对简化判据
系统 SHALL 将电负性差作为趋势或粗略参考，并根据键偶极矩和空间构型解释分子极性。

#### Scenario: 查看极性判断
- **WHEN** 学习者查看分子极性说明
- **THEN** 页面说明偶极矩矢量和，而非单凭对称性做绝对判断

### Requirement: 平面示意键角与标注一致
水分子和 BF₃ 的构型图 SHALL 分别以约 104.5° 和 120° 绘制键角，并说明空间分子的二维投影局限。

#### Scenario: 选择水和 BF₃
- **WHEN** 学习者选择水或 BF₃ 构型
- **THEN** 实际画布键线的夹角与标注一致

### Requirement: 化学偶极箭头指向负电端
极性图 SHALL 明确使用 δ⁺ 指向 δ⁻ 的化学箭头，水的键偶极与合偶极指向氧，CO₂ 两键分别指向氧，HCl 指向氯。

#### Scenario: 查看水、二氧化碳和氯化氢
- **WHEN** 学习者依次选择三个分子
- **THEN** 实际画布中的箭头方向与各原子的部分电荷标注一致
