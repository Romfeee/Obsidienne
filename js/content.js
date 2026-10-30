/* =====================================================================
   CONTENU — tout le texte du site est ici.
   *mot* = italique couleur.  stat: {n:nombre, pre:'', suf:''} ou {t:'texte'}
   theme : cane | vines | barrels | agave | agaveNight | frost | botanicals | vinesGold
   fx    : embers | dust | bubbles | snow | pollen
   rot   : amplitude de rotation (0.2 = bouteille anguleuse, 0.6 = bouteille ronde)
   ===================================================================== */
window.CONTACT = 'contact@exemple.fr';
window.PRODUCTS = [
 { key:'rhum', brand:'J. Bally', name:'J. Bally *7 ans*', cat:'Rhum agricole', origin:'Martinique',
   deg:'45°', vol:'70 cl', c:'#e7943a', s:.80, rot:.24, theme:'cane', fx:'embers',
   beats:[
    {k:'Origine', h:'Au pied de la *montagne Pelée*', p:'Fondée en 1917 par Jacques Bally au Carbet, la marque est l’une des signatures historiques du rhum agricole martiniquais.', stat:{n:1917,l:'Année de création'}},
    {k:'Le geste', h:'Le pur *jus de canne*', p:'Le rhum agricole naît du jus de canne fraîchement pressé, et non de mélasse. Fermenté, puis distillé en colonne créole, il est encadré par l’AOC Martinique.', stat:{t:'AOC',l:'Martinique'}},
    {k:'En bouche', h:'Sept ans de *chêne*', notes:['Fruits secs','Vanille','Cacao','Épices douces','Bois ciré'], serve:'À déguster pur, à température ambiante, dans un verre tulipe.', stat:{n:7,suf:' ans',l:'Vieillissement en fût'}},
   ]},
 { key:'cognac', brand:'Gautier', name:'Gautier *VS*', cat:'Cognac', origin:'Charente',
   deg:'40°', vol:'70 cl', c:'#36acd2', s:1, rot:.55, theme:'vines', fx:'dust',
   beats:[
    {k:'Origine', h:'Aigre, *depuis 1755*', p:'La Maison Gautier est installée à Aigre, au cœur de la région délimitée de Cognac, depuis plus de deux siècles et demi.', stat:{n:1755,l:'Fondation de la maison'}},
    {k:'Le geste', h:'La double *distillation*', p:'Les vins blancs d’ugni blanc passent deux fois par l’alambic charentais. L’eau-de-vie repose ensuite en fût de chêne.', stat:{n:2,suf:'×',l:'Passages à l’alambic'}},
    {k:'En bouche', h:'Vif et *fruité*', notes:['Fruits frais','Fleurs blanches','Vanille légère','Chêne doux'], serve:'Parfait en cocktail, ou allongé d’un tonic sur glace.', stat:{n:2,suf:' ans',l:'Minimum en fût (VS)'}},
   ]},
 { key:'whisky', brand:'Weller', name:'Weller *12 ans*', cat:'Bourbon', origin:'Kentucky',
   deg:'45°', vol:'70 cl', c:'#e8ad4a', s:1, rot:.5, theme:'barrels', fx:'embers',
   beats:[
    {k:'Origine', h:'Kentucky, *depuis 1849*', p:'William Larue Weller lance son whiskey à Louisville en 1849. On lui attribue l’idée de remplacer le seigle par le blé dans la recette.', stat:{n:1849,l:'Premier whiskey Weller'}},
    {k:'Le geste', h:'Le bourbon *au blé*', p:'Maïs, blé et orge maltée : le blé arrondit le profil là où le seigle apporte du piquant. Il vieillit en fûts de chêne neufs, brûlés à l’intérieur.', stat:{t:'Blé',l:'Au lieu du seigle'}},
    {k:'En bouche', h:'Douze ans de *patience*', notes:['Caramel','Miel','Vanille','Chêne toasté','Fruits mûrs'], serve:'Pur, ou sur un seul gros glaçon.', stat:{n:12,suf:' ans',l:'Vieillissement'}},
   ]},
 { key:'tequila', brand:'1800', name:'1800 *Añejo*', cat:'Tequila', origin:'Jalisco',
   deg:'38°', vol:'70 cl', c:'#d0702f', s:.86, rot:.26, theme:'agave', fx:'dust',
   beats:[
    {k:'Origine', h:'Un nom, *une date*', p:'Son nom rend hommage à l’année 1800, celle où, selon la maison, la tequila a été vieillie en fût pour la première fois.', stat:{n:1800,l:'L’année qui donne son nom'}},
    {k:'Le geste', h:'Cent pour cent *agave*', p:'L’agave bleu mûrit plusieurs années. Son cœur, la piña, est ensuite cuit, pressé, fermenté puis distillé.', stat:{n:100,suf:' %',l:'Agave bleu Weber'}},
    {k:'En bouche', h:'Le temps du *fût*', notes:['Caramel','Fruits secs','Vanille','Bois','Épices'], serve:'À siroter pur, avec un zeste d’orange.', stat:{n:1,suf:' an',l:'Minimum en fût (Añejo)'}},
   ]},
 { key:'mezcal', brand:'400 Conejos', name:'400 *Conejos*', cat:'Mezcal', origin:'Oaxaca',
   deg:'38°', vol:'70 cl', c:'#45b6dc', s:1.04, rot:.6, theme:'agaveNight', fx:'embers',
   beats:[
    {k:'Origine', h:'Les quatre cents *lapins*', p:'Dans la mythologie aztèque, les 400 lapins sont les enfants de Mayahuel, déesse de l’agave : les dieux de l’ivresse.', stat:{n:400,l:'Divinités de la fête'}},
    {k:'Le geste', h:'Le four de *terre*', p:'Les cœurs d’agave espadín cuisent plusieurs jours dans des fours creusés dans le sol, sur des pierres chauffées au bois. De là vient sa fumée.', stat:{t:'Espadín',l:'Variété d’agave'}},
    {k:'En bouche', h:'La fumée *douce*', notes:['Fumée','Agave cuit','Agrumes','Poivre','Herbes'], serve:'Pur, avec une tranche d’orange et du sel de ver.', stat:{t:'Joven',l:'Non vieilli'}},
   ]},
 { key:'vodka', brand:'Stoli', name:'Stoli *Elit*', cat:'Vodka', origin:'Ultra-premium',
   deg:'40°', vol:'70 cl', c:'#dfe6f0', s:1.08, rot:.55, theme:'frost', fx:'snow',
   beats:[
    {k:'Origine', h:'La cuvée *Elit*', p:'Elit est la cuvée la plus haute de la maison Stolichnaya, pensée pour être bue pure.', stat:{t:'Elit',l:'Cuvée ultra-premium'}},
    {k:'Le geste', h:'Filtrée *dans le froid*', p:'La vodka est refroidie à −18 °C avant filtration : les impuretés figent et se retirent mieux, pour une texture plus soyeuse.', stat:{n:18,pre:'−',suf:' °C',l:'Filtration à froid'}},
    {k:'En bouche', h:'La pureté, *simplement*', notes:['Texture soyeuse','Céréale douce','Pureté','Finale nette'], serve:'Servie glacée, dans un verre sorti du congélateur.', stat:{n:40,suf:'°',l:'Degré'}},
   ]},
 { key:'gin', brand:'Generous', name:'Generous *Purple*', cat:'Gin', origin:'France',
   deg:'44°', vol:'70 cl', c:'#c84282', s:.92, rot:.5, theme:'botanicals', fx:'pollen',
   beats:[
    {k:'Origine', h:'Un gin *français*', p:'Generous est un gin créé en France, reconnaissable entre tous à son flacon blanc couvert de motifs végétaux.', stat:{t:'France',l:'Pays d’origine'}},
    {k:'Le geste', h:'La baie de *raisin*', p:'La version Purple associe baie de raisin, poivre et pamplemousse aux botaniques du gin, à commencer par le genièvre.', stat:{n:3,l:'Botaniques signature'}},
    {k:'En bouche', h:'Fruité et *poivré*', notes:['Raisin','Pamplemousse','Poivre','Genièvre','Fleurs'], serve:'En gin tonic, avec quelques grains de raisin et un zeste de pamplemousse.', stat:{n:44,suf:'°',l:'Degré'}},
   ]},
 { key:'effervescent', brand:'Perlino', name:'Perlino *Prosecco*', cat:'Vin effervescent', origin:'Italie',
   deg:'11°', vol:'75 cl', c:'#dcbc58', s:1.02, rot:.55, theme:'vinesGold', fx:'bubbles',
   beats:[
    {k:'Origine', h:'Une maison *italienne*', p:'Perlino est une maison italienne fondée en 1905, spécialiste des vins effervescents et des apéritifs.', stat:{n:1905,l:'Fondation'}},
    {k:'Le geste', h:'Le cépage *glera*', p:'Le prosecco naît du cépage glera. Sa prise de mousse se fait en cuve close, ce qui garde la fraîcheur du fruit.', stat:{t:'Glera',l:'Cépage'}},
    {k:'En bouche', h:'Des bulles *fines*', notes:['Pomme verte','Poire','Fleurs blanches','Bulles fines'], serve:'Bien frais à l’apéritif, ou en spritz.', stat:{t:'Extra Dry',l:'Dosage'}},
   ]},
];
