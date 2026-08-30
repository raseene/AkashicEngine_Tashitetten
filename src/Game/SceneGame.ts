
import { instanceStorage } from "@akashic-extension/instance-storage";

import * as sys from "../sys";
import { Panel } from "./Panel";
import { NumSprite, NumSpriteUp } from "./NumSprite";


/******************
    ゲームモード
 ******************/
export const enum Mode
{
	RANKING,			// ランキング
	SINGLE,				// シングル
	SINGLE_REPLAY,
}

/**************
    定数定義
 **************/
export const enum Def
{
	FIELD_W		= 6,			// フィールドの大きさ
	FIELD_H		= FIELD_W,

	PANEL_W		= 64,			// パネルの大きさ
	PANEL_H		= PANEL_W,
	FIELD_X		= 396,			// フィールド位置
	FIELD_Y		= 122,

	SCORE_X		= 108,			// スコア表示位置
	SCORE_Y		= 240,
	HI_SCORE_X	= SCORE_X,		// ハイスコア表示位置
	HI_SCORE_Y	= 110,
	ROUND_X		= SCORE_X,		// ラウンド数表示位置
	ROUND_Y		= 392,

	TIME_X		= 792,			// 残り時間表示位置
	TIME_Y		= 128,
	TOTAL_X		= 820,			// 総和表示位置
	TOTAL_Y		= 280,
	LEFT_X		= 840,			// 残り解数表示位置
	LEFT_Y		= 392,
}

/**********
    状態
 **********/
const enum Phase
{
	INFORMATION,		// 遊び方説明
	READY,				// ゲーム開始
	GAME,				// ゲーム中
	OVER,				// 終了
}

/**********
    画像
 **********/
export const enum Image
{
	PARTS,				// パーツ
	MESSAGE,			// メッセージ
}

/********
    SE
 ********/
export const enum SE
{
	CLICK,				// クリック
	COUNT,				// カウントダウン
	SELECT,				// 数字選択
	MATCH,				// 揃った
	MISS,				// 超過
	REPLACE,			// 入れ替え
	CHAIM,				// 終了のチャイム
}


/******************
    ゲームメイン
 ******************/
export class SceneGame extends sys.Scene
{
	static readonly	SAVE_DATA: string = 'TashitettenSCORE';		// セーブデータ名

	private		mode: Mode;							// ゲームモード
	private		phase: Phase;						// 状態
	private		cnt: number;						// 汎用カウンタ

	private		field: g.E;							// フィールド
	private		panel: Panel[][];					// パネル
	private		current_panel: Panel[];				// 選択中
	private		current_x: number;
	private		current_y: number;
	private		correct_route: Panel[];				// 正解例
	private		replace_cnt: number;				// 入れ替えカウンタ
	private		hint_cnt: number;					// ヒント提示

	private		spr_total_number: NumSprite;		// 総和
	private		spr_total_base: g.Pane;
	private		spr_total_color: g.FilledRect;
	private		spr_total_effect: g.Sprite;

	private		spr_left_number: NumSprite;			// 残り解数
	private		spr_left_base: g.Pane;
	private		spr_left_effect: g.Sprite;

	private		spr_score: NumSpriteUp;				// スコア
	static		hi_score: number = 0;				// ハイスコア
	private		spr_hi_score!: NumSprite | null;
	private		rest_time: number;					// 残り時間
	private		spr_time: NumSprite;
	private		spr_round: NumSprite;				// ラウンド数
	private		spr_warning: g.FilledRect | null;	// 警告色


	/***************************************
	    コンストラクタ
			引数	_mode  = ゲームモード
	 ***************************************/
	constructor(_mode: Mode)
	{
		super(
		{
			game: g.game,
			assetPaths: ["/assets/image/*", "/assets/audio/*"],
		});
		this.mode = _mode;
		g.game.vars.gameState = {score: 0};

		this.spr_hi_score = null;
		if ( _mode != Mode.SINGLE_REPLAY ) {
			instanceStorage.read(SceneGame.SAVE_DATA)		// ハイスコア記録取得
			.then((_score: number) =>
			{
				if ( _score && (_score > SceneGame.hi_score) ) {
					SceneGame.hi_score = _score;
					if ( this.spr_hi_score && (_score > this.spr_hi_score.number) ) {
						this.spr_hi_score.set(_score);
					}
				}
			});
		}
	}

