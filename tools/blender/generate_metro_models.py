"""
generate_metro_models.py
────────────────────────────────────────────────────────────────────────────
Tehran Metro Line 1 — landing 3D assets generator for Blender 4.x

Builds four tileable / drop-in assets that match the constants in
  src/components/landing/metro-tunnel-scene.tsx
and exports each as an optimized .glb ready for  public/models/ :

    tunnel_segment.glb   seamless tunnel ring (length = SEGMENT_LENGTH)
    rail_segment.glb     twin rails + sleepers (same length, tiles with tunnel)
    train.glb            driver cabin: nose + windshield + dashboard + wheel
    station.glb          side platform with edge strip + pillars + sign

HOW TO RUN
  A) Blender GUI : Scripting workspace → Open → this file → ▶ Run Script
  B) Headless    : blender --background --python generate_metro_models.py

COORDINATES
  Build in Blender (Z-up). The glTF exporter converts to Y-up, so a length
  built along Blender +Y becomes the tunnel travel axis (Z) in three.js, and
  Blender +Z (up) becomes three.js +Y (up). Everything below respects that.

After export, hand the four files back and they drop straight into the scene.
────────────────────────────────────────────────────────────────────────────
"""

import bpy
import bmesh
import math
import os

# ── CONFIG ──────────────────────────────────────────────────────────────────
# Change OUTPUT_DIR to your repo's public/models to export in place.
CONFIG = {
    "output_dir": os.path.join(os.path.expanduser("~"), "metro_models"),
    # must match metro-tunnel-scene.tsx:
    "segment_length": 10.0,   # SEGMENT_LENGTH
    "tunnel_radius": 3.6,     # TUNNEL_RADIUS
    "rail_gauge": 2.2,        # rails sit at x = ± rail_gauge / 2  (±1.1)
    "floor_z": -3.4,          # FLOOR_Y in three.js  →  Blender Z (up)
    "wall_segments": 48,      # tunnel cylinder resolution
    "use_draco": True,        # compress on export (smaller files)
}

# Metro palette (sRGB hex)
RED = "#E11D2E"
RED_WARM = "#FF8A65"
DARK = "#181214"
DARKER = "#0C0A0B"
STEEL = "#8A8F98"
CONCRETE = "#3A2E30"
GLASS = "#8FB7C9"


# ── colour helpers ──────────────────────────────────────────────────────────
def _srgb_to_linear(c: float) -> float:
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def rgba(hex_str: str, a: float = 1.0):
    h = hex_str.lstrip("#")
    r, g, b = (int(h[i : i + 2], 16) / 255.0 for i in (0, 2, 4))
    return (_srgb_to_linear(r), _srgb_to_linear(g), _srgb_to_linear(b), a)


# ── scene / collection helpers ──────────────────────────────────────────────
def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for block in (bpy.data.meshes, bpy.data.materials, bpy.data.curves):
        for item in list(block):
            block.remove(item)


def ensure_collection(name: str) -> bpy.types.Collection:
    if name in bpy.data.collections:
        return bpy.data.collections[name]
    coll = bpy.data.collections.new(name)
    bpy.context.scene.collection.children.link(coll)
    return coll


def link_only(obj: bpy.types.Object, coll: bpy.types.Collection):
    for c in list(obj.users_collection):
        c.objects.unlink(obj)
    coll.objects.link(obj)


# ── material factory ────────────────────────────────────────────────────────
def make_material(
    name, base_hex, metallic=0.0, roughness=0.7,
    emission_hex=None, emission_strength=0.0, alpha=1.0,
):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba(base_hex, alpha)
    bsdf.inputs["Metallic"].default_value = metallic
    bsdf.inputs["Roughness"].default_value = roughness
    if "Alpha" in bsdf.inputs:
        bsdf.inputs["Alpha"].default_value = alpha
    if alpha < 1.0:
        mat.blend_method = "BLEND"
    if emission_hex is not None:
        for key in ("Emission Color", "Emission"):  # 4.x vs 3.x
            if key in bsdf.inputs:
                bsdf.inputs[key].default_value = rgba(emission_hex)
                break
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emission_strength
    return mat


