import React from 'react';

// Transparent line icons (stroke only, inherit currentColor) for the subscription action buttons.
function Line({ children }) {
  return <svg className="hco-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{children}</svg>;
}

export const PlansIcon = () => <Line><path d="M3 9.5 12 4l9 5.5-9 5.5-9-5.5Z" /><path d="m3 14.5 9 5.5 9-5.5" /></Line>;
export const PaymentsIcon = () => <Line><rect x="2.5" y="5.5" width="19" height="13" rx="2.5" /><path d="M2.5 10h19M6.5 15h4" /></Line>;
export const RequestsIcon = () => <Line><path d="M12 3 4.5 6v5.5c0 4.4 3.1 8 7.5 9.5 4.4-1.5 7.5-5.1 7.5-9.5V6L12 3Z" /><path d="m8.8 12.2 2.3 2.3 4.1-4.5" /></Line>;
