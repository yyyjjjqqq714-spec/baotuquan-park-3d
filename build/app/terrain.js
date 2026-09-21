/* ============================================================
 * 地形 / 边界 / 城市环境 / 园路 / 水系 / 趵突泉泉池与涌泉
 * 坐标：x 东向(米), z 北向(米), y 高程(米)；南门中点约 (0,0)
 * ============================================================ */
(function () {
  const BTQ = window.BTQ;
  const M = BTQ.materials;
  const T = BTQ.textures;

  // ---- 公园边界（顺时针，依据官方导游图轮廓描点，南北约470m，南宽北窄，约10.5ha）----
  const BOUNDARY = [
    [-20, 472], [-72, 428], [-90, 360], [-104, 268], [-130, 202],
    [-134, 150], [-140, 92], [-150, 42], [-134, 2], [-60, -3],
    [0, -1], [82, 3], [133, 32], [144, 120], [146, 206],
    [139, 262], [113, 346], [83, 426], [32, 463], [-20, 472]
  ];
  BTQ.BOUNDARY = BOUNDARY;

  // ---- 地形高程：北部挖湖堆山的小丘，其余微起伏；建筑/水面区由各自平面覆盖 ----
  const HILLS = [
    { x: -30, z: 360, r: 70, h: 4.2 },
    { x: 55, z: 380, r: 60, h: 3.2 },
    { x: 10, z: 300, r: 45, h: 2.0 },
    { x: -75, z: 330, r: 40, h: 2.4 }
  ];
  function terrainHeight(x, z) {
    let y = 0.10 * Math.sin(x * 0.055 + 1.7) * Math.cos(z * 0.047) + 0.06 * Math.sin(x * 0.13 + z * 0.11);
    for (const h of HILLS) {
      const d2 = (x - h.x) ** 2 / (h.r ** 2) + (z - h.z) ** 2 / (h.r ** 2);
      if (d2 < 1) y += h.h * (1 - d2) ** 1.6;
    }
    return y;
  }
  BTQ.terrainHeight = terrainHeight;

  // ---- 几何工具 ----
  // 世界 XZ 多边形 -> THREE.Shape（自动定向为逆时针，保证法线朝上）
  function shapeFromXZ(points) {
    const pts = points.map(p => [p[0], -p[1]]);
    let area = 0;
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      area += pts[i][0] * pts[j][1] - pts[j][0] * pts[i][1];
    }
    if (area < 0) pts.reverse();
    const s = new THREE.Shape();
    s.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) s.lineTo(pts[i][0], pts[i][1]);
    s.closePath();
    return s;
  }
  function flatShape(points, material, y, seg) {
    const geo = new THREE.ShapeGeometry(shapeFromXZ(points), seg || 8);
    geo.rotateX(-Math.PI / 2);
    // 按世界米数重设 UV，避免纹理拉伸/过密
    const p = geo.attributes.position;
    const uv = [];
    for (let i = 0; i < p.count; i++) uv.push(p.getX(i) * 0.45, p.getZ(i) * 0.45);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.y = y || 0;
    mesh.receiveShadow = true;
    return mesh;
  }
  BTQ.flatShape = flatShape;

  function pointInPolygon(points, x, z) {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const xi = points[i][0], zi = points[i][1], xj = points[j][0], zj = points[j][1];
      if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
    }
    return inside;
  }
  BTQ.pointInPolygon = pointInPolygon;

  // 中线点串 -> 带状多边形
  function ribbon(points, width) {
    const left = [], right = [];
    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const p0 = points[Math.max(0, i - 1)], p1 = points[Math.min(points.length - 1, i + 1)];
      let dx = p1[0] - p0[0], dz = p1[1] - p0[1];
      const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
      const nx = -dz, nz = dx;
      left.push([p[0] + nx * width * 0.5, p[1] + nz * width * 0.5]);
      right.push([p[0] - nx * width * 0.5, p[1] - nz * width * 0.5]);
    }
    return left.concat(right.reverse());
  }
  BTQ.ribbon = ribbon;

  function box(w, h, d, mat, x, y, z) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }
  BTQ.box = box;

  // ================= 地形 =================
  function pointInPolygon(poly, x, z) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
      if (((zi > z) !== (zj > z)) && (x < (xj - xi) * (z - zi) / (zj - zi) + xi)) inside = !inside;
    }
    return inside;
  }
  function distToPolygon(poly, x, z) {
    let best = Infinity;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const ax = poly[j][0], az = poly[j][1], bx = poly[i][0], bz = poly[i][1];
      const dx = bx - ax, dz = bz - az;
      const l2 = dx * dx + dz * dz;
      let t = l2 ? ((x - ax) * dx + (z - az) * dz) / l2 : 0;
      t = Math.max(0, Math.min(1, t));
      best = Math.min(best, Math.hypot(x - (ax + t * dx), z - (az + t * dz)));
    }
    return best;
  }

  // 枫溪自然弯曲岸线（中部偏南东西向水面）
  const FENGXI = [
    [-72, 116], [-55, 110], [-35, 114], [-15, 108], [10, 111], [35, 107], [60, 112],
    [85, 109], [110, 116], [132, 120], [138, 128], [128, 135], [105, 133], [80, 138],
    [55, 133], [30, 139], [5, 133], [-20, 139], [-45, 133], [-62, 130]
  ];

  // 水面区域表（name, 多边形, 深度）：地形在该区域下沉，避免戳出水面
  const WATER_BEDS = [
    { poly: [[150, 30], [168, 30], [168, 470], [156, 470], [150, 420], [146, 260], [146, 120]], d: -0.7 },
    { poly: [[-120, 474], [160, 474], [160, 490], [-120, 490]], d: -0.7 },
    { poly: FENGXI, d: -0.8 },
    { poly: [[128, 130], [142, 128], [146, 210], [136, 212], [130, 170]], d: -0.7 },
    { poly: [[-148, 18], [-118, 14], [-96, 24], [-92, 44], [-104, 58], [-132, 60], [-150, 44]], d: -0.8 },
    { poly: [[-100, 55], [-88, 62], [-78, 92], [-74, 110], [-82, 112], [-90, 88], [-98, 62]], d: -0.7 },
    { poly: [[-34, 312], [8, 310], [16, 326], [6, 344], [-26, 346], [-38, 330]], d: -0.7 },
    { poly: [[46, 248], [70, 246], [74, 266], [66, 280], [48, 278], [42, 262]], d: -0.7 },
    { poly: [[-28, 130], [-6, 128], [-2, 146], [-16, 152], [-30, 144]], d: -0.7 },
    { poly: [[22, 122], [58, 120], [64, 140], [50, 150], [26, 146], [18, 134]], d: -0.7 },
    { poly: [[-24, 156], [4, 154], [10, 192], [-12, 198], [-24, 188]], d: -0.7 },
    { poly: [[-55, 171], [-25, 171], [-25, 189], [-55, 189]], d: -2.5 } // 趵突泉泉池深坑
  ];
  // 小泉池统一 -0.7
  [
    [[13, 232], [27.8, 232], [27.8, 245.1], [13, 245.1]], [[-2, 240], [10, 240], [10, 249], [-2, 249]],
    [[-14, 212], [2, 212], [2, 222], [-14, 222]], [[-18, 226], [-6, 226], [-6, 235], [-18, 235]],
    [[6, 200], [18, 200], [18, 210], [6, 210]], [[-12, 198], [0, 198], [0, 207], [-12, 207]],
    [[-118, 148], [-98, 148], [-98, 158], [-118, 158]], [[-132, 104], [-118, 104], [-118, 114], [-132, 114]],
    [[-84, 176], [-74, 176], [-74, 186], [-84, 186]], [[-86, 158], [-76, 158], [-76, 168], [-86, 168]],
    [[-137, 210], [-128, 210], [-128, 220], [-137, 220]], [[-66, 214], [-56, 214], [-56, 224], [-66, 224]],
    [[-46, 152], [-34, 152], [-30, 142], [-42, 140]]
  ].forEach(p => WATER_BEDS.push({ poly: p, d: -0.7 }));
  BTQ.WATER_BEDS = WATER_BEDS;

  function buildTerrain() {
    const g = new THREE.Group();
    const terrainShape = shapeFromXZ(BOUNDARY);
    // 泉池处开洞（28×16m），由石砌深坑与水面填充
    const poolHole = new THREE.Path();
    [[-54, 172], [-26, 172], [-26, 188], [-54, 188]].forEach((p, i) => {
      const X = p[0], Y = -p[1];
      if (i) poolHole.lineTo(X, Y); else poolHole.moveTo(X, Y);
    });
    poolHole.closePath();
    terrainShape.holes.push(poolHole);
    const geo = new THREE.ShapeGeometry(terrainShape, 24);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      pos.setY(i, terrainHeight(pos.getX(i), pos.getZ(i)));
    }
    geo.computeVertexNormals();
    const tuv = [];
    for (let i = 0; i < pos.count; i++) tuv.push(pos.getX(i) * 0.32, pos.getZ(i) * 0.32);
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(tuv, 2));
    const mesh = new THREE.Mesh(geo, M.grass());
    mesh.receiveShadow = true;
    mesh.name = 'parkTerrain';
    g.add(mesh);

    // 边界矮墙/界石（公园轮廓压边）
    const wallMat = M.brick(30, 1);
    for (let i = 0; i < BOUNDARY.length; i++) {
      const a = BOUNDARY[i], b = BOUNDARY[(i + 1) % BOUNDARY.length];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const len = Math.hypot(dx, dz);
      if (len > 26) continue; // 仅沿较直段放界墙
      const w = box(len, 0.5, 0.5, wallMat, (a[0] + b[0]) / 2, 0.25, (a[1] + b[1]) / 2);
      w.rotation.y = Math.atan2(dx, dz);
      w.castShadow = false;
      g.add(w);
    }
    BTQ.scene.add(g);
  }

  // ================= 城市环境 =================
  function buildCity() {
    const g = new THREE.Group();
    // 城市大地（泉池位置开洞，露出石砌深坑）
    const cityShape = new THREE.Shape();
    cityShape.moveTo(-700, -700); cityShape.lineTo(700, -700);
    cityShape.lineTo(700, 700); cityShape.lineTo(-700, 700); cityShape.closePath();
    const cityHole = new THREE.Path();
    [[-55, 170.5], [-25, 170.5], [-25, 189.5], [-55, 189.5]].forEach((p, i) => {
      const X = p[0], Y = -p[1];
      if (i) cityHole.lineTo(X, Y); else cityHole.moveTo(X, Y);
    });
    cityHole.closePath();
    cityShape.holes.push(cityHole);
    const city = new THREE.Mesh(new THREE.ShapeGeometry(cityShape), new THREE.MeshStandardMaterial({ color: 0xb5b3a8, roughness: 1 }));
    city.rotation.x = -Math.PI / 2;
    city.position.y = -0.18;
    city.receiveShadow = true;
    g.add(city);

    // 泺源大街（南）
    g.add(flatShape([[-400, -10], [400, -10], [400, -34], [-400, -34]], M.road(20, 2), -0.05));
    // 趵突泉南路（东）
    g.add(flatShape([[172, -40], [196, -40], [196, 500], [172, 500]], M.road(2, 30), -0.05));
    // 共青团路（北）
    g.add(flatShape([[-400, 478], [400, 478], [400, 500], [-400, 500]], M.road(20, 2), -0.05));
    // 西侧道路
    g.add(flatShape([[-178, -40], [-160, -40], [-160, 440], [-190, 440]], M.road(2, 24), -0.05));

    // 道路中线
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xe8e4d0 });
    for (let x = -380; x < 400; x += 24) {
      const l = box(12, 0.02, 0.35, lineMat, x, -0.02, -22);
      l.castShadow = false; g.add(l);
    }
    for (let z = -20; z < 480; z += 24) {
      const l = box(0.35, 0.02, 12, lineMat, 184, -0.02, z);
      l.castShadow = false; g.add(l);
    }

    // 泉城广场（公园东侧）
    const sq = flatShape([[200, 40], [340, 40], [340, 300], [200, 300]], M.square(8, 8), -0.08);
    g.add(sq);
    // 泉标简化（蓝色泉标造型：螺旋柱+球体）
    const mark = new THREE.Group();
    const mk = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 2.2, 30, 8), new THREE.MeshStandardMaterial({ color: 0x3b6fb0, metalness: 0.6, roughness: 0.3 }));
    mk.position.y = 15;
    const ball = new THREE.Mesh(new THREE.SphereGeometry(4.2, 16, 12), new THREE.MeshStandardMaterial({ color: 0x5a92d0, metalness: 0.6, roughness: 0.25 }));
    ball.position.y = 33;
    mark.add(mk, ball);
    mark.position.set(262, -0.1, 175);
    g.add(mark);

    // 周边城市建筑（灰盒子，高度克制，置于远景）
    const cityMat = new THREE.MeshStandardMaterial({ color: 0xc9c6bc, roughness: 0.95 });
    const blocks = [
      [-260, 120, 70, 60, 26], [-300, 250, 60, 70, 34], [-250, 380, 80, 55, 22],
      [280, 380, 70, 60, 30], [300, 470, 60, 60, 40], [-80, 540, 90, 45, 20],
      [60, 545, 70, 40, 26], [250, -90, 80, 50, 18], [-220, -90, 70, 50, 16],
      [-230, 30, 60, 50, 20], [310, 30, 55, 45, 24]
    ];
    blocks.forEach(b => {
      const m = box(b[2], b[4], b[3], cityMat, b[0], b[4] / 2 - 0.1, b[1]);
      m.castShadow = false;
      g.add(m);
    });

    // 五龙潭方向水面（北界外，点景）
    g.add(flatShape([[-160, 512], [-40, 512], [-40, 560], [-160, 560]], waterMaterial(0.5), -0.04));
    BTQ.scene.add(g);
  }

  // ================= 水面 =================
  const waterUniforms = [];
  function waterMaterial(opacity, deepColor, shallowColor) {
    const uniforms = {
      time: { value: 0 },
      deep: { value: new THREE.Color(deepColor || 0x1e6b63) },
      shallow: { value: new THREE.Color(shallowColor || 0x57a48f) },
      opacity: { value: opacity === undefined ? 0.94 : opacity }
    };
    waterUniforms.push(uniforms);
    return new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      side: THREE.DoubleSide,
      vertexShader: `
        uniform float time;
        varying vec3 vW;
        void main(){
          vec3 p = position;
          float w = sin(p.x*0.5 + time*1.1)*0.012 + cos(p.y*0.6 + time*0.9)*0.012;
          p.z += w;
          vec4 wp = modelMatrix * vec4(p,1.0);
          vW = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      fragmentShader: `
        uniform float time; uniform vec3 deep; uniform vec3 shallow; uniform float opacity;
        varying vec3 vW;
        void main(){
          vec3 V = normalize(cameraPosition - vW);
          float fres = pow(1.0 - max(dot(V, vec3(0.0,1.0,0.0)), 0.0), 2.2);
          float r1 = sin(vW.x*0.9 + vW.z*0.7 + time*1.0)*0.5
                   + sin(vW.x*0.35 - vW.z*0.55 + time*0.7)*0.3
                   + sin((vW.x+vW.z)*0.18 + time*0.5)*0.2;
          float glint = pow(max(r1,0.0), 8.0) * 0.18;
          vec3 col = mix(deep, shallow, 0.32 + fres*0.5 + r1*0.03);
          col += vec3(0.85,0.95,0.95) * glint;
          gl_FragColor = vec4(col, opacity);
        }`
    });
  }
  BTQ.waterMaterial = waterMaterial;
  BTQ.updateWater = function (t) { waterUniforms.forEach(u => { u.time.value = t; }); };

  function addWater(name, points, opacity, y, seg) {
    const mesh = flatShape(points, waterMaterial(opacity), y === undefined ? 0.06 : y, seg || 10);
    mesh.name = name;
    mesh.receiveShadow = false;
    mesh.renderOrder = 2;
    BTQ.scene.add(mesh);
    return mesh;
  }

  // 泉池深坑：石砌内壁 + 深色池底（趵突泉主泉池深约2.2m）
  function poolPit(w, d, depth) {
    const grp = new THREE.Group();
    const t = 0.6;
    // 池底略大于坑口，盖住城市底板开洞边缘
    const bottom = new THREE.Mesh(new THREE.PlaneGeometry(w + 4, d + 4),
      new THREE.MeshStandardMaterial({ color: 0x153d44, roughness: 1 }));
    bottom.rotation.x = -Math.PI / 2; bottom.position.y = -depth;
    grp.add(bottom);
    // 水下池壁用偏暗石材，避免透水面显白
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x93908a, roughness: 0.95 });
    grp.add(BTQ.box(w, depth, t, wallMat, 0, -depth / 2, d / 2));
    grp.add(BTQ.box(w, depth, t, wallMat, 0, -depth / 2, -d / 2));
    grp.add(BTQ.box(t, depth, d, wallMat, w / 2, -depth / 2, 0));
    grp.add(BTQ.box(t, depth, d, wallMat, -w / 2, -depth / 2, 0));
    return grp;
  }
  BTQ.poolPit = poolPit;

  function buildWaters() {
    // 护城河（东界外、北界外）
    addWater('护城河·东', [[150, 30], [168, 30], [168, 470], [156, 470], [150, 420], [146, 260], [146, 120]], 0.9, 0.0);
    addWater('护城河·北', [[-120, 474], [160, 474], [160, 490], [-120, 490]], 0.9, 0.0);
    // 枫溪（横贯中部偏南的东西向自然水面）
    addWater('枫溪', FENGXI, 0.92, 0.06, 14);
    // 枫溪东端晴雨溪（通向东门）
    addWater('晴雨溪', [[128, 130], [142, 128], [146, 210], [136, 212], [130, 170]], 0.9, 0.05, 8);
    // 白龙湾（西南角）
    addWater('白龙湾', [
      [-148, 18], [-118, 14], [-96, 24], [-92, 44], [-104, 58], [-132, 60], [-150, 44]
    ], 0.92, 0.06, 10);
    // 白龙湾-枫溪连接水道
    addWater('白龙湾水道', [[-100, 55], [-88, 62], [-78, 92], [-74, 110], [-82, 112], [-90, 88], [-98, 62]], 0.9, 0.05, 6);
    // 北部濯缨池
    addWater('濯缨池', [[-34, 312], [8, 310], [16, 326], [6, 344], [-26, 346], [-38, 330]], 0.9, 0.05, 10);
    // 马跑泉（纪念堂东）
    addWater('马跑泉', [[46, 248], [70, 246], [74, 266], [66, 280], [48, 278], [42, 262]], 0.9, 0.05, 8);
    // 漱玉泉（4.8×3.1，石栏矩形小池）
    addWater('漱玉泉', [[13, 232], [27.8, 232], [27.8, 245.1], [13, 245.1]], 0.9, 0.09);
    // 柳絮泉
    addWater('柳絮泉', [[-2, 240], [10, 240], [10, 249], [-2, 249]], 0.9, 0.09);
    // 金线泉/老金线泉
    addWater('金线泉', [[-14, 212], [2, 212], [2, 222], [-14, 222]], 0.9, 0.09);
    addWater('老金线泉', [[-18, 226], [-6, 226], [-6, 235], [-18, 235]], 0.9, 0.09);
    // 皇华泉、卧牛泉
    addWater('皇华泉', [[6, 200], [18, 200], [18, 210], [6, 210]], 0.9, 0.09);
    addWater('卧牛泉', [[-12, 198], [0, 198], [0, 207], [-12, 207]], 0.9, 0.09);
    // 无忧泉（核心区东南）
    addWater('无忧泉', [[-28, 130], [-6, 128], [-2, 146], [-16, 152], [-30, 144]], 0.9, 0.08, 8);
    // 白雪楼前湛露泉、酒泉、石湾泉池群
    addWater('湛露泉池群', [[22, 122], [58, 120], [64, 140], [50, 150], [26, 146], [18, 134]], 0.9, 0.08, 8);
    // 万竹园：望水泉（20×10）、白云泉
    addWater('望水泉', [[-118, 148], [-98, 148], [-98, 158], [-118, 158]], 0.9, 0.09);
    addWater('白云泉', [[-132, 104], [-118, 104], [-118, 114], [-132, 114]], 0.9, 0.09);
    // 杜康泉、登州泉（核心区西侧）
    addWater('杜康泉', [[-84, 176], [-74, 176], [-74, 186], [-84, 186]], 0.9, 0.09);
    addWater('登州泉', [[-86, 158], [-76, 158], [-76, 168], [-86, 168]], 0.9, 0.09);
    // 花墙子泉（西界）
    addWater('花墙子泉', [[-137, 210], [-128, 210], [-128, 220], [-137, 220]], 0.9, 0.09);
    // 满井泉（三大殿西）
    addWater('满井泉', [[-66, 214], [-56, 214], [-56, 224], [-66, 224]], 0.9, 0.09);
    // 核心池南泄水小溪
    addWater('南溪', [[-46, 152], [-34, 152], [-30, 142], [-42, 140]], 0.85, 0.07, 6);
  }

  // ================= 园路与广场 =================
  function buildPaths() {
    const g = new THREE.Group();
    const main = M.paving(1, 1);
    const addRibbon = (pts, w, mat) => {
      const m = flatShape(ribbon(pts, w), mat || main, 0.07, 10);
      g.add(m);
    };
    // 主环路
    addRibbon([
      [0, 8], [60, 14], [120, 60], [132, 140], [120, 230], [90, 320], [40, 400], [-10, 452],
      [-60, 400], [-92, 320], [-110, 230], [-118, 150], [-120, 80], [-70, 30], [0, 8]
    ], 4.2);
    // 南门—中轴线（南门广场→白雪楼广场→核心泉区）
    addRibbon([[0, 4], [0, 60], [2, 110], [-12, 138], [-30, 152], [-40, 160]], 5.5);
    // 核心区—纪念堂—北门中轴
    addRibbon([[-40, 232], [-20, 240], [10, 246], [10, 280], [-6, 330], [-16, 400], [-20, 452]], 3.6);
    // 核心区—万竹园
    addRibbon([[-58, 180], [-80, 175], [-100, 165], [-112, 150]], 3.0);
    // 核心区—东门
    addRibbon([[-24, 178], [20, 180], [60, 190], [100, 198], [138, 204]], 3.4);
    // 枫溪南岸—沧园
    addRibbon([[-60, 90], [-10, 84], [40, 80], [90, 84], [120, 96]], 3.0);
    // 北部山路环线
    addRibbon([[-60, 330], [-20, 300], [40, 306], [80, 330], [60, 360], [0, 366], [-50, 350]], 2.6);
    // 万竹园—白龙湾
    addRibbon([[-120, 90], [-126, 60], [-130, 30]], 2.6);

    // 南门内广场
    g.add(flatShape([[-30, 2], [30, 2], [34, 60], [-34, 60]], M.square(3, 3), 0.075));
    // 核心泉区广场（池南、来鹤桥东）
    g.add(flatShape([[-62, 146], [-8, 146], [-6, 168], [-62, 168]], M.square(3, 2), 0.075));
    g.add(flatShape([[-24, 160], [6, 158], [10, 196], [-20, 198]], M.square(2, 2), 0.075));
    // 白雪楼戏台广场
    g.add(flatShape([[-30, 152], [40, 152], [40, 178], [-30, 178]], M.square(3, 2), 0.075));
    // 东门内广场
    g.add(flatShape([[118, 188], [146, 188], [146, 222], [118, 222]], M.square(2, 2), 0.075));
    BTQ.scene.add(g);
  }

  // ================= 趵突泉核心泉池 =================
  const springAnims = [];
  BTQ.springAnims = springAnims;

  // 石栏（沿 x 或 z 方向一段）
  function makeRailing(length, axis) {
    // axis: 'x' 沿东西向；'z' 沿南北向
    const grp = new THREE.Group();
    const mat = BTQ.materials.whiteStone;
    const bay = 1.9;
    const n = Math.max(1, Math.round(length / bay));
    const step = length / n;
    for (let i = 0; i <= n; i++) {
      const p = -length / 2 + i * step;
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.22), mat);
      post.position.set(axis === 'x' ? p : 0, 0.55, axis === 'z' ? p : 0);
      post.castShadow = true;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat);
      head.position.set(axis === 'x' ? p : 0, 1.02, axis === 'z' ? p : 0);
      grp.add(post, head);
      if (i < n) {
        const panel = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? step - 0.26 : 0.12, 0.5, axis === 'z' ? step - 0.26 : 0.12), mat);
        panel.position.set(axis === 'x' ? p + step / 2 : 0, 0.5, axis === 'z' ? p + step / 2 : 0);
        panel.castShadow = true;
        grp.add(panel);
      }
    }
    return grp;
  }
  BTQ.makeRailing = makeRailing;

  function buildSpringPool() {
    const g = new THREE.Group();
    const cx = -40, cz = 180;       // 泉池中心
    const W = 30, D = 18;          // 东西30m，南北18m
    BTQ.springCenter = [cx, cz];

    // 池底（深2.2m）
    const bottom = new THREE.Mesh(new THREE.BoxGeometry(W, 0.4, D), new THREE.MeshStandardMaterial({ color: 0x274b50, roughness: 1 }));
    bottom.position.set(cx, -2.3, cz);
    bottom.receiveShadow = true;
    g.add(bottom);
    // 池内壁（青石板）
    const wallMat = M.stone(6, 1.2);
    const h = 2.7;
    [[W, h, 0.4, cx, -1.1, cz - D / 2], [W, h, 0.4, cx, -1.1, cz + D / 2],
    [0.4, h, D, cx - W / 2, -1.1, cz], [0.4, h, D, cx + W / 2, -1.1, cz]].forEach(s => {
      const m = box(s[0], s[1], s[2], wallMat, s[3], s[4], s[5]);
      m.castShadow = false;
      g.add(m);
    });
    // 池岸压条石（环边宽1.2m）
    const copingMat = M.stone(2, 1);
    const cw = 1.3;
    [[W + cw * 2, 0.25, cw, cx, 0.05, cz - D / 2 - cw / 2],
    [W + cw * 2, 0.25, cw, cx, 0.05, cz + D / 2 + cw / 2],
    [cw, 0.25, D, cx - W / 2 - cw / 2, 0.05, cz],
    [cw, 0.25, D, cx + W / 2 + cw / 2, 0.05, cz]].forEach(s => {
      const m = box(s[0], s[1], s[2], copingMat, s[3], s[4], s[5]);
      m.castShadow = false;
      g.add(m);
    });

    // 石砌深坑（深2.2m）
    const pit = poolPit(28, 16, 2.2);
    pit.position.set(cx, 0, cz);
    g.add(pit);
    // 池水（略低于岸）
    const waterGeo = new THREE.PlaneGeometry(W - 1.2, D - 1.2, 40, 24);
    const wmat = waterMaterial(0.9, 0x17575f, 0x3f9099);
    const pool = new THREE.Mesh(waterGeo, wmat);
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(cx, -0.18, cz);
    pool.renderOrder = 3;
    g.add(pool);

    // 石栏（北/东/南三面，西岸接观澜亭平台，留口）
    const rN = makeRailing(W + 1.6, 'x'); rN.position.set(cx, 0.12, cz + D / 2 + 1.0); g.add(rN);
    const rS = makeRailing(W + 1.6, 'x'); rS.position.set(cx, 0.12, cz - D / 2 - 1.0); g.add(rS);
    const rE = makeRailing(D + 0.4, 'z'); rE.position.set(cx + W / 2 + 1.0, 0.12, cz); g.add(rE);
    const rW1 = makeRailing(5.5, 'z'); rW1.position.set(cx - W / 2 - 8.2, 0.12, cz - 6.2); g.add(rW1);
    const rW2 = makeRailing(4.0, 'z'); rW2.position.set(cx - W / 2 - 8.2, 0.12, cz + 7.0); g.add(rW2);

    // ---- 三股水（泉眼偏西，近观澜亭）----
    const eyes = [[cx - 8, cz - 1.5], [cx - 1.5, cz + 0.5], [cx + 5, cz - 1.5]];
    eyes.forEach((e, idx) => createSpringJet(g, e[0], e[1], idx));

    BTQ.registerClickable(g, '趵突泉（三股水）',
      '济南七十二名泉之冠，被誉为“天下第一泉”。泉池东西长30米、南北宽18米、深2.2米，水自地下石灰岩溶洞涌出，三窟并发、水涌若轮，日均涌量约7万立方米，水温常年恒定18℃。');
    g.name = '趵突泉泉池';
    BTQ.scene.add(g);
  }

  // 单股涌泉：泡沫扩散环 + 涌水核心 + 粒子
  function createSpringJet(parent, x, z, idx) {
    // 泉眼暗斑
    const eye = new THREE.Mesh(new THREE.CircleGeometry(1.4, 20), new THREE.MeshBasicMaterial({ color: 0x123e44, transparent: true, opacity: 0.55 }));
    eye.rotation.x = -Math.PI / 2;
    eye.position.set(x, -0.16, z);
    parent.add(eye);

    // 涌水核心（半透明白柱，呼吸缩放）
    const core = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.75, 0.55, 12, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xd8f4f2, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }));
    core.position.set(x, 0.18, z);
    parent.add(core);

    // 扩散涟漪环（窄环、低透明度）
    const rings = [];
    for (let i = 0; i < 2; i++) {
      const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.8, 32),
        new THREE.MeshBasicMaterial({ color: 0xeafafa, transparent: true, opacity: 0.3, side: THREE.DoubleSide, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2;
      ring.position.set(x, -0.13, z);
      parent.add(ring);
      rings.push(ring);
    }

    // 水花粒子
    const N = 24;
    const pg = new THREE.BufferGeometry();
    const arr = new Float32Array(N * 3);
    const seed = [];
    for (let i = 0; i < N; i++) {
      seed.push({
        a: Math.random() * Math.PI * 2, r: Math.random() * 0.4,
        v: 0.7 + Math.random() * 0.9, ph: Math.random(), sp: 0.55 + Math.random() * 0.5
      });
      arr[i * 3] = x; arr[i * 3 + 1] = 0; arr[i * 3 + 2] = z;
    }
    pg.setAttribute('position', new THREE.BufferAttribute(arr, 3));
    const pm = new THREE.PointsMaterial({ color: 0xffffff, size: 0.2, transparent: true, opacity: 0.55, depthWrite: false });
    const pts = new THREE.Points(pg, pm);
    parent.add(pts);

    springAnims.push((t) => {
      const tt = t + idx * 0.7;
      core.scale.y = 0.8 + 0.3 * Math.sin(tt * 2.2);
      core.scale.x = core.scale.z = 0.9 + 0.15 * Math.sin(tt * 2.2 + 1);
      core.material.opacity = 0.22 + 0.16 * Math.sin(tt * 2.6);
      rings.forEach((ring, i) => {
        const p = ((tt * 0.3 + i / 2) % 1);
        const s = 1 + p * 2.6;
        ring.scale.set(s, s, s);
        ring.material.opacity = 0.3 * (1 - p);
      });
      const pos = pg.attributes.position;
      for (let i = 0; i < N; i++) {
        const sd = seed[i];
        const p = (tt * sd.sp + sd.ph) % 1;
        const rad = sd.r + p * 0.9;
        pos.setXYZ(i, x + Math.cos(sd.a) * rad, -0.1 + Math.sin(p * Math.PI) * sd.v, z + Math.sin(sd.a) * rad);
      }
      pos.needsUpdate = true;
    });
  }

  BTQ.buildTerrain = buildTerrain;
  BTQ.buildCity = buildCity;
  BTQ.buildWaters = buildWaters;
  BTQ.buildPaths = buildPaths;
  BTQ.buildSpringPool = buildSpringPool;
})();
