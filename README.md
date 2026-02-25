# MODIS NIR Reflectance Standardized Anomaly Detection (Z-Score) 2005–2025

Google Earth Engine **JavaScript** script that calculates **standardized anomalies** (Z-scores) of near-infrared surface reflectance from the **MODIS MOD09GQ** product (250 m resolution) and identifies low/high anomalous periods.

This method helps detect unusual vegetation/greenness behavior, drought signals, land degradation, or greening events relative to the long-term climatology.

## 📌 Overview
- **Dataset**: MODIS/061/MOD09GQ (daily surface reflectance, NIR band: `sur_refl_b02`)
- **Period**: 2005-01-01 to 2025-12-31
- **Method**: Z-score standardization → **P = (NIR − μ) / σ**
- **Anomaly detection**: Low (P < T₁ = -0.5), High (P > T₂ = 0.1)
- **Output**: Visual layers + export of mean (μ) and standard deviation (σ) to Google Drive
- **Purpose**: Suitable for vegetation monitoring, drought analysis, land surface change detection

## 🚀 How to Use
1. Open [Google Earth Engine Code Editor](https://code.earthengine.google.com)
2. Create a new script
3. Paste the full code from `script.js`
4. Draw or import your **Area of Interest** and asign to `AOI`
5. (Optional) Modify:
   - `startDate` / `endDate`
   - Thresholds `T1` and `T2`
   - Export folder name
6. Run the script
7. View layers on the map
8. Check console for size, example image, and min/max anomaly values
9. Go to **Tasks** tab → Run the export tasks

## 📂 Code Structure
```javascript
// Settings
var AOI = geometry;
var dataset = 'MODIS/061/MOD09GQ';
var nirBand = 'sur_refl_b02';
var startDate = '2005-01-01';
var endDate = '2025-12-31';
var T1 = -0.5; 
var T2 = 0.1; 

// Load MODIS Collection
var col = ee.ImageCollection(dataset)
  .filterDate(startDate, endDate)
  .filterBounds(AOI)
  .select(nirBand);

print('Original Collection', col);

// Mean (μ) and Std Dev (σ)
var meanImage = col.mean().rename('mu').clip(AOI);

var stdImage = col
  .reduce(ee.Reducer.stdDev())
  .rename('sigma')
  .clip(AOI);

// Z-Score (P)
// P = (nir − μ) / σ
var pCollection = col.map(function(img) {
  var nir = img.select(nirBand);
  var P = nir
    .subtract(meanImage)
    .divide(stdImage)
    .rename('P')
    .clip(AOI);

  return P.copyProperties(img, img.propertyNames());
});
print('P Collection', pCollection);

// LOW ANOMALY COLLECTION
var lowAnomalyCollection = pCollection.map(function(img){
  var mask = img
    .lt(T1)
    .rename('low_anomaly')
    .toInt8();
  return mask.copyProperties(img, img.propertyNames());
});

print('Low Anomaly Collection', lowAnomalyCollection);

// HIGH ANOMALY COLLECTION
var highAnomalyCollection = pCollection.map(function(img){
  var mask = img
    .gt(T2)
    .rename('high_anomaly')
    .toInt8();
  return mask.copyProperties(img, img.propertyNames());
});
print('High Anomaly Collection', highAnomalyCollection);

// Example Images
var exampleLow = ee.Image(lowAnomalyCollection.first());
var exampleHigh = ee.Image(highAnomalyCollection.first());
print('Example Low', exampleLow);
print('Example High', exampleHigh);

// Visualization
Map.centerObject(AOI);
Map.addLayer(AOI, {}, 'AOI');
Map.addLayer(meanImage,
  {palette:['blue','white','green']},
  'Mean μ');
Map.addLayer(stdImage,
  {palette:['white','purple']},
  'StdDev σ');
Map.addLayer(exampleLow,
  {min:0, max:1},
  'Example Low Anomaly');
Map.addLayer(exampleHigh,
  {min:0, max:1},
  'Example High Anomaly');
Map.addLayer(table, {}, 'City boundary');

// Exports
Export.image.toDrive({
  image: meanImage,
  description: 'MODIS_NIR_Mean_2005_2025',
  folder: 'Exports',
  fileNamePrefix: 'NIR_mean_mu',
  region: AOI,
  scale: 250,
  maxPixels: 1e13,
  crs: 'EPSG:4326'
});

Export.image.toDrive({
  image: stdImage,
  description: 'MODIS_NIR_StdDev_2005_2025',
  folder: 'Exports',
  fileNamePrefix: 'NIR_std_sigma',
  region: AOI,
  scale: 250,
  maxPixels: 1e13,
  crs: 'EPSG:4326'
});

Export.image.toDrive({
  image: exampleLow,
  description: 'Example_Low_Anomaly',
  folder: 'Exports',
  fileNamePrefix: 'low_anomaly_example',
  region: AOI,
  scale: 250,
  maxPixels: 1e13,
  crs: 'EPSG:4326'
});

Export.image.toDrive({
  image: exampleHigh,
  description: 'Example_High_Anomaly',
  folder: 'Exports',
  fileNamePrefix: 'high_anomaly_example',
  region: AOI,
  scale: 250,
  maxPixels: 1e13,
  crs: 'EPSG:4326'
});
```

---

## Author
**Armin Nakhjiri**  
Remote Sensing Scientist
✉️ Nakhjiri.Armin@gmail.com  

---

*Empowering the next generation of geospatial analysts, one script at a time.*
