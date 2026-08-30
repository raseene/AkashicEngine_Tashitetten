
import { Audio } from "./Audio";


/******************
    基本システム
 ******************/

export let	Random: g.RandomGenerator;			// 乱数


/********************
    システム初期化
 ********************/
export function Init(_rnd: g.RandomGenerator, _channel_max: number = 4): void
{
	Random = _rnd;						// 乱数設定
	Audio.init(_channel_max);			// サウンド管理初期化
}

export function Ranodmize(_seed: number): void
{
	Random = new g.XorshiftRandomGenerator(_seed);
}

/******************
    整数乱数取得
 ******************/
export function Rnd(_t: number): number
{
	return	Math.floor(Random.generate()*_t);
}
