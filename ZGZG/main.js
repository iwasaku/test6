phina.globalize();

console.log = function () { };  // ログを出す時にはコメントアウトする

var FPS = 60;  // 60フレ

var SCREEN_WIDTH = 1080;              // スクリーン幅
var SCREEN_HEIGHT = 1920;              // スクリーン高さ
var SCREEN_CENTER_X = SCREEN_WIDTH / 2;   // スクリーン幅の半分
var SCREEN_CENTER_Y = SCREEN_HEIGHT / 2;  // スクリーン高さの半分

var FONT_FAMILY = "'Press Start 2P','Meiryo',sans-serif";
var ASSETS = {
    image: {
        "player": "./resource/utena_128.png",

        "udon": "./resource/udon.png",
        "enemy": "./resource/planet_128.png",

        "bg_f": "./resource/bg_front.png",
        "bg_m": "./resource/bg_middle.png",
        "bg_b": "./resource/bg_back.png",
    },
    sound: {
        "fall_se": 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/fall.mp3?20200708',
        "coin_se": 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/coin05.mp3',
        "jump_se": 'https://iwasaku.github.io/test7/NEMLESSSTER/resource/jump.mp3',
    }
};

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

var group0 = null;
var group1 = null;
var group2 = null;
var group3 = null;
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

// 共有ボタン用
let postText = null;
const postURL = "https://iwasaku.github.io/test6/ZGZG/";
const postTags = "#ネムレス #NEMLESSS";

phina.main(function () {
    var app = GameApp({
        startLabel: 'logo',
        width: SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        assets: ASSETS,
        backgroundColor: 'black',
        fps: FPS,

        // シーンのリストを引数で渡す
        scenes: [
            {
                className: 'LogoScene',
                label: 'logo',
                nextLabel: 'title',
            },

            {
                className: 'TitleScene',
                label: 'title',
                nextLabel: 'game',
            },
            {
                className: 'GameScene',
                label: 'game',
                nextLabel: 'game',
            },
        ]
    });

    // iOSなどでユーザー操作がないと音がならない仕様対策
    // 起動後初めて画面をタッチした時に『無音』を鳴らす
    app.domElement.addEventListener('touchend', function dummy() {
        var s = phina.asset.Sound();
        s.loadFromBuffer();
        s.play().stop();
        app.domElement.removeEventListener('touchend', dummy);
    });

    // fps表示
    //app.enableStats();

    // 実行
    app.run();
});

/*
* ローディング画面をオーバーライド
*/
phina.define('LoadingScene', {
    superClass: 'DisplayScene',

    init: function (options) {
        this.superInit(options);
        // 背景色

        var self = this;
        var loader = phina.asset.AssetLoader();

        // 明滅するラベル
        let label = phina.display.Label({
            text: "",
            fontSize: 64,
            fill: 'white',
        }).addChildTo(this).setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y);

        // ロードが進行したときの処理
        loader.onprogress = function (e) {
            // 進捗具合を％で表示する
            label.text = "{0}%".format((e.progress * 100).toFixed(0));
        };

        // ローダーによるロード完了ハンドラ
        loader.onload = function () {
            // Appコアにロード完了を伝える（==次のSceneへ移行）
            self.flare('loaded');
        };

        // ロード開始
        loader.load(options.assets);
    },

});

/*
 * ロゴ
 */
phina.define("LogoScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);
        this.localTimer = 0;
        this.font1 = false;
        this.font2 = false;
    },

    update: function (app) {
        // フォントロード完了待ち
        var self = this;
        document.fonts.load('10pt "Press Start 2P"').then(function () {
            self.font1 = true;
        });
        document.fonts.load('10pt "icomoon"').then(function () {
            self.font2 = true;
        });
        if (this.font1 && this.font2) {
            self.exit();
        }
    }
});

/*
 * タイトル
 */
