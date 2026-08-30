
import * as sys from "../sys";
import { SceneGame, Def, Image } from "./SceneGame";


/**********
    状態
 **********/
const enum State
{
	NORMAL,		// 通常
	ON,			// 選択中
	ERASE,		// 消去中
}

/************
    背景色
 ************/
const enum Color
{
	ON		= "rgba(0,192,255,0.625)",		// 選択中
	ERASE	= "rgba(255,208,0,0.75)",		// 消去中
	HINT	= "rgba(0,192,64,0.5)",			// ヒント
	DARK	= "rgba(30,40,28,0.5)",			// 選択済み
}


/************
    パネル
 ************/
export class Panel extends g.E
{
	public		num: number;				// 数
	public		px: number;					// フィールド上の位置
	public		py: number;
	private		panel_state: State;			// 状態
	private		base: g.FilledRect;			// 背景色
	private		spr_number: g.Sprite;		// 数値スプライト
	private		dark: g.FilledRect;			// 選択済み色
	private		flag_hint: boolean;			// ヒント用
	public		flag_check: boolean;		// チェック用


	/*******************************
	    コンストラクタ
			引数	_x, _y = 座標
	 *******************************/
	constructor(_x: number, _y: number)
	{
		super(
		{
			scene: sys.scene,
		});
		this.x = _x*Def.PANEL_W;
		this.y = _y*Def.PANEL_H;
		this.px = _x;
		this.py = _y;
		this.panel_state = State.NORMAL;
		this.num = 0;
		this.flag_hint = false;
		this.flag_check = false;

		this.base = new g.FilledRect(		// 背景色
		{
			scene: this.scene,
			cssColor: "#000000",
			width:  Def.PANEL_W,
			height: Def.PANEL_H,
			anchorX: 0.5,
			anchorY: 0.5,
			opacity: 0,
		});
		this.append(this.base);

		this.spr_number = new g.Sprite(		// 数値スプライト
		{
			...sys.scene.TexParam(Image.PARTS,	2, 2, 40, 46),
			anchorX: 0.5,
			anchorY: 0.5,
		});
		this.append(this.spr_number);

		this.dark = new g.FilledRect(		// 選択済み色
		{
			scene: this.scene,
			cssColor: Color.DARK,
			width:  Def.PANEL_W,
			height: Def.PANEL_H,
			anchorX: 0.5,
			anchorY: 0.5,
			opacity: 0,
		});
		this.append(this.dark);
	}

	/*******************************
	    初期化
			引数	_num = 初期値
	 *******************************/
	public	init(_num: number): void
	{
		this.num = _num;
		this.panel_state = State.NORMAL;
		this.flag_hint = false;
		this.base.opacity = 0;
		this.base.modified();
		this.dark.opacity = 0;
		this.dark.modified();
	}

	/*****************************
	    数値設定
			引数	_num = 数値
	 *****************************/
	public	set_number(_num: number): void
	{
		this.num = _num;
		this.spr_number.srcX = 2 + _num*40;
		this.spr_number.modified();
	}

	/**********
	    選択
	 **********/
	public	on(): boolean
	{
		if ( this.panel_state != State.NORMAL ) {
			return	false;
		}
		this.panel_state = State.ON;
		this.base.cssColor = Color.ON;
		this.base.opacity = 1;
		this.base.modified();
		return	true;
	}

	/**************
	    選択解除
	 **************/
	public	off(): void
	{
		this.panel_state = State.NORMAL;
		if ( !this.flag_hint ) {
			this.base.opacity = 0;
		}
		else {
			this.base.cssColor = Color.HINT;
			this.base.opacity = 1;
		}
		this.base.modified();
	}

	/**********
	    消去
	 **********/
	public	erase(): void
	{
		this.panel_state = State.ERASE;
		this.num = 100;
		this.base.cssColor = Color.ERASE;
		this.base.modified();

		let	_cnt = 16;
		this.onUpdate.add((): boolean =>
		{
			if ( this.panel_state != State.ERASE ) {
				return	true;
			}
			_cnt--;
			if ( _cnt < 8 ) {
				this.base.opacity = _cnt/8;
				this.base.modified();
				this.dark.opacity = (8 - _cnt)/8;
				this.dark.modified();
			}
			return	(_cnt == 0);
		});
	}

	/***********************************
	    ヒント設定
			引数	_f = ヒントON/OFF
	 ***********************************/
	public	set_hint(_f: boolean): void
	{
		this.flag_hint = _f;
		if ( this.panel_state == State.NORMAL ) {
			if ( _f ) {
				this.base.cssColor = Color.HINT;
				this.base.opacity = 1;
			}
			else {
				this.base.opacity = 0;
			}
			this.base.modified();
		}
	}
}
