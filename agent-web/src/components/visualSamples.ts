// 可视化示例代码库
export interface CodeSample {
  name: string
  html?: string
  javascript: string
  css?: string
  description?: string
}

export const sampleMultiLineChart: CodeSample = {
  name: '多曲线交互图表',
  description: '展示多条数据曲线的交互式图表',
  html: `<!-- 图表容器 -->
<div id="chart-container" class="chart-wrapper">
  <div class="chart-title">销售数据趋势分析</div>
  <div id="main-chart" class="chart-content"></div>
</div>`,
  css: `/* 图表样式 */
.chart-wrapper {
  width: 100%;
  height: 100%;
  padding: 20px;
  box-sizing: border-box;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.chart-title {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #333;
  margin-bottom: 20px;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.1);
}

.chart-content {
  width: 100%;
  height: calc(100% - 60px);
  background: #fff;
  border-radius: 8px;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.05);
}`,
  javascript: `// 多曲线交互图表示例
const option = {
  title: {
    text: '销售数据趋势分析',
    subtext: '2024年上半年各产品线销售情况',
    left: 'center',
    textStyle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333'
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'cross',
      label: {
        backgroundColor: '#6a7985'
      }
    }
  },
  legend: {
    data: ['智能手机', '平板电脑', '笔记本电脑', '智能手表'],
    top: '10%',
    textStyle: {
      fontSize: 12
    }
  },
  toolbox: {
    feature: {
      saveAsImage: {
        title: '保存为图片'
      },
      dataZoom: {
        title: {
          zoom: '区域缩放',
          back: '还原缩放'
        }
      },
      restore: {
        title: '还原'
      }
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: ['1月', '2月', '3月', '4月', '5月', '6月'],
    axisLabel: {
      fontSize: 11
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value}万',
      fontSize: 11
    }
  },
  series: [
    {
      name: '智能手机',
      type: 'line',
      smooth: true,
      stack: 'Total',
      lineStyle: {
        width: 3
      },
      areaStyle: {
        opacity: 0.3
      },
      emphasis: {
        focus: 'series'
      },
      data: [120, 132, 101, 134, 90, 230]
    },
    {
      name: '平板电脑',
      type: 'line',
      smooth: true,
      stack: 'Total',
      lineStyle: {
        width: 3
      },
      areaStyle: {
        opacity: 0.3
      },
      emphasis: {
        focus: 'series'
      },
      data: [220, 182, 191, 234, 290, 330]
    },
    {
      name: '笔记本电脑',
      type: 'line',
      smooth: true,
      stack: 'Total',
      lineStyle: {
        width: 3
      },
      areaStyle: {
        opacity: 0.3
      },
      emphasis: {
        focus: 'series'
      },
      data: [150, 232, 201, 154, 190, 330]
    },
    {
      name: '智能手表',
      type: 'line',
      smooth: true,
      stack: 'Total',
      lineStyle: {
        width: 3
      },
      areaStyle: {
        opacity: 0.3
      },
      emphasis: {
        focus: 'series'
      },
      data: [320, 332, 301, 334, 390, 330]
    }
  ]
};

// 设置图表选项
chartInstance.setOption(option);

// 添加窗口大小变化监听
window.addEventListener('resize', () => {
  chartInstance.resize();
});`
};

export const sampleBarChart: CodeSample = {
  name: '柱状图表',
  description: '展示各部门业绩对比的柱状图',
  html: `<!-- 柱状图容器 -->
<div id="bar-chart-container" class="bar-chart-wrapper">
  <div class="chart-header">
    <h3>各部门年度业绩对比</h3>
    <div class="chart-subtitle">2024年度数据统计</div>
  </div>
  <div id="bar-chart" class="chart-body"></div>
</div>`,
  css: `/* 柱状图样式 */
.bar-chart-wrapper {
  width: 100%;
  height: 100%;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-header {
  text-align: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: #333;
  font-weight: 600;
}

.chart-subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 10px;
}

.chart-body {
  width: 100%;
  height: calc(100% - 80px);
}`,
  javascript: `// 柱状图示例
const option = {
  title: {
    text: '各部门年度业绩对比',
    left: 'center',
    textStyle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333'
    }
  },
  tooltip: {
    trigger: 'axis',
    axisPointer: {
      type: 'shadow'
    },
    formatter: function(params) {
      return params[0].name + '<br/>' + 
             params[0].seriesName + ': ' + params[0].value + '万元';
    }
  },
  grid: {
    left: '3%',
    right: '4%',
    bottom: '3%',
    containLabel: true
  },
  xAxis: {
    type: 'category',
    data: ['销售部', '技术部', '市场部', '运营部', '财务部', '人事部'],
    axisLabel: {
      fontSize: 11,
      rotate: 45
    }
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value}万',
      fontSize: 11
    }
  },
  series: [
    {
      name: '年度业绩',
      type: 'bar',
      data: [2300, 1800, 1200, 900, 600, 400],
      itemStyle: {
        color: function(params) {
          const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272'];
          return colors[params.dataIndex];
        }
      },
      label: {
        show: true,
        position: 'top',
        formatter: '{c}万'
      }
    }
  ]
};

chartInstance.setOption(option);

window.addEventListener('resize', () => {
  chartInstance.resize();
});`
};

export const samplePieChart: CodeSample = {
  name: '饼图表',
  description: '展示市场份额分布的饼图',
  html: `<!-- 饼图容器 -->
<div id="pie-chart-container" class="pie-chart-wrapper">
  <div class="pie-header">
    <h3>市场份额分布</h3>
    <span class="pie-period">2024年Q2数据</span>
  </div>
  <div id="pie-chart" class="pie-content"></div>
</div>`,
  css: `/* 饼图样式 */
.pie-chart-wrapper {
  width: 100%;
  height: 100%;
  padding: 20px;
  background: radial-gradient(circle at center, #ffffff 0%, #f8f9fa 100%);
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.pie-header {
  text-align: center;
  margin-bottom: 20px;
}

.pie-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: #495057;
  font-weight: 700;
}

.pie-period {
  font-size: 14px;
  color: #6c757d;
  background: #e9ecef;
  padding: 4px 12px;
  border-radius: 12px;
}

.pie-content {
  width: 100%;
  height: calc(100% - 80px);
}`,
  javascript: `// 饼图示例
const option = {
  title: {
    text: '市场份额分布',
    subtext: '2024年Q2数据',
    left: 'center',
    textStyle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#333'
    }
  },
  tooltip: {
    trigger: 'item',
    formatter: '{a} <br/>{b}: {c} ({d}%)'
  },
  legend: {
    orient: 'vertical',
    left: 'left',
    textStyle: {
      fontSize: 12
    }
  },
  series: [
    {
      name: '市场份额',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: [
        { value: 1048, name: '华为' },
        { value: 735, name: '小米' },
        { value: 580, name: 'OPPO' },
        { value: 484, name: 'vivo' },
        { value: 300, name: '苹果' }
      ]
    }
  ]
};

chartInstance.setOption(option);

window.addEventListener('resize', () => {
  chartInstance.resize();
});`
};

// 默认示例代码
export const defaultSampleCode = sampleMultiLineChart;

// 所有示例代码
export const allSamples = {
  multiLine: sampleMultiLineChart,
  bar: sampleBarChart,
  pie: samplePieChart
}; 