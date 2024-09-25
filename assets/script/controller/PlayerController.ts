const { ccclass, property } = _decorator;
import { _decorator, animation, AudioSource, Camera, Collider, Component, EventMouse, EventTouch, ICollisionEvent, ITriggerEvent, Label, Layers, math, Node, NodeSpace, Quat, random, randomRange, sys, toDegree, toRadian, v3, Vec3 } from 'cc';
import { BackPack } from './BackPack';
import { AvatarController } from './AvatarController';
import { Item } from '../item/Item';
import { PHY_GROUP } from '../manager/Layers';

@ccclass('PlayerController')
export class PlayerController extends AvatarController {
    @property(Node)
    tutorialArrow:Node;

    protected _backPack: BackPack;
    protected _sleepMoveTimer: number = 0;
    protected _sleepMoveInterval: number = 0;

    protected _interacting: boolean = false;
    protected _audio:AudioSource = null;

    start() {
        if (super.start)
            super.start();

        this._audio = this.getComponent(AudioSource);
        this._backPack = this.node.getComponent(BackPack);
    }

    protected doCollisionEnter(event: ICollisionEvent) {
        super.doCollisionEnter(event);

        const otherCollider = event.otherCollider;
        if (otherCollider) {
            const otherNode = otherCollider.node;
            if (otherNode) {
                if (otherCollider.getGroup() == PHY_GROUP.ITEM) {
                    // const item:Item = otherNode.getComponent(Item);
                    // if (item){
                    //     this.catchItem(item);
                    // }
                } else if (otherCollider.getGroup() == PHY_GROUP.PLAYER) {
                    const otherPlayer:PlayerController = otherCollider.getComponent(PlayerController);
                    if (this.isBot() && this.getItemCount() < otherPlayer.getItemCount())
                        this.sleepMove(randomRange(500, 1500));
                }
            }
        }
    }

    // protected doTriggerEnter(event: ITriggerEvent){
    //     super.doTriggerEnter(event);

    //     this.doTrigger(event.otherCollider.node);
    // }

    protected canMove() {
        if (super.canMove()){
            if (this._sleepMoveTimer > 0){
                if (sys.now() < this._sleepMoveTimer + this._sleepMoveInterval)
                    return false;
    
                this._sleepMoveTimer = 0;
            }
            return true;
        }

        return false;
    }

    protected adjustStatus() {
    }

    public dropItem(worldPos:Vec3 = null) : Item {
        if (this._backPack){
            const ret = this._backPack.dropOne(worldPos);
            if (ret) {
                ret.prepareForProduct();

                this.adjustStatus();
            }

            return ret;
        }

        return null;
    }

    public catchItem(item:Item): boolean {
        if (this._backPack){
            if (this._backPack.addItem(item)) {
                this.adjustStatus();
                return true;
            }
        }
        return false;
    }
    
    public isPackFull():boolean {
        if (this._backPack){
            return this._backPack.isFull();
        }
        return false;
    }

    public isPackEmpty():boolean {
        if (this._backPack){
            return this._backPack.isEmpty();
        }
        return true;
    }

    public getItemCount():number {
        if (this._backPack){
            return this._backPack.getItemCount();
        }
        return 0;
    }

    public isBot() : boolean {
        return false;
    }

    public static checkPlayer(otherCollider: Collider, onlyRealPlayer:boolean = false) : PlayerController {
        if (otherCollider) {
            const otherNode = otherCollider.node;
            if (otherNode) {
                if (otherCollider.getGroup() == PHY_GROUP.PLAYER) {
                    const player:PlayerController = otherNode.getComponent(PlayerController);
                    if (!onlyRealPlayer || !player.isBot())
                        return player;
                }
            }
        }
        return null;
    }

    public sleepMove(sleepMilliseconds:number):void {
        this._sleepMoveTimer = sys.now();
        this._sleepMoveInterval = sleepMilliseconds;
    }

    protected getWalkAnimationName(): string {
        return this.isPackEmpty() ? super.getWalkAnimationName() : 'run_carry';
    }
}


