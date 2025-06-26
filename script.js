// Deal or No Deal Game Logic
class DealOrNoDealGame {
    constructor() {
        // Game state
        this.briefcases = [];
        this.selectedBriefcase = null;
        this.currentPhase = 'select'; // 'select', 'play', 'end'
        this.round = 1;
        this.briefcasesToOpen = [6, 5, 4, 3, 2, 1, 1, 1, 1]; // Per round
        this.currentRoundIndex = 0;
        this.openedThisRound = 0;
        this.gameEnded = false;
        this.offerHistory = []; // Track all banker offers
        
        // Winnings history for session
        this.winningsHistory = this.loadWinningsHistory();
        this.currentGameNumber = this.winningsHistory.length + 1;
        
        // Money amounts (26 values from $0.01 to $1,000,000)
        this.moneyAmounts = [
            0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000,
            5000, 10000, 25000, 50000, 75000, 100000, 200000, 300000, 400000,
            500000, 750000, 1000000
        ];
        
        this.init();
    }
    
    init() {
        this.setupBriefcases();
        this.setupEventListeners();
        this.renderSelectPhase();
        this.updateStats();
        
        // DRAMATIC GAME ENTRANCE! 🎭🎪
        if (this.currentGameNumber === 1) {
            this.dramaticGameIntro();
        }
    }
    
    dramaticGameIntro() {
        // Only show intro for first game of session
        setTimeout(() => {
            this.showCountdown(['Welcome to', 'Deal or No Deal!', 'Choose your briefcase...'], () => {
                soundEffects.playSuccess();
                // Add subtle animation to all briefcases
                const briefcases = document.querySelectorAll('#briefcases-select .briefcase');
                briefcases.forEach((briefcase, index) => {
                    setTimeout(() => {
                        briefcase.classList.add('bounce-in');
                        setTimeout(() => briefcase.classList.remove('bounce-in'), 800);
                    }, index * 50);
                });
            }, 'Get ready for the ultimate game show experience!');
        }, 500);
    }
    
    setupBriefcases() {
        // Shuffle money amounts and assign to briefcases
        const shuffledAmounts = [...this.moneyAmounts].sort(() => Math.random() - 0.5);
        
        this.briefcases = [];
        for (let i = 1; i <= 26; i++) {
            this.briefcases.push({
                id: i,
                amount: shuffledAmounts[i - 1],
                opened: false,
                selected: false
            });
        }
    }
    
    setupEventListeners() {
        // Only set up persistent event listeners that don't need to be recreated
        // Briefcase event listeners are handled in renderSelectPhase and renderPlayPhase
        
        // Remove existing event listeners by replacing elements (prevents duplicates)
        this.replaceButtonWithFreshCopy('deal-btn');
        this.replaceButtonWithFreshCopy('no-deal-btn');
        this.replaceButtonWithFreshCopy('restart-btn');
        
        // Add fresh event listeners
        document.getElementById('deal-btn').addEventListener('click', () => this.acceptDeal());
        document.getElementById('no-deal-btn').addEventListener('click', () => this.rejectDeal());
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
    }
    
    replaceButtonWithFreshCopy(buttonId) {
        const button = document.getElementById(buttonId);
        if (button) {
            const newButton = button.cloneNode(true);
            button.parentNode.replaceChild(newButton, button);
        }
    }
    
    renderSelectPhase() {
        const container = document.getElementById('briefcases-select');
        container.innerHTML = '';
        
        this.briefcases.forEach(briefcase => {
            const briefcaseEl = document.createElement('div');
            briefcaseEl.className = 'briefcase';
            briefcaseEl.textContent = briefcase.id;
            briefcaseEl.addEventListener('click', () => this.selectBriefcase(briefcase.id));
            container.appendChild(briefcaseEl);
        });
        
        this.showPhase('select');
    }
    
    selectBriefcase(id) {
        if (this.currentPhase !== 'select') return;
        
        // DRAMATIC BRIEFCASE SELECTION! ✨🎯
        const briefcaseEl = document.querySelector(`#briefcases-select .briefcase:nth-child(${id})`);
        
        // Highlight the selected briefcase
        briefcaseEl.classList.add('suspense-pulse');
        soundEffects.playTension();
        
        this.showCountdown(['Briefcase', id.toString(), 'Selected!'], () => {
            this.selectedBriefcase = id;
            const briefcase = this.briefcases.find(b => b.id === id);
            briefcase.selected = true;
            
            briefcaseEl.classList.remove('suspense-pulse');
            briefcaseEl.classList.add('selected', 'dramatic-zoom');
            
            soundEffects.playSuccess();
            this.shakeScreen();
            
            this.showLoading();
            
            setTimeout(() => {
                this.hideLoading();
                this.startGamePhase();
            }, 1500);
        }, 'You have chosen your briefcase!');
    }
    
