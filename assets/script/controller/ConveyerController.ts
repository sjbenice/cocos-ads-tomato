import { _decorator, Camera, Component, instantiate, Node, ParticleSystem, Prefab, Quat, random, Tween, tween, Vec3 } from 'cc';
import { Item } from '../item/Item';
import { TutorHandInterface } from './TutorHandInterface';
import { Utils } from '../util/Utils';
import { SoundMgr } from '../manager/SoundMgr';
const { ccclass, property } = _decorator;

@ccclass('ConveyerController')
export class ConveyerController extends Component implements TutorHandInterface {
    @property(Node)
    inputPos:Node = null;

    @property(Prefab)
    tomatoPrefab:Prefab = null;

    @property(Node)
    pathGroup:Node = null;

    @property(Node)
    outputPos:Node = null;

    @property(Node)
    hand:Node = null;

    @property(Node)
    handTrackGroup:Node = null;

    @property
    isWorking:boolean = true;
    @property(Node)
    hillsGroup:Node = null;

    @property(ParticleSystem)
    payEffect:ParticleSystem = null;

    protected static MAX_OUTPUT_COUNT:number = 200;
    protected static PERIOD:number = 0.3;
    protected static PERIOD_TUTOR:number = 0.2;
    protected static OFFSET:number = 0.5;
    protected static OFFSET_TUTOR_X:number = 0.5;
    protected static OFFSET_TUTOR_Y:number = 1;
    protected _timer:number = 0;
    protected _count:number = 0;
    protected _path:Vec3[] = [];

    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _tempPos2:Vec3 = Vec3.ZERO.clone();
    protected _tempPos3:Vec3 = Vec3.ZERO.clone();

    start() {
        if (this.pathGroup) {
            for (let index = 0; index < this.pathGroup.children.length; index++) {
                const left = this.pathGroup.children[index].getWorldPosition();
                const right = left.clone();

                left.x -= ConveyerController.OFFSET;
                this._path.push(left);

                right.x += ConveyerController.OFFSET;
                this._path.push(right);
            }
        }

        if (this.isWorking) {
            if (this.hand)
                this.hand.active = false;
            if (this.handTrackGroup)
                this.handTrackGroup.active = false;
        } else {
            if (this.hillsGroup) {
                for (let index = 1; index < this.hillsGroup.children.length - 1; index++) {
                    const element = this.hillsGroup.children[index];
                    element.active = false;
                }
            }
        }
    }

    protected onDestroy(): void {
        // this.hideTutor();
    }

    protected calcOffset(count:number) : number {
        return (count % 2) - ConveyerController.OFFSET;
    }

    update(deltaTime: number) {
        if (this.pathGroup && this.isWorking) {
            this._timer += deltaTime;
            if (this._timer >= ConveyerController.PERIOD) {
                this._timer = 0;

                let tomato:Node = null;
                if (this.inputPos && this.inputPos.children.length > 0) {
                    tomato = this.inputPos.children[0];
                    tomato.removeFromParent();
                } else {
                    if (this.tomatoPrefab)
                        tomato = instantiate(this.tomatoPrefab);
                }

                if (tomato) {
                    tomato.setParent(this.pathGroup.children[0]);
                    tomato.setRotation(Quat.IDENTITY);

                    tomato.setWorldPosition(this._path[this._count % 2]);
                    
                    const item = tomato.getComponent(Item);
                    item.enablePhysics(false);
                    item.displayShadow(true);

                    const tw = tween(tomato);

                    for (let index = 1; index < this.pathGroup.children.length; index++) {
                        const element = this.pathGroup.children[index];
                        const targetPos = this._path[index * 2 + (this._count % 2)];
                        tw.to(ConveyerController.PERIOD, {worldPosition:targetPos})
                        .call(()=>{
                            tomato.setParent(element);
                            tomato.setWorldPosition(targetPos);
                        })                        
                    }

                    tw.call(()=>{
                        if (this.outputPos) {
                            tomato.getWorldPosition(this._tempPos);
                            tomato.setParent(this.outputPos);
                            tomato.setWorldPosition(this._tempPos);
                            tomato.setRotationFromEuler(random() * 360, random() * 360, random() * 360);

                            item.enablePhysics(true);
                            item.displayShadow(false);

                            item.freeze(false);

                            if (this.outputPos.children.length >= ConveyerController.MAX_OUTPUT_COUNT) {
                                const firstItem = this.outputPos.children[0];
                                firstItem.removeFromParent();
                                firstItem.destroy();
                            }
                        }
                    })
                    .start();

                    this._count ++;
                }
            }
        }
    }

