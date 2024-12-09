//get selected continent, year, and cutoff value from the dropdown menus
function onCategoryChanged() {
    var select = d3.select('#categorySelect').node();
    var category = select.options[select.selectedIndex].value;

    var yearSelect = d3.select('#yearSelect').node();
    var yearFilter = yearSelect.options[yearSelect.selectedIndex].value;

    var cutoff = parseFloat(d3.select('#cutoff').property('value')) || 0;

    updateChart(category, cutoff, yearFilter);
}

// converts strings to numeric
function dataPreprocessor(row) {
    return {
        country: row.Country,
        continent: row.Continent,
        house2015: +row.house2015, 
        house2022: +row.house2022 
    };
}

var svg = d3.select('svg');

// Get layout parameters
var svgWidth = +svg.attr('width');
var svgHeight = +svg.attr('height');

var padding = {t: 60, r: 40, b: 80, l: 80};

// Compute chart dimensions
var chartWidth = svgWidth - padding.l - padding.r;
var chartHeight = svgHeight - padding.t - padding.b;

// Create a group element for appending chart elements
var chartG = svg.append('g')
    .attr('transform', 'translate('+[padding.l, padding.t]+')');

var countries;


// Set up scales
var widthScale = d3.scaleLinear()
    .range([0,chartWidth])

var HeightScale = d3.scaleLinear()
    .range([chartHeight, 0])

