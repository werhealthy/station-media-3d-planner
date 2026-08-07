# Realism pipeline

The station remains available through `StationModelAdapter`: the current Q8 scene is a lightweight procedural fallback, while `glbAdapter` is the replacement path for a production asset. Media points stay independent from named model meshes, so creative assignment and visibility workflows survive an adapter change.

## What the procedural model should own

- layout, physical scale and collision envelopes;
- recognizable canopy, SVOLTA shop, dispensers, totem and payment kiosk;
- performant PBR material families, repeated equipment and daylight composition;
- stable anchors for the ten existing media points.

## Recommended custom GLB scope

A final photoreal asset should replace the industrial-detail layer: manufacturer-accurate dispenser shells, molded nozzle and holster parts, curved canopy corner profiles, façade joints, door hardware, shop interior proxies and authored UV/normal/roughness maps. Keep meshes split by shadow/material responsibility, use meters and Y-up, compress textures, and provide LODs for repeated equipment. The GLB must not embed media creatives; those continue to be rendered as independent application surfaces.
