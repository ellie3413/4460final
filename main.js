function onCategoryChanged() {
    var select = d3.select('#categorySelect').node();
    var category = select.options[select.selectedIndex].value;

    var yearSelect = d3.select('#yearSelect').node();
    var yearFilter = yearSelect.options[yearSelect.selectedIndex].value;

    var cutoff = parseFloat(d3.select('#cutoff').property('value')) || 0;

    updateChart(category, cutoff, yearFilter);
}



// This function converts strings to numeric temperatures during data preprocessing
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

var widthScale = d3.scaleLinear()
    .range([0,chartWidth])

var HeightScale = d3.scaleLinear()
    .range([chartHeight, 0])

d3.csv('housing_cost.csv', dataPreprocessor).then(function(dataset) {
    // Create global variables here and initialize the chart

    countries = dataset
    HeightScale.domain([0, d3.max(countries, function(d) {
        return Math.max(d.house2015, d.house2022);
    })]);


        // 범례 추가
    var legend = svg.append('g')
    .attr('class', 'legend')
    .attr('transform', `translate(${svgWidth - 200}, ${padding.t})`); // 오른쪽 위에 배치

    // 범례 테두리
    legend.append('rect')
    .attr('width', 180)
    .attr('height', 65)
    .attr('fill', 'none')
    .attr('stroke', '#4CAF50')
    .attr('stroke-width', 2)
    .attr('rx', 10) 
    .attr('ry', 10);

    // 범례 항목 1: 2015 데이터
    legend.append('rect')
    .attr('x', 10)
    .attr('y', 10)
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', 'lightgreen');

    legend.append('text')
    .attr('x', 35)
    .attr('y', 22)
    .style('font-size', '14px')
    .style('font-family', 'Arial, sans-serif')
    .text('2015 Housing Burden');

    // 범례 항목 2: 2022 데이터
    legend.append('rect')
    .attr('x', 10)
    .attr('y', 40)
    .attr('width', 15)
    .attr('height', 15)
    .attr('fill', 'green');

    legend.append('text')
    .attr('x', 35)
    .attr('y', 52)
    .style('font-size', '14px')
    .style('font-family', 'Arial, sans-serif')
    .text('2022 Housing Burden');



    // **** Your JavaScript code goes here ****
    svg.append('text')
        .attr('class', 'title')  
        .attr('x', 500) 
        .attr('y', 30)           
        .attr('text-anchor', 'middle')  
        .style('font-size', '24px') 
        .style('font-weight', 'bold')
        .text('Global Housing Burden: A Comparison of 2015 vs. 2022');

    var xAxisBottom = d3.axisBottom(widthScale)
    .ticks(0);


    chartG.append('g')
        .attr('class', 'x-axis-bottom')
        .attr('transform', `translate(0, ${chartHeight})`) 
        .call(xAxisBottom);

    // Create a left vertical axis using widthScale
    var yAxisLeft = d3.axisLeft(HeightScale)
    .ticks(9) // 원하는 만큼의 틱 개수 설정
    .tickFormat(d => d + '%'); // 값에 포맷 추가 (예: % 기호)

    // Append the left vertical axis to the chart
    chartG.append('g')
    .attr('class', 'y-axis-left')
    .attr('transform', `translate(0, 0)`) // 왼쪽에 축 위치
    .call(yAxisLeft);


    // Update the chart for all countries to initialize
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

    // Compute the spacing for bar bands based on the number of countries (20 in this case)
    var barBand = chartWidth / filteredCountries.length;
    var barHeight = barBand * 0.6;

    // Bar width adjustment for two bars per country
    var barSpacing = barBand * 0.2; // Spacing between bars
    var individualBarWidth = (barBand - barSpacing) / 2;

    // Bars for house2015
    var bars2015 = chartG.selectAll('.bar2015')
        .data(filteredCountries, d => d.country);

    var bars2015Enter = bars2015.enter()
        .append('rect')
        .attr('class', 'bar2015')
        .attr('x', (d, i) => i * barBand + barSpacing) // bar2015 x position
        .attr('y', chartHeight) // 초기 위치
        .attr('width', individualBarWidth) // 두께 조정
        .attr('height', 0) // 초기 높이
        .attr('fill', 'lightgreen');

    bars2015Enter.merge(bars2015)
        .transition()
        .duration(500)
        .attr('x', (d, i) => i * barBand + barSpacing) // 바 위치
        .attr('y', d => HeightScale(d.house2015)) // 높이에 따라 위치 변경
        .attr('height', d => chartHeight - HeightScale(d.house2015)) // 값에 따라 바의 길이 설정
        .attr('width', individualBarWidth) // 바 두께 유지
        .style('display', yearFilter === '2015' || yearFilter === 'both' ? 'block' : 'none'); 

    //add hover 
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
    //add hover
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

    // Bars for house2022
    var bars2022 = chartG.selectAll('.bar2022')
        .data(filteredCountries, d => d.country);

    var bars2022Enter = bars2022.enter()
        .append('rect')
        .attr('class', 'bar2022')
        .attr('x', (d, i) => i * barBand+ + barSpacing+individualBarWidth) // 가로 방향으로 나열
        .attr('y', chartHeight) // 초기 위치
        .attr('width', individualBarWidth) // 두께 조정
        .attr('height', 0) // 초기 높이
        .attr('fill', 'green');

    bars2022Enter.merge(bars2022)
        .transition()
        .duration(500)
        .attr('x', (d, i) => i * barBand+ + barSpacing+individualBarWidth) // 바 위치
        .attr('y', d => HeightScale(d.house2022)) // 높이에 따라 위치 변경
        .attr('height', d => chartHeight - HeightScale(d.house2022)) // 값에 따라 바의 길이 설정
        .attr('width', individualBarWidth) // 바 두께 유지
        .style('display', yearFilter === '2022' || yearFilter === 'both' ? 'block' : 'none'); // 2022 표시 조건

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
    


    // Handle the text labels for each country
var labels = chartG.selectAll('.label')
.data(filteredCountries, d => d.country);

var labelsEnter = labels.enter()
.append('text')
.attr('class', 'label')
.attr('text-anchor', 'front') // 끝을 기준으로 회전
.attr('transform', (d, i) => {
    const x = i*barBand+barSpacing; // X 위치
    const y = chartHeight + 10; // Y 위치
    return `translate(${x}, ${y}) rotate(-45)`; // 텍스트 회전
})
.text(d => d.country);

labelsEnter.merge(labels)
.transition()
.duration(500)
.attr('transform', (d, i) => {
    const x = i*barBand+barSpacing; // X 위치
    const y = chartHeight + 10; // Y 위치
    return `translate(${x}, ${y}) rotate(45)`; // 텍스트 회전
});

labels.exit().remove();

d3.select('#filter-button').on('click', function() {
    var cutoffValue = parseFloat(d3.select('#cutoff').property('value')) || 0;
    var yearFilter = d3.select('#yearSelect').node().value;
    updateChart(currentFilterKey, cutoffValue, yearFilter);
});

}


