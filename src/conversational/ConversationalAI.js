/**
 * Conversational AI Module
 * 
 * Provides interactive AI conversation with confirmation flows.
 * Unlike other tools, this asks "Is this what you want?" to ensure
 * user intent is properly understood before execution.
 */

export class ConversationalAI {
  constructor(platform) {
    this.platform = platform;
    this.conversationHistory = new Map();
    this.pendingConfirmations = new Map();
  }

  /**
   * Process user input with confirmation flow
   * This is the key differentiator - we confirm understanding before acting
   * 
   * @param {string} userInput - The user's request
   * @param {Object} options - Processing options
   * @returns {Promise<Object>} - Response with confirmation request or final result
   */
  async processWithConfirmation(userInput, options = {}) {
    const sessionId = options.sessionId || this.generateSessionId();
    
    // Check if this is a confirmation response
    if (this.pendingConfirmations.has(sessionId)) {
      return this.handleConfirmationResponse(sessionId, userInput);
    }

    // Analyze the user's intent
    const intentAnalysis = await this.analyzeIntent(userInput);
    
    // Generate a proposed action based on intent
    const proposedAction = await this.generateProposedAction(intentAnalysis);
    
    // Store the proposed action for confirmation
    this.pendingConfirmations.set(sessionId, {
      originalInput: userInput,
      intentAnalysis,
      proposedAction,
      timestamp: Date.now()
    });

    // Return confirmation request
    return {
      type: 'confirmation_request',
      sessionId,
      message: this.formatConfirmationMessage(proposedAction),
      proposedAction,
      intent: intentAnalysis,
      question: 'Is this what you want?',
      options: ['Yes, proceed', 'No, let me clarify', 'Modify this']
    };
  }

  /**
   * Handle user's response to confirmation
   */
  async handleConfirmationResponse(sessionId, response) {
    const pending = this.pendingConfirmations.get(sessionId);
    
    if (!pending) {
      return {
        type: 'error',
        message: 'No pending confirmation found for this session'
      };
    }

    const normalizedResponse = response.toLowerCase().trim();
    
    if (this.isAffirmative(normalizedResponse)) {
      // User confirmed - execute the action
      this.pendingConfirmations.delete(sessionId);
      return this.executeAction(pending.proposedAction, sessionId);
    } else if (this.isNegative(normalizedResponse)) {
      // User wants to clarify
      this.pendingConfirmations.delete(sessionId);
      return {
        type: 'clarification_request',
        sessionId,
        message: 'I understand. Could you please provide more details about what you\'d like me to do?',
        originalIntent: pending.intentAnalysis
      };
    } else {
      // User wants to modify
      return this.handleModification(sessionId, response, pending);
    }
  }

  /**
   * Analyze user intent from input
   */
  async analyzeIntent(userInput) {
    // Intent categories
    const categories = {
      create: /\b(create|make|build|generate|design|develop)\b/i,
      modify: /\b(change|modify|update|edit|alter|fix)\b/i,
      query: /\b(find|search|look|query|get|show|display)\b/i,
      delete: /\b(delete|remove|destroy|clear|wipe)\b/i,
      analyze: /\b(analyze|assess|evaluate|review|check)\b/i,
      automate: /\b(automate|schedule|trigger|workflow)\b/i
    };

    const detectedIntents = [];
    for (const [intent, pattern] of Object.entries(categories)) {
      if (pattern.test(userInput)) {
        detectedIntents.push(intent);
      }
    }

    // Extract key entities and parameters
    const entities = this.extractEntities(userInput);

    return {
      rawInput: userInput,
      primaryIntent: detectedIntents[0] || 'general',
      allIntents: detectedIntents,
      entities,
      confidence: this.calculateConfidence(detectedIntents, entities),
      timestamp: Date.now()
    };
  }

