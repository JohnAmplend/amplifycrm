import Dashboard from './pages/Dashboard';
import Contacts from './pages/Contacts';
import ContactDetail from './pages/ContactDetail';
import Companies from './pages/Companies';
import CompanyDetail from './pages/CompanyDetail';
import Deals from './pages/Deals';
import DealDetail from './pages/DealDetail';
import Leads from './pages/Leads';
import LeadDetail from './pages/LeadDetail';
import Activities from './pages/Activities';
import Tasks from './pages/Tasks';
import Import from './pages/Import';
import RingCentral from './pages/RingCentral';
import CallDetail from './pages/CallDetail';
import AppSync from './pages/AppSync';
import AddConnection from './pages/AddConnection';
import SyncLogs from './pages/SyncLogs';
import APISettings from './pages/APISettings';
import EmailTemplates from './pages/EmailTemplates';
import TemplateBuilder from './pages/TemplateBuilder';
import Campaigns from './pages/Campaigns';
import CreateCampaign from './pages/CreateCampaign';
import ContactLists from './pages/ContactLists';
import CreateList from './pages/CreateList';
import EmailSequences from './pages/EmailSequences';
import TicketsDashboard from './pages/TicketsDashboard';
import AllTickets from './pages/AllTickets';
import MyTickets from './pages/MyTickets';
import CreateTicket from './pages/CreateTicket';
import TicketDetail from './pages/TicketDetail';
import CannedResponses from './pages/CannedResponses';
import SLAPolicies from './pages/SLAPolicies';
import Forms from './pages/Forms';
import FormBuilder from './pages/FormBuilder';
import Documents from './pages/Documents';
import DuplicateManagement from './pages/DuplicateManagement';
import CustomObjects from './pages/CustomObjects';
import FormSubmissions from './pages/FormSubmissions';
import WebsiteTracking from './pages/WebsiteTracking';
import KnowledgeBase from './pages/KnowledgeBase';
import Reports from './pages/Reports';
import Workflows from './pages/Workflows';
import Goals from './pages/Goals';
import Notifications from './pages/Notifications';
import Dashboards from './pages/Dashboards';
import Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Contacts": Contacts,
    "ContactDetail": ContactDetail,
    "Companies": Companies,
    "CompanyDetail": CompanyDetail,
    "Deals": Deals,
    "DealDetail": DealDetail,
    "Leads": Leads,
    "LeadDetail": LeadDetail,
    "Activities": Activities,
    "Tasks": Tasks,
    "Import": Import,
    "RingCentral": RingCentral,
    "CallDetail": CallDetail,
    "AppSync": AppSync,
    "AddConnection": AddConnection,
    "SyncLogs": SyncLogs,
    "APISettings": APISettings,
    "EmailTemplates": EmailTemplates,
    "TemplateBuilder": TemplateBuilder,
    "Campaigns": Campaigns,
    "CreateCampaign": CreateCampaign,
    "ContactLists": ContactLists,
    "CreateList": CreateList,
    "EmailSequences": EmailSequences,
    "TicketsDashboard": TicketsDashboard,
    "AllTickets": AllTickets,
    "MyTickets": MyTickets,
    "CreateTicket": CreateTicket,
    "TicketDetail": TicketDetail,
    "CannedResponses": CannedResponses,
    "SLAPolicies": SLAPolicies,
    "Forms": Forms,
    "FormBuilder": FormBuilder,
    "Documents": Documents,
    "DuplicateManagement": DuplicateManagement,
    "CustomObjects": CustomObjects,
    "FormSubmissions": FormSubmissions,
    "WebsiteTracking": WebsiteTracking,
    "KnowledgeBase": KnowledgeBase,
    "Reports": Reports,
    "Workflows": Workflows,
    "Goals": Goals,
    "Notifications": Notifications,
    "Dashboards": Dashboards,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};