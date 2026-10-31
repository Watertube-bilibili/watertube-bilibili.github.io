# Full junior science lab implementation contract

Root owns dist/index.html, app.js, style.css, integration, GitHub/publication.
Contributors own only their allocated catalog/module/source files. Work can take sustained time; precision matters.

## Catalog
Create `dist/catalog/<subject>.js` for subject physics/chemistry/biology:
`window.LAB_CATALOG = window.LAB_CATALOG || []; window.LAB_CATALOG.push(...[...records]);`
Each record (all content ORIGINAL Chinese explanations):
```
{
 id: 'phy-speed', subject: 'physics', term: '8上', chapter: '第一章 机械运动',
 title: '测量平均速度', kind: '学生实验'|'演示实验'|'小实验'|'拓展探究',
 tags: ['必做','控制变量'], sourceIds:['pep-physics-new'],
 objective:'...', apparatus:['...'], steps:['...'], observations:['...'],
 conclusion:'...', examPoints:['...'], pitfalls:['...'],
 questions:[{q:'...',a:'...'}], safety:['...'],
 model:'incline', modelNote:'本模拟的假设及不能代表真实实验的方面',
 controls:[{key:'length',label:'路程',unit:'m',min:.5,max:2,step:.05,value:1},
 {key:'condition',label:'...',value:'air',options:[{value:'air',label:'空气'}]}],
 // common term 7上 7下 8上 8下 9上 9下; physics九上/下 is WEB ORGANIZATION of 九全, not textbook claims.
 // some experiments span terms: optional relatedTerms:['8上'].
 workedExample: {title:'规范例题',given:'已知...',steps:[{title:'统一单位',text:'...'},
 {title:'依据',text:'...'}, {title:'代入计算',text:'...'}, {title:'作答',text:'...'}],answer:'...'},
 // For qualitative-only experiments: workedExample:{title:'规范作答',given:'实验观察...',steps:[...],answer:'...'};
 // Never invent needless calculations or present sample outputs as actual measurements.
}
```
Every entry must contain real experiment-specific content (not title-only duplicate placeholders). Include small demonstrations and exploratory activities found in verified current PEP resources. Sources at `dist/catalog/sources-<subject>.js` push to window.LAB_SOURCES array: {id,title,url,publisher,checked:'2026-10-31',scope,edition}. Add `research/<subject>-coverage.json` mapping textbook activity -> implementation id with evidence and exact verification status. Never label an inferred textbook assignment verified. Distinguish curriculum required list versus extended demonstrations.

## Runtime module
`dist/modules/<subject>.js` defines:
`window.LAB_MODULES=window.LAB_MODULES||{}; window.LAB_MODULES.<subject>={simulate,render};`
`simulate(experiment, params, progress)` returns object or Promise:
```
{readings:[{label:'',value:1.23,unit:''}],
 process:[{title:'',text:''}], // current actual model calculation/analysis steps
 conclusion:'',
 table:{headers:['...'],rows:[[...]]}, // optional
 graph:{xLabel:'',yLabel:'',points:[[x,y],...]}, // optional
 ...custom fields for renderer}
```
progress is 0..1 experiment playhead, root animates ~5s, user can pause/reset. Root calls simulate on parameter changes or start; avoid expensive repeated calls per frame. Root calls `render(experiment,params,result,progress)` per animation frame; returns SVG CONTENT inside root `<svg viewBox="0 0 900 430">`. Must render subject-specific actual apparatus/specimen/reaction scene with legible labels, no emojis. Own original SVG. No root global DOM mutation. Built-in view for each model family, configurations differ by experiment. Controls affect results and visible scene. Handle min/max safely; show domain restrictions.

Physics module MUST compute through GodotLab.evaluate(model,params) (new engine API by engine agent), no fake engine badge or analytic JS fallback. Rigid-body movement uses actual Godot solver; optics/circuits/thermal/static experiments use their scientific mathematical solver inside Godot. Expose type/model and limits honestly. Chemistry and biology use correct stoichiometric/logical/biological numerical models; physical crossovers may request Godot evaluation.

Preserve current 2-second calculation action in root with text 正在努力计算中 and segmented progress; don't reveal duration in page copy. Results recorded and CSV export. Calculation process must include principle, units, substitution, result, interpretation. Qualitative experiments instead show observations -> inference -> conclusion.

## Safety/copyright/quality
Do not reproduce publisher scans or downloaded copyrighted slides. Link sources; original code/content AGPL-3.0-only, Godot third-party notices preserved. No real dangerous home-experiment encouragement; simulation-only labels and experiment-specific lab supervision notes where pertinent. No arbitrary biological numeric results disguised as real data. Normal class-level acid/base, gas prep/qualitative reaction science allowed; avoid explosive synthesis beyond standard conceptual demonstrations. Use no modern emoji.

## Files and verification
Keep research evidence and a complete explicit coverage list. Verify formulas/units/counterexamples, controls and rendered output at endpoints, no unsupported assertions of exhaustive coverage. Add meaningful domain tests (node or browser). Root runs full UI tests + publication. Consult user task history for visual style.

## 终态与动画进度

`simulate(experiment, params, 1)` 必须返回给定实验条件下的完整结果，主页面只调用一次。公共simulate应默认求终态；动画播放进度由`render(experiment, params, result, progress)`单独使用，不得用初始帧0覆盖最终测量数据。