d3.csv('housing_cost.csv', dataPreprocessor).then(function(dataset) {

    countries = dataset
    HeightScale.domain([0, d3.max(countries, function(d) {
        return Math.max(d.house2015, d.house2022);
    })]);

    //legend
    var legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${svgWidth - 200}, ${padding.t})`);

    legend.append('rect')
    .attr('width', 180)
    .attr('height', 65)
    .attr('fill', 'white')
    .attr('stroke', '#4CAF50')
    .attr('stroke-width', 2)
    .attr('rx', 10) 
    .attr('ry', 10);

    legend.append('rect')
    .attr('x', 10)
    .attr('y', 10)
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', 'yellowgreen');

    legend.append('text')
    .attr('x', 35)
    .attr('y', 22)
    .style('font-size', '15px')
    .style('font-family', 'Open Sans')
    .style('font-weight', '400')
    .text('2015 Housing Burden');

    legend.append('rect')
    .attr('x', 10)
    .attr('y', 40)
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', 'green');

    legend.append('text')
    .attr('x', 35)
    .attr('y', 52)
    .style('font-size', '15px')
    .style('font-family', 'Open Sans')
    .style('font-weight', '400')
    .text('2022 Housing Burden');

    //graph title
    svg.append('text')
        .attr('class', 'title')  
        .attr('x', 500) 
        .attr('y', 30)           
        .attr('text-anchor', 'middle')  
        .style('font-size', '24px') 
        .style('font-weight', 'bold')
        .text('Global Housing Burden: A Comparison of 2015 vs. 2022');

    //xaxis
    var xAxisBottom = d3.axisBottom(widthScale)
    .ticks(0);

    chartG.append('g')
        .attr('class', 'x-axis-bottom')
        .attr('transform', `translate(0, ${chartHeight})`) 
        .call(xAxisBottom);

    chartG.append('text')
    .attr('class', 'x-axis-label')
    .attr('x', chartWidth / 2) 
    .attr('y', chartHeight + 80) 
    .attr('text-anchor', 'middle')
    .style('font-size', '14px')
    .style('font-family', 'Open Sans')
    .style('font-weight', '600')
    .text('Countries');

    //yaxis 
    var yAxisLeft = d3.axisLeft(HeightScale)
    .ticks(9)
    .tickFormat(d => d + '%');

    chartG.append('g')
    .attr('class', 'y-axis-left')
    .attr('transform', `translate(0, 0)`) 
    .call(yAxisLeft);

    chartG.append('text')
    .attr('class', 'y-axis-label')
    .attr('x', -chartHeight / 2) 
    .attr('y', -50) 
    .attr('transform', 'rotate(-90)') 
    .attr('text-anchor', 'middle') 
    .style('font-size', '14px')
    .style('font-family', 'Open Sans')
    .style('font-weight', '600')
    .text('Housing Burden (%)');

    updateChart('all-continents');
});
var currentFilterKey = 'all-continents'; 

function updateChart(filterKey, cutoff = 0, yearFilter = 'both') {
    // Create a filtered array of countries based on the filterKey
    var filteredCountries;
    currentFilterKey = filterKey;

    var filteredCountries = countries.filter(d => {
        const matchesContinent = filterKey === 'all-continents' || d.continent === filterKey;
        const matchesYear2015 = yearFilter === '2015' && d.house2015 >= cutoff;
        const matchesYear2022 = yearFilter === '2022' && d.house2022 >= cutoff;
        const matchesBothYears = yearFilter === 'both' && d.house2015 >= cutoff && d.house2022 >= cutoff;

        return matchesContinent && (matchesYear2015 || matchesYear2022 || matchesBothYears);
    });

    // Compute the spacing for bar bands
    var barBand = chartWidth / filteredCountries.length;

    var barSpacing = barBand * 0.2; 
    var individualBarWidth = (barBand - barSpacing) / 2;

    // Bars for house burden value in 2015
    var bars2015 = chartG.selectAll('.bar2015')
        .data(filteredCountries, d => d.country);

    var bars2015Enter = bars2015.enter()
        .append('rect')
        .attr('class', 'bar2015')
        .attr('x', (d, i) => i * barBand + barSpacing) 
        .attr('y', chartHeight) 
        .attr('width', individualBarWidth) 
        .attr('height', 0) 
        .attr('fill', 'yellowgreen');

    bars2015Enter.merge(bars2015)
        .transition()
        .duration(500)
        .attr('x', (d, i) => i * barBand + barSpacing) 
        .attr('y', d => HeightScale(d.house2015)) 
        .attr('height', d => chartHeight - HeightScale(d.house2015)) 
        .attr('width', individualBarWidth) 
        .style('display', yearFilter === '2015' || yearFilter === 'both' ? 'block' : 'none'); 

    //add hover for 2015
    var tooltip = d3.select('body')
    .append('div') 
    .attr('id', 'tooltip') 
    .style('position', 'absolute') 
    .style('visibility', 'hidden') 
    .style('background-color', 'lightyellow') 
    .style('border', '1px solid gray')
    .style('border-radius', '4px')
    .style('padding', '5px')
    .style('font-size', '12px')
    .style('pointer-events', 'none');
    
    bars2015Enter
        .on('mouseover', function(event, d) {
            tooltip
                .style('visibility', 'visible')
                .html(`Country: ${d.country}<br>Housing Burden 2015: ${d.house2015.toFixed(2)}%`)
                .style('left', `${event.pageX + 10}px`) 
                .style('top', `${event.pageY - 20}px`);
        })
        .on('mousemove', function(event) {
            tooltip
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 20}px`);
        })
        .on('mouseout', function() {
            tooltip.style('visibility', 'hidden');
        });

    bars2015.exit().remove();

    // Bars for house burden value in 2022
    var bars2022 = chartG.selectAll('.bar2022')
        .data(filteredCountries, d => d.country);

    var bars2022Enter = bars2022.enter()
        .append('rect')
        .attr('class', 'bar2022')
        .attr('x', (d, i) => i * barBand+ + barSpacing+individualBarWidth) 
        .attr('y', chartHeight) 
        .attr('width', individualBarWidth) 
        .attr('height', 0) 
        .attr('fill', 'green');

    bars2022Enter.merge(bars2022)
        .transition()
        .duration(500)
        .attr('x', (d, i) => i * barBand+ + barSpacing+individualBarWidth) 
        .attr('y', d => HeightScale(d.house2022)) 
        .attr('height', d => chartHeight - HeightScale(d.house2022)) 
        .attr('width', individualBarWidth) 
        .style('display', yearFilter === '2022' || yearFilter === 'both' ? 'block' : 'none'); 

    //add hover for 2022
    bars2022Enter
        .on('mouseover', function(event, d) {
            tooltip
                .style('visibility', 'visible')
                .html(`Country: ${d.country}<br>Housing Burden 2022: ${d.house2022.toFixed(2)}%`)
                .style('left', `${event.pageX + 10}px`) 
                .style('top', `${event.pageY - 20}px`);
        })
        .on('mousemove', function(event) {
            tooltip
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 20}px`);
        })
        .on('mouseout', function() {
            tooltip.style('visibility', 'hidden');
        });
    bars2022.exit().remove();
    


// xaxis Country text labels
var labels = chartG.selectAll('.label')
.data(filteredCountries, d => d.country);

var labelsEnter = labels.enter()
.append('text')
.attr('class', 'label')
.attr('text-anchor', 'front') 
.attr('transform', (d, i) => {
    const x = i*barBand+barSpacing; 
    const y = chartHeight + 10; // 
    return `translate(${x}, ${y}) rotate(-45)`; 
})
.text(d => d.country);

labelsEnter.merge(labels)
.transition()
.duration(500)
.attr('transform', (d, i) => {
    const x = i*barBand+barSpacing; 
    const y = chartHeight + 10; 
    return `translate(${x}, ${y}) rotate(45)`; 
});

labels.exit().remove();

//filter data button
d3.select('#filter-button').on('click', function() {
    var cutoffValue = parseFloat(d3.select('#cutoff').property('value')) || 0;
    var yearFilter = d3.select('#yearSelect').node().value;
    updateChart(currentFilterKey, cutoffValue, yearFilter);
});

}


