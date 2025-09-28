import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import TicketGenerator from '../../utils/ticketGenerator';
import { 
  DocumentTextIcon, 
  CheckCircleIcon, 
  ExclamationTriangleIcon,
  CogIcon,
  TicketIcon,
  SwatchIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import ModernCard from '../../components/UI/ModernCard';
import ModernButton from '../../components/UI/ModernButton';
import PageHeader from '../../components/UI/PageHeader';
import LoadingSpinner from '../../components/UI/LoadingSpinner';

const TemplateAssignment = () => {
  const { user } = useAuth();
  const [selectedTemplateKey, setSelectedTemplateKey] = useState('default'); // 'default' | 'umatik' | 'umatik-center'
  const [currentSystemTemplate, setCurrentSystemTemplate] = useState('default');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const canManage = useMemo(() => user && (user.role === 'superadmin' || user.role === 'admin'), [user]);

  // Load current system template setting from existing templates
  useEffect(() => {
    const loadSystemTemplate = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Get all templates and find the active one
        const res = await api.get('/ticket-templates');
        const templates = res?.data?.data || [];
        
        // Find the currently active template
        const activeTemplate = templates.find(template => template.isActive);
        
        if (activeTemplate) {
          // Map template design to our template keys
          const design = activeTemplate.design;
          let templateKey = 'default';
          
          if (design?.templateType === 'umatik') {
            templateKey = 'umatik';
          } else if (design?.templateType === 'umatik-center') {
            templateKey = 'umatik-center';
          } else if (design?.templateDesign === 3) {
            templateKey = 'umatik';
          }
          
          setCurrentSystemTemplate(templateKey);
          setSelectedTemplateKey(templateKey);
        } else {
          // No active template found, default to 'default'
          setCurrentSystemTemplate('default');
          setSelectedTemplateKey('default');
        }
      } catch (e) {
        console.error('Failed to load templates:', e);
        setCurrentSystemTemplate('default');
        setSelectedTemplateKey('default');
      } finally {
        setLoading(false);
      }
    };
    loadSystemTemplate();
  }, []);

  const updateSystemTemplate = async (ev) => {
    ev.preventDefault();
    setSuccess('');
    setError('');
    
    if (selectedTemplateKey === currentSystemTemplate) {
      setError('Template is already active');
      return;
    }
    
    try {
      setLoading(true);
      
      // Get all templates first
      const templatesRes = await api.get('/ticket-templates');
      const templates = templatesRes?.data?.data || [];
      
      // Find template that matches our selected key
      let targetTemplate = null;
      
      // First, deactivate all templates
      for (const template of templates) {
        if (template.isActive) {
          await api.put(`/ticket-templates/${template.id}/toggle-active`);
        }
      }
      
      // Find or create the target template
      if (selectedTemplateKey === 'default') {
        targetTemplate = templates.find(t => 
          t.design?.templateDesign === 1 || 
          t.design?.templateType === 'standard' ||
          t.name?.toLowerCase().includes('default')
        );
      } else if (selectedTemplateKey === 'umatik') {
        targetTemplate = templates.find(t => 
          t.design?.templateType === 'umatik' ||
          (t.design?.templateDesign === 3 && t.design?.templateType !== 'umatik-center')
        );
      } else if (selectedTemplateKey === 'umatik-center') {
        targetTemplate = templates.find(t => 
          t.design?.templateType === 'umatik-center'
        );
      }
      
      // If template doesn't exist, create it
      if (!targetTemplate) {
        const templateData = {
          name: templateOptions.find(t => t.key === selectedTemplateKey)?.name || 'Default Template',
          design: {
            templateDesign: selectedTemplateKey === 'default' ? 1 : 3,
            templateType: selectedTemplateKey === 'umatik-center' ? 'umatik-center' : 
                         selectedTemplateKey === 'umatik' ? 'umatik' : 'standard',
            backgroundColor: '#ffffff',
            canvasWidth: 600,
            canvasHeight: 900,
            dynamicHeight: true
          }
        };
        
        const createRes = await api.post('/ticket-templates', templateData);
        targetTemplate = createRes.data.data;
      }
      
      // Activate the target template
      if (!targetTemplate.isActive) {
        await api.put(`/ticket-templates/${targetTemplate.id}/toggle-active`);
      }
      
      setCurrentSystemTemplate(selectedTemplateKey);
      const templateName = templateOptions.find(t => t.key === selectedTemplateKey)?.name || selectedTemplateKey;
      setSuccess(`System template updated to ${templateName} successfully!`);
      
    } catch (e) {
      console.error('Update template error:', e);
      setError(e?.response?.data?.message || 'Failed to update system template');
    } finally {
      setLoading(false);
    }
  };

  // Template options with descriptions
  const templateOptions = [
    {
      key: 'default',
      name: 'Default Template',
      description: 'Standard lottery ticket layout with basic styling',
      icon: DocumentTextIcon,
      color: 'blue'
    },
    {
      key: 'umatik',
      name: 'Umatik Template',
      description: 'Modern design with enhanced branding and layout',
      icon: TicketIcon,
      color: 'green'
    },
    {
      key: 'umatik-center',
      name: 'Umatik Centered',
      description: 'Umatik template with centered logo and balanced layout',
      icon: CogIcon,
      color: 'purple'
    }
  ];

  // Build a simple preview ticket
  const previewHtml = useMemo(() => {
    const sampleTicket = {
      ticketNumber: 'T' + Date.now().toString().slice(-10),
      totalAmount: 100,
      createdAt: new Date().toISOString(),
      draw: { drawDate: new Date().toISOString().slice(0,10), drawTime: 'fivePM' },
      drawId: 1,
      bets: [
        { betType: 'Straight', betCombination: '215', betAmount: 50 },
        { betType: 'Rambolito', betCombination: '512', betAmount: 50 }
      ]
    };
    const sampleUser = { username: 'system-preview' };
    
    if (selectedTemplateKey === 'umatik') {
      const template = { design: { templateType: 'umatik', templateDesign: 3 } };
      return TicketGenerator.generateWithTemplate(sampleTicket, sampleUser, template);
    }
    if (selectedTemplateKey === 'umatik-center') {
      const template = { design: { templateType: 'umatik-center', templateDesign: 3 } };
      return TicketGenerator.generateWithTemplate(sampleTicket, sampleUser, template);
    }
    return TicketGenerator.generateTicketHTML(sampleTicket, sampleUser);
  }, [selectedTemplateKey]);

  if (!canManage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
        <div className="w-full max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <ModernCard className="text-center p-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <ExclamationTriangleIcon className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">Only SuperAdmin and Admin can manage system ticket templates.</p>
            <ModernButton
              onClick={() => window.history.back()}
              variant="primary"
              size="lg"
            >
              Go Back
            </ModernButton>
          </ModernCard>
        </div>
      </div>
    );
  }

  if (loading && !currentSystemTemplate) {
    return <LoadingSpinner message="Loading template settings..." />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-white">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <PageHeader
          title="System Ticket Template"
          subtitle="Choose the ticket template that will be used system-wide for all lottery tickets"
          icon={SwatchIcon}
        />

        {/* Current Active Template Status */}
        <ModernCard className="mb-8">
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 border-b border-green-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-6 w-6 mr-3 text-green-600" />
              <div>
                <h3 className="text-lg font-semibold text-green-800">Currently Active Template</h3>
                <p className="text-sm text-green-600 mt-1">This template is being used for all new tickets</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="mb-4 sm:mb-0">
                <div className="text-2xl font-bold text-green-600">
                  {templateOptions.find(t => t.key === currentSystemTemplate)?.name || 'Default'}
                </div>
                <div className="text-sm text-gray-500">System-wide template</div>
              </div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                Active
              </div>
            </div>
          </div>
        </ModernCard>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Template Selection */}
          <ModernCard>
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <SwatchIcon className="h-6 w-6 mr-3 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Choose Template</h3>
                  <p className="text-sm text-gray-600 mt-1">Select a template design for all tickets</p>
                </div>
              </div>
            </div>
            <div className="p-6">
            
              <form onSubmit={updateSystemTemplate} className="space-y-4">
                <div className="space-y-4">
                  {templateOptions.map((template) => {
                    const IconComponent = template.icon;
                    const isActive = currentSystemTemplate === template.key;
                    const isSelected = selectedTemplateKey === template.key;
                    
                    return (
                      <div
                        key={template.key}
                        className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                          isSelected 
                            ? 'border-blue-500 bg-blue-50 shadow-md' 
                            : 'border-gray-200 hover:border-gray-300'
                        } ${isActive ? 'ring-2 ring-green-500 ring-opacity-50' : ''}`}
                        onClick={() => setSelectedTemplateKey(template.key)}
                      >
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-lg ${
                            isSelected ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <IconComponent className={`h-6 w-6 ${
                              isSelected ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold text-gray-900">{template.name}</h4>
                              <div className="flex items-center space-x-2">
                                {isActive && (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircleIcon className="h-3 w-3 mr-1" />
                                    Active
                                  </span>
                                )}
                                <input
                                  type="radio"
                                  name="template"
                                  value={template.key}
                                  checked={isSelected}
                                  onChange={() => setSelectedTemplateKey(template.key)}
                                  className="text-blue-600 focus:ring-blue-500"
                                />
                              </div>
                            </div>
                            <p className="text-sm text-gray-600">{template.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-6">
                  <ModernButton
                    type="submit"
                    disabled={loading || selectedTemplateKey === currentSystemTemplate}
                    variant={selectedTemplateKey === currentSystemTemplate ? "secondary" : "primary"}
                    size="lg"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Updating...
                      </>
                    ) : selectedTemplateKey === currentSystemTemplate ? (
                      <>
                        <CheckCircleIcon className="h-5 w-5 mr-2" />
                        Template Already Active
                      </>
                    ) : (
                      <>
                        <SwatchIcon className="h-5 w-5 mr-2" />
                        Activate {templateOptions.find(t => t.key === selectedTemplateKey)?.name}
                      </>
                    )}
                  </ModernButton>
                  
                  {success && (
                    <ModernCard className="mt-4 border-l-4 border-green-500 bg-green-50">
                      <div className="p-4">
                        <div className="flex items-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
                          <span className="text-green-800 text-sm font-medium">{success}</span>
                        </div>
                      </div>
                    </ModernCard>
                  )}
                  
                  {error && (
                    <ModernCard className="mt-4 border-l-4 border-red-500 bg-red-50">
                      <div className="p-4">
                        <div className="flex items-center">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
                          <span className="text-red-800 text-sm font-medium">{error}</span>
                        </div>
                      </div>
                    </ModernCard>
                  )}
                </div>
              </form>
            </div>
          </ModernCard>

          {/* Live Preview */}
          <ModernCard>
            <div className="bg-gradient-to-r from-sky-50 to-blue-50 px-6 py-4 border-b border-gray-200">
              <div className="flex items-center">
                <EyeIcon className="h-6 w-6 mr-3 text-blue-600" />
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Live Preview</h3>
                  <p className="text-sm text-gray-600 mt-1">See how tickets will look with selected template</p>
                </div>
              </div>
            </div>
            <div className="p-6">
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
                <div className="overflow-auto max-h-96">
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                </div>
              </div>
              <div className="mt-4 text-center">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  <EyeIcon className="h-3 w-3 mr-1" />
                  Preview shows how tickets will look with the selected template
                </div>
              </div>
            </div>
          </ModernCard>
        </div>
      </div>
    </div>
  );
};

export default TemplateAssignment;


