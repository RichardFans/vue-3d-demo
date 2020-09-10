# vue-3d-demo(Dermatome)

一个可实现在人体3d模型上编辑Dermatome（脊柱节段到人体皮肤区域映射图），和供用户在人体3d模型上勾画疼痛区域，并判断命中了哪些Dermatome区域及关键点的Demo程序

## Preview

### Edit Dermatome

![Edit Dermatome](public/img/1.png)

### Stroke On Body

![2](public/img/2.png)



## Project setup

```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

## 学习心得 Q&A

**Q1**:WEB 3D用什么框架？

**A1**:WEBGL接口相对底层，推荐用[threejs](https://threejs.org/)

**Q2**:如何快速入门？

**A2**:THREEJS提供了丰富示例，从示例中寻找和自己需求相近的例子，在配合阅读理解，就能快速入门

**Q3**:如何在THREEJS中使用人体模型？

**A3**:首先是制作人体模型，推荐使用[makehuman](http://www.makehumancommunity.org/content/downloads.html) ，制作后可以导出为fbx格式，再使用blender打开导出为gltf格式，参考THREEJS示例代码或文档导入此gltf格式模型

**A4**:为什么不使用骨骼动画？

**Q4**:在工程所使用Threejs版本上（0.118.3），带骨骼且执行了骨骼动画的模型，Raycaster射线在某些部位或区域无反应，也就是没办法完全捕捉鼠标或触屏在带动画的模型上的交互行为，因此放弃了动画模型

**Q5**:如何知道鼠标或触摸到了模型上的位置坐标？

**A5**:通过Raycaster射线，具体用法参考THREEJS Raycaster相关示例

**A6**:如何实现在人体模型上自由绘图？

**Q6**:两种方案

3D方案：将鼠标投射到模型表面上的点的3D坐标连接在一起,形成新的Mesh面。这种方案会引入更多的3D对象，且较难实现连接线贴合到目标3D人体模型（不贴合就会穿透），并且很难判断这些涂画的Mesh是分布在哪些Dermatome区域中的（因为Dermatome是人体模型上的区域，和涂画的Mesh不是同一个3D对象）

2D方案(**推荐**)：在3D人体模型的Texture上涂画，即用2D Canvas作为人体模型的Texture，事先uv mapping（[makehuman](http://www.makehumancommunity.org/content/downloads.html)做出来的人体模型本来就map好了）；通过鼠标投射的3D坐标uv map为2D Canvas上的坐标来绘图；这种方法的问题是很难判断2D uv上“皮”的边界处是如何衔接的，这也为划分涂画时的2D连通区域带来了困难。

连通区域的算法分析请看[这里](https://www.cnblogs.com/fireae/p/3723785.html)

**Q7**:绘图时dermatome区域、用户涂画、橡皮擦如何实现？

**A7**:主要是利用分层再叠加的思想，这样各个图层独立，可控性更高；即dermatome区域一个图层，用户涂画一个图层，皮肤背景一个图层；这样就可以轻松实现擦除(而不影响其他图层的数据)、dermatome区域编辑、用户涂画的功能。

擦除方法主要是通过[CanvasRenderingContext2D.globalCompositeOperation](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/globalCompositeOperation)属性：

```javascript
ctx.globalCompositeOperation = 'destination-out'
```

**Q8**:如何实现对称绘制？

**A8**:理想的方法估计是通过鼠标投射的3D坐标点，找到与之对称的3D坐标点，再拿到这个对称点的uv坐标，到2D Canvas中绘制。但实际中由于模型使用了[BufferGeometry](https://threejs.org/docs/index.html#api/en/core/BufferGeometry)，其中似乎没有直接存储当前点的实时坐标（估计是只存储了原始坐标，再直接送入显卡计算实时坐标以提高效率），所以这种方法不太合适。当然，也可以考虑先将[BufferGeometry](https://threejs.org/docs/index.html#api/en/core/BufferGeometry)转化为[Geometry](https://threejs.org/docs/index.html#api/en/core/Geometry)，但这样也会牺牲部分效率，考虑到最终此程序会运行在移动端，因此放弃了这种方式。

​	  现实的方法是在2D Canvas中预先计算出感兴趣部位的中线，这样的话，再计算出对称点就很容易了。

**Q9**:如何判断用户涂画的疼痛区域命中了哪些Dermatome区域？

**A9**:不同的Dermatome区域最终记录在一个单独的Canvas图层中，用不同的RGB颜色表示。只需将用户涂画图层的数据坐标与Dermatome图层对比，取出命中的点的颜色值即可知道它是命中了哪些区域。

**Q10**:在编辑和保存Dermatome区域时，如何解决涂画Dermatome区域时浏览器会在笔迹边缘作抗锯齿处理，从而导致颜色不完全匹配的问题？

**A10**:颜色不完全匹配，会为Dermatome区域划分带来一定困难，因为这可能会使得区域边缘的点颜色不等于任何 区域的颜色。我的解决办法是遇到这样的边缘点，通过[Delta E 101](http://zschuessler.github.io/DeltaE/learn/)找到最相似的一个区域颜色，作为最终匹配的区域颜色。

**Q11**:3D摄像机如何平滑移动到指定坐标？

**A11**:可能你认为直接从原位置 (x1, y1, z1, rx1, ry1, rz1)到目标位置 (x2, y2, z2, rx2, ry2, rz2)做到渐变就可以了（其中rx,ry,rz分别是沿x,y,z轴的旋转坐标），但事实上这可能会造成[gimbal lock](https://www.bilibili.com/video/BV1jt411U7nM?from=search&seid=17475415149198415998)。正确的方法是通过四元数来实现旋转，请看[这里](https://blogs.perficient.com/2020/05/21/3d-camera-movement-in-three-js-i-learned-the-hard-way-so-you-dont-have-to/).









