import { _decorator, Component, instantiate, Node, Prefab, random, randomRange, SkeletalAnimation, tween, v3, Vec3 } from 'cc';
import { ParabolaTween } from '../util/ParabolaTween';
import { FieldPlate } from './FieldPlate';
import { GameState } from '../manager/GameState';
const { ccclass, property } = _decorator;

@ccclass('GrandMaController')
export class GrandMaController extends Component {
    @property(Prefab)
    tomatoPrefab:Prefab = null;

    @property(FieldPlate)
    plate:FieldPlate = null;

    protected static START_Y:number = 4;
    protected static DISTANCE_Z:number = 10;

    protected _startPos:Vec3 = null;
    protected _endPos:Vec3 = null;
    protected _timer:number = 0;
    protected _period:number = 0;
    protected _working:boolean = true;

    start() {
        this._period = randomRange(0.2, 0.4);
        this._startPos = this.node.getPosition();
        this._startPos.y += GrandMaController.START_Y;
        this._endPos = this._startPos.clone();

        const skeletalAnim = this.getComponent(SkeletalAnimation);
        if (skeletalAnim)
            this.scheduleOnce(()=>{
                skeletalAnim.play();
            }, random() * 2);
        else {
            const leftRotation = this.node.getRotation();
            tween(this.node)
            .delay(random() * 2)
            .by(0.25, {eulerAngles:v3(0, -5, 0)})
            .by(0.25, {eulerAngles:v3(0, 5, 0)})
            .by(0.25, {eulerAngles:v3(0, 5, 0)})
            .by(0.25, {eulerAngles:v3(0, -5, 0)})
            .union()
            .repeatForever()
            .start();
        }
    }

    update(deltaTime: number) {
        this._timer += deltaTime;
        if (this._working && this.tomatoPrefab && this._timer >= this._period) {
            this._timer = 0;
            if (GameState.getState() <= GameState.State.CONVEYER3) {
                const item = instantiate(this.tomatoPrefab);
    
                this._endPos.set(this._startPos);
                this._endPos.x += randomRange(-0.5, 0.5);
                this._endPos.z += GrandMaController.DISTANCE_Z * randomRange(0.7, 1.4);

                this.node.parent.addChild(item);
    
                // if (GameState.getState() == GameState.State.PLATE) {
                    item.setPosition(this._startPos);
    
                    ParabolaTween.moveNodeParabola(item, this._endPos, 4, 0.5, -1, 
                        randomRange(180, 360), false, this.afterParabola, this.plate);
                // } else {
                //     item.setPosition(this._endPos);
                //     this.afterParabola(item, this.plate);
                // }
            } else {
                this._working = false;
                this.plate.setWorking(false);
            }
        }
    }

    protected afterParabola(node:Node, param:any) {
        const plate = param as FieldPlate;
        if (plate)
            plate.receiveTomato(node);
    }
}


