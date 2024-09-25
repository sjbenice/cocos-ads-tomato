export class GameState {
    static State = {
        SPLASH: -1,
        GRANDMA: 0,
        PLATE: 1,
        CONVEYER2: 2,
        CONVEYER3: 3,
        PRODUCT_LINE2: 4,
        PRODUCT_LINE3: 5,
        BUY_PAUL:6,
        BUY_TRACTOR:7,
        END: 8,
    };

    protected static _state: number = GameState.State.SPLASH;
    protected static _isChanged:boolean = false;
    public static dropCount:number = 0;

    public static setState(state:number) {
        if (GameState._state != state) {
            GameState._state = state;
            GameState._isChanged = true;
        }
    }

    public static getState(): number {
        return GameState._state;
    }

    public static isChanged() : boolean {
        const ret = GameState._isChanged;
        GameState._isChanged = false;
        return ret;
    }

    public static isFail() : boolean {
        return GameState.dropCount > 150;
    }
}


