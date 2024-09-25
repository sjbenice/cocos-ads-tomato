import { _decorator, Component, Node, Vec3 } from 'cc';
import { SoundMgr } from '../manager/SoundMgr';
import { GameState } from '../manager/GameState';
const { ccclass, property } = _decorator;

@ccclass('PressController')
export class PressController extends Component {
    protected _orgPos:Vec3 = null;
    protected _workPos:Vec3 = null;

    protected _isUp:boolean = true;
    protected _timer:number = 0;

    protected static PRESS_Y:number = 1.5;
    public static PRESS_PERIOD:number = 0.25;
    
    start() {
        this._orgPos = this.node.getPosition();
        this._workPos = this._orgPos.clone();
    }

    update(deltaTime: number) {
        this._timer += deltaTime;
        const ratio = Math.min(1, this._timer / PressController.PRESS_PERIOD);

        this._workPos.y = this._orgPos.y + PressController.PRESS_Y * (this._isUp ? ratio : (1 - ratio));
        this.node.setPosition(this._workPos);

        if (ratio >= 1) {
            if (!this._isUp && GameState.getState() <= GameState.State.PRODUCT_LINE3)
                SoundMgr.playSound('press');
            
            this._isUp = !this._isUp;
            this._timer = 0;
        }
    }
}


