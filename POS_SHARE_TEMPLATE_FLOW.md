# POS Share Template Flow Documentation

## 🎯 How POS Share Gets Its Ticket Template

The POS Share feature follows a specific flow to retrieve and use ticket templates. Here's the complete process:

## 📋 Template Retrieval Flow

### 1. **User Initiates POS Share**
```javascript
// In BettingInterface.js - handleMobilePOSShare function
const handleMobilePOSShare = async (ticket) => {
  try {
    // Get user's assigned template
    const template = await getUserTemplate(user.id);
    
    const result = await MobilePOSUtils.shareMobilePOSTicket(ticket, user, template);
    // ... rest of the function
  } catch (error) {
    // Error handling
  }
};
```

### 2. **Get User's Assigned Template**
```javascript
// In BettingInterface.js - getUserTemplate function
const getUserTemplate = async (userId) => {
  try {
    const response = await api.get(`/ticket-templates/user-assignment/${userId}`);
    return response.data.data?.template || null;
  } catch (error) {
    console.error('Error getting user template:', error);
    return null;
  }
};
```

### 3. **Backend API Endpoint**
```javascript
// In routes/ticket-templates.js - GET /api/ticket-templates/user-assignment/:userId
router.get('/user-assignment/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Get template assignment for user
    const assignment = await prisma.agentTicketTemplate.findFirst({
      where: { agentId: parseInt(userId) },
      include: {
        template: true
      }
    });

    if (!assignment) {
      return res.json({
        success: true,
        data: { template: null }
      });
    }

    res.json({
      success: true,
      data: {
        template: assignment.template,
        assignment: {
          id: assignment.id,
          assignedAt: assignment.createdAt
        }
      }
    });
  } catch (error) {
    // Error handling
  }
});
```

## 🗄️ Database Structure

### **AgentTicketTemplate Table**
```sql
model AgentTicketTemplate {
  id         Int            @id @default(autoincrement())
  agentId    Int            @map("agent_id")
  templateId Int            @map("template_id")
  assignedAt DateTime       @default(now()) @map("assigned_at")
  agent      User           @relation(fields: [agentId], references: [id])
  template   TicketTemplate @relation(fields: [templateId], references: [id])

  @@unique([agentId, templateId])
  @@map("agent_ticket_templates")
}
```

### **TicketTemplate Table**
```sql
model TicketTemplate {
  id             Int                   @id @default(autoincrement())
  name           String                @unique
  design         Json                  -- Contains template design data
  isActive       Boolean               @default(true) @map("is_active")
  createdById    Int?                  @map("created_by")
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt
  assignedAgents AgentTicketTemplate[]
  createdBy      User?                 @relation(fields: [createdById], references: [id])

  @@map("ticket_templates")
}
```

## 🎨 Template Processing Flow

### 1. **Template Validation**
```javascript
// In MobilePOSUtils.js - generateMobilePOSTicket function
static async generateMobilePOSTicket(ticket, user, template = null) {
  try {
    // If template is provided, use template renderer
    if (template && template.design) {
      return await this.generateTemplateMobileTicket(ticket, user, template);
    }
    
    // Generate optimized mobile ticket (fallback)
    return await this.generateOptimizedMobileTicket(ticket, user);
  } catch (error) {
    console.error('Error generating mobile POS ticket:', error);
    throw error;
  }
}
```

### 2. **Template-Based Generation**
```javascript
// In MobilePOSUtils.js - generateTemplateMobileTicket function
static async generateTemplateMobileTicket(ticket, user, template) {
  try {
    // Use html2canvas for high-quality rendering
    const html2canvas = (await import('html2canvas')).default;
    
    // Generate HTML from template via backend
    const response = await fetch('/api/ticket-templates/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        ticketId: ticket.id,
        templateId: template.id
      })
    });
    
    const data = await response.json();
    container.innerHTML = data.data.html;
    
    // Generate high-quality canvas for mobile POS
    const canvas = await html2canvas(ticketElement, {
      scale: 4, // 4x resolution for crisp mobile POS printing
      useCORS: true,
      allowTaint: true,
      backgroundColor: template.design?.backgroundColor || '#ffffff',
      width: template.design?.canvasSize?.width || 220,
      height: template.design?.canvasSize?.height || 340,
      // Mobile POS specific options
    });
    
    return canvas.toBlob('image/png', 1.0);
  } catch (error) {
    console.error('Error generating template mobile ticket:', error);
    throw error;
  }
}
```

## 🔄 Fallback Mechanism

### **If No Template Assigned**
1. **User has no assigned template**: `getUserTemplate()` returns `null`
2. **Fallback to default**: Uses `generateOptimizedMobileTicket()` instead
3. **Default mobile POS format**: Generates a standard mobile POS ticket layout

### **If Template Generation Fails**
1. **Backend template generation fails**: Falls back to default template
2. **Canvas generation fails**: Uses basic HTML rendering
3. **Complete failure**: Returns error message to user

## 📱 Template Types Supported

### **Mobile POS Templates**
- **Template Type**: `mobile-pos`
- **Canvas Size**: 220x340 pixels (58mm width optimized)
- **Features**: 
  - Enhanced styling for POS systems
  - QR code integration
  - Agent information
  - Dynamic height adjustment

### **Standard Mobile Templates**
- **Template Type**: `mobile`
- **Canvas Size**: 220x340 pixels
- **Features**: Basic mobile ticket layout

### **Standard Templates**
- **Template Type**: `standard`
- **Canvas Size**: 400x600 pixels
- **Features**: Full-size ticket layout

## 🎯 Key Points

1. **Template Assignment**: Users must have templates assigned via the admin interface
2. **Priority Order**: Assigned template → Default template → Fallback generation
3. **Backend Generation**: Templates are processed server-side for consistency
4. **High Quality**: 4x resolution for crisp mobile POS printing
5. **Error Handling**: Multiple fallback levels ensure functionality

## 🔧 Admin Configuration

### **Assigning Templates to Users**
1. Go to **Ticket Templates** page
2. Click **"Manage Assignments"** button
3. Select a template
4. Assign to specific agents/users
5. Users will automatically use their assigned template for POS Share

### **Creating Mobile POS Templates**
1. Use **"Mobile POS Template"** button in Ticket Templates
2. Design template with mobile POS optimizations
3. Set template type to `mobile-pos`
4. Assign to users who need POS functionality
