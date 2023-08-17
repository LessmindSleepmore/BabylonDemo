import { CustomProceduralTexture } from '@babylonjs/core/Materials/Textures/Procedurals/customProceduralTexture';
import { Effect } from '@babylonjs/core/Materials/effect';
import { Tools } from '@babylonjs/core/Misc/tools';
import { Scene } from '@babylonjs/core/scene';

Effect.ShadersStore["FlakeNormalMapPixelShader"] =/*glsl*/`
    #ifdef GL_ES
    precision highp float;
    precision highp int;
    #endif

    varying vec2 vUV;
    
    uniform float flake_scale;                  // 较小的值会放大薄片贴图，较大的值会缩小。
    uniform float flake_size;                   // 薄片的相对尺寸
    uniform float flake_size_variance;          // 0.0 makes all flakes the same size, 1.0 assigns random size between 0 and the given flake size
    uniform float flake_normal_orientation;     // Blend between the flake normals (0.0) and the surface normal (1.0)

    float bits_to_01(uint bits) {
        // uint div = uint(0xffffffff);
        return float(bits) * (1.0 / float(uint(0xffffffff)));
    }

    uint rotl32(uint var, uint hops) {
        return (var << hops) | (var >> (uint(32) - hops));
    }

    // Bob Jenkins "lookup3" hashes:  http://burtleburtle.net/bob/c/lookup3.c
    // It's in the public domain.

    // Mix up the bits of a, b, and c (changing their values in place).
    // 混合 a、b 和 c （就地改变它们的值）。
    void bjmix(inout uint a, inout uint b, inout uint c) {
        a -= c;  a ^= rotl32(c, uint(4));  c += b;
        b -= a;  b ^= rotl32(a, uint(6));  a += c;
        c -= b;  c ^= rotl32(b, uint(8));  b += a;
        a -= c;  a ^= rotl32(c, uint(16));  c += b;
        b -= a;  b ^= rotl32(a, uint(19));  a += c;
        c -= b;  c ^= rotl32(b, uint(4));  b += a;
    }

    // Mix up and combine the bits of a, b, and c (doesn't change them, but
    // returns a hash of those three original values).  21 ops
    // 混合并组合 a、b 和 c 的位（不更改它们，但返回这三个原始值的散列）。 21 次操作
    uint bjfinal(uint a, uint b, uint c) {
        c ^= b; c -= rotl32(b, uint(14));
        a ^= c; a -= rotl32(c, uint(11));
        b ^= a; b -= rotl32(a, uint(25));
        c ^= b; c -= rotl32(b, uint(16));
        a ^= c; a -= rotl32(c, uint(4));
        b ^= a; b -= rotl32(a, uint(14));
        c ^= b; c -= rotl32(b, uint(24));
        return c;
    }

    uint inthash(uvec4 k)  {
        int N = 4;

        // now hash the data!
        uint len = uint(N);
        uint a = uint(0xdeadbeef) + (len << 2) + uint(13);
        uint b = uint(0xdeadbeef) + (len << 2) + uint(13);
        uint c = uint(0xdeadbeef) + (len << 2) + uint(13);

        a += k[0];
        b += k[1];
        c += k[2];
        bjmix(a, b, c);

        a += k[3];
        c = bjfinal(a, b, c);

        return c;
    }

    vec3 hash3(uvec4 k) {
        int N = 4;

        vec3 result;

        k[N - 1] = uint(0);
        result.x = bits_to_01(inthash(k));

        k[N - 1] = uint(1);
        result.y = bits_to_01(inthash(k));

        k[N - 1] = uint(2);
        result.z = bits_to_01(inthash(k));

        return result;
    }

    vec3 cellnoise(vec3 p) {
        uvec4 iv;
        iv[0] = uint(floor(p.x));
        iv[1] = uint(floor(p.y));
        iv[2] = uint(floor(p.z));

        vec3 result = hash3(iv);

        return result;
    }

    vec4 generateFlakes(vec2 uv) {
        float safe_flake_size_variance = clamp(flake_size_variance, 0.1, 1.0);
    
        vec3 cellCenters[9];
        cellCenters[0] = vec3(0.5, 0.5, 0.0);
        cellCenters[1] = vec3(1.5, 0.5, 0.0);
        cellCenters[2] = vec3(1.5, 1.5, 0.0);
        cellCenters[3] = vec3(0.5, 1.5, 0.0);
        cellCenters[4] = vec3(-0.5, 1.5, 0.0);
        cellCenters[5] = vec3(-0.5, 0.5, 0.0);
        cellCenters[6] = vec3(-0.5, -0.5, 0.0);
        cellCenters[7] = vec3(0.5, -0.5, 0.0);
        cellCenters[8] = vec3(1.5, -0.5, 0.0);

        // vec3 cellCenters[4];
        // cellCenters[0] = vec3(0.0, 0.0, 0.0);
        // cellCenters[1] = vec3(1.0, 0.0, 0.0);
        // cellCenters[2] = vec3(1.0, 1.0, 0.0);
        // cellCenters[3] = vec3(0.0, 1.0, 0.0);
        
 
        vec3 position = vec3(uv.x, uv.y, 0.0);
        position = flake_scale * position;
    
        vec3 base = floor(position);
    
        vec3 nearestCell = vec3(0.0, 0.0, 1.0);
        int nearestCellIndex = -1;
    
        for (int cellIndex = 0; cellIndex < 9; ++cellIndex)   {
            vec3 cellCenter = base + cellCenters[cellIndex];
    
            vec3 centerOffset = cellnoise(cellCenter) * 2.0 - 1.0;
            centerOffset[2] *= safe_flake_size_variance;
            centerOffset = normalize(centerOffset);
    
            cellCenter += 0.5 * centerOffset;
            float cellDistance = distance(position, cellCenter);
    
            if (cellDistance < flake_size && cellCenter[2] < nearestCell[2]) {
                nearestCell = cellCenter;
                nearestCellIndex = cellIndex;
            }
        }
    
        vec4 color = vec4(0.5, 0.5, 1.0, 0.0);

        vec3 I = vec3(0, 0, 1);
    
        if (nearestCellIndex != -1) {
            vec3 randomNormal = cellnoise(base + cellCenters[nearestCellIndex] + vec3(0.0, 0.0, 1.5));
            float alpha = normalize(randomNormal).x;
            randomNormal = 2.0 * randomNormal - 1.0;
            randomNormal = faceforward(randomNormal, I, randomNormal);
            randomNormal = normalize(mix(randomNormal, vec3(0.0, 0.0, 1.0), flake_normal_orientation));
    
            color = vec4(0.5*randomNormal[0] + 0.5, 0.5*randomNormal[1] + 0.5, randomNormal[2], 1.0);
        }

        return color;
    }
    
    void main(void) {
        gl_FragColor = vec4(generateFlakes(vUV));
    }
`;

