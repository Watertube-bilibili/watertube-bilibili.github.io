/* SPDX-License-Identifier: AGPL-3.0-only */
window.LAB_CATALOG=window.LAB_CATALOG||[];
window.LAB_CATALOG.push(...[
  {
    "id": "phy-cold-water-reboil",
    "subject": "physics",
    "term": "8上",
    "chapter": "开启科学探索之旅",
    "section": "绪言",
    "title": "向倒置热烧瓶浇冷水后的沸腾",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较降温前后水是否重新沸腾，联系瓶内气压变化。",
    "apparatus": [
      "烧瓶",
      "水",
      "塞子",
      "冷水"
    ],
    "steps": [
      "观察瓶内仍热但停止沸腾的水。",
      "在模型中降低水面上方的压强。",
      "比较水温与新的沸点。"
    ],
    "observations": [
      "压强降低后，原本停止沸腾的热水可以再次沸腾。"
    ],
    "conclusion": "液体沸点随外界压强降低而降低，重新沸腾不代表水温升高。",
    "examPoints": [
      "水沸腾同时需要达到当时沸点并继续获得汽化所需能量"
    ],
    "pitfalls": [
      "冷水并非直接把瓶内的水加热"
    ],
    "questions": [
      {
        "q": "向瓶外浇冷水，瓶内水为何可能再沸腾？",
        "a": "冷却使部分水蒸气液化，瓶内压强降低，水的沸点随之下降。"
      }
    ],
    "safety": [
      "仅作模拟或教师演示；低压会降低沸点，不是冷水把水加热。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "boiling",
      "variant": "cold-water-reboil",
      "mass": 0.1,
      "power": 0,
      "time": 0
    },
    "modelNote": "不再输入热量，比较既有热水在降压后的相平衡状态；压强降低可能使水重新沸腾。未模拟冷水流动、瓶内蒸汽凝结速度和后续散热，热玻璃操作仅由教师演示。",
    "controls": [
      {
        "key": "initial",
        "label": "降压前水温",
        "unit": "℃",
        "min": 80,
        "max": 95,
        "step": 1,
        "value": 90
      },
      {
        "key": "pressure",
        "label": "瓶内压强",
        "unit": "kPa",
        "min": 60,
        "max": 101,
        "step": 0.1,
        "value": 65
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "向瓶外浇冷水，瓶内水为何可能再沸腾？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较降温前后水是否重新沸腾，联系瓶内气压变化。"
        },
        {
          "title": "指出观察证据",
          "text": "压强降低后，原本停止沸腾的热水可以再次沸腾。"
        },
        {
          "title": "解释现象",
          "text": "液体沸点随外界压强降低而降低，重新沸腾不代表水温升高。"
        },
        {
          "title": "完整回答",
          "text": "冷却使部分水蒸气液化，瓶内压强降低，水的沸点随之下降。"
        }
      ],
      "answer": "冷却使部分水蒸气液化，瓶内压强降低，水的沸点随之下降。"
    }
  },
  {
    "id": "phy-funnel-ball",
    "subject": "physics",
    "term": "8上",
    "chapter": "开启科学探索之旅",
    "section": "绪言",
    "title": "漏斗向下吹气托住乒乓球",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "观察流动气体对球运动的影响。",
    "apparatus": [
      "漏斗",
      "乒乓球"
    ],
    "steps": [
      "把球置于倒置漏斗下方。",
      "在模型中比较停止与持续吹气。",
      "观察球和漏斗附近气流方向。"
    ],
    "observations": [
      "适当气流条件下，球可能暂时被托持而不掉落。"
    ],
    "conclusion": "流动气体可造成压力差和气动力；实际托球涉及复杂流场。",
    "examPoints": [
      "只能用流体作用作定性解释，不把简单伯努利式当成精确托力"
    ],
    "pitfalls": [
      "吹气强弱与球稳定性不是任意范围单调关系"
    ],
    "questions": [
      {
        "q": "球不掉落是否意味着没有重力？",
        "a": "不是，重力仍向下，向上的气动力在稳定状态下与其平衡。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "flow",
      "variant": "funnel-ball"
    },
    "modelNote": "用理想流体伯努利关系比较流速和静压；空气密度取近似值。忽略黏性和湍流，喷雾、托球等现象还受实际流场和阻力影响，不能仅用一个静压公式预测完整轨迹。",
    "controls": [
      {
        "key": "speed",
        "label": "流速",
        "unit": "m/s",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "density",
        "label": "流体密度",
        "unit": "kg/m³",
        "min": 1,
        "max": 1000,
        "step": 0.1,
        "value": 1.2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "球不掉落是否意味着没有重力？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "观察流动气体对球运动的影响。"
        },
        {
          "title": "指出观察证据",
          "text": "适当气流条件下，球可能暂时被托持而不掉落。"
        },
        {
          "title": "解释现象",
          "text": "流动气体可造成压力差和气动力；实际托球涉及复杂流场。"
        },
        {
          "title": "完整回答",
          "text": "不是，重力仍向下，向上的气动力在稳定状态下与其平衡。"
        }
      ],
      "answer": "不是，重力仍向下，向上的气动力在稳定状态下与其平衡。"
    }
  },
  {
    "id": "phy-pendulum-period",
    "subject": "physics",
    "term": "8上",
    "chapter": "第一章 机械运动",
    "section": "1.1",
    "title": "测量单摆周期并调节摆长",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "用多次摆动总时间求周期，再改变摆长。",
    "apparatus": [
      "摆线",
      "小球",
      "秒表",
      "刻度尺"
    ],
    "steps": [
      "用小摆角释放摆球。",
      "记录多个完整往返的总时间。",
      "用总时间除以次数，并改变摆长复测。"
    ],
    "observations": [
      "小摆角下重复摆动时间较稳定；摆长改变会影响周期。"
    ],
    "conclusion": "测多次周期总时间再平均，有助于减小启动停止的相对影响。",
    "examPoints": [
      "一次完整摆动须回到相同位置且运动方向相同"
    ],
    "pitfalls": [
      "不能把一次单向摆动算成一个周期"
    ],
    "questions": [
      {
        "q": "20次完整摆动用40.0 s，周期是多少？",
        "a": "周期为2.00 s。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "energy",
    "modelParams": {
      "scenario": "pendulum",
      "variant": "pendulum-period"
    },
    "modelNote": "采用小摆角理想单摆周期公式T=2π√(L/g)作拓展计算；忽略空气阻力、线质量与摆球大小，实物实验通过多次完整摆动的平均时间测周期。",
    "controls": [
      {
        "key": "length",
        "label": "摆长",
        "unit": "m",
        "min": 0.1,
        "max": 2,
        "step": 0.05,
        "value": 1
      },
      {
        "key": "gravity",
        "label": "重力场强度",
        "unit": "N/kg",
        "min": 1,
        "max": 10,
        "step": 0.1,
        "value": 9.8
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "20次完整摆动共40.0 s。",
      "steps": [
        {
          "title": "整理条件",
          "text": "20次完整摆动共40.0 s。"
        },
        {
          "title": "选用依据",
          "text": "T=t/N。"
        },
        {
          "title": "代入求解",
          "text": "T=40.0/20=2.00 s。"
        },
        {
          "title": "写出结论",
          "text": "单次周期2.00 s。"
        }
      ],
      "answer": "单次周期2.00 s。"
    }
  },
  {
    "id": "phy-ruler-length",
    "subject": "physics",
    "term": "8上",
    "chapter": "第一章 机械运动",
    "section": "1.1",
    "title": "刻度尺测量铅笔和书本",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "练习零点对齐、正确视线、读数与单位记录。",
    "apparatus": [
      "刻度尺",
      "铅笔",
      "作业本",
      "课本"
    ],
    "steps": [
      "根据物体大小选择量程与分度值。",
      "零刻度线与物体一端对齐，视线垂直刻度面。",
      "读取另一端并估读到下一位，记录单位。"
    ],
    "observations": [
      "错误视线或误把尺端当零点会造成读数偏差。"
    ],
    "conclusion": "长度测量必须同时记录数值和单位，并与刻度尺精度相适应。",
    "examPoints": [
      "可使用非零起点，两端读数相减",
      "身体尺需先标定"
    ],
    "pitfalls": [
      "不把测量值与真实值完全等同"
    ],
    "questions": [
      {
        "q": "物体两端对准1.20 cm和6.45 cm，长度是多少？",
        "a": "长度为5.25 cm。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "measurement",
    "modelParams": {
      "scenario": "length",
      "variant": "ruler-length"
    },
    "modelNote": "读数按给定分度值取整并示范零点修正；估读能力、视差和真实测量误差需结合器材训练。",
    "controls": [
      {
        "key": "value",
        "label": "待测量",
        "unit": "cm",
        "min": 0,
        "max": 200,
        "step": 0.01,
        "value": 12.34
      },
      {
        "key": "division",
        "label": "分度值",
        "unit": "cm",
        "min": 0.01,
        "max": 10,
        "step": 0.01,
        "value": 0.1
      },
      {
        "key": "zero",
        "label": "零点偏移",
        "unit": "cm",
        "min": -5,
        "max": 5,
        "step": 0.1,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "两端读数1.20 cm、6.45 cm。",
      "steps": [
        {
          "title": "整理条件",
          "text": "两端读数1.20 cm、6.45 cm。"
        },
        {
          "title": "选用依据",
          "text": "长度=终点读数−起点读数。"
        },
        {
          "title": "代入求解",
          "text": "L=6.45−1.20=5.25 cm。"
        },
        {
          "title": "写出结论",
          "text": "长度5.25 cm。"
        }
      ],
      "answer": "长度5.25 cm。"
    }
  },
  {
    "id": "phy-stopwatch-pulse-step",
    "subject": "physics",
    "term": "8上",
    "chapter": "第一章 机械运动",
    "section": "1.1",
    "title": "秒表记录脉搏和步行节律",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "练习启动停止与累计计时。",
    "apparatus": [
      "秒表"
    ],
    "steps": [
      "明确计时事件的起止。",
      "记录多次脉搏或多个步行周期总时间。",
      "计算平均间隔并比较重复测量。"
    ],
    "observations": [
      "短时间事件的人工反应影响占比更大。"
    ],
    "conclusion": "秒表测量应统一起止标准，累计计时可减小相对误差。",
    "examPoints": [
      "仪表分度值与人为反应时间是不同误差来源"
    ],
    "pitfalls": [
      "不能把脉搏次数直接当作秒数"
    ],
    "questions": [
      {
        "q": "30次脉搏间隔总计24 s，平均间隔多少？",
        "a": "若记录的是30个完整间隔，平均0.80 s。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "measurement",
    "modelParams": {
      "scenario": "time",
      "variant": "stopwatch-pulse-step"
    },
    "modelNote": "读数按给定分度值取整并示范零点修正；估读能力、视差和真实测量误差需结合器材训练。",
    "controls": [
      {
        "key": "value",
        "label": "计时时间",
        "unit": "s",
        "min": 0,
        "max": 120,
        "step": 0.01,
        "value": 30.28
      },
      {
        "key": "division",
        "label": "分度值",
        "unit": "s",
        "min": 0.01,
        "max": 1,
        "step": 0.01,
        "value": 0.01
      },
      {
        "key": "zero",
        "label": "零点偏移",
        "unit": "s",
        "min": -5,
        "max": 5,
        "step": 0.1,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "记录30个完整脉搏间隔，总时间24.0 s。",
      "steps": [
        {
          "title": "整理条件",
          "text": "记录30个完整脉搏间隔，总时间24.0 s。"
        },
        {
          "title": "选用依据",
          "text": "平均间隔=t/N。"
        },
        {
          "title": "代入求解",
          "text": "24.0/30=0.800 s。"
        },
        {
          "title": "写出结论",
          "text": "平均间隔0.800 s。"
        }
      ],
      "answer": "平均间隔0.800 s。"
    }
  },
  {
    "id": "phy-coin-size",
    "subject": "physics",
    "term": "8上",
    "chapter": "第一章 机械运动",
    "section": "1.1",
    "title": "硬币直径与周长的间接测量",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较辅助夹测、滚动或绕线的方法。",
    "apparatus": [
      "硬币",
      "刻度尺",
      "三角板",
      "细线"
    ],
    "steps": [
      "用两块平直挡板夹住硬币两侧。",
      "测两内侧间距作为直径。",
      "也可滚动一周测周长，并比较方法。"
    ],
    "observations": [
      "辅助工具使曲面物体边缘更容易定位。"
    ],
    "conclusion": "间接测量可把难测的几何量转成容易读取的长度。",
    "examPoints": [
      "挡板必须与尺垂直",
      "滚动一周要避免滑动"
    ],
    "pitfalls": [
      "不能把半径当直径"
    ],
    "questions": [
      {
        "q": "为什么测硬币直径常需要挡板？",
        "a": "挡板能把圆形边缘转化为两条易对齐刻度的边线，降低定位困难。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "measurement",
    "modelParams": {
      "scenario": "length",
      "variant": "coin-size"
    },
    "modelNote": "读数按给定分度值取整并示范零点修正；估读能力、视差和真实测量误差需结合器材训练。",
    "controls": [
      {
        "key": "value",
        "label": "待测量",
        "unit": "cm",
        "min": 0,
        "max": 200,
        "step": 0.01,
        "value": 12.34
      },
      {
        "key": "division",
        "label": "分度值",
        "unit": "cm",
        "min": 0.01,
        "max": 10,
        "step": 0.01,
        "value": 0.1
      },
      {
        "key": "zero",
        "label": "零点偏移",
        "unit": "cm",
        "min": -5,
        "max": 5,
        "step": 0.1,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么测硬币直径常需要挡板？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较辅助夹测、滚动或绕线的方法。"
        },
        {
          "title": "指出观察证据",
          "text": "辅助工具使曲面物体边缘更容易定位。"
        },
        {
          "title": "解释现象",
          "text": "间接测量可把难测的几何量转成容易读取的长度。"
        },
        {
          "title": "完整回答",
          "text": "挡板能把圆形边缘转化为两条易对齐刻度的边线，降低定位困难。"
        }
      ],
      "answer": "挡板能把圆形边缘转化为两条易对齐刻度的边线，降低定位困难。"
    }
  },
  {
    "id": "phy-paper-thickness",
    "subject": "physics",
    "term": "8上",
    "chapter": "第一章 机械运动",
    "section": "1.章末",
    "title": "叠纸测单张厚度",
    "kind": "小实验",
    "tags": [
      "复习与提高"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "通过多张总厚度除以张数降低相对测量影响。",
    "apparatus": [
      "纸张",
      "刻度尺"
    ],
    "steps": [
      "把相同纸张压平并数清张数。",
      "测量多张总厚度。",
      "总厚度除以张数，并用密绕金属丝作方法对照。"
    ],
    "observations": [
      "累计厚度比单张厚度更容易用毫米尺读准。"
    ],
    "conclusion": "累积法把小量放大后再平均，可以减小相对测量影响。",
    "examPoints": [
      "不得把封面或纸间空隙算入",
      "密绕线圈应无间隙、无重叠"
    ],
    "pitfalls": [
      "总厚度除的是张数，不是页码数"
    ],
    "questions": [
      {
        "q": "100张纸厚8.0 mm，单张厚度多少？",
        "a": "约0.080 mm。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "measurement",
    "modelParams": {
      "scenario": "length",
      "variant": "paper-thickness"
    },
    "modelNote": "交互读数表示整叠纸厚度；实际需再除以已计数的张数。单张厚度不能靠这把刻度尺直接测得，整叠应压紧但不损伤纸张。",
    "controls": [
      {
        "key": "value",
        "label": "整叠厚度",
        "unit": "cm",
        "min": 0.1,
        "max": 5,
        "step": 0.01,
        "value": 1
      },
      {
        "key": "division",
        "label": "分度值",
        "unit": "cm",
        "min": 0.01,
        "max": 0.2,
        "step": 0.01,
        "value": 0.1
      },
      {
        "key": "zero",
        "label": "零点偏移",
        "unit": "cm",
        "min": -5,
        "max": 5,
        "step": 0.1,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "100张纸总厚8.0 mm。",
      "steps": [
        {
          "title": "整理条件",
          "text": "100张纸总厚8.0 mm。"
        },
        {
          "title": "选用依据",
          "text": "单张厚度d=L/N。"
        },
        {
          "title": "代入求解",
          "text": "d=8.0/100=0.080 mm。"
        },
        {
          "title": "写出结论",
          "text": "单张约0.080 mm。"
        }
      ],
      "answer": "单张约0.080 mm。"
    }
  },
  {
    "id": "phy-incline-speed",
    "subject": "physics",
    "term": "8上",
    "chapter": "第一章 机械运动",
    "section": "1.4",
    "title": "小车全程与上半程平均速度",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "测量对应路程与运动时间，计算并比较平均速度。",
    "apparatus": [
      "小车",
      "斜面",
      "刻度尺",
      "秒表",
      "金属挡片"
    ],
    "steps": [
      "让小车从同一起点静止释放。",
      "测量全程与各分段的路程和用时。",
      "分别用对应s和t求平均速度并比较。"
    ],
    "observations": [
      "后半程与前半程路程相等，但后半程用时更短。"
    ],
    "conclusion": "小车下滑速度会变化；不同区间的平均速度应分别计算。",
    "examPoints": [
      "v=s/t",
      "全程速度不能直接平均两个半程速度"
    ],
    "pitfalls": [
      "改变参数后不能混用旧时间"
    ],
    "questions": [
      {
        "q": "全程0.80 m用2.00 s，平均速度多少？",
        "a": "全程平均速度0.40 m/s。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "incline",
    "modelParams": {
      "scenario": "speed",
      "variant": "incline-speed"
    },
    "modelNote": "运动由 Godot 刚体引擎计算；斜面光滑、忽略空气阻力，质量不改变理想下滑加速度。计时输出是模型值。",
    "controls": [
      {
        "key": "length",
        "label": "斜面路程",
        "unit": "m",
        "min": 0.5,
        "max": 2,
        "step": 0.05,
        "value": 1
      },
      {
        "key": "angle",
        "label": "斜面角度",
        "unit": "°",
        "min": 3,
        "max": 30,
        "step": 1,
        "value": 12
      },
      {
        "key": "mass",
        "label": "小车质量",
        "unit": "g",
        "min": 100,
        "max": 500,
        "step": 50,
        "value": 200
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "s=0.80 m，t=2.00 s。",
      "steps": [
        {
          "title": "整理条件",
          "text": "s=0.80 m，t=2.00 s。"
        },
        {
          "title": "选用依据",
          "text": "v=s/t。"
        },
        {
          "title": "代入求解",
          "text": "v=0.80/2.00=0.40 m/s。"
        },
        {
          "title": "写出结论",
          "text": "平均速度0.40 m/s。"
        }
      ],
      "answer": "平均速度0.40 m/s。"
    }
  },
  {
    "id": "phy-sensor-speed",
    "subject": "physics",
    "term": "8上",
    "chapter": "第一章 机械运动",
    "section": "1.4",
    "title": "传感器记录运动位置和速度",
    "kind": "拓展探究",
    "tags": [
      "拓展实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "用连续距离—时间记录得到小车或人的速度。",
    "apparatus": [
      "距离传感器",
      "计算机",
      "小车"
    ],
    "steps": [
      "设置位置采样的相同时间间隔。",
      "记录连续位置读数。",
      "计算相邻区间的路程与时间比并画图。"
    ],
    "observations": [
      "相等时间内距离增量相同表示匀速；增量变化表示快慢变化。"
    ],
    "conclusion": "位置—时间数据能够反映运动速度与变化趋势。",
    "examPoints": [
      "图像斜率与速度有关",
      "传感器读数仍有分辨率限制"
    ],
    "pitfalls": [
      "不能把位置直接当成路程增量"
    ],
    "questions": [
      {
        "q": "0.5 s内位置从0.20 m到0.80 m，平均速度多少？",
        "a": "此段平均速度1.2 m/s。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "motion",
    "modelParams": {
      "scenario": "uniform",
      "variant": "sensor-speed"
    },
    "modelNote": "由 Godot 刚体引擎计算运动；采用理想水平面和给定摩擦系数，不包含空气阻力或实物轮轴细节。",
    "controls": [
      {
        "key": "velocity",
        "label": "初速度",
        "unit": "m/s",
        "min": 0,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "duration",
        "label": "观察时长",
        "unit": "s",
        "min": 0.2,
        "max": 5,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "同一直线同向运动，位置从0.20 m变为0.80 m，间隔0.50 s。",
      "steps": [
        {
          "title": "整理条件",
          "text": "同一直线同向运动，位置从0.20 m变为0.80 m，间隔0.50 s。"
        },
        {
          "title": "选用依据",
          "text": "v=Δs/Δt。"
        },
        {
          "title": "代入求解",
          "text": "v=(0.80−0.20)/0.50=1.2 m/s。"
        },
        {
          "title": "写出结论",
          "text": "平均速度1.2 m/s。"
        }
      ],
      "answer": "平均速度1.2 m/s。"
    }
  },
  {
    "id": "phy-walking-speed",
    "subject": "physics",
    "term": "8上",
    "chapter": "第一章 机械运动",
    "section": "1.4",
    "title": "操场测步行速度并估算路程",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "已知路线长度，计时求速度，再估测通学路程。",
    "apparatus": [
      "已知长度跑道",
      "手表"
    ],
    "steps": [
      "选择已测长度的平直路线。",
      "按统一标准测步行用时。",
      "计算平均速度，再用速度估算相似步行条件下的路程。"
    ],
    "observations": [
      "步行节奏改变时平均速度也会改变。"
    ],
    "conclusion": "速度测量要有对应路程和时间；估测需说明适用条件。",
    "examPoints": [
      "骑行里程差与步行路线均可用s/t",
      "平均速度不要求全程匀速"
    ],
    "pitfalls": [
      "不能把静止休息时间随意删去而不说明区间"
    ],
    "questions": [
      {
        "q": "走60 m用50 s，平均速度是多少？",
        "a": "平均速度1.2 m/s。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "motion",
    "modelParams": {
      "scenario": "uniform",
      "variant": "walking-speed"
    },
    "modelNote": "由 Godot 刚体引擎计算运动；采用理想水平面和给定摩擦系数，不包含空气阻力或实物轮轴细节。",
    "controls": [
      {
        "key": "velocity",
        "label": "初速度",
        "unit": "m/s",
        "min": 0,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "duration",
        "label": "观察时长",
        "unit": "s",
        "min": 0.2,
        "max": 5,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "路程60 m，时间50 s。",
      "steps": [
        {
          "title": "整理条件",
          "text": "路程60 m，时间50 s。"
        },
        {
          "title": "选用依据",
          "text": "v=s/t。"
        },
        {
          "title": "代入求解",
          "text": "v=60/50=1.2 m/s。"
        },
        {
          "title": "写出结论",
          "text": "平均速度1.2 m/s。"
        }
      ],
      "answer": "平均速度1.2 m/s。"
    }
  },
  {
    "id": "phy-rubber-vibration",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.1",
    "title": "橡皮筋振动发声",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "拨动绷紧橡皮筋，联系振动与声音。",
    "apparatus": [
      "橡皮筋"
    ],
    "steps": [
      "拨动绷紧橡皮筋并观察。",
      "轻触喉部比较发声与停止发声。",
      "在鼓面放轻小颗粒显示微小振动。"
    ],
    "observations": [
      "发声物体在振动；振动停止后声源不再持续发声。"
    ],
    "conclusion": "声音由物体振动产生，可用放大现象帮助观察。",
    "examPoints": [
      "橡皮筋、声带、鼓面分别是声源",
      "转换法显示微小振动"
    ],
    "pitfalls": [
      "声源停止后已传播的声波不会立刻消失"
    ],
    "questions": [
      {
        "q": "鼓面放米粒的作用是什么？",
        "a": "把鼓面不易直接看清的振动，转换成颗粒可见的运动。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "amplitude",
      "variant": "rubber-vibration"
    },
    "modelNote": "波形与振幅为教学示意，振幅没有分贝单位；介质声速取常温近似值，图中速度不代表真实声传播画面。",
    "controls": [
      {
        "key": "amplitude",
        "label": "振幅（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "鼓面放米粒的作用是什么？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "拨动绷紧橡皮筋，联系振动与声音。"
        },
        {
          "title": "指出观察证据",
          "text": "发声物体在振动；振动停止后声源不再持续发声。"
        },
        {
          "title": "解释现象",
          "text": "声音由物体振动产生，可用放大现象帮助观察。"
        },
        {
          "title": "完整回答",
          "text": "把鼓面不易直接看清的振动，转换成颗粒可见的运动。"
        }
      ],
      "answer": "把鼓面不易直接看清的振动，转换成颗粒可见的运动。"
    }
  },
  {
    "id": "phy-vacuum-bell",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.1",
    "title": "抽气罩内铃声的变化",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "减少空气后声音减弱，以实验与推理讨论真空不传声。",
    "apparatus": [
      "玻璃罩",
      "闹钟",
      "抽气装置"
    ],
    "steps": [
      "将发声铃置于密闭罩。",
      "逐渐减少罩内空气，观察铃的振动和声音。",
      "恢复空气作对照。"
    ],
    "observations": [
      "空气减少时声音减弱，铃仍可振动。"
    ],
    "conclusion": "声音传播需要介质，结合抽气实验推理真空不能传声。",
    "examPoints": [
      "实验加科学推理",
      "不能把未抽尽空气称为绝对真空"
    ],
    "pitfalls": [
      "不能说声音减弱说明铃不再振动"
    ],
    "questions": [
      {
        "q": "为什么需要观察铃是否仍在工作？",
        "a": "排除声源停止发声的原因，才能研究空气对声音传播的作用。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "vacuum",
      "variant": "vacuum-bell"
    },
    "modelNote": "波形与振幅为教学示意，振幅没有分贝单位；介质声速取常温近似值，图中速度不代表真实声传播画面。",
    "controls": [
      {
        "key": "medium",
        "label": "介质",
        "options": [
          {
            "value": "air",
            "label": "空气"
          },
          {
            "value": "water",
            "label": "水"
          },
          {
            "value": "steel",
            "label": "钢"
          },
          {
            "value": "vacuum",
            "label": "真空"
          }
        ],
        "value": "vacuum"
      },
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      },
      {
        "key": "amplitude",
        "label": "振幅（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么需要观察铃是否仍在工作？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "减少空气后声音减弱，以实验与推理讨论真空不传声。"
        },
        {
          "title": "指出观察证据",
          "text": "空气减少时声音减弱，铃仍可振动。"
        },
        {
          "title": "解释现象",
          "text": "声音传播需要介质，结合抽气实验推理真空不能传声。"
        },
        {
          "title": "完整回答",
          "text": "排除声源停止发声的原因，才能研究空气对声音传播的作用。"
        }
      ],
      "answer": "排除声源停止发声的原因，才能研究空气对声音传播的作用。"
    }
  },
  {
    "id": "phy-water-wave-analogy",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.1",
    "title": "轻点水面观察波纹传播",
    "kind": "小实验",
    "tags": [
      "正文活动"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "借水面扰动传播帮助理解波的传播。",
    "apparatus": [
      "水槽",
      "水",
      "铅笔"
    ],
    "steps": [
      "轻点水面形成短促扰动。",
      "观察波纹向外扩展。",
      "用浮标比较传播方向和局部振动方向。"
    ],
    "observations": [
      "波纹向外传播，浮标主要在原处附近起伏。"
    ],
    "conclusion": "波能够传播扰动和能量，介质整体并不随波一路向外搬运。",
    "examPoints": [
      "类比有助于理解声波，但声波并非水面波"
    ],
    "pitfalls": [
      "不要把波速等同于浮标移动速度"
    ],
    "questions": [
      {
        "q": "波纹到远处是否表示原来的水全部流到那里？",
        "a": "不是，主要是扰动传到远处，而水在平衡位置附近运动。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "medium",
      "variant": "water-wave-analogy"
    },
    "modelNote": "波形与振幅为教学示意，振幅没有分贝单位；介质声速取常温近似值，图中速度不代表真实声传播画面。",
    "controls": [
      {
        "key": "medium",
        "label": "介质",
        "options": [
          {
            "value": "air",
            "label": "空气"
          },
          {
            "value": "water",
            "label": "水"
          },
          {
            "value": "steel",
            "label": "钢"
          },
          {
            "value": "vacuum",
            "label": "真空"
          }
        ],
        "value": "air"
      },
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      },
      {
        "key": "distance",
        "label": "传播距离",
        "unit": "m",
        "min": 1,
        "max": 500,
        "step": 1,
        "value": 34
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "波纹到远处是否表示原来的水全部流到那里？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "借水面扰动传播帮助理解波的传播。"
        },
        {
          "title": "指出观察证据",
          "text": "波纹向外传播，浮标主要在原处附近起伏。"
        },
        {
          "title": "解释现象",
          "text": "波能够传播扰动和能量，介质整体并不随波一路向外搬运。"
        },
        {
          "title": "完整回答",
          "text": "不是，主要是扰动传到远处，而水在平衡位置附近运动。"
        }
      ],
      "answer": "不是，主要是扰动传到远处，而水在平衡位置附近运动。"
    }
  },
  {
    "id": "phy-desk-sound",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.1",
    "title": "轻刮桌面检验固体传声",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较贴桌与离桌的听觉现象。",
    "apparatus": [
      "桌子"
    ],
    "steps": [
      "一人轻刮桌面，另一人在固定位置听。",
      "比较耳朵贴桌与离开桌面的效果。",
      "讨论可能的传播路径。"
    ],
    "observations": [
      "耳朵贴桌时可以更明显听到轻刮声。"
    ],
    "conclusion": "固体可以传声，声音不只通过空气传播。",
    "examPoints": [
      "比较时固定声源强弱与距离"
    ],
    "pitfalls": [
      "听起来更响不直接证明此实验测得固体声速"
    ],
    "questions": [
      {
        "q": "为什么耳朵贴桌能听到较轻的声音？",
        "a": "振动通过桌面传到耳部，增加了固体传声路径。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "medium",
      "variant": "desk-sound"
    },
    "modelNote": "介质选择用空气、水、钢的常温声速作比较；桌面材料不同，其真实声速不等于钢，图中信号仅说明固体能够传声。",
    "controls": [
      {
        "key": "medium",
        "label": "介质",
        "options": [
          {
            "value": "air",
            "label": "空气"
          },
          {
            "value": "water",
            "label": "水"
          },
          {
            "value": "steel",
            "label": "钢"
          },
          {
            "value": "vacuum",
            "label": "真空"
          }
        ],
        "value": "steel"
      },
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      },
      {
        "key": "distance",
        "label": "传播距离",
        "unit": "m",
        "min": 1,
        "max": 500,
        "step": 1,
        "value": 34
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么耳朵贴桌能听到较轻的声音？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较贴桌与离桌的听觉现象。"
        },
        {
          "title": "指出观察证据",
          "text": "耳朵贴桌时可以更明显听到轻刮声。"
        },
        {
          "title": "解释现象",
          "text": "固体可以传声，声音不只通过空气传播。"
        },
        {
          "title": "完整回答",
          "text": "振动通过桌面传到耳部，增加了固体传声路径。"
        }
      ],
      "answer": "振动通过桌面传到耳部，增加了固体传声路径。"
    }
  },
  {
    "id": "phy-cup-telephone",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.章末",
    "title": "纸杯棉线电话",
    "kind": "小实验",
    "tags": [
      "复习与提高"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较拉紧与松弛的线传声效果。",
    "apparatus": [
      "纸杯",
      "棉线",
      "小木棒"
    ],
    "steps": [
      "用棉线连接两只纸杯。",
      "拉紧线后在一端轻声说话。",
      "让线松弛或被轻握，再比较听感。"
    ],
    "observations": [
      "拉紧且不受阻挡的线传声效果通常更明显。"
    ],
    "conclusion": "杯底和线的振动能够传递声音。",
    "examPoints": [
      "声源、传声物和接收部分要区分"
    ],
    "pitfalls": [
      "不能把线电话解释成电流通信"
    ],
    "questions": [
      {
        "q": "握住线后声音为什么可能减弱？",
        "a": "握住线会抑制振动并增加能量损耗，使传到另一杯的振动减弱。"
      }
    ],
    "safety": [
      "拉线不可绕颈；制孔由教师协助。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "medium",
      "variant": "cup-telephone"
    },
    "modelNote": "纸杯和拉紧棉线传递机械振动；介质声速数值为参照材料示例，不是棉线电话的实测速度。松紧、阻尼与纸杯共振未定量模拟。",
    "controls": [
      {
        "key": "medium",
        "label": "介质",
        "options": [
          {
            "value": "air",
            "label": "空气"
          },
          {
            "value": "water",
            "label": "水"
          },
          {
            "value": "steel",
            "label": "钢"
          },
          {
            "value": "vacuum",
            "label": "真空"
          }
        ],
        "value": "steel"
      },
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      },
      {
        "key": "distance",
        "label": "传播距离",
        "unit": "m",
        "min": 1,
        "max": 500,
        "step": 1,
        "value": 34
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "握住线后声音为什么可能减弱？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较拉紧与松弛的线传声效果。"
        },
        {
          "title": "指出观察证据",
          "text": "拉紧且不受阻挡的线传声效果通常更明显。"
        },
        {
          "title": "解释现象",
          "text": "杯底和线的振动能够传递声音。"
        },
        {
          "title": "完整回答",
          "text": "握住线会抑制振动并增加能量损耗，使传到另一杯的振动减弱。"
        }
      ],
      "answer": "握住线会抑制振动并增加能量损耗，使传到另一杯的振动减弱。"
    }
  },
  {
    "id": "phy-ruler-pitch",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.2",
    "title": "钢尺伸出长度与音调",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "改变悬臂长度比较振动快慢与音调。",
    "apparatus": [
      "钢尺",
      "桌子"
    ],
    "steps": [
      "固定钢尺一端，先保持较长伸出长度。",
      "用相近幅度拨动，再缩短伸出长度。",
      "比较振动快慢、声音与同时间尺度波形。"
    ],
    "observations": [
      "伸出长度缩短时，振动通常更快、音调更高。"
    ],
    "conclusion": "音调由频率决定，频率越高，音调越高。",
    "examPoints": [
      "同时间内振动次数与频率关联"
    ],
    "pitfalls": [
      "大力拨动主要改变振幅，不能直接作为提高音调的方法"
    ],
    "questions": [
      {
        "q": "两个波形时间范围相同，振动次数多者音调如何？",
        "a": "频率较高，音调较高。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "pitch",
      "variant": "ruler-pitch"
    },
    "modelNote": "波形与振幅为教学示意，振幅没有分贝单位；介质声速取常温近似值，图中速度不代表真实声传播画面。",
    "controls": [
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      },
      {
        "key": "amplitude",
        "label": "振幅（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "两个波形时间范围相同，振动次数多者音调如何？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "改变悬臂长度比较振动快慢与音调。"
        },
        {
          "title": "指出观察证据",
          "text": "伸出长度缩短时，振动通常更快、音调更高。"
        },
        {
          "title": "解释现象",
          "text": "音调由频率决定，频率越高，音调越高。"
        },
        {
          "title": "完整回答",
          "text": "频率较高，音调较高。"
        }
      ],
      "answer": "频率较高，音调较高。"
    }
  },
  {
    "id": "phy-amplitude-ball",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.2",
    "title": "音叉弹球显示振幅与响度",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "改变敲击力度，通过乒乓球偏移比较振动幅度。",
    "apparatus": [
      "音叉",
      "软锤",
      "细线",
      "乒乓球"
    ],
    "steps": [
      "用悬线把轻球置于音叉附近。",
      "先轻敲音叉观察弹开程度。",
      "再较重敲击并比较声音与球的偏移。"
    ],
    "observations": [
      "较强敲击时振幅较大，球被弹开更明显。"
    ],
    "conclusion": "振幅影响响度；球的运动把音叉振动放大显示。",
    "examPoints": [
      "响度还受距离等因素影响"
    ],
    "pitfalls": [
      "不要把响度大说成音调高"
    ],
    "questions": [
      {
        "q": "这项实验为什么要固定听者位置？",
        "a": "响度受距离影响，固定位置便于比较振幅改变的作用。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "amplitude",
      "variant": "amplitude-ball"
    },
    "modelNote": "波形与振幅为教学示意，振幅没有分贝单位；介质声速取常温近似值，图中速度不代表真实声传播画面。",
    "controls": [
      {
        "key": "amplitude",
        "label": "振幅（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "这项实验为什么要固定听者位置？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "改变敲击力度，通过乒乓球偏移比较振动幅度。"
        },
        {
          "title": "指出观察证据",
          "text": "较强敲击时振幅较大，球被弹开更明显。"
        },
        {
          "title": "解释现象",
          "text": "振幅影响响度；球的运动把音叉振动放大显示。"
        },
        {
          "title": "完整回答",
          "text": "响度受距离影响，固定位置便于比较振幅改变的作用。"
        }
      ],
      "answer": "响度受距离影响，固定位置便于比较振幅改变的作用。"
    }
  },
  {
    "id": "phy-timbre-waveform",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.2",
    "title": "比较同音高乐器的波形",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较音叉、钢琴、长笛的波形形状。",
    "apparatus": [
      "同音高录音",
      "波形显示器"
    ],
    "steps": [
      "使不同声源发出相近音调和响度的声音。",
      "使用相同时间尺度显示波形。",
      "比较波形形状而非只数波峰。"
    ],
    "observations": [
      "周期相近时，波形形状仍可能不同。"
    ],
    "conclusion": "音色与声源振动的具体形式有关，可用波形差异辅助辨认。",
    "examPoints": [
      "音调、响度与音色是不同维度"
    ],
    "pitfalls": [
      "不能以音色不同推出基频一定不同"
    ],
    "questions": [
      {
        "q": "不同乐器演奏同一个音，为什么仍能辨别？",
        "a": "它们的振动组成和波形不同，形成不同音色。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "timbre",
      "variant": "timbre-waveform"
    },
    "modelNote": "波形与振幅为教学示意，振幅没有分贝单位；介质声速取常温近似值，图中速度不代表真实声传播画面。",
    "controls": [
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      },
      {
        "key": "amplitude",
        "label": "振幅（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "harmonic2",
        "label": "二次谐波相对系数",
        "unit": "",
        "min": 0,
        "max": 1,
        "step": 0.05,
        "value": 0.5
      },
      {
        "key": "harmonic3",
        "label": "三次谐波相对系数",
        "unit": "",
        "min": 0,
        "max": 1,
        "step": 0.05,
        "value": 0.25
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "不同乐器演奏同一个音，为什么仍能辨别？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较音叉、钢琴、长笛的波形形状。"
        },
        {
          "title": "指出观察证据",
          "text": "周期相近时，波形形状仍可能不同。"
        },
        {
          "title": "解释现象",
          "text": "音色与声源振动的具体形式有关，可用波形差异辅助辨认。"
        },
        {
          "title": "完整回答",
          "text": "它们的振动组成和波形不同，形成不同音色。"
        }
      ],
      "answer": "它们的振动组成和波形不同，形成不同音色。"
    }
  },
  {
    "id": "phy-bottle-xylophone",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.2",
    "title": "不同水位玻璃瓶的敲击音阶",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "改变加水量并比较敲击音调。",
    "apparatus": [
      "相同玻璃瓶",
      "水",
      "敲击棒"
    ],
    "steps": [
      "向相同玻璃瓶加入不同水量。",
      "用相同方式轻敲瓶体。",
      "按声音高低排列并重复比较。"
    ],
    "observations": [
      "敲击相同瓶体时，加水通常使振动频率降低。"
    ],
    "conclusion": "改变振动系统的条件可以改变音调；敲击瓶体与吹瓶口的声源不同。",
    "examPoints": [
      "敲瓶主要研究瓶与水的振动",
      "吹瓶主要研究空气柱"
    ],
    "pitfalls": [
      "不能把吹瓶的水量规律直接用于敲瓶"
    ],
    "questions": [
      {
        "q": "为什么必须先说清是敲瓶还是吹瓶？",
        "a": "两种方式的主要振动系统不同，水量对音调的影响规律可能相反。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "pitch",
      "variant": "bottle-xylophone"
    },
    "modelNote": "波形与振幅为教学示意，振幅没有分贝单位；介质声速取常温近似值，图中速度不代表真实声传播画面。",
    "controls": [
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      },
      {
        "key": "amplitude",
        "label": "振幅（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么必须先说清是敲瓶还是吹瓶？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "改变加水量并比较敲击音调。"
        },
        {
          "title": "指出观察证据",
          "text": "敲击相同瓶体时，加水通常使振动频率降低。"
        },
        {
          "title": "解释现象",
          "text": "改变振动系统的条件可以改变音调；敲击瓶体与吹瓶口的声源不同。"
        },
        {
          "title": "完整回答",
          "text": "两种方式的主要振动系统不同，水量对音调的影响规律可能相反。"
        }
      ],
      "answer": "两种方式的主要振动系统不同，水量对音调的影响规律可能相反。"
    }
  },
  {
    "id": "phy-piston-flute",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.2",
    "title": "活塞式哨管调音",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "移动活塞改变空气柱长度，比较音调。",
    "apparatus": [
      "管子",
      "活塞"
    ],
    "steps": [
      "保持吹气方式近似不变。",
      "移动活塞改变有效空气柱长度。",
      "比较不同位置的音调。"
    ],
    "observations": [
      "空气柱变短时，常见哨管音调升高。"
    ],
    "conclusion": "空气柱的振动条件决定其发声频率。",
    "examPoints": [
      "管口边界条件会影响共鸣模式"
    ],
    "pitfalls": [
      "不能把吹气越强普遍等同于音调越高"
    ],
    "questions": [
      {
        "q": "活塞向内推使空气柱缩短，音调通常怎样？",
        "a": "通常升高，因为对应的主要共振频率增大。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "pitch",
      "variant": "piston-flute"
    },
    "modelNote": "波形与振幅为教学示意，振幅没有分贝单位；介质声速取常温近似值，图中速度不代表真实声传播画面。",
    "controls": [
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      },
      {
        "key": "amplitude",
        "label": "振幅（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "活塞向内推使空气柱缩短，音调通常怎样？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "移动活塞改变空气柱长度，比较音调。"
        },
        {
          "title": "指出观察证据",
          "text": "空气柱变短时，常见哨管音调升高。"
        },
        {
          "title": "解释现象",
          "text": "空气柱的振动条件决定其发声频率。"
        },
        {
          "title": "完整回答",
          "text": "通常升高，因为对应的主要共振频率增大。"
        }
      ],
      "answer": "通常升高，因为对应的主要共振频率增大。"
    }
  },
  {
    "id": "phy-speaker-candle",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.3",
    "title": "扬声器使附近烛焰颤动",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "由烛焰运动观察声携带能量。",
    "apparatus": [
      "扬声器",
      "蜡烛",
      "音频源"
    ],
    "steps": [
      "将可视指示物置于扬声器附近。",
      "播放低频声音并观察指示物运动。",
      "保持距离，改变振幅比较效果。"
    ],
    "observations": [
      "声音较强时，轻小指示物或烛焰可发生振动。"
    ],
    "conclusion": "声波能够传递能量。",
    "examPoints": [
      "能量传递与信息传递是声音的两类作用"
    ],
    "pitfalls": [
      "不可把明火靠近电器作为家庭操作"
    ],
    "questions": [
      {
        "q": "声源没有碰到指示物，为什么它会动？",
        "a": "振动通过空气传递，声波把能量传给指示物。"
      }
    ],
    "safety": [
      "教师控制火源；不能将扬声器气流影响当唯一可量化声能指标。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "amplitude",
      "variant": "speaker-candle"
    },
    "modelNote": "波形与振幅为教学示意，振幅没有分贝单位；介质声速取常温近似值，图中速度不代表真实声传播画面。",
    "controls": [
      {
        "key": "amplitude",
        "label": "振幅（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "声源没有碰到指示物，为什么它会动？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "由烛焰运动观察声携带能量。"
        },
        {
          "title": "指出观察证据",
          "text": "声音较强时，轻小指示物或烛焰可发生振动。"
        },
        {
          "title": "解释现象",
          "text": "声波能够传递能量。"
        },
        {
          "title": "完整回答",
          "text": "振动通过空气传递，声波把能量传给指示物。"
        }
      ],
      "answer": "振动通过空气传递，声波把能量传给指示物。"
    }
  },
  {
    "id": "phy-noise-waveform",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.4",
    "title": "比较刮擦噪声与音叉波形",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较有规则振动和不规则振动。",
    "apparatus": [
      "泡沫块",
      "玻璃",
      "拾音设备",
      "音叉"
    ],
    "steps": [
      "记录音叉和刮擦声。",
      "用同样时间尺度显示波形。",
      "比较规律性并结合使用情境判断噪声。"
    ],
    "observations": [
      "刮擦声波形通常更杂乱；环境中的噪声还与是否干扰活动有关。"
    ],
    "conclusion": "物理上噪声常对应不规则振动；环境角度看，干扰生活学习的声音也是噪声。",
    "examPoints": [
      "悦耳音乐在不适当场合也可成为噪声"
    ],
    "pitfalls": [
      "不能只按个人是否喜欢判定波形的规则性"
    ],
    "questions": [
      {
        "q": "规则振动发出的音乐一定不是环境噪声吗？",
        "a": "不一定，若妨碍休息学习，也可构成环境噪声。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "noise",
      "variant": "noise-waveform"
    },
    "modelNote": "通过相对振幅和波形观察噪声变化；声学隔音性能、吸声系数与分贝不在模型中定量计算。降低相对振幅表示减弱声音，不等同于固定分贝差。",
    "controls": [
      {
        "key": "amplitude",
        "label": "振幅（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "规则振动发出的音乐一定不是环境噪声吗？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较有规则振动和不规则振动。"
        },
        {
          "title": "指出观察证据",
          "text": "刮擦声波形通常更杂乱；环境中的噪声还与是否干扰活动有关。"
        },
        {
          "title": "解释现象",
          "text": "物理上噪声常对应不规则振动；环境角度看，干扰生活学习的声音也是噪声。"
        },
        {
          "title": "完整回答",
          "text": "不一定，若妨碍休息学习，也可构成环境噪声。"
        }
      ],
      "answer": "不一定，若妨碍休息学习，也可构成环境噪声。"
    }
  },
  {
    "id": "phy-soundproof-room",
    "subject": "physics",
    "term": "8上",
    "chapter": "第二章 声现象",
    "section": "2.5",
    "title": "隔音房间模型的设计与测试",
    "kind": "拓展探究",
    "tags": [
      "跨学科实践"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较加衬材料前后的声音强弱及占用空间。",
    "apparatus": [
      "纸盒",
      "闹钟",
      "衬垫材料",
      "声音测量设备"
    ],
    "steps": [
      "明确声源、传播路线和测量位置。",
      "比较不同衬材与缝隙条件。",
      "保持同一声源和距离，多次记录相对强度。"
    ],
    "observations": [
      "增加合适隔声措施通常降低接收位置的声音。"
    ],
    "conclusion": "控制噪声可在声源、传播途径和人耳处采取措施。",
    "examPoints": [
      "测试需固定音量与测量位置",
      "吸声与隔声机理并非完全一样"
    ],
    "pitfalls": [
      "本模拟相对强度不是实测分贝",
      "脉搏观察不能据一次相关性断言因果"
    ],
    "questions": [
      {
        "q": "怎样公平比较两种隔音材料？",
        "a": "保持声源、房间尺寸、开口和接收位置相同，只更换材料并重复测量。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "sound",
    "modelParams": {
      "scenario": "noise",
      "variant": "soundproof-room"
    },
    "modelNote": "通过相对振幅和波形观察噪声变化；声学隔音性能、吸声系数与分贝不在模型中定量计算。降低相对振幅表示减弱声音，不等同于固定分贝差。",
    "controls": [
      {
        "key": "amplitude",
        "label": "振幅（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "frequency",
        "label": "频率",
        "unit": "Hz",
        "min": 20,
        "max": 2000,
        "step": 10,
        "value": 440
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "怎样公平比较两种隔音材料？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较加衬材料前后的声音强弱及占用空间。"
        },
        {
          "title": "指出观察证据",
          "text": "增加合适隔声措施通常降低接收位置的声音。"
        },
        {
          "title": "解释现象",
          "text": "控制噪声可在声源、传播途径和人耳处采取措施。"
        },
        {
          "title": "完整回答",
          "text": "保持声源、房间尺寸、开口和接收位置相同，只更换材料并重复测量。"
        }
      ],
      "answer": "保持声源、房间尺寸、开口和接收位置相同，只更换材料并重复测量。"
    }
  },
  {
    "id": "phy-temperature-sensation",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.1",
    "title": "冷热适应后对同杯水的感觉",
    "kind": "小实验",
    "tags": [
      "问题"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较感官判断与温度计读数。",
    "apparatus": [
      "冷水",
      "温水",
      "温热水"
    ],
    "steps": [
      "先分别接触安全范围的冷水与温水。",
      "再把两只手接触同一杯中温水。",
      "用温度计检验实际温度。"
    ],
    "observations": [
      "同一杯水可能给两只手不同的冷热感觉。"
    ],
    "conclusion": "感觉受适应影响，测温应依靠经标定的仪器。",
    "examPoints": [
      "温度表示冷热程度",
      "感觉不可靠不等于完全无用"
    ],
    "pitfalls": [
      "不以皮肤感觉替代安全温度判断"
    ],
    "questions": [
      {
        "q": "同一杯水一只手觉得冷、一只手觉得热，水温矛盾吗？",
        "a": "不矛盾，水温相同；两只手先前温度和适应状态不同。"
      }
    ],
    "safety": [
      "用安全温水，不能用烫水。"
    ],
    "model": "measurement",
    "modelParams": {
      "scenario": "temperature",
      "variant": "temperature-sensation"
    },
    "modelNote": "读数按给定分度值取整并示范零点修正；估读能力、视差和真实测量误差需结合器材训练。",
    "controls": [
      {
        "key": "value",
        "label": "待测量",
        "unit": "℃",
        "min": -10,
        "max": 100,
        "step": 0.1,
        "value": 35
      },
      {
        "key": "division",
        "label": "分度值",
        "unit": "℃",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "zero",
        "label": "零点偏移",
        "unit": "℃",
        "min": -5,
        "max": 5,
        "step": 0.1,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "同一杯水一只手觉得冷、一只手觉得热，水温矛盾吗？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较感官判断与温度计读数。"
        },
        {
          "title": "指出观察证据",
          "text": "同一杯水可能给两只手不同的冷热感觉。"
        },
        {
          "title": "解释现象",
          "text": "感觉受适应影响，测温应依靠经标定的仪器。"
        },
        {
          "title": "完整回答",
          "text": "不矛盾，水温相同；两只手先前温度和适应状态不同。"
        }
      ],
      "answer": "不矛盾，水温相同；两只手先前温度和适应状态不同。"
    }
  },
  {
    "id": "phy-homemade-thermometer",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.1",
    "title": "细管液体温度计模型",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "观察热胀冷缩并讨论细管粗细与灵敏度。",
    "apparatus": [
      "小瓶",
      "带色水",
      "细管",
      "塞子"
    ],
    "steps": [
      "用密封储液瓶连接细管。",
      "改变周围温度观察液面。",
      "讨论如何标出标准温度点与刻度。"
    ],
    "observations": [
      "在合适液体和温度范围内，升温时液面上升。"
    ],
    "conclusion": "液体热胀冷缩可转换为液柱长度变化，标定后可用于测温。",
    "examPoints": [
      "细管放大液体体积变化",
      "未标定装置只能判断变化不能精确读温度"
    ],
    "pitfalls": [
      "不能认为所有物质体积随温度都等比例变化"
    ],
    "questions": [
      {
        "q": "为什么常把细管做得较细？",
        "a": "相同体积变化对应更大液面高度变化，便于观察。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "measurement",
    "modelParams": {
      "scenario": "temperature",
      "variant": "homemade-thermometer"
    },
    "modelNote": "读数按给定分度值取整并示范零点修正；估读能力、视差和真实测量误差需结合器材训练。",
    "controls": [
      {
        "key": "value",
        "label": "待测量",
        "unit": "℃",
        "min": -10,
        "max": 100,
        "step": 0.1,
        "value": 35
      },
      {
        "key": "division",
        "label": "分度值",
        "unit": "℃",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "zero",
        "label": "零点偏移",
        "unit": "℃",
        "min": -5,
        "max": 5,
        "step": 0.1,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么常把细管做得较细？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "观察热胀冷缩并讨论细管粗细与灵敏度。"
        },
        {
          "title": "指出观察证据",
          "text": "在合适液体和温度范围内，升温时液面上升。"
        },
        {
          "title": "解释现象",
          "text": "液体热胀冷缩可转换为液柱长度变化，标定后可用于测温。"
        },
        {
          "title": "完整回答",
          "text": "相同体积变化对应更大液面高度变化，便于观察。"
        }
      ],
      "answer": "相同体积变化对应更大液面高度变化，便于观察。"
    }
  },
  {
    "id": "phy-water-thermometer",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.1",
    "title": "温度计测量不同水温",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "检查量程分度值并在示数稳定时正确读数。",
    "apparatus": [
      "液体温度计",
      "烧杯",
      "水"
    ],
    "steps": [
      "检查量程和分度值。",
      "让感温部分充分接触待测液体且不碰容器底壁。",
      "待示数稳定后在液体中读数并记录。"
    ],
    "observations": [
      "探头接触不充分或碰热杯壁时读数可能偏离液体代表温度。"
    ],
    "conclusion": "正确测温需保证热接触、足够响应时间和合适读数方式。",
    "examPoints": [
      "普通实验温度计通常不能取出后再读"
    ],
    "pitfalls": [
      "量程不合适不能靠估计补救"
    ],
    "questions": [
      {
        "q": "为什么要等温度计示数稳定？",
        "a": "温度计需要与被测物体达到近似热平衡，过早读数会有响应误差。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "measurement",
    "modelParams": {
      "scenario": "temperature",
      "variant": "water-thermometer"
    },
    "modelNote": "读数按给定分度值取整并示范零点修正；估读能力、视差和真实测量误差需结合器材训练。",
    "controls": [
      {
        "key": "value",
        "label": "待测量",
        "unit": "℃",
        "min": -10,
        "max": 100,
        "step": 0.1,
        "value": 35
      },
      {
        "key": "division",
        "label": "分度值",
        "unit": "℃",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "zero",
        "label": "零点偏移",
        "unit": "℃",
        "min": -5,
        "max": 5,
        "step": 0.1,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么要等温度计示数稳定？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "检查量程分度值并在示数稳定时正确读数。"
        },
        {
          "title": "指出观察证据",
          "text": "探头接触不充分或碰热杯壁时读数可能偏离液体代表温度。"
        },
        {
          "title": "解释现象",
          "text": "正确测温需保证热接触、足够响应时间和合适读数方式。"
        },
        {
          "title": "完整回答",
          "text": "温度计需要与被测物体达到近似热平衡，过早读数会有响应误差。"
        }
      ],
      "answer": "温度计需要与被测物体达到近似热平衡，过早读数会有响应误差。"
    }
  },
  {
    "id": "phy-bimetal-thermometer",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.1",
    "title": "双金属片指针温度计设计",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "利用两种金属膨胀差异转换为指针偏转。",
    "apparatus": [
      "双金属片",
      "指针",
      "刻度盘"
    ],
    "steps": [
      "观察两层不同金属组成的薄片。",
      "比较温度改变前后的弯曲。",
      "把弯曲转换成指针偏转并讨论标定。"
    ],
    "observations": [
      "温度变化时两种金属膨胀程度不同，组合片弯曲。"
    ],
    "conclusion": "不同材料热膨胀差异可以用于温度指示。",
    "examPoints": [
      "指针方向取决于两层材料与连接方式"
    ],
    "pitfalls": [
      "不能仅凭温度升高断言总向左弯"
    ],
    "questions": [
      {
        "q": "两种金属为什么会使片弯曲？",
        "a": "它们膨胀量不同却结合在一起，受到相互约束而形成弯曲。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "bimetal",
      "variant": "bimetal-thermometer"
    },
    "modelNote": "按能量关系计算，默认不计散热且比热容保持常数；温度模型不包含熔化和沸腾，相变需在物态变化实验中观察。",
    "controls": [
      {
        "key": "length",
        "label": "金属片原长",
        "unit": "m",
        "min": 0.05,
        "max": 0.5,
        "step": 0.01,
        "value": 0.2
      },
      {
        "key": "deltaT",
        "label": "温度变化",
        "unit": "℃",
        "min": -40,
        "max": 100,
        "step": 5,
        "value": 60
      },
      {
        "key": "alpha1",
        "label": "材料一线膨胀系数",
        "unit": "1/℃",
        "min": 5e-06,
        "max": 3e-05,
        "step": 1e-06,
        "value": 1.9e-05
      },
      {
        "key": "alpha2",
        "label": "材料二线膨胀系数",
        "unit": "1/℃",
        "min": 5e-06,
        "max": 3e-05,
        "step": 1e-06,
        "value": 1.2e-05
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "两种金属为什么会使片弯曲？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "利用两种金属膨胀差异转换为指针偏转。"
        },
        {
          "title": "指出观察证据",
          "text": "温度变化时两种金属膨胀程度不同，组合片弯曲。"
        },
        {
          "title": "解释现象",
          "text": "不同材料热膨胀差异可以用于温度指示。"
        },
        {
          "title": "完整回答",
          "text": "它们膨胀量不同却结合在一起，受到相互约束而形成弯曲。"
        }
      ],
      "answer": "它们膨胀量不同却结合在一起，受到相互约束而形成弯曲。"
    }
  },
  {
    "id": "phy-ice-melting",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.2",
    "title": "室温下冰水混合物的温度",
    "kind": "小实验",
    "tags": [
      "正文活动"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "同时观察冰量减少与混合物温度。",
    "apparatus": [
      "冰",
      "水",
      "碗",
      "温度计"
    ],
    "steps": [
      "把冰水混合物置于较暖环境。",
      "记录温度并观察冰量变化。",
      "比较冰未熔完与全部熔化后的温度。"
    ],
    "observations": [
      "冰和水共存并充分接触时，温度接近0 ℃；冰量逐渐减少。"
    ],
    "conclusion": "晶体熔化时吸热但温度可保持不变。",
    "examPoints": [
      "吸热不一定升温",
      "这里需正常压强和近似纯净物条件"
    ],
    "pitfalls": [
      "不能把杯壁温度当冰水混合物温度"
    ],
    "questions": [
      {
        "q": "冰在减少而温度不变，是否说明没有吸热？",
        "a": "不是，吸收的热量用于物态变化。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "melting",
      "variant": "ice-melting",
      "material": "water"
    },
    "modelNote": "纯冰与水在正常压强下采用0℃相变平台；不包含盐、酒精等混合物的凝固点下降，也不模拟过冷。",
    "controls": [
      {
        "key": "mass",
        "label": "水或冰质量",
        "unit": "kg",
        "min": 0.05,
        "max": 1,
        "step": 0.05,
        "value": 0.1
      },
      {
        "key": "power",
        "label": "加热/放热功率",
        "unit": "W",
        "min": 10,
        "max": 1000,
        "step": 10,
        "value": 100
      },
      {
        "key": "time",
        "label": "时间",
        "unit": "s",
        "min": 0,
        "max": 1200,
        "step": 10,
        "value": 100
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": -20,
        "max": 100,
        "step": 1,
        "value": -10
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "冰在减少而温度不变，是否说明没有吸热？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "同时观察冰量减少与混合物温度。"
        },
        {
          "title": "指出观察证据",
          "text": "冰和水共存并充分接触时，温度接近0 ℃；冰量逐渐减少。"
        },
        {
          "title": "解释现象",
          "text": "晶体熔化时吸热但温度可保持不变。"
        },
        {
          "title": "完整回答",
          "text": "不是，吸收的热量用于物态变化。"
        }
      ],
      "answer": "不是，吸收的热量用于物态变化。"
    }
  },
  {
    "id": "phy-melting-curves",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.2",
    "title": "海波与石蜡的熔化过程比较",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "以温度—时间记录区分晶体和非晶体的熔化特征。",
    "apparatus": [
      "海波",
      "石蜡",
      "试管",
      "水浴",
      "温度计",
      "计时器"
    ],
    "steps": [
      "分别对晶体与非晶体样品缓慢加热。",
      "按相同间隔记录温度与状态。",
      "绘制曲线并比较熔化阶段。"
    ],
    "observations": [
      "晶体可出现温度近似不变的熔化平台，石蜡等材料常逐渐变软。"
    ],
    "conclusion": "晶体有确定熔点；典型非晶体没有确定熔点。",
    "examPoints": [
      "图像平台需结合状态变化判定",
      "用水浴使加热更均匀"
    ],
    "pitfalls": [
      "不可只看升温快慢判断晶体，应结合熔化时是否持续吸热和固液共存状态。"
    ],
    "questions": [
      {
        "q": "怎样从曲线判断某样品是否有确定熔点？",
        "a": "观察固液共存并持续吸热时是否存在稳定温度平台，同时排除实验条件变化。"
      }
    ],
    "safety": [
      "热水浴、热玻璃和样品由教师指导操作；不直接接触或品尝化学样品。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "melting",
      "variant": "melting-curves"
    },
    "modelNote": "海波采用48℃理想熔化平台，石蜡采用50–60℃题设软化区间；海波和石蜡的比热容、相变热均为题设系数，并非样品实测值。曲线超出适用温区时停止外推。",
    "controls": [
      {
        "key": "material",
        "label": "物质",
        "options": [
          {
            "value": "hypo",
            "label": "海波"
          },
          {
            "value": "wax",
            "label": "石蜡"
          }
        ],
        "value": "hypo"
      },
      {
        "key": "mass",
        "label": "样品质量",
        "unit": "kg",
        "min": 0.05,
        "max": 1,
        "step": 0.05,
        "value": 0.1
      },
      {
        "key": "power",
        "label": "加热/放热功率",
        "unit": "W",
        "min": 10,
        "max": 1000,
        "step": 10,
        "value": 100
      },
      {
        "key": "time",
        "label": "时间",
        "unit": "s",
        "min": 0,
        "max": 1200,
        "step": 10,
        "value": 300
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": 0,
        "max": 45,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "怎样从曲线判断某样品是否有确定熔点？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "以温度—时间记录区分晶体和非晶体的熔化特征。"
        },
        {
          "title": "指出观察证据",
          "text": "晶体可出现温度近似不变的熔化平台，石蜡等材料常逐渐变软。"
        },
        {
          "title": "解释现象",
          "text": "晶体有确定熔点；典型非晶体没有确定熔点。"
        },
        {
          "title": "完整回答",
          "text": "观察固液共存并持续吸热时是否存在稳定温度平台，同时排除实验条件变化。"
        }
      ],
      "answer": "观察固液共存并持续吸热时是否存在稳定温度平台，同时排除实验条件变化。"
    }
  },
  {
    "id": "phy-freezing-mixture",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.2",
    "title": "水与酒精混合液的低温现象",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "由混合液低于0摄氏度仍未凝固提出猜想。",
    "apparatus": [
      "混合液",
      "温度计",
      "低温环境"
    ],
    "steps": [
      "比较纯水与水酒精混合物。",
      "观察在相同低温环境中的状态。",
      "讨论成分对凝固温度的影响。"
    ],
    "observations": [
      "混合物在纯水通常结冰的温度附近仍可能保持液态。"
    ],
    "conclusion": "混合物的凝固行为与纯水不同，凝固温度受成分影响。",
    "examPoints": [
      "0 ℃是特定条件下纯水的凝固点"
    ],
    "pitfalls": [
      "不能把所有液体凝固点都写成0 ℃"
    ],
    "questions": [
      {
        "q": "液体低于0 ℃仍不结冰，一定测温错误吗？",
        "a": "不一定，它可能不是纯水，或者存在其他影响凝固的条件。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "mixture",
      "variant": "freezing-mixture"
    },
    "modelNote": "定性比较纯水与水酒精混合液的凝固行为，不由浓度计算未经核验的精确凝固点；状态判断还取决于温度，进度只表示观察过程。",
    "controls": [
      {
        "key": "concentration",
        "label": "乙醇质量分数（题设）",
        "unit": "%",
        "min": 0,
        "max": 30,
        "step": 1,
        "value": 10
      },
      {
        "key": "action",
        "label": "变化过程",
        "options": [
          {
            "value": "warming",
            "label": "温热"
          },
          {
            "value": "cooling",
            "label": "冷却"
          }
        ],
        "value": "cooling"
      },
      {
        "key": "progress",
        "label": "观察进度",
        "unit": "",
        "min": 0,
        "max": 1,
        "step": 0.05,
        "value": 0.5
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "液体低于0 ℃仍不结冰，一定测温错误吗？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "由混合液低于0摄氏度仍未凝固提出猜想。"
        },
        {
          "title": "指出观察证据",
          "text": "混合物在纯水通常结冰的温度附近仍可能保持液态。"
        },
        {
          "title": "解释现象",
          "text": "混合物的凝固行为与纯水不同，凝固温度受成分影响。"
        },
        {
          "title": "完整回答",
          "text": "不一定，它可能不是纯水，或者存在其他影响凝固的条件。"
        }
      ],
      "answer": "不一定，它可能不是纯水，或者存在其他影响凝固的条件。"
    }
  },
  {
    "id": "phy-alcohol-bag",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.3",
    "title": "密封软袋中的汽化和液化",
    "kind": "小实验",
    "tags": [
      "问题"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "观察少量液体受热与降温引起的状态和袋体积变化。",
    "apparatus": [
      "软塑料袋",
      "少量酒精",
      "温水浴"
    ],
    "steps": [
      "观察密封软袋内少量液体。",
      "在安全温水模型中升温，再降温。",
      "比较液体、气体和袋体积变化。"
    ],
    "observations": [
      "受热时部分液体汽化，降温后部分气体液化。"
    ],
    "conclusion": "汽化吸热、液化放热，物态变化可影响密闭软袋体积。",
    "examPoints": [
      "袋变大并不意味着质量增加"
    ],
    "pitfalls": [
      "不能将蒸气与可见白雾混淆"
    ],
    "questions": [
      {
        "q": "软袋冷却后为什么可能变瘪？",
        "a": "部分蒸气液化，气体物质的量减少，外界压力使软袋收缩。"
      }
    ],
    "safety": [
      "酒精易燃；只作模拟或教师安全演示，不用火直接加热。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "alcohol_cycle",
      "variant": "alcohol-bag"
    },
    "modelNote": "按温热或冷却过程定性演示酒精汽化与液化；不输出套用水参数的温度、潜热或质量变化，进度是教学观察尺度。只用教师准备的安全演示资料。",
    "controls": [
      {
        "key": "action",
        "label": "变化过程",
        "options": [
          {
            "value": "warming",
            "label": "温热"
          },
          {
            "value": "cooling",
            "label": "冷却"
          }
        ],
        "value": "cooling"
      },
      {
        "key": "progress",
        "label": "观察进度",
        "unit": "",
        "min": 0,
        "max": 1,
        "step": 0.05,
        "value": 0.5
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "软袋冷却后为什么可能变瘪？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "观察少量液体受热与降温引起的状态和袋体积变化。"
        },
        {
          "title": "指出观察证据",
          "text": "受热时部分液体汽化，降温后部分气体液化。"
        },
        {
          "title": "解释现象",
          "text": "汽化吸热、液化放热，物态变化可影响密闭软袋体积。"
        },
        {
          "title": "完整回答",
          "text": "部分蒸气液化，气体物质的量减少，外界压力使软袋收缩。"
        }
      ],
      "answer": "部分蒸气液化，气体物质的量减少，外界压力使软袋收缩。"
    }
  },
  {
    "id": "phy-boiling-water",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.3",
    "title": "水沸腾前后的温度曲线",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "连续测温并观察气泡，判定沸腾需持续吸热。",
    "apparatus": [
      "烧杯",
      "水",
      "热源",
      "温度计",
      "秒表"
    ],
    "steps": [
      "连续给水加热，按相同间隔测温。",
      "观察水中气泡变化。",
      "沸腾后继续记录，再停止加热。"
    ],
    "observations": [
      "达到沸点并持续加热时，水大量汽化而温度近似不变。"
    ],
    "conclusion": "沸腾是液体内部和表面同时发生的剧烈汽化，需要持续吸热。",
    "examPoints": [
      "沸点受压强影响",
      "气泡上升时大小变化与周围水温相关"
    ],
    "pitfalls": [
      "不能把水达到100 ℃作为任何条件下沸腾的充分条件"
    ],
    "questions": [
      {
        "q": "沸腾后继续加热，水温为什么近似不变？",
        "a": "输入能量主要用于汽化，而不是继续提高液体温度。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "boiling",
      "variant": "boiling-water"
    },
    "modelNote": "数值曲线采用给定物质的理想热量与状态关系；忽略散热、过冷和加热器惯性，平台表示相变中仍在吸热或放热。",
    "controls": [
      {
        "key": "mass",
        "label": "样品质量",
        "unit": "kg",
        "min": 0.05,
        "max": 1,
        "step": 0.05,
        "value": 0.1
      },
      {
        "key": "power",
        "label": "加热/放热功率",
        "unit": "W",
        "min": 10,
        "max": 200,
        "step": 10,
        "value": 100
      },
      {
        "key": "time",
        "label": "时间",
        "unit": "s",
        "min": 0,
        "max": 500,
        "step": 10,
        "value": 500
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": -20,
        "max": 90,
        "step": 1,
        "value": 20
      },
      {
        "key": "pressure",
        "label": "外界压强",
        "unit": "kPa",
        "min": 60,
        "max": 110,
        "step": 0.1,
        "value": 101.3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "沸腾后继续加热，水温为什么近似不变？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "连续测温并观察气泡，判定沸腾需持续吸热。"
        },
        {
          "title": "指出观察证据",
          "text": "达到沸点并持续加热时，水大量汽化而温度近似不变。"
        },
        {
          "title": "解释现象",
          "text": "沸腾是液体内部和表面同时发生的剧烈汽化，需要持续吸热。"
        },
        {
          "title": "完整回答",
          "text": "输入能量主要用于汽化，而不是继续提高液体温度。"
        }
      ],
      "answer": "输入能量主要用于汽化，而不是继续提高液体温度。"
    }
  },
  {
    "id": "phy-paper-pot",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.3",
    "title": "纸锅盛水加热现象",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "解释有水部分温度受水传热限制的现象。",
    "apparatus": [
      "纸锅",
      "水",
      "热源"
    ],
    "steps": [
      "在模拟中比较干纸受热与盛水纸容器受热。",
      "观察与水接触部分温度。",
      "分析水吸热对纸温度的限制。"
    ],
    "observations": [
      "有水接触且加热适当时，纸的温度可能保持在着火温度以下。"
    ],
    "conclusion": "水持续吸热使接触部分不易升到燃点，不能据此认为纸不可燃。",
    "examPoints": [
      "纸锅烧水是传热与沸腾共同作用"
    ],
    "pitfalls": [
      "不能让纸容器烧干，也不能把课堂现象当安全烹饪方法"
    ],
    "questions": [
      {
        "q": "纸锅没有立即燃烧，是否说明纸不是可燃物？",
        "a": "不是，关键是有水时纸的温度可能未达到燃点。"
      }
    ],
    "safety": [
      "只作模拟或教师演示；空烧与水面上纸边可着火，纸燃点也非普适固定数值。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "boiling",
      "variant": "paper-pot"
    },
    "modelNote": "数值曲线采用给定物质的理想热量与状态关系；忽略散热、过冷和加热器惯性，平台表示相变中仍在吸热或放热。",
    "controls": [
      {
        "key": "mass",
        "label": "样品质量",
        "unit": "kg",
        "min": 0.05,
        "max": 1,
        "step": 0.05,
        "value": 0.1
      },
      {
        "key": "power",
        "label": "加热/放热功率",
        "unit": "W",
        "min": 10,
        "max": 200,
        "step": 10,
        "value": 100
      },
      {
        "key": "time",
        "label": "时间",
        "unit": "s",
        "min": 0,
        "max": 500,
        "step": 10,
        "value": 500
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": -20,
        "max": 90,
        "step": 1,
        "value": 20
      },
      {
        "key": "pressure",
        "label": "外界压强",
        "unit": "kPa",
        "min": 60,
        "max": 110,
        "step": 0.1,
        "value": 101.3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "纸锅没有立即燃烧，是否说明纸不是可燃物？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "解释有水部分温度受水传热限制的现象。"
        },
        {
          "title": "指出观察证据",
          "text": "有水接触且加热适当时，纸的温度可能保持在着火温度以下。"
        },
        {
          "title": "解释现象",
          "text": "水持续吸热使接触部分不易升到燃点，不能据此认为纸不可燃。"
        },
        {
          "title": "完整回答",
          "text": "不是，关键是有水时纸的温度可能未达到燃点。"
        }
      ],
      "answer": "不是，关键是有水时纸的温度可能未达到燃点。"
    }
  },
  {
    "id": "phy-evaporative-cooling",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.3",
    "title": "酒精蒸发与吹风的温度比较",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "对照干温度计与涂液温度计，观察蒸发吸热。",
    "apparatus": [
      "酒精",
      "温度计",
      "扇子"
    ],
    "steps": [
      "比较干燥温度计与表面湿润温度计。",
      "在同样环境中记录变化。",
      "改变空气流动或液面面积并对照。"
    ],
    "observations": [
      "表面液体蒸发时温度可能降低，适当通风会加快蒸发。"
    ],
    "conclusion": "蒸发吸热，蒸发快慢受温度、面积和空气流动等影响。",
    "examPoints": [
      "控制变量比较蒸发条件",
      "降温效果也与湿度有关"
    ],
    "pitfalls": [
      "不能认为吹风必然使所有物体降到室温以下"
    ],
    "questions": [
      {
        "q": "湿纱布加通风为何能帮助降温？",
        "a": "水蒸发吸热，通风带走附近水蒸气，有助于持续蒸发。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "evaporation",
      "variant": "evaporative-cooling"
    },
    "modelNote": "数值曲线采用给定物质的理想热量与状态关系；忽略散热、过冷和加热器惯性，平台表示相变中仍在吸热或放热。",
    "controls": [
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": 5,
        "max": 60,
        "step": 1,
        "value": 25
      },
      {
        "key": "area",
        "label": "液面面积（相对量）",
        "unit": "",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "airflow",
        "label": "空气流动（相对量）",
        "unit": "",
        "min": 0,
        "max": 5,
        "step": 0.1,
        "value": 1
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "湿纱布加通风为何能帮助降温？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "对照干温度计与涂液温度计，观察蒸发吸热。"
        },
        {
          "title": "指出观察证据",
          "text": "表面液体蒸发时温度可能降低，适当通风会加快蒸发。"
        },
        {
          "title": "解释现象",
          "text": "蒸发吸热，蒸发快慢受温度、面积和空气流动等影响。"
        },
        {
          "title": "完整回答",
          "text": "水蒸发吸热，通风带走附近水蒸气，有助于持续蒸发。"
        }
      ],
      "answer": "水蒸发吸热，通风带走附近水蒸气，有助于持续蒸发。"
    }
  },
  {
    "id": "phy-cold-bottle-condensation",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.3",
    "title": "冷瓶外壁的小水珠",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "区分外界水蒸气液化与瓶中水渗出。",
    "apparatus": [
      "冷水瓶",
      "室内空气"
    ],
    "steps": [
      "比较冷瓶与常温瓶外壁。",
      "观察水珠首先出现的位置。",
      "分析水蒸气来源并用不同水温杯作对照。"
    ],
    "observations": [
      "冷表面附近可出现外界空气中的水蒸气液化形成的水珠。"
    ],
    "conclusion": "水蒸气遇冷液化，并不一定来自容器内部。",
    "examPoints": [
      "判断内外壁、温差与蒸气来源"
    ],
    "pitfalls": [
      "瓶外水珠不等于瓶内水渗出"
    ],
    "questions": [
      {
        "q": "密封冰水瓶外壁的水从哪里来？",
        "a": "通常来自周围空气中的水蒸气，在冷瓶表面液化。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "condensation",
      "variant": "cold-bottle-condensation"
    },
    "modelNote": "根据给定空气露点和瓶壁温度判断凝结条件；露点作为输入，未由湿度反算，也不预测水珠质量与长大速率。冷瓶外水珠来自空气水蒸气。",
    "controls": [
      {
        "key": "ambient",
        "label": "环境温度",
        "unit": "℃",
        "min": 10,
        "max": 35,
        "step": 1,
        "value": 25
      },
      {
        "key": "surface",
        "label": "瓶壁温度",
        "unit": "℃",
        "min": 0,
        "max": 35,
        "step": 1,
        "value": 8
      },
      {
        "key": "dewPoint",
        "label": "空气露点",
        "unit": "℃",
        "min": 0,
        "max": 25,
        "step": 1,
        "value": 15
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "密封冰水瓶外壁的水从哪里来？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "区分外界水蒸气液化与瓶中水渗出。"
        },
        {
          "title": "指出观察证据",
          "text": "冷表面附近可出现外界空气中的水蒸气液化形成的水珠。"
        },
        {
          "title": "解释现象",
          "text": "水蒸气遇冷液化，并不一定来自容器内部。"
        },
        {
          "title": "完整回答",
          "text": "通常来自周围空气中的水蒸气，在冷瓶表面液化。"
        }
      ],
      "answer": "通常来自周围空气中的水蒸气，在冷瓶表面液化。"
    }
  },
  {
    "id": "phy-iodine-sublimation",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.4",
    "title": "密闭碘容器的升华和凝华",
    "kind": "小实验",
    "tags": [
      "问题"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较温热水和冷水处理后的物态。",
    "apparatus": [
      "密闭碘管",
      "温热水",
      "冷水"
    ],
    "steps": [
      "在密封模型中温和加热固态碘。",
      "观察有色气体。",
      "冷却后观察固体重新出现。"
    ],
    "observations": [
      "固态碘可直接变为气态，冷却后又形成固体。"
    ],
    "conclusion": "固态与气态直接转化分别叫升华和凝华。",
    "examPoints": [
      "升华吸热，凝华放热"
    ],
    "pitfalls": [
      "没有明显液态阶段不能称为汽化与凝固"
    ],
    "questions": [
      {
        "q": "冷却后出现的固态碘经历了什么变化？",
        "a": "气态碘直接转为固态，属于凝华。"
      }
    ],
    "safety": [
      "只作模拟或教师密闭装置演示；不打开容器或直接用火加热。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "sublimation",
      "variant": "iodine-sublimation",
      "material": "iodine"
    },
    "modelNote": "仅比较碘由固态到气态、由气态到固态的变化方向，不计算真实升华速率、浓度或实验温度；只使用密封教学演示资料。",
    "controls": [
      {
        "key": "action",
        "label": "变化过程",
        "options": [
          {
            "value": "heating",
            "label": "温和加热"
          },
          {
            "value": "cooling",
            "label": "冷却"
          }
        ],
        "value": "heating"
      },
      {
        "key": "progress",
        "label": "观察进度",
        "unit": "",
        "min": 0,
        "max": 1,
        "step": 0.05,
        "value": 0.5
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "冷却后出现的固态碘经历了什么变化？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较温热水和冷水处理后的物态。"
        },
        {
          "title": "指出观察证据",
          "text": "固态碘可直接变为气态，冷却后又形成固体。"
        },
        {
          "title": "解释现象",
          "text": "固态与气态直接转化分别叫升华和凝华。"
        },
        {
          "title": "完整回答",
          "text": "气态碘直接转为固态，属于凝华。"
        }
      ],
      "answer": "气态碘直接转为固态，属于凝华。"
    }
  },
  {
    "id": "phy-frost-can",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.4",
    "title": "冰盐降温后罐外结霜",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "测量低温并辨认外表面形成的霜。",
    "apparatus": [
      "易拉罐",
      "冰",
      "盐",
      "温度计"
    ],
    "steps": [
      "在容器内部用冰盐模型降低外壁温度。",
      "观察外壁固体冰晶。",
      "比较外壁是否先出现液态水。"
    ],
    "observations": [
      "足够冷的外壁可能出现霜状冰晶。"
    ],
    "conclusion": "空气中的水蒸气可直接凝华成固体冰晶。",
    "examPoints": [
      "霜与露所对应的末态不同"
    ],
    "pitfalls": [
      "不能把所有外壁结冰都断言为直接凝华，需看有无先液化"
    ],
    "questions": [
      {
        "q": "霜是由杯内的盐跑到外面形成的吗？",
        "a": "不是，通常由空气中的水蒸气在冷表面形成冰晶。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "deposition",
      "variant": "frost-can",
      "material": "water"
    },
    "modelNote": "画面展示指定的水蒸气直接结霜过程；表面温度不是凝华的全部条件，还需水蒸气含量等，未计算真实成霜质量与速率。",
    "controls": [
      {
        "key": "surfaceTemperature",
        "label": "冷表面温度",
        "unit": "℃",
        "min": -20,
        "max": 10,
        "step": 1,
        "value": -10
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "霜是由杯内的盐跑到外面形成的吗？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "测量低温并辨认外表面形成的霜。"
        },
        {
          "title": "指出观察证据",
          "text": "足够冷的外壁可能出现霜状冰晶。"
        },
        {
          "title": "解释现象",
          "text": "空气中的水蒸气可直接凝华成固体冰晶。"
        },
        {
          "title": "完整回答",
          "text": "不是，通常由空气中的水蒸气在冷表面形成冰晶。"
        }
      ],
      "answer": "不是，通常由空气中的水蒸气在冷表面形成冰晶。"
    }
  },
  {
    "id": "phy-kitchen-phase",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "section": "3.5",
    "title": "厨房物态变化与节能方案",
    "kind": "拓展探究",
    "tags": [
      "跨学科实践"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "观察烹饪中汽化液化等变化，检验改进建议。",
    "apparatus": [
      "观察记录",
      "厨房模型"
    ],
    "steps": [
      "选择烧水、锅盖水滴或食物冷却等现象。",
      "记录发生变化的位置和物态。",
      "设计控制变量比较保温、加盖等方案。"
    ],
    "observations": [
      "锅内汽化与较冷锅盖上的液化可同时发生。"
    ],
    "conclusion": "厨房中的物态变化伴随吸放热，可用于分析节能和防烫。",
    "examPoints": [
      "白气是小液滴",
      "蒸气液化放热可能造成烫伤"
    ],
    "pitfalls": [
      "不能仅凭沸腾剧烈就判断水温更高"
    ],
    "questions": [
      {
        "q": "锅盖上的水滴属于哪种物态变化？",
        "a": "水蒸气遇到较冷锅盖变成液态水，属于液化。"
      }
    ],
    "safety": [
      "网页仅模拟；真实厨房活动由成人指导，注意蒸汽烫伤。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "boiling",
      "variant": "kitchen-phase"
    },
    "modelNote": "数值曲线采用给定物质的理想热量与状态关系；忽略散热、过冷和加热器惯性，平台表示相变中仍在吸热或放热。",
    "controls": [
      {
        "key": "mass",
        "label": "样品质量",
        "unit": "kg",
        "min": 0.05,
        "max": 1,
        "step": 0.05,
        "value": 0.1
      },
      {
        "key": "power",
        "label": "加热/放热功率",
        "unit": "W",
        "min": 10,
        "max": 200,
        "step": 10,
        "value": 100
      },
      {
        "key": "time",
        "label": "时间",
        "unit": "s",
        "min": 0,
        "max": 500,
        "step": 10,
        "value": 500
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": -20,
        "max": 90,
        "step": 1,
        "value": 20
      },
      {
        "key": "pressure",
        "label": "外界压强",
        "unit": "kPa",
        "min": 60,
        "max": 110,
        "step": 0.1,
        "value": 101.3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "锅盖上的水滴属于哪种物态变化？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "观察烹饪中汽化液化等变化，检验改进建议。"
        },
        {
          "title": "指出观察证据",
          "text": "锅内汽化与较冷锅盖上的液化可同时发生。"
        },
        {
          "title": "解释现象",
          "text": "厨房中的物态变化伴随吸放热，可用于分析节能和防烫。"
        },
        {
          "title": "完整回答",
          "text": "水蒸气遇到较冷锅盖变成液态水，属于液化。"
        }
      ],
      "answer": "水蒸气遇到较冷锅盖变成液态水，属于液化。"
    }
  },
  {
    "id": "phy-light-straight",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.1",
    "title": "光在水和玻璃中的传播路径",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较同种均匀介质中的光路。",
    "apparatus": [
      "光源",
      "水槽",
      "少量散射剂",
      "玻璃砖"
    ],
    "steps": [
      "使窄光束通过均匀水体或玻璃。",
      "从侧面借散射观察路径。",
      "改变光束方向并比较介质内部路径。"
    ],
    "observations": [
      "光在同一种均匀介质内部沿直线传播。"
    ],
    "conclusion": "光的直线传播有同种均匀介质这一条件。",
    "examPoints": [
      "看见光路依赖部分光散射进入眼睛"
    ],
    "pitfalls": [
      "不能漏掉介质均匀这一条件"
    ],
    "questions": [
      {
        "q": "水中能看见光路是否说明光只沿朝眼睛方向传播？",
        "a": "不是，主光束向前传播，少量散射光进入眼睛使路径可见。"
      }
    ],
    "safety": [
      "不让激光直射或反射入眼。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "straight",
      "variant": "light-straight"
    },
    "modelNote": "采用几何光学光线，角度从法线量起；忽略衍射、光束宽度和实际装置像差。",
    "controls": [
      {
        "key": "angle",
        "label": "入射角",
        "unit": "°",
        "min": 0,
        "max": 85,
        "step": 1,
        "value": 30
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "水中能看见光路是否说明光只沿朝眼睛方向传播？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较同种均匀介质中的光路。"
        },
        {
          "title": "指出观察证据",
          "text": "光在同一种均匀介质内部沿直线传播。"
        },
        {
          "title": "解释现象",
          "text": "光的直线传播有同种均匀介质这一条件。"
        },
        {
          "title": "完整回答",
          "text": "不是，主光束向前传播，少量散射光进入眼睛使路径可见。"
        }
      ],
      "answer": "不是，主光束向前传播，少量散射光进入眼睛使路径可见。"
    }
  },
  {
    "id": "phy-pinhole-image",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.1",
    "title": "小孔成像与物距变化",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较像的方向与大小，利用直线传播解释。",
    "apparatus": [
      "带孔暗筒",
      "半透明屏",
      "发光物体"
    ],
    "steps": [
      "将小孔、物体和屏按顺序放置。",
      "观察屏上的像。",
      "改变物距或屏距并比较大小与亮度。"
    ],
    "observations": [
      "像通常上下左右颠倒；增大孔屏距时像变大、变暗。"
    ],
    "conclusion": "小孔成像由光沿直线传播形成倒立实像。",
    "examPoints": [
      "像形状由物体决定，不由孔形直接决定"
    ],
    "pitfalls": [
      "孔越大不一定越清晰"
    ],
    "questions": [
      {
        "q": "物高10 cm、物孔距50 cm、屏孔距20 cm，像高多少？",
        "a": "像高4 cm且倒立。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "pinhole",
      "variant": "pinhole-image"
    },
    "modelNote": "采用几何光学光线，角度从法线量起；忽略衍射、光束宽度和实际装置像差。",
    "controls": [
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 30
      },
      {
        "key": "screen",
        "label": "光屏距离",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "height",
        "label": "物高",
        "unit": "cm",
        "min": 1,
        "max": 20,
        "step": 1,
        "value": 5
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "物高10 cm，物孔距50 cm，孔屏距20 cm。",
      "steps": [
        {
          "title": "整理条件",
          "text": "物高10 cm，物孔距50 cm，孔屏距20 cm。"
        },
        {
          "title": "选用依据",
          "text": "相似三角形：像高/物高=像距/物距。"
        },
        {
          "title": "代入求解",
          "text": "像高=10×20/50=4 cm。"
        },
        {
          "title": "写出结论",
          "text": "得到约4 cm高的倒立实像。"
        }
      ],
      "answer": "得到约4 cm高的倒立实像。"
    }
  },
  {
    "id": "phy-hand-shadow",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.1",
    "title": "手影和影子大小",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "调整遮挡物位置，比较影子边界。",
    "apparatus": [
      "光源",
      "遮挡物",
      "白屏"
    ],
    "steps": [
      "让不透明物体位于光源和屏之间。",
      "改变遮挡物到光源的距离。",
      "比较点光源与面光源下影子边界。"
    ],
    "observations": [
      "遮挡物靠近光源时影子可变大；面光源可能出现半影。"
    ],
    "conclusion": "影是光被遮挡造成的暗区，几何位置决定大小。",
    "examPoints": [
      "影与小孔成像不同"
    ],
    "pitfalls": [
      "不要把影子的方向称为透镜成像倒立"
    ],
    "questions": [
      {
        "q": "物体靠近点光源，屏上影子通常怎样变化？",
        "a": "在光源和屏位置不变时，影子通常变大。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "shadow",
      "variant": "hand-shadow"
    },
    "modelNote": "采用几何光学光线，角度从法线量起；忽略衍射、光束宽度和实际装置像差。",
    "controls": [
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 30
      },
      {
        "key": "screen",
        "label": "光屏距离",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "height",
        "label": "物高",
        "unit": "cm",
        "min": 1,
        "max": 20,
        "step": 1,
        "value": 5
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "物体靠近点光源，屏上影子通常怎样变化？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "调整遮挡物位置，比较影子边界。"
        },
        {
          "title": "指出观察证据",
          "text": "遮挡物靠近光源时影子可变大；面光源可能出现半影。"
        },
        {
          "title": "解释现象",
          "text": "影是光被遮挡造成的暗区，几何位置决定大小。"
        },
        {
          "title": "完整回答",
          "text": "在光源和屏位置不变时，影子通常变大。"
        }
      ],
      "answer": "在光源和屏位置不变时，影子通常变大。"
    }
  },
  {
    "id": "phy-reflection-law",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.2",
    "title": "反射角、共面条件和光路可逆",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "多次改变入射方向，测角并折转纸板。",
    "apparatus": [
      "平面镜",
      "可折纸板",
      "光源",
      "量角器"
    ],
    "steps": [
      "将可折纸板竖直放在镜面上。",
      "改变入射角测量反射角。",
      "折转一侧纸板并交换入射与反射方向。"
    ],
    "observations": [
      "反射角等于入射角；反射光线与入射光线分居法线两侧。"
    ],
    "conclusion": "反射光线、入射光线和法线在同一平面内，光路可逆。",
    "examPoints": [
      "角度以法线为基准",
      "折纸板是检验共面关系"
    ],
    "pitfalls": [
      "不把光线与镜面的夹角直接当作入射角"
    ],
    "questions": [
      {
        "q": "光线与镜面成30°，反射角是多少？",
        "a": "入射角60°，反射角也是60°。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "reflection",
      "variant": "reflection-law"
    },
    "modelNote": "采用几何光学光线，角度从法线量起；忽略衍射、光束宽度和实际装置像差。",
    "controls": [
      {
        "key": "angle",
        "label": "入射角",
        "unit": "°",
        "min": 0,
        "max": 85,
        "step": 1,
        "value": 30
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "入射光线与镜面夹角30°。",
      "steps": [
        {
          "title": "整理条件",
          "text": "入射光线与镜面夹角30°。"
        },
        {
          "title": "选用依据",
          "text": "法线垂直镜面，反射角等于入射角。"
        },
        {
          "title": "代入求解",
          "text": "入射角=90°−30°=60°；反射角=60°。"
        },
        {
          "title": "写出结论",
          "text": "反射角60°。"
        }
      ],
      "answer": "反射角60°。"
    }
  },
  {
    "id": "phy-diffuse-reflection",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.2",
    "title": "光滑镜面与粗糙白纸的反射",
    "kind": "小实验",
    "tags": [
      "正文活动"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "改变观察方向比较明暗。",
    "apparatus": [
      "镜子",
      "白纸",
      "光源"
    ],
    "steps": [
      "把光照到平面镜与白纸。",
      "从不同方向观察明暗。",
      "用微小面元解释粗糙表面反射。"
    ],
    "observations": [
      "镜面反射较集中；粗糙表面可把光反射向多个方向。"
    ],
    "conclusion": "漫反射的每一条光线仍遵循反射定律。",
    "examPoints": [
      "从多方向看清书本依赖漫反射"
    ],
    "pitfalls": [
      "不要说漫反射不遵守反射定律"
    ],
    "questions": [
      {
        "q": "为什么在多个方向都能看见白纸？",
        "a": "纸面微观粗糙，各小面的反射方向不同，使不同方向的人都能接收到光。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "reflection",
      "variant": "diffuse-reflection"
    },
    "modelNote": "每个局部表面仍满足反射定律；入射角滑杆控制一条局部光线，粗糙表面不同法线造成向多个方向反射，不模拟真实粗糙度统计。",
    "controls": [
      {
        "key": "angle",
        "label": "入射角",
        "unit": "°",
        "min": 0,
        "max": 85,
        "step": 1,
        "value": 30
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么在多个方向都能看见白纸？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "改变观察方向比较明暗。"
        },
        {
          "title": "指出观察证据",
          "text": "镜面反射较集中；粗糙表面可把光反射向多个方向。"
        },
        {
          "title": "解释现象",
          "text": "漫反射的每一条光线仍遵循反射定律。"
        },
        {
          "title": "完整回答",
          "text": "纸面微观粗糙，各小面的反射方向不同，使不同方向的人都能接收到光。"
        }
      ],
      "answer": "纸面微观粗糙，各小面的反射方向不同，使不同方向的人都能接收到光。"
    }
  },
  {
    "id": "phy-retroreflector",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.2",
    "title": "自行车尾灯回归反射",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "观察尾灯并追踪多次反射光路。",
    "apparatus": [
      "手电筒",
      "自行车反光片"
    ],
    "steps": [
      "观察互相垂直的镜面单元。",
      "追踪一次和两次反射的方向。",
      "改变入射方向比较出射光。"
    ],
    "observations": [
      "在合适几何结构中，光经多次反射可大致朝来路返回。"
    ],
    "conclusion": "回归反射器利用多次反射提高反光可见性，本身通常不发光。",
    "examPoints": [
      "自行车反光尾灯与主动发光灯不同"
    ],
    "pitfalls": [
      "不可声称所有角度都完全返回光源"
    ],
    "questions": [
      {
        "q": "没有电池的反光尾灯为什么也很亮？",
        "a": "它把外来车灯光较集中地反射回附近观察方向。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "retroreflection",
      "variant": "retroreflector",
      "angle": 45
    },
    "modelNote": "固定展示二维互相垂直双镜的两次反射；出射光与入射光平行反向，不等同于任意空间方向都能回返的三镜角反射器。",
    "controls": [
      {
        "key": "stage",
        "label": "观察阶段",
        "options": [
          {
            "value": 0,
            "label": "入射光"
          },
          {
            "value": 1,
            "label": "第一次反射"
          },
          {
            "value": 2,
            "label": "第二次反射"
          }
        ],
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "没有电池的反光尾灯为什么也很亮？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "观察尾灯并追踪多次反射光路。"
        },
        {
          "title": "指出观察证据",
          "text": "在合适几何结构中，光经多次反射可大致朝来路返回。"
        },
        {
          "title": "解释现象",
          "text": "回归反射器利用多次反射提高反光可见性，本身通常不发光。"
        },
        {
          "title": "完整回答",
          "text": "它把外来车灯光较集中地反射回附近观察方向。"
        }
      ],
      "answer": "它把外来车灯光较集中地反射回附近观察方向。"
    }
  },
  {
    "id": "phy-plane-mirror",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.3",
    "title": "平面镜像的位置、大小与虚实",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "用等大物替代定位，再尝试用屏承接。",
    "apparatus": [
      "玻璃板",
      "等大物体",
      "刻度尺",
      "光屏"
    ],
    "steps": [
      "竖直放置薄玻璃板。",
      "用等大物体在板后移动，寻找与像重合的位置。",
      "比较物像距离并用屏尝试承接。"
    ],
    "observations": [
      "像与物等大，关于镜面对称；光屏不能承接该像。"
    ],
    "conclusion": "平面镜成正立等大的虚像，像距等于物距。",
    "examPoints": [
      "透明玻璃便于看到替代物",
      "等大物体用于比较像大小"
    ],
    "pitfalls": [
      "玻璃未竖直会造成替代物始终难以重合"
    ],
    "questions": [
      {
        "q": "人离平面镜1.5 m，人与像相距多少？",
        "a": "人与像相距3.0 m。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "mirror",
      "variant": "plane-mirror"
    },
    "modelNote": "采用几何光学光线，角度从法线量起；忽略衍射、光束宽度和实际装置像差。",
    "controls": [
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 30
      },
      {
        "key": "height",
        "label": "物高",
        "unit": "cm",
        "min": 1,
        "max": 20,
        "step": 1,
        "value": 5
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "物到镜距离1.5 m。",
      "steps": [
        {
          "title": "整理条件",
          "text": "物到镜距离1.5 m。"
        },
        {
          "title": "选用依据",
          "text": "像距等于物距。"
        },
        {
          "title": "代入求解",
          "text": "物像距离=1.5+1.5=3.0 m。"
        },
        {
          "title": "写出结论",
          "text": "人与像相距3.0 m。"
        }
      ],
      "answer": "人与像相距3.0 m。"
    }
  },
  {
    "id": "phy-spoon-mirrors",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.3",
    "title": "勺子两面的像",
    "kind": "小实验",
    "tags": [
      "科学世界"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较勺子凹凸表面成像与视野。",
    "apparatus": [
      "金属勺"
    ],
    "steps": [
      "观察勺子凸面和凹面中的像。",
      "改变脸与勺子的距离。",
      "与平面镜的成像特点比较。"
    ],
    "observations": [
      "凸面通常形成正立缩小像；凹面成像会随距离变化。"
    ],
    "conclusion": "曲面镜各处法线不同，成像可不同于平面镜。",
    "examPoints": [
      "不能把平面镜等大规律直接用于曲面镜"
    ],
    "pitfalls": [
      "勺面并非标准球面镜，不能用理想曲面公式伪称精密结果"
    ],
    "questions": [
      {
        "q": "为何勺子两面看到的像不一样？",
        "a": "两面的曲率方向不同，反射光束会聚或发散的情况不同。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "curved-mirror",
      "variant": "spoon-mirrors"
    },
    "modelNote": "采用几何光学光线，角度从法线量起；忽略衍射、光束宽度和实际装置像差。",
    "controls": [
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 30
      },
      {
        "key": "focal",
        "label": "曲面镜焦距",
        "unit": "cm",
        "min": -30,
        "max": 30,
        "step": 1,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为何勺子两面看到的像不一样？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较勺子凹凸表面成像与视野。"
        },
        {
          "title": "指出观察证据",
          "text": "凸面通常形成正立缩小像；凹面成像会随距离变化。"
        },
        {
          "title": "解释现象",
          "text": "曲面镜各处法线不同，成像可不同于平面镜。"
        },
        {
          "title": "完整回答",
          "text": "两面的曲率方向不同，反射光束会聚或发散的情况不同。"
        }
      ],
      "answer": "两面的曲率方向不同，反射光束会聚或发散的情况不同。"
    }
  },
  {
    "id": "phy-periscope",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.3",
    "title": "双平面镜潜望镜",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "通过两次反射改变观察路线。",
    "apparatus": [
      "两块平面镜",
      "纸筒"
    ],
    "steps": [
      "把两面平面镜平行放在管道两端。",
      "调整镜面使光两次改变方向。",
      "追踪物体到眼睛的光路。"
    ],
    "observations": [
      "两次反射可绕过遮挡改变观察高度。"
    ],
    "conclusion": "潜望镜利用平面镜反射来改变传播方向。",
    "examPoints": [
      "每一次反射都满足反射定律"
    ],
    "pitfalls": [
      "只画一条反射而漏掉另一面镜会使光路不完整"
    ],
    "questions": [
      {
        "q": "潜望镜是否靠折射改变光路？",
        "a": "普通双平面镜潜望镜主要靠两次反射。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "periscope",
      "variant": "periscope",
      "angle": 45
    },
    "modelNote": "标准潜望镜采用互相平行的两块平面镜，各与筒轴约成45°；演示双反射结构，不模拟有限镜面造成的视场变化。",
    "controls": [
      {
        "key": "stage",
        "label": "观察阶段",
        "options": [
          {
            "value": 0,
            "label": "入射光"
          },
          {
            "value": 1,
            "label": "第一次反射"
          },
          {
            "value": 2,
            "label": "第二次反射"
          }
        ],
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "潜望镜是否靠折射改变光路？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "通过两次反射改变观察路线。"
        },
        {
          "title": "指出观察证据",
          "text": "两次反射可绕过遮挡改变观察高度。"
        },
        {
          "title": "解释现象",
          "text": "潜望镜利用平面镜反射来改变传播方向。"
        },
        {
          "title": "完整回答",
          "text": "普通双平面镜潜望镜主要靠两次反射。"
        }
      ],
      "answer": "普通双平面镜潜望镜主要靠两次反射。"
    }
  },
  {
    "id": "phy-refraction-law",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.4",
    "title": "改变入射方向观察水和玻璃中的折射",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较空气进入介质及反向传播的角度。",
    "apparatus": [
      "水槽",
      "半圆玻璃砖",
      "光源",
      "角度盘"
    ],
    "steps": [
      "使光从空气斜射入水或玻璃。",
      "测量入射和折射方向。",
      "改变入射角并反向传播比较。"
    ],
    "observations": [
      "从空气进入水或玻璃时，斜入射光通常向法线偏折。"
    ],
    "conclusion": "光跨越不同介质界面时会折射，光路可逆。",
    "examPoints": [
      "垂直入射时方向可不改变",
      "速度仍可能改变"
    ],
    "pitfalls": [
      "不要把折射角误写成总小于入射角，需比较介质"
    ],
    "questions": [
      {
        "q": "光从水斜射入空气，折射角通常更大还是更小？",
        "a": "未发生全反射时，通常比入射角大。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "refraction",
      "variant": "refraction-law"
    },
    "modelNote": "采用几何光学光线，角度从法线量起；忽略衍射、光束宽度和实际装置像差。",
    "controls": [
      {
        "key": "angle",
        "label": "入射角",
        "unit": "°",
        "min": 0,
        "max": 85,
        "step": 1,
        "value": 30
      },
      {
        "key": "n1",
        "label": "入射介质折射率",
        "unit": "",
        "min": 1,
        "max": 2,
        "step": 0.01,
        "value": 1
      },
      {
        "key": "n2",
        "label": "折射介质折射率",
        "unit": "",
        "min": 1,
        "max": 2,
        "step": 0.01,
        "value": 1.5
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "光从水斜射入空气，折射角通常更大还是更小？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较空气进入介质及反向传播的角度。"
        },
        {
          "title": "指出观察证据",
          "text": "从空气进入水或玻璃时，斜入射光通常向法线偏折。"
        },
        {
          "title": "解释现象",
          "text": "光跨越不同介质界面时会折射，光路可逆。"
        },
        {
          "title": "完整回答",
          "text": "未发生全反射时，通常比入射角大。"
        }
      ],
      "answer": "未发生全反射时，通常比入射角大。"
    }
  },
  {
    "id": "phy-gradient-saline-ray",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.章末",
    "title": "非均匀盐水中的弯曲光路",
    "kind": "小实验",
    "tags": [
      "复习与提高"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较浓度梯度存在与搅匀后的光路。",
    "apparatus": [
      "盐水",
      "透明槽",
      "光源",
      "搅拌棒"
    ],
    "steps": [
      "在模型中建立随高度变化的盐水折射率。",
      "让光斜向进入。",
      "比较存在梯度与搅匀后的光路。"
    ],
    "observations": [
      "介质光学性质随位置改变时，光路可逐渐弯曲。"
    ],
    "conclusion": "光沿直线传播的条件不满足时，路径可能弯曲。",
    "examPoints": [
      "区分均匀介质内直线与非均匀介质中渐变光路"
    ],
    "pitfalls": [
      "弯曲不是重力直接把光压弯的课堂解释"
    ],
    "questions": [
      {
        "q": "搅匀后路径为什么可能接近直线？",
        "a": "搅匀减小折射率的空间差异，使介质更接近均匀。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "gradient",
      "variant": "gradient-saline-ray"
    },
    "modelNote": "使用连续折射率梯度的教学光路，表示光在非均匀介质中连续偏折；梯度不是实际盐水浓度刻度，不用于定量反推溶液配比。",
    "controls": [
      {
        "key": "angle",
        "label": "入射角",
        "unit": "°",
        "min": 0,
        "max": 85,
        "step": 1,
        "value": 30
      },
      {
        "key": "nTop",
        "label": "上层折射率",
        "unit": "",
        "min": 1,
        "max": 1.6,
        "step": 0.01,
        "value": 1.3
      },
      {
        "key": "nBottom",
        "label": "下层折射率",
        "unit": "",
        "min": 1,
        "max": 1.6,
        "step": 0.01,
        "value": 1.5
      },
      {
        "key": "height",
        "label": "介质层高度",
        "unit": "m",
        "min": 0.1,
        "max": 2,
        "step": 0.1,
        "value": 1
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "搅匀后路径为什么可能接近直线？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较浓度梯度存在与搅匀后的光路。"
        },
        {
          "title": "指出观察证据",
          "text": "介质光学性质随位置改变时，光路可逐渐弯曲。"
        },
        {
          "title": "解释现象",
          "text": "光沿直线传播的条件不满足时，路径可能弯曲。"
        },
        {
          "title": "完整回答",
          "text": "搅匀减小折射率的空间差异，使介质更接近均匀。"
        }
      ],
      "answer": "搅匀减小折射率的空间差异，使介质更接近均匀。"
    }
  },
  {
    "id": "phy-prism-spectrum",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.5",
    "title": "三棱镜分解白光",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "观察色带与不同色光偏折差异。",
    "apparatus": [
      "白光源",
      "三棱镜",
      "白屏"
    ],
    "steps": [
      "用窄白光照射三棱镜。",
      "在屏上观察光带。",
      "比较各色光的偏折与组合光。"
    ],
    "observations": [
      "白光经过棱镜后可分成不同颜色的光带。"
    ],
    "conclusion": "白光由多种色光组成，不同色光在介质中的折射不同。",
    "examPoints": [
      "色散不是棱镜生成新的颜色",
      "可见光谱有连续性"
    ],
    "pitfalls": [
      "不能把红绿蓝三原色等同于光谱只有三色"
    ],
    "questions": [
      {
        "q": "三棱镜为什么能把白光分开？",
        "a": "不同色光的折射程度不同，出射方向分离。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "dispersion",
      "variant": "prism-spectrum"
    },
    "modelNote": "采用几何光学光线，角度从法线量起；忽略衍射、光束宽度和实际装置像差。",
    "controls": [
      {
        "key": "angle",
        "label": "入射角",
        "unit": "°",
        "min": 0,
        "max": 85,
        "step": 1,
        "value": 30
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "三棱镜为什么能把白光分开？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "观察色带与不同色光偏折差异。"
        },
        {
          "title": "指出观察证据",
          "text": "白光经过棱镜后可分成不同颜色的光带。"
        },
        {
          "title": "解释现象",
          "text": "白光由多种色光组成，不同色光在介质中的折射不同。"
        },
        {
          "title": "完整回答",
          "text": "不同色光的折射程度不同，出射方向分离。"
        }
      ],
      "answer": "不同色光的折射程度不同，出射方向分离。"
    }
  },
  {
    "id": "phy-rgb-mixture",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.5",
    "title": "调节红绿蓝亮度进行色光混合",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "改变数字色光分量并记录屏幕颜色。",
    "apparatus": [
      "显示屏",
      "RGB控件"
    ],
    "steps": [
      "分别调节红、绿、蓝光的相对强度。",
      "让色光在同一区域叠加。",
      "记录不同组合下的颜色。"
    ],
    "observations": [
      "适当比例的红绿蓝光可合成白光。"
    ],
    "conclusion": "色光混合与颜料混合规律不同。",
    "examPoints": [
      "色光三原色是红绿蓝"
    ],
    "pitfalls": [
      "不能把两种颜料的混色结果直接套到发光屏"
    ],
    "questions": [
      {
        "q": "红光和绿光适当混合可出现什么颜色？",
        "a": "可呈黄色；这是色光叠加的结果。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "rgb",
      "variant": "rgb-mixture"
    },
    "modelNote": "采用几何光学光线，角度从法线量起；忽略衍射、光束宽度和实际装置像差。",
    "controls": [
      {
        "key": "red",
        "label": "红光强度",
        "unit": "通道值",
        "min": 0,
        "max": 255,
        "step": 1,
        "value": 255
      },
      {
        "key": "green",
        "label": "绿光强度",
        "unit": "通道值",
        "min": 0,
        "max": 255,
        "step": 1,
        "value": 255
      },
      {
        "key": "blue",
        "label": "蓝光强度",
        "unit": "通道值",
        "min": 0,
        "max": 255,
        "step": 1,
        "value": 255
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "红光和绿光适当混合可出现什么颜色？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "改变数字色光分量并记录屏幕颜色。"
        },
        {
          "title": "指出观察证据",
          "text": "适当比例的红绿蓝光可合成白光。"
        },
        {
          "title": "解释现象",
          "text": "色光混合与颜料混合规律不同。"
        },
        {
          "title": "完整回答",
          "text": "可呈黄色；这是色光叠加的结果。"
        }
      ],
      "answer": "可呈黄色；这是色光叠加的结果。"
    }
  },
  {
    "id": "phy-infrared-heating",
    "subject": "physics",
    "term": "8上",
    "chapter": "第四章 光现象",
    "section": "4.5",
    "title": "可见红端外的温度变化",
    "kind": "小实验",
    "tags": [
      "正文活动"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "根据光谱外温升推断不可见辐射。",
    "apparatus": [
      "色散装置",
      "灵敏温度传感器"
    ],
    "steps": [
      "把光谱投到可检测区域。",
      "比较红色可见光边缘外与对照位置的温度响应。",
      "解释看不见光却能升温的现象。"
    ],
    "observations": [
      "红端外侧也可能出现可测的温度变化。"
    ],
    "conclusion": "红外辐射不可被人眼直接看见，但能够传递能量。",
    "examPoints": [
      "不可见不等于不存在",
      "用温度变化作为间接证据"
    ],
    "pitfalls": [
      "不能根据温升证明那里全无可见光杂散影响"
    ],
    "questions": [
      {
        "q": "红端外温升能支持什么结论？",
        "a": "说明可见红光之外仍有能够携带能量的辐射。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "heating",
      "variant": "infrared-heating"
    },
    "modelNote": "用吸收的有效功率计算温升，不计算太阳光谱或探测器响应；真实太阳光色散实验中温升还受波段强度、位置和散热影响。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.2,
        "max": 1,
        "step": 0.1,
        "value": 0.4
      },
      {
        "key": "capacity",
        "label": "比热容",
        "unit": "J/(kg·℃)",
        "min": 2000,
        "max": 4500,
        "step": 100,
        "value": 4200
      },
      {
        "key": "power",
        "label": "有效吸收功率",
        "unit": "W",
        "min": 10,
        "max": 100,
        "step": 10,
        "value": 30
      },
      {
        "key": "time",
        "label": "加热时间",
        "unit": "s",
        "min": 0,
        "max": 120,
        "step": 5,
        "value": 60
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": 10,
        "max": 30,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "红端外温升能支持什么结论？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "根据光谱外温升推断不可见辐射。"
        },
        {
          "title": "指出观察证据",
          "text": "红端外侧也可能出现可测的温度变化。"
        },
        {
          "title": "解释现象",
          "text": "红外辐射不可被人眼直接看见，但能够传递能量。"
        },
        {
          "title": "完整回答",
          "text": "说明可见红光之外仍有能够携带能量的辐射。"
        }
      ],
      "answer": "说明可见红光之外仍有能够携带能量的辐射。"
    }
  },
  {
    "id": "phy-lens-rays",
    "subject": "physics",
    "term": "8上",
    "chapter": "第五章 透镜及其应用",
    "section": "5.1",
    "title": "凸凹透镜对平行光的作用",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较会聚与发散、标识焦点。",
    "apparatus": [
      "凸透镜",
      "凹透镜",
      "平行光源"
    ],
    "steps": [
      "辨认透镜中间与边缘厚度。",
      "让平行光通过凸透镜和凹透镜。",
      "标出会聚焦点或反向延长线交点。"
    ],
    "observations": [
      "凸透镜使平行光会聚，凹透镜使平行光发散。"
    ],
    "conclusion": "透镜对光束的会聚或发散作用取决于其光学性质。",
    "examPoints": [
      "凹透镜的虚焦点不是实际光线交点",
      "焦点到光心是焦距"
    ],
    "pitfalls": [
      "不能把所有经凸透镜的光都画成经过焦点"
    ],
    "questions": [
      {
        "q": "哪类入射光经凸透镜后通过焦点？",
        "a": "与主光轴平行的近轴光线，经理想凸透镜后通过像方焦点。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "lens",
    "modelParams": {
      "scenario": "convex",
      "variant": "lens-rays"
    },
    "modelNote": "采用理想薄透镜模型，忽略像差；焦点处无有限像距。画面与实物装置比例不同，不能据示意图直接量出真实焦距。",
    "controls": [
      {
        "key": "focal",
        "label": "焦距大小",
        "unit": "cm",
        "min": 5,
        "max": 30,
        "step": 1,
        "value": 10
      },
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 80,
        "step": 1,
        "value": 30
      },
      {
        "key": "height",
        "label": "物高",
        "unit": "cm",
        "min": 1,
        "max": 10,
        "step": 0.5,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "哪类入射光经凸透镜后通过焦点？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较会聚与发散、标识焦点。"
        },
        {
          "title": "指出观察证据",
          "text": "凸透镜使平行光会聚，凹透镜使平行光发散。"
        },
        {
          "title": "解释现象",
          "text": "透镜对光束的会聚或发散作用取决于其光学性质。"
        },
        {
          "title": "完整回答",
          "text": "与主光轴平行的近轴光线，经理想凸透镜后通过像方焦点。"
        }
      ],
      "answer": "与主光轴平行的近轴光线，经理想凸透镜后通过像方焦点。"
    }
  },
  {
    "id": "phy-convex-imaging",
    "subject": "physics",
    "term": "8上",
    "chapter": "第五章 透镜及其应用",
    "section": "5.3",
    "title": "凸透镜成像规律探究",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "分区改变物距，记录像的虚实、大小、方向与像距。",
    "apparatus": [
      "光具座",
      "LED物体",
      "凸透镜",
      "光屏"
    ],
    "steps": [
      "先使物体、光心和光屏中心近似同高。",
      "分区改变物距并寻找清晰像。",
      "记录像距、大小、方向与能否用屏承接。"
    ],
    "observations": [
      "物距跨过焦距和二倍焦距时，像的性质发生变化。"
    ],
    "conclusion": "凸透镜成像规律取决于物距与焦距关系。",
    "examPoints": [
      "u>2f缩小实像，f<u<2f放大实像，u<f正立放大虚像"
    ],
    "pitfalls": [
      "不要在物距小于焦距时反复移屏寻找可承接实像"
    ],
    "questions": [
      {
        "q": "f=10 cm，u=30 cm，像有什么特点？",
        "a": "像距15 cm，是倒立缩小实像。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "lens",
    "modelParams": {
      "scenario": "convex",
      "variant": "convex-imaging"
    },
    "modelNote": "采用理想薄透镜模型，忽略像差；焦点处无有限像距。画面与实物装置比例不同，不能据示意图直接量出真实焦距。",
    "controls": [
      {
        "key": "focal",
        "label": "焦距大小",
        "unit": "cm",
        "min": 5,
        "max": 30,
        "step": 1,
        "value": 10
      },
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 80,
        "step": 1,
        "value": 30
      },
      {
        "key": "height",
        "label": "物高",
        "unit": "cm",
        "min": 1,
        "max": 10,
        "step": 0.5,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "理想薄凸透镜f=10 cm，u=30 cm。",
      "steps": [
        {
          "title": "整理条件",
          "text": "理想薄凸透镜f=10 cm，u=30 cm。"
        },
        {
          "title": "选用依据",
          "text": "1/f=1/u+1/v（模型计算公式）；课堂也可按物距区间判断。"
        },
        {
          "title": "代入求解",
          "text": "1/v=1/10−1/30=1/15，v=15 cm。"
        },
        {
          "title": "写出结论",
          "text": "像位于f与2f之间，是倒立缩小实像。"
        }
      ],
      "answer": "像位于f与2f之间，是倒立缩小实像。"
    }
  },
  {
    "id": "phy-bottle-lens",
    "subject": "physics",
    "term": "8上",
    "chapter": "第五章 透镜及其应用",
    "section": "5.3",
    "title": "盛水圆柱瓶观察移动的笔",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "移动笔比较圆柱透镜在横向的成像变化。",
    "apparatus": [
      "透明圆柱瓶",
      "水",
      "笔"
    ],
    "steps": [
      "通过盛水的透明圆柱瓶观察笔。",
      "移动笔与瓶子的距离。",
      "比较水平方向与竖直方向的变形。"
    ],
    "observations": [
      "圆柱形水体主要在一个方向产生明显会聚作用。"
    ],
    "conclusion": "不同曲率方向的折射作用不同，圆柱水瓶并非普通球面凸透镜。",
    "examPoints": [
      "区分横向放大与完整二维等比例放大"
    ],
    "pitfalls": [
      "不能用单一放大率冒充所有方向的真实成像"
    ],
    "questions": [
      {
        "q": "为什么水瓶可能只使笔在一个方向明显变形？",
        "a": "圆柱曲面在不同方向的曲率不同，对光线会聚的作用也不同。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "lens",
    "modelParams": {
      "scenario": "convex",
      "variant": "bottle-lens"
    },
    "modelNote": "瓶中水的局部凸曲面以薄凸透镜近似；真实瓶壁通常有柱面像差，不是所有方向都有相同焦距。",
    "controls": [
      {
        "key": "focal",
        "label": "焦距大小",
        "unit": "cm",
        "min": 5,
        "max": 30,
        "step": 1,
        "value": 10
      },
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 80,
        "step": 1,
        "value": 30
      },
      {
        "key": "height",
        "label": "物高",
        "unit": "cm",
        "min": 1,
        "max": 10,
        "step": 0.5,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么水瓶可能只使笔在一个方向明显变形？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "移动笔比较圆柱透镜在横向的成像变化。"
        },
        {
          "title": "指出观察证据",
          "text": "圆柱形水体主要在一个方向产生明显会聚作用。"
        },
        {
          "title": "解释现象",
          "text": "不同曲率方向的折射作用不同，圆柱水瓶并非普通球面凸透镜。"
        },
        {
          "title": "完整回答",
          "text": "圆柱曲面在不同方向的曲率不同，对光线会聚的作用也不同。"
        }
      ],
      "answer": "圆柱曲面在不同方向的曲率不同，对光线会聚的作用也不同。"
    }
  },
  {
    "id": "phy-covered-lens",
    "subject": "physics",
    "term": "8上",
    "chapter": "第五章 透镜及其应用",
    "section": "5.3",
    "title": "遮挡透镜局部后像的变化",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "比较遮挡前后像的完整性与亮度。",
    "apparatus": [
      "凸透镜成像装置",
      "小遮片"
    ],
    "steps": [
      "先得到清晰实像。",
      "遮住透镜一部分而不改变位置。",
      "比较像的完整性、亮度和位置。"
    ],
    "observations": [
      "像通常仍完整，但明显变暗。"
    ],
    "conclusion": "物体各点可经透镜多个部位成像，遮挡部分减少通过的光。",
    "examPoints": [
      "遮透镜不同于遮物体"
    ],
    "pitfalls": [
      "不是遮一半透镜就只剩半个像"
    ],
    "questions": [
      {
        "q": "遮住透镜上半部会让像的下半部消失吗？",
        "a": "通常不会，完整像仍可形成，但亮度降低。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "lens",
    "modelParams": {
      "scenario": "convex",
      "variant": "covered-lens"
    },
    "modelNote": "遮住部分透镜仍可由剩余部分形成完整像，但光通量减少；薄透镜模型计算像位置与大小，未计算亮度、衍射和遮挡形状。",
    "controls": [
      {
        "key": "focal",
        "label": "焦距大小",
        "unit": "cm",
        "min": 5,
        "max": 30,
        "step": 1,
        "value": 10
      },
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 80,
        "step": 1,
        "value": 30
      },
      {
        "key": "height",
        "label": "物高",
        "unit": "cm",
        "min": 1,
        "max": 10,
        "step": 0.5,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "遮住透镜上半部会让像的下半部消失吗？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "比较遮挡前后像的完整性与亮度。"
        },
        {
          "title": "指出观察证据",
          "text": "像通常仍完整，但明显变暗。"
        },
        {
          "title": "解释现象",
          "text": "物体各点可经透镜多个部位成像，遮挡部分减少通过的光。"
        },
        {
          "title": "完整回答",
          "text": "通常不会，完整像仍可形成，但亮度降低。"
        }
      ],
      "answer": "通常不会，完整像仍可形成，但亮度降低。"
    }
  },
  {
    "id": "phy-near-point",
    "subject": "physics",
    "term": "8上",
    "chapter": "第五章 透镜及其应用",
    "section": "5.4",
    "title": "测量看清文字的近点",
    "kind": "小实验",
    "tags": [
      "科学世界"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "记录个体能清楚观察文字的最近距离。",
    "apparatus": [
      "文字",
      "刻度尺"
    ],
    "steps": [
      "选择清晰文字作为目标。",
      "缓慢改变观察距离。",
      "记录可以看清的最近距离并比较重复观察。"
    ],
    "observations": [
      "不同观察者的清晰观察范围可能不同。"
    ],
    "conclusion": "眼睛的调节能力有限，近点与眼的光学状态有关。",
    "examPoints": [
      "近点观察不是医学验光",
      "不以一次观察诊断近视"
    ],
    "pitfalls": [
      "不要强迫长时间近距离用眼"
    ],
    "questions": [
      {
        "q": "近点测得较近能否独立诊断眼睛完全健康？",
        "a": "不能，课堂观察只涉及一项功能，不能替代专业检查。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "lens",
    "modelParams": {
      "scenario": "eye",
      "variant": "near-point"
    },
    "modelNote": "薄透镜计算仅表示简化镜片成像关系，眼睛近点需由本人清晰观察范围实际测定；不根据焦距滑杆诊断视力或预测个人近点。",
    "controls": [
      {
        "key": "focal",
        "label": "焦距大小",
        "unit": "cm",
        "min": 5,
        "max": 30,
        "step": 1,
        "value": 10
      },
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 80,
        "step": 1,
        "value": 30
      },
      {
        "key": "height",
        "label": "物高",
        "unit": "cm",
        "min": 1,
        "max": 10,
        "step": 0.5,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "近点测得较近能否独立诊断眼睛完全健康？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "记录个体能清楚观察文字的最近距离。"
        },
        {
          "title": "指出观察证据",
          "text": "不同观察者的清晰观察范围可能不同。"
        },
        {
          "title": "解释现象",
          "text": "眼睛的调节能力有限，近点与眼的光学状态有关。"
        },
        {
          "title": "完整回答",
          "text": "不能，课堂观察只涉及一项功能，不能替代专业检查。"
        }
      ],
      "answer": "不能，课堂观察只涉及一项功能，不能替代专业检查。"
    }
  },
  {
    "id": "phy-spectacle-power",
    "subject": "physics",
    "term": "8上",
    "chapter": "第五章 透镜及其应用",
    "section": "5.4",
    "title": "测老花镜焦距并估算度数",
    "kind": "小实验",
    "tags": [
      "科学世界"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "由正透镜焦距换算焦度和镜片度数。",
    "apparatus": [
      "老花镜",
      "白屏",
      "刻度尺"
    ],
    "steps": [
      "选择可作为凸透镜的老花镜片。",
      "用安全平行光模型或远物近似测焦距。",
      "将焦距换成米再估算镜片度数。"
    ],
    "observations": [
      "焦距越短，对应正焦度越大。"
    ],
    "conclusion": "透镜焦度D=1/f，眼镜常用度数为100D，f以米计。",
    "examPoints": [
      "米与厘米不能混用",
      "镜片组合和真实验光更复杂"
    ],
    "pitfalls": [
      "不能把估算用于自行配镜"
    ],
    "questions": [
      {
        "q": "焦距0.50 m的正透镜约多少度？",
        "a": "约+200度。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "lens",
    "modelParams": {
      "scenario": "convex",
      "variant": "spectacle-power"
    },
    "modelNote": "采用理想薄透镜模型，忽略像差；焦点处无有限像距。画面与实物装置比例不同，不能据示意图直接量出真实焦距。",
    "controls": [
      {
        "key": "focal",
        "label": "焦距大小",
        "unit": "cm",
        "min": 5,
        "max": 30,
        "step": 1,
        "value": 10
      },
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 80,
        "step": 1,
        "value": 30
      },
      {
        "key": "height",
        "label": "物高",
        "unit": "cm",
        "min": 1,
        "max": 10,
        "step": 0.5,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "正透镜焦距f=0.50 m。",
      "steps": [
        {
          "title": "整理条件",
          "text": "正透镜焦距f=0.50 m。"
        },
        {
          "title": "选用依据",
          "text": "D=1/f；度数=100D。"
        },
        {
          "title": "代入求解",
          "text": "D=2 m⁻¹，度数=+200度。"
        },
        {
          "title": "写出结论",
          "text": "约+200度；仅作光学示例。"
        }
      ],
      "answer": "约+200度；仅作光学示例。"
    }
  },
  {
    "id": "phy-hyperopia-correction",
    "subject": "physics",
    "term": "8上",
    "chapter": "第五章 透镜及其应用",
    "section": "5.4",
    "title": "用光具座模拟远视及矫正",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "调整屏位置模拟视网膜，再加凸透镜恢复清晰像。",
    "apparatus": [
      "凸透镜",
      "可移动屏",
      "附加凸透镜",
      "物体"
    ],
    "steps": [
      "用透镜和固定光屏模拟眼睛。",
      "使像位于屏后，模拟远视成像偏差。",
      "在前方加入适当凸透镜使像回到屏上。"
    ],
    "observations": [
      "加合适凸透镜后光线会聚能力增强，可使清晰像回到视网膜位置。"
    ],
    "conclusion": "远视通常用凸透镜矫正；近视通常用凹透镜矫正。",
    "examPoints": [
      "远视成像落在视网膜后",
      "教材模型不能替代医学诊断"
    ],
    "pitfalls": [
      "不要交换近视和远视的镜片类型"
    ],
    "questions": [
      {
        "q": "远视模型应加凸透镜还是凹透镜？",
        "a": "加入适当凸透镜，使光束提前会聚。"
      }
    ],
    "safety": [
      "眼球模型是固定光屏的简化；勿把简单示范参数当临床屈光度。"
    ],
    "model": "lens",
    "modelParams": {
      "scenario": "hyperopia",
      "variant": "hyperopia-correction"
    },
    "modelNote": "数值输出为凸透镜单独成像参数；眼球与矫正光路只作定性示意，不能用于视力诊断或配镜。远视矫正镜使入眼光先适当会聚。",
    "controls": [
      {
        "key": "focal",
        "label": "焦距大小",
        "unit": "cm",
        "min": 5,
        "max": 30,
        "step": 1,
        "value": 10
      },
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 80,
        "step": 1,
        "value": 30
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "远视模型应加凸透镜还是凹透镜？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "调整屏位置模拟视网膜，再加凸透镜恢复清晰像。"
        },
        {
          "title": "指出观察证据",
          "text": "加合适凸透镜后光线会聚能力增强，可使清晰像回到视网膜位置。"
        },
        {
          "title": "解释现象",
          "text": "远视通常用凸透镜矫正；近视通常用凹透镜矫正。"
        },
        {
          "title": "完整回答",
          "text": "加入适当凸透镜，使光束提前会聚。"
        }
      ],
      "answer": "加入适当凸透镜，使光束提前会聚。"
    }
  },
  {
    "id": "phy-telescope",
    "subject": "physics",
    "term": "8上",
    "chapter": "第五章 透镜及其应用",
    "section": "5.5",
    "title": "双凸透镜望远镜设计",
    "kind": "拓展探究",
    "tags": [
      "跨学科实践"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "选择长焦物镜与短焦目镜，调节间距观察远物。",
    "apparatus": [
      "两块凸透镜",
      "镜筒",
      "刻度尺"
    ],
    "steps": [
      "选择较长焦距物镜和较短焦距目镜。",
      "调节两镜距离观察远物。",
      "比较目视效果和光路中间像。"
    ],
    "observations": [
      "合适组合可增大远处物体对眼睛的视角。"
    ],
    "conclusion": "折射望远镜由物镜成像，目镜再帮助观察中间像。",
    "examPoints": [
      "看得清远物不等于物像实际靠近",
      "两镜间距需调节"
    ],
    "pitfalls": [
      "严禁观察太阳"
    ],
    "questions": [
      {
        "q": "为什么望远镜常选长焦物镜和短焦目镜？",
        "a": "这种组合可获得较大的角放大作用，理想模型角放大率与两焦距之比有关。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "lens",
    "modelParams": {
      "scenario": "telescope",
      "variant": "telescope"
    },
    "modelNote": "采用理想开普勒望远镜，角放大率近似为物镜焦距与目镜焦距之比；这是两镜系统，忽略像差与有限视场。",
    "controls": [
      {
        "key": "objectiveFocal",
        "label": "物镜焦距",
        "unit": "cm",
        "min": 10,
        "max": 100,
        "step": 1,
        "value": 40
      },
      {
        "key": "eyepieceFocal",
        "label": "目镜焦距",
        "unit": "cm",
        "min": 2,
        "max": 20,
        "step": 1,
        "value": 5
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么望远镜常选长焦物镜和短焦目镜？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "选择长焦物镜与短焦目镜，调节间距观察远物。"
        },
        {
          "title": "指出观察证据",
          "text": "合适组合可增大远处物体对眼睛的视角。"
        },
        {
          "title": "解释现象",
          "text": "折射望远镜由物镜成像，目镜再帮助观察中间像。"
        },
        {
          "title": "完整回答",
          "text": "这种组合可获得较大的角放大作用，理想模型角放大率与两焦距之比有关。"
        }
      ],
      "answer": "这种组合可获得较大的角放大作用，理想模型角放大率与两焦距之比有关。"
    }
  },
  {
    "id": "phy-water-drop-microscope",
    "subject": "physics",
    "term": "8上",
    "chapter": "第五章 透镜及其应用",
    "section": "5.章末",
    "title": "水滴与放大镜组合观察微小物体",
    "kind": "小实验",
    "tags": [
      "复习与提高"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "用水滴透镜并调节上方放大镜寻找放大图像。",
    "apparatus": [
      "玻璃片",
      "水滴",
      "放大镜",
      "小物体"
    ],
    "steps": [
      "在透明支撑面形成小水滴透镜。",
      "放置细小物体并调整照明。",
      "在上方加入放大镜，调节间距观察。"
    ],
    "observations": [
      "合适组合可看见更大的微小物体细节。"
    ],
    "conclusion": "多个会聚元件可分级成像，但清晰度受到形状、照明和像差限制。",
    "examPoints": [
      "放大倍数不等于分辨率",
      "水滴焦距不固定"
    ],
    "pitfalls": [
      "不能宣称这种装置具有专业显微镜精度"
    ],
    "questions": [
      {
        "q": "水滴为什么可以作为简易透镜？",
        "a": "弯曲水面使光折射，形状适合时可产生会聚作用。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "lens",
    "modelParams": {
      "scenario": "microscope",
      "variant": "water-drop-microscope"
    },
    "modelNote": "将水滴作为物镜、上方放大镜作为目镜，采用两级薄透镜近似；水滴等效焦距是题设参数，真实形状、像差和光照会影响清晰度，不用模型倍率替代实物测量。",
    "controls": [
      {
        "key": "focal",
        "label": "水滴等效焦距",
        "unit": "cm",
        "min": 0.5,
        "max": 3,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "distance",
        "label": "物体到水滴距离",
        "unit": "cm",
        "min": 0.6,
        "max": 6,
        "step": 0.1,
        "value": 1.2
      },
      {
        "key": "eyepieceFocal",
        "label": "上方放大镜焦距",
        "unit": "cm",
        "min": 2,
        "max": 10,
        "step": 0.5,
        "value": 5
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "水滴为什么可以作为简易透镜？",
      "steps": [
        {
          "title": "明确要比较的条件",
          "text": "用水滴透镜并调节上方放大镜寻找放大图像。"
        },
        {
          "title": "指出观察证据",
          "text": "合适组合可看见更大的微小物体细节。"
        },
        {
          "title": "解释现象",
          "text": "多个会聚元件可分级成像，但清晰度受到形状、照明和像差限制。"
        },
        {
          "title": "完整回答",
          "text": "弯曲水面使光折射，形状适合时可产生会聚作用。"
        }
      ],
      "answer": "弯曲水面使光折射，形状适合时可产生会聚作用。"
    }
  },
  {
    "id": "phy-balance-mass",
    "subject": "physics",
    "term": "8上",
    "chapter": "第六章 质量与密度",
    "section": "6.1",
    "title": "托盘天平测量固体和液体质量",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "调平、选砝码、读游码，并利用容器质量差测液体。",
    "apparatus": [
      "托盘天平",
      "砝码",
      "镊子",
      "固体",
      "容器"
    ],
    "steps": [
      "把天平放在水平桌面并使游码归零。",
      "调平后左物右码，增减砝码并移动游码。",
      "平衡时读砝码总质量与游码示数之和。"
    ],
    "observations": [
      "天平平衡时两盘对支点的作用相抵。"
    ],
    "conclusion": "天平可通过与已知质量比较测量物体质量；液体要用容器差量法。",
    "examPoints": [
      "称量中不能再用平衡螺母凑平衡",
      "砝码用镊子夹取"
    ],
    "pitfalls": [
      "左右盘放反时不能机械相加"
    ],
    "questions": [
      {
        "q": "砝码共50 g，游码2.4 g，质量多少？",
        "a": "正确左物右码时质量52.4 g。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "measurement",
    "modelParams": {
      "scenario": "balance",
      "variant": "balance-mass"
    },
    "modelNote": "读数按给定分度值取整并示范零点修正；估读能力、视差和真实测量误差需结合器材训练。",
    "controls": [
      {
        "key": "value",
        "label": "待测量",
        "unit": "g",
        "min": 0,
        "max": 200,
        "step": 0.01,
        "value": 12.34
      },
      {
        "key": "division",
        "label": "分度值",
        "unit": "g",
        "min": 0.01,
        "max": 10,
        "step": 0.01,
        "value": 0.1
      },
      {
        "key": "zero",
        "label": "零点偏移",
        "unit": "g",
        "min": -5,
        "max": 5,
        "step": 0.1,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "砝码50 g，游码2.4 g，左物右码。",
      "steps": [
        {
          "title": "整理条件",
          "text": "砝码50 g，游码2.4 g，左物右码。"
        },
        {
          "title": "选用依据",
          "text": "物体质量=砝码总质量+游码示数。"
        },
        {
          "title": "代入求解",
          "text": "m=50+2.4=52.4 g。"
        },
        {
          "title": "写出结论",
          "text": "质量为52.4 g。"
        }
      ],
      "answer": "质量为52.4 g。"
    }
  },
  {
    "id": "phy-paperclip-mass",
    "subject": "physics",
    "term": "8上",
    "chapter": "第六章 质量与密度",
    "section": "6.1",
    "title": "累积测回形针质量并估计数量",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "测多枚同规格物体的总质量再平均。",
    "apparatus": [
      "天平",
      "同规格回形针"
    ],
    "steps": [
      "数出多个相同回形针。",
      "称量总质量并扣除容器质量。",
      "总质量除以枚数估算单枚质量。"
    ],
    "observations": [
      "多枚总质量更容易达到仪器可分辨范围。"
    ],
    "conclusion": "累积法可以测量单个质量太小的物体。",
    "examPoints": [
      "样品规格应近似一致",
      "数量估算不必为整数精确值"
    ],
    "pitfalls": [
      "不能把游码分度值当作单枚质量的真实精度"
    ],
    "questions": [
      {
        "q": "20枚回形针总质量8.0 g，单枚约多少？",
        "a": "约0.40 g。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "measurement",
    "modelParams": {
      "scenario": "balance",
      "variant": "paperclip-mass"
    },
    "modelNote": "天平读数表示多个回形针的总质量；再除以已知个数得到平均单个质量，不能把总质量当成单个质量。",
    "controls": [
      {
        "key": "value",
        "label": "多个回形针总质量",
        "unit": "g",
        "min": 0,
        "max": 200,
        "step": 0.1,
        "value": 10
      },
      {
        "key": "division",
        "label": "分度值",
        "unit": "g",
        "min": 0.01,
        "max": 10,
        "step": 0.01,
        "value": 0.2
      },
      {
        "key": "zero",
        "label": "零点偏移",
        "unit": "g",
        "min": -5,
        "max": 5,
        "step": 0.1,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "20枚同规格回形针总质量8.0 g。",
      "steps": [
        {
          "title": "整理条件",
          "text": "20枚同规格回形针总质量8.0 g。"
        },
        {
          "title": "选用依据",
          "text": "单枚平均质量=m总/N。"
        },
        {
          "title": "代入求解",
          "text": "8.0/20=0.40 g。"
        },
        {
          "title": "写出结论",
          "text": "单枚约0.40 g。"
        }
      ],
      "answer": "单枚约0.40 g。"
    }
  },
  {
    "id": "phy-mass-volume",
    "subject": "physics",
    "term": "8上",
    "chapter": "第六章 质量与密度",
    "section": "6.2",
    "title": "同种物质的质量与体积关系",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "测若干规则样品并作质量—体积图像。",
    "apparatus": [
      "天平",
      "规则样品",
      "刻度尺"
    ],
    "steps": [
      "测量同一种材料若干样品的质量和体积。",
      "绘制质量—体积图像。",
      "与另一种材料的图像比较。"
    ],
    "observations": [
      "同种均匀材料的质量与体积近似成正比，不同材料图线斜率可不同。"
    ],
    "conclusion": "密度是单位体积的质量，ρ=m/V。",
    "examPoints": [
      "m—V图斜率为密度",
      "同种物质需考虑温度与状态"
    ],
    "pitfalls": [
      "不能把质量大就说密度一定大"
    ],
    "questions": [
      {
        "q": "54 g样品体积20 cm³，密度是多少？",
        "a": "密度2.7 g/cm³，即2700 kg/m³。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "density",
    "modelParams": {
      "scenario": "solid",
      "variant": "mass-volume"
    },
    "modelNote": "根据模型质量和体积计算密度；默认材料均匀、无吸水、无气泡，排水量按完全浸入的体积计算。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "g",
        "min": 1,
        "max": 500,
        "step": 1,
        "value": 54
      },
      {
        "key": "volume",
        "label": "体积",
        "unit": "cm³",
        "min": 1,
        "max": 200,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "m=54 g，V=20 cm³。",
      "steps": [
        {
          "title": "整理条件",
          "text": "m=54 g，V=20 cm³。"
        },
        {
          "title": "选用依据",
          "text": "ρ=m/V。"
        },
        {
          "title": "代入求解",
          "text": "ρ=54/20=2.7 g/cm³=2700 kg/m³。"
        },
        {
          "title": "写出结论",
          "text": "密度为2700 kg/m³。"
        }
      ],
      "answer": "密度为2700 kg/m³。"
    }
  },
  {
    "id": "phy-classroom-air-mass",
    "subject": "physics",
    "term": "8上",
    "chapter": "第六章 质量与密度",
    "section": "6.2",
    "title": "测教室体积并估算空气质量",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "用空间尺寸与空气密度估算难以直接称量的质量。",
    "apparatus": [
      "卷尺",
      "空间尺寸记录"
    ],
    "steps": [
      "测量房间长、宽、高。",
      "用几何体积减去需考虑的大型占据体积。",
      "采用指定条件下空气密度估算质量。"
    ],
    "observations": [
      "空气虽然难以直接放上普通天平称量，仍具有质量。"
    ],
    "conclusion": "可用m=ρV进行间接测量，结果依赖温度、气压等条件。",
    "examPoints": [
      "空气密度随条件变化",
      "这是一项估算"
    ],
    "pitfalls": [
      "不能把估算密度当作所有环境固定常数"
    ],
    "questions": [
      {
        "q": "教室空气体积150 m³，按1.2 kg/m³估算质量多少？",
        "a": "约180 kg。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "density",
    "modelParams": {
      "scenario": "air",
      "variant": "classroom-air-mass"
    },
    "modelNote": "先由长×宽×高求教室体积，再用给定空气密度求质量；真实空气密度随温度、压强和湿度变化，忽略室内物品排开的体积。",
    "controls": [
      {
        "key": "roomLength",
        "label": "教室长",
        "unit": "m",
        "min": 3,
        "max": 15,
        "step": 0.5,
        "value": 10
      },
      {
        "key": "roomWidth",
        "label": "教室宽",
        "unit": "m",
        "min": 3,
        "max": 10,
        "step": 0.5,
        "value": 6
      },
      {
        "key": "roomHeight",
        "label": "教室高",
        "unit": "m",
        "min": 2,
        "max": 6,
        "step": 0.1,
        "value": 3
      },
      {
        "key": "airDensity",
        "label": "空气密度",
        "unit": "kg/m³",
        "min": 0.8,
        "max": 1.5,
        "step": 0.01,
        "value": 1.29
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "V=150 m³，指定空气密度ρ=1.2 kg/m³。",
      "steps": [
        {
          "title": "整理条件",
          "text": "V=150 m³，指定空气密度ρ=1.2 kg/m³。"
        },
        {
          "title": "选用依据",
          "text": "m=ρV。"
        },
        {
          "title": "代入求解",
          "text": "m=1.2×150=180 kg。"
        },
        {
          "title": "写出结论",
          "text": "空气质量约180 kg。"
        }
      ],
      "answer": "空气质量约180 kg。"
    }
  },
  {
    "id": "phy-saltwater-density",
    "subject": "physics",
    "term": "8上",
    "chapter": "第六章 质量与密度",
    "section": "6.3",
    "title": "测量配制盐水的密度",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "差量称质量并读量筒体积，计算密度。",
    "apparatus": [
      "天平",
      "烧杯",
      "盐水",
      "量筒"
    ],
    "steps": [
      "称烧杯与待测液体总质量。",
      "倒一部分到量筒并读体积。",
      "再称剩余总质量，用两次之差除以倒出体积。"
    ],
    "observations": [
      "两次称量差等于实际倒出液体质量，可减少残留影响。"
    ],
    "conclusion": "液体密度等于所测同一份液体质量与体积之比。",
    "examPoints": [
      "量筒读凹液面最低点",
      "质量与体积必须属于同一份液体"
    ],
    "pitfalls": [
      "先量后倒称若忽略残留会导致系统误差"
    ],
    "questions": [
      {
        "q": "倒出液体质量44 g、体积40 mL，密度多少？",
        "a": "1.1 g/cm³，即1100 kg/m³。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "density",
    "modelParams": {
      "scenario": "liquid",
      "variant": "saltwater-density"
    },
    "modelNote": "根据模型质量和体积计算密度；默认材料均匀、无吸水、无气泡，排水量按完全浸入的体积计算。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "g",
        "min": 1,
        "max": 500,
        "step": 1,
        "value": 54
      },
      {
        "key": "volume",
        "label": "体积",
        "unit": "cm³",
        "min": 1,
        "max": 200,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "倒出液体质量44 g，体积40 mL=40 cm³。",
      "steps": [
        {
          "title": "整理条件",
          "text": "倒出液体质量44 g，体积40 mL=40 cm³。"
        },
        {
          "title": "选用依据",
          "text": "ρ=m/V。"
        },
        {
          "title": "代入求解",
          "text": "ρ=44/40=1.1 g/cm³。"
        },
        {
          "title": "写出结论",
          "text": "密度1100 kg/m³。"
        }
      ],
      "answer": "密度1100 kg/m³。"
    }
  },
  {
    "id": "phy-stone-density",
    "subject": "physics",
    "term": "8上",
    "chapter": "第六章 质量与密度",
    "section": "6.3",
    "title": "排水法测不吸水石块密度",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "测质量与排开水体积。",
    "apparatus": [
      "天平",
      "量筒",
      "细线",
      "石块"
    ],
    "steps": [
      "先称干燥不吸水石块质量。",
      "记录量筒原水量，再使石块完全浸没。",
      "体积读数差与质量配合计算密度。"
    ],
    "observations": [
      "石块浸没后液面上升，差值等于排开水体积。"
    ],
    "conclusion": "对不溶、不吸水且完全浸没的物体，可用排水法测体积。",
    "examPoints": [
      "先测质量可减少附着水影响",
      "排除气泡"
    ],
    "pitfalls": [
      "不能把石块未完全浸没时的排水体积当总体积"
    ],
    "questions": [
      {
        "q": "石块54 g，量筒由30到50 mL，密度多少？",
        "a": "密度2.7 g/cm³。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "density",
    "modelParams": {
      "scenario": "displacement",
      "variant": "stone-density"
    },
    "modelNote": "根据模型质量和体积计算密度；默认材料均匀、无吸水、无气泡，排水量按完全浸入的体积计算。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "g",
        "min": 1,
        "max": 500,
        "step": 1,
        "value": 54
      },
      {
        "key": "volume",
        "label": "体积",
        "unit": "cm³",
        "min": 1,
        "max": 200,
        "step": 1,
        "value": 20
      },
      {
        "key": "initialVolume",
        "label": "量筒原水量",
        "unit": "mL",
        "min": 0,
        "max": 200,
        "step": 1,
        "value": 40
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "m=54 g；V₁=30 mL，V₂=50 mL。",
      "steps": [
        {
          "title": "整理条件",
          "text": "m=54 g；V₁=30 mL，V₂=50 mL。"
        },
        {
          "title": "选用依据",
          "text": "V石=V₂−V₁；ρ=m/V石。"
        },
        {
          "title": "代入求解",
          "text": "V石=20 cm³；ρ=54/20=2.7 g/cm³。"
        },
        {
          "title": "写出结论",
          "text": "密度2.7 g/cm³。"
        }
      ],
      "answer": "密度2.7 g/cm³。"
    }
  },
  {
    "id": "phy-foil-thickness-density",
    "subject": "physics",
    "term": "8上",
    "chapter": "第六章 质量与密度",
    "section": "6.4",
    "title": "用质量和面积推算铝箔厚度",
    "kind": "小实验",
    "tags": [
      "练习与应用"
    ],
    "sourceIds": [
      "physics-g8a-textbook"
    ],
    "objective": "由密度先求体积，再除以长宽面积。",
    "apparatus": [
      "天平",
      "刻度尺",
      "长方形铝箔"
    ],
    "steps": [
      "测铝箔质量、长度和宽度。",
      "用材料密度求体积。",
      "体积除以面积得到厚度并换算单位。"
    ],
    "observations": [
      "很薄的箔片厚度可通过较容易测量的质量与面积间接得到。"
    ],
    "conclusion": "均匀薄片厚度d=m/(ρS)。",
    "examPoints": [
      "统一长度、面积和密度单位",
      "表面涂层会影响估算"
    ],
    "pitfalls": [
      "不得把面积当体积"
    ],
    "questions": [
      {
        "q": "铝箔质量2.7 g、面积1000 cm²，密度2.7 g/cm³，厚度多少？",
        "a": "厚度0.001 cm，即0.010 mm。"
      }
    ],
    "safety": [
      "使用对应教学器材，涉及加热、玻璃或光源时由教师指导。"
    ],
    "model": "density",
    "modelParams": {
      "scenario": "foil",
      "variant": "foil-thickness-density"
    },
    "modelNote": "由m=ρSh反求平均厚度，假定薄膜均匀、无孔、单层且密度已知；面积用cm²、密度用g/cm³时先得厚度cm，再换算。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "g",
        "min": 0.1,
        "max": 10,
        "step": 0.1,
        "value": 2.7
      },
      {
        "key": "area",
        "label": "薄膜面积",
        "unit": "cm²",
        "min": 10,
        "max": 1000,
        "step": 10,
        "value": 100
      },
      {
        "key": "materialDensity",
        "label": "材料密度",
        "unit": "g/cm³",
        "min": 0.5,
        "max": 12,
        "step": 0.1,
        "value": 2.7
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "m=2.7 g，S=1000 cm²，ρ=2.7 g/cm³。",
      "steps": [
        {
          "title": "整理条件",
          "text": "m=2.7 g，S=1000 cm²，ρ=2.7 g/cm³。"
        },
        {
          "title": "选用依据",
          "text": "V=m/ρ，d=V/S。"
        },
        {
          "title": "代入求解",
          "text": "V=1 cm³；d=1/1000=0.001 cm=0.010 mm。"
        },
        {
          "title": "写出结论",
          "text": "厚度约0.010 mm。"
        }
      ],
      "answer": "厚度约0.010 mm。"
    }
  },
  {
    "id": "phy-deformation",
    "subject": "physics",
    "term": "8下",
    "chapter": "第七章 力",
    "section": "7.1",
    "title": "橡皮泥与弹簧的形变",
    "kind": "小实验",
    "tags": [
      "正文操作"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "按压橡皮泥，拉压弹簧，比较外形变化。",
    "apparatus": [
      "橡皮泥",
      "弹簧",
      "直尺",
      "橡皮筋"
    ],
    "steps": [
      "分别压橡皮泥、拉伸弹簧。",
      "撤去作用力观察能否恢复。",
      "比较形状改变与材料弹性。"
    ],
    "observations": [
      "力可改变物体形状；有些形变撤力后恢复，有些不能完全恢复。"
    ],
    "conclusion": "力可以使物体发生形变；弹性形变应限制在材料允许范围内。",
    "examPoints": [
      "力的作用效果包括形变与运动状态变化"
    ],
    "pitfalls": [
      "不能认为看不见形变就一定没有形变"
    ],
    "questions": [
      {
        "q": "弹簧能恢复而橡皮泥不易恢复，说明什么？",
        "a": "两者都发生形变，但恢复性质不同；弹簧在弹性范围内能恢复。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "force",
    "modelParams": {
      "scenario": "deformation",
      "variant": "deformation"
    },
    "modelNote": "展示指定方向的力与合力；静态受力结果不等于物体实际运动轨迹。",
    "controls": [
      {
        "key": "force",
        "label": "向右力",
        "unit": "N",
        "min": 0,
        "max": 50,
        "step": 0.5,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "弹簧能恢复而橡皮泥不易恢复，说明什么？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "按压橡皮泥，拉压弹簧，比较外形变化。"
        },
        {
          "title": "引用观察",
          "text": "力可改变物体形状；有些形变撤力后恢复，有些不能完全恢复。"
        },
        {
          "title": "建立解释",
          "text": "力可以使物体发生形变；弹性形变应限制在材料允许范围内。"
        },
        {
          "title": "完整回答",
          "text": "两者都发生形变，但恢复性质不同；弹簧在弹性范围内能恢复。"
        }
      ],
      "answer": "两者都发生形变，但恢复性质不同；弹簧在弹性范围内能恢复。"
    }
  },
  {
    "id": "phy-magnet-ball",
    "subject": "physics",
    "term": "8下",
    "chapter": "第七章 力",
    "section": "7.1",
    "title": "磁体改变铁球运动",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "比较静止、前方磁体、侧方磁体三种配置。",
    "apparatus": [
      "铁球",
      "平直轨道",
      "磁体"
    ],
    "steps": [
      "先观察无磁体时的运动。",
      "在前方或侧方放置磁体模型。",
      "比较速度大小和方向的变化。"
    ],
    "observations": [
      "前方磁体可改变快慢，侧方磁体可使运动方向偏转。"
    ],
    "conclusion": "力能够改变物体的运动状态，改变包括快慢和方向。",
    "examPoints": [
      "方向变化也属于运动状态变化"
    ],
    "pitfalls": [
      "不能把力说成维持一切运动的必要条件"
    ],
    "questions": [
      {
        "q": "铁球速度大小不变但方向改变，是否受力？",
        "a": "运动状态改变，合力不为零。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "motion",
    "modelParams": {
      "scenario": "force",
      "variant": "magnet-ball"
    },
    "modelNote": "当前动力学计算展示沿选定方向的外力使速度变化；磁力大小作为给定量，未按磁铁位置计算二维弯曲轨迹。磁体在旁侧使运动方向改变的实物观察见实验步骤。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "velocity",
        "label": "初速度",
        "unit": "m/s",
        "min": 0,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "force",
        "label": "拉力",
        "unit": "N",
        "min": 0,
        "max": 20,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "duration",
        "label": "观察时长",
        "unit": "s",
        "min": 0.2,
        "max": 5,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "铁球速度大小不变但方向改变，是否受力？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "比较静止、前方磁体、侧方磁体三种配置。"
        },
        {
          "title": "引用观察",
          "text": "前方磁体可改变快慢，侧方磁体可使运动方向偏转。"
        },
        {
          "title": "建立解释",
          "text": "力能够改变物体的运动状态，改变包括快慢和方向。"
        },
        {
          "title": "完整回答",
          "text": "运动状态改变，合力不为零。"
        }
      ],
      "answer": "运动状态改变，合力不为零。"
    }
  },
  {
    "id": "phy-door-point",
    "subject": "physics",
    "term": "8下",
    "chapter": "第七章 力",
    "section": "7.1",
    "title": "推门位置与作用效果",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "相同推力下改变手到门轴的距离。",
    "apparatus": [
      "门模型",
      "门轴",
      "测力计"
    ],
    "steps": [
      "保持施力方向相同。",
      "在远离和靠近门轴处施加相同大小的力。",
      "比较转动效果并标出力臂。"
    ],
    "observations": [
      "同样方向和大小的力，作用位置越远离门轴通常越易推动门。"
    ],
    "conclusion": "力的作用效果与作用点有关；转动效果取决于力和力臂。",
    "examPoints": [
      "力臂是支点到力作用线的垂直距离"
    ],
    "pitfalls": [
      "不能把沿着门板方向的力臂直接当门宽"
    ],
    "questions": [
      {
        "q": "推门时为什么靠近门把手更省力？",
        "a": "通常力臂较长，取得同样转动效果需要的力较小。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "lever",
    "modelParams": {
      "scenario": "classification",
      "variant": "door-point"
    },
    "modelNote": "采用轻质刚性杠杆，忽略支点摩擦；输入的力臂是到力作用线的垂距。",
    "controls": [
      {
        "key": "force",
        "label": "动力",
        "unit": "N",
        "min": 1,
        "max": 50,
        "step": 0.5,
        "value": 10
      },
      {
        "key": "arm",
        "label": "动力臂",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 30
      },
      {
        "key": "load",
        "label": "阻力",
        "unit": "N",
        "min": 1,
        "max": 50,
        "step": 0.5,
        "value": 15
      },
      {
        "key": "loadArm",
        "label": "阻力臂",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "推门时为什么靠近门把手更省力？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "相同推力下改变手到门轴的距离。"
        },
        {
          "title": "引用观察",
          "text": "同样方向和大小的力，作用位置越远离门轴通常越易推动门。"
        },
        {
          "title": "建立解释",
          "text": "力的作用效果与作用点有关；转动效果取决于力和力臂。"
        },
        {
          "title": "完整回答",
          "text": "通常力臂较长，取得同样转动效果需要的力较小。"
        }
      ],
      "answer": "通常力臂较长，取得同样转动效果需要的力较小。"
    }
  },
  {
    "id": "phy-magnet-carts",
    "subject": "physics",
    "term": "8下",
    "chapter": "第七章 力",
    "section": "7.1",
    "title": "两辆磁体小车相互作用",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "释放两车并观察双方同时运动。",
    "apparatus": [
      "两辆小车",
      "磁体",
      "低摩擦轨道"
    ],
    "steps": [
      "让两车相对放置。",
      "同时释放观察两车运动。",
      "改变其中一车质量再比较。"
    ],
    "observations": [
      "两车可同时向相反方向运动；运动快慢可不同。"
    ],
    "conclusion": "物体间力的作用是相互的，一对作用力分别作用在两个物体上。",
    "examPoints": [
      "相互作用力不同于同一物体上的平衡力"
    ],
    "pitfalls": [
      "运动快的一方不代表受力更大"
    ],
    "questions": [
      {
        "q": "人推墙后后退，能说墙没有对人施力吗？",
        "a": "不能。人对墙施力，墙也对人施力，使人运动状态改变。"
      }
    ],
    "safety": [
      "人体滑行只在模拟中观察，不穿滑轮鞋自行推墙实验。"
    ],
    "model": "force",
    "modelParams": {
      "scenario": "interaction",
      "variant": "magnet-carts"
    },
    "modelNote": "展示指定方向的力与合力；静态受力结果不等于物体实际运动轨迹。",
    "controls": [
      {
        "key": "force",
        "label": "向右力",
        "unit": "N",
        "min": 0,
        "max": 50,
        "step": 0.5,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "人推墙后后退，能说墙没有对人施力吗？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "释放两车并观察双方同时运动。"
        },
        {
          "title": "引用观察",
          "text": "两车可同时向相反方向运动；运动快慢可不同。"
        },
        {
          "title": "建立解释",
          "text": "物体间力的作用是相互的，一对作用力分别作用在两个物体上。"
        },
        {
          "title": "完整回答",
          "text": "不能。人对墙施力，墙也对人施力，使人运动状态改变。"
        }
      ],
      "answer": "不能。人对墙施力，墙也对人施力，使人运动状态改变。"
    }
  },
  {
    "id": "phy-spring-scale",
    "subject": "physics",
    "term": "8下",
    "chapter": "第七章 力",
    "section": "7.2",
    "title": "使用弹簧测力计",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "含识别量程分度值、调零、手感以及竖直悬挂和水平拉动文具袋。",
    "apparatus": [
      "弹簧测力计",
      "钩码",
      "文具袋"
    ],
    "steps": [
      "检查量程和分度值并调零。",
      "让拉力沿弹簧轴线作用。",
      "待示数稳定后读数，比较水平与竖直测量。"
    ],
    "observations": [
      "在弹性范围内拉力越大，弹簧伸长越明显。"
    ],
    "conclusion": "弹簧测力计利用弹力与伸长量的关系测力。",
    "examPoints": [
      "伸长量不同于弹簧总长度",
      "调零方向应与使用方向相同"
    ],
    "pitfalls": [
      "不能超过量程或横向拉扯"
    ],
    "questions": [
      {
        "q": "0～5 N共50小格，指针在23格，读数多少？",
        "a": "读数2.3 N。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "spring",
    "modelParams": {
      "scenario": "measurement",
      "variant": "spring-scale"
    },
    "modelNote": "在弹性限度内使用胡克定律，超出限度不外推弹性伸长；劲度系数为模型参数。",
    "controls": [
      {
        "key": "force",
        "label": "拉力",
        "unit": "N",
        "min": 0,
        "max": 20,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "stiffness",
        "label": "劲度系数",
        "unit": "N/m",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 100
      },
      {
        "key": "limit",
        "label": "弹性限度对应力",
        "unit": "N",
        "min": 1,
        "max": 30,
        "step": 1,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "量程0～5 N，50小格，指针23格。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "量程0～5 N，50小格，指针23格。"
        },
        {
          "title": "选用原理",
          "text": "分度值=5/50=0.1 N。"
        },
        {
          "title": "代入计算",
          "text": "F=23×0.1=2.3 N。"
        },
        {
          "title": "作答",
          "text": "力为2.3 N。"
        }
      ],
      "answer": "力为2.3 N。"
    }
  },
  {
    "id": "phy-glass-microdeform",
    "subject": "physics",
    "term": "8下",
    "chapter": "第七章 力",
    "section": "7.2",
    "title": "水柱放大玻璃瓶微小形变",
    "kind": "小实验",
    "tags": [
      "练习与应用4"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "改变捏瓶位置，观察细管液面升降。",
    "apparatus": [
      "厚玻璃瓶模型",
      "细管",
      "水"
    ],
    "steps": [
      "使瓶内充满水并连接细管。",
      "比较捏不同位置时的液面。",
      "撤力后观察是否恢复。"
    ],
    "observations": [
      "不易直接看出的瓶体形变可由细管水柱变化显示。"
    ],
    "conclusion": "微小形变可借液柱位移放大观察。",
    "examPoints": [
      "转换法与放大法",
      "温度变化也会影响液柱"
    ],
    "pitfalls": [
      "不能只凭水柱变化排除热胀冷缩，需要控制手温影响"
    ],
    "questions": [
      {
        "q": "细管在这个实验中起什么作用？",
        "a": "把瓶体很小的体积变化转成较明显的液面高度变化。"
      }
    ],
    "safety": [
      "玻璃瓶用模型演示，勿用力挤压实际玻璃容器。"
    ],
    "model": "spring",
    "modelParams": {
      "scenario": "microdeformation",
      "variant": "glass-microdeform"
    },
    "modelNote": "以给定等效体积柔度计算形变量，再由细管截面积计算放大液面高度；参数不是实际玻璃常数，不计算三维应力和容器受力极限。",
    "controls": [
      {
        "key": "force",
        "label": "拉力",
        "unit": "N",
        "min": 0,
        "max": 20,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "compliance",
        "label": "等效体积柔度（模型）",
        "unit": "cm³/N",
        "min": 0.0005,
        "max": 0.005,
        "step": 0.0005,
        "value": 0.002
      },
      {
        "key": "tubeArea",
        "label": "细管截面积",
        "unit": "mm²",
        "min": 0.5,
        "max": 5,
        "step": 0.5,
        "value": 1
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "细管在这个实验中起什么作用？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "改变捏瓶位置，观察细管液面升降。"
        },
        {
          "title": "引用观察",
          "text": "不易直接看出的瓶体形变可由细管水柱变化显示。"
        },
        {
          "title": "建立解释",
          "text": "微小形变可借液柱位移放大观察。"
        },
        {
          "title": "完整回答",
          "text": "把瓶体很小的体积变化转成较明显的液面高度变化。"
        }
      ],
      "answer": "把瓶体很小的体积变化转成较明显的液面高度变化。"
    }
  },
  {
    "id": "phy-gravity-mass",
    "subject": "physics",
    "term": "8下",
    "chapter": "第七章 力",
    "section": "7.3",
    "title": "重力与质量的关系",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "以多组钩码数据绘制重力—质量图像。",
    "apparatus": [
      "弹簧测力计",
      "多组钩码",
      "质量记录表"
    ],
    "steps": [
      "分别测量不同质量钩码的重力。",
      "统一质量单位为kg。",
      "计算G/m并绘制图像。"
    ],
    "observations": [
      "同一地点重力随质量增加而近似成正比。"
    ],
    "conclusion": "G=mg，同一地点g近似不变。",
    "examPoints": [
      "质量单位kg，重力单位N",
      "g不是9.8 kg"
    ],
    "pitfalls": [
      "不能把质量与重力叫作同一物理量"
    ],
    "questions": [
      {
        "q": "质量0.20 kg，g取9.8 N/kg，重力多少？",
        "a": "重力1.96 N。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "force",
    "modelParams": {
      "scenario": "gravity",
      "variant": "gravity-mass"
    },
    "modelNote": "展示指定方向的力与合力；静态受力结果不等于物体实际运动轨迹。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.1,
        "max": 10,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "gravity",
        "label": "重力场强度",
        "unit": "N/kg",
        "min": 1,
        "max": 10,
        "step": 0.1,
        "value": 9.8
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "m=0.20 kg，g=9.8 N/kg。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "m=0.20 kg，g=9.8 N/kg。"
        },
        {
          "title": "选用原理",
          "text": "G=mg。"
        },
        {
          "title": "代入计算",
          "text": "G=0.20×9.8=1.96 N。"
        },
        {
          "title": "作答",
          "text": "重力1.96 N，方向竖直向下。"
        }
      ],
      "answer": "重力1.96 N，方向竖直向下。"
    }
  },
  {
    "id": "phy-plumb-level",
    "subject": "physics",
    "term": "8下",
    "chapter": "第七章 力",
    "section": "7.3",
    "title": "铅垂线和三角板水平仪",
    "kind": "小实验",
    "tags": [
      "正文应用与练习5"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "利用重力方向检验桌面是否水平。",
    "apparatus": [
      "铅垂线",
      "三角板模型",
      "桌面"
    ],
    "steps": [
      "悬挂重物等待静止。",
      "将三角板一边与桌面贴合。",
      "比较悬线与标记线的位置。"
    ],
    "observations": [
      "静止悬线在重力作用下指向竖直方向。"
    ],
    "conclusion": "重力方向竖直向下，可用铅垂线检查水平或竖直。",
    "examPoints": [
      "竖直向下不等于垂直任意斜面向下"
    ],
    "pitfalls": [
      "斜面法线不能直接当重力方向"
    ],
    "questions": [
      {
        "q": "桌面倾斜后铅垂线会跟着倾斜吗？",
        "a": "静止悬线仍近似沿竖直方向，不随桌面倾斜。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "force",
    "modelParams": {
      "scenario": "gravity",
      "variant": "plumb-level"
    },
    "modelNote": "展示指定方向的力与合力；静态受力结果不等于物体实际运动轨迹。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.1,
        "max": 10,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "gravity",
        "label": "重力场强度",
        "unit": "N/kg",
        "min": 1,
        "max": 10,
        "step": 0.1,
        "value": 9.8
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "桌面倾斜后铅垂线会跟着倾斜吗？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "利用重力方向检验桌面是否水平。"
        },
        {
          "title": "引用观察",
          "text": "静止悬线在重力作用下指向竖直方向。"
        },
        {
          "title": "建立解释",
          "text": "重力方向竖直向下，可用铅垂线检查水平或竖直。"
        },
        {
          "title": "完整回答",
          "text": "静止悬线仍近似沿竖直方向，不随桌面倾斜。"
        }
      ],
      "answer": "静止悬线仍近似沿竖直方向，不随桌面倾斜。"
    }
  },
  {
    "id": "phy-steel-ruler-force",
    "subject": "physics",
    "term": "8下",
    "chapter": "第七章 力",
    "section": "7.review",
    "title": "钢尺弯曲研究力的三要素",
    "kind": "小实验",
    "tags": [
      "复习与提高2"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "改变测力计的拉力、方向或作用位置，比较钢尺弯曲。",
    "apparatus": [
      "钢尺模型",
      "测力计",
      "固定夹"
    ],
    "steps": [
      "固定钢尺一端。",
      "每次只改变拉力大小、方向或作用点中的一个。",
      "比较弯曲程度和方向。"
    ],
    "observations": [
      "不同大小、方向或作用点的力可产生不同弯曲效果。"
    ],
    "conclusion": "力的三要素是大小、方向和作用点。",
    "examPoints": [
      "控制变量逐一研究三要素"
    ],
    "pitfalls": [
      "不能同时改变三个因素后判断某一个因素的作用"
    ],
    "questions": [
      {
        "q": "研究作用点影响时应保持什么不变？",
        "a": "应保持力的大小、方向以及钢尺固定方式等相同。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "force",
    "modelParams": {
      "scenario": "deformation",
      "variant": "steel-ruler-force"
    },
    "modelNote": "展示指定方向的力与合力；静态受力结果不等于物体实际运动轨迹。",
    "controls": [
      {
        "key": "force",
        "label": "向右力",
        "unit": "N",
        "min": 0,
        "max": 50,
        "step": 0.5,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "研究作用点影响时应保持什么不变？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "改变测力计的拉力、方向或作用位置，比较钢尺弯曲。"
        },
        {
          "title": "引用观察",
          "text": "不同大小、方向或作用点的力可产生不同弯曲效果。"
        },
        {
          "title": "建立解释",
          "text": "力的三要素是大小、方向和作用点。"
        },
        {
          "title": "完整回答",
          "text": "应保持力的大小、方向以及钢尺固定方式等相同。"
        }
      ],
      "answer": "应保持力的大小、方向以及钢尺固定方式等相同。"
    }
  },
  {
    "id": "phy-resistance-motion",
    "subject": "physics",
    "term": "8下",
    "chapter": "第八章 运动和力",
    "section": "8.1",
    "title": "不同阻力下的小车滑行",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "保持同一斜面释放高度，比较棉布和木板上的停止位置。",
    "apparatus": [
      "斜面",
      "小车",
      "木板",
      "棉布"
    ],
    "steps": [
      "从同一斜面高度静止释放小车。",
      "改变水平面粗糙程度。",
      "比较滑行距离并推理阻力趋近零的情形。"
    ],
    "observations": [
      "阻力越小，小车滑行越远。"
    ],
    "conclusion": "运动不需要力来维持；若物体不受力，原来的运动状态保持。",
    "examPoints": [
      "同高释放用于近似保证到水平面初速度相同",
      "实验推理并非真的做出无阻力环境"
    ],
    "pitfalls": [
      "不能把木板上未停下的有限距离直接称为无限运动"
    ],
    "questions": [
      {
        "q": "为什么小车要从同一高度释放？",
        "a": "尽量保证进入水平面时初速度相同，便于比较阻力差异。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "motion",
    "modelParams": {
      "scenario": "friction",
      "variant": "resistance-motion",
      "force": 0
    },
    "modelNote": "由 Godot 刚体引擎计算运动；采用理想水平面和给定摩擦系数，不包含空气阻力或实物轮轴细节。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "velocity",
        "label": "初速度",
        "unit": "m/s",
        "min": 0,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "duration",
        "label": "观察时长",
        "unit": "s",
        "min": 0.2,
        "max": 5,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "friction",
        "label": "动摩擦因数",
        "unit": "",
        "min": 0,
        "max": 1,
        "step": 0.01,
        "value": 0.1
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么小车要从同一高度释放？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "保持同一斜面释放高度，比较棉布和木板上的停止位置。"
        },
        {
          "title": "引用观察",
          "text": "阻力越小，小车滑行越远。"
        },
        {
          "title": "建立解释",
          "text": "运动不需要力来维持；若物体不受力，原来的运动状态保持。"
        },
        {
          "title": "完整回答",
          "text": "尽量保证进入水平面时初速度相同，便于比较阻力差异。"
        }
      ],
      "answer": "尽量保证进入水平面时初速度相同，便于比较阻力差异。"
    }
  },
  {
    "id": "phy-inertia-sheet",
    "subject": "physics",
    "term": "8下",
    "chapter": "第八章 运动和力",
    "section": "8.1",
    "title": "弹出金属片后的小球",
    "kind": "小实验",
    "tags": [
      "想想议议中的演示装置"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "观察支撑片快速移走时小球的运动。",
    "apparatus": [
      "支撑片模型",
      "小球",
      "接球容器"
    ],
    "steps": [
      "先使小球与支撑片静止。",
      "快速水平移走支撑片。",
      "观察小球水平与竖直运动。"
    ],
    "observations": [
      "小球不会立即跟随支撑片获得相同水平速度，而在重力作用下下落。"
    ],
    "conclusion": "物体有保持原来运动状态的性质，称为惯性。",
    "examPoints": [
      "惯性是性质，不是一种力",
      "下落由重力造成"
    ],
    "pitfalls": [
      "不要说惯性把小球向下拉"
    ],
    "questions": [
      {
        "q": "快速抽走纸片，小球为什么落入下面容器？",
        "a": "小球原来近似静止，水平方向来不及获得较大速度，同时受重力下落。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "motion",
    "modelParams": {
      "scenario": "inertia",
      "variant": "inertia-sheet"
    },
    "modelNote": "由 Godot 刚体引擎计算运动；采用理想水平面和给定摩擦系数，不包含空气阻力或实物轮轴细节。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "velocity",
        "label": "初速度",
        "unit": "m/s",
        "min": 0,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "duration",
        "label": "观察时长",
        "unit": "s",
        "min": 0.2,
        "max": 5,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "friction",
        "label": "动摩擦因数",
        "unit": "",
        "min": 0,
        "max": 1,
        "step": 0.01,
        "value": 0.1
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "快速抽走纸片，小球为什么落入下面容器？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "观察支撑片快速移走时小球的运动。"
        },
        {
          "title": "引用观察",
          "text": "小球不会立即跟随支撑片获得相同水平速度，而在重力作用下下落。"
        },
        {
          "title": "建立解释",
          "text": "物体有保持原来运动状态的性质，称为惯性。"
        },
        {
          "title": "完整回答",
          "text": "小球原来近似静止，水平方向来不及获得较大速度，同时受重力下落。"
        }
      ],
      "answer": "小球原来近似静止，水平方向来不及获得较大速度，同时受重力下落。"
    }
  },
  {
    "id": "phy-two-force-balance",
    "subject": "physics",
    "term": "8下",
    "chapter": "第八章 运动和力",
    "section": "8.2",
    "title": "小车二力平衡条件",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "改变两端钩码与两力作用线，检验平衡。",
    "apparatus": [
      "小车",
      "滑轮",
      "钩码",
      "细线"
    ],
    "steps": [
      "用相反方向的两根线拉小车。",
      "改变力大小并观察是否静止。",
      "改变作用线后比较能否保持平衡。"
    ],
    "observations": [
      "同一直线、反向、等大的两力可使小车保持平衡。"
    ],
    "conclusion": "作用于同一物体的两个平衡力大小相等、方向相反、作用在同一直线上。",
    "examPoints": [
      "平衡力必须作用于同一物体",
      "平衡可静止也可匀速直线运动"
    ],
    "pitfalls": [
      "不能把作用在两车上的相互作用力叫二力平衡"
    ],
    "questions": [
      {
        "q": "物体静止时两拉力各3 N，合力是多少？",
        "a": "合力为0 N。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "force",
    "modelParams": {
      "scenario": "balance",
      "variant": "two-force-balance"
    },
    "modelNote": "展示指定方向的力与合力；静态受力结果不等于物体实际运动轨迹。",
    "controls": [
      {
        "key": "force",
        "label": "向右力",
        "unit": "N",
        "min": 0,
        "max": 50,
        "step": 0.5,
        "value": 10
      },
      {
        "key": "force2",
        "label": "向左力",
        "unit": "N",
        "min": 0,
        "max": 50,
        "step": 0.5,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "同一物体受同一直线反向两力，均3 N。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "同一物体受同一直线反向两力，均3 N。"
        },
        {
          "title": "选用原理",
          "text": "反向共线两力合力大小为较大力减较小力。"
        },
        {
          "title": "代入计算",
          "text": "F合=3−3=0 N。"
        },
        {
          "title": "作答",
          "text": "合力0 N，运动状态保持。"
        }
      ],
      "answer": "合力0 N，运动状态保持。"
    }
  },
  {
    "id": "phy-sliding-friction",
    "subject": "physics",
    "term": "8下",
    "chapter": "第八章 运动和力",
    "section": "8.3",
    "title": "滑动摩擦力的影响因素",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "同材料下分别改变压力和粗糙程度；以水平匀速拉动测量。",
    "apparatus": [
      "木块",
      "测力计",
      "砝码",
      "不同表面"
    ],
    "steps": [
      "水平匀速拉动木块读出拉力。",
      "固定表面改变压力。",
      "固定压力改变接触面粗糙程度。"
    ],
    "observations": [
      "其他条件相同，压力更大或表面更粗糙时滑动摩擦通常更大。"
    ],
    "conclusion": "匀速时拉力与滑动摩擦力平衡，可通过拉力测得摩擦力。",
    "examPoints": [
      "测量依据是二力平衡",
      "压力不总等于重力，需看受力"
    ],
    "pitfalls": [
      "拉动加速时不能直接把测力计示数当摩擦力"
    ],
    "questions": [
      {
        "q": "为何必须水平匀速拉动？",
        "a": "让水平方向合力为零，从而拉力大小等于摩擦力。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "motion",
    "modelParams": {
      "scenario": "friction",
      "variant": "sliding-friction",
      "uniformPull": true
    },
    "modelNote": "匀速水平拉动时拉力等于滑动摩擦力μmg；引擎按此平衡条件设定拉力。模型不定量描述静摩擦启动或材料磨损。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "friction",
        "label": "动摩擦因数",
        "unit": "",
        "min": 0,
        "max": 1,
        "step": 0.01,
        "value": 0.1
      },
      {
        "key": "velocity",
        "label": "初速度",
        "unit": "m/s",
        "min": 0,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "duration",
        "label": "观察时长",
        "unit": "s",
        "min": 0.2,
        "max": 5,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为何必须水平匀速拉动？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "同材料下分别改变压力和粗糙程度；以水平匀速拉动测量。"
        },
        {
          "title": "引用观察",
          "text": "其他条件相同，压力更大或表面更粗糙时滑动摩擦通常更大。"
        },
        {
          "title": "建立解释",
          "text": "匀速时拉力与滑动摩擦力平衡，可通过拉力测得摩擦力。"
        },
        {
          "title": "完整回答",
          "text": "让水平方向合力为零，从而拉力大小等于摩擦力。"
        }
      ],
      "answer": "让水平方向合力为零，从而拉力大小等于摩擦力。"
    }
  },
  {
    "id": "phy-collinear-forces",
    "subject": "physics",
    "term": "8下",
    "chapter": "第八章 运动和力",
    "section": "8.4",
    "title": "同一直线二力的合成",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "橡皮筋圆环同位置，分别比较同向和反向两力与替代单力。",
    "apparatus": [
      "橡皮筋",
      "小环",
      "两个测力计",
      "标记纸"
    ],
    "steps": [
      "用两个共线力把小环拉至指定位置。",
      "改用一个力达到相同位置。",
      "比较同向与反向两种情况。"
    ],
    "observations": [
      "同向两力的替代单力大小相加，反向时大小相减。"
    ],
    "conclusion": "合力与分力的作用效果相同；共线合成需要同时判断大小与方向。",
    "examPoints": [
      "等效替代要求橡皮筋形变相同"
    ],
    "pitfalls": [
      "合力不是一定比分力大"
    ],
    "questions": [
      {
        "q": "向右5 N与向左2 N的合力如何？",
        "a": "合力3 N，方向向右。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "force",
    "modelParams": {
      "scenario": "resultant",
      "variant": "collinear-forces"
    },
    "modelNote": "展示指定方向的力与合力；静态受力结果不等于物体实际运动轨迹。",
    "controls": [
      {
        "key": "force",
        "label": "向右力",
        "unit": "N",
        "min": 0,
        "max": 50,
        "step": 0.5,
        "value": 10
      },
      {
        "key": "force2",
        "label": "向左力",
        "unit": "N",
        "min": 0,
        "max": 50,
        "step": 0.5,
        "value": 10
      },
      {
        "key": "direction",
        "label": "第二力方向",
        "options": [
          {
            "value": "same",
            "label": "同向"
          },
          {
            "value": "opposite",
            "label": "反向"
          }
        ],
        "value": "opposite"
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "向右5 N，向左2 N。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "向右5 N，向左2 N。"
        },
        {
          "title": "选用原理",
          "text": "反向共线两力求差，方向取较大力方向。"
        },
        {
          "title": "代入计算",
          "text": "F合=5−2=3 N。"
        },
        {
          "title": "作答",
          "text": "合力向右3 N。"
        }
      ],
      "answer": "合力向右3 N。"
    }
  },
  {
    "id": "phy-sponge-pressure",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.1",
    "title": "压力和接触面积的作用",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "海绵上小桌改变载荷和朝向，控制另一个变量。",
    "apparatus": [
      "海绵",
      "小桌",
      "砝码"
    ],
    "steps": [
      "保持接触面积不变，改变载荷。",
      "保持载荷不变，改变小桌接触面积。",
      "比较海绵凹陷。"
    ],
    "observations": [
      "压力更大或受力面积更小时，凹陷更明显。"
    ],
    "conclusion": "压强p=F/S，表示压力作用效果。",
    "examPoints": [
      "压力和压强不同",
      "海绵凹陷是作用效果指标"
    ],
    "pitfalls": [
      "不能认为压力大时压强一定大"
    ],
    "questions": [
      {
        "q": "压力100 N、面积20 cm²，压强多少？",
        "a": "压强50000 Pa。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "solid",
      "variant": "sponge-pressure"
    },
    "modelNote": "由压力和受力面积计算压强；海绵凹陷只用作效果示意，没有真实材料应力应变参数，不能据图测凹陷深度。",
    "controls": [
      {
        "key": "force",
        "label": "压力",
        "unit": "N",
        "min": 1,
        "max": 1000,
        "step": 1,
        "value": 100
      },
      {
        "key": "area",
        "label": "受力面积",
        "unit": "cm²",
        "min": 1,
        "max": 200,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "F=100 N，S=20 cm²=0.002 m²。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "F=100 N，S=20 cm²=0.002 m²。"
        },
        {
          "title": "选用原理",
          "text": "p=F/S。"
        },
        {
          "title": "代入计算",
          "text": "p=100/0.002=50000 Pa。"
        },
        {
          "title": "作答",
          "text": "压强5.0×10⁴ Pa。"
        }
      ],
      "answer": "压强5.0×10⁴ Pa。"
    }
  },
  {
    "id": "phy-shoe-pressure",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.1",
    "title": "方格纸鞋印估测压强",
    "kind": "小实验",
    "tags": [
      "练习与应用1"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "测质量并由鞋印格数估算双脚接触面积。",
    "apparatus": [
      "体重数据",
      "方格纸",
      "鞋印模型"
    ],
    "steps": [
      "由质量计算重力。",
      "数格估计双脚总受力面积。",
      "计算静止站立时平均压强。"
    ],
    "observations": [
      "单脚站立时总受力面积减少，平均压强增大。"
    ],
    "conclusion": "水平静止且无其他竖直力时，压力近似等于重力。",
    "examPoints": [
      "数格需要处理不满一格区域",
      "双脚与单脚面积不同"
    ],
    "pitfalls": [
      "鞋底外轮廓面积不一定等于实际接触面积"
    ],
    "questions": [
      {
        "q": "同一个人单脚站与双脚站，哪种平均压强更大？",
        "a": "其他条件相同，单脚站受力面积更小，平均压强更大。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "solid",
      "variant": "shoe-pressure"
    },
    "modelNote": "固体使用p=F/S，静止液体使用p=ρgh；未包含容器材料形变，流动模型需另看具体说明。",
    "controls": [
      {
        "key": "force",
        "label": "对地压力",
        "unit": "N",
        "min": 1,
        "max": 1000,
        "step": 1,
        "value": 500
      },
      {
        "key": "area",
        "label": "总接触面积",
        "unit": "cm²",
        "min": 20,
        "max": 500,
        "step": 1,
        "value": 250
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "同一个人单脚站与双脚站，哪种平均压强更大？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "测质量并由鞋印格数估算双脚接触面积。"
        },
        {
          "title": "引用观察",
          "text": "单脚站立时总受力面积减少，平均压强增大。"
        },
        {
          "title": "建立解释",
          "text": "水平静止且无其他竖直力时，压力近似等于重力。"
        },
        {
          "title": "完整回答",
          "text": "其他条件相同，单脚站受力面积更小，平均压强更大。"
        }
      ],
      "answer": "其他条件相同，单脚站受力面积更小，平均压强更大。"
    }
  },
  {
    "id": "phy-liquid-pressure",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.2",
    "title": "液体压强的影响因素",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "用橡皮膜探头和U形管分别考察方向、深度、密度。",
    "apparatus": [
      "橡皮膜探头",
      "U形管",
      "水",
      "盐水"
    ],
    "steps": [
      "保持深度不变，改变探头朝向。",
      "同种液体中改变深度。",
      "相同深度换不同密度液体。"
    ],
    "observations": [
      "同深度不同方向压强近似相同；深度或液体密度增加，压强增大。"
    ],
    "conclusion": "液体内部压强与深度、密度有关，p=ρgh。",
    "examPoints": [
      "深度是距自由液面的竖直距离",
      "U形管是差压指示"
    ],
    "pitfalls": [
      "不可用斜向路径长度代替深度"
    ],
    "questions": [
      {
        "q": "水下0.5 m处液体压强约多少？",
        "a": "取ρ=1000 kg/m³、g=9.8 N/kg，压强4900 Pa。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "liquid",
      "variant": "liquid-pressure"
    },
    "modelNote": "固体使用p=F/S，静止液体使用p=ρgh；未包含容器材料形变，流动模型需另看具体说明。",
    "controls": [
      {
        "key": "density",
        "label": "液体密度",
        "unit": "kg/m³",
        "min": 500,
        "max": 2000,
        "step": 50,
        "value": 1000
      },
      {
        "key": "depth",
        "label": "深度",
        "unit": "m",
        "min": 0,
        "max": 1,
        "step": 0.01,
        "value": 0.3
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "ρ=1000 kg/m³，h=0.50 m，g=9.8 N/kg。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "ρ=1000 kg/m³，h=0.50 m，g=9.8 N/kg。"
        },
        {
          "title": "选用原理",
          "text": "p=ρgh。"
        },
        {
          "title": "代入计算",
          "text": "p=1000×9.8×0.50=4900 Pa。"
        },
        {
          "title": "作答",
          "text": "水产生的表压4900 Pa。"
        }
      ],
      "answer": "水产生的表压4900 Pa。"
    }
  },
  {
    "id": "phy-communicating-vessels",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.2",
    "title": "连通器静止液面的比较",
    "kind": "小实验",
    "tags": [
      "正文装置"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "比较开口相通容器中的同种静止液体。",
    "apparatus": [
      "形状不同的连通容器",
      "水",
      "透明软管"
    ],
    "steps": [
      "让同种液体在下部相通。",
      "两端均与大气相通，等待静止。",
      "改变容器倾斜或形状后再观察。"
    ],
    "observations": [
      "同种静止液体的各开口液面保持相平。"
    ],
    "conclusion": "连通器液面相平依赖同种液体、静止、上方气压相同等条件。",
    "examPoints": [
      "形状不同不影响静止液面高度关系"
    ],
    "pitfalls": [
      "不同气压或流动时不能直接套液面相平"
    ],
    "questions": [
      {
        "q": "软管水准仪如何标出相同高度？",
        "a": "两端开口的同种静止水面处于同一水平面，可作为高度基准。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "communicating",
      "variant": "communicating-vessels"
    },
    "modelNote": "同种液体、各支管液面受相同外压且静止时液面相平；输出深度处静压，未模拟瞬时灌注或毛细作用。",
    "controls": [
      {
        "key": "density",
        "label": "液体密度",
        "unit": "kg/m³",
        "min": 500,
        "max": 14000,
        "step": 100,
        "value": 1000
      },
      {
        "key": "depth",
        "label": "深度",
        "unit": "m",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 1
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "软管水准仪如何标出相同高度？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "比较开口相通容器中的同种静止液体。"
        },
        {
          "title": "引用观察",
          "text": "同种静止液体的各开口液面保持相平。"
        },
        {
          "title": "建立解释",
          "text": "连通器液面相平依赖同种液体、静止、上方气压相同等条件。"
        },
        {
          "title": "完整回答",
          "text": "两端开口的同种静止水面处于同一水平面，可作为高度基准。"
        }
      ],
      "answer": "两端开口的同种静止水面处于同一水平面，可作为高度基准。"
    }
  },
  {
    "id": "phy-suction-hole",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.3",
    "title": "吸盘打孔的对照",
    "kind": "小实验",
    "tags": [
      "正文实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "比较密封与连通空气后的吸附情况。",
    "apparatus": [
      "吸盘",
      "光滑表面",
      "带小孔吸盘模型"
    ],
    "steps": [
      "压紧密封吸盘。",
      "比较吸盘内外压强。",
      "打开小孔使空气进入后观察。"
    ],
    "observations": [
      "密封吸盘可附着，通气后附着明显减弱。"
    ],
    "conclusion": "外界大气压可产生把吸盘压向表面的合力。",
    "examPoints": [
      "大气压从各方向作用",
      "吸盘并不是主动吸引物体"
    ],
    "pitfalls": [
      "不能只说内部真空而忽略外部压强"
    ],
    "questions": [
      {
        "q": "打孔后吸盘为什么容易脱落？",
        "a": "空气进入使内外压强接近，维持附着的压差减小。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "atmosphere",
      "variant": "suction-hole"
    },
    "modelNote": "固体使用p=F/S，静止液体使用p=ρgh；未包含容器材料形变，流动模型需另看具体说明。",
    "controls": [
      {
        "key": "height",
        "label": "海拔高度",
        "unit": "m",
        "min": 0,
        "max": 5000,
        "step": 100,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "打孔后吸盘为什么容易脱落？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "比较密封与连通空气后的吸附情况。"
        },
        {
          "title": "引用观察",
          "text": "密封吸盘可附着，通气后附着明显减弱。"
        },
        {
          "title": "建立解释",
          "text": "外界大气压可产生把吸盘压向表面的合力。"
        },
        {
          "title": "完整回答",
          "text": "空气进入使内外压强接近，维持附着的压差减小。"
        }
      ],
      "answer": "空气进入使内外压强接近，维持附着的压差减小。"
    }
  },
  {
    "id": "phy-inverted-water",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.3",
    "title": "纸片托住倒置水柱",
    "kind": "小实验",
    "tags": [
      "正文实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "观察封闭塑料管口朝下时水的保持，并思考通气对照。",
    "apparatus": [
      "透明管模型",
      "水",
      "纸片",
      "通气孔"
    ],
    "steps": [
      "让管内充水并用纸片封住。",
      "倒置后观察纸片和水柱。",
      "打开上方通气孔作对照。"
    ],
    "observations": [
      "合适密封条件下纸片可托住水；通气可能破坏平衡。"
    ],
    "conclusion": "水和封闭气体的压强共同决定纸片受力，大气压是关键因素。",
    "examPoints": [
      "不能只比较水重与大气压而忽略内部气体压力"
    ],
    "pitfalls": [
      "表面张力、漏气等实际因素会影响效果"
    ],
    "questions": [
      {
        "q": "上端通气后纸片为何可能掉落？",
        "a": "内部压强条件改变，纸片下方大气压力不再足以平衡上方作用。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "atmosphere",
      "variant": "inverted-water"
    },
    "modelNote": "固体使用p=F/S，静止液体使用p=ρgh；未包含容器材料形变，流动模型需另看具体说明。",
    "controls": [
      {
        "key": "height",
        "label": "海拔高度",
        "unit": "m",
        "min": 0,
        "max": 5000,
        "step": 100,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "上端通气后纸片为何可能掉落？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "观察封闭塑料管口朝下时水的保持，并思考通气对照。"
        },
        {
          "title": "引用观察",
          "text": "合适密封条件下纸片可托住水；通气可能破坏平衡。"
        },
        {
          "title": "建立解释",
          "text": "水和封闭气体的压强共同决定纸片受力，大气压是关键因素。"
        },
        {
          "title": "完整回答",
          "text": "内部压强条件改变，纸片下方大气压力不再足以平衡上方作用。"
        }
      ],
      "answer": "内部压强条件改变，纸片下方大气压力不再足以平衡上方作用。"
    }
  },
  {
    "id": "phy-torricelli",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.3",
    "title": "托里拆利气压测量",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "比较竖直水银高度；改变玻璃管位置而保持管口浸没。",
    "apparatus": [
      "水银柱模型",
      "玻璃管模型",
      "水银槽模型"
    ],
    "steps": [
      "在模拟中使管内气体尽量排除。",
      "读取槽面到管内水银面的竖直高度差。",
      "改变管倾斜角并保持管口浸没。"
    ],
    "observations": [
      "相同大气压下，改变管倾角不改变竖直高度差。"
    ],
    "conclusion": "气压可由液柱静压平衡测量，p≈ρgh。",
    "examPoints": [
      "读竖直高度不是液柱长度",
      "管顶真空条件重要"
    ],
    "pitfalls": [
      "管顶进入空气会使水银柱高度降低"
    ],
    "questions": [
      {
        "q": "760 mm水银柱的760 mm是沿斜管长度吗？",
        "a": "不是，是管内外水银面的竖直高度差。"
      }
    ],
    "safety": [
      "汞有毒，禁止学生自行进行水银实验；只用仿真或合规替代装置。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "atmosphere",
      "variant": "torricelli"
    },
    "modelNote": "气压随海拔采用标准大气近似；汞柱高度由气压与汞密度换算。仅作虚拟演示，不提供学生自行接触水银的操作。",
    "controls": [
      {
        "key": "height",
        "label": "海拔高度",
        "unit": "m",
        "min": 0,
        "max": 5000,
        "step": 100,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "760 mm水银柱的760 mm是沿斜管长度吗？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "比较竖直水银高度；改变玻璃管位置而保持管口浸没。"
        },
        {
          "title": "引用观察",
          "text": "相同大气压下，改变管倾角不改变竖直高度差。"
        },
        {
          "title": "建立解释",
          "text": "气压可由液柱静压平衡测量，p≈ρgh。"
        },
        {
          "title": "完整回答",
          "text": "不是，是管内外水银面的竖直高度差。"
        }
      ],
      "answer": "不是，是管内外水银面的竖直高度差。"
    }
  },
  {
    "id": "phy-bottle-barometer",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.3",
    "title": "瓶和细管制作气压计",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "比较不同楼层的水柱高度；需控制温度和封闭气体状态。",
    "apparatus": [
      "密闭瓶",
      "细管",
      "水"
    ],
    "steps": [
      "在相近温度下记录初始液面。",
      "比较不同楼层的指示变化。",
      "讨论气压变化与温度干扰。"
    ],
    "observations": [
      "外界气压下降时，封闭气体与液柱的平衡会改变。"
    ],
    "conclusion": "液柱装置可指示相对气压变化，但结果也受温度影响。",
    "examPoints": [
      "控制封闭气体温度",
      "不是未经标定的精密气压计"
    ],
    "pitfalls": [
      "不能把所有液面变化都归因海拔"
    ],
    "questions": [
      {
        "q": "拿着瓶子很久后液面变化，能否只解释为气压变了？",
        "a": "不能，手温也可能使瓶内气体升温，改变液面。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "atmosphere",
      "variant": "bottle-barometer"
    },
    "modelNote": "固体使用p=F/S，静止液体使用p=ρgh；未包含容器材料形变，流动模型需另看具体说明。",
    "controls": [
      {
        "key": "height",
        "label": "海拔高度",
        "unit": "m",
        "min": 0,
        "max": 5000,
        "step": 100,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "拿着瓶子很久后液面变化，能否只解释为气压变了？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "比较不同楼层的水柱高度；需控制温度和封闭气体状态。"
        },
        {
          "title": "引用观察",
          "text": "外界气压下降时，封闭气体与液柱的平衡会改变。"
        },
        {
          "title": "建立解释",
          "text": "液柱装置可指示相对气压变化，但结果也受温度影响。"
        },
        {
          "title": "完整回答",
          "text": "不能，手温也可能使瓶内气体升温，改变液面。"
        }
      ],
      "answer": "不能，手温也可能使瓶内气体升温，改变液面。"
    }
  },
  {
    "id": "phy-dropper-pressure",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.3",
    "title": "滴管进水由外界压强推动",
    "kind": "小实验",
    "tags": [
      "练习与应用1"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "设计有无内外压差的对照，检验吸水解释。",
    "apparatus": [
      "滴管",
      "水",
      "橡胶头模型"
    ],
    "steps": [
      "在空气中先挤压胶头。",
      "把管口浸入水后松手。",
      "比较管口未浸水时的结果。"
    ],
    "observations": [
      "松开后胶头恢复，使管内压强降低，水被外界压强压入。"
    ],
    "conclusion": "液体进入滴管靠内外压强差推动。",
    "examPoints": [
      "应先挤压再浸入",
      "吸是现象描述不是额外的吸力"
    ],
    "pitfalls": [
      "不把水上升解释为胶头隔空直接拉水"
    ],
    "questions": [
      {
        "q": "水被吸入滴管时，主要由哪一侧压力推动？",
        "a": "外界大气压作用于水面，推动水进入较低压的滴管。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "atmosphere",
      "variant": "dropper-pressure"
    },
    "modelNote": "固体使用p=F/S，静止液体使用p=ρgh；未包含容器材料形变，流动模型需另看具体说明。",
    "controls": [
      {
        "key": "height",
        "label": "海拔高度",
        "unit": "m",
        "min": 0,
        "max": 5000,
        "step": 100,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "水被吸入滴管时，主要由哪一侧压力推动？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "设计有无内外压差的对照，检验吸水解释。"
        },
        {
          "title": "引用观察",
          "text": "松开后胶头恢复，使管内压强降低，水被外界压强压入。"
        },
        {
          "title": "建立解释",
          "text": "液体进入滴管靠内外压强差推动。"
        },
        {
          "title": "完整回答",
          "text": "外界大气压作用于水面，推动水进入较低压的滴管。"
        }
      ],
      "answer": "外界大气压作用于水面，推动水进入较低压的滴管。"
    }
  },
  {
    "id": "phy-magdeburg",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.3",
    "title": "马德堡半球压差演示",
    "kind": "小实验",
    "tags": [
      "历史实验及练习3"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "教材以压力锅模拟历史半球，只用于受力可视化。",
    "apparatus": [
      "半球剖面模型",
      "抽气装置",
      "拉力显示"
    ],
    "steps": [
      "先比较内外同压时的分离。",
      "降低半球内部气压。",
      "用外压减内压分析压紧作用。"
    ],
    "observations": [
      "内部气压降低后分开半球需要更大的力。"
    ],
    "conclusion": "大气压能产生显著的合力，合力取决于压差与有效投影面积。",
    "examPoints": [
      "F=ΔpS里的面积是投影面积"
    ],
    "pitfalls": [
      "不能把半球全部曲面面积直接代入"
    ],
    "questions": [
      {
        "q": "半球重新通入空气后为何容易分开？",
        "a": "内外压差减小，压紧它们的合力相应减小。"
      }
    ],
    "safety": [
      "仅模拟压差，不用家用压力锅或密闭硬容器自行抽真空。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "atmosphere",
      "variant": "magdeburg"
    },
    "modelNote": "固体使用p=F/S，静止液体使用p=ρgh；未包含容器材料形变，流动模型需另看具体说明。",
    "controls": [
      {
        "key": "height",
        "label": "海拔高度",
        "unit": "m",
        "min": 0,
        "max": 5000,
        "step": 100,
        "value": 0
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "半球重新通入空气后为何容易分开？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "教材以压力锅模拟历史半球，只用于受力可视化。"
        },
        {
          "title": "引用观察",
          "text": "内部气压降低后分开半球需要更大的力。"
        },
        {
          "title": "建立解释",
          "text": "大气压能产生显著的合力，合力取决于压差与有效投影面积。"
        },
        {
          "title": "完整回答",
          "text": "内外压差减小，压紧它们的合力相应减小。"
        }
      ],
      "answer": "内外压差减小，压紧它们的合力相应减小。"
    }
  },
  {
    "id": "phy-piston-pump",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.4",
    "title": "简易活塞式抽水机",
    "kind": "拓展探究",
    "tags": [
      "跨学科实践"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "设计筒体、活塞和单向阀，并解释提压交替抽水。",
    "apparatus": [
      "泵筒",
      "活塞",
      "两个单向阀",
      "水箱模型"
    ],
    "steps": [
      "分别观察活塞上提与下压。",
      "标出两只阀门的开闭和水流方向。",
      "连续操作并分析水被提升的原因。"
    ],
    "observations": [
      "单向阀使水在往复运动中总体向出口流动。"
    ],
    "conclusion": "活塞改变压强，单向阀控制流向，大气压有助于低处水进入泵筒。",
    "examPoints": [
      "两阀开闭需与压差对应",
      "吸水高度受气压限制"
    ],
    "pitfalls": [
      "泵不是靠无上限吸力把水拉上任意高度"
    ],
    "questions": [
      {
        "q": "没有单向阀，往复活塞为什么难持续提水？",
        "a": "水会随活塞来回流动，难形成稳定的单向输送。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "pump",
      "variant": "piston-pump"
    },
    "modelNote": "通过阀门和活塞位置解释大气压帮助提升水；理想提升高度受气压限制，实际泵受密封、摩擦和水蒸气压影响。",
    "controls": [
      {
        "key": "stroke",
        "label": "活塞动作",
        "options": [
          {
            "value": "pull",
            "label": "上提"
          },
          {
            "value": "push",
            "label": "下压"
          }
        ],
        "value": "pull"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "没有单向阀，往复活塞为什么难持续提水？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "设计筒体、活塞和单向阀，并解释提压交替抽水。"
        },
        {
          "title": "引用观察",
          "text": "单向阀使水在往复运动中总体向出口流动。"
        },
        {
          "title": "建立解释",
          "text": "活塞改变压强，单向阀控制流向，大气压有助于低处水进入泵筒。"
        },
        {
          "title": "完整回答",
          "text": "水会随活塞来回流动，难形成稳定的单向输送。"
        }
      ],
      "answer": "水会随活塞来回流动，难形成稳定的单向输送。"
    }
  },
  {
    "id": "phy-blow-strip",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.5",
    "title": "向纸条上方吹气",
    "kind": "小实验",
    "tags": [
      "问题中的操作"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "比较有无气流时纸条形态。",
    "apparatus": [
      "纸条",
      "两张纸",
      "气流模型"
    ],
    "steps": [
      "向纸条上方送出稳定气流。",
      "再比较两张纸间吹气与不吹气。",
      "标出不同区域流速与压力趋势。"
    ],
    "observations": [
      "适当气流下纸条抬起，两张纸可相互靠近。"
    ],
    "conclusion": "在适用的简化流动条件下，流速较大的区域静压较小。",
    "examPoints": [
      "伯努利关系有条件，气流冲击也可能影响现象"
    ],
    "pitfalls": [
      "不要认为空气流动总把两纸吹开"
    ],
    "questions": [
      {
        "q": "两纸之间吹气为何常使两纸靠近？",
        "a": "中间流速增大并形成较低静压，外侧压力推动纸片相向。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "flow",
      "variant": "blow-strip"
    },
    "modelNote": "用理想流体伯努利关系比较流速和静压；空气密度取近似值。忽略黏性和湍流，喷雾、托球等现象还受实际流场和阻力影响，不能仅用一个静压公式预测完整轨迹。",
    "controls": [
      {
        "key": "speed",
        "label": "流速",
        "unit": "m/s",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "density",
        "label": "流体密度",
        "unit": "kg/m³",
        "min": 1,
        "max": 1000,
        "step": 0.1,
        "value": 1.2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "两纸之间吹气为何常使两纸靠近？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "比较有无气流时纸条形态。"
        },
        {
          "title": "引用观察",
          "text": "适当气流下纸条抬起，两张纸可相互靠近。"
        },
        {
          "title": "建立解释",
          "text": "在适用的简化流动条件下，流速较大的区域静压较小。"
        },
        {
          "title": "完整回答",
          "text": "中间流速增大并形成较低静压，外侧压力推动纸片相向。"
        }
      ],
      "answer": "中间流速增大并形成较低静压，外侧压力推动纸片相向。"
    }
  },
  {
    "id": "phy-flow-pressure-sensors",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.5",
    "title": "变截面管气压传感器实验",
    "kind": "拓展探究",
    "tags": [
      "拓展实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "抽气时测量不同截面的静压并比较流速。",
    "apparatus": [
      "变截面管",
      "压力传感器",
      "气流源"
    ],
    "steps": [
      "连接不同截面的静压测点。",
      "使气流稳定通过。",
      "比较宽窄处流速与压力示数。"
    ],
    "observations": [
      "在简化稳定流动中，较窄处流速较大、静压较低。"
    ],
    "conclusion": "连续流与压强差共同决定管内流动，传感器可直接比较静压。",
    "examPoints": [
      "传感器探头位置影响所测静压或动压"
    ],
    "pitfalls": [
      "不能忽略高度差与黏性损耗而做任意精确预测"
    ],
    "questions": [
      {
        "q": "为什么比较时应等待气流稳定？",
        "a": "避免瞬态波动混入，才能研究固定流动条件下截面对压强的影响。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "flow",
      "variant": "flow-pressure-sensors"
    },
    "modelNote": "用理想流体伯努利关系比较流速和静压；空气密度取近似值。忽略黏性和湍流，喷雾、托球等现象还受实际流场和阻力影响，不能仅用一个静压公式预测完整轨迹。",
    "controls": [
      {
        "key": "speed",
        "label": "流速",
        "unit": "m/s",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "density",
        "label": "流体密度",
        "unit": "kg/m³",
        "min": 1,
        "max": 1000,
        "step": 0.1,
        "value": 1.2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么比较时应等待气流稳定？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "抽气时测量不同截面的静压并比较流速。"
        },
        {
          "title": "引用观察",
          "text": "在简化稳定流动中，较窄处流速较大、静压较低。"
        },
        {
          "title": "建立解释",
          "text": "连续流与压强差共同决定管内流动，传感器可直接比较静压。"
        },
        {
          "title": "完整回答",
          "text": "避免瞬态波动混入，才能研究固定流动条件下截面对压强的影响。"
        }
      ],
      "answer": "避免瞬态波动混入，才能研究固定流动条件下截面对压强的影响。"
    }
  },
  {
    "id": "phy-straw-spray",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "section": "9.5",
    "title": "两根吸管形成简易喷雾",
    "kind": "小实验",
    "tags": [
      "练习与应用4"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "横向气流使竖直吸管内液面上升。",
    "apparatus": [
      "竖直吸管",
      "水平气流管",
      "水杯"
    ],
    "steps": [
      "让竖直吸管下端浸水。",
      "使气流掠过上端。",
      "观察管内水面和雾化趋势。"
    ],
    "observations": [
      "管口附近压强降低时，外界大气压可推动水沿管上升。"
    ],
    "conclusion": "喷雾器利用流动形成压强差，再由气流带走液体。",
    "examPoints": [
      "压强差与液柱重力相平衡"
    ],
    "pitfalls": [
      "不把水上升解释为气流向上直接勾住水"
    ],
    "questions": [
      {
        "q": "水沿竖管上升的能量和作用来自哪里？",
        "a": "气流建立压差，外界压力推动水上升；吹气装置提供能量。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "flow",
      "variant": "straw-spray"
    },
    "modelNote": "用理想流体伯努利关系比较流速和静压；空气密度取近似值。忽略黏性和湍流，喷雾、托球等现象还受实际流场和阻力影响，不能仅用一个静压公式预测完整轨迹。",
    "controls": [
      {
        "key": "speed",
        "label": "流速",
        "unit": "m/s",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "density",
        "label": "流体密度",
        "unit": "kg/m³",
        "min": 1,
        "max": 1000,
        "step": 0.1,
        "value": 1.2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "水沿竖管上升的能量和作用来自哪里？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "横向气流使竖直吸管内液面上升。"
        },
        {
          "title": "引用观察",
          "text": "管口附近压强降低时，外界大气压可推动水沿管上升。"
        },
        {
          "title": "建立解释",
          "text": "喷雾器利用流动形成压强差，再由气流带走液体。"
        },
        {
          "title": "完整回答",
          "text": "气流建立压差，外界压力推动水上升；吹气装置提供能量。"
        }
      ],
      "answer": "气流建立压差，外界压力推动水上升；吹气装置提供能量。"
    }
  },
  {
    "id": "phy-buoyancy-weighing",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十章 浮力",
    "section": "10.1",
    "title": "称重法测浮力与浸没深度",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "铝块在空气和水中读数对照，浸没后改变深度。",
    "apparatus": [
      "弹簧测力计",
      "不吸水物体",
      "水槽"
    ],
    "steps": [
      "测物体在空气中的重力。",
      "使其部分到完全浸入液体，记录拉力。",
      "完全浸没后改变深度比较。"
    ],
    "observations": [
      "浸入时示数减小；完全浸没后同种液体中示数通常不随深度继续改变。"
    ],
    "conclusion": "浮力可由F浮=G−F拉求得，大小取决于排开液体的情况。",
    "examPoints": [
      "需静止且物体不触底不碰壁",
      "完全浸没后排液体积不变"
    ],
    "pitfalls": [
      "不能说越深浮力总越大"
    ],
    "questions": [
      {
        "q": "空气中4 N、水中3 N，浮力是多少？",
        "a": "浮力1 N。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "buoyancy",
    "modelParams": {
      "scenario": "submerged",
      "variant": "buoyancy-weighing"
    },
    "modelNote": "使用阿基米德原理，液体密度均匀、物体不吸水；浸没比例决定排液体积，漂浮平衡时需满足浮力等于重力。",
    "controls": [
      {
        "key": "mass",
        "label": "物体质量",
        "unit": "g",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 200
      },
      {
        "key": "volume",
        "label": "物体体积",
        "unit": "cm³",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 100
      },
      {
        "key": "density",
        "label": "液体密度",
        "unit": "kg/m³",
        "min": 500,
        "max": 1500,
        "step": 50,
        "value": 1000
      },
      {
        "key": "fraction",
        "label": "浸入比例",
        "unit": "",
        "min": 0,
        "max": 1,
        "step": 0.05,
        "value": 1
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "G=4 N，液体中拉力F拉=3 N。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "G=4 N，液体中拉力F拉=3 N。"
        },
        {
          "title": "选用原理",
          "text": "静止受力平衡：F浮=G−F拉。"
        },
        {
          "title": "代入计算",
          "text": "F浮=4−3=1 N。"
        },
        {
          "title": "作答",
          "text": "浮力1 N，方向竖直向上。"
        }
      ],
      "answer": "浮力1 N，方向竖直向上。"
    }
  },
  {
    "id": "phy-buoyancy-factors",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十章 浮力",
    "section": "10.1",
    "title": "浮力大小的影响因素",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "控制变量比较浸入体积及液体密度。",
    "apparatus": [
      "物体",
      "测力计",
      "水与盐水",
      "水槽"
    ],
    "steps": [
      "固定液体密度，改变浸入体积。",
      "固定浸入体积，改变液体密度。",
      "比较各次称重法求出的浮力。"
    ],
    "observations": [
      "排液体积越大或液体密度越大，浮力越大。"
    ],
    "conclusion": "F浮=ρ液gV排。",
    "examPoints": [
      "V排不一定等于物体总体积"
    ],
    "pitfalls": [
      "物体密度不能直接代替公式中的液体密度"
    ],
    "questions": [
      {
        "q": "把空瓶进一步压入水中，为何通常更费力？",
        "a": "排开水的体积增大，浮力增大，需要更大的向下作用维持。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "buoyancy",
    "modelParams": {
      "scenario": "archimedes",
      "variant": "buoyancy-factors"
    },
    "modelNote": "使用阿基米德原理，液体密度均匀、物体不吸水；浸没比例决定排液体积，漂浮平衡时需满足浮力等于重力。",
    "controls": [
      {
        "key": "mass",
        "label": "物体质量",
        "unit": "g",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 80
      },
      {
        "key": "volume",
        "label": "物体体积",
        "unit": "cm³",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 100
      },
      {
        "key": "density",
        "label": "液体密度",
        "unit": "kg/m³",
        "min": 500,
        "max": 1500,
        "step": 50,
        "value": 1000
      },
      {
        "key": "fraction",
        "label": "浸入比例",
        "unit": "",
        "min": 0,
        "max": 1,
        "step": 0.05,
        "value": 1
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "把空瓶进一步压入水中，为何通常更费力？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "控制变量比较浸入体积及液体密度。"
        },
        {
          "title": "引用观察",
          "text": "排液体积越大或液体密度越大，浮力越大。"
        },
        {
          "title": "建立解释",
          "text": "F浮=ρ液gV排。"
        },
        {
          "title": "完整回答",
          "text": "排开水的体积增大，浮力增大，需要更大的向下作用维持。"
        }
      ],
      "answer": "排开水的体积增大，浮力增大，需要更大的向下作用维持。"
    }
  },
  {
    "id": "phy-archimedes",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十章 浮力",
    "section": "10.2",
    "title": "浮力与排开液体重力的关系",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "组合称重法和溢水杯，分别测浮力与排水重力。",
    "apparatus": [
      "溢水杯",
      "小桶",
      "物体",
      "弹簧测力计"
    ],
    "steps": [
      "用称重法测出物体浮力。",
      "收集完全浸入过程排出的液体。",
      "测排液重力并与浮力比较。"
    ],
    "observations": [
      "物体所受浮力与排开液体重力在误差范围内接近。"
    ],
    "conclusion": "阿基米德原理：浮力等于排开液体所受重力。",
    "examPoints": [
      "溢水杯初始液面应达溢水口",
      "排液要完整收集"
    ],
    "pitfalls": [
      "漏收排液会使所测排液重力偏小"
    ],
    "questions": [
      {
        "q": "排开水100 cm³，浮力多大？",
        "a": "取g=9.8 N/kg，浮力0.98 N。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "buoyancy",
    "modelParams": {
      "scenario": "archimedes",
      "variant": "archimedes"
    },
    "modelNote": "使用阿基米德原理，液体密度均匀、物体不吸水；浸没比例决定排液体积，漂浮平衡时需满足浮力等于重力。",
    "controls": [
      {
        "key": "mass",
        "label": "物体质量",
        "unit": "g",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 80
      },
      {
        "key": "volume",
        "label": "物体体积",
        "unit": "cm³",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 100
      },
      {
        "key": "density",
        "label": "液体密度",
        "unit": "kg/m³",
        "min": 500,
        "max": 1500,
        "step": 50,
        "value": 1000
      },
      {
        "key": "fraction",
        "label": "浸入比例",
        "unit": "",
        "min": 0,
        "max": 1,
        "step": 0.05,
        "value": 1
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "V排=100 cm³=1.0×10⁻⁴ m³，ρ水=1000 kg/m³。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "V排=100 cm³=1.0×10⁻⁴ m³，ρ水=1000 kg/m³。"
        },
        {
          "title": "选用原理",
          "text": "F浮=ρ液gV排。"
        },
        {
          "title": "代入计算",
          "text": "F浮=1000×9.8×10⁻⁴=0.98 N。"
        },
        {
          "title": "作答",
          "text": "浮力0.98 N。"
        }
      ],
      "answer": "浮力0.98 N。"
    }
  },
  {
    "id": "phy-egg-saltwater",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十章 浮力",
    "section": "10.3",
    "title": "鸡蛋在水和盐水中的浮沉",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "同一个鸡蛋换到密度不同的液体中。",
    "apparatus": [
      "鸡蛋模型",
      "清水",
      "盐水"
    ],
    "steps": [
      "把同一鸡蛋先置于清水。",
      "逐渐提高液体密度。",
      "比较下沉、悬浮和漂浮条件。"
    ],
    "observations": [
      "液体密度增大可使鸡蛋由下沉转为上浮并漂浮。"
    ],
    "conclusion": "浮沉由浮力和重力的大小关系决定，稳定漂浮时二者相等。",
    "examPoints": [
      "漂浮不表示浮力大于重力",
      "上浮过程和最终漂浮要区分"
    ],
    "pitfalls": [
      "不能把鸡蛋自身密度随加盐变化当作主要原因"
    ],
    "questions": [
      {
        "q": "鸡蛋稳定漂浮后浮力还大于重力吗？",
        "a": "不是，稳定漂浮时浮力等于重力。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "buoyancy",
    "modelParams": {
      "scenario": "floating",
      "variant": "egg-saltwater"
    },
    "modelNote": "使用阿基米德原理，液体密度均匀、物体不吸水；浸没比例决定排液体积，漂浮平衡时需满足浮力等于重力。",
    "controls": [
      {
        "key": "mass",
        "label": "物体质量",
        "unit": "g",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 80
      },
      {
        "key": "volume",
        "label": "物体体积",
        "unit": "cm³",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 100
      },
      {
        "key": "density",
        "label": "液体密度",
        "unit": "kg/m³",
        "min": 500,
        "max": 1500,
        "step": 50,
        "value": 1000
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "鸡蛋稳定漂浮后浮力还大于重力吗？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "同一个鸡蛋换到密度不同的液体中。"
        },
        {
          "title": "引用观察",
          "text": "液体密度增大可使鸡蛋由下沉转为上浮并漂浮。"
        },
        {
          "title": "建立解释",
          "text": "浮沉由浮力和重力的大小关系决定，稳定漂浮时二者相等。"
        },
        {
          "title": "完整回答",
          "text": "不是，稳定漂浮时浮力等于重力。"
        }
      ],
      "answer": "不是，稳定漂浮时浮力等于重力。"
    }
  },
  {
    "id": "phy-clay-boat",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十章 浮力",
    "section": "10.3",
    "title": "橡皮泥船与承载能力",
    "kind": "小实验",
    "tags": [
      "想想做做"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "同块橡皮泥改变排水外形并测试载荷。",
    "apparatus": [
      "橡皮泥",
      "水槽",
      "小载荷"
    ],
    "steps": [
      "把同一块橡皮泥做成实心团和船形。",
      "分别放水中观察。",
      "给船逐渐加载并记录浸入变化。"
    ],
    "observations": [
      "船形可在不进水时排开更多水，从而承载更大总重力。"
    ],
    "conclusion": "改变空心外形可以增大可排液体积，不改变材料本身密度。",
    "examPoints": [
      "船增加载荷后吃水加深",
      "进水会改变总质量和排水条件"
    ],
    "pitfalls": [
      "不能说船浮起是材料密度变小"
    ],
    "questions": [
      {
        "q": "同一块橡皮泥做船后能漂浮，主要改变了什么？",
        "a": "改变了整体外形和可排开水的体积，使浮力可平衡总重力。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "buoyancy",
    "modelParams": {
      "scenario": "floating",
      "variant": "clay-boat"
    },
    "modelNote": "使用阿基米德原理，液体密度均匀、物体不吸水；浸没比例决定排液体积，漂浮平衡时需满足浮力等于重力。",
    "controls": [
      {
        "key": "mass",
        "label": "物体质量",
        "unit": "g",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 80
      },
      {
        "key": "volume",
        "label": "物体体积",
        "unit": "cm³",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 100
      },
      {
        "key": "density",
        "label": "液体密度",
        "unit": "kg/m³",
        "min": 500,
        "max": 1500,
        "step": 50,
        "value": 1000
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "同一块橡皮泥做船后能漂浮，主要改变了什么？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "同块橡皮泥改变排水外形并测试载荷。"
        },
        {
          "title": "引用观察",
          "text": "船形可在不进水时排开更多水，从而承载更大总重力。"
        },
        {
          "title": "建立解释",
          "text": "改变空心外形可以增大可排液体积，不改变材料本身密度。"
        },
        {
          "title": "完整回答",
          "text": "改变了整体外形和可排开水的体积，使浮力可平衡总重力。"
        }
      ],
      "answer": "改变了整体外形和可排开水的体积，使浮力可平衡总重力。"
    }
  },
  {
    "id": "phy-micro-hydrometer",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十章 浮力",
    "section": "10.4",
    "title": "微型密度计的设计与标定",
    "kind": "拓展探究",
    "tags": [
      "跨学科实践"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "考虑总质量、浮子、细杆直径、配重与标定；只评估密度。",
    "apparatus": [
      "细杆",
      "浮子",
      "配重",
      "标准液体"
    ],
    "steps": [
      "配重使装置竖直漂浮。",
      "在已知密度液体中标记位置。",
      "放入不同液体比较浸入程度并讨论刻度疏密。"
    ],
    "observations": [
      "同一密度计在密度更大的液体中浸入体积更小。"
    ],
    "conclusion": "漂浮时ρ液gV排=G，质量固定时液体密度越大，V排越小。",
    "examPoints": [
      "刻度通常不均匀",
      "深浅不能反向解释"
    ],
    "pitfalls": [
      "不可把密度计沉得深说成液体密度大"
    ],
    "questions": [
      {
        "q": "密度计在盐水中浮得更高说明什么？",
        "a": "盐水密度更大，只需较小排液体积就能平衡其重力。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "buoyancy",
    "modelParams": {
      "scenario": "densitymeter",
      "variant": "micro-hydrometer"
    },
    "modelNote": "理想密度计漂浮，重力保持不变，液体密度改变时排液体积改变；未模拟真实细管刻度和表面张力。",
    "controls": [
      {
        "key": "mass",
        "label": "物体质量",
        "unit": "g",
        "min": 5,
        "max": 50,
        "step": 1,
        "value": 20
      },
      {
        "key": "volume",
        "label": "物体体积",
        "unit": "cm³",
        "min": 50,
        "max": 200,
        "step": 10,
        "value": 100
      },
      {
        "key": "density",
        "label": "液体密度",
        "unit": "kg/m³",
        "min": 500,
        "max": 1500,
        "step": 50,
        "value": 1000
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "密度计在盐水中浮得更高说明什么？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "考虑总质量、浮子、细杆直径、配重与标定；只评估密度。"
        },
        {
          "title": "引用观察",
          "text": "同一密度计在密度更大的液体中浸入体积更小。"
        },
        {
          "title": "建立解释",
          "text": "漂浮时ρ液gV排=G，质量固定时液体密度越大，V排越小。"
        },
        {
          "title": "完整回答",
          "text": "盐水密度更大，只需较小排液体积就能平衡其重力。"
        }
      ],
      "answer": "盐水密度更大，只需较小排液体积就能平衡其重力。"
    }
  },
  {
    "id": "phy-submarine-model",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十章 浮力",
    "section": "10.review",
    "title": "烧瓶潜水艇模型",
    "kind": "小实验",
    "tags": [
      "复习与提高7"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "改变模型内水量，比较总重力与浮力。",
    "apparatus": [
      "封闭潜艇外壳模型",
      "水舱",
      "气泵模型"
    ],
    "steps": [
      "保持外部体积基本不变。",
      "向水舱进水改变总质量。",
      "排水后比较浮沉状态。"
    ],
    "observations": [
      "进水增加重力可使模型下沉；排水减小重力可使模型上浮。"
    ],
    "conclusion": "潜水艇通过改变自身总重力调节浮沉，完全浸没时排水体积可近似不变。",
    "examPoints": [
      "与改变外部体积的浮沉子模型区分"
    ],
    "pitfalls": [
      "不能把所有潜艇下潜都说成浮力减小"
    ],
    "questions": [
      {
        "q": "外形体积不变且完全浸没，进水后为何会下沉？",
        "a": "浮力近似不变，而总重力增加，可能大于浮力。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "buoyancy",
    "modelParams": {
      "scenario": "submarine",
      "variant": "submarine-model"
    },
    "modelNote": "使用阿基米德原理，液体密度均匀、物体不吸水；浸没比例决定排液体积，漂浮平衡时需满足浮力等于重力。",
    "controls": [
      {
        "key": "mass",
        "label": "物体质量",
        "unit": "g",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 80
      },
      {
        "key": "volume",
        "label": "物体体积",
        "unit": "cm³",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 100
      },
      {
        "key": "density",
        "label": "液体密度",
        "unit": "kg/m³",
        "min": 500,
        "max": 1500,
        "step": 50,
        "value": 1000
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "外形体积不变且完全浸没，进水后为何会下沉？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "改变模型内水量，比较总重力与浮力。"
        },
        {
          "title": "引用观察",
          "text": "进水增加重力可使模型下沉；排水减小重力可使模型上浮。"
        },
        {
          "title": "建立解释",
          "text": "潜水艇通过改变自身总重力调节浮沉，完全浸没时排水体积可近似不变。"
        },
        {
          "title": "完整回答",
          "text": "浮力近似不变，而总重力增加，可能大于浮力。"
        }
      ],
      "answer": "浮力近似不变，而总重力增加，可能大于浮力。"
    }
  },
  {
    "id": "phy-kinetic-energy",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十一章 功和机械能",
    "section": "11.3",
    "title": "钢球推动木块比较动能",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "分别控制质量或释放高度，用木块移动作能量比较指标。",
    "apparatus": [
      "钢球",
      "斜面",
      "木块",
      "平板"
    ],
    "steps": [
      "固定钢球质量改变释放高度。",
      "固定到达底端速度条件，改变质量。",
      "以木块在相同表面移动距离比较作用效果。"
    ],
    "observations": [
      "较大的速度或质量通常对应更大的动能。"
    ],
    "conclusion": "动能与质量和速度有关；可用克服阻力的作用效果间接比较。",
    "examPoints": [
      "木块表面条件需相同",
      "本阶段可定性，平方关系属模型补充"
    ],
    "pitfalls": [
      "不能同时改质量和释放高度后单独归因"
    ],
    "questions": [
      {
        "q": "为什么比较时要用同一个木块和相同水平面？",
        "a": "让木块受阻力条件尽量相同，移动距离才具有可比性。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "energy",
    "modelParams": {
      "scenario": "kinetic",
      "variant": "kinetic-energy"
    },
    "modelNote": "数值用理想能量公式计算；动能表达式属于定量拓展，初中实验重点是控制变量后比较做功能力。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "velocity",
        "label": "速度",
        "unit": "m/s",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么比较时要用同一个木块和相同水平面？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "分别控制质量或释放高度，用木块移动作能量比较指标。"
        },
        {
          "title": "引用观察",
          "text": "较大的速度或质量通常对应更大的动能。"
        },
        {
          "title": "建立解释",
          "text": "动能与质量和速度有关；可用克服阻力的作用效果间接比较。"
        },
        {
          "title": "完整回答",
          "text": "让木块受阻力条件尽量相同，移动距离才具有可比性。"
        }
      ],
      "answer": "让木块受阻力条件尽量相同，移动距离才具有可比性。"
    }
  },
  {
    "id": "phy-pendulum-lock",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十一章 功和机械能",
    "section": "11.4",
    "title": "摆回的重物能否超过释放高度",
    "kind": "小实验",
    "tags": [
      "问题中的演示"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "无初推释放并观察回摆最高位置；使用安全替身展示。",
    "apparatus": [
      "摆线",
      "安全轻球模型",
      "高度标尺"
    ],
    "steps": [
      "从固定高度无初推释放。",
      "观察最低点与回摆最高点。",
      "比较有阻力和理想无阻力条件。"
    ],
    "observations": [
      "无额外输入时回摆通常不超过初始高度。"
    ],
    "conclusion": "机械能在动能和重力势能之间转化；阻力使机械能减少。",
    "examPoints": [
      "必须无初推",
      "若额外做功可以超过原高度"
    ],
    "pitfalls": [
      "不能把重球靠脸演示当学生操作"
    ],
    "questions": [
      {
        "q": "若释放时向前推了一下，还能保证不超过原高度吗？",
        "a": "不能，推力输入额外能量，可能达到更高位置。"
      }
    ],
    "safety": [
      "使用远离人体的轻质替身或模拟；禁止重物贴近面部释放。"
    ],
    "model": "energy",
    "modelParams": {
      "scenario": "conservation",
      "variant": "pendulum-lock"
    },
    "modelNote": "用机械能总量说明无额外推力时不能回到高于释放点的位置；当前高度与速度可独立设定，是能量状态比较，不自动构造真实摆动全过程。真实装置有耗散。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "height",
        "label": "高度",
        "unit": "m",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "velocity",
        "label": "速度",
        "unit": "m/s",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "若释放时向前推了一下，还能保证不超过原高度吗？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "无初推释放并观察回摆最高位置；使用安全替身展示。"
        },
        {
          "title": "引用观察",
          "text": "无额外输入时回摆通常不超过初始高度。"
        },
        {
          "title": "建立解释",
          "text": "机械能在动能和重力势能之间转化；阻力使机械能减少。"
        },
        {
          "title": "完整回答",
          "text": "不能，推力输入额外能量，可能达到更高位置。"
        }
      ],
      "answer": "不能，推力输入额外能量，可能达到更高位置。"
    }
  },
  {
    "id": "phy-rolling-pendulum",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十一章 功和机械能",
    "section": "11.4",
    "title": "滚摆的动能与势能转换",
    "kind": "小实验",
    "tags": [
      "想想做做1"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "观察滚摆下降、上升过程。",
    "apparatus": [
      "滚摆模型",
      "细线",
      "支架"
    ],
    "steps": [
      "从高处静止释放滚摆。",
      "比较下降和上升阶段。",
      "观察多次运动最高点变化。"
    ],
    "observations": [
      "下降时重力势能减小、动能增加；上升时相反。"
    ],
    "conclusion": "机械能可以相互转化，实际阻力使总机械能逐渐减少。",
    "examPoints": [
      "滚摆具有平动和转动动能",
      "简化模型要说明是否计入转动"
    ],
    "pitfalls": [
      "不能把最低点动能全部算成平动动能而忽略转动"
    ],
    "questions": [
      {
        "q": "滚摆越滚越低是否违背能量守恒？",
        "a": "不违背，一部分机械能转化为内能等其他形式。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "energy",
    "modelParams": {
      "scenario": "conversion",
      "variant": "rolling-pendulum"
    },
    "modelNote": "展示动能与重力势能间转化；当前简化数值只计质心平动能，不含轮轴转动惯量，因此不能直接作为麦克斯韦滚摆的精确周期或速度。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "height",
        "label": "高度",
        "unit": "m",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "velocity",
        "label": "速度",
        "unit": "m/s",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "滚摆越滚越低是否违背能量守恒？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "观察滚摆下降、上升过程。"
        },
        {
          "title": "引用观察",
          "text": "下降时重力势能减小、动能增加；上升时相反。"
        },
        {
          "title": "建立解释",
          "text": "机械能可以相互转化，实际阻力使总机械能逐渐减少。"
        },
        {
          "title": "完整回答",
          "text": "不违背，一部分机械能转化为内能等其他形式。"
        }
      ],
      "answer": "不违背，一部分机械能转化为内能等其他形式。"
    }
  },
  {
    "id": "phy-returning-can",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十一章 功和机械能",
    "section": "11.4",
    "title": "橡皮筋回滚罐",
    "kind": "小实验",
    "tags": [
      "练习与应用4"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "观察滚动时橡皮筋储能与反向回滚。",
    "apparatus": [
      "罐体模型",
      "橡皮筋",
      "悬挂配重"
    ],
    "steps": [
      "让罐子向前滚动。",
      "观察橡皮筋扭转。",
      "松手后观察减速、停止和回滚。"
    ],
    "observations": [
      "罐向前滚时橡皮筋储能，随后可释放能量使罐回滚。"
    ],
    "conclusion": "动能与弹性势能可相互转化，摩擦和形变损耗使运动衰减。",
    "examPoints": [
      "回滚能量来自先前推动做功"
    ],
    "pitfalls": [
      "不要把装置称为永动机"
    ],
    "questions": [
      {
        "q": "罐子为什么能自己滚回来？",
        "a": "先前运动使橡皮筋储存弹性势能，释放后驱动罐体反向运动。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "energy",
    "modelParams": {
      "scenario": "elastic",
      "variant": "returning-can"
    },
    "modelNote": "数值用理想能量公式计算；动能表达式属于定量拓展，初中实验重点是控制变量后比较做功能力。",
    "controls": [
      {
        "key": "stiffness",
        "label": "劲度系数",
        "unit": "N/m",
        "min": 10,
        "max": 500,
        "step": 10,
        "value": 100
      },
      {
        "key": "extension",
        "label": "弹性形变",
        "unit": "m",
        "min": 0,
        "max": 0.2,
        "step": 0.01,
        "value": 0.1
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "罐子为什么能自己滚回来？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "观察滚动时橡皮筋储能与反向回滚。"
        },
        {
          "title": "引用观察",
          "text": "罐向前滚时橡皮筋储能，随后可释放能量使罐回滚。"
        },
        {
          "title": "建立解释",
          "text": "动能与弹性势能可相互转化，摩擦和形变损耗使运动衰减。"
        },
        {
          "title": "完整回答",
          "text": "先前运动使橡皮筋储存弹性势能，释放后驱动罐体反向运动。"
        }
      ],
      "answer": "先前运动使橡皮筋储存弹性势能，释放后驱动罐体反向运动。"
    }
  },
  {
    "id": "phy-potential-height",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十一章 功和机械能",
    "section": "11.review",
    "title": "钢珠压痕比较重力势能",
    "kind": "小实验",
    "tags": [
      "复习与提高8"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "同一钢珠从不同高度落到橡皮泥上，比较痕迹。",
    "apparatus": [
      "相同钢珠",
      "橡皮泥",
      "高度标尺"
    ],
    "steps": [
      "让同一钢珠从不同高度静止下落。",
      "保持橡皮泥材料和厚度相近。",
      "比较压痕深浅。"
    ],
    "observations": [
      "较高处释放的钢珠通常造成更明显的压痕。"
    ],
    "conclusion": "物体重力势能与质量和高度有关，可用作用效果作间接比较。",
    "examPoints": [
      "高度参考面需一致",
      "橡皮泥条件需一致"
    ],
    "pitfalls": [
      "不能把每次压痕值直接当焦耳数"
    ],
    "questions": [
      {
        "q": "2 kg物体升高1.5 m，重力势能增加多少？",
        "a": "取g=9.8 N/kg，增加29.4 J。"
      }
    ],
    "safety": [
      "钢珠落点设置接收盒，不对人释放重物。"
    ],
    "model": "energy",
    "modelParams": {
      "scenario": "potential",
      "variant": "potential-height"
    },
    "modelNote": "数值用理想能量公式计算；动能表达式属于定量拓展，初中实验重点是控制变量后比较做功能力。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "height",
        "label": "高度",
        "unit": "m",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "m=2 kg，Δh=1.5 m，g=9.8 N/kg。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "m=2 kg，Δh=1.5 m，g=9.8 N/kg。"
        },
        {
          "title": "选用原理",
          "text": "ΔEp=mgΔh。"
        },
        {
          "title": "代入计算",
          "text": "ΔEp=2×9.8×1.5=29.4 J。"
        },
        {
          "title": "作答",
          "text": "重力势能增加29.4 J。"
        }
      ],
      "answer": "重力势能增加29.4 J。"
    }
  },
  {
    "id": "phy-lever-balance",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十二章 简单机械",
    "section": "12.1",
    "title": "杠杆平衡条件",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "水平调零，改变力和力臂，记录成组数据。",
    "apparatus": [
      "杠杆",
      "支架",
      "钩码",
      "刻度尺"
    ],
    "steps": [
      "先调节杠杆无载时水平平衡。",
      "改变两侧钩码和位置使其平衡。",
      "测力臂并比较两侧力与力臂乘积。"
    ],
    "observations": [
      "平衡时两侧转动效果相抵。"
    ],
    "conclusion": "杠杆平衡条件F₁l₁=F₂l₂。",
    "examPoints": [
      "水平放置便于读取竖直力的力臂",
      "力臂是垂距"
    ],
    "pitfalls": [
      "不能把力臂普遍等同于沿杆距离"
    ],
    "questions": [
      {
        "q": "阻力6 N、阻力臂10 cm，动力臂30 cm，需多大动力？",
        "a": "动力2 N。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "lever",
    "modelParams": {
      "scenario": "balance",
      "variant": "lever-balance"
    },
    "modelNote": "采用轻质刚性杠杆，忽略支点摩擦；输入的力臂是到力作用线的垂距。",
    "controls": [
      {
        "key": "force",
        "label": "动力",
        "unit": "N",
        "min": 1,
        "max": 50,
        "step": 0.5,
        "value": 10
      },
      {
        "key": "arm",
        "label": "动力臂",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 30
      },
      {
        "key": "load",
        "label": "阻力",
        "unit": "N",
        "min": 1,
        "max": 50,
        "step": 0.5,
        "value": 15
      },
      {
        "key": "loadArm",
        "label": "阻力臂",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "F₂=6 N，l₂=10 cm，l₁=30 cm。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "F₂=6 N，l₂=10 cm，l₁=30 cm。"
        },
        {
          "title": "选用原理",
          "text": "F₁l₁=F₂l₂。"
        },
        {
          "title": "代入计算",
          "text": "F₁=6×10/30=2 N。"
        },
        {
          "title": "作答",
          "text": "动力为2 N。"
        }
      ],
      "answer": "动力为2 N。"
    }
  },
  {
    "id": "phy-steelyard",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十二章 简单机械",
    "section": "12.2",
    "title": "简易杆秤制作和标定",
    "kind": "拓展探究",
    "tags": [
      "跨学科实践"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "确定提纽、秤盘、秤砣，标零和标准质量刻度；可扩展双提纽。",
    "apparatus": [
      "杆秤模型",
      "秤盘",
      "固定秤砣",
      "标准砝码"
    ],
    "steps": [
      "确定支点、秤盘和秤砣位置。",
      "空载平衡并标零。",
      "用标准质量标定，再测试未知物。"
    ],
    "observations": [
      "载荷越大，固定秤砣通常需向远离支点处移动。"
    ],
    "conclusion": "杆秤根据杠杆平衡原理，把未知重量转换为秤砣位置。",
    "examPoints": [
      "杆自重和秤盘自重要通过调零处理"
    ],
    "pitfalls": [
      "不能忽略秤杆自重后把任意位置当零点"
    ],
    "questions": [
      {
        "q": "为什么制作杆秤后必须先标零？",
        "a": "空秤自身也产生转动效果，先标零才能把后续变化对应到载荷。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "lever",
    "modelParams": {
      "scenario": "balance",
      "variant": "steelyard"
    },
    "modelNote": "采用轻质刚性杠杆，忽略支点摩擦；输入的力臂是到力作用线的垂距。",
    "controls": [
      {
        "key": "force",
        "label": "动力",
        "unit": "N",
        "min": 1,
        "max": 50,
        "step": 0.5,
        "value": 10
      },
      {
        "key": "arm",
        "label": "动力臂",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 30
      },
      {
        "key": "load",
        "label": "阻力",
        "unit": "N",
        "min": 1,
        "max": 50,
        "step": 0.5,
        "value": 15
      },
      {
        "key": "loadArm",
        "label": "阻力臂",
        "unit": "cm",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么制作杆秤后必须先标零？",
      "steps": [
        {
          "title": "确定实验对象",
          "text": "确定提纽、秤盘、秤砣，标零和标准质量刻度；可扩展双提纽。"
        },
        {
          "title": "引用观察",
          "text": "载荷越大，固定秤砣通常需向远离支点处移动。"
        },
        {
          "title": "建立解释",
          "text": "杆秤根据杠杆平衡原理，把未知重量转换为秤砣位置。"
        },
        {
          "title": "完整回答",
          "text": "空秤自身也产生转动效果，先标零才能把后续变化对应到载荷。"
        }
      ],
      "answer": "空秤自身也产生转动效果，先标零才能把后续变化对应到载荷。"
    }
  },
  {
    "id": "phy-pulley-properties",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十二章 简单机械",
    "section": "12.3",
    "title": "定滑轮与动滑轮比较",
    "kind": "演示实验",
    "tags": [
      "演示"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "比较力的大小和方向，以及绳端、重物移动距离。",
    "apparatus": [
      "定滑轮",
      "动滑轮",
      "钩码",
      "测力计",
      "刻度尺"
    ],
    "steps": [
      "分别用定滑轮和动滑轮匀速提起同一重物。",
      "测拉力和绳端位移。",
      "比较省力与改变方向的作用。"
    ],
    "observations": [
      "理想定滑轮不省力但可改变方向；理想动滑轮可省力但绳端移动更远。"
    ],
    "conclusion": "简单机械不能同时省力又省距离；实际装置还存在自重和摩擦。",
    "examPoints": [
      "承重绳段数按实际结构判断"
    ],
    "pitfalls": [
      "不能把所有穿过滑轮的绳段都算承重段"
    ],
    "questions": [
      {
        "q": "理想二段绳动滑轮提起20 N物体，需要多大拉力？",
        "a": "需10 N拉力，绳端移动距离为重物的2倍。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pulley",
    "modelParams": {
      "scenario": "block",
      "variant": "pulley-properties"
    },
    "modelNote": "以承重绳段数比较省力和绳端位移；效率100%代表理想模型。真实定滑轮/动滑轮还有重量与摩擦，需在效率实验中比较。",
    "controls": [
      {
        "key": "load",
        "label": "物重",
        "unit": "N",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "strands",
        "label": "承重绳段数",
        "unit": "",
        "min": 1,
        "max": 4,
        "step": 1,
        "value": 2
      },
      {
        "key": "height",
        "label": "提升高度",
        "unit": "m",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "efficiency",
        "label": "机械效率",
        "unit": "%",
        "min": 20,
        "max": 100,
        "step": 1,
        "value": 100
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "G=20 N，理想装置有2段绳承重。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "G=20 N，理想装置有2段绳承重。"
        },
        {
          "title": "选用原理",
          "text": "F=G/n。"
        },
        {
          "title": "代入计算",
          "text": "F=20/2=10 N。"
        },
        {
          "title": "作答",
          "text": "拉力10 N。"
        }
      ],
      "answer": "拉力10 N。"
    }
  },
  {
    "id": "phy-pulley-efficiency",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十二章 简单机械",
    "section": "12.4",
    "title": "滑轮组机械效率",
    "kind": "学生实验",
    "tags": [
      "实验"
    ],
    "sourceIds": [
      "physics-g8b-textbook"
    ],
    "objective": "测G、F、h、s并重复不同载荷，计算有用功与总功之比。",
    "apparatus": [
      "滑轮组",
      "钩码",
      "测力计",
      "刻度尺"
    ],
    "steps": [
      "缓慢匀速提升重物。",
      "测G、F、h与绳端位移s。",
      "计算有用功、总功和效率，并改变载荷比较。"
    ],
    "observations": [
      "实际拉力做功大于仅提升重物所需的有用功。"
    ],
    "conclusion": "η=W有用/W总=Gh/(Fs)，省力不等于省功。",
    "examPoints": [
      "有用功由任务定义",
      "效率小于或等于100%的理想上限"
    ],
    "pitfalls": [
      "不要把功率与效率混为一谈"
    ],
    "questions": [
      {
        "q": "G=20 N、h=0.5 m、F=12.5 N、s=1 m，效率多少？",
        "a": "效率80%。"
      }
    ],
    "safety": [
      "使用低风险教学器材，在教师指导下操作；重物要防止坠落。"
    ],
    "model": "pulley",
    "modelParams": {
      "scenario": "block",
      "variant": "pulley-efficiency"
    },
    "modelNote": "定滑轮与动滑轮采用无重无摩擦模型；滑轮组按给定机械效率计算，绳子不可伸长。",
    "controls": [
      {
        "key": "load",
        "label": "物重",
        "unit": "N",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "strands",
        "label": "承重绳段数",
        "unit": "",
        "min": 1,
        "max": 4,
        "step": 1,
        "value": 2
      },
      {
        "key": "height",
        "label": "提升高度",
        "unit": "m",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "efficiency",
        "label": "机械效率",
        "unit": "%",
        "min": 20,
        "max": 100,
        "step": 1,
        "value": 80
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "G=20 N，h=0.5 m，F=12.5 N，s=1 m。",
      "steps": [
        {
          "title": "统一条件与单位",
          "text": "G=20 N，h=0.5 m，F=12.5 N，s=1 m。"
        },
        {
          "title": "选用原理",
          "text": "W有用=Gh，W总=Fs，η=W有用/W总。"
        },
        {
          "title": "代入计算",
          "text": "W有用=10 J；W总=12.5 J；η=10/12.5=80%。"
        },
        {
          "title": "作答",
          "text": "机械效率80%。"
        }
      ],
      "answer": "机械效率80%。"
    }
  },
  {
    "id": "phy-heat-capacity",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十三章 内能",
    "section": "13.1",
    "title": "比较水与食用油的吸热能力",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "用相同加热条件比较不同物质的温度变化。",
    "apparatus": [
      "两只相同烧杯",
      "水与食用油",
      "相同电加热器",
      "温度计",
      "天平"
    ],
    "steps": [
      "取质量相等、初温相同的两种液体。",
      "相同功率加热，按相同时间间隔记录温度。",
      "比较升高相同温度需要的时间。"
    ],
    "observations": [
      "相同时间内食用油通常升温更多。",
      "升高相同温度时，水需要更长加热时间。"
    ],
    "conclusion": "等质量物质升高相同温度，吸热量可以不同；水的比热容比食用油大。",
    "examPoints": [
      "控制质量、初温和加热功率",
      "以加热时间间接比较吸热量"
    ],
    "pitfalls": [
      "不能把升温快直接说成吸热多",
      "加热时间相同的比较必须满足有效功率相同"
    ],
    "questions": [
      {
        "q": "同样加热一分钟，哪杯吸热更多？",
        "a": "忽略热损失且加热功率相同，两杯吸热近似相同；温升不同反映比热容不同。"
      }
    ],
    "safety": [
      "不得空烧电加热器；测温探头与加热器保持适当距离。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "capacity",
      "variant": "heat-capacity",
      "capacity": 4200,
      "capacity2": 2100
    },
    "modelNote": "两次独立Godot计算采用等质量、相同初温和同功率，水取4200、油取2100 J/(kg·℃)代表值；油的实际比热容依种类和温度而变，忽略散热与相变。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.2,
        "max": 1,
        "step": 0.1,
        "value": 0.4
      },
      {
        "key": "power",
        "label": "加热功率",
        "unit": "W",
        "min": 10,
        "max": 100,
        "step": 10,
        "value": 50
      },
      {
        "key": "time",
        "label": "加热时间",
        "unit": "s",
        "min": 0,
        "max": 120,
        "step": 5,
        "value": 60
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": 10,
        "max": 30,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "0.20 kg水升高10 ℃，水的比热容为4200 J/(kg·℃)。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "0.20 kg水升高10 ℃，水的比热容为4200 J/(kg·℃)。"
        },
        {
          "title": "选用关系",
          "text": "Q=cmΔT。"
        },
        {
          "title": "代入与求解",
          "text": "Q=4200×0.20×10=8400 J。"
        },
        {
          "title": "解释结果",
          "text": "水吸收8400 J热量。"
        }
      ],
      "answer": "水吸收8400 J热量。"
    }
  },
  {
    "id": "phy-heat-capacity-sensor",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十三章 内能",
    "section": "13.1",
    "title": "用温度传感器比较比热容",
    "kind": "拓展探究",
    "tags": [
      "拓展探究",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "利用温度—时间曲线比较加热响应。",
    "apparatus": [
      "温度传感器",
      "数据采集器",
      "相同试管",
      "红外加热器",
      "水与食用油"
    ],
    "steps": [
      "固定相同质量的样品和探头位置。",
      "同时采集两支试管的温度。",
      "在相同时间段比较温升，并检查热损失。"
    ],
    "observations": [
      "曲线斜率较大的液体升温更快。"
    ],
    "conclusion": "在质量和有效加热功率相同的近似条件下，比热容越大，温度—时间曲线斜率越小。",
    "examPoints": [
      "图像横轴是时间，纵轴是温度",
      "数字采集不自动消除系统误差"
    ],
    "pitfalls": [
      "不能仅凭曲线高低比较比热容，应比较同段温升"
    ],
    "questions": [
      {
        "q": "两条曲线初温不同还能直接比较终温吗？",
        "a": "不能。应比较各自的温升，并核对质量与加热条件。"
      }
    ],
    "safety": [
      "红外加热器表面温度较高，不触碰加热区域。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "capacity",
      "variant": "heat-capacity-sensor",
      "capacity": 4200,
      "capacity2": 2100
    },
    "modelNote": "两次独立Godot计算采用等质量、相同初温和同功率，水取4200、油取2100 J/(kg·℃)代表值；油的实际比热容依种类和温度而变，忽略散热与相变。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.2,
        "max": 1,
        "step": 0.1,
        "value": 0.4
      },
      {
        "key": "power",
        "label": "加热功率",
        "unit": "W",
        "min": 10,
        "max": 100,
        "step": 10,
        "value": 50
      },
      {
        "key": "time",
        "label": "加热时间",
        "unit": "s",
        "min": 0,
        "max": 120,
        "step": 5,
        "value": 60
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": 10,
        "max": 30,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "两条曲线初温不同还能直接比较终温吗？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "利用温度—时间曲线比较加热响应。"
        },
        {
          "title": "选择实验证据",
          "text": "曲线斜率较大的液体升温更快。"
        },
        {
          "title": "建立解释",
          "text": "在质量和有效加热功率相同的近似条件下，比热容越大，温度—时间曲线斜率越小。"
        },
        {
          "title": "完整作答",
          "text": "不能。应比较各自的温升，并核对质量与加热条件。"
        }
      ],
      "answer": "不能。应比较各自的温升，并核对质量与加热条件。"
    }
  },
  {
    "id": "phy-gas-diffusion",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十三章 内能",
    "section": "13.2",
    "title": "观察气体相互扩散",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "以气体混合现象认识分子无规则运动。",
    "apparatus": [
      "上下两个气体容器模型",
      "隔板",
      "颜色示踪"
    ],
    "steps": [
      "保持两容器气体静止。",
      "抽去隔板，连续观察颜色分布。",
      "比较开始与充分混合后的颜色。"
    ],
    "observations": [
      "示踪气体逐渐进入另一容器，最终颜色趋于均匀。"
    ],
    "conclusion": "扩散说明分子在不停地做无规则运动。",
    "examPoints": [
      "把密度较大的有色气体放下方，排除简单重力下沉解释"
    ],
    "pitfalls": [
      "看到的是大量分子分布形成的颜色，不是单个分子"
    ],
    "questions": [
      {
        "q": "有色气体为什么能进入上面的容器？",
        "a": "分子持续无规则运动，能向上越过原来的分界面并逐渐混合。"
      }
    ],
    "safety": [
      "教材采用录像观察有毒气体；本页仅模拟，不制备或接触二氧化氮。"
    ],
    "model": "molecular",
    "modelParams": {
      "scenario": "diffusion",
      "variant": "gas-diffusion"
    },
    "modelNote": "粒子大小、间距、扩散速度与受力曲线为定性示意，不能读作真实分子尺度或实测扩散系数。",
    "controls": [
      {
        "key": "temperature",
        "label": "温度",
        "unit": "℃",
        "min": 0,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "time",
        "label": "观察进度（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "有色气体为什么能进入上面的容器？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "以气体混合现象认识分子无规则运动。"
        },
        {
          "title": "选择实验证据",
          "text": "示踪气体逐渐进入另一容器，最终颜色趋于均匀。"
        },
        {
          "title": "建立解释",
          "text": "扩散说明分子在不停地做无规则运动。"
        },
        {
          "title": "完整作答",
          "text": "分子持续无规则运动，能向上越过原来的分界面并逐渐混合。"
        }
      ],
      "answer": "分子持续无规则运动，能向上越过原来的分界面并逐渐混合。"
    }
  },
  {
    "id": "phy-liquid-diffusion",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十三章 内能",
    "section": "13.2",
    "title": "观察液体界面逐渐模糊",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "区分缓慢扩散与搅拌引起的宏观流动。",
    "apparatus": [
      "分层液体模型",
      "透明容器",
      "时间序列图"
    ],
    "steps": [
      "将密度较大的有色溶液置于下层。",
      "不摇晃容器，观察长时间变化。",
      "记录界面清晰度的变化。"
    ],
    "observations": [
      "原来清晰的颜色界面逐渐模糊。"
    ],
    "conclusion": "液体内部的分子运动能够导致不同物质互相进入。",
    "examPoints": [
      "扩散可发生在气体、液体和固体中"
    ],
    "pitfalls": [
      "不能把向水中搅拌颜料的过程全称为分子扩散"
    ],
    "questions": [
      {
        "q": "为什么观察时不搅动液体？",
        "a": "搅动会造成明显的整体流动，妨碍判断由分子运动造成的扩散。"
      }
    ],
    "safety": [
      "有色化学溶液仅由教师选用与处置；模拟不代表真实扩散时间。"
    ],
    "model": "molecular",
    "modelParams": {
      "scenario": "diffusion",
      "variant": "liquid-diffusion"
    },
    "modelNote": "粒子大小、间距、扩散速度与受力曲线为定性示意，不能读作真实分子尺度或实测扩散系数。",
    "controls": [
      {
        "key": "temperature",
        "label": "温度",
        "unit": "℃",
        "min": 0,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "time",
        "label": "观察进度（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么观察时不搅动液体？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "区分缓慢扩散与搅拌引起的宏观流动。"
        },
        {
          "title": "选择实验证据",
          "text": "原来清晰的颜色界面逐渐模糊。"
        },
        {
          "title": "建立解释",
          "text": "液体内部的分子运动能够导致不同物质互相进入。"
        },
        {
          "title": "完整作答",
          "text": "搅动会造成明显的整体流动，妨碍判断由分子运动造成的扩散。"
        }
      ],
      "answer": "搅动会造成明显的整体流动，妨碍判断由分子运动造成的扩散。"
    }
  },
  {
    "id": "phy-diffusion-temperature",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十三章 内能",
    "section": "13.2",
    "title": "比较冷热水中的墨水扩散",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "比较温度对扩散快慢的影响。",
    "apparatus": [
      "相同烧杯",
      "等量冷热水",
      "相同滴管",
      "墨水"
    ],
    "steps": [
      "取相同体积的冷水和热水。",
      "同时在相同位置滴入等量墨水。",
      "观察相同时间内颜色分散程度。"
    ],
    "observations": [
      "热水中的颜色通常更快分散。"
    ],
    "conclusion": "温度越高，分子热运动通常越剧烈，扩散更快。",
    "examPoints": [
      "控制水量、墨水滴数和观察时间"
    ],
    "pitfalls": [
      "温差对流也会影响现象；不应声称观察到纯粹单一的扩散"
    ],
    "questions": [
      {
        "q": "热水变色更快说明什么？",
        "a": "在尽量控制整体流动的条件下，支持温度较高时分子运动较剧烈的解释。"
      }
    ],
    "safety": [
      "避免使用沸水，防止烫伤。"
    ],
    "model": "molecular",
    "modelParams": {
      "scenario": "diffusion",
      "variant": "temperature-diffusion"
    },
    "modelNote": "粒子大小、间距、扩散速度与受力曲线为定性示意，不能读作真实分子尺度或实测扩散系数。",
    "controls": [
      {
        "key": "temperature",
        "label": "温度",
        "unit": "℃",
        "min": 0,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "time",
        "label": "观察进度（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "热水变色更快说明什么？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "比较温度对扩散快慢的影响。"
        },
        {
          "title": "选择实验证据",
          "text": "热水中的颜色通常更快分散。"
        },
        {
          "title": "建立解释",
          "text": "温度越高，分子热运动通常越剧烈，扩散更快。"
        },
        {
          "title": "完整作答",
          "text": "在尽量控制整体流动的条件下，支持温度较高时分子运动较剧烈的解释。"
        }
      ],
      "answer": "在尽量控制整体流动的条件下，支持温度较高时分子运动较剧烈的解释。"
    }
  },
  {
    "id": "phy-lead-attraction",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十三章 内能",
    "section": "13.2",
    "title": "压紧的铅柱为何不易分开",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "通过接触面结合现象认识分子间引力。",
    "apparatus": [
      "两块表面处理过的铅柱模型",
      "悬挂支架",
      "载荷"
    ],
    "steps": [
      "比较粗糙面与清洁平整面。",
      "使两平面紧密接触。",
      "观察模型在较小载荷下的结合情况。"
    ],
    "observations": [
      "清洁平整的接触面压紧后更容易结合。"
    ],
    "conclusion": "分子之间存在引力；有效作用要求分子间距离足够近。",
    "examPoints": [
      "表面清洁和削平的作用是增加紧密接触",
      "引力与斥力同时存在"
    ],
    "pitfalls": [
      "不能解释成磁力，也不能说只存在引力"
    ],
    "questions": [
      {
        "q": "为什么需要把接触面处理平整？",
        "a": "平整清洁使更多部位达到足够小的分子间距，分子间作用才明显。"
      }
    ],
    "safety": [
      "铅有毒且载荷可能掉落；本活动仅模拟或观看教师演示。"
    ],
    "model": "molecular",
    "modelParams": {
      "scenario": "attraction",
      "variant": "attraction"
    },
    "modelNote": "粒子大小、间距、扩散速度与受力曲线为定性示意，不能读作真实分子尺度或实测扩散系数。",
    "controls": [
      {
        "key": "distance",
        "label": "分子间距（相对量）",
        "unit": "",
        "min": 0.8,
        "max": 3,
        "step": 0.05,
        "value": 1.2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么需要把接触面处理平整？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "通过接触面结合现象认识分子间引力。"
        },
        {
          "title": "选择实验证据",
          "text": "清洁平整的接触面压紧后更容易结合。"
        },
        {
          "title": "建立解释",
          "text": "分子之间存在引力；有效作用要求分子间距离足够近。"
        },
        {
          "title": "完整作答",
          "text": "平整清洁使更多部位达到足够小的分子间距，分子间作用才明显。"
        }
      ],
      "answer": "平整清洁使更多部位达到足够小的分子间距，分子间作用才明显。"
    }
  },
  {
    "id": "phy-compression-heating",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十三章 内能",
    "section": "13.3",
    "title": "压缩空气使温度升高",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "认识外界对气体做功时内能的变化。",
    "apparatus": [
      "带活塞气筒模型",
      "温度示意",
      "脱脂棉指示模型"
    ],
    "steps": [
      "记录压缩前状态。",
      "快速推动活塞。",
      "比较压缩前后温度并标出做功方向。"
    ],
    "observations": [
      "快速压缩后气体温度升高。"
    ],
    "conclusion": "外界对气体做功，可以使气体内能增加。",
    "examPoints": [
      "改变内能的方式为做功",
      "区分做功方向"
    ],
    "pitfalls": [
      "温度升高不一定由吸热引起"
    ],
    "questions": [
      {
        "q": "没有加热器，气体为何也会升温？",
        "a": "外力推动活塞对气体做功，将机械能转化为气体内能。"
      }
    ],
    "safety": [
      "压缩点火和玻璃压力容器仅限教师规范演示，本页仅模拟。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "compression",
      "variant": "compression",
      "mass": 0.01,
      "capacity": 718,
      "gamma": 1.4
    },
    "modelNote": "采用理想气体的绝热模型，温度先换为开尔文；不含散热、雾滴形成细节。初中只需理解做功改变内能，绝热公式和数值属于拓展。",
    "controls": [
      {
        "key": "compressionRatio",
        "label": "体积比",
        "unit": "",
        "min": 1,
        "max": 4,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": 0,
        "max": 90,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "没有加热器，气体为何也会升温？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "认识外界对气体做功时内能的变化。"
        },
        {
          "title": "选择实验证据",
          "text": "快速压缩后气体温度升高。"
        },
        {
          "title": "建立解释",
          "text": "外界对气体做功，可以使气体内能增加。"
        },
        {
          "title": "完整作答",
          "text": "外力推动活塞对气体做功，将机械能转化为气体内能。"
        }
      ],
      "answer": "外力推动活塞对气体做功，将机械能转化为气体内能。"
    }
  },
  {
    "id": "phy-expansion-cooling",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十三章 内能",
    "section": "13.3",
    "title": "气体推动瓶塞与白雾出现",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "用瓶塞运动和雾的产生认识膨胀做功。",
    "apparatus": [
      "密闭瓶模型",
      "少量水",
      "气泵",
      "瓶塞"
    ],
    "steps": [
      "观察瓶内初始水蒸气状态。",
      "在模型中升高气压，使瓶塞被推出。",
      "观察推出后雾的变化。"
    ],
    "observations": [
      "瓶塞获得机械能；瓶内可能出现小水滴形成的白雾。"
    ],
    "conclusion": "气体对外做功，内能减少、温度降低；水蒸气遇冷液化形成雾。",
    "examPoints": [
      "白雾为液态小水滴",
      "由现象建立做功—内能变化链条"
    ],
    "pitfalls": [
      "白雾不是水蒸气本身"
    ],
    "questions": [
      {
        "q": "瓶塞跳出后白雾是怎样形成的？",
        "a": "气体膨胀做功降温，部分水蒸气液化成小水滴，形成可见白雾。"
      }
    ],
    "safety": [
      "加压容器与飞出瓶塞有风险；本页只模拟，不自行尝试。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "expansion",
      "variant": "expansion",
      "mass": 0.01,
      "capacity": 718,
      "gamma": 1.4
    },
    "modelNote": "采用理想气体的绝热模型，温度先换为开尔文；不含散热、雾滴形成细节。初中只需理解做功改变内能，绝热公式和数值属于拓展。",
    "controls": [
      {
        "key": "compressionRatio",
        "label": "体积比",
        "unit": "",
        "min": 1,
        "max": 4,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": 0,
        "max": 90,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "瓶塞跳出后白雾是怎样形成的？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "用瓶塞运动和雾的产生认识膨胀做功。"
        },
        {
          "title": "选择实验证据",
          "text": "瓶塞获得机械能；瓶内可能出现小水滴形成的白雾。"
        },
        {
          "title": "建立解释",
          "text": "气体对外做功，内能减少、温度降低；水蒸气遇冷液化形成雾。"
        },
        {
          "title": "完整作答",
          "text": "气体膨胀做功降温，部分水蒸气液化成小水滴，形成可见白雾。"
        }
      ],
      "answer": "气体膨胀做功降温，部分水蒸气液化成小水滴，形成可见白雾。"
    }
  },
  {
    "id": "phy-friction-warming",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十四章 内能的利用",
    "section": "14.1",
    "title": "搓手中的能量转化",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "识别摩擦过程中机械能向内能的转化。",
    "apparatus": [
      "双手模型",
      "温度变化示意"
    ],
    "steps": [
      "比较双手静止与相互摩擦的情况。",
      "保持相近压力，改变摩擦次数。",
      "解释发热的能量来源。"
    ],
    "observations": [
      "摩擦后手的温度上升。"
    ],
    "conclusion": "克服摩擦做功，机械能转化为内能。",
    "examPoints": [
      "做功与热传递的区分"
    ],
    "pitfalls": [
      "不要说摩擦凭空创造能量"
    ],
    "questions": [
      {
        "q": "搓手取暖属于吸热还是做功改变内能？",
        "a": "主要是通过做功改变内能，机械能转化为内能。"
      }
    ],
    "safety": [
      "轻度体验即可，避免持续摩擦损伤皮肤。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "friction",
      "variant": "friction"
    },
    "modelNote": "采用恒定滑动摩擦力，摩擦功转化为接触物体系统的内能；不把全部能量归给单个物体，未计算两物体温升分配与散热。",
    "controls": [
      {
        "key": "force",
        "label": "滑动摩擦力",
        "unit": "N",
        "min": 0,
        "max": 20,
        "step": 0.5,
        "value": 5
      },
      {
        "key": "distance",
        "label": "相对滑动路程",
        "unit": "m",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "搓手取暖属于吸热还是做功改变内能？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "识别摩擦过程中机械能向内能的转化。"
        },
        {
          "title": "选择实验证据",
          "text": "摩擦后手的温度上升。"
        },
        {
          "title": "建立解释",
          "text": "克服摩擦做功，机械能转化为内能。"
        },
        {
          "title": "完整作答",
          "text": "主要是通过做功改变内能，机械能转化为内能。"
        }
      ],
      "answer": "主要是通过做功改变内能，机械能转化为内能。"
    }
  },
  {
    "id": "phy-solar-water",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十四章 内能的利用",
    "section": "14.1",
    "title": "黑色容器中的水吸收太阳能",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "观察太阳辐射使水温升高。",
    "apparatus": [
      "黑色水袋模型",
      "水",
      "温度计",
      "光照源"
    ],
    "steps": [
      "记录初温、水量和光照条件。",
      "照射相同时间并记录温度。",
      "比较遮光和受光时的变化。"
    ],
    "observations": [
      "受光时水温逐渐升高。"
    ],
    "conclusion": "吸收的太阳辐射能可以转化为水与容器的内能。",
    "examPoints": [
      "要比较吸热性能需控制水量和受光面积"
    ],
    "pitfalls": [
      "不能只根据颜色断言任意材料升温一定更快"
    ],
    "questions": [
      {
        "q": "这个装置把什么能转化为什么能？",
        "a": "主要把太阳辐射能转化为内能。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "energy",
    "modelParams": {
      "scenario": "solarWater",
      "variant": "solar-water"
    },
    "modelNote": "以输入功率、时间和给定整体效率估算有效能量；不把光功率直接等同于转速或温升，不模拟装置细节和实际散热。",
    "controls": [
      {
        "key": "power",
        "label": "输入功率",
        "unit": "W",
        "min": 0,
        "max": 2000,
        "step": 10,
        "value": 500
      },
      {
        "key": "efficiency",
        "label": "转换效率",
        "unit": "%",
        "min": 0,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "time",
        "label": "时间",
        "unit": "s",
        "min": 0,
        "max": 600,
        "step": 10,
        "value": 120
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "这个装置把什么能转化为什么能？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "观察太阳辐射使水温升高。"
        },
        {
          "title": "选择实验证据",
          "text": "受光时水温逐渐升高。"
        },
        {
          "title": "建立解释",
          "text": "吸收的太阳辐射能可以转化为水与容器的内能。"
        },
        {
          "title": "完整作答",
          "text": "主要把太阳辐射能转化为内能。"
        }
      ],
      "answer": "主要把太阳辐射能转化为内能。"
    }
  },
  {
    "id": "phy-solar-fan",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十四章 内能的利用",
    "section": "14.1",
    "title": "太阳能电池驱动小风扇",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "追踪太阳能、电能和机械能之间的转化。",
    "apparatus": [
      "太阳能电池板",
      "低压小电动机",
      "叶片",
      "遮光片"
    ],
    "steps": [
      "将太阳能电池连接小电动机。",
      "改变有效受光面积。",
      "观察叶片运动并画出能量转化链。"
    ],
    "observations": [
      "受光充分时叶片转动；遮光后转速降低或停止。"
    ],
    "conclusion": "太阳能电池把光能转化为电能，电动机把一部分电能转化为机械能。",
    "examPoints": [
      "串联描述能量转化，注意存在损耗"
    ],
    "pitfalls": [
      "不能把太阳能电池说成电动机"
    ],
    "questions": [
      {
        "q": "遮光后风扇为何可能停止？",
        "a": "电池板可提供的电功率减小，可能不足以维持电动机转动。"
      }
    ],
    "safety": [
      "仅用匹配的低压电机；避免触碰旋转叶片。"
    ],
    "model": "energy",
    "modelParams": {
      "scenario": "solarFan",
      "variant": "solar-fan"
    },
    "modelNote": "以输入功率、时间和给定整体效率估算有效能量；不把光功率直接等同于转速或温升，不模拟装置细节和实际散热。",
    "controls": [
      {
        "key": "power",
        "label": "输入功率",
        "unit": "W",
        "min": 0,
        "max": 2000,
        "step": 10,
        "value": 500
      },
      {
        "key": "efficiency",
        "label": "转换效率",
        "unit": "%",
        "min": 0,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "time",
        "label": "时间",
        "unit": "s",
        "min": 0,
        "max": 600,
        "step": 10,
        "value": 120
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "遮光后风扇为何可能停止？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "追踪太阳能、电能和机械能之间的转化。"
        },
        {
          "title": "选择实验证据",
          "text": "受光充分时叶片转动；遮光后转速降低或停止。"
        },
        {
          "title": "建立解释",
          "text": "太阳能电池把光能转化为电能，电动机把一部分电能转化为机械能。"
        },
        {
          "title": "完整作答",
          "text": "电池板可提供的电功率减小，可能不足以维持电动机转动。"
        }
      ],
      "answer": "电池板可提供的电功率减小，可能不足以维持电动机转动。"
    }
  },
  {
    "id": "phy-rubbing-paper",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十四章 内能的利用",
    "section": "14.1",
    "title": "摩擦后的塑料笔杆吸引纸屑",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "观察摩擦起电及带电体吸引轻小物体。",
    "apparatus": [
      "塑料笔杆模型",
      "织物",
      "碎纸屑"
    ],
    "steps": [
      "比较摩擦前后的笔杆。",
      "让笔杆靠近细小纸屑。",
      "观察吸引现象并讨论电荷转移。"
    ],
    "observations": [
      "摩擦后的笔杆能够吸引轻小纸屑。"
    ],
    "conclusion": "摩擦可能使电子在物体间转移；带电体能够吸引轻小物体。",
    "examPoints": [
      "吸引不必然说明两个物体带异种电荷"
    ],
    "pitfalls": [
      "不能说摩擦产生了新的电荷"
    ],
    "questions": [
      {
        "q": "纸屑被吸引，能否判断纸屑原先带正电？",
        "a": "不能。带电体也能吸引原先整体不带电的轻小物体。"
      }
    ],
    "safety": [
      "远离易燃蒸气和精密电子器件。"
    ],
    "model": "charge",
    "modelParams": {
      "scenario": "rubbing",
      "variant": "rubbing"
    },
    "modelNote": "电荷与静电作用均为相对量；验电器张角不能直接当作准确电量，吸引轻小物体还涉及极化。",
    "controls": [
      {
        "key": "charge1",
        "label": "物体一电荷（相对量）",
        "unit": "",
        "min": -5,
        "max": 5,
        "step": 1,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "纸屑被吸引，能否判断纸屑原先带正电？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "观察摩擦起电及带电体吸引轻小物体。"
        },
        {
          "title": "选择实验证据",
          "text": "摩擦后的笔杆能够吸引轻小纸屑。"
        },
        {
          "title": "建立解释",
          "text": "摩擦可能使电子在物体间转移；带电体能够吸引轻小物体。"
        },
        {
          "title": "完整作答",
          "text": "不能。带电体也能吸引原先整体不带电的轻小物体。"
        }
      ],
      "answer": "不能。带电体也能吸引原先整体不带电的轻小物体。"
    }
  },
  {
    "id": "phy-steam-work",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十四章 内能的利用",
    "section": "14.2",
    "title": "水蒸气推动塞子",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "用蒸气做功模型说明热机原理。",
    "apparatus": [
      "受热容器模型",
      "水",
      "活塞或塞子",
      "能量流向图"
    ],
    "steps": [
      "在模型中向水输入热量。",
      "观察气体膨胀推动塞子。",
      "标出燃料、气体和塞子间的能量变化。"
    ],
    "observations": [
      "气体对塞子施力并使其运动。"
    ],
    "conclusion": "内能可以转化为机械能，热机利用这种转化做功。",
    "examPoints": [
      "能量来自燃料的化学能，不是凭空由水生成"
    ],
    "pitfalls": [
      "不能把全部输入热量都当作有用机械功"
    ],
    "questions": [
      {
        "q": "塞子的机械能来自哪里？",
        "a": "来自气体减少的内能；气体先通过热传递获得能量。"
      }
    ],
    "safety": [
      "封闭加热和飞塞危险；仅模拟，不能在家封闭加热容器。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "engine",
      "variant": "steam-work"
    },
    "modelNote": "按能量关系计算，默认不计散热且比热容保持常数；温度模型不包含熔化和沸腾，相变需在物态变化实验中观察。",
    "controls": [
      {
        "key": "power",
        "label": "加热功率",
        "unit": "W",
        "min": 10,
        "max": 2000,
        "step": 10,
        "value": 500
      },
      {
        "key": "time",
        "label": "加热时间",
        "unit": "s",
        "min": 0,
        "max": 600,
        "step": 10,
        "value": 120
      },
      {
        "key": "efficiency",
        "label": "热机效率",
        "unit": "%",
        "min": 0,
        "max": 80,
        "step": 1,
        "value": 30
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "塞子的机械能来自哪里？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "用蒸气做功模型说明热机原理。"
        },
        {
          "title": "选择实验证据",
          "text": "气体对塞子施力并使其运动。"
        },
        {
          "title": "建立解释",
          "text": "内能可以转化为机械能，热机利用这种转化做功。"
        },
        {
          "title": "完整作答",
          "text": "来自气体减少的内能；气体先通过热传递获得能量。"
        }
      ],
      "answer": "来自气体减少的内能；气体先通过热传递获得能量。"
    }
  },
  {
    "id": "phy-simple-heat-engine",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十四章 内能的利用",
    "section": "14.4",
    "title": "设计简易热机模型",
    "kind": "拓展探究",
    "tags": [
      "拓展探究",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "分析受热、膨胀和输出机械功的联系。",
    "apparatus": [
      "热机剖面模型",
      "热源",
      "活动部件",
      "散热部分"
    ],
    "steps": [
      "辨认模型中的热源、工作物质和输出部件。",
      "调节输入与散热条件。",
      "解释为什么不能把全部热量转化为有用功。"
    ],
    "observations": [
      "输入热量增加时，输出功可以增加；总有一部分能量没有转为有用功。"
    ],
    "conclusion": "热机效率等于有用机械功与燃料完全燃烧放热量之比。",
    "examPoints": [
      "效率不是功率",
      "比较应使用相同系统边界"
    ],
    "pitfalls": [
      "不能声称热机效率可达100%"
    ],
    "questions": [
      {
        "q": "输入1000 J热量，输出250 J有用功，效率是多少？",
        "a": "效率为25%。"
      }
    ],
    "safety": [
      "模型设计可用仿真；明火和热容器仅由教师操作。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "engine",
      "variant": "heat-engine"
    },
    "modelNote": "按能量关系计算，默认不计散热且比热容保持常数；温度模型不包含熔化和沸腾，相变需在物态变化实验中观察。",
    "controls": [
      {
        "key": "power",
        "label": "加热功率",
        "unit": "W",
        "min": 10,
        "max": 2000,
        "step": 10,
        "value": 500
      },
      {
        "key": "time",
        "label": "加热时间",
        "unit": "s",
        "min": 0,
        "max": 600,
        "step": 10,
        "value": 120
      },
      {
        "key": "efficiency",
        "label": "热机效率",
        "unit": "%",
        "min": 0,
        "max": 80,
        "step": 1,
        "value": 30
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "输入热量1000 J，有用功250 J。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "输入热量1000 J，有用功250 J。"
        },
        {
          "title": "选用关系",
          "text": "η=W有用/Q输入。"
        },
        {
          "title": "代入与求解",
          "text": "η=250/1000=0.25=25%。"
        },
        {
          "title": "解释结果",
          "text": "效率25%，其余能量主要散失或随废气排出。"
        }
      ],
      "answer": "效率25%，其余能量主要散失或随废气排出。"
    }
  },
  {
    "id": "phy-charge-interaction",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十五章 电流和电路",
    "section": "15.1",
    "title": "比较两种电荷的相互作用",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "通过带电棒的运动判断电荷相互作用。",
    "apparatus": [
      "两根带电玻璃棒模型",
      "橡胶棒模型",
      "绝缘悬线"
    ],
    "steps": [
      "用同类摩擦方法使两棒带电。",
      "靠近悬挂的棒观察方向。",
      "换成另一类带电棒重复比较。"
    ],
    "observations": [
      "同种带电棒相互排斥；异种带电棒相互吸引。"
    ],
    "conclusion": "同种电荷相互排斥，异种电荷相互吸引。",
    "examPoints": [
      "排斥可判断同种电荷",
      "吸引有多种原因"
    ],
    "pitfalls": [
      "不能仅靠吸引就断定异种电荷"
    ],
    "questions": [
      {
        "q": "两个轻小物体互相排斥，可以判断什么？",
        "a": "两物体都带电，且带同种电荷。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "charge",
    "modelParams": {
      "scenario": "interaction",
      "variant": "interaction"
    },
    "modelNote": "电荷与静电作用均为相对量；验电器张角不能直接当作准确电量，吸引轻小物体还涉及极化。",
    "controls": [
      {
        "key": "charge1",
        "label": "物体一电荷（相对量）",
        "unit": "",
        "min": -5,
        "max": 5,
        "step": 1,
        "value": 3
      },
      {
        "key": "charge2",
        "label": "物体二电荷（相对量）",
        "unit": "",
        "min": -5,
        "max": 5,
        "step": 1,
        "value": 3
      },
      {
        "key": "distance",
        "label": "间距（相对量）",
        "unit": "",
        "min": 1,
        "max": 10,
        "step": 0.5,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "两个轻小物体互相排斥，可以判断什么？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "通过带电棒的运动判断电荷相互作用。"
        },
        {
          "title": "选择实验证据",
          "text": "同种带电棒相互排斥；异种带电棒相互吸引。"
        },
        {
          "title": "建立解释",
          "text": "同种电荷相互排斥，异种电荷相互吸引。"
        },
        {
          "title": "完整作答",
          "text": "两物体都带电，且带同种电荷。"
        }
      ],
      "answer": "两物体都带电，且带同种电荷。"
    }
  },
  {
    "id": "phy-electroscope",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十五章 电流和电路",
    "section": "15.1",
    "title": "用验电器检查带电状态",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "依据金属箔张角判断接触后的带电状态。",
    "apparatus": [
      "验电器模型",
      "带电体",
      "绝缘柄"
    ],
    "steps": [
      "先使验电器不带电。",
      "让待测物体接触金属球。",
      "观察金属箔是否张开。"
    ],
    "observations": [
      "金属箔带同种电荷后相互排斥而张开。"
    ],
    "conclusion": "验电器根据同种电荷相互排斥工作。",
    "examPoints": [
      "张角可作相对指示，不能直接当成精确电荷量"
    ],
    "pitfalls": [
      "未带已知电荷的验电器不能直接确定电荷正负"
    ],
    "questions": [
      {
        "q": "两片金属箔为什么同时张开？",
        "a": "接触转移的电荷使两片箔带同种电荷，产生相互排斥。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "charge",
    "modelParams": {
      "scenario": "electroscope",
      "variant": "electroscope"
    },
    "modelNote": "电荷与静电作用均为相对量；验电器张角不能直接当作准确电量，吸引轻小物体还涉及极化。",
    "controls": [
      {
        "key": "charge1",
        "label": "物体一电荷（相对量）",
        "unit": "",
        "min": -5,
        "max": 5,
        "step": 1,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "两片金属箔为什么同时张开？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "依据金属箔张角判断接触后的带电状态。"
        },
        {
          "title": "选择实验证据",
          "text": "金属箔带同种电荷后相互排斥而张开。"
        },
        {
          "title": "建立解释",
          "text": "验电器根据同种电荷相互排斥工作。"
        },
        {
          "title": "完整作答",
          "text": "接触转移的电荷使两片箔带同种电荷，产生相互排斥。"
        }
      ],
      "answer": "接触转移的电荷使两片箔带同种电荷，产生相互排斥。"
    }
  },
  {
    "id": "phy-simple-circuit",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十五章 电流和电路",
    "section": "15.2",
    "title": "让灯泡、电动机与蜂鸣器工作",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "连接并理解电源、开关和用电器构成的闭合电路。",
    "apparatus": [
      "低压电池",
      "开关",
      "小灯泡",
      "电动机",
      "蜂鸣器",
      "导线"
    ],
    "steps": [
      "断开开关后连接一个用电器。",
      "检查后闭合开关并观察。",
      "依次更换用电器并比较输出形式。"
    ],
    "observations": [
      "灯泡发光、电动机转动或蜂鸣器发声；断路后停止工作。"
    ],
    "conclusion": "持续电流需要电源和闭合电路；用电器将电能转化为其他形式。",
    "examPoints": [
      "电流不是被用电器消耗掉的",
      "开关控制通断"
    ],
    "pitfalls": [
      "禁止用导线直接连接电池两极"
    ],
    "questions": [
      {
        "q": "电池接上了，用电器却不工作，首先检查什么？",
        "a": "先断开开关，检查电路是否闭合、接触是否可靠及器材是否匹配。"
      }
    ],
    "safety": [
      "只用低压电源；不能把电池两端直接短接。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "ohm",
      "variant": "simple"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "scenario",
        "label": "开关状态",
        "options": [
          {
            "value": "ohm",
            "label": "闭合"
          },
          {
            "value": "open",
            "label": "断开"
          }
        ],
        "value": "ohm"
      },
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "电池接上了，用电器却不工作，首先检查什么？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "连接并理解电源、开关和用电器构成的闭合电路。"
        },
        {
          "title": "选择实验证据",
          "text": "灯泡发光、电动机转动或蜂鸣器发声；断路后停止工作。"
        },
        {
          "title": "建立解释",
          "text": "持续电流需要电源和闭合电路；用电器将电能转化为其他形式。"
        },
        {
          "title": "完整作答",
          "text": "先断开开关，检查电路是否闭合、接触是否可靠及器材是否匹配。"
        }
      ],
      "answer": "先断开开关，检查电路是否闭合、接触是否可靠及器材是否匹配。"
    }
  },
  {
    "id": "phy-led-direction",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十五章 电流和电路",
    "section": "15.2",
    "title": "观察发光二极管的单向导电",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "通过调换LED方向认识单向导电性。",
    "apparatus": [
      "LED",
      "限流电阻",
      "低压电源",
      "开关"
    ],
    "steps": [
      "接入限流电阻并按正向连接LED。",
      "闭合开关观察。",
      "断电后反向连接LED再观察。"
    ],
    "observations": [
      "正向且电流合适时发光；反向通常不发光。"
    ],
    "conclusion": "LED具有单向导电性，可用来判断电流方向。",
    "examPoints": [
      "长脚通常为正极，使用前查器材说明",
      "电子移动方向与规定电流方向相反"
    ],
    "pitfalls": [
      "不发光也可能由断路或电压不足导致"
    ],
    "questions": [
      {
        "q": "反向接入LED不亮，是否说明电源没电？",
        "a": "不能；LED反向截止即可导致不亮，应结合连接方向排查。"
      }
    ],
    "safety": [
      "必须限流，不超过LED允许反向电压。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "led",
      "variant": "led"
    },
    "modelNote": "采用约2V正向压降和串联限流电阻；反向时不导通，不模拟击穿与温度影响。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 6,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "限流电阻",
        "unit": "Ω",
        "min": 100,
        "max": 1000,
        "step": 50,
        "value": 200
      },
      {
        "key": "orientation",
        "label": "二极管方向",
        "options": [
          {
            "value": "forward",
            "label": "正向"
          },
          {
            "value": "reverse",
            "label": "反向"
          }
        ],
        "value": "forward"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "反向接入LED不亮，是否说明电源没电？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "通过调换LED方向认识单向导电性。"
        },
        {
          "title": "选择实验证据",
          "text": "正向且电流合适时发光；反向通常不发光。"
        },
        {
          "title": "建立解释",
          "text": "LED具有单向导电性，可用来判断电流方向。"
        },
        {
          "title": "完整作答",
          "text": "不能；LED反向截止即可导致不亮，应结合连接方向排查。"
        }
      ],
      "answer": "不能；LED反向截止即可导致不亮，应结合连接方向排查。"
    }
  },
  {
    "id": "phy-conductor-insulator",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十五章 电流和电路",
    "section": "15.2",
    "title": "比较金属与橡胶的导电性",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "把材料放入同一测试电路比较导电性。",
    "apparatus": [
      "低压测试电路",
      "小灯泡",
      "金属丝",
      "橡胶条"
    ],
    "steps": [
      "断电后接入待测材料。",
      "闭合开关观察灯泡或电流表。",
      "保持其他条件不变，更换材料。"
    ],
    "observations": [
      "金属接入时通常有明显电流，干燥橡胶接入时几乎无电流。"
    ],
    "conclusion": "导体容易导电，绝缘体不容易导电；导电性与材料和条件有关。",
    "examPoints": [
      "人体与湿地面也能导电",
      "绝缘体不是任何条件下绝不导电"
    ],
    "pitfalls": [
      "不能用家庭市电测试材料"
    ],
    "questions": [
      {
        "q": "灯不亮能严格证明材料电阻无限大吗？",
        "a": "不能。电流可能太小，低于灯泡可见发光的条件。"
      }
    ],
    "safety": [
      "仅低压测试；不得以人体接入电路作测试。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "conductivity",
      "variant": "conductivity"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "material",
        "label": "材料",
        "options": [
          {
            "value": "copper",
            "label": "铜"
          },
          {
            "value": "aluminum",
            "label": "铝"
          },
          {
            "value": "iron",
            "label": "铁"
          },
          {
            "value": "nichrome",
            "label": "镍铬合金"
          },
          {
            "value": "graphite",
            "label": "石墨"
          },
          {
            "value": "plastic",
            "label": "塑料"
          },
          {
            "value": "glass",
            "label": "玻璃"
          }
        ],
        "value": "nichrome"
      },
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "灯不亮能严格证明材料电阻无限大吗？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "把材料放入同一测试电路比较导电性。"
        },
        {
          "title": "选择实验证据",
          "text": "金属接入时通常有明显电流，干燥橡胶接入时几乎无电流。"
        },
        {
          "title": "建立解释",
          "text": "导体容易导电，绝缘体不容易导电；导电性与材料和条件有关。"
        },
        {
          "title": "完整作答",
          "text": "不能。电流可能太小，低于灯泡可见发光的条件。"
        }
      ],
      "answer": "不能。电流可能太小，低于灯泡可见发光的条件。"
    }
  },
  {
    "id": "phy-lamp-short",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十五章 电流和电路",
    "section": "15.2",
    "title": "观察小灯泡被局部短接",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "区分短接用电器与电源短路。",
    "apparatus": [
      "两个串联小灯泡",
      "低压电源",
      "开关",
      "跨接导线"
    ],
    "steps": [
      "先连好两个灯泡的串联电路。",
      "在模拟中跨接其中一个灯泡。",
      "观察两个灯泡与电流的变化。"
    ],
    "observations": [
      "被跨接灯泡两端电压接近零而熄灭；另一灯泡仍可发光。"
    ],
    "conclusion": "电流主要通过低电阻跨接导线，绕过被短接的灯泡。",
    "examPoints": [
      "局部短接不等于无条件安全",
      "两灯串联时跨接一灯仍可能导致电流增大"
    ],
    "pitfalls": [
      "不要把这个动作推广到电源两极"
    ],
    "questions": [
      {
        "q": "被短接的灯泡为什么熄灭？",
        "a": "其两端被低电阻导线连接，电压接近零，流经灯丝的电流很小。"
      }
    ],
    "safety": [
      "仅仿真或教师限流演示；禁止直接短接电源。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "shortedBulb",
      "variant": "shorted-lamp"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance2",
        "label": "电阻 R2",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "被短接的灯泡为什么熄灭？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "区分短接用电器与电源短路。"
        },
        {
          "title": "选择实验证据",
          "text": "被跨接灯泡两端电压接近零而熄灭；另一灯泡仍可发光。"
        },
        {
          "title": "建立解释",
          "text": "电流主要通过低电阻跨接导线，绕过被短接的灯泡。"
        },
        {
          "title": "完整作答",
          "text": "其两端被低电阻导线连接，电压接近零，流经灯丝的电流很小。"
        }
      ],
      "answer": "其两端被低电阻导线连接，电压接近零，流经灯丝的电流很小。"
    }
  },
  {
    "id": "phy-series-parallel-connect",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十五章 电流和电路",
    "section": "15.3",
    "title": "连接串联与并联电路并观察开关作用",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "根据开关作用辨认串、并联结构。",
    "apparatus": [
      "两只小灯泡",
      "电池组",
      "三只开关",
      "导线"
    ],
    "steps": [
      "断电连接串联电路并改变开关位置。",
      "连接并联电路，在干路和支路分别放开关。",
      "逐个操作开关并记录亮灯状态。"
    ],
    "observations": [
      "串联开关控制所有灯泡；并联支路开关只控制相应支路。"
    ],
    "conclusion": "串联只有一条电流路径；并联各支路可独立工作。",
    "examPoints": [
      "电路连接方式由节点关系决定，不由画法决定"
    ],
    "pitfalls": [
      "不要把导线交叉一律看作连接点"
    ],
    "questions": [
      {
        "q": "并联电路的干路开关有什么作用？",
        "a": "它控制干路通断，因此控制全部支路是否接入电源。"
      }
    ],
    "safety": [
      "断开开关后接线，确认无短路后再通电。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "series",
      "variant": "topology"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "scenario",
        "label": "连接方式",
        "options": [
          {
            "value": "series",
            "label": "串联"
          },
          {
            "value": "parallel",
            "label": "并联"
          }
        ],
        "value": "series"
      },
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      },
      {
        "key": "resistance2",
        "label": "电阻 R2",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "并联电路的干路开关有什么作用？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "根据开关作用辨认串、并联结构。"
        },
        {
          "title": "选择实验证据",
          "text": "串联开关控制所有灯泡；并联支路开关只控制相应支路。"
        },
        {
          "title": "建立解释",
          "text": "串联只有一条电流路径；并联各支路可独立工作。"
        },
        {
          "title": "完整作答",
          "text": "它控制干路通断，因此控制全部支路是否接入电源。"
        }
      ],
      "answer": "它控制干路通断，因此控制全部支路是否接入电源。"
    }
  },
  {
    "id": "phy-ammeter",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十五章 电流和电路",
    "section": "15.4",
    "title": "用电流表测量电流",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "掌握电流表串联、极性、量程和读数。",
    "apparatus": [
      "电流表",
      "低压电源",
      "灯泡",
      "开关"
    ],
    "steps": [
      "估计电流并选量程。",
      "把电流表串联接入待测支路。",
      "正进负出，通电后按量程读数。"
    ],
    "observations": [
      "换量程后同一电流对应的指针位置改变。"
    ],
    "conclusion": "电流表要与被测支路串联，读数等于每小格电流乘格数。",
    "examPoints": [
      "分度值由所接量程决定",
      "不确定时先用大量程"
    ],
    "pitfalls": [
      "禁止电流表直接接电源两端"
    ],
    "questions": [
      {
        "q": "0～0.6 A量程分30小格，指针在18格处，电流多少？",
        "a": "电流为0.36 A。"
      }
    ],
    "safety": [
      "不得将电流表直接并联在电源两端。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "ammeter",
      "variant": "ammeter"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      },
      {
        "key": "resistance2",
        "label": "电阻 R2",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "量程0～0.6 A，30小格，指针18格。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "量程0～0.6 A，30小格，指针18格。"
        },
        {
          "title": "选用关系",
          "text": "分度值=量程跨度/小格数。"
        },
        {
          "title": "代入与求解",
          "text": "每格0.6/30=0.02 A；I=18×0.02=0.36 A。"
        },
        {
          "title": "解释结果",
          "text": "电流为0.36 A。"
        }
      ],
      "answer": "电流为0.36 A。"
    }
  },
  {
    "id": "phy-series-current",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十五章 电流和电路",
    "section": "15.5",
    "title": "探究串联电路各处电流",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "比较同一串联电路三个位置的电流。",
    "apparatus": [
      "两只不同规格灯泡",
      "电流表",
      "电源",
      "开关"
    ],
    "steps": [
      "在不同位置依次串联电流表。",
      "记录同一电路中三个位置的读数。",
      "更换灯泡或电源条件重复测量。"
    ],
    "observations": [
      "同一组实验各位置电流在误差范围内相等。"
    ],
    "conclusion": "串联电路中各处电流相等。",
    "examPoints": [
      "换器材多测是检验普遍性",
      "不要混合不同电路状态的数据"
    ],
    "pitfalls": [
      "亮度不同不能推出串联电流不同"
    ],
    "questions": [
      {
        "q": "串联两灯亮度不同，电流是否不同？",
        "a": "电流相同；亮度差异与两灯实际功率、灯丝特性等有关。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "series",
      "variant": "series-current"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      },
      {
        "key": "resistance2",
        "label": "电阻 R2",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "串联两灯亮度不同，电流是否不同？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "比较同一串联电路三个位置的电流。"
        },
        {
          "title": "选择实验证据",
          "text": "同一组实验各位置电流在误差范围内相等。"
        },
        {
          "title": "建立解释",
          "text": "串联电路中各处电流相等。"
        },
        {
          "title": "完整作答",
          "text": "电流相同；亮度差异与两灯实际功率、灯丝特性等有关。"
        }
      ],
      "answer": "电流相同；亮度差异与两灯实际功率、灯丝特性等有关。"
    }
  },
  {
    "id": "phy-parallel-current",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十五章 电流和电路",
    "section": "15.5",
    "title": "探究并联干路与支路电流",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "检验并联电路的电流分配关系。",
    "apparatus": [
      "两支路灯泡",
      "电流表",
      "电源",
      "开关"
    ],
    "steps": [
      "分别测量干路和两支路电流。",
      "将支路电流相加并与干路比较。",
      "更换支路阻值再测。"
    ],
    "observations": [
      "干路电流近似等于两支路电流之和。"
    ],
    "conclusion": "并联电路干路电流等于各支路电流之和。",
    "examPoints": [
      "支路电流通常不相等",
      "测量位置不能接错"
    ],
    "pitfalls": [
      "只使用相同灯泡容易误以为支路电流总相等"
    ],
    "questions": [
      {
        "q": "干路0.50 A，一支路0.18 A，另一支路多大？",
        "a": "另一支路为0.32 A。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "parallel",
      "variant": "parallel-current"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      },
      {
        "key": "resistance2",
        "label": "电阻 R2",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "I总=0.50 A，I₁=0.18 A。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "I总=0.50 A，I₁=0.18 A。"
        },
        {
          "title": "选用关系",
          "text": "I总=I₁+I₂。"
        },
        {
          "title": "代入与求解",
          "text": "I₂=0.50−0.18=0.32 A。"
        },
        {
          "title": "解释结果",
          "text": "另一支路电流0.32 A。"
        }
      ],
      "answer": "另一支路电流0.32 A。"
    }
  },
  {
    "id": "phy-voltmeter",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十六章 电压 电阻",
    "section": "16.1",
    "title": "用电压表测量电压",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "正确选择量程并测量元件两端电压。",
    "apparatus": [
      "电压表",
      "灯泡",
      "电源",
      "开关"
    ],
    "steps": [
      "先判断被测的两个节点。",
      "将电压表并联接入并检查正负极。",
      "按所接量程确定分度值并读数。"
    ],
    "observations": [
      "电压表跨接不同节点可读出不同电压。"
    ],
    "conclusion": "电压描述两个位置之间的电势差，电压表要并联在被测对象两端。",
    "examPoints": [
      "电压表不能代替导线串联维持用电器工作"
    ],
    "pitfalls": [
      "不得脱离接线端子直接读表盘数字"
    ],
    "questions": [
      {
        "q": "0～3 V量程分30格，指针24格处，电压是多少？",
        "a": "电压为2.4 V。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "voltmeter",
      "variant": "voltmeter"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      },
      {
        "key": "resistance2",
        "label": "电阻 R2",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "量程0～3 V，30格，指针24格。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "量程0～3 V，30格，指针24格。"
        },
        {
          "title": "选用关系",
          "text": "分度值=3 V/30。"
        },
        {
          "title": "代入与求解",
          "text": "U=24×0.1=2.4 V。"
        },
        {
          "title": "解释结果",
          "text": "被测两端电压2.4 V。"
        }
      ],
      "answer": "被测两端电压2.4 V。"
    }
  },
  {
    "id": "phy-series-voltage",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十六章 电压 电阻",
    "section": "16.2",
    "title": "探究串联电路的电压分配",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "比较各用电器电压之和与电源电压。",
    "apparatus": [
      "两只不同灯泡",
      "电压表",
      "电源",
      "开关"
    ],
    "steps": [
      "画出两灯串联电路的节点。",
      "分别测量两灯两端和电源两端电压。",
      "改变元件后重复比较。"
    ],
    "observations": [
      "各部分电压之和与总电压近似相等。"
    ],
    "conclusion": "串联电路总电压等于各部分电压之和。",
    "examPoints": [
      "不必相等的是各用电器的分电压"
    ],
    "pitfalls": [
      "不能只用两个相同灯泡便概括分压总相等"
    ],
    "questions": [
      {
        "q": "总电压6 V，一部分2 V，另一部分多少？",
        "a": "另一部分电压为4 V。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "series",
      "variant": "series-voltage"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      },
      {
        "key": "resistance2",
        "label": "电阻 R2",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "U=6 V，U₁=2 V。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "U=6 V，U₁=2 V。"
        },
        {
          "title": "选用关系",
          "text": "U=U₁+U₂。"
        },
        {
          "title": "代入与求解",
          "text": "U₂=6−2=4 V。"
        },
        {
          "title": "解释结果",
          "text": "另一部分两端电压4 V。"
        }
      ],
      "answer": "另一部分两端电压4 V。"
    }
  },
  {
    "id": "phy-battery-pack",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十六章 电压 电阻",
    "section": "16.2",
    "title": "测量串联电池组的电压",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "比较单节电池电压与串联总电压。",
    "apparatus": [
      "相同电池",
      "电池盒",
      "电压表"
    ],
    "steps": [
      "逐节测量电池电压。",
      "按首尾连接组成串联电池组。",
      "测量整组两端电压并与单节之和比较。"
    ],
    "observations": [
      "同向串联电池组总电压约为各节电压之和。"
    ],
    "conclusion": "电池串联可以提高电压；方向必须按电路关系考虑。",
    "examPoints": [
      "标称电压和实测端电压可能不同"
    ],
    "pitfalls": [
      "不可把不同种类、容量或新旧电池随意混用"
    ],
    "questions": [
      {
        "q": "两节实测1.48 V电池同向串联，空载总电压约多少？",
        "a": "约2.96 V。"
      }
    ],
    "safety": [
      "使用电池盒，避免反接、短路与混用电池。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "battery",
      "variant": "battery"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "cells",
        "label": "电池节数",
        "unit": "",
        "min": 1,
        "max": 8,
        "step": 1,
        "value": 2
      },
      {
        "key": "cellVoltage",
        "label": "单节电压",
        "unit": "V",
        "min": 0.5,
        "max": 3,
        "step": 0.5,
        "value": 1.5
      },
      {
        "key": "orientation",
        "label": "电源方向",
        "options": [
          {
            "value": "forward",
            "label": "正向"
          },
          {
            "value": "reverse",
            "label": "反向"
          }
        ],
        "value": "forward"
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "两节电池分别1.48 V，同向串联。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "两节电池分别1.48 V，同向串联。"
        },
        {
          "title": "选用关系",
          "text": "同向串联的电动势近似相加。"
        },
        {
          "title": "代入与求解",
          "text": "U≈1.48+1.48=2.96 V。"
        },
        {
          "title": "解释结果",
          "text": "空载电压约2.96 V。"
        }
      ],
      "answer": "空载电压约2.96 V。"
    }
  },
  {
    "id": "phy-parallel-voltage",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十六章 电压 电阻",
    "section": "16.2",
    "title": "探究并联各支路电压",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "测量接在相同节点间的支路电压。",
    "apparatus": [
      "两个并联灯泡",
      "电压表",
      "电源"
    ],
    "steps": [
      "辨认两个公共节点。",
      "依次测量各支路和电源两端电压。",
      "换成不同灯泡重复测量。"
    ],
    "observations": [
      "各支路电压与电源电压近似相同。"
    ],
    "conclusion": "并联各支路两端电压相等。",
    "examPoints": [
      "共同节点决定相同电压，而非灯泡相同"
    ],
    "pitfalls": [
      "不要把串联分压关系套到并联电路"
    ],
    "questions": [
      {
        "q": "并联一支路3 V，另一支路电压是多少？",
        "a": "若两支路直接接在同一对节点上，另一支路也是3 V。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "parallel",
      "variant": "parallel-voltage"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      },
      {
        "key": "resistance2",
        "label": "电阻 R2",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "并联一支路3 V，另一支路电压是多少？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "测量接在相同节点间的支路电压。"
        },
        {
          "title": "选择实验证据",
          "text": "各支路电压与电源电压近似相同。"
        },
        {
          "title": "建立解释",
          "text": "并联各支路两端电压相等。"
        },
        {
          "title": "完整作答",
          "text": "若两支路直接接在同一对节点上，另一支路也是3 V。"
        }
      ],
      "answer": "若两支路直接接在同一对节点上，另一支路也是3 V。"
    }
  },
  {
    "id": "phy-resistance-comparison",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十六章 电压 电阻",
    "section": "16.3",
    "title": "铁丝与铅笔芯对电流的影响",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "通过同一电路中的电流变化认识电阻。",
    "apparatus": [
      "低压电源",
      "电流表",
      "小灯泡",
      "铁丝",
      "铅笔芯"
    ],
    "steps": [
      "接入铁丝记录电流。",
      "保持电源和其他元件不变，更换铅笔芯。",
      "比较电流变化。"
    ],
    "observations": [
      "更换导体后电流可能明显变化。"
    ],
    "conclusion": "导体对电流有阻碍作用，不同导体的电阻可以不同。",
    "examPoints": [
      "电阻是导体自身的性质",
      "此活动只比较完整导体，不能隔离材料因素"
    ],
    "pitfalls": [
      "铁丝与铅笔芯形状不同，不能把全部差异只归因材料"
    ],
    "questions": [
      {
        "q": "为什么这一比较不能单独证明材料决定电阻？",
        "a": "因为两种导体的长度与横截面积也可能不同，尚未控制这些因素。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "material",
      "variant": "resistance-material"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "material",
        "label": "材料",
        "options": [
          {
            "value": "copper",
            "label": "铜"
          },
          {
            "value": "aluminum",
            "label": "铝"
          },
          {
            "value": "iron",
            "label": "铁"
          },
          {
            "value": "nichrome",
            "label": "镍铬合金"
          }
        ],
        "value": "nichrome"
      },
      {
        "key": "length",
        "label": "导体长度",
        "unit": "m",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "area",
        "label": "横截面积",
        "unit": "mm²",
        "min": 0.01,
        "max": 2,
        "step": 0.01,
        "value": 0.1
      },
      {
        "key": "temperature",
        "label": "导体温度",
        "unit": "℃",
        "min": 0,
        "max": 200,
        "step": 5,
        "value": 20
      },
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么这一比较不能单独证明材料决定电阻？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "通过同一电路中的电流变化认识电阻。"
        },
        {
          "title": "选择实验证据",
          "text": "更换导体后电流可能明显变化。"
        },
        {
          "title": "建立解释",
          "text": "导体对电流有阻碍作用，不同导体的电阻可以不同。"
        },
        {
          "title": "完整作答",
          "text": "因为两种导体的长度与横截面积也可能不同，尚未控制这些因素。"
        }
      ],
      "answer": "因为两种导体的长度与横截面积也可能不同，尚未控制这些因素。"
    }
  },
  {
    "id": "phy-resistance-factors",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十六章 电压 电阻",
    "section": "16.3",
    "title": "探究导体电阻与长度、粗细、材料的关系",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "运用控制变量方法比较电阻。",
    "apparatus": [
      "不同长度与粗细的电阻丝",
      "电流表",
      "同一低压电源"
    ],
    "steps": [
      "同材料同粗细比较长度。",
      "同材料同长度比较横截面积。",
      "同长同粗比较材料，并用电流大小判断电阻。"
    ],
    "observations": [
      "相同材料和横截面积时，较长导线电阻较大；相同材料和长度时，较粗导线电阻较小。"
    ],
    "conclusion": "导体电阻与材料、长度、横截面积和温度等有关。",
    "examPoints": [
      "用电流作间接指示需保持所加电压不变",
      "一次改变一个因素"
    ],
    "pitfalls": [
      "不能把横截面积与直径当作同一个量"
    ],
    "questions": [
      {
        "q": "相同材料和粗细的导线长度加倍，电阻如何变化？",
        "a": "温度不变时，电阻加倍。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "material",
      "variant": "resistance-factors"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "material",
        "label": "材料",
        "options": [
          {
            "value": "copper",
            "label": "铜"
          },
          {
            "value": "aluminum",
            "label": "铝"
          },
          {
            "value": "iron",
            "label": "铁"
          },
          {
            "value": "nichrome",
            "label": "镍铬合金"
          }
        ],
        "value": "nichrome"
      },
      {
        "key": "length",
        "label": "导体长度",
        "unit": "m",
        "min": 0.1,
        "max": 5,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "area",
        "label": "横截面积",
        "unit": "mm²",
        "min": 0.01,
        "max": 2,
        "step": 0.01,
        "value": 0.1
      },
      {
        "key": "temperature",
        "label": "导体温度",
        "unit": "℃",
        "min": 0,
        "max": 200,
        "step": 5,
        "value": 20
      },
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "均匀导线原电阻5 Ω，材料、横截面积、温度不变，长度变为原来的2倍。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "均匀导线原电阻5 Ω，材料、横截面积、温度不变，长度变为原来的2倍。"
        },
        {
          "title": "选用关系",
          "text": "均匀导线R与长度成正比。"
        },
        {
          "title": "代入与求解",
          "text": "R新=2×5=10 Ω。"
        },
        {
          "title": "解释结果",
          "text": "新电阻10 Ω。"
        }
      ],
      "answer": "新电阻10 Ω。"
    }
  },
  {
    "id": "phy-rheostat",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十六章 电压 电阻",
    "section": "16.4",
    "title": "使用滑动变阻器改变灯泡亮度",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "根据有效电阻丝长度判断接法和滑片作用。",
    "apparatus": [
      "滑动变阻器",
      "小灯泡",
      "电流表",
      "低压电源",
      "开关"
    ],
    "steps": [
      "采用一上一下两个接线柱串联接入。",
      "合闸前滑到最大阻值位置。",
      "移动滑片并观察电流和灯泡亮度。"
    ],
    "observations": [
      "接入电阻丝越长，电路电流通常越小。"
    ],
    "conclusion": "滑动变阻器通过改变接入电路的电阻丝长度改变电阻。",
    "examPoints": [
      "上方两端接入通常近似零阻",
      "下方两端接入阻值不随滑片改变"
    ],
    "pitfalls": [
      "不能脱离实际接线判断左移增大还是减小"
    ],
    "questions": [
      {
        "q": "为什么闭合开关前常置最大阻值？",
        "a": "用于限制初始电流，保护电源、仪表和用电器。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "rheostat",
      "variant": "rheostat"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      },
      {
        "key": "resistance2",
        "label": "电阻 R2",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "slider",
        "label": "滑片位置",
        "unit": "%",
        "min": 0,
        "max": 100,
        "step": 1,
        "value": 50
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么闭合开关前常置最大阻值？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "根据有效电阻丝长度判断接法和滑片作用。"
        },
        {
          "title": "选择实验证据",
          "text": "接入电阻丝越长，电路电流通常越小。"
        },
        {
          "title": "建立解释",
          "text": "滑动变阻器通过改变接入电路的电阻丝长度改变电阻。"
        },
        {
          "title": "完整作答",
          "text": "用于限制初始电流，保护电源、仪表和用电器。"
        }
      ],
      "answer": "用于限制初始电流，保护电源、仪表和用电器。"
    }
  },
  {
    "id": "phy-dimmer-project",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十六章 电压 电阻",
    "section": "16.5",
    "title": "设计简易调光台灯",
    "kind": "拓展探究",
    "tags": [
      "拓展探究",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "依据电阻调节和器材额定值设计低压调光电路。",
    "apparatus": [
      "低压灯泡或LED",
      "匹配电源",
      "可变电阻",
      "开关",
      "灯罩模型"
    ],
    "steps": [
      "确定光源所需电压和电流。",
      "设计限流和调节电路。",
      "试调亮度，检查发热和操作便利性。"
    ],
    "observations": [
      "调节电阻可以改变电流和亮度，但电阻本身也消耗电能。"
    ],
    "conclusion": "可变电阻能调光，但设计必须兼顾额定参数与散热。",
    "examPoints": [
      "LED必须限流",
      "设计需说明电能流向"
    ],
    "pitfalls": [
      "不能把耗能电阻越大称为越节能"
    ],
    "questions": [
      {
        "q": "为何调光电阻也可能发热？",
        "a": "电流流过电阻会产生焦耳热，部分电能转化为内能。"
      }
    ],
    "safety": [
      "只设计安全低压台灯；不拆装家用市电灯具。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "rheostat",
      "variant": "dimmer"
    },
    "modelNote": "采用理想直流电源、导线与仪表；电阻默认为欧姆元件，灯丝和二极管按各自专门近似模型处理。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      },
      {
        "key": "resistance2",
        "label": "电阻 R2",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "slider",
        "label": "滑片位置",
        "unit": "%",
        "min": 0,
        "max": 100,
        "step": 1,
        "value": 50
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为何调光电阻也可能发热？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "依据电阻调节和器材额定值设计低压调光电路。"
        },
        {
          "title": "选择实验证据",
          "text": "调节电阻可以改变电流和亮度，但电阻本身也消耗电能。"
        },
        {
          "title": "建立解释",
          "text": "可变电阻能调光，但设计必须兼顾额定参数与散热。"
        },
        {
          "title": "完整作答",
          "text": "电流流过电阻会产生焦耳热，部分电能转化为内能。"
        }
      ],
      "answer": "电流流过电阻会产生焦耳热，部分电能转化为内能。"
    }
  },
  {
    "id": "phy-ohm-voltage",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十七章 欧姆定律",
    "section": "17.1",
    "title": "电阻一定时电流与电压的关系",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "固定电阻，测量多组电压与电流。",
    "apparatus": [
      "定值电阻",
      "电流表",
      "电压表",
      "可调电源或变阻器"
    ],
    "steps": [
      "连接电路并确认定值电阻。",
      "逐次改变电阻两端电压并测电流。",
      "以U为横轴、I为纵轴绘图。"
    ],
    "observations": [
      "在温度近似不变范围内，I—U图像近似过原点直线。"
    ],
    "conclusion": "电阻一定时，电流与导体两端电压成正比。",
    "examPoints": [
      "控制电阻不变",
      "图像斜率对应1/R"
    ],
    "pitfalls": [
      "灯丝升温会改变电阻，不宜直接代替定值电阻"
    ],
    "questions": [
      {
        "q": "10 Ω电阻两端电压由2 V变4 V，电流怎样变？",
        "a": "由0.20 A变为0.40 A。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "ohm",
      "variant": "ohm-voltage",
      "resistance": 10
    },
    "modelNote": "定值电阻固定10Ω，改变两端电压观察电流；保持电阻和温度不变。电压0表示没有外加电压，不能用于R=U/I的除法测量。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 24,
        "step": 0.5,
        "value": 6
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "R=10 Ω，U=4 V。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "R=10 Ω，U=4 V。"
        },
        {
          "title": "选用关系",
          "text": "I=U/R。"
        },
        {
          "title": "代入与求解",
          "text": "I=4/10=0.40 A。"
        },
        {
          "title": "解释结果",
          "text": "电流0.40 A，是2 V时的2倍。"
        }
      ],
      "answer": "电流0.40 A，是2 V时的2倍。"
    }
  },
  {
    "id": "phy-ohm-resistance",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十七章 欧姆定律",
    "section": "17.1",
    "title": "电压一定时电流与电阻的关系",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "更换定值电阻，同时维持其两端电压。",
    "apparatus": [
      "多只定值电阻",
      "滑动变阻器",
      "电流表",
      "电压表",
      "电源"
    ],
    "steps": [
      "选定每次保持相同的被测电压。",
      "更换电阻后重新调节变阻器。",
      "记录电流并比较I与R关系。"
    ],
    "observations": [
      "电压相同时，电阻越大，电流越小；IR保持近似不变。"
    ],
    "conclusion": "电压一定时，电流与电阻成反比。",
    "examPoints": [
      "测量的是定值电阻两端电压，不只是电源电压"
    ],
    "pitfalls": [
      "换电阻后不调节滑片，控制变量可能失败"
    ],
    "questions": [
      {
        "q": "为什么每次换电阻后都要看电压表？",
        "a": "更换电阻会改变串联分压，需重新调整使被测电阻两端电压保持原值。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "ohm",
      "variant": "ohm-resistance",
      "voltage": 3
    },
    "modelNote": "电压固定3V，改变电阻观察电流；实物实验换电阻后需调滑动变阻器以保持被测电阻两端电压相同。",
    "controls": [
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "保持U=3 V，先后接入5 Ω和10 Ω。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "保持U=3 V，先后接入5 Ω和10 Ω。"
        },
        {
          "title": "选用关系",
          "text": "I=U/R。"
        },
        {
          "title": "代入与求解",
          "text": "I₁=3/5=0.60 A；I₂=3/10=0.30 A。"
        },
        {
          "title": "解释结果",
          "text": "电阻加倍，电流减半。"
        }
      ],
      "answer": "电阻加倍，电流减半。"
    }
  },
  {
    "id": "phy-measure-resistance",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十七章 欧姆定律",
    "section": "17.3",
    "title": "伏安法测量定值电阻",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "由同一状态下的电压与电流计算电阻。",
    "apparatus": [
      "待测电阻",
      "电压表",
      "电流表",
      "变阻器",
      "电源"
    ],
    "steps": [
      "正确串接电流表、并接电压表。",
      "改变电压测量多组U和I。",
      "逐组计算R并比较结果。"
    ],
    "observations": [
      "各次计算的定值电阻阻值在误差范围内接近。"
    ],
    "conclusion": "用R=U/I可测得电阻；多次测量有助于减小随机误差。",
    "examPoints": [
      "U和I必须对应同一次状态",
      "定值电阻可求多次测得阻值的平均值"
    ],
    "pitfalls": [
      "不能把不同组U和I交叉相除"
    ],
    "questions": [
      {
        "q": "2.4 V时电流0.20 A，电阻是多少？",
        "a": "电阻为12 Ω。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "ohm",
      "variant": "measure-resistance"
    },
    "modelNote": "模拟理想伏安法：定值电阻电流由I=U/R产生，读U和I再求R=U/I。实际实验需多组读数并考虑电表内阻及接触误差。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0.5,
        "max": 6,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "U=2.4 V，I=0.20 A。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "U=2.4 V，I=0.20 A。"
        },
        {
          "title": "选用关系",
          "text": "R=U/I。"
        },
        {
          "title": "代入与求解",
          "text": "R=2.4/0.20=12 Ω。"
        },
        {
          "title": "解释结果",
          "text": "待测电阻12 Ω。"
        }
      ],
      "answer": "待测电阻12 Ω。"
    }
  },
  {
    "id": "phy-filament-resistance",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十七章 欧姆定律",
    "section": "17.3",
    "title": "比较小灯泡冷、热状态的电阻",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "认识灯丝电阻随温度改变。",
    "apparatus": [
      "小灯泡",
      "电压表",
      "电流表",
      "滑动变阻器",
      "低压电源"
    ],
    "steps": [
      "从低电压开始测量U和I。",
      "逐步增加至额定电压以内。",
      "每组计算U/I并比较亮度。"
    ],
    "observations": [
      "灯泡越亮，灯丝温度越高，计算出的电阻通常越大。"
    ],
    "conclusion": "灯丝电阻会随温度变化，小灯泡一般不是恒定电阻元件。",
    "examPoints": [
      "不可把不同温度的阻值平均当成唯一正确灯阻"
    ],
    "pitfalls": [
      "不要用额定功率推断所有电压下电阻不变"
    ],
    "questions": [
      {
        "q": "为何不能把各次小灯泡电阻简单平均作为其电阻？",
        "a": "各次温度不同，对应阻值本来就不同，平均会掩盖真实变化。"
      }
    ],
    "safety": [
      "不能长时间超过额定电压，以免损坏灯泡。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "filament",
      "variant": "filament"
    },
    "modelNote": "使用示意性灯丝热电阻模型，保留电压升高时电阻增大的趋势；不是厂家给定的精确伏安曲线，不把不同温度下阻值平均成固定电阻。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "ratedVoltage",
        "label": "灯泡额定电压",
        "unit": "V",
        "min": 1,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "ratedPower",
        "label": "灯泡额定功率",
        "unit": "W",
        "min": 0.1,
        "max": 10,
        "step": 0.1,
        "value": 1.5
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为何不能把各次小灯泡电阻简单平均作为其电阻？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "认识灯丝电阻随温度改变。"
        },
        {
          "title": "选择实验证据",
          "text": "灯泡越亮，灯丝温度越高，计算出的电阻通常越大。"
        },
        {
          "title": "建立解释",
          "text": "灯丝电阻会随温度变化，小灯泡一般不是恒定电阻元件。"
        },
        {
          "title": "完整作答",
          "text": "各次温度不同，对应阻值本来就不同，平均会掩盖真实变化。"
        }
      ],
      "answer": "各次温度不同，对应阻值本来就不同，平均会掩盖真实变化。"
    }
  },
  {
    "id": "phy-digital-multimeter",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十七章 欧姆定律",
    "section": "17.3",
    "title": "用数字多用表测量电阻",
    "kind": "拓展探究",
    "tags": [
      "拓展探究",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "学习在断电条件下直接测量电阻。",
    "apparatus": [
      "数字多用表",
      "断电电阻",
      "小灯泡"
    ],
    "steps": [
      "检查表笔插孔和电阻挡。",
      "使被测元件脱离带电电路。",
      "选择合适量程并读取单位。"
    ],
    "observations": [
      "低温灯丝阻值通常小于发光时的U/I。"
    ],
    "conclusion": "欧姆挡测量需要断电；显示单位和量程决定读数含义。",
    "examPoints": [
      "千欧与欧姆需换算",
      "表内电源参与欧姆挡测量"
    ],
    "pitfalls": [
      "不得用电阻挡测量通电电路"
    ],
    "questions": [
      {
        "q": "显示1.25 kΩ，写成欧姆是多少？",
        "a": "1.25 kΩ=1250 Ω。"
      }
    ],
    "safety": [
      "仅测断电并放电后的低压元件；不要使用未知档位接触市电。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "ohm",
      "variant": "multimeter",
      "voltage": 1
    },
    "modelNote": "以表内参考电源测得的理想电流推算电阻，画面为电阻挡示意；真实电阻测量须断电并隔离元件，不能对带电电路使用欧姆挡。",
    "controls": [
      {
        "key": "resistance",
        "label": "电阻 R1",
        "unit": "Ω",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "表盘显示1.25 kΩ。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "表盘显示1.25 kΩ。"
        },
        {
          "title": "选用关系",
          "text": "1 kΩ=1000 Ω。"
        },
        {
          "title": "代入与求解",
          "text": "R=1.25×1000=1250 Ω。"
        },
        {
          "title": "解释结果",
          "text": "电阻为1250 Ω。"
        }
      ],
      "answer": "电阻为1250 Ω。"
    }
  },
  {
    "id": "phy-lamp-power",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十八章 电功率",
    "section": "18.2",
    "title": "测量小灯泡电功率并比较亮度",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "用灯泡两端电压和通过电流确定实际功率。",
    "apparatus": [
      "额定2.5 V小灯泡",
      "电流表",
      "电压表",
      "变阻器",
      "电源"
    ],
    "steps": [
      "从低电压开始调节。",
      "测量额定及低于额定状态的U、I。",
      "计算P并与亮度比较。"
    ],
    "observations": [
      "实际功率较大时通常较亮；额定电压下对应额定功率。"
    ],
    "conclusion": "实际电功率P=UI，亮度主要反映灯泡的实际功率。",
    "examPoints": [
      "测额定功率需把电压调到额定值",
      "不同状态功率不能平均求额定值"
    ],
    "pitfalls": [
      "不能认为灯泡在任何电压下都以铭牌功率工作"
    ],
    "questions": [
      {
        "q": "灯泡2.5 V时电流0.30 A，额定功率多少？",
        "a": "额定功率0.75 W。"
      }
    ],
    "safety": [
      "模拟可比较过压；真实操作不长期超过额定电压。"
    ],
    "model": "circuit",
    "modelParams": {
      "scenario": "filament",
      "variant": "lamp-power"
    },
    "modelNote": "灯丝采用随电压变化的热电阻近似，仅额定点由标称参数确定；亮度按实际功率示意，不是实测灯丝温度或光通量。",
    "controls": [
      {
        "key": "voltage",
        "label": "电源电压",
        "unit": "V",
        "min": 0,
        "max": 6,
        "step": 0.1,
        "value": 3
      },
      {
        "key": "ratedVoltage",
        "label": "灯泡额定电压",
        "unit": "V",
        "min": 1,
        "max": 12,
        "step": 0.5,
        "value": 3
      },
      {
        "key": "ratedPower",
        "label": "灯泡额定功率",
        "unit": "W",
        "min": 0.1,
        "max": 10,
        "step": 0.1,
        "value": 1.5
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "U额=2.5 V，正常发光时I=0.30 A。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "U额=2.5 V，正常发光时I=0.30 A。"
        },
        {
          "title": "选用关系",
          "text": "P=UI。"
        },
        {
          "title": "代入与求解",
          "text": "P额=2.5×0.30=0.75 W。"
        },
        {
          "title": "解释结果",
          "text": "额定功率0.75 W。"
        }
      ],
      "answer": "额定功率0.75 W。"
    }
  },
  {
    "id": "phy-home-energy-audit",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十八章 电功率",
    "section": "18.3",
    "title": "为家庭节约用电提出方案",
    "kind": "拓展探究",
    "tags": [
      "拓展探究",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "用功率和使用时间估算电能并比较节电方案。",
    "apparatus": [
      "电器铭牌数据",
      "使用时间表",
      "电能表读数模型"
    ],
    "steps": [
      "统计电器功率和每日工作时间。",
      "换算千瓦与小时后计算耗电量。",
      "比较减少待机和缩短使用时间的方案。"
    ],
    "observations": [
      "高功率电器未必每日耗电最多，还要看工作时间。"
    ],
    "conclusion": "电能W=Pt，节电方案应结合功率、使用时长和实际需求。",
    "examPoints": [
      "kW·h是电能单位，kW是功率单位"
    ],
    "pitfalls": [
      "不要把能效等级与实际总耗电量混为一谈"
    ],
    "questions": [
      {
        "q": "20 W灯每天少开2 h，30天节约多少电？",
        "a": "节电1.2 kW·h。"
      }
    ],
    "safety": [
      "只读铭牌和安全显示屏，不拆开电器或配电箱。"
    ],
    "model": "household",
    "modelParams": {
      "scenario": "power",
      "variant": "energy-audit",
      "voltage": 220
    },
    "modelNote": "家庭用电仅在图示和低压模型中讨论；功率、电能和电流为理论估算，不模拟实际市电接线。",
    "controls": [
      {
        "key": "power",
        "label": "用电器总功率",
        "unit": "W",
        "min": 0,
        "max": 10000,
        "step": 100,
        "value": 2200
      },
      {
        "key": "time",
        "label": "使用时间",
        "unit": "h",
        "min": 0,
        "max": 24,
        "step": 0.5,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "P=20 W=0.020 kW，减少时间2×30=60 h。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "P=20 W=0.020 kW，减少时间2×30=60 h。"
        },
        {
          "title": "选用关系",
          "text": "W=Pt。"
        },
        {
          "title": "代入与求解",
          "text": "W=0.020×60=1.2 kW·h。"
        },
        {
          "title": "解释结果",
          "text": "一个月约节约1.2 kW·h。"
        }
      ],
      "answer": "一个月约节约1.2 kW·h。"
    }
  },
  {
    "id": "phy-joule-resistance",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十八章 电功率",
    "section": "18.4",
    "title": "比较电阻大小对电热的影响",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "控制电流与时间，比较不同电阻的发热。",
    "apparatus": [
      "两段不同电阻丝",
      "密闭空气盒",
      "U形管",
      "低压电源"
    ],
    "steps": [
      "把两段电阻丝串联以保持电流相同。",
      "通电相同时间。",
      "比较U形管液面差。"
    ],
    "observations": [
      "阻值较大的电阻丝使相应空气温升更明显。"
    ],
    "conclusion": "电流和通电时间相同时，产生的电热与电阻成正比。",
    "examPoints": [
      "串联用于控制电流相同",
      "液面差是温度变化的间接指示"
    ],
    "pitfalls": [
      "电热与电阻正比的前提是电流不变"
    ],
    "questions": [
      {
        "q": "0.5 A通过10 Ω电阻20 s，放热多少？",
        "a": "产生50 J热量。"
      }
    ],
    "safety": [
      "防止电阻丝过热；只用教师配置的限流装置。"
    ],
    "model": "joule",
    "modelParams": {
      "scenario": "resistance",
      "variant": "resistance",
      "resistance2": 20
    },
    "modelNote": "两容器电流和通电时间相同，第二电阻固定20Ω，比较Q=I²Rt；气柱或液面表示热量趋势，不是实际温升。",
    "controls": [
      {
        "key": "current",
        "label": "电流",
        "unit": "A",
        "min": 0,
        "max": 3,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "resistance",
        "label": "容器一电阻",
        "unit": "Ω",
        "min": 1,
        "max": 50,
        "step": 1,
        "value": 10
      },
      {
        "key": "time",
        "label": "通电时间",
        "unit": "s",
        "min": 0,
        "max": 300,
        "step": 5,
        "value": 60
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "I=0.5 A，R=10 Ω，t=20 s。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "I=0.5 A，R=10 Ω，t=20 s。"
        },
        {
          "title": "选用关系",
          "text": "Q=I²Rt。"
        },
        {
          "title": "代入与求解",
          "text": "Q=0.5²×10×20=50 J。"
        },
        {
          "title": "解释结果",
          "text": "电阻产生50 J热量。"
        }
      ],
      "answer": "电阻产生50 J热量。"
    }
  },
  {
    "id": "phy-joule-current",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十八章 电功率",
    "section": "18.4",
    "title": "比较电流大小对电热的影响",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "保持电阻与时间相同，比较不同电流的发热。",
    "apparatus": [
      "相同电阻丝",
      "分流电阻",
      "U形管",
      "低压电源"
    ],
    "steps": [
      "用分流电路改变其中一段电阻丝的电流。",
      "保持两段电阻相同。",
      "通电相同时间后比较温升指示。"
    ],
    "observations": [
      "电流较大的电阻丝产生的电热更多。"
    ],
    "conclusion": "电阻和时间相同时，电热与电流的平方成正比。",
    "examPoints": [
      "平方关系：电流加倍、电热变为四倍"
    ],
    "pitfalls": [
      "不要误说电热与电流一次方成正比"
    ],
    "questions": [
      {
        "q": "电流从0.2 A增至0.4 A，其他条件相同，电热变成几倍？",
        "a": "电热变成4倍。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "joule",
    "modelParams": {
      "scenario": "current",
      "variant": "current",
      "current2": 0.5
    },
    "modelNote": "两容器电阻和时间相同，第二电流固定0.5A，比较焦耳热；原装置分流支路的详细电路不在此模型中求解。",
    "controls": [
      {
        "key": "current",
        "label": "容器一电流",
        "unit": "A",
        "min": 0,
        "max": 3,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "resistance",
        "label": "电阻",
        "unit": "Ω",
        "min": 1,
        "max": 50,
        "step": 1,
        "value": 10
      },
      {
        "key": "time",
        "label": "通电时间",
        "unit": "s",
        "min": 0,
        "max": 300,
        "step": 5,
        "value": 60
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "I₂/I₁=0.4/0.2=2，R、t不变。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "I₂/I₁=0.4/0.2=2，R、t不变。"
        },
        {
          "title": "选用关系",
          "text": "Q₂/Q₁=(I₂/I₁)²。"
        },
        {
          "title": "代入与求解",
          "text": "Q₂/Q₁=2²=4。"
        },
        {
          "title": "解释结果",
          "text": "电热变为原来的4倍。"
        }
      ],
      "answer": "电热变为原来的4倍。"
    }
  },
  {
    "id": "phy-fuse-comparison",
    "subject": "physics",
    "term": "9下",
    "chapter": "第十九章 生活用电",
    "section": "19.2",
    "title": "比较保险丝与铜丝的过流表现",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "理解过流保护器件的作用与材料要求。",
    "apparatus": [
      "保险丝模型",
      "铜丝模型",
      "限流电路",
      "电流读数"
    ],
    "steps": [
      "在模拟中缓慢增大电流。",
      "比较不同材料的发热和熔断状态。",
      "说明熔断对电路的作用。"
    ],
    "observations": [
      "合适的保险丝在过流后熔断，切断电路。"
    ],
    "conclusion": "保险丝利用电流热效应保护电路，不能用普通铜丝替代。",
    "examPoints": [
      "过流可能来自总功率过大或短路",
      "保护装置应与线路匹配"
    ],
    "pitfalls": [
      "不是保险丝越粗越好"
    ],
    "questions": [
      {
        "q": "用铜丝代替保险丝为什么危险？",
        "a": "铜丝可能在危险电流下仍不断开，使导线或电器持续过热。"
      }
    ],
    "safety": [
      "仅仿真；不能在家制造过流，不得改装保险装置。"
    ],
    "model": "household",
    "modelParams": {
      "scenario": "overload",
      "variant": "fuse"
    },
    "modelNote": "根据总功率、电压和设定额定电流判断过流；未计算保险丝和铜丝的熔点、直径与散热，不把阈值判断当作真实熔断时间预测。",
    "controls": [
      {
        "key": "power",
        "label": "用电器总功率",
        "unit": "W",
        "min": 0,
        "max": 10000,
        "step": 100,
        "value": 2200
      },
      {
        "key": "voltage",
        "label": "家庭电压",
        "unit": "V",
        "min": 110,
        "max": 240,
        "step": 10,
        "value": 220
      },
      {
        "key": "limit",
        "label": "额定电流",
        "unit": "A",
        "min": 5,
        "max": 40,
        "step": 1,
        "value": 10
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "用铜丝代替保险丝为什么危险？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "理解过流保护器件的作用与材料要求。"
        },
        {
          "title": "选择实验证据",
          "text": "合适的保险丝在过流后熔断，切断电路。"
        },
        {
          "title": "建立解释",
          "text": "保险丝利用电流热效应保护电路，不能用普通铜丝替代。"
        },
        {
          "title": "完整作答",
          "text": "铜丝可能在危险电流下仍不断开，使导线或电器持续过热。"
        }
      ],
      "answer": "铜丝可能在危险电流下仍不断开，使导线或电器持续过热。"
    }
  },
  {
    "id": "phy-home-circuit-design",
    "subject": "physics",
    "term": "9下",
    "chapter": "第十九章 生活用电",
    "section": "19.3",
    "title": "设计家庭电路的分支与保护",
    "kind": "拓展探究",
    "tags": [
      "拓展探究",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "用安全低压模型设计用电器并联、开关串联控制的家庭电路结构。",
    "apparatus": [
      "安全低压电源",
      "小灯泡与开关",
      "绝缘导线",
      "家庭电路图示"
    ],
    "steps": [
      "先在纸面规划并联支路与各支路开关。",
      "用安全低压电源与小灯泡模拟家庭结构，断电检查后再闭合。",
      "观察一条支路断开时其余支路是否仍能工作。",
      "以图示辨认保护接地、漏电保护与市电火线位置，不实际连接市电。"
    ],
    "observations": [
      "同一电源下总功率增大时，总电流增加。"
    ],
    "conclusion": "家庭用电器通常并联；保护器件、导线与负荷需匹配。",
    "examPoints": [
      "开关接在相线与用电器之间",
      "保护地线不同于中性线"
    ],
    "pitfalls": [
      "设计示意图不等于具备实际施工资格"
    ],
    "questions": [
      {
        "q": "总功率2200 W、供电220 V，工作电流约多少？",
        "a": "电流约10 A，实际器件选型还需由专业人员核定。"
      }
    ],
    "safety": [
      "只用安全低压教学电源；不得连接插座或家用市电。"
    ],
    "model": "household",
    "modelParams": {
      "scenario": "design",
      "variant": "design"
    },
    "modelNote": "只搭建安全低压供电的并联电路，用理想电阻负载表示小灯泡；可独立操作两支路开关。220V例题仅作理论估算，不指导连接市电。",
    "controls": [
      {
        "key": "voltage",
        "label": "安全低压模型电压",
        "unit": "V",
        "min": 3,
        "max": 12,
        "step": 1,
        "value": 6
      },
      {
        "key": "resistance1",
        "label": "支路一负载电阻",
        "unit": "Ω",
        "min": 5,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "resistance2",
        "label": "支路二负载电阻",
        "unit": "Ω",
        "min": 5,
        "max": 100,
        "step": 1,
        "value": 30
      },
      {
        "key": "switch1",
        "label": "支路一开关",
        "options": [
          {
            "value": 1,
            "label": "闭合"
          },
          {
            "value": 0,
            "label": "断开"
          }
        ],
        "value": 1
      },
      {
        "key": "switch2",
        "label": "支路二开关",
        "options": [
          {
            "value": 1,
            "label": "闭合"
          },
          {
            "value": 0,
            "label": "断开"
          }
        ],
        "value": 1
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "总功率2200 W，电压220 V，按纯电阻近似。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "总功率2200 W，电压220 V，按纯电阻近似。"
        },
        {
          "title": "选用关系",
          "text": "I=P/U。"
        },
        {
          "title": "代入与求解",
          "text": "I=2200/220=10 A。"
        },
        {
          "title": "解释结果",
          "text": "工作电流约10 A；不能只凭这一计算自行选线施工。"
        }
      ],
      "answer": "工作电流约10 A；不能只凭这一计算自行选线施工。"
    }
  },
  {
    "id": "phy-magnetic-poles",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.1",
    "title": "观察磁体吸铁与磁极相互作用",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "比较磁极与非磁极处的吸引，并判断两极作用。",
    "apparatus": [
      "条形磁体",
      "小磁针",
      "铁屑模型"
    ],
    "steps": [
      "比较磁体不同位置的吸引效果。",
      "让两个N极相对，再让N、S相对。",
      "观察吸引或排斥。"
    ],
    "observations": [
      "磁极附近磁作用较强；同名磁极排斥、异名吸引。"
    ],
    "conclusion": "磁体有两个磁极，磁极间存在相互作用。",
    "examPoints": [
      "磁体不是吸引所有金属",
      "磁极不可只凭吸引铁判断南北"
    ],
    "pitfalls": [
      "不要将吸引铁屑误称为异名磁极吸引"
    ],
    "questions": [
      {
        "q": "磁铁能否吸引所有金属？",
        "a": "不能。铁、钴、镍等及某些合金容易被吸引，铜铝通常不会明显被普通磁体吸引。"
      }
    ],
    "safety": [
      "强磁体远离医疗植入设备和磁性存储器；防止夹手。"
    ],
    "model": "magnet",
    "modelParams": {
      "scenario": "poles",
      "variant": "poles"
    },
    "modelNote": "磁场线和相对场强用于表示方向及变化趋势，不能当作实测磁感应强度或吸力。",
    "controls": [
      {
        "key": "pole1",
        "label": "磁体一朝向",
        "options": [
          {
            "value": "N",
            "label": "N极"
          },
          {
            "value": "S",
            "label": "S极"
          }
        ],
        "value": "N"
      },
      {
        "key": "pole2",
        "label": "磁体二朝向",
        "options": [
          {
            "value": "N",
            "label": "N极"
          },
          {
            "value": "S",
            "label": "S极"
          }
        ],
        "value": "S"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "磁铁能否吸引所有金属？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "比较磁极与非磁极处的吸引，并判断两极作用。"
        },
        {
          "title": "选择实验证据",
          "text": "磁极附近磁作用较强；同名磁极排斥、异名吸引。"
        },
        {
          "title": "建立解释",
          "text": "磁体有两个磁极，磁极间存在相互作用。"
        },
        {
          "title": "完整作答",
          "text": "不能。铁、钴、镍等及某些合金容易被吸引，铜铝通常不会明显被普通磁体吸引。"
        }
      ],
      "answer": "不能。铁、钴、镍等及某些合金容易被吸引，铜铝通常不会明显被普通磁体吸引。"
    }
  },
  {
    "id": "phy-compass-field",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.1",
    "title": "用小磁针判断某点磁场方向",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "把静止小磁针N极指向作为磁场方向。",
    "apparatus": [
      "条形磁体",
      "多个小磁针"
    ],
    "steps": [
      "选定磁体附近一个位置。",
      "先后放入不同小磁针。",
      "记录其静止N极指向。"
    ],
    "observations": [
      "同一点处不同小磁针的N极指向一致。"
    ],
    "conclusion": "某点磁场方向规定为小磁针静止时N极所指方向。",
    "examPoints": [
      "磁针受到磁场作用，磁场并非只有放入磁针才存在"
    ],
    "pitfalls": [
      "不能把S极指向当作规定方向"
    ],
    "questions": [
      {
        "q": "换一枚小磁针，某点的磁场方向是否改变？",
        "a": "在小磁针不明显扰动原磁场的近似下，不改变。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "magnet",
    "modelParams": {
      "scenario": "compass",
      "variant": "compass"
    },
    "modelNote": "磁场线和相对场强用于表示方向及变化趋势，不能当作实测磁感应强度或吸力。",
    "controls": [
      {
        "key": "pole",
        "label": "所观察磁极",
        "options": [
          {
            "value": "N",
            "label": "N极"
          },
          {
            "value": "S",
            "label": "S极"
          }
        ],
        "value": "N"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "换一枚小磁针，某点的磁场方向是否改变？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "把静止小磁针N极指向作为磁场方向。"
        },
        {
          "title": "选择实验证据",
          "text": "同一点处不同小磁针的N极指向一致。"
        },
        {
          "title": "建立解释",
          "text": "某点磁场方向规定为小磁针静止时N极所指方向。"
        },
        {
          "title": "完整作答",
          "text": "在小磁针不明显扰动原磁场的近似下，不改变。"
        }
      ],
      "answer": "在小磁针不明显扰动原磁场的近似下，不改变。"
    }
  },
  {
    "id": "phy-magnetic-field-map",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.1",
    "title": "用磁针与铁屑描绘磁场分布",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "将分散位置的方向信息连成磁场分布图。",
    "apparatus": [
      "条形与蹄形磁体",
      "透明板",
      "铁屑",
      "小磁针"
    ],
    "steps": [
      "在磁体周围不同位置放磁针并标记N极方向。",
      "轻撒铁屑并轻敲透明板。",
      "对比两种磁体的分布。"
    ],
    "observations": [
      "铁屑排列呈曲线状，不同位置磁针方向不同。"
    ],
    "conclusion": "磁感线是描述磁场的模型，磁体外部方向从N极指向S极。",
    "examPoints": [
      "磁感线并非真实存在的线",
      "线密反映相对强弱"
    ],
    "pitfalls": [
      "铁屑只显示形状，方向还要靠磁针判断"
    ],
    "questions": [
      {
        "q": "为什么不能只靠铁屑判断磁场方向？",
        "a": "铁屑排列显示分布形态，却不标明N到S的箭头方向。"
      }
    ],
    "safety": [
      "铁屑不直接用手揉搓，避免进入眼睛。"
    ],
    "model": "magnet",
    "modelParams": {
      "scenario": "field",
      "variant": "field-map"
    },
    "modelNote": "磁场线和相对场强用于表示方向及变化趋势，不能当作实测磁感应强度或吸力。",
    "controls": [
      {
        "key": "pole",
        "label": "所观察磁极",
        "options": [
          {
            "value": "N",
            "label": "N极"
          },
          {
            "value": "S",
            "label": "S极"
          }
        ],
        "value": "N"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么不能只靠铁屑判断磁场方向？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "将分散位置的方向信息连成磁场分布图。"
        },
        {
          "title": "选择实验证据",
          "text": "铁屑排列呈曲线状，不同位置磁针方向不同。"
        },
        {
          "title": "建立解释",
          "text": "磁感线是描述磁场的模型，磁体外部方向从N极指向S极。"
        },
        {
          "title": "完整作答",
          "text": "铁屑排列显示分布形态，却不标明N到S的箭头方向。"
        }
      ],
      "answer": "铁屑排列显示分布形态，却不标明N到S的箭头方向。"
    }
  },
  {
    "id": "phy-oersted",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.2",
    "title": "奥斯特实验：通电导线使磁针偏转",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "通过通断电和换向建立电流与磁场的联系。",
    "apparatus": [
      "小磁针",
      "直导线",
      "低压电源",
      "开关"
    ],
    "steps": [
      "让直导线平行放在小磁针上方。",
      "短时通电观察偏转。",
      "断电后调换电源方向再观察。"
    ],
    "observations": [
      "通电时磁针偏转；电流反向后偏转方向改变。"
    ],
    "conclusion": "电流周围存在磁场，磁场方向与电流方向有关。",
    "examPoints": [
      "导线位置和方向影响观察效果",
      "通断电形成对照"
    ],
    "pitfalls": [
      "不要把磁针偏转解释为导线的机械碰撞"
    ],
    "questions": [
      {
        "q": "反向通电的实验说明什么？",
        "a": "说明通电导线产生的磁场方向随电流方向改变。"
      }
    ],
    "safety": [
      "实际实验需要限流并短时通电，不能直接短接干电池。"
    ],
    "model": "magnet",
    "modelParams": {
      "scenario": "oersted",
      "variant": "oersted"
    },
    "modelNote": "磁场线和相对场强用于表示方向及变化趋势，不能当作实测磁感应强度或吸力。",
    "controls": [
      {
        "key": "current",
        "label": "电流",
        "unit": "A",
        "min": -3,
        "max": 3,
        "step": 0.1,
        "value": 1
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "反向通电的实验说明什么？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "通过通断电和换向建立电流与磁场的联系。"
        },
        {
          "title": "选择实验证据",
          "text": "通电时磁针偏转；电流反向后偏转方向改变。"
        },
        {
          "title": "建立解释",
          "text": "电流周围存在磁场，磁场方向与电流方向有关。"
        },
        {
          "title": "完整作答",
          "text": "说明通电导线产生的磁场方向随电流方向改变。"
        }
      ],
      "answer": "说明通电导线产生的磁场方向随电流方向改变。"
    }
  },
  {
    "id": "phy-solenoid-field",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.2",
    "title": "探究通电螺线管外部磁场方向",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "通过小磁针判断螺线管磁极与电流方向关系。",
    "apparatus": [
      "螺线管",
      "小磁针",
      "低压电源",
      "开关"
    ],
    "steps": [
      "记录绕线方向和电流方向。",
      "在螺线管周围多点放置磁针。",
      "反向通电后重新记录。"
    ],
    "observations": [
      "外部磁场形状类似条形磁体；反向通电后两极交换。"
    ],
    "conclusion": "用安培定则可判断通电螺线管的N极。",
    "examPoints": [
      "四指弯向是电流绕向，大拇指指N极"
    ],
    "pitfalls": [
      "不要把电子移动方向当作电流方向"
    ],
    "questions": [
      {
        "q": "只改变电流方向，螺线管磁极怎样变化？",
        "a": "N、S极交换。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "magnet",
    "modelParams": {
      "scenario": "solenoid",
      "variant": "solenoid"
    },
    "modelNote": "磁场线和相对场强用于表示方向及变化趋势，不能当作实测磁感应强度或吸力。",
    "controls": [
      {
        "key": "current",
        "label": "电流",
        "unit": "A",
        "min": -3,
        "max": 3,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "turns",
        "label": "线圈匝数",
        "unit": "",
        "min": 10,
        "max": 300,
        "step": 10,
        "value": 100
      },
      {
        "key": "core",
        "label": "铁芯",
        "options": [
          {
            "value": "air",
            "label": "无铁芯"
          },
          {
            "value": "iron",
            "label": "有铁芯"
          }
        ],
        "value": "iron"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "只改变电流方向，螺线管磁极怎样变化？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "通过小磁针判断螺线管磁极与电流方向关系。"
        },
        {
          "title": "选择实验证据",
          "text": "外部磁场形状类似条形磁体；反向通电后两极交换。"
        },
        {
          "title": "建立解释",
          "text": "用安培定则可判断通电螺线管的N极。"
        },
        {
          "title": "完整作答",
          "text": "N、S极交换。"
        }
      ],
      "answer": "N、S极交换。"
    }
  },
  {
    "id": "phy-electromagnet-crane",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.3",
    "title": "制作电磁起重机并比较磁性强弱",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "比较电流、匝数和铁芯对电磁铁的影响。",
    "apparatus": [
      "绕线铁钉模型",
      "低压电源",
      "变阻器",
      "曲别针"
    ],
    "steps": [
      "固定匝数，改变电流比较吸起能力。",
      "固定电流，改变线圈匝数。",
      "比较有铁芯与无铁芯的情形。"
    ],
    "observations": [
      "其他条件相同时，电流或匝数增大通常使磁性增强；铁芯可增强磁场。"
    ],
    "conclusion": "电磁铁的通断、强弱和极性均可控制。",
    "examPoints": [
      "改变匝数同时可能改变电流，需控制变量"
    ],
    "pitfalls": [
      "曲别针数量是相对指示，不是通用磁场单位"
    ],
    "questions": [
      {
        "q": "比较匝数影响时为何要保持电流相同？",
        "a": "否则磁性差异同时含电流和匝数两个因素，不能单独归因匝数。"
      }
    ],
    "safety": [
      "线圈会发热，使用绝缘导线和限流低压电源。"
    ],
    "model": "magnet",
    "modelParams": {
      "scenario": "electromagnet",
      "variant": "electromagnet"
    },
    "modelNote": "磁场线和相对场强用于表示方向及变化趋势，不能当作实测磁感应强度或吸力。",
    "controls": [
      {
        "key": "current",
        "label": "电流",
        "unit": "A",
        "min": -3,
        "max": 3,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "turns",
        "label": "线圈匝数",
        "unit": "",
        "min": 10,
        "max": 300,
        "step": 10,
        "value": 100
      },
      {
        "key": "core",
        "label": "铁芯",
        "options": [
          {
            "value": "air",
            "label": "无铁芯"
          },
          {
            "value": "iron",
            "label": "有铁芯"
          }
        ],
        "value": "iron"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "比较匝数影响时为何要保持电流相同？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "比较电流、匝数和铁芯对电磁铁的影响。"
        },
        {
          "title": "选择实验证据",
          "text": "其他条件相同时，电流或匝数增大通常使磁性增强；铁芯可增强磁场。"
        },
        {
          "title": "建立解释",
          "text": "电磁铁的通断、强弱和极性均可控制。"
        },
        {
          "title": "完整作答",
          "text": "否则磁性差异同时含电流和匝数两个因素，不能单独归因匝数。"
        }
      ],
      "answer": "否则磁性差异同时含电流和匝数两个因素，不能单独归因匝数。"
    }
  },
  {
    "id": "phy-electromagnetic-relay",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.3",
    "title": "观察电磁继电器的控制过程",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "区分控制电路和工作电路的作用。",
    "apparatus": [
      "继电器剖面模型",
      "低压控制电源",
      "灯泡负载模型"
    ],
    "steps": [
      "辨认线圈、衔铁、弹簧和触点。",
      "接通控制电路观察衔铁与触点。",
      "断开控制电路观察恢复。"
    ],
    "observations": [
      "线圈通电吸引衔铁，使触点改变工作电路通断。"
    ],
    "conclusion": "继电器利用电磁铁，以控制电路操纵另一工作电路。",
    "examPoints": [
      "两个电路功能不同，不能混画连接",
      "触点状态需依据图判断"
    ],
    "pitfalls": [
      "不要认为控制电流必然流过工作负载"
    ],
    "questions": [
      {
        "q": "控制线圈断电后触点为什么恢复？",
        "a": "电磁吸引作用减弱，弹簧使衔铁返回原位。"
      }
    ],
    "safety": [
      "只用低压负载模型；不将真实家庭电器接入自制继电器。"
    ],
    "model": "magnet",
    "modelParams": {
      "scenario": "relay",
      "variant": "relay"
    },
    "modelNote": "磁场线和相对场强用于表示方向及变化趋势，不能当作实测磁感应强度或吸力。",
    "controls": [
      {
        "key": "current",
        "label": "电流",
        "unit": "A",
        "min": -3,
        "max": 3,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "turns",
        "label": "线圈匝数",
        "unit": "",
        "min": 10,
        "max": 300,
        "step": 10,
        "value": 100
      },
      {
        "key": "core",
        "label": "铁芯",
        "options": [
          {
            "value": "air",
            "label": "无铁芯"
          },
          {
            "value": "iron",
            "label": "有铁芯"
          }
        ],
        "value": "iron"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "控制线圈断电后触点为什么恢复？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "区分控制电路和工作电路的作用。"
        },
        {
          "title": "选择实验证据",
          "text": "线圈通电吸引衔铁，使触点改变工作电路通断。"
        },
        {
          "title": "建立解释",
          "text": "继电器利用电磁铁，以控制电路操纵另一工作电路。"
        },
        {
          "title": "完整作答",
          "text": "电磁吸引作用减弱，弹簧使衔铁返回原位。"
        }
      ],
      "answer": "电磁吸引作用减弱，弹簧使衔铁返回原位。"
    }
  },
  {
    "id": "phy-magnetic-force-wire",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.4",
    "title": "通电导体在磁场中受力",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "比较电流方向和磁场方向对受力方向的影响。",
    "apparatus": [
      "蹄形磁体",
      "导体棒",
      "低压电源",
      "开关"
    ],
    "steps": [
      "通电观察导体棒运动。",
      "仅反转电流方向重复。",
      "仅调换磁极后再比较。"
    ],
    "observations": [
      "只改变电流或磁场方向，受力方向反向；同时反转二者，受力方向不变。"
    ],
    "conclusion": "磁场对通电导体有力的作用，方向同时与电流和磁场有关。",
    "examPoints": [
      "控制变量判断方向关系",
      "这是电动机原理，不是电磁感应"
    ],
    "pitfalls": [
      "导线不通电时不能套用同样的受力结论"
    ],
    "questions": [
      {
        "q": "同时反转电流与磁场，受力是否反向？",
        "a": "不会，两次反向作用抵消，受力方向保持不变。"
      }
    ],
    "safety": [
      "使用限流电源，防止裸导体短路和发热。"
    ],
    "model": "magnet",
    "modelParams": {
      "scenario": "wireForce",
      "variant": "wire-force"
    },
    "modelNote": "磁场线和相对场强用于表示方向及变化趋势，不能当作实测磁感应强度或吸力。",
    "controls": [
      {
        "key": "current",
        "label": "电流",
        "unit": "A",
        "min": -3,
        "max": 3,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "field",
        "label": "磁感应强度",
        "unit": "T",
        "min": 0.05,
        "max": 1,
        "step": 0.05,
        "value": 0.2
      },
      {
        "key": "length",
        "label": "通电导线长度",
        "unit": "m",
        "min": 0.1,
        "max": 1,
        "step": 0.1,
        "value": 0.5
      },
      {
        "key": "angle",
        "label": "线圈法线与磁场夹角",
        "unit": "°",
        "min": 0,
        "max": 180,
        "step": 5,
        "value": 45
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "同时反转电流与磁场，受力是否反向？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "比较电流方向和磁场方向对受力方向的影响。"
        },
        {
          "title": "选择实验证据",
          "text": "只改变电流或磁场方向，受力方向反向；同时反转二者，受力方向不变。"
        },
        {
          "title": "建立解释",
          "text": "磁场对通电导体有力的作用，方向同时与电流和磁场有关。"
        },
        {
          "title": "完整作答",
          "text": "不会，两次反向作用抵消，受力方向保持不变。"
        }
      ],
      "answer": "不会，两次反向作用抵消，受力方向保持不变。"
    }
  },
  {
    "id": "phy-coil-torque",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.4",
    "title": "通电线圈为什么不能自行连续转动",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "比较线圈不同角度时的受力效果。",
    "apparatus": [
      "矩形线圈模型",
      "磁体",
      "直流电源"
    ],
    "steps": [
      "把线圈置于不同初始角度。",
      "通电观察转动趋势。",
      "比较越过平衡位置前后的力矩。"
    ],
    "observations": [
      "线圈趋向平衡位置；未经换向的直流线圈不能持续同向转动。"
    ],
    "conclusion": "要维持同向转动，需要在适当位置改变线圈中的电流方向。",
    "examPoints": [
      "平衡位置受力可能不为零，但转动效果为零"
    ],
    "pitfalls": [
      "不能把平衡位置解释成没有磁场"
    ],
    "questions": [
      {
        "q": "线圈越过平衡位置后为何可能转回？",
        "a": "电流方向未改变，磁力矩转为阻碍原转动方向，使线圈返回平衡附近。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "magnet",
    "modelParams": {
      "scenario": "coil",
      "variant": "coil"
    },
    "modelNote": "磁场线和相对场强用于表示方向及变化趋势，不能当作实测磁感应强度或吸力。",
    "controls": [
      {
        "key": "current",
        "label": "电流",
        "unit": "A",
        "min": -3,
        "max": 3,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "turns",
        "label": "线圈匝数",
        "unit": "",
        "min": 10,
        "max": 300,
        "step": 10,
        "value": 100
      },
      {
        "key": "angle",
        "label": "线圈法线与磁场夹角",
        "unit": "°",
        "min": 0,
        "max": 180,
        "step": 5,
        "value": 45
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "线圈越过平衡位置后为何可能转回？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "比较线圈不同角度时的受力效果。"
        },
        {
          "title": "选择实验证据",
          "text": "线圈趋向平衡位置；未经换向的直流线圈不能持续同向转动。"
        },
        {
          "title": "建立解释",
          "text": "要维持同向转动，需要在适当位置改变线圈中的电流方向。"
        },
        {
          "title": "完整作答",
          "text": "电流方向未改变，磁力矩转为阻碍原转动方向，使线圈返回平衡附近。"
        }
      ],
      "answer": "电流方向未改变，磁力矩转为阻碍原转动方向，使线圈返回平衡附近。"
    }
  },
  {
    "id": "phy-dc-motor-project",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.5",
    "title": "制作简易直流电动机模型",
    "kind": "拓展探究",
    "tags": [
      "拓展探究",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "联系线圈受力、惯性和换向实现持续转动。",
    "apparatus": [
      "漆包线圈",
      "磁体",
      "低压电池",
      "支架",
      "换向部件模型"
    ],
    "steps": [
      "设计转子和定子位置。",
      "理解半周供电或换向方式。",
      "调节磁场和接触条件，观察持续转动。"
    ],
    "observations": [
      "适当换向或间歇供电配合惯性可以维持转动。"
    ],
    "conclusion": "电动机将电能转化为机械能，换向保证合适的转动方向。",
    "examPoints": [
      "简易半刮漆结构与完整换向器的作用方式应区分"
    ],
    "pitfalls": [
      "转得快不等于能量转换效率一定高"
    ],
    "questions": [
      {
        "q": "电动机正常工作时发生什么能量转化？",
        "a": "主要把电能转化为机械能，同时有电阻发热等损耗。"
      }
    ],
    "safety": [
      "不得长时间堵转；断电后再调整线圈和支架。"
    ],
    "model": "magnet",
    "modelParams": {
      "scenario": "motor",
      "variant": "motor"
    },
    "modelNote": "磁场线和相对场强用于表示方向及变化趋势，不能当作实测磁感应强度或吸力。",
    "controls": [
      {
        "key": "current",
        "label": "电流",
        "unit": "A",
        "min": -3,
        "max": 3,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "turns",
        "label": "线圈匝数",
        "unit": "",
        "min": 10,
        "max": 300,
        "step": 10,
        "value": 100
      },
      {
        "key": "angle",
        "label": "线圈法线与磁场夹角",
        "unit": "°",
        "min": 0,
        "max": 180,
        "step": 5,
        "value": 45
      },
      {
        "key": "core",
        "label": "铁芯",
        "options": [
          {
            "value": "air",
            "label": "无铁芯"
          },
          {
            "value": "iron",
            "label": "有铁芯"
          }
        ],
        "value": "iron"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "电动机正常工作时发生什么能量转化？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "联系线圈受力、惯性和换向实现持续转动。"
        },
        {
          "title": "选择实验证据",
          "text": "适当换向或间歇供电配合惯性可以维持转动。"
        },
        {
          "title": "建立解释",
          "text": "电动机将电能转化为机械能，换向保证合适的转动方向。"
        },
        {
          "title": "完整作答",
          "text": "主要把电能转化为机械能，同时有电阻发热等损耗。"
        }
      ],
      "answer": "主要把电能转化为机械能，同时有电阻发热等损耗。"
    }
  },
  {
    "id": "phy-electromagnetic-induction",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.6",
    "title": "探究产生感应电流的条件",
    "kind": "学生实验",
    "tags": [
      "学生实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "通过导体运动、回路通断和磁场方向判断感应电流。",
    "apparatus": [
      "蹄形磁体",
      "导体棒",
      "灵敏电流表",
      "导线"
    ],
    "steps": [
      "将导体棒与电流表组成闭合回路。",
      "分别静止、平行或横切磁感线运动。",
      "反向运动、换磁极和断开回路进行对照。"
    ],
    "observations": [
      "闭合回路的一部分导体切割磁感线时可出现电流；方向随运动或磁场反向而改变。"
    ],
    "conclusion": "感应电流需要合适的磁通变化和闭合电路；初中以切割磁感线条件描述。",
    "examPoints": [
      "无电源也可产生感应电流",
      "闭合条件不可漏写"
    ],
    "pitfalls": [
      "有磁场不等于一定有感应电流"
    ],
    "questions": [
      {
        "q": "导体在磁场里静止，电流表会持续偏转吗？",
        "a": "在磁场稳定的本实验中不会，因为没有产生持续感应电流所需的变化。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "induction",
    "modelParams": {
      "scenario": "motion",
      "variant": "wire"
    },
    "modelNote": "直导体用Blv sinθ，转动线圈用理想正弦感应电动势；忽略内阻与负载反作用，定量公式作为拓展。",
    "controls": [
      {
        "key": "field",
        "label": "磁感应强度",
        "unit": "T",
        "min": 0.05,
        "max": 1,
        "step": 0.05,
        "value": 0.2
      },
      {
        "key": "length",
        "label": "导体长度",
        "unit": "m",
        "min": 0.1,
        "max": 1,
        "step": 0.1,
        "value": 0.5
      },
      {
        "key": "velocity",
        "label": "切割速度",
        "unit": "m/s",
        "min": -5,
        "max": 5,
        "step": 0.1,
        "value": 2
      },
      {
        "key": "angle",
        "label": "速度与磁场夹角",
        "unit": "°",
        "min": 0,
        "max": 180,
        "step": 5,
        "value": 90
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "导体在磁场里静止，电流表会持续偏转吗？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "通过导体运动、回路通断和磁场方向判断感应电流。"
        },
        {
          "title": "选择实验证据",
          "text": "闭合回路的一部分导体切割磁感线时可出现电流；方向随运动或磁场反向而改变。"
        },
        {
          "title": "建立解释",
          "text": "感应电流需要合适的磁通变化和闭合电路；初中以切割磁感线条件描述。"
        },
        {
          "title": "完整作答",
          "text": "在磁场稳定的本实验中不会，因为没有产生持续感应电流所需的变化。"
        }
      ],
      "answer": "在磁场稳定的本实验中不会，因为没有产生持续感应电流所需的变化。"
    }
  },
  {
    "id": "phy-hand-generator",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十章 电与磁",
    "section": "20.6",
    "title": "手摇发电机与交替发光的LED",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "通过摇动和电流方向变化认识发电机。",
    "apparatus": [
      "手摇发电机",
      "小灯泡",
      "反向并联LED",
      "电流表示意"
    ],
    "steps": [
      "缓慢转动摇把并观察灯泡。",
      "改变转速比较输出。",
      "用反向并联LED观察电流方向交替。"
    ],
    "observations": [
      "转速改变时亮度变化；两个LED可交替发光。"
    ],
    "conclusion": "发电机将机械能转化为电能，常见交流发电机输出电流方向周期改变。",
    "examPoints": [
      "方向周期变化是交流特征",
      "能量来自外力做功"
    ],
    "pitfalls": [
      "发电机并非制造或储存电荷"
    ],
    "questions": [
      {
        "q": "为什么要把两只LED反向并联？",
        "a": "它们分别在相反方向电流流过时导通，便于观察电流方向交替。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "induction",
    "modelParams": {
      "scenario": "generator",
      "variant": "generator"
    },
    "modelNote": "直导体用Blv sinθ，转动线圈用理想正弦感应电动势；忽略内阻与负载反作用，定量公式作为拓展。",
    "controls": [
      {
        "key": "field",
        "label": "磁感应强度",
        "unit": "T",
        "min": 0.05,
        "max": 1,
        "step": 0.05,
        "value": 0.2
      },
      {
        "key": "turns",
        "label": "匝数",
        "unit": "",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "area",
        "label": "线圈面积",
        "unit": "m²",
        "min": 0.005,
        "max": 0.1,
        "step": 0.005,
        "value": 0.02
      },
      {
        "key": "frequency",
        "label": "转动频率",
        "unit": "Hz",
        "min": 0,
        "max": 10,
        "step": 0.5,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为什么要把两只LED反向并联？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "通过摇动和电流方向变化认识发电机。"
        },
        {
          "title": "选择实验证据",
          "text": "转速改变时亮度变化；两个LED可交替发光。"
        },
        {
          "title": "建立解释",
          "text": "发电机将机械能转化为电能，常见交流发电机输出电流方向周期改变。"
        },
        {
          "title": "完整作答",
          "text": "它们分别在相反方向电流流过时导通，便于观察电流方向交替。"
        }
      ],
      "answer": "它们分别在相反方向电流流过时导通，便于观察电流方向交替。"
    }
  },
  {
    "id": "phy-spark-radio",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十一章 电磁波及其应用",
    "section": "21.1",
    "title": "用收音机观察迅速变化电流的效应",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "把收音机杂音与变化电流产生的电磁信号联系起来。",
    "apparatus": [
      "收音机模型",
      "低压脉冲电路模型",
      "接收天线"
    ],
    "steps": [
      "将接收机调到无节目的频段。",
      "使模型电路产生短脉冲。",
      "比较稳定电流与变化电流的接收信号。"
    ],
    "observations": [
      "接收机在快速变化发生时出现短促信号。"
    ],
    "conclusion": "迅速变化的电流能够产生电磁波。",
    "examPoints": [
      "变化电流与电磁波联系",
      "声音来自接收机的扬声器"
    ],
    "pitfalls": [
      "不是声波从电路直接传入收音机"
    ],
    "questions": [
      {
        "q": "实验中的咔咔声由哪里发出？",
        "a": "由收音机接收电磁信号后，经电路处理带动扬声器发出。"
      }
    ],
    "safety": [
      "只用仿真脉冲源；不自行制造火花或短接电池。"
    ],
    "model": "emwave",
    "modelParams": {
      "scenario": "emission",
      "variant": "emission"
    },
    "modelNote": "使用真空光速与波长频率关系；接收强弱是相对示意，未模拟真实天线、干扰和复杂传播损耗。",
    "controls": [
      {
        "key": "frequency",
        "label": "频率",
        "unit": "MHz",
        "min": 1,
        "max": 3000,
        "step": 1,
        "value": 100
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "实验中的咔咔声由哪里发出？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "把收音机杂音与变化电流产生的电磁信号联系起来。"
        },
        {
          "title": "选择实验证据",
          "text": "接收机在快速变化发生时出现短促信号。"
        },
        {
          "title": "建立解释",
          "text": "迅速变化的电流能够产生电磁波。"
        },
        {
          "title": "完整作答",
          "text": "由收音机接收电磁信号后，经电路处理带动扬声器发出。"
        }
      ],
      "answer": "由收音机接收电磁信号后，经电路处理带动扬声器发出。"
    }
  },
  {
    "id": "phy-vacuum-phone",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十一章 电磁波及其应用",
    "section": "21.1",
    "title": "真空罩中的手机还能接收信号吗",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "比较电磁波与声音对传播介质的要求。",
    "apparatus": [
      "真空罩模型",
      "手机",
      "接收信号指示"
    ],
    "steps": [
      "将手机置于可透过无线信号的罩内。",
      "改变罩内空气量。",
      "观察来电指示与声音传播的差异。"
    ],
    "observations": [
      "空气减少时仍可收到无线信号；经空气传播的声音明显减弱。"
    ],
    "conclusion": "电磁波可以在真空中传播，声音不能在真空中传播。",
    "examPoints": [
      "容器屏蔽电磁波的影响与真空不同"
    ],
    "pitfalls": [
      "不能把密闭金属盒收不到信号解释成真空效应"
    ],
    "questions": [
      {
        "q": "真空中能打电话，是否说明声音能在真空中传播？",
        "a": "不是，通信使用电磁波传递信息，接收端再把电信号转换成声音。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "emwave",
    "modelParams": {
      "scenario": "vacuum",
      "variant": "vacuum"
    },
    "modelNote": "使用真空光速与波长频率关系；接收强弱是相对示意，未模拟真实天线、干扰和复杂传播损耗。",
    "controls": [
      {
        "key": "frequency",
        "label": "频率",
        "unit": "MHz",
        "min": 1,
        "max": 3000,
        "step": 1,
        "value": 100
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "真空中能打电话，是否说明声音能在真空中传播？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "比较电磁波与声音对传播介质的要求。"
        },
        {
          "title": "选择实验证据",
          "text": "空气减少时仍可收到无线信号；经空气传播的声音明显减弱。"
        },
        {
          "title": "建立解释",
          "text": "电磁波可以在真空中传播，声音不能在真空中传播。"
        },
        {
          "title": "完整作答",
          "text": "不是，通信使用电磁波传递信息，接收端再把电信号转换成声音。"
        }
      ],
      "answer": "不是，通信使用电磁波传递信息，接收端再把电信号转换成声音。"
    }
  },
  {
    "id": "phy-radio-tuning",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十一章 电磁波及其应用",
    "section": "21.1",
    "title": "读收音机刻度与调谐频率",
    "kind": "小实验",
    "tags": [
      "小实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "认识频率单位并将调谐与选台联系起来。",
    "apparatus": [
      "收音机刻度模型",
      "调谐旋钮",
      "电台信号示意"
    ],
    "steps": [
      "辨认kHz和MHz刻度。",
      "调整接收频率寻找匹配信号。",
      "把频率换算为Hz并比较波长。"
    ],
    "observations": [
      "接收频率与目标信号匹配时响应最明显。"
    ],
    "conclusion": "调谐用于选择特定频率范围的无线电信号。",
    "examPoints": [
      "1 MHz=10⁶ Hz",
      "真空中c=fλ"
    ],
    "pitfalls": [
      "不能认为频率越高传播速度越大"
    ],
    "questions": [
      {
        "q": "100 MHz对应多少Hz，真空波长约多大？",
        "a": "100 MHz=1.0×10⁸ Hz，波长约3 m。"
      }
    ],
    "safety": [
      "使用低压教学器材；实际操作由教师按器材说明组织。"
    ],
    "model": "emwave",
    "modelParams": {
      "scenario": "tuning",
      "variant": "tuning"
    },
    "modelNote": "使用真空光速与波长频率关系；接收强弱是相对示意，未模拟真实天线、干扰和复杂传播损耗。",
    "controls": [
      {
        "key": "frequency",
        "label": "频率",
        "unit": "MHz",
        "min": 1,
        "max": 3000,
        "step": 1,
        "value": 100
      },
      {
        "key": "receiverFrequency",
        "label": "接收调谐频率",
        "unit": "MHz",
        "min": 1,
        "max": 3000,
        "step": 1,
        "value": 100
      },
      {
        "key": "bandwidth",
        "label": "模型带宽",
        "unit": "MHz",
        "min": 0.1,
        "max": 10,
        "step": 0.1,
        "value": 1
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "f=100 MHz=1.0×10⁸ Hz；c≈3.0×10⁸ m/s。",
      "steps": [
        {
          "title": "提取条件与单位",
          "text": "f=100 MHz=1.0×10⁸ Hz；c≈3.0×10⁸ m/s。"
        },
        {
          "title": "选用关系",
          "text": "λ=c/f。"
        },
        {
          "title": "代入与求解",
          "text": "λ=(3.0×10⁸)/(1.0×10⁸)=3 m。"
        },
        {
          "title": "解释结果",
          "text": "波长约3 m。"
        }
      ],
      "answer": "波长约3 m。"
    }
  },
  {
    "id": "phy-emwave-transmission",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十一章 电磁波及其应用",
    "section": "21.2",
    "title": "观察电磁信号的发射与接收",
    "kind": "拓展探究",
    "tags": [
      "拓展探究",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "比较发射频率改变时的接收信号。",
    "apparatus": [
      "电磁波发射器",
      "接收器",
      "传感器",
      "数据采集器"
    ],
    "steps": [
      "连接教学发射与接收装置。",
      "选择波形并记录接收信号。",
      "改变发射频率和接收条件进行比较。"
    ],
    "observations": [
      "接收端可记录与发射设置相联系的波形变化。"
    ],
    "conclusion": "电磁波可携带信息，接收装置把信号转化为可处理的电信号。",
    "examPoints": [
      "载波与信息信号概念不同",
      "屏幕波形是转换后的信号"
    ],
    "pitfalls": [
      "屏幕上的曲线不代表空间中电磁波的真实尺寸"
    ],
    "questions": [
      {
        "q": "接收波形为何能随发射频率改变？",
        "a": "接收器感应到的变化电磁信号与发射器设定相关，再经采集显示。"
      }
    ],
    "safety": [
      "使用符合规范的教学低功率设备，不干扰实际无线通信。"
    ],
    "model": "emwave",
    "modelParams": {
      "scenario": "transmission",
      "variant": "transmission"
    },
    "modelNote": "使用真空光速与波长频率关系；接收强弱是相对示意，未模拟真实天线、干扰和复杂传播损耗。",
    "controls": [
      {
        "key": "frequency",
        "label": "频率",
        "unit": "MHz",
        "min": 1,
        "max": 3000,
        "step": 1,
        "value": 100
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "接收波形为何能随发射频率改变？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "比较发射频率改变时的接收信号。"
        },
        {
          "title": "选择实验证据",
          "text": "接收端可记录与发射设置相联系的波形变化。"
        },
        {
          "title": "建立解释",
          "text": "电磁波可携带信息，接收装置把信号转化为可处理的电信号。"
        },
        {
          "title": "完整作答",
          "text": "接收器感应到的变化电磁信号与发射器设定相关，再经采集显示。"
        }
      ],
      "answer": "接收器感应到的变化电磁信号与发射器设定相关，再经采集显示。"
    }
  },
  {
    "id": "phy-water-light-guide",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十一章 电磁波及其应用",
    "section": "21.3",
    "title": "水流导光与光纤通信",
    "kind": "演示实验",
    "tags": [
      "演示实验",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "用沿水流传播的光说明导光现象。",
    "apparatus": [
      "透明水瓶模型",
      "出水小孔",
      "低功率激光模型",
      "接光屏"
    ],
    "steps": [
      "调整光线使其从瓶内射向出水口。",
      "观察弯曲水流内的光路。",
      "比较满足与不满足全反射条件的光线。"
    ],
    "observations": [
      "适当入射时光能沿弯曲水流传播并在出口出现亮斑。"
    ],
    "conclusion": "合适条件下反复全反射可把光限制在导光介质内。",
    "examPoints": [
      "光纤靠光传递信息",
      "全反射要求从光密介质射向光疏介质且入射角足够大"
    ],
    "pitfalls": [
      "不能说光在均匀介质中会无缘无故拐弯"
    ],
    "questions": [
      {
        "q": "水流能导光，是否违反光的直线传播？",
        "a": "不违反。光在各段均匀介质内近似直线传播，并在边界反复反射。"
      }
    ],
    "safety": [
      "激光不得照射眼睛、人群或反光物；以模拟操作为主。"
    ],
    "model": "optics",
    "modelParams": {
      "scenario": "fiber",
      "variant": "fiber"
    },
    "modelNote": "以水到空气的界面全反射解释导光；实际弯曲水柱存在损耗，光纤通常还具有芯层、包层，不能等同于一根均匀直线光路。",
    "controls": [
      {
        "key": "angle",
        "label": "入射角",
        "unit": "°",
        "min": 0,
        "max": 85,
        "step": 1,
        "value": 65
      },
      {
        "key": "n1",
        "label": "水的折射率",
        "unit": "",
        "min": 1,
        "max": 2,
        "step": 0.01,
        "value": 1.33
      },
      {
        "key": "n2",
        "label": "外部介质折射率",
        "unit": "",
        "min": 1,
        "max": 2,
        "step": 0.01,
        "value": 1
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "水流能导光，是否违反光的直线传播？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "用沿水流传播的光说明导光现象。"
        },
        {
          "title": "选择实验证据",
          "text": "适当入射时光能沿弯曲水流传播并在出口出现亮斑。"
        },
        {
          "title": "建立解释",
          "text": "合适条件下反复全反射可把光限制在导光介质内。"
        },
        {
          "title": "完整作答",
          "text": "不违反。光在各段均匀介质内近似直线传播，并在边界反复反射。"
        }
      ],
      "answer": "不违反。光在各段均匀介质内近似直线传播，并在边界反复反射。"
    }
  },
  {
    "id": "phy-energy-saving-project",
    "subject": "physics",
    "term": "9下",
    "chapter": "第二十二章 能源与可持续发展",
    "section": "22.3",
    "title": "为家庭能源使用设计改进方案",
    "kind": "拓展探究",
    "tags": [
      "拓展探究",
      "九年级全一册"
    ],
    "sourceIds": [
      "physics-g9-textbook"
    ],
    "objective": "用可比较的数据评价能源节约措施。",
    "apparatus": [
      "能源使用清单",
      "电气设备参数",
      "燃料消耗记录",
      "方案比较表"
    ],
    "steps": [
      "记录一段时间内各类能源用途与消耗。",
      "提出减少无效消耗的具体措施。",
      "用同一时间与需求条件估算并复核节约量。"
    ],
    "observations": [
      "节能收益由使用习惯、设备效率和需求共同决定。"
    ],
    "conclusion": "节能方案需有基准、有数据，并兼顾安全、费用与实际需求。",
    "examPoints": [
      "不同能源比较需统一能量单位",
      "不能把节能简单等同不用能源"
    ],
    "pitfalls": [
      "估算值不能伪装成实测节约量"
    ],
    "questions": [
      {
        "q": "更换电器后为何不能只比较额定功率判断节能？",
        "a": "还需比较相同任务下的工作时间、实际负荷和效率，必要时测量耗电量。"
      }
    ],
    "safety": [
      "能源调查不拆卸燃气、电气设备，不改变通风和安全保护。"
    ],
    "model": "household",
    "modelParams": {
      "scenario": "power",
      "variant": "energy-plan",
      "voltage": 220
    },
    "modelNote": "家庭用电仅在图示和低压模型中讨论；功率、电能和电流为理论估算，不模拟实际市电接线。",
    "controls": [
      {
        "key": "power",
        "label": "用电器总功率",
        "unit": "W",
        "min": 0,
        "max": 10000,
        "step": 100,
        "value": 2200
      },
      {
        "key": "time",
        "label": "使用时间",
        "unit": "h",
        "min": 0,
        "max": 24,
        "step": 0.5,
        "value": 2
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "更换电器后为何不能只比较额定功率判断节能？",
      "steps": [
        {
          "title": "指出观察对象",
          "text": "用可比较的数据评价能源节约措施。"
        },
        {
          "title": "选择实验证据",
          "text": "节能收益由使用习惯、设备效率和需求共同决定。"
        },
        {
          "title": "建立解释",
          "text": "节能方案需有基准、有数据，并兼顾安全、费用与实际需求。"
        },
        {
          "title": "完整作答",
          "text": "还需比较相同任务下的工作时间、实际负荷和效率，必要时测量耗电量。"
        }
      ],
      "answer": "还需比较相同任务下的工作时间、实际负荷和效率，必要时测量耗电量。"
    }
  },
  {
    "id": "phy-thermal-conductivity",
    "subject": "physics",
    "term": "8上",
    "chapter": "拓展：材料的物理属性",
    "title": "比较不同材料的导热性",
    "kind": "拓展探究",
    "tags": [
      "实验教学基本目录"
    ],
    "sourceIds": [
      "physics-ncet-2023"
    ],
    "objective": "固定长度、粗细与受热条件，比较热量传递快慢。",
    "apparatus": [
      "等长等粗金属棒",
      "温度指示点",
      "恒温热源"
    ],
    "steps": [
      "使各材料一端接触相同热源。",
      "观察等距离处指示点变化。",
      "比较相同时间的响应。"
    ],
    "observations": [
      "不同材料上相同位置的温度响应速度可能不同。"
    ],
    "conclusion": "材料导热能力不同；良导体和隔热材料各有用途。",
    "examPoints": [
      "导热性与比热容不同",
      "控制几何尺寸"
    ],
    "pitfalls": [
      "不能把升温快的材料一律称为比热容小"
    ],
    "questions": [
      {
        "q": "为何需让测温点离热源距离相同？",
        "a": "传播距离不同也影响响应时间，只有距离等条件相同才便于比较材料导热性。"
      }
    ],
    "safety": [
      "使用教学模型或安全低压器材；加热与精密光学操作由教师指导。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "conduction",
      "variant": "thermal-conductivity"
    },
    "modelNote": "交互比较材料的相对导热能力和冷热端温度，未由实物响应时间反推出真实导热系数。瞬态温度响应还受密度、比热容、接触热阻和几何尺寸影响。",
    "controls": [
      {
        "key": "conductivity",
        "label": "导热能力（相对量）",
        "unit": "",
        "min": 0,
        "max": 10,
        "step": 0.1,
        "value": 1
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": 0,
        "max": 90,
        "step": 1,
        "value": 20
      },
      {
        "key": "temperature2",
        "label": "第二物体温度",
        "unit": "℃",
        "min": 0,
        "max": 100,
        "step": 1,
        "value": 80
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "为何需让测温点离热源距离相同？",
      "steps": [
        {
          "title": "确定比较条件",
          "text": "固定长度、粗细与受热条件，比较热量传递快慢。"
        },
        {
          "title": "选择实验现象",
          "text": "不同材料上相同位置的温度响应速度可能不同。"
        },
        {
          "title": "解释证据",
          "text": "材料导热能力不同；良导体和隔热材料各有用途。"
        },
        {
          "title": "完整回答",
          "text": "传播距离不同也影响响应时间，只有距离等条件相同才便于比较材料导热性。"
        }
      ],
      "answer": "传播距离不同也影响响应时间，只有距离等条件相同才便于比较材料导热性。"
    }
  },
  {
    "id": "phy-molecular-gap",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十三章 内能",
    "title": "混合液体体积与分子间隙",
    "kind": "拓展探究",
    "tags": [
      "实验教学基本目录"
    ],
    "sourceIds": [
      "physics-ncet-2023"
    ],
    "objective": "比较混合前后体积，认识宏观体积不一定简单相加。",
    "apparatus": [
      "两种互溶液体模型",
      "量筒",
      "封闭混合容器"
    ],
    "steps": [
      "在相同温度下记录两种液体体积。",
      "混合并等待状态稳定。",
      "比较混合体积与原体积和。"
    ],
    "observations": [
      "某些液体混合后的体积可小于原体积之和。"
    ],
    "conclusion": "分子间存在间隙，混合时分子排列和相互作用改变，体积不一定具有简单加和性。",
    "examPoints": [
      "质量守恒不要求体积相加",
      "需控制温度与读数"
    ],
    "pitfalls": [
      "不把米豆模型当成真实分子大小结构"
    ],
    "questions": [
      {
        "q": "混合体积减少是否说明质量减少？",
        "a": "不是，封闭且无损失条件下总质量不变，体积改变源于微观排列等因素。"
      }
    ],
    "safety": [
      "使用教学模型或安全低压器材；加热与精密光学操作由教师指导。"
    ],
    "model": "molecular",
    "modelParams": {
      "scenario": "gap",
      "variant": "molecular-gap"
    },
    "modelNote": "用给定缩减比例表示某些互溶液体体积不简单相加；比例为教学输入，未从真实酒精浓度或分子势预测体积收缩。质量守恒仍成立。",
    "controls": [
      {
        "key": "volume1",
        "label": "液体一体积",
        "unit": "mL",
        "min": 10,
        "max": 100,
        "step": 5,
        "value": 50
      },
      {
        "key": "volume2",
        "label": "液体二体积",
        "unit": "mL",
        "min": 10,
        "max": 100,
        "step": 5,
        "value": 50
      },
      {
        "key": "contraction",
        "label": "体积缩减比例（示意）",
        "unit": "%",
        "min": 0,
        "max": 8,
        "step": 0.5,
        "value": 4
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "混合体积减少是否说明质量减少？",
      "steps": [
        {
          "title": "确定比较条件",
          "text": "比较混合前后体积，认识宏观体积不一定简单相加。"
        },
        {
          "title": "选择实验现象",
          "text": "某些液体混合后的体积可小于原体积之和。"
        },
        {
          "title": "解释证据",
          "text": "分子间存在间隙，混合时分子排列和相互作用改变，体积不一定具有简单加和性。"
        },
        {
          "title": "完整回答",
          "text": "不是，封闭且无损失条件下总质量不变，体积改变源于微观排列等因素。"
        }
      ],
      "answer": "不是，封闭且无损失条件下总质量不变，体积改变源于微观排列等因素。"
    }
  },
  {
    "id": "phy-buoyancy-cause",
    "subject": "physics",
    "term": "8下",
    "chapter": "第十章 浮力",
    "title": "从上下表面压力差解释浮力",
    "kind": "拓展探究",
    "tags": [
      "实验教学基本目录"
    ],
    "sourceIds": [
      "physics-ncet-2023"
    ],
    "objective": "比较浸在液体中物体上下表面受到的压力。",
    "apparatus": [
      "长方体模型",
      "液体",
      "压强箭头",
      "深度标尺"
    ],
    "steps": [
      "保持物体完全浸没且不触底。",
      "标出上、下表面深度。",
      "分别计算压力并比较合力。"
    ],
    "observations": [
      "下表面更深，通常受到更大的向上压力；侧面力相互抵消。"
    ],
    "conclusion": "液体压强随深度增加，物体受到向上的压力差，形成浮力。",
    "examPoints": [
      "比较的是压力不是单一压强",
      "底部无液体时不能直接套通常压力分布"
    ],
    "pitfalls": [
      "不能只说水越深压力越大而漏掉受力方向"
    ],
    "questions": [
      {
        "q": "完全浸没后继续下移，浮力为什么可以不变？",
        "a": "上下表面压力都增大，但两者之差由物体高度和面积决定，可保持不变。"
      }
    ],
    "safety": [
      "使用教学模型或安全低压器材；加热与精密光学操作由教师指导。"
    ],
    "model": "buoyancy",
    "modelParams": {
      "scenario": "cause",
      "variant": "buoyancy-cause"
    },
    "modelNote": "完全浸没长方体上、下表面压力分别为ρghS，侧向合力抵消；不包含贴底密封而下表面无液体的情况。",
    "controls": [
      {
        "key": "area",
        "label": "上下表面面积",
        "unit": "cm²",
        "min": 1,
        "max": 100,
        "step": 1,
        "value": 20
      },
      {
        "key": "objectHeight",
        "label": "物体高度",
        "unit": "cm",
        "min": 1,
        "max": 20,
        "step": 1,
        "value": 5
      },
      {
        "key": "depth",
        "label": "上表面深度",
        "unit": "m",
        "min": 0,
        "max": 2,
        "step": 0.05,
        "value": 0.2
      },
      {
        "key": "density",
        "label": "液体密度",
        "unit": "kg/m³",
        "min": 500,
        "max": 1500,
        "step": 50,
        "value": 1000
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "完全浸没后继续下移，浮力为什么可以不变？",
      "steps": [
        {
          "title": "确定比较条件",
          "text": "比较浸在液体中物体上下表面受到的压力。"
        },
        {
          "title": "选择实验现象",
          "text": "下表面更深，通常受到更大的向上压力；侧面力相互抵消。"
        },
        {
          "title": "解释证据",
          "text": "液体压强随深度增加，物体受到向上的压力差，形成浮力。"
        },
        {
          "title": "完整回答",
          "text": "上下表面压力都增大，但两者之差由物体高度和面积决定，可保持不变。"
        }
      ],
      "answer": "上下表面压力都增大，但两者之差由物体高度和面积决定，可保持不变。"
    }
  },
  {
    "id": "phy-water-freezing",
    "subject": "physics",
    "term": "8上",
    "chapter": "第三章 物态变化",
    "title": "观察水凝固时的温度变化",
    "kind": "拓展探究",
    "tags": [
      "实验教学基本目录"
    ],
    "sourceIds": [
      "physics-ncet-2023"
    ],
    "objective": "在持续放热过程中记录纯水的温度和状态。",
    "apparatus": [
      "纯水",
      "冷却装置",
      "温度计",
      "时间记录"
    ],
    "steps": [
      "从正温度的水开始冷却。",
      "同时记录温度和固液状态。",
      "比较凝固前、凝固中和凝固后。"
    ],
    "observations": [
      "正常压强下纯水凝固时出现接近0 ℃的平台，继续放热冰量增加。"
    ],
    "conclusion": "晶体凝固放热，在凝固过程中温度可保持不变。",
    "examPoints": [
      "凝固是放热过程",
      "凝固温度受成分与压强影响"
    ],
    "pitfalls": [
      "不能把平台解释为停止放热"
    ],
    "questions": [
      {
        "q": "水在0 ℃保持不变但冰越来越多，是否还放热？",
        "a": "仍在放热，能量变化主要对应凝固而不是降温。"
      }
    ],
    "safety": [
      "使用教学模型或安全低压器材；加热与精密光学操作由教师指导。"
    ],
    "model": "phase",
    "modelParams": {
      "scenario": "freezing",
      "variant": "water-freezing"
    },
    "modelNote": "数值曲线采用给定物质的理想热量与状态关系；忽略散热、过冷和加热器惯性，平台表示相变中仍在吸热或放热。",
    "controls": [
      {
        "key": "mass",
        "label": "样品质量",
        "unit": "kg",
        "min": 0.05,
        "max": 1,
        "step": 0.05,
        "value": 0.1
      },
      {
        "key": "power",
        "label": "加热/放热功率",
        "unit": "W",
        "min": 10,
        "max": 1000,
        "step": 10,
        "value": 100
      },
      {
        "key": "time",
        "label": "时间",
        "unit": "s",
        "min": 0,
        "max": 1200,
        "step": 10,
        "value": 300
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": -20,
        "max": 90,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "水在0 ℃保持不变但冰越来越多，是否还放热？",
      "steps": [
        {
          "title": "确定比较条件",
          "text": "在持续放热过程中记录纯水的温度和状态。"
        },
        {
          "title": "选择实验现象",
          "text": "正常压强下纯水凝固时出现接近0 ℃的平台，继续放热冰量增加。"
        },
        {
          "title": "解释证据",
          "text": "晶体凝固放热，在凝固过程中温度可保持不变。"
        },
        {
          "title": "完整回答",
          "text": "仍在放热，能量变化主要对应凝固而不是降温。"
        }
      ],
      "answer": "仍在放热，能量变化主要对应凝固而不是降温。"
    }
  },
  {
    "id": "phy-heat-mass-temperature",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十三章 内能",
    "title": "探究水吸热与质量、温升的关系",
    "kind": "拓展探究",
    "tags": [
      "实验教学基本目录"
    ],
    "sourceIds": [
      "physics-ncet-2023"
    ],
    "objective": "分别控制温升或质量，比较需要输入的热量。",
    "apparatus": [
      "不同质量的水",
      "同功率加热器",
      "温度计",
      "计时器"
    ],
    "steps": [
      "固定温升，比较两种水量的加热时间。",
      "固定水量，比较不同温升的加热时间。",
      "用等功率加热时的时间比较热量。"
    ],
    "observations": [
      "同种物质在相同状态下，质量或温升增大时，所需热量随之增加。"
    ],
    "conclusion": "无物态变化时Q=cmΔT；同种物质的比热容在适用温区可近似固定。",
    "examPoints": [
      "温升ΔT是末温减初温",
      "控制变量分两组比较"
    ],
    "pitfalls": [
      "不能用末温代替温升"
    ],
    "questions": [
      {
        "q": "两倍质量的水升高相同温度，需要的热量约为几倍？",
        "a": "在相同状态且忽略比热容随温度变化时，约为两倍。"
      }
    ],
    "safety": [
      "使用教学模型或安全低压器材；加热与精密光学操作由教师指导。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "heating",
      "variant": "heat-mass-temperature",
      "capacity": 4200
    },
    "modelNote": "本条仅研究水，常温水的比热容固定取4200 J/(kg·℃)，以质量和温升作比较；忽略散热、比热容随温度的微小变化与相变。",
    "controls": [
      {
        "key": "mass",
        "label": "质量",
        "unit": "kg",
        "min": 0.2,
        "max": 1,
        "step": 0.1,
        "value": 0.4
      },
      {
        "key": "power",
        "label": "加热功率",
        "unit": "W",
        "min": 10,
        "max": 100,
        "step": 10,
        "value": 50
      },
      {
        "key": "time",
        "label": "加热时间",
        "unit": "s",
        "min": 0,
        "max": 120,
        "step": 5,
        "value": 60
      },
      {
        "key": "initial",
        "label": "初温",
        "unit": "℃",
        "min": 10,
        "max": 30,
        "step": 1,
        "value": 20
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "两倍质量的水升高相同温度，需要的热量约为几倍？",
      "steps": [
        {
          "title": "确定比较条件",
          "text": "分别控制温升或质量，比较需要输入的热量。"
        },
        {
          "title": "选择实验现象",
          "text": "同种物质在相同状态下，质量或温升增大时，所需热量随之增加。"
        },
        {
          "title": "解释证据",
          "text": "无物态变化时Q=cmΔT；同种物质的比热容在适用温区可近似固定。"
        },
        {
          "title": "完整回答",
          "text": "在相同状态且忽略比热容随温度变化时，约为两倍。"
        }
      ],
      "answer": "在相同状态且忽略比热容随温度变化时，约为两倍。"
    }
  },
  {
    "id": "phy-myopia-correction",
    "subject": "physics",
    "term": "8上",
    "chapter": "第五章 透镜及其应用",
    "title": "模拟近视眼及凹透镜矫正",
    "kind": "拓展探究",
    "tags": [
      "实验教学基本目录"
    ],
    "sourceIds": [
      "physics-ncet-2023"
    ],
    "objective": "比较像在视网膜前与加入矫正镜后的光路。",
    "apparatus": [
      "眼球光学模型",
      "固定视网膜屏",
      "凹透镜"
    ],
    "steps": [
      "用远物入射光模拟近视时过早会聚。",
      "在眼前加适当凹透镜。",
      "观察光线最终是否在视网膜上会聚。"
    ],
    "observations": [
      "合适凹透镜使入眼光先发散，经过眼的会聚后在视网膜成像。"
    ],
    "conclusion": "近视通常用凹透镜矫正；眼前镜与眼球共同构成系统。",
    "examPoints": [
      "矫正镜不是独立把远物成像在光屏上",
      "近视像在视网膜前"
    ],
    "pitfalls": [
      "不能把远视镜凸透镜用于一般近视模型"
    ],
    "questions": [
      {
        "q": "近视矫正镜的主要作用是什么？",
        "a": "先使入射光适当发散，降低整个系统的过强会聚作用，使像后移到视网膜。"
      }
    ],
    "safety": [
      "使用教学模型或安全低压器材；加热与精密光学操作由教师指导。"
    ],
    "model": "lens",
    "modelParams": {
      "scenario": "myopia",
      "variant": "myopia-correction"
    },
    "modelNote": "数值输出为凹透镜单独成像参数；眼球与矫正光路只作定性示意，不能当作完整眼模型或配镜度数。近视矫正的关键是使入眼光先适当发散。",
    "controls": [
      {
        "key": "focal",
        "label": "焦距大小",
        "unit": "cm",
        "min": 5,
        "max": 30,
        "step": 1,
        "value": 10
      },
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 80,
        "step": 1,
        "value": 30
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "近视矫正镜的主要作用是什么？",
      "steps": [
        {
          "title": "确定比较条件",
          "text": "比较像在视网膜前与加入矫正镜后的光路。"
        },
        {
          "title": "选择实验现象",
          "text": "合适凹透镜使入眼光先发散，经过眼的会聚后在视网膜成像。"
        },
        {
          "title": "解释证据",
          "text": "近视通常用凹透镜矫正；眼前镜与眼球共同构成系统。"
        },
        {
          "title": "完整回答",
          "text": "先使入射光适当发散，降低整个系统的过强会聚作用，使像后移到视网膜。"
        }
      ],
      "answer": "先使入射光适当发散，降低整个系统的过强会聚作用，使像后移到视网膜。"
    }
  },
  {
    "id": "phy-heat-engine-cycle",
    "subject": "physics",
    "term": "9上",
    "chapter": "第十四章 内能的利用",
    "title": "观察四冲程汽油机工作循环",
    "kind": "拓展探究",
    "tags": [
      "实验教学基本目录"
    ],
    "sourceIds": [
      "physics-ncet-2023"
    ],
    "objective": "按活塞、气门和点火状态追踪一个循环。",
    "apparatus": [
      "汽油机剖面模型",
      "进气门",
      "排气门",
      "曲轴",
      "火花塞"
    ],
    "steps": [
      "依次查看吸气、压缩、做功、排气。",
      "记录活塞方向与气门开闭。",
      "区分对气体做功与气体对外做功。"
    ],
    "observations": [
      "做功冲程由高温高压气体推动活塞；其他冲程靠机构和惯性维持。"
    ],
    "conclusion": "典型四冲程汽油机用四个冲程完成循环，曲轴转两周，其中一个冲程对外做功。",
    "examPoints": [
      "汽油机火花塞点火与柴油机压燃不同",
      "热机能量转化"
    ],
    "pitfalls": [
      "不能说四个冲程都由燃气主动推动"
    ],
    "questions": [
      {
        "q": "一个四冲程循环，曲轴转几周、做功几次？",
        "a": "曲轴转两周，完成一次做功冲程。"
      }
    ],
    "safety": [
      "使用教学模型或安全低压器材；加热与精密光学操作由教师指导。"
    ],
    "model": "thermal",
    "modelParams": {
      "scenario": "cycle",
      "variant": "heat-engine-cycle"
    },
    "modelNote": "按四个冲程展示气门、活塞和做功方向；不模拟燃烧化学、压力曲线或具体发动机效率。",
    "controls": [
      {
        "key": "stroke",
        "label": "冲程",
        "options": [
          {
            "value": "intake",
            "label": "吸气"
          },
          {
            "value": "compression",
            "label": "压缩"
          },
          {
            "value": "power",
            "label": "做功"
          },
          {
            "value": "exhaust",
            "label": "排气"
          }
        ],
        "value": "intake"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "一个四冲程循环，曲轴转几周、做功几次？",
      "steps": [
        {
          "title": "确定比较条件",
          "text": "按活塞、气门和点火状态追踪一个循环。"
        },
        {
          "title": "选择实验现象",
          "text": "做功冲程由高温高压气体推动活塞；其他冲程靠机构和惯性维持。"
        },
        {
          "title": "解释证据",
          "text": "典型四冲程汽油机用四个冲程完成循环，曲轴转两周，其中一个冲程对外做功。"
        },
        {
          "title": "完整回答",
          "text": "曲轴转两周，完成一次做功冲程。"
        }
      ],
      "answer": "曲轴转两周，完成一次做功冲程。"
    }
  },
  {
    "id": "phy-model-camera",
    "subject": "physics",
    "term": "8上",
    "chapter": "第五章 透镜及其应用",
    "title": "制作伸缩纸筒照相机模型",
    "kind": "拓展探究",
    "tags": [
      "实验教学基本目录"
    ],
    "sourceIds": [
      "physics-ncet-2023",
      "physics-g8a-textbook"
    ],
    "objective": "用凸透镜和可调屏距形成远物的缩小实像。",
    "apparatus": [
      "凸透镜",
      "伸缩纸筒",
      "半透明光屏"
    ],
    "steps": [
      "安装镜片与屏，使中心对齐。",
      "朝向明亮远物并调节筒长。",
      "比较不同物距下的清晰像与方向。"
    ],
    "observations": [
      "合适位置可得到倒立缩小的实像。"
    ],
    "conclusion": "照相机利用凸透镜形成实像，调焦改变成像系统的相对位置。",
    "examPoints": [
      "光屏位置对应感光元件",
      "远物通常位于二倍焦距外"
    ],
    "pitfalls": [
      "不能把从目镜直接看到的虚像称为照片成像"
    ],
    "questions": [
      {
        "q": "拍近一些的物体时，固定焦距镜头的像距通常怎样？",
        "a": "物体仍在焦距外时，物距减小通常使像距增大。"
      }
    ],
    "safety": [
      "使用教学模型或安全低压器材；加热与精密光学操作由教师指导。"
    ],
    "model": "lens",
    "modelParams": {
      "scenario": "camera",
      "variant": "model-camera"
    },
    "modelNote": "采用理想薄透镜模型，忽略像差；焦点处无有限像距。画面与实物装置比例不同，不能据示意图直接量出真实焦距。",
    "controls": [
      {
        "key": "focal",
        "label": "焦距大小",
        "unit": "cm",
        "min": 5,
        "max": 30,
        "step": 1,
        "value": 10
      },
      {
        "key": "distance",
        "label": "物距",
        "unit": "cm",
        "min": 1,
        "max": 80,
        "step": 1,
        "value": 30
      },
      {
        "key": "height",
        "label": "物高",
        "unit": "cm",
        "min": 1,
        "max": 10,
        "step": 0.5,
        "value": 3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "拍近一些的物体时，固定焦距镜头的像距通常怎样？",
      "steps": [
        {
          "title": "确定比较条件",
          "text": "用凸透镜和可调屏距形成远物的缩小实像。"
        },
        {
          "title": "选择实验现象",
          "text": "合适位置可得到倒立缩小的实像。"
        },
        {
          "title": "解释证据",
          "text": "照相机利用凸透镜形成实像，调焦改变成像系统的相对位置。"
        },
        {
          "title": "完整回答",
          "text": "物体仍在焦距外时，物距减小通常使像距增大。"
        }
      ],
      "answer": "物体仍在焦距外时，物距减小通常使像距增大。"
    }
  },
  {
    "id": "phy-water-jet",
    "subject": "physics",
    "term": "8下",
    "chapter": "第九章 压强",
    "title": "观察容器侧壁不同深度的喷水",
    "kind": "拓展探究",
    "tags": [
      "实验教学基本目录"
    ],
    "sourceIds": [
      "physics-ncet-2023",
      "physics-g8b-textbook"
    ],
    "objective": "比较液体对侧壁的压强随深度变化。",
    "apparatus": [
      "带侧孔透明容器",
      "水",
      "接水盘"
    ],
    "steps": [
      "使不同孔位于不同液深。",
      "短时同时开放并观察水流。",
      "改变液面高度后复测同一孔。"
    ],
    "observations": [
      "同一孔上方液面较高时，出口压强和出流趋势更明显。"
    ],
    "conclusion": "液体对容器侧壁有压强，深度增大时静压增大。",
    "examPoints": [
      "比较射程还受落地高度影响",
      "更深不代表任何设置下落地射程必最大"
    ],
    "pitfalls": [
      "不要把射程大小当作无需条件的精密压强计"
    ],
    "questions": [
      {
        "q": "液面降低后同一侧孔喷水为什么逐渐减弱？",
        "a": "孔上方液体深度减小，产生的静压降低。"
      }
    ],
    "safety": [
      "使用教学模型或安全低压器材；加热与精密光学操作由教师指导。"
    ],
    "model": "pressure",
    "modelParams": {
      "scenario": "liquid",
      "variant": "water-jet"
    },
    "modelNote": "数值给出侧孔处静压ρgh；水流弯曲为示意，落地射程同时受孔高和出流速度影响，不把最远射程直接等同于最大压强。",
    "controls": [
      {
        "key": "density",
        "label": "液体密度",
        "unit": "kg/m³",
        "min": 500,
        "max": 2000,
        "step": 50,
        "value": 1000
      },
      {
        "key": "depth",
        "label": "深度",
        "unit": "m",
        "min": 0,
        "max": 1,
        "step": 0.01,
        "value": 0.3
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "液面降低后同一侧孔喷水为什么逐渐减弱？",
      "steps": [
        {
          "title": "确定比较条件",
          "text": "比较液体对侧壁的压强随深度变化。"
        },
        {
          "title": "选择实验现象",
          "text": "同一孔上方液面较高时，出口压强和出流趋势更明显。"
        },
        {
          "title": "解释证据",
          "text": "液体对容器侧壁有压强，深度增大时静压增大。"
        },
        {
          "title": "完整回答",
          "text": "孔上方液体深度减小，产生的静压降低。"
        }
      ],
      "answer": "孔上方液体深度减小，产生的静压降低。"
    }
  }
]);
