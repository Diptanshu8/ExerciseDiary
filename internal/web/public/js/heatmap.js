function lowerData(heat) {
    console.log("Raw heat data:", heat); // Debug raw data
    var ldata = [];
    let arrayLength = heat.length;
    for (let i = 0 ; i < arrayLength; i++) {
        let val = heat[i];
        // Ensure Colors and WorkoutNames are properly initialized
        const colors = val.Colors || [];
        const workoutNames = val.WorkoutNames || [];
        
        ldata.push({
            x: val.X,
            y: val.Y,
            d: val.D,
            v: val.V,
            Color: val.Color || '',
            Colors: colors,
            WorkoutNames: workoutNames
        });
    }
    // console.log('LDATA =', ldata);
    return ldata;
};

function makeIntensityChart(heat, hcolor, sets) {
    let ldata = lowerData(heat);
    var ctx = document.getElementById('intensity-chart').getContext('2d');
    window.intensityChart = new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: 'Intensity Heatmap',
                data: ldata,
                backgroundColor(context) {
                    const value = context.dataset.data[context.dataIndex].v;
                    const alpha = value / 10;
                    return Chart.helpers.color(hcolor).alpha(alpha).rgbString();
                },
                borderColor(context) {
                    const value = context.dataset.data[context.dataIndex].v;
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
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function makeColorChart(heat, sets) {
    let ldata = lowerData(heat);
    console.log("Color chart data:", ldata); // Debug the data
    var ctx = document.getElementById('color-chart').getContext('2d');
    
    window.colorChart = new Chart(ctx, {
        type: 'matrix',
        data: {
            datasets: [{
                label: 'Color Heatmap',
                data: ldata,
                backgroundColor(context) {
                    const data = context.dataset.data[context.dataIndex];
                    if (!data) {
                        console.log("No data for this cell");
                        return 'rgba(200, 200, 200, 0.1)';
                    }
                    
                    // Debug this specific cell
                    console.log("Cell data:", data);
                    
                    // If we have multiple colors, create a CSS gradient
                    if (data.Colors && data.Colors.length > 0) {
                        // Get the canvas context to draw a custom background
                        const ctx = context.chart.ctx;
                        const rect = context.chart.canvas.getBoundingClientRect();
                        
                        // Make sure element exists before accessing its properties
                        if (!context.element) {
                            console.log("No element for this context");
                            return 'rgba(200, 200, 200, 0.1)';
                        }
                        
                        const x = context.element.x;
                        const y = context.element.y;
                        const width = context.element.width;
                        const height = context.element.height;
                        
                        // Create a gradient for multiple colors
                        if (data.Colors.length > 1) {
                            try {
                                const gradient = ctx.createLinearGradient(x, y, x + width, y);
                                const step = 1.0 / data.Colors.length;
                                
                                data.Colors.forEach((color, index) => {
                                    gradient.addColorStop(index * step, color);
                                    gradient.addColorStop((index + 1) * step, color);
                                });
                                
                                return gradient;
                            } catch (e) {
                                console.error("Error creating gradient:", e);
                                return 'rgba(200, 200, 200, 0.1)';
                            }
                        } else {
                            // Just one color
                            return data.Colors[0];
                        }
                    }
                    
                    // For cells with no workouts
                    return 'rgba(200, 200, 200, 0.1)';
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
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].raw.d; // Show date as title
                        },
                        label: function(tooltipItem) {
                            const data = tooltipItem.raw;
                            if (data.Colors && data.Colors.length > 0) {
                                return `${data.Colors.length} workout${data.Colors.length > 1 ? 's' : ''} on this day`;
                            }
                            return 'No workouts';
                        },
                        afterLabel: function(tooltipItem) {
                            const data = tooltipItem.raw;
                            // We can't directly add HTML in tooltip callbacks,
                            // but we can return an array of strings to create multiple lines
                            if (data.Colors && data.Colors.length > 0) {
                                const lines = [];
                                data.Colors.forEach((color, index) => {
                                    const workoutName = data.WorkoutNames && data.WorkoutNames[index] ? data.WorkoutNames[index] : 'Unknown';
                                    lines.push(`${workoutName}: ${color}`);
                                });
                                return lines;
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}
