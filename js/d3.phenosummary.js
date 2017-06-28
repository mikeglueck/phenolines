/*
PHENOSUMMARY
Interactive summary
*/

// Require D3
if (!window.d3) { throw "d3 wasn't included!"};
// Require jQuery
if (!window.jQuery) { throw "jquery wasn't included!"};

// d3.phenoplot
d3.phenosummary = function() {
  // PhenoPlot wrapper
  var my = function() {}

// Initialization
  my.init = function(selector, options) {
    // If no ID, generate one
    options.id = options.id || "phenosummary-"+ defaultId();
    _o = $.extend(_defaultOptions, options);

    //console.log(_o);

    // Store parent
    _parent = d3.select(selector);

    // Create and store element
    _g = _parent.append("g")
      .attr("id", _o.id)
      .attr("class", "phenosummary")
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

    return my;
  }

  my.draw = function(data, options) {
    // Update draw options
    _o = $.extend(_o, options);

    _data = data.filter(function(d, i) { return visibility[i]; });
    var titles = datastore.map(function(d) { return d.title; }).filter(function(d, i) { return visibility[i]; });

    var offsetY = 10;
    var w = (_o.w - 2*_o.m) / _data.length;
    var h = 15;
    var textAngle = 0;
    var textSize = 8;

    // Remove labels
    _l.chart.selectAll("text").remove();

    // Add phenotype label
    var label = "";
    var i = 0;
    for (var i = 0, n = _data.length; i < n; i++) {
      if (_o.formatLabel(_data[i]).length > 0) {
        label = wrapText(_o.formatLabel(_data[i]));
        break;
      }
    }

    _l.chart.append("text")
      .attr("x", 0)
      .attr("y", offsetY)
      .attr("dy", 3)
      .style("font-size", 14)
      .html( label );


    // TODO: Fix this it's really hacky
    var currentFillStyle = FILL_STYLE;

    var labelMap = {
      "trend": "TREND",
      "percprob": "PROB",
      "perc": "PERC",
      "interval": "AGE"
    }

    for (var i = 0, n = cfgFillOptions.length; i < n ; i++) {
      offsetY += 30;

      var fillName = labelMap[cfgFillOptions[i].value];
      var fillStyle = cfgFillOptions[i].value;

      FILL_STYLE = fillStyle;

      // Label attributes
      if (_data.length>0) {
        _l.chart.append("text")
          .attr("transform", function(d, i) { return translate(-5, offsetY+h/2.0) +" "+ rotate(-90); })
          .style("text-anchor", "middle")
          .style("font-size", textSize)
          .style("fill", "#666")
          .text(fillName)
          ;
      }

      // Add rectangles
      var chart = _l.chart.selectAll("rect.data"+fillStyle)
        .data(_data, function(d, i) { return _o.id + fillStyle + i; })
        ;

      chart.exit().remove();

      chart.enter().append("rect")
        .attr("class", "data"+fillStyle)
        .style("stroke", "#fff")
        .style("stroke-width", 0.25)
        .on("mouseover", function(d) {
          _o.highlight(d);
        })
        .on("click", function(d) {
          _o.selected(d);
        })
      .merge(chart)
        .attr("x", function(d, i) { return w * i; })
        .attr("y", function(d) { return offsetY; })
        .attr("width", function(d) { return w; })
        .attr("height", function(d) { return h; })
        //.style("fill", _o.fill)
        .style("fill", getFill())
        ;

      // Add details
      var feedback =_l.chart.selectAll("text.data"+fillStyle)
        .data(_data, function(d, i) { return _o.id + fillStyle + i; })
        ;

      feedback.enter().append("text")
        .attr("class", "data"+fillStyle)
        .attr("transform", function(d, i) { return translate(w*i+2, offsetY-3) +" "+ rotate(textAngle); })
        .style("text-anchor", "start")
        .style("font-size", textSize)
        //.text( _o.formatData )
        .text( getFormatData() )
        //.style("fill", _o.fill)
        .style("fill", getFill())
        ;
    }

    FILL_STYLE = currentFillStyle;

    offsetY += 25;

    // Topic labels
    if (_data.length > 0) {
      var labels = _l.chart.selectAll("text.label")
        .data(titles, function(d, i) { return _o.id + i; })
        ;
      labels.exit().remove();

      labels.enter().append("text")
        .attr("class", "label")
        .style("fill", "#666")
        .style("text-anchor", "middle")
        .style("font-size", textSize)
        .text(function(d) { return d; })
      .merge(labels)
        .attr("x", function(d, i) { return w/2.0 + w * i; })
        .attr("y", function(d) { return offsetY; })
        ;
    }

    // offsetY += 15;
    // feedback.enter().append("text")
    //   .attr("x", 0)
    //   .attr("y", offsetY)
    //   .style("font-size", 10)
    //   .text( formatDataProb )
    //   ;

    // offsetY += 15;
    // _l.chart.append("text")
    //   .attr("x", 0)
    //   .attr("y", offsetY)
    //   .style("font-size", 10)
    //   .text( formatDataTrend(data) )
    //   ;

    // offsetY += 15;
    // _l.chart.append("text")
    //   .attr("x", 0)
    //   .attr("y", offsetY)
    //   .style("font-size", 10)
    //   .text( formatDataError(data) )
    //   ;

    // offsetY += 15;
    // _l.chart.append("text")
    //   .attr("x", 0)
    //   .attr("y", offsetY)
    //   .style("font-size", 10)
    //   .text( formatDataPerc(data) );



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
    console.info("Selected:", d);
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
    "formatLabel": function(d) { return d.name; },
    "formatData": function(d) { return d.val; },
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

  // Selection cache
  // var _s = {};

  // Data
  var _data = null;

  function wrapText(x) {
    var limit = 35;
    if (x.length > limit) {
      var tokens = x.split(" ");
      var lines = [];
      var buf = "";
      for (var i = 0, n = tokens.length; i < n; i++) {
        if ((buf + tokens[i]).length > limit) {
          lines.push(buf);
          buf = "";
        }
        buf += tokens[i] + " ";
      }
      lines.push(buf);
      return lines.map(function(d, i) { return '<tspan x="0" y="'+ (i*16) +'">'+ d + '</tspan>'}).join("");
    }
    return '<tspan dy="0">'+ x +'</tspan>';
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
