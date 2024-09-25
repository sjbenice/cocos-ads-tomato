import { _decorator, Camera, CCFloat, CCInteger, Component, director, EventMouse, EventTouch, Game, input, Input, instantiate, lerp, Node, Prefab, Quat, randomRange, renderer, Toggle, toRadian, Tween, tween, UITransform, v3, Vec3 } from 'cc';
import { SoundMgr } from './SoundMgr';
import { Utils } from '../util/Utils';
import event_html_playable from '../event_html_playable';
import { GameState } from './GameState';
import { ConveyerController } from '../controller/ConveyerController';
import { PayZone } from '../controller/PayZone';
import { FactoryController } from '../controller/FactoryController';
import { MoneyController } from '../controller/MoneyController';
import { FieldPlate } from '../controller/FieldPlate';
const { ccclass, property } = _decorator;

@ccclass('GameMgr')
export class GameMgr extends Component {

    static VERSION = {
        FULL: 1,
        ACTION_3: 2,
        ACTION_1: 3,
    };
    @property(Node)
    btnSound:Node = null;

    @property(Node)
    cameraNode:Node = null;
    @property(Node)
    cameraPosGroup:Node = null;

    @property(Node)
    tutorialArrow:Node = null;

    @property(Node)
    tutorialPoints:Node[] = [];

    @property(Camera)
    uiCamera:Camera = null;

    @property({type:[CCFloat], range:[0, 10, 0.1]/*, slide: true*/})
    followDelays:number[] = [];

    @property(Node)
    loadingCtrl:Node = null;

    @property(Node)
    payzoneGroup:Node = null;

    @property(FactoryController)
    factoryGrid:FactoryController = null;

    @property(FieldPlate)
    fieldPlate:FieldPlate = null;

    @property(MoneyController)
    money:MoneyController = null;

    private _camera3d:Camera = null;

    private static _instance: GameMgr = null;
    private static CAMERA_FOLLOW_SPEED : number = 2;
    private static CAMERA_TURN_SPEED : number = 2;
    private static CAMERA_HEIGHT_SPEED:number = 8;
    private static CAMERA_ORTHO_HEIGHT1 : number = 14;
    private static CAMERA_ORTHO_HEIGHT2 : number = 30;

    private _targetPos:Vec3 = Vec3.ZERO.clone();
    private _targetPos1:Vec3 = Vec3.ZERO.clone();
    private _cameraTargetPos:Vec3 = Vec3.ZERO.clone();
    private _cameraTargetQuat:Quat = new Quat();

    private _version:number = 0;

    // private _firstUpdate:boolean = true;
    private _followState:number = GameState.getState();
    private _isGameEnd:boolean = false;
    private _pressing:boolean = false;
    private _clicking:boolean = false;
    // private _cameraDelay:number = 0;

    private _zoneClickCount:number = 0;
    private _conveyer:ConveyerController = null;
    private _payZone:PayZone = null;

    private _cameraHeight:number = 0;
    private _cameraHeightScale:number = 1;

    private _initMoney:number = 0;

    onLoad() {
        if (GameMgr._instance) {
            this.node.destroy();
            return;
        }
        GameMgr._instance = this;
        director.addPersistRootNode(this.node);

        this._version = event_html_playable.version();
        if (this._version <= 0) {
            this._version = parseInt(Utils.getUrlParameter('version'), 10);
            if (!this._version)
                this._version = GameMgr.VERSION.FULL;
        }
        console.log(this._version);
    }

    protected onDestroy(): void {
        this.unscheduleAllCallbacks();

        if (GameMgr._instance == this)
            GameMgr._instance = null;

        if (!this._isGameEnd)
            event_html_playable.trackExit();

        if (!Utils.isTouchDevice()) {
            input.off(Input.EventType.MOUSE_DOWN, this._onInputMouseDown, this);
            input.off(Input.EventType.MOUSE_MOVE, this._onInputMouseMove, this);
            input.off(Input.EventType.MOUSE_UP, this._onInputMouseUp, this);
            // if (HTML5) {
            //     document.removeEventListener('pointerlockchange', this._onPointerlockchange);
            // }
        } else {
            // this.node.off(Node.EventType.TOUCH_START, this._onThisNodeTouchStart, this);
            // this.node.off(Node.EventType.TOUCH_END, this._onThisNodeTouchEnd, this);
            // this.node.off(Node.EventType.TOUCH_CANCEL, this._onThisNodeTouchCancelled, this);
            // this.node.off(Node.EventType.TOUCH_MOVE, this._onThisNodeTouchMove, this);
            input.off(Input.EventType.TOUCH_START, this._onThisNodeTouchStart, this);
            input.off(Input.EventType.TOUCH_MOVE, this._onThisNodeTouchMove, this);
            input.off(Input.EventType.TOUCH_END, this._onThisNodeTouchEnd, this);
            input.off(Input.EventType.TOUCH_CANCEL, this._onThisNodeTouchCancelled, this);
        }
    }