	/************
	    初期化
	 ************/
	public	init_scene(): void
	{
		this.load_image("/assets/image/", ["parts.png", "message.png"]);			// イメージ読み込み
		this.load_sound("/assets/audio/", ["se_click", "se_count", "se_select", "se_match", "se_miss", "se_replace", "se_chaim"]);
																					// サウンド読み込み

		{									// 背景
			const	_param: readonly number[][] =
			[
				[  2, 144, 116, 40,		Def.SCORE_X + 2,  Def.SCORE_Y],				// "SCORE"
				[118, 144, 194, 54,		Def.HI_SCORE_X,   Def.HI_SCORE_Y],			// "High SCORE"
				[  2, 198, 124, 40,		Def.ROUND_X,      Def.ROUND_Y],				// "ROUND"
				[320,  94,  40, 40,		Def.TIME_X,       Def.TIME_Y],				// タイマー
				[312, 144,  66, 40,		Def.TOTAL_X + 28, Def.TOTAL_Y + 6],			// "/10"
				[126, 198,  66, 44,		Def.LEFT_X + 22,  Def.LEFT_Y - 20],			// "left"
			];

			const	_base = new g.Sprite(
			{
				scene: this,
				src: this.asset.getImage("/assets/image/back.jpg"),
			});
			for (const _p of _param) {
				_base.append(new g.Sprite(
				{
					...this.TexParam(Image.PARTS,	_p[0], _p[1], _p[2], _p[3]),
					x: _p[4],
					y: _p[5],
				}));
			}
			this.append(g.SpriteFactory.createSpriteFromE(this, _base));
		}

		{									// 警告色
			const	_param: readonly number[][] =
			[
				[0,         0,			1024, 36],
				[0,         576 - 48,	1024, 48],
				[0,         36,			  46, 576 - 36 - 48],
				[1024 - 44, 36,			  44, 576 - 36 - 48],
			];

			this.spr_warning = null;
			for (const _p of _param) {
				const	_rect = new g.FilledRect(
						{
							scene: this,
							cssColor: "#ff0020",
							x: _p[0],
							y: _p[1],
							width:  _p[2],
							height: _p[3],
						});

				if ( this.spr_warning == null ) {
					this.spr_warning = _rect;
					this.spr_warning.opacity = 0;
				}
				else {
					this.spr_warning.append(_rect);
				}
			}
			this.append(this.spr_warning);
		}

		{
			this.field = new g.E(			// フィールド
			{
				scene: this,
				x: Def.FIELD_X,
				y: Def.FIELD_Y,
			});
			this.append(this.field);

			this.panel = [];				// パネル
			for (let i = 0; i < Def.FIELD_H; i++) {
				this.panel.push([]);
				for (let j = 0; j < Def.FIELD_W; j++) {
					const	_panel = new Panel(j, i);
					this.panel[i].push(_panel);
					this.field.append(_panel);
				}
			}

			this.append(new g.Sprite(		// フレーム
			{
				scene: this,
				src: this.asset.getImage("/assets/image/frame.png"),
				x: Def.FIELD_X - Def.PANEL_W/2 - 4,
				y: Def.FIELD_Y - Def.PANEL_H/2 - 4,
			}));
		}

		const	_param: g.SpriteParameterObject =			// 数字スプライト
		{
			...this.TexParam(Image.PARTS,	2, 2, 40, 46),
			tag: 36,		// 文字間隔
		};

		this.spr_score = new NumSpriteUp(_param, 4, Def.SCORE_X + 63, Def.SCORE_Y + 46);		// スコア
		this.spr_score.scaleX = 0.9;
		this.spr_score.modified();
		this.append(this.spr_score);

		this.spr_hi_score = new NumSprite(_param, 4, Def.HI_SCORE_X + 63, Def.HI_SCORE_Y + 48, SceneGame.hi_score);		// ハイスコア
		this.spr_hi_score.scaleX = 0.9;
		this.spr_hi_score.modified();
		this.append(this.spr_hi_score);

		this.spr_round = new NumSprite(_param, 2, Def.ROUND_X + 128, Def.ROUND_Y - 3);			// ラウンド数
		this.spr_round.scaleX = 0.9;
		this.spr_round.modified();
		this.append(this.spr_round);

		this.spr_time = new NumSprite(_param, 2, Def.TIME_X + 40, Def.TIME_Y - 4);				// 残り時間
		this.spr_time.scaleX = 7.0/8;
		this.spr_time.modified();
		this.append(this.spr_time);

		this.spr_total_number = new NumSprite(_param, 2, 0, 0, 10);								// 総和
		this.spr_total_base = new g.Pane(
		{
			scene: this,
			width: this.spr_total_number.width,
			height: this.spr_total_number.height,
			anchorX: 0.5,
			anchorY: 0.5,
			x: Def.TOTAL_X,
			y: Def.TOTAL_Y,
		});
		this.spr_total_base.append(this.spr_total_number);
		this.spr_total_color = new g.FilledRect(
		{
			scene: this,
			cssColor: "#ffe040",
			width: this.spr_total_base.width,
			height: this.spr_total_base.height,
			compositeOperation: "source-atop",
		});
		this.spr_total_base.append(this.spr_total_color);
		this.append(this.spr_total_base);

		this.spr_total_effect = g.SpriteFactory.createSpriteFromE(this, this.spr_total_base);
		this.spr_total_effect.anchorX = this.spr_total_effect.anchorY = 0.5;
		this.spr_total_effect.x += this.spr_total_effect.width/2;
		this.spr_total_effect.y += this.spr_total_effect.height/2;
		this.spr_total_effect.opacity = 0;
		this.spr_total_effect.compositeOperation = "lighter";
		this.spr_total_effect.modified();
		this.spr_total_effect.onUpdate.add(() =>
		{
			if ( this.spr_total_effect.opacity > 0 ) {
				this.spr_total_effect.opacity -= 1.0/24;
				if ( this.spr_total_effect.opacity > 0 ) {
					this.spr_total_effect.scaleX *= 1.015;
					this.spr_total_effect.scaleY = this.spr_total_effect.scaleX;
					this.spr_total_effect.modified();
				}
				else {
					this.spr_total_effect.opacity = 0;
					this.spr_total_effect.scaleX = 1.0;
				}
			}
		});
		this.append(this.spr_total_effect);
		this.spr_total_number.set(0);

		this.spr_left_number = new NumSprite(_param, 2, 0, 0);				// 残り解数
		this.spr_left_base = new g.Pane(
		{
			scene: this,
			width: this.spr_left_number.width,
			height: this.spr_left_number.height,
			anchorX: 0.75,
			anchorY: 0.5,
			x: Def.LEFT_X,
			y: Def.LEFT_Y,
		});
		this.spr_left_base.append(this.spr_left_number);
		this.spr_left_base.append(new g.FilledRect(
		{
			scene: this,
			cssColor: "#ff8040",
			width: this.spr_left_base.width,
			height: this.spr_left_base.height,
			compositeOperation: "source-atop",
		}));
		this.append(this.spr_left_base);

		this.spr_left_effect = g.SpriteFactory.createSpriteFromE(this, this.spr_left_base);
		this.spr_left_effect.anchorX = 0.75;
		this.spr_left_effect.anchorY = 0.5;
		this.spr_left_effect.x += this.spr_left_effect.width*0.75;
		this.spr_left_effect.y += this.spr_left_effect.height*0.5;
		this.spr_left_effect.opacity = 0;
		this.spr_left_effect.compositeOperation = "lighter";
		this.spr_left_effect.modified();
		this.spr_left_effect.onUpdate.add(() =>
		{
			if ( this.spr_left_effect.opacity > 0 ) {
				this.spr_left_effect.opacity -= 1.0/25;
				if ( this.spr_left_effect.opacity > 0 ) {
					this.spr_left_effect.scaleX *= 1.016;
					this.spr_left_effect.scaleY = this.spr_left_effect.scaleX;
					this.spr_left_effect.modified();
				}
				else {
					this.spr_left_effect.opacity = 0;
					this.spr_left_effect.scaleX = 1.0;
				}
			}
		});
		this.append(this.spr_left_effect);


		this.init_control();				// 入力設定

		this.init_field();					// 盤面初期化
		this.current_panel = [];			// 選択中
		this.current_x = 0;
		this.current_y = 0;
		this.replace_cnt = 0;				// 入れ替えカウンタ
		this.hint_cnt = 5*30;				// ヒント提示

		this.rest_time = 60*30;							// 残り時間
		this.spr_time.set(this.rest_time/30);

		if ( this.mode != Mode.SINGLE_REPLAY ) {
			this.init_information();					// 遊び方説明初期化
		}
		else {
			this.fade_in();
			this.phase	= Phase.READY;
			this.cnt	= 70;
		}
	}

