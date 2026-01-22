import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Plus, Trash2, X, Users, Mail, UserPlus } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import { toast } from "../components/crm/useToast";

export default function ListDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [listId, setListId] = useState(null);
  const [list, setList] = useState(null);
  const [showAddContacts, setShowAddContacts] = useState(false);
  const [selectedContacts, setSelectedContacts] = useState([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    if (id) {
      setListId(id);
      loadList(id);
    }
  }, []);

  const loadList = async (id) => {
    try {
      const listData = await base44.entities.Contact_List.get(id);
      setList(listData);
    } catch (error) {
      toast.error('Failed to load list');
    }
  };

  const { data: members = [] } = useQuery({
    queryKey: ['list-members', listId],
    queryFn: () => base44.entities.Contact_List_Member.filter({ list_id: listId }),
    enabled: !!listId
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list()
  });

  const addMembersMutation = useMutation({
    mutationFn: async (contactIds) => {
      await Promise.all(contactIds.map(contactId =>
        base44.entities.Contact_List_Member.create({
          list_id: listId,
          contact_id: contactId,
          status: 'Active'
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['list-members']);
      toast.success('Contacts added to list');
      setShowAddContacts(false);
      setSelectedContacts([]);
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId) => base44.entities.Contact_List_Member.delete(memberId),
    onSuccess: () => {
      queryClient.invalidateQueries(['list-members']);
      toast.success('Contact removed from list');
    }
  });

  const memberContactIds = members.map(m => m.contact_id);
  const memberContacts = contacts.filter(c => memberContactIds.includes(c.id));
  const availableContacts = contacts.filter(c => !memberContactIds.includes(c.id));

  const toggleContactSelection = (contactId) => {
    if (selectedContacts.includes(contactId)) {
      setSelectedContacts(selectedContacts.filter(id => id !== contactId));
    } else {
      setSelectedContacts([...selectedContacts, contactId]);
    }
  };

  if (!list) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <p style={{ color: "#aaa" }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              {list.list_name}
            </h1>
            <p style={{ color: "#888" }}>{memberContacts.length} contacts in this list</p>
          </div>
          <div className="flex gap-3">
            <NeuroButton onClick={() => setShowAddContacts(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add Contacts
            </NeuroButton>
            <NeuroButton onClick={() => navigate(createPageUrl("ContactLists"))}>
              Back to Lists
            </NeuroButton>
          </div>
        </div>

        {/* List Info */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#888" }}>List Type</p>
              <p className="font-bold" style={{ color: "#666" }}>{list.list_type}</p>
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#888" }}>Total Contacts</p>
              <p className="font-bold" style={{ color: "#666" }}>{memberContacts.length}</p>
            </div>
            {list.description && (
              <div className="col-span-2">
                <p className="text-sm font-medium mb-1" style={{ color: "#888" }}>Description</p>
                <p style={{ color: "#666" }}>{list.description}</p>
              </div>
            )}
          </div>
        </NeuroCard>

        {/* Contacts in List */}
        <NeuroCard>
          <h2 className="text-xl font-bold mb-4" style={{ color: "#666" }}>Contacts</h2>
          {memberContacts.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 mx-auto mb-4" style={{ color: "#ccc" }} />
              <p className="mb-4" style={{ color: "#aaa" }}>No contacts in this list yet</p>
              <NeuroButton onClick={() => setShowAddContacts(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Contacts
              </NeuroButton>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Name</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Email</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Company</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Status</th>
                    <th className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {memberContacts.map((contact) => {
                    const member = members.find(m => m.contact_id === contact.id);
                    return (
                      <tr key={contact.id} className="border-b hover:bg-gray-50" style={{ borderColor: "#d8d8d8" }}>
                        <td className="py-3 px-4 font-medium" style={{ color: "#666" }}>
                          {contact.first_name} {contact.last_name}
                        </td>
                        <td className="py-3 px-4" style={{ color: "#888" }}>{contact.email}</td>
                        <td className="py-3 px-4" style={{ color: "#888" }}>{contact.company_id || '—'}</td>
                        <td className="py-3 px-4">
                          <span className={`ampvibe-button px-2 py-1 text-xs ${
                            member?.status === 'Active' ? 'text-green-600' :
                            member?.status === 'Unsubscribed' ? 'text-red-600' : ''
                          }`}>
                            {member?.status || 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <NeuroButton
                            size="sm"
                            onClick={() => {
                              if (confirm('Remove from list?')) {
                                removeMemberMutation.mutate(member.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3 h-3 mr-1" />
                            Remove
                          </NeuroButton>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </NeuroCard>
      </div>

      {/* Add Contacts Modal */}
      {showAddContacts && (
        <>
          <div 
            className="fixed inset-0 bg-black" 
            style={{ zIndex: 9998, opacity: 0.6 }}
            onClick={() => setShowAddContacts(false)}
          />
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" 
            style={{ zIndex: 9999 }}
          >
            <div className="ampvibe-card max-w-3xl w-full pointer-events-auto bg-white shadow-2xl max-h-[85vh] flex flex-col">
              <div className="p-6 border-b flex-shrink-0" style={{ borderColor: "#e0e0e0" }}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold" style={{ color: "#666" }}>
                    Add Contacts to List
                  </h3>
                  <button onClick={() => setShowAddContacts(false)} className="ampvibe-button p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                <p className="text-sm mb-4" style={{ color: "#888" }}>
                  Select contacts to add ({selectedContacts.length} selected)
                </p>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableContacts.map(contact => (
                    <label 
                      key={contact.id} 
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedContacts.includes(contact.id)}
                        onChange={() => toggleContactSelection(contact.id)}
                        className="w-4 h-4"
                        style={{ accentColor: "#00A86B" }}
                      />
                      <div className="flex-1">
                        <p className="font-medium" style={{ color: "#666" }}>
                          {contact.first_name} {contact.last_name}
                        </p>
                        <p className="text-sm" style={{ color: "#888" }}>{contact.email}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t flex justify-end gap-2 flex-shrink-0" style={{ borderColor: "#e0e0e0" }}>
                <NeuroButton onClick={() => setShowAddContacts(false)}>
                  Cancel
                </NeuroButton>
                <NeuroButton 
                  variant="primary"
                  onClick={() => addMembersMutation.mutate(selectedContacts)}
                  disabled={selectedContacts.length === 0}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add {selectedContacts.length} Contact{selectedContacts.length !== 1 ? 's' : ''}
                </NeuroButton>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}