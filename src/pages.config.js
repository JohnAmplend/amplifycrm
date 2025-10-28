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
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: Layout,
};