# ── primitive helpers (return the created object) ───────────────────────────
def add_cylinder(radius, depth, verts=32, caps=True, name="Cyl"):
    bpy.ops.mesh.primitive_cylinder_add(
        radius=radius, depth=depth, vertices=verts,
        end_fill_type="NGON" if caps else "NOTHING",
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj


def add_torus(major, minor, name="Torus", major_seg=48, minor_seg=12):
    bpy.ops.mesh.primitive_torus_add(
        major_radius=major, minor_radius=minor,
        major_segments=major_seg, minor_segments=minor_seg,
    )
    obj = bpy.context.active_object
    obj.name = name
    return obj


def add_box(sx, sy, sz, name="Box"):
    bpy.ops.mesh.primitive_cube_add(size=1.0)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx / 2.0, sy / 2.0, sz / 2.0)
    bpy.ops.object.transform_apply(scale=True)
    return obj


def add_plane(sx, sy, name="Plane"):
    bpy.ops.mesh.primitive_plane_add(size=1.0)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (sx / 2.0, sy / 2.0, 1.0)
    bpy.ops.object.transform_apply(scale=True)
    return obj


def set_mat(obj, mat):
    obj.data.materials.clear()
    obj.data.materials.append(mat)


def flip_normals(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.flip_normals()
    bpy.ops.object.mode_set(mode="OBJECT")


def shade_smooth(obj):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()


# ── model: TUNNEL SEGMENT ───────────────────────────────────────────────────
def build_tunnel(coll):
    R = CONFIG["tunnel_radius"]
    L = CONFIG["segment_length"]
    floor = CONFIG["floor_z"]

    mat_wall = make_material("Tunnel_Wall", DARK, metallic=0.1, roughness=0.95)
    mat_ring = make_material("Tunnel_Ring", RED, roughness=0.5,
                             emission_hex=RED, emission_strength=1.2)
    mat_rib = make_material("Tunnel_Rib", CONCRETE, roughness=0.9, metalness=0.2) \
        if False else make_material("Tunnel_Rib", CONCRETE, roughness=0.9)
    mat_light = make_material("Wall_Light", RED_WARM,
                              emission_hex=RED_WARM, emission_strength=3.0)

    # Wall: open cylinder, axis along Y (travel), normals flipped inward.
    wall = add_cylinder(R, L, verts=CONFIG["wall_segments"], caps=False, name="tunnel_wall")
    wall.rotation_euler = (math.radians(90), 0, 0)  # Z-axis → Y-axis
    bpy.ops.object.transform_apply(rotation=True)
    flip_normals(wall)
    shade_smooth(wall)
    set_mat(wall, mat_wall)

    # Structural ring at the +Y seam (glowing red).
    ring = add_torus(R - 0.06, 0.14, name="tunnel_ring", major_seg=48, minor_seg=10)
    ring.rotation_euler = (math.radians(90), 0, 0)
    ring.location = (0, L / 2.0, 0)
    bpy.ops.object.transform_apply(rotation=True, location=True)
    set_mat(ring, mat_ring)

    # Mid rib for depth density.
    rib = add_torus(R - 0.03, 0.05, name="tunnel_rib", major_seg=40, minor_seg=8)
    rib.rotation_euler = (math.radians(90), 0, 0)
    bpy.ops.object.transform_apply(rotation=True)
    set_mat(rib, mat_rib)

    # Wall running lights (speed cue), both sides.
    for sx in (-1, 1):
        lite = add_box(0.08, 0.5, 0.45, name="wall_light")
        lite.location = (sx * 2.5, 0, 2.4)
        bpy.ops.object.transform_apply(location=True)
        set_mat(lite, mat_light)
        link_only(lite, coll)

    for o in (wall, ring, rib):
        link_only(o, coll)


# ── model: RAIL SEGMENT ─────────────────────────────────────────────────────
def build_rail(coll):
    L = CONFIG["segment_length"]
    g = CONFIG["rail_gauge"] / 2.0
    floor = CONFIG["floor_z"]

    mat_rail = make_material("Rail_Steel", STEEL, metallic=0.85, roughness=0.3)
    mat_tie = make_material("Sleeper", CONCRETE, roughness=0.9)

    for sx in (-g, g):
        rail = add_box(0.16, L, 0.12, name="rail")
        rail.location = (sx, 0, floor)
        bpy.ops.object.transform_apply(location=True)
        set_mat(rail, mat_rail)
        link_only(rail, coll)

    n = 9
    for i in range(n):
        y = -L / 2.0 + (i + 0.5) * (L / n)
        tie = add_box(g * 2.0 + 0.6, 0.18, 0.1, name="sleeper")
        tie.location = (0, y, floor - 0.08)
        bpy.ops.object.transform_apply(location=True)
        set_mat(tie, mat_tie)
        link_only(tie, coll)


# ── model: TRAIN (driver cabin) ─────────────────────────────────────────────
def build_train(coll):
    """Front car with a hollow driver cabin. Front points +Y (→ -Z forward)."""
    mat_body = make_material("Train_Body", RED, metallic=0.4, roughness=0.4)
    mat_trim = make_material("Train_Trim", DARKER, metallic=0.3, roughness=0.6)
    mat_glass = make_material("Windshield", GLASS, metallic=0.0,
                              roughness=0.1, alpha=0.25)
    mat_dash = make_material("Dashboard", DARKER, metallic=0.4, roughness=0.6)
    mat_glow = make_material("Dash_Glow", RED, emission_hex=RED, emission_strength=2.0)
    mat_wheel = make_material("Steering", "#1B1416", metallic=0.5, roughness=0.5)

    W, H, Lc = 2.6, 3.2, 8.0  # car width, height, length

    # Body shell (slightly tapered nose done with a second smaller cap).
    body = add_box(W, Lc, H, name="train_body")
    body.location = (0, 0, 0.2)
    bpy.ops.object.transform_apply(location=True)
    set_mat(body, mat_body)
    link_only(body, coll)

    nose = add_box(W * 0.82, 1.4, H * 0.78, name="train_nose")
    nose.location = (0, Lc / 2.0 + 0.6, 0.1)
    bpy.ops.object.transform_apply(location=True)
    set_mat(nose, mat_trim)
    link_only(nose, coll)

    # Windshield glass on the front face.
    glass = add_box(W * 0.7, 0.06, H * 0.42, name="windshield")
    glass.location = (0, Lc / 2.0 + 0.02, 0.9)
    bpy.ops.object.transform_apply(location=True)
    set_mat(glass, mat_glass)
    link_only(glass, coll)

    # Interior dashboard console just behind the windshield.
    dash = add_box(W * 0.8, 0.7, 0.5, name="dashboard")
    dash.location = (0, Lc / 2.0 - 0.7, -0.4)
    dash.rotation_euler = (math.radians(-16), 0, 0)
    bpy.ops.object.transform_apply(location=True, rotation=True)
    set_mat(dash, mat_dash)
    link_only(dash, coll)

    strip = add_box(W * 0.7, 0.04, 0.04, name="dash_glow")
    strip.location = (0, Lc / 2.0 - 1.0, -0.15)
    bpy.ops.object.transform_apply(location=True)
    set_mat(strip, mat_glow)
    link_only(strip, coll)

    # Steering wheel (torus + spokes + hub).
    wheel = add_torus(0.34, 0.045, name="wheel_rim", major_seg=40, minor_seg=12)
    wheel.rotation_euler = (math.radians(70), 0, 0)
    wheel.location = (0, Lc / 2.0 - 1.1, -0.05)
    bpy.ops.object.transform_apply(rotation=True, location=True)
    set_mat(wheel, mat_wheel)
    link_only(wheel, coll)

    for a in (0, 60, 120):
        spoke = add_box(0.64, 0.035, 0.035, name="wheel_spoke")
        spoke.rotation_euler = (0, math.radians(a), 0)
        spoke.location = (0, Lc / 2.0 - 1.1, -0.05)
        bpy.ops.object.transform_apply(rotation=True, location=True)
        set_mat(spoke, mat_wheel)
        link_only(spoke, coll)

    hub = add_cylinder(0.08, 0.06, verts=18, name="wheel_hub")
    hub.rotation_euler = (math.radians(70), 0, 0)
    hub.location = (0, Lc / 2.0 - 1.1, -0.05)
    bpy.ops.object.transform_apply(rotation=True, location=True)
    set_mat(hub, mat_glow)
    link_only(hub, coll)

    # Camera anchor empty at the driver's eye position (I read this in code).
    bpy.ops.object.empty_add(type="PLAIN_AXES", location=(0, Lc / 2.0 - 1.7, 0.35))
    anchor = bpy.context.active_object
    anchor.name = "camera_anchor"
    link_only(anchor, coll)


# ── model: STATION ──────────────────────────────────────────────────────────
def build_station(coll):
    floor = CONFIG["floor_z"]
    mat_slab = make_material("Platform", CONCRETE, roughness=0.85)
    mat_edge = make_material("Edge_Strip", RED_WARM,
                             emission_hex=RED_WARM, emission_strength=2.0)
    mat_pillar = make_material("Pillar", DARK, roughness=0.7, metallic=0.2)
    mat_sign = make_material("Sign", RED, emission_hex=RED, emission_strength=1.5)

    P_LEN, P_W, P_H = 24.0, 4.0, 1.1
    x0 = CONFIG["tunnel_radius"] - 0.3  # platform sits beside the track

    slab = add_box(P_W, P_LEN, P_H, name="platform")
    slab.location = (x0 + P_W / 2.0, 0, floor + P_H / 2.0)
    bpy.ops.object.transform_apply(location=True)
    set_mat(slab, mat_slab)
    link_only(slab, coll)

    edge = add_box(0.12, P_LEN, 0.06, name="edge_strip")
    edge.location = (x0, 0, floor + P_H)
    bpy.ops.object.transform_apply(location=True)
    set_mat(edge, mat_edge)
    link_only(edge, coll)

    for i in range(4):
        y = -P_LEN / 2.0 + (i + 0.5) * (P_LEN / 4.0)
        pillar = add_box(0.4, 0.4, 3.4, name="pillar")
        pillar.location = (x0 + P_W - 0.6, y, floor + P_H + 1.7)
        bpy.ops.object.transform_apply(location=True)
        set_mat(pillar, mat_pillar)
        link_only(pillar, coll)

    sign = add_box(0.1, 3.0, 0.7, name="sign")
    sign.location = (x0 + 0.4, 0, floor + P_H + 2.6)
    bpy.ops.object.transform_apply(location=True)
    set_mat(sign, mat_sign)
    link_only(sign, coll)


# ── export ──────────────────────────────────────────────────────────────────
def export_collection(coll_name: str, filename: str):
    out_dir = CONFIG["output_dir"]
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, filename)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.data.collections[coll_name].objects:
        obj.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_draco_mesh_compression_enable=CONFIG["use_draco"],
        export_draco_mesh_compression_level=6,
    )
    print(f"  ✓ exported {filename}")


# ── main ────────────────────────────────────────────────────────────────────
def main():
    print("── Generating Tehran Metro Line 1 assets ──")
    clear_scene()

    models = [
        ("Tunnel", "tunnel_segment.glb", build_tunnel),
        ("Rail", "rail_segment.glb", build_rail),
        ("Train", "train.glb", build_train),
        ("Station", "station.glb", build_station),
    ]

    for coll_name, filename, builder in models:
        coll = ensure_collection(coll_name)
        builder(coll)
        export_collection(coll_name, filename)

    print(f"── Done. Files in: {CONFIG['output_dir']} ──")


if __name__ == "__main__":
    main()
