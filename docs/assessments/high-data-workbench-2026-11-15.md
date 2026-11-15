# 高中数据编码与分析工作台核查

核查日期：2026-11-15。页面：[数据编码与分析工作台](../../computer/high/data-workbench.html)；变更：[归档 OpenSpec 提案](../../openspec/changes/archive/2026-11-15-high-data-encoding-analysis-workbench/proposal.md)。课程位置为 HS25 高中信息科技必修 1“数据与计算”内容要求 1.1 与 1.2；[15 条逐项映射](../plans/curriculum-crosswalks/high-information-technology-hs25.json)该工作台发布时为 0 已验证、5 部分、10 缺失；现行计数见逐项映射。课程标准仍是分母，[中图人教版必修教材目录](../plans/pep-high-information-technology-books.md)仅作章次示例。

## 可观察的学习任务

1. 学习者分别预测 `A`、`中`、`🌱` 三个单码点符号的 UTF-8 字节数，页面用 `TextEncoder` 显示代码点和每个字节的十六进制、二进制值。正确字节依次为 `41`、`E4 B8 AD`、`F0 9F 8C B1`；需三个符号均预测正确。编码模型依据 [Unicode 标准第 3 章](https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-3/)和 [WHATWG Encoding Standard](https://encoding.spec.whatwg.org/)。
2. 虚构温室原始数据有周一 18 L、周二 21 L、周三 21000 mL、缺失的周四、周五 23 L 及一条同编号的周五重复记录。学习者须选“毫升除以 1000”“缺失日不计均值”“只保留一条重复项”，才能查看图表。图表同时用文字和柱长表示四个观测日，周四明确标为缺失；默认均值为 `(18+21+21+23)/4 = 20.75 L`。
3. 四个有效读数可修改；周一、周二、周五限 0–50 L 整数，周三限 0–50000 mL 且为 1000 的倍数。数据变化会更新图表刻度，并使旧均值与报告选择失效。报告只认可“这四个观测日可复算均值，不能推断缺失日或更长时期”的限定结论。
4. 三种编码、整理方案、当前均值、有限报告均答对后，才调用本机进度存储。读写异常会显示错误并允许重试；历史完成记录与当前练习状态分开。

## 验证与课程边界

[纯模型测试](../../tests/data-workbench-model.test.js)用已知 UTF-8 字节、默认与边界读数核对模型；[浏览器测试](../../tests/browser/high-data-workbench.spec.js)覆盖桌面与移动模拟视口的错误与正确路径、数据变化、存储异常、首页搜索及进度、320px 键盘、文件直开和发布子路径。纯模型 5/5 通过；新页面专项在进度提示调整后为 21 项通过、1 项按发布子路径条件跳过。功能提交的完整本地门禁通过：2409 项桌面/移动交互通过、7 项条件跳过，全站 391 页冒烟、发布包 22 项交互和 391 页加载均通过。调整后的进度提示另由专项覆盖。

[GitHub Actions #359](https://github.com/houjibo/knowledge-visual/actions/runs/43655817820)的检查、构建、部署和部署后验收全部成功；公网 `release-version.json` 与 `daec9329afd5d42866de0bf35a8b8bee6a55cec6` 一致且 `site_files_modified:false`。独立验证脚本复核 87 个公网资源，发布后浏览器验收 7/7 通过；本地与公网工作台均已在浏览器打开。[归档提交的 Actions #360](https://github.com/houjibo/knowledge-visual/actions/runs/43657397570)也全部成功，公网清单匹配 `d0e3599ad40a86b1b81f56f671885ed0ccd2eccd`；进度提示小修的本地桌面/移动专项 21/21、公网专项 16/16 通过（另 6 项按本地专用条件跳过）。

这两项内容要求仍只标为**部分**：UTF-8 三例不能代表数据挖掘、知识发现或大数据；虚构的四个有效读数没有真实采集、多来源比较、完整分析报告和方案迭代。页面和自动化测试也不能证明真实学习者掌握或完成课标的实践要求。下一步优先补可追溯数据的采集与分析流程、算法构造和信息系统交互。
