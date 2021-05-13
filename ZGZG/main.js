console.log = function () { };  // ログを出す時にはコメントアウトする

var FPS = 60;  // 60フレ

var SCREEN_WIDTH = 1080;              // スクリーン幅
var SCREEN_HEIGHT = 1920;              // スクリーン高さ
var SCREEN_CENTER_X = SCREEN_WIDTH / 2;   // スクリーン幅の半分
var SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;  // スクリーン高さの半分

var FONT_FAMILY = "'Press Start 2P','Meiryo',sans-serif";
var ASSETS = {
    "player": "./resource/utena_128.png",

    "udon": "./resource/udon.png",
    "enemy": "./resource/planet_128.png",

    "bg_f": "./resource/bg_front.png",
    "bg_m": "./resource/bg_middle.png",
    "bg_b": "./resource/bg_back.png",

};
const fallSE = new Howl({
    src: 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/fall.mp3?20200708'
});
const coinSE = new Howl({
    src: 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/coin05.mp3'
});
const jumpSE = new Howl({
    src: 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/jump.mp3'
});

// 定義
var PL_STATUS = defineEnum({
    INIT: {
        value: 0,
        isStart: Boolean(0),
        isRotation: Boolean(0),
        isMove: Boolean(0),
        isDead: Boolean(0),
        string: 'init'
    },
    ROTATION: {
        value: 1,
        isStart: Boolean(1),
        isRotation: Boolean(1),
        isMove: Boolean(0),
        isDead: Boolean(0),
        string: 'stand'
    },
    MOVE: {
        value: 2,
        isStart: Boolean(1),
        isRotation: Boolean(0),
        isMove: Boolean(1),
        isDead: Boolean(0),
        string: 'up'
    },
    DEAD: {
        value: 3,
        isStart: Boolean(0),
        isRotation: Boolean(0),
        isMove: Boolean(0),
        isDead: Boolean(1),
        string: 'dead'
    },
});

var group0 = null;
var group1 = null;
var group2 = null;
var player = null;
var bgX = SCREEN_WIDTH / 2;
var bgBackY = 0;
var bgMiddleY = 0;
var bgFrontY = 0;
var player = null;
var stageInitTimer = 0;
var stageNum = 0;
var stageTimer = 0;
var stageUdonNum = 0;
var enemyArray = [];
var udonArray = [];
var nowScore = 0;
var totalSec = 0;
var randomSeed = 3557;
var randomMode = Boolean(0);

const stageUdonNumTbl = [
    1,
    2,
    3,
    4,
    5,
    6,
    7,
    8,
    9,
    10,
];
const stageEnemyNumTbl = [
    2,
    4,
    6,
    8,
    10,
    11,
    12,
    13,
    13,
    13,
];

tm.main(function () {
    // アプリケーションクラスを生成
    var app = tm.display.CanvasApp("#world");
    app.resize(SCREEN_WIDTH, SCREEN_HEIGHT);    // サイズ(解像度)設定
    app.fitWindow();                            // 自動フィッティング有効
    app.background = "rgba(77, 136, 255, 1.0)"; // 背景色
    app.fps = FPS;                               // フレーム数

    var loading = tm.ui.LoadingScene({
        assets: ASSETS,
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
    });

    // 読み込み完了後に呼ばれるメソッドを登録
    loading.onload = function () {
        app.replaceScene(LogoScene());
    };

    // ローディングシーンに入れ替える
    app.replaceScene(loading);

    // 実行
    app.run();
});

/*
 * ロゴ
 */
tm.define("LogoScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();
        this.fromJSON({
            children: [
                {
                    type: "Label", name: "logoLabel",
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y,
                    fillStyle: "#888",
                    fontSize: 64,
                    fontFamily: FONT_FAMILY,
                    text: "UNOFFICIAL GAME",
                    align: "center",
                },
            ]
        });
        this.localTimer = 0;
    },

    update: function (app) {
        // 時間が来たらタイトルへ
        //        if (++this.localTimer >= 5 * app.fps)
        this.app.replaceScene(TitleScene());
    }
});

/*
 * タイトル
 */
