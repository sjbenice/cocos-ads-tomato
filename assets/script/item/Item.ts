import { _decorator, BoxCollider, CapsuleCollider, Collider, Component, EAxisDirection, ERigidBodyType, ICollisionEvent, instantiate, Node, Prefab, Quat, RigidBody, SphereCollider, sys, Tween, tween, v3, Vec3 } from 'cc';
import { PHY_GROUP } from '../manager/Layers';
import { SoundMgr } from '../manager/SoundMgr';
import { LoosingProfit } from './LoosingProfit';
import { GameState } from '../manager/GameState';
const { ccclass, property } = _decorator;

@ccclass('Item')
export class Item extends Component {
    @property(Node)
    bodyMesh:Node = null;

    @property(Node)
    flatten:Node = null;

    @property(Node)
    shadow:Node = null;
    
    @property(Prefab)
    profitPrefab:Prefab = null;

    private _halfDimension:Vec3 = null;
    private _orgScale:Vec3 = null;

    private _animating:boolean = false;

    private _collider:Collider = null;
    private _rigidBody:RigidBody = null;
    private _tempPos:Vec3 = Vec3.ZERO.clone();
    private _postDisablePhysics:boolean = false;

    private static _profitTimer:number = 0;
    private static _profitInterval:number = 200;

    public isAnimating(): boolean {
        return this._animating;
    }

    public getHalfDimension(force:boolean = false) : Vec3 {
        if (force || this._halfDimension == null){
            let ret:Vec3 = null;
            const collider: Collider = this.node.getComponent(Collider);
            if (collider) {
                if (collider instanceof BoxCollider){
                    const box:BoxCollider = collider as BoxCollider;
                    ret = box.size.clone();
                    ret.x /= 2;
                    ret.y /= 2;
                    ret.z /= 2;
                }else if (collider instanceof CapsuleCollider){
                    const capsule:CapsuleCollider = collider as CapsuleCollider;
                    const longSide:number = capsule.cylinderHeight / 2 + capsule.radius;
                    switch (capsule.direction) {
                        case EAxisDirection.X_AXIS:
                            ret = v3(longSide, capsule.radius, capsule.radius);
                            break;
                        case EAxisDirection.Y_AXIS:
                            ret = v3(capsule.radius, longSide, capsule.radius);
                            break;
                        case EAxisDirection.Z_AXIS:
                            ret = v3(capsule.radius, capsule.radius, longSide);
                            break;
                    }
                } else if (collider instanceof SphereCollider) {
                    const sphere:SphereCollider = collider as SphereCollider;
                    ret = v3(sphere.radius, sphere.radius, sphere.radius);
                }
                else{
                    ret = collider.worldBounds.halfExtents.clone();
                }
            } else
                console.log('collider is null');

            ret.x *= this.node.scale.x;
            ret.y *= this.node.scale.y;
            ret.z *= this.node.scale.z;

            const currentRotation = this.node.eulerAngles;
            if (currentRotation.z == 90) {
                const temp = ret.y;
                ret.y = ret.x;
                ret.x = temp;
            }

            this._halfDimension = ret;
        }
        return this._halfDimension;
    }

    public rotateIfColumn() : boolean {
        if (this._halfDimension == null)
            this.getHalfDimension();

        let ret = false;
        const currentRotation = this.node.eulerAngles;
        if (this._halfDimension.y > this._halfDimension.x) {
            const temp = this._halfDimension.y;
            this._halfDimension.y = this._halfDimension.x;
            this._halfDimension.x = temp;

            this.node.setRotationFromEuler(0, currentRotation.y, 90);
            ret = true;
        }else
            this.node.setRotationFromEuler(0, currentRotation.y, 0);

        return ret;
    }

    public prepareForProduct() {
        const currentRotation = this.node.eulerAngles;
        this.node.setRotationFromEuler(0, 0, currentRotation.z);
        // this.getHalfDimension(true);
    }

