# Arbre d'Assemblage de Chaudronnerie

Application pour les Ingénieurs Méthodes en chaudronnerie/métallerie pour concevoir visuellement l'arbre de montage hiérarchique d'un produit complexe.

## Fonctionnalités
- **Import Excel** : Copier-coller direct depuis Excel (Repère, Nom, Quantité).
- **Drag & Drop** : Glissez-déposez des articles et des opérations sur le canvas.
- **Édition Directe** : Modifiez les noms, références et quantités directement sur le graphique.
- **Export** : Exportez votre arbre en PNG ou PDF.
- **Suggestions IA** : Utilisez Gemini pour suggérer des méthodes d'assemblage.

## Déploiement sur GitHub Pages

L'application est configurée pour être déployée automatiquement sur GitHub Pages.

### Étapes :
1. Créez un nouveau dépôt sur GitHub.
2. Poussez votre code sur la branche `main`.
3. Allez dans les **Settings** de votre dépôt > **Secrets and variables** > **Actions**.
4. Ajoutez un **New repository secret** nommé `GEMINI_API_KEY` avec votre clé API Gemini (obtenue sur [Google AI Studio](https://aistudio.google.com/)).
5. Le déploiement se lancera automatiquement via GitHub Actions.
6. Une fois terminé, allez dans **Settings** > **Pages** et assurez-vous que la source est la branche `gh-pages`.

## Développement Local
```bash
npm install
npm run dev
```
