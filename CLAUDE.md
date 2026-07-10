# CLAUDE.md — Brief permanent WorkPiServ

Ce fichier est chargé automatiquement par Claude Code au démarrage de chaque
session sur ce repo. Il documente l'architecture réelle, les conventions et
les règles non-négociables du projet. **À maintenir à jour à chaque nouvelle
convention établie** — si une règle change, mets à jour ce fichier plutôt
que de la répéter dans chaque prompt.

## Le projet

WorkPiServ (WorkπServ) — marketplace freelance de l'écosystème Pi Network.
Les "Pioneers" (freelancers) et clients transactent en Pi (π), protégés par
un escrow. Propriétaire unique : Ali Ben Taher (@alibentaher).

- **Repo** : ce repo (`workpiserv-testnet`) est la branche/déploiement **testnet**.
- Le réseau actif (mainnet/testnet) est déduit **automatiquement du hostname**
  au runtime — ne jamais coder une URL d'API en dur, toujours passer par
  `@/config/network`.

## Stack technique

- **React 19** + **TypeScript**, build **Vite 7**
- Routing : `react-router-dom` v7
- Style : **Tailwind CSS** + **shadcn/ui** (style `new-york`, baseColor `slate`, icônes `lucide-react`)
- Formulaires : `react-hook-form` + `zod` (`@hookform/resolvers`)
- Animations : `framer-motion`
- Notifications UI : `sonner` / `react-hot-toast`
- Déploiement : GitHub Pages (`gh-pages`), fallback SPA via `public/404.html` → `?redirect=/path`

## Architecture des dossiers

```
src/
  components/
    layout/      Header, Footer, MobileBottomNav
    shared/      composants réutilisables (ServiceCard, StarRating, Price, WelcomeModal...)
    ui/          composants shadcn/ui bruts (ne pas modifier sauf besoin réel — régénérer via shadcn CLI si possible)
  pages/         une page par route (HomePage, MarketplacePage, OrdersPage, ProfilePage...)
  pages/static/  pages de contenu statique (About, Help, Safety, Contact, Blog, Privacy, Terms, Cookies...)
  admin/         composants réservés à /admin (rôle 'admin' vérifié côté serveur)
  hooks/         usePiAuth (context d'auth partagé), usePiPrice, useAvatar, useMediaQuery, use-mobile
  lib/           api.ts (client API backend), pi.ts (intégration SDK Pi Network), utils.ts (cn())
  config/        network.ts — source de vérité unique réseau (mainnet/testnet) + API_BASE_URL
  i18n/          index.tsx — système de traduction maison (EN/FR/AR/ZH/VI)
  types/         interfaces partagées (Service, Freelancer, Order, Review...)
  data/          données statiques/mock
  sections/home/ sections de la page d'accueil
```

## Design system

### Couleurs (Tailwind, `tailwind.config.js`)
- `brand` : `#F16530` (DEFAULT), hover `#E05520`, light `#FFF0EB`, subtle `rgba(241,101,48,0.08)`
- `navy` : `#E2DEFF`
- `escrow` : `#B49BFF` (DEFAULT), light `rgba(180,155,255,0.15)` — **couleur dédiée aux éléments liés à l'escrow**
- `dark` : `#161236` (DEFAULT), card `#231E50`, elem `#302A69`
- `mauve` : `#B49BFF` (DEFAULT), dark `#785ADC`
- Palette shadcn standard (`border`, `input`, `ring`, `background`, `foreground`, `primary`, `secondary`, `destructive`, `muted`, `accent`, `popover`, `card`) pilotée par variables CSS HSL dans `src/index.css`

### Typographie
- `font-heading` → Poppins (titres)
- `font-body` → Inter (corps de texte)
- Polices chargées via `@fontsource/inter` et `@fontsource/poppins`

### Radius / ombres
- Radius : `xl/lg/md/sm/xs` dérivés de `--radius`, plus `2xl` (16px), `3xl` (20px), `4xl` (24px)
- Ombres custom : `card`, `card-hover`, `nav`, `xs`

### Animations custom
`accordion-down/up`, `caret-blink`, `pulse-dot`, `shimmer`, `float`, `timeline-pulse` — réutiliser celles existantes avant d'en créer une nouvelle.

### Composants UI
- Toujours utiliser les composants `@/components/ui/*` (shadcn) en premier lieu plutôt que du HTML brut stylé à la main.
- Utilitaire de classes : `cn(...)` depuis `@/lib/utils` (clsx + tailwind-merge) — l'utiliser pour toute composition conditionnelle de classes.

## Conventions de code

- **Alias d'import** : `@/components`, `@/lib`, `@/ui` (`@/components/ui`), `@/hooks` (voir `components.json`)
- **Composants** : PascalCase, un composant par fichier, export nommé pour les composants de layout/shared (`export function Header()`), export par défaut pour les pages (`export default function HomePage()`)
- **Commentaires** : le codebase commente en **français**, y compris les commentaires techniques d'architecture (ex. `config/network.ts`, `lib/pi.ts`). Continuer dans cette langue pour la cohérence.
- Ne jamais coder en dur une URL d'API — toujours `API_BASE_URL` / `apiHeaders()` depuis `@/config/network`.

