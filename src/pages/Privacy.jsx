import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, Shield } from "lucide-react";

export default function Privacy() {
  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <Link to={createPageUrl("Home")}>
          <button className="ampvibe-button mb-6 flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </Link>

        <div className="ampvibe-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="ampvibe-button-primary p-3 rounded-xl">
              <Shield className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "#666" }}>
              Privacy Policy
            </h1>
          </div>

          <div className="space-y-6" style={{ color: "#666", lineHeight: "1.8" }}>
            <p className="text-sm" style={{ color: "#888" }}>
              Last Updated: December 22, 2025
            </p>

            <section>
              <h2 className="text-2xl font-bold mb-3">1. Information We Collect</h2>
              <p>
                AmplifyCRM collects information you provide directly to us, including:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Account information (name, email, password)</li>
                <li>Contact data (customers, leads, companies)</li>
                <li>Communication data (emails, calls, messages)</li>
                <li>Activity data (tasks, notes, calendar events)</li>
                <li>Usage data (how you interact with our platform)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Provide, maintain, and improve our CRM services</li>
                <li>Process transactions and send related information</li>
                <li>Send technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns and optimize user experience</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. Information Sharing</h2>
              <p>
                We do not sell your personal information. We may share your information only in these circumstances:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>With your consent</li>
                <li>To comply with legal obligations</li>
                <li>To protect our rights and safety</li>
                <li>With service providers who assist our operations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Third-Party Integrations</h2>
              <p>
                AmplifyCRM integrates with third-party services (Gmail, Google Calendar, HubSpot, RingCentral, etc.).
                When you connect these services, you authorize us to access your data from those platforms according to
                their respective privacy policies and the permissions you grant.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Data Security</h2>
              <p>
                We implement appropriate technical and organizational measures to protect your personal information
                against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission
                over the internet is 100% secure.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Data Retention</h2>
              <p>
                We retain your information for as long as your account is active or as needed to provide you services.
                You may request deletion of your account and data at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Your Rights</h2>
              <p>You have the right to:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">8. Cookies and Tracking</h2>
              <p>
                We use cookies and similar tracking technologies to track activity on our service and hold certain information.
                You can instruct your browser to refuse all cookies or indicate when a cookie is being sent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">9. Children's Privacy</h2>
              <p>
                Our service is not intended for children under 13 years of age. We do not knowingly collect personal
                information from children under 13.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">10. Changes to This Policy</h2>
              <p>
                We may update this privacy policy from time to time. We will notify you of any changes by posting the
                new policy on this page and updating the "Last Updated" date.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">11. Contact Us</h2>
              <p>
                If you have questions about this privacy policy, please contact us at:
              </p>
              <div className="ampvibe-inset p-4 mt-2 rounded-lg">
                <p className="font-medium">Email: privacy@amplend.net</p>
                <p className="font-medium">Website: https://crm.amplend.net</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}