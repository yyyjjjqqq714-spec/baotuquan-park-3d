# -*- coding: utf-8 -*-
"""
组装完全离线的单文件 dist/index.html：
- 若 build/ 下缺少 Three.js r147 UMD 依赖，自动从 unpkg CDN 下载；
- 将依赖与 build/app/ 下全部应用代码内联进一个 HTML。
用法：python3 build/build.py
"""
import os
import urllib.request

ROOT = os.path.dirname(os.path.abspath(__file__))
PROJ = os.path.dirname(ROOT)
OUT_DIR = os.path.join(PROJ, 'dist')
OUT = os.path.join(OUT_DIR, 'index.html')

VENDOR = {
    'three.min.js': 'https://unpkg.com/three@0.147.0/build/three.min.js',
    'OrbitControls.js': 'https://unpkg.com/three@0.147.0/examples/js/controls/OrbitControls.js',
    'CSS2DRenderer.js': 'https://unpkg.com/three@0.147.0/examples/js/renderers/CSS2DRenderer.js',
    'GLTFExporter.js': 'https://unpkg.com/three@0.147.0/examples/js/exporters/GLTFExporter.js',
}


def ensure_vendor():
    for name, url in VENDOR.items():
        p = os.path.join(ROOT, name)
        if os.path.exists(p) and os.path.getsize(p) > 1000:
            continue
        print('downloading', name, '...')
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        with open(p, 'wb') as f:
            f.write(data)
        print('  saved', round(len(data) / 1024), 'KB')


def read(p):
    with open(os.path.join(ROOT, p), encoding='utf-8') as f:
        return f.read()


CSS = """
*{margin:0;padding:0;box-sizing:border-box;}
html,body{width:100%;height:100%;overflow:hidden;font-family:"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;background:#0e1518;}
#stage{position:fixed;inset:0;}
#stage canvas{display:block;}
.card{position:fixed;background:rgba(18,28,34,.82);color:#e8eeF0;backdrop-filter:blur(8px);
  border:1px solid rgba(255,255,255,.12);border-radius:12px;box-shadow:0 6px 24px rgba(0,0,0,.35);z-index:10;}
#header{left:16px;top:14px;padding:12px 16px;max-width:340px;}
#header h1{font-size:17px;font-weight:700;letter-spacing:1px;color:#f0d488;}
#header .sub{font-size:11.5px;color:#b9c6c9;margin-top:5px;line-height:1.6;}
#header .tag{display:inline-block;font-size:10.5px;color:#cfe3d2;border:1px solid rgba(120,180,140,.4);
  border-radius:20px;padding:1px 9px;margin:6px 6px 0 0;}
#panel{right:16px;top:14px;padding:12px 14px;width:208px;font-size:12.5px;}
#panel .pt{font-size:12px;color:#f0d488;font-weight:700;margin-bottom:8px;letter-spacing:1px;}
#panel label{display:flex;align-items:center;gap:7px;padding:3.5px 0;cursor:pointer;color:#dce5e7;}
#panel input{accent-color:#c8a24a;}
#panel button{display:block;width:100%;margin-top:7px;padding:7px 0;border:none;border-radius:7px;cursor:pointer;
  font-size:12.5px;color:#10181b;background:linear-gradient(180deg,#e8c877,#cda34c);font-weight:600;}
#panel button:hover{filter:brightness(1.08);}
#panel button.sec{background:rgba(255,255,255,.12);color:#e8eef0;font-weight:400;}
#legend{right:16px;bottom:16px;padding:10px 13px;font-size:11.5px;line-height:1.9;color:#d5dedf;}
#legend .li{display:flex;align-items:center;gap:7px;}
#legend .sw{width:15px;height:10px;border-radius:2px;display:inline-block;}
#compass{right:16px;bottom:128px;width:64px;height:64px;border-radius:50%;
  background:rgba(18,28,34,.82);border:1px solid rgba(255,255,255,.18);z-index:10;
  display:flex;align-items:center;justify-content:center;}
#compass-needle{position:relative;width:44px;height:44px;transition:transform .15s;}
#compass-needle::before{content:'北';position:absolute;top:-2px;left:50%;transform:translateX(-50%);
  font-size:10px;color:#e8c877;font-weight:700;}
#compass-needle::after{content:'';position:absolute;left:50%;top:12px;transform:translateX(-50%);
  border-left:6px solid transparent;border-right:6px solid transparent;border-bottom:30px solid #d9543f;}
#scale{position:fixed;right:92px;bottom:20px;z-index:10;color:#dce5e7;font-size:10.5px;text-align:right;}
#scale-bar{height:7px;border-right:2px solid #e8eef0;border-bottom:2px solid #e8eef0;border-left:2px solid #e8eef0;margin-top:3px;background:rgba(255,255,255,.25);}
#infocard{position:fixed;left:16px;bottom:16px;width:330px;max-width:calc(100vw - 32px);padding:14px 16px;
  transform:translateY(140%);transition:transform .35s ease;z-index:11;}
#infocard.show{transform:translateY(0);}
#infocard h3{font-size:15px;color:#f0d488;margin-bottom:7px;padding-right:22px;}
#infocard p{font-size:12.5px;line-height:1.75;color:#d6e0e2;}
#info-close{position:absolute;right:10px;top:8px;border:none;background:none;color:#9fb0b3;font-size:17px;cursor:pointer;}
#loading{position:fixed;inset:0;background:#0e1518;z-index:50;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:18px;color:#dce5e7;font-size:14px;transition:opacity .6s;}
.ring{width:42px;height:42px;border:3px solid rgba(255,255,255,.15);border-top-color:#e8c877;
  border-radius:50%;animation:spin 1s linear infinite;}
@keyframes spin{to{transform:rotate(360deg);}}
.plabel{display:flex;flex-direction:column;align-items:center;transform:translateY(-4px);}
.plabel .dot{width:7px;height:7px;border-radius:50%;background:#f0d488;border:1.5px solid #fff;
  box-shadow:0 0 6px rgba(0,0,0,.6);margin-bottom:2px;}
.plabel.spring .dot{background:#6fd0e0;}
.plabel.gate .dot{background:#e07a5f;}
.plabel .txt{font-size:11px;color:#fff;background:rgba(16,28,36,.74);border:1px solid rgba(255,255,255,.22);
  padding:1px 7px;border-radius:9px;white-space:nowrap;letter-spacing:.5px;text-shadow:0 1px 2px rgba(0,0,0,.6);}
.plabel.arch .txt{background:rgba(40,34,20,.76);}
.plabel.gate .txt{background:rgba(120,45,32,.82);}
@media(max-width:640px){
  #header{max-width:210px;padding:9px 11px;}
  #header h1{font-size:14px;} #header .sub{font-size:10.5px;}
  #panel{width:158px;padding:9px 10px;font-size:11.5px;}
  #legend{display:none;} #compass{bottom:14px;width:52px;height:52px;}
  #scale{right:76px;bottom:16px;}
}
"""

