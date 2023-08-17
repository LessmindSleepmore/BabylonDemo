import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
// import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
// import { Control } from "@babylonjs/gui/2D/controls/control";
// import { Button } from "@babylonjs/gui/2D/controls/button";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { InputText, TextBlock, Rectangle, StackPanel, Control, Slider, Container, Button } from "@babylonjs/gui/2D/controls";
import { Effect } from "@babylonjs/core/Materials/effect"
import { PostProcess, Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, StandardMaterial, Color3, CubeTexture, Texture, DirectionalLight, PBRMaterial, HDRCubeTexture, PassPostProcess, FxaaPostProcess, ProceduralTexture, NoiseProceduralTexture, ShaderMaterial, VertexBuffer, Vector4, Color4, Matrix, float, Camera } from "@babylonjs/core";
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

import { GuiCreator } from './bulidgui';

export class IBLBruteForceCarPaintCreator{
    vs:string = /*glsl*/`
    #version 300 es

    uniform mat4 worldViewProjection;
    uniform mat4 world;
    uniform vec4 cPos;

    layout (location = 0) in vec3 position;
    layout (location = 1) in vec3 normal;
    layout (location = 2) in vec2 uv;
    layout (location = 3) in vec3 tangent;

    out vec3 v_position;
    out vec3 v_normal;
    out vec3 v_tangent;
    out vec3 v_bitangent;
    out vec3 viewWorld;
    out mat3 matTBN;
    out vec2 v_uv;

    void main() {
        v_position = normalize((world * vec4(position, 1.0)).xyz);
        v_normal = normalize((world * vec4(normal, 1.0)).xyz);
        v_tangent = normalize((world * vec4(tangent, 1.0)).xyz);
        v_bitangent = cross(v_normal, v_tangent);
        
        viewWorld = normalize(cPos.xyz - (world * vec4(position, 1)).xyz);
        
        matTBN = mat3(normalize(v_tangent), normalize(v_bitangent), normalize(v_normal));
        
        v_uv = uv;
        gl_Position = worldViewProjection * vec4(position, 1);
    }`;