    startGamePhase() {
        this.currentPhase = 'play';
        this.showPhase('play'); // Show phase first so elements are visible
        this.renderPlayPhase();
        this.renderMoneyBoard();
        this.showOfferHistory(); // Show history consistently
        this.showRoundProgress(); // Show the round progress counter
        this.updateInstructions(); // Update instructions after phase is shown
    }
    
    renderPlayPhase() {
        const container = document.getElementById('briefcases-play');
        container.innerHTML = '';
        
        this.briefcases.forEach(briefcase => {
            if (briefcase.id === this.selectedBriefcase) return;
            
            const briefcaseEl = document.createElement('div');
            briefcaseEl.className = 'briefcase';
            briefcaseEl.textContent = briefcase.id;
            
            if (!briefcase.opened) {
                briefcaseEl.addEventListener('click', () => this.openBriefcase(briefcase.id));
            } else {
                briefcaseEl.classList.add('opened');
                briefcaseEl.textContent = this.formatMoney(briefcase.amount);
            }
            
            container.appendChild(briefcaseEl);
        });
        
        // Show selected briefcase
        const playerBriefcase = document.getElementById('player-briefcase');
        playerBriefcase.textContent = this.selectedBriefcase;
    }
    
    renderMoneyBoard() {
        const container = document.getElementById('money-grid');
        container.innerHTML = '';
        
        this.moneyAmounts.forEach((amount, index) => {
            const isRemoved = this.briefcases.some(b => b.amount === amount && b.opened);
            const isHighValue = amount >= 100000;
            
            const moneyEl = document.createElement('div');
            moneyEl.className = `money-item ${isHighValue ? 'high-value' : ''} ${isRemoved ? 'removed' : ''}`;
            moneyEl.textContent = this.formatMoney(amount);
            
            // Add staggered animation for drama
            setTimeout(() => {
                moneyEl.classList.add('bounce-in');
                setTimeout(() => moneyEl.classList.remove('bounce-in'), 600);
            }, index * 20);
            
            container.appendChild(moneyEl);
        });
    }
    
    openBriefcase(id) {
        if (this.currentPhase !== 'play' || this.gameEnded) return;
        
        const briefcase = this.briefcases.find(b => b.id === id);
        if (briefcase.opened || briefcase.selected) return;
        
        // Update counters immediately when briefcase is clicked
        briefcase.opened = true;
        this.openedThisRound++;
        this.updateInstructions(); // This updates the round progress counter
        
        // DRAMATIC BRIEFCASE OPENING SEQUENCE! 🎭
        const briefcaseEl = document.querySelector(`#briefcases-play .briefcase:nth-child(${this.getAvailableBriefcaseIndex(id)})`);
        
        // Start dramatic sequence
        this.startDramaticReveal(briefcaseEl, briefcase, () => {
            this.highlightMoneyOnBoard(briefcase.amount);
            this.renderMoneyBoard();
            this.updateStats();
            
            // Check if round is complete
            const targetCount = this.briefcasesToOpen[this.currentRoundIndex];
            if (this.openedThisRound >= targetCount) {
                setTimeout(() => this.completeRound(), 1000);
            }
        });
    }
    
    startDramaticReveal(briefcaseEl, briefcase, callback) {
        // Phase 1: Build suspense
        this.activateSpotlight();
        this.shakeBriefcase(briefcaseEl);
        soundEffects.playDrama();
        
        // Phase 2: Dramatic pause with countdown
        setTimeout(() => {
            this.showCountdown(['3', '2', '1'], () => {
                // Phase 3: Explosive reveal!
                this.deactivateSpotlight();
                briefcaseEl.classList.add('briefcase-opening');
                
                setTimeout(() => {
                    briefcaseEl.classList.add('opened');
                    briefcaseEl.innerHTML = `<span class="money-reveal">${this.formatMoney(briefcase.amount)}</span>`;
                    this.shakeScreen();
                    soundEffects.playExplosion();
                    
                    setTimeout(callback, 1500);
                }, 500);
            }, 'Opening briefcase...');
        }, 1000);
    }
    
    activateSpotlight() {
        document.getElementById('dramatic-darken').classList.add('active');
        document.getElementById('spotlight-overlay').classList.add('active');
    }
    
    deactivateSpotlight() {
        document.getElementById('dramatic-darken').classList.remove('active');
        document.getElementById('spotlight-overlay').classList.remove('active');
    }
    
    shakeBriefcase(element) {
        element.classList.add('suspense-pulse');
        setTimeout(() => {
            element.classList.remove('suspense-pulse');
        }, 2000);
    }
    
