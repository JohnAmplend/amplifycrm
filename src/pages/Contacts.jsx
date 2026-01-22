import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Search, Plus, Download, Upload, X, ChevronLeft, ChevronRight, Users, TrendingUp, DollarSign, UserPlus, Filter } from "lucide-react";
import NeuroCard from "../components/crm/NeuroCard";
import NeuroButton from "../components/crm/NeuroButton";
import NeuroInput from "../components/crm/NeuroInput";
import NeuroSelect from "../components/crm/NeuroSelect";
import ContactForm from "../components/crm/ContactForm";
import AdvancedFilters from "../components/crm/AdvancedFilters";
import BulkActionsToolbar from "../components/crm/BulkActionsToolbar";
import SelectAllBanner from "../components/crm/SelectAllBanner";
import useBulkSelection from "../components/crm/useBulkSelection";
import BulkActionModal from "../components/crm/BulkActionModal";
import SmartSelectionMenu from "../components/crm/SmartSelectionMenu";
import BulkOperationHistory from "../components/crm/BulkOperationHistory";
import useKeyboardShortcuts from "../components/crm/useKeyboardShortcuts";
import KeyboardShortcutsHelp from "../components/crm/KeyboardShortcutsHelp";
import ViewManager from "../components/crm/ViewManager";
import LoadingState from "../components/crm/LoadingState";
import EmptyState from "../components/crm/EmptyState";
import { toast } from "../components/crm/useToast";

