# Code Graph - Tijarah Frontend & Backend

## Pengenalan

Code Graph ini menggambarkan struktur dan dependency relationship antar modul pada Frontend (Next.js) dan Backend (Fastify). Visual ini membantu memahami arsitektur sistem dan memudahkan onboarding developer baru.

---

## 1. Frontend Architecture Graph

### 1.1 High-Level Flow

```mermaid
graph TB
    subgraph Client [Client Browser]
        Browser[User Browser]
    end

    subgraph NextJSApp["Next.js App - Frontend"]
        LangRoute["[lang] Routes"]
        Pages[Pages / app/[lang]/]
        Layout["App Layout"]

        Molecule[Molecules / components/molecule/]
        Atom[Atoms / components/atom/]
        NextUI[(NextUI / HeroUI)]

        State[Zustand Store]
        QL[TanStack Query]
        Forms[React Hook Form]

        ClientAPI[Axios Client]
    end

    subgraph Supabase["Supabase Services"]
        Auth[(Auth Service)]
        DB[(PostgreSQL via SDK)]
    end

    Browser -->|HTTP | LangRoute
    LangRoute --> Pages
    Pages --> Layout
    Layout --> Molecule
    Layout --> State
    Layout --> QL

    Molecule --> Atom
    Atom --> NextUI
    Atom --> Form

    Molecule -. knowledge.-> ClientAPI
    ClientAPI -->|REST API| BackendAPI

    QL -. fetch data.-> Supabase
    State <-- sync --> QL

    subgraph ModuleExamples["Example Modules"]
        ShopModule["Shop Module"]
        CartModule["Cart Module"]
        AuthModule["Auth Module"]
    end

    ShopModule --> Molecule
    CartModule --> Molecule
    AuthModule --> Molecule
```

---

### 1.2 Component Hierarchy (Atomic Design)

```mermaid
graph LR
    A[Pages / app/[lang]/] --> B[Molecules]
    B --> C[Atoms]
    C --> D[NextUI / HeroUI]
    C --> E[Design Tokens / globals.css]

    A -->|Page-level| F[Organic]
    F -->|module| A

    style C fill:#f9f,stroke:#333,stroke-width:2px
    style D fill:#bbf,stroke:#333
    style E fill:#fa0,stroke:#333
```

---

### 1.3 State Management Flow

```mermaid
graph LR
    subgraph Frontend[Frontend State]
        UI[UI Components]
        S[Zustand Store]
        QS[TanStack Query Cache]
    end

    UI -->|read/write| S
    S -->|sync| QS
    QS -->|read/write| BackendAPI
    QS -->|invalidate| S

    style S fill:#9f9,stroke:#333
```

---

## 2. Backend Architecture Graph

### 2.1 High-Level Architecture

```mermaid
graph TB
    subgraph Client["HTTP Client / Frontend"]
        Axios[Axios Frontend Client]
        Token[JWT / Supabase Token]
    end

    subgraph FastifyApp[Fastify App - Backend]
        Health[Health Check /api/v1/health]
        Routes[API Routes /api/v1/]

        subgraph Core Plugins
            CORS[CORS Plugin]
            Helmet[Helmet Security]
            RateLimiter[Rate Limiter]
        end

        subgraph Middlewares
            AuthMiddleware[Auth Middleware]
            Validation[Zod Validation]
        end

        subgraph Feature Modules
            AuthModule[Auth Module]
            AddressModule[Address Module]
            CheckoutModule[Checkout Module]
            CreditModule[Credit Module]
            NotificationModule[Notification Module]
        end

        subgraph Service Layer
            AuthSvc[Auth Service]
            AddressSvc[Address Service]
            CheckoutSvc[Checkout Service]
            CreditSvc[Credit Service]
        end

        subgraph Database
            Prisma[(Prisma ORM)]
            PG[(PostgreSQL)]
        end

        Server[(Server Instance)]
    end

    subgraph SupabaseAuth["Supabase Authentication"]
        serverAuth[Server SDK]
        AuthDB[(User/Auth DB)]
    end

    Client --> Axios
    Axios -->|Bearer Token| Token
    Token --> AuthMiddleware

    FastifyApp --> CORS
    FastifyApp --> Helmet
    FastifyApp --> RateLimiter

    Routes --> Health
    Routes --> AuthModule

    AuthModule --> Validation
    AddressModule --> Validation
    CheckoutModule --> Validation
    CreditModule --> Validation

    AuthModule --> AuthSvc
    AddressModule --> AddressSvc
    CheckoutModule --> CheckoutSvc
    CreditModule --> CreditSvc

    AuthSvc --> Prisma
    AddressSvc --> Prisma
    CheckoutSvc --> Prisma
    CreditSvc --> Prisma

    Prisma --> PG

    AuthSvc --> serverAuth
    serverAuth --> AuthDB

    FastifyApp --> Server
```

