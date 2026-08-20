// ============================================================
// 4.100 PRECOGN - NAVIGATOR V6 (Operating System Interface)
// TABLE DES MATIÈRES
// ============================================================
// 
// 0000 HEADER
//     0000 10 - Philosophie : PreCogn = OS de l'organisation
//     0000 20 - Version et historique
//     0000 30 - Architecture
//
// 1000 POINT D'ENTRÉE
//     1000 10 - doGet() - Entrée unique
//     1000 20 - getNavigatorHTML() - Interface principale
//
// 2000 CONTEXT RESOLVER
//     2000 10 - resolveContext() - Détermine le contexte
//     2000 20 - getContextInfo() - Info pour l'interface
//
// 3000 ORGANIZATION SERVICE (client)
//     3000 10 - getOrganization() - Appelle le service externe
//     3000 20 - getPatrimoine() - Charge le patrimoine
//
// 4000 STORAGE (interface abstraite)
//     4000 10 - Storage Interface - À implémenter par le module Storage
//
// 5000 EVOLUTION ENGINE (client)
//     5000 10 - getEvolutionProposals() - Propositions d'évolution
//     5000 20 - getInconsistencies() - Incohérences détectées
//     5000 30 - getSuggestedFlows() - Flows suggérés
//     5000 40 - getSuggestedRules() - Règles suggérées
//     5000 50 - getEvolutionHistory() - Historique des évolutions
//
// 6000 INTERFACE
//     6000 10 - buildDashboard() - Dashboard complet
//     6000 20 - renderSection() - Rend une section
//     6000 30 - renderEvolutionSection() - Section évolutions
//     6000 40 - getModulesMenu() - Menu des modules
//
// 9000 UTILITAIRES
// ============================================================


// ============================================================
// 0000 HEADER
// ============================================================

/**
 * 4.100 Navigator - Interface de l'OS PreCogn
 * 
 * PreCogn est un Operating System de l'organisation.
 * 
 * Le Navigator est son interface graphique.
 * 
 * Il n'est qu'une fenêtre sur :
 * - le patrimoine organisationnel
 * - les moteurs d'évolution
 * - les flows
 * - les règles
 * 
 * Le Navigator ne crée pas, ne stocke pas, ne décide pas.
 * Il interroge les services et affiche.
 */

const VERSION = '6.1.0';
const APP_NAME = '◈ Structory';
const COMMUNICATOR_URL = "https://script.google.com/macros/s/AKfycbwCCLsBtsZ0kreKs9VKhVwD2E7in2w2Ov0NyCD-So7dJ9jVTgxdjUpLU6AHtwSGyFXUaQ/exec";
// Seule(s) org(s) volontairement publiques (démo prospect, aucune donnée réelle) — toute
// autre org exige désormais une vraie session (voir authGate) avant de rendre quoi que ce
// soit. Ne JAMAIS y ajouter smcspl ou une future org cliente réelle.
const PUBLIC_DEMO_ORG_IDS = ['smcdemo', 'structory_demo'];

// ================================================================
// MODULE "MON COMPTE" (widget Bibliotheque.AccountPanel, subscriptions_api) — relais requis car
// google.script.run ne peut pas appeler une fonction de library directement (même contrat que
// communicator/Code.js, voir ConnectorIdentity.js). Demande de Stéphane 2026-07-21 : l'onglet
// organisation (rond avec "?" si pas encore enregistrée) doit aussi apparaître dans le
// Navigator, pas seulement le Communicator — repris 2026-07-22 sur les briques BYOS (Analyzor +
// ConnectorIdentity.js) plutôt que l'ancien subscriptions_api, avec repli automatique sur
// l'ancien système pour les organisations pas encore migrées (identityGetOrgProfile).
// ================================================================
// noSessionFallback=true : Navigator tourne en executeAs USER_DEPLOYING, où
// Session.getActiveUser() renvoie toujours l'identité du déployeur (Stéphane), jamais celle du
// visiteur réel — sans ce flag, "Connecté en tant que le-deployeur" s'affichait à
// n'importe quel visiteur anonyme de n'importe quelle org (bug réel, 2026-08-02).
function identityGetOrgProfile(orgId) { return Bibliotheque.identityGetOrgProfile(orgId, null, true); }
function identityUpdateOrgProfile(orgId, folderId, fields) { return Bibliotheque.identityUpdateOrgProfile(orgId, folderId, fields); }
function identityUploadOrgLogo(orgId, folderId, base64Data, mimeType) { return Bibliotheque.identityUploadOrgLogo(orgId, folderId, base64Data, mimeType); }
function accountUpsertUser(email, locale) { return Bibliotheque.accountUpsertUser(email, locale); }
function accountRegisterOrg(orgId, name, ownerUid) { return Bibliotheque.accountRegisterOrg(orgId, name, ownerUid); }
function accountGetOrgProfile(orgId) { return Bibliotheque.accountGetOrgProfile(orgId); }
function accountUpdateOrgProfile(orgId, fields) { return Bibliotheque.accountUpdateOrgProfile(orgId, fields); }
function accountUpdateUserProfile(uid, fields) { return Bibliotheque.accountUpdateUserProfile(uid, fields); }
function accountSubscriptionCheckout(payerUid, country, locale, email) { return Bibliotheque.accountSubscriptionCheckout(payerUid, country, locale, email); }
function accountPartnerCheckout(payerUid, locale, email) { return Bibliotheque.accountPartnerCheckout(payerUid, locale, email); }
function accountResolveCheckoutSession(sessionId) { return Bibliotheque.accountResolveCheckoutSession(sessionId); }
function accountOrgsForUid(uid) { return Bibliotheque.accountOrgsForUid(uid); }
function accountJoinRequest(uid, orgId, requestedRole) { return Bibliotheque.accountJoinRequest(uid, orgId, requestedRole); }
function accountJoinDecide(requestId, decision) { return Bibliotheque.accountJoinDecide(requestId, decision); }
function accountListJoinRequests(orgId) { return Bibliotheque.accountListJoinRequests(orgId); }

// Relais requis (google.script.run ne peut pas appeler une fonction de library directement,
// même contrat que ci-dessus) — saisie manuelle de solde depuis la section Comptes (2026-07-26,
// retour de Stéphane : les comptes sans connector API doivent rester saisissables à la main).
function executorBalancePoint(orgId, point) { return Bibliotheque.executorBalancePoint(orgId, point); }
function executorPatrimoineView(orgId, module) { return Bibliotheque.executorPatrimoineView(orgId, module); }
function executorTimePoints(orgId) { return Bibliotheque.executorTimePoints(orgId); }
function executorPatrimoineAt(orgId, module, date) { return Bibliotheque.executorPatrimoineAt(orgId, module, date); }
function executorSyncOne(orgId, compte) { return Bibliotheque.executorSyncOne(orgId, compte); }
function executorEnableBankingStartAuth(orgId, email, aspspName) { return Bibliotheque.executorEnableBankingStartAuth(orgId, email, aspspName); }
function executorEnableBankingPending(state) { return Bibliotheque.executorEnableBankingPending(state); }
function executorPowensStartAuth(orgId) { return Bibliotheque.executorPowensStartAuth(orgId); }
function executorPowensAccountsAll(orgId, bankName) { return Bibliotheque.executorPowensAccountsAll(orgId, bankName); }
function executorPowensBootstrap(orgId, domain, clientId, clientSecret) { return Bibliotheque.executorPowensBootstrap(orgId, domain, clientId, clientSecret); }
function executorPowensLinkConnection(orgId, connectionIdOrUrl) { return Bibliotheque.executorPowensLinkConnection(orgId, connectionIdOrUrl); }
function executorBanksSearch(orgId, query) { return Bibliotheque.executorBanksSearch(orgId, query); }
function executorBanksSearchAll(orgId, exactName) { return Bibliotheque.executorBanksSearchAll(orgId, exactName); }
function executorConnectorFlow(orgId, etablissement, nature, module) { return Bibliotheque.executorConnectorFlow(orgId, etablissement, nature, module); }
function analyzorResolveConnector(etablissement, nature, orgId, module) { return Bibliotheque.analyzorResolveConnector(etablissement, nature, orgId, module); }
function executorGetReportSchedule(orgId) { return Bibliotheque.executorGetReportSchedule(orgId); }
function executorSetReportSchedule(orgId, schedule) { return Bibliotheque.executorSetReportSchedule(orgId, schedule); }
// identityCreateCompte/identityDeleteCompte (ConnectorIdentity.js) écrivent directement via
// DriveApp — Navigator est déployé en executeAs=USER_DEPLOYING (appsscript.json), donc ces
// appels s'exécutent TOUJOURS avec l'identité Google du déployeur, jamais celle du visiteur ni
// celle du compte de service : aucun souci de quota côté création (storageQuotaExceeded ne
// concerne que le compte de service Analyzor), et pour la suppression, le déployeur est
// justement le PROPRIÉTAIRE réel des fichiers (condition requise pour trasher sur Drive — un
// éditeur/writer ne le peut pas, voir identityDeleteCompte).
function identityGetOrgFolderId(orgId) { return Bibliotheque.identityGetOrgFolderId(orgId); }
function identityCreateCompte(orgId, folderId, contenu) { return Bibliotheque.identityCreateCompte(orgId, folderId, contenu); }
function identityDeleteCompte(orgId, folderId, compteUid) { return Bibliotheque.identityDeleteCompte(orgId, folderId, compteUid); }
function identityUpdateCompte(orgId, folderId, compteUid, contenu) { return Bibliotheque.identityUpdateCompte(orgId, folderId, compteUid, contenu); }
// Self-service Enable Banking par org (2026-07-27) : chaque org configure ses PROPRES
// identifiants sandbox (app_id + clé privée), stockés chiffrés dans SON PROPRE Drive — plus
// besoin de l'endpoint admin temporaire (adminAction=ensureSecretPlaceholder, doGet ci-dessous)
// ni des identifiants sandbox partagés entre smcspl/smcdemo.
function identitySetOrgSecret(orgId, folderId, name, value) { return Bibliotheque.identitySetOrgSecret(orgId, folderId, name, value); }
function analyzorListSecrets(orgId) { return Bibliotheque.analyzorListSecrets(orgId); }
// Outputs (2026-07-27) : rapport patrimonial imprimable/PDF (voir doGet, vue "report" ci-dessous)
// et renvoi immédiat de l'email quotidien (en plus de l'envoi automatique de 7h).
function executorSendReportNow(orgId, module) { return Bibliotheque.executorSendReportNow(orgId, module); }

// ============================================================
// 1000 POINT D'ENTRÉE
// ============================================================

