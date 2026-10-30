/** Standalone SUNRISE COAST career logic. No game bootstrap, storage key or wallet. */
const freeze = value => { if (value && typeof value === 'object') { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
export const DELIVERY_OFFERS = freeze([
  {id:'coast-breakfast',title:'海岸咖啡 · 早餐配送',pickup:{id:'coast-cafe',name:'海岸咖啡取餐点',x:22,z:80},dropoff:{id:'square-customer',name:'中央广场顾客',x:84,z:0},reward:180,budgetMs:180000},
  {id:'park-lunch',title:'棕榈小馆 · 海滨午餐',pickup:{id:'palm-kitchen',name:'棕榈小馆取餐点',x:-156,z:-80},dropoff:{id:'coast-customer',name:'日出海滨顾客',x:4,z:170},reward:260,budgetMs:300000},
  {id:'port-dinner',title:'南港食堂 · 晚餐配送',pickup:{id:'port-kitchen',name:'南港食堂取餐点',x:164,z:240},dropoff:{id:'downtown-customer',name:'中央广场西侧顾客',x:68,z:0},reward:230,budgetMs:240000}
]);
export const DELIVERY_RULES = freeze({interactionRadius:6,stopSpeedMps:0.4,reservationMs:1000,maxMoney:1e10});
const defaultOffers = new Map(DELIVERY_OFFERS.map(offer => [offer.id,offer]));
const phases = new Set(['pickup','delivery']);
const terminalPhases = new Set(['completed','cancelled','expired','failed']);
const failureReasons = new Set(['player-unavailable','world-unavailable','host-reset']);
const clone = value => structuredClone(value);
const integer = value => Number.isSafeInteger(value) && value >= 0;
const goodText = value => typeof value === 'string' && value.length > 0 && value.length <= 160;
const error = (code,message) => Object.assign(new Error(message),{code});
const failed = (code,message) => ({ok:false,code,message});
const receipt = (state,id) => `${state.lineage}:delivery:${id}`;
const labels = {idle:'待接单',pickup:'前往店铺取餐',delivery:'配送中 · 前往顾客',completed:'已送达并结算',cancelled:'订单已取消',expired:'订单超时',failed:'配送失败'};

/** Fail closed: damaged saves are never silently reset, repaired, or overwritten. */
export function validateDeliverySnapshot(snapshot,{allowMissing=false,offerCatalog=DELIVERY_OFFERS}={}) {
  const offers = new Map(offerCatalog.map(offer => [offer.id,offer]));
  if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) throw error('INVALID_SAVE','需要完整的宿主游戏快照');
  if (!Number.isFinite(snapshot.money) || snapshot.money < 0 || snapshot.money > DELIVERY_RULES.maxMoney) throw error('INVALID_SAVE','游戏余额无效');
  if (!integer(snapshot.saveRevision ?? 0)) throw error('INVALID_SAVE','存档版本号无效');
  if (!integer(snapshot.jobsCompleted ?? 0)) throw error('INVALID_SAVE','职业完成数无效');
  if (snapshot.transactions !== undefined && !Array.isArray(snapshot.transactions)) throw error('INVALID_SAVE','游戏交易记录无效');
  const d = snapshot.deliveryCareer;
  if (d === undefined && allowMissing) return snapshot;
  if (!d || d.version !== 1 || !goodText(d.lineage) || !goodText(d.commitToken) || !integer(d.nextOrderId) || d.nextOrderId < 1 || !integer(d.closedThrough) || d.closedThrough >= d.nextOrderId) throw error('INVALID_SAVE','外卖存档版本或订单序号无效');
  if (d.closedThrough === 0 ? d.lastResult !== null : !d.lastResult) throw error('INVALID_SAVE','订单终态记录缺失');
  if (d.lastResult) {
    const r = d.lastResult;
    if (r.orderId !== d.closedThrough || !terminalPhases.has(r.phase) || !offers.has(r.offerId) || r.receipt !== receipt(d,r.orderId) || r.reward !== (r.phase === 'completed' ? offers.get(r.offerId).reward : 0) || typeof r.reason !== 'string') throw error('INVALID_SAVE','订单终态或结算凭证无效');
  }
  if (d.active !== null) {
    const a = d.active, offer = offers.get(a?.offerId);
    if (!offer || a.orderId !== d.closedThrough+1 || d.nextOrderId !== a.orderId+1 || !goodText(a.ownerId) || !phases.has(a.phase) || a.budgetMs !== offer.budgetMs || !Number.isFinite(a.remainingMs) || a.remainingMs < 0 || a.remainingMs > a.budgetMs || !integer(a.reservationSerial)) throw error('INVALID_SAVE','进行中的外卖订单无效');
  } else if (d.nextOrderId !== d.closedThrough+1) throw error('INVALID_SAVE','订单序号不连续');
  return snapshot;
}

/**
 * Persistence contract (synchronous):
 * readSnapshot(): latest complete durable host snapshot.
 * commitSnapshot(next, {expectedRevision}): atomic compare-and-swap of the whole
 * snapshot, returns true only after durable success, false on no-write failure.
 * If it throws AFTER writing, immediate readback reconciles the unique commitToken.
 * The host must serialize ALL wallet/save writes and reject stale revisions.
 */
export function createDeliveryCareer({readSnapshot,commitSnapshot,getActor,navigate=()=>{},makeToken=()=>globalThis.crypto.randomUUID(),offerCatalog=DELIVERY_OFFERS}={}) {
  const offers = new Map(offerCatalog.map(offer => [offer.id,offer]));
  const validate = (snapshot,options={}) => validateDeliverySnapshot(snapshot,{...options,offerCatalog});
  if (![readSnapshot,commitSnapshot,getActor,navigate,makeToken].every(fn => typeof fn === 'function')) throw TypeError('需要完整的同步宿主适配器');
  const instance = makeToken();
  if (!goodText(instance) || instance.length > 100) throw TypeError('实例标识无效');
  let operation = 0, creditMs = 0, creditOrder = null, creditSerial = null, lastError = null;
  let writeInProgress = false;
  const clearCredit = () => { creditMs=0;creditOrder=null;creditSerial=null; };
  const read = (allowMissing=false) => {
    const snapshot = clone(readSnapshot());
    if (snapshot && typeof snapshot.then === 'function') throw error('ASYNC_STORE','存档适配器必须同步');
    validate(snapshot,{allowMissing});
    const a = snapshot.deliveryCareer?.active;
    if (!a || a.orderId !== creditOrder || a.reservationSerial !== creditSerial) clearCredit();
    return snapshot;
  };
  const attempt = fn => {
    if (writeInProgress) return failed('BUSY','存档事务执行中，请稍后重试');
    try { return fn(); } catch(e) { lastError=e.message;return failed(e.code ?? 'ADAPTER_ERROR',e.message); }
  };
  const commit = (previous,next) => {
    const revision = previous.saveRevision ?? 0;
    if (revision >= Number.MAX_SAFE_INTEGER || ++operation >= Number.MAX_SAFE_INTEGER) throw error('LIMIT_REACHED','存档事务序号已耗尽');
    next.saveRevision=revision+1;
    next.deliveryCareer.commitToken=`${instance}:${operation}`;
    validate(next);
    let acknowledgement = false, problem;
    writeInProgress=true;
    try {
      acknowledgement=commitSnapshot(clone(next),{expectedRevision:revision});
      if (acknowledgement && typeof acknowledgement.then === 'function') throw error('ASYNC_STORE','存档适配器必须同步');
    } catch(e) { problem=e; }
    finally { writeInProgress=false; }
    // Even a false return is checked: an adapter may have lost its acknowledgement.
    if (acknowledgement !== true || problem) {
      let observed;
      try { observed=clone(readSnapshot());validate(observed,{allowMissing:true}); }
      catch { throw error('SAVE_UNCERTAIN','保存结果无法确认；请恢复存储后重载，不要重置存档'); }
      if (observed.deliveryCareer?.commitToken !== next.deliveryCareer.commitToken) {
        const code=(observed.saveRevision ?? 0)!==revision ? 'SAVE_CONFLICT' : 'SAVE_FAILED';
        throw error(code,code==='SAVE_CONFLICT'?'存档已由其他操作更新，请重试':'保存失败，订单和余额未变更；恢复存储后重试');
      }
      // The complete snapshot is the receipt; never credit money in a second step.
      if (JSON.stringify(observed)!==JSON.stringify(next)) throw error('SAVE_UNCERTAIN','保存回执内容不一致；已停止本次操作，请重载检查');
    }
    lastError=null;
    return next;
  };
  const route = d => {
    const a=d.active,offer=offers.get(a?.offerId),target=a ? (a.phase==='pickup'?offer.pickup:offer.dropoff) : null;
    try { navigate(target ? clone(target) : null,{orderId:a?.orderId ?? d.lastResult?.orderId ?? null,phase:a?.phase ?? d.lastResult?.phase ?? 'idle'}); }
    catch { lastError='订单已保存，但地图更新失败；可重试导航'; }
  };
  const actor = () => {
    const a=getActor();
    if (!a || !goodText(a.playerId) || !Number.isFinite(a.x) || !Number.isFinite(a.z) || typeof a.inVehicle !== 'boolean' || !Number.isFinite(a.speedMps) || (a.lastVehicleSpeedMps != null && !Number.isFinite(a.lastVehicleSpeedMps))) throw error('INVALID_ACTOR','角色位置或速度不可用');
    return a;
  };
  const remaining = a => a.remainingMs + (a.orderId===creditOrder && a.reservationSerial===creditSerial ? creditMs : 0);
  const interactive = (a,who,target) => {
    if (a.ownerId !== who.playerId) return failed('ACTOR_MISMATCH','订单属于另一位角色');
    if (who.paused) return failed('PAUSED','请先继续游戏');
    if (who.transitioning) return failed('TRANSITION','上下车完成后再操作');
    if (who.inVehicle) return failed('ON_FOOT_REQUIRED','请停稳车辆并下车取送');
    if (Math.abs(who.speedMps)>DELIVERY_RULES.stopSpeedMps || Math.abs(who.lastVehicleSpeedMps ?? 0)>DELIVERY_RULES.stopSpeedMps) return failed('NOT_STOPPED','请停稳车辆并站定后取送');
    if (Math.hypot(who.x-target.x,who.z-target.z)>DELIVERY_RULES.interactionRadius) return failed('TOO_FAR','请靠近目标，进入 6 米范围');
    return {ok:true,code:'READY'};
  };
  const closeOrder = (previous,phase,reason='') => {
    const next=clone(previous),d=next.deliveryCareer,a=d.active,offer=offers.get(a.offerId),reward=phase==='completed'?offer.reward:0;
    if (reward && (next.money+reward>DELIVERY_RULES.maxMoney || (next.jobsCompleted??0)>=Number.MAX_SAFE_INTEGER)) throw error('BALANCE_LIMIT','余额或职业计数已达上限，尚未交付；请先处理余额');
    d.lastResult={orderId:a.orderId,offerId:a.offerId,phase,reason,reward,receipt:receipt(d,a.orderId)};
    d.closedThrough=a.orderId;d.active=null;
    if (reward) {
      next.money+=reward;next.jobsCompleted=(next.jobsCompleted??0)+1;
      next.transactions=[{label:`外卖 · ${offer.title}`,amount:reward,time:'游戏内结算',receipt:d.lastResult.receipt},...(next.transactions??[])].slice(0,18);
    }
    commit(previous,next);clearCredit();route(d);
    return {ok:true,code:phase.toUpperCase(),orderId:a.orderId,reward,receipt:d.lastResult.receipt};
  };
  const activeFor = (s,id) => {
    const a=s.deliveryCareer.active;
    if (!a || a.orderId!==id) throw error('STALE_ORDER','订单已结束或按钮已过期，请查看当前订单');
    return a;
  };
  const ensureTime = s => {
    if (remaining(s.deliveryCareer.active)>0) return null;
    closeOrder(s,'expired','time-limit');
    return failed('EXPIRED','订单已超时，未发放奖励');
  };
  const api = {
    initialize:() => attempt(() => {
      const s=read(true);
      if (s.deliveryCareer!==undefined) { route(s.deliveryCareer);return {ok:true,code:'READY'}; }
      const next=clone(s);next.deliveryCareer={version:1,lineage:instance,nextOrderId:1,closedThrough:0,active:null,lastResult:null,commitToken:'initializing'};
      commit(s,next);return {ok:true,code:'INITIALIZED'};
    }),
    restore:() => attempt(() => {
      clearCredit();const s=read(),a=s.deliveryCareer.active;
      if (a && a.remainingMs<=0) return closeOrder(s,'expired','time-limit');
      route(s.deliveryCareer);return {ok:true,code:'RESTORED'};
    }),
    accept:offerId => attempt(() => {
      const s=read(),d=s.deliveryCareer,offer=offers.get(offerId),who=actor();
      if (!offer) return failed('UNKNOWN_OFFER','找不到这份外卖订单');
      if (d.active) return failed('ALREADY_ACTIVE','请先完成或取消当前外卖订单');
      if (s.job || who.busy) return failed('HOST_BUSY','请先结束当前工作或行程');
      if (who.paused || who.transitioning) return failed('PAUSED','请继续游戏并完成上下车');
      if (d.nextOrderId>=Number.MAX_SAFE_INTEGER) return failed('LIMIT_REACHED','订单序号已耗尽');
      const next=clone(s),orderId=d.nextOrderId;
      next.deliveryCareer.nextOrderId++;
      next.deliveryCareer.active={orderId,offerId,ownerId:who.playerId,phase:'pickup',remainingMs:offer.budgetMs,budgetMs:offer.budgetMs,reservationSerial:0};
      commit(s,next);clearCredit();route(next.deliveryCareer);return {ok:true,code:'ACCEPTED',orderId};
    }),
    pickup:orderId => attempt(() => {
      const s=read(),a=activeFor(s,orderId),expired=ensureTime(s);if(expired)return expired;
      if(a.phase!=='pickup')return failed('WRONG_PHASE','已经取餐，请送往顾客');
      const ready=interactive(a,actor(),offers.get(a.offerId).pickup);if(!ready.ok)return ready;
      const next=clone(s);next.deliveryCareer.active.phase='delivery';commit(s,next);route(next.deliveryCareer);
      return {ok:true,code:'PICKED_UP',orderId};
    }),
    deliver:orderId => attempt(() => {
      const s=read(),a=activeFor(s,orderId),expired=ensureTime(s);if(expired)return expired;
      if(a.phase!=='delivery')return failed('WRONG_PHASE','请先到店铺取餐');
      const ready=interactive(a,actor(),offers.get(a.offerId).dropoff);if(!ready.ok)return ready;
      return closeOrder(s,'completed','delivered');
    }),
    cancel:orderId => attempt(() => {const s=read();activeFor(s,orderId);return closeOrder(s,'cancelled','player-cancel');}),
    fail:(orderId,reason='player-unavailable') => attempt(() => {
      if(!failureReasons.has(reason))return failed('INVALID_REASON','未知失败原因');
      const s=read();activeFor(s,orderId);return closeOrder(s,'failed',reason);
    }),
    advance:(deltaMs,{paused=false}={}) => attempt(() => {
      if(!Number.isFinite(deltaMs)||deltaMs<0||deltaMs>3600000)return failed('INVALID_DELTA','游戏时间增量无效');
      const s=read(),a=s.deliveryCareer.active;
      if(!a)return {ok:true,code:'IDLE'};
      if(paused||actor().paused||deltaMs===0)return {ok:true,code:'PAUSED'};
      if(deltaMs>=remaining(a))return closeOrder(s,'expired','time-limit');
      if(creditMs<deltaMs){
        const reserve=Math.min(a.remainingMs,Math.ceil((deltaMs-creditMs)/DELIVERY_RULES.reservationMs)*DELIVERY_RULES.reservationMs);
        const next=clone(s),b=next.deliveryCareer.active;
        if(b.reservationSerial>=Number.MAX_SAFE_INTEGER)return failed('LIMIT_REACHED','计时序号已耗尽');
        b.remainingMs-=reserve;b.reservationSerial++;
        commit(s,next);creditMs+=reserve;creditOrder=b.orderId;creditSerial=b.reservationSerial;
      }
      creditMs=Math.max(0,creditMs-deltaMs);
      return {ok:true,code:'ADVANCED'};
    }),
    status:() => attempt(() => {
      const s=read(),d=s.deliveryCareer,a=d.active,who=actor(),offer=offers.get(a?.offerId),target=a?(a.phase==='pickup'?offer.pickup:offer.dropoff):null;
      const ready=a?interactive(a,who,target):failed('NO_ORDER','请先接单');
      const remainingMs=a?remaining(a):0;
      return {ok:true,active:!!a,orderId:a?.orderId??null,phase:a?.phase??d.lastResult?.phase??'idle',phaseLabel:labels[a?.phase??d.lastResult?.phase??'idle'],target:target?clone(target):null,distanceMeters:target?Math.hypot(who.x-target.x,who.z-target.z):null,remainingMs,persistedRemainingMs:a?.remainingMs??0,reward:offer?.reward??0,canInteract:!!a&&remainingMs>0&&ready.ok,interactionReason:remainingMs<=0&&a?'订单已超时':ready.ok?'站定后点击取餐或交付':ready.message,boxVisible:a?.phase==='delivery',money:s.money,lastResult:clone(d.lastResult),lastError};
    }),
    refreshNavigation:() => attempt(() => {const s=read();route(s.deliveryCareer);return {ok:true,code:'NAVIGATED'};})
  };
  return Object.freeze(api);
}
