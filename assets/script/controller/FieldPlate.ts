import { _decorator, BoxCollider, Collider, Component, instantiate, Node, Prefab, random, randomRange, Tween, tween, v3, Vec3 } from 'cc';
import { GameMgr } from '../manager/GameMgr';
import { CautionMark } from './CautionMark';
import { GameState } from '../manager/GameState';
import { SoundMgr } from '../manager/SoundMgr';
import { Item } from '../item/Item';
import { Utils } from '../util/Utils';
const { ccclass, property } = _decorator;

@ccclass('FieldPlate')
export class FieldPlate extends Component {
    @property(Node)
    placeGroup:Node = null;
    @property(Node)
    fixedGroup:Node = null;

    @property(CautionMark)
    cautionMark:CautionMark = null;

    @property(Prefab)
    tomatoPrefab:Prefab = null;

    @property(Node)
    wallCollider:Node = null;

    protected static LIMIT4CAUTION : number = 900;
    protected static POS_VAR : number = 2.5;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _firstCount:number = 0;

    protected start(): void {
        this.showCaution(true);        
    }

    protected lateUpdate(dt: number): void {
        if (this._firstCount < FieldPlate.LIMIT4CAUTION && this.placeGroup && this.tomatoPrefab) {
            this._firstCount += 3;

            for (let index = 0; index < 3; index++) {
                const item = instantiate(this.tomatoPrefab);
                this.placeGroup.addChild(item);

                this._tempPos.x = randomRange(-FieldPlate.POS_VAR, FieldPlate.POS_VAR);
                this._tempPos.y = randomRange(-FieldPlate.POS_VAR, FieldPlate.POS_VAR);
                this._tempPos.z = randomRange(-FieldPlate.POS_VAR, FieldPlate.POS_VAR);

                item.setPosition(this._tempPos);
                item.setRotationFromEuler(random() * 360, random() * 360, random() * 360);
            }
        }
    }

    public startRuin() {
        // if (this.wallCollider)
        //     tween(this.wallCollider)
        //     .to(6, {scale:v3(1, 0.2, 1)})
        //     .start();
    }

    public stopRuin() {
        if (this.wallCollider) {
            Tween.stopAllByTarget(this.wallCollider);
            this.wallCollider.setScale(Vec3.ONE);
        }
    }

    public clearAll() {
        this.showCaution(false);

        Utils.removeChildrenDestroy(this.placeGroup);
    }

    protected showCaution(show:boolean) {
        if (this.cautionMark)
            this.cautionMark.showCaution(show);
    }

    public setWorking(work:boolean) {
        if (this.cautionMark)
            this.cautionMark.setWorking(work);
    }

    public receiveTomato(item:Node) {
        if (item) {
            const worldPos = item.getWorldPosition();
            item.setParent(this.placeGroup);
            item.setWorldPosition(worldPos);

            if (GameState.getState() <= GameState.State.CONVEYER3)
                SoundMgr.playSound('drop');
    
            // this.showCaution(this.placeGroup.children.length > FieldPlate.LIMIT4CAUTION);

            if (this.cautionMark.node.active && GameState.getState() == GameState.State.PLATE) {
                GameState.setState(GameState.State.CONVEYER2);
            }

            if (this.placeGroup.children.length > FieldPlate.LIMIT4CAUTION) {
                const element = this.placeGroup.children[0];
                element.removeFromParent();
                element.destroy();
            } else {
                // const freezeIndex = this.placeGroup.children.length - FieldPlate.LIMIT4CAUTION / 2;
                // if (freezeIndex >= 0) {
                //     this.placeGroup.children[freezeIndex].getComponent(Item).freeze();
                // }
            }
        }
    }
}


