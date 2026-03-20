// GF — Compare Engine: utilidades para modo comparativo "vs Año Anterior"
(function(window){
  'use strict';

  /** Is compare mode active and valid? */
  function cmpActive(){
    return _gfCompare === true && (typeof _year !== 'undefined') && _year > 2025;
  }

  /** Previous year number */
  function cmpPrevYear(){
    return (typeof _year !== 'undefined' ? _year : new Date().getFullYear()) - 1;
  }

  /** Calculate delta between current and previous values.
   *  Returns {pct, dir, label} or null if no meaningful comparison. */
  function cmpDelta(cur, prev){
    cur  = cur  || 0;
    prev = prev || 0;
    if(prev === 0 && cur === 0) return { pct:0, dir:'neutral', label:'—' };
    if(prev === 0) return { pct:100, dir:'up', label:'+∞' };
    var pct = ((cur - prev) / Math.abs(prev)) * 100;
    var dir = pct > 0.5 ? 'up' : pct < -0.5 ? 'down' : 'neutral';
    var sign = pct > 0 ? '+' : '';
    var label = sign + (Math.abs(pct) >= 100 ? Math.round(pct) : pct.toFixed(1)) + '%';
    return { pct: pct, dir: dir, label: label };
  }

  /** HTML badge for delta. invert=true for expenses (down=good).
   *  Returns empty string if compare is not active. */
  function cmpBadge(cur, prev, invert){
    if(!cmpActive()) return '';
    var d = cmpDelta(cur, prev);
    if(!d) return '';
    var cls = d.dir === 'neutral' ? 'dnu'
            : (d.dir === 'up' ? (invert ? 'ddn' : 'dup')
                              : (invert ? 'dup' : 'ddn'));
    var arrow = d.dir === 'up' ? '&#9650;' : d.dir === 'down' ? '&#9660;' : '';
    return ' <span class="'+cls+'" style="font-size:.63rem;padding:1px 6px;border-radius:10px;margin-left:4px">'
         + arrow + ' ' + d.label + '</span>';
  }

  /** Compact badge for table cells (smaller, no margin) */
  function cmpBadgeSm(cur, prev, invert){
    if(!cmpActive()) return '';
    var d = cmpDelta(cur, prev);
    if(!d) return '';
    var cls = d.dir === 'neutral' ? 'dnu'
            : (d.dir === 'up' ? (invert ? 'ddn' : 'dup')
                              : (invert ? 'dup' : 'ddn'));
    var arrow = d.dir === 'up' ? '&#9650;' : d.dir === 'down' ? '&#9660;' : '';
    return '<span class="'+cls+'" style="font-size:.55rem;padding:0 4px;border-radius:8px;white-space:nowrap">'
         + arrow + d.label + '</span>';
  }

  /** Filter S.recs for previous year, specific tipo and entity name.
   *  Returns array of recs. */
  function cmpPrevRecs(tipo, entName){
    if(!cmpActive()) return [];
    var py = cmpPrevYear();
    return (S && S.recs || []).filter(function(r){
      return r.yr == py && (!tipo || r.tipo === tipo) && (!entName || r.ent === entName);
    });
  }

  /** Build a 12-element monthly array from previous year S.recs.
   *  Mirrors the pattern used in pl-engine recsVals(). */
  function cmpPrevVals(tipo, entName, cats, concepts){
    var recs = cmpPrevRecs(tipo, entName);
    if(cats && cats.length){
      recs = recs.filter(function(r){ return cats.indexOf(r.cat) !== -1; });
    }
    if(concepts && concepts.length){
      recs = recs.filter(function(r){ return concepts.indexOf(r.concepto) !== -1; });
    }
    var vals = [0,0,0,0,0,0,0,0,0,0,0,0];
    recs.forEach(function(r){
      if(r.vals){
        for(var i=0; i<12; i++) vals[i] += (r.vals[i]||0);
      }
    });
    return vals;
  }

  /** Previous year Wirebit data from DB (fees or tarjetas) */
  function cmpPrevWBData(prefix){
    if(!cmpActive()) return null;
    return typeof DB !== 'undefined' ? DB.get(prefix + cmpPrevYear()) : null;
  }

  // Expose
  window.cmpActive    = cmpActive;
  window.cmpPrevYear  = cmpPrevYear;
  window.cmpDelta     = cmpDelta;
  window.cmpBadge     = cmpBadge;
  window.cmpBadgeSm   = cmpBadgeSm;
  window.cmpPrevRecs  = cmpPrevRecs;
  window.cmpPrevVals  = cmpPrevVals;
  window.cmpPrevWBData = cmpPrevWBData;

})(window);
