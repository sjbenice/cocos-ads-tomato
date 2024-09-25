const { ccclass, property } = _decorator;
import { _decorator, animation, Camera, Canvas, Collider, Component, EventMouse, EventTouch, ICollisionEvent, ITriggerEvent, lerp, math, Node, NodeSpace, Quat, renderer, SkeletalAnimation, toDegree, toRadian, v2, v3, Vec2, Vec3 } from 'cc';
import { CharacterStatus } from './CharacterStatus';
import { getForward, signedAngleVec3 } from '../util/Math';

@ccclass('AvatarController')
export class AvatarController extends Component {
    // @injectComponent(animation.AnimationController)
    private _skeletalAnimation:SkeletalAnimation = null;

    @_decorator.property
    public baseSpeed = 3.0;

    @_decorator.property
    public mouseTurnSpeed = 1.0;

    @_decorator.property({ unit: '°/s' })
    public turnAngleSpeed = 270;

    @_decorator.property(Node)
    public input: Node | null = null;

    @property(Camera)
    public camera:Camera = null;

    private _charStatus: CharacterStatus;

    private _turnEnabled:boolean = false;
    private _cameraOffset:Vec3 = null;
    private _cameraHeight:number = 0;
    private _cameraHeightSpeed:number = 4;
    private _cameraHeightScale:number = 0.8;
    private _cameraForward:Vec3 = Vec3.ZERO.clone();
    private _cameraRight:Vec3 = Vec3.ZERO.clone();

    private _curAnimName:string = null;
    private _initIdleAnimName:string = null;

    start() {
        this._charStatus = this.node.addComponent(CharacterStatus);
        this._charStatus.setBaseSpeed(this.baseSpeed);
        
        this._skeletalAnimation = this.getComponent(SkeletalAnimation);
        if (!this._skeletalAnimation)
            this._skeletalAnimation = this.getComponentInChildren(SkeletalAnimation);
        this._initIdleAnimName = this._skeletalAnimation.defaultClip.name;

        if (this.camera) {
            this._cameraOffset = this.camera.node.getWorldPosition().subtract(this.node.getWorldPosition());
            if (this.camera.projection == renderer.scene.CameraProjection.ORTHO)
                this._cameraHeight = this.camera.orthoHeight;
        }
        
        const collider = this.getComponent(Collider);
        if (collider) {
            collider.on('onCollisionEnter', this.onCollisionEnter, this);
            collider.on('onCollisionStay', this.onCollisionStay, this);
            collider.on('onCollisionExit', this.onCollisionExit, this);
            collider.on('onTriggerEnter', this.onTriggerEnter, this);
        }
    }

    onDestroy() {
        const collider = this.getComponent(Collider);
        if (collider) {
            collider.off('onCollisionEnter', this.onCollisionEnter, this);
            collider.off('onCollisionStay', this.onCollisionStay, this);
            collider.off('onCollisionExit', this.onCollisionExit, this);
            collider.off('onTriggerEnter', this.onTriggerEnter, this);
        }
    }

    onCollisionEnter(event: ICollisionEvent) {
        this.doCollisionEnter(event);
    }

    onCollisionStay(event: ICollisionEvent) {
        this.doCollisionStay(event);
    }

    onCollisionExit(event: ICollisionEvent) {
        this.doCollisionExit(event);
    }

    onTriggerEnter (event: ITriggerEvent) {
        this.doTriggerEnter(event);
    }

    protected doCollisionEnter(event: ICollisionEvent){

    }

    protected doCollisionStay(event: ICollisionEvent){

    }

    protected doCollisionExit(event: ICollisionEvent){

    }

    protected doTriggerEnter(event: ITriggerEvent){

    }

    protected canMove() {
        return true;
    }

    protected sholdStopImmediate() {
        return this.turnAngleSpeed == 0;
    }

    protected getMaxSpeed(){
        return this.baseSpeed;
    }

    protected getAnimationName(idle:boolean): string {
        return idle ? this.getIdleAnimationName() : this.getWalkAnimationName();
    }

    protected getIdleAnimationName(): string {
        return this._initIdleAnimName;
    }

    protected getWalkAnimationName(): string {
        return 'run';
    }

    protected setAnimationSpeed(speed:number){
        const newAnim = this.getAnimationName(speed == 0);
        if (newAnim != this._curAnimName) {
            this._skeletalAnimation.play(newAnim);
            this._curAnimName = newAnim;
        }
    }

    private _onMouseDown (event: EventMouse) {
        switch (event.getButton()) {
            default:
                break;
            case EventMouse.BUTTON_RIGHT:
                this._turnEnabled = true;
                break;
        }
    }

    private _onMouseMove (event: EventMouse) {
        if (this._turnEnabled) {
            const dx = event.getDeltaX();
            if (dx) {
                const angle = -dx * this.mouseTurnSpeed;
                this.node.rotate(
                    math.Quat.rotateY(new math.Quat(), math.Quat.IDENTITY, math.toRadian(angle)),
                    Node.NodeSpace.WORLD,
                );
            }
        }
    }

    private _onMouseUp (event: EventMouse) {
        switch (event.getButton()) {
            default:
                break;
            case EventMouse.BUTTON_RIGHT:
                this._turnEnabled = false;
                break;
        }
    }

