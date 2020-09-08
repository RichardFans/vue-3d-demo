class ConnectedComponent {
  // row x col 2-d array, binary image
  imgData
  rows
  cols

  // 算法参考https://www.cnblogs.com/fireae/p/3723785.html
  runsTotal = 0
  // 下面三个数组用于记录所有团的信息，其索引表示第几个团
  stRun = []    // 记录所有团的起始索引(x坐标)
  enRun = []    // 记录所有团的结束索引(x坐标)
  rowRun = []   // 记录所有团的所在的行(y坐标)
  //
  runLabels = []  // 标记
  eqPairs = [] // 等价对

  ccTotal = 0 // 连通域个数

  // 1，逐行扫描图像，我们把每一行中连续的白色像素组成一个序列称为一个团(run)，并记下它的起点start、它的终点end以及它所在的行号。
  // 2，对于除了第一行外的所有行里的团，如果它与前一行中的所有团都没有重合区域，则给它一个新的标号；如果它仅与上一行中一个团有重合区域，
  // 则将上一行的那个团的标号赋给它；如果它与上一行的2个以上的团有重叠区域，则给当前团赋一个相连团的最小标号，并将上一行的这几个团的标记
  // 写入等价对，说明它们属于一类。
  // 3，将等价对转换为等价序列，每一个序列需要给一相同的标号，因为它们都是等价的。从1开始，给每个等价序列一个标号。
  // 4，遍历开始团的标记，查找等价序列，给予它们新的标记。
  // 5，将每个团的标号填入标记图像中。

  constructor (imgData, rows, cols) {
    let colDataIsArr = Array.isArray(imgData[Object.keys(imgData)[0]])
    if (colDataIsArr) {
      let data = {}
      for (const row in imgData) {
        data[row] = {}
        imgData[row].forEach((col) => {
          data[row][col] = true
        })
      }
      this.imgData = data
    } else this.imgData = imgData
    this.rows = rows
    this.cols = cols
    this.findOutRuns()
    this.labelRunsAndFindOutEqualPairs()
    this.makeNewEqualLabels()
  }

  getCCList () {
    let ccList = Array(this.ccTotal).fill().map(() => [])
    this.runLabels.forEach((label, i) => {
      let y = this.rowRun[i]
      for (let x = this.stRun[i]; x <= this.enRun[i]; x++) {
        ccList[label - 1].push({x, y})
      }
    })
    return ccList
  }

  // 1. 团的查找与记录
  findOutRuns () {
    for (let i = 0; i < this.rows; i++) {
      const rowData = this.imgData[i] ?? []
      if (rowData[0]) {
        this.runsTotal++
        this.stRun.push(0)
        this.rowRun.push(i)
      }
      for (let j = 1; j < this.cols; j++) {
        if (!rowData[j - 1] && rowData[j]) {
          this.runsTotal++
          this.stRun.push(j)
          this.rowRun.push(i)
        } else if (rowData[j - 1] && !rowData[j]) {
          this.enRun.push(j - 1)
        }
      }
      if (rowData[this.cols - 1]) {
        this.enRun.push(this.cols - 1)
      }
    }
  }

  // 2. 团的标记与等价对列表的生成
  labelRunsAndFindOutEqualPairs () {
    const offset = 2    // todo: 这个值很关键
    let label = 1        // 标记值, 注意是从1开始的
    let curRow = 0       // 行索引
    let firstRunOnCur = 0   // 当前行第一个团的索引(编号)
    let firstRunOnPre = 0   // 前一行第一个团的索引(编号)
    let lastRunOnPre = -1   // 前一行最后一个团的索引(编号)
    for (let i = 0; i < this.runsTotal; i++) {
      if (this.rowRun[i] !== curRow) {
        curRow = this.rowRun[i]
        firstRunOnPre = firstRunOnCur
        lastRunOnPre = i - 1
        firstRunOnCur = i
      }
      for (let j = firstRunOnPre; j <= lastRunOnPre; j++) {
        if (this.stRun[i] <= this.enRun[j] + offset && this.enRun[i] >= this.stRun[j] - offset) {
          if (!this.runLabels[i]) {   // 没有被标号过
            this.runLabels[i] = this.runLabels[j]
          } else if (this.runLabels[i] !== this.runLabels[j]) {       // 已经被标号
            this.eqPairs.push([this.runLabels[i], this.runLabels[j]]) // 保存等价对
          }
        }
      }
      if (!this.runLabels[i]) {
        this.runLabels[i] = label++
      }
    }
  }

  // 3. 将等价对转换为等价序列，每一个序列需要给一相同的标号，因为它们都是等价的。从1开始，给每个等价序列一个标号。
  // 4. 遍历开始团的标记，查找等价序列，给予它们新的标记。
  makeNewEqualLabels () {
    let maxLabel = Math.max(...this.runLabels)
    let eqTab = Array(maxLabel).fill().map(() => Array(maxLabel).fill(false))
    this.eqPairs.forEach(([first, second]) => {
      // 标记值, 注意是从1开始的
      if (!eqTab[first - 1]) eqTab[first - 1] = []
      if (!eqTab[second - 1]) eqTab[second - 1] = []
      eqTab[first - 1][second - 1] = true
      eqTab[second - 1][first - 1] = true
    })
    let labelFlag = Array(maxLabel) // 下标是label值 - 1，值是 最终的等价 label值
    let eqList = [] // 等价label列表
    for (let i = 1; i <= maxLabel; i++) { // 遍历所有的label值，注意是从1开始的
      if (labelFlag[i - 1]) {
        continue
      }
      let tempList = []
      labelFlag[i - 1] = eqList.length + 1
      tempList.push(i)
      for (let j = 0; j < tempList.length; j++) {
        for (let k = 0; k < eqTab[tempList[j] - 1].length; k++) {
          if (eqTab[tempList[j] - 1][k] && !labelFlag[k]) {
            tempList.push(k + 1)
            labelFlag[k] = eqList.length + 1
          }
        }
      }
      eqList.push(tempList)
    }

    this.ccTotal = eqList.length

    for (let i = 0; i < this.runLabels.length; i++) {
      this.runLabels[i] = labelFlag[this.runLabels[i] - 1]
    }
  }

}

export {ConnectedComponent}