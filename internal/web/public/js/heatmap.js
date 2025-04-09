// Shared tooltip element for both charts
let sharedTooltipEl = null;

function createSharedTooltip() {
    if (!sharedTooltipEl) {
        sharedTooltipEl = document.createElement('div');
        sharedTooltipEl.id = 'shared-heatmap-tooltip';
        document.body.appendChild(sharedTooltipEl);

        // Add CSS for the shared tooltip
        const style = document.createElement('style');
        style.textContent = `
            #shared-heatmap-tooltip {
                background: rgba(0, 0, 0, 0.8);
                border-radius: 4px;
                color: white;
                opacity: 0;
                padding: 10px;
                pointer-events: none;
                position: fixed;
                transform: translate(-50%, 0);
                transition: all .1s ease;
                z-index: 10000;
                max-width: 300px;
            }
            .tooltip-title {
                font-weight: bold;
                margin-bottom: 6px;
                border-bottom: 1px solid rgba(255,255,255,0.3);
                padding-bottom: 4px;
            }
            .tooltip-section {
                margin-top: 8px;
            }
            .tooltip-section-title {
                font-weight: bold;
                color: #aaa;
                font-size: 0.9em;
            }
            .tooltip-body {
                margin-top: 4px;
                font-size: 14px;
            }
        `;
        document.head.appendChild(style);
    }
    return sharedTooltipEl;
}

function updateSharedTooltip(chart, context, data) {
    const tooltipEl = createSharedTooltip();
    const tooltipModel = context.tooltip;
    
    // Hide if no tooltip
    if (tooltipModel.opacity === 0) {
        tooltipEl.style.opacity = 0;
        return;
    }

    // Get the date for this cell
    const dateObj = new Date(data.d);
    const dayOfWeek = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
    
    // Get data from both charts for this date
    const intensityData = window.intensityChart.data.datasets[0].data.find(d => d.d === data.d);
    const colorData = window.colorChart.data.datasets[0].data.find(d => d.d === data.d);
    
    let html = `<div class="tooltip-title">${dayOfWeek}, ${data.d}</div>`;

    if (!intensityData?.v && !colorData?.Colors?.length) {
        html += '<div class="tooltip-body">No workouts on this day</div>';
    } else {
        // Intensity Section
        if (intensityData) {
            html += '<div class="tooltip-section">';
            html += '<div class="tooltip-section-title">Intensity</div>';
            if (intensityData.v === 0) {
                html += '<div class="tooltip-body">No workouts</div>';
            } else {
                const workoutCount = window.workoutCountByDate?.[data.d] || 0;
                if (workoutCount > 1) {
                    html += `<div class="tooltip-body">Total intensity: ${intensityData.v} (from ${workoutCount} workouts)</div>`;
                } else {
                    html += `<div class="tooltip-body">Workout intensity: ${intensityData.v}</div>`;
                }
                
                // Add intensity description
                let intensityDesc = '';
                if (intensityData.v === 1) {
                    intensityDesc = 'Single workout with minimal intensity';
                } else if (intensityData.v < 4) {
                    intensityDesc = 'Light workout day';
                } else if (intensityData.v < 7) {
                    intensityDesc = 'Moderate workout day';
                } else if (intensityData.v < 10) {
                    intensityDesc = 'Intense workout day';
                } else {
                    intensityDesc = 'Very intense or multiple workouts';
                }
                html += `<div class="tooltip-body">${intensityDesc}</div>`;
            }
            html += '</div>';
        }

        // Workouts Section
        if (colorData?.Colors?.length) {
            html += '<div class="tooltip-section">';
            html += '<div class="tooltip-section-title">Workouts</div>';
            html += `<div class="tooltip-body">${colorData.Colors.length} workout${colorData.Colors.length > 1 ? 's' : ''}</div>`;
            
            // List all workouts with their details
            colorData.WorkoutNames.forEach((name, index) => {
                const intensity = colorData.WorkoutIntensities[index];
                const weight = colorData.WorkoutWeights[index];
                const reps = colorData.WorkoutReps[index];
                
                html += '<div class="tooltip-body">';
                html += `• ${name}`;
                if (weight !== "0") html += ` (${weight}kg)`;
                if (reps > 0) html += ` × ${reps}`;
                if (intensity > 0) html += ` [Intensity: ${intensity}]`;
                html += '</div>';
            });
            html += '</div>';
        }
    }

    tooltipEl.innerHTML = html;

    // Position the tooltip
    const position = context.chart.canvas.getBoundingClientRect();
    tooltipEl.style.opacity = 1;
    tooltipEl.style.position = 'fixed';
    tooltipEl.style.left = position.left + window.pageXOffset + tooltipModel.caretX + 'px';
    tooltipEl.style.top = position.top + window.pageYOffset + tooltipModel.caretY + 'px';
}

