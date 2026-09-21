/* ============================================================
 * 主控：场景 / 相机 / 光照 / 标签 / 交互 / HUD / 导出 / 循环
 * ============================================================ */
(function () {
  const BTQ = window.BTQ;
  BTQ.clickables = [];
  BTQ.registerClickable = function (obj, name, desc) {
    obj.userData.name = name;
    obj.userData.desc = desc || '';
    obj.traverse(c => { c.userData.rootName = name; c.userData.rootDesc = desc; });
    BTQ.clickables.push(obj);
  };

  let scene, camera, renderer, labelRenderer, controls, clock;
  BTQ.scene = null;

  const LABELS = [
    ['趵突泉·三股水', -40, 3.2, 180, 'spring'],
    ['观澜亭', -57.5, 6.5, 178, 'arch'],
    ['泺源堂', -40, 11, 202, 'arch'],
    ['娥姜祠', -40, 7, 221, 'arch'],
    ['三圣殿', -40, 7, 239, 'arch'],
    ['来鹤桥', -16, 2.5, 170, 'arch'],
    ['蓬山旧迹坊', -8, 7, 157.5, 'arch'],
    ['望鹤亭茶社', -4.5, 6, 175, 'arch'],
    ['白雪楼·大戏台', 14, 11, 150, 'arch'],
    ['枫溪', 70, 2, 124, 'spring'],
    ['枫榭', 44, 6, 122, 'arch'],
    ['枫溪桥', 2, 3, 105, 'arch'],
    ['沧园·王雪涛纪念馆', 48, 6, 70, 'arch'],
    ['万竹园', -112, 4, 130, 'arch'],
    ['李苦禅纪念馆', -104, 6, 168, 'arch'],
    ['望水泉', -108, 2, 153, 'spring'],
    ['白龙湾', -125, 2, 38, 'spring'],
    ['李清照纪念堂', 22, 6, 264, 'arch'],
    ['易安旧居', -18, 5, 262, 'arch'],
    ['静治堂', 22, 5, 306, 'arch'],
    ['漱玉泉', 20, 2.4, 238, 'spring'],
    ['马跑泉', 58, 2, 263, 'spring'],
    ['龟石', 33, 3, 236, 'arch'],
    ['尚志堂', 8, 5, 216, 'arch'],
    ['金线泉', -6, 2, 217, 'spring'],
    ['柳絮泉', 4, 2, 244, 'spring'],
    ['无忧泉', -17, 2, 140, 'spring'],
    ['湛露泉·酒泉·石湾泉', 42, 2, 133, 'spring'],
    ['杜康泉', -79, 2, 181, 'spring'],
    ['濯缨池', -12, 2, 328, 'spring'],
    ['趵突泉南门', 0, 9, 1, 'gate'],
    ['趵突泉北门', -20, 6, 466, 'gate'],
    ['趵突泉东门', 140, 6, 205, 'gate'],
    ['泉水文化展览馆', -20, 6, 446, 'arch'],
    ['北部山亭', 50, 6, 360, 'arch'],
    ['晴雨溪', 137, 2, 168, 'spring'],
    ['护城河', 159, 2, 320, 'spring'],
    ['泉城广场', 262, 12, 175, 'arch']
  ];

  function init() {
    scene = new THREE.Scene();
    BTQ.scene = scene;
    scene.fog = new THREE.FogExp2(0xdce7ec, 0.0016);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.5, 4000);
    camera.position.set(-78, 165, -125);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.06;
    document.getElementById('stage').appendChild(renderer.domElement);

    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';
    document.getElementById('stage').appendChild(labelRenderer.domElement);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.target.set(-32, 0, 175);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = 1.46;
    controls.minDistance = 12;
    controls.maxDistance = 750;
    controls.update();

    // 天空
    const skyGeo = new THREE.SphereGeometry(2200, 24, 16);
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { top: { value: new THREE.Color(0x6fa8d6) }, bottom: { value: new THREE.Color(0xeef4f2) } },
      vertexShader: 'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying vec3 vP; void main(){ float h=normalize(vP).y*0.5+0.5; gl_FragColor=vec4(mix(bottom,top,smoothstep(0.0,0.85,h)),1.0); }'
    });
    const sky = new THREE.Mesh(skyGeo, skyMat);
    sky.userData.noExport = true;
    scene.add(sky);

    // 光照
    scene.add(new THREE.HemisphereLight(0xcfe6ff, 0x8d9078, 0.9));
    const sun = new THREE.DirectionalLight(0xfff1d2, 1.45);
    sun.position.set(-160, 230, -90);
    sun.castShadow = true;
    sun.shadow.mapSize.set(4096, 4096);
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 700;
    sun.shadow.camera.left = -240;
    sun.shadow.camera.right = 240;
    sun.shadow.camera.top = 260;
    sun.shadow.camera.bottom = -200;
    sun.shadow.bias = -0.0006;
    sun.target.position.set(-10, 0, 160);
    scene.add(sun, sun.target);
    const fill = new THREE.DirectionalLight(0xbfd6ff, 0.3);
    fill.position.set(150, 120, 200);
    scene.add(fill);

    // ===== 搭建场景 =====
    document.getElementById('loadtext').textContent = '正在生成地形与水系…';
    BTQ.buildCity();
    BTQ.buildTerrain();
    BTQ.buildWaters();
    BTQ.buildPaths();
    document.getElementById('loadtext').textContent = '正在复原古建筑群…';
    BTQ.buildSpringPool();
    BTQ.buildAllLayout();
    document.getElementById('loadtext').textContent = '正在栽种园林植被…';
    BTQ.buildVegetation();
    buildLabels();

    bindUI();
    window.addEventListener('resize', onResize);
    document.getElementById('loading').style.opacity = '0';
    setTimeout(() => document.getElementById('loading').style.display = 'none', 600);

    // 调试/截图机位接口（即时到位）
    window.__goto = (pos, tgt) => {
      fly = null;
      camera.position.set(pos[0], pos[1], pos[2]);
      controls.target.set(tgt[0], tgt[1], tgt[2]);
      controls.update();
    };

    clock = new THREE.Clock();
    animate();
  }

  function buildLabels() {
    const g = new THREE.Group();
    g.name = 'labels';
    BTQ.labelGroup = g;
    LABELS.forEach(l => {
      const div = document.createElement('div');
      div.className = 'plabel ' + l[4];
      div.innerHTML = `<span class="dot"></span><span class="txt">${l[0]}</span>`;
      const obj = new THREE.CSS2DObject(div);
      obj.position.set(l[1], l[2], l[3]);
      g.add(obj);
    });
    scene.add(g);
  }

  // ===== 交互拾取 =====
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let downPos = null;
  function onClick(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(BTQ.clickables, true);
    if (hits.length) {
      let o = hits[0].object;
      while (o && !o.userData.name) o = o.parent;
      if (o && o.userData.name) showInfo(o.userData.name, o.userData.desc);
    }
  }

  function showInfo(name, desc) {
    const card = document.getElementById('infocard');
    document.getElementById('info-title').textContent = name;
    document.getElementById('info-body').textContent = desc || '（暂无介绍）';
    card.classList.add('show');
  }

  function bindUI() {
    renderer.domElement.addEventListener('pointerdown', e => { downPos = [e.clientX, e.clientY]; });
    renderer.domElement.addEventListener('pointerup', e => {
      if (!downPos) return;
      if (Math.hypot(e.clientX - downPos[0], e.clientY - downPos[1]) < 6) onClick(e);
      downPos = null;
    });

    document.getElementById('toggle-labels').addEventListener('change', e => {
      BTQ.labelGroup.visible = e.target.checked;
    });
    document.getElementById('toggle-spring').addEventListener('change', e => {
      state.springOn = e.target.checked;
    });
    document.getElementById('toggle-trees').addEventListener('change', e => {
      BTQ.vegetationGroup.visible = e.target.checked;
    });
    document.getElementById('toggle-rotate').addEventListener('change', e => {
      controls.autoRotate = e.target.checked;
      controls.autoRotateSpeed = 0.55;
    });
    document.getElementById('btn-reset').addEventListener('click', () => {
      camera.fov = 50;
      camera.updateProjectionMatrix();
      flyTo(new THREE.Vector3(-78, 165, -125), new THREE.Vector3(-32, 0, 175));
    });
    document.getElementById('btn-top').addEventListener('click', () => {
      flyTo(new THREE.Vector3(-20, 620, 60), new THREE.Vector3(-20, 0, 160));
    });
    document.getElementById('btn-export').addEventListener('click', exportGLB);
    document.getElementById('info-close').addEventListener('click', () => {
      document.getElementById('infocard').classList.remove('show');
    });
  }

  const state = { springOn: true };
  let fly = null;
  function flyTo(pos, tgt) {
    fly = { p0: camera.position.clone(), p1: pos, t0: controls.target.clone(), t1: tgt, t: 0 };
  }

  function exportGLB() {
    const btn = document.getElementById('btn-export');
    btn.textContent = '导出中…';
    btn.disabled = true;
    const exporter = new THREE.GLTFExporter();
    const changed = [];
    BTQ.labelGroup.visible = false;
    scene.traverse(o => {
      if (o.isPoints || o.userData.noExport) { o.visible = false; changed.push(o); }
      else if (o.material && o.material.isShaderMaterial && o.geometry) {
        changed.push(o);
        o.userData.__mat = o.material;
        o.material = new THREE.MeshStandardMaterial({ color: 0x2c7286, transparent: true, opacity: 0.86, roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide });
      }
    });
    exporter.parse(scene, result => {
      const blob = new Blob([result], { type: 'model/gltf-binary' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'baotuquan-park.glb';
      a.click();
      URL.revokeObjectURL(a.href);
      changed.forEach(o => {
        if (o.userData.__mat) { o.material = o.userData.__mat; delete o.userData.__mat; }
        else o.visible = true;
      });
      BTQ.labelGroup.visible = document.getElementById('toggle-labels').checked;
      btn.textContent = '导出 glTF/GLB 模型';
      btn.disabled = false;
    }, err => {
      console.error(err);
      alert('导出失败：' + err);
      btn.textContent = '导出 glTF/GLB 模型';
      btn.disabled = false;
    }, { binary: true, onlyVisible: true, truncateDrawRange: false });
  }

  function onResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  }

  function animate() {
    requestAnimationFrame(animate);
    const t = clock.getElapsedTime();
    BTQ.updateWater(t);
    if (state.springOn) BTQ.springAnims.forEach(fn => fn(t));
    if (fly) {
      fly.t = Math.min(1, fly.t + 0.025);
      const k = 1 - Math.pow(1 - fly.t, 3);
      camera.position.lerpVectors(fly.p0, fly.p1, k);
      controls.target.lerpVectors(fly.t0, fly.t1, k);
      if (fly.t >= 1) fly = null;
    }
    controls.update();
    // 指北针
    const az = controls.getAzimuthalAngle();
    document.getElementById('compass-needle').style.transform = `rotate(${-az * 180 / Math.PI}deg)`;
    // 比例尺
    const dist = camera.position.distanceTo(controls.target);
    const polar = controls.getPolarAngle();
    const visH = 2 * dist * Math.tan(camera.fov * Math.PI / 360) * Math.sin(polar);
    const groundM = visH * 130 / window.innerHeight;
    const steps = [10, 20, 30, 50, 100, 200, 300, 500];
    const pick = steps.find(s => s >= groundM) || 500;
    const bar = document.getElementById('scale-bar');
    bar.style.width = Math.round(130 * pick / visH) + 'px';
    document.getElementById('scale-text').textContent = pick + ' 米';
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
