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

///测试一下
///dsdd

export class GuiCreator{
    CreateCocosGui(engine:Engine, carPaintmat:ShaderMaterial){
        //GUI//
        var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        var GUIable = false;
        // var pane_bg = new StackPanel("pane_bg");
        // var pane_base = new StackPanel("pane_base");
        // pane_base.width = "800px";
        // pane_base.height = "800px";

        //文本
        var rect1 = new Rectangle();
        rect1.left = 1000;
        rect1.top = 0;
        rect1.width = 0.2;
        rect1.height = "800px";
        rect1.cornerRadius = 5;
        rect1.color = "#252525";
        rect1.thickness = 2;
        rect1.background = "white";

        var offset = 100;
        var left_offset = -100;
        var right_offset = 100;

        // advancedTexture.addControl(pane_base);
        //advancedTexture.addControl(pane_bg);

        // var pane_text_fresnelScale = new StackPanel("pane_text_fresnelScale");
        // pane_text_fresnelScale.left = 0;
        // pane_text_fresnelScale.top = "800px";
        //advancedTexture.addControl(pane_text_fresnelScale);

        var text_title = new TextBlock();
        text_title.left = 0;
        text_title.top = -300;
        text_title.text = "相关参数";
        text_title.color = "#252525";
        text_title.fontSize = 28;
        rect1.addControl(text_title); 
          
        var text_fresnelScale = new TextBlock();
        text_fresnelScale.left = left_offset;
        text_fresnelScale.top = -280 + offset;
        text_fresnelScale.text = "fresnelScale:";
        text_fresnelScale.color = "#252525";
        text_fresnelScale.fontSize = 22;
        rect1.addControl(text_fresnelScale);  
 

        var text_fresnelHard = new TextBlock();
        text_fresnelHard.left = left_offset;
        text_fresnelHard.top = -210 + offset;
        text_fresnelHard.text = "fresnelHard:";
        text_fresnelHard.color = "#252525";
        text_fresnelHard.fontSize = 22;
        rect1.addControl(text_fresnelHard);  

        var text_albedo = new TextBlock();
        text_albedo.left = left_offset;
        text_albedo.top = -140 + offset;
        text_albedo.text = "albedo:";
        text_albedo.color = "#252525";
        text_albedo.fontSize = 22;
        rect1.addControl(text_albedo); 

        //coatNormalScale
        var text_coatNormalScale = new TextBlock();
        text_coatNormalScale.left = left_offset;
        text_coatNormalScale.top = -70 + offset;
        text_coatNormalScale.text = "coatNormalScale:";
        text_coatNormalScale.color = "#252525";
        text_coatNormalScale.fontSize = 22;
        rect1.addControl(text_coatNormalScale);  

        var text_reflHard = new TextBlock();
        text_reflHard.left = left_offset;
        text_reflHard.top = 0+ offset;
        text_reflHard.text = "reflHard:";
        text_reflHard.color = "#252525";
        text_reflHard.fontSize = 22;
        rect1.addControl(text_reflHard); 

        var text_reflScale = new TextBlock();
        text_reflScale.left = left_offset;
        text_reflScale.top = 70 + offset;
        text_reflScale.text = "reflScale:";
        text_reflScale.color = "#252525";
        text_reflScale.fontSize = 22;
        rect1.addControl(text_reflScale); 

        var text_reflEnvMapScale = new TextBlock();
        text_reflEnvMapScale.left = left_offset;
        text_reflEnvMapScale.top = 140 + offset;
        text_reflEnvMapScale.text = "reflEnvMapScale:";
        text_reflEnvMapScale.color = "#252525";
        text_reflEnvMapScale.fontSize = 22;
        rect1.addControl(text_reflEnvMapScale); 

        /////////////////////////////交互组件////////////////////////////

        var input = new InputText();
        input.left = right_offset;
        input.top = -280 + offset;
        input.width = 0.2;
        input.maxWidth = 0.2;
        input.height = "40px";
        input.text = "1";
        input.color = "black";
        input.focusedBackground  = "#edebeb";
        input.background = "white";
        rect1.addControl(input);    


        var input_fresnelHard = new InputText();
        input_fresnelHard.left = right_offset;
        input_fresnelHard.top = -210 + offset;
        input_fresnelHard.width = 0.2;
        input_fresnelHard.maxWidth = 0.2;
        input_fresnelHard.height = "40px";
        input_fresnelHard.text = "16";
        input_fresnelHard.color = "black";
        input_fresnelHard.focusedBackground  = "#edebeb";
        input_fresnelHard.background = "white";
        rect1.addControl(input_fresnelHard);  

        var pane1 = new StackPanel();
        pane1.left = right_offset;
        pane1.top = -140 + offset;
        rect1.addControl(pane1);
        //滑块
        var slider1 = new Slider();
        slider1.minimum = 0;              //滑块的最小值
        slider1.maximum = 0.99;     //滑块的最大值
        slider1.value = 208 / 360;
        slider1.height = "20px";
        slider1.width = "150px";
        slider1.onValueChangedObservable.add(function(value) {    //滑块改变事件
            var rgb = hsv2rgb(slider1.value * 360);
            carPaintmat.setColor4("albedo", new Color4(rgb._x, rgb._y, rgb._z, 1.0));
        });
        pane1.addControl(slider1);    


        var pane2 = new StackPanel();
        pane2.left = right_offset;
        pane2.top = -70 + offset;
        rect1.addControl(pane2);
        //header是一个文本块，显示滑块的值
        var header2 = new TextBlock();
        header2.text = "0                    0.1";
        header2.height = "30px";
        header2.color = "#252525";
        pane2.addControl(header2); 
        //滑块
        var slider2 = new Slider();
        slider2.minimum = 0;              //滑块的最小值
        slider2.maximum = 0.1;     //滑块的最大值
        slider2.value = 0.005;
        slider2.height = "20px";
        slider2.width = "150px";
        slider2.onValueChangedObservable.add(function(value) {    //滑块改变事件
            carPaintmat.setFloat("coatNormalScale", slider2.value);
        });
        pane2.addControl(slider2); 

        var input_reflHard = new InputText();
        input_reflHard.left = right_offset;
        input_reflHard.top = -0 + offset;
        input_reflHard.width = 0.2;
        input_reflHard.maxWidth = 0.2;
        input_reflHard.height = "40px";
        input_reflHard.text = "1";
        input_reflHard.color = "black";
        input_reflHard.focusedBackground  = "#edebeb";
        input_reflHard.background = "white";
        rect1.addControl(input_reflHard);  
        
        var input_reflScale = new InputText();
        input_reflScale.left = right_offset;
        input_reflScale.top = 70 + offset;
        input_reflScale.width = 0.2;
        input_reflScale.maxWidth = 0.2;
        input_reflScale.height = "40px";
        input_reflScale.text = "3";
        input_reflScale.color = "black";
        input_reflScale.focusedBackground  = "#edebeb";
        input_reflScale.background = "white";
        rect1.addControl(input_reflScale);

        var pane3 = new StackPanel();
        pane3.left = right_offset;
        pane3.top = 140 + offset;
        rect1.addControl(pane3);
        //header是一个文本块，显示滑块的值
        var header3 = new TextBlock();
        header3.text = "0                    0.2";
        header3.height = "30px";
        header3.color = "#252525";
        pane3.addControl(header3); 
        //滑块
        var slider3 = new Slider();
        slider3.minimum = 0;              //滑块的最小值
        slider3.maximum = 0.2;     //滑块的最大值
        slider3.value = 0.03;
        slider3.height = "20px";
        slider3.width = "150px";
        slider3.onValueChangedObservable.add(function(value) {    //滑块改变事件
            carPaintmat.setFloat("reflEnvMapScale", slider3.value);
        });
        pane3.addControl(slider3); 


        var button1 = Button.CreateSimpleButton("but1", "参数菜单");
        button1.top = -650;
        button1.left = 1200;
        button1.width = "150px"
        button1.height = "40px";
        button1.color = "#252525";
        button1.cornerRadius = 5;
        button1.background = "white";
        button1.onPointerUpObservable.add(function() {
            if(GUIable){
                advancedTexture.removeControl(rect1);
                GUIable = false;
            }
            else{
                advancedTexture.addControl(rect1);
                GUIable = true;
            }
        });
        advancedTexture.addControl(button1); 

        // var button2 = Button.CreateSimpleButton("but1", "IBLdiffuse");
        // button2.top = -600;
        // button2.left = 1200;
        // button2.width = "150px"
        // button2.height = "40px";
        // button2.color = "#252525";
        // button2.cornerRadius = 5;
        // button2.background = "white";
        // button2.onPointerUpObservable.add(function() {
        //     if(button2.textBlock.text == "IBLdiffuseMat"){
        //         button2.textBlock.text = "CocosStoreCarPaintMat";
        //         SceneLoader.ImportMesh("", "./models/", "speedshape.glb", scene, function(meshes){
        //             meshes[1].material = IBLmat;
        //         });
        //         if(GUIable){
        //             advancedTexture.removeControl(rect1);
        //             GUIable = false;
        //         }
        //     }
        //     else{
        //         button2.textBlock.text = "IBLdiffuseMat";
        //         SceneLoader.ImportMesh("", "./models/", "speedshape.glb", scene, function(meshes){
        //             meshes[1].material = carPaintmat;
        //         });
        //     }
        // });
        // advancedTexture.addControl(button2); 

        engine.runRenderLoop(() => {
            carPaintmat.setFloat("fresnelScale", Number(input.text));
            carPaintmat.setFloat("fresnelHard", Number(input_fresnelHard.text));
            carPaintmat.setFloat("reflScale", Number(input_reflScale.text));
            carPaintmat.setFloat("reflHard", Number(input_reflHard.text));
        })
    }


