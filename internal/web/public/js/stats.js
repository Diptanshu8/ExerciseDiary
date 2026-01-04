var sChart = null;
var sOffset = 0;
var distributionChart = null;
var currentPeriod = 'weekly';

function addSet(i, date, intensity) {
    html_code = '<tr><td style="opacity: 45%;">'+i+'.</td><td>'+date+'</td><td>'+intensity+'</td></tr>';
    document.getElementById('stats-table').insertAdjacentHTML('beforeend', html_code);
}

function getPeriodDates(period) {
    const end = new Date();
    const start = new Date(end);
    
    if (period === 'weekly') {
        start.setDate(end.getDate() - 7);
    } else if (period === 'monthly') {
        start.setMonth(end.getMonth() - 1);
    } else if (period === 'annual') {
        start.setFullYear(end.getFullYear() - 1);
    }
    return { start, end };
}

function formatDate(date) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function calculateSummaryStats(sets, period = 'weekly') {
    const { start: periodStart, end: now } = getPeriodDates(period);

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

    const { start: periodStart, end: now } = getPeriodDates(period);

    // Update date range display
    const rangeText = `${formatDate(periodStart)} - ${formatDate(now)}`;
    const rangeEl = document.getElementById('period-range');
    if (rangeEl) {
        rangeEl.textContent = rangeText;
    }

    // Filter sets within the period
    const periodSets = window.currentSets.filter(set => {
        const setDate = new Date(set.Date);
        return setDate >= periodStart && setDate <= now;
    });

    // Get selected exercise
    const selectedEx = document.getElementById("ex-value").value;
    const exerciseSets = periodSets.filter(set => set.Name === selectedEx);
    
    // Extract dates, intensity and weights for the selected exercise
    const dates = exerciseSets.map(set => set.Date);
    const intensity = exerciseSets.map(set => set.Intensity);
    const weights = exerciseSets.map(set => set.Weight);
    
    // Get the heatmap color from the config
    const hcolor = document.querySelector('input[name="heatcolor"]')?.value || '#03a70c';
    
    // Update all charts and stats with period-filtered data
    updateSummaryDisplay(periodSets, period);
    updateExerciseDistribution(periodSets, window.exercises);
    updateIntensityChart('stats-intensity', dates, intensity, hcolor);
    weightChart('stats-weight', dates, weights, hcolor, true);
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

function setStatsPage(sets, hcolor, off, step) {
    // Store sets globally for summary updates
    window.currentSets = sets;
    
    // Filter data for current period on initial load and updates
    const { start: periodStart, end: now } = getPeriodDates(currentPeriod);

    // Update date range display
    const rangeText = `${formatDate(periodStart)} - ${formatDate(now)}`;
    const rangeEl = document.getElementById('period-range');
    if (rangeEl) {
        rangeEl.textContent = rangeText;
    }

    // Filter sets within the period
    const periodSets = sets.filter(set => {
        const setDate = new Date(set.Date);
        return setDate >= periodStart && setDate <= now;
    });
    
    let start = 0, end = 0;
    let dates = [], intensity = [], ws = [], exs = []; 

    let ex = document.getElementById("ex-value").value;
    for (let i = 0; i < periodSets.length; i++) {
        if (periodSets[i].Name === ex) {
            exs.push(periodSets[i]);
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
        addSet(i+1, exs[i].Date, exs[i].Intensity);
        dates.push(exs[i].Date);
        intensity.push(exs[i].Intensity);
        ws.push(exs[i].Weight);
    }

    // Update all charts with period-filtered data
    updateSummaryDisplay(periodSets, currentPeriod);
    updateIntensityChart('stats-intensity', dates, intensity, hcolor);
    weightChart('stats-weight', dates, ws, hcolor, true);
    updateExerciseDistribution(periodSets, window.exercises);
}

function updateIntensityChart(id, dates, intensity, color) {
    const ctx = document.getElementById(id);
    
    if (window.intensityChart) {
        window.intensityChart.destroy();
    }

    window.intensityChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                data: intensity,
                backgroundColor: color + '80', // Semi-transparent
                borderColor: color,
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10, // Since intensity is typically 1-10
                    grid: {
                        display: false
                    },
                    ticks: {
                        stepSize: 1
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Intensity: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function statsChart(id, dates, ws, wcolor, xticks) {
    const ctx = document.getElementById(id);

    if (sChart) {
        sChart.clear();
        sChart.destroy();
    }

    sChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: dates,
            datasets: [{
                data: ws,
                borderColor: wcolor,
                backgroundColor: wcolor + '80', // Add transparency
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    display: xticks,
                    grid: {
                        display: false
                    }
                },
                y: {
                    beginAtZero: true,
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