## Système i18n (`src/i18n/index.tsx`)

- 5 langues : `en`, `fr`, `ar`, `zh`, `vi` — type `Lang`
- Fait maison, sans librairie externe. RTL automatique pour l'arabe.
- Langue mémorisée dans `localStorage` (clé `workpiserv_lang`)
- Clés en dot-notation par domaine fonctionnel : `nav.*`, `header.*`, `onboard.*`, `wallet.*`, `common.*`, `footer.*`, etc.
- **Règle stricte** : quand une nouvelle clé est ajoutée, elle doit être insérée **dans les 5 blocs de langue** (`en`, `fr`, `ar`, `zh`, `vi`), au même endroit relatif dans chaque bloc (ex. après une clé ancre comme `footer.affiliate`), sans réorganiser ni modifier les clés existantes.
- Une clé brute affichée dans l'UI (ex. `footer.whitepaper` au lieu du texte traduit) signale toujours une entrée i18n manquante dans une des 5 langues — vérifier les 5 blocs avant de conclure à un autre bug.
- Interpolation par placeholder type `{username}` dans les chaînes (voir `onboard.slide1Title`).

## Intégration Pi Network (`@/lib/pi.ts`, `@/hooks/usePiAuth.ts`)

- Le réseau (mainnet/testnet) est déduit du hostname dans `@/config/network` — **jamais** d'URL ou de config réseau codée en dur ailleurs.
- Détection du SDK Pi : `piSdkAvailable()`, `waitForPiSDK()` (jusqu'à 5s, le SDK peut charger après le clic sur mobile).
- Détection Pi Browser : `isPiBrowser()` (SDK + user-agent) vs `isPiBrowserUA()` (user-agent seul, utilisable avant chargement du SDK — sert à ne jamais afficher le modal "Ouvrir dans Pi Browser" à un utilisateur déjà dedans).
- **Auth centralisée via Context** (`AuthProvider` / `usePiAuth`) : une seule source de vérité pour toute l'app. Ne pas réintroduire d'état d'auth local dupliqué dans un composant — historiquement, ça causait des désynchronisations (logout dans un composant non propagé ailleurs).
- Réseaux mobiles instables : chaque tentative réseau critique a un timeout + un seul retry (voir commentaires dans `pi.ts`).
- Token JWT stocké dans `localStorage` sous `workpiserv_token`.

## Principes escrow & sécurité (non négociables)

- WorkPiServ est un **intermédiaire non-custodial** : ne stocke **jamais** de seed phrase / phrase secrète de 24 mots, sous aucun prétexte. Seules les adresses publiques Pi (format Stellar, commence par `G`, 56 caractères) sont stockées.
- Flow standard : recharge → commande (fonds verrouillés en escrow) → livraison → validation/litige → retrait.
- Commission : 10% WorkPiServ / 90% freelancer à la validation client.
- Toute UI touchant au wallet doit reprendre les avertissements existants (`wallet.warning.*` dans i18n) : ne jamais demander la phrase secrète, vérifier l'adresse avant sauvegarde, rappeler qu'une erreur d'adresse est irrécupérable.
- Le backend rejette les requêtes dont le header `X-Pi-Network` ne correspond pas à son propre réseau (403 `NETWORK_MISMATCH`) — toujours utiliser `apiHeaders()`.

## Routing (`src/App.tsx`)

Routes principales déclarées dans `AppContent` : `/`, `/marketplace`, `/service/:id`, `/orders`, `/profile`, `/profile/:username`, `/create-service`, `/messages`, `/admin`, pages statiques (`/about`, `/help`, `/safety`, `/contact`, `/report`, `/blog`, `/affiliate`, `/privacy`, `/terms`, `/cookies`).

- Toute nouvelle page va dans `src/pages/` (ou `src/pages/static/` si contenu statique/légal) et doit être déclarée dans `App.tsx`.
- Le layout global (`Header` + contenu + `Footer` + `MobileBottomNav`) est géré par `AppLayout` — ne pas dupliquer Header/Footer dans une page individuelle.
- Scroll-to-top automatique à chaque changement de route — ne pas réintroduire de logique concurrente.
- `ConsentGate` bloque l'app tant que les CGU ne sont pas acceptées (source de vérité : `user.termsAccepted` renvoyé par `/api/auth/me`) — ne pas contourner côté client.

## Ce que Claude Code doit toujours faire ici

1. Consulter ce fichier avant de générer une nouvelle page/composant.
2. Réutiliser les composants `ui/` et `shared/` existants avant d'en créer de nouveaux.
3. Ajouter toute nouvelle chaîne de texte utilisateur dans les **5 langues** de `i18n/index.tsx`, jamais de texte en dur dans un composant.
4. Ne jamais introduire de logique qui manipule ou stocke une seed phrase.
5. Utiliser `API_BASE_URL` / `apiHeaders()` — jamais d'URL réseau codée en dur.
6. Livrer des fichiers complets et prêts à l'emploi (pas de snippets partiels), avec instructions d'insertion précises si édition manuelle nécessaire.
7. Proposer de mettre à jour ce `CLAUDE.md` dès qu'une nouvelle convention est établie en session.
