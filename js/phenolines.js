/* PhenoLines Main Javascript */

/*
Potential optimizations
- split into smaller tiled SVGs
- css "will-change" on SVGs
- Use Timeline and Rendering console panels to inspect
- Cache selections?
- Request animation frame to defer changes to the next frame? Not really using animation for this one...
*/


// Global settings
COMPARE_STYLE = "attr";

FILTER_ZEROPROB = false;  // This could be removed, I think the cutoff takes care of it
HIGHLIGHT_ANCESTORS = false;

FILTER_IMPORTANT = false;
AGGREGATE_IMPORTANT = false;
FILTER_COLOR = false;

UNIFY_STRUCTURE = false;
NORMALIZE_ROOT = false;
SHOW_ICONS = false;

FILL_STYLE = "trend";
VALUE_STYLE = "attr";

SCATTER_STYLE = "trendprob";

RANK_STYLE = "percprob";
FILTER_RANK = true;

LOG_SCALE_CLAMP = 0.00001;
LOG_SCALE_EXTENTS_TREND = [-0.1, 0.1]; //[-1.0, 1.0];
LOG_SCALE_EXTENTS_PROB = [0.0, 1.0];
LOG_SCALE_EXTENTS_ERROR = [0.0, 1.0];
LIN_SCALE_EXTENTS_PERCENTILE = [0.0, 100.0];
LIN_SCALE_EXTENTS_INTERVAL = [1, 5];

// TODO: Load this dynamically
// Update to D3 v4 and use deferred requests
var datasets = [
  //{"name": "Finale_Sample", "filename": "./data/test_output_topics_20160822.min.json"},
  //{"name": "Jimmy_Test", "filename": "./data/test_output_topics_20170215.min.json"},
  {"name": "Curated", "filename": "./data/test_output_topics_20170322.min.json"},
  {"name": "Informed_Prior", "filename": "./data/test_output_topics_20170228.min.json"},
  {"name": "Baseline", "filename": "./data/test_output_topics_20170227.min.json"},
  // {"name": "Mahdi_Non-opt_UMLS", "filename": "./data/test_output_topics_20170227__umls.min.json"},
  // {"name": "Mahdi_Opt_UMLS", "filename": "./data/test_output_topics_20170228__umls.min.json"},
  // {"name": "Mahdi_Non-opt_NCR", "filename": "./data/test_output_topics_20170227__ncr.min.json"},
  // {"name": "Mahdi_Opt_NCR", "filename": "./data/test_output_topics_20170228__ncr.min.json"},
  // {"name": "Mahdi_Non-opt_Curated", "filename": "./data/test_output_topics_curated_20170227.min.json"},
  // {"name": "Mahdi_Opt_Curated", "filename": "./data/test_output_topics_curated_20170228.min.json"},
  // {"name": "Mahdi_Opt_NonOpt", "filename": "./data/test_output_topics_opt-nonopt.min.json"},
];

var cfgArcOptions = [
  {"name": "Attribute", "value": "attr"},
  {"name": "Count", "value": "count"},
];

var cfgFillOptions = [
  {"name": "Trend Slope", "value": "trend"},
  //{"name": "Mean Prob", "value": "meanprob"},
  {"name": "Probability", "value": "percprob"},
  // {"name": "Error", "value": "error"},
  {"name": "Percentile", "value": "perc"},
  // {"name": "Prob + Trend", "value": "trendprob"},
  // {"name": "Error + Trend", "value": "trenderror"},
  // {"name": "Perc. + Trend", "value": "trendpercentile"},
  // {"name": "Percentile", "value": "perc"},
  {"name": "Age", "value": "interval"},
];

var cfgScatterOptions = [
  {"name": "Trend v. Prob", "value": "trendprob"},
  // {"name": "Trend v. Error", "value": "trenderror"},
  {"name": "Trend v. Perc", "value": "trendperc"},
  {"name": "Trend v. Age", "value": "trendage"},
  {"name": "Perc v. Prob", "value": "percprob"},
  {"name": "Age v. Prob", "value": "ageprob"},
  {"name": "Age v. Perc", "value": "ageperc"},
];

var cfgCompareOptions = [
  {"name": "Probability", "value": "attr"},
  {"name": "Topology", "value": "topo"},
];

var cfgRankOptions = [
  {"name": "Probability", "value": "percprob"},
  {"name": "Prob x Perc", "value": "probandperc"},
  {"name": "Percentile", "value": "perc"},
];

function init() {
  dataname = getDataName();

  // Initialize Interface
  initInterface();

  // Load dataset and draw
  // -- this now happens when the click is dispatched
  // loadData(filename);

  // Simulate clicking on data menu
  $("#data-menu-options-"+dataname).click();
}

function loadTopicCustomization(dataname) {
  topicCustomization = JSON.parse(localStorage.getItem(topicCustomizationKey));
  console.log("Load customization:", topicCustomization);

  // If not exists, initialize
  if (topicCustomization === null) {
    topicCustomization = {};
  }

  if (!(dataname in topicCustomization)) {
    initTopicCustomization(dataname);
  }
}

function saveTopicCustomization(dataname) {
  localStorage.setItem(topicCustomizationKey, JSON.stringify(topicCustomization));
}

function initTopicCustomization(dataname) {
  if (!(dataname in topicCustomization)) {
    topicCustomization[dataname] = {
      "columnWidth": uiGetChartSize(),
      "topicOrder": {},
      "topicTitle": {}
    }
  }
}

function updateTopicCustomization(dataname) {
  topicCustomization[dataname] = {
    "columnWidth": uiGetChartSize(),
    "topicOrder": {},
    "topicTitle": {}
  }
  saveTopicCustomization(dataname);
}

function getDataName() {
  // Create map of dataset names to filenames
  var filenameMap = {};
  for (var i = 0, n = datasets.length; i < n; i++) {
    filenameMap[ datasets[i].name ] = datasets[i].filename;
  }

  // Get dataset name from URL, otherwise use first dataset
  // var dataname = getParameterByName('d') || datasets[0].name;
  var dataname = window.location.hash.substr(1);
  if (!(dataname in filenameMap)) {
    dataname = datasets[0].name;
  }

  return dataname;
}

var iconManager = d3.phenotypeIcons();

var datastore = null;

var visibility = null;

var phenoplots = null;
var phenoscatters = null;
var phenotrends = null;
var phenoranks = null;
var legend = null;
var summary = null;

var searchList = null;

var selected = null;

var topicCustomization = null;
var topicCustomizationKey = "phenolinesTopicCustomization";

var colW = 300;
var colM = 20;  // horizontal spacing
var colS = 10;  // vertical spacing
var titleDim = {}
var phenoplotDim = {};
var phenotrendDim = {};
var phenoscatterDim = {};
var legendDim = {};
var summaryDim = {};

function setChartDims() {
  colW = topicCustomization[dataname].columnWidth || colW; //uiGetChartSize(); //300;
  colM = 20;  // horizontal spacing
  colS = 10;  // vertical spacing

  titleDim = {
    "w": colW,
    "h": 50
  }

  phenoplotDim = {
    "r": colW / 2,
    "m": 15
    };

  phenotrendDim = {
    "w": 250, //colW,
    "h": colW/3.0,
    "m": 15,
    "t": 8
    };

  phenoscatterDim = {
    "w": colW,
    "h": 2*colW/3.0,
    "m": 15,
    "t": 8
    };

  phenorankDim = {
    "w": colW,
    "h": 350,
    "m": 15
  }

  legendDim = {
    "w": 180,
    "h": 140,
    "m": 0
  }

  summaryDim = {
    "w": 250,
    "h": 180,
    "m": 15
  }
}

