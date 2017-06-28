/*
PHENOSCATTER
Scatterplot of HPO terms to compare attributes
*/

// Require D3
if (!window.d3) { throw "d3 wasn't included!"};
// Require jQuery
if (!window.jQuery) { throw "jquery wasn't included!"};

// d3.phenoscatter
d3.phenoscatter = function() {
  // PhenoScatter wrapper
  var my = function() {}

  // Initialization
  my.init = function(selector, options) {
    // If no ID, generate one
    options.id = options.id || "phenoscatter-"+ defaultId();
    _o = $.extend(_defaultOptions, options);

    //console.log(_o);

    // Store parent
    _parent = d3.select(selector);

    // Create and store element
    _g = _parent.append("g")
      .attr("id", _o.id)
      .attr("class", "phenoscatter")
      .attr("transform", translate(_o.x, _o.y))
      ;

    // Create and store underlay
    _l.underlay = _g.append("g")
      .attr("class", "underlay")
      ;

    // Create and store axes
    _l.axes = _g.append("g")
      .attr("class", "axes")
      .style("pointer-events", "none")
      ;

    // Create and store chart
    _l.chart = _g.append("g")
      .attr("class", "chart")
      ;

    // Create and store overlay
    _l.overlay = _g.append("g")
      .attr("class", "overlay")
      .style("pointer-events", "none")  // Ignore mouse events on overlay
      ;

    // Scatterplot Background
    _l.underlay.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", _o.w)
      .attr("height", _o.h)
      .style("fill", "#e6e6e6")
      .style("stroke", "#aaa")
      .style("stroke-width", 0.25)
      .on("mouseover", function() {
        // Cancel highlight
        _o.highlight(null);
      })
      .on("click", function() {
        // Cancel selected
        _o.selected(null);
      })
      ;

    return my;
  }

  my.draw = function(data, options) {
    // Update draw options
    _o = $.extend(_o, options);

    // Update data cache
    my.updateDataCache(data);

    // Clear overlay layers
    _l.overlay.selectAll("*").remove();

    // Draw only unique nodes
    uniqueNodes = getUniqueInObjectArray(_dataNodes, 
      function(d) { return d.data.attr.hpo; },
      function(a, b) { return d3.ascending(a.data.attr.hpo, b.data.attr.hpo) || d3.ascending(a.data.uuid, b.data.uuid); }
      ).filter(function(d) { return _o.filterEmpty(_o.labely, d); });

    // Update labels
    _l.axes.selectAll("*").remove();

    // X-axis

    // X-axis Trend Label
    _l.axes.append("text")
      .attr("class", "phenoscatter-label-x")
      .attr("x", _o.w/2.0)
      .attr("y", _o.h)
      .attr("dy", -4)
      .style("fill", "#aaa")
      .style("text-anchor", "middle")
      .style("font-size", 10)
      .text(_o.labelx)
      ;

    for (var j = 0, m = _o.tickx.length; j < m; j++) {
      // X-axis lines
      _l.axes.append("line")
        .attr("x1", _o.m + axisRangeX() * _o.axisx(_o.tickx[j]))
        .attr("x2", _o.m + axisRangeX() * _o.axisx(_o.tickx[j]))
        .attr("y1", _o.m)
        .attr("y2", _o.h - 2*_o.m)
        .style("stroke", "#fff")
        .style("stroke-width", (_o.tickx[j] == 0.0) ? 1.5 : 0.5)
        .style("fill", "none")
        ;
      // X-axis ticks
      _l.axes.append("line")
        .attr("x1", _o.m + axisRangeX() * _o.axisx(_o.tickx[j]))
        .attr("x2", _o.m + axisRangeX() * _o.axisx(_o.tickx[j]))
        .attr("y1", _o.h - 2*_o.m - _o.t/2.0)
        .attr("y2", _o.h - 2*_o.m + _o.t/2.0)
        .style("stroke", "#fff")
        .style("stroke-width", 1.5)
        .style("fill", "none")
        ;
      // X-axis labels
      _l.axes.append("text")
        .attr("x", _o.m + axisRangeX() * _o.axisx(_o.tickx[j]))
        .attr("y", _o.h - 2*_o.m + _o.t/2.0)
        .attr("dy", 10)
        .style("fill", "#fff")
        .style("text-anchor", "middle")
        .style("font-size", 8)
        .text(_o.tickx[j])
        ;
    }

    // Y-axis

    // Y-axis Probability Label
    var offsetX = (_o.axisyalign == "center") ? _o.w/2.0 : _o.m;

    _l.axes.append("text")
      .attr("class", "phenoscatter-label-y")
      .attr("x", offsetX)
      .attr("y", 0)
      .attr("dy", 10)
      .style("fill", "#aaa")
      .style("text-anchor", "start")
      .style("font-size", 10)
      .text(_o.labely)
      ;

    for (var j = 0, m = _o.ticky.length; j < m; j++) {
      // Y-axis lines
      _l.axes.append("line")
        .attr("x1", _o.m)
        .attr("x2", _o.m + axisRangeX())
        .attr("y1", _o.h - 2*_o.m - axisRangeY() * _o.axisy(_o.ticky[j]))
        .attr("y2", _o.h - 2*_o.m - axisRangeY() * _o.axisy(_o.ticky[j]))
        .style("stroke", "#fff")
        .style("stroke-width", (_o.ticky[j] == 0.0) ? 1.5 : 0.5)
        .style("fill", "none")
        ;
      // Y-axis ticks
      _l.axes.append("line")
        .attr("x1", offsetX - _o.t/2.0)
        .attr("x2", offsetX + _o.t/2.0)
        .attr("y1", _o.h - 2*_o.m - axisRangeY() * _o.axisy(_o.ticky[j]))
        .attr("y2", _o.h - 2*_o.m - axisRangeY() * _o.axisy(_o.ticky[j]))
        .style("stroke", "#fff")
        .style("stroke-width", 1.5)
        .style("fill", "none")
        ;
      // Y-axis labels
      _l.axes.append("text")
        .attr("x", offsetX + _o.t/2.0)
        .attr("y", _o.h - 2*_o.m - axisRangeY() * _o.axisy(_o.ticky[j]))
        .attr("dx", 3)
        .attr("dy", 3)
        .style("fill", "#fff")
        .style("text-anchor", "start")
        .style("font-size", 8)
        .text(_o.formatTickY(_o.labely, _o.ticky[j]))
        ;
    }


    // Draw chart
    var chart = _l.chart.selectAll("circle")
      .data(uniqueNodes.sort(_o.sort), function(d) { return _o.id + _o.hpoId(d); })
      ;

    chart.exit()
      .style("display", "none")
      ;

    chart.enter().append("circle")
      //.attr("cx", posX)
      //.attr("cy", posY)
      .attr("r", _o.r)
      //.style("fill", _o.fill)
      .style("stroke", "#fff")
      .style("stroke-width", 0.25)
      .style("cursor", "pointer")
      .on("mouseover", function(d) {
        _o.highlight(d);
      })
      .on("click", function(d) {
        _o.selected(d);
      })
    .merge(chart)
      .attr("cx", posX)
      .attr("cy", posY)
      .style("fill", _o.fill)
      .style("display", null)
      ;

    return my;
  }

  my.updateDataCache = function(data) {
    // Deep copy of data
    //_data = $.extend(true, {}, data);

    // Compute layout and return list of nodes
    //_dataNodes = _o.partition(_data);
    _dataNodes = data;

    // Compute map of hpo id to nodes (one or more)
    _hpoIdMap = {};
    _keyMap = {};
    for (var i = 0, n = _dataNodes.length; i < n; i++) {
      var node = _dataNodes[i];

      var hpoId = _o.hpoId(node);
      if (!(hpoId in _hpoIdMap)) {
        _hpoIdMap[hpoId] = [];
      }
      _hpoIdMap[hpoId].push(node);

      var key = _o.key(node);
      if (!(key in _keyMap)) {
        _keyMap[key] = node;
      } else {
        console.warn("Warning: duplicated UUID")
      }
    }
  }

  my.nodesFromHpoId = function(hpoId) {
    if (hpoId in _hpoIdMap) {
      return _hpoIdMap[hpoId];
    }
    return [];
  }

  my.nodeFromKey = function(key) {
    if (key in _keyMap) {
      return _keyMap[key];
    }
    return null;
  }

  // Highlight data
  my.highlight = function(hlSet, ancestors) {
    hlSet = hlSet || [];  // Empty list if null
    hlAnc = []
    if (ancestors) {
      for (var i = 0, n = hlSet.length; i < n; i++) {
        var node = hlSet[i].parent;
        while (node) {
          hlAnc.push(node);
          node = node.parent;
        }
      }
    }

    var strokes = _l.overlay.selectAll("circle.highlight")
      .data(hlSet.concat(hlAnc), function(d) { return _o.id + _o.key(d); });

    strokes.exit().remove();
    
    strokes.enter()
      .append("circle")
        .attr("class", "highlight")
        .attr("cx", posX)
        .attr("cy", posY)
        .attr("r", _o.r)
        //.style("fill", "none")
        .style("fill", _o.fill)
        .style("stroke", "#fff")
        .style("stroke-width", 2.0)
        ;

    var arrows = _l.overlay.selectAll("polygon.highlight")
      .data(hlSet, function(d) { return _o.id + _o.key(d); });

    arrows.exit().remove();

    arrows.enter()
      .append('polygon')
        .attr("class", "highlight")
        .attr('points', "0,0 -4,-10  0,-9 4,-10")
        .attr("transform", transformArrow)
        .style("fill", "#fff")
        .style("stroke", "#333")
        .style("stroke-width", 0.5)
        ;
  }

  // Select data
  my.selected = function(selSet) {
    selSet = selSet || [];

    var strokes = _l.overlay.selectAll("circle.selected")
      .data(selSet, function(d) { return _o.id + _o.key(d); });

    strokes.exit().remove();
    
    strokes.enter()
      .append("circle")
        .attr("class", "selected")
        .attr("cx", posX)
        .attr("cy", posY)
        .attr("r", _o.r)
        //.style("fill", "none")
        .style("fill", _o.fill)
        .style("stroke", "#333")
        .style("stroke-width", 1.5)
        ;

    var arrows = _l.overlay.selectAll("polygon.selected")
      .data(selSet, function(d) { return _o.id + _o.key(d); });

    arrows.exit().remove();

    arrows.enter()
      .append('polygon')
        .attr("class", "selected")
        .attr('points', "0,0 -4,-10  0,-9 4,-10")
        .attr("transform", transformArrow)
        .style("fill", "#333")
        .style("stroke", "none")
        ;
  }

  // Default fill function
  var _defaultFill = function(d) {
    return "#999";
  }

  // Generate a default ID
  // TODO: make UUID more robust
  function _defaultId() {
    return Math.floor(1000 * Math.random());
  }

  var _defaultKey = function(d) {
    return d.data.uuid;
  }

  var _defaultHpoId = function(d) {
    return d.data.attr.hpo;
  }

  // Default D3 Partition
  // var _defaultPartition = d3.partition()
  //   .size([2 * Math.PI, 100*100]) //_o.r * _o.r])   // TODO: radius is not available when this is defined.
  //   .value(function(d) { return 1;} )
  //   ;

  // Default options
  var _defaultOptions = {
    "id": null,
    "key": _defaultKey,
    "hpoId": _defaultHpoId,
    "x": 0,
    "y": 0,
    "w": 100,
    "h": 100,
    "m": 10,
    "t": 5,
    "r": 3.0,
    "axisx": d3.scaleLinear(),
    "axisy": d3.scaleLinear(),
    "valx": function(d) { return d.val1; },
    "valy": function(d) { return d.val2; },
    "labelx": "TREND",
    "labely": "PROB",
    "tickx": [0.0, 0.5, 1.0],
    "ticky": [0.0, 0.5, 1.0],
    //"partition": _defaultPartition,
    "fill": _defaultFill,
    "highlight": function(d) { my.highlight([d]); },
    "selected": function(d) { my.selected([d]); },
    "sort": function(a, b) { return d3.ascending(_o.valx(a), _o.valx(b)); }
  };

  // Custom options
  var _o = {};

  // Parent and Element
  var _parent = null;
  var _g = null;

  // Layers
  var _l = {
    "underlay": null,
    "chart": null,
    "overlay": null
  }

  // Data
  var _data = null;
  var _dataNodes = null;
  var _hpoIdMap = null;
  var _keyMap = null;

  function translate(x, y) {
    return "translate("+ x +" "+ y +")";
  }

  function axisRangeX() {
    return _o.w - 2*_o.m;
  }

  function axisRangeY() {
    return _o.h - 3*_o.m;
  }

  function posX(d) {
    return _o.m + axisRangeX() * _o.axisx( _o.valx(d) );
  }

  function posY(d) {
    return _o.h - 2*_o.m - axisRangeY() * _o.axisy( _o.valy(d) );
  }

  function transformArrow(d) {
    var x = posX(d);
    var y = posY(d) - _o.r;
    return translate(x, y);
  }

  return my;
}