    shakeScreen() {
        document.body.classList.add('screen-shake');
        setTimeout(() => {
            document.body.classList.remove('screen-shake');
        }, 600);
    }
    
    showCountdown(numbers, callback, customMessage = '') {
        const overlay = document.getElementById('countdown-overlay');
        const text = document.getElementById('countdown-text');
        const message = overlay.querySelector('.countdown-message');
        
        overlay.style.display = 'flex';
        message.textContent = customMessage;
        
        let index = 0;
        const showNext = () => {
            if (index < numbers.length) {
                text.textContent = numbers[index];
                text.classList.add('countdown-text');
                soundEffects.playTick();
                
                setTimeout(() => {
                    text.classList.remove('countdown-text');
                    index++;
                    setTimeout(showNext, 200);
                }, 800);
            } else {
                overlay.style.display = 'none';
                callback();
            }
        };
        
        showNext();
    }
    
    highlightMoneyOnBoard(amount) {
        const moneyItems = document.querySelectorAll('.money-item');
        moneyItems.forEach(item => {
            if (item.textContent === this.formatMoney(amount)) {
                item.classList.add('highlighted');
                setTimeout(() => {
                    item.classList.remove('highlighted');
                }, 2000);
            }
        });
    }
    
    getAvailableBriefcaseIndex(id) {
        let index = 1;
        for (let briefcase of this.briefcases) {
            if (briefcase.id === this.selectedBriefcase) continue;
            if (briefcase.id === id) return index;
            index++;
        }
        return index;
    }
    
    completeRound() {
        this.openedThisRound = 0;
        this.currentRoundIndex++;
        
        // Check if game should end
        const remainingBriefcases = this.briefcases.filter(b => !b.opened && !b.selected).length;
        
        if (remainingBriefcases === 0) {
            this.hideRoundProgress();
            this.endGame('final');
            return;
        }
        
        if (this.currentRoundIndex < this.briefcasesToOpen.length) {
            this.hideRoundProgress(); // Hide during banker offer
            this.showBankerOffer();
            this.round++; // Increment round AFTER showing offer, so first offer shows as R1
        } else {
            this.hideRoundProgress();
            this.endGame('final');
        }
    }
    
    showBankerOffer() {
        const offer = this.calculateBankerOffer();
        
        // Add offer to history
        this.offerHistory.push({
            round: this.round,
            amount: offer,
            status: 'pending'
        });
        
        // DRAMATIC BANKER ENTRANCE! 📞✨
        this.startBankerPhoneSequence(offer);
    }
    
    startBankerPhoneSequence(offer) {
        // Phase 1: Suspenseful phone ringing
        this.showCountdown(['📞', '☎️', '📞'], () => {
            // Phase 2: Dramatic banker entrance
            const bankerArea = document.getElementById('banker-area');
            bankerArea.classList.add('show');
            bankerArea.classList.add('banker-entrance');
            
            // Phone ringing effect
            const bankerCard = bankerArea.querySelector('.banker-card');
            bankerCard.classList.add('phone-ringing');
            soundEffects.playPhoneRing();
            
            setTimeout(() => {
                bankerCard.classList.remove('phone-ringing');
                
                // Phase 3: Dramatic offer reveal
                this.dramaticOfferReveal(offer);
            }, 2000);
        }, 'The banker is calling with an offer!');
    }
    
    dramaticOfferReveal(offer) {
        const offerAmountEl = document.getElementById('offer-amount');
        const dealBtn = document.getElementById('deal-btn');
        const noDealBtn = document.getElementById('no-deal-btn');
        
        // Build suspense with counting up effect
        this.animateNumberCountUp(offerAmountEl, 0, offer, 2000);
        
        setTimeout(() => {
            // Make buttons dramatically pulse
            dealBtn.classList.add('deal-button-emphasis');
            noDealBtn.classList.add('no-deal-button-emphasis');
            
            // Shake screen for emphasis
            this.shakeScreen();
            soundEffects.playDrama();
            
            this.updateOfferHistory();
            this.disableBriefcases();
        }, 2500);
    }
    
    animateNumberCountUp(element, startValue, endValue, duration) {
        const startTime = Date.now();
        const countUp = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function for dramatic effect
            const easedProgress = 1 - Math.pow(1 - progress, 3);
            const currentValue = startValue + (endValue - startValue) * easedProgress;
            
            element.textContent = this.formatMoney(currentValue);
            element.classList.add('dramatic-zoom');
            
            if (progress < 1) {
                setTimeout(() => {
                    element.classList.remove('dramatic-zoom');
                    requestAnimationFrame(countUp);
                }, 50);
            } else {
                element.textContent = this.formatMoney(endValue);
                element.classList.add('suspense-pulse');
            }
        };
        