function loadData(filename) {
  // Load topic customization
  loadTopicCustomization(dataname);

  // Set value of chart size from customization
  $("#cfg-chart-size").val(topicCustomization[dataname].columnWidth);

  // Remove SVG if it exists
  d3.select("#vis").selectAll("svg").remove();

  // Set chart dimensions
  setChartDims();

  // Show loading graphic
  showLoading();

  d3.json(filename, function(error, cohorts) {
    if (error) return console.warn(error);
    console.info("Loaded:", cohorts);

    // Process Data
    var convertTree = function( comp ) {
      var tree = new TreeFilter( comp, {'childrenAttr': 'branchset'} );
      tree.calcMaxIc();
      return tree.getTree();
    }
    var convertList = function( comp ) {
      var tree = new TreeFilter( comp, {'childrenAttr': 'branchset'} );
      tree.calcMaxIc();
      return tree.nodes;
    }

    // Store data
    datastore = [];
    for (var i = 0, n = cohorts.length; i < n; i++) {
      // Should get name of topic from data file
      var title = cohorts[i]['overall'][0].title || "TOPIC "+ i;
      var topicdata = cohorts[i]['overall'].map(function(topic) { return convertTree(topic); });
      topicdata[0].title = title;
      datastore = datastore.concat( topicdata );
    }

    // Set default visibility
    visibility = [];
    for (var i = 0, n = datastore.length; i < n; i++) {
      visibility[i] = true;
    }
    initVisibilityControl();

    phenotitles = [];
    phenoplots = [];
    phenoscatters = [];
    phenotrends = [];
    phenoranks = [];

    // Set up Legend
    d3.select("#legend").selectAll("svg").remove();
    d3.select("#legend").append("svg")
      .attr("id", "phenolegend")
      .attr("width", legendDim.w)
      .attr("height", legendDim.h)
      ;

    legend = d3.phenolegend().init("#phenolegend", {
        "id": "phenolegend-",
        "x": 0,
        "y": 0,
        "w": legendDim.w,
        "h": legendDim.h,
        "m": legendDim.m,
        "interval": datastore[0].attr.interval,
        "fill": getFill()
      });
    legend.draw();

    // Set up Summary
    d3.select("#summary").selectAll("svg").remove();
    d3.select("#summary").append("svg")
      .attr("id", "phenosummary")
      .attr("width", summaryDim.w)
      .attr("height", summaryDim.h)
      ;

    summary = d3.phenosummary().init("#phenosummary", {
        "id": "phenosummary-",
        "x": 0,
        "y": 0,
        "w": summaryDim.w,
        "h": summaryDim.h,
        "m": summaryDim.m,
        "formatLabel": formatPhenotypeLabel,
        "fill": getFill()
      });

    // Set up trend charts
    for (var i = 0, n = datastore.length; i < n; i++) {
      var svgId = "phenotrends-"+i;
      d3.select("#summary").append("svg")
        .attr("id", svgId)
        .attr("width", phenotrendDim.w)
        .attr("height", phenotrendDim.h)
        ;

      var colOffset = 0; 
      var colData = datastore[i];

      var maxAge = colData.attr.interval[1];

      offsetY = 0;//summaryDim.h + (phenotrendDim.h + phenotrendDim.m)*i;
      var pt = d3.phenotrend().init("#"+svgId, {
        "id": "phenotrend-"+ i,
        "x": 0,
        "y": offsetY,
        "w": phenotrendDim.w,
        "h": phenotrendDim.h,
        "m": phenotrendDim.m,
        "t": phenotrendDim.t,
        "axisy": d3.scaleLinear(),
        "interval": colData.attr.interval,
        "fill": getFill(),
        "title": "TOPIC "+i,
        // "highlight": highlight,
        // "selected": setSelected
      });
      phenotrends.push(pt);
    }

    // Set up SVG -- This is the old single SVG for all visualizations
    // var svgId = "phenolines";
    // var width = datastore.length * (colW + colM) + colM;
    // var height = colM + colS + titleDim.h + 2*phenoplotDim.r + 2*colS + phenotrendDim.h + 2*colS + phenoscatterDim.h;

    // var svg = d3.select("#vis").append("svg")
    //   .attr("id", svgId)
    //   .attr("width", width)
    //   .attr("height", height)
    //   ;

    // With floating SVGs, increase size of #vis div
    var width = colW + 2 * colM;
    var height = colM + colS + titleDim.h + 2*phenoplotDim.r + 2*colS + phenotrendDim.h + 2*colS + phenoscatterDim.h + 2*colS + phenorankDim.h;
    
    d3.select("#vis")
      .style("width", datastore.length * width +"px")
      ;

    for (var i = 0, n = datastore.length; i < n; i++) {
      // Each column has it's own SVG
      var svgId = "phenolines-"+ i;
      var svg = d3.select("#vis").append("svg")
        .attr("id", svgId)
        .style("float", "left")
        .attr("width", width)
        .attr("height", height)
        ;

      // No column offset necessary for individual column SVGs
      // var colOffset = (colM + colW) * i;
      var colOffset = 0;
      var colData = datastore[i];

      // TODO: Make title and summary a component
      var t = svg.append("g")
        .attr("id", "phenotitle-"+i)
        ;

      // Column Title
      var offsetY = colM;
      t.append("text")
        .attr("x", colM + phenoplotDim.r + colOffset)
        .attr("y", offsetY)
        .attr("dy", 20)
        .style("text-anchor", "middle")
        .style("font-size", 26)
        .text(colData.title)
        ;

      // Group Label
      t.append("text")
        .attr("x", colM + phenoplotDim.r + colOffset)
        .attr("y", offsetY)
        .attr("dy", 35)
        .style("text-anchor", "middle")
        .style("font-size", 12)
        .text(colData.attr.interval[0] + "-" + (colData.attr.interval[1] - 1) + " YEARS")
        ;

      // // Phenotype Label
      // t.append("text")
      //   .attr("id", "phenotype-label-"+ i)
      //   .attr("x", colM + phenoplotDim.r + colOffset)
      //   .attr("y", offsetY)
      //   .attr("dy", 50)
      //   .style("text-anchor", "middle")
      //   .style("font-size", 16)
      //   .text("---")
      //   ;
      // t.append("text")
      //   .attr("id", "data-label-"+ i)
      //   .attr("x", colM + phenoplotDim.r + colOffset)
      //   .attr("y", offsetY)
      //   .attr("dy", 65)
      //   .style("text-anchor", "middle")
      //   .style("font-size", 10)
      //   .text("---")
      // ;
      phenotitles.push(t);

      // PhenoPlot
      offsetY += titleDim.h + colS;
      var pp = d3.phenoplot().init("#"+svgId, {
        "id": "phenoplot-"+ i,
        "x": colM + colOffset,
        "y": offsetY,
        "r": phenoplotDim.r,
        "m": phenoplotDim.m,
        //"partition": getPartition(),
        "fill": getFill(),
        "highlight": highlight,
        "selected": setSelected,
        "icons": iconManager
      });
      phenoplots.push(pp);

      // PhenoScatter
      offsetY += 2*phenoplotDim.r + colS;
      var ps = d3.phenoscatter().init("#"+svgId, {
        "id": "phenoscatter-"+ i,
        "x": colM + colOffset,
        "y": offsetY,
        "w": phenoscatterDim.w,
        "h": phenoscatterDim.h,
        "m": phenoscatterDim.m,
        "t": phenoscatterDim.t,
        "r": 3.0,
        "axisx": getScatterAxisX(),
        "axisy": getScatterAxisY(),
        "valx": getScatterValX(),
        "valy": getScatterValY(),
        "labely": getScatterLabelY(),
        "labelx": getScatterLabelX(),
        //"partition": getPartition(),
        "fill": getFill(),
        "highlight": highlight,
        "selected": setSelected,
        "formatTickY": function(axis, d) {
          if (axis == 'AGE') {
            switch(d) {
              case 0:
                return '';
              case 1:
                return '0-2';
              case 2:
                return '2-5';
              case 3:
                return '5-10';
              case 4:
                return '10-'+maxAge;
            }
          }
          return d;
        },
        "filterEmpty": function(axis, d) {
          // Filter out intervals == 0, which means the whole range
          // TODO: ... or should this be null? or should these be plotted with a custom tick?
          if (axis == 'AGE') {
            if (d.data.attr.maxintervalid == 0) {
              return false;
            }
          }
          // else if (axis == 'PROB') {
          //   if (d.data.attr.maxprob == 0.0) {
          //     return false;
          //   }
          // }
          return true;
        }
      });
      phenoscatters.push(ps);

      // PhenoTrend
      // offsetY += phenoscatterDim.h + colS;
      // var pt = d3.phenotrend().init("#"+svgId, {
      //   "id": "phenotrend-"+ i,
      //   "x": colM + colOffset,
      //   "y": offsetY,
      //   "w": phenotrendDim.w,
      //   "h": phenotrendDim.h,
      //   "m": phenotrendDim.m,
      //   "t": phenotrendDim.t,
      //   "axisy": d3.scaleLinear(),
      //   "interval": colData.attr.interval,
      //   "fill": getFill(),
      //   // "highlight": highlight,
      //   // "selected": setSelected
      // });
      // phenotrends.push(pt);

      // PhenoRank
      //offsetY += phenotrendDim.h + colS;
      offsetY += phenoscatterDim.h + colS;
      var pr = d3.phenorank().init("#"+svgId, {
        "id": "phenorank-"+ i,
        "x": colM + colOffset,
        "y": offsetY,
        "w": phenorankDim.w,
        "h": phenorankDim.h,
        "m": phenorankDim.m,
        "formatLabel": formatPhenotypeLabel,
        "fill": getFill(),
        "highlight": highlight,
        "selected": setSelected
      });
      phenoranks.push(pr);
    }

    draw();

    hideLoading();
  });
}

