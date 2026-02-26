import React from "react";
import { Calendar, CheckCircle, Clock, AlertCircle, Target } from "lucide-react";

export default function ProjectTimeline() {
  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
            AmplifyCRM Development Timeline
          </h1>
          <p style={{ color: "#888" }}>Project roadmap and completion status</p>
        </div>

        {/* Current State */}
        <div className="ampvibe-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="ampvibe-button-primary p-3 rounded-xl">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: "#666" }}>
              Current State
            </h2>
          </div>
          <div className="ampvibe-inset p-4 rounded-xl space-y-3">
            <p style={{ color: "#666" }} className="leading-relaxed">
              Post-MVP iterations exposed a structural gap: <strong>Roles and Permissions require significantly higher system access.</strong>
            </p>
            <p style={{ color: "#666" }} className="leading-relaxed">
              Reverted to pre-MVP scope to fully rebuild the role and permission system (major refactor).
            </p>
            <p style={{ color: "#666" }} className="leading-relaxed">
              UI/UX core CRM features remain on track toward the 6-week target.
            </p>
            <div className="mt-4 p-3 rounded-lg" style={{ background: "rgba(0, 168, 107, 0.1)" }}>
              <p style={{ color: "#00A86B" }} className="font-medium">
                ✅ System is fully functional. Working on enhanced multi-role access and workflow optimization.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="ampvibe-card p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="ampvibe-button-primary p-3 rounded-xl">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: "#666" }}>
              Timeline <span style={{ color: "#888" }} className="text-sm font-normal">(Rollouts on Thursday)</span>
            </h2>
          </div>

          <div className="space-y-4">
            {/* This Week */}
            <div className="ampvibe-inset p-4 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <Clock className="w-5 h-5 mt-1" style={{ color: "#4a90e2" }} />
                <div className="flex-1">
                  <h3 className="font-bold mb-2" style={{ color: "#666" }}>
                    This Week
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span style={{ color: "#fa8c16" }}>⚙️</span>
                      <p style={{ color: "#666" }}>Finalize new role and permission system</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span style={{ color: "#00A86B" }}>🏃</span>
                      <p style={{ color: "#666" }}>Prepare multi-role access for core CRM modules</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* March: Week 1 */}
            <div className="ampvibe-inset p-4 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <Calendar className="w-5 h-5 mt-1" style={{ color: "#52c41a" }} />
                <div className="flex-1">
                  <h3 className="font-bold mb-2" style={{ color: "#666" }}>
                    March: Week 1
                  </h3>
                  <div className="flex items-start gap-2">
                    <span style={{ color: "#00A86B" }}>🏃</span>
                    <p style={{ color: "#666" }}>Contact / Company / Lead / Deal multi-role re-onboarding + QA</p>
                  </div>
                </div>
              </div>
            </div>

            {/* March: Week 2 */}
            <div className="ampvibe-inset p-4 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <Calendar className="w-5 h-5 mt-1" style={{ color: "#52c41a" }} />
                <div className="flex-1">
                  <h3 className="font-bold mb-2" style={{ color: "#666" }}>
                    March: Week 2
                  </h3>
                  <div className="flex items-start gap-2">
                    <span style={{ color: "#fa8c16" }}>⚙️</span>
                    <p style={{ color: "#666" }}>Advanced workflow automation pilot rollout</p>
                  </div>
                </div>
              </div>
            </div>

            {/* March: Week 3 */}
            <div className="ampvibe-inset p-4 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <Calendar className="w-5 h-5 mt-1" style={{ color: "#52c41a" }} />
                <div className="flex-1">
                  <h3 className="font-bold mb-2" style={{ color: "#666" }}>
                    March: Week 3
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span style={{ color: "#00A86B" }}>🏃</span>
                      <p style={{ color: "#666" }}>Advanced automation QA with team members</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span style={{ color: "#4a90e2" }}>🖼️</span>
                      <p style={{ color: "#666" }}>Enhanced analytics dashboard rollout</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* March: Last Week */}
            <div className="ampvibe-inset p-4 rounded-xl" style={{ border: "2px solid #00A86B" }}>
              <div className="flex items-start gap-3 mb-3">
                <Calendar className="w-5 h-5 mt-1" style={{ color: "#00A86B" }} />
                <div className="flex-1">
                  <h3 className="font-bold mb-2" style={{ color: "#00A86B" }}>
                    March: Last Week ⭐ DEADLINE
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <span style={{ color: "#fa8c16" }}>📝</span>
                      <p style={{ color: "#666" }}>Custom forms builder and website integration rollout</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span style={{ color: "#4a90e2" }}>✉️</span>
                      <p style={{ color: "#666" }}>Full email system availability (inbox, campaigns, templates)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* April: Weeks 2-3 */}
            <div className="ampvibe-inset p-4 rounded-xl">
              <div className="flex items-start gap-3 mb-3">
                <Calendar className="w-5 h-5 mt-1" style={{ color: "#eb2f96" }} />
                <div className="flex-1">
                  <h3 className="font-bold mb-2" style={{ color: "#666" }}>
                    April: Weeks 2–3
                  </h3>
                  <div className="flex items-start gap-2">
                    <span style={{ color: "#4a90e2" }}>🖼️</span>
                    <p style={{ color: "#666" }}>Remaining CRM workflow optimization rollout</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Focus Areas */}
        <div className="ampvibe-card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="ampvibe-button-primary p-3 rounded-xl">
              <Target className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold" style={{ color: "#666" }}>
              Next Focus Areas
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="ampvibe-inset p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: "#4a90e2" }}>🖼️</span>
                <h3 className="font-bold" style={{ color: "#666" }}>Branding</h3>
              </div>
              <p className="text-sm" style={{ color: "#888" }}>
                Enhanced UI/UX customization and white-label capabilities
              </p>
            </div>
            <div className="ampvibe-inset p-4 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span style={{ color: "#fa8c16" }}>⚙️</span>
                <h3 className="font-bold" style={{ color: "#666" }}>AI Enhancement</h3>
              </div>
              <p className="text-sm" style={{ color: "#888" }}>
                Intelligent lead scoring, deal recommendations, and workflow automation
              </p>
            </div>
          </div>
        </div>

        {/* Status Note */}
        <div className="mt-6 p-4 rounded-xl" style={{ background: "rgba(74, 144, 226, 0.1)", border: "1px solid rgba(74, 144, 226, 0.2)" }}>
          <p style={{ color: "#4a90e2" }} className="text-sm">
            <strong>Note:</strong> AmplifyCRM is fully functional. All core features are operational. 
            Current focus is on enhancing multi-role access and optimizing workflows to support advanced use cases. 
            All testable features have been QA'd and are production-ready.
          </p>
        </div>
      </div>
    </div>
  );
}