	/****************
	    盤面初期化
	 ****************/
	private		init_field(): void
	{
		this.spr_round.add(1);				// ラウンド数

		let	num: number[];					// 初期数

		switch ( this.spr_round.get() ) {
		  case 1 :
			num =
			[
				2, 2, 2, 2, 2, 2,
				3, 3, 3, 3, 3,
				4, 4, 4, 4, 4,
				5, 5, 5, 5, 5,
				6, 6, 6, 6, 6,
				7, 7, 7, 7, 7,
				8, 8, 8, 8, 8,
			];
			break;

		  case 2 :
			num =
			[
				1, 1, 1, 1, 1,
				2, 2, 2, 2, 2,
				3, 3, 3, 3, 3,
				4, 4, 4, 4, 4,
				5, 5, 5, 5,
				6, 6, 6, 6,
				7, 7, 7,
				8, 8, 8,
				9, 9,
			];
			break;

//		  case 3 :
		  default :
			num =
			[
				1, 1, 1, 1, 1,
				2, 2, 2, 2, 2, 2,
				3, 3, 3, 3, 3, 3,
				4, 4, 4, 4, 4, 4,
				5, 5, 5, 5,
				6, 6, 6, 6,
				7, 7, 7,
				8, 8,
			];
			break;
/*
		  default :
			num =
			[
				1, 1, 1, 1, 1,
				2, 2, 2, 2, 2, 2, 2,
				3, 3, 3, 3, 3, 3, 3,
				4, 4, 4, 4, 4, 4, 4,
				5, 5, 5, 5, 5,
				6, 6, 6, 6, 6,
			];
			break;
*/
		}

		for (let i = 0; i < Def.FIELD_H; i++) {
			for (let j = 0; j < Def.FIELD_W; j++) {
				this.panel[i][j].init(num.pop());
			}
		}
		do {								// シャッフル
			for (let i = 0; i < Def.FIELD_H; i++) {
				for (let j = 0; j < Def.FIELD_W; j++) {
					const	_p0 = this.panel[i][j],
							_p1 = this.panel[sys.Rnd(Def.FIELD_H)][sys.Rnd(Def.FIELD_W)],
							_n = _p0.num;

					_p0.set_number(_p1.num);
					_p1.set_number(_n);
				}
			}
		} while ( this.check_correct() < 10 );
	}


