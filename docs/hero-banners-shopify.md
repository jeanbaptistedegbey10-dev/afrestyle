# Hero & bannières pilotés par Shopify Admin

Le diaporama de l'accueil (Hero) et les bannières de catégories ne contiennent
plus **aucune donnée en dur** : tout est publié depuis Shopify Admin, sans
redéploiement ni modification de code Next.js.

| Contenu | Source Shopify | Consommé par |
| --- | --- | --- |
| Diaporama Hero | Metaobjects de type `hero_slide` | `src/app/page.tsx` → `HeroSection` → `HeroCarousel` |
| Bannière de catégorie (accueil) | Metafields `custom.banner_*` des Collections | `src/app/page.tsx` → `CategoriesGrid` |
| Bannière de page collection | idem, pour **une** collection | `src/app/collections/[handle]/page.tsx` → `CollectionBanner` |

---

## 1. Diaporama Hero — Metaobjects

### 1.1 Créer la définition

`Content > Metaobjects > Add definition`

- **Type** : `hero_slide`
- **Name** : `Bannière du Hero`
- **Display name field** : `title`
- **Access > Admin** : `MERCHANT_READ_WRITE`
- **Access > Storefront** : `PUBLIC_READ` ← **indispensable**, sinon l'API
  Storefront refuse de lire le type.

Champs à créer :

| Clé | Type | Obligatoire | Rôle |
| --- | --- | :---: | --- |
| `title` | single_line_text_field | ✅ | Titre du Hero (1re slide = `<h1>`) |
| `title_highlight` | single_line_text_field | | Fragment italique champagne accolé au titre |
| `eyebrow` | single_line_text_field | | Badge au-dessus du titre |
| `subtitle` | multi_line_text_field | | Accroche sous le titre |
| `image` | **file_reference** | ✅ | Visuel de fond (média de la bibliothèque) |
| `link` | url | | Cible du bouton principal |
| `button_text` | single_line_text_field | | Libellé du bouton principal |
| `secondary_link` | url | | Cible du bouton secondaire |
| `secondary_button_text` | single_line_text_field | | Libellé du bouton secondaire |
| `position` | number_integer | | Ordre d'affichage (1, 2, 3…) |
| `active` | boolean | | Masque une slide sans la supprimer |

> `image` est un `file_reference` : le storeur renvoie un GID, pas une URL.
> C'est pourquoi la requête lit `reference { ... on MediaImage { image { url } } }`
> (cf. `src/lib/shopify/queries/hero.ts`).

### 1.2 Exposer le type au Storefront API

`Settings > Apps and sales channels > Storefront API > Metaobjects`

Cocher **`hero_slide`** (scope `unauthenticated_read_metaobjects`), puis
**Enregistrer**.

Tant que cette case n'est pas cochée, `metaobjects(type: "hero_slide")`
renvoie une liste vide : le site affiche alors son repli éditorial (aucune
erreur, aucune page blanche).

### 1.3 Publier les entrées

`Content > Metaobjects > hero_slide > Add entry`, une entrée par diapositive.
Nommer les handles `01-`, `02-`… (tri naturel en secours) et renseigner
`position`.

---

## 2. Bannières de catégories — Metafields

`Settings > Custom data > Metafield definitions > Add definition`

- **Name** : `Bannière de collection`
- **Namespace and key** : `custom`, `banner_image`
- **Type** : `file_reference`
- **Owners** : `Collection`

Puis les métachamps complémentaires (mêmes clés listées ci-dessous). Pour
créer plusieurs clés d'un coup, partir d'une définition et utiliser
« Add definition » ensidershipant l'owner `Collection`.

| Clé | Type | Rôle |
| --- | --- | --- |
| `banner_image` | file_reference | Visuel de la carte / du bandeau |
| `banner_alt` | single_line_text_field | Texte alternatif (accessibilité) |
| `banner_title` | single_line_text_field | Titre (défaut : titre de la collection) |
| `banner_subtitle` | multi_line_text_field | Sous-titre |
| `banner_link` | url | Cible du bouton (défaut : `/collections/<handle>`) |
| `banner_button_text` | single_line_text_field | Libellé du bouton (défaut : « Explorer ») |
| `banner_position` | number_integer | Ordre dans la grille (1, 2, 3…) |
| `banner_active` | boolean | Masque la carte sans la supprimer |

Renseigner ces métachamps depuis `Products > Collections > <collection>`,
onglet ** metafields / Métadonnées**.

---

## 3. Mise à jour immédiate (webhooks)

Les lectures utilisent le cache Next.js (tag `hero`, `banners`, `collections`).
Pour qu'une publication soit visible sans attendre l'ISR (5 min), créer trois
webhooks Shopify pointant sur `POST /api/revalidate` :

| Topic | Effet |
| --- | --- |
| `metaobjects/create` · `metaobjects/update` · `metaobjects/delete` | invalide `hero` + `banners` + `home-sections` + `about-cards` + la home et `/about` |
| `collections/create` · `collections/update` · `collections/delete` | invalide `banners` + `collections` |
| `products/create` · `products/update` · `products/delete` | invalide `products` (déjà en place) |

