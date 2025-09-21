const { createApp, reactive, toRefs } = Vue;

createApp({
    setup() {
        const state = reactive({
            currentPage: 'register',
            username: '',
            message: '',
            stages: {},
            selectedStage: null,

            // ブラックジャック用
            deck: [],
            dealerCards: [],
            playerCards: [],
            dealerTotal: 0,
            playerTotal: 0,
            roundOver: false,
            gameOver: false,
            resultMessage: '',

            // ライフ・クリア済みステージ管理
            playerLife: 3,
            dealerLife: 3,
            stageCleared: false
        });

        const registerUser = async () => {
            if (!state.username) return;
            try {
                const res = await fetch('/register_or_get', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username: state.username }),
                    cache: "no-store"
                });
                const data = await res.json();
                state.message = data.message;

                const userRes = await fetch(`/user/${state.username}`);
                const userData = await userRes.json();
                state.stages = {};
                for (const [k, v] of Object.entries(userData.stages)) {
                    state.stages[parseInt(k)] = v;
                }

                state.currentPage = 'stageSelect';
            } catch (e) {
                console.error(e);
                state.message = '登録中にエラーが発生しました';
            }
        };

        const deleteUser = async () => {
            if (!state.username) return;
            try {
                const res = await fetch(`/user/${state.username}`, {
                    method: 'DELETE',
                });
                const data = await res.json();
                alert(data.message);
                
                state.currentPage = 'register';
                state.username = '';
                state.stages = {};
                state.message = '';
            } catch (e) {
                console.error(e);
                alert('ユーザー削除に失敗しました');
            }
        };

        const exportUserData = async () => {
            try {
                const res = await fetch("/export_user", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username: state.username })  // ユーザー名送信
                    });
                    const data = await res.json();
                    
                    
                    // ブラウザ側でファイルとして保存
                    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `${state.username}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                } catch (e) {
                    console.error(e);
                    alert("エクスポートに失敗しました");
                }
            };



        const selectStage = (stage) => {
            state.selectedStage = stage;
            state.currentPage = 'game';
            startGame();
        };

        const startGame = () => {
            state.deck = createDeck();
            shuffleDeck(state.deck);

            state.dealerCards = [drawCard(), drawCard()];
            state.playerCards = [drawCard(), drawCard()];

            state.dealerTotal = calculateTotal(state.dealerCards);
            state.playerTotal = calculateTotal(state.playerCards);

            state.roundOver = false;
            state.resultMessage = '';
            state.stageCleared = false;
        };

        const hit = () => {
            if (state.roundOver || state.gameOver || state.stageCleared) return;

            state.playerCards.push(drawCard());
            state.playerTotal = calculateTotal(state.playerCards);

            if (state.playerTotal > 21) endRound();
        };

        const stand = () => {
            if (state.roundOver || state.gameOver || state.stageCleared) return;

            while (state.dealerTotal < 17) {
                state.dealerCards.push(drawCard());
                state.dealerTotal = calculateTotal(state.dealerCards);
            }

            endRound();
        };

        const endRound = () => {
            state.roundOver = true;

            const player = state.playerTotal;
            const dealer = state.dealerTotal;

            if (player > 21) {
                state.resultMessage = 'バースト！あなたの負けです。';
                state.playerLife -= 1;
            } else if (dealer > 21 || player > dealer) {
                state.resultMessage = 'あなたの勝ちです！';
                state.dealerLife -= 1;

                if (state.dealerLife === 0) {
                    state.stageCleared = true;
                    state.resultMessage += ' Stage Cleared!';
                    fetch('/complete_stage', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ username: state.username, stage: state.selectedStage, victory: true }),
                    })
                    .then(res => res.json())
                    .then(data => {
                        state.stages = {};
                        for (const [k, v] of Object.entries(data.stages)) {
                            state.stages[parseInt(k)] = v;
                        }
                    })
                    .catch(err => console.error("ステージ更新に失敗しました:", err));
                }
            } else if (player < dealer) {
                state.resultMessage = 'あなたの負けです。';
                state.playerLife -= 1;
            } else {
                state.resultMessage = '引き分けです。';
            }

            if (state.playerLife <= 0) {
                state.gameOver = true;
            }
        };

        const nextRound = () => {
            state.roundOver = false;
            startGame();
            };


        const backToStageSelect = () => {
            state.currentPage = 'stageSelect';
            state.selectedStage = null;

            state.roundOver = false;
            state.gameOver = false;
            state.playerLife = 3;
            state.dealerLife = 3;
            state.resultMessage = '';
        };

        // ヘルパー関数
        const createDeck = () => {
            const suits = ['♠', '♥', '♦', '♣'];
            const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
            let deck = [];
            for (const suit of suits) {
                for (let value of values) deck.push(`${suit}${value}`);
            }
            return deck;
        };

        const shuffleDeck = (deck) => {
            for (let i = deck.length-1; i>0; i--) {
                const j = Math.floor(Math.random()*(i+1));
                [deck[i], deck[j]] = [deck[j], deck[i]];
            }
        };

        const drawCard = () => state.deck.pop();

        const calculateTotal = (cards) => {
            let total = 0, aces = 0;
            for (let card of cards) {
                let value = card.slice(1);
                if (['J','Q','K'].includes(value)) total += 10;
                else if (value==='A') { total += 11; aces += 1; }
                else total += parseInt(value);
            }
            while (total>21 && aces>0) { total -= 10; aces -= 1; }
            return total;
        };

        return {
            ...toRefs(state),
            registerUser,
            deleteUser,
            exportUserData,
            selectStage,
            hit,
            stand,
            nextRound,
            backToStageSelect,
        };
    }
}).mount('#app');