	/**********
	    稼働
	 **********/
	public	update_scene(): sys.Scene | null
	{
		switch ( this.phase ) {
		  case Phase.READY :		// ゲーム開始
			this.update_ready();
			break;

		  case Phase.GAME :			// ゲーム中
			this.update_game();
			break;

		  case Phase.OVER :			// ゲームオーバー
			this.update_over();
			if ( this.fill_fade && (this.fill_fade.opacity == 1.0)  ) {			// ゲーム終了
				sys.Audio.stop_all();
				return	(new SceneGame(Mode.SINGLE_REPLAY));
			}
			break;
		}

		if ( this.replace_cnt > 0 ) {			// 入れ替え
			if ( --this.replace_cnt == 12 + 4 ) {
				g.game.vars.gameState.score = this.spr_score.get() + 100;		// クリアボーナス
				this.set_effect(100, Def.FIELD_X + Def.PANEL_W*(Def.FIELD_W - 1)/2, Def.FIELD_Y - 40 + Def.PANEL_H*(Def.FIELD_H - 1)/2);
			}
			else if ( this.replace_cnt == 12 ) {
				sys.Audio.play_se(SE.REPLACE);
			}
			else if ( this.replace_cnt < 12 ) {
				this.field.opacity = this.replace_cnt/12;
				if ( this.replace_cnt == 0 ) {
					this.init_field();
				}
			}
		}
		else if ( this.field.opacity < 1.0 ) {
			this.field.opacity += 1.0/8;
			if ( this.field.opacity > 1.0 ) {
				this.field.opacity = 1.0;
			}
			this.field.modified();
		}

		if ( this.spr_score.number > this.spr_hi_score.number ) {				// ハイスコア更新
			this.spr_hi_score.set(this.spr_score.number);
		}
		return	null;
	}


