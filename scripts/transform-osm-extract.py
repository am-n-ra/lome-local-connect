#!/usr/bin/env python3
"""POP-1c C1 — Geofabrik OSM extract -> Omni batch import payloads.

Source: a Geofabrik .osm.pbf extract (NO live Overpass for the backfill).
Filter: shop=* · amenity in a bounded subset · craft=* · office=* ·
tourism in {hotel, guest_house, hostel}. No further quality pre-filter: the
delivered classifier (place-intake.ts) makes the pilot/world/quarantine call.

Output: JSON array of {sourceRef, name, category, address, latitude, longitude}
(attribution carried alongside by the caller). sourceRef = "<type>/<id>" (stable
and unique per OSM object) so dedupe on (source_id, source_ref) is replay-safe.

Usage: python3 scripts/transform-osm-extract.py <extract.osm.pbf> <out.json>
"""
import json
import sys

import osmium

AMENITY = {"restaurant", "cafe", "fast_food", "pharmacy", "bank", "atm", "bar", "fuel"}
TOURISM = {"hotel", "guest_house", "hostel"}


def category_of(tags):
    if tags.get("shop"):
        return "shop:" + tags["shop"]
    if tags.get("amenity") in AMENITY:
        return "amenity:" + tags["amenity"]
    if tags.get("craft"):
        return "craft:" + tags["craft"]
    if tags.get("office"):
        return "office:" + tags["office"]
    if tags.get("tourism") in TOURISM:
        return "tourism:" + tags["tourism"]
    return None


def wanted(tags):
    if tags.get("shop"):
        return True
    if tags.get("amenity") in AMENITY:
        return True
    if tags.get("craft"):
        return True
    if tags.get("office"):
        return True
    if tags.get("tourism") in TOURISM:
        return True
    return False


def address_of(tags):
    parts = [tags.get("addr:housenumber"), tags.get("addr:street"), tags.get("addr:city")]
    parts = [p for p in parts if p]
    return " ".join(parts) if parts else None


class Handler(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.out = []
        self.seen = set()

    def node(self, n):
        tags = n.tags
        if not wanted(tags):
            return
        source_ref = "node/%d" % n.id
        if source_ref in self.seen:
            return
        self.seen.add(source_ref)
        if not n.location.valid():
            return
        name = (tags.get("name") or "").strip()
        self.out.append(
            {
                "sourceRef": source_ref,
                "name": name,
                "category": category_of(tags),
                "address": address_of(tags),
                "latitude": n.location.lat,
                "longitude": n.location.lon,
            }
        )


def main():
    if len(sys.argv) != 3:
        print("usage: python3 scripts/transform-osm-extract.py <extract.osm.pbf> <out.json>", file=sys.stderr)
        return 2
    pbf, out_path = sys.argv[1], sys.argv[2]
    handler = Handler()
    handler.apply_file(pbf, locations=True)
    by_cat = {}
    for p in handler.out:
        key = p["category"] or "null"
        by_cat[key] = by_cat.get(key, 0) + 1
    with open(out_path, "w") as fh:
        json.dump(handler.out, fh)
    summary = {
        "total": len(handler.out),
        "named": sum(1 for p in handler.out if p["name"]),
        "withAddress": sum(1 for p in handler.out if p["address"]),
        "byCat": by_cat,
    }
    print(json.dumps(summary, indent=2), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
