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
                background: rgba(255, 255, 255, 0.95);
                border: 1px solid rgba(0, 0, 0, 0.1);
                border-radius: 4px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                color: #333;
                opacity: 0;
                padding: 6px 10px;
                pointer-events: none;
                position: fixed;
                transform: translate(-50%, 0);
                transition: all .1s ease;
                z-index: 10000;
                font-size: 13px;
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
    
    // Show only the date without any wrapping div
    tooltipEl.innerHTML = `${dayOfWeek}, ${data.d}`;

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
                selectedDate: null,
                backgroundColor(context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    const date = context.dataset.data[context.dataIndex].d;
                    
                    // Highlight selected date
                    if (date === this.selectedDate) {
                        return 'rgba(255, 255, 0, 0.5)'; // Yellow highlight
                    }
                    
                    if (value === 0) {
                        return 'rgba(200, 200, 200, 0.1)';
                    }
                    
                    const alpha = value / 10;
                    return Chart.helpers.color(hcolor).alpha(alpha).rgbString();
                },
                borderColor(context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    const date = context.dataset.data[context.dataIndex].d;
                    const alpha = date === this.selectedDate ? 1 : 0.5;
                    
                    if (value === 0) {
                        return 'rgba(200, 200, 200, 0.1)';
                    }
                    
                    return Chart.helpers.color('grey').alpha(alpha).rgbString();
                },
                width: ({ chart }) => (chart.chartArea || {}).width / 53 - 1.5,
                height: ({ chart }) => (chart.chartArea || {}).height / 7 - 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 10
            },
            onClick: function(event, elements) {
                if (elements && elements.length > 0) {
                    const clickedElement = elements[0];
                    const date = this.data.datasets[0].data[clickedElement.index].d;
                    
                    // Update selected date for both charts
                    this.data.datasets[0].selectedDate = date;
                    if (window.colorChart) {
                        window.colorChart.data.datasets[0].selectedDate = date;
                        window.colorChart.update();
                    }
                    this.update();
                    
                    // Update the workout section
                    setFormContent(sets, date);
                }
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
    window.colorChart = new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: 'Color Heatmap',
                data: ldata,
                selectedDate: null,
                backgroundColor(context) {
                    const data = context.dataset.data[context.dataIndex];
                    const date = data.d;
                    
                    // Highlight selected date
                    if (date === this.selectedDate) {
                        return 'rgba(255, 255, 0, 0.5)'; // Yellow highlight
                    }
                    
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
                    const data = context.dataset.data[context.dataIndex];
                    const date = data.d;
                    const alpha = date === this.selectedDate ? 1 : 0.5;
                    
                    if (!data || !data.Colors || data.Colors.length === 0) {
                        return 'rgba(200, 200, 200, 0.1)';
                    }
                    
                    return Chart.helpers.color('grey').alpha(alpha).rgbString();
                },
                width: ({ chart }) => (chart.chartArea || {}).width / 53 - 1.5,
                height: ({ chart }) => (chart.chartArea || {}).height / 7 - 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 10
            },
            onClick: function(event, elements) {
                if (elements && elements.length > 0) {
                    const clickedElement = elements[0];
                    const date = this.data.datasets[0].data[clickedElement.index].d;
                    
                    // Update selected date for both charts
                    this.data.datasets[0].selectedDate = date;
                    if (window.intensityChart) {
                        window.intensityChart.data.datasets[0].selectedDate = date;
                        window.intensityChart.update();
                    }
                    this.update();
                    
                    // Update the workout section
                    setFormContent(sets, date);
                }
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
                        const ctx = chart.ctx;
                        const gradient = ctx.createLinearGradient(
                            element.x, 
                            element.y, 
                            element.x + element.width, 
                            element.y
                        );
                        
                        const step = 1.0 / data.Colors.length;
                        data.Colors.forEach((color, colorIndex) => {
                            gradient.addColorStop(colorIndex * step, color);
                            gradient.addColorStop((colorIndex + 1) * step, color);
                        });
                        
                        ctx.save();
                        ctx.fillStyle = gradient;
                        ctx.fillRect(element.x, element.y, element.width, element.height);
                        ctx.restore();
                    }
                });
            }
        }]
    });
}