	/****************
	    ゲーム稼働
	 ****************/
	private		update_game(): void
	{
		if ( (this.rest_time > 0) && (--this.rest_time % 30 == 0) ) {
			this.spr_time.set(this.rest_time/30);	// 残り時間

			if ( this.rest_time == 0 ) {			// ゲームオーバー
				this.phase = Phase.OVER;
				this.cnt = 0;

				if ( g.game.vars.gameState.score > SceneGame.hi_score ) {		// ハイスコア記録
					SceneGame.hi_score = g.game.vars.gameState.score;
					instanceStorage.write(SceneGame.SAVE_DATA, g.game.vars.gameState.score);
				}
			}
		}
		if ( this.rest_time < 10*30 ) {				// 終了間際
			this.spr_warning.opacity = (1.0 - Math.cos(this.rest_time*(Math.PI/30)))*0.15;
			this.spr_warning.modified();
		}

		if ( (this.hint_cnt > 0) && (--this.hint_cnt == 0) ) {
			for (const _p of this.correct_route) {								// ヒント提示
				_p.set_hint(true);
			}
		}
	}

	/**************
	    入力設定
	 **************/
	private		init_control()
	{
		this.pointDownCapture.add((ev: g.PointDownEvent) =>				// 押下
		{
			if ( (this.phase == Phase.GAME) && (this.replace_cnt == 0) ) {
				this.click_field(ev.point.x, ev.point.y);
			}
		});
		this.pointMoveCapture.add((ev: g.PointMoveEvent) =>				// 移動
		{
			if ( (this.phase == Phase.GAME) && (this.replace_cnt == 0) && (this.current_panel.length > 0) ) {
				this.click_field(ev.point.x + ev.startDelta.x, ev.point.y + ev.startDelta.y);
			}
		});
		this.pointUpCapture.add((ev: g.PointUpEvent) =>					// 離した
		{
			if ( (this.phase == Phase.GAME) && (this.replace_cnt == 0) ) {
				this.cancel_panel();				// パネル選択キャンセル
				this.set_total();
			}
/*
			const	_scene = new g.Scene({game: g.game, seethrough: true});			// ポーズ用

			_scene.pointDownCapture.add((ev: g.PointDownEvent) =>
			{
				g.game.popScene();
				this.onPointDownCapture.fire(ev);
			});
			g.game.pushScene(_scene);
*/
		});
	}

