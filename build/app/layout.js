/* ============================================================
 * 景点布局：依据官方导游图与航拍影像复原相对位置（示意比例）
 * ============================================================ */
(function () {
  const BTQ = window.BTQ;
  const M = BTQ.materials;
  const scene = () => BTQ.scene;

  const gray = () => M.roofGray(2, 2);
  const grayR = () => M.roofGray(1, 1);
  const yellow = () => M.roofYellow(2, 2);
  const yellowR = () => M.roofYellow(1, 1);
  const green = () => M.roofGreen(2, 2);
  const greenR = () => M.roofGreen(1, 1);

  function put(obj, x, y, z, rotY) {
    obj.position.set(x, y === undefined ? 0 : y, z);
    if (rotY !== undefined) obj.rotation.y = rotY;
    scene().add(obj);
    return obj;
  }

  // 矩形小泉池石栏
  function poolRailing(x, z, w, d) {
    const g = new THREE.Group();
    const r1 = BTQ.makeRailing(w + 0.6, 'x'); r1.position.set(0, 0.06, -d / 2 - 0.25); g.add(r1);
    const r2 = BTQ.makeRailing(w + 0.6, 'x'); r2.position.set(0, 0.06, d / 2 + 0.25); g.add(r2);
    const r3 = BTQ.makeRailing(d + 0.1, 'z'); r3.position.set(-w / 2 - 0.25, 0.06, 0); g.add(r3);
    const r4 = BTQ.makeRailing(d + 0.1, 'z'); r4.position.set(w / 2 + 0.25, 0.06, 0); g.add(r4);
    g.position.set(x, 0, z);
    scene().add(g);
  }

  // ============ 1. 核心泉区 ============
  function buildCoreArea() {
    // 池东水面（来鹤桥两侧，接枫溪泄水方向）
    const eastWater = BTQ.flatShape([[-24, 156], [4, 154], [10, 192], [-12, 198], [-24, 188]],
      BTQ.waterMaterial(0.9, 0x1c5f6b, 0x4f9aa0), 0.05, 8);
    eastWater.renderOrder = 2;
    scene().add(eastWater);

    // 观澜亭（西岸水中，黄琉璃攒尖，台基入水）
    const glt = BTQ.createPavilion({
      size: 7.6, baseH: 1.0, colH: 3.0, roofH: 2.5,
      roofMat: yellow(), ridgeMat: yellowR(), plaque: '观澜亭', openSide: -2,
      name: '观澜亭',
      desc: '始建于明天顺五年（1461年），方形红柱黄瓦，石台基伸入水中，是俯观三股水的最佳处。亭前水中立明代胡缵宗所书“趵突泉”碑。楹联“三尺不消平地雪，四时常吼半天雷”出自张养浩。'
    });
    put(glt, -57.5, 0, 178);
    // 亭—西岸折桥
    put(BTQ.createFlatBridge([[-69.5, 178], [-62.6, 178]], 2.2, { name: '观澜桥', desc: '连接观澜亭与池西岸的石板平桥。' }), 0, 0.1, 0);

    // “趵突泉”碑（亭南水中）
    const stele1 = BTQ.createStele('趵突泉', { w: 1.0, h: 2.3, name: '趵突泉碑', desc: '明代山东巡抚胡缵宗手书“趵突泉”石碑，立于观澜亭前水中。' });
    put(stele1, -57.5, 0, 172.2);
    BTQ.box(2.0, 1.2, 2.0, M.stone(1, 1), -57.5, -0.5, 172.2).name = '碑座';
    // “第一泉”碑（池东）
    const stele2 = BTQ.createStele('第一泉', { w: 0.9, h: 2.0, fg: '#8c2318', name: '第一泉碑', desc: '清同治年间书法家王钟霖所书“第一泉”石刻。' });
    put(stele2, -25.5, 0, 168);
    // 双御碑（西南岸）
    const stele3 = BTQ.createStele('双御碑', { w: 1.1, h: 2.6, fg: '#3a3a3a', name: '双御碑', desc: '上有康熙、乾隆两代皇帝题字，故称双御碑。' });
    put(stele3, -56.5, 0, 161.5);

    // 泺源堂（北岸，三间两层歇山，黄琉璃瓦，前月台临水）
    const lyt = BTQ.createHall({
      w: 16, d: 9, bays: 4, stories: 2, roof: 'xieshan',
      roofMat: yellow(), ridgeMat: yellowR(), platform: true,
      plaque: '泺源堂', name: '泺源堂（三大殿）',
      desc: '位于趵突泉北岸，始建于北宋，曾名吕祖庙。最南大殿“泺源堂”三间两层、歇山飞檐，黄琉璃瓦，南有月台临水；与娥姜祠、三圣殿合称“三大殿”。堂前抱柱楹联为赵孟頫名句“云雾润蒸华不注，波涛声震大明湖”。'
    });
    put(lyt, -40, 0, 202);
    // 娥姜祠
    const ejc = BTQ.createHall({
      w: 14, d: 8, bays: 4, roof: 'xieshan', roofMat: gray(), ridgeMat: grayR(),
      plaque: '娥姜祠', name: '娥姜祠', desc: '三大殿之一，祀娥皇、女英，位于泺源堂以北。'
    });
    put(ejc, -40, 0, 221);
    // 三圣殿
    const ss = BTQ.createHall({
      w: 15, d: 8, bays: 5, roof: 'xieshan', roofMat: gray(), ridgeMat: grayR(),
      plaque: '三圣殿', name: '三圣殿', desc: '三大殿最北一座殿宇，与泺源堂、娥姜祠沿南北轴线排列。'
    });
    put(ss, -40, 0, 239);
    // 轴线两侧廊庑
    put(BTQ.createCorridor(40, 'z', { name: '三大殿西廊', desc: '三大殿院落西侧廊庑。' }), -52, 0, 218);
    put(BTQ.createCorridor(40, 'z'), -28, 0, 218);

    // 来鹤桥（池东折桥）
    put(BTQ.createFlatBridge([[-24.5, 183], [-18, 177], [-13, 170], [-9.5, 163]], 2.8, {
      name: '来鹤桥', desc: '架于趵突泉池东，石板折桥。桥南端旧有“蓬山旧迹”“洞天福地”木牌楼。'
    }), 0, 0.12, 0);
    // 蓬山旧迹坊（桥南端）
    const pf = BTQ.createPaifang({ width: 9, bays: 1, roofMat: gray(), plaque: '蓬山旧迹', name: '蓬山旧迹坊', desc: '来鹤桥南端木牌楼，横额题“蓬山旧迹”“洞天福地”。' });
    put(pf, -8, 0, 157.5);

    // 望鹤亭茶社（桥东水榭，朝西）
    const wh = BTQ.createHall({
      w: 13, d: 7, bays: 4, roof: 'gable', roofMat: gray(), ridgeMat: grayR(),
      baseH: 0.9, colH: 3.2, plaque: '望鹤亭', name: '望鹤亭茶社',
      desc: '位于来鹤桥东，取趵突泉水沏茶待客。楹联“滋荣冬茹温常早，润泽春茶味更真”出自曾巩。'
    });
    wh.rotation.y = Math.PI / 2;
    put(wh, -4.5, 0, 175);
    // 池东北灰瓦院落（茶社后院）
    put(BTQ.createHall({ w: 12, d: 7, bays: 4, roof: 'gable', roofMat: gray(), ridgeMat: grayR(), baseH: 0.4 }), -14, 0, 196, Math.PI / 2);

    // 南岸长廊（围合池南）
    put(BTQ.createCorridor(15, 'x', { name: '趵突泉南长廊', desc: '泉池南缘碑刻长廊，围合泉池。' }), -50, 0, 161.5);
    put(BTQ.createCorridor(12, 'x'), -28, 0, 161.5);
    // 西岸长廊（观澜亭以北）
    put(BTQ.createCorridor(22, 'z', { name: '西岸临水廊', desc: '泉池西岸临水长廊。' }), -68.5, 0, 196);
  }

  // ============ 2. 枫溪与白雪楼、沧园 ============
  function buildMapleArea() {
    // 白雪楼（二层，坐南朝北，戏台在北）
    const bxl = BTQ.createHall({
      w: 17, d: 9, bays: 5, stories: 2, roof: 'xieshan', roofMat: gray(), ridgeMat: grayR(),
      baseH: 0.8, plaque: '白雪楼', name: '白雪楼·大戏台',
      desc: '为纪念明代“后七子”领袖李攀龙而建，其原为藏书处。今楼为1996年重建，建筑面积约400平方米，带戏台式二层仿古建筑，戏台设于北侧，节假日上演曲艺。相邻有湛露泉、酒泉、石湾泉。'
    });
    bxl.rotation.y = Math.PI;
    put(bxl, 14, 0, 150);

    // 枫榭（枫溪水榭）
    const fx = BTQ.createHall({
      w: 10, d: 7, bays: 3, roof: 'xieshan', roofMat: gray(), ridgeMat: grayR(),
      baseH: 1.0, colH: 3.2, plaque: '枫榭', name: '枫榭', desc: '枫溪水中的水榭，临溪观景。'
    });
    put(fx, 44, 0, 122);
    put(BTQ.createFlatBridge([[44, 132], [44, 138]], 2.2), 0, 0.1, 0);

    // 枫溪桥（中轴拱桥、东西平桥）
    put(BTQ.createArchBridge(16, 4.5, { name: '枫溪桥', desc: '枫溪上石拱桥，正对南门中轴。' }), 2, 0, 112, Math.PI / 2);
    put(BTQ.createFlatBridge([[70, 108], [84, 122]], 3.0, { name: '枫溪东桥', desc: '枫溪东端石板平桥。' }), 0, 0.1, 0);
    put(BTQ.createFlatBridge([[-66, 116], [-54, 122]], 2.8), 0, 0.1, 0);
    // 晴雨溪桥（东门路）
    put(BTQ.createFlatBridge([[126, 170], [138, 170]], 3.4, { name: '晴雨溪桥', desc: '东门内跨晴雨溪平桥。' }), 0, 0.1, 0);

    // 沧园（王雪涛纪念馆）
    const cy = BTQ.createCourtyard({
      w: 52, d: 42, roofMat: gray(), mainBays: 5,
      mainPlaque: '王雪涛纪念馆', gatePlaque: '沧园',
      name: '沧园·王雪涛纪念馆', desc: '位于公园东南部、枫溪之南，为古典园林式院落，内设王雪涛纪念馆，陈列小写意花鸟画作品。'
    });
    put(cy, 48, 0, 70);

    // 湛露泉亭
    put(BTQ.createPavilion({ size: 5.2, baseH: 0.35, colH: 2.7, roofH: 1.9, roofMat: gray(), ridgeMat: grayR(), name: '湛露泉亭', desc: '白雪楼东侧泉池群旁的凉亭。' }), 44, 0, 136);
  }

  // ============ 3. 万竹园（西部园中园）============
  function buildWanzhu() {
    // 东路三进院（李苦禅纪念馆）
    const e1 = BTQ.createCourtyard({ w: 42, d: 34, roofMat: gray(), mainBays: 5, mainPlaque: '李苦禅纪念馆', gatePlaque: '万竹园', name: '万竹园·东院', desc: '万竹园始建于元代，占地18亩（约12000平方米），为北方私家园林代表，融南方庭院与北京王府风格于一体，石雕、木雕、砖雕“三绝”著称，东园为李苦禅纪念馆。' });
    put(e1, -104, 0, 168);
    const e2 = BTQ.createCourtyard({ w: 42, d: 34, roofMat: gray(), mainBays: 5, mainPlaque: '木瓜院', gatePlaque: ' ' });
    put(e2, -104, 0, 128);
    const e3 = BTQ.createCourtyard({ w: 38, d: 30, roofMat: gray(), mainBays: 5, mainPlaque: '海棠院', gatePlaque: ' ' });
    put(e3, -104, 0, 90);
    // 西路两进小园
    const w1 = BTQ.createCourtyard({ w: 22, d: 30, roofMat: gray(), mainBays: 3, mainPlaque: '四照阁' });
    put(w1, -128, 0, 150);
    const w2 = BTQ.createCourtyard({ w: 22, d: 28, roofMat: gray(), mainBays: 3 });
    put(w2, -128, 0, 112);
    // 望水泉亭
    put(BTQ.createPavilion({ size: 5, baseH: 0.3, colH: 2.6, roofH: 1.8, roofMat: gray(), ridgeMat: grayR(), name: '望水泉亭', desc: '望水泉位于万竹园内，泉池长20米、宽10米、深2.2米，《名泉碑》《七十二泉诗》均有著录。' }), -108, 0, 160);
    // 万竹园东门（通乐园侧）
    const gate = BTQ.createSmallGate({ width: 8, roofMat: gray(), plaque: '万竹园' });
    put(gate, -80, 0, 130, -Math.PI / 2);
    // 通乐园亭
    put(BTQ.createPavilion({ size: 5.4, baseH: 0.3, colH: 2.7, roofH: 1.9, roofMat: gray(), ridgeMat: grayR(), name: '通乐园', desc: '万竹园东侧的园林小景区。' }), -72, 0, 118);
    // 白龙湾亭
    put(BTQ.createPavilion({ size: 5.4, baseH: 0.35, colH: 2.7, roofH: 1.9, roofMat: gray(), ridgeMat: grayR(), name: '白龙湾亭', desc: '白龙湾为公园西南角水面，湾畔筑亭。' }), -126, 0, 36);
    // 白龙湾小桥
    put(BTQ.createFlatBridge([[-100, 60], [-92, 70]], 2.4), 0, 0.1, 0);
  }

  // ============ 4. 李清照纪念堂与名泉区 ============
  function buildLiQingzhao() {
    // 主院（纪念堂）
    const main = BTQ.createCourtyard({
      w: 40, d: 38, roofMat: gray(), mainBays: 5, mainPlaque: '漱玉堂', gatePlaque: '李清照纪念堂',
      name: '李清照纪念堂', desc: '坐落于漱玉泉畔，始建于1959年，在丁宝桢祠基础上辟建，1999年扩建，总面积4000余平方米，仿宋建筑、三院式布局，是国内规模最大的李清照纪念场馆。'
    });
    put(main, 22, 0, 264);
    // 西院（易安旧居）
    const west = BTQ.createCourtyard({ w: 28, d: 36, roofMat: gray(), mainBays: 3, mainPlaque: '易安旧居', gatePlaque: ' ' });
    put(west, -18, 0, 262);
    // 后院（静治堂）
    const back = BTQ.createCourtyard({ w: 30, d: 26, roofMat: gray(), mainBays: 3, mainPlaque: '静治堂', gatePlaque: ' ' });
    put(back, 22, 0, 306);

    // 漱玉泉石栏
    poolRailing(20.4, 238.5, 4.8, 3.1);
    // 柳絮泉石栏
    poolRailing(4, 244.5, 12, 9);
    // 金线泉、老金线泉、皇华泉、卧牛泉、杜康泉、登州泉、满井泉石栏
    poolRailing(-6, 217, 16, 10);
    poolRailing(-12, 230.5, 12, 9);
    poolRailing(12, 205, 12, 10);
    poolRailing(-6, 202.5, 12, 9);
    poolRailing(-79, 181, 10, 10);
    poolRailing(-81, 163, 10, 10);
    poolRailing(-61, 219, 10, 10);
    poolRailing(-108, 153, 20, 10);
    poolRailing(-125, 109, 14, 10);
    poolRailing(-132.5, 215, 9, 10);

    // 龟石（名石）
    const gs = BTQ.createTaihuStone(3.2);
    put(gs, 33, 0, 236);
    BTQ.registerClickable(gs, '龟石', '苏州留园遗物，太湖石名峰，瘦、皱、漏、透，立于漱玉泉、马跑泉旁。');

    // 尚志堂
    const sz = BTQ.createHall({
      w: 14, d: 8, bays: 4, roof: 'gable', roofMat: gray(), ridgeMat: grayR(),
      plaque: '尚志堂', name: '尚志堂', desc: '位于金线泉畔，原为书院建筑，邻近鱼展馆，是名泉区主要厅堂。'
    });
    put(sz, 8, 0, 216);
    // 马跑泉石栏
    poolRailing(58, 263, 26, 30);
  }

  // ============ 5. 北部山林与三门 ============
  function buildNorthAndGates() {
    // 南门
    const ng = BTQ.createSouthGate();
    put(ng, 0, 0, 1);
    // 北门
    const bg = BTQ.createSmallGate({ width: 12, roofMat: green(), plaque: '趵突泉北门', name: '趵突泉北门', desc: '公园北界临共青团路的出入口，隔路与五龙潭公园相望。' });
    bg.rotation.y = Math.PI;
    put(bg, -20, 0, 466);
    // 东门
    const dg = BTQ.createSmallGate({ width: 12, roofMat: green(), plaque: '趵突泉东门', name: '趵突泉东门', desc: '公园东界临趵突泉南路的出入口，门外即泉城广场。' });
    dg.rotation.y = -Math.PI / 2;
    put(dg, 140, 0, 205);

    // 北门内民俗展览馆
    put(BTQ.createHall({ w: 16, d: 8, bays: 5, roof: 'gable', roofMat: gray(), ridgeMat: grayR(), plaque: '泉水文化展览馆', name: '泉水文化展览馆', desc: '北门内仿古建筑，展示济南泉水文化与民俗。' }), -20, 0, 446);

    // 北部山亭（随山势抬高）
    put(BTQ.createPavilion({ size: 6, baseH: 0.3, colH: 2.8, roofH: 2.1, roofMat: gray(), ridgeMat: grayR(), name: '北部山亭', desc: '北部挖湖堆山景区的山顶凉亭，可俯瞰全园。' }),
      50, BTQ.terrainHeight(50, 360), 360);
    // 濯缨池亭（池南）
    put(BTQ.createPavilion({ size: 5.4, baseH: 0.35, colH: 2.7, roofH: 1.9, roofMat: gray(), ridgeMat: grayR() }),
      -8, Math.max(0, BTQ.terrainHeight(-8, 300)), 300);
    // 无忧泉旁亭
    put(BTQ.createPavilion({ size: 5, baseH: 0.3, colH: 2.6, roofH: 1.8, roofMat: gray(), ridgeMat: grayR(), name: '无忧泉亭', desc: '无忧泉位于白雪楼戏台西侧、枫溪北岸。' }), -34, 0, 140);
  }

  // ============ 6. 假山对景与叠石 ============
  function buildRocks() {
    // 南门内对景假山
    const r1 = BTQ.createRockery(1.5, 16, 12, M.rock);
    r1.position.set(0, 0, 34); scene().add(r1);
    // 枫溪南岸假山
    const r2 = BTQ.createRockery(1.1, 12, 16, M.rockDark);
    r2.position.set(-30, 0, 96); scene().add(r2);
    // 漱玉泉周边叠石
    const r3 = BTQ.createRockery(0.8, 10, 10, M.rock);
    r3.position.set(30, 0, 246); scene().add(r3);
    // 池南岸叠石出水口
    const r4 = BTQ.createRockery(0.9, 12, 10, M.rockDark);
    r4.position.set(-40, 0, 150); scene().add(r4);
    // 万竹园置石
    const r5 = BTQ.createRockery(0.8, 10, 14, M.rock);
    r5.position.set(-70, 0, 150); scene().add(r5);
    // 北部山脚叠石
    const r6 = BTQ.createRockery(1.2, 14, 18, M.rock);
    r6.position.set(-30, 0, 300); scene().add(r6);
    // 枫溪东端假山
    const r7 = BTQ.createRockery(1.0, 10, 12, M.rock);
    r7.position.set(108, 0, 150); scene().add(r7);
  }

  BTQ.buildAllLayout = function () {
    buildCoreArea();
    buildMapleArea();
    buildWanzhu();
    buildLiQingzhao();
    buildNorthAndGates();
    buildRocks();
  };
})();
