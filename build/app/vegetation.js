/* ============================================================
 * 植被系统：垂柳 / 松 / 阔叶树 / 秋色树 / 竹丛 / 灌木
 * 全部使用 InstancedMesh，按水域、建筑占地避让散布
 * ============================================================ */
(function () {
  const BTQ = window.BTQ;
  const M = BTQ.materials;

  // 固定随机种子
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(20260921);
  const R = (a, b) => a + rand() * (b - a);

  // 水域多边形（与 terrain.js 一致，用于避让与岸线植柳）
  const WATERS = [
    [[150, 30], [168, 30], [168, 470], [156, 470], [150, 420], [146, 260], [146, 120]],
    [[-120, 474], [160, 474], [160, 490], [-120, 490]],
    [[-72, 116], [-55, 110], [-35, 114], [-15, 108], [10, 111], [35, 107], [60, 112], [85, 109], [110, 116], [132, 120], [138, 128], [128, 135], [105, 133], [80, 138], [55, 133], [30, 139], [5, 133], [-20, 139], [-45, 133], [-62, 130]],
    [[128, 130], [142, 128], [146, 210], [136, 212], [130, 170]],
    [[-148, 18], [-118, 14], [-96, 24], [-92, 44], [-104, 58], [-132, 60], [-150, 44]],
    [[-100, 55], [-88, 62], [-78, 92], [-74, 110], [-82, 112], [-90, 88], [-98, 62]],
    [[-34, 312], [8, 310], [16, 326], [6, 344], [-26, 346], [-38, 330]],
    [[46, 248], [70, 246], [74, 266], [66, 280], [48, 278], [42, 262]],
    [[13, 232], [27.8, 232], [27.8, 245.1], [13, 245.1]],
    [[-2, 240], [10, 240], [10, 249], [-2, 249]],
    [[-14, 212], [2, 212], [2, 222], [-14, 222]],
    [[-18, 226], [-6, 226], [-6, 235], [-18, 235]],
    [[6, 200], [18, 200], [18, 210], [6, 210]],
    [[-12, 198], [0, 198], [0, 207], [-12, 207]],
    [[-28, 130], [-6, 128], [-2, 146], [-16, 152], [-30, 144]],
    [[22, 122], [58, 120], [64, 140], [50, 150], [26, 146], [18, 134]],
    [[-118, 148], [-98, 148], [-98, 158], [-118, 158]],
    [[-132, 104], [-118, 104], [-118, 114], [-132, 114]],
    [[-84, 176], [-74, 176], [-74, 186], [-84, 186]],
    [[-86, 158], [-76, 158], [-76, 168], [-86, 168]],
    [[-137, 210], [-128, 210], [-128, 220], [-137, 220]],
    [[-66, 214], [-56, 214], [-56, 224], [-66, 224]],
    [[-46, 152], [-34, 152], [-30, 142], [-42, 140]],
    [[-24, 156], [4, 154], [10, 192], [-12, 198], [-24, 188]],
    [[-55, 171], [-25, 171], [-25, 189], [-55, 189]]
  ];

  // 建筑占地矩形 {x,z,w,d,rot}
  const FOOTS = [
    { x: -40, z: 180, w: 34, d: 22 }, { x: -40, z: 218, w: 24, d: 56 },
    { x: -61, z: 178, w: 12, d: 12 }, { x: -4.5, z: 175, w: 12, d: 18, rot: Math.PI / 2 },
    { x: -14, z: 196, w: 10, d: 16, rot: Math.PI / 2 },
    { x: 14, z: 150, w: 22, d: 14, rot: Math.PI }, { x: 44, z: 122, w: 14, d: 12 },
    { x: 48, z: 70, w: 58, d: 48 },
    { x: -104, z: 168, w: 48, d: 40 }, { x: -104, z: 128, w: 48, d: 40 }, { x: -104, z: 90, w: 44, d: 36 },
    { x: -128, z: 150, w: 28, d: 36 }, { x: -128, z: 112, w: 28, d: 34 },
    { x: 22, z: 264, w: 44, d: 42 }, { x: -18, z: 262, w: 32, d: 40 }, { x: 22, z: 306, w: 34, d: 30 },
    { x: 8, z: 216, w: 18, d: 14 }, { x: 0, z: 1, w: 54, d: 22 },
    { x: -20, z: 466, w: 18, d: 10, rot: Math.PI }, { x: 140, z: 205, w: 10, d: 18, rot: -Math.PI / 2 },
    { x: -20, z: 446, w: 22, d: 14 }, { x: 0, z: 30, w: 40, d: 64 },
    { x: -40, z: 157, w: 40, d: 8 }, { x: -68.5, z: 196, w: 6, d: 26 },
    { x: -52, z: 218, w: 5, d: 44 }, { x: -28, z: 218, w: 5, d: 44 },
    { x: -80, z: 130, w: 12, d: 10, rot: -Math.PI / 2 }, { x: 44, z: 136, w: 8, d: 8 },
    { x: -34, z: 140, w: 8, d: 8 }, { x: -108, z: 160, w: 8, d: 8 }, { x: -72, z: 118, w: 8, d: 8 },
    { x: -126, z: 36, w: 8, d: 8 }, { x: 50, z: 360, w: 10, d: 10 }, { x: -16, z: 330, w: 8, d: 8 },
    { x: -69, z: 178, w: 6, d: 4 }, { x: -8, z: 157.5, w: 12, d: 5 },
    { x: 33, z: 236, w: 5, d: 5 }, { x: -57.5, z: 170.5, w: 4, d: 4 }, { x: -25.5, z: 168, w: 4, d: 4 },
    { x: -56.5, z: 161.5, w: 4, d: 4 }
  ];

  // 主路中线（缓冲避让）
  const PATHS = [
    [[0, 8], [60, 14], [120, 60], [132, 140], [120, 230], [90, 320], [40, 400], [-10, 452], [-60, 400], [-92, 320], [-110, 230], [-118, 150], [-120, 80], [-70, 30], [0, 8]],
    [[0, 4], [0, 60], [2, 110], [-12, 138], [-30, 152], [-40, 160]],
    [[-40, 232], [-20, 240], [10, 246], [10, 280], [-6, 330], [-16, 400], [-20, 452]],
    [[-24, 178], [20, 180], [60, 190], [100, 198], [138, 204]],
    [[-60, 90], [-10, 84], [40, 80], [90, 84], [120, 96]]
  ];

  function inWater(x, z) {
    for (const p of WATERS) if (BTQ.pointInPolygon(p, x, z)) return true;
    return false;
  }
  function inFoot(x, z) {
    for (const f of FOOTS) {
      let dx = x - f.x, dz = z - f.z;
      if (f.rot) {
        const c = Math.cos(-f.rot), s = Math.sin(-f.rot);
        const rx = dx * c - dz * s, rz = dx * s + dz * c;
        dx = rx; dz = rz;
      }
      if (Math.abs(dx) < f.w / 2 + 1.2 && Math.abs(dz) < f.d / 2 + 1.2) return true;
    }
    return false;
  }
  function distPath(x, z) {
    let best = 999;
    for (const path of PATHS) {
      for (let i = 0; i < path.length - 1; i++) {
        const a = path[i], b = path[i + 1];
        const dx = b[0] - a[0], dz = b[1] - a[1];
        const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
        const px = a[0] + t * dx, pz = a[1] + t * dz;
        best = Math.min(best, Math.hypot(x - px, z - pz));
      }
    }
    return best;
  }
  function valid(x, z) {
    if (!BTQ.pointInPolygon(BTQ.BOUNDARY, x, z)) return false;
    if (inWater(x, z) || inFoot(x, z)) return false;
    if (distPath(x, z) < 2.0) return false;
    return true;
  }

  BTQ.buildVegetation = function () {
    const CAP_TRUNK = 600, CAP_SPHERE = 1500, CAP_CONE = 950, CAP_BAMBOO = 700, CAP_SHRUB = 260;
    const trunkGeo = new THREE.CylinderGeometry(0.16, 0.26, 1, 7);
    const sphereGeo = new THREE.SphereGeometry(1, 9, 7);
    const coneGeo = new THREE.ConeGeometry(1, 1, 8);
    const bambooGeo = new THREE.CylinderGeometry(0.05, 0.07, 1, 5);
    const shrubGeo = new THREE.IcosahedronGeometry(1, 0);

    const trunks = new THREE.InstancedMesh(trunkGeo, M.trunk, CAP_TRUNK);
    const spheres = new THREE.InstancedMesh(sphereGeo, new THREE.MeshStandardMaterial({ roughness: 1, vertexColors: false }), CAP_SPHERE);
    const cones = new THREE.InstancedMesh(coneGeo, new THREE.MeshStandardMaterial({ roughness: 1 }), CAP_CONE);
    const bamboos = new THREE.InstancedMesh(bambooGeo, M.bamboo, CAP_BAMBOO);
    const shrubs = new THREE.InstancedMesh(shrubGeo, new THREE.MeshStandardMaterial({ roughness: 1 }), CAP_SHRUB);
    [trunks, spheres, cones, bamboos, shrubs].forEach(m => { m.castShadow = false; m.receiveShadow = true; });

    let nT = 0, nS = 0, nC = 0, nB = 0, nSh = 0;
    const q = new THREE.Quaternion();
    const col = new THREE.Color();

    function mat4(x, y, z, sx, sy, sz, ry) {
      const qq = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry === undefined ? 0 : ry, 0));
      return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), qq, new THREE.Vector3(sx, sy, sz));
    }
    function groundY(x, z) { return Math.max(0, BTQ.terrainHeight(x, z)); }

    function addBroad(x, z, s, autumn) {
      const y = groundY(x, z);
      trunks.setMatrixAt(nT++, mat4(x, y + 1.1 * s, z, s, 2.2 * s, s));
      const crowns = [
        [0, 3.1, 0, 1.7, 1.4, 1.7],
        [1.05, 2.7, 0.55, 1.05, 0.95, 1.05],
        [-0.85, 2.75, -0.4, 0.95, 0.85, 0.95]
      ];
      crowns.forEach((c2, i) => {
        spheres.setMatrixAt(nS, mat4(x + c2[0] * s, y + c2[1] * s, z + c2[2] * s, c2[3] * s, c2[4] * s, c2[5] * s));
        col.setHSL(autumn ? R(0.07, 0.13) : R(0.24, 0.32), autumn ? R(0.55, 0.65) : R(0.35, 0.52), autumn ? R(0.4, 0.52) : R(0.27, 0.39));
        spheres.setColorAt(nS, col); nS++;
      });
    }
    function addWillow(x, z, s) {
      const y = groundY(x, z);
      trunks.setMatrixAt(nT++, mat4(x, y + 1.7 * s, z, 0.85 * s, 3.4 * s, 0.85 * s, R(0, 6.28)));
      spheres.setMatrixAt(nS, mat4(x, y + 4.6 * s, z, 1.9 * s, 1.35 * s, 1.9 * s));
      col.setHSL(R(0.23, 0.28), R(0.45, 0.6), R(0.38, 0.48)); spheres.setColorAt(nS, col); nS++;
      spheres.setMatrixAt(nS, mat4(x, y + 3.5 * s, z, 2.15 * s, 0.9 * s, 2.15 * s));
      col.setHSL(R(0.25, 0.3), R(0.4, 0.55), R(0.28, 0.37)); spheres.setColorAt(nS, col); nS++;
      // 下垂枝条锥（尖端朝下：绕 x 翻转）
      const droopQ = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI, R(0, 6.28), 0));
      cones.setMatrixAt(nC, new THREE.Matrix4().compose(
        new THREE.Vector3(x, y + 3.1 * s, z), droopQ, new THREE.Vector3(1.7 * s, 1.5 * s, 1.7 * s)));
      col.setHSL(0.27, 0.5, R(0.3, 0.4)); cones.setColorAt(nC, col); nC++;
    }
    function addPine(x, z, s) {
      const y = groundY(x, z);
      trunks.setMatrixAt(nT++, mat4(x, y + 1.0 * s, z, 0.7 * s, 2.0 * s, 0.7 * s));
      [ [1.6, 1.9, 2.3], [1.2, 1.7, 3.3], [0.8, 1.5, 4.2] ].forEach(l => {
        cones.setMatrixAt(nC, mat4(x, y + l[2] * s, z, l[0] * s, l[1] * s, l[0] * s));
        col.setHSL(R(0.28, 0.36), R(0.35, 0.5), R(0.2, 0.3)); cones.setColorAt(nC, col); nC++;
      });
    }
    function addBambooClump(x, z) {
      const y = groundY(x, z);
      const n = 5 + Math.floor(R(0, 4));
      for (let i = 0; i < n; i++) {
        const h = R(4, 7), ox = R(-0.8, 0.8), oz = R(-0.8, 0.8);
        bamboos.setMatrixAt(nB++, mat4(x + ox, y + h / 2, z + oz, 1, h, 1, R(0, 6.28)));
        cones.setMatrixAt(nC, mat4(x + ox, y + h + 0.3, z + oz, R(0.5, 0.8), 1.3, R(0.5, 0.8)));
        col.setHSL(0.27, 0.55, R(0.32, 0.42)); cones.setColorAt(nC, col); nC++;
      }
    }
    function addShrub(x, z, s) {
      const y = groundY(x, z);
      shrubs.setMatrixAt(nSh, mat4(x, y + 0.4 * s, z, s, 0.55 * s, s));
      col.setHSL(R(0.24, 0.33), R(0.35, 0.5), R(0.22, 0.32)); shrubs.setColorAt(nSh, col); nSh++;
    }

    // ---- 随机散布 ----
    let guard = 0;
    function scatter(fn, target, region) {
      let placed = 0;
      while (placed < target && guard++ < target * 60) {
        const x = R(-150, 146), z = R(0, 470);
        if (!valid(x, z)) continue;
        if (region && !region(x, z)) continue;
        fn(x, z, R(0.8, 1.25));
        placed++;
      }
    }
    // 北部山林：松+阔叶
    scatter((x, z, s) => { addPine(x, z, s * R(0.9, 1.3)); }, 60, (x, z) => z > 290);
    scatter((x, z, s) => addBroad(x, z, s, false), 90, (x, z) => z > 250);
    // 中南部阔叶
    scatter((x, z, s) => addBroad(x, z, s, false), 120);
    // 秋色树（点缀 40）
    scatter((x, z, s) => addBroad(x, z, s, true), 40);
    // 水边垂柳：沿主要水面岸线布点
    function shoreWillows(poly, gap, offset) {
      for (let i = 0; i < poly.length; i++) {
        const a = poly[i], b = poly[(i + 1) % poly.length];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const n = Math.max(1, Math.round(len / gap));
        for (let j = 0; j < n; j++) {
          const t = (j + 0.5) / n;
          let x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t;
          // 向多边形中心偏移
          let cx = 0, cz = 0; poly.forEach(p => { cx += p[0]; cz += p[1]; });
          cx /= poly.length; cz /= poly.length;
          const dx = cx - x, dz = cz - z, dl = Math.hypot(dx, dz) || 1;
          x += (dx / dl) * offset + R(-1, 1); z += (dz / dl) * offset + R(-1, 1);
          if (valid(x, z)) addWillow(x, z, R(0.8, 1.15));
        }
      }
    }
    shoreWillows(WATERS[2], 9, 4.5);   // 枫溪
    shoreWillows(WATERS[4], 8, 4);     // 白龙湾
    shoreWillows(WATERS[6], 7, 3.5);   // 濯缨池
    shoreWillows(WATERS[7], 6, 3.5);   // 马跑泉
    shoreWillows(WATERS[15], 6, 3.5);  // 湛露泉池群
    // 泉池周边垂柳（手动）
    [[-52, 196], [-40, 197], [-28, 195], [-72, 184], [-72, 172], [-56, 156], [-30, 155], [-18, 190]].forEach(p => {
      if (valid(p[0], p[1])) addWillow(p[0], p[1], R(0.85, 1.1));
    });
    // 护城河内侧（公园东界）排柳
    for (let z = 50; z < 430; z += 12) {
      const x = 141 + R(-1, 1);
      if (valid(x, z)) addWillow(x, z, R(0.8, 1.05));
    }

    // ---- 万竹园竹丛 ----
    let bn = 0;
    while (bn < 46) {
      const x = R(-138, -80), z = R(58, 198);
      if (valid(x, z)) { addBambooClump(x, z); bn++; }
    }
    // 纪念堂院内竹（易安旧居多竹）
    for (let i = 0; i < 12; i++) {
      const x = R(-28, -4), z = R(248, 280);
      if (valid(x, z)) addBambooClump(x, z);
    }

    // ---- 灌木：建筑与路边散置 ----
    let shn = 0;
    while (shn < 200 && shn < CAP_SHRUB) {
      const x = R(-145, 140), z = R(10, 460);
      if (!valid(x, z)) continue;
      if (distPath(x, z) > 3.2 && !inFoot(x, z)) {
        // 偏好建筑边缘
      }
      addShrub(x, z, R(0.5, 1.0));
      shn++;
    }

    // 南门内对植松
    addPine(-14, 12, 1.2); addPine(14, 12, 1.2);
    addPine(-14, 52, 1.0); addPine(14, 52, 1.0);

    // 四合院院内点景（万竹园：修竹、石榴；纪念堂：竹、海棠；沧园）
    addBambooClump(-104, 168); addBroad(-96, 162, 0.8, true);
    addBambooClump(-104, 128); addBroad(-112, 134, 0.85, false);
    addBambooClump(-100, 92);
    addBambooClump(-128, 150); addBroad(-128, 112, 0.9, false);
    addBambooClump(14, 262); addBroad(30, 268, 0.8, true);
    addBambooClump(-18, 262);
    addBambooClump(22, 306); addPine(31, 300, 0.8);
    addBroad(44, 66, 1.0, false); addBroad(55, 76, 0.9, true);

    trunks.count = nT; spheres.count = nS; cones.count = nC; bamboos.count = nB; shrubs.count = nSh;
    [trunks, spheres, cones, bamboos, shrubs].forEach(m => {
      m.instanceMatrix.needsUpdate = true;
      if (m.instanceColor) m.instanceColor.needsUpdate = true;
    });
    const g = new THREE.Group();
    g.name = 'vegetation';
    g.add(trunks, spheres, cones, bamboos, shrubs);
    g.traverse(o => { o.userData.noExport = true; });
    BTQ.vegetationGroup = g;
    BTQ.scene.add(g);
  };
})();
