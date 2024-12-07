// Global function called when select element is changed
function onCategoryChanged() {
    var select = d3.select('#categorySelect').node();
    // Get current value of select element
    var category = select.options[select.selectedIndex].value;
    // Update chart with the selected category of temperatures
    updateChart(category);
}

// This function converts strings to numeric temperatures during data preprocessing
function dataPreprocessor(row) {
    return {
        country: row.Country,
        continent: row.Continent,
        house2015: +row['2015'],
        house2022: +row['2022']
    };
}

var svg = d3.select('svg');

// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 60, r: 40, b: 30, l: 120};

// Compute chart dimensions
var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;

// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

// Compute the spacing for bar bands based on the number of countries (20 in this case)
var barBand = chartHeight / 20;
var barHeight = barBand * 0.7;

var countries;

var widthScale = d3.scaleLinear()
    .range([0, chartWidth])

d3.csv('housing_cost.csv', dataPreprocessor).then(function(dataset) {
    // Create global variables here and initialize the chart

    countries = dataset
    widthScale.domain([0, d3.max(countries, function(d) {
        return Math.max(d.house2010, d.house2022);
    })]);

    // **** Your JavaScript code goes here ****
    svg.append('text')
        .attr('class', 'title')  
        .attr('x', svgWidth / 2) 
        .attr('y', 30)           
        .attr('text-anchor', 'middle')  
        .text('Housing Burden (%)');

    var xAxisBottom = d3.axisBottom(widthScale)
        .ticks(5)              
        .tickFormat(d => d+ 'C');  

    chartG.append('g')
        .attr('class', 'x-axis-bottom')
        .attr('transform', `translate(0, ${chartHeight})`) 
        .call(xAxisBottom);

    var xAxisTop = d3.axisTop(widthScale)
        .ticks(5)
        .tickFormat(d => d + 'C');

    chartG.append('g')
        .attr('class', 'x-axis-top')
        .attr('transform', `translate(0, -5)`)  
        .call(xAxisTop);

    // Update the chart for all countries to initialize
    updateChart('all-continents');
});
var currentFilterKey = 'all-continents'; 

function updateChart(filterKey, cutoff=0) {
    // Create a filtered array of countries based on the filterKey
    var filteredCountries;
    currentFilterKey = filterKey;
    if (filterKey === 'all-continents')
        filteredCountries = countries.filter(d => ((d.continent !== filterKey) && (d.house2022 >= cutoff)));
    else filteredCountries = countries.filter(d => ((d.continent === filterKey) && (d.house2022 >= cutoff)));

    // **** Draw and Update your chart here ****
    var bars = chartG.selectAll('.bar')
        .data(filteredCountries, function(d) {return d.country});
    
    var barsEnter = bars.enter()
        .append('rect')
        .attr('class', 'bar')  
        .attr('y', (d, i) => i * barBand)  
        .attr('height', barHeight)         
        .attr('fill', 'darkblue')
        .attr('width', d => widthScale(d.house2022));
    
    barsEnter.merge(bars)
        .attr('width', d => widthScale(d.house2022)) 
        .attr('y', (d, i) => i * barBand);    

    // Handle the text labels for each country
    var labels = chartG.selectAll('.label')
        .data(filteredCountries, function(d){return d.country});
    

    var labelsEnter = labels.enter()
        .append('text')
        .attr('class', 'label')  
        .attr('x', -5)  
        .attr('text-anchor', 'end') 
        .attr('y', (d, i) => i * barBand + barHeight*3/4) 
        .text(function(d) {
            return d.country;
        });
    labelsEnter.merge(labels)
        .attr('y', (d, i) => i * barBand + barHeight*3 / 4); 
    
    bars.exit().remove();
    labels.exit().remove();
}

// Remember code outside of the data callback function will run before the data loads
d3.select('#main')
    .append('p')
    .append('button')
    .style("border", "1px solid black")
    .text('Filter Data')
    .on('click', function() {
        // Add code here
        var cutoffValue = parseFloat(d3.select('#cutoff').property('value'));
        updateChart(currentFilterKey, cutoffValue);
    });