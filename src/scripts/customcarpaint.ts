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

export class CustomCarPaintCreator{
    fragmentshader:string = /*glsl*/`
    #version 300 es

    uniform float fresnelScale;
    uniform float fresnelHard;
    uniform vec4 secondPaintColor;
    uniform vec4 albedo;
    uniform sampler2D texture0;
    uniform float coatNormalScale;
    uniform samplerCube cubemap1;
    uniform float roughness;
    uniform float reflEnvMapScale;
    uniform float reflScale;
    uniform float reflHard;
    
    in vec3 v_normal;
    in vec3 v_tangent;
    in vec3 v_bitangent;
    in vec3 viewWorld;
    in mat3 matTBN;
    in vec2 v_uv;

    out vec4 FragColor;
    
    void main() {
        float NdotV = dot(normalize(v_normal), normalize(viewWorld.xyz));
        float baseMask = mix(0.0, 1.0, 1.0 - fresnelScale * pow(clamp(1.0 - NdotV, 0.0, 1.0), fresnelHard));
        vec4 baseBlend = mix(secondPaintColor, albedo, baseMask);
    
        vec2 coatUV = v_uv * vec2(20, 20);
        vec3 coatNormal = texture(texture0, coatUV).xyz;
        coatNormal = coatNormal * 2.0 - 1.0;
        vec3 cn = vec3( coatNormal.x, 
                    coatNormal.y, 
                    coatNormal.z);
        vec3 coat = matTBN * normalize(cn);
        vec3 varynormal = normalize(v_normal + coat * coatNormalScale);
        
        
        vec3 worldRefl = reflect(normalize(viewWorld.xyz), normalize(varynormal));
        vec3 reflUV = normalize(worldRefl);
        vec4 reflMap = texture(cubemap1, reflUV, roughness);
        
        vec3 reflShift = mix(albedo.rgb, reflMap.rgb, reflEnvMapScale);
        vec4 reflColor = vec4(reflShift, 1.0);
        
        float ref_NdotV = dot(normalize(varynormal), normalize(viewWorld));
        float reflMask = mix(0.0, 1.0, reflScale * pow((1.0 - ref_NdotV), reflHard));
        vec4 coatRef = mix(albedo, reflColor, reflMask);
        
        //FragColor = vec4(1, 1, 1, 1);
        FragColor = mix(coatRef, baseBlend, 0.8);
        //FragColor = vec4(abs(varynormal), 1.0);
        //FragColor = vec4(coatNormal, 1.0);
        //FragColor = vec4(vec3(ref_NdotV),1);
        //mix(coatRef, baseBlend, 1.0);
        //mix(coatRef, baseBlend, 0.85);
    }`;

    vertexshader:string = /*glsl*/`
    #version 300 es

    uniform mat4 worldViewProjection;
    uniform mat4 world;
    uniform vec4 cPos;

    layout (location = 0) in vec3 position;
    layout (location = 1) in vec3 normal;
    layout (location = 2) in vec2 uv;
    layout (location = 3) in vec3 tangent;

    out vec3 v_normal;
    out vec3 v_tangent;
    out vec3 v_bitangent;
    out vec3 viewWorld;
    out mat3 matTBN;
    out vec2 v_uv;

    void main() {
        v_normal = normalize((world * vec4(normal, 1.0)).xyz);
        v_tangent = normalize((world * vec4(tangent, 1.0)).xyz);
        v_bitangent = cross(v_normal, v_tangent);
        
        viewWorld = normalize(cPos.xyz - (world * vec4(position, 1)).xyz);
        
        matTBN = mat3(normalize(v_tangent), normalize(v_bitangent), normalize(v_normal));
        
        v_uv = uv;
        gl_Position = worldViewProjection * vec4(position, 1);
    }`;

    CreaterCarPaintShader(engine:Engine, scene:Scene, camera:Camera){
        Effect.ShadersStore["customVertexShader"] = this.vertexshader;
        Effect.ShadersStore["customFragmentShader"] = this.fragmentshader;

        const carPaintmat = new ShaderMaterial(
            "carP",
            scene,
            {
                vertex:"custom",
                fragment:"custom",
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
                    "fresnelScale",
                    "fresnelHard",
                    "secondPaintColor",
                    "albedo",
                    "coatNormalScale",
                    "roughness",
                    "reflEnvMapScale",
                    "reflScale",
                    "reflHard",
                ],
                samplers:[
                    "texture0",
                    "cubemap1",
                ]
            }
        );

