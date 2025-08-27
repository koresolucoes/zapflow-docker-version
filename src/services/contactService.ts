import { apiGet, apiPost, apiPut, apiDelete } from '../lib/apiClient.js';
import { Contact, EditableContact, ContactWithDetails, Deal, MetaConfig, MessageInsert, TimelineEvent } from '../types/index.js';
import { TablesInsert, TablesUpdate } from '@/src/types/database.types.js';
import { sendTextMessage } from './meta/messages.js';

export const normalizePhoneNumber = (phone: string): string => {
    if (!phone) return '';
    let digits = phone.replace(/\D/g, '');
    if (digits.length === 10) {
        const ddd = digits.substring(0, 2);
        const number = digits.substring(2);
        return `55${ddd}9${number}`;
    }
    if (digits.length === 11) {
        return `55${digits}`;
    }
    if (digits.startsWith('55')) {
        if (digits.length === 12) {
            const ddd = digits.substring(2, 4);
            const number = digits.substring(4);
            return `55${ddd}9${number}`;
        }
    }
    return digits;
};

export const fetchContacts = async (): Promise<Contact[]> => {
    return await apiGet<Contact[]>('/contacts');
};

export const fetchContactDetailsFromDb = async (contactId: string): Promise<ContactWithDetails> => {
    const contactData = await apiGet<Contact>(`/contacts/${contactId}`);
    // TODO: Fetch deals for the contact from a new API endpoint `/api/deals?contact_id=`
    const dealsData: Deal[] = [];
    
    return {
        ...contactData,
        deals: dealsData,
    };
};

export const fetchContactTimeline = async (teamId: string, contactId: string): Promise<TimelineEvent[]> => {
    // TODO: This function needs to be refactored. It requires new backend endpoints
    // to aggregate messages, automation runs, and deals for a contact.
    console.warn("fetchContactTimeline is not implemented yet.");
    return [];
};

export const addContactToDb = async (contact: EditableContact): Promise<Contact> => {
    const payload = { ...contact, phone: normalizePhoneNumber(contact.phone) };
    return await apiPost<Contact>('/contacts', payload);
};

export const updateContactInDb = async (updatedContact: Contact): Promise<Contact> => {
    const tags = Array.isArray(updatedContact.tags) ? updatedContact.tags : [];
    const customFields = updatedContact.custom_fields && typeof updatedContact.custom_fields === 'object' 
        ? updatedContact.custom_fields 
        : {};

    const updatePayload = {
        name: updatedContact.name,
        phone: normalizePhoneNumber(updatedContact.phone),
        email: updatedContact.email,
        company: updatedContact.company,
        tags: tags,
        custom_fields: customFields,
    };

    return await apiPut<Contact>(`/contacts/${updatedContact.id}`, updatePayload);
};

export const deleteContactFromDb = async (contactId: string): Promise<void> => {
    await apiDelete(`/contacts/${contactId}`);
};

export const importContactsToDb = async (teamId: string, newContacts: EditableContact[], existingPhones: Set<string>): Promise<{ imported: Contact[]; skippedCount: number }> => {
    // TODO: This function needs to be refactored. It requires a new backend endpoint
    // for bulk contact import with duplicate checking.
    console.warn("importContactsToDb is not implemented yet.");
    return { imported: [], skippedCount: newContacts.length };
};

export const sendDirectMessagesFromApi = async (metaConfig: MetaConfig, teamId: string, message: string, recipients: Contact[]): Promise<void> => {
    // TODO: This function needs to be refactored. The message sending logic should
    // probably move to the backend entirely. The frontend would just make a single API call.
    console.warn("sendDirectMessagesFromApi is not implemented yet.");
};