function draw() {
  var data = datastore;
  
  // Deep copy to preserve original data -- not needed in D3 v4
  //var data = $.extend(true, [], datastore);

  // Calculate union of all nodes across charts
  var unionNodes = {};
  for (var i = 0, n = data.length; i < n; i++) {
    // Get partition algorithm, which filters nodes
    var root = getHierarchy(data[i], null);
    var partition = getPartition();
    var nodes = partition(root).descendants();

    for (var j = 0, m = nodes.length; j < m; j++) {
      var node = nodes[j];
      if (!(node.data.uuid in unionNodes)) {
        unionNodes[node.data.uuid] = node;
      }
    }
  }

  // Update search list -- only use non-filtered phenotypes
  searchList = Object.values(unionNodes);

  // Calculate maxval
  var roots = new Array(data.length);
  var maxVal = 0.0;
  for (var i = 0, n = data.length; i < n; i++) {
    // Get partition algorithm, which filters nodes
    var root = getHierarchy(data[i], (UNIFY_STRUCTURE) ? unionNodes : {});

    // Store max root value
    if (maxVal < root.value) {
      maxVal = root.value;
    }

    // Store computed hierarchies
    roots[i] = root;
  }

  // Calculate partition sizes for display
  var partitions = new Array(data.length);
  for (var i = 0, n = roots.length; i < n; i++) {
    // Get partition algorithm, which filters nodes
    var root = roots[i];

    // Normalize between charts -- maybe only when value is prob?
    if (NORMALIZE_ROOT) {
      root.value = maxVal;
    }

    var partition = getPartition();
    var nodes = partition(root).descendants();

    // Store computed partition nodes
    partitions[i] = nodes;
  }

  // Draw plots
  for (var i = 0, n = partitions.length; i < n; i++) {
    var nodes = partitions[i];

    // Store prob of root node
    var maxProb = nodes[0].data.attr.maxprob;

    phenoplots[i].draw(nodes, {
      "fill": getFill(),
      "sort": getSort(),
      "icons": (SHOW_ICONS) ? iconManager : null,
    });

    phenoscatters[i].draw(nodes, {
      "fill": getFill(),
      "sort": getSort(),
      "axisx": getScatterAxisX(),
      "axisy": getScatterAxisY(),
      "valx": getScatterValX(),
      "valy": getScatterValY(),
      "labely": getScatterLabelY(),
      "labelx": getScatterLabelX(),
      "tickx": getScatterTickX(),
      "ticky": getScatterTickY(),
      "axisyalign": getScatterAxisYAlign(),
    });

    function rankedSortVal(node) {
      switch(RANK_STYLE) {
        case "probandperc":
          //return node.data.attr.percprob + node.data.attr.importance/100.0;
          //return node.data.attr.percprob * node.data.attr.importance;
          return node.data.attr.maxprob * node.data.attr.importance;
        case "percprob":
          //return node.data.attr.percprob;
          return node.data.attr.maxprob;
        case "perc":
          return node.data.attr.percentile;
        default:
          console.error("Invalid RANK_STYLE");
          break;
      }
    }

    function filterFn() {
      if (FILTER_RANK) {
        return function(d) { return d.data.attr.maxpercentile == d.data.attr.percentile; };
      } else {
        return function(d) { return d.depth >= 1; };
      }
    }

    var uniqueNodes = getUniqueInObjectArray(nodes, 
      function(d) { return d.data.attr.hpo; },
      function(a, b) { return d3.descending(rankedSortVal(a), rankedSortVal(b)) ||
        d3.ascending(a.data.attr.name, b.data.attr.name); }
      );

    phenoranks[i].draw(uniqueNodes, {
      "fill": getFill(),
      "limit": 25,
      "filterFn": filterFn(),
      "maxProb": maxProb,
    });
  }

  // Set selected and force redraw of same selection
  if (selected) {
    var hpoId = selected.data.id;
    for (var i = 0, n = phenoplots.length; i < n; i++) {
      var plot = phenoplots[i];
      var selSet = plot.nodesFromHpoId(hpoId);
      if (selSet.length > 0) {
        selected = selSet[0];
        break;
      }
    }
    setSelected(selected, true);
  }

  // Update search results
  $('#search-input').trigger("input");
}

function highlight(d) {
  var hpoId = (d === null) ? null : d.data.id;

  // Update Feedback Labels
  drawFeedback(d);

  // Highlight phenoplots, null resets highlight
  for (var i = 0, n = phenoplots.length; i < n; i++) {
    var plot = phenoplots[i];
    var hlSet = plot.nodesFromHpoId(hpoId);
    if (HIGHLIGHT_ANCESTORS) {
      plot.highlight(hlSet, true);  // highlight ancestors
    } else {
      plot.highlight(hlSet);
    }
  }

  // Highlight phenoscatters, null resets highlight
  for (var i = 0, n = phenoscatters.length; i < n; i++) {
    var plot = phenoscatters[i];
    var hlSet = plot.nodesFromHpoId(hpoId);
    if (HIGHLIGHT_ANCESTORS) {
      plot.highlight(hlSet, true);  // highlight ancestors
    } else {
      plot.highlight(hlSet);
    }
  }

  // Highlight phenoranks, null resets highlight
  for (var i = 0, n = phenoranks.length; i < n; i++) {
    var plot = phenoranks[i];
    plot.highlight(d);
  }

  // Update trend charts
  drawTrends(d);
}

function setSelected(d, redraw) {
  // Toggle is same node is clicked
  if (!redraw && d && selected && d.data.id == selected.data.id) {
    d = null;
  }

  selected = d;

  var hpoId = (d === null) ? null : d.data.id;

  // Update Feedback Labels
  drawFeedback(d);

  // Select phenoplots, null resets selected
  for (var i = 0, n = phenoplots.length; i < n; i++) {
    var plot = phenoplots[i];
    var selSet = plot.nodesFromHpoId(hpoId);
    plot.selected(selSet);
  }

  // Select phenoscatters, null resets selected
  for (var i = 0, n = phenoscatters.length; i < n; i++) {
    var plot = phenoscatters[i];
    var selSet = plot.nodesFromHpoId(hpoId);
    plot.selected(selSet);
  }

  // Select phenoranks, null resets selected
  for (var i = 0, n = phenoranks.length; i < n; i++) {
    var plot = phenoranks[i];
    plot.selected(d);
  }

  drawTrends(d);
}

function drawFeedback(d) {
  var feedbackData = [];

  for (var i = 0, n = phenoplots.length; i < n; i++) {
    if (d === null) {
      if (selected) {
        var key = selected.data.uuid;
        var plot = phenoplots[i];
        var node = plot.nodeFromKey(key);
        feedbackData.push(node);
        // var key = selected.data.uuid;
        // var plot = phenoplots[i];
        // var node = plot.nodeFromKey(key);
        // d3.select("#phenotype-label-"+i).text( formatPhenotypeLabel(node) );
        // d3.select("#data-label-"+i).text( formatDataLabel(node) );
      } else {
        // d3.select("#phenotype-label-"+i).text(formatPhenotypeLabel(null));
        // d3.select("#data-label-"+i).text(formatPhenotypeLabel(null));
      }
    } else {
      var key = d.data.uuid;
      var plot = phenoplots[i];
      var node = plot.nodeFromKey(key);
      feedbackData.push(node);
      // var key = d.data.uuid;
      // var plot = phenoplots[i];
      // var node = plot.nodeFromKey(key);
      // d3.select("#phenotype-label-"+i).text( formatPhenotypeLabel(node) );
      // d3.select("#data-label-"+i).text( formatDataLabel(node) );
    }
  }

  summary.draw(feedbackData, {
    "formatData": getFormatData(),
    "fill": getFill(),
  });
}

