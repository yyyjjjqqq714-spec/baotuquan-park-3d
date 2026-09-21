/* ============================================================
 * 趵突泉公园场地三维模型 - 程序化纹理与材质
 * 全部纹理由 Canvas 生成，无外部图片资源
 * ============================================================ */
(function () {
  const BTQ = window.BTQ;

  function canvasTex(size, draw, repeat) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    const ctx = c.getContext('2d');
    draw(ctx, size);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    if (repeat) t.repeat.set(repeat[0], repeat[1]);
    t.anisotropy = 8;
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  // 可重复设置的纹理克隆
  function rep(tex, x, y) {
    const t = tex.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(x, y);
    t.needsUpdate = true;
    return t;
  }

  function noise(ctx, s, n, alpha) {
    for (let i = 0; i < n; i++) {
      const g = 100 + Math.random() * 120;
      ctx.fillStyle = `rgba(${g},${g},${g},${Math.random() * alpha})`;
      ctx.fillRect(Math.random() * s, Math.random() * s, 2 + Math.random() * 4, 2 + Math.random() * 4);
    }
  }

  // 草地
  const grassTex = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#6d8f45';
    ctx.fillRect(0, 0, s, s);
    for (let i = 0; i < 9000; i++) {
      const r = Math.random();
      ctx.fillStyle = r < 0.45 ? 'rgba(120,150,70,0.5)' : r < 0.8 ? 'rgba(80,110,50,0.45)' : 'rgba(150,160,90,0.4)';
      ctx.fillRect(Math.random() * s, Math.random() * s, 1.5, 1.5 + Math.random() * 2.5);
    }
    // 少量裸土斑块
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = 'rgba(150,140,100,0.10)';
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 8 + Math.random() * 18, 5 + Math.random() * 12, Math.random() * 3, 0, 7);
      ctx.fill();
    }
  });

  // 石板铺装（园路/平台）
  const pavingTex = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#a69e8b';
    ctx.fillRect(0, 0, s, s);
    const rows = 8;
    const h = s / rows;
    ctx.strokeStyle = 'rgba(90,86,76,0.55)';
    ctx.lineWidth = 2;
    for (let r = 0; r < rows; r++) {
      const y = r * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke();
      const cols = 4 + (r % 2);
      const w = s / cols;
      for (let cI = 0; cI < cols; cI++) {
        const x = cI * w + (r % 2 ? w * 0.15 : 0);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();
      }
    }
    noise(ctx, s, 1200, 0.10);
  });

  // 青石板（池壁/台基）
  const stoneTex = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#92958f';
    ctx.fillRect(0, 0, s, s);
    const rows = 6;
    const h = s / rows;
    ctx.strokeStyle = 'rgba(60,62,60,0.6)';
    ctx.lineWidth = 2.5;
    for (let r = 0; r <= rows; r++) {
      const y = r * h;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke();
      const cols = 3;
      const w = s / cols;
      const off = (r % 2) * w * 0.5;
      for (let cI = 0; cI <= cols; cI++) {
        const x = cI * w + off;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.stroke();
      }
    }
    noise(ctx, s, 1500, 0.12);
  });

  // 砖墙（围墙/硬山建筑山墙下碱用红灰砖）
  const brickTex = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#b8a994';
    ctx.fillRect(0, 0, s, s);
    const rows = 12, h = s / rows;
    ctx.strokeStyle = 'rgba(120,105,88,0.5)';
    ctx.lineWidth = 1.5;
    for (let r = 0; r <= rows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * h); ctx.lineTo(s, r * h); ctx.stroke();
      const w = s / 6;
      for (let cI = 0; cI <= 6; cI++) {
        const x = cI * w + (r % 2 ? w * 0.5 : 0);
        ctx.beginPath(); ctx.moveTo(x, r * h); ctx.lineTo(x, r * h + h); ctx.stroke();
      }
    }
    noise(ctx, s, 1000, 0.08);
  });

  // 瓦屋顶：底色调瓦垄（纵向半圆沟）与横向檐瓦
  function makeRoofTex(base, dark, light) {
    return canvasTex(256, (ctx, s) => {
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, s, s);
      // 瓦垄：竖直平行暗线+亮线
      const pitch = 18;
      for (let x = 0; x < s; x += pitch) {
        const g = ctx.createLinearGradient(x, 0, x + pitch, 0);
        g.addColorStop(0, dark);
        g.addColorStop(0.5, light);
        g.addColorStop(1, dark);
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, pitch, s);
      }
      // 横向瓦当纹
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1.5;
      for (let y = 22; y < s; y += 30) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke();
      }
      noise(ctx, s, 1400, 0.10);
    });
  }

  const roofGrayTex = makeRoofTex('#7d7c74', 'rgba(50,50,48,0.55)', 'rgba(175,173,162,0.5)');
  const roofYellowTex = makeRoofTex('#d3a13c', 'rgba(140,95,20,0.55)', 'rgba(245,210,110,0.6)');
  const roofGreenTex = makeRoofTex('#467a52', 'rgba(25,60,38,0.6)', 'rgba(110,160,115,0.55)');

  // 木隔扇门窗（深红褐底+格棂）
  const latticeTex = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#5e2418';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(210,175,95,0.75)';
    ctx.lineWidth = 3;
    const n = 6, step = s / n;
    for (let i = 1; i < n; i++) {
      ctx.beginPath(); ctx.moveTo(i * step, 8); ctx.lineTo(i * step, s - 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(8, i * step); ctx.lineTo(s - 8, i * step); ctx.stroke();
    }
    // 下半实心裙板
    ctx.fillStyle = 'rgba(90,35,22,0.9)';
    ctx.fillRect(6, s * 0.62, s - 12, s * 0.33);
    ctx.strokeStyle = 'rgba(210,175,95,0.5)';
    ctx.strokeRect(6, s * 0.62, s - 12, s * 0.33);
  });

  // 白灰墙面
  const wallTex = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#ece5d3';
    ctx.fillRect(0, 0, s, s);
    noise(ctx, s, 2500, 0.07);
    for (let i = 0; i < 10; i++) {
      ctx.fillStyle = 'rgba(160,150,125,0.05)';
      ctx.beginPath();
      ctx.ellipse(Math.random() * s, Math.random() * s, 10 + Math.random() * 25, 6 + Math.random() * 14, Math.random() * 3, 0, 7);
      ctx.fill();
    }
  });

  // 沥青城市道路
  const roadTex = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#45464a';
    ctx.fillRect(0, 0, s, s);
    noise(ctx, s, 3000, 0.12);
  });

  // 广场铺装
  const squareTex = canvasTex(256, (ctx, s) => {
    ctx.fillStyle = '#b1ab99';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(150,146,135,0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i <= 8; i++) {
      ctx.beginPath(); ctx.moveTo((s / 8) * i, 0); ctx.lineTo((s / 8) * i, s); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (s / 8) * i); ctx.lineTo(s, (s / 8) * i); ctx.stroke();
    }
    noise(ctx, s, 1000, 0.07);
  });

  // 文字匾额/石碑纹理生成
  function plaqueTexture(text, opts) {
    opts = opts || {};
    const w = opts.w || 256, h = opts.h || 96;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const ctx = c.getContext('2d');
    ctx.fillStyle = opts.bg || '#1c1a17';
    ctx.fillRect(0, 0, w, h);
    if (opts.border !== false) {
      ctx.strokeStyle = opts.borderColor || '#c9a24b';
      ctx.lineWidth = 5;
      ctx.strokeRect(5, 5, w - 10, h - 10);
    }
    ctx.fillStyle = opts.fg || '#e8c869';
    const fs = opts.fontSize || Math.floor(h * 0.55);
    ctx.font = `bold ${fs}px "KaiTi","STKaiti","SimSun",serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const chars = text.split('');
    if (opts.vertical) {
      const ch = h / (chars.length + 1);
      chars.forEach((ch2, i) => ctx.fillText(ch2, w / 2, ch * (i + 1)));
    } else {
      ctx.fillText(text, w / 2, h / 2 + 2);
    }
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    return t;
  }

  // 石栏板镂空纹（简化为框+几何纹）
  const panelTex = canvasTex(128, (ctx, s) => {
    ctx.fillStyle = '#e7e4da';
    ctx.fillRect(0, 0, s, s);
    ctx.strokeStyle = 'rgba(120,116,105,0.9)';
    ctx.lineWidth = 5;
    ctx.strokeRect(8, 8, s - 16, s - 16);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(s / 2, s / 2, s * 0.22, 0, 7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(s * 0.2, s * 0.72); ctx.lineTo(s * 0.5, s * 0.3); ctx.lineTo(s * 0.8, s * 0.72);
    ctx.stroke();
  });

  // 朱红实榻大门（金钉、铺首）
  const gateDoorTex = canvasTex(256, (ctx, s) => {
    const grad = ctx.createLinearGradient(0, 0, s, 0);
    grad.addColorStop(0, '#6e1d14'); grad.addColorStop(0.5, '#8a2a1c'); grad.addColorStop(1, '#6e1d14');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, s, s);
    // 门板竖缝
    ctx.strokeStyle = 'rgba(50,12,8,0.8)'; ctx.lineWidth = 3;
    for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(i * s / 4, 0); ctx.lineTo(i * s / 4, s); ctx.stroke(); }
    // 门钉（7列×9路）
    const cols = 7, rows = 9;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = s * (0.12 + c * 0.76 / (cols - 1)), y = s * (0.1 + r * 0.8 / (rows - 1));
      const rg = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, 7);
      rg.addColorStop(0, '#f4dc96'); rg.addColorStop(0.6, '#d8b056'); rg.addColorStop(1, '#9a762e');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, 6.5, 0, 7); ctx.fill();
    }
    // 铺首
    ctx.fillStyle = '#c9a24a';
    ctx.beginPath(); ctx.arc(s / 2, s * 0.52, 15, 0, 7); ctx.fill();
    ctx.fillStyle = '#5a160e';
    ctx.beginPath(); ctx.arc(s / 2, s * 0.52, 7, 0, 7); ctx.fill();
    ctx.strokeStyle = '#3a0d08'; ctx.lineWidth = 10; ctx.strokeRect(5, 5, s - 10, s - 10);
  });

  BTQ.textures = {
    grassTex, pavingTex, stoneTex, brickTex, wallTex, roadTex, squareTex, panelTex, gateDoorTex,
    roofGrayTex, roofYellowTex, roofGreenTex, latticeTex,
    rep, plaqueTexture
  };

  // ---- 材质库 ----
  function std(tex, rx, ry, p) {
    p = p || {};
    const m = new THREE.MeshStandardMaterial(Object.assign({
      map: tex ? BTQ.textures.rep(tex, rx || 1, ry || 1) : null,
      roughness: 0.85,
      metalness: 0.0
    }, p));
    return m;
  }

  BTQ.materials = {
    grass: () => std(BTQ.textures.grassTex, 26, 26, { roughness: 1 }),
    grassHill: () => std(BTQ.textures.grassTex, 10, 10, { roughness: 1 }),
    paving: (x, y) => std(BTQ.textures.pavingTex, x || 2, y || 2, { roughness: 0.9 }),
    stone: (x, y) => std(BTQ.textures.stoneTex, x || 2, y || 2, { roughness: 0.95 }),
    brick: (x, y) => std(BTQ.textures.brickTex, x || 2, y || 2),
    wall: (x, y) => std(BTQ.textures.wallTex, x || 2, y || 2, { roughness: 1, color: 0xf3eedd }),
    road: (x, y) => std(BTQ.textures.roadTex, x || 6, y || 6, { roughness: 1 }),
    square: (x, y) => std(BTQ.textures.squareTex, x || 4, y || 4, { roughness: 0.95 }),
    roofGray: (x, y) => std(BTQ.textures.roofGrayTex, x || 2, y || 2, { roughness: 0.7, side: THREE.DoubleSide }),
    roofYellow: (x, y) => std(BTQ.textures.roofYellowTex, x || 2, y || 2, { roughness: 0.55, side: THREE.DoubleSide }),
    roofGreen: (x, y) => std(BTQ.textures.roofGreenTex, x || 2, y || 2, { roughness: 0.6, side: THREE.DoubleSide }),
    lattice: () => std(BTQ.textures.latticeTex, 1, 1, { roughness: 0.6 }),
    gateDoor: () => std(BTQ.textures.gateDoorTex, 1, 1, { roughness: 0.6 }),
    panel: () => std(BTQ.textures.panelTex, 1, 1, { roughness: 0.9 }),
    redWood: new THREE.MeshStandardMaterial({ color: 0x8c3226, roughness: 0.55 }),
    darkWood: new THREE.MeshStandardMaterial({ color: 0x4a2418, roughness: 0.6 }),
    pillarRed: new THREE.MeshStandardMaterial({ color: 0x9c3a26, roughness: 0.45 }),
    whiteStone: new THREE.MeshStandardMaterial({ color: 0xe9e6dc, roughness: 0.85 }),
    rock: new THREE.MeshStandardMaterial({ color: 0x8d8e88, roughness: 1, flatShading: true }),
    rockDark: new THREE.MeshStandardMaterial({ color: 0x6f716c, roughness: 1, flatShading: true }),
    gold: new THREE.MeshStandardMaterial({ color: 0xd8b056, roughness: 0.35, metalness: 0.35 }),
    bronze: new THREE.MeshStandardMaterial({ color: 0x6b5a3a, roughness: 0.5, metalness: 0.5 }),
    paintGreen: new THREE.MeshStandardMaterial({ color: 0x2f6b52, roughness: 0.6 }),
    paintBlue: new THREE.MeshStandardMaterial({ color: 0x2f5a78, roughness: 0.6 }),
    leafWillow: new THREE.MeshStandardMaterial({ color: 0x7ba24e, roughness: 1 }),
    leafWillowDark: new THREE.MeshStandardMaterial({ color: 0x5f8a3c, roughness: 1 }),
    leafPine: new THREE.MeshStandardMaterial({ color: 0x3c6238, roughness: 1 }),
    leafBroad: new THREE.MeshStandardMaterial({ color: 0x527e3c, roughness: 1 }),
    leafBroadAutumn: new THREE.MeshStandardMaterial({ color: 0xc08a35, roughness: 1 }),
    trunk: new THREE.MeshStandardMaterial({ color: 0x6b4a30, roughness: 1 }),
    bamboo: new THREE.MeshStandardMaterial({ color: 0x7aa84a, roughness: 0.9 }),
    plaque: plaqueTexture
  };
})();