function lowerData(heat) {
    console.log("Raw heat data:", heat); // Debug raw data
    var ldata = [];
    let arrayLength = heat.length;
    for (let i = 0 ; i < arrayLength; i++) {
        let val = heat[i];
        // Ensure arrays are properly initialized
        const colors = val.Colors || [];
        const workoutNames = val.WorkoutNames || [];
        const workoutIntensities = val.WorkoutIntensities || [];
        const workoutWeights = val.WorkoutWeights || [];
        const workoutReps = val.WorkoutReps || [];
        
        ldata.push({
            x: val.X,
            y: val.Y,
            d: val.D,
            v: val.V,
            Color: val.Color || '',
            Colors: colors,
            WorkoutNames: workoutNames,
            WorkoutIntensities: workoutIntensities,
            WorkoutWeights: workoutWeights,
            WorkoutReps: workoutReps
        });
    }
    // console.log('LDATA =', ldata);
    return ldata;
};

function makeIntensityChart(heat, hcolor, sets) {
    let ldata = lowerData(heat);
    
    // Create a map of dates to number of workouts
    window.workoutCountByDate = {};
    if (sets && sets.length > 0) {
        sets.forEach(set => {
            if (!window.workoutCountByDate[set.Date]) {
                window.workoutCountByDate[set.Date] = 0;
            }
            window.workoutCountByDate[set.Date]++;
        });
    }
    
    var ctx = document.getElementById('intensity-chart').getContext('2d');
    window.intensityChart = new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: 'Intensity Heatmap',
                data: ldata,
                backgroundColor(context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    
                    if (value === 0) {
                        return 'rgba(200, 200, 200, 0.1)';
                    }
                    
                    const alpha = value / 10;
                    return Chart.helpers.color(hcolor).alpha(alpha).rgbString();
                },
                borderColor(context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    const alpha = 0.5;
                    
                    if (value === 0) {
                        return 'rgba(200, 200, 200, 0.1)';
                    }
                    
                    return Chart.helpers.color('grey').alpha(alpha).rgbString();
                },
                width: ({ chart }) => (chart.chartArea || {}).width / 52 - 1,
                height: ({ chart }) => (chart.chartArea || {}).height / 7 - 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 10
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false,
                    external: function(context) {
                        if (context.tooltip.dataPoints && context.tooltip.dataPoints.length > 0) {
                            const data = context.tooltip.dataPoints[0].raw;
                            updateSharedTooltip(this, context, data);
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    labels: Array.from({length: 53}, (_, i) => i.toString()),
                    offset: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'category',
                    labels: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
                    offset: true,
                    grid: {
                        display: false
                    }
                }
            },
            onHover: function(event, elements) {
                // Hide tooltip when not hovering over any element
                if (!elements.length) {
                    const tooltipEl = document.getElementById('shared-heatmap-tooltip');
                    if (tooltipEl) tooltipEl.style.opacity = 0;
                }
            }
        }
    });
}

function makeColorChart(heat, sets) {
    let ldata = lowerData(heat);
    var ctx = document.getElementById('color-chart').getContext('2d');
    
    // Helper function to draw gradient for an element
    function drawGradientForElement(chart, element, colors) {
        const ctx = chart.ctx;
        const gradient = ctx.createLinearGradient(
            element.x, 
            element.y, 
            element.x + element.width, 
            element.y
        );
        
        const step = 1.0 / colors.length;
        colors.forEach((color, colorIndex) => {
            gradient.addColorStop(colorIndex * step, color);
            gradient.addColorStop((colorIndex + 1) * step, color);
        });
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(element.x, element.y, element.width, element.height);
        ctx.restore();
    }

    // Keep track of last hovered element
    let lastHoveredIndex = null;
    
    window.colorChart = new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: 'Color Heatmap',
                data: ldata,
                backgroundColor(context) {
                    const data = context.dataset.data[context.dataIndex];
                    if (!data || !data.Colors || data.Colors.length === 0) {
                        return 'rgba(200, 200, 200, 0.1)';
                    }
                    
                    // For single color, return it directly
                    if (data.Colors.length === 1) {
                        return data.Colors[0];
                    }
                    
                    // For multiple colors, return transparent to allow gradient to show
                    return 'rgba(0, 0, 0, 0)';
                },
                borderColor(context) {
                    const alpha = 0.5;
                    return Chart.helpers.color('grey').alpha(alpha).rgbString();
                },
                width: ({ chart }) => (chart.chartArea || {}).width / 52 - 1,
                height: ({ chart }) => (chart.chartArea || {}).height / 7 - 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 10
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false,
                    external: function(context) {
                        if (context.tooltip.dataPoints && context.tooltip.dataPoints.length > 0) {
                            const data = context.tooltip.dataPoints[0].raw;
                            updateSharedTooltip(this, context, data);
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'category',
                    labels: Array.from({length: 53}, (_, i) => i.toString()),
                    offset: true,
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'category',
                    labels: ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'],
                    offset: true,
                    grid: {
                        display: false
                    }
                }
            },
            onHover: function(event, elements) {
                // Hide tooltip when not hovering over any element
                if (!elements.length) {
                    const tooltipEl = document.getElementById('shared-heatmap-tooltip');
                    if (tooltipEl) tooltipEl.style.opacity = 0;
                }
            }
        },
        plugins: [{
            id: 'gradientDrawer',
            afterDatasetsDraw: function(chart) {
                const dataset = chart.data.datasets[0];
                const meta = chart.getDatasetMeta(0);
                
                meta.data.forEach((element, index) => {
                    const data = dataset.data[index];
                    if (data.Colors && data.Colors.length > 1) {
                        drawGradientForElement(chart, element, data.Colors);
                    }
                });
            }
        }]
    });
}
