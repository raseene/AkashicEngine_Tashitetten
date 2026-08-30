
import * as sys from "../sys";
import { Image } from "./SceneGame";


/********************
    数値スプライト
 ********************/
export class NumSprite extends g.E
{

	public		number: number;				// 数値
	private		sprite: g.Sprite[];			// スプライト
	private		srcX: number;				// テクスチャ先頭位置
	public		sx: number;					// 最大桁位置
	private		value_max: number;			// 最大値


	/************************************************
	    コンストラクタ
			引数	_param = スプライトパラメータ
					_keta  = 表示桁数
					_x, _y = 表示位置
					_num   = 初期値
	 ************************************************/
	constructor(_param: g.SpriteParameterObject, _keta: number, _x: number, _y: number, _num: number = 0)
	{
		super(
		{
			scene: _param.scene,
			x: _x,
			y: _y,
		});

		const	_w = (_param.tag != null) ? (_param.tag as number) : _param.width;		// 文字間隔

		this.sprite	= [];								// スプライト
		for (let i = 0; i < _keta; i++) {
			const	_spr = new g.Sprite(_param);

			_spr.x = i*_w;
			_spr.y = 0;
			this.sprite.push(_spr);
			this.append(_spr);
		}

		this.srcX = _param.srcX;
		this.width = (_keta - 1)*_w + _param.width!;
		this.height = _param.height!;
		this.sx = 0;
		this.value_max = Math.pow(10, _keta) - 1;
		this.number = _num;
		this.set(_num);									// 数値
	}

	/**********************
	    数値取得
			戻り値	数値
	 **********************/
	public	get(): number
	{
		return	this.number;
	}

	/******************************
	    数値設定
			引数	_num  = 数値
	*******************************/
	public	set(_num: number): void
	{
		_num = Math.floor(_num);
		this.number = _num;
		if ( _num > this.value_max ) {
			_num = this.value_max;
		}

		let	_spr;
		for (let i = this.sprite.length - 1; i >= 0; i--) {
			_spr = this.sprite[i];
			if ( (_num > 0) || (i == this.sprite.length - 1) ) {
				_spr.srcX = this.srcX + (_num % 10)*_spr.width;
				_spr.modified();
				_spr.show();
				this.sx = _spr.x;
			}
			else {
				_spr.hide();
			}
			_num = Math.floor(_num/10);
		}
	}

	/*****************************
	    加算
			引数	_d = 加算値
	 *****************************/
	public	add(_d: number): void
	{
		this.set(this.number + _d);
	}
}


/**************************************
    数値スプライト（カウントアップ）
 **************************************/
export class NumSpriteUp extends NumSprite
{
	public		target: number;				// 目標値
	private		base: number;				// 基準値
	private		cnt: number;				// カウンタ


	/*************************************************
	    コンストラクタ
			引数	_param  = スプライトパラメータ
					_margin = 文字間の距離
					_keta   = 表示桁数
					_num    = 初期値
	 *************************************************/
	constructor(_param: g.SpriteParameterObject, _margin: number, _keta: number, _num: number = 0)
	{
		super(_param, _margin, _keta, _num);

		this.target	= this.number;						// 目標値
		this.base	= this.number;						// 基準値
		this.cnt	= 0;								// カウンタ

		this.update.add(() =>							// カウントアップアニメーション
		{
			if ( this.cnt > 0 ) {
				this.cnt--;
				super.set(Math.floor((this.target*(10 - this.cnt) + this.base*this.cnt + 9)/10));
			}
		});
	}

	/**********************
	    数値取得
			戻り値	数値
	 **********************/
	override	get(): number
	{
		return	this.target;
	}

	/*****************************
	    数値設定
			引数	_num = 数値
	******************************/
	override	set(_num: number): void
	{
		super.set(_num);
		this.target	= _num;
		this.base	= _num;
		this.cnt	= 0;
	}

	/*********************************
	    数値設定（カウントアップ）
				引数	_num = 数値
	**********************************/
	public	set_count_up(_num: number)
	{
		this.base	= this.number;
		this.target	= _num;
		this.cnt	= 10;
	}

	/*****************************
	    加算
			引数	_d = 加算値
	 *****************************/
	override	add(_d: number): void
	{
		this.set_count_up(this.target + _d);
	}
}