function drawTrends(d) {
  // Extract trends from phenotype across charts
  var trendNodes = [];
  var key = null;

  if (d !== null) {
    key = d.data.uuid;
  } else if (selected !== null) {
    key = selected.data.uuid;
  }

  if (key !== null) {
    for (var i = 0, n = phenoscatters.length; i < n; i++) {
      var plot = phenoscatters[i];
      trendNodes.push( plot.nodeFromKey(key) );
    }
  }

  // Calculate trend data max and min
  var max = 0.0;
  var min = 1.0;  // TODO: make this programmatic
  for (var i = 0, n = trendNodes.length; i < n; i++) {
    var node = trendNodes[i];

    // TODO: Node may be null if it's been hidden; should this be shown anyway for comparison?
    if (node !== null) {
      var probs = node.data.attr.prob;
      var slope = node.data.attr.trend[0];
      var intercept = node.data.attr.trend[1];
      var error = node.data.attr.trend[2];

      var interval = node.data.attr.interval;
      var numPts = interval[1] - interval[0] - 1;

      var _max = Math.max.apply(null, probs);
      _max = Math.max(_max, intercept + error);
      _max = Math.max(_max, intercept + slope*numPts + error);
      var _min = Math.min.apply(null, probs);
      _min = Math.min(_min, intercept - error);
      _min = Math.min(_min, intercept + slope*numPts - error);
      if (_max > max) { max = _max; }
      if (_min < min) { min = _min; }
    }
  }

  // Compute new scale
  if (trendNodes.length == 0) {
    max = 1.0;
    min = 0.0;
  }
  var trendScale = d3.scaleLinear().domain([min, max]).range([0.0, 1.0]);

  for (var i = 0, n = phenotrends.length; i < n; i++) {
    var plot = phenotrends[i];
    var node = (trendNodes[i]) ? [trendNodes[i]] : [];  // trendNodes may be empty if reset
    var interval = (trendNodes[i]) ? trendNodes[i].data.attr.interval : [0,1];

    // Fix palette for trends
    var currentFillStyle = FILL_STYLE;
    FILL_STYLE = "trend";
    
    var o = {
      "axisy": trendScale,
      "interval": interval,
      "fill": getFill(),
    }
    plot.draw(node, o);

    FILL_STYLE = currentFillStyle;
  }
}


// When aggregating, the path to some nodes will be broken across topics... hmmm
function filterNodes(node, unionNodes, foundAggr) {
  // Copy node
  node = $.extend({}, node);
  // console.log(node);

  // If node exists in any other chart, do not hide
  var override = false;
  if (unionNodes && (node.uuid in unionNodes)) {
    override = true;
  }

  // If node passes filter or overridden
  var passFilter = true;
  if (FILTER_IMPORTANT && !filterImportant(node)) {
    passFilter = false;
  }

  // If node passes agggregation or over
  var passAggr = true;
  if (AGGREGATE_IMPORTANT && (!aggregateImportant(node) || foundAggr)) {
    passAggr = false;
  }

  // If node is root or cat
  var notAggr = false;
  if (node.isroot || node.iscat || (node.attr.percentile > uiGetImportanceUpper())) {
    notAggr = true;
  }

  // Consider each child
  var ret = [];

  // Sort nodes to ensure that evaluation is deterministic
  node.children.sort(function(a, b) { return d3.ascending(a.id, b.id); })

  for (var i = 0, n = node.children.length; i < n; i++) {
    var child = node.children[i];
    ret = ret.concat( filterNodes(child, unionNodes, (passAggr || foundAggr)) );
  }

  // Reduce to unique children; only if second pass, using presence of unionNodes, which is hacky
  if (unionNodes) {
    ret = getUniqueInObjectArray( ret, 
      function(d) { return d.id; }, 
      function(a, b) { return d3.ascending(a.id, b.id) || d3.ascending(a.uuid, b.uuid); }
      );
  }

  // If node does not pass aggregate, return children
  // Bug here sometimes...?  Occurs in Final Sample with Dyslexia when unifying structure
  if (!override && !passAggr && !notAggr) {
    return ret;
  }

  // If node does not pass filter, return empty -- filter after aggregate because filter is destructive
  if (!override && !passFilter) {
    return [];
  }

  node.children = ret;
  if (node.isroot) {
    return node;
  }

  return [node];
}



/* D3 SUPPORT */
function getHierarchy(data, unionNodes) {
  // Filter and aggregate data
  var filtData = filterNodes(data, unionNodes, false);
  //console.log(filtData);

  // Operated on hierarchy before partition
  var children = function(d) {
    return d.children;
  };

  function sortVal(d) {
    // Force comparison of integer component of HPO ID
    return +d.data.attr.hpo.substr(3);
    // return d.data.attr.name;
  }

  // var root = d3.hierarchy(data, children)
  var root = d3.hierarchy(filtData, children)
    // Operates on node DATA, and forces accumulation, no good
    .sum(function(d) {
      // Default value, then post process after creation
      return 0;
    })
    // Operates on hierarchy AFTER partition
    .sort(function(a, b) { return d3.ascending(sortVal(a), sortVal(b)); })
    ;

  // Recompute node values because D3 is stupid -- passes data object and not the node, automatically adds
  function probVal(d, useLogScale) {
    //var prob = d.data.attr.meanprob;
    //var prob = d.data.attr.percprob;
    var prob = d.data.attr.maxprob;
    if (useLogScale) {
      return (prob > 0) ? logScaleProb(prob) : 0.0;
    }
    return prob;
  }

  // Logscale vs actual
  // -- actual might be a good option if the size of arcs should be more accurate %age
  var useLogScale = false;
  var desc = root.descendants(); // nodes, sorted by height, need to traverse in reverse
  for (var i = desc.length-1; 0 <= i; i--) {
    var node = desc[i];

    // Base case: get value based on node
    var val = 0;
    switch (VALUE_STYLE) {
      case "attr":
        val = probVal(node, useLogScale);
        break;
      case "count":
        val = 1;
        break;
      default:
        console.error("Invalid VALUE_STYLE value");
        break;
    }

    // Sum of child values, if children exists
    var childrenVal = 0;
    if (node.children && node.children.length > 0) {
      childrenVal = d3.sum(node.children, function(d) { return d.value; });
    }

    // Use max of own value or the sum of children
    node.value = Math.max(val, childrenVal);
  }

  return root;
}

function getLeafNodes(d) {
  var leafs = utils.getLeafNodes(d, "children");
  return getUniqueInObjectArray(leafs, 
    function(d) { return d.data.attr.hpo; },
    function(a, b) { return d3.ascending(a.data.attr.hpo, b.data.attr.hpo) || d3.ascending(a.data.uuid, b.data.uuid); }
    );
}

// Operates on hierarchy before partition
function filterImportant(d) {
  var upper = uiGetImportanceUpper();
  if (d.attr.maxpercentile >= upper) {
    return true;
  }
  return false;
}

function aggregateImportant(d) {
  var lower = uiGetImportanceLower();
  if (d.attr.percentile >= lower) {
    return true;
  }
  return false;
}


function getPartition() {
  return d3.partition()
    // This is now handled by d3.scale*
    //.size([2 * Math.PI, (phenoplotDim.r - phenoplotDim.m) * (phenoplotDim.r - phenoplotDim.m)])
    ;
}

function getScatterAxisX() {
  switch(SCATTER_STYLE) {
    case "trendprob":
    case "trenderror":
    case "trendperc":
    case "trendage":
      return logScaleTrend;
    case "percprob":
      return scalePerc;
    case "ageprob":
    case "ageperc":
      return scaleInterval;
    default:
      console.error("Invalid SCATTER_STYLE value");
      break;
  }
}

function getScatterAxisY() {
  switch(SCATTER_STYLE) {
    case "trendprob":
      return logScaleProb;
    case "trenderror":
      return logScaleError;
    case "trendperc":
    case "ageperc":
      return scalePerc;
    case "trendage":
      return scaleInterval;
    case "ageprob":
    case "percprob":
      return logScaleProb;
    default:
      console.error("Invalid SCATTER_STYLE value");
      break;
  }
}

function getScatterAxisYAlign() {
  switch(SCATTER_STYLE) {
    case "trendprob":
    case "trenderror":
    case "trendperc":
    case "trendage":
      return "center";
    case "percprob":
    case "ageprob":
    case "ageperc":
      return "left";
    default:
      console.error("Invalid SCATTER_STYLE value");
      break;
  }
}

function getScatterValX() {
  switch(SCATTER_STYLE) {
    case "trendprob":
    case "trenderror":
    case "trendperc":
    case "trendage":
      //return function(d) { return logScaleTrend(d.data.attr.trend[0]); };
      return function(d) { return d.data.attr.trend[0]; };
    case "ageprob":
    case "ageperc":
      return function(d) { return d.data.attr.maxintervalid; };
    case "percprob":
      return function(d) { return d.data.attr.percentile; };
    default:
      console.error("Invalid SCATTER_STYLE value");
      break;
  }
}

function getScatterValY() {
  switch(SCATTER_STYLE) {
    case "trendprob":
    case "ageprob":
    case "percprob":
      //return function(d) { return d.data.attr.meanprob; };
      //return function(d) { return d.data.attr.percprob; };
      return function(d) { return d.data.attr.maxprob; };
    case "trenderror":
      return function(d) { return d.data.attr.trend[2]; };
    case "trendperc":
    case "ageperc":
      return function(d) { return d.data.attr.percentile; };
    case "trendage":
      return function(d) { return d.data.attr.maxintervalid; };

    default:
      console.error("Invalid SCATTER_STYLE value");
      break;
  }
}

