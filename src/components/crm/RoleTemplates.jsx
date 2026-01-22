import React from "react";
import { UserCheck, Users, Crown, Briefcase } from "lucide-react";

/**
 * Pre-defined role templates for quick setup
 */
export const roleTemplates = [
  {
    id: 'sales_rep',
    name: 'Sales Representative',
    icon: UserCheck,
    description: 'Can manage their own contacts, companies, and deals',
    permissions: {
      crm: {
        contacts: { view: true, create: true, edit: true, delete: false, export: false, view_all: false },
        companies: { view: true, create: true, edit: true, delete: false, export: false, view_all: false },
        deals: { view: true, create: true, edit: true, delete: false, export: false, view_all: false },
        leads: { view: true, create: true, edit: true, delete: false, export: false, view_all: false },
        activities: { view: true, create: true, edit: true, delete: false },
        tasks: { view: true, create: true, edit: true, delete: false, export: false }
      },
      marketing: {
        campaigns: { view: true, create: false, edit: false, delete: false, send: false },
        templates: { view: true, create: false, edit: false, delete: false },
        lists: { view: true, create: false, edit: false, delete: false },
        forms: { view: true, create: false, edit: false, delete: false }
      },
      service: {
        tickets: { view: true, create: true, edit: true, delete: false, assign: false, view_all: false }
      },
      analytics: {
        reports: { view: true, create: false, edit: false, delete: false, export: false },
        dashboards: { view: true, create: false, edit: false, delete: false }
      },
      settings: {
        manage_users: false,
        manage_roles: false,
        manage_integrations: false,
        view_audit_log: false,
        manage_workflows: false,
        manage_data_quality: false
      },
      data_operations: {
        import: false,
        export: false,
        bulk_edit: false,
        bulk_delete: false
      }
    }
  },
  {
    id: 'sales_manager',
    name: 'Sales Manager',
    icon: Briefcase,
    description: 'Full access to CRM, can view all records and export data',
    permissions: {
      crm: {
        contacts: { view: true, create: true, edit: true, delete: true, export: true, view_all: true },
        companies: { view: true, create: true, edit: true, delete: true, export: true, view_all: true },
        deals: { view: true, create: true, edit: true, delete: true, export: true, view_all: true },
        leads: { view: true, create: true, edit: true, delete: true, export: true, view_all: true },
        activities: { view: true, create: true, edit: true, delete: true },
        tasks: { view: true, create: true, edit: true, delete: true, export: true }
      },
      marketing: {
        campaigns: { view: true, create: true, edit: true, delete: false, send: false },
        templates: { view: true, create: true, edit: true, delete: false },
        lists: { view: true, create: true, edit: true, delete: false },
        forms: { view: true, create: false, edit: false, delete: false }
      },
      service: {
        tickets: { view: true, create: true, edit: true, delete: false, assign: true, view_all: true }
      },
      analytics: {
        reports: { view: true, create: true, edit: true, delete: false, export: true },
        dashboards: { view: true, create: true, edit: true, delete: false }
      },
      settings: {
        manage_users: false,
        manage_roles: false,
        manage_integrations: false,
        view_audit_log: true,
        manage_workflows: false,
        manage_data_quality: true
      },
      data_operations: {
        import: true,
        export: true,
        bulk_edit: true,
        bulk_delete: false
      }
    }
  },
  {
    id: 'marketing_specialist',
    name: 'Marketing Specialist',
    icon: Users,
    description: 'Full marketing access, limited CRM access',
    permissions: {
      crm: {
        contacts: { view: true, create: true, edit: false, delete: false, export: true, view_all: true },
        companies: { view: true, create: false, edit: false, delete: false, export: true, view_all: true },
        deals: { view: true, create: false, edit: false, delete: false, export: false, view_all: false },
        leads: { view: true, create: true, edit: true, delete: false, export: true, view_all: true },
        activities: { view: true, create: true, edit: false, delete: false },
        tasks: { view: true, create: true, edit: true, delete: false, export: false }
      },
      marketing: {
        campaigns: { view: true, create: true, edit: true, delete: true, send: true },
        templates: { view: true, create: true, edit: true, delete: true },
        lists: { view: true, create: true, edit: true, delete: true },
        forms: { view: true, create: true, edit: true, delete: true }
      },
      service: {
        tickets: { view: true, create: false, edit: false, delete: false, assign: false, view_all: false }
      },
      analytics: {
        reports: { view: true, create: true, edit: true, delete: false, export: true },
        dashboards: { view: true, create: true, edit: true, delete: false }
      },
      settings: {
        manage_users: false,
        manage_roles: false,
        manage_integrations: false,
        view_audit_log: false,
        manage_workflows: false,
        manage_data_quality: false
      },
      data_operations: {
        import: true,
        export: true,
        bulk_edit: true,
        bulk_delete: false
      }
    }
  },
  {
    id: 'support_agent',
    name: 'Support Agent',
    icon: Crown,
    description: 'Service-focused role with ticket management',
    permissions: {
      crm: {
        contacts: { view: true, create: true, edit: true, delete: false, export: false, view_all: true },
        companies: { view: true, create: false, edit: false, delete: false, export: false, view_all: true },
        deals: { view: true, create: false, edit: false, delete: false, export: false, view_all: false },
        leads: { view: true, create: false, edit: false, delete: false, export: false, view_all: false },
        activities: { view: true, create: true, edit: true, delete: false },
        tasks: { view: true, create: true, edit: true, delete: false, export: false }
      },
      marketing: {
        campaigns: { view: false, create: false, edit: false, delete: false, send: false },
        templates: { view: true, create: false, edit: false, delete: false },
        lists: { view: false, create: false, edit: false, delete: false },
        forms: { view: true, create: false, edit: false, delete: false }
      },
      service: {
        tickets: { view: true, create: true, edit: true, delete: false, assign: true, view_all: true }
      },
      analytics: {
        reports: { view: true, create: false, edit: false, delete: false, export: false },
        dashboards: { view: true, create: false, edit: false, delete: false }
      },
      settings: {
        manage_users: false,
        manage_roles: false,
        manage_integrations: false,
        view_audit_log: false,
        manage_workflows: false,
        manage_data_quality: false
      },
      data_operations: {
        import: false,
        export: false,
        bulk_edit: false,
        bulk_delete: false
      }
    }
  }
];

export default function RoleTemplates({ onSelectTemplate }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {roleTemplates.map(template => (
        <button
          key={template.id}
          onClick={() => onSelectTemplate(template)}
          className="ampvibe-card p-6 text-left hover:scale-105 transition-all"
        >
          <div className="flex items-start gap-4">
            <div className="ampvibe-inset p-3 rounded-lg">
              <template.icon className="w-6 h-6" style={{ color: "#0066cc" }} />
            </div>
            <div>
              <h3 className="font-bold mb-1" style={{ color: "#111827" }}>
                {template.name}
              </h3>
              <p className="text-sm" style={{ color: "#6b7280" }}>
                {template.description}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}