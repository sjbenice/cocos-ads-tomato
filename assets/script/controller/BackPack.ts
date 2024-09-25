import { _decorator, CCInteger, Component, instantiate, Node, Prefab, Quat, tween, v3, Vec3 } from 'cc';
import { Item } from '../item/Item';
import { SoundMgr } from '../manager/SoundMgr';
const { ccclass, property } = _decorator;

@ccclass('BackPack')
export class BackPack extends Component {
    @property(Node)
    frontPos:Node;
    @property
    protected frontItemMax:number = 16;// 24

    @property
    rows:number = 2;
    @property
    cols:number = 2;// 4

    protected _tempPos:Vec3 = Vec3.ZERO.clone();

    public getItemCount():number {
        const pos = this.frontPos;
        return pos ? pos.children.length : 0;
    }

    public isFull():boolean {
        return !this.frontPos || this.frontPos.children.length >= this.frontItemMax;
    }

    public isEmpty():boolean {
        return this.frontPos && this.frontPos.children.length == 0;
    }

    public addItem(item:Item) : boolean {
        if (this.isFull())
            return false;

        const packPos:Node = this.frontPos;
        if (!packPos)
            return false;

        item.enablePhysics(false);

        item.node.setParent(packPos);
        item.node.setRotation(Quat.IDENTITY);
        item.node.setPosition(Vec3.ZERO);
        item.node.setScale(Vec3.ONE);

        const dimension = item.getHalfDimension();
        let count: number = packPos.children.length - 1;
        this._tempPos.y = dimension.y * 2 * Math.floor(count / (this.rows * this.cols));
        count = count % (this.rows * this.cols);
        this._tempPos.x = dimension.x * 2 * ((count % this.cols) - this.cols / 2) + dimension.x;
        this._tempPos.z = dimension.z * 2 * (Math.floor(count / this.cols) - this.rows / 2) + dimension.z;
        item.node.setPosition(this._tempPos);
        // item.scaleEffect(0.3);

        SoundMgr.playSound("catch");

        return true;
    }

    public dropOne(worldPos:Vec3 = null) : Item {
        const packPos:Node = this.frontPos;
        if (packPos) {
            for (let index = packPos.children.length - 1; index >= 0; index--) {
                const element = packPos.children[index];
                const item:Item = element.getComponent(Item);
                if (worldPos){
                    const pos = element.getWorldPosition();
                    worldPos.set(pos.x, pos.y, pos.z);
                }
                packPos.removeChild(element);

                const yDelta : number = item.getHalfDimension().y * 2;
                for (let j = index; j < packPos.children.length; j++) {
                    const element = packPos.children[j];
                    element.setPosition(v3(0, element.position.y - yDelta, 0));
                }

                // SoundMgr.playSound("catch");

                return item;
            }
        }

        return null;
    }
}