	/*******************************
	    フィールド押下
			引数	_x, _y = 座標
	 *******************************/
	private		click_field(_x: number, _y: number): void
	{
		_x -= Def.FIELD_X - Def.PANEL_W/2;
		_y -= Def.FIELD_Y - Def.PANEL_H/2;
		if ( (_x < 0) || (_x >= Def.PANEL_W*Def.FIELD_W) || (_y < 0) || (_y >= Def.PANEL_H*Def.FIELD_H) ) {			// 範囲外
			this.cancel_panel();					// パネル選択キャンセル
			this.set_total();
			return;
		}
		if ( (_x % Def.PANEL_W >= 4) && (_x % Def.PANEL_W < Def.PANEL_W - 4) && (_y % Def.PANEL_H >= 4) && (_y % Def.PANEL_H < Def.PANEL_H - 4) ) {
			_x = Math.floor(_x/Def.PANEL_W);
			_y = Math.floor(_y/Def.PANEL_H);
			const	_panel = this.panel[_y][_x];

			if ( this.current_panel.length > 0 ) {
				switch ( Math.abs(_x - this.current_x) + Math.abs(_y - this.current_y) ) {
				  case 0 :							// 同位置
					return;

				  case 1 :							// 隣
					const	_n = this.current_panel.indexOf(_panel);
					if ( _n < 0 ) {
						break;
					}
					else if ( _n == this.current_panel.length - 2 ) {		// 一手戻す
						this.current_panel.pop().off();
						this.current_x = _x;
						this.current_y = _y;
						sys.Audio.play_se((this.set_total() < 10) ? SE.SELECT : SE.MISS);
						return;
					}
				  default :
					this.cancel_panel();			// パネル選択キャンセル
					break;
				}
			}
			if ( _panel.on() ) {
				this.current_x = _x;
				this.current_y = _y;
				this.current_panel.push(_panel);

				const	_total = this.set_total();	// 総和表示
				if ( _total == 10 ) {				// 揃った
					this.erase_panel();
					this.hint_cnt = 5*30 + this.spr_round.get()*30;
					this.spr_total_effect.opacity = 0.8;
					sys.Audio.play_se(SE.MATCH);
				}
				else {
					sys.Audio.play_se((_total < 10) ? SE.SELECT : SE.MISS);
				}
			}
		}

	}

	/**************************
	    パネル選択キャンセル
	 **************************/
	private		cancel_panel(): void
	{
		for (const _p of this.current_panel) {
			_p.off();
		}
		this.current_panel = [];
	}

	/************************
	    揃ったパネルを消去
	 ************************/
	private		erase_panel(): void
	{
		for (const _p of this.correct_route) {
			_p.set_hint(false);
		}
		this.correct_route = [];

		let	score: number = 1,
			x0: number = 1024, x1: number = 0,
			y0: number = 576, y1: number = 0;

		for (const _p of this.current_panel) {
			score *= _p.num;
			if ( _p.x < x0 ) {
				x0 = _p.x;
			}
			if ( _p.x > x1 ) {
				x1 = _p.x;
			}
			if ( _p.y < y0 ) {
				y0 = _p.y;
			}
			if ( _p.y > y1 ) {
				y1 = _p.y;
			}
			_p.erase();
		}
		g.game.vars.gameState.score = this.spr_score.get() + score;								// スコア更新

		this.set_effect(score, Def.FIELD_X + (x0 + x1)/2, Def.FIELD_Y - 32 + (y0 + y1)/2);		// エフェクト発生

		if ( this.check_correct() == 0 ) {			// 取れるパネルをチェック
			this.replace_cnt = 15 + 12;				// 入れ替え
			this.spr_left_effect.opacity = 0.9;
		}
		this.current_panel = [];
	}

	/***********************************
	    加点エフェクト発生
			引数	_score = 加点
					_x, _y = 表示位置
	 ***********************************/
	private		set_effect(_score: number, _x: number, _y: number): void
	{
		let		_effect: g.E;

		if ( _score < 100 ) {
			_effect = new NumSprite(
			{
				...this.TexParam(Image.PARTS,	2, 50, 32, 40),
				tag: 27,
			}, (_score < 10) ? 1 : 2, _x, _y, _score);

			_effect.append(new g.Sprite(			// "+"
			{
				...this.TexParam(Image.PARTS,	324, 56, 32, 32),
				x: -30,
				y: 4,
			}));
			_effect.anchorX = (_effect.width - 30)/2/_effect.width;
			_effect.modified();
			_effect.hide();
		}
		else {
			_effect = new g.Sprite(					// "BONUS +100"
			{
				...this.TexParam(Image.PARTS,	2, 92, 308, 52),
				x: _x,
				y: _y,
				anchorX: 0.5,
				hidden: true,
			});
		}

		let	_cnt: number = 4 + 32;
		_effect.onUpdate.add(() =>
		{
			if ( --_cnt == 0 ) {
				_effect.destroy();
			}
			else if ( _cnt == 32 ) {
				_effect.show();
				this.spr_score.add(_score);
			}
			else if ( _cnt < 32 ) {
				if ( _cnt < 20 ) {
					_effect.opacity = _cnt/20;
				}
				_effect.y -= _cnt/((_score < 10) ? 14 : 20);
				_effect.modified();
			}
		});
		this.append(_effect);
	}