tm.define("TitleScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();
        this.fromJSON({
            children: [
                {
                    type: "Label", name: "titleLabel",
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y,
                    fillStyle: "#fff",
                    fontSize: 64,
                    fontFamily: FONT_FAMILY,
                    text: "ZG-ZG SPTNK",
                    align: "center",
                },
                {
                    type: "FlatButton", name: "startButton",
                    init: [
                        {
                            text: "START",
                            fontFamily: FONT_FAMILY,
                            fontSize: 32,
                            bgColor: "hsl(240, 0%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y + 128,
                },
                {
                    type: "FlatButton", name: "randomModeButton",
                    init: [
                        {
                            text: "RANDOM",
                            fontFamily: FONT_FAMILY,
                            fontSize: 32,
                            bgColor: "hsl(240, 0%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y + 256,
                    alpha: 0.0,
                },
            ]
        });

        this.localTimer = 0;
        var randomModeStr = localStorage.getItem("rmEnable");
        if (randomModeStr === null) {
            this.randomModeButton.sleep();
        } else if (randomModeStr === "0") {
            this.randomModeButton.sleep();
        } else {
            this.randomModeButton.setAlpha(1, 0);
            this.randomModeButton.wakeUp();
        }

        var self = this;
        this.startButton.onpointingstart = function () {
            randomMode = Boolean(0);
            stageTimer = 0;
            self.app.replaceScene(GameScene());
        };

        this.randomModeButton.onpointingstart = function () {
            randomMode = Boolean(1);
            stageTimer = 90 * FPS;
            self.app.replaceScene(GameScene());
        };
    },

    update: function (app) {
        app.background = "rgba(0, 0, 0, 1.0)"; // 背景色
        // 時間が来たらデモへ
        //        if(++this.localTimer >= 5*app.fps){
        //            this.app.replaceScene(DemoScene());
        //        }
    }
});

/*
 * デモ
 */
tm.define("DemoScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();
        this.fromJSON({
            children: [
                {
                    type: "Label", name: "demoLabel",
                    x: SCREEN_CENTER_X,
                    y: 320,
                    fillStyle: "#888",
                    fontSize: 64,
                    fontFamily: FONT_FAMILY,
                    text: "",
                    align: "center",
                },
            ]
        });
        this.localTimer = 0;
    },

    update: function (app) {
        // 時間が来たらタイトルへ
        if (++this.localTimer >= 5 * app.fps) {
            this.app.replaceScene(TitleScene());
        }

        // タッチしたらタイトルへ
        var pointing = app.pointing;
        // タッチしているかを判定
        if (pointing.getPointing()) {
            this.app.replaceScene(TitleScene());
        }
    }
});

/*
 * ゲーム
 */
