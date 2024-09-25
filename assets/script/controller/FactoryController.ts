import { _decorator, Component, instantiate, Node, Prefab, random, randomRange, tween, v3, Vec3 } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('FactoryController')
export class FactoryController extends Component {
    @property(Prefab)
    tomatoPrefab:Prefab = null;
    @property(Node)
    placeGroup:Node = null;

    @property(Node)
    wallCollider:Node = null;
    
    protected _tempPos:Vec3 = Vec3.ZERO.clone();

    start() {
        this.createDump(50);
    }

    public createDump(count:number) {
        if (this.placeGroup && this.tomatoPrefab) {
            for (let index = 0; index < count; index++) {
                const item = instantiate(this.tomatoPrefab);
                this.placeGroup.addChild(item);

                this._tempPos.x = randomRange(-5, 5);
                // this._tempPos.y = randomRange(0, 3);
                this._tempPos.z = randomRange(-2, 2);

                item.setPosition(this._tempPos);
                item.setRotationFromEuler(random() * 360, random() * 360, random() * 360);
            }

            this.startRuin();
        }
    }

    protected startRuin() {
        if (this.wallCollider)
            tween(this.wallCollider)
            .delay(2)
            .to(3, {scale:v3(1, 0.5, 1)})
            .start();
    }
}


