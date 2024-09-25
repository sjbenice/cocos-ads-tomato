import { _decorator, Color, Component, Label, Node } from 'cc';
import { SoundMgr } from '../manager/SoundMgr';
const { ccclass, property } = _decorator;

@ccclass('MoneyController')
export class MoneyController extends Component {
    @property
    money:number = 1200;

    @property(Label)
    label:Label = null;

    public static CHANGE_UNIT:number = 10;

    protected _changeAmount:number = 0;
    protected _orgOutlineColor:Color = null;

    start() {
        this.setLabelString(this.money);

        if (this.label)
            this._orgOutlineColor = this.label.outlineColor.clone();
    }

    update(deltaTime: number) {
        if (this._changeAmount != 0) {
            const amount = Math.min(MoneyController.CHANGE_UNIT, Math.abs(this._changeAmount))
            if (this._changeAmount < 0)
                this._changeAmount += amount;
            else
                this._changeAmount -= amount;

            this.setLabelString(this.money - this._changeAmount);
        }
    }

    protected setLabelString(value:number) {
        if (this.label)
            this.label.string = value.toString();
    }

    public getMoney() {
        return this.money;
    }

    public addMoney(amount:number, red:boolean = false) : number {
        let money = this.money + amount;
        if (money < 0)
            money = 0;

        this._changeAmount = money - this.money;
        this.money = money;

        if (this._changeAmount != 0) {
            this.unscheduleAllCallbacks();

            this.label.outlineColor = red ? Color.RED : this._orgOutlineColor;
            
            if (red) {
                this.scheduleOnce(() => {
                    this.label.outlineColor = this._orgOutlineColor;
                }, 0.5);
            }
        }

        if (amount > 0)
            SoundMgr.playSound('money');

        return money;
    }
}