        countUp();
    }
    
    calculateBankerOffer() {
        const remainingAmounts = this.briefcases
            .filter(b => !b.opened)
            .map(b => b.amount);
        
        const average = remainingAmounts.reduce((sum, amount) => sum + amount, 0) / remainingAmounts.length;
        
        // Banker typically offers 70-90% of average, with some randomness
        const offerPercentage = 0.70 + (Math.random() * 0.20);
        const baseOffer = average * offerPercentage;
        
        // Round to nearest reasonable amount
        if (baseOffer >= 100000) {
            return Math.round(baseOffer / 10000) * 10000;
        } else if (baseOffer >= 10000) {
            return Math.round(baseOffer / 1000) * 1000;
        } else if (baseOffer >= 1000) {
            return Math.round(baseOffer / 100) * 100;
        } else {
            return Math.round(baseOffer);
        }
    }
    
    acceptDeal() {
        // DRAMATIC DEAL ACCEPTANCE! 🤝💰
        this.clearButtonAnimations();
        this.showCountdown(['DEAL!', 'ACCEPTED!'], () => {
            // Get the current offer from history (most recent pending offer)
            const currentOffer = this.offerHistory.find(offer => offer.status === 'pending');
            const offerAmount = currentOffer ? currentOffer.amount : 0;
            
            // Update history status
            if (currentOffer) {
                currentOffer.status = 'accepted';
                this.updateOfferHistory();
            }
            
            soundEffects.playSuccess();
            this.shakeScreen();
            this.endGame('deal', offerAmount);
        }, 'Congratulations! You accepted the deal!');
    }
    
    rejectDeal() {
        // DRAMATIC NO DEAL! 🚫🔥
        this.clearButtonAnimations();
        this.showCountdown(['NO DEAL!'], () => {
            // Update history status for the most recent offer
            const currentOffer = this.offerHistory.find(offer => offer.status === 'pending');
            if (currentOffer) {
                currentOffer.status = 'rejected';
                this.updateOfferHistory();
            }
            
            soundEffects.playRejection();
            this.shakeScreen();
            
            document.getElementById('banker-area').classList.remove('show');
            this.enableBriefcases();
            this.resetRoundProgress(); // Reset for new round
            this.showRoundProgress(); // Show the counter again
            this.updateInstructions();
            this.updateStats();
        }, 'You rejected the offer! Continue playing!');
    }
    
    clearButtonAnimations() {
        const dealBtn = document.getElementById('deal-btn');
        const noDealBtn = document.getElementById('no-deal-btn');
        dealBtn.classList.remove('deal-button-emphasis');
        noDealBtn.classList.remove('no-deal-button-emphasis');
        
        const offerAmountEl = document.getElementById('offer-amount');
        offerAmountEl.classList.remove('suspense-pulse');
    }
    
    endGame(type, finalAmount = null) {
        this.gameEnded = true;
        this.currentPhase = 'end';
        
        // ULTIMATE DRAMATIC FINALE! 🎬🏆
        if (type === 'final') {
            this.dramaticFinalReveal();
        } else {
            this.dramaticDealConclusion(finalAmount);
        }
    }
    
    dramaticFinalReveal() {
        const actualAmount = this.briefcases.find(b => b.id === this.selectedBriefcase).amount;
        
        // Epic countdown to final reveal
        this.showCountdown(['Final', 'Briefcase', 'Reveal!'], () => {
            this.activateSpotlight();
            soundEffects.playFinalReveal();
            
            setTimeout(() => {
                this.deactivateSpotlight();
                this.completeGameEnd('final', actualAmount);
                this.shakeScreen();
            }, 3000);
        }, 'The moment of truth! What\'s in your briefcase?');
    }
    
    dramaticDealConclusion(finalAmount) {
        const actualAmount = this.briefcases.find(b => b.id === this.selectedBriefcase).amount;
        
        // Show what was in their briefcase with drama
        this.showCountdown(['Your Briefcase', 'Contained...'], () => {
            this.activateSpotlight();
            
            // Reveal their briefcase amount
            const playerBriefcase = document.getElementById('player-briefcase');
            playerBriefcase.innerHTML = `<span class="money-reveal">${this.formatMoney(actualAmount)}</span>`;
            playerBriefcase.classList.add('briefcase-opening');
            
            soundEffects.playReveal();
            
            setTimeout(() => {
                this.deactivateSpotlight();
                this.completeGameEnd('deal', finalAmount, actualAmount);
            }, 2000);
        }, 'Let\'s see what you could have won!');
    }
    
    completeGameEnd(type, finalAmount, actualAmount = null) {
        let title, amount, message;
        
        if (type === 'deal') {
            title = "Deal Accepted!";
            amount = finalAmount;
            actualAmount = actualAmount || this.briefcases.find(b => b.id === this.selectedBriefcase).amount;
            message = `You took the banker's offer! Your briefcase contained ${this.formatMoney(actualAmount)}.`;
            if (finalAmount > actualAmount) {
                message += " 🎉 GREAT DEAL!";
            } else {
                message += " 😬 You could have had more!";
            }
        } else {
            title = "🎭 FINAL REVEAL! 🎭";
            amount = this.briefcases.find(b => b.id === this.selectedBriefcase).amount;
            message = "This was the amount in your briefcase!";
            
            // Add dramatic message based on amount
            if (amount >= 500000) {
                message += " 🏆 INCREDIBLE! You're a CHAMPION!";
            } else if (amount >= 100000) {
                message += " 🎉 FANTASTIC! Great instincts!";
            } else if (amount >= 10000) {
                message += " 👍 Not bad at all!";
            } else {
                message += " 😅 Better luck next time!";
            }
        }
        
        // Record this game in winnings history
        this.recordGameResult(type, amount, finalAmount);
        
        // Animate the final reveal
        document.getElementById('end-title').textContent = title;
        const finalAmountEl = document.getElementById('final-amount');
        finalAmountEl.textContent = this.formatMoney(amount);
        finalAmountEl.classList.add('dramatic-zoom');
        
        document.getElementById('end-message').textContent = message;
        
        // Show game summary with offer history and session statistics
        this.showGameSummary();
        
        this.showPhase('end');
    }
    
    showGameSummary() {
        // Calculate summary statistics
        const totalOffers = this.offerHistory.length;
        const highestOffer = totalOffers > 0 ? Math.max(...this.offerHistory.map(offer => offer.amount)) : 0;
        
        // Update current game stats
        document.getElementById('total-offers').textContent = totalOffers;
        document.getElementById('highest-offer').textContent = this.formatMoney(highestOffer);
        
        // Show session statistics
        this.showSessionStats();
        
        // Show offer history in final screen
        const finalHistoryList = document.getElementById('final-history-list');
        
        if (this.offerHistory.length === 0) {
            finalHistoryList.innerHTML = '<div class="history-placeholder">No banker offers were made in this game.</div>';
            return;
        }
        
        finalHistoryList.innerHTML = '';
        
        // Show offers in chronological order (oldest first for final summary)
        this.offerHistory.forEach(offer => {
            const historyItem = document.createElement('div');
            historyItem.className = `final-history-item ${offer.status}`;
            
            historyItem.innerHTML = `
                <div class="final-history-round">R${offer.round}</div>
                <div class="final-history-amount">${this.formatMoney(offer.amount)}</div>
                <div class="final-history-status ${offer.status}">${offer.status}</div>
            `;
            
            finalHistoryList.appendChild(historyItem);
        });
    }
    
    showSessionStats() {
        const stats = this.getSessionStats();
        
        // Update session statistics in the UI
        const sessionStatsEl = document.getElementById('session-stats');
        if (!sessionStatsEl) return;
        
        if (stats.gamesPlayed === 0) {
            sessionStatsEl.innerHTML = '<div class="no-history">This is your first game of the session!</div>';
            return;
        }
        
        sessionStatsEl.innerHTML = `
            <div class="session-stat">
                <span class="session-label">Games Played:</span>
                <span class="session-value">${stats.gamesPlayed}</span>
            </div>
            <div class="session-stat">
                <span class="session-label">Total Winnings:</span>
                <span class="session-value">${this.formatMoney(stats.totalWinnings)}</span>
            </div>
            <div class="session-stat">
                <span class="session-label">Average per Game:</span>
                <span class="session-value">${this.formatMoney(stats.averageWinnings)}</span>
            </div>
            <div class="session-stat">
                <span class="session-label">Best Game:</span>
                <span class="session-value session-best">${this.formatMoney(stats.bestGame)}</span>
            </div>
            <div class="session-stat">
                <span class="session-label">Worst Game:</span>
                <span class="session-value session-worst">${this.formatMoney(stats.worstGame)}</span>
            </div>
            <div class="session-stat">
                <span class="session-label">Deal Success Rate:</span>
                <span class="session-value">${stats.dealSuccessRate.toFixed(1)}%</span>
            </div>
        `;
        
        // Show recent games history
        this.showRecentGames();
    }
    
    showRecentGames() {
        const recentGamesEl = document.getElementById('recent-games');
        if (!recentGamesEl) return;
        
        if (this.winningsHistory.length === 0) {
            recentGamesEl.innerHTML = '<div class="no-history">No previous games to show.</div>';
            return;
        }
        
        recentGamesEl.innerHTML = '';
        
        // Show last 5 games (newest first)
        const recentGames = this.winningsHistory.slice(-5).reverse();
        
        recentGames.forEach(game => {
            const gameItem = document.createElement('div');
            gameItem.className = `recent-game-item ${game.dealAccepted ? 'deal-game' : 'final-game'}`;
            
            const gameType = game.dealAccepted ? '🤝 Deal' : '📦 Final';
            const gameResult = game.dealAccepted ? 
                `Won ${this.formatMoney(game.winnings)} (briefcase had ${this.formatMoney(game.briefcaseAmount)})` :
                `Won ${this.formatMoney(game.winnings)}`;
            
            gameItem.innerHTML = `
                <div class="recent-game-header">
                    <span class="recent-game-number">Game ${game.gameNumber}</span>
                    <span class="recent-game-type">${gameType}</span>
                    <span class="recent-game-winnings">${this.formatMoney(game.winnings)}</span>
                </div>
                <div class="recent-game-details">${gameResult}</div>
            `;
            
            recentGamesEl.appendChild(gameItem);
        });
        
        // Add clear history button if there are games
        if (this.winningsHistory.length > 0) {
            const clearButton = document.createElement('button');
            clearButton.className = 'btn btn-clear-history';
            clearButton.textContent = 'Clear Session History';
            clearButton.onclick = () => {
                if (confirm('Clear all session history? This cannot be undone.')) {
                    this.clearWinningsHistory();
                    this.showSessionStats(); // Refresh display
                }
            };
            recentGamesEl.appendChild(clearButton);
        }
    }
    
    disableBriefcases() {
        const briefcases = document.querySelectorAll('#briefcases-play .briefcase');
        briefcases.forEach((briefcase, index) => {
            if (!briefcase.classList.contains('opened')) {
                setTimeout(() => {
                    briefcase.classList.add('disabled', 'suspense-wait');
                }, index * 30);
            }
        });
    }
    
    enableBriefcases() {
        const briefcases = document.querySelectorAll('#briefcases-play .briefcase');
        briefcases.forEach((briefcase, index) => {
            setTimeout(() => {
                briefcase.classList.remove('disabled', 'suspense-wait');
                if (!briefcase.classList.contains('opened')) {
                    briefcase.classList.add('bounce-in');
                    setTimeout(() => briefcase.classList.remove('bounce-in'), 600);
                }
            }, index * 30);
        });
        
        // Play activation sound
        soundEffects.playClick();
    }
    
    updateInstructions() {
        if (this.gameEnded) return;
        
        // Check if elements exist before trying to update them
        const toOpenEl = document.getElementById('to-open');
        const instructionEl = document.getElementById('instruction');
        
        if (!toOpenEl || !instructionEl) {
            return;
        }
        
        const remaining = this.briefcasesToOpen[this.currentRoundIndex] - this.openedThisRound;
        toOpenEl.textContent = remaining;
        
        const instruction = remaining === 1 ? 'Open 1 briefcase' : `Open ${remaining} briefcases`;
        instructionEl.innerHTML = instruction;
        
        // Update round progress counter
        this.updateRoundProgress();
    }
    
    updateRoundProgress() {
        const casesLeftCounterEl = document.getElementById('cases-left-counter');
        const progressFillEl = document.getElementById('progress-fill');
        const roundProgressEl = document.getElementById('round-progress');
        
        if (!casesLeftCounterEl || !progressFillEl || !roundProgressEl) return;
        
        const totalThisRound = this.briefcasesToOpen[this.currentRoundIndex];
        const remaining = totalThisRound - this.openedThisRound;
        const progressPercent = (this.openedThisRound / totalThisRound) * 100;
        
        // Update counter with animation
        casesLeftCounterEl.textContent = remaining;
        casesLeftCounterEl.classList.add('highlight');
        setTimeout(() => casesLeftCounterEl.classList.remove('highlight'), 500);
        
        // Update progress bar
        progressFillEl.style.width = `${progressPercent}%`;
        
        // Mark as complete if round is done
        if (remaining === 0) {
            roundProgressEl.classList.add('complete');
            casesLeftCounterEl.textContent = 'Complete!';
        } else {
            roundProgressEl.classList.remove('complete');
        }
    }
    
    showRoundProgress() {
        const roundProgressEl = document.getElementById('round-progress');
        if (roundProgressEl) {
            roundProgressEl.style.display = 'block';
            this.updateRoundProgress();
        }
    }
    
    hideRoundProgress() {
        const roundProgressEl = document.getElementById('round-progress');
        if (roundProgressEl) {
            roundProgressEl.style.display = 'none';
        }
    }
    
    resetRoundProgress() {
        const casesLeftCounterEl = document.getElementById('cases-left-counter');
        const progressFillEl = document.getElementById('progress-fill');
        const roundProgressEl = document.getElementById('round-progress');
        
        if (!casesLeftCounterEl || !progressFillEl || !roundProgressEl) return;
        
        const totalThisRound = this.briefcasesToOpen[this.currentRoundIndex];
        
        roundProgressEl.classList.remove('complete');
        casesLeftCounterEl.textContent = totalThisRound;
        progressFillEl.style.width = '0%';
    }
    
    updateStats() {
        const gameNumberEl = document.getElementById('game-number');
        if (gameNumberEl) {
            gameNumberEl.textContent = this.currentGameNumber;
        }
        
        document.getElementById('round').textContent = this.round;
        
        const remainingCount = this.briefcases.filter(b => !b.opened).length;
        document.getElementById('briefcases-left').textContent = remainingCount;
    }
    
    showPhase(phaseName) {
        document.querySelectorAll('.phase').forEach(phase => {
            phase.classList.remove('active');
        });
        document.getElementById(`phase-${phaseName}`).classList.add('active');
    }
    
    showLoading() {
        document.getElementById('loading').classList.add('show');
    }
    
    hideLoading() {
        document.getElementById('loading').classList.remove('show');
    }
    
    formatMoney(amount) {
        if (amount >= 1000000) {
            return `$${(amount / 1000000).toFixed(1)}M`;
        } else if (amount >= 1000) {
            return `$${(amount / 1000).toFixed(0)}K`;
        } else if (amount >= 1) {
            return `$${amount.toLocaleString()}`;
        } else {
            return `$${amount.toFixed(2)}`;
        }
    }
    
    showOfferHistory() {
        // Always show the offer history area once the game starts
        const historyContainer = document.getElementById('offer-history');
        if (historyContainer) {
            historyContainer.style.display = 'block';
            this.updateOfferHistory();
        }
    }
    
    updateOfferHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;
        
        if (this.offerHistory.length === 0) {
            historyList.innerHTML = '<div class="history-placeholder">Banker offers will appear here...</div>';
            return;
        }
        
        historyList.innerHTML = '';
        
        // Show offers in reverse order (newest first)
        this.offerHistory.slice().reverse().forEach(offer => {
            const historyItem = document.createElement('div');
            historyItem.className = `history-item ${offer.status}`;
            
            historyItem.innerHTML = `
                <div class="history-round">R${offer.round}</div>
                <div class="history-amount">${this.formatMoney(offer.amount)}</div>
                <div class="history-status ${offer.status}">${offer.status}</div>
            `;
            
            historyList.appendChild(historyItem);
        });
    }
    
    loadWinningsHistory() {
        try {
            const saved = localStorage.getItem('dond-winnings-history');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            return [];
        }
    }
    
    saveWinningsHistory() {
        try {
            localStorage.setItem('dond-winnings-history', JSON.stringify(this.winningsHistory));
        } catch (e) {
            console.log('Could not save winnings history');
        }
    }
    
    recordGameResult(type, finalAmount, offerAmount = null) {
        const gameResult = {
            gameNumber: this.currentGameNumber,
            timestamp: new Date().toLocaleString(),
            type: type, // 'deal' or 'final'
            winnings: finalAmount,
            briefcaseAmount: type === 'deal' ? this.briefcases.find(b => b.id === this.selectedBriefcase).amount : finalAmount,
            dealAccepted: type === 'deal',
            dealAmount: offerAmount,
            totalOffers: this.offerHistory.length,
            highestOffer: this.offerHistory.length > 0 ? Math.max(...this.offerHistory.map(offer => offer.amount)) : 0
        };
        
        this.winningsHistory.push(gameResult);
        this.saveWinningsHistory();
    }
    
    clearWinningsHistory() {
        this.winningsHistory = [];
        this.currentGameNumber = 1;
        this.saveWinningsHistory();
    }
    
    getSessionStats() {
        if (this.winningsHistory.length === 0) {
            return {
                gamesPlayed: 0,
                totalWinnings: 0,
                averageWinnings: 0,
                bestGame: 0,
                worstGame: 0,
                dealsAccepted: 0,
                dealSuccessRate: 0
            };
        }
        
        const winnings = this.winningsHistory.map(game => game.winnings);
        const totalWinnings = winnings.reduce((sum, amount) => sum + amount, 0);
        const dealsAccepted = this.winningsHistory.filter(game => game.dealAccepted).length;
        
        return {
            gamesPlayed: this.winningsHistory.length,
            totalWinnings: totalWinnings,
            averageWinnings: totalWinnings / this.winningsHistory.length,
            bestGame: Math.max(...winnings),
            worstGame: Math.min(...winnings),
            dealsAccepted: dealsAccepted,
            dealSuccessRate: (dealsAccepted / this.winningsHistory.length) * 100
        };
    }
    
    restart() {
        // Reset all game state
        this.briefcases = [];
        this.selectedBriefcase = null;
        this.currentPhase = 'select';
        this.round = 1;
        this.currentRoundIndex = 0;
        this.openedThisRound = 0;
        this.gameEnded = false;
        this.offerHistory = []; // Reset offer history
        this.currentGameNumber = this.winningsHistory.length + 1; // Update game number
        
        // Hide banker area and reset history
        document.getElementById('banker-area').classList.remove('show');
        document.getElementById('offer-history').style.display = 'none';
        
        // Restart the game
        this.init();
    }
}

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    new DealOrNoDealGame();
});

