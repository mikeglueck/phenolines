/*
PHENORANK
Ranked list of phenotypes
*/

// Require D3
if (!window.d3) { throw "d3 wasn't included!"};
// Require jQuery
if (!window.jQuery) { throw "jquery wasn't included!"};

// d3.phenoplot
d3.phenorank = function() {
  // PhenoPlot wrapper
  var my = function() {}

// Initialization
  my.init = function(selector, options) {
    // If no ID, generate one
    options.id = options.id || "phenorank-"+ defaultId();
    _o = $.extend(_defaultOptions, options);

    //console.log(_o);

    // Store parent
    _parent = d3.select(selector);

    // Create and store element
    _g = _parent.append("g")
      .attr("id", _o.id)
      .attr("class", "phenorank")
      .attr("transform", translate(_o.x, _o.y))
      ;

    // Create and store underlay
    _l.underlay = _g.append("g")
      .attr("class", "underlay")
      ;

    // Create and store chart
    _l.chart = _g.append("g")
      .attr("class", "chart")
      .attr("transform", translate(_o.m, _o.m))
      ;

    // Create and store overlay
    _l.overlay = _g.append("g")
      .attr("class", "overlay")
      .style("pointer-events", "none")  // Ignore mouse events on overlay
      ;

    // Background
    _l.underlay.append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", _o.w)
      .attr("height", _o.h)
      // .style("fill", "#e6e6e6")
      // .style("stroke", "#aaa")
      // .style("stroke-width", 0.25)
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

    return my;
  }

  my.draw = function(data, options) {
    // Update draw options
    _o = $.extend(_o, options);

    _data = data.filter(_o.filterFn).slice(0, _o.limit);

    // Scaler for bars
    var maxProb = _o.maxProb;

    // Remove labels
    _l.chart.selectAll("text").remove();
    _l.chart.selectAll("rect").remove();

    // Add details
    var feedback =_l.chart.selectAll("text.pheno")
      //.data(data.slice(0, _o.limit), function(d, i) { return _o.id + i; })
      .data(_data, function(d, i) { return _o.id + i; })
      ;

    feedback.enter().append("text")
      .attr("class", function(d) { return "pheno HP"+ d.data.attr.hpo.substr(3); })
      .attr("transform", function(d, i) { return translate(0, _o.itemH*i); })
      .attr("dy", 7)
      .style("font-size", 7+"pt")
      .style("fill", _o.fill)
      .style("cursor", "pointer")
      .text(function(d) { return truncateLabel(_o.formatLabel(d)); })
      .on("mouseover", function(d) {
        _o.highlight(d);
      })
      .on("click", function(d) {
        _o.selected(d);
      })
      ;

    var currentFillStyle = FILL_STYLE;
    FILL_STYLE = "percprob";

    // Add details
    var bars =_l.chart.selectAll("rect.pheno")
      //.data(data.slice(0, _o.limit), function(d, i) { return _o.id + i; })
      .data(_data, function(d, i) { return _o.id + i; })
      ;

    bars.enter().append("rect")
      .attr("class", function(d) { return "pheno HP"+ d.data.attr.hpo.substr(3); })
      .attr("transform", function(d, i) { return translate(180, _o.itemH*i); })
      .attr("height", 3)
      //.attr("width", function(d) { return d.data.attr.percprob * 20; })
      .attr("width", function(d) { return 40; })
      .style("fill", "#ddd")
      ;

    bars.enter().append("rect")
      .attr("class", function(d) { return "pheno HP"+ d.data.attr.hpo.substr(3); })
      .attr("transform", function(d, i) { return translate(180, _o.itemH*i); })
      .attr("height", 3)
      //.attr("width", function(d) { return d.data.attr.percprob * 20; })
      .attr("width", function(d) { return d.data.attr.maxprob/maxProb * 40; })
      .style("fill", getFill())
      ;

    FILL_STYLE = currentFillStyle;

    return my;
  }

  // Highlight data
  my.highlight = function(d) {
    var selSet = []

    if (d) {
      for (var i = 0, n = _data.length; i < n; i++) {
        if (_data[i].data.attr.hpo == d.data.attr.hpo) {
          selSet.push(i);
          break;
        }
      }
    }

    var arrows = _l.overlay.selectAll("polygon.highlight")
      .data(selSet, function(d,i) { return _o.id + Math.random(); });

    arrows.exit().remove();

    arrows.enter()
      .append('polygon')
        .attr("class", "highlight")
        .attr('points', "0,0 -4,-10  0,-9 4,-10")
        .attr("transform", function(d) { return translate(12, _o.m+d*_o.itemH+_o.itemH/3.0) + " " + rotate(-90); })
        .style("fill", "#fff")
        .style("stroke", "#333")
        .style("stroke-width", 0.5)
        ;
  }

  // Click data
  my.selected = function(d) {
    var selSet = []

    if (d) {
      for (var i = 0, n = _data.length; i < n; i++) {
        if (_data[i].data.attr.hpo == d.data.attr.hpo) {
          selSet.push(i);
          break;
        }
      }
    }

    var arrows = _l.overlay.selectAll("polygon.selected")
      .data(selSet, function(d,i) { return _o.id + Math.random(); });

    arrows.exit().remove();

    arrows.enter()
      .append('polygon')
        .attr("class", "selected")
        .attr('points', "0,0 -4,-10  0,-9 4,-10")
        .attr("transform", function(d) { return translate(12, _o.m+d*_o.itemH+_o.itemH/3.0) + " " + rotate(-90); })
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

  // Default options
  var _defaultOptions = {
    "id": null,
    "x": 0,
    "y": 0,
    "w": 100,
    "h": 100,
    "m": 10,
    "itemH": 12,
    "formatLabel": function(d) { return d.name; },
    "fill": _defaultFill,
    "highlight": function(d) { my.highlight([d]); },
    "selected": function(d) { my.selected([d]); },
    "sort": function(a, b) { return d3.ascending(a.val, b.val); },
    "limit": 10
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

  function truncateLabel(x) {
    var limit = 40;
    if (x.length > limit) {
      return x.substr(0, limit) + "...";
    }
    return x;
  }

  function translate(x, y) {
    return "translate("+ x +" "+ y +")";
  }

  function rotate(a, cx, cy) {
    cx = cx || 0;
    cy = cy || 0;
    return "rotate("+ a +","+ cx +","+ cy +")";
  }

  return my;
}
