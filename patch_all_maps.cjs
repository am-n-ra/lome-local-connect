const fs = require('fs');

const files = [
  'src/trunk/FieldPilotLocationMap.tsx',
  'src/components/v2/V2BuyerMap.tsx'
];

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, 'utf8');
  
  // Patch try/catch around map.remove()
  code = code.replace(/map\.remove\(\);/g, 'try { map.remove(); } catch (e) { console.error("Error removing map:", e); }');
  
  // Patch try/catch around new Map
  code = code.replace(
    /const map = new Map\(\{([\s\S]*?touchZoomRotate: true,\s*\}\);)/,
    `let map: Map;
    try {
      map = new Map({$1);
    } catch (err) {
      console.error('Failed to initialize map:', err);
      // setMapStatus('error');
      return;
    }`
  );
  
  fs.writeFileSync(file, code);
}
