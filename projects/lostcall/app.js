/**
 * LostCall - Mini Carnet de Secours Imprimable
 * Universal vCard / CSV Parser, Dynamic Micro-Layout Engine & OS Guides
 */

(function () {
  'use strict';

  // --- STATE ---
  const state = {
    contacts: [],
    filteredContacts: [],
    activeTab: 'generator', // 'generator' | 'tutorials'
    activeTutoOS: 'ios',
    zoom: 85,
    settings: {
      format: 'full', // 'full' | 'half' | 'quarter' | 'pocketmod'
      duplex: false,
      guides: true,
      fontSize: 6.5,
      cols: 'auto',
      fontFamily: 'condensed',
      density: 'tight',
      fields: {
        name: true,
        phone: true,
        otherPhones: true,
        email: false,
        org: false,
        address: false,
        note: true,
        bday: false
      },
      alphaHeaders: true,
      rowBorders: true,
      headerTitle: "CARNET DE SECOURS - RÉPERTOIRE D'URGENCE",
      headerSubtitle: "Propriétaire : ________________ | Tél d'urgence / ICE : ________________",
      searchQuery: ''
    }
  };

  // --- DEMO CONTACTS DATASET ---
  const DEMO_CONTACTS = [
    { name: "SAMU / Urgence Médicale", phone: "15", otherPhones: ["112 (Europe)"], note: "URGENCE VITALE 24/7", org: "Service Public", address: "", email: "", bday: "" },
    { name: "Police Secours", phone: "17", otherPhones: ["112"], note: "URGENCE 24/7", org: "Service Public", address: "", email: "", bday: "" },
    { name: "Pompiers", phone: "18", otherPhones: ["112"], note: "URGENCE 24/7", org: "Service Public", address: "", email: "", bday: "" },
    { name: "Centre Anti-Poison", phone: "01 40 05 48 48", otherPhones: ["04 72 11 69 11"], note: "Intoxication urgente", org: "Hôpital", address: "Paris", email: "", bday: "" },
    { name: "SOS Médecins", phone: "36 24", otherPhones: ["01 47 07 77 77"], note: "Visites à domicile 24/7", org: "Médical", address: "", email: "", bday: "" },
    { name: "Alain Bernard (Papa)", phone: "06 12 34 56 78", otherPhones: ["04 78 00 11 22 (Fixe)"], note: "ICE 1 - Groupe A+ - Clés maison", org: "Retraité", address: "14 rue des Lilas, Lyon", email: "alain.bernard@email.fr", bday: "1958-04-12" },
    { name: "Claire Bernard (Maman)", phone: "06 23 45 67 89", otherPhones: [], note: "ICE 2 - Clés maison", org: "", address: "14 rue des Lilas, Lyon", email: "claire.b@email.fr", bday: "1960-09-25" },
    { name: "Thomas Bernard (Frère)", phone: "06 34 56 78 90", otherPhones: ["09 50 12 34 56"], note: "Proche Lyon", org: "Ingénieur", address: "Villeurbanne", email: "thomas.b@gmail.com", bday: "1988-11-03" },
    { name: "Sophie Martin (Conjointe)", phone: "06 45 67 89 01", otherPhones: ["01 42 00 33 44 (Bureau)"], note: "CONTACT PRINCIPAL ICE - Groupe O-", org: "Architecte", address: "8 bd Voltaire, Paris", email: "sophie.martin@pro.fr", bday: "1992-06-18" },
    { name: "Dr. Lemoine (Généraliste)", phone: "01 43 55 12 34", otherPhones: [], note: "Médecin traitant", org: "Cabinet Médical", address: "12 av Parmentier, Paris", email: "secr.lemoine@doc.fr", bday: "" },
    { name: "Dr. Caron (Dentiste)", phone: "01 48 05 67 89", otherPhones: [], note: "Cabinet République", org: "Santé", address: "Paris 11", email: "", bday: "" },
    { name: "Pharmacie de Garde", phone: "32 37", otherPhones: ["01 45 88 12 00"], note: "Service 24/24", org: "Pharmacie Centrale", address: "Pl. Bastille", email: "", bday: "" },
    { name: "Assurance Habitation / Auto", phone: "09 69 39 39 39", otherPhones: [], note: "N° Contrat : AXA-88492049", org: "AXA Assistance", address: "", email: "sinistres@axa.fr", bday: "" },
    { name: "Banque Opposition Carte", phone: "09 69 58 28 58", otherPhones: ["08 92 70 57 05"], note: "Perte / vol CB 24/7", org: "Serveur Interbancaire", address: "", email: "", bday: "" },
    { name: "Plombier Urgence (Julien)", phone: "06 99 88 77 66", otherPhones: ["01 40 20 10 00"], note: "Artisan de confiance", org: "Dépannage 75", address: "Paris", email: "", bday: "" },
    { name: "Électricien (Marc)", phone: "06 77 66 55 44", otherPhones: [], note: "Recommandé syndic", org: "Volt Elec", address: "", email: "", bday: "" },
    { name: "Serrurier 24h", phone: "01 44 55 66 77", otherPhones: [], note: "Tarif conventionné assurance", org: "Serrurerie Express", address: "", email: "", bday: "" },
    { name: "Amélie Dubois", phone: "06 55 44 33 22", otherPhones: [], note: "Amie enfance", org: "Graphiste", address: "Bordeaux", email: "amelie.d@free.fr", bday: "1991-03-14" },
    { name: "Antoine Moreau", phone: "06 66 55 44 33", otherPhones: ["01 30 20 10 50"], note: "Coloc vacances", org: "Consultant", address: "Nantes", email: "antoine.moreau@live.com", bday: "" },
    { name: "Benoît Petit", phone: "06 11 22 33 44", otherPhones: [], note: "Collègue équipe", org: "Tech Solutions", address: "Paris", email: "bpetit@work.com", bday: "" },
    { name: "Camille Roussel", phone: "06 22 33 44 55", otherPhones: [], note: "Voisine palier - Clés secours", org: "", address: "Appt 3B", email: "camille.r@laposte.net", bday: "" },
    { name: "David Fontaine", phone: "06 33 44 55 66", otherPhones: ["04 67 00 99 88"], note: "Cousin", org: "Professeur", address: "Montpellier", email: "d.fontaine@univ.fr", bday: "" },
    { name: "École Primaire (Direction)", phone: "01 43 00 22 11", otherPhones: ["06 00 11 22 33 (Périscolaire)"], note: "Classe Hugo & Léa", org: "Éducation", address: "Rue Gambetta", email: "ecole.dir@ac-paris.fr", bday: "" },
    { name: "Emma Giraud", phone: "06 44 55 66 77", otherPhones: [], note: "Marraine Léa", org: "Avocate", address: "Lyon", email: "emma.g@cabinet.fr", bday: "" },
    { name: "Fabien Laurent", phone: "06 55 66 77 88", otherPhones: [], note: "Club de sport", org: "", address: "", email: "flaurent@mail.com", bday: "" },
    { name: "Garage Auto / Dépannage", phone: "01 48 33 22 11", otherPhones: ["06 10 20 30 40 (Dépanneuse)"], note: "Garagiste habituel", org: "Garage du Centre", address: "Av de la République", email: "", bday: "" },
    { name: "Hélène Mercier", phone: "06 66 77 88 99", otherPhones: [], note: "Tante", org: "Comptable", address: "Strasbourg", email: "helene.mercier@orange.fr", bday: "" },
    { name: "Julien Roche", phone: "06 77 88 99 00", otherPhones: [], note: "Pote musique", org: "", address: "Toulouse", email: "jroche@music.io", bday: "" },
    { name: "Kévin Leroy", phone: "06 88 99 00 11", otherPhones: [], note: "Voisin garage", org: "", address: "", email: "", bday: "" },
    { name: "Laura Sanchez", phone: "06 99 00 11 22", otherPhones: ["05 56 00 11 22"], note: "Amie fac", org: "Biologiste", address: "Bordeaux", email: "laura.s@labo.fr", bday: "" },
    { name: "Lucas Roux", phone: "06 10 20 30 41", otherPhones: [], note: "Parrain Hugo", org: "Journaliste", address: "Rennes", email: "l.roux@presse.fr", bday: "" },
    { name: "Mairie (Standard)", phone: "01 44 00 11 22", otherPhones: ["01 44 00 11 99 (État Civil)"], note: "Services municipaux", org: "Mairie 11e", address: "Pl. Léon Blum", email: "contact@mairie.fr", bday: "" },
    { name: "Nicolas Fournier", phone: "06 20 30 40 51", otherPhones: [], note: "Comptable perso", org: "Cabinet Conseil", address: "Paris", email: "n.fournier@fiduciaire.com", bday: "" },
    { name: "Nounou / Babysitter (Marie)", phone: "06 30 40 50 61", otherPhones: [], note: "Garde enfants mercredi / soir", org: "", address: "Rue Oberkampf", email: "marie.nounou@gmail.com", bday: "" },
    { name: "Olivier Girard", phone: "06 40 50 60 71", otherPhones: [], note: "Expert Informatique", org: "Indépendant", address: "", email: "olivier@girard.dev", bday: "" },
    { name: "Patricia Clement", phone: "06 50 60 70 81", otherPhones: [], note: "Grand-mère maternelle", org: "", address: "Nice", email: "", bday: "1938-12-05" },
    { name: "Syndic Immeuble (Urgence fuite)", phone: "01 53 00 99 88", otherPhones: ["08 00 12 34 56 (Astreinte)"], note: "Réf Immeuble: BAT-C-75", org: "Foncia Syndic", address: "", email: "syndic@foncia.fr", bday: "" },
    { name: "Taxi G7 / Réservation", phone: "36 07", otherPhones: ["01 47 39 47 39"], note: "G7 Taxi Paris", org: "Transport", address: "", email: "", bday: "" },
    { name: "Vétérinaire (Clinique 24/24)", phone: "01 42 55 44 33", otherPhones: ["06 12 99 88 77 (Astreinte)"], note: "Chat 'Milo' carnet santé", org: "Clinique Vétérinaire", address: "24 bd Voltaire", email: "veto.bastille@vet.fr", bday: "" }
  ];

  // --- OS EXPORT GUIDES CONTENT (with visual UI mockups) ---
  const TUTORIALS = {
    ios: {
      title: "iPhone / iPad (iOS)",
      badge: "Apple Contacts",
      color: "blue",
      summary: "Sur iPhone moderne (iOS 16, 17, 18+), vous pouvez exporter tous vos contacts en 3 clics directement depuis l'application Contacts, sans ordinateur.",
      diagram: `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-6 justify-center">
          <div class="w-48 bg-slate-900 border-2 border-slate-700 rounded-3xl p-3 shadow-xl relative text-[10px]">
            <!-- Notch -->
            <div class="w-16 h-3 bg-slate-950 rounded-full mx-auto mb-2"></div>
            <!-- Header -->
            <div class="flex items-center justify-between text-blue-400 font-medium mb-2 border-b border-slate-800 pb-1">
              <span class="flex items-center gap-0.5"><span class="text-xs">&lt;</span> Listes</span>
              <span class="text-white font-bold">Contacts</span>
              <span class="text-blue-400">+</span>
            </div>
            <!-- Lists -->
            <div class="space-y-1.5 py-1">
              <div class="bg-slate-800/80 p-2 rounded-lg border border-slate-700 flex justify-between items-center text-slate-400">
                <span>iCloud</span>
                <span>45</span>
              </div>
              <div class="bg-blue-600/20 border-2 border-blue-500 p-2 rounded-lg flex justify-between items-center text-blue-300 font-bold animate-pulse">
                <span>Tous les contacts</span>
                <span>45</span>
              </div>
            </div>
            <!-- Long press menu overlay -->
            <div class="mt-2 bg-slate-800 border border-slate-600 rounded-lg p-1.5 shadow-2xl text-[9px] space-y-1">
              <div class="text-slate-400 py-0.5 px-1">Envoyer un message</div>
              <div class="text-slate-400 py-0.5 px-1">Envoyer un e-mail</div>
              <div class="bg-blue-600 text-white font-bold py-1 px-1.5 rounded flex items-center justify-between">
                <span>➔ Exporter...</span>
                <span class="text-[8px] bg-blue-800 px-1 rounded">vCard</span>
              </div>
            </div>
          </div>
          <div class="text-xs text-slate-300 space-y-2 max-w-sm">
            <div class="font-bold text-white text-sm">Action sur l'écran :</div>
            <p>1. Touchez <strong class="text-blue-400">&lt; Listes</strong> en haut à gauche.</p>
            <p>2. Faites un <strong>appui long</strong> avec le doigt sur <strong>"Tous les contacts"</strong>.</p>
            <p>3. Touchez <strong>"Exporter"</strong> dans le menu contextuel noir.</p>
            <p class="text-[11px] text-emerald-400">✓ Vous obtenez un fichier <code>.vcf</code> prêt à être glissé dans LostCall.</p>
          </div>
        </div>
      `,
      steps: [
        {
          num: 1,
          title: "Ouvrez l'application 'Contacts' officielle d'Apple",
          desc: "Si vous êtes dans l'application Téléphone, touchez l'onglet 'Contacts' au milieu, ou ouvrez l'application dédiée 'Contacts' sur votre écran d'accueil."
        },
        {
          num: 2,
          title: "Affichez vos 'Listes' en haut à gauche",
          desc: "En haut à gauche de l'écran, appuyez sur <strong class='text-blue-400'>&lt; Listes</strong> (ou Groupes) pour voir l'ensemble de vos répertoires."
        },
        {
          num: 3,
          title: "Maintenez le doigt sur 'Tous les contacts' (Appui long)",
          desc: "Faites un appui long avec votre doigt sur la ligne <strong>'Tous les contacts'</strong> (ou 'Tous les iCloud'). Un menu contextuel apparaît."
        },
        {
          num: 4,
          title: "Touchez 'Exporter' puis partagez le fichier .vcf",
          desc: "Dans le menu, choisissez <strong>'Exporter'</strong>. Choisissez ensuite <strong>'Enregistrer dans Fichiers'</strong> ou envoyez-le par AirDrop / Email sur cet appareil."
        }
      ],
      altMethod: "<strong>Astuce alternative via Mac ou PC :</strong> Rendez-vous sur <a href='https://www.icloud.com/contacts' target='_blank' class='text-blue-400 underline'>iCloud.com/contacts</a>, connectez-vous, faites <kbd class='px-1 bg-slate-800 rounded'>Ctrl+A</kbd> ou <kbd class='px-1 bg-slate-800 rounded'>Cmd+A</kbd>, cliquez sur l'icône de partage/roue crantée en bas à gauche, puis cliquez sur <strong>'Exporter la vCard'</strong>."
    },
    android: {
      title: "Android (Samsung, Xiaomi, Google Pixel, Motorola...)",
      badge: "Google Contacts",
      color: "emerald",
      summary: "Tous les smartphones Android intègrent une fonction d'export direct vers un fichier .vcf standard.",
      diagram: `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-6 justify-center">
          <div class="w-48 bg-slate-900 border-2 border-slate-700 rounded-3xl p-3 shadow-xl relative text-[10px]">
            <!-- Camera punch hole -->
            <div class="w-3 h-3 bg-slate-950 rounded-full mx-auto mb-2"></div>
            <!-- Google Contacts Header -->
            <div class="flex items-center justify-between text-slate-300 font-bold mb-2 pb-1 border-b border-slate-800">
              <span class="text-emerald-400">Contacts</span>
              <div class="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center text-[8px] text-white">G</div>
            </div>
            <!-- Menu items -->
            <div class="space-y-1.5 py-1">
              <div class="bg-slate-800/60 p-2 rounded text-slate-400 flex items-center gap-1.5">
                <span>⚙</span> <span>Paramètres</span>
              </div>
              <div class="bg-emerald-600/20 border-2 border-emerald-500 p-2 rounded flex items-center justify-between text-emerald-300 font-bold animate-pulse">
                <span class="flex items-center gap-1.5"><span>💾</span> Exporter</span>
                <span class="text-[8px] bg-emerald-950 text-emerald-400 px-1 rounded">.VCF</span>
              </div>
              <div class="bg-slate-800/60 p-2 rounded text-slate-400 flex items-center gap-1.5">
                <span>🔄</span> <span>Importer</span>
              </div>
            </div>
            <!-- Bottom Navigation Bar -->
            <div class="mt-4 pt-1.5 border-t border-slate-800 flex justify-around text-[8px] text-slate-400">
              <span>Contacts</span>
              <span>Favoris</span>
              <span class="text-emerald-400 font-bold">Organiser ★</span>
            </div>
          </div>
          <div class="text-xs text-slate-300 space-y-2 max-w-sm">
            <div class="font-bold text-white text-sm">Action sur l'écran :</div>
            <p>1. Ouvrez l'application <strong>Contacts</strong>.</p>
            <p>2. Touchez l'onglet <strong class="text-emerald-400">'Organiser'</strong> (ou 'Réparer et gérer' en bas à droite).</p>
            <p>3. Appuyez sur <strong>'Exporter vers un fichier'</strong>.</p>
            <p class="text-[11px] text-emerald-400">✓ Enregistrez le fichier <code>contacts.vcf</code> dans vos Téléchargements.</p>
          </div>
        </div>
      `,
      steps: [
        {
          num: 1,
          title: "Ouvrez l'application 'Contacts' de Google",
          desc: "Lancez l'application avec l'icône bleue de bonhomme blanc. Si vous avez un Samsung, ouvrez l'app 'Contacts' de Samsung."
        },
        {
          num: 2,
          title: "Allez dans l'onglet 'Organiser' (ou 'Réparer et gérer')",
          desc: "En bas à droite de l'écran, appuyez sur l'onglet <strong class='text-emerald-400'>'Organiser'</strong> (sur certaines versions Android, c'est nommé <em>'Réparer et gérer'</em>, ou le menu burger ☰ en haut à gauche)."
        },
        {
          num: 3,
          title: "Sélectionnez 'Exporter vers un fichier'",
          desc: "Dans la liste d'outils, appuyez sur <strong>'Exporter vers un fichier'</strong>. Sélectionnez le compte Google contenant vos contacts si demandé."
        },
        {
          num: 4,
          title: "Enregistrez le fichier contacts.vcf",
          desc: "Appuyez sur <strong>'Exporter vers un fichier .vcf'</strong> et choisissez votre dossier Téléchargements. Vous pouvez ensuite glisser directement ce fichier dans LostCall !"
        }
      ],
      altMethod: "<strong>Astuce Samsung Galaxy :</strong> Ouvrez 'Contacts' Samsung &gt; Menu ☰ &gt; 'Gestion des contacts' &gt; 'Importer ou exporter des contacts' &gt; 'Exporter' &gt; 'Stockage interne'."
    },
    google: {
      title: "Google Contacts (Navigateur Web)",
      badge: "Web universel",
      color: "amber",
      summary: "Si vos contacts sont synchronisés avec votre compte Gmail / Google, c'est la méthode la plus rapide depuis un ordinateur.",
      diagram: `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-6 justify-center">
          <div class="w-64 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-[10px]">
            <!-- Browser top bar -->
            <div class="flex items-center gap-1.5 border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <span class="w-2 h-2 rounded-full bg-red-500"></span>
              <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
              <span class="w-2 h-2 rounded-full bg-green-500"></span>
              <span class="ml-2 font-mono text-[9px] text-slate-300">contacts.google.com</span>
            </div>
            <!-- Fake web layout -->
            <div class="flex gap-2">
              <div class="w-20 border-r border-slate-800 pr-1 space-y-1 text-slate-400 text-[9px]">
                <div class="text-white font-medium">Contacts</div>
                <div>Fréquents</div>
                <div class="bg-amber-600/20 text-amber-300 font-bold p-1 rounded border border-amber-500 animate-pulse">➔ Exporter</div>
                <div>Imprimer</div>
              </div>
              <div class="flex-1 bg-slate-950/80 p-2 rounded border border-slate-800 text-[8px] space-y-1">
                <div class="font-bold text-white text-[9px]">Exporter les contacts</div>
                <div class="text-slate-400">Exporter sous :</div>
                <div class="bg-amber-500/20 border border-amber-500 text-amber-300 p-1 rounded font-bold">
                  ◉ vCard (pour iOS et autres)
                </div>
                <div class="text-slate-500">○ CSV Google</div>
                <div class="text-right pt-1">
                  <span class="bg-amber-500 text-slate-950 px-2 py-0.5 rounded font-bold">Exporter</span>
                </div>
              </div>
            </div>
          </div>
          <div class="text-xs text-slate-300 space-y-2 max-w-sm">
            <div class="font-bold text-white text-sm">Action sur l'écran :</div>
            <p>1. Allez sur <strong>contacts.google.com</strong>.</p>
            <p>2. Cliquez sur <strong class="text-amber-400">Exporter</strong> dans la colonne de gauche.</p>
            <p>3. Sélectionnez <strong>'vCard'</strong> (ou CSV).</p>
            <p>4. Cliquez sur <strong>'Exporter'</strong> pour télécharger le fichier.</p>
          </div>
        </div>
      `,
      steps: [
        {
          num: 1,
          title: "Rendez-vous sur contacts.google.com",
          desc: "Ouvrez votre navigateur web et accédez à <a href='https://contacts.google.com' target='_blank' class='text-amber-400 underline font-medium'>contacts.google.com</a> avec votre compte Google connecté."
        },
        {
          num: 2,
          title: "Cliquez sur 'Exporter' dans la colonne de gauche",
          desc: "Dans le menu latéral gauche (ou sous l'icône de téléchargement en haut à droite), cliquez sur le bouton <strong>'Exporter'</strong>."
        },
        {
          num: 3,
          title: "Choisissez le format vCard",
          desc: "Dans la fenêtre pop-up, vérifiez que 'Tous les contacts' est coché, puis sélectionnez <strong class='text-amber-400'>'vCard (pour les contacts iOS et autres)'</strong> (ou CSV Google, les deux sont acceptés par LostCall)."
        },
        {
          num: 4,
          title: "Téléchargez le fichier et glissez-le dans LostCall",
          desc: "Cliquez sur <strong>'Exporter'</strong>. Le fichier <code>contacts.vcf</code> se télécharge instantanément."
        }
      ],
      altMethod: "<strong>Conseil :</strong> Si vous avez des doublons dans Google Contacts, vous pouvez cliquer sur 'Nettoyer et corriger' avant d'exporter pour avoir un carnet ultra-propre."
    },
    mac: {
      title: "Mac (macOS Contacts)",
      badge: "Application Contacts Apple",
      color: "slate",
      summary: "Sur Mac, l'application Contacts intégrée permet d'exporter la totalité du carnet en un fichier vCard unique en 2 secondes.",
      diagram: `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-6 justify-center">
          <div class="w-64 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-[10px]">
            <!-- macOS Window Bar -->
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                <span class="w-2 h-2 rounded-full bg-yellow-500"></span>
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
              </div>
              <span class="font-bold text-white text-[9px]">Fichier &gt; Exporter &gt; Exporter la vCard...</span>
              <span></span>
            </div>
            <!-- Menu simulation -->
            <div class="space-y-1 text-[9px]">
              <div class="bg-slate-800 text-slate-400 px-2 py-1 rounded flex justify-between">
                <span>Tout sélectionner</span>
                <span class="font-mono text-slate-500">⌘A</span>
              </div>
              <div class="bg-emerald-600 text-white font-bold px-2 py-1.5 rounded flex justify-between items-center shadow animate-pulse">
                <span>➔ Exporter la vCard...</span>
                <span class="text-[8px] bg-emerald-800 px-1 rounded">.vcf</span>
              </div>
            </div>
          </div>
          <div class="text-xs text-slate-300 space-y-2 max-w-sm">
            <div class="font-bold text-white text-sm">Action sur l'écran :</div>
            <p>1. Ouvrez l'app <strong>Contacts</strong> sur Mac.</p>
            <p>2. Appuyez sur <kbd class="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-white font-mono">⌘ + A</kbd> pour tout sélectionner.</p>
            <p>3. Menu <strong class="text-emerald-400">Fichier &gt; Exporter &gt; Exporter la vCard...</strong></p>
          </div>
        </div>
      `,
      steps: [
        {
          num: 1,
          title: "Lancez l'application Contacts",
          desc: "Ouvrez 'Contacts' depuis Spotlight (<kbd class='px-1 bg-slate-800 rounded'>Cmd+Espace</kbd>) ou depuis le dossier Applications."
        },
        {
          num: 2,
          title: "Sélectionnez tous les contacts",
          desc: "Cliquez sur 'Tous les contacts' dans la barre latérale, puis appuyez sur <kbd class='px-1 bg-slate-800 rounded text-slate-200'>Cmd + A</kbd> pour tout sélectionner."
        },
        {
          num: 3,
          title: "Menu Fichier > Exporter > Exporter la vCard...",
          desc: "Dans la barre de menus tout en haut de l'écran, cliquez sur <strong>Fichier</strong>, puis <strong>Exporter</strong>, et choisissez <strong>'Exporter la vCard...'</strong>."
        },
        {
          num: 4,
          title: "Enregistrez le fichier sur votre Bureau",
          desc: "Donnez un nom à votre fichier (ex: <code>Mes_Contacts.vcf</code>) et enregistrez-le, puis déposez-le dans LostCall."
        }
      ],
      altMethod: "<strong>Raccourci rapide :</strong> Vous pouvez aussi simplement glisser-déposer le groupe 'Tous les contacts' depuis la barre latérale de Contacts directement sur le site LostCall !"
    },
    windows: {
      title: "Windows / Microsoft Outlook",
      badge: "Outlook & Windows Contacts",
      color: "sky",
      summary: "Si vos contacts sont stockés dans Microsoft Outlook (Web ou application de bureau) ou l'application Contacts de Windows.",
      diagram: `
        <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center gap-6 justify-center">
          <div class="w-64 bg-slate-900 border border-slate-700 rounded-xl p-3 shadow-xl text-[10px]">
            <div class="flex items-center justify-between border-b border-slate-800 pb-2 mb-2 text-slate-400">
              <span class="text-sky-400 font-bold text-[9px]">Outlook Contacts</span>
              <span class="text-slate-500">outlook.live.com</span>
            </div>
            <div class="space-y-1.5">
              <div class="flex justify-between items-center bg-slate-800 p-1.5 rounded text-[9px]">
                <span>Gérer les contacts</span>
                <span class="text-sky-400">▼</span>
              </div>
              <div class="bg-sky-600/20 border-2 border-sky-500 text-sky-200 font-bold p-1.5 rounded text-[9px] flex justify-between items-center animate-pulse">
                <span>➔ Exporter les contacts</span>
                <span class="text-[8px] bg-sky-950 text-sky-400 px-1 rounded">CSV</span>
              </div>
            </div>
          </div>
          <div class="text-xs text-slate-300 space-y-2 max-w-sm">
            <div class="font-bold text-white text-sm">Action sur l'écran :</div>
            <p>1. Connectez-vous sur <strong>outlook.live.com</strong> ou <strong>office.com</strong>.</p>
            <p>2. Cliquez sur l'onglet Contacts &gt; <strong>'Gérer les contacts'</strong>.</p>
            <p>3. Cliquez sur <strong class="text-sky-400">'Exporter les contacts'</strong>.</p>
            <p class="text-[11px] text-sky-400">✓ Le fichier CSV généré est 100% compatible avec LostCall.</p>
          </div>
        </div>
      `,
      steps: [
        {
          num: 1,
          title: "Ouvrez Outlook sur le web (outlook.live.com ou office.com)",
          desc: "Connectez-vous à votre messagerie Outlook et cliquez sur l'icône bleue des personnes / contacts à gauche."
        },
        {
          num: 2,
          title: "Cliquez sur 'Gérer les contacts' en haut à droite",
          desc: "Dans le ruban supérieur, cliquez sur le bouton <strong class='text-sky-400'>'Gérer les contacts'</strong> puis choisissez <strong>'Exporter les contacts'</strong>."
        },
        {
          num: 3,
          title: "Choisissez 'Tous les contacts'",
          desc: "Sélectionnez l'option pour exporter tous les contacts du dossier et cliquez sur <strong>'Exporter'</strong>."
        },
        {
          num: 4,
          title: "Déposez le fichier .csv obtenu dans LostCall",
          desc: "Le fichier CSV produit par Outlook est automatiquement reconnu et interprété par le moteur de LostCall."
        }
      ],
      altMethod: "<strong>Outlook de bureau classique :</strong> Fichier &gt; Ouvrir et exporter &gt; Importer/Exporter &gt; Exporter des données vers un fichier &gt; Valeurs séparées par des virgules (CSV)."
    }
  };

  // --- INITIALIZATION ---
  function init() {
    setupDomListeners();
    renderTutorial('ios');
    // Preload demo contacts by default so the user immediately sees a live result
    loadContactsArray(DEMO_CONTACTS, "Exemple_Carnet_Secours.vcf");
  }

  // --- EVENT LISTENERS ---
  function setupDomListeners() {
    // Top Tabs
    document.getElementById('tab-btn-generator').addEventListener('click', () => switchTab('generator'));
    document.getElementById('tab-btn-tutorials').addEventListener('click', () => switchTab('tutorials'));
    document.getElementById('tuto-back-btn').addEventListener('click', () => switchTab('generator'));

    // Print Buttons
    document.getElementById('print-main-btn').addEventListener('click', handlePrint);
    document.getElementById('print-sheet-btn').addEventListener('click', handlePrint);

    // Load Demo button
    document.getElementById('load-demo-btn').addEventListener('click', () => {
      loadContactsArray(DEMO_CONTACTS, "Exemple_Carnet_Secours.vcf");
    });

    // File Drop & Input
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('border-emerald-400', 'bg-emerald-950/20');
    });
    dropZone.addEventListener('dragleave', () => {
      dropZone.classList.remove('border-emerald-400', 'bg-emerald-950/20');
    });
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('border-emerald-400', 'bg-emerald-950/20');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        processUploadedFile(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        processUploadedFile(e.target.files[0]);
      }
    });

    document.getElementById('clear-file-btn').addEventListener('click', () => {
      loadContactsArray([], '');
      document.getElementById('file-status').classList.add('hidden');
      document.getElementById('drop-zone').classList.remove('hidden');
    });

    // Layout Formats (A4, 1/2, 1/4, PocketMod)
    document.querySelectorAll('.format-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.format-btn').forEach(b => b.classList.remove('active', 'border-emerald-500/50', 'bg-emerald-500/10'));
        btn.classList.add('active', 'border-emerald-500/50', 'bg-emerald-500/10');
        state.settings.format = btn.dataset.format;
        updateLayoutBadge();
        renderSheets();
      });
    });

    // Recto-Verso toggle
    document.getElementById('duplex-toggle').addEventListener('change', (e) => {
      state.settings.duplex = e.target.checked;
      renderSheets();
    });

    // Guides toggle
    document.getElementById('guides-toggle').addEventListener('change', (e) => {
      state.settings.guides = e.target.checked;
      renderSheets();
    });

    // Font size slider (can go down very low, from 4pt to 11pt)
    const fontSizeSlider = document.getElementById('font-size-slider');
    fontSizeSlider.addEventListener('input', (e) => {
      const val = parseFloat(e.target.value);
      state.settings.fontSize = val;
      document.getElementById('font-size-val').textContent = val + ' pt';
      document.getElementById('font-size-badge').textContent = val + ' pt';
      renderSheets();
    });

    // Columns buttons
    document.querySelectorAll('.col-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.col-btn').forEach(b => {
          b.classList.remove('active', 'bg-cyan-600', 'text-white', 'font-bold');
          b.classList.add('bg-slate-800', 'text-slate-300');
        });
        btn.classList.add('active', 'bg-cyan-600', 'text-white', 'font-bold');
        btn.classList.remove('bg-slate-800', 'text-slate-300');
        state.settings.cols = btn.dataset.cols === 'auto' ? 'auto' : parseInt(btn.dataset.cols, 10);
        document.getElementById('cols-val').textContent = btn.dataset.cols === 'auto' ? 'Automatique' : btn.dataset.cols + ' colonnes';
        renderSheets();
      });
    });

    // Font family buttons
    document.querySelectorAll('.font-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.font-btn').forEach(b => {
          b.classList.remove('active', 'bg-slate-800', 'border-emerald-500', 'text-emerald-300');
          b.classList.add('bg-slate-900', 'border-slate-800', 'text-slate-400');
        });
        btn.classList.add('active', 'bg-slate-800', 'border-emerald-500', 'text-emerald-300');
        btn.classList.remove('bg-slate-900', 'border-slate-800', 'text-slate-400');
        state.settings.fontFamily = btn.dataset.font;
        renderSheets();
      });
    });

    // Density buttons
    document.querySelectorAll('.density-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.density-btn').forEach(b => {
          b.classList.remove('active', 'text-emerald-300', 'bg-slate-800', 'border-emerald-500/50');
          b.classList.add('text-slate-400', 'bg-slate-900', 'border-slate-800');
        });
        btn.classList.add('active', 'text-emerald-300', 'bg-slate-800', 'border-emerald-500/50');
        btn.classList.remove('text-slate-400', 'bg-slate-900', 'border-slate-800');
        state.settings.density = btn.dataset.density;
        renderSheets();
      });
    });

    // Field toggles
    document.querySelectorAll('.field-toggle').forEach(chk => {
      chk.addEventListener('change', () => {
        state.settings.fields.phone = document.getElementById('field-phone').checked;
        state.settings.fields.otherPhones = document.getElementById('field-other-phones').checked;
        state.settings.fields.email = document.getElementById('field-email').checked;
        state.settings.fields.org = document.getElementById('field-org').checked;
        state.settings.fields.address = document.getElementById('field-address').checked;
        state.settings.fields.note = document.getElementById('field-note').checked;
        state.settings.fields.bday = document.getElementById('field-bday').checked;
        renderSheets();
      });
    });

    // Preset Minimal (Only Name & Phone)
    document.getElementById('preset-minimal-btn').addEventListener('click', () => {
      document.getElementById('field-phone').checked = true;
      document.getElementById('field-other-phones').checked = false;
      document.getElementById('field-email').checked = false;
      document.getElementById('field-org').checked = false;
      document.getElementById('field-address').checked = false;
      document.getElementById('field-note').checked = false;
      document.getElementById('field-bday').checked = false;
      state.settings.fields = {
        name: true,
        phone: true,
        otherPhones: false,
        email: false,
        org: false,
        address: false,
        note: false,
        bday: false
      };
      renderSheets();
    });

    // Alpha headers & Borders toggles
    document.getElementById('opt-alpha-headers').addEventListener('change', (e) => {
      state.settings.alphaHeaders = e.target.checked;
      renderSheets();
    });
    document.getElementById('opt-row-borders').addEventListener('change', (e) => {
      state.settings.rowBorders = e.target.checked;
      renderSheets();
    });

    // Headers text
    document.getElementById('header-title-input').addEventListener('input', (e) => {
      state.settings.headerTitle = e.target.value;
      renderSheets();
    });
    document.getElementById('header-subtitle-input').addEventListener('input', (e) => {
      state.settings.headerSubtitle = e.target.value;
      renderSheets();
    });

    // Search query
    document.getElementById('search-contact-input').addEventListener('input', (e) => {
      state.settings.searchQuery = e.target.value.toLowerCase().trim();
      applyFilter();
      renderSheets();
    });

    // Zoom controls
    document.getElementById('zoom-in-btn').addEventListener('click', () => adjustZoom(5));
    document.getElementById('zoom-out-btn').addEventListener('click', () => adjustZoom(-5));
    document.getElementById('zoom-fit-btn').addEventListener('click', () => setZoom(85));

    // Tutorials OS buttons
    document.querySelectorAll('.tuto-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tuto-tab-btn').forEach(b => {
          b.classList.remove('active', 'border-blue-500', 'bg-blue-500/10', 'text-white');
          b.classList.add('border-slate-800', 'bg-slate-900/60', 'text-slate-300');
        });
        btn.classList.add('active', 'border-blue-500', 'bg-blue-500/10', 'text-white');
        btn.classList.remove('border-slate-800', 'bg-slate-900/60', 'text-slate-300');
        renderTutorial(btn.dataset.os);
      });
    });

    // Close fold hint
    document.getElementById('close-fold-help').addEventListener('click', () => {
      document.getElementById('pocket-fold-help').classList.add('hidden');
    });
  }

  // --- TAB SWITCHING ---
  function switchTab(tab) {
    state.activeTab = tab;
    const viewGen = document.getElementById('view-generator');
    const viewTuto = document.getElementById('view-tutorials');
    const tabGen = document.getElementById('tab-btn-generator');
    const tabTuto = document.getElementById('tab-btn-tutorials');

    if (tab === 'generator') {
      viewGen.classList.remove('hidden');
      viewTuto.classList.add('hidden');
      tabGen.className = "px-3.5 py-1.5 rounded-lg font-medium transition-all text-white bg-slate-800 shadow-sm flex items-center gap-2";
      tabTuto.className = "px-3.5 py-1.5 rounded-lg font-medium transition-all text-slate-400 hover:text-slate-200 flex items-center gap-2";
    } else {
      viewGen.classList.add('hidden');
      viewTuto.classList.remove('hidden');
      tabTuto.className = "px-3.5 py-1.5 rounded-lg font-medium transition-all text-white bg-slate-800 shadow-sm flex items-center gap-2";
      tabGen.className = "px-3.5 py-1.5 rounded-lg font-medium transition-all text-slate-400 hover:text-slate-200 flex items-center gap-2";
    }
  }

  // --- ZOOM HANDLING ---
  function adjustZoom(delta) {
    setZoom(Math.max(30, Math.min(150, state.zoom + delta)));
  }

  function setZoom(val) {
    state.zoom = val;
    document.getElementById('zoom-val').textContent = val + '%';
    const container = document.getElementById('sheets-container');
    container.style.transform = `scale(${val / 100})`;
  }

  // --- FILE PROCESSING ---
  function processUploadedFile(file) {
    const reader = new FileReader();
    const fileName = file.name;
    const ext = fileName.split('.').pop().toLowerCase();

    reader.onload = function (e) {
      const text = e.target.result;
      let parsed = [];
      if (ext === 'vcf' || ext === 'vcard' || text.includes('BEGIN:VCARD')) {
        parsed = parseVCF(text);
      } else if (ext === 'csv' || text.includes(',') || text.includes(';')) {
        parsed = parseCSV(text);
      } else {
        alert("Format non reconnu. Veuillez déposer un fichier .vcf (vCard) ou .csv.");
        return;
      }

      if (parsed.length === 0) {
        alert("Aucun contact trouvé dans le fichier. Vérifiez le format d'exportation.");
        return;
      }

      loadContactsArray(parsed, fileName);
    };

    reader.readAsText(file);
  }

  function loadContactsArray(arr, filename) {
    state.contacts = arr;
    applyFilter();

    const countBadge = document.getElementById('contact-count-badge');
    countBadge.textContent = arr.length + (arr.length > 1 ? ' contacts' : ' contact');

    const fileStatus = document.getElementById('file-status');
    const dropZone = document.getElementById('drop-zone');
    const fileNameEl = document.getElementById('file-name');

    if (filename) {
      fileStatus.classList.remove('hidden');
      dropZone.classList.add('hidden');
      fileNameEl.textContent = filename + ` (${arr.length} contacts)`;
    } else {
      fileStatus.classList.add('hidden');
      dropZone.classList.remove('hidden');
    }

    renderSheets();
  }

  function applyFilter() {
    const q = state.settings.searchQuery;
    if (!q) {
      state.filteredContacts = [...state.contacts];
      document.getElementById('filtered-stats').textContent = `Tous inclus (${state.contacts.length})`;
    } else {
      state.filteredContacts = state.contacts.filter(c => {
        return (c.name && c.name.toLowerCase().includes(q)) ||
          (c.phone && c.phone.toLowerCase().includes(q)) ||
          (c.note && c.note.toLowerCase().includes(q)) ||
          (c.org && c.org.toLowerCase().includes(q));
      });
      document.getElementById('filtered-stats').textContent = `${state.filteredContacts.length} / ${state.contacts.length}`;
    }
    // Sort alphabetically by name
    state.filteredContacts.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'fr', { sensitivity: 'base' }));
  }

  // --- VCARD (VCF) PARSER (vCard 2.1, 3.0, 4.0) ---
  function parseVCF(vcfText) {
    // Unfold multi-line entries (lines starting with space or tab)
    const unfolded = vcfText.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
    const cards = unfolded.split(/BEGIN:VCARD/i);
    const result = [];

    for (let rawCard of cards) {
      if (!rawCard.includes('END:VCARD')) continue;
      const lines = rawCard.split(/\r?\n/);

      let name = '';
      let phones = [];
      let email = '';
      let org = '';
      let note = '';
      let address = '';
      let bday = '';

      for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // Quoted-Printable decoding if present
        if (line.includes('ENCODING=QUOTED-PRINTABLE')) {
          line = decodeQuotedPrintable(line);
        }

        const colonIdx = line.indexOf(':');
        if (colonIdx === -1) continue;
        const keyPart = line.substring(0, colonIdx).toUpperCase();
        let valPart = line.substring(colonIdx + 1).trim();

        // Decode escaped characters (\, \n, \;)
        valPart = valPart.replace(/\\n/gi, ' ').replace(/\\,/g, ',').replace(/\\;/g, ';');

        if (keyPart.startsWith('FN')) {
          name = valPart;
        } else if (!name && keyPart.startsWith('N')) {
          // N:Nom;Prénom;Deuxième;Titre;Suffixe
          const parts = valPart.split(';').filter(p => p.trim());
          if (parts.length >= 2) {
            name = (parts[1] + ' ' + parts[0]).trim();
          } else if (parts.length === 1) {
            name = parts[0].trim();
          }
        } else if (keyPart.startsWith('TEL')) {
          const cleanPhone = valPart.replace(/[^\d+()\- .]/g, '').trim();
          if (cleanPhone) phones.push(cleanPhone);
        } else if (keyPart.startsWith('EMAIL') && !email) {
          email = valPart;
        } else if (keyPart.startsWith('ORG') && !org) {
          org = valPart.replace(/;/g, ' - ').trim();
        } else if (keyPart.startsWith('NOTE') && !note) {
          note = valPart;
        } else if (keyPart.startsWith('ADR') && !address) {
          const adrParts = valPart.split(';').filter(p => p.trim());
          address = adrParts.join(', ');
        } else if (keyPart.startsWith('BDAY') && !bday) {
          bday = valPart;
        }
      }

      if (name || phones.length > 0) {
        result.push({
          name: name || 'Contact Inconnu',
          phone: phones[0] || '',
          otherPhones: phones.slice(1),
          email,
          org,
          note,
          address,
          bday
        });
      }
    }
    return result;
  }

  function decodeQuotedPrintable(str) {
    return str.replace(/=([A-F0-9]{2})/gi, (match, hex) => {
      try {
        return decodeURIComponent('%' + hex);
      } catch (e) {
        return String.fromCharCode(parseInt(hex, 16));
      }
    });
  }

  // --- CSV PARSER (Google, Outlook, Standard) ---
  function parseCSV(text) {
    const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];

    // Detect delimiter
    const headerLine = lines[0];
    const delimiter = (headerLine.match(/;/g) || []).length > (headerLine.match(/,/g) || []).length ? ';' : ',';

    const headers = parseCSVLine(headerLine, delimiter).map(h => h.trim().toLowerCase());
    
    // Find index of essential columns
    const idxFirst = headers.findIndex(h => h.includes('first') || h.includes('prénom') || h.includes('prenom'));
    const idxLast = headers.findIndex(h => h.includes('last') || h.includes('nom') || h.includes('family'));
    const idxName = headers.findIndex(h => h.includes('name') || h.includes('nom complet') || h.includes('display'));
    
    const phoneCols = [];
    headers.forEach((h, idx) => {
      if (h.includes('phone') || h.includes('téléphone') || h.includes('tel') || h.includes('mobile') || h.includes('cell')) {
        phoneCols.push(idx);
      }
    });

    const emailCols = [];
    headers.forEach((h, idx) => {
      if (h.includes('email') || h.includes('mail') || h.includes('courriel')) {
        emailCols.push(idx);
      }
    });

    const idxOrg = headers.findIndex(h => h.includes('org') || h.includes('company') || h.includes('société') || h.includes('entreprise'));
    const idxNote = headers.findIndex(h => h.includes('note') || h.includes('commentaire') || h.includes('description'));
    const idxAdr = headers.findIndex(h => h.includes('address') || h.includes('adresse'));
    const idxBday = headers.findIndex(h => h.includes('birthday') || h.includes('anniversaire') || h.includes('bday'));

    const result = [];
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i], delimiter);
      if (row.length === 0) continue;

      let name = '';
      if (idxFirst !== -1 && idxLast !== -1 && (row[idxFirst] || row[idxLast])) {
        name = `${row[idxFirst] || ''} ${row[idxLast] || ''}`.trim();
      } else if (idxName !== -1 && row[idxName]) {
        name = row[idxName].trim();
      } else if (idxLast !== -1 && row[idxLast]) {
        name = row[idxLast].trim();
      }

      const phones = [];
      phoneCols.forEach(colIdx => {
        if (row[colIdx] && row[colIdx].trim()) {
          phones.push(row[colIdx].trim());
        }
      });

      const emails = [];
      emailCols.forEach(colIdx => {
        if (row[colIdx] && row[colIdx].trim()) {
          emails.push(row[colIdx].trim());
        }
      });

      if (name || phones.length > 0) {
        result.push({
          name: name || 'Contact',
          phone: phones[0] || '',
          otherPhones: phones.slice(1),
          email: emails[0] || '',
          org: idxOrg !== -1 ? (row[idxOrg] || '') : '',
          note: idxNote !== -1 ? (row[idxNote] || '') : '',
          address: idxAdr !== -1 ? (row[idxAdr] || '') : '',
          bday: idxBday !== -1 ? (row[idxBday] || '') : ''
        });
      }
    }
    return result;
  }

  function parseCSVLine(line, delimiter) {
    const entries = [];
    let insideQuotes = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        insideQuotes = !insideQuotes;
      } else if (char === delimiter && !insideQuotes) {
        entries.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    entries.push(entry.trim());
    return entries;
  }

  // --- LAYOUT ENGINE & SHEET RENDERING ---
  function updateLayoutBadge() {
    const map = {
      full: 'A4 standard (1/1)',
      half: '1/2 Feuille A5 (2 volets)',
      quarter: '1/4 Feuille A6 (4 volets poche)',
      pocketmod: 'Mini-livret 8 volets (Origami)'
    };
    document.getElementById('layout-summary-badge').textContent = map[state.settings.format];

    const pocketHelp = document.getElementById('pocket-fold-help');
    if (state.settings.format === 'pocketmod') {
      pocketHelp.classList.remove('hidden');
    } else {
      pocketHelp.classList.add('hidden');
    }
  }

  function renderSheets() {
    const container = document.getElementById('sheets-container');
    container.innerHTML = '';

    const contacts = state.filteredContacts;
    if (contacts.length === 0) {
      container.innerHTML = `
        <div class="sheet-page flex items-center justify-center text-center p-8 text-slate-400">
          <div>
            <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <p class="font-bold text-slate-700 text-base">Aucun contact à afficher</p>
            <p class="text-xs text-slate-500 mt-1">Glissez un fichier .vcf ou cliquez sur "Charger Démo".</p>
          </div>
        </div>
      `;
      document.getElementById('current-sheet-num').textContent = '0';
      document.getElementById('total-sheets-num').textContent = '0';
      return;
    }

    const format = state.settings.format;

    if (format === 'full') {
      renderFullPageLayout(contacts, container);
    } else if (format === 'half') {
      renderHalfPageLayout(contacts, container);
    } else if (format === 'quarter') {
      renderQuarterPageLayout(contacts, container);
    } else if (format === 'pocketmod') {
      renderPocketModLayout(contacts, container);
    }
  }

  // --- FULL PAGE A4 LAYOUT ---
  function renderFullPageLayout(contacts, container) {
    const fontSize = state.settings.fontSize;
    const fontFamily = getFontFamilyClass();
    const densityClass = state.settings.density === 'tight' ? 'density-tight' : '';

    // Calculate columns: default auto = 2 columns for A4, or 3 if tiny font <= 6pt
    let numCols = state.settings.cols === 'auto' ? (fontSize <= 6 ? 3 : 2) : state.settings.cols;

    // Estimate capacity per page
    // A4 height is 297mm minus padding (12mm) - header (15mm) = ~270mm.
    // Each row height in mm roughly = (fontSize in pt) * 0.352 * line-height + padding
    const rowHeightMm = (fontSize * 0.38) + (state.settings.density === 'tight' ? 2.5 : 4);
    const rowsPerCol = Math.floor(260 / rowHeightMm);
    const capacityPerPage = rowsPerCol * numCols;

    const totalPages = Math.ceil(contacts.length / capacityPerPage) || 1;

    for (let p = 0; p < totalPages; p++) {
      const pageContacts = contacts.slice(p * capacityPerPage, (p + 1) * capacityPerPage);
      const isVerso = state.settings.duplex && (p % 2 === 1);

      const sheetWrapper = document.createElement('div');
      sheetWrapper.className = 'sheet-wrapper';

      const label = document.createElement('div');
      label.className = 'sheet-header-label no-print';
      label.innerHTML = `<span>Page ${p + 1} / ${totalPages}</span> ${isVerso ? '<span class="bg-amber-900/60 text-amber-300 px-1.5 py-0.2 rounded font-mono text-[10px]">VERSO</span>' : '<span class="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono text-[10px]">RECTO</span>'}`;
      sheetWrapper.appendChild(label);

      const sheetPage = document.createElement('div');
      sheetPage.className = `sheet-page ${fontFamily} ${densityClass} ${state.settings.guides ? 'has-guides' : ''}`;
      sheetPage.style.fontSize = `${fontSize}pt`;

      // Header Banner
      sheetPage.appendChild(createSheetBanner(p + 1, totalPages));

      // Content Multi-column Grid
      const grid = document.createElement('div');
      grid.className = 'sheet-content-grid';
      grid.style.gridTemplateColumns = `repeat(${numCols}, minmax(0, 1fr))`;

      // Split page contacts into columns
      const perCol = Math.ceil(pageContacts.length / numCols);
      for (let c = 0; c < numCols; c++) {
        const colDiv = document.createElement('div');
        colDiv.className = 'flex flex-col';
        const colContacts = pageContacts.slice(c * perCol, (c + 1) * perCol);

        let lastLetter = '';
        colContacts.forEach(contact => {
          const firstLetter = (contact.name || '#')[0].toUpperCase();
          if (state.settings.alphaHeaders && firstLetter !== lastLetter) {
            lastLetter = firstLetter;
            const letterEl = document.createElement('div');
            letterEl.className = 'letter-section-header';
            letterEl.textContent = firstLetter;
            colDiv.appendChild(letterEl);
          }
          colDiv.appendChild(createContactRow(contact));
        });

        grid.appendChild(colDiv);
      }

      sheetPage.appendChild(grid);
      sheetWrapper.appendChild(sheetPage);
      container.appendChild(sheetWrapper);
    }

    updateSheetCounter(totalPages, contacts.length);
  }

  // --- HALF PAGE A5 LAYOUT (2 panels per A4 sheet) ---
  function renderHalfPageLayout(contacts, container) {
    const fontSize = state.settings.fontSize;
    const fontFamily = getFontFamilyClass();
    const densityClass = state.settings.density === 'tight' ? 'density-tight' : '';
    const numCols = state.settings.cols === 'auto' ? 2 : state.settings.cols;

    // Each half sheet has ~125mm height
    const rowHeightMm = (fontSize * 0.38) + (state.settings.density === 'tight' ? 2.5 : 3.8);
    const capacityPerPanel = Math.floor(115 / rowHeightMm) * numCols;
    const capacityPerSheet = capacityPerPanel * 2;

    const totalSheets = Math.ceil(contacts.length / capacityPerSheet) || 1;

    for (let s = 0; s < totalSheets; s++) {
      const sheetContacts = contacts.slice(s * capacityPerSheet, (s + 1) * capacityPerSheet);
      const isVerso = state.settings.duplex && (s % 2 === 1);

      const sheetWrapper = document.createElement('div');
      sheetWrapper.className = 'sheet-wrapper';

      const label = document.createElement('div');
      label.className = 'sheet-header-label no-print';
      label.innerHTML = `<span>Feuille A4 #${s + 1} (2x A5)</span> ${isVerso ? '<span class="bg-amber-900/60 text-amber-300 px-1.5 py-0.2 rounded font-mono text-[10px]">VERSO</span>' : '<span class="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono text-[10px]">RECTO</span>'}`;
      sheetWrapper.appendChild(label);

      const sheetPage = document.createElement('div');
      sheetPage.className = `sheet-page ${fontFamily} ${densityClass} ${state.settings.guides ? 'has-guides' : ''} justify-between`;
      sheetPage.style.fontSize = `${fontSize}pt`;

      // Cut/fold horizontal line
      if (state.settings.guides) {
        const foldH = document.createElement('div');
        foldH.className = 'guide-fold-h';
        sheetPage.appendChild(foldH);
      }

      // Top Half Panel
      const panel1Contacts = sheetContacts.slice(0, capacityPerPanel);
      const p1 = createPanel("Volet A - 1/2 A4", panel1Contacts, numCols, (s * 2) + 1, totalSheets * 2);
      sheetPage.appendChild(p1);

      // Bottom Half Panel
      const panel2Contacts = sheetContacts.slice(capacityPerPanel, capacityPerSheet);
      const p2 = createPanel("Volet B - 1/2 A4", panel2Contacts, numCols, (s * 2) + 2, totalSheets * 2);
      sheetPage.appendChild(p2);

      sheetWrapper.appendChild(sheetPage);
      container.appendChild(sheetWrapper);
    }

    updateSheetCounter(totalSheets, contacts.length);
  }

  // --- QUARTER PAGE A6 LAYOUT (4 panels per A4 sheet - Pocket booklet) ---
  function renderQuarterPageLayout(contacts, container) {
    const fontSize = Math.min(state.settings.fontSize, 7); // Pocket format benefits from compact font
    const fontFamily = getFontFamilyClass();
    const densityClass = state.settings.density === 'tight' ? 'density-tight' : '';
    const numCols = state.settings.cols === 'auto' ? 1 : state.settings.cols;

    const rowHeightMm = (fontSize * 0.38) + 2.4;
    const capacityPerPanel = Math.floor(105 / rowHeightMm) * numCols;
    const capacityPerSheet = capacityPerPanel * 4;

    const totalSheets = Math.ceil(contacts.length / capacityPerSheet) || 1;

    for (let s = 0; s < totalSheets; s++) {
      const sheetContacts = contacts.slice(s * capacityPerSheet, (s + 1) * capacityPerSheet);
      const isVerso = state.settings.duplex && (s % 2 === 1);

      const sheetWrapper = document.createElement('div');
      sheetWrapper.className = 'sheet-wrapper';

      const label = document.createElement('div');
      label.className = 'sheet-header-label no-print';
      label.innerHTML = `<span>Feuille A4 #${s + 1} (4x A6 Format Poche)</span> ${isVerso ? '<span class="bg-amber-900/60 text-amber-300 px-1.5 py-0.2 rounded font-mono text-[10px]">VERSO</span>' : '<span class="bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded font-mono text-[10px]">RECTO</span>'}`;
      sheetWrapper.appendChild(label);

      const sheetPage = document.createElement('div');
      sheetPage.className = `sheet-page ${fontFamily} ${densityClass} ${state.settings.guides ? 'has-guides' : ''}`;
      sheetPage.style.fontSize = `${fontSize}pt`;

      if (state.settings.guides) {
        const foldH = document.createElement('div');
        foldH.className = 'guide-fold-h';
        const foldV = document.createElement('div');
        foldV.className = 'guide-fold-v';
        sheetPage.appendChild(foldH);
        sheetPage.appendChild(foldV);
      }

      // 2x2 grid container
      const grid2x2 = document.createElement('div');
      grid2x2.className = 'w-full h-full grid grid-cols-2 grid-rows-2 gap-4';

      for (let q = 0; q < 4; q++) {
        const qContacts = sheetContacts.slice(q * capacityPerPanel, (q + 1) * capacityPerPanel);
        const panelNum = (s * 4) + q + 1;
        const panel = createPanel(`Volet ${panelNum} (Poche)`, qContacts, numCols, panelNum, totalSheets * 4);
        grid2x2.appendChild(panel);
      }

      sheetPage.appendChild(grid2x2);
      sheetWrapper.appendChild(sheetPage);
      container.appendChild(sheetWrapper);
    }

    updateSheetCounter(totalSheets, contacts.length);
  }

  // --- POCKETMOD (8-FOLD ORIGAMI MINI-BOOKLET) ---
  function renderPocketModLayout(contacts, container) {
    const fontSize = 5.5; // Optimized for mini-booklet
    const fontFamily = getFontFamilyClass();

    const sheetWrapper = document.createElement('div');
    sheetWrapper.className = 'sheet-wrapper';

    const label = document.createElement('div');
    label.className = 'sheet-header-label no-print';
    label.innerHTML = `<span>Mini-Livret Pliable (1 feuille A4 pliée en carnet 8 pages)</span> <span class="bg-amber-900/70 text-amber-300 px-1.5 py-0.2 rounded font-mono text-[10px]">PLIAGE ORIGAMI</span>`;
    sheetWrapper.appendChild(label);

    const sheetPage = document.createElement('div');
    sheetPage.className = `sheet-page ${fontFamily} density-tight ${state.settings.guides ? 'has-guides' : ''}`;
    sheetPage.style.fontSize = `${fontSize}pt`;

    // 8-page grid: 4 columns, 2 rows
    const grid = document.createElement('div');
    grid.className = 'w-full h-full grid grid-cols-4 grid-rows-2 gap-2 p-1';

    // In a standard PocketMod, the top row is printed upside down (rotated 180deg)
    // Pages order: Top: P8, P7, P6, P5 (rotated 180). Bottom: P1 (Cover), P2, P3, P4.
    const capacityPerPage = 12; // Roughly 10-14 contacts per mini-page
    const pageOrder = [
      { num: 8, rotated: true, title: "Page 8" },
      { num: 7, rotated: true, title: "Page 7" },
      { num: 6, rotated: true, title: "Page 6" },
      { num: 5, rotated: true, title: "Page 5" },
      { num: 1, rotated: false, isCover: true, title: "COULEUR / COUVERTURE" },
      { num: 2, rotated: false, title: "Page 2" },
      { num: 3, rotated: false, title: "Page 3" },
      { num: 4, rotated: false, title: "Page 4" }
    ];

    pageOrder.forEach((pMeta) => {
      const panel = document.createElement('div');
      panel.className = 'border border-slate-300 rounded p-1.5 flex flex-col justify-between overflow-hidden bg-white';
      if (pMeta.rotated) {
        panel.style.transform = 'rotate(180deg)';
      }

      if (pMeta.isCover) {
        // Front Cover Page
        panel.innerHTML = `
          <div class="h-full flex flex-col justify-between text-center p-1 border-2 border-slate-900 rounded">
            <div>
              <div class="text-[7px] font-mono tracking-widest text-slate-500 uppercase">RÉPERTOIRE PHYSIQUE</div>
              <div class="text-[10px] font-black uppercase text-slate-950 mt-1">LOSTCALL</div>
              <div class="text-[6.5px] text-slate-600 italic">Carnet d'urgence</div>
            </div>
            <div class="my-auto text-[6px] text-slate-700 space-y-0.5">
              <p>Nom: _________________</p>
              <p>Tél: _________________</p>
              <p>ICE: _________________</p>
              <p>Groupe: ______________</p>
            </div>
            <div class="text-[6px] font-mono text-emerald-700 font-bold border-t border-slate-300 pt-0.5">
              15 SAMU | 18 POMPIERS | 17 POLICE
            </div>
          </div>
        `;
      } else {
        const sliceIdx = pMeta.num - 2; // page 2 is idx 0
        const pageContacts = contacts.slice(sliceIdx * capacityPerPage, (sliceIdx + 1) * capacityPerPage);
        
        panel.innerHTML = `
          <div class="border-b border-slate-400 pb-0.5 mb-0.5 flex justify-between items-center text-[6px] font-mono">
            <span class="font-bold">PAGE ${pMeta.num}</span>
            <span class="text-slate-500">LOSTCALL</span>
          </div>
        `;
        const listDiv = document.createElement('div');
        listDiv.className = 'flex-1 flex flex-col';
        pageContacts.forEach(c => listDiv.appendChild(createContactRow(c)));
        panel.appendChild(listDiv);
      }

      grid.appendChild(panel);
    });

    sheetPage.appendChild(grid);
    sheetWrapper.appendChild(sheetPage);
    container.appendChild(sheetWrapper);

    updateSheetCounter(1, contacts.length);
  }

  // --- SUB-PANEL COMPONENT (1/2, 1/4 layouts) ---
  function createPanel(title, panelContacts, numCols, panelNum, totalPanels) {
    const panel = document.createElement('div');
    panel.className = 'sub-panel flex-1';

    // Panel Header
    const hdr = document.createElement('div');
    hdr.className = 'panel-header';
    hdr.innerHTML = `
      <div class="flex items-center gap-1.5">
        <span class="panel-title">${state.settings.headerTitle}</span>
      </div>
      <div class="font-mono text-[0.7em] text-slate-500">
        Volet ${panelNum}/${totalPanels}
      </div>
    `;
    panel.appendChild(hdr);

    // Grid of columns inside this panel
    const grid = document.createElement('div');
    grid.className = 'flex-1 grid gap-2 overflow-hidden';
    grid.style.gridTemplateColumns = `repeat(${numCols}, minmax(0, 1fr))`;

    const perCol = Math.ceil(panelContacts.length / numCols) || 1;
    for (let c = 0; c < numCols; c++) {
      const colDiv = document.createElement('div');
      colDiv.className = 'flex flex-col';
      const slice = panelContacts.slice(c * perCol, (c + 1) * perCol);

      let lastLetter = '';
      slice.forEach(contact => {
        const firstLetter = (contact.name || '#')[0].toUpperCase();
        if (state.settings.alphaHeaders && firstLetter !== lastLetter) {
          lastLetter = firstLetter;
          const letterEl = document.createElement('div');
          letterEl.className = 'letter-section-header';
          letterEl.textContent = firstLetter;
          colDiv.appendChild(letterEl);
        }
        colDiv.appendChild(createContactRow(contact));
      });
      grid.appendChild(colDiv);
    }

    panel.appendChild(grid);
    return panel;
  }

  // --- SHEET TOP BANNER ---
  function createSheetBanner(pageNum, totalPages) {
    const banner = document.createElement('div');
    banner.className = 'sheet-top-banner';

    const left = document.createElement('div');
    left.innerHTML = `
      <div class="sheet-main-title">${escapeHtml(state.settings.headerTitle)}</div>
      <div class="sheet-sub-title">${escapeHtml(state.settings.headerSubtitle)}</div>
    `;

    const right = document.createElement('div');
    right.className = 'sheet-meta-right';
    const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    right.innerHTML = `
      <div>Page <strong>${pageNum}</strong> / ${totalPages}</div>
      <div class="text-[0.85em] text-slate-400">Édité le ${now}</div>
    `;

    banner.appendChild(left);
    banner.appendChild(right);
    return banner;
  }

  // --- CONTACT ROW COMPONENT ---
  function createContactRow(contact) {
    const row = document.createElement('div');
    row.className = `contact-row ${state.settings.rowBorders ? 'with-border' : ''}`;

    const fields = state.settings.fields;
    let html = '';

    // Line 1: Name and Primary Phone (Packed inline for maximum density!)
    html += `<div class="flex items-baseline justify-between gap-1 flex-wrap">`;
    html += `<span class="c-name truncate">${escapeHtml(contact.name || 'Sans Nom')}</span>`;

    if (fields.phone && contact.phone) {
      html += `<span class="c-phone shrink-0">${escapeHtml(contact.phone)}</span>`;
    }
    html += `</div>`;

    // Line 2 (Optional): Other phones & Urgent notes
    const hasOtherPhones = fields.otherPhones && contact.otherPhones && contact.otherPhones.length > 0;
    const hasNote = fields.note && contact.note;

    if (hasOtherPhones || hasNote) {
      html += `<div class="flex items-baseline justify-between gap-1 text-[0.85em]">`;
      if (hasOtherPhones) {
        html += `<span class="c-other-phone truncate">Tél 2: ${escapeHtml(contact.otherPhones.join(', '))}</span>`;
      }
      if (hasNote) {
        html += `<span class="c-note truncate ml-auto">${escapeHtml(contact.note)}</span>`;
      }
      html += `</div>`;
    }

    // Line 3 (Optional): Email & Org
    const hasEmail = fields.email && contact.email;
    const hasOrg = fields.org && contact.org;
    if (hasEmail || hasOrg) {
      html += `<div class="flex items-baseline justify-between gap-1 text-[0.82em]">`;
      if (hasEmail) {
        html += `<span class="c-email truncate">${escapeHtml(contact.email)}</span>`;
      }
      if (hasOrg) {
        html += `<span class="c-org truncate ml-auto">${escapeHtml(contact.org)}</span>`;
      }
      html += `</div>`;
    }

    // Line 4 (Optional): Address
    if (fields.address && contact.address) {
      html += `<div class="text-[0.78em] c-address truncate">${escapeHtml(contact.address)}</div>`;
    }

    // Line 5 (Optional): Birthday (if explicitly enabled by user)
    if (fields.bday && contact.bday) {
      html += `<div class="text-[0.75em] text-slate-500">Anniv: ${escapeHtml(contact.bday)}</div>`;
    }

    row.innerHTML = html;
    return row;
  }

  function getFontFamilyClass() {
    if (state.settings.fontFamily === 'condensed') return 'font-condensed';
    if (state.settings.fontFamily === 'mono') return 'font-mono';
    return 'font-sans';
  }

  function updateSheetCounter(totalPages, count) {
    document.getElementById('current-sheet-num').textContent = '1';
    document.getElementById('total-sheets-num').textContent = totalPages;
    document.getElementById('density-hint').textContent = `${count} contacts répartis sur ${totalPages} feuille${totalPages > 1 ? 's' : ''}`;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // --- TUTORIALS RENDERER ---
  function renderTutorial(osKey) {
    const data = TUTORIALS[osKey];
    if (!data) return;

    const content = document.getElementById('tutorial-content');
    let html = `
      <div class="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <span class="text-xs font-mono text-emerald-400 font-semibold uppercase tracking-wider">Export officiel</span>
          <h3 class="text-xl font-bold text-white mt-0.5">${data.title}</h3>
        </div>
        <span class="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300 font-mono">${data.badge}</span>
      </div>

      <p class="text-slate-300 text-sm leading-relaxed">${data.summary}</p>

      ${data.diagram || ''}

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
    `;

    data.steps.forEach(step => {
      html += `
        <div class="bg-slate-950/80 border border-slate-800/80 rounded-xl p-4 flex gap-3">
          <div class="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-sm flex items-center justify-center shrink-0">
            ${step.num}
          </div>
          <div>
            <h4 class="font-semibold text-slate-100 text-xs">${step.title}</h4>
            <p class="text-xs text-slate-400 mt-1 leading-normal">${step.desc}</p>
          </div>
        </div>
      `;
    });

    html += `
      </div>

      <div class="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-amber-400 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4"/><path d="m4.93 4.93 2.83 2.83"/><path d="M2 12h4"/><path d="m4.93 19.07 2.83-2.83"/><path d="M12 18v4"/><path d="m19.07 19.07-2.83-2.83"/><path d="M20 12h4"/><path d="m19.07 4.93-2.83 2.83"/></svg>
        <div>${data.altMethod}</div>
      </div>
    `;

    content.innerHTML = html;
  }

  // --- PRINT HANDLER ---
  function handlePrint() {
    // Print window dialog triggers @media print rules calibrated to A4 millimeter accuracy
    window.print();
  }

  // Launch on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
