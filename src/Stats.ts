export class StatData {
    public gameCount = 0;
    public handCount = 0;
    /** first index is place-1, second index is player */
    public placeCounts = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]];
    /** index is player */
    public scoreTotals = [0, 0, 0, 0];
    /** index is player */
    public bestScores = [999, 999, 999, 999];
    /** index is player */
    public worstScores = [0, 0, 0, 0];
    /** index is player */
    public moonCount = [0, 0, 0, 0];
    /** index is player */
    public queenCount = [0, 0, 0, 0];

    constructor();
    constructor(jsonString: string);
    constructor(jsonString?: string) {
        if (jsonString) {
            // copy constructor
            const obj = JSON.parse(jsonString) as StatData;

            this.gameCount = obj.gameCount;
            this.handCount = obj.handCount;
            this.placeCounts = obj.placeCounts;
            this.scoreTotals = obj.scoreTotals;
            this.bestScores = obj.bestScores;
            this.worstScores = obj.worstScores;
            this.moonCount = obj.moonCount;
            this.queenCount = obj.queenCount;
        }
    }
}

class Stats {
    private storage: Storage;
    private data: StatData = new StatData();
    private queenWho: number = -1;
    private lastRequestedPersist: number;

    constructor(storage: Storage) {
        this.storage = storage;
        this.lastRequestedPersist = Date.now() - 1001 * 60 * 60;

        this.init();
    }

    private init() {
        const statData = this.storage.getItem("statData");
        if (statData) {
            this.data = new StatData(statData);
        }
        else {
            this.data = new StatData();
        }
    }

    public get(): StatData {
        return this.data;
    }

    private async save() {
        this.storage.setItem("statData", JSON.stringify(this.data));
        
        // https://web.dev/persistent-storage/
        const now = Date.now();
        console.debug("persisted:", navigator.storage.persisted());
        console.debug("time req:", now > this.lastRequestedPersist + 3600000);
        if (navigator.storage
         // @ts-ignore
         && navigator.storage.persist
         && now > this.lastRequestedPersist + 3600000
         && (! await navigator.storage.persisted())) {
            console.debug("requesting persist permission");
            const isPersisted = await navigator.storage.persist()
            this.lastRequestedPersist = now;
            console.log(`persist storage granted: ${isPersisted}`);
        }
    }

    public queen(who: number) {
        this.queenWho = who;
    }

    /**
     * report statistics for a hand - queen(who) must be called first
     * @param whoMoon who shot the moon, -1 if no one
     */
    public hand(whoMoon: number) {
        ++this.data.handCount;
        if (this.queenWho === -1) {
            console.error("ERROR: Stats: hand called without queen");
        }
        else {
            ++this.data.queenCount[this.queenWho];
        }
        this.queenWho = -1;
        if (whoMoon !== -1) {
            ++this.data.moonCount[whoMoon];
        }

        this.save();
    }

    public game(scores: number[]) {
        ++this.data.gameCount;

        const sortedScores = scores.slice().sort((a, b) => a - b);  // index is "place-1" (0 is first place, 1 is second...)
        console.log("sorted scores:");
        console.log(sortedScores);
        scores.forEach((score, player) => {
            this.data.scoreTotals[player] += score;
            if (score < this.data.bestScores[player]) {
                this.data.bestScores[player] = score;
            }
            if (score > this.data.worstScores[player]) {
                this.data.worstScores[player] = score;
            }
            const placeMinus1 = sortedScores.indexOf(score);
            ++this.data.placeCounts[placeMinus1][player];
        });

        this.save();
    }
}

export default Stats;
