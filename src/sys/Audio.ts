

import { scene } from "./Scene";

/******************
    サウンド管理
 ******************/
export class Audio
{
	static	master_volume: number	= 1.0;			// マスター音量
	static	bgm_volume: number		= 1.0;			// BGM音量
	static	se_volume: number		= 1.0;			// SE音量

	/********************************
	    マスター音量設定
			引数	_volume = 音量
	 ********************************/
	static	set_master_volume(_volume: number = 1.0): void
	{
		if ( Audio.master_volume != _volume ) {
			Audio.master_volume = _volume;
			g.game.audio.music.volume = _volume*Audio.bgm_volume;
			g.game.audio.sound.volume = _volume*Audio.se_volume;
		}
	}

	/********************************
	    BGM音量設定
			引数	_volume = 音量
	 ********************************/
	static	set_bgm_volume(_volume: number = 1.0): void
	{
		if ( Audio.bgm_volume != _volume ) {
			Audio.bgm_volume = _volume;
			g.game.audio.music.volume = _volume*Audio.master_volume;
		}
	}

	/********************************
	    SE音量設定
			引数	_volume = 音量
	 ********************************/
	static	set_se_volume(_volume: number = 1.0): void
	{
		if ( Audio.se_volume != _volume ) {
			Audio.se_volume = _volume;
			g.game.audio.sound.volume = _volume*Audio.master_volume;
		}
	}


	static	se_player: g.AudioPlayer[];		// SEプレイヤー
	static	se_channel: number;				// 使用プレイヤー

	/***********************************************
	    初期化
			引数	_channel_max = SEチャンネル数
	 ***********************************************/
	static	init(_channel_max: number): void
	{
		Audio.se_player = [];							// SEプレイヤー
		for (let i = 0; i < _channel_max; i++) {
			Audio.se_player.push(g.game.audio.sound.createPlayer());
		}
		Audio.se_channel = 0;
	}

	/************************************
	    サウンド再生
			引数	_asset  = サウンド
					_volume = 音量
			戻り値	プレイヤー
	 ************************************/
	static	play_bgm(_asset: g.AudioAsset | number, _volume: number = 1.0): g.AudioPlayer
	{
		return	Audio._play((g.game.audio.music as g.MusicAudioSystem).player, _asset, _volume);
	}

	static	play_se(_asset: g.AudioAsset | number, _volume: number = 1.0): g.AudioPlayer
	{
		Audio.se_channel = ++Audio.se_channel % Audio.se_player.length;
		return	Audio._play(Audio.se_player[Audio.se_channel], _asset, _volume);
	}

	static	play_se_channel(_channel: number, _asset: g.AudioAsset | number, _volume: number = 1.0): g.AudioPlayer
	{
		return	Audio._play(Audio.se_player[_channel], _asset, _volume);
	}

	static	play(_asset: g.AudioAsset | number, _volume: number = 1.0): g.AudioPlayer
	{
		const	_t = (typeof _asset === "object") ? _asset : scene.sound[_asset];
		return	_t.loop ? Audio.play_bgm(_t, _volume) : Audio.play_se(_t, _volume);
	}

	static	_play(_player: g.AudioPlayer, _asset: g.AudioAsset | number, _volume: number = 1.0): g.AudioPlayer
	{
		_player.changeVolume(_volume);					// 音量設定
		_player.play((typeof _asset === "object") ? _asset : scene.sound[_asset]);		// 再生
		return	_player;
	}

	/*************
	    BGM停止
	 *************/
	static	stop_bgm(): void
	{
		(g.game.audio.music as g.MusicAudioSystem).player.stop();
	}

	/*******************************
	    BGMプレイヤー取得
			戻り値	BGMプレイヤー
	 *******************************/
	static	bgm_player(): g.AudioPlayer
	{
		return	(g.game.audio.music as g.MusicAudioSystem).player;
	}

	/**************
	    全て停止
	 **************/
	static	stop_all(): void
	{
//		g.game.audio.music.stopAll();
//		g.game.audio.sound.stopAll();
		Audio.stop_bgm();
		for (const _player of Audio.se_player) {
			_player.stop();
		}
	}
}
