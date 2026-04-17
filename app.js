/**
 * Main Application Logic with Animation Support
 */

// Animation state for each algorithm
const animationState = {
    fifo: {
        isPlaying: false,
        currentStep: 0,
        speed: 1000,
        result: null,
        interval: null
    },
    lru: {
        isPlaying: false,
        currentStep: 0,
        speed: 1000,
        result: null,
        interval: null
    },
    optimal: {
        isPlaying: false,
        currentStep: 0,
        speed: 1000,
        result: null,
        interval: null
    }
};

document.addEventListener('DOMContentLoaded', function() {
    const simulateBtn = document.getElementById('simulateBtn');
    const pageRefInput = document.getElementById('pageRefString');
    const numFramesInput = document.getElementById('numFrames');

    simulateBtn.addEventListener('click', function() {
        try {
            clearError();
            const pageRefString = pageRefInput.value.trim();
            const numFrames = parseInt(numFramesInput.value);

            // Validate input
            if (!pageRefString) {
                showError('Please enter a page reference string');
                return;
            }

            if (isNaN(numFrames) || numFrames < 1) {
                showError('Number of frames must be at least 1');
                return;
            }

            // Parse and validate page reference string
            const pages = pageRefString.split(',');
            for (let page of pages) {
                if (isNaN(parseInt(page.trim()))) {
                    showError('Invalid page reference string. Please use comma-separated numbers.');
                    return;
                }
            }

            // Run simulations
            const simulator = new PageReplacementSimulator(pageRefString, numFrames);
            
            const fifoResult = simulator.fifo();
            const lruResult = simulator.lru();
            const optimalResult = simulator.optimal();

            // Store results for animation
            animationState.fifo.result = fifoResult;
            animationState.lru.result = lruResult;
            animationState.optimal.result = optimalResult;

            // Reset animations
            animationState.fifo.currentStep = 0;
            animationState.lru.currentStep = 0;
            animationState.optimal.currentStep = 0;

            // Display results
            displayResults(fifoResult, lruResult, optimalResult, pages.length);
            drawComparisonChart(fifoResult.totalFaults, lruResult.totalFaults, optimalResult.totalFaults);

            // Initialize tables
            initializeTable('fifo', fifoResult, pages.length);
            initializeTable('lru', lruResult, pages.length);
            initializeTable('optimal', optimalResult, pages.length);

        } catch (error) {
            showError('Error: ' + error.message);
        }
    });

    // Allow simulation on Enter key
    pageRefInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') simulateBtn.click();
    });
});

/**
 * Initialize table with all steps
 */
function initializeTable(algorithmName, result, totalPages) {
    const faultRate = ((result.totalFaults / totalPages) * 100).toFixed(2);
    
    const table = document.getElementById(algorithmName + 'Table');
    table.innerHTML = '';

    // Create header
    const thead = table.createTHead();
    const headerRow = thead.insertRow();
    const headers = ['Step', 'Page Reference', 'Frame Status', 'Page Fault', 'Total Faults'];
    
    headers.forEach(header => {
        const th = document.createElement('th');
        th.textContent = header;
        headerRow.appendChild(th);
    });

    // Create body
    const tbody = table.createTBody();
    result.steps.forEach((step, index) => {
        const row = tbody.insertRow();
        row.id = `${algorithmName}-step-${index}`;

        // Step number
        const stepCell = row.insertCell();
        stepCell.textContent = index + 1;

        // Page reference
        const pageCell = row.insertCell();
        pageCell.textContent = step.page;

        // Frame status
        const frameCell = row.insertCell();
        const frameDisplay = step.frames
            .map(f => f === -1 ? '-' : f)
            .join(' | ');
        frameCell.innerHTML = `<span class="frame-status">${frameDisplay}</span>`;

        // Page fault status
        const faultCell = row.insertCell();
        const faultText = step.isFault ? 'FAULT' : 'HIT';
        const faultClass = step.isFault ? 'fault' : 'hit';
        faultCell.innerHTML = `<span class="${faultClass}">${faultText}</span>`;

        // Total faults
        const totalCell = row.insertCell();
        totalCell.textContent = step.faults;
    });

    // Update step counter
    document.getElementById(algorithmName + 'Step').textContent = `0/${result.steps.length}`;
}

/**
 * Play animation for an algorithm
 */
