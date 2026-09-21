/* ============================================================
 * 中国古建筑程序化组件：屋顶 / 殿堂 / 亭 / 廊 / 牌楼 / 桥 /
 * 四合院 / 南门 / 门楼 / 石碑 / 假山
 * 建筑默认坐北朝南（正面朝向 -z），单位米
 * ============================================================ */
(function () {
  const BTQ = window.BTQ;
  const M = BTQ.materials;

  function V(x, y, z) { return new THREE.Vector3(x, y, z); }
  function cyl(a, b, r, mat, seg) {
    const len = a.distanceTo(b);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, seg || 8), mat);
    c.position.copy(a).add(b).multiplyScalar(0.5);
    c.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize());
    c.castShadow = true;
    return c;
  }
  BTQ.cylBetween = cyl;

  // ---------- 屋顶几何 ----------
  // type: xieshan歇山 / wudian庑殿 / gable硬山双坡 / cuanjian攒尖
  // w 面阔(x), d 进深(z), h 脊高；檐口位于 y=0
  function roofGeometry(type, w, d, h) {
    const verts = [];
    const uvs = [];
    const uk = 0.42; // uv 比例
    function push(p) {
      verts.push(p[0], p[1], p[2]);
      uvs.push(p[0] * uk + 0.5, p[2] * uk + 0.5);
    }
    function tri(a, b, c) { push(a); push(b); push(c); }
    function quad(a, b, c, dd) { tri(a, b, c); tri(a, c, dd); }
    const FL = [-w / 2, 0, -d / 2], FR = [w / 2, 0, -d / 2], BR = [w / 2, 0, d / 2], BL = [-w / 2, 0, d / 2];

    if (type === 'cuanjian') {
      const T = [0, h, 0];
      quad(FL, FR, T, [0, 0, 0]); tri(FL, FR, T); tri(FR, BR, T); tri(BR, BL, T); tri(BL, FL, T);
    } else if (type === 'wudian') {
      const rw = w * 0.52;
      const RL = [-rw / 2, h, 0], RR = [rw / 2, h, 0];
      quad(FL, FR, RR, RL);
      tri(FR, BR, RR); tri(BR, BL, RL); tri(BL, FL, RL);
      quad(BR, BL, RL, RR);
    } else if (type === 'gable') {
      const rw = w * 0.92;
      const RL = [-rw / 2, h, 0], RR = [rw / 2, h, 0];
      quad(FL, FR, RR, RL);
      quad(BR, BL, RL, RR);
      tri(BL, FL, RL); tri(FR, BR, RR);
    } else { // xieshan 歇山
      const rw = w * 0.56, zz = d * 0.26, y1 = h * 0.6;
      const RL = [-rw / 2, h, 0], RR = [rw / 2, h, 0];
      const MLF = [-rw / 2, y1, -zz], MRF = [rw / 2, y1, -zz];
      const MLB = [-rw / 2, y1, zz], MRB = [rw / 2, y1, zz];
      quad(FL, FR, MRF, MLF);       // 前下檐坡
      quad(BR, BL, MLB, MRB);       // 后下檐坡
      quad(MLF, MRF, RR, RL);       // 前上坡
      quad(MRB, MLB, RL, RR);       // 后上坡
      tri(FL, BL, MLB); tri(FL, MLB, MLF);  // 左山面下
      tri(MLB, MLF, RL);                     // 左山面上
      tri(FR, MRF, MRB); tri(FR, MRB, BR);  // 右山面下
      tri(MRF, RR, MRB);                     // 右山面上
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.computeVertexNormals();
    return geo;
  }

  // 屋顶组：屋面 + 脊 + 翘角
  function createRoof(type, w, d, h, mat, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(roofGeometry(type, w, d, h), mat);
    mesh.castShadow = true; mesh.receiveShadow = true;
    g.add(mesh);
    const ridgeMat = opts.ridgeMat || M.roofGray(1, 1);
    const trimMat = opts.trimMat || M.gold;
    const rr = Math.max(0.07, w * 0.012);

    if (type === 'cuanjian') {
      // 宝顶：宝珠+葫芦+尖
      let y = h;
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.22, 0.3, 10), ridgeMat);
      base.position.y = y + 0.15; g.add(base); y += 0.3;
      [0.42, 0.3, 0.2].forEach((r2, i) => {
        const s = new THREE.Mesh(new THREE.SphereGeometry(r2, 12, 10), i === 2 ? trimMat : ridgeMat);
        s.position.y = y + r2; g.add(s); y += r2 * 1.5;
      });
      const sp = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.5, 8), trimMat);
      sp.position.y = y + 0.2; g.add(sp);
      // 四戗脊
      [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].forEach(c => {
        g.add(cyl(V(c[0] * 0.92, 0.1, c[1] * 0.92), V(0, h - 0.15, 0), rr * 0.7, ridgeMat));
      });
    } else {
      const rw = type === 'gable' ? w * 0.92 : w * (type === 'wudian' ? 0.52 : 0.56);
      // 正脊
      g.add(cyl(V(-rw / 2, h + 0.05, 0), V(rw / 2, h + 0.05, 0), rr, ridgeMat, 10));
      // 正吻（脊端兽）
      [-1, 1].forEach(s => {
        const beast = new THREE.Mesh(new THREE.ConeGeometry(rr * 2.1, rr * 5, 8), ridgeMat);
        beast.position.set(s * rw / 2, h + rr * 2.2, 0);
        beast.castShadow = true; g.add(beast);
      });
      if (type === 'gable') {
        [[-w / 2, -d / 2, -rw / 2], [w / 2, -d / 2, rw / 2], [w / 2, d / 2, rw / 2], [-w / 2, d / 2, -rw / 2]].forEach(c => {
          g.add(cyl(V(c[0], 0.08, c[1]), V(c[2], h - 0.05, 0), rr * 0.6, ridgeMat));
        });
      } else if (type === 'wudian') {
        [[-w / 2, -d / 2, -rw / 2], [w / 2, -d / 2, rw / 2], [w / 2, d / 2, rw / 2], [-w / 2, d / 2, -rw / 2]].forEach(c => {
          g.add(cyl(V(c[0], 0.08, c[1]), V(c[2], h - 0.05, 0), rr * 0.6, ridgeMat));
        });
      } else {
        const zz = d * 0.26, y1 = h * 0.6;
        // 垂脊（上段）+戗脊（下段）
        [-1, 1].forEach(sx => [-1, 1].forEach(sz => {
          g.add(cyl(V(sx * rw / 2, h - 0.02, 0), V(sx * rw / 2, y1, sz * zz), rr * 0.6, ridgeMat));
          g.add(cyl(V(sx * rw / 2, y1, sz * zz), V(sx * w / 2, 0.08, sz * d / 2), rr * 0.6, ridgeMat));
        }));
        // 山面博风板
        [-1, 1].forEach(sx => {
          const board = new THREE.Mesh(new THREE.BoxGeometry(0.1, h * 0.5, zz * 2), M.darkWood);
          board.position.set(sx * (w / 2 - 0.05), y1 + h * 0.18, 0);
          g.add(board);
        });
      }
      // 檐角起翘
      [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(s => {
        const tip = new THREE.Mesh(new THREE.ConeGeometry(rr * 1.4, rr * 6, 6), ridgeMat);
        tip.position.set(s[0] * (w / 2 + 0.12), 0.18, s[1] * (d / 2 + 0.12));
        tip.rotation.z = -s[0] * 0.5; tip.rotation.x = s[1] * 0.5;
        g.add(tip);
      });
    }
    // 檐口瓦当厚边
    const edgeF = new THREE.Mesh(new THREE.BoxGeometry(w, 0.12, 0.18), ridgeMat);
    edgeF.position.set(0, 0.02, -d / 2); g.add(edgeF);
    const edgeB = edgeF.clone(); edgeB.position.z = d / 2; g.add(edgeB);
    const edgeL = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, d), ridgeMat);
    edgeL.position.set(-w / 2, 0.02, 0); g.add(edgeL);
    const edgeR = edgeL.clone(); edgeR.position.x = w / 2; g.add(edgeR);
    return g;
  }
  BTQ.createRoof = createRoof;

  // ---------- 殿堂 ----------
  function createHall(opts) {
    const g = new THREE.Group();
    const w = opts.w, d = opts.d;
    const stories = opts.stories || 1;
    const baseH = opts.baseH === undefined ? 0.7 : opts.baseH;
    const colH = opts.colH || (stories === 2 ? 3.4 : 3.6);
    const bays = opts.bays || 3;
    const roofMat = opts.roofMat || M.roofGray(2, 2);
    const ridgeMat = opts.ridgeMat || M.roofGray(1, 1);
    const wallMat = opts.wallMat || M.wall(2, 1);
    const pillarMat = opts.pillarMat || M.pillarRed;

    // 台基
    const base = BTQ.box(w + 1.8, baseH, d + 1.8, M.stone(w * 0.4, d * 0.4), 0, baseH / 2, 0);
    g.add(base);
    // 月台（前 -z）
    if (opts.platform) {
      const pf = BTQ.box(w + 1.8, baseH, 3.0, M.stone(w * 0.4, 1.5), 0, baseH / 2, -(d / 2 + 2.3));
      g.add(pf);
      const r1 = BTQ.makeRailing(w + 0.2, 'x'); r1.position.set(0, baseH - 0.05, -(d / 2 + 3.7)); g.add(r1);
      // 台阶
      for (let i = 0; i < 4; i++) {
        g.add(BTQ.box(4.5, 0.12, 0.5, M.stone(2, 1), 0, 0.06 + i * 0.14, -(d / 2 + 4.6 + i * 0.42)));
      }
    } else {
      for (let i = 0; i < 3; i++) {
        g.add(BTQ.box(bays > 3 ? 5 : 3, 0.12, 0.45, M.stone(2, 1), 0, 0.06 + i * 0.16, -(d / 2 + 1.0 - i * 0.36)));
      }
    }

    function floorWalls(fw, fd, fh, y0, upper) {
      const bayW = fw / bays;
      // 后墙、山墙
      g.add(BTQ.box(fw, fh * 0.82, 0.24, wallMat, 0, y0 + fh * 0.42, fd / 2 - 0.1));
      g.add(BTQ.box(0.24, fh * 0.82, fd, wallMat, -fw / 2 + 0.1, y0 + fh * 0.42, 0));
      g.add(BTQ.box(0.24, fh * 0.82, fd, wallMat, fw / 2 - 0.1, y0 + fh * 0.42, 0));
      // 柱
      for (let i = 0; i <= bays; i++) {
        const x = -fw / 2 + bayW * i;
        [-fd / 2 + 0.35, fd / 2 - 0.35].forEach(z => {
          const p = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, fh, 12), pillarMat);
          p.position.set(x, y0 + fh / 2, z); p.castShadow = true; g.add(p);
          const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.18, 12), M.whiteStone);
          foot.position.set(x, y0 + 0.09, z); g.add(foot);
        });
      }
      // 正面隔扇门/窗
      for (let i = 0; i < bays; i++) {
        const x = -fw / 2 + bayW * (i + 0.5);
        const door = BTQ.box(bayW - 0.25, fh * 0.72, 0.1, M.lattice(), x, y0 + fh * 0.38, -fd / 2 + 0.22);
        g.add(door);
      }
      // 檐枋彩画
      g.add(BTQ.box(fw + 0.6, 0.34, 0.3, M.paintGreen, 0, y0 + fh - 0.18, -fd / 2 + 0.2));
      g.add(BTQ.box(fw + 0.6, 0.34, 0.3, M.paintGreen, 0, y0 + fh - 0.18, fd / 2 - 0.2));
      g.add(BTQ.box(0.3, 0.34, fd, M.paintGreen, -fw / 2 + 0.2, y0 + fh - 0.18, 0));
      g.add(BTQ.box(0.3, 0.34, fd, M.paintGreen, fw / 2 - 0.2, y0 + fh - 0.18, 0));
      if (upper) {
        // 上层外廊栏杆
        const rh = 0.7;
        [['x', 0, -fd / 2 - 0.1, fw], ['x', 0, fd / 2 + 0.1, fw], ['z', -fw / 2 - 0.1, 0, fd], ['z', fw / 2 + 0.1, 0, fd]].forEach(r => {
          const rail = BTQ.makeRailing(r[3], r[0]);
          rail.position.set(r[1], y0 + 0.05, r[2]);
          g.add(rail);
        });
      }
    }

    let eaveY = baseH;
    floorWalls(w, d, colH, baseH, false);
    eaveY += colH;
    if (stories === 2) {
      const w2 = w - 2.2, d2 = d - 1.8, colH2 = 3.0;
      g.add(BTQ.box(w2 + 0.6, 0.3, d2 + 0.6, M.darkWood, 0, eaveY + 0.15, 0));
      floorWalls(w2, d2, colH2, eaveY + 0.3, true);
      eaveY += 0.3 + colH2;
    }
    // 屋顶
    const rType = opts.roof || 'xieshan';
    const roof = createRoof(rType, w + 1.6, d + 1.6, opts.roofH || (rType === 'cuanjian' ? 2.4 : 0.42 * d), roofMat, { ridgeMat: ridgeMat, trimMat: opts.trimMat || M.gold });
    roof.position.y = eaveY;
    g.add(roof);

    // 匾额
    if (opts.plaque) {
      const tex = BTQ.materials.plaque(opts.plaque, { w: 256, h: 96, bg: '#1c1a17', fg: '#e8c869', fontSize: 58 });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.42, 6), 1.1),
        new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      pl.position.set(0, eaveY - 0.85, -(d / 2 + 0.15));
      g.add(pl);
    }
    if (opts.name) {
      BTQ.registerClickable(g, opts.name, opts.desc || '');
      g.name = opts.name;
    }
    return g;
  }
  BTQ.createHall = createHall;

  // ---------- 四方亭（观澜亭式：水中石台、红柱、坐凳、攒尖顶、宝顶）----------
  function createPavilion(opts) {
    opts = opts || {};
    const s = opts.size || 7;
    const g = new THREE.Group();
    const baseH = opts.baseH === undefined ? 0.9 : opts.baseH;
    // 水中石台基
    const base = BTQ.box(s, baseH, s, M.stone(2, 2), 0, baseH / 2, 0);
    g.add(base);
    // 台基四面石栏（正面留口）
    const open = opts.openSide === undefined ? -1 : opts.openSide; // -1 南
    if (open !== -1) { const r = BTQ.makeRailing(s - 1.2, 'x'); r.position.set(0, baseH - 0.02, -s / 2 + 0.4); g.add(r); }
    if (open !== 1) { const r = BTQ.makeRailing(s - 1.2, 'x'); r.position.set(0, baseH - 0.02, s / 2 - 0.4); g.add(r); }
    if (open !== -2) { const r = BTQ.makeRailing(s - 1.2, 'z'); r.position.set(-s / 2 + 0.4, baseH - 0.02, 0); g.add(r); }
    if (open !== 2) { const r = BTQ.makeRailing(s - 1.2, 'z'); r.position.set(s / 2 - 0.4, baseH - 0.02, 0); g.add(r); }

    const colH = opts.colH || 3.0;
    const cs = s / 2 - 0.7;
    [[-cs, -cs], [cs, -cs], [cs, cs], [-cs, cs]].forEach(p => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, colH, 12), M.pillarRed);
      c.position.set(p[0], baseH + colH / 2, p[1]); c.castShadow = true; g.add(c);
      const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.16, 12), M.whiteStone);
      foot.position.set(p[0], baseH + 0.08, p[1]); g.add(foot);
    });
    // 坐凳栏杆（柱间矮栏）
    // [起点x,z, 终点x,z]
    const edges = [[-cs, -cs, cs, -cs], [cs, -cs, cs, cs], [cs, cs, -cs, cs], [-cs, cs, -cs, -cs]];
    edges.forEach(e => {
      const alongX = Math.abs(e[2] - e[0]) > Math.abs(e[3] - e[1]);
      const len = alongX ? Math.abs(e[2] - e[0]) : Math.abs(e[3] - e[1]);
      const bench = alongX
        ? BTQ.box(len, 0.45, 0.12, M.redWood, (e[0] + e[2]) / 2, baseH + 0.45, (e[1] + e[3]) / 2)
        : BTQ.box(0.12, 0.45, len, M.redWood, (e[0] + e[2]) / 2, baseH + 0.45, (e[1] + e[3]) / 2);
      g.add(bench);
    });
    // 檐枋
    g.add(BTQ.box(s - 0.6, 0.3, 0.26, M.paintGreen, 0, baseH + colH - 0.2, -cs));
    g.add(BTQ.box(s - 0.6, 0.3, 0.26, M.paintGreen, 0, baseH + colH - 0.2, cs));
    g.add(BTQ.box(0.26, 0.3, s - 0.6, M.paintGreen, -cs, baseH + colH - 0.2, 0));
    g.add(BTQ.box(0.26, 0.3, s - 0.6, M.paintGreen, cs, baseH + colH - 0.2, 0));
    // 攒尖顶
    const roofMat = opts.roofMat || M.roofYellow(2, 2);
    const roof = createRoof('cuanjian', s + 1.2, s + 1.2, opts.roofH || 2.4, roofMat, { ridgeMat: opts.ridgeMat || M.roofYellow(1, 1), trimMat: M.gold });
    roof.position.y = baseH + colH;
    g.add(roof);
    // 匾额
    if (opts.plaque) {
      const tex = BTQ.materials.plaque(opts.plaque, { w: 192, h: 80, fontSize: 48 });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
      pl.position.set(0, baseH + colH - 0.75, -cs - 0.05);
      g.add(pl);
    }
    if (opts.name) { BTQ.registerClickable(g, opts.name, opts.desc || ''); g.name = opts.name; }
    return g;
  }
  BTQ.createPavilion = createPavilion;

  // ---------- 长廊 ----------
  function createCorridor(length, axis, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const w = 2.8, colH = 2.7;
    const along = axis === 'x' ? length : w;
    const across = axis === 'x' ? w : length;
    // 台基
    const base = BTQ.box(axis === 'x' ? length : w, 0.35, axis === 'z' ? length : w, M.stone(length * 0.3, 1), 0, 0.18, 0);
    g.add(base);
    // 柱列
    const n = Math.max(2, Math.round(length / 2.4));
    for (let i = 0; i <= n; i++) {
      const p = -length / 2 + length * i / n;
      [-w / 2 + 0.3, w / 2 - 0.3].forEach(side => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.16, colH, 10), M.pillarRed);
        if (axis === 'x') c.position.set(p, 0.35 + colH / 2, side);
        else c.position.set(side, 0.35 + colH / 2, p);
        c.castShadow = true; g.add(c);
      });
    }
    // 坐凳
    for (let i = 0; i < n; i++) {
      const p = -length / 2 + length * (i + 0.5) / n;
      if (axis === 'x') {
        g.add(BTQ.box(length / n - 0.2, 0.18, 0.5, M.whiteStone, p, 0.55, -w / 2 + 0.3));
        g.add(BTQ.box(length / n - 0.2, 0.18, 0.5, M.whiteStone, p, 0.55, w / 2 - 0.3));
      } else {
        g.add(BTQ.box(0.5, 0.18, length / n - 0.2, M.whiteStone, -w / 2 + 0.3, 0.55, p));
        g.add(BTQ.box(0.5, 0.18, length / n - 0.2, M.whiteStone, w / 2 - 0.3, 0.55, p));
      }
    }
    // 梁枋
    if (axis === 'x') {
      g.add(BTQ.box(length, 0.24, 0.2, M.paintGreen, 0, 0.35 + colH, -w / 2 + 0.3));
      g.add(BTQ.box(length, 0.24, 0.2, M.paintGreen, 0, 0.35 + colH, w / 2 - 0.3));
    } else {
      g.add(BTQ.box(0.2, 0.24, length, M.paintGreen, -w / 2 + 0.3, 0.35 + colH, 0));
      g.add(BTQ.box(0.2, 0.24, length, M.paintGreen, w / 2 - 0.3, 0.35 + colH, 0));
    }
    // 卷棚双坡顶
    const roof = createRoof('gable', (axis === 'x' ? length : w) + 1.0, (axis === 'x' ? w : length) + 0.8, 1.0, opts.roofMat || M.roofGray(length * 0.2, 2), { ridgeMat: M.roofGray(1, 1) });
    if (axis === 'z') roof.rotation.y = Math.PI / 2;
    roof.position.y = 0.35 + colH;
    g.add(roof);
    if (opts.name) { BTQ.registerClickable(g, opts.name, opts.desc || ''); g.name = opts.name; }
    return g;
  }
  BTQ.createCorridor = createCorridor;

  // ---------- 牌楼 ----------
  // bays=3 四柱三间三楼；bays=1 二柱一间一楼
  function createPaifang(opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const w = opts.width || 12;
    const pillarMat = opts.pillarMat || M.whiteStone;
    const roofMat = opts.roofMat || M.roofGray(2, 2);
    const nP = opts.bays === 1 ? 2 : 4;
    const xs = [];
    for (let i = 0; i < nP; i++) xs.push(-w / 2 + (w * i) / (nP - 1));
    xs.forEach(x => {
      // 夹杆石
      g.add(BTQ.box(0.9, 1.4, 0.9, M.whiteStone, x, 0.7, 0));
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 6.2, 10), pillarMat);
      p.position.set(x, 3.6, 0); p.castShadow = true; g.add(p);
    });
    // 额枋
    g.add(BTQ.box(w + 1.2, 0.5, 0.5, M.redWood, 0, 4.6, 0));
    g.add(BTQ.box(w + 0.6, 0.4, 0.42, M.paintGreen, 0, 5.3, 0));
    if (nP === 4) {
      g.add(BTQ.box(w * 0.3, 0.35, 0.4, M.redWood, -w * 0.3, 5.9, 0));
      g.add(BTQ.box(w * 0.3, 0.35, 0.4, M.redWood, w * 0.3, 5.9, 0));
    }
    // 主楼/次楼屋顶
    const main = createRoof('gable', nP === 4 ? w * 0.36 : w * 0.5, 1.8, 0.9, roofMat, { ridgeMat: M.roofGray(1, 1) });
    main.position.set(0, 6.0, 0); g.add(main);
    if (nP === 4) {
      [-1, 1].forEach(s => {
        const r = createRoof('gable', w * 0.24, 1.5, 0.7, roofMat, { ridgeMat: M.roofGray(1, 1) });
        r.position.set(s * w * 0.35, 5.9, 0); g.add(r);
      });
    }
    // 匾额
    if (opts.plaque) {
      const tex = BTQ.materials.plaque(opts.plaque, { w: 200, h: 80, bg: '#5e2418', fg: '#f0d488', fontSize: 44 });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(nP === 4 ? w * 0.3 : w * 0.42, 0.9), new THREE.MeshBasicMaterial({ map: tex }));
      pl.position.set(0, 4.65, -0.28); g.add(pl);
    }
    if (opts.name) { BTQ.registerClickable(g, opts.name, opts.desc || ''); g.name = opts.name; }
    return g;
  }
  BTQ.createPaifang = createPaifang;

  // ---------- 桥 ----------
  // 平/折桥：pts 点串，石板+矮栏
  function createFlatBridge(pts, width, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const dx = b[0] - a[0], dz = b[1] - a[1];
      const len = Math.hypot(dx, dz);
      const seg = BTQ.box(len, 0.35, width, M.stone(len * 0.3, 1), (a[0] + b[0]) / 2, 0.05, (a[1] + b[1]) / 2);
      seg.rotation.y = Math.atan2(dx, dz);
      g.add(seg);
      // 矮栏板
      [-1, 1].forEach(side => {
        const nx = -dz / len * side * (width / 2), nz = dx / len * side * (width / 2);
        const rail = BTQ.box(len, 0.4, 0.12, M.whiteStone, (a[0] + b[0]) / 2 + nx, 0.42, (a[1] + b[1]) / 2 + nz);
        rail.rotation.y = Math.atan2(dx, dz);
        g.add(rail);
      });
      // 桥墩
      if (i > 0 || opts.pierStart) {
        g.add(BTQ.box(0.7, 0.9, width + 0.4, M.stone(1, 1), a[0], -0.35, a[1]));
      }
    }
    if (opts.name) { BTQ.registerClickable(g, opts.name, opts.desc || ''); g.name = opts.name; }
    return g;
  }
  BTQ.createFlatBridge = createFlatBridge;

  // 石拱桥
  function createArchBridge(span, width, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    // 桥面（弧面用扁盒微拱，简化：中部略高的三段）
    const n = 3;
    for (let i = 0; i < n; i++) {
      const segLen = span / n;
      const x = -span / 2 + segLen * (i + 0.5);
      const t = Math.abs(x) / (span / 2);
      const y = 0.25 + (1 - t) * 1.4;
      const seg = BTQ.box(segLen + 0.3, 0.5, width, M.stone(2, 1), x, y, 0);
      seg.rotation.z = (i < n / 2 ? 1 : -1) * 0.16;
      g.add(seg);
      [-1, 1].forEach(s => {
        const rail = BTQ.box(segLen + 0.2, 0.35, 0.12, M.whiteStone, x, y + 0.65, s * (width / 2 - 0.1));
        rail.rotation.z = seg.rotation.z; g.add(rail);
      });
    }
    // 拱券（半圆环）
    const arch = new THREE.Mesh(new THREE.TorusGeometry(span * 0.26, 0.18, 8, 24, Math.PI), M.stone(2, 1));
    arch.position.y = 0.05; arch.rotation.y = Math.PI / 2;
    g.add(arch);
    // 桥堍
    g.add(BTQ.box(1.4, 1.0, width + 0.6, M.stone(1, 1), -span / 2 - 0.4, -0.2, 0));
    g.add(BTQ.box(1.4, 1.0, width + 0.6, M.stone(1, 1), span / 2 + 0.4, -0.2, 0));
    if (opts.name) { BTQ.registerClickable(g, opts.name, opts.desc || ''); g.name = opts.name; }
    return g;
  }
  BTQ.createArchBridge = createArchBridge;

  // ---------- 围墙（带瓦帽）----------
  function wallRun(length, axis, height) {
    const g = new THREE.Group();
    const h = height || 2.4;
    const body = axis === 'x' ? BTQ.box(length, h, 0.3, M.wall(length * 0.2, 1), 0, h / 2, 0)
      : BTQ.box(0.3, h, length, M.wall(1, length * 0.2), 0, h / 2, 0);
    g.add(body);
    const cap = axis === 'x' ? BTQ.box(length + 0.3, 0.25, 0.7, M.roofGray(length * 0.2, 1), 0, h + 0.1, 0)
      : BTQ.box(0.7, 0.25, length + 0.3, M.roofGray(1, length * 0.2), 0, h + 0.1, 0);
    g.add(cap);
    return g;
  }
  BTQ.wallRun = wallRun;

  // ---------- 四合院 ----------
  // w 东西宽, d 南北深；正房北、厢房东西、门楼南
  function createCourtyard(opts) {
    const g = new THREE.Group();
    const w = opts.w, d = opts.d;
    const roofMat = opts.roofMat || M.roofGray(3, 2);
    // 院内铺地
    const ground = BTQ.flatShape([[-w / 2 + 1, -d / 2 + 1], [w / 2 - 1, -d / 2 + 1], [w / 2 - 1, d / 2 - 1], [-w / 2 + 1, d / 2 - 1]],
      M.paving(w * 0.3, d * 0.3), 0.06);
    g.add(ground);
    // 围墙
    const wallS = wallRun(w, 'x'); wallS.position.set(0, 0, -d / 2); g.add(wallS);
    const wallN = wallRun(w, 'x'); wallN.position.set(0, 0, d / 2); g.add(wallN);
    const wallE = wallRun(d, 'z'); wallE.position.set(w / 2, 0, 0); g.add(wallE);
    const wallW = wallRun(d, 'z'); wallW.position.set(-w / 2, 0, 0); g.add(wallW);
    // 正房（北，朝南）
    const main = createHall({ w: w * 0.62, d: 6.5, bays: opts.mainBays || 5, roof: 'gable', roofMat, baseH: 0.5, colH: 3.4, plaque: opts.mainPlaque });
    main.position.set(0, 0, d / 2 - 4.2); g.add(main);
    // 厢房
    const ew = d * 0.42;
    const e = createHall({ w: ew, d: 5.5, bays: 3, roof: 'gable', roofMat, baseH: 0.4, colH: 3.0 });
    e.rotation.y = -Math.PI / 2; e.position.set(w / 2 - 3.6, 0, 0); g.add(e);
    const west = createHall({ w: ew, d: 5.5, bays: 3, roof: 'gable', roofMat, baseH: 0.4, colH: 3.0 });
    west.rotation.y = Math.PI / 2; west.position.set(-w / 2 + 3.6, 0, 0); g.add(west);
    // 门楼（南墙正中）
    const gate = createSmallGate({ width: 7, roofMat, plaque: opts.gatePlaque });
    gate.position.set(0, 0, -d / 2);
    g.add(gate);
    if (opts.name) { BTQ.registerClickable(g, opts.name, opts.desc || ''); g.name = opts.name; }
    return g;
  }
  BTQ.createCourtyard = createCourtyard;

  // ---------- 小门楼（北门/东门/院落门）----------
  function createSmallGate(opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const w = opts.width || 10;
    g.add(BTQ.box(w + 1.4, 0.5, 3.4, M.stone(2, 1), 0, 0.25, 0));
    // 中央门洞（开敞），四根柱
    [-w / 2 + 1.2, -w * 0.18, w * 0.18, w / 2 - 1.2].forEach(x => {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 3.6, 10), M.pillarRed);
      c.position.set(x, 2.1, 0); c.castShadow = true; g.add(c);
    });
    // 两侧门房白墙
    g.add(BTQ.box(w / 2 - 2, 2.8, 2.6, M.wall(2, 1), -w / 4 - 0.6, 1.9, 0));
    g.add(BTQ.box(w / 2 - 2, 2.8, 2.6, M.wall(2, 1), w / 4 + 0.6, 1.9, 0));
    g.add(BTQ.box(w + 1.0, 0.4, 0.4, M.paintGreen, 0, 3.9, -1.2));
    const roof = createRoof('xieshan', w + 2.2, 4.6, 1.8, opts.roofMat || M.roofGray(2, 2), { ridgeMat: M.roofGray(1, 1) });
    roof.position.y = 4.0; g.add(roof);
    if (opts.plaque) {
      const tex = BTQ.materials.plaque(opts.plaque, { w: 180, h: 80, fontSize: 46 });
      const pl = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.9), new THREE.MeshBasicMaterial({ map: tex }));
      pl.position.set(0, 3.3, -1.85); g.add(pl);
    }
    if (opts.name) { BTQ.registerClickable(g, opts.name, opts.desc || ''); g.name = opts.name; }
    return g;
  }
  BTQ.createSmallGate = createSmallGate;

  // ---------- 南门（勾连搭绿琉璃瓦，宽47.5m 深13m 高8.4m）----------
  function createSouthGate() {
    const g = new THREE.Group();
    const green = M.roofGreen(3, 2), greenR = M.roofGreen(1, 1);
    // 中央台基
    g.add(BTQ.box(20, 0.7, 13, M.stone(6, 3), 0, 0.35, 0));
    // 中央六柱（三大门洞）
    [-8.4, -2.8, 2.8, 8.4].forEach(x => {
      [-3.8, 3.8].forEach(z => {
        const c = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, 6.2, 14), M.pillarRed);
        c.position.set(x, 3.8, z); c.castShadow = true; g.add(c);
        const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.3, 14), M.whiteStone);
        foot.position.set(x, 0.85, z); g.add(foot);
      });
    });
    // 中央两侧白墙门房
    g.add(BTQ.box(3.4, 4.2, 9, M.wall(2, 2), -5.6, 2.8, 0.5));
    g.add(BTQ.box(3.4, 4.2, 9, M.wall(2, 2), 5.6, 2.8, 0.5));
    // 明间朱红实榻大门（两扇向内敞开，金钉）
    const doorW = 2.55, doorH = 4.4;
    const mkDoor = (hingeX, dir, ang) => {
      const pivot = new THREE.Group();
      pivot.position.set(hingeX, 0.7, -3.7);
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(doorW, doorH, 0.12), M.gateDoor());
      leaf.position.set(dir * doorW / 2, doorH / 2, 0);
      leaf.castShadow = true;
      pivot.add(leaf);
      pivot.rotation.y = ang;
      g.add(pivot);
    };
    mkDoor(-2.5, 1, -1.75);
    mkDoor(2.5, -1, 1.75);
    // 门槛
    g.add(BTQ.box(5.4, 0.28, 0.5, M.stone(1, 1), 0, 0.84, -3.7));
    // 梁枋斗拱彩画
    g.add(BTQ.box(19, 0.8, 1.0, M.paintGreen, 0, 6.4, -4.2));
    g.add(BTQ.box(19, 0.8, 1.0, M.paintGreen, 0, 6.4, 4.2));
    g.add(BTQ.box(1.0, 0.8, 8.4, M.paintGreen, -8.9, 6.4, 0));
    g.add(BTQ.box(1.0, 0.8, 8.4, M.paintGreen, 8.9, 6.4, 0));
    // 主楼屋顶（前大后小勾连搭）
    const r1 = createRoof('xieshan', 21, 7.5, 3.0, green, { ridgeMat: greenR, trimMat: M.gold });
    r1.position.set(0, 7.0, -2.6); g.add(r1);
    const r2 = createRoof('gable', 20, 6.5, 2.2, green, { ridgeMat: greenR, trimMat: M.gold });
    r2.position.set(0, 6.6, 3.4); g.add(r2);
    // 主匾“趵突泉”（红底金字，乾隆御笔）
    const tex = BTQ.materials.plaque('趵 突 泉', { w: 320, h: 110, bg: '#8c2318', fg: '#f2d488', fontSize: 64, borderColor: '#e8c869' });
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 2.0), new THREE.MeshBasicMaterial({ map: tex }));
    pl.position.set(0, 5.7, -4.75); g.add(pl);
    const tex2 = BTQ.materials.plaque('泺源门', { w: 200, h: 80, bg: '#1c1a17', fg: '#e8c869', fontSize: 46 });
    const pl2 = new THREE.Mesh(new THREE.PlaneGeometry(4, 1.1), new THREE.MeshBasicMaterial({ map: tex2 }));
    pl2.position.set(0, 6.9, -4.7); g.add(pl2);

    // 两侧连廊+票房（对称）
    [-1, 1].forEach(s => {
      const corr = createCorridor(11, 'x', { roofMat: green });
      corr.position.set(s * 15, 0, 0); g.add(corr);
      // 票房（攒尖小阁）
      const box = createPavilion({ size: 8, roofMat: green, ridgeMat: greenR, baseH: 0.5, colH: 3.2, roofH: 2.0, openSide: s > 0 ? 2 : -2 });
      // 票房加白墙
      box.add(BTQ.box(6.4, 2.6, 0.2, M.wall(2, 1), 0, 2.0, s > 0 ? 3.4 : -3.4));
      box.position.set(s * 24, 0, 0);
      g.add(box);
    });
    // 石狮
    [-1, 1].forEach(s => {
      const lion = new THREE.Group();
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.7, 10, 8), M.whiteStone);
      body.scale.set(1, 0.8, 1.3); body.position.y = 0.9; lion.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.45, 10, 8), M.whiteStone);
      head.position.set(0, 1.5, -0.5); lion.add(head);
      const ped = BTQ.box(1.4, 0.5, 1.4, M.whiteStone, 0, 0.25, 0); lion.add(ped);
      lion.position.set(s * 6.5, 0, -7.5);
      g.add(lion);
    });
    BTQ.registerClickable(g, '趵突泉南门（泺源门）',
      '公园正门，临泺源大街。东西长47.5米、南北深13米、主门高8.4米，占地1575平方米，采用完全轴对称布局，绿琉璃瓦歇山顶并以“勾连搭”组合歇山、悬山、攒尖、盝顶等屋顶形式。红底金字“趵突泉”匾额取自乾隆御笔，另有“泺源门”“激湍”匾额。');
    g.name = '趵突泉南门';
    return g;
  }
  BTQ.createSouthGate = createSouthGate;

  // ---------- 石碑 ----------
  function createStele(text, opts) {
    opts = opts || {};
    const g = new THREE.Group();
    const w = opts.w || 1.1, h = opts.h || 2.6;
    // 底座
    g.add(BTQ.box(w * 1.5, 0.4, w * 0.9, M.stone(1, 1), 0, 0.2, 0));
    // 碑身
    const body = BTQ.box(w, h, 0.32, M.whiteStone, 0, 0.4 + h / 2, 0);
    g.add(body);
    // 碑首（圆弧）
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(w / 2, w / 2, 0.34, 16, 1, false, 0, Math.PI), M.whiteStone);
    cap.rotation.z = Math.PI / 2; cap.rotation.y = Math.PI / 2;
    cap.position.set(0, 0.4 + h, 0); cap.castShadow = true; g.add(cap);
    // 碑文
    if (text) {
      const tex = BTQ.materials.plaque(text, { w: 128, h: 256, bg: '#e9e6dc', fg: opts.fg || '#274a86', fontSize: 44, vertical: true, border: false });
      const face = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.78, h * 0.82), new THREE.MeshBasicMaterial({ map: tex }));
      face.position.set(0, 0.4 + h / 2, -0.18); g.add(face);
    }
    if (opts.name) { BTQ.registerClickable(g, opts.name, opts.desc || ''); g.name = opts.name; }
    return g;
  }
  BTQ.createStele = createStele;

  // ---------- 假山置石 ----------
  function createRockery(scale, count, spread, mat) {
    const g = new THREE.Group();
    const m = mat || M.rock;
    for (let i = 0; i < count; i++) {
      const r = (0.5 + Math.random() * 1.1) * scale;
      const geo = new THREE.DodecahedronGeometry(r, 0);
      const pos = geo.attributes.position;
      for (let j = 0; j < pos.count; j++) {
        pos.setXYZ(j, pos.getX(j) * (0.8 + Math.random() * 0.4), pos.getY(j) * (0.7 + Math.random() * 0.5), pos.getZ(j) * (0.8 + Math.random() * 0.4));
      }
      geo.computeVertexNormals();
      const rock = new THREE.Mesh(geo, m);
      rock.position.set((Math.random() - 0.5) * spread, r * 0.4, (Math.random() - 0.5) * spread);
      rock.rotation.set(Math.random(), Math.random() * 3, Math.random());
      rock.castShadow = true; rock.receiveShadow = true;
      g.add(rock);
    }
    return g;
  }
  BTQ.createRockery = createRockery;

  // 单峰名石（龟石）
  function createTaihuStone(height) {
    const g = new THREE.Group();
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const pos = geo.attributes.position;
    for (let j = 0; j < pos.count; j++) {
      const v = new THREE.Vector3(pos.getX(j), pos.getY(j), pos.getZ(j));
      v.multiplyScalar(1 + 0.25 * Math.sin(v.x * 5) + 0.2 * Math.cos(v.y * 7));
      pos.setXYZ(j, v.x, v.y * 1.5, v.z * 0.8);
    }
    geo.computeVertexNormals();
    const stone = new THREE.Mesh(geo, M.rock);
    stone.scale.set(0.8, height / 2, 0.7);
    stone.position.y = height / 2;
    stone.castShadow = true;
    g.add(stone);
    g.add(BTQ.box(1.8, 0.5, 1.6, M.stone(1, 1), 0, 0.25, 0));
    return g;
  }
  BTQ.createTaihuStone = createTaihuStone;
})();
