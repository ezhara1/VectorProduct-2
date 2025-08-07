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
        if (!productList) {
            console.error('product-list element not found');
            return;
        }
        productList.innerHTML = '';

        this.products.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.id = `product-${product.productId}`;
            
            // Create product header
            const productHeader = document.createElement('div');
            productHeader.className = 'product-header';
            productHeader.onclick = () => this.toggleProduct(product.productId);
            
            // Create product ID element
            const productId = document.createElement('span');
            productId.className = 'product-id';
            productId.textContent = product.productId;
            
            // Create product title element
            const productTitle = document.createElement('span');
            productTitle.className = 'product-title';
            productTitle.textContent = product.description;
            
            // Create expand icon
            const expandIcon = document.createElement('i');
            expandIcon.className = 'fas fa-chevron-right expand-icon';
            expandIcon.id = `toggle-${product.productId}`;
            
            productHeader.appendChild(productId);
            productHeader.appendChild(productTitle);
            productHeader.appendChild(expandIcon);
            
            // Create vectors container
            const vectorsContainer = document.createElement('div');
            vectorsContainer.className = 'vector-list';
            vectorsContainer.id = `vectors-${product.productId}`;
            vectorsContainer.style.display = 'none';
            
            // Add vectors
            product.vectors.forEach(vector => {
                const vectorItem = document.createElement('div');
                vectorItem.className = 'vector-item';
                
                const vectorText = document.createElement('span');
                vectorText.className = 'vector-text';
                vectorText.textContent = vector.text;
                
                const vectorBtn = document.createElement('button');
                vectorBtn.className = 'btn btn-sm btn-outline vector-btn';
                vectorBtn.innerHTML = '<i class="fas fa-plus"></i>';
                vectorBtn.onclick = () => {
                    console.log('Vector button clicked:', vector.vectorId, product.productId, vector.text);
                    this.toggleVector(vector.vectorId, product.productId, vector.text);
                };
                
                vectorItem.appendChild(vectorText);
                vectorItem.appendChild(vectorBtn);
                vectorsContainer.appendChild(vectorItem);
            });
            
            productItem.appendChild(productHeader);
            productItem.appendChild(vectorsContainer);
            productList.appendChild(productItem);
        });
    }

    // Toggle product expansion
    toggleProduct(productId) {
        const productItem = document.getElementById(`product-${productId}`);
        const vectorsList = document.getElementById(`vectors-${productId}`);
        const toggleIcon = document.getElementById(`toggle-${productId}`);
        
        if (!productItem || !vectorsList || !toggleIcon) {
            console.error('Required elements not found for product:', productId);
            return;
        }
        
        console.log('Toggling product:', productId);
        
        if (vectorsList.style.display === 'none') {
            vectorsList.style.display = 'block';
            productItem.classList.add('expanded');
            toggleIcon.classList.remove('fa-chevron-right');
            toggleIcon.classList.add('fa-chevron-down');
        } else {
            vectorsList.style.display = 'none';
            productItem.classList.remove('expanded');
            toggleIcon.classList.remove('fa-chevron-down');
            toggleIcon.classList.add('fa-chevron-right');
        }
    }

    // Toggle vector selection
    toggleVector(vectorId, productId, text) {
        console.log('toggleVector called with:', { vectorId, productId, text });
        console.log('Current selectedVectors size:', this.selectedVectors.size);
        
        if (this.selectedVectors.has(vectorId)) {
            this.selectedVectors.delete(vectorId);
            console.log('Removed vector:', vectorId);
            this.showToast(`Removed vector ${vectorId}`, 'info');
        } else {
            this.selectedVectors.set(vectorId, { vectorId, productId, text });
            console.log('Added vector:', vectorId, 'Total vectors now:', this.selectedVectors.size);
            this.showToast(`Added vector ${vectorId}`, 'success');
        }
        
        console.log('Updating selected vectors list...');
        this.updateSelectedVectorsList();
        console.log('Updating vector buttons...');
        this.updateVectorButtons();
    }

    // Update selected vectors display
    updateSelectedVectorsList() {
        console.log('updateSelectedVectorsList called, selectedVectors size:', this.selectedVectors.size);
        
        const selectedList = document.getElementById('selected-vectors');
        if (!selectedList) {
            console.error('selected-vectors element not found!');
            return;
        }
        
        // Clear the container and remove empty state
        selectedList.innerHTML = '';
        console.log('Cleared selected list, adding vectors...');

        if (this.selectedVectors.size === 0) {
            // Show empty state when no vectors selected
            selectedList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <p>Select vectors from products above</p>
                </div>
            `;
        } else {
            // Add selected vectors
            this.selectedVectors.forEach((vector, vectorId) => {
                console.log('Adding vector to list:', vectorId, vector);
                const vectorItem = document.createElement('div');
                vectorItem.className = 'selected-vector-item';
                
                // Create vector info div
                const vectorInfo = document.createElement('div');
                vectorInfo.className = 'vector-info';
                
                const vectorIdSpan = document.createElement('div');
                vectorIdSpan.className = 'vector-id-display';
                vectorIdSpan.textContent = vectorId;
                
                const vectorTextSpan = document.createElement('div');
                vectorTextSpan.className = 'vector-description';
                vectorTextSpan.textContent = vector.text;
                
                vectorInfo.appendChild(vectorIdSpan);
                vectorInfo.appendChild(vectorTextSpan);
                
                // Create remove button
                const removeBtn = document.createElement('button');
                removeBtn.className = 'btn btn-sm btn-danger';
                removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                removeBtn.onclick = () => this.removeVector(vectorId);
                
                vectorItem.appendChild(vectorInfo);
                vectorItem.appendChild(removeBtn);
                selectedList.appendChild(vectorItem);
            });
        }

        // Update counter
        const counter = document.getElementById('vector-count');
        if (counter) {
            counter.textContent = this.selectedVectors.size;
            console.log('Updated counter to:', this.selectedVectors.size);
        } else {
            console.error('vector-count element not found!');
        }
        
        // Enable/disable fetch data button based on selection
        const fetchButton = document.getElementById('fetch-data');
        if (fetchButton) {
            if (this.selectedVectors.size > 0) {
                fetchButton.disabled = false;
                fetchButton.classList.remove('disabled');
                console.log('Enabled fetch data button');
            } else {
                fetchButton.disabled = true;
                fetchButton.classList.add('disabled');
                console.log('Disabled fetch data button');
            }
        }
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
            // Find the vector ID by looking at the parent vector item
            const vectorItem = btn.closest('.vector-item');
            if (!vectorItem) return;
            
            // Get vector ID from the button's onclick function
            const onclickStr = btn.onclick.toString();
            const vectorIdMatch = onclickStr.match(/toggleVector\(["']([^"']+)["']/); 
            
            if (vectorIdMatch) {
                const vectorId = vectorIdMatch[1];
                const icon = btn.querySelector('i');
                
                if (this.selectedVectors.has(vectorId)) {
                    btn.className = 'btn btn-sm btn-primary vector-btn';
                    icon.className = 'fas fa-check';
                } else {
                    btn.className = 'btn btn-sm btn-outline vector-btn';
                    icon.className = 'fas fa-plus';
                }
            }
        });
    }

    // Setup event listeners
    setupEventListeners() {
        // Fetch data button
        const fetchDataBtn = document.getElementById('fetch-data');
        if (fetchDataBtn) {
            fetchDataBtn.addEventListener('click', () => {
                this.fetchData();
            });
        } else {
            console.warn('fetch-data button not found');
        }

        // Clear selection button
        const clearVectorsBtn = document.getElementById('clear-vectors');
        if (clearVectorsBtn) {
            clearVectorsBtn.addEventListener('click', () => {
                this.clearSelection();
            });
        } else {
            console.warn('clear-vectors button not found');
        }

        // Visualization type buttons
        const vizBtns = document.querySelectorAll('.viz-btn');
        if (vizBtns.length > 0) {
            vizBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const vizBtn = e.target.closest('.viz-btn');
                    if (vizBtn && vizBtn.dataset.viz) {
                        this.setVisualizationType(vizBtn.dataset.viz);
                    }
                });
            });
        } else {
            console.warn('No visualization buttons found');
        }

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        } else {
            console.warn('export-btn button not found');
        }

        // Fullscreen button
        const fullscreenBtn = document.getElementById('fullscreen-btn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                this.toggleFullscreen();
            });
        } else {
            console.warn('fullscreen-btn button not found');
        }

        // Search functionality
        const searchInput = document.getElementById('product-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchProducts(e.target.value);
            });
        } else {
            console.warn('product-search input not found');
        }
    }

    // Fetch data from Statistics Canada API via Netlify Functions
    async fetchData() {
        if (this.selectedVectors.size === 0) {
            this.showToast('Please select at least one vector', 'warning');
            return;
        }

        this.showLoading(true);
        this.hideEmptyState();

        const periods = parseInt(document.getElementById('periods-input')?.value) || 12;
        
        // Format request data according to Statistics Canada API specification
        // API expects: [{"vectorId":32164132, "latestN":3}]
        const requestData = Array.from(this.selectedVectors.keys()).map(vectorId => ({
            vectorId: parseInt(vectorId.replace('v', '')), // Convert "v111908552" to 111908552
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
            // Store series info using both string and integer vector IDs for compatibility
            const vectorIdStr = vector.vectorId; // e.g., "v111908552"
            const vectorIdInt = parseInt(vectorIdStr.replace('v', '')); // e.g., 111908552
            
            const seriesData = {
                title: vector.text,
                description: vector.text
            };
            
            // Store under both formats to ensure lookup works
            this.seriesInfo[vectorIdStr] = seriesData; // "v111908552"
            this.seriesInfo[vectorIdInt] = seriesData; // 111908552
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
        if (!container) {
            console.log('Vega container element not found, skipping visualization rendering');
            return;
        }
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
        if (!tableContainer) {
            console.log('Table container element not found, skipping table generation');
            return;
        }
        
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
        
        if (!container) {
            console.warn('Visualization container not found for fullscreen');
            return;
        }
        
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
        if (!chartMeta) {
            console.warn('chart-meta element not found');
            return;
        }
        if (this.cubeMetadata && this.cubeMetadata.cubeTitleEn) {
            chartMeta.textContent = this.cubeMetadata.cubeTitleEn;
        } else {
            chartMeta.textContent = 'Statistics Canada Data Visualization';
        }
    }

    // Show/hide loading state
    showLoading(show) {
        const loadingContainer = document.getElementById('loading-container');
        const visualizationContainer = document.getElementById('visualization-container');
        
        if (!loadingContainer || !visualizationContainer) {
            console.warn('Loading or visualization container elements not found');
            return;
        }
        
        if (show) {
            loadingContainer.classList.add('active');
            visualizationContainer.style.display = 'none';
        } else {
            loadingContainer.classList.remove('active');
            visualizationContainer.style.display = 'flex';
        }
    }

    // Show/hide empty state
    showEmptyState() {
        const emptyState = document.getElementById('empty-state');
        const visualizationContainer = document.getElementById('visualization-container');
        
        if (emptyState && visualizationContainer) {
            emptyState.style.display = 'flex';
            visualizationContainer.style.display = 'none';
        } else {
            console.warn('Empty state or visualization container elements not found');
        }
    }

    hideEmptyState() {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
            emptyState.style.display = 'none';
        } else {
            console.warn('Empty state element not found');
        }
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
        const emptyState = document.getElementById('empty-state');
        if (!emptyState) {
            console.warn('Empty state element not found');
            return;
        }
        const emptyStateContent = emptyState.querySelector('.empty-state-content');
        if (!emptyStateContent) {
            console.warn('Empty state content element not found');
            return;
        }
        emptyStateContent.innerHTML = `
            <i class="fas fa-chart-area empty-icon"></i>
            <h3>Ready to Explore Data</h3>
            <p>Select products and vectors from the sidebar to start visualizing real Statistics Canada data.</p>
        `;
    }

    // Modal functions
    closeModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) {
            modalOverlay.classList.remove('active');
        } else {
            console.warn('Modal overlay element not found');
        }
    }

    // Toast notification system
    showToast(message, type = 'info') {
        try {
            const toast = document.createElement('div');
            toast.className = `toast toast-${type}`;
            
            const icon = type === 'success' ? 'check-circle' : 
                        type === 'error' ? 'exclamation-circle' : 
                        type === 'warning' ? 'exclamation-triangle' : 'info-circle';
            
            toast.innerHTML = `
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            `;
            
            if (document.body) {
                document.body.appendChild(toast);
                
                // Trigger animation
                setTimeout(() => toast.classList.add('show'), 100);
                
                // Remove toast after 3 seconds
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => {
                        if (toast.parentNode) {
                            toast.parentNode.removeChild(toast);
                        }
                    }, 300);
                }, 3000);
            } else {
                console.warn('Document body not available for toast notification');
            }
        } catch (error) {
            console.error('Error showing toast notification:', error);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.statCanExplorer = new StatCanExplorer();
});
