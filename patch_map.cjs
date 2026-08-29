const fs = require('fs');
let code = fs.readFileSync('src/trunk/TrunkMap.tsx', 'utf8');

code = code.replace(
  /const map = new Map\(\{([\s\S]*?touchZoomRotate: true,\s*\}\);)/,
  `let map: Map;
    try {
      map = new Map({$1);
    } catch (err) {
      console.error('Failed to initialize map:', err);
      setMapStatus('error');
      return;
    }`
);

fs.writeFileSync('src/trunk/TrunkMap.tsx', code);
