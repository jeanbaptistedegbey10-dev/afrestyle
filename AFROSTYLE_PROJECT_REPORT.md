# AfroStyle — Rapport d'audit technique complet

> **Date de l'audit** : 21 septembre 2026
> **Dépôt** : `https://github.com/jeanbaptistedegbey10-dev/afrestyle` — branche `main` @ `92baa87`
> **Périmètre audité** : `D:\PROJETS\afrestyle` (front + back Next.js), scripts d'exploitation, configuration Shopify, Prisma, pnpm/Next.
> **Méthode** : lecture statique de **61 fichiers TS/TSX (7 738 lignes)**, 5 routes API, 20 composants, 18 pages, 10 scripts `.mjs`, `prisma/schema.prisma`, fichiers de config, `git log` / `git ls-files`, inspection de la configuration Next réellement compilée (`.next/required-server-files.json`), recherche d'occurrences (`Sopexa`, `multivendor`, `admin/api`…).
> **Note** : aucune modification de code n'a été apportée pendant l'audit — ce document est un rapport, pas un patch.

---

## 0. Synthèse exécutive

AfroStyle est aujourd'hui une **vitrine e-commerce headless solide à ~60 % d'avancement** : le design system est cohérent, l'intégration Storefront API (catalogue, panier, client) est fonctionnelle sur le papier, et la base Next.js 16 / React 19 / Tailwind 4 est moderne. En revanche, **le projet porte encore l'architecture d'une marketplace multivendeur héritée** (12 « designers » avec comptes, candidatures, sessions, `stripeAccountId`) qui n'a jamais été réellement exploitée, et **huit problèmes bloquants** empêchent tout déploiement fiable en l'état (build local cassé, mutations Admin appelées sur l'API Storefront, endpoints de seed publics, incohérence d'authentification admin).

### 0.1 Scores par domaine

| Domaine | Score | Commentaire |
| - | :-: | - |
| Stack & outillage | 7/10 | Next 16 / React 19 / Tailwind 4 / Prisma 7 — très moderne, mais config dupliquée et dépendances mortes |
| Structure & conventions | 8/10 | Arborescence App Router propre, séparation `lib/` / `components/` / `actions/` lisible |
| Intégration Storefront API | 5/10 | Requêtes GraphQL réelles et bien écrites, mais version d'API retirée + couche admin hors périmètre Storefront |
| État (Zustand) | 7/10 | Persistance propre du panier, mais pas de resynchronisation (`getCart` jamais appelé) |
| Panier & Checkout | 6/10 | Ajout/mise à jour/suppression opérationnels, redirection checkout Shopify ; pas de page panier, pas de codes promo, pas de webhooks |
| Catalogue & fiches produit | 5/10 | Filtres par tags, sélecteur de variantes naïf (buggé sur combinaisons), pas de pagination réelle |
| Sécurité | 3/10 | Endpoints de seed publics, token Admin en clair dans les scripts, auth admin incohérente |
| Qualité / tests | 3/10 | 0 test, `strict: false`, aucun `error.tsx` / `not-found.tsx` |
| SEO / contenu | 4/10 | Metadata partielle, pas de sitemap / robots / JSON-LD |
| Multivendeur / Sopexa | 2/10 | Architecture présente, jamais fonctionnelle (aucun payout), à retirer ou geler |

**Score global : 5,5/10 — bon socle technique, non déployable en l'état.**


### 0.2 Les 8 problèmes bloquants (à corriger avant toute mise en production)

| # | Gravité | Problème | Impact | Correctif |
| - | :-: | - | - | - |
| B1 | 🔴 Critique | `node_modules` cassé : toutes les jonctions pnpm pointent vers l'ancien chemin `D:\afrestyle\node_modules\.pnpm\...` alors que le projet est dans `D:\PROJETS\afrestyle` | `pnpm dev` / `pnpm build` / `tsc` échouent (`Cannot find module 'next'`) | `Remove-Item -Recurse -Force node_modules` puis `pnpm install` |
| B2 | 🔴 Critique | Les mutations **Admin API** (`productCreate`, `productPublish`) sont envoyées au **endpoint Storefront** (`/api/2024-01/graphql.json` + token Storefront) dans `src/lib/shopify/products.ts` | La création de produit par un créateur échoue systématiquement | Créer un client Admin séparé (`/admin/api/<version>/graphql.json` + `SHOPIFY_ADMIN_TOKEN`) |
| B3 | 🔴 Critique | `/api/seed/designers`, `/api/seed/shopify-products`, `/api/seed/product-images`, `/api/test-shopify` sont **publics et non authentifiés** | N'importe qui peut créer des comptes designer (mot de passe `password123`), créer des produits Shopify et uploader des images | Supprimer ces routes du dépôt ou les protéger via `assertAdmin()` + supprimer `scripts/` |
| B4 | 🔴 Critique | Incohérence d'auth admin : le login écrit le cookie `admin_token = ADMIN_PASSWORD`, mais le middleware et `assertAdmin()` le comparent à `ADMIN_SECRET_TOKEN` (absent de `.env.local`) | Panneau `/admin/*` inaccessible (boucle de redirection) selon la config d'environnement | Aligner sur **une seule** variable (`ADMIN_SECRET_TOKEN` généré aléatoirement) |
| B5 | 🟠 Majeur | Token Admin API **en clair** dans les 10 fichiers de `scripts/` (`shpat_b9010…db1`) — non commité (`scripts/` est gitignoré) mais présent sur disque | Fuite de credentials si le dossier est copié/partagé | **Révoquer le token** dans l'admin Shopify, le régénérer, ne plus jamais l'écrire en dur |
| B6 | 🟠 Majeur | `SHOPIFY_ADMIN_TOKEN` **n'existe pas** dans `.env.local` (le fichier déclare `SHOPIFY_ADMIN_ACCESS_TOKEN`) ; `SHOPIFY_WEBHOOK_SECRET` déclaré mais jamais lu | Fallback `"REPLACE_WITH_YOUR_ADMIN_TOKEN"` → 401 sur les routes de seed ; webhooks inexistants | Renommer la variable + contrôle de démarrage (`assertEnv`) |
| B7 | 🟠 Majeur | Version d'API **`2024-01` retirée** (4 occurrences) : Shopify « *falls forward* » silencieusement vers la plus ancienne version stable supportée | Comportement imprévisible, champs pouvant disparaître, erreurs de schéma impossibles à reproduire | Épingler une version stable récente (ex. `2026-07`) dans **une** constante unique |
| B8 | 🟠 Majeur | Aucune invalidation du cache catalogue : `next: { tags: ["products"] }` posé mais **aucun `revalidateTag()`** ni webhook `products/*` | Les nouveaux produits / modifications n'apparaissent qu'après redéploiement | Créer `/api/revalidate` + webhooks Shopify signés (`SHOPIFY_WEBHOOK_SECRET`) |

### 0.3 Ce qui est déjà bon (à préserver)

- Design system cohérent et premium : palette or/encre/crème centralisée dans `@theme` (Tailwind v4), typos Playfair Display + DM Sans, composants `.btn-primary` / `.btn-outline`.
- Requêtes GraphQL écrites à la main, lisibles, avec fragment `ProductFragment` réutilisé (`queries/products.ts`, `queries/cart.ts`, `queries/customer.ts`).
- Client `shopifyFetch` unique, générique et typé, gestion des `errors`, tags de cache — **bonne fondation** ; il ne manque qu'une couche Admin et une version d'API paramétrée.
- Server Actions propres et sécurisées côté cookie (`httpOnly`, `secure` en prod, `sameSite: "lax"`, expiration synchronisée avec celle de Shopify).
- Panier Shopify réel (pas de panier maison) : `cartCreate` / `cartLinesAdd` / `cartLinesUpdate` / `cartLinesRemove`, source de vérité unique côté Shopify.
- `middleware.ts` protège `/admin/*` et `/dashboard/*`, avec comparaison `crypto.timingSafeEqual` côté Server Actions (bonne pratique anti-timing attack).
- Normalisation des données Shopify (`edges/node` → tableaux) : l'UI ne dépend pas de la forme Relay de l'API.

---

## 1. Stack actuelle et structure des dossiers

### 1.1 Stack applicative (relevé depuis `package.json`)

| Dépendance | Version déclarée | Rôle réel dans le code | Statut |
| - | - | - | - |
| `next` | `16.2.6` | Framework App Router, RSC, Server Actions, `next/image` | ✅ utilisé partout |
| `react` / `react-dom` | `19.2.4` | UI | ✅ utilisé |
| `typescript` | `^5` | Typage (`strict: false`, `noImplicitAny: false`) | ⚠️ non strict |
| `tailwindcss` + `@tailwindcss/postcss` | `^4.3.0` / `^4` | Styles (config `@theme` dans `globals.css`) | ✅ utilisé |
| `zustand` | `^5.0.13` | Store panier `afrestyle-cart-v2` + `persist` | ✅ utilisé |
| `@prisma/client` + `prisma` + `@prisma/adapter-pg` + `pg` | `^7.8.0` / `^8.21.0` | DB PostgreSQL (Neon) — designers, sessions, candidatures | ✅ utilisé (designer uniquement) |
| `bcryptjs` + `@types/bcryptjs` | `^3.0.3` / `^3.0.0` | Hash mot de passe créateur (12 rounds) | ✅ utilisé / ⚠️ stub déprécié |
| `react-hot-toast` | `^2.6.0` | Notifications panier | ✅ utilisé |
| `lucide-react` | `^1.16.0` | Icônes | ✅ utilisé |
| `clsx` + `tailwind-merge` | `^2.1.1` / `^3.6.0` | Helper `cn()` | ✅ utilisé |
| `dotenv` | `^17.4.2` | Chargé par `prisma.config.ts` | ✅ utilisé |
| `@shopify/hydrogen-react` | `^2026.4.2` | **Aucun import trouvé** | ❌ dépendance morte |
| `@radix-ui/react-dialog` | `^1.1.15` | **Aucun import trouvé** (`CartDrawer` est fait main) | ❌ dépendance morte |
| `@radix-ui/react-select` | `^2.2.6` | **Aucun import trouvé** (les `<select>` sont natifs) | ❌ dépendance morte |
| `graphql` | `^16.14.0` | **Aucun import** (les requêtes sont des template strings) | ❌ dépendance morte |
| `graphql-tag` | `^2.12.6` | **Aucun import** | ❌ dépendance morte |
| `next-themes` | `^0.4.6` | **Aucun import** (thème sombre codé en dur) | ❌ dépendance morte |
| `autoprefixer` | `^10.5.0` | **Non référencé** dans `postcss.config.mjs` (Tailwind v4 gère les préfixes) | ❌ dépendance morte |

