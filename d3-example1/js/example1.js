// ##Example 1: Visualise a timeseries

// In this example we will fetch the Lady Gaga Facebook fans timeseries and visualise it
// as a linechart using D3.js.
//
// If you want to try another dataset have a look at the
// [Datasets section](http://developer.musicmetric.com/timeseries.html#datasets)
// for a list of all available endpoints.
//
// ### Useful links
// 1. [JQuery documentation](http://api.jquery.com/)
// 2. [D3.js documentation](https://github.com/mbostock/d3/wiki)
// 3. [Musicmetric API documentation](http://developer.musicmetric.com/)


// ### Fetch data
// Add API token and granularity parameters to the request.
// The granularity parameter is optional and can be *day*, *week*, and for
// some endpoints *hour* (default is *day*).  
// For other request parameters have a look at the [Qualifiers documentation](http://developer.musicmetric.com/timeseries.html#qualifiers).
//
// **Note**: The Musicmetric API supports a number of different [ID spaces](http://developer.musicmetric.com/identification.html)
// so you don't necessarily have to know the musicmetric ID to fetch the data for an artist.  
// For example, try replacing *fe66302b0aee49cfbd7d248403036def* with *lastfm:rihanna* in the url property.
//
// Wrap the ajax call in a [JQuery document ready](http://api.jquery.com/ready/) event handler
// so that we don' try to fetch and visualise the data before the DOM has finished loading.
$(document).ready(function() {
    $.ajax({
        url: "http://api.semetric.com/artist/fe66302b0aee49cfbd7d248403036def/fans/facebook",
        dataType: "json",
        data: {
            token: "24387cbc10a4467ea40250d10aa983d4",
            granularity: "week"
        },
        success: function(data, textStatus, jqXHR) {
            if (data && data.success) {
                var series = generateTimeseries(data.response);
                renderChart(series);
            }
            else {
                alert("Something went wrong");
            }
        }
    });
});

// ### Generate Timeseries
// The data returned in the API response represents the
// timeseries in a *dense* format. This means we have an
// array of values, a start and end time, and the periodicity
// of the series which we need to convert into an array of
// timestamps and their associated values.
function generateTimeseries(params) {
    // The timestamps in the API response are in UNIX time,
    // which is the number of seconds since 1 January 1970 00:00.
    // The Javascript *Date* object on the other hand uses milliseconds so we
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
function renderChart(series) {
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
        .text("Lady Gaga - Number of Facebook fans added per week");

    // Center title.
    title.attr("x", width/2 - title.property("clientWidth")/2);

    // Create scales. For the X-axis we use a [time scale](https://github.com/mbostock/d3/wiki/Time-Scales) and for the
    // Y-axis we use a [linear scale](https://github.com/mbostock/d3/wiki/Quantitative-Scales#wiki-linear).
    var xScale = d3.time.scale()
        .range([0, width])
        .domain(d3.extent(series, function(d) { return d.time; }));
    var yScale = d3.scale.linear()
        .range([height, 0])
        .domain(d3.extent(series, function(d) { return d.value; }));

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
        .x(function(d) { return xScale(d.time); })
        .y(function(d) { return yScale(d.value); });

    // Append a [`path`](https://developer.mozilla.org/en-US/docs/SVG/Element/path).  
    // Use D3 [`datum`](https://github.com/mbostock/d3/wiki/Selections#wiki-datum) to bind the series
    // to the `path` elements.
    svg.append("path")
        .datum(series)
        .attr("class", "line")
        .attr("d", line);
}