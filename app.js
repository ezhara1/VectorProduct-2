// Statistics Canada Data Explorer with Netlify Functions
class StatCanExplorer {
    constructor() {
        this.products = [];
        this.selectedVectors = new Map();
        this.fetchedData = [];
        this.seriesInfo = {};
        this.cubeMetadata = {};
        this.currentVisualizationType = 'line';
        
        this.init();
    }

    async init() {
        await this.loadProducts();
        this.setupEventListeners();
        this.showEmptyState();
    }

    // Load products from data.json
    async loadProducts() {
        try {
            const response = await fetch('./data.json');
            this.products = await response.json();
            this.renderProductList();
        } catch (error) {
            console.error('Error loading products:', error);
            this.showToast('Failed to load products data', 'error');
        }
    }

    // Render product list in sidebar
    renderProductList() {
        const productList = document.getElementById('product-list');
        productList.innerHTML = '';

        this.products.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-header" onclick="window.statCanExplorer.toggleProduct('${product.productId}')">
                    <h3>${product.productId}</h3>
                    <p>${product.description}</p>
                    <i class="fas fa-chevron-down toggle-icon" id="toggle-${product.productId}"></i>
                </div>
                <div class="product-vectors" id="vectors-${product.productId}" style="display: none;">
                    ${product.vectors.map(vector => `
                        <div class="vector-item">
                            <span class="vector-text">${vector.text}</span>
                            <button class="btn btn-sm btn-outline vector-btn" 
                                    onclick="window.statCanExplorer.toggleVector('${vector.vectorId}', '${product.productId}', '${vector.text.replace(/'/g, '&apos;')}')">
                                <i class="fas fa-plus"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
            productList.appendChild(productCard);
        });
    }

    // Toggle product expansion
    toggleProduct(productId) {
        const vectorsDiv = document.getElementById(`vectors-${productId}`);
        const toggleIcon = document.getElementById(`toggle-${productId}`);
        
        if (vectorsDiv.style.display === 'none') {
            vectorsDiv.style.display = 'block';
            toggleIcon.style.transform = 'rotate(180deg)';
        } else {
            vectorsDiv.style.display = 'none';
            toggleIcon.style.transform = 'rotate(0deg)';
        }
    }

    // Toggle vector selection
    toggleVector(vectorId, productId, text) {
        if (this.selectedVectors.has(vectorId)) {
            this.selectedVectors.delete(vectorId);
            this.showToast(`Removed vector ${vectorId}`, 'info');
        } else {
            this.selectedVectors.set(vectorId, { vectorId, productId, text });
            this.showToast(`Added vector ${vectorId}`, 'success');
        }
        
        this.updateSelectedVectorsList();
        this.updateVectorButtons();
    }

    // Update selected vectors display
    updateSelectedVectorsList() {
        const selectedList = document.getElementById('selected-vectors-list');
        selectedList.innerHTML = '';

        this.selectedVectors.forEach((vector, vectorId) => {
            const vectorItem = document.createElement('div');
            vectorItem.className = 'selected-vector-item';
            vectorItem.innerHTML = `
                <div class="vector-info">
                    <strong>${vectorId}</strong>
                    <span>${vector.text}</span>
                </div>
                <button class="btn btn-sm btn-danger" onclick="window.statCanExplorer.removeVector('${vectorId}')">
                    <i class="fas fa-times"></i>
                </button>
            `;
            selectedList.appendChild(vectorItem);
        });

        // Update counter
        const counter = document.getElementById('selected-count');
        counter.textContent = this.selectedVectors.size;
    }

    // Remove vector from selection
    removeVector(vectorId) {
        this.selectedVectors.delete(vectorId);
        this.updateSelectedVectorsList();
        this.updateVectorButtons();
        this.showToast(`Removed vector ${vectorId}`, 'info');
    }

    // Update vector button states
    updateVectorButtons() {
        document.querySelectorAll('.vector-btn').forEach(btn => {
            const vectorId = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
            const icon = btn.querySelector('i');
            
            if (this.selectedVectors.has(vectorId)) {
                btn.className = 'btn btn-sm btn-primary vector-btn';
                icon.className = 'fas fa-check';
            } else {
                btn.className = 'btn btn-sm btn-outline vector-btn';
                icon.className = 'fas fa-plus';
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Fetch data button
        document.getElementById('fetch-btn').addEventListener('click', () => {
            this.fetchData();
        });

        // Clear selection button
        document.getElementById('clear-btn').addEventListener('click', () => {
            this.clearSelection();
        });

        // Visualization type buttons
        document.querySelectorAll('.viz-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const vizType = e.target.closest('.viz-btn').dataset.viz;
                this.setVisualizationType(vizType);
            });
        });

        // Export button
        document.getElementById('export-btn').addEventListener('click', () => {
            this.exportData();
        });

        // Fullscreen button
        document.getElementById('fullscreen-btn').addEventListener('click', () => {
            this.toggleFullscreen();
        });

        // Search functionality
        document.getElementById('search-input').addEventListener('input', (e) => {
            this.searchProducts(e.target.value);
        });
    }

    // Fetch data from Statistics Canada API via Netlify Functions
    async fetchData() {
        if (this.selectedVectors.size === 0) {
            this.showToast('Please select at least one vector', 'warning');
            return;
        }

        this.showLoading(true);
        this.hideEmptyState();

        const periods = parseInt(document.getElementById('periods-input').value) || 12;
        const requestData = Array.from(this.selectedVectors.keys()).map(vectorId => ({
            vectorId: vectorId,
            latestN: periods
        }));

        try {
            console.log('Attempting to fetch data for vectors:', requestData);
            
            // Use Netlify Function as API proxy
            const netlifyFunctionUrl = '/.netlify/functions/getDataFromVectors';
            
            console.log('Making request to Netlify Function:', netlifyFunctionUrl);
            
            const response = await fetch(netlifyFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Netlify Function successful:', data);
                this.processFetchedData(data);
                return;
            } else {
                const errorText = await response.text();
                console.error('Netlify Function failed:', response.status, errorText);
                throw new Error(`Netlify Function returned ${response.status}: ${errorText}`);
            }
            
        } catch (error) {
            console.error('Error fetching data from Statistics Canada API:', error);
            
            // Show the CORS limitation explanation
            this.showCorsLimitationDialog();
            
        } finally {
            this.showLoading(false);
        }
    }

    // Process fetched data
    processFetchedData(data) {
        this.fetchedData = data;
        console.log('Processing fetched data:', data);

        // Fetch additional metadata
        this.fetchSeriesInfo();
        
        // Get product ID from first selected vector for cube metadata
        const firstVector = Array.from(this.selectedVectors.values())[0];
        if (firstVector && firstVector.productId) {
            this.fetchCubeMetadata(firstVector.productId);
        }

        // Generate visualization
        this.generateVegaVisualization();
        this.generateTableView();
        
        this.showToast('Data fetched successfully!', 'success');
    }

    // Fetch cube metadata via Netlify Function
    async fetchCubeMetadata(productId) {
        try {
            const requestData = [{ productId: productId }];
            
            const netlifyFunctionUrl = '/.netlify/functions/getCubeMetadata';

            const response = await fetch(netlifyFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Received cube metadata:', data);
                
                if (Array.isArray(data) && data.length > 0 && data[0].status === "SUCCESS" && data[0].object) {
                    this.cubeMetadata = data[0].object;
                    this.updateChartMeta();
                } else {
                    console.log('Cube metadata response format unexpected:', data);
                }
            } else {
                const errorText = await response.text();
                console.error('Failed to fetch cube metadata:', response.status, errorText);
            }
        } catch (error) {
            console.error('Error fetching cube metadata:', error);
        }
    }

    // Fetch series information via Netlify Function
    async fetchSeriesInfo() {
        this.seriesInfo = {};
        
        // Get unique vector IDs from fetched data
        const vectorIds = this.fetchedData.map(item => {
            if (item.status === "SUCCESS" && item.object && item.object.vectorId) {
                return item.object.vectorId.toString();
            }
            return null;
        }).filter(id => id !== null);

        if (vectorIds.length === 0) {
            console.log('No vector IDs found in fetched data');
            return;
        }

        try {
            const requestData = vectorIds.map(vectorId => ({ vectorId: vectorId }));
            
            const netlifyFunctionUrl = '/.netlify/functions/getSeriesInfo';

            const response = await fetch(netlifyFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) {
                console.log('Could not fetch series info, using vector descriptions from data.json');
                this.useVectorDescriptionsAsFallback();
                return;
            }

            const data = await response.json();
            console.log('Received series info:', data);

            // Process the series info response
            if (Array.isArray(data)) {
                data.forEach(item => {
                    if (item.status === "SUCCESS" && item.object) {
                        const vectorId = item.object.vectorId;
                        this.seriesInfo[vectorId] = {
                            title: item.object.SeriesNameEn || `Vector ${vectorId}`,
                            description: item.object.SeriesNameEn || 'No description available'
                        };
                    }
                });
            }

            // If no series info was successfully parsed, use fallback
            if (Object.keys(this.seriesInfo).length === 0) {
                this.useVectorDescriptionsAsFallback();
            }

        } catch (error) {
            console.error('Error fetching series info:', error);
            this.useVectorDescriptionsAsFallback();
        }
    }

    // Use vector descriptions from data.json as fallback
    useVectorDescriptionsAsFallback() {
        Array.from(this.selectedVectors.values()).forEach(vector => {
            this.seriesInfo[vector.vectorId] = {
                title: vector.text,
                description: vector.text
            };
        });
    }

    // Generate Vega-Lite visualization
    generateVegaVisualization() {
        if (!this.fetchedData || this.fetchedData.length === 0) {
            console.log('No data available for visualization');
            return;
        }

        // Transform data for Vega-Lite
        const vegaData = [];
        
        this.fetchedData.forEach(item => {
            if (item.status === "SUCCESS" && item.object && item.object.vectorDataPoint) {
                const vectorId = item.object.vectorId;
                const seriesTitle = this.seriesInfo[vectorId]?.title || `Vector ${vectorId}`;
                
                item.object.vectorDataPoint.forEach(point => {
                    vegaData.push({
                        date: point.refPer,
                        value: parseFloat(point.value),
                        series: seriesTitle,
                        vectorId: vectorId
                    });
                });
            }
        });

        if (vegaData.length === 0) {
            console.log('No valid data points found for visualization');
            return;
        }

        // Create Vega-Lite specification based on visualization type
        let vegaSpec;
        
        switch (this.currentVisualizationType) {
            case 'line':
                vegaSpec = this.createLineChartSpec(vegaData);
                break;
            case 'scatter':
                vegaSpec = this.createScatterPlotSpec(vegaData);
                break;
            case 'bar':
                vegaSpec = this.createBarChartSpec(vegaData);
                break;
            default:
                vegaSpec = this.createLineChartSpec(vegaData);
        }

        // Render the visualization
        const container = document.getElementById('vega-container');
        container.innerHTML = '';
        
        vegaEmbed(container, vegaSpec, {
            theme: 'dark',
            renderer: 'svg',
            actions: {
                export: true,
                source: false,
                compiled: false,
                editor: false
            }
        }).then(result => {
            console.log('Vega visualization rendered successfully');
        }).catch(error => {
            console.error('Error rendering Vega visualization:', error);
        });

        // Show visualization container
        document.getElementById('visualization-container').style.display = 'block';
    }

    // Create line chart specification
    createLineChartSpec(data) {
        return {
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            description: "Statistics Canada Data Visualization",
            width: 800,
            height: 400,
            data: { values: data },
            mark: { type: "line", point: true, strokeWidth: 2 },
            encoding: {
                x: {
                    field: "date",
                    type: "temporal",
                    title: "Date",
                    axis: { labelAngle: -45 }
                },
                y: {
                    field: "value",
                    type: "quantitative",
                    title: "Value"
                },
                color: {
                    field: "series",
                    type: "nominal",
                    title: "Series",
                    scale: { scheme: "category10" }
                },
                tooltip: [
                    { field: "date", type: "temporal", title: "Date" },
                    { field: "value", type: "quantitative", title: "Value" },
                    { field: "series", type: "nominal", title: "Series" }
                ]
            }
        };
    }

    // Create scatter plot specification
    createScatterPlotSpec(data) {
        return {
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            description: "Statistics Canada Data Scatter Plot",
            width: 800,
            height: 400,
            data: { values: data },
            mark: { type: "circle", size: 100, opacity: 0.7 },
            encoding: {
                x: {
                    field: "date",
                    type: "temporal",
                    title: "Date",
                    axis: { labelAngle: -45 }
                },
                y: {
                    field: "value",
                    type: "quantitative",
                    title: "Value"
                },
                color: {
                    field: "series",
                    type: "nominal",
                    title: "Series",
                    scale: { scheme: "category10" }
                },
                tooltip: [
                    { field: "date", type: "temporal", title: "Date" },
                    { field: "value", type: "quantitative", title: "Value" },
                    { field: "series", type: "nominal", title: "Series" }
                ]
            }
        };
    }

    // Create bar chart specification
    createBarChartSpec(data) {
        // For bar chart, we'll use the latest data point for each series
        const latestData = {};
        data.forEach(d => {
            if (!latestData[d.series] || new Date(d.date) > new Date(latestData[d.series].date)) {
                latestData[d.series] = d;
            }
        });

        return {
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            description: "Statistics Canada Data Bar Chart",
            width: 800,
            height: 400,
            data: { values: Object.values(latestData) },
            mark: { type: "bar" },
            encoding: {
                x: {
                    field: "series",
                    type: "nominal",
                    title: "Series",
                    axis: { labelAngle: -45 }
                },
                y: {
                    field: "value",
                    type: "quantitative",
                    title: "Value"
                },
                color: {
                    field: "series",
                    type: "nominal",
                    scale: { scheme: "category10" }
                },
                tooltip: [
                    { field: "series", type: "nominal", title: "Series" },
                    { field: "value", type: "quantitative", title: "Value" },
                    { field: "date", type: "temporal", title: "Date" }
                ]
            }
        };
    }

    // Generate table view
    generateTableView() {
        const tableContainer = document.getElementById('table-container');
        
        if (!this.fetchedData || this.fetchedData.length === 0) {
            tableContainer.innerHTML = '<p>No data available</p>';
            return;
        }

        let tableHTML = `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Vector ID</th>
                        <th>Series</th>
                        <th>Date</th>
                        <th>Value</th>
                    </tr>
                </thead>
                <tbody>
        `;

        this.fetchedData.forEach(item => {
            if (item.status === "SUCCESS" && item.object && item.object.vectorDataPoint) {
                const vectorId = item.object.vectorId;
                const seriesTitle = this.seriesInfo[vectorId]?.title || `Vector ${vectorId}`;
                
                item.object.vectorDataPoint.forEach(point => {
                    tableHTML += `
                        <tr>
                            <td>${vectorId}</td>
                            <td>${seriesTitle}</td>
                            <td>${point.refPer}</td>
                            <td>${point.value}</td>
                        </tr>
                    `;
                });
            }
        });

        tableHTML += '</tbody></table>';
        tableContainer.innerHTML = tableHTML;
    }

    // Set visualization type
    setVisualizationType(type) {
        this.currentVisualizationType = type;
        
        // Update button states
        document.querySelectorAll('.viz-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-viz="${type}"]`).classList.add('active');
        
        // Regenerate visualization if we have data
        if (this.fetchedData && this.fetchedData.length > 0) {
            this.generateVegaVisualization();
        }
    }

    // Clear selection
    clearSelection() {
        this.selectedVectors.clear();
        this.updateSelectedVectorsList();
        this.updateVectorButtons();
        this.showToast('Selection cleared', 'info');
    }

    // Search products
    searchProducts(query) {
        const productCards = document.querySelectorAll('.product-card');
        
        productCards.forEach(card => {
            const text = card.textContent.toLowerCase();
            if (text.includes(query.toLowerCase())) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    // Export data
    exportData() {
        if (!this.fetchedData || this.fetchedData.length === 0) {
            this.showToast('No data to export', 'warning');
            return;
        }

        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                selectedVectors: Array.from(this.selectedVectors.values()),
                cubeMetadata: this.cubeMetadata,
                seriesInfo: this.seriesInfo
            },
            data: this.fetchedData
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `statcan-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('Data exported successfully', 'success');
    }

    // Toggle fullscreen
    toggleFullscreen() {
        const container = document.getElementById('visualization-container');
        
        if (!document.fullscreenElement) {
            container.requestFullscreen().catch(err => {
                console.error('Error attempting to enable fullscreen:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    // Update chart metadata display
    updateChartMeta() {
        const chartMeta = document.getElementById('chart-meta');
        if (this.cubeMetadata && this.cubeMetadata.cubeTitleEn) {
            chartMeta.textContent = this.cubeMetadata.cubeTitleEn;
        } else {
            chartMeta.textContent = 'Statistics Canada Data Visualization';
        }
    }

    // Show/hide loading state
    showLoading(show) {
        const loadingOverlay = document.getElementById('loading-overlay');
        loadingOverlay.style.display = show ? 'flex' : 'none';
    }

    // Show/hide empty state
    showEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const visualizationContainer = document.getElementById('visualization-container');
        
        emptyState.style.display = 'flex';
        visualizationContainer.style.display = 'none';
    }

    hideEmptyState() {
        const emptyState = document.getElementById('empty-state');
        emptyState.style.display = 'none';
    }

    // Show CORS limitation dialog with explanation
    showCorsLimitationDialog() {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalContent = document.getElementById('modal-content');
        
        // Check if modal elements exist
        if (!modalOverlay || !modalContent) {
            console.error('Modal elements not found, showing toast instead');
            this.showToast('Unable to access Statistics Canada API. Please check Netlify Functions deployment.', 'error');
            this.showEmptyState();
            return;
        }
        
        modalContent.innerHTML = `
            <div class="modal-header">
                <h2><i class="fas fa-info-circle"></i> API Access via Netlify Functions</h2>
                <button class="modal-close" onclick="window.statCanExplorer.closeModal()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div style="text-align: center; margin-bottom: 20px;">
                    <i class="fas fa-server" style="font-size: 48px; color: var(--primary-color); margin-bottom: 15px;"></i>
                </div>
                
                <h3>Netlify Functions Integration</h3>
                <p>This application uses Netlify Functions to proxy requests to the Statistics Canada API, bypassing browser CORS restrictions.</p>
                
                <div style="background: var(--bg-tertiary); padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h4><i class="fas fa-cog"></i> Setup Required:</h4>
                    <ul style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                        <li>Deploy this application to Netlify</li>
                        <li>Netlify Functions will automatically handle API proxying</li>
                        <li>Functions are located in <code>/netlify/functions/</code></li>
                        <li>No additional configuration needed</li>
                    </ul>
                </div>
                
                <h3>Local Development:</h3>
                <div style="background: var(--bg-secondary); padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <p>To test locally with Netlify Functions:</p>
                    <ol style="margin: 10px 0; padding-left: 20px; font-size: 14px;">
                        <li>Install Netlify CLI: <code>npm install -g netlify-cli</code></li>
                        <li>Run: <code>netlify dev</code></li>
                        <li>Access the app at the provided local URL</li>
                    </ol>
                </div>
                
                <div style="text-align: center; margin-top: 25px;">
                    <p><strong>Ready for deployment to Netlify with full API functionality!</strong></p>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn btn-outline" onclick="window.statCanExplorer.closeModal()">
                    <i class="fas fa-times"></i>
                    Close
                </button>
                <button class="btn btn-primary" onclick="window.statCanExplorer.showEmptyState(); window.statCanExplorer.resetEmptyState(); window.statCanExplorer.closeModal();">
                    <i class="fas fa-arrow-left"></i>
                    Back to Explorer
                </button>
            </div>
        `;
        
        modalOverlay.classList.add('active');
    }

    // Reset empty state to original content
    resetEmptyState() {
        const emptyStateContent = document.getElementById('empty-state').querySelector('.empty-state-content');
        emptyStateContent.innerHTML = `
            <i class="fas fa-chart-area empty-icon"></i>
            <h3>Ready to Explore Data</h3>
            <p>Select products and vectors from the sidebar to start visualizing real Statistics Canada data.</p>
        `;
    }

    // Modal functions
    closeModal() {
        document.getElementById('modal-overlay').classList.remove('active');
    }

    // Toast notification system
    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? 'check-circle' : 
                    type === 'error' ? 'exclamation-circle' : 
                    type === 'warning' ? 'exclamation-triangle' : 'info-circle';
        
        toast.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        document.body.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => document.body.removeChild(toast), 300);
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.statCanExplorer = new StatCanExplorer();
});