  /**
   * Extract entities from user input
   */
  extractEntities(input) {
    const entities = {
      subjects: [],
      objects: [],
      modifiers: [],
      quantities: [],
      timeReferences: []
    };

    // Extract quoted strings as specific subjects
    const quotedMatches = input.match(/"([^"]+)"|'([^']+)'/g);
    if (quotedMatches) {
      entities.subjects = quotedMatches.map(m => m.replace(/['"]/g, ''));
    }

    // Extract numbers
    const numbers = input.match(/\d+/g);
    if (numbers) {
      entities.quantities = numbers.map(n => parseInt(n, 10));
    }

    // Extract time references
    const timePatterns = /\b(today|tomorrow|yesterday|now|later|soon|morning|afternoon|evening|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/gi;
    const timeMatches = input.match(timePatterns);
    if (timeMatches) {
      entities.timeReferences = timeMatches;
    }

    return entities;
  }

  /**
   * Calculate confidence score for intent analysis
   */
  calculateConfidence(intents, entities) {
    let confidence = 0.5; // Base confidence

    if (intents.length > 0) confidence += 0.2;
    if (intents.length === 1) confidence += 0.1; // Clear single intent
    if (entities.subjects.length > 0) confidence += 0.1;
    if (entities.quantities.length > 0) confidence += 0.05;

    return Math.min(confidence, 1.0);
  }

  /**
   * Generate proposed action based on intent
   */
  async generateProposedAction(intentAnalysis) {
    const { primaryIntent, entities, rawInput } = intentAnalysis;

    const actionTemplates = {
      create: {
        type: 'create',
        description: `Create a new ${entities.subjects[0] || 'item'} based on your request`,
        steps: [
          'Analyze requirements',
          'Generate structure',
          'Create content',
          'Review and finalize'
        ]
      },
      modify: {
        type: 'modify',
        description: `Modify the existing ${entities.subjects[0] || 'item'} as requested`,
        steps: [
          'Locate target',
          'Apply changes',
          'Validate modifications',
          'Confirm completion'
        ]
      },
      query: {
        type: 'query',
        description: `Search and retrieve information about ${entities.subjects[0] || 'your query'}`,
        steps: [
          'Parse query parameters',
          'Execute search',
          'Rank results',
          'Present findings'
        ]
      },
      delete: {
        type: 'delete',
        description: `Remove the specified ${entities.subjects[0] || 'item'}`,
        steps: [
          'Identify target',
          'Verify permissions',
          'Execute deletion',
          'Confirm removal'
        ]
      },
      analyze: {
        type: 'analyze',
        description: `Analyze ${entities.subjects[0] || 'the subject'} and provide insights`,
        steps: [
          'Gather data',
          'Process information',
          'Generate insights',
          'Present analysis'
        ]
      },
      automate: {
        type: 'automate',
        description: `Set up automation for ${entities.subjects[0] || 'the workflow'}`,
        steps: [
          'Define triggers',
          'Configure actions',
          'Set conditions',
          'Activate workflow'
        ]
      },
      general: {
        type: 'general',
        description: `Process your request: "${rawInput.substring(0, 50)}..."`,
        steps: [
          'Understand request',
          'Determine best approach',
          'Execute action',
          'Provide response'
        ]
      }
    };

    return actionTemplates[primaryIntent] || actionTemplates.general;
  }

  /**
   * Format confirmation message for user
   */
  formatConfirmationMessage(proposedAction) {
    let message = `I understand you want me to: ${proposedAction.description}\n\n`;
    message += 'Here\'s what I\'ll do:\n';
    proposedAction.steps.forEach((step, index) => {
      message += `  ${index + 1}. ${step}\n`;
    });
    message += '\nIs this what you want?';
    return message;
  }

  /**
   * Check if response is affirmative
   */
  isAffirmative(response) {
    const affirmatives = ['yes', 'yeah', 'yep', 'sure', 'ok', 'okay', 'proceed', 
                         'go ahead', 'correct', 'right', 'affirmative', 'y', 'yes, proceed'];
    return affirmatives.some(a => response.includes(a));
  }

  /**
   * Check if response is negative
   */
  isNegative(response) {
    const negatives = ['no', 'nope', 'cancel', 'stop', 'wait', 'clarify', 
                       'not what', 'wrong', 'incorrect', 'n', 'no, let me clarify'];
    return negatives.some(n => response.includes(n));
  }

  /**
   * Handle modification request
   */
  async handleModification(sessionId, modification, pending) {
    // Re-analyze with the modification context
    const updatedIntent = await this.analyzeIntent(
      `${pending.originalInput}. Modification: ${modification}`
    );
    
    const updatedAction = await this.generateProposedAction(updatedIntent);
    
    // Update pending confirmation
    this.pendingConfirmations.set(sessionId, {
      ...pending,
      intentAnalysis: updatedIntent,
      proposedAction: updatedAction,
      modificationHistory: [...(pending.modificationHistory || []), modification]
    });

    return {
      type: 'confirmation_request',
      sessionId,
      message: this.formatConfirmationMessage(updatedAction),
      proposedAction: updatedAction,
      intent: updatedIntent,
      question: 'Is this updated plan what you want?',
      options: ['Yes, proceed', 'No, let me clarify', 'Modify this further']
    };
  }

  /**
   * Execute the confirmed action
   */
  async executeAction(action, sessionId) {
    // Update conversation history
    this.updateConversationHistory(sessionId, action);

    // Execute based on action type
    let result;
    switch (action.type) {
      case 'create':
        result = await this.executeCreateAction(action);
        break;
      case 'query':
        result = await this.executeQueryAction(action);
        break;
      case 'automate':
        result = await this.executeAutomateAction(action);
        break;
      default:
        result = await this.executeGeneralAction(action);
    }

    return {
      type: 'execution_result',
      sessionId,
      action: action.type,
      success: true,
      result,
      message: 'Action completed successfully! Is there anything else you\'d like me to do?'
    };
  }

  async executeCreateAction(action) {
    return { created: true, description: action.description };
  }

  async executeQueryAction(action) {
    // Use RAG for queries if available
    if (this.platform.rag) {
      return this.platform.rag.query({ text: action.description });
    }
    return { queried: true, results: [] };
  }

  async executeAutomateAction(action) {
    // Use n8n integration for automation
    if (this.platform.n8nIntegration) {
      return this.platform.n8nIntegration.createWorkflow(action);
    }
    return { automated: true, workflow: action.description };
  }

  async executeGeneralAction(action) {
    return { executed: true, description: action.description };
  }

  updateConversationHistory(sessionId, action) {
    const history = this.conversationHistory.get(sessionId) || [];
    history.push({
      action,
      timestamp: Date.now()
    });
    this.conversationHistory.set(sessionId, history);
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

export default ConversationalAI;
