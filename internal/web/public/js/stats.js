var sChart = null;
var sOffset = 0;
var distributionChart = null;
var currentPeriod = 'weekly';

function addSet(i, date, reps, weight) {
    html_code = '<tr><td style="opacity: 45%;">'+i+'.</td><td>'+date+'</td><td>'+reps+'</td><td>'+weight+'</td></tr>';
    document.getElementById('stats-table').insertAdjacentHTML('beforeend', html_code);
}

function calculateSummaryStats(sets, period = 'weekly') {
    const now = new Date();
    const periodStart = new Date(now);
    
    // Set period start date
    if (period === 'weekly') {
        periodStart.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
        periodStart.setMonth(now.getMonth() - 1);
    } else if (period === 'annual') {
        periodStart.setFullYear(now.getFullYear() - 1);
    }

    // Filter sets within the period
    const periodSets = sets.filter(set => {
        const setDate = new Date(set.Date);
        return setDate >= periodStart && setDate <= now;
    });

    // Calculate statistics
    const totalWorkouts = periodSets.length;
    const avgIntensity = periodSets.length > 0 
        ? (periodSets.reduce((sum, set) => sum + set.Intensity, 0) / periodSets.length).toFixed(1)
        : 0;

    // Find most and least common exercises
    const exerciseCounts = {};
    periodSets.forEach(set => {
        exerciseCounts[set.Name] = (exerciseCounts[set.Name] || 0) + 1;
    });
    
    let mostCommon = '-';
    let leastCommon = '-';
    let maxCount = 0;
    let minCount = Infinity;
    
    for (const [exercise, count] of Object.entries(exerciseCounts)) {
        if (count > maxCount) {
            mostCommon = exercise;
            maxCount = count;
        }
        if (count < minCount) {
            leastCommon = exercise;
            minCount = count;
        }
    }

    // If no exercises found, set leastCommon to '-'
    if (minCount === Infinity) {
        leastCommon = '-';
    }

    return {
        totalWorkouts,
        avgIntensity,
        mostCommon,
        leastCommon
    };
}

function updateSummaryDisplay(sets, period) {
    const stats = calculateSummaryStats(sets, period);
    
    // Update DOM elements
    document.getElementById('total-workouts').textContent = stats.totalWorkouts;
    document.getElementById('avg-intensity').textContent = stats.avgIntensity;
    document.getElementById('most-common').textContent = stats.mostCommon;
    document.getElementById('least-common').textContent = stats.leastCommon;
}

function toggleSummaryPeriod(period) {
    currentPeriod = period;
    
    // Update button states
    document.querySelectorAll('.btn-group .btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(period)) {
            btn.classList.add('active');
        }
    });

    // Filter sets based on selected period
    const now = new Date();
    const periodStart = new Date(now);
    
    if (period === 'weekly') {
        periodStart.setDate(now.getDate() - 7);
    } else if (period === 'monthly') {
        periodStart.setMonth(now.getMonth() - 1);
    } else if (period === 'annual') {
        periodStart.setFullYear(now.getFullYear() - 1);
    }

    // Filter sets within the period
    const periodSets = window.currentSets.filter(set => {
        const setDate = new Date(set.Date);
        return setDate >= periodStart && setDate <= now;
    });
    
    // Update summary stats and distribution chart
    updateSummaryDisplay(periodSets, period);
    updateExerciseDistribution(periodSets, window.exercises);
}

function calculateExerciseDistribution(sets) {
    let distribution = {};
    
    // Count occurrences of each exercise
    sets.forEach(set => {
        if (!distribution[set.Name]) {
            distribution[set.Name] = 0;
        }
        distribution[set.Name]++;
    });
    
    // Convert to arrays for Chart.js
    let labels = Object.keys(distribution);
    let data = Object.values(distribution);
    
    return { labels, data };
}

function updateExerciseDistribution(sets, exercises) {
    const { labels, data } = calculateExerciseDistribution(sets);
    
    if (distributionChart) {
        distributionChart.destroy();
    }

    // Create a map of exercise names to their colors
    const colorMap = {};
    exercises.forEach(ex => {
        colorMap[ex.Name] = ex.Color;
    });
    
    // Get colors for each label in the same order
    const colors = labels.map(label => colorMap[label] || '#CCCCCC'); // Fallback to gray if color not found
    
    const ctx = document.getElementById('exercise-distribution');
    distributionChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.label || '';
                            let value = context.raw || 0;
                            let total = context.dataset.data.reduce((a, b) => a + b, 0);
                            let percentage = ((value / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
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

function setStatsPage(sets, hcolor, off, step) {
    // Store sets globally for summary updates
    window.currentSets = sets;
    
    // Always update summary first with weekly period
    updateSummaryDisplay(sets, currentPeriod || 'weekly');
    
    let start = 0, end = 0;
    let dates = [], ws = [], reps = [], exs = []; 

    let ex = document.getElementById("ex-value").value;
    for (let i = 0; i < sets.length; i++) {
        if (sets[i].Name === ex) {
            exs.push(sets[i]);
        }
    }

    sOffset = sOffset + off;
    if (sOffset < 0) {
        sOffset = 0;
    }

    let arrayLength = exs.length;
    let move = step + sOffset*step;

    if (arrayLength > move) {
        start = arrayLength - move;
        end = start + step;
    } else {
        sOffset = sOffset - 1;
        if (arrayLength > step) {
            end = step;
        } else {
            end = arrayLength;
        }
    }

    document.getElementById('stats-table').innerHTML = "";

    for (let i = start ; i < end; i++) {
        addSet(i+1, exs[i].Date, exs[i].Reps, exs[i].Weight);
        dates.push(exs[i].Date);
        reps.push(exs[i].Reps);
        ws.push(exs[i].Weight);
    }

    // Update all charts
    statsChart('stats-reps', dates, reps, hcolor, true);
    weightChart('stats-weight', dates, ws, hcolor, true);
    updateExerciseDistribution(sets, window.exercises);
}

function statsChart(id, dates, ws, wcolor, xticks) {
    const ctx = document.getElementById(id);
    const trendData = calculateTrendLine(dates, ws);

    if (sChart) {
        sChart.clear();
        sChart.destroy();
    }

    sChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [
                {
                    type: 'bar',
                    label: 'Value',
                    data: ws,
                    borderColor: wcolor,
                    backgroundColor: wcolor + '80', // Add transparency
                    borderWidth: 1,
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
                                return `Value: ${context.raw}`;
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