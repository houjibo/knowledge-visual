## Context
两个全等三角形可沿一条边拼成与原三角形同底等高的平行四边形。原动态拼图使用了与三角形顶点不同的偏移，静态图也没有正确拼合；极端参数会超出视窗。

## Decisions
动态平行四边形以原三角形的底边和顶点构造，沿底边终点到顶点的对角线分成两个全等三角形；根据顶点和图形范围统一缩放，顶点投影落在底边外时显示延长线。静态三个步骤使用一致形状。面积、底、高与判断题有限去重生成，比较题仅有三种关系；按首次作答统计并手动换题。生活题显示代入公式与单位。尚未接入完成进度，真实设备及完整无障碍未全面验收。

## Evidence
[OpenStax 三角形面积公式](https://openstax.org/books/elementary-algebra-2e/pages/3-4-solve-geometry-applications-triangles-rectangles-and-the-pythagorean-theorem) 说明面积是底乘对应高的一半。
