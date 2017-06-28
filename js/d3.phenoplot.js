/*
PHENOPLOT
Radial hierarchy plots of HPO subgraphs
*/

// Require D3
if (!window.d3) { throw "d3 wasn't included!"};
// Require jQuery
if (!window.jQuery) { throw "jquery wasn't included!"};

// d3.phenoplot
d3.phenoplot = function() {
  // PhenoPlot wrapper
  var my = function() {}

  // Initialization
  my.init = function(selector, options) {
    // If no ID, generate one
    options.id = options.id || "phenoplot-"+ defaultId();
    _o = $.extend(_defaultOptions, options);

    //console.log(_o);

    // Set drawing scales
    my.drawScaleX = d3.scaleLinear().range([0, 2 * Math.PI]);
    my.drawScaleY = d3.scaleSqrt().range([0, (_o.r - _o.m)]);

    my.drawArc = d3.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, my.drawScaleX(d.x0))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, my.drawScaleX(d.x1))); })
      .innerRadius(function(d) { return Math.max(0, my.drawScaleY(d.y0)); })
      .outerRadius(function(d) { return Math.max(0, my.drawScaleY(d.y1)); })
      ;
    // TODO: this is no longer needed -- arc.centroid() function exists now
    my.drawArcCenter = d3.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, my.drawScaleX(d.x0 + (d.x1-d.x0)/2.0))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, my.drawScaleX(d.x0 + (d.x1-d.x0)/2.0))); })
      .innerRadius(function(d) { return Math.max(0, my.drawScaleY(d.y0 + (d.y1-d.y0)/2.0)); })
      .outerRadius(function(d) { return Math.max(0, my.drawScaleY(d.y0 + (d.y1-d.y0)/2.0)); })
      ;
    my.drawArcEdge = d3.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, my.drawScaleX(d.x0 + (d.x1-d.x0)/2.0))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, my.drawScaleX(d.x0 + (d.x1-d.x0)/2.0))); })
      .innerRadius(function(d) { return Math.max(0, my.drawScaleY(d.y1)); })
      .outerRadius(function(d) { return Math.max(0, my.drawScaleY(d.y1)); })
      ;
    my.drawArcRegion = d3.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, my.drawScaleX(d.x0))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, my.drawScaleX(d.x1))); })
      .innerRadius(function(d) { return Math.max(0, my.drawScaleY(d.y0)); })
      .outerRadius(function(d) { return Math.max(0, my.drawScaleY(1.0) + _o.m-2); })
      ;
    my.drawArcIcon = d3.arc()
      .startAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, my.drawScaleX(d.x0 + (d.x1-d.x0)/2.0))); })
      .endAngle(function(d) { return Math.max(0, Math.min(2 * Math.PI, my.drawScaleX(d.x0 + (d.x1-d.x0)/2.0))); })
      .innerRadius(function(d) {
        var offset = -8;
        if (d.x1 - d.x0 < 0.005) {
          offset = 6;
        }
        return Math.max(0, my.drawScaleY(1.0) + _o.m + offset);
      })
      .outerRadius(function(d) { 
        var offset = -8;
        if (d.x1 - d.x0 < 0.005) {
          offset = 6;
        }
        return Math.max(0, my.drawScaleY(1.0) + _o.m + offset);
      })
      ;

    // Store parent
    _parent = d3.select(selector);

    // Create and store element
    _g = _parent.append("g")
      .attr("id", _o.id)
      .attr("class", "phenoplot")
      .attr("transform", translate(_o.x + _o.r, _o.y + _o.r))
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
    _l.regions = _g.append("g")
      .attr("class", "regions")
      ;

    // Create and store overlay
    _l.overlay = _g.append("g")
      .attr("class", "overlay")
      .style("pointer-events", "none")  // Ignore mouse events on overlay
      ;

    // Background
    _l.underlay.append("rect")
      .attr("x", -_o.r-_o.m)
      .attr("y", -_o.r-_o.m)
      .attr("width", 2*(_o.r+_o.m))
      .attr("height", 2*(_o.r+_o.m))
      .style("fill", "#eee")
      .style("stroke", "none")
      .on("mouseover", function() {
        // Cancel highlight
        _o.highlight(null);
      })
      .on("click", function() {
        // Cancel selected
        _o.selected(null);
      })
      ;

    _l.underlay.append("circle")
      .attr("cx", 0)
      .attr("cy", 0)
      .attr("r", _o.r)
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

    // TODO: Cache selections???
    // -- original selection differs from the post data selection
    // Also don't seem to be able to get the NodeList of paths from the selection after drawing...
    // Right now it adds and does not remove the existing paths -- so it isn't joining correctly
    // if (!("chart" in _s)) {
    //   _s["chart"] = _l.chart.selectAll("path");
    // }
    // var chart = _s.chart.data(_dataNodes.sort(_o.sort), function(d) { return _o.id + _o.key(d); });

    // Regions
    var regionNodes = _dataNodes.filter(function(d) { return d.depth == 1; });
    var regions = _l.regions.selectAll("path.region")
      .data(regionNodes, function(d) { return _o.id + _o.key(d); })
      ;

    regions.exit()
      .remove();

    regions.enter().append("path")
      .attr("class", "region")
      .style("fill", "none")
      .style("stroke", "#fff")
      .style("stroke-width", 0.5)
      .style("pointer-events", "none")
    .merge(regions)
      .attr("d", my.drawArcRegion)
      ;

    // Icons
    var iconNodes = regionNodes;
    if (_o.icons === null) {
      iconNodes = [];
    }
    var iconSize = 10;
    var icons = _l.regions.selectAll('text.icon')
      .data(iconNodes, function(d) { return "phenoicon"+ _o.key(d); });

    icons.exit()
      .remove();

    icons.enter().append("text")
      .attr("class", 'icon')
      .attr("title", function(d) { return d.data.attr.name; })
      .attr("dx", -(iconSize/2.0) - 0.5)
      .attr("dy", (iconSize/2.0))
      .style("font-size", iconSize+"px")
      .style("font-family", "PhenoIcons")
      .style("fill", "#aaa")
      .style("cursor", "pointer")
      .text(function(d) { return (_o.icons) ? _o.icons.letterFromHP(d.data.id, "fill") : ""; })
      .on("mouseover", function(d) {
        _o.highlight(d);
      })
      .on("click", function(d) {
        _o.selected(d);
      })
    .merge(icons)
      .attr("transform", transformIcon)
      ;

    // Radial Chart
    var chart = _l.chart.selectAll("path")
      .data(_dataNodes.sort(_o.sort), function(d) { return _o.id + _o.key(d); })
      ;

    chart.exit()
      // .transition()
      //   .duration(500)
      //   .style("fill", "red")
      .remove();

    chart.enter().append("path")
      //.attr("d", my.drawArc)
      .attr("class", function(d) { return d.data.id; })
      //.style("fill", _o.fill)
      .style("stroke", "#fff")
      .style("stroke-width", 0.25)
      .style("cursor", "pointer")
      .on("mouseover", function(d) {
        _o.highlight(d);
      })
      .on("click", function(d) {
        console.log(d);
        _o.selected(d);
      })
    .merge(chart)
      .attr("d", my.drawArc)
      .style("fill", _o.fill)
      ;

    //_s["chart"] = _l.chart.selectAll("path");
    //console.log(_l.chart.selectAll("path"), chart.enter().nodes());

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

    hlAnc = [];
    if (ancestors) {
      for (var i = 0, n = hlSet.length; i < n; i++) {
        var node = hlSet[i].parent;
        while (node) {
          hlAnc.push(node);
          node = node.parent;
        }
      }
    }
    
    var strokes = _l.overlay.selectAll("path.highlight")
      .data(hlSet.concat(hlAnc), function(d) { return _o.id + _o.key(d); });

    strokes.exit().remove();
    
    strokes.enter()
      .append("path")
        .attr("class", "highlight")
        .attr("d", my.drawArc)
        .style("fill", "none")
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

    var strokes = _l.overlay.selectAll("path.selected")
      .data(selSet, function(d) { return _o.id + _o.key(d); });

    strokes.exit().remove();
    
    strokes.enter()
      .append("path")
        .attr("class", "selected")
        .attr("d", my.drawArc)
        .style("fill", "none")
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

  // Default options
  var _defaultOptions = {
    "id": null,
    "key": _defaultKey,
    "hpoId": _defaultHpoId,
    "x": 0,
    "y": 0,
    "r": 100,
    "m": 5,
    "fill": _defaultFill,
    "highlight": function(d) { my.highlight([d]); },
    "selected": function(d) { my.selected([d]); },
    "sort": function(a, b) { return d3.ascending(_o.valx(a), _o.valx(b)); },
    "icons": null
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

  // Selection cache
  // var _s = {};

  // Data
  var _data = null;
  var _dataNodes = null;
  var _hpoIdMap = null;
  var _keyMap = null;

  function translate(x, y) {
    return "translate("+ x +" "+ y +")";
  }

  function rotate(a) {
    return "rotate("+ a +")";
  }

  function transformArrow(d) {
    //var a = my.drawArcEdge(d).split(" ")[6].split(",");
    //return translate(parseFloat(a[0]), parseFloat(a[1])) +" "+ rotate((d.x0+d.x1/2.0)*57.2958);   // Convert to degrees from radians
    //var a = my.drawArc.centroid(d);
    var a = my.drawArcEdge(d).split("L").slice(-1)[0].split(",").map(parseFloat);
    return translate(a[0], a[1]) +" "+ rotate(my.drawScaleX(d.x0+(d.x1-d.x0)/2.0)*57.2958);  // Convert to degrees from radians
  }

  function transformIcon(d) {
    var a = my.drawArcIcon(d).split("L").slice(-1)[0].split(",").map(parseFloat);
    return translate(a[0], a[1]);
  }


  return my;
}
