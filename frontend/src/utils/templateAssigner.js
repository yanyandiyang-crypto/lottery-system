import api from './api';
import TicketGenerator from './ticketGenerator';
import { generateUmatikTicketHTML } from './templates/umatikTemplate';
import { generateUmatikCenterTicketHTML } from './templates/umatikCenterTemplate';

class TemplateAssigner {
  /**
   * Fetch the assigned template for a user
   */
  static async fetchAssignedTemplate(userId) {
    try {
      const response = await api.get(`/ticket-templates/user-assignment/${userId}`);
      // Return just the template object, not the entire response data
      return response?.data?.data?.template || null;
    } catch (error) {
      console.warn('Failed to fetch assigned template:', error);
      return null;
    }
  }

  /**
   * Get the appropriate template renderer based on template type
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
