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

## Character and motion direction

The rejected generic character is not a production fallback. Until one visual
language is approved, the first-person tour should show only a dedicated
forearm/hand viewmodel and the served journey may use the neutral procedural
staff proxy. Do not mix characters from unrelated libraries in the pitch.

The target is stylised realism, closer to _The Sims_ than to photorealism:
consistent proportions, rounded silhouettes, a controlled Q8 palette, soft
material response and expressive but restrained animation. Asset coherence is
more important than polygon count.

The code-only pitch proxy follows the same rule: its gait phase is derived from
distance travelled, its knees and arms are articulated independently and idle
motion is blended out while walking. This prevents foot sliding and frozen
breathing without pretending that a procedural proxy replaces the final rigged
asset. Day and night use a local light-card environment so material response is
art-directed and deterministic instead of inherited from a generic remote HDR.

Recommended production slice:

1. Approve one customer viewmodel, one attendant and one cashier in the same
   style before authoring motion.
2. Auto-rig the approved staff meshes with [AccuRIG](https://actorcore.reallusion.com/auto-rig)
   or a reviewed equivalent. Treat automatic weights as a first pass.
3. Record the exact actions needed by the journey on a phone: walk, collect,
   insert and return the nozzle, wait while refuelling, pay and enter/exit the
   vehicle. Convert the takes with [DeepMotion Animate 3D](https://www.deepmotion.com/animate-3d)
   or [Rokoko Vision](https://www.rokoko.com/products/vision), then clean the
   result in [Cascadeur](https://cascadeur.com/) or Blender.
4. Export in-place locomotion clips and action clips in one GLB. Optimise only
   after approval with [glTF Transform](https://gltf-transform.dev/) and
   Meshopt/KTX2 compression.
5. At runtime keep one persistent `AnimationMixer`. Cross-fade and phase-match
   walk/run, scale clip playback to actual world speed, and never restart the
   walk cycle at journey checkpoints.
6. Separate lower-body locomotion, upper-body action and head gaze by filtering
   animation tracks. Apply hand/foot IK after the mixer: both hands target the
   nozzle/grip while the neck and eyes remain free to scan the station.

Three.js provides cross-fades and additive clips, but it does not provide an
opinionated animation state graph or root-motion system. The application owns
those layers and bone masks. For the guided pitch, keep the existing authored
spline. For manual walking, use Rapier's kinematic character controller for
move-and-slide, slopes and steps; do not introduce a third-party all-in-one
controller as a deadline-critical dependency.

### Pitch scope

- Keep the customer in first person; do not render a full player body.
- Use one short camera cut for entering/exiting the car and continuous motion
  through the already-opening Svolta doors.
- Produce only the six to eight clips visible in the approved journey instead
  of a generic animation library.
- Lock the nozzle to authored hand targets during refuelling. Head movement
  must never be allowed to drag either hand.
- Ship a compressed character package, not a multipart runtime reconstruction.

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
