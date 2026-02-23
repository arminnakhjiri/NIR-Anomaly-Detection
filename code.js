// Settings
var AOI = table;
var dataset = 'MODIS/061/MOD09GQ';
var nirBand = 'sur_refl_b02';
var startDate = '2005-01-01';
var endDate = '2025-12-31';
var T1 = -0.5;
var T2 = 0.1;

// Load collection and limit to AOI
var col = ee.ImageCollection(dataset)
  .filterDate(startDate, endDate)
  .filterBounds(AOI)
  .select(nirBand);

//print(col);

// Mean (μ) and Std Dev (σ)
var meanImage = col.mean().rename('mu').clip(AOI);
var stdImage = col.reduce(ee.Reducer.stdDev()).rename('sigma').clip(AOI);

// Calculate P = (nir − μ) / σ
var pCollection = col.map(function(img) {
  var nir = img.select(nirBand);
  var P = nir.subtract(meanImage).divide(stdImage).rename('P').clip(AOI);
  return P.copyProperties(img, img.propertyNames());
});

print(pCollection);

// Call one image from the P collection
var onePImage = ee.Image(pCollection.first());

// Filter by Tolerance
var lowAnomaly  = onePImage.updateMask(onePImage.lt(T1));  // P < -1
var highAnomaly = onePImage.updateMask(onePImage.gt(T2));  // P > 1


print(
  lowAnomaly.reduceRegion({
    reducer: ee.Reducer.minMax(),
    geometry: AOI,
    scale: 500,
    maxPixels: 1e13
  }), 'lowAnomaly'
);

print(
  highAnomaly.reduceRegion({
    reducer: ee.Reducer.minMax(),
    geometry: AOI,
    scale: 500,
    maxPixels: 1e13
  }), 'highAnomaly'
);

// Vis param
var viz = {
  palette: [
    '00008B',  // very cold (dark blue)
    '0000FF',  // blue
    '00FFFF',  // cyan
    'FFFF00',  // warm (yellow)
    'FF7F00',  // orange
    'FF0000'   // hot (red)
  ]
};

// Display
Map.centerObject(AOI);
Map.addLayer(AOI, {}, 'Area of Interest');
Map.addLayer(meanImage, viz, 'Mean μ');
Map.addLayer(stdImage, viz, 'StdDev σ');
Map.addLayer(onePImage, viz, 'Example P');
Map.addLayer(lowAnomaly, viz, 'Low Anomaly');
Map.addLayer(highAnomaly, viz, 'High Anomaly');

// Export
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