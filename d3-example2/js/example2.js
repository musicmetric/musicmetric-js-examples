// ##Example 2: Visualise multiple timeseries

// In this example we will fetch and visualise all of Lady Gaga's fans timeseries.
//
// If you want to try another group of datasets have a look at the
// [Datasets section](http://developer.musicmetric.com/timeseries.html#datasets)
// for a list of all available endpoints.
//
// ### Useful links
// 1. [JQuery documentation](http://api.jquery.com/)
// 2. [D3.js documentation](https://github.com/mbostock/d3/wiki)
// 3. [Musicmetric API documentation](http://developer.musicmetric.com/)

// Create a global series array to store the fetched data.
var series = [];

// Wrap the Ajax requests in a [JQuery document ready](http://api.jquery.com/ready/) event handler
// so that we don't try to fetch and visualise the data before the DOM has finished loading.
$(document).ready(function() {
    // Create an array of endpoints to fetch.
    var endpoints = [
        "/fans/total",
        "/fans/facebook",
        "/fans/twitter",
        "/fans/youtube"
    ];

    // For each endpoint create an ajax request and add it to the
    // requests array.
    var requests = [];
    for (var i=0, length=endpoints.length; i < length; i++) {
        requests.push(fetchData(endpoints[i]));
    }

    // We want to fetch all the datasets before we render the chart
    // so we use JQuery [`when`](http://api.jquery.com/jQuery.when/) to
    // group the requests.  
    // We use [`apply`](https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/apply)
    // to call `when` with an array of arguments (i.e. the requests array).
    $.when.apply(this, requests)
        // We want to render the chart even if some of
        // the requests failed so we use the `always` callback.
        .always(function(args) {
            // The dataset requests can finish in any order so before we continue we sort
            // the series array so that it is in the same order as we defined the endpoints.
            series.sort(function(a, b) {
                a = endpoints.indexOf(a.name);
                b = endpoints.indexOf(b.name);
                return (a < b) ? -1 : (a > b) ? 1 : 0;
            });
            renderChart();
        });
});

// ### Fetch data
// Create an ajax request and return it's [`Promise`](http://api.jquery.com/deferred.promise/) object.
// A `Promise` exposes methods to attach additional handlers and determine state, but prevents
// external code from interfering with the progress or status of the request.
function fetchData(endpoint) {
    var request = $.ajax({
        url: "http://api.semetric.com/artist/fe66302b0aee49cfbd7d248403036def" + endpoint,
        dataType: "json",
        data: {
            token: "24387cbc10a4467ea40250d10aa983d4",
            granularity: "week"
        },
        success: function(data, textStatus, xhr) {
            if (data && data.success) {
                // If request is successful, generate the timeseries
                // and add it to the global series object.
                series.push( {name: endpoint, values: generateTimeseries(data.response)} );
            }
            else {
                // If request fails print out an error message to the
                // console.
                console.error("Error:", data, textStatus);
            }
        }
    });
    return request.promise();
}

// ### Generate Timeseries
// The data returned in the API response represents the
// timeseries in a *dense* format. This means we have an
// array of values, a start and end time, and the periodicity
// of the series which we need to convert into an array of
// timestamps and their associated values.
function generateTimeseries(params) {
    // The timestamps in the API response are in UNIX time,
    // which is the number of seconds since 1 January 1970 00:00.
    // The Javascript `Date` object on the other hand uses milliseconds so we
    // need to multiply all the time parameters with 1000.
    var startTime = params.start_time * 1000,
        endTime = params.end_time * 1000,
        period = params.period * 1000;

    // Loop trough all the values in the data array and
    // add the value and the corresponding timestamp to
    // the series array.
    // The timestamp is calculated by adding the period times
    // the array index to the start time.
    var series = [];
    var time, value;
    for (var i = 0, length = params.data.length; i < length; i++) {
        time = startTime + i * period;
        value = params.data[i];
        series.push({time: time, value: value});
    }

    return series;
}

