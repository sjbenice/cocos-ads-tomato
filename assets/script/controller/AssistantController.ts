import { _decorator, Component, Node, NodeSpace, Quat, randomRange, SkeletalAnimation, toDegree, toRadian, Vec3 } from 'cc';
import { PlayerController } from './PlayerController';
import { Item } from '../item/Item';
import { getForward, signedAngleVec3 } from '../util/Math';
const { ccclass, property } = _decorator;

@ccclass('AssistantController')
export class AssistantController extends PlayerController{
    static State = {
        WAIT: -1,
        TO_OUTPUT: 0,
        CATCH: 1,
        TO_TRUCK: 2,
    };

    @property(Node)
    outputNode:Node = null;

    @property(Node)
    truckNode:Node = null;

    @property
    workRange:number = 2.5;

    @property(Node)
    inputPos:Node = null;

    protected _outputPos:Vec3 = null;
    protected _truckPos:Vec3 = null;

    private _moveInput:Vec3 = Vec3.ZERO.clone();
    private _targetPos:Vec3 = Vec3.ZERO.clone();
    private _curPos:Vec3 = Vec3.ZERO.clone();

    private _state:number = AssistantController.State.TO_TRUCK;
    private _moving:boolean = false;

    protected _catchInterval:number = 0;
    protected _catchTimer:number = 0;

    protected static _viewDir:Vec3 = Vec3.ZERO.clone();
    protected _tempPos:Vec3 = Vec3.ZERO.clone();
    protected _velocity:Vec3 = Vec3.ZERO.clone();

    public isBot() : boolean {
        return true;
    }

    start() {
        super.start();

        if (this.outputNode)
            this._outputPos = this.outputNode.getPosition();
        if (this.truckNode)
            this._truckPos = this.truckNode.getPosition();
    }

    protected moveTo(targetPos:Vec3) {
        this._targetPos.set(targetPos);
        this._targetPos.y = 0;

        this._moving = true;
    }

    public static faceViewCommon(movementInput: Vec3, deltaTime: number, moveNode:Node, turnAngleSpeed) {
        AssistantController._viewDir.set(movementInput);
        AssistantController._viewDir.y = 0.0;
        AssistantController._viewDir.normalize();

        const characterDir = getForward(moveNode);
        characterDir.y = 0.0;
        characterDir.normalize();

        const currentAimAngle = signedAngleVec3(characterDir, AssistantController._viewDir, Vec3.UNIT_Y);
        const currentAimAngleDegMag = toDegree(Math.abs(currentAimAngle));

        const maxRotDegMag = turnAngleSpeed > 0 ? turnAngleSpeed * deltaTime : currentAimAngleDegMag;
        const rotDegMag = Math.min(maxRotDegMag, currentAimAngleDegMag);
        const q = Quat.fromAxisAngle(new Quat(), Vec3.UNIT_Y, Math.sign(currentAimAngle) * toRadian(rotDegMag));
        moveNode.rotate(q, NodeSpace.WORLD);

        return currentAimAngleDegMag;
    }

    update(deltaTime: number) {
        if (this._moving) {
            this.node.getWorldPosition(this._tempPos);

            Vec3.subtract(this._velocity, this._targetPos, this._tempPos);
            const distance = this._velocity.lengthSqr();

            this._velocity.normalize();
            this._velocity.multiplyScalar(deltaTime * this.baseSpeed);
            if (this._velocity.length() > distance) {
                this._tempPos.set(this._targetPos);
            } else {
                this._tempPos.add(this._velocity);
            }

            if (distance < 0.1) {
                this.node.setWorldPosition(this._targetPos);
                this._moving = false;
            } else {
                AssistantController.faceViewCommon(this._velocity, deltaTime, this.node, this.turnAngleSpeed);
                this.node.setWorldPosition(this._tempPos);
            }
        }

        switch (this._state) {
            case AssistantController.State.TO_OUTPUT:
                if (!this._moving) {
                    this._state = AssistantController.State.CATCH;
                    this._catchTimer = 0;
                }
                break;
            case AssistantController.State.CATCH:
                if (this.isPackFull()) {
                    this._state = AssistantController.State.TO_TRUCK;
                    this.moveTo(this._truckPos);
                } else if (!this._moving) {
                    this._catchTimer += deltaTime;
                    if (this._catchTimer >= this._catchInterval) {
                        this._catchTimer = 0;

                        if (this.inputPos && this.inputPos.children.length > 0) {
                            const good = this.inputPos.children[this.inputPos.children.length - 1];
                            const item = good.getComponent(Item);
                            if (item) {
                                item.setBodyYEuler(0);
                                this.catchItem(item);
                            }
                        }
                    }
                    // this._targetPos.set(this._outputPos);
                    // this._targetPos.x += randomRange(-this.workRange, this.workRange);
                    // this._targetPos.z += randomRange(-this.workRange, this.workRange);
                    // this._moving = true;
                }
                break;
            case AssistantController.State.TO_TRUCK:
                if (this.isPackEmpty()) {
                    this._state = AssistantController.State.TO_OUTPUT;
                    this.moveTo(this._outputPos);
                }
                break;
        }

        // super.update(deltaTime);
    }
}