Le corps du webhook est signé (`x-shopify-hmac-sha256`) et vérifié contre
`SHOPIFY_WEBHOOK_SECRET`. **Cette variable doit être renseignée**, sinon la
route répond 500.

> Les webhook `metaobjects/*` **n'existent pas** sur les anciennes versions de
> l'API Admin : si la boutique ne les propose pas, le repli ISR de 5 minutes
> s'applique — c'est déjà fonctionnel.

---

## 4. Comportement en cas de configuration absente

| Situation | Rendu |
| --- | --- |
| Type `hero_slide` non exposé / boutique injoignable | Diaporama éditorial local (`src/constants/images.ts`) |
| Slide sans image **et** sans titre | Ignorée |
| Slide `active = false` | Ignorée |
| Collection sans `banner_image` ni photo | Carte ignorée |
| Aucune bannière de collection | Grille « Nos univers » de repli, en-tête historique sur `/collections/[handle]` |
| Type `editorial_card` non exposé / boutique injoignable | Cartes éditoriales locales (`src/lib/shopify/about.ts`) |
| Carte `/about` sans image **et** sans titre | Ignorée |
| Carte `/about` `active = false` | Ignorée |
| Moins de 3 cartes `/about` publiées | Complétée par les replis locaux (jamais moins de 3) |

Ces règles sont implémentées dans `src/lib/shopify/hero.ts`,
`src/lib/shopify/collections.ts`, `src/lib/shopify/sections.ts` et
`src/lib/shopify/about.ts` : une erreur de configuration en Admin ne
peut pas rendre la page inerte.

---

## 4 bis. Cartes éditoriales de `/about` — Metaobjects

La section « Journal des matières » de `/about` est pilotée par des métaobjets
de type **`editorial_card`**. Aucun titre, paragraphe ni visuel n'est codé en dur
dans `src/app/about/page.tsx`.

- Requête : `src/lib/shopify/queries/about.ts` (`GET_ABOUT_CARDS_QUERY`)
- Données : `src/lib/shopify/about.ts` (`getAboutEditorialCards`)
- Rendu : `src/app/about/page.tsx` → bloc « Journal des matières »
- Cache : tag `about-cards`, invalidé par le webhook `metaobjects/*`

### 4 bis.1 Créer la définition

`Content > Metaobjects > Add definition`

- **Type** : `editorial_card`
- **Display name field** : `title`
- **Access > Admin** : `MERCHANT_READ_WRITE`
- **Access > Storefront** : `PUBLIC_READ` ⬐ **indispensable**, sinon l'API
  Storefront refuse de lire le type.

| Clé | Type | Obligatoire | Rôle |
| --- | --- | --- | --- |
| `title` | single_line_text_field | oui | Titre de la carte |
| `eyebrow` | single_line_text_field | non | Sur-libellé au-dessus du titre |
| `body` | multi_line_text_field | non | Paragraphe éditorial |
| `image` | file_reference | oui | Visuel (cadrage 16/9 ou 4/5) |
| `position` | number_integer | oui | **Ordre éditorial croissant** |
| `active` | boolean | non | `false` masque la carte sans la supprimer |

### 4 bis.2 Trier par `position`

Le Storefront **ne sait pas trier sur un champ de métaobjet** : `sortKey: "id"`
est un tri technique, pas un ordre éditorial. L'ordre est donc appliqué côté
serveur dans `lib/shopify/about.ts` :

1. `position` numérique **croissant** (1, 2, 3…) ;
2. à `position` égal (ou absent), tri du `handle` en naturel — les handles
   `01-`, `02-` se rangent correctement ;
3. une carte **sans** `position` est poussée en fin de grille.

> Renseignez `position` sur **chaque** carte : sans lui, la carte est rendue
> après les replis locaux, pas à sa place.

### 4 bis.3 Type `about_card`

`about_card` est accepté comme **synonyme** de `editorial_card`. Si le premier
type ne renvoie aucune entrée, le second est interrogé automatiquement : une
définition nommée `about_card` fonctionne sans toucher au code.

### 4 bis.4 Rythme de la grille

La mise en page s'adapte au nombre d'entrées : la **1ʳᵉ carte occupe toute la
largeur** (cadrage 16/9), les suivantes se partagent une ligne en vis-à-vis
(cadrage 4/5). Le visuel est servi à la bonne largeur via le CDN Shopify
(1920 px pour la carte pleine largeur, 900 px sinon).

### 4 bis.5 Publier

`Content > Metaobjects > editorial_card > Add entry` : **une entrée par carte**,
avec `position` renseignée, puis **publier l'entrée** (une entrée au brouillon
n'est pas renvoyée par le Storefront).

---

## 5. Vérifier sans ouvrir le navigateur

```bash
# Les 3 requêtes livrées par le projet, exécutées contre la vraie boutique
node tmp-probe.mjs   # requête hero_slide + banners de collections
```

Le script lit `.env.local` et interroge
`https://<boutique>/api/<version>/graphql.json`. Un `nodes: []` sur
`metaobjects` signifie simplement qu'aucune entrée n'est encore publiée.