---

### 2.2 Module Dependency Graph

```mermaid
graph TD
    Auth[Auth Module]
    Address[Address Module]
    Checkout[Checkout Module]
    Credit[Credit Module]
    Notification[Notification Module]

    User[(User Table)]
    Order[(Order Table)]
    AddressUser[Address Table]
    Cart[(Cart Table)]
    CreditWallet[(Credit Wallet)]

    Auth -->|user_id, email| User
    Address -->|user_id| AddressUser
    Address -->|address_id| Order
    Checkout -->|user_id, address_id| User
    Checkout -->|items| Order
    Checkout -->|user_id| Cart
    Credit -->|user_id| CreditWallet

    Auth -. optional.-> Address
    Checkout -. needs.-> Credit

    style Auth fill:#e1f5ff,stroke:#0066cc
    style Checkout fill:#fff3e0,stroke:#ff9800
    style Credit fill:#f3e5f5,stroke:#9c27b0
```

---

### 2.3 API Request Flow (Detailed)

```mermaid
sequenceDiagram
    participant FW as Frontend (Next.js)
    participant AX as Axios Client
    participant FR as Fastify Router
    participant Zod as Zod Validator
    participant Auth as Auth Service
    participant DB as Database (Prisma)
    participant SA as Supabase Auth

    FW->>AX: HTTP Request (Bearer Token)
    AX->>FR: POST /api/v1/auth/register
    FR->>Zod: Validate Request Body
    Zod-->>FR: Validation Errors (400)
    Zod-->>FR: Valid Payload
    FR->>Auth: authService.register(email, password, lang)

    Auth->>SA: supabase.auth.signUp(payload)
    SA-->>Auth: Auth Result (error/data)
    Auth->>DB: Create User (prisma)
    Auth-->>FR: User + Token

    FR->>FW: Response { status, message, data }

    alt Error Occurs
        Auth-->>FR: AppError (400/401/403)
        FR-->>FW: Error Response
        FW-->>User: Display Error
    else Success
        FR-->>FW: Success Response
        FW-->>User: Redirect/Success
    end
```

---

## 3. Database Schema Graph

### 3.1 Entity Relationship Diagram

```mermaid
erDiagram
    USER ||--o{ ADDRESS : "has"
    USER ||--o{ ORDER : "places"
    USER ||--o{ CART_ITEM : "has"
    USER ||--o{ CREDIT_WALLET : "owns"
    ORDER ||--o{ ORDER_ITEM : "contains"
    ORDER ||--o| ADDRESS : "ships_to"
    ADDRESS ||--|| USER : "belongs_to"
    ADDRESS ||--o| ORDER_ITEM : "used_for"

    USER {
        uuid id PK
        string email UK
        string phone
        string fullName
        timestamp createdAt
        timestamp updatedAt
    }

    ORDER {
        uuid id PK
        uuid userId FK
        uuid addressId FK
        float total
        string status
        timestamp createdAt
    }

    ORDER_ITEM {
        uuid id PK
        uuid orderId FK
        uuid productId FK
        integer quantity
        float price
        float total
    }

    ADDRESS {
        uuid id PK
        uuid userId FK
        string label
        string address1
        string address2
        string city
        string postalCode
        string country
        boolean isPrimary
    }

    CREDIT_WALLET {
        uuid id PK
        uuid userId FK
        float balance
        float frozen
        string currency
    }

    CART_ITEM {
        uuid id PK
        uuid userId FK
        uuid productId FK
        integer quantity
        timestamp createdAt
    }
```

---

### 3.2 Module -> Table Mapping