    start() {
        event_html_playable.game_start();

        if (this.btnSound && (event_html_playable.hideSoundButton() || event_html_playable.hideAllButton()))
            this.btnSound.active = false;


        this._camera3d = this.cameraNode.getComponent(Camera);
        if (this._camera3d) {
            if (this._camera3d.projection == renderer.scene.CameraProjection.ORTHO)
                this._cameraHeight = GameMgr.CAMERA_ORTHO_HEIGHT1;//this._camera3d.orthoHeight;
        }

        if (this.money)
            this._initMoney = this.money.getMoney();

        if (this.loadingCtrl) {
            this.loadingCtrl.active = true;
            this._followState = GameState.State.GRANDMA;
        } else
            GameState.setState(GameState.State.GRANDMA);

        if (!Utils.isTouchDevice()) {
            input.on(Input.EventType.MOUSE_DOWN, this._onInputMouseDown, this);
            input.on(Input.EventType.MOUSE_MOVE, this._onInputMouseMove, this);
            input.on(Input.EventType.MOUSE_UP, this._onInputMouseUp, this);
            // if (HTML5) {
            //     document.addEventListener('pointerlockchange', this._onPointerlockchange);
            // }
        } else {
            // this.node.on(Node.EventType.TOUCH_START, this._onThisNodeTouchStart, this);
            // this.node.on(Node.EventType.TOUCH_END, this._onThisNodeTouchEnd, this);
            // this.node.on(Node.EventType.TOUCH_CANCEL, this._onThisNodeTouchCancelled, this);
            // this.node.on(Node.EventType.TOUCH_MOVE, this._onThisNodeTouchMove, this);
            input.on(Input.EventType.TOUCH_START, this._onThisNodeTouchStart, this);
            input.on(Input.EventType.TOUCH_MOVE, this._onThisNodeTouchMove, this);
            input.on(Input.EventType.TOUCH_END, this._onThisNodeTouchEnd, this);
            input.on(Input.EventType.TOUCH_CANCEL, this._onThisNodeTouchCancelled, this);
        }
    }

    private _onInputMouseDown(event: EventMouse) {
        switch (event.getButton()) {
            default:
                break;
            case EventMouse.BUTTON_LEFT:
                this._onClickOrTouch(event.getUILocationX(), event.getUILocationY(), false);
                break;
        }
    }

    private _onInputMouseMove(event: EventMouse) {
        this._onClickOrTouchMove(event.getUILocationX(), event.getUILocationY());
    }

    private _onInputMouseUp (event: EventMouse) {
        switch (event.getButton()) {
            default:
                break;
            case EventMouse.BUTTON_LEFT:
                this._onClickOrTouchEnd();
                break;
        }
    }

    private _onThisNodeTouchStart (touchEvent: EventTouch) {
        const touch = touchEvent.touch;
        if (!touch) {
            return;
        }

        this._onClickOrTouch(touch.getUILocationX(), touch.getUILocationY(), false);
    }

    private _onThisNodeTouchEnd () {
        this._onClickOrTouchEnd();
    }
    
    private _onThisNodeTouchCancelled () {
        this._onThisNodeTouchEnd();
    }

    private _onThisNodeTouchMove (touchEvent: EventTouch) {
        const touch = touchEvent.touch;
        if (!touch) {
            return;
        }

        this._onClickOrTouchMove(touch.getUILocationX(), touch.getUILocationY());
    }

