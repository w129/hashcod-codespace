const Root = () => {
  React.useEffect(() => { document.getElementById('root')?.setAttribute('data-mounted','1'); }, []);
  const [tourOpen, setTourOpen] = React.useState(false);
  const [enterprise, setEnterprise] = React.useState({ ready: false, status: null });
  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!window.OCGEnterprise) {
        setEnterprise({ ready: true, status: { ok: false, failed: [{ id: 'enterprise-module-missing', detail: 'app/enterprise.js not loaded' }] } });
        return;
      }
      const status = await window.OCGEnterprise.runSelfTests();
      if (alive) setEnterprise({ ready: true, status });
    })();
    return () => { alive = false; };
  }, []);
  React.useEffect(() => {
    window.__startTour = () => {
      if (window.resetTourSeen) window.resetTourSeen();
      setTourOpen(true);
    };
    return () => { delete window.__startTour; };
  }, []);
  React.useEffect(() => {
    if (enterprise.ready && enterprise.status?.ok && window.AppTour && !window.hasSeenTour?.()) {
      setTimeout(() => setTourOpen(true), 420);
    }
  }, [enterprise.ready, enterprise.status?.ok]);
  if (enterprise.ready && !enterprise.status?.ok) {
    return <div className="boot-screen"><div className="boot-card"><div className="boot-logo"><img src="app/hashcod-platform-icon.svg?v=hashcod-classic-1" alt="" /><div>Hashcod <span>Cryptographic Platform</span></div></div><div className="boot-text">Enterprise gate blocked startup. Review the failed self-tests.</div><pre className="boot-error">{JSON.stringify(enterprise.status?.failed || [], null, 2)}</pre></div></div>;
  }

  const PlatformApp = window.App;
  return <>
    <PlatformApp />
    {window.AppTour ? <window.AppTour active={tourOpen} onClose={() => setTourOpen(false)} /> : null}
  </>;
};
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<Root />);
