# Doxav3
A multi-Stablecoin Plartform 

# Staking Rewards System 

## Basic Staking Rules
1. Users can stake tokens for different time periods:
   - 3 months (90 days)
   - 6 months (180 days)
   - 9 months (270 days)
   - 12 months (360 days)

## How Rewards Work

### 1. Weight System
The longer you stake, the higher your weight:
- 3 months: Weight = 1
- 6 months: Weight = 2
- 9 months: Weight = 3
- 12 months: Weight = 4

### 2. Weekly Reward Pool Calculation
- Total Weekly Reward = 30% × Number of Weekly Transactions × Transaction Fee
- Example: If there are 10,000 transactions with 0.05 fee each:
  - Weekly Reward Pool = 30% × 10,000 × 0.05 = 150 tokens

### 3. User's Share Calculation
Your share of rewards depends on:
1. How many tokens you staked
2. How long you staked (weight)
3. Total tokens staked by everyone
4. Your weight compared to others

Formula:
```
Your Weight = (Your Staked Tokens ÷ Total Staked Tokens) × Your Period Weight
Your Weekly Reward = Total Weekly Reward × Your Weight ÷ Sum of All Weights
```

## Real Example

Let's say we have 4 users staking different amounts:

Total Staked: 700,000 tokens
Weekly Transactions: 10,000
Transaction Fee: 0.05
Weekly Reward Pool: 150 tokens

### User Breakdown:

1. Alice (3 months):
   - Staked: 100,000 tokens
   - Weight: (100,000 ÷ 700,000) × 1 = 0.143
   - Weekly Reward: 150 × 0.143 ÷ 2.85 = 7.52 tokens
   - APY: 3.92%

2. Bob (6 months):
   - Staked: 150,000 tokens
   - Weight: (150,000 ÷ 700,000) × 2 = 0.429
   - Weekly Reward: 150 × 0.429 ÷ 2.85 = 22.57 tokens
   - APY: 7.85%

3. Carol (9 months):
   - Staked: 200,000 tokens
   - Weight: (200,000 ÷ 700,000) × 3 = 0.857
   - Weekly Reward: 150 × 0.857 ÷ 2.85 = 45.14 tokens
   - APY: 11.78%

4. Dave (12 months):
   - Staked: 250,000 tokens
   - Weight: (250,000 ÷ 700,000) × 4 = 1.429
   - Weekly Reward: 150 × 1.429 ÷ 2.85 = 75.21 tokens
   - APY: 15.71%

### Key Takeaways:
1. Longer staking periods get higher weights, leading to larger rewards
2. Your share of rewards depends on how much you stake compared to others
3. APY increases significantly with longer staking periods
4. Weekly rewards are distributed based on your proportional weight in the system

Note: APY calculations include compound interest (reinvesting weekly rewards) over a full year.