function getScatterLabelX() {
  switch(SCATTER_STYLE) {
    case "trendprob":
    case "trenderror":
    case "trendperc":
    case "trendage":
      return "TREND";
    case "percprob":
      return "PERC";
    case "ageprob":
    case "ageperc":
      return "AGE";
    default:
      console.error("Invalid SCATTER_STYLE value");
      break;
  }
}

function getScatterLabelY() {
  switch(SCATTER_STYLE) {
    case "trendprob":
      return "PROB";
    case "trenderror":
      return "ERROR";
    case "trendperc":
    case "ageperc":
      return "PERC";
    case "percprob":
    case "ageprob":
      return "PROB";
    case "trendage":
      return "AGE";
    default:
      console.error("Invalid SCATTER_STYLE value");
      break;
  }
}

function getScatterTickX() {
  switch(SCATTER_STYLE) {
    case "trendprob":
    case "trenderror":
    case "trendperc":
    case "trendage":
      // TODO: Fix this with a custom D3 scale...
      var trendAx = [];
      for (var i = LOG_SCALE_EXTENTS_TREND[0], n = -LOG_SCALE_CLAMP; i < n; i/=10) {
        trendAx.push(i);
      }
      trendAx.push(0);
      for (var i = LOG_SCALE_CLAMP*10, n = LOG_SCALE_EXTENTS_TREND[1]; i <= n; i*=10) {
        trendAx.push(i);
      }
      return trendAx;
    case "percprob":
      var probAx = [];
      for (var i = LIN_SCALE_EXTENTS_PERCENTILE[0], n = LIN_SCALE_EXTENTS_PERCENTILE[1]; i <= n; i+=20) {
        probAx.push(i);
      }
      return probAx;
    case "ageprob":
    case "ageperc":
      var probAx = [];
      for (var i = LIN_SCALE_EXTENTS_INTERVAL[0], n = LIN_SCALE_EXTENTS_INTERVAL[1]; i < n; i++) {
        probAx.push(i);
      }
      return probAx;
    default:
      console.error("Invalid SCATTER_STYLE value");
      break;
  }
}

function getScatterTickY() {
  switch(SCATTER_STYLE) {
    case "trendprob":
      // TODO: Fix this with a custom D3 scale...
      var probAx = [];
      probAx.push(0);
      for (var i = LOG_SCALE_CLAMP*10, n = LOG_SCALE_EXTENTS_PROB[1]; i <= n; i*=10) {
        probAx.push(i);
      }
      return probAx;
    case "trenderror":
      // TODO: Fix this with a custom D3 scale...
      var probAx = [];
      probAx.push(0);
      for (var i = LOG_SCALE_CLAMP*10, n = LOG_SCALE_EXTENTS_PROB[1]; i <= n; i*=10) {
        probAx.push(i);
      }
      return probAx;
    case "trendperc":
    case "ageperc":
      var probAx = [];
      for (var i = LIN_SCALE_EXTENTS_PERCENTILE[0], n = LIN_SCALE_EXTENTS_PERCENTILE[1]; i <= n; i+=20) {
        probAx.push(i);
      }
      return probAx;
    case "percprob":
    case "ageprob":
      var probAx = [];
      probAx.push(0);
      for (var i = LOG_SCALE_CLAMP*10, n = LOG_SCALE_EXTENTS_PROB[1]; i <= n; i*=10) {
        probAx.push(i);
      }
      return probAx;
    case "trendage":
      var probAx = [];
      for (var i = LIN_SCALE_EXTENTS_INTERVAL[0], n = LIN_SCALE_EXTENTS_INTERVAL[1]; i < n; i++) {
        probAx.push(i);
      }
      return probAx;
    default:
      console.error("Invalid SCATTER_STYLE value");
      break;
  }
}

function getFormatData() {
  switch(FILL_STYLE) {
    case "trend":
      return formatDataTrend;

    case "meanprob":
      return formatDataMeanProb;

    case "percprob":
      return formatDatapercprob;

    case "error":
      return formatDataError;

    case "perc":
      return formatDataPerc;

    case "interval":
      return formatDataInterval;

    default:
      console.error("Invalid FILL_STYLE value");
      break;
  }
}

function getFill() {
  function filterColor(d) {
    var upper = uiGetImportanceUpper();
    var lower = uiGetImportanceLower();

    if (d.data.attr.maxpercentile >= upper) {
      if (d.depth <= 1 || d.data.attr.percentile >= lower) {
        return true;
      }
    }
    return false;
  }

  switch(FILL_STYLE) {
    case "trend":
      return function(d) {
        if (d === null) {
          return color['none']();
        }
        if (!FILTER_COLOR || (FILTER_COLOR && filterColor(d))) {
          //return colorDualScale(logScaleTrend(d.data.attr['trend'][0]), logScaleProb(d.data.attr['meanprob']));
          //return colorDualScale(logScaleTrend(d.data.attr['trend'][0]), logScaleProb(d.data.attr['percprob']));
          return colorDualScale(logScaleTrend(d.data.attr['trend'][0]), logScaleProb(d.data.attr['maxprob']));
        } else {
          return color['none']();
        }
      }

    case "meanprob":
      return function(d) {
        if (d === null) {
          return color['none']();
        }
        if (!FILTER_COLOR || (FILTER_COLOR && filterColor(d))) {
          return colorSingleScale(logScaleProb(d.data.attr['meanprob']));
        } else {
          return color['none']();
        }
      }

    case "percprob":
      return function(d) {
        if (d === null) {
          return color['none']();
        }
        if (!FILTER_COLOR || (FILTER_COLOR && filterColor(d))) {
          //return colorSingleScale(logScaleProb(d.data.attr['percprob']));
          return colorSingleScale(logScaleProb(d.data.attr['maxprob']));
        } else {
          return color['none']();
        }
      }

    case "error":
      return function(d) {
        if (d === null) {
          return color['none']();
        }
        if (!FILTER_COLOR || (FILTER_COLOR && filterColor(d))) {
          return colorSingleScale(logScaleError(d.data.attr['trend'][2]));
        } else {
          return color['none']();
        }
      }

    case "perc":
      return function(d) {
        if (d === null) {
          return color['none']();
        }
        if (!FILTER_COLOR || (FILTER_COLOR && filterColor(d))) {
          return colorSingleScale(scalePerc(d.data.attr['percentile']));
        } else {
          return color['none']();
        }
      }

    case "interval":
      return function(d) {
        if (d === null) {
          return color['none']();
        }
        if (!FILTER_COLOR || (FILTER_COLOR && filterColor(d))) {
          return colorSingleScale(scaleInterval(d.data.attr['maxintervalid']));
        } else {
          return color['none']();
        }
      }
    // case "trenderror":
    //   return function(d) {
    //     if (d === null) {
    //       return color['none']();
    //     }
    //     if (!FILTER_COLOR || (FILTER_COLOR && filterColor(d))) {
    //       return colorDualScale(logScaleTrend(d.data.attr['trend'][0]), logScaleError(d.data.attr['trend'][2]));
    //     } else {
    //       return color['none']();
    //     }
    //   }

    // case "trendpercentile":
    //   return function(d) {
    //     if (d === null) {
    //       return color['none']();
    //     }
    //     if (!FILTER_COLOR || (FILTER_COLOR && filterColor(d))) {
    //       return colorDualScale(logScaleTrend(d.data.attr['trend'][0]), d.data.attr['percentile'] / 100.0);
    //     } else {
    //       return color['none']();
    //     }
    //   }

    // case "perc":
    //   return function(d) {
    //     if (d === null) {
    //       return color['none']();
    //     }
    //     if (!FILTER_COLOR || (FILTER_COLOR && filterColor(d))) {
    //       return color['prob']( scale['perc'](d.data.attr.percentile) );
    //     } else {
    //       return color['none']();
    //     }
    //   }

    default:
      console.error("Invalid FILL_STYLE value");
      break;
  }
}

