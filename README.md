# Hero Realms — prototype de campagne solo

Adaptation personnelle en React et TypeScript. Une rencontre complète, **L’Autel des Ombres**, est jouable depuis l’accueil avec cinq classes : clerc, guerrier, rôdeur, voleur et magicien.

Les cartes, pouvoirs, decks de classes et le scénario sont provisoires et fictifs. Ce prototype ne reproduit pas encore la première rencontre officielle de La Ruine de Thandar. Il n’utilise pas les illustrations officielles.

## Démarrer

Node.js 24 est recommandé. Les dépendances sont verrouillées dans `package-lock.json`.

```sh
npm ci
npm run dev
```

Ouvrir l’URL locale affichée par Vite, choisir « Nouvelle campagne », puis une classe, un nom et une graine de partie. La graine 42 est proposée par défaut. La même graine, la même classe et les mêmes décisions donnent la même partie.

Les parties restent en mémoire : quitter ou recharger la page efface la rencontre. La sauvegarde et la progression entre rencontres sont prévues ultérieurement.

## Jouer

L’étape du Maître précède chaque phase du héros, y compris la première. Résoudre les éventuels choix de défausse, d’ordre des sbires ou de cible avant de poursuivre.

Pendant la phase du héros :

- Jouer les cartes de la main, utiliser les champions et les pouvoirs.
- Acheter des cartes au marché ou des Gemmes de feu : elles rejoignent la défausse.
- Choisir le combat à dépenser par attaque, puis une cible accessible. Les sbires mobilisés de votre zone empêchent de combattre ailleurs ; les gardes protègent les non-gardes de leur zone et le Maître lorsqu’ils sont dans sa zone.
- Dissiper les dangers en payant le coût indiqué.
- Terminer le tour : les actions et la main sont défaussées, les ressources sont perdues, les champions sont mobilisés et cinq cartes sont piochées avant la prochaine étape du Maître.

Les blessures des sbires ne persistent pas entre les tours. La santé peut dépasser sa valeur de départ. Les Gemmes de feu sacrifiées reviennent dans leur réserve ; seules les cartes provenant du marché peuvent alimenter son recyclage.

La rencontre se termine quand le Maître ou le héros atteint zéro santé. « Rejouer la même rencontre » réinitialise le héros, les pouvoirs, les decks et les ennemis avec la même graine.

## Architecture et remplacement du contenu

- `src/game-engine/core` : moteur indépendant de React, transformations immuables via `applyAction`, générateur déterministe et validations d’état.
- `src/game-content/cards/demo-cards.ts` : cartes provisoires du héros et du marché.
- `src/game-content/classes` : decks, pouvoirs et progressions des cinq classes.
- `src/game-content/campaigns/demo/solo-campaign-content.ts` : définition de la rencontre jouable, cartes du Maître, capacités par faction et niveau, sbires et dangers.
- `src/game-content/create-solo-campaign.ts` : assemblage de la partie solo.
- `src/features/campaign` : préparation et plateau React.

`GameState.format` distingue duel et campagne ; `GameState.mode` décrit le mode d’accès. Les ennemis et leurs zones sont centralisés dans `campaignEncounter`. Les anciennes définitions de démonstration sont conservées comme fixtures des tests existants.

Le deck du Maître répartit cinq maîtrises dans cinq piles mélangées séparément. Les capacités des cartes révélées sont résolues avant leurs cartes, puis les maîtrises, les sbires locaux, les élites et l’attaque du Maître. Les décisions interrompent la résolution sans rejouer les étapes déjà exécutées.

Le moteur actuel couvre les effets utilisés par ce contenu provisoire. Intégrer les cartes officielles pourra nécessiter de nouveaux effets, des mots-clés et les règles propres à leur scénario. La coopération, le duel complet, le jeu en ligne et les récompenses de campagne ne sont pas disponibles dans cette interface.

## Vérifications

```sh
npm run test:run
npm run lint
npm run build
```

Les tests couvrent notamment les cinq classes, les décisions pendant l’étape du Maître, ses priorités de combat, la portée des attaques, les dangers, les sacrifices, la fin de rencontre, le rejeu déterministe et les interactions React.

## Références de règles

- [Règles françaises du jeu de base, IELLO](https://iello.fr/wp-content/uploads/2018/03/Hero-Realms_Rules_FR_Light.pdf)
- [La Ruine de Thandar, livret officiel anglais, deuxième édition](https://www.herorealms.com/files/rules/HeroRealms_RoT_RuleBook_2E_WEB.pdf)
- [FAQ et corrections officielles](https://www.herorealms.com/rules)
