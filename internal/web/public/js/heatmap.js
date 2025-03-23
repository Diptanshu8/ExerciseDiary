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
    const workoutCountByDate = {};
    if (sets && sets.length > 0) {
        sets.forEach(set => {
            if (!workoutCountByDate[set.Date]) {
                workoutCountByDate[set.Date] = 0;
            }
            workoutCountByDate[set.Date]++;
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
                },
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const data = tooltipItems[0].raw;
                            // Format date to show day of week
                            const dateObj = new Date(data.d);
                            const dayOfWeek = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
                            return `${dayOfWeek}, ${data.d}`;
                        },
                        label: function(tooltipItem) {
                            const data = tooltipItem.raw;
                            const intensity = data.v;
                            // If intensity is 0, no workouts
                            if (intensity === 0) {
                                return 'No workouts on this day';
                            }
                            
                            // Check how many workouts were done on this day
                            const workoutCount = workoutCountByDate[data.d] || 0;
                            if (workoutCount > 1) {
                                return `Total intensity: ${intensity} (from ${workoutCount} workouts)`;
                            }
                            
                            // The backend adds 1 to the intensity, so we need to adjust
                            return `Workout intensity: ${intensity}`;
                        },
                        afterLabel: function(tooltipItem) {
                            const data = tooltipItem.raw;
                            const intensity = data.v;
                            
                            // No additional information for days without workouts
                            if (intensity === 0) {
                                return '';
                            }
                            
                            // Describe the intensity level based on the adjusted value
                            // Note: backend adds 1 to each workout's intensity, so scale accordingly
                            if (intensity === 1) {
                                return 'Single workout with minimal intensity';
                            } else if (intensity < 4) {
                                return 'Light workout day';
                            } else if (intensity < 7) {
                                return 'Moderate workout day';
                            } else if (intensity < 10) {
                                return 'Intense workout day';
                            } else {
                                return 'Very intense or multiple workouts';
                            }
                        }
                    }
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
                            const data = tooltipItems[0].raw;
                            // Format date to show day of week (matching intensity chart format)
                            const dateObj = new Date(data.d);
                            const dayOfWeek = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
                            return `${dayOfWeek}, ${data.d}`;
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
                            if (data.Colors && data.Colors.length > 0 && data.WorkoutNames && data.WorkoutNames.length > 0) {
                                // Create a comma-separated list of all workouts
                                return data.WorkoutNames.join(', ');
                            }
                            return '';
                        }
                    }
                }
            }
        }
    });
}