function playAnimation(algorithmName) {
    const state = animationState[algorithmName];
    
    if (state.isPlaying || !state.result) return;

    state.isPlaying = true;
    document.getElementById(algorithmName + 'PlayBtn').style.display = 'none';
    document.getElementById(algorithmName + 'PauseBtn').style.display = 'inline-block';

    const stepDuration = state.speed;

    state.interval = setInterval(() => {
        const result = state.result;
        
        if (state.currentStep < result.steps.length) {
            // Remove previous highlight
            if (state.currentStep > 0) {
                const prevRow = document.getElementById(`${algorithmName}-step-${state.currentStep - 1}`);
                if (prevRow) {
                    prevRow.classList.remove('current-step', 'fault-step', 'hit-step');
                }
            }

            // Highlight current step
            const currentRow = document.getElementById(`${algorithmName}-step-${state.currentStep}`);
            if (currentRow) {
                currentRow.classList.add('current-step');
                const step = result.steps[state.currentStep];
                if (step.isFault) {
                    currentRow.classList.add('fault-step');
                } else {
                    currentRow.classList.add('hit-step');
                }
                currentRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            // Update progress bar
            const progress = ((state.currentStep + 1) / result.steps.length) * 100;
            document.getElementById(algorithmName + 'Progress').style.width = progress + '%';

            // Update step counter
            document.getElementById(algorithmName + 'Step').textContent = 
                `${state.currentStep + 1}/${result.steps.length}`;

            state.currentStep++;
        } else {
            // Animation complete
            pauseAnimation(algorithmName);
            document.getElementById(algorithmName + 'Progress').style.width = '100%';
        }
    }, stepDuration);
}

/**
 * Pause animation
 */
function pauseAnimation(algorithmName) {
    const state = animationState[algorithmName];
    
    state.isPlaying = false;
    clearInterval(state.interval);
    
    document.getElementById(algorithmName + 'PlayBtn').style.display = 'inline-block';
    document.getElementById(algorithmName + 'PauseBtn').style.display = 'none';
}

/**
 * Reset animation
 */
function resetAnimation(algorithmName) {
    pauseAnimation(algorithmName);
    
    const state = animationState[algorithmName];
    state.currentStep = 0;

    // Remove all highlights
    const table = document.getElementById(algorithmName + 'Table');
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
        row.classList.remove('current-step', 'fault-step', 'hit-step');
    });

    // Reset progress bar
    document.getElementById(algorithmName + 'Progress').style.width = '0%';

    // Reset step counter
    if (state.result) {
        document.getElementById(algorithmName + 'Step').textContent = `0/${state.result.steps.length}`;
    }
}

/**
 * Set animation speed
 */
function setSpeed(algorithmName, speedValue) {
    animationState[algorithmName].speed = parseInt(speedValue);
}

/**
 * Display simulation results and update all stats
 */
function displayResults(fifoResult, lruResult, optimalResult, totalPages) {
    const resultsSection = document.getElementById('resultsSection');
    resultsSection.style.display = 'block';

    // Update statistics for all algorithms
    updateAlgorithmStats('fifo', fifoResult, totalPages);
    updateAlgorithmStats('lru', lruResult, totalPages);
    updateAlgorithmStats('optimal', optimalResult, totalPages);

    // Scroll to results
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Update algorithm statistics
 */
function updateAlgorithmStats(algorithmName, result, totalPages) {
    const faultRate = ((result.totalFaults / totalPages) * 100).toFixed(2);
    
    document.getElementById(algorithmName + 'Faults').textContent = result.totalFaults;
    document.getElementById(algorithmName + 'Rate').textContent = faultRate + '%';
}


/**
 * Draw comparison chart
 */
function drawComparisonChart(fifoFaults, lruFaults, optimalFaults) {
    const canvas = document.getElementById('comparisonChart');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 400;

    const chartData = [
        { name: 'FIFO', faults: fifoFaults, color: '#FF6B6B' },
        { name: 'LRU', faults: lruFaults, color: '#4ECDC4' },
        { name: 'Optimal', faults: optimalFaults, color: '#45B7D1' }
    ];

    drawBarChart(ctx, chartData, canvas.width, canvas.height);
}

/**
 * Draw bar chart using Canvas
 */
function drawBarChart(ctx, data, width, height) {
    const padding = 60;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Find max value for scaling
    const maxFaults = Math.max(...data.map(d => d.faults));
    const scale = chartHeight / (maxFaults * 1.2);

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.stroke();

    // Draw bars
    const barWidth = chartWidth / data.length * 0.6;
    const spacing = chartWidth / data.length;

    data.forEach((item, index) => {
        const barHeight = item.faults * scale;
        const x = padding + index * spacing + (spacing - barWidth) / 2;
        const y = height - padding - barHeight;

        // Draw bar
        ctx.fillStyle = item.color;
        ctx.fillRect(x, y, barWidth, barHeight);

        // Draw border
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, barWidth, barHeight);

        // Draw value on top
        ctx.fillStyle = '#333';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.faults, x + barWidth / 2, y - 10);

        // Draw label
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(item.name, x + barWidth / 2, height - padding + 25);
    });

    // Draw Y-axis label
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillStyle = '#666';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Page Faults', 0, 0);
    ctx.restore();

    // Draw title
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Page Faults Comparison', width / 2, 30);

    // Draw Y-axis scale
    ctx.fillStyle = '#999';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = Math.floor((maxFaults * 1.2 / 5) * i);
        const y = height - padding - (i / 5) * chartHeight;
        ctx.fillText(value, padding - 10, y + 5);
    }
}

/**
 * Show error message
 */
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = '⚠ ' + message;
    errorDiv.style.display = 'block';
}

/**
 * Clear error message
 */
function clearError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
}
