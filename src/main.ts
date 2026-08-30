
import { GameMainParameterObject } from "./parameterObject";
import * as sys from "./sys";

import { SceneGame, Mode } from "./Game/SceneGame";


/************
    メイン
 ************/
export function main(param: GameMainParameterObject): void
{
	sys.Init(param.random);							// システム初期化

	g.game.pushScene(new SceneGame((param.sessionParameter.mode == "ranking") ? Mode.RANKING : Mode.SINGLE));
}
