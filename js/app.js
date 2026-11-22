/* Boot: connect to the server (or offline mode), restore the session, open the right screen. */
(function (OA) {
  var U = OA.U;
  OA.app = {
    user: null, prog: null,
    enter: function (u) {
      OA.app.user = u; OA.app.prog = null;
      OA.Shell.go(u.role === 'teacher' ? 'teacher' : 'home');
      U.toast(OA.t('hi', { name: U.esc(u.displayName) }), 'good');
    }
  };
  OA.Api.connect().then(function (api) {
    OA.api = api;
    if (api.hasSession()) {
      api.me().then(function (u) { OA.app.user = u; OA.Shell.go(u.role === 'teacher' ? 'teacher' : 'home'); }).catch(function () { OA.Login.show(); });
    } else OA.Login.show();
  });
})(window.OA = window.OA || {});
