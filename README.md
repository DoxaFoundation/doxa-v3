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

Example for 3-Month Staking (Alice):
• Staked Amount: 100,000 tokens
• Weekly Reward: 7.52 tokens
• Weekly Return Rate (r) = 7.52 ÷ 100,000 = 0.0000752
• APY = ((1 + 0.0000752)^52 - 1) × 100%
• APY = 3.92%

Example for 6-Month Staking (Bob):
• Staked Amount: 150,000 tokens
• Weekly Reward: 22.57 tokens
• Weekly Return Rate (r) = 22.57 ÷ 150,000 = 0.000150
• APY = ((1 + 0.000150)^52 - 1) × 100%
• APY = 7.85%

Example for 9-Month Staking (Carol):
• Staked Amount: 200,000 tokens
• Weekly Reward: 45.14 tokens
• Weekly Return Rate (r) = 45.14 ÷ 200,000 = 0.000226
• APY = ((1 + 0.000226)^52 - 1) × 100%
• APY = 11.78%

Example for 12-Month Staking (Dave):
• Staked Amount: 250,000 tokens
• Weekly Reward: 75.21 tokens
• Weekly Return Rate (r) = 75.21 ÷ 250,000 = 0.000301
• APY = ((1 + 0.000301)^52 - 1) × 100%
• APY = 15.71%

### APY Calculation Factors:

1. Base Reward Components:
   • Initial stake amount
   • Staking period weight
   • Transaction volume
   • Total staked in system

2. Compounding Effects:
   • Weekly compounding (52 times per year)
   • Assumes rewards are restaked
   • Compounds more effectively with longer staking periods

3. Variable Factors:
   • Transaction volume fluctuations
   • Total staked amount changes
   • Network activity variations

### APY Range by Staking Period:

Summary Table:
Period Weight Typical APY Range
3 months 1 3.5% - 4.5%
6 months 2 7.0% - 8.5%
9 months 3 11.0% - 12.5%
12 months 4 15.0% - 16.5%

Note: Actual APY may vary based on:
• Network activity
• Total staked tokens
• Transaction volume
• Market conditions

### Key Takeaways:

1. Longer staking periods get higher weights, leading to larger rewards
2. Your share of rewards depends on how much you stake compared to others
3. APY increases significantly with longer staking periods
4. Weekly rewards are distributed based on your proportional weight in the system

Note: APY calculations include compound interest (reinvesting weekly rewards) over a full year.

# test

# Install Vessel on Your System

Follow these steps to download and install Vessel:

1. **Download Vessel**

   For Linux:

   ```bash
   wget https://github.com/dfinity/vessel/releases/download/v0.7.0/vessel-linux64
   ```

   For macOS:

   ```bash
   wget https://github.com/dfinity/vessel/releases/download/v0.7.0/vessel-macos
   ```

2. **Rename the File**

   ```bash
   mv vessel-linux64 vessel
   ```

3. **Make the File Executable**

   ```bash
   chmod +x vessel
   ```

4. **Install System-Wide**
   ```bash
   sudo mv vessel /usr/local/bin/
   ```

## Verify Installation

1. **Check if Vessel is Installed**

   ```bash
   which vessel
   ```

2. **Verify Vessel Version**

   ```bash
   vessel --version
   ```

3. **Clean Up**
   If Vessel is successfully installed, you can remove the original downloaded file:
   ```bash
   rm vessel-linux64
   ```

## Troubleshooting

If you face issues moving Vessel to `/usr/local/bin/`:

1. Ensure you type the correct password when prompted for `sudo`.
2. Verify if your user has `sudo` privileges:
   ```bash
   sudo -v
   ```
3. If you keep facing issues, double-check the current location of Vessel:
   ```bash
   which vessel
   ```

## Additional Tools (`mo-doc` and `mo-ide`)

Make sure these tools are also placed in `/usr/local/bin/` for system-wide availability:

1. **Move Tools to `/usr/local/bin/`**

   ```bash
   sudo mv mo-doc /usr/local/bin/
   sudo mv mo-ide /usr/local/bin/
   ```

2. **Make Them Executable**

   ```bash
   sudo chmod +x /usr/local/bin/mo-doc
   sudo chmod +x /usr/local/bin/mo-ide
   ```

3. **Verify Their Installation**
   ```bash
   which mo-doc
   which mo-ide
   ```

This ensures a clean project directory and makes the tools accessible across all projects.

## Tests run

```bash
make test
```

```bash
./scripts/test.sh

```