// ### Render chart
function renderChart() {
    // Clear the container.
    var container = $("#chart").empty();

    // Add a bit of margin around the width and height
    // to make room for axes and labels (see D3's [margin conventions](http://bl.ocks.org/3019563)).
    var margin = {top: 40, right: 20, bottom: 40, left: 70},
        width = container.width() - margin.left - margin.right,
        height = container.height() - margin.top - margin.bottom;

    // Create root SVG element and append it to the chart container.
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Append title.
    var title = svg.append("text")
        .attr("class", "title")
        .attr("y", -20)
        .text("Lady Gaga - Number of fans added per week");

    // Center title.
    title.attr("x", width/2 - title.property("clientWidth")/2);

    // Create scales. For the X-axis we use a [time scale](https://github.com/mbostock/d3/wiki/Time-Scales) and for the
    // Y-axis we use a [linear scale](https://github.com/mbostock/d3/wiki/Quantitative-Scales#wiki-linear).
    var xScale = d3.time.scale()
        .range([0, width]);
    var yScale = d3.scale.linear()
        .range([height, 0]);

    // Work out the domain of the X and Y scales by finding the min and max time
    // and value of all the series.
    xScale.domain([
        d3.min(series, function(s) { return d3.min(s.values, function(v) { return v.time; }); }),
        d3.max(series, function(s) { return d3.max(s.values, function(v) { return v.time; }); })
    ]);
    yScale.domain([
        d3.min(series, function(s) { return d3.min(s.values, function(v) { return v.value; }); }),
        d3.max(series, function(s) { return d3.max(s.values, function(v) { return v.value; }); })
    ]);

    // Create a [colour scale](https://github.com/mbostock/d3/wiki/Ordinal-Scales#wiki-category10).
    var colorScale = d3.scale.category10()
        .domain(
            d3.map(series, function(s) { return s.name; })
        );

    // Create axes and attach the X and Y scales.
    var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom");
    var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left");

    // Append X-axis element.
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    // Append Y-axis element.
    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis)
       .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Fans added");

    // Create a [line generator](https://github.com/mbostock/d3/wiki/SVG-Shapes#wiki-line).
    var line = d3.svg.line()
        .interpolate("basis")
        .x(function(d) { return xScale(d.time); })
        .y(function(d) { return yScale(d.value); });

    // Create the timeseries lines.  
    // The [`data`](https://github.com/mbostock/d3/wiki/Selections#wiki-data) operator is used to bind
    // data to DOM elements. The [`enter`](https://github.com/mbostock/d3/wiki/Selections#wiki-enter)
    // selection creates a new [`g`](https://developer.mozilla.org/en-US/docs/SVG/Element/g) element
    // for each item in the bound data (i.e. the series array).
    var timeSeries = svg.selectAll(".timeseries")
        .data(series)
       .enter().append("g")
        .attr("class", "timeseries");

    // Append a [`path`](https://developer.mozilla.org/en-US/docs/SVG/Element/path)
    // element to each timeseries group. The value for the
    // [`d`](https://developer.mozilla.org/en-US/docs/SVG/Attribute/d) attribute
    // is generated by the line generator created above.
    timeSeries.append("path")
      .attr("class", "line")
      .attr("d", function(d) { return line(d.values); })
      .style("stroke", function(d) { return colorScale(d.name); });

    // Create legend.  
    // This follows the same principle as
    // when we added the timeseries lines above, but
    // instead of a [`path`](https://developer.mozilla.org/en-US/docs/SVG/Element/path)
    // we create a [`rect`](https://developer.mozilla.org/en-US/docs/SVG/Element/rect) and a
    // [`text`](https://developer.mozilla.org/en-US/docs/SVG/Element/text) element for each of the series.
    var legend = svg.selectAll(".legend")
        .data(series)
       .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });

    // Append a [`rect`](https://developer.mozilla.org/en-US/docs/SVG/Element/rect) element to each legend group.
    legend.append("rect")
        .attr("x", width - 18)
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d) { return colorScale(d.name); });
    
    // Append a [`text`](https://developer.mozilla.org/en-US/docs/SVG/Element/text) element to each legend group.
    legend.append("text")
        .attr("x", width - 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .style("text-anchor", "end")
        .text(function(d) { return d.name; });
}