	/**********************
	    総和表示
			戻り値	総和
	 **********************/
	private		set_total(): number
	{
		let	_total: number = 0;
		for (const _p of this.current_panel) {
			_total += _p.num;
		}
		this.spr_total_number.set(_total);
		this.spr_total_color.cssColor = (_total <= 10) ? "#ffe040" : "#ff4040",
		this.spr_total_base.invalidate();
		return	_total;
	}

	/********************************
	    取れるパネルをチェック
					戻り値	解の数
	 ********************************/
	private		check_correct(): number
	{
		for (let i = 0; i < Def.FIELD_H; i++) {
			for (let j = 0; j < Def.FIELD_W; j++) {
				this.panel[i][j].flag_check = false;
			}
		}

		const	_route: Panel[] = [],
				_correct: Panel[][] = [];

		let		_total: number = 0,
				_score_max: number = 100;

		const	_check = (x: number, y: number) =>
		{
			if ( (x < 0) || (x >= Def.FIELD_W) || (y < 0) || (y >= Def.FIELD_H) ) {
				return;
			}
			const	_panel = this.panel[y][x];
			if ( _panel.flag_check || (_total + _panel.num > 10) ) {
				return;
			}

			_route.push(_panel);
			_total += _panel.num;
			if ( _total == 10 ) {							// 取れる
				let	_f = true;
				for (const _c of _correct) {				// 既に出ている例か
					if ( _c.length == _route.length ) {
						_f = false;
						for (const _p of _route) {
							if ( _c.indexOf(_p) < 0 ) {
								_f = true;
								break;
							}
						}
						if ( !_f ) {
							break;
						}
					}
				}
				if ( _f ) {
					const	_sc = _route.length + sys.Random.generate(),
							_r = [..._route];
					if ( _sc < _score_max ) {
						this.correct_route = _r;
						_score_max = _sc;
					}
					_correct.push(_r);						// 正解例
				}
			}
			else {
				_panel.flag_check = true;
				_check(x + 1, y);
				_check(x, y + 1);
				_check(x - 1, y);
				_check(x, y - 1);
				_panel.flag_check = false;
			}
			_total -= _panel.num;
			_route.pop();
		};

		this.correct_route = [];							// 正解例
		for (let i = 0; i < Def.FIELD_H; i++) {
			for (let j = 0; j < Def.FIELD_W; j++) {
				_check(j, i);
			}
		}

		this.spr_left_number.set(_correct.length);
		this.spr_left_base.invalidate();

		return	_correct.length;
	}


	/********************
	    ゲームオーバー
	 ********************/
	private		update_over(): void
	{
		switch ( ++this.cnt ) {
		  case 1*30 :
			this.cancel_panel();
			break;

		  case 2*30 :
			for (const _p of this.correct_route) {			// ヒント提示
				_p.set_hint(true);
			}
			break;

		  case 3*30 :
			{
				const	_spr = new g.Sprite(				// "Game Over"
				{
					...this.TexParam(Image.MESSAGE,	2, 258, 544, 94),
					x: 576,
					y: 270,
					anchorX: 0.5,
					anchorY: 0.5,
					opacity: 0,
				});

				let	_cnt: number = -40;
				_spr.onUpdate.add(() =>
				{
					if ( _spr.opacity < 1.0 ) {
						_spr.opacity += 1.0/20;
						if ( _spr.opacity > 1.0 ) {
							_spr.opacity = 1.0;
						}
					}

					if ( ++_cnt <= 0 ) {
						_spr.y = 280 - _cnt*_cnt*(40/40/40);
					}
					else {
						_cnt %= 90;
						_spr.y = 260 + (Math.cos(_cnt*(Math.PI*2/90)) + 1)*10;
					}
					_spr.modified();
				});
				this.append(_spr);

				sys.Audio.stop_bgm();
			}
			break;

		  case 3.2*30 :
			sys.Audio.play_se(SE.CHAIM);
			break

		  case 5*30 :
			if ( this.mode != Mode.RANKING )  {				// クリック入力処理
				const	_base: g.E = new g.E(
				{
					scene: this,
					width:  g.game.width,
					height: g.game.height,
					touchable: true,
				});

				_base.pointDown.add((ev: g.PointDownEvent) =>
				{
					sys.Audio.play_se(SE.CLICK);
					_base.touchable = false;
					this.fade_out();
				});
				this.append(_base);
			}
			break;
		}
	}


