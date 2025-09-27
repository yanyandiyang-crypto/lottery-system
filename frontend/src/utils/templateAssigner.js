import api from './api';
import TicketGenerator from './ticketGenerator';
import { generateUmatikTicketHTML } from './templates/umatikTemplate';
import { generateUmatikCenterTicketHTML } from './templates/umatikCenterTemplate';

class TemplateAssigner {
  /**
   * Fetch the system-wide active template (no longer per-user)
   */
  static async fetchSystemTemplate() {
    try {
      // Get all templates and find the active one
      const response = await api.get('/ticket-templates');
      const templates = response?.data?.data || [];
      
      // Find the currently active template
      const activeTemplate = templates.find(template => template.isActive);
      
      if (activeTemplate) {
        console.log('✅ Using system-wide active template:', activeTemplate.name);
        return activeTemplate;
      } else {
        console.warn('⚠️ No active template found, using default');
        return null;
      }
    } catch (error) {
      console.warn('Failed to fetch system template:', error);
      return null;
    }
  }

  /**
   * @deprecated Use fetchSystemTemplate() instead
   * Fetch the assigned template for a user (legacy method)
   */
  static async fetchAssignedTemplate(userId) {
    console.warn('fetchAssignedTemplate is deprecated, using system-wide template instead');
    return this.fetchSystemTemplate();
  }

  /**
   * Get the appropriate template renderer based on template type
   * All templates are now 58mm thermal printer optimized
   */
  static getTemplateRenderer(template) {
    if (!template) {
      return TicketGenerator.generateTicketHTML;
    }

    // Check template design/type
    const templateDesign = template?.design?.templateDesign;
    const templateType = template?.design?.templateType;

    // Centered-logo variant should take precedence over generic umatik
    if (templateType === 'umatik-center' || templateDesign === 33) {
      return generateUmatikCenterTicketHTML;
    }

    if (templateDesign === 3 || templateType === 'umatik') {
      return generateUmatikTicketHTML;
    }

    return TicketGenerator.generateTicketHTML;
  }
}

/**
 * Generate ticket HTML using the assigned template
 */
export function generateTicketHTMLWithAssignedTemplate(ticket, user, template, assets = {}) {
  const renderer = TemplateAssigner.getTemplateRenderer(template);
  return renderer(ticket, user, assets);
}

export default TemplateAssigner;
