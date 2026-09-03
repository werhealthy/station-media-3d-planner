# Third-party visual assets

The asset-driven procedural station loads the following 1K assets from Poly
Haven at runtime:

| Asset          | Use                                | Source                                   |
| -------------- | ---------------------------------- | ---------------------------------------- |
| Asphalt 07     | Forecourt and access road PBR maps | <https://polyhaven.com/a/asphalt_07>     |
| Rough Concrete | Pavement and curb PBR maps         | <https://polyhaven.com/a/rough_concrete> |
| Leafy Grass    | Landscape ground PBR maps          | <https://polyhaven.com/a/leafy_grass>    |

Poly Haven publishes these assets under CC0. The current proof-of-concept uses
their CORS-enabled CDN so the repository does not carry unoptimised source
files. Before a production or offline deployment, the approved assets should be
optimised and served with the application.

License: <https://polyhaven.com/license>