export default function Contacts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterOwner, setFilterOwner] = useState("");
  const [filterStage, setFilterStage] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [activeStatFilter, setActiveStatFilter] = useState(null);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState([]);
  const [filterLogic, setFilterLogic] = useState('AND');
  
  // View management
  const [currentView, setCurrentView] = useState(null);
  const [visibleColumns, setVisibleColumns] = useState([
    'name', 'email', 'phone', 'job_title', 'stage', 'status', 'owner'
  ]);

  const availableColumns = [
    { id: 'name', label: 'Name', defaultVisible: true },
    { id: 'email', label: 'Email', defaultVisible: true },
    { id: 'phone', label: 'Phone', defaultVisible: true },
    { id: 'mobile', label: 'Mobile', defaultVisible: false },
    { id: 'job_title', label: 'Job Title', defaultVisible: true },
    { id: 'department', label: 'Department', defaultVisible: false },
    { id: 'stage', label: 'Stage', defaultVisible: true },
    { id: 'status', label: 'Status', defaultVisible: true },
    { id: 'owner', label: 'Owner', defaultVisible: true },
    { id: 'company', label: 'Company', defaultVisible: false },
    { id: 'city', label: 'City', defaultVisible: false },
    { id: 'state', label: 'State', defaultVisible: false },
    { id: 'country', label: 'Country', defaultVisible: false },
    { id: 'lead_source', label: 'Lead Source', defaultVisible: false },
    { id: 'created_date', label: 'Created Date', defaultVisible: false },
    { id: 'last_contacted', label: 'Last Contacted', defaultVisible: false }
  ];
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [customPage, setCustomPage] = useState('');

  // Bulk action modals
  const [bulkActionModal, setBulkActionModal] = useState({ isOpen: false, action: null });
  const [lastOperation, setLastOperation] = useState(null);
  const [undoTimeRemaining, setUndoTimeRemaining] = useState(0);
  const [showSmartSelection, setShowSmartSelection] = useState(false);
  const [showOperationHistory, setShowOperationHistory] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setCurrentUser).catch(() => {});
    
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'new') {
      setShowForm(true);
    }

    // Load current view from localStorage
    const savedView = localStorage.getItem('crm_current_view_Contact');
    if (savedView) {
      const view = JSON.parse(savedView);
      setCurrentView(view);
      if (view.columns) {
        setVisibleColumns(view.columns);
      }
    }
  }, []);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => base44.entities.Contact.list('-created_date')
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => base44.entities.User.list()
  });

  // Bulk selection
  const {
    selectedIds,
    isSelected,
    toggleSelection,
    selectAll,
    selectAllAcrossPages,
    clearSelection,
    getSelectedCount,
    getSelectedItems,
    areAllSelected,
    areSomeSelected,
    toggleSelectAll,
    selectAllMode,
    setSelectAllMode
  } = useBulkSelection(contacts, 'id', 'contacts');

  const { data: bulkOperations = [] } = useQuery({
    queryKey: ['bulk-operations', currentUser?.email],
    queryFn: () => base44.entities.Bulk_Operations.filter({ 
      performed_by: currentUser.email,
      object_type: 'Contact'
    }).then(ops => ops.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))),
    enabled: !!currentUser
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => base44.entities.Lead.list()
  });

  const newThisWeek = contacts.filter(c => {
    const created = new Date(c.created_date);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return created > weekAgo;
  });
  const customers = contacts.filter(c => c.lifecycle_stage === 'Customer');

  const createMutation = useMutation({
    mutationFn: async (data) => {
      if (data.lifecycle_stage === 'Lead') {
        return await base44.entities.Lead.create({
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          company_name: data.company_id,
          job_title: data.job_title,
          lead_source: data.lead_source || 'Website',
          lead_status: data.lead_status || 'New',
          lead_score: 0,
          lead_owner: data.contact_owner
        });
      }
      
      return await base44.entities.Contact.create(data);
    },
    onMutate: async (newContact) => {
      await queryClient.cancelQueries(['contacts']);
      const previousContacts = queryClient.getQueryData(['contacts']);

      if (newContact.lifecycle_stage === 'Lead') {
        return { previousContacts, isLead: true };
      }

      queryClient.setQueryData(['contacts'], (old) => {
        const optimisticContact = {
          ...newContact,
          id: 'temp-' + Date.now(),
          created_date: new Date().toISOString(),
          created_by: currentUser?.email,
          contact_owner: newContact.contact_owner || currentUser?.email,
          lifecycle_stage: newContact.lifecycle_stage || 'Lead',
          lead_status: newContact.lead_status || 'New',
        };
        return [optimisticContact, ...(old || [])];
      });

      return { previousContacts, isLead: false };
    },
    onError: (err, newContact, context) => {
      if (context?.previousContacts && !context?.isLead) {
        queryClient.setQueryData(['contacts'], context.previousContacts);
      }
      toast.error('Failed to create contact: ' + err.message);
    },
    onSuccess: (data, variables, context) => {
      if (context?.isLead) {
        queryClient.invalidateQueries(['leads']);
        toast.success('Contact created as Lead. Redirecting...');
        setTimeout(() => {
          navigate(createPageUrl("Leads"));
        }, 1000);
      } else {
        queryClient.invalidateQueries(['contacts']);
        toast.success('Contact created successfully');
        setShowForm(false);
      }
    }
  });

  const handleExport = (exportType = 'all') => {
    let dataToExport = exportType === 'selected' && getSelectedCount() > 0 
      ? getSelectedItems() 
      : filteredContacts;

    const csvContent = [
      ['First Name', 'Last Name', 'Email', 'Phone', 'Job Title', 'Company', 'Owner', 'Status', 'Created Date'],
      ...dataToExport.map(c => [
        c.first_name, c.last_name, c.email, c.phone, c.job_title,
        c.company_id, c.contact_owner, c.lead_status,
        new Date(c.created_date).toLocaleDateString()
      ])
    ].map(row => row.map(field => `"${field ? String(field).replace(/"/g, '""') : ''}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${exportType}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportModal(false);
  };

  const handleStatCardClick = (filterType) => {
    setSearchTerm("");
    setFilterOwner("");
    setFilterStage("");
    setFilterStatus("");
    setAdvancedFilters([]);
    setFilterLogic('AND'); // Reset logic when stat card is clicked
    
    if (activeStatFilter === filterType) {
      setActiveStatFilter(null);
    } else {
      setActiveStatFilter(filterType);
    }
    
    setCurrentPage(1);
  };

  const applyAdvancedFilter = (contact, filter) => {
    const value = contact[filter.field]; // Changed from filter.id to filter.field based on AdvancedFilters component structure
    const filterValue = filter.value;

    switch (filter.operator) {
      case 'contains':
        return value?.toString().toLowerCase().includes(filterValue.toLowerCase());
      case 'not_contains':
        return !value?.toString().toLowerCase().includes(filterValue.toLowerCase());
      case 'equals':
        return value?.toString().toLowerCase() === filterValue.toLowerCase();
      case 'not_equals':
        return value?.toString().toLowerCase() !== filterValue.toLowerCase();
      case 'starts_with':
        return value?.toString().toLowerCase().startsWith(filterValue.toLowerCase());
      case 'ends_with':
        return value?.toString().toLowerCase().endsWith(filterValue.toLowerCase());
      case 'is_empty':
        return !value || value === '';
      case 'is_not_empty':
        return value && value !== '';
      case 'greater_than':
        return parseFloat(value) > parseFloat(filterValue);
      case 'less_than':
        return parseFloat(value) < parseFloat(filterValue);
      case 'greater_or_equal':
        return parseFloat(value) >= parseFloat(filterValue);
      case 'less_or_equal':
        return parseFloat(value) <= parseFloat(filterValue);
      case 'is_after':
        return new Date(value) > new Date(filterValue);
      case 'is_before':
        return new Date(value) < new Date(filterValue);
      case 'in_last':
        const daysAgo = new Date();
        const amount = parseInt(filterValue);
        const unit = filter.unit || 'days';
        if (unit === 'days') daysAgo.setDate(daysAgo.getDate() - amount);
        else if (unit === 'weeks') daysAgo.setDate(daysAgo.getDate() - (amount * 7));
        else if (unit === 'months') daysAgo.setMonth(daysAgo.getMonth() - amount);
        else if (unit === 'years') daysAgo.setFullYear(daysAgo.getFullYear() - amount);
        return new Date(value) > daysAgo;
      case 'in_next':
        const daysAhead = new Date();
        const amountAhead = parseInt(filterValue);
        const unitAhead = filter.unit || 'days';
        if (unitAhead === 'days') daysAhead.setDate(daysAhead.getDate() + amountAhead);
        else if (unitAhead === 'weeks') daysAhead.setDate(daysAhead.getDate() + (amountAhead * 7));
        else if (unitAhead === 'months') daysAhead.setMonth(daysAhead.getMonth() + amountAhead);
        else if (unitAhead === 'years') daysAhead.setFullYear(daysAhead.getFullYear() + amountAhead);
        return new Date(value) < daysAhead;
      default:
        return true;
    }
  };

  const filteredContacts = contacts.filter(contact => {
    // Apply stat card filter
    if (activeStatFilter === 'new-week') {
      const created = new Date(contact.created_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (created <= weekAgo) return false;
    } else if (activeStatFilter === 'customers') {
      if (contact.lifecycle_stage !== 'Customer') return false;
    } else if (activeStatFilter === 'all') {
      // 'all' stat filter effectively means no stat filter, so do nothing here
    }
    
    // Apply advanced filters with AND/OR logic
    if (advancedFilters.length > 0) {
      if (filterLogic === 'AND') {
        const passesAllFilters = advancedFilters.every(filter => applyAdvancedFilter(contact, filter));
        if (!passesAllFilters) return false;
      } else {
        // OR logic - at least one filter must match
        const passesAnyFilter = advancedFilters.some(filter => applyAdvancedFilter(contact, filter));
        if (!passesAnyFilter) return false;
      }
    }
    
    // Apply regular filters
    const matchesSearch = 
      contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesOwner = !filterOwner || contact.contact_owner === filterOwner;
    const matchesStage = !filterStage || contact.lifecycle_stage === filterStage;
    const matchesStatus = !filterStatus || contact.lead_status === filterStatus;
    
    return matchesSearch && matchesOwner && matchesStage && matchesStatus;
  });

  // Pagination calculations
  const totalItems = filteredContacts.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedContacts = filteredContacts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const handleCustomPageSubmit = (e) => {
    e.preventDefault();
    const page = parseInt(customPage);
    if (page && page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      setCustomPage('');
      window.scrollTo({ top: 300, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterOwner, filterStage, filterStatus, activeStatFilter, advancedFilters, filterLogic]);

  // Undo timer
  useEffect(() => {
    if (!lastOperation?.canUndo || !lastOperation?.undoExpiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(lastOperation.undoExpiresAt) - new Date()) / 1000));
      setUndoTimeRemaining(remaining);
      
      if (remaining === 0) {
        setLastOperation(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [lastOperation]);

  // Bulk action handlers
  const getSelectedRecordIds = () => {
    if (selectAllMode) {
      return filteredContacts.map(c => c.id);
    }
    return Array.from(selectedIds);
  };

  const handleBulkDelete = async () => {
    const recordIds = getSelectedRecordIds();
    const response = await base44.functions.invoke('bulkOperations/bulkDelete', {
      objectType: 'Contact',
      recordIds
    });

    if (response.data.success) {
      queryClient.invalidateQueries(['contacts']);
      clearSelection();
      return response.data;
    }
    throw new Error(response.data.error);
  };

  const handleBulkChangeOwner = async ({ newOwner }) => {
    const recordIds = getSelectedRecordIds();
    const response = await base44.functions.invoke('bulkOperations/bulkUpdateOwner', {
      objectType: 'Contact',
      recordIds,
      newOwner
    });

    if (response.data.success) {
      queryClient.invalidateQueries(['contacts']);
      clearSelection();
      setLastOperation(response.data);
      return response.data;
    }
    throw new Error(response.data.error);
  };

  const handleBulkAddTags = async ({ tags }) => {
    const recordIds = getSelectedRecordIds();
    const response = await base44.functions.invoke('bulkOperations/bulkAddTags', {
      objectType: 'Contact',
      recordIds,
      tags
    });

    if (response.data.success) {
      queryClient.invalidateQueries(['contacts']);
      clearSelection();
      setLastOperation(response.data);
      return response.data;
    }
    throw new Error(response.data.error);
  };

  const handleUndo = async () => {
    if (!lastOperation?.operationId) return;

    const response = await base44.functions.invoke('bulkOperations/bulkUndoOperation', {
      operationId: lastOperation.operationId
    });

    if (response.data.success) {
      queryClient.invalidateQueries(['contacts']);
      setLastOperation(null);
      setUndoTimeRemaining(0);
    }
  };

  const existingTags = [...new Set(contacts.flatMap(c => c.tags || []))];

  const handleSmartSelection = (selectedItems) => {
    selectedItems.forEach((item, index) => {
      toggleSelection(item.id, index);
    });
  };

  const handleViewChange = (view) => {
    setCurrentView(view);
    localStorage.setItem('crm_current_view_Contact', JSON.stringify(view));
    if (view.columns) {
      setVisibleColumns(view.columns);
    }
  };

  const handleColumnsChange = (columns) => {
    setVisibleColumns(columns);
    if (currentView) {
      const updatedView = { ...currentView, columns };
      setCurrentView(updatedView);
      localStorage.setItem('crm_current_view_Contact', JSON.stringify(updatedView));
    }
  };

  const renderTableHeader = (columnId) => {
    const column = availableColumns.find(c => c.id === columnId);
    if (!column) return null;

    return (
      <th key={columnId} className="text-left py-3 px-4 font-semibold" style={{ color: "#666" }}>
        {column.label}
      </th>
    );
  };

  const renderTableCell = (contact, columnId, index) => {
    const baseStyle = { color: "#888" };
    const handleClick = () => navigate(createPageUrl("ContactDetail") + `?id=${contact.id}`);

    switch (columnId) {
      case 'name':
        return (
          <td key={columnId} className="py-3 px-4" onClick={handleClick}>
            <p className="font-medium" style={{ color: "#666" }}>
              {contact.first_name} {contact.last_name}
            </p>
          </td>
        );
      case 'email':
        return <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>{contact.email}</td>;
      case 'phone':
        return <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>{contact.phone}</td>;
      case 'mobile':
        return <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>{contact.mobile}</td>;
      case 'job_title':
        return <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>{contact.job_title}</td>;
      case 'department':
        return <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>{contact.department}</td>;
      case 'stage':
        return (
          <td key={columnId} className="py-3 px-4" onClick={handleClick}>
            <span className="neuro-button px-2 py-1 text-xs">{contact.lifecycle_stage}</span>
          </td>
        );
      case 'status':
        return (
          <td key={columnId} className="py-3 px-4" onClick={handleClick}>
            <span className="neuro-button px-2 py-1 text-xs">{contact.lead_status}</span>
          </td>
        );
      case 'owner':
        return (
          <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>
            {users.find(u => u.email === contact.contact_owner)?.full_name || contact.contact_owner}
          </td>
        );
      case 'company':
        return <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>{contact.company_id}</td>;
      case 'city':
        return <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>{contact.city}</td>;
      case 'state':
        return <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>{contact.state}</td>;
      case 'country':
        return <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>{contact.country}</td>;
      case 'lead_source':
        return <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>{contact.lead_source}</td>;
      case 'created_date':
        return (
          <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>
            {contact.created_date ? new Date(contact.created_date).toLocaleDateString() : ''}
          </td>
        );
      case 'last_contacted':
        return (
          <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}>
            {contact.last_contacted ? new Date(contact.last_contacted).toLocaleDateString() : ''}
          </td>
        );
      default:
        return <td key={columnId} className="py-3 px-4" style={baseStyle} onClick={handleClick}></td>;
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSelectAll: () => {
      if (paginatedContacts.length > 0) {
        toggleSelectAll();
      }
    },
    onDelete: () => {
      if (getSelectedCount() > 0) {
        setBulkActionModal({ isOpen: true, action: 'delete' });
      }
    },
    onEscape: () => {
      if (getSelectedCount() > 0) {
        clearSelection();
      }
    },
    onUndo: () => {
      if (lastOperation?.canUndo && undoTimeRemaining > 0) {
        handleUndo();
      }
    },
    enabled: !showForm && !bulkActionModal.isOpen && !showAdvancedFilters && !showSmartSelection && !showOperationHistory && !showKeyboardHelp
  });

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`ampvibe-button px-4 py-2 ${currentPage === i ? 'active' : ''}`}
        >
          {i}
        </button>
      );
    }

    return pages;
  };

  if (showForm) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <NeuroCard>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                New Contact
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="neuro-button p-2"
              >
                <X className="w-5 h-5" style={{ color: "#888" }} />
              </button>
            </div>
            <ContactForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowForm(false)}
              currentUser={currentUser}
            />
          </NeuroCard>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2" style={{ color: "#555" }}>
              Contacts
            </h1>
            <p style={{ color: "#888" }}>
              {filteredContacts.length} {activeStatFilter || advancedFilters.length > 0 ? 'filtered' : 'total'} contacts
            </p>
          </div>
          <div className="flex gap-2 md:gap-3">
            <NeuroButton onClick={() => setShowExportModal(true)} className="hidden md:flex">
              <Download className="w-4 h-4 mr-2" />
              <span className="hidden lg:inline">Export</span>
            </NeuroButton>
            <Link to={createPageUrl("Import") + "?type=Contacts"}>
              <NeuroButton className="hidden md:flex">
                <Upload className="w-4 h-4 mr-2" />
                <span className="hidden lg:inline">Import</span>
              </NeuroButton>
            </Link>
            <NeuroButton 
              onClick={() => setShowKeyboardHelp(true)}
              className="hidden md:flex"
            >
              <span className="text-sm">?</span>
            </NeuroButton>
            <NeuroButton variant="primary" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Add Contact</span>
            </NeuroButton>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => handleStatCardClick('all')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${activeStatFilter === 'all' && !advancedFilters.length ? 'ring-2 ring-blue-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>Total Contacts</p>
                <p className="text-3xl font-bold mb-1" style={{ color: "#4a90e2" }}>
                  {contacts.length}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>Click to show all</p>
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <Users className="w-6 h-6" style={{ color: "#4a90e2" }} />
              </div>
            </div>
          </button>

          <button
            onClick={() => navigate(createPageUrl("Leads"))}
            className="ampvibe-card p-6 text-left transition-all hover:scale-105"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>Leads</p>
                <p className="text-3xl font-bold mb-1" style={{ color: "#00A86B" }}>
                  {leads.length}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>Click to view leads</p>
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <UserPlus className="w-6 h-6" style={{ color: "#00A86B" }} />
              </div>
            </div>
          </button>

          <button
            onClick={() => handleStatCardClick('new-week')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${activeStatFilter === 'new-week' ? 'ring-2 ring-orange-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>New This Week</p>
                <p className="text-3xl font-bold mb-1" style={{ color: "#fa8c16" }}>
                  {newThisWeek.length}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>Click to filter</p>
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <TrendingUp className="w-6 h-6" style={{ color: "#fa8c16" }} />
              </div>
            </div>
          </button>

          <button
            onClick={() => handleStatCardClick('customers')}
            className={`ampvibe-card p-6 text-left transition-all hover:scale-105 ${activeStatFilter === 'customers' ? 'ring-2 ring-green-500' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm mb-2 font-medium" style={{ color: "#888" }}>Customers</p>
                <p className="text-3xl font-bold mb-1" style={{ color: "#52c41a" }}>
                  {customers.length}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>Click to filter</p>
              </div>
              <div className="ampvibe-inset p-3 rounded-xl">
                <DollarSign className="w-6 h-6" style={{ color: "#52c41a" }} />
              </div>
            </div>
          </button>
        </div>

        {/* Active Filter Indicator */}
        {(activeStatFilter || advancedFilters.length > 0) && (
          <NeuroCard className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-wrap">
                {activeStatFilter && (
                  <span className="ampvibe-button px-3 py-2 active">
                    {activeStatFilter === 'all' ? 'All Contacts' :
                     activeStatFilter === 'new-week' ? 'New This Week' :
                     activeStatFilter === 'customers' ? 'Customers Only' : ''}
                  </span>
                )}
                {advancedFilters.length > 0 && (
                  <span className={`px-3 py-2 rounded-full text-sm font-medium ${
                    filterLogic === 'OR' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {filterLogic} Logic
                  </span>
                )}
                {advancedFilters.map((filter, index) => (
                  <span key={`${filter.field}-${index}`} className="ampvibe-button px-3 py-2 active flex items-center gap-2">
                    {filter.label} {filter.operator}{filter.value ? ` ${filter.value}` : ''}
                    <button onClick={() => setAdvancedFilters(advancedFilters.filter((_, i) => i !== index))}>
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <span style={{ color: "#888" }}>
                  Showing {filteredContacts.length} contacts
                </span>
              </div>
              <NeuroButton onClick={() => { setActiveStatFilter(null); setAdvancedFilters([]); setFilterLogic('AND'); }}>
                <X className="w-4 h-4 mr-2" />
                Clear All
              </NeuroButton>
            </div>
          </NeuroCard>
        )}

        {/* View Manager */}
        <NeuroCard className="mb-6">
          <ViewManager
            objectType="Contact"
            currentView={currentView}
            onViewChange={handleViewChange}
            availableColumns={availableColumns}
            currentColumns={visibleColumns}
            onColumnsChange={handleColumnsChange}
          />
        </NeuroCard>

        {/* Filters */}
        <NeuroCard className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative flex items-center">
              <Search className="absolute left-3 w-5 h-5 pointer-events-none" style={{ color: "#aaa" }} />
              <input
                type="text"
                placeholder="Search contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ampvibe-input w-full pl-10"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
            <NeuroSelect
              placeholder="Filter by owner"
              value={filterOwner}
              onChange={(e) => setFilterOwner(e.target.value)}
              options={users.map(u => ({ value: u.email, label: u.full_name || u.email }))}
            />
            <NeuroSelect
              placeholder="Filter by stage"
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value)}
              options={[
                { value: 'Subscriber', label: 'Subscriber' },
                { value: 'Lead', label: 'Lead' },
                { value: 'MQL', label: 'MQL' },
                { value: 'SQL', label: 'SQL' },
                { value: 'Opportunity', label: 'Opportunity' },
                { value: 'Customer', label: 'Customer' }
              ]}
            />
            <NeuroSelect
              placeholder="Filter by status"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: 'New', label: 'New' },
                { value: 'Attempting', label: 'Attempting' },
                { value: 'Connected', label: 'Connected' },
                { value: 'Qualified', label: 'Qualified' },
                { value: 'Unqualified', label: 'Unqualified' }
              ]}
            />
            <NeuroButton onClick={() => setShowAdvancedFilters(true)} className="flex items-center justify-center gap-2">
              <Filter className="w-4 h-4" />
              Advanced Filters {advancedFilters.length > 0 && `(${advancedFilters.length})`}
            </NeuroButton>
          </div>
        </NeuroCard>

        {/* Bulk Actions Toolbar */}
        <BulkActionsToolbar
          selectedCount={getSelectedCount()}
          objectType="Contact"
          onClearSelection={clearSelection}
          onDelete={() => setBulkActionModal({ isOpen: true, action: 'delete' })}
          onChangeOwner={() => setBulkActionModal({ isOpen: true, action: 'changeOwner' })}
          onAddTags={() => setBulkActionModal({ isOpen: true, action: 'addTags' })}
          onRemoveTags={() => alert('Remove Tags functionality coming soon')}
          onExport={() => alert('Export functionality coming soon')}
          onSendEmail={() => alert('Send Email functionality coming soon')}
          onAddToList={() => alert('Add to List functionality coming soon')}
          onUpdateStage={() => alert('Update Stage functionality coming soon')}
          onUpdateStatus={() => alert('Update Status functionality coming soon')}
          onUndo={lastOperation?.canUndo ? handleUndo : null}
          undoTimeRemaining={undoTimeRemaining}
          onSmartSelection={() => setShowSmartSelection(true)}
          onViewHistory={() => setShowOperationHistory(true)}
        />

        {/* Select All Banner */}
        {areAllSelected() && !selectAllMode && filteredContacts.length > paginatedContacts.length && (
          <SelectAllBanner
            visibleCount={paginatedContacts.length}
            totalCount={filteredContacts.length}
            onSelectAll={selectAllAcrossPages}
            onDismiss={() => {}}
          />
        )}

        {/* Pagination Controls - Top */}
        {totalPages > 1 && (
          <NeuroCard className="mb-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-sm" style={{ color: "#666" }}>Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="ampvibe-input px-3 py-2"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={30}>30</option>
                  <option value={40}>40</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
                <span className="text-sm" style={{ color: "#888" }}>
                  Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <NeuroButton
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </NeuroButton>

                {renderPageNumbers()}

                <NeuroButton
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </NeuroButton>

                <form onSubmit={handleCustomPageSubmit} className="flex items-center gap-2 ml-4">
                  <span className="text-sm" style={{ color: "#888" }}>Go to:</span>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={customPage}
                    onChange={(e) => setCustomPage(e.target.value)}
                    placeholder="#"
                    className="ampvibe-input w-16 px-2 py-1 text-center"
                  />
                  <NeuroButton type="submit" size="sm">Go</NeuroButton>
                </form>
              </div>
            </div>
          </NeuroCard>
        )}

        {/* Contacts Table */}
        <NeuroCard>
          {isLoading ? (
            <LoadingState message="Loading contacts..." />
          ) : filteredContacts.length === 0 ? (
            <EmptyState
              icon={Users}
              title={activeStatFilter || advancedFilters.length > 0 ? 'No contacts match these filters' : 'No contacts yet'}
              message={activeStatFilter || advancedFilters.length > 0 ? 'Try adjusting your filters' : 'Get started by adding your first contact'}
              actionLabel={!activeStatFilter && advancedFilters.length === 0 ? 'Add Contact' : undefined}
              onAction={!activeStatFilter && advancedFilters.length === 0 ? () => setShowForm(true) : undefined}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: "#d0d0d0" }}>
                    <th className="py-3 px-4" style={{ width: '40px' }}>
                      <input
                        type="checkbox"
                        checked={areAllSelected()}
                        ref={(input) => {
                          if (input) {
                            input.indeterminate = areSomeSelected();
                          }
                        }}
                        onChange={toggleSelectAll}
                        className="w-5 h-5 cursor-pointer"
                        style={{ accentColor: "#00A86B" }}
                      />
                    </th>
                    {visibleColumns.map(columnId => renderTableHeader(columnId))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedContacts.map((contact, index) => (
                    <tr
                      key={contact.id}
                      className={`border-b cursor-pointer transition-colors ${
                        isSelected(contact.id) ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      style={{ borderColor: "#d8d8d8" }}
                    >
                      <td 
                        className="py-3 px-4"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelection(contact.id, index, e);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected(contact.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleSelection(contact.id, index, e);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-5 h-5 cursor-pointer"
                          style={{ accentColor: "#00A86B" }}
                        />
                      </td>
                      {visibleColumns.map(columnId => renderTableCell(contact, columnId, index))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </NeuroCard>

        {/* Pagination Controls - Bottom */}
        {totalPages > 1 && (
          <NeuroCard className="mt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <span className="text-sm" style={{ color: "#888" }}>
                Showing {startIndex + 1}-{Math.min(endIndex, totalItems)} of {totalItems}
              </span>

              <div className="flex items-center gap-2">
                <NeuroButton
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </NeuroButton>

                <span className="text-sm px-4" style={{ color: "#666" }}>
                  Page {currentPage} of {totalPages}
                </span>

                <NeuroButton
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </NeuroButton>
              </div>
            </div>
          </NeuroCard>
        )}
      </div>

      {/* Smart Selection Menu */}
      <SmartSelectionMenu
        isOpen={showSmartSelection}
        onClose={() => setShowSmartSelection(false)}
        items={filteredContacts}
        onSelectItems={handleSmartSelection}
        objectType="Contact"
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />

      {/* Operation History */}
      <BulkOperationHistory
        isOpen={showOperationHistory}
        onClose={() => setShowOperationHistory(false)}
        operations={bulkOperations}
        onUndo={handleUndo}
      />

      {/* Bulk Action Modal */}
      <BulkActionModal
        isOpen={bulkActionModal.isOpen}
        onClose={() => setBulkActionModal({ isOpen: false, action: null })}
        action={bulkActionModal.action}
        selectedCount={selectAllMode ? filteredContacts.length : getSelectedCount()}
        objectType="Contact"
        onConfirm={async (payload) => {
          switch (bulkActionModal.action) {
            case 'delete':
              return await handleBulkDelete();
            case 'changeOwner':
              return await handleBulkChangeOwner(payload);
            case 'addTags':
              return await handleBulkAddTags(payload);
            default:
              throw new Error('Unknown action');
          }
        }}
        users={users}
        existingTags={existingTags}
      />

      {/* Advanced Filters Modal */}
      <AdvancedFilters
        isOpen={showAdvancedFilters}
        onClose={() => setShowAdvancedFilters(false)}
        onApplyFilters={(filters, logic) => {
          setAdvancedFilters(filters);
          setFilterLogic(logic);
          setActiveStatFilter(null);
          setSearchTerm("");
          setFilterOwner("");
          setFilterStage("");
          setFilterStatus("");
          setCurrentPage(1);
          setShowAdvancedFilters(false);
        }}
        currentFilters={advancedFilters}
        currentLogic={filterLogic}
      />

      {/* Export Modal */}
      {showExportModal && (
        <>
          <div 
            className="fixed inset-0 bg-black" 
            style={{ zIndex: 9998, opacity: 0.6 }}
            onClick={() => setShowExportModal(false)}
          />
          <div 
            className="fixed inset-0 flex items-center justify-center p-4 pointer-events-none" 
            style={{ zIndex: 9999 }}
          >
            <div className="ampvibe-card max-w-md w-full pointer-events-auto bg-white shadow-2xl">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold" style={{ color: "#666" }}>
                    Export Contacts
                  </h3>
                  <button onClick={() => setShowExportModal(false)} className="ampvibe-button p-2">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <p className="text-sm mb-6" style={{ color: "#888" }}>
                  Choose what contacts to export:
                </p>

                <div className="space-y-3">
                  <NeuroButton 
                    onClick={() => handleExport('all')} 
                    className="w-full justify-between"
                  >
                    <span>All Contacts ({filteredContacts.length})</span>
                    <Download className="w-4 h-4" />
                  </NeuroButton>

                  {getSelectedCount() > 0 && (
                    <NeuroButton 
                      onClick={() => handleExport('selected')} 
                      className="w-full justify-between"
                      variant="primary"
                    >
                      <span>Selected Contacts ({getSelectedCount()})</span>
                      <Download className="w-4 h-4" />
                    </NeuroButton>
                  )}

                  <NeuroButton 
                    onClick={() => setShowExportModal(false)} 
                    className="w-full"
                  >
                    Cancel
                  </NeuroButton>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}