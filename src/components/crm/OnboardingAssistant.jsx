import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Sparkles, X, ChevronRight, ChevronLeft, Check, Play, 
  Users, Building2, DollarSign, Mail, Ticket, BarChart3, 
  Target, Lightbulb, Book, MessageSquare, Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import NeuroButton from "./NeuroButton";
import NeuroCard from "./NeuroCard";

export default function OnboardingAssistant() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [isGeneratingTip, setIsGeneratingTip] = useState(false);
  const [aiTip, setAiTip] = useState("");

  useEffect(() => {
    const initOnboarding = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);

        // Get user's role
        if (currentUser.role !== 'admin') {
          const assignments = await base44.entities.User_Role_Assignment.filter({ 
            user_email: currentUser.email 
          });
          if (assignments.length > 0) {
            const roles = await base44.entities.Role.list();
            const role = roles.find(r => r.id === assignments[0].role_id);
            setUserRole(role);
          }
        }

        // Check onboarding status
        const onboarding = await base44.entities.User_Onboarding.filter({
          user_email: currentUser.email
        });

        if (onboarding.length === 0) {
          // New user - create onboarding record and show
          await base44.entities.User_Onboarding.create({
            user_email: currentUser.email,
            current_step: 0,
            completed_modules: []
          });
          setShowOnboarding(true);
        } else if (!onboarding[0].is_completed && !onboarding[0].skipped) {
          setShowOnboarding(true);
          setCurrentStep(onboarding[0].current_step || 0);
        }
      } catch (error) {
        console.error('Onboarding init failed:', error);
      }
    };

    initOnboarding();
  }, []);

  const { data: onboardingData } = useQuery({
    queryKey: ['user-onboarding', user?.email],
    queryFn: () => base44.entities.User_Onboarding.filter({ user_email: user.email }),
    enabled: !!user
  });

  const updateOnboardingMutation = useMutation({
    mutationFn: (data) => {
      const record = onboardingData[0];
      return base44.entities.User_Onboarding.update(record.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['user-onboarding']);
    }
  });

  // Role-based onboarding steps
  const getStepsForRole = () => {
    const roleName = userRole?.role_name || user?.role;
    
    const baseSteps = [
      {
        title: "Welcome to AmplifyCRM!",
        description: "Let's get you started with a quick tour of the platform.",
        icon: Sparkles,
        color: "#00A86B"
      },
      {
        title: "Navigate the Dashboard",
        description: "Your central hub for insights and quick actions.",
        icon: BarChart3,
        color: "#4a90e2",
        action: () => navigate(createPageUrl("Dashboard"))
      }
    ];

    // Admin gets full access
    if (user?.role === 'admin') {
      return [
        ...baseSteps,
        {
          title: "Manage Contacts",
          description: "Add and organize your customer contacts.",
          icon: Users,
          color: "#00A86B",
          action: () => navigate(createPageUrl("Contacts"))
        },
        {
          title: "Track Companies",
          description: "Keep detailed records of companies you work with.",
          icon: Building2,
          color: "#52c41a",
          action: () => navigate(createPageUrl("Companies"))
        },
        {
          title: "Create Deals",
          description: "Manage your sales pipeline and close more deals.",
          icon: DollarSign,
          color: "#fa8c16",
          action: () => navigate(createPageUrl("Deals"))
        },
        {
          title: "Email Campaigns",
          description: "Create and send professional marketing emails.",
          icon: Mail,
          color: "#eb2f96",
          action: () => navigate(createPageUrl("Campaigns"))
        },
        {
          title: "Support Tickets",
          description: "Manage customer support requests efficiently.",
          icon: Ticket,
          color: "#722ed1",
          action: () => navigate(createPageUrl("AllTickets"))
        },
        {
          title: "AI Assistant",
          description: "Use AI to draft emails, analyze data, and more.",
          icon: MessageSquare,
          color: "#13c2c2",
          module: "ai_assistant"
        },
        {
          title: "Reports & Analytics",
          description: "Generate insights with custom reports.",
          icon: BarChart3,
          color: "#1890ff",
          action: () => navigate(createPageUrl("Reports"))
        }
      ];
    }

    // Sales Manager
    if (roleName?.toLowerCase().includes('sales')) {
      return [
        ...baseSteps,
        {
          title: "Manage Contacts",
          description: "Your contacts are the heart of your sales process.",
          icon: Users,
          color: "#00A86B",
          action: () => navigate(createPageUrl("Contacts"))
        },
        {
          title: "Track Companies",
          description: "Understand your accounts and their needs.",
          icon: Building2,
          color: "#52c41a",
          action: () => navigate(createPageUrl("Companies"))
        },
        {
          title: "Work Deals",
          description: "Move deals through your pipeline to close more sales.",
          icon: DollarSign,
          color: "#fa8c16",
          action: () => navigate(createPageUrl("Deals"))
        },
        {
          title: "AI Sales Assistant",
          description: "Get AI help with emails and deal insights.",
          icon: MessageSquare,
          color: "#13c2c2",
          module: "ai_assistant"
        }
      ];
    }

    // Marketing Specialist
    if (roleName?.toLowerCase().includes('marketing')) {
      return [
        ...baseSteps,
        {
          title: "Contact Lists",
          description: "Organize your audience for targeted campaigns.",
          icon: Users,
          color: "#00A86B",
          action: () => navigate(createPageUrl("ContactLists"))
        },
        {
          title: "Email Campaigns",
          description: "Create beautiful, effective email campaigns.",
          icon: Mail,
          color: "#eb2f96",
          action: () => navigate(createPageUrl("Campaigns"))
        },
        {
          title: "Email Templates",
          description: "Design reusable templates for consistency.",
          icon: Mail,
          color: "#fa8c16",
          action: () => navigate(createPageUrl("EmailTemplates"))
        },
        {
          title: "Forms & Submissions",
          description: "Capture leads through custom forms.",
          icon: Target,
          color: "#722ed1",
          action: () => navigate(createPageUrl("Forms"))
        }
      ];
    }

    // Support Agent
    if (roleName?.toLowerCase().includes('support') || roleName?.toLowerCase().includes('agent')) {
      return [
        ...baseSteps,
        {
          title: "View Contacts",
          description: "Access customer information quickly.",
          icon: Users,
          color: "#00A86B",
          action: () => navigate(createPageUrl("Contacts"))
        },
        {
          title: "Manage Tickets",
          description: "Resolve customer issues efficiently.",
          icon: Ticket,
          color: "#722ed1",
          action: () => navigate(createPageUrl("MyTickets"))
        },
        {
          title: "Canned Responses",
          description: "Use templates to respond faster.",
          icon: MessageSquare,
          color: "#13c2c2",
          action: () => navigate(createPageUrl("CannedResponses"))
        },
        {
          title: "AI Support Helper",
          description: "Get AI suggestions for customer responses.",
          icon: Sparkles,
          color: "#00A86B",
          module: "ai_assistant"
        }
      ];
    }

    // Default viewer or basic user
    return [
      ...baseSteps,
      {
        title: "View Contacts",
        description: "Browse and search your contact database.",
        icon: Users,
        color: "#00A86B",
        action: () => navigate(createPageUrl("Contacts"))
      },
      {
        title: "View Reports",
        description: "Access insights and analytics.",
        icon: BarChart3,
        color: "#4a90e2",
        action: () => navigate(createPageUrl("Reports"))
      }
    ];
  };

  const steps = getStepsForRole();
  const currentStepData = steps[currentStep];

  const getAITip = async () => {
    if (!currentStepData) return;
    
    setIsGeneratingTip(true);
    try {
      const { data } = await base44.functions.invoke('aiAssistant', {
        action: 'chat',
        prompt: `As an onboarding assistant, provide a helpful tip for a ${userRole?.role_name || user?.role || 'user'} who is learning about: "${currentStepData.title} - ${currentStepData.description}". 

Keep it concise (2-3 sentences), actionable, and encouraging. Focus on best practices or common use cases.`,
        context: {}
      });

      setAiTip(data.response);
    } catch (error) {
      setAiTip("Try exploring the feature yourself - the best way to learn is by doing!");
    } finally {
      setIsGeneratingTip(false);
    }
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      updateOnboardingMutation.mutate({ current_step: nextStep });
      setAiTip("");
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      updateOnboardingMutation.mutate({ current_step: prevStep });
      setAiTip("");
    }
  };

  const handleComplete = () => {
    updateOnboardingMutation.mutate({ 
      is_completed: true,
      current_step: steps.length 
    });
    setShowOnboarding(false);
  };

  const handleSkip = () => {
    updateOnboardingMutation.mutate({ skipped: true });
    setShowOnboarding(false);
  };

  const handleActionClick = () => {
    if (currentStepData.action) {
      currentStepData.action();
    }
  };

  if (!showOnboarding || !currentStepData) return null;

  const Icon = currentStepData.icon;
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[9998] flex items-center justify-center p-4">
      <div 
        className="ampvibe-card max-w-2xl w-full"
        style={{ maxHeight: "90vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
      >
        {/* Header */}
        <div className="p-6 border-b" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="ampvibe-button-primary p-3 rounded-xl">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: "#666" }}>
                  {currentStepData.title}
                </h2>
                <p className="text-sm" style={{ color: "#aaa" }}>
                  Step {currentStep + 1} of {steps.length}
                </p>
              </div>
            </div>
            <button onClick={handleSkip} className="ampvibe-button p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="ampvibe-inset rounded-full h-2 overflow-hidden">
            <div 
              className="h-full transition-all duration-300"
              style={{ 
                width: `${progress}%`,
                background: 'linear-gradient(90deg, #00A86B 0%, #00C87A 100%)'
              }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-lg mb-6" style={{ color: "#666" }}>
            {currentStepData.description}
          </p>

          {/* AI Tip Section */}
          <div className="ampvibe-inset p-4 rounded-xl mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5" style={{ color: "#fa8c16" }} />
                <h3 className="font-bold" style={{ color: "#666" }}>AI Tip</h3>
              </div>
              <NeuroButton size="sm" onClick={getAITip} disabled={isGeneratingTip}>
                {isGeneratingTip ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get Tip
                  </>
                )}
              </NeuroButton>
            </div>
            {aiTip ? (
              <p className="text-sm" style={{ color: "#888" }}>{aiTip}</p>
            ) : (
              <p className="text-sm italic" style={{ color: "#aaa" }}>
                Click "Get Tip" for personalized AI guidance
              </p>
            )}
          </div>

          {/* Key Features */}
          <div className="space-y-3">
            <h3 className="font-bold mb-2" style={{ color: "#666" }}>What you'll learn:</h3>
            {currentStep === 0 && (
              <>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#00A86B" }} />
                  <p className="text-sm" style={{ color: "#888" }}>Navigate the main dashboard and sidebar</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#00A86B" }} />
                  <p className="text-sm" style={{ color: "#888" }}>Understand your role and permissions</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#00A86B" }} />
                  <p className="text-sm" style={{ color: "#888" }}>Access the AI assistant for help anytime</p>
                </div>
              </>
            )}
            {currentStep > 0 && (
              <>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#00A86B" }} />
                  <p className="text-sm" style={{ color: "#888" }}>How to access this feature</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#00A86B" }} />
                  <p className="text-sm" style={{ color: "#888" }}>Key actions you can perform</p>
                </div>
                <div className="flex items-start gap-3">
                  <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: "#00A86B" }} />
                  <p className="text-sm" style={{ color: "#888" }}>Best practices for your role</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t flex items-center justify-between" style={{ borderColor: "rgba(30, 58, 138, 0.1)" }}>
          <NeuroButton onClick={handlePrevious} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </NeuroButton>

          <div className="flex gap-2">
            {currentStepData.action && (
              <NeuroButton onClick={handleActionClick}>
                <Play className="w-4 h-4 mr-2" />
                Try It Now
              </NeuroButton>
            )}
            
            <NeuroButton variant="primary" onClick={handleNext}>
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Complete
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </NeuroButton>
          </div>
        </div>
      </div>
    </div>
  );
}