# SPDX-License-Identifier: AGPL-3.0-only
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
def source(id,title,url,publisher,scope,edition):return dict(id=id,title=title,url=url,publisher=publisher,scope=scope,edition=edition,checked='2026-10-31')
S=[
source('bio-ncet2023','教育部中小学实验教学基本目录（2023年版）· 初中生物学','https://www.ncet.edu.cn/u/cms/www/202311/241430136xjv.pdf','教育部教育技术与资源发展中心（中央电化教育馆）','核对生物学56个条目原题；47—56为跨学科实践可选项目。目录编号映射不代表真实实物操作已经完成。','2023年基本目录，适用2022年课程标准'),
source('bio-standard2022','义务教育生物学课程标准（2022年版）','https://www.moe.gov.cn/srcsite/A26/s8001/202204/W020220420582359998122.pdf','中华人民共和国教育部','课程性质及实践要求的官方依据；本站不把课标主题直接当作教材某册原题。','2022年课程标准'),
source('bio-pep-new','人教版义务教育教科书·生物学新教材介绍','https://www.pep.com.cn/xw/zt/hd/12/xjcjs/cz/202409/t20240914_1995532.html','人民教育出版社','核对新教材六单元结构与编写思路；用于说明新旧册次重排，不作全部活动逐题核验依据。','2024年启用的新修订教材体系'),
source('bio-pep-features','生物学新教材编写特点与教学建议','https://www.pep.com.cn/xw/zt/hd/12/zbtjc/202409/t20240920_1995567.html','人民教育出版社','新教材活动组织及跨学科实践的说明。','2024年新教材说明'),
source('bio-pep7up-text','人教版七年级上册生物学公开文本（2024修订本）','https://www.yeyulingfeng.com/wendang/91246806.html','公开教材文本转载页面（非出版社官网）','用于活动名称与所在单元交叉核对；来源为二手转录，未逐页核验出版社原版版式，不分发原文与扫描件。','七上2024新教材；微生物与生物分类内容已重排到本册'),
source('bio-pep7down-text','人教版七年级下册生物学公开文本（2025修订本）','https://www.yeyulingfeng.com/wendang/91248302.html','公开教材文本转载页面（非出版社官网）','核对植物的生活、人体生理与健康（一）中的命名活动；二手文本证据，网站实验内容均为原创改写。','七下2025新教材；植物生活与人体生理（一）'),
source('bio-pep8up-text','人教版八年级上册生物学公开文本（2025修订本）','https://www.yeyulingfeng.com/wendang/91246602.html','公开教材文本转载页面（非出版社官网）','核对人体生理与健康（二）、生物与环境中的活动名称；不能据此声称旧版八上动物专题仍按原册次排列。','八上2025新教材；人体生理（二）与生物环境'),
source('bio-pep8down-guide','2026新教材八年级下册生物学教师用书活动说明（公开摘录）','https://www.sohu.com/a/1053101410_120904083','搜狐公开教师用书摘录（非出版社官网）','核对五项实验探究及两项跨学科实践；只有目录与活动说明证据，未核对全册每个栏目的出版社原本。','八下2026新教材活动说明；生殖、遗传变异、进化与多样性保护'),
source('bio-aha-bls2025','2025 American Heart Association Guidelines · Adult Basic Life Support','https://cpr.heart.org/en/resuscitation-science/cpr-and-ecc-guidelines/adult-basic-life-support','American Heart Association','核对成人CPR按压频率100—120次/分、深度约5—6cm、充分回弹、受训者30:2及早期AED等教学要点；不替代当地急救培训。','2025成人基础生命支持指南'),
source('bio-redcross-bleeding','Life-Threatening External Bleeding · First Aid','https://www.redcross.org/take-a-class/resources/learn-first-aid/bleeding-life-threatening-external','American Red Cross','核对严重外出血呼救、个人防护及持续直接压迫等原则；本站仅提供流程模型，不提供危险实操演示。','官网急救教学资料，2026-10-31核对'),
source('bio-nhc-health2024','中国公民健康素养——基本知识与技能（2024年版）','https://www.nhc.gov.cn/xcs/c100123/202404/c30d31cb877749ce94ce23d2c55ad973/files/1733220375762_77083.pdf','国家卫生健康委员会','核对急救求助与拒绝毒品等公众健康原则，非个人医疗建议。','2024年版')]
S += [source('bio-pep8down-start2026','人教版新修订八年级下册教材2026年春季启用说明','https://www.pep.com.cn/rjdt/mtbd/202603/t20260304_2005510.shtml','人民教育出版社','官方启用时间与教材体系依据；不把启用新闻当作各活动逐页证据。','2026年春季启用，封面2024审定的新修订体系'),source('bio-pep8down-images','人教版八年级下册生物学学生书公开图像镜像','https://zxkeben.szxuexiao.com/rjb8njswx2024.html','第三方公开教材镜像（非出版社官网）','独立视觉核对印刷页1—99的26项命名栏目及卵壳气孔边栏；封面2024审定、章节与2026教师用书一致。未核版权页印次，不称出版社原本认证。只链接证据，不分发教材图像或原文。','2024审定体系，2026春使用；第三方学生书图像逐页核对')]
(ROOT/'dist/catalog/sources-biology.js').write_text('/* SPDX-License-Identifier: AGPL-3.0-only */\nwindow.LAB_SOURCES=window.LAB_SOURCES||[];\nwindow.LAB_SOURCES.push(...'+json.dumps(S,ensure_ascii=False,indent=2)+');\n')
m=json.loads((ROOT/'research/biology-ncet-map.json').read_text())
coverage=dict(schemaVersion=1,checked='2026-10-31',moduleCount=len(json.loads((ROOT/'dist/catalog/biology.js').read_text().split('push(...',1)[1].rsplit(');',1)[0])),editionNotes=['依据人教社2024介绍，新体系7上为生物和细胞、多种多样的生物；7下为植物的生活及人体生理与健康（一）；8上为人体生理与健康（二）及生物与环境；8下为生命的延续和发展。','7上2024、7下2025、8上2025活动标题来自公开二手全文转录；8下2026除教师用书摘录外，已独立视觉核对第三方学生书p1—99完整图像。均不能冒充出版社原本及版权页印次认证。'],sources=S,baseline={'ncet2023':{'total':56,'optionalIds':list(range(47,57)),'items':m['ncet']}},textbookActivities=m['pepNamedActivities'],limitations=['本清单记录已核命名活动与基本实验目录映射，不声称穷尽所有未命名图片、讨论与正文小操作。','每项网页模型是原创的教学任务，不能替代真实标本观察、培养、调查和急救技能训练。','图示数值为公式理论值、明确合成样本或用户输入记录，不是网页测得的真实生物数据。','NCET 2023条目先于新教材重排，部分学期标签为本网站教学归类。','8下完整第三方学生书图像核对覆盖26项命名栏目；未核版权页印次，不能宣称出版社原本认证。'])
(ROOT/'research/biology-coverage.json').write_text(json.dumps(coverage,ensure_ascii=False,indent=2)+'\n')
print(len(S),'sources; 56 baseline titles;',len(m['pepNamedActivities']),'verified named activity mappings')
