/* HTML controls and ES3 let these editions run without Canvas, WebGL or WebAssembly. */
(function () {
  var colors = [
    ['草莓红', '#ca605f'], ['杏子橙', '#db9060'], ['柠檬黄', '#d5b650'],
    ['薄荷绿', '#75aa86'], ['湖水蓝', '#779cbb'], ['葡萄紫', '#a184ac']
  ];
  var projects = {
    'liquid-lab': ['Liquid Lab 掌上模拟器', '打开时钟看本地时间，或切到便签记下灵感。', startPocket],
    'rainbow-jelly-lego': ['彩虹果冻乐高', '选一块颜色，把积木一层层垒起来。最多可以搭十层。', startTower],
    'rainbow-jelly': ['彩虹果冻实验室', '给果冻上色，再把每一块对半切开，观察切面的变化。', startJelly],
    'junior-physics-lab': ['初中理化生实验室', '欧姆定律实验　调节理想电源电压或定值电阻，比较电流表读数。', startCircuit],
    'ridgebound': ['山野之间', '开四驱车到维修站装好绞盘，清开林道，驶向山顶小屋。', window.startIEDriving],
    'sunset-coast': ['SUNRISE COAST', '到码头接上乘客，沿着海岸把他们准时送到灯塔。', window.startIEDriving],
    'neon-coast': ['NEON COAST', '依次穿过三座检查门，在步数用完前驶过终点。', window.startIEDriving]
  };

  function make(parent, tag, label, className) {
    var node = document.createElement(tag);
    if (label) node.appendChild(document.createTextNode(label));
    if (className) node.className = className;
    parent.appendChild(node);
    return node;
  }

  function write(node, label) {
    while (node.firstChild) node.removeChild(node.firstChild);
    node.appendChild(document.createTextNode(label));
  }

  function button(parent, label, activate) {
    var control = make(parent, 'button', label);
    control.onclick = activate;
    return control;
  }

  function select(parent, label, options, id) {
    var caption = make(parent, 'label', label);
    var control = make(parent, 'select');
    var i;
    caption.htmlFor = id;
    control.id = id;
    for (i = 0; i < options.length; i++) {
      control.options[control.options.length] = new Option(options[i][0], options[i][1]);
    }
    return control;
  }

  function startPocket(slug, parent) {
    var toolbar = make(parent, 'div');
    var clockButton = button(toolbar, '时钟', function () { openApp(true); });
    var noteButton = button(toolbar, '便签', function () { openApp(false); });
    var clock = make(parent, 'div', '', 'stage');
    make(clock, 'h2', '本地时间');
    var digits = make(clock, 'p', '', 'clock');
    var date = make(clock, 'p');
    var notes = make(parent, 'div', '', 'stage');
    var noteLabel = make(notes, 'label', '本页便签');
    var field = make(notes, 'textarea');
    noteLabel.htmlFor = field.id = 'note-text';
    make(notes, 'p', '切换时钟后，文字会保留到本次页面关闭或刷新。');
    var timer = null;

    function two(value) { return (value < 10 ? '0' : '') + value; }
    function tick() {
      var now = new Date();
      write(digits, two(now.getHours()) + ':' + two(now.getMinutes()) + ':' + two(now.getSeconds()));
      write(date, now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日');
    }
    function openApp(showClock) {
      clockButton.disabled = showClock;
      noteButton.disabled = !showClock;
      clock.style.display = showClock ? 'block' : 'none';
      notes.style.display = showClock ? 'none' : 'block';
      if (timer !== null) window.clearInterval(timer);
      timer = null;
      if (showClock) {
        tick();
        timer = window.setInterval(tick, 1000);
      } else {
        field.focus();
      }
    }
    openApp(true);
  }

  function startTower(slug, parent) {
    var color = select(make(parent, 'p'), '下一层的颜色', colors, 'brick-color');
    var tray = make(parent, 'div', '', 'stage');
    var tower = make(tray, 'div', '', 'tower');
    var status = make(parent, 'p', '', 'readout');
    var toolbar = make(parent, 'div');
    var add = button(toolbar, '加一层', function () { addBrick(color.value); });
    var remove = button(toolbar, '拆一层', function () {
      if (tower.firstChild) tower.removeChild(tower.firstChild);
      update();
    });
    function addBrick(paint) {
      if (tower.childNodes.length === 10) return;
      var brick = document.createElement('div');
      brick.className = 'brick';
      brick.style.backgroundColor = paint;
      brick.appendChild(document.createTextNode('\u00a0'));
      tower.insertBefore(brick, tower.firstChild);
      update();
    }
    function update() {
      var height = tower.childNodes.length;
      write(status, '当前高度：' + height + ' 层' + (height === 10 ? '，已到顶。' : '。'));
      add.disabled = height >= 10;
      remove.disabled = height === 0;
    }
    addBrick(colors[3][1]);
    addBrick(colors[2][1]);
  }

  function startJelly(slug, parent) {
    var count = 1;
    var color = select(make(parent, 'p'), '果冻颜色', colors, 'jelly-color');
    var tray = make(parent, 'div', '', 'jelly-tray');
    var status = make(parent, 'p', '', 'readout');
    var toolbar = make(parent, 'div');
    var cut = button(toolbar, '对半切开', function () { if (count < 8) count *= 2; render(); });
    var join = button(toolbar, '两两合并', function () { if (count > 1) count /= 2; render(); });
    color.onchange = render;
    function render() {
      var i;
      while (tray.firstChild) tray.removeChild(tray.firstChild);
      var table = make(tray, 'table', '', 'jelly-table');
      var body = make(table, 'tbody');
      var row = make(body, 'tr');
      for (i = 0; i < count; i++) make(row, 'td', '\u00a0').style.backgroundColor = color.value;
      write(status, color.options[color.selectedIndex].text + '果冻，共 ' + count + ' 块。');
      cut.disabled = count === 8;
      join.disabled = count === 1;
    }
    render();
  }

  function startCircuit(slug, parent) {
    var voltage = select(make(parent, 'p'), '电源电压 U', [['1.5 V', '1.5'], ['3 V', '3'], ['4.5 V', '4.5'], ['6 V', '6']], 'voltage');
    var resistance = select(make(parent, 'p'), '定值电阻 R', [['5 Ω', '5'], ['10 Ω', '10'], ['15 Ω', '15'], ['20 Ω', '20']], 'resistance');
    var panel = make(parent, 'div', '', 'stage');
    make(panel, 'h2', '电流表');
    var reading = make(panel, 'p', '', 'readout');
    var gauge = make(panel, 'div', '', 'meter');
    var line = make(gauge, 'div', '\u00a0', 'meter-line');
    make(panel, 'p', '量程 0 至 1.20 A');
    var equation = make(parent, 'p');
    function measure() {
      var amps = Number(voltage.value) / Number(resistance.value);
      // Include a third decimal for readings such as 0.075 A.
      var value = String(Math.round(amps * 1000) / 1000);
      write(reading, value + ' A');
      write(equation, 'I = U / R = ' + voltage.value + ' V / ' + resistance.value + ' Ω = ' + value + ' A');
      line.style.width = Math.round(100 * amps / 1.2) + '%';
    }
    voltage.onchange = resistance.onchange = measure;
    measure();
  }

  var selection = /[?&]project=([a-z0-9-]+)(?:&|$)/.exec(window.location.search);
  if (!selection || !Object.prototype.hasOwnProperty.call(projects, selection[1])) return;
  var slug = selection[1];
  var project = projects[slug];
  document.title = project[0] + ' · IE 兼容版';
  write(document.getElementById('project-title'), project[0]);
  write(document.getElementById('project-intro'), project[1]);
  var full = document.getElementById('full-version');
  full.appendChild(document.createTextNode('  |  '));
  make(full, 'a', '打开完整版').href = '../' + slug + '/?view=modern';
  if (project[2]) project[2](slug, document.getElementById('activity'));
}());