export interface FNMTexturePara {
    flake_count: number;
    flake_sa_2: number;
    flake_size_variance: number;
    flake_normal_orientation: number;
};

export class FNMTexture extends CustomProceduralTexture {
    private _flake_count: number;
    private _flake_sa_2: number;

    private _flake_scale: number;
    private _flake_size: number;
    private _flake_size_variance: number;
    private _flake_normal_orientation: number;

    constructor(size: number, scene: Scene, para?: FNMTexturePara){
        super("FNMTexture", "FlakeNormalMap", size, scene, undefined, true, true);

        this.updateSamplingMode(3);

        var data: FNMTexturePara = {
            flake_count: para?.flake_count || 3505,
            flake_sa_2: para?.flake_sa_2 ||0.307200521,
            flake_size_variance: para?.flake_size_variance || 0,
            flake_normal_orientation: para?.flake_normal_orientation || 0.7
        }

        this.flake_count = data.flake_count;
        this.flake_sa_2 = data.flake_sa_2;
        this.flake_size_variance = data.flake_size_variance;
        this.flake_normal_orientation = data.flake_normal_orientation; 
        
        this.refreshRate = 0;

        // const count = 3505;
        // const areas = 81.69640765;
        // const sa_1 =  68.40261237;
        // const sa_2 =  0.307200521;

        // this.flake_scale = Math.sqrt(count * 7680 / 1920 * 7680 / 1080);

        // 根据area计算
        // this.flake_size = Math.sqrt(areas / Math.PI) / Math.sqrt(1920 * 1080 / count);
        // 根据sa1计算
        // this.flake_size = Math.sqrt(sa_1 / Math.PI) /  Math.sqrt(1920 * 1080 / count);
        // 根据sa2计算
        // this.flake_size = Math.sqrt(sa_2 / Math.PI);
    }

    public async saveTexture(name: string) {
        var data = await this.readPixels(0,0);
        var size = this.getSize();
        var canvas2 = document.createElement("canvas");
        var context = canvas2.getContext('2d');
        canvas2.height= 1080; //size.width
        canvas2.width= 1920;  //size.height
        var imgData = context!.createImageData(size.width, size.height);
        imgData.data.set(data as any);
        context!.putImageData(imgData, 0, 0);

        Tools.ToBlob(canvas2, (blob) => {
            if (blob) {
                Tools.Download(blob, name + ".png");
            }
        });
    }

    public get flake_count(): number {return this._flake_count;}
    public set flake_count(value: number) {this._flake_count = value; this.flake_scale = Math.sqrt(this._flake_count * this.getSize().height / 1920 * this.getSize().width / 1080);}

    public get flake_sa_2(): number {return this._flake_sa_2;}
    public set flake_sa_2(value: number) {this._flake_sa_2 = value; this.flake_size = Math.sqrt(this._flake_sa_2 / Math.PI);}

    public get flake_scale() { return this._flake_scale; }
    public set flake_scale(value) { this._flake_scale = value; this.setFloat("flake_scale", this._flake_scale); this.refreshRate = 0; }

    public get flake_size() { return this._flake_size; }
    public set flake_size(value) { this._flake_size = value; this.setFloat("flake_size", this._flake_size); this.refreshRate = 0; }

    public get flake_size_variance() { return this._flake_size_variance; }
    public set flake_size_variance(value) { this._flake_size_variance = value; this.setFloat("flake_size_variance", this._flake_size_variance); this.refreshRate = 0; }

    public get flake_normal_orientation() { return this._flake_normal_orientation; }
    public set flake_normal_orientation(value) { this._flake_normal_orientation = value; this.setFloat("flake_normal_orientation", this._flake_normal_orientation); this.refreshRate = 0; }
}
        