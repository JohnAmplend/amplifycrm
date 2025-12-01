import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { AlertTriangle, CheckCircle, Copy, Users, Mail, Phone, Briefcase, TrendingUp, RefreshCw, X } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";

export default function DataQuality() {
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [selectedIssue, setSelectedIssue] = useState('all');

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const { data: duplicates = [] } = useQuery({
    queryKey: ['duplicates'],
    queryFn: () => base44.entities.Duplicate_Records.list()
  });

  const analyzeDataQuality = () => {
    setScanning(true);

    const issues = {
      missingEmail: [],
      missingPhone: [],
      missingJobTitle: [],
      missingCompany: [],
      missingOwner: [],
      incompleteAddress: [],
      noRecentActivity: []
    };

    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    contacts.forEach(contact => {
      if (!contact.email) issues.missingEmail.push(contact);
      if (!contact.phone && !contact.mobile) issues.missingPhone.push(contact);
      if (!contact.job_title) issues.missingJobTitle.push(contact);
      if (!contact.company_id) issues.missingCompany.push(contact);
      if (!contact.contact_owner) issues.missingOwner.push(contact);
      if (!contact.city || !contact.state || !contact.country) {
        issues.incompleteAddress.push(contact);
      }
      if (!contact.last_contacted || new Date(contact.last_contacted) < threeMonthsAgo) {
        issues.noRecentActivity.push(contact);
      }
    });

    const totalIssues = Object.values(issues).reduce((sum, arr) => sum + arr.length, 0);
    const qualityScore = Math.round(((contacts.length * 7 - totalIssues) / (contacts.length * 7)) * 100);

    setScanResults({
      qualityScore,
      issues,
      totalContacts: contacts.length,
      totalIssues
    });

    setTimeout(() => setScanning(false), 1000);
  };

  useEffect(() => {
    if (contacts.length > 0) {
      analyzeDataQuality();
    }
  }, [contacts]);

  const getIssueColor = (type) => {
    const colors = {
      missingEmail: '#ef4444',
      missingPhone: '#f59e0b',
      missingJobTitle: '#eab308',
      missingCompany: '#84cc16',
      missingOwner: '#ef4444',
      incompleteAddress: '#06b6d4',
      noRecentActivity: '#8b5cf6'
    };
    return colors[type] || '#888';
  };

  const getIssueLabel = (type) => {
    const labels = {
      missingEmail: 'Missing Email',
      missingPhone: 'Missing Phone',
      missingJobTitle: 'Missing Job Title',
      missingCompany: 'Missing Company',
      missingOwner: 'Missing Owner',
      incompleteAddress: 'Incomplete Address',
      noRecentActivity: 'No Recent Activity (3+ months)'
    };
    return labels[type] || type;
  };

  const filteredContacts = () => {
    if (!scanResults) return [];
    if (selectedIssue === 'all') {
      const allIssues = new Set();
      Object.values(scanResults.issues).forEach(arr => {
        arr.forEach(contact => allIssues.add(contact.id));
      });
      return contacts.filter(c => allIssues.has(c.id));
    }
    return scanResults.issues[selectedIssue] || [];
  };

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Data Quality
            </h1>
            <p style={{ color: "#888" }}>
              Analyze and improve the quality of your contact data
            </p>
          </div>
          <NeuroButton onClick={analyzeDataQuality} disabled={scanning}>
            <RefreshCw className={`w-4 h-4 mr-2 ${scanning ? 'animate-spin' : ''}`} />
            {scanning ? 'Scanning...' : 'Rescan Data'}
          </NeuroButton>
        </div>

        {/* Overall Score */}
        {scanResults && (
          <NeuroCard className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold mb-2" style={{ color: "#666" }}>
                  Overall Data Quality Score
                </h2>
                <p style={{ color: "#888" }}>
                  Based on {scanResults.totalContacts} contacts with {scanResults.totalIssues} issues found
                </p>
              </div>
              <div className="text-center">
                <div 
                  className="text-6xl font-bold mb-2"
                  style={{ 
                    color: scanResults.qualityScore >= 80 ? '#52c41a' : 
                           scanResults.qualityScore >= 60 ? '#fa8c16' : '#ef4444'
                  }}
                >
                  {scanResults.qualityScore}%
                </div>
                <p className="text-sm" style={{ color: "#888" }}>
                  {scanResults.qualityScore >= 80 ? 'Excellent' :
                   scanResults.qualityScore >= 60 ? 'Good' :
                   scanResults.qualityScore >= 40 ? 'Fair' : 'Needs Attention'}
                </p>
              </div>
            </div>
          </NeuroCard>
        )}

        {/* Issue Categories */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => setSelectedIssue('all')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${selectedIssue === 'all' ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>All Issues</p>
                <p className="text-3xl font-bold" style={{ color: "#4a90e2" }}>
                  {scanResults?.totalIssues || 0}
                </p>
              </div>
              <AlertTriangle className="w-6 h-6" style={{ color: "#4a90e2" }} />
            </div>
          </button>

          <button
            onClick={() => setSelectedIssue('missingEmail')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${selectedIssue === 'missingEmail' ? 'ring-2 ring-red-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>Missing Email</p>
                <p className="text-3xl font-bold" style={{ color: "#ef4444" }}>
                  {scanResults?.issues.missingEmail.length || 0}
                </p>
              </div>
              <Mail className="w-6 h-6" style={{ color: "#ef4444" }} />
            </div>
          </button>

          <button
            onClick={() => setSelectedIssue('missingPhone')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${selectedIssue === 'missingPhone' ? 'ring-2 ring-orange-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>Missing Phone</p>
                <p className="text-3xl font-bold" style={{ color: "#f59e0b" }}>
                  {scanResults?.issues.missingPhone.length || 0}
                </p>
              </div>
              <Phone className="w-6 h-6" style={{ color: "#f59e0b" }} />
            </div>
          </button>

          <Link to={createPageUrl("DuplicateManagement")}>
            <button className="ampvibe-card p-6 text-left transition-all hover:scale-105 w-full h-full">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>Duplicates</p>
                  <p className="text-3xl font-bold" style={{ color: "#8b5cf6" }}>
                    {duplicates.length}
                  </p>
                </div>
                <Copy className="w-6 h-6" style={{ color: "#8b5cf6" }} />
              </div>
            </button>
          </Link>
        </div>

        {/* Detailed Issues */}
        {scanResults && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {Object.entries(scanResults.issues).map(([issueType, contactList]) => (
              <button
                key={issueType}
                onClick={() => setSelectedIssue(issueType)}
                className={`ampvibe-card p-4 text-left transition-all hover:scale-102 ${selectedIssue === issueType ? 'ring-2' : ''}`}
                style={{ 
                  borderLeftWidth: '4px',
                  borderLeftColor: getIssueColor(issueType)
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium mb-1" style={{ color: "#666" }}>
                      {getIssueLabel(issueType)}
                    </p>
                    <p className="text-sm" style={{ color: "#888" }}>
                      {contactList.length} contact{contactList.length !== 1 ? 's' : ''} affected
                    </p>
                  </div>
                  <AlertTriangle className="w-5 h-5" style={{ color: getIssueColor(issueType) }} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Affected Contacts */}
        <NeuroCard>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold" style={{ color: "#666" }}>
              {selectedIssue === 'all' ? 'All Contacts with Issues' : getIssueLabel(selectedIssue)}
            </h3>
            {selectedIssue !== 'all' && (
              <button
                onClick={() => setSelectedIssue('all')}
                className="ampvibe-button px-3 py-2"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filter
              </button>
            )}
          </div>

          {filteredContacts().length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 mx-auto mb-4" style={{ color: "#52c41a" }} />
              <p className="text-lg font-medium mb-2" style={{ color: "#666" }}>
                No issues found!
              </p>
              <p style={{ color: "#888" }}>
                Your contact data quality is excellent.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Name</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Email</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Phone</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Issues</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts().map(contact => {
                    const contactIssues = [];
                    Object.entries(scanResults.issues).forEach(([type, list]) => {
                      if (list.find(c => c.id === contact.id)) {
                        contactIssues.push(type);
                      }
                    });

                    return (
                      <tr key={contact.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#d8d8d8" }}>
                        <td className="py-3 px-4">
                          <p className="font-medium" style={{ color: "#666" }}>
                            {contact.first_name} {contact.last_name}
                          </p>
                        </td>
                        <td className="py-3 px-4" style={{ color: "#888" }}>
                          {contact.email || <span style={{ color: "#ef4444" }}>Missing</span>}
                        </td>
                        <td className="py-3 px-4" style={{ color: "#888" }}>
                          {contact.phone || contact.mobile || <span style={{ color: "#f59e0b" }}>Missing</span>}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-wrap gap-1">
                            {contactIssues.map(issue => (
                              <span
                                key={issue}
                                className="px-2 py-1 rounded text-xs"
                                style={{
                                  backgroundColor: `${getIssueColor(issue)}20`,
                                  color: getIssueColor(issue)
                                }}
                              >
                                {getIssueLabel(issue)}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Link to={createPageUrl("ContactDetail") + `?id=${contact.id}`}>
                            <NeuroButton size="sm">
                              Fix Issues
                            </NeuroButton>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </NeuroCard>

        {/* Best Practices */}
        <NeuroCard className="mt-6">
          <h3 className="text-xl font-bold mb-4" style={{ color: "#666" }}>
            Data Entry Best Practices
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="ampvibe-inset p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "#52c41a" }} />
                <div>
                  <p className="font-medium mb-1" style={{ color: "#666" }}>Always capture email addresses</p>
                  <p className="text-sm" style={{ color: "#888" }}>
                    Email is essential for communication and automation workflows.
                  </p>
                </div>
              </div>
            </div>
            <div className="ampvibe-inset p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "#52c41a" }} />
                <div>
                  <p className="font-medium mb-1" style={{ color: "#666" }}>Keep contact information current</p>
                  <p className="text-sm" style={{ color: "#888" }}>
                    Update records after every interaction to maintain accuracy.
                  </p>
                </div>
              </div>
            </div>
            <div className="ampvibe-inset p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "#52c41a" }} />
                <div>
                  <p className="font-medium mb-1" style={{ color: "#666" }}>Assign owners to all contacts</p>
                  <p className="text-sm" style={{ color: "#888" }}>
                    Clear ownership ensures accountability and follow-up.
                  </p>
                </div>
              </div>
            </div>
            <div className="ampvibe-inset p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "#52c41a" }} />
                <div>
                  <p className="font-medium mb-1" style={{ color: "#666" }}>Check for duplicates regularly</p>
                  <p className="text-sm" style={{ color: "#888" }}>
                    Prevent data redundancy by merging duplicate records promptly.
                  </p>
                </div>
              </div>
            </div>
            <div className="ampvibe-inset p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "#52c41a" }} />
                <div>
                  <p className="font-medium mb-1" style={{ color: "#666" }}>Complete all core fields</p>
                  <p className="text-sm" style={{ color: "#888" }}>
                    Job title, company, and location help with segmentation.
                  </p>
                </div>
              </div>
            </div>
            <div className="ampvibe-inset p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 mt-1 flex-shrink-0" style={{ color: "#52c41a" }} />
                <div>
                  <p className="font-medium mb-1" style={{ color: "#666" }}>Log all interactions</p>
                  <p className="text-sm" style={{ color: "#888" }}>
                    Document calls, emails, and meetings for complete history.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </NeuroCard>
      </div>
    </div>
  );
}