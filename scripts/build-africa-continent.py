import json
from pathlib import Path
from shapely.geometry import shape, mapping
from shapely.ops import unary_union
from shapely.validation import make_valid

root = Path(__file__).resolve().parents[1]
source_path = root / "public" / "boundaries" / "africa.geojson"
target_path = root / "public" / "boundaries" / "africa-continent.geojson"

source = json.loads(source_path.read_text())
polygons = []
for feature in source.get("features", []):
    geometry = shape(feature["geometry"])
    if not geometry.is_valid:
        geometry = make_valid(geometry)
    polygons.append(geometry)
if not polygons:
    raise SystemExit("No country geometries found in africa.geojson")

continent = unary_union(polygons)
# Keep the asset lightweight while preserving a clean continental silhouette.
continent = continent.simplify(0.02, preserve_topology=True)
output = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "id": "africa-continent",
            "properties": {"id": "africa-continent", "name": "Afrique"},
            "geometry": mapping(continent),
        }
    ],
}
target_path.write_text(json.dumps(output, separators=(",", ":")) + "\n")
print(json.dumps({"source_features": len(polygons), "geometry_type": continent.geom_type, "output_bytes": target_path.stat().st_size}))
