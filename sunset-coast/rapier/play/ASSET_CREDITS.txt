# Third-party 3D assets

## LUCENT VISION

The LUCENT VISION model is adapted from **Car Concept**, by **Eric Chadwick / Darmstadt Graphics Group GmbH (2024)**, distributed by the Khronos Group under the **Creative Commons Attribution 4.0 International (CC BY 4.0)** license.

- Model source: https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/CarConcept
- Original GLB: https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/CarConcept/glTF-Binary/CarConcept.glb
- License: https://creativecommons.org/licenses/by/4.0/
- Upstream license record: https://github.com/KhronosGroup/glTF-Sample-Assets/blob/main/Models/CarConcept/LICENSE.md
- Original concept design/model: **Unity Fan**, *FREE Concept Car 004 – public domain (CC0)*, https://sketchfab.com/3d-models/free-concept-car-004-public-domain-cc0-4cba124633eb494eadc3bb0c4660ad7e

Changes in this game: the source Khronos/3D Commerce logo and tire-brand textures were replaced by an original fictional LUCENT wordmark and unbranded tire sidewalls; orientation and scale were normalized; posed front-wheel steering was returned to neutral; real door hinges, steering wheel and four independent wheel pivots were connected to the game's animations and driving physics; body-paint colors can be changed, with the original metallic-flake normal strength tuned for a finer finish. The interior dashboard surface now displays live game instruments, the posed steering wheel is centred and connected to steering input, and cabin-view glazing is temporarily cleared for driving visibility. The original geometry, interior, normal maps, ambient occlusion, layered paint and clearcoat are retained. LUCENT is a fictional game brand. The source trademarks are excluded from the model's open license and are not used as this game's branding.

The packaged derivative is `assets/lucent-vision.glb`. Source-license and attribution metadata are retained in `assets/CarConcept-LICENSE.md` and `assets/CarConcept-metadata.json`, and the derivative also embeds attribution in its glTF asset metadata. No endorsement by the original creators is implied.

## Three.js loaders

`vendor/GLTFLoader.js` and `vendor/BufferGeometryUtils.js` are from Three.js r180, copyright © 2010–2025 three.js authors, MIT licensed. Only relative import paths were changed. The license is included as `vendor/three-addons-LICENSE.txt`.

https://github.com/mrdoob/three.js/tree/r180


## Original NEON COAST assets (1.5.0 candidate)

Seventeen car designs, both airport passenger jets, the flyable NC-11 trainer, buildings and expanded mountain scenery are original procedural geometry. New fictional models are YUNQIAO S800/T9 and LINDAO V6/Q3. Real brand names or likeness references do not imply endorsement. The LUCENT VISION attribution and derivative license above remain unchanged.

## Godot 4.6.3

The genuine Godot Engine web runtime is distributed under the MIT license. Godot's complete upstream license, copyright/third-party notices and authors are included in `physics/LICENSE.txt`, `physics/COPYRIGHT.txt` and `physics/AUTHORS.md`. Official source: https://github.com/godotengine/godot/tree/4.6.3-stable .

The official physics WASM is unchanged; `physics/neon-physics.js` contains a documented NEON COAST modification to the preloader's download transport to fetch gzip and use the standard DecompressionStream API. See `physics/TRANSPORT-NOTICE.txt`, `physics/manifest.json`, and source `scripts/build-physics.py` / `scripts/godot-gzip-transport.js`. The game's GDScript bridge and force model are original MIT-licensed code in the source package.


## Original Semi-inspired asset — 2.0 Beta

The Semi tractor is original Blender-authored geometry, visually inspired by Tesla Semi exterior and central-seat cabin references. It is not official Tesla CAD or a downloaded manufacturer model. Tesla names/designs remain their owners' marks/designs; no endorsement or clearance is implied. Reference photographs are not redistributed. Reference: https://www.tesla.com/semi . The dashboard graphics are original game-specific artwork. Gameplay dimensions/performance are tuning values, not manufacturer specifications. Six visible wheel groups currently share four simulated suspension contacts; cargo is abstract and has no articulated trailer.
