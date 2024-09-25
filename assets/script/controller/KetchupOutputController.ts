import { _decorator, Component, instantiate, Node, Prefab, Quat, random, randomRange, Vec3 } from 'cc';
import { Item } from '../item/Item';
import { CautionMark } from './CautionMark';
import { SoundMgr } from '../manager/SoundMgr';
import { GameState } from '../manager/GameState';
import { Utils } from '../util/Utils';
const { ccclass, property } = _decorator;

@ccclass('KetchupOutputController')
export class KetchupOutputController extends Component {
    @property(Prefab)
    ketchupPrefab:Prefab = null;
    @property(Node)
    placeGroup:Node = null;

    @property(CautionMark)
    caution:CautionMark = null;
    
    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _halfBounds:Vec3 = Vec3.ZERO.clone();
    protected _itemHalfBounds:Vec3 = null;

    protected _isRuining:boolean = false;

    protected _tempQuat:Quat = new Quat();

    protected _oneSetCount:number = 152;

    start() {
        if (this.placeGroup && this.placeGroup.children.length > 0) {
            const node = this.placeGroup.children[0];
            node.getScale(this._halfBounds);
            this._halfBounds.multiplyScalar(0.5);
            this._halfBounds.y /= 2;
            node.removeFromParent();
            node.destroy();
        }

        if (this.placeGroup && this.ketchupPrefab) {
            for (let index = 0; index < this._oneSetCount * 2; index++) {
                const item = instantiate(this.ketchupPrefab);
                const ketchup = item.getComponent(Item);
                this.arrange(ketchup, false);
            }
        }

        if (this.caution)
            this.caution.showCaution(false);
    }

    protected doArrange(item:Item, effect:boolean) : boolean {
        KetchupOutputController.calcArrangePos(this._halfBounds, this._itemHalfBounds, 
            this.placeGroup.children.length - 1, this._tempPos);

        item.node.setPosition(this._tempPos);
        item.setBodyYEuler(-90);

        if (effect && this.placeGroup.activeInHierarchy)
            item.scaleEffect(randomRange(0.2, 0.4));
        item.enablePhysics(false);

        return true;
    }

    public arrange(item:Item, effect:boolean=true) {
        if (item) {
            if (this._isRuining) {
                if (this.node.children.length == 0) {
                    this._isRuining = false;
                    if (this.caution)
                        this.caution.showCaution(false);
                } else {
                    if (this.caution)
                        this.caution.showCaution(true);
                    this.ruin(Math.floor(100 / randomRange(5, 10)));
                }
                item.node.removeFromParent();
                item.node.destroy();
            } else {
                if (effect && GameState.getState() < GameState.State.BUY_PAUL) {
                    item.node.removeFromParent();
                    item.destroy();
                } else {
                    this.placeGroup.addChild(item.node);

                    if (!this._itemHalfBounds)
                        this._itemHalfBounds = item.getHalfDimension().clone();
                    
                    this.doArrange(item, effect);

                    if (this.placeGroup.children.length <= this._oneSetCount * 3) {
                        if (GameState.getState() == GameState.State.BUY_PAUL) {// Speed up x2
                            for (let index = 0; index < 3; index++) {
                                const tomato = instantiate(this.ketchupPrefab);
                                this.placeGroup.addChild(tomato);
                                this.doArrange(tomato.getComponent(Item), effect);
                            }
                        } else {
                            if (this.caution) {
                                this.caution.showCaution(false);
                            }
                        }
                    } else {
                        if (GameState.getState() >= GameState.State.BUY_PAUL) {
                            if (this.placeGroup.children.length > this._oneSetCount * 4)
                                this._isRuining = true;
                            // item.node.setPosition(Vec3.ZERO);
    
                            if (this.caution) {
                                this.caution.showCaution(true);
                            }
                        } else {
                            Utils.removeChildrenDestroy(this.placeGroup);
                        }
                    }
                }
            }
        }
    }
    
    protected ruin(count:number) {
        if (this._isRuining) {
            let j = this.node.children.length - 1;
            for (let i = 0; i < count; i++) {
                while (j >= 0) {
                    const element = this.node.children[j--];
                    const item = element.getComponent(Item);
                    if (item && !item.isPhysicsEnabled()) {
                        item.enablePhysics(true);
    
                        item.node.getPosition(this._tempPos);
                        this._tempPos.x -= randomRange(-1, 1) * this._tempPos.y / 2;
                        this._tempPos.z += randomRange(-1, 1) * this._tempPos.y / 2;
                        item.node.setPosition(this._tempPos);
                        this._tempPos.z = random() * 180;
                        this._tempPos.y = random() * 180;
                        item.node.setRotationFromEuler(this._tempPos);

                        break;
                    }
                }
            }
        }
    }

    public static calcArrangePos(placeHalfDimention:Vec3, itemHalfDimention:Vec3, index:number, outPos:Vec3) : boolean {
        const dimen: Vec3 = placeHalfDimention;
        const itemDimen: Vec3 = itemHalfDimention;
        const rows : number = Math.floor(dimen.z / itemDimen.z);
        const cols : number = Math.floor(dimen.x / itemDimen.x);

        const y:number = Math.floor(index / (rows * cols)) * itemDimen.y * 2;// + itemDimen.y;
        index = index % (rows * cols);
        const z:number = Math.floor(index / cols) * itemDimen.z * 2 + itemDimen.z - rows * itemDimen.z;
        const x:number = Math.floor(index % cols) * itemDimen.x * 2 + itemDimen.x - cols * itemDimen.x;

        outPos.set(x, y, z);

        return y < placeHalfDimention.y;
    }
}


