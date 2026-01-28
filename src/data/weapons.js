// Données des armes et armures du jeu ARIA

export const MELEE_WEAPONS = [
  { name: "Bâton", usage: "À deux mains", damage: "1d6", price: "1 sceptre (10 rois)" },
  { name: "Bouclier", usage: "À une main", damage: "1d4", price: "6 orbes (600 rois)" },
  { name: "Canne", usage: "À une main", damage: "1d4", price: "1 sceptre (10 rois)" },
  { name: "Cimeterre", usage: "À une main", damage: "1d6+1", price: "1 couronne (1000 rois)" },
  { name: "Couteau", usage: "À une main", damage: "1d3", price: "2 orbes (200 rois)" },
  { name: "Dague", usage: "À une main", damage: "1d4", price: "3 orbes (300 rois)" },
  { name: "Épée", usage: "À une main", damage: "1d6+1", price: "1 couronne (1000 rois)" },
  { name: "Épée bâtarde", usage: "À une ou deux mains", damage: "1d6+2", price: "18 orbes (1800 rois)" },
  { name: "Épée courte", usage: "À une main", damage: "1d6", price: "8 orbes (800 rois)" },
  { name: "Épée à deux mains", usage: "À deux mains", damage: "2d6", price: "2 couronnes (2000 rois)" },
  { name: "Épieu", usage: "À une main", damage: "1d6", price: "2 orbes (200 rois)" },
  { name: "Espadon", usage: "À deux mains", damage: "2d6", price: "5 orbes (500 rois)" },
  { name: "Étoile du matin", usage: "À une main", damage: "1d6+2", price: "16 orbes (1600 rois)" },
  { name: "Filet", usage: "À une main", damage: "-", price: "7 orbes (700 rois)" },
  { name: "Fléau d'armes", usage: "À une main", damage: "1d6+2", price: "19 orbes (1900 rois)" },
  { name: "Fouet", usage: "À une main", damage: "1d3", price: "2 orbes (200 rois)" },
  { name: "Gourdin", usage: "À une main", damage: "1d6", price: "1 sceptre (10 rois)" },
  { name: "Hache", usage: "À une main", damage: "1d6+1", price: "5 orbes (500 rois)" },
  { name: "Hache de bataille", usage: "À une main", damage: "2d6", price: "13 orbes (1300 rois)" },
  { name: "Hachette", usage: "À une main", damage: "1d6", price: "3 orbes (300 rois)" },
  { name: "Hallebarde", usage: "À deux mains", damage: "3d6", price: "14 orbes (1400 rois)" },
  { name: "Harpon", usage: "À une main", damage: "1d8", price: "4 orbes (400 rois)" },
  { name: "Javelot", usage: "À une main", damage: "1d6+1", price: "3 orbes (300 rois)" },
  { name: "Lance", usage: "À une main", damage: "1d6+1", price: "2 orbes (200 rois)" },
  { name: "Masse", usage: "À une main", damage: "1d6+1", price: "6 orbes (600 rois)" },
  { name: "Marteau de guerre", usage: "À une main", damage: "2d6", price: "15 orbes (1500 rois)" },
  { name: "Pertuisane", usage: "À deux mains", damage: "1d6+2", price: "12 orbes (1200 rois)" },
  { name: "Pique", usage: "À deux mains", damage: "2d6", price: "2 orbes (200 rois)" },
  { name: "Poignard", usage: "À une main", damage: "1d3+2", price: "3 orbes (300 rois)" },
  { name: "Rapière", usage: "À une main", damage: "1d6", price: "13 orbes (1300 rois)" },
  { name: "Sabre", usage: "À une main", damage: "1d6+1", price: "9 orbes (900 rois)" }
];

export const RANGED_WEAPONS = [
  { name: "Arbalète", range: "50 m", damage: "2d6", price: "25 orbes (2500 rois)" },
  { name: "Carreaux d'arbalète (20)", range: "-", damage: "-", price: "2 orbes (200 rois)" },
  { name: "Arc", range: "150 m", damage: "1d6", price: "17 orbes (1700 rois)" },
  { name: "Flèches (20)", range: "-", damage: "-", price: "1 orbe (100 rois)" },
  { name: "Bola", range: "Force x 3 m", damage: "1d3", price: "5 orbes (500 rois)" },
  { name: "Dague (lancer)", range: "Force x 2 m", damage: "1d3+2", price: "3 orbes (300 rois)" },
  { name: "Fronde", range: "100 m", damage: "1d6", price: "1 orbe (100 rois)" },
  { name: "Javelot (lancer)", range: "Force x 3 m", damage: "1d6+1", price: "3 orbes (300 rois)" }
];

export const ARMORS = [
  { name: "Cuir souple", protection: 1, price: "3 orbes (300 rois)", malus: null },
  { name: "Cuir rigide", protection: 2, price: "1 couronne (1000 rois)", malus: null },
  { name: "Cuir et métal", protection: 4, price: "18 orbes (1800 rois)", malus: null },
  { name: "Cotte de mailles", protection: 6, price: "35 orbes (3500 rois)", malus: null },
  { name: "Armure de plaques", protection: 8, price: "5 couronnes (5000 rois)", malus: "-10% combat, esquive impossible" }
];

// Toutes les armes combinées pour le sélecteur
export const ALL_WEAPONS = [
  ...MELEE_WEAPONS.map(w => ({ ...w, type: 'melee' })),
  ...RANGED_WEAPONS.map(w => ({ ...w, type: 'ranged' }))
];

// Fonction utilitaire pour obtenir une arme par son nom
export function getWeaponByName(name) {
  return ALL_WEAPONS.find(w => w.name.toLowerCase() === name.toLowerCase());
}

// Fonction utilitaire pour obtenir une armure par son nom
export function getArmorByName(name) {
  return ARMORS.find(a => a.name.toLowerCase() === name.toLowerCase());
}
