import "@babylonjs/core/Debug/debugLayer";
import "@babylonjs/inspector";
import "@babylonjs/loaders/glTF";
// import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
// import { Control } from "@babylonjs/gui/2D/controls/control";
// import { Button } from "@babylonjs/gui/2D/controls/button";
import { AdvancedDynamicTexture } from "@babylonjs/gui/2D/advancedDynamicTexture";
import { InputText, TextBlock, Rectangle, StackPanel, Control, Slider, Container, Button } from "@babylonjs/gui/2D/controls";
import { Effect } from "@babylonjs/core/Materials/effect"
import { PostProcess, Engine, Scene, ArcRotateCamera, Vector3, HemisphericLight, Mesh, MeshBuilder, StandardMaterial, Color3, CubeTexture, Texture, DirectionalLight, PBRMaterial, HDRCubeTexture, PassPostProcess, FxaaPostProcess, ProceduralTexture, NoiseProceduralTexture, ShaderMaterial, VertexBuffer, Vector4, Color4, Matrix, float } from "@babylonjs/core";
import { SceneLoader } from '@babylonjs/core/Loading/sceneLoader';

import { CustomCarPaintCreator } from './scripts/customcarpaint';
import { IBLBruteForceCarPaintCreator } from './scripts/IBLcarpaint';
import { SkyboxCreator } from './scripts/skybox';
import { FNMTexture } from './scripts/FMNtexture';

///拉取测试
//测试2


class App {
    constructor() {
        var canvas = document.createElement("canvas");
        canvas.style.width = "100%";
        canvas.style.height = "100%";
        canvas.id = "gameCanvas";
        document.body.appendChild(canvas);

        var engine = new Engine(canvas, true);
        var scene = new Scene(engine);

        //scene.debugLayer.show();

        var camera = new ArcRotateCamera("Camera", 0, 0, 7, new Vector3(0, 0, 0), scene);
        camera.attachControl(canvas, false);
        //var light = new HemisphericLight("light", new Vector3(0, 0, 1), scene);
        //var light = new DirectionalLight("light", new Vector3(0, 0, -1), scene);
        //light.intensity = 1;
        //light.diffuse = new Color3(255/255 ,223/255 ,202/255);
        //light.groundColor = new Color3(137/255, 113/255, 93/255);
        //light.specular = new Color3(255/255 ,145/255 ,0/255);
        //light.groundColor = new Color3(0, 1, 0);

        var skybc = new SkyboxCreator()
        skybc.CreateSkybox(scene);

        // var cococCP = new CustomCarPaintCreator();
        // cococCP.CreaterCarPaintShader(engine, scene, camera);

        // var iblCP = new IBLBruteForceCarPaintCreator();
        // iblCP.CreateIBLBruteForceCarPaintShader(scene, engine, camera);

        var postprocess = new PassPostProcess("scale_pass", 2.0, camera, Texture.LINEAR_LINEAR_MIPNEAREST);


        ///test///
        var plane = MeshBuilder.CreateGround("gd");

        var fragmentshader = `
        #version 300 es

        uniform sampler2D itexture;
        
        in vec2 v_uv;
        out vec4 outColor;
        
        void main() {
           outColor = texture(itexture, v_uv);
        }`;

        var vertexshader = `
        #version 300 es

        uniform mat4 worldViewProjection;
        uniform mat4 world;
        
        layout (location = 0) in vec3 position;
        layout (location = 1) in vec3 normal;
        layout (location = 2) in vec2 uv;
        
        out vec2 v_uv;
        
        void main() {
           v_uv = uv;
           gl_Position = worldViewProjection * vec4(position, 1);
        }`;

        Effect.ShadersStore["customVertexShader"] = vertexshader;
        Effect.ShadersStore["customFragmentShader"] = fragmentshader;


        var tex = new ShaderMaterial(
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
                ],
                uniforms:[
                    "world",
                    "worldViewProjection",
                ],
                samplers:[
                    "itexture",
                ]
            }
        );

        tex.setTexture("itexture", new FNMTexture(1920 * 4, scene));

        plane.material = tex;

        engine.runRenderLoop(() => {
            scene.render();
        });
    }
}
new App();

