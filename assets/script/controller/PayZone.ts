import { _decorator, Camera, Collider, Component, EAxisDirection, ITriggerEvent, Node, ParticleSystem, sys, Tween, tween, v3, Vec3 } from 'cc';
import { PlayerController } from './PlayerController';
import { Boundary } from '../util/Boundary';
import { Number3d } from '../util/Number3d';
import { SoundMgr } from '../manager/SoundMgr';
import { MoneyController } from './MoneyController';
import { Utils } from '../util/Utils';
const { ccclass, property } = _decorator;

@ccclass('PayZone')
export class PayZone extends Component {
    @property(MoneyController)
    money:MoneyController = null;

    @property
    price: number = 200;

    @property(Number3d)
    number3d:Number3d = null;

    @property(Node)
    handTutor:Node = null;
    @property({ type: EAxisDirection })
    handDirection: EAxisDirection = EAxisDirection.Z_AXIS;

    @property(Node)
    vfx:Node = null;

    @property(Node)
    unlockNodes:Node[] = [];

    @property(Node)
    followHand:Node = null;

    @property(Node)
    progress: Node;
    @property({ type: EAxisDirection })
    progressDirection: EAxisDirection = EAxisDirection.X_AXIS;

    dropInterval: number = 20; // Interval in milliseconds
    public static PAY_UNIT:number = 5;

    private static BASE_HALF:number = 1.31;
    private _halfDimension:number = 0;

    private _collider:Collider = null;
    private _dropTimer: number = 0;
    private _player:PlayerController = null;
    private _paied:number = 0;
    private _orgScale:Vec3 = null;
    private _scaleTo:Vec3 = null;
    private _tempPos:Vec3 = Vec3.ZERO.clone();

    private _isTweenRunning:boolean = false;
    private _progressOrgScale:Vec3 = null;
    private _progressDimension:Vec3 = null;

    start() {
        this.number3d.setValue(this.price);

        this._progressOrgScale = this.progress.scale.clone();
        this._progressDimension = Boundary.getMeshDimension(this.progress, true);
        this.showProgress();

        this._orgScale = this.node.scale.clone();
        this._scaleTo = this._orgScale.clone();
        this._scaleTo.x *= 1.5;
        this._scaleTo.z *= 1.5;

        this._collider = this.node.getComponent(Collider);

        this._halfDimension = PayZone.BASE_HALF * this.node.scale.x;
        
        if (this._collider) {
            this._collider.on('onTriggerEnter', this.onTriggerEnter, this);
            this._collider.on('onTriggerExit', this.onTriggerExit, this);
        }
    }

    onDestroy() {
        this.hideTutor();

        if (this._collider) {
            this._collider.off('onTriggerEnter', this.onTriggerEnter, this);
            this._collider.off('onTriggerExit', this.onTriggerExit, this);
        }
    }

    onTriggerEnter (event: ITriggerEvent) {
        const player:PlayerController = PlayerController.checkPlayer(event.otherCollider, true);
        if (player){
            this._player = player;
            this._dropTimer = sys.now();
        }
    }

    onTriggerExit (event: ITriggerEvent) {
        const player:PlayerController = PlayerController.checkPlayer(event.otherCollider, true);
        if (player && this._player == player){
            this._dropTimer = null;
        }
        if (this.vfx && this.vfx.active)
            this.vfx.active = false;
    }

    public getRemainedPrice() {
        return this.price - this._paied;
    }

    protected scaleEffect() {
        if (!this._isTweenRunning){
            this._isTweenRunning = true;
            tween(this.node)
                .to(0.2, {scale:this._scaleTo}, { easing: 'circIn' })
                .to(0.2, {scale:this._orgScale}, { easing: 'circIn' })
                .union()
                .call(() => {
                    // Set the flag to false when the tween completes
                    this._isTweenRunning = false;
                })
                .start()
        }
    }

    public isCompleted() : boolean {
        return this._paied >= this.price;
    }
    