| Module | Entity | Operations |
|--------|--------|------------|
| **Auth** | `USER` table | Register, Login, Update Profile, Token Generation |
| **Auth** | `Supabase Auth` tokens | JWT & Supabase Auth tokens |
| **Addresses** | `ADDRESS` table | CRUD, Set Primary |
| **Addresses** | `USER` table | Query addresses by user |
| **Checkout** | `ORDER` table | Create Order, Track Status |
| **Checkout** | `ORDER_ITEM` table | Add Items, Calculate Total |
| **Checkout** | `CART_ITEM` table | Read Cart Items |
| **Checkout** | `ADDRESS` table | Get shipping address |
| **Credit** | `CREDIT_WALLET` table | Manage Balance, Transactions |
| **Notifications** | (Not yet defined) | Pending implementation |

---

## 4. Feature Module Dependency Layers

### 4.1 Layered Architecture

```mermaid
graph TB
    subgraph Layer1["Layer 1: Controller"]
        AuthCtrl[Auth Controller]
        AddressCtrl[Address Controller]
        CheckoutCtrl[Checkout Controller]
    end

    subgraph Layer2["Layer 2: Service"]
        AuthSvc[Auth Service]
        AddressSvc[Address Service]
        CheckoutSvc[Checkout Service]
    end

    subgraph Layer3["Layer 3: Schema / Validation"]
        AuthSchema[Auth Schema]
        AddressSchema[Address Schema]
        CheckoutSchema[Checkout Schema]
    end

    subgraph Layer4["Layer 4: Database / External API"]
        Prisma[(Prisma ORM)]
        Supabase[(Supabase Auth)]
    end

    subgraph Layer5["Layer 5: Shared Resources"]
        ErrorUtil[AppError Utility]
        ResponseUtil[Response Utility]
        I18n[Internationalization]
    end

    AuthCtrl --> AuthSvc
    AddressCtrl --> AddressSvc
    CheckoutCtrl --> CheckoutSvc

    AuthSvc --> AuthSchema
    AddressSvc --> AddressSchema
    CheckoutSvc --> CheckoutSchema

    AuthSvc --> Prisma
    AuthSvc --> Supabase
    AddressSvc --> Prisma
    CheckoutSvc --> Prisma

    AuthSvc --> ErrorUtil
    AuthCtrl --> ResponseUtil
    AuthSvc --> I18n

    style AuthCtrl fill:#e1f5ff,stroke:#0066cc
    style CheckoutCtrl fill:#fff3e0,stroke:#ff9800
    style CheckoutSvc fill:#fff8e1,stroke:#ffc107
```

---

## 5. Frontend API Integration Graph

### 5.1 Axios Client Setup

```mermaid
graph LR
    subgraph AxiosSetup["Axios Client Setup"]
        Create[Create Axios Instance]
        Middleware[Middleware Chain]
        Interceptor1[Request Interceptor]
        Interceptor2[Response Interceptor]
        BaseURL[Base URL Config]
    end

    Interceptor1 --> Interceptor2
    Interceptor2 --> Handler[Error Handler]

    style Middleware fill:#f9f,stroke:#333
```

### 5.2 TanStack Query Data Flow

```mermaid
graph TB
    subgraph Query Flow
        UseQuery[useQuery Hook]
        Cache[(Query Cache)]
        StaleTime[Stale Time]
        Network[Network Request]

        OnSuccess[Success Callback]
        OnError[Error Callback]
    end

    UseQuery --> Network
    Network -->|Success| Cache
    Network -->|Error| OnError
    Cache -->|Cache Hit| OnSuccess
    Cache -->|Cache Miss| Network

    style Cache fill:#e1f5ff,stroke:#0066cc
    style Network fill:#fff3e0,stroke:#ff9800
```

---

## 6. Authentication Flow Graph

### 6.1 Complete Auth Flow

```mermaid
sequenceDiagram
    participant FW as Frontend
    participant API as Backend API
    participant Supabase as Supabase Auth
    participant DB as Local DB

    Note over FW,DB: Scenario: Email/Password Login

    FW->>API: POST /api/v1/auth/login { email, password }
    API->>Supabase: supabase.auth.signInWithPassword

    alt Supabase Auth Fails
        Supabase-->>API: Error { message, code }
        API-->>FW: 400 Bad Request - Invalid credentials
        FW-->>User: Show error message
    else Auth Success
        Supabase-->>API: User Data + Access Token
        API->>DB: Fetch User Profile
        DB-->>API: User Profile
        API->>API: Generate Internal JWT Token
        API-->>FW: { user, token, appToken }
        FW->>FW: Save tokens (localStorage)
        FW-->>User: Redirect to Home
    end

    Note over FW,DB: Scenario: OTP Verification

    API->>Supabase: supabase.auth.verifyOtp { email, token, type }
    Supabase-->>API: User Verified
    API-->>FW: Success Response + Refresh Tokens
    FW-->>User: Continue to next step
```

