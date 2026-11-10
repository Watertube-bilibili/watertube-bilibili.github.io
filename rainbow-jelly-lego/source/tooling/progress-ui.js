function renderDownloadProgress(current,total){
 const info=window.toyDownload,bar=document.getElementById('progress'),label=document.getElementById('progress-label'),detail=document.getElementById('loading-detail'),title=document.getElementById('loading-title');
 if(info&&info.source==='raw'){const percent=total>0?Math.min(99,Math.round(current/total*100)):0;bar.value=percent;title.textContent='正在下载兼容版本…';label.textContent=(current/1000000).toFixed(1)+' / '+(total/1000000).toFixed(1)+' MB';detail.textContent='当前浏览器需要使用较大的兼容版本。';return;}
 if(info&&info.cached){
  title.textContent='正在读取缓存…';bar.value=99;label.textContent='已缓存 · 无需重新下载';detail.textContent='引擎文件已保存在这台设备上，正在打开积木盒。';return;
 }
 if(info&&info.done){
  title.textContent='引擎已下载，正在启动…';bar.value=99;label.textContent='正在准备 3D 画面';detail.textContent='下载已经完成，浏览器正在启动游戏。';return;
 }
 if(info&&info.total>0){
  const received=Math.max(0,Number(info.received)||0),size=Number(info.total),speed=Math.max(0,Number(info.speed)||0),percent=Math.min(98,Math.floor(received/size*98));
  title.textContent=received?'正在下载游戏引擎…':'正在连接较快线路…';bar.value=percent;
  const rate=speed>1000000?(speed/1000000).toFixed(1)+' MB/s':speed>1000?Math.round(speed/1000)+' KB/s':'';
  label.textContent=(received/1000000).toFixed(1)+' / '+(size/1000000).toFixed(1)+' MB'+(rate?' · '+rate:'');
  detail.textContent=info.source==='origin'?'正在通过备用线路下载。完成后会优先使用缓存。':'首次打开需要下载引擎，完成后会优先使用缓存。';return;
 }
 if(total>0){const percent=Math.min(99,Math.round(current/total*100));bar.value=percent;label.textContent=percent<99?'下载中 · '+percent+'%':'正在准备 3D 画面';}else label.textContent='正在连接下载线路…';
}