    private _onTouchBegin (eventTouch: EventTouch) {
        
    }

    private _onTouchMove (eventTouch: EventTouch) {
        if (eventTouch.getTouches().length === 1) {
            const dx = eventTouch.getUIDelta().x;
            if (dx) {
                const angle = -dx * this.mouseTurnSpeed;
                this.node.rotate(
                    math.Quat.rotateY(new math.Quat(), math.Quat.IDENTITY, math.toRadian(angle)),
                    Node.NodeSpace.WORLD,
                );
            }
        }
    }

    convertScreenDirectionToWorldDirection(screenDirection: Vec2): Vec3 {
        // Get the forward and right vectors of the camera
        this._cameraForward.set(this.camera.node.forward).normalize();
        this._cameraRight.set(this.camera.node.right).normalize();

        // Combine the forward and right vectors with the screen direction
        const worldDirection = this._cameraRight.multiplyScalar(screenDirection.x).add(this._cameraForward.multiplyScalar(screenDirection.y));
        
        // Make sure the direction is only on the XZ plane
        worldDirection.y = 0;
        worldDirection.normalize();

        worldDirection.multiplyScalar(screenDirection.length());

        return worldDirection;
    }

    protected fetchMovementInput() : Vec3 {
        return null;
    }

    protected faceView(movementInput: math.Vec3, deltaTime: number, moveNode:Node=null, turnAngleSpeed:number=-1) {
        if (!moveNode)
            moveNode = this.node;
        
        const viewDir = v3(movementInput);
        viewDir.y = 0.0;
        viewDir.normalize();

        const characterDir = getForward(moveNode);
        characterDir.y = 0.0;
        characterDir.normalize();

        const currentAimAngle = signedAngleVec3(characterDir, viewDir, Vec3.UNIT_Y);
        const currentAimAngleDegMag = toDegree(Math.abs(currentAimAngle));

        if (turnAngleSpeed < 0)
            turnAngleSpeed = this.turnAngleSpeed;

        const maxRotDegMag = turnAngleSpeed > 0 ? this.turnAngleSpeed * deltaTime : currentAimAngleDegMag;
        const rotDegMag = Math.min(maxRotDegMag, currentAimAngleDegMag);
        const q = Quat.fromAxisAngle(new Quat(), Vec3.UNIT_Y, Math.sign(currentAimAngle) * toRadian(rotDegMag));
        moveNode.rotate(q, NodeSpace.WORLD);

        return currentAimAngleDegMag;
    }

    private _getViewDirection(out: Vec3) {
        if (!this.camera) {
            return Vec3.set(out, 0, 0, -1);
        } else {
            return Vec3.negate(out, getForward(this.camera.node));
        }
    }

    private _applyInput(movementInput: Readonly<Vec3>) {
        const inputVector = new Vec3(movementInput);

        // math.Vec3.normalize(inputVector, inputVector);
        math.Vec3.multiplyScalar(inputVector, inputVector, this.getMaxSpeed());

        // const viewDir = this._getViewDirection(new Vec3());
        // viewDir.y = 0.0;
        // Vec3.normalize(viewDir, viewDir);

        // const q = Quat.rotationTo(new Quat(), Vec3.UNIT_Z, viewDir);
        // Vec3.transformQuat(inputVector, inputVector, q);

        this._charStatus.velocity = inputVector;
    }

    public stopAvatar(immediate:boolean = false) {
        if (immediate)
            this._charStatus.setVelocityImmediate(math.Vec3.ZERO);
        else
            this._charStatus.velocity = math.Vec3.ZERO;

        this.setAnimationSpeed(0);
    }

    update(deltaTime: number) {
        if (this.canMove()) {
            const movementInput = this.fetchMovementInput();
            if (movementInput){
                const { _charStatus: characterStatus } = this;
                const { localVelocity } = characterStatus;
        
                const shouldMove = !Vec3.equals(movementInput, Vec3.ZERO, 1e-2);
                // if (this._animationController)
                //     this._animationController.setValue('ShouldMove', shouldMove);
                if (shouldMove) {
                    if (!Vec3.equals(movementInput, Vec3.ZERO)) {
                        this.faceView(movementInput, deltaTime);
                    }
        
                    this._applyInput(movementInput);
                    const velocity2D = new math.Vec2(localVelocity.x, localVelocity.z);
                    this.setAnimationSpeed(velocity2D.length());
            
                    if (this.camera) {
                        // Lerp the camera's position towards the target position
                        let targetPosition = this.node.getWorldPosition().add(this._cameraOffset);
                        this.camera.node.setWorldPosition(this.camera.node.getWorldPosition().lerp(targetPosition, 0.1));

                        if (this._cameraHeight > 0) {
                            this.camera.orthoHeight = lerp(this.camera.orthoHeight, this._cameraHeight * this._cameraHeightScale, deltaTime * this._cameraHeightSpeed);
                        }
                    }
                    return;
                }
            }
        }

        if (this.camera && this._cameraHeight > 0) {
            this.camera.orthoHeight = lerp(this.camera.orthoHeight, this._cameraHeight, deltaTime * this._cameraHeightSpeed);
        }
        
        this.stopAvatar();        
    }

    // public lateUpdate() {
        // this._animationController.setValue('Jump', false);
        // this._animationController.setValue('Kick', false);
    // }
}