**Gestionnaire de paquets** : pnpm 11.1.3 (Node v25.9.0), `pnpm-workspace.yaml` avec `allowBuilds` / `ignoredBuiltDependencies`.

> ⚠️ `pnpm-workspace.yaml` est **contradictoire** : `sharp` et `unrs-resolver` apparaissent à la fois dans `allowBuilds` et dans `ignoredBuiltDependencies`. À nettoyer (garder `allowBuilds: ['@prisma/engines','prisma','sharp']`).

### 1.2 Outillage, scripts npm et configuration

| Fichier | Contenu | Remarque |
| - | - | - |
| `package.json` → `scripts` | `dev`, `build`, `start`, `lint`, `postinstall: prisma generate` | ⚠️ aucun script `db:seed`, `typecheck`, `test` |
| `next.config.js` | `images.remotePatterns` (cdn.shopify.com, `**.myshopify.com`), `experimental.serverActions.allowedOrigins` | ✅ **c'est ce fichier qui est réellement chargé** (vérifié dans `.next/required-server-files.json`) |
| `next.config.ts` | Fichier vide (`const nextConfig = {}`) | ❌ **mort** : doublon ignoré, source de confusion |
| `tsconfig.json` | `strict: false`, `noImplicitAny: false`, alias `@/* → ./src/*` | ⚠️ dette de typage |
| `prisma.config.ts` | Prisma 7 : `schema` + `datasource.url` via `env("DATABASE_URL")` | ✅ correct |
| `postcss.config.mjs` | `@tailwindcss/postcss` uniquement | ✅ correct |
| `eslint.config.mjs` | `eslint-config-next/core-web-vitals` + `typescript` | ✅ correct |
| `vercel.json` | `buildCommand: pnpm build`, framework `nextjs` | ✅ correct |
| `settings.json` | Format-on-save Prettier (fichier d'IDE) | ⚠️ à déplacer dans `.vscode/` |
| `.kilo/worktrees/healthy-brush/` | **Copie complète du projet** (worktree) non suivie par git | ❌ à supprimer (double toutes les recherches `grep`) |

### 1.3 Inventaire chiffré

| Indicateur | Valeur |
| - | - |
| Fichiers TS/TSX dans `src/` | 61 |
| Lignes de code dans `src/` | 7 738 |
| Pages App Router (`page.tsx`) | 18 |
| Routes API (`route.ts`) | 5 |
| Composants React (`components/**/*.tsx`) | 20 |
| Scripts d'exploitation (`scripts/*.mjs`) | 10 (gitignorés) |
| Tests (`.test.ts` / `.spec.ts`) | **0** |
| Fichiers suivis par git | 94 |

### 1.4 Structure des dossiers

```text
afrestyle/
├── .env                     # DATABASE_URL (Neon Postgres) — non versionné
├── .env.local               # Shopify + Admin — non versionné
├── .kilo/worktrees/…        # ❌ copie morte du projet (à supprimer)
├── prisma/
│   └── schema.prisma        # Designer, DesignerProduct, DesignerApplication, DesignerSession
├── public/
│   ├── uploads/avatars/     # 12 SVG générés par le seed
│   └── *.svg                # assets par défaut create-next-app (à nettoyer)
├── scripts/                 # ❌ 10 scripts .mjs d'exploitation (gitignorés, token en clair)
├── src/
│   ├── middleware.ts                            # Garde /admin/* et /dashboard/*
│   ├── app/
│   │   ├── layout.tsx, page.tsx, globals.css
│   │   ├── about/, lookbook/, collections/, order-confirmed/
│   │   ├── products/[handle]/                   # Fiche produit (SSG + variantes)
│   │   ├── designers/, designers/[handle]/, designers/apply/
│   │   ├── account/, account/login|register|forgot-password/
│   │   ├── dashboard/, dashboard/login|pending/ # ⚠️ espace créateur (multivendeur)
│   │   ├── admin/, admin/login/, admin/designers/  # ⚠️ back-office créateurs
│   │   └── api/
│   │       ├── test-shopify/                    # ❌ public
│   │       ├── upload/avatar/                   # ⚠️ écrit dans public/ (KO sur Vercel)
│   │       └── seed/{designers,product-images,shopify-products}/  # ❌ public
│   ├── components/
│   │   ├── layout/    (Navbar, Footer)
│   │   ├── home/      (HeroSection, ProductsSection, DesignersSection, StorySection, NewsletterSection)
│   │   ├── product/   (ProductCard, ProductGrid, ProductImages, ProductForm, CollectionFilters)
│   │   ├── cart/      (CartDrawer)
│   │   ├── auth/      (LoginForm, RegisterForm, ForgotPasswordForm)
│   │   ├── designer/  (ApplicationForm, DesignerLoginForm, ProductForm)   # ⚠️ multivendeur
│   │   └── admin/     (AdminLoginForm)                                    # ⚠️ multivendeur
│   ├── hooks/
│   │   └── useCart.ts                          # Orchestration panier + toasts
│   └── lib/
│       ├── db.ts                               # PrismaClient + PrismaPg adapter
│       ├── utils.ts                            # cn(), formatPrice(), extractTag()
│       ├── store/cart.store.ts                 # Zustand + persist
│       ├── actions/                            # Server Actions (auth, admin, designer)
│       ├── seed/designers.ts                   # ⚠️ seed exécutable
│       └── shopify/
│           ├── client.ts                       # shopifyFetch (Storefront)
│           ├── products.ts                     # Catalogue + …mutations Admin (❌ mal placées)
│           ├── cart.ts                         # Panier (source de vérité Shopify)
│           ├── customer.ts                     # Comptes clients Shopify
│           ├── types.ts                        # Types Shopify + type `Product` normalisé
│           └── queries/{products,cart,customer}.ts
```

**Conventions observées** (à conserver) : alias `@/*`, un dossier par domaine, composants serveur par défaut et `"use client"` explicitement en tête de fichier client, commentaires pédagogiques en français, styles tokens (`#D4AF37`, `#0F172A`…) plutôt que classes arbitraires.

### 1.5 Modèle de données Prisma (PostgreSQL / Neon)

| Modèle | Champs clés | Utilité réelle aujourd'hui |
| - | - | - |
| `Designer` | `handle`, `brandName`, `shopifyVendorName` (unique), `status` (PENDING/APPROVED/REJECTED/SUSPENDED), `autoPublish`, `passwordHash`, `stripeAccountId` | Fiches créateurs + annuaire ; `autoPublish` et `stripeAccountId` ne servent qu'au flux marketplace |
| `DesignerProduct` | `shopifyProductId` (unique), `designerId` | Table de jointure produit Shopify ↔ créateur |
| `DesignerApplication` | `motivation`, `instagramUrl`, `portfolioUrl`, `reviewedAt/By` | Candidatures créateurs |
| `DesignerSession` | `token` (unique), `expiresAt` | Sessions du dashboard créateur |

> ⚠️ **Aucun modèle pour le commerce** : pas de `Order`, `OrderItem`, `Customer`, `Address`, `Wishlist`, `Discount`. Toute la partie transactionnelle est déléguée à Shopify (choix acceptable en headless), mais cela interdit aujourd'hui le suivi de commande applicatif, les webhooks et les relances.

### 1.6 Variables d'environnement

| Variable | Présente dans `.env.local` | Utilisée par | Remarque |
| - | :-: | - | - |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | ✅ | `client.ts`, routes de seed, dashboard | OK |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | ✅ | `client.ts` | ⚠️ préfixe `PUBLIC` : exposée au bundle client, alors que tous les appels sont serveur |
| `SHOPIFY_ADMIN_TOKEN` | ❌ | routes de seed | ⚠️ le fichier déclare `SHOPIFY_ADMIN_ACCESS_TOKEN` (mismatch) |
| `SHOPIFY_WEBHOOK_SECRET` | ✅ (vide) | **rien** | ⚠️ aucun webhook implémenté |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | ✅ | `adminLoginAction` | ⚠️ utilisés pour écrire le cookie |
| `ADMIN_SECRET_TOKEN` | ❌ | `middleware.ts`, `assertAdmin()` | 🔴 **manquant** → garde admin incohérente |
| `NEXT_PUBLIC_SITE_URL` | ✅ | `cart.ts` (`return_to` du checkout) | OK |
| `DATABASE_URL` | ✅ (dans `.env`) | `db.ts`, `prisma.config.ts` | Contient le mot de passe Neon en clair — fichier non versionné (vérifié) |

---

## 2. Composants et fonctionnalités déjà développés

### 2.1 Pages (18 routes)

| Route | Type | Contenu | État |
| - | - | - | :-: |
| `/` | RSC | Hero + 4 produits phares Shopify + section créateurs + storytelling + newsletter | ✅ |
| `/collections` | RSC | Grille produits Shopify (`first: 50`), filtres par tags (`genre`, `pays`, `tissu`, `style`), tri (récent/populaire/prix) | 🟡 (pagination cassée, cf. §2.6) |
| `/products/[handle]` | RSC + SSG | `generateStaticParams` (50 premiers), galerie, sélecteur de variantes, add-to-cart, breadcrumb, bandeau réassurance | 🟡 (logique variantes à revoir) |
| `/lookbook` | RSC | Grille éditoriale asymétrique alimentée par 8 produits Shopify | ✅ |
| `/about` | RSC | Page marque | ✅ |
| `/order-confirmed` | RSC | Page de remerciement statique (aucune donnée de commande) | 🟡 (statique) |
| `/designers` | RSC | Annuaire des créateurs `APPROVED` depuis Prisma + comptage produits Shopify par créateur, filtre pays | ⚠️ ticket marketplace |
| `/designers/[handle]` | RSC + SSG | Fiche créateur (bio, histoire, citation, grille produits) | ⚠️ ticket marketplace |
| `/designers/apply` | RSC | Formulaire de candidature créateur (16 champs + upload avatar) | ⚠️ ticket marketplace |
| `/account` | RSC | Profil Shopify, statistiques commandes, historique (`orders(first: 10)`), adresse par défaut | ✅ |
| `/account/login` \| `/register` \| `/forgot-password` | RSC + Client | Tunnel d'authentification client Shopify | ✅ |
| `/dashboard` | RSC | Espace créateur : stats, liste produits, formulaire de création produit | ⚠️ ticket marketplace |
| `/dashboard/login` \| `/pending` | RSC | Connexion créateur, statut de candidature | ⚠️ ticket marketplace |
| `/admin/login` \| `/admin/designers` | RSC | Back-office : approbation / refus / suspension des candidatures, option `autoPublish` | ⚠️ ticket marketplace |

### 2.2 Routes API (5)

| Route | Méthode | Rôle | Sécurité |
| - | - | - | :-: |
| `/api/test-shopify` | GET | Ping Storefront (`shop { name primaryDomain }`) | 🔴 publique |
| `/api/upload/avatar` | POST | Upload avatar créateur → `public/uploads/avatars` (max 5 Mo, types contrôlés) | 🔴 publique + écriture disque (KO sur serverless) |
| `/api/seed/designers` | GET | Crée les 12 designers + SVG + comptes (`password123`) | 🔴 publique et destructrice |
| `/api/seed/shopify-products` | GET | Crée 30 produits Shopify via Admin GraphQL + association DB↔créateurs | 🔴 publique |
| `/api/seed/product-images` | GET | Génère des SVG et les uploade sur les produits Shopify (Admin REST) | 🔴 publique |

### 2.3 Composants (20)

| Composant | Type | Fonction |
| - | - | - |
| `layout/Navbar` | Client | Navigation sticky, badge panier live (`useCart().totalItems`), menu mobile, CTA « Devenir créateur » ; ⚠️ bouton recherche et lien `/wishlist` inertes |
| `layout/Footer` | RSC | 4 colonnes + badges paiement ; ⚠️ `FooterCol` affiche du texte non cliquable |
| `home/HeroSection` | RSC | Hero éditorial plein écran |
| `home/ProductsSection` | Client | Grille produits + pills de catégories redirigeant vers `/collections?...` |
| `home/DesignersSection` | RSC | 3 créateurs **codés en dur** (données mock, décorrélées de la DB) |
| `home/StorySection` | RSC | Section storytelling marque |
| `home/NewsletterSection` | Client | Formulaire email → `TODO: connecter à Klaviyo` (simulation `setTimeout`) |
| `product/ProductCard` | Client | Image + swap au hover, badges `nouveau`/`Promo`, wishlist locale non persistée, quick-add sur `variants[0]` |
| `product/ProductGrid` | RSC | Grille responsive 2/3/4 colonnes + état vide |
| `product/ProductImages` | Client | Galerie principale + miniatures verticales |
| `product/ProductForm` | Client | Sélecteur d'options (Taille/Couleur/Finition), add-to-cart, wishlist locale |
| `product/CollectionFilters` | Client | Filtres URL (`useSearchParams` → `router.push`), bouton reset |
| `cart/CartDrawer` | Client | Lignes Shopify, +/−, suppression, sous-total/total, bouton checkout ; ⚠️ pas de focus trap ni fermeture Échap (Radix Dialog non utilisé) |
| `auth/LoginForm` · `RegisterForm` · `ForgotPasswordForm` | Client | Formulaires branchés sur les Server Actions (`useTransition`) |
| `designer/ApplicationForm` | Client | Candidature + upload avatar (validation client des types/taille) |
| `designer/DesignerLoginForm` | Client | Login créateur (bcrypt + session Prisma) |
| `designer/ProductForm` | Client | Création produit (titre, description, prix, images CSV, tags) |
| `admin/AdminLoginForm` | Client | Login admin |

### 2.4 Logique métier (`src/lib`)

| Fichier | Contenu | Qualité |
| - | - | - |
| `shopify/client.ts` | `shopifyFetch<T>()` : POST GraphQL + token + `tags` + `cache` | ✅ propre, mais version d'API en dur et token `NEXT_PUBLIC` |
| `shopify/queries/products.ts` | `ProductFragment`, `GetProducts`, `GetProductByHandle`, `GetCollectionProducts`, `ProductCreate`, `ProductPublish` (2 dernières = **Admin API**) | 🟡 mélange Storefront/Admin |
| `shopify/queries/cart.ts` | 5 opérations panier complètes | ✅ |
| `shopify/queries/customer.ts` | 7 opérations client — `CUSTOMER_RESET_MUTATION` définie mais **jamais utilisée** | 🟡 |
| `shopify/products.ts` | `getProducts`, `getProductByHandle`, `getCollectionProducts`, `getDesignerProducts`, `getDesignerProductsByVendor`, `createProduct` | 🟡 `createProduct` inopérant (B2) |
| `shopify/cart.ts` | `createCart`, `addToCart`, `updateCartLine`, `removeCartLine`, `getCart` (+ `return_to` ajouté au `checkoutUrl`) — `getCart` **jamais appelé** | 🟡 pas de resynchronisation |
| `shopify/customer.ts` | 6 fonctions client Shopify (`createCustomer`, `loginCustomer`, `logoutCustomer`, `getCustomer`, `updateCustomer`, `recoverPassword`) | ✅ |
| `store/cart.store.ts` | Zustand + `persist` (clé `afrestyle-cart-v2`), `partialize` sur `shopifyCart` uniquement | ✅ |
| `hooks/useCart.ts` | `addItem`, `updateItem`, `removeItem`, `goToCheckout` + toasts stylés | ✅ |
| `actions/auth.actions.ts` | `registerAction`, `loginAction`, `logoutAction`, `getCurrentCustomer`, `forgotPasswordAction` | ✅ |
| `actions/admin.actions.ts` | `adminLoginAction`, `adminLogoutAction`, `approveDesigner`, `rejectDesigner`, `suspendDesigner` | ⚠️ B4 |
| `actions/designer.actions.ts` | `submitApplication`, `loginDesigner`, `logoutDesigner`, `getCurrentDesigner`, `createProductAction` | ⚠️ marketplace + B2 |
| `utils.ts` | `cn()`, `formatPrice()`, `extractTag()`, `capitalize()` | ✅ (`extractTag` jamais utilisée) |

### 2.5 Fonctionnalités transverses réellement opérationnelles

- **Catalogue Shopify live** : la home, `/collections`, `/lookbook`, `/products/[handle]` et les fiches créateurs consomment la Storefront API (pas de données mock pour les produits).
- **Filtrage par tags** : convention `genre-*`, `pays-*`, `tissu-*`, `style-*` extraite du champ `tags` Shopify et remontée dans le type normalisé `Product` (`country`, `fabric`, `style`).
- **Panier Shopify complet** : création à la première ligne, ajout, mise à jour de quantité, suppression, sous-total/total/taxes, redirection vers le checkout Shopify avec `return_to` vers `/order-confirmed`.
- **Comptes clients Shopify** : inscription, connexion, mot de passe oublié, profil, historique de commandes, adresse par défaut — le tout via cookies `httpOnly`.
- **Authentification créateur** : bcrypt (12 rounds), sessions persistées en base avec expiration et nettoyage, middleware de protection.
- **Back-office admin** : liste des candidatures, approbation avec option `autoPublish`, refus avec motif, suspension.
- **Upload d'images** : validation MIME + taille (5 Mo) côté client *et* serveur.
- **SEO partiel** : `generateMetadata` sur la fiche produit (titre, description, OpenGraph image) et `metadata` statique sur `/designers`, `/lookbook`, `/about`, `/account`.

### 2.6 Bugs fonctionnels identifiés (indépendants des blocages de sécurité)

| # | Fichier | Bug | Conséquence |
| - | - | - | - |
| F1 | `components/product/ProductForm.tsx` | La sélection d'option résout la variante avec `variants.find(v => v.selectedOptions.some(option === valeur))` : elle ignore les **autres** options déjà choisies | Sélectionner « Taille M » puis « Tissu Wax » peut sélectionner une variante incohérente (ex. M + Kente) → mauvais SKU envoyé au panier |
| F2 | `components/product/ProductForm.tsx` | `values` est calculé uniquement sur les variantes `availableForSale`, puis une option est désactivée si *une* variante portant cette valeur est indisponible | Une taille épuisée peut rester sélectionnable, et la disponibilité n'est jamais évaluée sur la **combinaison** choisie |
| F3 | `app/collections/page.tsx` | Le bouton « Voir plus » reconstruit la même URL sans propager `pageInfo.endCursor` (`after`) | Pagination inopérante : le bouton recharge la même page de 50 produits |
| F4 | `components/product/ProductCard.tsx` | Quick-add sur `product.variants[0]` sans vérifier la disponibilité ni les options | Ajout au panier d'une variante épuisée / par défaut (mauvaise taille) |
| F5 | `components/layout/Navbar.tsx` | Le bouton « Rechercher » n'a aucun `onClick` et il n'existe pas de route `/search` | Fonction de recherche absente alors que l'UI la propose |
| F6 | `components/layout/Navbar.tsx` | Lien `/wishlist` sans page correspondante | 404 depuis la navbar et depuis les cœurs de `ProductCard`/`ProductForm` (état purement local, perdu au reload) |
| F7 | `app/order-confirmed/page.tsx` | Page statique : aucune commande n'est récupérée/affichee, aucun email, aucun webhook | Le client revient d'un checkout sans aucun récapitulatif ni numéro de commande |
| F8 | `hooks/useCart.ts` + `shopify/cart.ts` | `getCart()` n'est jamais appelé et il n'existe aucun gestionnaire d'erreur « cart not found » | Panier mort silencieux : un panier expiré/supprimé provoque une erreur au prochain `cartLinesAdd` |
| F9 | `components/designer/ProductForm.tsx` | Label « Prix (XOF) » alors que la couche Shopify formate les prix en **EUR** (`Intl.NumberFormat("fr-FR", { currency: price.currencyCode })`, défaut `"EUR"` dans `formatPrice`) | Incohérence de devise dans l'UI créateur |
| F10 | `app/dashboard/page.tsx` | `AddProductLink` est défini mais **jamais rendu** (composant mort) ; stats « Commandes/Revenu/Vues » figées à `–` | Dashboard partiellement factice |
| F11 | `components/home/DesignersSection.tsx` | 3 créateurs codés en dur avec des compteurs de pièces inventés (24, 18, 31) | Contenu décorrélé de la DB et du stock réel |
| F12 | `scripts/associate-products.mjs` | Appelle `POST http://localhost:3000/api/seed/link-products` — **cette route n'existe pas** | Script cassé (404) |

### 2.7 Fonctionnalités factices / à terminer (mocks en place)

- Newsletter : `TODO: connecter à Klaviyo`, succès simulé par `setTimeout(1000)` — aucune donnée n'est enregistrée.
- Wishlist : état `useState` local dans `ProductCard` et `ProductForm` — rien n'est persisté (ni localStorage, ni Shopify `customer.tags`/métachamp).
- Recherche : icône présente, backend absent.
- Avis produits, guide des tailles, suivi de commande, retours : **non implémentés** (le bandeau d'une fiche produit promet pourtant « retours gratuits sous 30 jours »).
- Paiement : entièrement délégué à Shopify (aucune intégration Stripe — `Designer.stripeAccountId` est un champ mort).

---

## 3. Dépendances obsolètes et résidus multivendeur / Sopexa

### 3.1 Point de méthode sur « Sopexa » et le « multivendeur »

**Recherche exhaustive effectuée** : `git grep` sur tout l'historique (`git log --all -S'Sopexa'`), recherche insensible à la casse dans l'arborescence (`src/`, `scripts/`, `prisma/`, `public/`, `.kilo/`), `package.json`, `pnpm-lock.yaml`.

**Résultat : 0 occurrence de « Sopexa »** — ni dans le code source, ni dans `package.json` / `pnpm-lock.yaml`, ni dans l'historique git (`git log --all -S'Sopexa'` renvoie un résultat vide), ni dans la copie de travail `.kilo/worktrees/`. De même, **aucune occurrence littérale de « multivendor » / « multivendeur »**. Conclusion : si une intégration Sopexa a existé, elle **n'est pas dans ce dépôt ni dans son historique** ; il n'y a donc aucun paquet npm « Sopexa » à désinstaller.

En revanche, **l'architecture multivendeur est bien présente dans le code**, sous une autre forme : les « designers » sont des vendeurs simulés (`Designer` + `shopifyVendorName` + `DesignerProduct` + `stripeAccountId` + `autoPublish`), avec :
- un espace créateur authentifié (`/dashboard`, bcrypt + sessions Prisma) ;
- un tunnel de candidature (`/designers/apply`) ;
- un back-office de validation (`/admin/designers`) ;
- une création de produit Shopify côté créateur (`createProductAction`).

→ C'est **ce bloc** qu'il faut supprimer ou geler, et c'est lui qui tire la majorité des dépendances et tables aujourd'hui inutiles pour une boutique mono-marque headless.

### 3.2 Dépendances à supprimer (aucune utilisation détectée)

```bash
pnpm remove @shopify/hydrogen-react @radix-ui/react-dialog @radix-ui/react-select \
            graphql graphql-tag next-themes autoprefixer @types/bcryptjs
```

| Paquet | Poids typique | Pourquoi le supprimer | Alternative si le besoin revient |
| - | - | - | - |
| `@shopify/hydrogen-react@^2026.4.2` | Très lourd (embarque `three`, `vite` en peer) | Installé « au cas où » : **0 import**. Le panier et les images sont gérés à la main | Si migration vers l'écosystème Hydrogen : `<ShopifyCartProvider>`, `<Money>`, `<ShopifyImage>` |
| `@radix-ui/react-dialog@^1.1.15` | ~15 ko | `CartDrawer` est un `div` maison sans `aria-modal`, focus trap ni fermeture Échap | **À garder/reconsidérer** : c'est en réalité la meilleure solution pour corriger l'accessibilité du drawer (voir §5.8) |
| `@radix-ui/react-select@^2.2.6` | ~25 ko | Les filtres utilisent un `<select>` natif | Supprimer (le natif est plus accessible ici) |
| `graphql@^16.14.0` | ~180 ko | Aucun import : les requêtes sont des *template strings* non validées | À conserver **si** vous adoptez `@shopify/api-codegen-preset` (recommandé, voir §5.1) |
| `graphql-tag@^2.12.6` | Faible | Aucun import (redondant avec `graphql`) | Supprimer |
| `next-themes@^0.4.6` | Faible | Aucun import, thème sombre codé en dur dans `layout.tsx` et `globals.css` | À conserver uniquement si un mode clair est prévu (roadmap « haut de gamme » : le prévoir) |
| `autoprefixer@^10.5.0` | ~200 ko (dev) | Non déclaré dans `postcss.config.mjs` ; Tailwind v4 gère `-webkit-`/`-moz-` nativement | Supprimer |
| `@types/bcryptjs@^3.0.0` | Faible (dev) | **Stub déprécié** (voir avertissement pnpm) : `bcryptjs` embarque ses propres types | Supprimer |

> ⚠️ **Ne pas supprimer** `bcryptjs` tant que l'authentification créateur existe ; il devient inutile si vous supprimez tout le bloc multivendeur (§3.4).

### 3.3 Dépendances à conserver impérativement (souvent confondues avec du legacy)

| Paquet | Raison |
| - | - |
| `zustand` + `persist` | Le store panier est le pivot de l'UX panier — à garder |
| `react-hot-toast` | Utilisé par `useCart` et monté dans `layout.tsx` |
| `@prisma/client`, `prisma`, `@prisma/adapter-pg`, `pg` | Utilisés par `db.ts` — mais **uniquement** par le bloc designers aujourd'hui. Si le bloc multivendeur disparaît, Prisma **et** la base Neon deviennent entièrement supprimables (→ application 100 % headless sans base) |
| `clsx` + `tailwind-merge` | Helper `cn()` utilisé dans la navbar, les cartes produit |
| `lucide-react` | Icônes partout |
| `dotenv` | Requis par `prisma.config.ts` |

### 3.4 Code multivendeur à supprimer ou à geler — inventaire fichier par fichier

Deux stratégies possibles. **Option A (recommandée pour une boutique mono-marque haut de gamme)** : suppression complète. **Option B** : conservation de l'annuaire créateurs comme **contenu éditorial** (sans comptes ni création de produit), ce qui reste cohérent avec le positionnement « curation ».

#### Option A — Suppression complète du bloc marketplace

| Élément | Chemin | Action |
| - | - | - |
| Espace créateur | `src/app/dashboard/**` (3 pages) | 🗑️ Supprimer |
| Authentification créateur | `src/components/designer/DesignerLoginForm.tsx`, `src/components/designer/ProductForm.tsx` | 🗑️ Supprimer |
| Candidature | `src/app/designers/apply/page.tsx`, `src/components/designer/ApplicationForm.tsx` | 🗑️ Supprimer (ou remplacer par un simple formulaire de contact) |
| Server Actions | `src/lib/actions/designer.actions.ts` | 🗑️ Supprimer |
| Back-office | `src/app/admin/**`, `src/components/admin/AdminLoginForm.tsx`, `src/lib/actions/admin.actions.ts` | 🗑️ Supprimer (remplacé par l'admin Shopify) |
| Middleware | `src/middleware.ts` — blocs `/admin/*` et `/dashboard/*` | ✂️ Retirer (le fichier devient inutile) |
| Upload | `src/app/api/upload/avatar/**` | 🗑️ Supprimer |
| Seed | `src/lib/seed/designers.ts`, `src/app/api/seed/**` | 🗑️ Supprimer |
| Modèles Prisma | `Designer`, `DesignerProduct`, `DesignerApplication`, `DesignerSession` | 🗑️ Supprimer + migration |
| Dépendances | `bcryptjs`, `@types/bcryptjs`, `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `pg`, `dotenv` | 🗑️ Supprimer (`prisma.config.ts`, `prisma/`, `.env`/`DATABASE_URL`, `postinstall: prisma generate`) |
| Assets | `public/uploads/avatars/*.svg` (12 fichiers) | 🗑️ Supprimer |
| Champ mort | `Designer.stripeAccountId` (aucune intégration Stripe) | 🗑️ Supprimer |
| Lien navbar | `src/components/layout/Navbar.tsx` → `{ href: "/designers/apply", label: "Devenir créateur" }` | ✂️ Retirer ou repointer |

#### Option B — Conservation en contenu éditorial (sans comptes)

| Élément | Action |
| - | - |
| `Designer` | Conserver, mais **supprimer** `passwordHash`, `autoPublish`, `stripeAccountId`, `status`/`rejectionReason` (ou remplacer par un booléen `featured`) |
| `DesignerApplication`, `DesignerSession`, `DesignerProduct` | 🗑️ Supprimer (le mapping produit↔créateur est déjà assuré par le champ Shopify `vendor`) |
| `/dashboard/**`, `/admin/**`, `designer.actions.ts` | 🗑️ Supprimer |
| `/designers`, `/designers/[handle]` | ✅ Conserver comme pages éditoriales « Nos maisons partenaires » |
| `getDesignerProducts()` | ✅ Simplifier : interroger le Storefront par `vendor` (`getDesignerProductsByVendor`), supprimer la branche `nodes(ids)` et la table de jointure |

> 💡 **Recommandation** : Option A si AfroStyle est une **boutique** mono-sélection (le code de gestion devient l'admin Shopify, gratuit et complet). Option B si la dimension « découvrabilité des créateurs » est un pilier marketing — dans ce cas, gardez uniquement la partie `site vitrine` (pages `designers`), jamais l'authentification.

### 3.5 Scripts d'exploitation à supprimer (10 fichiers, gitignorés)

| Fichier | Rôle | Risque / État |
| - | - | - |
| `scripts/seed-shopify-products.mjs` | Crée 30 produits | Token Admin en clair |
| `scripts/publish-all.mjs` | Publie tous les produits (`published_scope: global`) | Token Admin en clair |
| `scripts/publish-products.mjs` | Publie des produits en masse | Token Admin en clair |
| `scripts/publish-to-store.mjs` | Publie sur le canal Online Store | Token Admin en clair |
| `scripts/upload-images.mjs` | Upload d'images SVG | Token Admin en clair |
| `scripts/generate-product-images.mjs` | Génération d'images | Token Admin en clair |
| `scripts/associate-products.mjs` | Association produits↔créateurs | Token Admin + **route inexistante** |
| `scripts/test-product.mjs`, `scripts/test-all-products.mjs`, `scripts/test-query.mjs` | Tests ad hoc | Token Admin en clair |

**Décision** : ces scripts étaient des outils one-shot de mise en place du catalogue. Ils doivent **disparaître du poste de travail** : ils ne sont pas versionnés (`scripts/` est dans `.gitignore`), ils contiennent un secret d'administration en clair et utilisent une version d'API retirée. Leur équivalent moderne = **admin Shopify** (import CSV/Matrixify) ou un script Node unique lisant `process.env.SHOPIFY_ADMIN_TOKEN`.

### 3.6 Secrets à révoquer / régénérer (action immédiate)

| Secret | Emplacement | Action |
| - | - | - |
| `shpat_b9010…db1` (Admin API token) | 10 fichiers `scripts/*.mjs` | 🔴 **Révoquer dans Shopify Admin → Applications → Tokens**, en générer un nouveau, ne jamais l'écrire en dur |
| `NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN` | `.env.local`, exposé au bundle client | 🟡 Renommer en `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (sans `NEXT_PUBLIC_`) : tous les appels sont côté serveur |
| `DATABASE_URL` (Neon, mot de passe en clair) | `.env` | 🟢 Non versionné (vérifié via `git ls-files`) — mais à faire tourner si le dossier a été partagé |
| `ADMIN_PASSWORD` réutilisé comme token de session | `admin.actions.ts` | 🔴 Remplacer par un `ADMIN_SECRET_TOKEN` aléatoire (32+ caractères), distinct du mot de passe |

---

## 4. État actuel de la connexion à la Storefront API Shopify

### 4.1 Configuration en place

| Élément | Valeur constatée | État |
| - | - | :-: |
| Boutique | `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` (valeur non affichée ici) — correspond à `afrestyle-dev.myshopify.com` d'après les scripts et `.env.local` | ✅ |
| Endpoint | `https://{domaine}/api/2024-01/graphql.json` (`src/lib/shopify/client.ts`, ligne 4) | 🔴 version retirée |
| Authentification | Header `X-Shopify-Storefront-Access-Token` | ✅ (mais variable `NEXT_PUBLIC_`) |
| Cache | `force-cache` par défaut + `tags: ["products"]`, `no-store` pour panier/client | 🟡 tags jamais invalidés |
| Normalisation | `normalizeProduct()` (edges → tableaux, parsing des tags `pays-*`, `tissu-*`, `style-*`, formatage `Intl.NumberFormat("fr-FR")`) | ✅ |
| Client Admin | **Inexistant** — les mutations Admin sont appelées via le client Storefront | 🔴 |
| Webhooks | Aucun (`SHOPIFY_WEBHOOK_SECRET` déclaré mais vide et jamais lu) | 🔴 |

### 4.2 Matrice des opérations réellement branchées

| Opération | Requête / mutation GraphQL | Endpoint utilisé | Fonctionne ? |
| - | - | - | :-: |
| Lister les produits | `products(first, after, sortKey, reverse, query)` | Storefront | ✅ |
| Produit par handle | `product(handle:)` | Storefront | ✅ |
| Produits par collection | `collection(handle:)` | Storefront | ⚠️ requête définie mais **jamais appelée** |
| Produits d'un créateur | `nodes(ids: [ID!]!)` puis fallback `vendor:"…"` | Storefront | 🟡 dépend de la table `DesignerProduct` (vide en pratique) |
| Créer le panier | `cartCreate` | Storefront | ✅ |
| Ajouter des lignes | `cartLinesAdd` | Storefront | ✅ |
| Mettre à jour les lignes | `cartLinesUpdate` | Storefront | ✅ |
| Supprimer des lignes | `cartLinesRemove` | Storefront | ✅ |
| Relire le panier | `cart(id:)` | Storefront | 🟡 fonction écrite mais **jamais appelée** |
| Créer un compte | `customerCreate` | Storefront | ✅ |
| Se connecter | `customerAccessTokenCreate` | Storefront | ⚠️ legacy (voir §4.4) |
| Se déconnecter | `customerAccessTokenDelete` | Storefront | ✅ |
| Lire le profil + commandes | `customer(customerAccessToken:)` | Storefront | ✅ |
| Mettre à jour le profil | `customerUpdate` | Storefront | ✅ (non branché à l'UI) |
| Mot de passe oublié | `customerRecover` | Storefront | ✅ |
| Réinitialiser le mot de passe | `customerReset` | Storefront | ❌ requête jamais utilisée → pas de page `reset` |
| Créer un produit | `productCreate` | **Storefront** | ❌ **impossible** (mutation Admin) |
| Publier un produit | `productPublish` | **Storefront** | ❌ **impossible** + argument `channel` invalide |
| Démo boutique | `shop { name primaryDomain }` | Storefront | ✅ (`/api/test-shopify`) |

**Bilan** : la partie **Storefront (lecture + panier + client)** est fonctionnelle et cohérente. La partie **écriture catalogue** ne peut pas fonctionner telle quelle : `productCreate`/`productPublish` n'existent pas dans le schéma Storefront. C'est la conséquence directe du fait que le projet a été conçu pour des créateurs qui « publient » leurs produits, sans jamais mettre en place un vrai client Admin.

### 4.3 Le point critique de la version d'API `2024-01`

Les **4 occurrences** de la version d'API (toutes en dur) :

| Fichier | Ligne | Usage |
| - | - | - |
| `src/lib/shopify/client.ts` | 4 | URL Storefront GraphQL |
| `src/lib/shopify/products.ts` | 296 | URL du canal `productPublish` |
| `src/app/api/seed/shopify-products/route.ts` | 8 | Admin GraphQL |
| `src/app/api/seed/product-images/route.ts` | 8 | Admin REST |

Ce que dit la documentation officielle Shopify ([shopify.dev/docs/api/usage/versioning](https://shopify.dev/docs/api/usage/versioning)) :

> « If your app targets an inaccessible version, Shopify **falls forward** and responds using the **oldest accessible stable version**. »
> « API responses include the `X-Shopify-API-Version` header reflecting the version used to fulfill the request. **If it differs from what you requested, your app is targeting an inaccessible version and Shopify has fallen forward to the default.** »

Conséquences concrètes :
1. Le code **fonctionne « par chance »** : Shopify sert la plus ancienne version stable accessible, ce qui peut changer n'importe quand sans que votre code change.
2. Un champ peut disparaître ou changer de type → erreur runtime en production, sans rapport avec vos commits.
3. Aucun avertissement de dépréciation exploitable : il faut lire l'en-tête de réponse.

**Diagnostic recommandé** (à exécuter une fois, hors CI) :

```powershell
curl.exe -s -D - -o NUL -X POST "https://afrestyle-dev.myshopify.com/api/2024-01/graphql.json" `
  -H "Content-Type: application/json" `
  -H "X-Shopify-Storefront-Access-Token: <token>" `
  -d '{\"query\":\"{ shop { name } }\"}' | Select-String -Pattern "X-Shopify-API-Version"
```

Si l'en-tête retourné **diffère** de `2024-01`, c'est la preuve du *fall forward*.

**Correctif** : centraliser la version dans `src/lib/shopify/version.ts` :

```ts
// src/lib/shopify/version.ts
export const SHOPIFY_API_VERSION =
  process.env.SHOPIFY_API_VERSION ?? "2026-07"; // ⚠️ à aligner sur la dernière stable du changelog Shopify
export const STOREFRONT_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;
export const ADMIN_URL = `https://${process.env.SHOPIFY_STORE_DOMAIN}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`;
```

### 4.4 Limites structurelles de la couche Shopify actuelle

| # | Limite | Fichier concerné | Impact |
| - | - | - | - |
| S1 | **Aucun client Admin** : une seule fonction `shopifyFetch` pointe vers le Storefront, et les mutations Admin y sont routées | `lib/shopify/client.ts` | 🔴 `createProduct` impossible |
| S2 | **Métachamps jamais lus** : le type `ShopifyProduct.metafields` et `ShopifyMetafield` existent, mais **aucune requête ne les demande** ; pays/tissu/style sont déduits de `tags` | `types.ts`, `queries/products.ts` | 🟡 pas de matière/composition/entretien/origine artisanal — pourtant essentiel au premium |
| S3 | **Variantes appauvries** : `variants { id title availableForSale price compareAtPrice selectedOptions }` — ni `image`, ni `quantityAvailable`, ni `sku` | `queries/products.ts` | 🟡 pas de photo par variante, pas d'« il reste 2 pièces », pas de SKU affiché |
| S4 | **Aucune localisation** : pas de directive `@inContext(country:, language:)` | `queries/*` | 🟡 impossible de gérer plusieurs devises/marchés (EUR ↔ XOF/USD) |
| S5 | **Pagination non exploitée** : `pageInfo.endCursor` récupéré et jamais utilisé | `collections/page.tsx` | 🟠 catalogue bloqué à 50 produits (F3) |
| S6 | **Aucune gestion de `THROTTLED` / 429** : `shopifyFetch` lève une erreur brute sans retry ni backoff ; le code GraphQL `extensions.code` n'est pas inspecté | `lib/shopify/client.ts` | 🟠 build/preview fragiles, pages en erreur au moindre pic |
| S7 | **Aucun `Suspense`/`error.tsx`** : `getProducts()` est appelé sans `try/catch` dans la home | `app/page.tsx` | 🟠 une panne Shopify = page blanche 500 |
| S8 | **`cartCreate` n'envoie pas `buyerIdentity`** (le commentaire du fichier annonce l'inverse) | `queries/cart.ts` | 🟡 pas d'e-mail prérempli, pas de devise/marché forcé |
| S9 | **Panier sans aucune extension** : pas de `cartDiscountCodesUpdate`, `cartNoteUpdate`, `cartAttributesUpdate`, `cartMetafieldsSet` | `queries/cart.ts` | 🟠 pas de code promo, pas de mot doux/carte cadeau, pas de gravure (personnalisation) |
| S10 | **Comptes clients legacy** : `customerAccessTokenCreate` / `customerRecover` relèvent des *customer accounts* historiques ; les boutiques en **nouveaux comptes clients** utilisent la **Customer Account API** (OAuth) | `queries/customer.ts` | 🔴 à vérifier côté Shopify Admin : si les nouveaux comptes sont activés, tout le tunnel `/account` casse |
| S11 | **`customerReset` défini mais non utilisé** : aucune page `/account/reset` | `queries/customer.ts` | 🟡 l'utilisateur reçoit un e-mail sans destination finale |
| S12 | **Token public en préfixe `NEXT_PUBLIC_`** alors que les appels sont serveur | `.env.local`, `client.ts` | 🟡 fuite inutile dans le bundle client ; le **private access token** (canal Headless) donnerait accès à des champs supplémentaires côté serveur |
| S13 | **Aucune invalidation de cache** : `revalidateTag` / webhooks absents | `client.ts` + app | 🟠 catalogue figé jusqu'au redéploiement (B8) |

### 4.5 Note de maturité de l'intégration Storefront

| Sous-ensemble | Maturité | Détail |
| - | :-: | - |
| Lecture catalogue | 75 % | Requêtes valides, normalisation soignée ; manquent métachamps, variantes enrichies, pagination |
| Panier | 70 % | CRUD complet et fiable ; manquent persistance serveur, promos, attributs, resync |
| Comptes clients | 55 % | Tunnel complet mais API legacy, reset non branché |
| Écriture catalogue (Admin) | **0 %** | Aucun client Admin : `createProduct` ne peut pas fonctionner |
| Webhooks / temps réel | **0 %** | Aucun webhook, aucune invalidation |
| Robustesse (retry, erreurs, observabilité) | 20 % | Aucun retry, aucun log structuré, aucun monitoring |

**Verdict** : la couche **vitrine + panier + checkout** est prête à ~70–75 % ; la couche **back-office produit** doit être repensée (Shopify Admin comme source de vérité, éventuellement un client Admin dédié pour les automatisations internes).

---

## 5. Checklist pour transformer AfroStyle en boutique e-commerce headless haut de gamme

> Légende : `[ ]` à faire · `[~]` partiellement fait. Priorités : **P0** = bloquant production, **P1** = indispensable à une boutique crédible, **P2** = différenciation premium.

### 5.0 Prérequis — dette bloquante (P0, ~1 jour)

- [ ] **Réparer l'environnement local** : supprimer `node_modules` (jonctions cassées vers `D:\afrestyle`) et relancer `pnpm install` — *sans cela, aucun build n'est possible*.
- [ ] **Révoquer le token Admin** exposé dans `scripts/*.mjs`, puis supprimer le dossier `scripts/`.
- [ ] **Créer `ADMIN_SECRET_TOKEN`** (32+ caractères aléatoires) dans `.env.local` et sur Vercel, et aligner `admin.actions.ts` + `middleware.ts` sur cette unique variable.
- [ ] **Supprimer ou protéger** `/api/seed/**` et `/api/test-shopify` (authentification + `noindex`, ou suppression pure).
- [ ] **Séparer les clients Shopify** : `shopifyStorefrontFetch` (token public/privé) et `shopifyAdminFetch` (`SHOPIFY_ADMIN_TOKEN`) dans `lib/shopify/`.
- [ ] **Épingler la version d'API** dans une constante unique + vérifier l'en-tête `X-Shopify-API-Version` en réponse.
- [ ] **Renommer** `SHOPIFY_ADMIN_ACCESS_TOKEN` → `SHOPIFY_ADMIN_TOKEN` (et supprimer `SHOPIFY_WEBHOOK_SECRET` s'il reste inutilisé).
- [ ] **Supprimer `next.config.ts`** (mort) et l'option `experimental.serverActions.allowedOrigins` (inutile sur Vercel).
- [ ] **Nettoyer** `.kilo/worktrees/healthy-brush/` (copie complète du projet) et les `public/*.svg` par défaut.
- [ ] **Nettoyer `pnpm-workspace.yaml`** (contradiction `allowBuilds` / `ignoredBuiltDependencies`).
- [ ] **Rendre `tsc --noEmit` vert** avec `strict: true` (a minima `noImplicitAny: true`) et ajouter le script `"typecheck": "tsc --noEmit"`.

### 5.1 Catalogue (P1)

- [ ] **Pagination par curseur réelle** : propager `pageInfo.endCursor` (`?after=…`) ou basculer en *infinite scroll* / bouton « Charger plus » avec Server Action.
- [ ] **ISR** : `export const revalidate = 300` sur `/collections`, `/products/[handle]`, `/lookbook`, `/`.
- [ ] **Invalidation à la demande** : créer `POST /api/revalidate` protégé par la signature HMAC (`SHOPIFY_WEBHOOK_SECRET`) appelant `revalidateTag("products")`.
- [ ] **Webhooks Shopify à souscrire** : `products/create`, `products/update`, `products/delete`, `inventory_levels/update`, `collections/update`.
- [ ] **Collections Shopify natives** : utiliser `collection(handle:)` (requête déjà écrite mais jamais appelée) pour les univers `Femme` / `Homme` / `Accessoires` / `Nouveautés`, plutôt que tout filtrer par tags.
- [ ] **Metafields premium** : `materials`, `care_instructions`, `origin_story`, `artisan`, `fit`, `measurements` — à déclarer dans Shopify Admin puis interroger (S2).
- [ ] **Tris complets** : `TITLE`, `PRICE`, `BEST_SELLING`, `CREATED_AT` + filtre par tranche de prix (`variants.price:`).
- [ ] **Merchandising fiable** : dériver le badge « Nouveau » de `createdAt` (< 30 jours) plutôt que d'un tag manuel.
- [ ] **États intermédiaires** : `loading.tsx` sur les grilles, `not-found.tsx` dédié, `error.tsx` avec retry.
- [ ] **`Suspense` par section** : la home ne doit pas dépendre du succès de l'appel Shopify (S7).

### 5.2 Fiche produit — variantes tissus × tailles (P1, cœur du sujet)

**Constat** : le sélecteur de `ProductForm.tsx` construit les valeurs d'options depuis `variants[].selectedOptions` et résout la variante avec `some()` — il ne gère donc **pas les combinaisons** (bugs F1/F2). Les options (`Taille`, `Couleur`) sont inférées du nom des options Shopify, sans mapping métier, et l'option « Tissu » n'existe nulle part dans le code.

**Modèle cible (3 options maximum — limite Shopify)** :

| Option Shopify | Rôle métier | Valeurs types |
| - | - | - |
| `Option1 = Taille` | Coupe | `XS, S, M, L, XL, XXL`, `Sur-mesure` |
| `Option2 = Tissu` | Matière/motif — pilier AfroStyle | `Wax`, `Kente`, `Bogolan`, `Bazin`, `Kanga`, `Coton bio`, `Soie` |
| `Option3 = Finition` | Personnalisation à valeur ajoutée | `Standard`, `Broderie main +40 €`, `Sur-mesure` |

> Shopify autorise **3 options** par produit et 100 variantes par défaut (2 000 sur les plans supérieurs) : `7 tailles × 7 tissus × 3 finitions = 147` combinaisons → rester sous 100 en n'appliquant `Finition` qu'aux produits concernés, ou en traitant la finition comme **attribut de ligne de panier** (`cartAttributesUpdate`) plutôt que comme option de variante.

- [ ] **Refonte du sélecteur en machine à états** : `selectedOptions: Record<string, string>` puis
  `const variant = product.variants.find(v => Object.entries(selected).every(([name, value]) => v.selectedOptions.some(o => o.name === name && o.value === value)));`
- [ ] **Disponibilité par combinaison** : désactiver une valeur uniquement si **aucune** variante ne satisfait la combinaison courante (au lieu du test actuel sur une seule option).
- [ ] **Stock visible** : requêter `quantityAvailable` → « Plus que 2 en stock », « Réapprovisionnement sous 3 semaines ».
- [ ] **Images par variante** : ajouter `image { url altText }` au fragment `variants` et faire basculer la galerie au changement de tissu — **attendu n°1** pour un site de tissus.
- [ ] **Swatches visuels de tissu** : pastille image/motif (métachamp `custom.swatch`) au lieu de boutons texte.
- [ ] **Prix dynamique** : afficher le prix de la **variante sélectionnée**, en conservant « à partir de X € » avant sélection complète.
- [ ] **Prix barré formaté** : aujourd'hui `compareAtPrice` est injecté brut (`"185.00"`) alors que `priceFormatted` est formaté → passer par `formatPrice()`.
- [ ] **Sélecteur de quantité** sur la fiche produit (absent aujourd'hui).
- [ ] **Quick-add intelligent** : si `variants.length > 1`, ouvrir la fiche ou un mini-sélecteur au lieu d'ajouter `variants[0]` (bug F4).
- [ ] **Guide des tailles** : modale avec tableaux de mesures par catégorie.
- [ ] **Bloc artisanal** : origine, artisan, temps de confection, entretien du tissu (métachamps).
- [ ] **Avis clients** : Judge.me / Okendo / Shopify Product Reviews (widget headless).
- [ ] **`useOptimistic` + toast** sur l'ajout au panier pour masquer la latence réseau.

### 5.3 Panier (P1)

- [~] **CRUD panier Shopify** : déjà opérationnel (`cartCreate` / `cartLinesAdd` / `cartLinesUpdate` / `cartLinesRemove`).
- [ ] **Page panier dédiée `/cart`** (indispensable pour le SEO et le tunnel mobile) en plus du drawer.
- [ ] **Résynchronisation au montage** : appeler `getCart(cartId)` (fonction déjà écrite mais jamais utilisée) et recréer un panier si la réponse est `null` (bug F8).
- [ ] **Persistance serveur par client** : stocker l'`cartId` dans un métachamp client (`custom.cart_id`) pour retrouver son panier sur un autre appareil.
- [ ] **Codes promo** : `cartDiscountCodesUpdate` + champ de saisie dans le drawer.
- [ ] **Carte cadeau / message** : `cartNoteUpdate` et `cartAttributesUpdate`.
- [ ] **Gravure / personnalisation** : attributs de ligne (`attributes: [{ key, value }]` dans `CartLineInput`).
- [ ] **Identité acheteur** : `cartBuyerIdentityUpdate` (e-mail, pays) pour éviter la ressaisie au checkout.
- [ ] **Estimation de livraison** : options de transport (`cartDeliveryGroups`) + compteur « plus que 35 € pour la livraison offerte » (la navbar promet déjà la gratuité dès 150 €).
- [ ] **Upsell / cross-sell** dans le drawer (« Vous aimerez aussi », même collection).
- [ ] **Drawer accessible** : `role="dialog"`, `aria-modal`, focus trap, fermeture Échap, scroll lock — via `@radix-ui/react-dialog` (déjà installé) ou `<dialog>` natif.
- [ ] **Détail de variante dans la ligne** : afficher « Tissu : Wax · Taille : M » (aujourd'hui seul `merchandise.title` est utilisé).
- [ ] **Actions groupées** : « vider le panier » avec confirmation.

### 5.4 Checkout et post-achat (P1)

- [~] **Redirection vers le checkout Shopify** avec `return_to` vers `/order-confirmed` — **approche recommandée** (PCI-DSS délégué, moyens de paiement locaux gérés par Shopify).
- [ ] **Page de confirmation réelle** : récupérer la commande (id/token) et afficher numéro, lignes, adresse, suivi (aujourd'hui statique — bug F7).
- [ ] **Webhooks de commande** : `orders/create`, `orders/paid`, `orders/fulfilled`, `fulfillments/create` ; vérifier la signature HMAC avec `SHOPIFY_WEBHOOK_SECRET`.
- [ ] **E-mails transactionnels** aux couleurs AfroStyle (notifications Shopify).
- [ ] **Suivi de commande** : page `/account/orders/[id]` (statut, transporteur, numéro de suivi).
- [ ] **Retours / échanges** : formulaire headless (Shopify `orderReturn` ou app tierce) — la promesse « retours gratuits sous 30 jours » doit être tenable.
- [ ] **Shopify Markets** si vente hors zone euro : devises, taxes, transporteurs, seuils par marché (`@inContext`).
- [ ] **Recette de paiement** : parcours complet en mode test Shopify avant bascule production.
- [ ] **Analytics de conversion** : `view_item`, `add_to_cart`, `begin_checkout`, `purchase` (GA4 / Shopify Customer Events) + bandeau de consentement cookies.

### 5.5 Compte client et fidélisation (P2)

- [~] **Tunnel compte client** : inscription / connexion / mot de passe oublié opérationnels.
- [ ] **Trancher entre comptes clients historiques et Customer Account API** (S10) : si les nouveaux comptes sont activés dans Shopify Admin, migrer vers l'API Customer Account (OAuth) — sinon tout `/account` casse.
- [ ] **Page `/account/reset`** branchée sur `customerReset` (mutation déjà écrite, jamais utilisée).
- [ ] **Édition du profil et des adresses** dans l'UI (`updateCustomer` existe déjà mais n'est branché à aucun formulaire).
- [ ] **Carnet d'adresses multiple** (aujourd'hui seul `defaultAddress` est lu).
- [ ] **Wishlist persistée** : métachamp client Shopify (`custom.wishlist`) ou table applicative — et créer la page `/wishlist` manquante (bug F6).
- [ ] **Programme de fidélité / VIP** (Smile.io, LoyaltyLion) et compte « Cercle AfroStyle ».
- [ ] **Préférences de communication** (consentement marketing, préférences de taille).

### 5.6 Recherche, navigation et merchandising (P1)

- [ ] **Page `/search`** exploitant `search(query:, types: [PRODUCT], first:)` — l'icône de la navbar est inerte (bug F5).
- [ ] **Autocomplétion** (predictive search) avec vignettes produits et suggestions de tissus.
- [ ] **Navigation par univers** : méga-menu `Femme` / `Homme` / `Accessoires` / `Tissus` / `Créateurs` avec visuels.
- [ ] **Filtres avancés** : prix, taille, tissu, disponibilité, nouveautés — via **Shopify Search & Discovery** ou `productFilters`.
- [ ] **Filtres dans l'URL** + état partageable (déjà en place, à conserver) et évaluation côté serveur.
- [ ] **Tri par pertinence** si Search & Discovery est activé.
- [ ] **Fil d'Ariane réel** (aujourd'hui « Shop › Produit » figé, non cliquable) + `BreadcrumbList` JSON-LD.

### 5.7 Contenu, SEO et marketing (P1/P2)

- [ ] **`app/sitemap.ts`** et **`app/robots.ts`** dynamiques (produits, créateurs, pages éditoriales).
- [ ] **JSON-LD** `Product` + `Offer` (prix, devise, disponibilité, avis), `Organization`, `BreadcrumbList`.
- [ ] **Metadata complète** sur toutes les pages (OG, Twitter Card, canoniques) — aujourd'hui partielle.
- [ ] **`opengraph-image.tsx`** généré par produit.
- [ ] **Pages éditoriales** : `/journal` (blog Shopify), `/matieres` (encyclopédie Wax / Kente / Bogolan), `/manifeste`, `/faq`.
- [ ] **Storytelling produit** : chaque pièce doit relier atelier, artisan et temps de confection (métachamps).
- [ ] **Newsletter réelle** : Klaviyo / Mailchimp (double opt-in + RGPD) à la place du mock `setTimeout`.
- [ ] **Pages légales** : CGV, retours, confidentialité, mentions légales, cookies — obligatoires pour encaisser des paiements.
- [ ] **Wishlist partageable** et **looks complets** (« shopper le look » depuis le lookbook).
- [ ] **Flux Instagram / TikTok** sur la home (preuve sociale).

### 5.8 Performance, accessibilité et qualité (P1)

- [ ] **Audit Core Web Vitals** : LCP sur l'image hero, CLS sur les grilles, INP sur le drawer.
- [ ] **Images** : `sizes` correct partout, `priority` uniquement sur le LCP, `placeholder="blur"` + `blurDataURL` (Shopify fournit `?width=`), `formats: ['image/avif','image/webp']` dans `next.config.js`.
- [ ] **Police** : `display: "swap"` déjà en place ; ajouter `preload` et limiter les graisses chargées.
- [ ] **Accessibilité** (WCAG 2.1 AA) : contrastes (le duo `#D4CCBA` / `#1E293B` est limite), focus visible partout, `aria-label` sur les boutons icônes, navigation clavier complète, `aria-live` sur les toasts panier, alternatives textuelles des images produit.
- [ ] **Sémantique HTML** : un seul `h1` par page, `h2/h3` hiérarchisés, `nav`/`main`/`footer` (déjà partiellement en place).
- [ ] **Tests** : ajouter **Vitest** (logique `cart.store`, `normalizeProduct`, `useCart`) + **Playwright** (parcours critique : produit → panier → checkout ; connexion client ; filtres).
- [ ] **CI GitHub Actions** : `pnpm install --frozen-lockfile` → `lint` → `typecheck` → `test` → `build`.
- [ ] **Prettier + ESLint en pre-commit** (Husky + lint-staged).
- [ ] **`error.tsx` / `global-error.tsx`** avec remontée d'erreur (Sentry).
- [ ] **Bundle** : `@next/bundle-analyzer`, vérifier que `@shopify/hydrogen-react` (et ses dépendances `three`) ne pèsent plus une fois supprimé.

### 5.9 Sécurité, exploitation et monitoring (P0/P1)

- [ ] **Supprimer tous les endpoints de seed/test** du dépôt (P0 — voir aussi §3.4). Aucune route mutante ne doit être accessible sans authentification.
- [ ] **Séparer admin et client** : le back-office doit être soit l'admin Shopify, soit une app protégée par un vrai fournisseur d'identité (Auth.js / Clerk) plutôt qu'un mot de passe partagé.
- [ ] **Rotation des secrets** + stockage exclusif dans les variables d'environnement Vercel (jamais dans le dépôt, jamais dans un script).
- [ ] **Vérification de signature des webhooks** (HMAC SHA-256 + comparaison `timingSafeEqual`) avant tout traitement.
- [ ] **Rate limiting** sur les routes publiques sensibles (login client, login créateur, upload) — Upstash Redis ou Vercel WAF.
- [ ] **Headers de sécurité** : CSP, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy` via `next.config.js` (`headers()`).
- [ ] **Upload d'images** : migrer vers un stockage objet (Vercel Blob / S3 / Cloudinary) — écrire dans `public/` ne fonctionne pas sur Vercel.
- [ ] **Monitoring** : Sentry (erreurs) + Vercel Analytics / Speed Insights + alerte sur taux d'erreur Shopify.
- [ ] **Logs structurés** : logger les appels Shopify échoués avec la version d'API retournée par l'en-tête `X-Shopify-API-Version`.
- [ ] **Sauvegardes** : si Prisma est conservé, activer les points de restauration Neon ; sinon, la « sauvegarde » du catalogue est celle de Shopify.
- [ ] **RGPD** : bandeau cookies, politique de confidentialité, registre des consentements, droit à l'effacement (Shopify le fournit en partie).
- [ ] **Pré-prod distincte** : une boutique Shopify de développement (déjà `afrestyle-dev`) + des tokens distincts par environnement.

### 5.10 Expérience premium et conversion (P2)

- [ ] **Animations maîtrisées** : transitions de page (View Transitions API de Next 16), reveal au scroll, parallaxe sur le lookbook.
- [ ] **Micro-interactions** : ajout panier optimiste, skeleton de chargement raffiné, hover produits.
- [ ] **Recherche par intention** : « robe wax pour un mariage », filtres par occasion.
- [ ] **Personnalisation** : recommandations par tissu/premier achat, « compléter le look ».
- [ ] **Service client** : chat (Gorgias / Crisp), FAQ, page contact, WhatsApp (fort usage en Afrique de l'Ouest).
- [ ] **Expérience mobile d'abord** : sticky add-to-cart, checkout en 2 écrans, paiement express (Shop Pay, Apple Pay, Google Pay).
- [ ] **Performance perçue** : préfetch des routes produit au survol, preload des images de la galerie.
- [ ] **Ton éditorial** : cohérence du copywriting (les commentaires de code « En entretien: … » doivent disparaître du dépôt public).

> 🔎 **Remarque de qualité de code** : plusieurs commentaires issus d'une préparation d'entretien technique (« *En entretien : …* ») subsistent dans `lib/shopify/client.ts`, `lib/shopify/queries/products.ts`, `hooks/useCart.ts`, `app/products/[handle]/page.tsx`, `lib/utils.ts`, `components/auth/LoginForm.tsx`. À nettoyer pour un dépôt professionnel.

---

## 6. Plan d'action priorisé

### Sprint 0 — Débloquer et sécuriser (0 → 3 jours)

| # | Tâche | Livrable | Estimation |
| - | - | - | - |
| 1 | Réparer `node_modules` + vérifier `pnpm build` | Build local repassant au vert | 0,5 j |
| 2 | Révoquer le token Admin + supprimer `scripts/` | Zéro secret en clair sur disque | 0,5 j |
| 3 | Supprimer/protéger `/api/seed/**`, `/api/upload/avatar`, `/api/test-shopify` | Surface d'attaque supprimée | 0,5 j |
| 4 | Corriger l'auth admin (`ADMIN_SECRET_TOKEN`) | Panneau admin fonctionnel et sûr | 0,5 j |
| 5 | Créer les deux clients Shopify (Storefront + Admin) et la constante de version d'API | `lib/shopify/version.ts` + `admin-client.ts` | 0,5 j |
| 6 | Décision multivendeur (**Option A** ou **B**) + suppression du bloc concerné | Dette retirée, `package.json` nettoyé | 1 j |

### Sprint 1 — Boutique crédible (semaine 1 → 4)

| # | Chantier | Contenu | Estimation |
| - | - | - | - |
| 7 | Catalogue | Pagination par curseur, ISR, `/api/revalidate`, webhooks produits, `loading.tsx` / `error.tsx` | 3 j |
| 8 | Fiche produit | Refonte du sélecteur (machine à états), image par variante, `quantityAvailable`, prix dynamique, guide des tailles, quantité | 4 j |
| 9 | Panier | Page `/cart`, `getCart` au montage, codes promo, note, attributs, buyer identity, seuil livraison offerte | 3 j |
| 10 | Post-achat | Webhooks commande signés, page de confirmation réelle, suivi de commande | 2 j |
| 11 | Recherche & navigation | `/search`, autocomplétion, méga-menu, filtres avancés (Search & Discovery) | 3 j |
| 12 | Qualité | `strict: true`, Vitest + Playwright, CI GitHub Actions, metadata complète, sitemap/robots, JSON-LD | 4 j |

### Sprint 2 — Premium (mois 2 → 3)

| # | Chantier | Contenu | Estimation |
| - | - | - | - |
| 13 | Merchandising éditorial | Journal, encyclopédie des matières, storytelling par métachamps, lookbook enrichi, « shopper le look » | 4 j |
| 14 | Fidélisation | Wishlist persistée + page dédiée, avis clients, programme VIP, préférences de taille | 4 j |
| 15 | Marketing | Klaviyo, GA4 + consentement, flux Instagram, codes ambassadeurs | 3 j |
| 16 | International | Shopify Markets, `@inContext`, devises/taxes par marché, chat/WhatsApp | 4 j |
| 17 | Observabilité | Sentry, Vercel Analytics/Speed Insights, logs Shopify, alertes | 2 j |
| 18 | Accessibilité & performance | Audit WCAG AA, CSP/headers, audit CWV, budget de bundle | 3 j |

**Estimation totale : ~7 semaines de travail effectif** (hors production de contenu photo/éditorial, qui conditionne largement la perception « haut de gamme »).

---

## 7. Annexe A — Correctifs de code à fort impact (prêts à appliquer)

### A.1 Séparer les clients Shopify (corrige B2)

```ts
// src/lib/shopify/version.ts  (nouveau)
const VERSION = process.env.SHOPIFY_API_VERSION ?? "2026-07"; // à aligner sur le changelog Shopify
const DOMAIN  = process.env.SHOPIFY_STORE_DOMAIN!;            // ex. afrestyle-dev.myshopify.com

export const STOREFRONT_ENDPOINT = `https://${DOMAIN}/api/${VERSION}/graphql.json`;
export const ADMIN_ENDPOINT      = `https://${DOMAIN}/admin/api/${VERSION}/graphql.json`;
```

```ts
// src/lib/shopify/admin-client.ts  (nouveau)
import { ADMIN_ENDPOINT } from "./version";

export async function shopifyAdminFetch<T>({
  query,
  variables,
}: {
  query: string;
  variables?: Record<string, unknown>;
}): Promise<T> {
  const res = await fetch(ADMIN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": process.env.SHOPIFY_ADMIN_TOKEN!, // jamais NEXT_PUBLIC_
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Admin API ${res.status}`);
  const body = await res.json();
  if (body.errors) {
    throw new Error(body.errors.map((e: { message: string }) => e.message).join(", "));
  }
  return body.data as T;
}
```

Puis, dans `createProduct()` : remplacer `shopifyFetch(...)` par `shopifyAdminFetch(...)` et remplacer l'argument `channel` de `productPublish` (invalide) par `publishablePublish` avec un **vrai ID de publication** obtenu via :

```graphql
query { publications(first: 10) { edges { node { id name } } } }
```

### A.2 Réparer l'authentification admin (corrige B4)

```ts
// src/lib/actions/admin.actions.ts — remplacer la fin de adminLoginAction
const sessionToken = process.env.ADMIN_SECRET_TOKEN;
if (!sessionToken) {
  return { success: false, error: "Configuration admin manquante (ADMIN_SECRET_TOKEN)" };
}

cookieStore.set(ADMIN_COOKIE, sessionToken, {   // ← le MÊME secret que celui vérifié par le middleware
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: 60 * 60 * 8,
  path: "/",
});
```

`assertAdmin()` et `middleware.ts` n'ont alors plus rien à modifier : ils comparent déjà à `ADMIN_SECRET_TOKEN`.

### A.3 Sélecteur de variantes correct (corrige F1 et F2)

```ts
// src/components/product/ProductForm.tsx — logique cible
const optionNames = [
  ...new Set(product.variants.flatMap((v) => v.selectedOptions.map((o) => o.name))),
];

const [selected, setSelected] = useState<Record<string, string>>(() => {
  const first = product.variants.find((v) => v.availableForSale) ?? product.variants[0];
  return Object.fromEntries(first?.selectedOptions.map((o) => [o.name, o.value]) ?? []);
});

/** Variant exact correspondant à la sélection courante */
const selectedVariant = product.variants.find((v) =>
  optionNames.every((name) =>
    v.selectedOptions.some((o) => o.name === name && o.value === selected[name]),
  ),
);

/** Valeur sélectionnable s'il existe au moins un variant disponible pour la combinaison hypothétique */
function isValueAvailable(name: string, value: string) {
  const hypothetical = { ...selected, [name]: value };
  return product.variants.some(
    (v) =>
      v.availableForSale &&
      optionNames.every((n) =>
        v.selectedOptions.some((o) => o.name === n && o.value === hypothetical[n]),
      ),
  );
}
```

### A.4 Résynchronisation du panier (corrige F8)

```ts
// src/hooks/useCart.ts — à ajouter
useEffect(() => {
  if (!shopifyCart?.id) return;
  let cancelled = false;
  (async () => {
    try {
      const fresh = await getCart(shopifyCart.id);
      if (cancelled) return;
      if (!fresh) clearCart();      // panier expiré → on repart proprement
      else setShopifyCart(fresh);   // prix et stock rafraîchis
    } catch {
      if (!cancelled) clearCart();
    }
  })();
  return () => {
    cancelled = true;
  };
}, [shopifyCart?.id]);
```

### A.5 Charger les métachamps et enrichir les variantes (corrige S2 et S3)

```graphql
# à ajouter dans PRODUCT_FRAGMENT (src/lib/shopify/queries/products.ts)
metafields(identifiers: [
  { namespace: "custom", key: "materials" },
  { namespace: "custom", key: "care_instructions" },
  { namespace: "custom", key: "origin_story" },
  { namespace: "custom", key: "artisan" }
]) {
  key
  value
  type
}

variants(first: 20) {
  edges {
    node {
      id
      title
      sku
      availableForSale
      quantityAvailable
      image { url altText width height }
      price { amount currencyCode }
      compareAtPrice { amount currencyCode }
      selectedOptions { name value }
    }
  }
}
```

### A.6 Webhook de révalidation (corrige B8)

```ts
// src/app/api/revalidate/route.ts  (nouveau)
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { revalidateTag } from "next/cache";

export async function POST(req: NextRequest) {
  const raw = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256") ?? "";
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET!;

  const digest = crypto.createHmac("sha256", secret).update(raw, "utf8").digest("base64");
  const valid =
    digest.length === hmac.length &&
    crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(hmac));

  if (!valid) return NextResponse.json({ ok: false }, { status: 401 });

  revalidateTag("products");
  return NextResponse.json({ ok: true, revalidated: true });
}
```

---

## 8. Annexe B — Commandes de vérification

```powershell
# 1. Réparer l'environnement (⚠️ la cause racine des échecs de build)
cd D:\PROJETS\afrestyle
Remove-Item -Recurse -Force node_modules
pnpm install
pnpm build

# 2. Vérifier que plus aucun secret ne traîne dans les scripts
Select-String -Path scripts\*.mjs -Pattern 'shpat_' | Select-Object Filename, LineNumber

# 3. Vérifier les routes publiques (doivent répondre 401/404 après correctif)
Invoke-WebRequest "http://localhost:3000/api/test-shopify" -UseBasicParsing |
  Select-Object StatusCode

# 4. Vérifier la version d'API réellement servie par Shopify (fall forward)
curl.exe -s -D - -o NUL -X POST "https://afrestyle-dev.myshopify.com/api/2024-01/graphql.json" `
  -H "Content-Type: application/json" `
  -H "X-Shopify-Storefront-Access-Token: $env:NEXT_PUBLIC_SHOPIFY_STOREFRONT_ACCESS_TOKEN" `
  -d '{\"query\":\"{ shop { name } }\"}' | Select-String "X-Shopify-API-Version"

# 5. Vérifier l'incohérence d'authentification admin
Select-String -Path src\middleware.ts,src\lib\actions\admin.actions.ts -Pattern 'ADMIN_SECRET_TOKEN|ADMIN_PASSWORD'

# 6. Vérifier le typage et le lint après nettoyage
pnpm exec tsc --noEmit
pnpm lint
```

### Checklist de validation du présent rapport

| Vérification | Statut |
| - | - |
| `AFROSTYLE_PROJECT_REPORT.md` présent à la racine du projet | ✅ |
| Structure des dossiers et stack conformes au dépôt (vérifié fichier par fichier) | ✅ |
| Liste des composants/fonctionnalités fondée sur le code réel (61 fichiers TS/TSX lus) | ✅ |
| Recherche « Sopexa » / « multivendor » exhaustive (code + historique git) → 0 occurrence | ✅ |
| Résidus multivendeur identifiés et cartographiés (fichiers, tables, dépendances, routes) | ✅ |
| État de la connexion Storefront documenté opération par opération | ✅ |
| Version d'API `2024-01` confirmée comme retirée (politique officielle Shopify citée) | ✅ |
| Checklist produits/panier/checkout fournie avec priorisation et estimations | ✅ |
| Aucun fichier du projet modifié (audit en lecture seule) | ✅ |

---

## 9. Conclusion

Le socle AfroStyle est **de bonne qualité technique** : architecture App Router lisible, design system cohérent, intégration Storefront API (catalogue + panier + comptes clients) réelle et correctement normalisée, Server Actions sécurisées. Le projet est toutefois **à la croisée de deux modèles** : une marketplace multivendeur inachevée (héritée d'une intention « Sopexa / multi-vendeurs », dont aucune trace littérale ne subsiste) et une boutique headless mono-marque. C'est cette ambiguïté qui génère aujourd'hui la majorité de la dette : dépendances mortes, tables inutiles, route Admin inexistante, endpoints de seed publics, secrets en clair.

**Trois décisions conditionnent la suite :**

1. **Trancher le modèle** : supprimer le bloc multivendeur (Option A) ou le réduire à un annuaire éditorial (Option B) — §3.4.
2. **Réparer la couche Shopify** : deux clients (Storefront + Admin), version d'API épinglée, webhooks d'invalidation — §4.3, §7.
3. **Sécuriser et fiabiliser** : secrets révoqués, endpoints de seed supprimés, auth admin unifiée, environnement local réparé — §0.2, §5.0.

Une fois les 8 bloquants levés (~3 jours), la mise en place des chantiers du Sprint 1 (catalogue paginé, sélecteur de variantes tissus × tailles, page panier, post-achat, recherche, qualité) suffit à obtenir une boutique **déployable et crédible**, avant d'attaquer la couche premium (contenu, fidélisation, international, observabilité).

_Rapport généré par audit statique du dépôt — aucune modification de code n'a été effectuée._

















