import { _decorator, Component, Node, Quat } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('RotorController')
export class RotorController extends Component {
    protected static SPEED:number = 500;
    protected _quat:Quat = Quat.IDENTITY.clone();

    start() {

    }

    update(deltaTime: number) {
        Quat.fromEuler(this._quat, 0, RotorController.SPEED * deltaTime, 0);
        this.node.rotate(this._quat);
    }
}


