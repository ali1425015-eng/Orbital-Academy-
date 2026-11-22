/* Boot: connect to the server (or fall back to offline mode), restore the
   session, route to login / bridge / teacher dashboard. */
(function (OA) {
  var U = OA.U;
  OA.app = {
    user: null,
    enter: function (u) {
      OA.app.user = u;
      if (u.role === 'teacher') OA.Teacher.show(); else OA.Hub.show();
      U.toast('مرحباً ' + U.esc(u.displayName) + ' 👋 ' + (u.role === 'teacher' ? '' : u.rank.icon + ' ' + u.rank.ar), 'good');
    }
  };
  OA.Api.connect().then(function (api) {
    OA.api = api;
    if (api.hasSession()) {
      api.me().then(function (u) { OA.app.user = u; if (u.role === 'teacher') OA.Teacher.show(); else OA.Hub.show(); }).catch(function () { OA.Login.show(); });
    } else OA.Login.show();
  });
})(window.OA = window.OA || {});
