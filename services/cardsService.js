import { supabase } from '../utils/supabase';

export const cardsService = {
  // Fetch all loyalty cards for the current user, sorted by last_used (most recent first)
  async getLoyaltyCards() {
    try {
      const { data, error } = await supabase
        .from('users_loyalty_cards')
        .select('*')
        .order('last_used', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Get loyalty cards error:', error);
      return { data: null, error };
    }
  },

  // Add a new loyalty card
  async addLoyaltyCard(cardData) {
    try {
      const { data, error } = await supabase
        .from('users_loyalty_cards')
        .insert([{
          name: cardData.name,
          number: cardData.number,
          bg_colour: cardData.bg_colour || null,
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Add loyalty card error:', error);
      return { data: null, error };
    }
  },

  // Update last_used timestamp when a card is used
  async updateCardLastUsed(cardId) {
    try {
      const { data, error } = await supabase
        .from('users_loyalty_cards')
        .update({ last_used: new Date().toISOString() })
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update card last used error:', error);
      return { data: null, error };
    }
  },

  // Delete a loyalty card
  async deleteLoyaltyCard(cardId) {
    try {
      const { error } = await supabase
        .from('users_loyalty_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Delete loyalty card error:', error);
      return { error };
    }
  },

  // Update loyalty card details
  async updateLoyaltyCard(cardId, updates) {
    try {
      const { data, error } = await supabase
        .from('users_loyalty_cards')
        .update(updates)
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Update loyalty card error:', error);
      return { data: null, error };
    }
  },
};