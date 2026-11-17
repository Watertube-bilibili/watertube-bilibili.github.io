/* Loaded synchronously, before the desktop homepage scripts. Keep ES3 syntax for IE6. */
(function () {
  var ua = window.navigator.userAgent;
  if (!(document.documentMode || /MSIE\s|Trident\//i.test(ua)) || /Opera|OPR\/|Edge\//i.test(ua)) {
    return;
  }
  window.watertubeIE = true;

  // An entry in a project subdirectory can specify its own relative compatibility URL.
  var scripts = document.getElementsByTagName('script');
  var entry = scripts[scripts.length - 1];
  var target = entry.getAttribute('data-ie-target') ||
    (/(^|\/)projects\.html$/i.test(window.location.pathname) ? './ie/projects.html' : './ie/index.html');
  var cookieName = 'watertube_ie_view';

  function remember(view) {
    try {
      document.cookie = cookieName + '=' + view + '; path=/';
    } catch (error) { /* The choice still works when cookies are blocked. */ }
  }

  if (/[?&](?:view=(?:modern|classic)|edition=modern)(?:&|$)/i.test(window.location.search)) {
    remember('desktop');
    return;
  }

  var choice = null;
  try {
    choice = /(?:^|;\s*)watertube_ie_view=(desktop|ie)(?:;|$)/.exec(document.cookie);
  } catch (error) { /* Ask without remembering. */ }
  if (choice && choice[1] === 'desktop') return;
  if (!choice) {
    var accepted = window.confirm('个人主页已改版。检测到您正在使用 Internet Explorer。\n\n点击“确定”进入 IE 兼容版，查看个人主页和项目。点击“取消”留在当前页面。');
    remember(accepted ? 'ie' : 'desktop');
    if (!accepted) return;
  }
  window.watertubeIERedirect = true;
  window.location.replace(target);
}());
