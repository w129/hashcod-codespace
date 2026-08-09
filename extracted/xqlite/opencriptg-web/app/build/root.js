(function () {
const Root = () => {
  React.useEffect(() => {
    document.getElementById('root')?.setAttribute('data-mounted', '1');
  }, []);
  const [tourOpen, setTourOpen] = React.useState(false);
  const [enterprise, setEnterprise] = React.useState({
    ready: false,
    status: null
  });
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!window.OCGEnterprise) {
        setEnterprise({
          ready: true,
          status: {
            ok: false,
            failed: [{
              id: 'enterprise-module-missing',
              detail: 'app/enterprise.js not loaded'
            }]
          }
        });
        return;
      }
      const status = await window.OCGEnterprise.runSelfTests();
      if (alive) setEnterprise({
        ready: true,
        status
      });
    })();
    return () => {
      alive = false;
    };
  }, []);
  React.useEffect(() => {
    window.__startTour = () => {
      if (window.resetTourSeen) window.resetTourSeen();
      setTourOpen(true);
    };
    return () => {
      delete window.__startTour;
    };
  }, []);
  React.useEffect(() => {
    if (enterprise.ready && enterprise.status?.ok && window.AppTour && !window.hasSeenTour?.()) {
      setTimeout(() => setTourOpen(true), 420);
    }
  }, [enterprise.ready, enterprise.status?.ok]);
  if (enterprise.ready && !enterprise.status?.ok) {
    return React.createElement("div", {
      className: "boot-screen"
    }, React.createElement("div", {
      className: "boot-card"
    }, React.createElement("div", {
      className: "boot-logo"
    }, React.createElement("img", {
      src: "app/hashcod-platform-icon.svg?v=hashcod-classic-1",
      alt: ""
    }), React.createElement("div", null, "Hashcod ", React.createElement("span", null, "Cryptographic Platform"))), React.createElement("div", {
      className: "boot-text"
    }, "Enterprise gate blocked startup. Review the failed self-tests."), React.createElement("pre", {
      className: "boot-error"
    }, JSON.stringify(enterprise.status?.failed || [], null, 2))));
  }
  const PlatformApp = window.App;
  return React.createElement(React.Fragment, null, React.createElement(PlatformApp, null), window.AppTour ? React.createElement(window.AppTour, {
    active: tourOpen,
    onClose: () => setTourOpen(false)
  }) : null);
};
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(Root, null));
})();