// DRAMATIC SOUND EFFECTS SYSTEM! 🎵🎭
class SoundEffects {
    constructor() {
        this.audioContext = null;
        this.init();
    }
    
    async init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }
    
    playTone(frequency, duration, type = 'sine', volume = 0.1) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        oscillator.type = type;
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    playMultiTone(frequencies, duration, type = 'sine', volume = 0.1) {
        frequencies.forEach((freq, index) => {
            setTimeout(() => this.playTone(freq, duration, type, volume), index * 50);
        });
    }
    
    playSuccess() {
        // Triumphant fanfare
        this.playMultiTone([523.25, 659.25, 783.99, 1046.50], 0.4, 'sine', 0.15);
        setTimeout(() => {
            this.playMultiTone([1046.50, 1174.66, 1318.51], 0.6, 'sine', 0.12);
        }, 200);
    }
    
    playDrama() {
        // Deep, ominous dramatic sound
        this.playTone(110, 1.5, 'sawtooth', 0.2); // A2
        setTimeout(() => this.playTone(98, 1.5, 'sawtooth', 0.15), 100); // G2
        setTimeout(() => this.playTone(87.31, 2, 'sawtooth', 0.18), 200); // F2
    }
    
    playPhoneRing() {
        // Classic phone ring pattern
        const ringPattern = () => {
            this.playTone(800, 0.3, 'sine', 0.15);
            setTimeout(() => this.playTone(1000, 0.3, 'sine', 0.15), 350);
        };
        
        ringPattern();
        setTimeout(ringPattern, 800);
        setTimeout(ringPattern, 1600);
    }
    
    playTick() {
        // Sharp tick sound for countdown
        this.playTone(1200, 0.1, 'square', 0.2);
    }
    
    playExplosion() {
        // Dramatic reveal sound
        this.playTone(60, 0.1, 'sawtooth', 0.3);
        setTimeout(() => {
            this.playMultiTone([200, 400, 800, 1600], 0.3, 'triangle', 0.15);
        }, 100);
        setTimeout(() => {
            this.playTone(1000, 0.8, 'sine', 0.1);
        }, 200);
    }
    
    playRejection() {
        // Dramatic "no deal" sound
        this.playTone(220, 0.4, 'sawtooth', 0.2);
        setTimeout(() => this.playTone(196, 0.4, 'sawtooth', 0.18), 150);
        setTimeout(() => this.playTone(174.61, 0.8, 'sawtooth', 0.15), 300);
    }
    
    playTension() {
        // Building tension sound
        const startFreq = 100;
        const endFreq = 400;
        const steps = 20;
        const stepTime = 100;
        
        for (let i = 0; i < steps; i++) {
            const freq = startFreq + (endFreq - startFreq) * (i / steps);
            setTimeout(() => {
                this.playTone(freq, 0.15, 'triangle', 0.05 + (i / steps) * 0.1);
            }, i * stepTime);
        }
    }
    
    playClick() {
        this.playTone(800, 0.1, 'square', 0.1);
    }
    
    playReveal() {
        // Magic reveal sound
        this.playMultiTone([659.25, 783.99, 987.77, 1174.66], 0.2, 'sine', 0.12);
    }
    
    playFinalReveal() {
        // Epic final briefcase reveal
        this.playDrama();
        setTimeout(() => {
            this.playMultiTone([261.63, 329.63, 392, 523.25, 659.25, 783.99], 0.8, 'sine', 0.15);
        }, 1000);
        setTimeout(() => {
            this.playSuccess();
        }, 2000);
    }
}

// Initialize sound effects
const soundEffects = new SoundEffects();

// Add click sounds to buttons
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn') || e.target.classList.contains('briefcase')) {
        soundEffects.playClick();
    }
}); 