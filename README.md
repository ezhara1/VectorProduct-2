# Vega-JS Stylish Redesign with Netlify Functions

A modern, stylish redesign of the Vega-JS Statistics Canada Data Visualizer with real API integration via Netlify Functions.

## Features

✅ **Modern UI/UX Design**
- Clean, professional interface with dark theme
- Responsive layout for all screen sizes
- Interactive product and vector exploration

✅ **Real API Integration**
- Fetches live data from Statistics Canada API
- Netlify Functions handle CORS proxy requirements
- No sample data - only real, live statistics

✅ **Advanced Visualizations**
- Line charts, scatter plots, and bar charts using Vega-Lite
- Interactive tooltips and legends
- Export functionality for data and visualizations

✅ **Smart Data Management**
- Product exploration from local `data.json`
- Vector selection and management
- Automatic series info and metadata fetching

## Quick Start

### Local Development with Netlify Functions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Netlify CLI (if not already installed):**
   ```bash
   npm install -g netlify-cli
   ```

3. **Run local development server:**
   ```bash
   netlify dev
   ```

4. **Open your browser** to the URL provided by Netlify CLI (usually `http://localhost:8888`)

### Deploy to Netlify

1. **Push to GitHub repository**

2. **Connect to Netlify:**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Build settings are automatically detected from `netlify.toml`

3. **Deploy:**
   - Netlify will automatically build and deploy
   - Functions will be available at `/.netlify/functions/`

## File Structure

```
├── index.html              # Main HTML file
├── styles.css              # Modern CSS styles
├── app.js                  # Main JavaScript application
├── data.json               # Product and vector data
├── package.json            # Dependencies and scripts
├── netlify.toml            # Netlify configuration
└── netlify/
    └── functions/
        ├── getDataFromVectors.js    # Main data fetching function
        ├── getSeriesInfo.js         # Series information function
        └── getCubeMetadata.js       # Cube metadata function
```

## API Functions

### `/.netlify/functions/getDataFromVectors`
Fetches vector data from Statistics Canada API
- **Method:** POST
- **Body:** Array of `{vectorId, latestN}` objects
- **Returns:** Statistics Canada API response

### `/.netlify/functions/getSeriesInfo`
Fetches series information for vectors
- **Method:** POST  
- **Body:** Array of `{vectorId}` objects
- **Returns:** Series metadata

### `/.netlify/functions/getCubeMetadata`
Fetches cube metadata for products
- **Method:** POST
- **Body:** Array of `{productId}` objects
- **Returns:** Cube information

## Usage

1. **Browse Products:** Explore available products in the left sidebar
2. **Select Vectors:** Click the "+" button to add vectors to your selection
3. **Fetch Data:** Click "Fetch Data" to retrieve real Statistics Canada data
4. **Visualize:** Choose from line, scatter, or bar chart visualizations
5. **Export:** Download your data and visualizations

## Technical Details

- **Frontend:** Vanilla JavaScript, HTML5, CSS3
- **Visualizations:** Vega-Lite 5.x
- **API Proxy:** Netlify Functions (Node.js)
- **Data Source:** Statistics Canada Web Data Service
- **Deployment:** Netlify (static site + serverless functions)

## CORS Solution

This application solves browser CORS restrictions by using Netlify Functions as server-side proxies. The functions make requests to the Statistics Canada API and return the data to the frontend, bypassing browser security limitations.

## Development Notes

- All sample data has been removed as requested
- Only real API data is fetched and displayed
- Error handling provides clear feedback for API issues
- Responsive design works on desktop and mobile devices
- Modern ES6+ JavaScript with clean, maintainable code

## Support

For issues or questions about deployment, check the Netlify Functions documentation or the Statistics Canada API documentation.

---

**Ready for production deployment with full real-time data visualization capabilities!**
