# La Bonne Annonce

La Bonne Annonce est un outil intelligent qui vous aide à créer des annonces Leboncoin parfaites grâce à l'intelligence artificielle.

## 🚀 Fonctionnalités

- **Analyse d'image** : Prenez une photo de votre objet et laissez l'IA l'analyser
- **Génération automatique** : Créez des titres accrocheurs, descriptions détaillées et prix suggérés
- **Mises en situation** : Générez jusqu'à 5 images de votre objet dans différents contextes
- **Optimisation IA** : Améliorez vos textes avec l'intelligence artificielle
- **Export facile** : Copiez et téléchargez vos images et textes

## 🛠️ Technologies

- **React 18** - Interface utilisateur moderne
- **Vite** - Build tool ultra-rapide
- **Tailwind CSS** - Design responsive et élégant
- **Lucide React** - Icônes vectorielles
- **Google Gemini API** - Intelligence artificielle

## 📦 Installation

1. Clonez le repository :
```bash
git clone https://github.com/votre-username/labonneannonce.git
cd labonneannonce
```

2. Installez les dépendances :
```bash
npm install
```

3. Lancez le serveur de développement :
```bash
npm start
```

L'application sera disponible sur `http://localhost:3000`

## ⚙️ Configuration

Avant d'utiliser l'application, configurez votre clé API Google Gemini :

1. Créez un fichier `.env` à la racine du projet :
```bash
cp .env.example .env
```

2. Éditez le fichier `.env` et ajoutez votre clé API :
```
VITE_GEMINI_API_KEY=votre_clé_api_ici
```

Pour obtenir une clé API :
- Visitez [Google AI Studio](https://makersuite.google.com/app/apikey)
- Créez un compte ou connectez-vous
- Générez une nouvelle clé API
- Copiez-la dans votre fichier `.env`

**Important** : Le fichier `.env` est déjà dans `.gitignore` pour protéger votre clé API.

## 🎯 Utilisation

1. **Téléchargez une photo** : Cliquez sur la zone de chargement pour sélectionner une image de votre objet
2. **Choisissez le nombre d'images** : Utilisez le curseur pour sélectionner combien de mises en situation vous voulez (1-5)
3. **Générez l'annonce** : Cliquez sur "GÉNÉRER L'ANNONCE" pour lancer l'analyse IA
4. **Personnalisez** : Modifiez le titre, la description et le prix selon vos besoins
5. **Exportez** : Copiez les textes ou téléchargez les images pour votre annonce Leboncoin

## 📁 Structure du projet

```
labonneannonce/
├── public/
│   └── index.html          # Page HTML principale
├── src/
│   ├── App.jsx            # Composant principal React
│   ├── App.css            # Styles CSS et Tailwind
│   └── index.js           # Point d'entrée React
├── .env.example           # Exemple de configuration
├── package.json           # Dépendances et scripts
├── vite.config.js         # Configuration Vite
├── tailwind.config.js     # Configuration Tailwind CSS
└── README.md              # Documentation
```

## 🚀 Déploiement

Pour construire la version de production :

```bash
npm run build
```

Les fichiers de production seront générés dans le dossier `dist/`.

**Note** : Vite expose uniquement les variables d'environnement commençant par `VITE_` au code client. Assurez-vous de configurer la variable `VITE_GEMINI_API_KEY` dans votre environnement de production.

## 🤝 Contribuer

Les contributions sont les bienvenues ! N'hésitez pas à :

1. Forker le projet
2. Créer une branche pour votre fonctionnalité
3. Faire un commit de vos changements
4. Pousser vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 🐛 Support

Si vous rencontrez des problèmes :

- Vérifiez que votre clé API Gemini est correctement configurée
- Assurez-vous d'avoir une connexion internet stable
- Consultez la console du navigateur pour d'éventuelles erreurs

## 🔮 Roadmap

- [ ] Support d'autres plateformes (Facebook Marketplace, etc.)
- [ ] Mode multilingue
- [ ] Sauvegarde des annonces créées
- [ ] Templates d'annonces prédéfinis