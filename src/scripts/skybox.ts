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

export class SkyboxCreator{
    CreateSkybox(scene:Scene){
        //var skyboxtex = CubeTexture.CreateFromPrefilteredData("./skybox/lightBoxDiffuseHDR.dds", scene);

        //var skyboxtex = CubeTexture.CreateFromPrefilteredData("./skybox/environment.env", scene);

        var skyboxtex = new HDRCubeTexture("./skybox/lightBox.hdr", scene, 512);
        const skybox = MeshBuilder.CreateBox("skybox", {size: 1000.0}, scene);
        const skyboxmat = new StandardMaterial("skybox", scene);
        skyboxmat.backFaceCulling = false;
        skyboxmat.reflectionTexture = skyboxtex;
        skyboxmat.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
        skyboxmat.diffuseColor = new Color3(0, 0, 0);
        skyboxmat.specularColor = new Color3(0, 0, 0);
        skybox.material = skyboxmat;
    }
}