function getSort() {
  return function(a, b) {
    //var scoreA = a.data.attr.percprob + Math.abs(a.data.attr.trend[0]);
    //var scoreB = b.data.attr.percprob + Math.abs(b.data.attr.trend[0]);
    var scoreA = a.data.attr.maxprob + Math.abs(a.data.attr.trend[0]);
    var scoreB = b.data.attr.maxprob + Math.abs(b.data.attr.trend[0]);
    return d3.ascending(a.data.attr.percentile, b.data.attr.percentile) || d3.ascending(scoreA, scoreB);
  }
  // return function(a, b) {
  //   var scoreA = a.data.attr.meanprob + Math.abs(a.data.attr.trend[0]);
  //   var scoreB = b.data.attr.meanprob + Math.abs(b.data.attr.trend[0]);
  //   return d3.ascending(a.data.attr.percentile, b.data.attr.percentile) || d3.ascending(scoreA, scoreB);
  // }
  // switch(FILL_STYLE) {
  //   case "trendprob":
  //     return function(a, b) {
  //       return d3.ascending(a.depth, b.depth);
  //     }
  //   case "perc":
  //     return function(a, b) {
  //       var scoreA = a.data.attr.meanprob + Math.abs(a.data.attr.trend[0]);
  //       var scoreB = b.data.attr.meanprob + Math.abs(b.data.attr.trend[0]);
  //       return d3.ascending(a.data.attr.percentile, b.data.attr.percentile) || d3.ascending(scoreA, scoreB);
  //     }
  //   default:
  //     console.error("Invalid FILL_STYLE value");
  //     break;
  // }

}

/* FEEDBACK */
// var formatPhenotypeLabel = function(d) {
//   if (d) {
//     return d.data.attr.name;
//   }

//   return "---";
// }

// var formatDataLabel = function(d) {
//   if (d) {
//     return "Prob: "+ d.data.attr.meanprob.toFixed(5) +" - "+
//            "Trend: "+ d.data.attr.trend[0].toFixed(5) +" - "+
//            "Error: "+ d.data.attr.trend[2].toFixed(5) +" - "+
//            "Perc: "+ d.data.attr.percentile;
//   }

//   return "---";
// }

function formatPhenotypeLabel(d) {
  if (d) {
    return d.data.attr.name;
  }

  return "";
}

function formatDataMeanProb(d) {
  if (d) {
    return d.data.attr.meanprob.toFixed(5);
  }

  return "";
}
function formatDatapercprob(d) {
  if (d) {
    //return d.data.attr.percprob.toFixed(5);
    return d.data.attr.maxprob.toFixed(5);
  }

  return "";
}
function formatDataTrend(d) {
  if (d) {
    return d.data.attr.trend[0].toFixed(5);
  }

  return "";
}
function formatDataError(d) {
  if (d) {
    return d.data.attr.trend[2].toFixed(5);
  }

  return "";
}
function formatDataPerc(d) {
  if (d) {
    return d.data.attr.percentile.toFixed(1);
  }

  return "";
}
function formatDataInterval(d) {
  if (d) {
    return ""+ d.data.attr.maxinterval[0] + "-" + (d.data.attr.maxinterval[1]-1);
  }

  return "";
}


/* SCALES */
function colorLchInterp(l, c, h) {
  return chroma.lch(l, c, h);
}

function colorLabInterp(l, a, b) {
  return chroma.lab(l, a, b);
}

function colorSingleScale(p) {
  switch(FILL_STYLE) {
    case "percprob":
      var c = chroma.brewer.BuPu;
      var s = chroma.scale(c.slice(2, c.length-2)).mode("lab").classes(5);
      return s(p);

    case "perc":
      var c = chroma.brewer.PuRd;
      var s = chroma.scale(c.slice(3, c.length-2)).mode("lab").classes(5);
      return s(p);

    case "interval":
      var c = chroma.brewer.PuBuGn;
      var s = chroma.scale(c.slice(3, c.length-2)).mode("lab").classes(4);
      return s(p);

    default:
      console.error("Invalid FILL_STYLE value");
      break;
  }
}

function colorDualScale(t, p) {
  //return chroma.lch(80-30*p, 20+80*p, 160*t+150);

  //var s = chroma.scale(["#934cfc", "#0096fa", "#00930a"]).mode("lch");  // Blue too dark
  
  //var sat = 0.0+1.0*p;
  
  // var purple = chroma.hsv(300, sat, 0.7);
  // var blue = chroma.hsv(200, sat, 1.0);
  // var green = chroma.hsv(130, sat, 0.7);
  // var s = chroma.scale([purple, blue, green]).mode("lab").classes(9);

  // var orange = chroma.hsv(25, sat, 0.8);
  // var yellow = chroma.hsv(55, sat, 0.9);
  // var green = chroma.hsv(130, sat, 0.7);
  // var s = chroma.scale([orange, yellow, green]).mode("lab").classes(9);
  
  // var grey = chroma.hsv(0, 0.0, 0.3);
  // var yellow = chroma.hsv(55, sat, 0.9);
  // var green = chroma.hsv(130, sat, 0.7);
  // var s = chroma.scale([grey, yellow, green]).mode("lab").classes(9);

  // return s(t);

  // Adjust saturation and lightness based on value
  // var sat = Math.min(1.0, 0.4 + 0.65*p);
  // var lgh = Math.max(0.0, 0.3 - 0.35*p);

  // var grey1 = chroma.hsl(0, 0.0, 0.3);
  // var grey2 = chroma.hsl(0, 0.0, 0.6);

  // var orange = chroma.hsl(25, sat, 0.5+lgh);
  // var yellow = chroma.hsl(55, sat, 0.45+lgh);
  // var green = chroma.hsl(135, sat, 0.4+lgh);
  // var pos = chroma.scale([yellow, green]).mode("lab").classes(5);
  // var neg = chroma.scale([grey2, grey1]).mode("lab").classes(5);
  // var neg2 = chroma.scale([yellow, orange]).mode("lab").classes(5);

 // /*  if (t == 0.5) {
 //    // No trend, use grey
 //    return chroma.hsv(0, 0, 0.6); 

 //  } else */if (t < 0.5) {
 //    var val = 1.0 - 2*t;
 //    return neg2(val);

 //  } else  {
 //    var val = 2*(t - 0.5);
 //    return pos(val);
 //  } 

  var grey1 = chroma.hsl(0, 0.0, 0.3);
  var grey2 = chroma.hsl(0, 0.0, 0.6);

  var orange = chroma.hsl(30, 1.0, 0.45);
  var yellow = chroma.hsl(55, 1.0, 0.45);
  var green = chroma.hsl(135, 1.0, 0.30);
  var pos = chroma.scale([yellow, green]).mode("lab").classes(5);
  var neg = chroma.scale([grey2, grey1]).mode("lab");//.classes(5);
  var neg2 = chroma.scale([yellow, orange]).mode("lab").classes(5);

/*  if (t == 0.5) {
    // No trend, use grey
    return chroma.hsv(0, 0, 0.6); 

  } else */

  if (t < 0.5) {  // Yellow is shared
    var val = 1.0 - 2*t;
    //return chroma.blend(neg2(val), chroma.hsl(0, 0.0, 0.7-0.7*p), "screen");
    return neg2(val);
  } else  {
    var val = 2*(t - 0.5);
    //return chroma.blend(pos(val), chroma.hsl(0, 0.0, 0.7-0.7*p), "screen");
    return pos(val);
  }



  // if (t < 0.5) {
  //   //return chroma.hsv(20 - 20*p, 0.5-t, 0.9);
  //   return chroma.hsv(30, 1.0-2*t+0.35, 1.0);
  // } else if (t == 0.5) {"#ff00ff", 
  //   return chroma.hsv(0, 0.0, 0.65);
  // } else  {
  //   //return chroma.hsv(220 + 20*p, t-0.5, 0.9);
  //   return chroma.hsv(200, 0.35+2*t-0.6, 1.0);
  // }
}

var cGreen = chroma('#008933'); //[74, 144, 51];
var cOrange = chroma('#f57300'); //[223, 134, 59];
var cPurple = chroma('#5c3267'); //chroma('#5a4aa6');
var cYellow = chroma('gold');
var cGrey = chroma("#333");

var color = {
  'prob': chroma.scale(['#ffffff', cOrange]).mode('lch'),
  //'trend': chroma.cubehelix(),
  //'trend': chroma.scale(["#08519c","#2171b5","#4292c6","#6baed6","#ffffbf","#fd8d3c","#fc4e2a","#e31a1c","#bd0026"]).mode('lab'),
  //'trend': chroma.scale(["#08519c","#54278f","#a50f15"]),
  'trend': chroma.scale(["#a50026","#d73027","#f46d43","#fdae61","#fee090","#ffffbf","#e0f3f8","#abd9e9","#74add1","#4575b4","#313695"]).classes(5),
  //'trend': chroma.scale([cPurple, cYellow, cGreen]).mode('lch'),
  'error': chroma.scale(["#ff9900", "#eeeeee", "#0eb9f2"]).classes(9),
  'none': function(d) { return "#ccc"; }
  };

// TODO: implement proper scales using D3
// http://stackoverflow.com/questions/36329468/d3js-create-custom-scale-positive-and-negative-logarithm

