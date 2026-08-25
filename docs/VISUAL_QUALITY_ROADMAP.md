# Visual quality roadmap

The procedural scene is a layout prototype and a fallback. It must not become
the production source of visual truth by accumulating more primitive meshes.

## Target pipeline without mandatory Blender work

1. Keep the measured station layout and every media support parametric in the
   application. These dimensions remain the source of truth.
2. Generate or source modular GLB assets for pump, shop, canopy and props. An
   image-to-3D service can produce the first pump draft from several clean
   reference views; it must not decide the support dimensions.
3. Source PBR surface materials, HDRI and vegetation from a compatible asset
   library and record the licence with each asset.
4. Use an automated Blender workflow only as an optional cleanup step for UVs,
   mesh simplification, pivots and GLB export. The product owner does not need
   to operate Blender manually.
5. Load the result through the existing `StationModelAdapter` boundary. Use LOD
   and instancing for trees and repeated props, then compress only after visual
   approval.

## First-person pipeline

The walkthrough uses an intentionally restrained first-person proxy:

- sleeves/forearms only, without spherical hands;
- arms driven by a subtle idle/walk animation blend;
- footsteps synchronised to the gait cycle;
- capsule collision and step handling kept independent from the render mesh;
- height presets applied to camera, collision capsule and gait together.

Auto tour is a separate experience: each journey is a timed scene with a
vehicle cockpit, approach, turn, stop and natural gaze targets. Hotspots are
not used as animation keyframes.

## Acceptance criteria for the first reference station

- Two pump islands and four dispensers maximum.
- Shop has one double entrance with no overlapping glazing.
- Every media support matches the approved plan, dimensions and mounting
  height.
- Asphalt, concrete, glass, metal and vegetation have visible material response
  under daylight without clipping or excessive reflections.
- Overview composition remains close to the supplied 2D reference.
- Walkthrough shows understated forearms, never placeholder spheres, and uses
  the selected eye height consistently.
- Self and Servito auto tours begin inside the vehicle and include a visible
  approach and stop, not a sequence of teleports between hotspots.
- Stable interactive frame rate on the agreed target laptop and tablet.

## Assets still required

- Measured plan and elevations of the selected real station.
- Orthographic photographs or CAD for canopy, shop, pump and totem.
- Approved Q8 material and colour specifications.
- Production artwork templates for every media support.
- A licensed rigged human avatar and walk/idle animation set.
- Licensed vegetation and surface texture library, including usage rights for
  a web application.