phina.define("TitleScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);

        this.titleLabel = Label({
            text: "ZG-ZG SPTNK",
            fontSize: 64,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y,
        }).addChildTo(this);

        this.startButton = Button({
            text: "START",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fill: "hsl(240, 0%, 70%)",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 128,
            cornerRadius: 8,
        }).addChildTo(this);
        this.randomModeButton = Button({
            text: "RANDOM",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fill: "hsl(240, 0%, 70%)",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y + 256,
            cornerRadius: 8,
        }).addChildTo(this);
        this.randomModeButton.alpha = 0.0;

        this.localTimer = 0;

        var randomModeStr = localStorage.getItem("rmEnable");
        if (randomModeStr === null) {
            this.randomModeButton.sleep();
        } else if (randomModeStr === "0") {
            this.randomModeButton.sleep();
        } else {
            this.randomModeButton.alpha = 1.0;
            this.randomModeButton.wakeUp();
        }

        var self = this;
        this.startButton.onpointstart = function () {
            randomMode = Boolean(0);
            stageTimer = 0;
            self.exit();
        };

        this.randomModeButton.onpointstart = function () {
            randomMode = Boolean(1);
            stageTimer = 90 * FPS;
            self.exit();
        };
    },

    update: function (app) {
    }
});

/*
 * ゲーム
 */