    public scaleEffect(period:number) {
        this._animating = true;

        this._orgScale = this.node.scale.clone();
        this.node.setScale(Vec3.ZERO);
        tween(this.node)
            .to(period, {scale:this._orgScale}, {easing:'bounceOut',
                onComplete: (target?: object) => {
                    this._orgScale = null;
                    this._animating = false;
                }
            })
            .start();
    }

    public stopScaleEffect() {
        if (this._orgScale) {
            Tween.stopAllByTarget(this.node);
            this.node.setScale(this._orgScale);
            this._orgScale = null;
            this._animating = false;
        }
    }

    protected onLoad(): void {
        this._collider = this.getComponent(Collider);
        this._rigidBody = this.getComponent(RigidBody);

        this.displayShadow(false);
    }

    protected start(): void {
        if (this._postDisablePhysics) {
            this.enablePhysics(false);
            this._postDisablePhysics = false;
        }

        if ((this.flatten || this.profitPrefab) && this._collider) {
            this._collider.on('onCollisionEnter', this.onCollisionEnter, this);
        }
    }

    protected onDestroy(): void {
        this.removeCollisionListener();
    }
    
    protected removeCollisionListener() {
        if ((this.flatten || this.profitPrefab) && this._collider) {
            this._collider.off('onCollisionEnter', this.onCollisionEnter, this);
        }
    }

    onCollisionEnter(event: ICollisionEvent) {
        const otherCollider = event.otherCollider;
        if (otherCollider) {
            const otherNode = otherCollider.node;
            if (otherNode) {
                if (otherCollider.getGroup() == PHY_GROUP.PLANE) {
                    if (this.flatten) {
                        const contacts = event.contacts;
                        if (contacts && contacts.length) {
                            contacts[0].getWorldPointOnA(this._tempPos);
            
                            this.node.setWorldPosition(this._tempPos);
                            this.node.setRotation(Quat.IDENTITY);
                            
                            this.flat();
                        }
                    }
                    if (this.profitPrefab) {
                        if (Item._profitTimer == 0 || Item._profitTimer + Item._profitInterval < sys.now()) {
                            Item._profitTimer = sys.now();

                            const loosingProfit = instantiate(this.profitPrefab);
                            this.node.parent.addChild(loosingProfit);
                            this.node.getWorldPosition(this._tempPos);
                            loosingProfit.setWorldPosition(this._tempPos);
                        }
                        
                        this.scheduleOnce(()=>{
                            this.node.removeFromParent();
                            this.node.destroy();
                        }, LoosingProfit.TIME);
                        
                        this.removeCollisionListener();

                        GameState.dropCount ++;
                    }
                }
            }
        }
    }

    public enablePhysics(enable:boolean) {
        if (this._rigidBody)
            this._rigidBody.enabled = enable;
        else if (!enable)
            this._postDisablePhysics = true;

        if (this._collider)
            this._collider.enabled = enable;
    }

    public isPhysicsEnabled() {
        return this._postDisablePhysics || (this._rigidBody && this._rigidBody.enabled);
    }

    public displayShadow(enable:boolean) {
        if (this.shadow)
            this.shadow.active = enable;
    }

    public isFlatten() : boolean {
        return (this.flatten && this.flatten.active);
    }

    public flat() {
        this.enablePhysics(false);
        this.displayShadow(false);
            
        if (this.bodyMesh)
            this.bodyMesh.active = false;

        if (this.flatten)
            this.flatten.active = true;

        this.scheduleOnce(() => {
            this.node.removeFromParent();
            this.node.destroy();
        }, 2);
    }

    public freeze(enable:boolean = true) {
        if (this._rigidBody)
            this._rigidBody.type = enable ? ERigidBodyType.STATIC : ERigidBodyType.DYNAMIC;
    }

    public setBodyYEuler(angle:number) {
        if (this.bodyMesh) {
            this._tempPos.set(0, angle, 0);
            this.bodyMesh.setRotationFromEuler(this._tempPos);
        }
    }
}


