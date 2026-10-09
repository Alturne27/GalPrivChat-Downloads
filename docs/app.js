// Remplit la page depuis release.json, généré par .github/workflows/release.yml
// à chaque publication (même origine : aucun appel à une API tierce).
(function () {
  'use strict';

  function detectPlatform() {
    var ua = navigator.userAgent || '';
    if (/android/i.test(ua)) return 'android';
    // iPadOS se présente comme un Mac : on le distingue par l'écran tactile.
    if (/iphone|ipad|ipod/i.test(ua) || (/macintosh/i.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/windows/i.test(ua)) return 'windows';
    return null;
  }

  function formatSize(bytes) {
    return (bytes / (1024 * 1024)).toFixed(1).replace('.', ',') + ' Mo';
  }

  function formatDate(iso) {
    var d = new Date(iso);
    return isNaN(d) ? '' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  function highlightPlatform() {
    var platform = detectPlatform();
    if (!platform) return;
    var card = document.getElementById('card-' + platform);
    if (!card) return;
    card.classList.add('is-current');
    card.querySelector('.badge').hidden = false;
    card.parentNode.insertBefore(card, card.parentNode.firstElementChild);
  }

  function fillAsset(key, asset) {
    var btn = document.querySelector('[data-asset="' + key + '"]');
    var hash = document.querySelector('[data-hash="' + key + '"]');
    if (!asset || !asset.url) return;
    btn.href = asset.url;
    btn.removeAttribute('aria-disabled');
    btn.textContent += ' (' + formatSize(asset.size) + ')';
    hash.textContent = 'SHA-256 : ';
    var code = document.createElement('code');
    code.textContent = asset.sha256;
    hash.appendChild(code);
  }

  function fillIos(ios) {
    // iOS : lien TestFlight optionnel (variable IOS_TESTFLIGHT_URL du
    // workflow). Sans lien, la carte annonce la future distribution Ad Hoc.
    if (!ios || !ios.url) return;
    var btn = document.getElementById('ios-btn');
    btn.href = ios.url;
    btn.hidden = false;
    document.getElementById('ios-meta').textContent = 'Via TestFlight · sur invitation';
    document.getElementById('ios-note').textContent =
      "Installez d'abord l'application TestFlight d'Apple, puis ouvrez le lien d'invitation.";
  }

  function render(release) {
    var info = document.getElementById('release-info');
    info.textContent = 'Version ' + release.version +
      (release.published_at ? ' · publiée le ' + formatDate(release.published_at) : '');

    fillAsset('android', release.android);
    fillAsset('windows', release.windows);
    fillIos(release.ios);

    if (release.sums_url) document.getElementById('sums-link').href = release.sums_url;
    if (release.releases_url) document.getElementById('all-releases').href = release.releases_url;
    if (release.android_cert_sha256) {
      document.getElementById('android-cert').textContent = release.android_cert_sha256;
    }
  }

  highlightPlatform();

  fetch('release.json', { cache: 'no-cache' })
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(render)
    .catch(function () {
      document.getElementById('release-info').textContent = 'Aucune version publiée pour le moment.';
    });
})();