    showTutor(): boolean {
        if (!this.isWorking) {
            if (!this.hand.active) {
                this.hand.active = true;
                this.handTrackGroup.active = true;

                const startPos = this.handTrackGroup.children[0].getWorldPosition();
                startPos.x -= ConveyerController.OFFSET_TUTOR_X;
                startPos.y += ConveyerController.OFFSET_TUTOR_Y;
                this.hand.setWorldPosition(startPos);

                const count = this.handTrackGroup.children.length - 1;
                const tw = tween(this.hand);
                for (let index = 1; index < count; index++) {
                    const element = this.handTrackGroup.children[index];
                    const worldPos = element.getWorldPosition();
                    worldPos.x -= ConveyerController.OFFSET_TUTOR_X;
                    worldPos.y += ConveyerController.OFFSET_TUTOR_Y;
                    tw.to(ConveyerController.PERIOD_TUTOR, {worldPosition:worldPos});
                }

                tw
                .call(()=>{
                    this.hand.setWorldPosition(startPos);
                })
                .union()
                .repeatForever()
                .start();

                const sleepTime = (count - 1 - 3) * ConveyerController.PERIOD_TUTOR;
                const orgScale = this.handTrackGroup.children[0].getScale();
                for (let index = 0; index < count; index++) {
                    const element = this.handTrackGroup.children[index];
                    element.setScale(Vec3.ZERO);
                    this.scheduleOnce(()=>{
                        tween(element)
                        .call(()=>{
                            element.setScale(orgScale);
                        })
                        .to(ConveyerController.PERIOD_TUTOR * 3, {scale:Vec3.ZERO}, {easing:'expoIn'})
                        .delay(sleepTime)
                        .union()
                        .repeatForever()
                        .start();
                    }, ConveyerController.PERIOD_TUTOR * index);
                }
            }

            return true;
        }

        return false;
    }

    hideTutor() {
        if (this.hand && this.hand.active){
            Tween.stopAllByTarget(this.hand);
            this.hand.active = false;
        }

        if (this.handTrackGroup && this.handTrackGroup.active) {
            this.handTrackGroup.children.forEach(element => {
                Tween.stopAllByTarget(element);
            });
            this.handTrackGroup.active = false;
        }

        this.unscheduleAllCallbacks();
    }

    protected getUI43d(camera3d:Camera, uiCamera:Camera, node:Node, out:Vec3) {
        node.getWorldPosition(out);
        camera3d.worldToScreen(out, this._tempPos2);
        uiCamera.screenToWorld(this._tempPos2, out);
        out.z = 0;
    }

    isInZone(camera3d:Camera, uiCamera:Camera, x:number, y:number) : boolean {
/*        this.getUI43d(camera3d, uiCamera, this.handTrackGroup.children[0], this._tempPos);
        this.getUI43d(camera3d, uiCamera, this.handTrackGroup.children[this.handTrackGroup.children.length - 1], this._tempPos3);

        this._tempPos2.set(x, y, 0);

        const distance = Utils.distancePointToLineSegment(this._tempPos2, this._tempPos, this._tempPos3);

        return distance < 100;*/

        let ret:boolean = false;
        if (this.hillsGroup) {
            for (let index = 0; index < this.hillsGroup.children.length - 1; index++) {
                const element = this.hillsGroup.children[index];
                this.getUI43d(camera3d, uiCamera, this.handTrackGroup.children[index], this._tempPos);
                this._tempPos2.set(x, y, 0);

                if (Vec3.distance(this._tempPos, this._tempPos2) < 60) {
                    element.active = true;
                    ret = true;
                    break;
                }
            }
        }

        return ret;
    }

    enableWorking():boolean {
        let ret:boolean = true;

        this.hillsGroup.children.forEach(element => {
            ret &&= element.active;
        });

        if (ret) {
            this.isWorking = true;

            this.hideTutor();

            if (this.payEffect)
                this.payEffect.play();

            SoundMgr.playSound('conveyor');
        }

        return ret;
    }
}
