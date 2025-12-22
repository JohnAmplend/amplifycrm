import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowLeft, FileText } from "lucide-react";

export default function Terms() {
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
              <FileText className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold" style={{ color: "#666" }}>
              Terms of Service
            </h1>
          </div>

          <div className="space-y-6" style={{ color: "#666", lineHeight: "1.8" }}>
            <p className="text-sm" style={{ color: "#888" }}>
              Last Updated: December 22, 2025
            </p>

            <section>
              <h2 className="text-2xl font-bold mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using AmplifyCRM ("Service"), you accept and agree to be bound by the terms and
                provision of this agreement. If you do not agree to these terms, please do not use our Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">2. Description of Service</h2>
              <p>
                AmplifyCRM provides a cloud-based customer relationship management platform that includes contact
                management, deal tracking, email integration, activity logging, reporting, and related business tools.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">3. User Accounts</h2>
              <ul className="list-disc ml-6 space-y-2">
                <li>You must create an account to use our Service</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You are responsible for all activities that occur under your account</li>
                <li>You must notify us immediately of any unauthorized use of your account</li>
                <li>You must be at least 18 years old to use this Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">4. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>Use the Service for any illegal purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Infringe on the intellectual property rights of others</li>
                <li>Transmit any viruses, malware, or harmful code</li>
                <li>Attempt to gain unauthorized access to any portion of the Service</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use the Service to send spam or unsolicited messages</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">5. Data Ownership and Privacy</h2>
              <p>
                You retain all rights to your data stored in AmplifyCRM. We will not access, use, or share your data
                except as described in our Privacy Policy or as required by law. You grant us a limited license to
                store and process your data to provide the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">6. Third-Party Integrations</h2>
              <p>
                AmplifyCRM integrates with third-party services (Gmail, Google Calendar, HubSpot, RingCentral, etc.).
                Your use of these integrations is subject to the terms and conditions of those third-party services.
                We are not responsible for the availability, accuracy, or reliability of third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">7. Fees and Payment</h2>
              <p>
                Some features of AmplifyCRM may require payment. You agree to pay all fees associated with your account.
                All fees are non-refundable unless otherwise stated. We reserve the right to change our pricing at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">8. Intellectual Property</h2>
              <p>
                The Service and its original content, features, and functionality are owned by AmplifyCRM and are
                protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">9. Termination</h2>
              <p>
                We may terminate or suspend your account and access to the Service immediately, without prior notice,
                for any reason, including breach of these Terms. Upon termination, your right to use the Service will
                immediately cease. You may also terminate your account at any time.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">10. Disclaimer of Warranties</h2>
              <p>
                The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind, either express or
                implied, including but not limited to warranties of merchantability, fitness for a particular purpose,
                and non-infringement.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">11. Limitation of Liability</h2>
              <p>
                In no event shall AmplifyCRM be liable for any indirect, incidental, special, consequential, or punitive
                damages, including loss of profits, data, use, or goodwill, arising out of your use of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">12. Data Backup and Loss</h2>
              <p>
                While we implement backup procedures, you are responsible for maintaining your own backup copies of
                your data. We are not responsible for any data loss.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">13. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of any material changes.
                Your continued use of the Service after changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">14. Governing Law</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which
                AmplifyCRM operates, without regard to its conflict of law provisions.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-3">15. Contact Information</h2>
              <p>
                If you have any questions about these Terms, please contact us at:
              </p>
              <div className="ampvibe-inset p-4 mt-2 rounded-lg">
                <p className="font-medium">Email: support@amplend.net</p>
                <p className="font-medium">Website: https://crm.amplend.net</p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}