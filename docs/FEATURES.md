# Feature guide

## Student learning

The learning experience includes course/unit/lesson navigation, lesson video/content, transcript and resource access, progress, bookmarks and assessment attempts/results. The live status of a feature depends on configured Supabase schema, RLS and storage policies.

## Teacher tools

Teacher-facing routes cover course/lesson management, video lesson content, assessment creation, grading, reports/analytics and private student doubts. Verify the user's profile role server-side and rely on RLS/database authorization as the second boundary; hiding a button is not authorization.

## GeoLab — Geo Detective

Route: `/geography-lab/geo-detective`. The current version has 14 India geography clue missions, including four population geography missions on population distribution, density, physical factors affecting settlement, and migration/urbanisation. It uses simplified state/UT boundaries with approximate answer markers (not a measurement-grade GIS map), practice/challenge modes, hints, retry scoring, explanations and a browser-local best score. Its score is not yet a teacher-report/Supabase record. Do not describe its schematic as a precise GIS map.

## EcoLab — Market Master

Route: `/economics-lab/market-master`. The first version simulates a buyer/seller wheat market, negotiation rounds, supply/demand events, a model graph, surplus/profit feedback and browser-local best score. Values are fictional classroom-model values, not real market data.

## Geography practical tools

The geography lab includes map/coordinate, thematic mapping, climate and population exercises. Examples explicitly labeled illustrative/synthetic must not be presented as official statistics.

## Video, resources, multilingual content and live classes

These features depend on the configured Supabase schema and external providers. Video/resource files must be served with access rules appropriate to the content; don't make a private bucket public as a performance workaround. Check storage policies, signed URL behavior, provider configuration and role permissions after changes.
