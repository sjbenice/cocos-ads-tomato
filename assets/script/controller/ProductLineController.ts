import { _decorator, Component, instantiate, Node, ParticleSystem, Prefab, Quat, randomRange, tween, v3, Vec3 } from 'cc';
import { Item } from '../item/Item';
import { KetchupOutputController } from './KetchupOutputController';
const { ccclass, property } = _decorator;

@ccclass('ProductLineController')
export class ProductLineController extends Component {
    @property(Node)
    sourceGroup:Node = null;

    @property(Node)
    inputPos:Node = null;

    @property(Node)
    linePos:Node = null;

    @property(Node)
    outputPos:Node = null;

    @property(Node)
    lineGroup:Node[] = [];

    @property(Prefab)
    ketchupPrefab:Prefab = null;

    @property(ParticleSystem)
    effectVfx:ParticleSystem = null;

    public static MAX_OUTPUT:number = 300;

    public static PERIOD:number = 0.3;
    public static LINE_SPEED:number = 5;
    public static PRODUCT_SPEED:number = 1;

    public static RANGE_XZ:number = 0.5;
    public static DISTANCE_Z1:number = 3.5;
    public static DISTANCE_Z2:number = 4.5;
    public static DROP_Y1:number = 0.4;
    public static DROP_Y2:number = 1;

    protected _timer:number = 0;
    protected _workCount:number = 0;

    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _tempQuat:Quat = new Quat();

    protected _output:KetchupOutputController = null;

    protected onLoad(): void {
        if (this.outputPos)
            this._output = this.outputPos.getComponent(KetchupOutputController);
    }

    update(deltaTime: number) {
        this._timer += deltaTime;
        if (this._timer >= ProductLineController.PERIOD) {
            this._timer = 0;

            if (this.sourceGroup && this.sourceGroup.children.length > 0) {
                const tomato = this.sourceGroup.children[0];
                tomato.setParent(this.inputPos);
                tomato.setRotation(Quat.IDENTITY);

                const item = tomato.getComponent(Item);
                if (item) {
                    item.enablePhysics(false);
                    item.displayShadow(true);
                }

                tomato.setPosition(Vec3.ZERO);
                const pos = v3(randomRange(-ProductLineController.RANGE_XZ, ProductLineController.RANGE_XZ), 0, randomRange(-ProductLineController.RANGE_XZ, ProductLineController.RANGE_XZ));
                tomato.setPosition(pos);

                pos.z += ProductLineController.DISTANCE_Z1;

                const pos2 = pos.clone();
                pos2.y -= ProductLineController.DROP_Y1;
                pos2.z += ProductLineController.DISTANCE_Z2;

                const pos3 = pos2.clone();
                pos3.y -= ProductLineController.DROP_Y2;

                tween(tomato)
                .to(ProductLineController.DISTANCE_Z1 / ProductLineController.LINE_SPEED, {position:pos})
                .call(()=>{
                    item.flat();
                    pos.y = pos2.y;
                    item.node.setPosition(pos);
                })
                .to(ProductLineController.DISTANCE_Z2 / ProductLineController.LINE_SPEED, {position:pos2})
                .to(0.5, {position:pos3})
                .destroySelf()
                .call(()=>{
                    this._workCount ++;
                })
                .start();
            }
        }

        if (this.ketchupPrefab && this.lineGroup && this.outputPos && 
            this._workCount > 0 && this._workCount >= ProductLineController.PRODUCT_SPEED) {
            this._workCount -= ProductLineController.PRODUCT_SPEED;
            this.lineGroup.forEach(group => {
                const ketchup = instantiate(this.ketchupPrefab);
                this.linePos.addChild(ketchup);
                ketchup.setPosition(group.children[0].position);
                ketchup.setScale(Vec3.ZERO);

                const item = ketchup.getComponent(Item);
                item.enablePhysics(false);
                item.displayShadow(true);

                const tw = tween(ketchup);

                tw.parallel(
                    tween().to(0.2, { scale: Vec3.ONE }),
                    tween().to(0.2, { position: group.children[1].position })
                );

                tw.call(()=>{
                    item.setBodyYEuler(-50);
                });

                for (let index = 2; index < group.children.length; index++) {
                    const distance = Vec3.distance(group.children[index - 1].position, group.children[index].position);
                    tw.to(distance / ProductLineController.LINE_SPEED, {position:group.children[index].position});
                }

                tw.call(() => {
                    // ketchup.getWorldPosition(this._tempPos);
                    // ketchup.setParent(this.outputPos);
                    // this._tempPos.y += 4;
                    // ketchup.setWorldPosition(this._tempPos);
                    // Quat.fromEuler(this._tempQuat, randomRange(0, 360), randomRange(0, 360), randomRange(0, 360))
                    // ketchup.rotate(this._tempQuat);

                    // item.enablePhysics(true);
                    ketchup.setRotation(Quat.IDENTITY);
                    item.displayShadow(false);

                    // if (this.outputPos.children.length > ProductLineController.MAX_OUTPUT) {
                    //     const one = this.outputPos.children[0];
                    //     one.removeFromParent();
                    //     one.destroy();
                    // }

                    this._output.arrange(item);
                })
                .start();
            });
        }
    }
}