    private _onClickOrTouchEnd() {
        event_html_playable.interact_end();

        this._clicking = false;

        if (this._pressing) {
            this._pressing = false;

            if (this._zoneClickCount > 0) {
                const state = GameState.getState();
                // console.log(this._zoneClickCount);
                if (this._conveyer) {
                    if (this._conveyer.enableWorking()) {
                        if (state == GameState.State.CONVEYER2) {
                            GameState.setState(GameState.State.CONVEYER3);
                        } else if (state == GameState.State.CONVEYER3) {
                            if (this.fieldPlate) {
                                this.fieldPlate.stopRuin();
                                this.scheduleOnce(() => {
                                    this.fieldPlate.clearAll();
                                }, 3);
                            }

                            if (this.factoryGrid) {
                                this.factoryGrid.createDump(200);
                            }

                            GameState.setState(GameState.State.PRODUCT_LINE2);
                            event_html_playable.trackSetup1();
                        }
                    }
                } else if (this._payZone) {
                    if (this._payZone.enableWorking()) {
                        switch (state) {
                            case GameState.State.PRODUCT_LINE3:
                                event_html_playable.trackSetup2();
                                break;
                            case GameState.State.BUY_PAUL:
                                event_html_playable.trackWorkerBuy();
                                break;
                            case GameState.State.BUY_TRACTOR:
                                this.gotoFirstScene(0, true);
                                break;
                        }
    
                        GameState.setState(state + 1);
                    } else
                        this.gotoFirstScene(0, false);
                }
            }
        }
    }

    private _onClickOrTouch(x: number, y: number, moving:boolean) {
        if (this.loadingCtrl && this.loadingCtrl.active)
            return;
        
        SoundMgr.onFirstClick();

        if (!moving)
            this._zoneClickCount = 0;

        this._doClickOrTouch(x, y, moving);
    }

    private _onClickOrTouchMove(x: number, y: number) {
        if (this._pressing) {
            this._doClickOrTouch(x, y, true);
        }
    }

    private _doClickOrTouch(x: number, y: number, moving:boolean) {
        // console.log(x, y);
        let zoneClick:boolean = false;
        if (this._conveyer) {
            zoneClick = this._conveyer.isInZone(this._camera3d, this.uiCamera, x, y);
        } else if (this._payZone) {
            if (this.payzoneGroup) {
                const zones = this.payzoneGroup.getComponentsInChildren(PayZone);
                for (let index = 0; index < zones.length; index++) {
                    const zone = zones[index];
                    if (zone.isInZone(this._camera3d, this.uiCamera, x, y)) {
                        if (zone == this._payZone || GameState.getState() == GameState.State.BUY_TRACTOR)
                            zoneClick = true;
                        // else if (zone.unlockNodes.length == 0)
                        //     this.gotoFirstScene(0, false);
                        break;
                    }
                }
            }
            // zoneClick = this._payZone.isInZone(this._camera3d, this.uiCamera, x, y);
        }

        if (zoneClick)
            this._zoneClickCount ++;            

        if (!moving) {
            event_html_playable.interact_start();

            this._clicking = true;
            if (this._zoneClickCount > 0)
                this._pressing = true;
        }
    }

    // protected createGuest(next:boolean) {
    //     if (this._guestIndice.length > 0) {
    //         const index = this._guestIndice.pop();
    //         const guest:Node = instantiate(this.guestSamples[index]);
    //         this.guestGroup.addChild(guest);

    //         guest.getComponent(GuestController).setParams(this.path2cash, this.path2output, 
    //             this.path2back, this.cash, this.output, this._tables,
    //             this.guestGroup.children.length - 1);

    //         if (next && this._guestIndice.length) {
    //             this.scheduleOnce(()=>{
    //                 this.createGuest(true);
    //             }, randomRange(this._guestArriveInterval * 0.7, this._guestArriveInterval));
    //         }
    //     }
    // }

    protected showTutorArrow(state:number) {
        Tween.stopAllByTarget(this.tutorialArrow);

        if (this.tutorialArrow && this.tutorialPoints && state < this.tutorialPoints.length) {
            const pos = this.tutorialPoints[state];
            if (pos) {
                this.tutorialArrow.active = true;
                
                this.tutorialPoints[state].getWorldPosition(this._targetPos);
                this._targetPos1.set(this._targetPos);
                this._targetPos1.y -= 1;
                this.tutorialArrow.setWorldPosition(this._targetPos);
                // this.tutorialArrow.setWorldRotation(this.tutorialPoints[state].getWorldRotation());

                tween(this.tutorialArrow)
                .to(0.5, {position:this._targetPos1}, {easing:'quadInOut'})
                .to(0.5, {position:this._targetPos}, {easing:'quadInOut'})
                .union()
                .repeatForever()
                .start();

                const nextConveyer = pos.getParent().getComponent(ConveyerController);
                
                this._conveyer = nextConveyer;
                if (this._conveyer) {
                    this._conveyer.showTutor();
                } else {
                    this._payZone = pos.getParent().getComponent(PayZone);
                    if (this._payZone) {
                        this._payZone.showTutor();                    
                    }
                }

                return;
            }
        }
        this.tutorialArrow.active = false;
    }