---

## 7. Performance Optimization Graph

### 7.1 Database Query Optimization

```mermaid
graph TB
    subgraph RawQuery[Raw Prisma Query]
        SelectAll[SELECT * FROM users]
        CrossJoin[CROSS JOIN or JOIN]
        ApplyFilter[WHERE filter]
        FetchAll[fetchAll()]
    end

    subgraph OptimizedQuery[Optimized Query]
        Project[PRISMA SELECT: {id, name, email}]
        Where[WHERE: WHERE email = $1]
        Limit[LIMIT: LIMIT 20]
        Skip[SKIP: SKIP offset]
        First[first()]
    end

    subgraph SchemaIndex[Schema Indexing]
        EmailIndex[@@index([email])]
        UserIdIndex[@@index([userId])]
    end

    SelectAll --> FetchAll
    Project --> First

    FetchAll -. no index -.-> SlowExecution[Slow Execution]

    Where & Limit & Skip --> First
    Project & Where --> FastExecution[Fast Execution]

    SlowExecution --> ReindexRecommendation["Recommend: Add Index"]
    FastExecution --> QueryOk["Query is Fast"]

    style SlowExecution fill:#ffebee,stroke:#d32f2f
    style FastExecution fill:#e8f5e9,stroke:#2e7d32
```

---

## 8. Common Error Scenarios

### 8.1 Error Flow Diagram

```mermaid
graph TD
    subgraph ErrorScenarios[Common Error Scenarios]

        scenario1[Scenario 1: Validation Error]
        scenario2[Scenario 2: Auth Error]
        scenario3[Scenario 3: Database Error]
        scenario4[Scenario 4: Supabase Error]

        start[Start Request]

        start --> scenario1
        start --> scenario2
        start --> scenario3
        start --> scenario4

        scenario1 -->|400 BadRequest| step1[Return AppError<Validate Error>]
        scenario2 -->|401 Unauthorized / 403 Forbidden| step2[Return AppError<Auth Error>]
        scenario3 -->|500 Internal Server Error| step3[Return AppError<Database Error>]
        scenario4 -->|500 Internal Server Error| step4[Return AppError<Supabase Error>]

        step1 --> frontend[Frontend: Display Validation Messages]
        step2 --> frontend[Frontend: Redirect to Login / Permission Denied]
        step3 --> frontend[Frontend: Show System Error + Retry Button]
        step4 --> frontend[Frontend: Show System Error + Retry Button]

        style scenario1 fill:#ffebee,stroke:#d32f2f
        style scenario2 fill:#fff3e0,stroke:#ff9800
        style scenario3 fill:#ffebee,stroke:#d32f2f
        style scenario4 fill:#ffebee,stroke:#d32f2f
    end
```

---

## 9. Interactive Arrows

### 9.1 Development Workflow

```mermaid
graph LR
    A[Start Development] --> B[Read Code Graph]
    B --> C[Upsert New Module]
    C --> D[Follow Architecture]
    D --> E[Run Matpock Skills]
    E --> F[Validate with Linting]
    F --> G[Push to Git]
    G --> H[Deploy to Production]

    style B fill:#e1f5ff,stroke:#0066cc
    style E fill:#fff3e0,stroke:#ff9800
    style H fill:#e8f5e9,stroke:#2e7d32
```

---

## 10. Glossary

| Term | Description |
|------|-------------|
| **PascalCase** | Naming convention untuk component class (TijarahButton) |
| **camelCase** | Function variable naming (getUserData) |
| **UPPER_SNAKE_CASE** | Constants (MAX_RETRIES) |
| **UUID** | Universally Unique Identifier for database keys |
| **Design Tokens** | CSS custom properties untuk konsistensi (var(--primary-sage)) |
| **Prisma ORM** | Database toolkit untuk type-safe queries |
| **TanStack Query** | Data fetching & caching library |
| **NextUI** | React UI library untuk UI components (base untuk Tijarah components) |
| **Zod** | Runtime validation library untuk TypeScript schemas |
| **Design System** | Set standard untuk warna, typography, spacing |

---

**Last Updated:** 2026-10-15
**Version:** 1.0.0
**Maintained by:** Tijarah Team