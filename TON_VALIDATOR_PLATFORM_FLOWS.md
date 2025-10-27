# TON VALIDATOR PLATFORM - USER FLOWS & TECHNICAL ARCHITECTURE

## 🎮 PLAYER FLOW

### Entry & Authentication
1. **Landing Page**
   - Player arrives at homepage with animated 3D globe
   - ARIA AI system introduces the platform (voice operator)
   - Sees "Live Validators" section showcasing active games
   - Clicks "Initialize" to begin

2. **Wallet Connection**
   - Player connects TON wallet (required for platform access)
   - Alternative: Email/password authentication available
   - Profile automatically created upon first login

3. **Game Hub (Lobby)**
   - Views all available validators in "Brand Stores" section
   - Each validator shows:
     - Brand logo
     - Validator name
     - Department category
     - "LIVE" badge for active games
   - Can filter by department (Marketing, Operations, Finance, etc.)
   - Search functionality for finding specific validators

### Playing Validators
4. **Validator Selection**
   - Clicks on any live validator card
   - Redirected to unique play URL (/play/[CODE])
   - Views validator introduction screen with:
     - Brand customization (colors, logo)
     - Game instructions
     - Time limit (typically 3 minutes)
     - Sub-competencies being tested

5. **Gameplay**
   - Interactive scenario begins (e.g., KPI ranking, crisis management)
   - Real-time feedback on actions
   - Edge-case scenarios may trigger mid-game
   - Timer countdown visible
   - Can submit when ready or time expires

6. **Results & Scoring**
   - **Pass/Fail Logic:** Each sub-competency scored (1 = Pass, 0 = Fail)
   - **Final Score:** (Passes / Total Subs) × 100%
   - **Proficiency Tiers:**
     - Needs Work: < 80%
     - Proficient: ≥ 80% to < 95%
     - Mastery: ≥ 95% + all edge cases passed
   - Detailed breakdown shows which sub-competencies passed/failed
   - Results automatically saved to profile

### Profile & Progression
7. **Player Profile**
   - **Stats Dashboard:**
     - Total XP earned
     - PLYO tokens (platform currency)
     - Mastery count
     - Proficient count
     - Total badges
   
   - **Latest Achievements (Top 8 Badges):**
     - 🏆 Mastery badges (green)
     - ⭐ Proficient badges (purple)
     - 📊 Needs Work badges (magenta)
     - Each shows score % and completion date
   
   - **Complete Play History:**
     - Every game attempt tracked with:
       - Exact date and time
       - Validator name
       - Score percentage
       - Pass/fail status
       - Sub-competency breakdown
     - Sorted newest first
     - Players can replay validators to improve

8. **Skill Training Loop**
   - Players can replay any validator unlimited times
   - Each attempt creates new history entry
   - Track improvement over time
   - Earn better proficiency badges with practice

---

## 🎨 CREATOR FLOW

### Access & Dashboard
1. **Authentication**
   - Creator signs in with email/password
   - Role: "creator" assigned in database
   - Redirected to Creator Dashboard

2. **Creator Dashboard**
   - View all created templates
   - See template statistics:
     - Times customized by brands
     - Player completion count
     - Average scores
   - Filter: Published vs. Draft templates

### Template Creation
3. **Choose Template Type**
   - **AI-Generated Template:** Build from scratch using AI
   - **Custom Upload:** Upload pre-built HTML game

4. **AI-Generated Template Path**
   - Select competency from master list:
     - Analytical Thinking
     - AI & Big Data Skills
     - Creative Thinking
     - Leadership & Social Influence
     - Crisis Management
     - Budget Allocation
     - etc.
   
   - Choose sub-competencies to test (2-6 recommended)
   
   - Provide template details:
     - Template name
     - Description
     - Base prompt (scenario setup)
     - Game mechanics instructions
     - Duration (typically 3-5 minutes)
   
   - Click "Generate Template Preview"
   - AI creates validator structure using Lovable AI (Gemini models)

5. **Custom Upload Path**
   - Upload HTML file (game built externally)
   - Specify competencies tested
   - Add metadata (name, description, preview image)
   - Upload to cloud storage