    CreateIBLGUI(engine:Engine, IBLmat:ShaderMaterial){
        var advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI("UI");

        var GUIable = false;

        var rect1 = new Rectangle();
        rect1.left = 1000;
        rect1.top = 0;
        rect1.width = 0.2;
        rect1.height = "800px";
        rect1.cornerRadius = 5;
        rect1.color = "#252525";
        rect1.thickness = 2;
        rect1.background = "white";

        //advancedTexture.addControl(rect1);

        var offset = 100;
        var left_offset = -100;
        var right_offset = 100;

        var text_title = new TextBlock();
        text_title.left = 0;
        text_title.top = -300;
        text_title.text = "相关参数";
        text_title.color = "#252525";
        text_title.fontSize = 28;
        rect1.addControl(text_title); 

        var text_roughness = new TextBlock();
        text_roughness.left = left_offset;
        text_roughness.top = -140 + offset;
        text_roughness.text = "roughness:";
        text_roughness.color = "#252525";
        text_roughness.fontSize = 22;
        rect1.addControl(text_roughness); 


        var text_metalic = new TextBlock();
        text_metalic.left = left_offset;
        text_metalic.top = -70 + offset;
        text_metalic.text = "metalic:";
        text_metalic.color = "#252525";
        text_metalic.fontSize = 22;
        rect1.addControl(text_metalic); 

        var pane1 = new StackPanel();
        pane1.left = right_offset;
        pane1.top = -140 + offset;
        rect1.addControl(pane1);
        //滑块
        var slider1 = new Slider();
        slider1.minimum = 0;              //滑块的最小值
        slider1.maximum = 0.25;     //滑块的最大值
        slider1.value = 0.1;
        slider1.height = "20px";
        slider1.width = "150px";
        slider1.onValueChangedObservable.add(function(value) {    //滑块改变事件
            IBLmat.setFloat("roughness", slider1.value);
        });
        pane1.addControl(slider1);
        
        var pane2 = new StackPanel();
        pane2.left = right_offset;
        pane2.top = -70 + offset;
        rect1.addControl(pane2);
        //滑块
        var slider2 = new Slider();
        slider2.minimum = 0;              //滑块的最小值
        slider2.maximum = 1;     //滑块的最大值
        slider2.value = 0.9;
        slider2.height = "20px";
        slider2.width = "150px";
        slider2.onValueChangedObservable.add(function(value) {    //滑块改变事件
            IBLmat.setFloat("metalic", slider2.value);
        });
        pane2.addControl(slider2); 

        var button1 = Button.CreateSimpleButton("but1", "参数菜单");
        button1.top = -650;
        button1.left = 1200;
        button1.width = "150px"
        button1.height = "40px";
        button1.color = "#252525";
        button1.cornerRadius = 5;
        button1.background = "white";
        button1.onPointerUpObservable.add(function() {
            if(GUIable){
                advancedTexture.removeControl(rect1);
                GUIable = false;
            }
            else{
                advancedTexture.addControl(rect1);
                GUIable = true;
            }
        });
        advancedTexture.addControl(button1);
    }
}

function hsv2rgb(H: number) { //0.136
    var rgb = new Vector3(1, 1, 1);
    var S = 0.612;
    var V = 0.779;
    var C = V * S; //0.5016
    var X = C * (1 - Math.abs((H / 60) % 2 - 1)) 
    var m = V - C;

    var i = (H - H % 60) / 60;
    if(H == 360) H = 0;

    switch(i){
        case 0 : rgb = new Vector3(C, X, 0); break;
        case 1 : rgb = new Vector3(X, C, 0); break;
        case 2 : rgb = new Vector3(0, C, X); break;
        case 3 : rgb = new Vector3(0, X, C); break;
        case 4 : rgb = new Vector3(X, 0, C); break;
        case 5 : rgb = new Vector3(C, 0, X); break;
    }

    rgb = new Vector3(rgb._x + m, rgb._y + m, rgb._z + m)

    return rgb;
}