    fs:string = /*glsl*/`
    #version 300 es

    in vec3 v_position;
    in vec3 v_normal;
    in vec3 v_tangent;
    in vec3 v_bitangent;
    in vec3 viewWorld;
    in mat3 matTBN;
    in vec2 v_uv;

    uniform vec3 albedo;
    uniform float roughness;
    uniform float metalic;
    uniform samplerCube IrradianceMap;
    uniform vec3 lightPos;
    uniform samplerCube EnvCubeMap;
    uniform sampler2D NormalMap;
    uniform float coatNormalScale;

    out vec4 oColor;

    const float PI = 3.1415927;

    float radical_inverse( uint bits ) {
        bits = ( bits << 16u ) | ( bits >> 16u );
        bits = ( ( bits & 0x55555555u ) << 1u ) | ( ( bits & 0xAAAAAAAAu ) >> 1u );
        bits = ( ( bits & 0x33333333u ) << 2u ) | ( ( bits & 0xCCCCCCCCu ) >> 2u );
        bits = ( ( bits & 0x0F0F0F0Fu ) << 4u ) | ( ( bits & 0xF0F0F0F0u ) >> 4u );
        bits = ( ( bits & 0x00FF00FFu ) << 8u ) | ( ( bits & 0xFF00FF00u ) >> 8u );
        return float( bits ) * 2.3283064365386963e-10f;
    }

    vec2 hammersley( uint i, uint spp ) {
        return vec2( float( i ) / float( spp ), radical_inverse( i ) );
    }

    vec3 filtering_cube_map(samplerCube cube, vec3 n) {
        n.yz = -n.yz;
        return texture(cube, n).xyz;
    }

    vec3 filtering_cube_map_lod(samplerCube cube, vec3 n, float lod) {
        n.yz = -n.yz;
        return textureLod(cube, n, lod).xyz;
    }

    vec3 calc_fresnel(vec3 n, vec3 v, vec3 F0) {
        float ndotv = max(dot(n, v), 0.0);
        return F0 + (vec3(1.0, 1.0, 1.0) - F0) * pow(1.0 - ndotv, 5.0);
    }

    vec3 calc_fresnel_roughness(vec3 n, vec3 v, vec3 F0, float roughness) {
        float ndotv = max(dot(n, v), 0.0);
        return F0 + (max(vec3(1.0 - roughness), F0) - F0) * pow(1.0 - ndotv, 5.0);
    }

    float calc_NDF_GGX(vec3 n, vec3 h, float roughness) {
        float a = roughness * roughness;
        float a2 = a * a;
        float ndoth = max(dot(n, h), 0.0);
        float ndoth2 = ndoth * ndoth;
        float t = ndoth2 * (a2 - 1.0) + 1.0;
        float t2 = t * t;
        return a2 / (PI * t2);
    }

    float calc_Geometry_GGX(float costheta, float roughness) {
        float a = roughness;
        float r = a + 1.0;
        float r2 = r * r;
        float k = r2 / 8.0;

        float t = costheta * (1.0 - k) + k;

        return costheta / t;
    }

    float calc_Geometry_Smith(vec3 n, vec3 v, vec3 l, float roughness) {
        float ndotv = max(dot(n, v), 0.0);
        float ndotl = max(dot(n, l), 0.0);
        float ggx1 = calc_Geometry_GGX(ndotv, roughness);
        float ggx2 = calc_Geometry_GGX(ndotl, roughness);
        return ggx1 * ggx2;
    }

    float calc_Geometry_GGX_IBL(float costheta, float roughness) {
        float a = roughness * roughness;
        float k = a / 2.0;

        float t = costheta * (1.0 - k) + k;

        return costheta / t;
    }

    float calc_Geometry_Smith_IBL(vec3 n, vec3 v, vec3 l, float roughness) {
        float ndotv = max(dot(n, v), 0.0);
        float ndotl = max(dot(n, l), 0.0);
        float ggx1 = calc_Geometry_GGX_IBL(ndotv, roughness);
        float ggx2 = calc_Geometry_GGX_IBL(ndotl, roughness);
        return ggx1 * ggx2;    
    }

    vec3 calc_lighting_direct(vec3 n, vec3 v, vec3 l, vec3 h, vec3 albedo, float roughness, float metalic, vec3 light) {
        vec3 F0 = mix(vec3(0.04, 0.04, 0.04), albedo, metalic);
        vec3 F = calc_fresnel(h, v, F0);

        vec3 T = vec3(1.0, 1.0, 1.0) - F;
        vec3 kD = T * (1.0 - metalic);

        float D = calc_NDF_GGX(n, h, roughness);

        float G = calc_Geometry_Smith(n, v, l, roughness);

        vec3 Diffuse = kD * albedo * vec3(1.0 / PI, 1.0 / PI, 1.0 / PI);
        float t = 4.0 * max(dot(n, v), 0.0) * max(dot(n, l), 0.0) + 0.001;
        vec3 Specular = D * F * G * vec3(1.0 / t, 1.0 / t, 1.0 / t);

        float ndotl = max(dot(n, l), 0.0);
        return (Diffuse + Specular) * light * vec3(ndotl, ndotl, ndotl);
    }

    vec3 importance_sampling_ggx(vec2 xi, float roughness, vec3 n) {
        float a = roughness * roughness;

        float phi = 2.0 * PI * xi.x;
        float costheta = sqrt((1.0 - xi.y) / (1.0 + (a * a - 1.0) * xi.y));
        float sintheta = sqrt(1.0 - costheta * costheta);

        vec3 h = vec3(0.0, 0.0, 0.0);
        h.x = sintheta * cos(phi);
        h.y = sintheta * sin(phi);
        h.z = costheta;

        vec3 up = abs(n.z) < 0.999 ? vec3(0.0, 0.0, 1.0) : vec3(1.0, 0.0, 0.0);
        vec3 tx = normalize(cross(up, n));
        vec3 ty = cross(n, tx);

        return tx * h.x + ty * h.y + n * h.z;
    }

    float calc_lod(float pdf, float width, float height, float sampler) {
        float a = 0.5 * log2(width * height / sampler);
        float b = 0.5 * log2(pdf);
        if (pdf < 0.0001) b = a; // Avoid 0 roughness problem
        return max(a - b, 0.0);
    }

    vec3 calc_ibl(vec3 n, vec3 v, vec3 albedo, float roughness, float metalic) {
        vec3 F0 = mix(vec3(0.04, 0.04, 0.04), albedo, metalic);
        vec3 F = calc_fresnel_roughness(n, v, F0, roughness);

        // Diffuse part
        vec3 T = vec3(1.0, 1.0, 1.0) - F;
        vec3 kD = T * (1.0 - metalic);

        vec3 irradiance = filtering_cube_map(IrradianceMap, n);
        vec3 diffuse = kD * albedo * irradiance;

        // Specular part
        uint sampler = 256u;
        vec3 specular = vec3(0.0, 0.0, 0.0);

        for (uint i = 0u; i < sampler; i++) {
            vec2 xi = hammersley(i, sampler);
            vec3 h = importance_sampling_ggx(xi, roughness, n);
            vec3 l = 2.0 * dot(v, h) * h - v;

            float ndotv = max(0.0, dot(n, v));
            float ndoth = max(0.0, dot(n, h));
            float vdoth = max(0.0, dot(v, h));
            float ndotl = max(0.0, dot(n, l));

            if (ndotl > 0.0) {
                float D = calc_NDF_GGX(n, h, roughness);
                float pdf = D * ndoth / (4.0 * vdoth);
                float lod = calc_lod(pdf, 1024.0, 1024.0, float(sampler));

                vec3 light = filtering_cube_map_lod(EnvCubeMap, l, lod).xyz;
                float G = calc_Geometry_Smith_IBL(n, v, l, roughness);
                vec3 F_ibl = calc_fresnel(h, v, F0);
                specular = specular + light * F_ibl * G * vdoth / (ndoth * ndotv);
            }
        }

        specular = specular / float(sampler);

        return diffuse + specular;
    }

    void main() {
        vec2 coatUV = v_uv * vec2(20, 20);
        vec3 coatNormal = texture(NormalMap, coatUV).xyz;
        coatNormal = coatNormal * 2.0 - 1.0;
        vec3 cn = vec3( coatNormal.x, 
                    coatNormal.y, 
                    coatNormal.z);
        vec3 coat = matTBN * normalize(cn);
        vec3 varynormal = normalize(v_normal + coat * coatNormalScale);

        vec3 light = lightPos - v_position;
        light = normalize(light);

        vec3 half_vec = normalize(viewWorld + light);

        vec3 colorDirect = calc_lighting_direct(normalize(varynormal), viewWorld, light, half_vec, albedo, roughness, metalic, vec3(2.5, 2.5, 2.5));
        vec3 colorIBL = calc_ibl(normalize(varynormal), viewWorld, albedo, roughness, metalic);
        //vec3 color = colorDirect + colorIBL;
        vec3 color = colorIBL;

        // base tone mapping
        color = color / (color + vec3(1.0, 1.0, 1.0));

        // gamma correction
        color = pow(color, vec3(1.0 / 2.2, 1.0 / 2.2, 1.0 / 2.2));

        oColor = vec4(color, 1.0);
    }`;

