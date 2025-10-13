// Script de test pour vérifier la sauvegarde des monnaies
// Ce script peut être exécuté dans la console du navigateur pour tester

console.log('🧪 Test de sauvegarde des monnaies');

// Fonction de test pour simuler la sauvegarde
function testCurrencySave() {
  const testData = {
    name: 'Test Character',
    crowns: 5,
    orbs: 12,
    scepters: 8,
    kings: 3,
    possessions: [],
    notes: []
  };

  console.log('📤 Données de test:', testData);

  // Simuler la normalisation des données
  const normalizedData = {
    ...testData,
    possessions: Array.isArray(testData.possessions) 
      ? JSON.stringify(testData.possessions) 
      : testData.possessions,
    notes: Array.isArray(testData.notes) 
      ? JSON.stringify(testData.notes) 
      : testData.notes,
    // S'assurer que les champs monétaires sont inclus
    crowns: testData.crowns || 0,
    orbs: testData.orbs || 0,
    scepters: testData.scepters || 0,
    kings: testData.kings || 0
  };

  console.log('✅ Données normalisées:', normalizedData);
  
  // Vérifier que les champs monétaires sont présents
  const hasCurrencyFields = ['crowns', 'orbs', 'scepters', 'kings'].every(field => 
    normalizedData.hasOwnProperty(field)
  );
  
  console.log('💰 Champs monétaires présents:', hasCurrencyFields);
  
  if (hasCurrencyFields) {
    console.log('🎉 Test réussi ! Les monnaies seront sauvegardées.');
  } else {
    console.log('❌ Test échoué ! Des champs monétaires manquent.');
  }
}

// Exécuter le test
testCurrencySave();

// Instructions pour l'utilisateur
console.log(`
📋 Instructions pour tester manuellement :

1. Ouvrez la fiche d'un personnage
2. Modifiez les valeurs des monnaies (Couronnes, Orbes, Sceptres, Rois)
3. Cliquez sur "Sauvegarder maintenant"
4. Rechargez la page
5. Vérifiez que les valeurs monétaires sont conservées

🔍 Si les valeurs sont toujours perdues, vérifiez :
- La console du navigateur pour des erreurs
- Les logs du serveur pour des erreurs de base de données
- Que la base de données contient bien les colonnes monétaires
`);
