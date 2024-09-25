import { _decorator, Collider, Component, ICollisionEvent, Node, ParticleSystem, sys, tween, Tween, Vec3 } from 'cc';
import { PHY_GROUP } from '../manager/Layers';
import { PlayerController } from './PlayerController';
import { Item } from '../item/Item';
import { MoneyController } from './MoneyController';
const { ccclass, property } = _decorator;

@ccclass('TruckController')
export class TruckController extends Component {
    @property(Node)
    topGroup:Node = null;
    @property
    topAnimationTime:number = 0.2;
    @property
    topAnimationY:number = 0.5;

    @property(Node)
    placePos:Node = null;

    @property
    rows:number = 6;

    @property
    cols:number = 4;

    @property
    maxCount:number = 72;

    @property(Collider)
    collider:Collider;

    @property(MoneyController)
    money:MoneyController = null;

    @property
    moneyUnit:number = 10;

    @property(ParticleSystem)
    moneyVfx:ParticleSystem = null;

    protected _inputPlayers:Node[] = [];
    protected _inputTimers:number[] = [];
    protected _dropInterval:number = 100;
    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _topAnimPos:Vec3 = Vec3.ZERO.clone();

    protected _startBuying:boolean = true;

    protected onLoad(): void {
        this._topAnimPos.y = this.topAnimationY;

        if (this.collider) {
            this.collider.on('onCollisionEnter', this.onCollisionEnter, this);
            this.collider.on('onCollisionExit', this.onCollisionExit, this);
        }
    }

    protected onDestroy(): void {
        try {
            if (this.collider) {
                this.collider.off('onCollisionEnter', this.onCollisionEnter, this);
                this.collider.off('onCollisionExit', this.onCollisionExit, this);
            }
        }catch(e){

        }
    }

    protected start(): void {
        this.topAnimation(true);
    }
    
    onCollisionEnter(event: ICollisionEvent) {
        const player:Node = TruckController.checkPlayer(event.otherCollider);
        if (player){
            TruckController.registerPlayer(player, this._inputPlayers, this._inputTimers, true);
        }
    }

    onCollisionExit(event: ICollisionEvent) {
        const player:Node = TruckController.checkPlayer(event.otherCollider);
        if (player){
            TruckController.registerPlayer(player, this._inputPlayers, this._inputTimers, false);
        }
    }
    
    protected topAnimation(start:boolean) {
        if (this.topGroup) {
            Tween.stopAllByTarget(this.topGroup);
            this.topGroup.setPosition(Vec3.ZERO);
    
            if (start)
                tween(this.topGroup)
                .to(this.topAnimationTime, {position:this._topAnimPos})
                .to(this.topAnimationTime, {position:Vec3.ZERO})
                .union()
                .repeatForever()
                .start();
        }
    }

    public static registerPlayer(player:Node, players:Node[], timers:number[], isRegister:boolean) {
        if (player){
            let index = players.indexOf(player);
            if (index < 0) {
                players.push(player);
                timers.push(0);
                index = timers.length - 1;
            }
            timers[index] = isRegister ? sys.now() : 0;
        }
    }

    protected processPlayers(players:Node[], timers:number[]) {
        for (let index = 0; index < players.length; index++) {
            const time = timers[index];
            if (time > 0 && sys.now() >= this._dropInterval + time) {
                const player = players[index];
                if (player) {
                    if (this.onProcessPlayer(player)) {
                        timers[index] = sys.now();
                        break;
                    }
                }
            }
        }
    }

    update(deltaTime: number) {
        this.processPlayers(this._inputPlayers, this._inputTimers);
    }
    
    public static checkPlayer(otherCollider: Collider) : Node {
        if (otherCollider) {
            const otherNode = otherCollider.node;
            if (otherNode) {
                if (otherCollider.getGroup() == PHY_GROUP.PLAYER) {
                    return otherNode;
                }
            }
        }
        return null;
    }
    
    protected onProcessPlayer(node:Node):boolean {
        let ret:boolean = false;
        const player:PlayerController = node.getComponent(PlayerController);
        if (player && this.placePos && this.placePos.children.length < this.maxCount) {
            const item:Item = player.dropItem();
            if (item){
                if (this._startBuying) {
                    this._startBuying = false;
                    this.topAnimation(false);
                }

                this.placePos.addChild(item.node);

                const dimension = item.getHalfDimension();
                let count: number = this.placePos.children.length - 1;
                this._tempPos.y = dimension.y * 2 * Math.floor(count / (this.rows * this.cols));
                count = count % (this.rows * this.cols);
                this._tempPos.x = dimension.x * 2 * ((count % this.cols) - this.cols / 2) + dimension.x;
                this._tempPos.z = dimension.z * 2 * ((this.rows - Math.floor(count / this.cols)) - this.rows / 2) + dimension.z;
                item.node.setPosition(this._tempPos);

                item.node.setScale(Vec3.ONE);
                item.scaleEffect(this._dropInterval / 2000);

                if (this.money)
                    this.money.addMoney(this.moneyUnit);

                if (this.moneyVfx)
                    this.moneyVfx.play();
            }

            ret = !player.isPackEmpty();
        }
        return ret;
    }
}


