var wChart = null;

function splitWeight(weight, show) {
    var dates = [];
    var ws = [];

    weight = weight.slice(show)
    let arrayLength = weight.length;
    for (let i = 0 ; i < arrayLength; i++) {
        dates.push(weight[i].Date);
        ws.push(weight[i].Weight);
    }
    // console.log('LDATA =', dates, ws);
    return { dates, ws };
};

function weightChart(id, dates, ws, wcolor, xticks) {
    const ctx = document.getElementById(id);
    const trendData = calculateTrendLine(dates, ws);

    if (wChart) {
        wChart.clear();
        wChart.destroy();
    }

    wChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    type: 'line',
                    label: 'Weight',
                    data: ws,
                    borderColor: wcolor,
                    backgroundColor: wcolor + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.1,
                    order: 2
                },
                {
                    type: 'line',
                    label: 'Trend',
                    data: trendData,
                    borderColor: '#FF6384',
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0.4,
                    order: 1
                }
            ]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    ticks: {
                        display: xticks
                    }
                },
                y: {
                    beginAtZero: false
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `Weight: ${context.raw}`;
                            } else {
                                return `Trend: ${context.raw.toFixed(1)}`;
                            }
                        }
                    }
                }
            }
        }
    });
}

function calculateTrendLine(dates, values) {
    const xPoints = dates.map((d, i) => i);
    const n = dates.length;
    
    // Calculate means
    const meanX = xPoints.reduce((a, b) => a + b, 0) / n;
    const meanY = values.reduce((a, b) => a + b, 0) / n;
    
    // Calculate slope and intercept
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n; i++) {
        numerator += (xPoints[i] - meanX) * (values[i] - meanY);
        denominator += Math.pow(xPoints[i] - meanX, 2);
    }
    
    const slope = denominator !== 0 ? numerator / denominator : 0;
    const intercept = meanY - slope * meanX;
    
    // Generate trend line points
    return xPoints.map(x => slope * x + intercept);
}

function generateWeightChart(weight, wcolor, show) {
  if (weight) {
    let { dates, ws } = splitWeight(weight, show);

    weightChart('weight-chart', dates, ws, wcolor, false);
  };
};