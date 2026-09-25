/* Engine dựng network map + cơ chế scroll theo kiểu UiPath
   (sticky trái + sticky sơ đồ, node sáng dần theo từng bước) */
(function(){
  var ICONS = window.GO4AI_ICONS;
  var LEVELS = window.GO4AI_LEVELS;
  var VB_W = 800;

  function icon(name){
    return '<g class="pn-icon" fill="none" stroke="currentColor" stroke-width="2" '
      + 'stroke-linecap="round" stroke-linejoin="round">' + (ICONS[name]||ICONS.box) + '</g>';
  }
  function esc(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ---------- layout ---------- */
  function layout(level){
    var padX = 20, padTop = 24, rowGap = 120;
    var rows = level.rows;
    rows.forEach(function(row, ri){
      var n = row.items.length;
      var gap = n >= 5 ? 10 : (n === 4 ? 14 : 18);
      var avail = VB_W - padX*2;
      var w, h, vertical = false;
      if(row.hub){ w = Math.min(440, avail); h = 78; }
      else if(n >= 5){ w = (avail - gap*(n-1))/n; h = 82; vertical = true; }
      else if(n === 4){ w = (avail - gap*(n-1))/n; h = 64; }
      else if(n === 1){ w = Math.min(460, avail); h = 68; }
      else { w = Math.min(236, (avail - gap*(n-1))/n); h = 66; }
      var total = n*w + (n-1)*gap;
      var x0 = (VB_W - total)/2;
      var y = padTop + ri*rowGap;
      row.items.forEach(function(it, i){
        it._x = x0 + i*(w+gap); it._y = y; it._w = w; it._h = h;
        it._v = vertical; it._hub = !!row.hub;
      });
      row._y = y; row._h = h;
    });
    var last = rows[rows.length-1];
    return padTop + (rows.length-1)*rowGap + last._h + 28;
  }

  /* ---------- edges ---------- */
  function buildEdges(rows){
    var out = [];
    for(var ri = 0; ri < rows.length-1; ri++){
      var a = rows[ri].items, b = rows[ri+1].items;
      if(a.length === 1 || b.length === 1){
        a.forEach(function(s){ b.forEach(function(t){ out.push({s:s, t:t, row:ri+1}); }); });
      } else if(a.length === b.length){
        a.forEach(function(s, i){ out.push({s:s, t:b[i], row:ri+1}); });
      } else {
        var used = [];
        a.forEach(function(s){
          var best = b[0], bd = Infinity;
          b.forEach(function(t){
            var d = Math.abs((s._x+s._w/2)-(t._x+t._w/2));
            if(d < bd){ bd = d; best = t; }
          });
          out.push({s:s, t:best, row:ri+1}); used.push(best);
        });
        b.forEach(function(t){
          if(used.indexOf(t) !== -1) return;
          var best = a[0], bd = Infinity;
          a.forEach(function(s){
            var d = Math.abs((s._x+s._w/2)-(t._x+t._w/2));
            if(d < bd){ bd = d; best = s; }
          });
          out.push({s:best, t:t, row:ri+1});
        });
      }
    }
    return out;
  }

  function edgePath(s, t){
    var sx = s._x + s._w/2, sy = s._y + s._h;
    var tx = t._x + t._w/2, ty = t._y;
    var my = (sy + ty)/2;
    if(Math.abs(sx - tx) < 1.5) return 'M'+sx.toFixed(1)+' '+sy.toFixed(1)+' L'+tx.toFixed(1)+' '+ty.toFixed(1);
    var r = 10, dir = tx > sx ? 1 : -1;
    return 'M'+sx.toFixed(1)+' '+sy.toFixed(1)
      + ' L'+sx.toFixed(1)+' '+(my-r).toFixed(1)
      + ' Q'+sx.toFixed(1)+' '+my.toFixed(1)+' '+(sx+dir*r).toFixed(1)+' '+my.toFixed(1)
      + ' L'+(tx-dir*r).toFixed(1)+' '+my.toFixed(1)
      + ' Q'+tx.toFixed(1)+' '+my.toFixed(1)+' '+tx.toFixed(1)+' '+(my+r).toFixed(1)
      + ' L'+tx.toFixed(1)+' '+ty.toFixed(1);
  }

  /* ---------- node ---------- */
  function nodeSVG(it, ri){
    var x = it._x, y = it._y, w = it._w, h = it._h;
    var g = '<g class="pnode'+(it._hub ? ' is-hub' : '')+'" data-row="'+ri+'">';
    g += '<rect class="pn-glow" x="'+(x-3)+'" y="'+(y-3)+'" width="'+(w+6)+'" height="'+(h+6)+'" rx="16"/>';
    g += '<rect class="pn-frame" x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="13"/>';

    if(it._v){
      /* Vertical node: 5+ items per row */
      var ts = 32, tx = x + (w - ts)/2, ty = y + 10;
      g += '<rect class="pn-tile" x="'+tx+'" y="'+ty+'" width="'+ts+'" height="'+ts+'" rx="9"/>';
      g += '<g transform="translate('+(tx+6)+' '+(ty+6)+') scale(0.833)">'+icon(it.ic)+'</g>';
      var midX = x + w/2;
      g += '<text class="pn-cat" x="'+midX+'" y="'+(y+56)+'" text-anchor="middle">'+esc(it.cat)+'</text>';
      g += '<text class="pn-title pn-title-sm" x="'+midX+'" y="'+(y+70)+'" text-anchor="middle">'+esc(it.t)+'</text>';
    } else {
      /* Horizontal node */
      var s2 = it._hub ? 38 : 34;
      var tx2 = x + 14, ty2 = y + (h - s2)/2;
      var sc = s2/24 * 0.72;
      g += '<rect class="pn-tile" x="'+tx2+'" y="'+ty2+'" width="'+s2+'" height="'+s2+'" rx="10"/>';
      g += '<g transform="translate('+(tx2 + s2*0.26)+' '+(ty2 + s2*0.26)+') scale('+sc.toFixed(3)+')">'+icon(it.ic)+'</g>';
      var textX = tx2 + s2 + 13;

      if(it._hub){
        g += '<text class="pn-cat" x="'+textX+'" y="'+(y+27)+'">'+esc(it.cat)+'</text>';
        g += '<text class="pn-title pn-title-lg" x="'+textX+'" y="'+(y+48)+'">'+esc(it.t)+'</text>';
        if(it.s) g += '<text class="pn-sub" x="'+textX+'" y="'+(y+64)+'">'+esc(it.s)+'</text>';
        g += '<g class="pn-chip"><rect x="'+(x+w-84)+'" y="'+(y-11)+'" width="74" height="22" rx="11"/>'
           + '<circle cx="'+(x+w-71)+'" cy="'+y+'" r="3.2"/>'
           + '<text x="'+(x+w-62)+'" y="'+(y+4)+'">ĐANG CHẠY</text></g>';
      } else if(it.s){
        g += '<text class="pn-cat" x="'+textX+'" y="'+(y+22)+'">'+esc(it.cat)+'</text>';
        g += '<text class="pn-title" x="'+textX+'" y="'+(y+39)+'">'+esc(it.t)+'</text>';
        g += '<text class="pn-sub" x="'+textX+'" y="'+(y+54)+'">'+esc(it.s)+'</text>';
      } else {
        g += '<text class="pn-cat" x="'+textX+'" y="'+(y+25)+'">'+esc(it.cat)+'</text>';
        g += '<text class="pn-title pn-title-sm" x="'+textX+'" y="'+(y+43)+'">'+esc(it.t)+'</text>';
      }
    }
    g += '</g>';
    return g;
  }

  /* ---------- section ---------- */
  function sectionHTML(lv){
    var H = layout(lv);
    var edges = buildEdges(lv.rows);

    var wires = edges.map(function(e){
      var d = edgePath(e.s, e.t);
      return '<g class="pedge" data-row="'+e.row+'">'
        + '<path class="pe-base" d="'+d+'"/>'
        + '<path class="pe-grow" d="'+d+'"/>'
        + '</g>';
    }).join('');

    var nodes = lv.rows.map(function(row, ri){
      return row.items.map(function(it){ return nodeSVG(it, ri); }).join('');
    }).join('');

    var dots = '<pattern id="dots'+lv.n+'" width="18" height="18" patternUnits="userSpaceOnUse">'
      + '<circle cx="1.5" cy="1.5" r="1.1" fill="currentColor" opacity=".38"/></pattern>'
      + '<rect class="pgrid" x="0" y="0" width="'+VB_W+'" height="'+H+'" fill="url(#dots'+lv.n+')"/>';

    var blurbs = lv.blurbs.map(function(b, i){
      return '<li class="lv-blurb" data-i="'+i+'">'
        + '<span class="lv-blurb-t">'+esc(b.t)+'</span>'
        + '<span class="lv-blurb-d">'+esc(b.d)+'</span></li>';
    }).join('');

    return '<section class="lv" id="level-'+lv.n+'" data-level="'+lv.n+'" '
      + 'data-steps="'+lv.rows.length+'" style="--lc:'+lv.color+'">'
      + '<div class="lv-sticky"><div class="lv-grid">'
        + '<div class="lv-left">'
          + '<span class="lv-num">0'+lv.n+'</span>'
          + '<span class="lv-eyebrow">'+esc(lv.eyebrow)+'</span>'
          + '<h2 class="lv-title">'+esc(lv.title)+'</h2>'
          + '<p class="lv-lead">'+esc(lv.lead)+'</p>'
          + '<p class="lv-desc">'+esc(lv.desc)+'</p>'
          + '<ul class="lv-blurbs">'+blurbs+'</ul>'
          + '<p class="lv-bridge">'+esc(lv.bridge)+'</p>'
        + '</div>'
        + '<div class="lv-right"><div class="lv-diagram">'
          + '<svg viewBox="0 0 '+VB_W+' '+H+'" class="pstage">'+dots+wires+nodes+'</svg>'
        + '</div></div>'
      + '</div></div></section>';
  }

  /* ---------- render ---------- */
  var host = document.getElementById('levels');
  host.innerHTML = LEVELS.map(sectionHTML).join('');

  /* chiều cao section = số bước × 100vh (để pin và bước qua từng stage) */
  var sections = [].slice.call(document.querySelectorAll('.lv'));
  sections.forEach(function(sec){
    var steps = +sec.getAttribute('data-steps');
    sec.style.minHeight = ((steps + 0.55) * 100) + 'vh';
    // đo chiều dài path để animate nét vẽ
    [].forEach.call(sec.querySelectorAll('.pe-grow'), function(p){
      var L = p.getTotalLength();
      p.style.strokeDasharray = L;
      p.style.strokeDashoffset = L;
    });
  });

  /* ---------- rail ---------- */
  var rail = document.getElementById('rail');
  rail.innerHTML = LEVELS.map(function(lv){
    return '<a class="rail-item" href="#level-'+lv.n+'" data-level="'+lv.n+'">'
      + '<span class="rail-dot"></span>'
      + '<span class="rail-num">0'+lv.n+'</span>'
      + '<span class="rail-label">'+lv.step+'</span></a>';
  }).join('');
  var railItems = [].slice.call(rail.querySelectorAll('.rail-item'));

  /* ---------- scroll driver ---------- */
  var isMobile = window.matchMedia('(max-width: 900px)');

  function applyStep(sec, step){
    if(sec._step === step) return;
    sec._step = step;
    [].forEach.call(sec.querySelectorAll('.lv-blurb'), function(li, i){
      li.classList.toggle('is-revealed', i <= step);
      li.classList.toggle('is-current', i === step);
    });
    [].forEach.call(sec.querySelectorAll('.pnode'), function(g){
      var r = +g.getAttribute('data-row');
      g.classList.toggle('is-revealed', r <= step);
      g.classList.toggle('is-active', r === step);
      g.classList.toggle('is-complete', r < step);
    });
    [].forEach.call(sec.querySelectorAll('.pedge'), function(g){
      var r = +g.getAttribute('data-row');
      g.classList.toggle('is-on', r <= step);
    });
  }

  var ticking = false;
  function update(){
    ticking = false;
    var vh = window.innerHeight, mid = vh/2, active = null;

    sections.forEach(function(sec){
      var r = sec.getBoundingClientRect();
      if(r.top <= mid && r.bottom >= mid){ active = sec; }
    });

    sections.forEach(function(sec){
      var L = sec.querySelector('.lv-left'), D = sec.querySelector('.lv-diagram');
      if(!L) return;
      if(!isMobile.matches){
        var r = sec.getBoundingClientRect();
        var pin = sec.querySelector('.lv-sticky');
        var pinR = pin ? pin.getBoundingClientRect() : r;
        var totalH = r.height, stickyH = pinR.height;
        var scrolled = Math.max(0, Math.min(totalH - stickyH, -r.top));
        var steps = +sec.getAttribute('data-steps');
        var stepH = (totalH - stickyH) / steps;
        var step = Math.min(steps - 1, Math.floor(scrolled / stepH));
        applyStep(sec, step);
      } else {
        var r2 = sec.getBoundingClientRect();
        applyStep(sec, r2.top < mid ? (+sec.getAttribute('data-steps') - 1) : 0);
      }
    });

    /* rail highlight */
    railItems.forEach(function(a){
      var lv = +a.getAttribute('data-level');
      a.classList.toggle('is-active', active && +active.getAttribute('data-level') === lv);
    });

    /* window.GO4AI_LEVEL_ACTIVE for fish waypoints */
    window.GO4AI_LEVEL_ACTIVE = active ? +active.getAttribute('data-level') : 0;
  }

  window.addEventListener('scroll', function(){ if(!ticking){ ticking=true; requestAnimationFrame(update); } }, {passive:true});
  update();

  /* flash on section enter */
  var io = typeof IntersectionObserver !== 'undefined' && new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if(e.isIntersecting){ e.target.classList.add('flash'); setTimeout(function(){ e.target.classList.remove('flash'); }, 1200); }
    });
  }, {threshold:.15});
  if(io) sections.forEach(function(sec){ io.observe(sec); });

})();