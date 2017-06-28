/*
PHENOLEGEND
Interactive legend of dual scale
*/

// Require D3
if (!window.d3) { throw "d3 wasn't included!"};
// Require jQuery
if (!window.jQuery) { throw "jquery wasn't included!"};

// d3.phenoplot
d3.phenolegend = function() {
  // PhenoPlot wrapper
  var my = function() {}

// Initialization
  my.init = function(selector, options) {
    // If no ID, generate one
    options.id = options.id || "phenolegend-"+ defaultId();
    _o = $.extend(_defaultOptions, options);

    //console.log(_o);

    // Store parent
    _parent = d3.select(selector);

    // Create and store element
    _g = _parent.append("g")
      .attr("id", _o.id)
      .attr("class", "phenolegend")
      .attr("transform", translate(_o.x, _o.y))
      ;

    // Create and store underlay
    _l.underlay = _g.append("g")
      .attr("class", "underlay")
      ;

    // Create and store chart
    _l.chart = _g.append("g")
      .attr("class", "chart")
      .attr("transform", translate(0, 0))
      ;

    // Create and store overlay
    _l.overlay = _g.append("g")
      .attr("class", "overlay")
      .style("pointer-events", "none")  // Ignore mouse events on overlay
      ;

    // // Trend Labels
    // _l.underlay.append("text")
    //   .attr("x", (_o.w - _o.m) / 2.0)
    //   .attr("y", 0.0)
    //   .attr("dy", 10)
    //   .style("fill", "#aaa")
    //   .style("text-anchor", "middle")
    //   .style("font-size", 10)
    //   .text("TREND")
    //   ;

    // _l.underlay.append("text")
    //   .attr("x", (_o.w - _o.m) / 2.0)
    //   .attr("y", 0.0)
    //   .attr("dy", 18)
    //   .style("fill", "#aaa")
    //   .style("text-anchor", "middle")
    //   .style("font-size", 8)
    //   .text("0")
    //   ;

    // _l.underlay.append("text")
    //   .attr("x", 0.0)
    //   .attr("y", 0.0)
    //   .attr("dy", 18)
    //   .style("fill", "#aaa")
    //   .style("text-anchor", "start")
    //   .style("font-size", 8)
    //   .text(LOG_SCALE_EXTENTS_TREND[0])
    //   ;

    // _l.underlay.append("text")
    //   .attr("x", _o.w - _o.m)
    //   .attr("y", 0.0)
    //   .attr("dy", 18)
    //   .style("fill", "#aaa")
    //   .style("text-anchor", "end")
    //   .style("font-size", 8)
    //   .text("+"+ LOG_SCALE_EXTENTS_TREND[1])
    //   ;

    // // Attr Labels
    // _l.underlay.append("text")
    //   .attr("x", _o.w)//.attr("x", 0)//_o.w-_o.m)
    //   .attr("y", (_o.h+_o.m)/2.0)//.attr("y", 0)//_o.h/2.0)
    //   .attr("dx", -4)
    //   .attr("dy", 10)
    //   .attr("transform", rotate(90, _o.w, (_o.h+_o.m)/2.0)) //, _o.w-_o.m,  _o.h/2.0))
    //   .style("fill", "#aaa")
    //   .style("text-anchor", "middle")
    //   .style("font-size", 10)
    //   .text("ATTRIBUTE")
    //   ;

    // _l.underlay.append("text")
    //   .attr("x", _o.w-_o.m)
    //   .attr("y", _o.m)
    //   .attr("dx", 2)
    //   .attr("dy", 12)
    //   .style("fill", "#aaa")
    //   .style("text-anchor", "start")
    //   .style("font-size", 8)
    //   .text(LOG_SCALE_EXTENTS_PROB[1])
    //   ;

    // _l.underlay.append("text")
    //   .attr("x", _o.w-_o.m)
    //   .attr("y", _o.h-_o.m)
    //   .attr("dx", 2)
    //   .attr("dy", 8)
    //   .style("fill", "#aaa")
    //   .style("text-anchor", "start")
    //   .style("font-size", 8)
    //   .text("0")
    //   ;

    return my;
  }

  my.draw = function(data, options) {
    // Update draw options
    _o = $.extend(_o, options);

    var trendRange = [];
    for (var i = LOG_SCALE_EXTENTS_TREND[0], n = -LOG_SCALE_CLAMP; i < n; i/=10) {
      trendRange.push({
          "data": {
            "attr": {
              "trend": [i, 0, 1],
              "percentile": 100,
              "maxpercentile": 100,
            }
          }
        });
    }
    trendRange.push({
          "data": {
            "attr": {
              "trend": [i, 0, 1],
              "percentile": 100,
              "maxpercentile": 100,
            }
          }
        });
    for (var i = LOG_SCALE_CLAMP*10, n = LOG_SCALE_EXTENTS_TREND[1]; i <= n; i*=10) {
      trendRange.push({
          "data": {
            "attr": {
              "trend": [i, 0, 1],
              "percentile": 100,
              "maxpercentile": 100,
            }
          }
        });
    }

    var probRange = [];
    probRange.push({
          "data": {
            "attr": {
              "percprob": 0,
              "meanprob": 0,
              "maxprob": 0,
              "percentile": 100,
              "maxpercentile": 100,
            }
          }
        });
    for (var i = LOG_SCALE_CLAMP*10, n = LOG_SCALE_EXTENTS_PROB[1]; i < n; i*=10) {
      probRange.push({
          "data": {
            "attr": {
              "percprob": i,
              "meanprob": i,
              "maxprob": i,
              "percentile": 100,
              "maxpercentile": 100,
            }
          }
        });
    }

    var percRange = [];
    for (var i = 0, n = 100; i < n; i+=20) {
      percRange.push({
          "data": {
            "attr": {
              "percentile": i,
              "maxpercentile": 100,
            }
          }
        });
    }

    var intervalRange = [];
    for (var i = LIN_SCALE_EXTENTS_INTERVAL[0], n = LIN_SCALE_EXTENTS_INTERVAL[1]; i < n; i++) {
      intervalRange.push({
          "data": {
            "attr": {
              "maxintervalid": i,
              "percentile": 100,
              "maxpercentile": 100,
            }
          }
        });
    }

    // var legendData = [];
    // //var trendRange = [/*-1.0,*/ -0.1, -0.01, -0.001, -0.0001, 0.0, 0.0001, 0.001, 0.01, 0.1/*, 1.0*/];
    // //var probRange = [1.0, 0.1, 0.01, 0.001, 0.001, 0.0001, 0.0];
    // var legendCellW = (legendDim.w - legendDim.m)/trendRange.length;
    // trendRange.forEach(function(t, i) {
    //   probRange.forEach(function(p, j) {
    //     legendData.push({
    //       "x": i*legendCellW,
    //       "y": j*legendCellW,  // Square
    //       "width": legendCellW,
    //       "height": legendCellW,  // Square
    //       "data": {
    //         "attr": {
    //           "percentile": 100*logScaleProb(p),
    //           "maxpercentile": 100,
    //           "meanprob": p,
    //           "percprob": p,
    //           "maxintervalid": i,
    //           "trend": [t, 0, p]
    //         }
    //       }
    //     });
    //   });
    // });

    // Disable filter for legend drawing
    // var temp = FILTER_COLOR;
    // FILTER_COLOR = false;
    // legend.draw(legendData, {
    //   "fill": getFill(),
    // });
    // FILTER_COLOR = temp;

    // TODO: Fix this it's really hacky
    // var currentFilterColor = FILTER_COLOR;
    // FILTER_COLOR = false;

    var currentFillStyle = FILL_STYLE;

    var dataMap = {
      "trend": trendRange,
      "percprob": probRange,
      "perc": percRange,
      "interval": intervalRange
    }

    var labelMap = {
      "trend": "TREND",
      "percprob": "PROB",
      "perc": "PERC",
      "interval": "AGE"
    }
    var scaleMap = {
      "trend": "log",
      "percprob": "log",
      "perc": "lin",
      "interval": "cat"
    }

    var offsetX = 35;
    var offsetY = 15;
    var legendCellW = (_o.w - _o.m - offsetX)/trendRange.length;

    for (var i = 0, n = cfgFillOptions.length; i < n ; i++) {

      var fillName = cfgFillOptions[i].name;
      var fillData = dataMap[cfgFillOptions[i].value];
      var fillStyle = cfgFillOptions[i].value;

      FILL_STYLE = fillStyle;

      _l.underlay.append("text")
        .attr("x", 0)
        .attr("y", offsetY)
        .attr("dy", 9)
        .style("fill", "#aaa")
        .style("text-anchor", "start")
        .style("font-size", 10)
        .text(labelMap[fillStyle])
        ;

      _l.underlay.append("text")
        .attr("x", 1)
        .attr("y", offsetY)
        .attr("dy", 15)
        .style("fill", "#aaa")
        .style("text-anchor", "start")
        .style("font-size", 7)
        .text(scaleMap[fillStyle])
        ;

      if (fillStyle == "trend") {
        _l.underlay.append("text")
          .attr("x", offsetX + fillData.length*legendCellW / 2.0)
          .attr("y", offsetY)
          .attr("dy", -3)
          .style("fill", "#aaa")
          .style("text-anchor", "middle")
          .style("font-size", 8)
          .text("0")
          ;
      }

      _l.underlay.append("text")
        .attr("x", offsetX)
        .attr("y", offsetY)
        .attr("dy", -3)
        .style("fill", "#aaa")
        .style("text-anchor", "start")
        .style("font-size", 8)
        .text(function(d) {
          switch(fillStyle) {
            case "trend":
              return LOG_SCALE_EXTENTS_TREND[0];
            case "percprob":
              return LOG_SCALE_EXTENTS_PROB[0];
            case "perc":
              return 0;
            case "interval":
              return 0;
          }
        })
        ;

      _l.underlay.append("text")
        .attr("x", offsetX + fillData.length*legendCellW)
        .attr("y", offsetY)
        .attr("dy", -3)
        .style("fill", "#aaa")
        .style("text-anchor", "end")
        .style("font-size", 8)
        .text(function(d) {
          switch(fillStyle) {
            case "trend":
              return "+"+ LOG_SCALE_EXTENTS_TREND[1];
            case "percprob":
              return LOG_SCALE_EXTENTS_PROB[1];
            case "perc":
              return 100;
            case "interval":
              return _o.interval[1] - 1;
          }
        })
        ;

      // Add rectangles
      var chart = _l.chart.selectAll("rect.data"+fillStyle)
        .data(fillData, function(d, i) { return _o.id + fillStyle + i; })
        ;

      chart.exit().remove();

      chart.enter().append("rect")
        .attr("class", "data"+fillStyle)
        .style("stroke", "#fff")
        .style("stroke-width", 0.25)
      .merge(chart)
        .attr("x", function(d, i) { return offsetX + legendCellW* i; })
        .attr("y", function(d) { return offsetY; })
        .attr("width", function(d) { return legendCellW; })
        .attr("height", function(d) { return legendCellW; })
        //.style("fill", _o.fill)
        .style("fill", getFill())
        ;

      offsetY += 35;
    }

    FILL_STYLE = currentFillStyle;
    // FILTER_COLOR = currentFilterColor;

    // var chart = _l.chart.selectAll("rect")
    //   .data(data, function(d, i) { return _o.id + i; })
    //   ;

    // chart.exit().remove();

    // chart.enter().append("rect")
    //   .style("stroke", "#fff")
    //   .style("stroke-width", 0.25)
    //   .on("mouseover", function(d) {
    //     _o.highlight(d);
    //   })
    //   .on("click", function(d) {
    //     _o.click(d);
    //   })
    // .merge(chart)
    //   .attr("x", function(d) { return d.x; })
    //   .attr("y", function(d) { return d.y; })
    //   .attr("width", function(d) { return d.width; })
    //   .attr("height", function(d) { return d.height; })
    //   .style("fill", _o.fill)
    //   ;

    return my;
  }

  // Highlight data
  my.highlight = function(d) {
    // Not implemented
    console.info("Highlight:", d);
  }

  // Click data
  my.selected = function(d) {
    // Not implemented
    console.info("Click:", d);
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
    "fill": _defaultFill,
    "highlight": function(d) { my.highlight([d]); },
    "selected": function(d) { my.selected(d); },
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
