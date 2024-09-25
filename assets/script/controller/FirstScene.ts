import { _decorator, Button, Component, Node, Tween, tween, UITransform, v3, Vec2, Vec3 } from 'cc';
import event_html_playable from '../event_html_playable';
const { ccclass, property } = _decorator;

@ccclass('FirstScene')
export class FirstScene extends Component {
    @property(Node)
    background:Node;

    @property(Node)
    logo:Node;

    @property(Node)
    logoEffect:Node;

    @property(Node)
    playButton:Node;

    @property(Node)
    gotoButton:Node;

    @property(Node)
    fail:Node;

    start() {
        if (this.logo)
            this.logo.active = false;
        if (this.logoEffect)
            this.logoEffect.active = false;
        if (this.playButton) {
            this.playButton.active = false;
            if (event_html_playable.hideAllButton())
                this.playButton = null;
        }

        if (this.gotoButton)
            this.gotoButton.active = false;

        if (this.background) {
            const temp = this.background.scale.clone();
            temp.x *= 2;
            temp.y *= 2;
            this.background.setScale(temp);
            tween(this.background)
            .to(0.3, {scale:Vec3.ONE}, {easing:'backIn',
                onComplete: (target?: object) => {
                    if (this.playButton) {
                        this.playButton.active = true;
                        this.playButton.setScale(Vec3.ZERO);
                        tween(this.playButton)
                        .to(1, {scale:Vec3.ONE}, {easing:'bounceInOut'})
                        .start();

                        tween(this.playButton)
                            .delay(1)
                            .to(0.5, { scale: v3(1.1, 1.1, 1) }, { easing: 'sineOut' })
                            .to(0.5, { scale: Vec3.ONE }, { easing: 'sineIn' })
                            .union()
                            .repeatForever()
                            .start();
                    }

                    if (this.gotoButton) {
                        this.gotoButton.active = true;
                        this.gotoButton.setScale(Vec3.ZERO);
                        tween(this.gotoButton)
                        .to(0.3, {scale:Vec3.ONE}, {easing:'bounceOut'})
                        .start();
                    }
                    
                    if (this.logo) {
                        this.logo.active = true;
                        tween(this.logo)
                        .to(0.1, {scale:v3(2, 2, 2)}, {easing:'cubicOut'})
                        .to(0.3, {scale:Vec3.ONE}, {easing:'bounceOut'})
                        .start();
                    }
                    
                    if (this.logoEffect) {
                        this.logoEffect.active = true;
                        tween(this.logoEffect)
                        .hide()
                        .delay(0.2)
                        .show()
                        .to(0.15, {scale:v3(4, 4, 4)}, {easing:'expoOut'})
                        .destroySelf()
                        .start();
                    }
                },
            })
            .start();
        }

        if (this.fail) {
            tween(this.fail)
            .to(0.3, {scale:v3(0.5,0.5,1)}, {easing:'expoOut'})
            .to(0.2, {scale:Vec3.ONE}, {easing:'expoOut'})
            .by(1, {angle:360}, {easing:'backIn'})
            .start();
        }

    }

    protected onDestroy(): void {
        Tween.stopAll();
    }

    // update(deltaTime: number) {
        
    // }

    onBtnPlay() {
        // if (this.playButton){
        //     const btn = this.playButton.getComponent(Button);
        //     if (btn)
        //         btn.enabled = false;
        // }
        event_html_playable.download();
    }
}