        carPaintmat.setFloat("fresnelScale",1.0);
        carPaintmat.setFloat("fresnelHard", 16.0);
        carPaintmat.setColor4("secondPaintColor", new Color4(1.0, 1.0, 1.0, 1.0));
        carPaintmat.setColor4("albedo", new Color4(0.302, 0.557, 0.779, 1.0));
        carPaintmat.setFloat("coatNormalScale", 0.005);
        carPaintmat.setFloat("roughness", 1.0);
        carPaintmat.setVector4("cPos", new Vector4(camera.position._x, camera.position._y, camera.position._z, 1.0));
        carPaintmat.setFloat("reflEnvMapScale", 0.03);
        carPaintmat.setFloat("reflScale", 1.0);
        carPaintmat.setFloat("reflHard", 3.0);

        var normtex = new Texture("./texture/OIP-C.jpg", scene);
        var envtex = new HDRCubeTexture("./skybox/lightBox.hdr", scene, 512);

        carPaintmat.setTexture("texture0", normtex);
        carPaintmat.setTexture("cubemap1", envtex);

        SceneLoader.ImportMesh("", "./models/", "speedshape.glb", scene, function(meshes){
            //meshes[1].computeWorldMatrix(true);
            //var mvpMatrix = meshes[1].getWorldMatrix().multiply(camera.getViewMatrix()).multiply(camera.getProjectionMatrix());
            // carPaintmat.setMatrix("world", meshes[1].getWorldMatrix());
            // carPaintmat.setMatrix("worldViewProjection", mvpMatrix);

            // testmat.setMatrix("world", meshes[1].getWorldMatrix());
            // testmat.setMatrix("worldViewProjection", mvpMatrix);

            meshes[1].material = carPaintmat;
        });

                //清漆材质
        // var mat = new PBRMaterial("pbr", scene);

        // mat.albedoColor = new Color3(255.0/255.0, 39.0/255.0, 0.0/255.0);
        // mat.metallic = 1.0;
        // mat.roughness = 1.0;
        // mat.clearCoat.isEnabled = true;
        // mat.clearCoat.indexOfRefraction = 1;

        // mat.clearCoat.isTintEnabled = true;
        // mat.clearCoat.intensity = 0.5;
        // //mat.clearCoat.tintColor = Color3.White();
        // mat.clearCoat.tintColor = new Color3(255.0/255.0, 39.0/255.0, 0.0/255.0);
        // mat.clearCoat.tintColorAtDistance = 1.5;
        // mat.clearCoat.tintThickness = 2;

        //生成橘皮纹理的法线贴图
        // var noiseTexture = new NoiseProceduralTexture("perlin", 256, scene);
        // noiseTexture.octaves = 7.0;
        // noiseTexture.persistence = 1.25;
        // noiseTexture.animationSpeedFactor = 0.0;

        // var bumptex = new Texture("./texture/OIP-C.jpg", scene);
        // bumptex.vScale = 20.0;
        // bumptex.uScale = 20.0;
        // bumptex.level = 0.005;
        //mat.clearCoat.bumpTexture = bumptex;

        //obj.material = mat;     

        // var box = MeshBuilder.CreateBox("1");
        // box.material = carPaintmat;

        // SceneLoader.LoadAssetContainer("./models/", "speedshape.glb", scene, function(container){
        //     container.addAllToScene();
        //     container.meshes[0].computeWorldMatrix();
        //     worldmatrix = container.meshes[0].getWorldMatrix();
        //     container.meshes[0].material = carPaintmat;
        // })


        //var postProcess1 = new FxaaPostProcess("fxaa", 2.0, camera);
        //scene.createDefaultCamera(true, true, true);

        //var tempPos = camera.position;

        engine.runRenderLoop(() => {
            carPaintmat.setVector4("cPos", new Vector4(camera.position._x, camera.position._y, camera.position._z, 0.0));
        })

        var gui = new GuiCreator();
        gui.CreateCocosGui(engine, carPaintmat);
    }
}