    protected lateUpdate(dt: number): void {
        if (GameState.isChanged()) {
            this.tutorialArrow.active = false;

            const state = GameState.getState();
            this.scheduleOnce(()=>{
                this.showTutorArrow(state);
                this._followState = state;
                switch (state) {
                    case GameState.State.GRANDMA:
                    case GameState.State.PLATE:
                        this._cameraHeight = GameMgr.CAMERA_ORTHO_HEIGHT1;
                        break;
                    case GameState.State.PRODUCT_LINE2:
                        if (this.money) {
                            const curMoney = this.money.getMoney();
                            this.money.addMoney(this._initMoney - curMoney);
                        }
                        break;
                    case GameState.State.BUY_PAUL:
                        this._cameraHeight = GameMgr.CAMERA_ORTHO_HEIGHT2;

                        if (this.tutorialArrow) {
                            const scale = this.tutorialArrow.getScale();
                            scale.multiplyScalar(GameMgr.CAMERA_ORTHO_HEIGHT2 / GameMgr.CAMERA_ORTHO_HEIGHT1);
                            this.tutorialArrow.setScale(scale);
                        }
                        break;
                }
            }, this.followDelays[state]);

            if (state == GameState.State.END ||
                (this._version == GameMgr.VERSION.ACTION_1 && state == GameState.State.CONVEYER3) ||
                (this._version == GameMgr.VERSION.ACTION_3 && state == GameState.State.PRODUCT_LINE3)
            ) {
                this.gotoFirstScene(GameState.getState() == GameState.State.END ? 4 : 1, true);
            }
        }

        if (this.cameraNode/* && this._cameraDelay > 0.5*/) {
            if (this.cameraPosGroup && this._followState >= 0 && this._followState < this.cameraPosGroup.children.length) {
                const curCameraPosNode = this.cameraPosGroup.children[this._followState];
                this.cameraNode.getPosition(this._cameraTargetPos);

                if (!this._isGameEnd && GameState.getState() == GameState.State.SPLASH
                    && Vec3.squaredDistance(curCameraPosNode.position, this.cameraNode.position) < 0.1) {
                    GameState.setState(GameState.State.GRANDMA);

                    this.cameraNode.setPosition(curCameraPosNode.position);
                    this.cameraNode.setRotation(curCameraPosNode.rotation);

                    if (this.loadingCtrl) {
                        this.scheduleOnce(()=>{
                            this.loadingCtrl.active = false;
                            if (this.fieldPlate)
                                this.fieldPlate.startRuin();

                            GameState.setState(GameState.State.PLATE);
                        }, 6);
                    }
                } else {
                    this._cameraTargetPos.lerp(curCameraPosNode.position, dt * GameMgr.CAMERA_FOLLOW_SPEED);
                    this.cameraNode.setPosition(this._cameraTargetPos);
                    Quat.slerp(this._cameraTargetQuat, this.cameraNode.rotation, curCameraPosNode.rotation, GameMgr.CAMERA_TURN_SPEED * dt);
                    this.cameraNode.setRotation(this._cameraTargetQuat);
                }
            }

            if (this._cameraHeight > 0) {
                this._camera3d.orthoHeight = lerp(this._camera3d.orthoHeight, 
                    this._cameraHeight * (this._clicking ? this._cameraHeightScale : 1), dt * GameMgr.CAMERA_HEIGHT_SPEED);
            }
        }

        // if (!this._firstUpdate)
        //     this._cameraDelay += dt;
        // this._firstUpdate = false;

        if (GameState.dropCount > 0) {
            if (this.money) {
                const newMoney = this.money.addMoney(-GameState.dropCount * 10, true);
                GameState.dropCount = 0;
                if (newMoney <= 0)
                    this.gotoFirstScene(0, false);
            }
        }
    }

    public gotoFirstScene(delay:number, success:boolean) {
        if (this._isGameEnd) return;

        this._isGameEnd = true;

        event_html_playable.game_end();

        this.scheduleOnce(()=>{
            const scheduler = director.getScheduler();
            scheduler.unscheduleAll();
            Tween.stopAll();

            GameState.setState(GameState.State.SPLASH);

            this.node.destroy();

            SoundMgr.destroyMgr();

            director.loadScene(success ? "first" : "fail");
            
            if (success)
                event_html_playable.redirect();
        }, delay);
    }

    onToggleSound(target: Toggle) {
        SoundMgr.onSound(target.isChecked);

        event_html_playable.trackSound(target.isChecked);
    }
}


