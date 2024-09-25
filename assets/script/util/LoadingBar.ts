import { _decorator, Component, Node, ProgressBar, sys } from 'cc';
import { GameState } from '../manager/GameState';
const { ccclass, property } = _decorator;

@ccclass('LoadingBar')
export class LoadingBar extends Component {
    @property(ProgressBar)
    progressBar:ProgressBar = null;

    protected _maxSeconds:number = 8;
    protected _timer:number = 0;

    protected _finished:boolean = false;

    start() {
        if (!this.progressBar)
            this.progressBar = this.getComponent(ProgressBar);
    }

    update(deltaTime: number) {
        if (this.progressBar && !this._finished) {
            this._timer += deltaTime;
            let progress = this._timer / this._maxSeconds;
            if (progress >= 1) {
                progress = 1;
                this._finished = true;
                // this.scheduleOnce(()=>{
                //     this.node.parent.active = false;
                // }, 0.3);
                // GameState.setState(GameState.State.PLATE);
            }
            this.progressBar.progress = progress;
        }
    }
}


