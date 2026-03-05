import React from "react";

export default function FrozenAccountScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{
      background: 'linear-gradient(135deg, #F5F7FA 0%, #E6F0FA 100%)'
    }}>
      <div className="ampvibe-card p-12 max-w-md w-full mx-4 text-center">
        {/* Amplend Logo / Brand */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold" style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #00A86B 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            AmplifyCRM
          </h1>
          <p className="text-sm mt-1" style={{ color: "#888" }}>by Amplend</p>
        </div>

        {/* Frozen Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center" style={{
            background: 'linear-gradient(135deg, #fee2e2, #fecaca)',
            border: '2px solid #fca5a5'
          }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="#dc2626" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
        </div>

        <h2 className="text-2xl font-bold mb-3" style={{ color: "#1f2937" }}>
          Account Suspended
        </h2>
        <p className="mb-2" style={{ color: "#6b7280" }}>
          Your account has been temporarily frozen by your CRM administrator.
        </p>
        <p className="mb-8 text-sm" style={{ color: "#9ca3af" }}>
          Please contact your CRM admin to regain access.
        </p>

        <div className="ampvibe-inset p-4 rounded-xl text-sm" style={{ color: "#6b7280" }}>
          <p className="font-semibold mb-1" style={{ color: "#374151" }}>Need help?</p>
          <p>Reach out to your organization's CRM administrator to have your account reinstated.</p>
        </div>
      </div>
    </div>
  );
}