    CreateIBLBruteForceCarPaintShader(scene:Scene, engine:Engine, camera:Camera){
        Effect.ShadersStore["IBLVertexShader"] = this.vs;
        Effect.ShadersStore["IBLFragmentShader"] = this.fs;

        const IBLmat = new ShaderMaterial(
            "IBLmat",
            scene,
            {
                vertex:"IBL",
                fragment:"IBL",
            },
            {
                attributes:[
                    VertexBuffer.PositionKind,
                    VertexBuffer.NormalKind,
                    VertexBuffer.UVKind,
                    VertexBuffer.TangentKind
                ],
                uniforms:[
                    "world",
                    "worldViewProjection",

                    "cPos",
                    "albedo",
                    "metalic",
                    "roughness",
                    "lightPos",
                    "NormalMap",
                ],
                samplers:[
                    "IrradianceMap",
                ]
            }
        );

        // testmat.zOffset = -2;
        // testmat.backFaceCulling = false;
        // testmat.needDepthPrePass = true;
        // testmat.disableDepthWrite = false;

        //IBL 参数设置
        IBLmat.setVector4("cPos", new Vector4(camera.position._x, camera.position._y, camera.position._z, 1.0));
        IBLmat.setColor3("albedo", new Color3(0.302, 0.557, 0.779));
        IBLmat.setVector3("lightPos", new Vector3(0.0, 0.0, 200.0));
        IBLmat.setFloat("metalic", 0.9);
        IBLmat.setFloat("roughness", 0.1);
        IBLmat.setFloat("coatNormalScale", 0.005);

        SceneLoader.ImportMesh("", "./models/", "speedshape.glb", scene, function(meshes){
            //meshes[1].computeWorldMatrix(true);
            //var mvpMatrix = meshes[1].getWorldMatrix().multiply(camera.getViewMatrix()).multiply(camera.getProjectionMatrix());
            // carPaintmat.setMatrix("world", meshes[1].getWorldMatrix());
            // carPaintmat.setMatrix("worldViewProjection", mvpMatrix);

            // testmat.setMatrix("world", meshes[1].getWorldMatrix());
            // testmat.setMatrix("worldViewProjection", mvpMatrix);

            meshes[1].material = IBLmat;
        });

        var IrrMap = CubeTexture.CreateFromPrefilteredData("./skybox/DiffuseHDR.dds", scene);
        //var IrrMap = new HDRCubeTexture("./skybox/lightBoxDiffuseHDR.dds", scene, 512);
        IBLmat.setTexture("IrradianceMap", IrrMap);

        var EnvCubeMap = CubeTexture.CreateFromPrefilteredData("./skybox/SpecularHDR.dds", scene);
        //var EnvCubeMap = new HDRCubeTexture("./skybox/lightBox.hdr", scene, 512);
        IBLmat.setTexture("EnvCubeMap", EnvCubeMap);

        var normtex = new Texture("./texture/OIP-C.jpg", scene);
        IBLmat.setTexture("NormalMap", normtex);

        var gui = new GuiCreator();
        gui.CreateIBLGUI(engine, IBLmat);

        engine.runRenderLoop(() => {
            IBLmat.setVector4("cPos", new Vector4(camera.position._x, camera.position._y, camera.position._z, 0.0));
        });
    }
}