phina.define("GameScene", {
    superClass: 'DisplayScene',

    init: function (option) {
        this.superInit(option);

        group0 = DisplayElement().addChildTo(this);
        group1 = DisplayElement().addChildTo(this);
        group2 = DisplayElement().addChildTo(this);
        group3 = DisplayElement().addChildTo(this);

        this.bgBack0 = phina.display.Sprite("bg_b").addChildTo(group0);
        this.bgBack0.setPosition(bgX, bgBackY).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        this.bgBack1 = phina.display.Sprite("bg_b").addChildTo(group0);
        this.bgBack1.setPosition(bgX, bgBackY - SCREEN_CENTER_Y).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

        this.bgMiddle0 = phina.display.Sprite("bg_m").addChildTo(group0);
        this.bgMiddle0.setPosition(bgX, bgMiddleY).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        this.bgMiddle1 = phina.display.Sprite("bg_m").addChildTo(group0);
        this.bgMiddle1.setPosition(bgX, bgMiddleY - SCREEN_CENTER_Y).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

        this.bgFront0 = phina.display.Sprite("bg_f").addChildTo(group0);
        this.bgFront0.setPosition(bgX, bgFrontY).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);
        this.bgFront1 = phina.display.Sprite("bg_f").addChildTo(group0);
        this.bgFront1.setPosition(bgX, bgFrontY - SCREEN_CENTER_Y).setSize(SCREEN_WIDTH, SCREEN_HEIGHT);

        clearArrays();
        player = new Player().addChildTo(group2);

        this.initStageNumLabel = Label({
            text: "STAGE\n\n1",
            fontSize: 128,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y - 128,
        }).addChildTo(group3);
        this.scoreStrLabel = Label({
            text: "SCORE",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            align: "right",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_WIDTH - 16,
            y: 32,
        }).addChildTo(group3);
        this.nowScoreLabel = Label({
            text: "0",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            align: "right",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_WIDTH - 16,
            y: 64,
        }).addChildTo(group3);
        this.timeStrLabel = Label({
            text: "TIME",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: 32,
        }).addChildTo(group3);
        this.nowStageTimerLabel = Label({
            text: "0",
            fontSize: 64,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: 96,
        }).addChildTo(group3);
        this.nowStageNumStrLabel = Label({
            text: "STAGE",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            align: "left",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: 0 + 16,
            y: 32,
        }).addChildTo(group3);
        this.nowStageNumLabel = Label({
            text: "1",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            align: "left",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: 0 + 16,
            y: 64,
        }).addChildTo(group3);
        this.gameOverLabel = Label({
            text: "GAME OVER",
            fontSize: 64,
            fontFamily: FONT_FAMILY,
            align: "center",
            fill: "#fff",
            shadow: "#000",
            shadowBlur: 10,
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y / 2,
        }).addChildTo(group3);

        this.screenButton = Button({
            text: "",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fill: "#fff",
            x: SCREEN_CENTER_X,
            y: SCREEN_CENTER_Y,
            width: SCREEN_WIDTH,
            height: SCREEN_HEIGHT,
        }).addChildTo(group2)

        // X
        this.xButton = Button({
            text: String.fromCharCode(0xe902),
            fontSize: 32,
            fontFamily: "icomoon",
            fill: "#7575EF",
            x: SCREEN_CENTER_X - 160 - 80,
            y: SCREEN_CENTER_Y + (SCREEN_CENTER_Y / 2),
            cornerRadius: 8,
            width: 60,
            height: 60,
        }).addChildTo(group3);
        this.xButton.onclick = function () {
            // https://developer.x.com/en/docs/twitter-for-websites/tweet-button/guides/web-intent
            let shareURL = "https://x.com/intent/tweet?text=" + encodeURIComponent(postText + "\n" + postTags + "\n") + "&url=" + encodeURIComponent(postURL);
            window.open(shareURL);
        };
        this.xButton.alpha = 0.0;
        this.xButton.sleep();

        // threads
        this.threadsButton = Button({
            text: String.fromCharCode(0xe901),
            fontSize: 32,
            fontFamily: "icomoon",
            fill: "#7575EF",
            x: SCREEN_CENTER_X - 160,
            y: SCREEN_CENTER_Y + (SCREEN_CENTER_Y / 2),
            cornerRadius: 8,
            width: 60,
            height: 60,
        }).addChildTo(group3);
        this.threadsButton.onclick = function () {
            // https://developers.facebook.com/docs/threads/threads-web-intents/
            // web intentでのハッシュタグの扱いが環境（ブラウザ、iOS、Android）によって違いすぎるので『#』を削って通常の文字列にしておく
            let shareURL = "https://www.threads.net/intent/post?text=" + encodeURIComponent(postText + "\n\n" + postTags.replace(/#/g, "")) + "&url=" + encodeURIComponent(postURL);
            window.open(shareURL);
        };
        this.threadsButton.alpha = 0.0;
        this.threadsButton.sleep();

        // bluesky
        this.bskyButton = Button({
            text: String.fromCharCode(0xe900),
            fontSize: 32,
            fontFamily: "icomoon",
            fill: "#7575EF",
            x: SCREEN_CENTER_X - 160 + 80,
            y: SCREEN_CENTER_Y + (SCREEN_CENTER_Y / 2),
            cornerRadius: 8,
            width: 60,
            height: 60,
        }).addChildTo(group3);
        this.bskyButton.onclick = function () {
            // https://docs.bsky.app/docs/advanced-guides/intent-links
            let shareURL = "https://bsky.app/intent/compose?text=" + encodeURIComponent((postText + "\n" + postTags + "\n" + postURL));
            window.open(shareURL);
        };
        this.bskyButton.alpha = 0.0;
        this.bskyButton.sleep();

        this.restartButton = Button({
            text: "RESTART",
            fontSize: 32,
            fontFamily: FONT_FAMILY,
            fill: "#B2B2B2",
            x: SCREEN_CENTER_X + 160,
            y: SCREEN_CENTER_Y + (SCREEN_CENTER_Y / 2),
            cornerRadius: 8,
            width: 240,
            height: 60,
        }).addChildTo(group3);

        this.gameOverLabel.alpha = 0.0;
        this.screenButton.alpha = 0.0;
        this.restartButton.alpha = 0.0;
        this.restartButton.sleep();

        this.screenButton.onpointstart = function () {
            if (player.status.isDead) return;

            if (!player.status.isStart) {
            } else if (player.status === PL_STATUS.ROTATION) {
                player.status = PL_STATUS.MOVE;
                SoundManager.play("jump_se");
                stageTimer -= 60;
            }
        };
        this.screenButton.onpointend = function () {
            if (player.status.isDead) return;

            if (!player.status.isStart) {
            } else if (player.status === PL_STATUS.MOVE) {
                player.status = PL_STATUS.ROTATION;
                if (--player.consecutiveHitStatus <= 0) {
                    player.consecutiveHitStatus = 0;
                    player.consecutiveHitCounter = 0;
                }
            }
        };
        var self = this;
        this.restartButton.onpointstart = function () {
            if (randomMode) stageTimer = 90 * FPS;
            else stageTimer = 0;
            self.exit();
        };

        this.buttonAlpha = 0.0;
        if (!randomMode) randomSeed = 3557;
        nowScore = 0;
        stageInitTimer = 0;
        stageNum = 0;
        this.frame = 0;
        this.stopBGM = false;
    },

    update: function (app) {

        if (!player.status.isDead) {
            // 背景スクロール
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
                this.initStageNumLabel.alpha = 1.0;
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
                this.initStageNumLabel.alpha = 0.0;
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
                SoundManager.play("fall_se");
                this.stopBGM = true;

                let rmStr = "";
                if (randomMode) rmStr = "(RANDOM)"
                postText = "ZG-ZG SPTNK" + rmStr + "\nスコア: " + this.nowScoreLabel.text + "\nステージ：" + stageNum;

                // 10面以上クリアでRANDOMモード開放
                if (stageNum >= 11) {
                    localStorage.setItem("rmEnable", "1");
                }
            }

            this.buttonAlpha += 0.05;
            if (this.buttonAlpha > 1.0) {
                this.buttonAlpha = 1.0;
            }
            this.gameOverLabel.alpha = this.buttonAlpha;
            this.xButton.alpha = this.buttonAlpha;
            this.threadsButton.alpha = this.buttonAlpha;
            this.bskyButton.alpha = this.buttonAlpha;
            this.restartButton.alpha = this.buttonAlpha;
            if (this.buttonAlpha > 0.7) {
                this.xButton.wakeUp();
                this.threadsButton.wakeUp();
                this.bskyButton.wakeUp();
                this.restartButton.wakeUp();
            }
        }
    }
});