// Transform [-1, 1] to log around 0, then shift to [0, 1]
function logScaleTrend(d) {
  //var s = d3.scaleLog().domain([0.00001, 0.01]).range([0.0, 1.0]);
  var s = d3.scaleLog().domain([LOG_SCALE_CLAMP, LOG_SCALE_EXTENTS_TREND[1]]).range([0.0, 1.0]);
  var v = s( Math.max(LOG_SCALE_CLAMP, Math.abs(d)) );
  if (d < 0) { v *= -1; }
  v = (v + 1.0) / 2.0;
  return v;
}

// Transform [0, 1] to log, then shift to [0, 1]
function logScaleProb(d) {
  var s = d3.scaleLog().domain([LOG_SCALE_CLAMP, LOG_SCALE_EXTENTS_PROB[1]]).range([0.0, 1.0]);
  var v = s( Math.max(LOG_SCALE_CLAMP, d) );
  return v;
}

// Transform [0, 1] to log, then shift to [0, 1]
function logScaleError(d) {
  var s = d3.scaleLog().domain([LOG_SCALE_CLAMP, LOG_SCALE_EXTENTS_ERROR[1]]).range([0.0, 1.0]);
  var v = s( Math.max(LOG_SCALE_CLAMP, d) );
  return v;
}

function scalePerc(d) {
  var s = d3.scaleLinear().domain([LIN_SCALE_EXTENTS_PERCENTILE[0], LIN_SCALE_EXTENTS_PERCENTILE[1]]).range([0.0, 1.0]);
  var v = s( d );
  return v;
}

// TODO: this scale should be dynamic
function scaleInterval(d) {
  var s = d3.scaleLinear().domain([LIN_SCALE_EXTENTS_INTERVAL[0], LIN_SCALE_EXTENTS_INTERVAL[1]]).range([0.0, 1.0]);
  var v = s( d );
  return v;
}

var scale = {
  'prob': d3.scaleLinear().domain([0.0, 1.0]).range([0.0, 1.0]),
  'trend': d3.scaleLinear().domain([-1.0, 1.0]).range([0.0, 1.0]),
  'prob-scatter': logScaleProb,
  'trend-scatter': logScaleTrend,
  'perc': d3.scaleLinear().domain([0.0, 100.0]).range([0.0, 1.0]),
  };




/* UI CONTROLS */
function initInterface() {
  // Initialize input behaviours
  $("#cfg-filter-zeroprob").click(uiToggleFilterZeroProb).prop('checked', FILTER_ZEROPROB);
  $("#cfg-normalize-root").click(uiToggleNormalizeRoot).prop('checked', NORMALIZE_ROOT);

  $("#cfg-highlight-ancestors").click(uiToggleHighlightAncestors).prop('checked', HIGHLIGHT_ANCESTORS);
  $("#cfg-filter-important").click(uiToggleFilterImportant).prop('checked', FILTER_IMPORTANT);
  $("#cfg-filter-color").click(uiToggleFilterColor).prop('checked', FILTER_COLOR);
  $("#cfg-aggregate-important").click(uiToggleAggregateImportant).prop('checked', AGGREGATE_IMPORTANT);
  $("#cfg-unify-structure").click(uiToggleUnifyStructure).prop('checked', UNIFY_STRUCTURE);
  $("#cfg-show-icons").click(uiToggleShowIcons).prop('checked', SHOW_ICONS);
  $("#cfg-filter-rank").click(uiToggleFilterRank).prop('checked', FILTER_RANK);

  $("#cfg-imp-upper").on("change", uiUpdateImportanceThreshold);
  $("#cfg-imp-lower").on("change", uiUpdateImportanceThreshold);

  $("#cfg-chart-size").on("change", uiUpdateChartSize);

  // Search input
  $('#search-input').on("input", function() {
    var searchTerm =  $(this).val();
    var matches = checkSearchMatches(searchTerm, searchList);
    uiShowSearchResults( matches );
  });

  // Dataset loading options
  for (var i = 0, n = datasets.length; i < n; i++) {
    var option = datasets[i];
    var id = "data-menu-options-"+ option.name;
    var item = '<li><a href="#'+ option.name +'" id="'+ id +'">'+ option.name +"</a></li>";

    $("#data-menu-options").append(item);
    $("#"+id).click(
      (function(o) { return function(e) { e.preventDefault(); uiSetDataFile(o); }; })(option)
      );
  }

  // Compare Style Options
  for (var i = 0, n = cfgCompareOptions.length; i < n; i++) {
    var option = cfgCompareOptions[i];
    var id = "cfg-compare-options-"+ option.value;
    var item = '<li><a href="#'+ option.value +'" id="'+ id +'">'+ option.name +"</a></li>";

    $("#cfg-compare-options").append(item);
    $("#"+id).click(
      (function(o) { return function(e) { e.preventDefault(); uiSetCfgCompare(o); }; })(option)
      );
  }
  setActiveDropdownItem( $("#cfg-compare"), cfgCompareOptions[0].name );

  // Config Fill Options
  for (var i = 0, n = cfgFillOptions.length; i < n; i++) {
    var option = cfgFillOptions[i];
    var id = "cfg-fill-options-"+ option.value;
    var item = '<li><a href="#'+ option.value +'" id="'+ id +'">'+ option.name +"</a></li>";

    $("#cfg-fill-options").append(item);
    $("#"+id).click(
      (function(o) { return function(e) { e.preventDefault(); uiSetCfgFill(o); }; })(option)
      );
  }
  setActiveDropdownItem( $("#cfg-fill"), cfgFillOptions[0].name );

  // Config Arc Options
  for (var i = 0, n = cfgArcOptions.length; i < n; i++) {
    var option = cfgArcOptions[i];
    var id = "cfg-arc-options-"+ option.value;
    var item = '<li><a href="#'+ option.value +'" id="'+ id +'">'+ option.name +"</a></li>";

    $("#cfg-arc-options").append(item);
    $("#"+id).click(
      (function(o) { return function(e) { e.preventDefault(); uiSetCfgArc(o); }; })(option)
      );
  }
  setActiveDropdownItem( $("#cfg-arc"), cfgArcOptions[0].name );

  // Config Scatter Options
  for (var i = 0, n = cfgScatterOptions.length; i < n; i++) {
    var option = cfgScatterOptions[i];
    var id = "cfg-scatter-options-"+ option.value;
    var item = '<li><a href="#'+ option.value +'" id="'+ id +'">'+ option.name +"</a></li>";

    $("#cfg-scatter-options").append(item);
    $("#"+id).click(
      (function(o) { return function(e) { e.preventDefault(); uiSetCfgScatter(o); }; })(option)
      );
  }
  setActiveDropdownItem( $("#cfg-scatter"), cfgScatterOptions[0].name );

  // Config Rank Options
  for (var i = 0, n = cfgRankOptions.length; i < n; i++) {
    var option = cfgRankOptions[i];
    var id = "cfg-rank-options-"+ option.value;
    var item = '<li><a href="#'+ option.value +'" id="'+ id +'">'+ option.name +"</a></li>";

    $("#cfg-rank-options").append(item);
    $("#"+id).click(
      (function(o) { return function(e) { e.preventDefault(); uiSetCfgRank(o); }; })(option)
      );
  }
  setActiveDropdownItem( $("#cfg-rank"), cfgRankOptions[0].name );
}

function initVisibilityControl() {
  var controller = $("#cfg-visibility");

  controller.children().remove();

  for (var i = 0, n = visibility.length; i < n; i++) {
    var id = 'cfg-visibility-'+ i;
    var item = '<div><label class="checkbox-inline"><input type="checkbox" id="'+ id +'" value="1">'+ datastore[i].title +'</label></div>';
    controller.append(item);
    $("#"+id).click(
      (function(o) { return function(e) { uiToggleVisibility(o); }; })(i)
      ).prop('checked', visibility[i]);
  }
}

function uiToggleVisibility(id) {
  visibility[id] = !visibility[id];

  $("#phenolines-"+id).toggleClass( "hidden", !visibility[id] );
  $("#phenotrends-"+id).toggleClass( "hidden", !visibility[id] );

  //draw();  // Not need to redraw, CSS

  // Update search results
  $('#search-input').trigger("input");

  // Hack to update summary panel
  highlight(null);
}

function uiToggleFilterZeroProb() {
  FILTER_ZEROPROB = !FILTER_ZEROPROB;
  draw();
}

function uiToggleNormalizeRoot() {
  NORMALIZE_ROOT = !NORMALIZE_ROOT;
  draw();
}

function uiToggleHighlightAncestors() {
  HIGHLIGHT_ANCESTORS = !HIGHLIGHT_ANCESTORS;
  //draw();  // no need to redraw for this one
}