    private showProgress() {
        const pos = this.progress.position;
        const scale = this._paied / this.price;

        switch (this.progressDirection) {
            case EAxisDirection.X_AXIS:
                this.progress.setScale(this._progressOrgScale.x * scale, this._progressOrgScale.y, this._progressOrgScale.z);
                this.progress.setPosition(- (1 - scale) * this._progressDimension.x /2, pos.y, pos.z);
                break;
            case EAxisDirection.Y_AXIS:
                this.progress.setScale(this._progressOrgScale.x, this._progressOrgScale.y * scale, this._progressOrgScale.z);
                this.progress.setPosition(pos.x, - (1 - scale) * this._progressDimension.y / 2, pos.z);
                break;
            case EAxisDirection.Z_AXIS:
                this.progress.setScale(this._progressOrgScale.x, this._progressOrgScale.y, this._progressOrgScale.z * scale);
                this.progress.setPosition(pos.x, pos.y, - (1 - scale) * this._progressDimension.z / 2);
                break;
        }
    }

    update(deltaTime: number) {
        if (this._dropTimer > 0 && sys.now() > this._dropTimer + this.dropInterval && !this.isCompleted()) {
            if (this.vfx && !this.vfx.active){
                this.vfx.active = true;
                this.scaleEffect();
            }
    
            this._paied += PayZone.PAY_UNIT;

            this.showProgress();

            this.number3d.setValue(this.getRemainedPrice());

            if (this.isCompleted()) {
                SoundMgr.playSound("upgrade");

                this.scaleEffect();
                this.vfx.active = false;

                this.scheduleOnce(()=>{
                    this.node.active = false;
                    this.unlockNodes.forEach(element => {
                        if (element) {
                            element.active = true;
                            element.getComponentsInChildren(ParticleSystem).forEach(vfx => {
                                vfx.play();
                            });
                        }
                    });
                }, 0.5);

                this._dropTimer = 0;
            } else
                this._dropTimer = sys.now();
        }
    }

    showTutor() {
        if (this.handTutor && !this.handTutor.active) {
            this.handTutor.active = true;

            const orgPos = this.handTutor.getPosition();
            const movePos = orgPos.clone();
            if (this.handDirection == EAxisDirection.Z_AXIS)
                movePos.z += 2;
            else
                movePos.x -= 2;

            this.handTutor.setPosition(movePos);

            tween(this.handTutor)
            .to(0.3, {position:orgPos})
            .to(0.7, {position:movePos})
            .union()
            .repeatForever()
            .start();
        }

        if (this.followHand) {
            // this.followHand.getComponent(PayZone).showTutor();
            const arrow = this.followHand.getChildByName('arrowPos').getChildByName('tutorArrow');
            arrow.active = true;
            tween(arrow)
            .by(0.5, {position:v3(0, -1, 0)}, {easing:'quadInOut'})
            .by(0.5, {position:v3(0, 1, 0)}, {easing:'quadInOut'})
            .union()
            .repeatForever()
            .start();
        }
    }

    hideTutor() {
        if (this.handTutor && this.handTutor.active) {
            Tween.stopAllByTarget(this.handTutor);
            this.handTutor.active = false;
        }
    }

    enableWorking():boolean {
        if (this.money.getMoney() < this.price)
            return false;

        this.hideTutor();

        if (this.unlockNodes.length == 0)
            return true;
        
        this.money.addMoney(-this.price);

        this._dropTimer = sys.now();

        this.scaleEffect();

        return true;
    }

    protected getUI43d(camera3d:Camera, uiCamera:Camera, pos:Vec3) {
        camera3d.worldToScreen(pos, this._tempPos);
        uiCamera.screenToWorld(this._tempPos, pos);
        pos.z = 0;
    }
    
    isInZone(camera3d:Camera, uiCamera:Camera, x:number, y:number) : boolean {
        this.node.getWorldPosition(this._tempPos);
        const tl = this._tempPos.clone();
        tl.x -= this._halfDimension;
        tl.z -= this._halfDimension;
        const tr = tl.clone();
        tr.x += this._halfDimension * 2;
        const br = tr.clone();
        br.z += this._halfDimension * 2;
        const bl = tl.clone();
        bl.z += this._halfDimension * 2;

        this.getUI43d(camera3d, uiCamera, tl);
        this.getUI43d(camera3d, uiCamera, tr);
        this.getUI43d(camera3d, uiCamera, br);
        this.getUI43d(camera3d, uiCamera, bl);

        this._tempPos.set(x, y, 0);

        return Utils.isPointInPolygon(this._tempPos, [tl, tr, br, bl, tl]);
    }
}


