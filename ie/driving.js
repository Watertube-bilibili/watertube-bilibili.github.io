/* Turn-based driving routes for browsers with a basic HTML DOM. */
(function () {
  var routes = {
    'ridgebound': {
      caption: '四驱越野车 · 雪线林道',
      rows: ['##..#F#', '##.#..#', '#1..2##', '#.##.##', '#S...##'],
      terrain: ['▲', '山岩', '#42604a', '#dfebce'],
      pavement: ['泥路', '#dfd1a8', '#725e46'],
      accent: '#76411e',
      goals: [
        ['1', '站', '维修站', '到维修站装上绞盘。', '绞盘已经装好，开到倒木处清障。'],
        ['2', '木', '倒木', '用绞盘拖走倒木。', '倒木已清走，可以开往山顶小屋。'],
        ['F', '屋', '山顶小屋', '抵达山顶小屋。', '越野车已抵达山顶小屋。']
      ]
    },
    'sunset-coast': {
      caption: '海岸出租车 · 清晨接驳',
      rows: ['~~~..F~', '~~~.~~.', '~1.....', '~.~~.~.', '~S.....'],
      terrain: ['≈', '海面', '#558293', '#e6f7f2'],
      pavement: ['沿海道路', '#f2dbb0', '#866940'],
      accent: '#a14324',
      limit: 16,
      goals: [
        ['1', '港', '客运码头', '先去码头接乘客。', '乘客已上车，请送到灯塔。'],
        ['F', '塔', '灯塔', '在班次结束前把乘客送到灯塔。', '乘客准时到达灯塔。']
      ]
    },
    'neon-coast': {
      caption: '街道赛车 · 霓虹夜巡',
      rows: ['##2...#', '#..##.#', '#1..#3#', '#.#...#', '#S....F'],
      terrain: ['■', '街区', '#332d49', '#a99cb7'],
      pavement: ['夜间赛道', '#52546b', '#e4def8'],
      accent: '#843854',
      limit: 18,
      goals: [
        ['1', 'Ⅰ', '一号门', '穿过一号检查门。', '一号门通过。'],
        ['2', 'Ⅱ', '二号门', '穿过二号检查门。', '二号门通过。'],
        ['3', 'Ⅲ', '三号门', '穿过三号检查门。', '三号门通过。'],
        ['F', '终', '终点', '冲过终点线。', '完赛！三座检查门全部通过。']
      ]
    }
  };

  function node(tag, label) {
    var element = document.createElement(tag);
    if (label) element.appendChild(document.createTextNode(label));
    return element;
  }

  function write(element, text) {
    while (element.firstChild) element.removeChild(element.firstChild);
    element.appendChild(document.createTextNode(text));
  }

  window.startIEDriving = function (slug, container) {
    var route = routes[slug];
    if (!route || !container) return;
    var goals = route.goals;
    var cells = [];
    var startX, startY, x, y, step, turns, finished;
    var row, col, i;

    var map = node('table');
    map.tabIndex = 0;
    map.cellSpacing = 1;
    map.cellPadding = 0;
    map.summary = '车辆和目标的位置。地形格不能通行。';
    map.style.cssText = 'width:100%;max-width:25em;table-layout:fixed;background:#302c2b;text-align:center;';
    map.appendChild(node('caption', route.caption));
    var body = node('tbody');
    map.appendChild(body);
    for (row = 0; row < route.rows.length; row++) {
      cells[row] = [];
      var tr = node('tr');
      body.appendChild(tr);
      for (col = 0; col < route.rows[row].length; col++) {
        var cell = node('td');
        cell.style.cssText = 'height:2em;line-height:2;font-weight:bold;text-align:center;';
        tr.appendChild(cell);
        cells[row][col] = cell;
        if (route.rows[row].charAt(col) === 'S') {
          startX = col;
          startY = row;
        }
      }
    }
    container.appendChild(map);

    var legend = ['车＝你', route.terrain[0] + '＝' + route.terrain[1]];
    for (i = 0; i < goals.length; i++) legend.push(goals[i][1] + '＝' + goals[i][2]);
    container.appendChild(node('p', legend.join('　')));
    container.appendChild(node('p', '点击方向按钮，每次前进一格。焦点在地图或按钮上时，也可用方向键或 WASD 行驶。'));
    var controls = node('div');
    container.appendChild(controls);
    var directions = [
      ['左', -1, 0, 37, 65], ['上', 0, -1, 38, 87],
      ['下', 0, 1, 40, 83], ['右', 1, 0, 39, 68]
    ];

    function addButton(label, click) {
      var button = node('button', label);
      button.type = 'button';
      button.style.cssText = 'font-size:100%;padding:0.2em 0.55em;margin:0 0.25em 0.4em 0;';
      button.onclick = click;
      controls.appendChild(button);
    }

    function addDirection(direction) {
      addButton(direction[0], function () { move(direction[1], direction[2]); });
    }

    for (i = 0; i < directions.length; i++) addDirection(directions[i]);
    addButton('重新出发', reset);
    var log = node('p');
    log.setAttribute('role', 'status');
    container.appendChild(log);

    function paint(cx, cy) {
      var tile = route.rows[cy].charAt(cx);
      var cell = cells[cy][cx];
      var glyph = '·';
      var title = route.pavement[0];
      var background = route.pavement[1];
      var ink = route.pavement[2];
      if (tile === '#' || tile === '~') {
        glyph = route.terrain[0];
        title = route.terrain[1];
        background = route.terrain[2];
        ink = route.terrain[3];
      }
      for (var n = step; n < goals.length; n++) {
        if (tile === goals[n][0]) {
          glyph = goals[n][1];
          title = goals[n][2];
          background = '#fff1c6';
          ink = '#553322';
        }
      }
      if (cx === x && cy === y) {
        glyph = '车';
        title = '你的车';
        background = route.accent;
        ink = '#ffffff';
      }
      cell.title = title;
      cell.style.backgroundColor = background;
      cell.style.color = ink;
      write(cell, glyph);
    }

    function report(message) {
      var progress = '第' + (y + 1) + '行，第' + (x + 1) + '列。已行驶 ' + turns + ' 格。';
      if (!finished && route.limit) progress += '剩余 ' + (route.limit - turns) + ' 格。';
      if (!finished) progress += '目标：' + goals[step][3];
      write(log, (message ? message + ' ' : '') + progress);
    }

    function reset() {
      x = startX;
      y = startY;
      step = 0;
      turns = 0;
      finished = false;
      for (var cy = 0; cy < cells.length; cy++) {
        for (var cx = 0; cx < cells[cy].length; cx++) paint(cx, cy);
      }
      report('');
    }

    function move(dx, dy) {
      if (finished) return;
      var nx = x + dx;
      var ny = y + dy;
      var line = route.rows[ny];
      var tile = line && line.charAt(nx);
      if (!tile || tile === '#' || tile === '~') {
        report('前方无法通行。');
        return;
      }
      if (slug === 'ridgebound' && tile === '2' && step === 0) {
        report('倒木挡住了去路，先去维修站。');
        return;
      }
      var previousX = x;
      var previousY = y;
      x = nx;
      y = ny;
      turns++;
      var message = '';
      if (tile === goals[step][0]) {
        message = goals[step][4];
        step++;
        finished = step === goals.length;
      }
      if (!finished && turns === route.limit) {
        message = slug === 'sunset-coast' ? '本班次结束了，可以重新出发。' : '赛段步数已用完，可以重新出发。';
        finished = true;
      }
      paint(previousX, previousY);
      paint(x, y);
      report(message);
    }

    map.onclick = function () { map.focus(); };
    container.onkeydown = function (event) {
      event = event || window.event;
      if (event.ctrlKey || event.altKey || event.shiftKey || event.metaKey) return;
      for (var n = 0; n < directions.length; n++) {
        var d = directions[n];
        if (event.keyCode === d[3] || event.keyCode === d[4]) {
          move(d[1], d[2]);
          event.returnValue = false;
          if (event.preventDefault) event.preventDefault();
          return false;
        }
      }
    };
    reset();
  };
})();
