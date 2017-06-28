/*
PHENOTREND
Trendline of HPO terms over ages
*/

// Require D3
if (!window.d3) { throw "d3 wasn't included!"};
// Require jQuery
if (!window.jQuery) { throw "jquery wasn't included!"};

// d3.phenotrend
d3.phenotrend = function() {
  // PhenoTrend wrapper
  var my = function() {}

  // Initialization
  my.init = function(selector, options) {
    // If no ID, generate one
    options.id = options.id || "phenotrend-"+ defaultId();
    _o = $.extend(_defaultOptions, options);

    //console.log(_o);

    // Store parent
    _parent = d3.select(selector);

    // Create and store element
    _g = _parent.append("g")
      .attr("id", _o.id)
      .attr("class", "phenotrend")
      .attr("transform", translate(_o.x, _o.y))
      ;

    // Create and store underlay
    _l.underlay = _g.append("g")
      .attr("class", "underlay")
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

    // Timeline Background
    _l.underlay.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", _o.w)
      .attr("height", _o.h)
      .style("fill", "#e6e6e6")
      .style("stroke", "#aaa")
      .style("stroke-width", 0.25)
      // .on("mouseover", function() {
      //   // Cancel highlight
      //   _o.highlight(null);
      // })
      // .on("click", function() {
      //   // Cancel selected
      //   _o.selected(null);
      // })
      ;

    // TITLE
    _l.underlay.append("text")
      .attr("x", 2)
      .attr("y", 2)
      .attr("dy", 8)
      .style("fill", "#aaa")
      .style("text-anchor", "start")
      .style("font-size", 10)
      .text(_o.title)
      ;

    //X-axis 
    var yearAx = [];
    for (var j = _o.interval[0], m = _o.interval[1]; j < m; j++) {
      yearAx.push(j);
    }

    // X-axis Year Label
    _l.underlay.append("text")
      .attr("x", (_o.w - _o.m)/2.0)
      .attr("y", _o.h)
      .attr("dy", -4)
      .style("fill", "#aaa")
      .style("text-anchor", "middle")
      .style("font-size", 10)
      .text("YEAR")
      ;

    for (var j = 0, m = yearAx.length; j < m; j++) {
      // X-axis lines
      _l.underlay.append("line")
        .attr("x1", _o.m + axisRangeX() * j/(m-1))
        .attr("x2", _o.m + axisRangeX() * j/(m-1))
        .attr("y1", _o.m)
        .attr("y2", _o.h - 2*_o.m)
        .style("stroke", "#fff")
        .style("stroke-width", (j == m-1) ? 1.5 : 0.5)
        .style("fill", "none")
        ;
      // X-axis ticks
      _l.underlay.append("line")
        .attr("x1", _o.m + axisRangeX() * j/(m-1))
        .attr("x2", _o.m + axisRangeX() * j/(m-1))
        .attr("y1", _o.h - 2*_o.m - _o.t/2.0)
        .attr("y2", _o.h - 2*_o.m + _o.t/2.0)
        .style("stroke", "#fff")
        .style("stroke-width", 1.5)
        .style("fill", "none")
        ;
      // X-axis labels
      _l.underlay.append("text")
        .attr("x", _o.m + axisRangeX() * j/(m-1))
        .attr("y", _o.h - 2*_o.m + _o.t/2.0)
        .attr("dy", 10)
        .style("fill", "#fff")
        .style("text-anchor", "middle")
        .style("font-size", 8)
        .text(yearAx[j])
        ;
    }

    // Y-axis
    var valueAx = _o.axisy.domain();

    // Y-axis Probability Label
    _l.underlay.append("text")
      .attr("x", _o.w - 2*_o.m)
      .attr("y", 0)
      .attr("dy", 10)
      .style("fill", "#aaa")
      .style("text-anchor", "start")
      .style("font-size", 10)
      .text("PROB")
      ;

    for (var j = 0, m = valueAx.length; j < m; j++) {
      // Y-axis lines
      _l.underlay.append("line")
        .attr("x1", _o.m)
        .attr("x2", _o.m + axisRangeX())
        .attr("y1", _o.h - 2*_o.m - axisRangeY() * _o.axisy(valueAx[j]))
        .attr("y2", _o.h - 2*_o.m - axisRangeY() * _o.axisy(valueAx[j]))
        .style("stroke", "#fff")
        .style("stroke-width", (valueAx[j] == 0.0) ? 1.5 : 0.5)
        .style("fill", "none")
        ;
      // Y-axis ticks
      _l.underlay.append("line")
        .attr("x1", _o.w - 2*_o.m - _o.t/2.0)
        .attr("x2", _o.w - 2*_o.m + _o.t/2.0)
        .attr("y1", _o.h - 2*_o.m - axisRangeY() * _o.axisy(valueAx[j]))
        .attr("y2", _o.h - 2*_o.m - axisRangeY() * _o.axisy(valueAx[j]))
        .style("stroke", "#fff")
        .style("stroke-width", 1.5)
        .style("fill", "none")
        ;
      // Y-axis labels
      _l.underlay.append("text")
        .attr("class", "axisy")
        .attr("x", _o.w - 2*_o.m + _o.t/2.0)
        .attr("y", _o.h - 2*_o.m - axisRangeY() * _o.axisy(valueAx[j]))
        .attr("dx", 3)
        .attr("dy", 3)
        .style("fill", "#fff")
        .style("text-anchor", "start")
        .style("font-size", 8)
        .text(valueAx[j].toFixed(4))
        ;
    }

    return my;
  }

  my.draw = function(data, options) {
    // Update draw options
    _o = $.extend(_o, options);

    // Update data cache
    my.updateDataCache(data);

    // Update labels
    var valueAx = _o.axisy.domain();

    _l.underlay.selectAll("text.axisy").remove();
    for (var j = 0, m = valueAx.length; j < m; j++) {
      // Y-axis labels
      _l.underlay.append("text")
        .attr("class", "axisy")
        .attr("x", _o.w - 2*_o.m + _o.t/2.0)
        .attr("y", _o.h - 2*_o.m - axisRangeY() * _o.axisy(valueAx[j]))
        .attr("dx", 3)
        .attr("dy", 3)
        .style("fill", "#fff")
        .style("text-anchor", "start")
        .style("font-size", 8)
        .text(valueAx[j].toFixed(4))
        ;
    }

    // Time series data
    var chartProb = _l.chart.selectAll("path.prob")
      .data(_dataNodes, function(d) { return _o.id + _o.key(d); })
      ;

    chartProb.exit().remove();

    chartProb.enter().append("path")
      .attr("class", "prob")
      //.style("shape-rendering", "geometricPrecision")
      .style("stroke", "#333")
      .style("stroke-width", 1)
      .style("fill", "none")
    .merge(chartProb)
      .attr("d", function(d) { return _o.line(probs(d)); })
    ;

    // Error Area
    var chartError = _l.chart.selectAll("path.error")
      .data(_dataNodes, function(d) { return _o.id + _o.key(d); })
      ;

    chartError.exit().remove();

    chartError.enter().append("path")
      .attr("class", "error")
      //.style("shape-rendering", "geometricPrecision")
      .style("fill-opacity", 0.4)
      .style("stroke", "none")
    .merge(chartError)
      .attr("d", function(d) { return _o.area(errors(d)); })
      //.attr("d", function(d) { return intervalArea(d.data.attr.splits[2].interval)(errors(d)); })
      .style("fill", _o.fill)
    ;

    // Trend line
    var chartTrend = _l.chart.selectAll("path.trend")
      .data(_dataNodes, function(d) { return _o.id + _o.key(d); })
      ;

    chartTrend.exit().remove();

    chartTrend.enter().append("path")
      .attr("class", "trend")
      //.style("shape-rendering", "geometricPrecision")
      .style("stroke-dasharray", "7, 3")
      .style("stroke-width", 1.5)
      .style("fill", "none")
    .merge(chartTrend)
      .attr("d", function(d) { return _o.line(trends(d)); })
      //.attr("d", function(d) { return intervalLine(d.data.attr.splits[2].interval)(trends(d)); })
      .style("stroke", _o.fill)
    ;


    // Split Trend lines
    // var chartSplitTrend = _l.chart.selectAll("path.splittrend")
    //   .data(_dataNodes, function(d) { return _o.id + _o.key(d); })
    //   ;

    // chartSplitTrend.exit().remove();

    // chartSplitTrend.enter().append("path")
    //   .attr("class", "splittrend")
    //   //.style("shape-rendering", "geometricPrecision")
    //   .style("stroke-dasharray", "7, 3")
    //   .style("stroke-width", 1.5)
    //   .style("fill", "none")
    // .merge(chartSplitTrend)
    //   .attr("d", function(d) { return _o.line(splitTrends(d)); })
    //   .style("stroke", "#333")
    // ;


    return my;
  }

  my.updateDataCache = function(data) {
    // Deep copy of data
    _dataNodes = $.extend([], data);

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
        _keyMap[key] = [];
      }
      _keyMap[key].push(node);
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
    return [];
  }

  // Highlight data
  my.highlight = function(hlSet) {
    // Not implemented
    console.warn("PhenoTrend highlight not implemented");
  }

  // Click data
  my.selected = function(selSet) {
    // Not implemented
    console.warn("PhenoTrend click not implemented");
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

  // Default D3 drawing
  var _defaultLine = d3.line()
    .x(function(d,i) { return _o.m + axisRangeX()*i/numPts(); })
    .y(function(d,i) {
      var val = _o.axisy(d);
      if (isNaN(val)) {
        val = 0;
      }
      return _o.h - 2*_o.m - val*axisRangeY();
    })
    .curve(d3.curveLinear);
  
  var _defaultArea = d3.line()
    .x(function(d,i) { return _o.m + axisRangeX()*d[0]/numPts(); })
    .y(function(d,i) { 
      var val = _o.axisy(d[1]);
      if (isNaN(val)) {
        val = 0;
      }
      return _o.h - 2*_o.m - val*axisRangeY();
    })
    .curve(d3.curveLinear);

  var intervalLine = function(interval) {
    return d3.line()
      .x(function(d,i) { return _o.m + axisRangeX()*interval[0]/numPts() + axisRangeX()*i/numPts(); })
      .y(function(d,i) {
        var val = _o.axisy(d);
        if (isNaN(val)) {
          val = 0;
        }
        return _o.h - 2*_o.m - val*axisRangeY();
      })
      .curve(d3.curveLinear);
  }

  var intervalArea = function(interval) {
    return d3.line()
      .x(function(d,i) { return _o.m + axisRangeX()*interval[0]/numPts() + axisRangeX()*d[0]/numPts(); })
      .y(function(d,i) { 
        var val = _o.axisy(d[1]);
        if (isNaN(val)) {
          val = 0;
        }
        return _o.h - 2*_o.m - val*axisRangeY();
      })
      .curve(d3.curveLinear);
  }

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
    "axisy": d3.scaleLinear(),
    "interval": [0,1],
    "line": _defaultLine,
    "area": _defaultArea,
    "fill": _defaultFill,
    "highlight": function(d) { my.highlight([d]); },
    "selected": function(d) { my.selected([d]); },
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
    return _o.w - 3*_o.m;
  }

  function axisRangeY() {
    return _o.h - 3*_o.m;
  }

  function numPts() {
    return _o.interval[1] - _o.interval[0] - 1;
  }

  function probs(d) {
    return d.data.attr.prob;
  }

  function trends(d) {
    var interval = d.data.attr;
    //var interval = d.data.attr.splits[2];

    var probs = interval.prob;
    var slope = interval.trend[0];
    var intercept = interval.trend[1];

    var trend = [];
    for (var j = 0, m = probs.length; j < m; j++) {
      trend.push(intercept + j*slope);
    }

    return trend;
  }

  function splitTrends(i) {
    return function(d) {
      var probs = d.data.attr.splits[i].prob;
      var slope = d.data.attr.splits[i].trend[0];
      var intercept = d.data.attr.splits[i].trend[1];

      var trend = [];
      for (var j = 0, m = probs.length; j < m; j++) {
        trend.push(intercept + j*slope);
      }

      return trend;
    }
  }

  function errors(d) {
    var interval = d.data.attr;
    //var interval = d.data.attr.splits[2];

    var probs = interval.prob;
    var slope = interval.trend[0];
    var intercept = interval.trend[1];
    var error = interval.trend[2];

    var errorArea = [];
    for (var j = 0, m = probs.length; j < m; j++) {
      errorArea.push([j, intercept + j*slope + error]);
    }
    for (var j = probs.length - 1; j >= 0; j--) {
      errorArea.push([j, intercept + j*slope - error]);
    }

    return errorArea;
  }

  return my;
}
