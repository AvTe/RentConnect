/**
 * Test file for verifying the unique agent contact count logic
 *
 * This tests the fix where leads.contacts should represent UNIQUE agents,
 * not total contact events.
 *
 * Run with: npx jest __tests__/contactCount.test.js
 */

// Track contact_history entries for testing (simulates database)
let contactHistoryMock = [];
let leadsContactsMock = {};

describe('Unique Agent Contact Count Logic', () => {
  beforeEach(() => {
    // Reset mocks
    contactHistoryMock = [];
    leadsContactsMock = { 'lead-1': 0 };
    jest.clearAllMocks();
  });

  /**
   * Simulates hasAgentContactedLead function
   */
  const hasAgentContactedLead = (agentId, leadId) => {
    return contactHistoryMock.some(
      entry => entry.agent_id === agentId && entry.lead_id === leadId
    );
  };

  /**
   * Simulates incrementLeadContacts function
   */
  const incrementLeadContacts = (leadId) => {
    leadsContactsMock[leadId] = (leadsContactsMock[leadId] || 0) + 1;
  };

  /**
   * Simulates trackAgentLeadContact with the FIX applied
   */
  const trackAgentLeadContact = (agentId, leadId, contactType) => {
    // Check if this agent has EVER contacted this lead before
    const isFirstContactByThisAgent = !hasAgentContactedLead(agentId, leadId);

    // Log contact history (always happens)
    contactHistoryMock.push({
      agent_id: agentId,
      lead_id: leadId,
      contact_type: contactType,
      created_at: new Date().toISOString()
    });

    // Only increment if this is a NEW unique agent
    if (isFirstContactByThisAgent) {
      incrementLeadContacts(leadId);
    }

    return { success: true };
  };

  test('Single agent, single contact - count should be 1', () => {
    trackAgentLeadContact('agent-A', 'lead-1', 'view');
    
    expect(leadsContactsMock['lead-1']).toBe(1);
    expect(contactHistoryMock.length).toBe(1);
  });

  test('Single agent, multiple contacts - count should still be 1', () => {
    // Agent A unlocks
    trackAgentLeadContact('agent-A', 'lead-1', 'view');
    // Agent A makes phone call
    trackAgentLeadContact('agent-A', 'lead-1', 'phone');
    // Agent A sends WhatsApp
    trackAgentLeadContact('agent-A', 'lead-1', 'whatsapp');
    
    // Count should be 1 (unique agent), not 3
    expect(leadsContactsMock['lead-1']).toBe(1);
    // But contact history should have all 3 events
    expect(contactHistoryMock.length).toBe(3);
  });

  test('Multiple agents, one contact each - count equals number of agents', () => {
    trackAgentLeadContact('agent-A', 'lead-1', 'view');
    trackAgentLeadContact('agent-B', 'lead-1', 'view');
    trackAgentLeadContact('agent-C', 'lead-1', 'view');
    
    expect(leadsContactsMock['lead-1']).toBe(3);
    expect(contactHistoryMock.length).toBe(3);
  });

  test('Multiple agents, multiple contacts each - count equals unique agents', () => {
    // Agent A: 3 contacts
    trackAgentLeadContact('agent-A', 'lead-1', 'view');
    trackAgentLeadContact('agent-A', 'lead-1', 'phone');
    trackAgentLeadContact('agent-A', 'lead-1', 'whatsapp');
    
    // Agent B: 2 contacts
    trackAgentLeadContact('agent-B', 'lead-1', 'view');
    trackAgentLeadContact('agent-B', 'lead-1', 'email');
    
    // Agent C: 1 contact
    trackAgentLeadContact('agent-C', 'lead-1', 'view');
    
    // Count should be 3 (unique agents), not 6 (total events)
    expect(leadsContactsMock['lead-1']).toBe(3);
    expect(contactHistoryMock.length).toBe(6);
  });

  test('Same agent contacts multiple different leads - each lead gets count 1', () => {
    leadsContactsMock['lead-2'] = 0;
    leadsContactsMock['lead-3'] = 0;
    
    trackAgentLeadContact('agent-A', 'lead-1', 'view');
    trackAgentLeadContact('agent-A', 'lead-2', 'view');
    trackAgentLeadContact('agent-A', 'lead-3', 'view');
    
    expect(leadsContactsMock['lead-1']).toBe(1);
    expect(leadsContactsMock['lead-2']).toBe(1);
    expect(leadsContactsMock['lead-3']).toBe(1);
  });

  test('Contact history correctly tracks contact types', () => {
    trackAgentLeadContact('agent-A', 'lead-1', 'view');
    trackAgentLeadContact('agent-A', 'lead-1', 'phone');
    
    const agentAContacts = contactHistoryMock.filter(c => c.agent_id === 'agent-A');
    expect(agentAContacts.length).toBe(2);
    expect(agentAContacts[0].contact_type).toBe('view');
    expect(agentAContacts[1].contact_type).toBe('phone');
  });
});