// 1000 10 - doGet()
function doGet(e) {
  Logger.log('=== Structory OS - doGet ===');

  // Bootstrap ponctuel d'un placeholder de secret (2026-07-27) — voir
  // identityEnsureSecretPlaceholder. Route admin étroite, jamais documentée publiquement,
  // déclenchée une seule fois par requête manuelle (curl) pour contourner le blocage de
  // création du compte de service, jamais depuis l'UI normale.
  if (e && e.parameter && e.parameter.adminAction === 'ensureSecretPlaceholder') {
    const orgId = e.parameter.orgId;
    const folderId = e.parameter.folderId;
    const name = e.parameter.name;
    const result = Bibliotheque.identityEnsureSecretPlaceholder(orgId, folderId, name);
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }


  // Rattrapage ponctuel d'une brique Rule connector manquante (2026-07-29 — voir
  // identityEnsureConnectorRule, ConnectorIdentity.js) : depuis cette date, toute liaison
  // Powens/Enable Banking en crée une automatiquement, mais les comptes déjà liés AVANT le
  // correctif (ex. "Le Conservateur" sur smcspl) n'en ont pas et ne se synchroniseront jamais
  // sans un rattrapage manuel. Route admin ponctuelle, même principe que ensureSecretPlaceholder.
  if (e && e.parameter && e.parameter.adminAction === 'ensureConnectorRule') {
    const result = Bibliotheque.identityEnsureConnectorRule(
      e.parameter.orgId, e.parameter.interface, e.parameter.etablissement, e.parameter.nature
    );
    return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
  }

  // Copie d'un Google Sheet sous le compte de l'utilisateur (contourne le quota du compte de
  // service). Route admin ponctuelle, même principe que ensureSecretPlaceholder.
  if (e && e.parameter && e.parameter.adminAction === 'copySheet') {
    try {
      const sourceId = e.parameter.sourceId;
      const newName  = e.parameter.newName || 'Copie';
      const file = DriveApp.getFileById(sourceId).makeCopy(newName);
      const newId = file.getId();
      return ContentService.createTextOutput(JSON.stringify({ success: true, id: newId,
        url: 'https://docs.google.com/spreadsheets/d/' + newId })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Crée et pousse un script lié (bound) dans le sheet Navigator d'une org copro.
  if (e && e.parameter && e.parameter.adminAction === 'createCoproMenu') {
    try {
      const sheetId = e.parameter.sheetId;
      const commUrl = e.parameter.commUrl || 'https://script.google.com/macros/s/AKfycbzoClf0eKI8NwrbKR3sFlw58AD_TPNiRfSvrwQccUkP8lhiE1c-PaYVz6GmJccza0OWhg/exec';
      const orgId   = e.parameter.orgId   || '';
      const token   = ScriptApp.getOAuthToken();
      const headers = { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
      // 1) Créer le projet bound
      const createResp = UrlFetchApp.fetch('https://script.googleapis.com/v1/projects', {
        method: 'post', headers: headers,
        payload: JSON.stringify({ title: 'Compta Copro – Menu', parentId: sheetId }),
        muteHttpExceptions: true
      });
      const project = JSON.parse(createResp.getContentText());
      if (!project.scriptId) return ContentService.createTextOutput(
        JSON.stringify({ success: false, error: 'create failed', detail: createResp.getContentText() })
      ).setMimeType(ContentService.MimeType.JSON);
      const scriptId = project.scriptId;
      // 2) Pousser le code
      const code = [
        'function onOpen(){',
        '  SpreadsheetApp.getUi()',
        '    .createMenu("Communicator")',
        '    .addItem("Ouvrir le Communicator","ouvrirCommunicator")',
        '    .addSeparator()',
        '    .addItem("Rafraîchir les données","rafraichir")',
        '    .addToUi();',
        '}',
        'function ouvrirCommunicator(){',
        '  var html=HtmlService.createHtmlOutput(',
        '    \'<script>window.open("' + commUrl + '","_blank");google.script.host.close();<\\/script>\'',
        '  ).setWidth(1).setHeight(1);',
        '  SpreadsheetApp.getUi().showModalDialog(html,"Ouverture...");',
        '}',
        'function rafraichir(){',
        '  var orgId="' + orgId + '";',
        '  var sheetId=SpreadsheetApp.getActiveSpreadsheet().getId();',
        '  try{',
        '    var r=UrlFetchApp.fetch("http://213.32.16.118:8000/api/journaltosheet",{',
        '      method:"post",contentType:"application/json",',
        '      payload:JSON.stringify({orgId:orgId,sheetId:sheetId})});',
        '    var d=JSON.parse(r.getContentText());',
        '    SpreadsheetApp.getUi().alert("Rafraîchi : "+d.tabs_ok+"/"+d.tabs_traites+" onglets.");',
        '  }catch(ex){SpreadsheetApp.getUi().alert("Erreur : "+ex.message);}',
        '}',
      ].join('\n');
      const pushResp = UrlFetchApp.fetch('https://script.googleapis.com/v1/projects/' + scriptId + '/content', {
        method: 'put', headers: headers,
        payload: JSON.stringify({ files: [
          { name: 'appsscript', type: 'JSON',
            source: '{"timeZone":"Europe/Paris","dependencies":{},"exceptionLogging":"STACKDRIVER","runtimeVersion":"V8","oauthScopes":["https://www.googleapis.com/auth/spreadsheets","https://www.googleapis.com/auth/script.external_request"]}' },
          { name: 'Code', type: 'SERVER_JS', source: code }
        ]}),
        muteHttpExceptions: true
      });
      const pushResult = JSON.parse(pushResp.getContentText());
      return ContentService.createTextOutput(JSON.stringify({
        success: true, scriptId: scriptId,
        scriptUrl: 'https://script.google.com/d/' + scriptId + '/edit',
        pushStatus: pushResp.getResponseCode()
      })).setMimeType(ContentService.MimeType.JSON);
    } catch (err) {
      return ContentService.createTextOutput(JSON.stringify({ success: false, error: err.message })).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // Rapport patrimonial imprimable / exportable en PDF (2026-07-27, section Outputs) — une vraie
  // page navigable (target="_blank" depuis la vue Patrimoine), pas un contenu injecté par
  // google.script.run : plus simple, jamais gênée par les restrictions d'impression d'un iframe,
  // et bookmarkable/réutilisable directement par Stéphane.
  if (e && e.parameter && e.parameter.view === 'report') {
    const reportOrgId = e.parameter.orgId || '';
    try {
      const reportResult = Bibliotheque.executorReportHtml(reportOrgId, e.parameter.module || undefined);
      if (!reportResult || !reportResult.success) {
        return HtmlService.createHtmlOutput(getErrorHTML((reportResult && reportResult.error) || 'Rapport indisponible.'));
      }
      // window.print() ouvre le dialogue natif du navigateur, qui propose "Enregistrer en PDF"
      // comme imprimante virtuelle sur tous les OS/navigateurs modernes -- inutile de générer un
      // vrai fichier PDF côté serveur pour obtenir une "jolie impression PDF + imprimante".
      const printButtonHtml = '<div style="text-align:center;padding:16px;" class="op-print-bar">'
        + '<button onclick="window.print()" style="background:#0B0F10;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;">'
        + '🖨️ Imprimer / Enregistrer en PDF</button></div>'
        + '<style>@media print { .op-print-bar { display: none !important; } }</style>';
      return HtmlService.createHtmlOutput(printButtonHtml + reportResult.html)
        .setTitle('Rapport patrimonial - ' + reportOrgId);
    } catch (err) {
      return HtmlService.createHtmlOutput(getErrorHTML(err));
    }
  }

  try {
    // 1. Résoudre le contexte
    const context = resolveContext(e);
    context.startPlane = (e && e.parameter && ['game','sheet','navigator'].indexOf(e.parameter.plane) !== -1) ? e.parameter.plane : 'game';
    Logger.log('Context: ' + JSON.stringify(context));

    // 1bis. Gate d'accès réel (2026-08-08, retour de Stéphane : "construit enfin le chantier
    // login") — tant que ce n'est pas une org publique volontaire (PUBLIC_DEMO_ORG_IDS), plus
    // aucune donnée réelle n'est calculée/rendue sans session valide + appartenance vérifiée.
    const gate = authGate(e, context.orgId, context);
    if (gate) return gate;

    // 2. Récupérer l'organisation (via OrganizationService)
    const org = getOrganization(context);
    if (!org) {
      return HtmlService.createHtmlOutput(getErrorHTML('Organisation introuvable pour ce contexte.'));
    }
    Logger.log('Organisation: ' + org.id + ' - ' + org.name);

    // 2bis. Téléchargement direct du journal .ledger — retour de Stéphane 2026-08-11, "je dois
    // pouvoir télécharger le journal facilement". Placé APRÈS authGate/getOrganization : même
    // protection d'accès que la page elle-même, pas de route parallèle non protégée.
    if (e && e.parameter && e.parameter.download === 'journal') {
      const printResult = Bibliotheque.ledgerQuery(org.id, 'print', []);
      const content = (printResult && printResult.success)
        ? printResult.output
        : ('; Erreur export : ' + (printResult && printResult.error));
      // MimeType.CSV déclenche côté Google un routage automatique vers "ouvrir avec Sheets"
      // depuis une URL script.google.com/.../exec, qui échoue avec "cette action n'est valide
      // que pour les produits actuellement installés" (retour de Stéphane 2026-08-13) — le
      // contenu n'est de toute façon pas un vrai CSV (format ledger-cli en texte brut). TEXT
      // n'est associé à aucun "produit" Google, donc pas de routage, juste le texte servi tel quel.
      return ContentService.createTextOutput(content).setMimeType(ContentService.MimeType.TEXT);
    }

    // 2ter. Export FEC — section Flux (retour de Stéphane 2026-08-13). Même gate d'accès,
    // même raison pour MimeType.TEXT plutôt que CSV (voir commentaire ci-dessus).
    if (e && e.parameter && e.parameter.download === 'fec') {
      const fecResult = Bibliotheque.ledgerExportFec(org.id);
      const fecContent = (fecResult && fecResult.success)
        ? fecResult.fec
        : ('; Erreur export FEC : ' + (fecResult && fecResult.error));
      return ContentService.createTextOutput(fecContent).setMimeType(ContentService.MimeType.TEXT);
    }

    // 3. Charger le patrimoine (via Storage)
    const patrimoine = getPatrimoine(org.id);
    Logger.log('Patrimoine: objets=' + (patrimoine.objects ? patrimoine.objects.length : 0));
    
    // 4. Récupérer les propositions d'évolution (via EvolutionEngine)
    const evolutions = getEvolutionProposals(org.id);
    Logger.log('Évolutions: ' + (evolutions ? evolutions.length : 0) + ' propositions');
    
    // 5. Construire l'interface
    const html = getNavigatorHTML(org, patrimoine, evolutions, context);
    
    return HtmlService.createHtmlOutput(html)
      .setTitle('Structory - ' + org.name)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
      
  } catch (error) {
    Logger.log('doGet - Erreur: ' + error.message);
    return HtmlService.createHtmlOutput(getErrorHTML(error));
  }
}

// ============================================================
// 1500 AUTH GATE — connexion réelle par lien magique (2026-08-08)
// ============================================================
// Un webapp Apps Script executeAs=USER_DEPLOYING ne voit JAMAIS l'identité Google du visiteur
// (Session.getActiveUser() renvoie toujours le déployeur) — la seule identité fiable possible
// est celle que subscriptions_api connaît déjà (users/orgs/memberships), prouvée par un lien
// magique envoyé par email puis une session gardée côté navigateur (localStorage, jamais un
// cookie — Apps Script ne peut pas en poser). Retourne un HtmlOutput à renvoyer TEL QUEL si
// l'accès doit être bloqué/redirigé, ou null si le rendu normal peut continuer.
function authGate(e, orgId, context) {
  const params = (e && e.parameter) || {};

  if (!orgId || PUBLIC_DEMO_ORG_IDS.indexOf(orgId) !== -1) return null;

  // Retour du lien magique cliqué dans l'email : échange le jeton contre une vraie session,
  // puis rend la page réelle DANS LE MÊME chargement (2026-08-11, bug réel corrigé : la page-
  // relais intermédiaire — "Continuer" → 2e navigation plein écran vers le même déploiement —
  // laissait le pont RPC google.script.run de la page finale mort, silencieusement, tous les
  // boutons du Navigator restant inertes alors que le Communicator embarqué, chargé lui NORMALEMENT
  // via <iframe src>, fonctionnait toujours. Un seul chargement de page = un seul pont RPC, comme
  // partout ailleurs dans l'appli. La session est quand même stockée côté navigateur, juste par un
  // script inline dans CETTE MÊME page plutôt que par une page-relais séparée — voir getNavigatorHTML.
  if (params.loginToken) {
    try {
      const consumed = Bibliotheque.authConsumeLoginToken(params.loginToken);
      if (!consumed || !consumed.success) {
        return HtmlService.createHtmlOutput(getLoginScreenHTML(orgId, 'Ce lien a déjà été utilisé ou a expiré (15 min). Redemandes-en un ci-dessous.'));
      }
      const membership = Bibliotheque.authCheckMembership(orgId, consumed.uid);
      if (!membership || !membership.success || !membership.isMember) {
        return HtmlService.createHtmlOutput(getAccessDeniedHTML(orgId, consumed.email));
      }
      if (context) {
        context.verifiedUid = consumed.uid;
        context.verifiedEmail = consumed.email;
        context.verifiedRole = membership.role;
        context.sessionTokenToStore = consumed.sessionToken;
      }
      return null; // rendu normal en dessous, DANS ce même chargement de page.
    } catch (err) {
      return HtmlService.createHtmlOutput(getLoginScreenHTML(orgId, 'Service de connexion indisponible pour le moment, réessaie dans un instant.'));
    }
  }

  const sessionToken = params.s;
  if (!sessionToken) {
    return HtmlService.createHtmlOutput(getLoginScreenHTML(orgId, null));
  }

  try {
    const session = Bibliotheque.authGetSession(sessionToken);
    if (!session || !session.success) {
      return HtmlService.createHtmlOutput(getLoginScreenHTML(orgId, 'Session expirée, reconnecte-toi.'));
    }
    const membership = Bibliotheque.authCheckMembership(orgId, session.uid);
    if (!membership || !membership.success || !membership.isMember) {
      return HtmlService.createHtmlOutput(getAccessDeniedHTML(orgId, session.email));
    }
    // Identité déjà prouvée ICI (session + appartenance réelle) — transmise au reste du rendu
    // (OrgPanel) par mutation de `context` plutôt que revérifiée une 2e fois avec une logique
    // différente et moins fiable (2026-08-11, bug réel : le rond "?" affichait un point bleu
    // neutre au lieu du ✓ vert propriétaire alors que la connexion venait de réussir).
    if (context) {
      context.verifiedUid = session.uid;
      context.verifiedEmail = session.email;
      context.verifiedRole = membership.role;
    }
    return null; // session valide + membre de cette org précise : rendu normal en dessous.
  } catch (err) {
    // Fail CLOSED, jamais ouvert : si subscriptions_api est injoignable, on ne peut PAS
    // prouver le droit d'accès, donc on ne rend jamais les données réelles.
    return HtmlService.createHtmlOutput(getLoginScreenHTML(orgId, 'Service de connexion indisponible pour le moment, réessaie dans un instant.'));
  }
}

// L'envoi du lien de connexion se fait depuis org-onboarding (executeAs=USER_ACCESSING), JAMAIS
// depuis Navigator (executeAs=USER_DEPLOYING, donc MailApp enverrait toujours sous l'identité
// de Stéphane) — retour explicite de Stéphane, 2026-08-10 : "en BYOS on doit utiliser le
// paramétrage de l'organisation... c'est lui qui s'envoie un mail, lui qui se connecte". Chaque
// visiteur autorise MailApp sous SON PROPRE compte Google, une seule fois, comme pour Drive déjà
// (voir org-onboarding/CLAUDE.md) — jamais Stéphane qui autoriserait au nom de tout le monde.
const ORG_ONBOARDING_URL = "https://script.google.com/macros/s/AKfycbw8hhBqSBl4elLaV4a3nVTRVFGp4mmwRSCuguk1U4Fi1U4aN4Em4qvnLxWbp9t7L_j-/exec";

function getLoginScreenHTML(orgId, message) {
  const loginUrl = ORG_ONBOARDING_URL + '?screen=login&orgId=' + encodeURIComponent(orgId);
  const execUrl = ScriptApp.getService().getUrl() || '';
  return '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>Structory - Connexion</title>'
    + '<link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;600&display=swap" rel="stylesheet">'
    + '<style>* { margin:0; padding:0; box-sizing:border-box; } '
    + 'body { font-family:"Roboto Mono", monospace; background:#0B0F10; color:#D8FFE5; min-height:100vh; '
    + 'display:flex; align-items:center; justify-content:center; padding:24px; } '
    + '.wrap { max-width:380px; width:100%; } '
    + '.app-name { font-size:13px; color:#f59e0b; letter-spacing:2px; margin-bottom:8px; } '
    + 'h1 { font-size:20px; font-weight:300; margin-bottom:6px; } '
    + '.sub { font-size:12px; color:#7AAE92; margin-bottom:20px; line-height:1.4; } '
    + 'a.btn { display:block; text-align:center; width:100%; padding:12px; border-radius:8px; border:1px solid #f59e0b; '
    + 'background:#f59e0b; color:#0B0F10; font-family:"Roboto Mono", monospace; font-size:14px; font-weight:600; '
    + 'text-decoration:none; box-sizing:border-box; } '
    + '.msg { font-size:12px; margin-top:10px; min-height:14px; } '
    + '.msg.warn { color:#f59e0b; }</style>'
    + '</head><body><div class="wrap">'
    + '<div class="app-name">◈ STRUCTORY</div>'
    + '<h1>Connexion</h1>'
    + '<div class="sub">"' + _escAttr(orgId) + '" est une organisation réelle — connecte-toi pour y accéder.</div>'
    + (message ? '<div class="msg warn">' + _escAttr(message) + '</div>' : '')
    + '<a class="btn" id="resumeBtn" target="_top" style="display:none; margin-bottom:10px;">↺ Reprendre ma session</a>'
    + '<a class="btn" href="' + loginUrl + '" target="_top">Se connecter</a>'
    + '<div class="msg" id="resumeHint" style="display:none; color:#7AAE92; margin-top:10px;">Session trouvée sur cet appareil — reprends sans repasser par l\'email.</div>'
    + '<script>(function(){try{var EXEC=' + JSON.stringify(execUrl) + ';var OID=' + JSON.stringify(orgId) + ';var t=localStorage.getItem("structory_session");if(t&&EXEC){var u=EXEC+"?orgId="+encodeURIComponent(OID)+"&s="+encodeURIComponent(t);var b=document.getElementById("resumeBtn");b.href=u;b.style.display="block";document.getElementById("resumeHint").style.display="block";try{window.top.location.href=u;}catch(e){}}}catch(e){}})();</scr' + 'ipt>'
    + '</div></body></html>';
}

function getAccessDeniedHTML(orgId, email) {
  return '<!DOCTYPE html><html><head><meta charset="UTF-8">'
    + '<meta name="viewport" content="width=device-width, initial-scale=1.0">'
    + '<title>Structory - Accès refusé</title>'
    + '<style>body { font-family:monospace; background:#0B0F10; color:#D8FFE5; min-height:100vh; '
    + 'display:flex; align-items:center; justify-content:center; padding:24px; text-align:center; } '
    + '.wrap { max-width:380px; } h1 { font-size:18px; margin-bottom:10px; color:#f87171; } '
    + 'p { font-size:13px; color:#7AAE92; line-height:1.5; } '
    + 'a { color:#f59e0b; }</style></head><body><div class="wrap">'
    + '<h1>Accès refusé</h1>'
    + '<p>' + _escAttr(email || 'Ce compte') + ' n\'a pas accès à l\'organisation "' + _escAttr(orgId) + '".</p>'
    + '<p style="margin-top:14px;"><a href="' + ScriptApp.getService().getUrl() + '">← Retour</a></p>'
    + '</div></body></html>';
}

// 1000 20 - getNavigatorHTML()
function getNavigatorHTML(org, patrimoine, evolutions, context) {
  const orgId = org.id;
  const structoryData = getStructoryData(orgId);
  const comptesData = getComptesData(orgId);
  // Module PRODUIT (ex. "suivre_mes_comptes"), nécessaire à la résolution de connector
  // (analyzor::resolve_connectors) — PAS parent_org_id (hiérarchie d'organisation ci-dessus,
  // notion différente). Bug réel trouvé le 2026-07-27 : moduleId était rempli avec
  // parent_org_id, donc aucun connector (Enable Banking compris) ne se résolvait jamais en
  // usage réel, même pour des comptes déjà correctement liés.
  let moduleId = '';
  try {
    moduleId = Bibliotheque.ledgerGetModule(orgId) || '';
  } catch (e) {
    Logger.log('ledgerGetModule error: ' + e.message);
  }
  const dashboard = buildDashboard(org, patrimoine, evolutions, orgId, structoryData, comptesData);
  // Communicator intégré au cœur du Navigator (demande de Stéphane, 2026-07-21 : "le
  // communicator doit être au coeur du navigator"), pas juste un lien externe — iframe (déjà
  // autorisé par Communicator lui-même, XFrameOptionsMode.ALLOWALL). Pour toute org qui a des
  // comptes patrimoine réels (comptesData non vide) — jamais un orgId codé en dur ici.
  // Communicator retiré le 2026-07-26 (retour de Stéphane : "trop compliqué, pas prêt") en tant
  // qu'embed EN HAUT de page — les causes réelles (dernier recours qui court-circuitait le
  // garde-fou vocabulaire, réponses statiques génériques) ont été corrigées le 2026-08-01/03
  // (voir Communicator/Code.js::communicate()). Réintégré le 2026-08-03 (retour de Stéphane :
  // "navigator à gauche, communicator à droite, comme partout chez precogn") — mais en COLONNE
  // LATÉRALE plein hauteur, pas en embed haut de page : plus simple, pas de resize dynamique
  // par postMessage nécessaire.
  const communicatorEmbedHtml = '';
  const communicatorColumnHtml = '<div class="precogn-communicator"><iframe src="'
    + COMMUNICATOR_URL + '?orgId=' + encodeURIComponent(orgId) + '&embed=1"></iframe></div>';
  // Outputs comme objets (2026-07-26, Priorité 3 de Stéphane ; construit 2026-07-27, retour de
  // Stéphane : "au moins une fonction d'impression jolie pdf + imprimante et mail /jour") : le
  // rapport patrimonial (même calcul/rendu que l'email quotidien, voir _build_patrimoine_payload
  // côté Executor) est imprimable/exportable en PDF via une vraie page (doGet, vue "report" —
  // window.print() propose "Enregistrer en PDF" nativement, aucune génération PDF serveur
  // nécessaire) et renvoyable à la demande en plus de l'envoi automatique quotidien (7h,
  // smc-daily-report.timer). "Archiver" reste un objectif futur, pas construit ici.
  const reportUrl = ScriptApp.getService().getUrl() + '?orgId=' + encodeURIComponent(orgId) + '&view=report';
  // Journal complet, jamais tronqué (2026-08-13, retour de Stéphane : "je veux qu'on puisse en
  // permanence dans tous les projets Structory avoir accès au journal qui est la pierre angulaire
  // du système... en entier pas des morceaux") — même route que le téléchargement (voir doGet,
  // ?download=journal, protégée par authGate comme le reste de la page), rendue visible en
  // permanence ici plutôt que cachée derrière une seule commande de chat qui, elle, reste
  // volontairement tronquée à 25 lignes pour la lisibilité (voir Communicator/Code.js::quickJournal,
  // qui pointe maintenant vers CE lien pour la vue complète).
  const journalUrl = ScriptApp.getService().getUrl() + '?orgId=' + encodeURIComponent(orgId) + '&download=journal';
  const outputsSectionHtml = comptesData ? `
  <div class="section" style="padding:0;overflow:hidden;">
    <div class="section-title" style="padding:12px 16px 0;">📤 Outputs</div>
    <div style="padding:4px 16px 16px;display:flex;flex-direction:column;align-items:flex-start;">
      <div id="report-schedule-info" style="font-size:11px;color:#7AAE92;margin-bottom:2px;">Planning d'envoi...</div>
      <span onclick="toggleReportScheduleForm()" class="pm-output-link" style="font-size:12px;padding:4px 10px;margin-bottom:4px;">⚙️ Configurer la fréquence d'envoi</span>
      <div id="report-schedule-form" style="display:none;width:100%;padding:8px 10px;"></div>
      <a href="${reportUrl}" target="_blank" class="pm-output-link">🖨️ Imprimer / PDF</a>
      <a href="${journalUrl}" target="_blank" class="pm-output-link">📥 Télécharger le journal complet</a>
      <span onclick="renvoyerEmailMaintenant()" class="pm-output-link">📧 Renvoyer l'email maintenant</span>
      <span id="output-email-status" style="font-size:11px;color:#7AAE92;padding:2px 10px;"></span>
    </div>
  </div>
  ` : '';
  const modulesMenu = getModulesMenu(orgId, comptesData);
  const contextInfo = getContextInfo(context);
  const orgPanelHtml = Bibliotheque.getOrgPanelHtml(orgId, context.verifiedRole || null, context.verifiedEmail || null);
  // "Flow visible" (2026-07-31, retour de Stéphane : "au lieu de masquer les traitements, tu
  // les rends visibles" — voir precogn.org/test, Objects/Flows/Time/Rules). Composant partagé,
  // statique (pas de variable de template), inclus une seule fois — voir PrecognFlow dans le
  // script client (toggleAutomatiserMenu et alentours).
  const flowWidgetHtml = Bibliotheque.getFlowWidgetHtml();
  
    // ---- Plan "game" : plan immersif (le vrai game) + bouton discret "plan" (bascule) — larose75 ----
  var GP_ICON = {
  navigator: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
  sheet: '<svg width="16" height="16" viewBox="0 0 24 24"><rect x="4" y="2" width="16" height="20" rx="2.5" fill="#22a15b"/><g stroke="#eafff2" stroke-width="1.4" opacity="0.92"><path d="M4 9h16M4 15h16M10 2v20"/></g></svg>',
  game: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#8fc4ee" stroke-width="2" stroke-linecap="round"><path d="M2 9c3-3.4 6-3.4 9 0s6 3.4 9 0"/><path d="M2 15c3-3.4 6-3.4 9 0s6 3.4 9 0"/></svg>',
  plan: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 2 2 7l10 5 10-5-10-5Z"/><path d="m2 17 10 5 10-5"/><path d="m2 12 10 5 10-5"/></svg>'
};
var gamePlaneHtml = `<div id="pcg-sheet-plane" style="position:fixed;inset:0;z-index:2147483645;display:none;align-items:center;justify-content:center;background:#0C1E28;color:#9FB4C0;font-family:system-ui,sans-serif;text-align:center"><div><div style="font-size:26px;color:#E9F1F6;margin-bottom:8px">Sheet</div><div>la couche Google Sheet de cette organisation</div><div style="margin-top:12px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#5A7280;border:1px dashed #24424f;padding:4px 12px;border-radius:999px;display:inline-block">work in progress</div></div></div>`
  + `<div id="pcg-game-plane" style="position:fixed;inset:0;z-index:2147483645;display:none;background:#06121a"><iframe id="pcg-game" src="https://structory.ai/game/?org=${encodeURIComponent(orgId)}&embed=1" style="width:100%;height:100%;border:0;display:block"></iframe></div>`
  + `<div id="pcg-plan-wrap" style="position:fixed;bottom:16px;z-index:2147483647"></div>`
  + `<div id="pcg-menu" style="position:fixed;bottom:56px;z-index:2147483647;display:none;background:#0C1E28;border:1px solid rgba(120,160,175,.28);border-radius:11px;padding:6px;min-width:190px;box-shadow:0 10px 34px rgba(0,0,0,.55);font-family:system-ui,sans-serif"></div>`
  + `<script>(function(){
      var IC=${JSON.stringify(GP_ICON)}, oid=${JSON.stringify(orgId)};
      var sp=document.getElementById("pcg-sheet-plane"),gp=document.getElementById("pcg-game-plane"),fr=document.getElementById("pcg-game"),wrap=document.getElementById("pcg-plan-wrap"),menu=document.getElementById("pcg-menu");
      var PLANES=[{k:"navigator",lbl:"navigator"},{k:"sheet",lbl:"sheet · work in progress"},{k:"game",lbl:"game"}];
      var cur=${JSON.stringify(context.startPlane)};
      var BST="opacity:.85;font:600 13px system-ui,sans-serif;color:#B8CBD4;background:rgba(9,20,28,.85);border:1px solid rgba(120,160,175,.4);padding:8px 13px;border-radius:999px;cursor:pointer;display:inline-flex;align-items:center;gap:7px;line-height:0";
      function place(){var r=(window.innerWidth>900?416:16)+"px";wrap.style.right=r;menu.style.right=r;}
      function go(w){cur=w;sp.style.display=(w==="sheet")?"flex":"none";gp.style.display=(w==="game")?"block":"none";menu.style.display="none";render();}
      function buildMenu(){menu.innerHTML="";PLANES.forEach(function(p){if(p.k===cur)return;var d=document.createElement("div");d.style.cssText="padding:9px 12px;border-radius:8px;cursor:pointer;color:#C9D8E0;font-size:13px;display:flex;align-items:center;gap:10px";d.innerHTML=IC[p.k]+"<span>"+p.lbl+"</span>";d.onmouseover=function(){d.style.background="rgba(120,160,175,.13)";};d.onmouseout=function(){d.style.background="none";};d.onclick=function(e){e.stopPropagation();go(p.k);};menu.appendChild(d);});}
      function toggleMenu(e){e.stopPropagation();buildMenu();menu.style.display=(menu.style.display==="block")?"none":"block";}
      function render(){wrap.innerHTML="";var b=document.createElement("button");b.style.cssText=BST;if(cur==="navigator"){b.innerHTML="<span>plan</span>";}else{b.innerHTML=IC.plan;b.title="changer de plan";}b.onclick=toggleMenu;wrap.appendChild(b);}
      document.addEventListener("click",function(){menu.style.display="none";});
      place();window.addEventListener("resize",place);go(cur);
      window.addEventListener("message",function(ev){if(ev.data&&ev.data.type==="precogn-game-ready"){google.script.run.withSuccessHandler(function(j){try{fr.contentWindow.postMessage({type:"precogn-journal",journal:j},"*");}catch(e){}}).getGameJournal(oid);}});
    })();</script>`;

return `
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Structory - ${org.name}</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    /* Chargement visible (2026-08-02, retour de Stéphane : "on dirait que c'est planté" — un
       texte statique "Chargement..." sans aucun mouvement ne se distingue pas d'une page
       gelée) — même philosophie que PrecognFlow ailleurs dans cette page : ne jamais laisser
       une attente sans un signe de vie visible. */
    @keyframes pm-loading-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }
    .pm-loading { animation: pm-loading-pulse 1.2s ease-in-out infinite; }
    body {
      font-family: 'Roboto Mono', monospace;
      background: #0B0F10;
      color: #D8FFE5;
      padding: 24px;
      min-height: 100vh;
    }
    .container { max-width: 860px; margin: 0 auto; }

    /* Navigator (gauche) + Communicator (droite) — layout standard PreCogn (2026-08-03,
       retour de Stéphane : ce pattern doit être le défaut partout, pas une exception).
       Colonne pleine hauteur, pas de resize dynamique par postMessage nécessaire (contrairement
       à l'ancien embed en haut de page, retiré le 2026-07-26) — beaucoup plus simple et fiable. */
    .precogn-split { display: flex; align-items: flex-start; gap: 20px; }
    .precogn-main { flex: 1 1 auto; min-width: 0; position: relative; }
    .precogn-communicator {
      flex: 0 0 380px;
      position: sticky;
      top: 24px;
      height: calc(100vh - 48px);
      border: 1px solid #21442D;
      border-radius: 8px;
      overflow: hidden;
    }
    .precogn-communicator iframe { width: 100%; height: 100%; border: none; }
    @media (max-width: 900px) {
      .precogn-split { flex-direction: column; }
      .precogn-communicator { position: static; width: 100%; height: 520px; }
    }

    /* Header */
    .header {
      border-bottom: 1px solid #21442D;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .header .app-name {
      font-size: 14px;
      color: #00FF66;
      letter-spacing: 2px;
    }
    .header .org-name {
      font-size: 24px;
      font-weight: 300;
      margin: 4px 0;
    }
    .header .context-info {
      color: #21442D;
      font-size: 10px;
      margin-top: 4px;
    }
    .header .badge {
      font-size: 9px;
      color: #21442D;
      background: #11181C;
      padding: 2px 10px;
      border-radius: 10px;
      border: 1px solid #21442D;
    }
    
    /* Metrics */
    .metrics {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 8px;
      margin: 16px 0;
    }
    .metric {
      padding: 12px;
      border: 1px solid #21442D;
      border-radius: 4px;
      text-align: center;
      cursor: default;
    }
    .metric .value {
      font-size: 22px;
      color: #00FF66;
    }
    .metric .label {
      font-size: 10px;
      color: #7AAE92;
    }
    .metric .suggestion {
      font-size: 9px;
      color: #FFB300;
      margin-top: 4px;
    }
    
    /* Sections */
    .section {
      margin: 20px 0;
    }
    .section-title {
      color: #7AAE92;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-bottom: 1px solid #21442D;
      padding-bottom: 6px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
    }
    .section-title .count {
      color: #21442D;
      font-size: 10px;
    }
    .item {
      padding: 6px 12px;
      border-left: 2px solid #21442D;
      margin: 2px 0;
      cursor: pointer;
      transition: all 0.15s;
      font-size: 13px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .item:hover {
      background: #11181C;
      border-left-color: #00FF66;
    }
    .item .item-type {
      font-size: 9px;
      color: #21442D;
      background: #11181C;
      padding: 1px 8px;
      border-radius: 10px;
    }
    .item.evolution {
      border-left-color: #FFB300;
    }
    .item.evolution .item-type {
      color: #FFB300;
      border: 1px solid #FFB300;
    }
    .item.inconsistency {
      border-left-color: #FF5555;
    }
    /* Section Objets (carré bleu) — groupes PCG + détail de compte au clic (2026-08-13) */
    .brick-dot {
      display: inline-block;
      width: 9px;
      height: 9px;
      margin-right: 6px;
      border-radius: 2px;
      vertical-align: middle;
    }
    .brick-object { background: #4285F4; }
    .brick-flow { background: #ffffff; border: 1px solid #21442D; }
    .brick-rule {
      display: inline-block;
      width: 0; height: 0;
      margin-right: 6px;
      vertical-align: middle;
      border-left: 5px solid transparent;
      border-right: 5px solid transparent;
      border-bottom: 9px solid #FF4444;
    }
    .brick-time {
      display: inline-block;
      width: 8px; height: 8px;
      margin-right: 6px;
      vertical-align: middle;
      background: #CCFF00;
      transform: rotate(45deg);
    }
    #time-date-input {
      background: #11181C;
      color: #D8FFE5;
      border: 1px solid #21442D;
      border-radius: 6px;
      padding: 6px 10px;
      font-family: inherit;
      font-size: 13px;
    }
    .obj-group-label {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #4285F4;
      margin: 12px 0 4px;
      padding-left: 4px;
    }
    .obj-group-label:first-child { margin-top: 0; }
    .obj-detail {
      padding: 8px 12px 10px 20px;
      font-size: 11px;
      color: #7AAE92;
      white-space: pre-wrap;
      font-family: 'Roboto Mono', monospace;
      border-left: 2px solid #21442D;
      margin: -2px 0 4px;
    }
    .item.inconsistency .item-type {
      color: #FF5555;
      border: 1px solid #FF5555;
    }
    .item .evolve-btn {
      font-size: 9px;
      color: #00FF66;
      background: transparent;
      border: 1px solid #00FF66;
      border-radius: 10px;
      padding: 0 10px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .item .evolve-btn:hover {
      background: #00FF66;
      color: #0B0F10;
    }
    .empty {
      color: #21442D;
      font-size: 12px;
      padding: 8px 12px;
    }
    
    /* Modules */
    .modules {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin: 16px 0;
      padding: 12px;
      border: 1px solid #21442D;
      border-radius: 4px;
    }
    .modules .module-btn {
      padding: 6px 14px;
      background: transparent;
      border: 1px solid #21442D;
      border-radius: 4px;
      color: #7AAE92;
      font-family: 'Roboto Mono', monospace;
      font-size: 11px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .modules .module-btn:hover {
      background: #00FF66;
      color: #0B0F10;
      border-color: #00FF66;
    }
    .modules .module-btn.evolution {
      border-color: #FFB300;
      color: #FFB300;
    }
    .modules .module-btn.evolution:hover {
      background: #FFB300;
      color: #0B0F10;
    }
    
    /* Brique Time (2026-08-03) — naviguer dans l'historique réel du patrimoine, un point par
       vrai constat de solde (jamais une date arbitraire ni interpolée). */
    .pm-time-badge {
      display: inline-flex; align-items: center; gap: 6px;
      margin-top: 16px; padding: 6px 12px;
      border: 1px solid #21442D; border-radius: 20px;
      cursor: pointer; font-size: 11px; color: #7AAE92;
      transition: border-color 0.15s, color 0.15s;
    }
    .pm-time-badge:hover { border-color: #FFB300; color: #FFB300; }
    .pm-time-diamond { color: #FFB300; font-size: 11px; }
    .pm-time-panel {
      display: none; margin-top: 10px; padding: 14px;
      background: #11181C; border: 1px solid #21442D; border-radius: 8px;
    }
    .pm-time-panel-title { font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: #7AAE92; margin-bottom: 8px; }
    .pm-time-dates { display: flex; flex-wrap: wrap; gap: 6px; }
    .pm-time-date-pill {
      padding: 5px 10px; border: 1px solid #21442D; border-radius: 14px;
      font-size: 11px; color: #D8FFE5; cursor: pointer; background: transparent;
      transition: border-color 0.15s, background 0.15s;
    }
    .pm-time-date-pill:hover { border-color: #FFB300; }
    .pm-time-date-pill.active { background: #FFB300; color: #0B0F10; border-color: #FFB300; }
    .pm-time-compare { margin-top: 12px; padding-top: 12px; border-top: 1px solid #21442D; }
    .pm-time-compare-total { font-size: 20px; font-weight: 600; color: #D8FFE5; }
    .pm-time-compare-delta { font-size: 12px; margin-top: 2px; }
    .pm-time-delta-up { color: #00FF66; }
    .pm-time-delta-down { color: #FF5555; }
    .pm-time-delta-flat { color: #7AAE92; }
    .pm-time-compte-row { display: flex; justify-content: space-between; padding: 3px 0; font-size: 11px; color: #7AAE92; }
    .pm-time-empty { font-size: 11px; color: #21442D; padding: 6px 0; }

    /* Footer */
    .footer {
      margin-top: 30px;
      padding-top: 12px;
      border-top: 1px solid #21442D;
      font-size: 10px;
      color: #21442D;
      display: flex;
      justify-content: space-between;
    }

    /* Vue Patrimoine — style application bancaire (2026-07-26) */
    .pm-card {
      background: #11181C;
      border: 1px solid #21442D;
      border-radius: 8px;
      padding: 12px 14px;
    }
    .pm-card-value { font-size: 16px; font-weight: 600; color: #D8FFE5; line-height: 1.3; }
    .pm-card-label { font-size: 10px; color: #7AAE92; margin-top: 2px; text-transform: uppercase; letter-spacing: 0.03em; }
    .pm-card-sub { font-size: 10px; color: #7AAE92; }
    .pm-card-alert { border-color: #FFB300; }
    .pm-card-alert .pm-card-value { color: #FFB300; }

    .pm-banks-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      gap: 10px;
      margin: 4px 0 12px;
    }
    .pm-bank-card {
      background: #11181C;
      border: 1px solid #21442D;
      border-radius: 8px;
      padding: 12px 14px;
      cursor: pointer;
      transition: border-color 0.15s;
    }
    .pm-bank-card:hover { border-color: #00FF66; }
    /* Ajouter un compte (2026-07-29, retour de Stéphane : le bouton + était "moche et mal
       placé") — petit carré bordé, cohérent avec .pm-bank-card ci-dessus, jamais un rectangle
       plein comme .pm-btn-secondary. */
    .pm-add-compte-btn {
      width: 36px; height: 36px; flex-shrink: 0;
      background: #11181C; border: 1px solid #21442D; border-radius: 8px;
      color: #7AAE92; font-size: 16px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: border-color 0.15s, color 0.15s;
    }
    .pm-add-compte-btn:hover { border-color: #00FF66; color: #00FF66; }
    .pm-bank-card-active { border-color: #00FF66; background: #182821; }
    .pm-bank-name { font-size: 12px; color: #7AAE92; margin-bottom: 4px; }
    .pm-bank-total { font-size: 17px; font-weight: 600; color: #D8FFE5; }
    .pm-bank-meta { font-size: 10px; color: #7AAE92; margin-top: 2px; }
    .pm-bank-status { font-size: 10px; margin-top: 6px; }

    .pm-compte-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 4px;
      border-bottom: 1px solid #182821;
      cursor: pointer;
      transition: background 0.1s;
    }
    .pm-compte-row:hover { background: #11181C; }
    .pm-compte-row:last-child { border-bottom: none; }
    .pm-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .pm-dot-ok { background: #00FF66; }
    .pm-dot-manual { background: #7AAE92; }
    .pm-dot-alert { background: #FFB300; }
    .pm-compte-numero {
      font-size: 10px;
      color: #7AAE92;
      background: #182821;
      border-radius: 4px;
      padding: 2px 6px;
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }
    .pm-compte-main { flex: 1; min-width: 0; }
    .pm-compte-nom { font-size: 13px; color: #D8FFE5; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pm-compte-etab { font-size: 10px; color: #7AAE92; }
    .pm-compte-nature { font-size: 10px; color: #7AAE92; width: 70px; flex-shrink: 0; text-transform: capitalize; }
    .pm-compte-solde { font-size: 13px; color: #D8FFE5; font-weight: 600; width: 110px; flex-shrink: 0; text-align: right; }
    .pm-compte-status { font-size: 10px; width: 70px; flex-shrink: 0; text-align: right; }

    .pm-status-ok { color: #00FF66; }
    .pm-status-manual { color: #7AAE92; }
    .pm-status-warn { color: #FFB300; }
    .pm-status { font-size: 11px; padding: 3px 8px; border-radius: 4px; background: #182821; display: inline-block; }

    .pm-input {
      flex: 1;
      min-width: 0;
      padding: 8px 10px;
      background: #0B0F10;
      border: 1px solid #21442D;
      border-radius: 6px;
      color: #D8FFE5;
      font-family: 'Roboto Mono', monospace;
      font-size: 12px;
    }
    .pm-btn {
      padding: 9px 14px;
      border: none;
      border-radius: 6px;
      font-family: 'Roboto Mono', monospace;
      font-size: 12px;
      cursor: pointer;
    }
    .pm-btn-primary { width: 100%; background: #00FF66; color: #0B0F10; font-weight: 600; }
    .pm-btn-secondary { background: #21442D; color: #D8FFE5; }
    .pm-automatiser-opt {
      padding: 8px 10px;
      font-size: 12px;
      color: #D8FFE5;
      cursor: pointer;
      border-radius: 4px;
    }
    .pm-automatiser-opt:hover { background: #182821; }
    /* Outputs (2026-07-29, retour de Stéphane : "trop agressif le fond du rectangle en couleur,
       le reste est classe et discret") — lien texte simple, jamais de fond coloré plein comme
       .pm-btn-secondary, cohérent avec .pm-automatiser-opt ci-dessus. */
    .pm-output-link {
      display: block;
      padding: 6px 10px;
      margin: 0 0 2px -10px;
      font-size: 13px;
      color: #D8FFE5;
      text-decoration: none;
      cursor: pointer;
      border-radius: 4px;
    }
    .pm-output-link:hover { background: #182821; }

    @media (max-width: 480px) {
      .pm-compte-nature { display: none; }
    }
  </style>
</head>
<body>
${context.sessionTokenToStore ? (
  // `location` ici est celle de l'iframe sandboxé Google, PAS l'URL réelle du navigateur
  // (piège déjà documenté ailleurs dans ce fichier) — impossible de nettoyer le loginToken
  // visible dans la barre d'adresse depuis ce script, seul le stockage de session compte ici.
  '<script>try { localStorage.setItem("structory_session", ' + JSON.stringify(context.sessionTokenToStore) + '); } catch (e) {}</script>'
) : ''}
${orgPanelHtml}
${flowWidgetHtml}
<div class="precogn-split">
<div class="precogn-main">
<div class="container">
  <div class="header">
    <div class="app-name"><a href="https://structory.ai" target="_blank" style="color:inherit;text-decoration:none;">${APP_NAME}</a></div>
    <div class="org-name" id="nav-org-name">${org.name}</div>
    <div class="context-info">
      <span class="badge">${contextInfo}</span>
      <span style="margin-left:12px;">${org.id}</span>
      <span style="margin-left:12px;">v${VERSION}</span>
    </div>
  </div>
  
  ${communicatorEmbedHtml}

  ${dashboard.comptesSection}

  ${outputsSectionHtml}

  ${dashboard.metrics.trim() ? `<div class="metrics">${dashboard.metrics}</div>` : ''}

  <div class="modules">
    ${modulesMenu}
  </div>

  ${dashboard.sections}

  <div class="pm-time-badge" id="pm-time-badge">
    <span class="pm-time-diamond">&#9670;</span>
    <span>Time</span>
    <span id="pm-time-now"></span>
  </div>
  <div id="pm-time-panel" class="pm-time-panel"></div>

  <div class="footer">
    <span>© Structory</span>
    <span>${new Date().toLocaleString()}</span>
  </div>
</div>
${gamePlaneHtml}</div>
${communicatorColumnHtml}
</div>

<script>
  // ============================================================
  // 4.100 NAVIGATOR - CLIENT SIDE JS
  // ============================================================
  
  // Récupération du sheetId depuis l'URL
  function getSheetId() {
    try {
      const params = new URLSearchParams(window.location.search);
      return params.get('sheetId') || params.get('id') || '';
    } catch (e) { return ''; }
  }
  
  const SHEET_ID = getSheetId();
  console.log('Navigator - SheetId:', SHEET_ID);
  const ORG_ID = ${JSON.stringify(orgId)};
  const MODULE_ID = ${JSON.stringify(moduleId)};
  // Badge visuel "DEMO" (retour de Stéphane, 2026-07-29) : depuis que smcdemo utilise de vrais
  // noms de banque (recherche/test réalistes), plus rien ne distinguait un compte smcdemo d'un
  // vrai compte smcspl à l'oeil — un suffixe injecté dans le NOM lui-même a été essayé puis
  // retiré le jour même (cassait la confirmation de suppression, qui exige de retaper le nom
  // exact). Purement visuel, jamais dans la donnée.
  const IS_DEMO_ORG = (ORG_ID === 'smcdemo');
  const DEMO_BADGE_HTML = '<span style="font-size:9px;color:#0B0F10;background:#FFB84D;padding:1px 6px;border-radius:8px;margin-left:6px;font-weight:600;vertical-align:middle;">DEMO</span>';
  const EB_PENDING = ${JSON.stringify(context.ebPending || '')};

  // ============================================================
  // OBJETS (carré bleu) — détail d'un compte au clic, accordéon inline (2026-08-13, retour de
  // Stéphane : la liste des comptes doit être une vraie surface consultable dans Navigator, pas
  // une réponse de chat). Chargé une seule fois par compte (dataset.loaded), pas de re-fetch au
  // second clic — juste un repli/dépli.
  // ============================================================
  function toggleAccountDetail(rowEl, compte, detailId) {
    const detailEl = document.getElementById(detailId);
    if (!detailEl) return;
    if (detailEl.style.display !== 'none') { detailEl.style.display = 'none'; return; }
    detailEl.style.display = 'block';
    if (detailEl.dataset.loaded === '1') return;
    detailEl.textContent = 'Chargement…';
    // Sentinelles __balance__/__grandlivre__ (section Flux, rond blanc) : mêmes accordéons que
    // les comptes (section Objets), mais une autre commande côté serveur.
    const runner = compte === '__balance__' ? 'getFlowBalance'
      : compte === '__grandlivre__' ? 'getFlowGrandLivre'
      : 'getAccountDetail';
    const call = google.script.run
      .withSuccessHandler(function (text) {
        detailEl.textContent = text;
        detailEl.dataset.loaded = '1';
      })
      .withFailureHandler(function (err) {
        detailEl.textContent = '❌ Erreur : ' + err.message;
      });
    if (runner === 'getAccountDetail') call.getAccountDetail(ORG_ID, compte);
    else if (runner === 'getFlowBalance') call.getFlowBalance(ORG_ID);
    else call.getFlowGrandLivre(ORG_ID);
  }

  // ============================================================
  // VUE PATRIMOINE — style application bancaire (2026-07-26)
  // Comprendre en moins de 3 secondes : combien, où, comment. Cartes de synthèse -> cartes
  // banque (cliquables) -> liste de comptes (lignes, pas de formulaire) -> panneau latéral pour
  // toute action (modifier solde, relancer une synchro).
  // ============================================================

  let PATRIMOINE_COMPTES = null;
  let TOTAL_EUR = null;
  let ACTIVE_BANK_FILTER = null;
  // Transmis de creerComptePuisEnableBanking à creerComptePanel — jamais un champ DOM caché
  // avec un id fixe (bug réel trouvé 2026-07-27 : deux créations enchaînées se retrouvaient
  // avec le MÊME enablebanking_account_uid, le deuxième champ ne remplaçant pas fiablement le
  // premier). Toujours remis à null à l'ouverture du formulaire générique.
  let PENDING_EB_ACCOUNT_UID = null;
  // Même principe que PENDING_EB_ACCOUNT_UID ci-dessus, pour Powens (2026-07-28).
  let PENDING_POWENS_ACCOUNT_ID = null;
  let SORT_BY = 'nom';

  // Tri de la liste des comptes (retour de Stéphane, 2026-07-27 : "trier soit par numéro, soit
  // par ordre alphabétique, soit par type de compte, soit par montant, soit par type
  // d'automatisation"). Le badge #numero (identifiant stable pour le support) reste affiché
  // sur chaque ligne quel que soit le tri choisi — seul l'ORDRE change, jamais l'identifiant.
  function _sortComptes(list) {
    const sorted = (list || []).slice();
    if (SORT_BY === 'numero') {
      sorted.sort(function (a, b) { return (a.numero || 999) - (b.numero || 999); });
    } else if (SORT_BY === 'nature') {
      sorted.sort(function (a, b) { return (a.nature || '').localeCompare(b.nature || '', 'fr') || (a.nom || '').localeCompare(b.nom || '', 'fr'); });
    } else if (SORT_BY === 'montant') {
      sorted.sort(function (a, b) { return Math.abs(b.solde || 0) - Math.abs(a.solde || 0); });
    } else if (SORT_BY === 'automatisation') {
      sorted.sort(function (a, b) { return (a.syncMode === 'api' ? 0 : 1) - (b.syncMode === 'api' ? 0 : 1) || (a.nom || '').localeCompare(b.nom || '', 'fr'); });
    } else {
      sorted.sort(function (a, b) { return (a.nom || '').localeCompare(b.nom || '', 'fr'); });
    }
    return sorted;
  }

  function changerTri(value) {
    SORT_BY = value;
    PATRIMOINE_COMPTES = _sortComptes(PATRIMOINE_COMPTES);
    renderPatrimoine();
  }
  let ACTIVE_ALERT_FILTER = false;

  function toggleAlertFilter() {
    ACTIVE_ALERT_FILTER = !ACTIVE_ALERT_FILTER;
    ACTIVE_BANK_FILTER = null;
    renderPatrimoine();
  }

  function _esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function _fmtMoney(v, devise) {
    return Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' ' + devise;
  }

  function _fmtMoneyShort(v, devise) {
    return Number(v || 0).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' ' + devise;
  }

  function _timeAgo(dateStr) {
    if (!dateStr) return null;
    // .split('/').join('-') plutôt qu'un .replace(regex) : une regex contenant des "/" au
    // milieu d'un <script> lui-même servi comme chaîne JSON imbriquée (HtmlService) s'est avérée
    // tronquée au moment du rendu réel (bug constaté 2026-07-26, cause exacte côté Apps Script
    // non identifiée) — cette forme sans regex évite complètement le problème.
    const then = new Date(dateStr.split('/').join('-'));
    const diffMin = Math.round((Date.now() - then.getTime()) / 60000);
    if (diffMin < 1) return "à l'instant";
    if (diffMin < 60) return 'il y a ' + diffMin + ' min';
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return 'il y a ' + diffH + 'h';
    const diffJ = Math.round(diffH / 24);
    return 'il y a ' + diffJ + 'j';
  }

  // Planning d'envoi configurable (2026-07-29, retour de Stéphane : "laisser au user le choix
  // de parametrer la frequence ? jour/hebdo/mensuel ? et l'heure d'envoi ?").
  const JOURS_SEMAINE = ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'];

  function _fmtHeure(h, m) {
    const hh = (h < 10 ? '0' : '') + h;
    const mm = (m < 10 ? '0' : '') + m;
    return hh + 'h' + mm;
  }

  function _fmtPlanning(schedule) {
    const heure = _fmtHeure(schedule.hour, schedule.minute);
    if (schedule.frequency === 'weekly') {
      return 'Envoi chaque ' + JOURS_SEMAINE[schedule.weekday] + ' a ' + heure + '.';
    }
    if (schedule.frequency === 'monthly') {
      return 'Envoi le ' + schedule.dayOfMonth + ' de chaque mois a ' + heure + '.';
    }
    return 'Envoi quotidien a ' + heure + '.';
  }

  function chargerPlanningRapport() {
    const info = document.getElementById('report-schedule-info');
    if (!info) return;
    google.script.run
      .withFailureHandler(function () { info.textContent = 'Planning : indisponible.'; })
      .withSuccessHandler(function (res) {
        if (!res || !res.success) { info.textContent = 'Planning : indisponible.'; return; }
        CURRENT_REPORT_SCHEDULE = res.schedule;
        info.textContent = _fmtPlanning(res.schedule);
      })
      .executorGetReportSchedule(ORG_ID);
  }

  function toggleReportScheduleForm() {
    const form = document.getElementById('report-schedule-form');
    if (!form) return;
    if (form.style.display === 'block') {
      form.style.display = 'none';
      return;
    }
    const s = CURRENT_REPORT_SCHEDULE || { frequency: 'daily', hour: 0, minute: 0 };
    const heureOptions = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 30) {
        const selected = (h === s.hour && m === s.minute) ? ' selected' : '';
        heureOptions.push('<option value="' + h + ':' + m + '"' + selected + '>' + _fmtHeure(h, m) + '</option>');
      }
    }
    const jourOptions = JOURS_SEMAINE.map(function (j, i) {
      const label = j.charAt(0).toUpperCase() + j.slice(1);
      return '<option value="' + i + '"' + (s.weekday === i ? ' selected' : '') + '>' + label + '</option>';
    }).join('');
    const moisOptions = [];
    for (let d = 1; d <= 28; d++) {
      moisOptions.push('<option value="' + d + '"' + (s.dayOfMonth === d ? ' selected' : '') + '>' + d + '</option>');
    }
    form.innerHTML =
      '<select id="rs-frequency" class="pm-input" style="margin-bottom:6px;">'
      + '<option value="daily"' + (s.frequency === 'daily' ? ' selected' : '') + '>Quotidien</option>'
      + '<option value="weekly"' + (s.frequency === 'weekly' ? ' selected' : '') + '>Hebdomadaire</option>'
      + '<option value="monthly"' + (s.frequency === 'monthly' ? ' selected' : '') + '>Mensuel</option>'
      + '</select>'
      + '<div id="rs-weekday-row" style="display:' + (s.frequency === 'weekly' ? 'block' : 'none') + ';margin-bottom:6px;">'
      + '<select id="rs-weekday" class="pm-input">' + jourOptions + '</select>'
      + '</div>'
      + '<div id="rs-dayofmonth-row" style="display:' + (s.frequency === 'monthly' ? 'block' : 'none') + ';margin-bottom:6px;">'
      + '<select id="rs-dayofmonth" class="pm-input">' + moisOptions.join('') + '</select>'
      + '</div>'
      + '<select id="rs-heure" class="pm-input" style="margin-bottom:6px;">' + heureOptions.join('') + '</select>'
      + '<button onclick="enregistrerPlanningRapport()" class="pm-btn pm-btn-primary" style="width:100%;">Enregistrer</button>'
      + '<div id="rs-status" style="font-size:11px;margin-top:4px;"></div>';
    form.style.display = 'block';
    document.getElementById('rs-frequency').addEventListener('change', function () {
      document.getElementById('rs-weekday-row').style.display = (this.value === 'weekly') ? 'block' : 'none';
      document.getElementById('rs-dayofmonth-row').style.display = (this.value === 'monthly') ? 'block' : 'none';
    });
  }

  function enregistrerPlanningRapport() {
    const status = document.getElementById('rs-status');
    const frequency = document.getElementById('rs-frequency').value;
    const heureParts = document.getElementById('rs-heure').value.split(':');
    const schedule = { frequency: frequency, hour: parseInt(heureParts[0], 10), minute: parseInt(heureParts[1], 10) };
    if (frequency === 'weekly') schedule.weekday = parseInt(document.getElementById('rs-weekday').value, 10);
    if (frequency === 'monthly') schedule.dayOfMonth = parseInt(document.getElementById('rs-dayofmonth').value, 10);
    status.textContent = 'Enregistrement...';
    status.style.color = '#7AAE92';
    google.script.run
      .withFailureHandler(function (err) {
        status.textContent = 'Erreur : ' + err.message;
        status.style.color = '#FF5555';
      })
      .withSuccessHandler(function (res) {
        if (!res || !res.success) {
          status.textContent = 'Erreur : ' + ((res && res.error) || 'echec');
          status.style.color = '#FF5555';
          return;
        }
        CURRENT_REPORT_SCHEDULE = res.schedule;
        document.getElementById('report-schedule-info').textContent = _fmtPlanning(res.schedule);
        status.textContent = 'Enregistre.';
        status.style.color = '#00FF66';
        setTimeout(function () {
          const form = document.getElementById('report-schedule-form');
          if (form) form.style.display = 'none';
        }, 900);
      })
      .executorSetReportSchedule(ORG_ID, schedule);
  }

  function renvoyerEmailMaintenant() {
    const statusEl = document.getElementById('output-email-status');
    if (!statusEl) return;
    statusEl.textContent = 'Envoi en cours...';
    google.script.run
      .withFailureHandler(function (err) {
        // Jamais "Erreur réseau" générique (retour de Stéphane, 2026-07-29 : "on l'a déjà dit"
        // — un message technique/alarmant sans dire quoi faire n'aide personne).
        statusEl.textContent = "Impossible d'envoyer l'email pour le moment. Réessaie dans un instant.";
      })
      .withSuccessHandler(function (res) {
        if (!res || !res.success) {
          statusEl.textContent = 'Erreur : ' + ((res && (res.error || res.sendError)) || 'inconnue');
          return;
        }
        statusEl.textContent = 'Envoye a ' + res.to + '.';
      })
      .executorSendReportNow(ORG_ID, MODULE_ID || undefined);
  }

  function loadPatrimoine() {
    if (!document.getElementById('patrimoine-cards')) return; // org sans section Comptes
    google.script.run
      .withSuccessHandler(function (result) {
        const subtitle = document.getElementById('patrimoine-subtitle');
        if (!result || !result.success) {
          if (subtitle) { subtitle.classList.remove('pm-loading'); subtitle.textContent = 'Erreur : ' + ((result && result.error) || 'inconnue'); }
          return;
        }
        // Les index du tableau servent de référence directe pour
        // openComptePanel(i)/PATRIMOINE_COMPTES[index] — voir _sortComptes/changerTri pour le
        // tri, jamais fait ailleurs pour rester synchronisé avec ces index.
        PATRIMOINE_COMPTES = _sortComptes(result.comptes || []);
        TOTAL_EUR = (result.totalEur !== undefined && result.totalEur !== null) ? result.totalEur : null;
        renderPatrimoine();
      })
      .withFailureHandler(function (err) {
        const subtitle = document.getElementById('patrimoine-subtitle');
        if (subtitle) { subtitle.classList.remove('pm-loading'); subtitle.textContent = 'Erreur : ' + err.message; }
      })
      .executorPatrimoineView(ORG_ID, MODULE_ID || undefined);
  }

  function renderPatrimoine() {
    const comptes = PATRIMOINE_COMPTES || [];

    // --- Sous-titre : nombre de comptes + dernière synchro la plus récente parmi les comptes API
    const lastSyncDates = comptes.filter(function (c) { return c.syncMode === 'api' && c.lastDate; }).map(function (c) { return c.lastDate; });
    const mostRecent = lastSyncDates.sort().slice(-1)[0];
    const syncLabel = mostRecent ? 'dernière synchronisation ' + _timeAgo(mostRecent) : 'aucune synchronisation encore';
    const subtitleEl = document.getElementById('patrimoine-subtitle');
    subtitleEl.classList.remove('pm-loading');
    subtitleEl.textContent = comptes.length + ' comptes · ' + syncLabel;

    // --- Cartes de synthèse
    // Total réellement consolidé en EUR (retour de Stéphane, 2026-07-26 : "un vrai état du
    // compte en euros qui cumule les euros et les US$ convertis" — l'ancien affichage "262 992
    // EUR dont 48 244 USD" laissait croire à tort que le second montant faisait partie du
    // premier, alors qu'ils n'étaient jamais additionnés). Conversion faite côté serveur
    // (executor::_fx_to_eur, taux BCE via frankfurter.app, même mécanisme que le total déjà
    // converti de l'email quotidien) — AFFICHAGE UNIQUEMENT, le journal ledger-cli lui-même ne
    // convertit toujours jamais entre devises (§0 ARCHITECTURE.md, règle intacte). La répartition
    // réelle par devise (non convertie) reste visible en dessous, jamais présentée comme un
    // sous-total inclus dans le chiffre du dessus.
    const totalsByDevise = {};
    comptes.forEach(function (c) { totalsByDevise[c.devise] = (totalsByDevise[c.devise] || 0) + (c.solde || 0); });
    const devisesTriees = Object.keys(totalsByDevise).sort(function (a, b) { return Math.abs(totalsByDevise[b]) - Math.abs(totalsByDevise[a]); });
    let patrimoineValueHtml = '—';
    if (devisesTriees.length) {
      patrimoineValueHtml = (TOTAL_EUR !== null)
        ? '≈ ' + _esc(_fmtMoneyShort(TOTAL_EUR, 'EUR'))
        : _esc(_fmtMoneyShort(totalsByDevise[devisesTriees[0]], devisesTriees[0]));
      if (devisesTriees.length > 1 || TOTAL_EUR !== null) {
        const repartition = devisesTriees.map(function (d) { return _fmtMoneyShort(totalsByDevise[d], d); }).join(' + ');
        patrimoineValueHtml += '<div style="font-size:11px;color:#7AAE92;font-style:italic;font-weight:400;margin-top:2px;">'
          + (TOTAL_EUR !== null ? 'converti depuis : ' : '')
          + _esc(repartition) + '</div>';
      }
    }
    const nApi = comptes.filter(function (c) { return c.syncMode === 'api'; }).length;
    const nManualDone = comptes.filter(function (c) { return c.syncMode === 'manual' && c.lastDate; }).length;
    const nAlerts = comptes.filter(function (c) { return !c.lastDate; }).length; // jamais renseigné, quel que soit le mode

    document.getElementById('patrimoine-cards').innerHTML =
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;">'
      + '<div class="pm-card" onclick="reinitialiserFiltres()" style="cursor:pointer;" title="Réinitialiser les filtres et tout afficher"><div class="pm-card-value">' + patrimoineValueHtml + '</div><div class="pm-card-label">Patrimoine</div></div>'
      + '<div class="pm-card"><div class="pm-card-value">' + comptes.length + '</div><div class="pm-card-label">Comptes</div></div>'
      + '<div class="pm-card"><div class="pm-card-value">' + nApi + ' <span class="pm-card-sub">auto</span> · ' + nManualDone + ' <span class="pm-card-sub">manuel</span></div><div class="pm-card-label">Synchro</div></div>'
      + '<div class="pm-card' + (nAlerts ? ' pm-card-alert' : '') + (ACTIVE_ALERT_FILTER ? ' pm-bank-card-active' : '') + '" onclick="toggleAlertFilter()" style="cursor:pointer;"><div class="pm-card-value">' + nAlerts + '</div><div class="pm-card-label">' + (nAlerts === 1 ? 'Alerte' : 'Alertes') + '</div></div>'
      + '</div>';

    // --- Cartes banque (regroupement par établissement)
    const byBank = {};
    const bankOrder = [];
    comptes.forEach(function (c) {
      const k = c.etablissement || '?';
      if (!byBank[k]) { byBank[k] = []; bankOrder.push(k); }
      byBank[k].push(c);
    });

    document.getElementById('patrimoine-banks').innerHTML = '<div class="pm-banks-grid">' + bankOrder.map(function (bank) {
      const list = byBank[bank];
      const totals = {};
      list.forEach(function (c) { totals[c.devise] = (totals[c.devise] || 0) + (c.solde || 0); });
      const label = Object.entries(totals).map(function (kv) { return _fmtMoneyShort(kv[1], kv[0]); }).join(' · ');
      const allApi = list.every(function (c) { return c.syncMode === 'api'; });
      const anyApi = list.some(function (c) { return c.syncMode === 'api'; });
      const statusLabel = allApi ? '✓ Synchronisé automatiquement' : (anyApi ? '◐ Partiellement automatique' : '⚠ Manuel');
      const statusClass = allApi ? 'pm-status-ok' : 'pm-status-warn';
      const isActive = ACTIVE_BANK_FILTER === bank;
      return '<div class="pm-bank-card' + (isActive ? ' pm-bank-card-active' : '') + '" onclick="toggleBankFilter(' + _esc(JSON.stringify(bank)) + ')">'
        + '<div class="pm-bank-name">' + _esc(bank) + (isActive ? ' ✕' : '') + '</div>'
        + '<div class="pm-bank-total">' + _esc(label) + '</div>'
        + '<div class="pm-bank-meta">' + list.length + (list.length > 1 ? ' comptes' : ' compte') + '</div>'
        + '<div class="pm-bank-status ' + statusClass + '">' + statusLabel + '</div>'
        + '</div>';
    }).join('') + '</div>';

    // --- Liste des comptes (lignes de consultation, pas de formulaire) — filtrée par banque si
    // une carte a été cliquée (toggleBankFilter). Les index utilisés par openComptePanel(i)
    // restent ceux du tableau PATRIMOINE_COMPTES complet (pas de la liste filtrée), pour rester
    // synchronisés avec le panneau latéral et la suppression.
    const visibleEntries = comptes
      .map(function (c, i) { return { c: c, i: i }; })
      .filter(function (entry) {
        if (ACTIVE_BANK_FILTER && entry.c.etablissement !== ACTIVE_BANK_FILTER) return false;
        if (ACTIVE_ALERT_FILTER && entry.c.lastDate) return false;
        return true;
      });

    // En-tête de colonnes cliquable avec flèche de tri (retour de Stéphane, 2026-07-27 : "une
    // petite flèche en haut de chaque colonne", le sélecteur seul n'était pas assez clair) —
    // mêmes largeurs de colonne que .pm-compte-row pour un alignement exact, voir la définition
    // CSS de .pm-compte-numero/.pm-compte-main/.pm-compte-nature/.pm-compte-solde/.pm-compte-status.
    const _flecheTri = function (cle) { return SORT_BY === cle ? ' ▾' : ''; };
    const enTeteHtml = '<div class="pm-compte-row" style="cursor:default;font-size:10px;color:#7AAE92;">'
      + '<span style="width:8px;flex-shrink:0;"></span>'
      // Jamais de backslash-apostrophe litteral dans un attribut onclick ici (bug reel trouve
      // 2026-07-27) : tout ce fichier vit dans le template literal de getNavigatorHTML, un
      // backslash-apostrophe tape dans le source est deja resolu par V8 (simple apostrophe nue,
      // le backslash disparait) avant meme de devenir le script du client -- casse la string JS
      // qui l'entoure. Patrimoine restait bloque sur "Chargement..." indefiniment. Entite HTML
      // &#39; a la place : decodee par le navigateur au parsing de l'attribut, jamais vue par V8.
      + '<span onclick="changerTri(&#39;numero&#39;)" style="cursor:pointer;flex-shrink:0;width:28px;">N°' + _flecheTri('numero') + '</span>'
      + '<span onclick="changerTri(&#39;nom&#39;)" style="cursor:pointer;flex:1;">Nom' + _flecheTri('nom') + '</span>'
      + '<span onclick="changerTri(&#39;nature&#39;)" style="cursor:pointer;width:70px;flex-shrink:0;">Type' + _flecheTri('nature') + '</span>'
      + '<span onclick="changerTri(&#39;montant&#39;)" style="cursor:pointer;width:110px;flex-shrink:0;text-align:right;">Montant' + _flecheTri('montant') + '</span>'
      + '<span onclick="changerTri(&#39;automatisation&#39;)" style="cursor:pointer;width:70px;flex-shrink:0;text-align:right;">Sync' + _flecheTri('automatisation') + '</span>'
      + '</div>';

    // Bandeau de filtre actif (retour de Stéphane, 2026-07-26 : cliquer "Alertes" faisait
    // disparaître tous les comptes sans qu'on comprenne pourquoi ni comment revenir en
    // arrière) — visible et cliquable pour annuler, dès qu'un filtre réduit la liste à rien
    // ou moins que le total.
    const filtreActifHtml = (ACTIVE_BANK_FILTER || ACTIVE_ALERT_FILTER)
      ? '<div class="pm-compte-row" style="cursor:pointer;color:#00FF66;" onclick="reinitialiserFiltres()">'
        + '✕ Filtre actif (' + (ACTIVE_BANK_FILTER || 'alertes uniquement') + ') — cliquer pour tout afficher'
        + '</div>'
      : '';

    if (!visibleEntries.length) {
      document.getElementById('patrimoine-comptes').innerHTML = enTeteHtml + filtreActifHtml
        + '<div class="empty" style="padding:12px 0;">Aucun compte ne correspond à ce filtre.</div>';
      return;
    }

    document.getElementById('patrimoine-comptes').innerHTML = enTeteHtml + filtreActifHtml + visibleEntries.map(function (entry) {
      const c = entry.c, i = entry.i;
      const dotClass = c.syncMode === 'api' ? 'pm-dot-ok' : (c.lastDate ? 'pm-dot-manual' : 'pm-dot-alert');
      const statusLabel = c.syncMode === 'api' ? '✓ Auto' : (c.lastDate ? '✓ Manuel' : '⚠ À renseigner');
      const statusClass = c.syncMode === 'api' ? 'pm-status-ok' : (c.lastDate ? 'pm-status-manual' : 'pm-status-warn');
      return '<div class="pm-compte-row" data-bank="' + _esc(c.etablissement) + '" onclick="openComptePanel(' + i + ')">'
        + '<span class="pm-dot ' + dotClass + '"></span>'
        + (c.numero ? '<span class="pm-compte-numero">#' + c.numero + '</span>' : '')
        + '<div class="pm-compte-main">'
        + '<div class="pm-compte-nom">' + _esc(c.nom) + (IS_DEMO_ORG ? DEMO_BADGE_HTML : '') + '</div>'
        + '<div class="pm-compte-etab">' + _esc(c.etablissement) + '</div>'
        + '</div>'
        + '<div class="pm-compte-nature">' + _esc(c.nature) + '</div>'
        + '<div class="pm-compte-solde">' + _fmtMoney(c.solde, c.devise) + '</div>'
        + '<div class="pm-compte-status ' + statusClass + '">' + statusLabel + '</div>'
        + '</div>';
    }).join('');
  }

  function reinitialiserFiltres() {
    ACTIVE_BANK_FILTER = null;
    ACTIVE_ALERT_FILTER = false;
    renderPatrimoine();
  }

  function toggleBankFilter(bank) {
    ACTIVE_BANK_FILTER = (ACTIVE_BANK_FILTER === bank) ? null : bank;
    renderPatrimoine();
  }

  // --- Panneau latéral (seul endroit où on modifie quoi que ce soit)

  function closeComptePanel() {
    document.getElementById('compte-panel').style.display = 'none';
    document.getElementById('compte-panel-overlay').style.display = 'none';
  }

  function openAjouterComptePanel() {
    PENDING_EB_ACCOUNT_UID = null;
    PENDING_POWENS_ACCOUNT_ID = null;
    const panel = document.getElementById('compte-panel');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;">'
      + '<div style="font-size:16px;font-weight:600;color:#D8FFE5;">➕ Ajouter un compte</div>'
      + '<span onclick="closeComptePanel()" style="cursor:pointer;color:#7AAE92;font-size:18px;line-height:1;">✕</span>'
      + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:8px;">'
      + _labeledField('Établissement (ex. Fintra)', 'new-compte-etablissement', '')
      + _labeledField('Titulaire (ex. Julien)', 'new-compte-titulaire', '')
      + _labeledField('Nom du compte (ex. Fintra Checking)', 'new-compte-nom', '')
      // Champs libres avec suggestions (pas une liste fermée, retour de Stéphane 2026-07-26 :
      // "ça peut être tout ce que souhaite l'organisation", ex. crypto, devises non listées).
      + _labeledField('Type de compte (ex. courant, crypto...)', 'new-compte-nature', '', 'new-compte-nature-suggestions')
      + '<datalist id="new-compte-nature-suggestions">'
      + '<option value="courant"><option value="épargne"><option value="titres">'
      + '<option value="assurance_vie"><option value="retraite"><option value="crypto">'
      + '</datalist>'
      + _labeledField('Devise (ex. EUR, USD, BTC...)', 'new-compte-devise', '', 'new-compte-devise-suggestions')
      + '<datalist id="new-compte-devise-suggestions">'
      + '<option value="EUR"><option value="USD"><option value="GBP"><option value="CHF">'
      + '<option value="CNY"><option value="BTC"><option value="ETH">'
      + '</datalist>'
      + _labeledField('Solde initial (optionnel)', 'new-compte-solde', '')
      + _labeledField('IBAN (optionnel)', 'new-compte-iban', '')
      + '<button id="creer-compte-btn" onclick="creerComptePanel()" class="pm-btn pm-btn-primary" style="margin-top:8px;">Créer</button>'
      + '<div id="panel-status" style="font-size:11px;min-height:16px;"></div>'
      + '</div>';
    panel.style.display = 'block';
    document.getElementById('compte-panel-overlay').style.display = 'block';
  }

  function creerComptePanel() {
    const status = document.getElementById('panel-status');
    const etablissement = (document.getElementById('new-compte-etablissement').value || '').trim();
    const titulaire = (document.getElementById('new-compte-titulaire').value || '').trim();
    const nom = (document.getElementById('new-compte-nom').value || '').trim();
    const nature = document.getElementById('new-compte-nature').value;
    const devise = document.getElementById('new-compte-devise').value;
    const soldeRaw = (document.getElementById('new-compte-solde').value || '').trim().replace(',', '.');
    const iban = (document.getElementById('new-compte-iban').value || '').trim();
    const enablebankingAccountUid = PENDING_EB_ACCOUNT_UID || undefined;
    PENDING_EB_ACCOUNT_UID = null;
    const powensAccountId = PENDING_POWENS_ACCOUNT_ID || undefined;
    PENDING_POWENS_ACCOUNT_ID = null;

    if (!etablissement || !titulaire || !nom) {
      status.textContent = '⚠️ Établissement, titulaire et nom sont requis';
      status.style.color = '#FF5555';
      return;
    }
    // Bouton désactivé + relabellé pendant l'appel (retour de Stéphane, 2026-07-31 : "on clique
    // et le user ne sait pas que sa demande a été prise en compte") — la petite ligne de statut
    // texte seule n'était pas assez visible, surtout quand l'appel prend plusieurs secondes
    // (cache Analyzor froid). Réactivé à CHAQUE point de sortie en erreur ci-dessous, jamais
    // laissé bloqué si un appel échoue.
    const creerBtn = document.getElementById('creer-compte-btn');
    if (creerBtn) { creerBtn.disabled = true; creerBtn.textContent = '⏳ Création en cours…'; }
    function _reenableCreerBtn() {
      if (creerBtn) { creerBtn.disabled = false; creerBtn.textContent = 'Créer'; }
    }
    status.textContent = '⏳ Récupération du dossier...';
    status.style.color = '#7AAE92';

    google.script.run
      .withSuccessHandler(function (folderResult) {
        if (!folderResult || !folderResult.success) {
          status.textContent = '❌ Dossier Drive introuvable pour cette org';
          status.style.color = '#FF5555';
          _reenableCreerBtn();
          return;
        }
        status.textContent = '⏳ Création du compte...';
        google.script.run
          .withSuccessHandler(function (result) {
            if (!result || !result.success) {
              status.textContent = '❌ ' + ((result && result.errorCode) || 'échec');
              status.style.color = '#FF5555';
              _reenableCreerBtn();
              return;
            }
            const solde = parseFloat(soldeRaw);
            const finish = function (msg, delay) {
              status.textContent = msg;
              status.style.color = '#00FF66';
              setTimeout(function () { closeComptePanel(); loadPatrimoine(); }, delay);
            };
            if (soldeRaw && !isNaN(solde)) {
              google.script.run
                .withSuccessHandler(function () { finish('✅ Compte créé — retour à la liste…', 1100); })
                // Le compte est créé même si le solde initial échoue à se poster — rafraîchir quand même.
                .withFailureHandler(function () { finish('✅ Compte créé (solde initial non enregistré) — retour…', 1400); })
                .executorBalancePoint(ORG_ID, { etablissement: etablissement, nature: nature, titulaire: titulaire, devise: devise, solde: solde });
            } else if (powensAccountId || enablebankingAccountUid) {
              // Compte lié via un connector (2026-07-28, retour de Stéphane : le solde restait
              // à 0 jusqu'à la prochaine synchronisation manuelle) — récupère le vrai solde
              // tout de suite au lieu d'attendre le prochain cycle automatique.
              status.textContent = '⏳ Récupération du solde...';
              google.script.run
                .withSuccessHandler(function () { finish('✅ Compte créé et synchronisé — retour à la liste…', 1100); })
                .withFailureHandler(function () { finish('✅ Compte créé (synchronisation initiale à refaire) — retour…', 1400); })
                .executorSyncOne(ORG_ID, { etablissement: etablissement, nature: nature, titulaire: titulaire || undefined, module: MODULE_ID || undefined });
            } else {
              finish('✅ Compte créé — retour à la liste…', 1100);
            }
          })
          .withFailureHandler(function (err) {
            status.textContent = '❌ ' + err.message;
            status.style.color = '#FF5555';
            _reenableCreerBtn();
          })
          .identityCreateCompte(ORG_ID, folderResult.folderId, {
            etablissement: etablissement, titulaire: titulaire, nom: nom, nature: nature, devise_origine: devise,
            iban: iban || undefined, enablebanking_account_uid: enablebankingAccountUid || undefined,
            powens_account_id: powensAccountId || undefined,
          });
      })
      .withFailureHandler(function (err) {
        status.textContent = '❌ ' + err.message;
        status.style.color = '#FF5555';
        _reenableCreerBtn();
      })
      .identityGetOrgFolderId(ORG_ID);
  }

  function openComptePanel(index) {
    const c = PATRIMOINE_COMPTES[index];
    if (!c) return;
    CURRENT_PANEL_COMPTE = c;
    CURRENT_CONNECTOR_MATCH = null;
    const panel = document.getElementById('compte-panel');
    const syncBadge = c.syncMode === 'api'
      ? '<span class="pm-status pm-status-ok">✓ Synchronisation automatique</span>'
      : '<span class="pm-status pm-status-warn">⚠ Saisie manuelle</span>';
    const lastSyncLine = c.lastDate ? 'Dernière mise à jour : ' + _timeAgo(c.lastDate) : 'Jamais renseigné';

    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">'
      + '<div style="font-size:16px;font-weight:600;color:#D8FFE5;">' + _esc(c.nom) + (IS_DEMO_ORG ? DEMO_BADGE_HTML : '') + '</div>'
      + '<span onclick="closeComptePanel()" style="cursor:pointer;color:#7AAE92;font-size:18px;line-height:1;">✕</span>'
      + '</div>'
      + '<div style="font-size:12px;color:#7AAE92;margin-bottom:16px;">' + (c.numero ? '#' + c.numero + ' · ' : '') + _esc(c.etablissement) + ' · ' + _esc(c.nature) + '</div>'
      + (c.iban ? '<div style="font-size:11px;color:#7AAE92;margin-bottom:10px;font-family:monospace;">' + _esc(c.iban) + '</div>' : '')
      + '<div style="font-size:28px;font-weight:600;color:#D8FFE5;margin-bottom:4px;">' + _fmtMoney(c.solde, c.devise) + '</div>'
      + '<div style="margin-bottom:6px;">' + syncBadge + '</div>'
      + '<div style="font-size:11px;color:#7AAE92;margin-bottom:6px;">' + lastSyncLine + '</div>'
      + (c.syncMode === 'api' ? '<div id="connector-detail-' + index + '" style="font-size:11px;color:#7AAE92;margin-bottom:14px;">Connector...</div>' : '<div style="margin-bottom:20px;"></div>')
      + (c.syncMode === 'api'
        ? '<button id="panel-sync-btn" onclick="lancerSyncCompte(' + index + ')" class="pm-btn pm-btn-primary">🔄 Lancer une synchronisation</button>'
        : '')
      // Saisie manuelle du solde repliée par défaut (retour de Stéphane, 2026-07-29 : "ça
      // pollue" — proposée de base à égalité avec le total/le statut, alors que c'est une
      // action secondaire) — même principe que ⚙ Automatiser/✏️ Modifier les informations
      // ci-dessous, jamais affichée avant d'être demandée.
      + '<div style="margin-top:' + (c.syncMode === 'api' ? '20px' : '0') + ';">'
      + '<button onclick="toggleModifierSolde(' + index + ')" class="pm-btn pm-btn-secondary" style="width:100%;">✏️ Modifier le solde manuellement</button>'
      + '<div id="modifier-solde-panel" style="display:none;margin-top:8px;">'
      + '<div style="display:flex;gap:6px;">'
      + '<input type="text" id="panel-solde-input" placeholder="Nouveau solde (' + _esc(c.devise) + ')" class="pm-input">'
      + '<button onclick="enregistrerSoldePanel(' + index + ')" class="pm-btn pm-btn-secondary">OK</button>'
      + '</div>'
      + '<div id="panel-status" style="font-size:11px;min-height:16px;margin-top:6px;"></div>'
      + '</div>'
      + '</div>'
      + '<div style="margin-top:20px;padding-top:16px;border-top:1px solid #21442D;">'
      // Libellé différent si un connector fonctionne déjà (retour de Stéphane, 2026-07-29 :
      // "je ne comprends pas pourquoi il relance alors que le connector existe déjà") — signale
      // que ce n'est PAS l'action attendue par défaut pour un compte déjà automatisé.
      + '<button onclick="toggleAutomatiserMenu()" class="pm-btn pm-btn-secondary" style="width:100%;">'
      + (c.syncMode === 'api' ? '🔁 Changer de connector' : '⚙ Automatiser') + '</button>'
      + '<div id="automatiser-menu" style="display:none;margin-top:8px;"></div>'
      + '</div>'
      + '<div style="margin-top:12px;">'
      + '<button onclick="toggleModifierCompte(' + index + ')" class="pm-btn pm-btn-secondary" style="width:100%;">✏️ Modifier les informations</button>'
      + '<div id="modifier-compte-panel" style="display:none;margin-top:8px;flex-direction:column;gap:8px;"></div>'
      + '</div>'
      + '<div style="margin-top:12px;">'
      + '<button onclick="supprimerComptePanel(' + index + ')" class="pm-btn pm-btn-secondary" style="width:100%;color:#FF8080;">🗑 Supprimer ce compte</button>'
      + '</div>';

    panel.style.display = 'block';
    document.getElementById('compte-panel-overlay').style.display = 'block';

    if (c.syncMode === 'api') {
      chargerConnectorDetail(index, c);
    }
  }

  // Affiche les caractéristiques du connector déjà actif sur ce compte (retour de Stéphane,
  // 2026-07-29 : "je devrais trouver le connector en cliquant sur le compte et voir ses
  // caractéristiques" — jusqu'ici invisible une fois le compte automatisé, seulement visible en
  // repassant par la recherche de banque). Jamais un nom de connector technique brut à
  // l'utilisateur ("connector_powens") — traduit en nom lisible.
  const CONNECTOR_FRIENDLY_NAMES = { connector_powens: 'Powens', connector_enablebanking: 'Enable Banking' };
  // Contexte du compte actuellement ouvert dans le panneau (retour de Stéphane, 2026-07-29 :
  // "je ne comprends pas pourquoi il relance alors que le connector existe déjà" — le menu
  // Automatiser ci-dessous ne savait jusqu'ici RIEN du compte depuis lequel il avait été ouvert,
  // il ne pouvait donc jamais avertir qu'un connector fonctionnel existait déjà). Réinitialisé à
  // chaque ouverture de panneau (openComptePanel).
  let CURRENT_PANEL_COMPTE = null;
  let CURRENT_CONNECTOR_MATCH = null;
  // Modèle canonique (2026-08-01, décision de Stéphane : "le modèle canonique de Structory" —
  // une API/un JSON ne doit jamais traverser directement une vue). executorConnectorFlow
  // renvoie déjà un objet Flow complet (icônes/labels/statuts, voir executor/core/flow.py) —
  // ce rendu ne fait plus QUE dessiner ce qu'on lui donne, il ne connaît plus lui-même la
  // séquence des étapes (avant : les 5 étapes étaient codées en dur ici ET dans le flow de
  // connexion ET dans le panneau de finalisation — 3 sources de vérité pour la même chose).
  function chargerConnectorDetail(index, c) {
    const el = document.getElementById('connector-detail-' + index);
    if (!el) return;
    CURRENT_CONNECTOR_MATCH = null;
    el.innerHTML = '<div style="font-size:11px;color:#7AAE92;">Connector…</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        const target = document.getElementById('connector-detail-' + index);
        CURRENT_CONNECTOR_MATCH = (res && res.connector && res.connector.status === 'active') ? res.connector : null;
        if (!target) return;
        if (!res || !res.success || !res.flow) {
          target.innerHTML = '<div style="font-size:11px;color:#7AAE92;">Connector : caractéristiques indisponibles pour le moment.</div>';
          return;
        }
        if (!CURRENT_CONNECTOR_MATCH) {
          target.innerHTML = '<div style="font-size:11px;color:#7AAE92;">Aucun connector actif pour ce compte.</div>';
          return;
        }
        // Le Flow ne connaît que ses MEMBRES et leurs RELATIONS (2026-08-01, retour de
        // Stéphane : "Node" venait des outils de graphe, pas du métier — un Connector n'est pas
        // un nœud, c'est un Connector — voir executor/core/flow.py) — PrecognFlow n'a besoin
        // que de id/icon/label/status par membre, il ignore le reste (atom/atomType/relations)
        // sans les connaître : c'est bien une VUE, pas le modèle.
        PrecognFlow.render(target, res.flow.members);
        res.flow.members.forEach(function (member) {
          PrecognFlow.setStatus(target, member.id, member.status);
        });
      })
      .withFailureHandler(function () {
        const target = document.getElementById('connector-detail-' + index);
        if (target) target.innerHTML = '<div style="font-size:11px;color:#7AAE92;">Connector : caractéristiques indisponibles pour le moment.</div>';
      })
      .executorConnectorFlow(ORG_ID, c.etablissement, c.nature, MODULE_ID || undefined);
  }

  // "Automatiser" (2026-07-26, Priorité 2 de Stéphane ; révisé le 2026-07-28, retour de
  // Stéphane après avoir testé Enable Banking/Powens lui-même : "une personne ne connaît pas et
  // se fout de enablebanking, powens ou autre c'est du chinois... lorsqu'on veut ajouter un
  // compte on cherche le nom de la banque"). Recherche par nom de banque, tous connectors
  // confondus (executorBanksSearch, fusion Powens+Enable Banking côté Executor) — jamais un nom
  // de connector affiché à l'utilisateur final. "Manuel" reste une option distincte, toujours
  // visible (ce n'est pas une banque à chercher).
  let AUTOMATISER_SEARCH_TIMER = null;
  let AUTOMATISER_BANK_RESULTS = [];
  let AUTOMATISER_SEARCH_SEQ = 0;
  let CURRENT_REPORT_SCHEDULE = null;

  function toggleAutomatiserMenu() {
    const menu = document.getElementById('automatiser-menu');
    if (!menu) return;
    if (menu.style.display === 'block') {
      menu.style.display = 'none';
      return;
    }
    // Avertissement si un connector fonctionne déjà pour ce compte (retour de Stéphane,
    // 2026-07-29) — sans ça, rechercher une banque ici a l'air d'être l'action normale même
    // pour un compte déjà automatisé, et rien n'indique que ça REMPLACERAIT la liaison active.
    const existingWarning = (CURRENT_PANEL_COMPTE && CURRENT_PANEL_COMPTE.syncMode === 'api')
      ? '<div style="font-size:11px;color:#FFB84D;margin-bottom:8px;padding:6px 8px;background:#2A2010;border-radius:4px;">'
        + '⚠ Un connector fonctionne déjà pour ce compte'
        + (CURRENT_CONNECTOR_MATCH ? ' (' + (CONNECTOR_FRIENDLY_NAMES[CURRENT_CONNECTOR_MATCH.interface] || CURRENT_CONNECTOR_MATCH.interface) + ')' : '')
        + '. Choisir une banque ci-dessous ne fait que RETROUVER un connector compatible établissement/nature'
        + ' — ça ne remplace pas la liaison déjà active, sauf si tu attaches un nouvel identifiant de compte à cette fiche.'
        + '</div>'
      : '';
    menu.innerHTML = existingWarning
      + '<div id="automatiser-gate-check" style="font-size:12px;color:#7AAE92;padding:4px 2px;">Vérification des connecteurs disponibles…</div>';
    menu.style.display = 'block';

    // Ne jamais laisser l'utilisateur chercher/choisir une banque si AUCUN connector n'est
    // configuré pour l'organisation (retour de Stéphane, 2026-08-04 : "s'il ne peut marcher
    // qu'après [la config Powens], il ne faut pas permettre au user d'y accéder avant") — la
    // recherche de banque réussissait déjà, l'échec n'arrivait qu'après avoir choisi une
    // banque, en plein milieu du parcours. Vérifié une fois à l'ouverture du menu, jamais à
    // chaque frappe (coût réseau).
    google.script.run
      .withSuccessHandler(function (res) {
        const names = (res && res.secretNames) || [];
        // 'enablebanking_sandbox_credentials' NE COMPTE PAS : ne peut jamais lier de vraie
        // banque (Mock ASPSP uniquement) — même règle que le badge de OrgPanel.html, qui ne
        // l'affiche jamais comme "configuré ✓" non plus.
        const hasConnector = names.indexOf('powens_credentials') >= 0
          || names.indexOf('enablebanking_selfservice_credentials') >= 0;
        _opRenderAutomatiserMenu(menu, existingWarning, hasConnector);
      })
      .withFailureHandler(function () {
        // Vérification indisponible : ne jamais bloquer sur une panne de CETTE vérification
        // seule, le parcours normal (recherche/choix) gère déjà ses propres erreurs.
        _opRenderAutomatiserMenu(menu, existingWarning, true);
      })
      .analyzorListSecrets(ORG_ID);
  }

  function _opRenderAutomatiserMenu(menu, existingWarning, hasConnector) {
    if (!hasConnector) {
      menu.innerHTML = existingWarning
        + '<div style="font-size:12px;color:#d1d5db;padding:8px 2px;line-height:1.5;">'
        + 'Aucun connecteur (Powens ou Enable Banking) n&#8217;est encore configuré pour cette organisation — '
        + 'la recherche de banque ne peut pas fonctionner tant que ça n&#8217;est pas fait.<br><br>'
        + 'Configure-en un dans le panneau <b>Mon organisation</b> (rond en haut à droite) → <b>Connecteurs</b>, '
        + 'ou saisis ce compte manuellement en attendant :'
        + '</div>'
        + '<div class="pm-automatiser-opt" style="cursor:pointer;" onclick="choisirAutomatiserManuel()">Manuel (saisie à la main)</div>';
      return;
    }
    menu.innerHTML = existingWarning
      + '<input type="text" id="automatiser-bank-search" class="pm-input" placeholder="Rechercher ta banque..." style="margin-bottom:6px;">'
      + '<div id="automatiser-bank-results"></div>'
      + '<div class="pm-automatiser-opt" style="cursor:pointer;" onclick="choisirAutomatiserManuel()">Manuel (saisie à la main)</div>'
      + '<div id="automatiser-detail" style="display:none;font-size:12px;color:#7AAE92;margin:6px 0 10px;padding:0 2px;line-height:1.4;"></div>';
    document.getElementById('automatiser-bank-search').addEventListener('input', function () {
      const q = this.value.trim();
      clearTimeout(AUTOMATISER_SEARCH_TIMER);
      const results = document.getElementById('automatiser-bank-results');
      // Vide le panneau de détail à chaque nouvelle frappe (bug réel trouvé 2026-07-28, retour
      // de Stéphane : "il semble avoir gardé bcp" — le formulaire/statut de la banque
      // précédemment choisie restait affiché pendant une nouvelle recherche, source de
      // confusion). Toujours reset avant de chercher autre chose.
      const detail = document.getElementById('automatiser-detail');
      if (detail) { detail.style.display = 'none'; detail.innerHTML = ''; }
      if (q.length < 2) {
        if (results) results.innerHTML = '';
        return;
      }
      AUTOMATISER_SEARCH_TIMER = setTimeout(function () { rechercherBanque(q); }, 300);
    });
  }

  function rechercherBanque(query) {
    const results = document.getElementById('automatiser-bank-results');
    if (!results) return;
    // Indicateur plus visible (retour de Stéphane, 2026-08-01 : "aucune info sur une recherche
    // en cours juste un délai très très long") — un simple mot en texte plat se remarquait mal,
    // surtout sur un appel qui peut prendre plusieurs secondes (catalogue Powens/Enable Banking
    // non caché). Le vrai correctif de fond (mise en cache des secrets, lecture Drive parallèle)
    // est côté Analyzor/Executor, voir leurs CLAUDE.md — ceci reste nécessaire dans tous les cas.
    results.innerHTML = '<div style="font-size:12px;color:#00FF66;padding:4px 2px;">🔎 Recherche en cours…</div>';
    // Jeton de séquence (bug réel trouvé 2026-07-29, retour de Stéphane : "aucune banque
    // trouvée... puis ça apparaît" en tapant "credit mutuel") — plusieurs recherches lancées
    // pendant la frappe peuvent revenir dans le désordre (la réponse d'une recherche COURTE,
    // ex. "credit", peut arriver APRÈS celle d'une recherche plus longue et déjà obsolète) :
    // on n'applique le résultat que s'il correspond encore à la DERNIÈRE recherche lancée.
    const seq = ++AUTOMATISER_SEARCH_SEQ;
    google.script.run
      .withSuccessHandler(function (res) {
        if (seq !== AUTOMATISER_SEARCH_SEQ) return;
        AUTOMATISER_BANK_RESULTS = (res && res.banks) || [];
        if (!AUTOMATISER_BANK_RESULTS.length) {
          results.innerHTML = '<div style="font-size:12px;color:#7AAE92;padding:4px 2px;">Aucune banque trouvée pour le moment.</div>';
          return;
        }
        results.innerHTML = AUTOMATISER_BANK_RESULTS.map(function (b, i) {
          // Logo de la banque (retour de Stéphane, 2026-08-01 : "les logos des banques
          // devraient apparaître pour montrer tout le choix existant") — fourni par Enable
          // Banking pour ses ASPSPs, jamais par Powens (aucun champ logo documenté dans son
          // API) : repli sur une icône générique dans ce cas, jamais un logo inventé.
          const logoHtml = b.logo
            ? '<img src="' + _esc(b.logo) + '" style="width:22px;height:22px;border-radius:4px;object-fit:contain;background:#fff;flex-shrink:0;" onerror="this.style.display=&quot;none&quot;;this.nextSibling.style.display=&quot;inline&quot;;">'
              + '<span style="display:none;font-size:16px;flex-shrink:0;">🏦</span>'
            : '<span style="font-size:16px;flex-shrink:0;">🏦</span>';
          return '<div class="pm-automatiser-opt" style="cursor:pointer;display:flex;align-items:center;gap:8px;" onclick="choisirBanqueAutomatiser(' + i + ')">'
            + logoHtml + '<span>' + _esc(b.name) + '</span></div>';
        }).join('');
      })
      // Jamais "Erreur réseau" générique ici (retour de Stéphane, 2026-07-29 : "on l'a déjà
      // dit") — recherche indisponible n'est pas la même chose que "rien trouvé", mais aucun
      // des deux ne doit jamais alarmer l'utilisateur avec du jargon technique.
      .withFailureHandler(function () {
        if (seq !== AUTOMATISER_SEARCH_SEQ) return;
        results.innerHTML = '<div style="font-size:12px;color:#7AAE92;padding:4px 2px;">Recherche indisponible pour le moment. Réessaie dans un instant.</div>';
      })
      .executorBanksSearch(ORG_ID, query);
  }

  function choisirAutomatiserManuel() {
    const detail = document.getElementById('automatiser-detail');
    if (!detail) return;
    detail.style.display = 'block';
    detail.textContent = '✓ Manuel : modifie le solde directement ci-dessus.';
  }

  // Banque actuellement choisie dans Automatiser (2026-07-31) — nécessaire pour la reprise
  // d'erreur du Flow visible ("essayer l'autre connecteur"), qui a besoin de retrouver le nom
  // exact de la banque après un échec, indépendamment de l'index dans AUTOMATISER_BANK_RESULTS.
  let CURRENT_AUTOMATISER_BANK = null;

  function choisirBanqueAutomatiser(i) {
    const bank = AUTOMATISER_BANK_RESULTS[i];
    if (!bank) return;
    CURRENT_AUTOMATISER_BANK = bank;
    const detail = document.getElementById('automatiser-detail');
    if (!detail) return;
    detail.style.display = 'block';

    // Retour visuel clair sur la banque choisie (bug réel trouvé 2026-07-29, retour de
    // Stéphane : "rien ne se passe quand j'ai choisi", la liste des résultats restait affichée
    // sans indiquer lequel avait été sélectionné) — le champ de recherche affiche maintenant le
    // nom choisi et la liste des autres résultats se referme.
    const searchInput = document.getElementById('automatiser-bank-search');
    if (searchInput) searchInput.value = bank.name;
    const results = document.getElementById('automatiser-bank-results');
    if (results) results.innerHTML = '';

    const natureWarning = _natureAutomatiserWarning(bank);

    if (bank.connector === 'powens') {
      // Connector "Automatiser" réel (2026-07-28) — connecte de VRAIES banques (voir
      // connector_powens.py) : pas besoin d'email, la connexion se fait via une webview Powens
      // (choix de la banque déjà connu, identifiants bancaires réels côté Powens).
      detail.innerHTML = natureWarning
        + '<button onclick="lancerLiaisonPowens()" class="pm-btn pm-btn-primary" style="width:100%;">Connecter ' + _esc(bank.name) + '</button>';
      return;
    }
    // connector === 'enablebanking' : n'apparaît dans la recherche QUE si l'org a configuré des
    // identifiants de production (voir Executor::_enablebanking_bank_list) — jamais le mode
    // test/sandbox ici, cette recherche ne propose que des banques réellement connectables.
    detail.innerHTML = natureWarning
      + '<input type="text" id="eb-email" placeholder="Ton email" class="pm-input" style="margin-bottom:6px;">'
      + '<button onclick="lancerLiaisonEnableBanking(' + _esc(JSON.stringify(bank.aspspName)) + ',' + _esc(JSON.stringify(bank.aspspCountry || '')) + ')" class="pm-btn pm-btn-primary" style="width:100%;">Connecter ' + _esc(bank.name) + '</button>'
      + '<div id="eb-status" style="font-size:11px;color:#FF8080;margin-top:4px;"></div>';
  }

  // Retour de Stéphane, 2026-07-29 : "credit mutuel ne permet pas la synchro des comptes
  // assurances vie ou livret". Vérifié empiriquement sur les comptes réels de smcspl : SEULS les
  // comptes de nature "courant" chez Crédit Mutuel portent un enablebanking_account_uid, tous les
  // livrets/LDD/assurance vie en sont dépourvus — limitation du périmètre PSD2 accordé par la
  // banque à l'agrégateur, pas un bug corrigeable côté nous. Avertissement au moment du choix de
  // la banque plutôt que de laisser l'utilisateur découvrir l'échec après coup.
  function _natureAutomatiserWarning(bank) {
    const nature = CURRENT_PANEL_COMPTE && CURRENT_PANEL_COMPTE.nature;
    if (!nature || nature === 'courant') return '';
    const nomNormalise = (bank.name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    if (nomNormalise.indexOf('credit mutuel') === -1) return '';
    return '<div style="font-size:11px;color:#FFB84D;margin-bottom:8px;padding:6px 8px;background:#2A2010;border-radius:4px;">'
      + '⚠ Chez Crédit Mutuel, les comptes épargne/assurance vie ne sont généralement pas synchronisables automatiquement (limitation vérifiée de la banque, pas de nous) — la saisie manuelle reste la meilleure option pour ce type de compte.'
      + '</div>';
  }

  // ============================================================
  // FLOW VISIBLE (2026-07-31, retour de Stéphane : "au lieu de masquer les traitements, tu les
  // rends visibles" — voir precogn.org/test, Objects/Flows/Time/Rules). Remplace les messages
  // "⏳ ..."/"❌ ..." en texte plat par les briques PrecognFlow (Banque -> Connecteur -> Auth ->
  // Comptes -> Solde) : chaque étape s'allume au fur et à mesure, une étape en échec
  // devient rouge et propose une vraie reprise (réessayer / autre connecteur / manuel) au lieu
  // d'un message d'erreur qui ressemble à un plantage de l'app.
  // ============================================================
  const AUTOMATISER_CONNECTOR_LABELS = { powens: 'Powens', enablebanking: 'Enable Banking' };

  function _startAutomatiserFlow(connectorType) {
    const detail = document.getElementById('automatiser-detail');
    if (!detail) return null;
    detail.innerHTML = '<div id="automatiser-flow"></div>'
      + '<div id="automatiser-flow-status" style="margin-top:10px;font-size:11px;color:#7AAE92;"></div>';
    const flowEl = document.getElementById('automatiser-flow');
    PrecognFlow.render(flowEl, [
      { id: 'banque', icon: '🏦', label: 'Banque' },
      { id: 'connecteur', icon: '🔌', label: AUTOMATISER_CONNECTOR_LABELS[connectorType] || connectorType },
      { id: 'auth', icon: '🔐', label: 'Auth' },
      { id: 'comptes', icon: '📥', label: 'Comptes' },
      { id: 'solde', icon: '💰', label: 'Solde' }
    ]);
    PrecognFlow.setStatus(flowEl, 'banque', 'success');
    PrecognFlow.setStatus(flowEl, 'connecteur', 'success');
    PrecognFlow.setStatus(flowEl, 'auth', 'active');
    return flowEl;
  }

  // Reprise d'erreur générique : "réessayer" (relance la même étape), "essayer l'autre
  // connecteur" (uniquement si une entrée alternative existe réellement pour ce nom de banque
  // exact, retrouvée via executorBanksSearchAll — jamais proposée en aveugle), "passer en
  // manuel" (repli déjà existant). Jamais de message brut d'un fournisseur tiers ici : le
  // paramètre message reste le texte déjà nettoyé côté Executor (_safe_upstream_error).
  function _showFlowError(flowEl, stepId, message, connectorType, retryFn) {
    if (!flowEl) return;
    PrecognFlow.setStatus(flowEl, stepId, 'error');
    const actions = [{ label: '🔄 Réessayer', onClick: retryFn }];
    const bank = CURRENT_AUTOMATISER_BANK;
    if (bank) {
      const altConnector = connectorType === 'powens' ? 'enablebanking' : 'powens';
      google.script.run
        .withFailureHandler(function () {})
        .withSuccessHandler(function (res) {
          const alt = (res && res.banks || []).find(function (b) {
            return b.connector === altConnector && b.name.toLowerCase() === bank.name.toLowerCase();
          });
          if (!alt) return;
          actions.push({
            label: '🔁 Essayer ' + (AUTOMATISER_CONNECTOR_LABELS[altConnector] || altConnector) + ' à la place',
            onClick: function () { AUTOMATISER_BANK_RESULTS = [alt]; choisirBanqueAutomatiser(0); }
          });
          PrecognFlow.showRecovery(flowEl, message, actions);
        })
        .executorBanksSearchAll(ORG_ID, bank.name);
    }
    actions.push({ label: '✏️ Passer en manuel', onClick: choisirAutomatiserManuel });
    PrecognFlow.showRecovery(flowEl, message, actions);
  }

  function lancerLiaisonPowens() {
    const bankName = CURRENT_AUTOMATISER_BANK && CURRENT_AUTOMATISER_BANK.name;
    const flowEl = _startAutomatiserFlow('powens');
    if (!flowEl) return;

    // Réutilisation d'une connexion déjà existante pour CETTE banque (2026-08-06, retour de
    // Stéphane : "pour rechercher d'autres comptes il demande de rerentrer les identifiants
    // bcp alors qu'il les a déjà depuis la première recherche") — avant de relancer toute la
    // webview (donc un nouveau login banque), on vérifie si Powens a déjà des comptes pour
    // cette banque précise, toutes connexions confondues : si oui, saut direct à la
    // sélection, jamais de ré-authentification pour une banque déjà connectée.
    google.script.run
      .withSuccessHandler(function (existingResult) {
        const existingAccounts = (existingResult && existingResult.success && existingResult.accounts) || [];
        if (existingAccounts.length) {
          if (flowEl) {
            PrecognFlow.setStatus(flowEl, 'auth', 'success');
            PrecognFlow.setStatus(flowEl, 'comptes', 'success');
            PrecognFlow.setStatus(flowEl, 'solde', 'success');
          }
          if (CURRENT_PANEL_COMPTE && existingAccounts.length === 1 && !existingAccounts[0].alreadyLinked) {
            _autoAttacherComptePowens(CURRENT_PANEL_COMPTE, existingAccounts[0].id);
            return;
          }
          openFinaliserPowensPanel({ accounts: existingAccounts });
          return;
        }
        _demarrerWebviewPowens(flowEl);
      })
      .withFailureHandler(function () {
        // Vérification indisponible : ne bloque jamais le parcours normal derrière, on tente
        // la webview comme si aucune connexion existante n'avait été trouvée.
        _demarrerWebviewPowens(flowEl);
      })
      .executorPowensAccountsAll(ORG_ID, bankName || undefined);
  }

  function _demarrerWebviewPowens(flowEl) {
    google.script.run
      .withSuccessHandler(function (result) {
        if (!result || !result.success) {
          _showFlowError(flowEl, 'auth', (result && result.error) || 'Échec de connexion à Powens.', 'powens', lancerLiaisonPowens);
          return;
        }
        // Retour automatique (2026-07-28, retour de Stéphane : "bien trop compliqué pour un
        // user lambda" sur la version copier-coller) : l'app Powens "smc" n'autorise qu'une
        // seule redirect_uri exacte, https://structory.ai/ — cette page relaie maintenant le
        // connection_id à cette fenêtre via window.opener.postMessage (voir
        // structory-site/index.html) dès que la connexion bancaire est terminée, sans action
        // manuelle. Le champ de saisie reste en repli si le message n'arrive pas (bloqueur de
        // popup, fenêtre fermée avant le postMessage, etc.).
        window.addEventListener('message', function handler(event) {
          if (event.origin !== 'https://structory.ai') return;
          if (!event.data || event.data.source !== 'structory-powens-redirect') return;
          window.removeEventListener('message', handler);
          traiterConnexionPowens(event.data.connectionId);
        });
        window.open(result.url, '_blank');
        const statusEl = document.getElementById('automatiser-flow-status');
        if (statusEl) statusEl.innerHTML =
          '<div style="margin-bottom:6px;">En attente de ta connexion bancaire dans le nouvel onglet...</div>'
          + '<div style="margin-bottom:6px;">Si rien ne se passe une fois la connexion terminée, colle ici le lien affiché :</div>'
          + '<input type="text" id="powens-connection-input" class="pm-input" placeholder="https://structory.ai/?connection_id=..." style="margin-bottom:6px;">'
          + '<button onclick="validerConnexionPowens()" class="pm-btn pm-btn-secondary" style="width:100%;">Valider manuellement</button>'
          + '<div id="powens-connection-status" style="font-size:11px;margin-top:4px;"></div>';
      })
      .withFailureHandler(function (err) {
        _showFlowError(flowEl, 'auth', err.message, 'powens', lancerLiaisonPowens);
      })
      .executorPowensStartAuth(ORG_ID);
  }

  function traiterConnexionPowens(connectionIdOrUrl) {
    const flowEl = document.getElementById('automatiser-flow');
    if (flowEl) {
      PrecognFlow.setStatus(flowEl, 'auth', 'success');
      PrecognFlow.setStatus(flowEl, 'comptes', 'active');
      PrecognFlow.hideRecovery(flowEl);
    }
    const statusEl = document.getElementById('automatiser-flow-status');
    if (statusEl) statusEl.innerHTML = '';
    google.script.run
      .withSuccessHandler(function (result) {
        if (!result || !result.success) {
          _showFlowError(flowEl, 'comptes', (result && result.error) || 'Impossible de récupérer tes comptes.', 'powens',
            function () { traiterConnexionPowens(connectionIdOrUrl); });
          return;
        }
        if (flowEl) {
          PrecognFlow.setStatus(flowEl, 'comptes', 'success');
          PrecognFlow.setStatus(flowEl, 'solde', 'success');
        }
        const accounts = result.accounts || [];
        // Attache automatiquement SANS redemander (retour de Stéphane, 2026-08-01 : "alors que
        // de base j'ai cliqué sur créer un nouveau compte on me redemande ce que je veux faire
        // avec les nouveaux comptes trouvés") — si ce Automatiser a été ouvert depuis le panneau
        // d'un compte déjà existant (CURRENT_PANEL_COMPTE) ET qu'un seul compte Powens a été
        // trouvé, l'intention est déjà connue : l'attacher à CE compte, pas redemander. Ambigu
        // (plusieurs comptes trouvés) ou pas de contexte (venu de "+ Ajouter un compte") : le
        // choix reste nécessaire, panneau habituel inchangé.
        // Bug réel corrigé (2026-08-06, retour de Stéphane : cherchait à ajouter un compte
        // épargne BCP, le système a auto-attaché silencieusement le compte COURANT déjà
        // automatisé sans jamais vérifier qu'il l'était déjà) — jamais d'auto-attachement sur
        // un compte déjà "alreadyLinked" (voir Executor::_powens_already_linked_ids), même
        // seul dans la liste : dans ce cas il faut laisser voir que c'est déjà pris, pas faire
        // comme si un nouveau compte venait d'être trouvé.
        if (CURRENT_PANEL_COMPTE && accounts.length === 1 && !accounts[0].alreadyLinked) {
          _autoAttacherComptePowens(CURRENT_PANEL_COMPTE, accounts[0].id);
          return;
        }
        // Garde-fou réel (retour de Stéphane, 2026-08-01 : "j'avais trouvé trois comptes sur
        // swan, j'ai pas eu le temps de remplir que tu as fermé la fenêtre") — le retour de
        // Powens (postMessage) arrive de façon asynchrone, potentiellement APRÈS que
        // l'utilisateur a déjà quitté cet écran (ouvert "+ Ajouter un compte" pour un AUTRE
        // compte pendant l'attente, par exemple). Le panneau compte-panel est réutilisé pour plusieurs
        // vues différentes : écraser son contenu ici couperait net un formulaire en cours de
        // remplissage. Si l'écran Automatiser n'est plus affiché (flowEl détaché du DOM), on
        // n'écrase RIEN — l'utilisateur devra relancer la recherche pour retrouver ces comptes
        // (perte acceptée plutôt que de lui couper la main en plein remplissage).
        if (!flowEl || !flowEl.isConnected) return;
        openFinaliserPowensPanel(result);
      })
      .withFailureHandler(function (err) {
        _showFlowError(flowEl, 'comptes', err.message, 'powens', function () { traiterConnexionPowens(connectionIdOrUrl); });
      })
      .executorPowensLinkConnection(ORG_ID, String(connectionIdOrUrl));
  }

  function validerConnexionPowens() {
    const input = document.getElementById('powens-connection-input');
    const raw = (input && input.value || '').trim();
    if (!raw) {
      const status = document.getElementById('powens-connection-status');
      if (status) status.textContent = '⚠️ Colle le lien ou le numéro de connexion.';
      return;
    }
    traiterConnexionPowens(raw);
  }

  function lancerLiaisonEnableBanking(aspspName, aspspCountry) {
    const emailInput = document.getElementById('eb-email');
    const ebStatus = document.getElementById('eb-status');
    const email = (emailInput && emailInput.value || '').trim();
    if (!email || email.indexOf('@') === -1) {
      if (ebStatus) ebStatus.textContent = '⚠️ Email invalide';
      return;
    }
    const flowEl = _startAutomatiserFlow('enablebanking');
    if (!flowEl) return;
    google.script.run
      .withSuccessHandler(function (result) {
        if (!result || !result.success) {
          _showFlowError(flowEl, 'auth', (result && result.error) || 'Échec de connexion à Enable Banking.', 'enablebanking',
            function () { lancerLiaisonEnableBanking(aspspName, aspspCountry); });
          return;
        }
        // Redirection pleine page (contrairement à Powens) : Enable Banking ramène l'utilisateur
        // directement sur cette même URL Navigator via ?ebPending=, voir resolveContext — le
        // Flow ne peut pas animer la traversée de cette navigation, seul le départ (Auth=active)
        // est visible ; la suite (Comptes/Solde) s'affiche déjà "réussie" dans
        // openFinaliserEnableBankingPanel au retour.
        window.top.location.href = result.url;
      })
      .withFailureHandler(function (err) {
        _showFlowError(flowEl, 'auth', err.message, 'enablebanking',
          function () { lancerLiaisonEnableBanking(aspspName, aspspCountry); });
      })
      .executorEnableBankingStartAuth(ORG_ID, email, aspspName || undefined);
  }

  function toggleModifierSolde(index) {
    const box = document.getElementById('modifier-solde-panel');
    if (!box) return;
    if (box.style.display === 'block') {
      box.style.display = 'none';
      return;
    }
    box.style.display = 'block';
    const input = document.getElementById('panel-solde-input');
    if (input) input.focus();
  }

  function enregistrerSoldePanel(index) {
    const c = PATRIMOINE_COMPTES[index];
    const input = document.getElementById('panel-solde-input');
    const status = document.getElementById('panel-status');
    const raw = (input.value || '').trim().replace(',', '.');
    const solde = parseFloat(raw);
    if (!raw || isNaN(solde)) {
      status.textContent = '⚠️ Solde invalide';
      status.style.color = '#FF5555';
      return;
    }
    status.textContent = '⏳ Enregistrement...';
    status.style.color = '#7AAE92';
    google.script.run
      .withSuccessHandler(function (result) {
        if (!result || !result.success) {
          status.textContent = '❌ ' + ((result && result.error) || 'échec');
          status.style.color = '#FF5555';
          return;
        }
        status.textContent = '✅ Enregistré (écart ' + result.ecart + ') — retour à la liste…';
        status.style.color = '#00FF66';
        // solde (valeur saisie) plutôt que result.soldeNouveau seul : quand l'écart est nul,
        // ledger_api ne postait pas d'écriture et ne renvoyait pas soldeNouveau (bug réel trouvé
        // en usage, 2026-07-26, corrigé aussi côté ledger_api — mais garder ce repli ici rend le
        // client robuste même si un autre endpoint oublie un jour ce champ).
        c.solde = (result.soldeNouveau !== undefined && result.soldeNouveau !== null) ? result.soldeNouveau : solde;
        c.lastDate = new Date().toISOString().slice(0, 10).split('-').join('/');
        renderPatrimoine();
        // Retour automatique à la liste (2026-07-26, retour de Stéphane : "le retour ne se fait
        // pas naturellement") — délai court pour laisser voir la confirmation avant de fermer.
        setTimeout(closeComptePanel, 1100);
      })
      .withFailureHandler(function (err) {
        status.textContent = '❌ ' + err.message;
        status.style.color = '#FF5555';
      })
      .executorBalancePoint(ORG_ID, { etablissement: c.etablissement, nature: c.nature, titulaire: c.titulaire || undefined, produit: c.produit || undefined, devise: c.devise, solde: solde });
  }

  function supprimerComptePanel(index) {
    const c = PATRIMOINE_COMPTES[index];
    if (!c || !c.uid) return;
    // Retour de Stéphane, 2026-07-27 : "faut le rendre plus difficile à faire, c'est trop
    // tentant" — un simple OK/Annuler se clique trop facilement par réflexe. Demande de taper
    // le nom exact du compte, comme la confirmation de suppression d'un dépôt GitHub.
    // Aucune sequence d'echappement backslash litterale ici (2e bug de la meme classe que
    // changerTri ci-dessus, trouve le 2026-07-27) : tout ce fichier vit dans le template literal
    // de getNavigatorHTML, donc un backslash-n ou backslash-apostrophe tape dans le source EST
    // deja resolu par V8 (vrai retour a la ligne, ou apostrophe nue) avant meme de devenir le
    // script du client -- y compris a l'interieur d'un commentaire comme celui-ci. On utilise
    // donc String.fromCharCode(10) pour produire le saut de ligne a l'execution, jamais un
    // backslash-n litteral dans le source.
    const NL = String.fromCharCode(10);
    const saisie = prompt('Pour confirmer la suppression, tape exactement le nom du compte :' + NL + '"' + c.nom + '"' + NL + '(mis à la corbeille dans Drive, récupérable — pas définitif)');
    if (saisie !== c.nom) {
      if (saisie !== null) alert('Nom incorrect, suppression annulée.');
      return;
    }
    const status = document.getElementById('panel-status');
    status.textContent = '⏳ Suppression...';
    status.style.color = '#7AAE92';
    google.script.run
      .withSuccessHandler(function (folderResult) {
        if (!folderResult || !folderResult.success) {
          status.textContent = '❌ Dossier Drive introuvable pour cette org';
          status.style.color = '#FF5555';
          return;
        }
        google.script.run
          .withSuccessHandler(function (result) {
            if (!result || !result.success) {
              status.textContent = '❌ ' + ((result && result.errorCode) || 'échec');
              status.style.color = '#FF5555';
              return;
            }
            PATRIMOINE_COMPTES.splice(index, 1);
            closeComptePanel();
            renderPatrimoine();
          })
          .withFailureHandler(function (err) {
            status.textContent = '❌ ' + err.message;
            status.style.color = '#FF5555';
          })
          .identityDeleteCompte(ORG_ID, folderResult.folderId, c.uid);
      })
      .withFailureHandler(function (err) {
        status.textContent = '❌ ' + err.message;
        status.style.color = '#FF5555';
      })
      .identityGetOrgFolderId(ORG_ID);
  }

  // Champ avec libellé visible (retour de Stéphane, 2026-07-26 : "les champs ne sont pas
  // nommés donc on ne sait pas ce que c'est") — un placeholder seul devient invisible dès
  // qu'un champ est pré-rempli, donc insuffisant comme label pour un formulaire d'édition.
  // Le paramètre value est déjà échappé par l'appelant (_esc), jamais ré-échappé ici.
  function _labeledField(label, id, value, datalistId) {
    return '<div style="display:flex;flex-direction:column;gap:2px;">'
      + '<label for="' + id + '" style="font-size:10px;color:#7AAE92;">' + _esc(label) + '</label>'
      + '<input type="text" id="' + id + '" value="' + (value || '') + '"'
      + (datalistId ? ' list="' + datalistId + '"' : '')
      + ' class="pm-input">'
      + '</div>';
  }

  function toggleModifierCompte(index) {
    const c = PATRIMOINE_COMPTES[index];
    const box = document.getElementById('modifier-compte-panel');
    if (!box) return;
    if (box.style.display === 'flex') {
      box.style.display = 'none';
      return;
    }
    box.innerHTML =
      _labeledField('Établissement (nom de la banque)', 'edit-compte-etablissement', _esc(c.etablissement))
      + _labeledField('Titulaire (personne ou entité propriétaire)', 'edit-compte-titulaire', _esc(c.titulaire || ''))
      + _labeledField('Nom du compte', 'edit-compte-nom', _esc(c.nom))
      + _labeledField('Type de compte', 'edit-compte-nature', _esc(c.nature), 'new-compte-nature-suggestions')
      + _labeledField('Devise', 'edit-compte-devise', _esc(c.devise), 'new-compte-devise-suggestions')
      + _labeledField('IBAN', 'edit-compte-iban', _esc(c.iban || ''))
      + '<datalist id="new-compte-nature-suggestions">'
      + '<option value="courant"><option value="épargne"><option value="titres">'
      + '<option value="assurance_vie"><option value="retraite"><option value="crypto">'
      + '</datalist>'
      + '<datalist id="new-compte-devise-suggestions">'
      + '<option value="EUR"><option value="USD"><option value="GBP"><option value="CHF">'
      + '<option value="CNY"><option value="BTC"><option value="ETH">'
      + '</datalist>'
      + '<button onclick="enregistrerModifCompte(' + index + ')" class="pm-btn pm-btn-primary">Enregistrer</button>'
      + '<div id="modifier-status" style="font-size:11px;min-height:16px;"></div>';
    box.style.display = 'flex';
  }

  function enregistrerModifCompte(index) {
    const c = PATRIMOINE_COMPTES[index];
    const status = document.getElementById('modifier-status');
    const nouveauContenu = {
      etablissement: (document.getElementById('edit-compte-etablissement').value || '').trim(),
      titulaire: (document.getElementById('edit-compte-titulaire').value || '').trim(),
      nom: (document.getElementById('edit-compte-nom').value || '').trim(),
      nature: (document.getElementById('edit-compte-nature').value || '').trim(),
      devise_origine: (document.getElementById('edit-compte-devise').value || '').trim(),
      iban: (document.getElementById('edit-compte-iban').value || '').trim(),
    };
    status.textContent = '⏳ Enregistrement...';
    status.style.color = '#7AAE92';
    google.script.run
      .withSuccessHandler(function (folderResult) {
        if (!folderResult || !folderResult.success) {
          status.textContent = '❌ Dossier Drive introuvable pour cette org';
          status.style.color = '#FF5555';
          return;
        }
        google.script.run
          .withSuccessHandler(function (result) {
            if (!result || !result.success) {
              status.textContent = '❌ ' + ((result && result.errorCode) || 'échec');
              status.style.color = '#FF5555';
              return;
            }
            status.textContent = '✅ Enregistré — retour à la liste…';
            status.style.color = '#00FF66';
            setTimeout(function () { closeComptePanel(); loadPatrimoine(); }, 1100);
          })
          .withFailureHandler(function (err) {
            status.textContent = '❌ ' + err.message;
            status.style.color = '#FF5555';
          })
          .identityUpdateCompte(ORG_ID, folderResult.folderId, c.uid, nouveauContenu);
      })
      .withFailureHandler(function (err) {
        status.textContent = '❌ ' + err.message;
        status.style.color = '#FF5555';
      })
      .identityGetOrgFolderId(ORG_ID);
  }

  function lancerSyncCompte(index) {
    const c = PATRIMOINE_COMPTES[index];
    const btn = document.getElementById('panel-sync-btn');
    const status = document.getElementById('panel-status');
    btn.disabled = true;
    btn.textContent = '⏳ Synchronisation...';
    google.script.run
      .withSuccessHandler(function (result) {
        btn.disabled = false;
        btn.textContent = '🔄 Lancer une synchronisation';
        if (!result || !result.success) {
          status.textContent = '❌ ' + ((result && result.error) || 'échec');
          status.style.color = '#FF5555';
          return;
        }
        const point = (result.points || [])[0];
        if (point) {
          c.solde = (point.soldeNouveau !== undefined && point.soldeNouveau !== null) ? point.soldeNouveau : point.soldeActuel;
          c.lastDate = new Date().toISOString().slice(0, 10).split('-').join('/');
        }
        status.textContent = '✅ Synchronisé — retour à la liste…';
        status.style.color = '#00FF66';
        renderPatrimoine();
        setTimeout(closeComptePanel, 1100);
      })
      .withFailureHandler(function (err) {
        btn.disabled = false;
        btn.textContent = '🔄 Lancer une synchronisation';
        status.textContent = '❌ ' + err.message;
        status.style.color = '#FF5555';
      })
      .executorSyncOne(ORG_ID, { etablissement: c.etablissement, nature: c.nature, titulaire: c.titulaire || undefined, produit: c.produit || undefined, module: MODULE_ID || undefined });
  }

  // Brique Time (2026-08-03, retour de Stéphane : "il me manque la brique Time... naviguer
  // dans le time en fonction des précédentes positions existantes"). Horloge live (clin d'œil,
  // pas fonctionnel) + panneau déplié listant les vraies dates de constat, cliquables une à une
  // pour comparer le patrimoine à cette date avec aujourd'hui — jamais une date interpolée.
  var TIME_PANEL_OPEN = false;
  var TIME_DATES_LOADED = false;

  function _updateTimeNow() {
    var el = document.getElementById('pm-time-now');
    if (el) el.textContent = new Date().toLocaleString();
  }
  _updateTimeNow();
  setInterval(_updateTimeNow, 1000);

  function _renderTimeCompare(res, selectedDate) {
    var panel = document.getElementById('pm-time-panel');
    var existing = document.getElementById('pm-time-compare-block');
    if (existing) existing.remove();

    var block = document.createElement('div');
    block.id = 'pm-time-compare-block';
    block.className = 'pm-time-compare';

    if (!res || !res.success) {
      block.innerHTML = '<div class="pm-time-empty">Erreur : ' + ((res && res.error) || 'inconnue') + '</div>';
      panel.appendChild(block);
      return;
    }

    var delta = res.deltaEur;
    var deltaClass = Math.abs(delta) < 0.01 ? 'pm-time-delta-flat' : (delta > 0 ? 'pm-time-delta-up' : 'pm-time-delta-down');
    var deltaSign = delta > 0 ? '+' : '';
    var html = ''
      + '<div class="pm-card-label">Patrimoine au ' + selectedDate.split('/').join('-') + ' vs aujourd’hui</div>'
      + '<div class="pm-time-compare-total">' + res.totalEurAtDate.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' &euro;'
      + ' <span style="font-size:13px;color:#7AAE92;">&#8594; ' + res.totalEurNow.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' &euro;</span></div>'
      + '<div class="pm-time-compare-delta ' + deltaClass + '">' + deltaSign + delta.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' &euro;</div>';

    var moved = (res.comptes || []).filter(function (c) { return Math.abs(c.delta) >= 0.01; })
      .sort(function (a, b) { return Math.abs(b.delta) - Math.abs(a.delta); })
      .slice(0, 5);
    if (moved.length) {
      html += '<div style="margin-top:10px;">';
      moved.forEach(function (c) {
        var cClass = c.delta > 0 ? 'pm-time-delta-up' : 'pm-time-delta-down';
        var cSign = c.delta > 0 ? '+' : '';
        html += '<div class="pm-time-compte-row"><span>' + c.nom + '</span><span class="' + cClass + '">' + cSign + c.delta.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' ' + c.devise + '</span></div>';
      });
      html += '</div>';
    }
    block.innerHTML = html;
    panel.appendChild(block);
  }

  function _selectTimeDate(date) {
    var pills = document.querySelectorAll('.pm-time-date-pill');
    pills.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-date') === date); });
    google.script.run
      .withSuccessHandler(function (res) { _renderTimeCompare(res, date); })
      .withFailureHandler(function (err) { _renderTimeCompare({ success: false, error: err.message }, date); })
      .executorPatrimoineAt(ORG_ID, MODULE_ID || undefined, date);
  }

  function _loadTimeDates() {
    var panel = document.getElementById('pm-time-panel');
    panel.innerHTML = '<div class="pm-time-panel-title">Positions dans le temps</div><div class="pm-loading" style="font-size:11px;color:#7AAE92;">Chargement&hellip;</div>';
    google.script.run
      .withSuccessHandler(function (res) {
        if (!res || !res.success || !(res.dates || []).length) {
          panel.innerHTML = '<div class="pm-time-panel-title">Positions dans le temps</div><div class="pm-time-empty">Aucun historique encore — chaque saisie/synchro de solde en créera un.</div>';
          return;
        }
        var html = '<div class="pm-time-panel-title">Positions dans le temps</div><div class="pm-time-dates">';
        res.dates.forEach(function (d) {
          html += '<span class="pm-time-date-pill" data-date="' + d + '">' + d.split('/').join('-') + '</span>';
        });
        html += '</div>';
        panel.innerHTML = html;
        var pills = panel.querySelectorAll('.pm-time-date-pill');
        pills.forEach(function (p) {
          p.addEventListener('click', function () { _selectTimeDate(p.getAttribute('data-date')); });
        });
        TIME_DATES_LOADED = true;
      })
      .withFailureHandler(function (err) {
        panel.innerHTML = '<div class="pm-time-panel-title">Positions dans le temps</div><div class="pm-time-empty">Erreur : ' + err.message + '</div>';
      })
      .executorTimePoints(ORG_ID);
  }

  document.getElementById('pm-time-badge').addEventListener('click', function () {
    TIME_PANEL_OPEN = !TIME_PANEL_OPEN;
    var panel = document.getElementById('pm-time-panel');
    panel.style.display = TIME_PANEL_OPEN ? 'block' : 'none';
    if (TIME_PANEL_OPEN && !TIME_DATES_LOADED) _loadTimeDates();
  });

  loadPatrimoine();
  chargerPlanningRapport();
  chargerNomOrganisation();

  // Nom réel de l'organisation (BYOS, editable via le panneau) — récupéré côté CLIENT après le
  // premier rendu, jamais côté serveur dans getOrganization() (essayé puis retiré le
  // 2026-07-29 : jusqu'à 41s de blocage sur cache Analyzor froid, voir son commentaire). En
  // repli silencieux sur l'orgId déjà affiché si Analyzor est lent/injoignable — jamais pire
  // que le comportement d'avant ce correctif.
  function chargerNomOrganisation() {
    google.script.run
      .withFailureHandler(function () {})
      .withSuccessHandler(function (res) {
        if (!res || !res.success || !res.name) return;
        const el = document.getElementById('nav-org-name');
        if (el) el.textContent = res.name;
        document.title = 'Structory - ' + res.name;
      })
      .identityGetOrgProfile(ORG_ID);
  }

  // Finalisation d'une liaison Enable Banking (2026-07-27) : après consentement, l'utilisateur
  // est redirigé ici avec ?ebPending=<state> — on récupère les comptes renvoyés et on laisse
  // créer une fiche Compte pour chacun (enablebanking_account_uid + IBAN déjà remplis).
  (function () {
    const state = EB_PENDING;
    if (!state) return;
    // Jamais d'alert() bloquant ici (bug réel trouvé 2026-07-27) : un rechargement de page ou
    // un retour dans l'historique du navigateur garde ?ebPending=... dans l'URL, donc cette
    // vérification se relance à CHAQUE chargement de page tant que l'URL n'a pas changé — une
    // liaison expirée/déjà traitée est un cas normal, pas une erreur à interrompre l'utilisateur
    // avec une popup. Juste un log console + rien d'affiché si ça échoue.
    google.script.run
      .withSuccessHandler(function (result) {
        if (!result || !result.success) {
          console.log('Liaison Enable Banking non disponible : ' + ((result && result.error) || 'échec'));
          return;
        }
        openFinaliserEnableBankingPanel(result);
      })
      .withFailureHandler(function (err) { console.log('Liaison Enable Banking : ' + err.message); })
      .executorEnableBankingPending(state);
  })();

  // Rend l'en-tête "flow complété" (toutes les briques vertes) en haut d'un panneau de
  // finalisation (2026-07-31) — confirmation visuelle cohérente avec l'animation vue pendant
  // la connexion, plutôt qu'une simple liste de comptes sans contexte. PrecognFlow.render a
  // besoin d'un élément déjà présent dans le DOM : appelé APRÈS que panel.innerHTML (qui
  // contient le conteneur vide, l'id containerId) ait été posé.
  function _renderCompletedFlowHeader(containerId, connectorType) {
    const el = document.getElementById(containerId);
    if (!el) return;
    PrecognFlow.render(el, [
      { id: 'banque', icon: '🏦', label: 'Banque' },
      { id: 'connecteur', icon: '🔌', label: AUTOMATISER_CONNECTOR_LABELS[connectorType] || connectorType },
      { id: 'auth', icon: '🔐', label: 'Auth' },
      { id: 'comptes', icon: '📥', label: 'Comptes' },
      { id: 'solde', icon: '💰', label: 'Solde' }
    ]);
    ['banque', 'connecteur', 'auth', 'comptes', 'solde'].forEach(function (id) {
      PrecognFlow.setStatus(el, id, 'success');
    });
  }

  function openFinaliserEnableBankingPanel(result) {
    const panel = document.getElementById('compte-panel');
    if (!panel) return;
    const accounts = result.accounts || [];
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">'
      + '<div style="font-size:16px;font-weight:600;color:#D8FFE5;">Comptes trouvés (Enable Banking)</div>'
      + '<span onclick="closeComptePanel()" style="cursor:pointer;color:#7AAE92;font-size:18px;line-height:1;">✕</span>'
      + '</div>'
      + '<div id="pcf-header-eb" style="margin-bottom:8px;"></div>'
      + (accounts.length ? '' : '<div class="empty">Aucun compte renvoyé.</div>')
      + accounts.map(function (a, i) {
        const iban = (a.account_id && a.account_id.iban) || '';
        return '<div class="pm-compte-row" style="cursor:default;">'
          + '<div class="pm-compte-main"><div class="pm-compte-nom">' + _esc(iban || a.uid) + '</div></div>'
          + '<button onclick="creerComptePuisEnableBanking(' + _esc(JSON.stringify(a.uid)) + ',' + _esc(JSON.stringify(iban)) + ')" class="pm-btn pm-btn-secondary">➕ Créer la fiche</button>'
          + '</div>';
      }).join('');
    panel.style.display = 'block';
    document.getElementById('compte-panel-overlay').style.display = 'block';
    _renderCompletedFlowHeader('pcf-header-eb', 'enablebanking');
  }

  function creerComptePuisEnableBanking(accountUid, iban) {
    openAjouterComptePanel();
    document.getElementById('new-compte-etablissement').value = 'Enable Banking (test)';
    document.getElementById('new-compte-iban').value = iban || '';
    PENDING_EB_ACCOUNT_UID = accountUid;
  }

  // Finalisation d'une liaison Powens (2026-07-28) : après connexion bancaire réelle et copier-
  // coller du lien de retour (voir validerConnexionPowens ci-dessus — pas de callback serveur
  // automatique possible, la seule redirect_uri autorisée par l'app Powens "smc" est
  // https://structory.ai/, pas notre serveur), on récupère les comptes renvoyés et on laisse
  // soit créer une nouvelle fiche, soit attacher le compte Powens à une fiche EXISTANTE (retour
  // de Stéphane : il avait déjà créé "fintra checking" pour ce même compte BCP avant de le lier).
  function openFinaliserPowensPanel(result) {
    const panel = document.getElementById('compte-panel');
    if (!panel) return;
    const accounts = result.accounts || [];
    const comptesOptions = (PATRIMOINE_COMPTES || []).map(function (c, i) {
      return '<option value="' + i + '">' + _esc(c.nom) + '</option>';
    }).join('');
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">'
      + '<div style="font-size:16px;font-weight:600;color:#D8FFE5;">Comptes trouvés (Powens)</div>'
      + '<span onclick="closeComptePanel()" style="cursor:pointer;color:#7AAE92;font-size:18px;line-height:1;">✕</span>'
      + '</div>'
      + '<div id="pcf-header-powens" style="margin-bottom:8px;"></div>'
      + (accounts.length ? '' : '<div class="empty">Aucun compte renvoyé.</div>')
      + accounts.map(function (a) {
        // "Powens" n'est jamais un nom de banque (bug réel trouvé 2026-07-28, retour de
        // Stéphane) — bankName vient du vrai catalogue Powens (Executor::powens_link_connection,
        // via id_bank de la connexion), jamais l'agrégateur lui-même.
        const bankName = a.bankName || a.original_name || a.name || ('Compte #' + a.id);
        const nomCompte = a.original_name || a.name || bankName;
        const devise = (a.currency && a.currency.id) || '';
        const solde = (a.balance !== undefined && a.balance !== null) ? (a.balance + ' ' + devise) : '?';
        // "alreadyLinked" (2026-08-06, voir Executor::_powens_already_linked_ids) : un compte
        // déjà attaché à une brique Compte de cette org ne doit plus jamais être proposé comme
        // s'il était nouveau — bug réel trouvé (recherche épargne BCP renvoyant le courant déjà
        // automatisé comme s'il s'agissait d'une trouvaille). Affiché mais actions désactivées.
        if (a.alreadyLinked) {
          return '<div class="pm-compte-row" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px;opacity:0.55;">'
            + '<div class="pm-compte-main"><div class="pm-compte-nom">' + _esc(bankName) + ' — ' + _esc(nomCompte) + '</div>'
            + '<div style="font-size:11px;color:#7AAE92;">' + _esc(solde) + ' · déjà automatisé sur un autre compte</div></div>'
            + '</div>';
        }
        return '<div class="pm-compte-row" style="cursor:default;flex-direction:column;align-items:stretch;gap:6px;">'
          + '<div class="pm-compte-main"><div class="pm-compte-nom">' + _esc(bankName) + ' — ' + _esc(nomCompte) + '</div>'
          + '<div style="font-size:11px;color:#7AAE92;">' + _esc(solde) + '</div></div>'
          + '<div style="display:flex;gap:6px;">'
          + '<button onclick="creerComptePuisPowens(' + a.id + ',' + _esc(JSON.stringify(bankName)) + ')" class="pm-btn pm-btn-secondary" style="flex:1;">➕ Nouvelle fiche</button>'
          + (comptesOptions
            ? '<select id="powens-attach-select-' + a.id + '" class="pm-input" style="flex:1;">' + comptesOptions + '</select>'
              + '<button onclick="attacherComptePowens(' + a.id + ')" class="pm-btn pm-btn-secondary">🔗 Attacher</button>'
            : '')
          + '</div>'
          + '<div id="powens-attach-status-' + a.id + '" style="font-size:11px;min-height:14px;"></div>'
          + '</div>';
      }).join('')
      // Échappatoire manquante (2026-08-07, retour de Stéphane : "les comptes indy ne sont pas
      // automatisés car identifiants différents") — la réutilisation de connexion existante
      // (ci-dessus, 2026-08-06) suppose qu'un même nom de banque = mêmes identifiants, faux pour
      // Indy (une connexion Swan/Indy séparée par SCI, identifiants différents par entité) : le
      // parcours n'offrait alors AUCUN moyen de forcer une vraie nouvelle authentification,
      // seulement les comptes déjà trouvés. Toujours proposer explicitement l'alternative.
      + '<div style="margin-top:10px;padding-top:10px;border-top:1px solid #21442D;">'
      + '<span onclick="forcerNouvelleConnexionPowens()" class="pm-output-link" style="font-size:12px;">'
      + '🔑 Aucun de ces comptes ? Se connecter avec d&#8217;autres identifiants&#8230;</span></div>';
    panel.style.display = 'block';
    document.getElementById('compte-panel-overlay').style.display = 'block';
    _renderCompletedFlowHeader('pcf-header-powens', 'powens');
  }

  function forcerNouvelleConnexionPowens() {
    closeComptePanel();
    _demarrerWebviewPowens(document.getElementById('automatiser-flow'));
  }

  function creerComptePuisPowens(accountId, bankName) {
    openAjouterComptePanel();
    document.getElementById('new-compte-etablissement').value = bankName || '';
    PENDING_POWENS_ACCOUNT_ID = accountId;
  }

  // Auto-attache un compte Powens à un compte déjà ouvert (CURRENT_PANEL_COMPTE), sans repasser
  // par le panneau de choix — même logique que attacherComptePowens (dropdown manuel), mais la
  // cible est déjà connue. Écrit dans #automatiser-flow-status (le flow reste affiché derrière).
  function _autoAttacherComptePowens(compte, accountId) {
    const statusEl = document.getElementById('automatiser-flow-status');
    if (statusEl) { statusEl.textContent = 'Attachement à ' + compte.nom + '…'; statusEl.style.color = '#7AAE92'; }
    google.script.run
      .withSuccessHandler(function (folderResult) {
        if (!folderResult || !folderResult.success) {
          if (statusEl) { statusEl.textContent = 'Dossier introuvable'; statusEl.style.color = '#FF5555'; }
          return;
        }
        google.script.run
          .withSuccessHandler(function (result) {
            if (!result || !result.success) {
              if (statusEl) { statusEl.textContent = 'Erreur : ' + ((result && result.errorCode) || 'échec'); statusEl.style.color = '#FF5555'; }
              return;
            }
            if (statusEl) statusEl.textContent = 'Récupération du solde…';
            google.script.run
              .withSuccessHandler(function () {
                if (statusEl) { statusEl.textContent = '✅ Attaché et synchronisé — retour à la liste…'; statusEl.style.color = '#00FF66'; }
                setTimeout(function () { closeComptePanel(); loadPatrimoine(); }, 1100);
              })
              .withFailureHandler(function () {
                if (statusEl) { statusEl.textContent = '✅ Attaché (synchronisation à refaire) — retour à la liste…'; statusEl.style.color = '#00FF66'; }
                setTimeout(function () { closeComptePanel(); loadPatrimoine(); }, 1400);
              })
              .executorSyncOne(ORG_ID, { etablissement: compte.etablissement, nature: compte.nature, titulaire: compte.titulaire || undefined, module: MODULE_ID || undefined });
          })
          .withFailureHandler(function (err) {
            if (statusEl) { statusEl.textContent = 'Erreur : ' + err.message; statusEl.style.color = '#FF5555'; }
          })
          .identityUpdateCompte(ORG_ID, folderResult.folderId, compte.uid, { powens_account_id: accountId });
      })
      .withFailureHandler(function (err) {
        if (statusEl) { statusEl.textContent = 'Erreur : ' + err.message; statusEl.style.color = '#FF5555'; }
      })
      .identityGetOrgFolderId(ORG_ID);
  }

  function attacherComptePowens(accountId) {
    const select = document.getElementById('powens-attach-select-' + accountId);
    const status = document.getElementById('powens-attach-status-' + accountId);
    if (!select || !status) return;
    const c = PATRIMOINE_COMPTES[parseInt(select.value, 10)];
    if (!c) return;
    status.textContent = 'Enregistrement...';
    status.style.color = '#7AAE92';
    google.script.run
      .withSuccessHandler(function (folderResult) {
        if (!folderResult || !folderResult.success) {
          status.textContent = 'Dossier introuvable';
          status.style.color = '#FF5555';
          return;
        }
        google.script.run
          .withSuccessHandler(function (result) {
            if (!result || !result.success) {
              status.textContent = 'Erreur : ' + ((result && result.errorCode) || 'echec');
              status.style.color = '#FF5555';
              return;
            }
            // Synchronise tout de suite (2026-07-28, retour de Stéphane : le solde restait à 0
            // jusqu'à une synchronisation manuelle) — jamais bloquant si ça échoue, le compte
            // reste attaché de toute façon.
            status.textContent = 'Récupération du solde...';
            google.script.run
              .withSuccessHandler(function () {
                status.textContent = 'Attaché et synchronisé — retour à la liste...';
                status.style.color = '#00FF66';
                setTimeout(function () { closeComptePanel(); loadPatrimoine(); }, 1100);
              })
              .withFailureHandler(function () {
                status.textContent = 'Attaché (synchronisation à refaire) — retour à la liste...';
                status.style.color = '#00FF66';
                setTimeout(function () { closeComptePanel(); loadPatrimoine(); }, 1400);
              })
              .executorSyncOne(ORG_ID, { etablissement: c.etablissement, nature: c.nature, titulaire: c.titulaire || undefined, module: MODULE_ID || undefined });
          })
          .withFailureHandler(function (err) {
            status.textContent = 'Erreur : ' + err.message;
            status.style.color = '#FF5555';
          })
          .identityUpdateCompte(ORG_ID, folderResult.folderId, c.uid, { powens_account_id: accountId });
      })
      .withFailureHandler(function (err) {
        status.textContent = 'Erreur : ' + err.message;
        status.style.color = '#FF5555';
      })
      .identityGetOrgFolderId(ORG_ID);
  }

  // ============================================================
  // LLM INTEGRATION
  // ============================================================
  
  function openLLMChat() {
    console.log('openLLMChat - Ouverture du chat LLM');
    
    // Supprimer l'ancien conteneur s'il existe
    const oldContainer = document.getElementById('llmContainer');
    if (oldContainer) {
      oldContainer.remove();
    }
    
    // Créer le conteneur
    const container = document.createElement('div');
    container.id = 'llmContainer';
    container.style.cssText = 'margin-top:16px;padding:16px;border:1px solid #21442D;border-radius:4px;background:#11181C;';
    container.innerHTML = \`
      <div style="margin-bottom:8px;color:#7AAE92;font-size:11px;">
        💡 Posez une question à PreCogn sur votre organisation
      </div>
      <textarea id="llmQuestion" rows="3" style="width:100%;padding:8px;background:#0B0F10;border:1px solid #21442D;border-radius:4px;color:#D8FFE5;font-family:'Roboto Mono',monospace;font-size:12px;resize:vertical;" placeholder="Ex: Quelles sont les incohérences dans mon organisation ?"></textarea>
      <button onclick="askLLM()" style="width:100%;margin-top:8px;padding:8px;background:#00FF66;color:#0B0F10;border:none;border-radius:4px;font-family:'Roboto Mono',monospace;font-size:12px;cursor:pointer;">💬 Envoyer</button>
      <div id="llmResponse" style="margin-top:8px;padding:8px;border-left:2px solid #00FF66;font-size:12px;color:#7AAE92;min-height:20px;"></div>
    \`;
    
    // Insérer après le module menu
    const modulesDiv = document.querySelector('.modules');
    if (modulesDiv) {
      modulesDiv.parentNode.insertBefore(container, modulesDiv.nextSibling);
    } else {
      document.querySelector('.container').appendChild(container);
    }
    
    // Focus sur le champ
    setTimeout(function() {
      const input = document.getElementById('llmQuestion');
      if (input) input.focus();
    }, 100);
  }
  
  function askLLM() {
    console.log('askLLM - Début');
    
    const questionInput = document.getElementById('llmQuestion');
    if (!questionInput) {
      console.error('askLLM - llmQuestion introuvable');
      return;
    }
    
    const question = questionInput.value.trim();
    console.log('askLLM - Question:', question);
    
    if (!question) {
      alert('Veuillez poser une question.');
      return;
    }
    
    const responseDiv = document.getElementById('llmResponse');
    if (!responseDiv) return;
    responseDiv.innerHTML = '⏳ Réflexion en cours...';
    
    const payload = {
      question: question,
      organizationId: SHEET_ID || 'test_org',
      context: {
        connector: 'google-sheets',
        sourceId: SHEET_ID || 'test_org'
      }
    };
    
    console.log('askLLM - Payload:', payload);
    
    fetch('https://precogn-llm-backend.splaissy.workers.dev/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(function(response) {
      console.log('askLLM - Réponse HTTP:', response.status);
      if (!response.ok) {
        throw new Error('Erreur HTTP: ' + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      console.log('askLLM - Données reçues:', data);
      if (data.reponse) {
        responseDiv.innerHTML = '🤖 ' + data.reponse;
      } else if (data.error) {
        responseDiv.innerHTML = '❌ ' + data.error;
      } else {
        responseDiv.innerHTML = '❌ Réponse inattendue';
      }
    })
    .catch(function(err) {
      console.error('askLLM - Erreur:', err);
      responseDiv.innerHTML = '❌ Erreur: ' + err.message;
    });
  }
  
  // Exposer les fonctions globalement
  window.openLLMChat = openLLMChat;
  window.askLLM = askLLM;

  console.log('Navigator - LLM Chat chargé');

  // ============================================================
  // TIME (losange jaune) — voir renderTimeSection/getEntriesNearDate côté serveur.
  // ============================================================
  function onTimeDateChange() {
    const input = document.getElementById('time-date-input');
    const detailEl = document.getElementById('time-detail');
    if (!input || !detailEl) return;
    detailEl.textContent = 'Chargement…';
    google.script.run
      .withSuccessHandler(function (text) { detailEl.textContent = text; })
      .withFailureHandler(function (err) { detailEl.textContent = '❌ Erreur : ' + err.message; })
      .getEntriesNearDate(ORG_ID, input.value);
  }
  window.onTimeDateChange = onTimeDateChange;
  // Chargement initial (date du jour) — sans attendre un premier clic (retour de Stéphane :
  // "on affichera en embedding les éléments écriture les plus proches").
  if (document.getElementById('time-date-input')) onTimeDateChange();
</script>

</body>
</html>
  `;
}

// 1000 30 - getErrorHTML()

// ---- Plan "game" : journal réel de l'org au format game (appel serveur, clé jamais exposée au client) ----
function getGameJournal(orgId) {
  try {
    var r = UrlFetchApp.fetch('http://213.32.16.118:8080/api/ledger/journal.json?orgId=' + encodeURIComponent(orgId),
      { headers: { 'X-Service-Key': '***REMOVED_SERVICE_KEY***' }, muteHttpExceptions: true });
    if (r.getResponseCode() !== 200) return [];
    return JSON.parse(r.getContentText());
  } catch (e) { return []; }
}

function getErrorHTML(error) {
  const msg = typeof error === 'string' ? error : (error.message || 'Erreur inconnue');
  return `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Structory - Erreur</title>
<style>
  body { background: #0B0F10; color: #D8FFE5; font-family: 'Roboto Mono', monospace; padding: 40px; }
  h1 { color: #FF5555; font-weight: 300; }
  .error { color: #7AAE92; font-size: 13px; margin-top: 12px; }
</style>
</head>
<body>
  <h1>❌ Erreur Structory</h1>
  <div class="error">${msg}</div>
</body>
</html>
  `;
}

// ============================================================
// 2000 CONTEXT RESOLVER
// ============================================================

// 2000 10 - resolveContext()
function resolveContext(e) {
  const params = e ? e.parameter : {};
  const mode = params.mode || 'autonomous';
  // ebPending (2026-07-27) : lu ici côté serveur, jamais côté client via
  // window.location.search — une page HtmlService tourne dans un iframe sandboxé dont l'URL
  // interne ne reflète PAS les paramètres de l'URL réelle (piège Apps Script réel, trouvé en
  // essayant de finaliser une liaison Enable Banking : la redirection arrivait bien, mais le
  // panneau ne s'affichait jamais car le client ne voyait jamais ?ebPending=... dans son URL).
  const ebPending = params.ebPending || null;

  if (mode === 'autonomous' || mode === 'standalone') {
    return { mode: 'autonomous', source: 'builtin', orgId: params.orgId || null, ebPending: ebPending };
  }

  if (mode === 'connector') {
    return {
      mode: 'connector',
      connector: params.connector || '',
      sourceId: params.sourceId || params.id || '',
      orgId: params.orgId || null,
      ebPending: ebPending
    };
  }

  if (params.orgId) {
    return { mode: 'direct', orgId: params.orgId, source: 'url', ebPending: ebPending };
  }

  return { mode: 'autonomous', source: 'builtin', orgId: null, ebPending: null };
}

// 2000 20 - getContextInfo()
function getContextInfo(context) {
  if (context.mode === 'autonomous') return '🚀 Mode autonome';
  if (context.mode === 'connector') return '🔌 Connecteur: ' + context.connector;
  if (context.mode === 'direct') return '🔗 Lien direct';
  return '📋 Inconnu';
}

// ============================================================
// 3000 ORGANIZATION SERVICE (client)
// ============================================================

// 3000 10 - getOrganization()
function getOrganization(context) {
  Logger.log('getOrganization - Context: ' + JSON.stringify(context));
  const orgId = context.orgId;
  if (orgId) {
    // Bug réel trouvé le 2026-07-29 (retour de Stéphane) : l'en-tête affichait TOUJOURS
    // l'orgId brut, jamais le vrai nom BYOS éditable (identityGetOrgProfile). Un 1er correctif
    // appelait identityGetOrgProfile ICI, SYNCHRONE, avant de rendre la page — measuré à 41s
    // (!) sur cache Analyzor froid (list_bricks scanne tout le dossier Drive sans cache tant
    // qu'il n'a pas été chauffé, 6h de TTL) contre 19ms à chaud : provoquait le "mouline des
    // plombes, un truc qui plante" rapporté par Stéphane juste après un redémarrage
    // d'analyzor.service. Retiré d'ici — le vrai nom est maintenant récupéré côté CLIENT,
    // après le premier rendu (voir getNavigatorHTML, chargerNomOrganisation()), jamais
    // bloquant pour l'affichage initial.
    return { id: orgId, name: orgId, description: 'Organisation PreCogn' };
  }
  return { id: 'demo', name: 'Structory Demo', description: 'Passez ?orgId= dans l\'URL pour accéder à votre organisation.' };
}

// ============================================================
// 3500 STRUCTORY — MODULE COMPTABLE
// ============================================================

// 3500 10 - getStructoryData()
function getStructoryData(orgId) {
  if (!orgId || orgId === 'demo') return { exists: false, balance: null };
  try {
    const exists = Bibliotheque.ledgerExists(orgId);
    if (!exists) return { exists: false, balance: null };
    const result = Bibliotheque.ledgerQuery(orgId, 'balance', []);
    return { exists: true, balance: result.success ? result.output : null, error: result.error || null };
  } catch (e) {
    Logger.log('getStructoryData error: ' + e.message);
    return { exists: false, balance: null, error: e.message };
  }
}

// Mêmes regroupements que Communicator/Code.js::OBJECTS_GROUPES et
// structory-demo-addon/Code.js::BALANCE_GROUPES — cohérence entre les trois surfaces sur ce
// qu'est un "groupe" de comptes (2026-08-08, retour de Stéphane : journal/comptes/rules
// permanents et réels dans Navigator, au lieu du dump de balance brut + Rules de démo).
const NAV_PCG_GROUPES = [
  { label: 'Capitaux propres', prefix: '1' },
  { label: 'Immobilisations',  prefix: '2' },
  { label: 'Stocks',           prefix: '3' },
  { label: 'Clients',          prefix: '411' },
  { label: 'Fournisseurs',     prefix: '401' },
  { label: 'TVA',              prefix: '445' },
  { label: 'Autres tiers',     prefix: '42|43|44' },
  { label: 'Trésorerie',       prefix: '51' },
  { label: 'Charges',          prefix: '6' },
  { label: 'Produits',         prefix: '7' },
];

function _navMatchGroupe(compte) {
  const specific = NAV_PCG_GROUPES.filter(function (g) { return g.prefix.length > 1 && g.prefix.indexOf('|') === -1; });
  const alt = NAV_PCG_GROUPES.filter(function (g) { return g.prefix.indexOf('|') !== -1; });
  const generic = NAV_PCG_GROUPES.filter(function (g) { return g.prefix.length === 1; });
  for (const g of specific.concat(alt, generic)) {
    const alts = g.prefix.split('|');
    for (const p of alts) {
      if (compte.indexOf(p) === 0) return g.label;
    }
  }
  return 'Autres';
}

/**
 * Vrais comptes PCG utilisés dans le journal, groupés — remplace la fausse section "Objets"
 * (getTestPatrimoine) pour toute org dotée d'un vrai journal ledger-cli.
 */
function getStructoryAccounts(orgId) {
  try {
    const result = Bibliotheque.ledgerQuery(orgId, 'accounts', []);
    if (!result.success) return [];
    return (result.output || '').split('\n').map(function (l) { return l.trim(); }).filter(Boolean)
      .map(function (compte) { return { name: compte, type: _navMatchGroupe(compte) }; });
  } catch (e) {
    Logger.log('getStructoryAccounts error: ' + e.message);
    return [];
  }
}

/**
 * Détail réel d'un compte : mouvements (ledger register filtré), pas un dump texte du journal
 * entier. Retour de Stéphane 2026-08-13 : la section Objets doit permettre de voir le détail
 * d'un compte au clic. Les 15 dernières lignes seulement (register affiche déjà en ordre
 * chronologique croissant, donc les plus récentes sont en bas — tail() est le bon sens).
 */
function getAccountDetail(orgId, compte) {
  try {
    const result = Bibliotheque.ledgerQuery(orgId, 'register', [compte]);
    if (!result || !result.success) return '❌ Erreur : ' + ((result && result.error) || 'inconnue');
    const lines = (result.output || '').split('\n').filter(function (l) { return l.trim(); });
    if (!lines.length) return 'Aucun mouvement sur ce compte.';
    const maxLines = 15;
    if (lines.length <= maxLines) return lines.join('\n');
    const hidden = lines.length - maxLines;
    return '… (' + hidden + ' ligne' + (hidden > 1 ? 's' : '') + ' précédente' + (hidden > 1 ? 's' : '') + ' masquée' + (hidden > 1 ? 's' : '') + ')\n'
      + lines.slice(-maxLines).join('\n');
  } catch (e) {
    return '❌ Erreur : ' + e.message;
  }
}

/**
 * Section Objets (carré bleu #4285F4) — comptes réels groupés par catégorie PCG (NAV_PCG_GROUPES),
 * chaque compte cliquable pour voir son détail (getAccountDetail, chargé à la demande). Remplace
 * l'ancienne liste plate (renderSection) qui n'affichait qu'un badge de groupe par ligne, sans
 * regroupement visuel ni détail — retour de Stéphane 2026-08-13 : "un espace dédié suffisamment
 * vaste, ux et bien organisé" pour la consultation, plutôt que 57 boutons dans le Communicator.
 */
function renderObjectsSection(objects) {
  const header = '<div class="section-title"><span><span class="brick-dot brick-object"></span>Objets — Comptes PCG</span>'
    + '<span class="count">' + (objects ? objects.length : 0) + '</span></div>';

  if (!objects || !objects.length) {
    return '<div class="section">' + header + '<div class="empty">Aucun compte</div></div>';
  }

  const groupOrder = NAV_PCG_GROUPES.map(function (g) { return g.label; }).concat(['Autres']);
  const byGroup = {};
  objects.forEach(function (o) { (byGroup[o.type] = byGroup[o.type] || []).push(o); });

  let bodyHtml = '';
  groupOrder.forEach(function (label) {
    const comptes = byGroup[label];
    if (!comptes || !comptes.length) return;
    bodyHtml += '<div class="obj-group-label">' + label + '</div>';
    comptes.forEach(function (c) {
      const detailId = 'obj-detail-' + c.name.replace(/[^a-zA-Z0-9]/g, '_');
      // _escAttr() (pas JSON.stringify brut) : un JSON.stringify() insère ses propres guillemets
      // doubles, qui casseraient l'attribut onclick="..." lui-même déjà délimité par des
      // guillemets doubles — bug réel trouvé en vérifiant la page vraiment servie (2026-08-13).
      bodyHtml += '<div class="item" onclick="toggleAccountDetail(this,' + _escAttr(JSON.stringify(c.name)) + ',' + _escAttr(JSON.stringify(detailId)) + ')">'
        + '<span>' + _escAttr(c.name) + '</span><span class="item-type">détail ▸</span></div>'
        + '<div class="obj-detail" id="' + _escAttr(detailId) + '" style="display:none;"></div>';
    });
  });

  return '<div class="section">' + header + bodyHtml + '</div>';
}

// ================================================================
// FLUX (rond blanc) — actions réelles ledger-cli, chacune sa propre commande, jamais un dump
// générique. Retour de Stéphane 2026-08-13 : saisie/consultation/export organisés en un espace
// dédié plutôt qu'en boutons épars dans le Communicator.
// ================================================================

/** Balance complète — même commande que Communicator::quickBalance, formatée pour Navigator. */
function getFlowBalance(orgId) {
  const result = Bibliotheque.ledgerQuery(orgId, 'balance', []);
  if (!result || !result.success) return '❌ Erreur : ' + ((result && result.error) || 'inconnue');
  return (result.output || '').trim() || 'Aucune donnée.';
}

/**
 * Grand livre : contrairement au Journal (chronologique, déjà au centre de Navigator) ou à la
 * Balance (soldes), le grand livre regroupe TOUS les mouvements PAR COMPTE — ledger-cli n'a pas
 * de commande dédiée à ce regroupement, donc on le construit nous-mêmes en enchaînant un
 * `register <compte>` réel par compte existant (mêmes comptes que la section Objets).
 */
function getFlowGrandLivre(orgId) {
  const accounts = getStructoryAccounts(orgId);
  if (!accounts.length) return 'Aucun compte.';
  const blocks = accounts.map(function (a) {
    const result = Bibliotheque.ledgerQuery(orgId, 'register', [a.name]);
    const mouvements = (result && result.success) ? (result.output || '').trim() : '';
    return '── ' + a.name + ' ──\n' + (mouvements || '(aucun mouvement)');
  });
  return blocks.join('\n\n');
}

/**
 * Section Flux (rond blanc) — actions réelles, pas 57 boutons plats. "TVA"/"IS" annoncés mais
 * pas encore construits (pas de backend derrière) : affichés grisés/non cliquables plutôt que
 * de faire semblant — jamais de fausse action qui ne fait rien de réel.
 */
function renderFlowsSection(orgId) {
  const header = '<div class="section-title"><span><span class="brick-dot brick-flow"></span>Flux — Actions</span></div>';

  const downloadFecUrl = ScriptApp.getService().getUrl() + '?orgId=' + encodeURIComponent(orgId) + '&download=fec';

  const rows = ''
    + '<div class="item" style="cursor:default;">'
    + '<span>✍️ Saisir une écriture</span><span class="item-type">dans le chat →</span></div>'
    + '<div class="item" onclick="toggleAccountDetail(this,' + _escAttr(JSON.stringify('__balance__')) + ',' + _escAttr(JSON.stringify('flow-detail-balance')) + ')">'
    + '<span>📊 Balance</span><span class="item-type">détail ▸</span></div>'
    + '<div class="obj-detail" id="flow-detail-balance" style="display:none;"></div>'
    + '<div class="item" onclick="toggleAccountDetail(this,' + _escAttr(JSON.stringify('__grandlivre__')) + ',' + _escAttr(JSON.stringify('flow-detail-grandlivre')) + ')">'
    + '<span>📗 Grand livre</span><span class="item-type">détail ▸</span></div>'
    + '<div class="obj-detail" id="flow-detail-grandlivre" style="display:none;"></div>'
    + '<a class="item" href="' + downloadFecUrl + '" style="text-decoration:none;color:#D8FFE5;">'
    + '<span>🧾 Export FEC</span><span class="item-type">télécharger ⬇</span></a>'
    + '<div class="item" style="cursor:default;opacity:0.4;">'
    + '<span>🧮 Gérer la TVA</span><span class="item-type">bientôt</span></div>'
    + '<div class="item" style="cursor:default;opacity:0.4;">'
    + '<span>🏛️ Gérer l\'IS</span><span class="item-type">bientôt</span></div>';

  return '<div class="section">' + header + rows + '</div>';
}

/**
 * Vraies Rules du module comptable de l'org (ledger_api/modules/{module}/bricks/) — remplace
 * la fausse section "Règles" (getTestPatrimoine, "TVA 20%"/"Remise 5%" inventées).
 */
function getStructoryRules(orgId) {
  try {
    const result = Bibliotheque.analyzorGetRules(orgId);
    if (!result.success) return [];
    return (result.rules || []).map(function (r) {
      return { name: r.title || r.id || 'Règle', type: (r.tags || []).slice(0, 2).join(', ') };
    });
  } catch (e) {
    Logger.log('getStructoryRules error: ' + e.message);
    return [];
  }
}

/**
 * Section Rule (triangle rouge) — le référentiel : vraies Rule bricks PCG de l'org, plus les
 * commandes ledger-cli réellement câblées dans Navigator/Communicator (jamais une liste
 * théorique complète de ledger-cli — seulement ce qui est effectivement exposé ici).
 */
function renderRulesSection(rules) {
  const header = '<div class="section-title"><span><span class="brick-rule"></span>Rule — PCG &amp; commandes</span>'
    + '<span class="count">' + (rules ? rules.length : 0) + '</span></div>';

  let bodyHtml = (rules && rules.length)
    ? rules.map(function (r) {
        return '<div class="item"><span>' + _escAttr(r.name) + '</span><span class="item-type">' + _escAttr(r.type) + '</span></div>';
      }).join('')
    : '<div class="empty">Aucune règle</div>';

  const commands = [
    { cmd: 'balance', desc: 'soldes par compte' },
    { cmd: 'register', desc: 'mouvements chronologiques' },
    { cmd: 'accounts', desc: 'liste des comptes' },
    { cmd: 'print', desc: 'journal au format ledger' },
    { cmd: 'csv', desc: 'export CSV' }
  ];
  bodyHtml += '<div class="obj-group-label" style="color:#FF4444;">Commandes ledger-cli disponibles</div>';
  bodyHtml += commands.map(function (c) {
    return '<div class="item" style="cursor:default;"><span>' + c.cmd + '</span><span class="item-type">' + c.desc + '</span></div>';
  }).join('');

  return '<div class="section">' + header + bodyHtml + '</div>';
}

/**
 * Journal chronologique structuré (date/libellé/compte/débit/crédit) — remplace le dump de
 * balance brute en <pre> par un vrai tableau, permanent, lisible (retour de Stéphane
 * 2026-08-08 : "que le journal soit visible en permanence"). Réutilise le même parsing CSV
 * que structory-demo-addon/Code.js::_writeJournalTab.
 */
function getStructoryJournal(orgId) {
  try {
    const result = Bibliotheque.ledgerQuery(orgId, 'csv', []);
    if (!result.success) return [];
    const legs = [];
    Utilities.parseCsv(result.output || '').forEach(function (cols) {
      if (cols.length < 6) return;
      const date = cols[0], libelle = cols[2], compte = cols[3], montantRaw = cols[5];
      if (compte === '998' || compte === '999') return;
      const montant = parseFloat(montantRaw);
      if (isNaN(montant)) return;
      legs.push({ date: date, libelle: libelle, compte: compte, montant: montant });
    });

    // Regroupe les jambes comptables consécutives d'une même écriture en une seule ligne
    // date/libellé/compte débit/compte crédit — retour de Stéphane 2026-08-11 : "je ne dois
    // pas avoir deux lignes à chaque fois avec le même libellé". `ledger csv` liste toujours
    // les jambes d'une même écriture de façon consécutive (jamais entrelacées entre deux
    // écritures), donc un simple changement de (date, libellé) marque une nouvelle écriture.
    // Une écriture à plus de 2 jambes (ex. TVA collectée + TVA déductible + banque) affiche
    // plusieurs comptes séparés par une virgule côté débit ou crédit.
    const entries = [];
    let current = null;
    legs.forEach(function (leg) {
      if (!current || current.date !== leg.date || current.libelle !== leg.libelle) {
        current = { date: leg.date, libelle: leg.libelle, debits: [], credits: [], montant: 0 };
        entries.push(current);
      }
      if (leg.montant >= 0) {
        current.debits.push(leg.compte);
        current.montant += leg.montant;
      } else {
        current.credits.push(leg.compte);
      }
    });
    entries.forEach(function (e) {
      e.compteDebit = e.debits.join(', ');
      e.compteCredit = e.credits.join(', ');
    });

    // Tri explicite par date — retour de Stéphane 2026-08-11 : "même pas dans l'ordre
    // chronologique". Cause réelle : le fichier .ledger n'est PAS trié globalement (chaque
    // bloc de transactions générées — TVA, loyers, salaires... — est trié en interne, mais les
    // blocs ne sont jamais fusionnés par date), et `ledger csv` réimprime dans l'ordre du
    // fichier, pas un ordre chronologique global. Comparaison de chaînes "YYYY/MM/DD" = tri
    // chronologique valide (format déjà zero-paddé).
    entries.sort(function (a, b) { return a.date < b.date ? -1 : (a.date > b.date ? 1 : 0); });
    // Plus récent en premier (retour de Stéphane 2026-08-06, même convention que Communicator).
    entries.reverse();
    return entries;
  } catch (e) {
    Logger.log('getStructoryJournal error: ' + e.message);
    return [];
  }
}

// ================================================================
// TIME (losange jaune) — naviguer dans les dates réelles du journal, pas une plage devinée.
// Retour de Stéphane 2026-08-13 : "bouger les times en fonction des dates d'événements
// survenues ou de la date choisie par le user", afficher en embed les écritures les plus proches.
// ================================================================

/**
 * Écritures d'une date précise si elles existent, sinon les plus proches (avant/après) —
 * jamais une plage arbitraire. Réutilise getStructoryJournal (déjà trié, déjà groupé par
 * écriture) plutôt que de reparser le CSV une deuxième fois.
 */
function getEntriesNearDate(orgId, targetDateStr) {
  const entries = getStructoryJournal(orgId);
  if (!entries.length) return 'Aucune écriture dans ce journal.';

  const target = new Date(targetDateStr);
  if (isNaN(target.getTime())) return 'Date invalide.';

  function toDate(e) {
    const p = e.date.split(/[/-]/);
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }
  function dateFr(e) {
    const p = e.date.split(/[/-]/);
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : e.date;
  }
  function formatLine(e) {
    return dateFr(e) + '  ' + e.libelle + '  (' + e.montant.toFixed(2) + '€)  ['
      + e.compteDebit + ' → ' + e.compteCredit + ']';
  }

  const exact = entries.filter(function (e) {
    const d = toDate(e);
    return d.getFullYear() === target.getFullYear() && d.getMonth() === target.getMonth() && d.getDate() === target.getDate();
  });

  if (exact.length) {
    return 'Écritures du ' + dateFr(exact[0]) + ' :\n' + exact.map(formatLine).join('\n');
  }

  const nearest = entries
    .map(function (e) { return { e: e, diff: Math.abs(toDate(e).getTime() - target.getTime()) }; })
    .sort(function (a, b) { return a.diff - b.diff; })
    .slice(0, 5)
    .map(function (x) { return x.e; });

  return 'Aucune écriture exactement à cette date — les plus proches :\n' + nearest.map(formatLine).join('\n');
}

/** Section Time (losange jaune) — sélecteur de date + écritures les plus proches en embed. */
function renderTimeSection() {
  const todayIso = Utilities.formatDate(new Date(), 'UTC', 'yyyy-MM-dd');
  const header = '<div class="section-title"><span><span class="brick-time"></span>Time — Naviguer dans les dates</span></div>';
  const body = '<div style="padding:6px 12px;">'
    + '<input type="date" id="time-date-input" value="' + todayIso + '" onchange="onTimeDateChange()">'
    + '</div>'
    + '<div class="obj-detail" id="time-detail" style="display:block;">Chargement…</div>';
  return '<div class="section">' + header + body + '</div>';
}

// 3500 20 - renderStructorySection()
function renderStructorySection(orgId, data) {
  const commUrl = COMMUNICATOR_URL + (orgId && orgId !== 'demo' ? '?orgId=' + encodeURIComponent(orgId) : '');

  if (!orgId || orgId === 'demo') {
    return '<div class="section"><div class="section-title">◈ Structory — Journal comptable</div>'
      + '<div class="empty">Passez un <code style="color:#7AAE92">?orgId=</code> dans l\'URL pour accéder à votre journal.</div></div>';
  }

  if (!data.exists) {
    return '<div class="section"><div class="section-title">◈ Structory — Journal comptable</div>'
      + '<div class="empty">Aucun journal pour cette organisation. '
      + '<a href="' + commUrl + '" target="_blank" style="color:#00FF66;text-decoration:none;">Créez-en un dans le Communicator →</a></div></div>';
  }

  // Journal structuré (tableau réel, pas un dump texte) — retour de Stéphane 2026-08-08 :
  // "que le journal soit visible en permanence". Remplace l'ancien <pre> de balance brute.
  const entries = getStructoryJournal(orgId);
  let journalHtml;
  if (entries.length === 0) {
    journalHtml = '<div class="empty">Aucune écriture</div>';
  } else {
    // Toutes les écritures affichées ici, dans la même page — retour de Stéphane 2026-08-11 :
    // "je ne dois pas aller ailleurs et ouvrir une autre fenêtre". Plus de lien externe vers
    // /api/ledger/journal (page HTML séparée, encore marquée "copropriété" — pas pertinente
    // pour une démo Structory, corrigée par ailleurs mais de toute façon plus utilisée ici).
    //
    // Une ligne par ÉCRITURE (pas par jambe comptable) — retour de Stéphane 2026-08-11 : "je ne
    // dois pas avoir deux lignes à chaque fois avec le même libellé". getStructoryJournal()
    // regroupe déjà les jambes ; compteDebit/compteCredit peuvent lister plusieurs comptes
    // séparés par une virgule pour les écritures à plus de 2 jambes (ex. TVA + banque).
    const rowsHtml = entries.map(function (e) {
      // Format français JJ/MM/AAAA (retour de Stéphane 2026-08-11) — le CSV ledger-cli sort en
      // AAAA/MM/JJ, jamais le format attendu en France.
      const dParts = e.date.split(/[/-]/);
      const dateFr = dParts.length === 3 ? dParts[2] + '/' + dParts[1] + '/' + dParts[0] : e.date;
      return '<tr>'
        + '<td style="color:#7AAE92;white-space:nowrap;padding-right:12px;">' + dateFr + '</td>'
        + '<td style="padding-right:12px;">' + e.libelle + '</td>'
        + '<td style="color:#FF8080;padding-right:12px;">' + e.compteDebit + '</td>'
        + '<td style="color:#00FF66;padding-right:12px;">' + e.compteCredit + '</td>'
        + '<td style="text-align:right;">' + e.montant.toFixed(2) + '</td>'
        + '</tr>';
    }).join('');
    journalHtml = '<table style="width:100%;font-size:11px;border-collapse:collapse;">'
      + '<tr style="color:#7AAE92;text-align:left;border-bottom:1px solid #21442D;">'
      + '<th style="padding-right:12px;">Date</th><th style="padding-right:12px;">Libellé</th>'
      + '<th style="padding-right:12px;">Débit</th><th style="padding-right:12px;">Crédit</th>'
      + '<th style="text-align:right;">Montant</th></tr>'
      + rowsHtml + '</table>';
  }

  // Le lien "Communicator →" est retiré (retour de Stéphane 2026-08-11 : "le communicator est
  // à droite déjà" — redondant dans la vue Navigator+Communicator côte à côte ; commUrl reste
  // utilisé pour le cas "aucun journal" ci-dessus, seul endroit où il a du sens).
  //
  // Téléchargement direct (retour de Stéphane 2026-08-11 : "je dois pouvoir télécharger le
  // journal facilement") — même gate d'accès que la page elle-même (voir doGet, branche
  // download=journal, placée APRÈS authGate : pas de route parallèle non protégée).
  const downloadUrl = ScriptApp.getService().getUrl() + '?orgId=' + encodeURIComponent(orgId) + '&download=journal';
  return '<div class="section" id="journal">'
    + '<div class="section-title" style="display:flex;justify-content:space-between;align-items:center;">'
    + '<span>◈ Structory — Journal</span>'
    + '<a href="' + downloadUrl + '" style="font-size:11px;color:#7AAE92;text-decoration:none;">⬇️ Télécharger</a>'
    + '</div>'
    + journalHtml + '</div>';
}

// 3000 30 - getPatrimoine()
function getPatrimoine(orgId) {
  Logger.log('getPatrimoine - orgId: ' + orgId);
  
  try {
    // Version de test
    return getTestPatrimoine();
  } catch (error) {
    Logger.log('getPatrimoine - Erreur: ' + error.message);
    return { objects: [], flows: [], rules: [], time: [] };
  }
}

// 3000 40 - getTestPatrimoine()
function getTestPatrimoine() {
  return {
    objects: [
      { id: 'obj_1', name: 'Client', type: 'object', created: '2024-01-01' },
      { id: 'obj_2', name: 'Facture', type: 'object', created: '2024-01-02' },
      { id: 'obj_3', name: 'Paiement', type: 'object', created: '2024-01-03' }
    ],
    flows: [
      { id: 'flow_1', name: 'Création facture', type: 'flow', from: 'obj_1', to: 'obj_2' },
      { id: 'flow_2', name: 'Paiement client', type: 'flow', from: 'obj_2', to: 'obj_3' }
    ],
    rules: [
      { id: 'rule_1', name: 'TVA 20%', type: 'rule', applies: 'obj_2' },
      { id: 'rule_2', name: 'Remise 5%', type: 'rule', applies: 'obj_2' }
    ],
    time: [
      { id: 'time_1', name: 'Exercice 2024', type: 'time', start: '2024-01-01', end: '2024-12-31' }
    ]
  };
}

// ============================================================
// 3600 SUIVRE MES COMPTES — MÉTRIQUES PATRIMOINE (V0, temporaire)
// ============================================================
// Même limitation/contournement que communicator/Code.js::getComptesForOrg() : la brique
// Compte Analyzor est cassée contre le vrai Drive (compte de service sans quota d'écriture de
// fichier), donc V0 lit un vrai Google Sheet possédé par Stéphane. Dupliqué ici plutôt que
// factorisé dans Bibliotheque le temps que la V0 soit validée (voir CLAUDE.md
// suivre_mes_comptes) — à consolider ensuite dans un seul endroit.
// 3600 10 - getComptesData()
function getComptesData(orgId) {
  // Comptes lus depuis la vraie brique Analyzor (migration Sheet V0 -> briques terminée le
  // 2026-07-22, voir CLAUDE.md suivre_mes_comptes) — plus de table par orgId codée en dur,
  // n'importe quelle org avec au moins un Compte affiche cette section, exactement comme
  // resolve_connectors résout par données plutôt que par nom d'org.
  //
  // Les comptes et le solde (ledger) sont deux sources indépendantes — une panne ou une
  // absence de journal côté ledger (cas normal tant qu'aucun solde n'a jamais été constaté,
  // voir Bibliotheque.ledgerExists) ne doit jamais faire disparaître la liste des comptes déjà
  // lue avec succès. Deux try/catch séparés, jamais un seul englobant les deux (bug corrigé
  // 2026-07-21 : un ledgerQuery en échec effaçait silencieusement des comptes pourtant bien lus).
  let comptes = [];
  let comptesError = null;
  try {
    const bricks = Bibliotheque.analyzorListComptes(orgId);
    comptes = bricks.map(function (b) { return b.contenu; });
  } catch (e) {
    Logger.log('getComptesData (lecture briques) error: ' + e.message);
    comptesError = e.message;
  }

  if (!comptes.length && !comptesError) return null;

  // Solde réel côté ledger (pas la valeur de référence du Sheet) : un seul appel groupé sur
  // tout le préfixe patrimoine, ledger-cli fait déjà l'agrégation par compte — jamais besoin
  // de recalculer/dupliquer la convention de nommage établissement+nature -> compte ici
  // (source unique : ledger_api::_resolve_compte_patrimoine). Pas de solde tant qu'aucun
  // journal n'existe encore pour cette org (cas normal, pas une erreur à afficher).
  let balance = null;
  if (Bibliotheque.ledgerExists(orgId)) {
    const balanceResult = Bibliotheque.ledgerQuery(orgId, 'balance', ['Actif:Banque']);
    balance = balanceResult.success ? balanceResult.output : null;
  }

  // Métrique demandée par Stéphane (2026-07-21) : cumul des comptes. Tant qu'aucun solde n'est
  // encore constaté dans le journal (voir balance ci-dessus, souvent null pour l'instant), on
  // cumule la valeur de référence du Sheet — PAS le résultat ledger — donc explicitement marqué
  // "référence" côté rendu. Jamais de conversion de devise ici : chaque devise cumulée à part
  // (§0 ARCHITECTURE.md : la conversion est un problème d'affichage Sheet/GOOGLEFINANCE, jamais
  // calculé côté backend).
  const cumulParDevise = {};
  comptes.forEach(function (c) {
    const devise = c.devise_origine || '?';
    const solde = parseFloat(String(c.solde).replace(',', '.')) || 0;
    cumulParDevise[devise] = (cumulParDevise[devise] || 0) + solde;
  });

  return { comptes: comptes, balance: balance, error: comptesError, cumulParDevise: cumulParDevise };
}

// 3600 20 - renderComptesSection()
// Échappement pour attribut HTML (data-*) — les valeurs viennent de briques Compte (nom
// d'établissement, titulaire) potentiellement saisies à la main, jamais du code contrôlé.
function _escAttr(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Rendu "vue patrimoine" (2026-07-26, refonte demandée par Stéphane : "je veux qu'elle soit
// conçue comme une application bancaire (type Mercury, Revolut Business, Qonto), pas comme un
// ERP" — comprendre combien/où/comment en moins de 3 secondes). Contrairement à l'ancienne
// version, ce n'est plus un rendu 100% côté serveur : seule la coquille (titre, conteneurs
// vides, panneau latéral) est servie ici ; le contenu réel (cartes, banques, comptes) est
// chargé et rendu côté client via executorPatrimoineView (un seul appel, données déjà agrégées
// avec mode de synchro par compte) — nécessaire pour l'interactivité du panneau latéral
// (cliquer un compte -> modifier solde / relancer une synchro) sans recharger toute la page.
function renderComptesSection(orgId, data) {
  if (!data) return '';

  return '<div class="section" style="padding:0;overflow:hidden;">'
    + '<div style="padding:20px 20px 4px;display:flex;justify-content:space-between;align-items:flex-start;">'
    + '<div><div style="font-size:20px;font-weight:600;color:#D8FFE5;">Patrimoine</div>'
    + '<div id="patrimoine-subtitle" class="pm-loading" style="font-size:12px;color:#7AAE92;margin-top:2px;">Chargement…</div></div>'
    + '<div style="display:flex;gap:6px;align-items:flex-start;">'
    + '<button onclick="openAjouterComptePanel()" class="pm-add-compte-btn" title="Ajouter un compte">➕</button>'
    + '</div>'
    + '</div>'
    + '<div id="patrimoine-cards" style="padding:14px 20px 4px;"></div>'
    + '<div id="patrimoine-banks" style="padding:4px 20px;"></div>'
    + '<div id="patrimoine-comptes" style="padding:4px 20px 20px;"></div>'
    + '</div>'
    // z-index 10000/10001 (pas 100/101) : le rond d'identité d'organisation (#op-trigger,
    // OrgPanel.html) est fixé en haut à droite à z-index 9999 — un z-index plus bas ici le
    // laissait flotter AU-DESSUS de ce panneau, polluant visuellement le champ de recherche de
    // l'Automatiser (bug réel trouvé 2026-07-28, retour de Stéphane : "la coche verte de
    // l'organisation pollue le masque de saisie").
    + '<div id="compte-panel-overlay" onclick="closeComptePanel()" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:10000;"></div>'
    + '<div id="compte-panel" style="display:none;position:fixed;top:0;right:0;bottom:0;width:360px;max-width:90vw;background:#11181C;border-left:1px solid #21442D;z-index:10001;padding:20px;overflow-y:auto;box-shadow:-8px 0 24px rgba(0,0,0,0.4);"></div>';
}

// ============================================================
// 4000 STORAGE (interface abstraite)
// ============================================================

/**
 * Interface du Storage
 * 
 * Ce n'est PAS une implémentation.
 * C'est un contrat que le module Storage devra implémenter.
 */
const Storage = {
  getOrganization: function(id) {
    throw new Error('Storage.getOrganization doit être implémenté par le module Storage');
  },
  saveOrganization: function(org) {
    throw new Error('Storage.saveOrganization doit être implémenté par le module Storage');
  },
  getPatrimoine: function(orgId) {
    throw new Error('Storage.getPatrimoine doit être implémenté par le module Storage');
  },
  savePatrimoine: function(orgId, data) {
    throw new Error('Storage.savePatrimoine doit être implémenté par le module Storage');
  }
};

// ============================================================
// 5000 EVOLUTION ENGINE (client)
// ============================================================

// 5000 10 - getEvolutionProposals()
function getEvolutionProposals(orgId) {
  Logger.log('getEvolutionProposals - orgId: ' + orgId);
  
  try {
    return getTestEvolutionProposals();
  } catch (error) {
    Logger.log('getEvolutionProposals - Erreur: ' + error.message);
    return [];
  }
}

// 5000 20 - getTestEvolutionProposals()
function getTestEvolutionProposals() {
  return [
    {
      id: 'evol_1',
      type: 'new_object',
      title: 'Ajouter l\'objet "Abonnement"',
      description: 'Les clients peuvent avoir des abonnements récurrents',
      confidence: 0.85,
      impact: 'medium'
    },
    {
      id: 'evol_2',
      type: 'new_flow',
      title: 'Créer un flow "Renouvellement abonnement"',
      description: 'Permet de gérer automatiquement les renouvellements',
      confidence: 0.78,
      impact: 'high'
    },
    {
      id: 'evol_3',
      type: 'inconsistency',
      title: 'Incohérence détectée : Client sans facture',
      description: '3 clients n\'ont aucune facture associée',
      confidence: 0.95,
      impact: 'critical'
    },
    {
      id: 'evol_4',
      type: 'suggestion',
      title: 'Règle suggérée : Paiement à 30 jours',
      description: 'Standardiser les délais de paiement à 30 jours',
      confidence: 0.70,
      impact: 'low'
    }
  ];
}

// 5000 30 - getInconsistencies()
function getInconsistencies(orgId) {
  const proposals = getEvolutionProposals(orgId);
  return proposals.filter(p => p.type === 'inconsistency');
}

// 5000 40 - getSuggestedFlows()
function getSuggestedFlows(orgId) {
  const proposals = getEvolutionProposals(orgId);
  return proposals.filter(p => p.type === 'new_flow');
}

// 5000 50 - getSuggestedRules()
function getSuggestedRules(orgId) {
  const proposals = getEvolutionProposals(orgId);
  return proposals.filter(p => p.type === 'suggestion');
}

// 5000 60 - getEvolutionHistory()
function getEvolutionHistory(orgId) {
  return [
    { date: '2024-01-15', type: 'new_object', name: 'Ajout de l\'objet "Fournisseur"' },
    { date: '2024-01-20', type: 'new_flow', name: 'Flow "Commande fournisseur"' },
    { date: '2024-02-01', type: 'rule', name: 'Règle "TVA 20%"' }
  ];
}

// ============================================================
// 6000 INTERFACE
// ============================================================

// 6000 10 - buildDashboard()
function buildDashboard(org, patrimoine, evolutions, orgId, structoryData, comptesData) {
  // Orgs SANS comptes patrimoine (ledger-only, ex: Structory/compta_copro) : Objets/Règles
  // viennent maintenant du vrai journal/des vraies Rule bricks, plus des données de démo
  // figées (getTestPatrimoine) — retour de Stéphane 2026-08-08 : "que la liste des comptes
  // soit immédiatement consultable avec le PCG, que les Rules soient compréhensibles en
  // permanence". Flows/Temps restent la démo fixe pour l'instant, non demandés cette fois.
  const isSMC = !!comptesData;
  const objects = isSMC ? [] : getStructoryAccounts(orgId);
  const flows = patrimoine.flows || [];
  const rules = isSMC ? [] : getStructoryRules(orgId);
  const time = patrimoine.time || [];

  const evolutionsCount = evolutions ? evolutions.length : 0;
  const suggestions = evolutions ? evolutions.filter(e => e.type !== 'inconsistency') : [];

  // Carte "N comptes" retirée (2026-07-26, retour de Stéphane : "Elle est redondante et non
  // cliquable") — l'information équivalente existe déjà, cliquable et à jour, dans la carte
  // "Comptes" de la vue patrimoine (renderComptesSection / pm-card), chargée côté client.
  const comptesMetricHtml = '';

  const fakeMetricsHtml = comptesData ? '' : `
    <div class="metric">
      <div class="value">${objects.length}</div>
      <div class="label">📦 Comptes PCG</div>
    </div>
    <div class="metric">
      <div class="value">${rules.length}</div>
      <div class="label">⚖️ Règles</div>
    </div>
  `;

  const metricsHtml = `${comptesMetricHtml}${fakeMetricsHtml}`;

  // Règle générale (pas spécifique à SMC) : si une org a sa propre section Comptes (plus
  // riche : liste + cumul + solde réel), la section Structory générique (journal) devient
  // redondante et ne s'affiche plus — retour de Stéphane 2026-07-21 ("aucun journal... n'est
  // plus utile ici"). Les orgs sans section Comptes dédiée gardent la section Structory :
  // c'est leur seul affichage de journal/comptes/rules.
  // Comptes patrimoine remonté en haut de page (juste après le Communicator embed), pas mélangé
  // aux autres sections — retour de Stéphane 2026-07-21 ("la liste des comptes en bas est
  // super du coup je la mettrais en haut").
  const comptesSectionHtml = renderComptesSection(orgId, comptesData);

  let sectionsHtml = '';
  if (!comptesData) {
    sectionsHtml += renderStructorySection(orgId, structoryData || { exists: false });
  }
  if (!isSMC) {
    sectionsHtml += renderObjectsSection(objects);
    sectionsHtml += renderFlowsSection(orgId);
    sectionsHtml += renderRulesSection(rules);
    sectionsHtml += renderTimeSection();
  }

  return {
    metrics: metricsHtml,
    comptesSection: comptesSectionHtml,
    sections: sectionsHtml
  };
}

// 6000 20 - renderSection()
function renderSection(title, items) {
  if (!items || items.length === 0) {
    return `
      <div class="section">
        <div class="section-title">${title}</div>
        <div class="empty">Aucun élément</div>
      </div>
    `;
  }
  
  let html = `
    <div class="section">
      <div class="section-title">${title} <span class="count">${items.length}</span></div>
  `;
  
  for (const item of items) {
    const name = item.name || item.title || item.id || 'Élément';
    const type = item.type || '';
    html += `
      <div class="item">
        <span>${name}</span>
        <span class="item-type">${type}</span>
      </div>
    `;
  }
  
  html += `</div>`;
  return html;
}

// 6000 30 - renderEvolutionSection()
function renderEvolutionSection(evolutions) {
  if (!evolutions || evolutions.length === 0) {
    return `
      <div class="section">
        <div class="section-title">⚡ Évolutions <span class="count">0</span></div>
        <div class="empty">Aucune proposition d'évolution</div>
      </div>
    `;
  }
  
  const inconsistencies = evolutions.filter(e => e.type === 'inconsistency');
  const proposals = evolutions.filter(e => e.type !== 'inconsistency');
  
  let html = `
    <div class="section">
      <div class="section-title">⚡ Évolutions <span class="count">${evolutions.length}</span></div>
  `;
  
  for (const item of inconsistencies) {
    const name = item.title || item.name || 'Incohérence';
    html += `
      <div class="item inconsistency">
        <span>⚠️ ${name}</span>
        <span class="item-type">${item.type}</span>
      </div>
    `;
  }
  
  for (const item of proposals) {
    const name = item.title || item.name || 'Proposition';
    html += `
      <div class="item evolution">
        <span>💡 ${name}</span>
        <span>
          <span class="item-type">${item.type}</span>
          <button class="evolve-btn" onclick="alert('Appliquer: ${item.id}')">Appliquer</button>
        </span>
      </div>
    `;
  }
  
  html += `</div>`;
  return html;
}

// 6000 40 - getModulesMenu()
function getModulesMenu(orgId, comptesData) {
  // Bouton "◈ Structory" retiré (2026-07-21, tous orgs) : redondant avec le header qui affiche
  // déjà "Structory OS" en permanence, et avec le Communicator maintenant intégré directement
  // dans le Navigator (embed) plutôt que d'y renvoyer par lien.
  // Fusion Sheets / SheetToDoc / ObjectToSheet : outils de manipulation de Sheets génériques,
  // pas pertinents pour les orgs patrimoine (retour de Stéphane, 2026-07-21) — masqués pour
  // elles, gardés pour les autres qui les utilisent peut-être.
  const isSMC = !!comptesData;
  const modules = [];
  // 2026-08-15 (retour de Stephane) : retires du menu Fusion Sheets / SheetToDoc /
  // ObjectToSheet / LLM PreCogn (outils Sheets generiques + llmprecogn) - non pertinents ici.
  // LlmPrecogn déplacé dans la barre d'outils de la section Comptes pour les orgs V0 (retour
  // de Stéphane : "llmprecogn doit être à côté de 18 comptes") — pas dupliqué ici pour elles.
  
  let html = '';
  for (const mod of modules) {
    let onclick;
    if (mod.id === '4.002') {
      onclick = 'onclick="openLLMChat()"';
    } else if (mod.url) {
      onclick = `onclick="window.open('${mod.url}','_blank')"`;
    } else {
      onclick = `onclick="alert('Module ${mod.id} - À déployer')"`;
    }
    const cls = mod.cls || '';
    html += `<button class="module-btn ${cls}" ${onclick}>${mod.name}</button>`;
  }
  
  return html;
}

// ============================================================
// 9000 UTILITAIRES
// ============================================================

// 9000 10 - getTimestamp()
function getTimestamp() {
  return new Date().toISOString();
}

// 9000 20 - formatDuration()
function formatDuration(ms) {
  if (ms < 1000) return ms + 'ms';
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return seconds + 's';
  const minutes = Math.floor(seconds / 60);
  return minutes + 'm ' + (seconds % 60) + 's';
}

// ============================================================
// 9999 - FONCTION DE TEST
// ============================================================

function testNavigator() {
  Logger.log('=== Test Structory OS ===');
  
  const context = { mode: 'autonomous' };
  const org = getOrganization(context);
  const patrimoine = getPatrimoine(org.id);
  const evolutions = getEvolutionProposals(org.id);
  
  Logger.log('Organisation: ' + org.name);
  Logger.log('Patrimoine: ' + JSON.stringify(patrimoine));
  Logger.log('Évolutions: ' + JSON.stringify(evolutions));
  
  return { org, patrimoine, evolutions };
}
// ================================================================
// MIGRATION BYOS — fonction utilitaire one-shot
// Ouvrir Apps Script Editor du Navigator → sélectionner
// migrateAllPreCognOrgs → Exécuter
// ================================================================
function migrateAllPreCognOrgs() {
  var props = PropertiesService.getScriptProperties();
  var OWNER_EMAIL = props.getProperty('MIGRATION_OWNER_EMAIL');
  var OWNER_NAME  = props.getProperty('MIGRATION_OWNER_NAME');
  var orgsJson    = props.getProperty('MIGRATION_ORGS_JSON');
  if (!OWNER_EMAIL || !OWNER_NAME || !orgsJson) {
    throw new Error('Migration non configuree : definir MIGRATION_OWNER_EMAIL, MIGRATION_OWNER_NAME, MIGRATION_ORGS_JSON (Script Properties).');
  }
  var orgs = JSON.parse(orgsJson); // [[orgId, orgName, parentOrgId|null, folderId|null], ...]

  var results = [];
  for (var i = 0; i < orgs.length; i++) {
    var o = orgs[i];
    Logger.log('Migration ' + o[0] + '…');
    var res = Bibliotheque.identityRepairOrg(o[0], o[1], o[2], OWNER_EMAIL, OWNER_NAME, o[3]);
    Logger.log(JSON.stringify(res));
    results.push({ orgId: o[0], result: res });
  }
  return results;
}

function accountOrgMemberAdd(orgId, uid, role) { return Bibliotheque.accountOrgMemberAdd(orgId, uid, role); }
function accountOrgMemberRemove(orgId, uid) { return Bibliotheque.accountOrgMemberRemove(orgId, uid); }