### Publishing
6. **Preview & Test**
   - Test template functionality
   - Verify scoring logic works correctly
   - Ensure edge cases trigger properly

7. **Publish to Marketplace**
   - Set template as "Published"
   - Appears in Brand Marketplace
   - Available for brand customization

---

## 🏢 BRAND FLOW

### Access & Dashboard
1. **Authentication**
   - Brand signs in with email/password
   - Role: "brand" assigned in database
   - Redirected to Brand Dashboard

2. **Brand Dashboard**
   - **Tabs:**
     - Draft: Validators being customized
     - Published: Validators ready but not live
     - Live: Currently active validators
   
   - Each validator card shows:
     - Template name
     - Brand logo
     - Creation date
     - Unique code (when published)
     - Live dates (if scheduled)
     - Status indicators

### Creating Branded Validator
3. **Browse Marketplace**
   - View all published templates from creators
   - Filter by:
     - Competency type
     - Department
     - Duration
     - Difficulty
   - Preview validator description and mechanics

4. **Select Template**
   - Click "Customize" on chosen template
   - Opens Brand Customization Dialog

5. **Brand Customization**
   - **Visual Identity:**
     - Upload brand logo
     - Set primary color (e.g., #00FF00)
     - Set secondary color (e.g., #9945FF)
   
   - **Competencies:**
     - View selected competencies
     - Choose specific sub-competencies to test
   
   - **Custom Prompt:**
     - Add brand-specific scenario details
     - Customize edge cases
     - Add company-relevant context
     - Example: "You're at [BRAND] during Q4 launch..."

6. **Generate Branded Game**
   - Click "Generate & Save Game"
   - Backend edge function calls Lovable AI
   - AI generates custom HTML game with:
     - Brand colors throughout
     - Logo placement
     - Custom scenarios
     - Proper scoring logic
   - Takes 30-90 seconds to generate
   - Saved as draft in database

### Publishing & Distribution
7. **Preview Draft**
   - Test the generated validator
   - Verify branding looks correct
   - Check scoring logic
   - Make adjustments if needed (regenerate)

8. **Publish Validator**
   - Click "Publish" button
   - Opens scheduling dialog:
     - **Live Start Date:** When players can access
     - **Live End Date:** When validator expires
   
   - Click "Publish Now"
   - System generates unique code (e.g., PH99IH5K)
   - Validator moves to "Published" tab

9. **Go Live**
   - At scheduled start date, validator automatically appears:
     - On platform homepage "Live Validators" section
     - In Lobby "Brand Stores" with "LIVE" badge
   
   - **Shareable URL:** /play/[UNIQUE-CODE]
   - Brands can share link externally:
     - Social media
     - Email campaigns
     - Career pages
     - Recruiting events

### Monitoring (Future Feature)
10. **Analytics Dashboard** (Planned)
    - View player completion rates
    - See score distributions
    - Track proficiency levels achieved
    - Export candidate data
    - Download immutable receipts

---

## ⛓️ TECHNICAL ARCHITECTURE - TON BLOCKCHAIN INTEGRATION

### Overview
**Integration SDK:** Thirdweb SDK for TON blockchain  
**Purpose:** Immutable credential storage, token economy, verifiable achievements

---

### 🔗 ON-CHAIN COMPONENTS (TON Blockchain)

#### 1. **Player Identity & Wallet**
- **What:** TON wallet address as primary player identity
- **Why:** Decentralized identity, portability across platforms
- **Implementation:**
  - Thirdweb Connect Wallet component
  - TON wallet authentication
  - Store wallet address in player profile (off-chain reference)
- **Smart Contract:** Player Registry Contract
  ```solidity
  - registerPlayer(walletAddress, profileHash)
  - updatePlayerMetadata(walletAddress, metadataURI)
  ```

#### 2. **Validator Completion Certificates (NFTs)**
- **What:** Immutable proof of validator completion
- **Why:** Portable credentials, cannot be faked or deleted
- **Data Structure:**
  ```json
  {
    "validatorId": "uuid",
    "validatorName": "Priority Trade-Off Navigator",
    "playerWallet": "TON_ADDRESS",
    "brandName": "LEGO",
    "completionDate": "ISO_TIMESTAMP",
    "score": 80,
    "proficiencyLevel": "Proficient",
    "subCompetencies": [
      {"name": "Analytical Thinking", "passed": true},
      {"name": "Decision Making", "passed": true},
      {"name": "Edge Case Handling", "passed": false}
    ],
    "gameplayHash": "IPFS_HASH",
    "certificateImage": "IPFS_URL"
  }
  ```
- **Implementation:**
  - Mint NFT after validator completion (score ≥ 60%)
  - Store metadata on IPFS (distributed storage)
  - NFT contract: ERC-721 or TON NFT standard
  - **Thirdweb SDK:** `sdk.getNFTModule(contractAddress).mint()`
- **Smart Contract:** Validator Certificate Contract
  ```solidity
  - mintCertificate(playerWallet, validatorId, scoreData, metadataURI)
  - getCertificates(playerWallet) returns Certificate[]
  - verifyCertificate(certificateId) returns bool
  ```

#### 3. **Competency Badges (Semi-Fungible Tokens)**
- **What:** Tradeable/collectible badges for proficiency levels
- **Why:** Gamification, marketplace potential, skill verification
- **Types:**
  - 🏆 Mastery Badge (rarest)
  - ⭐ Proficient Badge (common)
  - 📊 Participation Badge (baseline)
- **Implementation:**
  - ERC-1155 or TON jetton standard
  - Different token IDs for each competency + proficiency combo
  - **Thirdweb SDK:** `sdk.getEditionModule(contractAddress).mint()`
- **Smart Contract:** Competency Badge Contract
  ```solidity
  - mintBadge(playerWallet, competencyId, proficiencyLevel, quantity)
  - balanceOf(playerWallet, tokenId) returns uint
  - uri(tokenId) returns metadataURI
  ```

#### 4. **PLYO Token (Platform Currency)**
- **What:** Fungible token for platform economy
- **Why:** Incentivize gameplay, enable marketplace transactions
- **Use Cases:**
  - Earn: Complete validators (10-50 PLYO per completion)
  - Spend: Unlock premium validators, buy cosmetics, tip creators
  - Stake: Earn yield for liquidity provision
- **Implementation:**
  - ERC-20 or TON jetton standard
  - **Thirdweb SDK:** `sdk.getTokenModule(contractAddress).transfer()`
- **Smart Contract:** PLYO Token Contract
  ```solidity
  - transfer(to, amount)
  - approve(spender, amount)
  - balanceOf(wallet) returns uint
  - mint(to, amount) [admin only]
  - rewardPlayer(wallet, validatorId, score) [automated rewards]
  ```

#### 5. **XP Points (Non-Transferable Token)**
- **What:** Soul-bound token tracking player progression
- **Why:** Cannot be bought/sold, represents true skill accumulation
- **Implementation:**
  - Soul-bound token (SBT) standard
  - Cannot transfer between wallets
  - **Thirdweb SDK:** Custom contract with transfer restrictions
- **Smart Contract:** XP Token Contract
  ```solidity
  - awardXP(playerWallet, amount, source)
  - getXP(playerWallet) returns uint
  - transfer() reverts (non-transferable)
  ```

#### 6. **Brand Validator Registry**
- **What:** On-chain registry of published validators
- **Why:** Transparency, provenance, cannot be censored
- **Data Stored:**
  ```json
  {
    "validatorId": "uuid",
    "brandWallet": "TON_ADDRESS",
    "templateId": "uuid",
    "publishedAt": "TIMESTAMP",
    "liveUntil": "TIMESTAMP",
    "uniqueCode": "PH99IH5K",
    "metadataURI": "ipfs://..."
  }
  ```
- **Implementation:**
  - Write to chain when brand publishes validator
  - **Thirdweb SDK:** `sdk.getContract(address).call('registerValidator', params)`
- **Smart Contract:** Validator Registry Contract
  ```solidity
  - registerValidator(validatorData, metadataURI)
  - getValidator(validatorId) returns ValidatorData
  - isLive(validatorId) returns bool
  - deactivateValidator(validatorId) [brand owner only]
  ```

#### 7. **Skill Verification Proofs**
- **What:** Cryptographic proofs of competency achievements
- **Why:** Verifiable by third parties (employers, universities)
- **Implementation:**
  - Zero-knowledge proofs (optional: ZK-SNARKs)
  - Merkle tree of all player achievements
  - Root hash stored on-chain
  - **Thirdweb SDK:** Custom contract deployment
- **Smart Contract:** Skill Proof Contract
  ```solidity
  - submitProof(playerWallet, competencyId, proofData)
  - verifyProof(playerWallet, competencyId, proof) returns bool
  - updateMerkleRoot(newRoot) [automated oracle]
  ```

---

### 💾 OFF-CHAIN COMPONENTS (Supabase Database)

#### What Stays Off-Chain:
1. **Game Logic & State**
   - Validator HTML/JavaScript code
   - Real-time gameplay data
   - Temporary session state
   - Timer data

2. **User Metadata**
   - Email addresses
   - Profile pictures
   - User preferences
   - Settings

3. **Brand Customization Data**
   - Custom prompts
   - Color schemes
   - Logo files (stored in Supabase Storage, referenced on-chain)
   - Draft validators (not yet published)

4. **Analytics & Telemetry**
   - Click tracking
   - Session duration
   - A/B test results
   - Performance metrics

5. **Template Library**
   - Creator-built templates
   - AI generation prompts
   - Preview images

**Why Off-Chain:**
- Cost: On-chain storage is expensive
- Speed: Database queries are faster
- Privacy: Not all data needs to be public
- Flexibility: Easier to update/modify

**Architecture Pattern:**
```
Off-Chain (Supabase) → Verification → On-Chain (TON)
      ↓                                    ↓
  Game Play                          Immutable Record
  User Data                         Portable Credential
  Analytics                         Verifiable Proof
```

---

### 🔧 THIRDWEB SDK IMPLEMENTATION

#### Installation
```bash
npm install @thirdweb-dev/react @thirdweb-dev/sdk
```

#### Setup
```typescript
// src/providers/ThirdwebProvider.tsx
import { ThirdwebProvider } from "@thirdweb-dev/react";

export function Providers({ children }) {
  return (
    <ThirdwebProvider 
      activeChain="ton" 
      clientId="YOUR_THIRDWEB_CLIENT_ID"
    >
      {children}
    </ThirdwebProvider>
  );
}
```

#### Wallet Connection
```typescript
import { ConnectWallet, useAddress, useContract } from "@thirdweb-dev/react";

function WalletButton() {
  const address = useAddress(); // Get connected wallet
  
  return <ConnectWallet theme="dark" />;
}
```

#### Mint Certificate NFT (After Validator Completion)
```typescript
// src/pages/ValidatorDemo.tsx
import { useContract, useContractWrite } from "@thirdweb-dev/react";

const CERTIFICATE_CONTRACT = "0x..."; // Deploy on TON

async function saveResultsToBlockchain(score, proficiencyLevel) {
  const { contract } = useContract(CERTIFICATE_CONTRACT);
  const { mutateAsync: mintCertificate } = useContractWrite(contract, "mintCertificate");
  
  const metadata = {
    name: "Priority Trade-Off Navigator - Certificate",
    description: `Achieved ${proficiencyLevel} with ${score}% score`,
    image: "ipfs://certificate-image",
    attributes: [
      { trait_type: "Score", value: score },
      { trait_type: "Proficiency", value: proficiencyLevel },
      { trait_type: "Validator", value: "Priority Trade-Off Navigator" },
      { trait_type: "Brand", value: "LEGO" },
      { trait_type: "Date", value: new Date().toISOString() }
    ]
  };
  
  await mintCertificate({ 
    to: address, 
    metadata 
  });
}
```

#### Award PLYO Tokens
```typescript
const PLYO_TOKEN_CONTRACT = "0x...";

async function awardTokens(amount: number) {
  const { contract } = useContract(PLYO_TOKEN_CONTRACT);
  const { mutateAsync: transfer } = useContractWrite(contract, "transfer");
  
  await transfer({ 
    to: playerWallet, 
    amount: amount 
  });
}
```

#### Read Player Certificates
```typescript
const { data: certificates } = useContractRead(
  contract, 
  "getCertificates", 
  [playerWallet]
);
```

---

### 📋 SMART CONTRACT REQUIREMENTS

#### Contracts to Deploy (7 total):

1. **PlayerRegistry.sol**
   - Maps wallet addresses to profile data
   - ~50 LOC

2. **ValidatorCertificate.sol** (ERC-721)
   - NFT for each validator completion
   - Includes metadata storage
   - ~200 LOC

3. **CompetencyBadge.sol** (ERC-1155)
   - Semi-fungible tokens for badges
   - Multiple token IDs per competency
   - ~250 LOC

4. **PLYOToken.sol** (ERC-20)
   - Platform currency
   - Includes reward distribution logic
   - ~150 LOC

5. **XPToken.sol** (Soul-Bound Token)
   - Non-transferable XP points
   - ~100 LOC

6. **ValidatorRegistry.sol**
   - Registry of all published validators
   - Brand ownership verification
   - ~180 LOC

7. **SkillProofVerifier.sol**
   - Merkle proof verification
   - Batch verification for efficiency
   - ~120 LOC

**Total Development Estimate:** 3-4 weeks  
**Security Audits Required:** Yes (critical for token contracts)

---

### 🔄 BLOCKCHAIN INTEGRATION FLOW

#### Example: Player Completes Validator

```
Player → Frontend: Complete validator gameplay
Frontend → Supabase: Save raw results (off-chain)
Supabase → Frontend: Confirm save
Frontend → Frontend: Calculate score & proficiency
Frontend → Thirdweb SDK: Mint certificate NFT
Thirdweb SDK → TON Blockchain: Execute mintCertificate()
TON Blockchain → Thirdweb SDK: Tx hash + certificate ID
Thirdweb SDK → Frontend: Success
Frontend → Thirdweb SDK: Award PLYO tokens
Thirdweb SDK → TON Blockchain: Execute transfer()
TON Blockchain → Frontend: Tokens transferred
Frontend → Thirdweb SDK: Award XP points
Thirdweb SDK → TON Blockchain: Execute awardXP()
Frontend → Player: Show results + on-chain confirmation
```

---

### 💰 GAS OPTIMIZATION STRATEGIES

1. **Batch Operations**
   - Mint multiple badges in single transaction
   - Batch XP awards daily instead of per-game

2. **Layer 2 / Side Chains**
   - Consider TON's workchain architecture
   - Move high-frequency writes to cheaper chains

3. **Lazy Minting**
   - Only mint certificates when player requests
   - Store commitment hash on-chain, full data off-chain

4. **Merkle Proofs**
   - Store only root hash on-chain
   - Players can prove ownership without full data

---

### 🔐 SECURITY CONSIDERATIONS

1. **Sybil Resistance**
   - Wallet verification required
   - Rate limiting on certificate minting
   - Cost barrier (small PLYO stake per attempt)

2. **Score Manipulation**
   - Backend validates all scores before minting
   - Supabase Edge Function acts as oracle
   - Cryptographic signatures from game results

3. **Smart Contract Security**
   - OpenZeppelin libraries for standards
   - Multi-sig for admin functions
   - Time-locked upgrades
   - Third-party audits (CertiK, Trail of Bits)

4. **Private Key Management**
   - Never store private keys in code
   - Thirdweb handles wallet security
   - Backend uses service account wallets for automated minting

---

### 📊 DATA FLOW: OFF-CHAIN ↔️ ON-CHAIN

```
┌─────────────────────────────────────────────────────────────┐
│                         PLAYER                               │
│                      (TON Wallet)                           │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────▼────────┐
    │  Play Validator │
    │   (React App)   │
    └────────┬────────┘
             │
    ┌────────▼────────────────────────────────────────────┐
    │         Supabase (Off-Chain)                        │
    │  • Game state                                       │
    │  • Temporary scores                                 │
    │  • User metadata                                    │
    └────────┬────────────────────────────────────────────┘
             │
    ┌────────▼────────────────────────────────────────────┐
    │    Validation & Verification                        │
    │    (Edge Function)                                  │
    │  • Verify score authenticity                        │
    │  • Check for cheating                               │
    │  • Generate certificate data                        │
    └────────┬────────────────────────────────────────────┘
             │
    ┌────────▼────────────────────────────────────────────┐
    │    Thirdweb SDK                                     │
    │  • mintCertificate()                                │
    │  • awardTokens()                                    │
    │  • updateRegistry()                                 │
    └────────┬────────────────────────────────────────────┘
             │
    ┌────────▼────────────────────────────────────────────┐
    │    TON Blockchain (On-Chain)                        │
    │  • Certificate NFT                                  │
    │  • PLYO tokens                                      │
    │  • XP points                                        │
    │  • Validator registry                               │
    │  • Merkle root (skill proofs)                       │
    └─────────────────────────────────────────────────────┘
             │
    ┌────────▼────────────────────────────────────────────┐
    │    External Verification                            │
    │  • Employers check certificates                     │
    │  • Universities verify competencies                 │
    │  • Other platforms read credentials                 │
    └─────────────────────────────────────────────────────┘
```

---

### 🎯 IMPLEMENTATION PRIORITY

**Phase 1: MVP (Current + Immediate Next)**
- ✅ Wallet connection (TON Connect)
- ⬜ Certificate NFT minting (on completion)
- ⬜ PLYO token contract deployment
- ⬜ Basic on-chain registry

**Phase 2: Token Economy**
- ⬜ XP soul-bound tokens
- ⬜ Competency badge system
- ⬜ PLYO earning/spending mechanics
- ⬜ Token marketplace

**Phase 3: Advanced Features**
- ⬜ Zero-knowledge proofs
- ⬜ Cross-chain bridges
- ⬜ DAO governance
- ⬜ Creator royalties (on-chain)

---

## 🔄 PLATFORM ECOSYSTEM

### Data Flow
```
Creator → Templates → Marketplace → Brand Customization → 
Generated Validator → Live Game → Player Completion → 
Results Storage → Profile Badges → Skill Verification
```

### Key Features
- **Competency-Based Education (CBE):** Validators test specific sub-competencies
- **Pass/Fail Logic:** Objective scoring (not subjective)
- **Proficiency Tiers:** Clear skill levels (Mastery/Proficient/Needs Work)
- **Replayability:** Players train by playing multiple times
- **Portable Credentials:** Results stored immutably (blockchain)
- **Brand Engagement:** Companies attract talent through branded validators

### Technical Stack
- **Frontend:** React, TypeScript, Three.js (3D globe), Tailwind CSS
- **Backend:** Supabase (Postgres database, authentication, storage, edge functions)
- **AI:** Lovable AI Gateway (Gemini models for game generation)
- **Blockchain:** TON blockchain with Thirdweb SDK
- **Storage:** Cloud storage for logos, custom games, assets + IPFS for on-chain metadata

---

## 📊 METRICS & SUCCESS INDICATORS

### Player Metrics
- Total validators completed
- Average proficiency score
- Skill improvement rate (score progression over time)
- XP and PLYO tokens earned
- Badges collected

### Creator Metrics
- Templates published
- Total brand customizations
- Player engagement (completion rates)
- Template popularity ranking

### Brand Metrics
- Validators deployed
- Player participation count
- Candidate quality (proficiency distribution)
- Time-to-hire impact
- Brand reach (link shares)

---

## TECHNICAL NOTES FOR DEVELOPMENT TEAM

### What Needs Blockchain Integration:
1. ✅ **Player wallet authentication** (Already implemented)
2. 🔄 **Certificate minting after validator completion** (HIGH PRIORITY)
3. 🔄 **PLYO token distribution** (HIGH PRIORITY)
4. ⬜ **Validator registry** (MEDIUM)
5. ⬜ **Badge/achievement tokens** (MEDIUM)
6. ⬜ **XP tracking** (LOW - can stay off-chain initially)

### Tech Stack Requirements:
- Thirdweb SDK: ⬜ Need to install
- TON wallet integration: ✅ (via @tonconnect/ui-react)
- Smart contracts: ⬜ Need deployment
- IPFS setup: ⬜ For metadata storage
- Oracle/backend signer: ⬜ For secure minting

---

**Platform Mission:** Democratize competency validation through gamified assessments, 
enabling players to prove skills, creators to build assessments, and brands to identify talent.