function uiToggleFilterImportant() {
  FILTER_IMPORTANT = !FILTER_IMPORTANT;
  draw();
}

function uiToggleFilterColor() {
  FILTER_COLOR = !FILTER_COLOR;
  draw();
}

function uiToggleAggregateImportant() {
  AGGREGATE_IMPORTANT = !AGGREGATE_IMPORTANT;
  draw();
}

function uiToggleUnifyStructure() {
  UNIFY_STRUCTURE = !UNIFY_STRUCTURE;
  draw();
}

function uiToggleShowIcons() {
  SHOW_ICONS = !SHOW_ICONS;
  draw();
}

function uiToggleFilterRank() {
  FILTER_RANK = !FILTER_RANK;
  draw();
}


function uiUpdateChartSize() {
  // Now stored globally
  //var dataname = getDataName();

  // Update local storage
  updateTopicCustomization(dataname);

  // Simulate clicking on data menu
  $("#data-menu-options-"+dataname).click();
}

function uiUpdateImportanceThreshold() {
  draw();
}

function setActiveDropdownItem( menu, text ) {
  menu.find("span.active-text").text( text );
}

function uiSetDataFile( option ) {
  console.info("Loading:", option.name, option.filename);

  // Update hash -- default prevented when click on menu item
  window.location.hash = option.name;

  // Update dropdown
  setActiveDropdownItem($("#data-menu"), option.name);
  
  // Save new data name
  dataname = option.name;

  // Load data
  loadData( option.filename );
}

function uiSetCfgCompare(option) {
  COMPARE_STYLE = option.value;
  setActiveDropdownItem($("#cfg-compare"), option.name);

  // Compare options
  switch (COMPARE_STYLE) {
    case "attr":
      // Compare attribute values
      VALUE_STYLE = "attr";
      //UNIFY_STRUCTURE = false;
      // FILTER_COLOR = true;
      break;
    case "topo":
      // Compare topology values
      VALUE_STYLE = "count";
      //UNIFY_STRUCTURE = true;
      // FILTER_COLOR = true;
      break;
    default:
      console.log("Invalid COMPARE STYLE");
      break;
  }

  draw();
}

function uiSetCfgScatter(option) {
  SCATTER_STYLE = option.value;
  setActiveDropdownItem($("#cfg-scatter"), option.name);
  draw();
}

function uiSetCfgFill(option) {
  FILL_STYLE = option.value;
  setActiveDropdownItem($("#cfg-fill"), option.name);
  draw();
}

function uiSetCfgArc(option) {
  VALUE_STYLE = option.value;
  setActiveDropdownItem($("#cfg-arc"), option.name);
  draw();
}

function uiSetCfgRank(option) {
  RANK_STYLE = option.value;
  setActiveDropdownItem($("#cfg-rank"), option.name);
  draw();
}

function sortSearchResults(a, b) {
  return d3.ascending(a.data.name, b.data.name);
}

function uiShowSearchResultsPreview( d ) {
  // Get preview of phenotypes across all charts
  var items = phenoplots.map(function(pp) { return pp.nodeFromKey(d.data.uuid); });
  var fill = getFill();
  var ret = "";
  items.forEach(function(d, i) {
    // Only draw if chart is visible
    if (visibility[i]) {
      ret += '<div style="display:inline-block;height:8px;width:12px;background-color:'+ fill(d) +'"></div>';
    }
  });
  return ret + "<br/>";
}

function uiShowSearchResults( highlightSet ) {
  // List unique results under search box
  var hlSet = getUniqueInObjectArray(highlightSet, 
    function(d) { return d.data.attr.hpo; },
    function(a, b) { return d3.ascending(a.data.attr.hpo, b.data.attr.hpo) || d3.ascending(a.data.uuid, b.data.uuid); }
    );

  var results = d3.select("#search-results").selectAll("a")
    .data(hlSet.sort(sortSearchResults), function(d) { return "searchResult"+Math.random(); });

  results.exit()
    .remove();

  var list = results.enter().append("a")
    .attr("class", "list-group-item small")
    .attr("href", "#")
    .html(function(d) {
      var item = uiShowSearchResultsPreview(d);
      item += d.highlight;
      return item;
    })
    .on("click", function(d) {
      d3.event.preventDefault();  // Stop hash overwriting
      setSelected(d);
    })
    .on("mouseover", function(d) {
      highlight(d);
    })
    .on("mouseout", function() {
      highlight(null);
    })
    ;
  // No merge because each data point always has a unique id
}

function showLoading() {
  d3.select("#vis").append("img")
    .attr("id", "loading")
    .attr("src", "./img/loading.gif")
    ;
}

function hideLoading() {
  d3.select("#loading").remove();
}

function uiGetImportanceUpper() {
  return parseInt( $("#cfg-imp-upper").val() );
}

function uiGetImportanceLower() {
  return parseInt( $("#cfg-imp-lower").val() );
}

function uiGetChartSize() {
  return parseInt( $("#cfg-chart-size").val() );
}

$(window).resize(function() {
  var w = $(window).width();
  var h = $(window).height();

  var controlPanelW = $("#control-panel").width();
  var summaryPanelW = $("#summary-panel").width();
  var searchPanelW = $("#search-panel").width();
  
  $("#control-panel").height(h);
  $("#summary-panel").height(h);
  $("#search-panel").height(h);

  $("#vis-panel").width(w - controlPanelW - summaryPanelW - searchPanelW);
  $("#vis-panel").height(h);

  // console.log(w, h);
});


function checkSearchMatches( search, searchList ) {
  var matches = [];

  var needles = search.split(/\s+/);  // tokenize search string
  //console.log(needles);

  if (needles[0].length < 1) {  // must be at least one valid needle
    return matches;
  }

  //var reTest = needles.map(function(d) { return '(?=.*' + d + ')'; });  // match all tokens in string
  //reTest = "^.*"+reTest.join('')+".*$";

  var reTest = needles.map(function(d) { return '(?=.*' + d + ')'; }).join('');  // match all tokens in string

  var re1 = new RegExp(reTest, "ig");

  var reRep = '('+needles.join('|')+')';
  var re2 = new RegExp(reRep, "ig");

  for (var i = searchList.length - 1; i >= 0; i--) {
    var nodeName = searchList[i].data.name;
    if (re1.test(nodeName)) {
      searchList[i].highlight = nodeName.replace(re2, '<span style="font-weight:bold;">$1</span>');
      matches.push( searchList[i] );
    }
  }

  return matches;
}

// This overrides the implementation in utils.js
// Extended from:
// http://stackoverflow.com/questions/9229645/remove-duplicates-from-javascript-array
function getUniqueInObjectArray( arr, attrFn, sortFn ) {
  // Check for valid arr
  if (!arr || arr.constructor !== Array || arr.length == 0) {
    return arr;
  }

  // Define sort function based on attr; then order by depth
  var sorter = sortFn || function(a, b) { return d3.ascending(attrFn(a), attrFn(b)); };

  // Sort and reduce to find unique items
  var uniq = arr.slice() // slice makes copy of array before sorting it
    .sort(sorter)
    .reduce(function(a,b){
      if (a.length < 1) a.push(b);
      if (attrFn(a.slice(-1)[0]) !== attrFn(b)) a.push(b); // slice(-1)[0] means last item in array without removing it (like .pop())
      return a;
    },[]); // this empty array becomes the starting value for a

  return uniq;
}

/*  Automatic extents adjustment code.  Doesn't crop close enough... better to do manually for now.  Maybe add input in UI.

  // Return extents from partition nodes
  function extentsFromNodes(nodes) {
    return {
      "prob": d3.extent(nodes, function(d) { return d.data.attr.meanprob; }),
      "trend": d3.extent(nodes, function(d) { return d.data.attr.trend[0]; }),
      "error": d3.extent(nodes, function(d) { return d.data.attr.trend[2]; })
    }
  }

  // Concat all node arrays together and get extents
  var extents = extentsFromNodes( [].concat.apply([], partitions) );
  //console.log(extents);

  function getLimits(ext) {
    var sign = 1;
    if (ext < 0) { sign = -1; }
    return sign * Math.pow(10, Math.ceil(Math.log(Math.abs(ext)) / Math.LN10));
  }

  var limits = {
    "prob": extents.prob.map(getLimits),
    "trend": extents.trend.map(getLimits),
    "error": extents.error.map(getLimits)
  }
  //console.log(limits);

  LOG_SCALE_EXTENTS_PROB = limits.prob;
  LOG_SCALE_EXTENTS_TREND = limits.trend;
  LOG_SCALE_EXTENTS_ERROR = limits.error;
*/