/*
 * Player
 */
phina.define("Player", {
    superClass: "Sprite",

    init: function (option) {
        this.superInit("player");
        this.direct = '';
        this.zRot = 0;
        this.zRotOfs = 0;
        this.setPosition(SCREEN_CENTER_X, SCREEN_CENTER_Y).setSize(128, 128).setScale(1, 1);
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
phina.define("Udon", {
    superClass: "Sprite",

    init: function (posX, posY) {
        this.spriteName = "udon";
        this.superInit(this.spriteName);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("circle");
        this.radius = 64;
        this.vec = phina.geom.Vector2(0, 0);
        this.setPosition(posX, posY).setSize(128, 128).setScale(1, 1);
    },

    update: function (app) {
        if (player.status.isDead) return;

        this.position.add(this.vec);

        if (this.x < 0 - 64) this.x = SCREEN_WIDTH + 64;
        if (this.x > SCREEN_WIDTH + 64) this.x = 0 - 64;
        if (this.y < 0 - 64) this.y = SCREEN_HEIGHT + 64;
        if (this.y > SCREEN_HEIGHT + 64) this.y = 0 - 64;

        // 自機との衝突判定
        if (this.hitTestElement(player)) {
            SoundManager.play("coin_se");
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
 * Enemy
 */
phina.define("Enemy", {
    superClass: "Sprite",

    init: function (posX, posY, spdX, spdY) {
        this.spriteName = "enemy";
        this.superInit(this.spriteName);
        this.direct = '';
        this.setInteractive(false);
        this.setBoundingType("circle");
        this.radius = 64;
        this.vec = phina.geom.Vector2(spdX, spdY);
        this.setPosition(posX, posY).setSize(128, 128).setScale(1, 1);
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
        if (this.hitTestElement(player)) {
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