HTML = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>济南趵突泉公园 · 场地三维模型（离线版）</title>
<style>__CSS__</style>
</head>
<body>
<div id="stage"></div>

<div id="header" class="card">
  <h1>济南·趵突泉公园 场地三维模型</h1>
  <div class="sub">天下第一泉景区核心园区（约10.5公顷）程序化复原<br>拖拽旋转 · 滚轮缩放 · 点击景点查看介绍</div>
  <span class="tag">泉池 30m×18m</span><span class="tag">三股水涌泉</span><span class="tag">古建群复原</span>
</div>

<div id="panel" class="card">
  <div class="pt">图层与视角</div>
  <label><input type="checkbox" id="toggle-labels" checked>景点标签</label>
  <label><input type="checkbox" id="toggle-spring" checked>三股水涌泉动画</label>
  <label><input type="checkbox" id="toggle-trees" checked>园林植被</label>
  <label><input type="checkbox" id="toggle-rotate">自动环绕</label>
  <button id="btn-reset" class="sec">复位视角</button>
  <button id="btn-top" class="sec">俯视总览</button>
  <button id="btn-export">导出 glTF/GLB 模型</button>
</div>

<div id="legend" class="card">
  <div class="li"><span class="sw" style="background:#3f8e98;"></span>泉池 / 水面</div>
  <div class="li"><span class="sw" style="background:#7d7c74;"></span>灰瓦古建</div>
  <div class="li"><span class="sw" style="background:#d3a13c;"></span>黄琉璃瓦（观澜亭·泺源堂）</div>
  <div class="li"><span class="sw" style="background:#467a52;"></span>绿琉璃瓦（南门）</div>
  <div class="li"><span class="sw" style="background:#6d8f45;"></span>绿地山林</div>
  <div class="li"><span class="sw" style="background:#c9c2b0;"></span>园路广场</div>
</div>

<div id="compass"><div id="compass-needle"></div></div>
<div id="scale"><div id="scale-text">50 米</div><div id="scale-bar" style="width:90px;"></div></div>

<div id="infocard" class="card">
  <button id="info-close">×</button>
  <h3 id="info-title"></h3>
  <p id="info-body"></p>
</div>

<div id="loading"><div class="ring"></div><div id="loadtext">正在加载场地模型…</div></div>

<script>window.BTQ={};</script>
<script>__THREE__</script>
<script>__ORBIT__</script>
<script>__CSS2D__</script>
<script>__GLTF__</script>
<script>__TEXTURES__</script>
<script>__TERRAIN__</script>
<script>__ARCH__</script>
<script>__LAYOUT__</script>
<script>__VEG__</script>
<script>__MAIN__</script>
</body>
</html>
"""


def main():
    ensure_vendor()
    parts = {
        '__CSS__': CSS,
        '__THREE__': read('three.min.js'),
        '__ORBIT__': read('OrbitControls.js'),
        '__CSS2D__': read('CSS2DRenderer.js'),
        '__GLTF__': read('GLTFExporter.js'),
        '__TEXTURES__': read(os.path.join('app', 'textures.js')),
        '__TERRAIN__': read(os.path.join('app', 'terrain.js')),
        '__ARCH__': read(os.path.join('app', 'architecture.js')),
        '__LAYOUT__': read(os.path.join('app', 'layout.js')),
        '__VEG__': read(os.path.join('app', 'vegetation.js')),
        '__MAIN__': read(os.path.join('app', 'main.js')),
    }
    html = HTML
    for k, v in parts.items():
        html = html.replace(k, v)
    os.makedirs(OUT_DIR, exist_ok=True)
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(html)
    print('written:', OUT, round(os.path.getsize(OUT) / 1024), 'KB')


if __name__ == '__main__':
    main()
