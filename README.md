# 🪞 The Reflector: Sacred Growth & Discipline Forge

**The Reflector** is not just another habit tracker. It is a high-intensity, accountability-driven discipline engine designed to enforce consistency, punish missed routines, and provide uncompromising visual feedback on your daily progress. 

Built with the "Sacred Growth" aesthetic, The Reflector merges modern gamification with serious self-accountability through strict rules and a rewarding prestige system. 

---

## 🔥 Key Features

### 1. The Discipline Score
A dynamic, composite metric (0-100) calculated daily from your Routine, Focus, Task, Journal, and Wake-time performance. Displayed immediately via a pulsing **DisciplineArc** on the home screen, serving as the "north star" for your day.

### 2. Ghost of Yesterday
If you falter, the app remembers. The **Ghost of Yesterday** card confronts you on the home screen using past failure reasons and successes, emotionally challenging your current commitment to break negative patterns.

### 3. The Consequence Engine
Failure isn't silent. The app implements a progressive punishment system for missed routine days:
- **XP Loss:** Immediate penalties to your progress.
- **Wound Accumulation:** Tracked setbacks that require deliberate effort to heal.
- **Forced Reflections:** Mandatory journaling to analyze *why* you failed before allowing you back into the flow.

### 4. Momentum Tiers
Your streak is visualized through dynamic transformations—starting as a humble **Seed 🌿** and growing all the way to a majestic **Crown 👑**. Every tier unlocks unique visual card glows and transition overlays to reward sustained focus.

### 5. The Accountability Pact
Before starting a rigorous 40-day grid, you must sign a **Pact**—a mandatory digital contract defining your "Why," "Sacrifice," and "Reward." Sealed with a long-press digital signature, this unbreakable contract anchors you to your goals.

### 6. The Prestige System (New Game+)
Completing a 40-day grid isn't the end; it's the beginning. The **Prestige System** introduces "New Game+" for your routines. Earning higher prestige levels increases your XP multipliers, but enforces harder rules—such as the devastating "Hard Reset" mechanics upon failure.

---

## 🛠️ Technical Architecture

- **Framework:** React Native + Expo (Router integration for modular navigation)
- **State Management:** Zustand (Fully decoupled, modular stores: Gamification, Discipline, Journal, Focus, etc.)
- **Styling:** `styled-components/native` adhering strictly to a centralized UI primitive system (`@/components/ui`) to eliminate inline styles and ensure a cohesive dark-mode/sacred aesthetic.
- **Animations:** `react-native-reanimated` powering seamless gestures, arc progression, bottom sheets, and the satisfying tier transitions.
- **Storage:** Local AsyncStorage, ensuring complete privacy, zero lag, and instant offline availability.

## 🚀 Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/amarmahdi/the-reflector.git
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server (Expo):
   ```bash
   npx expo start
   ```
4. Build for Release (Android Example):
   ```bash
   cd android && ./gradlew assembleRelease
   ```

*Break the pattern. Live by the rules. Forge your discipline.*