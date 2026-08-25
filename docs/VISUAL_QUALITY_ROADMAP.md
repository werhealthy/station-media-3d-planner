# Visual quality roadmap

The procedural scene is a layout prototype and a fallback. It must not become
the production source of visual truth by accumulating more primitive meshes.

## Target pipeline

1. Rebuild one approved station in Blender from a measured plan and the Q8
   elevation references.
2. Keep pumps, shop, canopy, totem, curbs and every media support as named,
   modular objects with real-world metre units and clean UVs.
3. Author physically based materials for asphalt, concrete, painted metal,
   glass and vegetation. Provide base colour, roughness and normal maps.
4. Export the station as GLB. Use the existing `StationModelAdapter` boundary
   so planner features do not depend on mesh names in UI code.
5. Use LOD and instancing for trees and repeated props. Compress geometry and
   textures only after the reference scene is approved visually.

## First-person pipeline

The procedural body proxy proves scale, visibility and gait. Production should
replace it with a rigged, first-person-specific avatar:

- head hidden for the local player;
- torso and legs placed in world space below the camera;
- arms driven by an idle/walk animation blend;
- footsteps synchronised to the gait cycle;
- capsule collision and step handling kept independent from the render mesh;
- optional height presets applied to the capsule, camera and avatar together.

## Acceptance criteria for the first reference station

- Two pump islands and four dispensers maximum.
- Shop has one double entrance with no overlapping glazing.
- Every media support matches the approved plan, dimensions and mounting
  height.
- Asphalt, concrete, glass, metal and vegetation have visible material response
  under daylight without clipping or excessive reflections.
- Overview composition remains close to the supplied 2D reference.
- Walkthrough shows hands at normal gaze and torso, legs and feet when looking
  down.
- Stable interactive frame rate on the agreed target laptop and tablet.

## Assets still required

- Measured plan and elevations of the selected real station.
- Orthographic photographs or CAD for canopy, shop, pump and totem.
- Approved Q8 material and colour specifications.
- Production artwork templates for every media support.
- A licensed rigged human avatar and walk/idle animation set.
- Licensed vegetation and surface texture library, including usage rights for
  a web application.