	/********************
	    ゲーム開始処理
	 ********************/
	private		update_ready(): void
	{
		switch ( --this.cnt ) {
		  case 60 :
			{
				const	_spr = new g.Sprite(				// "Get Ready"
				{
					...this.TexParam(Image.MESSAGE,	2, 2, 528, 122),
					x: 572,
					y: 278,
					anchorX: 0.5,
					anchorY: 0.5,
					opacity: 0,
				});
				let		_cnt: number = 12;

				_spr.onUpdate.add(() =>
				{
					if ( --_cnt >= 0 ) {
						_spr.scaleY = Math.cos(_cnt*(Math.PI/2/12));
						if ( _cnt >= 12 - 8 ) {
							_spr.opacity = (12 - _cnt)/8;
						}
					}
					else if ( _cnt == -20 - 16 ) {
						_spr.destroy();
						return;
					}
					else if ( _cnt < -20 ) {
						_spr.scaleY = Math.cos((-_cnt - 20)*(Math.PI/2/16));
						_spr.opacity -= 1.0/16;
					}
					_spr.modified();
				});
				this.append(_spr);
			}
		  case 30 :
			sys.Audio.play_se(SE.COUNT);
			break;

		  case 12 :
			{
				const	_spr = new g.Sprite(				// "Start!"
				{
					...this.TexParam(Image.MESSAGE,	2, 124, 404, 134),
					x: 556,
					y: 270,
					anchorX: 0.5,
					anchorY: 0.5,
					opacity: 0,
				});
				let		_cnt: number = 12;

				_spr.onUpdate.add(() =>
				{
					if ( --_cnt >= 0 ) {
						_spr.scaleY = Math.cos(_cnt*(Math.PI/2/12));
						if ( _cnt >= 12 - 8 ) {
							_spr.opacity = (12 - _cnt)/8;
						}
					}
					else if ( _cnt < -6 ) {
						_spr.opacity -= 1.0/12;
						if ( _spr.opacity <= 0 ) {
							_spr.destroy();
							return;
						}
					}
					_spr.modified();
				});
				this.append(_spr);
			}
			break;

		  case 0 :
			this.phase = Phase.GAME;
			sys.Audio.play_bgm(this.asset.getAudio("/assets/audio/bgm_game"));			// BGM再生開始
			break;
		}
	}


	/**********************
	    遊び方説明初期化
	 **********************/
	private		init_information(): void
	{
		const	_base = new g.E(
		{
			scene: this,
			width:  g.game.width,
			height: g.game.height,
			touchable: true,
		});
		_base.append(new g.Sprite(							// 遊び方説明
		{
			scene: this,
			src: this.asset.getImage("/assets/image/information.png"),
			x: 70,
			y: 60,
		}));
		this.append(_base);

		if ( this.mode == Mode.RANKING ) {
			let	_cnt: number = 5*30;

			_base.onUpdate.add(() =>
			{
				if ( --_cnt == 0 ) {
					this.phase = Phase.READY;
					this.cnt = 80;
				}
				else if ( _cnt < 0 ) {
					_base.opacity -= 1.0/8;
					if ( _base.opacity <= 0 ) {
						_base.destroy();
					}
					else {
						_base.modified();
					}
				}
			});
		}
		_base.pointDown.add((ev: g.PointDownEvent) =>
		{
			sys.Audio.play_se(SE.CLICK);
			this.phase = Phase.READY;
			this.cnt = 80;
			_base.onUpdate.add(() =>
			{
				_base.opacity -= 1.0/8;
				if ( _base.opacity <= 0 ) {
					_base.destroy();
				}
				else {
					_base.modified();
				}
			});
		});

		this.phase = Phase.INFORMATION;
	}
}
