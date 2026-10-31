import {browserWorldConfig,readWorldSlot,acquireWorldLease} from './browser-world-slots.js';
import {installBrowserWorldSnapshot,installCrescentFullRuntime} from './browser-world-runtime.js';
import {setCommonMaterialPack} from './map-feature.js';
import {createBrowserWorldBootStorage} from './browser-world-boot-storage.js';
import {createBrowserWorldLifecycle} from './browser-world-lifecycle.js';
export async function startBrowserWorld(request){
 if(window.__sunriseBrowserWorldLifecycle)throw Error('此页面已启动过日出，请刷新后重新进入');
 const lifecycle=createBrowserWorldLifecycle({window,reportCleanupError:error=>console.error('日出启动清理失败',error)});
 window.__sunriseBrowserWorldLifecycle=lifecycle;
 const progress=document.createElement('div');progress.setAttribute('role','status');progress.style.cssText='position:fixed;top:15%;left:10%;right:10%;z-index:100001;background:#173a31;color:white;padding:18px';progress.style.setProperty('visibility','visible','important');document.body.append(progress);const phase=t=>progress.textContent='日出正在载入：'+t;
 let lease=null,bootStorage=null;try{phase('检查独立存档锁');
 const config=browserWorldConfig(request.map,request.id);lease=lifecycle.trackLease(await acquireWorldLease(config,{signal:lifecycle.signal,manageLifecycle:false}));
 phase('校验完整进度');const {validateSave}=await import('./save-validation.js');lifecycle.checkpoint();const entry=await readWorldSlot(localStorage,request.map,request.id,validateSave);lifecycle.checkpoint();
 // Use actual authored asphalt on the normal path, not the procedural QA shortcut.
 phase('载入真实道路贴图');const THREE=await import('./vendor/three.module.js');lifecycle.checkpoint();const {createOwnedAsphaltPack}=await import('../../../materials/owned-asphalt-pack.js');lifecycle.checkpoint();const pack=lifecycle.trackPack(await createOwnedAsphaltPack(THREE));setCommonMaterialPack(pack);
 phase('载入车型与场景');await import('./mobile-ui.js');lifecycle.checkpoint();const g=window.game;if(!g)throw Error('游戏实例未成功创建');g.browserWorldLifecycle=lifecycle;lifecycle.trackGame(g);
 phase('启动物理引擎');await g.physicsReady;lifecycle.checkpoint();if(!g.physics?.ready||g.physics.failed)throw g.physics?.error??Error('物理引擎尚未就绪；未提交存档');
 bootStorage=createBrowserWorldBootStorage({storage:localStorage,key:config.key,lifecycle,lease});
 phase('恢复地图完整快照');const validate=installBrowserWorldSnapshot(g,config);validate(entry.save);
 if(request.map==='estuary'){
  const originalValidate=g.validateSave.bind(g);g.validateSave=s=>{originalValidate(s);validate(s);return s;};
  phase('连接外卖职业与存档');const {installDeliveryRuntime}=await import('./delivery-runtime.js');lifecycle.checkpoint();await installDeliveryRuntime(g,{lease,config,storage:bootStorage.storage});
 }else await installCrescentFullRuntime(g,{config,lease,storage:bootStorage.storage,validate});
 lifecycle.checkpoint();phase('完成渲染配置');pack.configureRenderer?.(g.renderer);lifecycle.checkpoint();
 const home=document.createElement('a');home.href='../browser-worlds.html?physics='+encodeURIComponent(request.physics);home.textContent='SUNRISE · 地图与独立存档';home.className='beta-save-home';home.onclick=e=>{if(!g.save(false)){e.preventDefault();g.ui.toast('进度未成功保存，请先处理存档错误','error');}};document.body.append(home);
 const note=document.createElement('div');note.className='browser-world-limitations';note.textContent=(request.map==='crescent'?'弧湾 · 完整独立玩家档；职业路线尚未适配':'海岸 · 独立玩家档与外卖职业')+' · 三款摩托与 Rocket 手动起降；飞机/自动特技/结构掉轮未开放，非全功能完成版';note.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;background:#173a31;color:white;font:12px sans-serif;padding:4px;text-align:center';document.body.append(note);
 const activeBackend=g.physics.backendId??(request.physics==='browser'?'browser':null);if(activeBackend!==request.physics)throw Error('物理后端与明确选择不一致；未提交存档');
 const wordmark=document.querySelector('.wordmark small');if(wordmark)wordmark.textContent=request.map.toUpperCase()+' · '+(activeBackend==='rapier'?'Rapier 物理':'旧浏览器物理');g.browserWorld={map:request.map,slot:request.id,backend:activeBackend,saveFormat:'browser-v2'};document.documentElement.dataset.physicsBackend=activeBackend;progress.remove();lifecycle.checkpoint();bootStorage.commit();lifecycle.enableWrites();lifecycle.markReady();document.documentElement.dataset.betaUiReady='2';
 }catch(e){progress.remove();bootStorage?.cancel();if(bootStorage?.receipt&&window.game)Object.defineProperty(window.game,'browserWorldBootReceipt',{value:bootStorage.receipt,enumerable:false});lifecycle.fail(e);if(lifecycle.hidden)return {cancelled:true};const label=document.getElementById('load-text');if(label)label.textContent='日出启动停止：'+e.message+'；已停止后续写入，不会重建或清空原进度。';const error=document.createElement('p');error.setAttribute('role','alert');error.style.cssText='position:fixed;inset:25% 10% auto;background:#251a19;color:#fff;padding:24px;z-index:100000';error.style.setProperty('visibility','visible','important');error.textContent='日出启动停止：'+e.message+'；已停止后续写入，不会重建或清空原进度。请返回存档页检查。';document.body.append(error);throw e;}
}
