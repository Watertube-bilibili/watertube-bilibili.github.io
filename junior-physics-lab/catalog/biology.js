/* SPDX-License-Identifier: AGPL-3.0-only — Original Chinese educational content. */
window.LAB_CATALOG=window.LAB_CATALOG||[];
window.LAB_CATALOG.push(...[
  {
    "id": "bio-campus",
    "subject": "biology",
    "term": "7上",
    "chapter": "第一单元 第一章 认识生物",
    "title": "观察校园、公园或林地中的生物",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7up-text"
    ],
    "objective": "按统一范围记录生物和生境，区分客观记录与推测。",
    "apparatus": [
      "放大镜",
      "记录表",
      "样方框或路线图"
    ],
    "steps": [
      "确定安全路线和观察范围。",
      "记录形态、位置和数量，同一对象不重复计数。",
      "按可观察特征整理，并保留未定名对象。"
    ],
    "observations": [
      "同一区域可同时有植物、动物和难以直接看到的微生物。",
      "只看会不会移动，不能判断是否为生物。"
    ],
    "conclusion": "观察需有明确目标、统一标准和可复核记录。",
    "examPoints": [
      "调查范围和方法一致",
      "分类依据应明确"
    ],
    "pitfalls": [
      "不能把机器人当生物",
      "未观察到不等于不存在"
    ],
    "questions": [
      {
        "q": "为什么要记录观察时间？",
        "a": "不同时间的光照、温度和活动性不同，时间信息有助于比较结果。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "survey",
    "modelNote": "场景中的数量为可编辑的教学样本；统计结论只适用于该样本，不能冒充校园、地区或人群的实测结果。",
    "controls": [
      {
        "key": "plants",
        "label": "植物个体数",
        "min": 0,
        "max": 100,
        "value": 24,
        "step": 1,
        "unit": ""
      },
      {
        "key": "animals",
        "label": "动物个体数",
        "min": 0,
        "max": 100,
        "value": 8,
        "step": 1,
        "unit": ""
      },
      {
        "key": "area",
        "label": "样方面积",
        "min": 1,
        "max": 20,
        "value": 4,
        "step": 1,
        "unit": "m²"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "样方4 m²中记录24株草本植物，求该样方平均密度。",
      "steps": [
        {
          "title": "明确条件",
          "text": "只计算此样方，不能推广为整个校园。"
        },
        {
          "title": "观察或依据",
          "text": "密度=个体数÷面积。"
        },
        {
          "title": "推理与表达",
          "text": "24÷4=6株/m²。"
        }
      ],
      "answer": "该样方植物密度为6株/m²。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "观察校园、公园或林地中的生物",
      "生物和非生物"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-microscope",
    "subject": "biology",
    "term": "7上",
    "chapter": "第一单元 第二章 认识细胞",
    "title": "练习使用显微镜",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "掌握低倍定位、调焦和放大倍数关系。",
    "apparatus": [
      "光学显微镜",
      "字母玻片",
      "擦镜纸"
    ],
    "steps": [
      "低倍物镜对准通光孔，调节照明。",
      "侧看物镜缓慢接近玻片，再从目镜观察并升高镜筒。",
      "细调至清晰，移动玻片验证像的方向。"
    ],
    "observations": [
      "物像相对实物上下左右颠倒。",
      "同一目镜下换高倍，视野范围减小。"
    ],
    "conclusion": "总放大倍数等于目镜倍数与物镜倍数的乘积。",
    "examPoints": [
      "先低倍后高倍",
      "污点定位可移动玻片或转动目镜"
    ],
    "pitfalls": [
      "不能在高倍下用粗准焦猛降镜筒",
      "倍数增加不是清晰度无限提高"
    ],
    "questions": [
      {
        "q": "像在视野右侧，应将玻片向哪边移动？",
        "a": "把玻片向右移动，倒像向左移动到中央。"
      }
    ],
    "safety": [
      "取放显微镜一手握镜臂一手托镜座；不用直射阳光作光源。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "eyepiece",
        "label": "目镜",
        "min": 5,
        "max": 15,
        "value": 10,
        "step": 5,
        "unit": "倍"
      },
      {
        "key": "objective",
        "label": "物镜",
        "value": "10",
        "options": [
          {
            "value": "4",
            "label": "4倍"
          },
          {
            "value": "10",
            "label": "10倍"
          },
          {
            "value": "40",
            "label": "40倍"
          }
        ]
      },
      {
        "key": "focus",
        "label": "细准焦位置",
        "min": -5,
        "max": 5,
        "value": 0,
        "step": 1,
        "unit": ""
      },
      {
        "key": "shift",
        "label": "玻片向右移动",
        "min": -60,
        "max": 60,
        "value": 0,
        "step": 5,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "目镜10倍，物镜由10倍换成40倍。",
      "steps": [
        {
          "title": "明确条件",
          "text": "目镜不变，只比较物镜。"
        },
        {
          "title": "观察或依据",
          "text": "原总倍数10×10=100，新总倍数10×40=400。"
        },
        {
          "title": "推理与表达",
          "text": "物像线性放大变为4倍，视野直径约为原来的1/4。"
        }
      ],
      "answer": "总放大倍数从100倍变成400倍。"
    },
    "ncetIds": [
      1
    ],
    "evidenceTitles": [
      "练习使用显微镜"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "specimen": "letter"
    }
  },
  {
    "id": "bio-plant-cell",
    "subject": "biology",
    "term": "7上",
    "chapter": "第一单元 第二章 认识细胞",
    "title": "制作并观察植物细胞临时装片",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "辨认细胞壁、细胞质、细胞核及液泡等结构。",
    "apparatus": [
      "洋葱鳞片叶内表皮或黑藻叶",
      "清水和碘液",
      "载玻片、盖玻片、镊子",
      "显微镜"
    ],
    "steps": [
      "在洁净载玻片上滴清水。",
      "取薄材料展平，盖玻片一侧先接触水滴再缓缓放下。",
      "按需要染色，低倍定位后细调观察。"
    ],
    "observations": [
      "洋葱内表皮细胞大体规则，染色后细胞核较明显。",
      "黑藻叶细胞可见叶绿体，洋葱鳞片叶内表皮通常无叶绿体。"
    ],
    "conclusion": "植物细胞的结构与材料部位有关，不是每个植物细胞都有叶绿体。",
    "examPoints": [
      "盖片避免气泡",
      "细胞膜紧贴细胞壁时不易分辨"
    ],
    "pitfalls": [
      "不能把气泡当细胞",
      "厚而折叠的材料不适合透射光观察"
    ],
    "questions": [
      {
        "q": "为什么先展平材料？",
        "a": "避免多层重叠，使光能透过并看清单层细胞边界。"
      }
    ],
    "safety": [
      "碘液不可入口；玻片破损及时交教师处理。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "eyepiece",
        "label": "目镜",
        "min": 5,
        "max": 15,
        "value": 10,
        "step": 5,
        "unit": "倍"
      },
      {
        "key": "objective",
        "label": "物镜",
        "value": "10",
        "options": [
          {
            "value": "4",
            "label": "4倍"
          },
          {
            "value": "10",
            "label": "10倍"
          },
          {
            "value": "40",
            "label": "40倍"
          }
        ]
      },
      {
        "key": "focus",
        "label": "细准焦位置",
        "min": -5,
        "max": 5,
        "value": 0,
        "step": 1,
        "unit": ""
      },
      {
        "key": "specimen",
        "label": "材料",
        "value": "onion",
        "options": [
          {
            "value": "onion",
            "label": "洋葱内表皮"
          },
          {
            "value": "elodea",
            "label": "黑藻叶"
          }
        ]
      },
      {
        "key": "stain",
        "label": "染色",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "碘液染色"
          },
          {
            "value": "no",
            "label": "未染色"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "洋葱内表皮装片有圆形黑边结构，轻压后形状改变。",
      "steps": [
        {
          "title": "明确条件",
          "text": "结合结构形态与位置判断。"
        },
        {
          "title": "观察或依据",
          "text": "气泡边缘较黑，常为圆形且可变形。"
        },
        {
          "title": "推理与表达",
          "text": "不能据此描画为细胞核，应重新规范盖片。"
        }
      ],
      "answer": "该结构更可能是气泡，需重新盖片后观察。"
    },
    "ncetIds": [
      3
    ],
    "evidenceTitles": [
      "制作并观察植物细胞临时装片"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-animal-cell",
    "subject": "biology",
    "term": "7上",
    "chapter": "第一单元 第二章 认识细胞",
    "title": "观察人的口腔上皮细胞和动物细胞",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "比较动物细胞与植物细胞的结构差异。",
    "apparatus": [
      "口腔上皮细胞规范标本",
      "生理盐水",
      "棉签、载玻片、盖玻片",
      "显微镜"
    ],
    "steps": [
      "优先使用教学制备标本。",
      "在生理盐水中均匀涂开材料，缓慢盖片。",
      "适当染色，寻找分散的细胞观察。"
    ],
    "observations": [
      "细胞形状通常不规则，可见细胞核和细胞边界。",
      "动物细胞没有细胞壁、叶绿体和大液泡。"
    ],
    "conclusion": "动物与植物细胞均具有细胞膜、细胞质和细胞核等基本结构。",
    "examPoints": [
      "生理盐水保持细胞形态",
      "比较要有相同结构和不同结构"
    ],
    "pitfalls": [
      "不能用浓盐水替代",
      "不把口腔食物残渣当细胞"
    ],
    "questions": [
      {
        "q": "为何这里用生理盐水而不是清水？",
        "a": "生理盐水有利于维持口腔上皮细胞的正常形态。"
      }
    ],
    "safety": [
      "口腔取材仅按教师卫生要求使用个人一次性用品；不共用取材工具。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "eyepiece",
        "label": "目镜",
        "min": 5,
        "max": 15,
        "value": 10,
        "step": 5,
        "unit": "倍"
      },
      {
        "key": "objective",
        "label": "物镜",
        "value": "10",
        "options": [
          {
            "value": "4",
            "label": "4倍"
          },
          {
            "value": "10",
            "label": "10倍"
          },
          {
            "value": "40",
            "label": "40倍"
          }
        ]
      },
      {
        "key": "focus",
        "label": "细准焦位置",
        "min": -5,
        "max": 5,
        "value": 0,
        "step": 1,
        "unit": ""
      },
      {
        "key": "stain",
        "label": "染色",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "碘液染色"
          },
          {
            "value": "no",
            "label": "未染色"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "比较洋葱内表皮与人的口腔上皮细胞。",
      "steps": [
        {
          "title": "明确条件",
          "text": "两者均为真核细胞。"
        },
        {
          "title": "观察或依据",
          "text": "共同可辨认细胞核、细胞质及细胞边界。"
        },
        {
          "title": "推理与表达",
          "text": "洋葱细胞有细胞壁和大液泡；口腔上皮细胞没有。"
        }
      ],
      "answer": "两种细胞有共同基本结构，动物细胞不具有细胞壁。"
    },
    "ncetIds": [
      3
    ],
    "evidenceTitles": [
      "观察人的口腔上皮细胞",
      "动物细胞的形态和结构"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "specimen": "cheek"
    }
  },
  {
    "id": "bio-cell-division",
    "subject": "biology",
    "term": "7上",
    "chapter": "第一单元 第三章 从细胞到生物体",
    "title": "观察洋葱根尖细胞的分裂",
    "kind": "小实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "通过永久装片与模型说明细胞分裂时遗传物质的分配。",
    "apparatus": [
      "洋葱根尖纵切永久装片",
      "显微镜",
      "细胞分裂示意模型"
    ],
    "steps": [
      "低倍寻找分生区。",
      "观察不同细胞中的染色体形态。",
      "比较分裂前后细胞数及遗传物质分配。"
    ],
    "observations": [
      "不同细胞可处于不同分裂阶段。",
      "遗传物质复制后分配到两个新细胞。"
    ],
    "conclusion": "正常分裂使细胞数增加，产生的新细胞遗传物质通常与原细胞相同。",
    "examPoints": [
      "细胞分裂与细胞生长区别",
      "染色体先复制后分开"
    ],
    "pitfalls": [
      "不能把不同视野细胞当同一细胞连续录像",
      "细胞分化不等于数目增加"
    ],
    "questions": [
      {
        "q": "一个细胞连续分裂3次有多少个？",
        "a": "在每个细胞都正常分裂且无死亡的模型中有2³=8个。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "phase",
        "label": "观察阶段",
        "value": "interphase",
        "options": [
          {
            "value": "interphase",
            "label": "分裂前"
          },
          {
            "value": "middle",
            "label": "染色体排列"
          },
          {
            "value": "separate",
            "label": "染色体分开"
          },
          {
            "value": "two",
            "label": "形成两个细胞"
          }
        ]
      },
      {
        "key": "cycles",
        "label": "连续分裂次数",
        "min": 0,
        "max": 6,
        "value": 2,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "一个细胞连续正常分裂4次，忽略死亡。",
      "steps": [
        {
          "title": "明确条件",
          "text": "每一轮所有细胞各分为两个。"
        },
        {
          "title": "观察或依据",
          "text": "细胞数N=1×2ⁿ。"
        },
        {
          "title": "推理与表达",
          "text": "N=2⁴=16。"
        }
      ],
      "answer": "模型中得到16个细胞。"
    },
    "ncetIds": [
      5
    ],
    "evidenceTitles": [
      "洋葱根尖细胞的分裂"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "specimen": "division"
    }
  },
  {
    "id": "bio-tissues",
    "subject": "biology",
    "term": "7上",
    "chapter": "第一单元 第三章 从细胞到生物体",
    "title": "观察人体和植物体的基本组织",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "把组织的结构特点与功能联系起来。",
    "apparatus": [
      "人体组织永久装片",
      "番茄果实材料",
      "显微镜"
    ],
    "steps": [
      "观察上皮、肌肉、结缔、神经组织标本。",
      "比较细胞排列、细胞间质及形态。",
      "观察番茄表皮与果肉，区分保护和营养功能。"
    ],
    "observations": [
      "上皮细胞排列紧密；肌细胞常较长。",
      "同一器官可由不同组织组成。"
    ],
    "conclusion": "形态相似、结构和功能相关的细胞群构成组织，器官包含多种组织。",
    "examPoints": [
      "组织与器官的层次",
      "结构与功能相适应"
    ],
    "pitfalls": [
      "血液属于结缔组织而不是器官",
      "不要用有无细胞核判断组织类型"
    ],
    "questions": [
      {
        "q": "胃为什么属于器官？",
        "a": "胃具有多种组织，这些组织配合完成储存、消化等功能。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "tissue",
        "label": "观察组织",
        "value": "epithelium",
        "options": [
          {
            "value": "epithelium",
            "label": "上皮组织"
          },
          {
            "value": "muscle",
            "label": "肌肉组织"
          },
          {
            "value": "connective",
            "label": "结缔组织"
          },
          {
            "value": "nerve",
            "label": "神经组织"
          },
          {
            "value": "plant",
            "label": "番茄果实组织"
          }
        ]
      },
      {
        "key": "zoom",
        "label": "示意放大",
        "min": 1,
        "max": 3,
        "value": 1,
        "step": 0.5,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "看到胃壁有上皮组织和肌肉组织，判断其结构层次。",
      "steps": [
        {
          "title": "明确条件",
          "text": "先识别胃由多种组织构成。"
        },
        {
          "title": "观察或依据",
          "text": "组织按一定次序结合完成共同功能。"
        },
        {
          "title": "推理与表达",
          "text": "据定义将胃判断为器官。"
        }
      ],
      "answer": "胃属于器官，由多种组织共同构成。"
    },
    "ncetIds": [
      6
    ],
    "evidenceTitles": [
      "人体的基本组织",
      "胃的组织构成与功能"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-paramecium",
    "subject": "biology",
    "term": "7上",
    "chapter": "第一单元 第三章 从细胞到生物体",
    "title": "观察草履虫并探究其趋性",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "观察单细胞生物并比较其对不同刺激的反应。",
    "apparatus": [
      "草履虫教学培养液",
      "载玻片与滴管",
      "少量棉纤维",
      "显微镜"
    ],
    "steps": [
      "从培养液表层取样并低倍观察。",
      "用少量棉纤维减慢运动。",
      "设置连通液滴及对照，改变一种刺激，记录分布。"
    ],
    "observations": [
      "草履虫由一个细胞完成取食、运动、排泄等活动。",
      "有害刺激与适宜刺激可引起不同方向的运动。"
    ],
    "conclusion": "草履虫能对环境刺激作出反应，不能据此认为它有神经系统。",
    "examPoints": [
      "取样表层含氧较多",
      "单一变量与对照"
    ],
    "pitfalls": [
      "不能将趋性称为反射",
      "不要用一只个体的一次运动下结论"
    ],
    "questions": [
      {
        "q": "草履虫遇盐离开属于反射吗？",
        "a": "不属于；反射需要神经系统参与，草履虫没有神经系统。"
      }
    ],
    "safety": [
      "培养液不可入口；用后按教师要求处置，不倒入饮水容器。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "stimulus",
        "label": "右侧刺激",
        "value": "food",
        "options": [
          {
            "value": "food",
            "label": "适宜食物"
          },
          {
            "value": "salt",
            "label": "食盐刺激"
          },
          {
            "value": "none",
            "label": "无刺激对照"
          }
        ]
      },
      {
        "key": "zoom",
        "label": "示意放大",
        "min": 1,
        "max": 3,
        "value": 1,
        "step": 0.5,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "盐粒放于右侧后草履虫多数向左运动，对照无此差异。",
      "steps": [
        {
          "title": "明确条件",
          "text": "变量为盐刺激，其他条件相同。"
        },
        {
          "title": "观察或依据",
          "text": "比较实验与对照的运动方向。"
        },
        {
          "title": "推理与表达",
          "text": "结果支持草履虫对该刺激有趋避反应。"
        }
      ],
      "answer": "该现象支持草履虫能对刺激作出反应，不属于反射。"
    },
    "ncetIds": [
      2,
      7
    ],
    "evidenceTitles": [
      "观察草履虫并探究其趋性"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "specimen": "paramecium"
    }
  },
  {
    "id": "bio-cell-model",
    "subject": "biology",
    "term": "7上",
    "chapter": "第一单元 第三章 从细胞到生物体",
    "title": "制作细胞模型",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "用可解释的模型表现细胞基本结构及动植物细胞差异。",
    "apparatus": [
      "可重复使用的模型材料",
      "结构标签",
      "设计草图"
    ],
    "steps": [
      "选择一种细胞作为原型。",
      "用不同形状代表膜、质、核等结构。",
      "解释材料与真实结构的对应关系并修改模型。"
    ],
    "observations": [
      "模型有助于表示结构位置，但放大比例、颜色与质感不同于真实细胞。",
      "植物细胞模型应表现细胞壁。"
    ],
    "conclusion": "模型必须兼顾结构准确性与表达清楚，并明确其局限。",
    "examPoints": [
      "模型不是实物",
      "遗传信息主要在细胞核"
    ],
    "pitfalls": [
      "不能给动物细胞添细胞壁",
      "不能让所有细胞模型都有叶绿体"
    ],
    "questions": [
      {
        "q": "为什么要标注模型局限？",
        "a": "避免把示意颜色、形状或比例误认为真实细胞的固定属性。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "type",
        "label": "模型类型",
        "value": "plant",
        "options": [
          {
            "value": "plant",
            "label": "植物细胞"
          },
          {
            "value": "animal",
            "label": "动物细胞"
          }
        ]
      },
      {
        "key": "view",
        "label": "标注内容",
        "value": "whole",
        "options": [
          {
            "value": "whole",
            "label": "整体结构"
          },
          {
            "value": "detail",
            "label": "遗传信息所在结构"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "制作洋葱内表皮细胞模型，是否应加叶绿体？",
      "steps": [
        {
          "title": "明确条件",
          "text": "明确选择的细胞是鳞片叶内表皮。"
        },
        {
          "title": "观察或依据",
          "text": "这种细胞通常不含叶绿体。"
        },
        {
          "title": "推理与表达",
          "text": "保留细胞壁、膜、质、核和大液泡等应有结构。"
        }
      ],
      "answer": "不应仅因其为植物细胞就加入叶绿体。"
    },
    "ncetIds": [
      4
    ],
    "evidenceTitles": [
      "制作细胞模型"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-plants",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第一章 藻类与植物的类群",
    "title": "观察不同类群的植物",
    "kind": "小实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "比较身体分化、输导结构和繁殖特征。",
    "apparatus": [
      "藻类及植物标本或照片",
      "放大镜",
      "比较表"
    ],
    "steps": [
      "观察有无根、茎、叶分化。",
      "比较孢子和种子等繁殖结构。",
      "区分裸子与被子植物种子外有无果皮包被。"
    ],
    "observations": [
      "苔藓植物有类似茎叶的结构，假根主要起固定作用。",
      "蕨类有根茎叶及输导组织；种子植物用种子繁殖。"
    ],
    "conclusion": "植物分类依据一组形态和繁殖特征，不能只按大小或栖息地。",
    "examPoints": [
      "孢子与种子区别",
      "果实与裸露种子区别"
    ],
    "pitfalls": [
      "藻类不都属于植物界的现行分类范围",
      "松的球果不是被子植物的果实"
    ],
    "questions": [
      {
        "q": "蕨类有输导组织，为什么仍不是种子植物？",
        "a": "它通常以孢子繁殖，不产生种子。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "organism",
        "label": "类群",
        "value": "alga",
        "options": [
          {
            "value": "alga",
            "label": "藻类"
          },
          {
            "value": "moss",
            "label": "苔藓植物"
          },
          {
            "value": "fern",
            "label": "蕨类植物"
          },
          {
            "value": "pine",
            "label": "裸子植物"
          },
          {
            "value": "flowering",
            "label": "被子植物"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "某植物有根、茎、叶，叶背有孢子囊群，无种子。",
      "steps": [
        {
          "title": "明确条件",
          "text": "提取根茎叶和孢子两项证据。"
        },
        {
          "title": "观察或依据",
          "text": "蕨类通常具输导组织并以孢子繁殖。"
        },
        {
          "title": "推理与表达",
          "text": "不能因植株较高就判为种子植物。"
        }
      ],
      "answer": "该标本符合蕨类植物的主要特征。"
    },
    "ncetIds": [
      8
    ],
    "evidenceTitles": [
      "几种苔藓植物和蕨类植物",
      "种子的着生位置"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-seed-structure",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第一章 藻类与植物的类群",
    "title": "观察种子的结构",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "识别胚各部分，并比较菜豆与玉米的营养储存部位。",
    "apparatus": [
      "浸软菜豆与玉米",
      "放大镜",
      "镊子",
      "教学剖切标本和碘液"
    ],
    "steps": [
      "观察外形并辨认种皮。",
      "按教师要求观察纵切面或剥开的子叶。",
      "识别胚根、胚轴、胚芽、子叶及胚乳。"
    ],
    "observations": [
      "菜豆有两片较肥厚子叶。",
      "玉米胚一侧较小，胚乳通常遇碘液变蓝。"
    ],
    "conclusion": "胚是新植物的幼体；不同种子储存营养的主要部位不同。",
    "examPoints": [
      "菜豆子叶储存营养",
      "玉米胚乳储存营养"
    ],
    "pitfalls": [
      "不能把整粒玉米都叫胚",
      "玉米粒严格说是颖果"
    ],
    "questions": [
      {
        "q": "玉米滴碘后胚乳变蓝说明什么？",
        "a": "说明该区域含有淀粉，不能说明只有该区域含全部营养。"
      }
    ],
    "safety": [
      "剖切仅由教师指导，刀口避开手指；碘液不可入口。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "seed",
        "label": "种子",
        "value": "bean",
        "options": [
          {
            "value": "bean",
            "label": "菜豆"
          },
          {
            "value": "maize",
            "label": "玉米"
          }
        ]
      },
      {
        "key": "view",
        "label": "观察层次",
        "value": "whole",
        "options": [
          {
            "value": "whole",
            "label": "整体剖面"
          },
          {
            "value": "detail",
            "label": "胚和贮藏结构"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "菜豆与玉米萌发初期主要营养来源分别是什么？",
      "steps": [
        {
          "title": "明确条件",
          "text": "比较两者贮藏结构。"
        },
        {
          "title": "观察或依据",
          "text": "菜豆种子子叶肥厚；玉米有较发达胚乳。"
        },
        {
          "title": "推理与表达",
          "text": "将结构与营养供给功能相联系。"
        }
      ],
      "answer": "主要分别来自菜豆子叶和玉米胚乳。"
    },
    "ncetIds": [
      17
    ],
    "evidenceTitles": [
      "观察种子的结构"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-animal-groups",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第二章 动物的类群",
    "title": "观察不同类群动物的形态结构",
    "kind": "小实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "以呼吸、身体分部和附肢等证据区分动物类群。",
    "apparatus": [
      "动物教学标本或影像",
      "放大镜",
      "比较记录表"
    ],
    "steps": [
      "从外部形态开始记录。",
      "观察与运动、呼吸有关的结构。",
      "依据多项特征判断类群并说明与环境的联系。"
    ],
    "observations": [
      "鱼通常用鳃呼吸，鳍参与运动和平衡。",
      "蚯蚓体表湿润、身体分节；昆虫有外骨骼和三对足。"
    ],
    "conclusion": "类群判断应采用关键结构证据，不能只依生活环境。",
    "examPoints": [
      "鱼鳃和鳍功能不同",
      "青蛙成体肺呼吸并由皮肤辅助"
    ],
    "pitfalls": [
      "鲸不是鱼",
      "不能堵鳃、绑鳍或使动物失水验证功能"
    ],
    "questions": [
      {
        "q": "为什么不能按是否在水中生活区分鱼类？",
        "a": "水中还生活着哺乳动物及其他类群，应根据结构和生殖等特征判断。"
      }
    ],
    "safety": [
      "使用合法教学标本或影像；不捕捉受保护动物，不进行伤害动物的验证。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "animal",
        "label": "观察对象",
        "value": "earthworm",
        "options": [
          {
            "value": "earthworm",
            "label": "蚯蚓"
          },
          {
            "value": "clam",
            "label": "缢蛏"
          },
          {
            "value": "locust",
            "label": "蝗虫"
          },
          {
            "value": "fish",
            "label": "鲫鱼"
          },
          {
            "value": "frog",
            "label": "青蛙"
          },
          {
            "value": "rabbit",
            "label": "家兔"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "观察到一个动物身体分头胸腹，有三对足，判断类群。",
      "steps": [
        {
          "title": "明确条件",
          "text": "采用身体分部和足数两项证据。"
        },
        {
          "title": "观察或依据",
          "text": "昆虫通常具有头胸腹与三对足。"
        },
        {
          "title": "推理与表达",
          "text": "结论仅据这些形态特征，不据体型大小。"
        }
      ],
      "answer": "其主要形态符合昆虫特征。"
    },
    "ncetIds": [
      9
    ],
    "evidenceTitles": [
      "鱼的形态、结构和运动",
      "蛙的形态"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-bird",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第二章 动物的类群",
    "title": "鸟适于飞行的形态结构特点",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "结合观察说明鸟类结构与飞行相适应。",
    "apparatus": [
      "羽毛标本",
      "鸟骨骼模型",
      "鸟类影像"
    ],
    "steps": [
      "观察流线型体形和前肢形成翼。",
      "比较羽毛结构、胸骨和胸肌。",
      "用模型了解气囊与肺的配合。"
    ],
    "observations": [
      "部分长骨内部中空，胸肌发达。",
      "气囊辅助呼吸，气体交换发生在肺。"
    ],
    "conclusion": "减轻质量、提供动力与高效供氧等特征共同支持飞行。",
    "examPoints": [
      "气囊不进行气体交换",
      "结构功能联系需完整表达"
    ],
    "pitfalls": [
      "不能认为鸟骨全为空心",
      "不是所有鸟都能飞"
    ],
    "questions": [
      {
        "q": "只写“身体轻”能完整解释鸟飞行吗？",
        "a": "不能，还应联系翼、胸肌、骨骼支持以及呼吸等方面。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "feature",
        "label": "观察重点",
        "value": "shape",
        "options": [
          {
            "value": "shape",
            "label": "体形与翼"
          },
          {
            "value": "feather",
            "label": "羽毛"
          },
          {
            "value": "bone",
            "label": "骨与胸肌"
          },
          {
            "value": "air",
            "label": "呼吸结构"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "请用结构—功能句式解释鸟的胸肌发达。",
      "steps": [
        {
          "title": "明确条件",
          "text": "结构为胸肌发达并附着于胸骨等部位。"
        },
        {
          "title": "观察或依据",
          "text": "肌肉收缩牵引翼运动。"
        },
        {
          "title": "推理与表达",
          "text": "将结构与提供飞行动力联系。"
        }
      ],
      "answer": "发达胸肌通过收缩驱动翼运动，为飞行提供动力。"
    },
    "ncetIds": [
      9
    ],
    "evidenceTitles": [
      "鸟适于飞行的形态结构特点"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-teeth",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第二章 动物的类群",
    "title": "比较兔和狼的牙齿",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7up-text"
    ],
    "objective": "比较门齿、犬齿和臼齿，解释食性适应。",
    "apparatus": [
      "头骨模型或图片",
      "牙齿结构标签"
    ],
    "steps": [
      "定位门齿、犬齿、臼齿。",
      "比较牙齿形态及发达程度。",
      "联系切断、撕裂和磨碎食物的功能。"
    ],
    "observations": [
      "兔门齿及臼齿较适于切断磨碎植物，通常无犬齿。",
      "狼犬齿发达，利于撕裂。"
    ],
    "conclusion": "牙齿分化提高食物处理能力，并与食性相适应。",
    "examPoints": [
      "用证据联系结构与食性"
    ],
    "pitfalls": [
      "不能只凭牙齿就断定全部食谱"
    ],
    "questions": [
      {
        "q": "兔为何需要发达臼齿？",
        "a": "臼齿有利于磨碎植物性食物。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "animal",
        "label": "头骨",
        "value": "rabbit",
        "options": [
          {
            "value": "rabbit",
            "label": "兔"
          },
          {
            "value": "wolf",
            "label": "狼"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "比较兔与狼，用犬齿解释二者取食差异。",
      "steps": [
        {
          "title": "明确条件",
          "text": "先确定有无发达犬齿。"
        },
        {
          "title": "观察或依据",
          "text": "犬齿适于刺入和撕裂食物。"
        },
        {
          "title": "推理与表达",
          "text": "将狼的发达犬齿与食肉特点联系。"
        }
      ],
      "answer": "狼发达的犬齿利于撕裂食物，兔通常无犬齿。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "兔和狼的牙齿"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-microbe-distribution",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第三章 微生物",
    "title": "检测环境中的细菌和真菌",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "理解接种、对照与菌落，并规范比较微生物分布。",
    "apparatus": [
      "经教师准备的密闭培养皿",
      "无菌取样用品",
      "记录表"
    ],
    "steps": [
      "保持培养条件一致，设置未接种对照。",
      "只改变取样位置或洗手条件。",
      "密闭观察形态，按统一标准记录。"
    ],
    "observations": [
      "不同样本可能出现不同菌落；对照可检查污染。",
      "菌落是细胞繁殖形成的群体，不能凭颜色判断是否致病。"
    ],
    "conclusion": "环境微生物分布广泛，检测需控制污染并保留对照。",
    "examPoints": [
      "培养前灭菌、冷却后接种",
      "菌落与单个细胞不同"
    ],
    "pitfalls": [
      "不能打开培养后的未知菌落嗅闻",
      "不能将示意菌落数量当真实检测结果"
    ],
    "questions": [
      {
        "q": "未接种对照也长出菌落说明什么？",
        "a": "可能存在灭菌不充分或操作污染，应检查操作，不能直接归因于待测样本。"
      }
    ],
    "safety": [
      "仅教师监督的学校实验；培养后始终密封，由教师统一灭菌处置。"
    ],
    "model": "microbe",
    "modelNote": "只在屏幕中模拟密闭培养或食品发酵的条件与现象。菌落图案不是实测菌落数，也不能用于鉴定病原体或判定食品安全。",
    "controls": [
      {
        "key": "sample",
        "label": "取样条件",
        "value": "air",
        "options": [
          {
            "value": "air",
            "label": "空气暴露"
          },
          {
            "value": "washed",
            "label": "规范洗手后"
          },
          {
            "value": "unwashed",
            "label": "未洗手"
          },
          {
            "value": "sealed",
            "label": "未接种对照"
          }
        ]
      },
      {
        "key": "day",
        "label": "观察日序",
        "min": 0,
        "max": 5,
        "value": 2,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "洗手前后皿不同，未接种皿也出现大量菌落，能可靠比较吗？",
      "steps": [
        {
          "title": "明确条件",
          "text": "对照应检验背景污染。"
        },
        {
          "title": "观察或依据",
          "text": "对照异常表示体系可能被污染。"
        },
        {
          "title": "推理与表达",
          "text": "需改善操作并重新比较。"
        }
      ],
      "answer": "证据不可靠，应查明污染并重做。"
    },
    "ncetIds": [
      10
    ],
    "evidenceTitles": [
      "检测环境中的细菌和真菌"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-bacteria",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第三章 微生物",
    "title": "观察细菌的基本结构",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7up-text"
    ],
    "objective": "比较细菌与真核细胞，理解无成形细胞核。",
    "apparatus": [
      "细菌结构模型",
      "显微照片资料"
    ],
    "steps": [
      "先辨认细胞壁、细胞膜与细胞质。",
      "定位遗传物质集中的区域。",
      "比较有无成形细胞核及其他结构。"
    ],
    "observations": [
      "细菌有DNA，但没有由核膜包围的成形细胞核。",
      "并非所有细菌都具有鞭毛或荚膜。"
    ],
    "conclusion": "细菌是单细胞原核生物，不能把“无成形细胞核”等同“无遗传物质”。",
    "examPoints": [
      "原核与真核区别",
      "形态不是致病性判断标准"
    ],
    "pitfalls": [
      "不能认为细菌都对人有害"
    ],
    "questions": [
      {
        "q": "细菌没有成形细胞核，还能遗传吗？",
        "a": "能，其遗传物质可以复制并传给子代。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "shape",
        "label": "形态",
        "value": "coccus",
        "options": [
          {
            "value": "coccus",
            "label": "球状"
          },
          {
            "value": "rod",
            "label": "杆状"
          },
          {
            "value": "spiral",
            "label": "螺旋状"
          }
        ]
      },
      {
        "key": "view",
        "label": "观察层次",
        "value": "whole",
        "options": [
          {
            "value": "whole",
            "label": "整体"
          },
          {
            "value": "detail",
            "label": "局部结构"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "判断“细菌无成形细胞核，所以没有DNA”。",
      "steps": [
        {
          "title": "明确条件",
          "text": "区分细胞核结构与遗传物质。"
        },
        {
          "title": "观察或依据",
          "text": "细菌有DNA，只是不位于成形细胞核中。"
        },
        {
          "title": "推理与表达",
          "text": "指出因果推断错误。"
        }
      ],
      "answer": "说法错误；细菌具有DNA，但没有成形细胞核。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "细菌的基本结构"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-fungi",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第三章 微生物",
    "title": "观察酵母菌和霉菌",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "比较单细胞真菌与菌丝构成的真菌。",
    "apparatus": [
      "酵母菌教学液或永久装片",
      "霉菌永久装片",
      "显微镜"
    ],
    "steps": [
      "规范制片并由低倍观察。",
      "观察酵母细胞、芽体及染色后的细胞核。",
      "用永久装片观察霉菌菌丝和孢子结构。"
    ],
    "observations": [
      "酵母菌常呈卵圆形，可见出芽。",
      "霉菌由菌丝构成，可形成孢子。"
    ],
    "conclusion": "真菌有成形细胞核，通常不能通过光合作用制造有机物。",
    "examPoints": [
      "酵母菌是真菌不是细菌",
      "出芽与孢子繁殖"
    ],
    "pitfalls": [
      "不能凭绿色就说霉菌有叶绿体"
    ],
    "questions": [
      {
        "q": "酵母菌与细菌最重要的结构区别是什么？",
        "a": "酵母菌具有成形细胞核，细菌没有。"
      }
    ],
    "safety": [
      "使用教师准备材料；不培养、打开或吸入未知霉菌孢子。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "eyepiece",
        "label": "目镜",
        "min": 5,
        "max": 15,
        "value": 10,
        "step": 5,
        "unit": "倍"
      },
      {
        "key": "objective",
        "label": "物镜",
        "value": "10",
        "options": [
          {
            "value": "4",
            "label": "4倍"
          },
          {
            "value": "10",
            "label": "10倍"
          },
          {
            "value": "40",
            "label": "40倍"
          }
        ]
      },
      {
        "key": "focus",
        "label": "细准焦位置",
        "min": -5,
        "max": 5,
        "value": 0,
        "step": 1,
        "unit": ""
      },
      {
        "key": "specimen",
        "label": "材料",
        "value": "yeast",
        "options": [
          {
            "value": "yeast",
            "label": "酵母菌"
          },
          {
            "value": "mold",
            "label": "霉菌永久装片"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "显微图见卵圆细胞旁有小芽体，能否据此说是细菌分裂？",
      "steps": [
        {
          "title": "明确条件",
          "text": "结合细胞形态和出芽现象。"
        },
        {
          "title": "观察或依据",
          "text": "酵母菌可通过出芽产生后代。"
        },
        {
          "title": "推理与表达",
          "text": "还需细胞核等信息共同确认。"
        }
      ],
      "answer": "现象符合酵母菌出芽，不能直接判为细菌分裂。"
    },
    "ncetIds": [
      11
    ],
    "evidenceTitles": [
      "观察酵母菌和霉菌"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-fermentation",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第三章 微生物",
    "title": "利用细菌或真菌制作发酵食品",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "比较不同发酵食品所利用的微生物及主要代谢特点。",
    "apparatus": [
      "食品级菌种",
      "模型容器",
      "条件记录表"
    ],
    "steps": [
      "明确食品种类与合适菌种。",
      "保持原料等条件一致，设置对照。",
      "记录膨胀、凝乳或酸度变化，并区分模型与实测。"
    ],
    "observations": [
      "酵母产生气体可使面团膨松；乳酸菌产酸可促使乳凝固。",
      "低温通常减慢发酵，高温处理可影响菌种活性。"
    ],
    "conclusion": "发酵依赖适合的微生物和条件，成品外观不能保证食用安全。",
    "examPoints": [
      "对照与重复",
      "泡菜亚硝酸盐需检测而非凭颜色估计"
    ],
    "pitfalls": [
      "不是所有发酵都产酒精",
      "本模拟不能认证食品安全"
    ],
    "questions": [
      {
        "q": "面团膨胀为什么不能证明只有无氧呼吸？",
        "a": "酵母在有氧和无氧条件下都能产生二氧化碳，需结合供氧等条件判断。"
      }
    ],
    "safety": [
      "页面仅作方案模拟；实物食品制作由教师或家长按卫生规范指导，实验培养物不得食用。"
    ],
    "model": "microbe",
    "modelNote": "只在屏幕中模拟密闭培养或食品发酵的条件与现象。菌落图案不是实测菌落数，也不能用于鉴定病原体或判定食品安全。",
    "controls": [
      {
        "key": "product",
        "label": "发酵项目",
        "value": "bread",
        "options": [
          {
            "value": "bread",
            "label": "比较面包酵母发酵"
          },
          {
            "value": "yogurt",
            "label": "酸奶装置"
          },
          {
            "value": "pickle",
            "label": "泡菜条件"
          }
        ]
      },
      {
        "key": "temperature",
        "label": "温度条件",
        "value": "cold",
        "options": [
          {
            "value": "cold",
            "label": "偏低"
          },
          {
            "value": "suitable",
            "label": "适宜"
          },
          {
            "value": "hot",
            "label": "高温处理"
          }
        ]
      },
      {
        "key": "culture",
        "label": "接种",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "合适的食品菌种"
          },
          {
            "value": "no",
            "label": "未接种对照"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "比较两种食品酵母发酵效果，应怎样控制条件？",
      "steps": [
        {
          "title": "明确条件",
          "text": "只改变酵母菌种。"
        },
        {
          "title": "观察或依据",
          "text": "面粉量、加水量、温度和时间等保持一致。"
        },
        {
          "title": "推理与表达",
          "text": "比较相同时间的面团体积或收集气体体积，并设置重复。"
        }
      ],
      "answer": "以菌种为唯一变量，在相同条件下重复比较发酵指标。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "利用细菌或真菌制作发酵食品"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-classification",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第四章 生物的分类",
    "title": "对植物和动物进行分类",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7up-text"
    ],
    "objective": "选择稳定的多项特征建立分类路径。",
    "apparatus": [
      "生物特征卡",
      "分类检索表"
    ],
    "steps": [
      "列出每个对象的关键特征。",
      "选择互斥的判断条件逐级分类。",
      "用新对象检查分类表能否得到一致结果。"
    ],
    "observations": [
      "只按栖息地容易将不同类群混在一起。",
      "越低的分类单位通常共同特征越多。"
    ],
    "conclusion": "科学分类以形态结构、生理和繁殖等特征为基础。",
    "examPoints": [
      "分类单位",
      "检索表每步条件清楚"
    ],
    "pitfalls": [
      "不能按有益或有害作为稳定自然分类"
    ],
    "questions": [
      {
        "q": "鲸与鲫鱼都在水中，为何不归入同类？",
        "a": "鲸用肺呼吸、胎生哺乳，鲫鱼用鳃呼吸等，关键特征不同。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "group",
        "label": "分类任务",
        "value": "plants",
        "options": [
          {
            "value": "plants",
            "label": "植物类群"
          },
          {
            "value": "animals",
            "label": "动物类群"
          }
        ]
      },
      {
        "key": "criterion",
        "label": "第一项判断",
        "value": "structure",
        "options": [
          {
            "value": "structure",
            "label": "形态与繁殖特征"
          },
          {
            "value": "habitat",
            "label": "只看生活环境"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "以“是否生活在水中”作为鱼类唯一标准是否可靠？",
      "steps": [
        {
          "title": "明确条件",
          "text": "列举同环境不同类群的反例。"
        },
        {
          "title": "观察或依据",
          "text": "鲸等水生哺乳动物也生活在水中。"
        },
        {
          "title": "推理与表达",
          "text": "改用鳃、鳍等结合生殖的多项证据。"
        }
      ],
      "answer": "不可靠；应依据形态结构和生理特征综合判断。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "对植物进行分类",
      "对动物进行分类"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-resources",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第四章 生物的分类",
    "title": "调查生物资源并制作植物标牌",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7up-text"
    ],
    "objective": "开展生物资源调查，保留鉴定证据并制作准确标牌。",
    "apparatus": [
      "相机与记录表",
      "可靠图鉴",
      "非伤树式标牌"
    ],
    "steps": [
      "确定调查边界和记录项目。",
      "拍照观察，不采集受保护物种。",
      "核对名称及特征，为标牌注明信息来源。"
    ],
    "observations": [
      "同物异名或重复记录会影响种数统计。",
      "无法确认的对象应保留待定编号。"
    ],
    "conclusion": "资源调查应可追溯，物种数量不能代替全部生物多样性指标。",
    "examPoints": [
      "调查对象与范围明确",
      "不确定性如实记录"
    ],
    "pitfalls": [
      "不能将个体数当种数",
      "不能随意在树干钉钉挂牌"
    ],
    "questions": [
      {
        "q": "尚未鉴定的对象应如何处理？",
        "a": "记录照片、地点与特征，保留待定编号，不强行编造名称。"
      }
    ],
    "safety": [
      "野外调查结伴并遵守边界；不采食野生菌或未知植物。"
    ],
    "model": "survey",
    "modelNote": "场景中的数量为可编辑的教学样本；统计结论只适用于该样本，不能冒充校园、地区或人群的实测结果。",
    "controls": [
      {
        "key": "identified",
        "label": "已确认种数",
        "min": 0,
        "max": 80,
        "value": 18,
        "step": 1,
        "unit": ""
      },
      {
        "key": "unknown",
        "label": "待鉴定种数",
        "min": 0,
        "max": 30,
        "value": 4,
        "step": 1,
        "unit": ""
      },
      {
        "key": "plots",
        "label": "调查样区数",
        "min": 1,
        "max": 20,
        "value": 3,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "确认18种、4个待定类型，能报告22个已确认物种吗？",
      "steps": [
        {
          "title": "明确条件",
          "text": "区分已确认种与待定类型。"
        },
        {
          "title": "观察或依据",
          "text": "待定类型可能包含重复种。"
        },
        {
          "title": "推理与表达",
          "text": "分别报告18种及4个待鉴定类型。"
        }
      ],
      "answer": "不能；应分别报告已确认种与待定记录。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "调查本地区的某种生物资源",
      "给校园内的植物挂牌",
      "调查当地食用菌的种类及生产情况"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-yeast-compare",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第三章 微生物",
    "title": "收集酵母来源信息并比较面包酵母的发酵效果",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "记录本地食品级酵母的来源，在相同条件下用重复实验比较产气量，区分数值差异与因果证据。",
    "apparatus": [
      "食品级面包酵母A、B及来源记录",
      "相同容器和相同糖溶液",
      "教师设置的低压集气或气体注射器装置",
      "恒定温度条件与计时器",
      "至少三次独立重复记录"
    ],
    "steps": [
      "向合规供应者收集当地面包酵母的来源、批次和保存信息，样品由教师确认适用；未知环境菌的分离、纯化和鉴定交给专业实验室。",
      "以相同酵母用量、糖液体积、温度、反应时间和装置比较A、B；具体规范化方式写入记录。",
      "为每一来源安排三次独立重复，检查装置漏气，按相同标准记录产气体积。",
      "输入六次实际记录或明确标注的练习数值，计算均值并保留各次差异；若其他条件不同，只描述结果，不把差异全归于酵母来源。"
    ],
    "observations": [
      "相同来源的重复结果也可能波动，均值不能替代原始记录。",
      "漏气、接种量或反应时间不一致都可能改变所收集的气体体积。",
      "相同条件下平均产气量较大，仅支持该比较条件下产气表现较高。"
    ],
    "conclusion": "受控的重复比较能评价特定条件下的发酵表现，不能由一次产气或菌种名称判断所有用途的优劣。",
    "examPoints": [
      "单一变量、对照与独立重复",
      "平均数等于各次记录之和除以次数",
      "气体体积的比较需统一时间及测量条件"
    ],
    "pitfalls": [
      "不同时间收集的气体体积不能直接比较",
      "同一瓶连续读三次不等于三份独立重复",
      "默认0是待输入位置，不能当作已经测得零产气",
      "不能把未知环境菌自行用于制作食品"
    ],
    "questions": [
      {
        "q": "A组放了更多酵母且平均产气更大，能说明A菌种更好吗？",
        "a": "不能。酵母用量也发生变化，来源与用量的作用混在一起，应统一用量后再比较。"
      }
    ],
    "safety": [
      "仅使用来源清楚的食品级酵母，实验材料不食用。",
      "未知来源菌的采集、分离和纯化需专业条件；学生不自行培养未知微生物。",
      "产气装置不能刚性密闭积压，按教师的低压实验规范操作。"
    ],
    "model": "microbe",
    "modelNote": "六个体积由用户录入，初始0表示待填写，非实测或预测。程序只计算两个算术平均数和差值，不生成产气数据；控制条件不一致时不作来源导致差异的推断。",
    "controls": [
      {
        "key": "a1",
        "label": "A组第1次气体体积记录",
        "min": 0,
        "max": 100,
        "value": 0,
        "step": 1,
        "unit": "mL"
      },
      {
        "key": "a2",
        "label": "A组第2次气体体积记录",
        "min": 0,
        "max": 100,
        "value": 0,
        "step": 1,
        "unit": "mL"
      },
      {
        "key": "a3",
        "label": "A组第3次气体体积记录",
        "min": 0,
        "max": 100,
        "value": 0,
        "step": 1,
        "unit": "mL"
      },
      {
        "key": "b1",
        "label": "B组第1次气体体积记录",
        "min": 0,
        "max": 100,
        "value": 0,
        "step": 1,
        "unit": "mL"
      },
      {
        "key": "b2",
        "label": "B组第2次气体体积记录",
        "min": 0,
        "max": 100,
        "value": 0,
        "step": 1,
        "unit": "mL"
      },
      {
        "key": "b3",
        "label": "B组第3次气体体积记录",
        "min": 0,
        "max": 100,
        "value": 0,
        "step": 1,
        "unit": "mL"
      },
      {
        "key": "samecondition",
        "label": "除酵母来源外的条件",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "已控制一致"
          },
          {
            "value": "no",
            "label": "存在其他差异"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "明确为练习数据：A组三次为12、14、16 mL；B组为18、20、22 mL，其他条件相同。",
      "steps": [
        {
          "title": "明确条件",
          "text": "每组均为三份独立重复，集气时间及温度条件相同。"
        },
        {
          "title": "观察或依据",
          "text": "A均值=(12+14+16)÷3=14 mL；B均值=(18+20+22)÷3=20 mL。"
        },
        {
          "title": "推理与表达",
          "text": "B比A平均多6 mL；只解释为本次给定条件下的产气差异，不能断言所有条件下都更好。"
        }
      ],
      "answer": "练习数据中A均值14 mL、B均值20 mL，B高6 mL；结论限定于相同实验条件。"
    },
    "ncetIds": [
      54
    ],
    "evidenceTitles": [
      "利用细菌或真菌制作发酵食品"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "yeast-compare",
      "dataMode": "entered-records",
      "replicates": 3
    }
  },
  {
    "id": "bio-pickle",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第三章 微生物",
    "title": "比较泡菜制作条件与亚硝酸盐检测记录",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "区分发酵现象与化学检测，把同一时点的处理组和对照组亚硝酸盐记录作有限比较。",
    "apparatus": [
      "教师审查的单因素方案",
      "处理组与对照组的独立取样计划",
      "经合适方法获得的检测记录或明确标注的练习数据",
      "单位为mg/kg的记录表",
      "密闭观察的泡菜装置示意"
    ],
    "steps": [
      "从盐度、温度或供氧中只选择一个研究条件，统一蔬菜来源、配料、容器和取样标准，并设置独立重复。",
      "制作及取样由具备条件的教师或专业人员按卫生规范实施；不凭气味、气泡或颜色判断亚硝酸盐。",
      "在第1、3、5天分别记录两组用同一合适方法获得的检测结果，注明检出限、样本编号和单位。",
      "把六个记录输入网页，比较同日差值并查看变化；区分三个取样时点与三份独立重复。"
    ],
    "observations": [
      "发酵产生气泡或酸味不等于测出了亚硝酸盐浓度。",
      "同一时点的两组检测值可以比较，但单份样本不足以排除随机误差。",
      "三个日期的记录只能描述这些日期，不能自动填补中间天数或预测以后浓度。"
    ],
    "conclusion": "条件对亚硝酸盐的影响需要受控取样和可靠检测支持；发酵天数、盐度、酸味和单项检测值都不能单独证明食品可安全食用。",
    "examPoints": [
      "控制变量与同日对照",
      "检测值、检出限和未检出不可混同",
      "变化趋势和因果结论的证据不同"
    ],
    "pitfalls": [
      "默认0不是实际检测结果，“未检出”也不等于绝对为0",
      "不预设浓度必然先升后降，也不由天数编造曲线",
      "不能把处理组较低直接写成符合全部食品安全要求",
      "三个时间点不是三次独立重复"
    ],
    "questions": [
      {
        "q": "第5天比第1天数值低，能断言第5天的泡菜可以食用吗？",
        "a": "不能。这里只比较了亚硝酸盐的一项记录，检测质量、适用标准及其他食品安全因素仍需核查。"
      }
    ],
    "safety": [
      "网页仅用于方案与记录分析；实验食品不得品尝。",
      "化学检测试剂、取样和废液由教师或专业人员按规程处理；不在家自行配制试剂。"
    ],
    "model": "microbe",
    "modelNote": "t1/t2/t3与c1/c2/c3分别是第1、3、5天处理组和对照组的输入记录。程序仅显示输入点及同日差值；选择盐度、温度或供氧不会自动产生浓度。初始0为待填写值，不是检测结论；不输出食用安全判断。",
    "controls": [
      {
        "key": "day",
        "label": "查看记录时点",
        "value": "1",
        "options": [
          {
            "value": "1",
            "label": "第1天"
          },
          {
            "value": "3",
            "label": "第3天"
          },
          {
            "value": "5",
            "label": "第5天"
          }
        ]
      },
      {
        "key": "t1",
        "label": "处理组第1天检测值",
        "min": 0,
        "max": 50,
        "value": 0,
        "step": 0.5,
        "unit": "mg/kg"
      },
      {
        "key": "t2",
        "label": "处理组第3天检测值",
        "min": 0,
        "max": 50,
        "value": 0,
        "step": 0.5,
        "unit": "mg/kg"
      },
      {
        "key": "t3",
        "label": "处理组第5天检测值",
        "min": 0,
        "max": 50,
        "value": 0,
        "step": 0.5,
        "unit": "mg/kg"
      },
      {
        "key": "c1",
        "label": "对照组第1天检测值",
        "min": 0,
        "max": 50,
        "value": 0,
        "step": 0.5,
        "unit": "mg/kg"
      },
      {
        "key": "c2",
        "label": "对照组第3天检测值",
        "min": 0,
        "max": 50,
        "value": 0,
        "step": 0.5,
        "unit": "mg/kg"
      },
      {
        "key": "c3",
        "label": "对照组第5天检测值",
        "min": 0,
        "max": 50,
        "value": 0,
        "step": 0.5,
        "unit": "mg/kg"
      },
      {
        "key": "treatment",
        "label": "仅改变的条件",
        "value": "salt",
        "options": [
          {
            "value": "salt",
            "label": "盐度条件"
          },
          {
            "value": "temperature",
            "label": "温度条件"
          },
          {
            "value": "oxygen",
            "label": "供氧条件"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "假设练习：第3天处理组为8 mg/kg，对照组为12 mg/kg，两组其他条件相同。",
      "steps": [
        {
          "title": "明确条件",
          "text": "所给数值是题目假设，不是网页生成的真实检测结果。"
        },
        {
          "title": "观察或依据",
          "text": "同日差值=处理组−对照组=8−12=−4 mg/kg。"
        },
        {
          "title": "推理与表达",
          "text": "本次处理组低4 mg/kg；仍需独立重复与可靠检测，不能据此宣布可食用或预测第5天数值。"
        }
      ],
      "answer": "该时点处理组比对照组低4 mg/kg；这是一项样本比较，不是食品安全判定。"
    },
    "ncetIds": [
      56
    ],
    "evidenceTitles": [
      "利用细菌或真菌制作发酵食品"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "pickle",
      "samplingDays": [
        1,
        3,
        5
      ],
      "dataMode": "entered-records",
      "concentrationUnit": "mg/kg"
    }
  },
  {
    "id": "bio-yogurt",
    "subject": "biology",
    "term": "7上",
    "chapter": "第二单元 第三章 微生物",
    "title": "设计酸奶发酵装置并分析凝乳与pH记录",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7up-text",
      "bio-ncet2023"
    ],
    "objective": "设计可比较的酸奶发酵方案，联系乳酸菌产酸、凝乳现象与输入的pH记录。",
    "apparatus": [
      "食品级乳原料与合适发酵菌种资料",
      "相同容器及可靠的温度控制装置",
      "温度计、计时器",
      "校准后的pH测量工具",
      "处理组和对照组记录表"
    ],
    "steps": [
      "根据所用食品菌种的资料选择条件，绘制保温、测温、取样和记录装置图。",
      "按教师卫生规程准备同批原料与器具，除是否接种外保持条件一致；同时间观察平行对照。",
      "记录温度、时间、凝乳现象和pH测量值，不让打开容器的次数成为新的变量。",
      "比较证据是否支持菌种产酸，并说明未设置对照、污染或温度不合适会怎样限制推断。"
    ],
    "observations": [
      "合适且有活性的乳酸菌在适宜条件下可产酸，乳中蛋白质随酸度变化可能形成凝乳。",
      "偏低温度通常使过程较慢，高温处理可能损伤所用菌种；具体温度需查菌种资料。",
      "pH数值较低表示更酸，不能由一次pH读数确定所有微生物状态或食用安全。"
    ],
    "conclusion": "发酵现象的解释需要适当对照和条件记录；凝乳、pH或卫生选项均不能代替食品安全检验。",
    "examPoints": [
      "乳酸菌与酵母菌的用途不同",
      "控制接种以外的条件并保留未接种对照",
      "观察结果与推断分别表述"
    ],
    "pitfalls": [
      "没有接种不等于容器一定没有微生物",
      "凝固不一定只由正常乳酸发酵引起",
      "不能将pH降低的数值直接当作酸含量增加的倍数",
      "网页勾选“卫生规范”不构成实际食品安全证明"
    ],
    "questions": [
      {
        "q": "接种组凝乳而对照组未凝乳，就能保证接种组安全食用吗？",
        "a": "不能。这一比较支持相应发酵作用的解释，不能排除污染或其他食品安全问题。"
      }
    ],
    "safety": [
      "只分析教师许可的食品发酵方案；实验样品不食用。",
      "加热、保温电器及清洁消毒操作由教师监督；乳过敏者不接触相关样品。"
    ],
    "model": "microbe",
    "modelNote": "凝乳画面是定性条件示意；pH来自用户输入，不根据温度或接种自动预测。默认pH6.5只是可编辑练习初值。卫生与对照选项改变证据评价，不生成“可食用”或“无菌”判断。",
    "controls": [
      {
        "key": "culture",
        "label": "接种条件",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "合适且有活性的食品发酵菌种"
          },
          {
            "value": "no",
            "label": "未接种"
          }
        ]
      },
      {
        "key": "temperature",
        "label": "温度条件",
        "value": "suitable",
        "options": [
          {
            "value": "cold",
            "label": "偏低"
          },
          {
            "value": "suitable",
            "label": "适合所用菌种"
          },
          {
            "value": "hot",
            "label": "高温处理"
          }
        ]
      },
      {
        "key": "control",
        "label": "平行对照",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "另设未接种对照"
          },
          {
            "value": "no",
            "label": "未设置对照"
          }
        ]
      },
      {
        "key": "ph",
        "label": "实际记录或练习pH",
        "min": 3,
        "max": 7.5,
        "value": 6.5,
        "step": 0.1,
        "unit": ""
      },
      {
        "key": "hygiene",
        "label": "器具与操作记录",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "有规范卫生操作记录"
          },
          {
            "value": "no",
            "label": "缺少记录或有污染疑点"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "练习记录：同批乳在同温同时间下，接种组pH4.5并凝乳，未接种对照pH6.5未凝乳。",
      "steps": [
        {
          "title": "明确条件",
          "text": "只改变是否接种，记录本身为题目给定的假设。"
        },
        {
          "title": "观察或依据",
          "text": "接种组更酸，并出现与产酸相关的凝乳现象。"
        },
        {
          "title": "推理与表达",
          "text": "这些证据支持所接种菌种参与发酵，但不能仅据pH和外观宣布食品合格。"
        }
      ],
      "answer": "在给定对照条件下，结果支持菌种产酸促成凝乳；不能作食用安全结论。"
    },
    "ncetIds": [
      55
    ],
    "evidenceTitles": [
      "利用细菌或真菌制作发酵食品"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "yogurt",
      "dataMode": "qualitative-with-entered-ph"
    }
  },
  {
    "id": "bio-pond",
    "subject": "biology",
    "term": "7上",
    "chapter": "第一单元 第三章 从细胞到生物体",
    "title": "观察池塘水中的微小生物",
    "kind": "学生实验",
    "tags": [
      "课标拓展",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023"
    ],
    "objective": "用显微观察区分水中微小生物的结构特点，并如实记录取样条件。",
    "apparatus": [
      "教师提供的安全池塘水样或教学培养液",
      "滴管、载玻片与盖玻片",
      "棉纤维",
      "显微镜"
    ],
    "steps": [
      "记录取样位置、时间与水样编号；不同位置分别编号，不能预定各自必有哪种生物。",
      "取少量水样制成临时装片，用低倍镜逐区寻找。",
      "对运动较快的材料可按教师指导用少量棉纤维限制运动。",
      "记录形态、颜色及运动特点，用资料检索；不凭一次观察判定水质。"
    ],
    "observations": [
      "草履虫外形较长，依靠纤毛运动；眼虫常有叶绿体并能运动。",
      "衣藻通常为单细胞，水绵为丝状多细胞藻类。",
      "真实水样不保证出现本页全部示意对象。"
    ],
    "conclusion": "池塘水中可有多种微小生物；取样与放大观察帮助发现肉眼难辨的结构。",
    "examPoints": [
      "观察和推测应分开",
      "不能按是否运动区分植物和动物",
      "取样条件会影响可见对象"
    ],
    "pitfalls": [
      "没有看到不等于水中不存在",
      "不能根据颜色或一次视野判断饮水安全"
    ],
    "questions": [
      {
        "q": "表层水样没有看到草履虫，能否断言池塘没有草履虫？",
        "a": "不能。取样范围有限，生物分布不均，还受标本厚度、照明和观察时间等影响。"
      }
    ],
    "safety": [
      "不自行进入水体取样；培养液不入口、不接触伤口，废液按教师要求处理。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "eyepiece",
        "label": "目镜",
        "min": 5,
        "max": 15,
        "value": 10,
        "step": 5,
        "unit": "倍"
      },
      {
        "key": "objective",
        "label": "物镜",
        "value": "10",
        "options": [
          {
            "value": "4",
            "label": "4倍"
          },
          {
            "value": "10",
            "label": "10倍"
          },
          {
            "value": "40",
            "label": "40倍"
          }
        ]
      },
      {
        "key": "focus",
        "label": "细准焦位置",
        "min": -5,
        "max": 5,
        "value": 0,
        "step": 1,
        "unit": ""
      },
      {
        "key": "organism",
        "label": "示意观察对象",
        "value": "paramecium",
        "options": [
          {
            "value": "paramecium",
            "label": "草履虫"
          },
          {
            "value": "euglena",
            "label": "眼虫"
          },
          {
            "value": "chlamydomonas",
            "label": "衣藻"
          },
          {
            "value": "spirogyra",
            "label": "水绵"
          }
        ]
      },
      {
        "key": "sample",
        "label": "取样位置",
        "value": "surface",
        "options": [
          {
            "value": "surface",
            "label": "表层水样"
          },
          {
            "value": "middle",
            "label": "中层水样"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "某水样中观察到连续排列的细胞丝，细胞内呈带状绿色结构，应如何记录？",
      "steps": [
        {
          "title": "明确条件",
          "text": "先客观描述丝状、细胞边界和绿色结构，不先写物种结论。"
        },
        {
          "title": "观察或依据",
          "text": "水绵的丝状结构及螺旋状叶绿体可作为检索线索。"
        },
        {
          "title": "推理与表达",
          "text": "结合多个视野和资料核对，保留鉴定的不确定性。"
        }
      ],
      "answer": "可暂记为具有螺旋状叶绿体的丝状藻类，进一步核对是否为水绵；不能据此判断整个水样安全。"
    },
    "ncetIds": [
      2
    ],
    "evidenceTitles": [],
    "evidenceStatus": "2023基本目录已核对；本网站学期归类",
    "config": {
      "specimen": "pond"
    }
  },
  {
    "id": "bio-germination",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第一章 被子植物的一生",
    "title": "探究种子萌发的环境条件",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "用对照实验区分萌发的外界条件与种子自身条件。",
    "apparatus": [
      "同批同种种子",
      "相同培养容器",
      "清水与吸水材料",
      "温度记录表"
    ],
    "steps": [
      "选择同批饱满种子并等量分组。",
      "分别改变水分或温度，设置适宜条件组作对照。",
      "在相同观察时段记录萌发数量，重复观察后比较。"
    ],
    "observations": [
      "适量水、适宜温度和充足空气有利于具有活力且不休眠的种子萌发。",
      "完全浸没时空气供应受到限制；具备外界条件仍不一定全部萌发。"
    ],
    "conclusion": "种子萌发既需要适宜环境，也需要胚完整、有活力并解除休眠。",
    "examPoints": [
      "一次比较只改变一个因素",
      "水过多会限制氧气供应",
      "对照组其他条件必须适宜"
    ],
    "pitfalls": [
      "不能把“有水”写成“水越多越好”",
      "不能用不同品种或不同活力的种子比较温度"
    ],
    "questions": [
      {
        "q": "两组同时改变水量和温度，能说明哪个因素影响萌发吗？",
        "a": "不能明确归因，需分别设计只改变水量或只改变温度的对照。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "germination",
    "modelNote": "采用条件逻辑说明种子萌发，不给出适用于所有种类的温度阈值或真实生长速度；动画时间不是萌发所需天数。",
    "controls": [
      {
        "key": "moisture",
        "label": "水分条件",
        "value": "damp",
        "options": [
          {
            "value": "dry",
            "label": "干燥"
          },
          {
            "value": "damp",
            "label": "适量水"
          },
          {
            "value": "submerged",
            "label": "完全浸没"
          }
        ]
      },
      {
        "key": "temperature",
        "label": "温度条件",
        "value": "suitable",
        "options": [
          {
            "value": "cold",
            "label": "偏低"
          },
          {
            "value": "suitable",
            "label": "适宜"
          },
          {
            "value": "hot",
            "label": "过高"
          }
        ]
      },
      {
        "key": "viable",
        "label": "种子状态",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "完整、有活力且不休眠"
          },
          {
            "value": "no",
            "label": "胚已失去活力"
          },
          {
            "value": "dormant",
            "label": "仍处于休眠"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "甲乙各放相同数量同批种子，甲湿润且通气，乙完全浸没，温度相同，甲萌发较多。",
      "steps": [
        {
          "title": "明确条件",
          "text": "种子批次、数量与温度相同，主要差异是氧气供应。"
        },
        {
          "title": "观察或依据",
          "text": "浸没会限制种子获得空气，而不是简单表示“缺水”。"
        },
        {
          "title": "推理与表达",
          "text": "在该实验条件下，结果支持充足空气有利于种子萌发。"
        }
      ],
      "answer": "该比较支持空气供应影响种子萌发；不能据此判断所有种子的需光性。"
    },
    "ncetIds": [
      21
    ],
    "evidenceTitles": [
      "探究种子萌发的环境条件"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "conditions"
    }
  },
  {
    "id": "bio-germination-rate",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第一章 被子植物的一生",
    "title": "测定种子发芽率",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7down-text"
    ],
    "objective": "用抽样与百分率评价一批种子的发芽情况。",
    "apparatus": [
      "待测种子",
      "随机取样工具",
      "培养容器",
      "计数记录表"
    ],
    "steps": [
      "从待测种子中随机取样，避免只挑大的种子。",
      "按该种子的合适条件培养并统一判定萌发。",
      "累计萌发数量，按样本总数计算并说明样本范围。"
    ],
    "observations": [
      "同一粒种子应只计数一次。",
      "抽样结果存在随机差异，多组样本有助于判断结果是否稳定。"
    ],
    "conclusion": "发芽率等于样本中发芽种子数除以样本种子总数再乘100%。",
    "examPoints": [
      "样本随机且数量合理",
      "百分率分母为参加测定的总粒数",
      "发芽数不能大于样本数"
    ],
    "pitfalls": [
      "不能删除未发芽种子后再算分母",
      "小样本的结果不保证等于整批种子的真实发芽率"
    ],
    "questions": [
      {
        "q": "为什么不应只选饱满的大粒种子？",
        "a": "这样会造成选择偏差，所得结果可能不能代表待测整批种子。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "survey",
    "modelNote": "场景中的数量为可编辑的教学样本；统计结论只适用于该样本，不能冒充校园、地区或人群的实测结果。",
    "controls": [
      {
        "key": "total",
        "label": "抽样种子数",
        "min": 10,
        "max": 200,
        "value": 100,
        "step": 10,
        "unit": "粒"
      },
      {
        "key": "sprouted",
        "label": "已萌发种子数",
        "min": 0,
        "max": 200,
        "value": 92,
        "step": 1,
        "unit": "粒"
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "教学样例：随机取100粒种子，按统一标准判定其中92粒发芽。",
      "steps": [
        {
          "title": "明确条件",
          "text": "记录的92粒包含在100粒样本中。"
        },
        {
          "title": "观察或依据",
          "text": "发芽率=发芽数÷总数×100%。"
        },
        {
          "title": "推理与表达",
          "text": "92÷100×100%=92%。"
        }
      ],
      "answer": "该样本发芽率为92%，不等同于证明整批种子恰有92%能发芽。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "测定种子发芽率"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "germination-rate",
      "synthetic": true
    }
  },
  {
    "id": "bio-root",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第一章 被子植物的一生",
    "title": "观察根尖的结构",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "辨认根尖不同区域，并联系吸收与伸长功能。",
    "apparatus": [
      "幼根或根尖永久装片",
      "显微镜",
      "放大镜"
    ],
    "steps": [
      "低倍寻找从根尖向上的连续区域。",
      "比较各区细胞的大小、形状与排列。",
      "观察根毛着生区域，画出简要位置关系。"
    ],
    "observations": [
      "分生区细胞通常较小且排列紧密，伸长区细胞明显伸长。",
      "成熟区有根毛，使吸收表面积增大。"
    ],
    "conclusion": "根的生长主要与分生区细胞分裂及伸长区细胞伸长有关，成熟区是吸收水和无机盐的主要部位。",
    "examPoints": [
      "根冠起保护作用",
      "根毛不是侧根",
      "根生长包括数目增加和体积增大"
    ],
    "pitfalls": [
      "不能把根毛所在区说成根冠",
      "不能把分生区分裂与伸长区伸长混为一谈"
    ],
    "questions": [
      {
        "q": "大量根毛为什么有利于吸收？",
        "a": "根毛增加根与周围水和溶解无机盐的接触面积。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "eyepiece",
        "label": "目镜",
        "min": 5,
        "max": 15,
        "value": 10,
        "step": 5,
        "unit": "倍"
      },
      {
        "key": "objective",
        "label": "物镜",
        "value": "10",
        "options": [
          {
            "value": "4",
            "label": "4倍"
          },
          {
            "value": "10",
            "label": "10倍"
          },
          {
            "value": "40",
            "label": "40倍"
          }
        ]
      },
      {
        "key": "focus",
        "label": "细准焦位置",
        "min": -5,
        "max": 5,
        "value": 0,
        "step": 1,
        "unit": ""
      },
      {
        "key": "region",
        "label": "重点区域",
        "value": "mature",
        "options": [
          {
            "value": "cap",
            "label": "根冠"
          },
          {
            "value": "division",
            "label": "分生区"
          },
          {
            "value": "elongation",
            "label": "伸长区"
          },
          {
            "value": "mature",
            "label": "成熟区"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "看到某根尖区域有许多向外延伸的细小突起，该区域的主要功能是什么？",
      "steps": [
        {
          "title": "明确条件",
          "text": "先判断突起是否为根毛。"
        },
        {
          "title": "观察或依据",
          "text": "根毛主要分布于成熟区，并扩大吸收面积。"
        },
        {
          "title": "推理与表达",
          "text": "联系结构与功能，说明其主要吸收水和无机盐。"
        }
      ],
      "answer": "若突起为根毛，该部位属成熟区，主要吸收水和无机盐。"
    },
    "ncetIds": [
      18
    ],
    "evidenceTitles": [
      "观察根尖的结构"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "specimen": "root",
      "variant": "root"
    }
  },
  {
    "id": "bio-mineral",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第一章 被子植物的一生",
    "title": "比较玉米幼苗在蒸馏水和土壤浸出液中的生长状况",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "通过无土条件下的对比，认识无机盐对植物生长的作用。",
    "apparatus": [
      "大小接近的同种玉米幼苗",
      "蒸馏水与土壤浸出液",
      "相同培养容器",
      "生长记录表"
    ],
    "steps": [
      "选取状态相近的幼苗并随机分组。",
      "保持光照、温度、液量和供氧等一致，只改变培养液。",
      "连续记录叶色及生长变化，比较后再解释。"
    ],
    "observations": [
      "在其他条件适宜且观察时间足够时，含适宜无机盐的培养液通常更有利于幼苗生长。",
      "根部缺氧也会影响生长，不能把所有差异都归因于无机盐。"
    ],
    "conclusion": "植物可在没有土壤的条件下生长，但仍需水、适宜无机盐与根部正常呼吸条件。",
    "examPoints": [
      "蒸馏水组用于对照",
      "土壤不是不可替代的营养物质",
      "培养液浓度要适宜"
    ],
    "pitfalls": [
      "不能把“无土栽培”理解成“不需要无机盐”",
      "不能把土壤浸出液中的有机物当作植物主要碳源"
    ],
    "questions": [
      {
        "q": "蒸馏水组短期仍能生长，是否推翻结论？",
        "a": "不能，幼苗可暂时利用自身储存的物质，需观察足够时间并控制其他条件。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "plant",
    "modelNote": "表示植物运输、生长和气孔开闭的机制，不预测真实株高、蒸腾量或个体产量。",
    "controls": [
      {
        "key": "solution",
        "label": "培养液",
        "value": "extract",
        "options": [
          {
            "value": "distilled",
            "label": "蒸馏水"
          },
          {
            "value": "extract",
            "label": "土壤浸出液"
          },
          {
            "value": "nutrient",
            "label": "适宜营养液"
          }
        ]
      },
      {
        "key": "air",
        "label": "根部供氧",
        "value": "adequate",
        "options": [
          {
            "value": "adequate",
            "label": "通气适宜"
          },
          {
            "value": "poor",
            "label": "供氧不足"
          }
        ]
      },
      {
        "key": "day",
        "label": "观察日序",
        "min": 0,
        "max": 14,
        "value": 7,
        "step": 1,
        "unit": "日"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "同种幼苗一组在蒸馏水、一组在适宜营养液中，后者长势较好，能得出什么结论？",
      "steps": [
        {
          "title": "明确条件",
          "text": "确认两组光照、温度、供氧和初始状态相近。"
        },
        {
          "title": "观察或依据",
          "text": "主要变量是培养液中可利用的无机盐。"
        },
        {
          "title": "推理与表达",
          "text": "结果支持无机盐是植物正常生长所需要的条件之一。"
        }
      ],
      "answer": "在其他条件相同且适宜时，结果支持无机盐有利于植物正常生长。"
    },
    "ncetIds": [
      23
    ],
    "evidenceTitles": [
      "比较玉米幼苗在蒸馏水和土壤浸出液中的生长状况"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "mineral"
    }
  },
  {
    "id": "bio-flower",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第一章 被子植物的一生",
    "title": "解剖和观察花的结构",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "辨认花的主要结构，并联系传粉、受精和果实种子形成。",
    "apparatus": [
      "适宜观察的花或教师制备模型",
      "镊子",
      "放大镜",
      "解剖盘"
    ],
    "steps": [
      "先观察花的整体及各部分相对位置。",
      "按由外向内的次序辨认萼片、花瓣、雄蕊和雌蕊。",
      "由教师指导观察子房纵切面，辨认胚珠。"
    ],
    "observations": [
      "花药内形成花粉，子房内含胚珠。",
      "不同植物的花可能缺少某些结构，不能假设每朵花都有完整雄蕊与雌蕊。"
    ],
    "conclusion": "花的主要生殖结构是雄蕊和雌蕊；受精后子房通常发育成果实，胚珠发育成种子。",
    "examPoints": [
      "传粉不等于受精",
      "子房与胚珠的发育去向",
      "受精卵发育成胚"
    ],
    "pitfalls": [
      "不能把花瓣说成花最主要的生殖结构",
      "不能说子房直接发育成胚"
    ],
    "questions": [
      {
        "q": "一个果实内多粒种子通常与哪一结构数量有关？",
        "a": "与原子房中能够成功受精并发育的胚珠数量有关。"
      }
    ],
    "safety": [
      "使用镊子和解剖工具时由教师指导；不采摘保护植物或未知有毒植物。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "part",
        "label": "观察结构",
        "value": "whole",
        "options": [
          {
            "value": "whole",
            "label": "整体"
          },
          {
            "value": "stamen",
            "label": "雄蕊"
          },
          {
            "value": "pistil",
            "label": "雌蕊"
          },
          {
            "value": "ovary",
            "label": "子房与胚珠"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "某花子房内有6个胚珠，其中4个成功受精并正常发育，预期果实内有几粒种子？",
      "steps": [
        {
          "title": "明确条件",
          "text": "以每个正常发育的胚珠形成一粒种子为条件。"
        },
        {
          "title": "观察或依据",
          "text": "种子对应胚珠，不对应花瓣或雄蕊数量。"
        },
        {
          "title": "推理与表达",
          "text": "4个胚珠成功发育，可形成4粒种子。"
        }
      ],
      "answer": "在题设条件下可形成4粒种子。"
    },
    "ncetIds": [
      19
    ],
    "evidenceTitles": [
      "解剖和观察花的结构"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "specimen": "flower",
      "variant": "flower"
    }
  },
  {
    "id": "bio-stem-water",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第二章 植物体内的物质与能量变化",
    "title": "水在茎中的运输",
    "kind": "演示实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7down-text"
    ],
    "objective": "借助染色路径识别水在茎中的运输通道。",
    "apparatus": [
      "适宜的带叶枝条",
      "稀染色水和清水",
      "透明容器",
      "教师制作的切面标本"
    ],
    "steps": [
      "将状态相似枝条分别放入染色水与清水。",
      "在相同条件下静置一段时间，观察叶脉。",
      "由教师制备茎横切及纵切标本，比较染色部位。"
    ],
    "observations": [
      "染色可沿茎内导管区域到达叶脉。",
      "茎的全部组织不一定都被染红。"
    ],
    "conclusion": "水及溶解的无机盐主要经导管运输，根、茎、叶的导管相互连通。",
    "examPoints": [
      "用染色部位追踪路径",
      "导管与筛管功能区别"
    ],
    "pitfalls": [
      "不能说所有红色组织都是活细胞",
      "不能由本实验直接证明有机物运输路径"
    ],
    "questions": [
      {
        "q": "为什么要同时观察横切面与纵切面？",
        "a": "横切面可定位染色区域，纵切面有助于看清沿茎连续的运输通道。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "plant",
    "modelNote": "表示植物运输、生长和气孔开闭的机制，不预测真实株高、蒸腾量或个体产量。",
    "controls": [
      {
        "key": "cut",
        "label": "观察切面",
        "value": "whole",
        "options": [
          {
            "value": "whole",
            "label": "带叶枝条"
          },
          {
            "value": "cross",
            "label": "茎横切面"
          },
          {
            "value": "longitudinal",
            "label": "茎纵切面"
          }
        ]
      },
      {
        "key": "dye",
        "label": "液体",
        "value": "red",
        "options": [
          {
            "value": "red",
            "label": "红色染液"
          },
          {
            "value": "clear",
            "label": "清水对照"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "枝条置于红色水中后，叶脉及茎内某些长管状区域变红，说明什么？",
      "steps": [
        {
          "title": "明确条件",
          "text": "染料随水移动作为路径标记。"
        },
        {
          "title": "观察或依据",
          "text": "染色区域与导管位置相符。"
        },
        {
          "title": "推理与表达",
          "text": "将现象表述为支持水主要沿导管向上运输。"
        }
      ],
      "answer": "该现象支持水主要通过茎内导管运向叶等部位。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "水在茎中的运输"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "stem"
    }
  },
  {
    "id": "bio-leaf",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第二章 植物体内的物质与能量变化",
    "title": "观察叶片的结构",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "练习观察薄切片并辨认表皮、叶肉、叶脉与气孔。",
    "apparatus": [
      "新鲜叶片及永久装片",
      "显微镜",
      "镊子",
      "教师指导使用的切片工具"
    ],
    "steps": [
      "按教师指导制取足够薄的切片，选择透明且完整者。",
      "低倍观察叶片各层次并辨认叶脉。",
      "观察表皮，辨认一对保卫细胞围成的气孔。"
    ],
    "observations": [
      "叶肉通常含较多叶绿体，叶脉内有输导结构。",
      "气孔由保卫细胞围成，是气体交换与水蒸气散失的重要通道。"
    ],
    "conclusion": "叶片的结构与光合作用、运输和蒸腾作用相适应。",
    "examPoints": [
      "保卫细胞与普通表皮细胞区别",
      "气孔是孔隙不是单个细胞"
    ],
    "pitfalls": [
      "不能把气孔当导管",
      "不能断言所有植物气孔只分布在下表皮"
    ],
    "questions": [
      {
        "q": "切片过厚会造成什么观察问题？",
        "a": "多个细胞层重叠、透光变差，难以辨认真实层次。"
      }
    ],
    "safety": [
      "徒手切片必须由教师指导，刀片不对手指；优先使用预制装片。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "eyepiece",
        "label": "目镜",
        "min": 5,
        "max": 15,
        "value": 10,
        "step": 5,
        "unit": "倍"
      },
      {
        "key": "objective",
        "label": "物镜",
        "value": "10",
        "options": [
          {
            "value": "4",
            "label": "4倍"
          },
          {
            "value": "10",
            "label": "10倍"
          },
          {
            "value": "40",
            "label": "40倍"
          }
        ]
      },
      {
        "key": "focus",
        "label": "细准焦位置",
        "min": -5,
        "max": 5,
        "value": 0,
        "step": 1,
        "unit": ""
      },
      {
        "key": "view",
        "label": "观察材料",
        "value": "section",
        "options": [
          {
            "value": "section",
            "label": "叶横切片"
          },
          {
            "value": "epidermis",
            "label": "表皮装片"
          }
        ]
      },
      {
        "key": "stomata",
        "label": "气孔状态",
        "value": "open",
        "options": [
          {
            "value": "open",
            "label": "张开"
          },
          {
            "value": "closed",
            "label": "关闭"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "观察到两个形态特殊的表皮细胞围成孔隙，应怎样标注？",
      "steps": [
        {
          "title": "明确条件",
          "text": "辨认细胞与孔隙两类结构。"
        },
        {
          "title": "观察或依据",
          "text": "围孔的两个细胞为保卫细胞，中间孔隙为气孔。"
        },
        {
          "title": "推理与表达",
          "text": "分别标注，避免将整个区域统称一个气孔细胞。"
        }
      ],
      "answer": "两侧为保卫细胞，中间孔隙为气孔。"
    },
    "ncetIds": [
      20
    ],
    "evidenceTitles": [
      "观察叶片的结构"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "specimen": "leaf",
      "variant": "leaf"
    }
  },
  {
    "id": "bio-transpiration",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第二章 植物体内的物质与能量变化",
    "title": "观察植物蒸腾作用",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7down-text"
    ],
    "objective": "设计排除土壤蒸发影响的装置，认识植物散失水分。",
    "apparatus": [
      "状态相近的植物枝条",
      "透明袋",
      "扎口材料",
      "清水与记录表"
    ],
    "steps": [
      "选择带叶枝条并保证供水。",
      "只罩住地上枝叶，避免将湿土包入袋内。",
      "设置适宜对照，比较相同时间袋内水珠现象。"
    ],
    "observations": [
      "带叶枝条周围可出现凝结的水珠。",
      "若袋内包含湿土，水珠也可能来自土壤蒸发。"
    ],
    "conclusion": "活植物表面以水蒸气形式散失水分，叶片通常是主要部位。",
    "examPoints": [
      "蒸腾散失的是水蒸气",
      "水珠是水蒸气遇冷凝结后的结果"
    ],
    "pitfalls": [
      "不能把水珠说成植物直接排出的液滴",
      "不能忽略袋内湿土带来的混杂因素"
    ],
    "questions": [
      {
        "q": "为什么不把花盆里的湿土一起罩住？",
        "a": "土壤中的水也会蒸发，使袋内水珠来源无法明确。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "plant",
    "modelNote": "表示植物运输、生长和气孔开闭的机制，不预测真实株高、蒸腾量或个体产量。",
    "controls": [
      {
        "key": "cover",
        "label": "塑料袋包围部位",
        "value": "leaves",
        "options": [
          {
            "value": "leaves",
            "label": "只罩住带叶枝条"
          },
          {
            "value": "soil",
            "label": "连同湿土一起罩住"
          }
        ]
      },
      {
        "key": "leaves",
        "label": "叶片情况",
        "value": "many",
        "options": [
          {
            "value": "many",
            "label": "保留叶片"
          },
          {
            "value": "none",
            "label": "去叶对照"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "甲袋只罩带叶枝条，乙袋罩湿土且无植物，两袋都有水珠，能否说乙也发生蒸腾？",
      "steps": [
        {
          "title": "明确条件",
          "text": "区分活植物与非生物表面。"
        },
        {
          "title": "观察或依据",
          "text": "湿土水分散失属蒸发，不属于植物蒸腾。"
        },
        {
          "title": "推理与表达",
          "text": "水珠本身不能单独证明植物蒸腾。"
        }
      ],
      "answer": "乙袋水珠不能证明蒸腾，可能由土壤蒸发的水蒸气凝结形成。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "植物的蒸腾作用（正文塑料袋观察）"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "transpiration"
    }
  },
  {
    "id": "bio-photosynthesis-starch",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第二章 植物体内的物质与能量变化",
    "title": "探究绿叶在光下制造有机物",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "以淀粉检验和同叶对照探究光对有机物形成的作用。",
    "apparatus": [
      "经过暗处理的绿色植物",
      "遮光材料",
      "碘液",
      "教师操作的水浴脱色装置"
    ],
    "steps": [
      "先暗处理以降低叶中原有淀粉的干扰。",
      "在同一叶片遮住部分区域，再进行适当照光。",
      "由教师水浴脱色并冲洗，滴加碘液比较颜色。"
    ],
    "observations": [
      "适当条件下，照光的绿色部分经碘液检验变蓝，遮光部分不明显变蓝。",
      "未暗处理时，原有淀粉可能使对照区域也显色。"
    ],
    "conclusion": "在受控条件下，现象支持绿叶可在光下形成淀粉等有机物，光是光合作用的必要条件之一。",
    "examPoints": [
      "暗处理排除原有淀粉",
      "同叶遮光形成对照",
      "碘液检验淀粉而非所有有机物"
    ],
    "pitfalls": [
      "不能用碘液直接检验氧气",
      "不能把酒精脱色误认为去除淀粉"
    ],
    "questions": [
      {
        "q": "脱色的目的是什么？",
        "a": "去除叶绿素对颜色观察的干扰，使碘液显色更易比较。"
      }
    ],
    "safety": [
      "酒精易燃，水浴脱色和加热仅由教师规范操作；不可直接加热酒精。"
    ],
    "model": "photosynthesis",
    "modelNote": "采用有无必要条件的定性模型；光合和呼吸同时存在，实际反应强度受多因素影响。颜色是处理后的检验结果示意。",
    "controls": [
      {
        "key": "dark",
        "label": "预处理",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "充分暗处理"
          },
          {
            "value": "no",
            "label": "未暗处理"
          }
        ]
      },
      {
        "key": "light",
        "label": "照光",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "有光"
          },
          {
            "value": "no",
            "label": "无光"
          }
        ]
      },
      {
        "key": "mask",
        "label": "叶片处理",
        "value": "half",
        "options": [
          {
            "value": "half",
            "label": "局部遮光"
          },
          {
            "value": "none",
            "label": "不遮光"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "暗处理、局部遮光、照光及规范脱色后，见光部分遇碘变蓝，遮光部分不变蓝。",
      "steps": [
        {
          "title": "明确条件",
          "text": "同叶片两区域的主要差异是有无光照。"
        },
        {
          "title": "观察或依据",
          "text": "碘液遇淀粉呈蓝色，颜色说明淀粉是否明显积累。"
        },
        {
          "title": "推理与表达",
          "text": "结合对照，支持光参与绿叶制造淀粉的过程。"
        }
      ],
      "answer": "见光区形成可检出的淀粉，结果支持光是光合作用的必要条件之一。"
    },
    "ncetIds": [
      24
    ],
    "evidenceTitles": [
      "探究绿叶在光下制造有机物"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "starch"
    }
  },
  {
    "id": "bio-photosynthesis-oxygen",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第二章 植物体内的物质与能量变化",
    "title": "观察金鱼藻在光下释放氧气",
    "kind": "演示实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "观察水生绿色植物放气，并理解气体检验与现象描述的区别。",
    "apparatus": [
      "健康水生绿色植物",
      "水与透明容器",
      "漏斗和集气管",
      "教师用气体检验用品"
    ],
    "steps": [
      "在适宜条件下安装收集装置，排除残留空气的明显干扰。",
      "在相同温度下比较照光与遮光的现象。",
      "积累足量气体后由教师进行规范检验。"
    ],
    "observations": [
      "照光时可能观察到气泡产生并收集到气体。",
      "气泡数还受水温、溶解气体和气泡大小等影响。"
    ],
    "conclusion": "经适当检验的放出气体可支持光合作用释放氧气；仅见气泡不能完成气体鉴定。",
    "examPoints": [
      "现象与结论之间需要检验依据",
      "不能把气泡数直接等同精确氧气体积"
    ],
    "pitfalls": [
      "遮光后不等于植物停止呼吸",
      "未排除原有空气时气体成分可能混杂"
    ],
    "questions": [
      {
        "q": "为什么只有气泡不能证明是氧气？",
        "a": "不同气体都可能形成气泡，需要结合受控条件及气体性质检验。"
      }
    ],
    "safety": [
      "气体检验涉及火源，仅由教师演示；不在密闭受压容器中持续收集气体。"
    ],
    "model": "photosynthesis",
    "modelNote": "采用有无必要条件的定性模型；光合和呼吸同时存在，实际反应强度受多因素影响。颜色是处理后的检验结果示意。",
    "controls": [
      {
        "key": "light",
        "label": "光照",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "适宜光照"
          },
          {
            "value": "no",
            "label": "遮光"
          }
        ]
      },
      {
        "key": "co2",
        "label": "二氧化碳供应",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "充足且适宜"
          },
          {
            "value": "no",
            "label": "受限"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "水草照光后放出气泡，收集气体能使带火星木条复燃，怎样表述结论？",
      "steps": [
        {
          "title": "明确条件",
          "text": "收集过程需排除明显空气混入，并保留适当对照。"
        },
        {
          "title": "观察或依据",
          "text": "带火星木条复燃是氧气支持燃烧的检验现象。"
        },
        {
          "title": "推理与表达",
          "text": "将检验与植物照光条件联系，而不是只凭气泡判断。"
        }
      ],
      "answer": "在该装置和控制条件下，证据支持水草光合作用释放氧气。"
    },
    "ncetIds": [
      24
    ],
    "evidenceTitles": [
      "观察金鱼藻在光下释放氧气"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "oxygen"
    }
  },
  {
    "id": "bio-photosynthesis-co2",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第二章 植物体内的物质与能量变化",
    "title": "二氧化碳是光合作用必需的原料",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "通过控制二氧化碳供应与淀粉检验，建立原料与产物之间的证据链。",
    "apparatus": [
      "状态相近且暗处理的绿色植物",
      "密闭透明容器",
      "清水",
      "教师管理的二氧化碳吸收剂",
      "碘液检验装置"
    ],
    "steps": [
      "设置相同容器，分别放清水与二氧化碳吸收装置。",
      "保持植物状态、光照、温度及时间一致。",
      "照光后规范脱色并检验叶片淀粉。"
    ],
    "observations": [
      "二氧化碳供应正常的对照叶片可检出淀粉。",
      "缺乏二氧化碳时，新淀粉积累受到限制。"
    ],
    "conclusion": "在其他必要条件适宜时，对照结果支持二氧化碳是光合作用原料。",
    "examPoints": [
      "保持密闭以控制气体条件",
      "吸收剂不应直接伤害植物",
      "需先暗处理"
    ],
    "pitfalls": [
      "不能将“没有二氧化碳”与“没有空气”混为一谈",
      "同时遮光会导致无法单独判断二氧化碳作用"
    ],
    "questions": [
      {
        "q": "为什么对照装置也要放一个装有清水的小容器？",
        "a": "尽量保持装置组成及湿度等条件接近，使主要差异集中在二氧化碳是否被吸收。"
      }
    ],
    "safety": [
      "吸收剂可能具有腐蚀性，装置由教师管理；学生不直接接触或配制。"
    ],
    "model": "photosynthesis",
    "modelNote": "采用有无必要条件的定性模型；光合和呼吸同时存在，实际反应强度受多因素影响。颜色是处理后的检验结果示意。",
    "controls": [
      {
        "key": "co2",
        "label": "容器内处理",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "清水对照，保留二氧化碳"
          },
          {
            "value": "no",
            "label": "吸收二氧化碳"
          }
        ]
      },
      {
        "key": "light",
        "label": "照光",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "有光"
          },
          {
            "value": "no",
            "label": "无光"
          }
        ]
      },
      {
        "key": "dark",
        "label": "预处理",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "充分暗处理"
          },
          {
            "value": "no",
            "label": "未暗处理"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "两个暗处理植株分别置于清水组与吸收二氧化碳组，同样照光，只有清水组叶片遇碘变蓝。",
      "steps": [
        {
          "title": "明确条件",
          "text": "主要实验变量是二氧化碳供应。"
        },
        {
          "title": "观察或依据",
          "text": "检验结果表明两组新积累淀粉的情况不同。"
        },
        {
          "title": "推理与表达",
          "text": "据单一变量原则，将差异与二氧化碳供应联系。"
        }
      ],
      "answer": "结果支持二氧化碳是光合作用必需的原料。"
    },
    "ncetIds": [
      24
    ],
    "evidenceTitles": [
      "二氧化碳是光合作用必需的原料"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "co2"
    }
  },
  {
    "id": "bio-seed-respiration",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第二章 植物体内的物质与能量变化",
    "title": "观察萌发种子的呼吸作用",
    "kind": "演示实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7down-text"
    ],
    "objective": "从放热、产生二氧化碳和消耗氧气的证据认识呼吸作用。",
    "apparatus": [
      "同批萌发种子及处理后的对照种子",
      "保温容器或密闭广口瓶",
      "温度计",
      "教师管理的气体检验装置"
    ],
    "steps": [
      "保持两组质量、初始温度和装置等条件相近。",
      "根据所选项目观察温度或收集气体。",
      "将活种子组与对照组比较，分别解释证据指向。"
    ],
    "observations": [
      "活种子组可表现温度升高、二氧化碳增多及氧气减少等变化。",
      "一个实验装置的一种现象不能替代所有呼吸作用证据。"
    ],
    "conclusion": "萌发种子分解有机物释放能量；有氧呼吸消耗氧气并产生二氧化碳和水。",
    "examPoints": [
      "煮熟种子应冷却到相同初温",
      "热量释放只是能量释放的一部分",
      "呼吸作用昼夜均可进行"
    ],
    "pitfalls": [
      "不能把温度高低只归因于初始加热",
      "蜡烛熄灭只支持氧气不足，不能直接证明产生了二氧化碳"
    ],
    "questions": [
      {
        "q": "为什么煮熟种子要先冷却？",
        "a": "否则原有热量会成为混杂因素，无法公平比较呼吸产生的热量。"
      }
    ],
    "safety": [
      "热处理、火源及检验试剂由教师操作；密闭装置不加热加压。"
    ],
    "model": "respiration",
    "modelNote": "活种子与对照的定性现象示意，不能从动画强弱读出实测氧耗量或热量。",
    "controls": [
      {
        "key": "test",
        "label": "观察项目",
        "value": "heat",
        "options": [
          {
            "value": "heat",
            "label": "能量变化"
          },
          {
            "value": "co2",
            "label": "二氧化碳产生"
          },
          {
            "value": "oxygen",
            "label": "氧气消耗"
          }
        ]
      },
      {
        "key": "seeds",
        "label": "种子组",
        "value": "living",
        "options": [
          {
            "value": "living",
            "label": "正在萌发的活种子"
          },
          {
            "value": "boiled",
            "label": "煮熟并冷却的对照种子"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "装等量种子的两保温瓶初温相同，活种子组温度上升，对照组变化很小，说明什么？",
      "steps": [
        {
          "title": "明确条件",
          "text": "容器、种子质量和初始温度保持一致。"
        },
        {
          "title": "观察或依据",
          "text": "温度变化说明体系获得了可检测的热量。"
        },
        {
          "title": "推理与表达",
          "text": "在排除其他热源后，结果支持活种子呼吸释放热量。"
        }
      ],
      "answer": "结果支持萌发种子呼吸时释放热量，不能由此直接算出全部能量。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "种子在萌发过程中的能量变化",
      "种子在萌发过程中的物质变化"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "seeds"
    }
  },
  {
    "id": "bio-food-storage",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第二章 植物体内的物质与能量变化",
    "title": "调查利用呼吸作用原理保存食物的方法",
    "kind": "拓展探究",
    "tags": [
      "课标拓展",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023"
    ],
    "objective": "比较不同食物保存措施，识别呼吸作用与其他变质因素。",
    "apparatus": [
      "食品储存说明资料",
      "调查记录表",
      "同类食品包装信息"
    ],
    "steps": [
      "选择一种食物，记录推荐保存条件和依据。",
      "分析低温、含水量与气体条件如何影响呼吸。",
      "区分抑制呼吸、抑制微生物以及保持品质等不同目的。"
    ],
    "observations": [
      "干燥通常适合种子保存，但不适合所有新鲜果蔬。",
      "完全无氧可能使一些果蔬发生不利变化，不能一概认为密封越严越好。"
    ],
    "conclusion": "保存方式需结合材料特性，适当减弱呼吸可减少储存有机物的消耗。",
    "examPoints": [
      "生物种类与组织状态影响适宜条件",
      "低温不是杀死所有微生物"
    ],
    "pitfalls": [
      "不能给所有食品套同一保存配方",
      "不能把减弱呼吸说成完全停止所有生命活动"
    ],
    "questions": [
      {
        "q": "为什么干种子和鲜叶菜不宜照搬同一种保存办法？",
        "a": "两者对失水、低温和氧气的耐受不同，措施需针对其生物学特点。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "respiration",
    "modelNote": "活种子与对照的定性现象示意，不能从动画强弱读出实测氧耗量或热量。",
    "controls": [
      {
        "key": "food",
        "label": "保存对象",
        "value": "grain",
        "options": [
          {
            "value": "grain",
            "label": "干燥种子"
          },
          {
            "value": "produce",
            "label": "新鲜果蔬"
          }
        ]
      },
      {
        "key": "storage",
        "label": "措施",
        "value": "cool",
        "options": [
          {
            "value": "cool",
            "label": "适宜低温"
          },
          {
            "value": "dry",
            "label": "充分干燥"
          },
          {
            "value": "sealed",
            "label": "完全密封"
          },
          {
            "value": "normal",
            "label": "普通环境"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "某同学说“果蔬全部密封无氧保存最好”，应怎样评价？",
      "steps": [
        {
          "title": "明确条件",
          "text": "对象为仍有生命活动的新鲜果蔬。"
        },
        {
          "title": "观察或依据",
          "text": "呼吸需要适当气体条件，过度缺氧可能产生不良代谢。"
        },
        {
          "title": "推理与表达",
          "text": "必须依据具体食品要求选择温度和气体条件。"
        }
      ],
      "answer": "该说法过于绝对；果蔬保存应采用适合种类的温度和气体条件。"
    },
    "ncetIds": [
      25
    ],
    "evidenceTitles": [],
    "evidenceStatus": "2023基本目录已核对；本网站学期归类",
    "config": {
      "variant": "storage"
    }
  },
  {
    "id": "bio-plant-growth",
    "subject": "biology",
    "term": "7下",
    "chapter": "第三单元 第二章 植物体内的物质与能量变化",
    "title": "栽培一种植物，探究所需的环境条件",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "设计长期观察记录，并将生长现象与受控环境条件联系。",
    "apparatus": [
      "同种植物与栽培容器",
      "合适栽培介质",
      "尺和记录表",
      "光照及水肥记录"
    ],
    "steps": [
      "选择适合当地条件的植物并确定一个研究变量。",
      "设置对照并记录开始时的植株状态。",
      "连续观察萌发、生长、开花或结果阶段，整理可复查记录。"
    ],
    "observations": [
      "植物的生活周期经历多个阶段，不能用一次株高测量代替完整观察。",
      "不同个体存在差异，需要重复与一致的测量标准。"
    ],
    "conclusion": "植物生长需要多种相互配合的环境条件，控制变量有助于分析一种因素的作用。",
    "examPoints": [
      "记录时间序列而非只记终点",
      "株高、叶片数等指标事先确定",
      "模型阶段不等于固定天数"
    ],
    "pitfalls": [
      "不能把两个不同品种直接当同质对照",
      "改变多个因素后不能单因归因"
    ],
    "questions": [
      {
        "q": "为什么要记录开始时的株高？",
        "a": "便于比较增长量并判断原有个体差异，不能只比较终点高矮。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "plant",
    "modelNote": "表示植物运输、生长和气孔开闭的机制，不预测真实株高、蒸腾量或个体产量。",
    "controls": [
      {
        "key": "condition",
        "label": "比较因素",
        "value": "light",
        "options": [
          {
            "value": "light",
            "label": "光照"
          },
          {
            "value": "water",
            "label": "水分"
          },
          {
            "value": "mineral",
            "label": "无机盐"
          }
        ]
      },
      {
        "key": "level",
        "label": "实验组条件",
        "value": "suitable",
        "options": [
          {
            "value": "suitable",
            "label": "适宜"
          },
          {
            "value": "limited",
            "label": "不足"
          }
        ]
      },
      {
        "key": "stage",
        "label": "观察阶段",
        "min": 0,
        "max": 4,
        "value": 2,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "教学记录中甲苗起始10 cm、结束16 cm；乙苗起始7 cm、结束14 cm。哪株高度增长更多？",
      "steps": [
        {
          "title": "明确条件",
          "text": "比较的是增长量，不是最终高度。"
        },
        {
          "title": "观察或依据",
          "text": "甲增长16−10=6 cm，乙增长14−7=7 cm。"
        },
        {
          "title": "推理与表达",
          "text": "乙增长量更大，但原因仍需结合受控条件分析。"
        }
      ],
      "answer": "乙株高度增长7 cm，比甲株增长量多1 cm。"
    },
    "ncetIds": [
      22,
      50
    ],
    "evidenceTitles": [
      "栽培一种植物，探究所需的环境条件",
      "参加当地的绿化活动"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "growth"
    }
  },
  {
    "id": "bio-human-reproduction",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第一章 人的生殖和发育",
    "title": "观察男女生殖系统的结构与功能",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7down-text"
    ],
    "objective": "在规范生物学图示中识别主要生殖器官及其功能。",
    "apparatus": [
      "人体结构教学模型",
      "器官功能标签",
      "科学知识记录表"
    ],
    "steps": [
      "根据模型定位主要器官，不以外部外形猜测功能。",
      "区分产生生殖细胞、输送与胚胎发育的场所。",
      "用路径图说明精子和卵细胞结合后早期发育过程。"
    ],
    "observations": [
      "睾丸产生精子，卵巢产生卵细胞并分泌相关激素。",
      "受精通常发生在输卵管，胚胎与胎儿主要在子宫内发育。"
    ],
    "conclusion": "生殖系统各器官分工不同，人体发育从受精卵开始。",
    "examPoints": [
      "卵巢、输卵管与子宫功能区别",
      "受精场所与主要发育场所区别"
    ],
    "pitfalls": [
      "不能把子宫说成卵细胞形成场所",
      "不以模型对个人发育作诊断或评价"
    ],
    "questions": [
      {
        "q": "卵细胞形成、受精和胎儿发育分别主要发生在哪里？",
        "a": "分别为卵巢、输卵管和子宫。"
      }
    ],
    "safety": [
      "仅使用正规教学模型与科学术语，尊重身体隐私及个体发育差异。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "system",
        "label": "观察系统",
        "value": "male",
        "options": [
          {
            "value": "male",
            "label": "男性生殖系统"
          },
          {
            "value": "female",
            "label": "女性生殖系统"
          }
        ]
      },
      {
        "key": "view",
        "label": "观察重点",
        "value": "whole",
        "options": [
          {
            "value": "whole",
            "label": "器官位置"
          },
          {
            "value": "detail",
            "label": "生殖细胞与发育路径"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "填写“卵细胞形成→受精→胎儿主要发育”的场所顺序。",
      "steps": [
        {
          "title": "明确条件",
          "text": "每一步对应不同生理过程。"
        },
        {
          "title": "观察或依据",
          "text": "卵巢形成卵细胞，输卵管通常发生受精，子宫提供发育场所。"
        },
        {
          "title": "推理与表达",
          "text": "按过程顺序准确标注器官。"
        }
      ],
      "answer": "卵巢→输卵管→子宫。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "男女生殖系统的结构与功能"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "specimen": "human-reproduction",
      "variant": "human-reproduction"
    }
  },
  {
    "id": "bio-food-energy",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第二章 人体的营养",
    "title": "测定几种食物中的能量",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "用简易量热法估算单位食物质量传给水的热量。",
    "apparatus": [
      "教师设置的食物燃烧装置",
      "水与量筒",
      "天平",
      "温度计",
      "防护用品"
    ],
    "steps": [
      "记录实际燃烧食物质量、水质量及初始温度。",
      "由教师在防火条件下完成加热，测量水的最终温度。",
      "计算水吸收热量，再除以实际燃烧食物质量进行同条件比较。"
    ],
    "observations": [
      "水温上升可用于估算水吸收的热量。",
      "容器吸热、散热和不完全燃烧会使结果偏离食物的全部化学能。"
    ],
    "conclusion": "单位质量传给水的热量为c水m水ΔT/m食物；简易结果不能直接作为食品标签能量。",
    "examPoints": [
      "水的比热容取4.2 J/(g·℃)",
      "比较时须按单位质量",
      "记录燃烧前后质量差"
    ],
    "pitfalls": [
      "不能把最终温度当温升",
      "不能忽略未烧完食物而使用初始整块质量"
    ],
    "questions": [
      {
        "q": "测得的热量为什么常偏低？",
        "a": "一部分热量散失或被容器吸收，食物也可能没有完全燃烧。"
      }
    ],
    "safety": [
      "点燃食物和高温器材仅在教师监督下使用；防烫、防火，注意食物过敏风险。"
    ],
    "model": "calorimetry",
    "modelNote": "使用用户输入的水质量、温升与燃烧质量计算水吸收的热量；不假定热效率100%，结果不等同食品标签总能量。 相关物理量由Godot引擎求解；生物解释与真实实验误差另作分析。",
    "controls": [
      {
        "key": "waterMass",
        "label": "受热水质量",
        "min": 20,
        "max": 200,
        "value": 50,
        "step": 10,
        "unit": "g"
      },
      {
        "key": "rise",
        "label": "水温升高",
        "min": 0,
        "max": 60,
        "value": 20,
        "step": 1,
        "unit": "℃"
      },
      {
        "key": "foodMass",
        "label": "实际燃烧食物质量",
        "min": 0.5,
        "max": 5,
        "value": 1,
        "step": 0.1,
        "unit": "g"
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "教学样例：1.0 g食物实际燃烧，50 g水升温20℃。取c水=4.2 J/(g·℃)。",
      "steps": [
        {
          "title": "明确条件",
          "text": "质量均用g，温差20℃，先求水吸收的热量。"
        },
        {
          "title": "观察或依据",
          "text": "Q=4.2×50×20=4200 J。"
        },
        {
          "title": "推理与表达",
          "text": "每克食物传给水的热量为4200÷1.0=4200 J/g=4.2 kJ/g。"
        }
      ],
      "answer": "该简易测定中单位食物质量传给水的热量为4.2 kJ/g。"
    },
    "ncetIds": [
      27
    ],
    "evidenceTitles": [
      "测定几种食物中的能量"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "food-energy"
    },
    "requiresPhysics": true
  },
  {
    "id": "bio-digestion",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第二章 人体的营养",
    "title": "口腔对馒头（或米饭）的消化作用",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "通过碘液检验比较淀粉残留，分析酶与机械处理的作用。",
    "apparatus": [
      "等量馒头屑或米饭",
      "教学淀粉酶溶液与清水",
      "试管",
      "水浴装置",
      "碘液"
    ],
    "steps": [
      "在不同试管放入等量同种材料。",
      "选择一个因素比较，保持其他条件相同并设置清水对照。",
      "反应相同时间后加入等量碘液，比较颜色。"
    ],
    "observations": [
      "适宜条件下淀粉被分解，碘液显蓝程度可减弱或不明显。",
      "弄碎和搅拌增大接触机会，但本身不等同酶的化学消化。"
    ],
    "conclusion": "唾液淀粉酶能促进淀粉初步分解；温度和材料处理方式会影响观察结果。",
    "examPoints": [
      "碘液检验剩余淀粉",
      "控制变量",
      "低温影响活性与高温失活不同"
    ],
    "pitfalls": [
      "不能由不变蓝断言所有营养都被消化",
      "不能说淀粉在口腔直接全部变成葡萄糖"
    ],
    "questions": [
      {
        "q": "只比较“馒头块加清水”和“馒头屑加酶”有什么问题？",
        "a": "同时改变了材料形态和酶，不能单独判断其中一个因素的作用。"
      }
    ],
    "safety": [
      "优先使用教学酶制剂；不共用唾液材料，不品尝实验食物，水浴防烫。"
    ],
    "model": "digestion",
    "modelNote": "用淀粉是否残留解释碘液显色。模型只比较适宜、低温和高温处理，不把消化程度写成实测浓度。",
    "controls": [
      {
        "key": "saliva",
        "label": "加入物质",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "淀粉酶溶液"
          },
          {
            "value": "no",
            "label": "等量清水"
          }
        ]
      },
      {
        "key": "temperature",
        "label": "处理温度",
        "value": "suitable",
        "options": [
          {
            "value": "suitable",
            "label": "适宜温度"
          },
          {
            "value": "cold",
            "label": "低温"
          },
          {
            "value": "boiled",
            "label": "高温使酶失活"
          }
        ]
      },
      {
        "key": "crush",
        "label": "材料处理",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "充分弄碎并搅拌"
          },
          {
            "value": "no",
            "label": "大块且少搅拌"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "两管等量馒头屑，一管加酶，一管加清水，同温同时间，前者遇碘不明显变蓝。",
      "steps": [
        {
          "title": "明确条件",
          "text": "变量为是否加入酶，材料与处理时间等一致。"
        },
        {
          "title": "观察或依据",
          "text": "碘液反映淀粉残留，而非直接检验全部消化产物。"
        },
        {
          "title": "推理与表达",
          "text": "与清水对照比较，结果支持酶促进淀粉分解。"
        }
      ],
      "answer": "该结果支持淀粉酶能促进淀粉分解。"
    },
    "ncetIds": [
      26
    ],
    "evidenceTitles": [
      "口腔对馒头（或米饭）的消化作用"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "starch"
    }
  },
  {
    "id": "bio-diet",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第二章 人体的营养",
    "title": "制订合理的膳食计划",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "根据营养多样性与食品信息评价菜单，避免以单一食品替代膳食。",
    "apparatus": [
      "食物种类卡",
      "正规膳食指南资料",
      "食品包装信息",
      "菜单记录表"
    ],
    "steps": [
      "记录一日食物种类及进餐安排。",
      "检查是否有主食、蔬果及适宜蛋白质来源等多样组合。",
      "核对食品来源、保质期和过敏原信息，再提出具体调整。"
    ],
    "observations": [
      "不同食物提供的营养成分比例不同。",
      "某种食品含一种营养成分多，不代表它能提供全部营养需求。"
    ],
    "conclusion": "合理膳食需要食物多样、比例适当和符合个人具体条件的安排，并重视食品安全。",
    "examPoints": [
      "营养全面与摄入适量相结合",
      "能量需求因年龄与活动等不同"
    ],
    "pitfalls": [
      "不能只看价格或热量评价营养",
      "不能用本页给特殊疾病或过敏人群开食谱"
    ],
    "questions": [
      {
        "q": "为什么不能长期只吃一种“高营养”食品？",
        "a": "单一食品通常无法满足全部营养需要，多样搭配有助于减少营养缺口。"
      }
    ],
    "safety": [
      "饮食建议仅用于教材学习；个体疾病、过敏及特殊营养需求应由专业人员指导。"
    ],
    "model": "health",
    "modelNote": "提供教材级结构、统计或防护原理练习；输入数字为样例或用户记录，不作诊断、处方或急救技能认证。",
    "controls": [
      {
        "key": "plan",
        "label": "菜单结构",
        "value": "varied",
        "options": [
          {
            "value": "varied",
            "label": "主食、蔬果、蛋白质来源等多样搭配"
          },
          {
            "value": "single",
            "label": "仅一种食物"
          },
          {
            "value": "snacks",
            "label": "以零食饮料替代正餐"
          }
        ]
      },
      {
        "key": "label",
        "label": "包装信息",
        "value": "complete",
        "options": [
          {
            "value": "complete",
            "label": "标签完整且符合食用条件"
          },
          {
            "value": "expired",
            "label": "已超过保质期"
          },
          {
            "value": "unknown",
            "label": "来源与标签不明"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "某菜单只有甜饮料和点心，应从哪些方面改进？",
      "steps": [
        {
          "title": "明确条件",
          "text": "先识别食物种类单一且正餐结构缺失。"
        },
        {
          "title": "观察或依据",
          "text": "需考虑主食、蔬菜水果和适宜蛋白质来源等多样性。"
        },
        {
          "title": "推理与表达",
          "text": "提出替换为合理正餐、饮水及多样搭配，而非简单增加总量。"
        }
      ],
      "answer": "应恢复多样、适量的正餐结构，不以甜饮料和点心代替日常膳食。"
    },
    "ncetIds": [
      28
    ],
    "evidenceTitles": [
      "制订合理的膳食计划"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "diet"
    }
  },
  {
    "id": "bio-lung",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第三章 人体的呼吸",
    "title": "模拟膈肌的收缩和舒张与呼吸的关系",
    "kind": "小实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "建立胸腔容积、肺内气压与气流方向之间的因果关系。",
    "apparatus": [
      "透明罩",
      "分支管和气球",
      "可移动橡皮膜",
      "密封连接件"
    ],
    "steps": [
      "对应罩、管、气球和膜分别模拟的结构。",
      "改变橡皮膜位置并观察气球变化。",
      "检查漏气时的现象，说明模型成立的条件和局限。"
    ],
    "observations": [
      "膜下移使密闭空间容积增大，气球可膨大；膜上移时相反。",
      "模型罩壁不动，不能完整表现肋骨与肋间肌的活动。"
    ],
    "conclusion": "吸气时呼吸肌收缩使胸腔容积增大，肺被动扩张，气体进入；平静呼气过程相反。",
    "examPoints": [
      "先容积变化，后压力变化，再形成气流",
      "肺不是主动收缩的呼吸肌"
    ],
    "pitfalls": [
      "不能说膈肌收缩时膈顶上升",
      "不能把模型外膜下拉误认为真实膈肌被外力拉动"
    ],
    "questions": [
      {
        "q": "为什么装置漏气时现象可能不明显？",
        "a": "空间压力难以按预期改变，无法有效驱动气球内外气体流动。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "lung",
    "modelNote": "气球和橡皮膜模拟肺及膈，不能代表胸廓全部结构和生理压力。膜位移仅用于展示通气方向。",
    "controls": [
      {
        "key": "diaphragm",
        "label": "模型膈向下位移",
        "min": -1,
        "max": 1,
        "value": 0,
        "step": 0.1,
        "unit": "示意"
      },
      {
        "key": "seal",
        "label": "装置密封",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "密封良好"
          },
          {
            "value": "no",
            "label": "漏气"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "密封模型中橡皮膜下降，气球膨大，模拟什么过程？",
      "steps": [
        {
          "title": "明确条件",
          "text": "膜对应膈，罩内空间对应胸腔。"
        },
        {
          "title": "观察或依据",
          "text": "膜下降使空间容积增大，压力变化促使空气进入气球。"
        },
        {
          "title": "推理与表达",
          "text": "联系人体膈肌收缩、膈顶下降的吸气过程。"
        }
      ],
      "answer": "模拟吸气：膈顶下降，胸腔容积增大，肺扩张并吸入空气。"
    },
    "ncetIds": [
      34
    ],
    "evidenceTitles": [
      "模拟膈肌的收缩和舒张与呼吸的关系"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "diaphragm"
    }
  },
  {
    "id": "bio-exhaled-co2",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第三章 人体的呼吸",
    "title": "验证人体呼出气体中含有较多的二氧化碳",
    "kind": "小实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "在等量气体比较中，用检验现象支持呼出气体二氧化碳较多。",
    "apparatus": [
      "等量澄清石灰水或二氧化碳传感器",
      "安全防倒吸收集装置",
      "气体体积记录"
    ],
    "steps": [
      "保持检验液体积、浓度和其他条件相同。",
      "分别通入等体积环境空气和规范收集的呼出气体。",
      "比较浑浊趋势或传感器读数，并说明检测条件。"
    ],
    "observations": [
      "适当条件下，呼出气体更容易使澄清石灰水变浑浊。",
      "空气中也有二氧化碳，不能把对照称为绝对不含二氧化碳。"
    ],
    "conclusion": "实验支持呼出气体的二氧化碳含量通常高于环境空气；呼出气体并非只有二氧化碳。",
    "examPoints": [
      "等体积气体比较",
      "现象不能替代精确浓度测量",
      "呼气仍含氧气"
    ],
    "pitfalls": [
      "不能比较不同气量后直接判断浓度",
      "不能用嘴吸取检验液或共用吹气口"
    ],
    "questions": [
      {
        "q": "为什么两组必须比较相近气体体积？",
        "a": "否则二氧化碳总量差异可能由气量不同造成，不能公平比较含量。"
      }
    ],
    "safety": [
      "优先采用传感器与独立接口；禁止吸入液体，不共用吹气口，装置防倒吸。"
    ],
    "model": "lung",
    "modelNote": "气球和橡皮膜模拟肺及膈，不能代表胸廓全部结构和生理压力。膜位移仅用于展示通气方向。",
    "controls": [
      {
        "key": "gas",
        "label": "气体来源",
        "value": "air",
        "options": [
          {
            "value": "air",
            "label": "环境空气"
          },
          {
            "value": "exhaled",
            "label": "呼出气体"
          }
        ]
      },
      {
        "key": "volume",
        "label": "比较气体体积",
        "min": 100,
        "max": 500,
        "value": 200,
        "step": 50,
        "unit": "mL"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "等量石灰水中分别通入相同体积空气和呼出气体，后者较快变浑浊。",
      "steps": [
        {
          "title": "明确条件",
          "text": "气体体积和检验液条件相同。"
        },
        {
          "title": "观察或依据",
          "text": "二氧化碳可使适量澄清石灰水出现浑浊。"
        },
        {
          "title": "推理与表达",
          "text": "在该比较条件下，结果支持呼出气体中二氧化碳较多。"
        }
      ],
      "answer": "证据支持呼出气体中含有较多二氧化碳，但不能说明呼气不含氧气。"
    },
    "ncetIds": [
      33
    ],
    "evidenceTitles": [
      "验证人体呼出的气体中含有较多的二氧化碳（页边探究提示）"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "exhaled-co2"
    }
  },
  {
    "id": "bio-lung-capacity",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第三章 人体的呼吸",
    "title": "测定肺活量",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7down-text"
    ],
    "objective": "通过体积估算认识测量方法及误差，区分估算与专用仪器测定。",
    "apparatus": [
      "个人专用气球或肺活量仪",
      "软尺",
      "记录表"
    ],
    "steps": [
      "遵守教师给定测量规范，使用个人接口。",
      "若用气球估算，记录其最大周长并检查形状。",
      "利用球体公式估算体积，同时报告形状和泄漏等误差来源。"
    ],
    "observations": [
      "周长越大，在球形假设下估算体积越大。",
      "不规则气球、弹性阻力和漏气会影响估算，不能当作精确生理测量。"
    ],
    "conclusion": "球形近似下V=C³/(6π²)，厘米计周长时体积为cm³，即mL；肺活量评价需规范测定。",
    "examPoints": [
      "长度单位的三次方变为体积单位",
      "同一指标的重复测量标准一致"
    ],
    "pitfalls": [
      "不能把一次普通呼气量当肺活量",
      "不能据气球估算诊断肺功能或比较个体健康高低"
    ],
    "questions": [
      {
        "q": "气球周长相同就一定表示肺活量相同吗？",
        "a": "不一定，气球形状、弹性、漏气和操作差异都会造成偏差。"
      }
    ],
    "safety": [
      "不强迫长时间屏气或反复用力吹气；不适时立即停止，遵守教师指导及个人卫生。"
    ],
    "model": "health",
    "modelNote": "提供教材级结构、统计或防护原理练习；输入数字为样例或用户记录，不作诊断、处方或急救技能认证。",
    "controls": [
      {
        "key": "circumference",
        "label": "近似球形气球最大周长",
        "min": 30,
        "max": 80,
        "value": 60,
        "step": 1,
        "unit": "cm"
      },
      {
        "key": "shape",
        "label": "气球形状",
        "value": "sphere",
        "options": [
          {
            "value": "sphere",
            "label": "近似球形"
          },
          {
            "value": "irregular",
            "label": "明显不规则"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "教学几何样例：将气球视为球体，最大周长60 cm，求其估算体积。",
      "steps": [
        {
          "title": "明确条件",
          "text": "采用球形近似，C=60 cm。"
        },
        {
          "title": "观察或依据",
          "text": "由C=2πr与V=4πr³/3得V=C³/(6π²)。"
        },
        {
          "title": "推理与表达",
          "text": "V约为3648 cm³，即约3.65 L；这只是气球体积估算。"
        }
      ],
      "answer": "球形近似体积约3.65 L，不能据此作肺功能诊断。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "测定肺活量"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "lung-capacity"
    }
  },
  {
    "id": "bio-blood-smear",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第四章 人体内物质的运输",
    "title": "观察人血的永久涂片",
    "kind": "小实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "识别永久血涂片中的主要血细胞并联系其功能。",
    "apparatus": [
      "正规人血永久涂片",
      "显微镜",
      "结构记录表"
    ],
    "steps": [
      "低倍寻找薄且分散的区域。",
      "比较数量、大小与染色细胞核等特征。",
      "结合功能标注红细胞、白细胞与血小板。"
    ],
    "observations": [
      "成熟人红细胞通常没有细胞核，数量较多。",
      "白细胞有细胞核；血小板较小，通常不易直接清晰辨认。"
    ],
    "conclusion": "血液由血浆与血细胞等组成，不同成分承担运输、防御和止血等任务。",
    "examPoints": [
      "成熟人红细胞与其他动物细胞不同",
      "白细胞参与防御",
      "血小板参与止血凝血"
    ],
    "pitfalls": [
      "不能把白细胞都当病原体",
      "涂片示意数量不能用于个人血常规诊断"
    ],
    "questions": [
      {
        "q": "为什么应选择细胞分散区域？",
        "a": "细胞重叠会遮挡形态和细胞核，影响辨认。"
      }
    ],
    "safety": [
      "只使用正规永久装片，不自行采血或接触来源不明的血液。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "eyepiece",
        "label": "目镜",
        "min": 5,
        "max": 15,
        "value": 10,
        "step": 5,
        "unit": "倍"
      },
      {
        "key": "objective",
        "label": "物镜",
        "value": "10",
        "options": [
          {
            "value": "4",
            "label": "4倍"
          },
          {
            "value": "10",
            "label": "10倍"
          },
          {
            "value": "40",
            "label": "40倍"
          }
        ]
      },
      {
        "key": "focus",
        "label": "细准焦位置",
        "min": -5,
        "max": 5,
        "value": 0,
        "step": 1,
        "unit": ""
      },
      {
        "key": "component",
        "label": "观察重点",
        "value": "all",
        "options": [
          {
            "value": "all",
            "label": "所有成分"
          },
          {
            "value": "red",
            "label": "红细胞"
          },
          {
            "value": "white",
            "label": "白细胞"
          },
          {
            "value": "platelet",
            "label": "血小板"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "在人血永久涂片中见一种较大且有染色细胞核的细胞，如何初步判断？",
      "steps": [
        {
          "title": "明确条件",
          "text": "与成熟人红细胞无核这一特征比较。"
        },
        {
          "title": "观察或依据",
          "text": "白细胞具有细胞核，形态与红细胞不同。"
        },
        {
          "title": "推理与表达",
          "text": "结合大小、染色情况和教师指导作初步辨认。"
        }
      ],
      "answer": "该结构可能是白细胞，需结合完整形态确认，不能据单个细胞判断疾病。"
    },
    "ncetIds": [
      29
    ],
    "evidenceTitles": [
      "人血的永久涂片"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "specimen": "blood",
      "variant": "blood"
    }
  },
  {
    "id": "bio-fish-capillaries",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第四章 人体内物质的运输",
    "title": "观察小鱼尾鳍内血管及血液的流动",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "依据流向及红细胞通过方式识别小血管类型。",
    "apparatus": [
      "教师准备的活体观察影像或合适教学装置",
      "显微镜",
      "湿润支持材料"
    ],
    "steps": [
      "优先观察已有教学影像，实物操作按动物保护要求进行。",
      "沿血流方向追踪血管分支或汇合。",
      "观察红细胞是否单行通过并记录判断依据。"
    ],
    "observations": [
      "毛细血管管径小，红细胞常单行通过。",
      "由较粗血管分向较细支路与由细支路汇向粗血管，反映不同流向。"
    ],
    "conclusion": "血管类型可结合流向、分支形式和管径判断，毛细血管结构利于物质交换。",
    "examPoints": [
      "动脉离心、静脉向心",
      "观察局部流向不能只看画面左右"
    ],
    "pitfalls": [
      "不能仅以血液颜色判断动静脉",
      "不能让活鱼长时间离水或压伤尾鳍"
    ],
    "questions": [
      {
        "q": "红细胞单行通过的细血管通常是什么？",
        "a": "通常为毛细血管，其细管径和薄管壁有利于交换。"
      }
    ],
    "safety": [
      "优先使用录像；实物观察时间尽量短并保持呼吸条件，结束后及时放回适宜水中。"
    ],
    "model": "circulation",
    "modelNote": "血液及血管比例为示意，红蓝表示含氧相对高低，并非人体内血液呈蓝色。流动方向遵循心脏与循环路径。",
    "controls": [
      {
        "key": "vessel",
        "label": "观察血管",
        "value": "artery",
        "options": [
          {
            "value": "artery",
            "label": "由粗分细的血管"
          },
          {
            "value": "capillary",
            "label": "毛细血管"
          },
          {
            "value": "vein",
            "label": "由细汇粗的血管"
          }
        ]
      },
      {
        "key": "speed",
        "label": "动画观察速度",
        "min": 0.25,
        "max": 1,
        "value": 1,
        "step": 0.25,
        "unit": "倍"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "观察到红细胞从粗血管分流进入许多细支，末端有单行通过区域，应怎样描述？",
      "steps": [
        {
          "title": "明确条件",
          "text": "按血流方向追踪，而不是按图中左右。"
        },
        {
          "title": "观察或依据",
          "text": "动脉逐级分支，毛细血管连接后续静脉。"
        },
        {
          "title": "推理与表达",
          "text": "将分支段与单行通过区分别标注。"
        }
      ],
      "answer": "由粗分细的流向符合动脉分支，红细胞单行通过区符合毛细血管特征。"
    },
    "ncetIds": [
      30
    ],
    "evidenceTitles": [
      "观察小鱼尾鳍内血管及血液的流动"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "fish"
    }
  },
  {
    "id": "bio-heart",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第四章 人体内物质的运输",
    "title": "观察心脏的结构",
    "kind": "小实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "辨认心腔、相连血管及瓣膜，并解释单向流动。",
    "apparatus": [
      "哺乳动物心脏模型或规范制备标本",
      "结构标签",
      "观察记录"
    ],
    "steps": [
      "明确模型的身体左右与观察者左右不同。",
      "依次辨认心房、心室及与其连接的血管。",
      "观察瓣膜位置并按允许流向画箭头。"
    ],
    "observations": [
      "心室壁通常比心房壁厚，左心室壁较厚。",
      "房室瓣和动脉瓣的位置与防止血液倒流有关。"
    ],
    "conclusion": "心脏通过收缩提供动力，瓣膜使正常血流按一定方向通过。",
    "examPoints": [
      "心房接静脉、心室接动脉",
      "左右心腔正常不直接相通",
      "左心室通向体循环"
    ],
    "pitfalls": [
      "不能把观察者左侧直接叫身体左侧",
      "不能说所有瓣膜只允许动脉血通过"
    ],
    "questions": [
      {
        "q": "为什么左心室壁通常较厚？",
        "a": "左心室向全身体循环泵血，需要产生相应的压力。"
      }
    ],
    "safety": [
      "优先使用模型；生物标本由教师管理，接触后按实验卫生要求清洁。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "part",
        "label": "观察部位",
        "value": "whole",
        "options": [
          {
            "value": "whole",
            "label": "整体"
          },
          {
            "value": "chambers",
            "label": "四个心腔"
          },
          {
            "value": "valves",
            "label": "瓣膜"
          },
          {
            "value": "vessels",
            "label": "相连血管"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "从右心房出发，按心脏内部正常方向到达肺动脉，经过哪些结构？",
      "steps": [
        {
          "title": "明确条件",
          "text": "由心房进入同侧心室。"
        },
        {
          "title": "观察或依据",
          "text": "房室瓣允许右心房至右心室的方向，动脉瓣允许心室流向肺动脉。"
        },
        {
          "title": "推理与表达",
          "text": "按路径而非血液颜色作答。"
        }
      ],
      "answer": "右心房→房室瓣→右心室→动脉瓣→肺动脉。"
    },
    "ncetIds": [
      31
    ],
    "evidenceTitles": [
      "心脏的结构"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "specimen": "heart",
      "variant": "heart"
    }
  },
  {
    "id": "bio-circulation",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第四章 人体内物质的运输",
    "title": "观察血液循环的过程",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7down-text"
    ],
    "objective": "连接心脏与两条循环路径，理解气体交换后的血液变化。",
    "apparatus": [
      "循环系统模型",
      "路径箭头",
      "氧气与二氧化碳标记"
    ],
    "steps": [
      "先标出右心室至左心房的肺循环路径。",
      "再标出左心室至右心房的体循环路径。",
      "在肺和组织毛细血管处标注交换方向。"
    ],
    "observations": [
      "血液流经肺毛细血管后，通常氧含量增加。",
      "血液流经多数组织毛细血管后，氧含量下降并运走部分代谢产物。"
    ],
    "conclusion": "两条循环相互连接，共同完成气体及营养等物质运输；动静脉按流向定义。",
    "examPoints": [
      "肺动脉含氧相对低、肺静脉含氧相对高",
      "体肺循环同时进行而不是轮流开启"
    ],
    "pitfalls": [
      "不能按含氧量给血管命名",
      "图上蓝色仅为示意，人体静脉血并非蓝色"
    ],
    "questions": [
      {
        "q": "为什么肺动脉虽然含氧较少仍叫动脉？",
        "a": "因为它将血液从心脏输送出去，名称依据相对心脏的流向。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "circulation",
    "modelNote": "血液及血管比例为示意，红蓝表示含氧相对高低，并非人体内血液呈蓝色。流动方向遵循心脏与循环路径。",
    "controls": [
      {
        "key": "circuit",
        "label": "追踪路径",
        "value": "both",
        "options": [
          {
            "value": "pulmonary",
            "label": "肺循环"
          },
          {
            "value": "systemic",
            "label": "体循环"
          },
          {
            "value": "both",
            "label": "两条循环"
          }
        ]
      },
      {
        "key": "substance",
        "label": "追踪物质",
        "value": "oxygen",
        "options": [
          {
            "value": "oxygen",
            "label": "氧气"
          },
          {
            "value": "co2",
            "label": "二氧化碳"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "氧从肺泡进入血液后，到达左心室之前先经过哪一心腔？",
      "steps": [
        {
          "title": "明确条件",
          "text": "先定位肺静脉的回流终点。"
        },
        {
          "title": "观察或依据",
          "text": "肺静脉回到左心房，再经房室瓣进入左心室。"
        },
        {
          "title": "推理与表达",
          "text": "按实际血流方向排序。"
        }
      ],
      "answer": "先经肺静脉到左心房，再进入左心室。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "血液循环的过程"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "circuits"
    }
  },
  {
    "id": "bio-blood-pressure",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第四章 人体内物质的运输",
    "title": "为他人测量血压",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7down-text"
    ],
    "objective": "理解血压读数和规范记录，识别操作条件对测量的影响。",
    "apparatus": [
      "合适型号臂式电子血压计",
      "记录表",
      "坐椅与支撑桌面"
    ],
    "steps": [
      "依说明书选择适合的袖带并安静休息。",
      "将袖带按规定位置固定，测量时不说话不移动。",
      "如实记录读数、时间和姿势，异常情况交专业人员判断。"
    ],
    "observations": [
      "仪器显示收缩压与舒张压两个数值。",
      "姿势、袖带与活动等均可能影响读数，单次结果不足以作诊断。"
    ],
    "conclusion": "血压测量需要规范姿势、适当仪器和完整记录，本课件只练习读数与操作判断。",
    "examPoints": [
      "读数带单位",
      "收缩压与舒张压不是心率",
      "袖带与心脏高度要符合规范"
    ],
    "pitfalls": [
      "不能把一次读数当诊断",
      "不能依据本页自行调整药物"
    ],
    "questions": [
      {
        "q": "测量时说话为什么不适合？",
        "a": "说话和活动会干扰测量条件，应按仪器说明安静测量。"
      }
    ],
    "safety": [
      "测量需征得同意并保护隐私；个体读数及疾病问题由专业人员解释。"
    ],
    "model": "health",
    "modelNote": "提供教材级结构、统计或防护原理练习；输入数字为样例或用户记录，不作诊断、处方或急救技能认证。",
    "controls": [
      {
        "key": "systolic",
        "label": "教学记录：收缩压",
        "min": 80,
        "max": 180,
        "value": 120,
        "step": 1,
        "unit": "mmHg"
      },
      {
        "key": "diastolic",
        "label": "教学记录：舒张压",
        "min": 40,
        "max": 120,
        "value": 80,
        "step": 1,
        "unit": "mmHg"
      },
      {
        "key": "position",
        "label": "测量姿势",
        "value": "correct",
        "options": [
          {
            "value": "correct",
            "label": "静坐，袖带与心脏同高"
          },
          {
            "value": "moving",
            "label": "说话或移动"
          },
          {
            "value": "low",
            "label": "袖带明显低于心脏"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "教学记录为120/80 mmHg，两个数字应怎样分别记录？",
      "steps": [
        {
          "title": "明确条件",
          "text": "按仪器标注区分两项压力。"
        },
        {
          "title": "观察或依据",
          "text": "前者为收缩压，后者为舒张压。"
        },
        {
          "title": "推理与表达",
          "text": "分别写出名称和单位，不将差值当心率。"
        }
      ],
      "answer": "收缩压120 mmHg，舒张压80 mmHg；此样例不构成个人健康判断。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "为他人测量血压"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "blood-pressure"
    }
  },
  {
    "id": "bio-kidney",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第五章 人体内废物的排出",
    "title": "观察肾脏与尿液形成过程",
    "kind": "小实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep7down-text",
      "bio-ncet2023"
    ],
    "objective": "辨认肾脏与肾单位结构，区分滤过和重吸收。",
    "apparatus": [
      "泌尿系统模型",
      "哺乳动物肾脏教学标本",
      "肾脏永久切片或示意图"
    ],
    "steps": [
      "从整体观察肾、输尿管、膀胱和尿道的位置。",
      "在纵切面辨认皮质、髓质与肾盂；在永久切片中寻找皮质的肾小体等结构。",
      "沿肾单位路径追踪不同成分的去向。"
    ],
    "observations": [
      "肾脏纵切可区分皮质、髓质和肾盂，显微切片可进一步观察肾小体等结构。",
      "正常情况下血细胞和大分子蛋白质通常不大量进入原尿。",
      "原尿中的葡萄糖通常被重吸收，大部分水也返回血液。"
    ],
    "conclusion": "尿液形成涉及肾小球等的滤过与肾小管等的重吸收，尿液随后经输尿管等排出。",
    "examPoints": [
      "原尿与尿液不同",
      "膀胱储尿但不形成尿",
      "排泄与排遗区别"
    ],
    "pitfalls": [
      "不能说原尿完全没有葡萄糖",
      "不能说所有水分和无机盐都被重吸收"
    ],
    "questions": [
      {
        "q": "为什么原尿中有葡萄糖，正常尿液中却通常没有？",
        "a": "葡萄糖经过滤过进入原尿后，通常又被肾小管等重吸收回血液。"
      }
    ],
    "safety": [
      "仅使用教学标本或模型；不自行检测并解释个人尿液，不据本页诊断肾病。"
    ],
    "model": "kidney",
    "modelNote": "过滤、重吸收用成分去向表示，未建模实际肾小球滤过率；结果不能用于判断个人肾功能。",
    "controls": [
      {
        "key": "view",
        "label": "观察尺度",
        "value": "nephron",
        "options": [
          {
            "value": "system",
            "label": "泌尿系统"
          },
          {
            "value": "kidney",
            "label": "肾脏纵切"
          },
          {
            "value": "nephron",
            "label": "肾单位"
          }
        ]
      },
      {
        "key": "substance",
        "label": "追踪成分",
        "value": "water",
        "options": [
          {
            "value": "water",
            "label": "水"
          },
          {
            "value": "glucose",
            "label": "葡萄糖"
          },
          {
            "value": "urea",
            "label": "尿素"
          },
          {
            "value": "protein",
            "label": "大分子蛋白质"
          },
          {
            "value": "cell",
            "label": "血细胞"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "在正常模型中追踪一个进入原尿的葡萄糖分子，后续最可能去向是什么？",
      "steps": [
        {
          "title": "明确条件",
          "text": "题设为正常重吸收功能。"
        },
        {
          "title": "观察或依据",
          "text": "葡萄糖可进入原尿并被重吸收。"
        },
        {
          "title": "推理与表达",
          "text": "将其追踪到肾小管周围血液，而非必然流入膀胱。"
        }
      ],
      "answer": "通常经重吸收返回血液，不随最终尿液排出。"
    },
    "ncetIds": [
      35,
      36
    ],
    "evidenceTitles": [
      "组成泌尿系统的器官",
      "血浆、肾小囊中的液体和尿液成分的比较"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "kidney"
    }
  },
  {
    "id": "bio-body-model",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 第五章 人体内废物的排出",
    "title": "设计并制作人体结构模型",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep7down-text"
    ],
    "objective": "用模型表达器官连接与系统功能，说明比例和动态表现的局限。",
    "apparatus": [
      "可重复利用的模型材料",
      "器官标签",
      "连接管或箭头",
      "评价记录"
    ],
    "steps": [
      "明确模型要解释的问题与观察者。",
      "按真实连接关系设计器官和路径，不追求装饰性代替准确性。",
      "让同学按模型追踪物质，发现歧义后修改。"
    ],
    "observations": [
      "位置正确不代表连接关系一定正确。",
      "同一器官可与不同系统发生功能联系，模型可选择简化但需说明。"
    ],
    "conclusion": "合格模型应准确表达关键结构和关系，同时注明未能表现的真实特征。",
    "examPoints": [
      "模型应能回答具体问题",
      "结构名称、连接方向和功能一致"
    ],
    "pitfalls": [
      "不能用美观代替科学准确",
      "不能把示意比例当人体真实大小比例"
    ],
    "questions": [
      {
        "q": "如何检验循环系统模型是否容易误导？",
        "a": "让同学从指定心腔追踪血流，检查箭头、血管连接与颜色说明是否一致。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "system",
        "label": "模型主题",
        "value": "digestive",
        "options": [
          {
            "value": "digestive",
            "label": "消化系统"
          },
          {
            "value": "respiratory",
            "label": "呼吸系统"
          },
          {
            "value": "circulatory",
            "label": "循环系统"
          },
          {
            "value": "urinary",
            "label": "泌尿系统"
          }
        ]
      },
      {
        "key": "view",
        "label": "呈现方式",
        "value": "whole",
        "options": [
          {
            "value": "whole",
            "label": "器官位置"
          },
          {
            "value": "detail",
            "label": "物质经过的路径"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "某泌尿系统模型画出肾、膀胱和尿道，却缺少输尿管，如何改进？",
      "steps": [
        {
          "title": "明确条件",
          "text": "目标是表达尿液从形成到排出的路径。"
        },
        {
          "title": "观察或依据",
          "text": "肾形成的尿液需经输尿管进入膀胱。"
        },
        {
          "title": "推理与表达",
          "text": "补充两侧肾与膀胱之间的输尿管并标注方向。"
        }
      ],
      "answer": "补充输尿管及流向，使“肾→输尿管→膀胱→尿道”路径完整。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "设计并制作人体结构模型"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "specimen": "body-model",
      "variant": "body-model"
    }
  },
  {
    "id": "bio-kidney-slide",
    "subject": "biology",
    "term": "7下",
    "chapter": "第四单元 人体生理与健康（一）",
    "title": "观察小鼠肾脏纵切永久装片",
    "kind": "学生实验",
    "tags": [
      "课标拓展",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023"
    ],
    "objective": "通过永久装片示意识别肾小体与肾小管，联系肾的宏观和微观结构。",
    "apparatus": [
      "哺乳动物肾纵切永久装片",
      "光学显微镜",
      "肾单位结构图"
    ],
    "steps": [
      "先用低倍镜观察组织轮廓并确定大致区域。",
      "在皮质区寻找近圆形肾小体及周围肾小管断面。",
      "比较髓质区域较平行排列的管道断面。",
      "结合肾单位模型区分玻片可观察形态与功能推理。"
    ],
    "observations": [
      "肾皮质可见肾小体和部分肾小管断面。",
      "肾髓质主要可见管道结构，通常不见肾小体。",
      "不同切面方向会使同一管道呈圆形或长条形。"
    ],
    "conclusion": "肾的微观结构与滤过、重吸收等功能相关；单张切片不能直接显示液体流动过程。",
    "examPoints": [
      "肾小体位于皮质",
      "显微断面不等于完整肾单位",
      "结构观察与功能解释不同"
    ],
    "pitfalls": [
      "不能把肾小球误认为肾小管",
      "不能由模型图判断个人肾健康"
    ],
    "questions": [
      {
        "q": "为什么同一装片内肾小管有的近圆形、有的呈长条？",
        "a": "管道被横切、斜切或纵切时，切面形状不同，不能只凭形状认为它们是完全不同的结构。"
      }
    ],
    "safety": [
      "只用已制好的教学永久装片；破损玻片交教师处理，不自行取动物肾组织。"
    ],
    "model": "microscope",
    "modelNote": "显微图为原创结构示意，不是显微照片。放大倍数为目镜×物镜；焦距滑块仅示意调焦，不是实际镜筒位移。视野大小采用同一目镜的比例关系。",
    "controls": [
      {
        "key": "eyepiece",
        "label": "目镜",
        "min": 5,
        "max": 15,
        "value": 10,
        "step": 5,
        "unit": "倍"
      },
      {
        "key": "objective",
        "label": "物镜",
        "value": "10",
        "options": [
          {
            "value": "4",
            "label": "4倍"
          },
          {
            "value": "10",
            "label": "10倍"
          },
          {
            "value": "40",
            "label": "40倍"
          }
        ]
      },
      {
        "key": "focus",
        "label": "细准焦位置",
        "min": -5,
        "max": 5,
        "value": 0,
        "step": 1,
        "unit": ""
      },
      {
        "key": "region",
        "label": "观察区域",
        "value": "cortex",
        "options": [
          {
            "value": "cortex",
            "label": "皮质区域"
          },
          {
            "value": "medulla",
            "label": "髓质区域"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "皮质视野出现近圆形血管团及其外围囊腔，应如何描述？",
      "steps": [
        {
          "title": "明确条件",
          "text": "先辨认血管团和外围结构，而不把颜色当作生理状态。"
        },
        {
          "title": "观察或依据",
          "text": "血管团属于肾小球，与肾小囊共同组成肾小体。"
        },
        {
          "title": "推理与表达",
          "text": "联系滤过功能，但切片静态观察本身不测出滤过速率。"
        }
      ],
      "answer": "该结构可判为肾小体，含肾小球与肾小囊；装片不能直接测量肾功能。"
    },
    "ncetIds": [
      36
    ],
    "evidenceTitles": [],
    "evidenceStatus": "2023基本目录已核对；本网站学期归类",
    "config": {
      "specimen": "kidney-slide"
    }
  },
  {
    "id": "bio-eye",
    "subject": "biology",
    "term": "8上",
    "chapter": "第四单元 第六章 人体生命活动的调节",
    "title": "制作可调节的眼球成像模型",
    "kind": "拓展探究",
    "tags": [
      "课标拓展",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023"
    ],
    "objective": "用成像模型说明晶状体调节、视网膜成像与矫正原理。",
    "apparatus": [
      "可调凸透镜",
      "眼球模型与光屏",
      "远近物体标志"
    ],
    "steps": [
      "定位代表视网膜的光屏。",
      "改变物体远近和晶状体曲度，寻找清晰像。",
      "比较近视模型加凹透镜前后的成像位置。",
      "设计可调模型：用凸透镜表示等效屈光结构、半透明屏表示视网膜，固定屏与透镜距离，比较不同屈光条件；注明模型不包含角膜、晶状体、神经的全部细节。",
      "制作后用同一物体和统一观察距离检查成像，再修改模型与标签。"
    ],
    "observations": [
      "近视眼看远物时像易落在视网膜前。",
      "凹透镜使光线先发散，可帮助近视模型在视网膜成像。"
    ],
    "conclusion": "看清物体需要像落在视网膜上，视觉在大脑相关区域形成。",
    "examPoints": [
      "成像与视觉形成位置区别",
      "近视凹透镜、远视凸透镜"
    ],
    "pitfalls": [
      "模型不等于验光结果",
      "不能用放大镜会聚阳光照眼"
    ],
    "questions": [
      {
        "q": "视网膜上有像就一定有视觉吗？",
        "a": "还需要视神经传递信息和大脑相关区域正常工作。"
      }
    ],
    "safety": [
      "只用人工低强度光源和模型；不直视太阳或将强光对准眼睛。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。 相关物理量由Godot引擎求解；生物解释与真实实验误差另作分析。 等效眼薄透镜使用任意教学尺度与固定屈光偏差，不能换算个人验光度数；近物情景包含示意调节。",
    "controls": [
      {
        "key": "eye",
        "label": "眼模型",
        "value": "normal",
        "options": [
          {
            "value": "normal",
            "label": "正常眼"
          },
          {
            "value": "myopia",
            "label": "近视模型"
          },
          {
            "value": "hyperopia",
            "label": "远视模型"
          }
        ]
      },
      {
        "key": "correction",
        "label": "矫正镜",
        "value": "none",
        "options": [
          {
            "value": "none",
            "label": "不加镜"
          },
          {
            "value": "concave",
            "label": "凹透镜"
          },
          {
            "value": "convex",
            "label": "凸透镜"
          }
        ]
      },
      {
        "key": "distance",
        "label": "物体位置",
        "value": "far",
        "options": [
          {
            "value": "far",
            "label": "远物"
          },
          {
            "value": "near",
            "label": "近物"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "近视模型看远物，光屏前已经会聚，选择什么镜片？",
      "steps": [
        {
          "title": "明确条件",
          "text": "问题为成像过早。"
        },
        {
          "title": "观察或依据",
          "text": "先使入射光适当发散可使焦点后移。"
        },
        {
          "title": "推理与表达",
          "text": "选择凹透镜并调至像落在代表视网膜的光屏。"
        }
      ],
      "answer": "应使用适合的凹透镜；实际配镜须专业验光。"
    },
    "ncetIds": [
      47
    ],
    "evidenceTitles": [],
    "evidenceStatus": "2023基本目录已核对；本网站学期归类",
    "config": {
      "specimen": "eye"
    },
    "requiresPhysics": true
  },
  {
    "id": "bio-reflex",
    "subject": "biology",
    "term": "8上",
    "chapter": "第四单元 第六章 人体生命活动的调节",
    "title": "膝跳反射与反射弧",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep8up-text",
      "bio-ncet2023"
    ],
    "objective": "理解反射需要完整反射弧，区分反射与感觉。",
    "apparatus": [
      "膝跳反射教学模型",
      "座椅",
      "示意图"
    ],
    "steps": [
      "观察模型或在教师指导下使受试者放松小腿。",
      "轻叩适当肌腱位置，观察反应。",
      "沿感受器、传入神经、神经中枢、传出神经、效应器追踪信号。"
    ],
    "observations": [
      "完整通路受到适宜刺激时出现相应运动。",
      "反射弧任一必要环节受损都可影响该反射。"
    ],
    "conclusion": "膝跳反射属于非条件反射，脊髓参与其基本反射中枢。",
    "examPoints": [
      "五部分与传导方向",
      "感觉不等同反射"
    ],
    "pitfalls": [
      "不能据一次未引出反射自行诊断",
      "不能用疼痛刺激验证缩手反射"
    ],
    "questions": [
      {
        "q": "膝跳反射需要先由大脑发出有意识指令吗？",
        "a": "基本反射不需要先有意识决定，但高级中枢可影响脊髓活动。"
      }
    ],
    "safety": [
      "只作轻柔、规范的课堂演示；有伤病者不参与，禁止疼痛、电击等刺激。"
    ],
    "model": "reflex",
    "modelNote": "反射弧信号传播为示意，动画速度不代表真实潜伏期，不能用本页进行神经功能诊断。",
    "controls": [
      {
        "key": "stimulus",
        "label": "刺激",
        "value": "tap",
        "options": [
          {
            "value": "tap",
            "label": "轻叩适当位置"
          },
          {
            "value": "none",
            "label": "无刺激"
          }
        ]
      },
      {
        "key": "path",
        "label": "模型通路",
        "value": "intact",
        "options": [
          {
            "value": "intact",
            "label": "反射弧完整"
          },
          {
            "value": "sensory",
            "label": "传入通路中断"
          },
          {
            "value": "motor",
            "label": "传出通路中断"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "模型中传出神经中断，刺激感受器后能否出现该反射运动？",
      "steps": [
        {
          "title": "明确条件",
          "text": "刺激与传入通路仍存在。"
        },
        {
          "title": "观察或依据",
          "text": "效应器需要接收传出信号。"
        },
        {
          "title": "推理与表达",
          "text": "通路中断使该运动反射不能完整实现。"
        }
      ],
      "answer": "不能通过这条中断的反射弧完成相应运动。"
    },
    "ncetIds": [
      37
    ],
    "evidenceTitles": [
      "膝跳反射"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-reaction",
    "subject": "biology",
    "term": "8上",
    "chapter": "第四单元 第六章 人体生命活动的调节",
    "title": "测定反应速度",
    "kind": "学生实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8up-text"
    ],
    "objective": "用尺下落距离间接比较反应时间，认识重复与标准化。",
    "apparatus": [
      "刻度尺",
      "记录表",
      "同伴"
    ],
    "steps": [
      "使受试者手指与尺的零刻度位置对应。",
      "在受试者不预知的时刻放尺，记录夹住位置。",
      "保持姿势和规则一致，重复比较。"
    ],
    "observations": [
      "距离越小，在相同模型下对应反应时间越短。",
      "预判放尺、改变手指间距会影响可比性。"
    ],
    "conclusion": "可用自由落体近似把距离换算为时间，但测得的是整体反应过程。",
    "examPoints": [
      "重复测量降低偶然误差",
      "单位cm转m"
    ],
    "pitfalls": [
      "反应时间不是神经冲动速度",
      "有意预判使测量失真"
    ],
    "questions": [
      {
        "q": "重复3次就必然得到真实反应时间吗？",
        "a": "不能保证；还需统一条件、排除预判，并如实处理异常读数。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "reaction",
    "modelNote": "反应时间由尺下落的距离按自由落体公式换算，包含感知、神经传导及动作时间，不能直接等同神经传导速度。 相关物理量由Godot引擎求解；生物解释与真实实验误差另作分析。 模型时间从Godot自由下落轨迹按输入距离插值，可能与理想公式值有微小积分差。",
    "controls": [
      {
        "key": "distance",
        "label": "尺下落距离",
        "min": 1,
        "max": 50,
        "value": 20,
        "step": 1,
        "unit": "cm"
      },
      {
        "key": "trial",
        "label": "重复次数",
        "min": 1,
        "max": 10,
        "value": 3,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "示例尺下落20 cm，取g=9.8 m/s²，估算时间。",
      "steps": [
        {
          "title": "明确条件",
          "text": "距离20 cm=0.20 m。"
        },
        {
          "title": "观察或依据",
          "text": "由d=gt²/2得t=√(2d/g)。"
        },
        {
          "title": "推理与表达",
          "text": "t=√(0.40/9.8)≈0.202 s。"
        }
      ],
      "answer": "该次模型估计反应时间约0.202 s。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "测定反应速度"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "ruler"
    },
    "requiresPhysics": true
  },
  {
    "id": "bio-muscle",
    "subject": "biology",
    "term": "8上",
    "chapter": "第四单元 第六章 人体生命活动的调节",
    "title": "观察骨、关节和肌肉及屈伸肘动作",
    "kind": "小实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep8up-text",
      "bio-ncet2023"
    ],
    "objective": "理解骨、关节和骨骼肌配合产生运动。",
    "apparatus": [
      "上肢模型",
      "合法来源鸡翅教学标本",
      "结构图"
    ],
    "steps": [
      "观察肌腱如何附着于相邻骨。",
      "辨认关节面、关节囊和关节腔。",
      "比较屈肘和伸肘时拮抗肌的状态。"
    ],
    "observations": [
      "肌肉收缩牵拉骨绕关节运动。",
      "屈肘与伸肘时主要拮抗肌的配合不同。"
    ],
    "conclusion": "骨起支持和杠杆作用，关节作为运动连接，肌肉提供牵拉动力。",
    "examPoints": [
      "肌肉只能牵拉不能主动推骨",
      "运动还需神经调节与能量供应"
    ],
    "pitfalls": [
      "不能把关节说成动力来源",
      "不能说每次运动都只靠一块肌肉"
    ],
    "questions": [
      {
        "q": "肌肉两端为什么通常附着在不同骨上？",
        "a": "跨过关节的附着使收缩能牵拉骨围绕关节运动。"
      }
    ],
    "safety": [
      "使用模型优先；标本解剖由教师指导，工具与生物材料规范消毒处置。"
    ],
    "model": "muscle",
    "modelNote": "简化骨—关节—肌肉结构模型，强调拮抗肌协调；肌长和关节角度不是人体生物力学测量结果。",
    "controls": [
      {
        "key": "angle",
        "label": "肘关节弯曲角",
        "min": 0,
        "max": 120,
        "value": 80,
        "step": 10,
        "unit": "°"
      },
      {
        "key": "action",
        "label": "观察动作",
        "value": "flex",
        "options": [
          {
            "value": "flex",
            "label": "屈肘"
          },
          {
            "value": "extend",
            "label": "伸肘"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "屈肘时主要运动方向由什么结构配合实现？",
      "steps": [
        {
          "title": "明确条件",
          "text": "骨通过关节相连，肌肉跨关节附着。"
        },
        {
          "title": "观察或依据",
          "text": "主要屈肌收缩、伸肌相应配合。"
        },
        {
          "title": "推理与表达",
          "text": "肌肉牵拉前臂骨绕肘关节运动。"
        }
      ],
      "answer": "屈肘由骨、关节与拮抗肌协调完成，并受神经调节。"
    },
    "ncetIds": [
      38
    ],
    "evidenceTitles": [
      "骨、关节和肌肉",
      "屈肘动作和伸肘动作"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-hormone",
    "subject": "biology",
    "term": "8上",
    "chapter": "第四单元 第六章 人体生命活动的调节",
    "title": "设计甲状腺激素作用的对照方案",
    "kind": "拓展探究",
    "tags": [
      "原创拓展"
    ],
    "sourceIds": [
      "bio-pep-new"
    ],
    "objective": "练习识别自变量、控制变量和观察指标。",
    "apparatus": [
      "纸面实验方案",
      "发育阶段模型",
      "记录表"
    ],
    "steps": [
      "先提出激素处理对发育是否有影响的问题。",
      "设计只改变激素处理的两组。",
      "统一品种、年龄、饲料、环境，明确发育指标与重复。"
    ],
    "observations": [
      "同时改变饲料和激素会混淆原因。",
      "单一个体容易受个体差异影响。"
    ],
    "conclusion": "探究激素作用需合理对照；模型只评价设计，不能据此获取真实药效。",
    "examPoints": [
      "控制变量",
      "因果证据与个体差异"
    ],
    "pitfalls": [
      "不能把生长和发育混为一谈",
      "不能自行给动物使用激素"
    ],
    "questions": [
      {
        "q": "两组激素和食物同时不同能说明激素作用吗？",
        "a": "不能唯一归因于激素，需要保持其他条件相同。"
      }
    ],
    "safety": [
      "只作纸面与模型设计，不自行购买或给动物施用激素。"
    ],
    "model": "health",
    "modelNote": "提供教材级结构、统计或防护原理练习；输入数字为样例或用户记录，不作诊断、处方或急救技能认证。",
    "controls": [
      {
        "key": "factor",
        "label": "两组区别",
        "value": "hormone",
        "options": [
          {
            "value": "hormone",
            "label": "仅激素处理不同"
          },
          {
            "value": "food",
            "label": "激素与饲料都不同"
          }
        ]
      },
      {
        "key": "replicate",
        "label": "重复设置",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "多只并设重复"
          },
          {
            "value": "no",
            "label": "每组仅一只"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "甲组加激素且饲料多，乙组不加激素且饲料少，找缺陷。",
      "steps": [
        {
          "title": "明确条件",
          "text": "存在激素和饲料两个差异。"
        },
        {
          "title": "观察或依据",
          "text": "对照设计应尽量只保留研究变量。"
        },
        {
          "title": "推理与表达",
          "text": "统一饲料等条件，并设置足够重复。"
        }
      ],
      "answer": "方案存在混杂变量，应统一饲料后比较。"
    },
    "ncetIds": [],
    "evidenceTitles": [],
    "evidenceStatus": "原创拓展；非已核教材活动标题",
    "config": {
      "variant": "hormone"
    }
  },
  {
    "id": "bio-daphnia",
    "subject": "biology",
    "term": "8上",
    "chapter": "第四单元 第七章 健康地生活",
    "title": "探究酒精对水蚤心率的影响",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep8up-text",
      "bio-ncet2023"
    ],
    "objective": "学习在控制条件下记录心率，区分数据和预期。",
    "apparatus": [
      "水蚤教学影像",
      "显微镜",
      "计时器",
      "记录表"
    ],
    "steps": [
      "设置清水对照及处理组，统一温度、观察时长等条件。",
      "以相同方法计数，使用多个个体及重复。",
      "由次数与时间求心率，比较实际记录再下结论。"
    ],
    "observations": [
      "心率取决于观察次数和时长。",
      "个体、温度、处理顺序等都可能影响结果。"
    ],
    "conclusion": "必须依据真实观察比较，不预先规定酒精浓度与心率为线性关系。",
    "examPoints": [
      "心率=次数÷时间",
      "区分重复测量与独立个体重复"
    ],
    "pitfalls": [
      "不能直接用水蚤结果定量预测人的心率",
      "不能把合成示意数据写成实测"
    ],
    "questions": [
      {
        "q": "为什么不宜只让同一只水蚤依次经历越来越高浓度？",
        "a": "前一次处理的残留作用可能混入后续结果，应设计独立组并控制其他条件。"
      }
    ],
    "safety": [
      "优先采用教学影像和本模拟；实物实验由教师审查伦理与处置，勿自行对动物施加有害处理。"
    ],
    "model": "health",
    "modelNote": "提供教材级结构、统计或防护原理练习；输入数字为样例或用户记录，不作诊断、处方或急救技能认证。",
    "controls": [
      {
        "key": "concentration",
        "label": "酒精组标记",
        "min": 0,
        "max": 5,
        "value": 1,
        "step": 0.5,
        "unit": "%"
      },
      {
        "key": "beats",
        "label": "观察到的心搏次数",
        "min": 0,
        "max": 100,
        "value": 30,
        "step": 1,
        "unit": "次"
      },
      {
        "key": "seconds",
        "label": "观察时长",
        "min": 5,
        "max": 60,
        "value": 10,
        "step": 5,
        "unit": "s"
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "示例10秒内计数30次，计算心率。",
      "steps": [
        {
          "title": "明确条件",
          "text": "观察时长换算为分钟：10/60 min。"
        },
        {
          "title": "观察或依据",
          "text": "心率=30÷(10/60)。"
        },
        {
          "title": "推理与表达",
          "text": "得到180次/min；这是该次输入记录的换算。"
        }
      ],
      "answer": "输入记录对应180次/min，不表示特定酒精浓度的通用效应。"
    },
    "ncetIds": [
      39
    ],
    "evidenceTitles": [
      "酒精对水蚤心率的影响"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "daphnia"
    }
  },
  {
    "id": "bio-infection",
    "subject": "biology",
    "term": "8上",
    "chapter": "第四单元 第七章 健康地生活",
    "title": "调查当地传染病并设计预防海报",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep8up-text",
      "bio-ncet2023"
    ],
    "objective": "使用公开卫生资料分析传播环节，不进行个人诊断。",
    "apparatus": [
      "疾控机构公开资料",
      "资料来源表",
      "海报模板"
    ],
    "steps": [
      "明确地区、时间及所调查疾病。",
      "记录数据来源，区分病原体、传染源与传播途径。",
      "围绕相应环节提出有依据的宣传内容。"
    ],
    "observations": [
      "同一预防措施可能涉及多个环节。",
      "不同疾病的适用措施不同。"
    ],
    "conclusion": "传染病预防应结合具体传播特点，公开资料优于未经核实传言。",
    "examPoints": [
      "传染源不是病原体本身",
      "分类判断需结合情境"
    ],
    "pitfalls": [
      "不能擅自访问传染病病区",
      "不发布个人患者隐私"
    ],
    "questions": [
      {
        "q": "给病人隔离治疗和接种疫苗主要针对同一环节吗？",
        "a": "通常分别主要针对传染源和易感人群，需结合具体疾病说明。"
      }
    ],
    "safety": [
      "只用公开、匿名资料；不接触患者或采集病原样本。"
    ],
    "model": "health",
    "modelNote": "提供教材级结构、统计或防护原理练习；输入数字为样例或用户记录，不作诊断、处方或急救技能认证。",
    "controls": [
      {
        "key": "route",
        "label": "主要传播途径",
        "value": "air",
        "options": [
          {
            "value": "air",
            "label": "呼吸道传播"
          },
          {
            "value": "food",
            "label": "消化道传播"
          },
          {
            "value": "vector",
            "label": "媒介生物传播"
          }
        ]
      },
      {
        "key": "measure",
        "label": "措施重点",
        "value": "source",
        "options": [
          {
            "value": "source",
            "label": "管理传染源"
          },
          {
            "value": "route",
            "label": "切断传播途径"
          },
          {
            "value": "host",
            "label": "保护易感人群"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "海报提出加强通风与按要求接种疫苗，说明主要作用。",
      "steps": [
        {
          "title": "明确条件",
          "text": "区分传播过程中的不同环节。"
        },
        {
          "title": "观察或依据",
          "text": "通风可减少某些呼吸道传播风险；疫苗促进针对相应病原体的免疫保护。"
        },
        {
          "title": "推理与表达",
          "text": "不能把疫苗说成治疗已经发生的所有感染。"
        }
      ],
      "answer": "通风侧重传播途径，疫苗侧重保护易感人群。"
    },
    "ncetIds": [
      40,
      41
    ],
    "evidenceTitles": [
      "调查当地的主要传染病",
      "健康生活宣传展演"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "infection"
    }
  },
  {
    "id": "bio-first-aid",
    "subject": "biology",
    "term": "8上",
    "chapter": "第四单元 第七章 健康地生活",
    "title": "用药说明与急救模拟实践",
    "kind": "拓展探究",
    "tags": [
      "课标拓展",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023"
    ],
    "objective": "识别安全用药信息，熟悉求助及规范急救训练的意义。",
    "apparatus": [
      "无药物的说明书样张",
      "急救训练模型",
      "急救流程图"
    ],
    "steps": [
      "查看适应证、禁忌、有效期及医嘱要求。",
      "在训练模型上学习急救流程，明确何时呼救。",
      "区分课堂模型操作与真实急救的技能要求。"
    ],
    "observations": [
      "非处方药也可能有禁忌和不良反应。",
      "真实紧急情况应呼叫120并听从调度指导。"
    ],
    "conclusion": "安全用药与急救依赖准确情境、正规训练和专业指导。",
    "examPoints": [
      "处方药遵医嘱",
      "药品有效期与保存条件"
    ],
    "pitfalls": [
      "不能把成人剂量直接用于儿童",
      "不能在同学身上练习胸外按压"
    ],
    "questions": [
      {
        "q": "标有OTC就可以随意加量吗？",
        "a": "不可以，仍需按说明和专业建议使用，注意禁忌与相互作用。"
      }
    ],
    "safety": [
      "仅使用训练模型；真实紧急情况拨打120并遵循调度员指导，页面不代替急救培训。"
    ],
    "model": "health",
    "modelNote": "提供教材级结构、统计或防护原理练习；输入数字为样例或用户记录，不作诊断、处方或急救技能认证。",
    "controls": [
      {
        "key": "scenario",
        "label": "练习情境",
        "value": "medicine",
        "options": [
          {
            "value": "medicine",
            "label": "阅读药品说明信息"
          },
          {
            "value": "collapse",
            "label": "呼救与心肺复苏流程模型"
          },
          {
            "value": "bleeding",
            "label": "包扎止血模型"
          }
        ]
      },
      {
        "key": "action",
        "label": "行动选择",
        "value": "help",
        "options": [
          {
            "value": "help",
            "label": "先评估安全并寻求专业帮助"
          },
          {
            "value": "guess",
            "label": "凭印象自行处理"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "同学突然倒地，现场有车辆来往，首要考虑什么？",
      "steps": [
        {
          "title": "明确条件",
          "text": "先观察施救者及现场安全。"
        },
        {
          "title": "观察或依据",
          "text": "避免新增伤害并及时呼叫专业急救。"
        },
        {
          "title": "推理与表达",
          "text": "后续按调度及受训流程行动。"
        }
      ],
      "answer": "先确保环境安全，立即寻求专业急救帮助。"
    },
    "ncetIds": [
      32
    ],
    "evidenceTitles": [],
    "evidenceStatus": "2023基本目录已核对；本网站学期归类",
    "config": {
      "variant": "firstaid"
    }
  },
  {
    "id": "bio-smoke",
    "subject": "biology",
    "term": "8上",
    "chapter": "第四单元 第七章 健康地生活",
    "title": "制作模型说明吸烟有害健康",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep8up-text",
      "bio-ncet2023"
    ],
    "objective": "区分模型过滤现象与人体健康效应的证据范围。",
    "apparatus": [
      "密闭演示装置模型",
      "滤材模型",
      "可靠健康资料"
    ],
    "steps": [
      "设计对照空气通路。",
      "在屏幕中比较滤材颜色与颗粒截留。",
      "解释模型不能代表所有气体组分和人体长期反应。"
    ],
    "observations": [
      "模型滤材可显示颗粒沉积。",
      "未被滤材截留的物质不能据此视为无害。"
    ],
    "conclusion": "颗粒沉积是有限证据，吸烟危害不能只凭一次过滤模拟定量评估。",
    "examPoints": [
      "模型对应关系",
      "证据适用范围"
    ],
    "pitfalls": [
      "不能认为加过滤嘴就安全",
      "不能为做实验主动制造二手烟"
    ],
    "questions": [
      {
        "q": "滤棉只变一点颜色，是否说明烟雾危害小？",
        "a": "不能，颜色只反映部分沉积，不能衡量全部有害物质和长期影响。"
      }
    ],
    "safety": [
      "使用屏幕模拟或已有教学影像，不点燃烟草、不让人吸入烟雾。"
    ],
    "model": "health",
    "modelNote": "提供教材级结构、统计或防护原理练习；输入数字为样例或用户记录，不作诊断、处方或急救技能认证。",
    "controls": [
      {
        "key": "exposure",
        "label": "模拟输入",
        "value": "clean",
        "options": [
          {
            "value": "clean",
            "label": "清洁空气"
          },
          {
            "value": "smoke",
            "label": "烟雾颗粒示意"
          }
        ]
      },
      {
        "key": "barrier",
        "label": "观察部位",
        "value": "filter",
        "options": [
          {
            "value": "filter",
            "label": "模型过滤材料"
          },
          {
            "value": "airway",
            "label": "呼吸道结构"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "对照滤棉不变色，烟雾通路滤棉变色，规范表述现象。",
      "steps": [
        {
          "title": "明确条件",
          "text": "两组使用相同滤材和通气方法。"
        },
        {
          "title": "观察或依据",
          "text": "处理通路出现沉积。"
        },
        {
          "title": "推理与表达",
          "text": "仅得出烟雾含可沉积物质，不估算人体损伤程度。"
        }
      ],
      "answer": "烟雾通路出现可沉积物质；不能由颜色定量判断健康损害。"
    },
    "ncetIds": [
      48
    ],
    "evidenceTitles": [
      "健康生活宣传展演"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "smoke"
    }
  },
  {
    "id": "bio-woodlouse",
    "subject": "biology",
    "term": "8上",
    "chapter": "第五单元 第一章 生态系统",
    "title": "探究非生物因素对某种动物的影响",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep8up-text",
      "bio-ncet2023"
    ],
    "objective": "用单一变量实验探究动物分布与环境的关系。",
    "apparatus": [
      "明暗或干湿选择装置",
      "适宜教学动物",
      "记录表"
    ],
    "steps": [
      "设计可连通的两个区域，只改变一个因素。",
      "开始时两侧数量均等，给予适应时间。",
      "多次观察并统计，不随意改变条件。"
    ],
    "observations": [
      "单个动物有偶然运动。",
      "群体分布的重复差异才可作为证据。"
    ],
    "conclusion": "结果应基于重复记录；本动画只示意趋向，不提供真实分布数据。",
    "examPoints": [
      "单一变量",
      "重复与放回适宜环境"
    ],
    "pitfalls": [
      "同时改变光与湿度会混淆",
      "不能强迫动物长时间处在有害条件"
    ],
    "questions": [
      {
        "q": "研究光照时两侧湿度不同会怎样？",
        "a": "无法区分观察到的差异来自光照还是湿度。"
      }
    ],
    "safety": [
      "善待动物，避免极端温湿条件；结束后按教师要求放回适宜环境。"
    ],
    "model": "ecology",
    "modelNote": "情景或比率模型用于比较生物与环境关系，不预测真实种群数量。生态瓶不存在保证永久稳定的配方。",
    "controls": [
      {
        "key": "factor",
        "label": "研究因素",
        "value": "light",
        "options": [
          {
            "value": "light",
            "label": "光照"
          },
          {
            "value": "moisture",
            "label": "湿度"
          }
        ]
      },
      {
        "key": "contrast",
        "label": "对照设置",
        "value": "different",
        "options": [
          {
            "value": "different",
            "label": "左右条件不同"
          },
          {
            "value": "same",
            "label": "左右条件相同"
          }
        ]
      },
      {
        "key": "count",
        "label": "示意动物数",
        "min": 6,
        "max": 20,
        "value": 10,
        "step": 2,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "探究鼠妇对光照的反应，如何设置对照？",
      "steps": [
        {
          "title": "明确条件",
          "text": "两侧仅明暗不同。"
        },
        {
          "title": "观察或依据",
          "text": "温度、湿度、土壤、初始数量等相同。"
        },
        {
          "title": "推理与表达",
          "text": "重复观察分布并如实报告。"
        }
      ],
      "answer": "设置明暗差异并保持其他条件一致，再比较重复记录。"
    },
    "ncetIds": [
      12
    ],
    "evidenceTitles": [
      "非生物因素对某种动物的影响"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-vegetation",
    "subject": "biology",
    "term": "8上",
    "chapter": "第五单元 第一章 生态系统",
    "title": "调查植被条件与空气温湿度的关系",
    "kind": "拓展探究",
    "tags": [
      "课标拓展",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep8up-text",
      "bio-ncet2023"
    ],
    "objective": "在相同时间、位置高度等条件下比较环境指标。",
    "apparatus": [
      "温湿度计",
      "统一高度支架",
      "地点记录表"
    ],
    "steps": [
      "选择相近且可比的裸地与植被地。",
      "在同一时段同一高度测量并避免直晒仪器。",
      "记录重复结果，讨论混杂因素。"
    ],
    "observations": [
      "植被与温湿度可能相关，但地形、风和遮阴也影响测量。",
      "单次测量不足以概括所有天气。"
    ],
    "conclusion": "结论应限定于地点、时间和测量条件。",
    "examPoints": [
      "同一指标与同一仪器",
      "相关不自动证明唯一因果"
    ],
    "pitfalls": [
      "不能把不同日期的结果直接配对",
      "不要把相对湿度与水蒸气总量混淆"
    ],
    "questions": [
      {
        "q": "为何必须统一测量高度？",
        "a": "高度改变可能改变光照、通风和湿度，从而干扰植被因素的比较。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "survey",
    "modelNote": "场景中的数量为可编辑的教学样本；统计结论只适用于该样本，不能冒充校园、地区或人群的实测结果。",
    "controls": [
      {
        "key": "openHumidity",
        "label": "裸地相对湿度记录",
        "min": 0,
        "max": 100,
        "value": 52,
        "step": 1,
        "unit": "%"
      },
      {
        "key": "plantHumidity",
        "label": "植被地相对湿度记录",
        "min": 0,
        "max": 100,
        "value": 68,
        "step": 1,
        "unit": "%"
      },
      {
        "key": "repeats",
        "label": "重复测量次数",
        "min": 1,
        "max": 10,
        "value": 3,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "示例裸地52%、植被地68%，求湿度差。",
      "steps": [
        {
          "title": "明确条件",
          "text": "两者均为相对湿度，单位为百分数。"
        },
        {
          "title": "观察或依据",
          "text": "68%−52%=16个百分点。"
        },
        {
          "title": "推理与表达",
          "text": "结果限于该次样例，不推断全年平均。"
        }
      ],
      "answer": "示例中植被地比裸地高16个百分点。"
    },
    "ncetIds": [
      13
    ],
    "evidenceTitles": [
      "调查 不同植被条件下的气温和湿度"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "vegetation"
    }
  },
  {
    "id": "bio-foodweb",
    "subject": "biology",
    "term": "8上",
    "chapter": "第五单元 第一章 生态系统",
    "title": "观察食物网与生物之间的关系",
    "kind": "小实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep8up-text",
      "bio-ncet2023"
    ],
    "objective": "识别营养关系，区分食物链与生态系统组成。",
    "apparatus": [
      "校园或草地记录",
      "生物关系卡片",
      "食物网模型"
    ],
    "steps": [
      "记录谁以谁为食，避免仅按体型猜测。",
      "从生产者开始按能量流动方向连箭头。",
      "补充非生物环境与分解者，讨论变化。"
    ],
    "observations": [
      "食物网中同一生物可处于不同食物链。",
      "生态系统还包括分解者和非生物成分。"
    ],
    "conclusion": "食物链箭头表示物质和能量传递方向，生态关系比单条链复杂。",
    "examPoints": [
      "箭头由被食者指向捕食者",
      "食物链中不写非生物成分"
    ],
    "pitfalls": [
      "不能把分解者从生态系统删去",
      "不能断言捕食者越少越好"
    ],
    "questions": [
      {
        "q": "草→兔→狐表示狐给兔提供能量吗？",
        "a": "不是，箭头由食物指向取食者，表示能量沿草、兔到狐传递。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "ecology",
    "modelNote": "情景或比率模型用于比较生物与环境关系，不预测真实种群数量。生态瓶不存在保证永久稳定的配方。",
    "controls": [
      {
        "key": "relationship",
        "label": "观察关系",
        "value": "predation",
        "options": [
          {
            "value": "predation",
            "label": "捕食"
          },
          {
            "value": "competition",
            "label": "竞争"
          },
          {
            "value": "cooperation",
            "label": "合作"
          }
        ]
      },
      {
        "key": "disturbance",
        "label": "情景变化",
        "value": "normal",
        "options": [
          {
            "value": "normal",
            "label": "正常结构"
          },
          {
            "value": "lessgrass",
            "label": "草减少"
          },
          {
            "value": "lesspredator",
            "label": "捕食者减少"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "写出草、兔、狐组成的食物链并说明箭头意义。",
      "steps": [
        {
          "title": "明确条件",
          "text": "草为生产者，兔吃草，狐可吃兔。"
        },
        {
          "title": "观察或依据",
          "text": "能量从被取食者传给取食者。"
        },
        {
          "title": "推理与表达",
          "text": "按草→兔→狐连接。"
        }
      ],
      "answer": "草→兔→狐；箭头表示物质和能量传递方向。"
    },
    "ncetIds": [
      14
    ],
    "evidenceTitles": [
      "调查校园或农田中生物之间的关系",
      "草原生态系统的营养结构",
      "生态系统中的物质和能量变化"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-ecosystem",
    "subject": "biology",
    "term": "8上",
    "chapter": "第五单元 第一章 生态系统",
    "title": "设计并制作生态瓶",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep8up-text",
      "bio-ncet2023"
    ],
    "objective": "用物质循环、能量输入与承载限度评价生态瓶设计。",
    "apparatus": [
      "透明容器模型",
      "水草与水生动物模型",
      "观察计划"
    ],
    "steps": [
      "明确生物与非生物组成。",
      "控制动物数量，提供适宜光照并避免过热。",
      "长期记录，依据状态调整方案并解释模型局限。"
    ],
    "observations": [
      "生产者光合作用需光；生物呼吸持续消耗氧。",
      "动物过多或持续黑暗可能使供需失衡。"
    ],
    "conclusion": "生态系统维持需要能量输入与合适的物质条件，自我调节能力有限。",
    "examPoints": [
      "能量流动与物质循环不同",
      "开放或封闭边界要明确"
    ],
    "pitfalls": [
      "不能保证密闭瓶永久稳定",
      "不可将热带鱼放入未经检验的小密闭瓶"
    ],
    "questions": [
      {
        "q": "密闭生态瓶为什么仍要光照？",
        "a": "瓶内物质可部分循环，但能量需要从外界输入，通常来自光。"
      }
    ],
    "safety": [
      "优先做模型设计；真实饲养须满足动物空间、供氧和福利要求，异常及时处理。"
    ],
    "model": "ecology",
    "modelNote": "情景或比率模型用于比较生物与环境关系，不预测真实种群数量。生态瓶不存在保证永久稳定的配方。",
    "controls": [
      {
        "key": "plants",
        "label": "水生植物相对量",
        "min": 0,
        "max": 10,
        "value": 5,
        "step": 1,
        "unit": ""
      },
      {
        "key": "animals",
        "label": "动物相对负荷",
        "min": 0,
        "max": 10,
        "value": 2,
        "step": 1,
        "unit": ""
      },
      {
        "key": "light",
        "label": "光照条件",
        "value": "day",
        "options": [
          {
            "value": "day",
            "label": "适度光照"
          },
          {
            "value": "dark",
            "label": "持续黑暗"
          },
          {
            "value": "strong",
            "label": "强烈直晒"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "设计中增加很多动物而不增加植物，长期一定更丰富稳定吗？",
      "steps": [
        {
          "title": "明确条件",
          "text": "动物增加带来呼吸与废物负荷。"
        },
        {
          "title": "观察或依据",
          "text": "系统供氧、分解和食物供应有限。"
        },
        {
          "title": "推理与表达",
          "text": "多样或数量多不自动等于稳定。"
        }
      ],
      "answer": "不一定，过大的动物负荷可超过系统调节能力。"
    },
    "ncetIds": [
      49
    ],
    "evidenceTitles": [
      "设计并制作生态瓶"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-acidrain",
    "subject": "biology",
    "term": "8上",
    "chapter": "第五单元 第二章 生态安全",
    "title": "探究酸雨对生物的影响",
    "kind": "学生实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8up-text"
    ],
    "objective": "设计酸度对植物萌发影响的对照实验并处理记录。",
    "apparatus": [
      "植物种子",
      "pH测量工具",
      "教师配制处理液",
      "记录表"
    ],
    "steps": [
      "选同品种且状态相近的种子，分组并设置重复。",
      "处理组与对照组只改变酸度。",
      "按同一萌发标准计数，比较发芽率。"
    ],
    "observations": [
      "发芽数由实际记录决定，不能按pH直接编造。",
      "水分、温度、种子活力等也影响萌发。"
    ],
    "conclusion": "酸度效应需通过可比数据判断，不能以一个组证明因果。",
    "examPoints": [
      "对照与重复",
      "酸雨情景不等同所有酸溶液"
    ],
    "pitfalls": [
      "不能将所有pH小于7的雨都简单称酸雨",
      "没有差异也应如实记录"
    ],
    "questions": [
      {
        "q": "如果处理组发芽多于对照组，应删除数据吗？",
        "a": "不应；应核查条件与记录，并重复验证而不是修改结果。"
      }
    ],
    "safety": [
      "处理液仅由教师准备；不使用浓酸，不把实验液排入自然水体。"
    ],
    "model": "ecology",
    "modelNote": "情景或比率模型用于比较生物与环境关系，不预测真实种群数量。生态瓶不存在保证永久稳定的配方。",
    "controls": [
      {
        "key": "ph",
        "label": "处理液pH",
        "min": 3,
        "max": 7,
        "value": 5,
        "step": 0.5,
        "unit": ""
      },
      {
        "key": "treated",
        "label": "处理组发芽数",
        "min": 0,
        "max": 20,
        "value": 12,
        "step": 1,
        "unit": ""
      },
      {
        "key": "control",
        "label": "对照组发芽数",
        "min": 0,
        "max": 20,
        "value": 18,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "两组各20粒，处理组12粒发芽、对照18粒，比较发芽率。",
      "steps": [
        {
          "title": "明确条件",
          "text": "分母均为20粒。"
        },
        {
          "title": "观察或依据",
          "text": "处理组12/20=60%，对照18/20=90%。"
        },
        {
          "title": "推理与表达",
          "text": "相差30个百分点，但还需重复与控制变量支持解释。"
        }
      ],
      "answer": "示例发芽率分别60%与90%，处理组低30个百分点。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "酸雨对生物的影响"
    ],
    "evidenceStatus": "现行教材公开文本核对"
  },
  {
    "id": "bio-ecological-survey",
    "subject": "biology",
    "term": "8上",
    "chapter": "第五单元 第二章 生态安全",
    "title": "调查生态环境并设计校园绿化方案",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-pep8up-text",
      "bio-ncet2023"
    ],
    "objective": "依据调查证据提出可实施的生态保护或绿化方案。",
    "apparatus": [
      "校园平面图",
      "现场记录表",
      "植物资料",
      "面积测量工具"
    ],
    "steps": [
      "调查现有植被、水源及人类活动。",
      "识别需要改善的问题并比较方案。",
      "计算面积比例，评估适生性与维护条件。"
    ],
    "observations": [
      "外来种需要生态风险评估。",
      "绿化不能只追求面积，还要关注物种与水土条件。"
    ],
    "conclusion": "保护行动需基于事实、明确目标并监测效果。",
    "examPoints": [
      "生态安全",
      "方案可行性和效果指标"
    ],
    "pitfalls": [
      "不能把人工草坪面积当全部生态质量",
      "不可擅自放生外来动物"
    ],
    "questions": [
      {
        "q": "为何绿化不能只选生长最快的植物？",
        "a": "还需考虑当地环境、耗水、维护和入侵风险等因素。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "survey",
    "modelNote": "场景中的数量为可编辑的教学样本；统计结论只适用于该样本，不能冒充校园、地区或人群的实测结果。",
    "controls": [
      {
        "key": "totalArea",
        "label": "场地总面积",
        "min": 100,
        "max": 2000,
        "value": 800,
        "step": 100,
        "unit": "m²"
      },
      {
        "key": "greenArea",
        "label": "拟绿化面积",
        "min": 0,
        "max": 1000,
        "value": 300,
        "step": 50,
        "unit": "m²"
      },
      {
        "key": "species",
        "label": "植物选择",
        "value": "native",
        "options": [
          {
            "value": "native",
            "label": "适生本地植物"
          },
          {
            "value": "invasive",
            "label": "未评估外来种"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "800 m²场地拟绿化300 m²，计算面积占比。",
      "steps": [
        {
          "title": "明确条件",
          "text": "两面积单位一致，绿化面积不得超过总面积。"
        },
        {
          "title": "观察或依据",
          "text": "300÷800×100%=37.5%。"
        },
        {
          "title": "推理与表达",
          "text": "面积指标只是评价方案的一个方面。"
        }
      ],
      "answer": "绿化面积占37.5%，仍需评价物种适生性和维护方案。"
    },
    "ncetIds": [
      15,
      16
    ],
    "evidenceTitles": [
      "调查当地生态环境现状，拟订保护行动计划"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "green-plan"
    }
  },
  {
    "id": "bio-aquarium",
    "subject": "biology",
    "term": "8上",
    "chapter": "第五单元 第一章 生态系统",
    "title": "设计水族箱并制订热带鱼饲养计划",
    "kind": "拓展探究",
    "tags": [
      "课标拓展",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023"
    ],
    "objective": "把容器、供氧、水质、温度及动物需求联系起来，审查饲养方案中的证据与缺项。",
    "apparatus": [
      "水族箱设计图与有效水量记录",
      "所选鱼种的可靠饲养资料",
      "温度计和水质检测计划",
      "过滤、增氧设备示意",
      "投饵及维护记录表"
    ],
    "steps": [
      "先确定鱼种和成体大小，查明温度、水质、食物及混养需求，未查清前不购买动物。",
      "按有效水量画出容器、过滤和增氧设备布局，电器操作交由成人负责。",
      "逐项审查投饵量、同缸相容性、检测和换水计划，明确设备故障时的处理联系人。",
      "若学校批准实物饲养，先按专业指导建立适宜水环境，再连续记录水质、行为及摄食变化。"
    ],
    "observations": [
      "相同条数的不同鱼种，其体型、耗氧量和领地需求可能很不相同。",
      "增氧不能直接清除所有有害代谢产物，过量投饵会增加水质维护负担。",
      "温度或混养不合适时，即使水量较大也不能保证动物健康。"
    ],
    "conclusion": "水族箱是需要持续维护的人工环境；仅由水量和条数不能推算安全密度或保证成活。",
    "examPoints": [
      "生物因素与非生物因素共同作用",
      "能量和物质有输入输出，水族箱不等于完全封闭的生态瓶",
      "比较方案前先统一物种、体型和条件"
    ],
    "pitfalls": [
      "不能把“每条鱼多少升”当成适用于所有鱼的法则",
      "水看起来清澈不等于水质合格",
      "不得把外来鱼或水生植物放入自然水域"
    ],
    "questions": [
      {
        "q": "40 L 水养4条鱼就一定比20 L 水养2条鱼安全吗？",
        "a": "两方案水量与条数的比值相同，但还需比较鱼种、体型、供氧、过滤、水温和维护，不能据此判断安全。"
      }
    ],
    "safety": [
      "实物饲养须经教师同意并满足动物福利；不购买或采集受保护动物。",
      "水边电器由成人按说明操作；不擅自放生，不把实验水倒入自然水域。"
    ],
    "model": "ecology",
    "modelNote": "水量和条数只计算名义条数密度；供氧、投饵、温度及维护选项用于审查计划，不产生真实溶氧值、氨浓度或成活概率。实际条件必须查明具体鱼种和成体大小。",
    "controls": [
      {
        "key": "volume",
        "label": "有效水体积",
        "min": 10,
        "max": 100,
        "value": 40,
        "step": 5,
        "unit": "L"
      },
      {
        "key": "fish",
        "label": "拟饲养条数",
        "min": 1,
        "max": 10,
        "value": 3,
        "step": 1,
        "unit": ""
      },
      {
        "key": "aeration",
        "label": "增氧安排",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "有增氧设备"
          },
          {
            "value": "no",
            "label": "无增氧设备"
          }
        ]
      },
      {
        "key": "temperature",
        "label": "水温与所选物种需求",
        "value": "suitable",
        "options": [
          {
            "value": "suitable",
            "label": "符合物种需求"
          },
          {
            "value": "cold",
            "label": "低于物种需求"
          },
          {
            "value": "hot",
            "label": "高于物种需求"
          }
        ]
      },
      {
        "key": "feeding",
        "label": "投饵计划",
        "value": "moderate",
        "options": [
          {
            "value": "moderate",
            "label": "按物种需求适量"
          },
          {
            "value": "excess",
            "label": "过量投饵"
          }
        ]
      },
      {
        "key": "compatibility",
        "label": "混养相容性",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "已核对相容性"
          },
          {
            "value": "no",
            "label": "未核对或不相容"
          }
        ]
      },
      {
        "key": "waterchange",
        "label": "水质维护",
        "value": "planned",
        "options": [
          {
            "value": "planned",
            "label": "有检测与维护计划"
          },
          {
            "value": "none",
            "label": "没有维护计划"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "练习方案甲40 L养4条、乙60 L养3条，比较名义条数密度。",
      "steps": [
        {
          "title": "明确条件",
          "text": "这些只是方案数字；未给出鱼种和体型，不能用作真实放养建议。"
        },
        {
          "title": "观察或依据",
          "text": "甲4÷40=0.10条/L；乙3÷60=0.05条/L。"
        },
        {
          "title": "推理与表达",
          "text": "乙的名义条数密度较低，但缺少物种与水质信息，不能推出乙保证成活。"
        }
      ],
      "answer": "甲0.10条/L，乙0.05条/L；该比值只描述方案，不能直接判断适宜饲养量。"
    },
    "ncetIds": [
      53
    ],
    "evidenceTitles": [],
    "evidenceStatus": "2023基本目录已核对；本网站学期归类",
    "config": {
      "variant": "aquarium",
      "speciesSpecific": true
    }
  },
  {
    "id": "bio-firstaid-procedure",
    "subject": "biology",
    "term": "8上",
    "chapter": "第四单元 人体生理与健康（二）",
    "title": "成人心肺复苏与包扎止血流程模拟",
    "kind": "拓展探究",
    "tags": [
      "课标拓展",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023",
      "bio-aha-bls2025",
      "bio-redcross-bleeding",
      "bio-nhc-health2024"
    ],
    "objective": "在训练模型上辨认急救触发条件、呼救与AED环节，理解成人按压和包扎止血的基本顺序。",
    "apparatus": [
      "成人心肺复苏训练人偶",
      "训练用AED",
      "模拟伤口、清洁敷料和绷带",
      "防护手套",
      "急救电话角色卡",
      "有资质人员的现场指导"
    ],
    "steps": [
      "检查环境安全；课堂确认使用训练人偶与训练AED，不在同学身上进行胸外按压或通气。",
      "成人无反应时立即呼救并快速判断正常呼吸；拨120开免提，请旁人取AED，按调度员指导行动。",
      "无反应且无正常呼吸的成人情境，在人偶胸骨下半部练习每分钟100～120次、深约5～6 cm的按压，保证回弹。",
      "受训且愿意通气者在人偶练习30:2；不熟悉通气者按调度指导实施按压，不强迫人工呼吸。",
      "训练AED分析及模拟放电时确认无人接触，按提示继续；有正常呼吸者不套用胸外按压流程，继续监测并听从调度指导。",
      "包扎情境中对无嵌入异物的模拟伤口持续直接压迫，控制出血后固定敷料并检查远端循环。"
    ],
    "observations": [
      "无反应与无正常呼吸是成人公众复苏识别的重要组合；偶发喘息不等于正常呼吸。",
      "按压帮助维持循环，通气帮助气体交换，AED判断是否需要电击，三者作用不同。",
      "包扎过紧可影响远端循环；严重出血需要持续止血和及时专业救援。"
    ],
    "conclusion": "急救先识别情境并立即求助，再按培训和调度指导行动；网页流程不能替代实际技能培训。",
    "examPoints": [
      "人工呼吸、胸外按压、AED各自的作用",
      "成人训练参数不能直接套用婴幼儿",
      "包扎止血与血液循环的联系"
    ],
    "pitfalls": [
      "不在清醒同学或正常呼吸者身上练习胸外按压",
      "不把濒死喘息当正常呼吸而延误呼救",
      "不因等待AED而一直停止按压",
      "不反复掀开敷料观察或擅自拔出嵌入异物"
    ],
    "questions": [
      {
        "q": "成人无反应但仍有正常呼吸，是否直接胸外按压？",
        "a": "不能直接套用无正常呼吸的复苏流程。应立即求助120、持续观察并按调度员指导保持安全，若呼吸异常再按指导处理。"
      }
    ],
    "safety": [
      "仅由合格指导者组织训练人偶和模拟伤口练习，不在真实同学身上按压、人工通气或电击。",
      "现实无反应、呼吸异常或严重出血立即拨120；按调度员指导行动。",
      "这里的参数针对成人，不直接适用于婴儿和儿童；未培训者不被要求进行口对口通气。"
    ],
    "model": "health",
    "modelNote": "分步卡片是成人急救训练流程，不预测复苏成功率，也不检测真实呼吸或脉搏。按压和人工通气练习仅使用训练人偶；真实急症立即呼叫120并按调度指导行动。",
    "controls": [
      {
        "key": "scenario",
        "label": "训练情境",
        "value": "unresponsive",
        "options": [
          {
            "value": "unresponsive",
            "label": "成人无反应情境"
          },
          {
            "value": "bleeding",
            "label": "伤口出血情境"
          }
        ]
      },
      {
        "key": "step",
        "label": "流程步骤",
        "min": 0,
        "max": 5,
        "value": 0,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "课堂人偶情境：成人无反应且无正常呼吸，旁边有手机但AED尚未送到。",
      "steps": [
        {
          "title": "明确条件",
          "text": "这是训练模型；真实现场应立即拨120并接受调度指导。"
        },
        {
          "title": "观察或依据",
          "text": "按压不能因等待AED而延迟；AED到位后依语音操作并减少中断。"
        },
        {
          "title": "推理与表达",
          "text": "先呼救、开免提并请人取AED，同时按成人培训规范开始复苏；不会通气者接受调度指导实施按压。"
        }
      ],
      "answer": "立即呼救120并安排AED，在训练人偶按规范启动成人复苏；不等待设备到位才开始，不在真实同学身上演练。"
    },
    "ncetIds": [
      32
    ],
    "evidenceTitles": [],
    "evidenceStatus": "2023基本目录已核对；本网站学期归类",
    "config": {
      "variant": "firstaid-procedure",
      "flows": {
        "unresponsive": [
          "确认周围安全；课堂只在训练人偶上演示，安排一人呼救、一人取训练AED。",
          "呼叫并轻拍肩部判断响应；无反应立即呼救，迅速观察是否有正常呼吸，濒死喘息不算正常呼吸，判断不超过10秒。",
          "拨打120并开免提，说明位置及情况；请旁人取AED，按调度员指导行动，不为等待设备而延误按压。",
          "对无反应且无正常呼吸的成人情境，在人偶胸骨下半部练习按压：每分钟100～120次、深约5～6 cm，充分回弹并减少中断。",
          "受过培训且愿意通气者在人偶上练习30次按压与2次通气；每次约1秒并观察胸廓起伏。不熟悉通气时按120指导持续胸外按压。",
          "AED到位按语音提示操作，分析或放电时无人接触；之后按提示立即继续复苏。持续至专业人员接手或出现正常生命体征等应调整情况。"
        ],
        "bleeding": [
          "确认环境安全，戴防护手套；课堂使用模拟伤口与清洁绷带。",
          "观察是否持续大量出血或喷射性出血；立即安排呼叫120，同时准备对伤口直接持续加压。",
          "在没有嵌入异物的模拟伤口上覆盖清洁敷料，持续直接压迫；真实严重出血按调度员指导处理。",
          "不为反复查看而频繁松开压迫；敷料浸透时保持原有压力并按指导处理，不拔出嵌入异物。",
          "出血得到控制后固定敷料，绷带不应阻断肢体远端循环；检查远端颜色、温度和感觉。",
          "持续观察响应与呼吸，注意保暖并等待专业救援；不用药物、饮料或自行移除异物替代止血与求助。"
        ]
      },
      "adultOnly": true
    }
  },
  {
    "id": "bio-drug-prevention",
    "subject": "biology",
    "term": "8上",
    "chapter": "第四单元 人体生理与健康（二）",
    "title": "参观禁毒展览或观看有关影像资料",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8up-text"
    ],
    "objective": "记录禁毒教育资料的来源与证据，练习拒绝、求助和紧急处置的基本判断，尊重需要帮助的人。",
    "apparatus": [
      "学校组织的禁毒展览或合适影像资料",
      "来源、日期与要点记录表",
      "情境讨论卡",
      "教师提供的可靠求助渠道"
    ],
    "steps": [
      "在教师或家长安排下选择官方或学校审核的展览与资料，记录机构、标题、发布日期和访问方式。",
      "分开记下资料中的事实、证据及个人感受；对网络结论先查来源，不传播无法核实的信息。",
      "针对邀请尝试、发现不明物品、有人意识或呼吸异常三类情境讨论明确拒绝、离开风险环境和求助路径。",
      "小组制作有出处的教育记录或海报，使用尊重人的表述，不披露真实学生或家庭的私人经历。"
    ],
    "observations": [
      "包装、颜色、气味及“别人说没事”都不能可靠确定不明物品的成分或风险。",
      "可核验来源有助于追溯证据，但仍需阅读日期和适用范围。",
      "急性意识或呼吸异常需要及时医疗求助，不能只靠劝说、灌水或自行用药。"
    ],
    "conclusion": "禁毒学习应建立在可靠资料和实际拒绝求助能力上；不尝试未知物品，不靠外观鉴定，不给受影响者贴标签。",
    "examPoints": [
      "证据来源与传播责任",
      "拒绝诱导、及时求助",
      "健康生活与社会支持"
    ],
    "pitfalls": [
      "不能通过尝一口或闻一闻来鉴定未知物品",
      "不能把未经核实的个案当普遍规律",
      "不因羞耻或害怕责备而拖延急救",
      "不把有物质使用问题的人简单等同于品德有缺陷"
    ],
    "questions": [
      {
        "q": "有人说“这个包装像糖果所以安全”，应怎样回应？",
        "a": "外观不能确定成分。拒绝尝试，远离不明物品并向可信成人求助；如有人意识或呼吸异常，应立即联系120。"
      }
    ],
    "safety": [
      "不展示或携带真实不明物品，不安排任何尝试性接触；活动由教师或家长组织。",
      "有人意识或呼吸异常立即呼叫120；如有正在发生的人身危险，先离开危险处并求助警方。",
      "不公开当事人身份，不以羞辱方式开展教育。"
    ],
    "model": "health",
    "modelNote": "场景仅用于资料评价与求助选择，不识别真实物品成分，不预测成瘾概率，不替代急救或专业支持。",
    "controls": [
      {
        "key": "source",
        "label": "资料来源",
        "value": "reliable",
        "options": [
          {
            "value": "reliable",
            "label": "可核验的官方或学校资料"
          },
          {
            "value": "unverified",
            "label": "来源不明的网络说法"
          }
        ]
      },
      {
        "key": "scenario",
        "label": "讨论情境",
        "value": "invitation",
        "options": [
          {
            "value": "invitation",
            "label": "有人邀请尝试不明物品"
          },
          {
            "value": "unknown",
            "label": "发现来源不明的包装或药物"
          },
          {
            "value": "emergency",
            "label": "有人出现意识或呼吸异常"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "一条匿名短视频声称某种不明饮品绝对无害，同学邀请尝试，如何作答？",
      "steps": [
        {
          "title": "明确条件",
          "text": "来源不明，包装不能证明成分或安全。"
        },
        {
          "title": "观察或依据",
          "text": "没有可核验的证据支持“绝对无害”；亲自尝试也不是安全的验证方法。"
        },
        {
          "title": "推理与表达",
          "text": "明确拒绝，离开风险场景并联系教师或家长；记录可靠资料支持自己的判断，不转发夸大说法。"
        }
      ],
      "answer": "拒绝尝试并向可信成人求助；核查资料来源，不以外观或匿名宣传判断安全。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "参观禁毒展览或观看有关影像资料"
    ],
    "evidenceStatus": "现行教材公开文本核对",
    "config": {
      "variant": "drug-prevention"
    }
  },
  {
    "id": "bio-cutting",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第一章 生物的生殖",
    "title": "植物的扦插或嫁接",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023",
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "区分无性生殖方式及影响成活的关键因素。",
    "apparatus": [
      "适宜枝条模型",
      "扦插基质",
      "砧木接穗模型",
      "观察表"
    ],
    "steps": [
      "选择健康适宜的材料并记录来源。",
      "设计只改变一个条件的比较方案。",
      "观察新根或接口愈合，而不是只看短期叶色。"
    ],
    "observations": [
      "扦插利用营养器官形成新植株。",
      "嫁接中形成层有效接触有利于愈合。"
    ],
    "conclusion": "无性生殖通常能保留母本主要遗传性状，成活还受环境影响。",
    "examPoints": [
      "扦插与嫁接区别",
      "有无两性生殖细胞结合"
    ],
    "pitfalls": [
      "不能保证无性后代完全不变异",
      "短期不萎蔫不等于已成活"
    ],
    "questions": [
      {
        "q": "嫁接成活后接穗结的果实通常主要受谁的遗传性状影响？",
        "a": "通常主要受接穗自身遗传性状影响；砧木可影响生长状态但不直接改变接穗基因型。"
      }
    ],
    "safety": [
      "剪切工具由教师指导使用；不对受保护植物取材。"
    ],
    "model": "reproduction",
    "modelNote": "表示生殖发育的阶段与必要条件，不预测发育天数或成活率；动物饲养需要满足物种的真实环境要求。",
    "controls": [
      {
        "key": "method",
        "label": "繁殖方式",
        "value": "cutting",
        "options": [
          {
            "value": "cutting",
            "label": "扦插"
          },
          {
            "value": "graft",
            "label": "嫁接"
          }
        ]
      },
      {
        "key": "condition",
        "label": "关键条件",
        "value": "suitable",
        "options": [
          {
            "value": "suitable",
            "label": "条件适宜"
          },
          {
            "value": "dry",
            "label": "失水明显"
          },
          {
            "value": "mismatch",
            "label": "形成层未贴合"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "探究叶片保留量对扦插成活的影响，如何设计？",
      "steps": [
        {
          "title": "明确条件",
          "text": "只改变保留叶片的相对量。"
        },
        {
          "title": "观察或依据",
          "text": "统一枝条来源、长度、基质、水分和温度。"
        },
        {
          "title": "推理与表达",
          "text": "以新根和持续生长等指标比较，设置重复。"
        }
      ],
      "answer": "控制其余条件，比较不同保叶量处理的真实成活记录。"
    },
    "ncetIds": [
      51
    ],
    "evidenceTitles": [
      "植物的扦插或嫁接"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "evidencePages": [
      8,
      9
    ]
  },
  {
    "id": "bio-egg",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第一章 生物的生殖",
    "title": "鸟卵适于在陆地上发育的结构特征",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023",
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "从保护、营养和气体交换等方面解释鸟卵结构。",
    "apparatus": [
      "新鲜鸡卵或教学模型",
      "放大镜",
      "培养皿",
      "镊子"
    ],
    "steps": [
      "先观察卵壳外部与气孔示意。",
      "按教师方法打开钝端，观察气室及壳膜。",
      "辨认卵白、卵黄、系带和胚盘。"
    ],
    "observations": [
      "卵壳和壳膜提供保护，卵白含水和营养。",
      "胚盘与胚胎发育有关；气孔利于气体交换。"
    ],
    "conclusion": "多种结构共同有利于鸟卵在陆地发育。",
    "examPoints": [
      "胚盘位置",
      "受精并有适宜条件才可能正常孵化"
    ],
    "pitfalls": [
      "不能把卵白说成整个卵细胞的细胞质",
      "买来的所有鸡蛋不都能孵出雏鸟"
    ],
    "questions": [
      {
        "q": "卵壳坚硬却有气孔有什么意义？",
        "a": "兼顾机械保护和胚胎所需的气体交换。"
      }
    ],
    "safety": [
      "生鸡蛋按食品卫生要求处理，观察后洗手；实验材料不得生食。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "part",
        "label": "观察结构",
        "value": "shell",
        "options": [
          {
            "value": "shell",
            "label": "卵壳与气孔"
          },
          {
            "value": "white",
            "label": "卵白"
          },
          {
            "value": "yolk",
            "label": "卵黄与胚盘"
          },
          {
            "value": "air",
            "label": "气室"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "说明卵壳与卵白分别如何支持陆地发育。",
      "steps": [
        {
          "title": "明确条件",
          "text": "分别分析外部保护和内部供给。"
        },
        {
          "title": "观察或依据",
          "text": "卵壳提供保护并有气孔；卵白提供水和部分营养。"
        },
        {
          "title": "推理与表达",
          "text": "把结构与功能一一对应。"
        }
      ],
      "answer": "卵壳有保护和通气作用，卵白提供水和营养等支持。"
    },
    "ncetIds": [
      42
    ],
    "evidenceTitles": [
      "鸟卵适于在陆地上发育的结构特征"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "specimen": "egg"
    },
    "evidencePages": [
      14
    ]
  },
  {
    "id": "bio-animal-development",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第一章 生物的生殖",
    "title": "设计饲养装置并观察动物的发育",
    "kind": "拓展探究",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023",
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "比较完全变态、不完全变态与两栖动物发育。",
    "apparatus": [
      "家蚕饲养装置设计图",
      "食物与卫生计划",
      "阶段记录表"
    ],
    "steps": [
      "明确所选动物的食物、温湿度和空间需求。",
      "定时观察形态变化，按日期记录。",
      "比较各阶段是否出现蛹期等关键特征。"
    ],
    "observations": [
      "家蚕经历卵、幼虫、蛹、成虫。",
      "蝗虫经历卵、若虫、成虫，没有蛹期。"
    ],
    "conclusion": "发育过程具有物种特点，不能以一种动物的模式概括全部动物。",
    "examPoints": [
      "完全变态与不完全变态",
      "生命周期记录需连续"
    ],
    "pitfalls": [
      "蝌蚪不是小型成蛙",
      "不能为观察抓取受保护动物"
    ],
    "questions": [
      {
        "q": "家蚕和蝗虫最明显的阶段区别是什么？",
        "a": "家蚕有蛹期，蝗虫没有蛹期。"
      }
    ],
    "safety": [
      "饲养仅在教师允许且能保证动物福利时进行；不擅自放生外来物种。"
    ],
    "model": "reproduction",
    "modelNote": "表示生殖发育的阶段与必要条件，不预测发育天数或成活率；动物饲养需要满足物种的真实环境要求。",
    "controls": [
      {
        "key": "animal",
        "label": "观察动物",
        "value": "silkworm",
        "options": [
          {
            "value": "silkworm",
            "label": "家蚕"
          },
          {
            "value": "locust",
            "label": "蝗虫模型"
          },
          {
            "value": "frog",
            "label": "青蛙模型"
          }
        ]
      },
      {
        "key": "stage",
        "label": "发育阶段",
        "min": 0,
        "max": 3,
        "value": 0,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "一个昆虫经历卵、幼虫、蛹、成虫，判断发育类型。",
      "steps": [
        {
          "title": "明确条件",
          "text": "检查有无蛹期。"
        },
        {
          "title": "观察或依据",
          "text": "四阶段包含蛹。"
        },
        {
          "title": "推理与表达",
          "text": "据阶段特征判断为完全变态。"
        }
      ],
      "answer": "属于完全变态发育。"
    },
    "ncetIds": [
      52
    ],
    "evidenceTitles": [
      "设计并制作装置，饲养一种动物"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "evidencePages": [
      18,
      19
    ]
  },
  {
    "id": "bio-gene-transfer",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第二章 生物的遗传与变异",
    "title": "模拟有性生殖过程中染色体和基因的传递",
    "kind": "学生实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "用模型说明成对基因随染色体分离并由双亲共同传递。",
    "apparatus": [
      "双色染色体卡片",
      "配子盒",
      "组合记录表"
    ],
    "steps": [
      "用成对卡片表示亲本的一对同源染色体。",
      "每个配子仅取该对中的一条。",
      "将来自双亲的配子随机组合并记录。"
    ],
    "observations": [
      "每个后代该对基因一份来自父方、一份来自母方。",
      "不能让一个配子带走亲本的整对基因。"
    ],
    "conclusion": "遗传物质通过生殖细胞传递，受精使成对状态恢复。",
    "examPoints": [
      "配子与体细胞区别",
      "基因与染色体关系"
    ],
    "pitfalls": [
      "不是把双亲体细胞直接合并",
      "模拟小样本不必恰好符合比例"
    ],
    "questions": [
      {
        "q": "Aa亲本的一个正常配子会同时含A和a吗？",
        "a": "本单基因模型中不会，一个配子只含这一对基因中的一个。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "genetics",
    "modelNote": "按单基因、完全显性、配子等概率且随机结合的假设计算理论概率；比例不是每一小批后代的必然实测结果。",
    "controls": [
      {
        "key": "parent1",
        "label": "亲本1基因型",
        "value": "Aa",
        "options": [
          {
            "value": "AA",
            "label": "AA"
          },
          {
            "value": "Aa",
            "label": "Aa"
          },
          {
            "value": "aa",
            "label": "aa"
          }
        ]
      },
      {
        "key": "parent2",
        "label": "亲本2基因型",
        "value": "Aa",
        "options": [
          {
            "value": "AA",
            "label": "AA"
          },
          {
            "value": "Aa",
            "label": "Aa"
          },
          {
            "value": "aa",
            "label": "aa"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "Aa与aa亲本形成的配子和后代可能是什么？",
      "steps": [
        {
          "title": "明确条件",
          "text": "Aa配子为A或a，aa配子为a。"
        },
        {
          "title": "观察或依据",
          "text": "随机结合得到Aa与aa。"
        },
        {
          "title": "推理与表达",
          "text": "两种后代基因型理论概率各1/2。"
        }
      ],
      "answer": "理论上Aa与aa各50%。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "模拟有性生殖过程中染色体和基因的传递"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "transfer"
    },
    "evidencePages": [
      29
    ]
  },
  {
    "id": "bio-dominance",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第二章 生物的遗传与变异",
    "title": "模拟遗传性状显隐性的形成过程",
    "kind": "拓展探究",
    "tags": [
      "课标拓展",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023",
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "区分基因型与表现型，并根据配子组合计算理论概率。",
    "apparatus": [
      "基因卡片",
      "配子组合方格",
      "记录表"
    ],
    "steps": [
      "明确A对a完全显性这一模型假设。",
      "列出双亲可能配子。",
      "逐格组合并统计基因型及表现型。"
    ],
    "observations": [
      "Aa与AA在完全显性模型中表现相同。",
      "表现显性不能据此区分AA与Aa。"
    ],
    "conclusion": "后代概率来自配子组合，而不是按父母外貌直接平均。",
    "examPoints": [
      "基因型与表现型",
      "概率独立与小样本波动"
    ],
    "pitfalls": [
      "显性不等于更强或更常见",
      "生育前一个孩子不改变下一次独立事件概率"
    ],
    "questions": [
      {
        "q": "两个显性亲本能产生隐性后代吗？",
        "a": "若两个亲本均为Aa，理论上可产生aa后代，概率为1/4。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "genetics",
    "modelNote": "按单基因、完全显性、配子等概率且随机结合的假设计算理论概率；比例不是每一小批后代的必然实测结果。",
    "controls": [
      {
        "key": "parent1",
        "label": "亲本1基因型",
        "value": "Aa",
        "options": [
          {
            "value": "AA",
            "label": "AA"
          },
          {
            "value": "Aa",
            "label": "Aa"
          },
          {
            "value": "aa",
            "label": "aa"
          }
        ]
      },
      {
        "key": "parent2",
        "label": "亲本2基因型",
        "value": "Aa",
        "options": [
          {
            "value": "AA",
            "label": "AA"
          },
          {
            "value": "Aa",
            "label": "Aa"
          },
          {
            "value": "aa",
            "label": "aa"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "Aa×Aa且A完全显性，求隐性后代概率。",
      "steps": [
        {
          "title": "明确条件",
          "text": "双亲均产生A、a配子，各1/2。"
        },
        {
          "title": "观察或依据",
          "text": "组合为AA、Aa、Aa、aa。"
        },
        {
          "title": "推理与表达",
          "text": "aa占4种等可能组合中的1种。"
        }
      ],
      "answer": "隐性后代理论概率为25%。"
    },
    "ncetIds": [
      44
    ],
    "evidenceTitles": [
      "高茎豌豆和矮茎豌豆的杂交实验"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "dominance"
    },
    "evidencePages": [
      32,
      33
    ]
  },
  {
    "id": "bio-sex",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第二章 生物的遗传与变异",
    "title": "模拟人的性别决定",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023",
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "理解典型XX/XY染色体模型中的随机组合与概率。",
    "apparatus": [
      "X、Y染色体卡片",
      "两个配子盒",
      "记录表"
    ],
    "steps": [
      "以X卡表示卵细胞的性染色体。",
      "从含X与Y的另一盒随机取一张表示精子。",
      "每次记录后放回并混匀，比较多次结果。"
    ],
    "observations": [
      "典型模型中XX与XY理论概率各1/2。",
      "有限次数不必严格一半一半。"
    ],
    "conclusion": "此模型解释典型染色体组合，不是对个体全部性发育情况的描述。",
    "examPoints": [
      "放回与充分混匀",
      "理论概率与实际频数区别"
    ],
    "pitfalls": [
      "不能将生育结果归责于母亲",
      "不以模型否定少见染色体或性发育差异"
    ],
    "questions": [
      {
        "q": "连续几次同一种组合会使下一次另一种必然出现吗？",
        "a": "不会，独立随机取样时下一次理论概率仍各1/2。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "genetics",
    "modelNote": "典型XX/XY配子随机结合模型；两类精子在模型中等概率，有限次合成样本不保证恰好1:1。模型不概括少见染色体组成或全部性发育情况，不代表实测人口统计。",
    "controls": [
      {
        "key": "trials",
        "label": "模拟组合次数",
        "min": 10,
        "max": 200,
        "value": 40,
        "step": 10,
        "unit": ""
      },
      {
        "key": "seed",
        "label": "随机序列编号",
        "min": 1,
        "max": 20,
        "value": 1,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范例题",
      "given": "已连续得到3次XX，第4次得到XY的理论概率是多少？",
      "steps": [
        {
          "title": "明确条件",
          "text": "每次放回并混匀，抽取相互独立。"
        },
        {
          "title": "观察或依据",
          "text": "先前三次不会改变盒中X与Y比例。"
        },
        {
          "title": "推理与表达",
          "text": "XY概率仍为1/2。"
        }
      ],
      "answer": "典型模型中第4次XY概率仍为50%。"
    },
    "ncetIds": [
      43
    ],
    "evidenceTitles": [
      "模拟人的性别决定"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "sex"
    },
    "evidencePages": [
      40
    ]
  },
  {
    "id": "bio-variation",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第二章 生物的遗传与变异",
    "title": "探究花生果实大小的变异",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023",
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "练习随机抽样、统一测量、统计和有限推断。",
    "apparatus": [
      "两品种花生果实",
      "直尺或卡尺",
      "记录表"
    ],
    "steps": [
      "随机取样，不只挑最大或最小个体。",
      "统一测量果实长轴，记录每个值。",
      "比较平均值和分布，保留组间重叠。"
    ],
    "observations": [
      "同一品种个体间也可有差异。",
      "不同组分布可能重叠，平均值不代表每个个体。"
    ],
    "conclusion": "性状受遗传与环境共同影响，单凭外形测量不能完全分离两者作用。",
    "examPoints": [
      "随机抽样",
      "平均值与分布"
    ],
    "pitfalls": [
      "不能挑选样本制造结论",
      "不能把模拟样本当真实测量"
    ],
    "questions": [
      {
        "q": "甲均值小于乙，能说甲每个果实都更小吗？",
        "a": "不能，两个分布可能重叠，需要看各个数据。"
      },
      {
        "q": "若要检验优良番茄性状能否稳定遗传，后续比较需要哪些条件？",
        "a": "随机选取后代，在相同环境中与合适的亲本或对照材料比较，设置独立重复并记录多代结果；不能只凭一次个体高产就断定性状稳定遗传。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "variation",
    "modelNote": "数据为可编辑的合成教学样本，展示抽样、平均数与分布；不能只由外观差异确定遗传或环境原因。",
    "controls": [
      {
        "key": "meanA",
        "label": "甲样本中心值",
        "min": 20,
        "max": 50,
        "value": 32,
        "step": 1,
        "unit": "mm"
      },
      {
        "key": "meanB",
        "label": "乙样本中心值",
        "min": 20,
        "max": 50,
        "value": 38,
        "step": 1,
        "unit": "mm"
      },
      {
        "key": "spread",
        "label": "样本分散程度",
        "min": 1,
        "max": 8,
        "value": 3,
        "step": 1,
        "unit": "mm"
      },
      {
        "key": "sample",
        "label": "每组样本量",
        "min": 10,
        "max": 50,
        "value": 30,
        "step": 5,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "示例长度30、32、34 mm，计算平均值并解释。",
      "steps": [
        {
          "title": "明确条件",
          "text": "三次读数单位相同。"
        },
        {
          "title": "观察或依据",
          "text": "平均值=(30+32+34)/3。"
        },
        {
          "title": "推理与表达",
          "text": "平均值32 mm概括中心，不表示每个果实都是32 mm。"
        }
      ],
      "answer": "样本平均长度为32 mm，个体仍存在差异。"
    },
    "ncetIds": [
      45
    ],
    "evidenceTitles": [
      "花生果实大小的变异"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "evidencePages": [
      44,
      45
    ]
  },
  {
    "id": "bio-selection",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第三章 生物的进化",
    "title": "模拟保护色的形成过程",
    "kind": "学生实验",
    "tags": [
      "教材实践",
      "基本目录"
    ],
    "sourceIds": [
      "bio-ncet2023",
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "用存活与繁殖差异解释保护色在群体中的变化。",
    "apparatus": [
      "两色纸片模型",
      "不同背景纸",
      "随机抽样记录"
    ],
    "steps": [
      "开始时放置不同颜色的个体。",
      "在固定规则下模拟捕食并记录存活。",
      "按存活者比例补充后代，重复多轮。"
    ],
    "observations": [
      "与背景接近的颜色在该情景中较不易被发现。",
      "群体比例改变，不是每个个体主动改变颜色。"
    ],
    "conclusion": "自然选择作用于已有变异，长期可改变种群性状比例。",
    "examPoints": [
      "变异先于选择",
      "适应性有环境条件"
    ],
    "pitfalls": [
      "不是因为需要才产生定向变异",
      "存活率设定属于教学模型"
    ],
    "questions": [
      {
        "q": "更换背景后原来的优势颜色一定仍占优势吗？",
        "a": "不一定，优势取决于环境和选择因素。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "selection",
    "modelNote": "模型中的不同存活概率是人为设定的捕食情景，用于说明自然选择，不代表自然种群的实际选择系数。",
    "controls": [
      {
        "key": "initial",
        "label": "初始深色个体比例",
        "min": 10,
        "max": 90,
        "value": 50,
        "step": 10,
        "unit": "%"
      },
      {
        "key": "background",
        "label": "背景",
        "value": "dark",
        "options": [
          {
            "value": "dark",
            "label": "深色背景"
          },
          {
            "value": "light",
            "label": "浅色背景"
          }
        ]
      },
      {
        "key": "generations",
        "label": "选择轮次",
        "min": 1,
        "max": 8,
        "value": 4,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "深色背景中深色个体更易留下后代，说明过程。",
      "steps": [
        {
          "title": "明确条件",
          "text": "初始群体已有深浅颜色差异。"
        },
        {
          "title": "观察或依据",
          "text": "捕食造成不同存活与繁殖机会。"
        },
        {
          "title": "推理与表达",
          "text": "多代后与背景相近的颜色比例可能增加。"
        }
      ],
      "answer": "保护色比例变化来自自然选择，不是个体主动迎合背景。"
    },
    "ncetIds": [
      46
    ],
    "evidenceTitles": [
      "模拟保护色的形成过程"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "evidencePages": [
      64,
      65,
      66
    ]
  },
  {
    "id": "bio-evolution",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第三章 生物的进化",
    "title": "比较生物进化证据",
    "kind": "拓展探究",
    "tags": [
      "原创拓展"
    ],
    "sourceIds": [
      "bio-pep-new",
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "比较多种证据，建立共同祖先与长期变化的解释。",
    "apparatus": [
      "化石图卡",
      "脊椎动物前肢模型",
      "简化分子比较表"
    ],
    "steps": [
      "区分观察到的事实和提出的解释。",
      "比较不同证据是否相互支持。",
      "用分支关系表达演化，避免排成现代生物阶梯。",
      "比较未明显扰动地层的相对上下次序；同一类群可能跨越多个地层，不能把“较早出现”误写成“只存在于古老地层”。"
    ],
    "observations": [
      "同源结构可因功能不同而形态分化。",
      "较新类群并不意味着现存其他类群是它的直接祖先。"
    ],
    "conclusion": "进化研究依靠多种证据共同支持，现存生物并非简单高低直线序列。",
    "examPoints": [
      "共同祖先",
      "比较方法"
    ],
    "pitfalls": [
      "不能说人由现代猩猩变来",
      "个体一生变化不是种群进化",
      "不能把地层上下关系直接换成绝对年龄；需考虑地层扰动与化石再搬运。"
    ],
    "questions": [
      {
        "q": "鲸鳍与人的前肢外形不同，为何可比较同源结构？",
        "a": "它们的基本骨骼排列具有对应关系，反映共同演化来源的证据。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "anatomy",
    "modelNote": "化石、同源结构与分子比较为原创证据示意。地层图只表示未明显扰动情况下的相对先后，类群A/B/C不对应特定时代，不能推算绝对年龄或完整祖先关系。",
    "controls": [
      {
        "key": "evidence",
        "label": "证据类型",
        "value": "fossil",
        "options": [
          {
            "value": "fossil",
            "label": "化石与地层"
          },
          {
            "value": "structure",
            "label": "同源器官"
          },
          {
            "value": "molecule",
            "label": "分子比较"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "两类动物前肢骨骼排列相似但功能不同，如何规范解释？",
      "steps": [
        {
          "title": "明确条件",
          "text": "先描述对应骨骼的相似性。"
        },
        {
          "title": "观察或依据",
          "text": "区分共同结构来源与当前功能。"
        },
        {
          "title": "推理与表达",
          "text": "结合其他证据提出共同祖先的解释。"
        }
      ],
      "answer": "同源结构支持共同祖先的解释，不能仅凭一种结构确定全部亲缘细节。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "几种化石及化石在地层中的分布"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "specimen": "evolution"
    },
    "evidencePages": [
      57,
      58
    ]
  },
  {
    "id": "bio-biodiversity",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第四章 生物多样性及其保护",
    "title": "调查生物多样性并比较保护方案",
    "kind": "拓展探究",
    "tags": [
      "教材资料探究"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "从遗传、物种和生态系统三个层次理解保护。",
    "apparatus": [
      "公开调查资料",
      "生境地图",
      "保护方案表"
    ],
    "steps": [
      "记录调查尺度与鉴定方法。",
      "区分遗传多样性、物种多样性和生态系统多样性。",
      "比较就地保护及必要的迁地保护措施。"
    ],
    "observations": [
      "物种数相同的地区可能仍有不同遗传或生态系统多样性。",
      "只保留少数个体不能保全全部生态关系。"
    ],
    "conclusion": "保护多样性需要综合措施，原生境保护通常具有重要作用。",
    "examPoints": [
      "三个层次",
      "就地与迁地保护"
    ],
    "pitfalls": [
      "不能只用物种数代表全部多样性",
      "不能擅自采集或放生"
    ],
    "questions": [
      {
        "q": "种子库能完全代替自然保护区吗？",
        "a": "不能，种子库保护部分遗传资源，不能完整保存生态系统过程。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "survey",
    "modelNote": "场景中的数量为可编辑的教学样本；统计结论只适用于该样本，不能冒充校园、地区或人群的实测结果。",
    "controls": [
      {
        "key": "species",
        "label": "记录物种数",
        "min": 1,
        "max": 50,
        "value": 12,
        "step": 1,
        "unit": ""
      },
      {
        "key": "habitats",
        "label": "记录生境数",
        "min": 1,
        "max": 8,
        "value": 3,
        "step": 1,
        "unit": ""
      },
      {
        "key": "protection",
        "label": "保护方案",
        "value": "habitat",
        "options": [
          {
            "value": "habitat",
            "label": "保护并修复原生境"
          },
          {
            "value": "collect",
            "label": "仅收集少量个体"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "方案甲保护原生境，方案乙仅取几粒种子，比较范围。",
      "steps": [
        {
          "title": "明确条件",
          "text": "原生境含物种、种内遗传及生态关系。"
        },
        {
          "title": "观察或依据",
          "text": "少量种子只能代表有限样本。"
        },
        {
          "title": "推理与表达",
          "text": "两种措施可互补，不能简单替代。"
        }
      ],
      "answer": "原生境保护范围更广，种子保存是补充而非完全替代。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "保护生物多样性的措施"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "biodiversity"
    },
    "evidencePages": [
      86,
      87
    ]
  },
  {
    "id": "bio-asexual",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第一章 生物的生殖",
    "title": "比较几种生物的无性生殖方式",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "通过不同实例识别无性生殖的共同特点及结构差异。",
    "apparatus": [
      "生殖过程图卡",
      "叶片、单细胞、水螅模型",
      "比较记录表"
    ],
    "steps": [
      "按阶段排列各材料的过程图。",
      "分别辨认营养器官、细胞分裂或芽体形成。",
      "追踪新个体与亲代的关系，查明是否经过两性生殖细胞结合。"
    ],
    "observations": [
      "椒草可由叶形成新植株；草履虫分裂形成两个个体；水螅芽体长成后可脱离。",
      "分裂前遗传物质先复制，不能说两个后代各只获得一半完整遗传信息。"
    ],
    "conclusion": "三种方式虽结构不同，都不经两性生殖细胞结合，属于无性生殖。",
    "examPoints": [
      "营养繁殖、分裂生殖与出芽生殖区别",
      "遗传物质复制和分配"
    ],
    "pitfalls": [
      "不能把个体生长当作生殖",
      "不能把草履虫分裂与形成配子的减数过程混同"
    ],
    "questions": [
      {
        "q": "草履虫分成两个个体后，每个个体的遗传物质是残缺的一半吗？",
        "a": "不是。正常分裂前遗传物质复制，再分配到新个体中，完整遗传信息得以保持。"
      }
    ],
    "safety": [
      "使用图卡或教学模型；实物观察不擅自采集野生动物。"
    ],
    "model": "reproduction",
    "modelNote": "表示生殖发育的阶段与必要条件，不预测发育天数或成活率；动物饲养需要满足物种的真实环境要求。",
    "controls": [
      {
        "key": "organism",
        "label": "模型材料",
        "value": "leaf",
        "options": [
          {
            "value": "leaf",
            "label": "椒草叶营养繁殖"
          },
          {
            "value": "paramecium",
            "label": "草履虫分裂"
          },
          {
            "value": "hydra",
            "label": "水螅出芽"
          }
        ]
      },
      {
        "key": "stage",
        "label": "观察阶段",
        "min": 0,
        "max": 3,
        "value": 0,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "比较椒草叶长出新植株和水螅芽体脱离，说明共同点。",
      "steps": [
        {
          "title": "明确条件",
          "text": "辨认新个体的来源和有无两性生殖细胞结合。"
        },
        {
          "title": "观察或依据",
          "text": "两者均由亲代的一部分形成新个体，不经过两性生殖细胞结合。"
        },
        {
          "title": "推理与表达",
          "text": "共同点是无性生殖，具体形成方式分别为营养繁殖和出芽。"
        }
      ],
      "answer": "两者都属于无性生殖，不能因为外形不同就认为共同点不存在。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "几种生物的生殖方式"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "asexual"
    },
    "evidencePages": [
      3
    ]
  },
  {
    "id": "bio-egg-pores",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第一章 生物的生殖",
    "title": "设计实验观察卵壳上的气孔",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "用可观察的现象为卵壳允许气体通过提供证据，并认识证据边界。",
    "apparatus": [
      "鸡卵或卵壳教学材料",
      "教师准备的适度温水与室温水",
      "透明容器",
      "放大镜"
    ],
    "steps": [
      "依据卵壳应有气体交换通道提出可检验的方案。",
      "在教师指导下比较温水与室温条件，保持材料和观察时长可比。",
      "记录气泡出现位置与时间，不把未观察到气泡直接记为没有气孔。",
      "讨论气泡来源及试验不能测定的量。"
    ],
    "observations": [
      "温水条件可使卵内气体受热膨胀，从部分孔道逸出形成气泡。",
      "现象受卵状态、水温及观察时间影响，气泡个数不等于气孔总数。"
    ],
    "conclusion": "气体能够从卵壳通过的现象支持卵壳具有通气孔道，不据此估算全部气孔数。",
    "examPoints": [
      "实验现象与结构解释",
      "阴性观察不等于结构不存在"
    ],
    "pitfalls": [
      "不要把每个气泡当一个独立气孔",
      "不虚构测得全部卵壳气孔数量"
    ],
    "questions": [
      {
        "q": "看到5个气泡能说明卵壳只有5个气孔吗？",
        "a": "不能。一个孔可先后放出多个气泡，有些孔没有可见气泡；气泡计数不能作为气孔总数。"
      }
    ],
    "safety": [
      "水温由教师控制，避免烫伤；不用沸水和密闭加压装置，实验材料不食用。"
    ],
    "model": "anatomy",
    "modelNote": "气泡现象由观察选项输入；不预测实测气泡数或气孔数。装置仅说明比较方案，温水与室温需在教师指导下控制。",
    "controls": [
      {
        "key": "water",
        "label": "比较条件",
        "value": "warm",
        "options": [
          {
            "value": "warm",
            "label": "适度温水"
          },
          {
            "value": "room",
            "label": "室温水"
          }
        ]
      },
      {
        "key": "observation",
        "label": "观察记录",
        "value": "bubbles",
        "options": [
          {
            "value": "bubbles",
            "label": "局部出现细小气泡"
          },
          {
            "value": "none",
            "label": "暂未观察到气泡"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "温水中同一区域连续出现气泡，应怎样作答？",
      "steps": [
        {
          "title": "明确条件",
          "text": "描述可重复观察的气体逸出现象。"
        },
        {
          "title": "观察或依据",
          "text": "温度变化可使内部气体膨胀，气体经孔道排出。"
        },
        {
          "title": "推理与表达",
          "text": "支持存在通气结构，但不能推算气孔总数。"
        }
      ],
      "answer": "现象支持卵壳具有通气孔道；气泡数不是气孔总数。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "试一试：设计实验验证卵壳上的气孔"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "specimen": "egg-pores"
    },
    "evidencePages": [
      15
    ]
  },
  {
    "id": "bio-traits",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第二章 生物的遗传与变异",
    "title": "观察生物性状并识别相对性状",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "区分性状与相对性状，避免把全部人类外观特征简单归为单基因遗传。",
    "apparatus": [
      "植物性状图卡",
      "比较表",
      "公开非识别性形态示意"
    ],
    "steps": [
      "先说明物种，再明确比较哪一种性状。",
      "判断差异是否为同一性状的不同表现。",
      "区分观察到的形态与尚未验证的遗传解释。"
    ],
    "observations": [
      "同种豌豆茎高的高与矮属于同一性状的不同表现。",
      "同一番茄的果色与果形不是同一性状。",
      "人类许多外貌特征遗传复杂，观察差异不等于可直接套用单基因模型。"
    ],
    "conclusion": "相对性状需在同种生物的同一性状内比较不同表现。",
    "examPoints": [
      "物种与性状两个前提",
      "性状还受环境影响"
    ],
    "pitfalls": [
      "不能把不同性状拼成相对性状",
      "不能用眼皮或耳垂直接推断亲子关系"
    ],
    "questions": [
      {
        "q": "番茄红色果实与椭圆形果实构成一对相对性状吗？",
        "a": "不构成，红色描述果色，椭圆描述果形，是不同性状。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "genetics",
    "modelNote": "性状分类与证据辨析模型，不按人类外貌推断简单单基因遗传、基因型或亲子关系。",
    "controls": [
      {
        "key": "pair",
        "label": "比较材料",
        "value": "pea",
        "options": [
          {
            "value": "pea",
            "label": "豌豆高茎和矮茎"
          },
          {
            "value": "tomato",
            "label": "番茄红果与黄果"
          },
          {
            "value": "different",
            "label": "番茄果色与果形"
          },
          {
            "value": "human",
            "label": "人的眼睑形态观察"
          }
        ]
      },
      {
        "key": "basis",
        "label": "判断依据",
        "value": "same",
        "options": [
          {
            "value": "same",
            "label": "同种生物的同一性状"
          },
          {
            "value": "appearance",
            "label": "只因外表看起来不同"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "豌豆高茎与矮茎是否为相对性状，说明理由。",
      "steps": [
        {
          "title": "明确条件",
          "text": "先核对物种都是豌豆。"
        },
        {
          "title": "观察或依据",
          "text": "比较指标均为茎的高矮，是同一性状。"
        },
        {
          "title": "推理与表达",
          "text": "高与矮为不同表现，满足相对性状定义。"
        }
      ],
      "answer": "属于相对性状；判断依据是同种生物、同一性状、不同表现。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "生物的不同性状"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "traits"
    },
    "evidencePages": [
      21,
      22
    ]
  },
  {
    "id": "bio-genetic-material",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第二章 生物的遗传与变异",
    "title": "观察染色体、DNA和基因的关系",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "建立细胞核、染色体、DNA与基因的层级关系，区分结构和数量。",
    "apparatus": [
      "原创放大结构模型",
      "染色体卡片",
      "层级标签"
    ],
    "steps": [
      "从细胞定位到细胞核及染色体。",
      "观察染色体与DNA、蛋白质的关系。",
      "用DNA局部区段表示基因，避免把一条染色体当作一个基因。",
      "以简化对数模型练习体细胞与配子的数量关系。"
    ],
    "observations": [
      "染色体主要由DNA和蛋白质构成；DNA包含遗传信息。",
      "一条DNA分子可有多个基因，基因是有遗传效应的DNA片段。"
    ],
    "conclusion": "染色体、DNA、基因不是同一层次概念；本页对数为简化模型，非某个实际物种的核型。",
    "examPoints": [
      "染色体与DNA关系",
      "基因在DNA上的位置",
      "成对的是同源染色体"
    ],
    "pitfalls": [
      "不能把每条染色体画成只含一个基因",
      "不要把模型3对当成人体实际数量"
    ],
    "questions": [
      {
        "q": "人体正常体细胞23对染色体是否意味着只有23对基因？",
        "a": "不意味着，一条染色体的DNA上有许多基因；染色体对数不是基因数。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "genetics",
    "modelNote": "原创层级结构模型；染色体对数是任意简化物种的教学设定，不是人体核型；图形比例和DNA区段均为示意。",
    "controls": [
      {
        "key": "level",
        "label": "观察层次",
        "value": "cell",
        "options": [
          {
            "value": "cell",
            "label": "细胞与细胞核"
          },
          {
            "value": "chromosome",
            "label": "染色体"
          },
          {
            "value": "dna",
            "label": "DNA"
          },
          {
            "value": "gene",
            "label": "基因片段"
          }
        ]
      },
      {
        "key": "pairs",
        "label": "二倍体模型染色体对数",
        "min": 1,
        "max": 5,
        "value": 3,
        "step": 1,
        "unit": ""
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "简化模型有3对染色体，形成正常配子后该模型配子应含几条？",
      "steps": [
        {
          "title": "明确条件",
          "text": "3对即6条，配子只取每对中的一条。"
        },
        {
          "title": "观察或依据",
          "text": "配子染色体数是该正常体细胞模型的一半。"
        },
        {
          "title": "推理与表达",
          "text": "得到3条，受精后可恢复为3对。"
        }
      ],
      "answer": "该简化配子模型含3条染色体；这不是人体真实配子数量。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "染色体、DNA和基因的关系"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "material"
    },
    "evidencePages": [
      27
    ]
  },
  {
    "id": "bio-karyotype",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第二章 生物的遗传与变异",
    "title": "观察典型人类染色体组成",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "区分常染色体、性染色体与正常配子的数量，理解典型模型的范围。",
    "apparatus": [
      "原创核型示意图",
      "常染色体与性染色体卡片",
      "观察记录表"
    ],
    "steps": [
      "在典型体细胞示意中识别22对常染色体与1对性染色体。",
      "模拟每对分离到配子，比较总数变化。",
      "区分卵细胞典型X与精子可能X或Y的模型。"
    ],
    "observations": [
      "典型体细胞含46条染色体，其中44条常染色体与2条性染色体。",
      "正常配子含23条，即22条常染色体及1条性染色体。",
      "本模型不概括所有染色体或性发育差异。"
    ],
    "conclusion": "染色体数与配子形成有关，不能仅由外貌或有限示意替代医学核型分析。",
    "examPoints": [
      "23对与23条的区别",
      "常染色体和性染色体",
      "典型模型范围"
    ],
    "pitfalls": [
      "不能说女性没有性染色体",
      "不能把少见差异否定为不可能"
    ],
    "questions": [
      {
        "q": "典型XY体细胞形成的一个精子是否通常同时含X和Y？",
        "a": "不是。正常配子含其中的一条性染色体，可能为X或Y，另含22条常染色体。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "genetics",
    "modelNote": "典型正常二倍体人类染色体组成示意，不是临床核型图，不概括所有染色体及性发育差异。",
    "controls": [
      {
        "key": "combination",
        "label": "性染色体示意",
        "value": "XX",
        "options": [
          {
            "value": "XX",
            "label": "典型XX"
          },
          {
            "value": "XY",
            "label": "典型XY"
          }
        ]
      },
      {
        "key": "cell",
        "label": "细胞类型",
        "value": "body",
        "options": [
          {
            "value": "body",
            "label": "正常二倍体体细胞"
          },
          {
            "value": "gamete",
            "label": "形成配子后的组成"
          }
        ]
      },
      {
        "key": "gamete",
        "label": "本次配子性染色体",
        "value": "X",
        "options": [
          {
            "value": "X",
            "label": "X"
          },
          {
            "value": "Y",
            "label": "Y"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "典型人类精子含22条常染色体和一条Y，总计多少条？",
      "steps": [
        {
          "title": "明确条件",
          "text": "将常染色体和性染色体都计入。"
        },
        {
          "title": "观察或依据",
          "text": "22+1=23。"
        },
        {
          "title": "推理与表达",
          "text": "23条不是23对，受精后才恢复典型成对状态。"
        }
      ],
      "answer": "该精子共23条染色体，其中1条为Y。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "男性和女性的染色体"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "karyotype"
    },
    "evidencePages": [
      39
    ]
  },
  {
    "id": "bio-origin-evidence",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第三章 生物的进化",
    "title": "分析原始地球生命形成的证据",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "区分模拟实验的观察证据、可支持的推论与尚不能回答的问题。",
    "apparatus": [
      "原始大气情景资料",
      "米勒型装置原创示意",
      "结论辨析卡"
    ],
    "steps": [
      "按水蒸气、气体处理、冷凝、收集标记装置流程。",
      "区分装置人为设定的条件与实际古环境证据。",
      "核对氨基酸等简单有机物的产物证据。",
      "比较不同结论是否超出实验范围。"
    ],
    "observations": [
      "特定模拟条件下可形成某些简单有机物。",
      "产生简单有机物不等于产生细胞或生命。",
      "原始大气组成、环境和生命起源路线仍有研究空间。"
    ],
    "conclusion": "模拟实验支持某些无机条件形成简单有机物的可能性，不能单独证明完整生命起源过程。",
    "examPoints": [
      "实验条件与自然历史区别",
      "有机物不等于生命",
      "证据强度与结论范围"
    ],
    "pitfalls": [
      "不把氨基酸等同蛋白质或细胞",
      "不把示意装置当作家用操作教程"
    ],
    "questions": [
      {
        "q": "检测到氨基酸能说明已制造生命吗？",
        "a": "不能。氨基酸是简单有机物，形成生命还涉及复杂分子、结构与功能体系等问题。"
      }
    ],
    "safety": [
      "只做装置与证据模型阅读；不搭建高压放电或可燃气体装置。"
    ],
    "model": "anatomy",
    "modelNote": "原创证据与推理模型。资料句为课堂情景，不声称呈现全部最新研究；示意装置、轮廓和关系图不按实物比例，结论不得超出所给证据。",
    "controls": [
      {
        "key": "part",
        "label": "观察装置环节",
        "value": "water",
        "options": [
          {
            "value": "water",
            "label": "加热水与水蒸气"
          },
          {
            "value": "gas",
            "label": "气体与放电区域"
          },
          {
            "value": "cool",
            "label": "冷凝与循环"
          },
          {
            "value": "collect",
            "label": "收集并检验产物"
          }
        ]
      },
      {
        "key": "claim",
        "label": "比较解释",
        "value": "supported",
        "options": [
          {
            "value": "supported",
            "label": "某些条件可形成简单有机物"
          },
          {
            "value": "life",
            "label": "实验已制造生命"
          },
          {
            "value": "unique",
            "label": "已确定唯一的真实起源过程"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "某装置在设定气体和能量条件下得到简单有机物，怎样规范表述？",
      "steps": [
        {
          "title": "明确条件",
          "text": "先写清人为设定的条件和实际检测到的产物。"
        },
        {
          "title": "观察或依据",
          "text": "实验支持这些条件下可以发生相关化学转化。"
        },
        {
          "title": "推理与表达",
          "text": "不扩大为自然界唯一过程，更不说已制造生命。"
        }
      ],
      "answer": "该结果支持特定条件下简单有机物形成的可能性，不证明完整生命起源。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "原始地球上生命形成的推测"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "specimen": "origin"
    },
    "evidencePages": [
      52,
      53
    ]
  },
  {
    "id": "bio-human-comparison",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第三章 生物的进化",
    "title": "比较现代类人猿与人类的特征",
    "kind": "小实验",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "用多种特征及证据解释亲缘关系，避免直线演化与优劣排序。",
    "apparatus": [
      "原创骨架与轮廓比较图",
      "化石和分子证据资料",
      "比较记录表"
    ],
    "steps": [
      "先比较可观察的运动及结构特征。",
      "区分共同特征与各自演化的差异。",
      "结合化石和分子证据解释共同祖先。",
      "用分支关系表达现代人和现代类人猿的关系。"
    ],
    "observations": [
      "人类稳定直立行走与骨骼结构相联系。",
      "现代人类与现代类人猿各有自己的演化历史。",
      "某一结构相似不能独立确定全部亲缘细节。"
    ],
    "conclusion": "人类与其他现生类人猿共享演化祖先，不是由某个现存类人猿物种直接变来。",
    "examPoints": [
      "共同祖先与分支演化",
      "多证据互相支持"
    ],
    "pitfalls": [
      "不把现存生物排成高低阶梯",
      "不以单一外貌特征评价个体价值"
    ],
    "questions": [
      {
        "q": "“人类由今天的黑猩猩进化而来”准确吗？",
        "a": "不准确。现代人类与现代黑猩猩具有共同祖先，之后在不同分支上演化。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "anatomy",
    "modelNote": "原创证据与推理模型。资料句为课堂情景，不声称呈现全部最新研究；示意装置、轮廓和关系图不按实物比例，结论不得超出所给证据。",
    "controls": [
      {
        "key": "feature",
        "label": "比较特征",
        "value": "movement",
        "options": [
          {
            "value": "movement",
            "label": "主要运动方式"
          },
          {
            "value": "skull",
            "label": "颅骨与脑的相对特征"
          },
          {
            "value": "communication",
            "label": "语言与文化活动"
          }
        ]
      },
      {
        "key": "relationship",
        "label": "关系解释",
        "value": "branch",
        "options": [
          {
            "value": "branch",
            "label": "现生类群具有共同祖先"
          },
          {
            "value": "direct",
            "label": "人由现代黑猩猩直接变成"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "图中人类与黑猩猩共享一个分支节点，如何解释？",
      "steps": [
        {
          "title": "明确条件",
          "text": "节点代表推断的共同祖先。"
        },
        {
          "title": "观察或依据",
          "text": "两条现生分支都经历了演化。"
        },
        {
          "title": "推理与表达",
          "text": "不能把其中一个现生类群视为另一个的直接祖先。"
        }
      ],
      "answer": "两者有共同祖先，各自经历演化，现代黑猩猩不是现代人的直接祖先。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "比较现代类人猿与人类"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "specimen": "human-comparison"
    },
    "evidencePages": [
      71,
      72
    ]
  },
  {
    "id": "bio-species-register",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第四章 生物多样性及其保护",
    "title": "比较不同年度物种名录记录",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "统计名录记录差异，区分知识更新、物种数与种群数量变化。",
    "apparatus": [
      "公开物种名录",
      "发布年份及分类说明",
      "统计表"
    ],
    "steps": [
      "记录资料来源、年份和地域范围。",
      "核对分类口径及同物异名等变化。",
      "计算可比较记录的数量差，保留原始数字。",
      "讨论增加可能来自新发现、新记录和分类修订等，不直接等同生态恢复。"
    ],
    "observations": [
      "不同年度名录记录数可能改变。",
      "物种名录不直接给出每个物种的野外个体数量。"
    ],
    "conclusion": "名录统计要先统一口径，记录数增加不能单独证明野外种群恢复。",
    "examPoints": [
      "物种数与个体数不同",
      "统计口径一致",
      "资料更新与自然变化区分"
    ],
    "pitfalls": [
      "不把示例数当中国真实统计",
      "不能用名录总数代替濒危程度"
    ],
    "questions": [
      {
        "q": "名录增加100种能证明生态系统新增100个稳定种群吗？",
        "a": "不能。可能是调查发现、分类修订或记录范围变化，还需野外分布和种群证据。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "survey",
    "modelNote": "场景中的数量为可编辑的教学样本；统计结论只适用于该样本，不能冒充校园、地区或人群的实测结果。",
    "controls": [
      {
        "key": "earlier",
        "label": "较早名录记录数",
        "min": 0,
        "max": 20000,
        "value": 1000,
        "step": 100,
        "unit": "种"
      },
      {
        "key": "later",
        "label": "较后名录记录数",
        "min": 0,
        "max": 20000,
        "value": 1200,
        "step": 100,
        "unit": "种"
      },
      {
        "key": "sameScope",
        "label": "口径是否一致",
        "value": "yes",
        "options": [
          {
            "value": "yes",
            "label": "范围与分类口径可比"
          },
          {
            "value": "no",
            "label": "范围或分类标准不同"
          }
        ]
      },
      {
        "key": "explanation",
        "label": "变化解释",
        "value": "record",
        "options": [
          {
            "value": "record",
            "label": "调查或分类知识发生更新"
          },
          {
            "value": "population",
            "label": "直接证明所有野外种群恢复"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "口径相同的教学名录由1000种变为1200种，解释差值。",
      "steps": [
        {
          "title": "明确条件",
          "text": "数据为明确教学样例，并非我国实测统计。"
        },
        {
          "title": "观察或依据",
          "text": "差值=1200−1000=200种。"
        },
        {
          "title": "推理与表达",
          "text": "只表示名录增加200条物种记录，生态状况需其他证据。"
        }
      ],
      "answer": "该教学名录增加200种记录，不能据此断言野外种群全面恢复。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "我国的物种多样性"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "species-register"
    },
    "evidencePages": [
      79
    ]
  },
  {
    "id": "bio-invasive-species",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第四章 生物多样性及其保护",
    "title": "调查外来入侵风险并比较保护措施",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "依据来源、定殖与危害证据区分外来种和入侵种，并评价保护方案。",
    "apparatus": [
      "本地官方物种资料",
      "观察记录与位置图",
      "保护措施卡"
    ],
    "steps": [
      "查阅本地区权威资料，不凭外形自行断定入侵种。",
      "记录物种来源、分布及可核实的生态影响。",
      "分析传播途径和已有管理要求。",
      "比较就地保护、迁地保护及不当放生的后果。"
    ],
    "observations": [
      "不是所有外来物种都已造成入侵危害。",
      "入侵可通过竞争、捕食或病原传播等影响原生生态关系。",
      "就地与迁地保护各有作用，不能简单相互替代。"
    ],
    "conclusion": "保护行动应依据当地证据和管理要求；不随意放生，不自行清除未确认物种。",
    "examPoints": [
      "外来与入侵区别",
      "就地保护和迁地保护",
      "传播途径管理"
    ],
    "pitfalls": [
      "不能把全部外来种等同入侵种",
      "不能凭网页模型批准野外释放"
    ],
    "questions": [
      {
        "q": "外来植物在校园栽种就一定属于入侵种吗？",
        "a": "不一定。还需核对定殖扩散及造成危害的可靠证据和当地管理认定。"
      }
    ],
    "safety": [
      "只调查和记录，不徒手接触未知生物，不自行捕杀、采集或放生。"
    ],
    "model": "ecology",
    "modelNote": "基于来源和危害证据的方案评价，不预测生态后果或授权野外处理。",
    "controls": [
      {
        "key": "status",
        "label": "所调查物种状态",
        "value": "native",
        "options": [
          {
            "value": "native",
            "label": "本地原生种"
          },
          {
            "value": "introduced",
            "label": "外来但未证实造成危害"
          },
          {
            "value": "invasive",
            "label": "已有可靠入侵危害证据"
          }
        ]
      },
      {
        "key": "pathway",
        "label": "情景途径",
        "value": "release",
        "options": [
          {
            "value": "release",
            "label": "随意放生"
          },
          {
            "value": "trade",
            "label": "运输或引种携带"
          },
          {
            "value": "contained",
            "label": "合规封闭管理"
          }
        ]
      },
      {
        "key": "action",
        "label": "保护行动",
        "value": "habitat",
        "options": [
          {
            "value": "habitat",
            "label": "保护原生境并报告异常"
          },
          {
            "value": "exsitu",
            "label": "合规迁地保存作为补充"
          },
          {
            "value": "release",
            "label": "自行放生或扩大引种"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "某外来动物已有入侵危害记录，有人建议放入附近河流，如何评价？",
      "steps": [
        {
          "title": "明确条件",
          "text": "先确认当地可靠记录与管理要求。"
        },
        {
          "title": "观察或依据",
          "text": "释放可增加传播和生态风险。"
        },
        {
          "title": "推理与表达",
          "text": "拒绝自行放生，向教师或相关管理部门反映。"
        }
      ],
      "answer": "不能自行放生；应依可靠证据和当地管理要求处理。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "外来入侵物种如何威胁生物多样性？",
      "保护生物多样性的措施"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "invasive"
    },
    "evidencePages": [
      85,
      86,
      87
    ]
  },
  {
    "id": "bio-sexual-comparison",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第一章 生物的生殖",
    "title": "比较几种动物的有性生殖",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "用精卵结合辨认有性生殖，比较受精方式及其环境联系。",
    "apparatus": [
      "动物生殖过程资料卡",
      "配子与受精卵模型",
      "比较表"
    ],
    "steps": [
      "查明精子和卵细胞的来源与结合地点。",
      "区分体内受精、体外受精与卵的产出位置。",
      "比较不同动物仍具有的共同生殖环节。"
    ],
    "observations": [
      "模型中的蝗虫和鸟通常为体内受精，斗鱼及水螅示例为体外结合。",
      "体内受精不等于胎生；鸟虽然体内受精，仍产卵。"
    ],
    "conclusion": "有性生殖的核心是两性生殖细胞结合，不能只按是否产卵判断受精方式。",
    "examPoints": [
      "受精方式与发育方式不同",
      "精卵结合与遗传信息传递"
    ],
    "pitfalls": [
      "不要把卵生等同体外受精",
      "不要把某个动物的方式套用全部动物"
    ],
    "questions": [
      {
        "q": "鸟卵在体外孵化意味着鸟在体外受精吗？",
        "a": "不意味着，鸟通常在体内完成受精，之后产卵，卵在体外发育。"
      }
    ],
    "safety": [
      "使用资料与模型，不干扰动物繁殖或采集野生鸟卵。"
    ],
    "model": "reproduction",
    "modelNote": "表示生殖发育的阶段与必要条件，不预测发育天数或成活率；动物饲养需要满足物种的真实环境要求。",
    "controls": [
      {
        "key": "animal",
        "label": "教材情景",
        "value": "hydra",
        "options": [
          {
            "value": "hydra",
            "label": "水螅"
          },
          {
            "value": "locust",
            "label": "蝗虫"
          },
          {
            "value": "fish",
            "label": "斗鱼"
          },
          {
            "value": "bird",
            "label": "鸟"
          }
        ]
      },
      {
        "key": "stage",
        "label": "观察阶段",
        "value": "gametes",
        "options": [
          {
            "value": "gametes",
            "label": "形成生殖细胞"
          },
          {
            "value": "fertilization",
            "label": "精卵结合"
          },
          {
            "value": "zygote",
            "label": "受精卵与发育"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "比较鸟与斗鱼的受精方式及共同环节。",
      "steps": [
        {
          "title": "明确条件",
          "text": "分开记录受精地点与产卵地点。"
        },
        {
          "title": "观察或依据",
          "text": "鸟通常体内受精，斗鱼典型情景为体外受精。"
        },
        {
          "title": "推理与表达",
          "text": "两者均有精子与卵细胞结合形成受精卵。"
        }
      ],
      "answer": "受精地点不同，但都由精卵结合形成受精卵，属于有性生殖。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "几种动物的有性生殖"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "sexual"
    },
    "evidencePages": [
      12
    ]
  },
  {
    "id": "bio-transgene-evidence",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第二章 生物的遗传与变异",
    "title": "分析转基因番茄对照实验的启示",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "根据给定对照证据讨论基因与性状的关系，识别环境混杂。",
    "apparatus": [
      "教材情景的原创资料卡",
      "两组植株模型",
      "变量核对表"
    ],
    "steps": [
      "明确输入材料为教材给定情景，不是网页真实基因实验。",
      "核对除基因状态外的材料、处理与观察条件。",
      "比较同一环境下的现象，再讨论可以支持的结论。"
    ],
    "observations": [
      "给定教材情景中，两组植株低温后的表现可不同。",
      "同时改变光照、水分会妨碍将差异归因于基因状态。"
    ],
    "conclusion": "恰当对照的证据可支持基因影响性状，性状表现也受环境影响。",
    "examPoints": [
      "变量控制",
      "基因与性状关系",
      "模型结论的材料范围"
    ],
    "pitfalls": [
      "不能认为导入任何基因都可得到预想性状",
      "不能把模型当真实改造植株"
    ],
    "questions": [
      {
        "q": "两组植株既基因状态不同又浇水不同，能把差异只归因于基因吗？",
        "a": "不能，水分成为混杂因素，需保持其余条件相同并设置重复。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "genetics",
    "modelNote": "仅重现教材给定材料的定性对照逻辑；不预测任意基因的作用，不提供真实基因改造操作，也不把图示当实测。",
    "controls": [
      {
        "key": "group",
        "label": "比较植株",
        "value": "ordinary",
        "options": [
          {
            "value": "ordinary",
            "label": "普通植株"
          },
          {
            "value": "modified",
            "label": "教材中的导入基因植株"
          }
        ]
      },
      {
        "key": "temperature",
        "label": "教材处理情景",
        "value": "room",
        "options": [
          {
            "value": "room",
            "label": "适宜温度"
          },
          {
            "value": "cold",
            "label": "低温处理"
          }
        ]
      },
      {
        "key": "controlled",
        "label": "其他条件",
        "value": "same",
        "options": [
          {
            "value": "same",
            "label": "相同"
          },
          {
            "value": "different",
            "label": "同时改变光和水"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "两组植株同样低温处理，其他条件相同而表现不同，如何解释？",
      "steps": [
        {
          "title": "明确条件",
          "text": "明确教材给定材料与控制条件。"
        },
        {
          "title": "观察或依据",
          "text": "比较处理后的同一观察指标。"
        },
        {
          "title": "推理与表达",
          "text": "结果支持所研究基因状态与该情景性状差异有关，不推广为所有基因。"
        }
      ],
      "answer": "在给定对照条件下，证据支持基因影响相关性状；结论限于所研究材料。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "转基因番茄的启示"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "transgene"
    },
    "evidencePages": [
      23
    ]
  },
  {
    "id": "bio-breeding",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第二章 生物的遗传与变异",
    "title": "比较几个育种实例",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "比较变异来源与人工选择作用，识别诱变不定向及需要验证的环节。",
    "apparatus": [
      "奶牛、小麦、甜椒、棉花育种资料卡",
      "过程顺序卡",
      "证据比较表"
    ],
    "steps": [
      "辨认案例利用已有变异、杂交组合、诱变或基因工程中的哪种思路。",
      "在过程图中标出筛选与后代验证。",
      "讨论哪些环节提供变异、哪些环节进行选择。"
    ],
    "observations": [
      "人工选择作用于存在的变异。",
      "诱变可增加变异机会，但不会按人的需要定向产生指定性状。",
      "目标性状仍需稳定性、环境适应性等验证。"
    ],
    "conclusion": "不同育种思路获得变异的方式不同，共同需要选择与检验。",
    "examPoints": [
      "变异与选择不同",
      "诱变不定向",
      "性状稳定性需要证据"
    ],
    "pitfalls": [
      "不能把人工需要当变异产生的原因",
      "不能仅见一株高产就断定可稳定遗传"
    ],
    "questions": [
      {
        "q": "诱变育种能保证每个后代都出现需要的性状吗？",
        "a": "不能，变异不定向且个体不同，需要筛选并验证。"
      }
    ],
    "safety": [
      "仅比较公开育种原理，不进行辐射、化学诱变或转基因操作。"
    ],
    "model": "genetics",
    "modelNote": "比较育种思路、变异与人工选择的概念模型，不模拟成功率或具体操作过程；诱变不因人的需要而定向发生。",
    "controls": [
      {
        "key": "method",
        "label": "育种思路",
        "value": "selection",
        "options": [
          {
            "value": "selection",
            "label": "已有变异中选择繁育"
          },
          {
            "value": "hybrid",
            "label": "杂交组合亲本性状"
          },
          {
            "value": "mutation",
            "label": "诱变后选择"
          },
          {
            "value": "transgene",
            "label": "引入特定基因的研究"
          }
        ]
      },
      {
        "key": "claim",
        "label": "选择说明",
        "value": "screen",
        "options": [
          {
            "value": "screen",
            "label": "按目标筛选并验证后代"
          },
          {
            "value": "directed",
            "label": "认为需求会定向产生所需变异"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "某处理后出现多种性状，有人只保留目标类型，分别是哪两个环节？",
      "steps": [
        {
          "title": "明确条件",
          "text": "区分产生变化与人为保留的行为。"
        },
        {
          "title": "观察或依据",
          "text": "变化提供选择材料，保留目标类型属于人工选择。"
        },
        {
          "title": "推理与表达",
          "text": "之后仍应验证后代及不同环境下表现。"
        }
      ],
      "answer": "变异提供材料，人工选择保留目标类型，两者不能混为一谈。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "几个育种实例"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "breeding"
    },
    "evidencePages": [
      46,
      47
    ]
  },
  {
    "id": "bio-sex-ratio-data",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第二章 生物的遗传与变异",
    "title": "分析人口性别比资料的统计口径",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "按定义计算性别比并区分人口统计与受精时理论概率。",
    "apparatus": [
      "注明时间与地域的数据表",
      "统计对象说明",
      "计算记录表"
    ],
    "steps": [
      "核对计数对象、时间、范围及资料来源。",
      "按每100名女性对应男性人数计算。",
      "将人口结构统计与典型配子随机结合模型分开解释。"
    ],
    "observations": [
      "性别比常按男性人数÷女性人数×100表示。",
      "总人口、出生人口和配子结合概率不是同一统计对象。",
      "网页初值是教学样例，不是实际普查记录。"
    ],
    "conclusion": "统计结果只描述所给资料，不能直接用于推定受精概率或归责某一性别。",
    "examPoints": [
      "分母定义",
      "数量比与概率不同",
      "统计口径一致"
    ],
    "pitfalls": [
      "女性数为0时不能计算该比值",
      "不能把总人口性别比当下一胎性别预测"
    ],
    "questions": [
      {
        "q": "总人口性别比为105，能说受精时XY概率就是105%吗？",
        "a": "不能。105表示每100名女性对应105名男性，是人口数量比而非概率。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "survey",
    "modelNote": "场景中的数量为可编辑的教学样本；统计结论只适用于该样本，不能冒充校园、地区或人群的实测结果。",
    "controls": [
      {
        "key": "male",
        "label": "资料中的男性人数",
        "min": 0,
        "max": 100000,
        "value": 1050,
        "step": 50,
        "unit": "人"
      },
      {
        "key": "female",
        "label": "资料中的女性人数",
        "min": 0,
        "max": 100000,
        "value": 1000,
        "step": 50,
        "unit": "人"
      },
      {
        "key": "scope",
        "label": "资料统计对象",
        "value": "population",
        "options": [
          {
            "value": "population",
            "label": "全部常住人口"
          },
          {
            "value": "newborn",
            "label": "某时期活产新生儿"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "教学资料中男1050人、女1000人，计算男性人数对女性人数的比值。",
      "steps": [
        {
          "title": "明确条件",
          "text": "定义是每100名女性对应的男性人数。"
        },
        {
          "title": "观察或依据",
          "text": "1050÷1000×100=105。"
        },
        {
          "title": "推理与表达",
          "text": "应写105名男性对应100名女性，不写男性概率105%。"
        }
      ],
      "answer": "教学资料性别比为105，即每100名女性对应105名男性；不是受精概率。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "分析和解释数据"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "variant": "sex-ratio"
    },
    "evidencePages": [
      42
    ]
  },
  {
    "id": "bio-evidence-reasoning",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第三章 生物的进化",
    "title": "评价演化证据并区分事实和观点",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "按证据来源、相关性和替代解释评价假说，区分观察与推断。",
    "apparatus": [
      "原创课堂资料卡",
      "事实与推论标签",
      "证据链记录表"
    ],
    "steps": [
      "先核对资料说明的测量或发现事实。",
      "把由事实提出的解释单独列出。",
      "检查其他证据与可能的替代解释。",
      "根据新证据修正判断，不把课堂资料卡当最新研究结论全集。"
    ],
    "observations": [
      "发现某地点的化石与推断迁徙路径不是同一句话。",
      "某种异常现象可以支持一类解释，但通常不足以独立排除所有其他解释。"
    ],
    "conclusion": "科学解释需要证据支持和可修正性；事实记录、推测与确定程度应分别表达。",
    "examPoints": [
      "证据与观点区别",
      "多证据支持",
      "可检验性和替代解释"
    ],
    "pitfalls": [
      "不能把有图有数字自动当结论成立",
      "不要把教材介绍的假说都称为最新已证实定论"
    ],
    "questions": [
      {
        "q": "在甲地发现古人类化石，能仅据此确定全部迁徙路线吗？",
        "a": "不能。发现地点是线索，迁徙路径还需年代、更多地点及其他证据支持。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "anatomy",
    "modelNote": "原创证据与推理模型。资料句为课堂情景，不声称呈现全部最新研究；示意装置、轮廓和关系图不按实物比例，结论不得超出所给证据。",
    "controls": [
      {
        "key": "case",
        "label": "资料情景",
        "value": "extinction",
        "options": [
          {
            "value": "extinction",
            "label": "恐龙灭绝假说"
          },
          {
            "value": "migration",
            "label": "古人类迁徙推断"
          }
        ]
      },
      {
        "key": "statement",
        "label": "句子类型",
        "value": "observation",
        "options": [
          {
            "value": "observation",
            "label": "资料记载的观察结果"
          },
          {
            "value": "inference",
            "label": "依据结果提出的解释"
          },
          {
            "value": "overclaim",
            "label": "把单条线索当成唯一证明"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "资料卡说“某地发现化石”，有人说“因此已确定全部迁徙路线”，如何评价？",
      "steps": [
        {
          "title": "明确条件",
          "text": "区分发现事实与路线推断。"
        },
        {
          "title": "观察或依据",
          "text": "一个地点不足以约束全部路线和时间顺序。"
        },
        {
          "title": "推理与表达",
          "text": "应补充年代和其他地点证据，限定结论。"
        }
      ],
      "answer": "化石发现是证据，完整迁徙路线是待更多证据检验的解释。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "评价证据与假说",
      "区分事实和观点"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "specimen": "evidence"
    },
    "evidencePages": [
      61,
      74
    ]
  },
  {
    "id": "bio-cell-comparison",
    "subject": "biology",
    "term": "8下",
    "chapter": "第六单元 第四章 生物多样性及其保护",
    "title": "综合比较不同类群的细胞结构",
    "kind": "拓展探究",
    "tags": [
      "教材实践"
    ],
    "sourceIds": [
      "bio-pep8down-images",
      "bio-pep8down-start2026"
    ],
    "objective": "以细胞共同结构与差异联系生物多样性和统一性。",
    "apparatus": [
      "四类细胞原创模型",
      "共同点与差异比较表",
      "概念关系卡"
    ],
    "steps": [
      "按统一的结构项目比较四种模型。",
      "区分细菌的DNA区域与真核细胞的成形细胞核。",
      "核对叶绿体、细胞壁等结构出现的范围。",
      "说明典型模型不能包含每类生物全部特殊情况。"
    ],
    "observations": [
      "四种模型均具有细胞膜、细胞质和遗传物质。",
      "典型细菌没有成形细胞核；真菌、植物和动物细胞为真核细胞。",
      "真菌无叶绿体；植物也不是每个细胞都有叶绿体。"
    ],
    "conclusion": "共同细胞结构体现统一性，结构和功能差异体现多样性。",
    "examPoints": [
      "原核与真核区别",
      "叶绿体不是所有细胞共有",
      "病毒没有细胞结构"
    ],
    "pitfalls": [
      "不能说真菌因为有细胞壁就能光合",
      "典型细菌壁模型不否认少数无壁类群"
    ],
    "questions": [
      {
        "q": "真菌有细胞壁，能由此断定它能光合作用吗？",
        "a": "不能。光合作用相关结构不能只由细胞壁推定；真菌没有叶绿体，营养方式与绿色植物不同。"
      }
    ],
    "safety": [
      "实物操作遵守教师指导；不接触未知生物，不将实验材料放入口中。"
    ],
    "model": "anatomy",
    "modelNote": "结构与位置为教学示意，比例及颜色经过简化；切换结构只改变观察重点，不代表对真实生物进行切割。",
    "controls": [
      {
        "key": "group",
        "label": "典型细胞模型",
        "value": "bacteria",
        "options": [
          {
            "value": "bacteria",
            "label": "典型细菌"
          },
          {
            "value": "fungus",
            "label": "真菌"
          },
          {
            "value": "plant",
            "label": "植物叶肉"
          },
          {
            "value": "animal",
            "label": "动物体细胞"
          }
        ]
      },
      {
        "key": "focus",
        "label": "比较结构",
        "value": "membrane",
        "options": [
          {
            "value": "membrane",
            "label": "细胞膜"
          },
          {
            "value": "nucleus",
            "label": "成形细胞核"
          },
          {
            "value": "wall",
            "label": "细胞壁与叶绿体"
          }
        ]
      }
    ],
    "workedExample": {
      "title": "规范作答",
      "given": "比较典型细菌与动物体细胞，列一项共同点和一项差异。",
      "steps": [
        {
          "title": "明确条件",
          "text": "用同一结构项目进行比较。"
        },
        {
          "title": "观察或依据",
          "text": "两者均有细胞膜和遗传物质。"
        },
        {
          "title": "推理与表达",
          "text": "动物细胞有成形细胞核，典型细菌没有。"
        }
      ],
      "answer": "共同具有细胞膜等基本结构；动物细胞有成形细胞核，典型细菌没有。"
    },
    "ncetIds": [],
    "evidenceTitles": [
      "综合概括"
    ],
    "evidenceStatus": "第三方学生书图像逐页核对；未核版权页印次",
    "config": {
      "specimen": "cell-comparison"
    },
    "evidencePages": [
      89
    ]
  }
]);
