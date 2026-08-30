
export let	scene: Scene | null = null;			// カレントシーン

/******************
    シーンひな型
 ******************/
export abstract class Scene extends g.Scene
{
	public	image: g.ImageAsset[];				// イメージデータ
	public	sound: g.AudioAsset[];				// サウンドデータ

	/************************************************
	    コンストラクタ
			引数	param = シーン初期化パラメータ
	 ************************************************/
	constructor(param: g.SceneParameterObject = {game: g.game})
	{
		super(param);
		this.image = [];								// イメージ
		this.sound = [];								// サウンド

		this.onLoad.add(() =>
		{
			scene = this;
			this.init_scene();												// 初期化
			this.onUpdate.add(() =>
			{
				const	_scene: Scene | null = this.update_scene();			// 稼働
				if ( _scene ) {												// シーン切り替え
					g.game.replaceScene(_scene);
				}
			});
		});
	}

	abstract	init_scene(): void;						// 初期化
	abstract	update_scene(): Scene | null;			// 稼働


	/**************************************
	    イメージデータ読み込み
			引数	_dir  = ディレクトリ
					_file = ファイル名
	 **************************************/
	protected	load_image(_dir: string, _file: string[]): void
	{
		for (let i = 0; i < _file.length; i++) {
			this.image.push(this.asset.getImage(_dir + _file[i]));
		}
	}

	/**************************************
	    サウンドデータ読み込み
			引数	_dir  = ディレクトリ
					_file = ファイル名
	 **************************************/
	protected	load_sound(_dir: string, _file: string[]): void
	{
		for (let i = 0; i < _file.length; i++) {
			this.sound.push(this.asset.getAudio(_dir + _file[i]));
		}
	}


	/************************************************
	    テクスチャパラメータ
			引数	_image         = イメージデータ
					_u, _v, _w, _h = 範囲
			戻り値	パラメータオブジェクト
	 *************************************************/
	public	TexParam(_image: g.ImageAsset | number, _u: number, _v: number, _w: number, _h: number): g.SpriteParameterObject
	{
		return	{
					scene: this,
					src: (typeof _image === "object") ? _image : this.image[_image],
					srcX:   _u,
					srcY:   _v,
					width:  _w,
					height: _h,
				};
	}


	protected	fill_fade: g.FilledRect | null = null;			// フェード用塗りつぶし

	/*************************************
	    フェードアウト
			引数	_cnt = フェード時間
	 *************************************/
	protected	fade_out(_cnt: number = 12): void
	{
		this.set_fade(_cnt);
	}

	/*************************************
	    フェードイン
			引数	_cnt = フェード時間
	 *************************************/
	protected	fade_in(_cnt : number = 12): void
	{
		if ( _cnt > 0 ) {
			this.set_fade(-_cnt);
		}
		else if ( this.fill_fade ) {
			this.fill_fade.destroy();
			this.fill_fade = null;
		}
	}

	private		set_fade(_cnt: number): void
	{
		if ( this.fill_fade ) {
			this.fill_fade.destroy();
		}
		this.fill_fade = new g.FilledRect(						// フェード用塗りつぶし
		{
			scene: this,
			cssColor: "#000000",
			width:  g.game.width,
			height: g.game.height,
		});
		if ( _cnt != 0 ) {
			const	_speed: number = 1.0/_cnt;
			this.fill_fade.opacity = (_cnt > 0) ? _speed : 1.0;
			this.fill_fade.onUpdate.add((): boolean =>			// フェード処理
			{
				this.fill_fade.opacity += _speed;
				if ( this.fill_fade.opacity >= 1.0 ) {
					this.fill_fade.opacity = 1.0;
					this.fill_fade.modified();
					return	true;
				}
				else if ( this.fill_fade.opacity <= 0.0 ) {
					this.fill_fade.destroy();
					this.fill_fade = null;
					return	true;
				}
				this.fill_fade.modified();
				return	false;
			});
		}
		this.append(this.fill_fade);
	}
}