tm.define("GameScene", {
    superClass: "tm.app.Scene",

    init: function () {
        this.superInit();

        group0 = tm.display.CanvasElement().addChildTo(this);
        group1 = tm.display.CanvasElement().addChildTo(this);
        group2 = tm.display.CanvasElement().addChildTo(this);

        this.bgBack0 = tm.display.Sprite("bg_b", SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(group0);
        this.bgBack0.setPosition(bgX, bgBackY);
        this.bgBack1 = tm.display.Sprite("bg_b", SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(group0);
        this.bgBack1.setPosition(bgX, bgBackY - SCREEN_CENTER_Y);

        this.bgMiddle0 = tm.display.Sprite("bg_m", SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(group0);
        this.bgMiddle0.setPosition(bgX, bgMiddleY);
        this.bgMiddle1 = tm.display.Sprite("bg_m", SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(group0);
        this.bgMiddle1.setPosition(bgX, bgMiddleY - SCREEN_CENTER_Y);

        this.bgFront0 = tm.display.Sprite("bg_f", SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(group0);
        this.bgFront0.setPosition(bgX, bgFrontY);
        this.bgFront1 = tm.display.Sprite("bg_f", SCREEN_WIDTH, SCREEN_HEIGHT).addChildTo(group0);
        this.bgFront1.setPosition(bgX, bgFrontY - SCREEN_CENTER_Y);

        clearArrays();
        player = new Player().addChildTo(group2);

        this.fromJSON({
            children: [
                {
                    type: "Label", name: "initStageNumLabel",
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y - 128,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 128,
                    fontFamily: FONT_FAMILY,
                    text: "STAGE\n\n1",
                    align: "center",
                },
                {
                    type: "Label", name: "scoreStrLabel",
                    x: SCREEN_WIDTH - 16,
                    y: 32,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 32,
                    fontFamily: FONT_FAMILY,
                    text: "SCORE",
                    align: "right",
                },
                {
                    type: "Label", name: "nowScoreLabel",
                    x: SCREEN_WIDTH - 16,
                    y: 64,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 32,
                    fontFamily: FONT_FAMILY,
                    text: "0",
                    align: "right",
                },
                {
                    type: "Label", name: "timeStrLabel",
                    x: SCREEN_CENTER_X,
                    y: 32,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 32,
                    fontFamily: FONT_FAMILY,
                    text: "TIME",
                    align: "center",
                },
                {
                    type: "Label", name: "nowStageTimerLabel",
                    x: SCREEN_CENTER_X,
                    y: 96,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 64,
                    fontFamily: FONT_FAMILY,
                    text: "0",
                    align: "center",
                },
                {
                    type: "Label", name: "nowStageNumStrLabel",
                    x: 0 + 16,
                    y: 32,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 32,
                    fontFamily: FONT_FAMILY,
                    text: "STAGE",
                    align: "left",
                },
                {
                    type: "Label", name: "nowStageNumLabel",
                    x: 0 + 16,
                    y: 64,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 32,
                    fontFamily: FONT_FAMILY,
                    text: "1",
                    align: "left",
                },
                {
                    type: "Label", name: "gameOverLabel",
                    x: SCREEN_CENTER_X,
                    y: SCREEN_CENTER_Y / 2,
                    fillStyle: "#fff",
                    shadowColor: "#000",
                    shadowBlur: 10,
                    fontSize: 64,
                    fontFamily: FONT_FAMILY,
                    text: "GAME OVER",
                    align: "center",
                },
                {
                    type: "FlatButton", name: "tweetButton",
                    init: [
                        {
                            text: "TWEET",
                            fontFamily: FONT_FAMILY,
                            fontSize: 32,
                            bgColor: "hsl(240, 80%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X - 160,
                    y: SCREEN_CENTER_Y + (SCREEN_CENTER_Y / 2),
                    alpha: 0.0,
                },
                {
                    type: "FlatButton", name: "restartButton",
                    init: [
                        {
                            text: "RESTART",
                            fontFamily: FONT_FAMILY,
                            fontSize: 32,
                            cornerRadius: 8,
                            bgColor: "hsl(240, 0%, 70%)",
                        }
                    ],
                    x: SCREEN_CENTER_X + 160,
                    y: SCREEN_CENTER_Y + (SCREEN_CENTER_Y / 2),
                    alpha: 0.0,
                },
            ]
        });

        this.gameOverLabel.setAlpha(0.0);
        this.tweetButton.sleep();
        this.restartButton.sleep();

        var self = this;
        this.restartButton.onpointingstart = function () {
            self.app.replaceScene(GameScene());
            if (randomMode) stageTimer = 90 * FPS;
            else stageTimer = 0;
        };

        this.buttonAlpha = 0.0;
        if (!randomMode) randomSeed = 3557;
        nowScore = 0;
        stageInitTimer = 0;
        stageNum = 0;
        this.frame = 0;
        this.stopBGM = false;
    },

    onpointingstart: function () {
        if (player.status.isDead) return;

        if (!player.status.isStart) {
        } else if (player.status === PL_STATUS.ROTATION) {
            player.status = PL_STATUS.MOVE;
            jumpSE.play();
            stageTimer -= 60;
        }
    },

    onpointingend: function () {
        if (player.status.isDead) return;

        if (!player.status.isStart) {
        } else if (player.status === PL_STATUS.MOVE) {
            player.status = PL_STATUS.ROTATION;
            if (--player.consecutiveHitStatus <= 0) {
                player.consecutiveHitStatus = 0;
                player.consecutiveHitCounter = 0;
            }
        }
    },

    update: function (app) {

        if (!player.status.isDead) {
            // 背景１スクロール
            bgBackY += 2;
            if (bgBackY > SCREEN_HEIGHT / 2) bgBackY = -SCREEN_HEIGHT / 2;
            this.bgBack0.setPosition(bgX, bgBackY);
            this.bgBack1.setPosition(bgX, bgBackY + SCREEN_HEIGHT);

            bgMiddleY += 4;
            if (bgMiddleY > SCREEN_HEIGHT / 2) bgMiddleY = -SCREEN_HEIGHT / 2;
            this.bgMiddle0.setPosition(bgX, bgMiddleY);
            this.bgMiddle1.setPosition(bgX, bgMiddleY + SCREEN_HEIGHT);

            bgFrontY += 6;
            if (bgFrontY > SCREEN_HEIGHT / 2) bgFrontY = -SCREEN_HEIGHT / 2;
            this.bgFront0.setPosition(bgX, bgFrontY);
            this.bgFront1.setPosition(bgX, bgFrontY + SCREEN_HEIGHT);
        }

        if (player.status === PL_STATUS.INIT) {
            if (stageInitTimer === 0) {
                var tmpStageNum = stageNum;
                if (randomMode) tmpStageNum += 10;
                stageNum++;
                stageTimer += 30 * app.fps + 1;
                this.initStageNumLabel.text = "STAGE\n\n" + stageNum;
                this.initStageNumLabel.setAlpha(1.0);
                this.nowScoreLabel.text = nowScore;
                this.nowStageTimerLabel.text = Math.floor(stageTimer / app.fps);
                this.nowStageNumLabel.text = stageNum;

                // プレイヤーをリセット
                player.x = SCREEN_CENTER_X;
                player.y = SCREEN_CENTER_Y;
                player.zRot = 0;
                player.rotation = 0;
                if (tmpStageNum >= 10) {
                    player.zRotOfs += 0.25;
                    if (player.zRotOfs >= 4) player.zRotOfs = 4;
                    player.spd += 0.25;
                    if (player.spd >= 15.0) player.spd = 15.0;
                }
                player.consecutiveHitStatus = 0;
                player.consecutiveHitCounter = 0;

                // 一旦クリア
                clearArrays();
                // ステージ数に応じたうどんの数を配置
                stageUdonNum = 0;
                var tmpIdx = tmpStageNum;
                if (tmpStageNum >= stageUdonNumTbl.length) tmpIdx = stageUdonNumTbl.length - 1;
                for (var ii = 0; ii < stageUdonNumTbl[tmpIdx]; ii++) {
                    for (; ;) {
                        var tmpX = myRandom(0 + 192, SCREEN_WIDTH - 192);
                        var tmpY = myRandom(0 + 192, SCREEN_HEIGHT - 192);
                        // プレイヤーと接触してたらやり直し
                        if (calcDist(player.x, player.y, tmpX, tmpY) < 256) continue;
                        // 既存のうどんと接触してたらやり直し
                        var isExist = false;
                        for (var jj = udonArray.length - 1; jj >= 0; jj--) {
                            var tmpObj = udonArray[jj];
                            if (tmpObj.parent === null) continue;
                            if (calcDist(tmpObj.x, tmpObj.y, tmpX, tmpY) < 128) {
                                isExist = true;
                                break;
                            }
                        }
                        if (isExist) continue;
                        var tmpUdon = Udon(tmpX, tmpY);
                        tmpUdon.addChildTo(group1);
                        udonArray.push(tmpUdon);
                        stageUdonNum++;
                        break;
                    }
                }
                // ステージ数に応じた敵の数を配置
                tmpIdx = tmpStageNum;
                if (tmpStageNum >= stageEnemyNumTbl.length) tmpIdx = stageEnemyNumTbl.length - 1;
                for (var ii = 0; ii < stageEnemyNumTbl[tmpIdx]; ii++) {
                    for (; ;) {
                        var tmpX = myRandom(0 + 192, SCREEN_WIDTH - 192);
                        var tmpY = myRandom(0 + 192, SCREEN_HEIGHT - 192);
                        // プレイヤーと接触してたらやり直し
                        if (calcDist(player.x, player.y, tmpX, tmpY) < 256) continue;
                        // 既存のうどんと接触してたらやり直し
                        var isExist = false;
                        for (var jj = udonArray.length - 1; jj >= 0; jj--) {
                            var tmpObj = udonArray[jj];
                            if (tmpObj.parent === null) continue;
                            if (calcDist(tmpObj.x, tmpObj.y, tmpX, tmpY) < 128) {
                                isExist = true;
                                break;
                            }
                        }
                        if (isExist) continue;
                        // 既存の敵と接触してたらやり直し
                        for (var jj = enemyArray.length - 1; jj >= 0; jj--) {
                            var tmpObj = enemyArray[jj];
                            if (tmpObj.parent === null) continue;
                            if (calcDist(tmpObj.x, tmpObj.y, tmpX, tmpY) < 128) {
                                isExist = true;
                                break;
                            }
                        }
                        if (isExist) continue;

                        var tmpEnemy = Enemy(tmpX, tmpY, 0, 0);
                        tmpEnemy.addChildTo(group1);
                        enemyArray.push(tmpEnemy);
                        break;
                    }
                }
            }
            if (++stageInitTimer > 1 * app.fps) {
                stageInitTimer = 0;
                player.status = PL_STATUS.ROTATION;
                this.initStageNumLabel.setAlpha(0.0);
            }
            return;
        }

        if (!player.status.isDead) {
            if (player.status.isStart) {
                this.frame++;
                stageTimer--;
            }
            if (stageTimer < 0) {
                stageTimer = 0;
                player.status = PL_STATUS.DEAD;
            }
            this.nowScoreLabel.text = nowScore;
            this.nowStageTimerLabel.text = Math.floor(stageTimer / app.fps);
        } else {
            if (!this.stopBGM) {
                fallSE.play();
                this.stopBGM = true;

                var self = this;
                // tweet ボタン
                var rmStr = "";
                if (randomMode) rmStr = "(RANDOM)"
                this.tweetButton.onclick = function () {
                    var twitterURL = tm.social.Twitter.createURL({
                        type: "tweet",
                        text: "ZG-ZG SPTNK" + rmStr + "　スコア: " + self.nowScoreLabel.text + "　ステージ：" + stageNum,
                        hashtags: ["ネムレス", "NEMLESSS"],
                        url: "https://iwasaku.github.io/test6/ZGZG/",
                    });
                    window.open(twitterURL);
                };
                // 10面以上クリアでRANDOMモード開放
                if (stageNum >= 11) {
                    localStorage.setItem("rmEnable", "1");
                }
            }

            this.buttonAlpha += 0.05;
            if (this.buttonAlpha > 1.0) {
                this.buttonAlpha = 1.0;
            }
            this.gameOverLabel.setAlpha(this.buttonAlpha);
            this.tweetButton.setAlpha(this.buttonAlpha);
            this.restartButton.setAlpha(this.buttonAlpha);
            if (this.buttonAlpha > 0.7) {
                this.tweetButton.wakeUp();
                this.restartButton.wakeUp();
            }
        }
    }
});

/*
 * Player
 */
tm.define("Player", {
    superClass: "tm.app.Sprite",

    init: function () {
        this.superInit("player", 128, 128);
        this.direct = '';
        this.zRot = 0;
        this.zRotOfs = 0;
        this.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y).setScale(1, 1);
        this.setInteractive(false);
        this.setBoundingType("circle");
        this.radius = 16;
        this.spd = 10.0;
        this.consecutiveHitStatus = 0;
        this.consecutiveHitCounter = 0;
        this.status = PL_STATUS.INIT;
    },

    update: function (app) {
        if (this.status === PL_STATUS.INIT) return;
        if (this.status === PL_STATUS.DEAD) return;
        if (this.status === PL_STATUS.ROTATION) {
            this.zRot += 5 + this.zRotOfs;
        };
        if (this.status === PL_STATUS.MOVE) {
            this.x -= Math.floor(this.spd * Math.cos(this.zRot / 180 * Math.PI));
            this.y -= Math.floor(this.spd * Math.sin(this.zRot / 180 * Math.PI));

            if (this.x < 0 - 60) this.x = SCREEN_WIDTH + 60;
            if (this.x > SCREEN_WIDTH + 60) this.x = 0 - 60;
            if (this.y < 0 - 60) this.y = SCREEN_HEIGHT + 60;
            if (this.y > SCREEN_HEIGHT + 60) this.y = 0 - 60;
        };
        this.rotation = this.zRot;
    },
});

/*
 * うどん
 */
tm.define("Udon", {
    superClass: "tm.app.Sprite",

    init: function (posX, posY) {
        this.spriteName = "udon";
        this.superInit(this.spriteName, 128, 128);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("circle");
        this.radius = 128;
        this.vec = tm.geom.Vector2(0, 0);
        this.setPosition(posX, posY).setScale(1, 1);
    },

    update: function (app) {
        if (player.status.isDead) return;

        this.position.add(this.vec);

        if (this.x < 0 - 64) this.x = SCREEN_WIDTH + 64;
        if (this.x > SCREEN_WIDTH + 64) this.x = 0 - 64;
        if (this.y < 0 - 64) this.y = SCREEN_HEIGHT + 64;
        if (this.y > SCREEN_HEIGHT + 64) this.y = 0 - 64;

        // 自機との衝突判定
        if (this.isHitElement(player)) {
            coinSE.play();
            var pnt = 2 ** player.consecutiveHitCounter;   // 1 2 4 8 16 32;
            nowScore += pnt
            console.log("s=" + player.consecutiveHitStatus + " p=" + pnt);
            if (randomMode) stageTimer += 30;
            else if (pnt > 1) stageTimer += 30;
            player.consecutiveHitCounter++;
            player.consecutiveHitStatus = 2;
            if (--stageUdonNum <= 0) {
                player.status = PL_STATUS.INIT;
                nowScore += Math.floor((stageTimer / app.fps) / 10.0);  // クリアボーナス
            }

            this.remove();
        }
    },
});

/*
 * Enemey
 */
tm.define("Enemy", {
    superClass: "tm.app.Sprite",

    init: function (posX, posY, spdX, spdY) {
        this.spriteName = "enemy";
        this.superInit(this.spriteName, 128, 128);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("circle");
        this.radius = 80;
        this.vec = tm.geom.Vector2(spdX, spdY);
        this.setPosition(posX, posY).setScale(1, 1);
        this.zRot = (Math.random() * 5) - 2; // ゲームに影響しないのでMath.random()を使う
    },

    update: function (app) {
        if (player.status.isDead) return;

        this.position.add(this.vec);

        if (this.x < 0 - 64) this.x = SCREEN_WIDTH + 64;
        if (this.x > SCREEN_WIDTH + 64) this.x = 0 - 64;
        if (this.y < 0 - 64) this.y = SCREEN_HEIGHT + 64;
        if (this.y > SCREEN_HEIGHT + 64) this.y = 0 - 64;

        this.rotation += this.zRot;

        // 自機との衝突判定
        if (this.isHitElement(player)) {
            player.status = PL_STATUS.DEAD;
        }
    },
});

function clearArrays() {
    var self = this;

    for (var ii = self.enemyArray.length - 1; ii >= 0; ii--) {
        var tmp = self.enemyArray[ii];
        if (tmp.parent === null) console.log("NULL!!");
        else tmp.remove();
        self.enemyArray.erase(tmp);
    }

    for (var ii = self.udonArray.length - 1; ii >= 0; ii--) {
        var tmp = self.udonArray[ii];
        if (tmp.parent === null) console.log("NULL!!");
        else tmp.remove();
        self.udonArray.erase(tmp);
    }
}

// 指定の範囲で乱数を求める
// ※start < end
// ※startとendを含む
function myRandom(start, end) {
    if (randomMode) {
        var max = (end - start) + 1;
        return Math.floor(Math.random() * Math.floor(max)) + start;
    } else {
        var mod = (end - start) + 1;
        randomSeed = (randomSeed * 5) + 1;
        for (; ;) {
            if (randomSeed < 2147483647) break;
            randomSeed -= 2147483647;
        }
        return (randomSeed % mod) + start;
    }
}

// ２点間の距離を求める
function calcDist(aX, aY, bX, bY) {
    return Math.sqrt(Math.pow(aX - bX, 2) + Math.pow(aY - bY, 2));
}
